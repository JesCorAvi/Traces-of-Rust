// Materiales del mundo tropical: arena, madera, follaje, agua y tela.
// Exports: createWorldMaterials.

import * as THREE from 'three';
import { SpriteSheets } from '../spritesheets.js';

function tileTexture(tex, rx, ry) {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(rx, ry);
  tex.needsUpdate = true;
  return tex;
}

export function createWorldMaterials() {
  const env = SpriteSheets.env;

  const groundMat = new THREE.MeshStandardMaterial({
    map: env.ground.tex,
    bumpMap: env.ground.tex,
    bumpScale: 0.11,
    roughness: 0.98,
    metalness: 0.0,
    vertexColors: true
  });

  const woodMat = new THREE.MeshStandardMaterial({
    map: env.metal.tex,
    color: 0xc89a6a,
    roughness: 0.9,
    metalness: 0.02
  });

  const crateMat = new THREE.MeshStandardMaterial({
    map: env.crate.tex,
    roughness: 0.92,
    metalness: 0.02
  });

  const metalMat = new THREE.MeshStandardMaterial({
    map: env.metal.tex,
    color: 0xb88f64,
    roughness: 0.86,
    metalness: 0.05
  });

  const barrelMat = new THREE.MeshStandardMaterial({
    color: 0x9a5e35,
    roughness: 0.94,
    flatShading: true
  });

  const pillarMat = new THREE.MeshStandardMaterial({
    map: env.pillar.tex,
    alphaTest: 0.5,
    transparent: true,
    roughness: 0.92,
    side: THREE.DoubleSide
  });

  const palmTrunkMat = new THREE.MeshStandardMaterial({
    color: 0x8b5a35,
    roughness: 0.95,
    flatShading: true
  });

  const palmLeafMat = new THREE.MeshStandardMaterial({
    color: 0x2e8d58,
    roughness: 0.86,
    flatShading: true,
    side: THREE.DoubleSide
  });

  const palmLeafLightMat = new THREE.MeshStandardMaterial({
    color: 0x5cbb6d,
    roughness: 0.84,
    flatShading: true,
    side: THREE.DoubleSide
  });

  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x79a94d,
    roughness: 0.94,
    flatShading: true,
    side: THREE.DoubleSide
  });

  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x8e8178,
    roughness: 0.98,
    flatShading: true
  });

  const driftwoodMat = new THREE.MeshStandardMaterial({
    color: 0xb38b61,
    roughness: 0.95,
    flatShading: true
  });

  const thatchMat = new THREE.MeshStandardMaterial({
    map: env.thatch.tex,
    color: 0xf0cf8f,
    roughness: 0.98,
    side: THREE.DoubleSide
  });

  const fabricMat = new THREE.MeshStandardMaterial({
    map: env.fabric.tex,
    color: 0xffffff,
    roughness: 0.9,
    side: THREE.DoubleSide
  });

  const ropeMat = new THREE.MeshStandardMaterial({
    color: 0xd5b478,
    roughness: 0.96
  });

  const oceanTex = tileTexture(env.water.tex, 16, 11);
  oceanTex.generateMipmaps = true;
  oceanTex.minFilter = THREE.LinearMipmapLinearFilter;
  oceanTex.magFilter = THREE.LinearFilter;
  oceanTex.anisotropy = 4;
  oceanTex.needsUpdate = true;
  const oceanMat = new THREE.MeshBasicMaterial({
    map: oceanTex,
    color: 0xffffff,
    transparent: true,
    opacity: 0.94,
    toneMapped: false
  });

  const foamMat = new THREE.MeshBasicMaterial({
    map: tileTexture(env.foam.tex, 34, 1),
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  return {
    cloudTex: env.cloud.tex,
    waterTex: env.water.tex,
    foamTex: env.foam.tex,
    groundMat,
    woodMat,
    crateMat,
    metalMat,
    barrelMat,
    pillarMat,
    palmTrunkMat,
    palmLeafMat,
    palmLeafLightMat,
    grassMat,
    rockMat,
    driftwoodMat,
    thatchMat,
    fabricMat,
    ropeMat,
    oceanMat,
    foamMat
  };
}
