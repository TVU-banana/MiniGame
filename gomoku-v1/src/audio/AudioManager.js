import { GAME_THEME, MENU_THEME } from "./bgmThemes.js";
import { BUTTON_SFX, PLACE_SFX, VICTORY_SFX } from "./sfxPresets.js";

const NOTE_FREQUENCIES = {
  B1: 61.74,
  C2: 65.41,
  D2: 73.42,
  E2: 82.41,
  F2: 87.31,
  G2: 98,
  A2: 110,
  C3: 130.81,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  G5: 783.99,
  A5: 880,
  C6: 1046.5,
};

export default class AudioManager {
  constructor() {
    this.context = null;
    this.enabled = true;
    this.unlocked = false;
    this.currentScene = null;
    this.scheduler = null;
    this.nextStepTime = 0;
    this.stepIndex = 0;
    this.masterGain = null;
    this.sceneGain = null;
    this.sfxGain = null;
  }

  async unlock() {
    if (!this.context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        return;
      }
      this.context = new AudioContextClass();
      this.masterGain = this.context.createGain();
      this.sceneGain = this.context.createGain();
      this.sfxGain = this.context.createGain();

      this.masterGain.gain.value = 0.92;
      this.sceneGain.gain.value = 0.42;
      this.sfxGain.gain.value = 1;

      this.sceneGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.context.destination);
    }

    if (this.context.state === "suspended") {
      await this.context.resume();
    }

    this.unlocked = true;
  }

  setEnabled(enabled) {
    this.enabled = enabled;

    if (!enabled) {
      this.stopScene();
      if (this.sfxGain) {
        this.sfxGain.gain.value = 0;
      }
      return;
    }

    if (this.sfxGain) {
      this.sfxGain.gain.value = 1;
    }

    if (this.currentScene) {
      this.playScene(this.currentScene);
    }
  }

  playScene(scene) {
    this.currentScene = scene;

    if (!this.enabled || !this.unlocked || !this.context) {
      return;
    }

    this.stopScene();

    this.stepIndex = 0;
    this.nextStepTime = this.context.currentTime + 0.05;
    const theme = scene === "menu" ? MENU_THEME : GAME_THEME;
    const stepDuration = 60 / theme.bpm / 2;

    this.scheduler = window.setInterval(() => {
      const now = this.context.currentTime;

      while (this.nextStepTime < now + 0.22) {
        this.#scheduleThemeStep(theme, this.stepIndex, this.nextStepTime, stepDuration);
        this.nextStepTime += stepDuration;
        this.stepIndex = (this.stepIndex + 1) % theme.melody.length;
      }
    }, 80);

    this.sceneGain.gain.setValueAtTime(0.0001, this.context.currentTime);
    this.sceneGain.gain.linearRampToValueAtTime(0.42, this.context.currentTime + 0.12);
  }

  stopScene() {
    if (this.scheduler) {
      window.clearInterval(this.scheduler);
      this.scheduler = null;
    }

    if (this.context && this.sceneGain) {
      const now = this.context.currentTime;
      this.sceneGain.gain.cancelScheduledValues(now);
      this.sceneGain.gain.setValueAtTime(this.sceneGain.gain.value, now);
      this.sceneGain.gain.linearRampToValueAtTime(0.0001, now + 0.06);
    }
  }

  playButton() {
    this.#playSweep(BUTTON_SFX);
  }

  playPlace() {
    this.#playSweep(PLACE_SFX);
  }

  playVictory() {
    if (!this.#canPlay()) {
      return;
    }

    const startTime = this.context.currentTime + 0.02;

    VICTORY_SFX.notes.forEach((note, index) => {
      const time = startTime + index * VICTORY_SFX.noteDuration;
      this.#playTone(
        NOTE_FREQUENCIES[note],
        time,
        VICTORY_SFX.noteDuration * 0.95,
        VICTORY_SFX.volume,
        VICTORY_SFX.wave,
        this.sfxGain,
      );
    });
  }

  #canPlay() {
    return Boolean(this.context && this.enabled && this.unlocked);
  }

  #scheduleThemeStep(theme, stepIndex, startTime, stepDuration) {
    if (!this.#canPlay()) {
      return;
    }

    const melodyFrequency = NOTE_FREQUENCIES[theme.melody[stepIndex]];
    const bassFrequency = NOTE_FREQUENCIES[theme.bass[stepIndex]];
    const pulse = theme.pulse[stepIndex];

    this.#playTone(melodyFrequency, startTime, stepDuration * 0.86, 0.045, theme.leadWave, this.sceneGain);
    this.#playTone(bassFrequency, startTime, stepDuration * 0.92, 0.035, theme.bassWave, this.sceneGain);

    if (pulse > 0) {
      this.#playTone(120, startTime, stepDuration * 0.4, 0.02 * pulse, "square", this.sceneGain);
    }
  }

  #playSweep(preset) {
    if (!this.#canPlay()) {
      return;
    }

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    const now = this.context.currentTime + 0.01;

    oscillator.type = preset.wave;
    oscillator.frequency.setValueAtTime(preset.startFrequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(preset.endFrequency, 40), now + preset.duration);

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(preset.volume, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + preset.duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.sfxGain);
    oscillator.start(now);
    oscillator.stop(now + preset.duration + 0.02);
  }

  #playTone(frequency, startTime, duration, volume, wave, targetGain) {
    if (!this.#canPlay()) {
      return;
    }

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(frequency, startTime);

    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(volume, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(targetGain);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.02);
  }
}
