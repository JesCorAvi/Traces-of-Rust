// Soplete incinerador: cono de fuego, partículas y quemadura.
// Exports: fireFlamethrower.

import * as THREE from 'three';
import { AudioSys } from '../../audio.js';
import { SHARED_GEO, getDirectionalHandPos, getWeaponScaling } from '../shared.js';

// 3. SOPLETE INCINERADOR
export function fireFlamethrower(scene, playerPos, facingYaw, level, mods, enemies, vfx, onDamage, bodyYaw = facingYaw) {
  const { cfg, mult } = getWeaponScaling('flamethrower', level);
  const fwd = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), facingYaw);
  const nozzle = getDirectionalHandPos(playerPos, bodyYaw, 0.92, 0.36, 1.05);
  const range = (cfg.baseRange + level * 0.45) * mods.areaMult;

  if (Math.random() < 0.45) AudioSys.play(110 + Math.random() * 40, 0.08, 'sawtooth', 0.03);

  const particleCount = 3;
  const coneHalfAngle = 0.65 * mods.areaMult;

  for (let i = 0; i < particleCount; i++) {
    const spread = (Math.random() - 0.5) * (coneHalfAngle * 1.4);
    const dir = fwd.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), spread);
    const flame = new THREE.Mesh(
      SHARED_GEO.flame,
      new THREE.MeshBasicMaterial({
        color: Math.random() < 0.5 ? 0xff7711 : 0xffcc33,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide
      })
    );
    flame.position.copy(nozzle);
    scene.add(flame);
    vfx.push({
      mesh: flame,
      disposeMat: true,
      life: 0.24,
      maxLife: 0.24,
      billboard: true,
      fade: true,
      scaleSpeed: 3.5,
      vel: dir.multiplyScalar(range * 3.2).add(new THREE.Vector3(0, 1.1, 0))
    });
  }

  const dmg = cfg.baseDmg * mult * mods.dmgMult * (mods.fireDmgMult || 1.0);
  enemies.forEach(e => {
    if (e.state === 'dead') return;
    const toE = new THREE.Vector3().subVectors(e.group.position, playerPos);
    if (Math.abs(toE.y) < 2.2 && toE.length() < range && fwd.angleTo(toE.clone().setY(0).normalize()) < coneHalfAngle) {
      onDamage(e, dmg, null, false, {
        burnDps: dmg * 1.6,
        burnDuration: 2.5 + level * 0.3
      });
      e.burnTimer = 2.5 + level * 0.3;
      e.burnDps = dmg * 1.6;
    }
  });
}
