// Estructuras de playa: puestos de madera, torre de vigilancia, muelle,
// hoguera, castillos de arena y cajas de provisiones.
// Exports: buildWorldGeometry.

import * as THREE from 'three';
import { isNearDefenseRouteOrSpawn } from './routeClearance.js';
import { isInIslandWorldExclusion } from '../config/chiringuito/island.js';
import { terrainHeightAt, TERRAIN } from './terrain.js';

export function buildWorldGeometry(scene, materials, physics) {
  const { woodMat, crateMat, barrelMat, thatchMat, fabricMat, driftwoodMat, ropeMat, rockMat } = materials;

  function addBoxMesh(cx, cy, cz, sx, sy, sz, mat, registerPhysics = true, isObstacle = false) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
    mesh.position.set(cx, cy, cz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    if (registerPhysics) {
      physics.addWalkableBox({
        minX: cx - sx / 2, maxX: cx + sx / 2,
        minZ: cz - sz / 2, maxZ: cz + sz / 2,
        bottomY: cy - sy / 2, topY: cy + sy / 2,
        isObstacle
      });
    }
    return mesh;
  }

  function maxGround(x, z, w, d) {
    return Math.max(
      terrainHeightAt(x - w / 2, z - d / 2),
      terrainHeightAt(x + w / 2, z - d / 2),
      terrainHeightAt(x - w / 2, z + d / 2),
      terrainHeightAt(x + w / 2, z + d / 2),
      terrainHeightAt(x, z)
    );
  }

  function pickSpot(candidates, clearance = 4.2) {
    for (const spot of candidates) {
      if (isInIslandWorldExclusion(spot.x, spot.z)) continue;
      if (!isNearDefenseRouteOrSpawn(spot.x, spot.z, clearance)) return spot;
    }
    return null;
  }

  function addSupportPost(x, z, topY, material = driftwoodMat) {
    const ground = terrainHeightAt(x, z);
    const height = Math.max(0.4, topY - ground);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, height, 6), material);
    post.position.set(x, ground + height / 2, z);
    post.castShadow = true;
    scene.add(post);
    physics.addCylinder({ x, z, r: 0.18, topY });
    return post;
  }

  // -------------------------------------------------------------------------
  // 1. Puesto de comida de la playa (referencia del campamento)
  // -------------------------------------------------------------------------
  const barSpot = pickSpot([
    { x: -54, z: 33 },
    { x: 56, z: 35 },
    { x: -47, z: -31 },
    { x: 48, z: -17 }
  ], 4.6);

  if (barSpot) {
    const baseY = maxGround(barSpot.x, barSpot.z, 7.2, 5.4) + 0.08;
    addBoxMesh(barSpot.x, baseY + 0.16, barSpot.z, 7.0, 0.32, 5.2, woodMat, true);

    // Mostrador y trastienda.
    addBoxMesh(barSpot.x, baseY + 1.02, barSpot.z - 1.9, 5.8, 1.45, 0.6, crateMat, false, true);
    addBoxMesh(barSpot.x - 2.2, baseY + 1.04, barSpot.z + 0.7, 1.3, 1.5, 2.6, crateMat, false, true);
    addBoxMesh(barSpot.x + 2.25, baseY + 0.75, barSpot.z + 1.2, 1.0, 0.9, 1.3, barrelMat, false, true);

    // Postes y techo de paja.
    const postY = baseY + 2.35;
    for (const [ox, oz] of [[-3.0, -2.1], [3.0, -2.1], [-3.0, 2.1], [3.0, 2.1]]) {
      addSupportPost(barSpot.x + ox, barSpot.z + oz, postY);
    }
    const roof = new THREE.Mesh(new THREE.ConeGeometry(5.4, 1.65, 8), thatchMat);
    roof.position.set(barSpot.x, baseY + 4.25, barSpot.z);
    roof.rotation.y = Math.PI / 8;
    roof.castShadow = true;
    roof.receiveShadow = true;
    scene.add(roof);

    const roofRim = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.2, 0.14, 8, 1, true), thatchMat);
    roofRim.position.set(barSpot.x, baseY + 3.48, barSpot.z);
    roofRim.rotation.y = Math.PI / 8;
    scene.add(roofRim);

    // Frutas del puesto: pequeñas esferas de colores vivos.
    const fruitGeo = new THREE.IcosahedronGeometry(0.18, 0);
    const fruitColors = [0xe94c3b, 0xffc44d, 0x77c74d, 0xff8b57, 0x8b58c9];
    for (let i = 0; i < 16; i++) {
      const fruit = new THREE.Mesh(fruitGeo, new THREE.MeshStandardMaterial({
        color: fruitColors[i % fruitColors.length], roughness: 0.75, flatShading: true
      }));
      fruit.position.set(
        barSpot.x - 2.5 + (i % 5) * 1.15,
        baseY + 1.86 + (i % 2) * 0.08,
        barSpot.z - 1.55 + Math.floor(i / 5) * 0.42
      );
      fruit.castShadow = true;
      scene.add(fruit);
    }

    // Banderines y guirnalda cálida.
    const lineMat = new THREE.LineBasicMaterial({ color: 0x4d2a1b });
    const points = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      points.push(new THREE.Vector3(
        barSpot.x - 3.4 + t * 6.8,
        baseY + 3.35 - Math.sin(t * Math.PI) * 0.55,
        barSpot.z + 2.16
      ));
    }
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), lineMat));

    const flagGeo = new THREE.ConeGeometry(0.18, 0.45, 4);
    const flagMats = [
      new THREE.MeshBasicMaterial({ color: 0xff7b62 }),
      new THREE.MeshBasicMaterial({ color: 0xffd06b }),
      new THREE.MeshBasicMaterial({ color: 0x61d9c7 })
    ];
    for (let i = 1; i < 10; i++) {
      const p = points[i];
      const flag = new THREE.Mesh(flagGeo, flagMats[i % flagMats.length]);
      flag.position.set(p.x, p.y - 0.3, p.z);
      flag.rotation.z = Math.PI;
      scene.add(flag);
    }

    const barLight = new THREE.PointLight(0xffa960, 9, 14, 1.6);
    barLight.position.set(barSpot.x, baseY + 3.1, barSpot.z);
    scene.add(barLight);
  }

  // -------------------------------------------------------------------------
  // 2. Torre de vigilancia de madera
  // -------------------------------------------------------------------------
  const towerSpot = pickSpot([
    { x: 53, z: -25 },
    { x: -55, z: -18 },
    { x: 47, z: 45 }
  ], 5.0);

  if (towerSpot) {
    const base = maxGround(towerSpot.x, towerSpot.z, 3.4, 3.4);
    const deckY = base + 4.25;
    for (const [ox, oz] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) {
      addSupportPost(towerSpot.x + ox, towerSpot.z + oz, deckY, woodMat);
    }
    addBoxMesh(towerSpot.x, deckY + 0.12, towerSpot.z, 3.2, 0.24, 3.2, woodMat, true);

    // Barandilla.
    for (const [ox, oz, sx, sz] of [[0, -1.5, 3.1, 0.1], [0, 1.5, 3.1, 0.1], [-1.5, 0, 0.1, 3.1], [1.5, 0, 0.1, 3.1]]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.65, sz), woodMat);
      rail.position.set(towerSpot.x + ox, deckY + 0.6, towerSpot.z + oz);
      rail.castShadow = true;
      scene.add(rail);
    }

    // Tejado de paja a cuatro aguas.
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.75, 1.35, 4), thatchMat);
    roof.position.set(towerSpot.x, deckY + 3.2, towerSpot.z);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    scene.add(roof);
    for (const [ox, oz] of [[-1.1, -1.1], [1.1, -1.1], [-1.1, 1.1], [1.1, 1.1]]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 2.5, 5), woodMat);
      p.position.set(towerSpot.x + ox, deckY + 1.25, towerSpot.z + oz);
      p.castShadow = true;
      scene.add(p);
    }

    // Bandera de salvamento.
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.4, 5), driftwoodMat);
    pole.position.set(towerSpot.x + 1.55, deckY + 2.1, towerSpot.z + 1.5);
    scene.add(pole);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.8), new THREE.MeshStandardMaterial({
      color: 0xe95543, roughness: 0.9, side: THREE.DoubleSide
    }));
    flag.position.set(towerSpot.x + 2.3, deckY + 2.8, towerSpot.z + 1.5);
    flag.rotation.y = -0.25;
    scene.add(flag);
  }

  // -------------------------------------------------------------------------
  // 3. Muelle de madera sobre el agua (decorativo y transitable)
  // -------------------------------------------------------------------------
  const pierX = -78;
  const pierStart = -38;
  const pierEnd = -112;
  const pierY = TERRAIN.waterY + 0.7;
  const segmentCount = 10;
  for (let i = 0; i < segmentCount; i++) {
    const z = pierStart + (i / (segmentCount - 1)) * (pierEnd - pierStart);
    const plank = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.18, 7.8), woodMat);
    plank.position.set(pierX, pierY, z);
    plank.castShadow = true;
    plank.receiveShadow = true;
    scene.add(plank);
    physics.addWalkableBox({
      minX: pierX - 2.2, maxX: pierX + 2.2,
      minZ: z - 3.9, maxZ: z + 3.9,
      bottomY: pierY - 0.09, topY: pierY + 0.09,
      isObstacle: false
    });
    if (i % 2 === 0) {
      for (const ox of [-2.0, 2.0]) {
        const h = 2.7;
        const support = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.17, h, 6), driftwoodMat);
        support.position.set(pierX + ox, TERRAIN.waterY - h / 2 + 0.75, z);
        scene.add(support);
      }
    }
  }
  // Farolillos del muelle.
  for (let i = 1; i < segmentCount; i += 3) {
    const z = pierStart + (i / (segmentCount - 1)) * (pierEnd - pierStart);
    const lamp = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), new THREE.MeshBasicMaterial({ color: 0xffc66e }));
    lamp.position.set(pierX + 1.85, pierY + 1.3, z);
    scene.add(lamp);
    if (i % 3 === 1) {
      const l = new THREE.PointLight(0xffb05c, 4, 9, 1.8);
      l.position.copy(lamp.position);
      scene.add(l);
    }
  }

  // -------------------------------------------------------------------------
  // 4. Hoguera, castillos de arena y provisiones dispersas
  // -------------------------------------------------------------------------
  const bonfireSpot = pickSpot([{ x: 34, z: 55 }, { x: -30, z: 55 }, { x: 57, z: 12 }], 4.0);
  if (bonfireSpot) {
    const y = terrainHeightAt(bonfireSpot.x, bonfireSpot.z);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32, 0), rockMat);
      stone.position.set(bonfireSpot.x + Math.cos(a) * 0.95, y + 0.16, bonfireSpot.z + Math.sin(a) * 0.95);
      stone.rotation.set(Math.random(), Math.random(), Math.random());
      stone.castShadow = true;
      scene.add(stone);
    }
    for (let i = 0; i < 4; i++) {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.5, 5), driftwoodMat);
      log.position.set(bonfireSpot.x, y + 0.35, bonfireSpot.z);
      log.rotation.set(Math.PI / 2.6, (i / 4) * Math.PI, 0);
      scene.add(log);
    }
    const ember = new THREE.Mesh(
      new THREE.ConeGeometry(0.42, 1.25, 6),
      new THREE.MeshBasicMaterial({ color: 0xff8b44, transparent: true, opacity: 0.85 })
    );
    ember.position.set(bonfireSpot.x, y + 0.95, bonfireSpot.z);
    scene.add(ember);
    const fireLight = new THREE.PointLight(0xff8a42, 8, 12, 1.7);
    fireLight.position.set(bonfireSpot.x, y + 1.1, bonfireSpot.z);
    scene.add(fireLight);
  }

  // Castillos de arena cerca de la orilla.
  const castleSpots = pickSpot([{ x: 28, z: -49 }, { x: -25, z: -47 }], 4.0);
  if (castleSpots) {
    const { x, z } = castleSpots;
    const y = terrainHeightAt(x, z);
    const sandCastleMat = new THREE.MeshStandardMaterial({ color: 0xd6a367, roughness: 1, flatShading: true });
    const baseTower = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.35, 0.8, 8), sandCastleMat);
    baseTower.position.set(x, y + 0.38, z);
    baseTower.castShadow = true;
    baseTower.receiveShadow = true;
    scene.add(baseTower);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.5, 1.55, 7), sandCastleMat);
      tower.position.set(x + Math.cos(a) * 0.95, y + 0.8, z + Math.sin(a) * 0.95);
      tower.castShadow = true;
      scene.add(tower);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.44, 0.65, 7), sandCastleMat);
      roof.position.set(tower.position.x, y + 1.72, tower.position.z);
      scene.add(roof);
    }
  }

  // Cajas, neveras y barriles repartidos sin invadir las rutas.
  const crateGeo = new THREE.BoxGeometry(1.45, 1.1, 1.15);
  const crateInst = new THREE.InstancedMesh(crateGeo, crateMat, 54);
  crateInst.castShadow = true;
  crateInst.receiveShadow = true;
  const dummy = new THREE.Object3D();
  let cIdx = 0;
  for (let i = 0; i < 180 && cIdx < 54; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 12 + Math.random() * 112;
    const cx = Math.cos(angle) * dist;
    const cz = Math.sin(angle) * dist + 5;
    if (cz < -44) continue;
    if (isInIslandWorldExclusion(cx, cz)) continue;
    if (Math.hypot(cx, cz) < 9) continue;
    if (isNearDefenseRouteOrSpawn(cx, cz, 3.8)) continue;
    const y = terrainHeightAt(cx, cz);
    dummy.position.set(cx, y + 0.55, cz);
    dummy.rotation.set(0, Math.random() * Math.PI, 0);
    dummy.scale.setScalar(0.8 + Math.random() * 0.55);
    dummy.updateMatrix();
    crateInst.setMatrixAt(cIdx++, dummy.matrix);
    physics.addWalkableBox({
      minX: cx - 0.75, maxX: cx + 0.75,
      minZ: cz - 0.6, maxZ: cz + 0.6,
      bottomY: y, topY: y + 1.1,
      isObstacle: true
    });
  }
  crateInst.count = cIdx;
  scene.add(crateInst);

  // Barriles de agua / tinas de hielo.
  const barrelGeo = new THREE.CylinderGeometry(0.48, 0.48, 1.1, 8);
  const barrelInst = new THREE.InstancedMesh(barrelGeo, barrelMat, 28);
  barrelInst.castShadow = true;
  barrelInst.receiveShadow = true;
  let bIdx = 0;
  for (let i = 0; i < 120 && bIdx < 28; i++) {
    const bx = (Math.random() - 0.5) * 190;
    const bz = (Math.random() - 0.5) * 150 + 8;
    if (bz < -42) continue;
    if (isInIslandWorldExclusion(bx, bz)) continue;
    if (Math.hypot(bx, bz) < 9.5) continue;
    if (isNearDefenseRouteOrSpawn(bx, bz, 3.6)) continue;
    const y = terrainHeightAt(bx, bz);
    dummy.position.set(bx, y + 0.55, bz);
    dummy.rotation.set(0, Math.random() * Math.PI, 0);
    dummy.scale.setScalar(0.8 + Math.random() * 0.4);
    dummy.updateMatrix();
    barrelInst.setMatrixAt(bIdx++, dummy.matrix);
    physics.addCylinder({ x: bx, z: bz, r: 0.56, topY: y + 1.1 });
  }
  barrelInst.count = bIdx;
  scene.add(barrelInst);

  // Cuerda enrollada y boyas junto al puesto, puro detalle costero.
  if (barSpot) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.12, 6, 14), ropeMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(barSpot.x + 3.7, maxGround(barSpot.x + 3.7, barSpot.z, 1, 1) + 0.12, barSpot.z + 2.4);
    scene.add(ring);
    const buoyMat = new THREE.MeshStandardMaterial({ color: 0xf05a45, roughness: 0.8 });
    for (let i = 0; i < 3; i++) {
      const buoy = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 0.55, 6), buoyMat);
      buoy.rotation.z = Math.PI / 2;
      buoy.position.set(barSpot.x - 2.9 + i * 0.5, maxGround(barSpot.x, barSpot.z, 1, 1) + 0.2, barSpot.z + 2.7 + (i % 2) * 0.3);
      scene.add(buoy);
    }
  }
}
