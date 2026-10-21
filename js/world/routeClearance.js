// Comprueba si un punto invade rutas de defensa o compuertas de aparición.
// Protege dinámicamente los corredores de TODOS los mapas del catálogo (18 mapas)
// para que cajas, barriles y pilares del mundo nunca bloqueen los caminos de los enemigos.
// Exports: isNearDefenseRouteOrSpawn.

import { distancePointToSegment } from '../utils/routeMath.js';
import { MAP_CATALOG } from '../defense/mapCatalog.js';

// Extraer dinámicamente todos los corredores y compuertas del catálogo maestro
const DEFENSE_CORRIDORS = [];
const SPAWN_GATES = [];

for (const mapDef of Object.values(MAP_CATALOG || {})) {
  if (mapDef.routes) {
    for (const route of Object.values(mapDef.routes)) {
      if (Array.isArray(route.controlPoints) && route.controlPoints.length >= 2) {
        DEFENSE_CORRIDORS.push(route.controlPoints);
        SPAWN_GATES.push(route.controlPoints[0]);
        SPAWN_GATES.push(route.controlPoints[route.controlPoints.length - 1]);
      }
    }
  }
}

export function isNearDefenseRouteOrSpawn(x, z, customClearance = null) {
  const clearance = customClearance || 3.4;

  for (let c = 0; c < DEFENSE_CORRIDORS.length; c++) {
    const corridor = DEFENSE_CORRIDORS[c];
    for (let i = 0; i < corridor.length - 1; i++) {
      if (distancePointToSegment(x, z, corridor[i], corridor[i + 1]) < clearance) {
        return true;
      }
    }
  }

  for (let s = 0; s < SPAWN_GATES.length; s++) {
    const sp = SPAWN_GATES[s];
    if (Math.hypot(x - sp.x, z - sp.z) < 4.8) return true;
  }

  return false;
}
