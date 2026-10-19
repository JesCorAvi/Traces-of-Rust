// Persistencia de la carrera por modo (runs, kills, bosses y mejor marca).
// Exports: loadCareerStatsByMode, saveCareerStatsByMode.

import { MODES_CONFIG } from '../config.js';

export function loadCareerStatsByMode() {
  const raw = JSON.parse(localStorage.getItem(MODES_CONFIG.CAREER_STORAGE_KEY) || 'null');
  const legacy = JSON.parse(localStorage.getItem('echoes_rust_career_v1') || 'null');

  const defaultEntry = () => ({
    runs: 0,
    bestMetric: 0, // En survival = segundos sobrevividos; en core_defense = mejor oleada superada
    victories: 0,
    totalKills: 0,
    totalBosses: 0,
    totalUpgradesBought: 0
  });

  if (raw && raw.survival && raw.core_defense) {
    return raw;
  }

  const migrated = {
    survival: defaultEntry(),
    core_defense: defaultEntry()
  };

  if (legacy) {
    migrated.survival.runs = legacy.runs || 0;
    migrated.survival.bestMetric = legacy.totalTimeSec || 0;
    migrated.survival.totalKills = legacy.totalKills || 0;
    migrated.survival.totalBosses = legacy.totalBosses || 0;
    migrated.survival.totalUpgradesBought = legacy.totalUpgradesBought || 0;
  }

  localStorage.setItem(MODES_CONFIG.CAREER_STORAGE_KEY, JSON.stringify(migrated));
  return migrated;
}

export function saveCareerStatsByMode(careerByMode) {
  localStorage.setItem(MODES_CONFIG.CAREER_STORAGE_KEY, JSON.stringify(careerByMode));
}
