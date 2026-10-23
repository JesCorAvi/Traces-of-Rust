// Modelo 3D del Cubo Helado: almeja criogénica, cocos refrigerantes y cristal de escarcha.
// Exports: buildCryoModel.

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

export function buildCryoModel(turret) {
  // Corona de bambú que sostiene la almeja.
  turret.addPart(new THREE.CylinderGeometry(0.34, 0.44, 0.36, 8), turret.bambooMat, 0, 0.6, 0);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    addBambooPole(
      turret,
      Math.cos(a) * 0.25, 0.52, Math.sin(a) * 0.25,
      Math.cos(a) * 0.48, 0.92, Math.sin(a) * 0.48,
      0.045,
      { material: turret.bambooDarkMat }
    );
  }

  // Dos cocos de refrigerante en la parte trasera.
  addCoconut(turret, -0.24, 0.9, 0.26, 0.14);
  addCoconut(turret, 0.24, 0.9, 0.26, 0.14);
  addRopeBand(turret, 0, 0.99, 0.26, 0.2, { rx: Math.PI / 2 });

  // Almeja emisora: dos valvas abiertas y un horno de escarcha.
  addShellDish(turret, 0, 0.9, -0.22, {
    sx: 0.48, sy: 0.26, sz: 0.46, rx: 0.2
  });
  addShellDish(turret, 0, 1.18, -0.22, {
    sx: 0.42, sy: 0.22, sz: 0.4, rx: Math.PI - 0.3
  });
  addEnergyRing(turret, 0, 1.04, -0.52, 0.25, { rx: Math.PI / 2 });
  addEnergyRing(turret, 0, 1.04, -0.52, 0.18, { rz: Math.PI / 2 });

  const horn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.27, 0.1, 0.42, 10, 1, true),
    turret.coconutFleshMat
  );
  horn.rotation.x = Math.PI / 2;
  horn.position.set(0, 1.04, -0.48);
  horn.castShadow = true;
  turret.modelRoot.add(horn);
  addGlowPearl(turret, 0, 1.04, -0.55, 0.17, { material: turret.crystalMat });

  // Aletas/hojas de la almeja y carámbanos de coral.
  for (const side of [-1, 1]) {
    addPalmLeaf(turret, side * 0.44, 1.02, -0.08, {
      sx: 0.12, sy: 0.55, sz: 0.12, rx: 0.7, rz: side * 0.75, light: true
    });
    addShellDish(turret, side * 0.34, 1.08, 0.05, {
      sx: 0.18, sy: 0.12, sz: 0.28, ry: side * 0.4
    });
  }

  // Mejoras: bobinas de escarcha, radiador de palma, cristal, púas,
  // cristal de fractura y anillo de ventisca.
  turret.addHiddenPart(
    'frost_coils',
    new THREE.TorusGeometry(0.32, 0.04, 6, 16),
    turret.glowMat, 0, 1.04, -0.28, 0, 0, 0
  );
  turret.addHiddenPart(
    'radiator_fins',
    new THREE.BoxGeometry(0.7, 0.42, 0.08),
    turret.bambooDarkMat, 0, 1.02, 0.38
  );
  turret.addHiddenPart(
    'crystal_core',
    new THREE.IcosahedronGeometry(0.25, 0),
    turret.crystalMat, 0, 1.08, -0.48
  );
  turret.addHiddenPart(
    'ice_spikes',
    new THREE.ConeGeometry(0.1, 0.5, 6),
    turret.crystalMat, 0.34, 1.16, -0.28, 0, 0, -0.4
  );
  turret.addHiddenPart(
    'shatter_crystal',
    new THREE.OctahedronGeometry(0.28, 0),
    turret.crystalMat, 0, 1.4, 0.02
  );
  turret.addHiddenPart(
    'blizzard_core',
    new THREE.TorusGeometry(0.52, 0.055, 6, 20),
    turret.glowMat, 0, 1.04, -0.42, 0, 0, 0
  );

  turret.muzzleHeight = 1.04;
  turret.muzzleForward = 0.78;
}
