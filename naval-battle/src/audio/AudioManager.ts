import { HIT_SFX, SUNK_SFX } from "./sfx";

export default class AudioManager {
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private unlocked = false;

  async unlock() {
    if (!this.context) {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) {
        return;
      }

      this.context = new AudioContextClass();
      this.gain = this.context.createGain();
      this.gain.gain.value = 0.7;
      this.gain.connect(this.context.destination);
    }

    if (this.context.state === "suspended") {
      await this.context.resume();
    }

    this.unlocked = true;
  }

  setVolume(volume: number) {
    if (!this.gain) {
      return;
    }
    this.gain.gain.value = volume / 100;
  }

  playHit(volume: number) {
    if (!this.context || !this.gain || !this.unlocked || volume <= 0) {
      return;
    }

    const now = this.context.currentTime + 0.01;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();

    oscillator.type = HIT_SFX.wave;
    oscillator.frequency.setValueAtTime(HIT_SFX.startFrequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(HIT_SFX.endFrequency, now + HIT_SFX.duration);

    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(0.35, now + 0.02);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + HIT_SFX.duration);

    oscillator.connect(envelope);
    envelope.connect(this.gain);
    oscillator.start(now);
    oscillator.stop(now + HIT_SFX.duration + 0.02);
  }

  playSunk(volume: number) {
    if (!this.context || !this.gain || !this.unlocked || volume <= 0) {
      return;
    }

    const start = this.context.currentTime + 0.01;

    SUNK_SFX.notes.forEach((note, index) => {
      const oscillator = this.context!.createOscillator();
      const envelope = this.context!.createGain();
      const time = start + index * SUNK_SFX.noteDuration;

      oscillator.type = SUNK_SFX.wave;
      oscillator.frequency.setValueAtTime(note, time);

      envelope.gain.setValueAtTime(0.0001, time);
      envelope.gain.exponentialRampToValueAtTime(0.4, time + 0.01);
      envelope.gain.exponentialRampToValueAtTime(0.0001, time + SUNK_SFX.noteDuration);

      oscillator.connect(envelope);
      envelope.connect(this.gain!);
      oscillator.start(time);
      oscillator.stop(time + SUNK_SFX.noteDuration + 0.02);
    });
  }
}
