// Base compartida de las fases de siembra: bancal, semilla, herramientas y notas.
// Exports: PlantingPhase.

import { Phase } from '../../core/Phase.js';
import { CHIRINGUITO_CONFIG } from '../../../config/chiringuitoConfig.js';
import { PALETTE } from '../../assets/palette.js';
import {
  clamp, circle, fillRoundRect, strokeRoundRect, text, rgba
} from '../../core/Draw.js';
import { drawBed } from './PlantingArt.js';

export class PlantingPhase extends Phase {
  constructor(options = {}) {
    super(options);
    this.difficulty = clamp(options.difficulty || 1, 1, 5);
    this.ingredientId = options.ingredientId || 'tomato';
    this.plotName = options.plotName || 'PARCELA';
    this.crop = options.crop || null;
    this.plotYield = Math.max(1, Number(options.plotYield) || 3);
    this.accent = options.accent || PALETTE.lime;
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

  get ingredient() {
    return CHIRINGUITO_CONFIG.getIngredient(this.ingredientId) || null;
  }

  get cropName() {
    return this.crop?.name || this.ingredient?.name || this.plotName;
  }

  get cropColor() {
    return this.ingredient?.color || PALETTE.lime;
  }

  get cropForce() {
    return clamp((Number(this.crop?.height) || 0.8) / 1.8, 0.2, 1);
  }

  drawBed(ctx, x, y, w, h, time = this.elapsed) {
    drawBed(ctx, x, y, w, h, time);
  }

  drawProduce(ctx, x, y, scale = 1, options = {}) {
    const sprite = this.assets.getSprite(this.ingredientId);
    if (sprite && sprite.id !== 'missing') {
      sprite.draw(ctx, x, y, {
        scale,
        rotation: options.rotation || 0,
        alpha: Number.isFinite(options.alpha) ? options.alpha : 1,
        sx: options.sx || 1,
        sy: options.sy || 1
      });
    } else {
      circle(ctx, x, y, Math.max(8, 18 * scale), this.cropColor, PALETTE.ink, 3);
    }
  }

  drawSeed(ctx, x, y, scale = 1, options = {}) {
    const sprite = this.assets.getSprite('seed');
    if (sprite && sprite.id !== 'missing') {
      sprite.draw(ctx, x, y, {
        scale,
        rotation: options.rotation || 0,
        alpha: Number.isFinite(options.alpha) ? options.alpha : 1
      });
    } else {
      circle(ctx, x, y, Math.max(3, 6 * scale), PALETTE.pineapple, PALETTE.ink, 2);
    }
  }

  drawTool(ctx, id, x, y, scale = 1, options = {}) {
    const sprite = this.assets.getSprite(id);
    if (sprite && sprite.id !== 'missing') {
      sprite.draw(ctx, x, y, { scale, ...options });
    }
  }

  drawCounterPill(ctx, label, x, y, options = {}) {
    const width = options.width || Math.max(160, String(label).length * 8 + 28);
    const height = options.height || 30;
    fillRoundRect(ctx, x, y, width, height, 10, rgba(PALETTE.ink, options.alpha ?? 0.68));
    strokeRoundRect(ctx, x, y, width, height, 10, rgba(PALETTE.cream, 0.3), 2);
    circle(ctx, x + 15, y + height * 0.5, 4.5, options.color || this.accent, PALETTE.ink, 2);
    text(ctx, label, x + 27, y + height * 0.52, {
      size: options.size || 10,
      family: '"Press Start 2P", monospace',
      color: options.textColor || PALETTE.cream,
      align: 'left',
      outline: PALETTE.ink,
      outlineWidth: 3
    });
    return { x, y, width, height };
  }

  drawPointerRing(ctx, x, y, color = PALETTE.cream, radius = 16) {
    ctx.save();
    ctx.globalAlpha = 0.82;
    circle(ctx, x, y, radius, null, PALETTE.ink, 4);
    circle(ctx, x, y, radius, null, color, 2);
    ctx.restore();
  }

  drawNote(ctx, value, x, y, options = {}) {
    text(ctx, value, x, y, {
      size: options.size || 10,
      family: '"Press Start 2P", monospace',
      color: options.color || PALETTE.cream,
      outline: PALETTE.ink,
      outlineWidth: 3,
      align: options.align || 'center'
    });
  }
}
