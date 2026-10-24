// Laboratorio de debug de minijuegos: sandbox jugable, galería de sprites,
// modelos 3D toon y soundboard. Se abre en minigames-lab.html.
// Exports: none (entry module).

import * as THREE from 'three';
import { AudioSys } from '../../audio.js';
import { AssetFactory } from '../assets/AssetFactory.js';
import { PALETTE, applyPaletteVars } from '../assets/palette.js';
import { MinigameRunner } from '../MinigameRunner.js';
import { SandboxGame } from '../games/sandbox/SandboxGame.js';
import { CookingGame } from '../games/cooking/CookingGame.js';
import { FishingGame } from '../games/fishing/FishingGame.js';
import { HarvestGame } from '../games/harvest/HarvestGame.js';
import { PlantingGame } from '../games/planting/PlantingGame.js';
import { CHIRINGUITO_CONFIG } from '../../config/chiringuitoConfig.js';

applyPaletteVars(document.documentElement);

const $ = id => document.getElementById(id);
const state = {
  runner: null,
  preview: null,
  audioReady: false,
  currentModel: null,
  lastMode: 'sandbox'
};

function escapeText(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

function showError(message) {
  const box = $('lab-error');
  if (!box) return;
  box.classList.remove('hidden');
  box.textContent = `ERROR // ${message}`;
  console.error('[MinigamesLab]', message);
}

window.addEventListener('error', event => {
  showError(`${event.message} @ ${event.filename || 'inline'}:${event.lineno || 0}`);
});
window.addEventListener('unhandledrejection', event => {
  showError(String(event.reason?.message || event.reason || 'Promesa rechazada'));
});

function ensureAudio() {
  if (state.audioReady) return true;
  const ready = AssetFactory.unlockAudio();
  if (ready) {
    AudioSys.isDemoSilent = false;
    AudioSys.applySettings({
      masterVol: 0.85,
      sfxVol: 0.9,
      ambVol: 0.45,
      musicVol: 0.14,
      muted: false
    });
    state.audioReady = true;
    const button = $('lab-audio');
    if (button) button.textContent = 'AUDIO ACTIVO';
    const status = $('lab-audio-status');
    if (status) status.textContent = 'SÍ';
  }
  return ready;
}

function renderSprites() {
  const host = $('lab-sprites');
  if (!host) return;
  host.innerHTML = '';
  const ids = AssetFactory.listSprites().filter(id => id !== 'missing');
  for (const id of ids) {
    const tile = document.createElement('div');
    tile.className = 'mg-lab-tile';
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);
    const sprite = AssetFactory.getSprite(id);
    if (sprite) {
      const scale = Math.min(58 / sprite.width, 58 / sprite.height);
      sprite.draw(ctx, 64, 64, { scale });
    }
    const label = document.createElement('span');
    label.textContent = spriteLabel(id);
    tile.appendChild(canvas);
    tile.appendChild(label);
    tile.addEventListener('click', () => {
      ensureAudio();
      AudioSys.playUISelect?.();
    });
    host.appendChild(tile);
  }
}

function renderSounds() {
  const host = $('lab-sounds');
  if (!host) return;
  host.innerHTML = '';
  const labels = AssetFactory.listSoundLabels();
  const ids = AssetFactory.listSounds();
  for (const id of ids) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mg-lab-sound';
    const label = document.createElement('b');
    label.textContent = labels[id] || id;
    const code = document.createElement('small');
    code.textContent = id;
    button.appendChild(label);
    button.appendChild(code);
    button.addEventListener('click', () => {
      ensureAudio();
      const played = AssetFactory.playSound(id, { volume: 0.92 });
      button.classList.remove('is-playing');
      void button.offsetWidth;
      if (played) button.classList.add('is-playing');
    });
    host.appendChild(button);
  }
}

function spriteLabel(id) {
  return ({
    carrot: 'ZANAHORIA',
    tomato: 'TOMATE',
    fish: 'PESCADO',
    chili: 'CHILE',
    lime: 'LIMA',
    onion: 'CEBOLLA',
    coconut: 'COCO',
    pineapple: 'PIÑA',
    rice: 'ARROZ',
    knife: 'CUCHILLO',
    pot: 'OLLA',
    pan: 'SARTÉN',
    saltshaker: 'SALERO',
    plate: 'PLATO',
    wateringcan: 'REGADERA',
    shovel: 'PALA',
    seed: 'SEMILLA',
    crate: 'CAJA',
    bobber: 'FLOTADOR',
    star: 'ESTRELLA',
    spark: 'DESTELLO',
    'gesture-drag': 'ARRASTRE',
    'gesture-circle': 'CÍRCULOS',
    'gesture-shake': 'AGITAR',
    'gesture-tap': 'TOQUE',
    'gesture-hold': 'MANTENER',
    'gesture-zigzag': 'ZIGZAG',
    'gesture-rub': 'FROTAR',
    'gesture-flick': 'FLICK'
  })[id] || id.replace(/-/g, ' ').toUpperCase();
}

function modelLabel(id) {
  return ({
    carrot: 'ZANAHORIA',
    knife: 'CUCHILLO',
    pot: 'OLLA',
    pan: 'SARTÉN',
    fishingRod: 'CAÑA DE PESCAR',
    shovel: 'PALA',
    fish: 'PEZ'
  })[id] || id.toUpperCase();
}

class ModelPreview {
  constructor(canvas, statusEl, nameEl) {
    this.canvas = canvas;
    this.statusEl = statusEl;
    this.nameEl = nameEl;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.model = null;
    this.raf = 0;
    this.paused = false;
    this.disposed = false;
    this.lastTime = 0;
    this._resizeObserver = null;
    this._init();
  }

  _init() {
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
      this.camera.position.set(2.7, 2.0, 3.9);
      this.camera.lookAt(0, 0.85, 0);

      const hemi = new THREE.HemisphereLight(0xfff4d6, 0x17343a, 1.55);
      this.scene.add(hemi);
      const key = new THREE.DirectionalLight(0xffd08a, 2.4);
      key.position.set(3.2, 5.2, 2.4);
      key.castShadow = true;
      key.shadow.mapSize.set(512, 512);
      this.scene.add(key);
      const rim = new THREE.DirectionalLight(0x6fd6df, 1.5);
      rim.position.set(-3.4, 2.6, -3.2);
      this.scene.add(rim);

      const ground = new THREE.Mesh(
        new THREE.CircleGeometry(2.35, 48),
        new THREE.MeshToonMaterial({ color: new THREE.Color(PALETTE.paperDark) })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.01;
      ground.receiveShadow = true;
      this.scene.add(ground);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2.08, 0.035, 8, 48),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(PALETTE.mango) })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.005;
      this.scene.add(ring);
      this.ring = ring;

      this._resizeObserver = new ResizeObserver(() => this._resize());
      this._resizeObserver.observe(this.canvas.parentElement || this.canvas);
      this._resize();
      this._animate(0);
      if (this.statusEl) this.statusEl.textContent = 'WEBGL // LISTO';
    } catch (error) {
      if (this.statusEl) this.statusEl.textContent = 'WEBGL // NO DISPONIBLE';
      showError(`No se pudo iniciar el visor 3D: ${error.message}`);
    }
  }

  _resize() {
    if (!this.renderer || !this.camera) return;
    const host = this.canvas.parentElement || this.canvas;
    const width = Math.max(120, host.clientWidth || 320);
    const height = Math.max(120, host.clientHeight || 240);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  setModel(id) {
    if (!this.scene) return;
    if (this.model) {
      this.scene.remove(this.model);
      AssetFactory.releaseModel(this.model);
      this.model = null;
    }
    const model = AssetFactory.getModel(id);
    if (!model) {
      showError(`No existe el modelo 3D "${id}".`);
      return;
    }
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 0.1);
    const scale = 2.05 / maxDim;
    model.scale.setScalar(scale);
    model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
    this.scene.add(model);
    this.model = model;
    if (this.nameEl) this.nameEl.textContent = `${modelLabel(id)} // ${model.children.length} piezas`;
    state.currentModel = id;
  }

  setPaused(paused) {
    this.paused = !!paused;
    this.lastTime = performance.now();
  }

  _animate(time) {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(next => this._animate(next));
    if (!this.renderer || !this.scene || !this.camera) return;
    const dt = Math.min(0.05, Math.max(0, (time - this.lastTime) / 1000));
    this.lastTime = time;
    if (this.paused) {
      this.renderer.render(this.scene, this.camera);
      return;
    }
    if (this.model) this.model.rotation.y += dt * 0.55;
    if (this.ring) this.ring.rotation.z += dt * 0.18;
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposed = true;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    if (this._resizeObserver) this._resizeObserver.disconnect();
    if (this.model && this.scene) {
      this.scene.remove(this.model);
      AssetFactory.releaseModel(this.model);
    }
    this.model = null;
    if (this.scene) {
      const geometries = new Set();
      const materials = new Set();
      this.scene.traverse(object => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) {
          if (Array.isArray(object.material)) object.material.forEach(material => materials.add(material));
          else materials.add(object.material);
        }
      });
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    this.scene = null;
    this.camera = null;
  }
}

function renderModels() {
  const host = $('lab-models');
  const canvas = $('lab-3d');
  if (!host || !canvas) return;
  host.innerHTML = '';
  const preview = new ModelPreview(canvas, $('lab-3d-status'), $('lab-model-name'));
  state.preview = preview;
  const ids = AssetFactory.listModels();
  for (const id of ids) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mg-lab-chip';
    button.textContent = modelLabel(id);
    button.addEventListener('click', () => {
      host.querySelectorAll('.mg-lab-chip').forEach(item => item.classList.remove('is-active'));
      button.classList.add('is-active');
      preview.setModel(id);
    });
    host.appendChild(button);
  }
  const initial = new URLSearchParams(location.search).get('model') || ids[0];
  const initialButton = Array.from(host.querySelectorAll('.mg-lab-chip'))
    .find(button => button.textContent === modelLabel(initial));
  if (initialButton) initialButton.classList.add('is-active');
  preview.setModel(initial);
}

function logLine(message) {
  const log = $('lab-log');
  if (!log) return;
  const line = document.createElement('div');
  line.textContent = message;
  log.prepend(line);
  while (log.children.length > 8) log.lastChild.remove();
}

function showResult(result) {
  const box = $('lab-result');
  if (!box) return;
  if (!result) {
    box.textContent = 'SIN RESULTADO';
    return;
  }
  const extraRewards = Array.isArray(result.rewards?.extra) ? result.rewards.extra.join(' · ') : '';
  const rewardText = result.rewards?.pearls
    ? `PERLAS +${result.rewards.pearls}`
    : extraRewards || 'SIN PERLAS';
  box.innerHTML = `
    <div class="mg-lab-result-head">
      <span>${escapeText(result.rank)}</span>
      <b>${Math.round(result.score)}/100</b>
      <em>${'★'.repeat(result.stars)}${'☆'.repeat(3 - result.stars)}</em>
    </div>
    <div class="mg-lab-result-meta">FASES ${result.phases.length} · COMBO MÁX. ${result.maxCombo} · ${rewardText}</div>
    <pre>${escapeText(JSON.stringify(result, null, 2))}</pre>
  `;
  box.classList.remove('hidden');
  logLine(`RESULTADO: ${result.rank} ${result.score}/100 · ${result.stars}★`);
}

function prepareLaunch() {
  if (state.runner) {
    state.runner.destroy();
    state.runner = null;
  }
  window.__mgLab = null;
  ensureAudio();
  state.preview?.setPaused(true);
  const box = $('lab-result');
  if (box) box.classList.add('hidden');
  return Math.max(1, Math.min(5, Number($('lab-level')?.value) || 2));
}

function exposeRunner() {
  if (!state.runner) return;
  window.__mgLab = {
    mode: state.lastMode,
    runner: state.runner,
    game: state.runner.game,
    lastResult: null,
    lastAbort: null
  };
}

function launchSandbox() {
  const difficulty = prepareLaunch();
  state.lastMode = 'sandbox';
  logLine(`LANZANDO SANDBOX // DIFICULTAD ${difficulty}`);
  try {
    state.runner = new MinigameRunner({
      title: 'LABORATORIO DE GESTOS',
      kicker: 'MINIGAMES // SANDBOX DE SISTEMAS',
      difficulty,
      createGame: ({ services, difficulty: gameDifficulty, options }) => new SandboxGame({
        services,
        difficulty: gameDifficulty,
        options
      }),
      onComplete: result => {
        state.runner = null;
        if (window.__mgLab) window.__mgLab.lastResult = result;
        state.preview?.setPaused(false);
        showResult(result);
      },
      onAbort: info => {
        state.runner = null;
        if (window.__mgLab) window.__mgLab.lastAbort = info;
        state.preview?.setPaused(false);
        logLine(`SANDBOX CANCELADO // ${info?.reason || 'salida'}`);
      },
      onError: error => {
        state.preview?.setPaused(false);
        showError(`Sandbox: ${error?.message || error}`);
      }
    });
    state.runner.start();
    exposeRunner();
  } catch (error) {
    state.preview?.setPaused(false);
    showError(`No se pudo lanzar el sandbox: ${error?.message || error}`);
  }
}

function launchCooking() {
  const difficulty = prepareLaunch();
  state.lastMode = 'cooking';
  const recipeId = $('lab-recipe')?.value;
  const recipe = CHIRINGUITO_CONFIG.getRecipe(recipeId) || CHIRINGUITO_CONFIG.getRecipe('crab_rice');
  if (!recipe) {
    showError('No hay ninguna receta válida para lanzar la cocina.');
    state.preview?.setPaused(false);
    return;
  }
  logLine(`LANZANDO COCINA // ${recipe.name.toUpperCase()} · DIFICULTAD ${difficulty}`);
  try {
    state.runner = new MinigameRunner({
      title: `COCINA // ${recipe.name.toUpperCase()}`,
      kicker: 'MINIGAMES // COCINA',
      difficulty,
      createGame: ({ services, difficulty: gameDifficulty }) => new CookingGame({
        services,
        difficulty: gameDifficulty,
        recipe,
        kitchenSpeed: 0.5,
        orderId: 'debug'
      }),
      onComplete: result => {
        state.runner = null;
        if (window.__mgLab) window.__mgLab.lastResult = result;
        state.preview?.setPaused(false);
        showResult(result);
      },
      onAbort: info => {
        state.runner = null;
        if (window.__mgLab) window.__mgLab.lastAbort = info;
        state.preview?.setPaused(false);
        logLine(`COCINA CANCELADA // ${info?.reason || 'salida'}`);
      },
      onError: error => {
        state.preview?.setPaused(false);
        showError(`Cocina: ${error?.message || error}`);
      }
    });
    state.runner.start();
    exposeRunner();
  } catch (error) {
    state.preview?.setPaused(false);
    showError(`No se pudo lanzar la cocina: ${error?.message || error}`);
  }
}

function launchFishing() {
  const difficulty = prepareLaunch();
  state.lastMode = 'fishing';
  logLine(`LANZANDO PESCA // DIFICULTAD ${difficulty}`);
  try {
    state.runner = new MinigameRunner({
      title: 'PESCA // LAGUNA DEL CHIRINGUITO',
      kicker: 'MINIGAMES // PESCA',
      difficulty,
      createGame: ({ services, difficulty: gameDifficulty }) => new FishingGame({
        services,
        difficulty: gameDifficulty
      }),
      onComplete: result => {
        state.runner = null;
        if (window.__mgLab) window.__mgLab.lastResult = result;
        state.preview?.setPaused(false);
        showResult(result);
      },
      onAbort: info => {
        state.runner = null;
        if (window.__mgLab) window.__mgLab.lastAbort = info;
        state.preview?.setPaused(false);
        logLine(`PESCA CANCELADA // ${info?.reason || 'salida'}`);
      },
      onError: error => {
        state.preview?.setPaused(false);
        showError(`Pesca: ${error?.message || error}`);
      }
    });
    state.runner.start();
    exposeRunner();
  } catch (error) {
    state.preview?.setPaused(false);
    showError(`No se pudo lanzar la pesca: ${error?.message || error}`);
  }
}

function launchHarvest() {
  const difficulty = prepareLaunch();
  state.lastMode = 'harvest';
  const cropId = $('lab-crop')?.value;
  const crop = (CHIRINGUITO_CONFIG.FARM_CROPS || []).find(item => item.ingredientId === cropId)
    || (CHIRINGUITO_CONFIG.FARM_CROPS || [])[0];
  if (!crop) {
    showError('No hay cultivos disponibles para lanzar la cosecha.');
    state.preview?.setPaused(false);
    return;
  }
  logLine(`LANZANDO COSECHA // ${crop.name.toUpperCase()} · DIFICULTAD ${difficulty}`);
  try {
    state.runner = new MinigameRunner({
      title: `COSECHA // ${crop.name.toUpperCase()}`,
      kicker: 'MINIGAMES // COSECHA',
      difficulty,
      createGame: ({ services, difficulty: gameDifficulty }) => new HarvestGame({
        services,
        difficulty: gameDifficulty,
        ingredientId: crop.ingredientId,
        plotName: crop.name,
        crop,
        plotYield: 3
      }),
      onComplete: result => {
        state.runner = null;
        if (window.__mgLab) window.__mgLab.lastResult = result;
        state.preview?.setPaused(false);
        showResult(result);
      },
      onAbort: info => {
        state.runner = null;
        if (window.__mgLab) window.__mgLab.lastAbort = info;
        state.preview?.setPaused(false);
        logLine(`COSECHA CANCELADA // ${info?.reason || 'salida'}`);
      },
      onError: error => {
        state.preview?.setPaused(false);
        showError(`Cosecha: ${error?.message || error}`);
      }
    });
    state.runner.start();
    exposeRunner();
  } catch (error) {
    state.preview?.setPaused(false);
    showError(`No se pudo lanzar la cosecha: ${error?.message || error}`);
  }
}

function launchPlanting() {
  const difficulty = prepareLaunch();
  state.lastMode = 'planting';
  const cropId = $('lab-crop')?.value;
  const crop = (CHIRINGUITO_CONFIG.FARM_CROPS || []).find(item => item.ingredientId === cropId)
    || (CHIRINGUITO_CONFIG.FARM_CROPS || [])[0];
  if (!crop) {
    showError('No hay cultivos disponibles para lanzar la siembra.');
    state.preview?.setPaused(false);
    return;
  }
  logLine(`LANZANDO SIEMBRA // ${crop.name.toUpperCase()} · DIFICULTAD ${difficulty}`);
  try {
    state.runner = new MinigameRunner({
      title: `SIEMBRA // ${crop.name.toUpperCase()}`,
      kicker: 'MINIGAMES // SIEMBRA',
      difficulty,
      createGame: ({ services, difficulty: gameDifficulty }) => new PlantingGame({
        services,
        difficulty: gameDifficulty,
        ingredientId: crop.ingredientId,
        plotName: crop.name,
        crop,
        plotYield: 3
      }),
      onComplete: result => {
        state.runner = null;
        if (window.__mgLab) window.__mgLab.lastResult = result;
        state.preview?.setPaused(false);
        showResult(result);
      },
      onAbort: info => {
        state.runner = null;
        if (window.__mgLab) window.__mgLab.lastAbort = info;
        state.preview?.setPaused(false);
        logLine(`SIEMBRA CANCELADA // ${info?.reason || 'salida'}`);
      },
      onError: error => {
        state.preview?.setPaused(false);
        showError(`Siembra: ${error?.message || error}`);
      }
    });
    state.runner.start();
    exposeRunner();
  } catch (error) {
    state.preview?.setPaused(false);
    showError(`No se pudo lanzar la siembra: ${error?.message || error}`);
  }
}

function relaunch() {
  if (state.lastMode === 'cooking') launchCooking();
  else if (state.lastMode === 'fishing') launchFishing();
  else if (state.lastMode === 'harvest') launchHarvest();
  else if (state.lastMode === 'planting') launchPlanting();
  else launchSandbox();
}

function populateCrops() {
  const select = $('lab-crop');
  if (!select) return;
  select.innerHTML = '';
  const crops = CHIRINGUITO_CONFIG.FARM_CROPS || [];
  for (const crop of crops) {
    const option = document.createElement('option');
    option.value = crop.ingredientId;
    option.textContent = crop.name;
    select.appendChild(option);
  }
  const params = new URLSearchParams(location.search);
  const requested = params.get('crop');
  if (requested && crops.some(crop => crop.ingredientId === requested)) {
    select.value = requested;
  } else if (crops.some(crop => crop.ingredientId === 'tomato')) {
    select.value = 'tomato';
  }
}

function populateRecipes() {
  const select = $('lab-recipe');
  if (!select) return;
  select.innerHTML = '';
  const recipes = Object.values(CHIRINGUITO_CONFIG.RECIPES || {});
  for (const recipe of recipes) {
    const option = document.createElement('option');
    option.value = recipe.id;
    option.textContent = recipe.name;
    select.appendChild(option);
  }
  const params = new URLSearchParams(location.search);
  const requested = params.get('recipe');
  if (requested && recipes.some(recipe => recipe.id === requested)) {
    select.value = requested;
  } else if (recipes.some(recipe => recipe.id === 'crab_rice')) {
    select.value = 'crab_rice';
  }
}

function setupControls() {
  const level = $('lab-level');
  const levelValue = $('lab-level-value');
  const updateLevel = () => {
    if (levelValue) levelValue.textContent = `${level?.value || 2}/5`;
  };
  level?.addEventListener('input', updateLevel);
  updateLevel();

  $('lab-play')?.addEventListener('click', launchSandbox);
  $('lab-play-cooking')?.addEventListener('click', launchCooking);
  $('lab-play-fishing')?.addEventListener('click', launchFishing);
  $('lab-play-harvest')?.addEventListener('click', launchHarvest);
  $('lab-play-planting')?.addEventListener('click', launchPlanting);
  $('lab-retry')?.addEventListener('click', relaunch);
  $('lab-audio')?.addEventListener('click', () => {
    ensureAudio();
    AssetFactory.playSound('select', { volume: 0.9 });
  });

  window.addEventListener('pointerdown', () => {
    if (!state.audioReady) ensureAudio();
  }, { once: true });

  const params = new URLSearchParams(location.search);
  if (params.has('level')) {
    const value = Math.max(1, Math.min(5, Number(params.get('level')) || 2));
    if (level) level.value = String(value);
    updateLevel();
  }
  const play = params.get('play');
  if (play === 'cooking') {
    setTimeout(launchCooking, 260);
  } else if (play === 'fishing') {
    setTimeout(launchFishing, 260);
  } else if (play === 'harvest') {
    setTimeout(launchHarvest, 260);
  } else if (play === 'planting') {
    setTimeout(launchPlanting, 260);
  } else if (play === 'sandbox' || params.get('auto') === '1') {
    setTimeout(launchSandbox, 260);
  }
}

function cleanup() {
  state.runner?.destroy();
  state.runner = null;
  state.preview?.dispose();
  state.preview = null;
  AssetFactory.dispose();
}

function init() {
  renderSprites();
  renderSounds();
  renderModels();
  populateCrops();
  populateRecipes();
  setupControls();
  const status = $('lab-status');
  if (status) status.textContent = `${AssetFactory.listSprites().length} SPRITES · ${AssetFactory.listSounds().length} SONIDOS · ${AssetFactory.listModels().length} MODELOS 3D`;
}

window.addEventListener('beforeunload', cleanup);
init();
