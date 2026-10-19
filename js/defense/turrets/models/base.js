// Materiales y ensamblaje del modelo 3D común de torretas.
// Exports: buildMaterials, buildModel.

import * as THREE from 'three';
import { SpriteSheets } from '../../../spritesheets.js';
import { MODEL_BUILDERS } from './registry.js';

export function buildMaterials(turret) {
const metalTex = SpriteSheets.env.metal.tex;
const crateTex = SpriteSheets.env.crate.tex;

turret.bodyMat = new THREE.MeshStandardMaterial({
  map: metalTex, color: 0x3a3126, roughness: 0.86, metalness: 0.42
});
turret.darkMat = new THREE.MeshStandardMaterial({
  map: crateTex, color: 0x241d16, roughness: 0.92, metalness: 0.3
});
turret.rustMat = new THREE.MeshStandardMaterial({
  map: crateTex, color: 0x4a2c1d, roughness: 0.9, metalness: 0.25
});
turret.accentMat = new THREE.MeshStandardMaterial({
  color: turret.cfg.color,
  emissive: turret.cfg.color,
  emissiveIntensity: 0.6,
  roughness: 0.5,
  metalness: 0.3
});
turret.glowMat = new THREE.MeshBasicMaterial({ color: turret.cfg.color });
}

export function buildModel(turret) {
const r = turret.cfg.base.collisionRadius;

// Pedestal común
turret.addPart(
  new THREE.CylinderGeometry(r * 1.25, r * 1.5, 0.3, 8),
  turret.darkMat, 0, 0.15, 0
);
for (let i = 0; i < 4; i++) {
  const a = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
  turret.addPart(
    new THREE.BoxGeometry(0.16, 0.22, 0.26),
    turret.rustMat,
    Math.cos(a) * r * 1.25, 0.11, Math.sin(a) * r * 1.25,
    0, -a, 0
  );
}
const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 1.32, 0.032, 6, 16), turret.glowMat);
ring.rotation.x = Math.PI / 2;
ring.position.y = 0.31;
turret.modelRoot.add(ring);

const builder = MODEL_BUILDERS[turret.cfg.id];
if (builder) builder(turret);

// Franja emisiva común
turret.addPart(new THREE.BoxGeometry(0.34, 0.05, 0.05), turret.glowMat, 0, 0.34, -r * 1.28);
}
