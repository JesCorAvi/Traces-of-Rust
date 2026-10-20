// Modelo 3D de la torreta gunner: ametralladora pesada industrial con calcomanías y retroceso.
// Exports: buildGunnerModel.

import * as THREE from 'three';

export function buildGunnerModel(turret) {
  // Chasis blindado central
  turret.addPart(new THREE.BoxGeometry(0.58, 0.36, 0.62), turret.bodyMat, 0, 0.62, 0);

  // Placas laterales de blindaje con textura de panel técnico
  turret.addPart(new THREE.BoxGeometry(0.06, 0.32, 0.58), turret.panelMat, -0.31, 0.62, 0);
  turret.addPart(new THREE.BoxGeometry(0.06, 0.32, 0.58), turret.panelMat, 0.31, 0.62, 0);

  // Placa de calcomanía en el flanco (calibre e iconos de proyectiles)
  const decalMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.19), turret.decalMat);
  decalMesh.position.set(-0.35, 0.62, 0.05);
  decalMesh.rotation.y = -Math.PI / 2;
  turret.modelRoot.add(decalMesh);

  // Manómetro analógico en la parte posterior
  const gaugeMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), turret.gaugeMat);
  gaugeMesh.position.set(0, 0.65, 0.32);
  gaugeMesh.rotation.y = Math.PI;
  turret.modelRoot.add(gaugeMesh);

  // Torreta superior y visor óptico
  turret.addPart(new THREE.BoxGeometry(0.38, 0.18, 0.32), turret.darkMat, 0, 0.88, -0.08);
  turret.addPart(new THREE.BoxGeometry(0.18, 0.09, 0.12), turret.accentMat, 0, 0.94, -0.22); // lente óptica

  // Cañón principal con retroceso
  const barrelGroup = new THREE.Group();
  barrelGroup.position.set(0, 0.78, 0);
  turret.modelRoot.add(barrelGroup);
  turret.barrelRecoilMesh = barrelGroup;
  turret.barrelBaseZ = 0;

  // Tubo del cañón principal
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.92, 8), turret.darkMat);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0, -0.72);
  barrelGroup.add(barrel);

  // Camisa perforada de refrigeración
  const shroud = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.48, 8), turret.rustMat);
  shroud.rotation.x = Math.PI / 2;
  shroud.position.set(0, 0, -0.52);
  barrelGroup.add(shroud);

  // Anillo de advertencia con franjas hazard en bocacha
  const tipRing = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.12, 8), turret.hazardMat);
  tipRing.rotation.x = Math.PI / 2;
  tipRing.position.set(0, 0, -1.16);
  barrelGroup.add(tipRing);

  // Caja de munición lateral
  turret.addPart(new THREE.BoxGeometry(0.24, 0.28, 0.32), turret.darkMat, 0.38, 0.58, 0.06);
  turret.addPart(new THREE.BoxGeometry(0.26, 0.04, 0.34), turret.hazardMat, 0.38, 0.73, 0.06);

  // Piezas de mejora (ocultas)
  turret.addHiddenPart(
    'twin_barrels',
    new THREE.CylinderGeometry(0.07, 0.07, 0.92, 8),
    turret.darkMat, 0.16, 0.78, -0.72, Math.PI / 2, 0, 0
  );
  turret.addHiddenPart(
    'ammo_drum',
    new THREE.CylinderGeometry(0.24, 0.24, 0.22, 12),
    turret.rustMat, 0.42, 0.62, 0.05, 0, 0, Math.PI / 2
  );
  turret.addHiddenPart(
    'long_barrel',
    new THREE.CylinderGeometry(0.065, 0.075, 1.55, 8),
    turret.accentMat, 0, 0.78, -1.05, Math.PI / 2, 0, 0
  );
  turret.addHiddenPart(
    'rail_coils',
    new THREE.TorusGeometry(0.17, 0.035, 6, 12),
    turret.glowMat, 0, 0.78, -1.15, 0, 0, 0
  );
  turret.addHiddenPart(
    'fuel_tank',
    new THREE.CylinderGeometry(0.16, 0.16, 0.52, 8),
    turret.rustMat, -0.38, 0.62, 0.08, 0, 0, Math.PI / 2
  );
  turret.addHiddenPart(
    'explosive_tank',
    new THREE.CylinderGeometry(0.18, 0.18, 0.46, 8),
    turret.accentMat, 0.4, 0.6, 0.1, 0, 0, Math.PI / 2
  );

  turret.muzzleHeight = 0.78;
  turret.muzzleForward = 1.25;
}
