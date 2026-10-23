// Proyectiles y zonas persistentes de las armas del jugador.
// Bumerán, granada y frasco ácido; también actualiza/limpia la lista compartida.
// Exports: fireChakram, throwGrenade, throwAcidFlask, updatePlayerProjectiles, clearPlayerProjectiles.

import * as THREE from 'three';
import { AudioSys } from '../../audio.js';
import { getDirectionalHandPos, getWeaponScaling } from '../shared.js';

const CHAKRAM_CAP = 6;
const GRENADE_CAP = 4;
const FLASK_CAP = 4;
const CLOUD_CAP = 4;
const Y_AXIS = new THREE.Vector3(0, 1, 0);

function countKind(list, kind) {
  let count = 0;
  for (const item of list) if (item.kind === kind) count++;
  return count;
}

function disposeObject(root, scene) {
  if (!root) return;
  if (scene) scene.remove(root);
  root.traverse?.(obj => {
    if (obj.geometry && !obj.geometry.userData?.sharedGeo && !obj.userData?.sharedGeo) {
      obj.geometry.dispose();
    }
    if (obj.material && !obj.material.userData?.sharedMat && !obj.userData?.sharedMat) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(mat => {
          if (!mat?.userData?.sharedMat) mat.dispose();
        });
      } else {
        obj.material.dispose();
      }
    }
  });
}

function removeProjectile(list, index, scene) {
  const projectile = list[index];
  disposeObject(projectile.group || projectile.mesh, scene);
  list.splice(index, 1);
}

function createChakramMesh() {
  const group = new THREE.Group();
  const steel = new THREE.MeshBasicMaterial({ color: 0xd8b45a, side: THREE.DoubleSide });
  const dark = new THREE.MeshBasicMaterial({ color: 0x4a2518, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.055, 4, 12), steel);
  group.add(ring);
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.07, 0.42), dark);
    blade.position.set(Math.cos(angle) * 0.32, Math.sin(angle) * 0.32, 0);
    blade.rotation.z = angle;
    group.add(blade);
  }
  const core = new THREE.Mesh(
    new THREE.CircleGeometry(0.1, 8),
    new THREE.MeshBasicMaterial({ color: 0xb89c46, side: THREE.DoubleSide })
  );
  group.add(core);
  return group;
}

function createGrenadeMesh() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0x364832 })
  );
  body.scale.y = 1.15;
  group.add(body);
  const fuse = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.05, 0.18, 6),
    new THREE.MeshBasicMaterial({ color: 0xb89c46 })
  );
  fuse.position.y = 0.28;
  group.add(fuse);
  const led = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.07, 0.07),
    new THREE.MeshBasicMaterial({ color: 0xa52020 })
  );
  led.position.set(0.12, 0.1, 0.12);
  group.add(led);
  return group;
}

function createAcidFlaskMesh() {
  const group = new THREE.Group();
  const glassMat = new THREE.MeshBasicMaterial({
    color: 0x2c4148, transparent: true, opacity: 0.9
  });
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.34, 8), glassMat);
  group.add(glass);
  const liquid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.16, 0.2, 8),
    new THREE.MeshBasicMaterial({ color: 0x55e038 })
  );
  liquid.position.y = -0.05;
  group.add(liquid);
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.07, 0.14, 6),
    new THREE.MeshBasicMaterial({ color: 0xb89c46 })
  );
  neck.position.y = 0.24;
  group.add(neck);
  return group;
}

function createAcidCloudMesh(radius) {
  const mesh = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 24),
    new THREE.MeshBasicMaterial({
      color: 0x55e038, transparent: true, opacity: 0.26,
      side: THREE.DoubleSide, depthWrite: false
    })
  );
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

function spawnExplosionFx(ctx, pos, radius, color = 0xff8822) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(1, 8, 6),
    new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.8,
      side: THREE.DoubleSide, depthWrite: false
    })
  );
  mesh.position.copy(pos).add(new THREE.Vector3(0, 1.0, 0));
  ctx.scene.add(mesh);
  ctx.vfx.push({
    mesh, disposeGeo: true, disposeMat: true,
    life: 0.24, maxLife: 0.24, fade: true, scaleSpeed: radius * 3.6
  });
}

function applyExplosionDamage(ctx, center, radius, damage, knockback = 3.0) {
  if (ctx.isDead) return;
  for (const enemy of ctx.activeEnemies) {
    if (!enemy.active || enemy.state === 'dead') continue;
    const dx = enemy.group.position.x - center.x;
    const dz = enemy.group.position.z - center.z;
    if (Math.hypot(dx, dz) > radius) continue;
    if (Math.abs(enemy.group.position.y - center.y) > 2.6) continue;
    const dir = new THREE.Vector3(dx, 0, dz);
    if (dir.lengthSq() < 0.0001) dir.set(0, 0, 1);
    else dir.normalize();
    ctx.damageEnemy(enemy, damage, dir.multiplyScalar(knockback), false, { fromProjectile: true });
  }
}

export function fireChakram(scene, playerPos, facingYaw, level, mods, projectiles, vfx, bodyYaw = facingYaw) {
  const { cfg, mult } = getWeaponScaling('chakram', level);
  const desired = 1 + (mods.bonusProjectiles || 0);
  const freeSlots = Math.max(0, CHAKRAM_CAP - countKind(projectiles, 'chakram'));
  const count = Math.min(4, desired, freeSlots);
  if (count <= 0) return facingYaw;

  const hand = getDirectionalHandPos(playerPos, bodyYaw, 0.8, 0.3, 1.05);
  const baseDir = new THREE.Vector3(0, 0, -1).applyAxisAngle(Y_AXIS, facingYaw);
  const damage = cfg.baseDmg * mult * mods.dmgMult;
  const range = cfg.baseRange * (mods.areaMult || 1);

  AudioSys.playSlash();
  for (let i = 0; i < count; i++) {
    const offset = count === 1 ? 0 : ((i / (count - 1)) - 0.5) * Math.min(0.9, count * 0.2);
    const dir = baseDir.clone().applyAxisAngle(Y_AXIS, offset).normalize();
    const group = createChakramMesh();
    group.position.copy(hand).addScaledVector(dir, 0.4);
    scene.add(group);
    projectiles.push({
      kind: 'chakram',
      group,
      dir,
      speed: 13,
      range,
      traveled: 0,
      phase: 'out',
      damage,
      hitOut: new Set(),
      hitBack: new Set(),
      spin: 16,
      life: 3.5
    });
  }
  return facingYaw;
}

export function throwGrenade(scene, playerPos, facingYaw, level, mods, projectiles, bodyYaw = facingYaw) {
  const { cfg, mult } = getWeaponScaling('grenade', level);
  const desired = 1 + (mods.bonusProjectiles || 0);
  const freeSlots = Math.max(0, GRENADE_CAP - countKind(projectiles, 'grenade'));
  const count = Math.min(3, desired, freeSlots);
  if (count <= 0) return facingYaw;

  const hand = getDirectionalHandPos(playerPos, bodyYaw, 0.8, 0.3, 1.05);
  const baseDir = new THREE.Vector3(0, 0, -1).applyAxisAngle(Y_AXIS, facingYaw);
  const damage = cfg.baseDmg * mult * mods.dmgMult * (mods.explosiveDmgMult || 1);
  const radius = (2.8 + level * 0.08) * (mods.areaMult || 1);

  AudioSys.playMinePlace();
  for (let i = 0; i < count; i++) {
    const offset = count === 1 ? 0 : ((i / (count - 1)) - 0.5) * Math.min(0.8, count * 0.18);
    const dir = baseDir.clone().applyAxisAngle(Y_AXIS, offset).normalize();
    const group = createGrenadeMesh();
    group.position.copy(hand).addScaledVector(dir, 0.35);
    scene.add(group);
    projectiles.push({
      kind: 'grenade',
      group,
      vel: dir.multiplyScalar(11.5),
      vy: 5.4,
      gravity: 16,
      damage,
      blastRadius: radius,
      cluster: level >= 4 ? (level >= 7 ? 4 : 3) : 0,
      life: 3.0,
      fuse: 0
    });
  }
  return facingYaw;
}

export function throwAcidFlask(scene, playerPos, facingYaw, level, mods, projectiles, bodyYaw = facingYaw) {
  const { cfg, mult } = getWeaponScaling('acid', level);
  const desired = 1 + (mods.bonusProjectiles || 0);
  const freeSlots = Math.max(0, FLASK_CAP - countKind(projectiles, 'acidFlask'));
  const count = Math.min(3, desired, freeSlots);
  if (count <= 0) return facingYaw;

  const hand = getDirectionalHandPos(playerPos, bodyYaw, 0.8, 0.3, 1.05);
  const baseDir = new THREE.Vector3(0, 0, -1).applyAxisAngle(Y_AXIS, facingYaw);
  const damage = cfg.baseDmg * mult * mods.dmgMult;
  const radius = (2.6 + level * 0.08) * (mods.areaMult || 1);
  const dps = (6 + level * 1.5) * mods.dmgMult;

  AudioSys.play(210, 0.08, 'sine', 0.04);
  for (let i = 0; i < count; i++) {
    const offset = count === 1 ? 0 : ((i / (count - 1)) - 0.5) * Math.min(0.75, count * 0.16);
    const dir = baseDir.clone().applyAxisAngle(Y_AXIS, offset).normalize();
    const group = createAcidFlaskMesh();
    group.position.copy(hand).addScaledVector(dir, 0.35);
    scene.add(group);
    projectiles.push({
      kind: 'acidFlask',
      group,
      vel: dir.multiplyScalar(10.0),
      vy: 4.6,
      gravity: 15,
      damage,
      radius,
      dps,
      burnDps: dps * 0.6,
      cloudLife: 4.0 + level * 0.15,
      life: 2.8
    });
  }
  return facingYaw;
}

function updateChakram(projectile, dt, ctx) {
  projectile.life -= dt;
  projectile.group.rotation.z += projectile.spin * dt;
  projectile.group.rotation.y += projectile.spin * 0.45 * dt;

  if (projectile.phase === 'out') {
    projectile.group.position.addScaledVector(projectile.dir, projectile.speed * dt);
    projectile.traveled += projectile.speed * dt;
    if (projectile.traveled >= projectile.range) projectile.phase = 'back';
  } else {
    const toPlayer = ctx.playerGroup.position.clone().add(new THREE.Vector3(0, 1.05, 0))
      .sub(projectile.group.position);
    const dist = toPlayer.length();
    if (dist <= 0.8) return true;
    projectile.group.position.addScaledVector(toPlayer.normalize(), projectile.speed * 1.12 * dt);
  }

  if (!ctx.isDead) {
    const hitSet = projectile.phase === 'out' ? projectile.hitOut : projectile.hitBack;
    for (const enemy of ctx.activeEnemies) {
      if (!enemy.active || enemy.state === 'dead' || hitSet.has(enemy)) continue;
      const dx = enemy.group.position.x - projectile.group.position.x;
      const dz = enemy.group.position.z - projectile.group.position.z;
      if (Math.hypot(dx, dz) > 0.95) continue;
      if (Math.abs(enemy.group.position.y + 1.0 - projectile.group.position.y) > 2.2) continue;
      hitSet.add(enemy);
      const kb = new THREE.Vector3(dx, 0, dz);
      if (kb.lengthSq() < 0.0001) kb.set(0, 0, 1);
      else kb.normalize();
      ctx.damageEnemy(enemy, projectile.damage, kb.multiplyScalar(1.6), false, { fromProjectile: true });
      ctx.sendAutomaticAttack?.(
        'chakram',
        enemy.group.position.clone().add(new THREE.Vector3(0, 1.1, 0))
      );
      ctx.addCamShake?.(0.025);
    }
  }

  return projectile.life <= 0;
}

function explodeGrenade(projectile, ctx) {
  const center = projectile.group.position.clone();
  const ground = ctx.worldPhysics
    ? ctx.worldPhysics.getGroundHeight(center.x, center.z, center.y)
    : center.y;
  center.y = ground;

  applyExplosionDamage(ctx, center, projectile.blastRadius, projectile.damage, 3.4);
  spawnExplosionFx(ctx, center, projectile.blastRadius, 0xff8822);

  if (projectile.cluster > 0) {
    for (let i = 0; i < projectile.cluster; i++) {
      const angle = (i / projectile.cluster) * Math.PI * 2 + Math.random() * 0.3;
      const offset = projectile.blastRadius * 0.62;
      const sub = center.clone().add(new THREE.Vector3(
        Math.cos(angle) * offset, 0, Math.sin(angle) * offset
      ));
      applyExplosionDamage(
        ctx, sub, projectile.blastRadius * 0.65,
        projectile.damage * 0.55, 2.2
      );
      spawnExplosionFx(ctx, sub, projectile.blastRadius * 0.65, 0xffaa33);
    }
  }

  AudioSys.playMineExplode();
  ctx.addCamShake?.(0.2);
  ctx.sendAutomaticAttack?.('grenade_blast', center);
}

function updateGrenade(projectile, dt, ctx) {
  projectile.life -= dt;
  projectile.vy -= projectile.gravity * dt;
  projectile.group.position.addScaledVector(projectile.vel, dt);
  projectile.group.position.y += projectile.vy * dt;

  const ground = ctx.worldPhysics
    ? ctx.worldPhysics.getGroundHeight(
        projectile.group.position.x,
        projectile.group.position.z,
        projectile.group.position.y
      )
    : 0;

  const nearEnemy = !ctx.isDead && ctx.activeEnemies.some(enemy => {
    if (!enemy.active || enemy.state === 'dead') return false;
    const dx = enemy.group.position.x - projectile.group.position.x;
    const dz = enemy.group.position.z - projectile.group.position.z;
    return Math.hypot(dx, dz) < 0.8 &&
      Math.abs(enemy.group.position.y + 1.0 - projectile.group.position.y) < 1.4;
  });

  if (projectile.life <= 0 || nearEnemy ||
      (projectile.vy < 0 && projectile.group.position.y <= ground + 0.18)) {
    projectile.group.position.y = Math.max(projectile.group.position.y, ground + 0.1);
    explodeGrenade(projectile, ctx);
    return true;
  }
  return false;
}

function spawnAcidCloud(projectile, ctx) {
  const center = projectile.group.position.clone();
  const ground = ctx.worldPhysics
    ? ctx.worldPhysics.getGroundHeight(center.x, center.z, center.y)
    : center.y;
  center.y = ground;

  applyExplosionDamage(ctx, center, projectile.radius * 0.75, projectile.damage, 1.2);
  spawnExplosionFx(ctx, center, projectile.radius * 0.8, 0x55e038);

  if (countKind(ctx.projectiles, 'acidCloud') < CLOUD_CAP) {
    const mesh = createAcidCloudMesh(projectile.radius);
    mesh.position.set(center.x, ground + 0.06, center.z);
    ctx.scene.add(mesh);
    const cloudLife = projectile.cloudLife || 4.0;
    ctx.projectiles.push({
      kind: 'acidCloud',
      mesh,
      center,
      radius: projectile.radius,
      dps: projectile.dps,
      burnDps: projectile.burnDps,
      life: cloudLife,
      maxLife: cloudLife,
      tickTimer: 0,
      bubbleTimer: 0.4
    });
  }

  AudioSys.play(120, 0.22, 'sawtooth', 0.05);
  ctx.addCamShake?.(0.08);
  ctx.sendAutomaticAttack?.('acid_cloud', center);
}

function updateAcidFlask(projectile, dt, ctx) {
  projectile.life -= dt;
  projectile.vy -= projectile.gravity * dt;
  projectile.group.position.addScaledVector(projectile.vel, dt);
  projectile.group.position.y += projectile.vy * dt;

  const ground = ctx.worldPhysics
    ? ctx.worldPhysics.getGroundHeight(
        projectile.group.position.x,
        projectile.group.position.z,
        projectile.group.position.y
      )
    : 0;

  if (projectile.life <= 0 ||
      (projectile.vy < 0 && projectile.group.position.y <= ground + 0.2)) {
    projectile.group.position.y = Math.max(projectile.group.position.y, ground + 0.1);
    spawnAcidCloud(projectile, ctx);
    return true;
  }
  return false;
}

function updateAcidCloud(projectile, dt, ctx) {
  projectile.life -= dt;
  projectile.mesh.material.opacity = 0.18 + Math.abs(Math.sin(projectile.life * 8)) * 0.14;
  projectile.mesh.rotation.z += dt * 0.25;
  projectile.bubbleTimer -= dt;

  if (projectile.bubbleTimer <= 0) {
    projectile.bubbleTimer = 0.42;
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * projectile.radius;
    const bubble = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.12, 0.12),
      new THREE.MeshBasicMaterial({ color: 0xa8f044, transparent: true, opacity: 0.55 })
    );
    bubble.position.set(
      projectile.center.x + Math.cos(angle) * r,
      projectile.center.y + 0.15 + Math.random() * 0.5,
      projectile.center.z + Math.sin(angle) * r
    );
    ctx.scene.add(bubble);
    ctx.vfx.push({
      mesh: bubble, disposeGeo: true, disposeMat: true,
      life: 0.35, maxLife: 0.35, fade: true,
      vel: new THREE.Vector3(0, 0.5, 0)
    });
  }

  if (projectile.life <= 0) return true;

  projectile.tickTimer -= dt;
  if (!ctx.isDead && projectile.tickTimer <= 0) {
    projectile.tickTimer = 0.3;
    for (const enemy of ctx.activeEnemies) {
      if (!enemy.active || enemy.state === 'dead') continue;
      const dx = enemy.group.position.x - projectile.center.x;
      const dz = enemy.group.position.z - projectile.center.z;
      if (Math.hypot(dx, dz) > projectile.radius) continue;
      enemy.applySlow?.(0.72, 0.8);
      enemy.applyBurn?.(projectile.burnDps, 1.2);
      ctx.damageEnemy(enemy, projectile.dps * 0.3, null, true, {
        fromProjectile: true,
        burnDps: projectile.burnDps,
        burnDuration: 1.2
      });
    }
  }
  return false;
}

export function updatePlayerProjectiles(dt, ctx) {
  const list = ctx.projectiles;
  if (!Array.isArray(list)) return;

  for (let i = list.length - 1; i >= 0; i--) {
    const projectile = list[i];
    let remove = false;

    if (projectile.kind === 'chakram') remove = updateChakram(projectile, dt, ctx);
    else if (projectile.kind === 'grenade') remove = updateGrenade(projectile, dt, ctx);
    else if (projectile.kind === 'acidFlask') remove = updateAcidFlask(projectile, dt, ctx);
    else if (projectile.kind === 'acidCloud') remove = updateAcidCloud(projectile, dt, ctx);

    if (remove) removeProjectile(list, i, ctx.scene);
  }
}

export function clearPlayerProjectiles(scene, list) {
  if (!Array.isArray(list)) return;
  while (list.length > 0) removeProjectile(list, list.length - 1, scene);
}
