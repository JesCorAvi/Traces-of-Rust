// Ataques especiales telegrafiados de los bosses (hazards, proyectiles y wind-up).
// Exports: triggerBossSpecialAttack, spawnBossAttackTelegraph, spawnBossAttackDust.

import * as THREE from 'three';
import { AudioSys } from '../audio.js';
import { SHARED_GEO } from './shared.js';

// === ATAQUES ESPECIALES TELEGRAFIADOS DE LOS BOSSES ===
export function triggerBossSpecialAttack(scene, boss, attackType, playerPos, worldPhysics, hazards, projectiles, onSummon) {
  const bPos = boss.group.position.clone();
  const isP2 = boss.phase === 2;
  let durationSec = 0;
  AudioSys.play(115, 0.35, 'sawtooth', 0.08);

  if (attackType === 'cone_saw') {
    const dir = new THREE.Vector3().subVectors(playerPos, bPos).setY(0).normalize();
    const angle = Math.atan2(dir.x, dir.z);
    const radius = isP2 ? 8.5 : 6.8;
    const timer = isP2 ? 0.75 : 0.95;
    const geo = new THREE.CircleGeometry(radius, 18, -Math.PI * 0.28, Math.PI * 0.56);
    const mat = new THREE.MeshBasicMaterial({ color: 0xc42020, transparent: true, opacity: 0.45, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = angle - Math.PI / 2;
    mesh.position.set(bPos.x, bPos.y + 0.06, bPos.z);
    scene.add(mesh);

    hazards.push({
      type: 'cone', mesh, boss, origin: bPos.clone(), dir, radius, arc: 0.9,
      timer, maxTimer: timer, dmg: boss.dmg * 1.25
    });
    durationSec = Math.max(durationSec, timer);
  } else if (attackType === 'charge') {
    const dir = new THREE.Vector3().subVectors(playerPos, bPos).setY(0).normalize();
    const len = 14;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, len),
      new THREE.MeshBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = -Math.atan2(dir.x, dir.z);
    mesh.position.copy(bPos).addScaledVector(dir, len * 0.5).setY(bPos.y + 0.06);
    scene.add(mesh);

    hazards.push({
      type: 'charge_line', mesh, boss, dir,
      timer: 0.75, maxTimer: 0.75, dmg: 0
    });
    // 0.75 s de línea + 0.65 s de embestida real.
    durationSec = Math.max(durationSec, 1.4);
  } else if (attackType === 'shockwave') {
    const radius = isP2 ? 9.5 : 7.5;
    const timer = isP2 ? 0.85 : 1.05;
    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(0.4, radius, 24),
      new THREE.MeshBasicMaterial({ color: 0xc42020, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(bPos.x, bPos.y + 0.06, bPos.z);
    scene.add(mesh);

    hazards.push({
      type: 'circle', mesh, boss, center: bPos.clone(), radius,
      timer, maxTimer: timer, dmg: boss.dmg * 1.3
    });
    durationSec = Math.max(durationSec, timer);
  } else if (attackType === 'floor_bombs') {
    const count = isP2 ? 6 : 4;
    for (let i = 0; i < count; i++) {
      const offsetX = i === 0 ? 0 : (Math.random() - 0.5) * 11;
      const offsetZ = i === 0 ? 0 : (Math.random() - 0.5) * 11;
      const cx = playerPos.x + offsetX;
      const cz = playerPos.z + offsetZ;
      const cy = worldPhysics ? worldPhysics.getGroundHeight(cx, cz, playerPos.y) : 0;
      const radius = 2.6;
      const timer = 1.05 + i * 0.12;

      const mesh = new THREE.Mesh(
        new THREE.CircleGeometry(radius, 18),
        new THREE.MeshBasicMaterial({ color: 0xd9381e, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(cx, cy + 0.07, cz);
      scene.add(mesh);

      hazards.push({
        type: 'circle', mesh, boss, center: new THREE.Vector3(cx, cy, cz), radius,
        timer, maxTimer: timer, dmg: boss.dmg * 1.15
      });
      durationSec = Math.max(durationSec, timer);
    }
  } else if (attackType === 'radial_slag' || attackType === 'spiral_blades') {
    const count = isP2 ? 12 : 8;
    const baseAngle = Math.random() * Math.PI * 2;
    for (let i = 0; i < count; i++) {
      const a = baseAngle + (i / count) * Math.PI * 2;
      const dir = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
      const pMesh = new THREE.Mesh(
        SHARED_GEO.bossProj,
        new THREE.MeshBasicMaterial({ color: attackType === 'spiral_blades' ? 0xe6d7a5 : 0xff6611 })
      );
      pMesh.position.copy(bPos).add(new THREE.Vector3(0, 1.1, 0));
      scene.add(pMesh);
      projectiles.push({
        mesh: pMesh,
        boss,
        vel: dir.multiplyScalar(isP2 ? 10.5 : 8.2),
        life: 3.2,
        dmg: boss.dmg * 0.85
      });
    }
    durationSec = Math.max(durationSec, 0.6);
  } else if (attackType === 'summon') {
    if (onSummon) onSummon(isP2 ? 5 : 3);
    durationSec = Math.max(durationSec, 0.8);
  }

  return { attackType, durationSec };
}

// === WIND-UP CORPORAL (SOLO VISUAL, HOST/OFFLINE) ===
// No entra en bossHazards: el hitbox real sigue siendo triggerBossSpecialAttack.
// === POLVO / IMPACTO DE ATAQUE ===
// Feedback físico local (Host/offline): nube de polvo, anillo y humo lento.
export function spawnBossAttackDust(scene, origin, vfxList, opts = {}) {
  if (!scene || !origin || !Array.isArray(vfxList)) return;

  const count = Math.max(4, opts.count ?? 12);
  const power = opts.power ?? 3;
  const color = opts.color ?? 0x8a7a58;
  const baseY = origin.y + 0.04;
  const ring = opts.ring !== false;

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spread = 0.35 + Math.random() * 0.55;
    const life = 0.38 + Math.random() * 0.42;
    const size = 0.3 + Math.random() * 0.35;
    const geo = new THREE.PlaneGeometry(size, size);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).offsetHSL(0, 0, (Math.random() - 0.5) * 0.08),
      transparent: true,
      opacity: 0.5 + Math.random() * 0.2,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      origin.x + Math.cos(angle) * spread,
      baseY + Math.random() * 0.22,
      origin.z + Math.sin(angle) * spread
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = Math.random() * Math.PI;

    vfxList.push({
      mesh,
      disposeGeo: true,
      disposeMat: true,
      life,
      maxLife: life,
      baseOpacity: mat.opacity,
      vel: new THREE.Vector3(
        Math.cos(angle) * power * (0.55 + Math.random() * 0.7),
        1.1 + Math.random() * 2.1,
        Math.sin(angle) * power * (0.55 + Math.random() * 0.7)
      ),
      gravity: 5.2 + Math.random() * 2.4,
      floorY: baseY,
      fade: true,
      scaleSpeed: 1.8 + Math.random() * 2.2,
      spin: new THREE.Vector3(0, 0, (Math.random() - 0.5) * 5)
    });
  }

  // Humo más grande y lento para que el impacto se lea a distancia.
  for (let i = 0; i < 4; i++) {
    const angle = Math.random() * Math.PI * 2;
    const life = 0.55 + Math.random() * 0.35;
    const geo = new THREE.PlaneGeometry(0.8 + Math.random() * 0.5, 0.8 + Math.random() * 0.5);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).offsetHSL(0, 0, -0.06),
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      origin.x + Math.cos(angle) * 0.5,
      baseY + 0.25 + Math.random() * 0.35,
      origin.z + Math.sin(angle) * 0.5
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = Math.random() * Math.PI;

    vfxList.push({
      mesh,
      disposeGeo: true,
      disposeMat: true,
      life,
      maxLife: life,
      baseOpacity: mat.opacity,
      vel: new THREE.Vector3(
        Math.cos(angle) * power * 0.22,
        0.55 + Math.random() * 0.6,
        Math.sin(angle) * power * 0.22
      ),
      gravity: 1.2,
      floorY: baseY,
      fade: true,
      scaleSpeed: 0.9 + Math.random() * 0.8,
      spin: new THREE.Vector3(0, 0, (Math.random() - 0.5) * 2)
    });
  }

  if (ring) {
    const life = 0.3;
    const geo = new THREE.RingGeometry(0.45, 1.05, 24);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(origin.x, baseY + 0.02, origin.z);
    mesh.rotation.x = -Math.PI / 2;

    vfxList.push({
      mesh,
      disposeGeo: true,
      disposeMat: true,
      life,
      maxLife: life,
      baseOpacity: mat.opacity,
      fade: true,
      scaleSpeed: 4.2
    });
  }
}

export function spawnBossAttackTelegraph(scene, boss, attackType, targetPos, worldPhysics) {
  if (!scene || !boss?.group) return null;

  const bPos = boss.group.position.clone();
  const target = targetPos ? targetPos.clone() : bPos.clone();
  const dir = new THREE.Vector3().subVectors(target, bPos).setY(0);
  if (dir.lengthSq() < 0.0001) dir.set(0, 0, 1);
  else dir.normalize();

  const groundY = worldPhysics ? worldPhysics.getGroundHeight(bPos.x, bPos.z, bPos.y) : bPos.y;
  const group = new THREE.Group();
  group.position.set(bPos.x, groundY + 0.07, bPos.z);
  scene.add(group);

  const materials = [];
  const colorMap = {
    cone_saw: 0xff3b16,
    charge: 0xffc247,
    shockwave: 0xff3b16,
    floor_bombs: 0xff6a1e,
    radial_slag: 0xff7a1a,
    spiral_blades: 0xffe1a0,
    summon: 0xd8b45a
  };
  const color = colorMap[attackType] || 0xff3b16;

  const addMesh = (geometry, baseOpacity = 0.42) => {
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: baseOpacity,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    materials.push({ material, baseOpacity });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
    return mesh;
  };

  // Señal compacta común bajo el jefe.
  const coreRing = addMesh(new THREE.RingGeometry(0.8, 1.25, 20), 0.5);
  coreRing.rotation.x = -Math.PI / 2;

  if (attackType === 'cone_saw') {
    const mesh = addMesh(new THREE.CircleGeometry(3.2, 18, -Math.PI * 0.25, Math.PI * 0.5), 0.38);
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = Math.atan2(dir.x, dir.z) - Math.PI / 2;
  } else if (attackType === 'charge') {
    const mesh = addMesh(new THREE.PlaneGeometry(1.2, 6.0), 0.42);
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = -Math.atan2(dir.x, dir.z);
    mesh.position.set(dir.x * 3.1, 0.01, dir.z * 3.1);
  } else if (attackType === 'shockwave') {
    const ring = addMesh(new THREE.RingGeometry(2.3, 3.1, 28), 0.42);
    ring.rotation.x = -Math.PI / 2;
  } else if (attackType === 'floor_bombs') {
    const previewY = worldPhysics
      ? worldPhysics.getGroundHeight(target.x, target.z, target.y) - group.position.y
      : target.y - group.position.y;
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const radius = 1.15;
      const reticle = addMesh(new THREE.RingGeometry(0.55, 0.74, 14), 0.55);
      reticle.rotation.x = -Math.PI / 2;
      reticle.position.set(
        target.x - bPos.x + Math.cos(angle) * radius,
        previewY,
        target.z - bPos.z + Math.sin(angle) * radius
      );
    }
  } else if (attackType === 'radial_slag' || attackType === 'spiral_blades') {
    const ring = addMesh(new THREE.RingGeometry(2.0, 2.5, 24), 0.45);
    ring.rotation.x = -Math.PI / 2;
    const inner = addMesh(new THREE.RingGeometry(1.1, 1.35, 18), 0.5);
    inner.rotation.x = -Math.PI / 2;
  } else if (attackType === 'summon') {
    const ring = addMesh(new THREE.RingGeometry(2.4, 3.0, 24), 0.42);
    ring.rotation.x = -Math.PI / 2;
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const pillar = addMesh(new THREE.CylinderGeometry(0.08, 0.14, 1.8, 6), 0.32);
      pillar.position.set(Math.cos(angle) * 2.7, 0.9, Math.sin(angle) * 2.7);
    }
  }

  let age = 0;
  let destroyed = false;

  return {
    update(dt) {
      if (destroyed) return;
      age += dt;
      const pulse = 0.2 + (Math.sin(age * 17) * 0.5 + 0.5) * 0.35;
      for (const entry of materials) {
        entry.material.opacity = entry.baseOpacity * (0.55 + pulse);
      }
      if (attackType === 'radial_slag' || attackType === 'spiral_blades') {
        group.rotation.y += dt * 2.4;
      }
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      scene.remove(group);
      group.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
      materials.length = 0;
    }
  };
}
