// Minijuego de cocina del Chiringuito: corte, remoción, sazón, sartén y emplatado.
// Se alimenta de la receta real del pedido y devuelve score/quality al modo.
// Exports: CookingGame.

import { MiniGame } from '../../core/MiniGame.js';
import { CHIRINGUITO_CONFIG } from '../../../config/chiringuitoConfig.js';
import {
  circle, fillRoundRect, strokeRoundRect, rgba,
  drawWoodSurface, drawVignette, TAU
} from '../../core/Draw.js';
import { ChopPhase } from './phases/ChopPhase.js';
import { StirPhase } from './phases/StirPhase.js';
import { SeasonPhase } from './phases/SeasonPhase.js';
import { SearPhase } from './phases/SearPhase.js';
import { PlatePhase } from './phases/PlatePhase.js';

const FALLBACK_RECIPE = {
  name: 'Plato de prueba',
  color: 0xe9875a,
  ingredients: { crab: 1 },
  steps: {
    chop: { cuts: 2, speed: 0.7, zoneWidth: 0.3, label: 'CORTAR' },
    cook: { duration: 3, targetMin: 0.44, targetMax: 0.74, heatRate: 0.8, coolRate: 0.45, label: 'COCINAR' },
    plate: { order: ['crab'], label: 'EMPLATAR' }
  }
};

export class CookingGame extends MiniGame {
  constructor({ services, difficulty = 1, recipe = null, kitchenSpeed = 0, orderId = null, options = {} } = {}) {
    const safeRecipe = recipe && recipe.steps ? recipe : FALLBACK_RECIPE;
    const recipeOptions = { ...(options || {}), recipe: safeRecipe, kitchenSpeed, orderId };
    super({
      id: 'cooking',
      title: safeRecipe?.name ? `COCINA // ${safeRecipe.name}` : 'COCINA',
      difficulty,
      services,
      options: recipeOptions
    });
    this.recipe = safeRecipe;
    this.kitchenSpeed = Math.max(0, Number(kitchenSpeed) || 0);
    this.orderId = orderId;
    this.resultTitle = 'PLATO LISTO';
    this._background = null;
    this._backgroundKey = '';
  }

  createPhases() {
    const recipe = this.options.recipe || this.recipe;
    const shared = {
      recipe,
      difficulty: this.difficulty,
      kitchenSpeed: this.options.kitchenSpeed || 0
    };
    return [
      new ChopPhase(shared),
      new StirPhase(shared),
      new SeasonPhase(shared),
      new SearPhase(shared),
      new PlatePhase(shared)
    ];
  }

  onInit() {
    const ingredientIds = Object.keys(this.recipe?.ingredients || {});
    const sprites = [...new Set([
      ...ingredientIds,
      'crab', 'mango',
      'knife', 'pot', 'pan', 'saltshaker', 'plate', 'star', 'spark',
      'gesture-drag', 'gesture-circle', 'gesture-shake', 'gesture-flick', 'gesture-tap'
    ])];
    this.assets.preload({
      sprites,
      sounds: [
        'chop', 'slice', 'stir', 'sizzle', 'shake', 'splash',
        'perfect', 'good', 'fail', 'combo', 'tap', 'star', 'phaseClear',
        'whoosh', 'burn', 'pop', 'select'
      ]
    });
  }

  onResize() {
    this._background = null;
    this._backgroundKey = '';
  }

  getQuality(score = this.score.getScore()) {
    return CHIRINGUITO_CONFIG.getQualityTier(score);
  }

  buildRewards(stars = 1, accuracy = 0) {
    const tier = this.getQuality(this.score.getScore());
    return {
      pearls: 0,
      ingredients: {},
      extra: [`CALIDAD: ${tier.label}`]
    };
  }

  getResultExtras() {
    return { quality: this.getQuality(this.score.getScore()) };
  }

  drawBackground(ctx, width, height) {
    const key = `${width}x${height}`;
    if (!this._background || this._backgroundKey !== key) {
      this._background = this._buildKitchenBackground(width, height);
      this._backgroundKey = key;
    }
    if (this._background) ctx.drawImage(this._background, 0, 0, width, height);
    else {
      ctx.fillStyle = '#163f40';
      ctx.fillRect(0, 0, width, height);
    }
  }

  _buildKitchenBackground(width, height) {
    if (typeof document === 'undefined') return null;
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.scale(scale, scale);

    const wallHeight = height * 0.44;
    const wall = ctx.createLinearGradient(0, 0, 0, wallHeight);
    wall.addColorStop(0, '#e7cfa4');
    wall.addColorStop(0.55, '#f3e1bb');
    wall.addColorStop(1, '#dcc296');
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, width, wallHeight);

    // Azulejos.
    const tile = Math.max(34, Math.min(58, width / 18));
    for (let row = 0; row * tile < wallHeight; row++) {
      for (let col = 0; col * tile < width; col++) {
        const x = col * tile;
        const y = row * tile;
        const alt = (row + col) % 2 === 0;
        ctx.fillStyle = alt ? 'rgba(255, 244, 214, 0.18)' : 'rgba(63, 193, 201, 0.055)';
        ctx.fillRect(x + 1, y + 1, tile - 2, tile - 2);
        ctx.strokeStyle = 'rgba(31, 138, 158, 0.18)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, tile, tile);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 3);
        ctx.lineTo(x + tile - 5, y + 3);
        ctx.stroke();
      }
    }

    // Ventana al atardecer.
    const winX = width * 0.055;
    const winY = height * 0.085;
    const winW = width * 0.25;
    const winH = height * 0.27;
    ctx.save();
    fillRoundRect(ctx, winX - 10, winY - 10, winW + 20, winH + 20, 18, '#6d4328');
    strokeRoundRect(ctx, winX - 10, winY - 10, winW + 20, winH + 20, 18, '#24140f', 4);
    const sky = ctx.createLinearGradient(0, winY, 0, winY + winH);
    sky.addColorStop(0, '#7b4a8f');
    sky.addColorStop(0.45, '#ff8a65');
    sky.addColorStop(0.72, '#ffd08a');
    sky.addColorStop(1, '#1f8a9e');
    fillRoundRect(ctx, winX, winY, winW, winH, 8, sky);
    const sunX = winX + winW * 0.68;
    const sunY = winY + winH * 0.38;
    const sunR = Math.min(winW, winH) * 0.14;
    const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 3.2);
    glow.addColorStop(0, 'rgba(255,240,168,0.9)');
    glow.addColorStop(0.45, 'rgba(255,178,63,0.25)');
    glow.addColorStop(1, 'rgba(255,138,101,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(winX, winY, winW, winH);
    circle(ctx, sunX, sunY, sunR, '#fff0a8');
    // Mar.
    ctx.fillStyle = 'rgba(13, 70, 83, 0.45)';
    ctx.fillRect(winX, winY + winH * 0.62, winW, winH * 0.38);
    for (let i = 0; i < 6; i++) {
      ctx.globalAlpha = 0.22;
      fillRoundRect(ctx, winX + winW * (0.1 + (i % 3) * 0.25), winY + winH * (0.68 + Math.floor(i / 3) * 0.12), winW * 0.2, 3, 2, '#fff4d6');
    }
    ctx.globalAlpha = 1;
    // Cruz de la ventana.
    ctx.strokeStyle = '#6d4328';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(winX + winW / 2, winY);
    ctx.lineTo(winX + winW / 2, winY + winH);
    ctx.moveTo(winX, winY + winH * 0.46);
    ctx.lineTo(winX + winW, winY + winH * 0.46);
    ctx.stroke();
    ctx.strokeStyle = '#24140f';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Estante con tarros.
    const shelfX = width * 0.64;
    const shelfY = height * 0.19;
    const shelfW = width * 0.29;
    fillRoundRect(ctx, shelfX, shelfY + 34, shelfW, 10, 4, '#7a4a2b');
    strokeRoundRect(ctx, shelfX, shelfY + 34, shelfW, 10, 4, '#24140f', 3);
    const jarColors = ['#ffb23f', '#ff6b4a', '#9be564'];
    for (let i = 0; i < 3; i++) {
      const jx = shelfX + 20 + i * (shelfW - 40) / 3;
      const jw = 30;
      const jh = 30 + (i % 2) * 8;
      fillRoundRect(ctx, jx, shelfY + 34 - jh, jw, jh, 6, 'rgba(255, 253, 245, 0.72)');
      strokeRoundRect(ctx, jx, shelfY + 34 - jh, jw, jh, 6, '#24140f', 2.5);
      fillRoundRect(ctx, jx + 3, shelfY + 34 - jh * 0.55, jw - 6, jh * 0.52, 4, jarColors[i]);
      fillRoundRect(ctx, jx + 5, shelfY + 25 - jh, jw - 10, 9, 3, '#8fa0a4');
      circle(ctx, jx + 14, shelfY + 30 - jh * 0.3, 2, 'rgba(255,255,255,0.6)');
    }

    // Lámpara colgante.
    const lampX = width * 0.48;
    ctx.strokeStyle = '#24140f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(lampX, 0);
    ctx.lineTo(lampX, height * 0.08);
    ctx.stroke();
    const lampY = height * 0.08;
    const lampGlow = ctx.createRadialGradient(lampX, lampY + 12, 3, lampX, lampY + 12, 78);
    lampGlow.addColorStop(0, 'rgba(255, 207, 74, 0.42)');
    lampGlow.addColorStop(1, 'rgba(255, 207, 74, 0)');
    ctx.fillStyle = lampGlow;
    ctx.fillRect(lampX - 90, lampY - 15, 180, 130);
    ctx.beginPath();
    ctx.moveTo(lampX - 28, lampY + 2);
    ctx.quadraticCurveTo(lampX, lampY + 34, lampX + 28, lampY + 2);
    ctx.closePath();
    ctx.fillStyle = '#ffcf4a';
    ctx.fill();
    ctx.strokeStyle = '#24140f';
    ctx.lineWidth = 3;
    ctx.stroke();
    circle(ctx, lampX, lampY + 20, 6, '#fff4d6');

    // Riel de utensilios.
    ctx.strokeStyle = '#7f8c7b';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(width * 0.36, height * 0.075);
    ctx.lineTo(width * 0.58, height * 0.075);
    ctx.stroke();
    drawUtensilSilhouette(ctx, width * 0.41, height * 0.075, 0.72, false);
    drawUtensilSilhouette(ctx, width * 0.51, height * 0.075, 0.78, true);

    // Mostrador de madera.
    drawWoodSurface(ctx, -30, height * 0.42, width + 60, height * 0.62, {
      base: '#7a4a2b',
      dark: '#4a2a18',
      light: '#ad6d40',
      radius: 0,
      lineWidth: 0
    });
    ctx.save();
    ctx.strokeStyle = 'rgba(36,20,15,0.55)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.425);
    ctx.lineTo(width, height * 0.425);
    ctx.stroke();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#24140f';
    ctx.fillRect(0, height * 0.43, width, 8);
    ctx.restore();

    // Paño y bol de preparación.
    ctx.save();
    ctx.translate(width * 0.09, height * 0.49);
    ctx.rotate(-0.12);
    fillRoundRect(ctx, 0, 0, width * 0.18, 20, 6, 'rgba(255, 107, 74, 0.72)');
    for (let i = 1; i < 5; i++) {
      ctx.fillStyle = 'rgba(255, 244, 214, 0.48)';
      ctx.fillRect(i * width * 0.035, 0, 4, 20);
    }
    ctx.restore();

    drawVignette(ctx, width, height, 0.3);
    return canvas;
  }
}

function drawUtensilSilhouette(ctx, x, y, scale, ladle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = '#3a2218';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 20);
  ctx.stroke();
  ctx.strokeStyle = '#8fa0a4';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 18);
  ctx.lineTo(0, 76);
  ctx.stroke();
  if (ladle) {
    ctx.beginPath();
    ctx.arc(0, 82, 12, 0, TAU);
    ctx.fillStyle = '#8fa0a4';
    ctx.fill();
    ctx.strokeStyle = '#24140f';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  } else {
    ctx.fillStyle = '#8fa0a4';
    ctx.strokeStyle = '#24140f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-13, 76);
    ctx.quadraticCurveTo(-15, 96, 0, 100);
    ctx.quadraticCurveTo(15, 96, 13, 76);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#5d6c70';
    for (let i = 0; i < 3; i++) ctx.fillRect(-8 + i * 6, 82, 3, 12);
  }
  ctx.restore();
}
