// Fase 3 de pesca: seguir al pez con el cursor y controlar la tensión.
// Exports: ReelPhase.

import { FishingPhase } from '../FishingPhase.js';
import { FISHING, FISH_TYPES } from '../../../../config/chiringuito/fishing.js';
import { PALETTE } from '../../../assets/palette.js';
import {
  TAU, clamp, rand, fillRoundRect, strokeRoundRect, text, rgba
} from '../../../core/Draw.js';
import { drawTensionMeter, drawWaterRipples } from '../FishingArt.js';

export class ReelPhase extends FishingPhase {
  constructor({ difficulty } = {}) {
    super({
      id: 'reel',
      title: 'FORCEJEAR',
      kicker: 'FASE 3 · TENSIÓN',
      instruction: 'Mueve el cursor arriba y abajo para mantener la marca dentro del pez. Si sales, la línea se tensa.',
      gesture: 'gesture-drag',
      duration: FISHING.reelPhaseDurationSec,
      weight: 1.3,
      hint: 'SIGUE AL PEZ · NO DEJES QUE LA LÍNEA SE ROMPA',
      accent: PALETTE.coral,
      difficulty
    });
  }

  updateLayout() {
    const w = this.width;
    const h = this.height;
    this.rodBase = { x: w * 0.17, y: h * 0.8 };
    this.rodTip = { x: w * 0.3, y: h * 0.47 };
    this.bar = { x: w * 0.79, y: h * 0.23, w: Math.max(40, w * 0.08), h: h * 0.52 };
    this.progressBar = { x: w * 0.25, y: h * 0.85, w: w * 0.36, h: 16 };
    this.fishHome = { x: w * 0.43, y: h * 0.62 };
  }

  resetState() {
    const fish = this.game.fishType || FISH_TYPES.mackerel;
    this.zoneH = clamp(this.bar.h * (0.26 - this.difficulty * 0.014), this.bar.h * 0.12, this.bar.h * 0.28);
    this.zonePhase = rand(0, TAU);
    this.zoneSpeed = 1.15 + fish.speed * 0.8 + this.difficulty * 0.08;
    this.zoneAmp = this.bar.h * (0.2 + fish.erratic * 0.055);
    this.rate = FISHING.reelProgressPerSecond / (1 + Math.max(0, fish.weight - 1) * 0.26);
    this.progress = 0;
    this.tension = 0.06;
    this.inZoneTime = 0;
    this.totalTime = 0;
    this.zoneCenter = this.bar.y + this.bar.h * 0.5;
    this.hookY = this.bar.y + this.bar.h * 0.5;
    this.lastReel = -1;
    this.lastSplash = -1;
    this.caught = false;
    this.failed = false;
    this.trackingQuality = 0;
  }

  onUpdate(dt) {
    if (this.done || this.caught || this.failed) return;
    const input = this.game.input;
    const fish = this.game.fishType || FISH_TYPES.mackerel;
    const bar = this.bar;
    const time = this.elapsed;
    this.totalTime += dt;

    this.zoneCenter = bar.y + bar.h * 0.5
      + Math.sin(time * this.zoneSpeed + this.zonePhase) * this.zoneAmp
      + Math.sin(time * this.zoneSpeed * 1.8 + this.zonePhase * 2) * this.zoneAmp * 0.22 * fish.erratic;
    this.zoneCenter = clamp(this.zoneCenter, bar.y + this.zoneH * 0.5, bar.y + bar.h - this.zoneH * 0.5);
    const zoneTop = this.zoneCenter - this.zoneH * 0.5;
    const zoneBottom = this.zoneCenter + this.zoneH * 0.5;
    this.hookY = clamp(input.y, bar.y, bar.y + bar.h);
    const inside = this.hookY >= zoneTop && this.hookY <= zoneBottom;

    if (inside) {
      this.inZoneTime += dt;
      this.progress = clamp(this.progress + this.rate * dt);
      this.tension = Math.max(0.02, this.tension - FISHING.reelTensionFall * dt);
      if (time - this.lastReel > 0.12) {
        this.lastReel = time;
        this.game.audio.play('reel', { rate: 0.9 + Math.random() * 0.16, volume: 0.45 });
        const sx = this.fishHome.x + this.fishScaleXOffset();
        this.game.juice.particles.spawn({
          x: sx + rand(-16, 16),
          y: this.fishHome.y + rand(-10, 10),
          vx: rand(-20, 20),
          vy: rand(-50, -10),
          life: rand(0.2, 0.45),
          size: rand(1.5, 3.5),
          color: this.fishColor,
          gravity: 200,
          drag: 1,
          shape: 'circle',
          alpha: 0.7
        });
      }
    } else {
      this.progress = Math.max(0, this.progress - FISHING.reelDrainPerSecond * dt);
      this.tension = clamp(this.tension + FISHING.reelTensionRise * fish.pull * dt);
      if (time - this.lastSplash > 0.38) {
        this.lastSplash = time;
        this.game.audio.play('splash', { rate: 0.9 + Math.random() * 0.2, volume: 0.58 });
        this.game.juice.splash(this.fishHome.x, this.fishHome.y + 10, 8, {
          speed: [50, 180],
          angle: [-Math.PI * 0.9, -Math.PI * 0.1],
          colors: [PALETTE.lagoonLight, PALETTE.cream, this.fishColor],
          life: [0.25, 0.55],
          size: [1.5, 4],
          gravity: 680
        });
        this.game.juice.shakeAdd(0.06);
      }
    }
    this.tension = clamp(this.tension + dt * 0.018 * fish.pull);

    if (this.tension >= 1) {
      this._fail('LÍNEA ROTA');
      return;
    }
    if (this.progress >= 1) {
      this.caught = true;
      this.game.registerHit('perfect', this.fishHome.x, this.fishHome.y - 20, {
        label: '¡PEZ CANSADO!'
      });
      this.game.juice.burst(this.fishHome.x, this.fishHome.y, 18, {
        speed: [60, 220],
        angle: [-Math.PI * 0.9, -Math.PI * 0.1],
        colors: [PALETTE.lagoonLight, PALETTE.cream, this.fishColor],
        life: [0.35, 0.8],
        size: [2, 5],
        gravity: 620
      });
      this.finish(this.getScore(), { caught: true });
    }
  }

  onTimeUp() {
    if (this.caught || this.failed) return;
    if (this.progress >= 0.55) {
      this.finish(this.getScore(), { timeUp: true });
    } else {
      this._fail('SE ESCAPÓ');
    }
  }

  _fail(reason) {
    if (this.failed || this.caught) return;
    this.failed = true;
    this.game.escaped = true;
    this.game.escapeReason = reason;
    this.game.audio.play('fail', { volume: 0.82 });
    this.game.registerMiss(this.fishHome.x, this.fishHome.y - 20, '¡SE ESCAPÓ!');
    this.game.juice.burst(this.fishHome.x, this.fishHome.y, 20, {
      speed: [50, 210],
      angle: [-Math.PI * 0.9, -Math.PI * 0.1],
      colors: [PALETTE.lagoon, PALETTE.steel, PALETTE.cream],
      life: [0.35, 0.9],
      size: [2, 6],
      gravity: 680
    });
    this.finish(0.05, { skipRemaining: true, escaped: true, reason });
  }

  getScore() {
    const tracking = this.totalTime > 0 ? this.inZoneTime / this.totalTime : 0;
    return clamp(this.progress * 0.62 + tracking * 0.23 + (1 - this.tension) * 0.15);
  }

  fishScaleXOffset() {
    return Math.sin(this.elapsed * 1.2) * 12;
  }

  render(ctx) {
    const bar = this.bar;
    const fish = this.game.fishType || FISH_TYPES.mackerel;
    const fishX = this.fishHome.x + this.fishScaleXOffset();
    const fishY = this.fishHome.y + (this.zoneCenter - (bar.y + bar.h * 0.5)) * 0.5;
    const zoneTop = this.zoneCenter - this.zoneH * 0.5;
    const zoneBottom = this.zoneCenter + this.zoneH * 0.5;
    const inside = this.hookY >= zoneTop && this.hookY <= zoneBottom;

    drawWaterRipples(ctx, fishX, fishY + 22, 48, this.fishColor, this.elapsed, 3);
    this.drawFish(ctx, fishX, fishY, (fish.scale || 1) * 0.95, {
      flipX: true,
      rotation: Math.sin(this.elapsed * 1.4) * 0.04,
      time: this.elapsed
    });

    this.drawRod(ctx, this.rodBase.x, this.rodBase.y, this.rodTip.x, this.rodTip.y, {
      bend: inside ? 2 : 11,
      color: PALETTE.woodLight
    });
    this.drawFishingLine(ctx, this.rodTip.x, this.rodTip.y, fishX + 24, fishY - 8, inside ? 16 : 4);

    // Barra de seguimiento.
    fillRoundRect(ctx, bar.x - 12, bar.y - 16, bar.w + 24, bar.h + 32, 16, rgba(PALETTE.ink, 0.56));
    strokeRoundRect(ctx, bar.x - 12, bar.y - 16, bar.w + 24, bar.h + 32, 16, rgba(PALETTE.cream, 0.18), 2);
    fillRoundRect(ctx, bar.x, bar.y, bar.w, bar.h, bar.w * 0.45, rgba(PALETTE.ink, 0.5));
    const zoneGrad = ctx.createLinearGradient(0, zoneTop, 0, zoneBottom);
    zoneGrad.addColorStop(0, rgba(this.fishColor, 0.45));
    zoneGrad.addColorStop(0.5, rgba(this.fishColor, 0.8));
    zoneGrad.addColorStop(1, rgba(this.fishColor, 0.45));
    fillRoundRect(ctx, bar.x + 2, zoneTop, bar.w - 4, this.zoneH, bar.w * 0.42, zoneGrad);
    strokeRoundRect(ctx, bar.x + 2, zoneTop, bar.w - 4, this.zoneH, bar.w * 0.42, rgba(PALETTE.cream, 0.55), 2);
    // Marcador del jugador.
    const markerColor = inside ? PALETTE.lime : PALETTE.coral;
    ctx.save();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(bar.x - 10, this.hookY);
    ctx.lineTo(bar.x + bar.w + 10, this.hookY);
    ctx.stroke();
    ctx.strokeStyle = markerColor;
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.fillStyle = markerColor;
    ctx.beginPath();
    ctx.moveTo(bar.x + bar.w + 16, this.hookY);
    ctx.lineTo(bar.x + bar.w + 6, this.hookY - 7);
    ctx.lineTo(bar.x + bar.w + 6, this.hookY + 7);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Progreso.
    const pb = this.progressBar;
    fillRoundRect(ctx, pb.x - 8, pb.y - 8, pb.w + 16, pb.h + 34, 12, rgba(PALETTE.ink, 0.62));
    fillRoundRect(ctx, pb.x, pb.y, pb.w, pb.h, pb.h * 0.5, '#3b2518');
    const progGrad = ctx.createLinearGradient(pb.x, 0, pb.x + pb.w, 0);
    progGrad.addColorStop(0, PALETTE.lagoonLight);
    progGrad.addColorStop(1, PALETTE.lime);
    fillRoundRect(ctx, pb.x + 2, pb.y + 2, Math.max(0, (pb.w - 4) * this.progress), pb.h - 4, pb.h * 0.5, progGrad);
    strokeRoundRect(ctx, pb.x, pb.y, pb.w, pb.h, pb.h * 0.5, PALETTE.ink, 2);
    text(ctx, `PROGRESO ${Math.round(this.progress * 100)}%`, pb.x + pb.w * 0.5, pb.y + pb.h + 20, {
      size: 8,
      family: '"Press Start 2P", monospace',
      color: PALETTE.cream,
      outline: PALETTE.ink,
      outlineWidth: 3
    });

    drawTensionMeter(ctx, bar.x + bar.w + 38, bar.y, 14, bar.h, this.tension);

    this.drawCounterPill(ctx, inside ? '¡MANTÉN!' : '¡FUERA DE LA ZONA!', 16, this.height - 46, {
      width: 240,
      color: markerColor
    });
    if (this.elapsed < 2.4) {
      this.drawKitchenNote(ctx, 'SIGUE AL PEZ CON EL CURSOR', this.width * 0.5, this.height * 0.21, {
        size: 10,
        color: PALETTE.paper
      });
    }
  }
}
