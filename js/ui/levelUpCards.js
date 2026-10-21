// Cartas de subida de nivel: pool de mejoras y render del selector.
// Exports: renderLevelUpCardsUI.

import { CONFIG } from '../config.js';
import { renderSpriteIconHTML, renderSpriteBadgeHTML } from '../spritesheets.js';
import { SHORT_WEAPON_NAMES } from './hudController.js';

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

function buildAvailableUpgradePool(skills, passives) {
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
