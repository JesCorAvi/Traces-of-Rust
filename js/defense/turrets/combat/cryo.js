// Ataque de la Escarcha: pulsos de ralentización, congelación y daño.
// Exports: fireCryo.

import { AudioSys } from '../../../audio.js';
import { getEnemiesInRange, faceTarget, getEffectiveDamage } from '../targeting.js';

export function fireCryo(turret, enemies) {
// El pulso se centra en el enemigo más cercano dentro del alcance, no en la torreta:
// los emplazamientos están retirados de la ruta y si no el hielo nunca llegaría.
const targets = getEnemiesInRange(turret, enemies);
const primary = targets.length > 0 ? targets[0].enemy : null;
const center = primary ? primary.group.position.clone() : turret.group.position.clone();
const radius = turret.stats.aoeRadius;

if (primary) faceTarget(turret, primary.group.position);

const inRange = [];
for (let i = 0; i < enemies.length; i++) {
  const e = enemies[i];
  if (!e.active || e.state === 'dead') continue;
  if (turret.system.inRadius(center, e.group.position, radius)) {
    inRange.push(e);
  }
}

if (inRange.length === 0 && !turret.stats.continuous && !primary) return;

turret.pulseCount++;
const freezeNow = turret.stats.freezeEvery > 0
  && turret.pulseCount % turret.stats.freezeEvery === 0
  && turret.stats.freezeDuration > 0;

const canApplyStatus = turret.system.isDamageAuthority?.() !== false;
for (let i = 0; i < inRange.length; i++) {
  const e = inRange[i];
  if (canApplyStatus) {
    e.applySlow(turret.stats.slowFactor, turret.stats.slowDuration);
    if (freezeNow) e.applyStun(turret.stats.freezeDuration);
  }

  if (turret.stats.damage > 0) {
    turret.system.damageEnemy(e, getEffectiveDamage(turret), turret);
  }

  if (canApplyStatus && turret.stats.frostbiteDps > 0 && (e.slowTimer > 0 || e.stunTimer > 0)) {
    e.applyBurn(turret.stats.frostbiteDps * turret.stats.frostbiteDpsMult, 1.0);
  }
}

turret.system.spawnPulse(center, radius, turret.cfg.color);
if (inRange.length > 0) {
  AudioSys.play(520, 0.07, 'sine', 0.025);
  turret.firingFlash = 0.2;
}
}
