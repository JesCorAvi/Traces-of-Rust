// Catálogo de modos y configuración del modo Supervivencia.
// Exports: MODES_CONFIG.
// ============================================================================
// CONFIGURACIÓN DE MODOS DE JUEGO Y PARÁMETROS DEL MODO SUPERVIVENCIA
// ============================================================================

export const MODES_CONFIG = {
  DEFAULT_MODE: 'survival',
  CAREER_STORAGE_KEY: 'echoes_rust_career_modes_v2',

  // Catálogo para el selector de modo en el menú principal y el registro de modos
  CATALOG: {
    survival: {
      id: 'survival',
      title: 'SUPERVIVENCIA',
      shortTitle: 'SUPERVIVENCIA',
      icon: 'skull',
      tagline: 'Resiste el asedio infinito en planta y purga a los 5 jefes.',
      objectiveTitle: 'OBJETIVO DE PLANTA',
      objectiveDefault: 'Encuentra y purga a los jefes de planta'
    },
    core_defense: {
      id: 'core_defense',
      title: 'DEFENDER EL NÚCLEO',
      shortTitle: 'DEFENSA NÚCLEO',
      icon: 'core',
      tagline: 'Protege el reactor biomecánico central frente a 12 oleadas letales.',
      objectiveTitle: 'PROTOCOLO DE DEFENSA',
      objectiveDefault: 'Impide que las entidades destruyan el Núcleo'
    }
  },

  // Configuración exclusiva del modo Supervivencia original (Intacta)
  SURVIVAL: {
    DIFFICULTY: {
      MAX_ACTIVE_ENEMIES: 130,
      AI_LOD_DIST: 22.0,
      BASE_SPAWN_INTERVAL: 1.05,
      MIN_NORMAL_INTERVAL: 0.22,
      HP_SCALE_PER_MIN: 0.42,
      DMG_SCALE_PER_MIN: 0.18,
      ENDGAME_START_TIME: 900,
      ENDGAME_EXP_BASE: 1.045,
      ENDGAME_SPAWN_BURST: 4
    },

    // Calendario de Bosses (Cada 3 minutos: 180s, 360s, 540s, 720s, 900s)
    BOSS_SCHEDULE: [
      {
        time: 180,
        id: 'boss_butcher',
        name: 'EL AMPUTADOR DE PLANTA',
        hp: 850,
        dmg: 26,
        speed: 4.3,
        size: 3.8,
        teethReward: 12,
        attacks: ['cone_saw', 'charge']
      },
      {
        time: 360,
        id: 'boss_siren',
        name: 'LA MADRE DE ALAMBRE',
        hp: 1650,
        dmg: 32,
        speed: 4.6,
        size: 4.1,
        teethReward: 18,
        attacks: ['shockwave', 'summon']
      },
      {
        time: 540,
        id: 'boss_furnace',
        name: 'AUTÓMATA CREMATORIO N.º 09',
        hp: 2800,
        dmg: 38,
        speed: 4.1,
        size: 4.3,
        teethReward: 25,
        attacks: ['floor_bombs', 'radial_slag']
      },
      {
        time: 720,
        id: 'boss_apostle',
        name: 'EL FALSO CIRUJANO',
        hp: 4200,
        dmg: 45,
        speed: 5.0,
        size: 4.2,
        teethReward: 35,
        attacks: ['spiral_blades', 'floor_bombs']
      },
      {
        time: 900,
        id: 'boss_warden',
        name: 'EL RECAUDADOR DEL ABISMO',
        hp: 6500,
        dmg: 55,
        speed: 5.4,
        size: 4.8,
        teethReward: 50,
        attacks: ['floor_bombs', 'shockwave', 'spiral_blades', 'cone_saw']
      }
    ]
  }
};