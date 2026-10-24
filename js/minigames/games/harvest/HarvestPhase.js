// Base compartida de las fases de cosecha: cultivo, fruto, píldoras y ayudas.
// Exports: HarvestPhase.

import { Phase } from '../../core/Phase.js';
import { CHIRINGUITO_CONFIG } from '../../../config/chiringuitoConfig.js';
import { PALETTE } from '../../assets/palette.js';
import {
  TAU, clamp, circle, fillRoundRect, strokeRoundRect, text, rgba
} from '../../core/Draw.js';
import { drawCropPlant } from './HarvestArt.js';

export class HarvestPhase extends Phase {
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

  drawProduce(ctx, x, y, scale = 1, options = {}) {
    const color = options.color || this.cropColor;
    const alpha = Number.isFinite(options.alpha) ? options.alpha : 1;
    if (options.glow !== false) {
      ctx.save();
      ctx.globalAlpha = alpha * 0.22;
      const glow = ctx.createRadialGradient(x, y, 2, x, y, 48 * scale);
      glow.addColorStop(0, color);
      glow.addColorStop(1, 'rgba(126,217,87,0)');
      circle(ctx, x, y, 48 * scale, glow);
      ctx.restore();
    }
    const sprite = this.assets.getSprite(this.ingredientId);
    if (sprite && sprite.id !== 'missing') {
      sprite.draw(ctx, x, y, {
        scale,
        rotation: options.rotation || 0,
        alpha,
        sx: options.sx || 1,
        sy: options.sy || 1
      });
    } else {
      ctx.save();
      ctx.globalAlpha = alpha;
      circle(ctx, x, y, Math.max(8, 18 * scale), color, PALETTE.ink, 3);
      ctx.restore();
    }
  }

  drawCropPlant(ctx, x, y, scale = 1, options = {}) {
    drawCropPlant(ctx, this.crop || {}, x, y, scale, options);
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

  drawSizeTag(ctx, x, y, sizeClass, scale = 1) {
    const labels = ['S', 'M', 'L'];
    const colors = [PALETTE.lagoonLight, PALETTE.pineapple, PALETTE.coral];
    const index = clamp(Math.round(sizeClass), 0, 2);
    const r = 11 * scale;
    circle(ctx, x, y, r, colors[index], PALETTE.ink, 2.5);
    text(ctx, labels[index], x, y + 1, {
      size: Math.max(7, 9 * scale),
      family: '"Press Start 2P", monospace',
      color: PALETTE.ink
    });
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
