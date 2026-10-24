// Fase 1 de cocina: cortar siguiendo guías punteadas con trazos limpios.
// Exports: ChopPhase.

import { CookingPhase, hexColor } from '../CookingPhase.js';
import { PALETTE } from '../../../assets/palette.js';
import { clamp, rand, circle } from '../../../core/Draw.js';

export class ChopPhase extends CookingPhase {
  constructor({ recipe, difficulty, kitchenSpeed } = {}) {
    const cuts = Math.max(2, Math.min(5, Math.round(recipe?.steps?.chop?.cuts || 3)));
    super({
      id: 'chop',
      title: 'CORTAR',
      kicker: 'FASE 1 · TABLA DE CORTE',
      instruction: 'Arrastra el cuchillo por cada guía de puntos. Trazos rectos y parejos suman más.',
      gesture: 'gesture-drag',
      duration: Math.max(8, 8.2 + cuts * 0.9),
      weight: 1.15,
      hint: 'SIGUE LA GUÍA · MANTÉN EL PULSO · CORTA LIMPIO',
      accent: hexColor(recipe?.color || '#ff6b4a'),
      recipe,
      difficulty,
      kitchenSpeed
    });
    this.cutsRequired = cuts;
    this.toleranceNorm = Math.max(0.032, 0.072 - this.difficulty * 0.006);
  }

  updateLayout() {
    const w = this.width;
    const h = this.height;
    const boardW = Math.min(w * 0.8, 800);
    const boardH = Math.min(h * 0.37, 235);
    this.board = {
      x: (w - boardW) / 2,
      y: h * 0.46,
      w: boardW,
      h: boardH
    };
    this.guideTop = this.board.y + this.board.h * 0.17;
    this.guideBottom = this.board.y + this.board.h * 0.84;
    this.ingredientY = this.board.y + this.board.h * 0.58;
    this.tolerance = Math.max(18, this.board.w * this.toleranceNorm);
    const usable = this.board.w - 100;
    const startX = this.board.x + 50;
    this.guides = Array.from({ length: this.cutsRequired }, (_, i) => ({
      x: startX + usable * (i + 1) / (this.cutsRequired + 1),
      done: false,
      accuracy: 0,
      deviation: 0
    }));
    const ids = this.ingredientIds;
    const pieces = Math.max(5, this.cutsRequired + 3);
    this.pieces = Array.from({ length: pieces }, (_, i) => {
      const id = ids[i % ids.length] || this.primaryIngredientId;
      return {
        id,
        x: this.board.x + this.board.w * (i + 0.5) / pieces,
        y: this.ingredientY + Math.sin(i * 1.9) * 4,
        rotation: rand(-0.22, 0.22),
        scale: Math.max(0.43, Math.min(0.7, this.board.h / 280)),
        visual: { scaleX: 1, scaleY: 1 }
      };
    });
    this.knifeVisual = { scaleX: 1, scaleY: 1 };
  }

  resetState() {
    this.currentGuide = 0;
    this.cutting = false;
    this.cutStartTime = 0;
    this.cutDeviationSum = 0;
    this.cutSamples = 0;
    this.cutDeviations = [];
    this.cutTimes = [];
    this.completed = false;
    this.lastSliceSound = -1;
    this.lastDust = -1;
    this.cutMarks = [];
    this.stats = {};
  }

  syncInputTarget() {
    this.game.input.clearCircleTarget();
  }

  onPointerDownInternal(input, event, point) {
    if (this.done || this.completed || this.cutting) return;
    const guide = this.guides[this.currentGuide];
    if (!guide) return;
    this.cutting = true;
    this.cutStartTime = this.elapsed;
    this.cutDeviationSum = 0;
    this.cutSamples = 0;
    this.cutStartY = input.y;
    this.game.audio.play('click', { volume: 0.5 });
  }

  onPointerUpInternal(input) {
    if (!this.cutting || this.done) return;
    const guide = this.guides[this.currentGuide];
    if (!guide) return;
    const reached = input.y >= this.guideTop + (this.guideBottom - this.guideTop) * 0.5;
    if (!reached) {
      this.cutting = false;
      return;
    }
    this._completeCut(input);
  }

  onUpdate(dt) {
    if (this.done || this.completed) return;
    const input = this.game.input;
    const guide = this.guides[this.currentGuide];
    if (!guide) return;

    if (this.cutting && input.down) {
      const deviation = Math.abs(input.x - guide.x);
      this.cutDeviationSum += deviation;
      this.cutSamples++;
      if (this.elapsed - this.lastSliceSound > 0.15) {
        this.lastSliceSound = this.elapsed;
        this.game.audio.play('slice', {
          rate: 0.9 + Math.random() * 0.16,
          volume: clamp(0.6 - deviation / Math.max(1, this.tolerance) * 0.22, 0.18, 0.6)
        });
      }
      if (this.elapsed - this.lastDust > 0.07 && deviation < this.tolerance * 2.4) {
        this.lastDust = this.elapsed;
        this.game.juice.particles.spawn({
          x: input.x + rand(-5, 5),
          y: input.y + rand(-4, 4),
          vx: rand(-30, 30),
          vy: rand(-50, -10),
          life: rand(0.18, 0.42),
          size: rand(1.2, 3.4),
          color: this.colorFor(guide.id || this.primaryIngredientId, PALETTE.coral),
          gravity: 260,
          drag: 1.4,
          shape: 'circle',
          alpha: 0.8
        });
      }
      if (input.y >= this.guideBottom) this._completeCut(input);
    }
    this.stats = { done: this.guides.filter(g => g.done).length, cutting: this.cutting };
  }

  _completeCut(input) {
    const guide = this.guides[this.currentGuide];
    if (!guide || guide.done) return;
    const avgDeviation = this.cutSamples > 0
      ? this.cutDeviationSum / this.cutSamples
      : this.tolerance * 2;
    guide.done = true;
    guide.deviation = avgDeviation;
    guide.accuracy = clamp(1 - avgDeviation / Math.max(1, this.tolerance));
    this.cutDeviations.push(avgDeviation);
    this.cutTimes.push(this.elapsed - this.cutStartTime);
    this.cutMarks.push({ x: guide.x, deviation: avgDeviation });
    this.cutting = false;
    const perfect = guide.accuracy >= 0.7;
    this.game.registerHit(perfect ? 'perfect' : 'good', guide.x, this.ingredientY - 8, {
      label: perfect ? '¡CORTE LIMPIO!' : '¡CORTE!',
      target: this.knifeVisual
    });
    this.game.audio.play('chop', { volume: perfect ? 0.85 : 0.65 });
    this.game.juice.burst(guide.x, this.ingredientY, perfect ? 18 : 11, {
      speed: [70, 230],
      angle: [-Math.PI * 0.9, -Math.PI * 0.1],
      colors: [this.colorFor(this.primaryIngredientId, PALETTE.coral), PALETTE.pineapple, PALETTE.cream],
      life: [0.3, 0.72],
      size: [1.8, 5.5],
      gravity: 620,
      shape: ['circle', 'leaf'],
      endSize: 0.5
    });
    this.game.juice.shakeAdd(perfect ? 0.13 : 0.07);

    // Reacción del trozo más cercano.
    let nearest = null;
    let best = Infinity;
    for (const piece of this.pieces) {
      const d = Math.abs(piece.x - guide.x);
      if (d < best) { best = d; nearest = piece; }
    }
    if (nearest) this.game.juice.squash(nearest.visual, { sx: 0.84, sy: 1.16, duration: 0.24 });

    this.currentGuide++;
    if (this.currentGuide >= this.guides.length) {
      this.completed = true;
      this.game.audio.play('star', { rate: 1.05, volume: 0.8 });
      this.game.juice.confetti(this.board.x + this.board.w * 0.5, this.ingredientY - 20, 28);
      this.finish(this.getScore(), { cuts: this.guides.length });
    }
  }

  onTimeUp() {
    if (!this.completed) {
      const done = this.guides.filter(g => g.done).length;
      this.game.registerMiss(this.width * 0.5, this.ingredientY, done > 0 ? '¡SE ACABÓ EL TIEMPO!' : '¡NO CORTÓ NADA!');
    }
  }

  getScore() {
    const done = this.guides.filter(g => g.done).length;
    const completion = done / this.cutsRequired;
    if (done === 0) return 0;
    const precision = this.guides.reduce((sum, g) => sum + g.accuracy, 0) / done;
    let uniformity = 1;
    if (this.cutDeviations.length > 1) {
      const mean = this.cutDeviations.reduce((a, b) => a + b, 0) / this.cutDeviations.length;
      const variance = this.cutDeviations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / this.cutDeviations.length;
      uniformity = clamp(1 - Math.sqrt(variance) / Math.max(1, this.tolerance));
    }
    const speed = clamp(1.15 - this.elapsed / this.duration);
    return clamp(completion * (precision * 0.55 + uniformity * 0.2 + 0.15 + speed * 0.1));
  }

  render(ctx) {
    const board = this.board;
    this.drawBoard(ctx, board.x, board.y, board.w, board.h, {
      base: '#9a623b',
      dark: '#59331e',
      light: '#c68a52',
      radius: 24
    });

    // Ingredientes.
    for (const piece of this.pieces) {
      this.drawIngredient(ctx, piece.id, piece.x, piece.y, piece.scale, {
        rotation: piece.rotation,
        sx: piece.visual.scaleX,
        sy: piece.visual.scaleY
      });
    }

    // Cortes terminados.
    for (const mark of this.cutMarks) {
      ctx.save();
      ctx.strokeStyle = 'rgba(36,20,15,0.8)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(mark.x, this.guideTop);
      ctx.lineTo(mark.x, this.guideBottom);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,244,214,0.55)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    const guide = this.guides[this.currentGuide];
    if (guide && !this.completed) {
      const pulse = 0.55 + Math.sin(this.elapsed * 7) * 0.2;
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = PALETTE.cream;
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 10]);
      ctx.beginPath();
      ctx.moveTo(guide.x, this.guideTop);
      ctx.lineTo(guide.x, this.guideBottom);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      // Tope y flecha.
      circle(ctx, guide.x, this.guideTop, 9, PALETTE.pineapple, PALETTE.ink, 3);
      ctx.fillStyle = PALETTE.cream;
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(guide.x, this.guideBottom + 18);
      ctx.lineTo(guide.x - 8, this.guideBottom + 6);
      ctx.lineTo(guide.x + 8, this.guideBottom + 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      this.drawCounterPill(ctx, 'CORTA AQUÍ', guide.x - 74, this.guideTop - 98, {
        width: 148,
        color: PALETTE.pineapple,
        size: 10
      });
    }

    // Cuchillo.
    const input = this.game.input;
    const knifeX = input.down ? input.x : (guide?.x || this.board.x + this.board.w * 0.5);
    const knifeY = input.down ? input.y : this.guideTop - 28 + Math.sin(this.elapsed * 2.7) * 5;
    this.drawIngredient(ctx, 'knife', knifeX, knifeY, 0.9, {
      rotation: input.down ? clamp(-0.12 + input.dy * 0.004, -0.45, 0.25) : -0.12,
      sx: this.knifeVisual.scaleX,
      sy: this.knifeVisual.scaleY
    });

    const done = this.guides.filter(g => g.done).length;
    this.drawCounterPill(ctx, `CORTES ${done}/${this.cutsRequired}`, board.x + 16, board.y + board.h + 18, {
      width: 190,
      color: PALETTE.lime
    });
  }
}
