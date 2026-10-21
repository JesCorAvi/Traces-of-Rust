// Aliados del Cuartel: spawn, conteo y muerte.
// Exports: spawnAlly, countAlliesFor, handleAllyDestroyed.

import * as THREE from 'three';
import { AllyUnit } from '../allyUnit.js';
import { AudioSys } from '../../audio.js';

export function spawnAlly(system, turret) {
const stats = turret.stats;
const type = stats.allyRanged ? 'drone' : (stats.allyArmor > 0 ? 'elite' : 'guard');
// Despliegue determinista por índice de tropa + posición de la torreta:
// ambos peers ven a los soldados en el mismo lugar (la torreta está replicada).
const index = countAlliesFor(system, turret);
const seed = Math.abs(Math.round(turret.group.position.x * 17 + turret.group.position.z * 31));
const slots = Math.max(1, stats.allyCap || 4);
const angle = ((index + (seed % slots)) / slots) * Math.PI * 2;
const dist = 1.0 + ((index + seed) % 3) * 0.35;
const px = turret.group.position.x + Math.cos(angle) * dist;
const pz = turret.group.position.z + Math.sin(angle) * dist;
const py = system.worldPhysics
  ? system.worldPhysics.getGroundHeight(px, pz, turret.group.position.y)
  : turret.group.position.y;

const ally = new AllyUnit(
  system.scene,
  type,
  new THREE.Vector3(px, py, pz),
  turret,
  stats
);
ally.animTimer = index * 0.17;
system.allies.push(ally);
system.extraStructures.push(ally);
return ally;
}

export function countAlliesFor(system, turret) {
let count = 0;
for (const ally of system.allies) {
  if (ally.owner === turret && !ally.destroyed) count++;
}
return count;
}

export function handleAllyDestroyed(system, ally) {
system.spawnExplosion(ally.position.clone(), 0.9, 0x6e1414);
AudioSys.playTurretShot('ally', ally.position);
system.removeStructure(ally);
const idx = system.allies.indexOf(ally);
if (idx !== -1) system.allies.splice(idx, 1);
ally.destroy();
}
