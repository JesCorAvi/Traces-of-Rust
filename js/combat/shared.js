// Recursos compartidos de combate, luz de destello y helpers de armas.
// Exports: SHARED_GEO, SHARED_MAT, initCombatLight, triggerCombatFlash, updateCombatLight, getWeaponScaling, getDirectionalHandPos.

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { SpriteSheets } from '../spritesheets.js';

// Geometrías y materiales compartidos en VRAM para evitar crear objetos o clonar texturas en combate
export const SHARED_GEO = {
  spark: new THREE.BoxGeometry(0.18, 0.18, 0.18),
  shell: new THREE.BoxGeometry(0.1, 0.22, 0.1),
  flame: new THREE.PlaneGeometry(0.55, 0.55),
  muzzleFlash: new THREE.PlaneGeometry(1.2, 1.2),
  mineBody: new THREE.CylinderGeometry(0.38, 0.45, 0.18, 8),
  mineLed: new THREE.BoxGeometry(0.14, 0.14, 0.14),
  orbitalPlane: new THREE.PlaneGeometry(1.35, 1.35),
  bossProj: new THREE.BoxGeometry(0.42, 0.42, 0.42)
};

export const SHARED_MAT = {
  sparkBlood: new THREE.MeshBasicMaterial({ color: 0xa52020 }),
  sparkGold:  new THREE.MeshBasicMaterial({ color: 0xffe699 }),
  shellRed:   new THREE.MeshBasicMaterial({ color: 0xa52020 }),
  mineBody:   new THREE.MeshStandardMaterial({ color: 0x3b2316, roughness: 0.85 }),
  mineLed:    new THREE.MeshBasicMaterial({ color: 0xff2222 }),
  slashMat:   null,
  orbitalMat: null
};

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
  }
  if (!SHARED_MAT.orbitalMat && SpriteSheets.env && SpriteSheets.env.orbital) {
    SHARED_MAT.orbitalMat = new THREE.MeshBasicMaterial({
      map: SpriteSheets.env.orbital.tex,
      transparent: true,
      alphaTest: 0.2,
      side: THREE.DoubleSide
    });
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
