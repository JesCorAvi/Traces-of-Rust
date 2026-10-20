// Pantalla de resultados de partida (victoria/derrota y recompensas).
// Exports: presentRunResultsScreen.
import { CONFIG } from '../config.js';
import { renderSpriteIconHTML, renderSpriteBadgeHTML } from '../spritesheets.js';

// ============================================================================
// PANTALLA DE RESULTADOS / DERROTA / VICTORIA ADAPTATIVA POR MODO
// ============================================================================

export function presentRunResultsScreen({
  outcome,
  stats,
  skills,
  passives,
  kills,
  runSouls,
  totalSouls,
  gameTime,
  careerByMode,
  saveCareerFn
}) {
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

  const tapeLabelEl = document.querySelector('#game-over-screen .tape-strip span:last-child');
  const titleEl = document.querySelector('#game-over-screen .buckshot-title');
  const causeEl = document.getElementById('go-cause');

  if (tapeLabelEl) {
    tapeLabelEl.textContent = isVictory
      ? 'INFORME DE CONTENCIÓN // OPERACIÓN EXITOSA'
      : (modeId === 'core_defense'
          ? 'BRECHA EN LA CONTENCIÓN // EVACUACIÓN FALLIDA'
          : 'CERTIFICADO DE DEFUNCIÓN // EXPEDIENTE CERRADO');
  }

  if (titleEl) {
    titleEl.textContent = outcome.title || (isVictory ? 'NÚCLEO ASEGURADO' : 'PACIENTE EXPIRADO');
    titleEl.classList.toggle('dead-title', !isVictory);
  }

  if (causeEl) {
    causeEl.textContent = outcome.cause || 'CAUSA: DESMEMBRAMIENTO EN PLANTA INDUSTRIAL';
  }

  const m = String(Math.floor(gameTime / 60)).padStart(2, '0');
  const s = String(Math.floor(gameTime % 60)).padStart(2, '0');
  document.getElementById('go-time').textContent = `${m}:${s}`;
  document.getElementById('go-bosses').textContent = `${outcome.bossesDefeated || 0} / ${outcome.totalBosses || 5}`;
  document.getElementById('go-kills').textContent = kills;
  document.getElementById('go-souls').innerHTML = `+${runSouls} ${renderSpriteIconHTML('tooth', 'sm')}`;
  document.getElementById('go-total-souls').innerHTML = `${totalSouls} ${renderSpriteIconHTML('tooth', 'sm')}`;
  document.getElementById('go-level').textContent = `CICLO ${stats.level}`;

  const endRowLabel = document.getElementById('go-mode-extra-label');
  const endRowVal = document.getElementById('go-endgame');

  if (modeId === 'core_defense') {
    if (endRowLabel) endRowLabel.textContent = 'OLEADAS SUPERADAS / VIDAS RESTANTES:';
    if (endRowVal) {
      endRowVal.textContent = `${outcome.wavesCompleted || 0}/${outcome.totalWaves || 12} OLEADAS · VIDAS: ${outcome.coreHpLeft || 0}/${outcome.coreMaxHp || 100}`;
      endRowVal.style.color = isVictory ? '#a8c499' : '#ff6b6b';
    }
  } else {
    if (endRowLabel) endRowLabel.textContent = 'ESTADO DE FASE FINAL:';
    if (endRowVal) {
      endRowVal.textContent = outcome.isEndgame
        ? 'ALCANZADA (PROTOCOLO 15:00 SUPERADO)'
        : 'CAÍDO ANTES DEL MINUTO 15:00';
      endRowVal.style.color = '#f5ecd3';
    }
  }

  const wSummary = Object.entries(skills)
    .map(([k, v]) => `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:8px;">${renderSpriteIconHTML(CONFIG.SKILLS[k].icon, 'sm')} ${CONFIG.SKILLS[k].name} ${renderSpriteBadgeHTML(v)}</span>`)
    .join('');
  const pSummary = Object.entries(passives)
    .map(([k, v]) => `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:8px;">${renderSpriteIconHTML(CONFIG.PASSIVES[k].icon, 'sm')} ${CONFIG.PASSIVES[k].name} ${renderSpriteBadgeHTML(v)}</span>`)
    .join('');
  document.getElementById('go-loadout').innerHTML =
    `<div style="margin-bottom:6px;"><b>ARMAS:</b> ${wSummary || 'Ninguna'}</div><div><b>PASIVAS:</b> ${pSummary || 'Ninguna'}</div>`;

  document.getElementById('hud').classList.add('hidden');
  document.getElementById('game-over-screen').classList.remove('hidden');
}