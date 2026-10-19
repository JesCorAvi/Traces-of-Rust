// Targeting y cálculo de daño/cadencia efectivos de torretas.
// Exports: getEffectiveDamage, getEffectiveFireRate, getEnemiesInRange, findTarget, getMuzzleWorldPos, faceTarget.

import * as THREE from 'three';

const Y_AXIS = new THREE.Vector3(0, 1, 0);

export function getEffectiveDamage(turret) {
return turret.stats.damage * (1 + turret.supportDamageBonus);
}

export function getEffectiveFireRate(turret) {
return turret.stats.fireRate * (1 + turret.supportFireRateBonus);
}

export function getEnemiesInRange(turret, enemies) {
const out = [];
const pos = turret.group.position;
for (let i = 0; i < enemies.length; i++) {
  const e = enemies[i];
  if (!e.active || e.state === 'dead') continue;
  const dx = e.group.position.x - pos.x;
  const dz = e.group.position.z - pos.z;
  const dy = Math.abs(e.group.position.y - pos.y);
  if (dy > 4.5) continue;
  const d = Math.hypot(dx, dz);
  if (d <= turret.stats.range) {
    out.push({ enemy: e, dist: d });
  }
}
out.sort((a, b) => a.dist - b.dist);
return out;
}

export function findTarget(turret, enemies) {
const list = getEnemiesInRange(turret, enemies);
if (list.length === 0) return null;
if (turret.cfg.id === 'mortar') {
  // Preferir el enemigo con más vecinos dentro del radio de explosión
  let best = list[0].enemy;
  let bestScore = -1;
  for (let i = 0; i < Math.min(list.length, 10); i++) {
    const candidate = list[i].enemy;
    let score = 0;
    for (let j = 0; j < list.length; j++) {
      const e = list[j].enemy;
      const dx = e.group.position.x - candidate.group.position.x;
      const dz = e.group.position.z - candidate.group.position.z;
      if (Math.hypot(dx, dz) <= turret.stats.aoeRadius * 1.6) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best;
}
return list[0].enemy;
}

export function getMuzzleWorldPos(turret) {
const local = new THREE.Vector3(0, turret.muzzleHeight || 1, -(turret.muzzleForward || 0.8));
local.applyAxisAngle(Y_AXIS, turret.modelRoot.rotation.y);
return turret.group.position.clone().add(local);
}

export function faceTarget(turret, targetPos) {
const dx = targetPos.x - turret.group.position.x;
const dz = targetPos.z - turret.group.position.z;
turret.modelRoot.rotation.y = Math.atan2(-dx, -dz);
}
