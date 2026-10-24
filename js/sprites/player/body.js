// Dibujo procedural del cuerpo 8-direcciones del jugador con skins temáticas para los 8 operadores.
// Exports: CHARACTER_THEMES, drawPlayer8DirCell.

import { CONFIG } from '../../config.js';
import { renderWeaponByDirection } from './weapons.js';

export const CHARACTER_THEMES = {
  otto: {
    // Otto "Salvavidas": camisa de lino clara y visera de socorrista al atardecer.
    coatBase: '#f2d7a6', coatHi: '#fff0c7', coatDark: '#c08b5a', coatTrim: '#e4574d',
    belt: '#2a6b68', buckle: '#ffcf68',
    legs: '#24565b', boots: '#17393d', bootTrim: '#63c8bd',
    maskBase: '#8c4b32', maskHi: '#d99b6a', eyeGlow: '#5ff3e3',
    feature: 'head_mirror'
  },
  mack: {
    // Mack "Pescador": camisa de faena caqui, sombrero de fieltro y puro.
    coatBase: '#5f8a56', coatHi: '#8bb86f', coatDark: '#35543c', coatTrim: '#ffd06b',
    belt: '#603a23', buckle: '#ffe08a',
    legs: '#425b36', boots: '#263024', bootTrim: '#8fae68',
    maskBase: '#d2a36f', maskHi: '#f0c894', eyeGlow: '#ffb347',
    feature: 'cigar_helmet'
  },
  pepe: {
    // Pepe "Parrilla": delantal coral y gafas de sol turquesa frente al asador.
    coatBase: '#ff8a46', coatHi: '#ffc46b', coatDark: '#a94a26', coatTrim: '#fff0c7',
    belt: '#4f2b1b', buckle: '#ffe08a',
    legs: '#c66b32', boots: '#462617', bootTrim: '#ffbd66',
    maskBase: '#5a3323', maskHi: '#a8643b', eyeGlow: '#6df4e8',
    feature: 'goggles_tank'
  },
  morbo: {
    // Morbo "Marea": vidente del arrecife con velo de espuma y algas.
    coatBase: '#2a8b86', coatHi: '#6ed6c4', coatDark: '#135453', coatTrim: '#fff0c7',
    belt: '#1d4849', buckle: '#ffd06b',
    legs: '#163f49', boots: '#0d2832', bootTrim: '#57b7ac',
    maskBase: '#e8d6b4', maskHi: '#fff0d4', eyeGlow: '#a9ff8c',
    feature: 'nun_veil'
  },
  bob: {
    // Bob "Castillos": chaleco coral de socorrista y casco amarillo de obra.
    coatBase: '#ff7a4e', coatHi: '#ffb15d', coatDark: '#a23e2b', coatTrim: '#fff0c7',
    belt: '#3e2c1c', buckle: '#ffe08a',
    legs: '#39758a', boots: '#173a46', bootTrim: '#6fd1dd',
    maskBase: '#ffd06b', maskHi: '#fff0c7', eyeGlow: '#ffffff',
    feature: 'hardhat'
  },
  krauss: {
    // Krauss "Capitán": gorra marina azul y chubasquero amarillo de tormenta.
    coatBase: '#e4b53f', coatHi: '#ffd66f', coatDark: '#9a6c1f', coatTrim: '#f5f0d0',
    belt: '#2c3e4a', buckle: '#ffcf68',
    legs: '#243a46', boots: '#122730', bootTrim: '#f7e4b0',
    maskBase: '#a66742', maskHi: '#dfab7c', eyeGlow: '#ff6a52',
    feature: 'captain_cap'
  },
  axel: {
    // Axel "Escualo": socorrista de élite con máscara de buceo y neopreno coral.
    coatBase: '#d34d48', coatHi: '#ff8a68', coatDark: '#7e2832', coatTrim: '#ffe2a6',
    belt: '#31211b', buckle: '#d8d2b8',
    legs: '#1e4a50', boots: '#102d34', bootTrim: '#63c8bd',
    maskBase: '#673b2e', maskHi: '#b77350', eyeGlow: '#ff8a68',
    feature: 'butcher_mask'
  },
  tesla: {
    // Tesla "Tormenta": técnico de tormentas con aislamiento turquesa y chispas.
    coatBase: '#1d7c82', coatHi: '#51c9bd', coatDark: '#0d4149', coatTrim: '#ffcf68',
    belt: '#102f36', buckle: '#6df4e8',
    legs: '#123b44', boots: '#0b242c', bootTrim: '#6df4e8',
    maskBase: '#7a4d34', maskHi: '#bd8b64', eyeGlow: '#6df4e8',
    feature: 'electric_sparks'
  },
  cook: {
    // El cocinero del chiringuito: camisa hawaiana, delantal y bandana isleña.
    coatBase: '#efc45b', coatHi: '#ffe59a', coatDark: '#b57535', coatTrim: '#f7ead0',
    belt: '#3e6f68', buckle: '#f2c15b',
    legs: '#2e6d72', boots: '#42372b', bootTrim: '#d8ad6a',
    maskBase: '#c98d61', maskHi: '#efc39c', eyeGlow: '#66e0d2',
    feature: 'chef_bandana'
  }
};

export function drawPlayer8DirCell(ctx, gCtx, dir, stateIdx, col, ox, oy, skills = { slash: 1 }, activeHand = 'slash', charId = 'otto') {
  ctx.save(); gCtx.save();
  ctx.translate(ox, oy); gCtx.translate(ox, oy);

  const theme = CHARACTER_THEMES[charId] || CHARACTER_THEMES.otto;

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
    if (w <= 0 || h <= 0) return;
    const x0 = Math.max(1, Math.min(62, Math.round(x)));
    const y0 = Math.max(1, Math.min(62, Math.round(y)));
    const x1 = Math.max(x0, Math.min(63, Math.round(x + w)));
    const y1 = Math.max(y0, Math.min(63, Math.round(y + h)));
    if (x1 > x0 && y1 > y0) {
      ctx.fillStyle = color;
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    }
  };

  const glow = (x, y, w, h, color = '#e6d7a5') => {
    px(x, y, w, h, color);
    const x0 = Math.max(1, Math.min(62, Math.round(x)));
    const y0 = Math.max(1, Math.min(62, Math.round(y)));
    const x1 = Math.max(x0, Math.min(63, Math.round(x + w)));
    const y1 = Math.max(y0, Math.min(63, Math.round(y + h)));
    if (x1 > x0 && y1 > y0) {
      gCtx.fillStyle = color;
      gCtx.fillRect(x0, y0, x1 - x0, y1 - y0);
    }
  };

  // Estelas en dash
  if (isDash) {
    const trailDir = isSideProfile ? -facingSign : 1;
    glow(14 - col * 2 * trailDir, 16 + (col % 2) * 4, 7, 1, '#b89c46');
    glow(12 - col * 3 * trailDir, 28 - (col % 2) * 3, 9, 1, '#e6d7a5');
    glow(15 - col * 2 * trailDir, 42 + (col % 2) * 2, 6, 1, '#b89c46');
  }

  // Arma en vista trasera
  if (isBackView) {
    const anchorX = effectiveDir === 0 ? 38 : (effectiveDir === 1 ? 37 : 22);
    renderWeaponByDirection(px, glow, activeHand, effectiveDir, stateIdx, col, anchorX, 26, facingSign);
  }

  // Mochila o accesorios posteriores
  if (!isBackView) {
    const packX = effectiveDir === 2 ? 17 : effectiveDir === 6 ? 37 : (effectiveDir === 3 ? 17 : 37);
    if ((skills.flamethrower || charId === 'pepe') && effectiveDir !== 4) {
      px(packX, 20, 5, 14, '#6e1414');
      px(packX + 1, 21, 3, 12, '#a52020');
      glow(packX + 1, 23, 3, 2, '#ffcc00');
    } else if (skills.shotgun && activeHand !== 'shotgun') {
      px(packX + 1, 11, 2, 9, '#877a5c');
    }
  }

  // Piernas y pisada
  const stride = isDash
    ? 5
    : isWalk
      ? Math.round(Math.sin(phase) * 3.5)
      : (isJump ? (col === 1 || col === 2 ? -3 : 1) : 0);

  if (isSideProfile) {
    const legBackX = 27 - stride * facingSign;
    const legFrontX = 27 + stride * facingSign;
    const dashLift = isDash ? -3 : 0;
    px(legBackX, 44 + dashLift, 5, 9, theme.legs);
    px(legBackX, 53 + dashLift, 6, 6, theme.boots);
    px(legFrontX, 44 + dashLift, 5, 9, theme.legs);
    px(legFrontX + 1, 44 + dashLift, 2, 9, theme.bootTrim);
    px(legFrontX, 53 + dashLift, 6, 6, theme.boots);
    px(legFrontX + 1, 53 + dashLift, 4, 2, theme.belt);
    px(legFrontX, 58 + dashLift, 6, 1, theme.bootTrim);
  } else {
    const stepL = isJump ? stride : (isDash ? -3 : stride);
    const stepR = isJump ? stride : (isDash ? 2 : -stride);
    px(22, 44 + stepL, 5, 9, theme.legs);
    px(23, 44 + stepL, 2, 9, theme.bootTrim);
    px(21, 53 + stepL, 6, 6, theme.boots);
    px(22, 53 + stepL, 4, 2, theme.belt);
    px(21, 58 + stepL, 6, 1, theme.bootTrim);
    px(31, 44 + stepR, 5, 9, theme.legs);
    px(32, 44 + stepR, 2, 9, theme.bootTrim);
    px(31, 53 + stepR, 6, 6, theme.boots);
    px(32, 53 + stepR, 4, 2, theme.belt);
    px(31, 58 + stepR, 6, 1, theme.bootTrim);
  }

  // Torso y abrigo temático
  const coatFlare = isDash ? 4 : (isJump && (col === 1 || col === 2) ? 2 : (isWalk && col % 2 === 0 ? 1 : 0));

  if (isSideProfile) {
    px(24 - coatFlare, 35, 11 + coatFlare * 2, 10, theme.coatDark);
    px(25, 35, 8, 9, theme.coatBase);
    px(24, 21, 11, 14, theme.coatDark);
    px(26, 21, 7, 13, theme.coatBase);
    px(27 + facingSign, 22, 4, 11, theme.coatHi);
    px(24, 34, 11, 2, theme.belt);
    px(29 + facingSign * 3, 34, 2, 2, theme.buckle);
  } else {
    px(20 - coatFlare, 36, 7, 10, theme.coatDark);
    px(21 - coatFlare, 36, 4, 9, theme.coatBase);
    px(31 + coatFlare, 36, 7, 10, theme.coatDark);
    px(32 + coatFlare, 36, 4, 9, theme.coatBase);

    px(20, 21, 18, 9, theme.coatDark);
    px(22, 21, 14, 9, theme.coatBase);
    px(22, 30, 14, 6, theme.coatHi);
    px(22, 34, 14, 2, theme.belt);

    if (isBackView) {
      px(23, 22, 12, 3, theme.coatTrim);
      px(28, 22, 2, 12, theme.coatDark);
      px(21, 22, 2, 12, theme.belt);
      px(35, 22, 2, 12, theme.belt);

      const backShift = effectiveDir === 1 ? -3 : effectiveDir === 7 ? 3 : 0;
      if (skills.flamethrower || charId === 'pepe') {
        px(24 + backShift, 20, 9, 14, '#6e1414');
        px(26 + backShift, 21, 5, 12, '#a52020');
        glow(27 + backShift, 18, 3, 2, '#ffcc00');
      } else {
        px(25 + backShift, 22, 8, 10, theme.belt);
        px(26 + backShift, 23, 6, 8, theme.coatDark);
      }
    } else {
      const frontShift = effectiveDir === 3 ? 1 : effectiveDir === 5 ? -1 : 0;
      px(23, 22, 4, 12, theme.coatTrim);
      px(31, 22, 4, 12, theme.coatTrim);
      px(27 + frontShift, 22, 4, 12, theme.belt);
      for (let s = 0; s < 3; s++) px(28 + frontShift, 23 + s * 3, 2, 1, theme.buckle);
      px(28 + frontShift, 34, 3, 2, theme.buckle);
    }
  }

  // Cabeza y rasgos distintivos por personaje
  const headLean = isDash && isSideProfile ? facingSign * 2 : 0;
  px(24 + headLean, 19, 10, 3, theme.maskBase);
  px(25 + headLean, 19, 8, 2, theme.belt);
  px(25 + headLean, 7, 8, 2, theme.coatTrim);
  px(23 + headLean, 9, 12, 10, theme.maskBase);

  if (effectiveDir === 0) {
    px(24, 8, 10, 10, theme.maskHi);
    px(28, 8, 2, 10, theme.maskBase);
  } else if (effectiveDir === 1 || effectiveDir === 7) {
    const sideX = effectiveDir === 1 ? 33 : 23;
    px(24, 8, 10, 10, theme.maskHi);
    glow(sideX, 13, 2, 2, theme.eyeGlow);
  } else if (effectiveDir === 2 || effectiveDir === 6) {
    const maskX = (effectiveDir === 2 ? 30 : 23) + headLean;
    const snoutX = (effectiveDir === 2 ? 34 : 20) + headLean;
    px((effectiveDir === 2 ? 24 : 28) + headLean, 8, 6, 10, theme.coatTrim);
    px(maskX, 10, 5, 8, theme.maskBase);
    glow((effectiveDir === 2 ? 32 : 24) + headLean, 13, 3, 3, theme.eyeGlow);
    px(snoutX, 15, 4, 4, theme.maskHi);
  } else if (effectiveDir === 4) {
    px(24, 8, 10, 3, theme.coatTrim);
    px(24, 10, 10, 9, theme.maskBase);
    glow(25, 13, 3, 3, theme.eyeGlow);
    glow(30, 13, 3, 3, theme.eyeGlow);
    px(27, 16, 4, 4, theme.maskHi);
  } else {
    const lookShift = effectiveDir === 3 ? 1 : -1;
    px(24, 8, 5, 9, theme.coatTrim);
    px(25, 10, 9, 9, theme.maskBase);
    glow(26 + lookShift, 13, 3, 3, theme.eyeGlow);
    glow(31 + lookShift, 13, 3, 3, theme.eyeGlow);
    px(28 + lookShift, 16, 5, 4, theme.maskHi);
  }

  // ACCESORIOS DECORATIVOS EXCLUSIVOS POR OPERADOR
  if (theme.feature === 'head_mirror') {
    // Otto: visera de socorrista y gafas de sol.
    px(21, 6, 16, 2, '#ffe8b0');
    px(22, 4, 14, 3, '#f4c56b');
    px(23, 3, 12, 2, '#fff0c7');
    if (!isBackView) {
      px(24, 11, 5, 3, '#17393d');
      px(31, 11, 5, 3, '#17393d');
      px(29, 12, 2, 1, '#17393d');
      glow(25, 12, 2, 1, '#5ff3e3');
      glow(32, 12, 2, 1, '#5ff3e3');
    }
  } else if (theme.feature === 'cigar_helmet') {
    // Mack: sombrero de pescador y puro encendido.
    px(21, 6, 16, 2, '#31543a');
    px(23, 3, 12, 4, '#4f7548');
    px(25, 2, 8, 2, '#80a66d');
    if (!isBackView) glow(facingSign > 0 ? 32 : 23, 17, 2, 2, '#ff8a45');
  } else if (theme.feature === 'goggles_tank') {
    // Pepe: gafas de sol coral con lente turquesa.
    if (!isBackView) {
      px(23, 11, 6, 4, '#4f2b1b');
      px(30, 11, 6, 4, '#4f2b1b');
      glow(25, 12, 3, 2, '#6df4e8');
      glow(31, 12, 3, 2, '#6df4e8');
      px(28, 12, 2, 1, '#ffe08a');
    }
  } else if (theme.feature === 'nun_veil') {
    // Morbo: velo de espuma marina y algas bioluminiscentes.
    px(22, 9, 2, 10, '#fff0d4');
    px(34, 9, 2, 10, '#fff0d4');
    px(23, 6, 12, 2, '#fff0d4');
    glow(27, 6, 2, 2, '#a9ff8c');
    glow(31, 7, 2, 2, '#6ed6c4');
  } else if (theme.feature === 'hardhat') {
    // Bob: casco de obra amarillo con cinta reflectante.
    px(22, 5, 14, 4, '#ffcf68');
    px(24, 4, 10, 2, '#fff0c7');
    px(21, 8, 16, 1, '#ff8a46');
    glow(27, 6, 4, 1, '#ffffff');
  } else if (theme.feature === 'captain_cap') {
    // Krauss: gorra de capitán con ancla y visor biónico.
    px(22, 6, 14, 3, '#1b3440');
    px(27, 6, 4, 2, '#ffcf68');
    px(21, 8, 16, 1, '#0d1f28');
    if (!isBackView) glow(facingSign > 0 ? 31 : 25, 13, 3, 3, '#ff6a52');
  } else if (theme.feature === 'butcher_mask') {
    // Axel: máscara de buceo con cristal turquesa.
    px(23, 8, 12, 10, '#31211b');
    px(24, 9, 10, 6, '#17393d');
    px(25, 10, 8, 4, '#2a7d7c');
    if (!isBackView) {
      glow(26, 11, 3, 2, '#ff8a68');
      glow(31, 11, 3, 2, '#ff8a68');
    }
    px(24, 15, 10, 2, '#d8d2b8');
  } else if (theme.feature === 'electric_sparks') {
    // Tesla: pelo de tormenta y chispas turquesa.
    px(23, 4, 2, 4, '#17393d');
    px(27, 3, 3, 5, '#17393d');
    px(32, 4, 2, 4, '#17393d');
    glow(22, 6, 2, 2, '#6df4e8');
    glow(34, 6, 2, 2, '#6df4e8');
  } else if (theme.feature === 'chef_bandana') {
    // Cocinero: bandana isleña y delantal de servicio.
    px(22, 5, 18, 2, '#2c6b62');
    px(23, 7, 16, 2, '#3e8b80');
    px(30, 4, 4, 2, '#e05b4f');
    if (!isBackView) {
      px(25, 25, 13, 12, '#f7ead0');
      px(26, 25, 11, 2, '#d8c49a');
      px(28, 27, 7, 1, '#3e6f68');
      px(29, 30, 5, 4, '#e7d7b5');
      px(20, 26, 2, 2, '#e05b4f');
      px(21, 25, 1, 1, '#ffe59a');
      px(34, 29, 2, 2, '#6fd1c4');
      px(35, 28, 1, 1, '#fff0c7');
    }
  }

  // Flor de hibisco en la solapa: firma visual del equipo de la playa.
  if (!isBackView && (effectiveDir === 3 || effectiveDir === 4 || effectiveDir === 5)) {
    px(22, 27, 2, 2, '#ff7d66');
    px(24, 26, 1, 1, '#ffd06b');
    px(23, 29, 1, 1, '#fff0c7');
  }

  // Brazos
  const armSwing = isWalk ? Math.round(Math.sin(phase) * 2) : 0;
  if (!isSideProfile) {
    px(18, 22, 3, 10 + armSwing, theme.coatDark);
    px(18, 32 + armSwing, 3, 3, theme.buckle);
    px(36, 22, 4, 9 - armSwing, theme.coatBase);
    px(37, 31 - armSwing, 3, 3, theme.buckle);
  } else {
    px(27, 23, 4, 9, theme.coatBase);
    px(28 + facingSign * 2, 29, 3, 3, theme.buckle);
  }

  // Arma en vista frontal / lateral
  if (!isBackView) {
    const anchorX = effectiveDir === 4 ? 19 : (facingSign > 0 ? 37 : 22);
    renderWeaponByDirection(px, glow, activeHand, effectiveDir, stateIdx, col, anchorX, 27, facingSign);
  }

  // Reacción visual al ser herido
  if (isHurt) {
    px(25, 24, 4, 4, '#a52020');
    px(31, 28, 3, 3, '#a52020');
  }

  ctx.restore(); gCtx.restore();
}
