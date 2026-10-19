// Comprueba si un punto invade rutas de defensa o compuertas de aparición.
// Exports: isNearDefenseRouteOrSpawn.

import { CORE_DEFENSE_CONFIG } from '../config/coreDefenseConfig.js';
import { distancePointToSegment } from '../utils/routeMath.js';

export function isNearDefenseRouteOrSpawn(x, z) {
  const routes = CORE_DEFENSE_CONFIG.PATHS.ROUTES;
  const clearance = CORE_DEFENSE_CONFIG.PATHS.corridorClearanceRadius || 2.8;

  for (const route of Object.values(routes)) {
    const wps = route.waypoints;
    for (let i = 0; i < wps.length - 1; i++) {
      if (distancePointToSegment(x, z, wps[i], wps[i + 1]) < clearance) return true;
    }
  }

  for (const sp of CORE_DEFENSE_CONFIG.SPAWN_POINTS) {
    if (Math.hypot(x - sp.position.x, z - sp.position.z) < 5.5) return true;
  }

  return false;
}
