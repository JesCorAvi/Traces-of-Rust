// Soldador de arco: carga, descarga un haz concentrado hacia la mayor concentración
// de enemigos y vuelve a cargar. Los enemigos dentro del haz reciben daño por tick.
// Exports: updateWelder, resetWelderState, getWelderState.

import * as THREE from 'three';
import { AudioSys } from '../../audio.js';
import { SHARED_GEO, getDirectionalHandPos, getWeaponScaling } from '../shared.js';

const Y_AXIS = new THREE.Vector3(0, 1, 0);
const BEAM_GEO = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true);
BEAM_GEO.userData = { sharedGeo: true };
const BEAM_CORE_GEO = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true);
BEAM_CORE_GEO.userData = { sharedGeo: true };

const BEAM_GLOW_MAT = new THREE.MeshBasicMaterial({
  color: 0x3fe0f5, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
});
BEAM_GLOW_MAT.userData = { sharedMat: true };

const BEAM_CORE_MAT = new THREE.MeshBasicMaterial({
  color: 0xd8ffff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
});
BEAM_CORE_MAT.userData = { sharedMat: true };

const BEAM_LINE_MAT = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
BEAM_LINE_MAT.userData = { sharedMat: true };

const SPARK_MAT_CREAM = new THREE.MeshBasicMaterial({ color: 0xe6d7a5, transparent: true, opacity: 0.9 });
SPARK_MAT_CREAM.userData = { sharedMat: true };

const SPARK_MAT_CYAN = new THREE.MeshBasicMaterial({ color: 0x9ff8ff, transparent: true, opacity: 0.9 });
SPARK_MAT_CYAN.userData = { sharedMat: true };

const SPARK_MAT_WHITE = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
SPARK_MAT_WHITE.userData = { sharedMat: true };

const READY_PULSE_GEO = new THREE.RingGeometry(0.45, 0.8, 20);
READY_PULSE_GEO.userData = { sharedGeo: true };
const READY_PULSE_MAT = new THREE.MeshBasicMaterial({
  color: 0x3fe0f5, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false
});
READY_PULSE_MAT.userData = { sharedMat: true };

const DISCHARGE_FLASH_GEO = new THREE.PlaneGeometry(2.2, 2.2);
DISCHARGE_FLASH_GEO.userData = { sharedGeo: true };
const DISCHARGE_FLASH_MAT = new THREE.MeshBasicMaterial({
  color: 0x9ff8ff, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false
});
DISCHARGE_FLASH_MAT.userData = { sharedMat: true };

// Estado persistente del arma entre frames.
const state = {
  phase: 'charge',
  timer: 0,
  sparkTimer: 0,
  tickTimer: 0,
  yaw: 0,
  tickSec: 0.12,
  chargeSec: 2.4,
  activeSec: 1.6,
  range: 10,
  halfWidth: 1.8
};

export function resetWelderState() {
  state.phase = 'charge';
  state.timer = 0;
  state.sparkTimer = 0;
  state.tickTimer = 0;
}

// Instantánea de solo lectura para depuración y harness de validación.
export function getWelderState() {
  return {
    phase: state.phase,
    timer: state.timer,
    yaw: state.yaw,
    range: state.range,
    halfWidth: state.halfWidth,
    chargeSec: state.chargeSec,
    activeSec: state.activeSec
  };
}

/**
 * Avanza la máquina de estados del Soldador de Arco.
 * Fases: charge (carga) -> ready (cargado, esperando objetivos) -> active (haz).
 */
export function updateWelder({
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
  const { cfg, mult } = getWeaponScaling('welder', level);
  const atkSpeed = Math.max(0.5, mods.atkSpeedMult || 1);
  const areaMult = mods.areaMult || 1;
  const rangeMult = mods.rangeMult || 1;
  const lvl = Math.max(0, level - 1);

  state.range = (cfg.baseRange || 10) * rangeMult * areaMult * (1 + lvl * 0.03);
  state.halfWidth = (cfg.beamWidth || 1.8) * areaMult * (1 + lvl * 0.04);
  state.chargeSec = Math.max(0.9, ((cfg.chargeSec || 2.4) - lvl * 0.08) / atkSpeed);
  state.activeSec = (cfg.activeSec || 1.6) + lvl * 0.06;
  state.tickSec = Math.max(0.06, cfg.tickSec || 0.12);

  const damage = (cfg.baseDmg || 10) * mult * (mods.dmgMult || 1);
  const handOrigin = getDirectionalHandPos(playerPos, bodyYaw, 0.8, 0.28, 1.12);

  if (state.phase === 'charge') {
    state.timer += dt;
    state.sparkTimer -= dt;
    const progress = Math.min(1, state.timer / state.chargeSec);

    if (state.sparkTimer <= 0) {
      state.sparkTimer = 0.18 - progress * 0.08;
      spawnChargeSpark(scene, handOrigin, vfx, progress);
      AudioSys.playElectric();
    }

    if (state.timer >= state.chargeSec) {
      const aim = findAim(enemies, handOrigin, state.range, state.halfWidth, facingYaw);
      if (aim.any) {
        activate(aim.yaw, handOrigin, scene, vfx, onDischarge);
      } else {
        state.phase = 'ready';
        state.timer = 0;
        state.sparkTimer = 0.4;
        spawnReadyPulse(scene, playerPos, vfx);
      }
    }
    return;
  }

  if (state.phase === 'ready') {
    state.timer += dt;
    state.sparkTimer -= dt;
    if (state.sparkTimer <= 0) {
      state.sparkTimer = 0.45;
      spawnChargeSpark(scene, handOrigin, vfx, 1);
      spawnReadyPulse(scene, playerPos, vfx);
      AudioSys.playElectric();
    }

    const aim = findAim(enemies, handOrigin, state.range, state.halfWidth, facingYaw);
    if (aim.any) {
      activate(aim.yaw, handOrigin, scene, vfx, onDischarge);
    }
    return;
  }

  // Fase activa: el origen sigue al jugador, pero la dirección queda bloqueada.
  state.timer += dt;
  state.tickTimer += dt;
  const dir = yawToDir(state.yaw);

  while (state.tickTimer >= state.tickSec) {
    state.tickTimer -= state.tickSec;
    applyBeamTick(scene, handOrigin, dir, state.range, state.halfWidth, damage, enemies, vfx, onDamage);
  }

  if (state.timer >= state.activeSec) {
    state.phase = 'charge';
    state.timer = 0;
    state.sparkTimer = 0;
    state.tickTimer = 0;
  }
}

function activate(yaw, origin, scene, vfx, onDischarge) {
  const dir = yawToDir(yaw);
  state.phase = 'active';
  state.yaw = yaw;
  state.timer = 0;
  // El primer tick se aplica de inmediato para que el haz tenga impacto visual.
  state.tickTimer = state.tickSec;

  spawnDischargeFlash(scene, origin, vfx);
  AudioSys.playElectric();
  AudioSys.play(72, 0.38, 'sawtooth', 0.08);

  if (onDischarge) {
    onDischarge({
      yaw,
      origin: origin.clone(),
      hitPoint: origin.clone().addScaledVector(dir, state.range)
    });
  }
}

function applyBeamTick(scene, origin, dir, range, halfWidth, damage, enemies, vfx, onDamage) {
  const end = origin.clone().addScaledVector(dir, range);
  let hits = 0;

  for (const enemy of enemies) {
    if (!enemy?.active || enemy.state === 'dead') continue;

    const to = enemy.group.position.clone().add(new THREE.Vector3(0, 1.0, 0)).sub(origin);
    if (Math.abs(to.y) > 2.4) continue;
    to.y = 0;

    const forward = to.dot(dir);
    if (forward < 0.25 || forward > range) continue;

    // Distancia perpendicular al eje del haz (dir es unitario).
    const perp = Math.abs(to.x * dir.z - to.z * dir.x);
    if (perp > halfWidth) continue;

    if (onDamage) onDamage(enemy, damage, dir.clone().multiplyScalar(0.35), true);
    hits++;
    if (hits <= 6) {
      const hitPoint = origin.clone().addScaledVector(dir, forward);
      spawnImpactSpark(scene, hitPoint, vfx);
    }
  }

  spawnBeamVfx(scene, origin, end, halfWidth, vfx);
  AudioSys.playElectric();
}

function findAim(enemies, origin, range, halfWidth, fallbackYaw) {
  const candidates = [];

  for (const enemy of enemies) {
    if (!enemy?.active || enemy.state === 'dead') continue;
    const dx = enemy.group.position.x - origin.x;
    const dz = enemy.group.position.z - origin.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.001 || dist > range) continue;
    if (Math.abs(enemy.group.position.y - origin.y) > 2.6) continue;
    candidates.push(Math.atan2(-dx, -dz));
  }

  if (candidates.length === 0) return { any: false, yaw: fallbackYaw };

  // Además de apuntar a cada enemigo, probar sectores uniformes: así el haz
  // puede centrarse entre dos objetivos alineados y cubrir a ambos.
  for (let i = 0; i < 32; i++) candidates.push((i / 32) * Math.PI * 2 - Math.PI);

  let bestYaw = fallbackYaw;
  let bestScore = -1;

  for (const yaw of candidates) {
    const dir = yawToDir(yaw);
    let score = 0;

    for (const enemy of enemies) {
      if (!enemy?.active || enemy.state === 'dead') continue;
      const to = enemy.group.position.clone().sub(origin);
      if (Math.abs(to.y) > 2.6) continue;
      to.y = 0;
      const forward = to.dot(dir);
      if (forward <= 0.2 || forward > range) continue;
      const perp = Math.abs(to.x * dir.z - to.z * dir.x);
      if (perp > halfWidth + forward * 0.04) continue;
      // Los objetivos con más vida pesan más: el haz prioriza amenazas.
      score += 1 + Math.min(3, (enemy.maxHp || enemy.hp || 40) / 100);
    }

    if (score > bestScore) {
      bestScore = score;
      bestYaw = yaw;
    }
  }

  return { any: bestScore > 0, yaw: bestYaw };
}

function yawToDir(yaw) {
  return new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize();
}

function spawnBeamVfx(scene, origin, end, halfWidth, vfx) {
  const delta = end.clone().sub(origin);
  const length = delta.length();
  if (length < 0.05) return;
  const dir = delta.clone().normalize();
  const mid = origin.clone().addScaledVector(dir, length * 0.5);

  const glow = new THREE.Mesh(BEAM_GEO, BEAM_GLOW_MAT);
  glow.position.copy(mid);
  glow.quaternion.setFromUnitVectors(Y_AXIS, dir);
  glow.scale.set(halfWidth * 0.72, length, halfWidth * 0.72);
  scene.add(glow);
  vfx.push({
    mesh: glow, disposeGeo: false, disposeMat: false,
    life: 0.16, maxLife: 0.16, fade: false, baseOpacity: 0.32
  });

  const core = new THREE.Mesh(BEAM_CORE_GEO, BEAM_CORE_MAT);
  core.position.copy(mid);
  core.quaternion.copy(glow.quaternion);
  core.scale.set(halfWidth * 0.16, length, halfWidth * 0.16);
  scene.add(core);
  vfx.push({
    mesh: core, disposeGeo: false, disposeMat: false,
    life: 0.14, maxLife: 0.14, fade: false, baseOpacity: 0.85
  });

  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([origin.clone(), end.clone()]),
    BEAM_LINE_MAT
  );
  scene.add(line);
  vfx.push({
    mesh: line, disposeGeo: true, disposeMat: false,
    life: 0.13, maxLife: 0.13, fade: false, baseOpacity: 0.9
  });
}

function spawnImpactSpark(scene, position, vfx) {
  const mat = Math.random() < 0.5 ? SPARK_MAT_CREAM : SPARK_MAT_CYAN;
  const spark = new THREE.Mesh(SHARED_GEO.spark, mat);
  spark.position.copy(position);
  spark.scale.setScalar(0.5 + Math.random() * 0.7);
  scene.add(spark);
  vfx.push({
    mesh: spark, disposeGeo: false, disposeMat: false,
    life: 0.2, maxLife: 0.2, fade: false,
    vel: new THREE.Vector3(
      (Math.random() - 0.5) * 5,
      1.4 + Math.random() * 2.2,
      (Math.random() - 0.5) * 5
    ),
    gravity: 8
  });
}

function spawnChargeSpark(scene, origin, vfx, progress) {
  const mat = progress > 0.85 ? SPARK_MAT_WHITE : SPARK_MAT_CYAN;
  const spark = new THREE.Mesh(SHARED_GEO.spark, mat);
  spark.position.copy(origin).add(new THREE.Vector3(
    (Math.random() - 0.5) * 0.7,
    (Math.random() - 0.5) * 0.4,
    (Math.random() - 0.5) * 0.7
  ));
  spark.scale.setScalar(0.35 + progress * 0.55);
  scene.add(spark);
  vfx.push({
    mesh: spark, disposeGeo: false, disposeMat: false,
    life: 0.24, maxLife: 0.24, fade: false,
    vel: new THREE.Vector3(0, 1.4 + progress * 1.8, 0),
    spin: new THREE.Vector3(7, 9, 5)
  });
}

function spawnReadyPulse(scene, playerPos, vfx) {
  const ring = new THREE.Mesh(READY_PULSE_GEO, READY_PULSE_MAT);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(playerPos.x, playerPos.y + 0.06, playerPos.z);
  scene.add(ring);
  vfx.push({
    mesh: ring, disposeGeo: false, disposeMat: false,
    life: 0.38, maxLife: 0.38, fade: false, baseOpacity: 0.55, scaleSpeed: 2.4
  });
}

function spawnDischargeFlash(scene, origin, vfx) {
  const flash = new THREE.Mesh(DISCHARGE_FLASH_GEO, DISCHARGE_FLASH_MAT);
  flash.position.copy(origin);
  scene.add(flash);
  vfx.push({
    mesh: flash, disposeGeo: false, disposeMat: false,
    life: 0.18, maxLife: 0.18, billboard: true, fade: false,
    baseOpacity: 0.9, scaleSpeed: 4.5
  });
}
