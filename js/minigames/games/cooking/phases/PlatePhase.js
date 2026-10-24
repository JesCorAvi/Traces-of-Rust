// Fase 5 de cocina: emplatar arrastrando ingredientes y decorar el plato.
// Exports: PlatePhase.

import { CookingPhase, hexColor } from '../CookingPhase.js';
import { PALETTE } from '../../../assets/palette.js';
import { drawSauceTrail } from '../CookingArt.js';
import {
  TAU, clamp, circle, fillRoundRect, strokeRoundRect, text, rgba, rand
} from '../../../core/Draw.js';

function buildPieceIds(recipe) {
  const order = recipe?.steps?.plate?.order;
  if (Array.isArray(order) && order.length) return order.slice(0, 5);
  const ids = [];
  for (const [id, amount] of Object.entries(recipe?.ingredients || {})) {
    const count = Math.max(1, Math.min(3, Math.round(Number(amount) || 1)));
    for (let i = 0; i < count; i++) ids.push(id);
  }
  return (ids.length ? ids : ['crab']).slice(0, 5);
}

export class PlatePhase extends CookingPhase {
  constructor({ recipe, difficulty, kitchenSpeed } = {}) {
    const diff = clamp(difficulty || 1, 1, 5);
    const pieceIds = buildPieceIds(recipe);
    super({
      id: 'plate',
      title: 'EMPLATAR',
      kicker: 'FASE 5 · PLATO',
      instruction: 'Arrastra cada ingrediente a su aro del plato. Cuando esté todo, decora y pulsa SERVIR.',
      gesture: 'gesture-drag',
      duration: 12 + pieceIds.length * 0.75,
      weight: 1.3,
      hint: 'ARRASTRA AL PLATO · DECORA · PULSA SERVIR',
      accent: hexColor(recipe?.color || '#ffcf4a'),
      recipe,
      difficulty,
      kitchenSpeed
    });
    this.pieceIds = pieceIds;
    this.plateVisual = { scaleX: 1, scaleY: 1 };
  }

  updateLayout() {
    const w = this.width;
    const h = this.height;
    const scale = Math.max(1.55, Math.min(w / 620, h / 400) * 1.7);
    this.plateScale = scale;
    this.plate = { x: w * 0.5, y: h * 0.55, scale };
    this.plateW = 170 * scale;
    this.plateH = 95 * scale;
    this.plateCenter = {
      x: this.plate.x,
      y: this.plate.y - (0.72 - 0.5) * this.plateH
    };
    this.tray = {
      x: w * 0.09,
      y: h * 0.81,
      w: w * 0.82,
      h: h * 0.16
    };
    this.serveRect = {
      x: w * 0.74,
      y: h * 0.63,
      w: Math.min(170, w * 0.22),
      h: 48
    };
    this.matchRadius = Math.max(42, this.plateW * 0.17);
    this.pieceScale = Math.max(0.42, Math.min(0.62, scale * 0.3));
    this._layoutSlots();
    if (this.pieces) this._layoutPieces();
  }

  _layoutSlots() {
    const n = this.pieceIds.length;
    const rx = this.plateW * 0.22;
    const ry = this.plateH * 0.21;
    this.slots = this.pieceIds.map((id, i) => {
      let ox = 0;
      let oy = 0;
      if (n > 1) {
        const a = -Math.PI / 2 + (i / n) * TAU;
        ox = Math.cos(a) * rx;
        oy = Math.sin(a) * ry;
      }
      return {
        id,
        x: this.plateCenter.x + ox,
        y: this.plateCenter.y + oy,
        radius: Math.max(23, this.plateW * 0.075)
      };
    });
  }

  resetState() {
    this.pieces = this.pieceIds.map((id, index) => ({
      id,
      index,
      homeX: 0,
      homeY: 0,
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      placed: false,
      dragging: false,
      accuracy: 0,
      placedOrder: -1,
      visual: { scaleX: 1, scaleY: 1 }
    }));
    this.dragging = null;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.placedCount = 0;
    this.allPlaced = false;
    this.served = false;
    this.sauceStrokes = [];
    this.currentStroke = null;
    this.lastSauce = -1;
    this.lastSauceSound = -1;
    this.decorating = false;
    this.stats = {};
    this._layoutPieces();
  }

  _layoutPieces() {
    const spacing = this.tray.w / Math.max(1, this.pieces.length);
    for (let i = 0; i < this.pieces.length; i++) {
      const piece = this.pieces[i];
      piece.homeX = this.tray.x + spacing * (i + 0.5);
      piece.homeY = this.tray.y + this.tray.h * 0.72;
      piece.targetX = this.slots[i]?.x ?? this.plateCenter.x;
      piece.targetY = this.slots[i]?.y ?? this.plateCenter.y;
      if (!piece.placed && !piece.dragging) {
        piece.x = piece.homeX;
        piece.y = piece.homeY;
      } else if (piece.placed) {
        piece.x = this.plateCenter.x + (piece.offsetX || 0);
        piece.y = this.plateCenter.y + (piece.offsetY || 0);
      }
    }
  }

  syncInputTarget() {
    this.game.input.clearCircleTarget();
  }

  _pointInPlate(x, y) {
    const cx = this.plateCenter.x;
    const cy = this.plateCenter.y;
    return Math.pow((x - cx) / (this.plateW * 0.46), 2) + Math.pow((y - cy) / (this.plateH * 0.45), 2) <= 1;
  }

  _pointInRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
  }

  onPointerDownInternal(input, event, point) {
    if (this.done || this.served) return;
    if (this.allPlaced) {
      if (this._pointInRect(point.x, point.y, this.serveRect)) {
        this._serve();
        return;
      }
      if (this._pointInPlate(point.x, point.y)) {
        this.decorating = true;
        this.currentStroke = [];
        this.sauceStrokes.push(this.currentStroke);
        this._addSauce(point.x, point.y);
        this.game.audio.play('click', { volume: 0.4 });
        return;
      }
    }
    if (this.dragging) return;
    let nearest = null;
    let best = Infinity;
    for (const piece of this.pieces) {
      if (piece.placed || piece.dragging) continue;
      const d = Math.hypot(point.x - piece.homeX, point.y - (piece.homeY - 24));
      if (d < 62 && d < best) {
        best = d;
        nearest = piece;
      }
    }
    if (!nearest) return;
    this.dragging = nearest;
    nearest.dragging = true;
    this.dragOffsetX = nearest.x - point.x;
    this.dragOffsetY = nearest.y - point.y;
    this.game.audio.play('pop', { rate: 1.15, volume: 0.5 });
    this.game.juice.squash(nearest.visual, { sx: 1.12, sy: 0.9, duration: 0.2 });
  }

  onPointerMoveInternal(input, event, point) {
    if (this.done || this.served) return;
    if (this.dragging) {
      this.dragging.x = point.x + this.dragOffsetX;
      this.dragging.y = point.y + this.dragOffsetY;
      return;
    }
    if (this.allPlaced && this.decorating && input.down && this._pointInPlate(point.x, point.y)) {
      this._addSauce(point.x, point.y);
    }
  }

  onPointerUpInternal(input, event, point) {
    if (this.done || this.served) return;
    if (this.decorating) {
      this.decorating = false;
      this.currentStroke = null;
      return;
    }
    const piece = this.dragging;
    if (!piece) return;
    this.dragging = null;
    piece.dragging = false;
    if (!this._pointInPlate(piece.x, piece.y)) {
      piece.x = piece.homeX;
      piece.y = piece.homeY;
      this.game.audio.play('error', { volume: 0.55 });
      this.game.juice.popText('¡SE CAYÓ!', piece.homeX, piece.homeY - 40, {
        color: PALETTE.coral,
        size: 13,
        life: 0.6,
        vy: -32
      });
      return;
    }
    const distance = Math.hypot(piece.x - piece.targetX, piece.y - piece.targetY);
    const accuracy = clamp(1 - distance / Math.max(1, this.matchRadius));
    piece.placed = true;
    piece.accuracy = accuracy;
    piece.placedOrder = this.placedCount++;
    piece.offsetX = piece.x - this.plateCenter.x;
    piece.offsetY = piece.y - this.plateCenter.y;
    const perfect = accuracy >= 0.62;
    this.game.registerHit(perfect ? 'perfect' : 'good', piece.x, piece.y, {
      label: perfect ? '¡COLOCACIÓN PERFECTA!' : '¡BIEN COLOCADO!',
      target: piece.visual
    });
    this.game.audio.play('pop', { rate: perfect ? 1.3 : 1.0, volume: 0.7 });
    this.game.juice.burst(piece.x, piece.y, perfect ? 14 : 8, {
      speed: [50, 170],
      angle: [-Math.PI * 0.9, -Math.PI * 0.1],
      colors: [this.colorFor(piece.id, PALETTE.coral), PALETTE.cream, PALETTE.pineapple],
      life: [0.25, 0.6],
      size: [1.5, 4],
      gravity: 520,
      shape: ['circle', 'spark']
    });
    if (this.placedCount >= this.pieces.length) {
      this.allPlaced = true;
      this.game.audio.play('select', { volume: 0.8 });
      this.game.juice.confetti(this.plateCenter.x, this.plateCenter.y - 40, 24);
      this.game.juice.popText('¡DECORA Y SIRVE!', this.plateCenter.x, this.plateCenter.y - 120, {
        color: PALETTE.pineapple,
        size: 15,
        life: 1.1,
        vy: -30
      });
    }
    this.stats = { placed: this.placedCount, total: this.pieces.length };
  }

  _addSauce(x, y) {
    const now = this.elapsed;
    if (now - this.lastSauce < 0.025) return;
    this.lastSauce = now;
    let stroke = this.currentStroke;
    if (!stroke) {
      stroke = [];
      this.sauceStrokes.push(stroke);
      this.currentStroke = stroke;
    }
    const last = stroke[stroke.length - 1];
    if (last && Math.hypot(x - last.x, y - last.y) < 3) return;
    stroke.push({ x, y, width: 3.5 });
    if (stroke.length > 90) stroke.shift();
    if (now - this.lastSauceSound > 0.14) {
      this.lastSauceSound = now;
      this.game.audio.play('tap', { rate: 1.35, volume: 0.32 });
      this.game.juice.particles.spawn({
        x,
        y,
        vx: rand(-18, 18),
        vy: rand(-36, -8),
        life: rand(0.25, 0.5),
        size: rand(1.5, 3.5),
        color: PALETTE.cream,
        gravity: 300,
        drag: 1,
        shape: 'circle',
        alpha: 0.7
      });
    }
  }

  _serve() {
    if (this.served) return;
    this.served = true;
    this.game.audio.play('select', { volume: 0.9 });
    this.game.audio.play('star', { rate: 1.1, volume: 0.75 });
    this.game.juice.confetti(this.plateCenter.x, this.plateCenter.y - 20, 30);
    this.finish(this.getScore(), { served: true, pieces: this.placedCount });
  }

  onUpdate(dt) {
    if (this.done) return;
    if (this.allPlaced && this.decorating && this.game.input.down && this._pointInPlate(this.game.input.x, this.game.input.y)) {
      this._addSauce(this.game.input.x, this.game.input.y);
    }
    this.stats = { placed: this.placedCount, total: this.pieces.length, served: this.served };
  }

  onTimeUp() {
    if (this.served) return;
    if (this.placedCount < this.pieces.length) {
      this.game.registerMiss(this.plateCenter.x, this.plateCenter.y, '¡FALTAN INGREDIENTES!');
    }
  }

  getScore() {
    let placementSum = 0;
    for (const piece of this.pieces) {
      if (piece.placed) placementSum += piece.accuracy;
    }
    const placementAvg = placementSum / Math.max(1, this.pieces.length);
    const completion = this.placedCount / Math.max(1, this.pieces.length);
    let orderBonus = 0.4;
    if (this.placedCount === this.pieces.length) {
      const sequence = this.pieces.map(piece => piece.placedOrder);
      const sorted = [...sequence].sort((a, b) => a - b);
      const inOrder = sequence.every((value, index) => value === sorted[index]);
      orderBonus = inOrder ? 1 : 0.55;
    }
    const saucePointCount = this.sauceStrokes.reduce((sum, stroke) => sum + stroke.length, 0);
    const decorationBonus = Math.min(0.08, (saucePointCount / 70) * 0.08);
    return clamp(placementAvg * 0.7 + orderBonus * 0.15 + completion * 0.15 + decorationBonus);
  }

  render(ctx) {
    const plate = this.plate;
    const center = this.plateCenter;
    const allText = `${this.placedCount}/${this.pieces.length}`;

    // Tarro/plato.
    ctx.save();
    circle(ctx, center.x, center.y + this.plateH * 0.36, this.plateW * 0.45, rgba(PALETTE.ink, 0.2));
    this.drawIngredient(ctx, 'plate', plate.x, plate.y, plate.scale, {
      sx: this.plateVisual.scaleX,
      sy: this.plateVisual.scaleY
    });
    ctx.restore();

    // Aros objetivo.
    for (const slot of this.slots) {
      const color = this.colorFor(slot.id, PALETTE.paperDark);
      this.drawIngredientRing(ctx, slot.x, slot.y, slot.radius, color, !this.allPlaced);
      this.drawIngredient(ctx, slot.id, slot.x, slot.y + slot.radius * 0.28, this.pieceScale * 0.72, {
        alpha: 0.22
      });
    }

    // Piezas colocadas.
    for (const piece of this.pieces) {
      if (!piece.placed) continue;
      this.drawIngredient(ctx, piece.id, piece.x, piece.y, this.pieceScale, {
        rotation: piece.index % 2 ? 0.1 : -0.08,
        sx: piece.visual.scaleX,
        sy: piece.visual.scaleY
      });
    }

    // Salsa de decoración.
    for (const stroke of this.sauceStrokes) {
      if (stroke.length > 1) drawSauceTrail(ctx, stroke, 'rgba(255, 244, 214, 0.95)');
      for (let i = 0; i < stroke.length; i += 9) {
        const point = stroke[i];
        circle(ctx, point.x, point.y, 2.2, PALETTE.pineapple);
      }
    }

    // Bandeja.
    this.drawBoard(ctx, this.tray.x, this.tray.y, this.tray.w, this.tray.h, {
      base: '#8a5a3a',
      dark: '#4d2c19',
      light: '#b67b4d',
      radius: 16,
      inner: true
    });
    for (const piece of this.pieces) {
      if (piece.placed || piece.dragging) continue;
      this.drawIngredient(ctx, piece.id, piece.homeX, piece.homeY, this.pieceScale, {
        rotation: piece.index % 2 ? 0.08 : -0.08,
        sx: piece.visual.scaleX,
        sy: piece.visual.scaleY
      });
    }

    // Pieza arrastrada.
    if (this.dragging) {
      const piece = this.dragging;
      const over = this._pointInPlate(piece.x, piece.y);
      ctx.save();
      ctx.globalAlpha = 0.25;
      circle(ctx, piece.x, piece.y, 38, over ? PALETTE.lime : PALETTE.coral);
      ctx.restore();
      this.drawIngredient(ctx, piece.id, piece.x, piece.y - 6, this.pieceScale * 1.06, {
        rotation: 0.05,
        sx: piece.visual.scaleX,
        sy: piece.visual.scaleY
      });
      if (over) this.drawIngredientRing(ctx, piece.targetX, piece.targetY, this.slots[piece.index]?.radius || 26, PALETTE.lime, true);
    }

    // Servir.
    if (this.allPlaced) {
      const rect = this.serveRect;
      const pulse = 0.5 + Math.sin(this.elapsed * 5) * 0.12;
      ctx.save();
      ctx.shadowColor = rgba(PALETTE.pineapple, 0.65);
      ctx.shadowBlur = 20;
      fillRoundRect(ctx, rect.x, rect.y, rect.w, rect.h, 14, PALETTE.coral);
      ctx.shadowBlur = 0;
      strokeRoundRect(ctx, rect.x, rect.y, rect.w, rect.h, 14, PALETTE.ink, 4);
      fillRoundRect(ctx, rect.x + 4, rect.y + 4, rect.w - 8, rect.h * 0.42, 10, `rgba(255,255,255,${pulse * 0.16})`);
      text(ctx, 'SERVIR', rect.x + rect.w * 0.5, rect.y + rect.h * 0.54, {
        size: 13,
        family: '"Press Start 2P", monospace',
        color: PALETTE.cream,
        outline: PALETTE.ink,
        outlineWidth: 3
      });
      ctx.restore();
      this.drawKitchenNote(ctx, 'DECORA EL PLATO Y PULSA SERVIR', this.plateCenter.x, this.tray.y - 12, {
        size: 10,
        color: PALETTE.pineapple
      });
    }

    this.drawCounterPill(ctx, `PLATO ${allText}`, this.width * 0.5 - 95, 16, {
      width: 190,
      color: this.allPlaced ? PALETTE.lime : this.accent
    });
  }
}
