// IA de objetivo enemigo (núcleo, jugador, torretas/aliados) y navegación por waypoints.
// Exports: initEnemyDefenseState, evaluateEnemyTarget, resolveEnemyNavigationGoal.
import * as THREE from 'three';
import { CORE_DEFENSE_CONFIG } from '../config/coreDefenseConfig.js';
import { AudioSys } from '../audio.js';
import { SHARED_GEO, SHARED_MAT } from '../combat.js';
import { GameEvents } from '../core/eventBus.js';

// ============================================================================
// LÓGICA DE OBJETIVO E IA DE ENEMIGOS (Núcleo vs Jugador vs Futuras Torres)
// ============================================================================
// Regla documentada cuando el enemigo ya está atacando el Núcleo:
// Si `enemy.isAttackingCore === true`, el enemigo NO abandona el Núcleo aunque el
// jugador entre en `detectRadius`. Solo cambiará al jugador si este se pega a una
// distancia menor o igual a `coreOverrideRadius` (configurable por tipo en CORE_DEFENSE_CONFIG).
// ============================================================================

const TARGET_KIND = {
  CORE: 'core',
  PLAYER: 'player',
  STRUCTURE: 'structure' // Preparado para futuras torres defensivas
};

function getEnemyTargetingProfile(enemyType, isBoss = false) {
  const table = CORE_DEFENSE_CONFIG.TARGETING.BY_ENEMY_CONFIG || CORE_DEFENSE_CONFIG.TARGETING.BY_ENEMY_TYPE;
  if (isBoss) return table.boss;
  return table[enemyType] || table.zombie;
}

export function initEnemyDefenseState(enemy, routeId, pathSystem) {
  const profile = getEnemyTargetingProfile(enemy.type, enemy.isBoss);
  enemy.defenseAI = {
    enabled: true,
    routeId: routeId || 'path_north',
    waypointIdx: 1,
    targetKind: TARGET_KIND.CORE,
    targetStructure: null,
    isAttackingCore: false,
    reactionTimer: 0,
    scareCooldown: 0,
    alertFlashTimer: 0,
    coreAttackTimer: 0,
    stuckTimer: 0,
    lastProgressPos: enemy.group.position.clone(),
    profile
  };

  if (pathSystem) {
    const startWp = pathSystem.getWaypoint(enemy.defenseAI.routeId, 0);
    const jitterX = (Math.random() - 0.5) * 1.4;
    const jitterZ = (Math.random() - 0.5) * 1.4;
    enemy.group.position.set(startWp.x + jitterX, startWp.y, startWp.z + jitterZ);
    enemy.defenseAI.lastProgressPos.copy(enemy.group.position);
  }
}

function triggerAggroTerrorSignal(enemy, playerPos, scene, vfxList) {
  // 1. Giro brusco inmediato hacia el jugador
  const dx = playerPos.x - enemy.group.position.x;
  const dz = playerPos.z - enemy.group.position.z;
  enemy.billboard.facingYaw = Math.atan2(-dx, -dz);
  enemy.defenseAI.alertFlashTimer = 0.38;

  // 2. Grito / chirrido metálico de detección
  const baseFreq = enemy.type === 'weeper' ? 520 : enemy.isBoss ? 110 : 280;
  AudioSys.play(baseFreq, 0.16, 'sawtooth', 0.055);
  AudioSys.play(baseFreq * 1.45, 0.11, 'square', 0.04);

  // 3. Destello ocular sobre la cabeza del enemigo
  if (scene && vfxList) {
    for (let i = 0; i < 2; i++) {
      const eyeSpark = new THREE.Mesh(SHARED_GEO.spark, SHARED_MAT.sparkGold);
      eyeSpark.scale.setScalar(1.15);
      eyeSpark.position.copy(enemy.group.position).add(new THREE.Vector3(
        (i === 0 ? -0.18 : 0.18),
        enemy.isBoss ? 2.8 : 1.65,
        0
      ));
      scene.add(eyeSpark);
      vfxList.push({
        mesh: eyeSpark,
        life: 0.24,
        vel: new THREE.Vector3(0, 1.2, 0)
      });
    }
  }

  GameEvents.emit('enemy:aggro_player', { enemy });
}

/**
 * Evalúa y actualiza el objetivo actual del enemigo con histéresis temporal
 * y soporte para estructuras defensivas adicionales (futuras torres).
 */
export function evaluateEnemyTarget(enemy, dt, playerPos, playerAlive, coreMachine, extraStructures, pathSystem, scene, vfxList) {
  const ai = enemy.defenseAI;
  if (!ai || !ai.enabled) return;

  const prof = ai.profile;
  if (ai.scareCooldown > 0) ai.scareCooldown -= dt;
  if (ai.alertFlashTimer > 0) ai.alertFlashTimer -= dt;

  const pos = enemy.group.position;
  const distToPlayer = playerAlive
    ? Math.hypot(playerPos.x - pos.x, playerPos.z - pos.z)
    : Infinity;

  // Si el jugador ha muerto o está fuera del radio de abandono, regresar al camino hacia el Núcleo
  if (ai.targetKind === TARGET_KIND.PLAYER) {
    if (!playerAlive || distToPlayer > prof.abandonRadius) {
      ai.reactionTimer += dt;
      if (!playerAlive || ai.reactionTimer >= prof.reactionTime) {
        ai.targetKind = TARGET_KIND.CORE;
        ai.reactionTimer = 0;
        ai.isAttackingCore = false;
        if (pathSystem) {
          ai.waypointIdx = pathSystem.findRejoinWaypointIndex(ai.routeId, pos);
        }
      }
    } else {
      ai.reactionTimer = 0;
    }
    return;
  }

  // Estado por defecto: avanzando hacia el Núcleo (o atacándolo)
  if (ai.targetKind === TARGET_KIND.CORE) {
    const requiredRadius = ai.isAttackingCore ? prof.coreOverrideRadius : prof.detectRadius;

    if (playerAlive && distToPlayer <= requiredRadius) {
      ai.reactionTimer += dt;
      if (ai.reactionTimer >= prof.reactionTime) {
        ai.targetKind = TARGET_KIND.PLAYER;
        ai.isAttackingCore = false;
        ai.reactionTimer = 0;

        if (ai.scareCooldown <= 0) {
          ai.scareCooldown = prof.aggroScareCooldown;
          triggerAggroTerrorSignal(enemy, playerPos, scene, vfxList);
        }
      }
      return;
    }

    // Estructuras defensivas (torretas y tropas aliadas): se elige la más cercana
    if (Array.isArray(extraStructures) && extraStructures.length > 0 && !ai.isAttackingCore) {
      let closest = null;
      let closestDist = Infinity;
      for (let i = 0; i < extraStructures.length; i++) {
        const st = extraStructures[i];
        if (!st || !st.active || st.destroyed) continue;
        const dStruct = Math.hypot(st.position.x - pos.x, st.position.z - pos.z);
        if (dStruct <= prof.detectRadius && dStruct < closestDist) {
          closest = st;
          closestDist = dStruct;
        }
      }
      if (closest) {
        ai.targetKind = TARGET_KIND.STRUCTURE;
        ai.targetStructure = closest;
        ai.reactionTimer = 0;
        return;
      }
    }

    ai.reactionTimer = 0;
  } else if (ai.targetKind === TARGET_KIND.STRUCTURE) {
    if (!ai.targetStructure || !ai.targetStructure.active || ai.targetStructure.destroyed) {
      ai.targetKind = TARGET_KIND.CORE;
      ai.targetStructure = null;
      if (pathSystem) {
        ai.waypointIdx = pathSystem.findRejoinWaypointIndex(ai.routeId, pos);
      }
    }
  }
}

/**
 * Calcula el punto de destino 3D inmediato y si el enemigo está en rango de golpear su objetivo.
 */
export function resolveEnemyNavigationGoal(enemy, dt, playerPos, coreMachine, pathSystem, worldPhysics) {
  const ai = enemy.defenseAI;
  const pos = enemy.group.position;
  const pathCfg = CORE_DEFENSE_CONFIG.PATHS;

  // Recuperación automática si el enemigo cae fuera del mapa
  if (pos.y < pathCfg.maxFallY && pathSystem) {
    const safeWp = pathSystem.getWaypoint(ai.routeId, ai.waypointIdx);
    pos.copy(safeWp);
    ai.stuckTimer = 0;
    ai.lastProgressPos.copy(pos);
  }

  if (ai.targetKind === TARGET_KIND.PLAYER) {
    return {
      goalPos: playerPos,
      attackTarget: 'player',
      stopDist: enemy.isBoss ? 2.2 : 1.65
    };
  }

  if (ai.targetKind === TARGET_KIND.STRUCTURE && ai.targetStructure) {
    return {
      goalPos: ai.targetStructure.position,
      attackTarget: 'structure',
      structure: ai.targetStructure,
      stopDist: ai.targetStructure.attackStopDistance || 2.2
    };
  }

  // Navegación por waypoints hacia el Núcleo
  const corePos = coreMachine ? coreMachine.position : new THREE.Vector3(0, 0, 0);
  const coreStopDist = (coreMachine ? coreMachine.attackStopDistance : 3.15) + (enemy.isBoss ? 0.55 : 0);
  const distToCore = Math.hypot(corePos.x - pos.x, corePos.z - pos.z);

  if (distToCore <= coreStopDist + 0.2) {
    ai.isAttackingCore = true;
    return {
      goalPos: corePos,
      attackTarget: 'core',
      structure: coreMachine,
      stopDist: coreStopDist
    };
  }

  ai.isAttackingCore = false;
  if (!pathSystem) {
    return { goalPos: corePos, attackTarget: 'core', structure: coreMachine, stopDist: coreStopDist };
  }

  let wp = pathSystem.getWaypoint(ai.routeId, ai.waypointIdx);
  const distToWp = Math.hypot(wp.x - pos.x, wp.z - pos.z);

  if (distToWp <= pathCfg.waypointReachRadius && !pathSystem.isFinalWaypoint(ai.routeId, ai.waypointIdx)) {
    ai.waypointIdx++;
    wp = pathSystem.getWaypoint(ai.routeId, ai.waypointIdx);
    ai.stuckTimer = 0;
    ai.lastProgressPos.copy(pos);
  }

  // Detección y desatasco automático si un enemigo se bloquea contra una esquina o caja
  ai.stuckTimer += dt;
  if (ai.stuckTimer >= pathCfg.stuckTimeoutSec) {
    const moved = Math.hypot(pos.x - ai.lastProgressPos.x, pos.z - ai.lastProgressPos.z);
    if (moved < pathCfg.stuckMinProgressDist) {
      const nudgeDir = new THREE.Vector3().subVectors(wp, pos).setY(0).normalize();
      pos.addScaledVector(nudgeDir, 1.35);
      if (worldPhysics) {
        pos.y = worldPhysics.getGroundHeight(pos.x, pos.z, wp.y);
      }
    }
    ai.stuckTimer = 0;
    ai.lastProgressPos.copy(pos);
  }

  return {
    goalPos: wp,
    attackTarget: 'core',
    structure: coreMachine,
    stopDist: pathSystem.isFinalWaypoint(ai.routeId, ai.waypointIdx) ? coreStopDist : 0.2
  };
}