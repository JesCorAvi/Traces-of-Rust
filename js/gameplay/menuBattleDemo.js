// Escena cinemática de combate infinito en el menú principal.
// El protagonista lucha sin fin contra enemigos utilizando sierra y escopeta.
// Exports: updateMenuBattleDemo, resetMenuBattleDemo.

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { AudioSys } from '../audio.js';
import { executeSawSlash } from '../combat/weapons/saw.js';
import { fireBuckshot } from '../combat/weapons/shotgun.js';
import { updateEnemies } from '../modes/enemyLoop.js';
import { setPlaneFrameUV } from '../entities.js';
import { triggerCombatFlash, SHARED_GEO, SHARED_MAT } from '../combat/shared.js';

const DEMO_MODS = Object.freeze({
  areaMult: 1.15,
  dmgMult: 1.25,
  slashDmgMult: 1.2,
  projectileDmgMult: 1.1,
  bonusProjectiles: 1,
  critChance: 0.25,
  knockbackMult: 1.2,
  atkSpeedMult: 1.0,
  shakeMod: 1.0
});

let camOrbitT = 0;
let camShake = 0;
let playerFacingYaw = 0;
let attackCooldown = 0.4;
let spawnCooldown = 0.2;
let atkAnimTimer = 0;
let invulnTimer = 0;
let isFirstFrame = true;
const lungePos = new THREE.Vector3(0, 0, 0);

function spawnInitialBatch(enemyPool, worldPhysics, playerPos) {
  const types = ['zombie', 'worm', 'zombie', 'weeper', 'zombie', 'worm'];
  const count = types.length;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
    const dist = 6.2 + (i % 2) * 2.2 + Math.random() * 0.8;
    const type = types[i];
    const enemy = enemyPool.spawn(type, playerPos, 0, new THREE.Vector3(0, 0, -1), worldPhysics);
    if (enemy) {
      const sx = playerPos.x + Math.sin(angle) * dist;
      const sz = playerPos.z + Math.cos(angle) * dist;
      const sy = worldPhysics ? worldPhysics.getGroundHeight(sx, sz, 2.0) : 0;
      enemy.group.position.set(sx, sy, sz);
      enemy.hp = type === 'weeper' ? 35 : (type === 'worm' ? 26 : 20);
      enemy.maxHp = enemy.hp;
    }
  }
}

export function updateMenuBattleDemo({
  dt,
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
}) {
  const aliveEnemies = enemyPool.active.filter(e => e.active && e.state !== 'dead');

  // Inicialización o repoblación si no quedan enemigos activos
  if (isFirstFrame || aliveEnemies.length === 0) {
    isFirstFrame = false;
    spawnInitialBatch(enemyPool, worldPhysics, playerGroup.position);
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

  // Búsqueda del enemigo vivo más cercano
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

  function onDamageEnemy(en, amount, kb) {
    if (!en.active || en.state === 'dead') return;
    en.hp -= amount;
    en.state = 'hurt';
    en.stateTimer = 0.15;
    AudioSys.playHit?.(amount > 22);
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
      AudioSys.playEnemyDeath?.();
      camShake = Math.max(camShake, 0.18);

      // Partículas viscerales de impacto final
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

  // Toma de decisiones y ataques del protagonista
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
        // Tajo frontal de sierra dentada
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
        // Disparo de escopeta calibre 12
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

  // Retorno elástico al centro
  lungePos.lerp(new THREE.Vector3(0, 0, 0), Math.min(1.0, dt * 5.0));
  playerGroup.position.x = lungePos.x;
  playerGroup.position.z = lungePos.z;
  playerGroup.position.y = worldPhysics
    ? worldPhysics.getGroundHeight(playerGroup.position.x, playerGroup.position.z, 2.0)
    : 0;

  // Actualización de la cámara cinemática orbital
  camOrbitT += dt * 0.22;
  const camDist = 11.5;
  const camHeight = 3.6 + Math.sin(camOrbitT * 0.5) * 0.38;
  camera.position.set(
    playerGroup.position.x + Math.sin(camOrbitT) * camDist,
    camHeight,
    playerGroup.position.z + Math.cos(camOrbitT) * camDist
  );

  if (camShake > 0) {
    camera.position.x += (Math.random() - 0.5) * camShake;
    camera.position.y += (Math.random() - 0.5) * camShake;
    camera.position.z += (Math.random() - 0.5) * camShake;
    camShake = Math.max(0, camShake - dt * 2.2);
  }
  camera.lookAt(playerGroup.position.x, 1.25, playerGroup.position.z);

  // Animación direccional del billboard del protagonista
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

  // Props, polvo, linterna y farol
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

  // Bucle de actualización de enemigos
  const camFwd = new THREE.Vector3().subVectors(playerGroup.position, camera.position).setY(0).normalize();
  updateEnemies(enemyPool, dt, playerGroup.position, camFwd, camera.position, worldPhysics, {
    playerAlive: true,
    onDealDamage: attacker => {
      invulnTimer = 0.22;
      AudioSys.playHit?.(false);
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

  // Bucle de VFX activos en la demo
  for (let i = vfx.length - 1; i >= 0; i--) {
    const v = vfx[i];
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
    if (v.scaleSpeed) v.mesh.scale.addScalar(v.scaleSpeed * dt);
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
  isFirstFrame = true;
}
