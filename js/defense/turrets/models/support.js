// Modelo 3D de la torreta support: pilón táctico con radar giratorio, bobinas y calcomanías.
// Exports: buildSupportModel.

import * as THREE from 'three';

export function buildSupportModel(turret) {
  // Generador central y pilones
  turret.addPart(new THREE.BoxGeometry(0.68, 0.38, 0.68), turret.bodyMat, 0, 0.52, 0);

  // Placas laterales de blindaje con remaches y panel técnico
  turret.addPart(new THREE.BoxGeometry(0.06, 0.34, 0.62), turret.panelMat, -0.36, 0.52, 0);
  turret.addPart(new THREE.BoxGeometry(0.06, 0.34, 0.62), turret.panelMat, 0.36, 0.52, 0);

  // Placa de advertencia de alto voltaje
  const decalMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.19), turret.decalMat);
  decalMesh.position.set(-0.4, 0.55, 0);
  decalMesh.rotation.y = -Math.PI / 2;
  turret.modelRoot.add(decalMesh);

  // Medidor de sobrecarga de energía
  const gaugeMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), turret.gaugeMat);
  gaugeMesh.position.set(0, 0.55, 0.36);
  gaugeMesh.rotation.y = Math.PI;
  turret.modelRoot.add(gaugeMesh);

  // Mástil central con bobinas de inducción de cobre apiladas
  turret.addPart(new THREE.CylinderGeometry(0.12, 0.15, 0.85, 8), turret.darkMat, 0, 1.05, 0);

  for (let y = 0.85; y <= 1.25; y += 0.14) {
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.035, 6, 16), turret.rustMat);
    coil.rotation.x = Math.PI / 2;
    coil.position.set(0, y, 0);
    turret.modelRoot.add(coil);
  }

  // Plato de radar / antena emisora giratoria en la cima
  const radarGroup = new THREE.Group();
  radarGroup.position.set(0, 1.55, 0);
  turret.modelRoot.add(radarGroup);
  turret.radarDishMesh = radarGroup; // gira continuamente en update

  // Plato cóncavo de radar
  const dish = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.08, 0.14, 8, 1, true),
    turret.accentMat
  );
  dish.rotation.x = 0.5;
  dish.position.set(0, 0.1, -0.08);
  radarGroup.add(dish);

  // Puntero / emisor central del plato
  const feedHorn = new THREE.Mesh(
    new THREE.ConeGeometry(0.05, 0.22, 6),
    turret.glowMat
  );
  feedHorn.rotation.x = 0.5;
  feedHorn.position.set(0, 0.16, -0.16);
  radarGroup.add(feedHorn);

  // Piezas de mejora (ocultas)
  turret.addHiddenPart(
    'tool_arms',
    new THREE.BoxGeometry(0.52, 0.11, 0.11),
    turret.rustMat, 0.36, 0.95, -0.18, 0, 0, -0.35
  );
  turret.addHiddenPart(
    'tesla_coils',
    new THREE.TorusGeometry(0.28, 0.045, 6, 16),
    turret.glowMat, 0, 1.35, 0, Math.PI / 2, 0, 0
  );
  turret.addHiddenPart(
    'surge_core',
    new THREE.IcosahedronGeometry(0.22, 0),
    turret.glowMat, 0, 1.15, 0
  );
  const dome = turret.addHiddenPart(
    'dome',
    new THREE.SphereGeometry(0.72, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshBasicMaterial({
      color: 0x6f8f9c, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false
    }),
    0, 0.36, 0
  );
  dome.castShadow = false;
  dome.receiveShadow = false;

  turret.addHiddenPart(
    'barrier_ring',
    new THREE.TorusGeometry(0.82, 0.05, 6, 24),
    turret.glowMat, 0, 0.6, 0, Math.PI / 2, 0, 0
  );
  turret.addHiddenPart(
    'repair_beacon',
    new THREE.CylinderGeometry(0.06, 0.08, 0.6, 8),
    turret.glowMat, 0, 1.85, 0
  );

  turret.muzzleHeight = 1.6;
  turret.muzzleForward = 0.25;
}
