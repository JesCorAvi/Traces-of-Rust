// Sprites procedurales de cangrejos y construcción de su hoja direccional.
// Cada tipo conserva su silueta de combate (corredor, tanque, nido, etc.),
// pero todos pertenecen a la misma familia de crustáceos de arrecife.
// Exports: buildEnemyDirectionalSheet.

import { CONFIG } from '../../config.js';
import { applyCleanSpriteOutlineRect, makeTexture } from '../spritePalette.js';

const CRAB_STYLES = {
  zombie: {
    shell: '#cf4a45', dark: '#7b2531', light: '#ff9670', belly: '#f4b07e',
    leg: '#b94a40', legDark: '#5d2028', claw: '#e76552', clawLight: '#ffac82',
    eye: '#fff0c7', barnacles: true, bodyW: 34, bodyH: 18, bodyY: 25
  },
  weeper: {
    shell: '#7b5fb8', dark: '#3e2a68', light: '#d0a6ff', belly: '#e5c7f3',
    leg: '#6b4fa0', legDark: '#2f204d', claw: '#9d7bdb', clawLight: '#d8b8ff',
    eye: '#c7f7ff', spitter: true, bodyW: 33, bodyH: 19, bodyY: 24
  },
  worm: {
    shell: '#f18b5f', dark: '#8f3b33', light: '#ffd0a0', belly: '#ffe5be',
    leg: '#d56d4b', legDark: '#68302b', claw: '#ffab78', clawLight: '#ffe0bd',
    eye: '#fff7d6', small: true, bodyW: 23, bodyH: 13, bodyY: 38
  },
  runner: {
    shell: '#ee8f36', dark: '#8d431b', light: '#ffd06d', belly: '#ffe6ae',
    leg: '#d9772e', legDark: '#643116', claw: '#ffb14f', clawLight: '#ffe09b',
    eye: '#fff3c4', longLegs: true, speedLines: true, bodyW: 32, bodyH: 16, bodyY: 26
  },
  hulk: {
    shell: '#4f8175', dark: '#244a48', light: '#9cdbc0', belly: '#c8e7cd',
    leg: '#416f65', legDark: '#1b3b39', claw: '#6ba88f', clawLight: '#c4efcf',
    eye: '#f6ffcf', barnacles: true, hugeClaws: true, bodyW: 42, bodyH: 23, bodyY: 22
  },
  nest: {
    shell: '#b96f98', dark: '#63314e', light: '#f7b1cc', belly: '#ffd4df',
    leg: '#9a587d', legDark: '#49243a', claw: '#d88eae', clawLight: '#ffd0de',
    eye: '#e9ff9d', nest: true, bodyW: 36, bodyH: 20, bodyY: 24
  },
  regenerator: {
    shell: '#5f9d57', dark: '#2e5a39', light: '#b7e58e', belly: '#e4f4c0',
    leg: '#4e824a', legDark: '#24452c', claw: '#7fbd67', clawLight: '#d8f5ae',
    eye: '#d7ff83', healer: true, seaweed: true, bodyW: 33, bodyH: 20, bodyY: 24
  },
  splitter: {
    shell: '#d98a31', dark: '#7b471c', light: '#ffd074', belly: '#ffe8b8',
    leg: '#b96d2b', legDark: '#5a3115', claw: '#f0a845', clawLight: '#ffe09b',
    eye: '#fff6cf', split: true, bodyW: 39, bodyH: 19, bodyY: 24
  },
  boss_butcher: {
    shell: '#a9383b', dark: '#55191f', light: '#f4806c', belly: '#eab084',
    leg: '#8c2e33', legDark: '#3e1117', claw: '#d35448', clawLight: '#ffac87',
    eye: '#ffebc2', boss: true, butcher: true, barnacles: true,
    bodyW: 40, bodyH: 23, bodyY: 21
  },
  boss_siren: {
    shell: '#c34f9d', dark: '#65264f', light: '#ffadd6', belly: '#ffd1e4',
    leg: '#a6407f', legDark: '#4a1c38', claw: '#e56cb8', clawLight: '#ffc3e7',
    eye: '#fff2f9', boss: true, siren: true, coral: true,
    bodyW: 38, bodyH: 23, bodyY: 21
  },
  boss_furnace: {
    shell: '#5a4038', dark: '#261817', light: '#a86b45', belly: '#e09052',
    leg: '#4a312c', legDark: '#1c1111', claw: '#7b4b38', clawLight: '#ffb060',
    eye: '#ffbd45', boss: true, furnace: true,
    bodyW: 42, bodyH: 24, bodyY: 21
  },
  boss_apostle: {
    shell: '#85b3a8', dark: '#3e6d6c', light: '#e2f0cf', belly: '#f6f0ce',
    leg: '#6f9b91', legDark: '#335551', claw: '#a8d0ba', clawLight: '#f7ffd9',
    eye: '#fffbd4', boss: true, apostle: true,
    bodyW: 38, bodyH: 23, bodyY: 21
  },
  boss_warden: {
    shell: '#9c7b55', dark: '#4d3527', light: '#e7bf83', belly: '#f2d9a6',
    leg: '#7d5c3d', legDark: '#38251a', claw: '#c49a62', clawLight: '#ffe0a2',
    eye: '#ffe27a', boss: true, warden: true, barnacles: true,
    bodyW: 42, bodyH: 24, bodyY: 20
  }
};

function drawCrabFrame(ctx, gCtx, type, dirRow, stateCol, ox, oy, numDirs = 1) {
  ctx.save(); gCtx.save();
  ctx.translate(ox, oy); gCtx.translate(ox, oy);

  const style = CRAB_STYLES[type] || CRAB_STYLES.zombie;
  const row = Math.min(3, Math.floor(stateCol / 4));
  const col = stateCol % 4;
  const phase = (col / 4) * Math.PI * 2;
  const isIdle = row === 0;
  const isWalk = row === 1;
  const isAtk = row === 2;
  const isHurt = row === 3;

  const isLeftView = (numDirs === 4 && dirRow === 3) || (numDirs === 8 && dirRow >= 5);
  if (isLeftView) {
    ctx.translate(64, 0); ctx.scale(-1, 1);
    gCtx.translate(64, 0); gCtx.scale(-1, 1);
  }

  const isBack = numDirs > 1 && dirRow === 0;
  const bob = isWalk ? Math.round(Math.abs(Math.sin(phase)) * 2.2) : (isIdle ? (col % 2) : 0);
  const hurtShake = isHurt ? (col % 2 === 0 ? -3 : 3) : 0;
  const collapseY = (isHurt && col >= 2) ? (col - 1) * 6 : 0;
  const floatY = style.apostle ? Math.round(Math.sin(phase) * 2) : 0;
  const atkLunge = isAtk ? (col < 2 ? -3 : -1) : 0;

  ctx.translate(hurtShake + atkLunge, bob + collapseY + floatY);
  gCtx.translate(hurtShake + atkLunge, bob + collapseY + floatY);

  const px = (x, y, w, h, color) => {
    if (w <= 0 || h <= 0) return;
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  const glow = (x, y, w, h, color = style.eye) => {
    if (w <= 0 || h <= 0) return;
    px(x, y, w, h, color);
    gCtx.fillStyle = color;
    gCtx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  const line = (x0, y0, x1, y1, thickness, color) => {
    // Línea pixelada por Bresenham, útil para patas y grietas.
    let x = Math.round(x0), y = Math.round(y0);
    const xEnd = Math.round(x1), yEnd = Math.round(y1);
    const dx = Math.abs(xEnd - x), dy = Math.abs(yEnd - y);
    const sx = x < xEnd ? 1 : -1, sy = y < yEnd ? 1 : -1;
    let err = dx - dy;
    let guard = 0;
    while (guard++ < 80) {
      px(x, y, thickness, thickness, color);
      if (x === xEnd && y === yEnd) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
  };

  const cx = 32;
  const bw = style.bodyW;
  const bh = style.bodyH;
  const bodyY = style.bodyY;
  const bodyBottom = bodyY + bh;
  const bodyX = cx - Math.floor(bw / 2);
  const clawLift = isAtk ? (col < 2 ? -6 : -2) : (isIdle ? (col % 2) : 0);
  const clawOpen = isAtk ? (col < 2 ? 4 : 1) : 0;

  // ---------------------------------------------------------------------
  // Patas (se dibujan detrás del caparazón)
  // ---------------------------------------------------------------------
  const legPairs = style.small ? 2 : 3;
  for (const side of [-1, 1]) {
    for (let i = 0; i < legPairs; i++) {
      const lift = isWalk ? Math.round(Math.sin(phase + i * 1.6 + (side > 0 ? Math.PI : 0)) * 2.4) : 0;
      const baseX = side < 0 ? bodyX + 1 : bodyX + bw - 2;
      const baseY = bodyY + 7 + i * (style.longLegs ? 5 : 6);
      const reach = style.longLegs ? 12 : (style.hugeClaws ? 10 : 8);
      const drop = style.longLegs ? 10 : 7;
      const kneeX = baseX + side * reach;
      const kneeY = baseY + 2 - lift;
      const footX = kneeX + side * (style.longLegs ? 7 : 5);
      const footY = Math.min(58, bodyBottom + drop + i * 2 + lift);
      line(baseX, baseY, kneeX, kneeY, 3, style.legDark);
      line(kneeX, kneeY, footX, footY, 2, style.leg);
      px(footX - (side < 0 ? 1 : 0), footY, 4, 2, style.legDark);
    }
  }

  // Sombra de contacto / salpicadura de arena.
  if (!style.apostle) {
    px(cx - bw / 2 + 2, 56, bw - 4, 2, 'rgba(70, 34, 22, 0.28)');
  }

  // ---------------------------------------------------------------------
  // Pinzas (detrás del cuerpo, una a cada lado)
  // ---------------------------------------------------------------------
  for (const side of [-1, 1]) {
    const shoulderX = cx + side * (Math.floor(bw / 2) - 2);
    const clawW = style.hugeClaws ? 12 : 9;
    const clawH = style.hugeClaws ? 14 : 11;
    const clawCenterX = cx + side * 25;
    const clawDrawX = clawCenterX - Math.floor(clawW / 2);
    const clawY = bodyY + 5 + clawLift + (side > 0 ? 1 : 0);
    const armInnerX = clawDrawX + (side < 0 ? clawW - 2 : 0);
    const armX0 = Math.min(shoulderX, armInnerX);
    const armX1 = Math.max(shoulderX, armInnerX);
    px(armX0, clawY + 2, armX1 - armX0 + 2, 4, style.legDark);
    px(armX0, clawY + 1, armX1 - armX0 + 2, 2, style.leg);

    // Muñeca y cuerpo de la pinza.
    px(clawDrawX, clawY, clawW, clawH, style.legDark);
    px(clawDrawX + 2, clawY + 2, clawW - 4, clawH - 4, style.claw);
    px(clawDrawX + 2, clawY + 2, clawW - 4, 2, style.clawLight);

    // Muesca de la pinza, orientada hacia delante.
    const gapY = clawY + Math.floor(clawH / 2) - 1;
    const gapX = side < 0 ? clawDrawX + clawW - 4 : clawDrawX + 1;
    px(gapX, gapY - clawOpen, 3, 2, '#07181c');
    px(gapX, gapY + 2, 3, 2, '#07181c');
    if (clawOpen > 1) {
      px(gapX + (side < 0 ? -1 : 3), gapY - clawOpen - 1, 2, 2, style.clawLight);
      px(gapX + (side < 0 ? -1 : 3), gapY + 3, 2, 2, style.clawLight);
    }

    if (style.butcher && side > 0) {
      // Filo de carnicero incrustado en la pinza.
      px(clawDrawX + clawW - 4, clawY - 1, 4, 6, '#d8d2b8');
      px(clawDrawX + clawW - 3, clawY - 3, 2, 6, '#fff0cf');
      px(clawDrawX + clawW - 2, clawY + 1, 1, 3, '#8a2e2d');
    }
    if (style.warden && side < 0) {
      // Tres púas de tridente sobre la pinza izquierda.
      for (let s = -1; s <= 1; s++) {
        px(clawDrawX + 2 + s * 3, clawY - 6, 2, 7, '#fff0c7');
        px(clawDrawX + 2 + s * 3, clawY - 7, 2, 2, '#e9ce94');
      }
    }
    if (isAtk) {
      glow(clawDrawX + (side < 0 ? 1 : clawW - 3), clawY + 2, 2, 3, style.clawLight);
    }
  }

  // ---------------------------------------------------------------------
  // Caparazón
  // ---------------------------------------------------------------------
  // Sombra inferior y borde.
  px(bodyX + 2, bodyY + bh - 4, bw - 4, 5, style.dark);
  px(bodyX, bodyY + 3, bw, bh - 6, style.dark);
  px(bodyX + 2, bodyY, bw - 4, bh - 2, style.shell);
  px(bodyX + 5, bodyY + 2, bw - 10, bh - 6, style.light);
  px(bodyX + 4, bodyBottom - 4, bw - 8, 3, style.belly);

  // Placas y nervaduras del caparazón.
  px(bodyX + Math.floor(bw * 0.42), bodyY + 3, 3, bh - 8, style.dark);
  for (let s = 0; s < 3; s++) {
    const sx = bodyX + 5 + Math.floor(s * (bw - 12) / 2.6);
    px(sx, bodyY + 4, 3, 4, style.shell);
    px(sx + 1, bodyY + 3, 1, 2, style.clawLight);
  }
  px(bodyX + 3, bodyY + bh - 7, bw - 6, 2, style.dark);

  if (isBack) {
    // Vista trasera: caparazón con máculas y sin rostro.
    for (let s = 0; s < 4; s++) {
      const sx = bodyX + 6 + ((s * 11 + col * 3) % Math.max(6, bw - 12));
      const sy = bodyY + 5 + ((s * 7) % Math.max(4, bh - 10));
      px(sx, sy, 3, 2, style.dark);
      px(sx + 1, sy, 1, 1, style.clawLight);
    }
  }

  if (style.barnacles) {
    for (let b = 0; b < 4; b++) {
      const bx = bodyX + 7 + ((b * 9 + col) % Math.max(6, bw - 14));
      const by = bodyY + 4 + ((b * 5) % Math.max(4, bh - 10));
      px(bx - 1, by, 4, 3, style.dark);
      px(bx, by + 1, 2, 1, '#f1e1bd');
    }
  }

  if (style.seaweed) {
    line(bodyX + 4, bodyY + 2, bodyX - 1, bodyY - 8, 2, '#477c38');
    line(bodyX + bw - 5, bodyY + 2, bodyX + bw + 1, bodyY - 9, 2, '#78b84d');
    glow(bodyX - 2, bodyY - 9, 3, 3, '#d7ff83');
    glow(bodyX + bw, bodyY - 10, 3, 3, '#b7e58e');
  }

  if (style.coral) {
    for (let c = 0; c < 5; c++) {
      const sx = bodyX + 7 + c * Math.floor((bw - 14) / 4);
      line(sx, bodyY, sx - 2 + c % 2 * 4, bodyY - 7 - (c % 3) * 2, 2, '#ff8bc9');
      glow(sx - 1 + c % 2 * 4, bodyY - 9 - (c % 3) * 2, 2, 2, '#ffe3a5');
    }
  }

  if (style.furnace) {
    for (let c = 0; c < 4; c++) {
      const sx = bodyX + 5 + c * Math.floor((bw - 10) / 3);
      line(sx, bodyY + 3, sx + (c % 2 ? 4 : -3), bodyBottom - 3, 2, '#2a1816');
      line(sx + 1, bodyY + 6, sx + (c % 2 ? 3 : -2), bodyBottom - 5, 1, '#ff8b42');
      glow(sx + 1, bodyY + 8 + c * 2, 2, 2, '#ffbd45');
    }
    px(bodyX + 6, bodyBottom - 5, bw - 12, 2, '#ff8b42');
  }

  if (style.apostle) {
    for (let a = 0; a < 7; a++) {
      const ang = (a / 7) * Math.PI * 2 + phase * 0.2;
      const hx = cx + Math.cos(ang) * 27;
      const hy = bodyY + 10 + Math.sin(ang) * 17;
      glow(hx, hy, 3, 3, '#fff3a5');
    }
    px(bodyX + 4, bodyY + 4, bw - 8, 2, '#fff7c9');
  }

  if (style.nest) {
    for (let e = 0; e < 7; e++) {
      const ex = bodyX + 4 + (e * 5) % Math.max(4, bw - 10);
      const ey = bodyY - 5 + (e % 3) * 4;
      px(ex - 1, ey, 4, 4, style.dark);
      glow(ex, ey + 1, 2, 2, '#d7ff83');
      px(ex + 1, ey + 1, 1, 1, '#f5ffd0');
    }
  }

  if (style.split) {
    px(cx - 1, bodyY + 1, 2, bh - 2, style.dark);
    px(cx - 4, bodyY + 3, 2, bh - 8, style.light);
    px(cx + 3, bodyY + 3, 2, bh - 8, style.light);
    // Dos pares de ojos pequeños para el cangrejo gemelo.
    if (!isBack) {
      for (const ex of [-9, -4, 4, 9]) {
        glow(cx + ex, bodyY - 5, 4, 4, style.eye);
        px(cx + ex + 1, bodyY - 4, 2, 2, '#07181c');
      }
    }
  }

  if (style.warden) {
    // Gran caracola de ermitaño en la espalda.
    for (let s = 0; s < 4; s++) {
      const r = 12 - s * 3;
      px(bodyX - 10 + s * 2, bodyY + 1 + s * 2, r, 3, s % 2 ? '#e7bf83' : '#9c7b55');
    }
    px(bodyX - 13, bodyY + 6, 8, 8, '#4d3527');
    px(bodyX - 11, bodyY + 7, 4, 4, '#f2d9a6');
  }

  // Placa central brillante de los jefes.
  if (style.boss) {
    glow(cx - 2, bodyY + Math.floor(bh / 2) - 2, 5, 5, style.boss === 'warden' ? '#ffe27a' : style.clawLight);
    px(cx - 1, bodyY + Math.floor(bh / 2) - 1, 3, 3, style.dark);
  }

  // ---------------------------------------------------------------------
  // Cabeza, ojos y boca
  // ---------------------------------------------------------------------
  if (!isBack) {
    const eyeY = bodyY - (style.small ? 3 : 7);
    const eyeGap = style.small ? 7 : 11;
    const eyeSize = style.small ? 6 : (style.hugeClaws || style.boss ? 7 : 6);

    for (const side of [-1, 1]) {
      const stalkX = cx + side * eyeGap - 1;
      px(stalkX, eyeY + 4, 3, 7, style.legDark);
      px(stalkX + 1, eyeY + 4, 1, 5, style.claw);
      px(stalkX - 1, eyeY, eyeSize, eyeSize, '#07181c');
      glow(stalkX + 1, eyeY + 1, eyeSize - 2, eyeSize - 3, style.eye);
      const look = isAtk ? 1 : (isWalk ? (col % 2 ? 1 : 0) : 1);
      px(stalkX + 1 + look, eyeY + 3, 2, 3, '#07181c');
    }

    if (style.spitter) {
      // Boca-vertedero con glande bioluminiscente.
      const mouthW = isAtk ? 15 : 12;
      px(cx - mouthW / 2, bodyBottom - 5, mouthW, 8, '#162b33');
      px(cx - mouthW / 2 + 2, bodyBottom - 4, mouthW - 4, 3, '#3e7f91');
      glow(cx - 3, bodyBottom - 2, 7, 3, isAtk ? '#ffffff' : '#8ef7ef');
      if (isAtk) {
        glow(cx - 7, bodyBottom, 5, 5, '#bffcff');
        glow(cx + 3, bodyBottom - 1, 4, 4, '#bffcff');
      }
    } else {
      const mouthW = isAtk ? 10 : 7;
      px(cx - mouthW / 2, bodyBottom - 5, mouthW, 2, '#07181c');
      if (isAtk) {
        px(cx - 3, bodyBottom - 4, 6, 4, '#5d2028');
        px(cx - 2, bodyBottom - 3, 1, 2, '#fff0c7');
        px(cx + 2, bodyBottom - 3, 1, 2, '#fff0c7');
      }
    }

    // Burbujas y espuma.
    if ((isAtk || (isIdle && col === 3)) && style.spitter) {
      glow(cx + 12, bodyY + 2, 2, 2, '#9df7ef');
      glow(cx + 16, bodyY - 3, 2, 2, '#d7fffa');
    }
  } else {
    // Cola/abdomen visible al girar.
    px(cx - 7, bodyBottom - 2, 14, 5, style.belly);
    px(cx - 4, bodyBottom + 1, 8, 2, style.dark);
  }

  if (style.speedLines) {
    const speed = isWalk ? 4 : 2;
    px(bodyX - 5, bodyY + 4, speed, 1, '#ffe3a2');
    px(bodyX - 7, bodyY + 9, speed + 2, 1, '#ffc56b');
    px(bodyX + bw + 1, bodyY + 6, speed, 1, '#ffe3a2');
  }

  if (style.butcher) {
    // Cuernos de caparazón.
    px(bodyX + 5, bodyY - 4, 4, 5, '#e2c29b');
    px(bodyX + bw - 9, bodyY - 4, 4, 5, '#e2c29b');
    px(bodyX + 6, bodyY - 6, 2, 3, '#fff0c7');
    px(bodyX + bw - 8, bodyY - 6, 2, 3, '#fff0c7');
  }

  if (style.furnace) {
    glow(bodyX + 3, bodyY - 3, 4, 3, '#ff8b42');
    glow(bodyX + bw - 7, bodyY - 4, 4, 3, '#ffbd45');
  }

  if (style.siren) {
    // Perlas de coral y aletas laterales.
    glow(bodyX + 4, bodyY + 5, 3, 3, '#ffc3e7');
    glow(bodyX + bw - 7, bodyY + 5, 3, 3, '#ffe3a5');
    for (let f = 0; f < 3; f++) {
      px(bodyX - 4, bodyY + 6 + f * 4, 4, 2, '#ff8bc9');
      px(bodyX + bw, bodyY + 6 + f * 4, 4, 2, '#ff8bc9');
    }
  }

  if (style.warden) {
    // Corona de percebes del guardián.
    for (let c = 0; c < 4; c++) {
      px(cx - 12 + c * 8, bodyY - 5 - (c % 2) * 2, 4, 4, '#ffe0a2');
    }
  }

  if (isHurt) {
    for (let s = 0; s < 5; s++) {
      px(16 + ((s * 11 + col * 7) % 32), 14 + ((s * 13 + col * 5) % 32), 3, 3, '#d84a44');
    }
    px(cx - 5, bodyY + 7, 3, 3, '#fff0c7');
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
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = w; glowCanvas.height = h;
  const gCtx = glowCanvas.getContext('2d');

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      drawCrabFrame(ctx, gCtx, type, r, c, c * CONFIG.FRAME_SIZE, r * CONFIG.FRAME_SIZE, numDirs);
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
