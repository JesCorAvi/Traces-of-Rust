// Drawer procedural de la torreta support.
// Exports: drawSupport.

import { P, px } from '../palette.js';

export function drawSupport(ctx, gCtx, firing, frame, accent) {
  const bob = !firing && frame % 2 === 1 ? 1 : 0;
  const y = 26 + bob;
  const pulse = firing ? 3 + frame : 2;

  // Base de mantenimiento
  px(ctx, 16, y + 16, 32, 14, P.black);
  px(ctx, 18, y + 17, 28, 10, P.greenDark);
  px(ctx, 20, y + 19, 24, 3, P.moss);
  px(ctx, 20, y + 24, 24, 2, P.steelDark);

  // Columna y brazo
  px(ctx, 28, y + 2, 8, 16, P.black);
  px(ctx, 30, y + 3, 4, 13, P.steel);
  px(ctx, 24, y + 8, 6, 3, P.steelDark);
  px(ctx, 34, y + 10, 8, 3, P.steelDark);
  px(ctx, 40, y + 9, 4, 5, P.brass);

  // Cruz / emblema
  px(ctx, 24, y + 19, 16, 4, P.black);
  px(ctx, 25, y + 20, 14, 2, accent);
  px(ctx, 29, y + 15, 6, 12, P.black);
  px(ctx, 30, y + 16, 4, 10, accent);
  gCtx.fillStyle = accent;
  gCtx.fillRect(25, y + 20, 14, 2);
  gCtx.fillRect(30, y + 16, 4, 10);

  if (firing) {
    // Pulso de reparación
    px(ctx, 22 - pulse, y + 12, 3, 12, P.moss);
    px(ctx, 39 + pulse, y + 12, 3, 12, P.moss);
    px(ctx, 26, y - pulse, 12, 2, P.moss);
    gCtx.fillStyle = P.moss;
    gCtx.fillRect(23 - pulse, y + 13, 2, 10);
    gCtx.fillRect(40 + pulse, y + 13, 2, 10);
    gCtx.fillRect(27, y - pulse - 1, 10, 2);
  }
}
