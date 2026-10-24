// Fábrica central de assets de minijuegos. API estable para sprites 2D, sonidos
// sintetizados y modelos 3D toon. Todo se cachea y se puede sustituir por un
// archivo real sin tocar la lógica de los minijuegos.
// Exports: AssetFactory.

import { AudioSys } from '../../audio.js';
import { PALETTE } from './palette.js';
import { SPRITE_DEFS, SPRITE_IDS } from './sprites.js';
import { SOUND_PATCHES, SOUND_IDS, SOUND_LABELS } from './sounds.js';
import { createModelFactory, MODEL_IDS } from './models.js';

const SPRITE_RESOLUTION = 2;

const SPRITE_ALIASES = Object.freeze({
  salt: 'saltshaker',
  'salt-shaker': 'saltshaker',
  watercan: 'wateringcan',
  'watering-can': 'wateringcan',
  'fishing-rod': 'fishingRod',
  rod: 'fishingRod',
  cut: 'knife',
  float: 'bobber'
});

const SOUND_ALIASES = Object.freeze({
  cut: 'chop',
  win: 'perfect',
  success: 'good',
  miss: 'fail',
  count: 'countdown',
  clear: 'phaseClear'
});

const MODEL_ALIASES = Object.freeze({
  'fishing-rod': 'fishingRod',
  rod: 'fishingRod',
  'salt-shaker': 'saltshaker'
});

function resolveAlias(id, aliases) {
  return aliases[id] || id;
}

function createSpriteAsset(id, def) {
  const scale = SPRITE_RESOLUTION;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(def.width * scale));
  canvas.height = Math.max(1, Math.ceil(def.height * scale));
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(scale, scale);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    try {
      def.draw(ctx, def.width, def.height, PALETTE);
    } catch (error) {
      console.warn(`[AssetFactory] Error dibujando el sprite "${id}":`, error);
    }
  }

  const anchorX = Number.isFinite(def.anchorX) ? def.anchorX : 0.5;
  const anchorY = Number.isFinite(def.anchorY) ? def.anchorY : 1;
  const asset = {
    id,
    kind: 'sprite',
    canvas,
    image: canvas,
    width: def.width,
    height: def.height,
    anchorX,
    anchorY,
    resolution: scale,
    generated: true,
    draw(target, x, y, options = {}) {
      const {
        scale: drawScale = 1,
        rotation = 0,
        alpha = 1,
        sx = 1,
        sy = 1,
        flipX = false
      } = options;
      if (!target || !canvas.width) return;
      target.save();
      target.globalAlpha *= Math.max(0, Math.min(1, alpha));
      target.translate(x, y);
      target.rotate(rotation);
      target.scale(drawScale * sx * (flipX ? -1 : 1), drawScale * sy);
      target.drawImage(canvas, -def.width * anchorX, -def.height * anchorY, def.width, def.height);
      target.restore();
    },
    getDataURL() {
      return canvas.toDataURL('image/png');
    },
    dispose() {
      canvas.width = 0;
      canvas.height = 0;
    }
  };
  return asset;
}

function createExternalSpriteAsset(id, source, options = {}) {
  const isCanvas = typeof HTMLCanvasElement !== 'undefined' && source instanceof HTMLCanvasElement;
  const isBitmap = typeof ImageBitmap !== 'undefined' && source instanceof ImageBitmap;
  const width = Number(options.width) || source.width || 256;
  const height = Number(options.height) || source.height || 256;
  const anchorX = Number.isFinite(options.anchorX) ? options.anchorX : 0.5;
  const anchorY = Number.isFinite(options.anchorY) ? options.anchorY : 1;
  return {
    id,
    kind: 'sprite',
    canvas: isCanvas ? source : null,
    image: source,
    width,
    height,
    anchorX,
    anchorY,
    resolution: 1,
    generated: false,
    draw(target, x, y, drawOptions = {}) {
      const {
        scale = 1,
        rotation = 0,
        alpha = 1,
        sx = 1,
        sy = 1,
        flipX = false
      } = drawOptions;
      if (!target || !source) return;
      target.save();
      target.globalAlpha *= Math.max(0, Math.min(1, alpha));
      target.translate(x, y);
      target.rotate(rotation);
      target.scale(scale * sx * (flipX ? -1 : 1), scale * sy);
      try {
        target.drawImage(source, -width * anchorX, -height * anchorY, width, height);
      } catch (error) {
        // Una imagen aún no cargada puede lanzar; el sprite se sustituirá al cargar.
      }
      target.restore();
    },
    getDataURL() {
      if (isCanvas || isBitmap) {
        const temp = document.createElement('canvas');
        temp.width = width;
        temp.height = height;
        const ctx = temp.getContext('2d');
        ctx.drawImage(source, 0, 0, width, height);
        return temp.toDataURL('image/png');
      }
      return source.src || '';
    },
    dispose() {
      if (isCanvas) {
        source.width = 0;
        source.height = 0;
      }
    }
  };
}

function createSoundAsset(id, patch, overrides) {
  return {
    id,
    kind: 'sound',
    duration: (patch?.layers || []).reduce((max, layer) => Math.max(max, (layer.when || 0) + (layer.dur || 0)), 0),
    label: SOUND_LABELS[id] || id,
    generated: true,
    play(options = {}) {
      const override = overrides.get(id);
      if (override) {
        if (typeof override.play === 'function') return override.play(options);
        if (AudioSys.playBuffer) {
          return AudioSys.playBuffer(override, {
            key: `mg:asset:${id}`,
            cooldown: patch?.cooldown || 0,
            ...options
          });
        }
        return false;
      }
      if (!patch || !AudioSys.playSynthPatch) return false;
      return AudioSys.playSynthPatch(patch, options);
    }
  };
}

export const AssetFactory = {
  _sprites: new Map(),
  _sounds: new Map(),
  _spriteOverrides: new Map(),
  _soundOverrides: new Map(),
  _modelFactory: null,
  _modelOverrides: new Map(),
  _warned: new Set(),

  // -------------------------------------------------------------------------
  // Sprites
  // -------------------------------------------------------------------------
  getSprite(id, options = {}) {
    const key = resolveAlias(id, SPRITE_ALIASES);
    const override = this._spriteOverrides.get(key);
    if (override) return override;
    if (this._sprites.has(key)) return this._sprites.get(key);
    const def = SPRITE_DEFS[key];
    if (!def) {
      this._warnOnce(`sprite:${key}`, `[AssetFactory] Sprite desconocido "${key}"; uso el marcador de asset ausente.`);
      if (key !== 'missing') return this.getSprite('missing', options);
      return createSpriteAsset('missing', SPRITE_DEFS.missing);
    }
    const asset = createSpriteAsset(key, def);
    this._sprites.set(key, asset);
    return asset;
  },

  hasSprite(id) {
    const key = resolveAlias(id, SPRITE_ALIASES);
    return this._spriteOverrides.has(key) || !!SPRITE_DEFS[key];
  },

  registerSprite(id, source, options = {}) {
    const key = resolveAlias(id, SPRITE_ALIASES);
    if (!source) return Promise.reject(new Error(`[AssetFactory] Fuente vacía para el sprite "${id}".`));
    if (typeof source === 'string') {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => {
          const asset = createExternalSpriteAsset(key, image, {
            width: image.naturalWidth || image.width,
            height: image.naturalHeight || image.height,
            ...options
          });
          this._spriteOverrides.set(key, asset);
          resolve(asset);
        };
        image.onerror = () => reject(new Error(`[AssetFactory] No se pudo cargar el sprite "${source}".`));
        image.src = source;
      });
    }
    const asset = createExternalSpriteAsset(key, source, options);
    this._spriteOverrides.set(key, asset);
    return Promise.resolve(asset);
  },

  // -------------------------------------------------------------------------
  // Sonidos
  // -------------------------------------------------------------------------
  getSound(id) {
    const key = resolveAlias(id, SOUND_ALIASES);
    if (this._sounds.has(key)) return this._sounds.get(key);
    const patch = SOUND_PATCHES[key];
    if (!patch) {
      this._warnOnce(`sound:${key}`, `[AssetFactory] Sonido desconocido "${key}"; devuelvo un silencio seguro.`);
      const silent = {
        id: key,
        kind: 'sound',
        duration: 0,
        label: key,
        generated: true,
        play() { return false; }
      };
      this._sounds.set(key, silent);
      return silent;
    }
    const asset = createSoundAsset(key, patch, this._soundOverrides);
    this._sounds.set(key, asset);
    return asset;
  },

  hasSound(id) {
    const key = resolveAlias(id, SOUND_ALIASES);
    return this._soundOverrides.has(key) || !!SOUND_PATCHES[key];
  },

  playSound(id, options = {}) {
    return this.getSound(id).play(options);
  },

  registerSound(id, source) {
    const key = resolveAlias(id, SOUND_ALIASES);
    if (typeof source === 'function') {
      this._soundOverrides.set(key, { play: source });
      return Promise.resolve(this.getSound(key));
    }
    if (typeof source === 'string') {
      const ready = this.unlockAudio();
      if (!ready || !AudioSys.ctx) {
        return Promise.reject(new Error('[AssetFactory] AudioContext no disponible para decodificar el sonido.'));
      }
      return fetch(source)
        .then(response => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.arrayBuffer();
        })
        .then(buffer => AudioSys.ctx.decodeAudioData(buffer))
        .then(decoded => {
          this._soundOverrides.set(key, decoded);
          return this.getSound(key);
        });
    }
    if (source && typeof source === 'object' && (source instanceof AudioBuffer || source.buffer instanceof AudioBuffer)) {
      this._soundOverrides.set(key, source);
      return Promise.resolve(this.getSound(key));
    }
    return Promise.reject(new Error(`[AssetFactory] Fuente de sonido no válida para "${id}".`));
  },

  // -------------------------------------------------------------------------
  // Modelos 3D
  // -------------------------------------------------------------------------
  getModel(id) {
    const key = resolveAlias(id, MODEL_ALIASES);
    const factory = this._getModelFactory();
    const template = factory.getTemplate(key);
    if (!template) {
      this._warnOnce(`model:${key}`, `[AssetFactory] Modelo 3D desconocido "${key}".`);
      return null;
    }
    const clone = template.clone(true);
    clone.userData.mgAssetId = key;
    clone.name = `mg_model_${key}`;
    return clone;
  },

  registerModel(id, builder) {
    if (typeof builder !== 'function') return false;
    const key = resolveAlias(id, MODEL_ALIASES);
    this._modelOverrides.set(key, builder);
    return this._getModelFactory().register(key, builder);
  },

  releaseModel(object3D) {
    if (!object3D) return;
    if (object3D.parent) object3D.parent.remove(object3D);
  },

  _getModelFactory() {
    if (!this._modelFactory) this._modelFactory = createModelFactory();
    return this._modelFactory;
  },

  // -------------------------------------------------------------------------
  // Audio
  // -------------------------------------------------------------------------
  unlockAudio() {
    if (!AudioSys.ctx) AudioSys.init();
    if (AudioSys.ctx?.state === 'suspended') {
      try {
        Promise.resolve(AudioSys.ctx.resume()).catch(() => {});
      } catch (error) {}
    }
    return !!AudioSys.ctx;
  },

  isAudioReady() {
    return !!AudioSys.ctx && AudioSys.ctx.state !== 'closed';
  },

  // -------------------------------------------------------------------------
  // Catálogo / precarga / limpieza
  // -------------------------------------------------------------------------
  listSprites() {
    return [...new Set([...SPRITE_IDS, ...this._spriteOverrides.keys()])];
  },

  listSounds() {
    return [...new Set([...SOUND_IDS, ...this._soundOverrides.keys()])];
  },

  listModels() {
    return [...new Set([...MODEL_IDS, ...this._modelOverrides.keys()])];
  },

  listSoundLabels() {
    return { ...SOUND_LABELS };
  },

  preload({ sprites = [], sounds = [], models = [] } = {}) {
    for (const id of sprites) this.getSprite(id);
    for (const id of sounds) this.getSound(id);
    for (const id of models) this.getModel(id);
  },

  _warnOnce(key, message) {
    if (this._warned.has(key)) return;
    this._warned.add(key);
    console.warn(message);
  },

  dispose() {
    for (const asset of this._sprites.values()) asset.dispose?.();
    this._sprites.clear();
    this._sounds.clear();
    for (const asset of this._spriteOverrides.values()) asset.dispose?.();
    this._spriteOverrides.clear();
    this._soundOverrides.clear();
    this._modelFactory?.dispose();
    this._modelFactory = null;
    this._modelOverrides.clear();
    this._warned.clear();
  }
};

export { PALETTE };
