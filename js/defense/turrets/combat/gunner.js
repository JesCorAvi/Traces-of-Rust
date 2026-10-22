// Ataque de la Clavadora: disparo directo, perforación y ráfaga.
// Exports: fireGunner, collectLineHits.

import * as THREE from 'three';
import { AudioSys } from '../../../audio.js';
import { triggerCombatFlash } from '../../../combat.js';
import { getEnemiesInRange, getMuzzleWorldPos, getEffectiveDamage } from '../targeting.js';

export function fireGunner(turret, primary, enemies, ctx) {
const muzzle = getMuzzleWorldPos(turret);
const primaryCount = Math.max(1, turret.stats.projectileCount);
const sorted = getEnemiesInRange(turret, enemies).map(x => x.enemy);
const ordered = turret.cfg.targetMode === 'strongest'
  ? [primary, ...sorted.filter(enemy => enemy !== primary)]
  : sorted;
const primaries = ordered.slice(0, primaryCount);
if (primaries.length === 0) primaries.push(primary);

const shots = turret.stats.burstCount > 0 ? turret.stats.burstCount : 1;
const maxHits = 1 + Math.max(0, turret.stats.pierce);
const dmg = getEffectiveDamage(turret);

for (let i = 0; i < shots; i++) {
  const target = primaries[i % primaries.length];
  if (!target || !target.active || target.state === 'dead') continue;

  const aim = target.group.position.clone().add(new THREE.Vector3(0, 1.0, 0));
  const hits = turret.cfg.targetMode === 'strongest'
    ? [target]
    : collectLineHits(turret, enemies, muzzle, aim, maxHits);
  const finalHits = hits.length > 0 ? hits : [target];

  for (let h = 0; h < finalHits.length; h++) {
    const e = finalHits[h];
    turret.system.damageEnemy(e, dmg, turret);
    if (turret.stats.burnDps > 0 && turret.system.isDamageAuthority?.()) {
      e.applyBurn(
        turret.stats.burnDps * turret.stats.burnDpsMult,
        turret.stats.burnDuration * turret.stats.burnDurationMult
      );
    }
  }

  turret.system.spawnTracer(muzzle, aim, turret.cfg.color, 0.06);

  if (turret.stats.explosionRadius > 0) {
    turret.system.damageArea(
      target.group.position,
      turret.stats.explosionRadius,
      dmg * turret.stats.explosionDamageMult,
      turret
    );
    turret.system.spawnExplosion(target.group.position, turret.stats.explosionRadius, turret.cfg.color);
  }
}

triggerCombatFlash(muzzle, turret.cfg.color, 62, 0.06);
AudioSys.playTurretShot(turret.cfg.id, turret.group.position);
turret.firingFlash = 0.16;
}

export function collectLineHits(turret, enemies, origin, aim, maxHits) {
const dir = aim.clone().sub(origin);
if (dir.lengthSq() < 0.0001) return [];
dir.normalize();

const hits = [];
for (let i = 0; i < enemies.length; i++) {
  const e = enemies[i];
  if (!e.active || e.state === 'dead') continue;
  const toE = e.group.position.clone().add(new THREE.Vector3(0, 1.0, 0)).sub(origin);
  const proj = toE.dot(dir);
  if (proj <= 0.2 || proj > turret.stats.range + 4) continue;
  const perp = toE.clone().addScaledVector(dir, -proj).length();
  if (perp <= 0.9 + (e.isBoss ? 0.7 : 0)) {
    hits.push({ enemy: e, proj });
  }
}
hits.sort((a, b) => a.proj - b.proj);
return hits.slice(0, maxHits).map(h => h.enemy);
}
