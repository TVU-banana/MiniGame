export class AudioManager {
  constructor() {
    this.enabled = true;
    this.context = null;
    this.master = null;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  activate() {
    this.ensureContext();
  }

  ensureContext() {
    if (!this.enabled || typeof window === "undefined") {
      return null;
    }

    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        return null;
      }
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0.28;
      this.master.connect(this.context.destination);
    }

    if (this.context.state === "suspended") {
      this.context.resume();
    }

    return this.context;
  }

  playTone({ frequency, duration, type = "sine", gain = 0.14, attack = 0.01 }) {
    const context = this.ensureContext();
    if (!context || !this.master) {
      return;
    }

    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    envelope.gain.setValueAtTime(0.0001, context.currentTime);
    envelope.gain.linearRampToValueAtTime(gain, context.currentTime + attack);
    envelope.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);

    oscillator.connect(envelope);
    envelope.connect(this.master);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }

  playPlace() {
    this.playTone({ frequency: 360, duration: 0.12, type: "triangle", gain: 1.8, attack: 0.004 });
  }

  playWin() {
    this.playTone({ frequency: 440, duration: 0.2, type: "triangle", gain: 0.45 });
    this.playTone({ frequency: 660, duration: 0.3, type: "sine", gain: 0.26, attack: 0.03 });
  }

  playClick() {
    this.playTone({ frequency: 240, duration: 0.07, type: "square", gain: 0.2 });
  }
}
