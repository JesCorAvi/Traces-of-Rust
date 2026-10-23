// Atlas maestro 512x512 de UI: paneles, slots, iconos, barras, badges y cursores.
// Exports: buildMasterUIAtlas.

import { CONFIG } from '../config.js';
import { drawPanels } from './ui/panels.js';
import { drawBars } from './ui/bars.js';
import { drawBadges } from './ui/badges.js';
import { drawCursors } from './ui/cursors.js';
import { drawUIIcon16 } from './ui/icons/index.js';

export function buildMasterUIAtlas() {
  const UI = CONFIG.UI_SPRITES;
  const canvas = document.createElement('canvas');
  canvas.width = UI.ATLAS_W;
  canvas.height = UI.ATLAS_H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  drawPanels(ctx, UI);
  drawBars(ctx, UI);

  Object.entries(UI.ICONS).forEach(([key, pos]) => {
    const ix = pos.col * UI.ICON_SIZE;
    const iy = UI.ICONS_ORIGIN_Y + pos.row * UI.ICON_SIZE;
    drawUIIcon16(ctx, key, ix, iy);
  });

  drawBadges(ctx, UI);
  drawCursors(ctx, UI);

  return {
    name: 'ui_master_atlas',
    canvas
  };
}
