/// <reference lib="webworker" />
/// <reference lib="dom" />

declare const sampleRate: number;

const BPM = 240;
const TAU = Math.PI * 2;

// Melody timbre envelope (piano-like).
const PIANO_VIBRATO_RATE = 0.008;
const PIANO_VIBRATO_DEPTH = 0.04;
const PIANO_ATTACK_PER_SAMPLE = 0.002;
const PIANO_DECAY_PER_SAMPLE = 0.00005;
const PIANO_RELEASE_TAIL_BEATS = 2.6;
const PIANO_RELEASE_PER_SAMPLE = 0.00025;

// Beat loop placement and spacing.
const BEAT_DELAY = 64;
const BEAT_GAP = 1;
type InitMessage = [number[], number, number[], number];

type WorkletPortMessage = number | InitMessage;

class MpProcessor extends AudioWorkletProcessor {
  play = true;
  gainSlew = 0.002;
  beatIncrement = BPM / (60 * sampleRate);

  // Parsed track data supplied from the main bundle.
  melodyNotes: number[] = [];
  melodyLengthBeats = 0;
  beatNotes: number[] = [];
  beatLengthBeats = 0;

  seconds = 0;
  beat = 0;
  masterGain = 0;
  targetGain = 1;
  rumbleLowPass = 0;
  crackle = 0;
  drumLowState = 0;
  drumHighState = 0;

  delay = new Float32Array((sampleRate * 0.32) | 0);
  delayIndex = 0;

  constructor() {
    super();

    this.port.onmessage = (event: MessageEvent<WorkletPortMessage>) => {
      const message = event.data;
      if (Array.isArray(message)) {
        [this.melodyNotes, this.melodyLengthBeats, this.beatNotes, this.beatLengthBeats] = message;
        return;
      }

      const on = message !== 1;
      this.play = on;
      this.targetGain = on ? 1 : 0;
    };
  }

  sumInputSample(sampleIndex: number, inputs: Float32Array[][]) {
    let value = 0;
    for (let i = 0; i < inputs.length; i++) {
      value += inputs[i]?.[0]?.[sampleIndex] || 0;
    }
    return value;
  }

  generateMelodySample() {
    if (!this.melodyNotes.length || this.melodyLengthBeats <= 0) {
      return 0;
    }

    const beat = this.beat % this.melodyLengthBeats;
    let sample = 0;

    for (let i = 0; i < this.melodyNotes.length; i += 3) {
      const startBeat = this.melodyNotes[i];
      const endBeat = this.melodyNotes[i + 1];
      if (beat < startBeat || beat >= endBeat + PIANO_RELEASE_TAIL_BEATS) {
        continue;
      }

      const noteAgeInSamples = (beat - startBeat) / this.beatIncrement;
      const vibrato = Math.sin(noteAgeInSamples * PIANO_VIBRATO_RATE) * PIANO_VIBRATO_DEPTH;
      const attack = Math.min(1, noteAgeInSamples * PIANO_ATTACK_PER_SAMPLE);
      const decay = Math.exp(-noteAgeInSamples * PIANO_DECAY_PER_SAMPLE);

      let release = 1;
      if (beat > endBeat) {
        const releaseSamples = (beat - endBeat) / this.beatIncrement;
        release = Math.exp(-releaseSamples * PIANO_RELEASE_PER_SAMPLE);
      }

      const envelope = attack * decay * release;
      const frequency = this.melodyNotes[i + 2];
      sample += Math.sin(this.seconds * frequency * TAU + vibrato) * envelope;
    }

    return sample * 0.22;
  }

  generateBeatSample() {
    if (!this.beatNotes.length || this.beatLengthBeats <= 0 || this.beat < BEAT_DELAY) {
      return 0;
    }

    const loopLength = this.beatLengthBeats + BEAT_GAP;
    const beat = (this.beat - BEAT_DELAY) % loopLength;
    if (beat >= this.beatLengthBeats) {
      return 0;
    }

    const white = Math.random() * 2 - 1;
    let sample = 0;

    for (let i = 0; i < this.beatNotes.length; i += 3) {
      const startBeat = this.beatNotes[i];
      const endBeat = this.beatNotes[i + 1];
      if (beat < startBeat || beat >= endBeat) {
        continue;
      }

      const isLow = this.beatNotes[i + 2] > 0.5;
      const envelope = Math.exp(-(beat - startBeat) * (isLow ? 14 : 20));
      if (isLow) {
        this.drumLowState += (white - this.drumLowState) * 0.085;
        sample += this.drumLowState * envelope;
      } else {
        this.drumHighState += (white - this.drumHighState) * 0.58;
        sample += (white - this.drumHighState) * envelope * 0.75;
      }
    }

    return sample * 0.36;
  }

  generateVinylNoise() {
    const white = Math.random() * 2 - 1;
    this.rumbleLowPass += (white - this.rumbleLowPass) * 0.002;

    if (Math.random() < 0.00035) {
      this.crackle = (Math.random() * 2 - 1) * (0.2 + Math.random() * Math.random() * 1.1);
    }
    this.crackle *= 0.9;

    const base = (this.rumbleLowPass * 0.22 + white * 0.008) * 0.42 + this.crackle * 0.26;
    const echo = this.delay[this.delayIndex];
    this.delay[this.delayIndex] = base + echo * 0.35;
    this.delayIndex = (this.delayIndex + 1) % this.delay.length;

    return base + echo * 0.18;
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const output = outputs[0]?.[0];
    if (!output) {
      return true;
    }

    if (!this.play && this.masterGain < 0.0005) {
      output.fill(0);
      return true;
    }

    for (let i = 0; i < output.length; i++) {
      this.masterGain += (this.targetGain - this.masterGain) * this.gainSlew;

      const mixed =
        this.sumInputSample(i, inputs) +
        this.generateMelodySample() +
        this.generateBeatSample() +
        this.generateVinylNoise();

      const sample = mixed * this.masterGain;
      output[i] = sample < -1 ? -1 : sample > 1 ? 1 : sample;

      this.seconds += 1 / sampleRate;
      this.beat += this.beatIncrement;
    }

    return true;
  }
}

registerProcessor('mp', MpProcessor);
