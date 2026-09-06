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
const PIANO_RELEASE_TAIL_BEATS = 16;
const PIANO_RELEASE_PER_SAMPLE = 0.00015;

// Beat loop placement and spacing.
const BEAT_DELAY = 64;
const BEAT_GAP = 1;
type InitMessage = [number[], number, number[], number];

type WorkletPortMessage = number | InitMessage;

const gainSlew = 0.002;
const beatIncrement = BPM / (60 * sampleRate);
const delay = new Float32Array((sampleRate * 0.32) | 0);

let play = true;

// Parsed track data supplied from the main bundle.
let melodyNotes: number[] = [];
let melodyLengthBeats = 0;
let beatNotes: number[] = [];
let beatLengthBeats = 0;

let seconds = 0;
let beat = 0;
let masterGain = 0;
let targetGain = 1;
let rumbleLowPass = 0;
let crackle = 0;
let drumLowState = 0;
let drumHighState = 0;
let delayIndex = 0;

class MpProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this.port.onmessage = (event: MessageEvent<WorkletPortMessage>) => {
      const message = event.data;
      if (Array.isArray(message)) {
        [melodyNotes, melodyLengthBeats, beatNotes, beatLengthBeats] = message;
        return;
      }

      const on = message !== 1;
      play = on;
      targetGain = on ? 1 : 0;
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
    if (!melodyNotes.length || melodyLengthBeats <= 0) {
      return 0;
    }

    const localBeat = beat % melodyLengthBeats;
    let sample = 0;

    for (let i = 0; i < melodyNotes.length; i += 3) {
      const startBeat = melodyNotes[i];
      const endBeat = melodyNotes[i + 1];
      if (localBeat < startBeat || localBeat >= endBeat + PIANO_RELEASE_TAIL_BEATS) {
        continue;
      }

      const noteAgeInSamples = (localBeat - startBeat) / beatIncrement;
      const vibrato = Math.sin(noteAgeInSamples * PIANO_VIBRATO_RATE) * PIANO_VIBRATO_DEPTH;
      const attack = Math.min(1, noteAgeInSamples * PIANO_ATTACK_PER_SAMPLE);
      const decay = Math.exp(-noteAgeInSamples * PIANO_DECAY_PER_SAMPLE);

      let release = 1;
      if (localBeat > endBeat) {
        const releaseSamples = (localBeat - endBeat) / beatIncrement;
        release = Math.exp(-releaseSamples * PIANO_RELEASE_PER_SAMPLE);
      }

      const envelope = attack * decay * release;
      const frequency = melodyNotes[i + 2];
      sample += Math.sin(seconds * frequency * TAU + vibrato) * envelope;
    }

    return sample * 0.22;
  }

  generateBeatSample() {
    if (!beatNotes.length || beatLengthBeats <= 0 || beat < BEAT_DELAY) {
      return 0;
    }

    const loopLength = beatLengthBeats + BEAT_GAP;
    const localBeat = (beat - BEAT_DELAY) % loopLength;
    if (localBeat >= beatLengthBeats) {
      return 0;
    }

    const white = Math.random() * 2 - 1;
    let sample = 0;

    for (let i = 0; i < beatNotes.length; i += 3) {
      const startBeat = beatNotes[i];
      const endBeat = beatNotes[i + 1];
      if (localBeat < startBeat || localBeat >= endBeat) {
        continue;
      }

      const isLow = beatNotes[i + 2] > 0.5;
      const envelope = Math.exp(-(localBeat - startBeat) * (isLow ? 14 : 20));
      if (isLow) {
        drumLowState += (white - drumLowState) * 0.085;
        sample += drumLowState * envelope;
      } else {
        drumHighState += (white - drumHighState) * 0.58;
        sample += (white - drumHighState) * envelope * 0.75;
      }
    }

    return sample * 0.36;
  }

  // generateVinylNoise() {
  //   const white = Math.random() * 2 - 1;
  //   this.rumbleLowPass += (white - this.rumbleLowPass) * 0.002;

  //   if (Math.random() < 0.00035) {
  //     this.crackle = (Math.random() * 2 - 1) * (0.2 + Math.random() * Math.random() * 1.1);
  //   }
  //   this.crackle *= 0.9;

  //   const base = (this.rumbleLowPass * 0.22 + white * 0.008) * 0.42 + this.crackle * 0.26;
  //   const echo = this.delay[this.delayIndex];
  //   this.delay[this.delayIndex] = base + echo * 0.35;
  //   this.delayIndex = (this.delayIndex + 1) % this.delay.length;

  //   return base + echo * 0.18;
  // }

  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const output = outputs[0]?.[0];
    if (!output) {
      return true;
    }

    if (!play && masterGain < 0.0005) {
      output.fill(0);
      return true;
    }

    for (let i = 0; i < output.length; i++) {
      masterGain += (targetGain - masterGain) * gainSlew;

      const mixed =
        this.sumInputSample(i, inputs) +
        this.generateMelodySample() +
        this.generateBeatSample();

      const sample = mixed * masterGain;
      output[i] = sample < -1 ? -1 : sample > 1 ? 1 : sample;

      seconds += 1 / sampleRate;
      beat += beatIncrement;
    }

    return true;
  }
}

registerProcessor('mp', MpProcessor);
