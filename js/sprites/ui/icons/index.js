// Registro de drawers de iconos y dibujo de una celda 16x16 con contorno.
// Exports: drawUIIcon16.

import { applyIcon16Outline } from '../../spritePalette.js';
import { WEAPON_ICONS } from './weapons.js';
import { PASSIVE_ICONS } from './passives.js';
import { TURRET_ICONS } from './turrets.js';
import { SYSTEM_ICONS } from './system.js';

const ICON_DRAWERS = { ...WEAPON_ICONS, ...PASSIVE_ICONS, ...TURRET_ICONS, ...SYSTEM_ICONS };
const SKIP_OUTLINE = ['crack_1', 'crack_2', 'stain_blood', 'stain_rust', 'wire_clamp'];

export function drawUIIcon16(ctx, key, ox, oy) {
  ctx.save();
  ctx.translate(ox, oy);

  const px = (x, y, w, h, col) => {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, w, h);
  };

  const draw = ICON_DRAWERS[key];
  if (draw) draw(px);

  ctx.restore();

  if (!SKIP_OUTLINE.includes(key)) {
    applyIcon16Outline(ctx, ox, oy);
  }
}
