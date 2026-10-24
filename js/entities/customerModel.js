// Cliente 3D procedural del chiringuito: cuerpo, ropa y animación simple.
// Exports: createCustomerModel.

import * as THREE from 'three';

function mat(color, roughness = 0.85, flat = true) {
  return new THREE.MeshStandardMaterial({ color, roughness, flatShading: flat });
}

function addMesh(group, geo, material, position, rotation = null) {
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(...position);
  if (rotation) mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

/**
 * Crea un cliente con una silueta legible a distancia y devuelve referencias
 * a las extremidades para animar caminar/sentarse/comer.
 */
export function createCustomerModel(archetype = {}, variant = 0) {
  const group = new THREE.Group();
  group.name = `customer_${archetype.id || 'guest'}_${variant}`;
  const skinColors = [0xd9a676, 0xb87950, 0xf0c9a0, 0x85553b];
  const shirtColors = [archetype.color ?? 0x4fb7c7, 0xe0a15b, 0x8d68b3, 0xd96c5e, 0x69a88c];
  const accentColors = [archetype.accent ?? 0xf6d9a9, 0xe9e1c4, 0x293847];
  const skin = mat(skinColors[variant % skinColors.length], 0.9);
  const shirt = mat(shirtColors[variant % shirtColors.length], 0.86);
  const accent = mat(accentColors[variant % accentColors.length], 0.9);
  const shorts = mat(0x374b58, 0.92);
  const hair = mat(variant % 3 === 0 ? 0x3b2820 : 0x6d432b, 0.95);
  const shoe = mat(0x2f2a27, 0.95);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.46, 12),
    new THREE.MeshBasicMaterial({ color: 0x10130f, transparent: true, opacity: 0.35, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.025;
  group.add(shadow);

  const hip = new THREE.Group();
  hip.position.y = 0.86;
  group.add(hip);

  const torso = addMesh(hip, new THREE.BoxGeometry(0.62, 0.82, 0.34), shirt, [0, 0.35, 0]);
  const belly = addMesh(hip, new THREE.BoxGeometry(0.68, 0.25, 0.38), shirt, [0, 0.04, 0]);
  const neck = addMesh(hip, new THREE.CylinderGeometry(0.12, 0.14, 0.16, 6), skin, [0, 0.84, 0]);
  const head = addMesh(hip, new THREE.IcosahedronGeometry(0.28, 1), skin, [0, 1.08, 0]);
  head.scale.set(0.94, 1.08, 0.94);
  const nose = addMesh(hip, new THREE.ConeGeometry(0.07, 0.16, 4), skin, [0, 1.06, 0.28], [Math.PI / 2, 0, 0]);
  const hairCap = addMesh(hip, new THREE.SphereGeometry(0.29, 7, 5, 0, Math.PI * 2, 0, Math.PI * 0.52), hair, [0, 1.17, -0.02]);
  hairCap.scale.set(0.98, 0.65, 0.98);
  const hat = new THREE.Group();
  if (variant % 2 === 0) {
    const brim = addMesh(hat, new THREE.CylinderGeometry(0.48, 0.48, 0.06, 10), accent, [0, 1.28, 0]);
    const crown = addMesh(hat, new THREE.CylinderGeometry(0.25, 0.32, 0.3, 8), accent, [0, 1.45, 0]);
    crown.scale.y = 0.8;
  } else {
    addMesh(hat, new THREE.BoxGeometry(0.58, 0.12, 0.6), accent, [0, 1.26, 0]);
  }
  hip.add(hat);

  const leftArm = new THREE.Group();
  leftArm.position.set(-0.4, 0.66, 0);
  hip.add(leftArm);
  addMesh(leftArm, new THREE.BoxGeometry(0.14, 0.6, 0.14), skin, [0, -0.28, 0]);
  const rightArm = new THREE.Group();
  rightArm.position.set(0.4, 0.66, 0);
  hip.add(rightArm);
  addMesh(rightArm, new THREE.BoxGeometry(0.14, 0.6, 0.14), skin, [0, -0.28, 0]);

  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.18, 0.82, 0);
  group.add(leftLeg);
  addMesh(leftLeg, new THREE.BoxGeometry(0.2, 0.78, 0.22), shorts, [0, -0.4, 0]);
  addMesh(leftLeg, new THREE.BoxGeometry(0.22, 0.1, 0.34), shoe, [0, -0.85, 0.07]);
  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.18, 0.82, 0);
  group.add(rightLeg);
  addMesh(rightLeg, new THREE.BoxGeometry(0.2, 0.78, 0.22), shorts, [0, -0.4, 0]);
  addMesh(rightLeg, new THREE.BoxGeometry(0.22, 0.1, 0.34), shoe, [0, -0.85, 0.07]);

  group.userData.parts = { hip, torso, belly, head, hat, leftArm, rightArm, leftLeg, rightLeg, shadow };
  group.userData.walkPhase = variant * 1.7;
  group.userData.state = 'idle';
  return group;
}
