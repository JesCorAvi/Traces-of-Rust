// Bucle común de actualización y liberación de enemigos activos.
// Exports: updateEnemies.

export function updateEnemies(enemyPool, dt, playerPos, camFwd, cameraPos, worldPhysics, callbacks) {
  const active = enemyPool.active;
  for (let i = active.length - 1; i >= 0; i--) {
    const enemy = active[i];
    const finishedDeath = enemy.update(dt, playerPos, camFwd, cameraPos, worldPhysics, callbacks);
    if (finishedDeath) enemyPool.release(i);
  }
}
