export const AudioSys = {
  ctx: null,
  humOsc: null,
  humGain: null,

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();

    if (!this.humOsc) {
      this.humOsc = this.ctx.createOscillator();
      this.humGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      this.humOsc.type = 'sawtooth';
      this.humOsc.frequency.value = 56;
      filter.type = 'lowpass';
      filter.frequency.value = 155;
      this.humGain.gain.value = 0.024;
      this.humOsc.connect(filter);
      filter.connect(this.humGain);
      this.humGain.connect(this.ctx.destination);
      this.humOsc.start();
    }
  },

  setEndgameDrone(active) {
    if (!this.humOsc || !this.ctx) return;
    this.humOsc.frequency.setValueAtTime(active ? 38 : 56, this.ctx.currentTime);
    this.humGain.gain.setValueAtTime(active ? 0.055 : 0.024, this.ctx.currentTime);
  },

  play(freq = 180, dur = 0.12, type = 'sawtooth', vol = 0.06) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(26, freq * 0.3), now + dur);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + dur);
  },

  playUIClick() {
    this.play(680, 0.035, 'square', 0.035);
  },

  playUISelect() {
    this.play(220, 0.09, 'sawtooth', 0.06);
    setTimeout(() => this.play(440, 0.08, 'square', 0.04), 35);
  },

  playReroll() {
    [320, 240, 480].forEach((f, i) => {
      setTimeout(() => this.play(f, 0.07, 'triangle', 0.06), i * 45);
    });
  },

  playBossHorn() {
    if (!this.ctx) return;
    [65, 98, 130].forEach(f => this.play(f, 0.85, 'sawtooth', 0.07));
  },

  playScare() {
    if (!this.ctx) return;
    [92, 138, 215, 590].forEach(f => this.play(f, 0.35, 'sawtooth', 0.05));
  }
};