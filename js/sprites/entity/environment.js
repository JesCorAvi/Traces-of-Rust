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
