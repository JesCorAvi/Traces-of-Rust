export const AudioSys = {
  ctx: null,
  humOsc: null,

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();

    // Zumbido constante de fluorescente industrial defectuoso
    if (!this.humOsc) {
      this.humOsc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      this.humOsc.type = 'sawtooth';
      this.humOsc.frequency.value = 58;
      filter.type = 'lowpass';
      filter.frequency.value = 160;
      gain.gain.value = 0.025;
      this.humOsc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      this.humOsc.start();
    }
  },

  play(freq = 180, dur = 0.12, type = 'sawtooth', vol = 0.06) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(28, freq * 0.3), now + dur);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + dur);
  },

  playScare() {
    if (!this.ctx) return;
    // Acorde metálico disonante para sustos bruscos
    [92, 138, 215, 590].forEach(f => this.play(f, 0.38, 'sawtooth', 0.06));
  }
};