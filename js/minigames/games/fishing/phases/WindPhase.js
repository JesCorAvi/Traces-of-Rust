// Fase 4 de pesca: girar el carrete para recoger el sedal antes de que escape.
// Exports: WindPhase.

import { FishingPhase } from '../FishingPhase.js';
import { FISHING, FISH_TYPES } from '../../../../config/chiringuito/fishing.js';
import { PALETTE } from '../../../assets/palette.js';
import { TAU, clamp, rand } from '../../../core/Draw.js';
import {
  drawProgressArc, drawReel, drawSpeedMeter, drawTensionMeter, drawWaterRipples
} from '../FishingArt.js';

export class WindPhase extends FishingPhase {
  constructor({ difficulty } = {}) {
    super({
      id: 'wind',
      title: 'RECOGER',
      kicker: 'FASE 4 · CARRETE',
      instruction: 'Gira el ratón alrededor del carrete para enrollar el sedal. Mantén un ritmo constante.',
      gesture: 'gesture-circle',
      duration: FISHING.windDurationSec,
      weight: 1.3,
      hint: 'GIRA EL CARRETE · RITMO CONSTANTE · NO TENSES DE MÁS',
      accent: PALETTE.lagoonLight,
      difficulty
    });
  }

  updateLayout() {
    const w = this.width;
    const h = this.height;
    this.rodBase = { x: w * 0.16, y: h * 0.8 };
    this.rodTip = { x: w * 0.3, y: h * 0.47 };
    this.reel = { x: w * 0.73, y: h * 0.57, r: Math.min(w, h) * 0.13 };
    this.circleTarget = {
      x: this.reel.x,
      y: this.reel.y,
      inner: this.reel.r * 0.35,
      outer: this.reel.r * 1.18
    };
    this.fishHome = { x: w * 0.35, y: h * 0.62 };
  }

  syncInputTarget() {
    this.game.input.setCircleTarget(this.circleTarget);
  }

  resetState() {
    const fish = this.game.fishType || FISH_TYPES.mackerel;
    this.turnsRequired = FISHING.windTurnsBase
      + Math.max(0.5, fish.weight) * FISHING.windTurnsPerWeight
      + (this.difficulty - 1) * 0.22;
    this.targetSpeed = FISHING.windTargetSpeed;
    this.speedTolerance = FISHING.windSpeedTolerance;
    this.turns = 0;
    this.progress = 0;
    this.tension = 0.05;
    this.speedScoreSum = 0;
    this.speedTime = 0;
    this.caught = false;
    this.failed = false;
    this.lastReel = -1;
    this.lastSplash = -1;
    this.circleStats = { turns: 0, angularSpeed: 0, consistency: 0 };
  }

  onUpdate(dt) {
    if (this.done || this.caught || this.failed) return;
    const input = this.game.input;
    const fish = this.game.fishType || FISH_TYPES.mackerel;
    const stats = input.getCircleStats();
    this.circleStats = stats;
    this.turns = stats.turns;
    this.progress = clamp(stats.turns / this.turnsRequired);

    if (stats.angularSpeed > 0.2) {
      const accuracy = clamp(1 - Math.abs(stats.angularSpeed - this.targetSpeed) / (this.targetSpeed * 1.15));
      this.speedScoreSum += accuracy * dt;
      this.speedTime += dt;
      if (stats.angularSpeed > this.targetSpeed * 1.55) {
        this.tension = clamp(this.tension + dt * 0.62 * fish.pull);
      } else if (stats.angularSpeed >= this.targetSpeed - this.speedTolerance
        && stats.angularSpeed <= this.targetSpeed + this.speedTolerance * 0.8) {
        this.tension = Math.max(0.03, this.tension - dt * 0.35);
      }
    }
    this.tension = clamp(this.tension + dt * 0.025 * fish.pull);

    if (this.elapsed - this.lastReel > 0.14 && stats.angularSpeed > 0.2) {
      this.lastReel = this.elapsed;
      this.game.audio.play('reel', { rate: 0.9 + Math.random() * 0.2, volume: 0.5 });
    }
    if (this.elapsed - this.lastSplash > 0.55) {
      this.lastSplash = this.elapsed;
      this.game.juice.particles.spawn({
        x: this.fishHome.x + rand(-26, 26),
        y: this.fishHome.y + rand(-6, 12),
        vx: rand(-40, 40),
        vy: rand(-100, -30),
        life: rand(0.25, 0.6),
        size: rand(2, 5),
        color: this.fishColor,
        gravity: 500,
        drag: 0.8,
        shape: 'circle',
        alpha: 0.8
      });
    }
    if (stats.angularSpeed > 0.5 && Math.random() < 0.3) {
      this.game.juice.particles.spawn({
        x: this.reel.x + rand(-20, 20),
        y: this.reel.y + rand(-16, 16),
        vx: rand(-30, 30),
        vy: rand(-60, -10),
        life: rand(0.2, 0.45),
        size: rand(1.5, 3),
        color: PALETTE.pineapple,
        gravity: 120,
        drag: 1,
        shape: 'spark',
        alpha: 0.8
      });
    }

    if (this.tension >= 1) {
      this._fail('LÍNEA ROTA');
      return;
    }
    if (stats.turns >= this.turnsRequired) {
      this.caught = true;
      this.game.registerHit('perfect', this.fishHome.x, this.fishHome.y - 24, {
        label: '¡PESCADO!'
      });
      this.game.audio.play('star', { rate: 1.1, volume: 0.85 });
      this.game.juice.confetti(this.fishHome.x, this.fishHome.y - 30, 30);
      this.game.juice.splash(this.fishHome.x, this.fishHome.y, 24, {
        speed: [100, 300],
        angle: [-Math.PI * 0.9, -Math.PI * 0.1],
        colors: [PALETTE.lagoonLight, PALETTE.cream, this.fishColor, PALETTE.pineapple],
        life: [0.4, 1],
        size: [2, 6],
        gravity: 760
      });
      this.finish(this.getScore(), { caught: true });
    }
  }

  onTimeUp() {
    if (this.caught || this.failed) return;
    this.game.escaped = true;
    this.game.escapeReason = 'SE ESCAPÓ';
    this.game.registerMiss(this.fishHome.x, this.fishHome.y - 20, '¡SE ESCAPÓ!');
    this.finish(0.08, { escaped: true });
  }

  _fail(reason) {
    if (this.failed || this.caught) return;
    this.failed = true;
    this.game.escaped = true;
    this.game.escapeReason = reason;
    this.game.audio.play('fail', { volume: 0.85 });
    this.game.registerMiss(this.fishHome.x, this.fishHome.y - 20, '¡LÍNEA ROTA!');
    this.game.juice.burst(this.fishHome.x, this.fishHome.y, 20, {
      speed: [60, 220],
      angle: [-Math.PI * 0.9, -Math.PI * 0.1],
      colors: [PALETTE.lagoon, PALETTE.steel, PALETTE.cream],
      life: [0.35, 0.9],
      size: [2, 6],
      gravity: 700
    });
    this.finish(0.05, { skipRemaining: true, escaped: true, reason });
  }

  getScore() {
    const speed = this.speedTime > 0 ? clamp(this.speedScoreSum / this.speedTime) : 0;
    const turns = clamp(this.turns / this.turnsRequired);
    const timeBonus = clamp(1 - this.elapsed / this.duration * 0.3);
    return clamp(turns * 0.55 + speed * 0.25 + (1 - this.tension) * 0.15 + timeBonus * 0.05);
  }

  render(ctx) {
    const reel = this.reel;
    const fish = this.game.fishType || FISH_TYPES.mackerel;
    const fishX = this.fishHome.x + Math.sin(this.elapsed * 1.4) * 12;
    const fishY = this.fishHome.y + Math.sin(this.elapsed * 1.8) * 8;
    const input = this.game.input;
    const progress = clamp(this.turns / this.turnsRequired);
    const speed = this.circleStats.angularSpeed || 0;

    drawWaterRipples(ctx, fishX, fishY + 18, 54, this.fishColor, this.elapsed, 3);
    this.drawFish(ctx, fishX, fishY, (fish.scale || 1) * 0.95, {
      flipX: true,
      rotation: Math.sin(this.elapsed * 1.6) * 0.05,
      time: this.elapsed
    });

    this.drawRod(ctx, this.rodBase.x, this.rodBase.y, this.rodTip.x, this.rodTip.y, {
      bend: -3,
      color: PALETTE.woodLight
    });
    this.drawFishingLine(ctx, this.rodTip.x, this.rodTip.y, fishX + 20, fishY - 8, 8);
    this.drawFishingLine(ctx, this.rodTip.x, this.rodTip.y, reel.x - reel.r * 0.8, reel.y - 4, 3);

    const guideR = (this.circleTarget.inner + this.circleTarget.outer) * 0.5;
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = PALETTE.lagoonLight;
    ctx.lineWidth = Math.max(10, this.circleTarget.outer - this.circleTarget.inner);
    ctx.beginPath();
    ctx.arc(reel.x, reel.y, guideR, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 0.85;
    ctx.setLineDash([8, 10]);
    ctx.lineWidth = 4;
    ctx.strokeStyle = PALETTE.cream;
    ctx.beginPath();
    ctx.arc(reel.x, reel.y, guideR, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    drawReel(ctx, reel.x, reel.y, reel.r, input.circle.totalAngle || this.turns * TAU, this.elapsed);
    drawProgressArc(ctx, reel.x, reel.y, reel.r * 1.48, progress, PALETTE.lagoonLight, 9);
    const pointerX = input.down || input.x ? input.x : reel.x + guideR;
    const pointerY = input.down || input.y ? input.y : reel.y;
    if (input.x || input.down) this.drawPointerRing(ctx, pointerX, pointerY, speed >= this.targetSpeed - this.speedTolerance ? PALETTE.lime : PALETTE.coral, 15);

    this.drawCounterPill(ctx, `VUELTAS ${this.turns.toFixed(1)} / ${this.turnsRequired.toFixed(1)}`, 16, this.height - 46, {
      width: 260,
      color: PALETTE.lagoonLight
    });
    drawSpeedMeter(ctx, this.width * 0.44, this.height * 0.85, Math.min(250, this.width * 0.28), speed, this.targetSpeed, this.speedTolerance);
    drawTensionMeter(ctx, reel.x + reel.r + 34, reel.y - reel.r, 14, reel.r * 2, this.tension);

    this.drawKitchenNote(ctx, speed > this.targetSpeed * 1.55 ? '¡DEMASIADO RÁPIDO!' : 'GIRA EL CARRETE', this.width * 0.5, this.height * 0.21, {
      size: 10,
      color: speed > this.targetSpeed * 1.55 ? PALETTE.coral : PALETTE.paper
    });
  }
}
