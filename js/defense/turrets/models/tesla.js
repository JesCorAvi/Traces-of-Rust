// Modelo 3D de la Anguila Eléctrica: batería de coco, eel coil y electrodos de concha.
// Exports: buildTeslaModel.

import * as THREE from 'three';
import {
  addCoconut,
  addPalmLeaf,
  addBambooPole,
  addRopeBand,
  addEnergyRing,
  addShellDish,
  addGlowPearl
} from './parts.js';

export function buildTeslaModel(turret) {
  // Celda de energía de bambú y coco.
  turret.addPart(new THREE.CylinderGeometry(0.34, 0.44, 0.32, 8), turret.bambooDarkMat, 0, 0.6, 0);
  turret.addPart(new THREE.CylinderGeometry(0.2, 0.26, 0.72, 8), turret.bambooMat, 0, 0.98, 0);
  addRopeBand(turret, 0, 0.7, 0, 0.25, { rx: Math.PI / 2 });
  addCoconut(turret, 0, 1.02, 0.02, 0.24);

  // Anguila en espiral alrededor de la celda.
  const eel = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.27, 0.035, 36, 6, 2, 3),
    turret.glowMat
  );
  eel.position.set(0, 1.05, 0);
  eel.scale.y = 1.5;
  turret.modelRoot.add(eel);
  addEnergyRing(turret, 0, 1.05, 0, 0.4, { rx: Math.PI / 2 });
  addEnergyRing(turret, 0, 1.24, 0, 0.31, { rz: Math.PI / 2 });

  // Electrodos de concha y coco a los lados.
  for (const side of [-1, 1]) {
    addShellDish(turret, side * 0.42, 1.02, 0.04, {
      sx: 0.18, sy: 0.12, sz: 0.3, ry: side * 0.5, rz: side * 0.3
    });
    addCoconut(turret, side * 0.38, 0.78, 0.2, 0.1);
    addBambooPole(turret, side * 0.35, 0.75, 0.1, side * 0.42, 1.12, 0.02, 0.035);
  }

  // Electrodo flotante y corona de palma.
  addGlowPearl(turret, 0, 1.48, 0, 0.14);
  addEnergyRing(turret, 0, 1.48, 0, 0.24, { rx: Math.PI / 2 });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    addPalmLeaf(turret, Math.cos(a) * 0.18, 1.58, Math.sin(a) * 0.18, {
      sx: 0.06, sy: 0.34, sz: 0.06, rx: 0.3, rz: Math.cos(a) * 0.8,
      light: i % 2 === 0
    });
  }

  // Mejoras: arcos, corona, capacitor y sobrecarga.
  turret.addHiddenPart(
    'tesla_arcs',
    new THREE.TorusGeometry(0.3, 0.04, 6, 18),
    turret.glowMat, 0, 1.42, 0, Math.PI / 2, 0, 0
  );
  turret.addHiddenPart(
    'tesla_crown',
    new THREE.ConeGeometry(0.08, 0.28, 6),
    turret.glowMat, -0.24, 1.74, 0, 0, 0, -0.4
  );
  turret.addHiddenPart(
    'tesla_capacitor',
    new THREE.CylinderGeometry(0.1, 0.1, 0.32, 8),
    turret.accentMat, 0.36, 0.72, 0.12, 0, 0, Math.PI / 2
  );
  turret.addHiddenPart(
    'tesla_overload',
    new THREE.TorusGeometry(0.4, 0.035, 6, 20),
    turret.glowMat, 0, 1.14, 0, Math.PI / 2, 0, 0
  );

  turret.muzzleHeight = 1.55;
  turret.muzzleForward = 0.22;
}
