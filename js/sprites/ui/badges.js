// Badges de nivel del atlas de UI.
// Exports: drawBadges.

import { drawBitmapString } from './font.js';

export function drawBadges(ctx, UI) {
  for (let lvl = 0; lvl <= 8; lvl++) {
    const bx = lvl * UI.BADGE_W;
    const by = UI.BADGES_ORIGIN_Y;
    ctx.save();
    ctx.translate(bx, by);
    ctx.fillStyle = '#050605';
    ctx.fillRect(0, 0, UI.BADGE_W, UI.BADGE_H);
    ctx.fillStyle = lvl === 8 ? '#6e1414' : (lvl === 0 ? '#121812' : '#1b2619');
    ctx.fillRect(1, 1, UI.BADGE_W - 2, UI.BADGE_H - 2);
    ctx.fillStyle = lvl === 8 ? '#e6d7a5' : (lvl === 0 ? '#364832' : '#b89c46');
    ctx.fillRect(1, 1, UI.BADGE_W - 2, 1);
    ctx.fillRect(1, UI.BADGE_H - 2, UI.BADGE_W - 2, 1);

    const label = lvl === 0 ? '--' : `+${lvl}`;
    const textCol = lvl === 0 ? '#877a5c' : '#e6d7a5';
    drawBitmapString(ctx, label, 6, 3, textCol, '#050605');
    ctx.restore();
  }
}
