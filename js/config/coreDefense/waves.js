// Calendario de oleadas y escalado de dificultad.
// Exports: WAVES.

  // 6. SISTEMA DE OLEADAS Y CONDICIÓN DE VICTORIA
export const WAVES = {
    totalWavesForVictory: 12,
    initialPrepTimeSec: 8.0,
    betweenWavesRestSec: 8.0,
    enableEndgameSwarmAfterVictory: false, // Configurable según sección 4
    coreHealPerWaveCompleted: 65,

    // Escalado por oleada (1 a 12)
    hpMultiplierPerWave: 0.24,
    dmgMultiplierPerWave: 0.14,
    speedMultiplierPerWave: 0.025,

    SCHEDULE: [
      { wave: 1,  count: 10, interval: 1.25, routes: ['path_north'], composition: { zombie: 1.0, worm: 0.0, weeper: 0.0 } },
      { wave: 2,  count: 15, interval: 1.15, routes: ['path_north', 'path_east'], composition: { zombie: 0.78, worm: 0.22, weeper: 0.0 } },
      { wave: 3,  count: 18, interval: 1.05, routes: ['path_north', 'path_east'], composition: { zombie: 0.65, worm: 0.25, weeper: 0.10 }, bossId: 'boss_butcher' },
      { wave: 4,  count: 24, interval: 0.95, routes: ['path_north', 'path_west'], composition: { zombie: 0.55, worm: 0.30, weeper: 0.15 } },
      { wave: 5,  count: 28, interval: 0.90, routes: ['path_east', 'path_west'], composition: { zombie: 0.50, worm: 0.30, weeper: 0.20 } },
      { wave: 6,  count: 32, interval: 0.85, routes: ['path_north', 'path_east', 'path_west'], composition: { zombie: 0.48, worm: 0.32, weeper: 0.20 }, bossId: 'boss_siren' },
      { wave: 7,  count: 38, interval: 0.78, routes: ['path_north', 'path_east', 'path_west'], composition: { zombie: 0.42, worm: 0.36, weeper: 0.22 } },
      { wave: 8,  count: 42, interval: 0.72, routes: ['path_north', 'path_east', 'path_west'], composition: { zombie: 0.38, worm: 0.38, weeper: 0.24 } },
      { wave: 9,  count: 46, interval: 0.68, routes: ['path_north', 'path_east', 'path_west'], composition: { zombie: 0.35, worm: 0.40, weeper: 0.25 }, bossId: 'boss_furnace' },
      { wave: 10, count: 52, interval: 0.62, routes: ['path_north', 'path_east', 'path_west'], composition: { zombie: 0.34, worm: 0.38, weeper: 0.28 } },
      { wave: 11, count: 58, interval: 0.56, routes: ['path_north', 'path_east', 'path_west'], composition: { zombie: 0.30, worm: 0.40, weeper: 0.30 }, bossId: 'boss_apostle' },
      { wave: 12, count: 65, interval: 0.50, routes: ['path_north', 'path_east', 'path_west'], composition: { zombie: 0.28, worm: 0.42, weeper: 0.30 }, bossId: 'boss_warden' }
    ]
  };
