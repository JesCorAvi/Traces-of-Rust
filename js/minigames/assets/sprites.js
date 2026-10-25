// Sprites 2D procedurales de los minijuegos en estilo Pixel Art Caribeño.
// Diseñados específicamente para el modo Chiringuito del Atardecer:
// colores tropicales vivos, píxeles definidos, sombreado en bloques y dithering,
// con motivos playeros acordes al universo náutico y caribeño del juego.
// Cada sprite se dibuja una sola vez en un canvas cacheado por AssetFactory.
// Exports: SPRITE_DEFS, SPRITE_IDS.

import { PALETTE } from './palette.js';
import {
  TAU, circle, ellipse, fillRoundRect, roundRectPath, strokeRoundRect,
  rgba
} from '../core/Draw.js';

const ink = '#1c120c';
const inkSoft = '#2e1c14';

// Helpers de dibujo pixel art sobre Canvas 2D
function px(ctx, x, y, w = 1, h = 1, color) {
  if (!color) return;
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h));
}

function ditherRect(ctx, x, y, w, h, colA, colB, step = 3) {
  for (let dy = 0; dy < h; dy += step) {
    for (let dx = 0; dx < w; dx += step) {
      ctx.fillStyle = ((dx / step) + (dy / step)) % 2 === 0 ? colA : colB;
      ctx.fillRect(Math.floor(x + dx), Math.floor(y + dy), step, step);
    }
  }
}

function pixelShadow(ctx, cx, cy, rx, ry, alpha = 0.28) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const p = 3;
  const startX = Math.floor((cx - rx) / p) * p;
  const endX = Math.ceil((cx + rx) / p) * p;
  ctx.fillStyle = ink;
  for (let x = startX; x <= endX; x += p) {
    const dx = (x - cx) / rx;
    if (Math.abs(dx) <= 1) {
      const h = Math.sqrt(1 - dx * dx) * ry;
      ctx.fillRect(x, Math.floor(cy - h), p, Math.ceil(h * 2));
    }
  }
  ctx.restore();
}

function pixelHLine(ctx, x, y, len, color, p = 3) {
  px(ctx, x, y, len, p, color);
}

function pixelVLine(ctx, x, y, len, color, p = 3) {
  px(ctx, x, y, p, len, color);
}

// ---------------------------------------------------------------------------
// Ingredientes Tropicales Pixel Art
// ---------------------------------------------------------------------------

function drawCarrot(ctx, w, h) {
  const p = 3;
  const cx = Math.floor(w * 0.5 / p) * p;
  pixelShadow(ctx, cx, h - 14, 30, 8, 0.25);

  // Penacho de hojas de zanahoria pixel art (verde esmeralda y lima)
  const leafColors = [PALETTE.leafDark, PALETTE.leaf, PALETTE.leafLight];
  for (let i = -2; i <= 2; i++) {
    const lx = cx + i * 8;
    const ly = 58;
    const len = 34 - Math.abs(i) * 6;
    for (let step = 0; step < len; step += p) {
      const col = leafColors[(step / p) % leafColors.length];
      const curve = Math.sin(step * 0.1) * i * 3;
      px(ctx, lx + curve - p, ly - step, p * 2, p, col);
    }
  }

  // Cuerpo cónico pixel art de zanahoria
  const topY = 60;
  const bottomY = 168;
  const totalH = bottomY - topY;

  for (let y = topY; y <= bottomY; y += p) {
    const t = (y - topY) / totalH;
    const halfWidth = Math.max(p, Math.floor((1 - Math.pow(t, 1.2)) * 28 / p) * p);

    // Contorno
    px(ctx, cx - halfWidth - p, y, p, p, ink);
    px(ctx, cx + halfWidth, y, p, p, ink);

    // Relleno con sombreado pixel art
    for (let x = cx - halfWidth; x < cx + halfWidth; x += p) {
      const normX = (x - (cx - halfWidth)) / (halfWidth * 2);
      let col = PALETTE.coral;
      if (normX < 0.2) col = PALETTE.coralLight; // Luz en la izquierda
      else if (normX > 0.65) col = PALETTE.tomatoDark; // Sombra en la derecha
      else if (normX > 0.45) col = PALETTE.coralDark;

      // Estrías horizontales de zanahoria
      if (Math.floor(y / (p * 5)) % 2 === 0 && (x % (p * 3) !== 0)) {
        col = PALETTE.woodDark;
      }
      px(ctx, x, y, p, p, col);
    }
  }
  // Punta
  px(ctx, cx - p, bottomY, p * 2, p, ink);
  // Brillo especular
  px(ctx, cx - 12, topY + 18, p, p * 6, PALETTE.cream);
}

function drawTomato(ctx, w, h) {
  const p = 3;
  const cx = Math.floor(w * 0.5 / p) * p;
  const cy = Math.floor(h * 0.58 / p) * p;
  const r = 36;
  pixelShadow(ctx, cx, h - 10, 34, 8, 0.26);

  // Cuerpo redondo y carnoso en pixel art
  for (let dy = -r; dy <= r; dy += p) {
    const span = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy)) / p) * p;
    // Borde exterior
    px(ctx, cx - span - p, cy + dy, p, p, ink);
    px(ctx, cx + span, cy + dy, p, p, ink);

    for (let dx = -span; dx < span; dx += p) {
      let col = PALETTE.tomato;
      const distFromHighlight = Math.hypot(dx + 12, dy + 12);
      if (distFromHighlight < 10) {
        col = PALETTE.cream;
      } else if (distFromHighlight < 18) {
        col = PALETTE.coralLight;
      } else if (dx > span * 0.35 || dy > r * 0.45) {
        col = PALETTE.tomatoDark; // Sombra inferior/derecha
      }
      // Dithering entre rojo y sombra
      if (dx > span * 0.2 && dx <= span * 0.35 && (dx + dy) % (p * 2) === 0) {
        col = PALETTE.tomatoDark;
      }
      px(ctx, cx + dx, cy + dy, p, p, col);
    }
  }

  // Cáliz verde de estrella caribeña arriba
  const starPoints = [
    [0, -18], [-14, -8], [-18, 4], [14, -8], [18, 4], [0, -4]
  ];
  for (const [pxOffset, pyOffset] of starPoints) {
    const lx = cx + pxOffset;
    const ly = cy - 28 + pyOffset;
    px(ctx, lx - p, ly - p, p * 3, p * 3, ink);
    px(ctx, lx, ly, p, p, PALETTE.leafLight);
  }
  // Tallo
  px(ctx, cx - p, cy - 38, p * 2, p * 4, PALETTE.leafDark);
  px(ctx, cx, cy - 42, p * 3, p * 2, PALETTE.leaf);
}

function drawFish(ctx, w, h) {
  const p = 3;
  const cx = Math.floor(w * 0.52 / p) * p;
  const cy = Math.floor(h * 0.54 / p) * p;
  pixelShadow(ctx, cx, h - 8, 44, 9, 0.24);

  // Pescado de arrecife caribeño (turquesa, coral, aletas en abanico)
  // Cola bífida pixel art
  const tailX = cx - 56;
  for (let dy = -28; dy <= 28; dy += p) {
    const spread = Math.abs(dy);
    const tw = Math.floor((28 - spread * 0.6) / p) * p;
    px(ctx, tailX - tw - p, cy + dy, p, p, ink);
    for (let x = tailX - tw; x <= tailX; x += p) {
      const col = dy % (p * 2) === 0 ? PALETTE.coral : PALETTE.coralLight;
      px(ctx, x, cy + dy, p, p, col);
    }
  }

  // Cuerpo ovalado de pez
  const len = 52;
  const bodyH = 34;
  for (let dy = -bodyH; dy <= bodyH; dy += p) {
    const normY = dy / bodyH;
    const span = Math.floor(Math.sqrt(Math.max(0, 1 - normY * normY)) * len / p) * p;

    // Contorno oscuro
    px(ctx, cx - span - p, cy + dy, p, p, ink);
    px(ctx, cx + span, cy + dy, p, p, ink);

    for (let dx = -span; dx < span; dx += p) {
      let col = PALETTE.sea;
      if (dy > bodyH * 0.3) {
        col = PALETTE.cream; // Vientre blanco/plateado
      } else if (dy < -bodyH * 0.3) {
        col = PALETTE.seaDark; // Lomo oscuro
      } else {
        // Escamas pixeladas con patrón damero de arrecife
        col = ((dx + dy) / p) % 2 === 0 ? PALETTE.lagoon : PALETTE.lagoonLight;
      }
      px(ctx, cx + dx, cy + dy, p, p, col);
    }
  }

  // Aleta dorsal superior (coral y dorado)
  for (let dx = -18; dx <= 22; dx += p * 2) {
    const hAleta = Math.floor((14 - Math.abs(dx) * 0.3) / p) * p;
    px(ctx, cx + dx, cy - bodyH - hAleta, p, hAleta, PALETTE.coral);
    px(ctx, cx + dx, cy - bodyH - hAleta - p, p, p, PALETTE.gold);
  }

  // Aleta pectoral lateral
  for (let dy = 0; dy <= 16; dy += p) {
    px(ctx, cx - 6 + dy * 0.6, cy + dy, p * 3, p, PALETTE.coral);
  }

  // Ojo saliente de pez caribeño
  const eyeX = cx + 32;
  const eyeY = cy - 8;
  px(ctx, eyeX - p * 3, eyeY - p * 3, p * 6, p * 6, ink);
  px(ctx, eyeX - p * 2, eyeY - p * 2, p * 4, p * 4, PALETTE.salt);
  px(ctx, eyeX - p, eyeY - p, p * 2, p * 2, ink);
  px(ctx, eyeX, eyeY - p * 2, p, p, PALETTE.salt); // Brillo

  // Boca de pez
  px(ctx, cx + len - 4, cy + 4, p * 3, p * 2, PALETTE.coralDark);
}

function drawCrab(ctx, w, h) {
  const p = 3;
  const cx = Math.floor(w * 0.5 / p) * p;
  const cy = Math.floor(h * 0.58 / p) * p;
  pixelShadow(ctx, cx, h - 8, 48, 9, 0.28);

  // Patas de cangrejo (3 a cada lado, articuladas en pixel art)
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const legY = cy + 4 + i * 10;
      const seg1X = cx + side * 28;
      const seg2X = cx + side * (46 + i * 4);
      const seg3X = cx + side * (62 + i * 6);
      const tipY = cy + 18 + i * 8;

      // Segmento superior
      px(ctx, seg1X, legY, side * 18, p * 2, PALETTE.coralDark);
      px(ctx, seg1X, legY - p, side * 18, p, ink);
      // Segmento bajante
      px(ctx, seg2X, legY, p * 2, tipY - legY, PALETTE.coral);
      px(ctx, seg2X + (side > 0 ? p * 2 : -p), legY, p, tipY - legY, ink);
      // Punta apoyada
      px(ctx, seg3X, tipY, p * 2, p * 2, PALETTE.pineapple);
    }
  }

  // Pinzas caribeñas colosales (símbolo del juego)
  for (const side of [-1, 1]) {
    const clawBaseX = cx + side * 44;
    const clawBaseY = cy - 14;

    // Brazo conector
    px(ctx, cx + side * 24, cy - 6, side * 20, p * 3, PALETTE.coralDark);
    px(ctx, cx + side * 24, cy - 6 - p, side * 20, p, ink);

    // Pinza grande redondeada
    const clawR = 18;
    for (let dy = -clawR; dy <= clawR; dy += p) {
      const span = Math.floor(Math.sqrt(Math.max(0, clawR * clawR - dy * dy)) / p) * p;
      px(ctx, clawBaseX - span - p, clawBaseY + dy, p, p, ink);
      px(ctx, clawBaseX + span, clawBaseY + dy, p, p, ink);
      for (let dx = -span; dx < span; dx += p) {
        const col = dy < 0 ? PALETTE.coralLight : PALETTE.coral;
        px(ctx, clawBaseX + dx, clawBaseY + dy, p, p, col);
      }
    }
    // Dientes / pinzas en tijera afiladas
    const tipX = clawBaseX + side * 18;
    px(ctx, tipX, clawBaseY - 10, side * 14, p * 3, PALETTE.pineapple);
    px(ctx, tipX, clawBaseY + 4, side * 14, p * 3, PALETTE.pineapple);
    px(ctx, tipX + side * 14, clawBaseY - 10, p, p * 3, ink);
    px(ctx, tipX + side * 14, clawBaseY + 4, p, p * 3, ink);
  }

  // Caparazón acorazado de cangrejo playero
  const shellW = 38;
  const shellH = 28;
  for (let dy = -shellH; dy <= shellH; dy += p) {
    const norm = dy / shellH;
    const span = Math.floor(Math.sqrt(Math.max(0, 1 - norm * norm)) * shellW / p) * p;
    px(ctx, cx - span - p, cy + dy, p, p, ink);
    px(ctx, cx + span, cy + dy, p, p, ink);

    for (let dx = -span; dx < span; dx += p) {
      let col = PALETTE.coral;
      if (dy < -shellH * 0.4) {
        col = PALETTE.coralLight; // Placa dorsal superior iluminada
      } else if (dy > shellH * 0.35) {
        col = PALETTE.tomatoDark; // Placa inferior en sombra
      } else if ((dx + dy) % (p * 4) === 0) {
        col = PALETTE.mango; // Motitas moteadas de cangrejo tropical
      }
      px(ctx, cx + dx, cy + dy, p, p, col);
    }
  }

  // Ojos saltones de cangrejo caribeño
  for (const side of [-1, 1]) {
    const eyeX = cx + side * 14;
    const eyeY = cy - 36;
    // Tallo vertical
    px(ctx, eyeX - p, cy - 26, p * 2, 10, ink);
    px(ctx, eyeX - p + 1, cy - 26, p, 10, PALETTE.coralDark);
    // Esfera blanca del ojo
    px(ctx, eyeX - p * 3, eyeY - p * 3, p * 6, p * 6, ink);
    px(ctx, eyeX - p * 2, eyeY - p * 2, p * 4, p * 4, PALETTE.salt);
    px(ctx, eyeX - p, eyeY - p, p * 2, p * 2, ink);
    px(ctx, eyeX, eyeY - p * 2, p, p, PALETTE.salt);
  }

  // Boca simpática de cangrejo
  px(ctx, cx - 8, cy + 8, 16, p, ink);
  px(ctx, cx - 6, cy + 11, 12, p, PALETTE.cream);
}

function drawMango(ctx, w, h) {
  const p = 3;
  const cx = Math.floor(w * 0.5 / p) * p;
  const cy = Math.floor(h * 0.58 / p) * p;
  pixelShadow(ctx, cx, h - 8, 34, 8, 0.24);

  // Forma de gota carnosa asimétrica en pixel art
  const rY = 40;
  for (let dy = -rY; dy <= rY; dy += p) {
    const t = (dy + rY) / (rY * 2);
    // Asimetría típica del mango
    const bulge = Math.sin(t * Math.PI) * 32;
    const leftSpan = Math.floor((bulge * 0.85) / p) * p;
    const rightSpan = Math.floor((bulge * 1.15) / p) * p;

    px(ctx, cx - leftSpan - p, cy + dy, p, p, ink);
    px(ctx, cx + rightSpan, cy + dy, p, p, ink);

    for (let dx = -leftSpan; dx < rightSpan; dx += p) {
      let col = PALETTE.mango;
      // Degradado tropical caribeño: carmesí -> naranja -> dorado
      if (dx < 0 && dy < 0) {
        col = PALETTE.coral;
        if (dx < -leftSpan * 0.4 && dy < -rY * 0.3) col = PALETTE.coralDark;
      } else if (dx > 0 && dy > 0) {
        col = PALETTE.pineapple;
        if (dx > rightSpan * 0.5) col = PALETTE.gold;
      }
      // Dithering caribeño
      if ((dx + dy) % (p * 3) === 0 && dx < 0) col = PALETTE.tomato;
      px(ctx, cx + dx, cy + dy, p, p, col);
    }
  }

  // Brillo de piel jugosa encerada
  px(ctx, cx - 14, cy - 14, p * 2, p * 5, PALETTE.cream);
  px(ctx, cx - 11, cy - 20, p * 2, p * 2, PALETTE.salt);

  // Tallo leñoso y hojita tierna verde
  px(ctx, cx - p, cy - rY - 10, p * 2, 12, PALETTE.woodDark);
  for (let i = 0; i < 7; i++) {
    px(ctx, cx + 4 + i * 3, cy - rY - 6 - i * 2, p * 2, p * 2, PALETTE.leafLight);
    px(ctx, cx + 4 + i * 3, cy - rY - 4 - i * 2, p * 2, p, PALETTE.leafDark);
  }
}

function drawChili(ctx, w, h) {
  const p = 3;
  const cx = Math.floor(w * 0.5 / p) * p;
  pixelShadow(ctx, cx, h - 8, 26, 7, 0.22);

  // Ají caribeño alargado y curvado hacia la derecha
  const topY = 36;
  const bottomY = 136;
  for (let y = topY; y <= bottomY; y += p) {
    const t = (y - topY) / (bottomY - topY);
    const curve = Math.sin(t * Math.PI * 0.9) * 16;
    const width = Math.max(p, Math.floor((1 - t * 0.85) * 22 / p) * p);
    const xMid = cx + curve;

    px(ctx, xMid - width - p, y, p, p, ink);
    px(ctx, xMid + width, y, p, p, ink);

    for (let x = xMid - width; x < xMid + width; x += p) {
      let col = PALETTE.tomato;
      if (x < xMid - width * 0.2) col = PALETTE.coral;
      else if (x > xMid + width * 0.3) col = PALETTE.tomatoDark;
      px(ctx, x, y, p, p, col);
    }
  }

  // Brillo blanco continuo picante a lo largo de la curva
  for (let y = topY + 12; y <= topY + 70; y += p * 2) {
    const t = (y - topY) / (bottomY - topY);
    const curve = Math.sin(t * Math.PI * 0.9) * 16;
    px(ctx, cx + curve - 4, y, p, p, PALETTE.cream);
  }

  // Cáliz verde y rabillo curvo en la cabeza
  px(ctx, cx - 14, topY - p * 2, 28, p * 3, PALETTE.leafDark);
  px(ctx, cx - 10, topY - p * 3, 20, p * 2, PALETTE.leaf);
  // Rabillo
  px(ctx, cx - 4, topY - 14, p * 2, 8, PALETTE.leafDark);
  px(ctx, cx + 2, topY - 18, p * 3, p * 2, PALETTE.leaf);
}

function drawLime(ctx, w, h) {
  const p = 3;
  const cx = Math.floor(w * 0.5 / p) * p;
  const cy = Math.floor(h * 0.56 / p) * p;
  const r = 35;
  pixelShadow(ctx, cx, h - 8, 32, 7, 0.22);

  // Rodaja de lima fresca caribeña cortada mostrando los gajos pixel art
  for (let dy = -r; dy <= r; dy += p) {
    const span = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy)) / p) * p;
    px(ctx, cx - span - p, cy + dy, p, p, ink);
    px(ctx, cx + span, cy + dy, p, p, ink);

    for (let dx = -span; dx < span; dx += p) {
      const dist = Math.hypot(dx, dy);
      let col = PALETTE.leafDark; // Corteza exterior
      if (dist < r - 5 && dist >= r - 10) {
        col = PALETTE.cream; // Albedo blanco
      } else if (dist < r - 10) {
        // Gajos radiales translúcidos
        const angle = (Math.atan2(dy, dx) + TAU) % TAU;
        const segment = (angle / (TAU / 8)) % 1;
        if (segment < 0.14 || segment > 0.86 || dist < 6) {
          col = PALETTE.cream; // Separador blanco entre gajos
        } else {
          col = ((dx + dy) / p) % 2 === 0 ? PALETTE.lime : PALETTE.leafLight; // Vesículas jugosas
        }
      }
      px(ctx, cx + dx, cy + dy, p, p, col);
    }
  }

  // Brillo fresco en un gajo
  px(ctx, cx - 14, cy - 14, p * 2, p * 2, PALETTE.salt);

  // Dos hojitas verdes arriba
  for (let i = 0; i < 5; i++) {
    px(ctx, cx + 4 + i * 3, cy - r - 4 - i * 2, p * 2, p * 2, PALETTE.leafLight);
    px(ctx, cx - 6 - i * 3, cy - r - 4 - i * 2, p * 2, p * 2, PALETTE.leaf);
  }
}

function drawOnion(ctx, w, h) {
  const p = 3;
  const cx = Math.floor(w * 0.5 / p) * p;
  const cy = Math.floor(h * 0.58 / p) * p;
  pixelShadow(ctx, cx, h - 8, 32, 7, 0.22);

  // Cebolla morada tropical pixel art
  const rW = 34;
  const rH = 38;
  for (let dy = -rH; dy <= rH; dy += p) {
    const normY = dy / rH;
    // Forma que se afina hacia arriba
    const factor = dy < 0 ? (1 - Math.abs(normY) * 0.45) : (1 - Math.abs(normY) * 0.25);
    const span = Math.floor(Math.sqrt(Math.max(0, 1 - normY * normY)) * rW * factor / p) * p;

    px(ctx, cx - span - p, cy + dy, p, p, ink);
    px(ctx, cx + span, cy + dy, p, p, ink);

    for (let dx = -span; dx < span; dx += p) {
      let col = '#b8669e'; // Púrpura medio
      // Franjas verticales de las capas de cebolla
      if (Math.abs(dx) % (p * 3) === 0) {
        col = '#732c5f'; // Sombra entre capas
      } else if (dx < -span * 0.2) {
        col = '#e0a3cd'; // Luz
      } else if (dx > span * 0.3) {
        col = '#571d47'; // Sombra
      }
      px(ctx, cx + dx, cy + dy, p, p, col);
    }
  }

  // Raíces secas en la base
  for (let i = -2; i <= 2; i++) {
    px(ctx, cx + i * 5, cy + rH, p, p * 3, PALETTE.woodLight);
  }

  // Brote verde superior
  px(ctx, cx - p, cy - rH - 12, p * 2, 14, PALETTE.leaf);
  px(ctx, cx + 2, cy - rH - 18, p * 2, 10, PALETTE.lime);
}

function drawCoconut(ctx, w, h) {
  const p = 3;
  const cx = Math.floor(w * 0.5 / p) * p;
  const cy = Math.floor(h * 0.56 / p) * p;
  const r = 36;
  pixelShadow(ctx, cx, h - 8, 36, 8, 0.26);

  // Coco playero abierto de chiringuito
  // Cáscara marrón fibrosa exterior
  for (let dy = -r; dy <= r; dy += p) {
    const span = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy)) / p) * p;
    px(ctx, cx - span - p, cy + dy, p, p, ink);
    px(ctx, cx + span, cy + dy, p, p, ink);

    for (let dx = -span; dx < span; dx += p) {
      let col = PALETTE.woodDark;
      // Textura de fibras de coco con dithering
      if ((dx + dy) % (p * 3) === 0) col = PALETTE.woodGrain;
      else if (dx < 0 && dy < 0) col = PALETTE.wood;

      // Interior abierto cortado con carne blanca y agua fresca
      if (dy < 6 && dy > -r + 10 && Math.abs(dx) < span - 8) {
        if (Math.abs(dx) > span - 16 || dy < -r + 18) {
          col = PALETTE.salt; // Carne blanca de coco
        } else {
          // Agua de coco cristalina turquesa
          col = ((dx + dy) / p) % 2 === 0 ? PALETTE.lagoonLight : '#c7ffdf';
        }
      }
      px(ctx, cx + dx, cy + dy, p, p, col);
    }
  }

  // Pajita de bambú tropical a rayas asomando del coco
  const strawX = cx + 8;
  const strawY = cy - 28;
  for (let i = 0; i < 22; i += p) {
    const col = (i / p) % 2 === 0 ? PALETTE.coral : PALETTE.cream;
    px(ctx, strawX + i * 0.5, strawY - i, p * 2, p, col);
    px(ctx, strawX + i * 0.5 - p, strawY - i, p, p, ink);
    px(ctx, strawX + i * 0.5 + p * 2, strawY - i, p, p, ink);
  }
}

function drawPineapple(ctx, w, h) {
  const p = 3;
  const cx = Math.floor(w * 0.5 / p) * p;
  pixelShadow(ctx, cx, h - 8, 32, 7, 0.24);

  // Corona exuberante de hojas verdes en abanico
  const topY = 56;
  for (let i = -3; i <= 3; i++) {
    const leafAngle = i * 0.22;
    const len = 38 - Math.abs(i) * 5;
    for (let d = 0; d < len; d += p) {
      const lx = cx + Math.sin(leafAngle) * d;
      const ly = topY - Math.cos(leafAngle) * d;
      const col = (d / p) % 2 === 0 ? PALETTE.leaf : PALETTE.leafLight;
      px(ctx, lx - p, ly, p * 2, p, col);
      px(ctx, lx - p * 2, ly, p, p, ink);
      px(ctx, lx + p, ly, p, p, ink);
    }
  }

  // Cuerpo ovalado de piña con rombos de oro y caramelo
  const bodyY = 96;
  const rW = 34;
  const rH = 44;
  for (let dy = -rH; dy <= rH; dy += p) {
    const norm = dy / rH;
    const span = Math.floor(Math.sqrt(Math.max(0, 1 - norm * norm)) * rW / p) * p;
    px(ctx, cx - span - p, bodyY + dy, p, p, ink);
    px(ctx, cx + span, bodyY + dy, p, p, ink);

    for (let dx = -span; dx < span; dx += p) {
      // Patrón de rombos de piña pixel art
      const pattern = (Math.floor((dx + dy) / (p * 4)) + Math.floor((dx - dy) / (p * 4))) % 2 === 0;
      let col = pattern ? PALETTE.pineapple : PALETTE.mango;

      // Centro del ojo de piña
      if ((Math.abs(dx) % (p * 4) === 0) && (Math.abs(dy) % (p * 4) === 0)) {
        col = PALETTE.woodDark;
      } else if (dx < -span * 0.3) {
        col = PALETTE.gold; // Luz solar
      } else if (dx > span * 0.3) {
        col = PALETTE.woodLight; // Sombra cálida
      }
      px(ctx, cx + dx, bodyY + dy, p, p, col);
    }
  }
}

function drawRice(ctx, w, h) {
  const p = 3;
  const cx = Math.floor(w * 0.5 / p) * p;
  pixelShadow(ctx, cx, h - 8, 36, 8, 0.24);

  // Cuenco de coco / barro esmaltado turquesa de chiringuito
  const bowlTopY = 74;
  const bowlH = 48;
  const bowlW = 38;

  // Arroz al vapor montado en cúpula
  for (let dy = -26; dy <= 0; dy += p) {
    const norm = dy / 26;
    const span = Math.floor(Math.sqrt(Math.max(0, 1 - norm * norm)) * (bowlW - 2) / p) * p;
    px(ctx, cx - span - p, bowlTopY + dy, p, p, ink);
    px(ctx, cx + span, bowlTopY + dy, p, p, ink);
    for (let dx = -span; dx < span; dx += p) {
      let col = PALETTE.salt;
      // Granos individuales visibles y motitas de cilantro
      if ((dx + dy) % (p * 3) === 0) {
        col = PALETTE.sugar;
      } else if ((dx * dy) % 17 === 0) {
        col = PALETTE.leafLight; // Cilantro picado
      }
      px(ctx, cx + dx, bowlTopY + dy, p, p, col);
    }
  }

  // Cuerpo del cuenco esmaltado
  for (let dy = 0; dy <= bowlH; dy += p) {
    const t = dy / bowlH;
    const span = Math.floor((1 - t * 0.45) * bowlW / p) * p;
    px(ctx, cx - span - p, bowlTopY + dy, p, p, ink);
    px(ctx, cx + span, bowlTopY + dy, p, p, ink);

    for (let dx = -span; dx < span; dx += p) {
      let col = PALETTE.lagoon;
      if (dx < -span * 0.25) col = PALETTE.lagoonLight;
      else if (dx > span * 0.25) col = PALETTE.sea;
      // Ribete de madera rústica en el borde superior
      if (dy < p * 2) col = PALETTE.woodLight;
      px(ctx, cx + dx, bowlTopY + dy, p, p, col);
    }
  }
  // Base del cuenco
  px(ctx, cx - 18, bowlTopY + bowlH, 36, p * 2, PALETTE.woodDark);
}

// ---------------------------------------------------------------------------
// Utensilios del Chiringuito Caribeño
// ---------------------------------------------------------------------------

function drawKnife(ctx, w, h) {
  const p = 3;
  const cy = Math.floor(h * 0.54 / p) * p;

  // Cuchillo machete playero de chiringuito caribeño
  // Mango de madera de palapa con remaches de latón dorado
  const handleX = Math.floor(w * 0.62 / p) * p;
  const handleW = 60;
  const handleH = 22;

  px(ctx, handleX - p, cy - handleH * 0.5 - p, handleW + p * 2, handleH + p * 2, ink);
  for (let y = cy - handleH * 0.5; y < cy + handleH * 0.5; y += p) {
    for (let x = handleX; x < handleX + handleW; x += p) {
      let col = PALETTE.wood;
      if (y === cy - handleH * 0.5) col = PALETTE.woodLight;
      else if (y >= cy + handleH * 0.5 - p) col = PALETTE.woodDark;
      else if ((x + y) % (p * 4) === 0) col = PALETTE.woodGrain;
      px(ctx, x, y, p, p, col);
    }
  }
  // Tres remaches dorados en el mango
  for (let i = 0; i < 3; i++) {
    const rx = handleX + 12 + i * 18;
    px(ctx, rx - p, cy - p, p * 2, p * 2, PALETTE.gold);
    px(ctx, rx, cy - p, p, p, PALETTE.salt);
  }

  // Virola de latón
  px(ctx, handleX - 8, cy - handleH * 0.5 - p, 8, handleH + p * 2, ink);
  px(ctx, handleX - 7, cy - handleH * 0.5, 6, handleH, PALETTE.gold);

  // Hoja ancha de machete caribeño (acero templado con filo biselado y muesca)
  const bladeStartX = handleX - 8;
  const bladeEndX = Math.floor(w * 0.12 / p) * p;
  const bladeW = bladeStartX - bladeEndX;
  const bladeH = 32;

  for (let x = bladeEndX; x < bladeStartX; x += p) {
    const t = (x - bladeEndX) / bladeW;
    const curve = Math.sin(t * Math.PI * 0.5);
    const topEdge = cy - 14;
    const bottomEdge = cy - 14 + Math.floor(curve * bladeH / p) * p;

    px(ctx, x, topEdge - p, p, p, ink);
    px(ctx, x, bottomEdge, p, p, ink);

    for (let y = topEdge; y < bottomEdge; y += p) {
      let col = PALETTE.steel;
      if (y === topEdge) col = PALETTE.steelLight;
      else if (y >= bottomEdge - p * 2) col = PALETTE.salt; // Filo afilado blanco
      else if (y > cy + 2) col = PALETTE.steelMid;
      px(ctx, x, y, p, p, col);
    }
  }
  // Punta del machete
  px(ctx, bladeEndX - p, cy - 12, p, 10, ink);
}

function drawPot(ctx, w, h) {
  const p = 3;
  const cx = Math.floor(w * 0.5 / p) * p;
  pixelShadow(ctx, cx, h - 10, 48, 10, 0.28);

  // Caldero de hierro fundido / barro curado de chiringuito
  const potY = 56;
  const potW = 46;
  const potH = 68;

  // Asas gruesas de hierro a los lados
  for (const side of [-1, 1]) {
    const ax = cx + side * (potW + 8);
    px(ctx, ax - p * 2, potY + 12, p * 4, 18, ink);
    px(ctx, ax - p, potY + 14, p * 2, 14, PALETTE.woodLight);
  }

  // Cuerpo redondeado de caldero
  for (let dy = 0; dy <= potH; dy += p) {
    const t = dy / potH;
    const span = Math.floor(Math.sin(t * Math.PI * 0.8 + 0.3) * potW / p) * p;
    px(ctx, cx - span - p, potY + dy, p, p, ink);
    px(ctx, cx + span, potY + dy, p, p, ink);

    for (let dx = -span; dx < span; dx += p) {
      let col = PALETTE.steelDark;
      if (dx < -span * 0.3) col = PALETTE.steelMid;
      else if (dx > span * 0.3) col = '#22282a';
      // Remaches náuticos de refuerzo
      if (dy === Math.floor(potH * 0.5 / p) * p && Math.abs(dx) % (p * 5) === 0) {
        col = PALETTE.gold;
      }
      px(ctx, cx + dx, potY + dy, p, p, col);
    }
  }

  // Borde superior y caldo aromático borboteando
  for (let dx = -potW + 4; dx < potW - 4; dx += p) {
    px(ctx, cx + dx, potY - p, p, p, ink);
    px(ctx, cx + dx, potY, p, p * 2, PALETTE.coralLight);
    // Burbujas doradas de especias
    if ((dx / p) % 3 === 0) px(ctx, cx + dx, potY + p, p, p, PALETTE.pineapple);
  }

  // Vapores aromáticos ascendentes pixel art
  for (let i = -1; i <= 1; i++) {
    const vx = cx + i * 18;
    for (let s = 0; s < 6; s++) {
      const vy = potY - 10 - s * 6;
      const wave = Math.sin(s * 0.8 + i) * 6;
      px(ctx, vx + wave, vy, p * 2, p * 2, PALETTE.steam);
    }
  }
}

function drawPan(ctx, w, h) {
  const p = 3;
  const cx = Math.floor(w * 0.44 / p) * p;
  const cy = Math.floor(h * 0.58 / p) * p;
  pixelShadow(ctx, cx, h - 10, 44, 9, 0.26);

  // Sartén rústica de hierro negro curado al fuego de chiringuito
  // Mango largo de madera con remaches de latón
  const handleX = cx + 46;
  const handleW = 54;
  px(ctx, handleX, cy - 6, handleW, 12, ink);
  for (let x = handleX + p; x < handleX + handleW - p; x += p) {
    px(ctx, x, cy - 4, p, 8, PALETTE.wood);
    px(ctx, x, cy - 4, p, p, PALETTE.woodLight);
  }
  // Orificio de colgar en el extremo
  px(ctx, handleX + handleW - 8, cy - 2, p, p * 2, ink);

  // Plato hondo de la sartén de hierro
  const rX = 46;
  const rY = 24;
  for (let dy = -rY; dy <= rY; dy += p) {
    const norm = dy / rY;
    const span = Math.floor(Math.sqrt(Math.max(0, 1 - norm * norm)) * rX / p) * p;
    px(ctx, cx - span - p, cy + dy, p, p, ink);
    px(ctx, cx + span, cy + dy, p, p, ink);

    for (let dx = -span; dx < span; dx += p) {
      let col = '#242a2e'; // Hierro curado
      if (dy > rY - p * 2) col = '#14181a';
      else if (dy < -rY + p * 2) col = PALETTE.steelMid;

      // Interior de la sartén con comida dorándose al punto
      if (Math.hypot(dx / (rX - 8), dy / (rY - 6)) < 0.9) {
        col = PALETTE.ink;
        // Chispas de aceite caliente y dorado
        if ((dx + dy) % (p * 4) === 0) col = PALETTE.mango;
        else if ((dx * dy) % 11 === 0) col = PALETTE.pineapple;
      }
      px(ctx, cx + dx, cy + dy, p, p, col);
    }
  }
}

function drawSaltShaker(ctx, w, h) {
  const p = 3;
  const cx = Math.floor(w * 0.5 / p) * p;
  pixelShadow(ctx, cx, h - 8, 24, 6, 0.24);

  // Salero de caña de bambú natural y concha marina de chiringuito
  const bodyTop = 50;
  const bodyH = 74;
  const bodyW = 20;

  // Cuerpo cilíndrico de bambú
  for (let dy = 0; dy <= bodyH; dy += p) {
    px(ctx, cx - bodyW - p, bodyTop + dy, p, p, ink);
    px(ctx, cx + bodyW, bodyTop + dy, p, p, ink);

    for (let dx = -bodyW; dx < bodyW; dx += p) {
      let col = PALETTE.paper;
      // Vetas de nudos de bambú y textura tropical
      if (dy === Math.floor(bodyH * 0.5 / p) * p) {
        col = PALETTE.woodLight; // Nudo del bambú
      } else if (dx < -bodyW * 0.3) {
        col = PALETTE.cream;
      } else if (dx > bodyW * 0.3) {
        col = PALETTE.paperDark;
      }
      px(ctx, cx + dx, bodyTop + dy, p, p, col);
    }
  }

  // Tapa superior de madera con orificios de sal
  px(ctx, cx - bodyW - p, bodyTop - 14, bodyW * 2 + p * 2, 14, ink);
  px(ctx, cx - bodyW, bodyTop - 12, bodyW * 2, 10, PALETTE.wood);
  for (let i = -1; i <= 1; i++) {
    px(ctx, cx + i * 8 - p, bodyTop - 8, p * 2, p * 2, ink);
  }

  // Granos de sal marina gruesa cayendo pixel art
  const saltDots = [
    [-6, 12], [6, 16], [-10, 24], [2, 28], [8, 36], [-4, 42]
  ];
  for (const [sx, sy] of saltDots) {
    px(ctx, cx + sx, bodyTop + bodyH + sy, p, p, PALETTE.salt);
  }
}

function drawPlate(ctx, w, h) {
  const p = 3;
  const cx = Math.floor(w * 0.5 / p) * p;
  const cy = Math.floor(h * 0.58 / p) * p;
  pixelShadow(ctx, cx, cy + 18, 56, 12, 0.25);

  // Fuente de cerámica esmaltada caribeña (turquesa laguna, terracota y fondo crema)
  const rX = 62;
  const rY = 28;

  for (let dy = -rY; dy <= rY; dy += p) {
    const norm = dy / rY;
    const span = Math.floor(Math.sqrt(Math.max(0, 1 - norm * norm)) * rX / p) * p;
    px(ctx, cx - span - p, cy + dy, p, p, ink);
    px(ctx, cx + span, cy + dy, p, p, ink);

    for (let dx = -span; dx < span; dx += p) {
      let col = PALETTE.paper;
      const borderDist = Math.hypot(dx / rX, dy / rY);
      // Ribete exterior caribeño esmaltado en turquesa de arrecife
      if (borderDist > 0.82) {
        col = ((dx + dy) / p) % 2 === 0 ? PALETTE.lagoon : PALETTE.sea;
      } else if (borderDist > 0.74) {
        col = PALETTE.gold; // Filete dorado
      } else if (borderDist < 0.3) {
        col = PALETTE.salt; // Centro brillante
      }
      px(ctx, cx + dx, cy + dy, p, p, col);
    }
  }
}

function drawWateringCan(ctx, w, h) {
  const p = 3;
  const cx = Math.floor(w * 0.44 / p) * p;
  pixelShadow(ctx, cx, h - 8, 38, 8, 0.24);

  // Regadera de chapa de zinc galvanizada marina
  const canY = 56;
  const canH = 72;
  const canW = 32;

  // Cuerpo cilíndrico
  for (let dy = 0; dy <= canH; dy += p) {
    px(ctx, cx - canW - p, canY + dy, p, p, ink);
    px(ctx, cx + canW, canY + dy, p, p, ink);
    for (let dx = -canW; dx < canW; dx += p) {
      let col = PALETTE.steelMid;
      if (dx < -canW * 0.3) col = PALETTE.steelLight;
      else if (dx > canW * 0.3) col = PALETTE.steelDark;
      px(ctx, cx + dx, canY + dy, p, p, col);
    }
  }

  // Asa reforzada arqueada superior
  for (let i = -16; i <= 16; i += p) {
    const archY = canY - 22 + Math.abs(i) * 0.8;
    px(ctx, cx + i - p, archY - p, p * 2, p * 2, ink);
    px(ctx, cx + i, archY, p, p, PALETTE.woodLight);
  }

  // Pitorro diagonal con flor de aspersión
  for (let step = 0; step < 36; step += p) {
    const sx = cx + canW - 4 + step;
    const sy = canY + 36 - step * 0.7;
    px(ctx, sx, sy, p * 2, p * 2, PALETTE.steelDark);
  }
  // Flor de ducha
  const sprayX = cx + canW + 34;
  const sprayY = canY + 10;
  px(ctx, sprayX - p, sprayY - p * 3, p * 3, p * 6, PALETTE.steelLight);
  // Gotas de agua fresca cristalina pixel art
  for (let g = 0; g < 4; g++) {
    px(ctx, sprayX + 8 + g * 6, sprayY + 8 + g * 8, p, p * 2, PALETTE.lagoonLight);
  }
}

function drawShovel(ctx, w, h) {
  const p = 3;
  const cx = Math.floor(w * 0.5 / p) * p;
  pixelShadow(ctx, cx, h - 8, 26, 7, 0.24);

  // Pala de playa y huerto
  // Mango en T de madera rústica
  const topY = 36;
  px(ctx, cx - 18, topY - p, 36, p * 3, ink);
  px(ctx, cx - 16, topY, 32, p, PALETTE.wood);

  // Palo de madera
  const shaftH = 82;
  px(ctx, cx - p * 2, topY, p * 4, shaftH, ink);
  px(ctx, cx - p, topY, p * 2, shaftH, PALETTE.woodLight);

  // Hoja de hierro de la pala con arena dorada pegada
  const bladeY = topY + shaftH;
  const bladeW = 24;
  const bladeH = 50;

  for (let dy = 0; dy <= bladeH; dy += p) {
    const t = dy / bladeH;
    const span = Math.floor(bladeW * (1 - Math.pow(t, 2) * 0.8) / p) * p;
    px(ctx, cx - span - p, bladeY + dy, p, p, ink);
    px(ctx, cx + span, bladeY + dy, p, p, ink);

    for (let dx = -span; dx < span; dx += p) {
      let col = PALETTE.steelDark;
      if (dx < 0) col = PALETTE.steelMid;
      // Arena de playa en la punta
      if (dy > bladeH * 0.6 && (dx + dy) % (p * 2) === 0) {
        col = PALETTE.pineapple;
      }
      px(ctx, cx + dx, bladeY + dy, p, p, col);
    }
  }
}

function drawSeed(ctx, w, h) {
  const p = 3;
  const cx = Math.floor(w * 0.5 / p) * p;
  pixelShadow(ctx, cx, h - 8, 24, 6, 0.22);

  // Saco de arpillera con cordel y brote tropical
  const bagTop = 44;
  const bagH = 80;
  const bagW = 24;

  for (let dy = 0; dy <= bagH; dy += p) {
    const t = dy / bagH;
    const span = Math.floor((Math.sin(t * Math.PI) * 0.6 + 0.6) * bagW / p) * p;
    px(ctx, cx - span - p, bagTop + dy, p, p, ink);
    px(ctx, cx + span, bagTop + dy, p, p, ink);

    for (let dx = -span; dx < span; dx += p) {
      let col = PALETTE.paper;
      // Trama de arpillera cruzada
      if ((dx / p + dy / p) % 2 === 0) col = PALETTE.woodLight;
      px(ctx, cx + dx, bagTop + dy, p, p, col);
    }
  }

  // Cordón de cáñamo atado
  px(ctx, cx - bagW * 0.6 - p, bagTop + 14, bagW * 1.2 + p * 2, p * 2, ink);
  px(ctx, cx - bagW * 0.6, bagTop + 14, bagW * 1.2, p, PALETTE.coral);

  // Brote verde asomando arriba
  px(ctx, cx - p, bagTop - 12, p * 2, 14, PALETTE.leafDark);
  px(ctx, cx - 8, bagTop - 18, 8, p * 2, PALETTE.lime);
  px(ctx, cx + 2, bagTop - 16, 8, p * 2, PALETTE.leafLight);
}

function drawCrate(ctx, w, h) {
  const p = 3;
  const cx = Math.floor(w * 0.5 / p) * p;
  pixelShadow(ctx, cx, h - 8, 48, 8, 0.26);

  // Caja de frutas y marisco de madera de chiringuito
  const crateX = 14;
  const crateY = 28;
  const crateW = w - 28;
  const crateH = h - 42;

  px(ctx, crateX - p, crateY - p, crateW + p * 2, crateH + p * 2, ink);
  for (let y = crateY; y < crateY + crateH; y += p) {
    for (let x = crateX; x < crateX + crateW; x += p) {
      let col = PALETTE.wood;
      // Ranuras entre listones de madera
      if ((y - crateY) % (p * 8) < p) {
        col = PALETTE.woodDark;
      } else if ((x - crateX) % (p * 5) === 0) {
        col = PALETTE.woodLight;
      }
      px(ctx, x, y, p, p, col);
    }
  }

  // Refuerzos esquineros y clavos de hierro forjado
  for (let i = 0; i < 4; i++) {
    const rx = i % 2 === 0 ? crateX + 4 : crateX + crateW - 8;
    const ry = i < 2 ? crateY + 4 : crateY + crateH - 8;
    px(ctx, rx, ry, p * 2, p * 2, PALETTE.steelLight);
    px(ctx, rx + 1, ry + 1, p, p, ink);
  }
}

function drawBobber(ctx, w, h) {
  const p = 3;
  const cx = Math.floor(w * 0.5 / p) * p;
  pixelShadow(ctx, cx, h - 8, 18, 5, 0.22);

  // Boya clásica flotante de corcho y madera de balsa
  // Mástil superior
  px(ctx, cx - p, 18, p * 2, 28, ink);
  px(ctx, cx, 18, p, 28, PALETTE.woodLight);
  px(ctx, cx - p * 2, 16, p * 4, p * 2, PALETTE.gold);

  // Esfera / huevo flotador
  const bobY = 68;
  const r = 22;
  for (let dy = -r; dy <= r; dy += p) {
    const span = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy)) / p) * p;
    px(ctx, cx - span - p, bobY + dy, p, p, ink);
    px(ctx, cx + span, bobY + dy, p, p, ink);

    for (let dx = -span; dx < span; dx += p) {
      let col = dy < 0 ? PALETTE.coral : PALETTE.salt;
      if (Math.abs(dy) < p) col = ink; // Cinturón negro central
      else if (dx < -span * 0.3) col = dy < 0 ? PALETTE.coralLight : PALETTE.cream;
      px(ctx, cx + dx, bobY + dy, p, p, col);
    }
  }
}

function drawStar(ctx, w, h) {
  const p = 3;
  const cx = Math.floor(w * 0.5 / p) * p;
  const cy = Math.floor(h * 0.5 / p) * p;

  // Estrella retro pixel art 8-bits dorada
  const rOuter = 38;
  const rInner = 16;
  const numPoints = 5;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-Math.PI / 2);

  // Relleno faceteado
  for (let dy = -rOuter; dy <= rOuter; dy += p) {
    for (let dx = -rOuter; dx <= rOuter; dx += p) {
      const dist = Math.hypot(dx, dy);
      const angle = (Math.atan2(dy, dx) + TAU) % TAU;
      const step = TAU / numPoints;
      const modAngle = (angle % step) / step;
      const rThreshold = (modAngle < 0.5)
        ? rInner + (rOuter - rInner) * (modAngle * 2)
        : rOuter - (rOuter - rInner) * ((modAngle - 0.5) * 2);

      if (dist <= rThreshold) {
        let col = PALETTE.gold;
        if (dy < 0) col = PALETTE.star;
        if (dist < 10) col = PALETTE.salt;
        px(ctx, dx, dy, p, p, col);
      } else if (dist <= rThreshold + p * 1.5) {
        px(ctx, dx, dy, p, p, ink);
      }
    }
  }
  ctx.restore();
}

function drawSpark(ctx, w, h) {
  const p = 3;
  const cx = Math.floor(w * 0.5 / p) * p;
  const cy = Math.floor(h * 0.5 / p) * p;

  // Chispa de 4 puntas estilo arcade retro
  const len = 32;
  for (let d = 0; d <= len; d += p) {
    const width = Math.max(p, Math.floor((1 - d / len) * 12 / p) * p);
    // 4 cuadrantes
    for (const [sx, sy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = cx + sx * d;
      const y = cy + sy * d;
      const col = d < 8 ? PALETTE.salt : (d < 20 ? PALETTE.star : PALETTE.mango);
      if (sx !== 0) px(ctx, x, y - width * 0.5, p, width, col);
      else px(ctx, x - width * 0.5, y, width, p, col);
    }
  }
}

// ---------------------------------------------------------------------------
// Gestos UI Pixel Art
// ---------------------------------------------------------------------------

function drawPixelHand(ctx, cx, cy, p = 3) {
  // Guante / mano retro arcade pixel art
  px(ctx, cx - 14, cy - 14, 28, 28, ink);
  px(ctx, cx - 12, cy - 12, 24, 24, PALETTE.cream);
  px(ctx, cx - 8, cy - 20, 16, 12, ink);
  px(ctx, cx - 6, cy - 18, 12, 10, PALETTE.cream); // Dedo índice
  px(ctx, cx - 12, cy + 6, 24, 6, PALETTE.coral); // Muñequera caribeña
}

function drawGestureDrag(ctx, w, h) {
  const p = 3;
  const cy = Math.floor(h * 0.54 / p) * p;

  // Línea guía de puntos pixel art
  for (let x = 24; x < w - 24; x += p * 3) {
    px(ctx, x, cy - p, p * 2, p * 2, PALETTE.cream);
  }
  // Flecha arcade turquesa
  for (let i = 0; i < 6; i++) {
    px(ctx, w - 36 + i * 2, cy - 12 + i * 2, p * 2, (12 - i * 2) * 2, PALETTE.lagoon);
  }
  drawPixelHand(ctx, Math.floor(w * 0.48 / p) * p, cy - 8, p);
}

function drawGestureCircle(ctx, w, h) {
  const p = 3;
  const cx = Math.floor(w * 0.5 / p) * p;
  const cy = Math.floor(h * 0.52 / p) * p;
  const r = 38;

  for (let a = 0.4; a < TAU * 0.88; a += 0.15) {
    const gx = cx + Math.cos(a) * r;
    const gy = cy + Math.sin(a) * r;
    px(ctx, gx - p, gy - p, p * 2, p * 2, PALETTE.lagoonLight);
  }
  drawPixelHand(ctx, cx, cy, p);
}

function drawGestureShake(ctx, w, h) {
  const p = 3;
  const cx = Math.floor(w * 0.5 / p) * p;
  const cy = Math.floor(h * 0.54 / p) * p;

  // Ondas de agitación en pixel art
  for (let s of [-1, 1]) {
    for (let r = 26; r <= 42; r += 8) {
      for (let a = -0.5; a <= 0.5; a += 0.25) {
        const ox = cx + s * (r * Math.cos(a));
        const oy = cy + r * Math.sin(a);
        px(ctx, ox - p, oy - p, p * 2, p * 2, PALETTE.mango);
      }
    }
  }
  drawPixelHand(ctx, cx, cy, p);
}

function drawGestureTap(ctx, w, h) {
  const p = 3;
  const cx = Math.floor(w * 0.5 / p) * p;
  const cy = Math.floor(h * 0.58 / p) * p;

  // Ondas de pulso concéntricas
  for (let r of [16, 28, 40]) {
    for (let a = 0; a < TAU; a += 0.28) {
      px(ctx, cx + Math.cos(a) * r - 1, cy + Math.sin(a) * r - 1, p, p, PALETTE.coralLight);
    }
  }
  drawPixelHand(ctx, cx, cy - 14, p);
}

function drawGestureHold(ctx, w, h) {
  const p = 3;
  const cx = Math.floor(w * 0.5 / p) * p;
  const cy = Math.floor(h * 0.58 / p) * p;

  // Barra circular de carga
  for (let a = -Math.PI / 2; a <= Math.PI * 0.6; a += 0.14) {
    px(ctx, cx + Math.cos(a) * 30 - p, cy + Math.sin(a) * 30 - p, p * 2, p * 2, PALETTE.pineapple);
  }
  drawPixelHand(ctx, cx, cy - 12, p);
}

function drawGestureZigzag(ctx, w, h) {
  const p = 3;
  const cy = Math.floor(h * 0.54 / p) * p;

  // Línea zigzag pixelada
  for (let x = 24; x < w - 24; x += p) {
    const seg = Math.floor((x - 24) / 18);
    const offset = (seg % 2 === 0 ? 1 : -1) * ((x - 24) % 18 - 9);
    px(ctx, x, cy + offset, p * 2, p * 2, PALETTE.mango);
  }
  drawPixelHand(ctx, Math.floor(w * 0.74 / p) * p, cy - 10, p);
}

function drawGestureRub(ctx, w, h) {
  const p = 3;
  const cy = Math.floor(h * 0.56 / p) * p;

  // Doble flecha opuesta de frotar
  for (let i = 0; i < 28; i += p) {
    px(ctx, 32 + i, cy - 12, p, p * 2, PALETTE.lagoon);
    px(ctx, w - 32 - i, cy + 12, p, p * 2, PALETTE.coral);
  }
  drawPixelHand(ctx, Math.floor(w * 0.5 / p) * p, cy, p);
}

function drawGestureFlick(ctx, w, h) {
  const p = 3;
  const cx = Math.floor(w * 0.5 / p) * p;
  const cy = Math.floor(h * 0.58 / p) * p;

  // Arco hacia arriba con flecha rápida
  for (let a = 0.2; a < Math.PI * 0.95; a += 0.12) {
    const fx = cx - Math.cos(a) * 28;
    const fy = cy - Math.sin(a) * 34;
    px(ctx, fx - p, fy - p, p * 2, p * 2, PALETTE.coral);
  }
  drawPixelHand(ctx, cx, cy + 8, p);
}

function drawMissing(ctx, w, h) {
  const p = 3;
  const cx = Math.floor(w * 0.5 / p) * p;
  const cy = Math.floor(h * 0.5 / p) * p;
  fillRoundRect(ctx, cx - 34, cy - 34, 68, 68, 8, PALETTE.paper);
  strokeRoundRect(ctx, cx - 34, cy - 34, 68, 68, 8, ink, 4);
  ctx.fillStyle = PALETTE.coral;
  ctx.font = '700 40px "VT323", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', cx, cy + 2);
}

// ---------------------------------------------------------------------------
// Catálogo de Sprites
// ---------------------------------------------------------------------------

export const SPRITE_DEFS = {
  carrot: { width: 120, height: 180, anchorX: 0.5, anchorY: 0.94, draw: drawCarrot },
  tomato: { width: 120, height: 120, anchorX: 0.5, anchorY: 0.9, draw: drawTomato },
  fish: { width: 180, height: 120, anchorX: 0.5, anchorY: 0.55, draw: drawFish },
  crab: { width: 160, height: 130, anchorX: 0.5, anchorY: 0.92, draw: drawCrab },
  mango: { width: 120, height: 140, anchorX: 0.5, anchorY: 0.92, draw: drawMango },
  chili: { width: 100, height: 150, anchorX: 0.5, anchorY: 0.92, draw: drawChili },
  lime: { width: 110, height: 110, anchorX: 0.5, anchorY: 0.9, draw: drawLime },
  onion: { width: 110, height: 145, anchorX: 0.5, anchorY: 0.92, draw: drawOnion },
  coconut: { width: 110, height: 110, anchorX: 0.5, anchorY: 0.9, draw: drawCoconut },
  pineapple: { width: 110, height: 150, anchorX: 0.5, anchorY: 0.92, draw: drawPineapple },
  rice: { width: 130, height: 140, anchorX: 0.5, anchorY: 0.9, draw: drawRice },
  knife: { width: 190, height: 90, anchorX: 0.5, anchorY: 0.55, draw: drawKnife },
  pot: { width: 170, height: 150, anchorX: 0.5, anchorY: 0.86, draw: drawPot },
  pan: { width: 190, height: 110, anchorX: 0.45, anchorY: 0.7, draw: drawPan },
  saltshaker: { width: 90, height: 150, anchorX: 0.5, anchorY: 0.94, draw: drawSaltShaker },
  plate: { width: 170, height: 95, anchorX: 0.5, anchorY: 0.72, draw: drawPlate },
  wateringcan: { width: 160, height: 150, anchorX: 0.45, anchorY: 0.9, draw: drawWateringCan },
  shovel: { width: 100, height: 185, anchorX: 0.5, anchorY: 0.95, draw: drawShovel },
  seed: { width: 90, height: 140, anchorX: 0.5, anchorY: 0.94, draw: drawSeed },
  crate: { width: 150, height: 115, anchorX: 0.5, anchorY: 0.92, draw: drawCrate },
  bobber: { width: 70, height: 110, anchorX: 0.5, anchorY: 0.92, draw: drawBobber },
  star: { width: 100, height: 100, anchorX: 0.5, anchorY: 0.5, draw: drawStar },
  spark: { width: 80, height: 80, anchorX: 0.5, anchorY: 0.5, draw: drawSpark },
  'gesture-drag': { width: 150, height: 150, anchorX: 0.5, anchorY: 0.5, draw: drawGestureDrag },
  'gesture-circle': { width: 150, height: 150, anchorX: 0.5, anchorY: 0.5, draw: drawGestureCircle },
  'gesture-shake': { width: 150, height: 150, anchorX: 0.5, anchorY: 0.5, draw: drawGestureShake },
  'gesture-tap': { width: 150, height: 150, anchorX: 0.5, anchorY: 0.5, draw: drawGestureTap },
  'gesture-hold': { width: 150, height: 150, anchorX: 0.5, anchorY: 0.5, draw: drawGestureHold },
  'gesture-zigzag': { width: 150, height: 150, anchorX: 0.5, anchorY: 0.5, draw: drawGestureZigzag },
  'gesture-rub': { width: 150, height: 150, anchorX: 0.5, anchorY: 0.5, draw: drawGestureRub },
  'gesture-flick': { width: 150, height: 150, anchorX: 0.5, anchorY: 0.5, draw: drawGestureFlick },
  missing: { width: 100, height: 100, anchorX: 0.5, anchorY: 0.5, draw: drawMissing }
};

export const SPRITE_IDS = Object.keys(SPRITE_DEFS);
