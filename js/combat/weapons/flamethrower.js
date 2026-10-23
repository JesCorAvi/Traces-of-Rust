// Soplete incinerador: ráfaga continua sostenida de fuego durante unos segundos,
// seguida de recarga/enfriamiento (similar al soldador de arco/láser).
// Exports: fireFlamethrower, updateFlamethrower, resetFlamethrowerState, getFlamethrowerState.

import * as THREE from 'three';
import { AudioSys } from '../../audio.js';
import { SHARED_GEO, getDirectionalHandPos, getWeaponScaling } from '../shared.js';

// Materiales compartidos para partículas de fuego (evita asignar/destruir decenas de materiales por segundo)
const SHARED_FLAME_MATS = {
  cyan: new THREE.MeshBasicMaterial({ color: 0x3fe0f5, transparent: true, opacity: 0.88, side: THREE.DoubleSide }),
  yellow: new THREE.MeshBasicMaterial({ color: 0xffcc33, transparent: true, opacity: 0.88, side: THREE.DoubleSide }),
  orange: new THREE.MeshBasicMaterial({ color: 0xff6611, transparent: true, opacity: 0.88, side: THREE.DoubleSide })
};
SHARED_FLAME_MATS.cyan.userData = { sharedMat: true };
SHARED_FLAME_MATS.yellow.userData = { sharedMat: true };
SHARED_FLAME_MATS.orange.userData = { sharedMat: true };

// Estado persistente del lanzallamas entre frames (similar al soldador/láser)
const state = {
  phase: 'ready', // 'ready' -> 'active' -> 'cooldown' -> 'ready'
  timer: 0,
  tickTimer: 0,
  soundTimer: 0,
  activeSec: 2.6,
  cooldownSec: 2.8,
  tickSec: 0.085,
  range: 8.2,
  coneHalfAngle: 0.65
};

export function resetFlamethrowerState() {
  state.phase = 'ready';
  state.timer = 0;
  state.tickTimer = 0;
  state.soundTimer = 0;
}

export function getFlamethrowerState() {
  return {
    phase: state.phase,
    timer: state.timer,
    activeSec: state.activeSec,
    cooldownSec: state.cooldownSec,
    range: state.range
  };
}

/**
 * Máquina de estados del Soplete Incinerador (Rework estilo láser/soldador):
 * - ready: Tanque presurizado esperando a que haya objetivos en el arco frontal.
 * - active: Chorro continuo de fuego durante activeSec (~2.6s) aplicando daño y quemadura.
 * - cooldown: Válvula cerrada recargando presión durante cooldownSec (~2.8s).
 */
export function updateFlamethrower({
  dt,
  scene,
  playerPos,
  facingYaw,
  bodyYaw = facingYaw,
  level,
  mods,
  enemies,
  vfx,
  onDamage,
  onDischarge
}) {
  const { cfg, mult } = getWeaponScaling('flamethrower', level);
  const atkSpeed = Math.max(0.5, mods.atkSpeedMult || 1);
  const areaMult = mods.areaMult || 1;
  const rangeMult = mods.rangeMult || 1;
  const lvl = Math.max(0, level - 1);

  state.range = (cfg.baseRange || 8.2) * rangeMult * areaMult * (1 + lvl * 0.04);
  state.coneHalfAngle = 0.65 * areaMult;
  state.activeSec = (cfg.activeSec || 2.6) + lvl * 0.12;
  state.cooldownSec = Math.max(1.1, ((cfg.baseCd || 2.8) - lvl * 0.08) / atkSpeed);
  state.tickSec = Math.max(0.06, cfg.tickSec || 0.085);

  const nozzle = getDirectionalHandPos(playerPos, bodyYaw, 0.92, 0.36, 1.05);
  const fwd = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), facingYaw);

  if (state.phase === 'ready') {
    // Si hay objetivos en rango y frente al superviviente, abrir la válvula de ignición
    const hasTarget = checkEnemiesInRange(enemies, playerPos, fwd, state.range + 1.8, state.coneHalfAngle + 0.35);
    if (hasTarget) {
      state.phase = 'active';
      state.timer = 0;
      state.tickTimer = state.tickSec; // Disparar el primer tick inmediatamente
      state.soundTimer = 0;
      AudioSys.playFlamethrower();
      if (typeof onDischarge === 'function') {
        onDischarge({ yaw: facingYaw, origin: nozzle, hitPoint: null });
      }
    }
    return;
  }

  if (state.phase === 'cooldown') {
    state.timer += dt;
    if (state.timer >= state.cooldownSec) {
      state.phase = 'ready';
      state.timer = 0;
    }
    return;
  }

  // state.phase === 'active': Descarga continua de fuego
  state.timer += dt;
  state.tickTimer += dt;
  state.soundTimer += dt;

  if (state.soundTimer >= 0.14) {
    state.soundTimer = 0;
    AudioSys.playFlamethrower();
  }

  const dmg = (cfg.baseDmg || 8.5) * mult * (mods.dmgMult || 1) * (mods.fireDmgMult || 1);

  while (state.tickTimer >= state.tickSec) {
    state.tickTimer -= state.tickSec;
    applyFlameTick(scene, nozzle, playerPos, fwd, state.range, state.coneHalfAngle, dmg, level, enemies, vfx, onDamage);
    if (typeof onDischarge === 'function') {
      onDischarge({ yaw: facingYaw, origin: nozzle, hitPoint: null });
    }
  }

  if (state.timer >= state.activeSec) {
    state.phase = 'cooldown';
    state.timer = 0;
    state.tickTimer = 0;
    state.soundTimer = 0;
    // Siseo de alivio de presión
    AudioSys.play(220, 0.10, 'sawtooth', 0.035);
  }
}

function checkEnemiesInRange(enemies, playerPos, fwd, maxRange, maxAngle) {
  if (!enemies || enemies.length === 0) return false;
  for (const e of enemies) {
    if (!e?.active || e.state === 'dead' || !e.group) continue;
    const toE = new THREE.Vector3().subVectors(e.group.position, playerPos);
    if (Math.abs(toE.y) > 2.8) continue;
    const distSq = toE.x * toE.x + toE.z * toE.z;
    if (distSq > maxRange * maxRange) continue;
    toE.setY(0).normalize();
    if (fwd.angleTo(toE) <= maxAngle) return true;
  }
  return false;
}

function applyFlameTick(scene, nozzle, playerPos, fwd, range, coneHalfAngle, dmg, level, enemies, vfx, onDamage) {
  // Cono de partículas de fuego procedurales con núcleo cian y envolvente ámbar
  const particleCount = 4;
  for (let i = 0; i < particleCount; i++) {
    const spread = (Math.random() - 0.5) * (coneHalfAngle * 1.4);
    const dir = fwd.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), spread);
    const flameMat = Math.random() < 0.18
      ? SHARED_FLAME_MATS.cyan
      : (Math.random() < 0.5 ? SHARED_FLAME_MATS.yellow : SHARED_FLAME_MATS.orange);
    const flame = new THREE.Mesh(SHARED_GEO.flame, flameMat);
    flame.position.copy(nozzle);
    scene.add(flame);
    vfx.push({
      mesh: flame,
      disposeMat: false,
      disposeGeo: false,
      life: 0.26,
      maxLife: 0.26,
      billboard: true,
      fade: false,
      scaleSpeed: 3.6,
      vel: dir.multiplyScalar(range * 3.2).add(new THREE.Vector3(0, 0.8 + Math.random() * 0.4, 0))
    });
  }

  // Detección y aplicación de daño en abanico
  enemies.forEach(e => {
    if (!e?.active || e.state === 'dead' || !e.group) return;
    const toE = new THREE.Vector3().subVectors(e.group.position, playerPos);
    if (Math.abs(toE.y) < 2.5 && toE.length() < range && fwd.angleTo(toE.clone().setY(0).normalize()) < coneHalfAngle) {
      const burnDuration = 2.8 + level * 0.3;
      const burnDps = dmg * 1.5;
      onDamage(e, dmg, null, false, {
        burnDps,
        burnDuration
      });
      e.burnTimer = burnDuration;
      e.burnDps = burnDps;
    }
  });
}

// Compatibilidad directa con disparos puntuales o tests existentes
export function fireFlamethrower(scene, playerPos, facingYaw, level, mods, enemies, vfx, onDamage, bodyYaw = facingYaw) {
  const { cfg, mult } = getWeaponScaling('flamethrower', level);
  const fwd = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), facingYaw);
  const nozzle = getDirectionalHandPos(playerPos, bodyYaw, 0.92, 0.36, 1.05);
  const range = (cfg.baseRange || 8.2) * (mods.rangeMult || 1) * (mods.areaMult || 1);
  const coneHalfAngle = 0.65 * (mods.areaMult || 1);
  const dmg = (cfg.baseDmg || 8.5) * mult * (mods.dmgMult || 1) * (mods.fireDmgMult || 1);
  AudioSys.playFlamethrower();
  applyFlameTick(scene, nozzle, playerPos, fwd, range, coneHalfAngle, dmg, level, enemies, vfx, onDamage);
}
