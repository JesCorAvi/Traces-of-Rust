// Geometría industrial: plataformas, fosos, cajas, barriles y tuberías.
// Exports: buildWorldGeometry.

import * as THREE from 'three';
import { isNearDefenseRouteOrSpawn } from './routeClearance.js';

export function buildWorldGeometry(scene, materials, physics) {
  const { metalMat, crateMat, barrelMat } = materials;

  function addBoxMesh(cx, cy, cz, sx, sy, sz, mat, registerPhysics = true) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
    m.position.set(cx, cy, cz);
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    if (registerPhysics) {
      physics.addWalkableBox({
        minX: cx - sx / 2, maxX: cx + sx / 2,
        minZ: cz - sz / 2, maxZ: cz + sz / 2,
        bottomY: cy - sy / 2, topY: cy + sy / 2
      });
    }
    return m;
  }

  function addRamp(cx, cz, width, length, axis, startY, endY) {
    const dy = endY - startY;
    const hyp = Math.hypot(length, dy);
    const angle = Math.atan2(dy, length);
    const thickness = 0.24;
    const sx = axis === 'z' ? width : hyp;
    const sz = axis === 'z' ? hyp : width;

    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, thickness, sz), metalMat);
    const centerY = (startY + endY) * 0.5 - (thickness * 0.5) * Math.cos(angle);
    mesh.position.set(cx, centerY, cz);
    // El extremo alto debe quedar en minZ (lado plataforma), igual que getGroundHeight.
    // Con -angle la rampa visual quedaba espejada y el jugador la atravesaba.
    if (axis === 'z') mesh.rotation.x = angle;
    else mesh.rotation.z = angle;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    physics.addRamp({
      minX: cx - (axis === 'z' ? width / 2 : length / 2),
      maxX: cx + (axis === 'z' ? width / 2 : length / 2),
      minZ: cz - (axis === 'z' ? length / 2 : width / 2),
      maxZ: cz + (axis === 'z' ? length / 2 : width / 2),
      axis, startY, endY
    });
  }

  // 1. Plataformas industriales principales con rampas y escalones
  const platformCenters = [
    { x: 0, z: -20, w: 14, d: 10, h: 2.0 },
    { x: 24, z: 10, w: 12, d: 14, h: 2.2 },
    { x: -24, z: 12, w: 14, d: 12, h: 1.8 },
    { x: 0, z: 28, w: 18, d: 10, h: 2.4 },
    { x: -32, z: -26, w: 14, d: 14, h: 2.2 },
    { x: 34, z: -28, w: 14, d: 14, h: 2.2 }
  ];

  platformCenters.forEach(p => {
    addBoxMesh(p.x, p.h / 2, p.z, p.w, p.h, p.d, metalMat, true);
    addRamp(p.x, p.z + p.d / 2 + 3.0, 4.2, 6.0, 'z', 0, p.h);
    const steps = 4;
    for (let s = 1; s <= steps; s++) {
      const sh = (p.h / steps) * s;
      addBoxMesh(p.x, sh / 2, p.z - p.d / 2 - (steps - s + 0.5) * 1.1, 4.0, sh, 1.1, crateMat, true);
    }
  });

  // 2. Fosos de contención acotados
  const basinCoords = [
    { x: -15, z: -8 },
    { x: 16, z: -10 }
  ];
  basinCoords.forEach(b => {
    const rimH = 1.1;
    addBoxMesh(b.x, rimH / 2, b.z - 5.0, 10.0, rimH, 2.0, metalMat, true);
    addBoxMesh(b.x - 5.0, rimH / 2, b.z, 2.0, rimH, 8.0, metalMat, true);
    addBoxMesh(b.x + 5.0, rimH / 2, b.z, 2.0, rimH, 8.0, metalMat, true);
    addRamp(b.x, b.z + 4.5, 4.5, 3.6, 'z', 0, rimH);
  });

  // 3. Cajas y Contenedores (InstancedMesh) respetando la plaza central y los caminos
  const crateGeo = new THREE.BoxGeometry(2.0, 1.4, 2.0);
  const crateInst = new THREE.InstancedMesh(crateGeo, crateMat, 120);
  crateInst.castShadow = true;
  crateInst.receiveShadow = true;
  const dummy = new THREE.Object3D();
  let cIdx = 0;

  for (let i = 0; i < 55; i++) {
    const angle = (i / 55) * Math.PI * 2 + (i % 3) * 0.4;
    const dist = 11 + (i * 2.1) % 68;
    const cx = Math.round(Math.cos(angle) * dist);
    const cz = Math.round(Math.sin(angle) * dist);
    if (Math.hypot(cx, cz) < 9.5) continue;
    if (Math.hypot(cx + 15, cz + 8) < 8 || Math.hypot(cx - 16, cz + 10) < 8) continue;
    if (isNearDefenseRouteOrSpawn(cx, cz)) continue;

    dummy.position.set(cx, 0.7, cz);
    dummy.updateMatrix();
    crateInst.setMatrixAt(cIdx++, dummy.matrix);
    const crateBox = { minX: cx - 1, maxX: cx + 1, minZ: cz - 1, maxZ: cz + 1, bottomY: 0, topY: 1.4 };
    physics.addWalkableBox(crateBox);

    if (i % 2 === 0 && cIdx < 118 && !isNearDefenseRouteOrSpawn(cx + 1.8, cz)) {
      addBoxMesh(cx + 1.8, 0.35, cz, 1.6, 0.7, 1.8, crateMat, true);
    }
    if (i % 3 === 0 && cIdx < 119) {
      dummy.position.set(cx, 2.1, cz);
      dummy.updateMatrix();
      crateInst.setMatrixAt(cIdx++, dummy.matrix);
      crateBox.topY = 2.8;
    }
  }
  crateInst.count = cIdx;
  scene.add(crateInst);

  // 4. Barriles oxidados (InstancedMesh)
  const barrelGeo = new THREE.CylinderGeometry(0.55, 0.55, 1.35, 8);
  const barrelInst = new THREE.InstancedMesh(barrelGeo, barrelMat, 70);
  barrelInst.castShadow = true;
  barrelInst.receiveShadow = true;
  let bIdx = 0;
  for (let i = 0; i < 70; i++) {
    const bx = (Math.random() - 0.5) * 140;
    const bz = (Math.random() - 0.5) * 140;
    if (Math.hypot(bx, bz) < 9.5) continue;
    if (Math.hypot(bx + 15, bz + 8) < 8 || Math.hypot(bx - 16, bz + 10) < 8) continue;
    if (isNearDefenseRouteOrSpawn(bx, bz)) continue;

    dummy.position.set(bx, 0.675, bz);
    dummy.updateMatrix();
    barrelInst.setMatrixAt(bIdx++, dummy.matrix);
    physics.addCylinder({ x: bx, z: bz, r: 0.65, topY: 1.35 });
  }
  barrelInst.count = bIdx;
  scene.add(barrelInst);

  // Tuberías aéreas
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue;
    const pipe = new THREE.Mesh(new THREE.BoxGeometry(120, 0.45, 0.6), metalMat);
    pipe.position.set(0, 6.8, i * 16);
    pipe.castShadow = true;
    scene.add(pipe);
  }
}
