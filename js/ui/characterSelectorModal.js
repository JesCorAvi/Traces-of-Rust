// Modal y tarjeta de selección de operador táctico con retratos faciales e iconos de arma.
// Exports: setupCharacterSelectorUI, updateCharacterSelectorCard, openCharacterSelectorModal, closeCharacterSelectorModal, setCoopCharSelectionStatus, onCharacterChange.

import { CHARACTERS, getSelectedCharacterId, setSelectedCharacterId, getCharacterById } from '../config/charactersConfig.js';
import { AudioSys } from '../audio.js';
import { renderSpriteIconHTML, refreshStaticDOMIcons } from '../spritesheets.js';
import { getCharacterPortraitURL } from '../sprites/player/portraits.js';

let modalEl = null;
let cardEl = null;
let characterChangeListeners = [];
let currentOnConfirm = null;
let currentOnClose = null;

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
    wpEl.innerHTML = `${renderSpriteIconHTML(character.weapon, 'sm')} <span>ARMA: <b style="color:#ffffff">${wpTitle}</b></span>`;
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
    titleEl.textContent = options.title || 'MESA DE ASIGNACIÓN // OPERADORES DE PLANTA';
  }

  const subEl = document.getElementById('char-modal-sub');
  if (subEl) {
    subEl.textContent = options.sub || 'Selecciona tu superviviente. Cada operador está especializado en su arma insignia y cuenta con pasivas únicas de impacto y supervivencia:';
  }

  const btnConfirm = document.getElementById('btn-confirm-character');
  if (btnConfirm) {
    btnConfirm.disabled = false;
    const span = btnConfirm.querySelector('span');
    if (span) span.textContent = options.confirmText || '[ ASIGNAR OPERADOR Y CONTINUAR ]';
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
      msgEl.textContent = message || 'El otro jugador aún está seleccionando personaje...';
    }
    if (btnConfirm) {
      btnConfirm.disabled = true;
      const span = btnConfirm.querySelector('span');
      if (span) span.textContent = '[ OPERADOR ASIGNADO // ESPERANDO ]';
    }
  } else if (state === 'peer_ready') {
    if (statusBox) {
      statusBox.classList.remove('hidden');
      statusBox.classList.add('is-ready');
    }
    if (msgEl) {
      msgEl.textContent = message || '¡Compañero listo! Selecciona tu operador para comenzar.';
    }
  } else if (state === 'ready') {
    if (statusBox) {
      statusBox.classList.remove('hidden');
      statusBox.classList.add('is-ready');
    }
    if (msgEl) {
      msgEl.textContent = message || '¡AMBOS OPERADORES LISTOS! INICIANDO DESPLIEGUE...';
    }
    if (btnConfirm) {
      btnConfirm.disabled = true;
      const span = btnConfirm.querySelector('span');
      if (span) span.textContent = '[ ¡DESPLEGANDO! ]';
    }
  } else {
    if (statusBox) statusBox.classList.add('hidden');
    if (btnConfirm) {
      btnConfirm.disabled = false;
      const span = btnConfirm.querySelector('span');
      if (span) span.textContent = '[ ASIGNAR OPERADOR Y CONTINUAR ]';
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
            ${isSelected ? '<span class="char-active-badge">ACTIVO</span>' : ''}
          </div>
          <span class="char-role">// ${char.role.toUpperCase()}</span>
        </div>
      </div>

      <div class="char-card-body">
        <div class="char-weapon-line">
          ${renderSpriteIconHTML(char.weapon, 'sm')}
          <span>ARMA: <b style="color:#ffffff">${(char.weaponTitle || char.weapon).toUpperCase()}</b></span>
        </div>
        <div class="char-passive-box" style="border-left-color:${char.color};">
          <span class="char-passive-title" style="color:${char.color};">★ ${char.passive.toUpperCase()}</span>
          <span class="char-passive-desc">${char.passiveDesc}</span>
        </div>
      </div>

      <button type="button" class="rust-btn sm char-select-btn ${isSelected ? 'primary' : ''}">
        <span>${isSelected ? '[ ASIGNADO ]' : '[ SELECCIONAR ]'}</span>
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

  updateCharacterSelectorCard();
}
