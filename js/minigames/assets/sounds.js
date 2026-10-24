// Recetas de sonido sintetizado para minijuegos. No hay archivos de audio:
// AudioSys.playSynthPatch construye cada capa con osciladores y ruido filtrado.
// Exports: SOUND_PATCHES, SOUND_IDS, SOUND_LABELS.

const sfx = { bus: 'sfx' };
const ui = { bus: 'ui' };

const note = (freq, when, dur, vol, type = 'triangle', extra = {}) => ({
  kind: 'osc', freq, when, dur, vol, type, ...extra
});

const noise = (when, dur, vol, freq, endFreq, filter = 'bandpass', extra = {}) => ({
  kind: 'noise', when, dur, vol, freq, endFreq, filter, ...extra
});

export const SOUND_PATCHES = {
  // -------------------------------------------------------------------------
  // Acciones de cocina / granja / pesca
  // -------------------------------------------------------------------------
  chop: {
    key: 'mg:chop',
    cooldown: 32,
    layers: [
      noise(0, 0.052, 0.055, 2800, 850, 'highpass', { q: 0.7 }),
      note(205, 0, 0.07, 0.032, 'triangle', { endFreq: 118 }),
      note(760, 0.008, 0.045, 0.018, 'sine', { endFreq: 430 })
    ]
  },
  slice: {
    key: 'mg:slice',
    cooldown: 42,
    layers: [
      noise(0, 0.09, 0.04, 3600, 1400, 'highpass', { q: 1.1 }),
      note(520, 0.012, 0.11, 0.022, 'sine', { endFreq: 300 }),
      note(980, 0.03, 0.08, 0.014, 'triangle', { endFreq: 620 })
    ]
  },
  stir: {
    key: 'mg:stir',
    cooldown: 110,
    layers: [
      noise(0, 0.18, 0.018, 720, 380, 'bandpass', { pink: true, q: 0.8 }),
      note(175, 0, 0.16, 0.012, 'sine', { endFreq: 138 }),
      note(420, 0.04, 0.12, 0.01, 'triangle', { endFreq: 300 })
    ]
  },
  sizzle: {
    key: 'mg:sizzle',
    cooldown: 85,
    layers: [
      noise(0, 0.3, 0.024, 3200, 1700, 'highpass', { pink: true, q: 0.5 }),
      note(130, 0, 0.2, 0.011, 'sine', { endFreq: 92 }),
      noise(0.06, 0.12, 0.012, 2400, 4200, 'bandpass', { q: 2.2 })
    ]
  },
  shake: {
    key: 'mg:shake',
    cooldown: 95,
    layers: [
      noise(0, 0.06, 0.032, 2400, 3000, 'bandpass', { q: 4 }),
      noise(0.07, 0.05, 0.024, 3100, 2500, 'bandpass', { q: 5 }),
      note(132, 0, 0.08, 0.015, 'triangle', { endFreq: 104 })
    ]
  },
  splash: {
    key: 'mg:splash',
    cooldown: 58,
    layers: [
      noise(0, 0.24, 0.044, 1500, 520, 'lowpass', { q: 0.7 }),
      note(310, 0, 0.19, 0.029, 'sine', { endFreq: 92 }),
      note(920, 0.025, 0.12, 0.018, 'sine', { endFreq: 460 })
    ]
  },
  water: {
    key: 'mg:water',
    cooldown: 90,
    layers: [
      noise(0, 0.28, 0.024, 1900, 700, 'lowpass', { q: 0.6 }),
      note(245, 0, 0.2, 0.012, 'sine', { endFreq: 180 }),
      noise(0.12, 0.14, 0.012, 2600, 1200, 'bandpass', { q: 1.4 })
    ]
  },
  dig: {
    key: 'mg:dig',
    cooldown: 85,
    layers: [
      noise(0, 0.17, 0.042, 620, 240, 'lowpass', { q: 0.8 }),
      note(92, 0, 0.15, 0.03, 'sine', { endFreq: 58 }),
      noise(0.04, 0.08, 0.018, 1300, 700, 'bandpass', { q: 1.2 })
    ]
  },
  sow: {
    key: 'mg:sow',
    cooldown: 70,
    layers: [
      noise(0, 0.08, 0.02, 1200, 500, 'bandpass', { q: 1.6 }),
      note(300, 0.01, 0.07, 0.016, 'triangle', { endFreq: 220 })
    ]
  },
  pull: {
    key: 'mg:pull',
    cooldown: 80,
    layers: [
      note(98, 0, 0.16, 0.026, 'sawtooth', { endFreq: 62 }),
      noise(0, 0.12, 0.022, 520, 260, 'lowpass', { q: 0.7 }),
      noise(0.04, 0.08, 0.012, 1600, 900, 'bandpass', { q: 2 })
    ]
  },
  scrub: {
    key: 'mg:scrub',
    cooldown: 55,
    layers: [
      noise(0, 0.09, 0.022, 1500, 900, 'bandpass', { q: 1.4 }),
      noise(0.05, 0.06, 0.014, 2400, 1600, 'highpass', { q: 1.2 })
    ]
  },
  harvest: {
    key: 'mg:harvest',
    cooldown: 90,
    layers: [
      noise(0, 0.16, 0.035, 900, 320, 'lowpass', { q: 0.7 }),
      note(240, 0, 0.12, 0.025, 'triangle', { endFreq: 150 }),
      note(620, 0.04, 0.1, 0.016, 'sine', { endFreq: 820 })
    ]
  },
  reel: {
    key: 'mg:reel',
    cooldown: 38,
    layers: [
      noise(0, 0.03, 0.02, 2600, 1800, 'highpass', { q: 2 }),
      note(1180, 0, 0.028, 0.012, 'square', { endFreq: 900 })
    ]
  },
  bite: {
    key: 'mg:bite',
    cooldown: 140,
    layers: [
      note(390, 0, 0.12, 0.03, 'sine', { endFreq: 700 }),
      note(1240, 0.045, 0.16, 0.024, 'triangle', { endFreq: 1480 }),
      noise(0, 0.09, 0.02, 900, 400, 'lowpass', { q: 0.7 })
    ]
  },
  burn: {
    key: 'mg:burn',
    cooldown: 120,
    layers: [
      noise(0, 0.35, 0.02, 2300, 1100, 'highpass', { pink: true, q: 0.6 }),
      note(122, 0, 0.3, 0.016, 'sawtooth', { endFreq: 68 })
    ]
  },
  pop: {
    key: 'mg:pop',
    cooldown: 26,
    layers: [
      note(680, 0, 0.07, 0.022, 'sine', { endFreq: 1180 }),
      note(1180, 0.045, 0.04, 0.012, 'sine', { endFreq: 1450 })
    ]
  },

  // -------------------------------------------------------------------------
  // Feedback de acierto / fallo / combo
  // -------------------------------------------------------------------------
  good: {
    key: 'mg:good',
    cooldown: 55,
    layers: [
      note(440, 0, 0.12, 0.026, 'triangle'),
      note(554, 0.06, 0.13, 0.023, 'triangle'),
      note(659, 0.12, 0.15, 0.02, 'triangle')
    ]
  },
  perfect: {
    key: 'mg:perfect',
    cooldown: 70,
    layers: [
      note(523, 0, 0.12, 0.026, 'triangle'),
      note(659, 0.055, 0.12, 0.024, 'triangle'),
      note(784, 0.11, 0.13, 0.022, 'triangle'),
      note(1046, 0.17, 0.18, 0.02, 'sine'),
      noise(0.02, 0.16, 0.012, 5200, 7000, 'highpass', { q: 1.2 })
    ]
  },
  fail: {
    key: 'mg:fail',
    cooldown: 140,
    layers: [
      note(185, 0, 0.24, 0.035, 'sawtooth', { endFreq: 82 }),
      note(92, 0.02, 0.18, 0.028, 'square', { endFreq: 60 }),
      noise(0, 0.2, 0.022, 900, 220, 'lowpass', { q: 0.6 })
    ]
  },
  combo: {
    key: 'mg:combo',
    cooldown: 55,
    layers: [
      note(660, 0, 0.08, 0.022, 'triangle'),
      note(880, 0.045, 0.09, 0.02, 'triangle'),
      note(1100, 0.09, 0.1, 0.018, 'triangle'),
      noise(0.01, 0.1, 0.01, 4200, 6000, 'highpass', { q: 1 })
    ]
  },
  countdown: {
    key: 'mg:countdown',
    cooldown: 140,
    layers: [
      note(620, 0, 0.09, 0.026, 'sine'),
      note(880, 0, 0.12, 0.018, 'triangle')
    ]
  },
  countdownGo: {
    key: 'mg:countdownGo',
    cooldown: 300,
    layers: [
      note(880, 0, 0.1, 0.028, 'triangle'),
      note(1100, 0.06, 0.1, 0.024, 'triangle'),
      note(1320, 0.12, 0.18, 0.022, 'sine'),
      noise(0.02, 0.14, 0.012, 5000, 7600, 'highpass', { q: 1 })
    ]
  },
  phaseClear: {
    key: 'mg:phaseClear',
    cooldown: 250,
    layers: [
      note(523, 0, 0.16, 0.026, 'triangle'),
      note(659, 0.08, 0.16, 0.024, 'triangle'),
      note(784, 0.16, 0.18, 0.022, 'triangle'),
      note(1046, 0.25, 0.26, 0.02, 'sine'),
      noise(0.02, 0.26, 0.012, 5600, 7800, 'highpass', { q: 1 })
    ]
  },
  resultFanfare: {
    key: 'mg:resultFanfare',
    cooldown: 600,
    layers: [
      note(523, 0, 0.18, 0.026, 'triangle'),
      note(659, 0.1, 0.18, 0.024, 'triangle'),
      note(784, 0.2, 0.2, 0.022, 'triangle'),
      note(1046, 0.3, 0.3, 0.02, 'sine'),
      note(1318, 0.42, 0.34, 0.016, 'sine'),
      noise(0.05, 0.36, 0.012, 6000, 8200, 'highpass', { q: 1 })
    ]
  },
  tap: {
    key: 'mg:tap',
    cooldown: 24,
    layers: [
      note(900, 0, 0.035, 0.022, 'square', { endFreq: 520 }),
      noise(0, 0.022, 0.014, 3200, 2100, 'highpass', { q: 2 })
    ]
  },
  star: {
    key: 'mg:star',
    cooldown: 70,
    layers: [
      note(1320, 0, 0.18, 0.022, 'sine'),
      note(1760, 0.055, 0.16, 0.018, 'sine'),
      noise(0.01, 0.12, 0.01, 7000, 9000, 'highpass', { q: 1 })
    ]
  },
  whoosh: {
    key: 'mg:whoosh',
    cooldown: 90,
    layers: [
      noise(0, 0.2, 0.024, 520, 2400, 'bandpass', { q: 1.2 })
    ]
  },
  click: {
    key: 'mg:click',
    cooldown: 35,
    layers: [
      noise(0, 0.018, 0.018, 3000, 1800, 'highpass', { q: 3 }),
      note(820, 0, 0.03, 0.014, 'square', { endFreq: 540 })
    ]
  },
  select: {
    key: 'mg:select',
    cooldown: 50,
    layers: [
      note(440, 0, 0.08, 0.024, 'triangle', { endFreq: 660 }),
      note(880, 0.04, 0.1, 0.018, 'sine')
    ]
  },
  error: {
    key: 'mg:error',
    cooldown: 150,
    layers: [
      note(145, 0, 0.18, 0.03, 'sawtooth', { endFreq: 92 }),
      note(98, 0.05, 0.15, 0.024, 'square', { endFreq: 70 })
    ]
  },

  // -------------------------------------------------------------------------
  // Capa musical del minijuego (percusión y marimba, tempo acelerable)
  // -------------------------------------------------------------------------
  musicKick: {
    key: 'mg:musicKick',
    cooldown: 0,
    layers: [
      note(122, 0, 0.17, 0.032, 'sine', { endFreq: 52, attack: 0.002 }),
      noise(0, 0.035, 0.01, 420, 180, 'lowpass', { q: 0.5 })
    ]
  },
  musicShaker: {
    key: 'mg:musicShaker',
    cooldown: 0,
    layers: [
      noise(0, 0.045, 0.008, 6500, 7800, 'highpass', { q: 2 })
    ]
  },
  musicMarimba: {
    key: 'mg:musicMarimba',
    cooldown: 0,
    layers: [
      note(440, 0, 0.16, 0.017, 'triangle', { attack: 0.003 }),
      note(880, 0, 0.09, 0.008, 'sine', { attack: 0.002 })
    ]
  },
  musicRim: {
    key: 'mg:musicRim',
    cooldown: 0,
    layers: [
      noise(0, 0.028, 0.011, 2100, 1500, 'bandpass', { q: 5 }),
      note(1560, 0, 0.028, 0.008, 'square', { endFreq: 1200 })
    ]
  },

  // Firma sonora de la casa.
  uiHover: {
    key: 'mg:uiHover',
    cooldown: 45,
    bus: 'ui',
    layers: [
      noise(0, 0.012, 0.012, 3200, 2600, 'bandpass', { q: 5 }),
      note(1180, 0, 0.018, 0.008, 'sine', { endFreq: 980 })
    ]
  },
  uiConfirm: {
    key: 'mg:uiConfirm',
    cooldown: 80,
    bus: 'ui',
    layers: [
      note(180, 0, 0.08, 0.04, 'square', { endFreq: 72 }),
      note(560, 0.025, 0.07, 0.03, 'triangle', { endFreq: 420 }),
      noise(0, 0.03, 0.02, 1800, 900, 'bandpass', { q: 3 })
    ]
  }
};

// Etiquetas humanas para el laboratorio y futuros menús.
export const SOUND_LABELS = {
  chop: 'Corte seco',
  slice: 'Corte limpio',
  stir: 'Remover',
  sizzle: 'Chisporroteo',
  shake: 'Agitar salero',
  splash: 'Salpicadura',
  water: 'Agua / riego',
  dig: 'Pala / tierra',
  sow: 'Sembrar',
  pull: 'Arrancar',
  scrub: 'Frotar / limpiar',
  harvest: 'Cosecha',
  reel: 'Carrete',
  bite: 'Picada',
  burn: 'Quemado',
  pop: 'Burbuja',
  good: 'Acierto',
  perfect: 'Perfecto',
  fail: 'Fallo',
  combo: 'Combo',
  countdown: 'Cuenta atrás',
  countdownGo: '¡Ya!',
  phaseClear: 'Fase superada',
  resultFanfare: 'Fanfarria final',
  tap: 'Toque',
  star: 'Estrella',
  whoosh: 'Barrido',
  click: 'Clic',
  select: 'Seleccionar',
  error: 'Error',
  musicKick: 'Bombo musical',
  musicShaker: 'Shaker musical',
  musicMarimba: 'Marimba musical',
  musicRim: 'Aro musical',
  uiHover: 'Hover UI',
  uiConfirm: 'Confirmar UI'
};

export const SOUND_IDS = Object.keys(SOUND_PATCHES);
