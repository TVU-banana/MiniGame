import type { SoundEffectKey } from '../app/events';
import type { SettingsState } from '../app/types';

export class AudioManager {
  private context: AudioContext | null = null;
  private settings: SettingsState;
  private bgmTimer = 0;
  private mode: 'menu' | 'game' | null = null;

  constructor(settings: SettingsState) {
    this.settings = settings;
  }

  updateSettings(settings: SettingsState): void {
    this.settings = settings;
  }

  async unlock(): Promise<void> {
    if (!this.context) {
      this.context = new AudioContext();
    }
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  playBgm(mode: 'menu' | 'game'): void {
    this.stopBgm();
    this.mode = mode;
    const pattern =
      mode === 'menu'
        ? [220, 293.66, 329.63, 293.66]
        : [130.81, 174.61, 196, 174.61, 220, 174.61];
    let index = 0;
    this.bgmTimer = window.setInterval(() => {
      this.playTone(pattern[index % pattern.length], 0.24, 'sine', this.settings.bgmVolume * 0.22);
      if (mode === 'game' && index % 2 === 0) {
        this.playTone(pattern[(index + 2) % pattern.length] * 0.5, 0.18, 'triangle', this.settings.bgmVolume * 0.12);
      }
      index += 1;
    }, mode === 'menu' ? 620 : 420);
  }

  stopBgm(): void {
    if (this.bgmTimer) {
      window.clearInterval(this.bgmTimer);
      this.bgmTimer = 0;
    }
    this.mode = null;
  }

  playResult(success: boolean): void {
    const notes = success ? [392, 523.25, 659.25] : [220, 174.61, 146.83];
    notes.forEach((note, idx) => {
      window.setTimeout(() => {
        this.playTone(note, 0.2, success ? 'triangle' : 'sawtooth', this.settings.sfxVolume * 0.4);
      }, idx * 130);
    });
  }

  playSfx(key: SoundEffectKey): void {
    switch (key) {
      case 'hit':
        this.playTone(780, 0.06, 'square', this.settings.sfxVolume * 0.18);
        break;
      case 'enemyDeath':
        this.playTone(240, 0.12, 'sawtooth', this.settings.sfxVolume * 0.26);
        break;
      case 'knifeBreak':
        this.playTone(120, 0.16, 'triangle', this.settings.sfxVolume * 0.32);
        break;
      case 'playerHurt':
        this.playTone(180, 0.18, 'sawtooth', this.settings.sfxVolume * 0.3);
        break;
      case 'knifeUnlock':
        this.playTone(660, 0.18, 'triangle', this.settings.sfxVolume * 0.36);
        break;
    }
  }

  playButton(): void {
    this.playTone(510, 0.07, 'triangle', this.settings.sfxVolume * 0.22);
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType,
    gainValue: number
  ): void {
    if (!this.context) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, gainValue), now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }
}
