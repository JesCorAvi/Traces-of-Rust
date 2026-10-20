// Modificadores activos de la run según mejoras permanentes y pasivas.
// Exports: getActiveModifiers.

import { CONFIG } from '../config.js';

export function getActiveModifiers(save, gameSettings, passives, character = null) {
  const permDmg = 1 + (save.dmg || 0) * 0.03;
  const permAtkSpd = 1 + (save.atkSpd || 0) * 0.025;
  const permMoveSpd = 1 + (save.spd || 0) * 0.02;
  const permMag = (save.mag || 0) * 0.35;
  const shakeMod = (gameSettings.camShake ?? 100) / 100;

  const charMods = character?.statMods || {};
  const charMoveMult = charMods.moveSpeedMult || 1.0;
  const charAtkSpdMult = charMods.atkSpeedMult || 1.0;
  const charCritBonus = charMods.critChanceBonus || 0.0;
  const charAreaMult = charMods.areaMult || 1.0;
  const charRegen = charMods.regenPerSec || 0.0;
  const charBonusProj = charMods.bonusProjectiles || 0;
  const charDmgMult = charMods.dmgMult || 1.0;

  return {
    dmgMult: permDmg * charDmgMult * (1 + (passives.dmg || 0) * CONFIG.PASSIVES.dmg.perLevel),
    atkSpeedMult: permAtkSpd * charAtkSpdMult * (1 + (passives.atkSpd || 0) * CONFIG.PASSIVES.atkSpd.perLevel),
    moveSpeed: 6.3 * permMoveSpd * charMoveMult * (1 + (passives.moveSpd || 0) * CONFIG.PASSIVES.moveSpd.perLevel),
    areaMult: charAreaMult * (1 + (passives.area || 0) * CONFIG.PASSIVES.area.perLevel),
    critChance: charCritBonus + (passives.crit || 0) * CONFIG.PASSIVES.crit.perLevel,
    magnetRange: 5.8 + permMag + (passives.magnet || 0) * CONFIG.PASSIVES.magnet.perLevel,
    regenPerSec: charRegen + (passives.regen || 0) * CONFIG.PASSIVES.regen.perLevel,
    bonusProjectiles: charBonusProj + (passives.multishot || 0) * CONFIG.PASSIVES.multishot.perLevel,
    damageReduction: charMods.damageReduction || 0.0,
    knockbackMult: charMods.knockbackMult || 1.0,
    shakeMod
  };
}
