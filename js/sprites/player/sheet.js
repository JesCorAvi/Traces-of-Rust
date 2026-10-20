// Caché y construcción de hojas de loadout del jugador por operador temático.
// Exports: peekPlayerLoadoutSheet, getPlayerLoadoutSheet.

import { CONFIG } from '../../config.js';
import { applyCleanSpriteOutlineRect, makeTexture } from '../spritePalette.js';
import { drawPlayer8DirCell } from './body.js';
import { getSelectedCharacterId } from '../../config/charactersConfig.js';

const playerLoadoutCache = new Map();

function loadoutSignature(skills, activeHand, charId = null) {
  const equippedKeys = Object.keys(skills).filter(k => skills[k] > 0).sort().join(',');
  const cid = charId || (typeof getSelectedCharacterId === 'function' ? getSelectedCharacterId() : 'otto');
  return `${equippedKeys}::${activeHand}::${cid}::${CONFIG.DIRECTIONAL.USE_MIRRORING}`;
}

export function peekPlayerLoadoutSheet(skills = { slash: 1 }, activeHand = 'slash', charId = null) {
  const cid = charId || (typeof getSelectedCharacterId === 'function' ? getSelectedCharacterId() : 'otto');
  return playerLoadoutCache.get(loadoutSignature(skills, activeHand, cid)) || null;
}

export function getPlayerLoadoutSheet(skills = { slash: 1 }, activeHand = 'slash', charId = null) {
  const cid = charId || (typeof getSelectedCharacterId === 'function' ? getSelectedCharacterId() : 'otto');
  const signature = loadoutSignature(skills, activeHand, cid);

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
          skills, activeHand, cid
        );
      }
    }
  }

  applyCleanSpriteOutlineRect(ctx, w, h);

  const tex = makeTexture(canvas);
  tex.repeat.set(1 / cols, 1 / rows);
  const glowTex = makeTexture(glowCanvas);
  glowTex.repeat.set(1 / cols, 1 / rows);

  const entry = { name: `player_8dir_${activeHand}_${cid}`, cols, rows, numDirs: 8, tex, glowTex, canvas };
  playerLoadoutCache.set(signature, entry);
  return entry;
}
