// Catálogo de operadores tácticos por arma para Crabs wants your food!.
// Nombres, roles y pasivas del equipo de socorristas de la playa.
// Exports: CHARACTERS, DEFAULT_CHARACTER_ID, getSelectedCharacterId, setSelectedCharacterId, getCharacterById.

import { t } from '../core/i18n.js';
const _t = (k, fb) => (typeof t === 'function' ? t(k) : fb);

export const DEFAULT_CHARACTER_ID = 'otto';

export const CHARACTERS = {
  otto: {
    id: 'otto',
    weapon: 'slash',
    get weaponTitle() { return _t('char.otto.weaponTitle', 'Machete de Cocotero'); },
    get title() { return _t('char.otto.title', 'Otto Mareas'); },
    get role() { return _t('char.otto.role', 'Socorrista Jefe'); },
    get desc() { return _t('char.otto.desc', 'Socorrista de la playa con un machete de cocotero y reflejos de salvamento para cortar el paso a los cangrejos.'); },
    get passive() { return _t('char.otto.passive', 'Ola de Salvamento'); },
    get passiveDesc() { return _t('char.otto.passiveDesc', '+15% velocidad, +25% daño de machete y +8% crítico.'); },
    statMods: { moveSpeedMult: 1.15, slashDmgMult: 1.25, critChanceBonus: 0.08 },
    color: '#e05555',
    accentColor: '#6e1818',
    icon: 'slash'
  },
  mack: {
    id: 'mack',
    weapon: 'shotgun',
    get weaponTitle() { return _t('char.mack.weaponTitle', 'Escopeta de Sal Marina'); },
    get title() { return _t('char.mack.title', 'Mack Marea'); },
    get role() { return _t('char.mack.role', 'Pescador de Arrecife'); },
    get desc() { return _t('char.mack.desc', 'Veterano pescador de la costa con escopeta de sal marina y aguante de sobra para las mareas más duras.'); },
    get passive() { return _t('char.mack.passive', 'Corriente Salada'); },
    get passiveDesc() { return _t('char.mack.passiveDesc', '+30 aguante base, +20% daño de proyectiles y empuje x2.'); },
    statMods: { baseHpBonus: 30, projectileDmgMult: 1.20, knockbackMult: 2.0 },
    color: '#d4a034',
    accentColor: '#5c4210',
    icon: 'shotgun'
  },
  pepe: {
    id: 'pepe',
    weapon: 'flamethrower',
    get weaponTitle() { return _t('char.pepe.weaponTitle', 'Soplete de Asador'); },
    get title() { return _t('char.pepe.title', 'Pepe Parrilla'); },
    get role() { return _t('char.pepe.role', 'Jefe de Parrilla'); },
    get desc() { return _t('char.pepe.desc', 'Maestro asador del chiringuito, armado con un soplete de carbón para convertir la orilla en una brasa.'); },
    get passive() { return _t('char.pepe.passive', 'Brasa de Chiringuito'); },
    get passiveDesc() { return _t('char.pepe.passiveDesc', '+25% cadencia y +30% daño de fuego.'); },
    statMods: { atkSpeedMult: 1.25, fireDmgMult: 1.30 },
    color: '#e8621e',
    accentColor: '#7a2b08',
    icon: 'flamethrower'
  },
  morbo: {
    id: 'morbo',
    weapon: 'aura',
    get weaponTitle() { return _t('char.morbo.weaponTitle', 'Aura de Marea'); },
    get title() { return _t('char.morbo.title', 'Morbo Marea'); },
    get role() { return _t('char.morbo.role', 'Vidente de la Marea'); },
    get desc() { return _t('char.morbo.desc', 'Guía espiritual del arrecife que invoca algas y espuma corrosiva para frenar la marea de cangrejos.'); },
    get passive() { return _t('char.morbo.passive', 'Marea de Algas'); },
    get passiveDesc() { return _t('char.morbo.passiveDesc', '+30% área de aura, +1.0 HP/s y +35% ralentización.'); },
    statMods: { areaMult: 1.30, regenPerSec: 1.0, auraSlowBonus: 0.35 },
    color: '#55de3e',
    accentColor: '#1a5412',
    icon: 'aura'
  },
  bob: {
    id: 'bob',
    weapon: 'mines',
    get weaponTitle() { return _t('char.bob.weaponTitle', 'Minas de Erizo'); },
    get title() { return _t('char.bob.title', 'Bob Castillos'); },
    get role() { return _t('char.bob.role', 'Constructor de Castillos'); },
    get desc() { return _t('char.bob.desc', 'Ingeniero de socorrismo experto en minas de erizo y castillos de arena con trampa.'); },
    get passive() { return _t('char.bob.passive', 'Lluvia de Erizos'); },
    get passiveDesc() { return _t('char.bob.passiveDesc', '+1 proyectil y +35% daño explosivo.'); },
    statMods: { bonusProjectiles: 1, explosiveDmgMult: 1.35 },
    color: '#e67828',
    accentColor: '#6e3008',
    icon: 'mines'
  },
  krauss: {
    id: 'krauss',
    weapon: 'harpoon',
    get weaponTitle() { return _t('char.krauss.weaponTitle', 'Arpón de Pesca'); },
    get title() { return _t('char.krauss.title', 'Capitán Krauss'); },
    get role() { return _t('char.krauss.role', 'Capitán del Muelle'); },
    get desc() { return _t('char.krauss.desc', 'Patrón del muelle viejo, especialista en arpones de pesca capaces de atravesar caparazones enteros.'); },
    get passive() { return _t('char.krauss.passive', 'Tiro Certero'); },
    get passiveDesc() { return _t('char.krauss.passiveDesc', '+40% alcance, +30% daño de arpón y +12% crítico.'); },
    statMods: { rangeMult: 1.40, harpoonDmgMult: 1.30, critChanceBonus: 0.12 },
    color: '#c4b44a',
    accentColor: '#544c18',
    icon: 'harpoon'
  },
  axel: {
    id: 'axel',
    weapon: 'orbital',
    get weaponTitle() { return _t('char.axel.weaponTitle', 'Aros de Salvamento'); },
    get title() { return _t('char.axel.title', 'Axel Escualo'); },
    get role() { return _t('char.axel.role', 'Guardacostas de Élite'); },
    get desc() { return _t('char.axel.desc', 'Guardacostas con aros de salvamento orbitales y un neopreno reforzado para el asalto final.'); },
    get passive() { return _t('char.axel.passive', 'Salvamento Orbital'); },
    get passiveDesc() { return _t('char.axel.passiveDesc', '+1 aro orbital, +15% mitigación y +25% daño orbital.'); },
    statMods: { extraOrbitals: 1, damageReduction: 0.15, orbitalDmgMult: 1.25 },
    color: '#b83a3a',
    accentColor: '#521414',
    icon: 'orbital'
  },
  tesla: {
    id: 'tesla',
    weapon: 'bolt',
    get weaponTitle() { return _t('char.tesla.weaponTitle', 'Anguila Eléctrica'); },
    get title() { return _t('char.tesla.title', 'Tesla Tormenta'); },
    get role() { return _t('char.tesla.role', 'Técnico de Tormentas'); },
    get desc() { return _t('char.tesla.desc', 'Electricista del faro que canaliza la tormenta del atardecer entre los caparazones en cadena.'); },
    get passive() { return _t('char.tesla.passive', 'Tormenta en Cadena'); },
    get passiveDesc() { return _t('char.tesla.passiveDesc', '+15% crítico, +20% cadencia y +2 saltos de anguila.'); },
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
