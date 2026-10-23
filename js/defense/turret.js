// Torreta: entidad defensiva, modelo 3D con calcomanías, mejoras y lógica de combate.
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
import { buildMuzzleFlash, buildHealthBar, updateHealthBar } from './turrets/view.js';
import {
  getEffectiveDamage,
  getEffectiveFireRate,
  getEnemiesInRange,
  findTarget,
  getMuzzleWorldPos,
  faceTarget
} from './turrets/targeting.js';
import { updateCombat } from './turrets/combat/update.js';
import { updateCollector } from './turrets/collector.js';
import { updateBarracks, updateSupport } from './turrets/combat/support.js';

const SHARED_RANGE_FILL_GEO = new THREE.CircleGeometry(1, 48);
SHARED_RANGE_FILL_GEO.userData.sharedGeo = true;
const SHARED_RANGE_RING_GEO = new THREE.RingGeometry(0.97, 1.0, 48);
SHARED_RANGE_RING_GEO.userData.sharedGeo = true;

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
    this.supportRangeBonus = 0;
    this.supportScrapBonus = 0;

    // Base fija anclada al suelo (no gira al apuntar)
    this.baseRoot = new THREE.Group();
    this.group.add(this.baseRoot);

    // Cabezal giratorio (gira suavemente para seguir y apuntar a los enemigos)
    this.modelRoot = new THREE.Group();
    this.modelRoot.rotation.y = facingYaw;
    this.group.add(this.modelRoot);
    this.visualParts = {};

    buildMaterials(this);
    recomputeStats(this);
    buildModel(this);
    buildMuzzleFlash(this);
    buildHealthBar(this);
    applyUpgradeVisuals(this);
    this.buildRangeIndicator();
  }

  buildRangeIndicator() {
    this.rangeIndicatorGroup = new THREE.Group();
    const fillMat = new THREE.MeshBasicMaterial({
      color: this.cfg.color,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const ringMat = new THREE.MeshBasicMaterial({
      color: this.cfg.color,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const fillMesh = new THREE.Mesh(SHARED_RANGE_FILL_GEO, fillMat);
    fillMesh.rotation.x = -Math.PI / 2;
    fillMesh.position.y = 0.02;

    const ringMesh = new THREE.Mesh(SHARED_RANGE_RING_GEO, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.025;

    this.rangeIndicatorGroup.add(fillMesh, ringMesh);
    this.updateRangeIndicator();
    this.rangeIndicatorGroup.visible = !!this.system?.areRangesVisible;
    this.baseRoot.add(this.rangeIndicatorGroup);
  }

  getEffectiveRange() {
    const baseR = this.stats?.range || this.base.range || 10;
    return baseR * (1 + (this.supportRangeBonus || 0));
  }

  updateRangeIndicator() {
    if (!this.rangeIndicatorGroup) return;
    const r = this.getEffectiveRange();
    this.rangeIndicatorGroup.scale.set(r, 1, r);
  }

  addBasePart(geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.baseRoot.add(mesh);
    return mesh;
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

  recomputeStats() {
    recomputeStats(this);
    this.updateRangeIndicator();
  }
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

    // Destello de disparo dinámico en boca de cañón
    if (this.muzzleFlashMesh) {
      if (this.firingFlash > 0) {
        this.muzzleFlashMesh.visible = true;
        this.muzzleFlashMesh.rotation.z = Math.random() * Math.PI * 2;
        const s = 0.85 + Math.random() * 0.35;
        this.muzzleFlashMesh.scale.set(s, s, 1);
      } else {
        this.muzzleFlashMesh.visible = false;
      }
    }

    // Rotación continua de antena / radar en support.
    if (this.radarDishMesh) {
      this.radarDishMesh.rotation.y += dt * 2.2;
    }

    // Aspas, ventiladores y rotores de las torretas artesanales.
    if (this.spinnerMesh) {
      this.spinnerMesh.rotation.z += dt * (this.spinnerSpeed || 2.2);
    }

    // Retroceso mecánico suave del cañón
    if (this.barrelRecoilMesh) {
      const targetZ = this.firingFlash > 0 ? (this.barrelBaseZ || 0) + 0.12 : (this.barrelBaseZ || 0);
      this.barrelRecoilMesh.position.z += (targetZ - this.barrelRecoilMesh.position.z) * Math.min(1.0, dt * 25);
    }

    this.updateHealthBar(ctx.camera.position);

    if (this.cfg.id === 'barracks') {
      this.updateBarracks(dt, ctx);
    } else if (this.cfg.id === 'support') {
      this.updateSupport(dt, ctx);
    } else if (this.cfg.id === 'collector') {
      updateCollector(this, dt);
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
