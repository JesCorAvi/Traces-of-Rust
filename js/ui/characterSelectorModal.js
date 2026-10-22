// Modal temático de Selección de Operadores tácticos para Traces of Rust.
// Exports: openCharacterSelectorModal, closeCharacterSelectorModal, setupCharacterSelectorUI,
// updateCharacterSelectorCard, onCharacterChange, setCoopCharSelectionStatus.

import {
  CHARACTERS,
  getSelectedCharacterId,
  setSelectedCharacterId,
  getCharacterById
} from '../config/charactersConfig.js';
import { renderSpriteIconHTML, refreshStaticDOMIcons } from '../spritesheets.js';
import { getCharacterPortraitURL } from '../sprites/player/portraits.js';
import { AudioSys } from '../audio.js';
import { t } from '../core/i18n.js';
import { GameEvents } from '../core/eventBus.js';

let modalEl = null;
let cardEl = null;
let currentOnConfirm = null;
let currentOnClose = null;
const characterChangeListeners = [];

export function onCharacterChange(fn) {
  if (typeof fn === 'function') characterChangeListeners.push(fn);
}

export function updateCharacterSelectorCard() {
  const charId = getSelectedCharacterId();
  const character = getCharacterById(charId);
  cardEl = document.getElementById('character-selector-card');
  if (!cardEl || !character) return;

  const avatarBox = cardEl.querySelector('.op-compact-avatar');
  if (avatarBox) {
    avatarBox.innerHTML = `<img src="${getCharacterPortraitURL(character.id)}" alt="${character.title}" width="26" height="26" style="image-rendering:pixelated; display:block;" />`;
    avatarBox.style.borderColor = character.color;
  }

  const nameEl = document.getElementById('op-card-name');
  if (nameEl) {
    nameEl.textContent = character.title;
    nameEl.style.color = character.color;
  }

  const wpEl = document.getElementById('op-card-weapon');
  if (wpEl) {
    const wpTitle = (character.weaponTitle || character.weapon).toUpperCase();
    wpEl.innerHTML = `${renderSpriteIconHTML(character.weapon, 'sm')} <span>${t('ui.char_modal.weapon', { name: wpTitle })}</span>`;
  }

  refreshStaticDOMIcons();
}

export function openCharacterSelectorModal(options = {}) {
  AudioSys.playUISelect();
  modalEl = document.getElementById('character-modal');
  if (!modalEl) return;

  currentOnConfirm = options.onConfirm || null;
  currentOnClose = options.onClose || null;

  const titleEl = document.getElementById('char-modal-title');
  if (titleEl) {
    titleEl.textContent = options.title || t('ui.char_modal.title');
  }

  const subEl = document.getElementById('char-modal-sub');
  if (subEl) {
    subEl.textContent = options.sub || t('ui.char_modal.sub');
  }

  const btnConfirm = document.getElementById('btn-confirm-character');
  if (btnConfirm) {
    btnConfirm.disabled = false;
    const span = btnConfirm.querySelector('span');
    if (span) span.textContent = options.confirmText || t('ui.char_modal.confirm');
  }

  const statusBox = document.getElementById('char-coop-status-box');
  if (statusBox) {
    statusBox.classList.add('hidden');
    statusBox.classList.remove('is-ready');
  }

  renderCharacterGrid();
  modalEl.classList.remove('hidden');
}

export function closeCharacterSelectorModal() {
  AudioSys.playUIClick();
  const el = modalEl || document.getElementById('character-modal');
  if (el) el.classList.add('hidden');
  const cb = currentOnClose;
  currentOnConfirm = null;
  currentOnClose = null;
  if (typeof cb === 'function') {
    cb();
  }
}

export function setCoopCharSelectionStatus(state, message) {
  const statusBox = document.getElementById('char-coop-status-box');
  const msgEl = document.getElementById('char-coop-status-msg');
  const btnConfirm = document.getElementById('btn-confirm-character');

  if (state === 'waiting') {
    if (statusBox) {
      statusBox.classList.remove('hidden');
      statusBox.classList.remove('is-ready');
    }
    if (msgEl) {
      msgEl.textContent = message || t('ui.char_modal.waiting_peer');
    }
    if (btnConfirm) {
      btnConfirm.disabled = true;
      const span = btnConfirm.querySelector('span');
      if (span) span.textContent = t('ui.char_modal.assigned_waiting');
    }
  } else if (state === 'peer_ready') {
    if (statusBox) {
      statusBox.classList.remove('hidden');
      statusBox.classList.add('is-ready');
    }
    if (msgEl) {
      msgEl.textContent = message || t('ui.char_modal.peer_ready');
    }
  } else if (state === 'ready') {
    if (statusBox) {
      statusBox.classList.remove('hidden');
      statusBox.classList.add('is-ready');
    }
    if (msgEl) {
      msgEl.textContent = message || t('ui.char_modal.all_ready');
    }
    if (btnConfirm) {
      btnConfirm.disabled = true;
      const span = btnConfirm.querySelector('span');
      if (span) span.textContent = t('ui.char_modal.deploying');
    }
  } else {
    if (statusBox) statusBox.classList.add('hidden');
    if (btnConfirm) {
      btnConfirm.disabled = false;
      const span = btnConfirm.querySelector('span');
      if (span) span.textContent = t('ui.char_modal.confirm');
    }
  }
}

function renderCharacterGrid() {
  const gridEl = document.getElementById('character-grid');
  if (!gridEl) return;

  const activeId = getSelectedCharacterId();
  gridEl.innerHTML = '';

  Object.values(CHARACTERS).forEach(char => {
    const isSelected = char.id === activeId;
    const card = document.createElement('div');
    card.className = `character-card ${isSelected ? 'is-selected' : ''}`;
    card.style.setProperty('--char-color', char.color);
    card.style.setProperty('--char-accent', char.accentColor);
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-pressed', String(isSelected));

    card.innerHTML = `
      <div class="char-card-top">
        <div class="char-icon-frame" style="border-color:${char.color};">
          <img class="char-portrait-img" src="${getCharacterPortraitURL(char.id)}" alt="${char.title}" width="30" height="30" style="image-rendering:pixelated; display:block;" />
        </div>
        <div class="char-header-titles">
          <div class="char-name-row">
            <span class="char-name" style="color:${char.color};">${char.title}</span>
            ${isSelected ? `<span class="char-active-badge">${t('ui.char_modal.active')}</span>` : ''}
          </div>
          <span class="char-role">// ${char.role.toUpperCase()}</span>
        </div>
      </div>

      <div class="char-card-body">
        <div class="char-weapon-line">
          ${renderSpriteIconHTML(char.weapon, 'sm')}
          <span>${t('ui.char_modal.weapon', { name: (char.weaponTitle || char.weapon).toUpperCase() })}</span>
        </div>
        <div class="char-passive-box" style="border-left-color:${char.color};">
          <span class="char-passive-title" style="color:${char.color};">★ ${char.passive.toUpperCase()}</span>
          <span class="char-passive-desc">${char.passiveDesc}</span>
        </div>
      </div>

      <button type="button" class="rust-btn sm char-select-btn ${isSelected ? 'primary' : ''}">
        <span>${isSelected ? t('ui.char_modal.btn_assigned') : t('ui.char_modal.btn_select')}</span>
      </button>
    `;

    const selectThisChar = () => {
      setSelectedCharacterId(char.id);
      AudioSys.play(360, 0.12, 'square', 0.05);
      renderCharacterGrid();
      updateCharacterSelectorCard();
      characterChangeListeners.forEach(listener => {
        try { listener(char); } catch (e) { console.error(e); }
      });
    };

    card.onclick = selectThisChar;
    card.onkeydown = e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectThisChar();
      }
    };

    gridEl.appendChild(card);
  });

  refreshStaticDOMIcons();
}

export function setupCharacterSelectorUI() {
  cardEl = document.getElementById('character-selector-card');
  if (cardEl) {
    cardEl.onclick = openCharacterSelectorModal;
    cardEl.onkeydown = e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openCharacterSelectorModal();
      }
    };
  }

  const btnClose = document.getElementById('btn-close-characters');
  if (btnClose) {
    btnClose.onclick = (e) => {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      closeCharacterSelectorModal();
    };
  }

  const btnConfirm = document.getElementById('btn-confirm-character');
  if (btnConfirm) {
    btnConfirm.onclick = (e) => {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      AudioSys.playUISelect();
      const charId = getSelectedCharacterId();
      const char = getCharacterById(charId);
      const cb = currentOnConfirm;
      if (typeof cb === 'function') {
        cb(char);
      } else {
        closeCharacterSelectorModal();
      }
    };
  }

  // Tecla Escape para cerrar la mesa de asignación
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('character-modal');
      if (modal && !modal.classList.contains('hidden')) {
        e.preventDefault();
        closeCharacterSelectorModal();
      }
    }
  });

  GameEvents.on('i18n:change', () => {
    updateCharacterSelectorCard();
    const modal = document.getElementById('character-modal');
    if (modal && !modal.classList.contains('hidden')) {
      renderCharacterGrid();
    }
  });

  updateCharacterSelectorCard();
}
