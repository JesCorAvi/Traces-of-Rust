// Dibujo procedural del arma sostenida por dirección/estado.
// Exports: renderWeaponByDirection.

export function renderWeaponByDirection(px, glow, handWeapon, dir, stateIdx, col, anchorX, anchorY, facingSign) {
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
