// Aliados del Cuartel: spawn, conteo y muerte.
// Exports: spawnAlly, countAlliesFor, handleAllyDestroyed.

import * as THREE from 'three';
import { AllyUnit } from '../allyUnit.js';
import { AudioSys } from '../../audio.js';

export function spawnAlly(system, turret) {
const stats = turret.stats;
const type = stats.allyRanged ? 'drone' : (stats.allyArmor > 0 ? 'elite' : 'guard');
const angle = Math.random() * Math.PI * 2;
const dist = 1.0 + Math.random() * 1.1;
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
AudioSys.play(120, 0.1, 'square', 0.035);
system.removeStructure(ally);
const idx = system.allies.indexOf(ally);
if (idx !== -1) system.allies.splice(idx, 1);
ally.destroy();
}
