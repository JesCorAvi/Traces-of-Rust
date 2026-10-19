// Materiales estándar del mundo industrial.
// Exports: createWorldMaterials.

import * as THREE from 'three';
import { SpriteSheets } from '../spritesheets.js';

export function createWorldMaterials() {
  const groundMat = new THREE.MeshStandardMaterial({
    map: SpriteSheets.env.ground.tex,
    bumpMap: SpriteSheets.env.ground.tex,
    bumpScale: 0.08,
    roughness: 0.92,
    metalness: 0.15
  });
  const crateMat = new THREE.MeshStandardMaterial({
    map: SpriteSheets.env.crate.tex,
    roughness: 0.88,
    metalness: 0.25
  });
  const metalMat = new THREE.MeshStandardMaterial({
    map: SpriteSheets.env.metal.tex,
    roughness: 0.78,
    metalness: 0.45
  });
  const barrelMat = new THREE.MeshStandardMaterial({
    color: 0x5c2618,
    roughness: 0.75,
    metalness: 0.4,
    flatShading: true
  });
  const pillarMat = new THREE.MeshStandardMaterial({
    map: SpriteSheets.env.pillar.tex,
    alphaTest: 0.5,
    transparent: true,
    roughness: 0.9,
    side: THREE.DoubleSide
  });
  return { groundMat, crateMat, metalMat, barrelMat, pillarMat };
}
