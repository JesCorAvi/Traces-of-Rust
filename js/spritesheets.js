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

// Contorno negro limpio de 1px (#050605) optimizado para atlas de cualquier tamaño (w x h)
function applyCleanSpriteOutlineRect(ctx, w, h) {
  const src = ctx.getImageData(0, 0, w, h);
  const out = ctx.createImageData(w, h);
  const s = src.data;
  const d = out.data;
  d.set(s);

  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (let y = 1; y < h - 1; y++) {
    if (y % 64 === 0 || y % 64 === 63) continue;
    for (let x = 1; x < w - 1; x++) {
      if (x % 64 === 0 || x % 64 === 63) continue;
      const idx = (y * w + x) * 4;
      if (s[idx + 3] > 128) continue;

      for (let k = 0; k < 4; k++) {
        const nIdx = ((y + dirs[k][1]) * w + (x + dirs[k][0])) * 4;
        if (s[nIdx + 3] > 128) {
          d[idx] = 5; d[idx + 1] = 6; d[idx + 2] = 5; d[idx + 3] = 255;
          break;
        }
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
// DIBUJO DE CADA ARMA EN MANO SEGÚN LA DIRECCIÓN (0..7) Y EL ESTADO (IDLE/WALK/JUMP/ATTACK/HURT)
// ============================================================================
function renderWeaponByDirection(px, glow, handWeapon, dir, stateIdx, col, anchorX, anchorY, facingSign) {
  const isAtk = stateIdx === 3;
  const isFront = dir === 4;
  const isBack = dir === 0;
  const kickX = isAtk && col < 2 ? -2 * facingSign : 0;
  const wx = anchorX + kickX;
  const wy = anchorY;

  // Si es vista frontal o trasera pura, el arma se ve en escorzo (apuntando hacia cámara o alejándose)
  if (isFront || isBack) {
    if (handWeapon === 'shotgun') {
      px(wx - 2, wy - 1, 5, 6, '#4a2518'); // Guardamanos/culata en escorzo
      px(wx - 1, wy - 3, 3, 5, '#877a5c'); // Cañón
      if (isFront) px(wx, wy - 2, 2, 2, '#050605'); // Boca negra del cañón apuntando a cámara
      if (isAtk && col < 2) {
        glow(wx - 4, wy - 6, 9, 9, '#e6d7a5');
        glow(wx - 2, wy - 4, 5, 5, '#b89c46');
        px(wx + 4, wy - 5 - col * 2, 3, 2, '#a52020'); // Cartucho rojo expulsado
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
      // Electrodos del desfibrilador en ambas manos con arco eléctrico
      px(wx - 2, wy, 4, 4, '#b89c46');
      if (isAtk || col % 2 === 0) {
        glow(wx - 3, wy - 3, 6, 4, '#e6d7a5');
      }
    } else if (handWeapon === 'mines') {
      // Mina circular con sensor rojo en la mano
      px(wx - 3, wy, 6, 4, '#243022');
      glow(wx - 1, wy + 1, 2, 2, col % 2 === 0 ? '#a52020' : '#e6d7a5');
    } else {
      // Sierra de Amputación (`slash`) en escorzo / tajo cruzado
      const swingX = isAtk ? (col < 2 ? -4 : 6) : 0;
      const swingY = isAtk ? (col < 2 ? -5 : 2) : 0;
      px(wx + swingX - 1, wy + swingY - 2, 4, 3, '#b89c46');
      px(wx + swingX, wy + swingY - 9, 3, 8, '#877a5c');
      px(wx + swingX + 1, wy + swingY - 8, 2, 6, '#a52020');
      if (isAtk && col < 2) glow(wx + swingX - 3, wy + swingY - 10, 9, 4, '#e6d7a5');
    }
    return;
  }

  // Vistas laterales y diagonales (facingSign = +1 hacia la derecha en dir 1,2,3; -1 hacia la izquierda en dir 5,6,7)
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
    // Escopeta Calibre 12 con acción de bombeo en el ataque
    const pumpShift = (isAtk && col >= 2) ? -3 : 0;
    rPx(-5, 0, 6, 3, '#4a2518');               // Culata de madera
    rPx(1, -1, 6, 3, '#243022');               // Cajón de mecanismos
    rPx(7, -1, 13, 1, '#c8c2ac');              // Cañón largo superior
    rPx(7, 0, 12, 1, '#877a5c');               // Tubo cargador inferior
    rPx(9 + pumpShift, 1, 5, 2, '#743718');    // Guardamanos de corredera (se mueve al recargar)
    if (isAtk && col < 2) {
      rGlow(20, -4, 6, 8, '#e6d7a5');          // Fogonazo estelar
      rGlow(18, -2, 4, 4, '#b89c46');
      rPx(2, -6 - col * 3, 3, 2, '#a52020');   // Cartucho rojo saltando
    }
  } else if (handWeapon === 'flamethrower') {
    // Soplete Incinerador con manguera y chorro de fuego
    rPx(-6, 4, 8, 2, '#050605');               // Manguera negra al tanque
    rPx(0, -1, 10, 4, '#4a2518');              // Cuerpo del soplete
    rPx(3, -2, 5, 2, '#b89c46');               // Cámara de latón
    rPx(10, -1, 8, 2, '#877a5c');              // Boquilla perforada
    if (isAtk) {
      rGlow(18, -5, 8, 10, '#e6d7a5');
      rGlow(15, -3, 7, 6, '#b89c46');
    } else {
      rGlow(18, -2, 2, 2, '#b89c46');          // Llama piloto
    }
  } else if (handWeapon === 'harpoon') {
    // Lanzador de Arpón Neumático
    const shotOut = (isAtk && col < 2) ? 5 : 0;
    rPx(-2, -1, 12, 4, '#364832');
    rPx(1, -2, 6, 2, '#b89c46');
    rPx(10 + shotOut, 0, 10, 1, '#c8c2ac');    // Asta del arpón
    rGlow(18 + shotOut, -1, 3, 3, '#b89c46');  // Punta barbada
  } else if (handWeapon === 'bolt') {
    // Desfibrilador de Alto Voltaje
    rPx(0, -1, 6, 4, '#4a2518');
    rPx(6, -2, 4, 6, '#b89c46');               // Pala conductora
    if (isAtk || col % 2 === 0) {
      rGlow(10, -4, 6, 8, '#e6d7a5');
      rGlow(8, -2, 5, 4, '#b89c46');
    }
  } else if (handWeapon === 'mines') {
    // Mina de Metralla en mano (y lanzada en el frame de ataque)
    const throwDist = isAtk ? col * 3 : 0;
    rPx(1 + throwDist, 0, 7, 4, '#243022');
    rPx(2 + throwDist, -1, 5, 2, '#4a2518');
    rGlow(3 + throwDist, -2, 3, 2, col % 2 === 0 ? '#a52020' : '#e6d7a5');
  } else {
    // Sierra de Amputación (`slash`)
    const swingY = isAtk ? (col === 0 ? -6 : col === 1 ? 3 : 1) : 0;
    rPx(0, 0 + swingY, 5, 2, '#4a2518');       // Mango
    rPx(4, -2 + swingY, 2, 6, '#b89c46');      // Guarda de latón
    rPx(6, -3 + swingY, 13, 5, '#877a5c');     // Hoja dentada
    rPx(6, -3 + swingY, 12, 1, '#e6d7a5');     // Lomo brillante
    rPx(8, 1 + swingY, 9, 1, '#a52020');       // Sangre en dientes
    for (let t = 0; t < 4; t++) {
      rPx(7 + t * 3, 2 + swingY, 1, 1, '#c8c2ac');
    }
    if (isAtk && col < 2) {
      rGlow(12, -5 + swingY, 8, 3, '#e6d7a5'); // Destello de corte
    }
  }
}

// ============================================================================
// DIBUJO DEL JUGADOR EN 8 DIRECCIONES (Filas 0..7) x 5 ESTADOS (Cols 0..19)
// Dir 0: N (Espalda) | Dir 1: NE | Dir 2: E (Perfil Der) | Dir 3: SE
// Dir 4: S (Frente)  | Dir 5: SW | Dir 6: W (Perfil Izq) | Dir 7: NW
// ============================================================================
function drawPlayer8DirCell(ctx, gCtx, dir, stateIdx, col, ox, oy, skills = { slash: 1 }, activeHand = 'slash') {
  ctx.save(); gCtx.save();
  ctx.translate(ox, oy); gCtx.translate(ox, oy);

  // Opción de espejo horizontal en CONFIG.DIRECTIONAL.USE_MIRRORING para vistas 5, 6 y 7
  let effectiveDir = dir;
  if (CONFIG.DIRECTIONAL.USE_MIRRORING && (dir === 5 || dir === 6 || dir === 7)) {
    ctx.translate(64, 0); ctx.scale(-1, 1);
    gCtx.translate(64, 0); gCtx.scale(-1, 1);
    effectiveDir = dir === 5 ? 3 : dir === 6 ? 2 : 1;
  }

  const phase = (col / 4) * Math.PI * 2;
  const isIdle = stateIdx === 0;
  const isWalk = stateIdx === 1;
  const isJump = stateIdx === 2;
  const isAtk  = stateIdx === 3;
  const isHurt = stateIdx === 4;

  // Desplazamiento vertical según estado (respiración, paso, salto/caída o daño)
  const bobY = isWalk
    ? Math.round(Math.abs(Math.sin(phase)) * 2)
    : isJump
      ? (col === 0 ? 2 : col === 1 ? -4 : col === 2 ? -3 : 1)
      : (isIdle && col % 2 === 1 ? 1 : 0);
  const hurtX = isHurt ? (col % 2 === 0 ? -2 : 2) : 0;

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

  const isBackView = (effectiveDir === 0 || effectiveDir === 1 || effectiveDir === 7);
  const isSideProfile = (effectiveDir === 2 || effectiveDir === 6);
  const facingSign = (effectiveDir === 5 || effectiveDir === 6 || effectiveDir === 7) ? -1 : 1;

  // 1. En vistas traseras, el arma se dibuja ANTES del torso para que quede parcialmente detrás del cuerpo
  if (isBackView) {
    const anchorX = effectiveDir === 0 ? 38 : (effectiveDir === 1 ? 37 : 22);
    renderWeaponByDirection(px, glow, activeHand, effectiveDir, stateIdx, col, anchorX, 26, facingSign);
  }

  // 2. Equipamiento dorsal cuando se ve de frente o de perfil (queda detrás del torso)
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

  // 3. PIERNAS Y BOTAS (Adaptadas a perfil vs frente/espalda y salto)
  const stride = isWalk ? Math.round(Math.sin(phase) * 3) : (isJump ? (col === 1 || col === 2 ? -3 : 1) : 0);

  if (isSideProfile) {
    // En perfil (E / W), las piernas se cruzan horizontalmente al caminar
    const legBackX = 27 - stride * facingSign;
    const legFrontX = 27 + stride * facingSign;
    // Pierna trasera (más oscura)
    px(legBackX, 44, 5, 9, '#0d120d');
    px(legBackX, 53, 6, 6, '#050605');
    // Pierna delantera (iluminada)
    px(legFrontX, 44, 5, 9, '#182018');
    px(legFrontX + 1, 44, 2, 9, '#243022');
    px(legFrontX, 53, 6, 6, '#050605');
    px(legFrontX + 1, 53, 4, 2, '#4a2518');
    px(legFrontX, 58, 6, 1, '#364832');
  } else {
    // En frente, espalda y diagonales, las dos piernas están separadas con 4px de aire en el centro
    const stepL = isJump ? stride : stride;
    const stepR = isJump ? stride : -stride;
    // Pierna izquierda
    px(22, 44 + stepL, 5, 9, '#121812');
    px(23, 44 + stepL, 2, 9, '#243022');
    px(21, 53 + stepL, 6, 6, '#050605');
    px(22, 53 + stepL, 4, 2, '#4a2518');
    px(21, 58 + stepL, 6, 1, '#364832');
    // Pierna derecha
    px(31, 44 + stepR, 5, 9, '#121812');
    px(32, 44 + stepR, 2, 9, '#243022');
    px(31, 53 + stepR, 6, 6, '#050605');
    px(32, 53 + stepR, 4, 2, '#4a2518');
    px(31, 58 + stepR, 6, 1, '#364832');
  }

  // 4. TORSO Y GABARDINA SEGÚN LA DIRECCIÓN
  const coatFlare = isJump && (col === 1 || col === 2) ? 2 : (isWalk && col % 2 === 0 ? 1 : 0);

  if (isSideProfile) {
    // Torso de perfil (más estrecho: 11px)
    px(24 - coatFlare, 35, 11 + coatFlare * 2, 10, '#121812');
    px(25, 35, 8, 9, '#243022');
    px(24, 21, 11, 14, '#182018');
    px(26, 21, 7, 13, '#243022');
    px(27 + facingSign, 22, 4, 11, '#364832'); // Solapa lateral iluminada
    px(24, 34, 11, 2, '#4a2518');              // Cinturón lateral
    px(29 + facingSign * 3, 34, 2, 2, '#b89c46');
  } else {
    // Faldones inferiores de la gabardina (se abren al saltar o caminar)
    px(20 - coatFlare, 36, 7, 10, '#121812');
    px(21 - coatFlare, 36, 4, 9, '#243022');
    px(31 + coatFlare, 36, 7, 10, '#121812');
    px(32 + coatFlare, 36, 4, 9, '#243022');

    // Hombros y pecho
    px(20, 21, 18, 9, '#121812');
    px(22, 21, 14, 9, '#243022');
    px(22, 30, 14, 6, '#182018');
    px(22, 34, 14, 2, '#4a2518'); // Cinturón

    if (isBackView) {
      // DETALLES TRASEROS: Costura dorsal de la gabardina, correas y mochila/tanque en primer plano
      px(23, 22, 12, 3, '#364832'); // Canesú de los hombros
      px(28, 22, 2, 12, '#050605'); // Costura vertical de la columna
      px(21, 22, 2, 12, '#4a2518'); // Correas de los hombros
      px(35, 22, 2, 12, '#4a2518');

      const backShift = effectiveDir === 1 ? -3 : effectiveDir === 7 ? 3 : 0;
      if (skills.flamethrower) {
        // Bombona dorsal completa con manómetro brillante vista desde atrás
        px(24 + backShift, 20, 9, 14, '#4a2518');
        px(26 + backShift, 21, 5, 12, '#6e1414');
        px(24 + backShift, 23, 9, 1, '#b89c46');
        px(24 + backShift, 30, 9, 1, '#b89c46');
        glow(27 + backShift, 18, 3, 2, '#e6d7a5'); // Manómetro
      } else {
        // Mochila médica oxidada vista desde atrás
        px(25 + backShift, 22, 8, 10, '#4a2518');
        px(26 + backShift, 23, 6, 8, '#743718');
        px(28 + backShift, 25, 2, 4, '#b89c46'); // Cierre metálico
      }
      if (skills.shotgun && activeHand !== 'shotgun') {
        // Escopeta cruzada a la espalda
        for (let b = 0; b < 5; b++) {
          px(23 + b * 2, 18 + b * 3, 3, 2, '#877a5c');
        }
      }
    } else {
      // DETALLES FRONTALES (SE, S, SW): Solapas abiertas, peto cosido, canana y hebilla frontal
      const frontShift = effectiveDir === 3 ? 1 : effectiveDir === 5 ? -1 : 0;
      px(23, 22, 4, 12, '#364832');
      px(31, 22, 4, 12, '#364832');
      px(27 + frontShift, 22, 4, 12, '#4a2518'); // Peto interior de cuero
      for (let s = 0; s < 3; s++) px(28 + frontShift, 23 + s * 3, 2, 1, '#877a5c'); // Grapas
      px(28 + frontShift, 34, 3, 2, '#b89c46'); // Hebilla de latón

      if (skills.shotgun) {
        // Canana de cartuchos rojos en el pecho
        px(24, 24, 2, 2, '#a52020');
        px(27, 26, 2, 2, '#a52020');
        px(30, 28, 2, 2, '#a52020');
      }
    }
  }

  // Accesorios de cinturón/hombros para Aura, Minas y Orbitales
  if (skills.aura) glow(23, 35, 2, 3, '#68863a');
  if (skills.mines) glow(34, 35, 2, 2, col % 2 === 0 ? '#a52020' : '#e6d7a5');
  if (skills.orbital) {
    px(19, 20, 4, 2, '#877a5c');
    px(35, 20, 4, 2, '#877a5c');
  }

  // 5. CABEZA, CAPUCHA Y MÁSCARA ANTIGÁS EN LAS 8 DIRECCIONES
  px(24, 19, 10, 3, '#050605'); // Cuello
  px(25, 19, 8, 2, '#4a2518');
  px(25, 7, 8, 2, '#243022');   // Cima redondeada de la capucha
  px(23, 9, 12, 10, '#182018'); // Volumen de la capucha

  if (effectiveDir === 0) {
    // Dir 0 (ESPALDA PURA): Parte trasera de la capucha con costura vertical y correa occipital
    px(24, 8, 10, 10, '#243022');
    px(28, 8, 2, 10, '#050605'); // Costura trasera de la capucha
    px(24, 14, 10, 2, '#4a2518'); // Correa trasera de la máscara
  } else if (effectiveDir === 1 || effectiveDir === 7) {
    // Dir 1 / Dir 7 (ATRÁS-DIAGONAL): Capucha trasera + asoma la correa y 1 lente lateral
    const sideX = effectiveDir === 1 ? 33 : 23;
    px(24, 8, 10, 10, '#243022');
    px(28 - facingSign * 2, 8, 2, 10, '#050605');
    glow(sideX, 13, 2, 2, '#e6d7a5'); // Lente lateral asomando
    px(sideX + facingSign, 16, 2, 3, '#4a2518'); // Borde del filtro
  } else if (effectiveDir === 2 || effectiveDir === 6) {
    // Dir 2 / Dir 6 (PERFIL PURO E / W): Capucha de perfil, 1 lente y hocico del respirador sobresaliendo
    const maskX = effectiveDir === 2 ? 30 : 23;
    const snoutX = effectiveDir === 2 ? 34 : 20;
    px(effectiveDir === 2 ? 24 : 28, 8, 6, 10, '#364832'); // Lateral de la capucha
    px(maskX, 10, 5, 8, '#050605');
    px(maskX, 10, 4, 2, '#877a5c'); // Venda lateral
    glow(effectiveDir === 2 ? 32 : 24, 13, 3, 3, '#e6d7a5'); // Lente ocular de perfil
    px(snoutX, 15, 4, 4, '#243022'); // Hocico respirador sobresaliendo en perfil
    px(snoutX + (effectiveDir === 2 ? 2 : 0), 16, 2, 3, '#4a2518');
  } else if (effectiveDir === 4) {
    // Dir 4 (FRENTE PURO S): Cara simétrica mirando directamente a la cámara
    px(24, 8, 10, 3, '#364832');
    px(24, 10, 10, 9, '#050605');
    px(25, 10, 8, 2, '#877a5c'); // Venda frontal
    px(26, 10, 3, 2, '#6e1414'); // Mancha de sangre en la frente
    // Dos lentes simétricos brillantes
    glow(25, 13, 3, 3, '#e6d7a5');
    glow(30, 13, 3, 3, '#e6d7a5');
    // Filtro central frontal
    px(27, 16, 4, 4, '#243022');
    px(28, 17, 2, 2, '#b89c46');
  } else {
    // Dir 3 / Dir 5 (FRENTE-DIAGONAL SE / SW)
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

  // 6. BRAZOS Y ARMA EN PRIMER PLANO (Cuando no es vista trasera)
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
    // En vista frontal pura (Dir 4), la mano derecha del personaje está a la izquierda (x = 19)
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

  const row = Math.min(3, Math.floor(stateCol / 4)); // 0:Idle, 1:Walk, 2:Atk, 3:Hurt
  const col = stateCol % 4;
  const phase = (col / 4) * Math.PI * 2;
  const isIdle = row === 0, isWalk = row === 1, isAtk = row === 2, isHurt = row === 3;
  const bob = isWalk ? Math.round(Math.sin(phase) * 2) : (isIdle ? (col % 2) : 0);
  const twitchX = (isIdle && col === 3) ? (type === 'weeper' ? 3 : 1) : (isHurt ? (col % 2 === 0 ? -3 : 3) : 0);
  const collapseY = (isHurt && col >= 2) ? (col - 1) * 6 : 0;

  // Si la entidad tiene múltiples direcciones y se ve desde el lado izquierdo, reflejamos su silueta
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
      for (let r = 0; r < 5; r++) px(29, 22 + r * 4, 3, 3, '#b89c46'); // Vértebras dorsales expuestas
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
  const cols = 16; // 4 estados x 4 frames
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
// CACHÉ DE ATLAS DE 8 DIRECCIONES x 5 ANIMACIONES DEL JUGADOR (20 cols x 8 rows = 1280x512)
// ============================================================================
const playerLoadoutCache = new Map();

export function getPlayerLoadoutSheet(skills = { slash: 1 }, activeHand = 'slash') {
  const equippedKeys = Object.keys(skills).filter(k => skills[k] > 0).sort().join(',');
  const signature = `${equippedKeys}::${activeHand}::${CONFIG.DIRECTIONAL.USE_MIRRORING}`;

  if (playerLoadoutCache.has(signature)) {
    return playerLoadoutCache.get(signature);
  }

  const cols = 20; // 5 estados (IDLE, WALK, JUMP, ATTACK, HURT) x 4 frames
  const rows = 8;  // 8 direcciones (N, NE, E, SE, S, SW, W, NW)
  const w = cols * CONFIG.FRAME_SIZE; // 1280 px
  const h = rows * CONFIG.FRAME_SIZE; // 512 px

  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');

  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = w; glowCanvas.height = h;
  const gCtx = glowCanvas.getContext('2d');

  for (let dir = 0; dir < rows; dir++) {
    for (let stateIdx = 0; stateIdx < 5; stateIdx++) {
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

  // Actualizar vista previa en el modal [TAB]
  if (SpriteSheets && SpriteSheets.player && SpriteSheets.player.canvas) {
    SpriteSheets.player.canvas.width = w;
    SpriteSheets.player.canvas.height = h;
    const pCtx = SpriteSheets.player.canvas.getContext('2d');
    pCtx.clearRect(0, 0, w, h);
    pCtx.drawImage(canvas, 0, 0);
  }

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

  return {
    ground:  { name: 'ground_tile', canvas: gCan, tex: makeTexture(gCan, 75) },
    crate:   { name: 'rust_crate',  canvas: cCan, tex: makeTexture(cCan) },
    metal:   { name: 'catwalk_tex', canvas: mCan, tex: makeTexture(mCan, 4) },
    aura:    { name: 'bile_aura',   canvas: aCan, tex: makeTexture(aCan) },
    pillar:  { name: 'rust_pillar', canvas: pCan, tex: makeTexture(pCan) },
    slash:   weapons.slashSheet,
    orbital: weapons.orbitalSheet
  };
}

export const SpriteSheets = {
  player:       null, // Inicializado abajo con el atlas 8-dir
  zombie:       buildEnemyDirectionalSheet('zombie'),
  weeper:       buildEnemyDirectionalSheet('weeper'),
  worm:         buildEnemyDirectionalSheet('worm'),
  boss_butcher: buildEnemyDirectionalSheet('boss_butcher'),
  boss_siren:   buildEnemyDirectionalSheet('boss_siren'),
  boss_furnace: buildEnemyDirectionalSheet('boss_furnace'),
  boss_apostle: buildEnemyDirectionalSheet('boss_apostle'),
  boss_warden:  buildEnemyDirectionalSheet('boss_warden'),
  env:          buildEnvironmentTextures()
};

SpriteSheets.player = getPlayerLoadoutSheet({ slash: 1 }, 'slash');