// Tabla de enemigos no-jefe: stats base y habilidades data-driven.
// Los valores de zombie/worm/weeper siguen en Enemy.init para no alterar el balance actual.
// Exports: ENEMY_TYPES.

export const ENEMY_TYPES = {
  runner: {
    id: 'runner',
    name: 'CORREDOR DE VÍA',
    hp: 16,
    dmg: 8,
    speed: 7.2,
    size: 1.8,
    collisionRadius: 0.45,
    attackStopDistance: 1.5,
    tickRate: 0.06,
    leakLives: 1
  },
  hulk: {
    id: 'hulk',
    name: 'PRENSA DE CARNE',
    hp: 150,
    dmg: 30,
    speed: 2.5,
    size: 3.0,
    collisionRadius: 0.85,
    attackStopDistance: 2.1,
    tickRate: 0.1,
    leakLives: 4,
    knockbackResist: 0.8
  },
  nest: {
    id: 'nest',
    name: 'NIDO ANDANTE',
    hp: 90,
    dmg: 12,
    speed: 2.8,
    size: 2.6,
    collisionRadius: 0.6,
    attackStopDistance: 1.7,
    tickRate: 0.08,
    leakLives: 3,
    spawnWorms: { interval: 5, count: 1, max: 3 }
  },
  regenerator: {
    id: 'regenerator',
    name: 'SUTURADOR DE PLAGA',
    hp: 110,
    dmg: 14,
    speed: 3.0,
    size: 2.4,
    collisionRadius: 0.55,
    attackStopDistance: 1.7,
    tickRate: 0.08,
    leakLives: 2,
    healPulse: { interval: 3, radius: 5, amount: 12 }
  },
  splitter: {
    id: 'splitter',
    name: 'GEMELO DE CARNE',
    hp: 85,
    dmg: 18,
    speed: 3.4,
    size: 2.5,
    collisionRadius: 0.6,
    attackStopDistance: 1.8,
    tickRate: 0.08,
    leakLives: 2,
    split: { count: 2, type: 'worm' }
  }
};
