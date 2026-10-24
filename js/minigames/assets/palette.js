// Paleta única de los minijuegos: atardecer tropical cartoon, saturado y legible.
// Todos los sprites, modelos 3D, partículas y CSS de minijuegos beben de aquí.
// Exports: PALETTE, PALETTE_FLAT, applyPaletteVars.

export const PALETTE = Object.freeze({
  ink: '#24140f',
  inkSoft: '#3a2218',
  inkBlue: '#10262a',

  cream: '#fff4d6',
  paper: '#f7e6b8',
  paperDark: '#e4cd97',

  wood: '#7a4a2b',
  woodDark: '#4d2c19',
  woodLight: '#a96a3d',
  woodGrain: '#5d351f',

  coral: '#ff6b4a',
  coralDark: '#c53d31',
  coralLight: '#ff9a75',
  tomato: '#e94b35',
  tomatoDark: '#a82e24',

  mango: '#ffb23f',
  pineapple: '#ffd45c',
  gold: '#ffcf4a',
  star: '#ffd94a',

  lime: '#9be564',
  leaf: '#4caf50',
  leafDark: '#2f7d3a',
  leafLight: '#7bd66d',

  lagoon: '#3fc1c9',
  lagoonLight: '#8ce6e3',
  sea: '#1f8a9e',
  seaDark: '#136070',
  seaDeep: '#0d4653',

  skyTop: '#7b4a8f',
  skyMid: '#ff8a65',
  skyLow: '#ffd08a',
  sun: '#fff0a8',
  night: '#2a1b3d',

  steel: '#c8d4d6',
  steelMid: '#8fa0a4',
  steelDark: '#5d6c70',
  steelLight: '#eef6f2',

  salt: '#fffdf5',
  sugar: '#f4e3c2',
  steam: '#f7fbf5',

  danger: '#e94b35',
  success: '#7ed957',
  perfect: '#ffd94a',
  good: '#9be564',
  warn: '#ffb23f',

  shadow: 'rgba(36, 20, 15, 0.28)',
  shadowStrong: 'rgba(36, 20, 15, 0.48)',
  glass: 'rgba(255, 244, 214, 0.12)'
});

// Lista plana práctica para partículas y aleatoriedad visual.
export const PALETTE_FLAT = Object.freeze([
  PALETTE.coral,
  PALETTE.mango,
  PALETTE.pineapple,
  PALETTE.lime,
  PALETTE.lagoon,
  PALETTE.tomato,
  PALETTE.cream,
  PALETTE.steel
]);

const CSS_VARS = Object.freeze({
  '--mg-ink': PALETTE.ink,
  '--mg-ink-soft': PALETTE.inkSoft,
  '--mg-ink-blue': PALETTE.inkBlue,
  '--mg-cream': PALETTE.cream,
  '--mg-paper': PALETTE.paper,
  '--mg-paper-dark': PALETTE.paperDark,
  '--mg-wood': PALETTE.wood,
  '--mg-wood-dark': PALETTE.woodDark,
  '--mg-wood-light': PALETTE.woodLight,
  '--mg-coral': PALETTE.coral,
  '--mg-coral-dark': PALETTE.coralDark,
  '--mg-coral-light': PALETTE.coralLight,
  '--mg-tomato': PALETTE.tomato,
  '--mg-mango': PALETTE.mango,
  '--mg-pineapple': PALETTE.pineapple,
  '--mg-gold': PALETTE.gold,
  '--mg-star': PALETTE.star,
  '--mg-lime': PALETTE.lime,
  '--mg-leaf': PALETTE.leaf,
  '--mg-leaf-dark': PALETTE.leafDark,
  '--mg-lagoon': PALETTE.lagoon,
  '--mg-sea': PALETTE.sea,
  '--mg-sea-dark': PALETTE.seaDark,
  '--mg-steel': PALETTE.steel,
  '--mg-steel-dark': PALETTE.steelDark,
  '--mg-salt': PALETTE.salt,
  '--mg-danger': PALETTE.danger,
  '--mg-success': PALETTE.success,
  '--mg-perfect': PALETTE.perfect,
  '--mg-shadow': PALETTE.shadow,
  '--mg-shadow-strong': PALETTE.shadowStrong
});

// Inyecta la paleta como custom properties. La vista de minijuego lo hace sobre
// su overlay y el laboratorio sobre <html>, de modo que CSS y canvas comparten
// exactamente los mismos colores sin duplicar hex en las hojas.
export function applyPaletteVars(root = null) {
  if (typeof document === 'undefined') return;
  const target = root || document.documentElement;
  if (!target?.style) return;
  for (const [name, value] of Object.entries(CSS_VARS)) {
    target.style.setProperty(name, value);
  }
}
