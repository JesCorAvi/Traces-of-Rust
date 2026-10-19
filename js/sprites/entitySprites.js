import { CONFIG } from '../config.js';
import {
  applyEnvironmentDither,
  applyCleanSpriteOutlineRect,
  makeTexture
} from './spritePalette.js';

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

function buildWeaponSheets() {
  const slashCan = document.createElement('canvas');
  slashCan.width = 256; slashCan.height = 64;
  const sCtx = slashCan.getContext('2d');

  for (let f = 0; f < 4; f++) {
    sCtx.save();
    sCtx.translate(f * 64, 0);
    const startA = Math.PI * (1.02 + f * 0.08);
    const endA = Math.PI * (1.55 + f * 0.14);

    sCtx.strokeStyle = '#6e1414'; sCtx.lineWidth = 12 - f * 2;
    sCtx.beginPath(); sCtx.arc(32, 46, 26, startA, endA); sCtx.stroke();

    sCtx.strokeStyle = '#877a5c'; sCtx.lineWidth = 7 - f;
    sCtx.beginPath(); sCtx.arc(32, 46, 23, startA, endA); sCtx.stroke();

    sCtx.strokeStyle = '#e6d7a5'; sCtx.lineWidth = 3;
    sCtx.beginPath(); sCtx.arc(32, 46, 20, startA + 0.1, endA); sCtx.stroke();

    for (let t = 0; t < 9; t++) {
      const a = startA + (t / 8) * (endA - startA);
      const tx = 32 + Math.cos(a) * 28;
      const ty = 46 + Math.sin(a) * 28;
      sCtx.fillStyle = t % 2 === 0 ? '#b89c46' : '#a52020';
      sCtx.fillRect(Math.round(tx) - 2, Math.round(ty) - 2, 4, 4);
    }
    sCtx.restore();
  }

  const orbCan = document.createElement('canvas');
  orbCan.width = 256; orbCan.height = 64;
  const oCtx = orbCan.getContext('2d');

  for (let f = 0; f < 4; f++) {
    oCtx.save();
    oCtx.translate(f * 64, 0);
    oCtx.fillStyle = '#4a2518'; oCtx.fillRect(29, 2, 6, 12);
    oCtx.fillStyle = '#243022'; oCtx.fillRect(16, 14, 32, 32);
    oCtx.fillStyle = '#6e1414'; oCtx.fillRect(20, 18, 24, 24);
    oCtx.fillStyle = '#c8c2ac'; oCtx.fillRect(22, 20, 20, 16);
    const eyeShift = (f - 1.5) * 2;
    oCtx.fillStyle = '#050605';
    oCtx.fillRect(24 + eyeShift, 24, 5, 5);
    oCtx.fillRect(34 + eyeShift, 24, 5, 5);
    oCtx.fillStyle = f % 2 === 0 ? '#e6d7a5' : '#b89c46';
    oCtx.fillRect(25 + eyeShift, 25, 3, 3);
    oCtx.fillRect(35 + eyeShift, 25, 3, 3);
    for (let b = 0; b < 4; b++) {
      oCtx.fillStyle = '#4a2518';
      oCtx.fillRect(18 + b * 8 + (f % 2), 14, 3, 32);
    }
    oCtx.fillStyle = '#877a5c';
    oCtx.fillRect(12, 36, 8, 16);
    oCtx.fillRect(44, 36, 8, 16);
    oCtx.fillStyle = '#a52020';
    oCtx.fillRect(10, 48, 6, 8);
    oCtx.fillRect(48, 48, 6, 8);
    oCtx.restore();
  }

  return {
    slashSheet: { name: 'saw_slash_4f', canvas: slashCan, tex: makeTexture(slashCan) },
    orbitalSheet: { name: 'butcher_orbital_4f', canvas: orbCan, tex: makeTexture(orbCan) }
  };
}

function buildPickupSheets() {
  const serumCan = document.createElement('canvas');
  serumCan.width = 256; serumCan.height = 64;
  const sCtx = serumCan.getContext('2d');

  for (let f = 0; f < 4; f++) {
    sCtx.save();
    sCtx.translate(f * 64, 0);
    const px = (x, y, w, h, c) => { sCtx.fillStyle = c; sCtx.fillRect(x, y, w, h); };

    px(31, 6, 2, 8, '#c8c2ac');
    px(31, 4, 2, 3, '#e6d7a5');
    px(26, 13, 12, 4, '#877a5c');
    px(24, 17, 16, 4, '#4a2518');
    px(25, 18, 14, 2, '#b89c46');

    px(21, 21, 22, 30, '#182018');
    px(22, 22, 20, 28, '#243022');

    const wave = (f % 2 === 0) ? 1 : -1;
    px(23, 27 + wave, 18, 22 - wave, '#6e1414');
    px(24, 28 + wave, 16, 20 - wave, '#a52020');
    px(24, 27 + wave, 16, 3, '#b89c46');

    const b1Y = 44 - f * 4;
    const b2Y = 40 - ((f + 2) % 4) * 4;
    px(27, b1Y, 3, 3, '#e6d7a5');
    px(34, b2Y, 2, 2, '#b89c46');

    px(24, 23, 2, 24, '#e6d7a5');
    for (let m = 0; m < 4; m++) {
      px(37, 25 + m * 6, 3, 1, '#c8c2ac');
    }

    px(24, 51, 16, 4, '#4a2518');
    px(26, 52, 12, 2, '#877a5c');
    if (f === 1 || f === 2) {
      px(31, 56 + f, 2, 3, '#a52020');
    }
    sCtx.restore();
  }
  applyCleanSpriteOutlineRect(sCtx, 256, 64);

  const toothCan = document.createElement('canvas');
  toothCan.width = 256; toothCan.height = 64;
  const tCtx = toothCan.getContext('2d');

  for (let f = 0; f < 4; f++) {
    tCtx.save();
    tCtx.translate(f * 64, 0);
    const px = (x, y, w, h, c) => { tCtx.fillStyle = c; tCtx.fillRect(x, y, w, h); };

    px(19, 13, 11, 6, '#e6d7a5');
    px(34, 13, 11, 6, '#e6d7a5');
    px(18, 17, 28, 16, '#c8c2ac');
    px(20, 15, 24, 14, '#e6d7a5');

    px(29, 16, 2, 8, '#4a2518');
    px(33, 16, 9, 7, '#b89c46');
    if (f % 2 === 0) {
      px(35, 17, 5, 4, '#e6d7a5');
    }

    px(20, 31, 24, 5, '#b89c46');
    px(21, 34, 22, 3, '#743718');

    px(20, 36, 9, 16, '#c8c2ac');
    px(22, 36, 6, 14, '#877a5c');
    px(35, 36, 9, 16, '#c8c2ac');
    px(36, 36, 6, 14, '#877a5c');

    px(21, 46, 7, 8, '#a52020');
    px(22, 52, 4, 4, '#6e1414');
    px(36, 45, 7, 9, '#a52020');
    px(38, 52, 4, 4, '#6e1414');

    const dropY = 54 + f * 2;
    px(24, dropY, 3, 3, '#a52020');
    tCtx.restore();
  }
  applyCleanSpriteOutlineRect(tCtx, 256, 64);

  const chestCan = document.createElement('canvas');
  chestCan.width = 256; chestCan.height = 64;
  const cCtx = chestCan.getContext('2d');

  for (let f = 0; f < 4; f++) {
    cCtx.save();
    cCtx.translate(f * 64, 0);
    const px = (x, y, w, h, c) => { cCtx.fillStyle = c; cCtx.fillRect(x, y, w, h); };

    px(25, 11, 14, 6, '#4a2518');
    px(27, 13, 10, 4, '#050605');

    px(10, 17, 44, 36, '#243022');
    px(12, 19, 40, 32, '#364832');

    px(10, 17, 7, 7, '#b89c46');
    px(47, 17, 7, 7, '#b89c46');
    px(10, 46, 7, 7, '#b89c46');
    px(47, 46, 7, 7, '#b89c46');

    px(18, 17, 5, 36, '#4a2518');
    px(41, 17, 5, 36, '#4a2518');
    px(17, 31, 7, 6, '#b89c46');
    px(40, 31, 7, 6, '#b89c46');

    px(25, 25, 14, 18, '#121812');
    const crossCol = f % 2 === 0 ? '#a52020' : '#e6d7a5';
    px(30, 27, 4, 14, crossCol);
    px(27, 32, 10, 4, crossCol);

    px(12, 34, 40, 2, '#050605');
    px(26, 36, 12, 3, '#6e1414');
    px(29, 38, 4, 6, '#a52020');
    cCtx.restore();
  }
  applyCleanSpriteOutlineRect(cCtx, 256, 64);

  // Chatarra: engranaje roto que gira y suelta chispas
  const scrapCan = document.createElement('canvas');
  scrapCan.width = 256; scrapCan.height = 64;
  const scCtx = scrapCan.getContext('2d');

  for (let f = 0; f < 4; f++) {
    scCtx.save();
    scCtx.translate(f * 64, 0);
    const px = (x, y, w, h, c) => { scCtx.fillStyle = c; scCtx.fillRect(x, y, w, h); };

    const cx = 32, cy = 30;
    const angle = (f / 4) * Math.PI * 2;
    const teeth = 8;
    for (let t = 0; t < teeth; t++) {
      const a = angle + (t / teeth) * Math.PI * 2;
      const tx = Math.round(cx + Math.cos(a) * 19);
      const ty = Math.round(cy + Math.sin(a) * 19);
      px(tx - 3, ty - 3, 7, 7, '#050605');
      px(tx - 2, ty - 2, 5, 5, '#877a5c');
      px(tx - 1, ty - 1, 3, 3, '#b89c46');
    }

    px(cx - 15, cy - 15, 31, 31, '#050605');
    px(cx - 13, cy - 13, 27, 27, '#364832');
    px(cx - 11, cy - 11, 23, 23, '#243022');
    px(cx - 8, cy - 8, 17, 17, '#4a2518');
    px(cx - 5, cy - 5, 11, 11, '#875a30');
    px(cx - 2, cy - 2, 5, 5, '#b89c46');

    // Grietas y desgaste
    px(cx - 12, cy + 8, 6, 2, '#050605');
    px(cx + 7, cy - 11, 2, 5, '#050605');
    px(cx + 9, cy + 9, 3, 3, '#a52020');

    // Chispas según frame
    if (f % 2 === 0) {
      px(48, 12, 2, 2, '#e6d7a5');
      px(53, 18, 2, 2, '#b89c46');
    } else {
      px(12, 17, 2, 2, '#b89c46');
      px(9, 24, 2, 2, '#e6d7a5');
    }

    scCtx.restore();
  }
  applyCleanSpriteOutlineRect(scCtx, 256, 64);

  return {
    serum: { name: 'pickup_serum_4f', canvas: serumCan, tex: makeTexture(serumCan) },
    tooth: { name: 'pickup_tooth_4f', canvas: toothCan, tex: makeTexture(toothCan) },
    chest: { name: 'pickup_chest_4f', canvas: chestCan, tex: makeTexture(chestCan) },
    scrap:  { name: 'pickup_scrap_4f', canvas: scrapCan, tex: makeTexture(scrapCan) }
  };
}

export function buildEnvironmentTextures() {
  const gCan = document.createElement('canvas');
  gCan.width = gCan.height = 128;
  const gCtx = gCan.getContext('2d');
  gCtx.fillStyle = '#121812'; gCtx.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 32) {
    for (let x = 0; x < 128; x += 32) {
      gCtx.strokeStyle = '#050605'; gCtx.strokeRect(x, y, 32, 32);
      gCtx.fillStyle = (x + y) % 64 === 0 ? '#1d261c' : '#161d15';
      gCtx.fillRect(x + 2, y + 2, 28, 28);
    }
  }
  for (let i = 0; i < 90; i++) {
    gCtx.fillStyle = i % 5 === 0 ? '#4a2518' : '#050605';
    gCtx.fillRect((i * 37) % 124, (i * 53) % 124, 4, 4);
  }
  applyEnvironmentDither(gCtx, 128, 128);

  const cCan = document.createElement('canvas');
  cCan.width = cCan.height = 64;
  const cCtx = cCan.getContext('2d');
  cCtx.fillStyle = '#4a2518'; cCtx.fillRect(0, 0, 64, 64);
  cCtx.fillStyle = '#243022'; cCtx.fillRect(6, 6, 52, 52);
  cCtx.strokeStyle = '#877a5c'; cCtx.lineWidth = 4;
  cCtx.strokeRect(4, 4, 56, 56);
  cCtx.beginPath(); cCtx.moveTo(4, 4); cCtx.lineTo(60, 60); cCtx.stroke();
  applyEnvironmentDither(cCtx, 64, 64);

  const mCan = document.createElement('canvas');
  mCan.width = mCan.height = 64;
  const mCtx = mCan.getContext('2d');
  mCtx.fillStyle = '#182018'; mCtx.fillRect(0, 0, 64, 64);
  for (let y = 0; y < 64; y += 8) {
    mCtx.fillStyle = y % 16 === 0 ? '#4a2518' : '#364832';
    mCtx.fillRect(0, y, 64, 4);
    mCtx.fillStyle = '#b89c46';
    mCtx.fillRect(0, y, 6, 4);
    mCtx.fillRect(58, y, 6, 4);
  }
  applyEnvironmentDither(mCtx, 64, 64);

  const aCan = document.createElement('canvas');
  aCan.width = aCan.height = 128;
  const aCtx = aCan.getContext('2d');
  aCtx.strokeStyle = '#68863a'; aCtx.lineWidth = 5;
  aCtx.beginPath(); aCtx.arc(64, 64, 56, 0, Math.PI * 2); aCtx.stroke();
  aCtx.strokeStyle = '#b89c46'; aCtx.lineWidth = 2;
  aCtx.beginPath(); aCtx.arc(64, 64, 44, 0, Math.PI * 2); aCtx.stroke();
  applyEnvironmentDither(aCtx, 128, 128);

  const pCan = document.createElement('canvas');
  pCan.width = pCan.height = 64;
  const pCtx = pCan.getContext('2d');
  pCtx.fillStyle = '#243022'; pCtx.fillRect(22, 0, 20, 64);
  pCtx.fillStyle = '#4a2518'; pCtx.fillRect(25, 0, 6, 64);
  applyEnvironmentDither(pCtx, 64, 64);

  const weapons = buildWeaponSheets();
  const pickups = buildPickupSheets();

  return {
    ground:       { name: 'ground_tile', canvas: gCan, tex: makeTexture(gCan, 75) },
    crate:        { name: 'rust_crate',  canvas: cCan, tex: makeTexture(cCan) },
    metal:        { name: 'catwalk_tex', canvas: mCan, tex: makeTexture(mCan, 4) },
    aura:         { name: 'bile_aura',   canvas: aCan, tex: makeTexture(aCan) },
    pillar:       { name: 'rust_pillar', canvas: pCan, tex: makeTexture(pCan) },
    slash:        weapons.slashSheet,
    orbital:      weapons.orbitalSheet,
    pickup_serum: pickups.serum,
    pickup_tooth: pickups.tooth,
    pickup_chest: pickups.chest,
    pickup_scrap: pickups.scrap
  };
}