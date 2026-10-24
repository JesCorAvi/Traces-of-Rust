// Granja del chiringuito: cultivos, rendimiento y feedback de cosecha.
// Exports: FARM, FARM_CROPS, getFarmCrop.

import { FARM_INGREDIENT_IDS, INGREDIENTS } from './ingredients.js';

export const FARM = {
  baseYield: 3,
  maxYield: 6,
  harvestRadius: 2.4,
  regrowEachMorning: true,
  upgradeYield: 1,
  upgradeCost: 70,
  cropScale: 0.95,
  harvestBonusMax: 2,
  harvestBonusMin: -2
};

// La calidad de la cosecha modula la cantidad: una planta rota da 1, una
// cosecha perfecta suma +2 sobre el rendimiento base de la parcela.
export const HARVEST_REWARDS = {
  perfectScore: 90,
  goodScore: 70,
  okScore: 45,
  perfectBonus: 2,
  goodBonus: 1,
  okBonus: 0,
  badBonus: -2
};

export function getHarvestBonus(score = 0) {
  const value = Math.max(0, Math.min(100, Number(score) || 0));
  if (value >= HARVEST_REWARDS.perfectScore) return HARVEST_REWARDS.perfectBonus;
  if (value >= HARVEST_REWARDS.goodScore) return HARVEST_REWARDS.goodBonus;
  if (value >= HARVEST_REWARDS.okScore) return HARVEST_REWARDS.okBonus;
  return HARVEST_REWARDS.badBonus;
}

export function getHarvestAmount(plotYield = FARM.baseYield, score = 0) {
  const base = Math.max(1, Math.round(Number(plotYield) || FARM.baseYield));
  return Math.max(1, Math.min(FARM.maxYield, base + getHarvestBonus(score)));
}

// La calidad de la siembra decide el rendimiento de la próxima cosecha.
export const PLANT_REWARDS = {
  perfectScore: 90,
  goodScore: 70,
  okScore: 45,
  perfectBonus: 2,
  goodBonus: 1,
  okBonus: 0,
  badBonus: -1
};

export function getPlantYieldBonus(score = 0) {
  const value = Math.max(0, Math.min(100, Number(score) || 0));
  if (value >= PLANT_REWARDS.perfectScore) return PLANT_REWARDS.perfectBonus;
  if (value >= PLANT_REWARDS.goodScore) return PLANT_REWARDS.goodBonus;
  if (value >= PLANT_REWARDS.okScore) return PLANT_REWARDS.okBonus;
  return PLANT_REWARDS.badBonus;
}

const CROP_MODELS = {
  coconut: { shape: 'palm', height: 1.8, color: 0x548b4b },
  pineapple: { shape: 'bush', height: 0.85, color: 0xd5b542 },
  rice: { shape: 'grass', height: 0.7, color: 0xd8ce9c },
  lime: { shape: 'bush', height: 0.8, color: 0x7fb84f },
  tomato: { shape: 'vine', height: 0.9, color: 0xd8503d },
  chili: { shape: 'bush', height: 0.75, color: 0xb93226 },
  onion: { shape: 'tuft', height: 0.55, color: 0xc8b6c9 },
  mango: { shape: 'tree', height: 1.5, color: 0xe5a13d }
};

export const FARM_CROPS = FARM_INGREDIENT_IDS.map((ingredientId, index) => {
  const ingredient = INGREDIENTS[ingredientId];
  const model = CROP_MODELS[ingredientId] || { shape: 'bush', height: 0.8, color: 0x7aa35a };
  return {
    id: `crop_${ingredientId}`,
    ingredientId,
    get name() { return ingredient.name; },
    color: ingredient.color,
    yield: FARM.baseYield,
    ...model,
    slot: index
  };
});

export function getFarmCrop(ingredientId) {
  return FARM_CROPS.find(crop => crop.ingredientId === ingredientId) || null;
}
