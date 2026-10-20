// Visuales del jugador: precarga y sincronización de hojas de loadout por operador temático.
// Exports: HAND_WEAPONS, createPlayerVisuals.

import { getPlayerLoadoutSheet, peekPlayerLoadoutSheet } from '../spritesheets.js';
import { getSelectedCharacterId } from '../config/charactersConfig.js';

export const HAND_WEAPONS = ['slash', 'shotgun', 'flamethrower', 'harpoon', 'bolt', 'mines', 'aura', 'orbital'];

export function createPlayerVisuals({ playerBillboard, renderer, getSkills, getCurrentHandWeapon, setCurrentHandWeapon }) {
  let prewarmGeneration = 0;

  function prewarmLoadoutSheets() {
    const snapshot = { ...getSkills() };
    const current = getCurrentHandWeapon();
    const charId = getSelectedCharacterId();
    const gen = ++prewarmGeneration;
    const queue = HAND_WEAPONS
      .filter(w => snapshot[w] && !peekPlayerLoadoutSheet(snapshot, w, charId))
      .sort((a, b) => (b === current) - (a === current));

    const next = () => {
      if (gen !== prewarmGeneration) return;
      const w = queue.shift();
      if (!w) return;
      const s = getPlayerLoadoutSheet(snapshot, w, charId);
      s.tex.repeat.set(1, 1); s.tex.offset.set(0, 0);
      s.glowTex.repeat.set(1, 1); s.glowTex.offset.set(0, 0);
      renderer.initTexture(s.tex);
      renderer.initTexture(s.glowTex);
      if (w === getCurrentHandWeapon()) syncPlayerVisualLoadout(getCurrentHandWeapon(), charId);
      setTimeout(next, 0);
    };
    setTimeout(next, 0);
  }

  function syncPlayerVisualLoadout(activeHand = getCurrentHandWeapon(), charId = null) {
    setCurrentHandWeapon(activeHand);
    const cid = charId || getSelectedCharacterId();
    let sheet = peekPlayerLoadoutSheet(getSkills(), activeHand, cid);
    if (!sheet) {
      sheet = getPlayerLoadoutSheet(getSkills(), activeHand, cid);
      renderer.initTexture(sheet.tex);
      renderer.initTexture(sheet.glowTex);
    }

    sheet.tex.repeat.set(1, 1); sheet.tex.offset.set(0, 0);
    sheet.glowTex.repeat.set(1, 1); sheet.glowTex.offset.set(0, 0);

    playerBillboard.tex = sheet.tex;
    playerBillboard.glowTex = sheet.glowTex;
    playerBillboard.cols = sheet.cols;
    playerBillboard.rows = sheet.rows;
    playerBillboard.numDirs = sheet.numDirs;
    playerBillboard.lastTotalCol = -1;
    playerBillboard.lastDirRow = -1;

    if (playerBillboard.mesh.material.map !== sheet.tex) {
      playerBillboard.mesh.material.map = sheet.tex;
      playerBillboard.mesh.material.emissiveMap = sheet.tex;
      playerBillboard.mesh.material.needsUpdate = true;
    }
    if (playerBillboard.glowMesh.material.map !== sheet.glowTex) {
      playerBillboard.glowMesh.material.map = sheet.glowTex;
    }
    playerBillboard.setDirectionalFrame(playerBillboard.dirRow, playerBillboard.stateIdx, playerBillboard.col);
  }

  return { prewarmLoadoutSheets, syncPlayerVisualLoadout };
}
