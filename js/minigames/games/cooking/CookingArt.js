// Piezas visuales compartidas de las fases de cocina en el Chiringuito.
// Diseñadas con estilo rústico de playa caribeña: madera de palapa, hierro forjado,
// brasas incandescentes de carbón de coco y medidores náuticos retro.
// Exports: drawSpoon, drawSpeedMeter, drawDonenessMeter, drawFlames,
// drawBurner, drawSauceTrail.

import { PALETTE } from '../../assets/palette.js';
import {
  TAU, clamp, circle, fillRoundRect, strokeRoundRect, text, rgba
} from '../../core/Draw.js';

export function drawSpoon(ctx, x, y, rotation = -0.7, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.lineCap = 'round';

  // Mango de madera rústica de palapa
  ctx.strokeStyle = '#24140f';
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(0, -84);
  ctx.stroke();

  ctx.strokeStyle = PALETTE.woodLight;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(0, -84);
  ctx.stroke();

  // Vetas de madera tallada en el mango
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 2;
  for (let gy = -28; gy >= -76; gy -= 12) {
    ctx.beginPath();
    ctx.moveTo(-2, gy);
    ctx.lineTo(2, gy + 3);
    ctx.stroke();
  }

  // Cazo ovalado de madera
  ctx.beginPath();
  ctx.ellipse(0, -4, 18, 26, 0, 0, TAU);
  ctx.fillStyle = PALETTE.wood;
  ctx.fill();
  ctx.strokeStyle = '#24140f';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Brillo suave en el cuenco de la cuchara
  ctx.globalAlpha = 0.38;
  ctx.fillStyle = PALETTE.cream;
  ctx.beginPath();
  ctx.ellipse(-5, -10, 5, 11, -0.2, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export function drawSpeedMeter(ctx, x, y, width, speed, target, tolerance) {
  const height = 14;
  const left = x - width * 0.5;
  const maxSpeed = Math.max(0.1, target * 2.2);

  ctx.save();
  // Marco rústico de madera
  fillRoundRect(ctx, left - 6, y - 6, width + 12, height + 42, 10, '#361e12');
  strokeRoundRect(ctx, left - 6, y - 6, width + 12, height + 42, 10, '#1c1009', 2.5);

  // Fondo del canal de velocidad
  fillRoundRect(ctx, left, y, width, height, 6, '#182422');

  // Zona verde objetivo de buen ritmo
  const bandStart = clamp((target - tolerance) / maxSpeed);
  const bandWidth = clamp((tolerance * 2) / maxSpeed);
  fillRoundRect(ctx, left + width * bandStart, y + 2, width * bandWidth, height - 4, 4, PALETTE.lime);

  // Aguja / marcador indicador
  const marker = clamp(speed / maxSpeed);
  const mx = left + width * marker;
  ctx.fillStyle = PALETTE.cream;
  ctx.strokeStyle = '#1c1009';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(mx, y - 6);
  ctx.lineTo(mx + 6, y - 14);
  ctx.lineTo(mx - 6, y - 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  text(ctx, 'RITMO CHIRINGUITO', x, y + 30, {
    size: 8,
    family: '"Press Start 2P", monospace',
    color: PALETTE.pineapple,
    outline: '#1c1009',
    outlineWidth: 3
  });
  ctx.restore();
}

export function drawDonenessMeter(ctx, x, y, width, height, doneness, perfectMin, perfectMax, options = {}) {
  const left = x - width * 0.5;
  const value = clamp(doneness);
  const min = clamp(perfectMin);
  const max = clamp(perfectMax);

  ctx.save();
  // Marco de madera de chiringuito con placa náutica de latón
  fillRoundRect(ctx, left - 10, y - 12, width + 20, height + 50, 14, '#3b2214');
  strokeRoundRect(ctx, left - 10, y - 12, width + 20, height + 50, 14, '#1c1009', 3);

  // Clavos de latón en las esquinas del medidor
  ctx.fillStyle = PALETTE.gold;
  for (const cx of [left - 4, left + width + 4]) {
    for (const cy of [y - 6, y + height + 32]) {
      ctx.fillRect(cx - 2, cy - 2, 4, 4);
    }
  }

  // Zonas de cocción
  fillRoundRect(ctx, left, y, width, height, height * 0.5, '#eddcb9');

  // Zona cruda (amarillo suave a dorado)
  const rawGrad = ctx.createLinearGradient(left, 0, left + width * min, 0);
  rawGrad.addColorStop(0, '#faebd0');
  rawGrad.addColorStop(1, '#f4ca8a');
  fillRoundRect(ctx, left + 2, y + 2, Math.max(2, width * min - 4), height - 4, height * 0.5, rawGrad);

  // Zona quemada (coral tostado a carbón)
  const burnGrad = ctx.createLinearGradient(left + width * max, 0, left + width, 0);
  burnGrad.addColorStop(0, '#c74f30');
  burnGrad.addColorStop(1, '#4a150e');
  fillRoundRect(ctx, left + width * max, y + 2, Math.max(2, width * (1 - max) - 4), height - 4, height * 0.5, burnGrad);

  // Zona perfecta (verde esmeralda / lima tropical)
  const perfectGrad = ctx.createLinearGradient(0, y, 0, y + height);
  perfectGrad.addColorStop(0, PALETTE.lime);
  perfectGrad.addColorStop(1, '#388e3c');
  fillRoundRect(ctx, left + width * min, y + 2, Math.max(2, width * (max - min)), height - 4, height * 0.5, perfectGrad);
  strokeRoundRect(ctx, left, y, width, height, height * 0.5, '#1c1009', 2.5);

  // Aguja indicadora
  const mx = left + width * value;
  ctx.strokeStyle = '#1c1009';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(mx, y - 8);
  ctx.lineTo(mx, y + height + 8);
  ctx.stroke();

  ctx.strokeStyle = PALETTE.cream;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = PALETTE.cream;
  ctx.strokeStyle = '#1c1009';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(mx, y - 10);
  ctx.lineTo(mx + 8, y - 20);
  ctx.lineTo(mx - 8, y - 20);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  text(ctx, 'CRUDO', left + 4, y + height + 22, {
    size: 8, family: '"Press Start 2P", monospace', color: PALETTE.cream,
    align: 'left', outline: '#1c1009', outlineWidth: 3
  });
  text(ctx, options.perfectLabel || 'EN SU PUNTO', left + width * (min + max) * 0.5, y + height + 22, {
    size: 8, family: '"Press Start 2P", monospace', color: PALETTE.lime,
    align: 'center', outline: '#1c1009', outlineWidth: 3
  });
  text(ctx, 'QUEMADO', left + width - 4, y + height + 22, {
    size: 8, family: '"Press Start 2P", monospace', color: PALETTE.coral,
    align: 'right', outline: '#1c1009', outlineWidth: 3
  });
  ctx.restore();
}

export function drawFlames(ctx, x, y, scale, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Llamas vivas de leña y carbón de coco
  for (let i = 0; i < 5; i++) {
    const offset = (i - 2) * 18;
    const h = 32 + Math.sin(time * 9 + i * 1.7) * 10 + (i === 2 ? 12 : 0);
    const w = 15 + (i % 2) * 4;
    const grad = ctx.createLinearGradient(0, -h, 0, 6);
    grad.addColorStop(0, '#fff4b0');
    grad.addColorStop(0.35, PALETTE.pineapple);
    grad.addColorStop(0.7, PALETTE.coral);
    grad.addColorStop(1, 'rgba(255,107,74,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(offset, 6);
    ctx.quadraticCurveTo(offset - w, -h * 0.35, offset, -h);
    ctx.quadraticCurveTo(offset + w, -h * 0.35, offset, 6);
    ctx.closePath();
    ctx.fill();

    // Chispitas incandescentes que flotan hacia arriba
    if ((i + Math.floor(time * 6)) % 3 === 0) {
      const sparkY = -h - 8 - ((time * 30 + i * 10) % 20);
      circle(ctx, offset + Math.sin(time * 12 + i) * 4, sparkY, 1.8, PALETTE.pineapple);
    }
  }
  ctx.restore();
}

export function drawBurner(ctx, x, y, radius) {
  ctx.save();
  // Hornillo rústico de hierro fundido sobre brasas ardientes de carbón de coco
  circle(ctx, x, y + 16, radius * 1.04, 'rgba(24, 14, 10, 0.35)');

  // Fondo de brasas al rojo vivo
  const coals = ctx.createRadialGradient(x, y, radius * 0.1, x, y, radius);
  coals.addColorStop(0, '#ff4a1c');
  coals.addColorStop(0.35, '#ff8a24');
  coals.addColorStop(0.75, '#4a1e12');
  coals.addColorStop(1, '#1e110c');
  circle(ctx, x, y, radius, coals, '#1c1009', 4);

  // Carbones incandescentes y trozos de brasa
  ctx.fillStyle = '#ffcf4a';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + 0.3;
    const cr = radius * 0.35;
    ctx.fillRect(x + Math.cos(a) * cr - 2, y + Math.sin(a) * cr - 2, 4, 4);
  }

  // Rejilla de hierro forjado grueso del hornillo de chiringuito
  ctx.strokeStyle = '#2b2c30';
  ctx.lineWidth = 4;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * radius * 0.45, y + Math.sin(a) * radius * 0.45);
    ctx.lineTo(x + Math.cos(a) * radius * 0.94, y + Math.sin(a) * radius * 0.94);
    ctx.stroke();
  }
  // Aro de hierro central
  circle(ctx, x, y, radius * 0.45, null, '#2b2c30', 3.5);
  ctx.restore();
}

export function drawSauceTrail(ctx, points, color = 'rgba(255, 107, 74, 0.85)') {
  if (!points || points.length < 2) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(28, 16, 12, 0.7)';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = PALETTE.cream;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}
