// Vegetación y decoración de playa: palmeras instanciadas, matorrales,
// rocas, troncos, sombrillas y toallas. Todo procedural y anclado a las dunas.
// Exports: buildWorldProps.

import * as THREE from 'three';
import { isNearDefenseRouteOrSpawn } from './routeClearance.js';
import { isInIslandWorldExclusion } from '../config/chiringuito/island.js';
import { terrainHeightAt, TERRAIN } from './terrain.js';

const PALM_COUNT = 42;
const PALM_FRONDS = 9;
const MAX_PALM_SEGMENTS = 3;

function createFrondGeometry() {
  const positions = [];
  const length = 3.1;
  const segments = 11;

  const pushTri = (a, b, c) => {
    positions.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
  };

  for (let i = 0; i < segments; i++) {
    const t0 = i / segments;
    const t1 = (i + 1) / segments;
    const z0 = t0 * length;
    const z1 = t1 * length;
    const y0 = -Math.pow(t0, 1.55) * 1.15;
    const y1 = -Math.pow(t1, 1.55) * 1.15;
    const w0 = Math.sin(Math.PI * t0) * 0.48 * (i % 2 === 0 ? 1.0 : 0.72);
    const w1 = Math.sin(Math.PI * t1) * 0.48 * (i % 2 === 0 ? 0.72 : 1.0);

    // Lámina central de la fronda.
    pushTri([-0.045, y0, z0], [0.045, y0, z0], [0, y1, z1]);

    // Foliolos alternos a ambos lados (aspecto de palmera pixel-art 3D).
    const sway = (i % 3) * 0.045;
    pushTri([-0.04, y0, z0], [-w0, y0 - 0.04 - sway, z0 - 0.16], [0, y1, z1]);
    pushTri([0.04, y0, z0], [w0, y0 - 0.04 - sway, z0 - 0.16], [0, y1, z1]);
    if (i > 1 && i < segments - 2) {
      pushTri([-w0 * 0.65, y0 - 0.03, z0 - 0.05], [-w0 * 1.05, y0 - 0.12, z0 - 0.42], [0, y1, z1]);
      pushTri([w0 * 0.65, y0 - 0.03, z0 - 0.05], [w0 * 1.05, y0 - 0.12, z0 - 0.42], [0, y1, z1]);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return geo;
}

function createGrassGeometry() {
  const positions = [];
  for (let b = 0; b < 5; b++) {
    const a = (b / 5) * Math.PI * 2 + 0.3;
    const bx = Math.cos(a) * 0.12;
    const bz = Math.sin(a) * 0.12;
    const h = 0.45 + (b % 3) * 0.18;
    const leanX = Math.cos(a) * 0.32;
    const leanZ = Math.sin(a) * 0.32;
    positions.push(
      bx - 0.045, 0, bz,
      bx + 0.045, 0, bz,
      bx + leanX, h, bz + leanZ
    );
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return geo;
}

function pickPalmSpots() {
  const spots = [];
  let guard = 0;
  while (spots.length < PALM_COUNT && guard++ < 1200) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 16 + Math.pow(Math.random(), 0.72) * 112;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius + 5;
    if (z < -50) continue;
    if (Math.hypot(x, z) < 12) continue;
    if (isInIslandWorldExclusion(x, z)) continue;
    if (isNearDefenseRouteOrSpawn(x, z, 1.9)) continue;
    if (spots.some(s => Math.hypot(s.x - x, s.z - z) < 5.2)) continue;
    spots.push({ x, z, ground: terrainHeightAt(x, z) });
  }
  return spots;
}

function buildPalms(scene, materials) {
  const spots = pickPalmSpots();
  // Palmeras de encuadre cerca del campamento (sin colisión para no cortar rutas).
  for (const [x, z] of [[-18, -7], [19, 8], [-24, 14], [24, -10], [-16, 23], [17, 26]]) {
    if (isNearDefenseRouteOrSpawn(x, z, 1.4)) continue;
    if (spots.some(s => Math.hypot(s.x - x, s.z - z) < 3.5)) continue;
    spots.push({ x, z, ground: terrainHeightAt(x, z) });
  }
  if (!spots.length) return;

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.32, 2.25, 6, 1);
  const trunkMesh = new THREE.InstancedMesh(trunkGeo, materials.palmTrunkMat, spots.length * MAX_PALM_SEGMENTS);
  trunkMesh.castShadow = true;
  trunkMesh.receiveShadow = true;

  const frondGeo = createFrondGeometry();
  const frondMesh = new THREE.InstancedMesh(frondGeo, materials.palmLeafMat, spots.length * PALM_FRONDS);
  frondMesh.castShadow = true;
  frondMesh.receiveShadow = false;

  let trunkIdx = 0;
  let frondIdx = 0;

  spots.forEach((spot, palmIdx) => {
    const heightScale = 0.82 + Math.random() * 0.42;
    const leanX = (Math.random() - 0.5) * 0.75;
    const leanZ = (Math.random() - 0.5) * 0.75;
    const topX = spot.x + leanX * 0.85;
    const topZ = spot.z + leanZ * 0.85;
    const topY = spot.ground + 6.35 * heightScale;

    for (let s = 0; s < MAX_PALM_SEGMENTS; s++) {
      const t = (s + 0.5) / MAX_PALM_SEGMENTS;
      dummy.position.set(
        spot.x + leanX * t * t,
        spot.ground + (s * 2.0 + 1.0) * heightScale,
        spot.z + leanZ * t * t
      );
      dummy.rotation.set(leanZ * 0.05 * (s + 1), palmIdx * 0.7, -leanX * 0.05 * (s + 1));
      dummy.scale.set(1 + s * 0.01, heightScale * 0.96, 1 + s * 0.01);
      dummy.updateMatrix();
      trunkMesh.setMatrixAt(trunkIdx, dummy.matrix);
      color.setHSL(0.075, 0.38, 0.31 + Math.random() * 0.06);
      trunkMesh.setColorAt(trunkIdx, color);
      trunkIdx++;
    }

    for (let f = 0; f < PALM_FRONDS; f++) {
      const angle = (f / PALM_FRONDS) * Math.PI * 2 + palmIdx * 0.37;
      const droop = 0.22 + Math.random() * 0.25;
      dummy.position.set(topX, topY, topZ);
      dummy.rotation.set(droop, angle, (Math.random() - 0.5) * 0.12);
      dummy.scale.setScalar(0.82 + Math.random() * 0.35);
      dummy.updateMatrix();
      frondMesh.setMatrixAt(frondIdx, dummy.matrix);
      color.setHSL(0.31 + Math.random() * 0.05, 0.46 + Math.random() * 0.12, 0.3 + Math.random() * 0.1);
      frondMesh.setColorAt(frondIdx, color);
      frondIdx++;
    }
  });

  trunkMesh.count = trunkIdx;
  frondMesh.count = frondIdx;
  trunkMesh.instanceMatrix.needsUpdate = true;
  frondMesh.instanceMatrix.needsUpdate = true;
  if (trunkMesh.instanceColor) trunkMesh.instanceColor.needsUpdate = true;
  if (frondMesh.instanceColor) frondMesh.instanceColor.needsUpdate = true;
  scene.add(trunkMesh, frondMesh);

  // Cocos bajo algunas palmeras.
  const nutGeo = new THREE.IcosahedronGeometry(0.22, 0);
  const nutMesh = new THREE.InstancedMesh(nutGeo, materials.barrelMat, Math.min(40, spots.length * 2));
  nutMesh.castShadow = true;
  let nutIdx = 0;
  spots.forEach((spot, i) => {
    if (i % 2 !== 0) return;
    for (let n = 0; n < 2 && nutIdx < nutMesh.count; n++) {
      dummy.position.set(spot.x + (Math.random() - 0.5) * 1.4, spot.ground + 0.18, spot.z + (Math.random() - 0.5) * 1.4);
      dummy.rotation.set(Math.random(), Math.random(), Math.random());
      dummy.scale.setScalar(0.8 + Math.random() * 0.35);
      dummy.updateMatrix();
      nutMesh.setMatrixAt(nutIdx++, dummy.matrix);
    }
  });
  nutMesh.count = nutIdx;
  scene.add(nutMesh);
}

function buildGrassAndRocks(scene, materials, physics) {
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  const grassGeo = createGrassGeometry();
  const grassMesh = new THREE.InstancedMesh(grassGeo, materials.grassMat, 320);
  grassMesh.receiveShadow = true;
  let gIdx = 0;
  for (let i = 0; i < 500 && gIdx < 320; i++) {
    const x = (Math.random() - 0.5) * 210;
    const z = (Math.random() - 0.5) * 180 + 8;
    if (z < -48) continue;
    if (Math.hypot(x, z) < 7) continue;
    if (isInIslandWorldExclusion(x, z)) continue;
    if (isNearDefenseRouteOrSpawn(x, z, 1.2)) continue;
    const y = terrainHeightAt(x, z);
    dummy.position.set(x, y + 0.02, z);
    dummy.rotation.set(0, Math.random() * Math.PI, 0);
    dummy.scale.set(0.65 + Math.random() * 0.9, 0.55 + Math.random() * 1.25, 0.65 + Math.random() * 0.9);
    dummy.updateMatrix();
    grassMesh.setMatrixAt(gIdx, dummy.matrix);
    color.setHSL(0.22 + Math.random() * 0.08, 0.38 + Math.random() * 0.18, 0.34 + Math.random() * 0.14);
    grassMesh.setColorAt(gIdx, color);
    gIdx++;
  }
  grassMesh.count = gIdx;
  grassMesh.instanceMatrix.needsUpdate = true;
  scene.add(grassMesh);

  const rockGeo = new THREE.DodecahedronGeometry(0.75, 0);
  const rockMesh = new THREE.InstancedMesh(rockGeo, materials.rockMat, 90);
  rockMesh.castShadow = true;
  rockMesh.receiveShadow = true;
  let rIdx = 0;
  for (let i = 0; i < 140 && rIdx < 90; i++) {
    const x = (Math.random() - 0.5) * 180;
    const z = (Math.random() - 0.5) * 160 + 6;
    if (z < -58) continue;
    if (Math.hypot(x, z) < 8) continue;
    if (isInIslandWorldExclusion(x, z)) continue;
    if (isNearDefenseRouteOrSpawn(x, z, 2.8)) continue;
    const scale = 0.35 + Math.pow(Math.random(), 2.2) * 1.55;
    const y = terrainHeightAt(x, z);
    dummy.position.set(x, y + scale * 0.32, z);
    dummy.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.4);
    dummy.scale.set(scale * (0.8 + Math.random() * 0.7), scale * (0.5 + Math.random() * 0.5), scale);
    dummy.updateMatrix();
    rockMesh.setMatrixAt(rIdx, dummy.matrix);
    color.setHSL(0.06, 0.08 + Math.random() * 0.08, 0.38 + Math.random() * 0.15);
    rockMesh.setColorAt(rIdx, color);
    if (physics && scale > 1.2 && Math.hypot(x, z) < 88) {
      physics.addCylinder({ x, z, r: scale * 0.7, topY: y + scale * 0.8 });
    }
    rIdx++;
  }
  rockMesh.count = rIdx;
  rockMesh.instanceMatrix.needsUpdate = true;
  scene.add(rockMesh);

  // Troncos de deriva en la orilla.
  const logGeo = new THREE.CylinderGeometry(0.24, 0.34, 3.6, 7, 1);
  const logMesh = new THREE.InstancedMesh(logGeo, materials.driftwoodMat, 22);
  logMesh.castShadow = true;
  logMesh.receiveShadow = true;
  let lIdx = 0;
  for (let i = 0; i < 60 && lIdx < 22; i++) {
    const x = (Math.random() - 0.5) * 180;
    const z = -52 + Math.random() * 26;
    if (isInIslandWorldExclusion(x, z)) continue;
    if (isNearDefenseRouteOrSpawn(x, z, 2.8)) continue;
    const y = terrainHeightAt(x, z);
    dummy.position.set(x, y + 0.3, z);
    dummy.rotation.set(Math.PI / 2 + (Math.random() - 0.5) * 0.15, Math.random() * Math.PI, (Math.random() - 0.5) * 0.15);
    dummy.scale.set(0.65 + Math.random() * 0.75, 0.8 + Math.random() * 0.6, 0.65 + Math.random() * 0.75);
    dummy.updateMatrix();
    logMesh.setMatrixAt(lIdx, dummy.matrix);
    color.setHSL(0.08, 0.26, 0.42 + Math.random() * 0.12);
    logMesh.setColorAt(lIdx, color);
    lIdx++;
  }
  logMesh.count = lIdx;
  scene.add(logMesh);
}

function buildBeachFurniture(scene, materials) {
  const candidates = [
    { x: 12, z: 10, ry: -0.5 },
    { x: -11, z: 18, ry: 0.65 },
    { x: 16, z: -12, ry: 2.4 },
    { x: -17, z: -16, ry: -2.2 },
    { x: 9, z: 23, ry: 0.2 },
    { x: 64, z: -26, ry: -0.5 },
    { x: -68, z: -14, ry: 0.65 },
    { x: 58, z: 54, ry: 2.4 },
    { x: -61, z: 58, ry: -2.2 },
    { x: 82, z: 10, ry: 0.2 }
  ];

  const poleMat = materials.driftwoodMat;
  const baseCanopyGeo = new THREE.ConeGeometry(2.15, 0.7, 12, 1, true);

  candidates.forEach((spot, idx) => {
    if (isNearDefenseRouteOrSpawn(spot.x, spot.z, 1.4)) return;
    const y = terrainHeightAt(spot.x, spot.z);
    const group = new THREE.Group();
    group.position.set(spot.x, y, spot.z);
    group.rotation.y = spot.ry;

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.1, 6), poleMat);
    pole.position.y = 1.55;
    pole.castShadow = true;
    group.add(pole);

    const canopy = new THREE.Mesh(baseCanopyGeo, materials.fabricMat);
    canopy.position.y = 3.0;
    canopy.rotation.z = (idx % 2 === 0 ? 1 : -1) * 0.08;
    canopy.castShadow = true;
    group.add(canopy);

    const towel = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 2.6),
      new THREE.MeshStandardMaterial({ color: idx % 2 ? 0xf5c66d : 0xef8169, roughness: 1, side: THREE.DoubleSide })
    );
    towel.rotation.x = -Math.PI / 2;
    towel.rotation.z = 0.2 + idx * 0.3;
    towel.position.set(1.7, 0.03, 1.1);
    towel.receiveShadow = true;
    group.add(towel);

    const cooler = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.55, 0.55), materials.crateMat);
    cooler.position.set(2.7, 0.28, 0.4);
    cooler.castShadow = true;
    group.add(cooler);

    scene.add(group);
  });
}

export function buildWorldProps(scene, materials, physics = null) {
  const propBillboards = [];
  buildPalms(scene, materials);
  buildGrassAndRocks(scene, materials, physics);
  buildBeachFurniture(scene, materials);
  return propBillboards;
}
