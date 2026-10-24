// Selector de modo y expediente de carrera en el menú principal.
// Exports: renderModeSelectorUI, updateCareerDossierForSelectedMode, setupDefenseDifficultySelector, updateStartPlayButton.

import { AudioSys } from '../audio.js';
import { renderSpriteIconHTML } from '../spritesheets.js';
import { ModeManager } from '../modes/gameModeManager.js';
import { t } from '../core/i18n.js';
import { GameEvents } from '../core/eventBus.js';
import { hasActiveCampaign } from '../core/chiringuitoSave.js';
import { CAMPAIGN } from '../config/chiringuito/seasons.js';

let lastCareerByMode = null;
let lastOnModeChanged = null;

export function updateStartPlayButton(activeId, currentDiff = 'normal') {
  const startBtn = document.getElementById('btn-start');
  const labelEl = document.getElementById('btn-start-label');
  const subEl = document.getElementById('btn-start-sub');
  if (!startBtn || !labelEl) return;

  if (activeId === 'core_defense') {
    startBtn.className = 'rust-btn primary play-hero-btn is-td-mode';
    const active = hasActiveCampaign();
    labelEl.textContent = active ? '[ CONTINUAR CAMPAÑA ]' : '[ ABRIR EL CHIRINGUITO ]';
    if (subEl) {
      subEl.textContent = active
        ? '★ TEMPORADAS DE 15 DÍAS · GUARDADO CONTINUO · CO-OP 2 JUGADORES'
        : '★ NUEVA CAMPAÑA · 3 TEMPORADAS · GRANJA, TORRETAS Y COCINA';
      subEl.style.color = '#8ef77b';
    }
    const newCampaignBtn = document.getElementById('btn-new-chiringuito-campaign');
    if (newCampaignBtn) newCampaignBtn.classList.toggle('hidden', !active);
  } else {
    startBtn.className = 'rust-btn primary play-hero-btn is-survival-mode';
    labelEl.textContent = t('ui.menu.play_surv');
    if (subEl) {
      subEl.textContent = t('ui.mode.arcade_banner');
      subEl.style.color = '#ff9e9e';
    }
  }
}

export function setupDefenseDifficultySelector() {
  const currentDiff = localStorage.getItem('traces_td_difficulty') || 'normal';
  const activeId = ModeManager.getSelectedModeId();
  updateStartPlayButton(activeId, currentDiff);
}

export function renderModeSelectorUI(careerByMode, onModeChanged) {
  lastCareerByMode = careerByMode;
  if (onModeChanged) lastOnModeChanged = onModeChanged;

  const container = document.getElementById('mode-selector-group');
  if (!container) return;

  const activeId = ModeManager.getSelectedModeId();
  container.innerHTML = '';

  const currentDiff = localStorage.getItem('traces_td_difficulty') || 'normal';

  // 1. Tarjeta HERO: TOWER DEFENSE (MODO PRINCIPAL)
  const isTdActive = activeId === 'core_defense';
  const tdCard = document.createElement('div');
  tdCard.className = `mode-card-hero ${isTdActive ? 'is-active-mode' : ''}`;
  tdCard.tabIndex = 0;
  tdCard.setAttribute('role', 'button');
  tdCard.setAttribute('aria-pressed', String(isTdActive));

  tdCard.innerHTML = `
    <div class="mode-capsule-header">
      <span class="mode-capsule-badge badge-primary">${t('ui.mode.badge_primary')}</span>
      <span class="mode-capsule-status">${isTdActive ? t('ui.mode.status_active') : t('ui.mode.status_choose')}</span>
    </div>
    <div class="mode-capsule-body">
      <div class="mode-capsule-icon">${renderSpriteIconHTML('core', 'sm')}</div>
      <div class="mode-capsule-text">
        <div class="mode-capsule-title">CHIRINGUITO DEL ATARDECER</div>
        <div class="mode-capsule-sub">3 TEMPORADAS · MAÑANA DE GRANJA · TARDE DE TORRETAS · NOCHE DE COCINA</div>
      </div>
    </div>
  `;

  tdCard.onclick = () => {
    if (ModeManager.getSelectedModeId() !== 'core_defense') {
      AudioSys.playUISelect();
      ModeManager.selectMode('core_defense');
      renderModeSelectorUI(careerByMode, onModeChanged);
      updateCareerDossierForSelectedMode(careerByMode);
      if (onModeChanged) onModeChanged('core_defense');
    }
  };

  container.appendChild(tdCard);

  // 2. Tarjeta SECUNDARIA: SUPERVIVENCIA (ARCADE)
  const isSurvActive = activeId === 'survival';
  const survCard = document.createElement('div');
  survCard.className = `mode-card-secondary ${isSurvActive ? 'is-active-mode' : ''}`;
  survCard.tabIndex = 0;
  survCard.setAttribute('role', 'button');
  survCard.setAttribute('aria-pressed', String(isSurvActive));

  survCard.innerHTML = `
    <div class="mode-capsule-header">
      <span class="mode-capsule-badge badge-secondary">${t('ui.mode.badge_arcade')}</span>
      <span class="mode-capsule-status">${isSurvActive ? t('ui.mode.status_active') : t('ui.mode.status_choose')}</span>
    </div>
    <div class="mode-capsule-body">
      <div class="mode-capsule-icon">${renderSpriteIconHTML('skull', 'sm')}</div>
      <div class="mode-capsule-text">
        <div class="mode-capsule-title">${t('mode.survival.shortTitle')}</div>
        <div class="mode-capsule-sub">${t('ui.mode.surv_sub')}</div>
      </div>
    </div>
  `;

  survCard.onclick = () => {
    if (ModeManager.getSelectedModeId() !== 'survival') {
      AudioSys.playUISelect();
      ModeManager.selectMode('survival');
      renderModeSelectorUI(careerByMode, onModeChanged);
      updateCareerDossierForSelectedMode(careerByMode);
      if (onModeChanged) onModeChanged('survival');
    }
  };

  container.appendChild(survCard);

  // Actualizar el botón principal de inicio
  updateStartPlayButton(activeId, currentDiff);

  // El tutorial clásico de la despensa ya no aplica al chiringuito.
  const tutBtn = document.getElementById('btn-td-tutorial');
  if (tutBtn) tutBtn.classList.add('hidden');
  const newCampaignBtn = document.getElementById('btn-new-chiringuito-campaign');
  if (newCampaignBtn) {
    newCampaignBtn.classList.toggle('hidden', activeId !== 'core_defense' || !hasActiveCampaign());
  }
}

export function updateCareerDossierForSelectedMode(careerByMode) {
  lastCareerByMode = careerByMode;
  const modeId = ModeManager.getSelectedModeId();
  const data = careerByMode[modeId] || careerByMode.core_defense || careerByMode.survival || {};

  const titleEl = document.getElementById('dossier-mode-label');
  if (titleEl) {
    titleEl.textContent = modeId === 'core_defense' ? 'EXPEDIENTE // CHIRINGUITO DEL ATARDECER' : t('ui.menu.dossier_mode_surv');
  }

  const metricLabelEl = document.getElementById('career-best-metric-label');
  const metricValEl = document.getElementById('career-best-time');

  if (modeId === 'core_defense') {
    if (metricLabelEl) metricLabelEl.textContent = 'MEJOR DÍA DE CAMPAÑA:';
    if (metricValEl) {
      metricValEl.textContent = `${data.bestMetric || 0} / ${CAMPAIGN.daysPerSeason * CAMPAIGN.seasonCount}`;
    }
  } else {
    if (metricLabelEl) metricLabelEl.textContent = t('ui.menu.dossier_metric_surv');
    if (metricValEl) {
      const m = String(Math.floor((data.bestMetric || 0) / 60)).padStart(2, '0');
      const s = String(Math.floor((data.bestMetric || 0) % 60)).padStart(2, '0');
      metricValEl.textContent = `${m}:${s}`;
    }
  }

  const runsEl = document.getElementById('career-runs');
  if (runsEl) runsEl.textContent = data.runs || 0;

  const killsEl = document.getElementById('career-total-kills');
  if (killsEl) killsEl.textContent = data.totalKills || 0;

  const bossesEl = document.getElementById('career-total-bosses');
  if (bossesEl) bossesEl.textContent = data.totalBosses || 0;

  const upgsEl = document.getElementById('career-upgrades-count');
  if (upgsEl) upgsEl.textContent = data.totalUpgradesBought || 0;
}

GameEvents.on('i18n:change', () => {
  if (lastCareerByMode) {
    renderModeSelectorUI(lastCareerByMode, lastOnModeChanged);
    updateCareerDossierForSelectedMode(lastCareerByMode);
  }
});
