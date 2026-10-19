// Modificadores activos de la run según mejoras permanentes y pasivas.
// Exports: getActiveModifiers.

import { CONFIG } from '../config.js';

export function getActiveModifiers(save, gameSettings, passives) {
  const permDmg = 1 + (save.dmg || 0) * 0.03;
  const permAtkSpd = 1 + (save.atkSpd || 0) * 0.025;
  const permMoveSpd = 1 + (save.spd || 0) * 0.02;
  const permMag = (save.mag || 0) * 0.35;
  const shakeMod = (gameSettings.camShake ?? 100) / 100;

  return {
    dmgMult: permDmg * (1 + (passives.dmg || 0) * CONFIG.PASSIVES.dmg.perLevel),
    atkSpeedMult: permAtkSpd * (1 + (passives.atkSpd || 0) * CONFIG.PASSIVES.atkSpd.perLevel),
    moveSpeed: 6.3 * permMoveSpd * (1 + (passives.moveSpd || 0) * CONFIG.PASSIVES.moveSpd.perLevel),
    areaMult: 1 + (passives.area || 0) * CONFIG.PASSIVES.area.perLevel,
    critChance: (passives.crit || 0) * CONFIG.PASSIVES.crit.perLevel,
    magnetRange: 5.8 + permMag + (passives.magnet || 0) * CONFIG.PASSIVES.magnet.perLevel,
    regenPerSec: (passives.regen || 0) * CONFIG.PASSIVES.regen.perLevel,
    bonusProjectiles: (passives.multishot || 0) * CONFIG.PASSIVES.multishot.perLevel,
    shakeMod
  };
}
