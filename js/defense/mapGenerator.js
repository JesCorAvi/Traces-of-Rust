// Generador de mapas y rutas para el modo Defensa (estilo Bloons TD 6).
// Soporta 18 mapas (6 en Fácil, 6 en Normal, 6 en Difícil) con spline 3D adaptado al terreno.
// Exports: DIFFICULTIES, generateProceduralMap, MAP_CATALOG, getMapById, getMapsByDifficulty, DEFAULT_MAP_IDS.

import * as THREE from 'three';
import { MAP_CATALOG, getMapById, getMapsByDifficulty, DEFAULT_MAP_IDS } from './mapCatalog.js';

export { MAP_CATALOG, getMapById, getMapsByDifficulty, DEFAULT_MAP_IDS };

export const DIFFICULTIES = {
  facil: {
    id: 'facil',
    name: 'FÁCIL',
    maxLives: 150,
    startingScrap: 10,
    entrances: 1,
    exits: 1,
    desc: 'FÁCIL: 1 Entrada · 1 Salida · 150 Comidas · 10 Madera · Senderos largos con bucles'
  },
  normal: {
    id: 'normal',
    name: 'NORMAL',
    maxLives: 100,
    startingScrap: 10,
    entrances: 2,
    exits: 1,
    desc: 'NORMAL: 2 Entradas · 1 Salida · 100 Comidas · 10 Madera · Senderos convergentes'
  },
  dificil: {
    id: 'dificil',
    name: 'DIFÍCIL',
    maxLives: 75,
    startingScrap: 10,
    entrances: 2,
    exits: 2,
    desc: 'DIFÍCIL: 2 Entradas · 2 Salidas · 75 Comidas · 10 Madera · Frentes simultáneos'
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

  // Muestrear altura estructural real en cada punto (suelo o techo de plataforma/rampa física)
  // Ignora cajas u obstáculos sueltos (structuralOnly = true)
  const surfaceHeights = rawPoints.map(p => {
    const gy = worldPhysics ? worldPhysics.getGroundHeight(p.x, p.z, 0, true, true) : (p.y || 0);
    return gy > 0.05 ? gy : 0;
  });

  // Suavizado lineal de altura únicamente donde existan penconchas de rampas
  const smoothHeights = [...surfaceHeights];
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 1; i < smoothHeights.length - 1; i++) {
      if (surfaceHeights[i] > 0.05 || surfaceHeights[i - 1] > 0.05 || surfaceHeights[i + 1] > 0.05) {
        smoothHeights[i] = (smoothHeights[i - 1] + smoothHeights[i] * 2 + smoothHeights[i + 1]) / 4;
      } else {
        smoothHeights[i] = 0;
      }
    }
  }

  return rawPoints.map((p, i) => ({
    x: Math.round(p.x * 100) / 100,
    y: Math.round(smoothHeights[i] * 100) / 100,
    z: Math.round(p.z * 100) / 100
  }));
}

/**
 * Construye la geometría de ruta, entradas y salidas de una definición del
 * catálogo. Se reutiliza tanto en el modo clásico como en la isla persistente
 * del chiringuito, donde la ruta cambia cada temporada sin recrear la escena.
 */
export function buildRouteLayout(catalogMap, worldPhysics = null) {
  const routes = {};
  const spawnPoints = [];
  const exitPoints = [];
  if (!catalogMap) return { routes, spawnPoints, exitPoints };

  if (catalogMap.routes) {
    Object.entries(catalogMap.routes).forEach(([rId, routeDef]) => {
      const sampleCount = Math.max(50, (routeDef.controlPoints?.length || 10) * 5);
      const waypoints = buildSplineRoute(routeDef.controlPoints, worldPhysics, sampleCount);
      routes[rId] = {
        id: rId,
        name: routeDef.name || rId,
        color: routeDef.color || 0x00e5ff,
        waypoints
      };
    });
  }

  if (catalogMap.spawnPoints) {
    catalogMap.spawnPoints.forEach((sp, idx) => {
      const targetRoute = routes[sp.pathId];
      const startWp = targetRoute?.waypoints?.[0] || { x: 0, y: 0, z: -44 };
      spawnPoints.push({
        id: sp.id || `sp_${idx}`,
        name: sp.name || `COMPUERTA // ENTRADA ${idx + 1}`,
        position: { x: startWp.x, y: startWp.y, z: startWp.z },
        pathId: sp.pathId,
        color: sp.color || targetRoute?.color || 0x00e5ff
      });
    });
  }

  if (catalogMap.exitPoints) {
    catalogMap.exitPoints.forEach((ep, idx) => {
      const targetRoute = routes[ep.pathId];
      const wps = targetRoute?.waypoints;
      const endWp = (wps && wps.length > 0) ? wps[wps.length - 1] : { x: 0, y: 0, z: 44 };
      exitPoints.push({
        id: ep.id || `exit_${idx}`,
        name: ep.name || `PASO // SALIDA ${idx + 1}`,
        position: { x: endWp.x, y: endWp.y, z: endWp.z },
        pathId: ep.pathId,
        color: ep.color || 0xff3b16
      });
    });
  }

  return { routes, spawnPoints, exitPoints };
}

/**
 * Genera o instancia un mapa procedimental de la dificultad o ID especificado.
 * @param {string} diffKey - 'facil' | 'normal' | 'dificil'
 * @param {Object} worldPhysics - Instancia de física del mundo para muestreo de alturas
 * @param {string|null} mapId - ID específico del mapa en MAP_CATALOG (opcional)
 */
export function generateProceduralMap(diffKey = 'normal', worldPhysics = null, mapId = null) {
  const diff = DIFFICULTIES[diffKey] || DIFFICULTIES.normal;
  const targetId = mapId || DEFAULT_MAP_IDS[diff.id] || 'easy_plaza';
  const catalogMap = getMapById(targetId) || getMapById(DEFAULT_MAP_IDS[diff.id]) || MAP_CATALOG.easy_plaza;

  // 1-3. Rutas, entradas y salidas.
  const { routes, spawnPoints, exitPoints } = buildRouteLayout(catalogMap, worldPhysics);

  return {
    mapId: catalogMap.id,
    mapName: catalogMap.name,
    mapBadge: catalogMap.badge,
    mapDesc: catalogMap.desc,
    difficulty: catalogMap.difficulty || diff.id,
    maxLives: catalogMap.maxLives || diff.maxLives,
    startingScrap: catalogMap.startingScrap || diff.startingScrap,
    routes,
    spawnPoints,
    exitPoints,
    playerStartPos: { x: 0, y: 0, z: 0 }
  };
}
