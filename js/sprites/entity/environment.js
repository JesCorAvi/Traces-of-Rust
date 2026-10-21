// Texturas de entorno y composición de las hojas de armas/pickups.
// Exports: buildEnvironmentTextures.

import { applyEnvironmentDither, makeTexture } from '../spritePalette.js';
import { buildWeaponSheets } from './weaponSheets.js';
import { buildPickupSheets } from './pickupSheets.js';

export function buildEnvironmentTextures() {
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

  // Placa de cruce / plataforma giratoria para intersección de caminos
  const iCan = document.createElement('canvas');
  iCan.width = iCan.height = 64;
  const iCtx = iCan.getContext('2d');
  iCtx.fillStyle = '#182018';
  iCtx.fillRect(0, 0, 64, 64);

  // Malla de rombos industriales de fondo
  iCtx.strokeStyle = '#243022';
  iCtx.lineWidth = 1;
  for (let d = -64; d <= 128; d += 8) {
    iCtx.beginPath();
    iCtx.moveTo(d, 0);
    iCtx.lineTo(d + 64, 64);
    iCtx.stroke();
    iCtx.beginPath();
    iCtx.moveTo(d, 64);
    iCtx.lineTo(d + 64, 0);
    iCtx.stroke();
  }

  // Franjas de advertencia en los 4 bordes (hazard warning #b89c46 / #050605)
  for (let x = -6; x < 70; x += 10) {
    iCtx.fillStyle = '#b89c46';
    iCtx.fillRect(Math.max(0, x), 0, 5, 5);
    iCtx.fillRect(Math.max(0, x), 59, 5, 5);
    iCtx.fillRect(0, Math.max(0, x), 5, 5);
    iCtx.fillRect(59, Math.max(0, x), 5, 5);
  }

  // Placa central de cruce giratorio (turntable)
  iCtx.beginPath();
  iCtx.arc(32, 32, 22, 0, Math.PI * 2);
  iCtx.fillStyle = '#243022';
  iCtx.fill();
  iCtx.strokeStyle = '#b89c46';
  iCtx.lineWidth = 2;
  iCtx.stroke();

  // Collar interior de acero oxidado
  iCtx.beginPath();
  iCtx.arc(32, 32, 15, 0, Math.PI * 2);
  iCtx.fillStyle = '#182018';
  iCtx.fill();
  iCtx.strokeStyle = '#4a2518';
  iCtx.lineWidth = 2;
  iCtx.stroke();

  // Guías de acero perpendiculares en cruz (4 vías)
  iCtx.fillStyle = '#364832';
  iCtx.fillRect(29, 10, 6, 44);
  iCtx.fillRect(10, 29, 44, 6);
  iCtx.fillStyle = '#877a5c';
  iCtx.fillRect(31, 10, 2, 44);
  iCtx.fillRect(10, 31, 44, 2);

  // Placa central del buje
  iCtx.beginPath();
  iCtx.arc(32, 32, 5, 0, Math.PI * 2);
  iCtx.fillStyle = '#4a2518';
  iCtx.fill();
  iCtx.strokeStyle = '#877a5c';
  iCtx.lineWidth = 1;
  iCtx.stroke();

  // Remaches de acero en esquinas y collar
  iCtx.fillStyle = '#877a5c';
  const rivets = [
    [7, 7], [56, 7], [7, 56], [56, 56],
    [32, 13], [32, 51], [13, 32], [51, 32],
    [21, 21], [43, 21], [21, 43], [43, 43],
    [32, 32]
  ];
  for (const [rx, ry] of rivets) {
    iCtx.fillRect(rx - 1, ry - 1, 3, 3);
    iCtx.fillStyle = '#e6d7a5';
    iCtx.fillRect(rx, ry, 1, 1);
    iCtx.fillStyle = '#877a5c';
  }

  // Marco perimetral abisal
  iCtx.strokeStyle = '#050605';
  iCtx.lineWidth = 2;
  iCtx.strokeRect(0, 0, 64, 64);
  applyEnvironmentDither(iCtx, 64, 64);

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
  const pickups = buildPickupSheets();

  return {
    ground:       { name: 'ground_tile', canvas: gCan, tex: makeTexture(gCan, 75) },
    crate:        { name: 'rust_crate',  canvas: cCan, tex: makeTexture(cCan) },
    metal:        { name: 'catwalk_tex', canvas: mCan, tex: makeTexture(mCan, 4) },
    intersection: { name: 'intersection_tile', canvas: iCan, tex: makeTexture(iCan) },
    aura:         { name: 'bile_aura',   canvas: aCan, tex: makeTexture(aCan) },
    pillar:       { name: 'rust_pillar', canvas: pCan, tex: makeTexture(pCan) },
    slash:        weapons.slashSheet,
    orbital:      weapons.orbitalSheet,
    pickup_serum: pickups.serum,
    pickup_tooth: pickups.tooth,
    pickup_chest: pickups.chest,
    pickup_scrap: pickups.scrap
  };
}
