// Dibujo procedural de las 8 armas sostenidas por dirección/estado con recorte estricto de celda (64x64).
// Exports: renderWeaponByDirection.

export function renderWeaponByDirection(rawPx, rawGlow, handWeapon, dir, stateIdx, col, anchorX, anchorY, facingSign) {
  // Clamping estricto para evitar que ningún píxel o destello sangre a las celdas adyacentes del spritesheet (1..62)
  const px = (x, y, w, h, color) => {
    if (w <= 0 || h <= 0) return;
    const x0 = Math.max(1, Math.min(62, Math.round(x)));
    const y0 = Math.max(1, Math.min(62, Math.round(y)));
    const x1 = Math.max(x0, Math.min(63, Math.round(x + w)));
    const y1 = Math.max(y0, Math.min(63, Math.round(y + h)));
    if (x1 > x0 && y1 > y0) rawPx(x0, y0, x1 - x0, y1 - y0, color);
  };

  const glow = (x, y, w, h, color) => {
    if (w <= 0 || h <= 0) return;
    const x0 = Math.max(1, Math.min(62, Math.round(x)));
    const y0 = Math.max(1, Math.min(62, Math.round(y)));
    const x1 = Math.max(x0, Math.min(63, Math.round(x + w)));
    const y1 = Math.max(y0, Math.min(63, Math.round(y + h)));
    if (x1 > x0 && y1 > y0) rawGlow(x0, y0, x1 - x0, y1 - y0, color);
  };

  const isAtk = stateIdx === 3 || stateIdx === 5;
  const isFront = dir === 4;
  const isBack = dir === 0;
  const kickX = isAtk && col < 2 ? -2 * facingSign : 0;
  const wx = anchorX + kickX;
  const wy = anchorY;

  // -------------------------------------------------------------------------
  // VISTA FRONTAL / TRASERA
  // -------------------------------------------------------------------------
  if (isFront || isBack) {
    if (handWeapon === 'shotgun') {
      px(wx - 2, wy - 1, 5, 6, '#4a2518');
      px(wx - 1, wy - 4, 3, 5, '#877a5c');
      if (isFront) px(wx, wy - 3, 2, 2, '#050605');
      if (isAtk && col === 0) {
        glow(wx - 4, wy - 8, 9, 8, '#ffffff');
        glow(wx - 2, wy - 6, 5, 5, '#f0c954');
        px(wx + 3, wy - 6, 3, 2, '#e6b342');
      } else if (isAtk && col === 1) {
        glow(wx - 2, wy - 5, 5, 4, '#b89c46');
      }
    } else if (handWeapon === 'flamethrower') {
      px(wx - 2, wy - 2, 6, 6, '#4a2518');
      px(wx - 1, wy - 5, 4, 4, '#b89c46');
      if (isAtk) {
        glow(wx - 4, wy - 9, 9, 8, '#ff5500');
        glow(wx - 2, wy - 7, 5, 5, '#ffcc00');
        glow(wx - 1, wy - 4, 3, 3, '#3fe0f5');
      } else {
        glow(wx, wy - 4, 2, 2, '#b89c46');
      }
    } else if (handWeapon === 'harpoon') {
      const launch = isAtk && col < 2 ? -3 : 0;
      px(wx - 2, wy - 1 + launch, 5, 5, '#364832');
      px(wx, wy - 7 + launch * 2, 2, 7, '#c8c2ac');
      if (isAtk && col === 0) glow(wx - 1, wy - 9, 4, 4, '#ffffff');
      glow(wx - 1, wy - 6, 4, 3, '#b89c46');
    } else if (handWeapon === 'bolt') {
      px(wx - 2, wy, 4, 4, '#b89c46');
      if (isAtk) {
        glow(wx - 4, wy - 5, 9, 7, '#3fe0f5');
        px(wx - 1, wy - 4, 3, 3, '#ffffff');
      } else if (col % 2 === 0) {
        glow(wx - 2, wy - 3, 5, 4, '#e6d7a5');
      }
    } else if (handWeapon === 'mines') {
      const dropY = isAtk ? col * 2 : 0;
      px(wx - 3, wy + dropY, 6, 4, '#243022');
      glow(wx - 1, wy + 1 + dropY, 2, 2, col % 2 === 0 ? '#a52020' : '#e6d7a5');
    } else if (handWeapon === 'aura') {
      // Incensario de Bilis
      const swingY = isAtk ? (col < 2 ? -2 : 3) : (col % 2 === 0 ? 0 : 1);
      px(wx, wy, 2, 4, '#877a5c'); // Cadena
      px(wx - 2, wy + 4 + swingY, 5, 5, '#1e241c'); // Péndulo
      px(wx - 1, wy + 5 + swingY, 3, 2, '#7a6832'); // Banda bronce
      glow(wx - 2, wy + 5 + swingY, 5, 4, '#55e038'); // Vaho tóxico verde
      if (isAtk) glow(wx - 3, wy + 7, 7, 5, '#a8f044');
    } else if (handWeapon === 'orbital') {
      // Gancho / Cuchilla de Carnicero
      const cleaveY = isAtk ? (col === 0 ? -6 : col === 1 ? 4 : 1) : 0;
      px(wx - 1, wy + cleaveY, 3, 3, '#4a2518'); // Mango
      px(wx - 2, wy - 6 + cleaveY, 5, 7, '#c8c2ac'); // Hoja de acero
      px(wx - 1, wy - 5 + cleaveY, 2, 5, '#8a1a1a'); // Sangre seca
      px(wx + 2, wy - 6 + cleaveY, 2, 2, '#877a5c'); // Lomo reforzado
      if (isAtk && col === 1) glow(wx - 4, wy - 7 + cleaveY, 9, 8, '#ff3b3b');
    } else {
      // Sierra de Amputación
      const swingX = isAtk ? (col === 0 ? -4 : col === 1 ? 5 : 2) : 0;
      const swingY = isAtk ? (col === 0 ? -5 : col === 1 ? 3 : 1) : 0;
      px(wx + swingX - 1, wy + swingY - 2, 4, 3, '#b89c46');
      px(wx + swingX, wy + swingY - 8, 3, 7, '#877a5c');
      px(wx + swingX + 1, wy + swingY - 7, 2, 5, '#a52020');
      if (isAtk && col === 1) {
        glow(wx + swingX - 3, wy + swingY - 9, 7, 6, '#ffffff');
        glow(wx + swingX - 2, wy + swingY - 7, 5, 4, '#e6d7a5');
      }
    }
    return;
  }

  // -------------------------------------------------------------------------
  // VISTA DIAGONAL Y LATERAL
  // -------------------------------------------------------------------------
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
    const recoil = (isAtk && col === 0) ? -3 : 0;
    const pumpShift = (isAtk && col >= 2) ? -2 : 0;
    rPx(-4 + recoil, 0, 5, 3, '#4a2518');
    rPx(1 + recoil, -1, 5, 3, '#243022');
    rPx(6 + recoil, -1, 9, 1, '#c8c2ac');
    rPx(6 + recoil, 0, 8, 1, '#877a5c');
    rPx(7 + pumpShift + recoil, 1, 4, 2, '#743718');
    if (isAtk && col === 0) {
      rGlow(14, -4, 8, 7, '#ffffff');
      rGlow(12, -3, 6, 5, '#f0c954');
      rPx(1, -6, 2, 2, '#e6b342');
    } else if (isAtk && col === 1) {
      rGlow(12, -2, 4, 3, '#b89c46');
    }
  } else if (handWeapon === 'flamethrower') {
    rPx(-4, 3, 6, 2, '#050605');
    rPx(0, -1, 8, 3, '#4a2518');
    rPx(2, -2, 4, 2, '#b89c46');
    rPx(7, -1, 6, 2, '#877a5c');
    if (isAtk) {
      rGlow(12, -5, 9, 8, '#ff5500');
      rGlow(11, -3, 7, 6, '#ffcc00');
      rGlow(9, -2, 4, 3, '#3fe0f5');
    } else {
      rGlow(12, -1, 2, 2, '#b89c46');
    }
  } else if (handWeapon === 'harpoon') {
    const shotOut = (isAtk && col === 0) ? 6 : (isAtk && col === 1 ? 3 : 0);
    rPx(-2, -1, 9, 3, '#364832');
    rPx(1, -2, 4, 2, '#b89c46');
    rPx(7 + shotOut, 0, 8, 2, '#c8c2ac');
    if (isAtk && col === 0) {
      rGlow(14 + shotOut, -1, 5, 4, '#ffffff');
    } else {
      rGlow(12 + shotOut, -1, 3, 2, '#b89c46');
    }
  } else if (handWeapon === 'bolt') {
    rPx(0, -1, 5, 3, '#4a2518');
    rPx(4, -2, 3, 5, '#b89c46');
    if (isAtk) {
      rGlow(7, -4, 8, 8, '#3fe0f5');
      rPx(8, -3, 3, 3, '#ffffff');
    } else if (col % 2 === 0) {
      rGlow(7, -3, 5, 5, '#e6d7a5');
    }
  } else if (handWeapon === 'mines') {
    const throwDist = isAtk ? col * 3 : 0;
    const throwY = isAtk ? (col === 0 ? -3 : col === 1 ? -1 : 2) : 0;
    rPx(1 + throwDist, 0 + throwY, 5, 3, '#243022');
    rPx(2 + throwDist, -1 + throwY, 4, 2, '#4a2518');
    rGlow(2 + throwDist, -1 + throwY, 3, 2, col % 2 === 0 ? '#a52020' : '#e6d7a5');
  } else if (handWeapon === 'aura') {
    // Incensario de Bilis
    const swingDist = isAtk ? (col < 2 ? 6 : 3) : (col % 2 === 0 ? 2 : 4);
    const swingY = isAtk ? (col < 2 ? -2 : 3) : 2;
    rPx(0, 0, 3, 2, '#877a5c');
    rPx(3, 1, Math.max(2, swingDist), 1, '#877a5c'); // Cadena
    rPx(2 + swingDist, swingY, 5, 5, '#1e241c'); // Censer
    rPx(3 + swingDist, swingY + 1, 3, 2, '#7a6832');
    rGlow(2 + swingDist, swingY, 6, 5, '#55e038');
    if (isAtk) rGlow(3 + swingDist, swingY + 3, 5, 4, '#a8f044');
  } else if (handWeapon === 'orbital') {
    // Gancho / Cuchilla de Carnicero
    const isWindup = isAtk && col === 0;
    const isSmear = isAtk && col === 1;
    const slashY = isWindup ? -6 : (isSmear ? 4 : 1);
    const slashX = isWindup ? -3 : (isSmear ? 4 : 0);

    rPx(0 + slashX, 0 + slashY, 3, 3, '#4a2518'); // Empuñadura
    rPx(3 + slashX, -4 + slashY, 9, 6, '#c8c2ac'); // Cuchilla pesada
    rPx(4 + slashX, -3 + slashY, 6, 3, '#8a1a1a'); // Sangre
    rPx(3 + slashX, -5 + slashY, 9, 2, '#877a5c'); // Lomo
    if (isSmear) {
      rGlow(6, -5 + slashY, 9, 8, '#ff3b3b');
      rGlow(9, -3 + slashY, 6, 5, '#ffffff');
    }
  } else {
    // Sierra de Amputación
    const isWindup = isAtk && col === 0;
    const isSmear = isAtk && col === 1;
    const swingY = isWindup ? -5 : (isSmear ? 3 : 1);
    const swingX = isWindup ? -3 : (isSmear ? 4 : 0);

    rPx(0 + swingX, 0 + swingY, 4, 2, '#4a2518');
    rPx(3 + swingX, -2 + swingY, 2, 5, '#b89c46');
    rPx(5 + swingX, -3 + swingY, 9, 5, '#877a5c');
    rPx(5 + swingX, -3 + swingY, 9, 1, '#e6d7a5');
    rPx(6 + swingX, 1 + swingY, 7, 1, '#a52020');
    if (isSmear) {
      rGlow(9, -4 + swingY, 8, 7, '#ffffff');
      rGlow(8, -2 + swingY, 6, 5, '#e6d7a5');
    }
  }
}
