import * as THREE from 'three';
import { SpriteSheets } from './spritesheets.js';

export function createWorld() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x040604);
  scene.fog = new THREE.FogExp2(0x040604, 0.038);

  const ambientLight = new THREE.AmbientLight(0x1e281d, 0.65);
  scene.add(ambientLight);

  const groundMat = new THREE.MeshStandardMaterial({
    map: SpriteSheets.env.ground.tex,
    bumpMap: SpriteSheets.env.ground.tex,
    bumpScale: 0.08,
    roughness: 0.92,
    metalness: 0.15
  });
  const crateMat = new THREE.MeshStandardMaterial({
    map: SpriteSheets.env.crate.tex,
    roughness: 0.88,
    metalness: 0.25
  });
  const metalMat = new THREE.MeshStandardMaterial({
    map: SpriteSheets.env.metal.tex,
    roughness: 0.78,
    metalness: 0.45
  });
  const barrelMat = new THREE.MeshStandardMaterial({
    color: 0x5c2618,
    roughness: 0.75,
    metalness: 0.4,
    flatShading: true
  });

  // Suelo base impenetrable en cota y = 0.0m (Ninguna colisión baja de y = 0 para evitar atravesar el suelo)
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const walkableBoxes = [];
  const ramps = [];
  const cylinders = [];

  function addBoxMesh(cx, cy, cz, sx, sy, sz, mat, registerPhysics = true) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
    m.position.set(cx, cy, cz);
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    if (registerPhysics) {
      walkableBoxes.push({
        minX: cx - sx / 2, maxX: cx + sx / 2,
        minZ: cz - sz / 2, maxZ: cz + sz / 2,
        bottomY: cy - sy / 2, topY: cy + sy / 2
      });
    }
    return m;
  }

  // Rampas con alineación geométrica exacta entre la cara superior del Mesh y la física
  function addRamp(cx, cz, width, length, axis, startY, endY) {
    const dy = endY - startY;
    const hyp = Math.hypot(length, dy);
    const angle = Math.atan2(dy, length);
    const thickness = 0.24;
    const sx = axis === 'z' ? width : hyp;
    const sz = axis === 'z' ? hyp : width;

    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, thickness, sz), metalMat);
    // Desplazamos el centro de la caja hacia abajo exactamente (thickness / 2) * cos(angle)
    // para que la cara superior de la rampa coincida al milímetro con la recta startY -> endY
    const centerY = (startY + endY) * 0.5 - (thickness * 0.5) * Math.cos(angle);
    mesh.position.set(cx, centerY, cz);
    if (axis === 'z') mesh.rotation.x = -angle;
    else mesh.rotation.z = angle;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    ramps.push({
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

  // 2. Fosos de contención acotados (Suelo del foso en y = 0.0m rodeado por diques de y = 1.1m con rampas)
  const basinCoords = [
    { x: -15, z: -8 },
    { x: 16, z: -10 }
  ];
  basinCoords.forEach(b => {
    const rimH = 1.1;
    // Muros/diques transitables alrededor del foso dejando el patio central hundido en cota 0.0m
    addBoxMesh(b.x, rimH / 2, b.z - 5.0, 10.0, rimH, 2.0, metalMat, true); // Norte
    addBoxMesh(b.x - 5.0, rimH / 2, b.z, 2.0, rimH, 8.0, metalMat, true);  // Oeste
    addBoxMesh(b.x + 5.0, rimH / 2, b.z, 2.0, rimH, 8.0, metalMat, true);  // Este
    // Rampa de acceso sur para subir al dique y bajar al patio interior sin atravesar nunca el suelo
    addRamp(b.x, b.z + 4.5, 4.5, 3.6, 'z', 0, rimH);
  });

  // 3. Cajas y Contenedores (InstancedMesh)
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
    if (Math.hypot(cx, cz) < 8) continue;
    // Evitar solapar con las zonas de los diques
    if (Math.hypot(cx + 15, cz + 8) < 8 || Math.hypot(cx - 16, cz + 10) < 8) continue;

    dummy.position.set(cx, 0.7, cz);
    dummy.updateMatrix();
    crateInst.setMatrixAt(cIdx++, dummy.matrix);
    walkableBoxes.push({ minX: cx - 1, maxX: cx + 1, minZ: cz - 1, maxZ: cz + 1, bottomY: 0, topY: 1.4 });

    if (i % 2 === 0 && cIdx < 118) {
      addBoxMesh(cx + 1.8, 0.35, cz, 1.6, 0.7, 1.8, crateMat, true);
    }
    if (i % 3 === 0 && cIdx < 119) {
      dummy.position.set(cx, 2.1, cz);
      dummy.updateMatrix();
      crateInst.setMatrixAt(cIdx++, dummy.matrix);
      walkableBoxes[walkableBoxes.length - 1].topY = 2.8;
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
    if (Math.hypot(bx, bz) < 9) continue;
    if (Math.hypot(bx + 15, bz + 8) < 8 || Math.hypot(bx - 16, bz + 10) < 8) continue;
    dummy.position.set(bx, 0.675, bz);
    dummy.updateMatrix();
    barrelInst.setMatrixAt(bIdx++, dummy.matrix);
    cylinders.push({ x: bx, z: bz, r: 0.65, topY: 1.35 });
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

  // Lámparas cenitales industriales
  const ceilingLights = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const r = 18 + (i % 2) * 20;
    const light = new THREE.PointLight(0xb89c46, 36, 30, 1.7);
    light.position.set(Math.cos(angle) * r, 6.6, Math.sin(angle) * r);
    scene.add(light);
    ceilingLights.push({ light, baseIntensity: 36 });
  }

  // Pilares oxidados como Billboards
  const propBillboards = [];
  const pillarMat = new THREE.MeshStandardMaterial({
    map: SpriteSheets.env.pillar.tex,
    alphaTest: 0.5,
    transparent: true,
    roughness: 0.9,
    side: THREE.DoubleSide
  });
  for (let i = 0; i < 85; i++) {
    const x = (Math.random() - 0.5) * 200;
    const z = (Math.random() - 0.5) * 200;
    if (Math.hypot(x, z) < 16) continue;
    const h = 5.2 + Math.random() * 1.8;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.7, h), pillarMat);
    mesh.position.set(x, h / 2, z);
    mesh.castShadow = true;
    scene.add(mesh);
    propBillboards.push(mesh);
  }

  const worldPhysics = {
    getGroundHeight(x, z, currentY = 0) {
      let h = 0; // Cota mínima garantizada en 0.0m (nunca atraviesa el suelo principal)

      // 1. Rampas inclinadas con margen anticolisión (+0.03m)
      for (const r of ramps) {
        if (x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ) {
          const t = r.axis === 'z'
            ? 1 - (z - r.minZ) / (r.maxZ - r.minZ)
            : (x - r.minX) / (r.maxX - r.minX);
          const rampY = r.startY + Math.max(0, Math.min(1, t)) * (r.endY - r.startY) + 0.03;
          if (rampY > h) h = rampY;
        }
      }

      // 2. Plataformas, diques, escalones y cajas
      const stepTolerance = 0.82;
      for (const b of walkableBoxes) {
        if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) {
          if (currentY + stepTolerance >= b.topY && b.topY + 0.02 > h) {
            h = b.topY + 0.02;
          }
        }
      }
      return h;
    },

    resolveCollision(pos, radius = 0.55, currentY = 0) {
      const stepTolerance = 0.82;
      for (const b of walkableBoxes) {
        if (currentY + stepTolerance >= b.topY) continue;
        const closestX = Math.max(b.minX, Math.min(pos.x, b.maxX));
        const closestZ = Math.max(b.minZ, Math.min(pos.z, b.maxZ));
        const dx = pos.x - closestX;
        const dz = pos.z - closestZ;
        const distSq = dx * dx + dz * dz;
        if (distSq < radius * radius) {
          const dist = Math.sqrt(distSq) || 0.001;
          const overlap = radius - dist;
          pos.x += (dx / dist) * overlap;
          pos.z += (dz / dist) * overlap;
        }
      }
      for (const c of cylinders) {
        if (currentY + stepTolerance >= c.topY) continue;
        const dx = pos.x - c.x;
        const dz = pos.z - c.z;
        const minDist = radius + c.r;
        const distSq = dx * dx + dz * dz;
        if (distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq) || 0.001;
          const overlap = minDist - dist;
          pos.x += (dx / dist) * overlap;
          pos.z += (dz / dist) * overlap;
        }
      }
    }
  };

  // Polvo industrial
  const dustGeo = new THREE.BufferGeometry();
  const dustPts = new Float32Array(500 * 3);
  for (let i = 0; i < 500; i++) {
    dustPts[i * 3] = (Math.random() - 0.5) * 80;
    dustPts[i * 3 + 1] = Math.random() * 6;
    dustPts[i * 3 + 2] = (Math.random() - 0.5) * 80;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPts, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({ color: 0x877a5c, size: 0.12, transparent: true, opacity: 0.45 })
  );
  scene.add(dust);

  return { scene, ambientLight, propBillboards, ceilingLights, dust, worldPhysics };
}