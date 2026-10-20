// Selector de modo y expediente de carrera en el menú principal.
// Exports: renderModeSelectorUI, updateCareerDossierForSelectedMode.

import { CONFIG } from '../config.js';
import { AudioSys } from '../audio.js';
import { renderSpriteIconHTML } from '../spritesheets.js';
import { ModeManager } from '../modes/gameModeManager.js';
import { DIFFICULTIES } from '../defense/mapGenerator.js';

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

  const modes = ModeManager.getAvailableModes();
  const activeId = ModeManager.getSelectedModeId();
  container.innerHTML = '';

  modes.forEach(m => {
    const isSelected = m.id === activeId;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `rust-btn mode-select-btn ${isSelected ? 'primary is-active-mode' : ''}`;
    btn.dataset.modeId = m.id;
    btn.setAttribute('aria-pressed', String(isSelected));

    btn.innerHTML = `
      <div class="mode-btn-top">
        ${renderSpriteIconHTML(m.icon, 'sm')}
        <span class="mode-btn-title">${m.title}</span>
        <span class="mode-btn-check">${isSelected ? '[ACTIVO]' : '[ELEGIR]'}</span>
      </div>
      <div class="mode-btn-desc">${m.tagline}</div>
    `;

    btn.onmouseenter = () => AudioSys.playUIClick();
    btn.onclick = () => {
      AudioSys.playUISelect();
      ModeManager.selectMode(m.id);
      renderModeSelectorUI(careerByMode, onModeChanged);
      updateCareerDossierForSelectedMode(careerByMode);
      if (onModeChanged) onModeChanged(m.id);
    };

    btn.onkeydown = e => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const allBtns = Array.from(container.querySelectorAll('.mode-select-btn'));
        const idx = allBtns.indexOf(btn);
        const next = allBtns[(idx + 1) % allBtns.length];
        if (next) {
          next.focus();
          next.click();
        }
      }
    };

    container.appendChild(btn);
  });

  const diffSection = document.getElementById('td-difficulty-section');
  if (diffSection) {
    diffSection.classList.toggle('hidden', activeId !== 'core_defense');
    if (activeId === 'core_defense') {
      setupDefenseDifficultySelector();
    }
  }
}

export function updateCareerDossierForSelectedMode(careerByMode) {
  const modeId = ModeManager.getSelectedModeId();
  const data = careerByMode[modeId] || careerByMode.survival;

  const titleEl = document.getElementById('dossier-mode-label');
  if (titleEl) {
    titleEl.textContent = modeId === 'core_defense'
      ? 'EXPEDIENTE // DEFENSA NÚCLEO'
      : 'EXPEDIENTE // SUPERVIVENCIA';
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

  document.getElementById('career-runs').textContent = data.runs || 0;
  document.getElementById('career-total-kills').textContent = data.totalKills || 0;
  document.getElementById('career-total-bosses').textContent = data.totalBosses || 0;
  document.getElementById('career-upgrades-count').textContent = data.totalUpgradesBought || 0;
}
