// Ataque de la Bobina de Tesla: cadena eléctrica con caída de daño.
// Exports: fireTesla.

import * as THREE from 'three';
import { AudioSys } from '../../../audio.js';
import { getEffectiveDamage, getMuzzleWorldPos } from '../targeting.js';

export function fireTesla(turret, primary, enemies) {
  if (!primary) return;

  const canStatus = turret.system.isDamageAuthority?.() !== false;
  const totalTargets = Math.max(1, Math.round(turret.stats.chainCount || 1));
  const chainRange = (turret.stats.chainRange || 4) * (turret.stats.chainRangeMult || 1);
  const freezeDuration = turret.stats.freezeDuration || 0;
  let damage = getEffectiveDamage(turret);
  let current = primary;
  let from = getMuzzleWorldPos(turret);
  const used = new Set();

  for (let i = 0; i < totalTargets && current; i++) {
    const to = current.group.position.clone().add(new THREE.Vector3(0, 1.0, 0));
    turret.system.spawnTracer(from, to, turret.cfg.color, 0.13);
    turret.system.damageEnemy(current, damage, turret);
    if (canStatus && freezeDuration > 0) current.applyStun(freezeDuration);
    used.add(current);
    from = to;
    damage *= 0.78;

    let next = null;
    let bestDist = Infinity;
    for (const enemy of enemies) {
      if (!enemy.active || enemy.state === 'dead' || used.has(enemy)) continue;
      const dx = enemy.group.position.x - current.group.position.x;
      const dz = enemy.group.position.z - current.group.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > chainRange || dist >= bestDist) continue;
      bestDist = dist;
      next = enemy;
    }
    current = next;
  }

  turret.system.spawnSparks(from, turret.cfg.color);
  AudioSys.playElectric();
  turret.firingFlash = 0.2;
}
