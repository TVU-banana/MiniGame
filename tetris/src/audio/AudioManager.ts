import type { BgmType } from "./AudioKeys";

interface ActiveBgm {
  source: OscillatorNode;
  gain: GainNode;
  lfo: OscillatorNode;
  lfoGain: GainNode;
}

export class AudioManager {
  private context: AudioContext | null = null;
  private activeBgm: ActiveBgm | null = null;
  private enabled = true;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stopBgm();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  unlockFromGesture(): void {
    const context = this.ensureContext();
    if (!context) {
      return;
    }
    if (context.state === "suspended") {
      void context.resume();
    }
  }

  startMenuBgm(): void {
    this.startBgm("menu");
  }

  startGameBgm(): void {
    this.startBgm("game");
  }

  stopBgm(): void {
    if (!this.activeBgm) {
      return;
    }
    this.activeBgm.source.stop();
    this.activeBgm.lfo.stop();
    this.activeBgm.source.disconnect();
    this.activeBgm.lfo.disconnect();
    this.activeBgm.gain.disconnect();
    this.activeBgm.lfoGain.disconnect();
    this.activeBgm = null;
  }

  playLockSfx(): void {
    this.playSfx(380, 0.08, "square");
  }

  playLineClearSfx(): void {
    this.playSfx(620, 0.12, "triangle");
    this.playSfx(860, 0.09, "triangle", 0.05);
  }

  private startBgm(type: BgmType): void {
    if (!this.enabled) {
      return;
    }
    const context = this.ensureContext();
    if (!context || context.state !== "running") {
      return;
    }
    this.stopBgm();

    const source = context.createOscillator();
    const gain = context.createGain();
    const lfo = context.createOscillator();
    const lfoGain = context.createGain();

    if (type === "menu") {
      source.type = "triangle";
      source.frequency.value = 196;
      lfo.frequency.value = 0.25;
      lfoGain.gain.value = 12;
      gain.gain.value = 0.03;
    } else {
      source.type = "sawtooth";
      source.frequency.value = 128;
      lfo.frequency.value = 0.35;
      lfoGain.gain.value = 8;
      gain.gain.value = 0.035;
    }

    lfo.connect(lfoGain);
    lfoGain.connect(source.frequency);
    source.connect(gain);
    gain.connect(context.destination);

    source.start();
    lfo.start();

    this.activeBgm = { source, gain, lfo, lfoGain };
  }

  private playSfx(
    frequency: number,
    durationSeconds: number,
    type: OscillatorType,
    delaySeconds = 0
  ): void {
    if (!this.enabled) {
      return;
    }
    const context = this.ensureContext();
    if (!context || context.state !== "running") {
      return;
    }

    const now = context.currentTime + delaySeconds;
    const osc = context.createOscillator();
    const gain = context.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

    osc.connect(gain);
    gain.connect(context.destination);

    osc.start(now);
    osc.stop(now + durationSeconds + 0.03);
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") {
      return null;
    }
    if (!this.context) {
      const Ctor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) {
        return null;
      }
      this.context = new Ctor();
    }
    return this.context;
  }
}

export const audioManager = new AudioManager();
