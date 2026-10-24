// Campaña por temporadas, fases del día y generación de asaltos de la tarde.
// Exports: CAMPAIGN, PHASES, PHASE_TIMERS, SEASONS, WAVE_ECONOMY, buildAfternoonWaves, getSeason.

export const CAMPAIGN = {
  seasonCount: 3,
  daysPerSeason: 15,
  wavesPerAfternoon: 2,
  routePools: {
    facil: 'facil',
    normal: 'normal',
    dificil: 'dificil'
  },
  baseRestaurantSeats: 2,
  maxTurrets: 16,
  saveKey: 'traces_chiringuito_campaign_v1',
  recordsKey: 'traces_chiringuito_records_v1',
  saveVersion: 1,
  autosaveIntervalSec: 2.0
};

export const PHASES = Object.freeze({
  MORNING: 'MORNING',
  AFTERNOON_INTRO: 'AFTERNOON_INTRO',
  AFTERNOON_WAVE_1: 'AFTERNOON_WAVE_1',
  INTERMISSION: 'INTERMISSION',
  AFTERNOON_WAVE_2: 'AFTERNOON_WAVE_2',
  AFTERNOON_CLEARING: 'AFTERNOON_CLEARING',
  NIGHT_INTRO: 'NIGHT_INTRO',
  NIGHT_ACTIVE: 'NIGHT_ACTIVE',
  NIGHT_CLOSING: 'NIGHT_CLOSING',
  DAY_SUMMARY: 'DAY_SUMMARY',
  SEASON_SUMMARY: 'SEASON_SUMMARY',
  SEASON_TRANSITION: 'SEASON_TRANSITION',
  COMPLETE: 'COMPLETE',
  DEFEAT: 'DEFEAT'
});

export const PHASE_TIMERS = {
  // La mañana es el único tramo de gestión libre: 5 minutos para cosechar,
  // sembrar, pescar, construir y elegir la carta de la noche.
  morningDurationSec: 300,
  morningWarningSec: 30,
  afternoonIntroSec: 6,
  intermissionSec: 15,
  afternoonClearingSec: 4,
  // El atardecer se disuelve en noche durante este intro, no de golpe.
  nightIntroSec: 9,
  nightDurationSec: 180,
  nightArrivalsUntilSec: 150,
  nightClosingGraceSec: 15,
  seasonTransitionMinSec: 0
};

export const SEASONS = [
  {
    index: 0,
    id: 'season_easy',
    label: 'Temporada I',
    difficulty: 'facil',
    routePool: 'facil',
    pantryMax: 150,
    startingScrap: 20,
    bossId: 'boss_butcher',
    enemyHpBase: 1.0,
    enemyHpPerDay: 0.085,
    enemyDmgBase: 1.0,
    enemyDmgPerDay: 0.035,
    enemySpeedPerDay: 0.008,
    bossHpBase: 1.15,
    bossHpPerDay: 0.09,
    countBase: 8,
    countPerDay: 1.1,
    intervalBase: 1.42,
    intervalPerDay: 0.026,
    composition: {
      early: { zombie: 0.68, worm: 0.32 },
      mid: { zombie: 0.46, worm: 0.24, weeper: 0.08, runner: 0.16, splitter: 0.06 },
      late: { zombie: 0.32, worm: 0.18, weeper: 0.10, runner: 0.16, splitter: 0.10, hulk: 0.08, nest: 0.03, regenerator: 0.03 }
    }
  },
  {
    index: 1,
    id: 'season_normal',
    label: 'Temporada II',
    difficulty: 'normal',
    routePool: 'normal',
    pantryMax: 100,
    startingScrap: 25,
    bossId: 'boss_furnace',
    enemyHpBase: 1.15,
    enemyHpPerDay: 0.10,
    enemyDmgBase: 1.08,
    enemyDmgPerDay: 0.04,
    enemySpeedPerDay: 0.01,
    bossHpBase: 1.35,
    bossHpPerDay: 0.1,
    countBase: 10,
    countPerDay: 1.5,
    intervalBase: 1.28,
    intervalPerDay: 0.028,
    composition: {
      early: { zombie: 0.48, worm: 0.28, runner: 0.16, weeper: 0.08 },
      mid: { zombie: 0.34, worm: 0.20, weeper: 0.12, runner: 0.16, splitter: 0.10, hulk: 0.05, nest: 0.03 },
      late: { zombie: 0.22, worm: 0.16, weeper: 0.14, runner: 0.17, splitter: 0.12, hulk: 0.10, nest: 0.05, regenerator: 0.04 }
    }
  },
  {
    index: 2,
    id: 'season_hard',
    label: 'Temporada III',
    difficulty: 'dificil',
    routePool: 'dificil',
    pantryMax: 75,
    startingScrap: 30,
    bossId: 'boss_warden',
    enemyHpBase: 1.3,
    enemyHpPerDay: 0.11,
    enemyDmgBase: 1.16,
    enemyDmgPerDay: 0.045,
    enemySpeedPerDay: 0.012,
    bossHpBase: 1.55,
    bossHpPerDay: 0.11,
    countBase: 12,
    countPerDay: 1.9,
    intervalBase: 1.15,
    intervalPerDay: 0.03,
    composition: {
      early: { zombie: 0.38, worm: 0.24, runner: 0.20, weeper: 0.12, splitter: 0.06 },
      mid: { zombie: 0.25, worm: 0.18, weeper: 0.15, runner: 0.18, splitter: 0.12, hulk: 0.07, nest: 0.03, regenerator: 0.02 },
      late: { zombie: 0.16, worm: 0.14, weeper: 0.17, runner: 0.18, splitter: 0.12, hulk: 0.11, nest: 0.06, regenerator: 0.06 }
    }
  }
];

export const WAVE_ECONOMY = {
  // La madera se entrega con cuentagotas: cada 3 bajas normales, no en cada
  // una. Así las torretas son una inversión y no una lluvia de material.
  scrapPerKill: 1,
  scrapKillsPerDrop: 3,
  scrapPerEliteKill: 2,
  scrapPerBoss: 15,
  scrapPerWave: 5,
  scrapPerAfternoon: 3,
  crabPerKill: 1,
  crabPerEliteKill: 3,
  crabPerBoss: 15,
  morningPantryHealRatio: 0.10,
  wavePantryHeal: 5
};

function compositionForDay(season, day) {
  if (day <= 5) return season.composition.early;
  if (day <= 10) return season.composition.mid;
  return season.composition.late;
}

function copyComposition(comp) {
  const out = {};
  for (const [key, value] of Object.entries(comp)) {
    if (value > 0) out[key] = value;
  }
  return out;
}

/**
 * Construye las dos oleadas de una tarde. La segunda siempre es más exigente
 * y el día 15 incorpora al jefe de temporada.
 */
export function buildAfternoonWaves(seasonIndex, day) {
  const season = SEASONS[Math.max(0, Math.min(SEASONS.length - 1, seasonIndex))] || SEASONS[0];
  const safeDay = Math.max(1, Math.min(CAMPAIGN.daysPerSeason, Math.round(day || 1)));
  const composition = copyComposition(compositionForDay(season, safeDay));
  const baseCount = season.countBase + safeDay * season.countPerDay;
  const interval = Math.max(0.52, season.intervalBase - safeDay * season.intervalPerDay);
  const hpMult = season.enemyHpBase * (1 + (safeDay - 1) * season.enemyHpPerDay);
  const dmgMult = season.enemyDmgBase * (1 + (safeDay - 1) * season.enemyDmgPerDay);
  const spdMult = 1 + (safeDay - 1) * season.enemySpeedPerDay;
  const bossHpMult = season.bossHpBase * (1 + (safeDay - 1) * season.bossHpPerDay);

  const wave1 = {
    wave: 1,
    count: Math.max(6, Math.round(baseCount)),
    interval,
    composition: { ...composition },
    bossId: null
  };

  const wave2 = {
    wave: 2,
    count: Math.max(8, Math.round(baseCount * 1.35)),
    interval: Math.max(0.46, interval * 0.92),
    composition: { ...composition },
    bossId: safeDay === CAMPAIGN.daysPerSeason ? season.bossId : null
  };

  return {
    seasonIndex: season.index,
    day: safeDay,
    waves: [wave1, wave2],
    scaling: {
      hpMult,
      dmgMult,
      spdMult,
      bossHpMult
    }
  };
}

export function getSeason(index) {
  return SEASONS[Math.max(0, Math.min(SEASONS.length - 1, index))] || SEASONS[0];
}

export function isFinalDay(day) {
  return Math.round(day) >= CAMPAIGN.daysPerSeason;
}
