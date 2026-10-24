// Piezas visuales compartidas de pesca: caña, línea, carrete, tensión y ondas.
// Exports: drawRod, drawLine, drawTensionMeter, drawReel, drawProgressArc,
// drawSpeedMeter, drawWaterRipples, drawSplashRing.

import { PALETTE } from '../../assets/palette.js';
import {
  TAU, clamp, circle, fillRoundRect, strokeRoundRect, text, rgba
} from '../../core/Draw.js';

export function drawRod(ctx, baseX, baseY, tipX, tipY, options = {}) {
  const bend = Number(options.bend) || 0;
  const controlX = (baseX + tipX) * 0.5 + (tipY - baseY) * 0.16 + bend;
  const controlY = (baseY + tipY) * 0.5;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = options.width ? options.width + 4 : 11;
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.quadraticCurveTo(controlX, controlY, tipX, tipY);
  ctx.stroke();
  ctx.strokeStyle = options.color || PALETTE.woodLight;
  ctx.lineWidth = options.width || 7;
  ctx.stroke();
  ctx.strokeStyle = rgba(PALETTE.cream, 0.28);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Mango.
  const angle = Math.atan2(tipY - baseY, tipX - baseX);
  ctx.save();
  ctx.translate(baseX, baseY);
  ctx.rotate(angle);
  fillRoundRect(ctx, -28, -7, 38, 14, 7, PALETTE.woodDark);
  strokeRoundRect(ctx, -28, -7, 38, 14, 7, PALETTE.ink, 3);
  circle(ctx, -14, 0, 2.2, PALETTE.gold);
  // Carrete junto al mango.
  circle(ctx, 2, 15, 12, PALETTE.steel, PALETTE.ink, 3);
  circle(ctx, 2, 15, 5, PALETTE.coral, PALETTE.ink, 2);
  ctx.restore();
  ctx.restore();
}

export function drawLine(ctx, x1, y1, x2, y2, sag = 18, color = 'rgba(255,244,214,0.75)', width = 2) {
  const mx = (x1 + x2) * 0.5;
  const my = (y1 + y2) * 0.5 + sag;
  ctx.save();
  ctx.strokeStyle = 'rgba(36,20,15,0.5)';
  ctx.lineWidth = width + 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(mx, my, x2, y2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.restore();
}

export function drawTensionMeter(ctx, x, y, width, height, tension, options = {}) {
  const value = clamp(tension);
  ctx.save();
  fillRoundRect(ctx, x - 6, y - 8, width + 12, height + 16, 12, rgba(PALETTE.ink, 0.62));
  const grad = ctx.createLinearGradient(x, y + height, x, y);
  grad.addColorStop(0, PALETTE.lime);
  grad.addColorStop(0.55, PALETTE.mango);
  grad.addColorStop(1, PALETTE.coral);
  fillRoundRect(ctx, x, y, width, height, height * 0.5, rgba(PALETTE.ink, 0.5));
  fillRoundRect(ctx, x + 2, y + height - (height - 4) * value, width - 4, (height - 4) * value, height * 0.5, grad);
  strokeRoundRect(ctx, x, y, width, height, height * 0.5, PALETTE.ink, 2);
  const markerY = y + height - (height - 4) * value;
  ctx.strokeStyle = PALETTE.cream;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 4, markerY);
  ctx.lineTo(x + width + 4, markerY);
  ctx.stroke();
  if (options.label !== false) {
    text(ctx, 'TENSIÓN', x + width * 0.5, y + height + 16, {
      size: 8,
      family: '"Press Start 2P", monospace',
      color: value > 0.8 ? PALETTE.coral : PALETTE.cream,
      outline: PALETTE.ink,
      outlineWidth: 3
    });
  }
  ctx.restore();
}

export function drawReel(ctx, x, y, radius, rotation = 0, time = 0) {
  ctx.save();
  ctx.translate(x, y);
  circle(ctx, 0, 0, radius, rgba(PALETTE.ink, 0.2));
  const spool = ctx.createRadialGradient(-radius * 0.3, -radius * 0.35, radius * 0.1, 0, 0, radius);
  spool.addColorStop(0, PALETTE.steelLight);
  spool.addColorStop(0.55, PALETTE.steel);
  spool.addColorStop(1, PALETTE.steelDark);
  circle(ctx, 0, 0, radius, spool, PALETTE.ink, 4);
  ctx.rotate(rotation);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    ctx.save();
    ctx.rotate(a);
    fillRoundRect(ctx, radius * 0.2, -3, radius * 0.55, 6, 3, PALETTE.steelDark);
    ctx.restore();
  }
  circle(ctx, 0, 0, radius * 0.25, PALETTE.ink);
  circle(ctx, 0, 0, radius * 0.16, PALETTE.coral);
  // Manivela.
  const a = rotation * 1.3 + Math.sin(time * 2) * 0.02;
  ctx.save();
  ctx.rotate(a);
  fillRoundRect(ctx, radius * 0.62, -5, radius * 0.42, 10, 5, PALETTE.woodDark);
  strokeRoundRect(ctx, radius * 0.62, -5, radius * 0.42, 10, 5, PALETTE.ink, 2);
  circle(ctx, radius * 1.02, 0, 7, PALETTE.coral, PALETTE.ink, 2);
  ctx.restore();
  ctx.restore();
}

export function drawProgressArc(ctx, cx, cy, radius, progress, color = PALETTE.lagoonLight, lineWidth = 8) {
  const value = clamp(progress);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = rgba(PALETTE.ink, 0.4);
  ctx.lineWidth = lineWidth + 5;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + TAU * value);
  ctx.stroke();
  ctx.restore();
}

export function drawSpeedMeter(ctx, x, y, width, speed, target, tolerance) {
  const height = 10;
  const left = x - width * 0.5;
  const maxSpeed = Math.max(0.1, target * 2.2);
  ctx.save();
  fillRoundRect(ctx, left, y, width, height, 5, rgba(PALETTE.ink, 0.62));
  const bandStart = clamp((target - tolerance) / maxSpeed);
  const bandWidth = clamp((tolerance * 2) / maxSpeed);
  fillRoundRect(ctx, left + width * bandStart, y + 2, width * bandWidth, height - 4, 3, rgba(PALETTE.lime, 0.82));
  const marker = clamp(speed / maxSpeed);
  const mx = left + width * marker;
  ctx.fillStyle = PALETTE.cream;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(mx, y - 5);
  ctx.lineTo(mx + 5, y - 12);
  ctx.lineTo(mx - 5, y - 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  text(ctx, 'RITMO', x, y + 22, {
    size: 8,
    family: '"Press Start 2P", monospace',
    color: PALETTE.cream,
    outline: PALETTE.ink,
    outlineWidth: 3
  });
  ctx.restore();
}

export function drawWaterRipples(ctx, x, y, radius, color = PALETTE.lagoonLight, time = 0, count = 3) {
  ctx.save();
  ctx.strokeStyle = color;
  for (let i = 0; i < count; i++) {
    const t = (time * 0.55 + i / count) % 1;
    ctx.globalAlpha = (1 - t) * 0.5;
    ctx.lineWidth = Math.max(1, 3 - t * 2);
    ctx.beginPath();
    ctx.ellipse(x, y, radius * (0.35 + t * 1.1), radius * (0.15 + t * 0.42), 0, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawSplashRing(ctx, x, y, radius, color = PALETTE.cream) {
  ctx.save();
  ctx.globalAlpha = 0.8;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.ellipse(x, y, radius, radius * 0.4, 0, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(x, y, radius, radius * 0.4, 0, 0, TAU);
  ctx.stroke();
  ctx.restore();
}
