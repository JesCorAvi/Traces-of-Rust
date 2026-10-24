// Catálogo de mobiliario y mejoras persistentes del chiringuito.
// Exports: FURNITURE, FURNITURE_LIST, RESTAURANT_UPGRADES, getFurniture, getRestaurantUpgrade.

export const FURNITURE = {
  stool: {
    id: 'stool',
    name: 'Taburete de madera',
    desc: 'Una plaza rápida junto a la barra.',
    category: 'seating',
    cost: 10,
    seats: 1,
    charm: 0,
    patienceBonus: 0,
    tipBonus: 0,
    size: [1.2, 1.2],
    color: 0xa66f3f,
    model: 'stool'
  },
  table: {
    id: 'table',
    name: 'Mesa con sillas',
    desc: 'Cuatro plazas con mantel y vajilla. La base de cualquier terraza.',
    category: 'seating',
    cost: 35,
    seats: 4,
    charm: 1,
    patienceBonus: 0.05,
    tipBonus: 0.02,
    size: [2.8, 2.8],
    color: 0x9b643c,
    model: 'table'
  },
  lounger: {
    id: 'lounger',
    name: 'Tumbona isleña',
    desc: 'El cliente descansa y espera con más calma.',
    category: 'seating',
    cost: 25,
    seats: 1,
    charm: 1,
    patienceBonus: 0.20,
    tipBonus: 0.03,
    size: [1.8, 2.6],
    color: 0x57a48f,
    model: 'lounger'
  },
  umbrella: {
    id: 'umbrella',
    name: 'Sombrilla de paja',
    desc: 'Sombra y brisa: más paciencia y encanto.',
    category: 'decor',
    cost: 20,
    seats: 0,
    charm: 2,
    patienceBonus: 0.10,
    tipBonus: 0,
    size: [3.2, 3.2],
    color: 0xe0c37a,
    model: 'umbrella'
  },
  lantern: {
    id: 'lantern',
    name: 'Farolillo de coco',
    desc: 'Luz cálida para la noche. Mejora las propinas.',
    category: 'decor',
    cost: 15,
    seats: 0,
    charm: 1,
    patienceBonus: 0,
    tipBonus: 0.05,
    size: [0.9, 0.9],
    color: 0xffa34d,
    model: 'lantern'
  },
  planter: {
    id: 'planter',
    name: 'Jardinera tropical',
    desc: 'Un poco de verde y mucho encanto.',
    category: 'decor',
    cost: 15,
    seats: 0,
    charm: 1,
    patienceBonus: 0,
    tipBonus: 0.01,
    size: [1.4, 1.4],
    color: 0x5e9c52,
    model: 'planter'
  },
  stage: {
    id: 'stage',
    name: 'Escenario de madera',
    desc: 'Música en directo. Atrae a más clientes y sube las propinas.',
    category: 'decor',
    cost: 80,
    seats: 0,
    charm: 5,
    patienceBonus: 0.05,
    tipBonus: 0.08,
    size: [4.2, 3.2],
    color: 0x7b4e3b,
    model: 'stage'
  }
};

export const FURNITURE_LIST = Object.values(FURNITURE);

export const RESTAURANT_UPGRADES = {
  terrace: {
    id: 'terrace',
    name: 'Terraza del chiringuito',
    desc: 'Amplía la base con tarima, techo de paja y luces.',
    cost: 120,
    seats: 2,
    tipBonus: 0.10,
    customerBonus: 0,
    kitchenSpeed: 0,
    visualLevel: 1,
    requires: null
  },
  kitchen: {
    id: 'kitchen',
    name: 'Cocina mejorada',
    desc: 'Una segunda estación y una plancha más estable.',
    cost: 220,
    seats: 0,
    tipBonus: 0,
    customerBonus: 0,
    kitchenSpeed: 0.10,
    visualLevel: 2,
    requires: 'terrace'
  },
  fame: {
    id: 'fame',
    name: 'Fama del atardecer',
    desc: 'Letrero luminoso y escenario. Atrae a más clientes.',
    cost: 400,
    seats: 0,
    tipBonus: 0.10,
    customerBonus: 0.15,
    kitchenSpeed: 0,
    visualLevel: 3,
    requires: 'kitchen'
  }
};

export function getFurniture(id) {
  return FURNITURE[id] || null;
}

export function getRestaurantUpgrade(id) {
  return RESTAURANT_UPGRADES[id] || null;
}
