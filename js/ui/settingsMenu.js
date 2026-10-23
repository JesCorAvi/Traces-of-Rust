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


function setupVideoControls() {
  const resSelect = document.getElementById('set-res-scale');
  if (resSelect) {
    resSelect.value = String(gameSettings.resScale || 0.44);
    resSelect.addEventListener('change', () => {
      gameSettings.resScale = parseFloat(resSelect.value) || 0.44;
      saveGameSettings();
      GameEvents.emit('settings:change', gameSettings);
      AudioSys.playUIClick?.();
    });
  }

  const fovInput = document.getElementById('set-fov');
  const fovVal = document.getElementById('val-fov');
  if (fovInput) {
    fovInput.value = String(gameSettings.fov || 70);
    if (fovVal) fovVal.textContent = fovInput.value + '°';
    const applyFov = () => {
      const val = parseInt(fovInput.value, 10) || 70;
      gameSettings.fov = val;
      if (fovVal) fovVal.textContent = val + '°';
      GameEvents.emit('settings:change', gameSettings);
    };
    fovInput.addEventListener('input', applyFov);
    fovInput.addEventListener('change', () => {
      applyFov();
      saveGameSettings();
      AudioSys.playUIClick?.();
    });
  }

  const shadowsBtn = document.getElementById('btn-toggle-shadows');
  if (shadowsBtn) {
    const updateShadows = () => {
      const active = gameSettings.shadows !== false;
      const text = shadowsBtn.querySelector('span') || shadowsBtn;
      text.textContent = active ? (t('ui.common.enabled') || 'ACTIVADAS') : (t('ui.common.disabled') || 'DESACTIVADAS');
      shadowsBtn.setAttribute('aria-pressed', String(active));
    };
    updateShadows();
    shadowsBtn.addEventListener('click', () => {
      gameSettings.shadows = gameSettings.shadows === false;
      saveGameSettings();
      updateShadows();
      GameEvents.emit('settings:change', gameSettings);
      AudioSys.playUISelect?.();
    });
  }

  const crtBtn = document.getElementById('btn-toggle-crt');
  if (crtBtn) {
    const updateCrt = () => {
      const active = gameSettings.crt !== false;
      const text = crtBtn.querySelector('span') || crtBtn;
      text.textContent = active ? (t('ui.common.enabled') || 'ACTIVADOS') : (t('ui.common.disabled') || 'DESACTIVADOS');
      crtBtn.setAttribute('aria-pressed', String(active));
    };
    updateCrt();
    crtBtn.addEventListener('click', () => {
      gameSettings.crt = gameSettings.crt === false;
      saveGameSettings();
      updateCrt();
      GameEvents.emit('settings:change', gameSettings);
      AudioSys.playUISelect?.();
    });
  }

  const fpsBtn = document.getElementById('btn-toggle-fps');
  if (fpsBtn) {
    const updateFps = () => {
      const active = !!gameSettings.fpsCounter;
      const text = fpsBtn.querySelector('span') || fpsBtn;
      text.textContent = active ? (t('ui.settings.fps_visible') || 'VISIBLE') : (t('ui.settings.fps_hidden') || 'OCULTO');
      fpsBtn.setAttribute('aria-pressed', String(active));
    };
    updateFps();
    fpsBtn.addEventListener('click', () => {
      gameSettings.fpsCounter = !gameSettings.fpsCounter;
      saveGameSettings();
      updateFps();
      GameEvents.emit('settings:change', gameSettings);
      AudioSys.playUISelect?.();
    });
  }
}

function setupControlSettings() {
  const sensInput = document.getElementById('set-sens');
  const sensVal = document.getElementById('val-sens');
  if (sensInput) {
    sensInput.value = String(gameSettings.mouseSens || 100);
    if (sensVal) sensVal.textContent = ((gameSettings.mouseSens || 100) / 100).toFixed(1) + 'x';
    const applySens = () => {
      const val = parseInt(sensInput.value, 10) || 100;
      gameSettings.mouseSens = val;
      if (sensVal) sensVal.textContent = (val / 100).toFixed(1) + 'x';
    };
    sensInput.addEventListener('input', applySens);
    sensInput.addEventListener('change', () => {
      applySens();
      saveGameSettings();
      AudioSys.playUIClick?.();
    });
  }

  const shakeInput = document.getElementById('set-shake');
  const shakeVal = document.getElementById('val-shake');
  if (shakeInput) {
    shakeInput.value = String(gameSettings.camShake ?? 100);
    if (shakeVal) shakeVal.textContent = shakeInput.value + '%';
    const applyShake = () => {
      const val = parseInt(shakeInput.value, 10) ?? 100;
      gameSettings.camShake = val;
      if (shakeVal) shakeVal.textContent = val + '%';
    };
    shakeInput.addEventListener('input', applyShake);
    shakeInput.addEventListener('change', () => {
      applyShake();
      saveGameSettings();
      AudioSys.playUIClick?.();
    });
  }
}

function setupResetControls() {
  const resetBtn = document.getElementById('btn-reset-defaults');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      gameSettings.masterVol = 85;
      gameSettings.sfxVol = 90;
      gameSettings.musicVol = 70;
      gameSettings.ambVol = 80;
      gameSettings.muted = false;
      gameSettings.resScale = 0.44;
      gameSettings.fov = 70;
      gameSettings.shadows = true;
      gameSettings.crt = true;
      gameSettings.fpsCounter = false;
      gameSettings.mouseSens = 100;
      gameSettings.camShake = 100;
      gameSettings.fullscreen = true;
      saveGameSettings();

      try {
        localStorage.removeItem('traces_camera_dist');
      } catch (_) {}

      setupAudioControls();
      setupVideoControls();
      setupControlSettings();
      GameEvents.emit('settings:change', gameSettings);
      GameEvents.emit('settings:reset');
      AudioSys.playUISelect?.();
    });
  }

  const wipeBtn = document.getElementById('btn-wipe-save');
  if (wipeBtn) {
    wipeBtn.addEventListener('click', () => {
      const msg = t('ui.settings.confirm_wipe', '¿Estás seguro de que deseas borrar todo el progreso, dientes y récords? Esta acción no se puede deshacer.');
      if (window.confirm(msg)) {
        try {
          localStorage.removeItem('echoes_rust_save_v1');
          localStorage.removeItem('traces_career_v2');
          localStorage.removeItem('echoes_rust_career_v1');
          localStorage.removeItem('traces_td_map_records');
          localStorage.removeItem('traces_camera_dist');
          localStorage.removeItem('traces_selected_character');
        } catch (_) {}
        window.location.reload();
      }
    });
  }
}

export function setupSettingsUI() {
  if (initialized) return;
  initialized = true;

  setupAudioControls();
  setupLanguageControls();
  setupVideoControls();
  setupControlSettings();
  setupResetControls();

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
