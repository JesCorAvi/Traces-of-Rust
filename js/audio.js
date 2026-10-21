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

  // Convierte los ajustes persistidos (volúmenes 0-100) a la mezcla interna 0-1.
  applyGameSettings(settings = {}) {
    const level = (value, fallback) => {
      const n = Number(value);
      return Number.isFinite(n) ? Math.max(0, Math.min(1, n / 100)) : fallback;
    };
    this.applySettings({
      masterVol: level(settings.masterVol, this.masterVol),
      sfxVol: level(settings.sfxVol, this.sfxVol),
      ambVol: level(settings.ambVol, this.ambVol),
      muted: !!settings.muted
    });
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
  },
  // Sonido contundente de apagón / caída abatido
  playPlayerDowned() {
    if (!this.ctx || this.muted) return;
    this.play(65, 0.55, 'sawtooth', 0.16);
    setTimeout(() => this.play(38, 0.7, 'square', 0.14), 40);
    setTimeout(() => this.play(26, 0.9, 'sine', 0.2), 90);
  },

  // Zumbido grave continuo durante los 5s de reconstrucción
  startPlayerDownHum() {
    if (!this.ctx || this.muted || this.playerDownHumGain) return;
    try {
      this.playerDownHumOsc = this.ctx.createOscillator();
      this.playerDownHumGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 95;

      this.playerDownHumOsc.type = 'sawtooth';
      this.playerDownHumOsc.frequency.setValueAtTime(44, this.ctx.currentTime);
      this.playerDownHumGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.playerDownHumGain.gain.linearRampToValueAtTime(0.09 * this.masterVol * this.sfxVol, this.ctx.currentTime + 0.3);

      this.playerDownHumOsc.connect(filter);
      filter.connect(this.playerDownHumGain);
      this.playerDownHumGain.connect(this.ctx.destination);
      this.playerDownHumOsc.start();
    } catch (e) {
      console.warn('[Audio] Error al iniciar hum de reconstrucción:', e);
    }
  },

  stopPlayerDownHum() {
    if (!this.playerDownHumOsc || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      this.playerDownHumGain?.gain?.linearRampToValueAtTime(0.0001, now + 0.2);
      this.playerDownHumOsc.stop(now + 0.22);
      setTimeout(() => {
        this.playerDownHumOsc = null;
        this.playerDownHumGain = null;
      }, 250);
    } catch (e) {
      this.playerDownHumOsc = null;
      this.playerDownHumGain = null;
    }
  },

  // Sonido de reactivación / revivir
  playPlayerRevived() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.42);
    gain.gain.setValueAtTime(0.12 * this.masterVol * this.sfxVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);
    setTimeout(() => this.play(780, 0.18, 'sine', 0.1), 380);
  },

  // Alarma táctica para aviso de compañero abatido
  playTacticalAlarm() {
    if (!this.ctx || this.muted) return;
    this.play(880, 0.12, 'square', 0.1);
    setTimeout(() => this.play(580, 0.12, 'square', 0.1), 110);
    setTimeout(() => this.play(880, 0.18, 'sawtooth', 0.12), 220);
  },

  // Impulso neumático y desplazamiento de aire al esquivar (Dash)
  playDash() {
    if (!this.ctx || this.muted) return;
    try {
      const now = this.ctx.currentTime;
      const effectiveVol = 0.13 * this.masterVol * this.sfxVol;
      if (effectiveVol <= 0.0005) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(460, now);
      filter.frequency.exponentialRampToValueAtTime(120, now + 0.18);
      filter.Q.value = 1.8;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.20);

      gain.gain.setValueAtTime(effectiveVol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.20);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.20);

      this.play(130, 0.14, 'triangle', 0.08);
    } catch (e) {
      this.play(260, 0.16, 'sawtooth', 0.08);
    }
  },

  // Sirena industrial para eventos y alertas críticas
  playIndustrialSiren() {
    if (!this.ctx || this.muted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 420;
      filter.Q.value = 2.5;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.linearRampToValueAtTime(490, now + 0.7);
      osc.frequency.linearRampToValueAtTime(290, now + 1.4);
      osc.frequency.linearRampToValueAtTime(520, now + 2.1);
      osc.frequency.linearRampToValueAtTime(240, now + 2.8);

      const effectiveVol = 0.14 * this.masterVol * this.sfxVol;
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(effectiveVol, now + 0.2);
      gain.gain.setValueAtTime(effectiveVol, now + 2.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 3.0);
    } catch (e) {
      this.play(260, 0.8, 'sawtooth', 0.1);
    }
  }

};
