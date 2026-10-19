import { CONFIG, MODES_CONFIG } from '../config.js';
import { AudioSys } from '../audio.js';
import { renderSpriteIconHTML, renderSpriteBadgeHTML } from '../spritesheets.js';
import { SHORT_WEAPON_NAMES } from './hudController.js';
import { ModeManager } from '../modes/gameModeManager.js';

// ============================================================================
// GESTIÓN DE MENÚ PRINCIPAL, SELECTOR DE MODO, EXPEDIENTE POR MODO,
// MESA DEL CIRUJANO (TIENDA) Y TARJETAS DE SUBIDA DE NIVEL
// ============================================================================

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

export function renderShopUI(save, saveGameFn) {
  document.getElementById('start-souls').textContent = save.souls || 0;
  document.getElementById('shop-souls').textContent = save.souls || 0;
  const goTotal = document.getElementById('go-total-souls');
  if (goTotal) goTotal.innerHTML = `${save.souls || 0} ${renderSpriteIconHTML('tooth', 'sm')}`;

  const list = document.getElementById('shop-list');
  if (!list) return;
  list.innerHTML = '';

  CONFIG.SHOP.forEach(item => {
    const lvl = save[item.id] || 0;
    const isMaxed = item.max && lvl >= item.max;
    const cost = Math.floor(item.cost * Math.pow(1.45, lvl));
    const canAfford = (save.souls || 0) >= cost && !isMaxed;

    const row = document.createElement('div');
    row.className = 'shop-row';
    row.innerHTML = `
      <div class="shop-row-left">
        ${renderSpriteIconHTML(item.icon || 'dmg')}
        <div class="shop-row-info">
          <b>${item.name} [NV. ${lvl}${item.max ? '/' + item.max : ''}]</b>
          <div class="shop-row-sub">${item.desc}</div>
        </div>
      </div>
      <button class="rust-btn sm" ${!canAfford ? 'disabled' : ''}>
        <span>${isMaxed ? 'MÁXIMO' : `COMPRAR (${cost})`}</span>
        ${!isMaxed ? renderSpriteIconHTML('tooth', 'sm') : ''}
      </button>
    `;
    const btn = row.querySelector('button');
    btn.onmouseenter = () => AudioSys.playUIClick();
    btn.onclick = () => {
      if (canAfford) {
        AudioSys.playUISelect();
        save.souls -= cost;
        save[item.id] = lvl + 1;
        saveGameFn();
        renderShopUI(save, saveGameFn);
      } else {
        AudioSys.playUIError();
      }
    };
    list.appendChild(row);
  });
}

function getPassiveAffectedWeaponsHTML(passiveId, skills) {
  const pCfg = CONFIG.PASSIVES[passiveId];
  if (!pCfg) return '';

  if (pCfg.targetType === 'player_stat') {
    return `
      <div class="passive-affected-weapons">
        <span class="passive-affected-label">AFECTA A:</span>
        <div class="passive-weapons-grid cols-1">
          <span class="passive-weapon-pill" title="Mejora directa a las constantes del jugador">${renderSpriteIconHTML('suit', 'sm')} <span>TRAJE / JUGADOR</span></span>
        </div>
      </div>`;
  }

  const equippedIds = Object.keys(skills).filter(k => skills[k] > 0);
  const matching = equippedIds.filter(wId => {
    const wCfg = CONFIG.SKILLS[wId];
    if (!wCfg) return false;
    if (pCfg.targetType === 'multishot_weapons') return wCfg.usesMultishot === true;
    return true;
  });

  if (matching.length === 0) {
    return `
      <div class="passive-affected-weapons">
        <span class="passive-affected-label">ARMAS AFECTADAS:</span>
        <span class="passive-weapon-none">NINGUNA EQUIPADA COMPATIBLE</span>
      </div>`;
  }

  const colClass = `cols-${Math.min(4, matching.length)}`;
  const pills = matching
    .map(wId => {
      const fullName = CONFIG.SKILLS[wId].name;
      const shortName = SHORT_WEAPON_NAMES[wId] || fullName.split(' ')[0];
      return `<span class="passive-weapon-pill" title="${fullName} (Nivel +${skills[wId]})">${renderSpriteIconHTML(CONFIG.SKILLS[wId].icon, 'sm')} <span>${shortName}</span></span>`;
    })
    .join('');

  return `
    <div class="passive-affected-weapons">
      <span class="passive-affected-label">ARMAS AFECTADAS (${matching.length}):</span>
      <div class="passive-weapons-grid ${colClass}">${pills}</div>
    </div>`;
}

export function buildAvailableUpgradePool(skills, passives) {
  const pool = [];
  const weaponsCount = Object.keys(skills).length;
  const passivesCount = Object.keys(passives).length;
  const weaponsFull = weaponsCount >= CONFIG.LIMITS.MAX_WEAPONS;
  const passivesFull = passivesCount >= CONFIG.LIMITS.MAX_PASSIVES;

  Object.keys(CONFIG.SKILLS).forEach(id => {
    const lvl = skills[id] || 0;
    if (lvl >= CONFIG.LIMITS.MAX_LEVEL) return;
    if (weaponsFull && lvl === 0) return;
    const sk = CONFIG.SKILLS[id];
    pool.push({
      category: 'weapon', id, name: sk.name, icon: sk.icon,
      currentLvl: lvl, nextLvl: lvl + 1,
      badge: lvl === 0 ? 'ARMA NUEVA' : 'MEJORA DE ARMA',
      badgeClass: 'badge-weapon', desc: sk.desc
    });
  });

  Object.keys(CONFIG.PASSIVES).forEach(id => {
    const lvl = passives[id] || 0;
    if (lvl >= CONFIG.LIMITS.MAX_LEVEL) return;
    if (passivesFull && lvl === 0) return;
    const p = CONFIG.PASSIVES[id];
    pool.push({
      category: 'passive', id, name: p.name, icon: p.icon,
      currentLvl: lvl, nextLvl: lvl + 1,
      badge: lvl === 0 ? 'PASIVA NUEVA' : 'MEJORA PASIVA',
      badgeClass: 'badge-passive',
      desc: `${p.desc} (${p.format(lvl + 1)})`,
      affectedHtml: getPassiveAffectedWeaponsHTML(id, skills)
    });
  });

  return pool;
}

export function renderLevelUpCardsUI(skills, passives, rerollsLeft, maxRerollsRun, onSelectOption) {
  const box = document.getElementById('upgrade-container');
  box.innerHTML = '';

  const wCount = Object.keys(skills).length;
  const pCount = Object.keys(passives).length;
  document.getElementById('lvlup-slots-info').textContent =
    `ARMAS: ${wCount}/${CONFIG.LIMITS.MAX_WEAPONS} | PASIVAS: ${pCount}/${CONFIG.LIMITS.MAX_PASSIVES}`;

  const pool = buildAvailableUpgradePool(skills, passives);
  let choices = [];

  if (pool.length > 0) {
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    choices = shuffled.slice(0, CONFIG.LIMITS.OPTIONS_PER_LEVEL);
  } else {
    choices = CONFIG.FALLBACK_REWARDS.map(fb => ({
      category: 'fallback', id: fb.id, name: fb.name, icon: fb.icon,
      currentLvl: 8, nextLvl: 8,
      badge: 'SUMINISTRO DE EMERGENCIA', badgeClass: 'badge-fallback', desc: fb.desc
    }));
  }

  choices.forEach((opt, idx) => {
    const card = document.createElement('div');
    card.className = 'upg-card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `${opt.badge}: ${opt.name}`);
    card.title = `[Tecla ${idx + 1}] ${opt.name} — ${opt.desc}`;

    const badgeContent = opt.category === 'fallback'
      ? `<span>SUMINISTRO</span>`
      : (opt.currentLvl === 0
          ? `<span>NUEVO</span> ${renderSpriteBadgeHTML(1)}`
          : `${renderSpriteBadgeHTML(opt.currentLvl)} <span>▸</span> ${renderSpriteBadgeHTML(opt.nextLvl)}`);

    card.innerHTML = `
      <div>
        <span class="upg-type-badge ${opt.badgeClass}">${opt.badge}</span>
        <div class="upg-title-row">
          <span class="upg-title-left">${renderSpriteIconHTML(opt.icon)} <span>${opt.name}</span></span>
          <span class="upg-lvl-pill">${badgeContent}</span>
        </div>
        <p class="upg-desc">${opt.desc}</p>
      </div>
      ${opt.affectedHtml || ''}
    `;
    card.onmouseenter = () => AudioSys.playUIClick();
    card.onclick = () => onSelectOption(card, opt);
    card.onkeydown = e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelectOption(card, opt);
      }
    };
    box.appendChild(card);
  });

  const chargesEl = document.getElementById('reroll-charges');
  if (chargesEl) {
    let cHtml = '';
    for (let i = 0; i < maxRerollsRun; i++) {
      const isAvail = i < rerollsLeft;
      cHtml += `<span>${renderSpriteIconHTML(isAvail ? 'charge_on' : 'charge_off', 'sm')}</span>`;
    }
    chargesEl.innerHTML = cHtml;
  }

  const rerollBtn = document.getElementById('btn-reroll');
  const restLabel = rerollsLeft === 0
    ? '0 RESTANTES · AGOTADO'
    : (rerollsLeft === 1 ? '1 RESTANTE' : `${rerollsLeft} RESTANTES`);

  rerollBtn.innerHTML = `
    ${renderSpriteIconHTML('reroll', 'sm')}
    <span>ACTUALIZAR OPCIONES</span>
    <span class="reroll-count-pill">[<span id="reroll-count">${restLabel}</span>]</span>
  `;
  rerollBtn.disabled = rerollsLeft <= 0 || pool.length <= 1;
}