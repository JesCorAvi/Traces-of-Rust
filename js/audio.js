// Audio sintetizado con WebAudio (osciladores, ruido y helpers de UI).
// Exports: AudioSys.
export const AudioSys = {
  ctx: null,
  humOsc: null,
  humGain: null,
  masterVol: 0.85,
  sfxVol: 0.9,
  ambVol: 0.8,
  muted: false,
  isEndgameActive: false,

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
      this.humOsc.connect(filter);
      filter.connect(this.humGain);
      this.humGain.connect(this.ctx.destination);
      this.humOsc.start();
    }
    this.updateDroneVolume();
  },

  applySettings(settings = {}) {
    if (typeof settings.masterVol === 'number') this.masterVol = settings.masterVol;
    if (typeof settings.sfxVol === 'number') this.sfxVol = settings.sfxVol;
    if (typeof settings.ambVol === 'number') this.ambVol = settings.ambVol;
    if (typeof settings.muted === 'boolean') this.muted = settings.muted;
    this.updateDroneVolume();
  },

  updateDroneVolume() {
    if (!this.humGain || !this.ctx) return;
    const base = this.isEndgameActive ? 0.055 : 0.024;
    const finalGain = this.muted ? 0 : base * this.masterVol * this.ambVol;
    this.humGain.gain.setValueAtTime(finalGain, this.ctx.currentTime);
  },

  setEndgameDrone(active) {
    this.isEndgameActive = active;
    if (!this.humOsc || !this.ctx) return;
    this.humOsc.frequency.setValueAtTime(active ? 38 : 56, this.ctx.currentTime);
    this.updateDroneVolume();
  },

  play(freq = 180, dur = 0.12, type = 'sawtooth', vol = 0.06) {
    if (!this.ctx || this.muted) return;
    const effectiveVol = vol * this.masterVol * this.sfxVol;
    if (effectiveVol <= 0.0005) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(26, freq * 0.3), now + dur);
    gain.gain.setValueAtTime(effectiveVol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + dur);
  },

  // Clic metálico seco al pasar por encima de botones o tarjetas
  playUIClick() {
    this.play(720, 0.028, 'square', 0.03);
    setTimeout(() => this.play(310, 0.02, 'triangle', 0.025), 12);
  },

  // Interruptor pesado al confirmar o pulsar un botón
  playUISelect() {
    this.play(190, 0.08, 'sawtooth', 0.065);
    setTimeout(() => this.play(420, 0.07, 'square', 0.045), 35);
  },

  // Zumbido grave cuando un botón está desactivado o sin dientes suficientes
  playUIError() {
    this.play(95, 0.14, 'sawtooth', 0.06);
    setTimeout(() => this.play(72, 0.16, 'square', 0.05), 55);
  },

  // Relé mecánico al pausar o reanudar partida
  playPause() {
    this.play(260, 0.06, 'square', 0.045);
    setTimeout(() => this.play(140, 0.09, 'sawtooth', 0.04), 40);
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