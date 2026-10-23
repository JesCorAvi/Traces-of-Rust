// Hojas procedurales de los efectos de arma: estela de machete y aros salvavidas.
// Exports: buildWeaponSheets.

import { makeTexture } from '../spritePalette.js';

export function buildWeaponSheets() {
  // Estela de machete/agua: arco turquesa con borde de espuma y gotas coral.
  const slashCan = document.createElement('canvas');
  slashCan.width = 256; slashCan.height = 64;
  const sCtx = slashCan.getContext('2d');

  for (let f = 0; f < 4; f++) {
    sCtx.save();
    sCtx.translate(f * 64, 0);
    const startA = Math.PI * (1.02 + f * 0.08);
    const endA = Math.PI * (1.55 + f * 0.14);

    sCtx.strokeStyle = '#d94f4b'; sCtx.lineWidth = 11 - f * 2;
    sCtx.lineCap = 'round';
    sCtx.beginPath(); sCtx.arc(32, 46, 26, startA, endA); sCtx.stroke();

    sCtx.strokeStyle = '#59d6c8'; sCtx.lineWidth = 7 - f;
    sCtx.beginPath(); sCtx.arc(32, 46, 23, startA, endA); sCtx.stroke();

    sCtx.strokeStyle = '#fff0c7'; sCtx.lineWidth = 3;
    sCtx.beginPath(); sCtx.arc(32, 46, 20, startA + 0.1, endA); sCtx.stroke();

    for (let t = 0; t < 9; t++) {
      const a = startA + (t / 8) * (endA - startA);
      const tx = 32 + Math.cos(a) * 28;
      const ty = 46 + Math.sin(a) * 28;
      sCtx.fillStyle = t % 2 === 0 ? '#ffd166' : '#e9564c';
      sCtx.fillRect(Math.round(tx) - 2, Math.round(ty) - 2, 4, 4);
    }

    // Espuma/agua que salpica el arco.
    sCtx.fillStyle = '#d4fff8';
    for (let d = 0; d < 5; d++) {
      const a = startA + (d / 4) * (endA - startA);
      sCtx.fillRect(Math.round(32 + Math.cos(a) * (31 + f)), Math.round(46 + Math.sin(a) * (31 + f)), 2, 2);
    }
    sCtx.restore();
  }

  // Aro salvavidas orbital: anillo blanco/coral girando con cuerdas.
  const orbCan = document.createElement('canvas');
  orbCan.width = 256; orbCan.height = 64;
  const oCtx = orbCan.getContext('2d');

  for (let f = 0; f < 4; f++) {
    oCtx.save();
    oCtx.translate(f * 64, 0);
    const cx = 32, cy = 32;
    const angle = (f / 4) * Math.PI;
    oCtx.translate(cx, cy);
    oCtx.rotate(angle);
    oCtx.translate(-cx, -cy);

    // Cuerda exterior.
    oCtx.strokeStyle = '#d8b477';
    oCtx.lineWidth = 3;
    oCtx.beginPath(); oCtx.arc(cx, cy, 23, 0, Math.PI * 2); oCtx.stroke();

    // Anillo flotante con cuatro sectores coral.
    oCtx.strokeStyle = '#fff0c7';
    oCtx.lineWidth = 11;
    oCtx.beginPath(); oCtx.arc(cx, cy, 17, 0, Math.PI * 2); oCtx.stroke();
    oCtx.strokeStyle = '#ff7a5c';
    oCtx.lineWidth = 11;
    for (let q = 0; q < 4; q++) {
      const a0 = q * Math.PI / 2 + 0.18;
      const a1 = a0 + Math.PI / 4 - 0.18;
      oCtx.beginPath(); oCtx.arc(cx, cy, 17, a0, a1); oCtx.stroke();
    }

    // Centro de espuma.
    oCtx.fillStyle = 'rgba(89, 214, 200, 0.32)';
    oCtx.beginPath(); oCtx.arc(cx, cy, 12, 0, Math.PI * 2); oCtx.fill();
    oCtx.fillStyle = '#d4fff8';
    oCtx.fillRect(cx - 2, cy - 2, 4, 4);

    // Cintas de la boya.
    for (let q = 0; q < 4; q++) {
      const a = q * Math.PI / 2 + Math.PI / 4;
      oCtx.fillStyle = '#ffe0a2';
      oCtx.fillRect(cx + Math.cos(a) * 24 - 1, cy + Math.sin(a) * 24 - 1, 3, 3);
    }

    // Destellos de agua.
    oCtx.fillStyle = '#ffffff';
    oCtx.fillRect(cx + 21, cy - 13 - (f % 2) * 3, 2, 2);
    oCtx.fillRect(cx - 24, cy + 11 + (f % 2), 2, 2);
    oCtx.restore();
  }

  return {
    slashSheet: { name: 'tropical_slash_4f', canvas: slashCan, tex: makeTexture(slashCan) },
    orbitalSheet: { name: 'lifeguard_orbital_4f', canvas: orbCan, tex: makeTexture(orbCan) }
  };
}
