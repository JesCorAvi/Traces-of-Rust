import { t } from '../core/i18n.js';
const _t = (k, fb) => (typeof t === 'function' ? t(k) : fb);

// Catálogo de Mapas para el modo Tower Defense (estilo Bloons TD 6).
// 18 mapas en total: 6 en Fácil, 6 en Normal y 6 en Difícil.
// Exports: MAP_CATALOG, getMapsByDifficulty, getMapById, DEFAULT_MAP_IDS.

export const DEFAULT_MAP_IDS = {
  facil: 'easy_plaza',
  normal: 'norm_twins',
  dificil: 'hard_isolated'
};

export const MAP_CATALOG = {
  // ==========================================================================
  // DIFICULTAD FÁCIL: 1 Entrada · 1 Salida · 150 Vidas · 10 Chatarra
  // ==========================================================================
  easy_plaza: {
    id: 'easy_plaza',
    difficulty: 'facil',
    get name() { return _t('map.easy_plaza.name', 'Plaza Central'); },
    get badge() { return _t('map.easy_plaza.badge', 'FÁCIL // BUCLE 360°'); },
    get desc() { return _t('map.easy_plaza.desc', 'Un recorrido largo con un bucle completo de 360° en el patio despejado. Máximo tiempo de impacto para torretas.'); },
    entrances: 1,
    exits: 1,
    startingScrap: 10,
    maxLives: 150,
    routes: {
      path_main: {
        id: 'path_main',
        name: 'Vía Principal',
        color: 0x00e5ff,
        controlPoints: [
          { x: 0, z: -44 },
          { x: 10, z: -38 },
          { x: 14, z: -28 },
          { x: 11, z: -19 },
          { x: 6, z: -10 },
          { x: 0, z: -3 },
          { x: -8, z: 2 },
          { x: -9, z: 10 },
          { x: 0, z: 14 },
          { x: 9, z: 10 },
          { x: 8, z: 2 },
          { x: 0, z: 1 },
          { x: -12, z: 6 },
          { x: -14, z: 18 },
          { x: -14, z: 28 },
          { x: -12, z: 35 },
          { x: -7, z: 41 },
          { x: 0, z: 44 }
        ]
      }
    },
    spawnPoints: [
      { id: 'sp_1', name: 'COMPUERTA NORTE', pathId: 'path_main', color: 0x00e5ff }
    ],
    exitPoints: [
      { id: 'exit_1', name: 'ESCLUSA SUR', pathId: 'path_main', color: 0xff3b16 }
    ]
  },

  easy_spiral: {
    id: 'easy_spiral',
    difficulty: 'facil',
    get name() { return _t('map.easy_spiral.name', 'Espiral de Contención'); },
    get badge() { return _t('map.easy_spiral.badge', 'FÁCIL // ESPIRAL'); },
    get desc() { return _t('map.easy_spiral.desc', 'Doble circunvalación concéntrica alrededor del patio central. Las entidades giran hacia adentro antes de salir.'); },
    entrances: 1,
    exits: 1,
    startingScrap: 10,
    maxLives: 150,
    routes: {
      path_main: {
        id: 'path_main',
        name: 'Conducto Espiral',
        color: 0x38ef7d,
        controlPoints: [
          { x: -42, z: -44 },
          { x: -42, z: -10 },
          { x: -42, z: 24 },
          { x: -42, z: 40 },
          { x: -20, z: 42 },
          { x: 0, z: 42 },
          { x: 20, z: 42 },
          { x: 42, z: 40 },
          { x: 42, z: 10 },
          { x: 42, z: -16 },
          { x: 42, z: -42 },
          { x: 16, z: -42 },
          { x: 12, z: -36 },
          { x: 12, z: -22 },
          { x: 6, z: -10 },
          { x: 0, z: -3 },
          { x: -6, z: 6 },
          { x: -12, z: 14 },
          { x: -14, z: 24 },
          { x: -14, z: 34 },
          { x: -7, z: 41 },
          { x: 0, z: 44 }
        ]
      }
    },
    spawnPoints: [
      { id: 'sp_1', name: 'ACCESO NOROESTE', pathId: 'path_main', color: 0x38ef7d }
    ],
    exitPoints: [
      { id: 'exit_1', name: 'DESAGÜE SURESTE', pathId: 'path_main', color: 0xff3b16 }
    ]
  },

  easy_serpentine: {
    id: 'easy_serpentine',
    difficulty: 'facil',
    get name() { return _t('map.easy_serpentine.name', 'El Serpentín'); },
    get badge() { return _t('map.easy_serpentine.badge', 'FÁCIL // ZIGZAG'); },
    get desc() { return _t('map.easy_serpentine.desc', 'Un sinuoso zigzag de tres pasadas horizontales cruzando la planta industrial de lado a lado.'); },
    entrances: 1,
    exits: 1,
    startingScrap: 10,
    maxLives: 150,
    routes: {
      path_main: {
        id: 'path_main',
        name: 'Vía Zigzag',
        color: 0x4facfe,
        controlPoints: [
          { x: -42, z: -44 },
          { x: -42, z: -41 },
          { x: -14, z: -41 },
          { x: 14, z: -41 },
          { x: 42, z: -41 },
          { x: 42, z: -14 },
          { x: 42, z: 24 },
          { x: 42, z: 41 },
          { x: 14, z: 41 },
          { x: 0, z: 41 },
          { x: -14, z: 41 },
          { x: -14, z: 26 },
          { x: -12, z: 6 },
          { x: 0, z: 1 },
          { x: -12, z: 6 },
          { x: -14, z: 18 },
          { x: -14, z: 28 },
          { x: -12, z: 35 },
          { x: -7, z: 41 },
          { x: 0, z: 44 }
        ]
      }
    },
    spawnPoints: [
      { id: 'sp_1', name: 'COMPUERTA OESTE', pathId: 'path_main', color: 0x4facfe }
    ],
    exitPoints: [
      { id: 'exit_1', name: 'SALIDA INDUSTRIAL', pathId: 'path_main', color: 0xff3b16 }
    ]
  },

  easy_ramps: {
    id: 'easy_ramps',
    difficulty: 'facil',
    get name() { return _t('map.easy_ramps.name', 'Rampa Perimetral'); },
    get badge() { return _t('map.easy_ramps.badge', 'FÁCIL // ELEVADA'); },
    get desc() { return _t('map.easy_ramps.desc', 'Recorrido perimetral que asciende por la rampa oeste, cruza el mirador alto y desciende al patio sur.'); },
    entrances: 1,
    exits: 1,
    startingScrap: 10,
    maxLives: 150,
    routes: {
      path_main: {
        id: 'path_main',
        name: 'Pasarela Alta',
        color: 0x00f2fe,
        controlPoints: [
          { x: 0, z: -44 },
          { x: -14, z: -41 },
          { x: -42, z: -41 },
          { x: -42, z: -14 },
          { x: -42, z: 14 },
          { x: -42, z: 36 },
          { x: -20, z: 42 },
          { x: 0, z: 42 },
          { x: 20, z: 42 },
          { x: 42, z: 36 },
          { x: 42, z: 10 },
          { x: 42, z: -10 },
          { x: 42, z: -41 },
          { x: 14, z: -41 },
          { x: 10, z: -30 },
          { x: 6, z: -10 },
          { x: 0, z: 0 },
          { x: -12, z: 14 },
          { x: -14, z: 28 },
          { x: -10, z: 38 },
          { x: 0, z: 44 }
        ]
      }
    },
    spawnPoints: [
      { id: 'sp_1', name: 'RAMPA NORTE', pathId: 'path_main', color: 0x00f2fe }
    ],
    exitPoints: [
      { id: 'exit_1', name: 'ESCLUSA SUR', pathId: 'path_main', color: 0xff3b16 }
    ]
  },

  easy_cooling: {
    id: 'easy_cooling',
    difficulty: 'facil',
    get name() { return _t('map.easy_cooling.name', 'Circuito Enfriamiento'); },
    get badge() { return _t('map.easy_cooling.badge', 'FÁCIL // DOBLE S'); },
    get desc() { return _t('map.easy_cooling.desc', 'Dos giros en forma de "S" trazados alrededor de las tuberías y depósitos de enfriamiento de la fábrica.'); },
    entrances: 1,
    exits: 1,
    startingScrap: 10,
    maxLives: 150,
    routes: {
      path_main: {
        id: 'path_main',
        name: 'Vía Tanques',
        color: 0x43e97b,
        controlPoints: [
          { x: 24, z: -44 },
          { x: 14, z: -41 },
          { x: 12, z: -30 },
          { x: 12, z: -18 },
          { x: 6, z: -10 },
          { x: 0, z: -4 },
          { x: -6, z: 6 },
          { x: -12, z: 14 },
          { x: -14, z: 24 },
          { x: -14, z: 34 },
          { x: -18, z: 40 },
          { x: -20, z: 44 }
        ]
      }
    },
    spawnPoints: [
      { id: 'sp_1', name: 'VÁLVULA NORESTE', pathId: 'path_main', color: 0x43e97b }
    ],
    exitPoints: [
      { id: 'exit_1', name: 'DRENAJE SUROESTE', pathId: 'path_main', color: 0xff3b16 }
    ]
  },

  easy_horseshoe: {
    id: 'easy_horseshoe',
    difficulty: 'facil',
    get name() { return _t('map.easy_horseshoe.name', 'Paso de la Herradura'); },
    get badge() { return _t('map.easy_horseshoe.badge', 'FÁCIL // HERRADURA'); },
    get desc() { return _t('map.easy_horseshoe.desc', 'Un bucle perimetral en "U" con un largo tramo recto central ideal para artillería y morteros pesados.'); },
    entrances: 1,
    exits: 1,
    startingScrap: 10,
    maxLives: 150,
    routes: {
      path_main: {
        id: 'path_main',
        name: 'Gran Herradura',
        color: 0x38f9d7,
        controlPoints: [
          { x: -42, z: -44 },
          { x: -42, z: -14 },
          { x: -42, z: 14 },
          { x: -42, z: 36 },
          { x: -20, z: 42 },
          { x: 0, z: 42 },
          { x: 20, z: 42 },
          { x: 42, z: 36 },
          { x: 42, z: 14 },
          { x: 42, z: -14 },
          { x: 42, z: -41 },
          { x: 14, z: -41 },
          { x: 10, z: -28 },
          { x: 6, z: -10 },
          { x: 0, z: -4 },
          { x: -8, z: 6 },
          { x: -14, z: 20 },
          { x: -14, z: 32 },
          { x: -7, z: 41 },
          { x: 0, z: 44 }
        ]
      }
    },
    spawnPoints: [
      { id: 'sp_1', name: 'CANAL OESTE', pathId: 'path_main', color: 0x38f9d7 }
    ],
    exitPoints: [
      { id: 'exit_1', name: 'ESCLUSA CENTRAL', pathId: 'path_main', color: 0xff3b16 }
    ]
  },

  // ==========================================================================
  // DIFICULTAD NORMAL: 2 Entradas · 1 Salida · 100 Vidas · 10 Chatarra
  // ==========================================================================
  norm_twins: {
    id: 'norm_twins',
    difficulty: 'normal',
    get name() { return _t('map.norm_twins.name', 'Conductos Gemelos'); },
    get badge() { return _t('map.norm_twins.badge', 'NORMAL // CONVERGENTE'); },
    get desc() { return _t('map.norm_twins.desc', 'Dos vías que se acercan en el patio a 7.6m formando un cuello de botella compartido antes de la salida.'); },
    entrances: 2,
    exits: 1,
    startingScrap: 10,
    maxLives: 100,
    routes: {
      path_west: {
        id: 'path_west',
        name: 'Conducto Oeste',
        color: 0xffc107,
        controlPoints: [
          { x: -24, z: -44 },
          { x: -20, z: -36 },
          { x: -14, z: -28 },
          { x: -6, z: -8 },
          { x: -3.8, z: 0 },
          { x: -3.8, z: 12 },
          { x: -6, z: 18 },
          { x: -13, z: 26 },
          { x: -13, z: 35 },
          { x: -7, z: 41 },
          { x: 0, z: 44 }
        ]
      },
      path_east: {
        id: 'path_east',
        name: 'Pasarela Este',
        color: 0xff3366,
        controlPoints: [
          { x: 24, z: -44 },
          { x: 20, z: -36 },
          { x: 12, z: -26 },
          { x: 6, z: -8 },
          { x: 3.8, z: 0 },
          { x: 3.8, z: 12 },
          { x: 6, z: 18 },
          { x: 13, z: 26 },
          { x: 13, z: 35 },
          { x: 7, z: 41 },
          { x: 0, z: 44 }
        ]
      }
    },
    spawnPoints: [
      { id: 'sp_west', name: 'COMPUERTA NOROESTE', pathId: 'path_west', color: 0xffc107 },
      { id: 'sp_east', name: 'COMPUERTA NORESTE', pathId: 'path_east', color: 0xff3366 }
    ],
    exitPoints: [
      { id: 'exit_south', name: 'SALIDA INDUSTRIAL', pathId: 'path_west', color: 0xff3b16 }
    ]
  },

  norm_pincer: {
    id: 'norm_pincer',
    difficulty: 'normal',
    get name() { return _t('map.norm_pincer.name', 'Pinza Industrial'); },
    get badge() { return _t('map.norm_pincer.badge', 'NORMAL // PINZA'); },
    get desc() { return _t('map.norm_pincer.desc', 'Entradas opuestas en los flancos este y oeste que avanzan hacia el centro de la planta en pinza.'); },
    entrances: 2,
    exits: 1,
    startingScrap: 10,
    maxLives: 100,
    routes: {
      path_pincer_l: {
        id: 'path_pincer_l',
        name: 'Flanco Izquierdo',
        color: 0xffa000,
        controlPoints: [
          { x: -44, z: -30 },
          { x: -42, z: -10 },
          { x: -40, z: 10 },
          { x: -34, z: 26 },
          { x: -14, z: 34 },
          { x: -7, z: 41 },
          { x: 0, z: 44 }
        ]
      },
      path_pincer_r: {
        id: 'path_pincer_r',
        name: 'Flanco Derecho',
        color: 0xff4081,
        controlPoints: [
          { x: 44, z: -30 },
          { x: 42, z: -10 },
          { x: 40, z: 10 },
          { x: 34, z: 26 },
          { x: 14, z: 34 },
          { x: 7, z: 41 },
          { x: 0, z: 44 }
        ]
      }
    },
    spawnPoints: [
      { id: 'sp_l', name: 'ALA OESTE', pathId: 'path_pincer_l', color: 0xffa000 },
      { id: 'sp_r', name: 'ALA ESTE', pathId: 'path_pincer_r', color: 0xff4081 }
    ],
    exitPoints: [
      { id: 'exit_s', name: 'ESCLUSA SUR', pathId: 'path_pincer_l', color: 0xff3b16 }
    ]
  },

  norm_cross: {
    id: 'norm_cross',
    difficulty: 'normal',
    get name() { return _t('map.norm_cross.name', 'Pasarelas Dobles'); },
    get badge() { return _t('map.norm_cross.badge', 'NORMAL // ALTURAS'); },
    get desc() { return _t('map.norm_cross.desc', 'Un carril avanza por el suelo y el otro bordea la plataforma elevada este antes de converger al sur.'); },
    entrances: 2,
    exits: 1,
    startingScrap: 10,
    maxLives: 100,
    routes: {
      path_ground: {
        id: 'path_ground',
        name: 'Ruta Inferior',
        color: 0xf59e0b,
        controlPoints: [
          { x: 0, z: -44 },
          { x: 6, z: -38 },
          { x: 12, z: -26 },
          { x: 6, z: -8 },
          { x: 0, z: 4 },
          { x: -10, z: 16 },
          { x: -14, z: 28 },
          { x: -8, z: 38 },
          { x: 0, z: 44 }
        ]
      },
      path_elevated: {
        id: 'path_elevated',
        name: 'Ruta Elevada',
        color: 0xec4899,
        controlPoints: [
          { x: -42, z: -44 },
          { x: -42, z: -14 },
          { x: -42, z: 0 },
          { x: -24, z: 0 },
          { x: -14, z: 0 },
          { x: 0, z: 4 },
          { x: 14, z: 10 },
          { x: 14, z: 28 },
          { x: 14, z: 36 },
          { x: 7, z: 41 },
          { x: 0, z: 44 }
        ]
      }
    },
    spawnPoints: [
      { id: 'sp_g', name: 'TÚNEL NORTE', pathId: 'path_ground', color: 0xf59e0b },
      { id: 'sp_e', name: 'PASARELA ALTA', pathId: 'path_elevated', color: 0xec4899 }
    ],
    exitPoints: [
      { id: 'exit_s', name: 'EVACUACIÓN SUR', pathId: 'path_ground', color: 0xff3b16 }
    ]
  },

  norm_funnel: {
    id: 'norm_funnel',
    difficulty: 'normal',
    get name() { return _t('map.norm_funnel.name', 'Embudo de Desagüe'); },
    get badge() { return _t('map.norm_funnel.badge', 'NORMAL // EMBUDO'); },
    get desc() { return _t('map.norm_funnel.desc', 'Dos rutas serpentean por pasillos de maquinaria hasta encajarse en un angosto embudo defensivo.'); },
    entrances: 2,
    exits: 1,
    startingScrap: 10,
    maxLives: 100,
    routes: {
      path_f1: {
        id: 'path_f1',
        name: 'Canal Norte',
        color: 0xfbbf24,
        controlPoints: [
          { x: -14, z: -44 },
          { x: -14, z: -32 },
          { x: -8, z: -14 },
          { x: -3.8, z: 0 },
          { x: -3.8, z: 14 },
          { x: -12, z: 26 },
          { x: -12, z: 35 },
          { x: -7, z: 41 },
          { x: 0, z: 44 }
        ]
      },
      path_f2: {
        id: 'path_f2',
        name: 'Canal Noreste',
        color: 0xf43f5e,
        controlPoints: [
          { x: 14, z: -44 },
          { x: 14, z: -32 },
          { x: 8, z: -14 },
          { x: 3.8, z: 0 },
          { x: 3.8, z: 14 },
          { x: 12, z: 26 },
          { x: 12, z: 35 },
          { x: 7, z: 41 },
          { x: 0, z: 44 }
        ]
      }
    },
    spawnPoints: [
      { id: 'sp_f1', name: 'REJILLA NORTE', pathId: 'path_f1', color: 0xfbbf24 },
      { id: 'sp_f2', name: 'DUCTO NORESTE', pathId: 'path_f2', color: 0xf43f5e }
    ],
    exitPoints: [
      { id: 'exit_s', name: 'COLECTOR SUR', pathId: 'path_f1', color: 0xff3b16 }
    ]
  },

  norm_braid: {
    id: 'norm_braid',
    difficulty: 'normal',
    get name() { return _t('map.norm_braid.name', 'Vías Trenzadas'); },
    get badge() { return _t('map.norm_braid.badge', 'NORMAL // TRENZADO'); },
    get desc() { return _t('map.norm_braid.desc', 'Dos vías que serpentean en paralelo por el eje Z formando dos zonas de fuego cruzado continuo.'); },
    entrances: 2,
    exits: 1,
    startingScrap: 10,
    maxLives: 100,
    routes: {
      path_b1: {
        id: 'path_b1',
        name: 'Onda Alfa',
        color: 0xd97706,
        controlPoints: [
          { x: -14, z: -44 },
          { x: -14, z: -30 },
          { x: -6, z: -10 },
          { x: 0, z: 2 },
          { x: -8, z: 14 },
          { x: -14, z: 26 },
          { x: -12, z: 35 },
          { x: -7, z: 41 },
          { x: 0, z: 44 }
        ]
      },
      path_b2: {
        id: 'path_b2',
        name: 'Onda Beta',
        color: 0xe11d48,
        controlPoints: [
          { x: 14, z: -44 },
          { x: 14, z: -30 },
          { x: 6, z: -10 },
          { x: 0, z: 2 },
          { x: 8, z: 14 },
          { x: 13, z: 26 },
          { x: 12, z: 35 },
          { x: 7, z: 41 },
          { x: 0, z: 44 }
        ]
      }
    },
    spawnPoints: [
      { id: 'sp_b1', name: 'VENTAJA OESTE', pathId: 'path_b1', color: 0xd97706 },
      { id: 'sp_b2', name: 'VENTAJA ESTE', pathId: 'path_b2', color: 0xe11d48 }
    ],
    exitPoints: [
      { id: 'exit_s', name: 'ESCLUSA FINAL', pathId: 'path_b1', color: 0xff3b16 }
    ]
  },

  norm_pit: {
    id: 'norm_pit',
    difficulty: 'normal',
    get name() { return _t('map.norm_pit.name', 'El Foso Central'); },
    get badge() { return _t('map.norm_pit.badge', 'NORMAL // FOSO'); },
    get desc() { return _t('map.norm_pit.desc', 'Ambos frentes rodean la plaza central formando un anillo perimetral alrededor del bastión de torretas.'); },
    entrances: 2,
    exits: 1,
    startingScrap: 10,
    maxLives: 100,
    routes: {
      path_p1: {
        id: 'path_p1',
        name: 'Flanco Oeste Foso',
        color: 0xf59e0b,
        controlPoints: [
          { x: -42, z: -44 },
          { x: -42, z: -16 },
          { x: -40, z: 10 },
          { x: -34, z: 26 },
          { x: -14, z: 34 },
          { x: -7, z: 41 },
          { x: 0, z: 44 }
        ]
      },
      path_p2: {
        id: 'path_p2',
        name: 'Flanco Este Foso',
        color: 0xf43f5e,
        controlPoints: [
          { x: 42, z: -44 },
          { x: 42, z: -16 },
          { x: 40, z: 10 },
          { x: 34, z: 26 },
          { x: 14, z: 34 },
          { x: 7, z: 41 },
          { x: 0, z: 44 }
        ]
      }
    },
    spawnPoints: [
      { id: 'sp_p1', name: 'PORTAL OESTE', pathId: 'path_p1', color: 0xf59e0b },
      { id: 'sp_p2', name: 'PORTAL ESTE', pathId: 'path_p2', color: 0xf43f5e }
    ],
    exitPoints: [
      { id: 'exit_s', name: 'DRENAJE SUR', pathId: 'path_p1', color: 0xff3b16 }
    ]
  },

  // ==========================================================================
  // DIFICULTAD DIFÍCIL: 2 Entradas · 2 Salidas · 75 Vidas · 10 Chatarra
  // ==========================================================================
  hard_isolated: {
    id: 'hard_isolated',
    difficulty: 'dificil',
    get name() { return _t('map.hard_isolated.name', 'Flancos Aislados'); },
    get badge() { return _t('map.hard_isolated.badge', 'DIFÍCIL // 2 FRENTES'); },
    get desc() { return _t('map.hard_isolated.desc', 'Dos vías independientes en los extremos este y oeste separadas por más de 70 metros sin cruzarse jamás.'); },
    entrances: 2,
    exits: 2,
    startingScrap: 10,
    maxLives: 75,
    routes: {
      path_alpha: {
        id: 'path_alpha',
        name: 'Flanco Oeste (NW-SW)',
        color: 0xff7700,
        controlPoints: [
          { x: -42, z: -44 },
          { x: -43, z: -26 },
          { x: -41, z: -10 },
          { x: -36, z: 4 },
          { x: -36, z: 18 },
          { x: -37, z: 30 },
          { x: -40, z: 38 },
          { x: -42, z: 44 }
        ]
      },
      path_beta: {
        id: 'path_beta',
        name: 'Flanco Este (NE-SE)',
        color: 0xd946ef,
        controlPoints: [
          { x: 42, z: -44 },
          { x: 43, z: -26 },
          { x: 41, z: -10 },
          { x: 36, z: 4 },
          { x: 36, z: 18 },
          { x: 37, z: 30 },
          { x: 40, z: 38 },
          { x: 42, z: 44 }
        ]
      }
    },
    spawnPoints: [
      { id: 'sp_alpha', name: 'COMPUERTA NOROESTE', pathId: 'path_alpha', color: 0xff7700 },
      { id: 'sp_beta', name: 'COMPUERTA NORESTE', pathId: 'path_beta', color: 0xd946ef }
    ],
    exitPoints: [
      { id: 'exit_sw', name: 'BRECHA SUROESTE', pathId: 'path_alpha', color: 0xff3b16 },
      { id: 'exit_se', name: 'BRECHA SURESTE', pathId: 'path_beta', color: 0xff3b16 }
    ]
  },

  hard_diagonal: {
    id: 'hard_diagonal',
    difficulty: 'dificil',
    get name() { return _t('map.hard_diagonal.name', 'Brecha Diagonal'); },
    get badge() { return _t('map.hard_diagonal.badge', 'DIFÍCIL // DIAGONAL'); },
    get desc() { return _t('map.hard_diagonal.desc', 'Ruta 1 cruza de Noroeste a Sureste; Ruta 2 cruza de Noreste a Suroeste en dos corredores aislados.'); },
    entrances: 2,
    exits: 2,
    startingScrap: 10,
    maxLives: 75,
    routes: {
      path_diag1: {
        id: 'path_diag1',
        name: 'Traza NW-SE',
        color: 0xf97316,
        controlPoints: [
          { x: -42, z: -44 },
          { x: -42, z: -14 },
          { x: -42, z: 14 },
          { x: -36, z: 26 },
          { x: -14, z: 36 },
          { x: -14, z: 41 },
          { x: 14, z: 41 },
          { x: 38, z: 44 }
        ]
      },
      path_diag2: {
        id: 'path_diag2',
        name: 'Traza NE-SW',
        color: 0xa855f7,
        controlPoints: [
          { x: 42, z: -44 },
          { x: 42, z: -14 },
          { x: 42, z: 14 },
          { x: 36, z: 26 },
          { x: 14, z: 36 },
          { x: 14, z: 41 },
          { x: -14, z: 41 },
          { x: -38, z: 44 }
        ]
      }
    },
    spawnPoints: [
      { id: 'sp_d1', name: 'ACCESO NOROESTE', pathId: 'path_diag1', color: 0xf97316 },
      { id: 'sp_d2', name: 'ACCESO NORESTE', pathId: 'path_diag2', color: 0xa855f7 }
    ],
    exitPoints: [
      { id: 'exit_se', name: 'ESCLUSA SURESTE', pathId: 'path_diag1', color: 0xff3b16 },
      { id: 'exit_sw', name: 'ESCLUSA SUROESTE', pathId: 'path_diag2', color: 0xff3b16 }
    ]
  },

  hard_express: {
    id: 'hard_express',
    difficulty: 'dificil',
    get name() { return _t('map.hard_express.name', 'Líneas Rápidas'); },
    get badge() { return _t('map.hard_express.badge', 'DIFÍCIL // VELOCIDAD'); },
    get desc() { return _t('map.hard_express.desc', 'Trazados con pocas curvas que bajan a gran velocidad hacia salidas independientes. Ralentización crítica.'); },
    entrances: 2,
    exits: 2,
    startingScrap: 10,
    maxLives: 75,
    routes: {
      path_exp_l: {
        id: 'path_exp_l',
        name: 'Carril Rápido Oeste',
        color: 0xef4444,
        controlPoints: [
          { x: -42, z: -44 },
          { x: -42, z: -18 },
          { x: -42, z: 14 },
          { x: -40, z: 44 }
        ]
      },
      path_exp_r: {
        id: 'path_exp_r',
        name: 'Carril Rápido Este',
        color: 0xc084fc,
        controlPoints: [
          { x: 42, z: -44 },
          { x: 42, z: -18 },
          { x: 42, z: 14 },
          { x: 40, z: 44 }
        ]
      }
    },
    spawnPoints: [
      { id: 'sp_el', name: 'COMPUERTA OESTE', pathId: 'path_exp_l', color: 0xef4444 },
      { id: 'sp_er', name: 'COMPUERTA ESTE', pathId: 'path_exp_r', color: 0xc084fc }
    ],
    exitPoints: [
      { id: 'exit_el', name: 'DESAGÜE OESTE', pathId: 'path_exp_l', color: 0xff3b16 },
      { id: 'exit_er', name: 'DESAGÜE ESTE', pathId: 'path_exp_r', color: 0xff3b16 }
    ]
  },

  hard_split_level: {
    id: 'hard_split_level',
    difficulty: 'dificil',
    get name() { return _t('map.hard_split_level.name', 'División de Alturas'); },
    get badge() { return _t('map.hard_split_level.badge', 'DIFÍCIL // 2 ALTURAS'); },
    get desc() { return _t('map.hard_split_level.desc', 'Un frente corre por el piso industrial inferior mientras el otro transcurre elevado por plataformas.'); },
    entrances: 2,
    exits: 2,
    startingScrap: 10,
    maxLives: 75,
    routes: {
      path_low: {
        id: 'path_low',
        name: 'Conducto Bajo',
        color: 0xff6600,
        controlPoints: [
          { x: -14, z: -44 },
          { x: -14, z: -32 },
          { x: -6, z: -10 },
          { x: -6, z: 10 },
          { x: -14, z: 22 },
          { x: -14, z: 32 },
          { x: -34, z: 44 }
        ]
      },
      path_high: {
        id: 'path_high',
        name: 'Puente Superior',
        color: 0x9333ea,
        controlPoints: [
          { x: 14, z: -44 },
          { x: 14, z: -32 },
          { x: 6, z: -10 },
          { x: 6, z: 10 },
          { x: 14, z: 22 },
          { x: 14, z: 32 },
          { x: 34, z: 44 }
        ]
      }
    },
    spawnPoints: [
      { id: 'sp_low', name: 'ACCESO NIVEL 0', pathId: 'path_low', color: 0xff6600 },
      { id: 'sp_high', name: 'ACCESO NIVEL 1', pathId: 'path_high', color: 0x9333ea }
    ],
    exitPoints: [
      { id: 'exit_low', name: 'BRECHA INFERIOR', pathId: 'path_low', color: 0xff3b16 },
      { id: 'exit_high', name: 'BRECHA ELEVADA', pathId: 'path_high', color: 0xff3b16 }
    ]
  },

  hard_blind_alleys: {
    id: 'hard_blind_alleys',
    difficulty: 'dificil',
    get name() { return _t('map.hard_blind_alleys.name', 'Pasajes Ciegos'); },
    get badge() { return _t('map.hard_blind_alleys.badge', 'DIFÍCIL // OBSTÁCULOS'); },
    get desc() { return _t('map.hard_blind_alleys.desc', 'Curvas cerradas entre densas columnas de cajas que rompen la línea de tiro de torretas.'); },
    entrances: 2,
    exits: 2,
    startingScrap: 10,
    maxLives: 75,
    routes: {
      path_blind_l: {
        id: 'path_blind_l',
        name: 'Pasillo de Cajas O',
        color: 0xe11d48,
        controlPoints: [
          { x: -14, z: -44 },
          { x: -14, z: -41 },
          { x: -42, z: -41 },
          { x: -42, z: -6 },
          { x: -42, z: 28 },
          { x: -14, z: 28 },
          { x: -28, z: 44 }
        ]
      },
      path_blind_r: {
        id: 'path_blind_r',
        name: 'Pasillo de Cajas E',
        color: 0x7c3aed,
        controlPoints: [
          { x: 14, z: -44 },
          { x: 14, z: -41 },
          { x: 42, z: -41 },
          { x: 42, z: -6 },
          { x: 42, z: 20 },
          { x: 14, z: 26 },
          { x: 28, z: 44 }
        ]
      }
    },
    spawnPoints: [
      { id: 'sp_bl', name: 'DUCTO CIEGO OESTE', pathId: 'path_blind_l', color: 0xe11d48 },
      { id: 'sp_br', name: 'DUCTO CIEGO ESTE', pathId: 'path_blind_r', color: 0x7c3aed }
    ],
    exitPoints: [
      { id: 'exit_bl', name: 'ESCLUSA CIEGA O', pathId: 'path_blind_l', color: 0xff3b16 },
      { id: 'exit_br', name: 'ESCLUSA CIEGA E', pathId: 'path_blind_r', color: 0xff3b16 }
    ]
  },

  hard_dual_breach: {
    id: 'hard_dual_breach',
    difficulty: 'dificil',
    get name() { return _t('map.hard_dual_breach.name', 'Doble Brecha Crítica'); },
    get badge() { return _t('map.hard_dual_breach.badge', 'DIFÍCIL // MÁXIMA PRESIÓN'); },
    get desc() { return _t('map.hard_dual_breach.desc', 'Invasión simultánea a través de dos compuertas principales hacia dos esclusas distantes.'); },
    entrances: 2,
    exits: 2,
    startingScrap: 10,
    maxLives: 75,
    routes: {
      path_cr_l: {
        id: 'path_cr_l',
        name: 'Brecha Alfa',
        color: 0xdc2626,
        controlPoints: [
          { x: -14, z: -44 },
          { x: -14, z: -41 },
          { x: -42, z: -41 },
          { x: -42, z: 18 },
          { x: -14, z: 32 },
          { x: -14, z: 44 }
        ]
      },
      path_cr_r: {
        id: 'path_cr_r',
        name: 'Brecha Beta',
        color: 0x9333ea,
        controlPoints: [
          { x: 14, z: -44 },
          { x: 14, z: -41 },
          { x: 42, z: -41 },
          { x: 42, z: 18 },
          { x: 14, z: 32 },
          { x: 14, z: 44 }
        ]
      }
    },
    spawnPoints: [
      { id: 'sp_cr_l', name: 'FALLA COMPUERTA 1', pathId: 'path_cr_l', color: 0xdc2626 },
      { id: 'sp_cr_r', name: 'FALLA COMPUERTA 2', pathId: 'path_cr_r', color: 0x9333ea }
    ],
    exitPoints: [
      { id: 'exit_cr_l', name: 'ESCLUSA ROTA 1', pathId: 'path_cr_l', color: 0xff3b16 },
      { id: 'exit_cr_r', name: 'ESCLUSA ROTA 2', pathId: 'path_cr_r', color: 0xff3b16 }
    ]
  }
};

/**
 * Obtiene la lista de mapas para una dificultad dada.
 * @param {string} diff - 'facil' | 'normal' | 'dificil'
 * @returns {Array} Lista de mapas
 */
export function getMapsByDifficulty(diff = 'normal') {
  return Object.values(MAP_CATALOG).filter(m => m.difficulty === diff);
}

/**
 * Obtiene un mapa por su ID.
 * @param {string} id - ID del mapa
 * @returns {Object|null}
 */
export function getMapById(id) {
  return MAP_CATALOG[id] || null;
}
