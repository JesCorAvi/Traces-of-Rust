// Escena base, niebla, luz ambiental y suelo.
// Exports: createWorldScene.

import * as THREE from 'three';

export function createWorldScene(materials) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x040604);
  scene.fog = new THREE.FogExp2(0x040604, 0.038);

  const ambientLight = new THREE.AmbientLight(0x1e281d, 0.65);
  scene.add(ambientLight);

  // Suelo base impenetrable en cota y = 0.0m
  const groundMat = materials.groundMat;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  return { scene, ambientLight };
}
