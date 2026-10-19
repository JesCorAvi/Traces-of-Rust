// Construcción de hojas de torretas y registro de drawers.
// Exports: buildTurretSheets.

import { CONFIG } from '../../config.js';
import { applyCleanSpriteOutlineRect, makeTexture } from '../spritePalette.js';
import { P, drawTurretMount } from './palette.js';
import { drawGunner } from './drawers/gunner.js';
import { drawMortar } from './drawers/mortar.js';
import { drawCryo } from './drawers/cryo.js';
import { drawBarracks } from './drawers/barracks.js';
import { drawSupport } from './drawers/support.js';

const TURRET_DRAWERS = {
  gunner: drawGunner,
  mortar: drawMortar,
  cryo: drawCryo,
  barracks: drawBarracks,
  support: drawSupport
};

const TURRET_ACCENTS = {
  gunner: P.brass,
  mortar: P.rust,
  cryo: P.iceLight,
  barracks: P.moss,
  support: P.moss
};

export function buildTurretSheets() {
  const sheets = {};
  const frameSize = CONFIG.FRAME_SIZE;
  const cols = 8; // 2 estados (idle, disparo) x 4 frames
  const rows = 1;
  const w = cols * frameSize;
  const h = rows * frameSize;

  Object.entries(TURRET_DRAWERS).forEach(([type, drawFn]) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = w;
    glowCanvas.height = h;
    const gCtx = glowCanvas.getContext('2d');

    const accent = TURRET_ACCENTS[type];

    for (let state = 0; state < 2; state++) {
      for (let frame = 0; frame < 4; frame++) {
        const col = state * 4 + frame;
        const ox = col * frameSize;
        ctx.save();
        gCtx.save();
        ctx.translate(ox, 0);
        gCtx.translate(ox, 0);
        drawTurretMount(ctx, gCtx, accent);
        drawFn(ctx, gCtx, state === 1, frame, accent);
        ctx.restore();
        gCtx.restore();
      }
    }

    applyCleanSpriteOutlineRect(ctx, w, h);

    sheets[`turret_${type}`] = {
      name: `turret_${type}_2x4`,
      numDirs: 1,
      cols,
      rows,
      canvas,
      tex: makeTexture(canvas),
      glowTex: makeTexture(glowCanvas)
    };
  });

  return sheets;
}
