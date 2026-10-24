// Fase 1 de siembra: cavar al ritmo de la barra con la pala.
// Exports: DigPhase.

import { PlantingPhase } from '../PlantingPhase.js';
import { PALETTE } from '../../../assets/palette.js';
import { drawGrid, drawRhythmBar, drawHole } from '../PlantingArt.js';
import { clamp, rand, drawHand, rgba } from '../../../core/Draw.js';

export class DigPhase extends PlantingPhase {
  constructor(options = {}) {
    super({
      ...options,
      id: 'dig',
      title: 'CAVAR',
      kicker: 'FASE 1 · CAVAR',
      instruction: 'Golpea con la pala cuando el marcador cruce la zona verde. Marca los hoyos al ritmo.',
      gesture: 'gesture-tap',
      duration: 9,
      weight: 1.1,
      hint: 'GOLPEA EN VERDE · HOYOS AL RITMO',
      accent: PALETTE.mango
    });
  }

  updateLayout() {
    const w = this.width;
    const h = this.height;
    this.bed = { x: w * 0.12, y: h * 0.42, w: w * 0.76, h: h * 0.27 };
    this.rows = 2;
    this.cols = 3;
    this.holesRequired = 4 + (this.difficulty >= 4 ? 1 : 0);
    this.holes = Array.from({ length: 6 }, (_, i) => {
      const col = i % this.cols;
      const row = Math.floor(i / this.cols);
      return {
        x: this.bed.x + this.bed.w * ((col + 0.5) / this.cols),
        y: this.bed.y + this.bed.h * ((row + 0.55) / this.rows),
        filled: false
      };
    });
    this.bar = { x: w * 0.24, y: h * 0.87, w: w * 0.52, h: 22 };
  }

  resetState() {
    this.marker = 0;
    this.dir = 1;
    this.zoneCenter = rand(0.28, 0.72);
    this.zoneWidth = Math.max(0.12, 0.2 - this.difficulty * 0.011);
    this.markerSpeed = 0.88 + this.difficulty * 0.08;
    this.holesMade = 0;
    this.hits = 0;
    this.misses = 0;
    this.accuracySum = 0;
    this.completed = false;
    this.lastHitAt = -1;
    this.shovelSwing = 0;
    for (const hole of this.holes) hole.filled = false;
  }

  onPointerDownInternal(input, event, point) {
    if (this.done || this.completed) return;
    const distance = Math.abs(this.marker - this.zoneCenter);
    const half = this.zoneWidth * 0.5;
    if (distance > half) {
      this.misses++;
      this.game.registerMiss(this.bar.x + this.bar.w * this.marker, this.bar.y, '¡FUERA DE RITMO!');
      this.game.audio.play('error', { rate: 0.85, volume: 0.45 });
      return;
    }
    const accuracy = clamp(1 - distance / Math.max(0.001, half));
    this.hits++;
    this.accuracySum += accuracy;
    this.holesMade++;
    const hole = this.holes[this.holesMade - 1];
    if (hole) hole.filled = true;
    this.shovelSwing = 0.24;
    this.game.registerHit(accuracy > 0.65 ? 'perfect' : 'good', hole?.x || this.width * 0.5, hole?.y || this.height * 0.5, {
      label: accuracy > 0.65 ? '¡HOYO PERFECTO!' : '¡HOYO!'
    });
    this.game.audio.play('dig', { rate: 1.02, volume: 0.82 });
    this.game.juice.burst(hole?.x || this.width * 0.5, (hole?.y || this.height * 0.5) + 8, 12, {
      speed: [50, 180],
      angle: [-Math.PI * 0.9, -Math.PI * 0.1],
      colors: ['#5c3b25', '#7a5133', PALETTE.mango],
      life: [0.3, 0.7],
      size: [2, 5],
      gravity: 620,
      shape: 'circle'
    });
    this.game.juice.shakeAdd(0.08);
    if (this.holesMade >= this.holesRequired) {
      this.completed = true;
      this.game.juice.confetti(this.width * 0.5, this.bed.y, 20);
      this.finish(this.getScore(), { holes: this.holesMade, misses: this.misses });
      return;
    }
    this.marker = 0;
    this.dir = 1;
    this.zoneCenter = rand(0.28, 0.72);
  }

  onUpdate(dt) {
    if (this.done || this.completed) return;
    this.marker += this.dir * dt * this.markerSpeed;
    if (this.marker >= 1) {
      this.marker = 1;
      this.dir = -1;
    } else if (this.marker <= 0) {
      this.marker = 0;
      this.dir = 1;
    }
    this.shovelSwing = Math.max(0, this.shovelSwing - dt * 4);
  }

  onTimeUp() {
    if (!this.completed) {
      this.game.registerMiss(this.width * 0.5, this.bed.y, '¡FALTARON HOYOS!');
      this.game.plantWeak = true;
    }
  }

  getScore() {
    if (this.hits === 0) return 0;
    const completion = clamp(this.holesMade / this.holesRequired);
    const accuracy = this.accuracySum / this.hits;
    const attempts = this.hits + this.misses;
    const clean = attempts > 0 ? clamp(1 - this.misses / attempts) : 0;
    return clamp(completion * 0.65 + accuracy * 0.25 + clean * 0.1);
  }

  render(ctx) {
    const bed = this.bed;
    this.drawBed(ctx, bed.x, bed.y, bed.w, bed.h, this.elapsed);
    drawGrid(ctx, bed, this.rows, this.cols, { color: rgba(PALETTE.cream, 0.2) });
    for (const hole of this.holes) drawHole(ctx, hole.x, hole.y, 16 + this.difficulty * 1.5, hole.filled);
    const next = this.holes[this.holesMade];
    if (next && !this.completed) {
      this.drawTool(ctx, 'shovel', next.x, next.y - 4, 0.64, {
        rotation: -0.22 + this.shovelSwing * 1.1
      });
      this.drawPointerRing(ctx, next.x, next.y + 8, PALETTE.mango, 18);
    }

    const input = this.game.input;
    if (input.down) drawHand(ctx, input.x, input.y, 0.58, -0.15, PALETTE.cream);

    drawRhythmBar(ctx, this.bar, this.marker, this.zoneCenter, this.zoneWidth, {
      label: `HOYOS ${this.holesMade}/${this.holesRequired} · GOLPEA EN VERDE`
    });
    this.drawCounterPill(ctx, `HOYOS ${this.holesMade}/${this.holesRequired}`, 16, 64, {
      width: 190,
      size: 9,
      color: PALETTE.mango
    });
    this.drawNote(ctx, 'GOLPEA CON LA PALA EN LA ZONA VERDE', this.width * 0.5, this.height * 0.335, {
      size: 9,
      color: PALETTE.paper
    });
  }
}
