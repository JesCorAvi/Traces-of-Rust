import * as THREE from 'three';
import { CONFIG } from './config.js';

const BAYER4 = [
  [ 0,  8,  2, 10],
  [12,  4, 14,  6],
  [ 3, 11,  1,  9],
  [15,  7, 13,  5]
];

// Paleta limitada estilo Buckshot Roulette
const PAL = [
  [5, 6, 5],       // Negro abisal
  [18, 24, 18],    // Gris verdoso oscuro
  [36, 48, 34],    // Verde enfermizo oscuro
  [68, 86, 58],    // Verde moho
  [74, 37, 24],    // Óxido marrón
  [110, 20, 20],   // Sangre seca
  [165, 32, 32],   // Sangre fresca
  [135, 122, 92],  // Venda sucia / piel muerta
  [184, 156, 70],  // Amarillo nicotina / hueso
  [230, 215, 165]  // Blanco ocular brillante
];

function applyBuckshotDither(ctx, w, h) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (d[i + 3] < 90) { d[i + 3] = 0; continue; }
      d[i + 3] = 255;
      const bayer = (BAYER4[y & 3][x & 3] - 7.5) * 3.2;
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

// Dibuja un frame individual (64x64) según entidad, fila (estado) y columna (frame)
function drawEntityFrame(ctx, gCtx, type, row, col, ox, oy) {
  ctx.save();
  gCtx.save();
  ctx.translate(ox, oy);
  gCtx.translate(ox, oy);

  const phase = (col / 4) * Math.PI * 2;
  const isIdle = row === 0, isWalk = row === 1, isAtk = row === 2, isHurt = row === 3;
  const bob = isWalk ? Math.round(Math.sin(phase) * 2) : (isIdle ? (col % 2) : 0);
  const twitchX = (isIdle && col === 3) ? (type === 'weeper' ? 3 : 1) : (isHurt ? (col % 2 === 0 ? -3 : 3) : 0);
  const collapseY = (isHurt && col >= 2) ? (col - 1) * 7 : 0;

  ctx.translate(twitchX, bob + collapseY);
  gCtx.translate(twitchX, bob + collapseY);

  const px = (x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const glow = (x, y, w, h, color = '#e6d7a5') => {
    px(x, y, w, h, color);
    gCtx.fillStyle = color;
    gCtx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };

  if (type === 'player') {
    // Cazador con gabardina sucia, bombona oxidada y máscara antigás vendada
    const step = isWalk ? Math.round(Math.sin(phase) * 4) : 0;
    px(22, 46 + step, 7, 14, '#121812');
    px(34, 46 - step, 7, 14, '#121812');
    // Gabardina pesada manchada de sangre seca y barro
    px(17, 22, 28, 26, '#243022');
    px(15, 26, 32, 18, '#121812');
    px(20, 34, 9, 10, '#6e1414'); // Mancha de sangre coagulada
    // Bombona de oxígeno oxidada a la espalda
    px(12, 21, 7, 18, '#4a2518');
    px(13, 24, 5, 3, '#b89c46');
    // Cabeza con vendas sucias y máscara de gas rota
    px(22, 8, 18, 15, '#877a5c');
    px(21, 11, 20, 3, '#4a2518'); // Correa oxidada
    px(23, 14, 16, 8, '#121812'); // Máscara respirador
    px(28, 18, 7, 6, '#364832');  // Filtro circular
    // Lente izquierda rota con ojo desorbitado brillante
    glow(24, 12, 4, 4, '#e6d7a5');
    px(25, 13, 2, 2, '#6e1414');
    glow(34, 13, 3, 2, '#b89c46');
    // Arma / Escopeta recortada
    const gunKick = isAtk ? -4 : 0;
    px(39, 25 + gunKick, 16, 5, '#4a2518');
    px(44, 23 + gunKick, 12, 3, '#877a5c');
    if (isAtk && col < 2) glow(56, 21 + gunKick, 6, 8, '#e6d7a5');
  }

  else if (type === 'zombie') {
    // "EL COSIDO": Cabeza ladeada 45°, mandíbula desencajada, costillas expuestas y brazo largo
    const lurch = isWalk ? (col % 2 === 0 ? -3 : 3) : 0;
    px(21, 45 + lurch, 6, 15, '#121812');
    px(35, 45 - lurch, 7, 15, '#243022');
    // Torso deforme con costillas abiertas y costuras quirúrgicas
    px(18, 21, 26, 25, '#364832');
    px(22, 24, 16, 16, '#6e1414'); // Cavidad torácica abierta
    for (let r = 0; r < 4; r++) px(23, 25 + r * 4, 14, 2, '#b89c46'); // Costillas
    // Brazo izquierdo normal, brazo derecho grotescamente largo arrastrando por el suelo
    px(12, 23, 6, 18, '#364832');
    const clawY = isAtk ? 10 : 23;
    px(43, clawY, 7, 32, '#44563a');
    px(42, clawY + 30, 9, 5, '#a52020'); // Garras ensangrentadas
    // Cabeza bruscamente ladeada y cosida con grapas
    const headShift = isAtk ? 4 : 0;
    px(17 + headShift, 6, 22, 16, '#877a5c');
    px(19 + headShift, 10, 18, 2, '#6e1414'); // Cicatriz de lobotomía
    for (let s = 0; s < 5; s++) px(20 + headShift + s * 4, 9, 1, 4, '#121812');
    // Ojos desproporcionados (uno diminuto, otro enorme e inyectado)
    glow(20 + headShift, 12, 6, 6, '#e6d7a5');
    px(22 + headShift, 14, 2, 2, '#6e1414');
    glow(31 + headShift, 14, 3, 3, '#b89c46');
    // Mandíbula desencajada con dientes irregulares
    const jawOpen = isAtk ? 6 : 3;
    px(21 + headShift, 19, 14, jawOpen + 3, '#121812');
    for (let t = 0; t < 4; t++) px(22 + headShift + t * 3, 19, 2, 3, '#b89c46');
  }

  else if (type === 'weeper') {
    // "EL OBSERVADOR": Extremadamente alto y delgado, rostro de porcelana agrietada y sonrisa vertical
    const sway = isWalk ? (col % 2 === 0 ? -2 : 2) : 0;
    // Piernas largas como zancos médicos oxidados
    px(25 + sway, 38, 4, 24, '#4a2518');
    px(35 - sway, 38, 4, 24, '#4a2518');
    // Torso esquelético envuelto en vendas sucias y alambres
    px(23, 17, 18, 23, '#877a5c');
    for (let b = 0; b < 5; b++) px(22, 19 + b * 4, 20, 2, '#243022');
    px(27, 22, 10, 14, '#6e1414');
    // Brazos larguísimos articulados como agujas
    const armSpread = isAtk ? 8 : 2;
    px(13 - armSpread, 16, 9, 4, '#877a5c');
    px(12 - armSpread, 18, 4, 36, '#877a5c');
    px(42 + armSpread, 16, 9, 4, '#877a5c');
    px(48 + armSpread, 18, 4, 36, '#877a5c');
    // Rostro pálido casi humano pero desencajado ("uncanny valley")
    const headGlitch = (isIdle && col === 2) ? -4 : 0;
    px(22 + headGlitch, 2, 20, 17, '#c8c2ac');
    px(31 + headGlitch, 2, 2, 11, '#121812'); // Grieta negra en el cráneo
    // Cuencas negras profundas con ojos fijos hiperdilatados que brillan en la niebla
    px(24 + headGlitch, 7, 6, 6, '#050605');
    px(34 + headGlitch, 7, 6, 6, '#050605');
    glow(25 + headGlitch, 8, 4, 4, '#e6d7a5');
    glow(35 + headGlitch, 8, 4, 4, '#e6d7a5');
    // Sonrisa vertical antinatural llena de dientes largos
    const mouthH = isAtk ? 8 : 5;
    px(26 + headGlitch, 14, 12, mouthH, '#050605');
    for (let t = 0; t < 5; t++) glow(27 + headGlitch + t * 2, 15, 1, mouthH - 2, '#b89c46');
  }

  else if (type === 'worm') {
    // "LARVA DE ALCANTARILLA": Masa carnosa con suturas, múltiples ojos asimétricos y fauces de molares humanos
    const pulse = (col % 2) * 2;
    // Anillos de carne cosida emergiendo del barro
    px(10, 44 - pulse, 44, 16, '#4a2518');
    px(14, 30 - pulse, 36, 18, '#6e1414');
    px(18, 16, 28, 18, '#877a5c');
    // Costuras negras y pústulas
    for (let i = 0; i < 5; i++) px(16 + i * 7, 34, 3, 6, '#121812');
    // Fauces circulares llenas de molares amarillentos
    const mawR = isAtk ? 16 : 12;
    px(32 - mawR, 12, mawR * 2, mawR + 6, '#050605');
    for (let t = 0; t < 6; t++) {
      glow(22 + t * 4, 13, 3, 4, '#b89c46');
      glow(22 + t * 4, 23, 3, 4, '#b89c46');
    }
    // Racimo de ojos en los laterales
    glow(15, 22, 4, 4, '#e6d7a5');
    glow(45, 20, 5, 5, '#e6d7a5');
    glow(42, 28, 3, 3, '#b89c46');
  }

  else if (type === 'boss') {
    // "EL CIRUJANO DEL ABISMO": Silueta masiva con jaula de hierro en la cabeza, delantal ensangrentado y sierras
    px(16, 42, 12, 18, '#121812');
    px(36, 42, 12, 18, '#121812');
    // Delantal de carnicero cubierto de sangre y cadenas
    px(12, 16, 40, 30, '#4a2518');
    px(16, 20, 32, 24, '#6e1414');
    for (let c = 0; c < 4; c++) px(18 + c * 8, 18, 3, 24, '#877a5c'); // Cadenas colgantes
    // Brazos múltiples con sierra quirúrgica y gancho
    const swing = isAtk ? -8 : 0;
    px(4, 18 + swing, 10, 24, '#364832');
    px(2, 36 + swing, 12, 8, '#b89c46'); // Hoja de sierra
    px(50, 18 - swing, 10, 24, '#364832');
    px(52, 38 - swing, 8, 10, '#a52020'); // Gancho
    // Cabeza encerrada en jaula de hierro oxidada
    px(20, 2, 24, 16, '#121812');
    for (let b = 0; b < 5; b++) px(20 + b * 5, 2, 2, 16, '#4a2518');
    px(20, 8, 24, 2, '#4a2518');
    // Tres ojos incandescentes dentro de la jaula
    glow(24, 6, 4, 4, '#e6d7a5');
    glow(31, 4, 3, 3, '#b89c46');
    glow(37, 6, 4, 4, '#e6d7a5');
  }

  else if (type === 'altar') {
    // Terminal Industrial de Transfusión / Desfibrilador con monitor CRT y bolsas de sangre
    px(16, 32, 32, 28, '#243022');
    px(18, 34, 28, 24, '#4a2518');
    // Poste de goteo IV con bolsa de sangre colgando
    px(12, 6, 3, 52, '#877a5c');
    px(12, 6, 14, 3, '#877a5c');
    px(20, 9, 7, 12, '#a52020'); // Bolsa de plasma
    // Monitor CRT superior
    px(22, 12, 24, 18, '#121812');
    const screenOn = row === 0; // Fila 0 = activo, Fila 1 = usado
    if (screenOn) {
      glow(25, 15, 18, 12, col % 2 === 0 ? '#6e1414' : '#b89c46');
      glow(29, 18, 10, 4, '#e6d7a5');
    } else {
      px(25, 15, 18, 12, '#050605');
    }
  }

  // Salpicaduras de sangre y desgarro en estado HURT/DEATH (Fila 3)
  if (isHurt) {
    for (let s = 0; s < 8; s++) {
      px(14 + ((s * 11 + col * 7) % 36), 12 + ((s * 13 + col * 5) % 36), 4, 4, '#a52020');
    }
  }

  ctx.restore();
  gCtx.restore();
}

function buildSpritesheet(type) {
  const size = CONFIG.FRAME_SIZE * 4; // 256x256
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = glowCanvas.height = size;
  const gCtx = glowCanvas.getContext('2d');

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      drawEntityFrame(ctx, gCtx, type, row, col, col * CONFIG.FRAME_SIZE, row * CONFIG.FRAME_SIZE);
    }
  }

  applyBuckshotDither(ctx, size, size);
  return {
    name: type,
    canvas,
    tex: makeTexture(canvas),
    glowTex: makeTexture(glowCanvas)
  };
}

function buildEnvironmentTextures() {
  // Suelo industrial: baldosas sucias, rejillas oxidadas y manchas de sangre seca
  const gCan = document.createElement('canvas');
  gCan.width = gCan.height = 128;
  const gCtx = gCan.getContext('2d');
  gCtx.fillStyle = '#121812';
  gCtx.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 32) {
    for (let x = 0; x < 128; x += 32) {
      gCtx.strokeStyle = '#050605';
      gCtx.strokeRect(x, y, 32, 32);
      gCtx.fillStyle = (x + y) % 64 === 0 ? '#1d261c' : '#161d15';
      gCtx.fillRect(x + 2, y + 2, 28, 28);
    }
  }
  for (let i = 0; i < 90; i++) {
    gCtx.fillStyle = i % 5 === 0 ? '#4a2518' : '#050605';
    gCtx.fillRect((i * 37) % 124, (i * 53) % 124, 4, 4);
  }
  applyBuckshotDither(gCtx, 128, 128);

  // Sprite de columna / cadenas colgantes (Billboard decorativo)
  const pCan = document.createElement('canvas');
  pCan.width = pCan.height = 64;
  const pCtx = pCan.getContext('2d');
  pCtx.fillStyle = '#243022'; pCtx.fillRect(22, 0, 20, 64);
  pCtx.fillStyle = '#4a2518'; pCtx.fillRect(25, 0, 6, 64);
  for (let y = 4; y < 60; y += 8) {
    pCtx.fillStyle = '#050605'; pCtx.fillRect(20, y, 24, 3);
  }
  applyBuckshotDither(pCtx, 64, 64);

  // Sprite de tajo / sierra oxidada
  const sCan = document.createElement('canvas');
  sCan.width = sCan.height = 64;
  const sCtx = sCan.getContext('2d');
  sCtx.strokeStyle = '#b89c46'; sCtx.lineWidth = 6;
  sCtx.beginPath(); sCtx.arc(32, 38, 22, Math.PI * 1.15, Math.PI * 1.85); sCtx.stroke();
  sCtx.strokeStyle = '#a52020'; sCtx.lineWidth = 3;
  sCtx.beginPath(); sCtx.arc(32, 36, 25, Math.PI * 1.1, Math.PI * 1.9); sCtx.stroke();
  applyBuckshotDither(sCtx, 64, 64);

  return {
    ground: { name: 'ground_tile', canvas: gCan, tex: makeTexture(gCan, 75) },
    pillar: { name: 'rust_pillar', canvas: pCan, tex: makeTexture(pCan) },
    slash:  { name: 'saw_slash',   canvas: sCan, tex: makeTexture(sCan) }
  };
}

export const SpriteSheets = {
  player: buildSpritesheet('player'),
  zombie: buildSpritesheet('zombie'),
  weeper: buildSpritesheet('weeper'),
  worm:   buildSpritesheet('worm'),
  boss:   buildSpritesheet('boss'),
  altar:  buildSpritesheet('altar'),
  env:    buildEnvironmentTextures()
};