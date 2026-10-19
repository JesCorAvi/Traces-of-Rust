// Drawer procedural de la torreta barracks.
// Exports: drawBarracks.

import { P, px } from '../palette.js';

export function drawBarracks(ctx, gCtx, firing, frame, accent) {
  const bob = !firing && frame % 2 === 1 ? 1 : 0;
  const y = 28 + bob;

  // Búnker
  px(ctx, 14, y + 6, 36, 22, P.black);
  px(ctx, 16, y + 7, 32, 18, P.greenDark);
  px(ctx, 18, y + 9, 28, 6, P.rustDark);
  px(ctx, 18, y + 16, 28, 7, P.green);
  px(ctx, 16, y + 23, 32, 4, P.steelDark);

  // Escotilla
  const hatch = firing ? 8 : 4;
  px(ctx, 23, y + 12 - hatch, 18, hatch + 4, P.black);
  px(ctx, 24, y + 13 - hatch, 16, hatch + 2, P.ink);

  // Bandera
  px(ctx, 46, y - 6, 2, 20, P.steelDark);
  px(ctx, 48, y - 5, 10, 6, P.blood);
  px(ctx, 48, y - 5, 10, 1, P.rust);
  px(ctx, 50, y - 3, 5, 2, P.brass);

  // Ojos de la escotilla
  px(ctx, 27, y + 19, 4, 3, accent);
  px(ctx, 34, y + 19, 4, 3, accent);
  gCtx.fillStyle = accent;
  gCtx.fillRect(27, y + 19, 4, 3);
  gCtx.fillRect(34, y + 19, 4, 3);

  if (firing) {
    // Guardia emergiendo
    px(ctx, 29, y + 2, 8, 8, P.black);
    px(ctx, 30, y + 3, 6, 5, P.steel);
    px(ctx, 31, y + 4, 4, 2, P.blood);
    px(ctx, 31, y + 8, 4, 4, P.greenMid);
    gCtx.fillStyle = P.bone;
    gCtx.fillRect(31, y + 4, 4, 1);
  }
}
