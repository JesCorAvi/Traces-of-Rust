// Generador de mapas y rutas para el modo Defensa (estilo Bloons TD 6).
// Rutas orgánicas a ras de suelo por corredores despejados, con loops y arcos suaves.
// Exports: DIFFICULTIES, generateProceduralMap.

import * as THREE from 'three';

export const DIFFICULTIES = {
  facil: {
    id: 'facil',
    name: 'FÁCIL',
    maxLives: 150,
    startingScrap: 10,
    entrances: 1,
    exits: 1,
    desc: 'FÁCIL: 1 Entrada · 1 Salida · 150 Vidas · 10 Chatarra · Loop central'
  },
  normal: {
    id: 'normal',
    name: 'NORMAL',
    maxLives: 100,
    startingScrap: 10,
    entrances: 2,
    exits: 1,
    desc: 'NORMAL: 2 Entradas · 1 Salida · 100 Vidas · 10 Chatarra · 2 carriles revirados'
  },
  dificil: {
    id: 'dificil',
    name: 'DIFÍCIL',
    maxLives: 75,
    startingScrap: 10,
    entrances: 2,
    exits: 2,
    desc: 'DIFÍCIL: 2 Entradas · 2 Salidas · 75 Vidas · 10 Chatarra · Carriles cruzados en X'
  }
};

/**
 * Genera una secuencia suave y densa de waypoints usando interpolación Catmull-Rom.
 * Todas las rutas se mantienen en la cota de suelo natural (y = 0.0) evitando trepar
 * por encima de cajas u obstáculos.
 */
function buildSplineRoute(controlPoints, sampleCount = 65) {
  const pts = controlPoints.map(p => new THREE.Vector3(p.x, 0, p.z));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.28);
  const rawPoints = curve.getPoints(sampleCount);

  return rawPoints.map(p => ({
    x: Math.round(p.x * 100) / 100,
    y: 0.0,
    z: Math.round(p.z * 100) / 100
  }));
}

export function generateProceduralMap(diffKey = 'normal', worldPhysics = null) {
  const diff = DIFFICULTIES[diffKey] || DIFFICULTIES.normal;
  const routes = {};
  const spawnPoints = [];
  const exitPoints = [];

  if (diff.id === 'facil') {
    // ------------------------------------------------------------------------
    // MODO FÁCIL: 1 Entrada (Norte) -> 1 Salida (Sur)
    // Estilo Bloons TD 6: Entrada sinuosa por el corredor este, gran bucle
    // completo de 360° en el patio central (donde colocar las defensas nucleares)
    // y salida serpenteante hacia el sur.
    // ------------------------------------------------------------------------
    const controlPoints = [
      { x: 0, z: -44 },
      { x: 6, z: -38 },
      { x: 14, z: -30 },
      { x: 12, z: -20 },
      { x: 6, z: -14 },
      // Entrada al bucle central (360°)
      { x: 0, z: -8 },
      { x: -9, z: -2 },
      { x: -10, z: 8 },
      { x: 0, z: 14 },
      { x: 10, z: 8 },
      { x: 9, z: -2 },
      { x: 0, z: -6 },
      // Salida del bucle hacia el sur
      { x: -6, z: 2 },
      { x: -10, z: 16 },
      { x: -8, z: 26 },
      { x: -4, z: 36 },
      { x: 0, z: 44 }
    ];

    const waypoints = buildSplineRoute(controlPoints, 75);

    routes.path_main = {
      id: 'path_main',
      name: 'Vía Principal',
      color: 0x4aa3df,
      waypoints
    };

    spawnPoints.push({
      id: 'sp_north',
      name: 'COMPUERTA NORTE // ENTRADA',
      position: { x: waypoints[0].x, y: 0, z: waypoints[0].z },
      pathId: 'path_main',
      color: 0x4aa3df
    });

    exitPoints.push({
      id: 'exit_south',
      name: 'ZONA DE EVACUACIÓN SUR // SALIDA',
      position: { x: waypoints[waypoints.length - 1].x, y: 0, z: waypoints[waypoints.length - 1].z },
      pathId: 'path_main',
      color: 0xff3b16
    });

  } else if (diff.id === 'normal') {
    // ------------------------------------------------------------------------
    // MODO NORMAL: 2 Entradas (Oeste y Este) -> 1 Salida (Sur)
    // 2 carriles fluidos que bordean las estructuras y convergen en la salida sur.
    // ------------------------------------------------------------------------
    const controlWest = [
      { x: -44, z: -16 },
      { x: -34, z: -14 },
      { x: -22, z: -12 },
      { x: -12, z: -10 },
      { x: -8, z: 0 },
      { x: -10, z: 12 },
      { x: -8, z: 24 },
      { x: -4, z: 34 },
      { x: 0, z: 44 }
    ];

    const controlEast = [
      { x: 44, z: -16 },
      { x: 34, z: -14 },
      { x: 22, z: -12 },
      { x: 12, z: -10 },
      { x: 8, z: 0 },
      { x: 10, z: 12 },
      { x: 8, z: 24 },
      { x: 4, z: 34 },
      { x: 0, z: 44 }
    ];

    const wpWest = buildSplineRoute(controlWest, 65);
    const wpEast = buildSplineRoute(controlEast, 65);

    routes.path_west = {
      id: 'path_west',
      name: 'Conducto Oeste',
      color: 0xb89c46,
      waypoints: wpWest
    };

    routes.path_east = {
      id: 'path_east',
      name: 'Pasarela Este',
      color: 0xc42020,
      waypoints: wpEast
    };

    spawnPoints.push({
      id: 'sp_west',
      name: 'COMPUERTA OESTE // ENTRADA',
      position: { x: wpWest[0].x, y: 0, z: wpWest[0].z },
      pathId: 'path_west',
      color: 0xb89c46
    });

    spawnPoints.push({
      id: 'sp_east',
      name: 'CONDUCTO ESTE // ENTRADA',
      position: { x: wpEast[0].x, y: 0, z: wpEast[0].z },
      pathId: 'path_east',
      color: 0xc42020
    });

    exitPoints.push({
      id: 'exit_south',
      name: 'SALIDA INDUSTRIAL // EVACUACIÓN',
      position: { x: wpWest[wpWest.length - 1].x, y: 0, z: wpWest[wpWest.length - 1].z },
      pathId: 'path_west',
      color: 0xff3b16
    });

  } else {
    // ------------------------------------------------------------------------
    // MODO DIFÍCIL: 2 Entradas -> 2 Salidas
    // Dos rutas diagonales en X que cruzan la plaza central.
    // ------------------------------------------------------------------------
    const controlAlpha = [
      { x: -38, z: -44 },
      { x: -26, z: -30 },
      { x: -14, z: -18 },
      { x: -4, z: -6 },
      { x: 6, z: 6 },
      { x: 16, z: 18 },
      { x: 28, z: 30 },
      { x: 38, z: 44 }
    ];

    const controlBeta = [
      { x: 38, z: -44 },
      { x: 26, z: -30 },
      { x: 14, z: -18 },
      { x: 4, z: -6 },
      { x: -6, z: 6 },
      { x: -16, z: 18 },
      { x: -28, z: 30 },
      { x: -38, z: 44 }
    ];

    const wpAlpha = buildSplineRoute(controlAlpha, 65);
    const wpBeta = buildSplineRoute(controlBeta, 65);

    routes.path_alpha = {
      id: 'path_alpha',
      name: 'Línea Alfa (NW-SE)',
      color: 0xd95326,
      waypoints: wpAlpha
    };

    routes.path_beta = {
      id: 'path_beta',
      name: 'Línea Beta (NE-SW)',
      color: 0x9b59b6,
      waypoints: wpBeta
    };

    spawnPoints.push({
      id: 'sp_alpha',
      name: 'COMPUERTA NOROESTE // ENTRADA ALFA',
      position: { x: wpAlpha[0].x, y: 0, z: wpAlpha[0].z },
      pathId: 'path_alpha',
      color: 0xd95326
    });

    spawnPoints.push({
      id: 'sp_beta',
      name: 'COMPUERTA NORESTE // ENTRADA BETA',
      position: { x: wpBeta[0].x, y: 0, z: wpBeta[0].z },
      pathId: 'path_beta',
      color: 0x9b59b6
    });

    exitPoints.push({
      id: 'exit_se',
      name: 'BRECHA SURESTE // SALIDA ALFA',
      position: { x: wpAlpha[wpAlpha.length - 1].x, y: 0, z: wpAlpha[wpAlpha.length - 1].z },
      pathId: 'path_alpha',
      color: 0xff3b16
    });

    exitPoints.push({
      id: 'exit_sw',
      name: 'BRECHA SUROESTE // SALIDA BETA',
      position: { x: wpBeta[wpBeta.length - 1].x, y: 0, z: wpBeta[wpBeta.length - 1].z },
      pathId: 'path_beta',
      color: 0xff3b16
    });
  }

  return {
    difficulty: diff.id,
    maxLives: diff.maxLives,
    startingScrap: diff.startingScrap,
    routes,
    spawnPoints,
    exitPoints,
    playerStartPos: { x: 0, y: 0, z: 0 }
  };
}
