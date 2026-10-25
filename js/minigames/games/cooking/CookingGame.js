// Minijuego de cocina del Chiringuito: corte, remoción, sazón, sartén y emplatado.
// Se alimenta de la receta real del pedido y devuelve score/quality al modo.
// Fondo y ambientación: auténtica cocina de chiringuito playero caribeño al atardecer,
// con vista panorámica al mar, techo de palapa, guirnalda de farolillos, pizarra de tiza
// y barra de tablones náuticos rústicos.
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

    // Altura del mostrador de chiringuito
    const counterTopY = height * 0.44;

    // -----------------------------------------------------------------------
    // 1. Cielo de Atardecer Caribeño Panorámico (sin azulejos de casa)
    // -----------------------------------------------------------------------
    const sky = ctx.createLinearGradient(0, 0, 0, counterTopY);
    sky.addColorStop(0, '#3e173a');    // Violeta crepúsculo superior
    sky.addColorStop(0.3, '#7d2442');  // Carmesí de atardecer
    sky.addColorStop(0.55, '#d4542a'); // Coral fuego
    sky.addColorStop(0.8, '#f09b36');  // Naranja mango
    sky.addColorStop(1, '#ffd06e');    // Amarillo sol cálido en el horizonte
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, counterTopY);

    // Sol poniente caribeño en el horizonte marino
    const sunX = width * 0.72;
    const sunY = counterTopY * 0.58;
    const sunR = Math.min(width, height) * 0.088;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 3.8);
    sunGlow.addColorStop(0, 'rgba(255, 246, 185, 0.95)');
    sunGlow.addColorStop(0.35, 'rgba(255, 182, 63, 0.38)');
    sunGlow.addColorStop(1, 'rgba(212, 84, 42, 0)');
    ctx.fillStyle = sunGlow;
    ctx.fillRect(0, 0, width, counterTopY);
    circle(ctx, sunX, sunY, sunR, '#fff6bf');

    // Nubes delgadas de atardecer en bandas horizontales
    ctx.save();
    for (let i = 0; i < 5; i++) {
      const ny = counterTopY * (0.18 + i * 0.14);
      const nw = width * (0.16 + (i % 3) * 0.12);
      const nx = width * ((i * 0.24 + 0.06) % 0.84);
      ctx.globalAlpha = 0.24;
      fillRoundRect(ctx, nx, ny, nw, 4.5, 2, '#fff1ca');
    }
    ctx.restore();

    // -----------------------------------------------------------------------
    // 2. Océano Caribeño y Rompiente de Playa
    // -----------------------------------------------------------------------
    const seaY = counterTopY * 0.7;
    const seaH = counterTopY - seaY;
    const sea = ctx.createLinearGradient(0, seaY, 0, counterTopY);
    sea.addColorStop(0, '#1c7b8c');
    sea.addColorStop(0.65, '#125463');
    sea.addColorStop(1, '#0c3842');
    ctx.fillStyle = sea;
    ctx.fillRect(0, seaY, width, seaH);

    // Destellos dorados del sol reflejados en el mar
    const reflection = ctx.createLinearGradient(sunX, seaY, sunX, counterTopY);
    reflection.addColorStop(0, 'rgba(255, 214, 110, 0.45)');
    reflection.addColorStop(1, 'rgba(255, 178, 63, 0.05)');
    ctx.fillStyle = reflection;
    ctx.beginPath();
    ctx.moveTo(sunX - 28, seaY);
    ctx.lineTo(sunX + 28, seaY);
    ctx.lineTo(sunX + 70, counterTopY);
    ctx.lineTo(sunX - 70, counterTopY);
    ctx.closePath();
    ctx.fill();

    // Olas rompiendo en espuma blanca en la rompiente
    ctx.save();
    for (let i = 0; i < 16; i++) {
      const wy = seaY + (i / 16) * seaH * 0.9;
      const ww = width * (0.05 + ((i * 7) % 9) * 0.02);
      const wx = (i * width * 0.076) % (width - ww);
      ctx.globalAlpha = 0.25 + (i / 16) * 0.45;
      fillRoundRect(ctx, wx, wy, ww, 2.5, 1, '#f0fcf7');
    }
    ctx.restore();

    // Orilla de arena dorada de playa
    ctx.fillStyle = '#dbb57d';
    ctx.fillRect(0, counterTopY - 7, width, 9);
    ctx.fillStyle = '#edd7a6';
    ctx.fillRect(0, counterTopY - 4, width, 4);

    // Siluetas de palmeras tropicales lejanas a izquierda y derecha
    drawDistantPalms(ctx, width * 0.08, counterTopY - 6, 0.72);
    drawDistantPalms(ctx, width * 0.88, counterTopY - 6, 0.82);

    // -----------------------------------------------------------------------
    // 3. Estructura de la Palapa / Techo del Chiringuito
    // -----------------------------------------------------------------------
    const beamY = height * 0.065;
    const beamH = 18;

    // Viga principal de tronco de madera rústica
    drawWoodSurface(ctx, -20, beamY, width + 40, beamH, {
      base: '#6b3f22', dark: '#3b1f11', light: '#995f36', radius: 4, lineWidth: 2
    });

    // Tejado de palapa / hojas secas de palma que cuelga por arriba
    drawThatchRoof(ctx, width, beamY + 4);

    // Postes laterales de madera rústica
    drawRusticPost(ctx, width * 0.025, beamY, height - beamY);
    drawRusticPost(ctx, width * 0.945, beamY, height - beamY);

    // Guirnalda festiva de luces de colores de chiringuito
    drawPartyLights(ctx, width * 0.045, width * 0.935, beamY + 12, height * 0.055);

    // Pizarra rústica de madera con tiza: "CHIRINGUITO // CARTA DEL DÍA"
    drawMenuChalkboard(ctx, width * 0.48, beamY + 14, width * 0.27, height * 0.185);

    // Farol náutico de latón colgado en el poste derecho
    drawNauticalLantern(ctx, width * 0.91, beamY + 16, 0.9);

    // -----------------------------------------------------------------------
    // 4. Mostrador / Barra de Madera de Chiringuito (mitad inferior)
    // -----------------------------------------------------------------------
    drawWoodSurface(ctx, -30, counterTopY, width + 60, height - counterTopY + 30, {
      base: '#7a4a2b', dark: '#482715', light: '#a96a3d', radius: 0, lineWidth: 0
    });

    // Borde biselado del mostrador náutico de madera con clavos de forja
    ctx.save();
    ctx.fillStyle = '#9e6238';
    ctx.fillRect(0, counterTopY, width, 5);
    ctx.fillStyle = 'rgba(28, 16, 10, 0.6)';
    ctx.fillRect(0, counterTopY + 5, width, 6);
    // Clavos de cabeza cuadrada en la madera del mostrador
    for (let cx = 30; cx < width; cx += 55) {
      ctx.fillStyle = '#261710';
      ctx.fillRect(cx - 2, counterTopY + 7, 5, 5);
      ctx.fillStyle = '#8f6545';
      ctx.fillRect(cx - 1, counterTopY + 8, 3, 3);
    }
    // Ranuras verticales entre tablones de la barra
    ctx.fillStyle = 'rgba(38, 20, 12, 0.45)';
    for (let bx = 90; bx < width; bx += 140) {
      ctx.fillRect(bx, counterTopY + 12, 3, height - counterTopY);
    }
    ctx.restore();

    // -----------------------------------------------------------------------
    // 5. Detalles Característicos del Chiringuito sobre la Barra
    // -----------------------------------------------------------------------
    // Camino de mesa / mantel de hoja de plátano verde fresca a la izquierda
    drawBananaLeafPlacemat(ctx, width * 0.06, counterTopY + 14, width * 0.22, 28);

    // Coco fresco de playa con pajita reposando en la barra
    drawBarCoconut(ctx, width * 0.08, counterTopY + 18, 0.68);

    // Paño de arpillera con ribete tropical a la derecha
    drawRusticCloth(ctx, width * 0.74, counterTopY + 16, width * 0.17, 26);

    // Rodajas de lima fresca y conchas marinas en el rincón
    drawBarGarnish(ctx, width * 0.86, counterTopY + 22);

    // Viñeta cinematográfica suave en los bordes
    drawVignette(ctx, width, height, 0.26);

    return canvas;
  }
}

// ---------------------------------------------------------------------------
// Helpers Visuales de la Cocina del Chiringuito
// ---------------------------------------------------------------------------

function drawDistantPalms(ctx, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Dos troncos inclinados por la brisa marina
  ctx.strokeStyle = '#2b1b14';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-12, -28, -24, -58);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.quadraticCurveTo(2, -24, 18, -48);
  ctx.stroke();

  // Copas de palmeras con hojas en arco
  drawPalmFronds(ctx, -24, -58, 24);
  drawPalmFronds(ctx, 18, -48, 20);
  ctx.restore();
}

function drawPalmFronds(ctx, cx, cy, radius) {
  const leafColor = '#1e3828';
  for (let i = 0; i < 7; i++) {
    const angle = -Math.PI * 0.8 + (i / 6) * Math.PI * 1.6;
    const tipX = cx + Math.cos(angle) * radius;
    const tipY = cy + Math.sin(angle) * (radius * 0.65);
    ctx.strokeStyle = leafColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo(cx + Math.cos(angle) * radius * 0.5, cy - 4, tipX, tipY);
    ctx.stroke();
  }
}

function drawThatchRoof(ctx, width, topY) {
  ctx.save();
  // Mechones de paja de palapa / cañizo colgando del alero superior
  const thatchColors = ['#5c3d18', '#8e6333', '#c5994f', '#ddb46b'];
  const p = 3;

  for (let x = -10; x < width + 10; x += 14) {
    const len = 18 + Math.sin(x * 0.08) * 8 + ((x * 7) % 9);
    for (let dy = 0; dy < len; dy += p) {
      const col = thatchColors[Math.floor(dy / 6) % thatchColors.length];
      const slant = (x % 28 < 14 ? 1 : -1) * (dy * 0.2);
      ctx.fillStyle = col;
      ctx.fillRect(x + slant, topY + dy, 4, p);
    }
    // Sombra oscura en el arranque
    ctx.fillStyle = '#2d180a';
    ctx.fillRect(x, topY, 14, 4);
  }
  ctx.restore();
}

function drawRusticPost(ctx, x, y, h) {
  ctx.save();
  const postW = 18;
  // Tronco vertical rústico
  drawWoodSurface(ctx, x, y, postW, h, {
    base: '#61381e', dark: '#331b0c', light: '#8c532d', radius: 4, lineWidth: 2
  });

  // Cuerdas de cáñamo náuticas enrolladas en los nudos del poste
  for (let ry of [y + 24, y + 80, y + 150]) {
    ctx.fillStyle = '#9c7b4c';
    ctx.fillRect(x - 2, ry, postW + 4, 8);
    ctx.fillStyle = '#1e1107';
    ctx.fillRect(x - 2, ry + 2, postW + 4, 1.5);
    ctx.fillRect(x - 2, ry + 5, postW + 4, 1.5);
  }
  ctx.restore();
}

function drawPartyLights(ctx, x1, x2, y, sag) {
  ctx.save();
  const numLights = 11;
  const colors = ['#ffd45c', '#ff6b4a', '#8ede63', '#3fc1c9', '#ff9a75'];

  // Cable curvado en catenaria
  ctx.strokeStyle = '#23150d';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.quadraticCurveTo((x1 + x2) * 0.5, y + sag * 1.3, x2, y);
  ctx.stroke();

  // Bombillas de colores encendidas con resplandor cálido
  for (let i = 1; i < numLights; i++) {
    const t = i / numLights;
    const lx = x1 + (x2 - x1) * t;
    const ly = y + Math.sin(t * Math.PI) * sag;
    const col = colors[i % colors.length];

    // Resplandor
    const glow = ctx.createRadialGradient(lx, ly + 4, 1, lx, ly + 4, 14);
    glow.addColorStop(0, rgba(col, 0.45));
    glow.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(lx, ly + 4, 14, 0, TAU);
    ctx.fill();

    // Casquillo
    ctx.fillStyle = '#3a281a';
    ctx.fillRect(lx - 2, ly - 2, 4, 3);

    // Bombilla
    circle(ctx, lx, ly + 4, 4.5, col, '#1c120c', 1.5);
    circle(ctx, lx - 1, ly + 2.5, 1.2, '#fff');
  }
  ctx.restore();
}

function drawMenuChalkboard(ctx, cx, cy, w, h) {
  ctx.save();
  const left = cx - w * 0.5;

  // Cuerdas que sostienen la pizarra desde la viga
  ctx.strokeStyle = '#8f6e43';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(left + 18, cy - 14);
  ctx.lineTo(left + 18, cy);
  ctx.moveTo(left + w - 18, cy - 14);
  ctx.lineTo(left + w - 18, cy);
  ctx.stroke();

  // Marco de madera rústica de la pizarra
  drawWoodSurface(ctx, left, cy, w, h, {
    base: '#734426', dark: '#422312', light: '#996038', radius: 8, lineWidth: 3
  });

  // Fondo de pizarra de tiza (verde oscuro desgastado)
  const boardInset = 8;
  const bw = w - boardInset * 2;
  const bh = h - boardInset * 2;
  fillRoundRect(ctx, left + boardInset, cy + boardInset, bw, bh, 4, '#1b2923');
  strokeRoundRect(ctx, left + boardInset, cy + boardInset, bw, bh, 4, '#0d1612', 2);

  // Texto y dibujos en tiza blanca
  ctx.fillStyle = '#f4fbf7';
  ctx.font = '700 11px "VT323", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★ CHIRINGUITO ★', cx, cy + 20);

  ctx.font = '700 9px "VT323", monospace';
  ctx.fillStyle = '#ffcf5c';
  ctx.fillText('CARTA DEL DÍA', cx, cy + 33);

  // Cangrejito dibujado en tiza en la pizarra
  const crabX = cx;
  const crabY = cy + 47;
  ctx.fillStyle = '#f4fbf7';
  ctx.fillRect(crabX - 8, crabY - 4, 16, 8); // Cuerpo
  ctx.fillRect(crabX - 5, crabY - 8, 3, 4);   // Ojo izq
  ctx.fillRect(crabX + 2, crabY - 8, 3, 4);   // Ojo der
  ctx.fillRect(crabX - 12, crabY - 6, 4, 4);  // Pinza izq
  ctx.fillRect(crabX + 8, crabY - 6, 4, 4);   // Pinza der

  ctx.restore();
}

function drawNauticalLantern(ctx, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Cuerda de sujeción
  ctx.strokeStyle = '#8f6e43';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(0, 0);
  ctx.stroke();

  // Sombrerete de latón
  ctx.fillStyle = '#b88a38';
  ctx.strokeStyle = '#24140f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-12, 4);
  ctx.lineTo(0, -6);
  ctx.lineTo(12, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Vidrio con resplandor cálido de llama
  const glow = ctx.createRadialGradient(0, 14, 2, 0, 14, 30);
  glow.addColorStop(0, 'rgba(255, 230, 140, 0.95)');
  glow.addColorStop(0.4, 'rgba(255, 170, 50, 0.45)');
  glow.addColorStop(1, 'rgba(255, 120, 40, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 14, 30, 0, TAU);
  ctx.fill();

  // Cuerpo de vidrio
  fillRoundRect(ctx, -8, 4, 16, 20, 3, 'rgba(255, 240, 180, 0.5)');
  strokeRoundRect(ctx, -8, 4, 16, 20, 3, '#24140f', 2);

  // Llama interior
  circle(ctx, 0, 15, 3.5, '#fff4a8');

  // Base de latón
  fillRoundRect(ctx, -10, 24, 20, 6, 2, '#8f6826');
  strokeRoundRect(ctx, -10, 24, 20, 6, 2, '#24140f', 2);

  ctx.restore();
}

function drawBananaLeafPlacemat(ctx, x, y, w, h) {
  ctx.save();
  // Hoja de plátano verde grande extendida como mantel natural
  ctx.fillStyle = '#3a853e';
  ctx.strokeStyle = '#1b4a22';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.5, y + h * 0.5, w * 0.5, h * 0.5, 0.05, 0, TAU);
  ctx.fill();
  ctx.stroke();

  // Nervio central de la hoja
  ctx.strokeStyle = '#7ad972';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 4, y + h * 0.5);
  ctx.lineTo(x + w - 4, y + h * 0.5);
  ctx.stroke();

  // Nervaduras diagonales
  ctx.strokeStyle = '#2d6d31';
  ctx.lineWidth = 1.2;
  for (let dx = 12; dx < w - 12; dx += 14) {
    ctx.beginPath();
    ctx.moveTo(x + dx, y + h * 0.5);
    ctx.lineTo(x + dx + 8, y + 4);
    ctx.moveTo(x + dx, y + h * 0.5);
    ctx.lineTo(x + dx + 8, y + h - 4);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBarCoconut(ctx, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Coco cortado sobre la barra
  circle(ctx, 0, 0, 16, '#52311c', '#24140f', 2.5);
  circle(ctx, 0, -4, 11, '#fbfcf9', '#24140f', 1.5);
  circle(ctx, 0, -4, 7, '#7ce8dd');

  // Pajita de bambú con rayas coralinas
  ctx.strokeStyle = '#ff6b4a';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(8, -26);
  ctx.stroke();
  ctx.restore();
}

function drawRusticCloth(ctx, x, y, w, h) {
  ctx.save();
  // Paño de saco / arpillera con ribete a rayas tropicales
  fillRoundRect(ctx, x, y, w, h, 6, '#eddab4');
  strokeRoundRect(ctx, x, y, w, h, 6, '#4d3420', 2);

  // Rayas tropicales rojas y turquesas en el borde del paño
  ctx.fillStyle = '#ff6b4a';
  ctx.fillRect(x + 4, y + h - 7, w - 8, 2.5);
  ctx.fillStyle = '#3fc1c9';
  ctx.fillRect(x + 4, y + h - 4, w - 8, 2);
  ctx.restore();
}

function drawBarGarnish(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);

  // Rodajita de lima
  circle(ctx, 0, 0, 10, '#4ea638', '#1a3d13', 2);
  circle(ctx, 0, 0, 7, '#9be564');
  circle(ctx, 0, 0, 2, '#fff');

  // Caracola marina pequeña
  ctx.fillStyle = '#fcead2';
  ctx.strokeStyle = '#3d2516';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(14, 2, 7, 5, 0.3, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
