// Ataques especiales telegrafiados de los bosses (hazards y proyectiles).
// Exports: triggerBossSpecialAttack.

import * as THREE from 'three';
import { AudioSys } from '../audio.js';
import { SHARED_GEO } from './shared.js';

// === ATAQUES ESPECIALES TELEGRAFIADOS DE LOS BOSSES ===
export function triggerBossSpecialAttack(scene, boss, attackType, playerPos, worldPhysics, hazards, projectiles, onSummon) {
  const bPos = boss.group.position.clone();
  const isP2 = boss.phase === 2;
  AudioSys.play(115, 0.35, 'sawtooth', 0.08);

  if (attackType === 'cone_saw') {
    const dir = new THREE.Vector3().subVectors(playerPos, bPos).setY(0).normalize();
    const angle = Math.atan2(dir.x, dir.z);
    const radius = isP2 ? 8.5 : 6.8;
    const geo = new THREE.CircleGeometry(radius, 18, -Math.PI * 0.28, Math.PI * 0.56);
    const mat = new THREE.MeshBasicMaterial({ color: 0xc42020, transparent: true, opacity: 0.45, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = angle - Math.PI / 2;
    mesh.position.set(bPos.x, bPos.y + 0.06, bPos.z);
    scene.add(mesh);

    hazards.push({
      type: 'cone', mesh, origin: bPos.clone(), dir, radius, arc: 0.9,
      timer: isP2 ? 0.75 : 0.95, maxTimer: isP2 ? 0.75 : 0.95, dmg: boss.dmg * 1.25
    });
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
  } else if (attackType === 'shockwave') {
    const radius = isP2 ? 9.5 : 7.5;
    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(0.4, radius, 24),
      new THREE.MeshBasicMaterial({ color: 0xc42020, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(bPos.x, bPos.y + 0.06, bPos.z);
    scene.add(mesh);

    hazards.push({
      type: 'circle', mesh, center: bPos.clone(), radius,
      timer: isP2 ? 0.85 : 1.05, maxTimer: isP2 ? 0.85 : 1.05, dmg: boss.dmg * 1.3
    });
  } else if (attackType === 'floor_bombs') {
    const count = isP2 ? 6 : 4;
    for (let i = 0; i < count; i++) {
      const offsetX = i === 0 ? 0 : (Math.random() - 0.5) * 11;
      const offsetZ = i === 0 ? 0 : (Math.random() - 0.5) * 11;
      const cx = playerPos.x + offsetX;
      const cz = playerPos.z + offsetZ;
      const cy = worldPhysics ? worldPhysics.getGroundHeight(cx, cz, playerPos.y) : 0;
      const radius = 2.6;

      const mesh = new THREE.Mesh(
        new THREE.CircleGeometry(radius, 18),
        new THREE.MeshBasicMaterial({ color: 0xd9381e, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(cx, cy + 0.07, cz);
      scene.add(mesh);

      hazards.push({
        type: 'circle', mesh, center: new THREE.Vector3(cx, cy, cz), radius,
        timer: 1.05 + i * 0.12, maxTimer: 1.05 + i * 0.12, dmg: boss.dmg * 1.15
      });
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
        vel: dir.multiplyScalar(isP2 ? 10.5 : 8.2),
        life: 3.2,
        dmg: boss.dmg * 0.85
      });
    }
  } else if (attackType === 'summon') {
    if (onSummon) onSummon(isP2 ? 5 : 3);
  }
}
