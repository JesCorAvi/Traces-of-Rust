// Selector de idiomas unificado para Traces of Rust.
// Usado en:
//  (A) Pantalla de selección en el primer arranque (#first-boot-lang-screen)
//  (B) Opción "Idioma" en el menú de Ajustes (#settings-screen)
// Soporta ratón, táctil, teclado (flechas/Tab/Enter/Espacio) y mando (D-pad, stick analógico, botón A).

import {
  SUPPORTED_LANGUAGES,
  getLanguage,
  setLanguage,
  detectSystemLanguage,
  t
} from '../core/i18n.js';
import { gameSettings, saveGameSettings } from '../core/saveState.js';
import { AudioSys } from '../audio.js';
import { GameEvents } from '../core/eventBus.js';

export { SUPPORTED_LANGUAGES };

/**
 * Determina si aún no hay idioma seleccionado de forma persistente por el jugador.
 */
export function isFirstBootLanguagePending() {
  return typeof gameSettings.language !== 'string' || !gameSettings.language.trim();
}

/**
 * Renderiza una cuadrícula accesible de idiomas dentro de un contenedor DOM.
 * @param {HTMLElement} container - Contenedor donde se inyectará la cuadrícula.
 * @param {Object} options
 * @param {string} [options.currentLang] - Idioma preseleccionado o activo.
 * @param {Function} [options.onSelect] - Callback async invocado al elegir idioma: (langCode) => Promise<void>|void.
 * @param {boolean} [options.showAuto=false] - Si incluye botón "Automático (Sistema)".
 * @param {string} [options.idPrefix='lang-opt-'] - Prefijo de IDs para accesibilidad.
 * @returns {Object} Controlador con métodos { focusCurrent, destroy, updateCurrent }
 */
export function renderLanguageGrid(container, options = {}) {
  if (!container) return null;

  const {
    currentLang = getLanguage() || 'es',
    onSelect = null,
    showAuto = false,
    idPrefix = 'lang-opt-'
  } = options;

  container.innerHTML = '';
  const gridEl = document.createElement('div');
  gridEl.className = 'lang-grid';
  gridEl.setAttribute('role', 'radiogroup');
  gridEl.setAttribute('aria-label', t('ui.settings.language') || 'Language');

  const list = [...SUPPORTED_LANGUAGES];
  if (showAuto) {
    list.unshift({
      code: 'auto',
      name: 'Automatic',
      nativeName: t('ui.settings.language_auto') || 'Automático (Sistema)',
      flag: 'auto'
    });
  }

  const buttons = [];
  let activeLang = currentLang;

  for (const item of list) {
    const isSelected = item.code === activeLang;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `lang-card-btn ${isSelected ? 'selected' : ''}`;
    btn.id = `${idPrefix}${item.code}`;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', String(isSelected));
    btn.setAttribute('data-lang', item.code);
    btn.tabIndex = isSelected ? 0 : -1;

    // Bandera SVG o icono para modo automático
    const flagWrapper = document.createElement('span');
    flagWrapper.className = 'lang-flag-wrapper';

    if (item.flag === 'auto') {
      const autoIcon = document.createElement('span');
      autoIcon.className = 'ui-icon sm';
      autoIcon.setAttribute('data-ui-icon', 'area');
      flagWrapper.appendChild(autoIcon);
    } else {
      const img = document.createElement('img');
      img.src = `assets/flags/${item.flag}.svg`;
      img.alt = '';
      img.className = 'lang-flag-img';
      img.loading = 'eager';
      img.draggable = false;
      img.width = 38;
      img.height = 28;
      flagWrapper.appendChild(img);
    }

    // Nombre nativo
    const nameSpan = document.createElement('span');
    nameSpan.className = 'lang-native-name';
    nameSpan.textContent = item.nativeName;

    // Check de activo
    const badge = document.createElement('span');
    badge.className = `lang-badge-active ${isSelected ? '' : 'hidden'}`;
    badge.textContent = '✔';

    btn.appendChild(flagWrapper);
    btn.appendChild(nameSpan);
    btn.appendChild(badge);

    // Eventos de ratón / puntero
    btn.addEventListener('mouseenter', () => {
      AudioSys.playUIHover?.();
    });

    btn.addEventListener('click', async (ev) => {
      ev.preventDefault();
      AudioSys.playUISelect?.();
      selectLanguage(item.code);
    });

    gridEl.appendChild(btn);
    buttons.push(btn);
  }

  container.appendChild(gridEl);

  function selectLanguage(code) {
    activeLang = code;
    for (const b of buttons) {
      const match = b.getAttribute('data-lang') === code;
      b.classList.toggle('selected', match);
      b.setAttribute('aria-checked', String(match));
      b.tabIndex = match ? 0 : -1;
      const chk = b.querySelector('.lang-badge-active');
      if (chk) chk.classList.toggle('hidden', !match);
    }
    if (typeof onSelect === 'function') {
      onSelect(code);
    }
  }

  // Navegación por teclado (Flechas y Tab)
  function handleKeyDown(e) {
    const focusedIndex = buttons.indexOf(document.activeElement);
    if (focusedIndex === -1 && !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      return;
    }

    const cols = window.innerWidth <= 440 ? 1 : (window.innerWidth <= 680 ? 2 : 3);
    const total = buttons.length;
    let nextIndex = focusedIndex >= 0 ? focusedIndex : 0;

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        nextIndex = (nextIndex + 1) % total;
        break;
      case 'ArrowLeft':
        e.preventDefault();
        nextIndex = (nextIndex - 1 + total) % total;
        break;
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = (nextIndex + cols) < total ? nextIndex + cols : (nextIndex % cols);
        break;
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = (nextIndex - cols) >= 0 ? nextIndex - cols : (total - 1 - ((total - 1 - nextIndex) % cols));
        if (nextIndex >= total) nextIndex = total - 1;
        break;
      case 'Enter':
      case ' ':
        if (focusedIndex >= 0) {
          e.preventDefault();
          buttons[focusedIndex].click();
        }
        return;
      default:
        return;
    }

    if (buttons[nextIndex]) {
      buttons.forEach(b => { b.tabIndex = -1; });
      buttons[nextIndex].tabIndex = 0;
      buttons[nextIndex].focus();
      AudioSys.playUIHover?.();
    }
  }

  gridEl.addEventListener('keydown', handleKeyDown);

  // Polling de mando (Gamepad API)
  let gamepadPollId = null;
  let lastPadAction = 0;
  const PAD_DEBOUNCE_MS = 220;

  function pollGamepad() {
    // Si el contenedor fue desconectado del DOM o está oculto, detener polling
    if (!document.body.contains(container) || container.closest('.hidden')) {
      gamepadPollId = null;
      return;
    }

    const gamepads = typeof navigator.getGamepads === 'function' ? navigator.getGamepads() : [];
    const pad = gamepads && (gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3]);

    if (pad && pad.connected) {
      const now = performance.now();
      if (now - lastPadAction >= PAD_DEBOUNCE_MS) {
        const btnA = pad.buttons[0]?.pressed; // Botón Sur (A en Xbox, X en PlayStation)
        const dpadUp = pad.buttons[12]?.pressed || (pad.axes[1] < -0.5);
        const dpadDown = pad.buttons[13]?.pressed || (pad.axes[1] > 0.5);
        const dpadLeft = pad.buttons[14]?.pressed || (pad.axes[0] < -0.5);
        const dpadRight = pad.buttons[15]?.pressed || (pad.axes[0] > 0.5);

        if (dpadUp || dpadDown || dpadLeft || dpadRight) {
          const focusedIndex = buttons.indexOf(document.activeElement);
          const cols = window.innerWidth <= 440 ? 1 : (window.innerWidth <= 680 ? 2 : 3);
          const total = buttons.length;
          let nextIndex = focusedIndex >= 0 ? focusedIndex : 0;

          if (dpadRight) nextIndex = (nextIndex + 1) % total;
          else if (dpadLeft) nextIndex = (nextIndex - 1 + total) % total;
          else if (dpadDown) nextIndex = (nextIndex + cols) < total ? nextIndex + cols : (nextIndex % cols);
          else if (dpadUp) nextIndex = (nextIndex - cols) >= 0 ? nextIndex - cols : Math.max(0, total - 1);

          if (buttons[nextIndex]) {
            buttons.forEach(b => { b.tabIndex = -1; });
            buttons[nextIndex].tabIndex = 0;
            buttons[nextIndex].focus();
            AudioSys.playUIHover?.();
          }
          lastPadAction = now;
        } else if (btnA) {
          const focusedIndex = buttons.indexOf(document.activeElement);
          if (focusedIndex >= 0) {
            buttons[focusedIndex].click();
          } else {
            const selBtn = buttons.find(b => b.classList.contains('selected')) || buttons[0];
            selBtn?.click();
          }
          lastPadAction = now + 150; // mayor debounce para confirmar
        }
      }
    }

    gamepadPollId = requestAnimationFrame(pollGamepad);
  }

  // Iniciar gamepad loop si el contenedor está visible
  if (!container.closest('.hidden')) {
    gamepadPollId = requestAnimationFrame(pollGamepad);
  }

  return {
    focusCurrent() {
      const target = buttons.find(b => b.getAttribute('data-lang') === activeLang) || buttons[0];
      if (target) {
        buttons.forEach(b => { b.tabIndex = -1; });
        target.tabIndex = 0;
        target.focus();
      }
      if (!gamepadPollId && !container.closest('.hidden')) {
        gamepadPollId = requestAnimationFrame(pollGamepad);
      }
    },
    updateCurrent(code) {
      activeLang = code;
      for (const b of buttons) {
        const match = b.getAttribute('data-lang') === code;
        b.classList.toggle('selected', match);
        b.setAttribute('aria-checked', String(match));
        b.tabIndex = match ? 0 : -1;
        const chk = b.querySelector('.lang-badge-active');
        if (chk) chk.classList.toggle('hidden', !match);
      }
    },
    startGamepad() {
      if (!gamepadPollId) {
        gamepadPollId = requestAnimationFrame(pollGamepad);
      }
    },
    destroy() {
      if (gamepadPollId) {
        cancelAnimationFrame(gamepadPollId);
        gamepadPollId = null;
      }
      gridEl.removeEventListener('keydown', handleKeyDown);
    }
  };
}

let firstBootController = null;

/**
 * Inicializa y presenta la pantalla de selección de idioma en el primer arranque si corresponde.
 * @param {Object} options
 * @param {Function} [options.onComplete] - Invocado cuando el usuario confirma su elección.
 * @returns {Promise<boolean>} true si se mostró y completó la pantalla de primer arranque, false si se omitió.
 */
export function initFirstBootLanguageFlow(options = {}) {
  const screen = document.getElementById('first-boot-lang-screen');
  const container = document.getElementById('first-boot-grid-container');
  if (!screen || !container) return Promise.resolve(false);

  // Si ya hay una preferencia guardada explícita, no se muestra
  if (!isFirstBootLanguagePending()) {
    screen.classList.add('hidden');
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    // Detectar idioma del sistema / navegador del jugador (o fallback inglés)
    const detected = detectSystemLanguage();

    // Mostrar overlay de primer arranque
    screen.classList.remove('hidden');

    firstBootController = renderLanguageGrid(container, {
      currentLang: detected,
      showAuto: false,
      idPrefix: 'boot-lang-',
      onSelect: async (selectedCode) => {
        // Persistir en gameSettings
        gameSettings.language = selectedCode;
        saveGameSettings();

        // Aplicar de inmediato a i18n, fuentes y DOM
        await setLanguage(selectedCode);

        // Ocultar pantalla de primer arranque y liberar controlador
        if (firstBootController) {
          firstBootController.destroy();
          firstBootController = null;
        }
        screen.classList.add('hidden');

        // Notificar finalización
        if (typeof options.onComplete === 'function') {
          options.onComplete(selectedCode);
        }
        resolve(true);
      }
    });

    // Dar foco visible inmediato al botón preseleccionado
    if (firstBootController) {
      setTimeout(() => {
        firstBootController.focusCurrent();
        firstBootController.startGamepad();
      }, 50);
    }
  });
}
