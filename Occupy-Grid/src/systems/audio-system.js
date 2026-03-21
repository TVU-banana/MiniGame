(function () {
  const ns = window.OccupyGrid;

  class AudioSystem {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
      this.bgmGain = null;
      this.sfxGain = null;
      this.bgmTimer = null;
      this.sequenceIndex = 0;
      this.settings = {
        bgmVolume: 0.35,
        sfxVolume: 0.7
      };
    }

    applySettings(settings) {
      this.settings.bgmVolume = settings.bgmVolume;
      this.settings.sfxVolume = settings.sfxVolume;
      if (this.bgmGain) {
        this.bgmGain.gain.value = this.settings.bgmVolume;
      }
      if (this.sfxGain) {
        this.sfxGain.gain.value = this.settings.sfxVolume;
      }
    }

    unlock() {
      this.ensureContext();
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume();
      }
    }

    ensureContext() {
      if (this.ctx) {
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) {
        return;
      }
      this.ctx = new AC();
      this.masterGain = this.ctx.createGain();
      this.bgmGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.9;
      this.bgmGain.gain.value = this.settings.bgmVolume;
      this.sfxGain.gain.value = this.settings.sfxVolume;
      this.bgmGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }

    startMenuBgm() {
      this.startBgm([220, 330, 277, 392], 0.38);
    }

    startGameBgm() {
      this.startBgm([196, 262, 330, 294, 392, 349], 0.24);
    }

    startBgm(notes, intervalSec) {
      this.stopBgm();
      this.ensureContext();
      if (!this.ctx || !this.bgmGain) {
        return;
      }
      this.sequenceIndex = 0;
      this.bgmTimer = window.setInterval(() => {
        const note = notes[this.sequenceIndex % notes.length];
        this.sequenceIndex += 1;
        this.playTone(note, intervalSec, "triangle", 0.028, this.bgmGain);
      }, Math.floor(intervalSec * 1000));
    }

    stopBgm() {
      if (this.bgmTimer !== null) {
        window.clearInterval(this.bgmTimer);
        this.bgmTimer = null;
      }
    }

    playButton() {
      this.ensureContext();
      this.playTone(520, 0.06, "square", 0.06, this.sfxGain);
    }

    playCapture() {
      this.ensureContext();
      this.playTone(330, 0.09, "triangle", 0.08, this.sfxGain);
      this.playTone(560, 0.12, "triangle", 0.06, this.sfxGain);
    }

    playExplosion() {
      this.ensureContext();
      this.playTone(160, 0.22, "sawtooth", 0.09, this.sfxGain);
      this.playTone(95, 0.28, "square", 0.06, this.sfxGain);
    }

    playTone(freq, durationSec, waveType, gainValue, targetGain) {
      if (!this.ctx || !targetGain || gainValue <= 0) {
        return;
      }
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = waveType;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);
      osc.connect(gain);
      gain.connect(targetGain);
      osc.start(now);
      osc.stop(now + durationSec + 0.02);
    }
  }

  ns.AudioSystem = AudioSystem;
})();
