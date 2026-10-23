// Materiales y ensamblaje del modelo 3D común de torretas artesanales de playa.
// La base es un nido de bambú, sacos de arena y un núcleo de coco bioluminiscente.
// Exports: buildMaterials, buildModel.

import * as THREE from 'three';
import { SpriteSheets } from '../../../spritesheets.js';
import { MODEL_BUILDERS } from './registry.js';
import {
  addCoconut,
  addPalmLeaf,
  addBambooPole,
  addRopeBand,
  addEnergyRing
} from './parts.js';
import {
  getHazardTexture,
  getTechPanelTexture,
  getGaugeTexture,
  getTurretDecalTexture,
  getMuzzleFlashTexture
} from '../../../sprites/turret/turretTextures.js';

export function buildMaterials(turret) {
  const metalTex = SpriteSheets.env.metal.tex;
  const crateTex = SpriteSheets.env.crate.tex;
  const thatchTex = SpriteSheets.env.thatch.tex;

  turret.bodyMat = new THREE.MeshStandardMaterial({
    map: metalTex, color: 0xb9824d, roughness: 0.9, metalness: 0.06
  });
  turret.darkMat = new THREE.MeshStandardMaterial({
    map: crateTex, color: 0x5b3722, roughness: 0.94, metalness: 0.02
  });
  turret.rustMat = new THREE.MeshStandardMaterial({
    map: crateTex, color: 0x8f4d2d, roughness: 0.92, metalness: 0.03
  });

  turret.bambooMat = new THREE.MeshStandardMaterial({
    color: 0xc49a58, roughness: 0.82, metalness: 0.04, flatShading: true
  });
  turret.bambooDarkMat = new THREE.MeshStandardMaterial({
    color: 0x6e4a2c, roughness: 0.9, metalness: 0.02, flatShading: true
  });
  turret.coconutMat = new THREE.MeshStandardMaterial({
    color: 0x452818, roughness: 0.92, metalness: 0.01, flatShading: true
  });
  turret.coconutFleshMat = new THREE.MeshStandardMaterial({
    color: 0xf0dfb9, roughness: 0.95, flatShading: true
  });
  turret.leafMat = new THREE.MeshStandardMaterial({
    color: 0x2f8d55, roughness: 0.8, flatShading: true, side: THREE.DoubleSide
  });
  turret.leafLightMat = new THREE.MeshStandardMaterial({
    color: 0x72cf7a, roughness: 0.78, flatShading: true, side: THREE.DoubleSide
  });
  turret.thatchMat = new THREE.MeshStandardMaterial({
    map: thatchTex, color: 0xf0cf8f, roughness: 0.98, metalness: 0.0, side: THREE.DoubleSide
  });

  turret.accentMat = new THREE.MeshStandardMaterial({
    color: turret.cfg.color,
    emissive: turret.cfg.color,
    emissiveIntensity: 0.7,
    roughness: 0.42,
    metalness: 0.15
  });
  turret.glowMat = new THREE.MeshBasicMaterial({ color: turret.cfg.color });
  turret.crystalMat = new THREE.MeshStandardMaterial({
    color: turret.cfg.color,
    emissive: turret.cfg.color,
    emissiveIntensity: 0.9,
    transparent: true,
    opacity: 0.66,
    roughness: 0.2,
    metalness: 0.1,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  turret.sandbagMat = new THREE.MeshStandardMaterial({
    color: 0xe0bd83, roughness: 0.98, flatShading: true
  });
  turret.ropeMat = new THREE.MeshStandardMaterial({
    color: 0xd8b477, roughness: 0.96
  });
  turret.shellMat = new THREE.MeshStandardMaterial({
    color: 0xffe4bd, roughness: 0.82, flatShading: true, side: THREE.DoubleSide
  });

  // Texturas antiguas conservadas para calcomanías y chapa de algunas piezas.
  const hazardTex = getHazardTexture();
  turret.hazardMat = new THREE.MeshStandardMaterial({
    map: hazardTex, roughness: 0.86, metalness: 0.05
  });

  const panelTex = getTechPanelTexture();
  turret.panelMat = new THREE.MeshStandardMaterial({
    map: panelTex, roughness: 0.9, metalness: 0.08
  });

  const gaugeTex = getGaugeTexture('#' + turret.cfg.color.toString(16).padStart(6, '0'));
  turret.gaugeMat = new THREE.MeshBasicMaterial({
    map: gaugeTex, transparent: true
  });

  const decalTex = getTurretDecalTexture(turret.cfg.id);
  turret.decalMat = new THREE.MeshBasicMaterial({
    map: decalTex, transparent: true
  });

  const flashTex = getMuzzleFlashTexture(turret.cfg.id);
  turret.muzzleFlashMat = new THREE.MeshBasicMaterial({
    map: flashTex,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    side: THREE.DoubleSide
  });
}

export function buildModel(turret) {
  const r = turret.cfg.base.collisionRadius;

  // 1. Nido de bambú anclado a la arena (baseRoot no gira al apuntar).
  turret.addBasePart(
    new THREE.CylinderGeometry(r * 1.42, r * 1.62, 0.2, 10),
    turret.bambooDarkMat, 0, 0.1, 0
  );
  turret.addBasePart(
    new THREE.CylinderGeometry(r * 1.2, r * 1.34, 0.1, 10),
    turret.bambooMat, 0, 0.24, 0
  );

  // Raíces de bambú inclinadas y sacos de arena.
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
    const innerX = Math.cos(a) * r * 0.98;
    const innerZ = Math.sin(a) * r * 0.98;
    const outerX = Math.cos(a) * r * 1.62;
    const outerZ = Math.sin(a) * r * 1.62;
    addBambooPole(turret, innerX, 0.28, innerZ, outerX, -0.02, outerZ, 0.075, {
      material: turret.bambooMat,
      parent: turret.baseRoot
    });
    addRopeBand(turret, Math.cos(a) * r * 1.24, 0.18, Math.sin(a) * r * 1.24, 0.12, {
      rx: Math.PI / 2,
      parent: turret.baseRoot
    });

    const bag = turret.addBasePart(
      new THREE.SphereGeometry(0.22, 6, 4),
      turret.sandbagMat,
      Math.cos(a) * r * 1.21, 0.2, Math.sin(a) * r * 1.21
    );
    bag.scale.set(1.4, 0.68, 0.88);
  }

  // Aro de cuerda perimetral y cinturón de energía.
  const ropeRing = new THREE.Mesh(
    new THREE.TorusGeometry(r * 1.3, 0.055, 5, 20),
    turret.ropeMat
  );
  ropeRing.rotation.x = Math.PI / 2;
  ropeRing.position.y = 0.27;
  turret.baseRoot.add(ropeRing);

  const energyRing = new THREE.Mesh(
    new THREE.TorusGeometry(r * 1.08, 0.025, 5, 18),
    turret.glowMat
  );
  energyRing.rotation.x = Math.PI / 2;
  energyRing.position.y = 0.3;
  turret.baseRoot.add(energyRing);

  // Núcleo de coco flotante: la firma tecnológica de la torreta.
  addCoconut(turret, 0, 0.36, 0, 0.19, { parent: turret.baseRoot });
  addEnergyRing(turret, 0, 0.38, 0, 0.31, { rx: Math.PI / 2, parent: turret.baseRoot });
  addEnergyRing(turret, 0, 0.48, 0, 0.23, { rz: Math.PI / 2, parent: turret.baseRoot });

  // Hojas de palma abiertas en la parte trasera.
  addPalmLeaf(turret, -r * 0.92, 0.46, r * 0.78, {
    sx: 0.1, sy: 0.46, sz: 0.1, rx: 0.65, rz: 0.8, parent: turret.baseRoot
  });

  // Runas de energía sobre el borde de la plataforma.
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
    const chip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 0.045), turret.glowMat);
    chip.position.set(Math.cos(a) * r * 1.18, 0.305, Math.sin(a) * r * 1.18);
    chip.rotation.y = -a;
    turret.baseRoot.add(chip);
  }

  // Estrella de mar como tallado decorativo.
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.025, 0.16), turret.shellMat);
    arm.position.set(
      -r * 0.55 + Math.cos(a) * 0.075,
      0.305,
      r * 0.45 + Math.sin(a) * 0.075
    );
    arm.rotation.y = -a;
    turret.baseRoot.add(arm);
  }

  // Plato de giro central.
  turret.addBasePart(
    new THREE.CylinderGeometry(r * 0.82, r * 0.94, 0.09, 10),
    turret.bambooMat, 0, 0.36, 0
  );

  // 2. Cabezal giratorio.
  turret.addPart(
    new THREE.CylinderGeometry(r * 0.62, r * 0.74, 0.12, 10),
    turret.ropeMat, 0, 0.44, 0
  );

  const builder = MODEL_BUILDERS[turret.cfg.id];
  if (builder) builder(turret);
}
