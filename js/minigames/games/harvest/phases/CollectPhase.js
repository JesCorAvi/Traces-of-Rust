// Fase 4 de cosecha: atrapar frutos que caen al ritmo de la cesta.
// Exports: CollectPhase.

import { HarvestPhase } from '../HarvestPhase.js';
import { PALETTE } from '../../../assets/palette.js';
import { drawBasket } from '../HarvestArt.js';
import { clamp, rand, circle, fillRoundRect, rgba } from '../../../core/Draw.js';

export class CollectPhase extends HarvestPhase {
  constructor(options = {}) {
    super({
      ...options,
      id: 'collect',
      title: 'RECOLECTAR',
      kicker: 'FASE 4 · RECOLECTAR',
      instruction: 'Atrapa los frutos que caen y colócalos en la cesta al ritmo. Encadena combos.',
      gesture: 'gesture-tap',
      duration: 11,
      weight: 1.1,
      hint: 'TOCA LOS FRUTOS SOBRE LA CESTA · ¡COMBO!',
      accent: PALETTE.pineapple
    });
  }

  updateLayout() {
    const w = this.width;
    const h = this.height;
    this.basket = {
      x: w * 0.5,
      y: h * 0.78,
      w: Math.min(w * 0.26, 260),
      h: Math.min(h * 0.16, 90)
    };
    this.basketCatchY = this.basket.y - this.basket.h * 0.42;
    this.spawnArea = { x0: w * 0.18, x1: w * 0.82, y0: h * 0.08 };
    this.fallSpeed = h * (0.34 + this.difficulty * 0.022);
    this.beatBar = { x: w * 0.24, y: h * 0.91, w: w * 0.52, h: 10 };
    this.itemScale = Math.max(0.45, Math.min(0.72, w / 1400));
  }

  resetState() {
    this.items = [];
    this.totalSpawn = 8 + (this.difficulty >= 4 ? 2 : 0);
    this.spawned = 0;
    this.caught = 0;
    this.missed = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.timingSum = 0;
    this.spawnTimer = 0.55;
    this.spawnInterval = Math.max(0.64, 0.95 - this.difficulty * 0.04);
    this.lastBeat = -1;
    this.completed = false;
    this.beatPhase = 0;
  }

  onPointerDownInternal(input, event, point) {
    if (this.done || this.completed) return;
    let nearest = null;
    let best = Infinity;
    for (const item of this.items) {
      const d = Math.hypot(point.x - item.x, point.y - item.y);
      const radius = 40 + item.scale * 26;
      if (d <= radius && d < best) {
        best = d;
        nearest = item;
      }
    }
    if (!nearest) return;
    nearest.caught = true;
    this.caught++;
    const distance = Math.abs(nearest.y - this.basketCatchY);
    let quality = 0.35;
    let label = '¡ATRAPADO!';
    if (distance <= this.basket.h * 0.08) {
      quality = 1;
      label = '¡PERFECTO!';
    } else if (distance <= this.basket.h * 0.22) {
      quality = 0.72;
      label = '¡BIEN!';
    }
    this.timingSum += quality;
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.game.registerHit(quality >= 0.7 ? 'perfect' : 'good', nearest.x, nearest.y - 20, {
      label,
      target: nearest.visual
    });
    this.game.audio.play('tap', { rate: quality >= 0.9 ? 1.25 : 1.0, volume: 0.7 });
    this.game.juice.burst(nearest.x, nearest.y, quality >= 0.7 ? 14 : 8, {
      speed: [60, 200],
      angle: [-Math.PI * 0.9, -Math.PI * 0.1],
      colors: [this.cropColor, PALETTE.pineapple, PALETTE.cream],
      life: [0.25, 0.7],
      size: [2, 5],
      gravity: 560,
      shape: ['circle', 'spark']
    });
    this.game.juice.splash(this.basket.x, this.basketCatchY, 10, {
      speed: [50, 170],
      angle: [-Math.PI * 0.9, -Math.PI * 0.1],
      colors: [PALETTE.lagoonLight, PALETTE.cream, this.cropColor],
      life: [0.25, 0.55],
      size: [1.5, 4],
      gravity: 580
    });
    this.items = this.items.filter(item => item !== nearest);
    this._checkComplete();
  }

  onUpdate(dt) {
    if (this.done || this.completed) return;
    const h = this.height;
    this.beatPhase += dt;
    if (this.spawned < this.totalSpawn) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnTimer = this.spawnInterval;
        this.spawned++;
        const item = {
          id: `fall_${this.spawned}`,
          x: rand(this.spawnArea.x0, this.spawnArea.x1),
          y: this.spawnArea.y0,
          scale: this.itemScale * rand(0.85, 1.15),
          vy: this.fallSpeed * rand(0.9, 1.12),
          rotation: rand(-0.2, 0.2),
          visual: { scaleX: 1, scaleY: 1 },
          caught: false
        };
        this.items.push(item);
        this.game.audio.play('pop', { rate: 1.05, volume: 0.35 });
      }
    }
    for (const item of [...this.items]) {
      item.y += item.vy * dt;
      item.rotation += dt * 0.5;
      if (item.y > this.basket.y + this.basket.h * 0.3) {
        item.missed = true;
        this.missed++;
        this.combo = 0;
        this.game.registerMiss(item.x, this.basket.y, '¡SE CAYÓ!');
        this.game.juice.burst(item.x, this.basket.y, 7, {
          speed: [30, 120],
          angle: [-Math.PI * 0.9, -Math.PI * 0.1],
          colors: [this.cropColor, PALETTE.coral, PALETTE.cream],
          life: [0.25, 0.55],
          size: [1.5, 4],
          gravity: 600,
          shape: 'circle'
        });
        this.items = this.items.filter(other => other !== item);
      }
    }
    this._checkComplete();
    if (this.elapsed >= this.duration && !this.completed) this.finish(this.getScore(), { timeUp: true });
  }

  onTimeUp() {
    if (!this.completed) this.finish(this.getScore(), { timeUp: true });
  }

  _checkComplete() {
    if (this.completed) return;
    if (this.spawned >= this.totalSpawn && this.items.length === 0) {
      this.completed = true;
      this.game.juice.confetti(this.basket.x, this.basket.y - 30, 28);
      this.finish(this.getScore(), { caught: this.caught, missed: this.missed, combos: this.maxCombo });
    }
  }

  getScore() {
    const total = Math.max(1, this.totalSpawn);
    const catchRatio = this.caught / total;
    const timing = this.caught > 0 ? this.timingSum / this.caught : 0;
    const combo = clamp(this.maxCombo / 6);
    return clamp(catchRatio * 0.65 + timing * 0.2 + combo * 0.15);
  }

  render(ctx) {
    const basket = this.basket;
    drawBasket(ctx, basket.x, basket.y, basket.w, basket.h, this.cropColor);

    for (const item of this.items) {
      this.drawProduce(ctx, item.x, item.y, item.scale, {
        rotation: item.rotation,
        sx: item.visual.scaleX,
        sy: item.visual.scaleY
      });
      if (item.y > basket.y - basket.h * 0.8) {
        this.drawPointerRing(ctx, item.x, item.y, PALETTE.pineapple, 18);
      }
    }

    // Barra de ritmo.
    const bar = this.beatBar;
    fillRoundRect(ctx, bar.x, bar.y, bar.w, bar.h, bar.h * 0.5, rgba(PALETTE.ink, 0.62));
    for (let i = 0; i < 8; i++) {
      circle(ctx, bar.x + (i / 8) * bar.w, bar.y + bar.h * 0.5, i % 2 === 0 ? 2.5 : 1.8, rgba(PALETTE.cream, 0.5));
    }
    const local = (this.spawnTimer / Math.max(0.01, this.spawnInterval));
    const pulseX = bar.x + (1 - clamp(local)) * bar.w;
    circle(ctx, pulseX, bar.y + bar.h * 0.5, 7, PALETTE.pineapple, PALETTE.ink, 2);
    this.drawNote(ctx, 'RITMO', bar.x - 28, bar.y + bar.h * 0.5, {
      size: 8,
      align: 'right',
      color: PALETTE.cream
    });

    this.drawNote(ctx, `ATRAPADOS ${this.caught}/${this.totalSpawn} · TOCA SOBRE LA CESTA`, this.width * 0.5, this.height * 0.2, {
      size: 9,
      color: this.combo >= 3 ? PALETTE.pineapple : PALETTE.paper
    });
  }
}
