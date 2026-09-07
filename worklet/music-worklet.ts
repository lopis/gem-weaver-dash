/// <reference lib="webworker" />
/// <reference lib="dom" />

declare const sampleRate: number;

type InitMessage = [number[], number, number[], number];

type WorkletPortMessage = number | InitMessage;

const beatIncrement = 4 / sampleRate;

let play = true, melodyNotes: number[] = [], melodyLengthBeats = 0, beatNotes: number[] = [], beatLengthBeats = 0, seconds = 0, beat = 0, masterGain = 0, targetGain = 1, drumLowState = 0, drumHighState = 0;

class MpProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this.port.onmessage = (event: MessageEvent<WorkletPortMessage>) => {
      const message = event.data;
      if (Array.isArray(message)) {
        [melodyNotes, melodyLengthBeats, beatNotes, beatLengthBeats] = message;
        return;
      }

      play = message !== 1;
      targetGain = play ? 1 : 0;
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
      masterGain += (targetGain - masterGain) * 0.002;

      let mixed = 0;
      for (let j = 0; j < inputs.length; j++) mixed += inputs[j]?.[0]?.[i] || 0;

      const localBeat = beat % melodyLengthBeats;
      let melody = 0;

      for (let k = 0; k < melodyNotes.length; k += 3) {
        const startBeat = melodyNotes[k];
        const endBeat = melodyNotes[k + 1];
        if (localBeat < startBeat || localBeat >= endBeat + 16) {
          continue;
        }

        const noteAgeInSamples = (localBeat - startBeat) / beatIncrement;

        melody += Math.sin(seconds * melodyNotes[k + 2] * (Math.PI * 2) + Math.sin(noteAgeInSamples * 0.008) * 0.04)
          * Math.min(1, noteAgeInSamples * 0.002)
          * Math.exp(-noteAgeInSamples * 0.00001 + (localBeat > endBeat ? -(localBeat - endBeat) / beatIncrement * 0.00015 : 0));
      }

      mixed += melody * 0.12;

      if (beat >= 64) {
        const localBeat = (beat - 64) % (beatLengthBeats + 1);

        if (localBeat < beatLengthBeats) {
          const white = Math.random() * 2 - 1;
          let drum = 0;

          for (let k = 0; k < beatNotes.length; k += 3) {
            const startBeat = beatNotes[k];
            if (localBeat < startBeat || localBeat >= beatNotes[k + 1]) {
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
