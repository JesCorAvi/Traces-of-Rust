// Drawer procedural de la torreta mortar.
// Exports: drawMortar.

import { P, px } from '../palette.js';

export function drawMortar(ctx, gCtx, firing, frame, accent) {
  const recoil = firing && frame === 0 ? 3 : 0;
  const bob = !firing && frame % 2 === 1 ? 1 : 0;
  const y = 24 + bob - recoil;

  // Cureña
  px(ctx, 16, y + 22, 30, 10, P.black);
  px(ctx, 18, y + 23, 26, 7, P.rustDark);
  px(ctx, 21, y + 25, 20, 3, P.steelDark);

  // Tubo inclinado
  px(ctx, 21, y + 10, 12, 16, P.black);
  px(ctx, 23, y + 9, 10, 16, P.greenDark);
  px(ctx, 25, y + 8, 8, 6, P.steel);
  px(ctx, 26, y + 4, 6, 6, P.black);
  px(ctx, 27, y + 5, 4, 4, P.dark);
  px(ctx, 32, y + 12, 8, 5, P.rust);
  px(ctx, 38, y + 11, 6, 4, P.steelDark);

  // Banda de refuerzo
  px(ctx, 19, y + 16, 16, 3, P.steelDark);
  px(ctx, 22, y + 17, 10, 1, P.brass);
  px(ctx, 28, y + 20, 5, 2, accent);
  gCtx.fillStyle = accent;
  gCtx.fillRect(28, y + 20, 5, 2);

  if (firing) {
    // Humo y destello en la boca
    px(ctx, 25, y - 2, 8, 6, P.bone);
    px(ctx, 23, y - 5, 12, 4, P.steel);
    px(ctx, 27, y - 8, 5, 4, P.steelDark);
    gCtx.fillStyle = P.bone;
    gCtx.fillRect(26, y - 3, 6, 4);
    gCtx.fillStyle = P.brass;
    gCtx.fillRect(24, y - 6, 9, 2);
  }
}
