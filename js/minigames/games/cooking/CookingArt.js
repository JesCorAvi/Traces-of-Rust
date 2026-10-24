// Piezas visuales compartidas de las fases de cocina.
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
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(0, -82);
  ctx.stroke();
  ctx.strokeStyle = PALETTE.woodLight;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(0, -82);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, -4, 17, 25, 0, 0, TAU);
  ctx.fillStyle = PALETTE.wood;
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.globalAlpha = 0.34;
  ctx.fillStyle = PALETTE.cream;
  ctx.beginPath();
  ctx.ellipse(-5, -10, 5, 10, -0.2, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export function drawSpeedMeter(ctx, x, y, width, speed, target, tolerance) {
  const height = 12;
  const left = x - width * 0.5;
  const maxSpeed = Math.max(0.1, target * 2.2);
  ctx.save();
  fillRoundRect(ctx, left, y, width, height, 6, rgba(PALETTE.ink, 0.62));
  const bandStart = clamp((target - tolerance) / maxSpeed);
  const bandWidth = clamp((tolerance * 2) / maxSpeed);
  fillRoundRect(ctx, left + width * bandStart, y + 2, width * bandWidth, height - 4, 4, rgba(PALETTE.lime, 0.82));
  const marker = clamp(speed / maxSpeed);
  const mx = left + width * marker;
  ctx.fillStyle = PALETTE.cream;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(mx, y - 6);
  ctx.lineTo(mx + 6, y - 14);
  ctx.lineTo(mx - 6, y - 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  text(ctx, 'VELOCIDAD', x, y + 28, {
    size: 9,
    family: '"Press Start 2P", monospace',
    color: PALETTE.cream,
    outline: PALETTE.ink,
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
  fillRoundRect(ctx, left - 8, y - 10, width + 16, height + 48, 16, rgba(PALETTE.ink, 0.66));
  // Zonas.
  fillRoundRect(ctx, left, y, width, height, height * 0.5, '#e8d9b8');
  const rawGrad = ctx.createLinearGradient(left, 0, left + width * min, 0);
  rawGrad.addColorStop(0, '#f6e4c0');
  rawGrad.addColorStop(1, '#f2c98e');
  fillRoundRect(ctx, left + 2, y + 2, Math.max(2, width * min - 4), height - 4, height * 0.5, rawGrad);
  const burnGrad = ctx.createLinearGradient(left + width * max, 0, left + width, 0);
  burnGrad.addColorStop(0, '#c25b3a');
  burnGrad.addColorStop(1, '#4d1b12');
  fillRoundRect(ctx, left + width * max, y + 2, Math.max(2, width * (1 - max) - 4), height - 4, height * 0.5, burnGrad);
  const perfectGrad = ctx.createLinearGradient(0, y, 0, y + height);
  perfectGrad.addColorStop(0, PALETTE.lime);
  perfectGrad.addColorStop(1, '#3d9c3d');
  fillRoundRect(ctx, left + width * min, y + 2, Math.max(2, width * (max - min)), height - 4, height * 0.5, perfectGrad);
  strokeRoundRect(ctx, left, y, width, height, height * 0.5, PALETTE.ink, 3);

  // Aguja.
  const mx = left + width * value;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(mx, y - 8);
  ctx.lineTo(mx, y + height + 8);
  ctx.stroke();
  ctx.strokeStyle = PALETTE.cream;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = PALETTE.cream;
  ctx.strokeStyle = PALETTE.ink;
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
    align: 'left', outline: PALETTE.ink, outlineWidth: 3
  });
  text(ctx, options.perfectLabel || 'EN SU PUNTO', left + width * (min + max) * 0.5, y + height + 22, {
    size: 8, family: '"Press Start 2P", monospace', color: PALETTE.lime,
    align: 'center', outline: PALETTE.ink, outlineWidth: 3
  });
  text(ctx, 'QUEMADO', left + width - 4, y + height + 22, {
    size: 8, family: '"Press Start 2P", monospace', color: PALETTE.coral,
    align: 'right', outline: PALETTE.ink, outlineWidth: 3
  });
  ctx.restore();
}

export function drawFlames(ctx, x, y, scale, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  for (let i = 0; i < 5; i++) {
    const offset = (i - 2) * 18;
    const h = 30 + Math.sin(time * 9 + i * 1.7) * 9 + (i === 2 ? 10 : 0);
    const w = 15 + (i % 2) * 4;
    const grad = ctx.createLinearGradient(0, -h, 0, 6);
    grad.addColorStop(0, '#fff0a8');
    grad.addColorStop(0.4, PALETTE.pineapple);
    grad.addColorStop(0.75, PALETTE.coral);
    grad.addColorStop(1, 'rgba(255,107,74,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(offset, 6);
    ctx.quadraticCurveTo(offset - w, -h * 0.35, offset, -h);
    ctx.quadraticCurveTo(offset + w, -h * 0.35, offset, 6);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export function drawBurner(ctx, x, y, radius) {
  ctx.save();
  circle(ctx, x, y + 18, radius * 1.02, rgba(PALETTE.ink, 0.3));
  const ring = ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius);
  ring.addColorStop(0, '#2e2a24');
  ring.addColorStop(0.8, '#171b18');
  ring.addColorStop(1, '#0c0f0c');
  circle(ctx, x, y, radius, ring, PALETTE.ink, 4);
  ctx.strokeStyle = 'rgba(255, 207, 74, 0.34)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * radius * 0.55, y + Math.sin(a) * radius * 0.55);
    ctx.lineTo(x + Math.cos(a) * radius * 0.9, y + Math.sin(a) * radius * 0.9);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawSauceTrail(ctx, points, color = 'rgba(255, 107, 74, 0.85)') {
  if (!points || points.length < 2) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(36, 20, 15, 0.7)';
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
