// Comprueba si un punto invade rutas de defensa o compuertas de aparición.
// Exports: isNearDefenseRouteOrSpawn.

import { CORE_DEFENSE_CONFIG } from '../config/coreDefenseConfig.js';

export function isNearDefenseRouteOrSpawn(x, z) {
  const routes = CORE_DEFENSE_CONFIG.PATHS.ROUTES;
  const clearance = CORE_DEFENSE_CONFIG.PATHS.corridorClearanceRadius || 2.8;

  for (const route of Object.values(routes)) {
    const wps = route.waypoints;
    for (let i = 0; i < wps.length - 1; i++) {
      const ax = wps[i].x, az = wps[i].z;
      const bx = wps[i + 1].x, bz = wps[i + 1].z;
      const abx = bx - ax, abz = bz - az;
      const lenSq = abx * abx + abz * abz || 1;
      const t = Math.max(0, Math.min(1, ((x - ax) * abx + (z - az) * abz) / lenSq));
      const px = ax + t * abx;
      const pz = az + t * abz;
      if (Math.hypot(x - px, z - pz) < clearance) return true;
    }
  }

  for (const sp of CORE_DEFENSE_CONFIG.SPAWN_POINTS) {
    if (Math.hypot(x - sp.position.x, z - sp.position.z) < 5.5) return true;
  }

  return false;
}
