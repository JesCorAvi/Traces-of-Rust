// Minijuego de pesca de la laguna: lanzar, esperar, forcejear y recoger.
// El pez y la recompensa dependen del lanzamiento, la dificultad y la captura.
// Exports: FishingGame.

import { MiniGame } from '../../core/MiniGame.js';
import { CHIRINGUITO_CONFIG } from '../../../config/chiringuitoConfig.js';
import { PALETTE } from '../../assets/palette.js';
import {
  TAU, clamp, rand, circle, fillRoundRect,
  drawWoodSurface, drawPalmLeaf, drawVignette
} from '../../core/Draw.js';
import { CastPhase } from './phases/CastPhase.js';
import { WaitPhase } from './phases/WaitPhase.js';
import { ReelPhase } from './phases/ReelPhase.js';
import { WindPhase } from './phases/WindPhase.js';

export class FishingGame extends MiniGame {
  constructor({ services, difficulty = 1, options = {} } = {}) {
    super({
      id: 'fishing',
      title: 'PESCA // LAGUNA DEL CHIRINGUITO',
      difficulty,
      services,
      options
    });
    this.resultTitle = 'PESCA COMPLETADA';
    this.fishType = null;
    this.castAccuracy = 0;
    this.castSpot = null;
    this.biteQuality = 0;
    this.escaped = false;
    this.escapeReason = '';
    this.caught = false;
    this.fishAmount = 0;
    this._background = null;
    this._backgroundKey = '';
  }

  createPhases() {
    return [
      new CastPhase({ difficulty: this.difficulty }),
      new WaitPhase({ difficulty: this.difficulty }),
      new ReelPhase({ difficulty: this.difficulty }),
      new WindPhase({ difficulty: this.difficulty })
    ];
  }

  onInit() {
    this.assets.preload({
      sprites: [
        'fish', 'bobber', 'star', 'spark',
        'gesture-hold', 'gesture-tap', 'gesture-drag', 'gesture-circle'
      ],
      sounds: [
        'whoosh', 'splash', 'bite', 'reel', 'water',
        'perfect', 'good', 'fail', 'combo', 'tap',
        'star', 'phaseClear', 'pop', 'select'
      ]
    });
  }

  onResize() {
    this._background = null;
    this._backgroundKey = '';
  }

  rollFish(castAccuracy = 0.5) {
    this.castAccuracy = clamp(castAccuracy);
    this.fishType = CHIRINGUITO_CONFIG.pickFishType({
      difficulty: this.difficulty,
      castAccuracy: this.castAccuracy
    });
    return this.fishType;
  }

  buildRewards(stars = 1, accuracy = 0) {
    if (this.escaped || !this.fishType) {
      this.fishAmount = 0;
      return {
        pearls: 0,
        ingredients: {},
        extra: ['SIN CAPTURA']
      };
    }
    const score = this.score.getScore();
    const base = Math.max(1, Number(this.fishType.yield) || 1);
    const bonus = score >= 82 ? 1 : 0;
    const max = CHIRINGUITO_CONFIG.FISHING.fishPerCatchMax || 3;
    const amount = Math.max(1, Math.min(max, base + bonus));
    this.fishAmount = amount;
    const rewards = {
      pearls: this.fishType.rare ? (CHIRINGUITO_CONFIG.FISHING.rarePearls || 2) : 0,
      ingredients: { fish: amount },
      extra: [this.fishType.name]
    };
    if (this.fishType.rare) rewards.extra.push('CAPTURA RARA');
    return rewards;
  }

  getResultExtras() {
    return {
      fishId: this.fishType?.id || null,
      fishName: this.fishType?.name || null,
      rare: !!this.fishType?.rare,
      fishAmount: this.fishAmount,
      escaped: this.escaped,
      escapeReason: this.escapeReason
    };
  }

  _finish() {
    if (this.escaped) this.resultTitle = this.escapeReason || 'SE ESCAPÓ';
    else if (this.fishType) this.resultTitle = `¡${this.fishType.name.toUpperCase()}!`;
    else this.resultTitle = 'PESCA COMPLETADA';
    super._finish();
  }

  drawBackground(ctx, width, height) {
    const key = `${width}x${height}`;
    if (!this._background || this._backgroundKey !== key) {
      this._background = this._buildLagoonBackground(width, height);
      this._backgroundKey = key;
    }
    if (this._background) ctx.drawImage(this._background, 0, 0, width, height);
    else {
      ctx.fillStyle = PALETTE.seaDeep;
      ctx.fillRect(0, 0, width, height);
    }
  }

  _buildLagoonBackground(width, height) {
    if (typeof document === 'undefined') return null;
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.scale(scale, scale);

    // Cielo de atardecer.
    const sky = ctx.createLinearGradient(0, 0, 0, height * 0.55);
    sky.addColorStop(0, PALETTE.skyTop);
    sky.addColorStop(0.42, PALETTE.skyMid);
    sky.addColorStop(0.78, PALETTE.skyLow);
    sky.addColorStop(1, '#ffb37a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height * 0.58);
    const sunX = width * 0.7;
    const sunY = height * 0.26;
    const sunR = Math.min(width, height) * 0.075;
    const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 4);
    glow.addColorStop(0, 'rgba(255,240,168,0.95)');
    glow.addColorStop(0.35, 'rgba(255,207,74,0.3)');
    glow.addColorStop(1, 'rgba(255,138,101,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height * 0.7);
    circle(ctx, sunX, sunY, sunR, PALETTE.sun);

    // Isla lejana.
    ctx.save();
    ctx.fillStyle = 'rgba(31, 91, 84, 0.85)';
    ctx.beginPath();
    ctx.moveTo(width * 0.58, height * 0.52);
    ctx.quadraticCurveTo(width * 0.66, height * 0.42, width * 0.77, height * 0.52);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(27, 70, 63, 0.9)';
    for (let i = 0; i < 4; i++) {
      const x = width * (0.62 + i * 0.045);
      const h = height * (0.035 + (i % 2) * 0.02);
      ctx.beginPath();
      ctx.moveTo(x - 7, height * 0.52);
      ctx.lineTo(x, height * 0.52 - h);
      ctx.lineTo(x + 7, height * 0.52);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Agua de la laguna.
    const waterY = height * 0.43;
    const water = ctx.createLinearGradient(0, waterY, 0, height);
    water.addColorStop(0, '#2c9aa4');
    water.addColorStop(0.42, '#1f8a9e');
    water.addColorStop(1, '#0d4653');
    ctx.fillStyle = water;
    ctx.fillRect(0, waterY, width, height - waterY);
    // Reflejos y olas.
    ctx.save();
    for (let i = 0; i < 26; i++) {
      const y = waterY + (i / 26) * (height - waterY) * 0.88;
      const w = width * rand(0.04, 0.22);
      const x = rand(0, width - w);
      ctx.globalAlpha = 0.08 + (1 - i / 26) * 0.16;
      fillRoundRect(ctx, x, y, w, Math.max(1.5, height * 0.004), 3, PALETTE.cream);
    }
    // Reflejo del sol.
    const reflection = ctx.createLinearGradient(sunX, waterY, sunX, height * 0.86);
    reflection.addColorStop(0, 'rgba(255, 214, 110, 0.42)');
    reflection.addColorStop(1, 'rgba(255, 178, 63, 0)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = reflection;
    ctx.beginPath();
    ctx.moveTo(sunX - 38, waterY);
    ctx.lineTo(sunX + 38, waterY);
    ctx.lineTo(sunX + 110, height);
    ctx.lineTo(sunX - 110, height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Juncos y hojas.
    drawPalmLeaf(ctx, -14, height * 0.12, width * 0.2, 0.4, PALETTE.leafDark);
    drawPalmLeaf(ctx, width + 14, height * 0.16, width * 0.2, Math.PI - 0.4, PALETTE.leafDark);
    ctx.save();
    ctx.strokeStyle = PALETTE.leafDark;
    ctx.lineWidth = 4;
    for (let i = 0; i < 14; i++) {
      const x = width * 0.02 + (i % 7) * 14;
      const baseY = height * 0.84;
      const h = height * (0.08 + (i % 4) * 0.025);
      ctx.beginPath();
      ctx.moveTo(x, baseY);
      ctx.quadraticCurveTo(x - 5, baseY - h * 0.5, x + (i % 2 ? 5 : -5), baseY - h);
      ctx.stroke();
    }
    ctx.restore();

    // Muelle de madera.
    const pierX = -30;
    const pierY = height * 0.72;
    const pierW = width * 0.36;
    drawWoodSurface(ctx, pierX, pierY, pierW, height * 0.28 + 20, {
      base: '#7a4a2b',
      dark: '#4a2a18',
      light: '#ad6d40',
      radius: 0,
      lineWidth: 0
    });
    ctx.save();
    ctx.strokeStyle = 'rgba(36,20,15,0.55)';
    ctx.lineWidth = 4;
    for (let i = 0; i < 8; i++) {
      const y = pierY + 8 + i * 11;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(pierW + 12, y);
      ctx.stroke();
    }
    ctx.fillStyle = '#5d351f';
    for (let i = 0; i < 3; i++) {
      const x = 20 + i * (pierW / 3);
      ctx.fillRect(x, pierY - 10, 12, 26);
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, pierY - 10, 12, 26);
    }
    // Cubo.
    const bucketX = pierW * 0.72;
    const bucketY = pierY + 18;
    fillRoundRect(ctx, bucketX, bucketY, 34, 30, 8, PALETTE.steelDark);
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = PALETTE.steel;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bucketX + 17, bucketY, 17, Math.PI, TAU);
    ctx.stroke();
    ctx.restore();

    drawVignette(ctx, width, height, 0.3);
    return canvas;
  }
}
