// Helpers de dibujo 2D cartoon: formas, texto con contorno, madera, cielo y gestos.
// Exports: clamp, lerp, invLerp, smoothstep, rand, randInt, pick, chance,
// dist2D, TAU, hexToRgb, rgba, withAlpha, mixColor, roundRectPath,
// fillRoundRect, strokeRoundRect, panel, circle, ellipse, starPath, sparkPath,
// dottedLine, text, drawSunsetBackdrop, drawWoodSurface, drawTablecloth,
// drawVignette, drawPalmLeaf, drawHand, drawGestureArrow, drawBubble, drawDrop.

import { PALETTE } from '../assets/palette.js';

export const TAU = Math.PI * 2;

export const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, Number(value) || 0));
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, value) => (b === a ? 0 : clamp((value - a) / (b - a)));
export const smoothstep = t => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};

export const rand = (min = 0, max = 1) => min + Math.random() * (max - min);
export const randInt = (min, max) => Math.floor(rand(min, max + 1));
export const pick = list => list[Math.floor(Math.random() * list.length)];
export const chance = probability => Math.random() < probability;

export function dist2D(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

// ---------------------------------------------------------------------------
// Color
// ---------------------------------------------------------------------------

export function hexToRgb(hex) {
  const value = String(hex || '').replace('#', '');
  const full = value.length === 3
    ? value.split('').map(c => c + c).join('')
    : value.padEnd(6, '0').slice(0, 6);
  const num = Number.parseInt(full, 16);
  if (!Number.isFinite(num)) return [0, 0, 0];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function rgba(color, alpha = 1) {
  if (Array.isArray(color)) return `rgba(${color[0]},${color[1]},${color[2]},${clamp(alpha)})`;
  if (String(color).startsWith('rgb')) return color;
  const [r, g, b] = hexToRgb(color);
  return `rgba(${r},${g},${b},${clamp(alpha)})`;
}

export function withAlpha(color, alpha = 1) {
  return rgba(color, alpha);
}

export function mixColor(a, b, t) {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const x = clamp(t);
  const toHex = value => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0');
  return `#${toHex(lerp(r1, r2, x))}${toHex(lerp(g1, g2, x))}${toHex(lerp(b1, b2, x))}`;
}

// ---------------------------------------------------------------------------
// Formas
// ---------------------------------------------------------------------------

export function roundRectPath(ctx, x, y, w, h, radius = 12) {
  const r = Math.min(Math.abs(w) / 2, Math.abs(h) / 2, Math.max(0, radius));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function fillRoundRect(ctx, x, y, w, h, radius, fill) {
  roundRectPath(ctx, x, y, w, h, radius);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
}

export function strokeRoundRect(ctx, x, y, w, h, radius, stroke, lineWidth = 3) {
  roundRectPath(ctx, x, y, w, h, radius);
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

export function panel(ctx, x, y, w, h, options = {}) {
  const {
    radius = 18,
    fill = PALETTE.paper,
    stroke = PALETTE.ink,
    lineWidth = 4,
    shadow = true,
    highlight = true
  } = options;
  ctx.save();
  if (shadow) {
    ctx.shadowColor = PALETTE.shadowStrong;
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 7;
  }
  fillRoundRect(ctx, x, y, w, h, radius, fill);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  if (highlight) {
    const grad = ctx.createLinearGradient(x, y, x, y + h * 0.55);
    grad.addColorStop(0, 'rgba(255,255,255,0.34)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    fillRoundRect(ctx, x + lineWidth, y + lineWidth, w - lineWidth * 2, h * 0.48, Math.max(2, radius - lineWidth), grad);
  }
  strokeRoundRect(ctx, x, y, w, h, radius, stroke, lineWidth);
  ctx.restore();
}

export function circle(ctx, x, y, radius, fill = null, stroke = null, lineWidth = 2) {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.1, radius), 0, TAU);
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

export function ellipse(ctx, x, y, rx, ry, rotation = 0, fill = null, stroke = null, lineWidth = 2) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rotation, 0, TAU);
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

export function starPath(ctx, cx, cy, outer, inner, points = 5, rotation = -Math.PI / 2) {
  ctx.beginPath();
  const total = points * 2;
  for (let i = 0; i < total; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = rotation + (i / total) * TAU;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export function sparkPath(ctx, cx, cy, radius, thin = 0.22) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius);
  ctx.quadraticCurveTo(cx + radius * thin, cy - radius * thin, cx + radius, cy);
  ctx.quadraticCurveTo(cx + radius * thin, cy + radius * thin, cx, cy + radius);
  ctx.quadraticCurveTo(cx - radius * thin, cy + radius * thin, cx - radius, cy);
  ctx.quadraticCurveTo(cx - radius * thin, cy - radius * thin, cx, cy - radius);
  ctx.closePath();
}

export function dottedLine(ctx, x1, y1, x2, y2, dash = 8, gap = 9) {
  ctx.save();
  ctx.setLineDash([dash, gap]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

export function drawWavyLine(ctx, x1, y1, x2, y2, amplitude = 6, waves = 6) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length;
  const ny = dx / length;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  const steps = Math.max(12, waves * 8);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const wave = Math.sin(t * Math.PI * 2 * waves) * amplitude;
    ctx.lineTo(x1 + dx * t + nx * wave, y1 + dy * t + ny * wave);
  }
}

// ---------------------------------------------------------------------------
// Texto
// ---------------------------------------------------------------------------

export function text(ctx, value, x, y, options = {}) {
  const {
    size = 20,
    family = '"VT323", "Courier New", monospace',
    weight = '700',
    color = PALETTE.cream,
    align = 'center',
    baseline = 'middle',
    outline = null,
    outlineWidth = 4,
    alpha = 1,
    shadow = 0,
    shadowColor = PALETTE.shadowStrong
  } = options;
  ctx.save();
  ctx.globalAlpha = clamp(alpha);
  ctx.font = `${weight} ${size}px ${family}`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  if (shadow > 0) {
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = shadow;
    ctx.shadowOffsetY = Math.max(1, shadow * 0.25);
  }
  if (outline) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = outlineWidth;
    ctx.strokeStyle = outline;
    ctx.strokeText(String(value), x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(String(value), x, y);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Fondos y superficies
// ---------------------------------------------------------------------------

export function drawSunsetBackdrop(ctx, w, h) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, PALETTE.skyTop);
  sky.addColorStop(0.42, PALETTE.skyMid);
  sky.addColorStop(0.72, PALETTE.skyLow);
  sky.addColorStop(1, PALETTE.seaDeep);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const sunX = w * 0.72;
  const sunY = h * 0.31;
  const sunR = Math.min(w, h) * 0.12;
  const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.8);
  glow.addColorStop(0, 'rgba(255,240,168,0.95)');
  glow.addColorStop(0.35, 'rgba(255,207,74,0.35)');
  glow.addColorStop(1, 'rgba(255,138,101,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h * 0.8);
  circle(ctx, sunX, sunY, sunR, PALETTE.sun);
  ctx.globalAlpha = 0.28;
  circle(ctx, sunX, sunY, sunR * 1.15, null, PALETTE.cream, 3);
  ctx.globalAlpha = 1;

  // Mar con brillos horizontales.
  const horizon = h * 0.58;
  const seaGrad = ctx.createLinearGradient(0, horizon, 0, h);
  seaGrad.addColorStop(0, PALETTE.sea);
  seaGrad.addColorStop(1, PALETTE.seaDeep);
  ctx.fillStyle = seaGrad;
  ctx.fillRect(0, horizon, w, h - horizon);
  for (let i = 0; i < 12; i++) {
    const y = horizon + (i / 12) * (h - horizon) * 0.55 + 4;
    const width = w * rand(0.08, 0.32);
    const x = rand(0, w - width);
    ctx.globalAlpha = 0.1 + (1 - i / 12) * 0.16;
    ctx.fillStyle = PALETTE.cream;
    fillRoundRect(ctx, x, y, width, Math.max(2, h * 0.006), 4, PALETTE.cream);
  }
  ctx.globalAlpha = 1;
}

export function drawWoodSurface(ctx, x, y, w, h, options = {}) {
  const base = options.base || PALETTE.wood;
  const dark = options.dark || PALETTE.woodDark;
  const light = options.light || PALETTE.woodLight;
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, light);
  grad.addColorStop(0.42, base);
  grad.addColorStop(1, dark);
  fillRoundRect(ctx, x, y, w, h, options.radius ?? 16, grad);

  ctx.save();
  roundRectPath(ctx, x, y, w, h, options.radius ?? 16);
  ctx.clip();
  ctx.globalAlpha = 0.32;
  ctx.strokeStyle = PALETTE.woodGrain;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < Math.max(5, h / 28); i++) {
    const gy = y + 12 + i * 28 + Math.sin(i * 1.7) * 4;
    drawWavyLine(ctx, x - 10, gy, x + w + 10, gy + Math.sin(i) * 6, 3.5, 3);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.16;
  for (let i = 0; i < 10; i++) {
    const kx = x + rand(0, w);
    const ky = y + rand(0, h);
    ellipse(ctx, kx, ky, rand(4, 12), rand(2, 5), rand(0, 1), PALETTE.woodDark);
  }
  ctx.restore();
  strokeRoundRect(ctx, x, y, w, h, options.radius ?? 16, PALETTE.ink, options.lineWidth ?? 4);
}

export function drawTablecloth(ctx, x, y, w, h, colorA = PALETTE.coral, colorB = PALETTE.cream) {
  ctx.save();
  roundRectPath(ctx, x, y, w, h, 12);
  ctx.clip();
  ctx.fillStyle = colorA;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = colorB;
  const stripe = Math.max(12, w / 18);
  for (let sx = x - h; sx < x + w + h; sx += stripe * 2) {
    ctx.beginPath();
    ctx.moveTo(sx, y);
    ctx.lineTo(sx + stripe, y);
    ctx.lineTo(sx + stripe - h, y + h);
    ctx.lineTo(sx - h, y + h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export function drawVignette(ctx, w, h, strength = 0.55) {
  const grad = ctx.createRadialGradient(w * 0.5, h * 0.46, Math.min(w, h) * 0.22, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
  grad.addColorStop(0, 'rgba(20,10,8,0)');
  grad.addColorStop(1, `rgba(20,10,8,${clamp(strength)})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

export function drawPalmLeaf(ctx, x, y, length, rotation = 0, color = PALETTE.leafDark) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = color;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(length * 0.45, -length * 0.28, length, -length * 0.05);
  ctx.quadraticCurveTo(length * 0.5, length * 0.22, 0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = rgba(PALETTE.ink, 0.45);
  ctx.lineWidth = 2;
  for (let i = 1; i <= 7; i++) {
    const t = i / 8;
    const px = length * t;
    const py = -length * 0.12 * Math.sin(t * Math.PI);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + length * 0.13, py - length * 0.12);
    ctx.moveTo(px, py);
    ctx.lineTo(px + length * 0.12, py + length * 0.09);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Mano / gestos
// ---------------------------------------------------------------------------

export function drawHand(ctx, x, y, scale = 1, rotation = 0, fill = PALETTE.cream) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const outline = PALETTE.ink;

  // Manga.
  ctx.fillStyle = PALETTE.lagoon;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-18, 34);
  ctx.quadraticCurveTo(-14, 12, -6, 8);
  ctx.lineTo(24, 16);
  ctx.quadraticCurveTo(16, 33, 8, 44);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Palma.
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(0, 0, 25, 22, -0.18, 0, TAU);
  ctx.fill();
  ctx.stroke();

  // Dedos.
  const fingers = [
    [-16, -14, 7, 20, -0.5],
    [-6, -22, 7, 24, -0.18],
    [4, -23, 7, 22, 0.08],
    [13, -16, 6, 17, 0.36]
  ];
  for (const [fx, fy, rx, ry, rot] of fingers) {
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Pulgar.
  ctx.save();
  ctx.translate(-18, 5);
  ctx.rotate(-0.85);
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 16, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Brillo.
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = PALETTE.salt;
  ctx.beginPath();
  ctx.ellipse(-6, -7, 9, 6, -0.4, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function drawGestureArrow(ctx, x1, y1, x2, y2, color = PALETTE.coral, width = 6, head = 13) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = width + 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x2 + Math.cos(angle) * 3, y2 + Math.sin(angle) * 3);
  ctx.lineTo(x2 - Math.cos(angle - 0.6) * head, y2 - Math.sin(angle - 0.6) * head);
  ctx.lineTo(x2 - Math.cos(angle + 0.6) * head, y2 - Math.sin(angle + 0.6) * head);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawBubble(ctx, x, y, radius, color = PALETTE.lagoonLight, alpha = 0.8) {
  ctx.save();
  ctx.globalAlpha = clamp(alpha);
  const grad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.35, radius * 0.1, x, y, radius);
  grad.addColorStop(0, rgba(PALETTE.salt, 0.95));
  grad.addColorStop(0.5, rgba(color, 0.6));
  grad.addColorStop(1, rgba(color, 0.18));
  ctx.fillStyle = grad;
  circle(ctx, x, y, radius, grad, rgba(PALETTE.ink, 0.4), 2);
  ctx.globalAlpha = 1;
  ctx.fillStyle = rgba(PALETTE.salt, 0.8);
  circle(ctx, x - radius * 0.35, y - radius * 0.38, Math.max(1, radius * 0.18), PALETTE.salt);
  ctx.restore();
}

export function drawDrop(ctx, x, y, radius, color = PALETTE.lagoonLight) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = rgba(PALETTE.ink, 0.55);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - radius);
  ctx.quadraticCurveTo(x + radius * 0.9, y + radius * 0.1, x, y + radius);
  ctx.quadraticCurveTo(x - radius * 0.9, y + radius * 0.1, x, y - radius);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = rgba(PALETTE.salt, 0.7);
  circle(ctx, x - radius * 0.25, y, Math.max(1, radius * 0.2), PALETTE.salt);
  ctx.restore();
}
