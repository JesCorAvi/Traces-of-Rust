// Base compartida de las fases de cocina: receta, ingredientes, tablas y pills.
// Exports: CookingPhase, hexColor.

import { Phase } from '../../core/Phase.js';
import { CHIRINGUITO_CONFIG } from '../../../config/chiringuitoConfig.js';
import {
  clamp, circle, fillRoundRect, strokeRoundRect, text, rgba,
  drawWoodSurface
} from '../../core/Draw.js';

export function hexColor(value) {
  if (typeof value === 'number') return `#${Math.max(0, value).toString(16).padStart(6, '0')}`;
  if (typeof value === 'string' && value.startsWith('#')) return value;
  return '#d7b57a';
}

export class CookingPhase extends Phase {
  constructor(options = {}) {
    super(options);
    this.recipe = options.recipe || {};
    this.kitchenSpeed = Math.max(0, Number(options.kitchenSpeed) || 0);
    this.difficulty = clamp(options.difficulty || 1, 1, 5);
    this.accent = options.accent || hexColor(this.recipe.color || '#ffb23f');
  }

  onEnter() {
    this.width = this.game.width;
    this.height = this.game.height;
    this.juice = this.game.juice;
    this.audio = this.game.audio;
    this.assets = this.game.assets;
    this.updateLayout();
    this.resetState();
    this.syncInputTarget();
  }

  onResize() {
    this.width = this.game.width;
    this.height = this.game.height;
    this.updateLayout();
    this.syncInputTarget();
  }

  updateLayout() {}
  resetState() {}

  syncInputTarget() {
    this.game.input.clearCircleTarget();
  }

  get ingredientIds() {
    const order = Array.isArray(this.recipe?.steps?.plate?.order)
      ? this.recipe.steps.plate.order
      : [];
    const ids = order.length ? order : Object.keys(this.recipe?.ingredients || {});
    return [...new Set(ids)];
  }

  get primaryIngredientId() {
    return this.ingredientIds[0] || 'crab';
  }

  getIngredient(id) {
    return CHIRINGUITO_CONFIG.getIngredient(id) || null;
  }

  colorFor(id, fallback = '#d7b57a') {
    return this.getIngredient(id)?.color || fallback;
  }

  drawIngredient(ctx, id, x, y, scale = 1, options = {}) {
    const sprite = this.game.assets.getSprite(id);
    if (sprite && sprite.id !== 'missing') {
      sprite.draw(ctx, x, y, { scale, ...options });
      return true;
    }
    const color = this.colorFor(id);
    ctx.save();
    ctx.globalAlpha = clamp(Number.isFinite(options.alpha) ? options.alpha : 1);
    circle(ctx, x, y, Math.max(6, 16 * scale), color, '#24140f', Math.max(2, 3 * scale));
    ctx.restore();
    return false;
  }

  drawBoard(ctx, x, y, w, h, options = {}) {
    drawWoodSurface(ctx, x, y, w, h, {
      base: options.base || '#a96a3d',
      dark: options.dark || '#5d351f',
      light: options.light || '#c98d55',
      radius: options.radius ?? 22,
      lineWidth: options.lineWidth ?? 5
    });
    if (options.inner !== false) {
      const pad = 16;
      fillRoundRect(ctx, x + pad, y + pad, w - pad * 2, h - pad * 2, 16, options.innerFill || 'rgba(201, 141, 85, 0.44)');
      strokeRoundRect(ctx, x + pad, y + pad, w - pad * 2, h - pad * 2, 16, rgba('#24140f', 0.36), 3);
    }
  }

  drawCounterPill(ctx, label, x, y, options = {}) {
    const width = options.width || Math.max(150, String(label).length * 9 + 28);
    const height = options.height || 30;
    fillRoundRect(ctx, x, y, width, height, 10, rgba('#24140f', options.alpha ?? 0.68));
    strokeRoundRect(ctx, x, y, width, height, 10, rgba('#fff4d6', 0.3), 2);
    circle(ctx, x + 15, y + height * 0.5, 4.5, options.color || this.accent, '#24140f', 2);
    text(ctx, label, x + 27, y + height * 0.52, {
      size: options.size || 11,
      family: options.family || '"Press Start 2P", monospace',
      color: options.textColor || '#fff4d6',
      align: 'left',
      outline: '#24140f',
      outlineWidth: 3
    });
    return { x, y, width, height };
  }

  drawIngredientRing(ctx, x, y, radius, color, active = true) {
    ctx.save();
    ctx.globalAlpha = active ? 0.9 : 0.35;
    ctx.setLineDash(active ? [7, 7] : [4, 8]);
    circle(ctx, x, y, radius, null, '#24140f', 7);
    circle(ctx, x, y, radius, null, color, 3.5);
    ctx.setLineDash([]);
    ctx.restore();
  }

  drawKitchenNote(ctx, textValue, x, y, options = {}) {
    text(ctx, textValue, x, y, {
      size: options.size || 13,
      family: '"Press Start 2P", monospace',
      color: options.color || '#fff4d6',
      outline: '#24140f',
      outlineWidth: options.outlineWidth || 3,
      align: options.align || 'center'
    });
  }
}
