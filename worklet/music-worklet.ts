/// <reference lib="webworker" />
/// <reference lib="dom" />

declare const sampleRate: number;

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

  constructor() {
    super();
    // Delay buffer size controls echo time (0.32s here).
    this.delay = new Float32Array((sampleRate * 0.32) | 0);
    this.port.onmessage = (event) => {
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

  process(_inputs: Float32Array[][], outputs: Float32Array[][], _parameters: Map<string, Float32Array>) {
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

      // Final output: direct source plus a scaled delayed copy.
      const sample = (sourceSample + echo * this.delayMix) * this.masterGain;
      outputBuffer[i] = Math.max(-1, Math.min(1, sample));

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
