// Fase 2 de siembra: soltar semillas en la cuadrícula con buen espaciado.
// Exports: SowPhase.

import { PlantingPhase } from '../PlantingPhase.js';
import { PALETTE } from '../../../assets/palette.js';
import { drawGrid } from '../PlantingArt.js';
import { clamp, circle, drawHand, rgba } from '../../../core/Draw.js';

export class SowPhase extends PlantingPhase {
  constructor(options = {}) {
    super({
      ...options,
      id: 'sow',
      title: 'SEMBRAR',
      kicker: 'FASE 2 · SEMBRAR',
      instruction: 'Toca las marcas de la cuadrícula para soltar una semilla en cada una. Respeta el espaciado.',
      gesture: 'gesture-tap',
      duration: 9,
      weight: 1.1,
      hint: 'TOCA LAS MARCAS · UNA SEMILLA POR HUECO',
      accent: PALETTE.lime
    });
  }

  updateLayout() {
    const w = this.width;
    const h = this.height;
    this.bed = { x: w * 0.12, y: h * 0.42, w: w * 0.76, h: h * 0.28 };
    this.rows = 2;
    this.cols = 3;
    this.targets = [];
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        this.targets.push({
          x: this.bed.x + this.bed.w * ((col + 0.5) / this.cols),
          y: this.bed.y + this.bed.h * ((row + 0.58) / this.rows),
          planted: false,
          accuracy: 0
        });
      }
    }
    this.seedHome = { x: w * 0.82, y: h * 0.72 };
    this.tapRadius = Math.max(34, 58 - this.difficulty * 5);
  }

  resetState() {
    this.planted = 0;
    this.hits = 0;
    this.misses = 0;
    this.accuracySum = 0;
    this.completed = false;
    this.lastTextAt = -1;
    for (const target of this.targets) {
      target.planted = false;
      target.accuracy = 0;
    }
  }

  onPointerDownInternal(input, event, point) {
    if (this.done || this.completed) return;
    let nearest = null;
    let best = Infinity;
    for (const target of this.targets) {
      if (target.planted) continue;
      const d = Math.hypot(point.x - target.x, point.y - target.y);
      if (d < this.tapRadius && d < best) {
        best = d;
        nearest = target;
      }
    }
    if (!nearest) {
      const bed = this.bed;
      if (point.x >= bed.x && point.x <= bed.x + bed.w && point.y >= bed.y && point.y <= bed.y + bed.h) {
        this.misses++;
        this.game.registerMiss(point.x, point.y, '¡HUECO EQUIVOCADO!');
        this.game.audio.play('error', { rate: 0.9, volume: 0.4 });
      }
      return;
    }
    const accuracy = clamp(1 - best / this.tapRadius);
    nearest.planted = true;
    nearest.accuracy = accuracy;
    this.planted++;
    this.hits++;
    this.accuracySum += accuracy;
    const showText = this.planted >= this.targets.length || this.elapsed - this.lastTextAt > 0.28;
    if (showText) this.lastTextAt = this.elapsed;
    this.game.registerHit(accuracy > 0.65 ? 'perfect' : 'good', nearest.x, nearest.y - 20, {
      label: accuracy > 0.65 ? '¡SEMILLA!' : '¡SEMBRADA!',
      showText
    });
    this.game.audio.play('sow', { rate: 1.02, volume: 0.7 });
    this.game.juice.burst(nearest.x, nearest.y, 10, {
      speed: [30, 130],
      angle: [-Math.PI * 0.9, -Math.PI * 0.1],
      colors: ['#5c3b25', PALETTE.lime, PALETTE.pineapple],
      life: [0.25, 0.6],
      size: [1.5, 4],
      gravity: 480,
      shape: 'circle'
    });
    if (this.planted >= this.targets.length) {
      this.completed = true;
      this.game.juice.confetti(this.width * 0.5, this.bed.y, 20);
      this.finish(this.getScore(), { planted: this.planted, misses: this.misses });
    }
  }

  onTimeUp() {
    if (!this.completed) {
      this.game.registerMiss(this.width * 0.5, this.bed.y, `¡FALTARON ${this.targets.length - this.planted} SEMILLAS!`);
      this.game.plantWeak = true;
    }
  }

  getScore() {
    if (this.planted === 0) return 0;
    const completion = clamp(this.planted / this.targets.length);
    const accuracy = this.accuracySum / this.planted;
    const attempts = this.hits + this.misses;
    const clean = attempts > 0 ? clamp(1 - this.misses / attempts) : 0;
    return clamp(completion * 0.65 + accuracy * 0.25 + clean * 0.1);
  }

  render(ctx) {
    const bed = this.bed;
    this.drawBed(ctx, bed.x, bed.y, bed.w, bed.h, this.elapsed);
    drawGrid(ctx, bed, this.rows, this.cols, { color: rgba(PALETTE.cream, 0.22) });
    for (const target of this.targets) {
      const color = target.planted ? PALETTE.lime : PALETTE.pineapple;
      ctx.save();
      ctx.globalAlpha = target.planted ? 0.9 : 0.7;
      ctx.setLineDash(target.planted ? [] : [6, 7]);
      circle(ctx, target.x, target.y, 24, null, PALETTE.ink, 5);
      circle(ctx, target.x, target.y, 24, null, color, 2.5);
      ctx.setLineDash([]);
      ctx.restore();
      if (target.planted) {
        this.drawSeed(ctx, target.x, target.y + 7, 0.34, { rotation: -0.1 });
        ctx.save();
        ctx.strokeStyle = PALETTE.lime;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(target.x, target.y + 2);
        ctx.quadraticCurveTo(target.x - 3, target.y - 10, target.x + 2, target.y - 16);
        ctx.stroke();
        circle(ctx, target.x + 3, target.y - 17, 4, PALETTE.leafLight, PALETTE.ink, 1.5);
        ctx.restore();
      } else {
        this.drawSeed(ctx, target.x, target.y, 0.24, { alpha: 0.35 });
      }
    }
    this.drawTool(ctx, 'seed', this.seedHome.x, this.seedHome.y, 0.65, { rotation: 0.12 });
    const input = this.game.input;
    if (input.down) drawHand(ctx, input.x, input.y, 0.58, -0.15, PALETTE.cream);

    this.drawCounterPill(ctx, `SEMILLAS ${this.planted}/${this.targets.length}`, 16, 64, {
      width: 190,
      size: 9,
      color: PALETTE.lime
    });
    this.drawNote(ctx, 'TOCA CADA MARCA DE LA CUADRÍCULA', this.width * 0.5, this.height * 0.335, {
      size: 9,
      color: PALETTE.paper
    });
  }
}
