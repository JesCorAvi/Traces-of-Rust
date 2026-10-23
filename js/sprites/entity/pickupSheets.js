// Hojas procedurales de pickups (suero, diente, cofre y chatarra).
// Exports: buildPickupSheets.

import { applyCleanSpriteOutlineRect, makeTexture } from '../spritePalette.js';

export function buildPickupSheets() {
  const serumCan = document.createElement('canvas');
  serumCan.width = 256; serumCan.height = 64;
  const sCtx = serumCan.getContext('2d', { willReadFrequently: true });

  for (let f = 0; f < 4; f++) {
    sCtx.save();
    sCtx.translate(f * 64, 0);
    const px = (x, y, w, h, c) => { sCtx.fillStyle = c; sCtx.fillRect(x, y, w, h); };

    px(31, 6, 2, 8, '#c8c2ac');
    px(31, 4, 2, 3, '#e6d7a5');
    px(26, 13, 12, 4, '#877a5c');
    px(24, 17, 16, 4, '#4a2518');
    px(25, 18, 14, 2, '#b89c46');

    px(21, 21, 22, 30, '#182018');
    px(22, 22, 20, 28, '#243022');

    const wave = (f % 2 === 0) ? 1 : -1;
    px(23, 27 + wave, 18, 22 - wave, '#6e1414');
    px(24, 28 + wave, 16, 20 - wave, '#a52020');
    px(24, 27 + wave, 16, 3, '#b89c46');

    const b1Y = 44 - f * 4;
    const b2Y = 40 - ((f + 2) % 4) * 4;
    px(27, b1Y, 3, 3, '#e6d7a5');
    px(34, b2Y, 2, 2, '#b89c46');

    px(24, 23, 2, 24, '#e6d7a5');
    for (let m = 0; m < 4; m++) {
      px(37, 25 + m * 6, 3, 1, '#c8c2ac');
    }

    px(24, 51, 16, 4, '#4a2518');
    px(26, 52, 12, 2, '#877a5c');
    if (f === 1 || f === 2) {
      px(31, 56 + f, 2, 3, '#a52020');
    }
    sCtx.restore();
  }
  applyCleanSpriteOutlineRect(sCtx, 256, 64);

  const toothCan = document.createElement('canvas');
  toothCan.width = 256; toothCan.height = 64;
  const tCtx = toothCan.getContext('2d', { willReadFrequently: true });

  for (let f = 0; f < 4; f++) {
    tCtx.save();
    tCtx.translate(f * 64, 0);
    const px = (x, y, w, h, c) => { tCtx.fillStyle = c; tCtx.fillRect(x, y, w, h); };

    px(19, 13, 11, 6, '#e6d7a5');
    px(34, 13, 11, 6, '#e6d7a5');
    px(18, 17, 28, 16, '#c8c2ac');
    px(20, 15, 24, 14, '#e6d7a5');

    px(29, 16, 2, 8, '#4a2518');
    px(33, 16, 9, 7, '#b89c46');
    if (f % 2 === 0) {
      px(35, 17, 5, 4, '#e6d7a5');
    }

    px(20, 31, 24, 5, '#b89c46');
    px(21, 34, 22, 3, '#743718');

    px(20, 36, 9, 16, '#c8c2ac');
    px(22, 36, 6, 14, '#877a5c');
    px(35, 36, 9, 16, '#c8c2ac');
    px(36, 36, 6, 14, '#877a5c');

    px(21, 46, 7, 8, '#a52020');
    px(22, 52, 4, 4, '#6e1414');
    px(36, 45, 7, 9, '#a52020');
    px(38, 52, 4, 4, '#6e1414');

    const dropY = 54 + f * 2;
    px(24, dropY, 3, 3, '#a52020');
    tCtx.restore();
  }
  applyCleanSpriteOutlineRect(tCtx, 256, 64);

  const chestCan = document.createElement('canvas');
  chestCan.width = 256; chestCan.height = 64;
  const cCtx = chestCan.getContext('2d', { willReadFrequently: true });

  for (let f = 0; f < 4; f++) {
    cCtx.save();
    cCtx.translate(f * 64, 0);
    const px = (x, y, w, h, c) => { cCtx.fillStyle = c; cCtx.fillRect(x, y, w, h); };

    px(25, 11, 14, 6, '#4a2518');
    px(27, 13, 10, 4, '#050605');

    px(10, 17, 44, 36, '#243022');
    px(12, 19, 40, 32, '#364832');

    px(10, 17, 7, 7, '#b89c46');
    px(47, 17, 7, 7, '#b89c46');
    px(10, 46, 7, 7, '#b89c46');
    px(47, 46, 7, 7, '#b89c46');

    px(18, 17, 5, 36, '#4a2518');
    px(41, 17, 5, 36, '#4a2518');
    px(17, 31, 7, 6, '#b89c46');
    px(40, 31, 7, 6, '#b89c46');

    px(25, 25, 14, 18, '#121812');
    const crossCol = f % 2 === 0 ? '#a52020' : '#e6d7a5';
    px(30, 27, 4, 14, crossCol);
    px(27, 32, 10, 4, crossCol);

    px(12, 34, 40, 2, '#050605');
    px(26, 36, 12, 3, '#6e1414');
    px(29, 38, 4, 6, '#a52020');
    cCtx.restore();
  }
  applyCleanSpriteOutlineRect(cCtx, 256, 64);

  // Chatarra: engranaje roto que gira y suelta chispas
  const scrapCan = document.createElement('canvas');
  scrapCan.width = 256; scrapCan.height = 64;
  const scCtx = scrapCan.getContext('2d', { willReadFrequently: true });

  for (let f = 0; f < 4; f++) {
    scCtx.save();
    scCtx.translate(f * 64, 0);
    const px = (x, y, w, h, c) => { scCtx.fillStyle = c; scCtx.fillRect(x, y, w, h); };

    const cx = 32, cy = 30;
    const angle = (f / 4) * Math.PI * 2;
    const teeth = 8;
    for (let t = 0; t < teeth; t++) {
      const a = angle + (t / teeth) * Math.PI * 2;
      const tx = Math.round(cx + Math.cos(a) * 19);
      const ty = Math.round(cy + Math.sin(a) * 19);
      px(tx - 3, ty - 3, 7, 7, '#050605');
      px(tx - 2, ty - 2, 5, 5, '#877a5c');
      px(tx - 1, ty - 1, 3, 3, '#b89c46');
    }

    px(cx - 15, cy - 15, 31, 31, '#050605');
    px(cx - 13, cy - 13, 27, 27, '#364832');
    px(cx - 11, cy - 11, 23, 23, '#243022');
    px(cx - 8, cy - 8, 17, 17, '#4a2518');
    px(cx - 5, cy - 5, 11, 11, '#875a30');
    px(cx - 2, cy - 2, 5, 5, '#b89c46');

    // Grietas y desgaste
    px(cx - 12, cy + 8, 6, 2, '#050605');
    px(cx + 7, cy - 11, 2, 5, '#050605');
    px(cx + 9, cy + 9, 3, 3, '#a52020');

    // Chispas según frame
    if (f % 2 === 0) {
      px(48, 12, 2, 2, '#e6d7a5');
      px(53, 18, 2, 2, '#b89c46');
    } else {
      px(12, 17, 2, 2, '#b89c46');
      px(9, 24, 2, 2, '#e6d7a5');
    }

    scCtx.restore();
  }
  applyCleanSpriteOutlineRect(scCtx, 256, 64);

  return {
    serum: { name: 'pickup_serum_4f', canvas: serumCan, tex: makeTexture(serumCan) },
    tooth: { name: 'pickup_tooth_4f', canvas: toothCan, tex: makeTexture(toothCan) },
    chest: { name: 'pickup_chest_4f', canvas: chestCan, tex: makeTexture(chestCan) },
    scrap:  { name: 'pickup_scrap_4f', canvas: scrapCan, tex: makeTexture(scrapCan) }
  };
}
