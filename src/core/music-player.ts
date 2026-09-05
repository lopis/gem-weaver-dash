// Compact track format: deltaTicks.midi.durationTicks (base36), comma-separated.
const MELODY_TRACK = "0.1o.1s,1.1r.1r,1.1v.1q,1.1y.1p,1p.1m.1s,1.1q.1r,1.1t.1q,1.1x.1p,1p.1p.1s,1.1s.1r,1.1u.1q,1.1x.1p,1p.1j.1s,1.1m.1r,1.1r.1q,1.1v.l,l.1x.o,o.1y.g";
const BEAT_TRACK = "0.1i.4,0.15.4,8.1i.4,8.1i.4,0.17.4,8.1i.4,8.1i.4,4.14.4,4.1i.4,8.1i.4,0.17.4,8.1i.4";

type InitMessage = [number[], number, number[], number];

function decodeCompactTrack(track: string, mapPayload: (value: number) => number): [number[], number] {
  const notes: number[] = [];
  let lengthBeats = 0;
  let absoluteTicks = 0;

  const entries = track.split(',');
  for (let i = 0; i < entries.length; i++) {
    const parts = entries[i].split('.');
    const deltaTicks = parseInt(parts[0], 36);
    const payloadRaw = parseInt(parts[1], 36);
    const durationTicks = parseInt(parts[2], 36);

    absoluteTicks += deltaTicks;
    const startBeat = absoluteTicks * 0.25;
    const endBeat = (absoluteTicks + durationTicks) * 0.25;

    notes.push(startBeat, endBeat, mapPayload(payloadRaw));
    if (endBeat > lengthBeats) {
      lengthBeats = endBeat;
    }
  }

  return [notes, lengthBeats];
}

function midiToFrequency(midi: number) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function midiToBeatClass(midi: number) {
  return midi < 48 ? 1 : 0;
}

class MusicPlayer {
  audioContext: AudioContext | undefined;
  isPlaying = false;
  musicProcessorNode: AudioWorkletNode | undefined;

  async start() {
    if (this.isPlaying) return;

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    await this.audioContext.resume();
    await this.audioContext.audioWorklet.addModule('/music-worklet.js');

    this.musicProcessorNode = new AudioWorkletNode(this.audioContext, 'mp');
    this.musicProcessorNode.connect(this.audioContext.destination);

    const [melodyNotes, melodyLengthBeats] = decodeCompactTrack(MELODY_TRACK, midiToFrequency);
    const [beatNotes, beatLengthBeats] = decodeCompactTrack(BEAT_TRACK, midiToBeatClass);
    const initMessage: InitMessage = [melodyNotes, melodyLengthBeats, beatNotes, beatLengthBeats];
    this.musicProcessorNode.port.postMessage(initMessage);

    this.isPlaying = true;
  }

  pause() {
    this.musicProcessorNode?.port.postMessage(1);
  }

  unpause() {
    this.musicProcessorNode?.port.postMessage(2);
  }

  stop() {
    if (this.isPlaying) {
      this.musicProcessorNode?.disconnect();
      this.isPlaying = false;
    }
  }
}

export default new MusicPlayer();
