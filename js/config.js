export const CONFIG = {
  SAVE_KEY: 'echoes_rust_buckshot_save_v4',
  PIXEL_SCALE: 0.44,
  FRAME_SIZE: 64,

  // ==========================================================================
  // CONFIGURACIÓN CENTRALIZADA DE INTERFAZ POR SPRITES (9-SLICE, ATLAS Y ESCALA)
  // ==========================================================================
  UI_SPRITES: {
    SCALE: 2,          // Factor de escala entero para nitidez pixel-perfect (2 = x2, 3 = x3, 4 = x4)
    ATLAS_W: 512,      // Ancho total del Atlas Maestro de UI
    ATLAS_H: 512,      // Alto total del Atlas Maestro de UI
    ICON_SIZE: 16,     // Tamaño base de cada icono en el atlas (16x16 px nativos -> 32x32 px a escala x2)
    BADGE_W: 20,       // Ancho base del sprite de nivel (+1 a +8)
    BADGE_H: 12,       // Alto base del sprite de nivel

    // Definición de paneles y botones 9-slice dentro del Atlas Maestro
    // (x, y, w, h en el atlas, slice = corte de esquina en píxeles nativos)
    NINE_SLICE: {
      panel_metal:      { x: 0,   y: 0,  w: 48, h: 48, slice: 12 }, // Ventanas principales de acero oxidado
      panel_boss:       { x: 48,  y: 0,  w: 48, h: 48, slice: 12 }, // Marco ensangrentado de barra de Boss
      panel_paper:      { x: 96,  y: 0,  w: 48, h: 48, slice: 10 }, // Papel clínico manchado (notas/autopsia)
      panel_inset:      { x: 144, y: 0,  w: 32, h: 32, slice: 8  }, // Pantalla CRT hundida (contadores/reloj)
      panel_tape:       { x: 176, y: 0,  w: 48, h: 24, slice: 6  }, // Cinta adhesiva rasgada para títulos
      panel_teeth:      { x: 224, y: 0,  w: 48, h: 32, slice: 8  }, // Marco de reserva de dientes

      // Casillas de inventario (Armas, Pasivas y Tarjetas de Nivel)
      slot_weapon:      { x: 0,   y: 48, w: 32, h: 32, slice: 7  },
      slot_passive:     { x: 32,  y: 48, w: 32, h: 32, slice: 7  },
      slot_empty:       { x: 64,  y: 48, w: 32, h: 32, slice: 7  },
      card_normal:      { x: 96,  y: 48, w: 48, h: 48, slice: 10 },
      card_hover:       { x: 144, y: 48, w: 48, h: 48, slice: 10 },
      bar_frame:        { x: 192, y: 48, w: 48, h: 16, slice: 5  },

      // Botón Industrial Estándar (4 estados)
      btn_normal:       { x: 0,   y: 96, w: 48, h: 24, slice: 7  },
      btn_hover:        { x: 48,  y: 96, w: 48, h: 24, slice: 7  },
      btn_active:       { x: 96,  y: 96, w: 48, h: 24, slice: 7  },
      btn_disabled:     { x: 144, y: 96, w: 48, h: 24, slice: 7  },

      // Botón Primario de Sangre/Contrato (4 estados)
      btn_pri_normal:   { x: 0,   y: 120, w: 48, h: 24, slice: 7 },
      btn_pri_hover:    { x: 48,  y: 120, w: 48, h: 24, slice: 7 },
      btn_pri_active:   { x: 96,  y: 120, w: 48, h: 24, slice: 7 },
      btn_pri_disabled: { x: 144, y: 120, w: 48, h: 24, slice: 7 }
    },

    // Texturas de relleno repetibles/recortables para las barras
    BAR_FILLS: {
      hp:   { x: 0,   y: 152, w: 64, h: 12 }, // Tubo de sangre arterial con pulso
      exp:  { x: 64,  y: 152, w: 64, h: 12 }, // Suero mutagénico ámbar
      stam: { x: 128, y: 152, w: 64, h: 12 }, // Vapor presurizado verde moho
      boss: { x: 192, y: 152, w: 64, h: 12 }  // Carne biomecánica de Boss
    },

    // Coordenadas (columna, fila) de los Iconos 16x16 en la sección de iconos del Atlas (origen Y = 176)
    ICONS_ORIGIN_Y: 176,
    ICONS: {
      // 8 Armas (Fila 0)
      slash:        { col: 0, row: 0 },
      shotgun:      { col: 1, row: 0 },
      flamethrower: { col: 2, row: 0 },
      aura:         { col: 3, row: 0 },
      mines:        { col: 4, row: 0 },
      harpoon:      { col: 5, row: 0 },
      orbital:      { col: 6, row: 0 },
      bolt:         { col: 7, row: 0 },

      // 9 Pasivas (Fila 1 y parte de Fila 2)
      multishot:    { col: 0, row: 1 },
      dmg:          { col: 1, row: 1 },
      atkSpd:       { col: 2, row: 1 },
      maxHp:        { col: 3, row: 1 },
      regen:        { col: 4, row: 1 },
      moveSpd:      { col: 5, row: 1 },
      area:         { col: 6, row: 1 },
      crit:         { col: 7, row: 1 },
      magnet:       { col: 8, row: 1 },

      // Suministros, Moneda e Iconos de Sistema (Fila 2)
      heal_pack:    { col: 0, row: 2 },
      teeth_bag:    { col: 1, row: 2 },
      tooth:        { col: 2, row: 2 },
      skull:        { col: 3, row: 2 },
      clock:        { col: 4, row: 2 },
      level:        { col: 5, row: 2 },
      reroll:       { col: 6, row: 2 },
      warning:      { col: 7, row: 2 },
      suit:         { col: 8, row: 2 },
      boss_skull:   { col: 9, row: 2 },

      // Decoración física: Tornillos, remaches, grietas, cables y manchas (Fila 3)
      screw_0:      { col: 0, row: 3 },
      screw_1:      { col: 1, row: 3 },
      screw_2:      { col: 2, row: 3 },
      screw_3:      { col: 3, row: 3 },
      crack_1:      { col: 4, row: 3 },
      crack_2:      { col: 5, row: 3 },
      stain_blood:  { col: 6, row: 3 },
      stain_rust:   { col: 7, row: 3 },
      wire_clamp:   { col: 8, row: 3 },
      charge_on:    { col: 9, row: 3 },
      charge_off:   { col: 10, row: 3 }
    },

    // Placas de nivel pixeladas (+1 a +8 y MAX) en Y = 256
    BADGES_ORIGIN_Y: 256,

    // Cursores personalizados 16x16 en Y = 280
    CURSORS: {
      default: { x: 0,  y: 280, w: 16, h: 16, hotX: 2, hotY: 2 },
      pointer: { x: 16, y: 280, w: 16, h: 16, hotX: 5, hotY: 2 },
      crosshair: { x: 32, y: 280, w: 16, h: 16, hotX: 8, hotY: 8 }
    }
  },

  // CONFIGURACIÓN DEL SISTEMA DE 8 DIRECCIONES Y ANIMACIONES 3D
  DIRECTIONAL: {
    HYSTERESIS_DEG: 6.0,
    USE_MIRRORING: false,
    FRAMES_PER_STATE: 4,
    STATES: {
      IDLE: 0,              // Columnas 0..3
      WALK: 1,              // Columnas 4..7
      JUMP: 2,              // Columnas 8..11
      ATTACK: 3,            // Columnas 12..15 (Atacar quieto)
      HURT: 4,              // Columnas 16..19
      ATTACK_WALK: 5,       // Columnas 20..23 (Atacar caminando / moviendo las piernas)
      DASH: 6               // Columnas 24..27 (Animación de esquiva fluida)
    },
    ANIM_FPS: {
      IDLE: 5,
      WALK: 9,
      JUMP: 7,
      ATTACK: 13,
      HURT: 9,
      ATTACK_WALK: 12,
      DASH: 15
    },
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

  // CATÁLOGO DE 8 ARMAS (icon apunta ahora a la clave del sprite en UI_SPRITES.ICONS)
  SKILLS: {
    slash: {
      name: 'Sierra de Amputación', icon: 'slash',
      baseDmg: 28, baseCd: 0.88, baseRange: 4.5, scalePerLvl: 0.25,
      usesMultishot: false,
      desc: 'Arco de sierra dentada con estela de sangre, destello 3D y empuje. (No afectada por +Proyectiles).'
    },
    shotgun: {
      name: 'Escopeta Calibre 12', icon: 'shotgun',
      baseDmg: 10.0, baseCd: 1.4, baseRange: 14.5, scalePerLvl: 0.24,
      usesMultishot: true,
      desc: 'Abanico de postas físicas con fogonazo y expulsión de cartucho.'
    },
    flamethrower: {
      name: 'Soplete Incinerador', icon: 'flamethrower',
      baseDmg: 8.0, baseCd: 0.11, baseRange: 7.4, scalePerLvl: 0.25,
      usesMultishot: false,
      desc: 'Cono continuo de fuego que ilumina y aplica Quemadura por segundo. (No afectada por +Proyectiles).'
    },
    aura: {
      name: 'Incensario de Bilis', icon: 'aura',
      baseDmg: 15, baseCd: 0.34, baseRange: 3.5, scalePerLvl: 0.22,
      usesMultishot: false,
      desc: 'Campo corrosivo alrededor del jugador que daña y frena a la horda. (No afectada por +Proyectiles).'
    },
    mines: {
      name: 'Minas de Metralla', icon: 'mines',
      baseDmg: 55, baseCd: 2.4, baseRange: 3.3, scalePerLvl: 0.28,
      usesMultishot: true,
      desc: 'Arroja minas con sensor rojo que detonan en área al pisarlas.'
    },
    harpoon: {
      name: 'Arpón Neumático', icon: 'harpoon',
      baseDmg: 44, baseCd: 1.55, baseRange: 18.0, scalePerLvl: 0.26,
      usesMultishot: true,
      desc: 'Proyectil perforante que atraviesa en línea recta a múltiples enemigos.'
    },
    orbital: {
      name: 'Jaula de Carnicero', icon: 'orbital',
      baseDmg: 26, baseCd: 0.2, baseRange: 3.3, scalePerLvl: 0.25,
      usesMultishot: true,
      desc: 'Jaulas con cráneos y ganchos giran dejando estela y desgarrando.'
    },
    bolt: {
      name: 'Desfibrilador Roto', icon: 'bolt',
      baseDmg: 27, baseCd: 1.8, baseRange: 13.0, scalePerLvl: 0.25,
      usesMultishot: false,
      desc: 'Descarga eléctrica de alto voltaje que salta entre varios cuerpos. (No afectada por +Proyectiles).'
    }
  },

  // CATÁLOGO DE 9 PASIVAS EN PARTIDA (icon apunta al sprite del Atlas UI)
  PASSIVES: {
    multishot: {
      name: 'Recámara Modificada', icon: 'multishot', perLevel: 1,
      targetType: 'multishot_weapons',
      format: lvl => `+${lvl} PROY.`,
      desc: 'Añade +1 proyectil a Escopeta, Minas, Arpón y Jaula Orbital.'
    },
    dmg: {
      name: 'Pólvora Prensada', icon: 'dmg', perLevel: 0.15,
      targetType: 'all_weapons',
      format: lvl => `+${Math.round(lvl * 15)}% DAÑO`,
      desc: 'Aumenta el daño de todas las armas un +15% por nivel.'
    },
    atkSpd: {
      name: 'Servomotor Oxidado', icon: 'atkSpd', perLevel: 0.10,
      targetType: 'all_weapons',
      format: lvl => `+${Math.round(lvl * 10)}% CAD.`,
      desc: 'Aumenta la velocidad de ataque y giro un +10% por nivel.'
    },
    maxHp: {
      name: 'Placas Quirúrgicas', icon: 'maxHp', perLevel: 25,
      targetType: 'player_stat',
      format: lvl => `+${lvl * 25} PULSO`,
      desc: 'Aumenta el Pulso máximo en +25 y los restaura al instante.'
    },
    regen: {
      name: 'Goteo Intravenoso', icon: 'regen', perLevel: 0.9,
      targetType: 'player_stat',
      format: lvl => `+${(lvl * 0.9).toFixed(1)} HP/S`,
      desc: 'Regenera +0.9 de Pulso por segundo de forma continua.'
    },
    moveSpd: {
      name: 'Efedrina Industrial', icon: 'moveSpd', perLevel: 0.08,
      targetType: 'player_stat',
      format: lvl => `+${Math.round(lvl * 8)}% VEL.`,
      desc: 'Aumenta la velocidad de movimiento un +8% por nivel.'
    },
    area: {
      name: 'Metralla Expandida', icon: 'area', perLevel: 0.12,
      targetType: 'all_weapons',
      format: lvl => `+${Math.round(lvl * 12)}% ÁREA`,
      desc: 'Aumenta el tamaño y alcance de ataques un +12% por nivel.'
    },
    crit: {
      name: 'Lente de Carnicero', icon: 'crit', perLevel: 0.07,
      targetType: 'all_weapons',
      format: lvl => `+${Math.round(lvl * 7)}% CRÍT.`,
      desc: 'Añade +7% de probabilidad de infligir doble daño (x2).'
    },
    magnet: {
      name: 'Imán de Grúa', icon: 'magnet', perLevel: 1.6,
      targetType: 'player_stat',
      format: lvl => `+${(lvl * 1.6).toFixed(1)}M IMÁN`,
      desc: 'Aumenta el radio de recogida de suero y dientes.'
    }
  },

  FALLBACK_REWARDS: [
    { id: 'heal_pack', name: 'Transfusión de Emergencia', icon: 'heal_pack', desc: 'Restaura +75 de Pulso inmediatamente.' },
    { id: 'teeth_bag', name: 'Bolsa de Dientes Extraídos', icon: 'teeth_bag', desc: 'Obtienes +15 Dientes adicionales para la Mesa del Cirujano.' }
  ],

  // MEJORAS PERMANENTES SUTILES
  SHOP: [
    { id: 'dmg',    name: 'Pólvora Refinada',      icon: 'dmg',     perLevel: 0.03,  desc: '+3% Daño Base permanente por nivel',            cost: 6 },
    { id: 'hp',     name: 'Puntos de Sutura',      icon: 'maxHp',   perLevel: 5,     desc: '+5 Pulso Máximo Base permanente por nivel',     cost: 5 },
    { id: 'spd',    name: 'Microdosis Efedrina',   icon: 'moveSpd', perLevel: 0.02,  desc: '+2% Velocidad de Movimiento Base por nivel',    cost: 6 },
    { id: 'atkSpd', name: 'Aceite de Mecanismos',  icon: 'atkSpd',  perLevel: 0.025, desc: '+2.5% Cadencia de Ataque Base por nivel',       cost: 7 },
    { id: 'mag',    name: 'Pinzas de Extracción',  icon: 'magnet',  perLevel: 0.35,  desc: '+0.35m Rango de Imán Base permanente',          cost: 5 },
    { id: 'reroll', name: 'Soborno al Crupier',    icon: 'reroll',  perLevel: 1,     desc: '+1 Uso extra del botón Actualizar (Máx +3)',    cost: 18, max: 3 }
  ]
};