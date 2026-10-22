// Escena cinemática en el menú principal adaptada según el modo seleccionado:
// - MODO SUPERVIVENCIA: Combate en arena 360° contra oleadas incesantes.
// - MODO TOWER DEFENSE: Vía de raíles con pasarela, núcleo reactor, torretas activas
//   y enemigos marchando en convoy por el carril mientras el héroe defiende.
// Exports: updateMenuBattleDemo, resetMenuBattleDemo.

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { executeSawSlash } from '../combat/weapons/saw.js';
import { fireBuckshot } from '../combat/weapons/shotgun.js';
import { updateEnemies } from '../modes/enemyLoop.js';
import { setPlaneFrameUV } from '../entities.js';
import { triggerCombatFlash, SHARED_GEO, SHARED_MAT, spawnHitBlood } from '../combat/shared.js';
import { PathSystem } from '../defense/pathSystem.js';
import { TurretSystem } from '../defense/turretSystem.js';
import { Turret } from '../defense/turret.js';
import { CoreMachine } from '../defense/coreMachine.js';
import { TURRETS } from '../config/coreDefense/turrets.js';

const DEMO_MODS = Object.freeze({
  areaMult: 1.15,
  dmgMult: 1.25,
  slashDmgMult: 1.2,
  projectileDmgMult: 1.1,
  bonusProjectiles: 1,
  critChance: 0.25,
  knockbackMult: 1.2,
  atkSpeedMult: 1.0,
  shakeMod: 1.0,
  silent: true
});

// Puntos de control para la vía curvada del modo Tower Defense en la demo
const DEMO_TD_CONTROL_POINTS = Object.freeze([
  { x: -16, z: -10 },
  { x: -10, z: -6 },
  { x: -4,  z: -2.5 },
  { x: 0,   z: -2.0 },
  { x: 4.5, z: -0.5 },
  { x: 8.0, z: 3.0 },
  { x: 9.5, z: 8.0 },
  { x: 6.0, z: 12.0 },
  { x: 0.0, z: 13.5 },
  { x: -6.0, z: 11.0 },
  { x: -11.0, z: 6.0 },
  { x: -15.0, z: 0.0 }
]);

let activeDemoMode = null;
let camOrbitT = 0;
let camShake = 0;
let playerFacingYaw = 0;
let attackCooldown = 0.4;
let spawnCooldown = 0.2;
let atkAnimTimer = 0;
let invulnTimer = 0;
const lungePos = new THREE.Vector3(0, 0, 0);

// Entidades del modo Tower Defense
let defensePathSystem = null;
let defenseTurretSystem = null;
let defenseCore = null;

function buildDemoRoute(worldPhysics) {
  const pts = DEMO_TD_CONTROL_POINTS.map(p => new THREE.Vector3(p.x, 0, p.z));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.25);
  const rawPoints = curve.getPoints(58);
  const waypoints = rawPoints.map(p => {
    const gy = worldPhysics ? worldPhysics.getGroundHeight(p.x, p.z, 0) : 0;
    return {
      x: Math.round(p.x * 100) / 100,
      y: Math.round(gy * 100) / 100,
      z: Math.round(p.z * 100) / 100
    };
  });
  return {
    demo_defense_track: {
      id: 'demo_defense_track',
      name: 'VÍA DEFENSIVA DEMO',
      color: 0x00e5ff,
      waypoints
    }
  };
}

function cleanupDefenseDemo() {
  if (defenseTurretSystem) {
    defenseTurretSystem.destroy();
    defenseTurretSystem = null;
  }
  if (defensePathSystem) {
    defensePathSystem.destroy();
    defensePathSystem = null;
  }
  if (defenseCore) {
    defenseCore.destroy();
    defenseCore = null;
  }
}

function initDefenseDemo({ scene, worldPhysics, vfx, enemyPool, playerGroup }) {
  cleanupDefenseDemo();

  // 1. Vía industrial completa con raíles y flechas
  const routes = buildDemoRoute(worldPhysics);
  defensePathSystem = new PathSystem(scene, worldPhysics, routes);

  // 2. Núcleo reactor en posición central
  defenseCore = new CoreMachine(scene, worldPhysics, vfx);
  const coreGy = worldPhysics ? worldPhysics.getGroundHeight(0, -5.5, 0) : 0;
  defenseCore.group.position.set(0, coreGy, -5.5);
  if (defenseCore.position) defenseCore.position.set(0, coreGy, -5.5);
  defenseCore.hp = 99999;
  defenseCore.maxHp = 99999;

  // 3. Sistema de torretas y colocación de 2 torretas mecánicas
  defenseTurretSystem = new TurretSystem(scene, worldPhysics, [], { pathSystem: defensePathSystem });

  const t1Pos = new THREE.Vector3(2.8, 0, 3.2);
  t1Pos.y = worldPhysics ? worldPhysics.getGroundHeight(t1Pos.x, t1Pos.z, 0) : 0;
  const turret1 = new Turret(scene, worldPhysics, t1Pos, TURRETS.gunner, defenseTurretSystem, -Math.PI * 0.4, 'demo_t1');
  turret1.upgrade(0); // Cañón gemelo para silueta distintiva
  turret1.silent = true;

  const t2Pos = new THREE.Vector3(-3.2, 0, 4.0);
  t2Pos.y = worldPhysics ? worldPhysics.getGroundHeight(t2Pos.x, t2Pos.z, 0) : 0;
  const turret2 = new Turret(scene, worldPhysics, t2Pos, TURRETS.mortar || TURRETS.flamer, defenseTurretSystem, Math.PI * 0.4, 'demo_t2');
  turret2.silent = true;

  defenseTurretSystem.turrets.set(turret1.id, turret1);
  defenseTurretSystem.turrets.set(turret2.id, turret2);

  // 4. Población inicial de enemigos escalonados en la vía
  const wpOffsets = [2, 14, 26, 38, 50];
  for (let i = 0; i < wpOffsets.length; i++) {
    const wpIdx = wpOffsets[i];
    const type = i % 2 === 0 ? 'zombie' : (i === 1 ? 'worm' : 'weeper');
    const enemy = enemyPool.spawn(type, playerGroup.position, 0, new THREE.Vector3(0, 0, -1), worldPhysics, null, {
      isDefenseMode: true,
      routeId: 'demo_defense_track',
      pathSystem: defensePathSystem
    });
    if (enemy && enemy.defenseAI) {
      const wp = defensePathSystem.getWaypoint('demo_defense_track', wpIdx);
      enemy.group.position.set(wp.x, wp.y, wp.z);
      enemy.defenseAI.waypointIdx = wpIdx + 1;
      enemy.defenseAI.lastProgressPos.copy(enemy.group.position);
      enemy.hp = type === 'weeper' ? 35 : (type === 'worm' ? 26 : 20);
      enemy.maxHp = enemy.hp;
    }
  }

  // Posición táctica del protagonista guardando la vía
  playerGroup.position.set(0.5, worldPhysics ? worldPhysics.getGroundHeight(0.5, 4.2, 0) : 0, 4.2);
}

function initSurvivalDemo({ worldPhysics, enemyPool, playerGroup }) {
  cleanupDefenseDemo();

  const types = ['zombie', 'worm', 'zombie', 'weeper', 'zombie', 'worm'];
  const count = types.length;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
    const dist = 6.2 + (i % 2) * 2.2 + Math.random() * 0.8;
    const type = types[i];
    const enemy = enemyPool.spawn(type, playerGroup.position, 0, new THREE.Vector3(0, 0, -1), worldPhysics);
    if (enemy) {
      const sx = playerGroup.position.x + Math.sin(angle) * dist;
      const sz = playerGroup.position.z + Math.cos(angle) * dist;
      const sy = worldPhysics ? worldPhysics.getGroundHeight(sx, sz, 2.0) : 0;
      enemy.group.position.set(sx, sy, sz);
      enemy.hp = type === 'weeper' ? 35 : (type === 'worm' ? 26 : 20);
      enemy.maxHp = enemy.hp;
    }
  }

  playerGroup.position.set(0, worldPhysics ? worldPhysics.getGroundHeight(0, 0, 2.0) : 0, 0);
}

function switchDemoMode(newMode, ctx) {
  if (ctx.enemyPool) ctx.enemyPool.clearAll();
  if (ctx.vfx && ctx.cleanupVfxItem) {
    for (let i = ctx.vfx.length - 1; i >= 0; i--) ctx.cleanupVfxItem(ctx.vfx[i]);
    ctx.vfx.length = 0;
  }

  activeDemoMode = newMode;
  lungePos.set(0, 0, 0);
  attackCooldown = 0.4;
  spawnCooldown = 0.2;
  atkAnimTimer = 0;
  invulnTimer = 0;
  camShake = 0;

  if (newMode === 'core_defense') {
    initDefenseDemo(ctx);
  } else {
    initSurvivalDemo(ctx);
  }
}

export function updateMenuBattleDemo(ctx) {
  const {
    dt,
    selectedMode = 'core_defense',
    scene,
    camera,
    playerGroup,
    playerBillboard,
    flashlight,
    playerLanternLight,
    propBillboards,
    dust,
    enemyPool,
    worldPhysics,
    vfx,
    cleanupVfxItem,
    syncPlayerVisualLoadout
  } = ctx;

  const targetMode = selectedMode === 'survival' ? 'survival' : 'core_defense';

  // Transición de modo si cambia la selección en el menú
  if (activeDemoMode !== targetMode) {
    switchDemoMode(targetMode, ctx);
  }

  const isTD = activeDemoMode === 'core_defense';
  const aliveEnemies = enemyPool.active.filter(e => e.active && e.state !== 'dead');

  // Actualización de sistemas exclusivos de Tower Defense
  if (isTD) {
    if (defensePathSystem) defensePathSystem.update(dt, true);
    if (defenseCore) defenseCore.update(dt, camera.position);
    if (defenseTurretSystem) {
      defenseTurretSystem.ctx = {
        enemyPool,
        camera,
        worldPhysics,
        damageEnemy: (en, amt) => onDamageEnemy(en, amt, null)
      };
      defenseTurretSystem.update(dt, defenseTurretSystem.ctx);
    }
  }

  // Spawns continuos
  if (isTD) {
    if (aliveEnemies.length === 0) {
      initDefenseDemo(ctx);
    } else if (aliveEnemies.length < 6) {
      spawnCooldown -= dt;
      if (spawnCooldown <= 0) {
        spawnCooldown = 1.0 + Math.random() * 0.7;
        const r = Math.random();
        const type = r < 0.6 ? 'zombie' : (r < 0.85 ? 'worm' : 'weeper');
        const enemy = enemyPool.spawn(type, playerGroup.position, 0, new THREE.Vector3(0, 0, -1), worldPhysics, null, {
          isDefenseMode: true,
          routeId: 'demo_defense_track',
          pathSystem: defensePathSystem
        });
        if (enemy) {
          enemy.hp = type === 'weeper' ? 35 : (type === 'worm' ? 26 : 20);
          enemy.maxHp = enemy.hp;
        }
      }
    }
  } else {
    if (aliveEnemies.length === 0) {
      initSurvivalDemo(ctx);
    } else if (aliveEnemies.length < 7) {
      spawnCooldown -= dt;
      if (spawnCooldown <= 0) {
        spawnCooldown = 0.65 + Math.random() * 0.5;
        const r = Math.random();
        const type = r < 0.6 ? 'zombie' : (r < 0.85 ? 'worm' : 'weeper');
        const angle = Math.random() * Math.PI * 2;
        const dist = 7.5 + Math.random() * 4.0;
        const enemy = enemyPool.spawn(type, playerGroup.position, 0, new THREE.Vector3(0, 0, -1), worldPhysics);
        if (enemy) {
          const sx = playerGroup.position.x + Math.sin(angle) * dist;
          const sz = playerGroup.position.z + Math.cos(angle) * dist;
          const sy = worldPhysics ? worldPhysics.getGroundHeight(sx, sz, 2.0) : 0;
          enemy.group.position.set(sx, sy, sz);
          enemy.hp = type === 'weeper' ? 35 : (type === 'worm' ? 26 : 20);
          enemy.maxHp = enemy.hp;
        }
      }
    }
  }

  // Daño a enemigos (100% silenciado para la demo)
  function onDamageEnemy(en, amount, kb) {
    if (!en.active || en.state === 'dead') return;
    en.hp -= amount;
    en.state = 'hurt';
    en.stateTimer = 0.15;
    en.onHitFeedback?.(amount, false, kb);
    spawnHitBlood(scene, vfx, en.group.position.clone().add(new THREE.Vector3(0, 0.9, 0)), {
      hitDir: kb ? kb.clone().setY(0).normalize() : null,
      damage: amount,
      floorY: 0.05
    });
    if (kb) {
      en.group.position.add(kb);
      if (worldPhysics) {
        worldPhysics.resolveCollision(en.group.position, 0.55, en.group.position.y);
      }
    }
    if (en.hp <= 0) {
      en.hp = 0;
      en.state = 'dead';
      en.stateTimer = 0;
      en.lastHitDir = kb ? kb.clone().setY(0).normalize() : null;
      camShake = Math.max(camShake, 0.18);

      for (let p = 0; p < 4; p++) {
        const spark = new THREE.Mesh(SHARED_GEO.spark, SHARED_MAT.sparkBlood);
        spark.position.copy(en.group.position).add(new THREE.Vector3(0, 0.8, 0));
        scene.add(spark);
        vfx.push({
          mesh: spark,
          life: 0.32,
          vel: new THREE.Vector3(
            (Math.random() - 0.5) * 6,
            2.0 + Math.random() * 3.0,
            (Math.random() - 0.5) * 6
          ),
          gravity: 18,
          floorY: 0.05
        });
      }
    }
  }

  // Objetivo del héroe
  let closest = null;
  let closestDistSq = Infinity;
  for (let i = 0; i < aliveEnemies.length; i++) {
    const e = aliveEnemies[i];
    const dx = e.group.position.x - playerGroup.position.x;
    const dz = e.group.position.z - playerGroup.position.z;
    const dSq = dx * dx + dz * dz;
    if (dSq < closestDistSq) {
      closestDistSq = dSq;
      closest = e;
    }
  }

  if (closest) {
    const closestDist = Math.sqrt(closestDistSq);
    const targetYaw = Math.atan2(
      playerGroup.position.x - closest.group.position.x,
      playerGroup.position.z - closest.group.position.z
    );

    let diff = targetYaw - playerFacingYaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    playerFacingYaw += diff * Math.min(1.0, dt * 14.0);

    attackCooldown -= dt;
    if (attackCooldown <= 0) {
      if (closestDist <= 3.3) {
        playerFacingYaw = targetYaw;
        if (syncPlayerVisualLoadout) syncPlayerVisualLoadout('slash');
        atkAnimTimer = 0.26;
        attackCooldown = 0.48 + Math.random() * 0.12;
        camShake = Math.max(camShake, 0.08);

        const fwd = new THREE.Vector3(-Math.sin(playerFacingYaw), 0, -Math.cos(playerFacingYaw));
        lungePos.addScaledVector(fwd, 0.35);

        executeSawSlash(
          scene,
          playerGroup.position,
          playerFacingYaw,
          2,
          DEMO_MODS,
          aliveEnemies,
          vfx,
          onDamageEnemy,
          s => { camShake = Math.max(camShake, s); },
          playerFacingYaw
        );
      } else if (closestDist <= 11.5) {
        playerFacingYaw = targetYaw;
        if (syncPlayerVisualLoadout) syncPlayerVisualLoadout('shotgun');
        atkAnimTimer = 0.28;
        attackCooldown = 0.72 + Math.random() * 0.18;
        camShake = Math.max(camShake, 0.16);

        const fwd = new THREE.Vector3(-Math.sin(playerFacingYaw), 0, -Math.cos(playerFacingYaw));
        lungePos.addScaledVector(fwd, -0.28);

        fireBuckshot(
          scene,
          playerGroup.position,
          playerFacingYaw,
          playerFacingYaw,
          2,
          DEMO_MODS,
          aliveEnemies,
          vfx,
          onDamageEnemy,
          () => {
            triggerCombatFlash(playerGroup.position, 0xffaa33, 130, 0.09);
          }
        );
      } else {
        attackCooldown = 0.08;
      }
    }
  }

  // Posición base del héroe (en el centro en Supervivencia, guardando la vía en Tower Defense)
  const homePos = isTD ? new THREE.Vector3(0.5, 0, 4.2) : new THREE.Vector3(0, 0, 0);
  lungePos.lerp(homePos, Math.min(1.0, dt * 5.0));
  playerGroup.position.x = lungePos.x;
  playerGroup.position.z = lungePos.z;
  playerGroup.position.y = worldPhysics
    ? worldPhysics.getGroundHeight(playerGroup.position.x, playerGroup.position.z, 2.0)
    : 0;

  // Órbita cinemática de la cámara (perspectiva táctica elevada en TD, rasante en Supervivencia)
  camOrbitT += dt * 0.20;
  const camDist = isTD ? 13.5 : 11.5;
  const camHeight = isTD ? 4.5 + Math.sin(camOrbitT * 0.5) * 0.35 : 3.6 + Math.sin(camOrbitT * 0.5) * 0.38;
  const camCenter = isTD ? new THREE.Vector3(0, 1.3, 2.5) : new THREE.Vector3(playerGroup.position.x, 1.25, playerGroup.position.z);

  camera.position.set(
    camCenter.x + Math.sin(camOrbitT) * camDist,
    camHeight,
    camCenter.z + Math.cos(camOrbitT) * camDist
  );

  if (camShake > 0) {
    camera.position.x += (Math.random() - 0.5) * camShake;
    camera.position.y += (Math.random() - 0.5) * camShake;
    camera.position.z += (Math.random() - 0.5) * camShake;
    camShake = Math.max(0, camShake - dt * 2.2);
  }
  camera.lookAt(camCenter);

  // Animación del billboard del protagonista
  const ST = CONFIG.DIRECTIONAL.STATES;
  const FPS = CONFIG.DIRECTIONAL.ANIM_FPS;
  let pState = ST.IDLE;
  let fps = FPS.IDLE;
  let squashX = 1.0;
  let squashY = 1.0;
  let playerTiltZ = 0;

  if (invulnTimer > 0) {
    invulnTimer -= dt;
    pState = ST.HURT;
    fps = FPS.HURT;
    squashX = 1.06;
    squashY = 0.94;
    playerTiltZ = (Math.random() - 0.5) * 0.14;
  } else if (atkAnimTimer > 0) {
    atkAnimTimer -= dt;
    pState = ST.ATTACK;
    fps = FPS.ATTACK;
    squashX = 1.08;
    squashY = 0.92;
    playerTiltZ = 0;
  } else {
    pState = ST.IDLE;
    fps = FPS.IDLE;
    squashX = 1.0;
    squashY = 1.0;
    playerTiltZ = 0;
  }

  playerBillboard.facingYaw = playerFacingYaw;
  playerBillboard.faceCamera(camera.position);
  playerBillboard.animTimer += dt * fps;
  playerBillboard.setDirectionalFrame(
    playerBillboard.dirRow,
    pState,
    Math.floor(playerBillboard.animTimer) % 4
  );
  playerBillboard.applyJuiceTransforms(squashX, squashY, playerTiltZ, 0);

  // Orientación de props, polvo, linterna y farol
  const camAngle = Math.atan2(
    camera.position.x - playerGroup.position.x,
    camera.position.z - playerGroup.position.z
  );
  propBillboards.forEach(p => { p.rotation.y = camAngle; });
  dust.position.copy(playerGroup.position);

  const aimDir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerFacingYaw);
  flashlight.position.copy(playerGroup.position).addScaledVector(aimDir, 0.45).add(new THREE.Vector3(0, 1.5, 0));
  flashlight.target.position.copy(flashlight.position).add(aimDir);

  playerLanternLight.position.set(
    playerGroup.position.x + Math.sin(camOrbitT * 1.5) * 1.2,
    playerGroup.position.y + 2.2,
    playerGroup.position.z + Math.cos(camOrbitT * 1.5) * 1.2
  );

  // Navegación de enemigos (siguen vía en TD, persiguen jugador en Supervivencia)
  const camFwd = new THREE.Vector3().subVectors(playerGroup.position, camera.position).setY(0).normalize();
  updateEnemies(enemyPool, dt, playerGroup.position, camFwd, camera.position, worldPhysics, {
    playerAlive: true,
    vfxList: vfx,
    pathSystem: isTD ? defensePathSystem : null,
    coreMachine: isTD ? defenseCore : null,
    onDealDamage: attacker => {
      invulnTimer = 0.22;
      camShake = Math.max(camShake, 0.12);
      const pushDir = new THREE.Vector3()
        .subVectors(attacker.group.position, playerGroup.position)
        .setY(0)
        .normalize();
      if (pushDir.lengthSq() > 0.01) {
        attacker.group.position.addScaledVector(pushDir, 0.75);
      }
      attackCooldown = Math.min(attackCooldown, 0.08);
    },
    onBurnTick: (burningEnemy, burnDmg) => {
      onDamageEnemy(burningEnemy, burnDmg, null);
    },
    onScare: () => {}
  });

  // Actualización de VFX
  for (let i = vfx.length - 1; i >= 0; i--) {
    const v = vfx[i];
    if (v.customUpdate) v.customUpdate(dt);
    v.life -= dt;
    if (v.uvTotalFrames && v.maxLife && v.mesh.geometry) {
      const progress = 1 - Math.max(0, v.life / v.maxLife);
      const frame = Math.min(v.uvTotalFrames - 1, Math.floor(progress * v.uvTotalFrames));
      setPlaneFrameUV(v.mesh.geometry, v.uvTotalFrames, 1, frame, 0);
    }
    if (v.vel) {
      v.mesh.position.addScaledVector(v.vel, dt);
      if (v.gravity) v.vel.y -= v.gravity * dt;
      const fy = v.floorY ?? 0.05;
      if (v.mesh.position.y < fy && v.gravity) {
        v.mesh.position.y = fy;
        v.vel.y *= -0.4;
        v.vel.x *= 0.6;
        v.vel.z *= 0.6;
      }
    }
    if (v.scaleSpeed) {
      const s = Math.max(0.001, v.mesh.scale.x + v.scaleSpeed * dt);
      v.mesh.scale.set(s, s, s);
    }
    if (v.spin) {
      v.mesh.rotation.x += v.spin.x * dt;
      v.mesh.rotation.z += v.spin.z * dt;
    }
    if (v.billboard) v.mesh.rotation.y = camAngle;
    if (v.fade && v.mesh.material && v.maxLife) {
      v.mesh.material.opacity = Math.max(0, v.life / v.maxLife);
    }
    if (v.life <= 0) {
      cleanupVfxItem(v);
      vfx.splice(i, 1);
    }
  }
}

export function resetMenuBattleDemo(enemyPool, vfx, cleanupVfxItem, scene, playerGroup, playerBillboard) {
  cleanupDefenseDemo();

  if (enemyPool) {
    enemyPool.clearAll();
  }
  if (vfx && cleanupVfxItem) {
    for (let i = vfx.length - 1; i >= 0; i--) {
      cleanupVfxItem(vfx[i]);
    }
    vfx.length = 0;
  }
  if (playerGroup) {
    playerGroup.position.set(0, 0, 0);
  }
  if (playerBillboard) {
    playerBillboard.facingYaw = 0;
    playerBillboard.applyJuiceTransforms(1, 1, 0, 0);
  }
  lungePos.set(0, 0, 0);
  attackCooldown = 0.4;
  spawnCooldown = 0.2;
  atkAnimTimer = 0;
  invulnTimer = 0;
  camShake = 0;
  activeDemoMode = null;
}
