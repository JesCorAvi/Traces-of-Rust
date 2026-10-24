// Tuning del minijuego de cocina y cálculo de calidad/propinas.
// Exports: COOKING, QUALITY_TIERS, getQualityTier, getTipForOrder.

export const COOKING = {
  maxScore: 100,
  stageCount: 3,
  chop: {
    perfectWindowRatio: 0.32,
    goodWindowRatio: 0.62,
    pointsPerCut: 12,
    perfectPoints: 18,
    goodPoints: 10,
    missPoints: 2
  },
  cook: {
    tickRate: 0.05,
    perfectBandRatio: 0.38,
    goodBandRatio: 0.70,
    pointsPerSecond: 18,
    driftPenaltyPerSecond: 4
  },
  plate: {
    pointsPerCorrect: 12,
    penaltyPerWrong: 8,
    timeoutSec: 12
  },
  quality: {
    perfect: 90,
    good: 70,
    ok: 45
  },
  cancelReturnsIngredients: true,
  minSessionMs: 3500,
  baseTipRatio: 0.18,
  maxTipRatio: 0.55
};

export const QUALITY_TIERS = [
  { id: 'perfect', label: 'PERFECTO', color: '#ffd96a', min: COOKING.quality.perfect, multiplier: 1.0 },
  { id: 'good', label: 'BUENO', color: '#a8d68a', min: COOKING.quality.good, multiplier: 0.72 },
  { id: 'ok', label: 'ACEPTABLE', color: '#d9bf83', min: COOKING.quality.ok, multiplier: 0.38 },
  { id: 'burnt', label: 'QUEMADO', color: '#df6b4e', min: 0, multiplier: 0.1 }
];

export function getQualityTier(score) {
  const safe = Math.max(0, Math.min(COOKING.maxScore, Number(score) || 0));
  return QUALITY_TIERS.find(tier => safe >= tier.min) || QUALITY_TIERS[QUALITY_TIERS.length - 1];
}

export function getTipForOrder({ recipe, qualityTier, patienceRatio = 1, charm = 0, tipBonus = 0, reputation = 55 }) {
  const weird = Math.max(0, Math.min(1, patienceRatio));
  const rep = Math.max(0, Math.min(1, reputation / 100));
  const base = 2 + recipe.price * COOKING.baseTipRatio;
  const quality = base * (qualityTier?.multiplier ?? 0.1);
  const patience = base * COOKING.maxTipRatio * weird;
  const charisma = base * COOKING.maxTipRatio * (charm * 0.03 + tipBonus + rep * 0.2);
  return Math.max(0, Math.round(quality + patience + charisma));
}
