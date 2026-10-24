// Fase 3 de siembra: cubrir las semillas con tierra y apisonar al ritmo.
// Exports: CoverPhase.

import { PlantingPhase } from '../PlantingPhase.js';
import { PALETTE } from '../../../assets/palette.js';
import { drawGrid, drawRhythmBar, drawMallet } from '../PlantingArt.js';
import { clamp, rand, circle, drawHand, fillRoundRect, rgba } from '../../../core/Draw.js';

export class CoverPhase extends PlantingPhase {
  constructor(options = {}) {
    super({
      ...options,
      id: 'cover',
      title: 'TAPAR',
      kicker: 'FASE 3 · TAPAR',
      instruction: 'Arrastra tierra sobre todas las semillas y después apisona al ritmo con el mazo.',
      gesture: 'gesture-drag',
      duration: 12,
      weight: 1.0,
      hint: 'CUBRE TODA LA TIERRA · LUEGO APISONA EN VERDE',
      accent: PALETTE.woodLight
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
          cover: 0
        });
      }
    }
    this.pile = { x: w * 0.09, y: h * 0.58 };
    this.bar = { x: w * 0.24, y: h * 0.87, w: w * 0.52, h: 22 };
  }

  resetState() {
    this.mode = 'cover';
    this.covering = false;
    this.coverTotal = 0;
    this.marker = 0;
    this.dir = 1;
    this.zoneCenter = rand(0.28, 0.72);
    this.zoneWidth = Math.max(0.13, 0.21 - this.difficulty * 0.012);
    this.markerSpeed = 0.8 + this.difficulty * 0.08;
    this.tampHits = 0;
    this.tampRequired = 3 + (this.difficulty >= 4 ? 1 : 0);
    this.tampMisses = 0;
    this.tampAccuracy = 0;
    this.completed = false;
    this.lastCoverSound = -1;
    for (const cell of this.cells) cell.cover = 0;
  }

  onPointerDownInternal(input, event, point) {
    if (this.done || this.completed) return;
    if (this.mode === 'cover') {
      this.covering = true;
      this.game.audio.play('sow', { rate: 0.8, volume: 0.32 });
      return;
    }
    const distance = Math.abs(this.marker - this.zoneCenter);
    const half = this.zoneWidth * 0.5;
    if (distance > half) {
      this.tampMisses++;
      this.game.registerMiss(this.width * 0.5, this.bar.y, '¡FUERA DE RITMO!');
      this.game.audio.play('error', { rate: 0.85, volume: 0.42 });
      return;
    }
    const accuracy = clamp(1 - distance / Math.max(0.001, half));
    this.tampHits++;
    this.tampAccuracy += accuracy;
    this.game.registerHit(accuracy > 0.65 ? 'perfect' : 'good', this.bed.x + this.bed.w * 0.5, this.bed.y + this.bed.h * 0.5, {
      label: accuracy > 0.65 ? '¡APISONADO!': '¡BIEN!'
    });
    this.game.audio.play('sow', { rate: 0.68, volume: 0.75 });
    this.game.juice.burst(this.bed.x + this.bed.w * 0.5, this.bed.y + this.bed.h * 0.8, 8, {
      speed: [30, 130],
      angle: [-Math.PI * 0.9, -Math.PI * 0.1],
      colors: ['#5c3b25', '#7a5133', PALETTE.mango],
      life: [0.25, 0.55],
      size: [2, 4],
      gravity: 520,
      shape: 'circle'
    });
    this.game.juice.shakeAdd(0.06);
    if (this.tampHits >= this.tampRequired) {
      this.completed = true;
      this.game.juice.confetti(this.width * 0.5, this.bed.y, 20);
      this.finish(this.getScore(), { tampHits: this.tampHits, tampMisses: this.tampMisses });
      return;
    }
    this.marker = 0;
    this.dir = 1;
    this.zoneCenter = rand(0.28, 0.72);
  }

  onPointerUpInternal() {
    this.covering = false;
  }

  onUpdate(dt) {
    if (this.done || this.completed) return;
    if (this.mode === 'cover') {
      const input = this.game.input;
      if (input.down) {
        for (const cell of this.cells) {
          if (input.x >= cell.x - 8 && input.x <= cell.x + cell.w + 8
            && input.y >= cell.y - 8 && input.y <= cell.y + cell.h + 8) {
            cell.cover = Math.min(1, cell.cover + dt * 1.35);
          }
        }
        this.coverTotal = this.cells.reduce((sum, cell) => sum + cell.cover, 0) / this.cells.length;
        if (this.elapsed - this.lastCoverSound > 0.2) {
          this.lastCoverSound = this.elapsed;
          this.game.audio.play('sow', { rate: 0.85 + Math.random() * 0.2, volume: 0.35 });
        }
        for (let i = 0; i < 2; i++) {
          this.game.juice.particles.spawn({
            x: input.x + rand(-16, 16),
            y: input.y + rand(-8, 8),
            vx: rand(-50, 50),
            vy: rand(-90, -20),
            life: rand(0.2, 0.5),
            size: rand(1.5, 4),
            color: rand(0, 1) > 0.5 ? '#5c3b25' : '#7a5133',
            gravity: 520,
            drag: 1,
            shape: 'circle',
            alpha: 0.8
          });
        }
        if (this.coverTotal >= 0.97) {
          this.mode = 'tamp';
          this.marker = 0;
          this.dir = 1;
          this.zoneCenter = rand(0.28, 0.72);
          this.game.audio.play('select', { volume: 0.75 });
          this.game.juice.popText('¡AHORA APISONA!', this.width * 0.5, this.bed.y - 26, {
            color: PALETTE.pineapple,
            size: 14,
            vy: -26,
            life: 0.9
          });
        }
      }
      return;
    }
    this.marker += this.dir * dt * this.markerSpeed;
    if (this.marker >= 1) { this.marker = 1; this.dir = -1; }
    else if (this.marker <= 0) { this.marker = 0; this.dir = 1; }
  }

  onTimeUp() {
    if (!this.completed) {
      this.game.registerMiss(this.width * 0.5, this.bed.y, this.mode === 'cover' ? '¡FALTÓ TAPAR!' : '¡FALTÓ APISONAR!');
      this.game.plantWeak = true;
    }
  }

  getScore() {
    const cover = this.coverTotal;
    const tamp = clamp(this.tampHits / this.tampRequired);
    const attempts = this.tampHits + this.tampMisses;
    const accuracy = this.tampHits > 0 ? this.tampAccuracy / this.tampHits : 0;
    const clean = attempts > 0 ? clamp(1 - this.tampMisses / attempts) : 0;
    return clamp(cover * 0.4 + tamp * 0.45 + accuracy * 0.1 + clean * 0.05);
  }

  render(ctx) {
    const bed = this.bed;
    this.drawBed(ctx, bed.x, bed.y, bed.w, bed.h, this.elapsed);
    drawGrid(ctx, bed, this.rows, this.cols, { color: rgba(PALETTE.cream, 0.2) });
    for (const cell of this.cells) {
      if (cell.cover <= 0) continue;
      ctx.save();
      ctx.globalAlpha = 0.65 * cell.cover;
      fillRoundRect(ctx, cell.x + 3, cell.y + 3, cell.w - 6, cell.h - 6, 9, '#6b462d');
      ctx.restore();
      if (cell.cover > 0.7) {
        ctx.save();
        ctx.strokeStyle = rgba(PALETTE.lime, 0.45);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cell.x + 12, cell.y + cell.h - 12);
        ctx.lineTo(cell.x + cell.w - 12, cell.y + 12);
        ctx.stroke();
        ctx.restore();
      }
    }
    // Semillas visibles bajo la tierra.
    for (let i = 0; i < 6; i++) {
      const cell = this.cells[i];
      if (!cell) continue;
      this.drawSeed(ctx, cell.x + cell.w * 0.5, cell.y + cell.h * 0.55, 0.26, {
        alpha: 0.35
      });
    }
    this.drawTool(ctx, 'seed', this.pile.x, this.pile.y, 0.55, { rotation: 0.2 });

    if (this.mode === 'cover') {
      const input = this.game.input;
      if (input.down) {
        drawHand(ctx, input.x, input.y, 0.6, -0.2, PALETTE.cream);
        this.drawPointerRing(ctx, input.x, input.y, PALETTE.mango, 16);
      }
      this.drawCounterPill(ctx, `CUBIERTO ${Math.round(this.coverTotal * 100)}%`, 16, 64, {
        width: 200,
        size: 9,
        color: PALETTE.mango
      });
      this.drawNote(ctx, 'ARRASTRA TIERRA SOBRE TODO EL BANCAL', this.width * 0.5, this.height * 0.335, {
        size: 9,
        color: PALETTE.paper
      });
    } else {
      const input = this.game.input;
      drawMallet(ctx, input.x || this.bed.x + this.bed.w * 0.5, (input.y || this.bed.y + 30) - 26, -0.2 + Math.sin(this.elapsed * 18) * 0.04, 0.9);
      drawRhythmBar(ctx, this.bar, this.marker, this.zoneCenter, this.zoneWidth, {
        label: `APISONA ${this.tampHits}/${this.tampRequired} · GOLPEA EN VERDE`
      });
      this.drawCounterPill(ctx, `APISONADO ${this.tampHits}/${this.tampRequired}`, 16, 64, {
        width: 210,
        size: 9,
        color: PALETTE.lime
      });
      this.drawNote(ctx, 'APISONA AL RITMO', this.width * 0.5, this.height * 0.335, {
        size: 9,
        color: PALETTE.paper
      });
    }
  }
}
