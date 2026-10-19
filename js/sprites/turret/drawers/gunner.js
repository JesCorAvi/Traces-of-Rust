// Drawer procedural de la torreta gunner.
// Exports: drawGunner.

import { P, px } from '../palette.js';

export function drawGunner(ctx, gCtx, firing, frame, accent) {
  const recoil = firing && frame < 2 ? -4 : 0;
  const bob = !firing && frame % 2 === 1 ? 1 : 0;
  const y = 26 + bob + recoil;

  // Cuerpo del arma
  px(ctx, 16, y + 8, 26, 16, P.black);
  px(ctx, 18, y + 10, 22, 12, P.greenDark);
  px(ctx, 20, y + 12, 10, 8, P.rustDark);
  px(ctx, 22, y + 14, 5, 4, P.steelDark);

  // Cañón
  px(ctx, 40, y + 11, 16, 5, P.black);
  px(ctx, 41, y + 12, 15, 3, P.steel);
  px(ctx, 41, y + 12, 15, 1, P.steelLight);
  px(ctx, 49, y + 13, 7, 1, P.rust);

  // Cargador y correa
  px(ctx, 24, y + 22, 7, 7, P.black);
  px(ctx, 25, y + 23, 5, 5, P.brass);
  px(ctx, 18, y + 18, 5, 2, P.steelDark);

  // Visor
  px(ctx, 27, y + 11, 6, 4, P.black);
  px(ctx, 28, y + 12, 4, 2, accent);
  gCtx.fillStyle = accent;
  gCtx.fillRect(28, y + 12, 4, 2);

  if (firing) {
    // Fogonazo
    const flash = 3 + ((frame + 1) % 3) * 2;
    px(ctx, 56, y + 8, flash, flash, P.bone);
    px(ctx, 54, y + 10, flash + 2, 3, P.brass);
    gCtx.fillStyle = P.bone;
    gCtx.fillRect(54, y + 9, flash + 3, 4);
    gCtx.fillStyle = P.brass;
    gCtx.fillRect(52, y + 10, 5, 2);
  }
}
