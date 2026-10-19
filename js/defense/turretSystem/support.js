// Soporte del Taller: buffs, curación y escudos.
// Exports: applySupportBuffs, healAround, shieldAround.

export function applySupportBuffs(system, ctx) {
const core = system.mode ? system.mode.coreMachine : null;

for (const turret of system.turrets.values()) {
  turret.supportFireRateBonus = 0;
  turret.supportDamageBonus = 0;
  turret.damageReduction = 0;
}
if (core && !core.destroyed) core.damageReduction = 0;

for (const support of system.turrets.values()) {
  if (support.cfg.id !== 'support' || support.destroyed) continue;
  const s = support.stats;
  const radius = s.healRadius || 12;
  const burstBonus = support.burstActive > 0 ? (s.overclockBurst || 0) : 0;
  const fireBuff = (s.buffFireRate || 0) + burstBonus;
  const dmgBuff = s.buffDamage || 0;
  const armor = s.auraArmor || 0;

  for (const turret of system.turrets.values()) {
    if (turret === support || turret.destroyed) continue;
    if (!system.inRadius(support.group.position, turret.group.position, radius)) continue;
    turret.supportFireRateBonus = Math.min(1.5, turret.supportFireRateBonus + fireBuff);
    turret.supportDamageBonus = Math.min(1.0, turret.supportDamageBonus + dmgBuff);
    turret.damageReduction = Math.min(0.6, turret.damageReduction + armor);
  }

  if (core && !core.destroyed && system.inRadius(support.group.position, core.position, radius)) {
    core.damageReduction = Math.min(0.6, core.damageReduction + armor);
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
