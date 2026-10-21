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

export function createPickupSystem({ scene, worldPhysics, drops, net = null }) {
  let nextPickupNetId = 1;
  let lastCtx = null;

  function spawnLorePickup(originPos, type = 'serum', value = 1, opts = {}) {
    // En co-op el Cliente no genera pickups: llegan por PICKUP_SPAWN.
    if (!opts.fromNetwork && net?.isMatchActive && !net.isHost()) return null;
    if (type === 'scrap' && drops.length >= (CONFIG.CORE_DEFENSE.SCRAP.maxActivePickups || 40)) {
      return null;
    }
    if (opts.fromNetwork && Number.isFinite(opts.pickupNetId)
      && drops.some(d => d.pickupNetId === opts.pickupNetId)) {
      return null;
    }

    const group = new THREE.Group();
    const isChest = type === 'chest';
    const isTooth = type === 'tooth';
    const isScrap = type === 'scrap';
    const pickupNetId = opts.fromNetwork && Number.isFinite(opts.pickupNetId)
      ? opts.pickupNetId
      : nextPickupNetId++;
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

    const drop = {
      group, spriteMesh, shadowDisc, baseHeight,
      type,
      pickupNetId,
      bobPhase: Math.random() * Math.PI * 2,
      age: 0,
      isBossChest: isChest,
      isTooth,
      isScrap,
      value: Math.max(1, value)
    };
    drops.push(drop);

    if (!opts.fromNetwork && net?.isMatchActive && net.isHost()) {
      net.sendPickupSpawn(drop);
    }
    return drop;
  }

  function removePickupByNetId(pickupNetId) {
    const idx = drops.findIndex(d => d.pickupNetId === pickupNetId);
    if (idx === -1) return null;
    const drop = drops[idx];
    scene.remove(drop.group);
    drops.splice(idx, 1);
    return drop;
  }

  function applyRewardToLocal(type, value) {
    const ctx = lastCtx;
    if (!ctx) return;
    if (type === 'chest') {
      ctx.stats.hp = Math.min(ctx.stats.maxHp, ctx.stats.hp + ctx.stats.maxHp * 0.5);
      ctx.stats.level++;
      AudioSys.playUISelect();
      ctx.showLevelUp();
    } else if (type === 'tooth') {
      ctx.onTooth();
      AudioSys.playPickup('tooth');
    } else if (type === 'scrap') {
      ctx.onScrap(value || 1);
      AudioSys.playPickup('scrap');
    } else {
      ctx.stats.exp++;
      AudioSys.playPickup('exp');
      if (ctx.stats.exp >= ctx.stats.maxExp) {
        ctx.stats.level++;
        ctx.stats.exp -= ctx.stats.maxExp;
        ctx.stats.maxExp = Math.floor(ctx.stats.maxExp * 1.38);
        ctx.showLevelUp();
      }
    }
    ctx.refreshHUD();
  }

  function applyCollectedReward(data) {
    if (!data) return;
    const type = data.pickupType || data.type;
    if (type === 'scrap') return;
    applyRewardToLocal(type, data.value);
  }

  function updateDrops(dt, ctx) {
    lastCtx = ctx;
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

        if (net?.isMatchActive) {
          if (net.isHost()) {
            // El Host arbitra la recogida y confirma a ambos peers.
            applyRewardToLocal(d.type, d.value);
            net.broadcastPickupCollected({
              pickupNetId: d.pickupNetId,
              pickupType: d.type,
              value: d.value,
              collector: net.getLocalSteamId?.() || 'host'
            });
          } else {
            // El Cliente confirma con el Host antes de aplicar la recompensa;
            // la chatarra se acredita vía SCRAP_GAIN (reparto 50/50).
            net.requestPickupCollect({
              pickupNetId: d.pickupNetId,
              pickupType: d.type,
              value: d.value
            });
          }
        } else {
          applyRewardToLocal(d.type, d.value);
        }
        refreshHUD();
      }
    }
  }

  return {
    spawnLorePickup,
    updateDrops,
    removePickupByNetId,
    applyCollectedReward
  };
}
