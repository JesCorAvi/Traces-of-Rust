// Modelo 3D del Lanzacoco: cañón de coco y bambú con núcleo bioluminiscente.
// Exports: buildGunnerModel.

import * as THREE from 'three';
import {
  addCoconut,
  addPalmLeaf,
  addBambooPole,
  addRopeBand,
  addEnergyRing,
  addGlowPearl
} from './parts.js';

export function buildGunnerModel(turret) {
  // Cureña ligera de bambú.
  addBambooPole(turret, -0.38, 0.52, 0.34, -0.38, 0.52, -0.38, 0.065);
  addBambooPole(turret, 0.38, 0.52, 0.34, 0.38, 0.52, -0.38, 0.065);
  turret.addPart(new THREE.CylinderGeometry(0.3, 0.38, 0.22, 10), turret.bambooMat, 0, 0.58, 0);
  turret.addPart(new THREE.CylinderGeometry(0.16, 0.2, 0.26, 8), turret.coconutMat, 0, 0.77, 0.06);

  // Cestones de cocos a ambos lados.
  addCoconut(turret, 0.42, 0.62, 0.18, 0.12);
  addCoconut(turret, -0.42, 0.6, 0.16, 0.11);
  addRopeBand(turret, 0.42, 0.62, 0.18, 0.17, { rx: Math.PI / 2 });
  addPalmLeaf(turret, 0.38, 0.72, 0.34, { sx: 0.11, sy: 0.52, sz: 0.11, rx: 0.8, rz: 0.4 });

  // Grupo del cañón (retroceso real).
  const barrelGroup = new THREE.Group();
  barrelGroup.position.set(0, 0.82, 0);
  turret.modelRoot.add(barrelGroup);
  turret.barrelRecoilMesh = barrelGroup;
  turret.barrelBaseZ = 0;

  // Culata de coco y tubo de bambú ahuecado.
  addCoconut(turret, 0, 0.02, 0.12, 0.23, { parent: barrelGroup });
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.115, 1.1, 8),
    turret.bambooMat
  );
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.03, -0.48);
  barrel.castShadow = true;
  barrelGroup.add(barrel);

  const muzzle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.115, 0.13, 0.12, 10),
    turret.coconutFleshMat
  );
  muzzle.rotation.x = Math.PI / 2;
  muzzle.position.set(0, 0.03, -1.02);
  muzzle.castShadow = true;
  barrelGroup.add(muzzle);

  addEnergyRing(turret, 0, 0.03, -0.98, 0.16, { parent: barrelGroup, rx: Math.PI / 2 });
  addRopeBand(turret, 0, 0.03, -0.25, 0.14, { parent: barrelGroup, rx: Math.PI / 2 });
  addRopeBand(turret, 0, 0.03, -0.62, 0.14, { parent: barrelGroup, rx: Math.PI / 2 });

  // Mira de concha y perla.
  addGlowPearl(turret, 0, 0.28, -0.08, 0.055);
  addRopeBand(turret, 0, 0.24, -0.08, 0.1, { rx: Math.PI / 2 });

  // Varal de recarga y hoja de puntería.
  addBambooPole(turret, 0.27, 0.5, 0.25, 0.46, 0.84, 0.02, 0.037);
  addPalmLeaf(turret, -0.3, 0.92, 0.14, {
    sx: 0.1, sy: 0.5, sz: 0.1, rx: 0.45, rz: -0.65, light: true
  });

  // Mejoras: cañón gemelo, cargador de cocos, ánima larga, bobinas,
  // depósito de zumo inflamable y coco explosivo.
  turret.addHiddenPart(
    'twin_barrels',
    new THREE.CylinderGeometry(0.08, 0.1, 1.05, 8),
    turret.bambooMat, 0.17, 0.82, -0.73, Math.PI / 2, 0, 0
  );
  turret.addHiddenPart(
    'ammo_drum',
    new THREE.CylinderGeometry(0.2, 0.2, 0.22, 10),
    turret.coconutMat, 0.42, 0.63, 0.04, 0, 0, Math.PI / 2
  );
  turret.addHiddenPart(
    'long_barrel',
    new THREE.CylinderGeometry(0.07, 0.1, 1.55, 8),
    turret.coconutFleshMat, 0, 0.82, -1.02, Math.PI / 2, 0, 0
  );
  turret.addHiddenPart(
    'rail_coils',
    new THREE.TorusGeometry(0.17, 0.032, 6, 12),
    turret.glowMat, 0, 0.82, -1.18, Math.PI / 2, 0, 0
  );
  turret.addHiddenPart(
    'fuel_tank',
    new THREE.CylinderGeometry(0.15, 0.15, 0.45, 8),
    turret.accentMat, -0.42, 0.61, 0.02, 0, 0, Math.PI / 2
  );
  turret.addHiddenPart(
    'explosive_tank',
    new THREE.SphereGeometry(0.17, 8, 6),
    turret.glowMat, 0.44, 0.6, 0.12
  );

  turret.muzzleHeight = 0.85;
  turret.muzzleForward = 1.12;
}
