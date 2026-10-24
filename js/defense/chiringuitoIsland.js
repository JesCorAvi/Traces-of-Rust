// Isla persistente del chiringuito y selección de rutas temporales.
// La ruta reutiliza los recorridos del catálogo de Defensa, pero el escenario
// (deck, granja y terraza) permanece fijo entre temporadas.
// Exports: ROUTE_POOLS, getRoutePool, getRouteMapById, selectSeasonRoute,
// buildIslandRouteData, isInChiringuitoExclusion, getRoutePoolIds.

import { MAP_CATALOG, getMapById, getMapsByDifficulty } from './mapCatalog.js';
import { buildRouteLayout } from './mapGenerator.js';
import { ISLAND } from '../config/chiringuito/island.js';
import { SEASONS, CAMPAIGN } from '../config/chiringuito/seasons.js';

export const ROUTE_POOLS = {
  facil: getMapsByDifficulty('facil').map(m => m.id),
  normal: getMapsByDifficulty('normal').map(m => m.id),
  dificil: getMapsByDifficulty('dificil').map(m => m.id)
};

export function getRoutePoolIds(difficulty = 'facil') {
  return [...(ROUTE_POOLS[difficulty] || ROUTE_POOLS.facil)];
}

export function getRoutePool(seasonIndex = 0) {
  const season = SEASONS[Math.max(0, Math.min(SEASONS.length - 1, seasonIndex))] || SEASONS[0];
  return getRoutePoolIds(season.routePool || season.difficulty);
}

export function getRouteMapById(mapId) {
  return mapId ? getMapById(mapId) : null;
}

export function selectSeasonRoute(seasonIndex = 0, options = {}) {
  const pool = getRoutePool(seasonIndex);
  if (pool.length === 0) return MAP_CATALOG.easy_plaza;
  const rng = typeof options.rng === 'function' ? options.rng : Math.random;
  const avoidId = options.avoidMapId || null;
  const candidates = pool.length > 1 ? pool.filter(id => id !== avoidId) : pool;
  const usable = candidates.length > 0 ? candidates : pool;
  const pick = usable[Math.floor(Math.max(0, Math.min(0.999999, rng())) * usable.length)];
  return getMapById(pick) || getMapById(pool[0]) || MAP_CATALOG.easy_plaza;
}

export function buildIslandRouteData(routeMapId, worldPhysics = null, seasonIndex = 0) {
  const season = SEASONS[Math.max(0, Math.min(SEASONS.length - 1, seasonIndex))] || SEASONS[0];
  const catalogMap = getRouteMapById(routeMapId) || selectSeasonRoute(seasonIndex);
  const layout = buildRouteLayout(catalogMap, worldPhysics);
  return {
    mapId: ISLAND.id,
    routeId: catalogMap.id,
    routeMapId: catalogMap.id,
    routeName: catalogMap.name,
    routeBadge: catalogMap.badge,
    routeDesc: catalogMap.desc,
    mapName: ISLAND.name,
    mapBadge: ISLAND.badge,
    mapDesc: ISLAND.desc,
    difficulty: catalogMap.difficulty || season.difficulty,
    seasonIndex,
    maxLives: season.pantryMax,
    startingScrap: season.startingScrap,
    routes: layout.routes,
    spawnPoints: layout.spawnPoints,
    exitPoints: layout.exitPoints,
    playerStartPos: {
      x: ISLAND.playerStart.x,
      y: 0,
      z: ISLAND.playerStart.z
    }
  };
}

export function isInChiringuitoExclusion(x, z) {
  const zone = ISLAND.worldExclusion;
  return x >= zone.minX && x <= zone.maxX && z >= zone.minZ && z <= zone.maxZ;
}

export function getSeasonRouteLabel(seasonIndex = 0) {
  const season = SEASONS[Math.max(0, Math.min(SEASONS.length - 1, seasonIndex))] || SEASONS[0];
  return season.label || `Temporada ${season.index + 1}`;
}

export { CAMPAIGN };
