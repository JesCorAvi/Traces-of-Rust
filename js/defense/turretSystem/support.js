// Soporte del Taller: buffs, curación y escudos.
// Exports: applySupportBuffs, healAround, shieldAround.

export function applySupportBuffs(system, ctx) {
for (const turret of system.turrets.values()) {
  turret.supportFireRateBonus = 0;
  turret.supportDamageBonus = 0;
  turret.supportRangeBonus = 0;
  turret.supportScrapBonus = 0;
  turret.damageReduction = 0;
}

for (const support of system.turrets.values()) {
  if (support.cfg.id !== 'support' || support.destroyed) continue;
  const s = support.stats;
  const radius = s.range || 14;
  const burstBonus = support.burstActive > 0 ? (s.overclockBurst || 0) : 0;
  const fireBuff = (s.buffFireRate || 0.15) + burstBonus;
  const dmgBuff = (s.buffDamage || 0.15);
  const rangeBuff = (s.buffRange || 0.15);
  const scrapBuff = (s.buffScrap || 0);

  for (const turret of system.turrets.values()) {
    if (turret === support || turret.destroyed) continue;
    if (!system.inRadius(support.group.position, turret.group.position, radius)) continue;
    turret.supportFireRateBonus = Math.min(2.5, turret.supportFireRateBonus + fireBuff);
    turret.supportDamageBonus = Math.min(2.5, turret.supportDamageBonus + dmgBuff);
    turret.supportRangeBonus = Math.min(2.0, turret.supportRangeBonus + rangeBuff);
    turret.supportScrapBonus = Math.min(1.0, turret.supportScrapBonus + scrapBuff);
  }
}
}

export function healAround(system, support, amount, radius) {
if (amount <= 0 || radius <= 0) return;
const center = support.group.position;

if (system.mode && system.mode.coreMachine && !system.mode.coreMachine.destroyed) {
  if (system.inRadius(center, system.mode.coreMachine.position, radius)) {
    system.mode.coreMachine.heal(amount);
  }
}
for (const turret of system.turrets.values()) {
  if (turret.destroyed || turret === support) continue;
  if (system.inRadius(center, turret.group.position, radius)) turret.heal(amount);
}
for (const ally of system.allies) {
  if (ally.destroyed) continue;
  if (system.inRadius(center, ally.position, radius)) ally.heal(amount);
}
}

export function shieldAround(system, support, amount, radius) {
if (amount <= 0 || radius <= 0) return;
const center = support.group.position;

if (system.mode && system.mode.coreMachine && !system.mode.coreMachine.destroyed) {
  if (system.inRadius(center, system.mode.coreMachine.position, radius)) {
    system.mode.coreMachine.applyShield(amount);
  }
}
for (const turret of system.turrets.values()) {
  if (turret.destroyed) continue;
  if (system.inRadius(center, turret.group.position, radius)) turret.applyShield(amount);
}
for (const ally of system.allies) {
  if (ally.destroyed) continue;
  if (system.inRadius(center, ally.position, radius)) ally.applyShield(amount);
}
}
