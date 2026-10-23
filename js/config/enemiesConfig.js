// Tabla de enemigos no-jefe: stats base y habilidades data-driven.
// Los valores de zombie/worm/weeper siguen en Enemy.init para no alterar el balance actual.
// Exports: ENEMY_TYPES.

import { t } from '../core/i18n.js';
const _t = (k, fb) => (typeof t === 'function' ? t(k) : fb);

export const ENEMY_TYPES = {
  runner: {
    id: 'runner',
    get name() { return _t('enemy.runner.name', 'CANGREJO CORREDOR'); },
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
    get name() { return _t('enemy.hulk.name', 'CANGREJO ACORAZADO'); },
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
    get name() { return _t('enemy.nest.name', 'CANGREJO NIDO'); },
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
    get name() { return _t('enemy.regenerator.name', 'CANGREJO CURANDERO'); },
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
    get name() { return _t('enemy.splitter.name', 'CANGREJO GEMELO'); },
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
