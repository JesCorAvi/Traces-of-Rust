// Comprueba si un punto invade rutas de defensa o compuertas de aparición.
// Protege los corredores de todas las dificultades (Fácil, Normal, Difícil) para que
// cajas, barriles y pilares del mundo nunca bloqueen los caminos de los enemigos.
// Exports: isNearDefenseRouteOrSpawn.

import { distancePointToSegment } from '../utils/routeMath.js';

// Corredores maestros protegidos para todas las dificultades
const DEFENSE_CORRIDORS = [
  // Fácil (Vía Principal con Loop central y rodeo de plataformas)
  [
    { x: 0, z: -44 }, { x: 10, z: -38 }, { x: 14, z: -28 }, { x: 11, z: -19 }, { x: 6, z: -10 },
    { x: 0, z: -3 }, { x: -8, z: 2 }, { x: -9, z: 10 }, { x: 0, z: 14 }, { x: 9, z: 10 },
    { x: 8, z: 2 }, { x: 0, z: 1 }, { x: -12, z: 6 }, { x: -14, z: 18 }, { x: -14, z: 28 },
    { x: -12, z: 35 }, { x: -7, z: 41 }, { x: 0, z: 44 }
  ],
  // Normal (Conducto Oeste con tramo paralelo central)
  [
    { x: -24, z: -44 }, { x: -20, z: -32 }, { x: -15, z: -20 }, { x: -6, z: -8 },
    { x: -3.8, z: 0 }, { x: -3.8, z: 12 }, { x: -6, z: 18 },
    { x: -13, z: 26 }, { x: -13, z: 35 }, { x: -7, z: 41 }, { x: 0, z: 44 }
  ],
  // Normal (Pasarela Este con tramo paralelo central)
  [
    { x: 24, z: -44 }, { x: 18, z: -32 }, { x: 11, z: -21 }, { x: 6, z: -8 },
    { x: 3.8, z: 0 }, { x: 3.8, z: 12 }, { x: 6, z: 18 },
    { x: 13, z: 26 }, { x: 13, z: 35 }, { x: 7, z: 41 }, { x: 0, z: 44 }
  ],
  // Difícil (Línea Alfa - Flanco Oeste independiente, sin cruce)
  [
    { x: -42, z: -44 }, { x: -43, z: -26 }, { x: -41, z: -10 }, { x: -36, z: 4 },
    { x: -36, z: 18 }, { x: -37, z: 30 }, { x: -40, z: 38 }, { x: -42, z: 44 }
  ],
  // Difícil (Línea Beta - Flanco Este independiente, sin cruce)
  [
    { x: 42, z: -44 }, { x: 43, z: -26 }, { x: 41, z: -10 }, { x: 36, z: 4 },
    { x: 36, z: 18 }, { x: 37, z: 30 }, { x: 40, z: 38 }, { x: 42, z: 44 }
  ]
];

const SPAWN_GATES = [
  { x: 0, z: -44 },
  { x: -24, z: -44 },
  { x: 24, z: -44 },
  { x: -42, z: -44 },
  { x: 42, z: -44 },
  { x: 0, z: 44 },
  { x: -42, z: 44 },
  { x: 42, z: 44 }
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
