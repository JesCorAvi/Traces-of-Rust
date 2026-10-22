// Pantalla de resultados de partida (victoria/derrota y recompensas).
// Exports: presentRunResultsScreen.
import { CONFIG } from '../config.js';
import { renderSpriteIconHTML, renderSpriteBadgeHTML } from '../spritesheets.js';
import { t } from '../core/i18n.js';
import { GameEvents } from '../core/eventBus.js';

let lastResultsData = null;

function renderResults(data) {
  const {
    outcome,
    stats,
    skills,
    passives,
    kills,
    runSouls,
    totalSouls,
    gameTime
  } = data;

  const modeId = outcome.modeId || 'survival';
  const isVictory = !!outcome.victory;

  const tapeLabelEl = document.querySelector('#game-over-screen .tape-strip span:last-child');
  const titleEl = document.querySelector('#game-over-screen .buckshot-title');
  const causeEl = document.getElementById('go-cause');

  if (tapeLabelEl) {
    tapeLabelEl.textContent = isVictory
      ? t('ui.results.report_title_victory')
      : (modeId === 'core_defense'
          ? t('ui.results.report_title_td_defeat')
          : t('ui.results.report_title_surv_defeat'));
  }

  if (titleEl) {
    titleEl.textContent = outcome.title || (isVictory ? t('ui.results.victory_headline') : t('ui.results.defeat_headline'));
    titleEl.classList.toggle('dead-title', !isVictory);
  }

  if (causeEl) {
    causeEl.textContent = outcome.cause || t('ui.results.cause_default');
  }

  const m = String(Math.floor(gameTime / 60)).padStart(2, '0');
  const s = String(Math.floor(gameTime % 60)).padStart(2, '0');
  document.getElementById('go-time').textContent = `${m}:${s}`;
  document.getElementById('go-bosses').textContent = `${outcome.bossesDefeated || 0} / ${outcome.totalBosses || 5}`;
  document.getElementById('go-kills').textContent = kills;
  document.getElementById('go-souls').innerHTML = `+${runSouls} ${renderSpriteIconHTML('tooth', 'sm')}`;
  document.getElementById('go-total-souls').innerHTML = `${totalSouls} ${renderSpriteIconHTML('tooth', 'sm')}`;
  document.getElementById('go-level').textContent = t('ui.results.cycle_val', { level: stats.level });

  const endRowLabel = document.getElementById('go-mode-extra-label');
  const endRowVal = document.getElementById('go-endgame');

  if (modeId === 'core_defense') {
    if (endRowLabel) endRowLabel.textContent = t('ui.results.td_status_label');
    if (endRowVal) {
      endRowVal.textContent = t('ui.results.td_status_val', {
        waves: outcome.wavesCompleted || 0,
        totalWaves: outcome.totalWaves || 12,
        coreHp: outcome.coreHpLeft || 0,
        coreMaxHp: outcome.coreMaxHp || 100
      });
      endRowVal.style.color = isVictory ? '#a8c499' : '#ff6b6b';
    }
  } else {
    if (endRowLabel) endRowLabel.textContent = t('ui.results.surv_status_label');
    if (endRowVal) {
      endRowVal.textContent = outcome.isEndgame
        ? t('ui.results.surv_endgame_won')
        : t('ui.results.surv_endgame_lost');
      endRowVal.style.color = '#f5ecd3';
    }
  }

  const wSummary = Object.entries(skills)
    .map(([k, v]) => `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:8px;">${renderSpriteIconHTML(CONFIG.SKILLS[k]?.icon || 'slash', 'sm')} ${CONFIG.SKILLS[k]?.name || k} ${renderSpriteBadgeHTML(v)}</span>`)
    .join('');
  const pSummary = Object.entries(passives)
    .map(([k, v]) => `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:8px;">${renderSpriteIconHTML(CONFIG.PASSIVES[k]?.icon || 'dmg', 'sm')} ${CONFIG.PASSIVES[k]?.name || k} ${renderSpriteBadgeHTML(v)}</span>`)
    .join('');
  document.getElementById('go-loadout').innerHTML =
    `<div style="margin-bottom:6px;"><b>${t('ui.common.weapons')}</b> ${wSummary || t('ui.common.none')}</div><div><b>${t('ui.common.passives')}</b> ${pSummary || t('ui.common.none')}</div>`;
}

GameEvents.on('i18n:change', () => {
  const gameOverScreen = document.getElementById('game-over-screen');
  if (gameOverScreen && !gameOverScreen.classList.contains('hidden') && lastResultsData) {
    renderResults(lastResultsData);
  }
});

export function presentRunResultsScreen(data) {
  lastResultsData = data;
  const {
    outcome,
    kills,
    gameTime,
    careerByMode,
    saveCareerFn
  } = data;

  const modeId = outcome.modeId || 'survival';
  const isVictory = !!outcome.victory;
  const modeCareer = careerByMode[modeId] || careerByMode.survival;

  modeCareer.totalKills = (modeCareer.totalKills || 0) + kills;
  modeCareer.totalBosses = (modeCareer.totalBosses || 0) + (outcome.bossesDefeated || 0);
  if (isVictory) {
    modeCareer.victories = (modeCareer.victories || 0) + 1;
  }

  if (modeId === 'core_defense') {
    const wavesDone = outcome.wavesCompleted || 0;
    if (wavesDone > (modeCareer.bestMetric || 0)) {
      modeCareer.bestMetric = wavesDone;
    }
  } else {
    if (gameTime > (modeCareer.bestMetric || 0)) {
      modeCareer.bestMetric = gameTime;
    }
  }
  saveCareerFn();

  // Efecto visual de apagón/colapso si el Núcleo fue destruido
  const flashEl = document.getElementById('damage-flash');
  if (flashEl && modeId === 'core_defense' && !isVictory) {
    flashEl.style.opacity = '0.92';
    setTimeout(() => { flashEl.style.opacity = '0'; }, 750);
  }

  renderResults(data);

  document.getElementById('hud').classList.add('hidden');
  document.getElementById('game-over-screen').classList.remove('hidden');
}
