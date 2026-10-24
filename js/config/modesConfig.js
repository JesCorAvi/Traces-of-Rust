// Catálogo de modos y configuración del modo Supervivencia.
// Exports: MODES_CONFIG.
// ============================================================================
// CONFIGURACIÓN DE MODOS DE JUEGO Y PARÁMETROS DEL MODO SUPERVIVENCIA
// ============================================================================

import { t } from '../core/i18n.js';
const _t = (k, fb) => (typeof t === 'function' ? t(k) : fb);

export const MODES_CONFIG = {
  DEFAULT_MODE: 'core_defense',
  CAREER_STORAGE_KEY: 'echoes_rust_career_modes_v2',

  // Catálogo para el selector de modo en el menú principal y el registro de modos
  CATALOG: {
    core_defense: {
      id: 'core_defense',
      get title() { return _t('mode.core_defense.title', 'CHIRINGUITO DEL ATARDECER'); },
      get subtitle() { return _t('mode.core_defense.subtitle', 'GRANJA · TORRETAS · COCINA'); },
      get badge() { return _t('mode.core_defense.badge', '★ MODO PRINCIPAL // CAMPAÑA DE TEMPORADAS'); },
      isPrimary: true,
      get shortTitle() { return _t('mode.core_defense.shortTitle', 'CHIRINGUITO'); },
      icon: 'core',
      get tagline() { return _t('mode.core_defense.tagline', 'Recoge ingredientes por la mañana, defiende la despensa con torretas por la tarde y cocina para tus clientes por la noche. Tres temporadas de 15 días en la misma caleta.'); },
      get objectiveTitle() { return _t('mode.core_defense.objectiveTitle', 'TEMPORADA DEL CHIRINGUITO'); },
      get objectiveDefault() { return _t('mode.core_defense.objectiveDefault', 'Sobrevive a 3 temporadas de 15 días: granja, defensa y servicio nocturno.'); }
    },
    survival: {
      id: 'survival',
      get title() { return _t('mode.survival.title', 'MAREA ARCADE'); },
      get subtitle() { return _t('mode.survival.subtitle', 'CANGREJOS INFINITOS'); },
      get badge() { return _t('mode.survival.badge', 'MODO SECUNDARIO // ARCADE'); },
      isPrimary: false,
      get shortTitle() { return _t('mode.survival.shortTitle', 'MAREA'); },
      icon: 'skull',
      get tagline() { return _t('mode.survival.tagline', 'Sobrevive a una marea interminable de cangrejos en la arena y derriba a los cinco jefes de marea.'); },
      get objectiveTitle() { return _t('mode.survival.objectiveTitle', 'OBJETIVO DE MAREA'); },
      get objectiveDefault() { return _t('mode.survival.objectiveDefault', 'Resiste la marea y derrota a los jefes de marea'); }
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

    // Capa de spawns TD sobre la horda base de Supervivencia.
    EXTRA_ENEMY_SPAWNS: [
      { type: 'runner', after: 30, weight: 1.2 },
      { type: 'splitter', after: 60, weight: 0.8 },
      { type: 'hulk', after: 80, weight: 0.6 },
      { type: 'nest', after: 100, weight: 0.5 },
      { type: 'regenerator', after: 120, weight: 0.4 }
    ],
    EXTRA_SPAWN_CHANCE: 0.22,
    ENDGAME_EXTRA_SPAWN_CHANCE: 0.35,

    // Calendario de Bosses (Cada 3 minutos: 180s, 360s, 540s, 720s, 900s)
    BOSS_SCHEDULE: [
      {
        time: 180,
        id: 'boss_butcher',
        get name() { return _t('boss.boss_butcher.name', 'EL CANGREJO CARNICERO'); },
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
        get name() { return _t('boss.boss_siren.name', 'LA REINA DE LAS PINZAS'); },
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
        get name() { return _t('boss.boss_furnace.name', 'EL CANGREJO VOLCÁNICO'); },
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
        get name() { return _t('boss.boss_apostle.name', 'EL CANGREJO PROFETA'); },
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
        get name() { return _t('boss.boss_warden.name', 'EL GUARDIÁN DEL ARRECIFE'); },
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
