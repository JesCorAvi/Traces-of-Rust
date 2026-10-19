// Atlas maestro 512x512 de UI: paneles, slots, iconos, barras, badges y cursores.
// Exports: buildMasterUIAtlas.
import { CONFIG } from '../config.js';
import { applyIcon16Outline } from './spritePalette.js';

const MINI_FONT_3X5 = {
  '+': [0b000, 0b010, 0b111, 0b010, 0b000],
  '-': [0b000, 0b000, 0b111, 0b000, 0b000],
  '0': [0b111, 0b101, 0b101, 0b101, 0b111],
  '1': [0b010, 0b110, 0b010, 0b010, 0b111],
  '2': [0b111, 0b001, 0b111, 0b100, 0b111],
  '3': [0b111, 0b001, 0b011, 0b001, 0b111],
  '4': [0b101, 0b101, 0b111, 0b001, 0b001],
  '5': [0b111, 0b100, 0b111, 0b001, 0b111],
  '6': [0b111, 0b100, 0b111, 0b101, 0b111],
  '7': [0b111, 0b001, 0b010, 0b010, 0b010],
  '8': [0b111, 0b101, 0b111, 0b101, 0b111],
  '9': [0b111, 0b101, 0b111, 0b001, 0b111],
  'M': [0b101, 0b111, 0b101, 0b101, 0b101],
  'A': [0b010, 0b101, 0b111, 0b101, 0b101],
  'X': [0b101, 0b101, 0b010, 0b101, 0b101]
};

function drawBitmapString(ctx, text, x, y, color, shadowColor = '#050605') {
  let curX = x;
  for (let i = 0; i < text.length; i++) {
    const rows = MINI_FONT_3X5[text[i]];
    if (rows) {
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 3; c++) {
          if ((rows[r] >> (2 - c)) & 1) {
            if (shadowColor) {
              ctx.fillStyle = shadowColor;
              ctx.fillRect(curX + c + 1, y + r + 1, 1, 1);
            }
            ctx.fillStyle = color;
            ctx.fillRect(curX + c, y + r, 1, 1);
          }
        }
      }
    }
    curX += 4;
  }
}

function drawNineSliceBox(ctx, cfg, opts) {
  const { x, y, w, h, slice = 7 } = cfg;
  ctx.save();
  ctx.translate(x, y);

  const px = (rx, ry, rw, rh, col) => {
    ctx.fillStyle = col;
    ctx.fillRect(rx, ry, rw, rh);
  };

  px(0, 0, w, h, '#050605');

  const inset = opts.borderThick || 2;
  px(inset, inset, w - inset * 2, h - inset * 2, opts.bg || '#0d110d');

  if (opts.innerGlow) {
    px(inset + 2, inset + 2, w - (inset + 2) * 2, h - (inset + 2) * 2, opts.innerGlow);
  }

  if (opts.speckle) {
    const cornerZone = Math.max(4, slice - 1);
    for (let py = inset + 1; py < h - inset - 1; py++) {
      for (let pxX = inset + 1; pxX < w - inset - 1; pxX++) {
        const inCornerX = pxX < cornerZone || pxX >= w - cornerZone;
        const inCornerY = py < cornerZone || py >= h - cornerZone;
        if (inCornerX && inCornerY && ((pxX * 19 + py * 37) & 7) === 0) {
          px(pxX, py, 1, 1, opts.speckle);
        }
      }
    }
  }

  const bTop = opts.pressed ? opts.borderDark : opts.borderLight;
  const bBot = opts.pressed ? opts.borderLight : opts.borderDark;

  px(1, 1, w - 2, 1, bTop);
  px(1, 1, 1, h - 2, bTop);
  px(1, h - 2, w - 2, 1, bBot);
  px(w - 2, 1, 1, h - 2, bBot);

  if (opts.doubleRim) {
    px(2, 2, w - 4, 1, opts.rimInner || '#4a2518');
    px(2, h - 3, w - 4, 1, '#050605');
    px(2, 2, 1, h - 4, opts.rimInner || '#4a2518');
    px(w - 3, 2, 1, h - 4, '#050605');
  }

  if (opts.leftStripe) {
    px(2, 2, 3, h - 4, opts.leftStripe);
  }

  if (!opts.cleanCorners) {
    px(3, 1, 1, 1, '#050605');
    px(w - 4, h - 2, 1, 1, '#050605');
  }

  if (opts.cornerRivets) {
    const rCol = opts.rivetColor || '#877a5c';
    const positions = [[3, 3], [w - 5, 3], [3, h - 5], [w - 5, h - 5]];
    positions.forEach(([rx, ry]) => {
      px(rx, ry, 2, 2, '#050605');
      px(rx, ry, 1, 1, rCol);
    });
  }

  if (opts.tornEdges) {
    for (let ty = 2; ty < h - 2; ty += 3) {
      px(0, ty, 2, 1, '#050605');
      px(w - 2, ty + 1, 2, 1, '#050605');
    }
  }

  ctx.restore();
}

function drawUIIcon16(ctx, key, ox, oy) {
  ctx.save();
  ctx.translate(ox, oy);

  const px = (x, y, w, h, col) => {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, w, h);
  };

  switch (key) {
    case 'slash':
      px(2, 11, 4, 3, '#4a2518');
      px(5, 9, 2, 4, '#b89c46');
      for (let i = 0; i < 8; i++) {
        px(6 + i, 9 - i, 3, 2, '#877a5c');
        px(6 + i, 8 - i, 1, 1, '#e6d7a5');
        if (i % 2 === 0) px(8 + i, 10 - i, 1, 2, '#a52020');
      }
      break;
    case 'shotgun':
      px(1, 9, 4, 3, '#4a2518');
      px(5, 8, 4, 3, '#243022');
      px(9, 7, 6, 2, '#c8c2ac');
      px(9, 9, 5, 1, '#877a5c');
      px(10, 10, 3, 2, '#4a2518');
      px(3, 3, 3, 4, '#a52020');
      px(3, 6, 3, 1, '#b89c46');
      break;
    case 'flamethrower':
      px(1, 9, 6, 4, '#4a2518');
      px(4, 8, 5, 2, '#877a5c');
      px(9, 6, 5, 6, '#a52020');
      px(10, 7, 4, 4, '#b89c46');
      px(11, 8, 3, 2, '#e6d7a5');
      px(12, 4, 2, 2, '#b89c46');
      break;
    case 'aura':
      px(4, 3, 8, 10, '#243022');
      px(3, 5, 10, 6, '#243022');
      px(5, 4, 6, 8, '#44563a');
      px(6, 5, 2, 2, '#e6d7a5');
      px(9, 5, 2, 2, '#e6d7a5');
      px(7, 9, 3, 2, '#b89c46');
      px(2, 2, 2, 2, '#44563a');
      px(12, 11, 2, 2, '#44563a');
      break;
    case 'mines':
      px(3, 9, 10, 4, '#243022');
      px(4, 7, 8, 2, '#364832');
      px(2, 12, 12, 2, '#050605');
      px(6, 4, 4, 3, '#a52020');
      px(7, 5, 2, 1, '#e6d7a5');
      px(4, 3, 1, 2, '#b89c46');
      px(11, 3, 1, 2, '#b89c46');
      break;
    case 'harpoon':
      for (let i = 0; i < 11; i++) px(2 + i, 13 - i, 2, 2, '#877a5c');
      px(10, 2, 4, 4, '#e6d7a5');
      px(8, 3, 3, 1, '#b89c46');
      px(12, 5, 1, 3, '#b89c46');
      px(2, 12, 3, 3, '#4a2518');
      break;
    case 'orbital':
      px(7, 1, 2, 3, '#b89c46');
      px(3, 4, 10, 9, '#243022');
      px(5, 5, 6, 6, '#c8c2ac');
      px(6, 7, 1, 2, '#050605');
      px(9, 7, 1, 2, '#050605');
      px(4, 4, 1, 9, '#4a2518');
      px(8, 4, 1, 9, '#4a2518');
      px(11, 4, 1, 9, '#4a2518');
      px(6, 13, 4, 2, '#a52020');
      break;
    case 'bolt':
      px(9, 1, 4, 3, '#e6d7a5');
      px(7, 4, 4, 3, '#b89c46');
      px(5, 7, 6, 2, '#e6d7a5');
      px(7, 9, 4, 3, '#b89c46');
      px(5, 12, 3, 3, '#e6d7a5');
      break;
    case 'multishot':
      [2, 6, 10].forEach((cx, idx) => {
        const cy = idx === 1 ? 2 : 4;
        px(cx, cy, 3, 3, '#e6d7a5');
        px(cx, cy + 3, 3, 6, '#a52020');
        px(cx, cy + 9, 3, 2, '#b89c46');
      });
      break;
    case 'dmg':
      px(3, 3, 10, 10, '#6e1414');
      px(5, 2, 6, 12, '#a52020');
      px(2, 5, 12, 6, '#a52020');
      px(5, 5, 6, 6, '#b89c46');
      px(6, 6, 4, 4, '#e6d7a5');
      break;
    case 'atkSpd':
      px(4, 4, 8, 8, '#877a5c');
      px(6, 2, 4, 12, '#877a5c');
      px(2, 6, 12, 4, '#877a5c');
      px(5, 5, 6, 6, '#4a2518');
      px(6, 6, 4, 4, '#050605');
      px(4, 4, 2, 2, '#b89c46');
      break;
    case 'maxHp':
      px(3, 4, 4, 5, '#a52020');
      px(9, 4, 4, 5, '#6e1414');
      px(4, 8, 8, 4, '#a52020');
      px(6, 12, 4, 2, '#6e1414');
      px(7, 2, 2, 3, '#877a5c');
      px(5, 7, 6, 2, '#b89c46');
      break;
    case 'regen':
      px(4, 2, 8, 10, '#877a5c');
      px(5, 4, 6, 7, '#a52020');
      px(7, 5, 2, 4, '#e6d7a5');
      px(6, 6, 4, 2, '#e6d7a5');
      px(7, 12, 2, 3, '#a52020');
      break;
    case 'moveSpd':
      px(2, 11, 3, 3, '#877a5c');
      px(4, 6, 6, 6, '#c8c2ac');
      px(5, 7, 4, 4, '#44563a');
      px(10, 4, 2, 2, '#877a5c');
      px(12, 2, 2, 2, '#e6d7a5');
      break;
    case 'area':
      px(2, 2, 12, 12, '#182018');
      px(3, 3, 10, 1, '#b89c46');
      px(3, 12, 10, 1, '#b89c46');
      px(3, 3, 1, 10, '#b89c46');
      px(12, 3, 1, 10, '#b89c46');
      px(5, 5, 6, 6, '#6e1414');
      px(7, 7, 2, 2, '#e6d7a5');
      break;
    case 'crit':
      px(2, 6, 12, 4, '#c8c2ac');
      px(4, 4, 8, 8, '#e6d7a5');
      px(6, 5, 4, 6, '#a52020');
      px(7, 7, 2, 2, '#050605');
      px(8, 6, 1, 1, '#e6d7a5');
      break;
    case 'magnet':
      px(3, 3, 3, 9, '#a52020');
      px(10, 3, 3, 9, '#a52020');
      px(3, 10, 10, 3, '#6e1414');
      px(3, 2, 3, 3, '#c8c2ac');
      px(10, 2, 3, 3, '#c8c2ac');
      px(6, 4, 4, 1, '#e6d7a5');
      break;
    case 'heal_pack':
      px(2, 4, 12, 10, '#877a5c');
      px(3, 5, 10, 8, '#182018');
      px(7, 6, 2, 6, '#a52020');
      px(5, 8, 6, 2, '#a52020');
      px(6, 2, 4, 2, '#4a2518');
      break;
    case 'teeth_bag':
      px(4, 5, 8, 9, '#4a2518');
      px(5, 3, 6, 2, '#b89c46');
      px(6, 7, 2, 3, '#e6d7a5');
      px(9, 8, 2, 3, '#e6d7a5');
      break;
    case 'tooth':
      px(4, 2, 3, 3, '#e6d7a5');
      px(9, 2, 3, 3, '#e6d7a5');
      px(4, 4, 8, 5, '#e6d7a5');
      px(5, 5, 6, 3, '#c8c2ac');
      px(4, 9, 3, 4, '#b89c46');
      px(9, 9, 3, 4, '#b89c46');
      px(4, 12, 2, 2, '#a52020');
      px(10, 12, 2, 2, '#a52020');
      break;
    case 'skull':
      px(4, 2, 8, 7, '#c8c2ac');
      px(3, 4, 10, 5, '#e6d7a5');
      px(5, 5, 2, 2, '#050605');
      px(9, 5, 2, 2, '#050605');
      px(7, 8, 2, 2, '#050605');
      px(5, 10, 6, 4, '#877a5c');
      px(6, 11, 1, 3, '#050605');
      px(9, 11, 1, 3, '#050605');
      break;
    case 'clock':
      px(3, 3, 10, 10, '#b89c46');
      px(4, 4, 8, 8, '#121812');
      px(7, 5, 2, 4, '#e6d7a5');
      px(7, 8, 4, 1, '#a52020');
      px(6, 1, 4, 2, '#877a5c');
      break;
    case 'level':
      px(5, 2, 6, 2, '#4a2518');
      px(4, 4, 8, 10, '#877a5c');
      px(5, 6, 6, 7, '#b89c46');
      px(6, 7, 2, 4, '#e6d7a5');
      break;
    case 'reroll':
      px(2, 3, 7, 7, '#e6d7a5');
      px(5, 4, 1, 1, '#050605');
      px(7, 7, 7, 7, '#c8c2ac');
      px(9, 9, 1, 1, '#a52020');
      px(11, 11, 1, 1, '#a52020');
      break;
    case 'warning':
      for (let r = 0; r < 11; r++) {
        const w = 2 + Math.floor(r * 1.1);
        px(8 - Math.floor(w / 2), 2 + r, w, 1, r > 8 ? '#a52020' : '#b89c46');
      }
      px(7, 5, 2, 4, '#050605');
      px(7, 10, 2, 2, '#050605');
      break;
    case 'suit':
      px(4, 3, 8, 9, '#364832');
      px(5, 6, 2, 2, '#e6d7a5');
      px(9, 6, 2, 2, '#e6d7a5');
      px(6, 9, 4, 4, '#4a2518');
      break;
    case 'boss_skull':
      px(1, 3, 3, 4, '#4a2518');
      px(12, 3, 3, 4, '#4a2518');
      px(4, 2, 8, 10, '#a52020');
      px(5, 3, 6, 7, '#c8c2ac');
      px(5, 6, 2, 2, '#e6d7a5');
      px(9, 6, 2, 2, '#e6d7a5');
      px(5, 11, 6, 3, '#b89c46');
      break;
    case 'core':
      // Reactor industrial con corazón brillante
      px(3, 1, 10, 3, '#4a2518');
      px(2, 4, 12, 8, '#364832');
      px(3, 12, 10, 3, '#4a2518');
      px(4, 5, 8, 6, '#121812');
      px(5, 6, 6, 4, '#d4af37');
      px(6, 7, 4, 2, '#fff6e0');
      px(7, 2, 2, 2, '#a52020');
      break;
    case 'screw_0':
    case 'screw_1':
    case 'screw_2':
    case 'screw_3': {
      px(3, 3, 10, 10, '#050605');
      px(4, 4, 8, 8, '#4a2518');
      px(5, 4, 6, 2, '#877a5c');
      if (key === 'screw_0') px(4, 7, 8, 2, '#050605');
      else if (key === 'screw_1') px(7, 4, 2, 8, '#050605');
      else if (key === 'screw_2') {
        for (let i = 0; i < 6; i++) px(5 + i, 5 + i, 2, 2, '#050605');
      } else {
        for (let i = 0; i < 6; i++) px(10 - i, 5 + i, 2, 2, '#050605');
      }
      break;
    }
    case 'crack_1':
      px(2, 2, 2, 4, '#050605');
      px(4, 5, 3, 2, '#050605');
      px(6, 7, 2, 5, '#050605');
      px(8, 11, 4, 2, '#050605');
      px(8, 6, 4, 1, '#4a2518');
      break;
    case 'crack_2':
      px(6, 1, 3, 5, '#050605');
      px(3, 6, 6, 2, '#050605');
      px(8, 7, 2, 6, '#050605');
      px(4, 8, 3, 4, '#4a2518');
      break;
    case 'stain_blood':
      px(4, 4, 7, 6, '#6e1414');
      px(6, 3, 4, 8, '#a52020');
      px(3, 11, 2, 3, '#6e1414');
      px(11, 9, 2, 4, '#a52020');
      break;
    case 'stain_rust':
      px(3, 5, 9, 6, '#4a2518');
      px(5, 3, 6, 9, '#4a2518');
      px(6, 6, 4, 3, '#182018');
      break;
    case 'wire_clamp':
      px(0, 6, 16, 3, '#050605');
      px(0, 7, 16, 1, '#6e1414');
      px(6, 4, 4, 7, '#877a5c');
      px(7, 5, 2, 5, '#4a2518');
      break;
    case 'charge_on':
      px(3, 2, 10, 11, '#050605');
      px(4, 3, 8, 8, '#b89c46');
      px(5, 4, 6, 6, '#e6d7a5');
      px(5, 11, 6, 3, '#4a2518');
      break;
    case 'charge_off':
      px(3, 2, 10, 11, '#050605');
      px(4, 3, 8, 8, '#182018');
      px(5, 4, 6, 6, '#0d110d');
      px(6, 5, 3, 2, '#364832');
      px(5, 11, 6, 3, '#4a2518');
      break;

    case 'turret_gunner':
      px(3, 10, 10, 4, '#050605');
      px(4, 10, 8, 3, '#4a2518');
      px(4, 7, 7, 4, '#243022');
      px(5, 8, 3, 2, '#b89c46');
      px(9, 7, 6, 2, '#877a5c');
      px(10, 6, 5, 1, '#c8c2ac');
      px(2, 11, 2, 2, '#877a5c');
      px(12, 11, 2, 2, '#877a5c');
      break;
    case 'turret_mortar':
      px(3, 10, 10, 4, '#050605');
      px(4, 10, 8, 3, '#4a2518');
      px(6, 5, 5, 7, '#050605');
      px(7, 4, 3, 8, '#364832');
      px(8, 3, 3, 3, '#877a5c');
      px(5, 8, 3, 2, '#a54a2a');
      px(10, 9, 4, 2, '#63533b');
      break;
    case 'turret_cryo':
      px(3, 10, 10, 4, '#050605');
      px(4, 10, 8, 3, '#2c4148');
      px(5, 5, 6, 6, '#050605');
      px(6, 6, 4, 4, '#4a6b73');
      px(7, 7, 2, 2, '#9fc3c9');
      px(3, 6, 2, 5, '#63533b');
      px(11, 6, 2, 5, '#63533b');
      px(4, 7, 1, 2, '#9fc3c9');
      px(11, 7, 1, 2, '#9fc3c9');
      break;
    case 'turret_barracks':
      px(3, 9, 10, 5, '#050605');
      px(4, 9, 8, 4, '#243022');
      px(5, 5, 6, 5, '#121812');
      px(6, 6, 4, 3, '#4a2518');
      px(11, 2, 2, 8, '#63533b');
      px(12, 3, 3, 2, '#a52020');
      px(6, 10, 1, 1, '#e6d7a5');
      px(9, 10, 1, 1, '#e6d7a5');
      break;
    case 'turret_support':
      px(3, 10, 10, 4, '#050605');
      px(4, 10, 8, 3, '#243022');
      px(7, 3, 2, 8, '#63533b');
      px(5, 7, 6, 2, '#050605');
      px(6, 8, 4, 1, '#68863a');
      px(7, 4, 2, 6, '#68863a');
      px(4, 11, 2, 2, '#877a5c');
      px(10, 11, 2, 2, '#877a5c');
      break;
    case 'scrap':
      // Dientes del engranaje (en óxido visible para que se lea sobre fondo oscuro)
      px(6, 1, 4, 2, '#4a2518');
      px(6, 13, 4, 2, '#4a2518');
      px(1, 6, 2, 4, '#4a2518');
      px(13, 6, 2, 4, '#4a2518');
      px(3, 3, 2, 2, '#4a2518');
      px(11, 3, 2, 2, '#4a2518');
      px(3, 11, 2, 2, '#4a2518');
      px(11, 11, 2, 2, '#4a2518');
      // Cuerpo y buje
      px(4, 4, 8, 8, '#877a5c');
      px(5, 5, 6, 6, '#63533b');
      px(6, 6, 4, 4, '#b89c46');
      px(7, 7, 2, 2, '#050605');
      // Reflejos
      px(5, 5, 2, 1, '#e6d7a5');
      px(11, 10, 2, 2, '#e6d7a5');
      px(12, 9, 2, 2, '#a54a2a');
      break;
  }

  ctx.restore();

  const skipOutline = ['crack_1', 'crack_2', 'stain_blood', 'stain_rust', 'wire_clamp'];
  if (!skipOutline.includes(key)) {
    applyIcon16Outline(ctx, ox, oy);
  }
}

export function buildMasterUIAtlas() {
  const UI = CONFIG.UI_SPRITES;
  const canvas = document.createElement('canvas');
  canvas.width = UI.ATLAS_W;
  canvas.height = UI.ATLAS_H;
  const ctx = canvas.getContext('2d');

  const NS = UI.NINE_SLICE;

  drawNineSliceBox(ctx, NS.panel_metal, {
    bg: '#0c100c', speckle: '#243022',
    borderLight: '#877a5c', borderDark: '#4a2518',
    doubleRim: true, rimInner: '#364832', cornerRivets: true
  });
  drawNineSliceBox(ctx, NS.panel_boss, {
    bg: '#140707', speckle: '#6e1414',
    borderLight: '#a52020', borderDark: '#4a2518',
    doubleRim: true, rimInner: '#6e1414', cornerRivets: true, rivetColor: '#b89c46'
  });
  drawNineSliceBox(ctx, NS.panel_paper, {
    bg: '#101510', speckle: '#364832',
    borderLight: '#877a5c', borderDark: '#364832',
    leftStripe: '#a52020'
  });
  drawNineSliceBox(ctx, NS.panel_inset, {
    bg: '#050605',
    borderLight: '#4a2518', borderDark: '#877a5c', pressed: true, cleanCorners: true
  });
  drawNineSliceBox(ctx, NS.panel_tape, {
    bg: '#c2a64f',
    borderLight: '#e6d7a5', borderDark: '#4a2518', tornEdges: true, cleanCorners: true
  });
  drawNineSliceBox(ctx, NS.panel_teeth, {
    bg: '#0e120d', speckle: '#4a2518',
    borderLight: '#b89c46', borderDark: '#4a2518', doubleRim: true, rimInner: '#4a2518'
  });

  drawNineSliceBox(ctx, NS.slot_weapon, {
    bg: '#0c120d', innerGlow: '#172318', speckle: '#364832',
    borderLight: '#b89c46', borderDark: '#4a2518',
    doubleRim: true, rimInner: '#364832', cornerRivets: true, rivetColor: '#e6d7a5'
  });
  drawNineSliceBox(ctx, NS.slot_passive, {
    bg: '#120e09', innerGlow: '#21180e', speckle: '#4a2518',
    borderLight: '#e6d7a5', borderDark: '#4a2518',
    doubleRim: true, rimInner: '#63533b', cornerRivets: true, rivetColor: '#b89c46'
  });
  drawNineSliceBox(ctx, NS.slot_empty, {
    bg: '#060806', innerGlow: '#0a0d0a',
    borderLight: '#364832', borderDark: '#182018', cleanCorners: true
  });
  drawNineSliceBox(ctx, NS.card_normal, {
    bg: '#0d120d', speckle: '#243022',
    borderLight: '#877a5c', borderDark: '#4a2518',
    doubleRim: true, rimInner: '#364832', cornerRivets: true
  });
  drawNineSliceBox(ctx, NS.card_hover, {
    bg: '#1b2619', speckle: '#b89c46',
    borderLight: '#e6d7a5', borderDark: '#b89c46',
    doubleRim: true, rimInner: '#b89c46', cornerRivets: true, rivetColor: '#e6d7a5'
  });
  drawNineSliceBox(ctx, NS.bar_frame, {
    bg: '#050605',
    borderLight: '#877a5c', borderDark: '#364832', pressed: true, cleanCorners: true
  });

  drawNineSliceBox(ctx, NS.btn_normal, {
    bg: '#161d15',
    borderLight: '#877a5c', borderDark: '#050605', doubleRim: true, rimInner: '#4a2518', cornerRivets: true
  });
  drawNineSliceBox(ctx, NS.btn_hover, {
    bg: '#c8ab50',
    borderLight: '#e6d7a5', borderDark: '#4a2518', doubleRim: true, rimInner: '#e6d7a5', cornerRivets: true, rivetColor: '#050605'
  });
  drawNineSliceBox(ctx, NS.btn_active, {
    bg: '#0b0f0b',
    borderLight: '#b89c46', borderDark: '#050605', pressed: true, cornerRivets: true
  });
  drawNineSliceBox(ctx, NS.btn_disabled, {
    bg: '#070807',
    borderLight: '#243022', borderDark: '#121812', cleanCorners: true
  });

  drawNineSliceBox(ctx, NS.btn_pri_normal, {
    bg: '#4e1212',
    borderLight: '#d43b3b', borderDark: '#050605', doubleRim: true, rimInner: '#8a2020', cornerRivets: true, rivetColor: '#e6d7a5'
  });
  drawNineSliceBox(ctx, NS.btn_pri_hover, {
    bg: '#d4af37',
    borderLight: '#e6d7a5', borderDark: '#4a2518', doubleRim: true, rimInner: '#e6d7a5', cornerRivets: true, rivetColor: '#050605'
  });
  drawNineSliceBox(ctx, NS.btn_pri_active, {
    bg: '#2c0909',
    borderLight: '#a52020', borderDark: '#050605', pressed: true, cornerRivets: true
  });
  drawNineSliceBox(ctx, NS.btn_pri_disabled, {
    bg: '#0e0707',
    borderLight: '#381818', borderDark: '#050605', cleanCorners: true
  });

  const drawBarFill = (cfg, colTop, colMid, colBot, segEvery = 8) => {
    if (!cfg) return;
    ctx.save();
    ctx.translate(cfg.x, cfg.y);
    for (let bx = 0; bx < cfg.w; bx++) {
      const isSegLine = (bx % segEvery === segEvery - 1);
      for (let by = 0; by < cfg.h; by++) {
        if (isSegLine) {
          ctx.fillStyle = '#050605';
        } else if (by === 0) {
          ctx.fillStyle = colTop;
        } else if (by === 1) {
          ctx.fillStyle = (bx + by) % 2 === 0 ? colTop : colMid;
        } else if (by > cfg.h - 3) {
          ctx.fillStyle = colBot;
        } else {
          ctx.fillStyle = ((bx * 7 + by * 13) & 3) === 0 ? colTop : colMid;
        }
        ctx.fillRect(bx, by, 1, 1);
      }
    }
    ctx.restore();
  };

  drawBarFill(UI.BAR_FILLS.hp,   '#ff9e9e', '#d62828', '#6e1414', 12);
  drawBarFill(UI.BAR_FILLS.exp,  '#fff6e0', '#e0b646', '#5c3818', 16);
  drawBarFill(UI.BAR_FILLS.stam, '#b8d8a0', '#5c8a4e', '#243022', 8);
  drawBarFill(UI.BAR_FILLS.boss, '#ffb3b3', '#b82525', '#4a2518', 10);
  drawBarFill(UI.BAR_FILLS.core, '#ffe699', '#d97724', '#4a2518', 8);

  Object.entries(UI.ICONS).forEach(([key, pos]) => {
    const ix = pos.col * UI.ICON_SIZE;
    const iy = UI.ICONS_ORIGIN_Y + pos.row * UI.ICON_SIZE;
    drawUIIcon16(ctx, key, ix, iy);
  });

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

  ctx.save();
  ctx.translate(UI.CURSORS.default.x, UI.CURSORS.default.y);
  for (let i = 0; i < 11; i++) {
    ctx.fillStyle = '#050605';
    ctx.fillRect(1, 1 + i, 2 + Math.floor(i * 0.7), 2);
    ctx.fillStyle = i < 4 ? '#e6d7a5' : '#b89c46';
    ctx.fillRect(2, 2 + i, 1 + Math.floor(i * 0.5), 1);
  }
  ctx.fillStyle = '#a52020';
  ctx.fillRect(2, 2, 2, 2);
  ctx.restore();

  ctx.save();
  ctx.translate(UI.CURSORS.pointer.x, UI.CURSORS.pointer.y);
  ctx.fillStyle = '#050605';
  ctx.fillRect(3, 1, 5, 13);
  ctx.fillRect(2, 5, 11, 8);
  ctx.fillStyle = '#e6d7a5';
  ctx.fillRect(4, 2, 3, 10);
  ctx.fillStyle = '#b89c46';
  ctx.fillRect(3, 6, 9, 6);
  ctx.fillStyle = '#a52020';
  ctx.fillRect(4, 2, 3, 2);
  ctx.restore();

  ctx.save();
  ctx.translate(UI.CURSORS.crosshair.x, UI.CURSORS.crosshair.y);
  const ch = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  ch(2, 2, 4, 1, '#b89c46'); ch(2, 2, 1, 4, '#b89c46');
  ch(10, 2, 4, 1, '#b89c46'); ch(13, 2, 1, 4, '#b89c46');
  ch(2, 13, 4, 1, '#b89c46'); ch(2, 10, 1, 4, '#b89c46');
  ch(10, 13, 4, 1, '#b89c46'); ch(13, 10, 1, 4, '#b89c46');
  ch(7, 7, 2, 2, '#e6d7a5');
  ctx.restore();

  return {
    name: 'ui_master_atlas',
    canvas
  };
}