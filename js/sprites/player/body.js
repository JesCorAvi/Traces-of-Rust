// Dibujo procedural del cuerpo 8-direcciones del jugador.
// Exports: drawPlayer8DirCell.

import { CONFIG } from '../../config.js';
import { renderWeaponByDirection } from './weapons.js';

export function drawPlayer8DirCell(ctx, gCtx, dir, stateIdx, col, ox, oy, skills = { slash: 1 }, activeHand = 'slash') {
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
