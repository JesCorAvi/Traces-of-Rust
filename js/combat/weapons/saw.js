// Sierra de amputación: arco de daño, VFX y empuje.
// Exports: executeSawSlash.

import * as THREE from 'three';
import { AudioSys } from '../../audio.js';
import { setPlaneFrameUV } from '../../entities.js';
import { SHARED_GEO, SHARED_MAT, triggerCombatFlash, getDirectionalHandPos, getWeaponScaling } from '../shared.js';

// 1. SIERRA DE AMPUTACIÓN (Usa UVs directas en vez de clonar la textura en cada tajo)
export function executeSawSlash(scene, playerPos, facingYaw, level, mods, enemies, vfx, onDamage, onMicroShake, bodyYaw = facingYaw) {
  const { cfg, mult } = getWeaponScaling('slash', level);
  const size = (3.1 + level * 0.3) * mods.areaMult;
  const dmg = cfg.baseDmg * mult * mods.dmgMult * (mods.slashDmgMult || 1.0);
  const range = (cfg.baseRange + level * 0.28) * mods.areaMult;

  AudioSys.play(195, 0.13, 'sawtooth', 0.06);
  AudioSys.play(90, 0.09, 'square', 0.04);
  if (onMicroShake) onMicroShake(0.09);

  const handOrigin = getDirectionalHandPos(playerPos, bodyYaw, 0.5, 0.32, 1.05);
  const fwd = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), facingYaw);

  const slashPos = handOrigin.clone().add(fwd.clone().multiplyScalar(1.35 * mods.areaMult));
  triggerCombatFlash(slashPos, 0xd95326, 85, 0.12);

  const geo = new THREE.PlaneGeometry(size, size * 0.75);
  setPlaneFrameUV(geo, 4, 1, 0, 0);

  const mesh = new THREE.Mesh(geo, SHARED_MAT.slashMat);
  mesh.position.copy(slashPos);
  scene.add(mesh);

  vfx.push({
    mesh,
    disposeGeo: true,
    life: 0.2,
    maxLife: 0.2,
    billboard: true,
    uvTotalFrames: 4
  });

  enemies.forEach(e => {
    if (e.state === 'dead') return;
    const toE = new THREE.Vector3().subVectors(e.group.position, playerPos);
    if (Math.abs(toE.y) < 2.2 && toE.length() < range && fwd.angleTo(toE.clone().setY(0).normalize()) < 1.15) {
      onDamage(e, dmg, toE.clone().setY(0).normalize().multiplyScalar(1.65));

      for (let p = 0; p < 3; p++) {
        const spark = new THREE.Mesh(
          SHARED_GEO.spark,
          p % 2 === 0 ? SHARED_MAT.sparkBlood : SHARED_MAT.sparkGold
        );
        spark.position.copy(e.group.position).add(new THREE.Vector3(0, 1.0, 0));
        scene.add(spark);
        vfx.push({
          mesh: spark,
          life: 0.24,
          vel: new THREE.Vector3((Math.random() - 0.5) * 6, 2.5 + Math.random() * 3, (Math.random() - 0.5) * 6),
          gravity: 16,
          floorY: playerPos.y + 0.05
        });
      }
    }
  });

  return facingYaw;
}
