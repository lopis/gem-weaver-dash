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
let drumLowState = 0;
let drumHighState = 0;

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

      let mixed = 0;
      for (let j = 0; j < inputs.length; j++) mixed += inputs[j]?.[0]?.[i] || 0;

      if (melodyNotes.length && melodyLengthBeats > 0) {
        const localBeat = beat % melodyLengthBeats;
        let melody = 0;

        for (let k = 0; k < melodyNotes.length; k += 3) {
          const startBeat = melodyNotes[k];
          const endBeat = melodyNotes[k + 1];
          if (localBeat < startBeat || localBeat >= endBeat + PIANO_RELEASE_TAIL_BEATS) {
            continue;
          }

          const noteAgeInSamples = (localBeat - startBeat) / beatIncrement;
          const vibrato = Math.sin(noteAgeInSamples * PIANO_VIBRATO_RATE) * PIANO_VIBRATO_DEPTH;
          const attack = Math.min(1, noteAgeInSamples * PIANO_ATTACK_PER_SAMPLE);
          const decay = Math.exp(-noteAgeInSamples * PIANO_DECAY_PER_SAMPLE);
          const release = localBeat > endBeat
            ? Math.exp(-(localBeat - endBeat) / beatIncrement * PIANO_RELEASE_PER_SAMPLE)
            : 1;

          melody += Math.sin(seconds * melodyNotes[k + 2] * TAU + vibrato) * attack * decay * release;
        }

        mixed += melody * 0.22;
      }

      if (beatNotes.length && beatLengthBeats > 0 && beat >= BEAT_DELAY) {
        const localBeat = (beat - BEAT_DELAY) % (beatLengthBeats + BEAT_GAP);

        if (localBeat < beatLengthBeats) {
          const white = Math.random() * 2 - 1;
          let drum = 0;

          for (let k = 0; k < beatNotes.length; k += 3) {
            const startBeat = beatNotes[k];
            const endBeat = beatNotes[k + 1];
            if (localBeat < startBeat || localBeat >= endBeat) {
              continue;
            }

            const isLow = beatNotes[k + 2] > 0.5;
            const envelope = Math.exp(-(localBeat - startBeat) * (isLow ? 14 : 20));
            if (isLow) {
              drumLowState += (white - drumLowState) * 0.085;
              drum += drumLowState * envelope;
            } else {
              drumHighState += (white - drumHighState) * 0.58;
              drum += (white - drumHighState) * envelope * 0.75;
            }
          }

          mixed += drum * 0.36;
        }
      }

      const sample = mixed * masterGain;
      output[i] = sample < -1 ? -1 : sample > 1 ? 1 : sample;

      seconds += 1 / sampleRate;
      beat += beatIncrement;
    }

    return true;
  }
}

registerProcessor('mp', MpProcessor);
