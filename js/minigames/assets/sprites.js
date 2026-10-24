// Sprites 2D procedurales de los minijuegos. Cada receta se dibuja una sola vez
// en un canvas cacheado por AssetFactory; nunca se regenera por frame.
// Exports: SPRITE_DEFS, SPRITE_IDS.

import { PALETTE } from './palette.js';
import {
  TAU, circle, ellipse, fillRoundRect, roundRectPath, strokeRoundRect,
  drawHand, drawGestureArrow, rgba, starPath, sparkPath
} from '../core/Draw.js';

const ink = PALETTE.ink;
const outline = 4;

function shadow(ctx, cx, cy, rx, ry, alpha = 0.22) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ellipse(ctx, cx, cy, rx, ry, 0, PALETTE.ink);
  ctx.restore();
}

function highlight(ctx, cx, cy, rx, ry, rotation = -0.4, alpha = 0.4) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ellipse(ctx, cx, cy, rx, ry, rotation, PALETTE.salt);
  ctx.restore();
}

function strokeFill(ctx, fill, lineWidth = outline, stroke = ink) {
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

function vGrad(ctx, x, y, w, h, top, bottom) {
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  return grad;
}

function leaves(ctx, x, y, count, spread, length, colorA = PALETTE.leafLight, colorB = PALETTE.leafDark) {
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const angle = -Math.PI / 2 + (t - 0.5) * spread;
    const tipX = x + Math.cos(angle) * length;
    const tipY = y + Math.sin(angle) * length;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(
      x + Math.cos(angle - 0.34) * length * 0.58,
      y + Math.sin(angle - 0.34) * length * 0.58,
      tipX, tipY
    );
    ctx.quadraticCurveTo(
      x + Math.cos(angle + 0.34) * length * 0.58,
      y + Math.sin(angle + 0.34) * length * 0.58,
      x, y
    );
    ctx.closePath();
    const grad = ctx.createLinearGradient(x, y, tipX, tipY);
    grad.addColorStop(0, colorB);
    grad.addColorStop(0.55, colorA);
    grad.addColorStop(1, colorB);
    strokeFill(ctx, grad, 3);
    ctx.strokeStyle = rgba(PALETTE.ink, 0.35);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + (tipX - x) * 0.5, y + (tipY - y) * 0.5 - 2, tipX, tipY);
    ctx.stroke();
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// Ingredientes
// ---------------------------------------------------------------------------

function drawCarrot(ctx, w, h) {
  const cx = w * 0.5;
  shadow(ctx, cx, h - 16, 34, 9, 0.24);
  leaves(ctx, cx, 62, 4, 1.05, 46);

  ctx.beginPath();
  ctx.moveTo(cx - 30, 56);
  ctx.quadraticCurveTo(cx - 38, 96, cx - 16, 144);
  ctx.quadraticCurveTo(cx - 8, 162, cx, 170);
  ctx.quadraticCurveTo(cx + 9, 160, cx + 17, 142);
  ctx.quadraticCurveTo(cx + 37, 95, cx + 29, 56);
  ctx.quadraticCurveTo(cx + 14, 42, cx - 30, 56);
  ctx.closePath();
  strokeFill(ctx, vGrad(ctx, cx - 34, 50, 70, 120, PALETTE.coralLight, PALETTE.tomatoDark), 5);

  ctx.save();
  ctx.clip();
  ctx.strokeStyle = rgba(PALETTE.coralDark, 0.55);
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    const y = 76 + i * 18;
    const width = 27 - i * 4.2;
    ctx.beginPath();
    ctx.arc(cx, y + 3, width, Math.PI * 1.12, Math.PI * 1.88);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.32;
  ctx.fillStyle = PALETTE.salt;
  ctx.beginPath();
  ctx.ellipse(cx - 10, 94, 7, 24, 0.14, 0, TAU);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = rgba(PALETTE.ink, 0.5);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 3, 55);
  ctx.lineTo(cx - 1, 68);
  ctx.stroke();
}

function drawTomato(ctx, w, h) {
  const cx = w * 0.5;
  const cy = h * 0.57;
  shadow(ctx, cx, h - 10, 34, 8, 0.2);
  ctx.beginPath();
  ctx.ellipse(cx, cy, 39, 35, 0, 0, TAU);
  strokeFill(ctx, vGrad(ctx, cx - 40, cy - 36, 80, 76, PALETTE.coralLight, PALETTE.tomatoDark), 5);

  ctx.save();
  ctx.clip();
  ctx.strokeStyle = rgba(PALETTE.tomatoDark, 0.5);
  ctx.lineWidth = 3;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.arc(cx + i * 17, cy + 4, 16, Math.PI * 1.12, Math.PI * 1.88);
    ctx.stroke();
  }
  ctx.fillStyle = rgba(PALETTE.salt, 0.28);
  ellipse(ctx, cx - 13, cy - 13, 11, 7, -0.5, PALETTE.salt);
  ctx.restore();

  // Cáliz.
  ctx.save();
  ctx.translate(cx, cy - 32);
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.46;
    ctx.save();
    ctx.rotate(a + Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-7, -16, 0, -25);
    ctx.quadraticCurveTo(7, -16, 0, 0);
    ctx.closePath();
    strokeFill(ctx, i % 2 ? PALETTE.leaf : PALETTE.leafDark, 2.5);
    ctx.restore();
  }
  ctx.fillStyle = PALETTE.leafDark;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, -3, 5, 7, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawFish(ctx, w, h) {
  const cx = w * 0.53;
  const cy = h * 0.53;
  shadow(ctx, cx, h - 9, 40, 8, 0.18);

  // Cola.
  ctx.beginPath();
  ctx.moveTo(48, cy);
  ctx.quadraticCurveTo(22, cy - 30, 12, cy - 20);
  ctx.quadraticCurveTo(20, cy, 12, cy + 21);
  ctx.quadraticCurveTo(24, cy + 29, 48, cy);
  ctx.closePath();
  strokeFill(ctx, vGrad(ctx, 12, cy - 30, 40, 60, PALETTE.lagoonLight, PALETTE.sea), 4);

  // Cuerpo.
  ctx.beginPath();
  ctx.ellipse(cx, cy, 58, 37, -0.06, 0, TAU);
  strokeFill(ctx, vGrad(ctx, cx - 58, cy - 38, 116, 76, PALETTE.lagoonLight, PALETTE.seaDark), 5);

  // Vientre.
  ctx.save();
  ctx.clip();
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = PALETTE.cream;
  ellipse(ctx, cx + 4, cy + 15, 40, 14, -0.06, PALETTE.cream);
  ctx.globalAlpha = 1;

  // Escamas.
  ctx.strokeStyle = rgba(PALETTE.seaDeep, 0.45);
  ctx.lineWidth = 2;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      ctx.beginPath();
      ctx.arc(cx + 8 + col * 13 - row * 4, cy - 9 + row * 13, 8, Math.PI * 1.12, Math.PI * 1.88);
      ctx.stroke();
    }
  }
  ctx.restore();

  // Aletas.
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy - 32);
  ctx.quadraticCurveTo(cx + 8, cy - 55, cx + 29, cy - 31);
  ctx.quadraticCurveTo(cx + 10, cy - 26, cx - 10, cy - 32);
  ctx.closePath();
  strokeFill(ctx, PALETTE.coral, 3);

  ctx.beginPath();
  ctx.moveTo(cx - 14, cy + 27);
  ctx.quadraticCurveTo(cx + 6, cy + 46, cx + 20, cy + 26);
  ctx.quadraticCurveTo(cx + 2, cy + 24, cx - 14, cy + 27);
  ctx.closePath();
  strokeFill(ctx, PALETTE.coral, 3);

  // Ojo.
  circle(ctx, cx + 38, cy - 10, 9, PALETTE.salt, ink, 3);
  circle(ctx, cx + 40, cy - 10, 4.5, ink);
  circle(ctx, cx + 41.5, cy - 12, 1.8, PALETTE.salt);

  // Boca y branquia.
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx + 58, cy + 9, 12, Math.PI * 1.08, Math.PI * 1.55);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + 18, cy + 1, 19, Math.PI * 1.55, Math.PI * 2.1);
  ctx.stroke();

  highlight(ctx, cx + 6, cy - 20, 17, 6, -0.2, 0.26);
}

function drawCrab(ctx, w, h) {
  const cx = w * 0.5;
  const cy = h * 0.58;
  shadow(ctx, cx, h - 9, 46, 9, 0.22);

  // Patas.
  ctx.strokeStyle = ink;
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const y = cy - 4 + i * 12;
      const startX = cx + side * 30;
      const midX = cx + side * (46 + i * 5);
      const endX = cx + side * (62 + i * 7);
      const endY = cy + 16 + i * 9;
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.quadraticCurveTo(midX, y + 5, endX, endY);
      ctx.stroke();
      ctx.strokeStyle = PALETTE.coralDark;
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.strokeStyle = ink;
      ctx.lineWidth = 9;
    }
  }

  // Pinzas.
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(cx + side * 43, cy - 8);
    ctx.rotate(side * 0.24);
    ctx.beginPath();
    ctx.ellipse(0, 0, 17, 20, 0, 0, TAU);
    strokeFill(ctx, vGrad(ctx, -18, -20, 36, 40, PALETTE.coralLight, PALETTE.tomato), 4);
    ctx.beginPath();
    ctx.moveTo(side * 9, -12);
    ctx.quadraticCurveTo(side * 34, -24, side * 37, -5);
    ctx.quadraticCurveTo(side * 24, -2, side * 12, 3);
    ctx.closePath();
    strokeFill(ctx, PALETTE.coral, 3.5);
    ctx.beginPath();
    ctx.moveTo(side * 9, 10);
    ctx.quadraticCurveTo(side * 34, 21, side * 36, 3);
    ctx.quadraticCurveTo(side * 22, 4, side * 11, -2);
    ctx.closePath();
    strokeFill(ctx, PALETTE.coral, 3.5);
    ctx.restore();
  }

  // Caparazón.
  ctx.beginPath();
  ctx.ellipse(cx, cy, 38, 30, 0, 0, TAU);
  strokeFill(ctx, vGrad(ctx, cx - 38, cy - 30, 76, 60, PALETTE.coralLight, PALETTE.tomatoDark), 5);
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = rgba(PALETTE.coralDark, 0.55);
  ctx.lineWidth = 3;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.arc(cx + i * 16, cy + 2, 14, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
  }
  ctx.fillStyle = rgba(PALETTE.cream, 0.25);
  ellipse(ctx, cx - 13, cy - 10, 13, 8, -0.4, PALETTE.cream);
  ctx.restore();

  // Ojos.
  for (const side of [-1, 1]) {
    const ex = cx + side * 14;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(ex, cy - 26);
    ctx.lineTo(ex, cy - 40);
    ctx.stroke();
    circle(ctx, ex, cy - 44, 9, PALETTE.salt, ink, 3);
    circle(ctx, ex + side * 1.5, cy - 44, 4.2, ink);
    circle(ctx, ex + side * 3, cy - 46, 1.7, PALETTE.salt);
  }
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy + 9, 12, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
}

function drawMango(ctx, w, h) {
  const cx = w * 0.5;
  const cy = h * 0.57;
  shadow(ctx, cx, h - 9, 34, 8, 0.2);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.26);
  ctx.beginPath();
  ctx.ellipse(0, 0, 32, 42, 0, 0, TAU);
  const grad = ctx.createLinearGradient(-32, -42, 26, 38);
  grad.addColorStop(0, PALETTE.pineapple);
  grad.addColorStop(0.45, PALETTE.mango);
  grad.addColorStop(0.82, PALETTE.coral);
  grad.addColorStop(1, PALETTE.tomatoDark);
  strokeFill(ctx, grad, 5);
  ctx.save();
  ctx.clip();
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = PALETTE.coralDark;
  ctx.beginPath();
  ctx.ellipse(18, -6, 18, 34, 0.2, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = PALETTE.salt;
  ctx.beginPath();
  ctx.ellipse(-13, -14, 7, 18, 0.2, 0, TAU);
  ctx.fill();
  ctx.restore();
  ctx.restore();

  // Hoja y tallo.
  ctx.strokeStyle = ink;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx + 3, cy - 40);
  ctx.quadraticCurveTo(cx + 2, cy - 54, cx + 12, cy - 60);
  ctx.stroke();
  ctx.save();
  ctx.translate(cx + 13, cy - 57);
  ctx.rotate(0.55);
  ctx.beginPath();
  ctx.ellipse(0, 0, 18, 8, 0, 0, TAU);
  strokeFill(ctx, vGrad(ctx, -18, -8, 36, 16, PALETTE.leafLight, PALETTE.leafDark), 3);
  ctx.strokeStyle = rgba(PALETTE.leafDark, 0.7);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.lineTo(14, 0);
  ctx.stroke();
  ctx.restore();
}

function drawChili(ctx, w, h) {
  const cx = w * 0.52;
  shadow(ctx, cx, h - 10, 26, 7, 0.2);
  ctx.beginPath();
  ctx.moveTo(cx - 7, 34);
  ctx.quadraticCurveTo(cx + 30, 46, cx + 22, 94);
  ctx.quadraticCurveTo(cx + 16, 122, cx - 6, 133);
  ctx.quadraticCurveTo(cx - 2, 112, cx - 9, 91);
  ctx.quadraticCurveTo(cx - 28, 57, cx - 7, 34);
  ctx.closePath();
  strokeFill(ctx, vGrad(ctx, cx - 25, 30, 55, 100, PALETTE.coralLight, PALETTE.tomatoDark), 4.5);
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = PALETTE.salt;
  ctx.beginPath();
  ctx.ellipse(cx + 3, 62, 4.5, 18, 0.25, 0, TAU);
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(cx - 5, 36);
  ctx.quadraticCurveTo(cx + 1, 18, cx + 13, 14);
  ctx.strokeStyle = PALETTE.leafDark;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawLime(ctx, w, h) {
  const cx = w * 0.52;
  const cy = h * 0.55;
  shadow(ctx, cx, h - 10, 30, 7, 0.2);
  ctx.beginPath();
  ctx.ellipse(cx, cy, 35, 31, -0.15, 0, TAU);
  strokeFill(ctx, vGrad(ctx, cx - 35, cy - 32, 70, 64, PALETTE.lime, PALETTE.leafDark), 5);
  ctx.save();
  ctx.globalAlpha = 0.35;
  ellipse(ctx, cx - 11, cy - 12, 10, 6, -0.4, PALETTE.salt);
  ctx.globalAlpha = 0.4;
  ctx.strokeStyle = PALETTE.leaf;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * 28, cy + Math.sin(a) * 25);
    ctx.stroke();
  }
  ctx.restore();
  leaves(ctx, cx + 2, cy - 28, 2, 2.2, 22, PALETTE.leafLight, PALETTE.leafDark);
}

function drawOnion(ctx, w, h) {
  const cx = w * 0.5;
  shadow(ctx, cx, h - 10, 30, 7, 0.2);
  leaves(ctx, cx, 42, 3, 0.7, 26, PALETTE.leafLight, PALETTE.leafDark);
  ctx.beginPath();
  ctx.moveTo(cx, 40);
  ctx.quadraticCurveTo(cx + 36, 62, cx + 28, 98);
  ctx.quadraticCurveTo(cx + 20, 129, cx, 132);
  ctx.quadraticCurveTo(cx - 20, 129, cx - 28, 98);
  ctx.quadraticCurveTo(cx - 36, 62, cx, 40);
  ctx.closePath();
  strokeFill(ctx, vGrad(ctx, cx - 34, 40, 68, 92, '#f3d8ef', '#c69ac9'), 4.5);
  ctx.save();
  ctx.strokeStyle = rgba('#8f5d96', 0.5);
  ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + i * 9, 44);
    ctx.quadraticCurveTo(cx + i * 22, 92, cx + i * 4, 128);
    ctx.stroke();
  }
  ctx.restore();
  highlight(ctx, cx - 10, 82, 7, 20, 0.08, 0.3);
}

function drawCoconut(ctx, w, h) {
  const cx = w * 0.5;
  const cy = h * 0.55;
  shadow(ctx, cx, h - 10, 36, 8, 0.22);
  ctx.beginPath();
  ctx.ellipse(cx, cy, 38, 34, 0, 0, TAU);
  strokeFill(ctx, vGrad(ctx, cx - 38, cy - 34, 76, 68, PALETTE.woodLight, PALETTE.woodDark), 5);
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = rgba(PALETTE.woodGrain, 0.65);
  ctx.lineWidth = 2;
  for (let i = 0; i < 9; i++) {
    const y = cy - 30 + i * 8;
    ctx.beginPath();
    ctx.moveTo(cx - 40, y);
    ctx.quadraticCurveTo(cx, y + (i % 2 ? 5 : -5), cx + 40, y);
    ctx.stroke();
  }
  ctx.restore();
  for (let i = 0; i < 3; i++) {
    circle(ctx, cx - 12 + i * 12, cy - 8 + (i % 2) * 4, 4, PALETTE.woodDark, ink, 2);
  }
  highlight(ctx, cx - 14, cy - 16, 9, 5, -0.4, 0.3);
}

function drawPineapple(ctx, w, h) {
  const cx = w * 0.5;
  shadow(ctx, cx, h - 10, 30, 7, 0.2);
  leaves(ctx, cx, 52, 5, 1.1, 40, PALETTE.leafLight, PALETTE.leafDark);
  ctx.beginPath();
  ctx.ellipse(cx, 90, 33, 44, 0, 0, TAU);
  strokeFill(ctx, vGrad(ctx, cx - 33, 46, 66, 88, PALETTE.pineapple, PALETTE.mango), 4.5);
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = rgba(PALETTE.woodDark, 0.48);
  ctx.lineWidth = 2;
  for (let i = -5; i <= 5; i++) {
    ctx.beginPath();
    ctx.moveTo(cx - 40, 60 + i * 12);
    ctx.lineTo(cx + 40, 40 + i * 12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 40, 40 + i * 12);
    ctx.lineTo(cx + 40, 60 + i * 12);
    ctx.stroke();
  }
  ctx.restore();
  highlight(ctx, cx - 12, 78, 7, 18, 0.1, 0.32);
}

function drawRice(ctx, w, h) {
  const cx = w * 0.5;
  shadow(ctx, cx, h - 10, 34, 8, 0.2);
  // Cuenco.
  ctx.beginPath();
  ctx.moveTo(cx - 38, 76);
  ctx.quadraticCurveTo(cx - 32, 124, cx, 128);
  ctx.quadraticCurveTo(cx + 32, 124, cx + 38, 76);
  ctx.closePath();
  strokeFill(ctx, vGrad(ctx, cx - 38, 76, 76, 52, PALETTE.lagoonLight, PALETTE.sea), 4.5);
  // Arroz.
  ctx.beginPath();
  ctx.ellipse(cx, 78, 34, 21, 0, Math.PI, TAU);
  ctx.closePath();
  strokeFill(ctx, vGrad(ctx, cx - 34, 58, 68, 34, PALETTE.salt, PALETTE.sugar), 4);
  ctx.save();
  ctx.strokeStyle = rgba(PALETTE.steelDark, 0.5);
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 12; i++) {
    const x = cx - 26 + (i % 6) * 10;
    const y = 64 + Math.floor(i / 6) * 8;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((i % 2 ? 1 : -1) * 0.5);
    ctx.beginPath();
    ctx.ellipse(0, 0, 4.5, 2.2, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
  // Borde del cuenco.
  ctx.beginPath();
  ctx.ellipse(cx, 78, 37, 12, 0, 0, Math.PI);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3;
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// Utensilios
// ---------------------------------------------------------------------------

function drawKnife(ctx, w, h) {
  const cy = h * 0.52;
  // Mango.
  ctx.save();
  ctx.translate(w * 0.72, cy);
  ctx.beginPath();
  roundRectPath(ctx, -42, -13, 72, 26, 10);
  strokeFill(ctx, vGrad(ctx, -42, -13, 72, 26, PALETTE.woodLight, PALETTE.woodDark), 4);
  ctx.strokeStyle = rgba(PALETTE.ink, 0.45);
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    circle(ctx, -27 + i * 18, 0, 2.2, PALETTE.gold);
  }
  ctx.restore();

  // Hoja.
  ctx.beginPath();
  ctx.moveTo(w * 0.16, cy + 4);
  ctx.quadraticCurveTo(w * 0.28, cy - 24, w * 0.58, cy - 18);
  ctx.lineTo(w * 0.7, cy - 11);
  ctx.lineTo(w * 0.7, cy + 11);
  ctx.quadraticCurveTo(w * 0.48, cy + 22, w * 0.16, cy + 4);
  ctx.closePath();
  const blade = ctx.createLinearGradient(0, cy - 24, 0, cy + 22);
  blade.addColorStop(0, PALETTE.steelLight);
  blade.addColorStop(0.5, PALETTE.steel);
  blade.addColorStop(1, PALETTE.steelDark);
  strokeFill(ctx, blade, 4);
  ctx.save();
  ctx.clip();
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = PALETTE.salt;
  ctx.beginPath();
  ctx.ellipse(w * 0.4, cy - 8, 34, 4, -0.1, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = PALETTE.cream;
  ctx.beginPath();
  ctx.moveTo(w * 0.2, cy + 8);
  ctx.quadraticCurveTo(w * 0.45, cy + 18, w * 0.68, cy + 9);
  ctx.lineTo(w * 0.68, cy + 13);
  ctx.quadraticCurveTo(w * 0.42, cy + 24, w * 0.2, cy + 12);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Virola.
  ctx.fillStyle = PALETTE.steelDark;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3;
  fillRoundRect(ctx, w * 0.64, cy - 14, 10, 28, 4, PALETTE.steelDark);
  strokeRoundRect(ctx, w * 0.64, cy - 14, 10, 28, 4, ink, 3);
}

function drawPot(ctx, w, h) {
  const cx = w * 0.5;
  shadow(ctx, cx, h - 12, 48, 10, 0.24);
  // Asas.
  ctx.strokeStyle = ink;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.arc(cx - 58, 70, 15, Math.PI * 0.1, Math.PI * 0.9);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + 58, 70, 15, Math.PI * 0.1, Math.PI * 0.9);
  ctx.stroke();
  ctx.strokeStyle = PALETTE.steel;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx - 58, 70, 15, Math.PI * 0.1, Math.PI * 0.9);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + 58, 70, 15, Math.PI * 0.1, Math.PI * 0.9);
  ctx.stroke();

  // Cuerpo.
  ctx.beginPath();
  ctx.moveTo(cx - 46, 54);
  ctx.quadraticCurveTo(cx - 43, 118, cx - 30, 126);
  ctx.quadraticCurveTo(cx, 137, cx + 30, 126);
  ctx.quadraticCurveTo(cx + 43, 118, cx + 46, 54);
  ctx.closePath();
  strokeFill(ctx, vGrad(ctx, cx - 46, 50, 92, 88, PALETTE.steel, PALETTE.steelDark), 5);

  // Sopa.
  ctx.beginPath();
  ctx.ellipse(cx, 56, 42, 15, 0, 0, TAU);
  strokeFill(ctx, vGrad(ctx, cx - 42, 42, 84, 30, PALETTE.coralLight, PALETTE.tomato), 4);
  ctx.save();
  ctx.clip();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = PALETTE.pineapple;
  for (let i = 0; i < 4; i++) {
    ellipse(ctx, cx - 22 + i * 15, 54 + (i % 2) * 3, 8, 4, 0.2, PALETTE.pineapple);
  }
  ctx.restore();

  // Remaches.
  for (let i = 0; i < 3; i++) {
    circle(ctx, cx - 25 + i * 25, 112, 3, PALETTE.steelLight, ink, 1.5);
  }

  // Vapor.
  ctx.strokeStyle = rgba(PALETTE.steam, 0.72);
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const x = cx - 22 + i * 22;
    ctx.beginPath();
    ctx.moveTo(x, 42);
    ctx.bezierCurveTo(x - 12, 30, x + 12, 22, x, 10);
    ctx.stroke();
  }
}

function drawPan(ctx, w, h) {
  const cx = w * 0.42;
  const cy = h * 0.55;
  shadow(ctx, cx, h - 12, 42, 9, 0.22);
  // Mango.
  ctx.save();
  ctx.translate(cx + 54, cy + 2);
  ctx.rotate(-0.08);
  fillRoundRect(ctx, 0, -9, 58, 18, 8, PALETTE.woodDark);
  strokeRoundRect(ctx, 0, -9, 58, 18, 8, ink, 4);
  circle(ctx, 26, 0, 2.5, PALETTE.gold);
  ctx.restore();

  // Cuerpo.
  ctx.beginPath();
  ctx.ellipse(cx, cy, 47, 25, 0, 0, TAU);
  strokeFill(ctx, vGrad(ctx, cx - 47, cy - 25, 94, 50, PALETTE.steel, PALETTE.steelDark), 5);
  ctx.beginPath();
  ctx.ellipse(cx, cy - 3, 40, 19, 0, 0, TAU);
  strokeFill(ctx, vGrad(ctx, cx - 40, cy - 22, 80, 38, PALETTE.inkSoft, PALETTE.steelDark), 2.5, ink);

  // Aceite.
  ctx.save();
  ctx.globalAlpha = 0.55;
  ellipse(ctx, cx - 4, cy - 5, 27, 11, -0.1, PALETTE.pineapple);
  ctx.globalAlpha = 1;
  // Huevo.
  ctx.beginPath();
  ctx.ellipse(cx - 2, cy - 5, 19, 12, 0.15, 0, TAU);
  strokeFill(ctx, PALETTE.salt, 2.5, rgba(ink, 0.5));
  circle(ctx, cx + 2, cy - 6, 7, PALETTE.mango, ink, 2);
  highlight(ctx, cx - 1, cy - 8, 2.5, 1.5, 0, 0.7);
  ctx.restore();
}

function drawSaltShaker(ctx, w, h) {
  const cx = w * 0.5;
  shadow(ctx, cx, h - 10, 22, 6, 0.22);
  // Cuerpo de cristal.
  ctx.beginPath();
  ctx.moveTo(cx - 20, 52);
  ctx.quadraticCurveTo(cx - 25, 84, cx - 22, 116);
  ctx.quadraticCurveTo(cx - 20, 130, cx, 132);
  ctx.quadraticCurveTo(cx + 20, 130, cx + 22, 116);
  ctx.quadraticCurveTo(cx + 25, 84, cx + 20, 52);
  ctx.closePath();
  strokeFill(ctx, vGrad(ctx, cx - 24, 50, 48, 84, 'rgba(255,255,255,0.82)', 'rgba(176,220,220,0.55)'), 4);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = rgba(PALETTE.salt, 0.92);
  ctx.beginPath();
  ctx.moveTo(cx - 22, 82);
  ctx.quadraticCurveTo(cx, 76, cx + 22, 82);
  ctx.lineTo(cx + 22, 130);
  ctx.lineTo(cx - 22, 130);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = PALETTE.steelDark;
  ctx.lineWidth = 1;
  for (let i = 0; i < 18; i++) {
    circle(ctx, cx - 16 + (i % 6) * 6.4, 90 + Math.floor(i / 6) * 9, 1.4, PALETTE.steelDark);
  }
  ctx.restore();
  // Tapa.
  ctx.beginPath();
  roundRectPath(ctx, cx - 20, 36, 40, 22, 8);
  strokeFill(ctx, vGrad(ctx, cx - 20, 36, 40, 22, PALETTE.steel, PALETTE.steelDark), 4);
  for (let i = 0; i < 3; i++) {
    circle(ctx, cx - 9 + i * 9, 47, 2.2, PALETTE.inkSoft);
  }
  highlight(ctx, cx - 8, 70, 4, 18, 0.12, 0.55);
}

function drawPlate(ctx, w, h) {
  const cx = w * 0.5;
  const cy = h * 0.55;
  shadow(ctx, cx, cy + 20, 54, 12, 0.2);
  ctx.beginPath();
  ctx.ellipse(cx, cy, 62, 30, 0, 0, TAU);
  strokeFill(ctx, vGrad(ctx, cx, cy - 30, 0, cy + 30, PALETTE.salt, PALETTE.steel), 5);
  ctx.beginPath();
  ctx.ellipse(cx, cy - 2, 50, 22, 0, 0, TAU);
  strokeFill(ctx, '#f0f8f2', 2.5, rgba(PALETTE.steelDark, 0.6));
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = PALETTE.steel;
  ellipse(ctx, cx, cy + 1, 34, 13, 0, rgba(PALETTE.steel, 0.5));
  ctx.globalAlpha = 1;
  highlight(ctx, cx - 16, cy - 8, 20, 5, -0.1, 0.4);
}

function drawWateringCan(ctx, w, h) {
  const cx = w * 0.44;
  shadow(ctx, cx, h - 10, 38, 8, 0.2);
  // Cuerpo.
  ctx.beginPath();
  ctx.moveTo(cx - 32, 54);
  ctx.quadraticCurveTo(cx - 38, 92, cx - 30, 126);
  ctx.quadraticCurveTo(cx - 2, 136, cx + 26, 126);
  ctx.quadraticCurveTo(cx + 34, 92, cx + 28, 54);
  ctx.closePath();
  strokeFill(ctx, vGrad(ctx, cx - 34, 50, 68, 84, PALETTE.lagoonLight, PALETTE.sea), 4.5);
  // Asa.
  ctx.strokeStyle = ink;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(cx + 4, 48, 24, Math.PI * 1.05, Math.PI * 1.95);
  ctx.stroke();
  ctx.strokeStyle = PALETTE.lagoon;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx + 4, 48, 24, Math.PI * 1.05, Math.PI * 1.95);
  ctx.stroke();
  // Pitorro.
  ctx.beginPath();
  ctx.moveTo(cx + 28, 76);
  ctx.lineTo(cx + 66, 54);
  ctx.lineTo(cx + 72, 64);
  ctx.lineTo(cx + 34, 94);
  ctx.closePath();
  strokeFill(ctx, PALETTE.sea, 4);
  // Ducha.
  ctx.beginPath();
  ctx.ellipse(cx + 70, 60, 12, 8, -0.45, 0, TAU);
  strokeFill(ctx, PALETTE.steel, 3);
  for (let i = 0; i < 3; i++) {
    circle(ctx, cx + 80 + i * 5, 70 + i * 8, 2.6, PALETTE.lagoonLight, ink, 1.5);
  }
  // Brillo.
  highlight(ctx, cx - 12, 82, 5, 20, 0.08, 0.35);
  // Agua.
  ctx.strokeStyle = rgba(PALETTE.lagoonLight, 0.8);
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + 82 + i * 5, 76 + i * 8);
    ctx.lineTo(cx + 84 + i * 5, 86 + i * 8);
    ctx.stroke();
  }
}

function drawShovel(ctx, w, h) {
  const cx = w * 0.5;
  shadow(ctx, cx, h - 10, 26, 7, 0.22);
  // Palo.
  fillRoundRect(ctx, cx - 5, 40, 10, 86, 5, PALETTE.woodLight);
  strokeRoundRect(ctx, cx - 5, 40, 10, 86, 5, ink, 3);
  // Agarre.
  ctx.strokeStyle = ink;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.arc(cx, 38, 17, Math.PI * 0.15, Math.PI * 0.85, true);
  ctx.stroke();
  ctx.strokeStyle = PALETTE.wood;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, 38, 17, Math.PI * 0.15, Math.PI * 0.85, true);
  ctx.stroke();
  // Hoja.
  ctx.beginPath();
  ctx.moveTo(cx - 25, 122);
  ctx.quadraticCurveTo(cx - 28, 160, cx, 174);
  ctx.quadraticCurveTo(cx + 28, 160, cx + 25, 122);
  ctx.quadraticCurveTo(cx, 114, cx - 25, 122);
  ctx.closePath();
  strokeFill(ctx, vGrad(ctx, cx - 26, 114, 52, 60, PALETTE.steel, PALETTE.steelDark), 4.5);
  ctx.strokeStyle = rgba(PALETTE.steelDark, 0.6);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, 126);
  ctx.lineTo(cx, 164);
  ctx.stroke();
  highlight(ctx, cx - 10, 138, 5, 12, 0.1, 0.4);
}

function drawSeed(ctx, w, h) {
  const cx = w * 0.5;
  shadow(ctx, cx, h - 10, 22, 6, 0.2);
  // Bolsa.
  ctx.beginPath();
  ctx.moveTo(cx - 26, 38);
  ctx.lineTo(cx + 26, 38);
  ctx.quadraticCurveTo(cx + 32, 76, cx + 24, 118);
  ctx.quadraticCurveTo(cx, 130, cx - 24, 118);
  ctx.quadraticCurveTo(cx - 32, 76, cx - 26, 38);
  ctx.closePath();
  strokeFill(ctx, vGrad(ctx, cx - 26, 36, 52, 92, PALETTE.paper, PALETTE.woodLight), 4);
  // Semilla dibujada.
  ctx.save();
  ctx.translate(cx, 78);
  ctx.rotate(-0.25);
  ctx.beginPath();
  ctx.ellipse(0, 0, 12, 18, 0, 0, TAU);
  strokeFill(ctx, PALETTE.pineapple, 3);
  ctx.beginPath();
  ctx.ellipse(-3, -5, 4, 7, -0.3, 0, TAU);
  ctx.fillStyle = PALETTE.cream;
  ctx.fill();
  ctx.restore();
  // Brote.
  leaves(ctx, cx, 54, 2, 1.3, 22, PALETTE.leafLight, PALETTE.leafDark);
  // Cinta.
  fillRoundRect(ctx, cx - 28, 58, 56, 9, 4, PALETTE.coral);
  strokeRoundRect(ctx, cx - 28, 58, 56, 9, 4, ink, 2.5);
}

function drawCrate(ctx, w, h) {
  const cx = w * 0.5;
  shadow(ctx, cx, h - 8, 48, 8, 0.22);
  ctx.beginPath();
  roundRectPath(ctx, 10, 24, w - 20, h - 38, 8);
  strokeFill(ctx, vGrad(ctx, 10, 24, w - 20, h - 38, PALETTE.woodLight, PALETTE.woodDark), 5);
  ctx.strokeStyle = rgba(PALETTE.woodGrain, 0.7);
  ctx.lineWidth = 3;
  for (let i = 1; i < 4; i++) {
    const y = 24 + i * (h - 38) / 4;
    ctx.beginPath();
    ctx.moveTo(12, y);
    ctx.lineTo(w - 12, y);
    ctx.stroke();
  }
  ctx.strokeStyle = ink;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(18, 30);
  ctx.lineTo(w - 18, h - 20);
  ctx.moveTo(w - 18, 30);
  ctx.lineTo(18, h - 20);
  ctx.globalAlpha = 0.55;
  ctx.stroke();
  ctx.globalAlpha = 1;
  for (let i = 0; i < 4; i++) {
    const x = i < 2 ? 16 : w - 16;
    const y = i % 2 === 0 ? 30 : h - 20;
    circle(ctx, x, y, 2.5, PALETTE.steelLight, ink, 1.5);
  }
}

function drawBobber(ctx, w, h) {
  const cx = w * 0.5;
  shadow(ctx, cx, h - 10, 17, 5, 0.2);
  // Antena.
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, 20);
  ctx.lineTo(cx, 44);
  ctx.stroke();
  circle(ctx, cx, 18, 5, PALETTE.coral, ink, 2);
  // Cuerpo.
  ctx.beginPath();
  ctx.arc(cx, 66, 24, Math.PI, TAU);
  ctx.lineTo(cx + 24, 78);
  ctx.arc(cx, 78, 24, 0, Math.PI);
  ctx.closePath();
  strokeFill(ctx, PALETTE.salt, 4);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = PALETTE.coral;
  ctx.fillRect(cx - 25, 50, 50, 16);
  ctx.restore();
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 24, 66);
  ctx.lineTo(cx + 24, 66);
  ctx.stroke();
  highlight(ctx, cx - 8, 76, 5, 6, -0.3, 0.4);
}

// ---------------------------------------------------------------------------
// UI / gestos
// ---------------------------------------------------------------------------

function drawStar(ctx, w, h) {
  const cx = w * 0.5;
  const cy = h * 0.5;
  const grad = ctx.createLinearGradient(cx, cy - 40, cx, cy + 40);
  grad.addColorStop(0, PALETTE.sun || PALETTE.pineapple);
  grad.addColorStop(0.55, PALETTE.star);
  grad.addColorStop(1, PALETTE.mango);
  starPath(ctx, cx, cy, 40, 18, 5, -Math.PI / 2);
  strokeFill(ctx, grad, 5);
  ctx.globalAlpha = 0.5;
  starPath(ctx, cx - 5, cy - 6, 15, 6.5, 5, -Math.PI / 2);
  ctx.fillStyle = PALETTE.salt;
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawSpark(ctx, w, h) {
  const cx = w * 0.5;
  const cy = h * 0.5;
  const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 34);
  grad.addColorStop(0, PALETTE.salt);
  grad.addColorStop(0.55, PALETTE.pineapple);
  grad.addColorStop(1, rgba(PALETTE.mango, 0));
  sparkPath(ctx, cx, cy, 34, 0.24);
  ctx.fillStyle = grad;
  ctx.fill();
  sparkPath(ctx, cx, cy, 18, 0.3);
  ctx.fillStyle = PALETTE.salt;
  ctx.fill();
}

function drawGestureDrag(ctx, w, h) {
  const cy = h * 0.56;
  ctx.strokeStyle = rgba(PALETTE.cream, 0.72);
  ctx.lineWidth = 5;
  ctx.setLineDash([8, 9]);
  ctx.beginPath();
  ctx.moveTo(24, cy);
  ctx.lineTo(w - 28, cy);
  ctx.stroke();
  ctx.setLineDash([]);
  drawGestureArrow(ctx, 30, cy, w - 32, cy, PALETTE.lagoon, 4, 10);
  drawHand(ctx, w * 0.48, h * 0.43, 0.72, -0.08);
}

function drawGestureCircle(ctx, w, h) {
  const cx = w * 0.5;
  const cy = h * 0.52;
  ctx.strokeStyle = PALETTE.lagoon;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, 38, 0.35, Math.PI * 1.75);
  ctx.stroke();
  drawGestureArrow(ctx, cx + 32, cy - 25, cx + 40, cy - 8, PALETTE.lagoon, 4, 10);
  drawHand(ctx, cx, cy + 4, 0.58, 0.25);
}

function drawGestureShake(ctx, w, h) {
  const cx = w * 0.5;
  const cy = h * 0.54;
  ctx.strokeStyle = PALETTE.mango;
  ctx.lineWidth = 4;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(cx + 18, cy - 18, 26 + i * 9, -0.7, 0.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx - 18, cy - 18, 26 + i * 9, Math.PI - 0.7, Math.PI + 0.7);
    ctx.stroke();
  }
  drawHand(ctx, cx, cy, 0.62, -0.1);
  // Salero minúsculo.
  ctx.save();
  ctx.translate(cx + 34, cy + 10);
  ctx.rotate(0.25);
  fillRoundRect(ctx, -9, -18, 18, 32, 6, PALETTE.salt);
  strokeRoundRect(ctx, -9, -18, 18, 32, 6, ink, 2.5);
  fillRoundRect(ctx, -10, -22, 20, 8, 3, PALETTE.steel);
  strokeRoundRect(ctx, -10, -22, 20, 8, 3, ink, 2.5);
  ctx.restore();
}

function drawGestureTap(ctx, w, h) {
  const cx = w * 0.5;
  const cy = h * 0.58;
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = rgba(PALETTE.cream, 0.16 + i * 0.18);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy + 5, 14 + i * 12, 0, TAU);
    ctx.stroke();
  }
  circle(ctx, cx, cy + 5, 13, PALETTE.coral, ink, 3);
  drawHand(ctx, cx + 2, cy - 24, 0.58, 0.05);
}

function drawGestureHold(ctx, w, h) {
  const cx = w * 0.5;
  const cy = h * 0.58;
  ctx.strokeStyle = PALETTE.lagoon;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, 28, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = PALETTE.cream;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, 28, -Math.PI / 2, Math.PI * 0.2);
  ctx.stroke();
  circle(ctx, cx, cy, 13, PALETTE.mango, ink, 3);
  drawHand(ctx, cx, cy - 32, 0.56, -0.04);
}

function drawGestureZigzag(ctx, w, h) {
  const cy = h * 0.55;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 9;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(24, cy + 14);
  ctx.lineTo(45, cy - 14);
  ctx.lineTo(66, cy + 14);
  ctx.lineTo(87, cy - 14);
  ctx.lineTo(108, cy + 14);
  ctx.lineTo(128, cy - 14);
  ctx.stroke();
  ctx.strokeStyle = PALETTE.mango;
  ctx.lineWidth = 5;
  ctx.stroke();
  drawGestureArrow(ctx, 110, cy - 14, 132, cy - 14, PALETTE.mango, 3, 9);
  drawHand(ctx, w * 0.75, h * 0.34, 0.56, 0.2);
}

function drawGestureRub(ctx, w, h) {
  const cy = h * 0.56;
  drawGestureArrow(ctx, 30, cy, 62, cy, PALETTE.lagoon, 4, 9);
  drawGestureArrow(ctx, 120, cy, 88, cy, PALETTE.coral, 4, 9);
  drawHand(ctx, w * 0.5, cy - 30, 0.58, 0);
  ctx.strokeStyle = rgba(PALETTE.cream, 0.55);
  ctx.lineWidth = 3;
  ctx.setLineDash([5, 6]);
  ctx.beginPath();
  ctx.moveTo(64, cy + 18);
  ctx.lineTo(88, cy + 18);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawGestureFlick(ctx, w, h) {
  const cx = w * 0.5;
  const cy = h * 0.58;
  ctx.strokeStyle = PALETTE.coral;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, 30, -0.25, Math.PI * 1.2);
  ctx.stroke();
  drawGestureArrow(ctx, cx + 10, cy - 30, cx - 6, cy - 48, PALETTE.coral, 4, 10);
  drawHand(ctx, cx, cy + 8, 0.56, -0.2);
}

function drawMissing(ctx, w, h) {
  const cx = w * 0.5;
  const cy = h * 0.5;
  fillRoundRect(ctx, cx - 34, cy - 34, 68, 68, 16, PALETTE.paper);
  strokeRoundRect(ctx, cx - 34, cy - 34, 68, 68, 16, PALETTE.ink, 5);
  ctx.fillStyle = PALETTE.coral;
  ctx.font = '700 44px "VT323", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', cx, cy + 3);
}

// ---------------------------------------------------------------------------
// Catálogo
// ---------------------------------------------------------------------------

export const SPRITE_DEFS = {
  carrot: { width: 120, height: 180, anchorX: 0.5, anchorY: 0.94, draw: drawCarrot },
  tomato: { width: 120, height: 120, anchorX: 0.5, anchorY: 0.9, draw: drawTomato },
  fish: { width: 180, height: 120, anchorX: 0.5, anchorY: 0.55, draw: drawFish },
  crab: { width: 160, height: 130, anchorX: 0.5, anchorY: 0.92, draw: drawCrab },
  mango: { width: 120, height: 140, anchorX: 0.5, anchorY: 0.92, draw: drawMango },
  chili: { width: 100, height: 150, anchorX: 0.5, anchorY: 0.92, draw: drawChili },
  lime: { width: 110, height: 110, anchorX: 0.5, anchorY: 0.9, draw: drawLime },
  onion: { width: 110, height: 145, anchorX: 0.5, anchorY: 0.92, draw: drawOnion },
  coconut: { width: 110, height: 110, anchorX: 0.5, anchorY: 0.9, draw: drawCoconut },
  pineapple: { width: 110, height: 150, anchorX: 0.5, anchorY: 0.92, draw: drawPineapple },
  rice: { width: 130, height: 140, anchorX: 0.5, anchorY: 0.9, draw: drawRice },
  knife: { width: 190, height: 90, anchorX: 0.5, anchorY: 0.55, draw: drawKnife },
  pot: { width: 170, height: 150, anchorX: 0.5, anchorY: 0.86, draw: drawPot },
  pan: { width: 190, height: 110, anchorX: 0.45, anchorY: 0.7, draw: drawPan },
  saltshaker: { width: 90, height: 150, anchorX: 0.5, anchorY: 0.94, draw: drawSaltShaker },
  plate: { width: 170, height: 95, anchorX: 0.5, anchorY: 0.72, draw: drawPlate },
  wateringcan: { width: 160, height: 150, anchorX: 0.45, anchorY: 0.9, draw: drawWateringCan },
  shovel: { width: 100, height: 185, anchorX: 0.5, anchorY: 0.95, draw: drawShovel },
  seed: { width: 90, height: 140, anchorX: 0.5, anchorY: 0.94, draw: drawSeed },
  crate: { width: 150, height: 115, anchorX: 0.5, anchorY: 0.92, draw: drawCrate },
  bobber: { width: 70, height: 110, anchorX: 0.5, anchorY: 0.92, draw: drawBobber },
  star: { width: 100, height: 100, anchorX: 0.5, anchorY: 0.5, draw: drawStar },
  spark: { width: 80, height: 80, anchorX: 0.5, anchorY: 0.5, draw: drawSpark },
  'gesture-drag': { width: 150, height: 150, anchorX: 0.5, anchorY: 0.5, draw: drawGestureDrag },
  'gesture-circle': { width: 150, height: 150, anchorX: 0.5, anchorY: 0.5, draw: drawGestureCircle },
  'gesture-shake': { width: 150, height: 150, anchorX: 0.5, anchorY: 0.5, draw: drawGestureShake },
  'gesture-tap': { width: 150, height: 150, anchorX: 0.5, anchorY: 0.5, draw: drawGestureTap },
  'gesture-hold': { width: 150, height: 150, anchorX: 0.5, anchorY: 0.5, draw: drawGestureHold },
  'gesture-zigzag': { width: 150, height: 150, anchorX: 0.5, anchorY: 0.5, draw: drawGestureZigzag },
  'gesture-rub': { width: 150, height: 150, anchorX: 0.5, anchorY: 0.5, draw: drawGestureRub },
  'gesture-flick': { width: 150, height: 150, anchorX: 0.5, anchorY: 0.5, draw: drawGestureFlick },
  missing: { width: 100, height: 100, anchorX: 0.5, anchorY: 0.5, draw: drawMissing }
};

export const SPRITE_IDS = Object.keys(SPRITE_DEFS);
