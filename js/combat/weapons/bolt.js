// Desfibrilador roto: descarga eléctrica que salta entre objetivos.
// Exports: fireDefibrillator.

import * as THREE from 'three';
import { AudioSys } from '../../audio.js';
import { getDirectionalHandPos, getWeaponScaling } from '../shared.js';

// 6. DESFIBRILADOR ROTO
export function fireDefibrillator(scene, playerPos, facingYaw, level, mods, enemies, vfx, onDamage) {
  const { cfg, mult } = getWeaponScaling('bolt', level);
  const range = cfg.baseRange * mods.areaMult;
  const maxTargets = 2 + level;
  const near = enemies
    .filter(e => e.state !== 'dead' && e.group.position.distanceTo(playerPos) < range)
    .slice(0, maxTargets);
  if (!near.length) return null;

  AudioSys.play(480, 0.14, 'sawtooth', 0.06);
  const pts = [getDirectionalHandPos(playerPos, facingYaw, 0.6, 0.3, 1.1)];
  const dmg = cfg.baseDmg * mult * mods.dmgMult;

  near.forEach(e => {
    pts.push(e.group.position.clone().add(new THREE.Vector3(0, 1.1, 0)));
    onDamage(e, dmg);
  });
  const bolt = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: 0xb89c46 })
  );
  scene.add(bolt);
  vfx.push({ mesh: bolt, disposeGeo: true, disposeMat: true, life: 0.12 });
  return facingYaw;
}
