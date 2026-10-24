// Pesca de la laguna: tuning de las 4 fases y catálogo de peces.
// Exports: FISHING, FISH_TYPES, FISH_IDS, getFishType, pickFishType.

export const FISHING = {
  // Compatibilidad con la capa antigua de pesca.
  castMarkerSpeed: 0.85,
  castPerfectMin: 0.36,
  castPerfectMax: 0.62,
  biteDelayMinMs: 700,
  biteDelayMaxMs: 1800,
  biteWindowMs: 950,
  reelDurationSec: 7.5,
  reelTargetMin: 0.34,
  reelTargetMax: 0.72,
  tensionRise: 0.72,
  tensionFall: 0.5,
  progressPerSecond: 0.25,
  overTensionLimit: 0.93,
  overTensionSec: 1.1,

  // Minijuego nuevo: lanzar, esperar, forcejear y recoger.
  castDurationSec: 8,
  castChargeRate: 0.62,
  castPerfectPowerMin: 0.52,
  castPerfectPowerMax: 0.78,
  castAimTolerance: 0.17,
  waitDurationSec: 11,
  waitBiteMinMs: 900,
  waitBiteMaxMs: 2600,
  waitBiteWindowMs: 820,
  falseBiteChance: 0.42,
  reelPhaseDurationSec: 13,
  reelProgressPerSecond: 0.3,
  reelDrainPerSecond: 0.15,
  reelTensionRise: 0.62,
  reelTensionFall: 0.72,
  windDurationSec: 9,
  windTurnsBase: 2.6,
  windTurnsPerWeight: 0.9,
  windTargetSpeed: 5.4,
  windSpeedTolerance: 1.9,
  fishPerCatchMin: 1,
  fishPerCatchMax: 3,
  rarePearls: 2,
  interactionPrompt: 'PESCAR EN LA LAGUNA'
};

export const FISH_TYPES = {
  sardine: {
    id: 'sardine',
    name: 'Sardina',
    behavior: 'erratic',
    color: 0x8ce6e3,
    accent: '#8ce6e3',
    scale: 0.78,
    speed: 1.35,
    erratic: 1.35,
    pull: 0.85,
    weight: 1.0,
    yield: 1,
    rare: false,
    minDifficulty: 1,
    weightBase: 34
  },
  mackerel: {
    id: 'mackerel',
    name: 'Caballa',
    behavior: 'fast',
    color: 0x3fc1c9,
    accent: '#3fc1c9',
    scale: 0.95,
    speed: 1.15,
    erratic: 1.0,
    pull: 1.05,
    weight: 1.15,
    yield: 1,
    rare: false,
    minDifficulty: 1,
    weightBase: 38
  },
  grouper: {
    id: 'grouper',
    name: 'Mero',
    behavior: 'heavy',
    color: 0x136070,
    accent: '#136070',
    scale: 1.25,
    speed: 0.78,
    erratic: 0.55,
    pull: 1.35,
    weight: 1.7,
    yield: 2,
    rare: false,
    minDifficulty: 2,
    weightBase: 18
  },
  golden_fish: {
    id: 'golden_fish',
    name: 'Pez dorado',
    behavior: 'rare',
    color: 0xffcf4a,
    accent: '#ffcf4a',
    scale: 0.92,
    speed: 1.5,
    erratic: 1.6,
    pull: 1.2,
    weight: 1.2,
    yield: 2,
    rare: true,
    minDifficulty: 3,
    weightBase: 2
  }
};

export const FISH_IDS = Object.keys(FISH_TYPES);

export function getFishType(id) {
  return FISH_TYPES[id] || null;
}

// Elige un pez elegible. Un lanzamiento preciso reduce las sardinas y aumenta
// la probabilidad del pez dorado; la dificultad desbloquea meros y dorados.
export function pickFishType({ difficulty = 1, castAccuracy = 0.5, random = Math.random } = {}) {
  const diff = Math.max(1, Math.min(5, Number(difficulty) || 1));
  const accuracy = Math.max(0, Math.min(1, Number(castAccuracy) || 0));
  const eligible = Object.values(FISH_TYPES).filter(fish => fish.minDifficulty <= diff);
  if (eligible.length === 0) return FISH_TYPES.sardine;
  const weights = eligible.map(fish => {
    let weight = fish.weightBase;
    if (fish.id === 'grouper') weight += diff * 2.2;
    if (fish.id === 'sardine') weight += (1 - accuracy) * 10;
    if (fish.rare) weight = diff >= 3 ? 1.4 + accuracy * 5.2 + diff * 0.65 : 0;
    return Math.max(0, weight);
  });
  const total = weights.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return eligible[0];
  let roll = random() * total;
  for (let i = 0; i < eligible.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return eligible[i];
  }
  return eligible[eligible.length - 1];
}
