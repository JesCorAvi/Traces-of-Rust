// Fase 1 de pesca: cargar fuerza, apuntar a las ondas y soltar.
// Exports: CastPhase.

import { FishingPhase } from '../FishingPhase.js';
import { FISHING } from '../../../../config/chiringuito/fishing.js';
import { PALETTE } from '../../../assets/palette.js';
import {
  clamp, rand, fillRoundRect, strokeRoundRect, text, rgba
} from '../../../core/Draw.js';
import { drawWaterRipples } from '../FishingArt.js';

export class CastPhase extends FishingPhase {
  constructor({ difficulty } = {}) {
    super({
      id: 'cast',
      title: 'LANZAR',
      kicker: 'FASE 1 · CAÑA',
      instruction: 'Mantén pulsado para cargar la fuerza, apunta a las ondas y suelta en la zona verde.',
      gesture: 'gesture-hold',
      duration: FISHING.castDurationSec,
      weight: 1.0,
      hint: 'MANTÉN Y SUELTA · APUNTA A LAS ONDAS',
      accent: PALETTE.pineapple,
      difficulty
    });
  }

  updateLayout() {
    const w = this.width;
    const h = this.height;
    this.rodBase = { x: w * 0.18, y: h * 0.8 };
    this.rodTip = { x: w * 0.31, y: h * 0.49 };
    this.lake = { x0: w * 0.42, x1: w * 0.92, y0: h * 0.36, y1: h * 0.71 };
    this.powerBar = { x: w * 0.24, y: h * 0.86, w: w * 0.52, h: 26 };
    this.aim = { x: w * 0.55, y: h * 0.55 };
  }

  resetState() {
    this.power = 0;
    this.holding = false;
    this.released = false;
    this.releaseAt = 0;
    this.castAccuracy = 0;
    this.lastChargeSound = -1;
    this.splash = null;
    const lake = this.lake;
    this.target = {
      x: lake.x0 + rand(0.1, 0.9) * (lake.x1 - lake.x0),
      y: lake.y0 + rand(0.15, 0.85) * (lake.y1 - lake.y0)
    };
    this.aim = { x: lake.x0 + (lake.x1 - lake.x0) * 0.35, y: (lake.y0 + lake.y1) * 0.5 };
  }

  onUpdate(dt) {
    if (this.done) return;
    const input = this.game.input;
    if (!this.released) {
      if (input.x >= this.lake.x0 && input.x <= this.lake.x1 && input.y >= this.lake.y0 && input.y <= this.lake.y1) {
        this.aim.x = input.x;
        this.aim.y = input.y;
      }
      if (input.down) {
        this.holding = true;
        this.power = clamp(this.power + dt * FISHING.castChargeRate);
        if (this.elapsed - this.lastChargeSound > 0.26) {
          this.lastChargeSound = this.elapsed;
          this.game.audio.play('reel', { rate: 0.7 + this.power * 0.5, volume: 0.28 });
        }
      }
      if (input.justReleased && this.holding) this._cast(false);
    } else if (this.elapsed - this.releaseAt >= 0.42) {
      this.finish(this.getScore(), { castAccuracy: this.castAccuracy });
    }
  }

  onTimeUp() {
    if (!this.released) this._cast(true);
  }

  _cast(auto) {
    if (this.released) return;
    this.released = true;
    this.releaseAt = this.elapsed;
    if (auto) {
      this.power = Math.max(0.18, Math.min(0.42, this.power || 0.25));
      this.aim = {
        x: this.target.x + rand(-this.width * 0.08, this.width * 0.08),
        y: this.target.y + rand(-this.height * 0.05, this.height * 0.05)
      };
    }
    const center = (FISHING.castPerfectPowerMin + FISHING.castPerfectPowerMax) * 0.5;
    const half = Math.max(0.001, (FISHING.castPerfectPowerMax - FISHING.castPerfectPowerMin) * 0.5);
    const powerAccuracy = clamp(1 - Math.abs(this.power - center) / half);
    const tolerance = Math.max(30, this.width * FISHING.castAimTolerance);
    const aimDistance = Math.hypot(this.aim.x - this.target.x, this.aim.y - this.target.y);
    const aimAccuracy = clamp(1 - aimDistance / tolerance);
    this.castAccuracy = clamp(powerAccuracy * 0.55 + aimAccuracy * 0.45);
    this.game.castAccuracy = this.castAccuracy;
    this.game.castSpot = { x: this.aim.x, y: this.aim.y };
    this.game.rollFish(this.castAccuracy);

    const perfect = this.castAccuracy >= 0.72;
    if (this.castAccuracy < 0.24) {
      this.game.registerMiss(this.aim.x, this.aim.y - 24, '¡LANZAMIENTO FLOJO!');
    } else {
      this.game.registerHit(perfect ? 'perfect' : 'good', this.aim.x, this.aim.y - 24, {
        label: perfect ? '¡LANZAMIENTO PERFECTO!' : '¡BUEN LANZAMIENTO!'
      });
    }
    this.game.audio.play('whoosh', { rate: 1.1, volume: 0.85 });
    this.game.audio.play('splash', { rate: 1.05, volume: 0.5 });
    this.game.juice.burst(this.aim.x, this.aim.y, 18, {
      speed: [70, 260],
      angle: [-Math.PI * 0.9, -Math.PI * 0.1],
      colors: [PALETTE.lagoonLight, PALETTE.cream, PALETTE.lagoon, this.fishColor],
      life: [0.35, 0.9],
      size: [2, 5],
      gravity: 720,
      shape: ['circle', 'ring'],
      endSize: 0.5
    });
    this.game.juice.shakeAdd(perfect ? 0.13 : 0.07);
    this.splash = { x: this.aim.x, y: this.aim.y, at: this.elapsed };
  }

  getScore() {
    return this.released ? clamp(this.castAccuracy) : 0;
  }

  render(ctx) {
    const target = this.target;
    const aim = this.aim;
    const bar = this.powerBar;
    const flight = this.released ? clamp((this.elapsed - this.releaseAt) / 0.42) : 0;

    // Onda objetivo.
    this.drawTargetRipple(ctx, target.x, target.y, 42, PALETTE.pineapple);
    this.drawKitchenNote(ctx, 'ONDA', target.x, target.y - 38, {
      size: 9,
      color: PALETTE.pineapple
    });

    // Caña y línea.
    this.drawRod(ctx, this.rodBase.x, this.rodBase.y, this.rodTip.x, this.rodTip.y, {
      bend: -6,
      color: PALETTE.woodLight
    });
    const bobberX = this.released
      ? this.rodTip.x + (aim.x - this.rodTip.x) * flight
      : aim.x;
    const bobberY = this.released
      ? this.rodTip.y + (aim.y - this.rodTip.y) * flight - Math.sin(Math.PI * flight) * 70
      : aim.y;
    this.drawFishingLine(ctx, this.rodTip.x, this.rodTip.y, bobberX, bobberY, this.released ? 12 : 22);
    if (!this.released) {
      this.drawTargetRipple(ctx, aim.x, aim.y, 20, this._aimColor());
    } else {
      drawWaterRipples(ctx, aim.x, aim.y, 36, PALETTE.cream, this.elapsed, 3);
    }
    this.drawBobber(ctx, bobberX, bobberY, 0.75, this.released ? 0.4 : 0);

    // Barra de fuerza.
    fillRoundRect(ctx, bar.x - 8, bar.y - 12, bar.w + 16, bar.h + 42, 16, rgba(PALETTE.ink, 0.66));
    fillRoundRect(ctx, bar.x, bar.y, bar.w, bar.h, bar.h * 0.5, '#3b2518');
    const bandX = bar.x + bar.w * FISHING.castPerfectPowerMin;
    const bandW = bar.w * (FISHING.castPerfectPowerMax - FISHING.castPerfectPowerMin);
    const bandGrad = ctx.createLinearGradient(0, bar.y, 0, bar.y + bar.h);
    bandGrad.addColorStop(0, PALETTE.lime);
    bandGrad.addColorStop(1, '#3d9c3d');
    fillRoundRect(ctx, bandX, bar.y + 3, bandW, bar.h - 6, bar.h * 0.5, bandGrad);
    strokeRoundRect(ctx, bandX, bar.y + 3, bandW, bar.h - 6, bar.h * 0.5, PALETTE.cream, 2);
    const fillW = bar.w * this.power;
    if (fillW > 2) {
      const fillGrad = ctx.createLinearGradient(bar.x, 0, bar.x + fillW, 0);
      fillGrad.addColorStop(0, PALETTE.paper);
      fillGrad.addColorStop(0.6, PALETTE.pineapple);
      fillGrad.addColorStop(1, PALETTE.coral);
      fillRoundRect(ctx, bar.x + 2, bar.y + 2, fillW - 4, bar.h - 4, bar.h * 0.5, fillGrad);
    }
    const markerX = bar.x + fillW;
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(markerX, bar.y - 8);
    ctx.lineTo(markerX, bar.y + bar.h + 8);
    ctx.stroke();
    ctx.strokeStyle = PALETTE.cream;
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, 'SUAVE', bar.x + 4, bar.y + bar.h + 22, {
      size: 8, family: '"Press Start 2P", monospace', color: PALETTE.cream,
      align: 'left', outline: PALETTE.ink, outlineWidth: 3
    });
    text(ctx, 'FUERZA', bar.x + bar.w * 0.5, bar.y + bar.h + 22, {
      size: 8, family: '"Press Start 2P", monospace', color: PALETTE.pineapple,
      outline: PALETTE.ink, outlineWidth: 3
    });
    text(ctx, 'LEJOS', bar.x + bar.w - 4, bar.y + bar.h + 22, {
      size: 8, family: '"Press Start 2P", monospace', color: PALETTE.coral,
      align: 'right', outline: PALETTE.ink, outlineWidth: 3
    });

    this.drawPointerRing(ctx, aim.x, aim.y, this._aimColor(), 13);
    if (!this.released && this.elapsed < 2.2) {
      this.drawKitchenNote(ctx, 'APUNTA A LA ONDA Y SUELTA EN VERDE', this.width * 0.5, this.height * 0.21, {
        size: 10,
        color: PALETTE.paper
      });
    }
  }

  _aimColor() {
    const distance = Math.hypot(this.aim.x - this.target.x, this.aim.y - this.target.y);
    const tolerance = Math.max(30, this.width * FISHING.castAimTolerance);
    return distance <= tolerance ? PALETTE.lime : PALETTE.coral;
  }
}
