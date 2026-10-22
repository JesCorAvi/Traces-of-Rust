// Dispatch de ataque por tipo de torreta.
// Exports: updateCombat.

import { getEffectiveFireRate, findTarget, faceTarget } from '../targeting.js';
import { fireGunner } from './gunner.js';
import { fireMortar } from './mortar.js';
import { fireCryo } from './cryo.js';
import { fireTesla } from './tesla.js';
import { fireIncinerator } from './incinerator.js';
import { firePress } from './press.js';
import { fireEjector } from './ejector.js';

export function updateCombat(turret, dt, enemies, ctx) {
turret.fireTimer -= dt;
if (turret.fireTimer > 0) return;

if (turret.cfg.id === 'cryo') {
  fireCryo(turret, enemies);
  const interval = turret.stats.continuous ? 0.35 : 1 / Math.max(0.05, getEffectiveFireRate(turret));
  turret.fireTimer = interval;
  return;
}

const target = findTarget(turret, enemies);
if (!target) {
  turret.fireTimer = 0;
  return;
}

const interval = 1 / Math.max(0.05, getEffectiveFireRate(turret));
turret.fireTimer = interval;

faceTarget(turret, target.group.position);

if (turret.cfg.id === 'gunner' || turret.cfg.id === 'railgun') {
  fireGunner(turret, target, enemies, ctx);
} else if (turret.cfg.id === 'mortar') {
  fireMortar(turret, target, enemies, ctx);
} else if (turret.cfg.id === 'tesla') {
  fireTesla(turret, target, enemies);
} else if (turret.cfg.id === 'incinerator') {
  fireIncinerator(turret, target, enemies);
} else if (turret.cfg.id === 'press') {
  firePress(turret, target, enemies);
} else if (turret.cfg.id === 'ejector') {
  fireEjector(turret, target, enemies);
}
}
