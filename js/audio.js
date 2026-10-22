// Audio procedural: buses de mezcla, reverb industrial, saturación, música
// adaptativa y SFX multicapa sintetizados en tiempo real con WebAudio.
// Exports: AudioSys, MUSIC_STATES, setupAudioUI.

export const MUSIC_STATES = Object.freeze({
  MENU: 'MENU',
  PREP: 'PREP',
  COMBAT: 'COMBAT',
  CLIMAX: 'CLIMAX'
});

const clamp01 = value => Math.max(0, Math.min(1, Number(value) || 0));

const MUSIC_MIX = Object.freeze({
  MENU:   { menu: 1.0, prep: 0.0,  combat: 0.0,  climax: 0.0 },
  PREP:   { menu: 0.08, prep: 1.0, combat: 0.0,  climax: 0.0 },
  COMBAT: { menu: 0.0, prep: 0.22, combat: 1.0,  climax: 0.0 },
  CLIMAX: { menu: 0.0, prep: 0.12, combat: 0.62, climax: 1.0 }
});

const MUSIC_BPM = Object.freeze({
  MENU: 58,
  PREP: 62,
  COMBAT: 106,
  CLIMAX: 136
});

// Escala menor armónica (semitonos) usada por la racha de pickups.
const PICKUP_SCALE = [0, 2, 3, 5, 7, 8, 11, 12, 14, 15, 17, 19, 20, 23, 24];

export const AudioSys = {
  ctx: null,
  masterGain: null,
  compressor: null,
  musicGain: null,
  sfxGain: null,
  ambienceGain: null,
  uiGain: null,
  musicFilter: null,
  ambienceFilter: null,
  reverb: null,
  reverbReturn: null,
  noiseBuffer: null,
  pinkBuffer: null,

  // Hum legado del ambiente/menú de reconstrucción.
  humOsc: null,
  humGain: null,

  masterVol: 0.85,
  sfxVol: 0.9,
  ambVol: 0.8,
  musicVol: 0.7,
  muted: false,
  isDemoSilent: true,
  isEndgameActive: false,
  musicState: MUSIC_STATES.MENU,
  menuFiltered: false,

  maxVoices: 72,

  _graphReady: false,
  _activeVoices: new Set(),
  _lastPlayed: Object.create(null),
  _musicLayers: null,
  _musicTimer: null,
  _musicStep: 0,
  _nextMusicTime: 0,
  _bossMusicActive: false,
  _listener: { x: 0, y: 0, z: 0, rightX: 1, rightZ: 0 },
  _pickupStreak: 0,
  _lastPickupAt: -10,

  init() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      try {
        this.ctx = new Ctx({ latencyHint: 'interactive' });
      } catch (e) {
        console.warn('[Audio] No se pudo crear el AudioContext:', e);
        return;
      }
    }

    if (this.ctx.state === 'suspended') {
      try {
        Promise.resolve(this.ctx.resume()).catch(() => {});
      } catch (e) {}
    }

    if (this._graphReady) {
      this._applyVolumes();
      return;
    }

    try {
      this._buildGraph();
      this._startLegacyHum();
      this._startMusicEngine();
      this._graphReady = true;
      this._applyVolumes();
      this.setMusicState(this.musicState, { immediate: true });
    } catch (e) {
      console.warn('[Audio] Error al inicializar el grafo de audio:', e);
    }
  },

  // ---------------------------------------------------------------------------
  // Grafo de mezcla
  // ---------------------------------------------------------------------------

  _buildGraph() {
    const ctx = this.ctx;

    const master = ctx.createGain();
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -16;
    compressor.knee.value = 18;
    compressor.ratio.value = 6;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.24;

    master.connect(compressor);
    compressor.connect(ctx.destination);
    this.masterGain = master;
    this.compressor = compressor;

    const music = ctx.createGain();
    this.musicFilter = ctx.createBiquadFilter();
    this.musicFilter.type = 'lowpass';
    this.musicFilter.frequency.value = 20000;
    this.musicFilter.Q.value = 0.5;
    music.connect(this.musicFilter);
    this.musicFilter.connect(master);
    this.musicGain = music;

    const sfx = ctx.createGain();
    sfx.connect(master);
    this.sfxGain = sfx;

    const ambience = ctx.createGain();
    this.ambienceFilter = ctx.createBiquadFilter();
    this.ambienceFilter.type = 'lowpass';
    this.ambienceFilter.frequency.value = 20000;
    this.ambienceFilter.Q.value = 0.4;
    ambience.connect(this.ambienceFilter);
    this.ambienceFilter.connect(master);
    this.ambienceGain = ambience;

    const ui = ctx.createGain();
    ui.connect(master);
    this.uiGain = ui;

    this.noiseBuffer = this._createNoiseBuffer(false);
    this.pinkBuffer = this._createNoiseBuffer(true);

    // Reverb industrial metálica generada en memoria.
    const impulse = this._createImpulseResponse(2.5, 2.7);
    const convolver = ctx.createConvolver();
    convolver.buffer = impulse;
    convolver.normalize = false;
    const reverbReturn = ctx.createGain();
    reverbReturn.gain.value = 0.55;
    convolver.connect(reverbReturn);
    reverbReturn.connect(master);
    this.reverb = convolver;
    this.reverbReturn = reverbReturn;

    const sfxSend = ctx.createGain();
    sfxSend.gain.value = 0.16;
    sfx.connect(sfxSend);
    sfxSend.connect(convolver);

    const musicSend = ctx.createGain();
    musicSend.gain.value = 0.22;
    this.musicFilter.connect(musicSend);
    musicSend.connect(convolver);

    // Saturación cálida en paralelo sobre el bus de efectos.
    const satSend = ctx.createGain();
    satSend.gain.value = 0.15;
    const satNode = ctx.createWaveShaper();
    satNode.curve = this._makeSaturationCurve(2.4);
    satNode.oversample = '2x';
    const satReturn = ctx.createGain();
    satReturn.gain.value = 0.5;
    sfx.connect(satSend);
    satSend.connect(satNode);
    satNode.connect(satReturn);
    satReturn.connect(master);
    this.saturationCurve = satNode.curve;
  },

  _createNoiseBuffer(pink) {
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * 1.8);
    const buffer = this.ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        if (!pink) {
          data[i] = white * 0.85;
          continue;
        }
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    }
    return buffer;
  },

  _createImpulseResponse(duration = 2.5, decay = 2.7) {
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * duration);
    const buffer = this.ctx.createBuffer(2, length, rate);
    const taps = [0.013, 0.021, 0.034, 0.052, 0.079, 0.113];
    const rings = [212, 347, 511, 683];

    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < length; i++) {
        const t = i / length;
        const white = Math.random() * 2 - 1;
        lp += (white - lp) * 0.32;
        data[i] = lp * Math.pow(1 - t, decay) * 0.55;
      }
      taps.forEach((tap, index) => {
        const pos = Math.floor(tap * rate * (1 + ch * 0.06));
        if (pos < length) data[pos] += (index % 2 === 0 ? 1 : -1) * (0.22 / (index + 1));
      });
      const ringLength = Math.floor(rate * 0.7);
      rings.forEach((hz, index) => {
        const amp = 0.016 / (index + 1);
        const phase = ch * 1.7;
        for (let i = 0; i < ringLength; i++) {
          const t = i / rate;
          data[i] += Math.sin(2 * Math.PI * hz * t + phase) * Math.exp(-t * 7.5) * amp;
        }
      });
      for (let i = 0; i < length; i++) {
        data[i] = Math.max(-1, Math.min(1, data[i]));
      }
    }
    return buffer;
  },

  _makeSaturationCurve(amount = 2.4) {
    const samples = 2048;
    const curve = new Float32Array(samples);
    const k = Math.max(0.1, amount);
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / (samples - 1) - 1;
      curve[i] = Math.tanh(k * x);
    }
    return curve;
  },

  // ---------------------------------------------------------------------------
  // Volumen y ajustes
  // ---------------------------------------------------------------------------

  applySettings(settings = {}) {
    if (typeof settings.masterVol === 'number') this.masterVol = clamp01(settings.masterVol);
    if (typeof settings.sfxVol === 'number') this.sfxVol = clamp01(settings.sfxVol);
    if (typeof settings.ambVol === 'number') this.ambVol = clamp01(settings.ambVol);
    if (typeof settings.musicVol === 'number') this.musicVol = clamp01(settings.musicVol);
    if (typeof settings.muted === 'boolean') this.muted = settings.muted;
    this._applyVolumes();
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
      musicVol: level(settings.musicVol, this.musicVol),
      muted: !!settings.muted
    });
  },

  _applyVolumes() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    this._setBusGain(this.masterGain, this.muted ? 0 : this.masterVol, now, 0.04);
    this._setBusGain(this.sfxGain, this.sfxVol, now, 0.04);
    this._setBusGain(this.musicGain, this.musicVol, now, 0.08);
    this._setBusGain(this.ambienceGain, this.ambVol, now, 0.08);
    this._setBusGain(this.uiGain, this.sfxVol * 0.95, now, 0.04);
    this.updateDroneVolume();
  },

  _setBusGain(node, value, time, smoothing = 0.03) {
    if (!node) return;
    node.gain.cancelScheduledValues(time);
    node.gain.setTargetAtTime(value, time, Math.max(0.01, smoothing / 3));
  },

  updateDroneVolume() {
    if (!this.humGain || !this.ctx) return;
    const base = this.isEndgameActive ? 0.055 : 0.024;
    const target = this.muted ? 0 : base;
    const now = this.ctx.currentTime;
    this.humGain.gain.cancelScheduledValues(now);
    this.humGain.gain.setTargetAtTime(target, now, 0.18);
  },

  setEndgameDrone(active) {
    this.isEndgameActive = !!active;
    if (this.humOsc && this.ctx) {
      const now = this.ctx.currentTime;
      this.humOsc.frequency.cancelScheduledValues(now);
      this.humOsc.frequency.setTargetAtTime(active ? 38 : 56, now, 0.3);
    }
    this.updateDroneVolume();
    if (active && this.musicState !== MUSIC_STATES.MENU) {
      this.setMusicState(MUSIC_STATES.CLIMAX);
    }
    this._rampMusicLayers();
  },

  setBossMusic(active) {
    this._bossMusicActive = !!active;
    if (active) {
      if (this.musicState !== MUSIC_STATES.MENU) this.setMusicState(MUSIC_STATES.CLIMAX);
    } else if (this.musicState === MUSIC_STATES.CLIMAX && !this.isEndgameActive) {
      this.setMusicState(MUSIC_STATES.COMBAT);
    }
    this._rampMusicLayers();
  },

  setMusicState(state, options = {}) {
    const next = MUSIC_STATES[state] ? state : MUSIC_STATES.MENU;
    const changed = next !== this.musicState;
    this.musicState = next;
    if (!this.ctx || !this._musicLayers) return;
    if (changed) {
      const now = this.ctx.currentTime;
      this._musicStep = 0;
      this._nextMusicTime = Math.max(this._nextMusicTime, now + 0.05);
    }
    this._rampMusicLayers(!!options.immediate);
  },

  // Filtro "bajo el agua" para menús in-game (BUILD, LEVEL_UP, PAUSA).
  setMenuFilter(active) {
    this.menuFiltered = !!active;
    if (!this.ctx || !this.musicFilter || !this.ambienceFilter) return;
    const now = this.ctx.currentTime;
    const target = active ? 450 : 20000;
    for (const filter of [this.musicFilter, this.ambienceFilter]) {
      filter.frequency.cancelScheduledValues(now);
      filter.frequency.setValueAtTime(Math.max(20, filter.frequency.value), now);
      filter.frequency.exponentialRampToValueAtTime(target, now + 0.15);
    }
  },

  // ---------------------------------------------------------------------------
  // Voces, rutas y síntesis base
  // ---------------------------------------------------------------------------

  _allow(key, cooldownMs = 0) {
    if (!this.ctx || this.ctx.state === 'closed' || this.muted || this.masterVol <= 0) return false;
    if (this.isDemoSilent && !key.startsWith('ui:')) return false;
    if (this._activeVoices.size >= this.maxVoices) return false;
    if (cooldownMs > 0) {
      const now = this.ctx.currentTime;
      const last = this._lastPlayed[key];
      if (last !== undefined && now - last < cooldownMs / 1000) return false;
      this._lastPlayed[key] = now;
    }
    return true;
  },

  _registerSource(source) {
    if (!source) return;
    this._activeVoices.add(source);
    const cleanup = () => this._activeVoices.delete(source);
    try { source.addEventListener('ended', cleanup, { once: true }); } catch (e) {}
  },

  _busNode(bus) {
    switch (bus) {
      case 'music': return this.musicGain;
      case 'ambience': return this.ambienceGain;
      case 'ui': return this.uiGain;
      default: return this.sfxGain;
    }
  },

  _route(node, opts = {}) {
    const dest = this._busNode(opts.bus);
    if (!dest) return;
    let out = node;
    if (typeof opts.pan === 'number' && Math.abs(opts.pan) > 0.01 && this.ctx.createStereoPanner) {
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, opts.pan));
      out.connect(panner);
      out = panner;
    }
    out.connect(dest);
  },

  _vary(freq, amount = 0.06) {
    return freq * (1 + (Math.random() * 2 - 1) * amount);
  },

  _osc(type, freq, time, dur, vol, opts = {}) {
    if (!this.ctx) return null;
    try {
      const now = Math.max(time, this.ctx.currentTime);
      const attack = Math.min(opts.attack ?? 0.004, dur * 0.45);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(10, freq), now);
      if (opts.endFreq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(10, opts.endFreq), now + dur);
      }
      if (opts.detune) osc.detune.value = opts.detune;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), now + Math.max(0.001, attack));
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      osc.connect(gain);
      this._route(gain, opts);
      osc.start(now);
      osc.stop(now + dur + 0.02);
      this._registerSource(osc);
      return { osc, gain };
    } catch (e) {
      return null;
    }
  },

  _noise(time, dur, vol, opts = {}) {
    if (!this.ctx) return null;
    try {
      const now = Math.max(time, this.ctx.currentTime);
      const attack = Math.min(opts.attack ?? 0.002, dur * 0.45);
      const source = this.ctx.createBufferSource();
      source.buffer = opts.pink ? this.pinkBuffer : this.noiseBuffer;
      source.playbackRate.value = opts.playbackRate || 1;
      const filter = this.ctx.createBiquadFilter();
      filter.type = opts.filter || 'bandpass';
      filter.Q.value = opts.q ?? 0.7;
      const startFreq = Math.max(20, opts.freq || 1200);
      filter.frequency.setValueAtTime(startFreq, now);
      if (opts.endFreq) {
        filter.frequency.exponentialRampToValueAtTime(Math.max(20, opts.endFreq), now + dur);
      }
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), now + Math.max(0.001, attack));
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      source.connect(filter);
      filter.connect(gain);
      this._route(gain, opts);
      source.start(now);
      source.stop(now + dur + 0.02);
      this._registerSource(source);
      return { source, gain };
    } catch (e) {
      return null;
    }
  },

  // Convierte coordenadas de mundo en ganancia/pan relativos a la cámara.
  updateListener(camera) {
    if (!camera || !camera.position || !camera.matrixWorld) return;
    const e = camera.matrixWorld.elements;
    const fx = -e[8];
    const fz = -e[10];
    const len = Math.hypot(fx, fz) || 1;
    this._listener.x = camera.position.x;
    this._listener.y = camera.position.y;
    this._listener.z = camera.position.z;
    this._listener.rightX = -fz / len;
    this._listener.rightZ = fx / len;
  },

  _spatial(position) {
    if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.z)) {
      return { gain: 1, pan: 0 };
    }
    const l = this._listener;
    const dx = position.x - l.x;
    const dz = position.z - l.z;
    const dist = Math.hypot(dx, dz);
    const gain = Math.max(0.12, 1 / (1 + dist * 0.14));
    let pan = 0;
    if (dist > 0.01) {
      pan = (dx * l.rightX + dz * l.rightZ) / dist;
      pan = Math.max(-0.85, Math.min(0.85, pan * 0.85));
    }
    return { gain, pan };
  },

  // ---------------------------------------------------------------------------
  // One-shot genérico y UI
  // ---------------------------------------------------------------------------

  play(freq = 180, dur = 0.12, type = 'sawtooth', vol = 0.06) {
    if (!this._allow(`generic:${Math.round(freq)}:${type}`, 18)) return;
    const now = this.ctx.currentTime;
    this._osc(type, freq, now, dur, vol, {
      endFreq: Math.max(26, freq * 0.3),
      bus: 'sfx'
    });
  },

  // Tick de cassette al pasar el ratón.
  playUIHover() {
    if (!this._allow('ui:hover', 35)) return;
    const t = this.ctx.currentTime;
    this._noise(t, 0.014, 0.018, { filter: 'bandpass', freq: 3200, q: 7, bus: 'ui' });
    this._osc('sine', 1180, t, 0.018, 0.012, { endFreq: 980, bus: 'ui' });
  },

  // Pulsación mecánica seca (delegación global de botones).
  playUIButtonClick() {
    if (!this._allow('ui:button', 55)) return;
    const t = this.ctx.currentTime;
    this._noise(t, 0.02, 0.03, { filter: 'bandpass', freq: 1900, q: 4, bus: 'ui' });
    this._osc('square', 340, t, 0.035, 0.02, { endFreq: 160, bus: 'ui' });
    this._osc('sine', 95, t, 0.05, 0.03, { endFreq: 60, bus: 'ui' });
  },

  // Clic metálico seco al pasar por encima de botones o tarjetas.
  playUIClick() {
    if (!this._allow('ui:click', 45)) return;
    const t = this.ctx.currentTime;
    this._noise(t, 0.016, 0.028, { filter: 'bandpass', freq: 2600, q: 8, bus: 'ui' });
    this._osc('square', 840, t, 0.028, 0.022, { endFreq: 560, bus: 'ui' });
    this._osc('triangle', 180, t, 0.04, 0.018, { endFreq: 90, bus: 'ui' });
  },

  // Interruptor pesado analógico al confirmar o pulsar un botón.
  playUISelect() {
    if (!this._allow('ui:select', 70)) return;
    const t = this.ctx.currentTime;
    this._osc('square', 150, t, 0.09, 0.055, { endFreq: 62, bus: 'ui' });
    this._osc('triangle', 520, t + 0.028, 0.06, 0.038, { endFreq: 300, bus: 'ui' });
    this._noise(t, 0.035, 0.03, { filter: 'bandpass', freq: 1500, q: 3, bus: 'ui' });
    this._osc('sine', 74, t + 0.02, 0.11, 0.045, { endFreq: 45, bus: 'ui' });
  },

  // Zumbido grave cuando una acción es rechazada.
  playUIError() {
    if (!this._allow('ui:error', 160)) return;
    const t = this.ctx.currentTime;
    this._osc('sawtooth', 96, t, 0.15, 0.05, { endFreq: 72, bus: 'ui' });
    this._osc('square', 72, t + 0.06, 0.17, 0.045, { endFreq: 54, bus: 'ui' });
    this._noise(t, 0.09, 0.018, { filter: 'lowpass', freq: 420, bus: 'ui' });
  },

  // Relé mecánico y cinta deteniéndose al pausar/reanudar.
  playPause() {
    if (!this._allow('ui:pause', 120)) return;
    const t = this.ctx.currentTime;
    this._osc('square', 260, t, 0.055, 0.045, { endFreq: 120, bus: 'ui' });
    this._osc('sawtooth', 140, t + 0.045, 0.11, 0.035, { endFreq: 52, bus: 'ui' });
    this._noise(t, 0.04, 0.02, { filter: 'bandpass', freq: 900, q: 2, bus: 'ui' });
  },

  playReroll() {
    if (!this._allow('ui:reroll', 100)) return;
    const t = this.ctx.currentTime;
    [320, 240, 480].forEach((f, i) => {
      this._osc('square', f, t + i * 0.045, 0.06, 0.05, { endFreq: f * 0.7, bus: 'ui' });
      this._noise(t + i * 0.045, 0.02, 0.018, { filter: 'bandpass', freq: 2200, q: 5, bus: 'ui' });
    });
  },

  // ---------------------------------------------------------------------------
  // Armas del jugador
  // ---------------------------------------------------------------------------

  playShotgun() {
    if (!this._allow('weapon:shotgun', 70)) return;
    const t = this.ctx.currentTime;
    const p = this._vary(1, 0.035);
    this._osc('sine', 125 * p, t, 0.3, 0.34, { endFreq: 34, attack: 0.0015, bus: 'sfx' });
    this._noise(t, 0.24, 0.19, { pink: true, filter: 'lowpass', freq: 2800, endFreq: 210, q: 0.8 });
    this._noise(t, 0.055, 0.09, { filter: 'bandpass', freq: 1850, q: 2.2 });
    this._osc('square', 900, t + 0.008, 0.03, 0.026, { endFreq: 620, bus: 'sfx' });
    this._osc('triangle', 180, t + 0.02, 0.13, 0.075, { endFreq: 58, bus: 'sfx' });
  },

  playSlash() {
    if (!this._allow('weapon:slash', 55)) return;
    const t = this.ctx.currentTime;
    const p = this._vary(1, 0.06);
    this._noise(t, 0.16, 0.14, { filter: 'bandpass', freq: 3400 * p, endFreq: 620, q: 1.4 });
    this._osc('sawtooth', 240 * p, t, 0.12, 0.05, { endFreq: 80, bus: 'sfx' });
    this._noise(t + 0.045, 0.17, 0.105, { pink: true, filter: 'lowpass', freq: 540, endFreq: 120 });
  },

  playElectric() {
    if (!this._allow('weapon:electric', 60)) return;
    const t = this.ctx.currentTime;
    this._osc('square', 1450, t, 0.06, 0.07, { endFreq: 260, attack: 0.001, bus: 'sfx' });
    this._osc('sawtooth', 2200, t + 0.012, 0.05, 0.045, { endFreq: 700, attack: 0.001, bus: 'sfx' });
    this._noise(t, 0.09, 0.09, { filter: 'highpass', freq: 2400, q: 0.8 });
    this._osc('sine', 60, t + 0.03, 0.26, 0.14, { endFreq: 32, bus: 'sfx' });
  },

  playHarpoon() {
    if (!this._allow('weapon:harpoon', 65)) return;
    const t = this.ctx.currentTime;
    this._noise(t, 0.16, 0.11, { filter: 'bandpass', freq: 900, endFreq: 280, q: 1.2 });
    this._osc('triangle', this._vary(155, 0.05), t, 0.2, 0.075, { endFreq: 70, bus: 'sfx' });
    this._osc('square', 620, t, 0.025, 0.025, { endFreq: 420, bus: 'sfx' });
  },

  playFlamethrower() {
    if (!this._allow('weapon:flame', 85)) return;
    const t = this.ctx.currentTime;
    const pan = (Math.random() - 0.5) * 0.3;
    this._noise(t, 0.19, 0.055, {
      pink: true, filter: 'lowpass', freq: 760, endFreq: 360, pan
    });
    this._noise(t, 0.08, 0.025, { filter: 'bandpass', freq: 2100, q: 0.8, pan });
    this._osc('sawtooth', 110 + Math.random() * 40, t, 0.09, 0.018, { endFreq: 70, bus: 'sfx', pan });
  },

  playMinePlace() {
    if (!this._allow('weapon:mine_place', 80)) return;
    const t = this.ctx.currentTime;
    this._osc('square', 420, t, 0.06, 0.035, { endFreq: 300, bus: 'sfx' });
    this._osc('sine', 920, t + 0.01, 0.045, 0.028, { endFreq: 760, bus: 'sfx' });
    this._noise(t, 0.03, 0.025, { filter: 'bandpass', freq: 1800, q: 4 });
  },

  playMineExplode() {
    if (!this._allow('weapon:mine_blast', 90)) return;
    const t = this.ctx.currentTime;
    this._osc('sine', 100, t, 0.5, 0.24, { endFreq: 24, attack: 0.001, bus: 'sfx' });
    this._noise(t, 0.38, 0.17, { pink: true, filter: 'lowpass', freq: 1800, endFreq: 80, q: 0.7 });
    this._noise(t, 0.07, 0.08, { filter: 'highpass', freq: 2600 });
    this._osc('sawtooth', 90, t, 0.3, 0.09, { endFreq: 30, bus: 'sfx' });
  },

  // ---------------------------------------------------------------------------
  // Impactos, críticos, muertes y pickups
  // ---------------------------------------------------------------------------

  playHit(critical = false, options = {}) {
    const key = critical ? 'hit:crit' : 'hit:normal';
    if (!this._allow(key, critical ? 60 : 38)) return;
    const t = this.ctx.currentTime;
    const remote = options.remote ? 0.5 : 1;
    const p = this._vary(1, 0.06);

    this._osc('triangle', 175 * p, t, 0.075, 0.05 * remote, { endFreq: 72, bus: 'sfx' });
    this._noise(t, 0.045, 0.04 * remote, { filter: 'bandpass', freq: 1500 * p, q: 1.6 });

    if (critical) {
      this._osc('sine', 1240, t, 0.22, 0.055, { endFreq: 1180, bus: 'sfx' });
      this._osc('sine', 1860, t + 0.008, 0.18, 0.035, { endFreq: 1810, bus: 'sfx' });
      this._osc('square', 430, t, 0.06, 0.03, { endFreq: 260, bus: 'sfx' });
      this._noise(t, 0.09, 0.055, { filter: 'highpass', freq: 2200, q: 0.7 });
      this._osc('sine', 120, t + 0.01, 0.16, 0.09, { endFreq: 44, bus: 'sfx' });
    }
  },

  playEnemyDeath() {
    if (!this._allow('enemy:death', 45)) return;
    const t = this.ctx.currentTime;
    const p = this._vary(1, 0.06);
    this._osc('sawtooth', 150 * p, t, 0.28, 0.075, { endFreq: 38, bus: 'sfx' });
    this._noise(t, 0.26, 0.09, { pink: true, filter: 'lowpass', freq: 1100, endFreq: 120, q: 0.9 });
    this._noise(t + 0.02, 0.1, 0.045, { filter: 'bandpass', freq: 720 * p, endFreq: 240, q: 2.2 });
    this._osc('sine', 80, t + 0.035, 0.22, 0.08, { endFreq: 30, bus: 'sfx' });
  },

  // Escalado cromático de pitch en racha (estilo Vampire Survivors).
  playPickup(type = 'exp') {
    if (!this._allow('pickup', 18)) return;
    const t = this.ctx.currentTime;
    if (t - this._lastPickupAt > 0.8) this._pickupStreak = 0;
    else this._pickupStreak = Math.min(15, this._pickupStreak + 1);
    this._lastPickupAt = t;

    const offset = PICKUP_SCALE[this._pickupStreak % PICKUP_SCALE.length]
      + Math.floor(this._pickupStreak / PICKUP_SCALE.length) * 12;
    const base = type === 'tooth' ? 523.25 : type === 'scrap' ? 392.0 : 440.0;
    const freq = base * Math.pow(2, offset / 12);

    if (type === 'scrap') {
      this._osc('square', freq, t, 0.1, 0.045, { endFreq: freq * 0.82, bus: 'sfx' });
      this._osc('triangle', freq * 2.01, t + 0.012, 0.07, 0.022, { endFreq: freq * 1.6, bus: 'sfx' });
      this._noise(t, 0.04, 0.02, { filter: 'bandpass', freq: 2600, q: 5 });
    } else if (type === 'tooth') {
      this._osc('sine', freq, t, 0.12, 0.055, { endFreq: freq * 1.01, bus: 'sfx' });
      this._osc('sine', freq * 2, t + 0.018, 0.16, 0.025, { endFreq: freq * 2.02, bus: 'sfx' });
      this._noise(t, 0.05, 0.014, { filter: 'highpass', freq: 4200 });
    } else {
      this._osc('triangle', freq, t, 0.09, 0.045, { endFreq: freq * 1.02, bus: 'sfx' });
      this._osc('sine', freq * 1.5, t + 0.014, 0.06, 0.02, { endFreq: freq * 1.52, bus: 'sfx' });
    }
  },

  playScrapTransfer(bulk = false) {
    if (!this._allow('scrap:transfer', 90)) return;
    const t = this.ctx.currentTime;
    const clinks = bulk ? [1180, 1560, 940, 1740] : [1120, 1520];
    clinks.forEach((f, i) => {
      this._osc('square', f, t + i * 0.035, 0.05, 0.035, { endFreq: f * 0.72, bus: 'ui' });
      this._noise(t + i * 0.035, 0.03, 0.022, { filter: 'bandpass', freq: 3000, q: 6, bus: 'ui' });
    });
    this._osc('sawtooth', 180, t, 0.1, 0.04, { endFreq: 90, bus: 'ui' });
    this._osc('sine', 70, t + 0.02, 0.16, 0.05, { endFreq: 42, bus: 'ui' });
  },

  // ---------------------------------------------------------------------------
  // Torretas, núcleo y oleadas
  // ---------------------------------------------------------------------------

  playBuildTurret() {
    if (!this._allow('turret:build', 120)) return;
    const t = this.ctx.currentTime;
    this._osc('square', 95, t, 0.2, 0.16, { endFreq: 46, attack: 0.001, bus: 'sfx' });
    this._osc('sine', 58, t, 0.28, 0.17, { endFreq: 34, bus: 'sfx' });
    this._noise(t, 0.5, 0.075, { filter: 'highpass', freq: 1500, endFreq: 3200, attack: 0.05 });
    this._osc('triangle', 330, t + 0.24, 0.09, 0.055, { endFreq: 360, bus: 'ui' });
    this._osc('square', 660, t + 0.36, 0.06, 0.04, { endFreq: 720, bus: 'ui' });
  },

  playUpgradeTurret() {
    if (!this._allow('turret:upgrade', 120)) return;
    const t = this.ctx.currentTime;
    this._osc('square', 120, t, 0.16, 0.13, { endFreq: 58, bus: 'sfx' });
    this._noise(t, 0.36, 0.06, { filter: 'highpass', freq: 1800, endFreq: 3600, attack: 0.04 });
    this._osc('triangle', 380, t + 0.16, 0.08, 0.055, { endFreq: 440, bus: 'ui' });
    this._osc('square', 560, t + 0.25, 0.07, 0.045, { endFreq: 640, bus: 'ui' });
    this._osc('sine', 840, t + 0.34, 0.09, 0.04, { endFreq: 900, bus: 'ui' });
  },

  playSellTurret() {
    if (!this._allow('turret:sell', 110)) return;
    const t = this.ctx.currentTime;
    [660, 520, 390].forEach((f, i) => {
      this._osc('square', f, t + i * 0.04, 0.055, 0.035, { endFreq: f * 0.7, bus: 'ui' });
    });
    this._noise(t, 0.08, 0.03, { filter: 'bandpass', freq: 1400, q: 3, bus: 'ui' });
    this._osc('sine', 150, t + 0.06, 0.12, 0.05, { endFreq: 70, bus: 'sfx' });
  },

  playTurretDestroyed() {
    if (!this._allow('turret:destroyed', 100)) return;
    const t = this.ctx.currentTime;
    this._osc('sawtooth', 88, t, 0.35, 0.15, { endFreq: 30, bus: 'sfx' });
    this._osc('sine', 64, t, 0.42, 0.16, { endFreq: 22, bus: 'sfx' });
    this._noise(t, 0.32, 0.12, { pink: true, filter: 'lowpass', freq: 1500, endFreq: 70 });
    this._noise(t, 0.08, 0.06, { filter: 'highpass', freq: 2400 });
  },

  // Timbre distinto por clase, con pan y atenuación por distancia.
  playTurretShot(kind = 'gunner', position = null) {
    if (!this._allow(`turret:shot:${kind}`, 55)) return;
    const t = this.ctx.currentTime;
    const { gain, pan } = this._spatial(position);
    const g = Math.max(0.02, gain);
    const p = this._vary(1, 0.055);

    switch (kind) {
      case 'mortar':
      case 'cannon':
        this._osc('sine', 108 * p, t, 0.2, 0.11 * g, { endFreq: 38, bus: 'sfx', pan });
        this._noise(t, 0.16, 0.075 * g, { pink: true, filter: 'lowpass', freq: 1200, endFreq: 140, pan });
        this._noise(t, 0.035, 0.03 * g, { filter: 'highpass', freq: 2200, pan });
        break;
      case 'cryo':
        this._osc('sine', 760 * p, t, 0.09, 0.055 * g, { endFreq: 1180, bus: 'sfx', pan });
        this._osc('triangle', 1520 * p, t + 0.01, 0.06, 0.02 * g, { endFreq: 1600, bus: 'sfx', pan });
        this._noise(t, 0.1, 0.035 * g, { filter: 'highpass', freq: 3200, pan });
        break;
      case 'support':
        this._osc('triangle', 300 * p, t, 0.1, 0.045 * g, { endFreq: 420, bus: 'sfx', pan });
        this._osc('sine', 600, t + 0.02, 0.08, 0.02 * g, { endFreq: 640, bus: 'sfx', pan });
        break;
      case 'rail':
      case 'railgun':
      case 'tesla':
        this._osc('square', 1300 * p, t, 0.07, 0.08 * g, { endFreq: 260, attack: 0.001, bus: 'sfx', pan });
        this._noise(t, 0.08, 0.06 * g, { filter: 'highpass', freq: 2400, pan });
        this._osc('sine', 70, t + 0.015, 0.18, 0.07 * g, { endFreq: 35, bus: 'sfx', pan });
        break;
      case 'incinerator':
        this._noise(t, 0.2, 0.07 * g, { pink: true, filter: 'lowpass', freq: 900, endFreq: 260, pan });
        this._osc('sawtooth', 105 * p, t, 0.18, 0.04 * g, { endFreq: 62, bus: 'sfx', pan });
        break;
      case 'press':
        this._osc('sine', 82 * p, t, 0.2, 0.12 * g, { endFreq: 32, bus: 'sfx', pan });
        this._noise(t, 0.14, 0.08 * g, { pink: true, filter: 'lowpass', freq: 700, endFreq: 120, pan });
        break;
      case 'ejector':
        this._noise(t, 0.18, 0.08 * g, { filter: 'bandpass', freq: 620, endFreq: 140, q: 1.4, pan });
        this._osc('sawtooth', 180 * p, t, 0.16, 0.045 * g, { endFreq: 72, bus: 'sfx', pan });
        break;
      case 'ally':
        this._osc('square', 250 * p, t, 0.055, 0.035 * g, { endFreq: 150, bus: 'sfx', pan });
        this._noise(t, 0.03, 0.025 * g, { filter: 'bandpass', freq: 1800, q: 3, pan });
        break;
      default:
        this._osc('square', 185 * p, t, 0.055, 0.05 * g, { endFreq: 95, bus: 'sfx', pan });
        this._osc('sine', 96, t, 0.07, 0.045 * g, { endFreq: 52, bus: 'sfx', pan });
        this._noise(t, 0.035, 0.035 * g, { filter: 'bandpass', freq: 1700 * p, q: 2.4, pan });
        break;
    }
  },

  playCoreHit() {
    if (!this._allow('core:hit', 90)) return;
    const t = this.ctx.currentTime;
    this._osc('sawtooth', 82, t, 0.2, 0.13, { endFreq: 48, bus: 'sfx' });
    this._osc('square', 210, t, 0.09, 0.06, { endFreq: 150, bus: 'sfx' });
    this._noise(t, 0.1, 0.06, { filter: 'bandpass', freq: 760, q: 1.4 });
    this._osc('sine', 46, t, 0.32, 0.1, { endFreq: 28, bus: 'sfx' });
  },

  playCoreLeak() {
    if (!this._allow('core:leak', 180)) return;
    const t = this.ctx.currentTime;
    [220, 165, 110].forEach((f, i) => {
      this._osc('sawtooth', f, t + i * 0.13, 0.18, 0.08, { endFreq: f * 0.86, bus: 'sfx' });
      this._noise(t + i * 0.13, 0.06, 0.03, { filter: 'bandpass', freq: 1200, q: 2 });
    });
    this._osc('sine', 60, t, 0.55, 0.18, { endFreq: 24, bus: 'sfx' });
    this._noise(t + 0.2, 0.24, 0.05, { filter: 'highpass', freq: 3000 });
  },

  playCoreDestroyed() {
    if (!this._allow('core:destroyed', 500)) return;
    const t = this.ctx.currentTime;
    this._osc('sine', 90, t, 1.1, 0.3, { endFreq: 18, attack: 0.002, bus: 'sfx' });
    this._osc('sawtooth', 120, t, 0.9, 0.18, { endFreq: 24, bus: 'sfx' });
    this._noise(t, 1.0, 0.2, { pink: true, filter: 'lowpass', freq: 2400, endFreq: 55, q: 0.7 });
    this._noise(t, 0.16, 0.1, { filter: 'highpass', freq: 2400 });
    [55, 82, 123].forEach((f, i) => {
      this._osc('square', f, t + i * 0.09, 0.5, 0.08, { endFreq: f * 0.7, bus: 'sfx' });
    });
  },

  playWaveStart() {
    if (!this._allow('wave:start', 300)) return;
    const t = this.ctx.currentTime;
    this._osc('sine', 82, t, 0.5, 0.2, { endFreq: 34, attack: 0.004, bus: 'sfx' });
    this._osc('sawtooth', 165, t, 0.35, 0.08, { endFreq: 110, bus: 'sfx' });
    this._osc('square', 220, t + 0.12, 0.25, 0.06, { endFreq: 160, bus: 'sfx' });
    this._noise(t, 0.32, 0.055, { pink: true, filter: 'lowpass', freq: 900, endFreq: 180 });
    this._osc('sine', 440, t + 0.22, 0.18, 0.04, { endFreq: 520, bus: 'ui' });
  },

  // ---------------------------------------------------------------------------
  // Ambiente, eventos y jugador
  // ---------------------------------------------------------------------------

  playIndustrialSiren() {
    if (!this._allow('ambience:siren', 700)) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 420;
    filter.Q.value = 2.5;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(250, t);
    osc.frequency.linearRampToValueAtTime(490, t + 0.7);
    osc.frequency.linearRampToValueAtTime(285, t + 1.4);
    osc.frequency.linearRampToValueAtTime(520, t + 2.1);
    osc.frequency.linearRampToValueAtTime(240, t + 2.8);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.11, t + 0.2);
    gain.gain.setValueAtTime(0.11, t + 2.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 3.0);
    osc.connect(filter);
    filter.connect(gain);
    this._route(gain, { bus: 'sfx' });
    osc.start(t);
    osc.stop(t + 3.02);
    this._registerSource(osc);

    this._osc('sawtooth', 125, t, 2.8, 0.06, { endFreq: 116, attack: 0.3, bus: 'sfx' });
    this._osc('sine', 55, t, 2.6, 0.09, { endFreq: 48, attack: 0.25, bus: 'sfx' });
  },

  playBossHorn() {
    if (!this._allow('boss:horn', 600)) return;
    const t = this.ctx.currentTime;
    [65, 98, 130, 196].forEach((f, i) => {
      this._osc('sawtooth', f, t + i * 0.02, 1.15, 0.075, {
        endFreq: f * 0.97, attack: 0.08, bus: 'sfx'
      });
    });
    this._osc('sine', 32.7, t, 1.6, 0.2, { endFreq: 24, attack: 0.05, bus: 'sfx' });
    this._noise(t, 1.1, 0.055, { pink: true, filter: 'lowpass', freq: 900, endFreq: 240, attack: 0.1 });
  },

  playScare() {
    if (!this._allow('scare', 350)) return;
    const t = this.ctx.currentTime;
    [92, 138, 215, 590].forEach((f, i) => {
      this._osc('sawtooth', f, t + i * 0.008, 0.35, 0.055, { endFreq: f * 0.94, bus: 'sfx' });
    });
    this._noise(t, 0.3, 0.06, { filter: 'highpass', freq: 2200, q: 0.7 });
  },

  // Impulso neumático y desplazamiento de aire al esquivar (Dash).
  playDash() {
    if (!this._allow('player:dash', 70)) return;
    const t = this.ctx.currentTime;
    this._noise(t, 0.2, 0.11, { filter: 'bandpass', freq: 600, endFreq: 120, q: 1.8 });
    this._osc('sawtooth', 320, t, 0.2, 0.055, { endFreq: 80, bus: 'sfx' });
    this._osc('sine', 120, t + 0.03, 0.16, 0.08, { endFreq: 60, bus: 'sfx' });
  },

  // Sonido contundente de apagón / caída abatido.
  playPlayerDowned() {
    if (!this._allow('player:downed', 500)) return;
    const t = this.ctx.currentTime;
    this._osc('sawtooth', 65, t, 0.55, 0.16, { endFreq: 28, bus: 'sfx' });
    this._osc('square', 38, t + 0.04, 0.7, 0.14, { endFreq: 20, bus: 'sfx' });
    this._osc('sine', 26, t + 0.09, 0.9, 0.2, { endFreq: 18, bus: 'sfx' });
    this._noise(t, 0.5, 0.08, { pink: true, filter: 'lowpass', freq: 800, endFreq: 80 });
  },

  // Zumbido grave continuo durante los 5s de reconstrucción.
  startPlayerDownHum() {
    if (!this.ctx || this.muted || this.playerDownHumGain || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      this.playerDownHumOsc = this.ctx.createOscillator();
      this.playerDownHumGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 95;

      this.playerDownHumOsc.type = 'sawtooth';
      this.playerDownHumOsc.frequency.setValueAtTime(44, now);
      this.playerDownHumGain.gain.setValueAtTime(0.0001, now);
      this.playerDownHumGain.gain.linearRampToValueAtTime(0.09, now + 0.3);

      this.playerDownHumOsc.connect(filter);
      filter.connect(this.playerDownHumGain);
      this.playerDownHumGain.connect(this.sfxGain);
      this.playerDownHumOsc.start(now);
    } catch (e) {
      console.warn('[Audio] Error al iniciar hum de reconstrucción:', e);
    }
  },

  stopPlayerDownHum() {
    if (!this.playerDownHumOsc || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      this.playerDownHumGain?.gain?.cancelScheduledValues(now);
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

  // Sonido de reactivación / revivir.
  playPlayerRevived() {
    if (!this._allow('player:revived', 300)) return;
    const t = this.ctx.currentTime;
    this._osc('triangle', 120, t, 0.45, 0.1, { endFreq: 680, attack: 0.01, bus: 'sfx' });
    this._osc('sine', 240, t + 0.05, 0.4, 0.05, { endFreq: 1360, attack: 0.02, bus: 'sfx' });
    this._osc('sine', 780, t + 0.38, 0.18, 0.08, { endFreq: 820, bus: 'ui' });
    this._noise(t, 0.22, 0.03, { filter: 'highpass', freq: 2000, attack: 0.02 });
  },

  // Alarma táctica para aviso de compañero abatido.
  playTacticalAlarm() {
    if (!this._allow('player:tactical_alarm', 400)) return;
    const t = this.ctx.currentTime;
    [880, 580, 880].forEach((f, i) => {
      this._osc('square', f, t + i * 0.11, 0.12, 0.075, { endFreq: f * 0.96, bus: 'ui' });
    });
    this._osc('sine', 110, t, 0.36, 0.07, { endFreq: 90, bus: 'sfx' });
  },

  // ---------------------------------------------------------------------------
  // Música adaptativa
  // ---------------------------------------------------------------------------

  _startLegacyHum() {
    const ctx = this.ctx;
    this.humOsc = ctx.createOscillator();
    this.humGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    this.humOsc.type = 'sawtooth';
    this.humOsc.frequency.value = 56;
    filter.type = 'lowpass';
    filter.frequency.value = 155;
    this.humGain.gain.value = 0.0001;
    this.humOsc.connect(filter);
    filter.connect(this.humGain);
    this.humGain.connect(this.ambienceGain);
    this.humOsc.start();

    // Viento metálico y zumbido eléctrico de la fábrica abandonada.
    const wind = ctx.createBufferSource();
    wind.buffer = this.pinkBuffer;
    wind.loop = true;
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 360;
    windFilter.Q.value = 0.6;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.018;
    const windLfo = ctx.createOscillator();
    const windLfoGain = ctx.createGain();
    windLfo.frequency.value = 0.05;
    windLfoGain.gain.value = 140;
    wind.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.ambienceGain);
    windLfo.connect(windLfoGain);
    windLfoGain.connect(windFilter.frequency);
    wind.start();
    windLfo.start();

    const buzz = ctx.createOscillator();
    const buzzGain = ctx.createGain();
    buzz.type = 'triangle';
    buzz.frequency.value = 120;
    buzzGain.gain.value = 0.004;
    buzz.connect(buzzGain);
    buzzGain.connect(this.ambienceGain);
    buzz.start();

    this.ambienceWind = { source: wind, lfo: windLfo, buzz };
    this.updateDroneVolume();
  },

  _startMusicEngine() {
    if (this._musicTimer) return;
    this._createMusicLayers();
    this._nextMusicTime = this.ctx.currentTime + 0.15;
    this._musicStep = 0;
    this._musicTimer = setInterval(() => this._scheduleMusic(), 80);
  },

  _createMusicLayers() {
    if (!this.ctx || !this.musicGain) return;
    const ctx = this.ctx;
    const defs = [
      {
        name: 'menu', base: 0.26,
        voices: [
          { type: 'sawtooth', freq: 55, detune: -7, amp: 0.13 },
          { type: 'sawtooth', freq: 55, detune: 9, amp: 0.13 },
          { type: 'sine', freq: 27.5, amp: 0.28 }
        ],
        filter: { freq: 220, q: 1.4 },
        lfo: { rate: 0.06, depth: 110 },
        vinyl: true
      },
      {
        name: 'prep', base: 0.15,
        voices: [
          { type: 'sine', freq: 60, amp: 0.18 },
          { type: 'square', freq: 120, amp: 0.035 },
          { type: 'sawtooth', freq: 30, amp: 0.16 }
        ],
        filter: { freq: 190, q: 0.9 },
        lfo: { rate: 0.18, depth: 45 }
      },
      {
        name: 'combat', base: 0.2,
        voices: [
          { type: 'sawtooth', freq: 36.7, amp: 0.2 },
          { type: 'sine', freq: 73.4, amp: 0.12 }
        ],
        filter: { freq: 170, q: 1.1 },
        lfo: { rate: 0.35, depth: 55 }
      },
      {
        name: 'climax', base: 0.24,
        voices: [
          { type: 'sawtooth', freq: 41.2, amp: 0.2 },
          { type: 'sawtooth', freq: 41.2, detune: 16, amp: 0.12 },
          { type: 'sine', freq: 20.6, amp: 0.3 }
        ],
        filter: { freq: 250, q: 1.6 },
        lfo: { rate: 0.5, depth: 85 },
        saturate: true
      }
    ];

    this._musicLayers = {};
    for (const def of defs) {
      const layerGain = ctx.createGain();
      layerGain.gain.value = 0.0001;
      layerGain.connect(this.musicGain);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = def.filter.freq;
      filter.Q.value = def.filter.q;
      let chainTail = filter;
      if (def.saturate) {
        const shaper = ctx.createWaveShaper();
        shaper.curve = this._makeSaturationCurve(3.2);
        shaper.oversample = '2x';
        filter.connect(shaper);
        chainTail = shaper;
      }
      chainTail.connect(layerGain);

      const sources = [];
      for (const voice of def.voices) {
        const osc = ctx.createOscillator();
        const voiceGain = ctx.createGain();
        osc.type = voice.type;
        osc.frequency.value = voice.freq;
        if (voice.detune) osc.detune.value = voice.detune;
        voiceGain.gain.value = voice.amp;
        osc.connect(voiceGain);
        voiceGain.connect(filter);
        osc.start();
        sources.push(osc);
      }

      if (def.lfo) {
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = def.lfo.rate;
        lfoGain.gain.value = def.lfo.depth;
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start();
        sources.push(lfo);
      }

      if (def.vinyl) {
        const noise = ctx.createBufferSource();
        const band = ctx.createBiquadFilter();
        const nGain = ctx.createGain();
        noise.buffer = this.pinkBuffer;
        noise.loop = true;
        band.type = 'bandpass';
        band.frequency.value = 2400;
        band.Q.value = 0.6;
        nGain.gain.value = 0.016;
        noise.connect(band);
        band.connect(nGain);
        nGain.connect(layerGain);
        noise.start();
        sources.push(noise);
      }

      this._musicLayers[def.name] = { gain: layerGain, base: def.base, sources };
    }
  },

  _rampMusicLayers(immediate = false) {
    if (!this.ctx || !this._musicLayers) return;
    const mix = MUSIC_MIX[this.musicState] || MUSIC_MIX.MENU;
    const now = this.ctx.currentTime;
    for (const [name, layer] of Object.entries(this._musicLayers)) {
      const target = layer.base * (mix[name] ?? 0);
      layer.gain.gain.cancelScheduledValues(now);
      if (immediate) layer.gain.gain.setValueAtTime(Math.max(0.0001, target), now);
      else layer.gain.gain.setTargetAtTime(Math.max(0.0001, target), now, 0.5);
    }
  },

  _scheduleMusic() {
    if (!this.ctx || !this._graphReady || this.muted || this.masterVol <= 0 || this.musicVol <= 0) return;
    if (this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    if (this._nextMusicTime < now - 0.5) this._nextMusicTime = now + 0.04;

    const bpm = MUSIC_BPM[this.musicState] || MUSIC_BPM.MENU;
    const stepDur = 60 / bpm / 4;
    let guard = 0;
    while (this._nextMusicTime < now + 0.22 && guard++ < 32) {
      this._scheduleMusicStep(this._musicStep, this._nextMusicTime, stepDur);
      this._musicStep = (this._musicStep + 1) % 64;
      this._nextMusicTime += stepDur;
    }
  },

  _scheduleMusicStep(step, time) {
    const state = this.musicState;
    const intensity = this.getMusicIntensity();
    const barStep = step % 16;

    if (state === MUSIC_STATES.MENU) {
      if (step % 32 === 0) this._musicSubPulse(time, 0.1);
      if (Math.random() < 0.025) this._musicMetal(time, 0.014, (Math.random() - 0.5) * 1.1);
      return;
    }

    if (state === MUSIC_STATES.PREP) {
      if (barStep === 0) this._musicSubPulse(time, 0.13);
      if (barStep === 8) this._musicSubPulse(time, 0.07);
      if (barStep === 4) this._musicThump(time, 0.08);
      if (Math.random() < 0.018) this._musicMetal(time, 0.016, (Math.random() - 0.5) * 1.2);
      return;
    }

    const boost = 1 + intensity * 0.3;

    if (state === MUSIC_STATES.COMBAT) {
      if (barStep % 4 === 0) this._musicKick(time, 0.42 * boost);
      if (barStep === 4 || barStep === 12) this._musicMetal(time, 0.035 * boost, 0.2);
      if (barStep % 2 === 1) this._musicHat(time, 0.012 * boost, (Math.random() - 0.5) * 0.7);
      if (barStep % 2 === 0) {
        const pattern = [41.2, 41.2, 43.65, 41.2, 49, 41.2, 58.27, 55];
        this._musicBass(pattern[(barStep / 2) % pattern.length], time, 0.13, 0.09 * boost);
      }
      if (barStep === 0 && step % 32 === 0) this._musicLead(82.41, time, 0.5, 0.028);
      return;
    }

    // CLIMAX
    if (barStep % 4 === 0 || barStep === 3 || barStep === 11) this._musicKick(time, 0.46 * boost);
    if (barStep === 4 || barStep === 12) this._musicMetal(time, 0.05 * boost, -0.2);
    if (barStep % 2 === 1) this._musicHat(time, 0.016 * boost, (Math.random() - 0.5) * 0.9);
    const climaxPattern = [41.2, 41.2, 43.65, 41.2, 49, 43.65, 58.27, 55];
    this._musicBass(climaxPattern[barStep % climaxPattern.length], time, 0.1, 0.1 * boost);
    if (barStep === 0 && step % 32 === 0) this._musicLead(82.41, time, 0.7, 0.035);
    if (barStep === 8 && step % 64 === 8) this._musicLead(87.31, time, 0.45, 0.026);
  },

  getMusicIntensity() {
    if (this.musicState === MUSIC_STATES.CLIMAX) return 1;
    return Math.max(this.isEndgameActive ? 1 : 0, this._bossMusicActive ? 0.8 : 0);
  },

  _musicKick(time, vol = 0.4) {
    this._osc('sine', 118, time, 0.3, vol, { endFreq: 40, attack: 0.002, bus: 'music' });
    this._osc('sine', 58, time, 0.22, vol * 0.35, { endFreq: 32, attack: 0.002, bus: 'music' });
    this._noise(time, 0.03, 0.024, { filter: 'lowpass', freq: 900, bus: 'music' });
  },

  _musicBass(freq, time, dur, vol) {
    const now = Math.max(time, this.ctx.currentTime);
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);
    filter.type = 'lowpass';
    filter.Q.value = 5;
    filter.frequency.setValueAtTime(560, now);
    filter.frequency.exponentialRampToValueAtTime(220, now + dur);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    osc.start(now);
    osc.stop(now + dur + 0.02);
    this._registerSource(osc);
  },

  _musicLead(freq, time, dur, vol) {
    this._osc('sawtooth', freq, time, dur, vol, {
      endFreq: freq * 0.995, attack: 0.03, bus: 'music', detune: 0
    });
    this._osc('square', freq * 2.005, time, dur * 0.8, vol * 0.25, {
      endFreq: freq * 1.99, attack: 0.03, bus: 'music'
    });
  },

  _musicMetal(time, vol, pan = 0) {
    this._noise(time, 0.08, vol, {
      filter: 'highpass', freq: 3400, q: 5, bus: 'music', pan
    });
    this._osc('triangle', 1180 + Math.random() * 420, time, 0.12, vol * 0.45, {
      endFreq: 900, bus: 'music', pan
    });
  },

  _musicHat(time, vol, pan = 0) {
    this._noise(time, 0.035, vol, {
      filter: 'highpass', freq: 6000, q: 1.2, bus: 'music', pan
    });
  },

  _musicThump(time, vol) {
    this._osc('sine', 70, time, 0.16, vol, { endFreq: 42, attack: 0.004, bus: 'music' });
  },

  _musicSubPulse(time, vol) {
    this._osc('sine', 55, time, 0.7, vol, { endFreq: 27, attack: 0.03, bus: 'music' });
    this._osc('triangle', 110, time, 0.5, vol * 0.25, { endFreq: 55, attack: 0.02, bus: 'music' });
  }
};

// Desbloqueo perezoso: el AudioContext solo se crea tras un gesto del usuario.
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const unlock = () => {
    AudioSys.init();
    window.removeEventListener('pointerdown', unlock, true);
    window.removeEventListener('keydown', unlock, true);
  };
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
}

// Sonidos táctiles globales de UI: hover, foco y pulsación mecánica.
let audioUIInstalled = false;
export function setupAudioUI() {
  if (audioUIInstalled || typeof document === 'undefined') return;
  audioUIInstalled = true;

  const CLICKABLE = 'button, .rust-btn, .map-card, .map-diff-tab, .mode-card-hero, '
    + '.mode-card-secondary, .character-card, .upg-card, .difficulty-card, [role="button"]';
  let hovered = null;

  document.addEventListener('pointerover', event => {
    const target = event.target?.closest?.(CLICKABLE);
    if (!target || target === hovered || target.disabled) return;
    hovered = target;
    AudioSys.playUIHover();
  }, true);

  document.addEventListener('pointerout', event => {
    if (!hovered) return;
    if (event.relatedTarget && hovered.contains(event.relatedTarget)) return;
    hovered = null;
  }, true);

  document.addEventListener('focusin', event => {
    if (event.target?.matches?.(CLICKABLE)) AudioSys.playUIHover();
  });

  document.addEventListener('pointerdown', event => {
    const target = event.target?.closest?.(CLICKABLE);
    if (!target || target.disabled) return;
    if (target.matches('input[type="range"]')) return;
    AudioSys.playUIButtonClick();
  }, true);
}
