// Paleta tropical, dithering, contornos y helper de texturas pixel-art.
// Exports: applyEnvironmentDither, applyTropicalUIRemap, applyCleanSpriteOutlineRect, applyIcon16Outline, makeTexture.
import * as THREE from 'three';

const BAYER4 = [
  [ 0,  8,  2, 10],
  [12,  4, 14,  6],
  [ 3, 11,  1,  9],
  [15,  7, 13,  5]
];

const PAL = [
  [7, 24, 28],     // Tinta de marea (contornos y sombras profundas)
  [15, 48, 54],    // Azul petróleo oscuro
  [27, 81, 71],    // Verde selva sombrío
  [63, 139, 93],   // Hoja de palmera
  [90, 51, 34],    // Madera mojada / cuero tostado
  [143, 45, 55],   // Coral oscuro
  [217, 80, 74],   // Coral vivo
  [181, 138, 91],  // Arena húmeda / mimbre
  [255, 200, 87],  // Sol de atardecer / latón
  [255, 240, 199], // Espuma / crema
  [33, 110, 128],  // Agua profunda
  [95, 190, 180],  // Turquesa de arrecife
  [255, 145, 102]  // Naranja de horizonte
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

// Remapeo de la paleta industrial del atlas de UI a la paleta del atardecer.
// Conserva la luminancia y la semántica (rojo = peligro, verde = curación),
// pero sustituye óxidos y verdes de fábrica por maderas, corales y turquesas.
const TROPICAL_UI_REMAP = new Map([
  [0x050605, 0x07181c], [0x0a0d0a, 0x0b262a], [0x121812, 0x123235],
  [0x182018, 0x163f40], [0x1c241b, 0x1d4a48], [0x1c261c, 0x1d4a48],
  [0x1d261c, 0x1d4a48], [0x243022, 0x1f5a55], [0x364832, 0x32776d],
  [0x44563a, 0x4f967d], [0x4a2518, 0x6b3823], [0x5c2c16, 0x87472a],
  [0x743718, 0xa85832], [0x63533b, 0x8a6845], [0x877a5c, 0xb8976c],
  [0xc8c2ac, 0xe6d2a4], [0xb89c46, 0xffc857], [0xf0c954, 0xffdd82],
  [0xe6d7a5, 0xfff0c7], [0xf5ecd3, 0xfff8e6], [0xa52020, 0xd84a44],
  [0x6e1414, 0x7b2531], [0x9e1c1c, 0xc53b3c], [0xe83333, 0xff6a58],
  [0xff5555, 0xff7e68], [0xff6b6b, 0xff917b], [0xff3333, 0xff5f51],
  [0x68863a, 0x5fa45a], [0x55de3e, 0x92e373], [0x3fe0f5, 0x65e6e9],
  [0x55c8e0, 0x6fd1dd], [0x6f8f9c, 0x7cbfc2], [0x9fc3c9, 0xc7ece6],
  [0x4a6b73, 0x3f7d83], [0x2c4148, 0x275b62], [0x8ef77b, 0xa7f08b],
  [0xa8c499, 0xb9d8bc], [0xff9e9e, 0xffbca4], [0xfff6e0, 0xfffaec],
  [0x140707, 0x1b1015], [0x4d0e0e, 0x6f2a2d], [0xffaa33, 0xffb45a],
  [0xd8cca8, 0xefe0b6], [0xcf9527, 0xf0b95a], [0xd4af37, 0xffc857],
  [0x7f9f5a, 0x83b56b], [0x1e241c, 0x214f4a], [0x21180e, 0x4f3520],
  [0x172318, 0x174a43], [0x0c120d, 0x0f2e30], [0x0b0f0b, 0x103236],
  [0x080c08, 0x0a2427], [0x12100d, 0x132f32], [0x3e2a18, 0x6e4527],
  [0x7a6832, 0xb89a4c], [0x8a2020, 0xad3a3a], [0xd43b3b, 0xff7a63],
  [0x381818, 0x5a3033], [0x6e5252, 0xa68a7e], [0x182418, 0x1d4f4a]
]);

export function applyTropicalUIRemap(ctx, w, h) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const key = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
    const mapped = TROPICAL_UI_REMAP.get(key);
    if (mapped === undefined) continue;
    d[i] = (mapped >> 16) & 0xff;
    d[i + 1] = (mapped >> 8) & 0xff;
    d[i + 2] = mapped & 0xff;
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
  // Pixel-art coherente: sin mipmaps; se evita memoria y mezcla entre niveles.
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  if (repeat > 1) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat, repeat);
  }
  return tex;
}