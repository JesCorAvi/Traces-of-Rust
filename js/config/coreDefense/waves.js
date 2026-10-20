// Calendario de oleadas y escalado de dificultad.
// Exports: WAVES.

  // 6. SISTEMA DE OLEADAS Y CONDICIÓN DE VICTORIA
export const WAVES = {
    totalWavesForVictory: 12,
    initialPrepTimeSec: 60.0,
    betweenWavesRestSec: 60.0,
    enableEndgameSwarmAfterVictory: false, // Configurable según sección 4
    coreHealPerWaveCompleted: 65,

    // Escalado por oleada (1 a 12) y balance TD estilo Orcs Must Die / Dungeon Defenders
    tdBaseHpMult: 2.8,
    hpMultiplierPerWave: 0.28,
    dmgMultiplierPerWave: 0.14,
    speedMultiplierPerWave: 0.025,
    playerDamageMultiplierVsRoute: 0.45,

    // Eventos especiales de interrupción (cada 3 oleadas: tras ronda 3, 6, 9)
    EVENTS: {
      intervalWaves: 3,
      repairDurationSec: 8.5,
      repairRadius: 3.2,
      repairScrapReward: 30,
      infestationHostileCount: 12,
      infestationScrapReward: 35
    },

    SCHEDULE: [
      { wave: 1,  count: 10, interval: 1.25, routes: ['path_north'], composition: { zombie: 1.0, worm: 0.0, weeper: 0.0 } },
      { wave: 2,  count: 15, interval: 1.15, routes: ['path_north', 'path_east'], composition: { zombie: 0.82, worm: 0.18, weeper: 0.0 } },
      { wave: 3,  count: 18, interval: 1.05, routes: ['path_north', 'path_east'], composition: { zombie: 0.70, worm: 0.30, weeper: 0.0 }, bossId: 'boss_butcher' },
      { wave: 4,  count: 24, interval: 0.95, routes: ['path_north', 'path_west'], composition: { zombie: 0.65, worm: 0.35, weeper: 0.0 } },
      { wave: 5,  count: 28, interval: 0.90, routes: ['path_east', 'path_west'], composition: { zombie: 0.60, worm: 0.36, weeper: 0.04 } },
      { wave: 6,  count: 32, interval: 0.85, routes: ['path_north', 'path_east', 'path_west'], composition: { zombie: 0.55, worm: 0.39, weeper: 0.06 }, bossId: 'boss_siren' },
      { wave: 7,  count: 38, interval: 0.78, routes: ['path_north', 'path_east', 'path_west'], composition: { zombie: 0.50, worm: 0.40, weeper: 0.10 } },
      { wave: 8,  count: 42, interval: 0.72, routes: ['path_north', 'path_east', 'path_west'], composition: { zombie: 0.44, worm: 0.42, weeper: 0.14 } },
      { wave: 9,  count: 46, interval: 0.68, routes: ['path_north', 'path_east', 'path_west'], composition: { zombie: 0.38, worm: 0.42, weeper: 0.20 }, bossId: 'boss_furnace' },
      { wave: 10, count: 52, interval: 0.62, routes: ['path_north', 'path_east', 'path_west'], composition: { zombie: 0.32, worm: 0.42, weeper: 0.26 } },
      { wave: 11, count: 58, interval: 0.56, routes: ['path_north', 'path_east', 'path_west'], composition: { zombie: 0.26, worm: 0.42, weeper: 0.32 }, bossId: 'boss_apostle' },
      { wave: 12, count: 65, interval: 0.50, routes: ['path_north', 'path_east', 'path_west'], composition: { zombie: 0.20, worm: 0.42, weeper: 0.38 }, bossId: 'boss_warden' }
    ]
  };
