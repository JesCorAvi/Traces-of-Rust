// Fase 2 de pesca: esperar la picada real y no reaccionar a los tirones falsos.
// Exports: WaitPhase.

import { FishingPhase } from '../FishingPhase.js';
import { FISHING } from '../../../../config/chiringuito/fishing.js';
import { PALETTE } from '../../../assets/palette.js';
import { clamp, rand, circle, text } from '../../../core/Draw.js';
import { drawWaterRipples } from '../FishingArt.js';

export class WaitPhase extends FishingPhase {
  constructor({ difficulty } = {}) {
    super({
      id: 'wait',
      title: 'ESPERAR',
      kicker: 'FASE 2 · BOYA',
      instruction: 'Espera la picada real. No reacciones a los tirones falsos: pulsa solo cuando la boya se hunda.',
      gesture: 'gesture-tap',
      duration: FISHING.waitDurationSec,
      weight: 1.6,
      hint: 'SILENCIO · PULSA SOLO EN LA PICADA REAL',
      accent: PALETTE.lagoonLight,
      difficulty
    });
  }

  updateLayout() {
    const w = this.width;
    const h = this.height;
    this.rodBase = { x: w * 0.18, y: h * 0.8 };
    this.rodTip = { x: w * 0.32, y: h * 0.48 };
    const spot = this.game?.castSpot || { x: w * 0.62, y: h * 0.57 };
    this.bobber = {
      x: Math.max(w * 0.44, Math.min(w * 0.9, spot.x)),
      y: Math.max(h * 0.4, Math.min(h * 0.7, spot.y))
    };
    this.lake = { x0: w * 0.4, x1: w * 0.94, y0: h * 0.35, y1: h * 0.72 };
  }

  resetState() {
    this.biteAt = rand(FISHING.waitBiteMinMs, FISHING.waitBiteMaxMs) / 1000;
    this.biteWindow = Math.max(0.55, (FISHING.waitBiteWindowMs / 1000) * (1 - (this.difficulty - 1) * 0.035));
    this.falseAt = null;
    this.falseActive = false;
    this.falseDone = false;
    this.falseEnd = 0;
    this.biteActive = false;
    this.biteStart = 0;
    this.reaction = 0;
    this.reactionQuality = 0;
    this.success = false;
    this.failed = false;
    this.bobberPhase = rand(0, 1);
    this.lastNibbleSound = -1;
    const erratic = this.fish?.erratic || 1;
    if (erratic > 1.05 && Math.random() < FISHING.falseBiteChance) {
      const candidate = this.biteAt - rand(0.8, 1.7);
      if (candidate > 0.45) this.falseAt = candidate;
    }
  }

  onUpdate(dt) {
    if (this.done || this.success || this.failed) return;
    const time = this.elapsed;

    if (this.falseAt !== null && !this.falseDone && time >= this.falseAt && time < this.biteAt - 0.12) {
      this.falseDone = true;
      this.falseActive = true;
      this.falseEnd = time + 0.22;
      this.game.audio.play('pop', { rate: 0.78, volume: 0.42 });
      this.game.juice.popText('¡TIRÓN FALSO!', this.bobber.x, this.bobber.y - 44, {
        color: PALETTE.mango,
        size: 12,
        life: 0.55,
        vy: -24
      });
    }
    if (this.falseActive && time >= this.falseEnd) this.falseActive = false;

    if (!this.biteActive && time >= this.biteAt) {
      this.biteActive = true;
      this.biteStart = time;
      this.game.audio.play('bite', { volume: 0.95 });
      this.game.juice.splash(this.bobber.x, this.bobber.y + 6, 22, {
        speed: [80, 260],
        angle: [-Math.PI * 0.92, -Math.PI * 0.08],
        colors: [PALETTE.lagoonLight, PALETTE.cream, this.fishColor],
        life: [0.4, 0.9],
        size: [2, 6],
        gravity: 760
      });
      this.game.juice.popText('¡PICADA!', this.bobber.x, this.bobber.y - 62, {
        color: PALETTE.pineapple,
        size: 18,
        life: 0.75,
        vy: -30
      });
      this.game.juice.shakeAdd(0.12);
    }

    if (this.biteActive && time - this.biteStart > this.biteWindow) {
      this._escape('NO REACCIONASTE');
    }
  }

  onPointerDownInternal(input, event, point) {
    if (this.done || this.success || this.failed) return;
    const time = this.elapsed;
    if (this.biteActive && time - this.biteStart <= this.biteWindow) {
      const reaction = Math.max(0, time - this.biteStart);
      const quality = clamp(1 - (reaction / this.biteWindow) * 0.78);
      this.success = true;
      this.reaction = reaction;
      this.reactionQuality = quality;
      this.game.biteQuality = quality;
      this.game.registerHit(quality >= 0.65 ? 'perfect' : 'good', this.bobber.x, this.bobber.y - 40, {
        label: quality >= 0.65 ? '¡ENGANCHE PERFECTO!' : '¡ENGANCHADO!'
      });
      this.game.audio.play('select', { volume: 0.85 });
      this.game.juice.burst(this.bobber.x, this.bobber.y, 16, {
        speed: [60, 230],
        angle: [-Math.PI * 0.9, -Math.PI * 0.1],
        colors: [PALETTE.lagoonLight, PALETTE.cream, this.fishColor],
        life: [0.35, 0.8],
        size: [2, 5],
        gravity: 680,
        shape: ['circle', 'ring']
      });
      this.finish(quality, { reaction, fishId: this.fish?.id || null });
      return;
    }
    const early = time < this.biteAt;
    this._escape(early ? 'TE ADELANTASTE' : '¡SE ASUSTÓ!');
  }

  _escape(reason) {
    if (this.failed || this.success) return;
    this.failed = true;
    this.game.escaped = true;
    this.game.escapeReason = 'SE ESCAPÓ';
    this.game.audio.play('fail', { volume: 0.8 });
    this.game.registerMiss(this.bobber.x, this.bobber.y - 30, '¡SE ESCAPÓ!');
    this.game.juice.burst(this.bobber.x, this.bobber.y, 12, {
      speed: [40, 150],
      angle: [-Math.PI * 0.9, -Math.PI * 0.1],
      colors: [PALETTE.lagoon, PALETTE.steel, PALETTE.cream],
      life: [0.3, 0.7],
      size: [2, 5],
      gravity: 500,
      shape: 'circle'
    });
    this.finish(0.04, { skipRemaining: true, escaped: true, reason });
  }

  onTimeUp() {
    if (!this.success && !this.failed) this._escape('NO PICÓ A TIEMPO');
  }

  getScore() {
    return this.success ? clamp(this.reactionQuality) : 0.04;
  }

  render(ctx) {
    const time = this.elapsed;
    const base = this.bobber;
    const dip = this.biteActive ? 1 : this.falseActive ? 0.3 : 0;
    const bobY = base.y + dip * 12 + Math.sin(time * 2.1 + this.bobberPhase) * 2;
    const bobX = base.x + Math.sin(time * 1.3 + this.bobberPhase) * 2;

    drawWaterRipples(ctx, base.x, base.y + 8, 42, this.fishColor, time, 3);
    this.drawFish(ctx, base.x + Math.sin(time * 0.8) * 14, base.y + 42 + Math.sin(time * 1.4) * 4, 0.62, {
      alpha: this.biteActive ? 0.7 : 0.28,
      flipX: true,
      time
    });

    this.drawRod(ctx, this.rodBase.x, this.rodBase.y, this.rodTip.x, this.rodTip.y, {
      bend: this.biteActive ? 12 : 2,
      color: PALETTE.woodLight
    });
    this.drawFishingLine(ctx, this.rodTip.x, this.rodTip.y, bobX, bobY, this.biteActive ? 4 : 24);
    this.drawBobber(ctx, bobX, bobY, 0.8, 0);

    if (this.biteActive) {
      const pulse = 1 + Math.sin(time * 14) * 0.1;
      circle(ctx, bobX, bobY - 62, 20 * pulse, PALETTE.pineapple, PALETTE.ink, 4);
      text(ctx, '!', bobX, bobY - 61, {
        size: 26,
        family: '"Press Start 2P", monospace',
        color: PALETTE.ink
      });
      this.drawKitchenNote(ctx, '¡PULSA AHORA!', this.width * 0.5, this.height * 0.21, {
        size: 13,
        color: PALETTE.pineapple
      });
    } else if (this.falseActive) {
      circle(ctx, bobX, bobY - 54, 14, PALETTE.mango, PALETTE.ink, 3);
      text(ctx, '?', bobX, bobY - 53, {
        size: 18,
        family: '"Press Start 2P", monospace',
        color: PALETTE.ink
      });
      this.drawKitchenNote(ctx, 'TIRÓN FALSO · NO PULSES', this.width * 0.5, this.height * 0.21, {
        size: 10,
        color: PALETTE.mango
      });
    }

    this.drawCounterPill(ctx, this.success ? '¡ENGANCHADO!' : this.failed ? 'SE ESCAPÓ' : 'ESPERANDO LA PICADA', 16, this.height - 46, {
      width: 260,
      color: this.success ? PALETTE.lime : this.failed ? PALETTE.coral : PALETTE.lagoonLight
    });
    if (!this.biteActive && !this.success && !this.failed && this.elapsed < 2.4) {
      this.drawKitchenNote(ctx, 'SILENCIO... MIRA LA BOYA', this.width * 0.5, this.height * 0.21, {
        size: 10,
        color: PALETTE.paper
      });
    }
  }
}
