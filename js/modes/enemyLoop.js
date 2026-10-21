// Bucle común de actualización y liberación de enemigos activos.
// Exports: updateEnemies.

export function updateEnemies(enemyPool, dt, playerPos, camFwd, cameraPos, worldPhysics, callbacks) {
  const active = enemyPool.active;
  const targets = Array.isArray(callbacks.playerTargets) ? callbacks.playerTargets : null;

  for (let i = active.length - 1; i >= 0; i--) {
    const enemy = active[i];

    // Host: cada enemigo elige al jugador vivo (local o remoto) más cercano.
    // Cliente: sin playerTargets, persigue a su propio jugador local.
    let targetPos = playerPos;
    let targetAlive = callbacks.playerAlive !== false;
    let targetIsLocal = true;
    if (targets) {
      let best = null;
      let bestDist = Infinity;
      for (let t = 0; t < targets.length; t++) {
        const candidate = targets[t];
        if (!candidate || !candidate.alive || !candidate.position) continue;
        const d = Math.hypot(
          candidate.position.x - enemy.group.position.x,
          candidate.position.z - enemy.group.position.z
        );
        if (d < bestDist) {
          bestDist = d;
          best = candidate;
        }
      }
      if (best) {
        targetPos = best.position;
        targetAlive = true;
        targetIsLocal = !!best.isLocal;
      } else {
        targetAlive = false;
        targetIsLocal = true;
      }
    }
    enemy.netTargetIsLocal = targetIsLocal;

    const prevAlive = callbacks.playerAlive;
    callbacks.playerAlive = targetAlive;
    const finishedDeath = enemy.update(dt, targetPos, camFwd, cameraPos, worldPhysics, callbacks);
    callbacks.playerAlive = prevAlive;

    if (finishedDeath) enemyPool.release(i);
  }
}
