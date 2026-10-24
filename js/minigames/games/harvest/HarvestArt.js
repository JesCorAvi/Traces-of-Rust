// Piezas visuales de cosecha: planta, tierra, cajas, cesta y medidor de fuerza.
// Exports: drawCropPlant, drawSoilPatch, drawCrate, drawBasket, drawForceMeter.

import { PALETTE } from '../../assets/palette.js';
import {
  TAU, clamp, circle, ellipse, fillRoundRect, strokeRoundRect, text, rgba
} from '../../core/Draw.js';

export function drawSoilPatch(ctx, x, y, w, h, time = 0) {
  ctx.save();
  fillRoundRect(ctx, x, y, w, h, 22, '#5c3b25');
  strokeRoundRect(ctx, x, y, w, h, 22, PALETTE.ink, 4);
  ctx.save();
  ctx.beginPath();
  ctx.roundRect?.(x, y, w, h, 22);
  if (!ctx.roundRect) {
    ctx.rect(x, y, w, h);
  }
  ctx.clip();
  for (let i = 0; i < 16; i++) {
    const px = x + ((i * 73) % Math.max(1, w));
    const py = y + ((i * 41) % Math.max(1, h * 0.8));
    ctx.globalAlpha = 0.32 + (i % 3) * 0.08;
    ellipse(ctx, px, py, 8 + (i % 4) * 4, 3 + (i % 2) * 2, 0, PALETTE.woodGrain);
  }
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = '#3e2618';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 16, y + 18 + i * h * 0.2);
    ctx.quadraticCurveTo(x + w * 0.5, y + 26 + i * h * 0.2 + Math.sin(time + i) * 2, x + w - 16, y + 18 + i * h * 0.2);
    ctx.stroke();
  }
  ctx.restore();
  // Borde de tierra removida.
  ctx.globalAlpha = 0.55;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU;
    circle(ctx, x + w * 0.5 + Math.cos(a) * w * 0.45, y + h * 0.55 + Math.sin(a) * h * 0.3, 3 + (i % 3), '#7a5133');
  }
  ctx.restore();
}

export function drawCropPlant(ctx, crop = {}, x, y, scale = 1, options = {}) {
  const pull = clamp(options.pull || 0);
  const broken = !!options.broken;
  const time = options.time || 0;
  const offsetY = pull * 26 * scale;
  const shake = options.shake || 0;
  ctx.save();
  ctx.translate(x + Math.sin(time * 22) * shake, y - offsetY);
  ctx.scale(scale, scale);
  const shape = crop.shape || 'bush';
  const height = Math.max(0.5, crop.height || 0.8);
  const leafA = PALETTE.leaf;
  const leafB = PALETTE.leafDark;
  const stemColor = '#5d7a3a';

  if (shape === 'palm' || shape === 'tree') {
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 13;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(8, -height * 52, -4, -height * 110);
    ctx.stroke();
    ctx.strokeStyle = PALETTE.wood;
    ctx.lineWidth = 8;
    ctx.stroke();
    // Copa / hojas.
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI * 0.15 - (i / 5) * Math.PI * 0.7;
      const len = 48 + (i % 2) * 12;
      ctx.save();
      ctx.translate(-4, -height * 110);
      ctx.rotate(a + Math.PI * 0.5);
      ctx.fillStyle = i % 2 ? leafA : leafB;
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(len * 0.45, -len * 0.32, len, -len * 0.08);
      ctx.quadraticCurveTo(len * 0.45, len * 0.22, 0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  } else if (shape === 'grass' || shape === 'tuft') {
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i - 3) * 0.18;
      ctx.strokeStyle = i % 2 ? leafA : leafB;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(Math.cos(a) * 18, -height * 30, Math.cos(a) * height * 50, -height * 75);
      ctx.stroke();
    }
  } else {
    // Arbusto / enredadera.
    ctx.fillStyle = leafB;
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, -height * 28, 52, 34, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + time * 0.2;
      ctx.fillStyle = i % 2 ? leafA : leafB;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * 34, -height * 28 + Math.sin(a) * 18, 17, 10, a, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
  }

  if (broken) {
    ctx.strokeStyle = PALETTE.coral;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-20, -height * 15);
    ctx.lineTo(-6, -height * 30);
    ctx.lineTo(-18, -height * 48);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawCrate(ctx, x, y, w, h, color, label, options = {}) {
  const active = !!options.active;
  fillRoundRect(ctx, x, y, w, h, 10, options.fill || '#8a5a3b');
  strokeRoundRect(ctx, x, y, w, h, 10, active ? PALETTE.pineapple : PALETTE.ink, active ? 5 : 3);
  ctx.save();
  ctx.strokeStyle = rgba(PALETTE.ink, 0.55);
  ctx.lineWidth = 2;
  for (let i = 1; i < 3; i++) {
    const yy = y + (h / 3) * i;
    ctx.beginPath();
    ctx.moveTo(x + 5, yy);
    ctx.lineTo(x + w - 5, yy);
    ctx.stroke();
  }
  ctx.fillStyle = color;
  fillRoundRect(ctx, x + 8, y + 8, w - 16, 18, 7, color);
  strokeRoundRect(ctx, x + 8, y + 8, w - 16, 18, 7, PALETTE.ink, 2);
  text(ctx, label, x + w / 2, y + 17, {
    size: 7,
    family: '"Press Start 2P", monospace',
    color: PALETTE.ink,
    align: 'center'
  });
  ctx.restore();
}

export function drawBasket(ctx, x, y, w, h, color) {
  ctx.save();
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, '#b9824d');
  grad.addColorStop(1, '#6b3d24');
  fillRoundRect(ctx, x - w / 2, y - h * 0.5, w, h, 14, grad);
  strokeRoundRect(ctx, x - w / 2, y - h * 0.5, w, h, 14, PALETTE.ink, 4);
  ctx.strokeStyle = rgba(PALETTE.ink, 0.4);
  ctx.lineWidth = 2;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + 8, y - h * 0.5 + i * h * 0.2);
    ctx.lineTo(x + w / 2 - 8, y - h * 0.5 + i * h * 0.2);
    ctx.stroke();
  }
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(x, y - h * 0.45, w * 0.4, Math.PI, TAU);
  ctx.stroke();
  ctx.fillStyle = color;
  circle(ctx, x, y - h * 0.5 + 4, 12, color, PALETTE.ink, 2);
  ctx.restore();
}

export function drawForceMeter(ctx, x, y, w, h, force, min, max) {
  const value = clamp(force);
  const lo = clamp(min);
  const hi = clamp(max);
  ctx.save();
  fillRoundRect(ctx, x - 8, y - 10, w + 16, h + 40, 12, rgba(PALETTE.ink, 0.64));
  fillRoundRect(ctx, x, y, w, h, h * 0.5, '#3b2518');
  fillRoundRect(ctx, x + w * lo, y + 2, w * (hi - lo), h - 4, h * 0.5, rgba(PALETTE.lime, 0.82));
  strokeRoundRect(ctx, x + w * lo, y + 2, w * (hi - lo), h - 4, h * 0.5, PALETTE.cream, 2);
  const mx = x + w * value;
  const grad = ctx.createLinearGradient(x, 0, x + w, 0);
  grad.addColorStop(0, PALETTE.paper);
  grad.addColorStop(0.6, PALETTE.pineapple);
  grad.addColorStop(1, PALETTE.coral);
  fillRoundRect(ctx, x + 2, y + 2, Math.max(0, w * value - 4), h - 4, h * 0.5, grad);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(mx, y - 8);
  ctx.lineTo(mx, y + h + 8);
  ctx.stroke();
  ctx.strokeStyle = PALETTE.cream;
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'FUERZA', x + w * 0.5, y + h + 22, {
    size: 8,
    family: '"Press Start 2P", monospace',
    color: PALETTE.cream,
    outline: PALETTE.ink,
    outlineWidth: 3
  });
  ctx.restore();
}
