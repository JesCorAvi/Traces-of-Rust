// Ataque de Eyección Hidráulica: pulso corto que empuja a los hostiles hacia atrás.
// Exports: fireEjector.

import * as THREE from 'three';
import { AudioSys } from '../../../audio.js';
import { getEffectiveDamage } from '../targeting.js';

export function fireEjector(turret, primary, enemies) {
  const center = turret.group.position.clone();
  const radius = turret.stats.aoeRadius;
  const damage = getEffectiveDamage(turret);
  const canStatus = turret.system.isDamageAuthority?.() !== false;
  const pushDistance = turret.stats.pushDistance || 0;
  const stunDuration = turret.stats.freezeDuration || 0;

  for (const enemy of enemies) {
    if (!enemy.active || enemy.state === 'dead') continue;
    if (!turret.system.inRadius(center, enemy.group.position, radius)) continue;
    turret.system.damageEnemy(enemy, damage, turret);
    if (!canStatus) continue;

    if (stunDuration > 0) enemy.applyStun(stunDuration);
    const yaw = enemy.billboard?.facingYaw || 0;
    const back = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const resist = Math.min(1, Math.max(0, enemy.knockbackResist || 0));
    enemy.group.position.addScaledVector(back, pushDistance * (1 - resist));
    if (turret.system.worldPhysics) {
      turret.system.worldPhysics.resolveCollision(
        enemy.group.position,
        enemy.collisionRadius || 0.55,
        enemy.group.position.y
      );
    }
  }

  turret.system.spawnPulse(center, radius, turret.cfg.color);
  turret.system.spawnSparks(center, 0x55c8e0);
  AudioSys.playTurretShot('ejector', center);
  AudioSys.play(95, 0.18, 'sawtooth', 0.055);
  turret.firingFlash = 0.2;
}
