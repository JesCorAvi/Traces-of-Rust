// Guardado continuo de la campaña del chiringuito y récords de temporada.
// Una sola ranura, sin rebobinado: solo el Host escribe el snapshot.
// Exports: CHIRINGUITO_SAVE, loadCampaign, hasActiveCampaign, saveCampaign,
// clearCampaign, markCampaignEnded, loadRecords, updateRecords, clearChiringuitoProgress.

import { CAMPAIGN } from '../config/chiringuito/seasons.js';

export const CHIRINGUITO_SAVE = {
  KEY: CAMPAIGN.saveKey,
  RECORDS_KEY: CAMPAIGN.recordsKey,
  VERSION: CAMPAIGN.saveVersion,
  STATUS: Object.freeze({
    ACTIVE: 'active',
    DEFEATED: 'defeated',
    COMPLETED: 'completed'
  })
};

const VALID_PHASES = new Set([
  'MORNING',
  'AFTERNOON_INTRO',
  'AFTERNOON_WAVE_1',
  'INTERMISSION',
  'AFTERNOON_WAVE_2',
  'AFTERNOON_CLEARING',
  'NIGHT_INTRO',
  'NIGHT_ACTIVE',
  'NIGHT_CLOSING',
  'DAY_SUMMARY',
  'SEASON_SUMMARY',
  'SEASON_TRANSITION',
  'COMPLETE',
  'DEFEAT'
]);

function safeParse(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

function isValidSnapshot(data) {
  if (!data || typeof data !== 'object') return false;
  if (data.version !== CHIRINGUITO_SAVE.VERSION) return false;
  const campaign = data.campaign;
  if (!campaign || typeof campaign !== 'object') return false;
  if (!Number.isFinite(campaign.seasonIndex) || campaign.seasonIndex < 0 || campaign.seasonIndex >= CAMPAIGN.seasonCount) return false;
  if (!Number.isFinite(campaign.day) || campaign.day < 1 || campaign.day > CAMPAIGN.daysPerSeason) return false;
  if (!VALID_PHASES.has(campaign.phase)) return false;
  if (!campaign.routeId && !campaign.routeMapId) return false;
  return true;
}

export function loadSnapshot() {
  let raw = null;
  try {
    raw = localStorage.getItem(CHIRINGUITO_SAVE.KEY);
  } catch (err) {
    return null;
  }
  const data = safeParse(raw);
  if (!data) {
    if (raw) clearCampaign();
    return null;
  }
  if (!isValidSnapshot(data)) {
    // Save corrupto o de una versión desconocida: no hay copia anterior.
    clearCampaign();
    return null;
  }
  return data;
}

export function loadCampaign() {
  const data = loadSnapshot();
  if (!data || data.status !== CHIRINGUITO_SAVE.STATUS.ACTIVE) return null;
  return data.campaign;
}

export function hasActiveCampaign() {
  return !!loadCampaign();
}

export function saveCampaign(campaign, options = {}) {
  if (!campaign || typeof campaign !== 'object') return false;
  const status = options.status || CHIRINGUITO_SAVE.STATUS.ACTIVE;
  const snapshot = {
    version: CHIRINGUITO_SAVE.VERSION,
    status,
    savedAt: Date.now(),
    campaign: {
      ...campaign,
      seasonIndex: Math.max(0, Math.min(CAMPAIGN.seasonCount - 1, Math.round(campaign.seasonIndex || 0))),
      day: Math.max(1, Math.min(CAMPAIGN.daysPerSeason, Math.round(campaign.day || 1)))
    }
  };
  try {
    localStorage.setItem(CHIRINGUITO_SAVE.KEY, JSON.stringify(snapshot));
    return true;
  } catch (err) {
    console.warn('[ChiringuitoSave] No se pudo guardar la campaña:', err);
    return false;
  }
}

export function markCampaignEnded(campaign, result = {}) {
  if (!campaign) return false;
  const status = result.victory
    ? CHIRINGUITO_SAVE.STATUS.COMPLETED
    : CHIRINGUITO_SAVE.STATUS.DEFEATED;
  const saved = saveCampaign(campaign, { status });
  updateRecords(campaign, {
    completed: !!result.victory,
    customersServed: result.customersServed || 0,
    pearls: result.pearls || 0
  });
  return saved;
}

export function clearCampaign() {
  try {
    localStorage.removeItem(CHIRINGUITO_SAVE.KEY);
  } catch (err) {}
}

export function getSnapshotStatus() {
  return loadSnapshot()?.status || null;
}

export function getCampaignMeta() {
  const data = loadSnapshot();
  if (!data) return null;
  return {
    status: data.status,
    savedAt: data.savedAt,
    seasonIndex: data.campaign?.seasonIndex ?? 0,
    day: data.campaign?.day ?? 1,
    phase: data.campaign?.phase || 'MORNING',
    routeId: data.campaign?.routeId || data.campaign?.routeMapId || null,
    pearls: data.campaign?.pearls || 0,
    customersServed: data.campaign?.stats?.customersServed || 0
  };
}

const DEFAULT_RECORDS = {
  bestSeasonIndex: 0,
  bestDay: 0,
  bestCustomers: 0,
  bestPearls: 0,
  campaignsPlayed: 0,
  campaignsWon: 0
};

export function loadRecords() {
  let raw = null;
  try {
    raw = localStorage.getItem(CHIRINGUITO_SAVE.RECORDS_KEY);
  } catch (err) {
    return { ...DEFAULT_RECORDS };
  }
  const parsed = safeParse(raw);
  if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_RECORDS };
  return { ...DEFAULT_RECORDS, ...parsed };
}

export function updateRecords(campaign, extra = {}) {
  const records = loadRecords();
  const seasonIndex = Number.isFinite(campaign?.seasonIndex) ? campaign.seasonIndex : 0;
  const day = Number.isFinite(campaign?.day) ? campaign.day : 1;
  const seasonProgress = seasonIndex * CAMPAIGN.daysPerSeason + day;
  const bestProgress = records.bestSeasonIndex * CAMPAIGN.daysPerSeason + records.bestDay;

  if (seasonProgress > bestProgress) {
    records.bestSeasonIndex = seasonIndex;
    records.bestDay = day;
  }
  records.bestCustomers = Math.max(records.bestCustomers || 0, extra.customersServed || campaign?.stats?.customersServed || 0);
  records.bestPearls = Math.max(records.bestPearls || 0, extra.pearls || campaign?.pearls || 0);
  if (extra.completed) records.campaignsWon = (records.campaignsWon || 0) + 1;
  try {
    localStorage.setItem(CHIRINGUITO_SAVE.RECORDS_KEY, JSON.stringify(records));
  } catch (err) {}
  return records;
}

export function clearChiringuitoProgress() {
  try {
    localStorage.removeItem(CHIRINGUITO_SAVE.KEY);
    localStorage.removeItem(CHIRINGUITO_SAVE.RECORDS_KEY);
  } catch (err) {}
}
