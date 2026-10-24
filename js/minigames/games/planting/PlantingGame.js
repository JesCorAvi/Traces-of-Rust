// Minijuego de siembra: cavar, sembrar, tapar/apisonar y regar.
// La calidad de la siembra fija el rendimiento de la próxima cosecha.
// Exports: PlantingGame.

import { MiniGame } from '../../core/MiniGame.js';
import { CHIRINGUITO_CONFIG } from '../../../config/chiringuitoConfig.js';
import { PALETTE } from '../../assets/palette.js';
import {
  circle, fillRoundRect, strokeRoundRect,
  drawWoodSurface, drawPalmLeaf, drawVignette, drawWavyLine
} from '../../core/Draw.js';
import { DigPhase } from './phases/DigPhase.js';
import { SowPhase } from './phases/SowPhase.js';
import { CoverPhase } from './phases/CoverPhase.js';
import { WaterPhase } from './phases/WaterPhase.js';

function plantingQuality(score) {
  if (score >= 90) return 'PERFECTA';
  if (score >= 70) return 'BUENA';
  if (score >= 45) return 'ACEPTABLE';
  return 'POBRE';
}

export class PlantingGame extends MiniGame {
  constructor({ services, difficulty = 1, ingredientId = 'tomato', plotName = 'PARCELA', crop = null, plotYield = 3, options = {} } = {}) {
    const gameOptions = { ...(options || {}), ingredientId, plotName, crop, plotYield };
    super({
      id: 'planting',
      title: `SIEMBRA // ${plotName}`,
      difficulty,
      services,
      options: gameOptions
    });
    this.ingredientId = ingredientId;
    this.plotName = plotName;
    this.crop = crop;
    this.plotYield = Math.max(1, Number(plotYield) || 3);
    this.resultTitle = 'SIEMBRA COMPLETADA';
    this.plantScore = 0;
    this.plantBonus = 0;
    this.nextYield = this.plotYield;
    this.plantWeak = false;
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
      new DigPhase(shared),
      new SowPhase(shared),
      new CoverPhase(shared),
      new WaterPhase(shared)
    ];
  }

  onInit() {
    this.assets.preload({
      sprites: [
        this.ingredientId,
        'seed', 'shovel', 'wateringcan', 'star', 'spark',
        'gesture-tap', 'gesture-drag', 'gesture-rub'
      ],
      sounds: [
        'dig', 'sow', 'water', 'pull', 'scrub', 'harvest',
        'perfect', 'good', 'fail', 'combo', 'tap', 'star',
        'phaseClear', 'select', 'pop'
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
    this.plantScore = score;
    this.plantBonus = CHIRINGUITO_CONFIG.getPlantYieldBonus(score);
    this.nextYield = Math.max(1, Math.min(
      CHIRINGUITO_CONFIG.FARM.maxYield,
      Math.round(this.plotYield + this.plantBonus)
    ));
    return {
      pearls: 0,
      ingredients: {},
      extra: [
        `CALIDAD: ${plantingQuality(score)}`,
        `PRÓXIMA COSECHA: ${this.nextYield} UDS.`
      ]
    };
  }

  getResultExtras() {
    return {
      ingredientId: this.ingredientId,
      cropName: this.cropName,
      plotYield: this.plotYield,
      plantScore: this.plantScore,
      plantBonus: this.plantBonus,
      nextYield: this.nextYield,
      weak: !!this.plantWeak
    };
  }

  _finish() {
    const score = this.score.getScore();
    if (score >= 90) this.resultTitle = '¡SIEMBRA PERFECTA!';
    else if (score >= 70) this.resultTitle = 'SIEMBRA LIMPIA';
    else if (score >= 45) this.resultTitle = 'SIEMBRA ACEPTABLE';
    else this.resultTitle = '¡SIEMBRA POBRE!';
    super._finish();
  }

  drawBackground(ctx, width, height) {
    const key = `${width}x${height}`;
    if (!this._background || this._backgroundKey !== key) {
      this._background = this._buildGreenhouseBackground(width, height);
      this._backgroundKey = key;
    }
    if (this._background) ctx.drawImage(this._background, 0, 0, width, height);
    else {
      ctx.fillStyle = '#7db86a';
      ctx.fillRect(0, 0, width, height);
    }
  }

  _buildGreenhouseBackground(width, height) {
    if (typeof document === 'undefined') return null;
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.scale(scale, scale);

    const sky = ctx.createLinearGradient(0, 0, 0, height * 0.58);
    sky.addColorStop(0, '#67c5d1');
    sky.addColorStop(0.55, '#c7eadb');
    sky.addColorStop(0.82, PALETTE.pineapple);
    sky.addColorStop(1, '#ffe2a3');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height * 0.6);
    const sunX = width * 0.2;
    const sunY = height * 0.2;
    const sunR = Math.min(width, height) * 0.06;
    const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 3.2);
    glow.addColorStop(0, 'rgba(255,244,190,0.9)');
    glow.addColorStop(0.45, 'rgba(255,207,74,0.24)');
    glow.addColorStop(1, 'rgba(255,178,63,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height * 0.65);
    circle(ctx, sunX, sunY, sunR, '#fff4c8');

    // Invernadero: estructura de madera y cristales.
    ctx.save();
    ctx.strokeStyle = '#6d4328';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.08);
    ctx.lineTo(width * 0.17, height * 0.18);
    ctx.lineTo(width * 0.34, height * 0.08);
    ctx.stroke();
    ctx.lineWidth = 6;
    for (let i = 0; i < 4; i++) {
      const x = width * (0.02 + i * 0.09);
      ctx.beginPath();
      ctx.moveTo(x, height * 0.1);
      ctx.lineTo(x, height * 0.5);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(180, 236, 222, 0.16)';
    for (let i = 0; i < 4; i++) {
      const x = width * (0.02 + i * 0.09);
      fillRoundRect(ctx, x + 3, height * 0.12, width * 0.08, height * 0.36, 4, 'rgba(180,236,222,0.13)');
    }
    ctx.restore();

    // Suelo del invernadero.
    const ground = ctx.createLinearGradient(0, height * 0.46, 0, height);
    ground.addColorStop(0, '#6da85a');
    ground.addColorStop(1, '#3f6e38');
    ctx.fillStyle = ground;
    ctx.fillRect(0, height * 0.46, width, height - 0.54 * height);
    ctx.save();
    ctx.strokeStyle = 'rgba(70,45,27,0.28)';
    ctx.lineWidth = 8;
    for (let i = 0; i < 6; i++) {
      const y = height * 0.52 + i * height * 0.075;
      drawWavyLine(ctx, -10, y, width + 10, y + 4, 5, 4);
      ctx.stroke();
    }
    ctx.restore();

    // Mesas de semillero a los lados.
    drawWoodSurface(ctx, width * 0.02, height * 0.52, width * 0.2, height * 0.16, {
      base: '#8a5a3b', dark: '#4d2c19', light: '#b67b4d', radius: 8, lineWidth: 3
    });
    drawWoodSurface(ctx, width * 0.78, height * 0.54, width * 0.2, height * 0.16, {
      base: '#8a5a3b', dark: '#4d2c19', light: '#b67b4d', radius: 8, lineWidth: 3
    });
    // Macetas.
    for (let i = 0; i < 4; i++) {
      const x = width * 0.055 + i * width * 0.045;
      fillRoundRect(ctx, x, height * 0.48, 24, 22, 5, PALETTE.coral);
      strokeRoundRect(ctx, x, height * 0.48, 24, 22, 5, PALETTE.ink, 2);
      circle(ctx, x + 12, height * 0.47, 10, PALETTE.leaf, PALETTE.ink, 2);
    }
    // Sacos de semillas.
    for (let i = 0; i < 2; i++) {
      const x = width * 0.8 + i * width * 0.06;
      fillRoundRect(ctx, x, height * 0.63, 40, 48, 10, PALETTE.paper);
      strokeRoundRect(ctx, x, height * 0.63, 40, 48, 10, PALETTE.ink, 3);
      circle(ctx, x + 20, height * 0.66, 8, PALETTE.pineapple, PALETTE.ink, 2);
    }
    // Regadera y herramientas colgadas.
    ctx.save();
    ctx.strokeStyle = '#7f8c7b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(width * 0.56, height * 0.12);
    ctx.lineTo(width * 0.82, height * 0.12);
    ctx.stroke();
    for (let i = 0; i < 3; i++) {
      const x = width * (0.6 + i * 0.08);
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, height * 0.12);
      ctx.lineTo(x, height * 0.2);
      ctx.stroke();
      circle(ctx, x, height * 0.23, 8, PALETTE.steel, PALETTE.ink, 2);
    }
    ctx.restore();

    // Valla y fondo.
    drawPalmLeaf(ctx, width + 10, height * 0.08, width * 0.2, Math.PI - 0.4, PALETTE.leafDark);
    ctx.save();
    ctx.strokeStyle = PALETTE.woodDark;
    ctx.lineWidth = 6;
    for (let i = 0; i < 12; i++) {
      const x = (i / 11) * width;
      const y = height * 0.6;
      fillRoundRect(ctx, x - 3, y - 14, 7, 26, 3, PALETTE.wood);
      strokeRoundRect(ctx, x - 3, y - 14, 7, 26, 3, PALETTE.ink, 2);
    }
    ctx.beginPath();
    ctx.moveTo(0, height * 0.58);
    ctx.lineTo(width, height * 0.6);
    ctx.stroke();
    ctx.restore();

    drawVignette(ctx, width, height, 0.24);
    return canvas;
  }
}
