// Escopeta calibre 12: postas, trazadoras, cartucho y fogonazo.
// Exports: fireBuckshot.

import * as THREE from 'three';
import { AudioSys } from '../../audio.js';
import { SHARED_GEO, SHARED_MAT, triggerCombatFlash, getDirectionalHandPos, getWeaponScaling } from '../shared.js';

// 2. ESCOPETA CALIBRE 12
export function fireBuckshot(scene, playerPos, aimYaw, bodyYaw, level, mods, enemies, vfx, onDamage, triggerFlash) {
  const alive = enemies.filter(e => e.state !== 'dead');
  if (!alive.length) return null;

  const { cfg, mult } = getWeaponScaling('shotgun', level);
  const maxRange = cfg.baseRange * mods.areaMult;
  const closest = alive.reduce((a, b) =>
    a.group.position.distanceTo(playerPos) < b.group.position.distanceTo(playerPos) ? a : b
  );
  if (closest.group.position.distanceTo(playerPos) > maxRange) return null;

  AudioSys.play(75, 0.24, 'sawtooth', 0.1);
  AudioSys.play(260, 0.09, 'square', 0.06);
  if (triggerFlash) triggerFlash();

  const baseDir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), aimYaw);
  const rightDir = new THREE.Vector3(-baseDir.z, 0, baseDir.x);
  const muzzlePos = getDirectionalHandPos(playerPos, bodyYaw, 0.95, 0.38, 1.12);

  triggerCombatFlash(muzzlePos, 0xffaa33, 150, 0.08);

  const flashSprite = new THREE.Mesh(
    SHARED_GEO.muzzleFlash,
    new THREE.MeshBasicMaterial({ color: 0xffe699, transparent: true, opacity: 0.95, side: THREE.DoubleSide })
  );
  flashSprite.position.copy(muzzlePos);
  scene.add(flashSprite);
  vfx.push({ mesh: flashSprite, disposeMat: true, life: 0.08, maxLife: 0.08, billboard: true, scaleSpeed: 6 });

  const shell = new THREE.Mesh(SHARED_GEO.shell, SHARED_MAT.shellRed);
  shell.position.copy(muzzlePos);
  scene.add(shell);
  vfx.push({
    mesh: shell,
    life: 1.0,
    vel: rightDir.clone().multiplyScalar(3.5 + Math.random()).add(new THREE.Vector3(0, 4.0, 0)),
    gravity: 16,
    floorY: playerPos.y + 0.05,
    spin: { x: 18, z: 14 }
  });

  const bonusProj = cfg.usesMultishot ? (mods.bonusProjectiles || 0) : 0;
  const pelletCount = 7 + level * 2 + bonusProj * 3;
  const spreadArc = (0.48 + level * 0.03 + bonusProj * 0.06) * mods.areaMult;
  const dmgPerPellet = cfg.baseDmg * mult * mods.dmgMult;

  for (let i = 0; i < pelletCount; i++) {
    const t = pelletCount > 1 ? (i / (pelletCount - 1)) - 0.5 : 0;
    const yawOffset = t * spreadArc + (Math.random() - 0.5) * 0.06;
    const pelletDir = baseDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), yawOffset).normalize();

    let hitEnemy = null;
    let hitDist = maxRange * (0.85 + Math.random() * 0.2);

    alive.forEach(e => {
      const toE = new THREE.Vector3().subVectors(e.group.position, muzzlePos);
      if (Math.abs(toE.y) > 2.2) return;
      toE.y = 0;
      const forwardDist = toE.dot(pelletDir);
      if (forwardDist > 0.4 && forwardDist < hitDist) {
        const perpDist = toE.clone().sub(pelletDir.clone().multiplyScalar(forwardDist)).length();
        if (perpDist < 0.95) {
          hitDist = forwardDist;
          hitEnemy = e;
        }
      }
    });

    const endPos = muzzlePos.clone().add(pelletDir.clone().multiplyScalar(hitDist));
    const tracer = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([muzzlePos.clone(), endPos]),
      new THREE.LineBasicMaterial({ color: i % 2 === 0 ? 0xffe699 : 0xd97724, transparent: true, opacity: 0.85 })
    );
    scene.add(tracer);
    vfx.push({ mesh: tracer, disposeGeo: true, disposeMat: true, life: 0.13, maxLife: 0.13, fade: true });

    if (hitEnemy) {
      onDamage(hitEnemy, dmgPerPellet, pelletDir.clone().multiplyScalar(0.42));
    }
  }
  return aimYaw;
}
