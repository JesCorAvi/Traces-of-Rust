// Drawer procedural de la torreta cryo.
// Exports: drawCryo.

import { P, px } from '../palette.js';

export function drawCryo(ctx, gCtx, firing, frame, accent) {
  const bob = !firing && frame % 2 === 1 ? 1 : 0;
  const y = 25 + bob;
  const pulse = firing ? (frame + 1) * 2 : 2;

  // Cuerpo cilíndrico
  px(ctx, 18, y + 10, 26, 20, P.black);
  px(ctx, 20, y + 11, 22, 16, P.iceDark);
  px(ctx, 22, y + 12, 16, 4, P.ice);
  px(ctx, 22, y + 18, 16, 3, P.iceMid);
  px(ctx, 22, y + 23, 16, 2, P.greenDark);

  // Bobinas laterales
  px(ctx, 14, y + 14, 5, 12, P.steelDark);
  px(ctx, 44, y + 14, 5, 12, P.steelDark);
  px(ctx, 15, y + 16, 3, 3, accent);
  px(ctx, 45, y + 16, 3, 3, accent);
  gCtx.fillStyle = accent;
  gCtx.fillRect(15, y + 16, 3, 3);
  gCtx.fillRect(45, y + 16, 3, 3);

  // Emisor frontal
  px(ctx, 24, y + 5, 16, 8, P.black);
  px(ctx, 26, y + 6, 12, 5, P.ice);
  px(ctx, 28, y + 7, 8, 3, P.iceLight);
  gCtx.fillStyle = accent;
  gCtx.fillRect(27, y + 7, 10, 3);

  if (firing) {
    // Anillo de escarcha
    px(ctx, 10 - pulse, y + 12, 4, 10, P.iceLight);
    px(ctx, 50 + pulse, y + 12, 4, 10, P.iceLight);
    px(ctx, 24, y - 2, 16, 3, P.iceMid);
    gCtx.fillStyle = P.iceLight;
    gCtx.fillRect(11 - pulse, y + 13, 2, 8);
    gCtx.fillRect(51 + pulse, y + 13, 2, 8);
    gCtx.fillRect(25, y - 1, 14, 2);
  }
}
