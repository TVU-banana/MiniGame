export interface AudioSettings {
  bgmEnabled: boolean;
  sfxEnabled: boolean;
  bgmVolume: number;
  sfxVolume: number;
}

type BgmMode = 'menu' | 'game' | null;
type SfxKind = 'button' | 'slide' | 'blocked' | 'success' | 'fail';

interface NoteStep {
  freq: number;
  duration: number;
  gain: number;
  type: OscillatorType;
}

const SETTINGS_KEY = 'slider-clear-3d:audio';
const BGM_FADE_SECONDS = 1.35;
const EXTERNAL_BGM_SOURCES = {
  menu: ['/audio/menu-bgm.mp3', '/audio/menu-bgm.mp4'],
  game: ['/audio/game-bgm.mp3', '/audio/game-bgm.mp4'],
} satisfies Record<Exclude<BgmMode, null>, string[]>;
const EXTERNAL_SFX_SOURCES = {
  button: ['/audio/button-sfx.mp3', '/audio/button-sfx.mp4'],
  slide: ['/audio/slide-sfx.mp3', '/audio/slide-sfx.mp4'],
  blocked: ['/audio/blocked-sfx.mp3', '/audio/blocked-sfx.mp4'],
  success: ['/audio/success-sfx.mp3', '/audio/success-sfx.mp4'],
  fail: ['/audio/fail-sfx.mp3', '/audio/fail-sfx.mp4'],
} satisfies Record<SfxKind, string[]>;

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

function isAutoplayError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'NotAllowedError';
}

export class AudioManager {
  private context: AudioContext | null = null;

  private loopTimer: number | null = null;

  private bgmMode: BgmMode = null;

  private bgmStep = 0;

  private settings = this.loadSettings();

  private readonly mediaAudio = new Map<Exclude<BgmMode, null>, HTMLAudioElement>();

  private readonly mediaUnavailable = new Set<Exclude<BgmMode, null>>();

  private readonly mediaSourceIndex = new Map<Exclude<BgmMode, null>, number>();

  private readonly sfxAudio = new Map<SfxKind, HTMLAudioElement>();

  private readonly sfxUnavailable = new Set<SfxKind>();

  private readonly sfxSourceIndex = new Map<SfxKind, number>();

  private activeMediaAudio: HTMLAudioElement | null = null;

  private activeMediaMode: Exclude<BgmMode, null> | null = null;

  private mediaMonitorFrame: number | null = null;

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  async unlock(): Promise<void> {
    const context = this.ensureContext();
    if (context.state === 'suspended') {
      await context.resume();
    }

    if (this.bgmMode && this.canPlayBgm()) {
      const usingMedia = this.activeMediaMode === this.bgmMode && this.activeMediaAudio !== null;
      const usingSynth = this.loopTimer !== null;
      if (!usingMedia && !usingSynth) {
        this.startBgm(this.bgmMode);
      } else if (usingMedia) {
        void this.activeMediaAudio?.play().catch(() => undefined);
      }
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
    } else if (this.activeMediaAudio) {
      this.activeMediaAudio.volume = this.getMediaVolume(this.activeMediaAudio);
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

    if (this.mediaMonitorFrame !== null) {
      window.cancelAnimationFrame(this.mediaMonitorFrame);
      this.mediaMonitorFrame = null;
    }

    if (this.activeMediaAudio) {
      this.activeMediaAudio.pause();
      this.activeMediaAudio.currentTime = 0;
    }

    this.activeMediaAudio = null;
    this.activeMediaMode = null;
  }

  playButton(): void {
    if (this.playExternalSfx('button')) {
      return;
    }
    this.playTone(660, 0.06, 'triangle', 0.05, 760);
  }

  playSlide(): void {
    if (this.playExternalSfx('slide')) {
      return;
    }
    this.playSweep(320, 740, 0.2, 'triangle', 0.08);
  }

  playBlocked(): void {
    if (this.playExternalSfx('blocked')) {
      return;
    }
    this.playSweep(210, 130, 0.12, 'square', 0.07);
  }

  playSuccess(): void {
    if (this.playExternalSfx('success')) {
      return;
    }
    this.playTone(523.25, 0.12, 'triangle', 0.08, 620);
    this.playTone(659.25, 0.16, 'triangle', 0.08, 760, 0.08);
    this.playTone(783.99, 0.22, 'triangle', 0.08, 900, 0.16);
  }

  playFail(): void {
    if (this.playExternalSfx('fail')) {
      return;
    }
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
    this.resetExternalBgmSource(mode);

    if (!this.canPlayBgm()) {
      return;
    }

    if (this.startExternalBgm(mode)) {
      return;
    }

    this.startSynthBgm(mode);
  }

  private startExternalBgm(mode: Exclude<BgmMode, null>): boolean {
    if (this.mediaUnavailable.has(mode)) {
      return false;
    }

    const audio = this.getMediaAudio(mode);
    audio.currentTime = 0;
    audio.volume = 0;
    this.activeMediaAudio = audio;
    this.activeMediaMode = mode;

    void audio
      .play()
      .then(() => {
        this.monitorExternalBgm();
      })
      .catch((error: unknown) => {
        if (this.activeMediaAudio !== audio) {
          return;
        }
        if (isAutoplayError(error)) {
          this.activeMediaAudio = null;
          this.activeMediaMode = null;
          return;
        }
        this.mediaUnavailable.add(mode);
        this.activeMediaAudio = null;
        this.activeMediaMode = null;
        if (this.bgmMode === mode) {
          this.startSynthBgm(mode);
        }
      });

    return true;
  }

  private monitorExternalBgm(): void {
    if (!this.activeMediaAudio || !this.activeMediaMode || !this.canPlayBgm()) {
      this.mediaMonitorFrame = null;
      return;
    }

    const audio = this.activeMediaAudio;
    audio.volume = this.getMediaVolume(audio);

    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      const remaining = audio.duration - audio.currentTime;
      if (remaining <= 0.05) {
        audio.currentTime = 0;
        void audio.play().catch(() => undefined);
      }
    }

    this.mediaMonitorFrame = window.requestAnimationFrame(() => this.monitorExternalBgm());
  }

  private getMediaVolume(audio: HTMLAudioElement): number {
    const master = this.volumeToGain(this.settings.bgmVolume);
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
      return master;
    }

    const fadeInRatio = clamp(audio.currentTime / BGM_FADE_SECONDS, 0, 1);
    const fadeOutRatio = clamp((audio.duration - audio.currentTime) / BGM_FADE_SECONDS, 0, 1);
    return clamp(master * Math.min(fadeInRatio, fadeOutRatio), 0, 1);
  }

  private getMediaAudio(mode: Exclude<BgmMode, null>): HTMLAudioElement {
    const cached = this.mediaAudio.get(mode);
    if (cached) {
      return cached;
    }

    const sources = EXTERNAL_BGM_SOURCES[mode];
    const audio = new Audio(sources[0]);
    audio.preload = 'auto';
    audio.loop = false;
    audio.setAttribute('playsinline', 'true');
    audio.crossOrigin = 'anonymous';
    audio.addEventListener('error', () => {
      const currentIndex = this.mediaSourceIndex.get(mode) ?? 0;
      const nextIndex = currentIndex + 1;
      if (nextIndex < sources.length) {
        this.mediaSourceIndex.set(mode, nextIndex);
        audio.src = sources[nextIndex];
        audio.load();
        if (this.activeMediaMode === mode) {
          void audio.play().catch(() => undefined);
        }
        return;
      }
      this.mediaUnavailable.add(mode);
      if (this.activeMediaMode === mode) {
        this.activeMediaAudio = null;
        this.activeMediaMode = null;
        if (this.bgmMode === mode) {
          this.startSynthBgm(mode);
        }
      }
    });
    this.mediaSourceIndex.set(mode, 0);
    this.mediaAudio.set(mode, audio);
    return audio;
  }

  private resetExternalBgmSource(mode: Exclude<BgmMode, null>): void {
    this.mediaUnavailable.delete(mode);
    this.mediaSourceIndex.set(mode, 0);

    const cached = this.mediaAudio.get(mode);
    if (!cached) {
      return;
    }

    const primarySource = EXTERNAL_BGM_SOURCES[mode][0];
    if (!cached.src.endsWith(primarySource)) {
      cached.src = primarySource;
    }
    cached.load();
  }

  private playExternalSfx(kind: SfxKind): boolean {
    if (!this.canPlaySfx() || this.sfxUnavailable.has(kind)) {
      return false;
    }

    const audio = this.getSfxAudio(kind);
    audio.currentTime = 0;
    audio.volume = this.volumeToGain(this.settings.sfxVolume);
    void audio.play().catch((error: unknown) => {
      if (isAutoplayError(error)) {
        return;
      }
      this.sfxUnavailable.add(kind);
    });
    return true;
  }

  private getSfxAudio(kind: SfxKind): HTMLAudioElement {
    const cached = this.sfxAudio.get(kind);
    if (cached) {
      return cached;
    }

    const sources = EXTERNAL_SFX_SOURCES[kind];
    const audio = new Audio(sources[0]);
    audio.preload = 'auto';
    audio.loop = false;
    audio.setAttribute('playsinline', 'true');
    audio.crossOrigin = 'anonymous';
    audio.addEventListener('error', () => {
      const currentIndex = this.sfxSourceIndex.get(kind) ?? 0;
      const nextIndex = currentIndex + 1;
      if (nextIndex < sources.length) {
        this.sfxSourceIndex.set(kind, nextIndex);
        audio.src = sources[nextIndex];
        audio.load();
        return;
      }
      this.sfxUnavailable.add(kind);
    });
    this.sfxSourceIndex.set(kind, 0);
    this.sfxAudio.set(kind, audio);
    return audio;
  }

  private startSynthBgm(mode: Exclude<BgmMode, null>): void {
    const context = this.ensureContext();
    if (context.state !== 'running') {
      return;
    }

    this.activeMediaAudio = null;
    this.activeMediaMode = null;
    this.scheduleSynthBgmStep(mode);
  }

  private scheduleSynthBgmStep(mode: Exclude<BgmMode, null>): void {
    if (!this.canPlayBgm() || !this.context || this.context.state !== 'running' || this.bgmMode !== mode) {
      this.loopTimer = null;
      return;
    }

    const pattern = mode === 'menu' ? MENU_PATTERN : GAME_PATTERN;
    const step = pattern[this.bgmStep % pattern.length];
    const masterGain = this.volumeToGain(this.settings.bgmVolume);

    this.playTone(step.freq, step.duration * 0.92, step.type, step.gain * masterGain, step.freq, 0, false);
    if (mode === 'game') {
      this.playTone(step.freq * 2, step.duration * 0.65, 'sine', step.gain * masterGain * 0.42, step.freq * 2, 0, false);
    }

    this.bgmStep += 1;
    this.loopTimer = window.setTimeout(() => {
      this.scheduleSynthBgmStep(mode);
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
