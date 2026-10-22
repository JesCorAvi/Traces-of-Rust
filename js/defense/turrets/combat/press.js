// Ataque de la Prensa de Vía: impacto de área a muy corto alcance con stun y empuje.
// Exports: firePress.

import * as THREE from 'three';
import { AudioSys } from '../../../audio.js';
import { getEffectiveDamage } from '../targeting.js';

export function firePress(turret, primary, enemies) {
  const center = turret.group.position.clone();
  const radius = turret.stats.aoeRadius;
  const damage = getEffectiveDamage(turret);
  const canStatus = turret.system.isDamageAuthority?.() !== false;
  const stunDuration = turret.stats.freezeDuration || 0;

  for (const enemy of enemies) {
    if (!enemy.active || enemy.state === 'dead') continue;
    if (!turret.system.inRadius(center, enemy.group.position, radius)) continue;
    turret.system.damageEnemy(enemy, damage, turret);
    if (!canStatus) continue;

    if (stunDuration > 0) enemy.applyStun(stunDuration);
    const push = new THREE.Vector3(
      enemy.group.position.x - center.x,
      0,
      enemy.group.position.z - center.z
    );
    if (push.lengthSq() < 0.0001) push.set(0, 0, 1);
    else push.normalize();
    const resist = Math.min(1, Math.max(0, enemy.knockbackResist || 0));
    enemy.group.position.addScaledVector(push, 0.9 * (1 - resist));
    if (turret.system.worldPhysics) {
      turret.system.worldPhysics.resolveCollision(
        enemy.group.position,
        enemy.collisionRadius || 0.55,
        enemy.group.position.y
      );
    }
  }

  turret.system.spawnExplosion(center, radius, turret.cfg.color);
  turret.system.spawnSparks(center, 0xffc56b);
  AudioSys.playTurretShot('press', center);
  AudioSys.play(72, 0.16, 'sawtooth', 0.05);
  turret.firingFlash = 0.24;
}
