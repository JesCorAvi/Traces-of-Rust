// Modelo 3D de la Carpa de Socorristas: puesto de playa con anillo de rescate.
// Exports: buildBarracksModel.

import * as THREE from 'three';
import {
  addCoconut,
  addPalmLeaf,
  addBambooPole,
  addRopeBand,
  addEnergyRing
} from './parts.js';

export function buildBarracksModel(turret) {
  // Plataforma de bambú y postes de la carpa.
  turret.addPart(new THREE.CylinderGeometry(0.72, 0.82, 0.18, 10), turret.bambooMat, 0, 0.58, 0);
  const posts = [[-0.62, -0.52], [0.62, -0.52], [-0.62, 0.52], [0.62, 0.52]];
  for (const [x, z] of posts) {
    addBambooPole(turret, x, 0.55, z, x * 0.82, 1.3, z * 0.82, 0.055);
    addRopeBand(turret, x * 0.9, 0.74, z * 0.9, 0.1, { rx: Math.PI / 2 });
  }

  // Techo de paja tipo sombrilla.
  turret.addPart(new THREE.ConeGeometry(1.02, 0.58, 8), turret.thatchMat, 0, 1.57, 0);
  turret.addPart(new THREE.CylinderGeometry(0.98, 0.98, 0.08, 8, 1, true), turret.thatchMat, 0, 1.28, 0);
  addPalmLeaf(turret, -0.7, 1.62, 0.12, {
    sx: 0.12, sy: 0.6, sz: 0.12, rx: 0.45, rz: -0.55, light: true
  });

  // Entrada frontal con anillo de salvamento luminoso.
  addBambooPole(turret, -0.54, 0.62, -0.55, -0.54, 1.2, -0.55, 0.05);
  addBambooPole(turret, 0.54, 0.62, -0.55, 0.54, 1.2, -0.55, 0.05);
  const buoy = new THREE.Mesh(
    new THREE.TorusGeometry(0.26, 0.07, 6, 18),
    turret.shellMat
  );
  buoy.position.set(0, 0.94, -0.58);
  buoy.castShadow = true;
  turret.modelRoot.add(buoy);
  const buoyGlow = new THREE.Mesh(
    new THREE.TorusGeometry(0.26, 0.022, 5, 18),
    turret.glowMat
  );
  buoyGlow.position.set(0, 0.94, -0.6);
  turret.modelRoot.add(buoyGlow);
  addEnergyRing(turret, 0, 0.62, -0.42, 0.28, { rx: Math.PI / 2 });

  // Tabla de salvamento y bandera.
  const board = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.14, 0.62, 4, 8),
    turret.shellMat
  );
  board.position.set(-0.72, 0.92, -0.1);
  board.rotation.z = 0.18;
  board.castShadow = true;
  turret.modelRoot.add(board);
  addBambooPole(turret, 0.72, 0.6, -0.36, 0.72, 1.72, -0.36, 0.025);
  const flag = new THREE.Mesh(
    new THREE.PlaneGeometry(0.48, 0.26),
    new THREE.MeshStandardMaterial({ color: 0xff8165, roughness: 0.9, side: THREE.DoubleSide })
  );
  flag.position.set(0.95, 1.56, -0.36);
  flag.rotation.y = -0.2;
  turret.modelRoot.add(flag);

  // Cocos-linterna y hamaca enrollada.
  addCoconut(turret, 0.68, 0.78, 0.4, 0.12);
  addRopeBand(turret, 0.68, 0.78, 0.4, 0.17, { rx: Math.PI / 2 });
  addCoconut(turret, -0.68, 0.72, 0.42, 0.1);

  // Mejoras: literas extra, batallón, placas de coral, armazón pesado,
  // antena de palma y rack de drones.
  turret.addHiddenPart(
    'extra_bunks',
    new THREE.BoxGeometry(0.78, 0.18, 0.26),
    turret.bambooMat, 0, 0.52, 0.56
  );
  turret.addHiddenPart(
    'battalion_bunks',
    new THREE.BoxGeometry(0.88, 0.26, 0.3),
    turret.ropeMat, 0, 0.5, 0.58
  );
  turret.addHiddenPart(
    'armor_plates',
    new THREE.CylinderGeometry(0.82, 0.92, 0.2, 8),
    turret.shellMat, 0, 0.86, 0
  );
  turret.addHiddenPart(
    'heavy_armor',
    new THREE.CylinderGeometry(0.94, 1.02, 0.28, 8),
    turret.bambooDarkMat, 0, 0.9, 0
  );
  turret.addHiddenPart(
    'antenna',
    new THREE.CylinderGeometry(0.022, 0.032, 1.2, 6),
    turret.glowMat, -0.28, 1.84, -0.2
  );
  turret.addHiddenPart(
    'drone_rack',
    new THREE.BoxGeometry(0.46, 0.14, 0.32),
    turret.accentMat, -0.3, 1.16, -0.24
  );

  turret.muzzleHeight = 0.72;
  turret.muzzleForward = 0.8;
}
