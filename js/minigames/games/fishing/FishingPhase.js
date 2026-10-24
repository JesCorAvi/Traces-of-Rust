// Base compartida de las fases de pesca: caña, pez, boya y píldoras de estado.
// Exports: FishingPhase, fishColorHex.

import { Phase } from '../../core/Phase.js';
import { CHIRINGUITO_CONFIG } from '../../../config/chiringuitoConfig.js';
import { PALETTE } from '../../assets/palette.js';
import {
  clamp, circle, fillRoundRect, strokeRoundRect, text, rgba
} from '../../core/Draw.js';
import { drawLine, drawRod, drawWaterRipples } from './FishingArt.js';

export function fishColorHex(color) {
  if (typeof color === 'number') return `#${Math.max(0, color).toString(16).padStart(6, '0')}`;
  if (typeof color === 'string' && color.startsWith('#')) return color;
  return PALETTE.lagoon;
}

export class FishingPhase extends Phase {
  constructor(options = {}) {
    super(options);
    this.difficulty = clamp(options.difficulty || 1, 1, 5);
    this.fishing = CHIRINGUITO_CONFIG.FISHING;
    this.accent = options.accent || PALETTE.lagoon;
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

  get fish() {
    return this.game?.fishType || null;
  }

  get fishColor() {
    return fishColorHex(this.fish?.color || PALETTE.lagoon);
  }

  get fishName() {
    return this.fish?.name || 'Pez';
  }

  drawSprite(ctx, id, x, y, scale = 1, options = {}) {
    const sprite = this.assets.getSprite(id);
    if (sprite) sprite.draw(ctx, x, y, { scale, ...options });
    return sprite;
  }

  drawFish(ctx, x, y, scale = 1, options = {}) {
    const color = this.fishColor;
    const alpha = Number.isFinite(options.alpha) ? options.alpha : 1;
    ctx.save();
    ctx.globalAlpha = alpha * 0.3;
    const glow = ctx.createRadialGradient(x, y, 2, x, y, 54 * scale);
    glow.addColorStop(0, color);
    glow.addColorStop(1, 'rgba(63,193,201,0)');
    circle(ctx, x, y, 54 * scale, glow);
    ctx.globalAlpha = alpha;
    this.drawSprite(ctx, 'fish', x, y, scale, {
      rotation: options.rotation || 0,
      flipX: options.flipX,
      alpha
    });
    if (this.fish?.rare) {
      for (let i = 0; i < 3; i++) {
        const a = (options.time || 0) * 2 + i * 2.1;
        circle(ctx, x + Math.cos(a) * 34 * scale, y + Math.sin(a) * 18 * scale, 2.2, PALETTE.pineapple);
      }
    }
    ctx.restore();
  }

  drawBobber(ctx, x, y, scale = 1, dip = 0) {
    drawWaterRipples(ctx, x, y + 4, 28 * scale, this.fishColor, (this.elapsed || 0) + dip, 2);
    this.drawSprite(ctx, 'bobber', x, y - dip * 10, scale, {
      rotation: Math.sin((this.elapsed || 0) * 2) * 0.04
    });
  }

  drawFishingLine(ctx, tipX, tipY, targetX, targetY, sag = 20) {
    drawLine(ctx, tipX, tipY, targetX, targetY, sag, 'rgba(255,244,214,0.72)', 2);
  }

  drawRod(ctx, baseX, baseY, tipX, tipY, options = {}) {
    drawRod(ctx, baseX, baseY, tipX, tipY, options);
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
    ctx.globalAlpha = 0.8;
    circle(ctx, x, y, radius, null, PALETTE.ink, 4);
    circle(ctx, x, y, radius, null, color, 2);
    ctx.restore();
  }

  drawTargetRipple(ctx, x, y, radius, color = PALETTE.pineapple) {
    ctx.save();
    ctx.globalAlpha = 0.85;
    const pulse = radius * (1 + Math.sin((this.elapsed || 0) * 4.2) * 0.08);
    drawWaterRipples(ctx, x, y, pulse, color, (this.elapsed || 0) * 1.4, 3);
    circle(ctx, x, y, 5, color, PALETTE.ink, 2);
    ctx.restore();
  }

  drawKitchenNote(ctx, value, x, y, options = {}) {
    text(ctx, value, x, y, {
      size: options.size || 11,
      family: '"Press Start 2P", monospace',
      color: options.color || PALETTE.cream,
      outline: PALETTE.ink,
      outlineWidth: 3,
      align: options.align || 'center'
    });
  }
}
