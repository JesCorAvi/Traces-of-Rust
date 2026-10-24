// Fase 4 de siembra: regar todas las celdas sin encharcar ni dejar secas.
// Exports: WaterPhase.

import { PlantingPhase } from '../PlantingPhase.js';
import { PALETTE } from '../../../assets/palette.js';
import { drawGrid, drawWaterDrops } from '../PlantingArt.js';
import { clamp, rand, circle, fillRoundRect, strokeRoundRect, rgba } from '../../../core/Draw.js';

const BAND_CENTER = 0.69;

export class WaterPhase extends PlantingPhase {
  constructor(options = {}) {
    super({
      ...options,
      id: 'water',
      title: 'REGAR',
      kicker: 'FASE 4 · REGAR',
      instruction: 'Mueve la regadera sobre todo el bancal. Mantén cada celda en la zona verde sin encharcarla.',
      gesture: 'gesture-drag',
      duration: 12,
      weight: 1.0,
      hint: 'MUEVE LA REGADERA · TODAS LAS CELDAS EN VERDE',
      accent: PALETTE.lagoon
    });
  }

  updateLayout() {
    const w = this.width;
    const h = this.height;
    this.bed = { x: w * 0.12, y: h * 0.42, w: w * 0.76, h: h * 0.27 };
    this.rows = 2;
    this.cols = 3;
    this.cells = [];
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        this.cells.push({
          x: this.bed.x + this.bed.w * (col / this.cols),
          y: this.bed.y + this.bed.h * (row / this.rows),
          w: this.bed.w / this.cols,
          h: this.bed.h / this.rows,
          moisture: 0
        });
      }
    }
    this.canRadius = Math.max(48, Math.min(w, h) * 0.12);
    this.canRest = { x: w * 0.82, y: h * 0.74 };
    this.can = { ...this.canRest };
    this.moistureBar = { x: w * 0.7, y: h * 0.75, w: w * 0.2, h: 14 };
  }

  resetState() {
    this.can = { ...this.canRest };
    this.inBand = 0;
    this.completed = false;
    this.lastWaterSound = -1;
    this.lastDrop = -1;
    const bandWidth = Math.max(0.18, 0.28 - (this.difficulty - 1) * 0.015);
    this.bandMin = BAND_CENTER - bandWidth * 0.5;
    this.bandMax = BAND_CENTER + bandWidth * 0.5;
    this.drainRate = 0.014 + this.difficulty * 0.004;
    for (const cell of this.cells) cell.moisture = 0;
  }

  onUpdate(dt) {
    if (this.done || this.completed) return;
    const input = this.game.input;
    const pointer = (input.x || input.y) ? { x: input.x, y: input.y } : this.canRest;
    this.can.x = pointer.x;
    this.can.y = pointer.y;

    for (const cell of this.cells) {
      const cx = cell.x + cell.w * 0.5;
      const cy = cell.y + cell.h * 0.5;
      const d = Math.hypot(pointer.x - cx, pointer.y - cy);
      const underCan = d <= this.canRadius;
      if (underCan) {
        const intensity = clamp(1 - d / this.canRadius);
        cell.moisture = Math.min(1, cell.moisture + dt * (0.64 + intensity * 0.44));
      } else {
        cell.moisture = Math.max(0, cell.moisture - dt * this.drainRate);
      }
    }
    this.inBand = this.cells.filter(cell => cell.moisture >= this.bandMin && cell.moisture <= this.bandMax).length;

    if (input.x >= this.bed.x && input.x <= this.bed.x + this.bed.w
      && input.y >= this.bed.y && input.y <= this.bed.y + this.bed.h) {
      if (this.elapsed - this.lastWaterSound > 0.18) {
        this.lastWaterSound = this.elapsed;
        this.game.audio.play('water', { rate: 0.95 + Math.random() * 0.15, volume: 0.36 });
      }
      if (this.elapsed - this.lastDrop > 0.06) {
        this.lastDrop = this.elapsed;
        for (let i = 0; i < 2; i++) {
          this.game.juice.particles.spawn({
            x: pointer.x + rand(-18, 18),
            y: pointer.y + rand(-6, 10),
            vx: rand(-30, 30),
            vy: rand(80, 170),
            life: rand(0.3, 0.6),
            size: rand(1.5, 3.5),
            color: PALETTE.lagoonLight,
            gravity: 400,
            drag: 0.4,
            shape: 'circle',
            alpha: 0.8
          });
        }
      }
    }

    if (this.inBand >= this.cells.length) {
      this.completed = true;
      this.game.registerHit('perfect', this.width * 0.5, this.bed.y, {
        label: '¡BANCAL PERFECTO!'
      });
      this.game.audio.play('harvest', { rate: 1.15, volume: 0.8 });
      this.game.juice.confetti(this.width * 0.5, this.bed.y, 22);
      this.finish(this.getScore(), { inBand: this.inBand });
    }
  }

  onTimeUp() {
    if (!this.completed) {
      this.game.registerMiss(this.width * 0.5, this.bed.y, `¡QUEDARON ${this.cells.length - this.inBand} CELDAS!`);
      this.game.plantWeak = true;
    }
  }

  getScore() {
    const scores = this.cells.map(cell => {
      const closeness = clamp(1 - Math.abs(cell.moisture - BAND_CENTER) / 0.32);
      if (cell.moisture <= 0.03) return 0;
      return closeness;
    });
    const average = scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length);
    const coverage = this.cells.filter(cell => cell.moisture > 0.15).length / Math.max(1, this.cells.length);
    const timeBonus = clamp(1 - this.elapsed / this.duration * 0.3);
    return clamp(average * 0.75 + coverage * 0.15 + timeBonus * 0.1);
  }

  render(ctx) {
    const bed = this.bed;
    this.drawBed(ctx, bed.x, bed.y, bed.w, bed.h, this.elapsed);
    drawGrid(ctx, bed, this.rows, this.cols, { color: rgba(PALETTE.cream, 0.2) });
    for (const cell of this.cells) {
      const moisture = cell.moisture;
      const inBand = moisture >= this.bandMin && moisture <= this.bandMax;
      const over = moisture > 0.9;
      const color = over
        ? 'rgba(63,193,201,0.55)'
        : moisture <= 0.03
          ? 'rgba(122,81,51,0.4)'
          : 'rgba(74,47,30,0.75)';
      fillRoundRect(ctx, cell.x + 4, cell.y + 4, cell.w - 8, cell.h - 8, 9, color);
      ctx.save();
      ctx.strokeStyle = inBand ? PALETTE.lime : over ? PALETTE.lagoonLight : rgba(PALETTE.cream, 0.18);
      ctx.lineWidth = inBand ? 3 : 1.5;
      strokeRoundRect(ctx, cell.x + 4, cell.y + 4, cell.w - 8, cell.h - 8, 9, ctx.strokeStyle, ctx.lineWidth);
      ctx.restore();
      if (moisture > 0.1) {
        this.drawSeed(ctx, cell.x + cell.w * 0.5, cell.y + cell.h * 0.5 + 4, 0.24, {
          alpha: 0.35
        });
      }
      if (over) {
        circle(ctx, cell.x + cell.w * 0.5, cell.y + cell.h * 0.5, 9, rgba(PALETTE.lagoonLight, 0.35));
      }
      const barX = cell.x + 10;
      const barY = cell.y + cell.h - 16;
      const barW = cell.w - 20;
      fillRoundRect(ctx, barX, barY, barW, 6, 3, rgba(PALETTE.ink, 0.55));
      fillRoundRect(ctx, barX + 1, barY + 1, Math.max(0, (barW - 2) * moisture), 4, 2, moisture > 0.9 ? PALETTE.lagoonLight : PALETTE.lime);
    }

    this.drawTool(ctx, 'wateringcan', this.can.x, this.can.y, 0.66, { rotation: -0.22 });
    drawWaterDrops(ctx, this.can.x + 26, this.can.y + 10, 4, this.elapsed);

    this.drawCounterPill(ctx, `CELDAS EN VERDE ${this.inBand}/${this.cells.length}`, 16, 64, {
      width: 240,
      size: 9,
      color: this.inBand === this.cells.length ? PALETTE.lime : PALETTE.lagoonLight
    });
    this.drawNote(ctx, 'MUEVE LA REGADERA POR TODO EL BANCAL', this.width * 0.5, this.height * 0.335, {
      size: 9,
      color: PALETTE.paper
    });
  }
}
