// Pickups de la run: assets procedurales, spawn, imán, recogida y efectos.
// Exports: createPickupSystem.

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { SpriteSheets } from '../spritesheets.js';
import { AudioSys } from '../audio.js';

const PICKUP_ASSETS = {
  smallGeo: new THREE.PlaneGeometry(0.9, 0.9),
  chestGeo: new THREE.PlaneGeometry(1.45, 1.45),
  shadowGeo: new THREE.CircleGeometry(0.32, 10),
  shadowMat: new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.58 }),
  mats: {},
  texs: {}
};

[
  { key: 'serum', sheet: SpriteSheets.env.pickup_serum },
  { key: 'tooth', sheet: SpriteSheets.env.pickup_tooth },
  { key: 'chest', sheet: SpriteSheets.env.pickup_chest },
  { key: 'scrap', sheet: SpriteSheets.env.pickup_scrap }
].forEach(({ key, sheet }) => {
  const t = sheet.tex;
  t.repeat.set(0.25, 1); t.offset.set(0, 0);
  PICKUP_ASSETS.texs[key] = t;
  PICKUP_ASSETS.mats[key] = new THREE.MeshBasicMaterial({
    map: t, transparent: true, alphaTest: 0.15, side: THREE.DoubleSide
  });
});

export function createPickupSystem({ scene, worldPhysics, drops }) {
  function spawnLorePickup(originPos, type = 'serum', value = 1) {
    if (type === 'scrap' && drops.length >= (CONFIG.CORE_DEFENSE.SCRAP.maxActivePickups || 40)) {
      return;
    }

    const group = new THREE.Group();
    const isChest = type === 'chest';
    const isTooth = type === 'tooth';
    const isScrap = type === 'scrap';
    const groundY = worldPhysics ? worldPhysics.getGroundHeight(originPos.x, originPos.z, originPos.y) : originPos.y;
    group.position.set(originPos.x, groundY, originPos.z);

    const spriteMesh = new THREE.Mesh(
      isChest ? PICKUP_ASSETS.chestGeo : PICKUP_ASSETS.smallGeo,
      PICKUP_ASSETS.mats[type] || PICKUP_ASSETS.mats.serum
    );
    const baseHeight = isChest ? 0.72 : (isScrap ? 0.42 : 0.48);
    spriteMesh.position.y = baseHeight;

    const shadowDisc = new THREE.Mesh(PICKUP_ASSETS.shadowGeo, PICKUP_ASSETS.shadowMat);
    shadowDisc.rotation.x = -Math.PI / 2;
    shadowDisc.position.y = 0.025;
    if (isChest) shadowDisc.scale.set(1.6, 1.6, 1);
    if (isScrap) shadowDisc.scale.set(0.75, 0.75, 1);

    group.add(spriteMesh, shadowDisc);
    scene.add(group);
    drops.push({
      group, spriteMesh, shadowDisc, baseHeight,
      bobPhase: Math.random() * Math.PI * 2,
      age: 0,
      isBossChest: isChest,
      isTooth,
      isScrap,
      value: Math.max(1, value)
    });
  }

  function updateDrops(dt, ctx) {
    const { playerGroup, gameTime, camAngle, stats, magnetRange, onTooth, onScrap, showLevelUp, refreshHUD } = ctx;

    const frameOffset = (Math.floor(gameTime * 6.5) % 4) * 0.25;
    PICKUP_ASSETS.texs.serum.offset.x = frameOffset;
    PICKUP_ASSETS.texs.tooth.offset.x = frameOffset;
    PICKUP_ASSETS.texs.chest.offset.x = frameOffset;
    PICKUP_ASSETS.texs.scrap.offset.x = frameOffset;

    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.age = (d.age || 0) + dt;
      d.spriteMesh.rotation.y = camAngle;
      d.spriteMesh.position.y = d.baseHeight + Math.sin(gameTime * 5.2 + d.bobPhase) * 0.1;
      const dist = d.group.position.distanceTo(playerGroup.position);
      if (dist < magnetRange) {
        const pullDir = new THREE.Vector3().subVectors(playerGroup.position, d.group.position).normalize();
        d.group.position.addScaledVector(pullDir, 18.5 * dt);
      } else if (d.isScrap && d.age > 0.5) {
        const pullDir = new THREE.Vector3().subVectors(playerGroup.position, d.group.position).normalize();
        d.group.position.addScaledVector(pullDir, 7.5 * dt);
      }
      if (dist < 1.45) {
        scene.remove(d.group);
        drops.splice(i, 1);
        if (d.isBossChest) {
          stats.hp = Math.min(stats.maxHp, stats.hp + stats.maxHp * 0.5);
          stats.level++;
          AudioSys.playUISelect();
          showLevelUp();
        } else if (d.isTooth) {
          onTooth();
          AudioSys.play(640, 0.07, 'sine', 0.05);
        } else if (d.isScrap) {
          onScrap(d.value || 1);
          AudioSys.play(520, 0.07, 'square', 0.045);
        } else {
          stats.exp++;
          AudioSys.play(420, 0.06, 'sine', 0.04);
          if (stats.exp >= stats.maxExp) {
            stats.level++;
            stats.exp -= stats.maxExp;
            stats.maxExp = Math.floor(stats.maxExp * 1.38);
            showLevelUp();
          }
        }
        refreshHUD();
      }
    }
  }

  return { spawnLorePickup, updateDrops };
}
