export const CONFIG = {
  SAVE_KEY: 'echoes_rust_buckshot_save_v4',
  PIXEL_SCALE: 0.44,
  FRAME_SIZE: 64,

  // CONFIGURACIÓN DEL SISTEMA DE 8 DIRECCIONES Y ANIMACIONES
  DIRECTIONAL: {
    HYSTERESIS_DEG: 6.0,    // Margen en grados para evitar parpadeo en los bordes de 22.5°
    USE_MIRRORING: false,   // false = dibuja las 8 vistas asimétricas reales; true = refleja vistas 1,2,3 en 7,6,5
    FRAMES_PER_STATE: 4,    // 4 frames por cada estado de animación
    STATES: {
      IDLE: 0,              // Columnas 0..3
      WALK: 1,              // Columnas 4..7
      JUMP: 2,              // Columnas 8..11
      ATTACK: 3,            // Columnas 12..15
      HURT: 4               // Columnas 16..19
    },
    ANIM_FPS: {
      IDLE: 5,
      WALK: 9,
      JUMP: 7,
      ATTACK: 13,
      HURT: 9
    },
    // Número de direcciones por entidad (1, 4 u 8) para reutilizar el componente en enemigos/bosses
    ENTITY_DIRS: {
      player: 8,
      zombie: 4,
      weeper: 4,
      worm: 1,
      boss_butcher: 8,
      boss_siren: 4,
      boss_furnace: 4,
      boss_apostle: 4,
      boss_warden: 8
    }
  },

  // 1. LÍMITES DE INVENTARIO, SUBIDA DE NIVEL Y BOTÓN ACTUALIZAR
  LIMITS: {
    MAX_WEAPONS: 4,
    MAX_PASSIVES: 4,
    MAX_LEVEL: 8,
    OPTIONS_PER_LEVEL: 4,
    REROLLS_PER_RUN: 3
  },

  // 2. CALENDARIO DE BOSSES (Cada 3 minutos: 180s, 360s, 540s, 720s, 900s)
  BOSS_SCHEDULE: [
    {
      time: 180,
      id: 'boss_butcher',
      name: 'EL AMPUTADOR DE PLANTA',
      hp: 850, dmg: 26, speed: 4.3, size: 3.8, teethReward: 12,
      attacks: ['cone_saw', 'charge']
    },
    {
      time: 360,
      id: 'boss_siren',
      name: 'LA MADRE DE ALAMBRE',
      hp: 1650, dmg: 32, speed: 4.6, size: 4.1, teethReward: 18,
      attacks: ['shockwave', 'summon']
    },
    {
      time: 540,
      id: 'boss_furnace',
      name: 'AUTÓMATA CREMATORIO N.º 09',
      hp: 2800, dmg: 38, speed: 4.1, size: 4.3, teethReward: 25,
      attacks: ['floor_bombs', 'radial_slag']
    },
    {
      time: 720,
      id: 'boss_apostle',
      name: 'EL FALSO CIRUJANO',
      hp: 4200, dmg: 45, speed: 5.0, size: 4.2, teethReward: 35,
      attacks: ['spiral_blades', 'floor_bombs']
    },
    {
      time: 900,
      id: 'boss_warden',
      name: 'EL RECAUDADOR DEL ABISMO',
      hp: 6500, dmg: 55, speed: 5.4, size: 4.8, teethReward: 50,
      attacks: ['floor_bombs', 'shockwave', 'spiral_blades', 'cone_saw']
    }
  ],

  // 3. CURVA DE DIFICULTAD Y FASE FINAL (Minuto 15+)
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

  // CATÁLOGO DE 8 ARMAS
  SKILLS: {
    slash: {
      name: 'Sierra de Amputación', icon: '🪚',
      baseDmg: 28, baseCd: 0.88, baseRange: 4.5, scalePerLvl: 0.25,
      desc: 'Arco de sierra dentada con estela de sangre, destello 3D y empuje.'
    },
    shotgun: {
      name: 'Escopeta Calibre 12', icon: '🔫',
      baseDmg: 10.0, baseCd: 1.4, baseRange: 14.5, scalePerLvl: 0.24,
      desc: 'Abanico de postas físicas con fogonazo y expulsión de cartucho.'
    },
    flamethrower: {
      name: 'Soplete Incinerador', icon: '🔥',
      baseDmg: 8.0, baseCd: 0.11, baseRange: 7.4, scalePerLvl: 0.25,
      desc: 'Cono continuo de fuego que ilumina y aplica Quemadura por segundo.'
    },
    aura: {
      name: 'Incensario de Bilis', icon: '☣️',
      baseDmg: 15, baseCd: 0.34, baseRange: 3.5, scalePerLvl: 0.22,
      desc: 'Campo corrosivo alrededor del jugador que daña y frena a la horda.'
    },
    mines: {
      name: 'Minas de Metralla', icon: '💣',
      baseDmg: 55, baseCd: 2.4, baseRange: 3.3, scalePerLvl: 0.28,
      desc: 'Arroja minas con sensor rojo que detonan en área al pisarlas.'
    },
    harpoon: {
      name: 'Arpón Neumático', icon: '🔱',
      baseDmg: 44, baseCd: 1.55, baseRange: 18.0, scalePerLvl: 0.26,
      desc: 'Proyectil perforante que atraviesa en línea recta a múltiples enemigos.'
    },
    orbital: {
      name: 'Jaula de Carnicero', icon: '🪝',
      baseDmg: 26, baseCd: 0.2, baseRange: 3.3, scalePerLvl: 0.25,
      desc: 'Jaulas con cráneos y ganchos giran dejando estela y desgarrando.'
    },
    bolt: {
      name: 'Desfibrilador Roto', icon: '⚡',
      baseDmg: 27, baseCd: 1.8, baseRange: 13.0, scalePerLvl: 0.25,
      desc: 'Descarga eléctrica de alto voltaje que salta entre varios cuerpos.'
    }
  },

  // CATÁLOGO DE 9 PASIVAS EN PARTIDA
  PASSIVES: {
    multishot: {
      name: 'Recámara Modificada', icon: '🎱', perLevel: 1,
      format: lvl => `+${lvl} Proyectil${lvl > 1 ? 'es' : ''}`,
      desc: 'Añade +1 proyectil, tajo, arpón, mina, chorro u orbital adicional.'
    },
    dmg: {
      name: 'Pólvora Prensada', icon: '💥', perLevel: 0.15,
      format: lvl => `+${Math.round(lvl * 15)}% Daño`,
      desc: 'Aumenta el daño de todas las armas un +15% por nivel.'
    },
    atkSpd: {
      name: 'Servomotor Oxidado', icon: '⚙️', perLevel: 0.10,
      format: lvl => `+${Math.round(lvl * 10)}% Cadencia`,
      desc: 'Aumenta la velocidad de ataque y giro un +10% por nivel.'
    },
    maxHp: {
      name: 'Placas Quirúrgicas', icon: '🫀', perLevel: 25,
      format: lvl => `+${lvl * 25} Pulso Máx`,
      desc: 'Aumenta el Pulso máximo en +25 y los restaura al instante.'
    },
    regen: {
      name: 'Goteo Intravenoso', icon: '🩸', perLevel: 0.9,
      format: lvl => `+${(lvl * 0.9).toFixed(1)} HP/s`,
      desc: 'Regenera +0.9 de Pulso por segundo de forma continua.'
    },
    moveSpd: {
      name: 'Efedrina Industrial', icon: '💉', perLevel: 0.08,
      format: lvl => `+${Math.round(lvl * 8)}% Velocidad`,
      desc: 'Aumenta la velocidad de movimiento un +8% por nivel.'
    },
    area: {
      name: 'Metralla Expandida', icon: '📡', perLevel: 0.12,
      format: lvl => `+${Math.round(lvl * 12)}% Área`,
      desc: 'Aumenta el tamaño y alcance de ataques un +12% por nivel.'
    },
    crit: {
      name: 'Lente de Carnicero', icon: '👁️', perLevel: 0.07,
      format: lvl => `+${Math.round(lvl * 7)}% Crítico`,
      desc: 'Añade +7% de probabilidad de infligir doble daño (x2).'
    },
    magnet: {
      name: 'Imán de Grúa', icon: '🧲', perLevel: 1.6,
      format: lvl => `+${(lvl * 1.6).toFixed(1)}m Imán`,
      desc: 'Aumenta el radio de recogida de suero y dientes.'
    }
  },

  FALLBACK_REWARDS: [
    { id: 'heal_pack', name: 'Transfusión de Emergencia', icon: '🩸', desc: 'Restaura +75 de Pulso inmediatamente.' },
    { id: 'teeth_bag', name: 'Bolsa de Dientes Extraídos', icon: '🦷', desc: 'Obtienes +15 Dientes adicionales para la Mesa del Cirujano.' }
  ],

  // MEJORAS PERMANENTES SUTILES
  SHOP: [
    { id: 'dmg',    name: 'Pólvora Refinada',      perLevel: 0.03,  desc: '+3% Daño Base permanente por nivel',            cost: 6 },
    { id: 'hp',     name: 'Puntos de Sutura',      perLevel: 5,     desc: '+5 Pulso Máximo Base permanente por nivel',     cost: 5 },
    { id: 'spd',    name: 'Microdosis Efedrina',   perLevel: 0.02,  desc: '+2% Velocidad de Movimiento Base por nivel',    cost: 6 },
    { id: 'atkSpd', name: 'Aceite de Mecanismos',  perLevel: 0.025, desc: '+2.5% Cadencia de Ataque Base por nivel',       cost: 7 },
    { id: 'mag',    name: 'Pinzas de Extracción',  perLevel: 0.35,  desc: '+0.35m Rango de Imán Base permanente',          cost: 5 },
    { id: 'reroll', name: 'Soborno al Crupier',    perLevel: 1,     desc: '+1 Uso extra del botón Actualizar (Máx +3)',    cost: 18, max: 3 }
  ]
};