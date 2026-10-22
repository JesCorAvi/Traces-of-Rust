// Sistema de torretas: colocación libre, aliados, VFX, soporte y ciclo de vida.
// Exports: TurretSystem.

import * as THREE from 'three';
import { CORE_DEFENSE_CONFIG } from '../config/coreDefenseConfig.js';
import { AudioSys } from '../audio.js';
import { GameEvents } from '../core/eventBus.js';
import { disposeObject3D } from '../utils/dispose.js';
import { buildPlacementGhost } from './turretSystem/placement/ghost.js';
import {
  beginPlacement,
  cancelPlacement,
  confirmPlacement,
  isPlacing,
  getPlacementState,
  createTurret,
  updatePlacement
} from './turretSystem/placement/index.js';
import { horizontalDistance } from './turretSystem/placement/validation.js';
import { applySupportBuffs, healAround, shieldAround } from './turretSystem/support.js';
import {
  updateFx,
  updateHazards,
  spawnTracer,
  spawnExplosion,
  spawnPulse,
  spawnSparks,
  spawnShell,
  spawnNapalm
} from './turretSystem/fx.js';
import { damageEnemy, damageArea, inRadius } from './turretSystem/combat.js';
import { spawnAlly, countAlliesFor, handleAllyDestroyed } from './turretSystem/allies.js';

const INTERACT_RADIUS = 3.5;

export class TurretSystem {
  constructor(scene, worldPhysics, extraStructures, mode) {
    this.scene = scene;
    this.worldPhysics = worldPhysics;
    this.extraStructures = extraStructures;
    this.mode = mode;
    this.cfg = CORE_DEFENSE_CONFIG;
    this.placementCfg = CORE_DEFENSE_CONFIG.PLACEMENT;

    this.turrets = new Map();
    this.allies = [];
    this.fx = [];
    this.hazards = [];
    this.nextTurretId = 1;
    this.elapsed = 0;
    this.ctx = null;

    this.placingType = null;
    this.placementState = null;
    this.placementGhost = null;
    this.areRangesVisible = false;

    buildPlacementGhost(this);
  }

  toggleTurretRanges(forceState = null) {
    if (typeof forceState === 'boolean') {
      this.areRangesVisible = forceState;
    } else {
      this.areRangesVisible = !this.areRangesVisible;
    }
    for (const turret of this.turrets.values()) {
      if (turret.rangeIndicatorGroup) {
        turret.rangeIndicatorGroup.visible = this.areRangesVisible;
      }
    }
    return this.areRangesVisible;
  }

  beginPlacement(typeId) { return beginPlacement(this, typeId); }
  cancelPlacement() { cancelPlacement(this); }
  confirmPlacement() { return confirmPlacement(this); }
  isPlacing() { return isPlacing(this); }
  getPlacementState() { return getPlacementState(this); }
  createTurret(position, cfg) { return createTurret(this, position, cfg); }

  spawnTracer(from, to, color, life = 0.06) { return spawnTracer(this, from, to, color, life); }
  spawnExplosion(pos, radius, color) { return spawnExplosion(this, pos, radius, color); }
  spawnPulse(pos, radius, color) { return spawnPulse(this, pos, radius, color); }
  spawnSparks(pos, color) { return spawnSparks(this, pos, color); }
  spawnShell(from, to, duration, arcHeight, onImpact) { return spawnShell(this, from, to, duration, arcHeight, onImpact); }
  spawnNapalm(pos, radius, dps, duration) { spawnNapalm(this, pos, radius, dps, duration); }

  // En co-op solo el Host aplica daño real de torretas/tropas. El Cliente
  // mantiene apuntado, trazadoras, fogonazos y animaciones.
  isDamageAuthority() {
    return !(this.ctx?.net?.isMatchActive && !this.ctx.net.isHost());
  }
  damageEnemy(enemy, amount, source) { damageEnemy(this, enemy, amount, source); }
  damageArea(center, radius, amount, source) { damageArea(this, center, radius, amount, source); }
  inRadius(a, b, radius) { return inRadius(a, b, radius); }

  healAround(support, amount, radius) { healAround(this, support, amount, radius); }
  shieldAround(support, amount, radius) { shieldAround(this, support, amount, radius); }

  spawnAlly(turret) { return spawnAlly(this, turret); }
  countAlliesFor(turret) { return countAlliesFor(this, turret); }
  handleAllyDestroyed(ally) { handleAllyDestroyed(this, ally); }

  getTurretById(turretId) {
    return this.turrets.get(turretId) || null;
  }

  getTurrets() {
    return Array.from(this.turrets.values());
  }

  findNearbyTurret(playerPos) {
    let best = null;
    let bestDist = INTERACT_RADIUS;
    for (const turret of this.turrets.values()) {
      if (turret.destroyed) continue;
      const d = horizontalDistance(playerPos, turret.group.position);
      if (d <= bestDist) {
        best = turret;
        bestDist = d;
      }
    }
    return best;
  }

  upgradeTurret(turretId, pathIndex) {
    const turret = this.getTurretById(turretId);
    if (!turret) return false;

    const state = turret.getUpgradeState(pathIndex);
    if (!state || !state.next || !state.canBuy) return false;
    if (!this.mode.spendScrap(state.next.cost)) return false;
    if (!turret.upgrade(pathIndex)) return false;

    this.spawnPulse(turret.group.position, 1.8, turret.cfg.color);
    this.spawnSparks(
      turret.group.position.clone().add(new THREE.Vector3(0, turret.cfg.base.height * 0.7, 0)),
      turret.cfg.color
    );
    AudioSys.playUpgradeTurret();
    GameEvents.emit('turret:upgraded', {
      turret,
      pathIndex,
      level: turret.levels[pathIndex]
    });
    return true;
  }

  sellTurret(turretId, options = {}) {
    const turret = this.getTurretById(turretId);
    if (!turret) return 0;

    const refund = turret.getSellValue();
    // Una venta remota elimina la torreta en el receptor pero NUNCA le abona
    // chatarra: el reembolso pertenece a quien ejecuta la venta.
    if (!options.remote) this.mode.addScrap(refund, { local: true });

    this.turrets.delete(turret.id);
    this.removeStructure(turret);
    this.spawnSparks(turret.group.position.clone(), 0xb89c46);
    AudioSys.playSellTurret();
    GameEvents.emit('turret:sold', { turret, refund });
    turret.destroy();
    return refund;
  }

  getTurretCount() {
    return this.turrets.size;
  }

  getMaxTurretCount() {
    return this.placementCfg.maxTurrets;
  }

  update(dt, ctx) {
    this.ctx = ctx;
    this.elapsed += dt;

    updatePlacement(this, dt, ctx);
    applySupportBuffs(this, ctx);

    this.turrets.forEach(turret => {
      if (!turret.destroyed) turret.update(dt, ctx);
    });

    for (let i = this.allies.length - 1; i >= 0; i--) {
      const ally = this.allies[i];
      if (ally.destroyed) {
        this.allies.splice(i, 1);
        continue;
      }
      ally.update(dt, ctx.enemyPool.active, ctx.worldPhysics, ctx.camera.position, this);
    }

    updateFx(this, dt);
    updateHazards(this, dt, ctx);
  }

  handleTurretDestroyed(turret) {
    this.spawnExplosion(turret.group.position.clone(), 2.4, turret.cfg.color);
    this.spawnSparks(
      turret.group.position.clone().add(new THREE.Vector3(0, 1.0, 0)),
      0xa54a2a
    );
    AudioSys.playTurretDestroyed();

    this.turrets.delete(turret.id);
    this.removeStructure(turret);
    GameEvents.emit('turret:destroyed', { turret, typeId: turret.cfg.id });
    turret.destroy();
  }

  removeStructure(structure) {
    const idx = this.extraStructures.indexOf(structure);
    if (idx !== -1) this.extraStructures.splice(idx, 1);
  }

  destroy() {
    cancelPlacement(this);

    for (const turret of Array.from(this.turrets.values())) {
      turret.destroy();
    }
    this.turrets.clear();

    for (const ally of this.allies) {
      ally.destroy();
    }
    this.allies.length = 0;

    for (const item of this.fx) {
      this.scene.remove(item.mesh);
      if (!item.shared) {
        if (item.mesh.geometry) item.mesh.geometry.dispose();
        if (item.mat) item.mat.dispose();
        else if (item.mesh.material) item.mesh.material.dispose();
      }
    }
    this.fx.length = 0;

    for (const h of this.hazards) {
      this.scene.remove(h.mesh);
      h.mesh.geometry.dispose();
      h.mat.dispose();
    }
    this.hazards.length = 0;

    if (this.placementGhost) {
      this.scene.remove(this.placementGhost);
      disposeObject3D(this.placementGhost);
      this.placementGhost = null;
    }

    this.extraStructures.length = 0;
  }
}
