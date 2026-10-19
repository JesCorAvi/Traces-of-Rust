// Sprites 8-direcciones del jugador por loadout, con caché y capa de glow.
// Exports: getPlayerLoadoutSheet, peekPlayerLoadoutSheet.
import { CONFIG } from '../config.js';
import { applyCleanSpriteOutlineRect, makeTexture } from './spritePalette.js';

function renderWeaponByDirection(px, glow, handWeapon, dir, stateIdx, col, anchorX, anchorY, facingSign) {
  const isAtk = stateIdx === 3 || stateIdx === 5;
  const isFront = dir === 4;
  const isBack = dir === 0;
  const kickX = isAtk && col < 2 ? -2 * facingSign : 0;
  const wx = anchorX + kickX;
  const wy = anchorY;

  if (isFront || isBack) {
    if (handWeapon === 'shotgun') {
      px(wx - 2, wy - 1, 5, 6, '#4a2518');
      px(wx - 1, wy - 3, 3, 5, '#877a5c');
      if (isFront) px(wx, wy - 2, 2, 2, '#050605');
      if (isAtk && col < 2) {
        glow(wx - 4, wy - 6, 9, 9, '#e6d7a5');
        glow(wx - 2, wy - 4, 5, 5, '#b89c46');
        px(wx + 4, wy - 5 - col * 2, 3, 2, '#a52020');
      }
    } else if (handWeapon === 'flamethrower') {
      px(wx - 2, wy - 2, 6, 6, '#4a2518');
      px(wx - 1, wy - 4, 4, 4, '#b89c46');
      if (isAtk) {
        glow(wx - 5, wy - 7, 11, 11, '#e6d7a5');
        glow(wx - 3, wy - 5, 7, 7, '#b89c46');
      } else {
        glow(wx, wy - 4, 2, 2, '#b89c46');
      }
    } else if (handWeapon === 'harpoon') {
      px(wx - 2, wy - 1, 5, 5, '#364832');
      px(wx, wy - 6, 2, 7, '#c8c2ac');
      glow(wx - 1, wy - 7, 4, 3, '#b89c46');
    } else if (handWeapon === 'bolt') {
      px(wx - 2, wy, 4, 4, '#b89c46');
      if (isAtk || col % 2 === 0) {
        glow(wx - 3, wy - 3, 6, 4, '#e6d7a5');
      }
    } else if (handWeapon === 'mines') {
      px(wx - 3, wy, 6, 4, '#243022');
      glow(wx - 1, wy + 1, 2, 2, col % 2 === 0 ? '#a52020' : '#e6d7a5');
    } else {
      const swingX = isAtk ? (col < 2 ? -4 : 6) : 0;
      const swingY = isAtk ? (col < 2 ? -5 : 2) : 0;
      px(wx + swingX - 1, wy + swingY - 2, 4, 3, '#b89c46');
      px(wx + swingX, wy + swingY - 9, 3, 8, '#877a5c');
      px(wx + swingX + 1, wy + swingY - 8, 2, 6, '#a52020');
      if (isAtk && col < 2) glow(wx + swingX - 3, wy + swingY - 10, 9, 4, '#e6d7a5');
    }
    return;
  }

  const isDiag = (dir === 1 || dir === 3 || dir === 5 || dir === 7);
  const lenScale = isDiag ? 0.8 : 1.0;

  const rPx = (dx, dy, w, h, color) => {
    const sw = Math.max(1, Math.round(w * lenScale));
    const rx = facingSign > 0 ? wx + Math.round(dx * lenScale) : wx - Math.round(dx * lenScale) - sw;
    px(rx, wy + dy, sw, h, color);
  };
  const rGlow = (dx, dy, w, h, color) => {
    const sw = Math.max(1, Math.round(w * lenScale));
    const rx = facingSign > 0 ? wx + Math.round(dx * lenScale) : wx - Math.round(dx * lenScale) - sw;
    glow(rx, wy + dy, sw, h, color);
  };

  if (handWeapon === 'shotgun') {
    const pumpShift = (isAtk && col >= 2) ? -3 : 0;
    rPx(-5, 0, 6, 3, '#4a2518');
    rPx(1, -1, 6, 3, '#243022');
    rPx(7, -1, 13, 1, '#c8c2ac');
    rPx(7, 0, 12, 1, '#877a5c');
    rPx(9 + pumpShift, 1, 5, 2, '#743718');
    if (isAtk && col < 2) {
      rGlow(20, -4, 6, 8, '#e6d7a5');
      rGlow(18, -2, 4, 4, '#b89c46');
      rPx(2, -6 - col * 3, 3, 2, '#a52020');
    }
  } else if (handWeapon === 'flamethrower') {
    rPx(-6, 4, 8, 2, '#050605');
    rPx(0, -1, 10, 4, '#4a2518');
    rPx(3, -2, 5, 2, '#b89c46');
    rPx(10, -1, 8, 2, '#877a5c');
    if (isAtk) {
      rGlow(18, -5, 8, 10, '#e6d7a5');
      rGlow(15, -3, 7, 6, '#b89c46');
    } else {
      rGlow(18, -2, 2, 2, '#b89c46');
    }
  } else if (handWeapon === 'harpoon') {
    const shotOut = (isAtk && col < 2) ? 5 : 0;
    rPx(-2, -1, 12, 4, '#364832');
    rPx(1, -2, 6, 2, '#b89c46');
    rPx(10 + shotOut, 0, 10, 1, '#c8c2ac');
    rGlow(18 + shotOut, -1, 3, 3, '#b89c46');
  } else if (handWeapon === 'bolt') {
    rPx(0, -1, 6, 4, '#4a2518');
    rPx(6, -2, 4, 6, '#b89c46');
    if (isAtk || col % 2 === 0) {
      rGlow(10, -4, 6, 8, '#e6d7a5');
      rGlow(8, -2, 5, 4, '#b89c46');
    }
  } else if (handWeapon === 'mines') {
    const throwDist = isAtk ? col * 3 : 0;
    rPx(1 + throwDist, 0, 7, 4, '#243022');
    rPx(2 + throwDist, -1, 5, 2, '#4a2518');
    rGlow(3 + throwDist, -2, 3, 2, col % 2 === 0 ? '#a52020' : '#e6d7a5');
  } else {
    const swingY = isAtk ? (col === 0 ? -6 : col === 1 ? 3 : 1) : 0;
    rPx(0, 0 + swingY, 5, 2, '#4a2518');
    rPx(4, -2 + swingY, 2, 6, '#b89c46');
    rPx(6, -3 + swingY, 13, 5, '#877a5c');
    rPx(6, -3 + swingY, 12, 1, '#e6d7a5');
    rPx(8, 1 + swingY, 9, 1, '#a52020');
    for (let t = 0; t < 4; t++) {
      rPx(7 + t * 3, 2 + swingY, 1, 1, '#c8c2ac');
    }
    if (isAtk && col < 2) {
      rGlow(12, -5 + swingY, 8, 3, '#e6d7a5');
    }
  }
}

function drawPlayer8DirCell(ctx, gCtx, dir, stateIdx, col, ox, oy, skills = { slash: 1 }, activeHand = 'slash') {
  ctx.save(); gCtx.save();
  ctx.translate(ox, oy); gCtx.translate(ox, oy);

  let effectiveDir = dir;
  if (CONFIG.DIRECTIONAL.USE_MIRRORING && (dir === 5 || dir === 6 || dir === 7)) {
    ctx.translate(64, 0); ctx.scale(-1, 1);
    gCtx.translate(64, 0); gCtx.scale(-1, 1);
    effectiveDir = dir === 5 ? 3 : dir === 6 ? 2 : 1;
  }

  const phase = (col / 4) * Math.PI * 2;
  const isIdle = stateIdx === 0;
  const isWalk = stateIdx === 1 || stateIdx === 5;
  const isJump = stateIdx === 2;
  const isHurt = stateIdx === 4;
  const isDash = stateIdx === 6;

  const isBackView = (effectiveDir === 0 || effectiveDir === 1 || effectiveDir === 7);
  const isSideProfile = (effectiveDir === 2 || effectiveDir === 6);
  const facingSign = (effectiveDir === 5 || effectiveDir === 6 || effectiveDir === 7) ? -1 : 1;

  const bobY = isDash
    ? -2
    : isWalk
      ? Math.round(Math.abs(Math.sin(phase)) * 2)
      : isJump
        ? (col === 0 ? 2 : col === 1 ? -4 : col === 2 ? -3 : 1)
        : (isIdle && col % 2 === 1 ? 1 : 0);

  const dashShiftX = isDash && effectiveDir !== 0 && effectiveDir !== 4 ? facingSign * 3 : 0;
  const hurtX = isHurt ? (col % 2 === 0 ? -2 : 2) : dashShiftX;

  ctx.translate(hurtX, bobY);
  gCtx.translate(hurtX, bobY);

  const px = (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  const glow = (x, y, w, h, color = '#e6d7a5') => {
    px(x, y, w, h, color);
    gCtx.fillStyle = color;
    gCtx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };

  if (isDash) {
    const trailDir = isSideProfile ? -facingSign : 1;
    glow(14 - col * 2 * trailDir, 16 + (col % 2) * 4, 7, 1, '#b89c46');
    glow(12 - col * 3 * trailDir, 28 - (col % 2) * 3, 9, 1, '#e6d7a5');
    glow(15 - col * 2 * trailDir, 42 + (col % 2) * 2, 6, 1, '#b89c46');
  }

  if (isBackView) {
    const anchorX = effectiveDir === 0 ? 38 : (effectiveDir === 1 ? 37 : 22);
    renderWeaponByDirection(px, glow, activeHand, effectiveDir, stateIdx, col, anchorX, 26, facingSign);
  }

  if (!isBackView) {
    const packX = effectiveDir === 2 ? 17 : effectiveDir === 6 ? 37 : (effectiveDir === 3 ? 17 : 37);
    if (skills.flamethrower && effectiveDir !== 4) {
      px(packX, 20, 5, 14, '#4a2518');
      px(packX + 1, 21, 2, 12, '#743718');
      px(packX, 23, 5, 1, '#b89c46');
      px(packX, 30, 5, 1, '#b89c46');
    } else if (skills.shotgun && activeHand !== 'shotgun') {
      px(packX + 1, 11, 2, 9, '#877a5c');
    }
  }

  const stride = isDash
    ? 5
    : isWalk
      ? Math.round(Math.sin(phase) * 3.5)
      : (isJump ? (col === 1 || col === 2 ? -3 : 1) : 0);

  if (isSideProfile) {
    const legBackX = 27 - stride * facingSign;
    const legFrontX = 27 + stride * facingSign;
    const dashLift = isDash ? -3 : 0;
    px(legBackX, 44 + dashLift, 5, 9, '#0d120d');
    px(legBackX, 53 + dashLift, 6, 6, '#050605');
    px(legFrontX, 44 + dashLift, 5, 9, '#182018');
    px(legFrontX + 1, 44 + dashLift, 2, 9, '#243022');
    px(legFrontX, 53 + dashLift, 6, 6, '#050605');
    px(legFrontX + 1, 53 + dashLift, 4, 2, '#4a2518');
    px(legFrontX, 58 + dashLift, 6, 1, '#364832');
  } else {
    const stepL = isJump ? stride : (isDash ? -3 : stride);
    const stepR = isJump ? stride : (isDash ? 2 : -stride);
    px(22, 44 + stepL, 5, 9, '#121812');
    px(23, 44 + stepL, 2, 9, '#243022');
    px(21, 53 + stepL, 6, 6, '#050605');
    px(22, 53 + stepL, 4, 2, '#4a2518');
    px(21, 58 + stepL, 6, 1, '#364832');
    px(31, 44 + stepR, 5, 9, '#121812');
    px(32, 44 + stepR, 2, 9, '#243022');
    px(31, 53 + stepR, 6, 6, '#050605');
    px(32, 53 + stepR, 4, 2, '#4a2518');
    px(31, 58 + stepR, 6, 1, '#364832');
  }

  const coatFlare = isDash ? 4 : (isJump && (col === 1 || col === 2) ? 2 : (isWalk && col % 2 === 0 ? 1 : 0));

  if (isSideProfile) {
    px(24 - coatFlare, 35, 11 + coatFlare * 2, 10, '#121812');
    px(25, 35, 8, 9, '#243022');
    px(24, 21, 11, 14, '#182018');
    px(26, 21, 7, 13, '#243022');
    px(27 + facingSign, 22, 4, 11, '#364832');
    px(24, 34, 11, 2, '#4a2518');
    px(29 + facingSign * 3, 34, 2, 2, '#b89c46');
  } else {
    px(20 - coatFlare, 36, 7, 10, '#121812');
    px(21 - coatFlare, 36, 4, 9, '#243022');
    px(31 + coatFlare, 36, 7, 10, '#121812');
    px(32 + coatFlare, 36, 4, 9, '#243022');

    px(20, 21, 18, 9, '#121812');
    px(22, 21, 14, 9, '#243022');
    px(22, 30, 14, 6, '#182018');
    px(22, 34, 14, 2, '#4a2518');

    if (isBackView) {
      px(23, 22, 12, 3, '#364832');
      px(28, 22, 2, 12, '#050605');
      px(21, 22, 2, 12, '#4a2518');
      px(35, 22, 2, 12, '#4a2518');

      const backShift = effectiveDir === 1 ? -3 : effectiveDir === 7 ? 3 : 0;
      if (skills.flamethrower) {
        px(24 + backShift, 20, 9, 14, '#4a2518');
        px(26 + backShift, 21, 5, 12, '#6e1414');
        px(24 + backShift, 23, 9, 1, '#b89c46');
        px(24 + backShift, 30, 9, 1, '#b89c46');
        glow(27 + backShift, 18, 3, 2, '#e6d7a5');
      } else {
        px(25 + backShift, 22, 8, 10, '#4a2518');
        px(26 + backShift, 23, 6, 8, '#743718');
        px(28 + backShift, 25, 2, 4, '#b89c46');
      }
      if (skills.shotgun && activeHand !== 'shotgun') {
        for (let b = 0; b < 5; b++) {
          px(23 + b * 2, 18 + b * 3, 3, 2, '#877a5c');
        }
      }
    } else {
      const frontShift = effectiveDir === 3 ? 1 : effectiveDir === 5 ? -1 : 0;
      px(23, 22, 4, 12, '#364832');
      px(31, 22, 4, 12, '#364832');
      px(27 + frontShift, 22, 4, 12, '#4a2518');
      for (let s = 0; s < 3; s++) px(28 + frontShift, 23 + s * 3, 2, 1, '#877a5c');
      px(28 + frontShift, 34, 3, 2, '#b89c46');

      if (skills.shotgun) {
        px(24, 24, 2, 2, '#a52020');
        px(27, 26, 2, 2, '#a52020');
        px(30, 28, 2, 2, '#a52020');
      }
    }
  }

  if (skills.aura) glow(23, 35, 2, 3, '#68863a');
  if (skills.mines) glow(34, 35, 2, 2, col % 2 === 0 ? '#a52020' : '#e6d7a5');
  if (skills.orbital) {
    px(19, 20, 4, 2, '#877a5c');
    px(35, 20, 4, 2, '#877a5c');
  }

  const headLean = isDash && isSideProfile ? facingSign * 2 : 0;
  px(24 + headLean, 19, 10, 3, '#050605');
  px(25 + headLean, 19, 8, 2, '#4a2518');
  px(25 + headLean, 7, 8, 2, '#243022');
  px(23 + headLean, 9, 12, 10, '#182018');

  if (effectiveDir === 0) {
    px(24, 8, 10, 10, '#243022');
    px(28, 8, 2, 10, '#050605');
    px(24, 14, 10, 2, '#4a2518');
  } else if (effectiveDir === 1 || effectiveDir === 7) {
    const sideX = effectiveDir === 1 ? 33 : 23;
    px(24, 8, 10, 10, '#243022');
    px(28 - facingSign * 2, 8, 2, 10, '#050605');
    glow(sideX, 13, 2, 2, '#e6d7a5');
    px(sideX + facingSign, 16, 2, 3, '#4a2518');
  } else if (effectiveDir === 2 || effectiveDir === 6) {
    const maskX = (effectiveDir === 2 ? 30 : 23) + headLean;
    const snoutX = (effectiveDir === 2 ? 34 : 20) + headLean;
    px((effectiveDir === 2 ? 24 : 28) + headLean, 8, 6, 10, '#364832');
    px(maskX, 10, 5, 8, '#050605');
    px(maskX, 10, 4, 2, '#877a5c');
    glow((effectiveDir === 2 ? 32 : 24) + headLean, 13, 3, 3, '#e6d7a5');
    px(snoutX, 15, 4, 4, '#243022');
    px(snoutX + (effectiveDir === 2 ? 2 : 0), 16, 2, 3, '#4a2518');
  } else if (effectiveDir === 4) {
    px(24, 8, 10, 3, '#364832');
    px(24, 10, 10, 9, '#050605');
    px(25, 10, 8, 2, '#877a5c');
    px(26, 10, 3, 2, '#6e1414');
    glow(25, 13, 3, 3, '#e6d7a5');
    glow(30, 13, 3, 3, '#e6d7a5');
    px(27, 16, 4, 4, '#243022');
    px(28, 17, 2, 2, '#b89c46');
  } else {
    const lookShift = effectiveDir === 3 ? 1 : -1;
    px(24, 8, 5, 9, '#364832');
    px(25, 10, 9, 9, '#050605');
    px(26, 10, 7, 2, '#877a5c');
    px(27, 10, 3, 2, '#6e1414');
    glow(26 + lookShift, 13, 3, 3, '#e6d7a5');
    glow(31 + lookShift, 13, 3, 3, '#e6d7a5');
    px(28 + lookShift, 16, 5, 4, '#243022');
    px(29 + lookShift, 17, 3, 3, '#4a2518');
  }

  const armSwing = isWalk ? Math.round(Math.sin(phase) * 2) : 0;
  if (!isSideProfile) {
    px(18, 22, 3, 10 + armSwing, '#182018');
    px(18, 32 + armSwing, 3, 3, '#877a5c');
    px(36, 22, 4, 9 - armSwing, '#243022');
    px(37, 31 - armSwing, 3, 3, '#877a5c');
  } else {
    px(27, 23, 4, 9, '#243022');
    px(28 + facingSign * 2, 29, 3, 3, '#877a5c');
  }

  if (!isBackView) {
    const anchorX = effectiveDir === 4 ? 19 : (facingSign > 0 ? 37 : 22);
    renderWeaponByDirection(px, glow, activeHand, effectiveDir, stateIdx, col, anchorX, 27, facingSign);
  }

  if (isHurt) {
    px(25, 24, 4, 4, '#a52020');
    px(31, 28, 3, 3, '#a52020');
  }

  ctx.restore(); gCtx.restore();
}

const playerLoadoutCache = new Map();

function loadoutSignature(skills, activeHand) {
  const equippedKeys = Object.keys(skills).filter(k => skills[k] > 0).sort().join(',');
  return `${equippedKeys}::${activeHand}::${CONFIG.DIRECTIONAL.USE_MIRRORING}`;
}

export function peekPlayerLoadoutSheet(skills = { slash: 1 }, activeHand = 'slash') {
  return playerLoadoutCache.get(loadoutSignature(skills, activeHand)) || null;
}

export function getPlayerLoadoutSheet(skills = { slash: 1 }, activeHand = 'slash') {
  const signature = loadoutSignature(skills, activeHand);

  if (playerLoadoutCache.has(signature)) {
    return playerLoadoutCache.get(signature);
  }

  const numStates = Object.keys(CONFIG.DIRECTIONAL.STATES).length;
  const cols = numStates * 4;
  const rows = 8;
  const w = cols * CONFIG.FRAME_SIZE;
  const h = rows * CONFIG.FRAME_SIZE;

  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');

  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = w; glowCanvas.height = h;
  const gCtx = glowCanvas.getContext('2d');

  for (let dir = 0; dir < rows; dir++) {
    for (let stateIdx = 0; stateIdx < numStates; stateIdx++) {
      for (let f = 0; f < 4; f++) {
        const colIdx = stateIdx * 4 + f;
        drawPlayer8DirCell(
          ctx, gCtx, dir, stateIdx, f,
          colIdx * CONFIG.FRAME_SIZE, dir * CONFIG.FRAME_SIZE,
          skills, activeHand
        );
      }
    }
  }

  applyCleanSpriteOutlineRect(ctx, w, h);

  const tex = makeTexture(canvas);
  tex.repeat.set(1 / cols, 1 / rows);
  const glowTex = makeTexture(glowCanvas);
  glowTex.repeat.set(1 / cols, 1 / rows);

  const entry = { name: `player_8dir_${activeHand}`, cols, rows, numDirs: 8, tex, glowTex, canvas };
  playerLoadoutCache.set(signature, entry);
  return entry;
}