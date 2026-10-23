// Recursos compartidos de combate, luz de destello y helpers de armas.
// Exports: SHARED_GEO, SHARED_MAT, initCombatLight, triggerCombatFlash, updateCombatLight, getWeaponScaling, getDirectionalHandPos, spawnEnemyProjectile, spawnHitBlood, spawnEnemyDeathGore, spawnDissolveAshWisp.

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { SpriteSheets } from '../spritesheets.js';

// Geometrías y materiales compartidos en VRAM para evitar crear objetos o clonar texturas en combate
export const SHARED_GEO = {
  spark:          new THREE.BoxGeometry(0.18, 0.18, 0.18),
  bloodDrop:      new THREE.BoxGeometry(0.12, 0.12, 0.12),
  bloodDropSmall: new THREE.BoxGeometry(0.08, 0.08, 0.08),
  bloodChunk:     new THREE.BoxGeometry(0.22, 0.18, 0.22),
  bloodPuddle:    new THREE.CircleGeometry(0.65, 8),
  shell:          new THREE.BoxGeometry(0.1, 0.22, 0.1),
  flame:          new THREE.PlaneGeometry(0.55, 0.55),
  muzzleFlash:    new THREE.PlaneGeometry(1.2, 1.2),
  mineBody:       new THREE.CylinderGeometry(0.38, 0.45, 0.18, 8),
  mineLed:        new THREE.BoxGeometry(0.14, 0.14, 0.14),
  orbitalPlane:   new THREE.PlaneGeometry(1.35, 1.35),
  bossProj:       new THREE.BoxGeometry(0.42, 0.42, 0.42),
  dissolveAsh:    new THREE.BoxGeometry(0.12, 0.12, 0.12)
};

export const SHARED_MAT = {
  sparkBlood:  new THREE.MeshBasicMaterial({ color: 0xa52020 }),
  bloodDark:   new THREE.MeshBasicMaterial({ color: 0x6e1414 }),
  bloodGore:   new THREE.MeshBasicMaterial({ color: 0x4a1212 }),
  bloodRust:   new THREE.MeshBasicMaterial({ color: 0x4a2518 }),
  dissolveAsh: new THREE.MeshBasicMaterial({ color: 0x241814 }),
  puddleMat:   new THREE.MeshBasicMaterial({ color: 0x3d0b0b, depthWrite: false }),
  sparkGold:   new THREE.MeshBasicMaterial({ color: 0xffe699 }),
  shellRed:    new THREE.MeshBasicMaterial({ color: 0xa52020 }),
  mineBody:    new THREE.MeshStandardMaterial({ color: 0x3b2316, roughness: 0.85 }),
  mineLed:     new THREE.MeshBasicMaterial({ color: 0xff2222 }),
  enemyProj:   new THREE.MeshBasicMaterial({ color: 0xff3b16 }),
  slashMat:    null,
  orbitalMat:  null
};

Object.values(SHARED_GEO).forEach(g => { if (g) g.userData = { sharedGeo: true }; });
Object.values(SHARED_MAT).forEach(m => { if (m) m.userData = { sharedMat: true }; });

let combatFlashLight = null;
let combatFlashTimer = 0;

export function initCombatLight(scene) {
  if (!combatFlashLight) {
    combatFlashLight = new THREE.PointLight(0xffaa33, 0, 12, 1.5);
    scene.add(combatFlashLight);
  }
  if (!SHARED_MAT.slashMat && SpriteSheets.env && SpriteSheets.env.slash) {
    SHARED_MAT.slashMat = new THREE.MeshBasicMaterial({
      map: SpriteSheets.env.slash.tex,
      transparent: true,
      alphaTest: 0.15,
      side: THREE.DoubleSide
    });
    SHARED_MAT.slashMat.userData = { sharedMat: true };
  }
  if (!SHARED_MAT.orbitalMat && SpriteSheets.env && SpriteSheets.env.orbital) {
    SHARED_MAT.orbitalMat = new THREE.MeshBasicMaterial({
      map: SpriteSheets.env.orbital.tex,
      transparent: true,
      alphaTest: 0.2,
      side: THREE.DoubleSide
    });
    SHARED_MAT.orbitalMat.userData = { sharedMat: true };
  }
}

export function triggerCombatFlash(pos, colorHex, intensity, duration = 0.09) {
  if (!combatFlashLight) return;
  combatFlashLight.position.copy(pos);
  combatFlashLight.color.setHex(colorHex);
  combatFlashLight.intensity = intensity;
  combatFlashTimer = duration;
}

export function updateCombatLight(dt) {
  if (!combatFlashLight || combatFlashTimer <= 0) return;
  combatFlashTimer -= dt;
  if (combatFlashTimer <= 0) {
    combatFlashLight.intensity = 0;
  }
}

export function getWeaponScaling(id, level) {
  const cfg = CONFIG.SKILLS[id];
  const mult = 1 + (level - 1) * cfg.scalePerLvl;
  return { cfg, mult };
}

export function getDirectionalHandPos(playerPos, facingYaw, forwardDist = 0.85, rightOffset = 0.36, heightOffset = 1.08) {
  const fwd = new THREE.Vector3(-Math.sin(facingYaw), 0, -Math.cos(facingYaw));
  const right = new THREE.Vector3(Math.cos(facingYaw), 0, -Math.sin(facingYaw));
  return playerPos.clone()
    .addScaledVector(fwd, forwardDist)
    .addScaledVector(right, rightOffset)
    .add(new THREE.Vector3(0, heightOffset, 0));
}

export function spawnEnemyProjectile(scene, projectiles, origin, dir, speed, dmg) {
  if (!scene || !projectiles) return;
  const pMesh = new THREE.Mesh(SHARED_GEO.bossProj, SHARED_MAT.enemyProj);
  pMesh.position.copy(origin);
  pMesh.scale.set(0.65, 0.65, 0.65);
  scene.add(pMesh);
  projectiles.push({
    mesh: pMesh,
    vel: dir.clone().multiplyScalar(speed),
    life: 3.5,
    dmg,
    sharedMat: true
  });
}

// Genera rociada direccional de gotas y trozos de sangre al recibir daño
export function spawnHitBlood(scene, vfx, pos, opts = {}) {
  if (!scene || !Array.isArray(vfx) || !pos) return;
  if (vfx.length > 250) return;
  const isCrit = !!opts.isCrit;
  const damage = opts.damage || 0;
  const hitDir = opts.hitDir || null;
  let count = isCrit ? 10 : (damage >= 35 ? 7 : (opts.count || 4));
  if (vfx.length > 120) count = Math.min(count, 3);
  const floorY = (opts.floorY ?? (pos.y - 0.95)) + 0.04;

  for (let i = 0; i < count; i++) {
    const isChunk = isCrit && (i === 0 || Math.random() < 0.25);
    const geo = isChunk ? SHARED_GEO.bloodChunk : (Math.random() < 0.55 ? SHARED_GEO.bloodDrop : SHARED_GEO.bloodDropSmall);
    const matRoll = Math.random();
    const mat = matRoll < 0.5 ? SHARED_MAT.sparkBlood : (matRoll < 0.8 ? SHARED_MAT.bloodDark : SHARED_MAT.bloodGore);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos).add(new THREE.Vector3(
      (Math.random() - 0.5) * 0.25,
      (Math.random() - 0.5) * 0.25,
      (Math.random() - 0.5) * 0.25
    ));
    scene.add(mesh);

    let sprayX = (Math.random() - 0.5) * 3.5;
    let sprayZ = (Math.random() - 0.5) * 3.5;
    if (hitDir) {
      sprayX = hitDir.x * (2.6 + Math.random() * 3.2) + (Math.random() - 0.5) * 2.2;
      sprayZ = hitDir.z * (2.6 + Math.random() * 3.2) + (Math.random() - 0.5) * 2.2;
    }
    const upward = (isCrit ? 2.6 : 1.6) + Math.random() * (isCrit ? 3.2 : 2.2);

    vfx.push({
      mesh,
      life: 0.32 + Math.random() * 0.22,
      maxLife: 0.55,
      vel: new THREE.Vector3(sprayX, upward, sprayZ),
      gravity: 17,
      floorY,
      scaleSpeed: -0.6
    });
  }
}

// Explosión visceral de gore, sangre y charco expansivo al morir una unidad
export function spawnEnemyDeathGore(scene, vfx, pos, opts = {}) {
  if (!scene || !Array.isArray(vfx) || !pos) return;
  if (vfx.length > 250) return;
  const isBoss = !!opts.isBoss;
  const baseSize = opts.size || 2.0;
  let count = isBoss ? 26 : (opts.count || 12);
  if (vfx.length > 120 && !isBoss) count = Math.min(count, 6);
  const floorY = pos.y + 0.02;
  const hitDir = opts.hitDir || null;

  // 1. Sangre y vísceras en dispersión radial
  for (let i = 0; i < count; i++) {
    const isChunk = Math.random() < (isBoss ? 0.35 : 0.22);
    const geo = isChunk ? SHARED_GEO.bloodChunk : (Math.random() < 0.5 ? SHARED_GEO.bloodDrop : SHARED_GEO.bloodDropSmall);
    const matRoll = Math.random();
    const mat = matRoll < 0.4 ? SHARED_MAT.sparkBlood : (matRoll < 0.7 ? SHARED_MAT.bloodDark : (matRoll < 0.88 ? SHARED_MAT.bloodGore : SHARED_MAT.bloodRust));
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      pos.x + (Math.random() - 0.5) * 0.35,
      pos.y + 0.3 + Math.random() * (baseSize * 0.45),
      pos.z + (Math.random() - 0.5) * 0.35
    );
    scene.add(mesh);

    const angle = Math.random() * Math.PI * 2;
    const speed = (isBoss ? 4.2 : 2.4) + Math.random() * (isBoss ? 5.0 : 3.2);
    const vel = new THREE.Vector3(
      Math.cos(angle) * speed + (hitDir ? hitDir.x * 2.2 : 0),
      2.4 + Math.random() * (isBoss ? 4.8 : 3.0),
      Math.sin(angle) * speed + (hitDir ? hitDir.z * 2.2 : 0)
    );

    vfx.push({
      mesh,
      life: 0.42 + Math.random() * 0.32,
      maxLife: 0.75,
      vel,
      gravity: 19,
      floorY,
      scaleSpeed: -0.55
    });
  }

  // 2. Charco de sangre / aceite en el suelo (decal plano procedural)
  const puddleMesh = new THREE.Mesh(SHARED_GEO.bloodPuddle, SHARED_MAT.puddleMat);
  puddleMesh.rotation.x = -Math.PI / 2;
  puddleMesh.position.set(pos.x, floorY + 0.005, pos.z);
  const targetScale = (isBoss ? 2.0 : 0.9) * (0.85 + Math.random() * 0.3);
  puddleMesh.scale.set(0.12, 0.12, 0.12);
  scene.add(puddleMesh);

  let puddleAge = 0;
  const puddleMaxLife = isBoss ? 4.5 : 3.0;
  vfx.push({
    mesh: puddleMesh,
    life: puddleMaxLife,
    maxLife: puddleMaxLife,
    customUpdate: (dt) => {
      puddleAge += dt;
      if (puddleAge < 0.22) {
        const s = 0.12 + (targetScale - 0.12) * (puddleAge / 0.22);
        puddleMesh.scale.set(s, s, 1);
      } else if (puddleAge > puddleMaxLife - 0.75) {
        const fadeRatio = Math.max(0, (puddleMaxLife - puddleAge) / 0.75);
        const s = targetScale * fadeRatio;
        puddleMesh.scale.set(s, s, 1);
      }
    }
  });
}

// Briznas de ceniza y vapor de óxido que ascienden mientras el cadáver se disuelve
export function spawnDissolveAshWisp(scene, vfx, pos, opts = {}) {
  if (!scene || !Array.isArray(vfx) || !pos) return;
  if (vfx.length > 150) return;
  const count = opts.count || 2;
  const height = opts.height || 0.6;
  const isBoss = !!opts.isBoss;

  for (let i = 0; i < count; i++) {
    const geo = SHARED_GEO.dissolveAsh;
    const mat = Math.random() < 0.6 ? SHARED_MAT.dissolveAsh : SHARED_MAT.bloodRust;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      pos.x + (Math.random() - 0.5) * (isBoss ? 1.1 : 0.5),
      pos.y + 0.1 + Math.random() * height,
      pos.z + (Math.random() - 0.5) * (isBoss ? 1.1 : 0.5)
    );
    scene.add(mesh);

    vfx.push({
      mesh,
      life: 0.35 + Math.random() * 0.22,
      maxLife: 0.58,
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        0.8 + Math.random() * 1.3,
        (Math.random() - 0.5) * 0.5
      ),
      scaleSpeed: -0.28
    });
  }
}
