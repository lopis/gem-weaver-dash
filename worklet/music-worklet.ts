/// <reference lib="webworker" />
/// <reference lib="dom" />

declare const sampleRate: number;

const BPM = 240;
const PPQ = 4;
const TAU = Math.PI * 2;
const PIANO_VIBRATO_RATE = 0.008;
const PIANO_VIBRATO_DEPTH = 0.04;
const PIANO_ATTACK_PER_SAMPLE = 0.002;
const PIANO_DECAY_PER_SAMPLE = 0.00005;
const PIANO_RELEASE_TAIL_BEATS = 2.6;
const PIANO_RELEASE_PER_SAMPLE = 0.00025;
const BEAT_DELAY = 64;
const BEAT_GAP = 1;

// Compact track format: deltaTicks.midi.durationTicks in base36.
const MELODY_TRACK = "0.1o.1s,1.1r.1r,1.1v.1q,1.1y.1p,1p.1m.1s,1.1q.1r,1.1t.1q,1.1x.1p,1p.1p.1s,1.1s.1r,1.1u.1q,1.1x.1p,1p.1j.1s,1.1m.1r,1.1r.1q,1.1v.l,l.1x.o,o.1y.g";
const BEAT_TRACK = "0.1i.4,0.15.4,8.1i.4,8.1i.4,0.17.4,8.1i.4,8.1i.4,4.14.4,4.1i.4,8.1i.4,0.17.4,8.1i.4";

type DecodedTrack = {
  notes: number[];
  lengthBeats: number;
};

function decodeTrack(track: string, convertPitch: (pitch: number) => number): DecodedTrack {
  const notes: number[] = [];
  let lengthBeats = 0;
  let absoluteTicks = 0;
  const entries = track.split(',');

  for (let i = 0; i < entries.length; i++) {
    const token = entries[i].trim();
    if (!token) {
      continue;
    }

    const parts = token.split('.');
    if (parts.length < 3) {
      continue;
    }

    const deltaTicks = parseInt(parts[0], 36);
    const pitchValue = parseInt(parts[1], 36);
    const durationTicks = parseInt(parts[2], 36);
    if (!Number.isFinite(deltaTicks) || !Number.isFinite(pitchValue) || !Number.isFinite(durationTicks)) {
      continue;
    }

    absoluteTicks += deltaTicks;
    const start = absoluteTicks / PPQ;
    const end = (absoluteTicks + durationTicks) / PPQ;
    notes.push(start, end, convertPitch(pitchValue));
    if (end > lengthBeats) {
      lengthBeats = end;
    }
  }

  return { notes, lengthBeats };
}

function midiToFrequency(midi: number) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function midiToBeatClass(midi: number) {
  const octave = ((midi / 12) | 0) - 1;
  return octave <= 2 ? 1 : 0;
}

type WorkletPortMessage = number;

class MpProcessor extends AudioWorkletProcessor {
  play = true;
  paused = false;
  pausing = false;
  masterGain = 0;
  targetGain = 1;
  gainSlew = 0.002;

  lp = 0;
  lpAlpha = 0.002;
  crack = 0;
  crackDecay = 0.9;

  baseNoiseGain = 0.42;
  crackGain = 0.26;

  delay = new Float32Array((sampleRate * 0.32) | 0);
  delayPos = 0;
  delayMix = 0.18;
  delayFeedback = 0.35;

  beatIncrement = BPM / (60 * sampleRate);
  beatClock = 0;
  melodyGain = 0.22;
  drumGain = 0.36;
  inputGain = 1;
  sampleClock = 0;

  melodyNotes: number[] = [];
  melodyLengthBeats = 0;
  beatHits: number[] = [];
  beatLengthBeats = 0;

  drumLowState = 0;
  drumHighState = 0;

  constructor() {
    super();
    const melody = decodeTrack(MELODY_TRACK, midiToFrequency);
    const beat = decodeTrack(BEAT_TRACK, midiToBeatClass);
    this.melodyNotes = melody.notes;
    this.melodyLengthBeats = melody.lengthBeats;
    this.beatHits = beat.notes;
    this.beatLengthBeats = beat.lengthBeats;

    this.port.onmessage = (event: MessageEvent<WorkletPortMessage>) => {
      const eventID = event.data;
      switch (eventID) {
        case 0:
          this.play = true;
          this.paused = false;
          this.pausing = false;
          this.targetGain = 1;
          break;
        case 1:
          this.pausing = true;
          this.targetGain = 0;
          break;
        case 2:
          this.play = true;
          this.paused = false;
          this.pausing = false;
          this.targetGain = 1;
          break;
        default:
          break;
      }
    };
  }

  readInputSample(sampleIndex: number, inputs: Float32Array[][]) {
    let sum = 0;
    for (let i = 0; i < inputs.length; i++) {
      const channel = inputs[i]?.[0];
      if (channel) {
        sum += channel[sampleIndex] || 0;
      }
    }
    return sum * this.inputGain;
  }

  generateMelodySample(songTimeSec: number, beat: number) {
    if (!this.melodyNotes.length || this.melodyLengthBeats <= 0) {
      return 0;
    }

    let sample = 0;
    const melodyBeat = beat % this.melodyLengthBeats;
    for (let i = 0; i < this.melodyNotes.length; i += 3) {
      const start = this.melodyNotes[i];
      const end = this.melodyNotes[i + 1];
      if (melodyBeat < start || melodyBeat >= end + PIANO_RELEASE_TAIL_BEATS) {
        continue;
      }

      const noteAgeBeats = melodyBeat - start;
      const noteAgeSamples = noteAgeBeats / this.beatIncrement;
      const vibrato = Math.sin(noteAgeSamples * PIANO_VIBRATO_RATE) * PIANO_VIBRATO_DEPTH;
      const attack = Math.min(1, noteAgeSamples * PIANO_ATTACK_PER_SAMPLE);
      const decay = Math.exp(-noteAgeSamples * PIANO_DECAY_PER_SAMPLE);
      let release = 1;
      if (melodyBeat > end) {
        const releaseSamples = (melodyBeat - end) / this.beatIncrement;
        release = Math.exp(-releaseSamples * PIANO_RELEASE_PER_SAMPLE);
      }
      const env = attack * decay * release;
      sample += Math.sin(songTimeSec * this.melodyNotes[i + 2] * TAU + vibrato) * env;
    }

    return sample * this.melodyGain;
  }

  generateBeatSample(beat: number) {
    if (!this.beatHits.length || this.beatLengthBeats <= 0 || beat < BEAT_DELAY) {
      return 0;
    }

    const loopLength = this.beatLengthBeats + BEAT_GAP;
    const loopPhase = (beat - BEAT_DELAY) % loopLength;
    if (loopPhase >= this.beatLengthBeats) {
      return 0;
    }

    const noise = Math.random() * 2 - 1;
    let sample = 0;
    for (let i = 0; i < this.beatHits.length; i += 3) {
      const start = this.beatHits[i];
      const end = this.beatHits[i + 1];
      if (loopPhase < start || loopPhase >= end) {
        continue;
      }

      const isLow = this.beatHits[i + 2] > 0.5;
      const age = loopPhase - start;
      const env = Math.exp(-age * (isLow ? 14 : 20));

      if (isLow) {
        this.drumLowState += (noise - this.drumLowState) * 0.085;
        sample += this.drumLowState * env;
      } else {
        this.drumHighState += (noise - this.drumHighState) * 0.58;
        sample += (noise - this.drumHighState) * env * 0.75;
      }
    }

    return sample * this.drumGain;
  }

  generateNoiseSample() {
    const n = Math.random() * 2 - 1;
    this.lp += (n - this.lp) * this.lpAlpha;

    if (Math.random() < 0.00035) {
      this.crack = (Math.random() * 2 - 1) * (0.2 + Math.random() * Math.random() * 1.1);
    }
    this.crack *= this.crackDecay;

    const baseNoise = this.lp * 0.22 + n * 0.008;
    const sourceSample = baseNoise * this.baseNoiseGain + this.crack * this.crackGain;

    const echo = this.delay[this.delayPos];
    this.delay[this.delayPos] = sourceSample + echo * this.delayFeedback;
    this.delayPos = (this.delayPos + 1) % this.delay.length;

    return sourceSample + echo * this.delayMix;
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], _parameters: Map<string, Float32Array>) {
    const outputBuffer = outputs[0]?.[0];
    if (!outputBuffer) {
      return true;
    }

    if (!this.play && this.masterGain < 0.0005) {
      outputBuffer.fill(0);
      return true;
    }

    for (let i = 0; i < outputBuffer.length; i++) {
      this.masterGain += (this.targetGain - this.masterGain) * this.gainSlew;
      const songTimeSec = this.sampleClock / sampleRate;
      const beat = this.beatClock;

      const mixed =
        this.readInputSample(i, inputs) +
        this.generateMelodySample(songTimeSec, beat) +
        this.generateBeatSample(beat) +
        this.generateNoiseSample();

      outputBuffer[i] = Math.max(-1, Math.min(1, mixed * this.masterGain));
      this.sampleClock++;
      this.beatClock += this.beatIncrement;

      if (this.pausing && this.masterGain < 0.0005) {
        this.paused = true;
        this.pausing = false;
        this.play = false;
        this.delay.fill(0);
        outputBuffer.fill(0, i + 1);
        break;
      }
    }

    return true;
  }
}

registerProcessor('mp', MpProcessor);
