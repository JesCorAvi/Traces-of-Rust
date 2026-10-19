// Hojas procedurales de armas (sierra y orbital).
// Exports: buildWeaponSheets.

import { makeTexture } from '../spritePalette.js';

export function buildWeaponSheets() {
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
