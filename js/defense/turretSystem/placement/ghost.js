// Fantasma de colocación de torretas.
// Exports: buildPlacementGhost.

import * as THREE from 'three';

export function buildPlacementGhost(system) {
  const group = new THREE.Group();

  system.ghostRingMat = new THREE.MeshBasicMaterial({
    color: 0x9caf6b,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.15, 24), system.ghostRingMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.04;

  system.ghostBodyMat = new THREE.MeshBasicMaterial({
    color: 0x9caf6b,
    transparent: true,
    opacity: 0.16,
    depthWrite: false
  });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 1.6, 8), system.ghostBodyMat);
  body.position.y = 0.8;

  system.ghostBeamMat = new THREE.MeshBasicMaterial({
    color: 0x9caf6b,
    transparent: true,
    opacity: 0.3,
    depthWrite: false
  });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 3.0, 6), system.ghostBeamMat);
  beam.position.y = 1.5;

  system.ghostRangeFillMat = new THREE.MeshBasicMaterial({
    color: 0x9caf6b,
    transparent: true,
    opacity: 0.14,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const rangeFill = new THREE.Mesh(new THREE.CircleGeometry(1, 64), system.ghostRangeFillMat);
  rangeFill.rotation.x = -Math.PI / 2;
  rangeFill.position.y = 0.02;

  system.ghostRangeRingMat = new THREE.MeshBasicMaterial({
    color: 0x9caf6b,
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const rangeRing = new THREE.Mesh(new THREE.RingGeometry(0.97, 1.0, 64), system.ghostRangeRingMat);
  rangeRing.rotation.x = -Math.PI / 2;
  rangeRing.position.y = 0.025;

  system.ghostRangeGroup = new THREE.Group();
  system.ghostRangeGroup.add(rangeFill, rangeRing);

  group.add(ring, body, beam, system.ghostRangeGroup);
  group.visible = false;
  system.scene.add(group);
  system.placementGhost = group;
}
