// Pool de enemigos reutilizables con spawn/release y prioridad para bosses.
// Exports: EnemyPool.

import { CONFIG } from '../config.js';
import { Enemy } from './enemy.js';

export class EnemyPool {
  constructor(scene, maxCount = CONFIG.DIFFICULTY.MAX_ACTIVE_ENEMIES) {
    this.pool = [];
    this.active = [];
    for (let i = 0; i < maxCount; i++) {
      this.pool.push(new Enemy(scene));
    }
  }

  spawn(type, playerPos, gameTime, playerFwd, worldPhysics, bossCfg = null, defenseOpts = null) {
    let enemy = this.pool.pop();
    if (!enemy) {
      if (bossCfg) {
        const idx = this.active.findIndex(e => !e.isBoss);
        if (idx !== -1) {
          enemy = this.active.splice(idx, 1)[0];
        }
      }
      if (!enemy) return null;
    }
    enemy.init(type, playerPos, gameTime, playerFwd, worldPhysics, bossCfg, defenseOpts);
    this.active.push(enemy);
    return enemy;
  }

  release(index) {
    const enemy = this.active[index];
    enemy.active = false;
    enemy.defenseAI = null;
    enemy.group.visible = false;
    this.active.splice(index, 1);
    this.pool.push(enemy);
  }

  clearAll() {
    while (this.active.length > 0) {
      this.release(this.active.length - 1);
    }
  }
}
