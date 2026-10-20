// Modal y tarjeta de selección de operador táctico con retratos faciales e iconos de arma.
// Exports: setupCharacterSelectorUI, updateCharacterSelectorCard, openCharacterSelectorModal, closeCharacterSelectorModal, onCharacterChange.

import { CHARACTERS, getSelectedCharacterId, setSelectedCharacterId, getCharacterById } from '../config/charactersConfig.js';
import { AudioSys } from '../audio.js';
import { renderSpriteIconHTML, refreshStaticDOMIcons } from '../spritesheets.js';
import { getCharacterPortraitURL } from '../sprites/player/portraits.js';

let modalEl = null;
let cardEl = null;
let characterChangeListeners = [];

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

export function openCharacterSelectorModal() {
  AudioSys.playUISelect();
  modalEl = document.getElementById('character-modal');
  if (!modalEl) return;

  renderCharacterGrid();
  modalEl.classList.remove('hidden');
}

export function closeCharacterSelectorModal() {
  AudioSys.playUISelect();
  if (modalEl) modalEl.classList.add('hidden');
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
    btnClose.onclick = closeCharacterSelectorModal;
  }

  const btnConfirm = document.getElementById('btn-confirm-character');
  if (btnConfirm) {
    btnConfirm.onclick = closeCharacterSelectorModal;
  }

  updateCharacterSelectorCard();
}
