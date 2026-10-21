// Calendario de oleadas y escalado de dificultad.
// Exports: WAVES.

  // 6. SISTEMA DE OLEADAS Y CONDICIÓN DE VICTORIA
export const WAVES = {
    totalWavesForVictory: 12,
    initialPrepTimeSec: 60.0,
    betweenWavesRestSec: 60.0,
    enableEndgameSwarmAfterVictory: false, // Configurable según sección 4
    coreHealPerWaveCompleted: 15,

    // Escalado por oleada (1 a 12) estilo Bloons TD / Orcs Must Die:
    // La vida escala con mayor pendiente para retar las mejoras de torretas Tier 3/4.
    tdBaseHpMult: 2.8,
    hpMultiplierPerWave: 0.52,
    dmgMultiplierPerWave: 0.14,
    speedMultiplierPerWave: 0.045,
    playerDamageMultiplierVsRoute: 0.45,

    // Eventos especiales de interrupción (cada 3 oleadas: tras ronda 3, 6, 9)
    // Mini-modo supervivencia masivo estilo Megabonk en perímetro de 30m
    EVENTS: {
      intervalWaves: 3,
      eventDurationSec: 120.0,       // 2 minutos de duración
      survivalRadius: 15.0,          // Zona amplia de supervivencia (30m de diámetro)
      scrapReward: 35,               // Recompensa tras sobrevivir al enjambre
      maxEnemiesBase: 30,            // Enemigos concurrentes iniciales (Fase 1)
      maxEnemiesPeak: 65,            // Enemigos concurrentes en el clímax final (Fase 3)
      spawnIntervalStart: 0.65,      // Intervalo inicial de spawn
      spawnIntervalEnd: 0.22,        // Intervalo en el clímax final
      hpScalingPerWave: 0.16,        // Escalado suave de vida por oleada superada (+16%/wave)
      dmgScalingPerWave: 0.08        // Escalado de daño de los hostiles en eventos (+8%/wave)
    },

    SCHEDULE: [
      { wave: 1,  count: 24,  interval: 0.75, routes: ['path_north'], composition: { zombie: 1.0, worm: 0.0, weeper: 0.0 } },
      { wave: 2,  count: 36,  interval: 0.65, routes: ['path_north', 'path_east'], composition: { zombie: 0.75, worm: 0.25, weeper: 0.0 } },
      { wave: 3,  count: 48,  interval: 0.58, routes: ['path_north', 'path_east'], composition: { zombie: 0.65, worm: 0.35, weeper: 0.0 }, bossId: 'boss_butcher' },
      { wave: 4,  count: 64,  interval: 0.50, routes: ['path_north', 'path_west'], composition: { zombie: 0.50, worm: 0.40, weeper: 0.10 } },
      { wave: 5,  count: 80,  interval: 0.44, routes: ['path_east', 'path_west'], composition: { zombie: 0.42, worm: 0.42, weeper: 0.16 } },
      { wave: 6,  count: 98,  interval: 0.38, routes: ['path_north', 'path_east', 'path_west'], composition: { zombie: 0.35, worm: 0.43, weeper: 0.22 }, bossId: 'boss_siren' },
      { wave: 7,  count: 118, interval: 0.34, routes: ['path_north', 'path_east', 'path_west'], composition: { zombie: 0.28, worm: 0.44, weeper: 0.28 } },
      { wave: 8,  count: 140, interval: 0.30, routes: ['path_north', 'path_east', 'path_west'], composition: { zombie: 0.22, worm: 0.44, weeper: 0.34 } },
      { wave: 9,  count: 165, interval: 0.26, routes: ['path_north', 'path_east', 'path_west'], composition: { zombie: 0.18, worm: 0.42, weeper: 0.40 }, bossId: 'boss_furnace' },
      { wave: 10, count: 190, interval: 0.24, routes: ['path_north', 'path_east', 'path_west'], composition: { zombie: 0.15, worm: 0.40, weeper: 0.45 } },
      { wave: 11, count: 220, interval: 0.21, routes: ['path_north', 'path_east', 'path_west'], composition: { zombie: 0.12, worm: 0.38, weeper: 0.50 }, bossId: 'boss_apostle' },
      { wave: 12, count: 255, interval: 0.18, routes: ['path_north', 'path_east', 'path_west'], composition: { zombie: 0.10, worm: 0.35, weeper: 0.55 }, bossId: 'boss_warden' }
    ]
  };
