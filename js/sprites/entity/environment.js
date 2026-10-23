// Texturas de entorno tropical y composición de las hojas de armas/pickups.
// Exports: buildEnvironmentTextures.

import { applyEnvironmentDither, makeTexture } from '../spritePalette.js';
import { buildWeaponSheets } from './weaponSheets.js';
import { buildPickupSheets } from './pickupSheets.js';

function canvasOf(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { c, ctx: c.getContext('2d', { willReadFrequently: true }) };
}

export function buildEnvironmentTextures() {
  // Arena de playa: grano dorado, pequeñas conchas y ondulaciones de marea.
  const { c: gCan, ctx: gCtx } = canvasOf(128, 128);
  gCtx.fillStyle = '#e4b574';
  gCtx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 230; i++) {
    const x = (i * 47 + 13) % 128;
    const y = (i * 71 + 29) % 128;
    gCtx.fillStyle = i % 7 === 0 ? '#f2d49e' : (i % 5 === 0 ? '#d0a064' : '#dbad73');
    gCtx.fillRect(x, y, 1 + (i % 2), 1);
  }
  for (let y = 18; y < 128; y += 28) {
    gCtx.strokeStyle = 'rgba(255, 236, 190, 0.28)';
    gCtx.lineWidth = 2;
    gCtx.beginPath();
    for (let x = 0; x <= 128; x += 8) {
      const yy = y + Math.sin(x * 0.14 + y) * 2.5;
      if (x === 0) gCtx.moveTo(x, yy); else gCtx.lineTo(x, yy);
    }
    gCtx.stroke();
  }
  // Conchas y estrellas de mar diminutas.
  const shells = [[18, 92], [104, 24], [72, 110], [37, 40], [116, 88]];
  shells.forEach(([x, y], i) => {
    gCtx.fillStyle = i % 2 ? '#f8d7bd' : '#d97757';
    gCtx.fillRect(x, y, 4, 3);
    gCtx.fillStyle = '#fff0cd';
    gCtx.fillRect(x + 1, y, 2, 1);
  });
  // La arena se deja sin dithering duro: a baja resolución producía un patrón
  // de sal y pimienta que competía con las rutas y los sprites.

  // Caja de madera para la despensa / nevera de playa.
  const { c: cCan, ctx: cCtx } = canvasOf(64, 64);
  cCtx.fillStyle = '#6d3d22';
  cCtx.fillRect(0, 0, 64, 64);
  for (let y = 0; y < 64; y += 12) {
    cCtx.fillStyle = y % 24 === 0 ? '#a45e33' : '#8c4c2a';
    cCtx.fillRect(3, y + 2, 58, 9);
    cCtx.fillStyle = '#d38a4f';
    cCtx.fillRect(3, y + 2, 58, 2);
    cCtx.fillStyle = '#4c2817';
    cCtx.fillRect(3, y + 10, 58, 2);
  }
  cCtx.fillStyle = '#3d6f62';
  cCtx.fillRect(6, 5, 5, 54);
  cCtx.fillRect(53, 5, 5, 54);
  cCtx.fillStyle = '#f2c15a';
  cCtx.fillRect(26, 18, 12, 12);
  cCtx.fillStyle = '#6d3d22';
  cCtx.fillRect(30, 20, 4, 8);
  cCtx.fillRect(28, 22, 8, 4);
  applyEnvironmentDither(cCtx, 64, 64);

  // Tablones húmedos de madera para pasarelas y muelles.
  const { c: mCan, ctx: mCtx } = canvasOf(64, 64);
  mCtx.fillStyle = '#3a271c';
  mCtx.fillRect(0, 0, 64, 64);
  for (let y = 0; y < 64; y += 10) {
    mCtx.fillStyle = y % 20 === 0 ? '#9a6841' : '#855735';
    mCtx.fillRect(0, y, 64, 8);
    mCtx.fillStyle = '#c48c56';
    mCtx.fillRect(0, y, 64, 2);
    mCtx.fillStyle = '#2b1a12';
    mCtx.fillRect(0, y + 8, 64, 2);
    mCtx.fillStyle = '#d6b47a';
    mCtx.fillRect(6, y + 3, 2, 2);
    mCtx.fillRect(56, y + 3, 2, 2);
  }
  applyEnvironmentDither(mCtx, 64, 64);

  // Plataforma de troncos en los cruces de las rutas.
  const { c: iCan, ctx: iCtx } = canvasOf(64, 64);
  iCtx.fillStyle = '#5a3824';
  iCtx.fillRect(0, 0, 64, 64);
  for (let y = 0; y < 64; y += 8) {
    iCtx.fillStyle = y % 16 === 0 ? '#9b6841' : '#7f4f31';
    iCtx.fillRect(0, y, 64, 6);
    iCtx.fillStyle = '#c18c59';
    iCtx.fillRect(0, y, 64, 1);
  }
  iCtx.strokeStyle = '#f0c25e';
  iCtx.lineWidth = 2;
  iCtx.beginPath();
  iCtx.arc(32, 32, 20, 0, Math.PI * 2);
  iCtx.stroke();
  iCtx.fillStyle = '#f6dfaa';
  for (const [x, y] of [[9, 9], [54, 9], [9, 54], [54, 54], [32, 32]]) {
    iCtx.fillRect(x - 1, y - 1, 3, 3);
  }
  applyEnvironmentDither(iCtx, 64, 64);

  // Aura solar usada por armas de área y recogidas.
  const { c: aCan, ctx: aCtx } = canvasOf(128, 128);
  aCtx.strokeStyle = '#ffe187';
  aCtx.lineWidth = 5;
  aCtx.beginPath(); aCtx.arc(64, 64, 56, 0, Math.PI * 2); aCtx.stroke();
  aCtx.strokeStyle = '#ff8b5e';
  aCtx.lineWidth = 2;
  aCtx.beginPath(); aCtx.arc(64, 64, 44, 0, Math.PI * 2); aCtx.stroke();
  applyEnvironmentDither(aCtx, 128, 128);

  // Tronco de palmera (compatible con el material de pilares anterior).
  const { c: pCan, ctx: pCtx } = canvasOf(64, 64);
  pCtx.fillStyle = '#6b4227';
  pCtx.fillRect(0, 0, 64, 64);
  for (let y = 4; y < 64; y += 10) {
    pCtx.fillStyle = '#a66a3c';
    pCtx.fillRect(18, y, 28, 4);
    pCtx.fillStyle = '#4b2b18';
    pCtx.fillRect(18, y + 4, 28, 2);
  }
  applyEnvironmentDither(pCtx, 64, 64);

  // Tela a rayas para sombrillas y toldos.
  const { c: fCan, ctx: fCtx } = canvasOf(64, 64);
  for (let x = 0; x < 64; x += 16) {
    fCtx.fillStyle = '#f08a62';
    fCtx.fillRect(x, 0, 8, 64);
    fCtx.fillStyle = '#ffe2ae';
    fCtx.fillRect(x + 8, 0, 8, 64);
  }
  fCtx.fillStyle = 'rgba(96, 49, 33, 0.25)';
  for (let y = 0; y < 64; y += 8) fCtx.fillRect(0, y, 64, 1);
  applyEnvironmentDither(fCtx, 64, 64);

  // Paja seca para el techo del puesto de comida.
  const { c: tCan, ctx: tCtx } = canvasOf(64, 64);
  tCtx.fillStyle = '#b8873f';
  tCtx.fillRect(0, 0, 64, 64);
  for (let y = 0; y < 64; y += 4) {
    tCtx.fillStyle = y % 8 === 0 ? '#e0b867' : '#94662f';
    tCtx.fillRect(0, y, 64, 2);
    for (let x = (y * 5) % 9; x < 64; x += 13) {
      tCtx.fillStyle = '#f0d188';
      tCtx.fillRect(x, y, 5, 1);
    }
  }
  applyEnvironmentDither(tCtx, 64, 64);

  // Agua del océano al atardecer: bandas de espuma, turquesa y reflejo rosado.
  const { c: wCan, ctx: wCtx } = canvasOf(128, 128);
  const sea = wCtx.createLinearGradient(0, 0, 0, 128);
  sea.addColorStop(0, '#5db8cb');
  sea.addColorStop(0.55, '#3a94b0');
  sea.addColorStop(1, '#246f8c');
  wCtx.fillStyle = sea;
  wCtx.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 8) {
    wCtx.fillStyle = y % 24 === 0 ? 'rgba(255, 196, 165, 0.44)' : 'rgba(167, 240, 225, 0.26)';
    wCtx.fillRect(0, y, 128, 2);
    if (y % 16 === 0) {
      wCtx.fillStyle = 'rgba(255, 244, 220, 0.5)';
      for (let x = (y * 3) % 17; x < 128; x += 23) wCtx.fillRect(x, y, 8, 1);
    }
  }
  // Sin dithering: el agua debe leerse como una superficie continua.

  // Espuma de orilla, con transparencia real.
  const { c: foamCan, ctx: foamCtx } = canvasOf(128, 32);
  foamCtx.clearRect(0, 0, 128, 32);
  for (let y = 0; y < 32; y += 8) {
    foamCtx.fillStyle = y % 16 === 0 ? 'rgba(255, 249, 225, 0.9)' : 'rgba(199, 244, 233, 0.55)';
    for (let x = (y * 7) % 19; x < 128; x += 31) {
      foamCtx.fillRect(x, y + (x % 3), 14, 2);
    }
  }

  // Nubes pixel-art con degradado cálido.
  const { c: cloudCan, ctx: cloudCtx } = canvasOf(128, 64);
  cloudCtx.clearRect(0, 0, 128, 64);
  const puffs = [
    [32, 38, 28, 15], [54, 29, 30, 18], [80, 35, 32, 16], [102, 40, 21, 12],
    [44, 44, 26, 11], [70, 45, 34, 10], [20, 43, 18, 9]
  ];
  puffs.forEach(([x, y, rw, rh], i) => {
    const g = cloudCtx.createRadialGradient(x, y, 0, x, y, rw);
    g.addColorStop(0, i % 2 ? 'rgba(255, 226, 197, 0.85)' : 'rgba(255, 245, 215, 0.9)');
    g.addColorStop(1, 'rgba(255, 177, 156, 0)');
    cloudCtx.fillStyle = g;
    cloudCtx.fillRect(x - rw, y - rh, rw * 2, rh * 2);
  });

  const weapons = buildWeaponSheets();
  const pickups = buildPickupSheets();

  return {
    ground:       { name: 'sunset_sand_tile', canvas: gCan, tex: makeTexture(gCan, 92) },
    crate:        { name: 'picnic_crate',     canvas: cCan, tex: makeTexture(cCan) },
    metal:        { name: 'boardwalk_planks', canvas: mCan, tex: makeTexture(mCan, 4) },
    intersection: { name: 'driftwood_junction', canvas: iCan, tex: makeTexture(iCan) },
    aura:         { name: 'sun_ring',         canvas: aCan, tex: makeTexture(aCan) },
    pillar:       { name: 'palm_bark',        canvas: pCan, tex: makeTexture(pCan) },
    fabric:       { name: 'sunset_stripes',    canvas: fCan, tex: makeTexture(fCan) },
    thatch:       { name: 'palm_thatch',      canvas: tCan, tex: makeTexture(tCan) },
    water:        { name: 'sunset_ocean',     canvas: wCan, tex: makeTexture(wCan, 1) },
    foam:         { name: 'shore_foam',       canvas: foamCan, tex: makeTexture(foamCan, 1) },
    cloud:        { name: 'sunset_cloud',     canvas: cloudCan, tex: makeTexture(cloudCan, 1) },
    slash:        weapons.slashSheet,
    orbital:      weapons.orbitalSheet,
    pickup_serum: pickups.serum,
    pickup_tooth: pickups.tooth,
    pickup_chest: pickups.chest,
    pickup_scrap: pickups.scrap
  };
}
