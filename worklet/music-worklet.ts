/// <reference lib="webworker" />
/// <reference lib="dom" />

declare const sampleRate: number;
const BPM = 240;
const MELODY_ATTACK_BEATS = 0.01;
const MELODY_DECAY_PER_BEAT = 0.42;
const MELODY_RELEASE_TAIL_BEATS = 2.6;
const MELODY_RELEASE_PER_BEAT = 1.35;

// each note is [time node duration instrument]
const melody1 = "0 C4 16;0.25 D#4 15.75;0.5 G4 15.5;0.75 A#4 15.25;16 A#3 16;16.25 D4 15.75;16.5 F4 15.5;16.75 A4 15.25;32 C#4 16;32.25 E4 15.75;32.5 F#4 15.5;32.75 A4 15.25;48 G3 16;48.25 A#3 15.75;48.5 D#4 15.5;48.75 G4 5.25;54 A4 6;60 A#4 4;"
const beat = "0 F#3 1;0 F2 1;2 F#3 1;4 F#3 1;4 G2 1;6 F#3 1;8 F#3 1;9 E2 1;10 F#3 1;12 F#3 1;12 G2 1;14 F#3 1;";
const beatDelay = 64;
const beatGap = 1;

type SignalSource = (sampleIndex: number, inputs: Float32Array[][]) => number;

type MelodyNote = {
  start: number;
  end: number;
  freq: number;
};

type BeatHit = {
  start: number;
  end: number;
  low: boolean;
};

const NOTE_OFFSETS: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

function noteToFrequency(noteName: string) {
  const match = noteName.match(/^([A-G])(#?)(-?\d)$/);
  if (!match) {
    return null;
  }
  const letter = match[1];
  const accidental = match[2] ? 1 : 0;
  const octave = Number(match[3]);
  const midiNote = (octave + 1) * 12 + NOTE_OFFSETS[letter] + accidental;
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

function parseMelody(melodyData: string) {
  const notes: MelodyNote[] = [];
  let melodyLength = 0;
  const entries = melodyData.split(';');
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i].trim();
    if (!entry) {
      continue;
    }
    const parts = entry.split(/\s+/);
    if (parts.length < 3) {
      continue;
    }
    const start = Number(parts[0]);
    const freq = noteToFrequency(parts[1]);
    const duration = Number(parts[2]);
    if (Number.isNaN(start) || Number.isNaN(duration) || !freq) {
      continue;
    }
    const end = start + duration;
    notes.push({ start, end, freq });
    if (end > melodyLength) {
      melodyLength = end;
    }
  }
  return { notes, melodyLength };
}

function parseBeat(beatData: string) {
  const hits: BeatHit[] = [];
  let beatLength = 0;
  const entries = beatData.split(';');
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i].trim();
    if (!entry) {
      continue;
    }

    const parts = entry.split(/\s+/);
    if (parts.length < 3) {
      continue;
    }

    const start = Number(parts[0]);
    const noteName = parts[1];
    const duration = Number(parts[2]);
    if (Number.isNaN(start) || Number.isNaN(duration)) {
      continue;
    }

    const octaveMatch = noteName.match(/(-?\d)$/);
    const octave = octaveMatch ? Number(octaveMatch[1]) : 3;
    const end = start + duration;
    hits.push({ start, end, low: octave <= 2 });
    if (end > beatLength) {
      beatLength = end;
    }
  }

  return { hits, beatLength };
}

type WorkletPortMessage = number;

class MusicProcessor extends AudioWorkletProcessor {
  play = true;
  paused = false;
  pausing = false;
  masterGain = 0;
  targetGain = 1;
  gainSlew = 0.002;

  // 1-pole low-pass state for vinyl-like rumble/hiss.
  lp = 0;
  lpAlpha = 0.002;

  // Crackle burst state.
  crack = 0;
  crackDecay = 0.9;

  // Loudness knobs.
  baseNoiseGain = 0.42;
  crackGain = 0.26;

  delay = new Float32Array(1);
  delayPos = 0;
  // Echo level mixed back into the final output.
  delayMix = 0.18;
  // Amount of delayed signal fed back into the delay line.
  delayFeedback = 0.35;

  beatIncrement = BPM / (60 * sampleRate);
  beatClock = 0;
  melodyGain = 0.22;
  drumGain = 0.36;
  inputGain = 1;
  sampleClock = 0;
  melodyNotes: MelodyNote[] = [];
  melodyLengthBeats = 0;
  beatHits: BeatHit[] = [];
  beatLengthBeats = 0;
  sources: SignalSource[] = [];

  drumLowState = 0;
  drumHighState = 0;

  constructor() {
    super();
    const melody = parseMelody(melody1);
    const beatTrack = parseBeat(beat);
    this.melodyNotes = melody.notes;
    this.melodyLengthBeats = melody.melodyLength;
    this.beatHits = beatTrack.hits;
    this.beatLengthBeats = beatTrack.beatLength;
    this.sources = [
      this.readInputSample.bind(this),
      this.generateMelodySample.bind(this),
      this.generateBeatSample.bind(this),
      this.generateNoiseSample.bind(this),
    ];
    // Delay buffer size controls echo time (0.32s here).
    this.delay = new Float32Array((sampleRate * 0.32) | 0);
    this.port.onmessage = (event: MessageEvent<WorkletPortMessage>) => {
      const eventID = event.data;
      switch (eventID) {
        case 0: // start
          this.play = true;
          this.paused = false;
          this.pausing = false;
          this.targetGain = 1;
          break;
        case 1: // pause
          this.pausing = true;
          this.targetGain = 0;
          break;
        case 2: // unpause
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

  generateMelodySample() {
    if (!this.melodyNotes.length || this.melodyLengthBeats <= 0) {
      return 0;
    }

    const songTimeSec = this.sampleClock / sampleRate;
    const beat = this.beatClock % this.melodyLengthBeats;
    let sample = 0;

    for (let i = 0; i < this.melodyNotes.length; i++) {
      const note = this.melodyNotes[i];
      if (beat < note.start || beat >= note.end + MELODY_RELEASE_TAIL_BEATS) {
        continue;
      }

      const noteAge = beat - note.start;
      const attack = Math.min(1, noteAge / MELODY_ATTACK_BEATS);
      const decay = Math.exp(-noteAge * MELODY_DECAY_PER_BEAT);
      let release = 1;
      if (beat > note.end) {
        const releaseAge = beat - note.end;
        release = Math.exp(-releaseAge * MELODY_RELEASE_PER_BEAT);
      }
      const env = attack * decay * release;
      const phase = songTimeSec * note.freq * Math.PI * 2;
      sample += Math.sin(phase) * env;
    }

    return sample * this.melodyGain;
  }

  generateBeatSample() {
    if (!this.beatHits.length || this.beatLengthBeats <= 0) {
      return 0;
    }

    if (this.beatClock < beatDelay) {
      return 0;
    }

    const loopLength = this.beatLengthBeats + beatGap;
    const loopPhase = (this.beatClock - beatDelay) % loopLength;
    if (loopPhase >= this.beatLengthBeats) {
      return 0;
    }

    const beatTime = loopPhase;
    const noise = Math.random() * 2 - 1;
    let sample = 0;

    for (let i = 0; i < this.beatHits.length; i++) {
      const hit = this.beatHits[i];
      if (beatTime < hit.start || beatTime >= hit.end) {
        continue;
      }

      const hitAge = beatTime - hit.start;
      const env = Math.exp(-hitAge * (hit.low ? 14 : 20));

      if (hit.low) {
        this.drumLowState += (noise - this.drumLowState) * 0.085;
        sample += this.drumLowState * env;
      } else {
        this.drumHighState += (noise - this.drumHighState) * 0.58;
        sample += (noise - this.drumHighState) * env * 0.75;
      }
    }

    return sample * this.drumGain;
  }

  mixSignalSources(sampleIndex: number, inputs: Float32Array[][]) {
    let mixed = 0;
    for (let i = 0; i < this.sources.length; i++) {
      mixed += this.sources[i](sampleIndex, inputs);
    }
    return mixed;
  }

  generateNoiseSample() {
    // White noise source.
    const n = Math.random() * 2 - 1;

    // Very low filtered bed for vinyl rumble.
    this.lp += (n - this.lp) * this.lpAlpha;

    // Random crack trigger + short decaying burst.
    if (Math.random() < 0.00035) {
      this.crack = (Math.random() * 2 - 1) * (0.2 + Math.random() * Math.random() * 1.1);
    }
    this.crack *= this.crackDecay;

    // Base signal before echo: low rumble + tiny hiss + crackle pops.
    const baseNoise = this.lp * 0.22 + n * 0.008;
    const sourceSample = baseNoise * this.baseNoiseGain + this.crack * this.crackGain;

    // Read the delayed sample from the current delay position.
    const echo = this.delay[this.delayPos];

    // Write current source + feedback back into the delay line.
    this.delay[this.delayPos] = sourceSample + echo * this.delayFeedback;
    this.delayPos = (this.delayPos + 1) % this.delay.length;

    // Return dry+wet sample before master gain.
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

      const sample = this.mixSignalSources(i, inputs) * this.masterGain;
      outputBuffer[i] = Math.max(-1, Math.min(1, sample));
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

registerProcessor('mp', MusicProcessor);
