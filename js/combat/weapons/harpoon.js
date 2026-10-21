// Arpón neumático: proyectil perforante en línea.
// Exports: fireHarpoon.

import * as THREE from 'three';
import { AudioSys } from '../../audio.js';
import { getDirectionalHandPos, getWeaponScaling } from '../shared.js';

// 5. ARPÓN NEUMÁTICO
export function fireHarpoon(scene, playerPos, facingYaw, level, mods, enemies, vfx, onDamage, bodyYaw = facingYaw) {
  const alive = enemies.filter(e => e.state !== 'dead');
  const { cfg, mult } = getWeaponScaling('harpoon', level);
  const maxRange = cfg.baseRange * mods.areaMult * (mods.rangeMult || 1.0);
  const count = 1 + (cfg.usesMultishot ? (mods.bonusProjectiles || 0) : 0);

  const baseDir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), facingYaw);

  AudioSys.playHarpoon();
  const start = getDirectionalHandPos(playerPos, bodyYaw, 0.85, 0.36, 1.08);
  const dmg = cfg.baseDmg * mult * mods.dmgMult * (mods.harpoonDmgMult || 1.0);
  const maxPierce = 2 + level;

  for (let h = 0; h < count; h++) {
    const offsetAngle = count === 1 ? 0 : ((h / (count - 1)) - 0.5) * Math.min(0.85, count * 0.18);
    const dir = baseDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), offsetAngle).normalize();
    const end = start.clone().add(dir.clone().multiplyScalar(maxRange));

    const cable = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([start, end]),
      new THREE.LineBasicMaterial({ color: 0xc8c2ac })
    );
    scene.add(cable);
    vfx.push({ mesh: cable, disposeGeo: true, disposeMat: true, life: 0.18, maxLife: 0.18, fade: true });

    let pierced = 0;
    alive.forEach(e => {
      if (pierced >= maxPierce) return;
      const toE = new THREE.Vector3().subVectors(e.group.position, playerPos);
      if (Math.abs(toE.y) > 2.2) return;
      toE.y = 0;
      const fwdDist = toE.dot(dir);
      if (fwdDist > 0 && fwdDist < maxRange) {
        const perp = toE.clone().sub(dir.clone().multiplyScalar(fwdDist)).length();
        if (perp < 1.05 * mods.areaMult) {
          pierced++;
          onDamage(e, dmg, dir.clone().multiplyScalar(2.2));
        }
      }
    });
  }
  return facingYaw;
}
