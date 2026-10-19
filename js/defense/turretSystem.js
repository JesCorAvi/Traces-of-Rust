import * as THREE from 'three';
import { CORE_DEFENSE_CONFIG } from '../config/coreDefenseConfig.js';
import { Turret } from './turret.js';
import { AllyUnit } from './allyUnit.js';
import { SHARED_GEO, SHARED_MAT } from '../combat.js';
import { AudioSys } from '../audio.js';
import { GameEvents } from '../core/eventBus.js';

// ============================================================================
// SISTEMA DE TORRETAS CON COLOCACIÓN LIBRE, ALIADOS Y VALIDACIÓN DE TERRENO
// ============================================================================

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

    this.buildPlacementGhost();
  }

  // --------------------------------------------------------------------------
  // COLOCACIÓN LIBRE
  // --------------------------------------------------------------------------

  buildPlacementGhost() {
    const group = new THREE.Group();

    this.ghostRingMat = new THREE.MeshBasicMaterial({
      color: 0x9caf6b,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.15, 24), this.ghostRingMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.04;

    this.ghostBodyMat = new THREE.MeshBasicMaterial({
      color: 0x9caf6b,
      transparent: true,
      opacity: 0.16,
      depthWrite: false
    });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 1.6, 8), this.ghostBodyMat);
    body.position.y = 0.8;

    this.ghostBeamMat = new THREE.MeshBasicMaterial({
      color: 0x9caf6b,
      transparent: true,
      opacity: 0.3,
      depthWrite: false
    });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 3.0, 6), this.ghostBeamMat);
    beam.position.y = 1.5;

    group.add(ring, body, beam);
    group.visible = false;
    this.scene.add(group);
    this.placementGhost = group;
  }

  beginPlacement(typeId) {
    const cfg = CORE_DEFENSE_CONFIG.TURRETS[typeId];
    if (!cfg) return false;
    if (this.turrets.size >= this.placementCfg.maxTurrets) return false;
    if (this.mode.getScrap() < cfg.cost) return false;

    this.placingType = cfg;
    this.placementState = {
      active: true,
      typeId: cfg.id,
      typeName: cfg.name,
      cost: cfg.cost,
      position: null,
      valid: false,
      reason: 'APUNTA AL SUELO'
    };
    this.placementGhost.visible = true;
    AudioSys.playUIClick();
    return true;
  }

  cancelPlacement() {
    if (!this.placingType) return;
    this.placingType = null;
    this.placementState = null;
    if (this.placementGhost) this.placementGhost.visible = false;
    AudioSys.playUIClick();
  }

  finishPlacement() {
    this.placingType = null;
    this.placementState = null;
    if (this.placementGhost) this.placementGhost.visible = false;
  }

  isPlacing() {
    return !!this.placingType;
  }

  getPlacementState() {
    return this.placementState;
  }

  confirmPlacement() {
    if (!this.placingType || !this.placementState || !this.placementState.valid || !this.placementState.position) {
      AudioSys.playUIError();
      return false;
    }
    const cfg = this.placingType;
    if (!this.mode.spendScrap(cfg.cost)) {
      this.placementState.valid = false;
      this.placementState.reason = 'CHATARRA INSUFICIENTE';
      AudioSys.playUIError();
      return false;
    }

    this.createTurret(this.placementState.position, cfg);
    this.finishPlacement();
    return true;
  }

  createTurret(position, cfg) {
    const id = `turret_${this.nextTurretId++}`;
    const facingYaw = this.findFacingYaw(position);
    const turret = new Turret(
      this.scene,
      this.worldPhysics,
      position,
      cfg,
      this,
      facingYaw,
      id
    );

    this.turrets.set(turret.id, turret);
    this.extraStructures.push(turret);

    this.spawnPulse(position, 1.6, cfg.color);
    this.spawnSparks(position.clone().add(new THREE.Vector3(0, 0.7, 0)), cfg.color);
    AudioSys.playUISelect();
    AudioSys.play(140, 0.16, 'sawtooth', 0.06);
    GameEvents.emit('turret:built', { turret, typeId: cfg.id });
    return turret;
  }

  updatePlacement(dt, ctx) {
    if (!this.placingType) return;

    const candidate = this.computePlacementCandidate(ctx);
    if (!candidate) {
      this.placementState = {
        active: true,
        typeId: this.placingType.id,
        typeName: this.placingType.name,
        cost: this.placingType.cost,
        position: null,
        valid: false,
        reason: 'SIN SUPERFICIE VÁLIDA'
      };
      this.placementGhost.visible = false;
      return;
    }

    const result = this.validatePlacement(candidate, this.placingType, ctx);
    this.placementState = {
      active: true,
      typeId: this.placingType.id,
      typeName: this.placingType.name,
      cost: this.placingType.cost,
      position: candidate,
      valid: result.valid,
      reason: result.reason
    };

    this.placementGhost.position.copy(candidate);
    this.placementGhost.visible = true;
    const color = result.valid ? 0x9caf6b : 0xa52020;
    this.ghostRingMat.color.setHex(color);
    this.ghostBodyMat.color.setHex(color);
    this.ghostBeamMat.color.setHex(color);
    this.ghostRingMat.opacity = result.valid ? 0.75 : 0.5;
    this.ghostBodyMat.opacity = result.valid ? 0.18 : 0.12;
  }

  computePlacementCandidate(ctx) {
    const camera = ctx.camera;
    const player = ctx.playerGroup.position;
    if (!camera || !player) return null;

    const origin = camera.position;
    const dir = camera.getWorldDirection(new THREE.Vector3());

    let hit = null;
    for (let t = 1.0; t <= 36.0; t += 0.5) {
      const px = origin.x + dir.x * t;
      const py = origin.y + dir.y * t;
      const pz = origin.z + dir.z * t;
      const ground = this.worldPhysics.getGroundHeight(px, pz, py);
      if (py <= ground + 0.25) {
        hit = new THREE.Vector3(px, ground, pz);
        break;
      }
    }

    const fwd = ctx.camFwd
      ? new THREE.Vector3(ctx.camFwd.x, 0, ctx.camFwd.z).normalize()
      : new THREE.Vector3(0, 0, -1);

    if (!hit) {
      const fallbackDist = 5.0;
      const fx = player.x + fwd.x * fallbackDist;
      const fz = player.z + fwd.z * fallbackDist;
      hit = new THREE.Vector3(fx, this.worldPhysics.getGroundHeight(fx, fz, player.y + 0.5), fz);
    }

    // Si el rayo cae detrás del jugador, usar un punto delante
    const toHit = new THREE.Vector3(hit.x - player.x, 0, hit.z - player.z);
    if (toHit.dot(fwd) < 0.5) {
      const fx = player.x + fwd.x * 5.0;
      const fz = player.z + fwd.z * 5.0;
      hit.set(fx, this.worldPhysics.getGroundHeight(fx, fz, player.y + 0.5), fz);
    }

    // Limitar la distancia horizontal al jugador
    let dx = hit.x - player.x;
    let dz = hit.z - player.z;
    let dist = Math.hypot(dx, dz) || 0.0001;
    const minDist = this.placementCfg.minPlayerDistance;
    const maxDist = this.placementCfg.maxPlayerDistance;

    if (dist > maxDist) {
      const k = maxDist / dist;
      dx *= k;
      dz *= k;
      dist = maxDist;
    } else if (dist < minDist) {
      const k = minDist / dist;
      dx *= k;
      dz *= k;
      dist = minDist;
    }

    const x = player.x + dx;
    const z = player.z + dz;
    const y = this.worldPhysics.getGroundHeight(x, z, hit.y + 0.1);
    return new THREE.Vector3(x, y, z);
  }

  validatePlacement(pos, cfg, ctx) {
    const P = this.placementCfg;
    const player = ctx.playerGroup.position;
    const dxP = pos.x - player.x;
    const dzP = pos.z - player.z;
    const distPlayer = Math.hypot(dxP, dzP);

    if (distPlayer < P.minPlayerDistance - 0.05) return { valid: false, reason: 'DEMASIADO CERCA DEL OPERARIO' };
    if (distPlayer > P.maxPlayerDistance + 0.1) return { valid: false, reason: 'FUERA DE ALCANCE' };
    if (this.turrets.size >= P.maxTurrets) return { valid: false, reason: 'LÍMITE DE TORRETAS' };
    if (this.mode.getScrap() < cfg.cost) return { valid: false, reason: 'CHATARRA INSUFICIENTE' };

    if (this.worldPhysics.isRampAt && this.worldPhysics.isRampAt(pos.x, pos.z)) {
      return { valid: false, reason: 'TERRENO INCLINADO' };
    }

    const core = this.mode.coreMachine;
    if (core && !core.destroyed) {
      const minCore = core.collisionRadius + cfg.base.collisionRadius + P.minCorePadding;
      if (this.horizontalDistance(pos, core.position) < minCore) {
        return { valid: false, reason: 'DEMASIADO CERCA DEL NÚCLEO' };
      }
    }

    if (this.distanceToRoutes(pos) < P.minPathDistance) {
      return { valid: false, reason: 'BLOQUEA LA RUTA' };
    }

    for (const sp of CORE_DEFENSE_CONFIG.SPAWN_POINTS) {
      if (this.horizontalDistance(pos, sp.position) < P.spawnClearance) {
        return { valid: false, reason: 'COMPUERTA DE APARICIÓN' };
      }
    }

    for (const turret of this.turrets.values()) {
      const minDist = Math.max(
        P.minTurretDistance,
        cfg.base.collisionRadius + turret.cfg.base.collisionRadius + 0.9
      );
      if (this.horizontalDistance(pos, turret.group.position) < minDist) {
        return { valid: false, reason: 'DEMASIADO CERCA DE OTRA TORRETA' };
      }
    }

    const enemies = ctx.enemyPool.active;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.active || e.state === 'dead') continue;
      if (this.horizontalDistance(pos, e.group.position) < P.enemyClearance) {
        return { valid: false, reason: 'ENEMIGO ENCIMA' };
      }
    }

    // Sonda de colisión: si el punto está dentro de una caja/barril/torreta, se rechaza
    const probe = pos.clone();
    this.worldPhysics.resolveCollision(probe, cfg.base.collisionRadius, pos.y);
    if (Math.hypot(probe.x - pos.x, probe.z - pos.z) > 0.05) {
      return { valid: false, reason: 'OBSTÁCULO' };
    }

    return { valid: true, reason: 'LISTO PARA COLOCAR' };
  }

  horizontalDistance(a, b) {
    return Math.hypot(a.x - b.x, a.z - b.z);
  }

  distanceToRoutes(pos) {
    const pathSystem = this.mode.pathSystem;
    if (!pathSystem) return Infinity;

    let best = Infinity;
    for (const route of pathSystem.routes.values()) {
      const wps = route.waypoints;
      for (let i = 0; i < wps.length - 1; i++) {
        const a = wps[i];
        const b = wps[i + 1];
        const abx = b.x - a.x;
        const abz = b.z - a.z;
        const lenSq = abx * abx + abz * abz || 1;
        const t = Math.max(0, Math.min(1, ((pos.x - a.x) * abx + (pos.z - a.z) * abz) / lenSq));
        const px = a.x + t * abx;
        const pz = a.z + t * abz;
        const d = Math.hypot(pos.x - px, pos.z - pz);
        if (d < best) best = d;
      }
    }
    return best;
  }

  findFacingYaw(position) {
    const pathSystem = this.mode.pathSystem;
    if (!pathSystem) return 0;

    let bestPoint = null;
    let bestDist = Infinity;
    for (const route of pathSystem.routes.values()) {
      const wps = route.waypoints;
      for (let i = 0; i < wps.length - 1; i++) {
        const a = wps[i];
        const b = wps[i + 1];
        const abx = b.x - a.x;
        const abz = b.z - a.z;
        const lenSq = abx * abx + abz * abz || 1;
        const t = Math.max(0, Math.min(1, ((position.x - a.x) * abx + (position.z - a.z) * abz) / lenSq));
        const px = a.x + t * abx;
        const pz = a.z + t * abz;
        const d = Math.hypot(position.x - px, position.z - pz);
        if (d < bestDist) {
          bestDist = d;
          bestPoint = { x: px, z: pz };
        }
      }
    }

    if (!bestPoint) return 0;
    return Math.atan2(-(bestPoint.x - position.x), -(bestPoint.z - position.z));
  }

  // --------------------------------------------------------------------------
  // CONSULTAS Y GESTIÓN
  // --------------------------------------------------------------------------

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
      const d = this.horizontalDistance(playerPos, turret.group.position);
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
    AudioSys.play(300, 0.12, 'triangle', 0.05);
    GameEvents.emit('turret:upgraded', {
      turret,
      pathIndex,
      level: turret.levels[pathIndex]
    });
    return true;
  }

  sellTurret(turretId) {
    const turret = this.getTurretById(turretId);
    if (!turret) return 0;

    const refund = turret.getSellValue();
    this.mode.addScrap(refund);

    this.turrets.delete(turret.id);
    this.removeStructure(turret);
    this.spawnSparks(turret.group.position.clone(), 0xb89c46);
    AudioSys.play(200, 0.12, 'square', 0.045);
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

  // --------------------------------------------------------------------------
  // ACTUALIZACIÓN
  // --------------------------------------------------------------------------

  update(dt, ctx) {
    this.ctx = ctx;
    this.elapsed += dt;

    this.updatePlacement(dt, ctx);
    this.applySupportBuffs(ctx);

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

    this.updateFx(dt);
    this.updateHazards(dt, ctx);
  }

  applySupportBuffs(ctx) {
    const core = this.mode ? this.mode.coreMachine : null;

    for (const turret of this.turrets.values()) {
      turret.supportFireRateBonus = 0;
      turret.supportDamageBonus = 0;
      turret.damageReduction = 0;
    }
    if (core && !core.destroyed) core.damageReduction = 0;

    for (const support of this.turrets.values()) {
      if (support.cfg.id !== 'support' || support.destroyed) continue;
      const s = support.stats;
      const radius = s.healRadius || 12;
      const burstBonus = support.burstActive > 0 ? (s.overclockBurst || 0) : 0;
      const fireBuff = (s.buffFireRate || 0) + burstBonus;
      const dmgBuff = s.buffDamage || 0;
      const armor = s.auraArmor || 0;

      for (const turret of this.turrets.values()) {
        if (turret === support || turret.destroyed) continue;
        if (!this.inRadius(support.group.position, turret.group.position, radius)) continue;
        turret.supportFireRateBonus = Math.min(1.5, turret.supportFireRateBonus + fireBuff);
        turret.supportDamageBonus = Math.min(1.0, turret.supportDamageBonus + dmgBuff);
        turret.damageReduction = Math.min(0.6, turret.damageReduction + armor);
      }

      if (core && !core.destroyed && this.inRadius(support.group.position, core.position, radius)) {
        core.damageReduction = Math.min(0.6, core.damageReduction + armor);
      }
    }
  }

  updateFx(dt) {
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const item = this.fx[i];
      item.life -= dt;

      if (item.type === 'shell') {
        item.t += dt / item.duration;
        const t = Math.min(1, item.t);
        item.mesh.position.lerpVectors(item.start, item.end, t);
        item.mesh.position.y += Math.sin(t * Math.PI) * item.arcHeight;
        if (item.t >= 1) {
          if (item.onImpact) item.onImpact();
          this.removeFx(i, item);
        }
        continue;
      }

      if (item.type === 'spark') {
        item.mesh.position.addScaledVector(item.vel, dt);
        item.vel.y -= (item.gravity || 12) * dt;
        const k = Math.max(0, item.life / item.maxLife);
        item.mesh.scale.setScalar(item.baseScale * (0.4 + k * 0.6));
        continue;
      }

      if (item.type === 'ring') {
        const k = Math.max(0, item.life / item.maxLife);
        const progress = 1 - k;
        item.mesh.scale.setScalar(0.25 + progress * 0.75);
        if (item.mat) item.mat.opacity = item.baseOpacity * k;
      }

      if (item.type === 'tracer') {
        const k = Math.max(0, item.life / item.maxLife);
        if (item.mat) item.mat.opacity = item.baseOpacity * k;
      }

      if (item.life <= 0) {
        this.removeFx(i, item);
      }
    }
  }

  updateHazards(dt, ctx) {
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i];
      h.life -= dt;
      h.tick -= dt;

      if (h.tick <= 0) {
        h.tick = 0.5;
        const enemies = ctx.enemyPool.active;
        for (let e = 0; e < enemies.length; e++) {
          const enemy = enemies[e];
          if (!enemy.active || enemy.state === 'dead') continue;
          if (this.inRadius(h.pos, enemy.group.position, h.radius)) {
            enemy.applyBurn(h.dps, 0.75);
          }
        }
      }

      if (h.mat) h.mat.opacity = Math.max(0, 0.3 * (h.life / h.duration));

      if (h.life <= 0) {
        this.scene.remove(h.mesh);
        h.mesh.geometry.dispose();
        h.mat.dispose();
        this.hazards.splice(i, 1);
      }
    }
  }

  // --------------------------------------------------------------------------
  // COMBATE Y EFECTOS
  // --------------------------------------------------------------------------

  damageEnemy(enemy, amount, source) {
    if (!enemy || !enemy.active || enemy.state === 'dead' || amount <= 0) return;
    let mult = 1;
    if (source && source.stats) {
      if (enemy.stunTimer > 0) mult *= source.stats.frozenDamageMult || 1;
      if (enemy.slowTimer > 0 || enemy.stunTimer > 0) mult *= source.stats.brittleMult || 1;
    }
    if (this.ctx) this.ctx.damageEnemy(enemy, amount * mult, null, true);
  }

  damageArea(center, radius, amount, source) {
    if (!this.ctx || radius <= 0 || amount <= 0) return;
    const enemies = this.ctx.enemyPool.active;
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      if (!enemy.active || enemy.state === 'dead') continue;
      if (this.inRadius(center, enemy.group.position, radius)) {
        this.damageEnemy(enemy, amount, source);
      }
    }
  }

  inRadius(a, b, radius) {
    const dx = a.x - b.x;
    const dz = a.z - b.z;
    if (Math.hypot(dx, dz) > radius) return false;
    return Math.abs(a.y - b.y) <= 3.8;
  }

  healAround(support, amount, radius) {
    if (amount <= 0 || radius <= 0) return;
    const center = support.group.position;

    if (this.mode && this.mode.coreMachine && !this.mode.coreMachine.destroyed) {
      if (this.inRadius(center, this.mode.coreMachine.position, radius)) {
        this.mode.coreMachine.heal(amount);
      }
    }
    for (const turret of this.turrets.values()) {
      if (turret.destroyed || turret === support) continue;
      if (this.inRadius(center, turret.group.position, radius)) turret.heal(amount);
    }
    for (const ally of this.allies) {
      if (ally.destroyed) continue;
      if (this.inRadius(center, ally.position, radius)) ally.heal(amount);
    }
  }

  shieldAround(support, amount, radius) {
    if (amount <= 0 || radius <= 0) return;
    const center = support.group.position;

    if (this.mode && this.mode.coreMachine && !this.mode.coreMachine.destroyed) {
      if (this.inRadius(center, this.mode.coreMachine.position, radius)) {
        this.mode.coreMachine.applyShield(amount);
      }
    }
    for (const turret of this.turrets.values()) {
      if (turret.destroyed) continue;
      if (this.inRadius(center, turret.group.position, radius)) turret.applyShield(amount);
    }
    for (const ally of this.allies) {
      if (ally.destroyed) continue;
      if (this.inRadius(center, ally.position, radius)) ally.applyShield(amount);
    }
  }

  spawnTracer(from, to, color, life = 0.06) {
    const geo = new THREE.BufferGeometry().setFromPoints([from.clone(), to.clone()]);
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    this.fx.push({ type: 'tracer', mesh: line, mat, life, maxLife: life, baseOpacity: 0.85 });
  }

  spawnExplosion(pos, radius, color) {
    const ringGeo = new THREE.RingGeometry(radius * 0.25, radius, 20);
    const mat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false
    });
    const ring = new THREE.Mesh(ringGeo, mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(pos);
    ring.position.y = (pos.y || 0) + 0.06;
    this.scene.add(ring);
    this.fx.push({ type: 'ring', mesh: ring, mat, life: 0.32, maxLife: 0.32, baseOpacity: 0.5 });
    this.spawnSparks(pos.clone().add(new THREE.Vector3(0, 0.4, 0)), color);
  }

  spawnPulse(pos, radius, color) {
    const ringGeo = new THREE.RingGeometry(radius * 0.2, radius, 24);
    const mat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.42, side: THREE.DoubleSide, depthWrite: false
    });
    const ring = new THREE.Mesh(ringGeo, mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(pos);
    ring.position.y = (pos.y || 0) + 0.07;
    this.scene.add(ring);
    this.fx.push({ type: 'ring', mesh: ring, mat, life: 0.55, maxLife: 0.55, baseOpacity: 0.42 });
  }

  spawnSparks(pos, color) {
    const mats = [SHARED_MAT.sparkGold, SHARED_MAT.sparkBlood];
    for (let i = 0; i < 4; i++) {
      const mesh = new THREE.Mesh(SHARED_GEO.spark, mats[i % mats.length]);
      mesh.position.copy(pos);
      const scale = 0.7 + Math.random() * 0.7;
      mesh.scale.setScalar(scale);
      this.scene.add(mesh);
      this.fx.push({
        type: 'spark',
        mesh,
        life: 0.3 + Math.random() * 0.25,
        maxLife: 0.55,
        baseScale: scale,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 6,
          2 + Math.random() * 4,
          (Math.random() - 0.5) * 6
        ),
        gravity: 14,
        shared: true
      });
    }
  }

  spawnShell(from, to, duration, arcHeight, onImpact) {
    const mesh = new THREE.Mesh(SHARED_GEO.spark, SHARED_MAT.sparkGold);
    mesh.scale.setScalar(1.1);
    mesh.position.copy(from);
    this.scene.add(mesh);
    this.fx.push({
      type: 'shell',
      mesh,
      start: from.clone(),
      end: to.clone(),
      t: 0,
      duration: Math.max(0.15, duration),
      arcHeight,
      onImpact,
      shared: true,
      life: 10,
      maxLife: 10
    });
  }

  spawnNapalm(pos, radius, dps, duration) {
    if (radius <= 0 || dps <= 0 || duration <= 0) return;
    const geo = new THREE.CircleGeometry(radius, 20);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xa54a2a, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.copy(pos);
    mesh.position.y = (pos.y || 0) + 0.045;
    this.scene.add(mesh);

    this.hazards.push({
      pos: pos.clone(),
      radius,
      dps,
      duration,
      life: duration,
      tick: 0,
      mesh,
      mat
    });
  }

  removeFx(index, item) {
    this.scene.remove(item.mesh);
    if (!item.shared) {
      if (item.mesh.geometry) item.mesh.geometry.dispose();
      if (item.mat) item.mat.dispose();
      else if (item.mesh.material) item.mesh.material.dispose();
    }
    this.fx.splice(index, 1);
  }

  // --------------------------------------------------------------------------
  // ALIADOS Y DESTRUCCIÓN
  // --------------------------------------------------------------------------

  spawnAlly(turret) {
    const stats = turret.stats;
    const type = stats.allyRanged ? 'drone' : (stats.allyArmor > 0 ? 'elite' : 'guard');
    const angle = Math.random() * Math.PI * 2;
    const dist = 1.0 + Math.random() * 1.1;
    const px = turret.group.position.x + Math.cos(angle) * dist;
    const pz = turret.group.position.z + Math.sin(angle) * dist;
    const py = this.worldPhysics
      ? this.worldPhysics.getGroundHeight(px, pz, turret.group.position.y)
      : turret.group.position.y;

    const ally = new AllyUnit(
      this.scene,
      type,
      new THREE.Vector3(px, py, pz),
      turret,
      stats
    );
    this.allies.push(ally);
    this.extraStructures.push(ally);
    return ally;
  }

  countAlliesFor(turret) {
    let count = 0;
    for (const ally of this.allies) {
      if (ally.owner === turret && !ally.destroyed) count++;
    }
    return count;
  }

  handleAllyDestroyed(ally) {
    this.spawnExplosion(ally.position.clone(), 0.9, 0x6e1414);
    AudioSys.play(120, 0.1, 'square', 0.035);
    this.removeStructure(ally);
    const idx = this.allies.indexOf(ally);
    if (idx !== -1) this.allies.splice(idx, 1);
    ally.destroy();
  }

  handleTurretDestroyed(turret) {
    this.spawnExplosion(turret.group.position.clone(), 2.4, turret.cfg.color);
    this.spawnSparks(
      turret.group.position.clone().add(new THREE.Vector3(0, 1.0, 0)),
      0xa54a2a
    );
    AudioSys.play(58, 0.3, 'sawtooth', 0.08);

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
    this.cancelPlacement();

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
      this.placementGhost.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
      this.placementGhost = null;
    }

    this.extraStructures.length = 0;
  }
}
