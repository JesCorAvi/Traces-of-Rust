// Piezas visuales de siembra: bancal, cuadrícula, barra de ritmo y humedad.
// Exports: drawBed, drawGrid, drawRhythmBar, drawMoistureBar, drawHole,
// drawWaterDrops, drawMallet.

import { PALETTE } from '../../assets/palette.js';
import {
  TAU, clamp, circle, ellipse, fillRoundRect, strokeRoundRect, text, rgba
} from '../../core/Draw.js';

export function drawBed(ctx, x, y, w, h, time = 0) {
  ctx.save();
  fillRoundRect(ctx, x - 8, y - 8, w + 16, h + 16, 22, '#6b462d');
  strokeRoundRect(ctx, x - 8, y - 8, w + 16, h + 16, 22, PALETTE.ink, 4);
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, '#7a5133');
  grad.addColorStop(0.55, '#5c3b25');
  grad.addColorStop(1, '#4a2f1e');
  fillRoundRect(ctx, x, y, w, h, 16, grad);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  for (let i = 0; i < 28; i++) {
    const px = x + ((i * 79) % Math.max(1, w));
    const py = y + ((i * 47) % Math.max(1, h));
    ctx.globalAlpha = 0.22 + (i % 4) * 0.05;
    ellipse(ctx, px, py, 5 + (i % 5) * 3, 2 + (i % 2) * 2, 0, '#8b6845');
  }
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = '#3e2618';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) {
    const yy = y + 12 + i * h * 0.24;
    ctx.beginPath();
    ctx.moveTo(x + 8, yy);
    ctx.quadraticCurveTo(x + w * 0.5, yy + Math.sin(time + i) * 3, x + w - 8, yy);
    ctx.stroke();
  }
  ctx.restore();
  strokeRoundRect(ctx, x, y, w, h, 16, rgba(PALETTE.cream, 0.12), 1.5);
  ctx.restore();
}

export function drawGrid(ctx, rect, rows, cols, options = {}) {
  const cellW = rect.w / cols;
  const cellH = rect.h / rows;
  ctx.save();
  ctx.strokeStyle = options.color || rgba(PALETTE.cream, 0.22);
  ctx.lineWidth = options.lineWidth || 1.5;
  ctx.setLineDash(options.dash || [5, 7]);
  for (let r = 1; r < rows; r++) {
    ctx.beginPath();
    ctx.moveTo(rect.x + 8, rect.y + r * cellH);
    ctx.lineTo(rect.x + rect.w - 8, rect.y + r * cellH);
    ctx.stroke();
  }
  for (let c = 1; c < cols; c++) {
    ctx.beginPath();
    ctx.moveTo(rect.x + c * cellW, rect.y + 8);
    ctx.lineTo(rect.x + c * cellW, rect.y + rect.h - 8);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();
}

export function drawRhythmBar(ctx, rect, marker, zoneCenter, zoneWidth, options = {}) {
  fillRoundRect(ctx, rect.x - 8, rect.y - 10, rect.w + 16, rect.h + 38, 14, rgba(PALETTE.ink, 0.66));
  fillRoundRect(ctx, rect.x, rect.y, rect.w, rect.h, rect.h * 0.5, '#3b2518');
  const zoneX = rect.x + rect.w * (zoneCenter - zoneWidth * 0.5);
  const zoneW = rect.w * zoneWidth;
  const band = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  band.addColorStop(0, PALETTE.lime);
  band.addColorStop(1, '#3d9c3d');
  fillRoundRect(ctx, zoneX, rect.y + 2, zoneW, rect.h - 4, rect.h * 0.5, band);
  strokeRoundRect(ctx, zoneX, rect.y + 2, zoneW, rect.h - 4, rect.h * 0.5, PALETTE.cream, 2);
  const mx = rect.x + rect.w * clamp(marker);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(mx, rect.y - 8);
  ctx.lineTo(mx, rect.y + rect.h + 8);
  ctx.stroke();
  ctx.strokeStyle = PALETTE.cream;
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, options.label || 'GOLPEA EN VERDE', rect.x + rect.w * 0.5, rect.y + rect.h + 22, {
    size: 8,
    family: '"Press Start 2P", monospace',
    color: PALETTE.cream,
    outline: PALETTE.ink,
    outlineWidth: 3
  });
}

export function drawMoistureBar(ctx, x, y, w, h, value, min, max) {
  const v = clamp(value);
  fillRoundRect(ctx, x - 7, y - 8, w + 14, h + 34, 10, rgba(PALETTE.ink, 0.6));
  fillRoundRect(ctx, x, y, w, h, h * 0.5, '#3b2518');
  const bandX = x + w * clamp(min);
  const bandW = w * (clamp(max) - clamp(min));
  fillRoundRect(ctx, bandX, y + 2, bandW, h - 4, h * 0.5, rgba(PALETTE.lime, 0.75));
  const fill = ctx.createLinearGradient(x, 0, x + w, 0);
  fill.addColorStop(0, PALETTE.paper);
  fill.addColorStop(0.6, PALETTE.lagoonLight);
  fill.addColorStop(1, PALETTE.sea);
  fillRoundRect(ctx, x + 2, y + 2, Math.max(0, w * v - 4), h - 4, h * 0.5, fill);
  const mx = x + w * v;
  ctx.strokeStyle = PALETTE.cream;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(mx, y - 5);
  ctx.lineTo(mx, y + h + 5);
  ctx.stroke();
  text(ctx, 'HUMEDAD', x + w * 0.5, y + h + 20, {
    size: 7,
    family: '"Press Start 2P", monospace',
    color: PALETTE.cream,
    outline: PALETTE.ink,
    outlineWidth: 3
  });
}

export function drawHole(ctx, x, y, radius, filled = false) {
  circle(ctx, x, y + 2, radius * 0.9, 'rgba(36,20,15,0.25)');
  ctx.beginPath();
  ctx.ellipse(x, y, radius, radius * 0.48, 0, 0, TAU);
  ctx.fillStyle = filled ? '#3a2218' : '#7a5133';
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  if (filled) {
    circle(ctx, x - radius * 0.3, y - 1, radius * 0.18, PALETTE.cream);
    circle(ctx, x + radius * 0.3, y + 1, radius * 0.15, PALETTE.cream);
  }
}

export function drawWaterDrops(ctx, x, y, count = 4, time = 0) {
  ctx.save();
  for (let i = 0; i < count; i++) {
    const a = (i / count) * TAU + time * 0.6;
    const r = 12 + (i % 3) * 8;
    const dx = Math.cos(a) * r;
    const dy = (time * 90 + i * 14) % 28;
    const px = x + dx;
    const py = y + dy;
    ctx.strokeStyle = rgba(PALETTE.lagoonLight, 0.75);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px, py + 7);
    ctx.stroke();
    circle(ctx, px, py + 9, 2.2, PALETTE.lagoonLight);
  }
  ctx.restore();
}

export function drawMallet(ctx, x, y, rotation = 0, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 20);
  ctx.lineTo(0, -42);
  ctx.stroke();
  ctx.strokeStyle = PALETTE.woodLight;
  ctx.lineWidth = 5;
  ctx.stroke();
  fillRoundRect(ctx, -26, -62, 52, 28, 8, PALETTE.wood);
  strokeRoundRect(ctx, -26, -62, 52, 28, 8, PALETTE.ink, 4);
  fillRoundRect(ctx, -20, -57, 40, 8, 4, rgba(PALETTE.cream, 0.2));
  ctx.restore();
}
