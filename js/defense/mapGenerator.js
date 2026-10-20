// Generador de mapas y rutas para el modo Defensa (estilo Bloons TD 6).
// Rutas orgánicas adaptadas al terreno: bordean estructuras o suben por ellas si es necesario.
// En difícil los carriles van por flancos separados sin cruzarse.
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
    desc: 'NORMAL: 2 Entradas · 1 Salida · 100 Vidas · 10 Chatarra · 2 carriles convergentes'
  },
  dificil: {
    id: 'dificil',
    name: 'DIFÍCIL',
    maxLives: 75,
    startingScrap: 10,
    entrances: 2,
    exits: 2,
    desc: 'DIFÍCIL: 2 Entradas · 2 Salidas · 75 Vidas · 10 Chatarra · 2 frentes independientes sin cruce'
  }
};

/**
 * Genera una secuencia suave y densa de waypoints usando interpolación Catmull-Rom.
 * Consulta la altura de superficie real del mundo para que si pasa sobre una estructura o rampa
 * el carril suba por encima con pendiente suave en lugar de cortarla por debajo.
 */
function buildSplineRoute(controlPoints, worldPhysics, sampleCount = 65) {
  const pts = controlPoints.map(p => new THREE.Vector3(p.x, p.y || 0, p.z));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.28);
  const rawPoints = curve.getPoints(sampleCount);

  // Muestrear altura de superficie real en cada punto (suelo o techo de plataforma)
  const surfaceHeights = rawPoints.map(p => {
    return worldPhysics ? worldPhysics.getGroundHeight(p.x, p.z, 0, true) : (p.y || 0);
  });

  // Suavizado de altura para que transiciones sobre rampas o bordes sean continuas y naturales
  const smoothHeights = [...surfaceHeights];
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 1; i < smoothHeights.length - 1; i++) {
      const avg = (smoothHeights[i - 1] + smoothHeights[i] * 2 + smoothHeights[i + 1]) / 4;
      smoothHeights[i] = Math.max(surfaceHeights[i], avg);
    }
  }

  return rawPoints.map((p, i) => ({
    x: Math.round(p.x * 100) / 100,
    y: Math.round(smoothHeights[i] * 100) / 100,
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
    // Estilo Bloons TD 6: Entrada bordeando la plataforma norte por el este,
    // gran bucle central de 360° en el patio despejado y descenso bordeando
    // la plataforma sur por el oeste hacia la compuerta sur. Cero colisiones con estructuras.
    // ------------------------------------------------------------------------
    const controlPoints = [
      { x: 0, z: -44 },
      { x: 10, z: -38 },
      { x: 14, z: -28 },
      { x: 11, z: -19 },
      { x: 6, z: -10 },
      // Entrada al bucle central (360°) en patio central despejado
      { x: 0, z: -3 },
      { x: -8, z: 2 },
      { x: -9, z: 10 },
      { x: 0, z: 14 },
      { x: 9, z: 10 },
      { x: 8, z: 2 },
      { x: 0, z: 1 },
      // Salida del bucle bordeando la plataforma sur por el pasillo oeste
      { x: -12, z: 6 },
      { x: -14, z: 18 },
      { x: -14, z: 28 },
      { x: -12, z: 35 },
      { x: -7, z: 41 },
      { x: 0, z: 44 }
    ];

    const waypoints = buildSplineRoute(controlPoints, worldPhysics, 75);

    routes.path_main = {
      id: 'path_main',
      name: 'Vía Principal',
      color: 0x00e5ff,
      waypoints
    };

    spawnPoints.push({
      id: 'sp_north',
      name: 'COMPUERTA NORTE // ENTRADA',
      position: { x: waypoints[0].x, y: waypoints[0].y, z: waypoints[0].z },
      pathId: 'path_main',
      color: 0x00e5ff
    });

    exitPoints.push({
      id: 'exit_south',
      name: 'ZONA DE EVACUACIÓN SUR // SALIDA',
      position: { x: waypoints[waypoints.length - 1].x, y: waypoints[waypoints.length - 1].y, z: waypoints[waypoints.length - 1].z },
      pathId: 'path_main',
      color: 0xff3b16
    });

  } else if (diff.id === 'normal') {
    // ------------------------------------------------------------------------
    // MODO NORMAL: 2 Entradas (Noroeste y Noreste) -> 1 Salida (Sur)
    // Los carriles se acercan en el patio central formando un tramo paralelo a solo 7.6m
    // para crear un cuello de botella estratégico donde las torretas cubren ambos frentes.
    // Cero colisiones con estructuras y plataformas.
    // ------------------------------------------------------------------------
    const controlWest = [
      { x: -24, z: -44 },
      { x: -20, z: -32 },
      { x: -15, z: -20 },
      { x: -6, z: -8 },
      // Tramo paralelo central (x = -3.8m, muy cercano a la pasarela este en x = +3.8m)
      { x: -3.8, z: 0 },
      { x: -3.8, z: 12 },
      { x: -6, z: 18 },
      // Rodeo de la plataforma sur hacia la salida
      { x: -13, z: 26 },
      { x: -13, z: 35 },
      { x: -7, z: 41 },
      { x: 0, z: 44 }
    ];

    const controlEast = [
      { x: 24, z: -44 },
      { x: 18, z: -32 },
      { x: 11, z: -21 },
      { x: 6, z: -8 },
      // Tramo paralelo central (x = +3.8m, facilita la defensa con torretas de área)
      { x: 3.8, z: 0 },
      { x: 3.8, z: 12 },
      { x: 6, z: 18 },
      // Rodeo de la plataforma sur hacia la salida
      { x: 13, z: 26 },
      { x: 13, z: 35 },
      { x: 7, z: 41 },
      { x: 0, z: 44 }
    ];

    const wpWest = buildSplineRoute(controlWest, worldPhysics, 70);
    const wpEast = buildSplineRoute(controlEast, worldPhysics, 70);

    routes.path_west = {
      id: 'path_west',
      name: 'Conducto Oeste',
      color: 0xffc107,
      waypoints: wpWest
    };

    routes.path_east = {
      id: 'path_east',
      name: 'Pasarela Este',
      color: 0xff3366,
      waypoints: wpEast
    };

    spawnPoints.push({
      id: 'sp_west',
      name: 'COMPUERTA NOROESTE // ENTRADA OESTE',
      position: { x: wpWest[0].x, y: wpWest[0].y, z: wpWest[0].z },
      pathId: 'path_west',
      color: 0xffc107
    });

    spawnPoints.push({
      id: 'sp_east',
      name: 'COMPUERTA NORESTE // ENTRADA ESTE',
      position: { x: wpEast[0].x, y: wpEast[0].y, z: wpEast[0].z },
      pathId: 'path_east',
      color: 0xff3366
    });

    exitPoints.push({
      id: 'exit_south',
      name: 'SALIDA INDUSTRIAL // EVACUACIÓN',
      position: { x: wpWest[wpWest.length - 1].x, y: wpWest[wpWest.length - 1].y, z: wpWest[wpWest.length - 1].z },
      pathId: 'path_west',
      color: 0xff3b16
    });

  } else {
    // ------------------------------------------------------------------------
    // MODO DIFÍCIL: 2 Entradas -> 2 Salidas (DOS FRENTES INDEPENDIENTES SIN CRUCE)
    // Los carriles NO se cruzan para evitar que sea fácil defenderlos en el centro:
    // Línea Alfa: Noroeste -> desciende por todo el flanco oeste (x <= -36) -> Suroeste
    // Línea Beta: Noreste -> desciende por todo el flanco este (x >= +36) -> Sureste
    // Separados por más de 70 metros. Cero colisión con plataformas.
    // ------------------------------------------------------------------------
    const controlAlpha = [
      { x: -42, z: -44 },
      { x: -43, z: -26 },
      { x: -41, z: -10 },
      { x: -36, z: 4 },
      { x: -36, z: 18 },
      { x: -37, z: 30 },
      { x: -40, z: 38 },
      { x: -42, z: 44 }
    ];

    const controlBeta = [
      { x: 42, z: -44 },
      { x: 43, z: -26 },
      { x: 41, z: -10 },
      { x: 36, z: 4 },
      { x: 36, z: 18 },
      { x: 37, z: 30 },
      { x: 40, z: 38 },
      { x: 42, z: 44 }
    ];

    const wpAlpha = buildSplineRoute(controlAlpha, worldPhysics, 65);
    const wpBeta = buildSplineRoute(controlBeta, worldPhysics, 65);

    routes.path_alpha = {
      id: 'path_alpha',
      name: 'Flanco Oeste (NW-SW)',
      color: 0xff7700,
      waypoints: wpAlpha
    };

    routes.path_beta = {
      id: 'path_beta',
      name: 'Flanco Este (NE-SE)',
      color: 0xd946ef,
      waypoints: wpBeta
    };

    spawnPoints.push({
      id: 'sp_alpha',
      name: 'COMPUERTA NOROESTE // ENTRADA ALFA',
      position: { x: wpAlpha[0].x, y: wpAlpha[0].y, z: wpAlpha[0].z },
      pathId: 'path_alpha',
      color: 0xff7700
    });

    spawnPoints.push({
      id: 'sp_beta',
      name: 'COMPUERTA NORESTE // ENTRADA BETA',
      position: { x: wpBeta[0].x, y: wpBeta[0].y, z: wpBeta[0].z },
      pathId: 'path_beta',
      color: 0xd946ef
    });

    exitPoints.push({
      id: 'exit_sw',
      name: 'BRECHA SUROESTE // SALIDA ALFA',
      position: { x: wpAlpha[wpAlpha.length - 1].x, y: wpAlpha[wpAlpha.length - 1].y, z: wpAlpha[wpAlpha.length - 1].z },
      pathId: 'path_alpha',
      color: 0xff3b16
    });

    exitPoints.push({
      id: 'exit_se',
      name: 'BRECHA SURESTE // SALIDA BETA',
      position: { x: wpBeta[wpBeta.length - 1].x, y: wpBeta[wpBeta.length - 1].y, z: wpBeta[wpBeta.length - 1].z },
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
