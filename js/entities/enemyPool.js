// Pool de enemigos reutilizables con spawn/release y prioridad para bosses.
// Exports: EnemyPool.

import { CONFIG } from '../config.js';
import { Enemy } from './enemy.js';

export class EnemyPool {
  constructor(scene, maxCount = CONFIG.DIFFICULTY.MAX_ACTIVE_ENEMIES) {
    this.pool = [];
    this.active = [];
    this.net = null;
    this.nextEnemyNetId = 0;
    this.enemiesById = new Map();
    for (let i = 0; i < maxCount; i++) {
      this.pool.push(new Enemy(scene));
    }
  }

  setNetwork(net) {
    this.net = net;
  }

  // En co-op solo el Host crea enemigos reales. El Cliente únicamente
  // instancia réplicas que llegan por ENEMY_SPAWN (fromNetwork).
  canSpawnLocally() {
    return !(this.net?.isMatchActive && !this.net.isHost());
  }

  spawn(type, playerPos, gameTime, playerFwd, worldPhysics, bossCfg = null, defenseOpts = null) {
    const fromNetwork = !!defenseOpts?.fromNetwork;
    if (!fromNetwork && !this.canSpawnLocally()) return null;

    let enemy = this.pool.pop();
    if (!enemy) {
      if (bossCfg) {
        const idx = this.active.findIndex(e => !e.isBoss);
        if (idx !== -1) {
          this.release(idx);
          enemy = this.pool.pop();
        }
      }
      if (!enemy) return null;
    }
    enemy.init(type, playerPos, gameTime, playerFwd, worldPhysics, bossCfg, defenseOpts);

    enemy.isNetworkReplica = fromNetwork;
    enemy.netId = fromNetwork && Number.isFinite(defenseOpts?.netId)
      ? defenseOpts.netId
      : ++this.nextEnemyNetId;
    this.enemiesById.set(enemy.netId, enemy);
    this.active.push(enemy);
    return enemy;
  }

  getByNetId(netId) {
    const enemy = this.enemiesById.get(netId);
    if (!enemy || !enemy.active) return null;
    return enemy;
  }

  release(index) {
    const enemy = this.active[index];
    if (!enemy) return;
    enemy.active = false;
    enemy.bossAI?.destroy();
    enemy.bossAI = null;
    enemy.defenseAI = null;
    enemy.group.visible = false;
    if (enemy.netId !== undefined) this.enemiesById.delete(enemy.netId);
    this.active.splice(index, 1);
    this.pool.push(enemy);
  }

  despawnByNetId(netId) {
    const enemy = this.enemiesById.get(netId);
    if (!enemy) return false;
    const idx = this.active.indexOf(enemy);
    if (idx === -1) {
      this.enemiesById.delete(netId);
      return false;
    }
    this.release(idx);
    return true;
  }

  clearAll() {
    while (this.active.length > 0) {
      this.release(this.active.length - 1);
    }
    this.enemiesById.clear();
  }
}
