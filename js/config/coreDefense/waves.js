// Calendario de oleadas y escalado de dificultad.
// Exports: WAVES.

  // 6. SISTEMA DE OLEADAS Y CONDICIÓN DE VICTORIA
export const WAVES = {
    totalWavesForVictory: 12,
    initialPrepTimeSec: 60.0,
    betweenWavesRestSec: 60.0,
    enableEndgameSwarmAfterVictory: false, // Configurable según sección 4
    coreHealPerWaveCompleted: 25,

    // Escalado por oleada (1 a 12) estilo Bloons TD / Orcs Must Die.
    // Curva suave: la oleada 1 usa el HP base y la 12 llega a x3.42.
    tdBaseHpMult: 1.0,
    hpMultiplierPerWave: 0.22,
    dmgMultiplierPerWave: 0.07,
    speedMultiplierPerWave: 0.025,

    // Los jefes tienen su propia curva: su HP base ya es alto y no debe
    // multiplicarse por el escalado completo de la horda.
    tdBossHpMult: 1.1,
    bossHpMultiplierPerWave: 0.18,
    playerDamageMultiplierVsRoute: 0.45,

    // Eventos especiales de interrupción (cada 3 oleadas: tras ronda 3, 6, 9)
    // Asalto de contención de 75s en un perímetro de 100m.
    EVENTS: {
      intervalWaves: 3,
      eventDurationSec: 75.0,
      survivalRadius: 50.0,          // Zona amplia de supervivencia (100m de diámetro, radio 50m)
      scrapReward: 45,               // Recompensa tras sobrevivir al enjambre
      maxEnemiesBase: 10,            // Enemigos concurrentes iniciales (Fase 1)
      maxEnemiesPeak: 24,            // Enemigos concurrentes en el clímax final (Fase 3)
      spawnIntervalStart: 1.5,       // Intervalo inicial de spawn
      spawnIntervalEnd: 0.65,        // Intervalo en el clímax final
      hpScalingPerWave: 0.10,        // Escalado suave de vida por oleada superada (+10%/wave)
      dmgScalingPerWave: 0.05        // Escalado de daño de los hostiles en eventos (+5%/wave)
    },

    // Curva de 12 oleadas pensada para una defensa de 6-14 torretas:
    // empieza con una sola ruta y una horda pequeña, y añade tipos y carriles
    // de forma gradual. Los jefes aparecen en 3, 6, 9 y 12.
    SCHEDULE: [
      { wave: 1,  count: 10,  interval: 1.50, routes: ['path_north'], composition: { zombie: 1.0, worm: 0.0, weeper: 0.0 } },
      { wave: 2,  count: 16,  interval: 1.25, routes: ['path_north'], composition: { zombie: 0.75, worm: 0.25 } },
      { wave: 3,  count: 22,  interval: 1.10, routes: ['path_north', 'path_east'], composition: { zombie: 0.55, worm: 0.25, runner: 0.20 }, bossId: 'boss_butcher' },
      { wave: 4,  count: 28,  interval: 1.00, routes: ['path_north', 'path_east'], composition: { zombie: 0.40, worm: 0.25, weeper: 0.05, runner: 0.15, splitter: 0.15 } },
      { wave: 5,  count: 34,  interval: 0.95, routes: ['path_north', 'path_east'], composition: { zombie: 0.30, worm: 0.22, weeper: 0.08, runner: 0.16, splitter: 0.12, hulk: 0.12 } },
      { wave: 6,  count: 42,  interval: 0.90, routes: ['path_north', 'path_east', 'path_west'], composition: { zombie: 0.24, worm: 0.20, weeper: 0.10, runner: 0.16, splitter: 0.12, hulk: 0.10, nest: 0.08 }, bossId: 'boss_siren' },
      { wave: 7,  count: 50,  interval: 0.85, routes: ['path_north', 'path_east', 'path_west'], composition: { zombie: 0.20, worm: 0.18, weeper: 0.12, runner: 0.16, splitter: 0.12, hulk: 0.10, nest: 0.07, regenerator: 0.05 } },
      { wave: 8,  count: 60,  interval: 0.80, routes: ['path_north', 'path_east', 'path_west'], composition: { zombie: 0.17, worm: 0.16, weeper: 0.14, runner: 0.16, splitter: 0.12, hulk: 0.11, nest: 0.08, regenerator: 0.06 } },
      { wave: 9,  count: 72,  interval: 0.75, routes: ['path_north', 'path_east', 'path_west'], composition: { zombie: 0.14, worm: 0.15, weeper: 0.16, runner: 0.16, splitter: 0.12, hulk: 0.11, nest: 0.08, regenerator: 0.08 }, bossId: 'boss_furnace' },
      { wave: 10, count: 85,  interval: 0.70, routes: ['path_north', 'path_east', 'path_west'], composition: { zombie: 0.12, worm: 0.14, weeper: 0.17, runner: 0.16, splitter: 0.12, hulk: 0.12, nest: 0.09, regenerator: 0.08 } },
      { wave: 11, count: 100, interval: 0.65, routes: ['path_north', 'path_east', 'path_west'], composition: { zombie: 0.10, worm: 0.13, weeper: 0.18, runner: 0.16, splitter: 0.12, hulk: 0.13, nest: 0.09, regenerator: 0.09 }, bossId: 'boss_apostle' },
      { wave: 12, count: 120, interval: 0.60, routes: ['path_north', 'path_east', 'path_west'], composition: { zombie: 0.08, worm: 0.12, weeper: 0.19, runner: 0.16, splitter: 0.12, hulk: 0.14, nest: 0.09, regenerator: 0.10 }, bossId: 'boss_warden' }
    ]
  };
