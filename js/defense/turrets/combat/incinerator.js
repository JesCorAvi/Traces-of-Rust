// Ataque del Incinerator: cono continuo de fuego, quemadura y napalm.
// Exports: fireIncinerator.

import * as THREE from 'three';
import { AudioSys } from '../../../audio.js';
import { getEffectiveDamage, getMuzzleWorldPos } from '../targeting.js';

const INCINERATOR_FLAME_GEO = new THREE.PlaneGeometry(0.55, 0.55);
INCINERATOR_FLAME_GEO.userData = { sharedGeo: true };

const INCINERATOR_MAT_ORANGE = new THREE.MeshBasicMaterial({
  color: 0xff7711, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false
});
INCINERATOR_MAT_ORANGE.userData = { sharedMat: true };

const INCINERATOR_MAT_YELLOW = new THREE.MeshBasicMaterial({
  color: 0xffcc33, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false
});
INCINERATOR_MAT_YELLOW.userData = { sharedMat: true };

export function fireIncinerator(turret, primary, enemies) {
  if (!primary) return;

  const canStatus = turret.system.isDamageAuthority?.() !== false;
  const origin = turret.group.position.clone();
  const dir = primary.group.position.clone().sub(origin).setY(0);
  if (dir.lengthSq() < 0.0001) dir.set(0, 0, -1);
  else dir.normalize();

  const range = turret.stats.range;
  const coneCos = Math.cos(0.58);
  const damage = getEffectiveDamage(turret);
  const burnDps = (turret.stats.burnDps || 0) * (turret.stats.burnDpsMult || 1);
  const burnDuration = (turret.stats.burnDuration || 0) * (turret.stats.burnDurationMult || 1);

  for (const enemy of enemies) {
    if (!enemy.active || enemy.state === 'dead') continue;
    const toEnemy = enemy.group.position.clone().sub(origin);
    if (Math.abs(toEnemy.y) > 2.6) continue;
    toEnemy.y = 0;
    const dist = toEnemy.length();
    if (dist > range) continue;
    if (dist > 0.1 && dir.dot(toEnemy.normalize()) < coneCos) continue;

    turret.system.damageEnemy(enemy, damage, turret);
    if (canStatus && burnDps > 0 && burnDuration > 0) {
      enemy.applyBurn(burnDps, burnDuration);
    }
  }

  const now = turret.system.elapsed || 0;
  if (canStatus && turret.stats.napalmDps > 0 && now >= (turret.napalmNextAt || 0)) {
    turret.napalmNextAt = now + 1.8;
    turret.system.spawnNapalm(
      primary.group.position,
      turret.stats.napalmRadius * (turret.stats.napalmRadiusMult || 1),
      turret.stats.napalmDps * (turret.stats.napalmDpsMult || 1),
      turret.stats.napalmDuration * (turret.stats.napalmDurationMult || 1)
    );
    if (turret.stats.ignitionDamage > 0 && primary.active && primary.state !== 'dead') {
      turret.system.damageEnemy(primary, turret.stats.ignitionDamage, turret);
    }
  }

  const muzzle = getMuzzleWorldPos(turret);
  const ctx = turret.system.ctx;
  if (ctx?.vfx) {
    for (let i = 0; i < 3; i++) {
      const flameMat = i % 2 === 0 ? INCINERATOR_MAT_ORANGE : INCINERATOR_MAT_YELLOW;
      const flame = new THREE.Mesh(INCINERATOR_FLAME_GEO, flameMat);
      flame.position.copy(muzzle);
      ctx.scene.add(flame);
      const spread = (Math.random() - 0.5) * 0.42;
      const flameDir = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), spread);
      ctx.vfx.push({
        mesh: flame, disposeGeo: false, disposeMat: false,
        life: 0.24, maxLife: 0.24, billboard: true, fade: false, scaleSpeed: 2.6,
        vel: flameDir.multiplyScalar(7.5).add(new THREE.Vector3(0, 0.7, 0))
      });
    }
  }

  AudioSys.playFlamethrower();
  turret.firingFlash = 0.16;
}
