// Colocación libre: inicio, confirmación, creación y previsualización de torretas.
// Exports: beginPlacement, cancelPlacement, finishPlacement, isPlacing, getPlacementState, confirmPlacement, createTurret, updatePlacement.

import * as THREE from 'three';
import { Turret } from '../../turret.js';
import { AudioSys } from '../../../audio.js';
import { GameEvents } from '../../../core/eventBus.js';
import { CORE_DEFENSE_CONFIG } from '../../../config/coreDefenseConfig.js';
import { computePlacementCandidate, validatePlacement, findFacingYaw } from './validation.js';

export function beginPlacement(system, typeId) {
const cfg = CORE_DEFENSE_CONFIG.TURRETS[typeId];
if (!cfg) return false;
if (system.turrets.size >= system.placementCfg.maxTurrets) return false;
if (system.mode.getScrap() < cfg.cost) return false;

system.placingType = cfg;
system.placementState = {
  active: true,
  typeId: cfg.id,
  typeName: cfg.name,
  cost: cfg.cost,
  position: null,
  valid: false,
  reason: 'APUNTA A LA ARENA'
};
if (system.ghostRangeGroup) {
  const r = cfg.base?.range || 10;
  system.ghostRangeGroup.scale.set(r, 1, r);
}
system.placementGhost.visible = true;
AudioSys.playUIClick();
return true;
}

export function cancelPlacement(system) {
if (!system.placingType) return;
system.placingType = null;
system.placementState = null;
if (system.placementGhost) system.placementGhost.visible = false;
AudioSys.playUIClick();
}

export function finishPlacement(system) {
system.placingType = null;
system.placementState = null;
if (system.placementGhost) system.placementGhost.visible = false;
}

export function isPlacing(system) {
return !!system.placingType;
}

export function getPlacementState(system) {
return system.placementState;
}

export function confirmPlacement(system) {
if (!system.placingType || !system.placementState || !system.placementState.valid || !system.placementState.position) {
  AudioSys.playUIError();
  return false;
}
const cfg = system.placingType;
if (!system.mode.spendScrap(cfg.cost)) {
  system.placementState.valid = false;
  system.placementState.reason = 'MADERA INSUFICIENTE';
  AudioSys.playUIError();
  return false;
}

createTurret(system, system.placementState.position, cfg);
finishPlacement(system);
return true;
}

export function createTurret(system, position, cfg) {
const id = `turret_${system.nextTurretId++}`;
const facingYaw = findFacingYaw(system, position);
const turret = new Turret(
  system.scene,
  system.worldPhysics,
  position,
  cfg,
  system,
  facingYaw,
  id
);

system.turrets.set(turret.id, turret);
// Los enemigos ya no atacan torretas en modo defensa (solo se añaden tropas aliadas a extraStructures)

system.spawnPulse(position, 1.6, cfg.color);
system.spawnSparks(position.clone().add(new THREE.Vector3(0, 0.7, 0)), cfg.color);
if (AudioSys.playTurretBuild) AudioSys.playTurretBuild();
else AudioSys.play(140, 0.16, 'sawtooth', 0.06);
GameEvents.emit('turret:built', { turret, typeId: cfg.id });
return turret;
}

export function updatePlacement(system, dt, ctx) {
if (!system.placingType) return;

const candidate = computePlacementCandidate(system, ctx);
if (!candidate) {
  system.placementState = {
    active: true,
    typeId: system.placingType.id,
    typeName: system.placingType.name,
    cost: system.placingType.cost,
    position: null,
    valid: false,
    reason: 'SIN SUPERFICIE VÁLIDA'
  };
  system.placementGhost.visible = false;
  return;
}

const result = validatePlacement(system, candidate, system.placingType, ctx);
system.placementState = {
  active: true,
  typeId: system.placingType.id,
  typeName: system.placingType.name,
  cost: system.placingType.cost,
  position: candidate,
  valid: result.valid,
  reason: result.reason
};

system.placementGhost.position.copy(candidate);
system.placementGhost.visible = true;
const color = result.valid ? 0x9caf6b : 0xa52020;
system.ghostRingMat.color.setHex(color);
system.ghostBodyMat.color.setHex(color);
system.ghostBeamMat.color.setHex(color);
system.ghostRingMat.opacity = result.valid ? 0.75 : 0.5;
system.ghostBodyMat.opacity = result.valid ? 0.18 : 0.12;

if (system.ghostRangeFillMat) {
  const rangeColor = result.valid ? (system.placingType.color || 0x9caf6b) : 0xa52020;
  system.ghostRangeFillMat.color.setHex(rangeColor);
  system.ghostRangeFillMat.opacity = result.valid ? 0.16 : 0.08;
}
if (system.ghostRangeRingMat) {
  const rangeColor = result.valid ? (system.placingType.color || 0x9caf6b) : 0xa52020;
  system.ghostRangeRingMat.color.setHex(rangeColor);
  system.ghostRangeRingMat.opacity = result.valid ? 0.7 : 0.4;
}
}
