// Sprites procedurales de enemigos y construcción de su hoja direccional.
// Exports: buildEnemyDirectionalSheet.

import { CONFIG } from '../../config.js';
import { applyCleanSpriteOutlineRect, makeTexture } from '../spritePalette.js';

function drawEnemyFrame(ctx, gCtx, type, dirRow, stateCol, ox, oy, numDirs = 1) {
  ctx.save(); gCtx.save();
  ctx.translate(ox, oy); gCtx.translate(ox, oy);

  const row = Math.min(3, Math.floor(stateCol / 4));
  const col = stateCol % 4;
  const phase = (col / 4) * Math.PI * 2;
  const isIdle = row === 0, isWalk = row === 1, isAtk = row === 2, isHurt = row === 3;
  const bob = isWalk ? Math.round(Math.sin(phase) * 2) : (isIdle ? (col % 2) : 0);
  const twitchX = (isIdle && col === 3) ? (type === 'weeper' ? 3 : 1) : (isHurt ? (col % 2 === 0 ? -3 : 3) : 0);
  const collapseY = (isHurt && col >= 2) ? (col - 1) * 6 : 0;

  const isLeftView = (numDirs === 4 && dirRow === 3) || (numDirs === 8 && dirRow >= 5);
  if (isLeftView) {
    ctx.translate(64, 0); ctx.scale(-1, 1);
    gCtx.translate(64, 0); gCtx.scale(-1, 1);
  }

  ctx.translate(twitchX, bob + collapseY);
  gCtx.translate(twitchX, bob + collapseY);

  const px = (x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const glow = (x, y, w, h, color = '#e6d7a5') => {
    px(x, y, w, h, color);
    gCtx.fillStyle = color;
    gCtx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };

  const isBack = numDirs > 1 && dirRow === 0;

  if (type === 'zombie') {
    const lurch = isWalk ? (col % 2 === 0 ? -3 : 3) : 0;
    px(21, 45 + lurch, 6, 15, '#121812');
    px(35, 45 - lurch, 7, 15, '#243022');
    px(18, 21, 26, 25, '#364832');
    if (!isBack) {
      px(22, 24, 16, 16, '#6e1414');
      for (let r = 0; r < 4; r++) px(23, 25 + r * 4, 14, 2, '#b89c46');
    } else {
      for (let r = 0; r < 5; r++) px(29, 22 + r * 4, 3, 3, '#b89c46');
    }
    px(12, 23, 6, 18, '#364832');
    const clawY = isAtk ? 10 : 23;
    px(43, clawY, 7, 32, '#44563a');
    px(42, clawY + 30, 9, 5, '#a52020');
    const headShift = isAtk ? 4 : 0;
    px(17 + headShift, 6, 22, 16, '#877a5c');
    if (!isBack) {
      px(19 + headShift, 10, 18, 2, '#6e1414');
      glow(20 + headShift, 12, 6, 6, '#e6d7a5');
      px(22 + headShift, 14, 2, 2, '#6e1414');
      glow(31 + headShift, 14, 3, 3, '#b89c46');
      const jawOpen = isAtk ? 6 : 3;
      px(21 + headShift, 19, 14, jawOpen + 3, '#121812');
      for (let t = 0; t < 4; t++) px(22 + headShift + t * 3, 19, 2, 3, '#b89c46');
    }
  } else if (type === 'weeper') {
    const sway = isWalk ? (col % 2 === 0 ? -2 : 2) : 0;
    px(25 + sway, 38, 4, 24, '#4a2518');
    px(35 - sway, 38, 4, 24, '#4a2518');
    px(23, 17, 18, 23, '#877a5c');
    for (let b = 0; b < 5; b++) px(22, 19 + b * 4, 20, 2, '#243022');
    px(27, 22, 10, 14, '#6e1414');
    const armSpread = isAtk ? 8 : 2;
    px(13 - armSpread, 16, 9, 4, '#877a5c');
    px(12 - armSpread, 18, 4, 36, '#877a5c');
    px(42 + armSpread, 16, 9, 4, '#877a5c');
    px(48 + armSpread, 18, 4, 36, '#877a5c');
    const headGlitch = (isIdle && col === 2) ? -4 : 0;
    px(22 + headGlitch, 2, 20, 17, '#c8c2ac');
    px(31 + headGlitch, 2, 2, 11, '#121812');
    if (!isBack) {
      px(24 + headGlitch, 7, 6, 6, '#050605');
      px(34 + headGlitch, 7, 6, 6, '#050605');
      glow(25 + headGlitch, 8, 4, 4, '#e6d7a5');
      glow(35 + headGlitch, 8, 4, 4, '#e6d7a5');
      const mouthH = isAtk ? 8 : 5;
      px(26 + headGlitch, 14, 12, mouthH, '#050605');
      for (let t = 0; t < 5; t++) glow(27 + headGlitch + t * 2, 15, 1, mouthH - 2, '#b89c46');
    }
  } else if (type === 'worm') {
    const pulse = (col % 2) * 2;
    px(10, 44 - pulse, 44, 16, '#4a2518');
    px(14, 30 - pulse, 36, 18, '#6e1414');
    px(18, 16, 28, 18, '#877a5c');
    for (let i = 0; i < 5; i++) px(16 + i * 7, 34, 3, 6, '#121812');
    const mawR = isAtk ? 16 : 12;
    px(32 - mawR, 12, mawR * 2, mawR + 6, '#050605');
    for (let t = 0; t < 6; t++) {
      glow(22 + t * 4, 13, 3, 4, '#b89c46');
      glow(22 + t * 4, 23, 3, 4, '#b89c46');
    }
    glow(15, 22, 4, 4, '#e6d7a5');
    glow(45, 20, 5, 5, '#e6d7a5');
  } else if (type === 'boss_butcher') {
    const swing = isAtk ? -10 : (col % 2) * 3;
    px(15, 42, 12, 18, '#121812');
    px(36, 42, 12, 18, '#121812');
    px(11, 15, 42, 30, '#4a2518');
    px(15, 19, 34, 25, '#6e1414');
    for (let s = 0; s < 5; s++) px(16 + s * 6, 17, 2, 26, '#121812');
    px(2, 18 + swing, 11, 32, '#877a5c');
    for (let t = 0; t < 7; t++) glow(1, 20 + swing + t * 4, 3, 2, '#b89c46');
    px(5, 24 + swing, 6, 22, '#a52020');
    px(50, 20 - swing, 10, 22, '#364832');
    px(52, 40 - swing, 8, 9, '#b89c46');
    px(19, 2, 24, 16, '#877a5c');
    if (!isBack) {
      px(22, 9, 18, 9, '#121812');
      glow(21, 5, 7, 6, '#e6d7a5');
      px(23, 7, 3, 3, '#a52020');
      glow(35, 6, 4, 4, '#b89c46');
    }
  } else if (type === 'boss_siren') {
    const sway = Math.round(Math.sin(phase) * 3);
    px(10, 0, 2, 24, '#4a2518');
    px(52, 0, 2, 24, '#4a2518');
    px(18 + sway, 34, 28, 26, '#243022');
    for (let i = 0; i < 6; i++) px(19 + sway + i * 4, 36, 2, 24, '#877a5c');
    px(16, 16, 32, 22, '#6e1414');
    for (let r = 0; r < 5; r++) glow(18, 18 + r * 4, 28, 2, '#b89c46');
    px(3, 18, 14, 5, '#877a5c');
    px(47, 18, 14, 5, '#877a5c');
    px(21, 3, 22, 15, '#c8c2ac');
    if (!isBack) {
      glow(23, 7, 4, 4, '#e6d7a5');
      glow(29, 5, 3, 3, '#e6d7a5');
      glow(35, 7, 5, 5, '#e6d7a5');
    }
  } else if (type === 'boss_furnace') {
    const rumble = col % 2 === 0 ? -1 : 1;
    px(14, 44, 12, 16, '#121812');
    px(38, 44, 12, 16, '#121812');
    px(12, 2, 8, 18, '#4a2518');
    px(44, 2, 8, 18, '#4a2518');
    px(10 + rumble, 14, 44, 34, '#4a2518');
    px(13 + rumble, 17, 38, 28, '#243022');
    px(18 + rumble, 24, 28, 16, '#050605');
    glow(20 + rumble, 26, 24, 12, isAtk ? '#e6d7a5' : '#a52020');
    for (let g = 0; g < 5; g++) px(21 + rumble + g * 5, 24, 2, 16, '#121812');
    px(20, 8, 24, 9, '#121812');
    if (!isBack) {
      glow(22, 10, 5, 5, '#e6d7a5');
      glow(30, 10, 4, 5, '#b89c46');
      glow(37, 10, 5, 5, '#e6d7a5');
    }
  } else if (type === 'boss_apostle') {
    const floatY = Math.round(Math.sin(phase) * 3);
    ctx.translate(0, floatY); gCtx.translate(0, floatY);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + phase * 0.25;
      glow(31 + Math.cos(a) * 18, 16 + Math.sin(a) * 14, 4, 4, '#b89c46');
    }
    px(20, 22, 24, 36, '#364832');
    px(24, 24, 16, 32, '#6e1414');
    px(22, 6, 20, 17, '#c8c2ac');
    if (!isBack) {
      px(25, 8, 14, 5, '#050605');
      glow(24, 16, 5, 5, '#e6d7a5');
      glow(35, 16, 5, 5, '#e6d7a5');
    }
  } else if (type === 'boss_warden') {
    const grin = isAtk ? 6 : 2;
    px(12, 34, 40, 26, '#050605');
    px(14, 2, 36, 36, '#877a5c');
    px(16, 4, 32, 32, '#c8c2ac');
    if (!isBack) {
      px(18, 9, 11, 10, '#050605');
      px(35, 9, 11, 10, '#050605');
      glow(22, 12, 4, 4, '#e6d7a5');
      glow(39, 12, 4, 4, '#e6d7a5');
      px(17, 22, 30, 11 + grin, '#050605');
      for (let t = 0; t < 7; t++) {
        glow(18 + t * 4, 23, 3, 5, '#b89c46');
        glow(18 + t * 4, 28 + grin, 3, 4, '#b89c46');
      }
    }
  }

  if (isHurt) {
    for (let s = 0; s < 5; s++) {
      px(16 + ((s * 11 + col * 7) % 32), 14 + ((s * 13 + col * 5) % 32), 3, 3, '#a52020');
    }
  }
  ctx.restore(); gCtx.restore();
}

export function buildEnemyDirectionalSheet(type) {
  const numDirs = CONFIG.DIRECTIONAL.ENTITY_DIRS[type] || 1;
  const cols = 16;
  const rows = numDirs;
  const w = cols * CONFIG.FRAME_SIZE;
  const h = rows * CONFIG.FRAME_SIZE;

  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');

  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = w; glowCanvas.height = h;
  const gCtx = glowCanvas.getContext('2d');

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      drawEnemyFrame(ctx, gCtx, type, r, c, c * CONFIG.FRAME_SIZE, r * CONFIG.FRAME_SIZE, numDirs);
    }
  }

  applyCleanSpriteOutlineRect(ctx, w, h);
  return {
    name: `${type}_${numDirs}dir`,
    numDirs,
    cols,
    rows,
    canvas,
    tex: makeTexture(canvas),
    glowTex: makeTexture(glowCanvas)
  };
}
