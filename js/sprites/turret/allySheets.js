// Hojas de tropas aliadas (4 direcciones x 3 estados x 4 frames).
// Exports: buildAllyDirectionalSheets.

import { CONFIG } from '../../config.js';
import { applyCleanSpriteOutlineRect, makeTexture } from '../spritePalette.js';
import { P, px } from './palette.js';

function drawAlly(ctx, gCtx, type, dir, state, frame) {
  const walk = state === 1;
  const attack = state === 2;
  const phase = (frame / 4) * Math.PI * 2;
  const bob = walk ? Math.round(Math.sin(phase) * 1.5) : (attack ? -1 : 0);
  const stride = walk ? Math.round(Math.sin(phase) * 2.5) : 0;
  const isLeft = dir === 3;
  const isBack = dir === 0;

  ctx.save();
  gCtx.save();
  if (isLeft) {
    ctx.translate(64, 0);
    ctx.scale(-1, 1);
    gCtx.translate(64, 0);
    gCtx.scale(-1, 1);
  }

  ctx.translate(0, bob);
  gCtx.translate(0, bob);

  const armor = type === 'elite' ? P.steelDark : P.rustDark;
  const body = type === 'elite' ? P.steel : P.greenMid;
  const eye = type === 'drone' ? P.iceLight : (type === 'elite' ? P.brass : P.bone);

  if (type === 'drone') {
    const hover = Math.round(Math.sin(phase) * 2);
    ctx.translate(0, hover);
    gCtx.translate(0, hover);

    // Chasis flotante
    px(ctx, 22, 24, 20, 16, P.black);
    px(ctx, 24, 25, 16, 13, P.iceDark);
    px(ctx, 26, 27, 12, 6, P.ice);
    px(ctx, 28, 29, 8, 2, P.iceLight);
    px(ctx, 18, 28, 5, 3, P.steelDark);
    px(ctx, 41, 28, 5, 3, P.steelDark);
    px(ctx, 25, 38, 14, 3, P.steelDark);

    // Rotores
    px(ctx, 20, 18, 24, 3, P.black);
    px(ctx, 23, 17, 18, 2, P.steel);
    px(ctx, attack ? 44 : 36, 29, attack ? 8 : 4, 3, P.black);
    if (attack) px(ctx, 50, 29, 5, 2, P.bone);

    px(ctx, 29, 28, 6, 3, P.black);
    px(ctx, 30, 29, 4, 1, eye);
    gCtx.fillStyle = eye;
    gCtx.fillRect(30, 29, 4, 1);
    if (attack) {
      gCtx.fillStyle = P.bone;
      gCtx.fillRect(50, 28, 5, 3);
    }
    ctx.restore();
    gCtx.restore();
    return;
  }

  // Piernas
  px(ctx, 25 + stride, 44, 5, 10, P.black);
  px(ctx, 26 + stride, 44, 3, 8, armor);
  px(ctx, 34 - stride, 44, 5, 10, P.black);
  px(ctx, 35 - stride, 44, 3, 8, armor);
  px(ctx, 25 + stride, 53, 6, 3, P.dark);
  px(ctx, 34 - stride, 53, 6, 3, P.dark);

  // Torso
  px(ctx, 23, 28, 18, 18, P.black);
  px(ctx, 25, 29, 14, 16, body);
  px(ctx, 27, 31, 10, 5, armor);
  px(ctx, 27, 37, 10, 2, P.steelDark);

  if (type === 'elite') {
    px(ctx, 22, 29, 3, 12, P.black);
    px(ctx, 39, 29, 3, 12, P.black);
    px(ctx, 24, 30, 2, 10, P.brass);
    px(ctx, 38, 30, 2, 10, P.brass);
  }

  // Cabeza
  px(ctx, 25, 18, 14, 12, P.black);
  px(ctx, 26, 19, 12, 10, armor);
  px(ctx, 27, 21, 10, 4, P.dark);

  if (!isBack) {
    px(ctx, 28, 22, 3, 2, eye);
    px(ctx, 34, 22, 3, 2, eye);
    gCtx.fillStyle = eye;
    gCtx.fillRect(28, 22, 3, 2);
    gCtx.fillRect(34, 22, 3, 2);
    px(ctx, 29, 26, 6, 2, P.blood);
  }

  // Brazo y arma
  const swing = attack ? (frame < 2 ? -4 : 3) : (walk ? Math.round(Math.sin(phase) * 2) : 0);
  px(ctx, 18, 30 + swing, 6, 10, armor);
  px(ctx, 17, 38 + swing, 8, 4, P.black);
  px(ctx, 39, 29 - swing, 5, 9, body);

  if (type === 'elite') {
    // Martillo pesado
    px(ctx, 44, 22 - swing, 3, 18, P.steelDark);
    px(ctx, 42, 20 - swing, 7, 6, P.black);
    px(ctx, 43, 21 - swing, 5, 4, P.steel);
    if (attack) {
      px(ctx, 42, 14 - swing, 8, 5, P.bone);
      gCtx.fillStyle = P.brass;
      gCtx.fillRect(43, 15 - swing, 6, 3);
    }
  } else {
    // Machete oxidado
    const bladeY = attack ? 14 : 24;
    px(ctx, 45, bladeY - swing, 2, 16, P.black);
    px(ctx, 46, bladeY - swing, 2, 14, P.steel);
    px(ctx, 46, bladeY - swing, 1, 6, P.blood);
    px(ctx, 44, bladeY + 14 - swing, 5, 3, P.rustDark);
  }

  ctx.restore();
  gCtx.restore();
}

export function buildAllyDirectionalSheets() {
  const sheets = {};
  const types = ['guard', 'elite', 'drone'];
  const frameSize = CONFIG.FRAME_SIZE;
  const cols = 12; // 3 estados x 4 frames
  const rows = 4;  // 4 direcciones
  const w = cols * frameSize;
  const h = rows * frameSize;

  types.forEach(type => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = w;
    glowCanvas.height = h;
    const gCtx = glowCanvas.getContext('2d');

    for (let dir = 0; dir < rows; dir++) {
      for (let state = 0; state < 3; state++) {
        for (let frame = 0; frame < 4; frame++) {
          const col = state * 4 + frame;
          ctx.save();
          gCtx.save();
          ctx.translate(col * frameSize, dir * frameSize);
          gCtx.translate(col * frameSize, dir * frameSize);
          drawAlly(ctx, gCtx, type, dir, state, frame);
          ctx.restore();
          gCtx.restore();
        }
      }
    }

    applyCleanSpriteOutlineRect(ctx, w, h);

    sheets[`ally_${type}`] = {
      name: `ally_${type}_4dir`,
      numDirs: 4,
      cols,
      rows,
      canvas,
      tex: makeTexture(canvas),
      glowTex: makeTexture(glowCanvas)
    };
  });

  return sheets;
}
