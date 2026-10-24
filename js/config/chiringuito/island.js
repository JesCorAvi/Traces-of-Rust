// Isla persistente del chiringuito: anclas, zonas de construcción y props.
// Exports: ISLAND.
// Las rutas de cangrejos se montan en el centro de la playa (coordenadas
// aproximadas ±44); el resort vive al sur, fuera de esos corredores.

import { FARM_CROPS } from './farm.js';

const FARM_X = -38;
const FARM_Z = 79;
const PLOT_GAP_X = 4.8;
const PLOT_GAP_Z = 6.0;

const farmPlots = FARM_CROPS.map((crop, index) => ({
  id: crop.id,
  ingredientId: crop.ingredientId,
  x: FARM_X + (index % 4) * PLOT_GAP_X,
  z: FARM_Z + Math.floor(index / 4) * PLOT_GAP_Z
}));

export function isInIslandWorldExclusion(x, z) {
  const zone = ISLAND.worldExclusion;
  return x >= zone.minX && x <= zone.maxX && z >= zone.minZ && z <= zone.maxZ;
}

export const ISLAND = {
  id: 'chiringuito_island',
  name: 'La Caleta del Chiringuito',
  badge: 'ISLA BASE // TEMPORADA ABIERTA',
  desc: 'Una cala tranquila, una granja junto a la arena y un chiringuito que crece noche a noche.',
  base: {
    x: 0,
    z: 82,
    deckMinX: -19,
    deckMaxX: 19,
    deckMinZ: 67,
    deckMaxZ: 97,
    deckHeight: 0.32
  },
  playerStart: { x: 0, z: 91.5, yaw: 0 },
  stand: {
    x: 0,
    z: 81,
    counter: { x: 0, z: 78.8 },
    kitchen: { x: -5.2, z: 82.2 },
    pass: { x: -2.4, z: 79.5 },
    menuBoard: { x: -3.6, z: 89.6 },
    bell: { x: 2.8, z: 81.2 }
  },
  farm: {
    center: { x: FARM_X + 7.5, z: FARM_Z + 3 },
    plots: farmPlots,
    harvestRadius: 2.4
  },
  seating: {
    minX: 4.0,
    maxX: 17.0,
    minZ: 70.0,
    maxZ: 94.0,
    baseSeats: [
      // Mesa principal de la terraza.
      { furnitureId: 'table_base_1', typeId: 'table', x: 8.2, z: 86.7, yaw: 0.12 },
      // Segunda mesa junto al flanco este.
      { furnitureId: 'table_base_2', typeId: 'table', x: 14.2, z: 80.8, yaw: -0.18 },
      // Taburetes de barra, al alcance del pase.
      { furnitureId: 'stool_base_1', typeId: 'stool', x: 4.2, z: 80.6, yaw: 0.1 },
      { furnitureId: 'stool_base_2', typeId: 'stool', x: 5.8, z: 80.6, yaw: -0.1 },
      // Dos sombrillas de serie para que la terraza no nazca vacía.
      { furnitureId: 'umbrella_base_1', typeId: 'umbrella', x: 11.3, z: 87.0, yaw: 0 },
      { furnitureId: 'umbrella_base_2', typeId: 'umbrella', x: 16.4, z: 80.8, yaw: 0 },
      // Mesa extra en el ala oeste para que la terraza tenga vida desde el día 1.
      { furnitureId: 'table_base_3', typeId: 'table', x: -10.2, z: 86.2, yaw: 0.22 },
      { furnitureId: 'umbrella_base_3', typeId: 'umbrella', x: -13.4, z: 86.2, yaw: 0 }
    ]
  },
  build: {
    zone: { minX: 3.5, maxX: 18.0, minZ: 69.0, maxZ: 95.5 },
    maxFurniture: 30,
    gridSize: 1.4,
    aisleClearance: 2.2,
    noBuildLanes: [
      { minX: -2.8, maxX: 2.8, minZ: 92, maxZ: 112 },
      { minX: -8.0, maxX: -1.0, minZ: 76, maxZ: 94 }
    ]
  },
  fishing: {
    lagoon: { x: 32, z: 70, width: 24, depth: 18 },
    dock: { minX: 18.2, maxX: 27.5, minZ: 66.6, maxZ: 73.4 },
    spot: { x: 26.2, z: 70.0 },
    interactRadius: 3.2,
    maxCatchesPerMorning: 6
  },
  customer: {
    spawn: { x: 0, z: 110 },
    queue: [
      { x: 0, z: 101 },
      { x: 2.4, z: 101.5 },
      { x: -2.4, z: 101.5 },
      { x: 4.8, z: 102.2 }
    ],
    exit: { x: -16, z: 108 },
    walkLaneMinX: -3.0,
    walkLaneMaxX: 3.0
  },
  foodDepot: { x: 0, z: -6.5 },
  worldExclusion: { minX: -70, maxX: 90, minZ: 45, maxZ: 140 },
  camera: { distance: 1.0 },
  atmosphere: {
    morning: {
      fog: 0xcfe3d2,
      fogDensity: 0.0035,
      ambient: 0xffe7c4,
      ambientIntensity: 1.0,
      sun: 0xffd9a0,
      sunIntensity: 1.2
    },
    afternoon: {
      fog: 0xf3a482,
      fogDensity: 0.0040,
      ambient: 0xffc39a,
      ambientIntensity: 1.0,
      sun: 0xffb070,
      sunIntensity: 1.35
    },
    night: {
      fog: 0x101a33,
      fogDensity: 0.0065,
      ambient: 0x7f9bd1,
      ambientIntensity: 0.62,
      sun: 0x7f96c8,
      sunIntensity: 0.2
    }
  }
};
