// Armas, proyectiles, VFX y recursos compartidos de combate.
// Exports: SHARED_GEO, SHARED_MAT, initCombatLight, triggerCombatFlash, updateCombatLight, executeSawSlash, createOrbitalUnit, fireBuckshot, fireFlamethrower, spawnShrapnelMine, fireHarpoon, fireDefibrillator, triggerBossSpecialAttack.

export { SHARED_GEO, SHARED_MAT, initCombatLight, triggerCombatFlash, updateCombatLight } from './combat/shared.js';
export { executeSawSlash } from './combat/weapons/saw.js';
export { createOrbitalUnit } from './combat/weapons/orbital.js';
export { fireBuckshot } from './combat/weapons/shotgun.js';
export { fireFlamethrower } from './combat/weapons/flamethrower.js';
export { spawnShrapnelMine } from './combat/weapons/mines.js';
export { fireHarpoon } from './combat/weapons/harpoon.js';
export { fireDefibrillator } from './combat/weapons/bolt.js';
export { triggerBossSpecialAttack } from './combat/bossAttacks.js';
