// Validación de colocación: candidato, distancias y facing.
// Exports: computePlacementCandidate, validatePlacement, horizontalDistance, distanceToRoutes, findFacingYaw.

import * as THREE from 'three';
import { CORE_DEFENSE_CONFIG } from '../../../config/coreDefenseConfig.js';
import { closestPointOnRoutes } from '../../../utils/routeMath.js';

export function computePlacementCandidate(system, ctx) {
const camera = ctx.camera;
const player = ctx.playerGroup.position;
if (!camera || !player) return null;

const origin = camera.position;
const dir = camera.getWorldDirection(new THREE.Vector3());

let hit = null;
for (let t = 1.0; t <= 36.0; t += 0.5) {
  const px = origin.x + dir.x * t;
  const py = origin.y + dir.y * t;
  const pz = origin.z + dir.z * t;
  const ground = system.worldPhysics.getGroundHeight(px, pz, py);
  if (py <= ground + 0.25) {
    hit = new THREE.Vector3(px, ground, pz);
    break;
  }
}

const fwd = ctx.camFwd
  ? new THREE.Vector3(ctx.camFwd.x, 0, ctx.camFwd.z).normalize()
  : new THREE.Vector3(0, 0, -1);

if (!hit) {
  const fallbackDist = 5.0;
  const fx = player.x + fwd.x * fallbackDist;
  const fz = player.z + fwd.z * fallbackDist;
  hit = new THREE.Vector3(fx, system.worldPhysics.getGroundHeight(fx, fz, player.y + 0.5), fz);
}

// Si el rayo cae detrás del jugador, usar un punto delante
const toHit = new THREE.Vector3(hit.x - player.x, 0, hit.z - player.z);
if (toHit.dot(fwd) < 0.5) {
  const fx = player.x + fwd.x * 5.0;
  const fz = player.z + fwd.z * 5.0;
  hit.set(fx, system.worldPhysics.getGroundHeight(fx, fz, player.y + 0.5), fz);
}

// Limitar la distancia horizontal al jugador
let dx = hit.x - player.x;
let dz = hit.z - player.z;
let dist = Math.hypot(dx, dz) || 0.0001;
const minDist = system.placementCfg.minPlayerDistance;
const maxDist = system.placementCfg.maxPlayerDistance;

if (dist > maxDist) {
  const k = maxDist / dist;
  dx *= k;
  dz *= k;
  dist = maxDist;
} else if (dist < minDist) {
  const k = minDist / dist;
  dx *= k;
  dz *= k;
  dist = minDist;
}

const x = player.x + dx;
const z = player.z + dz;
const y = system.worldPhysics.getGroundHeight(x, z, hit.y + 0.1);
return new THREE.Vector3(x, y, z);
}

export function validatePlacement(system, pos, cfg, ctx) {
const P = system.placementCfg;
const player = ctx.playerGroup.position;
const dxP = pos.x - player.x;
const dzP = pos.z - player.z;
const distPlayer = Math.hypot(dxP, dzP);

if (distPlayer < P.minPlayerDistance - 0.05) return { valid: false, reason: 'DEMASIADO CERCA DEL SOCORRISTA' };
if (distPlayer > P.maxPlayerDistance + 0.1) return { valid: false, reason: 'FUERA DE ALCANCE' };
if (system.turrets.size >= P.maxTurrets) return { valid: false, reason: 'LÍMITE DE TORRETAS' };
if (system.mode.getScrap() < cfg.cost) return { valid: false, reason: 'MADERA INSUFICIENTE' };

if (system.worldPhysics.isRampAt && system.worldPhysics.isRampAt(pos.x, pos.z)) {
  return { valid: false, reason: 'TERRENO INCLINADO' };
}

const core = system.mode.coreMachine;
if (core && core.collisionRadius > 0 && !core.destroyed) {
  const minCore = core.collisionRadius + cfg.base.collisionRadius + P.minCorePadding;
  if (horizontalDistance(pos, core.position) < minCore) {
    return { valid: false, reason: 'DEMASIADO CERCA DE LA DESPENSA' };
  }
}

if (distanceToRoutes(system, pos) < P.minPathDistance) {
  return { valid: false, reason: 'BLOQUEA LA SENDA' };
}

const spawnList = system.mode?.spawnPoints || CORE_DEFENSE_CONFIG.SPAWN_POINTS;
for (const sp of spawnList) {
  if (horizontalDistance(pos, sp.position) < P.spawnClearance) {
    return { valid: false, reason: 'MADRIGUERA DE ENTRADA' };
  }
}

const exitList = system.mode?.exitPoints || [];
for (const ep of exitList) {
  if (horizontalDistance(pos, ep.position) < P.spawnClearance) {
    return { valid: false, reason: 'PASO DE FUGA' };
  }
}

for (const turret of system.turrets.values()) {
  const minDist = Math.max(
    P.minTurretDistance,
    cfg.base.collisionRadius + turret.cfg.base.collisionRadius + 0.9
  );
  if (horizontalDistance(pos, turret.group.position) < minDist) {
    return { valid: false, reason: 'DEMASIADO CERCA DE OTRA TORRETA' };
  }
}

const enemies = ctx.enemyPool.active;
for (let i = 0; i < enemies.length; i++) {
  const e = enemies[i];
  if (!e.active || e.state === 'dead') continue;
  if (horizontalDistance(pos, e.group.position) < P.enemyClearance) {
    return { valid: false, reason: 'CANGREJO ENCIMA' };
  }
}

// Sonda de colisión: si el punto está dentro de una caja/barril/torreta, se rechaza
const probe = pos.clone();
system.worldPhysics.resolveCollision(probe, cfg.base.collisionRadius, pos.y);
if (Math.hypot(probe.x - pos.x, probe.z - pos.z) > 0.05) {
  return { valid: false, reason: 'OBSTÁCULO' };
}

return { valid: true, reason: 'LISTO PARA COLOCAR' };
}

export function horizontalDistance(a, b) {
return Math.hypot(a.x - b.x, a.z - b.z);
}

export function distanceToRoutes(system, pos) {
const pathSystem = system.mode.pathSystem;
if (!pathSystem) return Infinity;

const best = closestPointOnRoutes(pos.x, pos.z, pathSystem.routes.values());
return best ? best.dist : Infinity;
}

export function findFacingYaw(system, position) {
const pathSystem = system.mode.pathSystem;
if (!pathSystem) return 0;

const best = closestPointOnRoutes(position.x, position.z, pathSystem.routes.values());
if (!best) return 0;
return Math.atan2(-(best.x - position.x), -(best.z - position.z));
}
