// Texturas y calcomanías pixel-art procedurales para modelos 3D de torretas.
// Exports: getHazardTexture, getTechPanelTexture, getGaugeTexture, getTurretDecalTexture, getMuzzleFlashTexture.

import * as THREE from 'three';
import { P, px } from './palette.js';
import { applyEnvironmentDither, makeTexture } from '../spritePalette.js';

let hazardTex = null;
let techPanelTex = null;
const gaugeTexCache = {};
const decalTexCache = {};
const muzzleFlashTexCache = {};

export function getHazardTexture() {
  if (hazardTex) return hazardTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#121812';
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = '#b89c46';
  const w = 12;
  for (let x = -64; x < 128; x += w * 2) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + w, 0);
    ctx.lineTo(x + w + 64, 64);
    ctx.lineTo(x + 64, 64);
    ctx.closePath();
    ctx.fill();
  }
  // Bordes gastados
  px(ctx, 0, 0, 64, 2, '#050605');
  px(ctx, 0, 62, 64, 2, '#050605');
  applyEnvironmentDither(ctx, 64, 64);
  hazardTex = makeTexture(c, 2);
  return hazardTex;
}

export function getTechPanelTexture() {
  if (techPanelTex) return techPanelTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1c241b';
  ctx.fillRect(0, 0, 64, 64);
  ctx.strokeStyle = '#0a0d0a';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 62, 62);

  // Remaches de acero en esquinas
  const bolts = [
    [5, 5], [58, 5], [5, 58], [58, 58],
    [32, 5], [32, 58], [5, 32], [58, 32]
  ];
  bolts.forEach(([bx, by]) => {
    px(ctx, bx - 2, by - 2, 4, 4, '#050605');
    px(ctx, bx - 1, by - 1, 3, 3, '#877a5c');
    px(ctx, bx, by, 1, 1, '#c8c2ac');
  });

  // Rejilla de refrigeración central
  for (let y = 18; y <= 46; y += 6) {
    px(ctx, 14, y, 36, 4, '#050605');
    px(ctx, 14, y + 1, 36, 2, '#243022');
    px(ctx, 14, y, 36, 1, '#63533b');
  }

  // Costura central reforzada
  px(ctx, 10, 31, 44, 2, '#4a2518');

  applyEnvironmentDither(ctx, 64, 64);
  techPanelTex = makeTexture(c, 1);
  return techPanelTex;
}

export function getGaugeTexture(accentColor = '#b89c46') {
  if (gaugeTexCache[accentColor]) return gaugeTexCache[accentColor];
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#050605';
  ctx.fillRect(0, 0, 64, 64);

  // Bisel circular
  ctx.fillStyle = '#4a2518';
  ctx.beginPath(); ctx.arc(32, 32, 28, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#121812';
  ctx.beginPath(); ctx.arc(32, 32, 24, 0, Math.PI * 2); ctx.fill();

  // Esfera del dial
  ctx.fillStyle = '#243022';
  ctx.beginPath(); ctx.arc(32, 32, 21, 0, Math.PI * 2); ctx.fill();

  // Escala graduada
  ctx.strokeStyle = '#e6d7a5';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(32, 32, 17, Math.PI * 0.75, Math.PI * 2.25); ctx.stroke();

  // Zona crítica en rojo
  ctx.strokeStyle = '#a52020';
  ctx.beginPath(); ctx.arc(32, 32, 17, Math.PI * 1.85, Math.PI * 2.25); ctx.stroke();

  // Aguja del medidor
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(32, 32);
  ctx.lineTo(44, 22);
  ctx.stroke();

  // Pivote central
  px(ctx, 30, 30, 4, 4, '#050605');
  px(ctx, 31, 31, 2, 2, '#c8c2ac');

  // LED de advertencia
  px(ctx, 29, 44, 6, 4, accentColor);

  gaugeTexCache[accentColor] = makeTexture(c, 1);
  return gaugeTexCache[accentColor];
}

export function getTurretDecalTexture(type) {
  if (decalTexCache[type]) return decalTexCache[type];
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 32;
  const ctx = c.getContext('2d');

  // Fondo de placa metálica remachada
  ctx.fillStyle = '#161d15';
  ctx.fillRect(0, 0, 64, 32);
  ctx.strokeStyle = '#050605';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 62, 30);

  // Remaches en 4 esquinas
  [[3, 3], [59, 3], [3, 27], [59, 27]].forEach(([bx, by]) => {
    px(ctx, bx, by, 2, 2, '#877a5c');
  });

  if (type === 'gunner') {
    // Franja amarilla de munición
    px(ctx, 8, 5, 48, 3, '#b89c46');
    // Fila de 5 balas de latón
    for (let i = 0; i < 5; i++) {
      const bx = 12 + i * 8;
      px(ctx, bx, 12, 5, 12, '#050605');
      px(ctx, bx + 1, 13, 3, 10, '#b89c46');
      px(ctx, bx + 2, 10, 1, 3, '#e6d7a5'); // punta
    }
  } else if (type === 'mortar') {
    // Franja roja de explosivos
    px(ctx, 8, 5, 48, 3, '#a52020');
    // Icono de proyectil pesado / ojiva
    px(ctx, 24, 11, 16, 14, '#050605');
    px(ctx, 26, 12, 12, 12, '#743718');
    px(ctx, 28, 9, 8, 3, '#b89c46');
    px(ctx, 30, 7, 4, 2, '#a52020');
  } else if (type === 'cryo') {
    // Franja celeste de peligro criogénico
    px(ctx, 8, 5, 48, 3, '#6f8f9c');
    // Cristal de hielo / copo
    px(ctx, 31, 10, 2, 16, '#9fc3c9');
    px(ctx, 24, 17, 16, 2, '#9fc3c9');
    px(ctx, 27, 13, 10, 10, '#050605');
    px(ctx, 28, 14, 8, 8, '#4a6b73');
    px(ctx, 30, 16, 4, 4, '#e6d7a5');
  } else if (type === 'barracks') {
    // Chevrons militares tácticos
    px(ctx, 8, 5, 48, 3, '#68863a');
    for (let i = 0; i < 3; i++) {
      const cy = 11 + i * 5;
      px(ctx, 22, cy, 8, 3, '#68863a');
      px(ctx, 30, cy, 4, 3, '#e6d7a5');
      px(ctx, 34, cy, 8, 3, '#68863a');
    }
  } else {
    // Support: Rayo de alto voltaje
    px(ctx, 8, 5, 48, 3, '#b89c46');
    // Triángulo de advertencia
    px(ctx, 24, 10, 16, 16, '#050605');
    px(ctx, 26, 11, 12, 14, '#b89c46');
    // Rayo
    px(ctx, 32, 12, 4, 5, '#050605');
    px(ctx, 29, 16, 6, 2, '#050605');
    px(ctx, 31, 17, 3, 6, '#050605');
  }

  applyEnvironmentDither(ctx, 64, 32);
  decalTexCache[type] = makeTexture(c, 1);
  return decalTexCache[type];
}

export function getMuzzleFlashTexture(type) {
  if (muzzleFlashTexCache[type]) return muzzleFlashTexCache[type];
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');

  const isCryo = type === 'cryo';
  const coreColor = '#ffffff';
  const midColor = isCryo ? '#9fc3c9' : '#e6d7a5';
  const outerColor = isCryo ? '#4a6b73' : '#b89c46';
  const smokeColor = isCryo ? '#2c4148' : '#743718';

  // Rayos irregulares de fogonazo
  for (let a = 0; a < 8; a++) {
    const ang = (a / 8) * Math.PI * 2 + (a % 2 === 0 ? 0.2 : -0.1);
    const len = 18 + (a % 3) * 8;
    ctx.strokeStyle = outerColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(32, 32);
    ctx.lineTo(32 + Math.cos(ang) * len, 32 + Math.sin(ang) * len);
    ctx.stroke();

    ctx.strokeStyle = midColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(32, 32);
    ctx.lineTo(32 + Math.cos(ang) * (len * 0.7), 32 + Math.sin(ang) * (len * 0.7));
    ctx.stroke();
  }

  // Núcleo brillante
  ctx.fillStyle = coreColor;
  ctx.beginPath();
  ctx.arc(32, 32, 8, 0, Math.PI * 2);
  ctx.fill();

  // Partículas y flecos de humo
  px(ctx, 16, 20, 3, 3, smokeColor);
  px(ctx, 45, 18, 4, 4, smokeColor);
  px(ctx, 22, 46, 3, 3, smokeColor);
  px(ctx, 44, 42, 3, 3, smokeColor);

  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  muzzleFlashTexCache[type] = tex;
  return tex;
}
