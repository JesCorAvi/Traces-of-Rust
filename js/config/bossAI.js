// Configuración data-driven de la IA de jefes: perfiles de ataque, fases y pesos.
// Exports: BOSS_AI.

export const BOSS_AI = {
  DEFAULTS: {
    introDuration: 1.15,
    initialAttackDelay: 0.9,
    attackGap: 0.6,
    phase2Threshold: 0.5,
    phaseTransitionDuration: 1.5,
    phase2SpeedMult: 1.28,
    phase2CooldownMult: 0.72,
    phase2WindupMult: 0.88,
    phase2AttackGapMult: 0.72,
    repeatWeightMult: 0.25,
    resumeAttackDelay: 1.0,
    introMoveScale: 0.25,
    recoveryMoveScale: 0.35,
    phaseShake: 0.55,
    attackShake: 0.18
  },

  // Cada ataque define su ciclo justo: anticipación, ejecución y recuperación.
  ATTACKS: {
    cone_saw: {
      windup: 0.35, active: 0.95, recovery: 0.65, cooldown: 4.2,
      minRange: 0, maxRange: 9.5, weight: 1.2
    },
    charge: {
      windup: 0.35, active: 1.5, recovery: 0.8, cooldown: 5.5,
      minRange: 4.5, maxRange: 18, weight: 1.35
    },
    shockwave: {
      windup: 0.35, active: 1.15, recovery: 0.7, cooldown: 4.8,
      minRange: 0, maxRange: 10, weight: 1.4
    },
    floor_bombs: {
      windup: 0.3, active: 1.8, recovery: 0.75, cooldown: 5.5,
      minRange: 3, maxRange: 22, weight: 1.2
    },
    radial_slag: {
      windup: 0.5, active: 0.5, recovery: 0.6, cooldown: 4.5,
      minRange: 0, maxRange: 12, weight: 1.1
    },
    spiral_blades: {
      windup: 0.5, active: 0.55, recovery: 0.65, cooldown: 5.0,
      minRange: 3, maxRange: 16, weight: 1.25
    },
    summon: {
      windup: 0.55, active: 0.45, recovery: 0.9, cooldown: 10,
      minRange: 0, maxRange: 30, weight: 0.75
    }
  },

  // Ajustes de comportamiento por jefe. Los ataques extra se desbloquean en fase 2.
  OVERRIDES: {
    boss_butcher: {
      phase2Attacks: ['shockwave'],
      weights: { charge: 1.45, cone_saw: 1.15 }
    },
    boss_siren: {
      phase2Attacks: ['spiral_blades'],
      weights: { summon: 1.2, shockwave: 1.25 }
    },
    boss_furnace: {
      phase2Attacks: ['cone_saw'],
      weights: { floor_bombs: 1.35, radial_slag: 1.15 }
    },
    boss_apostle: {
      phase2Attacks: ['radial_slag'],
      weights: { spiral_blades: 1.45, floor_bombs: 1.0 }
    },
    boss_warden: {
      phase2Attacks: ['charge'],
      weights: { shockwave: 1.15, spiral_blades: 1.2, floor_bombs: 1.05 }
    }
  }
};
