// Ajustes de pantalla completa: puente nativo de Electron con fallback Web.
// Exports: setupSettingsUI, applyStoredFullscreen, setFullscreen, toggleFullscreen, isFullscreen.

import { gameSettings, saveGameSettings } from '../core/saveState.js';
import { AudioSys } from '../audio.js';
import { t, setLanguage, getLanguage, detectSystemLanguage } from '../core/i18n.js';
import { GameEvents } from '../core/eventBus.js';
import { renderLanguageGrid } from './languageSelector.js';

let initialized = false;
let lastKnownFullscreen = true;
let syncMuteFn = null;
let langController = null;

function updateAutoButtonState(isAuto) {
  const autoBtn = document.getElementById('btn-lang-auto');
  if (autoBtn) {
    autoBtn.classList.toggle('selected', !!isAuto);
    autoBtn.setAttribute('aria-pressed', String(!!isAuto));
  }
}

function setupLanguageControls() {
  const container = document.getElementById('settings-lang-container');
  if (!container) return;

  const isAuto = gameSettings.language === 'auto';
  const activeCode = getLanguage() || 'es';

  langController = renderLanguageGrid(container, {
    currentLang: activeCode,
    showAuto: false,
    idPrefix: 'settings-lang-',
    onSelect: async (code) => {
      gameSettings.language = code;
      saveGameSettings();
      updateAutoButtonState(false);
      await setLanguage(code);
    }
  });

  const autoBtn = document.getElementById('btn-lang-auto');
  if (autoBtn) {
    updateAutoButtonState(isAuto);
    autoBtn.addEventListener('click', async () => {
      AudioSys.playUISelect?.();
      gameSettings.language = 'auto';
      saveGameSettings();
      updateAutoButtonState(true);
      const detected = detectSystemLanguage();
      await setLanguage(detected);
      if (langController) {
        langController.updateCurrent(detected);
      }
    });
  }

  GameEvents.on('i18n:change', (data) => {
    const lang = data?.language || getLanguage();
    if (langController) {
      langController.updateCurrent(lang);
    }
    updateAutoButtonState(gameSettings.language === 'auto');
  });
}

function getElectronBridge() {
  const direct = window.electronWindow;
  if (direct && typeof direct.setFullscreen === 'function') return direct;
  const steam = window.steamOnline;
  if (steam && typeof steam.setFullscreen === 'function') return steam;
  return null;
}

function updateToggleUI(isFullscreen) {
  lastKnownFullscreen = isFullscreen;
  const label = document.getElementById('fullscreen-state-text');
  if (label) label.textContent = isFullscreen ? t('ui.common.fullscreen_on') : t('ui.common.fullscreen_off');
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

const AUDIO_BINDINGS = [
  { key: 'masterVol', input: 'set-master-vol', label: 'val-master-vol', fallback: 85 },
  { key: 'sfxVol', input: 'set-sfx-vol', label: 'val-sfx-vol', fallback: 90 },
  { key: 'musicVol', input: 'set-music-vol', label: 'val-music-vol', fallback: 70 },
  { key: 'ambVol', input: 'set-amb-vol', label: 'val-amb-vol', fallback: 80 }
];

function setupAudioControls() {
  for (const binding of AUDIO_BINDINGS) {
    const input = document.getElementById(binding.input);
    if (!input) continue;
    const label = document.getElementById(binding.label);
    const value = Math.max(0, Math.min(100, Number(gameSettings[binding.key] ?? binding.fallback)));
    gameSettings[binding.key] = value;
    input.value = String(value);
    if (label) label.textContent = `${Math.round(value)}%`;

    const apply = () => {
      const next = Math.max(0, Math.min(100, Math.round(Number(input.value) || 0)));
      gameSettings[binding.key] = next;
      if (label) label.textContent = `${next}%`;
      AudioSys.applyGameSettings(gameSettings);
    };
    input.addEventListener('input', apply);
    input.addEventListener('change', () => {
      apply();
      saveGameSettings();
      AudioSys.playUIClick?.();
    });
  }

  const muteButton = document.getElementById('btn-toggle-mute');
  if (muteButton) {
    const syncMute = () => {
      const muted = !!gameSettings.muted;
      const text = muteButton.querySelector('span') || muteButton;
      text.textContent = muted ? t('ui.common.enabled') : t('ui.common.disabled');
      muteButton.setAttribute('aria-pressed', String(muted));
    };
    syncMuteFn = syncMute;
    muteButton.addEventListener('click', () => {
      gameSettings.muted = !gameSettings.muted;
      saveGameSettings();
      AudioSys.applyGameSettings(gameSettings);
      syncMute();
      AudioSys.playUISelect?.();
    });
    syncMute();
  }

  // Reaplica los valores persistidos al abrir los ajustes.
  AudioSys.applyGameSettings(gameSettings);
}

export function setupSettingsUI() {
  if (initialized) return;
  initialized = true;

  setupAudioControls();
  setupLanguageControls();

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
      langController?.startGamepad?.();
    });
  }

  GameEvents.on('i18n:change', () => {
    updateToggleUI(lastKnownFullscreen);
    if (syncMuteFn) syncMuteFn();
  });

  updateToggleUI(gameSettings.fullscreen !== false);
}
