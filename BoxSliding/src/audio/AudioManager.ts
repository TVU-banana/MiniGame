export interface AudioSettings {
  bgmEnabled: boolean;
  sfxEnabled: boolean;
  bgmVolume: number;
  sfxVolume: number;
}

type BgmMode = 'menu' | 'game' | null;

interface NoteStep {
  freq: number;
  duration: number;
  gain: number;
  type: OscillatorType;
}

const SETTINGS_KEY = 'slider-clear-3d:audio';

const DEFAULT_SETTINGS: AudioSettings = {
  bgmEnabled: true,
  sfxEnabled: true,
  bgmVolume: 62,
  sfxVolume: 80,
};

const MENU_PATTERN: NoteStep[] = [
  { freq: 392, duration: 0.38, gain: 0.07, type: 'triangle' },
  { freq: 523.25, duration: 0.26, gain: 0.06, type: 'triangle' },
  { freq: 659.25, duration: 0.48, gain: 0.08, type: 'sine' },
  { freq: 523.25, duration: 0.32, gain: 0.05, type: 'triangle' },
];

const GAME_PATTERN: NoteStep[] = [
  { freq: 220, duration: 0.22, gain: 0.06, type: 'square' },
  { freq: 329.63, duration: 0.18, gain: 0.05, type: 'triangle' },
  { freq: 261.63, duration: 0.2, gain: 0.06, type: 'square' },
  { freq: 349.23, duration: 0.2, gain: 0.05, type: 'triangle' },
  { freq: 293.66, duration: 0.24, gain: 0.05, type: 'square' },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export class AudioManager {
  private context: AudioContext | null = null;

  private loopTimer: number | null = null;

  private bgmMode: BgmMode = null;

  private bgmStep = 0;

  private settings = this.loadSettings();

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  async unlock(): Promise<void> {
    const context = this.ensureContext();
    if (context.state === 'suspended') {
      await context.resume();
    }

    if (this.bgmMode && this.loopTimer === null && this.canPlayBgm()) {
      this.startBgm(this.bgmMode);
    }
  }

  setSettings(next: Partial<AudioSettings>): AudioSettings {
    this.settings = {
      ...this.settings,
      ...next,
      bgmVolume: clamp(next.bgmVolume ?? this.settings.bgmVolume, 0, 100),
      sfxVolume: clamp(next.sfxVolume ?? this.settings.sfxVolume, 0, 100),
    };
    this.settings.bgmEnabled = this.settings.bgmVolume > 0;
    this.settings.sfxEnabled = this.settings.sfxVolume > 0;
    this.saveSettings();

    if (!this.canPlayBgm()) {
      this.stopBgm();
    } else if (this.bgmMode) {
      this.startBgm(this.bgmMode);
    }

    return this.getSettings();
  }

  startMenuBgm(): void {
    this.startBgm('menu');
  }

  startGameBgm(): void {
    this.startBgm('game');
  }

  stopBgm(): void {
    if (this.loopTimer !== null) {
      window.clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
  }

  playButton(): void {
    this.playTone(660, 0.06, 'triangle', 0.05, 760);
  }

  playSlide(): void {
    this.playSweep(320, 740, 0.2, 'triangle', 0.08);
  }

  playBlocked(): void {
    this.playSweep(210, 130, 0.12, 'square', 0.07);
  }

  playSuccess(): void {
    this.playTone(523.25, 0.12, 'triangle', 0.08, 620);
    this.playTone(659.25, 0.16, 'triangle', 0.08, 760, 0.08);
    this.playTone(783.99, 0.22, 'triangle', 0.08, 900, 0.16);
  }

  playFail(): void {
    this.playTone(261.63, 0.16, 'sawtooth', 0.06, 200);
    this.playTone(174.61, 0.24, 'sawtooth', 0.06, 120, 0.12);
  }

  private loadSettings(): AudioSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) {
        return { ...DEFAULT_SETTINGS };
      }
      const parsed = JSON.parse(raw) as Partial<AudioSettings>;
      return {
        bgmEnabled: parsed.bgmEnabled ?? DEFAULT_SETTINGS.bgmEnabled,
        sfxEnabled: parsed.sfxEnabled ?? DEFAULT_SETTINGS.sfxEnabled,
        bgmVolume: clamp(parsed.bgmVolume ?? DEFAULT_SETTINGS.bgmVolume, 0, 100),
        sfxVolume: clamp(parsed.sfxVolume ?? DEFAULT_SETTINGS.sfxVolume, 0, 100),
      };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  private saveSettings(): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
  }

  private canPlayBgm(): boolean {
    return this.settings.bgmEnabled && this.settings.bgmVolume > 0;
  }

  private canPlaySfx(): boolean {
    return this.settings.sfxEnabled && this.settings.sfxVolume > 0;
  }

  private startBgm(mode: Exclude<BgmMode, null>): void {
    this.bgmMode = mode;
    this.bgmStep = 0;
    this.stopBgm();

    if (!this.canPlayBgm()) {
      return;
    }

    const context = this.ensureContext();
    if (context.state !== 'running') {
      return;
    }

    this.scheduleBgmStep();
  }

  private scheduleBgmStep(): void {
    if (!this.bgmMode || !this.canPlayBgm() || !this.context || this.context.state !== 'running') {
      this.loopTimer = null;
      return;
    }

    const pattern = this.bgmMode === 'menu' ? MENU_PATTERN : GAME_PATTERN;
    const step = pattern[this.bgmStep % pattern.length];
    const masterGain = this.volumeToGain(this.settings.bgmVolume);

    this.playTone(step.freq, step.duration * 0.92, step.type, step.gain * masterGain, step.freq, 0, false);
    if (this.bgmMode === 'game') {
      this.playTone(
        step.freq * 2,
        step.duration * 0.65,
        'sine',
        step.gain * masterGain * 0.42,
        step.freq * 2,
        0,
        false,
      );
    }

    this.bgmStep += 1;
    this.loopTimer = window.setTimeout(() => {
      this.scheduleBgmStep();
    }, step.duration * 1000);
  }

  private playSweep(
    startFreq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType,
    gainValue: number,
  ): void {
    if (!this.canPlaySfx()) {
      return;
    }

    const context = this.ensureContext();
    if (context.state !== 'running') {
      return;
    }

    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(startFreq, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + duration);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainValue * this.volumeToGain(this.settings.sfxVolume), now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.03);
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType,
    gainValue: number,
    endFrequency: number,
    startDelay = 0,
    useSfxVolume = true,
  ): void {
    if (useSfxVolume && !this.canPlaySfx()) {
      return;
    }

    const context = this.ensureContext();
    if (context.state !== 'running') {
      return;
    }

    const gainScale = useSfxVolume
      ? this.volumeToGain(this.settings.sfxVolume)
      : this.volumeToGain(this.settings.bgmVolume);

    const startAt = context.currentTime + startDelay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, endFrequency), startAt + duration);

    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(gainValue * gainScale, startAt + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.03);
  }

  private volumeToGain(volume: number): number {
    return clamp(volume, 0, 100) / 100;
  }

  private ensureContext(): AudioContext {
    if (!this.context) {
      this.context = new window.AudioContext();
    }
    return this.context;
  }
}
