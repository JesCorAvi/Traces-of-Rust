// ============================================================================
// CONFIGURACIÓN CENTRALIZADA DEL MODO "DEFENDER EL NÚCLEO"
// ============================================================================

export const CORE_DEFENSE_CONFIG = {
  // 1. EL NÚCLEO (Objetivo central a defender)
  CORE: {
    id: 'main_reactor_core',
    name: 'REACTOR BIOMECÁNICO CENTRAL',
    position: { x: 0, y: 0, z: 0 },
    playerStartPos: { x: 0, y: 0, z: 6.5 },
    maxHp: 1500,
    collisionRadius: 2.35,      // Sólido e impenetrable para jugador y enemigos
    attackStopDistance: 3.15,   // Distancia a la que los enemigos se detienen a golpear el núcleo
    height: 6.2,
    heartbeatBaseBpm: 52,
    underAttackAlertCooldown: 2.2,

    // Estados visuales de deterioro según porcentaje de vida restante
    DAMAGE_STATES: [
      {
        minPct: 0.75,
        id: 'stable',
        label: 'ESTABLE',
        heartColor: 0xd4af37,
        beaconColor: 0xb89c46,
        pulseSpeed: 2.2,
        smokeRate: 0.35,
        sparkRate: 0.08,
        sirenSpinSpeed: 1.6
      },
      {
        minPct: 0.45,
        id: 'strained',
        label: 'FUGA DE PRESIÓN',
        heartColor: 0xe67e22,
        beaconColor: 0xd95326,
        pulseSpeed: 4.0,
        smokeRate: 0.16,
        sparkRate: 0.28,
        sirenSpinSpeed: 3.4
      },
      {
        minPct: 0.20,
        id: 'critical',
        label: 'CONTENCIÓN CRÍTICA',
        heartColor: 0xd62828,
        beaconColor: 0xff2222,
        pulseSpeed: 6.8,
        smokeRate: 0.08,
        sparkRate: 0.55,
        sirenSpinSpeed: 6.2
      },
      {
        minPct: 0.0,
        id: 'meltdown',
        label: 'COLAPSO INMINENTE',
        heartColor: 0xff4444,
        beaconColor: 0xff0000,
        pulseSpeed: 11.0,
        smokeRate: 0.04,
        sparkRate: 0.9,
        sirenSpinSpeed: 10.5
      }
    ]
  },

  // 2. REGLA DE MUERTE DEL JUGADOR EN MODO DEFENSA
  // Si el jugador cae a 0 HP, entra en reconstrucción de emergencia durante 4.5s,
  // los enemigos que lo perseguían vuelven inmediatamente a su camino hacia el Núcleo,
  // y el Núcleo sufre una sobrecarga de emergencia (-120 HP) para mantener la tensión.
  PLAYER_DEATH_POLICY: {
    mode: 'respawn_with_penalty', // 'respawn_with_penalty' | 'instant_defeat'
    respawnDelaySec: 4.0,
    coreHpPenaltyOnRespawn: 120,
    respawnInvulnSec: 2.5
  },

  // 3. PUNTOS DE APARICIÓN (Compuertas/Grietas en los extremos de las 3 rutas)
  SPAWN_POINTS: [
    {
      id: 'sp_north_foundry',
      name: 'COMPUERTA NORTE // FUNDICIÓN',
      position: { x: 0, y: 0, z: -42 },
      pathId: 'path_north',
      color: 0xd95326
    },
    {
      id: 'sp_east_docks',
      name: 'CONDUCTO ESTE // GRÚAS DE CARGA',
      position: { x: 42, y: 0, z: 24 },
      pathId: 'path_east',
      color: 0xc42020
    },
    {
      id: 'sp_west_slaughter',
      name: 'FOSO OESTE // MATADERO',
      position: { x: -42, y: 0, z: 24 },
      pathId: 'path_west',
      color: 0xb89c46
    }
  ],

  // 4. CAMINOS DE ENEMIGOS (Aprovechan plataformas elevadas, escalones, rampas y diques de world.js)
  PATHS: {
    waypointReachRadius: 1.55,
    corridorClearanceRadius: 2.8, // Evita que cajas aleatorias bloqueen los caminos
    stuckTimeoutSec: 2.4,
    stuckMinProgressDist: 0.45,
    maxFallY: -2.0,

    ROUTES: {
      // Ruta Norte: Nace en z=-42, sube los escalones de la plataforma Norte (z=-20, y=2.0m),
      // la cruza por arriba, baja por la rampa sur (z=-12 a -9) y entra al Núcleo.
      path_north: {
        id: 'path_north',
        name: 'Vía Elevada Norte',
        color: 0xd95326,
        waypoints: [
          { x: 0, y: 0.0, z: -42.0 },
          { x: 0, y: 0.0, z: -31.0 },
          { x: 0, y: 1.2, z: -26.5 },
          { x: 0, y: 2.0, z: -21.0 },
          { x: 0, y: 2.0, z: -15.5 },
          { x: 0, y: 0.9, z: -12.0 },
          { x: 0, y: 0.0, z: -7.5 },
          { x: 0, y: 0.0, z: 0.0 }
        ]
      },

      // Ruta Este: Nace en (42, 24), sube por la rampa sur de la plataforma Este (x=24, z=10, y=2.2m),
      // baja por los escalones norte y bordea el dique Este hacia el Núcleo.
      path_east: {
        id: 'path_east',
        name: 'Pasarela Industrial Este',
        color: 0xc42020,
        waypoints: [
          { x: 42.0, y: 0.0, z: 24.0 },
          { x: 24.0, y: 0.0, z: 23.5 },
          { x: 24.0, y: 1.2, z: 19.5 },
          { x: 24.0, y: 2.2, z: 12.0 },
          { x: 24.0, y: 2.2, z: 4.0 },
          { x: 24.0, y: 0.8, z: -0.5 },
          { x: 24.0, y: 0.0, z: -4.5 },
          { x: 11.5, y: 0.0, z: -2.0 },
          { x: 0.0,  y: 0.0, z: 0.0 }
        ]
      },

      // Ruta Oeste: Nace en (-42, 24), sube la rampa de la plataforma Oeste (x=-24, z=12, y=1.8m),
      // desciende por los escalones norte y avanza por el pasillo central oeste hasta el Núcleo.
      path_west: {
        id: 'path_west',
        name: 'Canal de Drenaje Oeste',
        color: 0xb89c46,
        waypoints: [
          { x: -42.0, y: 0.0, z: 24.0 },
          { x: -24.0, y: 0.0, z: 24.0 },
          { x: -24.0, y: 1.0, z: 20.5 },
          { x: -24.0, y: 1.8, z: 13.0 },
          { x: -24.0, y: 1.8, z: 6.5 },
          { x: -24.0, y: 0.7, z: 2.5 },
          { x: -24.0, y: 0.0, z: -2.0 },
          { x: -11.5, y: 0.0, z: -1.5 },
          { x: 0.0,   y: 0.0, z: 0.0 }
        ]
      }
    }
  },

  // 5. LÓGICA DE OBJETIVO E IA POR TIPO DE ENEMIGO (Núcleo vs Jugador vs Estructuras futuras)
  // Regla de abandono cuando ya ataca el núcleo: una vez el enemigo está golpeando el Núcleo,
  // ignora al jugador salvo que el jugador se pegue a menos de `coreOverrideRadius` metros.
  TARGETING: {
    PRIORITIES: {
      CORE: 1,
      DEFENSIVE_STRUCTURE: 2, // Preparado para futuras torres
      PLAYER: 3
    },

    BY_ENEMY_TYPE: {
      // Zombie: equilibrado; persigue al jugador si se acerca a distancia media
      zombie: {
        coreDamage: 16,
        coreAttackInterval: 1.15,
        detectRadius: 8.5,
        abandonRadius: 13.5,
        coreOverrideRadius: 2.8,
        reactionTime: 0.35,
        aggroScareCooldown: 4.5
      },
      // Weeper (El Observador): cazador agresivo con el jugador, gran radio de detección
      weeper: {
        coreDamage: 24,
        coreAttackInterval: 1.0,
        detectRadius: 15.0,
        abandonRadius: 21.0,
        coreOverrideRadius: 5.2,
        reactionTime: 0.22,
        aggroScareCooldown: 3.5
      },
      // Worm (Gusano de Escoria): asediador obstinado; casi ignora al jugador y va directo al núcleo
      worm: {
        coreDamage: 30,
        coreAttackInterval: 1.25,
        detectRadius: 4.2,
        abandonRadius: 7.0,
        coreOverrideRadius: 1.8,
        reactionTime: 0.55,
        aggroScareCooldown: 6.0
      },
      // Bosses: enormes amenazas para el núcleo; atacan al jugador si les corta el paso
      boss: {
        coreDamage: 85,
        coreAttackInterval: 1.35,
        detectRadius: 10.5,
        abandonRadius: 16.0,
        coreOverrideRadius: 3.6,
        reactionTime: 0.4,
        aggroScareCooldown: 5.0
      }
    }
  },

  // 6. SISTEMA DE OLEADAS Y CONDICIÓN DE VICTORIA
  WAVES: {
    totalWavesForVictory: 12,
    initialPrepTimeSec: 4.5,
    betweenWavesRestSec: 6.0,
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
  }
};