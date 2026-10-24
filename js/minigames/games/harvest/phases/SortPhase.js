// Fase 3 de cosecha: clasificar frutos por tamaño en las cajas correctas.
// Exports: SortPhase.

import { HarvestPhase } from '../HarvestPhase.js';
import { PALETTE } from '../../../assets/palette.js';
import { drawSoilPatch, drawCrate } from '../HarvestArt.js';
import { clamp, rand, drawHand } from '../../../core/Draw.js';

const SIZE_LABELS = ['S', 'M', 'L'];
const CRATE_COLORS = [PALETTE.lagoonLight, PALETTE.pineapple, PALETTE.coral];

export class SortPhase extends HarvestPhase {
  constructor(options = {}) {
    super({
      ...options,
      id: 'sort',
      title: 'CLASIFICAR',
      kicker: 'FASE 3 · CLASIFICAR',
      instruction: 'Arrastra cada fruto a la caja de su tamaño: S, M o L. Hazlo rápido y sin errores.',
      gesture: 'gesture-drag',
      duration: 12,
      weight: 1.1,
      hint: 'LLEVA CADA FRUTO A SU CAJA · S / M / L · CONTRA RELOJ',
      accent: PALETTE.pineapple
    });
  }

  updateLayout() {
    const w = this.width;
    const h = this.height;
    this.table = { x: w * 0.08, y: h * 0.4, w: w * 0.84, h: h * 0.27 };
    const crateW = Math.min(w * 0.2, 150);
    const crateH = Math.min(h * 0.13, 80);
    const gap = w * 0.06;
    const total = crateW * 3 + gap * 2;
    const startX = w * 0.5 - total / 2;
    this.crates = SIZE_LABELS.map((label, i) => ({
      index: i,
      accepts: i,
      label,
      color: CRATE_COLORS[i],
      x: startX + i * (crateW + gap),
      y: h * 0.7,
      w: crateW,
      h: crateH
    }));
    this.itemScale = Math.max(0.34, Math.min(0.58, w / 1600));
  }

  resetState() {
    const count = 6 + (this.difficulty >= 4 ? 2 : 0);
    const columns = 4;
    const rows = Math.ceil(count / columns);
    this.items = Array.from({ length: count }, (_, i) => {
      const col = i % columns;
      const row = Math.floor(i / columns);
      const sizeClass = Math.floor(Math.random() * 3);
      const x = this.table.x + this.table.w * ((col + 0.5) / columns) + rand(-16, 16);
      const y = this.table.y + this.table.h * ((row + 0.5) / rows) + rand(-10, 10);
      return {
        id: `fruit_${i}`,
        sizeClass,
        x,
        y,
        homeX: x,
        homeY: y,
        scale: this.itemScale * (0.86 + sizeClass * 0.2),
        placed: false,
        dragging: false,
        visual: { scaleX: 1, scaleY: 1 }
      };
    });
    this.dragging = null;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.correct = 0;
    this.wrong = 0;
    this.placedCount = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.placedFlash = 0;
    this.lastPop = -1;
  }

  onPointerDownInternal(input, event, point) {
    if (this.done) return;
    let nearest = null;
    let best = Infinity;
    for (const item of this.items) {
      if (item.placed || item.dragging) continue;
      const d = Math.hypot(point.x - item.x, point.y - item.y);
      if (d <= 48 + item.scale * 20 && d < best) {
        best = d;
        nearest = item;
      }
    }
    if (!nearest) return;
    this.dragging = nearest;
    nearest.dragging = true;
    this.dragOffsetX = nearest.x - point.x;
    this.dragOffsetY = nearest.y - point.y;
    this.game.audio.play('pop', { rate: 1.1, volume: 0.45 });
    this.game.juice.squash(nearest.visual, { sx: 1.1, sy: 0.9, duration: 0.18 });
  }

  onPointerMoveInternal(input, event, point) {
    if (!this.dragging) return;
    this.dragging.x = point.x + this.dragOffsetX;
    this.dragging.y = point.y + this.dragOffsetY;
  }

  onPointerUpInternal(input, event, point) {
    const item = this.dragging;
    if (!item) return;
    this.dragging = null;
    item.dragging = false;
    const crate = this.crates.find(c => point.x >= c.x && point.x <= c.x + c.w && point.y >= c.y && point.y <= c.y + c.h);
    if (!crate) {
      item.x = item.homeX;
      item.y = item.homeY;
      this.game.audio.play('error', { rate: 0.8, volume: 0.4 });
      return;
    }
    item.placed = true;
    item.x = crate.x + crate.w * 0.5;
    item.y = crate.y + crate.h * 0.4;
    this.placedCount++;
    const correct = crate.accepts === item.sizeClass;
    if (correct) {
      this.correct++;
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.game.registerHit(this.combo >= 3 ? 'perfect' : 'good', item.x, item.y - 20, {
        label: this.combo >= 3 ? `¡COMBO x${this.combo}!` : '¡BIEN CLASIFICADO!',
        target: item.visual
      });
      this.game.audio.play('pop', { rate: 1.18, volume: 0.65 });
      this.game.juice.burst(item.x, item.y, 9, {
        speed: [40, 150],
        angle: [-Math.PI * 0.9, -Math.PI * 0.1],
        colors: [this.cropColor, PALETTE.pineapple, PALETTE.cream],
        life: [0.25, 0.6],
        size: [1.5, 4],
        gravity: 480,
        shape: ['circle', 'spark']
      });
    } else {
      this.wrong++;
      this.combo = 0;
      this.game.registerMiss(item.x, item.y - 16, '¡CAJA EQUIVOCADA!');
      this.game.audio.play('error', { rate: 0.9, volume: 0.6 });
      this.game.juice.burst(item.x, item.y, 8, {
        speed: [30, 120],
        angle: [-Math.PI * 0.9, -Math.PI * 0.1],
        colors: [PALETTE.coral, PALETTE.coralDark, PALETTE.cream],
        life: [0.25, 0.55],
        size: [2, 4],
        gravity: 450,
        shape: 'circle'
      });
    }
    this.placedFlash = 0.2;
    if (this.placedCount >= this.items.length) {
      this.game.juice.confetti(this.width * 0.5, this.height * 0.55, 24);
      this.finish(this.getScore(), { correct: this.correct, wrong: this.wrong, combos: this.maxCombo });
    }
  }

  onUpdate(dt) {
    if (this.done) return;
    this.placedFlash = Math.max(0, this.placedFlash - dt);
  }

  onTimeUp() {
    const missing = this.items.filter(item => !item.placed).length;
    if (missing > 0) this.game.registerMiss(this.width * 0.5, this.height * 0.55, `¡QUEDARON ${missing} FRUTOS!`);
  }

  getScore() {
    if (this.placedCount === 0) return 0;
    const total = Math.max(1, this.items.length);
    const correctRatio = this.correct / total;
    const wrongRatio = this.wrong / total;
    const completion = this.placedCount / total;
    const speed = clamp(1 - this.elapsed / this.duration * 0.3);
    return clamp(correctRatio * 0.75 + (1 - wrongRatio) * 0.1 + completion * 0.05 + speed * 0.1);
  }

  render(ctx) {
    const table = this.table;
    drawSoilPatch(ctx, table.x, table.y, table.w, table.h, this.elapsed);
    this.drawCrateRow(ctx);

    for (const item of this.items) {
      if (item.placed) continue;
      this.drawProduce(ctx, item.x, item.y, item.scale, {
        rotation: item.dragging ? 0.1 : (item.id.charCodeAt(item.id.length - 1) % 2 ? 0.08 : -0.08),
        sx: item.visual.scaleX,
        sy: item.visual.scaleY
      });
      this.drawSizeTag(ctx, item.x + 24 * item.scale, item.y - 22 * item.scale, item.sizeClass, item.scale);
    }

    if (this.dragging) {
      const item = this.dragging;
      this.drawProduce(ctx, item.x, item.y, item.scale * 1.08, {
        rotation: 0.08,
        sx: item.visual.scaleX,
        sy: item.visual.scaleY
      });
      this.drawSizeTag(ctx, item.x + 24 * item.scale, item.y - 22 * item.scale, item.sizeClass, item.scale);
      drawHand(ctx, inputX(this.game), inputY(this.game), 0.6, -0.1, PALETTE.cream);
    }

    this.drawCounterPill(ctx, `ORDENADOS ${this.placedCount}/${this.items.length} · FALLOS ${this.wrong}`, 16, this.height - 46, {
      width: 300,
      color: this.wrong > 0 ? PALETTE.coral : PALETTE.lime
    });
    this.drawNote(ctx, 'ARRASTRA A LA CAJA DEL MISMO TAMAÑO', this.width * 0.5, this.height * 0.2, {
      size: 9,
      color: PALETTE.paper
    });
  }

  drawCrateRow(ctx) {
    const pointer = this.game?.input;
    for (const crate of this.crates) {
      const active = !!this.dragging && pointer
        && pointer.x >= crate.x && pointer.x <= crate.x + crate.w
        && pointer.y >= crate.y && pointer.y <= crate.y + crate.h;
      drawCrate(ctx, crate.x, crate.y, crate.w, crate.h, crate.color, crate.label, { active });
    }
  }
}

function inputX(game) {
  return game?.input?.x || 0;
}

function inputY(game) {
  return game?.input?.y || 0;
}
