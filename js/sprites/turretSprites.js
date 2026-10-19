import { CONFIG } from '../config.js';
import { applyCleanSpriteOutlineRect, makeTexture } from './spritePalette.js';

// ============================================================================
// SPRITES PROCEDURALES DE TORRETAS Y TROPAS ALIADAS
// Estética oscura, oxidada y de bajo contraste, coherente con el resto del juego.
// Cada torreta usa 2 estados x 4 frames (idle / disparo) en celdas de 64x64.
// ============================================================================

const P = {
  black: '#050605',
  ink: '#0a0d0a',
  dark: '#121812',
  greenDark: '#182018',
  green: '#243022',
  greenMid: '#364832',
  rustDark: '#4a2518',
  rust: '#743718',
  blood: '#a52020',
  steelDark: '#63533b',
  steel: '#877a5c',
  steelLight: '#c8c2ac',
  brass: '#b89c46',
  bone: '#e6d7a5',
  iceDark: '#2c4148',
  ice: '#4a6b73',
  iceMid: '#6f8f9c',
  iceLight: '#9fc3c9',
  moss: '#68863a'
};

function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function drawTurretMount(ctx, gCtx, accent) {
  // Collarín metálico que conecta con el pedestal 3D
  px(ctx, 15, 48, 34, 12, P.black);
  px(ctx, 17, 48, 30, 9, P.rustDark);
  px(ctx, 19, 48, 26, 3, P.steel);
  px(ctx, 19, 53, 26, 2, P.dark);
  px(ctx, 21, 55, 4, 3, P.steelDark);
  px(ctx, 39, 55, 4, 3, P.steelDark);
  if (accent) {
    px(ctx, 29, 50, 6, 2, accent);
    gCtx.fillStyle = accent;
    gCtx.fillRect(29, 50, 6, 2);
  }
}

function drawGunner(ctx, gCtx, firing, frame, accent) {
  const recoil = firing && frame < 2 ? -4 : 0;
  const bob = !firing && frame % 2 === 1 ? 1 : 0;
  const y = 26 + bob + recoil;

  // Cuerpo del arma
  px(ctx, 16, y + 8, 26, 16, P.black);
  px(ctx, 18, y + 10, 22, 12, P.greenDark);
  px(ctx, 20, y + 12, 10, 8, P.rustDark);
  px(ctx, 22, y + 14, 5, 4, P.steelDark);

  // Cañón
  px(ctx, 40, y + 11, 16, 5, P.black);
  px(ctx, 41, y + 12, 15, 3, P.steel);
  px(ctx, 41, y + 12, 15, 1, P.steelLight);
  px(ctx, 49, y + 13, 7, 1, P.rust);

  // Cargador y correa
  px(ctx, 24, y + 22, 7, 7, P.black);
  px(ctx, 25, y + 23, 5, 5, P.brass);
  px(ctx, 18, y + 18, 5, 2, P.steelDark);

  // Visor
  px(ctx, 27, y + 11, 6, 4, P.black);
  px(ctx, 28, y + 12, 4, 2, accent);
  gCtx.fillStyle = accent;
  gCtx.fillRect(28, y + 12, 4, 2);

  if (firing) {
    // Fogonazo
    const flash = 3 + ((frame + 1) % 3) * 2;
    px(ctx, 56, y + 8, flash, flash, P.bone);
    px(ctx, 54, y + 10, flash + 2, 3, P.brass);
    gCtx.fillStyle = P.bone;
    gCtx.fillRect(54, y + 9, flash + 3, 4);
    gCtx.fillStyle = P.brass;
    gCtx.fillRect(52, y + 10, 5, 2);
  }
}

function drawMortar(ctx, gCtx, firing, frame, accent) {
  const recoil = firing && frame === 0 ? 3 : 0;
  const bob = !firing && frame % 2 === 1 ? 1 : 0;
  const y = 24 + bob - recoil;

  // Cureña
  px(ctx, 16, y + 22, 30, 10, P.black);
  px(ctx, 18, y + 23, 26, 7, P.rustDark);
  px(ctx, 21, y + 25, 20, 3, P.steelDark);

  // Tubo inclinado
  px(ctx, 21, y + 10, 12, 16, P.black);
  px(ctx, 23, y + 9, 10, 16, P.greenDark);
  px(ctx, 25, y + 8, 8, 6, P.steel);
  px(ctx, 26, y + 4, 6, 6, P.black);
  px(ctx, 27, y + 5, 4, 4, P.dark);
  px(ctx, 32, y + 12, 8, 5, P.rust);
  px(ctx, 38, y + 11, 6, 4, P.steelDark);

  // Banda de refuerzo
  px(ctx, 19, y + 16, 16, 3, P.steelDark);
  px(ctx, 22, y + 17, 10, 1, P.brass);
  px(ctx, 28, y + 20, 5, 2, accent);
  gCtx.fillStyle = accent;
  gCtx.fillRect(28, y + 20, 5, 2);

  if (firing) {
    // Humo y destello en la boca
    px(ctx, 25, y - 2, 8, 6, P.bone);
    px(ctx, 23, y - 5, 12, 4, P.steel);
    px(ctx, 27, y - 8, 5, 4, P.steelDark);
    gCtx.fillStyle = P.bone;
    gCtx.fillRect(26, y - 3, 6, 4);
    gCtx.fillStyle = P.brass;
    gCtx.fillRect(24, y - 6, 9, 2);
  }
}

function drawCryo(ctx, gCtx, firing, frame, accent) {
  const bob = !firing && frame % 2 === 1 ? 1 : 0;
  const y = 25 + bob;
  const pulse = firing ? (frame + 1) * 2 : 2;

  // Cuerpo cilíndrico
  px(ctx, 18, y + 10, 26, 20, P.black);
  px(ctx, 20, y + 11, 22, 16, P.iceDark);
  px(ctx, 22, y + 12, 16, 4, P.ice);
  px(ctx, 22, y + 18, 16, 3, P.iceMid);
  px(ctx, 22, y + 23, 16, 2, P.greenDark);

  // Bobinas laterales
  px(ctx, 14, y + 14, 5, 12, P.steelDark);
  px(ctx, 44, y + 14, 5, 12, P.steelDark);
  px(ctx, 15, y + 16, 3, 3, accent);
  px(ctx, 45, y + 16, 3, 3, accent);
  gCtx.fillStyle = accent;
  gCtx.fillRect(15, y + 16, 3, 3);
  gCtx.fillRect(45, y + 16, 3, 3);

  // Emisor frontal
  px(ctx, 24, y + 5, 16, 8, P.black);
  px(ctx, 26, y + 6, 12, 5, P.ice);
  px(ctx, 28, y + 7, 8, 3, P.iceLight);
  gCtx.fillStyle = accent;
  gCtx.fillRect(27, y + 7, 10, 3);

  if (firing) {
    // Anillo de escarcha
    px(ctx, 10 - pulse, y + 12, 4, 10, P.iceLight);
    px(ctx, 50 + pulse, y + 12, 4, 10, P.iceLight);
    px(ctx, 24, y - 2, 16, 3, P.iceMid);
    gCtx.fillStyle = P.iceLight;
    gCtx.fillRect(11 - pulse, y + 13, 2, 8);
    gCtx.fillRect(51 + pulse, y + 13, 2, 8);
    gCtx.fillRect(25, y - 1, 14, 2);
  }
}

function drawBarracks(ctx, gCtx, firing, frame, accent) {
  const bob = !firing && frame % 2 === 1 ? 1 : 0;
  const y = 28 + bob;

  // Búnker
  px(ctx, 14, y + 6, 36, 22, P.black);
  px(ctx, 16, y + 7, 32, 18, P.greenDark);
  px(ctx, 18, y + 9, 28, 6, P.rustDark);
  px(ctx, 18, y + 16, 28, 7, P.green);
  px(ctx, 16, y + 23, 32, 4, P.steelDark);

  // Escotilla
  const hatch = firing ? 8 : 4;
  px(ctx, 23, y + 12 - hatch, 18, hatch + 4, P.black);
  px(ctx, 24, y + 13 - hatch, 16, hatch + 2, P.ink);

  // Bandera
  px(ctx, 46, y - 6, 2, 20, P.steelDark);
  px(ctx, 48, y - 5, 10, 6, P.blood);
  px(ctx, 48, y - 5, 10, 1, P.rust);
  px(ctx, 50, y - 3, 5, 2, P.brass);

  // Ojos de la escotilla
  px(ctx, 27, y + 19, 4, 3, accent);
  px(ctx, 34, y + 19, 4, 3, accent);
  gCtx.fillStyle = accent;
  gCtx.fillRect(27, y + 19, 4, 3);
  gCtx.fillRect(34, y + 19, 4, 3);

  if (firing) {
    // Guardia emergiendo
    px(ctx, 29, y + 2, 8, 8, P.black);
    px(ctx, 30, y + 3, 6, 5, P.steel);
    px(ctx, 31, y + 4, 4, 2, P.blood);
    px(ctx, 31, y + 8, 4, 4, P.greenMid);
    gCtx.fillStyle = P.bone;
    gCtx.fillRect(31, y + 4, 4, 1);
  }
}

function drawSupport(ctx, gCtx, firing, frame, accent) {
  const bob = !firing && frame % 2 === 1 ? 1 : 0;
  const y = 26 + bob;
  const pulse = firing ? 3 + frame : 2;

  // Base de mantenimiento
  px(ctx, 16, y + 16, 32, 14, P.black);
  px(ctx, 18, y + 17, 28, 10, P.greenDark);
  px(ctx, 20, y + 19, 24, 3, P.moss);
  px(ctx, 20, y + 24, 24, 2, P.steelDark);

  // Columna y brazo
  px(ctx, 28, y + 2, 8, 16, P.black);
  px(ctx, 30, y + 3, 4, 13, P.steel);
  px(ctx, 24, y + 8, 6, 3, P.steelDark);
  px(ctx, 34, y + 10, 8, 3, P.steelDark);
  px(ctx, 40, y + 9, 4, 5, P.brass);

  // Cruz / emblema
  px(ctx, 24, y + 19, 16, 4, P.black);
  px(ctx, 25, y + 20, 14, 2, accent);
  px(ctx, 29, y + 15, 6, 12, P.black);
  px(ctx, 30, y + 16, 4, 10, accent);
  gCtx.fillStyle = accent;
  gCtx.fillRect(25, y + 20, 14, 2);
  gCtx.fillRect(30, y + 16, 4, 10);

  if (firing) {
    // Pulso de reparación
    px(ctx, 22 - pulse, y + 12, 3, 12, P.moss);
    px(ctx, 39 + pulse, y + 12, 3, 12, P.moss);
    px(ctx, 26, y - pulse, 12, 2, P.moss);
    gCtx.fillStyle = P.moss;
    gCtx.fillRect(23 - pulse, y + 13, 2, 10);
    gCtx.fillRect(40 + pulse, y + 13, 2, 10);
    gCtx.fillRect(27, y - pulse - 1, 10, 2);
  }
}

const TURRET_DRAWERS = {
  gunner: drawGunner,
  mortar: drawMortar,
  cryo: drawCryo,
  barracks: drawBarracks,
  support: drawSupport
};

const TURRET_ACCENTS = {
  gunner: P.brass,
  mortar: P.rust,
  cryo: P.iceLight,
  barracks: P.moss,
  support: P.moss
};

export function buildTurretSheets() {
  const sheets = {};
  const frameSize = CONFIG.FRAME_SIZE;
  const cols = 8; // 2 estados (idle, disparo) x 4 frames
  const rows = 1;
  const w = cols * frameSize;
  const h = rows * frameSize;

  Object.entries(TURRET_DRAWERS).forEach(([type, drawFn]) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = w;
    glowCanvas.height = h;
    const gCtx = glowCanvas.getContext('2d');

    const accent = TURRET_ACCENTS[type];

    for (let state = 0; state < 2; state++) {
      for (let frame = 0; frame < 4; frame++) {
        const col = state * 4 + frame;
        const ox = col * frameSize;
        ctx.save();
        gCtx.save();
        ctx.translate(ox, 0);
        gCtx.translate(ox, 0);
        drawTurretMount(ctx, gCtx, accent);
        drawFn(ctx, gCtx, state === 1, frame, accent);
        ctx.restore();
        gCtx.restore();
      }
    }

    applyCleanSpriteOutlineRect(ctx, w, h);

    sheets[`turret_${type}`] = {
      name: `turret_${type}_2x4`,
      numDirs: 1,
      cols,
      rows,
      canvas,
      tex: makeTexture(canvas),
      glowTex: makeTexture(glowCanvas)
    };
  });

  return sheets;
}

// ----------------------------------------------------------------------------
// TROPAS ALIADAS: 4 direcciones x 3 estados (idle, caminar, atacar) x 4 frames
// ----------------------------------------------------------------------------

function drawAlly(ctx, gCtx, type, dir, state, frame) {
  const walk = state === 1;
  const attack = state === 2;
  const phase = (frame / 4) * Math.PI * 2;
  const bob = walk ? Math.round(Math.sin(phase) * 1.5) : (attack ? -1 : 0);
  const stride = walk ? Math.round(Math.sin(phase) * 2.5) : 0;
  const isLeft = dir === 3;
  const isBack = dir === 0;

  ctx.save();
  gCtx.save();
  if (isLeft) {
    ctx.translate(64, 0);
    ctx.scale(-1, 1);
    gCtx.translate(64, 0);
    gCtx.scale(-1, 1);
  }

  ctx.translate(0, bob);
  gCtx.translate(0, bob);

  const armor = type === 'elite' ? P.steelDark : P.rustDark;
  const body = type === 'elite' ? P.steel : P.greenMid;
  const eye = type === 'drone' ? P.iceLight : (type === 'elite' ? P.brass : P.bone);

  if (type === 'drone') {
    const hover = Math.round(Math.sin(phase) * 2);
    ctx.translate(0, hover);
    gCtx.translate(0, hover);

    // Chasis flotante
    px(ctx, 22, 24, 20, 16, P.black);
    px(ctx, 24, 25, 16, 13, P.iceDark);
    px(ctx, 26, 27, 12, 6, P.ice);
    px(ctx, 28, 29, 8, 2, P.iceLight);
    px(ctx, 18, 28, 5, 3, P.steelDark);
    px(ctx, 41, 28, 5, 3, P.steelDark);
    px(ctx, 25, 38, 14, 3, P.steelDark);

    // Rotores
    px(ctx, 20, 18, 24, 3, P.black);
    px(ctx, 23, 17, 18, 2, P.steel);
    px(ctx, attack ? 44 : 36, 29, attack ? 8 : 4, 3, P.black);
    if (attack) px(ctx, 50, 29, 5, 2, P.bone);

    px(ctx, 29, 28, 6, 3, P.black);
    px(ctx, 30, 29, 4, 1, eye);
    gCtx.fillStyle = eye;
    gCtx.fillRect(30, 29, 4, 1);
    if (attack) {
      gCtx.fillStyle = P.bone;
      gCtx.fillRect(50, 28, 5, 3);
    }
    ctx.restore();
    gCtx.restore();
    return;
  }

  // Piernas
  px(ctx, 25 + stride, 44, 5, 10, P.black);
  px(ctx, 26 + stride, 44, 3, 8, armor);
  px(ctx, 34 - stride, 44, 5, 10, P.black);
  px(ctx, 35 - stride, 44, 3, 8, armor);
  px(ctx, 25 + stride, 53, 6, 3, P.dark);
  px(ctx, 34 - stride, 53, 6, 3, P.dark);

  // Torso
  px(ctx, 23, 28, 18, 18, P.black);
  px(ctx, 25, 29, 14, 16, body);
  px(ctx, 27, 31, 10, 5, armor);
  px(ctx, 27, 37, 10, 2, P.steelDark);

  if (type === 'elite') {
    px(ctx, 22, 29, 3, 12, P.black);
    px(ctx, 39, 29, 3, 12, P.black);
    px(ctx, 24, 30, 2, 10, P.brass);
    px(ctx, 38, 30, 2, 10, P.brass);
  }

  // Cabeza
  px(ctx, 25, 18, 14, 12, P.black);
  px(ctx, 26, 19, 12, 10, armor);
  px(ctx, 27, 21, 10, 4, P.dark);

  if (!isBack) {
    px(ctx, 28, 22, 3, 2, eye);
    px(ctx, 34, 22, 3, 2, eye);
    gCtx.fillStyle = eye;
    gCtx.fillRect(28, 22, 3, 2);
    gCtx.fillRect(34, 22, 3, 2);
    px(ctx, 29, 26, 6, 2, P.blood);
  }

  // Brazo y arma
  const swing = attack ? (frame < 2 ? -4 : 3) : (walk ? Math.round(Math.sin(phase) * 2) : 0);
  px(ctx, 18, 30 + swing, 6, 10, armor);
  px(ctx, 17, 38 + swing, 8, 4, P.black);
  px(ctx, 39, 29 - swing, 5, 9, body);

  if (type === 'elite') {
    // Martillo pesado
    px(ctx, 44, 22 - swing, 3, 18, P.steelDark);
    px(ctx, 42, 20 - swing, 7, 6, P.black);
    px(ctx, 43, 21 - swing, 5, 4, P.steel);
    if (attack) {
      px(ctx, 42, 14 - swing, 8, 5, P.bone);
      gCtx.fillStyle = P.brass;
      gCtx.fillRect(43, 15 - swing, 6, 3);
    }
  } else {
    // Machete oxidado
    const bladeY = attack ? 14 : 24;
    px(ctx, 45, bladeY - swing, 2, 16, P.black);
    px(ctx, 46, bladeY - swing, 2, 14, P.steel);
    px(ctx, 46, bladeY - swing, 1, 6, P.blood);
    px(ctx, 44, bladeY + 14 - swing, 5, 3, P.rustDark);
  }

  ctx.restore();
  gCtx.restore();
}

export function buildAllyDirectionalSheets() {
  const sheets = {};
  const types = ['guard', 'elite', 'drone'];
  const frameSize = CONFIG.FRAME_SIZE;
  const cols = 12; // 3 estados x 4 frames
  const rows = 4;  // 4 direcciones
  const w = cols * frameSize;
  const h = rows * frameSize;

  types.forEach(type => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = w;
    glowCanvas.height = h;
    const gCtx = glowCanvas.getContext('2d');

    for (let dir = 0; dir < rows; dir++) {
      for (let state = 0; state < 3; state++) {
        for (let frame = 0; frame < 4; frame++) {
          const col = state * 4 + frame;
          ctx.save();
          gCtx.save();
          ctx.translate(col * frameSize, dir * frameSize);
          gCtx.translate(col * frameSize, dir * frameSize);
          drawAlly(ctx, gCtx, type, dir, state, frame);
          ctx.restore();
          gCtx.restore();
        }
      }
    }

    applyCleanSpriteOutlineRect(ctx, w, h);

    sheets[`ally_${type}`] = {
      name: `ally_${type}_4dir`,
      numDirs: 4,
      cols,
      rows,
      canvas,
      tex: makeTexture(canvas),
      glowTex: makeTexture(glowCanvas)
    };
  });

  return sheets;
}
