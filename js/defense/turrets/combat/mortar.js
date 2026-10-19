// Ataque de la Bombarda: conchas, explosión en área, racimo y napalm.
// Exports: fireMortar, explodeAt.

import * as THREE from 'three';
import { AudioSys } from '../../../audio.js';
import { triggerCombatFlash } from '../../../combat.js';
import { getEnemiesInRange, getMuzzleWorldPos, getEffectiveDamage } from '../targeting.js';

export function fireMortar(turret, primary, enemies, ctx) {
const muzzle = getMuzzleWorldPos(turret);
const sorted = getEnemiesInRange(turret, enemies).map(x => x.enemy);
const shells = Math.max(1, Math.round(turret.stats.shellCount));

for (let i = 0; i < shells; i++) {
  const target = sorted[i % sorted.length] || primary;
  if (!target) continue;

  const flight = 0.4 + Math.random() * 0.1;
  // Predicción sencilla: los enemigos se mueven hacia el núcleo, así que se apunta
  // delante de su posición actual para que la concha no caiga detrás.
  const moveYaw = target.billboard ? target.billboard.facingYaw : 0;
  const moveSpeed = (target.speed || 0) * (target.slowTimer > 0 ? (target.slowFactor || 0.6) : 1);
  const lead = new THREE.Vector3(-Math.sin(moveYaw), 0, -Math.cos(moveYaw))
    .multiplyScalar(moveSpeed * flight);
  const aim = target.group.position.clone().add(lead);

  if (i >= sorted.length) {
    aim.x += (Math.random() - 0.5) * turret.stats.aoeRadius * 1.2;
    aim.z += (Math.random() - 0.5) * turret.stats.aoeRadius * 1.2;
  }
  turret.system.spawnShell(
    muzzle,
    aim,
    flight,
    2.4,
    () => explodeAt(turret, aim)
  );
}

triggerCombatFlash(muzzle, turret.cfg.color, 80, 0.1);
AudioSys.play(105, 0.12, 'sine', 0.05);
turret.firingFlash = 0.24;
}

export function explodeAt(turret, pos) {
const dmg = getEffectiveDamage(turret);
const radius = turret.stats.aoeRadius;

if (turret.stats.cluster > 0) {
  const n = turret.stats.cluster;
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2 + Math.random() * 0.3;
    const off = radius * 0.62;
    const p = pos.clone().add(new THREE.Vector3(
      Math.cos(ang) * off, 0, Math.sin(ang) * off
    ));
    const r = radius * turret.stats.clusterRadiusMult;
    turret.system.damageArea(p, r, dmg * turret.stats.clusterDamageMult, turret);
    turret.system.spawnExplosion(p, r, turret.cfg.color);
  }
} else {
  turret.system.damageArea(pos, radius, dmg, turret);
  turret.system.spawnExplosion(pos, radius, turret.cfg.color);
}

if (turret.stats.napalmDps > 0) {
  turret.system.spawnNapalm(
    pos,
    turret.stats.napalmRadius * turret.stats.napalmRadiusMult,
    turret.stats.napalmDps * turret.stats.napalmDpsMult,
    turret.stats.napalmDuration * turret.stats.napalmDurationMult
  );
}

if (turret.stats.ignitionDamage > 0) {
  turret.system.damageArea(pos, radius, turret.stats.ignitionDamage, turret);
}

AudioSys.play(62, 0.18, 'sawtooth', 0.06);
}
