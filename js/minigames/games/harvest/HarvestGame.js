// Minijuego de cosecha: arrancar, limpiar, clasificar y recoger al ritmo.
// El cultivo de la parcela decide la fuerza, la forma y la recompensa.
// Exports: HarvestGame.

import { MiniGame } from '../../core/MiniGame.js';
import { CHIRINGUITO_CONFIG } from '../../../config/chiringuitoConfig.js';
import { PALETTE } from '../../assets/palette.js';
import {
  rand, circle, fillRoundRect, strokeRoundRect,
  drawWoodSurface, drawPalmLeaf, drawVignette
} from '../../core/Draw.js';
import { PullPhase } from './phases/PullPhase.js';
import { CleanPhase } from './phases/CleanPhase.js';
import { SortPhase } from './phases/SortPhase.js';
import { CollectPhase } from './phases/CollectPhase.js';

function harvestQuality(score) {
  if (score >= 90) return 'PERFECTA';
  if (score >= 70) return 'BUENA';
  if (score >= 45) return 'ACEPTABLE';
  return 'POBRE';
}

export class HarvestGame extends MiniGame {
  constructor({ services, difficulty = 1, ingredientId = 'tomato', plotName = 'PARCELA', crop = null, plotYield = 3, options = {} } = {}) {
    const gameOptions = {
      ...(options || {}),
      ingredientId,
      plotName,
      crop,
      plotYield
    };
    super({
      id: 'harvest',
      title: `COSECHA // ${plotName}`,
      difficulty,
      services,
      options: gameOptions
    });
    this.ingredientId = ingredientId;
    this.plotName = plotName;
    this.crop = crop;
    this.plotYield = Math.max(1, Number(plotYield) || 3);
    this.resultTitle = 'COSECHA COMPLETADA';
    this.harvestAmount = 0;
    this.harvestBroken = false;
    this.harvestWeak = false;
    this._background = null;
    this._backgroundKey = '';
  }

  createPhases() {
    const shared = {
      difficulty: this.difficulty,
      ingredientId: this.options.ingredientId,
      plotName: this.options.plotName,
      crop: this.options.crop,
      plotYield: this.options.plotYield
    };
    return [
      new PullPhase(shared),
      new CleanPhase(shared),
      new SortPhase(shared),
      new CollectPhase(shared)
    ];
  }

  onInit() {
    this.assets.preload({
      sprites: [
        this.ingredientId,
        'crate', 'star', 'spark',
        'gesture-drag', 'gesture-rub', 'gesture-tap'
      ],
      sounds: [
        'pull', 'scrub', 'harvest', 'dig', 'sow', 'chop', 'pop', 'tap',
        'perfect', 'good', 'fail', 'combo', 'star', 'phaseClear', 'water', 'select'
      ]
    });
  }

  onResize() {
    this._background = null;
    this._backgroundKey = '';
  }

  get cropName() {
    return this.crop?.name
      || CHIRINGUITO_CONFIG.getIngredient(this.ingredientId)?.name
      || this.plotName;
  }

  buildRewards(stars = 1, accuracy = 0) {
    const score = this.score.getScore();
    const bonus = CHIRINGUITO_CONFIG.getHarvestBonus(score);
    const amount = CHIRINGUITO_CONFIG.getHarvestAmount(this.plotYield, score);
    this.harvestAmount = amount;
    return {
      pearls: 0,
      ingredients: { [this.ingredientId]: amount },
      extra: [this.cropName, `CALIDAD: ${harvestQuality(score)}`]
    };
  }

  getResultExtras() {
    const score = this.score.getScore();
    return {
      ingredientId: this.ingredientId,
      cropName: this.cropName,
      plotYield: this.plotYield,
      harvestAmount: this.harvestAmount,
      harvestBonus: CHIRINGUITO_CONFIG.getHarvestBonus(score),
      broken: !!this.harvestBroken,
      weak: !!this.harvestWeak
    };
  }

  _finish() {
    const score = this.score.getScore();
    if (this.harvestBroken) this.resultTitle = '¡PLANTA ROTA!';
    else if (score >= 90) this.resultTitle = '¡COSECHA PERFECTA!';
    else if (score >= 70) this.resultTitle = 'COSECHA LIMPIA';
    else if (score >= 45) this.resultTitle = 'COSECHA ACEPTABLE';
    else this.resultTitle = '¡COSECHA POBRE!';
    super._finish();
  }

  drawBackground(ctx, width, height) {
    const key = `${width}x${height}`;
    if (!this._background || this._backgroundKey !== key) {
      this._background = this._buildFarmBackground(width, height);
      this._backgroundKey = key;
    }
    if (this._background) ctx.drawImage(this._background, 0, 0, width, height);
    else {
      ctx.fillStyle = '#7db86a';
      ctx.fillRect(0, 0, width, height);
    }
  }

  _buildFarmBackground(width, height) {
    if (typeof document === 'undefined') return null;
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.scale(scale, scale);

    // Amanecer isleño.
    const sky = ctx.createLinearGradient(0, 0, 0, height * 0.52);
    sky.addColorStop(0, '#61b7c9');
    sky.addColorStop(0.52, '#a8dfd1');
    sky.addColorStop(0.8, PALETTE.pineapple);
    sky.addColorStop(1, '#ffe0a0');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height * 0.55);
    const sunX = width * 0.74;
    const sunY = height * 0.19;
    const sunR = Math.min(width, height) * 0.07;
    const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 3.4);
    glow.addColorStop(0, 'rgba(255,244,190,0.95)');
    glow.addColorStop(0.4, 'rgba(255,207,74,0.3)');
    glow.addColorStop(1, 'rgba(255,178,63,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height * 0.65);
    circle(ctx, sunX, sunY, sunR, '#fff4c8');

    // Mar y arena al fondo.
    ctx.fillStyle = '#2c9aa4';
    ctx.fillRect(0, height * 0.37, width, height * 0.08);
    for (let i = 0; i < 10; i++) {
      ctx.globalAlpha = 0.16;
      fillRoundRect(ctx, rand(0, width * 0.7), height * (0.39 + (i % 3) * 0.015), rand(30, 160), 2, 2, PALETTE.cream);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#e7cf9b';
    ctx.fillRect(0, height * 0.45, width, height * 0.1);

    // Palmas al fondo.
    drawPalmLeaf(ctx, -10, height * 0.12, width * 0.22, 0.4, PALETTE.leafDark);
    drawPalmLeaf(ctx, width + 10, height * 0.1, width * 0.22, Math.PI - 0.4, PALETTE.leafDark);
    ctx.strokeStyle = PALETTE.woodDark;
    ctx.lineWidth = 7;
    for (let i = 0; i < 2; i++) {
      const x = i === 0 ? width * 0.12 : width * 0.9;
      ctx.beginPath();
      ctx.moveTo(x, height * 0.48);
      ctx.quadraticCurveTo(x + (i ? -12 : 12), height * 0.3, x + (i ? -35 : 35), height * 0.17);
      ctx.stroke();
    }

    // Campo de cultivo.
    const fieldY = height * 0.5;
    const field = ctx.createLinearGradient(0, fieldY, 0, height);
    field.addColorStop(0, '#79a85b');
    field.addColorStop(0.5, '#5b8f47');
    field.addColorStop(1, '#3f6e38');
    ctx.fillStyle = field;
    ctx.fillRect(0, fieldY, width, height - fieldY);
    ctx.save();
    for (let row = 0; row < 7; row++) {
      const y = fieldY + 16 + row * (height - fieldY) / 7;
      ctx.strokeStyle = row % 2 ? 'rgba(70,45,27,0.32)' : 'rgba(70,45,27,0.2)';
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(-20, y);
      ctx.quadraticCurveTo(width * 0.5, y + 10, width + 20, y);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(143, 195, 95, 0.32)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 10; i++) {
        const x = (i / 10) * width + 20;
        ctx.beginPath();
        ctx.moveTo(x, y - 6);
        ctx.lineTo(x + 4, y - 18 - (i % 3) * 5);
        ctx.stroke();
      }
    }
    ctx.restore();

    // Valla de madera.
    ctx.save();
    ctx.strokeStyle = PALETTE.woodDark;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.61);
    ctx.quadraticCurveTo(width * 0.5, height * 0.59, width, height * 0.62);
    ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const x = (i / 11) * width;
      const y = height * (0.61 + Math.sin((i / 11) * Math.PI) * -0.012);
      ctx.fillStyle = PALETTE.wood;
      fillRoundRect(ctx, x - 4, y - 18, 8, 34, 3, PALETTE.wood);
      strokeRoundRect(ctx, x - 4, y - 18, 8, 34, 3, PALETTE.ink, 2);
    }
    ctx.restore();

    // Puesto de madera a la derecha.
    drawWoodSurface(ctx, width * 0.72, height * 0.52, width * 0.28, height * 0.14, {
      base: '#8a5a3b',
      dark: '#4d2c19',
      light: '#b67b4d',
      radius: 10,
      lineWidth: 3
    });
    ctx.fillStyle = PALETTE.coral;
    ctx.beginPath();
    ctx.moveTo(width * 0.71, height * 0.52);
    ctx.lineTo(width * 0.86, height * 0.45);
    ctx.lineTo(width + 10, height * 0.49);
    ctx.lineTo(width + 10, height * 0.52);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Cajas y barril.
    fillRoundRect(ctx, width * 0.18, height * 0.72, 54, 34, 6, '#8a5a3b');
    strokeRoundRect(ctx, width * 0.18, height * 0.72, 54, 34, 6, PALETTE.ink, 3);
    fillRoundRect(ctx, width * 0.18 + 6, height * 0.72 + 6, 42, 7, 3, PALETTE.pineapple);
    fillRoundRect(ctx, width * 0.29, height * 0.69, 42, 42, 8, PALETTE.steelDark);
    strokeRoundRect(ctx, width * 0.29, height * 0.69, 42, 42, 8, PALETTE.ink, 3);
    circle(ctx, width * 0.29 + 21, height * 0.69 + 21, 13, PALETTE.lagoon, PALETTE.ink, 2);

    // Vignette.
    drawVignette(ctx, width, height, 0.24);
    return canvas;
  }
}
