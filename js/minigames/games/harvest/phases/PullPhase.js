// Fase 1 de cosecha: arrancar la planta con un tirón constante y controlado.
// Exports: PullPhase.

import { HarvestPhase } from '../HarvestPhase.js';
import { PALETTE } from '../../../assets/palette.js';
import { drawSoilPatch, drawForceMeter } from '../HarvestArt.js';
import {
  TAU, clamp, rand, circle, text, rgba, drawHand
} from '../../../core/Draw.js';

export class PullPhase extends HarvestPhase {
  constructor(options = {}) {
    super({
      ...options,
      id: 'pull',
      title: 'ARRANCAR',
      kicker: 'FASE 1 · ARRANCAR',
      instruction: 'Agarra la planta y arrastra hacia arriba con un tirón constante. Si tiras demasiado, se rompe.',
      gesture: 'gesture-drag',
      duration: 10,
      weight: 1.2,
      hint: 'ARRASTRA HACIA ARRIBA · TIRÓN CONSTANTE · NO ROMPAS EL TALLO',
      accent: PALETTE.lime
    });
  }

  updateLayout() {
    const w = this.width;
    const h = this.height;
    const plotW = Math.min(w * 0.56, 440);
    const plotH = Math.min(h * 0.24, 150);
    this.plot = { x: w * 0.5 - plotW / 2, y: h * 0.63, w: plotW, h: plotH };
    this.plantBase = { x: w * 0.5, y: h * 0.64 };
    this.plantScale = Math.max(0.75, Math.min(w / 900, h / 560) * 1.1);
    const produceHeight = Math.max(0.5, this.crop?.height || 0.8);
    this.produceRest = {
      x: this.plantBase.x,
      y: this.plantBase.y - produceHeight * 58 * this.plantScale
    };
    this.requiredPull = h * (0.2 + this.cropForce * 0.12);
    this.idealMin = clamp(0.35 + this.cropForce * 0.14, 0.3, 0.58);
    this.idealMax = clamp(this.idealMin + 0.3, 0.58, 0.9);
    this.grabRadius = Math.max(42, 52 * this.plantScale);
    this.forceBar = { x: w * 0.24, y: h * 0.87, w: w * 0.52, h: 24 };
  }

  resetState() {
    this.pulling = false;
    this.progress = 0;
    this.totalPull = 0;
    this.lastY = 0;
    this.force = 0;
    this.forceQualitySum = 0;
    this.forceTime = 0;
    this.damage = 0;
    this.broken = false;
    this.completed = false;
    this.lastPullSound = -1;
    this.plantShake = 0;
    this.lastDirt = -1;
  }

  onPointerDownInternal(input, event, point) {
    if (this.done || this.broken || this.completed) return;
    const pos = this._producePosition();
    if (Math.hypot(point.x - pos.x, point.y - pos.y) > this.grabRadius) return;
    this.pulling = true;
    this.lastY = input.y;
    this.game.audio.play('pull', { volume: 0.55 });
  }

  onPointerUpInternal() {
    this.pulling = false;
    this.force = 0;
  }

  onUpdate(dt) {
    if (this.done || this.broken || this.completed) return;
    const input = this.game.input;
    if (this.pulling && input.down) {
      const up = Math.max(0, this.lastY - input.y);
      this.lastY = input.y;
      this.totalPull += up;
      this.progress = clamp(this.totalPull / Math.max(1, this.requiredPull));
      this.force = input.dy < -0.2 ? clamp(input.speed / 700) : 0;
      const center = (this.idealMin + this.idealMax) * 0.5;
      const half = Math.max(0.001, (this.idealMax - this.idealMin) * 0.5);
      if (this.force >= this.idealMin && this.force <= this.idealMax) {
        this.forceQualitySum += clamp(1 - Math.abs(this.force - center) / half) * dt;
        this.forceTime += dt;
        this.plantShake = Math.max(this.plantShake, 0.4);
      } else if (this.force > this.idealMax * 1.25) {
        this.damage = clamp(this.damage + dt * 0.72);
        this.plantShake = 1.3;
        if (this.elapsed - this.lastPullSound > 0.25) {
          this.lastPullSound = this.elapsed;
          this.game.audio.play('error', { rate: 0.8, volume: 0.42 });
        }
      }
      if (up > 0 && this.elapsed - this.lastDirt > 0.08) {
        this.lastDirt = this.elapsed;
        this.game.juice.particles.spawn({
          x: this.plantBase.x + rand(-24, 24),
          y: this.plantBase.y + rand(-4, 10),
          vx: rand(-60, 60),
          vy: rand(-120, -30),
          life: rand(0.3, 0.7),
          size: rand(2, 6),
          color: rand(0, 1) > 0.45 ? '#5c3b25' : '#7a5133',
          gravity: 620,
          drag: 0.9,
          shape: 'circle',
          alpha: 0.8
        });
      }
      if (this.damage >= 1) {
        this._break();
        return;
      }
      if (this.progress >= 1) {
        this.completed = true;
        this.game.registerHit('perfect', this.plantBase.x, this.produceRest.y - 20, {
          label: '¡ARRANCÓ LIMPIO!'
        });
        this.game.audio.play('harvest', { volume: 0.9 });
        this.game.juice.burst(this.plantBase.x, this.plantBase.y - 10, 22, {
          speed: [80, 260],
          angle: [-Math.PI * 0.9, -Math.PI * 0.1],
          colors: ['#5c3b25', '#7a5133', PALETTE.lime, this.cropColor],
          life: [0.35, 0.9],
          size: [2, 6],
          gravity: 700,
          shape: ['circle', 'leaf']
        });
        this.game.juice.shakeAdd(0.12);
        this.finish(this.getScore(), { broken: false, damage: this.damage });
      }
    } else {
      this.force = Math.max(0, this.force - dt * 3);
    }
    this.plantShake = Math.max(0, this.plantShake - dt * 2.5);
  }

  _break() {
    if (this.broken || this.completed) return;
    this.broken = true;
    this.game.harvestBroken = true;
    this.game.audio.play('fail', { volume: 0.85 });
    this.game.registerMiss(this.plantBase.x, this.produceRest.y, '¡TALLO ROTO!');
    this.game.juice.burst(this.plantBase.x, this.produceRest.y, 18, {
      speed: [60, 220],
      angle: [-Math.PI * 0.9, -Math.PI * 0.1],
      colors: [PALETTE.coral, PALETTE.tomatoDark, '#5c3b25'],
      life: [0.35, 0.8],
      size: [2, 6],
      gravity: 680,
      shape: ['circle', 'leaf']
    });
    this.game.juice.shakeAdd(0.24);
    this.finish(0.06, { skipRemaining: true, broken: true });
  }

  onTimeUp() {
    if (!this.completed && !this.broken) {
      this.game.registerMiss(this.plantBase.x, this.produceRest.y, this.progress > 0.5 ? '¡CASI!' : '¡NO ARRANCÓ!');
      this.game.harvestWeak = true;
    }
  }

  getScore() {
    if (this.broken) return 0.06;
    if (this.progress <= 0.01 && this.forceTime <= 0) return 0;
    const forceQuality = this.forceTime > 0 ? this.forceQualitySum / this.forceTime : 0;
    return clamp(this.progress * 0.6 + forceQuality * 0.25 + (1 - this.damage) * 0.15);
  }

  _producePosition() {
    const lift = this.progress * 26 * this.plantScale;
    return {
      x: this.produceRest.x,
      y: this.produceRest.y - lift
    };
  }

  render(ctx) {
    const plot = this.plot;
    drawSoilPatch(ctx, plot.x, plot.y, plot.w, plot.h, this.elapsed);
    const produce = this._producePosition();
    this.drawCropPlant(ctx, this.plantBase.x, this.plantBase.y, this.plantScale, {
      pull: this.progress,
      time: this.elapsed,
      broken: this.broken,
      shake: this.plantShake
    });
    this.drawProduce(ctx, produce.x, produce.y, Math.max(0.55, this.plantScale * 0.8), {
      rotation: this.progress * 0.18,
      sy: 1 + Math.sin(this.elapsed * 3) * 0.02
    });
    // Raíces al salir.
    if (this.progress > 0.2) {
      ctx.save();
      ctx.strokeStyle = '#b07a4b';
      ctx.lineWidth = 3;
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI * 0.2 - (i / 5) * Math.PI * 0.6;
        ctx.beginPath();
        ctx.moveTo(this.plantBase.x, this.plantBase.y + 6);
        ctx.quadraticCurveTo(
          this.plantBase.x + Math.cos(a) * 24 * this.progress,
          this.plantBase.y + Math.sin(a) * 14 * this.progress,
          this.plantBase.x + Math.cos(a) * 42 * this.progress,
          this.plantBase.y + Math.sin(a) * 24 * this.progress
        );
        ctx.stroke();
      }
      ctx.restore();
    }

    if (this.pulling) {
      const input = this.game.input;
      drawHand(ctx, input.x, input.y, 0.62, -0.1, PALETTE.cream);
      this.drawPointerRing(ctx, input.x, input.y, this.force >= this.idealMin && this.force <= this.idealMax ? PALETTE.lime : PALETTE.coral, 18);
    } else if (!this.completed && !this.broken) {
      const cx = produce.x;
      const cy = produce.y + this.grabRadius * 0.65;
      this.drawNote(ctx, 'AGARRA Y TIRA', cx, cy, { size: 9, color: PALETTE.cream });
      this.drawPointerRing(ctx, produce.x, produce.y, PALETTE.pineapple, 17);
    }

    drawForceMeter(ctx, this.forceBar.x, this.forceBar.y, this.forceBar.w, this.forceBar.h, this.force, this.idealMin, this.idealMax);
    this.drawCounterPill(ctx, `ARRANQUE ${Math.round(this.progress * 100)}%`, 16, 64, {
      width: 160,
      size: 9,
      color: this.broken ? PALETTE.coral : PALETTE.lime
    });
    if (this.damage > 0.25) {
      this.drawNote(ctx, '¡TALLO AL LÍMITE!', this.width * 0.5, this.height * 0.24, {
        size: 11,
        color: PALETTE.coral
      });
    }
    this.drawNote(ctx, 'TIRA HACIA ARRIBA', this.width * 0.5, this.height * 0.2, {
      size: 10,
      color: PALETTE.paper
    });
  }
}
