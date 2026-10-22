// Estadísticas, rutas de mejora, crosspath y valor de venta de torretas.
// Exports: recomputeStats, applyUpgradeVisuals, getUpgradeState, upgrade, getSellValue.

import { CORE_DEFENSE_CONFIG } from '../../config/coreDefenseConfig.js';
import { AudioSys } from '../../audio.js';

export function recomputeStats(turret) {
const s = {
  ...turret.base,
  projectileCount: 1,
  pierce: 0,
  burstCount: 0,
  shellCount: 1,
  cluster: 0,
  clusterDamageMult: 1,
  clusterRadiusMult: 1,
  burnDps: turret.base.burnDps || 0,
  burnDuration: turret.base.burnDuration || 0,
  burnDpsMult: 1,
  burnDurationMult: 1,
  explosionRadius: 0,
  explosionDamageMult: 1,
  napalmDps: 0,
  napalmDuration: 0,
  napalmRadius: 0,
  napalmDpsMult: 1,
  napalmDurationMult: 1,
  napalmRadiusMult: 1,
  freezeDuration: turret.base.freezeDuration || 0,
  freezeEvery: 0,
  frozenDamageMult: 1,
  frostbiteDps: 0,
  frostbiteDpsMult: 1,
  brittleMult: 1,
  ignitionDamage: 0,
  alliesPerSpawn: 1,
  allyArmor: 0,
  allyRanged: false,
  allyAoe: false,
  allyHp: turret.base.allyHp || 60,
  allyDamage: turret.base.allyDamage || 6,
  allySpeed: turret.base.allySpeed || 4.2,
  allyRange: turret.base.allyRange || 10,
  allyAttackInterval: turret.base.allyAttackInterval || 0.9,
  allyCap: turret.base.allyCap || 0,
  spawnInterval: turret.base.spawnInterval || 8,
  healAmount: turret.base.healAmount || 0,
  healRadius: turret.base.healRadius || 0,
  buffFireRate: turret.base.buffFireRate || 0,
  buffDamage: turret.base.buffDamage || 0,
  buffRange: turret.base.buffRange || 0,
  buffScrap: turret.base.buffScrap || 0,
  auraArmor: 0,
  shieldAmount: 0,
  shieldInterval: 10,
  overclockBurst: 0,
  overclockBurstDuration: 0,
  overclockBurstInterval: 0,
  continuous: false,
  continuousHeal: false,
  barrier: false,
  chainCount: turret.base.chainCount || 0,
  chainRangeMult: 1,
  pushDistance: turret.base.pushDistance || 0,
  scrapPerWave: turret.base.scrapPerWave || 0,
  scrapInterval: turret.base.scrapInterval || 0,
  scrapAmount: turret.base.scrapAmount || 0
};

const specials = new Set();
const visuals = new Set();

const add = (key, v) => { s[key] = (s[key] ?? 0) + v; };
const mul = (key, v) => { s[key] = (s[key] ?? 1) * v; };
const max = (key, v) => { s[key] = Math.max(s[key] ?? 0, v); };
const min = (key, v) => { s[key] = Math.min(s[key] ?? v, v); };
const setTrue = key => { s[key] = true; };

for (let p = 0; p < turret.paths.length; p++) {
  const path = turret.paths[p];
  const level = turret.levels[p];
  for (let u = 0; u < level; u++) {
    const up = path.upgrades[u];
    if (!up) continue;
    if (up.special) specials.add(up.special);
    if (up.visual) visuals.add(up.visual);

    const fx = up.effects || {};
    Object.entries(fx).forEach(([key, v]) => {
      switch (key) {
        case 'damageMult': mul('damage', v); break;
        case 'damageFlat': add('damage', v); break;
        case 'fireRateMult': mul('fireRate', v); break;
        case 'rangeMult': mul('range', v); break;
        case 'aoeRadiusMult': mul('aoeRadius', v); break;
        case 'slowFactor': min('slowFactor', v); break;
        case 'projectileCount': max('projectileCount', v); break;
        case 'pierce': max('pierce', v); break;
        case 'burstCount': max('burstCount', v); break;
        case 'shellCount': max('shellCount', v); break;
        case 'cluster': max('cluster', v); break;
        case 'clusterDamageMult': mul('clusterDamageMult', v); break;
        case 'clusterRadiusMult': mul('clusterRadiusMult', v); break;
        case 'burnDps': add('burnDps', v); break;
        case 'burnDuration': add('burnDuration', v); break;
        case 'burnDpsMult': mul('burnDpsMult', v); break;
        case 'burnDurationMult': mul('burnDurationMult', v); break;
        case 'explosionRadius': max('explosionRadius', v); break;
        case 'explosionDamageMult': mul('explosionDamageMult', v); break;
        case 'napalmDps': add('napalmDps', v); break;
        case 'napalmDuration': add('napalmDuration', v); break;
        case 'napalmRadius': max('napalmRadius', v); break;
        case 'napalmDpsMult': mul('napalmDpsMult', v); break;
        case 'napalmDurationMult': mul('napalmDurationMult', v); break;
        case 'napalmRadiusMult': mul('napalmRadiusMult', v); break;
        case 'freezeDuration': max('freezeDuration', v); break;
        case 'freezeEvery': s.freezeEvery = s.freezeEvery || v; break;
        case 'frozenDamageMult': max('frozenDamageMult', v); break;
        case 'frostbiteDps': add('frostbiteDps', v); break;
        case 'frostbiteDpsMult': mul('frostbiteDpsMult', v); break;
        case 'brittleMult': max('brittleMult', v); break;
        case 'ignitionDamage': add('ignitionDamage', v); break;
        case 'allyCap': add('allyCap', v); break;
        case 'alliesPerSpawn': add('alliesPerSpawn', v); break;
        case 'alliesPerSpawnSet': max('alliesPerSpawn', v); break;
        case 'allyDamageMult': mul('allyDamage', v); break;
        case 'allyHpMult': mul('allyHp', v); break;
        case 'allySpeedMult': mul('allySpeed', v); break;
        case 'allyRangeMult': mul('allyRange', v); break;
        case 'allyArmor': max('allyArmor', v); break;
        case 'allyRanged': setTrue('allyRanged'); break;
        case 'allyAoe': setTrue('allyAoe'); break;
        case 'spawnIntervalMult': mul('spawnInterval', v); break;
        case 'healAmountMult': mul('healAmount', v); break;
        case 'healRadiusMult': mul('healRadius', v); break;
        case 'buffFireRate': add('buffFireRate', v); break;
        case 'buffDamage': add('buffDamage', v); break;
        case 'buffRange': add('buffRange', v); break;
        case 'buffScrap': add('buffScrap', v); break;
        case 'auraArmor': add('auraArmor', v); break;
        case 'shieldAmount': add('shieldAmount', v); break;
        case 'shieldAmountMult': mul('shieldAmount', v); break;
        case 'shieldInterval': min('shieldInterval', v); break;
        case 'overclockBurst': max('overclockBurst', v); break;
        case 'overclockBurstDuration': max('overclockBurstDuration', v); break;
        case 'overclockBurstInterval': s.overclockBurstInterval = v; break;
        case 'continuous': setTrue('continuous'); break;
        case 'continuousHeal': setTrue('continuousHeal'); break;
        case 'barrier': setTrue('barrier'); break;
        case 'chainCount': max('chainCount', v); break;
        case 'chainRangeMult': mul('chainRangeMult', v); break;
        case 'pushDistance': add('pushDistance', v); break;
        case 'scrapPerWave': add('scrapPerWave', v); break;
        case 'scrapInterval': min('scrapInterval', v); break;
        case 'scrapAmount': add('scrapAmount', v); break;
        default: break;
      }
    });
  }
}

s.damage = Math.max(0, s.damage || 0);
s.fireRate = Math.max(0.05, s.fireRate || 1);
s.range = Math.max(1, s.range || 1);
s.allyCap = Math.max(0, s.allyCap || 0);
s.alliesPerSpawn = Math.max(1, s.alliesPerSpawn || 1);
s.spawnInterval = Math.max(0.5, s.spawnInterval || 8);
s.slowFactor = s.slowFactor ?? 0.6;
s.slowDuration = s.slowDuration || 1.6;
s.aoeRadius = s.aoeRadius || 0;

turret.stats = s;
turret.specials = specials;
turret.visualKeys = visuals;

if (turret.modelRoot) turret.applyUpgradeVisuals();
}

export function applyUpgradeVisuals(turret) {
Object.entries(turret.visualParts).forEach(([key, part]) => {
  if (!part) return;
  part.visible = turret.visualKeys.has(key);
});
}

export function getUpgradeState(turret, pathIndex) {
const rules = CORE_DEFENSE_CONFIG.TURRET_UPGRADE_RULES;
const path = turret.paths[pathIndex];
const level = turret.levels[pathIndex];
if (!path) return null;

if (level >= path.upgrades.length) {
  return { path, level, next: null, canBuy: false, lockReason: 'NIVEL MÁXIMO' };
}

const nextTier = level + 1;
let lockReason = null;
if (nextTier > rules.freeTier) {
  const otherSpecialized = turret.levels.some((l, i) => i !== pathIndex && l >= rules.specializedTier);
  if (otherSpecialized) lockReason = 'OTRA RUTA ESPECIALIZADA';
}

return {
  path,
  level,
  next: path.upgrades[level],
  nextTier,
  canBuy: !lockReason,
  lockReason
};
}

export function upgrade(turret, pathIndex) {
const state = turret.getUpgradeState(pathIndex);
if (!state || !state.next || !state.canBuy) return false;
turret.levels[pathIndex]++;
turret.invested += state.next.cost;
turret.recomputeStats();
turret.applyUpgradeVisuals();
turret.fireTimer = Math.min(turret.fireTimer, 0.15);
AudioSys.playUISelect();
return true;
}

export function getSellValue(turret) {
return Math.floor(turret.invested * CORE_DEFENSE_CONFIG.TURRET_UPGRADE_RULES.sellRefund);
}
