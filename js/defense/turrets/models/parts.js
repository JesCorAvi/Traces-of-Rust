// Piezas compartidas de la tecnología de playa: cocos, bambú, hojas, cuerdas
// y anillos de energía. Reutiliza geometrías para no inflar la VRAM.
// Exports: addCoconut, addPalmLeaf, addBambooPole, addRopeBand, addEnergyRing,
//          addShellDish, addGlowPearl.

import * as THREE from 'three';

const COCONUT_GEO = new THREE.SphereGeometry(1, 8, 6);
const ROPE_GEO = new THREE.TorusGeometry(1, 0.09, 5, 12);
const LEAF_GEO = new THREE.ConeGeometry(1, 1, 4, 1);
const BAMBOO_GEO = new THREE.CylinderGeometry(1, 0.88, 1, 6, 1);
const SHELL_GEO = new THREE.SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55);
const PEARL_GEO = new THREE.IcosahedronGeometry(1, 1);

[COCONUT_GEO, ROPE_GEO, LEAF_GEO, BAMBOO_GEO, SHELL_GEO, PEARL_GEO].forEach(geo => {
  geo.userData = { sharedGeo: true };
});

function attach(turret, object, parent = null) {
  (parent || turret.modelRoot).add(object);
  return object;
}

function shade(obj) {
  obj.castShadow = true;
  obj.receiveShadow = true;
  return obj;
}

/** Coco de tecnología isleña: cáscara, fibras y una banda de energía. */
export function addCoconut(turret, x, y, z, radius = 0.18, opts = {}) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.set(opts.rx || 0, opts.ry || 0, opts.rz || 0);

  const shell = shade(new THREE.Mesh(COCONUT_GEO, turret.coconutMat));
  shell.scale.setScalar(radius);
  group.add(shell);

  const bandA = shade(new THREE.Mesh(ROPE_GEO, turret.ropeMat));
  bandA.rotation.x = Math.PI / 2;
  bandA.scale.setScalar(radius * 1.02);
  group.add(bandA);

  const bandB = shade(new THREE.Mesh(ROPE_GEO, turret.ropeMat));
  bandB.rotation.z = Math.PI / 2;
  bandB.scale.setScalar(radius * 0.92);
  group.add(bandB);

  if (opts.glow !== false) {
    const seam = new THREE.Mesh(ROPE_GEO, turret.glowMat);
    seam.rotation.x = Math.PI / 2;
    seam.scale.setScalar(radius * 0.74);
    seam.position.y = radius * 0.22;
    group.add(seam);
  }
  return attach(turret, group, opts.parent || null);
}

/** Hoja de palma cónica, útil para coronas, aspas y techos. */
export function addPalmLeaf(turret, x, y, z, opts = {}) {
  const mesh = new THREE.Mesh(LEAF_GEO, opts.light ? turret.leafLightMat : turret.leafMat);
  mesh.position.set(x, y, z);
  mesh.scale.set(opts.sx ?? 0.18, opts.sy ?? 0.8, opts.sz ?? 0.18);
  mesh.rotation.set(opts.rx || 0, opts.ry || 0, opts.rz || 0);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return attach(turret, mesh, opts.parent || null);
}

/** Tramo de bambú entre dos puntos locales. */
export function addBambooPole(turret, ax, ay, az, bx, by, bz, radius = 0.07, opts = {}) {
  const start = new THREE.Vector3(ax, ay, az);
  const end = new THREE.Vector3(bx, by, bz);
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  if (length < 0.001) return null;
  const mesh = new THREE.Mesh(BAMBOO_GEO, opts.material || turret.bambooMat);
  mesh.position.copy(start).lerp(end, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.scale.set(radius, length, radius);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return attach(turret, mesh, opts.parent || null);
}

export function addRopeBand(turret, x, y, z, radius = 0.2, opts = {}) {
  const mesh = new THREE.Mesh(ROPE_GEO, turret.ropeMat);
  mesh.position.set(x, y, z);
  mesh.rotation.set(opts.rx || 0, opts.ry || 0, opts.rz || 0);
  mesh.scale.setScalar(radius);
  mesh.castShadow = true;
  return attach(turret, mesh, opts.parent || null);
}

export function addEnergyRing(turret, x, y, z, radius = 0.25, opts = {}) {
  const mesh = new THREE.Mesh(ROPE_GEO, turret.glowMat);
  mesh.position.set(x, y, z);
  mesh.rotation.set(opts.rx || 0, opts.ry || 0, opts.rz || 0);
  mesh.scale.setScalar(radius);
  return attach(turret, mesh, opts.parent || null);
}

/** Media concha / pala de coral con acabado nacarado. */
export function addShellDish(turret, x, y, z, opts = {}) {
  const material = opts.glow ? turret.glowMat : (opts.shellMaterial || turret.shellMat);
  const mesh = new THREE.Mesh(SHELL_GEO, material);
  mesh.position.set(x, y, z);
  mesh.scale.set(opts.sx ?? 0.4, opts.sy ?? 0.18, opts.sz ?? 0.4);
  mesh.rotation.set(opts.rx || 0, opts.ry || 0, opts.rz || 0);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return attach(turret, mesh, opts.parent || null);
}

export function addGlowPearl(turret, x, y, z, radius = 0.14, opts = {}) {
  const mesh = new THREE.Mesh(PEARL_GEO, opts.material || turret.glowMat);
  mesh.position.set(x, y, z);
  mesh.scale.setScalar(radius);
  return attach(turret, mesh, opts.parent || null);
}
