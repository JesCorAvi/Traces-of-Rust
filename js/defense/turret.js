// Torreta: entidad defensiva, modelo/sprite, mejoras y lógica de combate.
// Exports: Turret.

import * as THREE from 'three';
import { DefensiveStructure } from './defensiveStructure.js';
import { AudioSys } from '../audio.js';
import {
  recomputeStats,
  applyUpgradeVisuals,
  getUpgradeState,
  upgrade,
  getSellValue
} from './turrets/stats.js';
import { buildMaterials, buildModel } from './turrets/models/base.js';
import { buildBillboard, buildHealthBar, updateHealthBar } from './turrets/view.js';
import {
  getEffectiveDamage,
  getEffectiveFireRate,
  getEnemiesInRange,
  findTarget,
  getMuzzleWorldPos,
  faceTarget
} from './turrets/targeting.js';
import { updateCombat } from './turrets/combat/update.js';
import { updateBarracks, updateSupport } from './turrets/combat/support.js';

export class Turret extends DefensiveStructure {
  constructor(scene, worldPhysics, position, cfg, system, facingYaw = 0, turretId = null) {
    super(scene, worldPhysics, {
      id: turretId || `${cfg.id}_${Date.now()}_${Math.floor(Math.random() * 9999)}`,
      name: cfg.name,
      structureType: 'tower',
      position,
      maxHp: cfg.base.hp,
      collisionRadius: cfg.base.collisionRadius,
      attackStopDistance: cfg.base.attackStopDistance,
      height: cfg.base.height,
      targetPriority: 2
    });

    this.cfg = cfg;
    this.system = system;
    this.facingYaw = facingYaw;
    this.base = cfg.base;
    this.paths = cfg.paths;
    this.levels = [0, 0, 0];
    this.invested = cfg.cost;
    this.specials = new Set();
    this.visualKeys = new Set();
    this.stats = null;

    this.fireTimer = 0;
    this.animTimer = Math.random();
    this.firingFlash = 0;
    this.pulseCount = 0;
    this.spawnTimer = 0;
    this.supportPulseTimer = 0;
    this.supportShieldTimer = 0;
    this.burstActive = 0;
    this.burstCooldown = 0;
    this.hitFlashTimer = 0;

    this.supportFireRateBonus = 0;
    this.supportDamageBonus = 0;

    this.modelRoot = new THREE.Group();
    this.modelRoot.rotation.y = facingYaw;
    this.group.add(this.modelRoot);
    this.visualParts = {};

    buildMaterials(this);
    recomputeStats(this);
    buildModel(this);
    buildBillboard(this);
    buildHealthBar(this);
    applyUpgradeVisuals(this);
  }

  addPart(geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, visible = true) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    // Las piezas emisivas no proyectan sombra (rendimiento y coherencia visual)
    const emissive = mat === this.glowMat || mat === this.accentMat;
    mesh.castShadow = !emissive;
    mesh.receiveShadow = !emissive;
    mesh.visible = visible;
    this.modelRoot.add(mesh);
    return mesh;
  }

  addHiddenPart(name, geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = this.addPart(geo, mat, x, y, z, rx, ry, rz, false);
    this.visualParts[name] = mesh;
    return mesh;
  }

  recomputeStats() { recomputeStats(this); }
  applyUpgradeVisuals() { applyUpgradeVisuals(this); }
  getUpgradeState(pathIndex) { return getUpgradeState(this, pathIndex); }
  upgrade(pathIndex) { return upgrade(this, pathIndex); }
  getSellValue() { return getSellValue(this); }
  getEffectiveDamage() { return getEffectiveDamage(this); }
  getEffectiveFireRate() { return getEffectiveFireRate(this); }
  getEnemiesInRange(enemies) { return getEnemiesInRange(this, enemies); }
  findTarget(enemies) { return findTarget(this, enemies); }
  getMuzzleWorldPos() { return getMuzzleWorldPos(this); }
  faceTarget(targetPos) { faceTarget(this, targetPos); }
  updateHealthBar(cameraPos) { updateHealthBar(this, cameraPos); }
  updateCombat(dt, enemies, ctx) { updateCombat(this, dt, enemies, ctx); }
  updateBarracks(dt, ctx) { updateBarracks(this, dt, ctx); }
  updateSupport(dt, ctx) { updateSupport(this, dt, ctx); }

  update(dt, ctx) {
    if (this.destroyed || !this.active) return;

    this.animTimer += dt;
    if (this.firingFlash > 0) this.firingFlash -= dt;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    const enemies = ctx.enemyPool.active;

    if (this.sprite) {
      this.sprite.faceCamera(ctx.camera.position);
      const state = this.firingFlash > 0 ? 1 : 0;
      const fps = state === 1 ? 12 : 4;
      this.sprite.setDirectionalFrame(0, state, Math.floor(this.animTimer * fps) % 4);
    }

    this.updateHealthBar(ctx.camera.position);

    if (this.cfg.id === 'barracks') {
      this.updateBarracks(dt, ctx);
    } else if (this.cfg.id === 'support') {
      this.updateSupport(dt, ctx);
    } else {
      this.updateCombat(dt, enemies, ctx);
    }

    if (this.hitFlashTimer > 0) {
      const c = new THREE.Color(0x6e1414);
      this.accentMat.emissive.copy(c);
      this.accentMat.emissiveIntensity = 0.9;
    } else {
      this.accentMat.emissive.setHex(this.cfg.color);
      this.accentMat.emissiveIntensity = 0.6;
    }
  }

  onShieldDamaged() {
    AudioSys.play(420, 0.06, 'triangle', 0.025);
  }

  onDamaged(amount, attacker) {
    this.hitFlashTimer = 0.18;
    AudioSys.play(88, 0.08, 'square', 0.035);
    if (this.system) {
      this.system.spawnSparks(
        this.group.position.clone().add(new THREE.Vector3(0, this.cfg.base.height * 0.8, 0)),
        this.cfg.color
      );
    }
  }

  onDestroyed(attacker) {
    this.active = false;
    if (this.system) this.system.handleTurretDestroyed(this);
  }
}
