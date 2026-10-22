// Máquina de estados de jefes: anticipación, ataque, recuperación, fases y reposo.
// Exports: BOSS_STATE, BossController.

import * as THREE from 'three';
import { AudioSys } from '../audio.js';
import { BOSS_AI } from '../config/bossAI.js';
import { spawnBossAttackTelegraph, spawnBossAttackDust } from '../combat/bossAttacks.js';

export const BOSS_STATE = Object.freeze({
  INTRO: 'intro',
  CHASE: 'chase',
  TELEGRAPH: 'telegraph',
  ACTIVE: 'active',
  RECOVERY: 'recovery',
  PHASE_TRANSITION: 'phase_transition',
  PLAYER_DEAD: 'player_dead',
  DEAD: 'dead'
});

const TELEGRAPH_FREQS = {
  cone_saw: 165,
  charge: 95,
  shockwave: 120,
  floor_bombs: 90,
  radial_slag: 175,
  spiral_blades: 190,
  summon: 70
};

export class BossController {
  constructor(enemy, bossCfg = null) {
    this.enemy = enemy;
    this.config = bossCfg || enemy?.bossData || {};
    this.override = BOSS_AI.OVERRIDES[this.config.id] || {};

    this.state = BOSS_STATE.INTRO;
    this.stateTimer = BOSS_AI.DEFAULTS.introDuration;
    this.stateAge = 0;
    this.phaseTransitionQueued = false;
    this.hitFlashTimer = 0;

    this.currentAttackId = null;
    this.lastAttackId = null;
    this.attackCooldowns = new Map();
    this.globalCooldown = BOSS_AI.DEFAULTS.initialAttackDelay;

    this.lockedTargetPos = new THREE.Vector3();
    this.lockedYaw = 0;
    this.telegraph = null;
    this.lastCallbacks = null;
  }

  get movementScale() {
    switch (this.state) {
      case BOSS_STATE.INTRO: return BOSS_AI.DEFAULTS.introMoveScale;
      case BOSS_STATE.CHASE: return 1;
      case BOSS_STATE.RECOVERY: return BOSS_AI.DEFAULTS.recoveryMoveScale;
      case BOSS_STATE.TELEGRAPH:
      case BOSS_STATE.ACTIVE:
      case BOSS_STATE.PHASE_TRANSITION:
      case BOSS_STATE.PLAYER_DEAD:
      case BOSS_STATE.DEAD: return 0;
      default: return 1;
    }
  }

  get allowsContactDamage() {
    return this.state === BOSS_STATE.CHASE;
  }

  get visualState() {
    switch (this.state) {
      case BOSS_STATE.TELEGRAPH:
      case BOSS_STATE.ACTIVE:
      case BOSS_STATE.PHASE_TRANSITION: return 2;
      case BOSS_STATE.DEAD: return 3;
      case BOSS_STATE.RECOVERY:
      case BOSS_STATE.PLAYER_DEAD: return 0;
      default: return 1;
    }
  }

  get isInvulnerable() {
    // La cola de transición protege en el mismo frame en que el HP cruza el 50%,
    // antes de que el estado PHASE_TRANSITION arranque en el siguiente update.
    return this.state === BOSS_STATE.PHASE_TRANSITION || this.phaseTransitionQueued;
  }

  get isPhaseTransition() {
    return this.state === BOSS_STATE.PHASE_TRANSITION;
  }

  get canStartCharge() {
    return this.state !== BOSS_STATE.DEAD
      && this.state !== BOSS_STATE.PLAYER_DEAD
      && this.state !== BOSS_STATE.PHASE_TRANSITION;
  }

  get lockedFacingYaw() {
    return (this.state === BOSS_STATE.TELEGRAPH || this.state === BOSS_STATE.ACTIVE)
      ? this.lockedYaw
      : null;
  }

  get shouldFacePlayer() {
    return this.state === BOSS_STATE.PHASE_TRANSITION;
  }

  update(dt, ctx) {
    if (ctx.callbacks) this.lastCallbacks = ctx.callbacks;
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);
    }
    if (this.state === BOSS_STATE.DEAD) return;

    this.stateAge += dt;
    if (this.state !== BOSS_STATE.CHASE && this.stateTimer > 0) {
      this.stateTimer = Math.max(0, this.stateTimer - dt);
    }

    this.globalCooldown = Math.max(0, this.globalCooldown - dt);
    for (const [id, cooldown] of this.attackCooldowns) {
      if (cooldown > 0) {
        this.attackCooldowns.set(id, Math.max(0, cooldown - dt));
      }
    }

    // El Cliente no decide ataques ni transiciones: solo refleja la fase y anima.
    if (ctx.isNetworkReplica) {
      this._updateReplica(dt, ctx);
      return;
    }

    if (!ctx.playerAlive) {
      if (this.state !== BOSS_STATE.PLAYER_DEAD) this._enterPlayerDead();
      return;
    }

    if (this.state === BOSS_STATE.PLAYER_DEAD) {
      this._enterState(BOSS_STATE.CHASE);
      this.globalCooldown = Math.max(this.globalCooldown, BOSS_AI.DEFAULTS.resumeAttackDelay);
    }

    if (this.phaseTransitionQueued && this.state !== BOSS_STATE.PHASE_TRANSITION) {
      this._beginPhaseTransition(ctx);
      return;
    }

    switch (this.state) {
      case BOSS_STATE.INTRO:
        if (this.stateTimer <= 0) this._enterState(BOSS_STATE.CHASE);
        break;
      case BOSS_STATE.CHASE:
        this._updateChase(dt, ctx);
        break;
      case BOSS_STATE.TELEGRAPH:
        this._updateTelegraph(dt, ctx);
        break;
      case BOSS_STATE.ACTIVE:
        this._updateActive(ctx);
        break;
      case BOSS_STATE.RECOVERY:
        if (this.stateTimer <= 0) {
          this.currentAttackId = null;
          this._enterState(BOSS_STATE.CHASE);
          this.globalCooldown = Math.max(this.globalCooldown, this._attackGap());
        }
        break;
      case BOSS_STATE.PHASE_TRANSITION:
        if (this.stateTimer <= 0) {
          this._enterState(BOSS_STATE.CHASE);
          this.globalCooldown = Math.max(this.globalCooldown, this._attackGap());
        }
        break;
      default:
        break;
    }
  }

  onDamaged() {
    this.flashHit();
    if (this.state === BOSS_STATE.DEAD || this.enemy.phase >= 2) return;
    if (this.enemy.hp > 0 && this.enemy.hp <= this.enemy.maxHp * BOSS_AI.DEFAULTS.phase2Threshold) {
      this.phaseTransitionQueued = true;
    }
  }

  flashHit(duration = 0.12) {
    this.hitFlashTimer = Math.max(this.hitFlashTimer, duration);
  }

  onPlayerDead() {
    if (this.state === BOSS_STATE.DEAD || this.state === BOSS_STATE.PLAYER_DEAD) return;
    this._enterPlayerDead();
  }

  onPlayerAlive() {
    if (this.state !== BOSS_STATE.PLAYER_DEAD) return;
    this._enterState(BOSS_STATE.CHASE);
    this.globalCooldown = Math.max(this.globalCooldown, BOSS_AI.DEFAULTS.resumeAttackDelay);
  }

  markDead() {
    this._cleanupOwnedAttacks();
    this._cancelTelegraph();
    this.currentAttackId = null;
    this.phaseTransitionQueued = false;
    this.hitFlashTimer = 0;
    this._clearCharge();
    this.state = BOSS_STATE.DEAD;
    this.stateTimer = 0;
  }

  destroy() {
    this._cleanupOwnedAttacks();
    this._cancelTelegraph();
    this._clearCharge();
    this.currentAttackId = null;
    this.phaseTransitionQueued = false;
    this.state = BOSS_STATE.DEAD;
    this.stateTimer = 0;
  }

  // --------------------------------------------------------------------------
  // ESTADOS
  // --------------------------------------------------------------------------

  _updateReplica(dt, ctx) {
    if (this.state === BOSS_STATE.PLAYER_DEAD) return;

    if (this.state === BOSS_STATE.INTRO) {
      if (this.stateTimer <= 0) this._enterState(BOSS_STATE.CHASE);
      return;
    }

    if (this.state !== BOSS_STATE.CHASE) this._enterState(BOSS_STATE.CHASE);

    if (
      this.enemy.phase === 1 && this.enemy.hp > 0 &&
      this.enemy.hp <= this.enemy.maxHp * BOSS_AI.DEFAULTS.phase2Threshold
    ) {
      this.enemy.phase = 2;
      this.enemy.speed *= BOSS_AI.DEFAULTS.phase2SpeedMult;
      ctx.callbacks?.onBossPhaseChange?.(this.enemy);
    }
  }

  _updateChase(dt, ctx) {
    if (this.globalCooldown > 0 || this.enemy.stunTimer > 0) return;
    if (typeof ctx.callbacks?.onBossSpecial !== 'function') return;

    const attackId = this._pickAttack(ctx.horizDistPlayer);
    if (attackId) this._beginAttack(attackId, ctx);
  }

  _updateTelegraph(dt, ctx) {
    this.telegraph?.update(dt);
    if (this.stateTimer > 0) return;
    this._executeAttack(ctx);
  }

  _updateActive(ctx) {
    if (this.stateTimer > 0) return;
    // El ataque acaba de terminar: levantamos polvo y cerramos con un golpe de cámara.
    this._spawnAttackDust(ctx, { count: 18, power: 4.2, color: 0x6f5e44 });
    ctx.callbacks?.onCamShake?.(0.1);
    const profile = BOSS_AI.ATTACKS[this.currentAttackId];
    this._enterState(BOSS_STATE.RECOVERY, profile ? profile.recovery : 0.8);
  }

  _beginAttack(attackId, ctx) {
    const profile = BOSS_AI.ATTACKS[attackId];
    if (!profile) return;

    this.currentAttackId = attackId;
    this.lastAttackId = attackId;
    this.attackCooldowns.set(
      attackId,
      profile.cooldown * (this.enemy.phase >= 2 ? BOSS_AI.DEFAULTS.phase2CooldownMult : 1)
    );

    this.lockedTargetPos.copy(ctx.playerPos);
    const dx = ctx.playerPos.x - this.enemy.group.position.x;
    const dz = ctx.playerPos.z - this.enemy.group.position.z;
    this.lockedYaw = Math.atan2(-dx, -dz);

    this.enemy.attackCharge = 0;
    this.telegraph = spawnBossAttackTelegraph(
      this.enemy.scene,
      this.enemy,
      attackId,
      this.lockedTargetPos,
      ctx.worldPhysics
    );

    AudioSys.play(TELEGRAPH_FREQS[attackId] || 120, 0.2, 'sawtooth', 0.05);
    ctx.callbacks?.onCamShake?.(BOSS_AI.DEFAULTS.attackShake * 0.35);

    const windup = profile.windup * (this.enemy.phase >= 2 ? BOSS_AI.DEFAULTS.phase2WindupMult : 1);
    this._enterState(BOSS_STATE.TELEGRAPH, windup);
  }

  _executeAttack(ctx) {
    this._cancelTelegraph();
    const attackId = this.currentAttackId;
    const profile = BOSS_AI.ATTACKS[attackId];
    if (!profile) {
      this._enterState(BOSS_STATE.CHASE);
      return;
    }

    const result = ctx.callbacks?.onBossSpecial?.(
      this.enemy,
      attackId,
      this.lockedTargetPos.clone()
    );
    this._spawnAttackDust(ctx, { count: 10, power: 2.6, color: 0x8a7a58 });
    AudioSys.play(70, 0.18, 'square', 0.07);
    ctx.callbacks?.onCamShake?.(BOSS_AI.DEFAULTS.attackShake);

    // El resultado permite que la fase ACTIVE cubra el hazard real (sobre todo charge).
    const activeDuration = Math.max(profile.active, Number(result?.durationSec) || 0);
    this._enterState(BOSS_STATE.ACTIVE, activeDuration);
  }

  _beginPhaseTransition(ctx) {
    if (this.enemy.phase !== 1) {
      this.phaseTransitionQueued = false;
      return;
    }

    this.phaseTransitionQueued = false;
    this._cancelTelegraph();
    this._clearCharge();
    this.currentAttackId = null;
    this.attackCooldowns.clear();

    this.enemy.phase = 2;
    this.enemy.speed *= BOSS_AI.DEFAULTS.phase2SpeedMult;

    AudioSys.playBossHorn();
    ctx.callbacks?.onBossPhaseChange?.(this.enemy);
    ctx.callbacks?.onCamShake?.(BOSS_AI.DEFAULTS.phaseShake);

    this._enterState(BOSS_STATE.PHASE_TRANSITION, BOSS_AI.DEFAULTS.phaseTransitionDuration);
  }

  _enterPlayerDead() {
    this._cancelTelegraph();
    this._clearCharge();
    this.enemy.attackCharge = 0;
    this.currentAttackId = null;
    this._enterState(BOSS_STATE.PLAYER_DEAD);
  }

  // --------------------------------------------------------------------------
  // SELECTOR PONDERADO
  // --------------------------------------------------------------------------

  _pickAttack(distance) {
    const baseAttacks = Array.isArray(this.config.attacks) ? this.config.attacks : [];
    const phase2Attacks = this.enemy.phase >= 2 ? (this.override.phase2Attacks || []) : [];
    const ids = Array.from(new Set([...baseAttacks, ...phase2Attacks]));

    const candidates = [];
    let totalWeight = 0;

    for (const id of ids) {
      const profile = BOSS_AI.ATTACKS[id];
      if (!profile) continue;
      if (distance < profile.minRange || distance > profile.maxRange) continue;
      if ((this.attackCooldowns.get(id) || 0) > 0) continue;

      let weight = profile.weight * (this.override.weights?.[id] ?? 1);
      if (id === this.lastAttackId) weight *= BOSS_AI.DEFAULTS.repeatWeightMult;
      if (weight <= 0) continue;

      candidates.push({ id, weight });
      totalWeight += weight;
    }

    if (candidates.length === 0) return null;

    let roll = Math.random() * totalWeight;
    for (const candidate of candidates) {
      roll -= candidate.weight;
      if (roll <= 0) return candidate.id;
    }
    return candidates[candidates.length - 1].id;
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  _enterState(nextState, duration = 0) {
    this.state = nextState;
    this.stateTimer = duration;
    this.stateAge = 0;
  }

  _attackGap() {
    const base = BOSS_AI.DEFAULTS.attackGap;
    return this.enemy.phase >= 2
      ? base * BOSS_AI.DEFAULTS.phase2AttackGapMult
      : base;
  }

  _spawnAttackDust(ctx, opts) {
    const vfx = ctx?.callbacks?.vfxList || this.lastCallbacks?.vfxList;
    if (!Array.isArray(vfx) || !this.enemy?.scene) return;

    const origin = this.enemy.group.position.clone();
    if (ctx?.worldPhysics) {
      origin.y = ctx.worldPhysics.getGroundHeight(origin.x, origin.z, origin.y);
    }
    spawnBossAttackDust(this.enemy.scene, origin, vfx, opts);
  }

  // Al morir el jefe no deben quedar hazards/proyectiles suyos resolviéndose.
  _cleanupOwnedAttacks() {
    const callbacks = this.lastCallbacks;
    const boss = this.enemy;
    if (!callbacks || !boss) return;

    const scene = boss.scene;
    const hazards = callbacks.bossHazards;
    if (Array.isArray(hazards)) {
      for (let i = hazards.length - 1; i >= 0; i--) {
        const hazard = hazards[i];
        if (hazard?.boss !== boss && hazard?.ownerBoss !== boss) continue;
        if (hazard.mesh && scene) scene.remove(hazard.mesh);
        hazard.mesh?.geometry?.dispose?.();
        hazard.mesh?.material?.dispose?.();
        hazards.splice(i, 1);
      }
    }

    const projectiles = callbacks.bossProjectiles;
    if (Array.isArray(projectiles)) {
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        if (projectile?.boss !== boss && projectile?.ownerBoss !== boss) continue;
        if (projectile.mesh && scene) scene.remove(projectile.mesh);
        if (projectile.mesh?.material && !projectile.sharedMat) {
          projectile.mesh.material.dispose();
        }
        projectiles.splice(i, 1);
      }
    }
  }

  _clearCharge() {
    if (!this.enemy) return;
    this.enemy.chargeTime = 0;
    this.enemy.chargeVec = null;
    this.enemy.attackCharge = 0;
  }

  _cancelTelegraph() {
    if (!this.telegraph) return;
    this.telegraph.destroy();
    this.telegraph = null;
  }
}
