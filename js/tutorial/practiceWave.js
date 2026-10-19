// Oleada de práctica del tutorial de Defensa: spawns limitados y comprobación de limpieza.
// Exports: PracticeWave.

const MAX_DURATION = 45;

export class PracticeWave {
  constructor(cfg) {
    this.cfg = cfg;
    this.enemies = [];
    this.spawned = 0;
    this.spawnTimer = 0;
    this.elapsed = 0;
  }

  reset() {
    this.enemies = [];
    this.spawned = 0;
    this.spawnTimer = 0.3;
    this.elapsed = 0;
  }

  // Devuelve true cuando la oleada ha terminado (todos abatidos o tiempo agotado).
  update(dt, ctx, mode) {
    const total = this.cfg.practiceEnemyCount || 6;
    this.elapsed += dt;

    if (this.spawned < total) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnTimer = 0.8;
        this.spawnEnemy(ctx, mode);
      }
    }

    let allCleared = true;
    for (const enemy of this.enemies) {
      if (!enemy._tutorialCleared) {
        if (!enemy.active || enemy.state === 'dead') {
          enemy._tutorialCleared = true;
        } else {
          allCleared = false;
        }
      }
    }

    if (this.spawned >= total && allCleared) return true;

    // Seguridad: si algo se atasca, no bloquear el tutorial indefinidamente
    if (this.elapsed > MAX_DURATION) {
      this.clear(ctx);
      return true;
    }

    return false;
  }

  spawnEnemy(ctx, mode) {
    const total = this.cfg.practiceEnemyCount || 6;
    if (this.spawned >= total) return;

    const pathSystem = mode.pathSystem;
    const wp = pathSystem ? pathSystem.getWaypoint('path_north', 5) : { x: 0, y: 0, z: -12 };

    const enemy = ctx.enemyPool.spawn(
      'zombie',
      ctx.playerGroup.position,
      ctx.gameTime,
      ctx.camFwd,
      ctx.worldPhysics,
      null,
      {
        isDefenseMode: true,
        routeId: 'path_north',
        pathSystem,
        hpMult: 0.55,
        dmgMult: 0.4,
        spdMult: 0.85
      }
    );

    if (!enemy) return;
    this.spawned++;
    enemy.group.position.set(
      wp.x + (Math.random() - 0.5) * 1.6,
      wp.y,
      wp.z + (Math.random() - 0.5) * 1.2
    );
    if (enemy.defenseAI) {
      enemy.defenseAI.waypointIdx = 6;
      enemy.defenseAI.profile = {
        ...enemy.defenseAI.profile,
        coreDamage: 2,
        detectRadius: 5.0,
        abandonRadius: 7.0
      };
    }
    enemy._tutorialCleared = false;
    this.enemies.push(enemy);
  }

  clear(ctx) {
    if (!ctx || !ctx.damageEnemy) return;
    for (const enemy of this.enemies) {
      if (!enemy._tutorialCleared && enemy.active && enemy.state !== 'dead') {
        ctx.damageEnemy(enemy, 999999, null, true);
      }
      enemy._tutorialCleared = true;
    }
  }
}
