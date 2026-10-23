// Hojas procedurales de pickups tropicales: coco, concha, nevera y madera.
// Exports: buildPickupSheets.

import { applyCleanSpriteOutlineRect, makeTexture } from '../spritePalette.js';

export function buildPickupSheets() {
  // Coco con pajita: sustituye al suero de la vieja planta.
  const serumCan = document.createElement('canvas');
  serumCan.width = 256; serumCan.height = 64;
  const sCtx = serumCan.getContext('2d', { willReadFrequently: true });

  for (let f = 0; f < 4; f++) {
    sCtx.save();
    sCtx.translate(f * 64, 0);
    const px = (x, y, w, h, c) => { sCtx.fillStyle = c; sCtx.fillRect(x, y, w, h); };
    const bob = f % 2 === 0 ? 0 : 1;

    px(30, 5 + bob, 3, 13, '#f4e1b7');
    px(33, 4 + bob, 6, 3, '#fff4d2');
    px(31, 8 + bob, 2, 2, '#ff9a6f');

    px(20, 18 + bob, 25, 30, '#4a2b1d');
    px(22, 19 + bob, 21, 27, '#6b432b');
    px(24, 21 + bob, 17, 23, '#8f5d38');
    px(25, 23 + bob, 15, 5, '#b97c4c');
    px(23, 26 + bob, 19, 2, '#3b2116');
    px(26, 29 + bob, 4, 4, '#3b2116');
    px(34, 32 + bob, 3, 3, '#3b2116');
    px(29, 35 + bob, 8, 2, '#3b2116');

    // Agua de coco luminosa en la abertura.
    px(25, 20 + bob, 15, 4, '#63e1c3');
    px(27, 20 + bob, 11, 2, '#c7ffdf');
    for (let b = 0; b < 3; b++) {
      px(26 + b * 5, 16 + bob + (b % 2), 2, 2, '#d7fffa');
    }
    px(22, 46 + bob, 21, 3, '#3b2116');
    px(24, 49 + bob, 17, 2, '#6b432b');
    sxFixGlow(sCtx, f, bob);
    sCtx.restore();
  }
  applyCleanSpriteOutlineRect(sCtx, 256, 64);

  // Concha: moneda de recuerdo del equipo.
  const toothCan = document.createElement('canvas');
  toothCan.width = 256; toothCan.height = 64;
  const tCtx = toothCan.getContext('2d', { willReadFrequently: true });

  for (let f = 0; f < 4; f++) {
    tCtx.save();
    tCtx.translate(f * 64, 0);
    const px = (x, y, w, h, c) => { tCtx.fillStyle = c; tCtx.fillRect(x, y, w, h); };
    const bob = f % 2 === 0 ? 0 : 1;
    const glow = (x, y, w, h, c) => { px(x, y, w, h, c); };

    // Valvas de vieira.
    px(24, 10 + bob, 5, 5, '#d9a66a');
    px(35, 10 + bob, 5, 5, '#d9a66a');
    px(20, 15 + bob, 24, 25, '#8f4f38');
    px(22, 16 + bob, 20, 22, '#e7b978');
    px(24, 18 + bob, 16, 18, '#fff0c7');
    px(28, 19 + bob, 2, 20, '#d9a66a');
    px(33, 19 + bob, 2, 20, '#d9a66a');
    px(24, 24 + bob, 17, 2, '#d9a66a');
    px(26, 30 + bob, 13, 2, '#c9925e');
    px(26, 38 + bob, 12, 3, '#7a3f31');
    px(28, 42 + bob, 8, 3, '#573027');
    glow(28, 12 + bob, 3, 3, '#fff7d1');
    glow(38, 22 + bob, 2, 2, '#ffe09b');
    if (f % 2 === 0) {
      px(45, 16 + bob, 2, 2, '#fff0c7');
      px(48, 24 + bob, 1, 1, '#ffe9b9');
    }
    tCtx.restore();
  }
  applyCleanSpriteOutlineRect(tCtx, 256, 64);

  // Nevera de playa que se abre al recogerla.
  const chestCan = document.createElement('canvas');
  chestCan.width = 256; chestCan.height = 64;
  const cCtx = chestCan.getContext('2d', { willReadFrequently: true });

  for (let f = 0; f < 4; f++) {
    cCtx.save();
    cCtx.translate(f * 64, 0);
    const px = (x, y, w, h, c) => { cCtx.fillStyle = c; cCtx.fillRect(x, y, w, h); };
    const lidLift = f === 1 || f === 2 ? 4 : 0;

    px(25, 11 - lidLift, 14, 4, '#27545b');
    px(27, 12 - lidLift, 10, 2, '#6fd1dd');

    px(10, 17, 44, 36, '#173d44');
    px(12, 19, 40, 32, '#2c7479');
    px(14, 21, 36, 10, '#e8f7e7');
    if (f === 1 || f === 2) {
      // Interior fresco con latas, fruta y hielo.
      px(17, 22, 30, 8, '#0f2c35');
      for (let i = 0; i < 5; i++) {
        px(18 + i * 6, 23, 4, 5, i % 2 ? '#ff8a68' : '#ffd06b');
        px(19 + i * 6, 22, 2, 1, '#fff0c7');
      }
    } else {
      px(17, 21, 30, 8, '#f4d8a0');
      px(20, 23, 24, 4, '#c9925e');
    }

    // Cierre, asa y patas.
    px(10, 31, 44, 3, '#102f36');
    px(28, 33, 8, 4, '#c8d4c0');
    px(12, 36, 40, 3, '#1d5960');
    px(14, 45, 6, 5, '#e8f7e7');
    px(44, 45, 6, 5, '#e8f7e7');
    px(12, 49, 40, 4, '#10343a');
    px(28, 7 - lidLift, 8, 4, '#6fd1dd');

    // Brillo de nevera.
    px(14, 21, 3, 8, '#fffbe3');
    px(48, 21, 2, 12, '#6fd1dd');
    cCtx.restore();
  }
  applyCleanSpriteOutlineRect(cCtx, 256, 64);

  // Madera de construcción: tablones que giran y sueltan virutas.
  const scrapCan = document.createElement('canvas');
  scrapCan.width = 256; scrapCan.height = 64;
  const scCtx = scrapCan.getContext('2d', { willReadFrequently: true });

  for (let f = 0; f < 4; f++) {
    scCtx.save();
    scCtx.translate(f * 64, 0);
    const px = (x, y, w, h, c) => { scCtx.fillStyle = c; scCtx.fillRect(x, y, w, h); };
    const tilt = f % 2 === 0 ? 0 : 1;

    // Tablón principal.
    px(8, 22 + tilt, 48, 16, '#4a2a1a');
    px(10, 23 + tilt, 44, 11, '#a5683c');
    px(10, 23 + tilt, 44, 3, '#d6955d');
    px(10, 31 + tilt, 44, 3, '#704027');
    px(15, 26 + tilt, 2, 4, '#3b2116');
    px(31, 26 + tilt, 2, 4, '#3b2116');
    px(46, 26 + tilt, 2, 4, '#3b2116');
    px(6, 24 + tilt, 3, 12, '#3b2116');
    px(55, 24 + tilt, 3, 12, '#3b2116');

    // Tronco transversal.
    px(24, 14 + tilt, 16, 14, '#6b432b');
    px(26, 15 + tilt, 12, 11, '#8f5d38');
    px(26, 15 + tilt, 12, 2, '#c48c56');
    px(32, 14 + tilt, 2, 12, '#4a2a1a');

    // Virutas y hojas.
    px(14, 44 + tilt, 3, 2, '#d6955d');
    px(44, 42 + tilt, 2, 2, '#e7b978');
    px(9, 48 + tilt, 2, 2, '#70a84b');
    scCtx.restore();
  }
  applyCleanSpriteOutlineRect(scCtx, 256, 64);

  return {
    serum: { name: 'pickup_coconut_4f', canvas: serumCan, tex: makeTexture(serumCan) },
    tooth: { name: 'pickup_shell_4f', canvas: toothCan, tex: makeTexture(toothCan) },
    chest: { name: 'pickup_cooler_4f', canvas: chestCan, tex: makeTexture(chestCan) },
    scrap:  { name: 'pickup_wood_4f', canvas: scrapCan, tex: makeTexture(scrapCan) }
  };
}

function sxFixGlow(ctx, frame, bob) {
  // Pequeños destellos del coco en el canvas principal (el glow se pinta aparte
  // con el atlas de billboard; aquí basta con acentos brillantes).
  ctx.fillStyle = '#d7fffa';
  ctx.fillRect(27 + frame, 17 + bob, 2, 2);
  ctx.fillRect(39, 22 + bob + (frame % 2), 2, 2);
}
