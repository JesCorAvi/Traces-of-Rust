// Catálogo de operadores tácticos por arma para Traces of Rust.
// Nombres y roles de designación militar / industrial para la atmósfera de contención biológica.
// Exports: CHARACTERS, DEFAULT_CHARACTER_ID, getSelectedCharacterId, setSelectedCharacterId, getCharacterById.

import { t } from '../core/i18n.js';
const _t = (k, fb) => (typeof t === 'function' ? t(k) : fb);

export const DEFAULT_CHARACTER_ID = 'otto';

export const CHARACTERS = {
  otto: {
    id: 'otto',
    weapon: 'slash',
    get weaponTitle() { return _t('char.otto.weaponTitle', 'Sierra Rotatoria'); },
    get title() { return _t('char.otto.title', 'Dr. V. Richter'); },
    get role() { return _t('char.otto.role', 'Cirujano Táctico'); },
    get desc() { return _t('char.otto.desc', 'Unidad médica forense equipada con instrumental rotatorio de amputación para desarticulación rápida de biomasa hostil.'); },
    get passive() { return _t('char.otto.passive', 'Protocolo Disección'); },
    get passiveDesc() { return _t('char.otto.passiveDesc', '+15% Vel. Maniobra, +25% Daño Sierra y desgarros críticos en área.'); },
    statMods: { moveSpeedMult: 1.15, slashDmgMult: 1.25, critChanceBonus: 0.08 },
    color: '#e05555',
    accentColor: '#6e1818',
    icon: 'slash'
  },
  mack: {
    id: 'mack',
    weapon: 'shotgun',
    get weaponTitle() { return _t('char.mack.weaponTitle', 'Escopeta de Trinchera'); },
    get title() { return _t('char.mack.title', 'Sargento K. Briggs'); },
    get role() { return _t('char.mack.role', 'Infantería de Brecha'); },
    get desc() { return _t('char.mack.desc', 'Veterano de contención pesada con escopeta calibre 12 y blindaje de asalto capaz de repeler hordas a corta distancia.'); },
    get passive() { return _t('char.mack.passive', 'Supresión Cinética'); },
    get passiveDesc() { return _t('char.mack.passiveDesc', '+30 Pulso Base, +20% Daño Postas y Fuerza de Empuje x2 (Knockback).'); },
    statMods: { baseHpBonus: 30, projectileDmgMult: 1.20, knockbackMult: 2.0 },
    color: '#d4a034',
    accentColor: '#5c4210',
    icon: 'shotgun'
  },
  pepe: {
    id: 'pepe',
    weapon: 'flamethrower',
    get weaponTitle() { return _t('char.pepe.weaponTitle', 'Lanzallamas Napalm'); },
    get title() { return _t('char.pepe.title', 'Sanitizador T. Keller'); },
    get role() { return _t('char.pepe.role', 'Especialista Pirolítico'); },
    get desc() { return _t('char.pepe.desc', 'Operador de cuadrilla de incineración dotado de soplete de napalm a alta presión para esterilización de sectores infectados.'); },
    get passive() { return _t('char.pepe.passive', 'Esterilización Térmica'); },
    get passiveDesc() { return _t('char.pepe.passiveDesc', '+25% Cadencia de flujo ígneo y +30% Daño térmico residual continuo.'); },
    statMods: { atkSpeedMult: 1.25, fireDmgMult: 1.30 },
    color: '#e8621e',
    accentColor: '#7a2b08',
    icon: 'flamethrower'
  },
  morbo: {
    id: 'morbo',
    weapon: 'aura',
    get weaponTitle() { return _t('char.morbo.weaponTitle', 'Incensario Cáustico'); },
    get title() { return _t('char.morbo.title', 'Custodia M. Vane'); },
    get role() { return _t('char.morbo.role', 'Agente Toxicológica'); },
    get desc() { return _t('char.morbo.desc', 'Custodia de purga bioquímica que propaga agentes corrosivos mediante un incensario hermético para disolver tejidos hostiles.'); },
    get passive() { return _t('char.morbo.passive', 'Miasma Bioquímico'); },
    get passiveDesc() { return _t('char.morbo.passiveDesc', '+30% Área cáustica, +1.0 HP/s absorción celular y ralentización motora.'); },
    statMods: { areaMult: 1.30, regenPerSec: 1.0, auraSlowBonus: 0.35 },
    color: '#55de3e',
    accentColor: '#1a5412',
    icon: 'aura'
  },
  bob: {
    id: 'bob',
    weapon: 'mines',
    get weaponTitle() { return _t('char.bob.weaponTitle', 'Minas de Dispersión'); },
    get title() { return _t('char.bob.title', 'Zapador J. Novak'); },
    get role() { return _t('char.bob.role', 'Ingeniero de Demolición'); },
    get desc() { return _t('char.bob.desc', 'Técnico de voladuras de subsuelo especializado en minas de dispersión de metralla para bloqueo de pasarelas y accesos.'); },
    get passive() { return _t('char.bob.passive', 'Fragmentación Pesada'); },
    get passiveDesc() { return _t('char.bob.passiveDesc', '+1 Proyectil multidisparo base y +35% Sobrepresión explosiva.'); },
    statMods: { bonusProjectiles: 1, explosiveDmgMult: 1.35 },
    color: '#e67828',
    accentColor: '#6e3008',
    icon: 'mines'
  },
  krauss: {
    id: 'krauss',
    weapon: 'harpoon',
    get weaponTitle() { return _t('char.krauss.weaponTitle', 'Arpón Neumático'); },
    get title() { return _t('char.krauss.title', 'Capitán H. Krauss'); },
    get role() { return _t('char.krauss.role', 'Tirador Balístico'); },
    get desc() { return _t('char.krauss.desc', 'Comandante de balística neumática armado con arpones de tungsteno capaces de perforar columnas enteras de blindaje y carne.'); },
    get passive() { return _t('char.krauss.passive', 'Impacto Perforante'); },
    get passiveDesc() { return _t('char.krauss.passiveDesc', '+40% Alcance efectivo de tiro y +30% Daño perforante crítico.'); },
    statMods: { rangeMult: 1.40, harpoonDmgMult: 1.30, critChanceBonus: 0.12 },
    color: '#c4b44a',
    accentColor: '#544c18',
    icon: 'harpoon'
  },
  axel: {
    id: 'axel',
    weapon: 'orbital',
    get weaponTitle() { return _t('char.axel.weaponTitle', 'Cuchillas Orbitales'); },
    get title() { return _t('char.axel.title', 'Capataz A. Hogg'); },
    get role() { return _t('char.axel.role', 'Custodio de Despiece'); },
    get desc() { return _t('char.axel.desc', 'Jefe de planta de despiece equipado con cuchillas y jaulas orbitales de trituración perimetral con blindaje de alta resistencia.'); },
    get passive() { return _t('char.axel.passive', 'Blindaje de Despiece'); },
    get passiveDesc() { return _t('char.axel.passiveDesc', '+1 Jaula orbital base, +15% Mitigación de daño y +25% Daño orbital.'); },
    statMods: { extraOrbitals: 1, damageReduction: 0.15, orbitalDmgMult: 1.25 },
    color: '#b83a3a',
    accentColor: '#521414',
    icon: 'orbital'
  },
  tesla: {
    id: 'tesla',
    weapon: 'bolt',
    get weaponTitle() { return _t('char.tesla.weaponTitle', 'Bobina de Rayos'); },
    get title() { return _t('char.tesla.title', 'Ingeniero E. Vance'); },
    get role() { return _t('char.tesla.role', 'Operador Alta Tensión'); },
    get desc() { return _t('char.tesla.desc', 'Especialista en subestaciones que canaliza relámpagos industriales de alto voltaje para freír sistemas nerviosos en cadena.'); },
    get passive() { return _t('char.tesla.passive', 'Sobrecarga Inducida'); },
    get passiveDesc() { return _t('char.tesla.passiveDesc', '+15% Probabilidad crítica, +20% Cadencia y arcos que saltan a +2 cuerpos.'); },
    statMods: { critChanceBonus: 0.15, atkSpeedMult: 1.20, boltChainsExtra: 2 },
    color: '#3fe0f5',
    accentColor: '#124e58',
    icon: 'bolt'
  }
};

const STORAGE_KEY = 'traces_selected_character';
let cachedSelectedCharId = null;

export function getSelectedCharacterId() {
  if (cachedSelectedCharId) return cachedSelectedCharId;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    cachedSelectedCharId = (saved && CHARACTERS[saved]) ? saved : DEFAULT_CHARACTER_ID;
  } catch (e) {
    cachedSelectedCharId = DEFAULT_CHARACTER_ID;
  }
  return cachedSelectedCharId;
}

export function setSelectedCharacterId(id) {
  if (CHARACTERS[id]) {
    cachedSelectedCharId = id;
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch (e) {}
  }
}

export function getCharacterById(id) {
  return CHARACTERS[id] || CHARACTERS[DEFAULT_CHARACTER_ID];
}
