// Fase 4 de cocina: controlar la cocción y voltear con un flick en el punto justo.
// Exports: SearPhase.

import { CookingPhase, hexColor } from '../CookingPhase.js';
import { PALETTE } from '../../../assets/palette.js';
import { drawFlames, drawBurner, drawDonenessMeter } from '../CookingArt.js';
import { clamp, rand } from '../../../core/Draw.js';

export class SearPhase extends CookingPhase {
  constructor({ recipe, difficulty, kitchenSpeed } = {}) {
    const diff = clamp(difficulty || 1, 1, 5);
    super({
      id: 'sear',
      title: 'SARTÉN',
      kicker: 'FASE 4 · FUEGO',
      instruction: 'Espera a que la aguja entre en la zona verde y desliza hacia arriba para voltear.',
      gesture: 'gesture-flick',
      duration: 10 + diff * 0.35,
      weight: 1.3,
      hint: 'FLICK HACIA ARRIBA EN LA ZONA VERDE · DOS VOLTEOS',
      accent: hexColor(recipe?.color || '#ff6b4a'),
      recipe,
      difficulty,
      kitchenSpeed
    });
    this.requiredFlips = 2;
    this.perfectMin = clamp(recipe?.steps?.cook?.targetMin ?? 0.44, 0.05, 0.9);
    this.perfectMax = clamp(recipe?.steps?.cook?.targetMax ?? 0.74, this.perfectMin + 0.08, 0.96);
    this.donenessRate = (0.17 + diff * 0.025) / (1 + this.kitchenSpeed * 0.12);
    this.panVisual = { scaleX: 1, scaleY: 1 };
    this.ingredientVisual = { scaleX: 1, scaleY: 1 };
  }

  updateLayout() {
    const w = this.width;
    const h = this.height;
    const scale = Math.max(0.82, Math.min(w / 950, h / 620) * 1.08);
    this.pan = { x: w * 0.5, y: h * 0.56, scale };
    this.panWidth = 190 * scale;
    this.donenessBar = { x: w * 0.5, y: h * 0.83, w: w * 0.6, h: 32 };
    this.ingredientScale = Math.max(0.55, Math.min(0.9, scale * 0.74));
    this.dishId = this.primaryIngredientId;
  }

  resetState() {
    this.doneness = 0.1;
    this.flips = 0;
    this.attempts = [];
    this.burnt = false;
    this.completed = false;
    this.flipAnim = 0;
    this.lastSizzle = -1;
    this.lastSmoke = -1;
    this.lastWarning = -1;
    this.stats = {};
  }

  onPointerUpInternal(input) {
    if (this.done || this.completed || this.burnt) return;
    const isFlick = !!(input.flick && input.flick.up) || (input.peakSpeed > 470 && input.dy < -10);
    if (!isFlick) return;
    this._flip();
  }

  _flip() {
    const inBand = this.doneness >= this.perfectMin && this.doneness <= this.perfectMax;
    const center = (this.perfectMin + this.perfectMax) * 0.5;
    const half = Math.max(0.001, (this.perfectMax - this.perfectMin) * 0.5);
    const accuracy = inBand
      ? clamp(1 - Math.abs(this.doneness - center) / half * 0.82)
      : clamp(0.12 - Math.abs(this.doneness - center) * 0.18, 0, 0.12);
    this.flips++;
    this.attempts.push(accuracy);
    const px = this.pan.x;
    const py = this.pan.y - 42 * this.pan.scale;

    if (inBand) {
      this.game.registerHit(accuracy >= 0.62 ? 'perfect' : 'good', px, py, {
        label: accuracy >= 0.62 ? '¡VOLTEO PERFECTO!' : '¡BUEN VOLTEO!',
        target: this.ingredientVisual
      });
      this.game.juice.burst(px, py + 12, 15, {
        speed: [70, 220],
        angle: [-Math.PI * 0.9, -Math.PI * 0.1],
        colors: [PALETTE.mango, PALETTE.pineapple, PALETTE.coralLight, PALETTE.cream],
        life: [0.3, 0.75],
        size: [2, 5],
        gravity: 520,
        shape: ['circle', 'spark'],
        endSize: 0.4
      });
    } else {
      this.game.registerMiss(px, py, this.doneness < this.perfectMin ? '¡AÚN CRUDO!' : '¡SE QUEMÓ!');
      this.game.juice.burst(px, py + 10, 10, {
        speed: [50, 160],
        angle: [-Math.PI * 0.9, -Math.PI * 0.1],
        colors: ['#5d6c70', '#3a2218', PALETTE.coralDark],
        life: [0.35, 0.8],
        size: [3, 7],
        gravity: -30,
        shape: 'circle',
        endSize: 12,
        alpha: 0.55
      });
    }
    this.game.audio.play('whoosh', { rate: 1.05, volume: 0.85 });
    this.game.audio.play('sizzle', { volume: 0.64 });
    this.game.juice.shakeAdd(inBand ? 0.12 : 0.2);
    this.game.juice.squash(this.panVisual, { sx: 1.08, sy: 0.88, duration: 0.3 });
    this.game.juice.tweens.to(this, { flipAnim: 1 }, {
      duration: 0.5,
      ease: 'sineInOut',
      onComplete: () => { this.flipAnim = 0; }
    });

    if (this.doneness > this.perfectMax) this.burnt = true;
    this.doneness = 0.12;

    if (this.burnt && this.flips < this.requiredFlips) {
      this.doneness = 0.98;
      this.finish(this.getScore(), { flips: this.flips, burnt: true });
      return;
    }
    if (this.flips >= this.requiredFlips) {
      this.completed = true;
      this.doneness = this.burnt ? 0.98 : (this.perfectMin + this.perfectMax) * 0.5;
      this.game.juice.confetti(px, py - 20, 26);
      this.finish(this.getScore(), { flips: this.flips, burnt: this.burnt });
    }
    this.stats = { flips: this.flips, doneness: this.doneness, burnt: this.burnt };
  }

  onUpdate(dt) {
    if (this.done || this.completed) return;
    if (!this.burnt) {
      this.doneness = clamp(this.doneness + dt * this.donenessRate);
      if (this.doneness >= 1) {
        this.burnt = true;
        this.game.audio.play('burn', { volume: 0.85 });
        this.game.registerMiss(this.pan.x, this.pan.y - 30, '¡SE QUEMÓ!');
        this.game.juice.burst(this.pan.x, this.pan.y - 20, 24, {
          speed: [40, 140],
          angle: [-Math.PI, 0],
          colors: ['#5d6c70', '#3a2218', '#24140f'],
          life: [0.5, 1.1],
          size: [4, 9],
          gravity: -45,
          shape: 'circle',
          endSize: 20,
          alpha: 0.5
        });
        this.game.juice.shakeAdd(0.22);
        this.finish(this.getScore(), { burnt: true });
        return;
      }
    }

    if (this.elapsed - this.lastSizzle > 0.35) {
      this.lastSizzle = this.elapsed;
      this.game.audio.play('sizzle', {
        rate: 0.9 + this.doneness * 0.2,
        volume: 0.45 + this.doneness * 0.2
      });
    }
    if (this.elapsed - this.lastSmoke > 0.16 && this.doneness > this.perfectMax * 0.9) {
      this.lastSmoke = this.elapsed;
      this.game.juice.particles.spawn({
        x: this.pan.x + rand(-20, 20),
        y: this.pan.y - rand(10, 30),
        vx: rand(-12, 12),
        vy: rand(-42, -18),
        life: rand(0.4, 0.9),
        size: rand(4, 9),
        endSize: rand(14, 24),
        color: this.doneness > this.perfectMax ? '#5d6c70' : PALETTE.steam,
        gravity: -18,
        drag: 0.8,
        shape: 'steam',
        alpha: 0.38
      });
    }
    if (this.doneness > this.perfectMax + 0.1 && this.elapsed - this.lastWarning > 1) {
      this.lastWarning = this.elapsed;
      this.game.juice.popText('¡SE VA A QUEMAR!', this.pan.x, this.pan.y - 110, {
        color: PALETTE.coral,
        size: 14,
        life: 0.7,
        vy: -24
      });
    }
    this.stats = { flips: this.flips, doneness: this.doneness, burnt: this.burnt };
  }

  onTimeUp() {
    if (this.completed) return;
    if (!this.burnt) {
      this.game.registerMiss(this.pan.x, this.pan.y - 30, this.flips > 0 ? '¡FALTÓ UN VOLTEO!' : '¡NO VOLTEASTE!');
    }
  }

  getScore() {
    const accuracy = this.attempts.length
      ? this.attempts.reduce((a, b) => a + b, 0) / this.attempts.length
      : 0;
    const completion = clamp(this.flips / this.requiredFlips);
    if (this.burnt) return clamp(0.04 + accuracy * 0.12 + completion * 0.08);
    const timeBonus = clamp(1 - this.elapsed / this.duration * 0.35);
    const base = accuracy * 0.55 + completion * 0.25 + timeBonus * 0.1;
    return clamp(base * (0.6 + 0.4 * completion) + 0.1);
  }

  render(ctx) {
    const pan = this.pan;
    const scale = pan.scale;
    const jump = Math.sin(Math.PI * clamp(this.flipAnim)) * 78;

    drawBurner(ctx, pan.x, pan.y + 34 * scale, 92 * scale);
    drawFlames(ctx, pan.x, pan.y + 38 * scale, scale * 1.1, this.elapsed);
    this.drawIngredient(ctx, 'pan', pan.x, pan.y + 10 * scale, scale, {
      rotation: -0.04,
      sx: this.panVisual.scaleX,
      sy: this.panVisual.scaleY
    });
    this.drawIngredient(ctx, this.dishId, pan.x - 2 * scale, pan.y - 20 * scale - jump, this.ingredientScale, {
      rotation: -0.08 + this.flipAnim * Math.PI * 1.8,
      sx: this.ingredientVisual.scaleX,
      sy: this.ingredientVisual.scaleY
    });

    const label = this.burnt ? '¡QUEMADO!' : (this.doneness < this.perfectMin ? 'CRUDO' : this.doneness > this.perfectMax ? 'PASADO' : 'EN SU PUNTO');
    const labelColor = this.burnt ? PALETTE.coral : this.doneness >= this.perfectMin && this.doneness <= this.perfectMax ? PALETTE.lime : PALETTE.mango;
    this.drawCounterPill(ctx, `VOLTEOS ${this.flips}/${this.requiredFlips}`, 16, this.height - 132, {
      width: 220,
      color: labelColor
    });
    this.drawCounterPill(ctx, label, this.width * 0.5 - 110, 16, {
      width: 220,
      color: labelColor
    });
    drawDonenessMeter(
      ctx,
      this.donenessBar.x,
      this.donenessBar.y,
      this.donenessBar.w,
      this.donenessBar.h,
      this.doneness,
      this.perfectMin,
      this.perfectMax
    );

    if (!this.completed && !this.burnt) {
      const hint = this.flipAnim > 0.01 ? '¡VOLTEANDO!' : 'DESLIZA HACIA ARRIBA PARA VOLTEAR';
      this.drawKitchenNote(ctx, hint, this.width * 0.5, this.height * 0.14, {
        size: 10,
        color: this.flipAnim > 0.01 ? PALETTE.lime : PALETTE.cream
      });
    }
  }
}
