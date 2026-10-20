// Dibujo procedural del cuerpo 8-direcciones del jugador con skins temáticas para los 8 operadores.
// Exports: CHARACTER_THEMES, drawPlayer8DirCell.

import { CONFIG } from '../../config.js';
import { renderWeaponByDirection } from './weapons.js';

export const CHARACTER_THEMES = {
  otto: {
    // Dr. Otto "El Serrucho": Cirujano de guerra desquiciado
    coatBase: '#cfc3ab', coatHi: '#e8dcbe', coatDark: '#a3947c', coatTrim: '#8a1414',
    belt: '#5a3520', buckle: '#b89c46',
    legs: '#182a20', boots: '#0a0e0a', bootTrim: '#2a3b2a',
    maskBase: '#0d120d', maskHi: '#202a1e', eyeGlow: '#ffffff',
    feature: 'head_mirror'
  },
  mack: {
    // Sargento Mack "Retroceso": Armario blindado con casco y puro
    coatBase: '#3b4a2c', coatHi: '#54683e', coatDark: '#232d1a', coatTrim: '#738c55',
    belt: '#3a2010', buckle: '#e6b342',
    legs: '#382a1c', boots: '#120e09', bootTrim: '#4a3825',
    maskBase: '#3b4a2c', maskHi: '#54683e', eyeGlow: '#ff5500',
    feature: 'cigar_helmet'
  },
  pepe: {
    // Pyro-Pepe "Chispazo": Piromaníaco encorvado con traje ignífugo
    coatBase: '#c87a18', coatHi: '#e89a24', coatDark: '#7a4008', coatTrim: '#24180c',
    belt: '#3a1808', buckle: '#e6b342',
    legs: '#7a4010', boots: '#140d05', bootTrim: '#381c08',
    maskBase: '#1a1008', maskHi: '#382410', eyeGlow: '#3fe0f5',
    feature: 'goggles_tank'
  },
  morbo: {
    // Sor Morbo (La Flagelante): Monja gótica espectral con hábito
    coatBase: '#181022', coatHi: '#2a1c3b', coatDark: '#0e0814', coatTrim: '#e6ddc8',
    belt: '#120a1a', buckle: '#877a5c',
    legs: '#12081a', boots: '#08040d', bootTrim: '#201030',
    maskBase: '#08040d', maskHi: '#e6ddc8', eyeGlow: '#55e038',
    feature: 'nun_veil'
  },
  bob: {
    // Boomer Bob (El Demoledor): Técnico de cantera con peto naranja y casco
    coatBase: '#de5d12', coatHi: '#ff7c2a', coatDark: '#8a3408', coatTrim: '#ffffff',
    belt: '#281408', buckle: '#f0c954',
    legs: '#22354a', boots: '#10141a', bootTrim: '#344e6b',
    maskBase: '#f0c954', maskHi: '#ffe078', eyeGlow: '#ffffff',
    feature: 'hardhat'
  },
  krauss: {
    // Capitán Krauss (El Balenero): Chubasquero marino y ojo biónico
    coatBase: '#9c8828', coatHi: '#b8a436', coatDark: '#5c5014', coatTrim: '#f0c954',
    belt: '#3a3010', buckle: '#f0c954',
    legs: '#1e2428', boots: '#0e1215', bootTrim: '#c8c2ac',
    maskBase: '#151a1e', maskHi: '#28323a', eyeGlow: '#ff2222',
    feature: 'captain_cap'
  },
  axel: {
    // Axel "Trituradora" Hogg: Delantal de carnicero con máscara de cuero
    coatBase: '#4a151b', coatHi: '#6e2028', coatDark: '#280a0e', coatTrim: '#8a1a1a',
    belt: '#2a1012', buckle: '#c8c2ac',
    legs: '#2a1b15', boots: '#0e0806', bootTrim: '#4a2b20',
    maskBase: '#352018', maskHi: '#4a3024', eyeGlow: '#ff3b3b',
    feature: 'butcher_mask'
  },
  tesla: {
    // Tesla Vance (Voltio Loco): Traje aislante con cables y pelo erizado
    coatBase: '#16222c', coatHi: '#26394a', coatDark: '#0c141a', coatTrim: '#c87a32',
    belt: '#101820', buckle: '#3fe0f5',
    legs: '#101820', boots: '#0a0f14', bootTrim: '#3fe0f5',
    maskBase: '#0c141a', maskHi: '#1e2e3b', eyeGlow: '#3fe0f5',
    feature: 'electric_sparks'
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
    // Dr. Otto: Espejo frontal reflectante
    glow(27, 7, 4, 3, '#ffffff');
    px(28, 7, 2, 3, '#c8c2ac');
  } else if (theme.feature === 'cigar_helmet') {
    // Mack: Casco blindado y puro encendido
    px(22, 6, 14, 3, '#54683e');
    if (!isBackView) glow(facingSign > 0 ? 32 : 23, 17, 2, 2, '#ff5500');
  } else if (theme.feature === 'goggles_tank') {
    // Pepe: Gafas de soldador con lente cian
    if (!isBackView) {
      glow(25, 12, 3, 3, '#3fe0f5');
      glow(30, 12, 3, 3, '#3fe0f5');
    }
  } else if (theme.feature === 'nun_veil') {
    // Morbo: Velo blanco de monja y espinas verdes
    px(22, 9, 2, 10, '#e6ddc8');
    px(34, 9, 2, 10, '#e6ddc8');
    glow(28, 6, 2, 2, '#55e038');
  } else if (theme.feature === 'hardhat') {
    // Boomer Bob: Casco amarillo de cantera
    px(22, 5, 14, 4, '#f0c954');
    px(24, 4, 10, 2, '#ffe078');
    glow(27, 7, 4, 2, '#ffffff');
  } else if (theme.feature === 'captain_cap') {
    // Krauss: Gorra de capitán con insignia y visor biónico
    px(22, 6, 14, 3, '#151a1e');
    px(27, 6, 4, 2, '#f0c954');
    if (!isBackView) glow(facingSign > 0 ? 31 : 25, 13, 3, 3, '#ff2222');
  } else if (theme.feature === 'butcher_mask') {
    // Axel: Máscara de cuero de verdugo
    px(23, 8, 12, 11, '#352018');
    px(28, 10, 2, 8, '#151515');
    if (!isBackView) {
      glow(25, 12, 3, 2, '#ff3b3b');
      glow(30, 12, 3, 2, '#ff3b3b');
    }
  } else if (theme.feature === 'electric_sparks') {
    // Tesla: Pelo chamuscado erizado y chispas azules
    px(23, 4, 2, 4, '#121216');
    px(27, 3, 3, 5, '#121216');
    px(32, 4, 2, 4, '#121216');
    glow(22, 6, 2, 2, '#3fe0f5');
    glow(34, 6, 2, 2, '#3fe0f5');
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
