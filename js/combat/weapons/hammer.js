// Martillo de pistón: onda de presión radial con knockback y aturdimiento.
// Exports: slamHammer.

import * as THREE from 'three';
import { AudioSys } from '../../audio.js';
import { getWeaponScaling } from '../shared.js';

export function slamHammer(scene, playerPos, level, mods, enemies, vfx, onDamage, addShake) {
  const { cfg, mult } = getWeaponScaling('hammer', level);
  const radius = cfg.baseRange * (mods.areaMult || 1);
  const damage = cfg.baseDmg * mult * mods.dmgMult;
  const stunDuration = 0.35 + level * 0.04;
  const knockbackForce = 4.0 * (mods.knockbackMult || 1);

  let hits = 0;
  for (const enemy of enemies) {
    if (!enemy.active || enemy.state === 'dead') continue;
    const dx = enemy.group.position.x - playerPos.x;
    const dz = enemy.group.position.z - playerPos.z;
    if (Math.hypot(dx, dz) > radius) continue;
    if (Math.abs(enemy.group.position.y - playerPos.y) > 2.5) continue;

    const dir = new THREE.Vector3(dx, 0, dz);
    if (dir.lengthSq() < 0.0001) dir.set(0, 0, 1);
    else dir.normalize();

    enemy.applyStun?.(stunDuration);
    onDamage(enemy, damage, dir.multiplyScalar(knockbackForce), false);
    hits++;
  }

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.4, radius, 28),
    new THREE.MeshBasicMaterial({
      color: 0xd8b45a, transparent: true, opacity: 0.55,
      side: THREE.DoubleSide, depthWrite: false
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(playerPos.x, playerPos.y + 0.08, playerPos.z);
  scene.add(ring);
  vfx.push({
    mesh: ring, disposeGeo: true, disposeMat: true,
    life: 0.26, maxLife: 0.26, fade: true, scaleSpeed: 3.6
  });

  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 0.3 + Math.random() * radius * 0.75;
    const life = 0.35 + Math.random() * 0.25;
    const dust = new THREE.Mesh(
      new THREE.PlaneGeometry(0.32, 0.32),
      new THREE.MeshBasicMaterial({
        color: 0x8a7a58, transparent: true, opacity: 0.5,
        side: THREE.DoubleSide, depthWrite: false
      })
    );
    dust.position.set(
      playerPos.x + Math.cos(angle) * dist,
      playerPos.y + 0.08,
      playerPos.z + Math.sin(angle) * dist
    );
    dust.rotation.x = -Math.PI / 2;
    scene.add(dust);
    vfx.push({
      mesh: dust, disposeGeo: true, disposeMat: true,
      life, maxLife: life, fade: true, baseOpacity: 0.5,
      vel: new THREE.Vector3(
        Math.cos(angle) * (1.2 + Math.random() * 2.2),
        0.8 + Math.random() * 1.6,
        Math.sin(angle) * (1.2 + Math.random() * 2.2)
      ),
      gravity: 5.5,
      floorY: playerPos.y + 0.05,
      scaleSpeed: 1.8,
      spin: new THREE.Vector3(0, 0, (Math.random() - 0.5) * 4)
    });
  }

  AudioSys.play(76, 0.18, 'sawtooth', 0.09);
  addShake?.(0.25 * (mods.shakeMod || 1));
  return hits;
}
