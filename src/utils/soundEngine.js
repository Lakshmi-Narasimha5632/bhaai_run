// Web Audio API Sound Engine & Custom Audio File Player for Bhaai Run (Optimized)

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.bgmGain = null;
    this.isMuted = false;
    this.masterVolume = 0.8;
    this.sfxVolume = 0.9;
    this.bgmVolume = 0.6;
    this.bgmEnabled = true;
    this.sfxEnabled = true;

    // Custom sound buffer cache
    this.customAudioBuffers = {};
    this.customAudioUrls = {};

    // BGM state
    this.activeBgmNode = null;
    this.bgmInterval = null;
    this.bgmTrackName = 'bhaai_laugh';
    this.isBgmPlaying = false;
    this.coinPitchCounter = 0;
    this.activeGameOverAudio = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();
        this.bgmGain = this.ctx.createGain();

        this.sfxGain.connect(this.masterGain);
        this.bgmGain.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);

        this.updateVolumes();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  updateVolumes(settings = {}) {
    if (settings.masterVolume !== undefined) this.masterVolume = settings.masterVolume;
    if (settings.sfxVolume !== undefined) this.sfxVolume = settings.sfxVolume;
    if (settings.bgmVolume !== undefined) this.bgmVolume = settings.bgmVolume;
    if (settings.muted !== undefined) this.isMuted = settings.muted;
    if (settings.bgmEnabled !== undefined) this.bgmEnabled = settings.bgmEnabled;
    if (settings.sfxEnabled !== undefined) this.sfxEnabled = settings.sfxEnabled;

    if (!this.masterGain || !this.ctx) return;

    const t = this.ctx.currentTime;
    const targetMaster = this.isMuted ? 0 : this.masterVolume;
    const targetSfx = this.sfxEnabled ? this.sfxVolume : 0;
    const targetBgm = this.bgmEnabled ? this.bgmVolume : 0;

    this.masterGain.gain.setValueAtTime(targetMaster, t);
    this.sfxGain.gain.setValueAtTime(targetSfx, t);
    this.bgmGain.gain.setValueAtTime(targetBgm, t);

    if (this.activeBgmNode && typeof this.activeBgmNode.setVolume === 'function') {
      this.activeBgmNode.setVolume(this.isMuted ? 0 : this.masterVolume * this.bgmVolume);
    }
  }

  async loadCustomSound(type, url) {
    if (!url) {
      delete this.customAudioBuffers[type];
      delete this.customAudioUrls[type];
      return;
    }
    this.customAudioUrls[type] = url;
    try {
      this.init();
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      this.customAudioBuffers[type] = audioBuffer;
    } catch (err) {
      console.warn(`Could not decode custom sound for ${type}`, err);
    }
  }

  playCustomIfAvailable(type) {
    if (this.isMuted || !this.sfxEnabled) return true;
    const buffer = this.customAudioBuffers[type];
    if (buffer && this.ctx) {
      try {
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.sfxGain);
        source.onended = () => {
          try { source.disconnect(); } catch (e) {}
        };
        source.start(0);
        return true;
      } catch (e) {}
    }

    const url = this.customAudioUrls[type];
    if (url) {
      try {
        const audio = new Audio(url);
        audio.volume = this.isMuted ? 0 : this.masterVolume * this.sfxVolume;
        audio.play().catch(() => {});
        if (type === 'gameOver') {
          this.activeGameOverAudio = audio;
          audio.onended = () => {
            if (this.activeGameOverAudio === audio) this.activeGameOverAudio = null;
          };
        }
        return true;
      } catch (e) {}
    }
    return false;
  }

  // --- SYNTHESIZED SOUND EFFECTS WITH IMMEDIATE AUTO-DISCONNECT ---

  playJump() {
    this.init();
    if (this.playCustomIfAvailable('jump')) return;
    if (this.isMuted || !this.sfxEnabled || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(560, t + 0.18);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.onended = () => {
      try { osc.disconnect(); gain.disconnect(); } catch (e) {}
    };

    osc.start(t);
    osc.stop(t + 0.21);
  }

  playSlide() {
    this.init();
    if (this.playCustomIfAvailable('slide')) return;
    if (this.isMuted || !this.sfxEnabled || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.22);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.onended = () => {
      try { osc.disconnect(); gain.disconnect(); } catch (e) {}
    };

    osc.start(t);
    osc.stop(t + 0.25);
  }

  playCoin() {
    this.init();
    if (this.playCustomIfAvailable('coin')) return;
    if (this.isMuted || !this.sfxEnabled || !this.ctx) return;

    const t = this.ctx.currentTime;
    const baseFreqs = [987.77, 1174.66, 1318.51, 1567.98, 1760.00];
    const freq = baseFreqs[this.coinPitchCounter % baseFreqs.length];
    this.coinPitchCounter++;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.onended = () => {
      try { osc.disconnect(); gain.disconnect(); } catch (e) {}
    };

    osc.start(t);
    osc.stop(t + 0.16);
  }

  playTrainHorn() {
    this.init();
    if (this.playCustomIfAvailable('trainHorn')) return;
    if (this.isMuted || !this.sfxEnabled || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(261.63, t);
    osc2.frequency.setValueAtTime(329.63, t);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.08);
    gain.gain.setValueAtTime(0.35, t + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.onended = () => {
      try { osc1.disconnect(); osc2.disconnect(); gain.disconnect(); } catch (e) {}
    };

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.88);
    osc2.stop(t + 0.88);
  }

  playCollision() {
    this.init();
    if (this.playCustomIfAvailable('collision')) return;
    if (this.isMuted || !this.sfxEnabled || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.3);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.onended = () => {
      try { osc.disconnect(); gain.disconnect(); } catch (e) {}
    };

    osc.start(t);
    osc.stop(t + 0.38);
  }

  playPoliceWhistle() {
    this.init();
    if (this.isMuted || !this.sfxEnabled || !this.ctx) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(2600, t);
    osc2.frequency.setValueAtTime(2850, t);

    // Warble LFO for classic police/referee whistle
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(22, t);
    lfoGain.gain.setValueAtTime(140, t);
    lfo.connect(osc1.frequency);
    lfo.connect(osc2.frequency);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.4, t + 0.04);
    gain.gain.setValueAtTime(0.4, t + 0.45);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(t);
    osc2.start(t);
    lfo.start(t);

    osc1.stop(t + 0.68);
    osc2.stop(t + 0.68);
    lfo.stop(t + 0.68);

    osc1.onended = () => {
      try {
        osc1.disconnect();
        osc2.disconnect();
        lfo.disconnect();
        lfoGain.disconnect();
        gain.disconnect();
      } catch (e) {}
    };
  }

  stopGameOverAudio() {
    if (this.activeGameOverAudio) {
      try {
        this.activeGameOverAudio.pause();
        this.activeGameOverAudio.currentTime = 0;
      } catch (e) {}
      this.activeGameOverAudio = null;
    }
  }

  playGameOver() {
    this.init();
    this.stopGameOverAudio();

    if (this.playCustomIfAvailable('gameOver')) return;

    // Play Bhaai Dialogue after getting out!
    try {
      const audio = new Audio('/bhaai_dialogue_gameover.mp3');
      audio.volume = this.isMuted ? 0 : this.masterVolume * this.sfxVolume;
      audio.play().catch(() => {});
      this.activeGameOverAudio = audio;
      audio.onended = () => {
        if (this.activeGameOverAudio === audio) {
          this.activeGameOverAudio = null;
        }
      };
      return;
    } catch (e) {
      console.warn('Failed to play bhaai_dialogue_gameover.mp3, falling back to synth:', e);
    }

    if (this.isMuted || !this.sfxEnabled || !this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [293.66, 277.18, 261.63, 246.94];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.2;
      const end = start + 0.24;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, start);
      if (idx === notes.length - 1) {
        osc.frequency.linearRampToValueAtTime(freq - 15, end + 0.15);
      }

      gain.gain.setValueAtTime(0.25, start);
      gain.gain.exponentialRampToValueAtTime(0.001, end);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.onended = () => {
        try { osc.disconnect(); gain.disconnect(); } catch (e) {}
      };

      osc.start(start);
      osc.stop(end + 0.05);
    });
  }

  playPowerup() {
    this.init();
    if (this.playCustomIfAvailable('powerup')) return;
    if (this.isMuted || !this.sfxEnabled || !this.ctx) return;

    const t = this.ctx.currentTime;
    const arpeggio = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    arpeggio.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.05;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.25, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.onended = () => {
        try { osc.disconnect(); gain.disconnect(); } catch (e) {}
      };

      osc.start(start);
      osc.stop(start + 0.22);
    });
  }

  playShieldBreak() {
    this.init();
    if (this.isMuted || !this.sfxEnabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.2);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.onended = () => {
      try { osc.disconnect(); gain.disconnect(); } catch (e) {}
    };
    osc.start(t);
    osc.stop(t + 0.25);
  }

  // --- PROCEDURAL BGM ---

  startBGM(trackName = 'bhaai_laugh') {
    this.init();
    this.stopBGM();
    this.bgmTrackName = trackName;
    this.isBgmPlaying = true;

    // 1. If bhaai_laugh is selected (Default BGM), play the iconic /bhaai_laugh_bgm.mp3 looping!
    if (trackName === 'bhaai_laugh' || !trackName) {
      try {
        const audio = new Audio('/bhaai_laugh_bgm.mp3');
        audio.loop = true;
        audio.volume = this.isMuted ? 0 : this.masterVolume * this.bgmVolume;
        audio.play().catch(() => {});
        this.activeBgmNode = {
          stop: () => {
            try {
              audio.pause();
              audio.currentTime = 0;
            } catch (e) {}
          },
          setVolume: (vol) => {
            try { audio.volume = vol; } catch (e) {}
          }
        };
        return;
      } catch (e) {
        console.warn('Failed to play bhaai_laugh_bgm.mp3, falling back:', e);
      }
    }

    const customBgmBuffer = this.customAudioBuffers['bgm'];
    const customBgmUrl = this.customAudioUrls['bgm'];

    if (customBgmBuffer && this.ctx) {
      try {
        const source = this.ctx.createBufferSource();
        source.buffer = customBgmBuffer;
        source.loop = true;
        source.connect(this.bgmGain);
        source.start(0);
        this.activeBgmNode = source;
        return;
      } catch (e) {}
    }

    if (customBgmUrl) {
      try {
        const audio = new Audio(customBgmUrl);
        audio.loop = true;
        audio.volume = this.isMuted ? 0 : this.masterVolume * this.bgmVolume;
        audio.play().catch(() => {});
        this.activeBgmNode = {
          stop: () => {
            try {
              audio.pause();
              audio.currentTime = 0;
            } catch (e) {}
          },
          setVolume: (vol) => {
            try { audio.volume = vol; } catch (e) {}
          }
        };
        return;
      } catch (e) {}
    }

    this.startProceduralBGM(trackName);
  }

  startProceduralBGM(style) {
    if (!this.ctx) return;
    let step = 0;
    const tempo = style === 'retro_arcade' ? 140 : style === 'cyber_groove' ? 128 : 132;
    const stepDuration = 60 / tempo / 4;

    const bassNotes = [110, 110, 130.81, 146.83, 110, 110, 164.81, 146.83];
    const leadNotes = [440, 523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25];

    const playStep = () => {
      if (!this.isBgmPlaying || !this.ctx) return;

      const t = this.ctx.currentTime;

      // Kick
      if (step % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(140, t);
        kickOsc.frequency.exponentialRampToValueAtTime(38, t + 0.1);
        kickGain.gain.setValueAtTime(0.3, t);
        kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        kickOsc.connect(kickGain);
        kickGain.connect(this.bgmGain);
        kickOsc.onended = () => {
          try { kickOsc.disconnect(); kickGain.disconnect(); } catch (e) {}
        };
        kickOsc.start(t);
        kickOsc.stop(t + 0.14);
      }

      // Snare
      if (step % 8 === 4) {
        const snareOsc = this.ctx.createOscillator();
        const snareGain = this.ctx.createGain();
        snareOsc.type = 'triangle';
        snareOsc.frequency.setValueAtTime(200, t);
        snareOsc.frequency.exponentialRampToValueAtTime(70, t + 0.08);
        snareGain.gain.setValueAtTime(0.18, t);
        snareGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        snareOsc.connect(snareGain);
        snareGain.connect(this.bgmGain);
        snareOsc.onended = () => {
          try { snareOsc.disconnect(); snareGain.disconnect(); } catch (e) {}
        };
        snareOsc.start(t);
        snareOsc.stop(t + 0.11);
      }

      // Bassline
      if (step % 2 === 0) {
        const bassFreq = bassNotes[(step / 2) % bassNotes.length];
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = style === 'retro_arcade' ? 'square' : 'sawtooth';
        bassOsc.frequency.setValueAtTime(bassFreq, t);
        bassGain.gain.setValueAtTime(0.15, t);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + stepDuration * 1.8);
        bassOsc.connect(bassGain);
        bassGain.connect(this.bgmGain);
        bassOsc.onended = () => {
          try { bassOsc.disconnect(); bassGain.disconnect(); } catch (e) {}
        };
        bassOsc.start(t);
        bassOsc.stop(t + stepDuration * 2);
      }

      // Lead melody
      if (step % 4 === 2) {
        const leadFreq = leadNotes[Math.floor(step / 2) % leadNotes.length];
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        leadOsc.type = 'triangle';
        leadOsc.frequency.setValueAtTime(leadFreq, t);
        leadGain.gain.setValueAtTime(0.1, t);
        leadGain.gain.exponentialRampToValueAtTime(0.001, t + stepDuration * 2.2);
        leadOsc.connect(leadGain);
        leadGain.connect(this.bgmGain);
        leadOsc.onended = () => {
          try { leadOsc.disconnect(); leadGain.disconnect(); } catch (e) {}
        };
        leadOsc.start(t);
        leadOsc.stop(t + stepDuration * 2.4);
      }

      step = (step + 1) % 64;
    };

    this.bgmInterval = setInterval(playStep, stepDuration * 1000);
  }

  stopBGM() {
    this.isBgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    if (this.activeBgmNode) {
      try {
        if (typeof this.activeBgmNode.stop === 'function') {
          this.activeBgmNode.stop();
        }
      } catch (e) {}
      this.activeBgmNode = null;
    }
  }

  previewSound(eventType) {
    switch (eventType) {
      case 'jump': this.playJump(); break;
      case 'slide': this.playSlide(); break;
      case 'coin': this.playCoin(); break;
      case 'trainHorn': this.playTrainHorn(); break;
      case 'collision': this.playCollision(); break;
      case 'gameOver': this.playGameOver(); break;
      case 'powerup': this.playPowerup(); break;
      case 'bgm':
        this.startBGM(this.bgmTrackName);
        setTimeout(() => this.stopBGM(), 3500);
        break;
      default: break;
    }
  }
}

export const soundManager = new SoundEngine();
