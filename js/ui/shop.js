// Tienda permanente (Mesa del Cirujano): compra de mejoras con conchas.
// Exports: renderShopUI.

import { CONFIG } from '../config.js';
import { AudioSys } from '../audio.js';
import { renderSpriteIconHTML } from '../spritesheets.js';
import { t } from '../core/i18n.js';
import { GameEvents } from '../core/eventBus.js';

let lastShopState = null;

export function renderShopUI(save, saveGameFn) {
  lastShopState = { save, saveGameFn };
  const soulsEl = document.getElementById('start-souls');
  if (soulsEl) soulsEl.textContent = save.souls || 0;
  const shopSoulsEl = document.getElementById('shop-souls');
  if (shopSoulsEl) shopSoulsEl.textContent = save.souls || 0;
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
    const lvlStr = t('ui.shop.level_tag', { level: lvl });
    row.innerHTML = `
      <div class="shop-row-left">
        ${renderSpriteIconHTML(item.icon || 'dmg')}
        <div class="shop-row-info">
          <b>${item.name} [${lvlStr}${item.max ? '/' + item.max : ''}]</b>
          <div class="shop-row-sub">${item.desc}</div>
        </div>
      </div>
      <button class="rust-btn sm" ${!canAfford ? 'disabled' : ''}>
        <span>${isMaxed ? t('ui.shop.max') : t('ui.shop.buy', { cost })}</span>
        ${!isMaxed ? renderSpriteIconHTML('tooth', 'sm') : ''}
      </button>
    `;
    const btn = row.querySelector('button');
    btn.onclick = () => {
      if (canAfford) {
        AudioSys.playUISelect();
        AudioSys.playScrapTransfer();
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

GameEvents.on('i18n:change', () => {
  const shopScreen = document.getElementById('shop-screen');
  if (shopScreen && !shopScreen.classList.contains('hidden') && lastShopState) {
    renderShopUI(lastShopState.save, lastShopState.saveGameFn);
  }
});
