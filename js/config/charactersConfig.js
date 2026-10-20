// Catálogo de operadores tácticos por arma para Traces of Rust.
// Nombres y roles de designación militar / industrial para la atmósfera de contención biológica.
// Exports: CHARACTERS, DEFAULT_CHARACTER_ID, getSelectedCharacterId, setSelectedCharacterId, getCharacterById.

export const DEFAULT_CHARACTER_ID = 'otto';

export const CHARACTERS = {
  otto: {
    id: 'otto',
    weapon: 'slash',
    weaponTitle: 'Sierra Rotatoria',
    title: 'Dr. V. Richter',
    role: 'Cirujano Táctico',
    desc: 'Unidad médica forense equipada con instrumental rotatorio de amputación para desarticulación rápida de biomasa hostil.',
    passive: 'Protocolo Disección',
    passiveDesc: '+15% Vel. Maniobra, +25% Daño Sierra y desgarros críticos en área.',
    statMods: { moveSpeedMult: 1.15, slashDmgMult: 1.25, critChanceBonus: 0.08 },
    color: '#e05555',
    accentColor: '#6e1818',
    icon: 'slash'
  },
  mack: {
    id: 'mack',
    weapon: 'shotgun',
    weaponTitle: 'Escopeta de Trinchera',
    title: 'Sargento K. Briggs',
    role: 'Infantería de Brecha',
    desc: 'Veterano de contención pesada con escopeta calibre 12 y blindaje de asalto capaz de repeler hordas a corta distancia.',
    passive: 'Supresión Cinética',
    passiveDesc: '+30 Pulso Base, +20% Daño Postas y Fuerza de Empuje x2 (Knockback).',
    statMods: { baseHpBonus: 30, projectileDmgMult: 1.20, knockbackMult: 2.0 },
    color: '#d4a034',
    accentColor: '#5c4210',
    icon: 'shotgun'
  },
  pepe: {
    id: 'pepe',
    weapon: 'flamethrower',
    weaponTitle: 'Lanzallamas Napalm',
    title: 'Sanitizador T. Keller',
    role: 'Especialista Pirolítico',
    desc: 'Operador de cuadrilla de incineración dotado de soplete de napalm a alta presión para esterilización de sectores infectados.',
    passive: 'Esterilización Térmica',
    passiveDesc: '+25% Cadencia de flujo ígneo y +30% Daño térmico residual continuo.',
    statMods: { atkSpeedMult: 1.25, fireDmgMult: 1.30 },
    color: '#e8621e',
    accentColor: '#7a2b08',
    icon: 'flamethrower'
  },
  morbo: {
    id: 'morbo',
    weapon: 'aura',
    weaponTitle: 'Incensario Cáustico',
    title: 'Custodia M. Vane',
    role: 'Agente Toxicológica',
    desc: 'Custodia de purga bioquímica que propaga agentes corrosivos mediante un incensario hermético para disolver tejidos hostiles.',
    passive: 'Miasma Bioquímico',
    passiveDesc: '+30% Área cáustica, +1.0 HP/s absorción celular y ralentización motora.',
    statMods: { areaMult: 1.30, regenPerSec: 1.0, auraSlowBonus: 0.35 },
    color: '#55de3e',
    accentColor: '#1a5412',
    icon: 'aura'
  },
  bob: {
    id: 'bob',
    weapon: 'mines',
    weaponTitle: 'Minas de Dispersión',
    title: 'Zapador J. Novak',
    role: 'Ingeniero de Demolición',
    desc: 'Técnico de voladuras de subsuelo especializado en minas de dispersión de metralla para bloqueo de pasarelas y accesos.',
    passive: 'Fragmentación Pesada',
    passiveDesc: '+1 Proyectil multidisparo base y +35% Sobrepresión explosiva.',
    statMods: { bonusProjectiles: 1, explosiveDmgMult: 1.35 },
    color: '#e67828',
    accentColor: '#6e3008',
    icon: 'mines'
  },
  krauss: {
    id: 'krauss',
    weapon: 'harpoon',
    weaponTitle: 'Arpón Neumático',
    title: 'Capitán H. Krauss',
    role: 'Tirador Balístico',
    desc: 'Comandante de balística neumática armado con arpones de tungsteno capaces de perforar columnas enteras de blindaje y carne.',
    passive: 'Impacto Perforante',
    passiveDesc: '+40% Alcance efectivo de tiro y +30% Daño perforante crítico.',
    statMods: { rangeMult: 1.40, harpoonDmgMult: 1.30, critChanceBonus: 0.12 },
    color: '#c4b44a',
    accentColor: '#544c18',
    icon: 'harpoon'
  },
  axel: {
    id: 'axel',
    weapon: 'orbital',
    weaponTitle: 'Cuchillas Orbitales',
    title: 'Capataz A. Hogg',
    role: 'Custodio de Despiece',
    desc: 'Jefe de planta de despiece equipado con cuchillas y jaulas orbitales de trituración perimetral con blindaje de alta resistencia.',
    passive: 'Blindaje de Despiece',
    passiveDesc: '+1 Jaula orbital base, +15% Mitigación de daño y +25% Daño orbital.',
    statMods: { extraOrbitals: 1, damageReduction: 0.15, orbitalDmgMult: 1.25 },
    color: '#b83a3a',
    accentColor: '#521414',
    icon: 'orbital'
  },
  tesla: {
    id: 'tesla',
    weapon: 'bolt',
    weaponTitle: 'Bobina de Rayos',
    title: 'Ingeniero E. Vance',
    role: 'Operador Alta Tensión',
    desc: 'Especialista en subestaciones que canaliza relámpagos industriales de alto voltaje para freír sistemas nerviosos en cadena.',
    passive: 'Sobrecarga Inducida',
    passiveDesc: '+15% Probabilidad crítica, +20% Cadencia y arcos que saltan a +2 cuerpos.',
    statMods: { critChanceBonus: 0.15, atkSpeedMult: 1.20, boltChainsExtra: 2 },
    color: '#3fe0f5',
    accentColor: '#124e58',
    icon: 'bolt'
  }
};

const STORAGE_KEY = 'traces_selected_character';

export function getSelectedCharacterId() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return (saved && CHARACTERS[saved]) ? saved : DEFAULT_CHARACTER_ID;
}

export function setSelectedCharacterId(id) {
  if (CHARACTERS[id]) {
    localStorage.setItem(STORAGE_KEY, id);
  }
}

export function getCharacterById(id) {
  return CHARACTERS[id] || CHARACTERS[DEFAULT_CHARACTER_ID];
}
