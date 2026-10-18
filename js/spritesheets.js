import * as THREE from 'three';
import { CONFIG } from './config.js';

const BAYER4 = [
  [ 0,  8,  2, 10],
  [12,  4, 14,  6],
  [ 3, 11,  1,  9],
  [15,  7, 13,  5]
];

const PAL = [
  [5, 6, 5],       // Negro abisal (Contornos y sombras profundas)
  [18, 24, 18],    // Gris verdoso oscuro
  [36, 48, 34],    // Verde enfermizo oscuro
  [68, 86, 58],    // Verde moho
  [74, 37, 24],    // Óxido marrón / cuero oscuro
  [110, 20, 20],   // Sangre seca
  [165, 32, 32],   // Sangre fresca
  [135, 122, 92],  // Venda sucia / acero gastado
  [184, 156, 70],  // Amarillo nicotina / latón
  [230, 215, 165]  // Blanco ocular / filo brillante
];

function applyEnvironmentDither(ctx, w, h) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (d[i + 3] < 90) { d[i + 3] = 0; continue; }
      d[i + 3] = 255;
      const bayer = (BAYER4[y & 3][x & 3] - 7.5) * 3.0;
      const r = d[i] + bayer, g = d[i + 1] + bayer, b = d[i + 2] + bayer;

      let best = PAL[0], minDist = 1e9;
      for (let p = 0; p < PAL.length; p++) {
        const pr = PAL[p][0], pg = PAL[p][1], pb = PAL[p][2];
        const dist = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
        if (dist < minDist) { minDist = dist; best = PAL[p]; }
      }
      d[i] = best[0]; d[i + 1] = best[1]; d[i + 2] = best[2];
    }
  }
  ctx.putImageData(img, 0, 0);
}

// Contorno negro limpio de 1px (#050605) optimizado con Uint32Array para evitar tirones de CPU
function applyCleanSpriteOutlineRect(ctx, w, h) {
  const src = ctx.getImageData(0, 0, w, h);
  const out = ctx.createImageData(w, h);
  const s32 = new Uint32Array(src.data.buffer);
  const d32 = new Uint32Array(out.data.buffer);
  d32.set(s32);

  const OUTLINE_COLOR = 0xFF050605;

  for (let y = 1; y < h - 1; y++) {
    if ((y & 63) === 0 || (y & 63) === 63) continue;
    const rowOffset = y * w;
    for (let x = 1; x < w - 1; x++) {
      if ((x & 63) === 0 || (x & 63) === 63) continue;
      const idx = rowOffset + x;
      if ((s32[idx] >>> 24) > 128) continue;

      if (
        (s32[idx - 1] >>> 24) > 128 ||
        (s32[idx + 1] >>> 24) > 128 ||
        (s32[idx - w] >>> 24) > 128 ||
        (s32[idx + w] >>> 24) > 128
      ) {
        d32[idx] = OUTLINE_COLOR;
      }
    }
  }
  ctx.putImageData(out, 0, 0);
}

function makeTexture(canvas, repeat = 1) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  if (repeat > 1) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat, repeat);
  }
  return tex;
}

// ============================================================================
// DIBUJO DE CADA ARMA EN MANO SEGÚN LA DIRECCIÓN (0..7) Y EL ESTADO
// ============================================================================
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

// ============================================================================
// DIBUJO DEL JUGADOR EN 8 DIRECCIONES (Filas 0..7) x 7 ESTADOS (Cols 0..27)
// ============================================================================
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
  const isAtk  = stateIdx === 3 || stateIdx === 5;
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

// ============================================================================
// GENERADOR DE ATLAS DE ENEMIGOS Y BOSSES (Soporta 1, 4 u 8 direcciones)
// ============================================================================
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

function buildEnemyDirectionalSheet(type) {
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

// ============================================================================
// CACHÉ DE ATLAS DE 8 DIRECCIONES x 7 ANIMACIONES DEL JUGADOR (28 cols x 8 rows)
// ============================================================================
const playerLoadoutCache = new Map();

export function getPlayerLoadoutSheet(skills = { slash: 1 }, activeHand = 'slash') {
  const equippedKeys = Object.keys(skills).filter(k => skills[k] > 0).sort().join(',');
  const signature = `${equippedKeys}::${activeHand}::${CONFIG.DIRECTIONAL.USE_MIRRORING}`;

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

// ============================================================================
// GENERADOR DE SPRITES ANIMADOS (4 FRAMES, 256x64) PARA LOS PICKUPS DEL LORE
// 1. pickup_serum: Vial clínico con aguja y suero mutagénico burbujeante (XP)
// 2. pickup_tooth: Molar extraído con empaste de oro y raíz ensangrentada (Moneda)
// 3. pickup_chest: Maletín quirúrgico encadenado con cruz médica (Boss Drop)
// ============================================================================
function buildPickupSheets() {
  // 1. VIAL DE SUERO MUTAGÉNICO (4 frames de burbujeo y pulso luminoso)
  const serumCan = document.createElement('canvas');
  serumCan.width = 256; serumCan.height = 64;
  const sCtx = serumCan.getContext('2d');

  for (let f = 0; f < 4; f++) {
    sCtx.save();
    sCtx.translate(f * 64, 0);
    const px = (x, y, w, h, c) => { sCtx.fillStyle = c; sCtx.fillRect(x, y, w, h); };

    // Aguja hipodérmica superior y émbolo metálico
    px(31, 6, 2, 8, '#c8c2ac');
    px(31, 4, 2, 3, '#e6d7a5');
    px(26, 13, 12, 4, '#877a5c');
    px(24, 17, 16, 4, '#4a2518');
    px(25, 18, 14, 2, '#b89c46'); // Anillo de latón

    // Cuerpo de cristal del vial clínico
    px(21, 21, 22, 30, '#182018');
    px(22, 22, 20, 28, '#243022');

    // Líquido mutagénico carmesí/ámbar con menisco animado
    const wave = (f % 2 === 0) ? 1 : -1;
    px(23, 27 + wave, 18, 22 - wave, '#6e1414');
    px(24, 28 + wave, 16, 20 - wave, '#a52020');
    px(24, 27 + wave, 16, 3, '#b89c46'); // Espuma superficial de suero

    // Burbujas ascendentes según el frame
    const b1Y = 44 - f * 4;
    const b2Y = 40 - ((f + 2) % 4) * 4;
    px(27, b1Y, 3, 3, '#e6d7a5');
    px(34, b2Y, 2, 2, '#b89c46');

    // Reflejo vertical del cristal y marcas de graduación milimétrica
    px(24, 23, 2, 24, '#e6d7a5');
    for (let m = 0; m < 4; m++) {
      px(37, 25 + m * 6, 3, 1, '#c8c2ac');
    }

    // Base metálica inferior con goteo
    px(24, 51, 16, 4, '#4a2518');
    px(26, 52, 12, 2, '#877a5c');
    if (f === 1 || f === 2) {
      px(31, 56 + f, 2, 3, '#a52020');
    }
    sCtx.restore();
  }
  applyCleanSpriteOutlineRect(sCtx, 256, 64);

  // 2. DIENTE EXTRAÍDO CON RAÍZ ENSANGRENTADA (4 frames con destello en empaste de oro)
  const toothCan = document.createElement('canvas');
  toothCan.width = 256; toothCan.height = 64;
  const tCtx = toothCan.getContext('2d');

  for (let f = 0; f < 4; f++) {
    tCtx.save();
    tCtx.translate(f * 64, 0);
    const px = (x, y, w, h, c) => { tCtx.fillStyle = c; tCtx.fillRect(x, y, w, h); };

    // Corona del molar (doble cúspide de marfil sucio)
    px(19, 13, 11, 6, '#e6d7a5');
    px(34, 13, 11, 6, '#e6d7a5');
    px(18, 17, 28, 16, '#c8c2ac');
    px(20, 15, 24, 14, '#e6d7a5');

    // Grieta del esmalte y empaste de oro del cirujano
    px(29, 16, 2, 8, '#4a2518');
    px(33, 16, 9, 7, '#b89c46');
    if (f % 2 === 0) {
      px(35, 17, 5, 4, '#e6d7a5'); // Destello metálico del oro
    }

    // Cuello dental con sarro oxidado
    px(20, 31, 24, 5, '#b89c46');
    px(21, 34, 22, 3, '#743718');

    // Dos raíces largas bifurcadas con restos de encía y sangre
    px(20, 36, 9, 16, '#c8c2ac');
    px(22, 36, 6, 14, '#877a5c');
    px(35, 36, 9, 16, '#c8c2ac');
    px(36, 36, 6, 14, '#877a5c');

    // Puntas de la raíz teñidas de sangre fresca + gota cayendo
    px(21, 46, 7, 8, '#a52020');
    px(22, 52, 4, 4, '#6e1414');
    px(36, 45, 7, 9, '#a52020');
    px(38, 52, 4, 4, '#6e1414');

    const dropY = 54 + f * 2;
    px(24, dropY, 3, 3, '#a52020');
    tCtx.restore();
  }
  applyCleanSpriteOutlineRect(tCtx, 256, 64);

  // 3. MALETÍN QUIRÚRGICO DE BOSS (4 frames con cerradura y cruz médica pulsante)
  const chestCan = document.createElement('canvas');
  chestCan.width = 256; chestCan.height = 64;
  const cCtx = chestCan.getContext('2d');

  for (let f = 0; f < 4; f++) {
    cCtx.save();
    cCtx.translate(f * 64, 0);
    const px = (x, y, w, h, c) => { cCtx.fillStyle = c; cCtx.fillRect(x, y, w, h); };

    // Asa superior de hierro forjado
    px(25, 11, 14, 6, '#4a2518');
    px(27, 13, 10, 4, '#050605');

    // Cuerpo del maletín de acero oxidado
    px(10, 17, 44, 36, '#243022');
    px(12, 19, 40, 32, '#364832');

    // cantoneras de latón y remaches en las esquinas
    px(10, 17, 7, 7, '#b89c46');
    px(47, 17, 7, 7, '#b89c46');
    px(10, 46, 7, 7, '#b89c46');
    px(47, 46, 7, 7, '#b89c46');

    // Correas de cuero verticales con hebillas
    px(18, 17, 5, 36, '#4a2518');
    px(41, 17, 5, 36, '#4a2518');
    px(17, 31, 7, 6, '#b89c46');
    px(40, 31, 7, 6, '#b89c46');

    // Placa central con Cruz Quirúrgica ensangrentada y pulso luminoso
    px(25, 25, 14, 18, '#121812');
    const crossCol = f % 2 === 0 ? '#a52020' : '#e6d7a5';
    px(30, 27, 4, 14, crossCol);
    px(27, 32, 10, 4, crossCol);

    // Manchas de sangre que rezuman de la junta del maletín
    px(12, 34, 40, 2, '#050605');
    px(26, 36, 12, 3, '#6e1414');
    px(29, 38, 4, 6, '#a52020');
    cCtx.restore();
  }
  applyCleanSpriteOutlineRect(cCtx, 256, 64);

  return {
    serum: { name: 'pickup_serum_4f', canvas: serumCan, tex: makeTexture(serumCan) },
    tooth: { name: 'pickup_tooth_4f', canvas: toothCan, tex: makeTexture(toothCan) },
    chest: { name: 'pickup_chest_4f', canvas: chestCan, tex: makeTexture(chestCan) }
  };
}

function buildEnvironmentTextures() {
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
    pickup_chest: pickups.chest
  };
}

// ============================================================================
// GENERADOR DEL ATLAS MAESTRO DE INTERFAZ PIXEL-ART (512x512) - BUCKSHOT STYLE
// ============================================================================

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
  }

  ctx.restore();
}

function buildMasterUIAtlas() {
  const UI = CONFIG.UI_SPRITES;
  const canvas = document.createElement('canvas');
  canvas.width = UI.ATLAS_W;
  canvas.height = UI.ATLAS_H;
  const ctx = canvas.getContext('2d');

  const NS = UI.NINE_SLICE;

  // 1. PANELES Y CONTENEDORES 9-SLICE
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

  // 2. CASILLAS DE INVENTARIO Y TARJETAS DE SUBIDA DE NIVEL
  drawNineSliceBox(ctx, NS.slot_weapon, {
    bg: '#0e130e', speckle: '#364832',
    borderLight: '#877a5c', borderDark: '#4a2518', cornerRivets: true
  });

  drawNineSliceBox(ctx, NS.slot_passive, {
    bg: '#12100b', speckle: '#4a2518',
    borderLight: '#b89c46', borderDark: '#4a2518', cornerRivets: true
  });

  drawNineSliceBox(ctx, NS.slot_empty, {
    bg: '#070907',
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

  // 3. BOTONES INDUSTRIALES (4 ESTADOS)
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

  // 4. BOTONES PRIMARIOS DE SANGRE (4 ESTADOS)
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

  // 5. RELLENOS DE BARRAS EN SPRITE CON SEGMENTOS Y TEXTURA (Y = 152)
  const drawBarFill = (cfg, colTop, colMid, colBot, segEvery = 8) => {
    ctx.save();
    ctx.translate(cfg.x, cfg.y);
    for (let bx = 0; bx < cfg.w; bx++) {
      const isSegLine = (bx % segEvery === segEvery - 1);
      for (let by = 0; by < cfg.h; by++) {
        if (isSegLine) {
          ctx.fillStyle = '#050605';
        } else if (by < 2) {
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

  drawBarFill(UI.BAR_FILLS.hp,   '#e6d7a5', '#c42b2b', '#6e1414', 8);
  drawBarFill(UI.BAR_FILLS.exp,  '#e6d7a5', '#c8a846', '#4a2518', 8);
  drawBarFill(UI.BAR_FILLS.stam, '#a6bf8e', '#527848', '#243022', 6);
  drawBarFill(UI.BAR_FILLS.boss, '#e6d7a5', '#b82525', '#4a2518', 10);

  // 6. ICONOS Y DECORACIÓN 16x16 (Y = 176)
  Object.entries(UI.ICONS).forEach(([key, pos]) => {
    const ix = pos.col * UI.ICON_SIZE;
    const iy = UI.ICONS_ORIGIN_Y + pos.row * UI.ICON_SIZE;
    drawUIIcon16(ctx, key, ix, iy);
  });

  // 7. PLACAS DE NIVEL EN SPRITE (+1 a +8 y --) en Y = 256 (20x12 px cada una)
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

  // 8. CURSORES PIXEL-ART PERSONALIZADOS (Y = 280)
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

function cropAtlasToDataURL(atlasCanvas, rect, scale = 1) {
  const c = document.createElement('canvas');
  c.width = rect.w * scale;
  c.height = rect.h * scale;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    atlasCanvas,
    rect.x, rect.y, rect.w, rect.h,
    0, 0, rect.w * scale, rect.h * scale
  );
  return c.toDataURL('image/png');
}

export function refreshStaticDOMIcons() {
  if (typeof document === 'undefined') return;
  const UI = CONFIG.UI_SPRITES;
  const scale = UI.SCALE;
  document.querySelectorAll('[data-ui-icon]').forEach(el => {
    const key = el.getAttribute('data-ui-icon');
    const pos = UI.ICONS[key] || UI.ICONS.warning;
    const bgX = -(pos.col * UI.ICON_SIZE * scale);
    const bgY = -((UI.ICONS_ORIGIN_Y + pos.row * UI.ICON_SIZE) * scale);
    el.style.backgroundPosition = `${bgX}px ${bgY}px`;
  });
}

export function initUISpritesCSS(customScale = CONFIG.UI_SPRITES.SCALE) {
  const scale = Math.max(1, Math.round(customScale));
  CONFIG.UI_SPRITES.SCALE = scale;

  const UI = CONFIG.UI_SPRITES;
  const atlasCanvas = SpriteSheets.ui_atlas.canvas;
  const root = document.documentElement.style;

  root.setProperty('--ui-scale', String(scale));
  root.setProperty('--ui-atlas', `url("${atlasCanvas.toDataURL('image/png')}")`);
  root.setProperty('--ui-atlas-w', `${UI.ATLAS_W * scale}px`);
  root.setProperty('--ui-atlas-h', `${UI.ATLAS_H * scale}px`);
  root.setProperty('--ui-icon-size', `${UI.ICON_SIZE * scale}px`);
  root.setProperty('--ui-badge-w', `${UI.BADGE_W * scale}px`);
  root.setProperty('--ui-badge-h', `${UI.BADGE_H * scale}px`);

  Object.entries(UI.NINE_SLICE).forEach(([key, cfg]) => {
    const url = cropAtlasToDataURL(atlasCanvas, cfg, 1);
    root.setProperty(`--slice-${key}`, `url("${url}")`);
    root.setProperty(`--slice-${key}-cut`, String(cfg.slice));
    // Para el marco de las barras usamos un grosor compacto (4px) para no aplastar el relleno interior
    const bw = key === 'bar_frame' ? Math.max(3, scale * 2) : cfg.slice * scale;
    root.setProperty(`--slice-${key}-bw`, `${bw}px`);
  });

  Object.entries(UI.BAR_FILLS).forEach(([key, cfg]) => {
    const url = cropAtlasToDataURL(atlasCanvas, cfg, scale);
    root.setProperty(`--bar-fill-${key}`, `url("${url}")`);
  });

  Object.entries(UI.CURSORS).forEach(([key, cfg]) => {
    const url = cropAtlasToDataURL(atlasCanvas, cfg, scale);
    root.setProperty(`--cursor-${key}`, `url("${url}") ${cfg.hotX * scale} ${cfg.hotY * scale}`);
  });

  refreshStaticDOMIcons();
}

export function renderSpriteIconHTML(iconKey, extraClass = '') {
  const UI = CONFIG.UI_SPRITES;
  const scale = UI.SCALE;
  const pos = UI.ICONS[iconKey] || UI.ICONS.warning;
  const bgX = -(pos.col * UI.ICON_SIZE * scale);
  const bgY = -((UI.ICONS_ORIGIN_Y + pos.row * UI.ICON_SIZE) * scale);
  return `<span class="ui-icon ${extraClass}" data-ui-icon="${iconKey}" style="background-position: ${bgX}px ${bgY}px;" aria-hidden="true"></span>`;
}

export function renderSpriteBadgeHTML(level = 0, extraClass = '') {
  const UI = CONFIG.UI_SPRITES;
  const scale = UI.SCALE;
  const clamped = Math.max(0, Math.min(8, level));
  const bgX = -(clamped * UI.BADGE_W * scale);
  const bgY = -(UI.BADGES_ORIGIN_Y * scale);
  return `<span class="ui-lvl-badge ${extraClass}" style="background-position: ${bgX}px ${bgY}px;" aria-label="+${clamped}"></span>`;
}

export const SpriteSheets = {
  player:       null,
  zombie:       buildEnemyDirectionalSheet('zombie'),
  weeper:       buildEnemyDirectionalSheet('weeper'),
  worm:         buildEnemyDirectionalSheet('worm'),
  boss_butcher: buildEnemyDirectionalSheet('boss_butcher'),
  boss_siren:   buildEnemyDirectionalSheet('boss_siren'),
  boss_furnace: buildEnemyDirectionalSheet('boss_furnace'),
  boss_apostle: buildEnemyDirectionalSheet('boss_apostle'),
  boss_warden:  buildEnemyDirectionalSheet('boss_warden'),
  env:          buildEnvironmentTextures(),
  ui_atlas:     buildMasterUIAtlas()
};

SpriteSheets.player = getPlayerLoadoutSheet({ slash: 1 }, 'slash');
initUISpritesCSS(CONFIG.UI_SPRITES.SCALE);