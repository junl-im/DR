import { Howl, Howler } from 'howler';

export type SfxName = 'tap' | 'select' | 'match' | 'beam' | 'burst' | 'combo' | 'clear';

export class DreamAudio {
  enabled = true;
  private unlocked = false;
  private synthetic: Partial<Record<SfxName, Howl>> = {};

  constructor() {
    Howler.autoUnlock = true;
    Howler.volume(0.72);
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    Howler.mute(!enabled);
  }

  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    this.ensureSyntheticBank();
  }

  play(name: SfxName) {
    if (!this.enabled) return;
    this.unlock();
    this.synthetic[name]?.play();
  }

  private ensureSyntheticBank() {
    if (Object.keys(this.synthetic).length > 0) return;
    const tone = (freq: number, duration = 0.08, type: OscillatorType = 'sine') => makeTone(freq, duration, type);
    this.synthetic.tap = new Howl({ src: [tone(480, 0.045, 'triangle')], volume: 0.32 });
    this.synthetic.select = new Howl({ src: [tone(720, 0.06, 'sine')], volume: 0.38 });
    this.synthetic.match = new Howl({ src: [tone(980, 0.09, 'triangle')], volume: 0.42 });
    this.synthetic.beam = new Howl({ src: [tone(1240, 0.11, 'sawtooth')], volume: 0.22 });
    this.synthetic.burst = new Howl({ src: [tone(180, 0.12, 'square')], volume: 0.24 });
    this.synthetic.combo = new Howl({ src: [tone(1480, 0.08, 'sine')], volume: 0.36 });
    this.synthetic.clear = new Howl({ src: [tone(880, 0.22, 'triangle')], volume: 0.5 });
  }
}

function makeTone(freq: number, duration: number, type: OscillatorType) {
  const sampleRate = 44100;
  const length = Math.max(1, Math.floor(sampleRate * duration));
  const bytesPerSample = 2;
  const buffer = new ArrayBuffer(44 + length * bytesPerSample);
  const view = new DataView(buffer);
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + length * bytesPerSample, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, length * bytesPerSample, true);
  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate;
    const fade = Math.pow(1 - i / length, 2);
    const wave = type === 'square' ? Math.sign(Math.sin(2 * Math.PI * freq * t)) : type === 'sawtooth' ? 2 * ((freq * t) % 1) - 1 : type === 'triangle' ? 2 * Math.asin(Math.sin(2 * Math.PI * freq * t)) / Math.PI : Math.sin(2 * Math.PI * freq * t);
    view.setInt16(44 + i * bytesPerSample, wave * fade * 0x7fff, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return `data:audio/wav;base64,${btoa(binary)}`;
}

function writeString(view: DataView, offset: number, text: string) {
  for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
}
