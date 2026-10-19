// Paleta, dithering, contornos y helper de texturas pixel-art.
// Exports: BAYER4, PAL, applyEnvironmentDither, applyCleanSpriteOutlineRect, applyIcon16Outline, makeTexture.
import * as THREE from 'three';

export const BAYER4 = [
  [ 0,  8,  2, 10],
  [12,  4, 14,  6],
  [ 3, 11,  1,  9],
  [15,  7, 13,  5]
];

export const PAL = [
  [5, 6, 5],       // Negro abisal (Contornos y sombras profundas)
  [18, 24, 18],    // Gris verdoso oscuro
  [36, 48, 34],    // Verde enfermizo oscuro
  [68, 86, 58],    // Verde moho
  [74, 37, 24],    // Óxido marrón / cuero oscuro
  [110, 20, 20],   // Sangre seca
  [165, 32, 32],   // Sangre fresca
  [135, 122, 92],  // Venda sucia / acero gastado
  [184, 156, 70],  // Amarillo nicotina / latón
  [230, 215, 165]  // Blanco ocular / filo brillante
];

export function applyEnvironmentDither(ctx, w, h) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (d[i + 3] < 90) { d[i + 3] = 0; continue; }
      d[i + 3] = 255;
      const bayer = (BAYER4[y & 3][x & 3] - 7.5) * 3.0;
      const r = d[i] + bayer, g = d[i + 1] + bayer, b = d[i + 2] + bayer;

      let best = PAL[0], minDist = 1e9;
      for (let p = 0; p < PAL.length; p++) {
        const pr = PAL[p][0], pg = PAL[p][1], pb = PAL[p][2];
        const dist = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
        if (dist < minDist) { minDist = dist; best = PAL[p]; }
      }
      d[i] = best[0]; d[i + 1] = best[1]; d[i + 2] = best[2];
    }
  }
  ctx.putImageData(img, 0, 0);
}

// Contorno negro limpio de 1px (#050605) optimizado con Uint32Array
export function applyCleanSpriteOutlineRect(ctx, w, h) {
  const src = ctx.getImageData(0, 0, w, h);
  const out = ctx.createImageData(w, h);
  const s32 = new Uint32Array(src.data.buffer);
  const d32 = new Uint32Array(out.data.buffer);
  d32.set(s32);

  const OUTLINE_COLOR = 0xFF050605;

  for (let y = 1; y < h - 1; y++) {
    if ((y & 63) === 0 || (y & 63) === 63) continue;
    const rowOffset = y * w;
    for (let x = 1; x < w - 1; x++) {
      if ((x & 63) === 0 || (x & 63) === 63) continue;
      const idx = rowOffset + x;
      if ((s32[idx] >>> 24) > 128) continue;

      if (
        (s32[idx - 1] >>> 24) > 128 ||
        (s32[idx + 1] >>> 24) > 28 ||
        (s32[idx - w] >>> 24) > 128 ||
        (s32[idx + w] >>> 24) > 128
      ) {
        d32[idx] = OUTLINE_COLOR;
      }
    }
  }
  ctx.putImageData(out, 0, 0);
}

// Contorno negro nítido de 1px para cada icono de 16x16 del HUD
export function applyIcon16Outline(ctx, ox, oy) {
  const img = ctx.getImageData(ox, oy, 16, 16);
  const out = ctx.createImageData(16, 16);
  const s = img.data;
  const d = out.data;
  d.set(s);

  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const idx = (y * 16 + x) * 4;
      if (s[idx + 3] > 128) continue;

      let hasNeighbor = false;
      const neighbors = [
        [x - 1, y], [x + 1, y],
        [x, y - 1], [x, y + 1]
      ];
      for (let n = 0; n < neighbors.length; n++) {
        const nx = neighbors[n][0];
        const ny = neighbors[n][1];
        if (nx >= 0 && nx < 16 && ny >= 0 && ny < 16) {
          if (s[(ny * 16 + nx) * 4 + 3] > 128) {
            hasNeighbor = true;
            break;
          }
        }
      }
      if (hasNeighbor) {
        d[idx] = 5;
        d[idx + 1] = 6;
        d[idx + 2] = 5;
        d[idx + 3] = 255;
      }
    }
  }
  ctx.putImageData(out, ox, oy);
}

export function makeTexture(canvas, repeat = 1) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  if (repeat > 1) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat, repeat);
  }
  return tex;
}