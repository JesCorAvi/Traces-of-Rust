// Comprueba si un punto invade rutas de defensa o compuertas de aparición.
// Protege los corredores de todas las dificultades (Fácil, Normal, Difícil) para que
// cajas, barriles y pilares del mundo nunca bloqueen los caminos de los enemigos.
// Exports: isNearDefenseRouteOrSpawn.

import { distancePointToSegment } from '../utils/routeMath.js';

// Corredores maestros protegidos para todas las dificultades
const DEFENSE_CORRIDORS = [
  // Fácil (Vía Principal con Loop central)
  [
    { x: 0, z: -44 }, { x: 6, z: -38 }, { x: 14, z: -30 }, { x: 12, z: -20 }, { x: 6, z: -14 },
    { x: 0, z: -8 }, { x: -9, z: -2 }, { x: -10, z: 8 }, { x: 0, z: 14 }, { x: 10, z: 8 },
    { x: 9, z: -2 }, { x: 0, z: -6 }, { x: -6, z: 2 }, { x: -10, z: 16 }, { x: -8, z: 26 },
    { x: -4, z: 36 }, { x: 0, z: 44 }
  ],
  // Normal (Conducto Oeste)
  [
    { x: -44, z: -16 }, { x: -34, z: -14 }, { x: -22, z: -12 }, { x: -12, z: -10 },
    { x: -8, z: 0 }, { x: -10, z: 12 }, { x: -8, z: 24 }, { x: -4, z: 34 }, { x: 0, z: 44 }
  ],
  // Normal (Pasarela Este)
  [
    { x: 44, z: -16 }, { x: 34, z: -14 }, { x: 22, z: -12 }, { x: 12, z: -10 },
    { x: 8, z: 0 }, { x: 10, z: 12 }, { x: 8, z: 24 }, { x: 4, z: 34 }, { x: 0, z: 44 }
  ],
  // Difícil (Línea Alfa NW-SE)
  [
    { x: -38, z: -44 }, { x: -26, z: -30 }, { x: -14, z: -18 }, { x: -4, z: -6 },
    { x: 6, z: 6 }, { x: 16, z: 18 }, { x: 28, z: 30 }, { x: 38, z: 44 }
  ],
  // Difícil (Línea Beta NE-SW)
  [
    { x: 38, z: -44 }, { x: 26, z: -30 }, { x: 14, z: -18 }, { x: 4, z: -6 },
    { x: -6, z: 6 }, { x: -16, z: 18 }, { x: -28, z: 30 }, { x: -38, z: 44 }
  ]
];

const SPAWN_GATES = [
  { x: 0, z: -44 },
  { x: -44, z: -16 },
  { x: 44, z: -16 },
  { x: -38, z: -44 },
  { x: 38, z: -44 },
  { x: 0, z: 44 },
  { x: -38, z: 44 },
  { x: 38, z: 44 }
];

export function isNearDefenseRouteOrSpawn(x, z) {
  const clearance = 3.6; // Despeje suficiente para que las cajas actúen como paredes laterales y no bloqueen los carriles

  for (const corridor of DEFENSE_CORRIDORS) {
    for (let i = 0; i < corridor.length - 1; i++) {
      if (distancePointToSegment(x, z, corridor[i], corridor[i + 1]) < clearance) {
        return true;
      }
    }
  }

  for (const sp of SPAWN_GATES) {
    if (Math.hypot(x - sp.x, z - sp.z) < 5.8) return true;
  }

  return false;
}
