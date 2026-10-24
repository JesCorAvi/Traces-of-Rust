// Audio procedural: buses de mezcla, reverb cálida, música tropical adaptativa
// y SFX multicapa sintetizados en tiempo real con WebAudio.
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
  MENU: 76,
  PREP: 90,
  COMBAT: 116,
  CLIMAX: 132
});

// Progresión de atardecer en Do mayor: Cmaj7 · Am7 · Fmaj7 · G6.
// Las capas de fondo usan Do/Sol/Mi, consonantes con los cuatro acordes.
const TROPICAL_CHORDS = Object.freeze([
  {
    root: 130.81,
    pad: [130.81, 196.00, 329.63, 246.94],
    arp: [523.25, 659.25, 783.99, 987.77],
    strum: [261.63, 329.63, 392.00, 523.25]
  },
  {
    root: 110.00,
    pad: [110.00, 164.81, 261.63, 392.00],
    arp: [440.00, 523.25, 659.25, 783.99],
    strum: [220.00, 261.63, 329.63, 440.00]
  },
  {
    root: 87.31,
    pad: [87.31, 130.81, 220.00, 329.63],
    arp: [349.23, 440.00, 523.25, 659.25],
    strum: [174.61, 220.00, 261.63, 349.23]
  },
  {
    root: 98.00,
    pad: [98.00, 146.83, 246.94, 329.63],
    arp: [392.00, 493.88, 587.33, 659.25],
    strum: [196.00, 246.94, 293.66, 392.00]
  }
]);

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

  // Subgrave cálido de la marea.
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
  _ambienceWaveTimer: null,
  ambienceSurf: null,

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

    // Reverb cálida de muelle generada en memoria.
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
    const base = this.isEndgameActive ? 0.016 : 0.006;
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
      this.humOsc.frequency.setTargetAtTime(active ? 29 : 43, now, 0.3);
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

  _registerSource(source, nodes = null) {
    if (!source) return;
    this._activeVoices.add(source);
    let cleaned = false;
    let fallbackTimer = null;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      if (fallbackTimer !== null) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      this._activeVoices.delete(source);
      try { source.disconnect(); } catch (e) {}
      if (Array.isArray(nodes)) {
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          if (n && typeof n.disconnect === 'function') {
            try { n.disconnect(); } catch (e) {}
          }
        }
      }
    };
    try { source.addEventListener('ended', cleanup, { once: true }); } catch (e) {}
    // Temporizador de seguridad por si el evento 'ended' no se dispara (pestaña suspendida/minimizada)
    fallbackTimer = setTimeout(cleanup, 6000);
    if (fallbackTimer && typeof fallbackTimer.unref === 'function') fallbackTimer.unref();
  },

  stopAllVoices() {
    if (this._activeVoices) {
      for (const source of Array.from(this._activeVoices)) {
        try { source.stop(); } catch (e) {}
        try { source.disconnect(); } catch (e) {}
      }
      this._activeVoices.clear();
    }
    this.stopPlayerDownHum();
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
    if (!dest) return null;
    let out = node;
    let panner = null;
    if (typeof opts.pan === 'number' && Math.abs(opts.pan) > 0.01 && this.ctx.createStereoPanner) {
      panner = this.ctx.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, opts.pan));
      out.connect(panner);
      out = panner;
    }
    out.connect(dest);
    return panner;
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
      const panner = this._route(gain, opts);
      osc.start(now);
      osc.stop(now + dur + 0.02);
      this._registerSource(osc, panner ? [gain, panner] : [gain]);
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
      const panner = this._route(gain, opts);
      source.start(now);
      source.stop(now + dur + 0.02);
      this._registerSource(source, panner ? [filter, gain, panner] : [filter, gain]);
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

  // Patch data-driven para minijuegos: capas de osciladores y ruido filtrado.
  // Mantiene el bus, el muteo, el límite de voces y la limpieza de AudioSys.
  playSynthPatch(patch = {}, options = {}) {
    if (!patch || !Array.isArray(patch.layers) || patch.layers.length === 0) return false;
    if (!this.ctx) this.init();
    if (!this.ctx) return false;

    const key = options.key || patch.key || 'mg:patch';
    if (!this._allow(key, patch.cooldown || 0)) return false;

    const rate = Math.max(0.25, Math.min(4, Number(options.rate) || 1));
    const volume = clamp01(options.volume ?? 1);
    if (volume <= 0) return false;
    const t0 = this.ctx.currentTime + Math.max(0, Number(options.delay) || 0);
    const baseBus = options.bus || patch.bus || 'sfx';

    for (let i = 0; i < patch.layers.length; i++) {
      const layer = patch.layers[i];
      if (!layer) continue;
      const when = t0 + Math.max(0, Number(layer.when) || 0);
      const dur = Math.max(0.008, Number(layer.dur) || 0.08);
      const vol = clamp01((Number(layer.vol) || 0.02) * volume);
      if (vol <= 0) continue;
      const bus = layer.bus || baseBus;
      const pan = Number.isFinite(options.pan) ? options.pan : layer.pan;
      if (layer.kind === 'noise') {
        this._noise(when, dur, vol, {
          filter: layer.filter || 'bandpass',
          freq: Math.max(20, (Number(layer.freq) || 1200) * rate),
          endFreq: layer.endFreq ? Math.max(20, layer.endFreq * rate) : undefined,
          q: Number.isFinite(layer.q) ? layer.q : undefined,
          pink: !!layer.pink,
          attack: layer.attack,
          playbackRate: layer.playbackRate,
          bus,
          pan
        });
      } else {
        this._osc(layer.type || 'triangle', Math.max(20, (Number(layer.freq) || 440) * rate), when, dur, vol, {
          endFreq: layer.endFreq ? Math.max(20, layer.endFreq * rate) : undefined,
          attack: layer.attack,
          detune: layer.detune,
          bus,
          pan
        });
      }
    }
    return true;
  },

  // Reproduce un AudioBuffer externo (hook de sustitución de assets) por el
  // mismo grafo de mezcla y con la misma limpieza que el resto de SFX.
  playBuffer(buffer, options = {}) {
    if (!buffer) return false;
    if (!this.ctx) this.init();
    if (!this.ctx) return false;
    const audioBuffer = buffer instanceof AudioBuffer ? buffer : buffer.buffer;
    if (!(audioBuffer instanceof AudioBuffer)) return false;
    const key = options.key || 'mg:buffer';
    if (!this._allow(key, options.cooldown || 0)) return false;

    const rate = Math.max(0.25, Math.min(4, Number(options.rate) || 1));
    const volume = Math.max(0.0002, Math.min(1, Number(options.volume) || 1));
    const now = this.ctx.currentTime + Math.max(0, Number(options.delay) || 0);
    const duration = Math.max(0.03, audioBuffer.duration / rate);
    const end = now + duration;

    try {
      const source = this.ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = rate;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + 0.004);
      const fadeAt = Math.max(now + 0.01, end - 0.015);
      gain.gain.setValueAtTime(volume, fadeAt);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      source.connect(gain);

      let panner = null;
      if (Number.isFinite(options.pan) && Math.abs(options.pan) > 0.01 && this.ctx.createStereoPanner) {
        panner = this.ctx.createStereoPanner();
        panner.pan.value = Math.max(-1, Math.min(1, options.pan));
        gain.connect(panner);
        panner.connect(this._busNode(options.bus || 'sfx'));
      } else {
        gain.connect(this._busNode(options.bus || 'sfx'));
      }

      this._registerSource(source, panner ? [gain, panner] : [gain]);
      source.start(now);
      source.stop(end + 0.02);
      return true;
    } catch (error) {
      return false;
    }
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

  // ---------------------------------------------------------------------------
  // Chiringuito: granja, servicio y cocina
  // ---------------------------------------------------------------------------

  playHarvest() {
    if (!this._allow('chiringuito:harvest', 80)) return;
    const t = this.ctx.currentTime;
    this._noise(t, 0.12, 0.045, { filter: 'bandpass', freq: 1800, q: 1.5, endFreq: 900 });
    this._osc('triangle', 420, t + 0.03, 0.08, 0.03, { endFreq: 620, bus: 'ui' });
    this._osc('sine', 780, t + 0.1, 0.08, 0.02, { endFreq: 940, bus: 'ui' });
  },

  playBell() {
    if (!this._allow('chiringuito:bell', 200)) return;
    const t = this.ctx.currentTime;
    this._osc('sine', 1480, t, 0.5, 0.06, { endFreq: 1320, bus: 'ui' });
    this._osc('sine', 2020, t + 0.01, 0.34, 0.025, { endFreq: 1880, bus: 'ui' });
    this._osc('triangle', 740, t + 0.02, 0.24, 0.025, { endFreq: 680, bus: 'ui' });
  },

  playCustomerArrive() {
    if (!this._allow('chiringuito:customer', 130)) return;
    const t = this.ctx.currentTime;
    this._osc('triangle', 360, t, 0.08, 0.03, { endFreq: 440, bus: 'ui' });
    this._osc('triangle', 520, t + 0.08, 0.1, 0.026, { endFreq: 620, bus: 'ui' });
  },

  playOrderTicket() {
    if (!this._allow('chiringuito:ticket', 90)) return;
    const t = this.ctx.currentTime;
    this._noise(t, 0.04, 0.022, { filter: 'bandpass', freq: 2600, q: 5, bus: 'ui' });
    this._osc('square', 640, t + 0.02, 0.03, 0.018, { endFreq: 420, bus: 'ui' });
  },

  playChop() {
    if (!this._allow('chiringuito:chop', 55)) return;
    const t = this.ctx.currentTime;
    this._noise(t, 0.035, 0.045, { filter: 'highpass', freq: 1900, endFreq: 700 });
    this._osc('triangle', 180, t, 0.045, 0.025, { endFreq: 110, bus: 'sfx' });
  },

  playSizzle() {
    if (!this._allow('chiringuito:sizzle', 120)) return;
    const t = this.ctx.currentTime;
    this._noise(t, 0.22, 0.025, { pink: true, filter: 'highpass', freq: 2800, endFreq: 1600 });
    this._osc('sine', 120, t, 0.16, 0.012, { endFreq: 90, bus: 'sfx' });
  },

  playPlate() {
    if (!this._allow('chiringuito:plate', 80)) return;
    const t = this.ctx.currentTime;
    this._osc('sine', 1280, t, 0.08, 0.025, { endFreq: 1080, bus: 'ui' });
    this._noise(t, 0.03, 0.018, { filter: 'highpass', freq: 3200, bus: 'ui' });
  },

  playServeDish() {
    if (!this._allow('chiringuito:serve', 100)) return;
    const t = this.ctx.currentTime;
    this._osc('triangle', 660, t, 0.08, 0.03, { endFreq: 840, bus: 'ui' });
    this._osc('sine', 990, t + 0.06, 0.12, 0.022, { endFreq: 1180, bus: 'ui' });
  },

  playPearls(amount = 1) {
    if (!this._allow('chiringuito:pearls', 90)) return;
    const t = this.ctx.currentTime;
    const notes = amount > 10 ? [880, 1100, 1320, 1760] : [880, 1180];
    notes.forEach((f, i) => {
      this._osc('triangle', f, t + i * 0.045, 0.1, 0.02, { endFreq: f * 1.06, bus: 'ui' });
    });
  },

  playCookResult(quality = 'ok') {
    if (!this._allow(`chiringuito:cook:${quality}`, 130)) return;
    const t = this.ctx.currentTime;
    if (quality === 'perfect' || quality === 'good') {
      const notes = quality === 'perfect' ? [523, 659, 784, 1046] : [440, 554, 659];
      notes.forEach((f, i) => this._osc('triangle', f, t + i * 0.07, 0.16, 0.028, { endFreq: f * 1.02, bus: 'ui' }));
    } else {
      this._osc('sawtooth', 180, t, 0.25, 0.03, { endFreq: 90, bus: 'sfx' });
      this._noise(t, 0.2, 0.025, { filter: 'lowpass', freq: 900, endFreq: 220 });
    }
  },

  playSeasonFanfare() {
    if (!this._allow('chiringuito:season', 2000)) return;
    const t = this.ctx.currentTime;
    [392, 523, 659, 784].forEach((f, i) => {
      this._osc('triangle', f, t + i * 0.16, 0.3, 0.03, { endFreq: f, bus: 'ui' });
    });
    this._osc('sine', 196, t, 1.1, 0.02, { endFreq: 196, bus: 'ui' });
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
  // Torretas, despensa y oleadas
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

  playTropicalSiren() {
    return this.playIndustrialSiren();
  },

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
    const panner = this._route(gain, { bus: 'sfx' });
    osc.start(t);
    osc.stop(t + 3.02);
    this._registerSource(osc, panner ? [filter, gain, panner] : [filter, gain]);

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
      this.playerDownHumFilter = filter;
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
      const osc = this.playerDownHumOsc;
      const gain = this.playerDownHumGain;
      const filter = this.playerDownHumFilter;
      this.playerDownHumOsc = null;
      this.playerDownHumGain = null;
      this.playerDownHumFilter = null;
      setTimeout(() => {
        try { osc?.disconnect(); } catch (e) {}
        try { gain?.disconnect(); } catch (e) {}
        try { filter?.disconnect(); } catch (e) {}
      }, 250);
    } catch (e) {
      this.playerDownHumOsc = null;
      this.playerDownHumGain = null;
      this.playerDownHumFilter = null;
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

    // Colchón subgrave muy suave: calor de atardecer, sin zumbido industrial.
    this.humOsc = ctx.createOscillator();
    this.humGain = ctx.createGain();
    const humFilter = ctx.createBiquadFilter();
    this.humOsc.type = 'sine';
    this.humOsc.frequency.value = 43;
    humFilter.type = 'lowpass';
    humFilter.frequency.value = 105;
    this.humGain.gain.value = 0.0001;
    this.humOsc.connect(humFilter);
    humFilter.connect(this.humGain);
    this.humGain.connect(this.ambienceGain);
    this.humOsc.start();

    // Marea continua: ruido rosa filtrado, con vaivén lento de volumen y brillo.
    const surf = ctx.createBufferSource();
    surf.buffer = this.pinkBuffer;
    surf.loop = true;
    const surfFilter = ctx.createBiquadFilter();
    surfFilter.type = 'lowpass';
    surfFilter.frequency.value = 760;
    surfFilter.Q.value = 0.45;
    const surfGain = ctx.createGain();
    surfGain.gain.value = 0.034;
    const surfPan = typeof ctx.createStereoPanner === 'function' ? ctx.createStereoPanner() : null;
    surf.connect(surfFilter);
    surfFilter.connect(surfGain);
    if (surfPan) {
      surfPan.pan.value = 0.12;
      surfGain.connect(surfPan);
      surfPan.connect(this.ambienceGain);
    } else {
      surfGain.connect(this.ambienceGain);
    }

    const surfSwell = ctx.createOscillator();
    const surfSwellGain = ctx.createGain();
    surfSwell.frequency.value = 0.085;
    surfSwellGain.gain.value = 0.012;
    surfSwell.connect(surfSwellGain);
    surfSwellGain.connect(surfGain.gain);

    const surfLfo = ctx.createOscillator();
    const surfLfoGain = ctx.createGain();
    surfLfo.frequency.value = 0.06;
    surfLfoGain.gain.value = 240;
    surfLfo.connect(surfLfoGain);
    surfLfoGain.connect(surfFilter.frequency);

    surf.start();
    surfSwell.start();
    surfLfo.start();

    // Espuma fina que acompaña al romper de la ola.
    const foam = ctx.createBufferSource();
    foam.buffer = this.pinkBuffer;
    foam.loop = true;
    const foamFilter = ctx.createBiquadFilter();
    foamFilter.type = 'highpass';
    foamFilter.frequency.value = 2800;
    foamFilter.Q.value = 0.5;
    const foamGain = ctx.createGain();
    foamGain.gain.value = 0.006;
    const foamPan = typeof ctx.createStereoPanner === 'function' ? ctx.createStereoPanner() : null;
    foam.connect(foamFilter);
    foamFilter.connect(foamGain);
    if (foamPan) {
      foamPan.pan.value = -0.18;
      foamGain.connect(foamPan);
      foamPan.connect(this.ambienceGain);
    } else {
      foamGain.connect(this.ambienceGain);
    }
    const foamSwell = ctx.createOscillator();
    const foamSwellGain = ctx.createGain();
    foamSwell.frequency.value = 0.12;
    foamSwellGain.gain.value = 0.003;
    foamSwell.connect(foamSwellGain);
    foamSwellGain.connect(foamGain.gain);
    foam.start();
    foamSwell.start();

    this.ambienceSurf = {
      source: surf,
      filter: surfFilter,
      gain: surfGain,
      swell: surfSwell,
      lfo: surfLfo,
      foam,
      foamFilter,
      foamGain
    };

    // Aire cálido muy tenue sobre la marea.
    const breeze = ctx.createBufferSource();
    breeze.buffer = this.pinkBuffer;
    breeze.loop = true;
    const breezeFilter = ctx.createBiquadFilter();
    breezeFilter.type = 'lowpass';
    breezeFilter.frequency.value = 680;
    breezeFilter.Q.value = 0.35;
    const breezeGain = ctx.createGain();
    breezeGain.gain.value = 0.014;
    breeze.connect(breezeFilter);
    breezeFilter.connect(breezeGain);
    breezeGain.connect(this.ambienceGain);
    breeze.start();

    this.ambienceWind = { source: breeze, filter: breezeFilter, gain: breezeGain };

    // Rompientes periódicas con paneo aleatorio para dar amplitud a la orilla.
    if (!this._ambienceWaveTimer) {
      this._ambienceWaveTimer = setInterval(() => this._playWaveCrash(), 8500);
      if (this._ambienceWaveTimer && typeof this._ambienceWaveTimer.unref === 'function') {
        this._ambienceWaveTimer.unref();
      }
    }

    this.updateDroneVolume();
  },

  _playWaveCrash() {
    if (!this.ctx || this.ctx.state !== 'running' || this.muted || this.ambVol <= 0) return;
    const t = this.ctx.currentTime + 0.06;
    const pan = (Math.random() - 0.5) * 0.55;
    const vol = 0.034 + Math.random() * 0.018;
    this._noise(t, 1.55, vol, {
      pink: true, filter: 'lowpass', freq: 900, endFreq: 140,
      q: 0.4, attack: 0.24, bus: 'ambience', pan
    });
    this._noise(t + 0.08, 0.65, vol * 0.22, {
      filter: 'highpass', freq: 2300, q: 0.5,
      attack: 0.12, bus: 'ambience', pan: pan * -0.6
    });
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
        name: 'menu', base: 0.2,
        voices: [
          { type: 'sine', freq: 65.41, amp: 0.055 },
          { type: 'sine', freq: 98.00, amp: 0.035 },
          { type: 'triangle', freq: 130.81, amp: 0.028 },
          { type: 'triangle', freq: 196.00, amp: 0.018 }
        ],
        filter: { freq: 540, q: 0.55 },
        lfo: { rate: 0.035, depth: 100 }
      },
      {
        name: 'prep', base: 0.14,
        voices: [
          { type: 'sine', freq: 65.41, amp: 0.04 },
          { type: 'triangle', freq: 130.81, amp: 0.03 },
          { type: 'triangle', freq: 196.00, amp: 0.02 },
          { type: 'sine', freq: 329.63, amp: 0.012 }
        ],
        filter: { freq: 760, q: 0.6 },
        lfo: { rate: 0.06, depth: 90 }
      },
      {
        name: 'combat', base: 0.12,
        voices: [
          { type: 'sine', freq: 65.41, amp: 0.04 },
          { type: 'triangle', freq: 130.81, amp: 0.028 },
          { type: 'triangle', freq: 196.00, amp: 0.018 },
          { type: 'sine', freq: 261.63, amp: 0.01 }
        ],
        filter: { freq: 900, q: 0.7 },
        lfo: { rate: 0.12, depth: 70 }
      },
      {
        name: 'climax', base: 0.15,
        voices: [
          { type: 'sine', freq: 65.41, amp: 0.05 },
          { type: 'triangle', freq: 130.81, amp: 0.035 },
          { type: 'triangle', freq: 196.00, amp: 0.025 },
          { type: 'sine', freq: 329.63, amp: 0.012 }
        ],
        filter: { freq: 1200, q: 0.8 },
        lfo: { rate: 0.2, depth: 80 },
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

  _scheduleMusicStep(step, time, stepDur = 0.16) {
    const state = this.musicState;
    const barStep = step % 16;
    const bar = Math.floor(step / 16) % TROPICAL_CHORDS.length;
    const chord = TROPICAL_CHORDS[bar];
    const intensity = this.getMusicIntensity();
    const boost = 1 + intensity * 0.22;

    if (state === MUSIC_STATES.MENU) {
      if (barStep === 0) {
        this._musicPadChord(chord, time, stepDur * 15.4, 0.018, -0.06);
        this._musicUkeStrum(chord, time, 0.013, -0.28);
        this._musicBass(chord.root, time, stepDur * 7, 0.043, -0.15);
      }

      const melodySteps = [0, 3, 6, 10, 12, 14];
      const melodyIndex = melodySteps.indexOf(barStep);
      if (melodyIndex >= 0) {
        const noteIndex = [0, 2, 1, 3, 2, 1][melodyIndex];
        this._musicMarimba(
          chord.arp[noteIndex % chord.arp.length],
          time, 0.72, 0.018 + (melodyIndex === 3 ? 0.004 : 0), melodyIndex % 2 ? 0.3 : -0.3
        );
      }
      if (barStep === 8) this._musicShaker(time, 0.007, 0.35);
      if (barStep === 4 || barStep === 12) this._musicClave(time, 0.005, -0.2);
      return;
    }

    if (state === MUSIC_STATES.PREP) {
      if (barStep === 0) {
        this._musicPadChord(chord, time, stepDur * 15.4, 0.016, -0.04);
        this._musicUkeStrum(chord, time, 0.015, -0.24);
        this._musicBass(chord.root, time, stepDur * 7, 0.04, -0.12);
      } else if (barStep === 8) {
        this._musicUkeStrum(chord, time, 0.01, 0.28);
      }

      const melodySteps = [0, 2, 3, 6, 10, 11, 14];
      const melodyIndex = melodySteps.indexOf(barStep);
      if (melodyIndex >= 0) {
        const noteIndex = [0, 2, 1, 3, 2, 1, 0][melodyIndex];
        this._musicMarimba(
          chord.arp[noteIndex % chord.arp.length],
          time, 0.46, 0.014 + (melodyIndex === 3 ? 0.003 : 0), melodyIndex % 2 ? 0.26 : -0.26
        );
      }
      if (barStep === 4 || barStep === 12) this._musicKick(time, 0.045);
      if (barStep % 2 === 0) this._musicShaker(time, 0.005, 0.25);
      if (barStep === 6 || barStep === 14) this._musicConga(time, 0.022, 1, -0.2);
      return;
    }

    const isCombat = state === MUSIC_STATES.COMBAT;

    if (barStep === 0) {
      this._musicPadChord(chord, time, stepDur * (isCombat ? 15 : 15.2), isCombat ? 0.015 : 0.019, -0.05);
      this._musicUkeStrum(chord, time, isCombat ? 0.016 : 0.022, 0.28);
      this._musicBass(chord.root, time, stepDur * 5.5, (isCombat ? 0.05 : 0.055) * boost, -0.15);
    } else if (barStep === 8) {
      this._musicPadChord(chord, time, stepDur * 7, isCombat ? 0.01 : 0.012, 0.12);
      this._musicBass(chord.root * 1.5, time, stepDur * 2.5, (isCombat ? 0.028 : 0.032) * boost, 0.15);
    }

    // Steel drum principal: melodía de arpegio del acorde.
    if (barStep % 2 === 0) {
      const noteIndex = (barStep / 2) % chord.arp.length;
      this._musicSteelDrum(
        chord.arp[noteIndex],
        time,
        isCombat ? 0.42 : 0.35,
        (isCombat ? 0.022 : 0.027) * boost,
        noteIndex % 2 ? 0.28 : -0.28
      );
    } else if (!isCombat) {
      // En el clímax, respuesta de marimba en los contratiempos.
      const noteIndex = Math.floor(barStep / 2) % chord.arp.length;
      this._musicMarimba(
        chord.arp[noteIndex] * 0.5,
        time,
        0.3,
        0.016 * boost,
        barStep % 4 === 1 ? -0.32 : 0.32
      );
    }

    // Ritmo de tambores de mano.
    if (barStep === 0 || barStep === 4 || barStep === 8 || barStep === 12) {
      this._musicKick(time, (isCombat ? 0.06 : 0.075) * boost);
    }
    if (barStep === 3 || barStep === 7 || barStep === 11 || barStep === 15) {
      this._musicConga(time, (isCombat ? 0.026 : 0.035) * boost, barStep === 7 ? 1.18 : 1, barStep === 11 ? -0.25 : 0.25);
    }
    if (barStep === 6 || barStep === 14) {
      this._musicClave(time, (isCombat ? 0.01 : 0.014) * boost, 0.2);
    }
    if (isCombat) {
      if (barStep % 2 === 1) this._musicShaker(time, 0.005, 0.3);
    } else {
      this._musicShaker(time, 0.007, barStep % 2 ? -0.35 : 0.35);
      if (barStep === 1 || barStep === 5 || barStep === 9 || barStep === 13) {
        this._musicMarimba(
          chord.arp[Math.floor(barStep / 4) % chord.arp.length] * 2,
          time,
          0.28,
          0.013 * boost,
          -0.3
        );
      }
    }
  },

  getMusicIntensity() {
    if (this.musicState === MUSIC_STATES.CLIMAX) return 1;
    return Math.max(this.isEndgameActive ? 1 : 0, this._bossMusicActive ? 0.8 : 0);
  },

  _musicPadChord(chord, time, dur, vol, pan = 0) {
    if (!chord) return;
    for (let i = 0; i < chord.pad.length; i++) {
      this._osc('sine', chord.pad[i], time, dur, vol * (i === 0 ? 1.15 : 0.82), {
        attack: 0.34,
        bus: 'music',
        pan: pan + (i % 2 === 0 ? -0.05 : 0.05)
      });
    }
  },

  _musicUkeStrum(chord, time, vol, pan = 0) {
    if (!chord) return;
    const direction = Math.random() < 0.5 ? 1 : -1;
    for (let i = 0; i < chord.strum.length; i++) {
      const note = chord.strum[direction > 0 ? i : chord.strum.length - 1 - i];
      this._musicPluck(note, time + i * 0.026, 0.32, vol, pan + (i - 1.5) * 0.08);
    }
  },

  _musicPluck(freq, time, dur, vol, pan = 0) {
    this._osc('triangle', freq, time, dur, vol, {
      endFreq: freq * 0.992,
      attack: 0.003,
      bus: 'music',
      pan
    });
    this._noise(time, 0.022, vol * 0.16, {
      filter: 'bandpass', freq: 1800, q: 2, bus: 'music', pan
    });
  },

  _musicMarimba(freq, time, dur, vol, pan = 0) {
    this._osc('sine', freq, time, dur, vol, {
      endFreq: freq * 0.995,
      attack: 0.003,
      bus: 'music',
      pan
    });
    this._osc('sine', freq * 2.01, time, dur * 0.52, vol * 0.34, {
      endFreq: freq * 1.99,
      attack: 0.002,
      bus: 'music',
      pan
    });
    this._osc('triangle', freq * 3.02, time, dur * 0.24, vol * 0.1, {
      endFreq: freq * 3.0,
      attack: 0.002,
      bus: 'music',
      pan
    });
    this._noise(time, 0.022, vol * 0.12, {
      filter: 'bandpass', freq: 2100, q: 4, bus: 'music', pan
    });
  },

  _musicSteelDrum(freq, time, dur, vol, pan = 0) {
    this._osc('sine', freq, time, dur, vol, {
      endFreq: freq * 0.994,
      attack: 0.006,
      bus: 'music',
      pan
    });
    this._osc('triangle', freq * 2.01, time, dur * 0.56, vol * 0.3, {
      endFreq: freq * 2.0,
      attack: 0.004,
      bus: 'music',
      pan
    });
    this._osc('sine', freq * 3.03, time, dur * 0.28, vol * 0.12, {
      endFreq: freq * 3.0,
      attack: 0.003,
      bus: 'music',
      pan
    });
    this._noise(time, 0.035, vol * 0.2, {
      filter: 'bandpass', freq: 2600, q: 5, bus: 'music', pan
    });
  },

  _musicShaker(time, vol, pan = 0) {
    this._noise(time, 0.048, vol, {
      filter: 'highpass', freq: 4500, q: 0.8, bus: 'music', pan, attack: 0.004
    });
  },

  _musicClave(time, vol, pan = 0) {
    this._osc('triangle', 820, time, 0.065, vol, {
      endFreq: 760, attack: 0.001, bus: 'music', pan
    });
    this._noise(time, 0.025, vol * 0.55, {
      filter: 'bandpass', freq: 1700, q: 3, bus: 'music', pan
    });
  },

  _musicConga(time, vol, pitch = 1, pan = 0) {
    this._osc('sine', 185 * pitch, time, 0.15, vol, {
      endFreq: 92 * pitch, attack: 0.002, bus: 'music', pan
    });
    this._noise(time, 0.04, vol * 0.22, {
      filter: 'bandpass', freq: 600, q: 1.2, bus: 'music', pan
    });
  },

  _musicKick(time, vol = 0.05) {
    this._osc('sine', 96, time, 0.27, vol, {
      endFreq: 44, attack: 0.003, bus: 'music'
    });
    this._noise(time, 0.045, vol * 0.18, {
      filter: 'lowpass', freq: 260, q: 0.6, bus: 'music'
    });
  },

  _musicBass(freq, time, dur, vol, pan = 0) {
    this._osc('triangle', freq, time, dur, vol, {
      endFreq: freq * 0.988,
      attack: 0.01,
      bus: 'music',
      pan
    });
    this._osc('sine', freq * 0.5, time, dur * 0.88, vol * 0.35, {
      endFreq: freq * 0.494,
      attack: 0.012,
      bus: 'music',
      pan
    });
  },

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
