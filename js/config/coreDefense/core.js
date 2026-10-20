// Configuración del núcleo, política de muerte y puntos de aparición.
// Exports: CORE, PLAYER_DEATH_POLICY, SPAWN_POINTS.

  // 1. EL NÚCLEO (Objetivo central a defender)
export const CORE = {
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
  };

  // 2. REGLA DE MUERTE DEL JUGADOR EN MODO DEFENSA
  // Si el jugador cae a 0 HP, entra en reconstrucción de emergencia durante 5.0s,
  // los enemigos que lo perseguían vuelven inmediatamente a su camino hacia el Núcleo,
  // y el Núcleo sufre una sobrecarga de emergencia (-50 HP / vidas) para mantener la tensión.
export const PLAYER_DEATH_POLICY = {
    mode: 'respawn_with_penalty', // 'respawn_with_penalty' | 'instant_defeat'
    respawnDelaySec: 5.0,
    coreHpPenaltyOnRespawn: 50,
    respawnInvulnSec: 2.5
  };

  // 3. PUNTOS DE APARICIÓN (Compuertas/Grietas en los extremos de las 3 rutas)
export const SPAWN_POINTS = [
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
  ];
