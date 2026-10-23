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
    get name() { return _t('map.easy_plaza.name', 'Playa del Faro'); },
    get badge() { return _t('map.easy_plaza.badge', 'FÁCIL // BUCLE DE MAREA'); },
    get desc() { return _t('map.easy_plaza.desc', 'Un paseo entre dunas con un bucle completo junto a la orilla. Los cangrejos rodean la despensa antes de huir.'); },
    entrances: 1,
    exits: 1,
    startingScrap: 10,
    maxLives: 150,
    routes: {
      path_main: {
        id: 'path_main',
        name: 'Senda Principal',
        color: 0x56e0d8,
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
      { id: 'sp_1', name: 'MADRIGUERA NORTE', pathId: 'path_main', color: 0x56e0d8 }
    ],
    exitPoints: [
      { id: 'exit_1', name: 'PASO SUR', pathId: 'path_main', color: 0xff7b5c }
    ]
  },

  easy_spiral: {
    id: 'easy_spiral',
    difficulty: 'facil',
    get name() { return _t('map.easy_spiral.name', 'Giro de la Marea'); },
    get badge() { return _t('map.easy_spiral.badge', 'FÁCIL // ESPIRAL'); },
    get desc() { return _t('map.easy_spiral.desc', 'Dos vueltas concéntricas alrededor de la despensa, meciéndose con la brisa antes de llegar a la orilla.'); },
    entrances: 1,
    exits: 1,
    startingScrap: 10,
    maxLives: 150,
    routes: {
      path_main: {
        id: 'path_main',
        name: 'Arroyo Espiral',
        color: 0x7cdc7a,
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
      { id: 'sp_1', name: 'PASO NOROESTE', pathId: 'path_main', color: 0x7cdc7a }
    ],
    exitPoints: [
      { id: 'exit_1', name: 'CHARCO SURESTE', pathId: 'path_main', color: 0xff7b5c }
    ]
  },

  easy_serpentine: {
    id: 'easy_serpentine',
    difficulty: 'facil',
    get name() { return _t('map.easy_serpentine.name', 'Serpentina de Dunas'); },
    get badge() { return _t('map.easy_serpentine.badge', 'FÁCIL // ZIGZAG'); },
    get desc() { return _t('map.easy_serpentine.desc', 'Un zigzag de arena que cruza las dunas de lado a lado y expone a los cangrejos a disparos cruzados.'); },
    entrances: 1,
    exits: 1,
    startingScrap: 10,
    maxLives: 150,
    routes: {
      path_main: {
        id: 'path_main',
        name: 'Senda Zigzag',
        color: 0x63c7e8,
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
      { id: 'sp_1', name: 'MADRIGUERA OESTE', pathId: 'path_main', color: 0x63c7e8 }
    ],
    exitPoints: [
      { id: 'exit_1', name: 'SALIDA DE LA PLAYA', pathId: 'path_main', color: 0xff7b5c }
    ]
  },

  easy_ramps: {
    id: 'easy_ramps',
    difficulty: 'facil',
    get name() { return _t('map.easy_ramps.name', 'Dunas del Vigía'); },
    get badge() { return _t('map.easy_ramps.badge', 'FÁCIL // ELEVADA'); },
    get desc() { return _t('map.easy_ramps.desc', 'Un sendero que sube por la duna oeste hasta el mirador de madera y baja al campamento entre palmeras.'); },
    entrances: 1,
    exits: 1,
    startingScrap: 10,
    maxLives: 150,
    routes: {
      path_main: {
        id: 'path_main',
        name: 'Pasarela Alta',
        color: 0x6ee0df,
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
      { id: 'sp_1', name: 'DUNA NORTE', pathId: 'path_main', color: 0x6ee0df }
    ],
    exitPoints: [
      { id: 'exit_1', name: 'PASO SUR', pathId: 'path_main', color: 0xff7b5c }
    ]
  },

  easy_cooling: {
    id: 'easy_cooling',
    difficulty: 'facil',
    get name() { return _t('map.easy_cooling.name', 'Charco de Coral'); },
    get badge() { return _t('map.easy_cooling.badge', 'FÁCIL // DOBLE S'); },
    get desc() { return _t('map.easy_cooling.desc', 'Dos giros en forma de S alrededor de charcos de coral y viejas neveras varadas en la arena.'); },
    entrances: 1,
    exits: 1,
    startingScrap: 10,
    maxLives: 150,
    routes: {
      path_main: {
        id: 'path_main',
        name: 'Senda Tanques',
        color: 0x8bdc78,
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
      { id: 'sp_1', name: 'MANANTIAL NORESTE', pathId: 'path_main', color: 0x8bdc78 }
    ],
    exitPoints: [
      { id: 'exit_1', name: 'CHARCO SUROESTE', pathId: 'path_main', color: 0xff7b5c }
    ]
  },

  easy_horseshoe: {
    id: 'easy_horseshoe',
    difficulty: 'facil',
    get name() { return _t('map.easy_horseshoe.name', 'Herradura del Cangrejo'); },
    get badge() { return _t('map.easy_horseshoe.badge', 'FÁCIL // HERRADURA'); },
    get desc() { return _t('map.easy_horseshoe.desc', 'Un gran bucle en U junto a la orilla, con un tramo recto ideal para morteros de arena.'); },
    entrances: 1,
    exits: 1,
    startingScrap: 10,
    maxLives: 150,
    routes: {
      path_main: {
        id: 'path_main',
        name: 'Gran Herradura',
        color: 0x6edbca,
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
      { id: 'sp_1', name: 'ARROYO OESTE', pathId: 'path_main', color: 0x6edbca }
    ],
    exitPoints: [
      { id: 'exit_1', name: 'PASO CENTRAL', pathId: 'path_main', color: 0xff7b5c }
    ]
  },

  // ==========================================================================
  // DIFICULTAD NORMAL: 2 Entradas · 1 Salida · 100 Vidas · 10 Chatarra
  // ==========================================================================
  norm_twins: {
    id: 'norm_twins',
    difficulty: 'normal',
    get name() { return _t('map.norm_twins.name', 'Dos Mareas'); },
    get badge() { return _t('map.norm_twins.badge', 'NORMAL // CONVERGENTE'); },
    get desc() { return _t('map.norm_twins.desc', 'Dos senderos que se acercan entre las dunas y forman un cuello de botella frente a la despensa.'); },
    entrances: 2,
    exits: 1,
    startingScrap: 10,
    maxLives: 100,
    routes: {
      path_west: {
        id: 'path_west',
        name: 'Arroyo Oeste',
        color: 0xffc857,
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
        color: 0xff7b6e,
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
      { id: 'sp_west', name: 'MADRIGUERA NOROESTE', pathId: 'path_west', color: 0xffc857 },
      { id: 'sp_east', name: 'MADRIGUERA NORESTE', pathId: 'path_east', color: 0xff7b6e }
    ],
    exitPoints: [
      { id: 'exit_south', name: 'SALIDA DE LA PLAYA', pathId: 'path_west', color: 0xff7b5c }
    ]
  },

  norm_pincer: {
    id: 'norm_pincer',
    difficulty: 'normal',
    get name() { return _t('map.norm_pincer.name', 'Las Pinzas'); },
    get badge() { return _t('map.norm_pincer.badge', 'NORMAL // PINZA'); },
    get desc() { return _t('map.norm_pincer.desc', 'Dos entradas opuestas avanzan como pinzas hacia el centro de la playa. Defiende ambos flancos.'); },
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
      { id: 'exit_s', name: 'PASO SUR', pathId: 'path_pincer_l', color: 0xff7b5c }
    ]
  },

  norm_cross: {
    id: 'norm_cross',
    difficulty: 'normal',
    get name() { return _t('map.norm_cross.name', 'Pasarelas del Arrecife'); },
    get badge() { return _t('map.norm_cross.badge', 'NORMAL // ALTURAS'); },
    get desc() { return _t('map.norm_cross.desc', 'Un carril serpentea por la arena mientras otro bordea la pasarela elevada hasta juntarse al sur.'); },
    entrances: 2,
    exits: 1,
    startingScrap: 10,
    maxLives: 100,
    routes: {
      path_ground: {
        id: 'path_ground',
        name: 'Ruta Inferior',
        color: 0xffb45a,
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
        color: 0xff8ac0,
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
      { id: 'sp_g', name: 'PASADIZO NORTE', pathId: 'path_ground', color: 0xffb45a },
      { id: 'sp_e', name: 'PASARELA DEL ACANTILADO', pathId: 'path_elevated', color: 0xff8ac0 }
    ],
    exitPoints: [
      { id: 'exit_s', name: 'PASARELA SUR', pathId: 'path_ground', color: 0xff7b5c }
    ]
  },

  norm_funnel: {
    id: 'norm_funnel',
    difficulty: 'normal',
    get name() { return _t('map.norm_funnel.name', 'Embudo de Arena'); },
    get badge() { return _t('map.norm_funnel.badge', 'NORMAL // EMBUDO'); },
    get desc() { return _t('map.norm_funnel.desc', 'Dos rutas se retuercen entre rocas y palmeras antes de encajarse en un embudo defensivo.'); },
    entrances: 2,
    exits: 1,
    startingScrap: 10,
    maxLives: 100,
    routes: {
      path_f1: {
        id: 'path_f1',
        name: 'Arroyo Norte',
        color: 0xffcf6b,
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
        name: 'Arroyo Noreste',
        color: 0xff7a72,
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
      { id: 'sp_f1', name: 'ARENA NORTE', pathId: 'path_f1', color: 0xffcf6b },
      { id: 'sp_f2', name: 'ARROYO NORESTE', pathId: 'path_f2', color: 0xff7a72 }
    ],
    exitPoints: [
      { id: 'exit_s', name: 'ARROYO SUR', pathId: 'path_f1', color: 0xff7b5c }
    ]
  },

  norm_braid: {
    id: 'norm_braid',
    difficulty: 'normal',
    get name() { return _t('map.norm_braid.name', 'Trenza de Espuma'); },
    get badge() { return _t('map.norm_braid.badge', 'NORMAL // TRENZADO'); },
    get desc() { return _t('map.norm_braid.desc', 'Dos senderos paralelos que se cruzan como olas, creando zonas de fuego cruzado.'); },
    entrances: 2,
    exits: 1,
    startingScrap: 10,
    maxLives: 100,
    routes: {
      path_b1: {
        id: 'path_b1',
        name: 'Onda Alfa',
        color: 0xe69a45,
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
        color: 0xff7180,
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
      { id: 'sp_b1', name: 'FLANCO OESTE', pathId: 'path_b1', color: 0xe69a45 },
      { id: 'sp_b2', name: 'FLANCO ESTE', pathId: 'path_b2', color: 0xff7180 }
    ],
    exitPoints: [
      { id: 'exit_s', name: 'PASO FINAL', pathId: 'path_b1', color: 0xff7b5c }
    ]
  },

  norm_pit: {
    id: 'norm_pit',
    difficulty: 'normal',
    get name() { return _t('map.norm_pit.name', 'La Poza Central'); },
    get badge() { return _t('map.norm_pit.badge', 'NORMAL // POZA'); },
    get desc() { return _t('map.norm_pit.desc', 'Los dos frentes rodean una gran poza de marea en el centro del campamento.'); },
    entrances: 2,
    exits: 1,
    startingScrap: 10,
    maxLives: 100,
    routes: {
      path_p1: {
        id: 'path_p1',
        name: 'Flanco Oeste Poza',
        color: 0xffb45a,
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
        name: 'Flanco Este Poza',
        color: 0xff7a72,
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
      { id: 'sp_p1', name: 'MADRIGUERA OESTE', pathId: 'path_p1', color: 0xffb45a },
      { id: 'sp_p2', name: 'MADRIGUERA ESTE', pathId: 'path_p2', color: 0xff7a72 }
    ],
    exitPoints: [
      { id: 'exit_s', name: 'CHARCO SUR', pathId: 'path_p1', color: 0xff7b5c }
    ]
  },

  // ==========================================================================
  // DIFICULTAD DIFÍCIL: 2 Entradas · 2 Salidas · 75 Vidas · 10 Chatarra
  // ==========================================================================
  hard_isolated: {
    id: 'hard_isolated',
    difficulty: 'dificil',
    get name() { return _t('map.hard_isolated.name', 'Islas Separadas'); },
    get badge() { return _t('map.hard_isolated.badge', 'DIFÍCIL // 2 FRENTES'); },
    get desc() { return _t('map.hard_isolated.desc', 'Dos senderos independientes en los extremos de la playa, separados por más de 70 metros de arena.'); },
    entrances: 2,
    exits: 2,
    startingScrap: 10,
    maxLives: 75,
    routes: {
      path_alpha: {
        id: 'path_alpha',
        name: 'Flanco Oeste (NW-SW)',
        color: 0xff9a4d,
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
        color: 0xff8fd0,
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
      { id: 'sp_alpha', name: 'MADRIGUERA NOROESTE', pathId: 'path_alpha', color: 0xff9a4d },
      { id: 'sp_beta', name: 'MADRIGUERA NORESTE', pathId: 'path_beta', color: 0xff8fd0 }
    ],
    exitPoints: [
      { id: 'exit_sw', name: 'BRECHA SUROESTE', pathId: 'path_alpha', color: 0xff7b5c },
      { id: 'exit_se', name: 'BRECHA SURESTE', pathId: 'path_beta', color: 0xff7b5c }
    ]
  },

  hard_diagonal: {
    id: 'hard_diagonal',
    difficulty: 'dificil',
    get name() { return _t('map.hard_diagonal.name', 'Corriente Cruzada'); },
    get badge() { return _t('map.hard_diagonal.badge', 'DIFÍCIL // DIAGONAL'); },
    get desc() { return _t('map.hard_diagonal.desc', 'Dos corrientes de cangrejos se cruzan en diagonal sin compartir tramo defensivo.'); },
    entrances: 2,
    exits: 2,
    startingScrap: 10,
    maxLives: 75,
    routes: {
      path_diag1: {
        id: 'path_diag1',
        name: 'Traza NW-SE',
        color: 0xff9a48,
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
      { id: 'sp_d1', name: 'PASO NOROESTE', pathId: 'path_diag1', color: 0xff9a48 },
      { id: 'sp_d2', name: 'PASO NORESTE', pathId: 'path_diag2', color: 0xa855f7 }
    ],
    exitPoints: [
      { id: 'exit_se', name: 'PASO SURESTE', pathId: 'path_diag1', color: 0xff7b5c },
      { id: 'exit_sw', name: 'PASO SUROESTE', pathId: 'path_diag2', color: 0xff7b5c }
    ]
  },

  hard_express: {
    id: 'hard_express',
    difficulty: 'dificil',
    get name() { return _t('map.hard_express.name', 'Arenas Rápidas'); },
    get badge() { return _t('map.hard_express.badge', 'DIFÍCIL // VELOCIDAD'); },
    get desc() { return _t('map.hard_express.desc', 'Senderos rectos y veloces que llegan al mar por salidas independientes. Ralentizarlos es crítico.'); },
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
      { id: 'sp_el', name: 'MADRIGUERA OESTE', pathId: 'path_exp_l', color: 0xef4444 },
      { id: 'sp_er', name: 'MADRIGUERA ESTE', pathId: 'path_exp_r', color: 0xc084fc }
    ],
    exitPoints: [
      { id: 'exit_el', name: 'CHARCO OESTE', pathId: 'path_exp_l', color: 0xff7b5c },
      { id: 'exit_er', name: 'CHARCO ESTE', pathId: 'path_exp_r', color: 0xff7b5c }
    ]
  },

  hard_split_level: {
    id: 'hard_split_level',
    difficulty: 'dificil',
    get name() { return _t('map.hard_split_level.name', 'Acantilados Gemelos'); },
    get badge() { return _t('map.hard_split_level.badge', 'DIFÍCIL // 2 ALTURAS'); },
    get desc() { return _t('map.hard_split_level.desc', 'Un frente recorre la arena baja y el otro avanza por las pasarelas altas de los acantilados.'); },
    entrances: 2,
    exits: 2,
    startingScrap: 10,
    maxLives: 75,
    routes: {
      path_low: {
        id: 'path_low',
        name: 'Arroyo Bajo',
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
      { id: 'sp_low', name: 'PASO NIVEL 0', pathId: 'path_low', color: 0xff6600 },
      { id: 'sp_high', name: 'PASO NIVEL 1', pathId: 'path_high', color: 0x9333ea }
    ],
    exitPoints: [
      { id: 'exit_low', name: 'BRECHA INFERIOR', pathId: 'path_low', color: 0xff7b5c },
      { id: 'exit_high', name: 'BRECHA ELEVADA', pathId: 'path_high', color: 0xff7b5c }
    ]
  },

  hard_blind_alleys: {
    id: 'hard_blind_alleys',
    difficulty: 'dificil',
    get name() { return _t('map.hard_blind_alleys.name', 'Callejones de Palmeras'); },
    get badge() { return _t('map.hard_blind_alleys.badge', 'DIFÍCIL // OBSTÁCULOS'); },
    get desc() { return _t('map.hard_blind_alleys.desc', 'Curvas cerradas entre palmeras y rocas que rompen la línea de tiro de las torretas.'); },
    entrances: 2,
    exits: 2,
    startingScrap: 10,
    maxLives: 75,
    routes: {
      path_blind_l: {
        id: 'path_blind_l',
        name: 'Pasillo de Cajas O',
        color: 0xff7180,
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
      { id: 'sp_bl', name: 'ARROYO CIEGO OESTE', pathId: 'path_blind_l', color: 0xff7180 },
      { id: 'sp_br', name: 'ARROYO CIEGO ESTE', pathId: 'path_blind_r', color: 0x7c3aed }
    ],
    exitPoints: [
      { id: 'exit_bl', name: 'PASO CIEGO O', pathId: 'path_blind_l', color: 0xff7b5c },
      { id: 'exit_br', name: 'PASO CIEGO E', pathId: 'path_blind_r', color: 0xff7b5c }
    ]
  },

  hard_dual_breach: {
    id: 'hard_dual_breach',
    difficulty: 'dificil',
    get name() { return _t('map.hard_dual_breach.name', 'Doble Robo Crítico'); },
    get badge() { return _t('map.hard_dual_breach.badge', 'DIFÍCIL // MÁXIMA PRESIÓN'); },
    get desc() { return _t('map.hard_dual_breach.desc', 'Dos madrigueras expulsan cangrejos simultáneamente hacia dos pasos de fuga distintos.'); },
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
      { id: 'sp_cr_l', name: 'FALLA MADRIGUERA 1', pathId: 'path_cr_l', color: 0xdc2626 },
      { id: 'sp_cr_r', name: 'FALLA MADRIGUERA 2', pathId: 'path_cr_r', color: 0x9333ea }
    ],
    exitPoints: [
      { id: 'exit_cr_l', name: 'PASO ROTO 1', pathId: 'path_cr_l', color: 0xff7b5c },
      { id: 'exit_cr_r', name: 'PASO ROTO 2', pathId: 'path_cr_r', color: 0xff7b5c }
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
