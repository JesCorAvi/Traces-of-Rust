// Actualización de Cuartel (aliados) y Taller (curación/escudos/buffs).
// Exports: updateBarracks, updateSupport.

import { AudioSys } from '../../../audio.js';

export function updateBarracks(turret, dt, ctx) {
turret.spawnTimer -= dt;
if (turret.spawnTimer > 0) return;
turret.spawnTimer = turret.stats.spawnInterval;

const alive = turret.system.countAlliesFor(turret);
if (alive >= turret.stats.allyCap) return;

let spawned = 0;
for (let i = 0; i < turret.stats.alliesPerSpawn; i++) {
  if (turret.system.countAlliesFor(turret) >= turret.stats.allyCap) break;
  if (turret.system.spawnAlly(turret)) spawned++;
}

if (spawned > 0) {
  turret.firingFlash = 0.35;
  turret.system.spawnPulse(turret.group.position, 2.2, turret.cfg.color);
  AudioSys.playTurretShot(turret.cfg.id, turret.group.position);
}
}

export function updateSupport(turret, dt, ctx) {
const s = turret.stats;

if (s.continuousHeal) {
  const perSecond = s.healAmount / Math.max(0.5, s.pulseInterval || 3);
  turret.system.healAround(turret, perSecond * dt, s.healRadius);
} else {
  turret.supportPulseTimer -= dt;
  if (turret.supportPulseTimer <= 0) {
    turret.supportPulseTimer = s.pulseInterval || 3;
    turret.system.healAround(turret, s.healAmount, s.healRadius);
    turret.system.spawnPulse(turret.group.position, s.healRadius * 0.55, turret.cfg.color);
  }
}

if (s.shieldAmount > 0) {
  turret.supportShieldTimer -= dt;
  if (turret.supportShieldTimer <= 0) {
    turret.supportShieldTimer = s.shieldInterval || 10;
    turret.system.shieldAround(turret, s.shieldAmount, s.healRadius);
    turret.system.spawnPulse(turret.group.position, s.healRadius * 0.7, 0x6f8f9c);
  }
}

if (s.overclockBurst > 0) {
  if (turret.burstActive > 0) {
    turret.burstActive -= dt;
  } else {
    turret.burstCooldown -= dt;
    if (turret.burstCooldown <= 0) {
      turret.burstActive = s.overclockBurstDuration || 5;
      turret.burstCooldown = s.overclockBurstInterval || 20;
      turret.system.spawnPulse(turret.group.position, 4.5, turret.cfg.color);
      AudioSys.playElectric();
    }
  }
}
}
