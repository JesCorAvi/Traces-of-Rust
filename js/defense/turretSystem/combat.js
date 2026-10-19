// Daño de torretas y utilidades de radio.
// Exports: damageEnemy, damageArea, inRadius.

export function damageEnemy(system, enemy, amount, source) {
if (!enemy || !enemy.active || enemy.state === 'dead' || amount <= 0) return;
let mult = 1;
if (source && source.stats) {
  if (enemy.stunTimer > 0) mult *= source.stats.frozenDamageMult || 1;
  if (enemy.slowTimer > 0 || enemy.stunTimer > 0) mult *= source.stats.brittleMult || 1;
}
if (system.ctx) system.ctx.damageEnemy(enemy, amount * mult, null, true);
}

export function damageArea(system, center, radius, amount, source) {
if (!system.ctx || radius <= 0 || amount <= 0) return;
const enemies = system.ctx.enemyPool.active;
for (let i = 0; i < enemies.length; i++) {
  const enemy = enemies[i];
  if (!enemy.active || enemy.state === 'dead') continue;
  if (system.inRadius(center, enemy.group.position, radius)) {
    system.damageEnemy(enemy, amount, source);
  }
}
}

export function inRadius(a, b, radius) {
const dx = a.x - b.x;
const dz = a.z - b.z;
if (Math.hypot(dx, dz) > radius) return false;
return Math.abs(a.y - b.y) <= 3.8;
}
