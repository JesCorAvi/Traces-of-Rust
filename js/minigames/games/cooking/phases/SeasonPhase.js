// Fase 3 de cocina: agitar el salero y soltar en la zona verde.
// Exports: SeasonPhase.

import { CookingPhase, hexColor } from '../CookingPhase.js';
import { PALETTE } from '../../../assets/palette.js';
import {
  TAU, clamp, rand, lerp, circle, fillRoundRect, strokeRoundRect, text, rgba
} from '../../../core/Draw.js';

export class SeasonPhase extends CookingPhase {
  constructor({ recipe, difficulty, kitchenSpeed } = {}) {
    const diff = clamp(difficulty || 1, 1, 5);
    super({
      id: 'season',
      title: 'SAZONAR',
      kicker: 'FASE 3 · SALERO',
      instruction: 'Mantén pulsado y agita el salero. Suelta cuando la barra esté en la zona verde.',
      gesture: 'gesture-shake',
      duration: 8 + diff * 0.3,
      weight: 1,
      hint: 'AGITA SIN PARAR · SUELTA EN LA ZONA VERDE',
      accent: hexColor(recipe?.color || '#ffb23f'),
      recipe,
      difficulty,
      kitchenSpeed
    });
    this.shakerVisual = { scaleX: 1, scaleY: 1 };
    this.plateVisual = { scaleX: 1, scaleY: 1 };
    this.shaker = { x: 0, y: 0, rotation: 0 };
    this.band = { min: 0, max: 0, center: 0.62 };
  }

  updateLayout() {
    const w = this.width;
    const h = this.height;
    this.plate = {
      x: w * 0.5,
      y: h * 0.61,
      scale: Math.max(1.05, Math.min(w / 950, h / 650) * 1.25)
    };
    this.bar = { x: w * 0.18, y: h * 0.84, w: w * 0.64, h: 34 };
    this.bandCenter = 0.62;
    this.bandHalf = Math.max(0.072, 0.13 - this.difficulty * 0.011) * (1 + this.kitchenSpeed * 0.1);
    this.band = {
      center: this.bandCenter,
      min: this.bandCenter - this.bandHalf,
      max: this.bandCenter + this.bandHalf
    };
    this.shakerRest = { x: w * 0.64, y: h * 0.43 };
    this.shaker.x = this.game?.input?.x || this.shakerRest.x;
    this.shaker.y = this.game?.input?.y || this.shakerRest.y;
    this.primaryId = this.primaryIngredientId;
    this.ingredientScale = Math.max(0.55, Math.min(0.9, this.plate.scale * 0.68));
  }

  resetState() {
    this.season = 0.18;
    this.holding = false;
    this.wasHolding = false;
    this.released = false;
    this.completed = false;
    this.releaseAccuracy = 0;
    this.failLabel = '';
    this.shakeEnergy = 0;
    this.lastShakeSound = -1;
    this.lastSizzle = -1;
    this.saltTimer = 0;
    this.lastSquash = -1;
    this.osc = { energy: 0, changes: 0, amplitude: 0 };
    this.stats = {};
  }

  onUpdate(dt) {
    if (this.done) return;
    const input = this.game.input;
    this.holding = input.down;
    const osc = input.getOscillation();
    this.osc = osc;
    const intensity = clamp(osc.energy / 620);
    this.shakeEnergy = intensity;

    if (this.holding) {
      this.shaker.x = input.x;
      this.shaker.y = input.y;
      this.shaker.rotation = clamp(input.dx * 0.018, -0.55, 0.55);
      this.season = clamp(this.season + dt * (0.016 + intensity * 0.27));
      if (intensity > 0.1) {
        const squashBucket = Math.floor(this.elapsed * 8);
        if (squashBucket !== this.lastSquash) {
          this.lastSquash = squashBucket;
          this.game.juice.squash(this.shakerVisual, { sx: 1.06, sy: 0.94, duration: 0.16 });
        }
      }
      this.saltTimer -= dt;
      if (this.saltTimer <= 0 && intensity > 0.04) {
        this.saltTimer = 0.045;
        for (let i = 0; i < 2 + Math.round(intensity * 3); i++) {
          this.game.juice.particles.spawn({
            x: this.shaker.x + rand(-10, 10),
            y: this.shaker.y + 28,
            vx: rand(-28, 28),
            vy: rand(90, 200),
            life: rand(0.35, 0.7),
            size: rand(1.5, 3.5),
            endSize: 0.5,
            color: PALETTE.salt,
            gravity: 540,
            drag: 0.5,
            shape: 'circle',
            alpha: 0.85
          });
        }
      }
      if (this.elapsed - this.lastShakeSound > 0.18 && intensity > 0.06) {
        this.lastShakeSound = this.elapsed;
        this.game.audio.play('shake', { rate: 0.92 + Math.random() * 0.18, volume: 0.62 });
      }
      if (this.elapsed - this.lastSizzle > 0.45) {
        this.lastSizzle = this.elapsed;
        this.game.audio.play('sizzle', { volume: 0.36 });
      }
    } else {
      this.shaker.x = lerp(this.shaker.x, this.shakerRest.x, 0.18);
      this.shaker.y = lerp(this.shaker.y, this.shakerRest.y, 0.18);
      this.shaker.rotation = lerp(this.shaker.rotation, -0.18, 0.16);
    }

    if (input.justReleased && this.wasHolding && !this.released) this._release();
    this.wasHolding = this.holding;
    this.stats = { season: this.season, energy: intensity, released: this.released };
  }

  onTimeUp() {
    if (!this.released) {
      this.released = true;
      this.completed = false;
      this.releaseAccuracy = 0.08;
      this.failLabel = '¡SE QUEMÓ!';
      this.game.registerMiss(this.width * 0.5, this.plate.y - 70, '¡SE QUEMÓ!');
      this.finish(this.releaseAccuracy, { timeUp: true, released: false });
    }
  }

  _release() {
    this.released = true;
    const distance = Math.abs(this.season - this.band.center);
    const half = this.bandHalf;
    const inBand = distance <= half;
    if (inBand) {
      const accuracy = clamp(1 - distance / Math.max(0.001, half));
      const quality = clamp(accuracy * 0.72 + clamp(this.shakeEnergy) * 0.28);
      this.completed = true;
      this.releaseAccuracy = quality;
      this.game.registerHit(accuracy > 0.55 ? 'perfect' : 'good', this.shaker.x, this.shaker.y - 40, {
        label: accuracy > 0.55 ? '¡EN SU PUNTO!' : '¡BUEN TOQUE!',
        target: this.shakerVisual
      });
      this.game.juice.confetti(this.plate.x, this.plate.y - 40, 22);
      this.finish(quality, { released: true, inBand: true });
      return;
    }
    this.completed = false;
    this.releaseAccuracy = clamp(0.12 + Math.max(0, 1 - Math.abs(this.season - this.band.center) / 0.5) * 0.22);
    this.failLabel = this.season < this.band.min ? '¡POCO SAL!' : '¡SALADOS!';
    this.game.registerMiss(this.shaker.x, this.shaker.y - 40, this.failLabel);
    this.finish(this.releaseAccuracy, { released: true, inBand: false });
  }

  getScore() {
    return clamp(this.releaseAccuracy);
  }

  render(ctx) {
    const plate = this.plate;
    const scale = plate.scale;

    // Plato con el plato principal.
    ctx.save();
    ctx.translate(plate.x, plate.y);
    circle(ctx, 0, 18 * scale, 92 * scale, rgba(PALETTE.ink, 0.2));
    this.drawIngredient(ctx, 'plate', 0, 0, scale, {
      sx: this.plateVisual.scaleX,
      sy: this.plateVisual.scaleY
    });
    this.drawIngredient(ctx, this.primaryId, 0, -8 * scale, this.ingredientScale, {
      rotation: -0.08,
      sx: this.plateVisual.scaleX,
      sy: this.plateVisual.scaleY
    });
    // Montaña de sal.
    const saltSize = clamp(this.season);
    const mound = 8 + saltSize * 26 * scale;
    ctx.beginPath();
    ctx.ellipse(0, 2 * scale, 28 * scale + saltSize * 18 * scale, mound * 0.55, 0, Math.PI, TAU);
    ctx.closePath();
    const saltGrad = ctx.createLinearGradient(0, -mound, 0, 0);
    saltGrad.addColorStop(0, PALETTE.salt);
    saltGrad.addColorStop(1, '#c7d6cc');
    ctx.fillStyle = saltGrad;
    ctx.fill();
    ctx.strokeStyle = rgba(PALETTE.ink, 0.35);
    ctx.lineWidth = 2;
    ctx.stroke();
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU + this.elapsed * 0.2;
      const r = 10 + (i % 3) * 8 + saltSize * 14;
      ctx.globalAlpha = 0.5 + Math.sin(this.elapsed * 3 + i) * 0.2;
      circle(ctx, Math.cos(a) * r * 0.9, -mound * 0.35 + Math.sin(a) * r * 0.3, 1.6 + (i % 2), PALETTE.salt);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // Salero.
    const shakerX = this.shaker.x || this.shakerRest.x;
    const shakerY = this.shaker.y || this.shakerRest.y;
    this.drawIngredient(ctx, 'saltshaker', shakerX, shakerY, 0.86, {
      rotation: this.shaker.rotation,
      sx: this.shakerVisual.scaleX,
      sy: this.shakerVisual.scaleY
    });
    if (this.holding) this.drawIngredientRing(ctx, shakerX, shakerY + 46, 16, this.shakeEnergy > 0.18 ? PALETTE.lime : PALETTE.mango, true);

    // Barra de sazón.
    const bar = this.bar;
    const trackX = bar.x;
    const trackY = bar.y;
    const trackW = bar.w;
    const trackH = bar.h;
    fillRoundRect(ctx, trackX - 8, trackY - 12, trackW + 16, trackH + 34, 16, rgba(PALETTE.ink, 0.65));
    fillRoundRect(ctx, trackX, trackY, trackW, trackH, trackH / 2, '#3b2518');
    const fillW = trackW * clamp(this.season);
    const fillGrad = ctx.createLinearGradient(trackX, 0, trackX + Math.max(1, fillW), 0);
    fillGrad.addColorStop(0, PALETTE.salt);
    fillGrad.addColorStop(1, PALETTE.pineapple);
    fillRoundRect(ctx, trackX + 2, trackY + 2, Math.max(0, fillW - 4), trackH - 4, trackH / 2, fillGrad);
    const bandX = trackX + trackW * this.band.min;
    const bandW = trackW * (this.band.max - this.band.min);
    const bandGrad = ctx.createLinearGradient(0, trackY, 0, trackY + trackH);
    bandGrad.addColorStop(0, PALETTE.lime);
    bandGrad.addColorStop(1, '#3d9c3d');
    fillRoundRect(ctx, bandX, trackY + 3, bandW, trackH - 6, trackH / 2, bandGrad);
    strokeRoundRect(ctx, bandX, trackY + 3, bandW, trackH - 6, trackH / 2, PALETTE.cream, 2);
    const markerX = trackX + fillW;
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(markerX, trackY - 8);
    ctx.lineTo(markerX, trackY + trackH + 8);
    ctx.stroke();
    ctx.strokeStyle = PALETTE.cream;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(markerX, trackY - 8);
    ctx.lineTo(markerX + 7, trackY - 18);
    ctx.lineTo(markerX - 7, trackY - 18);
    ctx.closePath();
    ctx.fillStyle = PALETTE.cream;
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2;
    ctx.stroke();

    text(ctx, 'SOSO', trackX + 4, trackY + trackH + 22, {
      size: 9, family: '"Press Start 2P", monospace', color: PALETTE.cream,
      align: 'left', outline: PALETTE.ink, outlineWidth: 3
    });
    text(ctx, 'EN SU PUNTO', trackX + trackW * 0.5, trackY + trackH + 22, {
      size: 9, family: '"Press Start 2P", monospace', color: PALETTE.lime,
      align: 'center', outline: PALETTE.ink, outlineWidth: 3
    });
    text(ctx, 'SALADO', trackX + trackW - 4, trackY + trackH + 22, {
      size: 9, family: '"Press Start 2P", monospace', color: PALETTE.coral,
      align: 'right', outline: PALETTE.ink, outlineWidth: 3
    });

    // Medidor de agitado.
    const meterX = this.width * 0.5 - 90;
    const meterY = this.height * 0.15;
    const meterW = 180;
    fillRoundRect(ctx, meterX, meterY, meterW, 14, 7, rgba(PALETTE.ink, 0.55));
    const energyW = meterW * clamp(this.shakeEnergy);
    if (energyW > 2) {
      const energyGrad = ctx.createLinearGradient(meterX, 0, meterX + meterW, 0);
      energyGrad.addColorStop(0, PALETTE.mango);
      energyGrad.addColorStop(1, PALETTE.coral);
      fillRoundRect(ctx, meterX + 2, meterY + 2, energyW - 4, 10, 5, energyGrad);
    }
    text(ctx, 'AGITA EL SALERO', this.width * 0.5, meterY + 28, {
      size: 9, family: '"Press Start 2P", monospace', color: PALETTE.cream,
      outline: PALETTE.ink, outlineWidth: 3
    });

    this.drawCounterPill(ctx, this.released ? (this.completed ? 'SAZÓN PERFECTA' : this.failLabel) : 'MANTÉN Y AGITA', 16, this.bar.y - 54, {
      width: 240,
      color: this.completed ? PALETTE.lime : this.accent
    });
  }
}
