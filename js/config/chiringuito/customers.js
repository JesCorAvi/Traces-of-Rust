// Clientes del chiringuito: llegada, paciencia, propinas y arquetipos visuales.
// Exports: CUSTOMERS, CUSTOMER_ARCHETYPES, getCustomerArchetype.

export const CUSTOMERS = {
  maxConcurrent: 12,
  maxQueue: 4,
  basePerNight: 4,
  perSeat: 0.32,
  perCharm: 0.03,
  reputationBonusMax: 1.2,
  maxPerNight: 12,
  arrivalIntervalStart: 13,
  arrivalIntervalEnd: 7.5,
  queuePatienceSec: 35,
  orderPatienceSec: 50,
  eatDurationSec: 12,
  leaveDelaySec: 0.8,
  walkSpeed: 2.3,
  serveRadius: 2.8,
  orderRadius: 2.2,
  baseTip: 2,
  maxTip: 9,
  qualityTipWeights: { perfect: 1.0, good: 0.72, ok: 0.38, burnt: 0.1 },
  patienceTipWeight: 0.35,
  charmTipWeight: 0.12,
  reputationMin: 0,
  reputationMax: 100,
  reputationStart: 55,
  reputationServed: 2.2,
  reputationLost: 5.5,
  reputationTipThreshold: 60,
  unlockRecipeInfluence: 0.05
};

export const CUSTOMER_ARCHETYPES = [
  {
    id: 'tourist',
    name: 'Turista',
    color: 0x4fb7c7,
    accent: 0xf6d9a9,
    patienceMult: 1.0,
    tipMult: 1.0,
    speedMult: 1.0
  },
  {
    id: 'islander',
    name: 'Isleño',
    color: 0xe0a15b,
    accent: 0x5e8e64,
    patienceMult: 1.15,
    tipMult: 0.9,
    speedMult: 1.05
  },
  {
    id: 'critic',
    name: 'Crítico',
    color: 0x8d68b3,
    accent: 0xe9e1c4,
    patienceMult: 0.8,
    tipMult: 1.45,
    speedMult: 0.95
  },
  {
    id: 'local',
    name: 'Parroquiano',
    color: 0xd96c5e,
    accent: 0x2d4356,
    patienceMult: 1.25,
    tipMult: 0.85,
    speedMult: 1.0
  }
];

export function getCustomerArchetype(index = 0) {
  const list = CUSTOMER_ARCHETYPES;
  return list[Math.abs(Math.round(index)) % list.length];
}
