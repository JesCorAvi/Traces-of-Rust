// Fase 2 de cocina: remover en círculos a velocidad constante sin salpicar.
// Exports: StirPhase.

import { CookingPhase, hexColor } from '../CookingPhase.js';
import { PALETTE } from '../../../assets/palette.js';
import { drawSpoon, drawSpeedMeter } from '../CookingArt.js';
import {
  TAU, clamp, rand, drawBubble, circle, rgba
} from '../../../core/Draw.js';

export class StirPhase extends CookingPhase {
  constructor({ recipe, difficulty, kitchenSpeed } = {}) {
    const diff = clamp(difficulty || 1, 1, 5);
    super({
      id: 'stir',
      title: 'REMOVER',
      kicker: 'FASE 2 · OLLA',
      instruction: 'Haz círculos dentro de la olla. Mantén el ritmo constante y no salpiques.',
      gesture: 'gesture-circle',
      duration: 9 + diff * 0.35,
      weight: 1.1,
      hint: 'CÍRCULOS CONSTANTES · EVITA SALPICAR EL CALDO',
      accent: hexColor(recipe?.color || '#3fc1c9'),
      recipe,
      difficulty,
      kitchenSpeed
    });
    this.potVisual = { scaleX: 1, scaleY: 1 };
  }

  updateLayout() {
    const w = this.width;
    const h = this.height;
    const scale = Math.max(1.02, Math.min(w / 750, h / 480) * 1.15);
    this.potScale = scale;
    this.soup = { x: w * 0.5, y: h * 0.53 };
    this.potWidth = 170 * scale;
    this.circleTarget = {
      x: this.soup.x,
      y: this.soup.y,
      inner: Math.max(13, 15 * scale),
      outer: Math.max(31, 38 * scale)
    };
    this.targetSpeed = 4.3 + this.difficulty * 0.3;
    this.speedTolerance = 2.0 - this.difficulty * 0.11;
    this.turnsRequired = 1.7 + this.difficulty * 0.28;
    this.splashThreshold = this.targetSpeed * 1.55;
    this.recipeColor = hexColor(this.recipe?.color || '#ff6b4a');
    this.floatingIngredientIds = [...new Set(Object.keys(this.recipe?.ingredients || {}))];
  }

  syncInputTarget() {
    this.game.input.setCircleTarget(this.circleTarget);
  }

  resetState() {
    this.speedScoreSum = 0;
    this.speedTime = 0;
    this.lastHalfTurn = 0;
    this.lastStirSound = -1;
    this.lastSizzle = -1;
    this.lastSteam = -1;
    this.lastSplash = -1;
    this.lastText = -1;
    this.splashTime = 0;
    this.splashEvents = 0;
    this.completed = false;
    this.circleStats = { turns: 0, angularSpeed: 0, inBandRatio: 0, consistency: 0 };
    this.stats = {};
  }

  onUpdate(dt) {
    if (this.done) return;
    const input = this.game.input;
    const stats = input.getCircleStats();
    this.circleStats = stats;

    if (stats.angularSpeed > 0.12) {
      const speedAccuracy = clamp(1 - Math.abs(stats.angularSpeed - this.targetSpeed) / (this.targetSpeed * 1.15));
      this.speedScoreSum += speedAccuracy * dt;
      this.speedTime += dt;
    }

    const tooFast = stats.angularSpeed > this.splashThreshold;
    if (tooFast) {
      this.splashTime += dt;
      if (this.elapsed - this.lastSplash > 0.16) {
        this.lastSplash = this.elapsed;
        this.splashEvents++;
        this.game.audio.play('splash', { rate: 0.9 + Math.random() * 0.2, volume: 0.7 });
        this.game.juice.burst(this.soup.x, this.soup.y, 10, {
          speed: [90, 260],
          angle: [-Math.PI * 0.9, -Math.PI * 0.1],
          colors: [this.recipeColor, PALETTE.coralLight, PALETTE.cream],
          life: [0.3, 0.65],
          size: [2, 5],
          gravity: 680,
          shape: 'circle',
          endSize: 0.5
        });
        this.game.juice.shakeAdd(0.12);
      }
    } else {
      this.splashTime = Math.max(0, this.splashTime - dt * 0.35);
    }

    const halfTurns = Math.floor(stats.turns * 2);
    if (halfTurns > this.lastHalfTurn) {
      this.lastHalfTurn = halfTurns;
      const perfect = !tooFast && stats.consistency > 0.52 && stats.inBandRatio > 0.42;
      const showText = perfect && this.elapsed - this.lastText > 0.75;
      if (showText) this.lastText = this.elapsed;
      this.game.registerHit(perfect ? 'perfect' : 'good', this.soup.x, this.soup.y - 12, {
        label: perfect ? '¡REMOVIENDO!' : '¡SIGUE ASÍ!',
        target: this.potVisual,
        showText
      });
      this.game.juice.burst(this.soup.x, this.soup.y, perfect ? 12 : 7, {
        speed: [35, 130],
        angle: [-Math.PI * 0.9, -Math.PI * 0.1],
        colors: [this.recipeColor, PALETTE.mango, PALETTE.cream],
        life: [0.25, 0.6],
        size: [1.8, 4.5],
        gravity: 480,
        shape: 'circle'
      });
      this.game.audio.play('stir', { rate: 0.9 + Math.random() * 0.15, volume: 0.55 });
    }

    if (this.elapsed - this.lastStirSound > 0.28) {
      this.lastStirSound = this.elapsed;
      this.game.audio.play('stir', { rate: 0.88 + Math.random() * 0.18, volume: 0.4 });
    }
    if (this.elapsed - this.lastSizzle > 0.55) {
      this.lastSizzle = this.elapsed;
      this.game.audio.play('sizzle', { volume: 0.38 });
    }
    if (this.elapsed - this.lastSteam > 0.18) {
      this.lastSteam = this.elapsed;
      this.game.juice.steam(this.soup.x + rand(-18, 18), this.soup.y - 30, 1);
    }

    if (stats.turns >= this.turnsRequired && stats.inBandRatio > 0.3) {
      this.completed = true;
      this.game.registerHit('perfect', this.soup.x, this.soup.y - 24, {
        label: '¡EN SU PUNTO!',
        target: this.potVisual
      });
      this.game.juice.confetti(this.soup.x, this.soup.y - 24, 24);
      this.finish(this.getScore(), { turns: stats.turns, splashes: this.splashEvents });
    }

    this.stats = {
      turns: stats.turns,
      angularSpeed: stats.angularSpeed,
      inBandRatio: stats.inBandRatio,
      consistency: stats.consistency,
      splashes: this.splashEvents
    };
  }

  onTimeUp() {
    if (!this.completed) {
      this.game.registerMiss(this.soup.x, this.soup.y - 20, this.circleStats.turns > 0.8 ? '¡SE ENFRIÓ!' : '¡NI LO REMOVISTE!');
    }
  }

  getScore() {
    const stats = this.circleStats;
    const turns = clamp(stats.turns / this.turnsRequired);
    const speed = this.speedTime > 0 ? clamp(this.speedScoreSum / this.speedTime) : 0;
    const band = clamp(stats.inBandRatio / 0.72);
    const consistency = clamp(stats.consistency);
    const clean = clamp(1 - this.splashTime / 1.15);
    const base = turns * 0.35 + speed * 0.2 + consistency * 0.15 + band * 0.15 + clean * 0.15;
    return clamp(base * (0.55 + 0.45 * turns));
  }

  render(ctx) {
    const { x: cx, y: cy } = this.soup;
    const scale = this.potScale;
    const potWidth = this.potWidth;

    // Trivet y olla.
    ctx.save();
    circle(ctx, cx, cy + 44 * scale, potWidth * 0.5, rgba(PALETTE.ink, 0.26));
    circle(ctx, cx, cy + 44 * scale, potWidth * 0.43, rgba(PALETTE.wood, 0.85), PALETTE.ink, 3);
    ctx.restore();
    const potY = cy + (0.86 * 150 - 56) * scale;
    this.drawIngredient(ctx, 'pot', cx, potY, scale, {
      sx: this.potVisual.scaleX,
      sy: this.potVisual.scaleY
    });

    // Caldo.
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, 46 * scale, 17 * scale, 0, 0, TAU);
    const soupGrad = ctx.createLinearGradient(0, cy - 18 * scale, 0, cy + 18 * scale);
    soupGrad.addColorStop(0, PALETTE.coralLight);
    soupGrad.addColorStop(0.5, this.recipeColor);
    soupGrad.addColorStop(1, PALETTE.coralDark);
    ctx.fillStyle = soupGrad;
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.clip();
    for (let i = 0; i < 7; i++) {
      const a = this.elapsed * (0.6 + i * 0.08) + i * 1.7;
      const r = (8 + i * 4 + Math.sin(this.elapsed * 2 + i) * 3) * scale;
      drawBubble(ctx, cx + Math.cos(a) * r, cy + Math.sin(a * 1.3) * r * 0.38, (2.5 + (i % 3) * 1.6) * scale, PALETTE.lagoonLight, 0.5);
    }
    // Ingredientes flotando.
    for (let i = 0; i < Math.min(4, this.floatingIngredientIds.length); i++) {
      const id = this.floatingIngredientIds[i];
      const a = this.elapsed * 0.5 + i * 1.7;
      const x = cx + Math.cos(a) * 22 * scale;
      const y = cy + Math.sin(a * 1.3) * 7 * scale;
      this.drawIngredient(ctx, id, x, y, Math.max(0.25, 0.34 * scale), {
        rotation: Math.sin(a) * 0.18,
        alpha: 0.9
      });
    }
    ctx.restore();

    // Banda guía.
    const inner = this.circleTarget.inner;
    const outer = this.circleTarget.outer;
    const guideR = (inner + outer) * 0.5;
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = PALETTE.lagoonLight;
    ctx.lineWidth = Math.max(10, outer - inner);
    ctx.beginPath();
    ctx.arc(cx, cy, guideR, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 0.9;
    ctx.setLineDash([8, 10]);
    ctx.lineWidth = 4;
    ctx.strokeStyle = PALETTE.cream;
    ctx.beginPath();
    ctx.arc(cx, cy, guideR, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = PALETTE.lagoon;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, outer, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, inner, 0, TAU);
    ctx.stroke();
    ctx.restore();

    // Flechas.
    const arrowAngle = this.elapsed * 1.5;
    for (let i = 0; i < 4; i++) {
      const a = arrowAngle + (i / 4) * TAU;
      const ax = cx + Math.cos(a) * guideR;
      const ay = cy + Math.sin(a) * guideR;
      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(a + Math.PI / 2);
      ctx.fillStyle = PALETTE.cream;
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.lineTo(-6, -6);
      ctx.lineTo(-6, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Cuchara.
    const input = this.game.input;
    const pointerX = input.x || cx;
    const pointerY = input.y || cy;
    if (input.x || input.y || input.down) {
      drawSpoon(ctx, pointerX, pointerY, -0.7 + input.dx * 0.02, scale);
      this.drawIngredientRing(ctx, pointerX, pointerY, 15, this.speedInBand() ? PALETTE.lime : PALETTE.coral, true);
    } else {
      drawSpoon(ctx, cx + guideR, cy, -0.7 + Math.sin(this.elapsed * 2) * 0.1, scale);
    }

    // Progreso.
    const progress = clamp(this.circleStats.turns / this.turnsRequired);
    const ringR = potWidth * 0.64;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = rgba(PALETTE.ink, 0.42);
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = PALETTE.lagoonLight;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, -Math.PI / 2, -Math.PI / 2 + TAU * progress);
    ctx.stroke();
    if (progress > 0.02) {
      const endAngle = -Math.PI / 2 + TAU * progress;
      circle(ctx, cx + Math.cos(endAngle) * ringR, cy + Math.sin(endAngle) * ringR, 6, PALETTE.cream, PALETTE.ink, 2);
    }
    ctx.restore();

    const turns = this.circleStats.turns || 0;
    this.drawCounterPill(ctx, `VUELTAS ${turns.toFixed(1)} / ${this.turnsRequired.toFixed(1)}`, 16, this.height - 46, {
      width: 250,
      color: PALETTE.lagoon
    });
    drawSpeedMeter(ctx, cx, cy + 118 * scale, potWidth * 0.42, this.circleStats.angularSpeed, this.targetSpeed, this.speedTolerance);

    if (this.splashTime > 0.12) {
      this.drawKitchenNote(ctx, '¡SALPICAS!', this.width * 0.5, this.height * 0.13, {
        size: 13,
        color: PALETTE.coral
      });
    }
  }

  speedInBand() {
    return Math.abs((this.circleStats?.angularSpeed || 0) - this.targetSpeed) <= this.speedTolerance * 0.7;
  }
}
