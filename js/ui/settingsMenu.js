// Ajustes de pantalla completa: puente nativo de Electron con fallback Web.
// Exports: setupSettingsUI, applyStoredFullscreen, setFullscreen, toggleFullscreen, isFullscreen.

import { gameSettings, saveGameSettings } from '../core/saveState.js';

let initialized = false;

function getElectronBridge() {
  const direct = window.electronWindow;
  if (direct && typeof direct.setFullscreen === 'function') return direct;
  const steam = window.steamOnline;
  if (steam && typeof steam.setFullscreen === 'function') return steam;
  return null;
}

function updateToggleUI(isFullscreen) {
  const label = document.getElementById('fullscreen-state-text');
  if (label) label.textContent = isFullscreen ? 'ACTIVADA' : 'VENTANA';
  const button = document.getElementById('btn-toggle-fullscreen');
  if (button) button.setAttribute('aria-pressed', String(!!isFullscreen));
}

function persist(isFullscreen) {
  gameSettings.fullscreen = !!isFullscreen;
  saveGameSettings();
  updateToggleUI(!!isFullscreen);
}

export async function isFullscreen() {
  const bridge = getElectronBridge();
  if (bridge?.isFullscreen) {
    try {
      return !!(await bridge.isFullscreen());
    } catch (e) {}
  }
  return !!document.fullscreenElement;
}

export async function setFullscreen(flag) {
  const enabled = !!flag;
  const bridge = getElectronBridge();
  let state = enabled;

  if (bridge?.setFullscreen) {
    try {
      state = !!(await bridge.setFullscreen(enabled));
    } catch (e) {
      state = enabled;
    }
  } else if (enabled) {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    } catch (e) {}
    state = !!document.fullscreenElement;
  } else {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch (e) {}
    state = !!document.fullscreenElement;
  }

  persist(state);
  return state;
}

export async function toggleFullscreen() {
  const bridge = getElectronBridge();
  if (bridge?.toggleFullscreen) {
    try {
      const state = !!(await bridge.toggleFullscreen());
      persist(state);
      return state;
    } catch (e) {}
  }
  // Fallback Web: resolver el estado actual de forma síncrona para no perder
  // la activación de usuario que exige requestFullscreen().
  if (!bridge?.setFullscreen) {
    return setFullscreen(!document.fullscreenElement);
  }
  return setFullscreen(!(await isFullscreen()));
}

// Aplica settings.fullscreen al arrancar. En navegador no se fuerza: la
// Fullscreen API exige gesto de usuario; allí solo se sincroniza la etiqueta.
export async function applyStoredFullscreen() {
  const bridge = getElectronBridge();
  if (!bridge?.setFullscreen) {
    updateToggleUI(!!document.fullscreenElement);
    return;
  }

  const desired = gameSettings.fullscreen !== false;
  const current = await isFullscreen();
  if (current !== desired) {
    await setFullscreen(desired);
  } else {
    updateToggleUI(current);
  }
}

export function setupSettingsUI() {
  if (initialized) return;
  initialized = true;

  const button = document.getElementById('btn-toggle-fullscreen');
  if (button) {
    button.addEventListener('click', () => {
      toggleFullscreen();
    });
  }

  const bridge = getElectronBridge();
  if (bridge?.onFullscreenChanged) {
    try {
      bridge.onFullscreenChanged(isFs => persist(isFs));
    } catch (e) {}
  }

  // Cambios desde la Fullscreen API del navegador (o ESC del fullscreen web).
  document.addEventListener('fullscreenchange', () => {
    persist(!!document.fullscreenElement);
  });

  // Al abrir Ajustes desde el menú o la pausa, refresca el estado real por si
  // el atajo cambió la ventana antes de que este módulo estuviera suscrito.
  for (const id of ['btn-open-settings', 'btn-pause-settings']) {
    document.getElementById(id)?.addEventListener('click', () => {
      isFullscreen().then(updateToggleUI);
    });
  }

  updateToggleUI(gameSettings.fullscreen !== false);
}
