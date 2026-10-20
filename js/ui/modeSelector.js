// Selector de modo y expediente de carrera en el menú principal.
// Exports: renderModeSelectorUI, updateCareerDossierForSelectedMode, setupDefenseDifficultySelector, updateStartPlayButton.

import { CONFIG } from '../config.js';
import { AudioSys } from '../audio.js';
import { renderSpriteIconHTML } from '../spritesheets.js';
import { ModeManager } from '../modes/gameModeManager.js';
import { DIFFICULTIES } from '../defense/mapGenerator.js';

export function updateStartPlayButton(activeId, currentDiff = 'normal') {
  const startBtn = document.getElementById('btn-start');
  const labelEl = document.getElementById('btn-start-label');
  const subEl = document.getElementById('btn-start-sub');
  if (!startBtn || !labelEl) return;

  const diffMeta = DIFFICULTIES[currentDiff] || DIFFICULTIES.normal;

  if (activeId === 'core_defense') {
    startBtn.className = 'rust-btn primary play-hero-btn is-td-mode';
    labelEl.textContent = '[ JUGAR : TOWER DEFENSE ]';
    if (subEl) {
      subEl.textContent = `★ CAMPAÑA PRINCIPAL // 12 OLEADAS // DIFICULTAD ${diffMeta.name}`;
      subEl.style.color = '#8ef77b';
    }
  } else {
    startBtn.className = 'rust-btn primary play-hero-btn is-survival-mode';
    labelEl.textContent = '[ JUGAR : SUPERVIVENCIA ]';
    if (subEl) {
      subEl.textContent = 'MODO SECUNDARIO // ACCIÓN RÁPIDA · HORDA INFINITA';
      subEl.style.color = '#ff9e9e';
    }
  }
}

export function setupDefenseDifficultySelector() {
  const container = document.getElementById('td-difficulty-section');
  if (!container) return;

  const descEl = document.getElementById('td-diff-desc');
  const buttons = Array.from(container.querySelectorAll('.diff-btn'));

  function refreshDifficultyUI() {
    const currentDiff = localStorage.getItem('traces_td_difficulty') || 'normal';
    buttons.forEach(btn => {
      const isSelected = btn.dataset.diff === currentDiff;
      btn.classList.toggle('is-active-diff', isSelected);
    });
    if (descEl && DIFFICULTIES[currentDiff]) {
      descEl.textContent = DIFFICULTIES[currentDiff].desc;
    }
    const activeId = ModeManager.getSelectedModeId();
    updateStartPlayButton(activeId, currentDiff);
  }

  buttons.forEach(btn => {
    btn.onclick = () => {
      AudioSys.playUISelect();
      const diff = btn.dataset.diff || 'normal';
      localStorage.setItem('traces_td_difficulty', diff);
      refreshDifficultyUI();
    };
  });

  refreshDifficultyUI();
}

export function renderModeSelectorUI(careerByMode, onModeChanged) {
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
      <span class="mode-capsule-badge badge-primary">★ PRINCIPAL</span>
      <span class="mode-capsule-status">${isTdActive ? '● ACTIVO' : '[ELEGIR]'}</span>
    </div>
    <div class="mode-capsule-body">
      <div class="mode-capsule-icon">${renderSpriteIconHTML('core', 'sm')}</div>
      <div class="mode-capsule-text">
        <div class="mode-capsule-title">TOWER DEFENSE</div>
        <div class="mode-capsule-sub">12 OLEADAS // REACTOR</div>
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
      <span class="mode-capsule-badge badge-secondary">MODO ARCADE</span>
      <span class="mode-capsule-status">${isSurvActive ? '● ACTIVO' : '[ELEGIR]'}</span>
    </div>
    <div class="mode-capsule-body">
      <div class="mode-capsule-icon">${renderSpriteIconHTML('skull', 'sm')}</div>
      <div class="mode-capsule-text">
        <div class="mode-capsule-title">SUPERVIVENCIA</div>
        <div class="mode-capsule-sub">HORDA INFINITA</div>
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

  // Selector de dificultad de TD: lo mostramos cuando TD está activo
  const diffSection = document.getElementById('td-difficulty-section');
  if (diffSection) {
    diffSection.classList.toggle('hidden', activeId !== 'core_defense');
    if (activeId === 'core_defense') {
      setupDefenseDifficultySelector();
    }
  }

  // Actualizar el botón principal de inicio
  updateStartPlayButton(activeId, currentDiff);

  // Actualizar botón de tutorial de TD
  const tutBtn = document.getElementById('btn-td-tutorial');
  if (tutBtn) {
    tutBtn.classList.toggle('hidden', activeId !== 'core_defense');
  }
}

export function updateCareerDossierForSelectedMode(careerByMode) {
  const modeId = ModeManager.getSelectedModeId();
  const data = careerByMode[modeId] || careerByMode.core_defense || careerByMode.survival || {};

  const titleEl = document.getElementById('dossier-mode-label');
  if (titleEl) {
    titleEl.textContent = modeId === 'core_defense'
      ? 'EXPEDIENTE // TOWER DEFENSE (MODO PRINCIPAL)'
      : 'EXPEDIENTE // SUPERVIVENCIA (SECUNDARIO)';
  }

  const metricLabelEl = document.getElementById('career-best-metric-label');
  const metricValEl = document.getElementById('career-best-time');

  if (modeId === 'core_defense') {
    if (metricLabelEl) metricLabelEl.textContent = 'MEJOR OLEADA SUPERADA:';
    if (metricValEl) {
      metricValEl.textContent = `${data.bestMetric || 0} / ${CONFIG.CORE_DEFENSE.WAVES.totalWavesForVictory}`;
    }
  } else {
    if (metricLabelEl) metricLabelEl.textContent = 'MEJOR TIEMPO EN PLANTA:';
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

  const directiveEl = document.getElementById('dossier-directive-box');
  if (directiveEl) {
    if (modeId === 'core_defense') {
      directiveEl.innerHTML = `
        <b>DIRECTIVA TÁCTICA // TOWER DEFENSE:</b>
        Protege el reactor biomecánico frente a 12 oleadas. Despliega torretas en las vías con [ESPACIO] o teclas [1-5]. El reactor tolera fugas limitadas. Cada 3 oleadas se activan eventos especiales de contención.
      `;
    } else {
      directiveEl.innerHTML = `
        <b>DIRECTIVA TÁCTICA // SUPERVIVENCIA ARCADE:</b>
        Modo secundario sin torretas. Recoge suero de enemigos caídos para subir ciclos de implante. Cada 3 minutos emerge un jefe de planta. Sobrevive hasta la purga final.
      `;
    }
  }
}
