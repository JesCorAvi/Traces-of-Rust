// Enemigo: billboard, stats, IA de defensa, movimiento y efectos de estado.
// Exports: Enemy.

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { AudioSys } from '../audio.js';
import { createBillboardSprite } from './billboard.js';
import {
  initEnemyDefenseState,
  evaluateEnemyTarget,
  resolveEnemyNavigationGoal
} from '../defense/enemyTargetAI.js';

export class Enemy {
  constructor(scene) {
    this.scene = scene;
    this.billboard = createBillboardSprite('zombie', 2.0);
    this.group = this.billboard.group;
    this.active = false;
    this.isBoss = false;
    this.defenseAI = null;
    this.group.visible = false;
    scene.add(this.group);
  }

  init(type, playerPos, gameTime, playerFwd, worldPhysics, bossCfg = null, defenseOpts = null) {
    this.type = type;
    this.active = true;
    this.group.visible = true;
    this.isBoss = !!bossCfg;
    this.bossData = bossCfg;
    this.phase = 1;
    this.defenseAI = null;

    const mins = gameTime / 60;
    let hpScale = defenseOpts?.hpMult ?? (1 + mins * CONFIG.DIFFICULTY.HP_SCALE_PER_MIN);
    let dmgScale = defenseOpts?.dmgMult ?? (1 + mins * CONFIG.DIFFICULTY.DMG_SCALE_PER_MIN);
    let spdBoost = defenseOpts?.spdMult ?? 1;

    if (!defenseOpts && gameTime > CONFIG.DIFFICULTY.ENDGAME_START_TIME) {
      const overSec = gameTime - CONFIG.DIFFICULTY.ENDGAME_START_TIME;
      const expMult = Math.pow(CONFIG.DIFFICULTY.ENDGAME_EXP_BASE, overSec);
      hpScale *= expMult;
      dmgScale *= Math.min(8, expMult);
      spdBoost = Math.min(1.85, 1 + overSec * 0.012);
    }

    if (this.isBoss) {
      this.hp = Math.round(bossCfg.hp * (defenseOpts ? hpScale : (1.35 + mins * 0.18)));
      this.maxHp = this.hp;
      this.dmg = Math.round(bossCfg.dmg * (defenseOpts ? dmgScale : 1));
      this.speed = bossCfg.speed * spdBoost;
      this.billboard.changeSheet(bossCfg.id, bossCfg.size);
      this.specialTimer = 3.2;
      this.chargeVec = null;
      this.chargeTime = 0;
    } else {
      const size = type === 'weeper' ? 2.5 : 2.0;
      this.hp = (type === 'weeper' ? 48 : type === 'worm' ? 36 : 22) * hpScale;
      this.maxHp = this.hp;
      this.dmg = (type === 'weeper' ? 18 : 13) * dmgScale;
      this.speed = (type === 'weeper' ? 4.2 : 4.6) * spdBoost;
      this.billboard.changeSheet(type, size);
      this.chargeVec = null;
      this.chargeTime = 0;
      this.shootTimer = 1.0 + Math.random() * 1.5;
      this.shootInterval = 2.6;
      this.shootRange = 24.0;
    }

    this.state = 'walk';
    this.stateTimer = 0;
    this.stepAccum = 0;
    this.attackCharge = 0;
    this.hasTriggeredScare = false;
    this.burnTimer = 0;
    this.burnDps = 0;
    this.slowTimer = 0;
    this.slowFactor = 0.6;
    this.stunTimer = 0;
    this.steerDir = Math.random() < 0.5 ? 1 : -1;
    this.billboard.mesh.material.emissive.setHex(0x000000);

    if (defenseOpts && defenseOpts.isDefenseMode) {
      initEnemyDefenseState(this, defenseOpts.routeId, defenseOpts.pathSystem);
    } else {
      let ang;
      if (type === 'weeper' || this.isBoss) {
        const baseAng = Math.atan2(playerFwd.x, playerFwd.z);
        ang = baseAng + (Math.random() - 0.5) * 1.2;
      } else {
        ang = Math.random() * Math.PI * 2;
      }
      const dist = this.isBoss ? 20 : (24 + Math.random() * 12);
      const sx = playerPos.x + Math.sin(ang) * dist;
      const sz = playerPos.z + Math.cos(ang) * dist;
      const sy = worldPhysics ? worldPhysics.getGroundHeight(sx, sz, 2.0) : 0;
      this.group.position.set(sx, sy, sz);
    }

    this.billboard.setDirectionalFrame(0, 1, 0);
  }

  applySlow(factor, duration) {
    // Se conserva la ralentización más fuerte activa
    if (this.slowTimer <= 0 || factor < this.slowFactor) this.slowFactor = factor;
    this.slowTimer = Math.max(this.slowTimer, duration);
  }

  applyBurn(dps, duration) {
    this.burnDps = Math.max(this.burnDps, dps);
    this.burnTimer = Math.max(this.burnTimer, duration);
  }

  applyStun(duration) {
    this.stunTimer = Math.max(this.stunTimer, duration);
  }

  update(dt, playerPos, playerFwd, camPos, worldPhysics, callbacks) {
    if (!this.active) return false;
    this.billboard.faceCamera(camPos);

    if (this.state === 'dead') {
      this.stateTimer += dt;
      const frame = Math.min(3, Math.floor(this.stateTimer * 8));
      this.billboard.setDirectionalFrame(this.billboard.dirRow, 3, frame);
      return this.stateTimer > 0.5;
    }

    const isDef = !!(this.defenseAI && this.defenseAI.enabled);

    if (this.burnTimer > 0) {
      this.burnTimer -= dt;
      this.billboard.mesh.material.emissive.setHex(0x662200);
      if (callbacks.onBurnTick) callbacks.onBurnTick(this, this.burnDps * dt);
      if (this.state === 'dead') return false;
    } else if (this.stunTimer > 0) {
      this.billboard.mesh.material.emissive.setHex(0x2c4148);
    } else if (this.slowTimer > 0) {
      this.billboard.mesh.material.emissive.setHex(0x18282c);
    } else if (isDef && this.defenseAI.alertFlashTimer > 0) {
      this.billboard.mesh.material.emissive.setHex(0x881111);
    } else if (this.isBoss && this.phase === 2) {
      this.billboard.mesh.material.emissive.setHex(0x440808);
    } else {
      this.billboard.mesh.material.emissive.setHex(0x000000);
    }

    if (this.isBoss && this.phase === 1 && this.hp <= this.maxHp * 0.5) {
      this.phase = 2;
      this.speed *= 1.28;
      AudioSys.playBossHorn();
      if (callbacks.onBossPhaseChange) callbacks.onBossPhaseChange(this);
    }

    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.group.position);
    const horizDistPlayer = Math.hypot(toPlayer.x, toPlayer.z);
    const heightDiffPlayer = Math.abs(playerPos.y - this.group.position.y);

    // En modo Supervivencia se mantiene el reposicionamiento si se quedan demasiado atrás
    if (!isDef && !this.isBoss && horizDistPlayer > 48) {
      const ang = Math.random() * Math.PI * 2;
      this.group.position.x = playerPos.x + Math.sin(ang) * 27;
      this.group.position.z = playerPos.z + Math.cos(ang) * 27;
      return false;
    }

    if (this.isBoss) {
      if (this.chargeTime > 0) {
        this.chargeTime -= dt;
        this.billboard.facingYaw = Math.atan2(-this.chargeVec.x, -this.chargeVec.z);
        this.group.position.addScaledVector(this.chargeVec, 18.5 * dt);
        if (worldPhysics) {
          worldPhysics.resolveCollision(this.group.position, 0.85, this.group.position.y);
          this.group.position.y = worldPhysics.getGroundHeight(this.group.position.x, this.group.position.z, this.group.position.y);
        }
        if (horizDistPlayer < 2.1 && heightDiffPlayer < 1.8 && callbacks.onDealDamage) callbacks.onDealDamage(this);
        return false;
      }

      this.specialTimer -= dt * (this.phase === 2 ? 1.45 : 1.0);
      if (this.specialTimer <= 0) {
        this.specialTimer = 3.6;
        const atkList = this.bossData.attacks;
        const chosen = atkList[Math.floor(Math.random() * atkList.length)];
        if (callbacks.onBossSpecial) callbacks.onBossSpecial(this, chosen);
      }
    }

    let goalPos = playerPos;
    let attackTargetType = 'player';
    let targetStructure = null;
    let stopDist = this.isBoss ? 2.2 : 1.65;

    if (isDef) {
      evaluateEnemyTarget(
        this, dt, playerPos, callbacks.playerAlive !== false,
        callbacks.coreMachine, callbacks.extraStructures,
        callbacks.pathSystem, this.scene, callbacks.vfxList
      );
      const nav = resolveEnemyNavigationGoal(
        this, dt, playerPos, callbacks.coreMachine, callbacks.pathSystem, worldPhysics
      );
      goalPos = nav.goalPos;
      attackTargetType = nav.attackTarget;
      targetStructure = nav.structure;
      stopDist = nav.stopDist;

      if (this.defenseAI && this.defenseAI.hasReachedExit) {
        if (callbacks.onEnemyEscaped) {
          callbacks.onEnemyEscaped(this);
        }
        this.active = false;
        this.hp = 0;
        this.group.visible = false;
        return true;
      }
    }

    const toGoal = new THREE.Vector3().subVectors(goalPos, this.group.position);
    const horizDistGoal = Math.hypot(toGoal.x, toGoal.z);

    let moveSpd = this.speed;
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      moveSpd *= this.slowFactor;
      if (this.slowTimer <= 0) this.slowFactor = 0.6;
    }
    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      moveSpd = 0;
    }

    let targetState = 1; // WALK

    if (this.type === 'weeper') {
      this.shootTimer = (this.shootTimer || 0) - dt;
      if (this.shootTimer <= 0 && horizDistPlayer <= (this.shootRange || 24.0)) {
        this.shootTimer = this.shootInterval || 2.6;
        targetState = 2; // ATTACK
        if (callbacks.onShootProjectile) {
          const spawnOrigin = this.group.position.clone().add(new THREE.Vector3(0, 1.25, 0));
          const targetChest = playerPos.clone().add(new THREE.Vector3(0, 1.0, 0));
          const dir = new THREE.Vector3().subVectors(targetChest, spawnOrigin).normalize();
          callbacks.onShootProjectile(spawnOrigin, dir, 12.0, this.dmg * 0.75);
        }
      }
    }

    if (this.state === 'hurt') {
      this.stateTimer -= dt;
      moveSpd *= this.isBoss ? 0.75 : 0.2;
      targetState = 3; // HURT
      if (this.stateTimer <= 0) this.state = 'walk';
    }

    // Ataque al objetivo actual (Jugador en cualquier modo, o Núcleo/Estructura en modo Defensa)
    if (attackTargetType === 'player') {
      if (horizDistPlayer < stopDist && heightDiffPlayer < 1.6 && moveSpd > 0 && this.state !== 'hurt') {
        targetState = 2; // ATTACK
        moveSpd *= 0.25;
        this.attackCharge += dt;
        if (this.attackCharge >= 0.35) {
          this.attackCharge = -0.55;
          if (horizDistPlayer < stopDist + 0.15 && heightDiffPlayer < 1.7 && callbacks.onDealDamage) {
            callbacks.onDealDamage(this);
          }
        }
      } else {
        this.attackCharge = Math.max(0, this.attackCharge - dt * 2);
      }
    } else if (isDef && targetStructure && horizDistGoal <= stopDist + 0.25 && this.state !== 'hurt' && this.stunTimer <= 0) {
      targetState = 2; // ATTACK AL NÚCLEO O ESTRUCTURA
      moveSpd = 0;
      const dirToStruct = new THREE.Vector3().subVectors(targetStructure.position, this.group.position);
      this.billboard.facingYaw = Math.atan2(-dirToStruct.x, -dirToStruct.z);

      this.defenseAI.coreAttackTimer += dt;
      const atkInterval = this.defenseAI.profile.coreAttackInterval || 1.15;
      if (this.defenseAI.coreAttackTimer >= atkInterval) {
        this.defenseAI.coreAttackTimer = 0;
        const coreDmg = this.defenseAI.profile.coreDamage || this.dmg;
        targetStructure.takeDamage(coreDmg, this);
      }
    }

    const isFar = !this.isBoss && horizDistPlayer > CONFIG.DIFFICULTY.AI_LOD_DIST;
    const tickRate = isFar ? 0.14 : (this.type === 'weeper' ? 0.06 : 0.08);

    this.stepAccum += dt;
    if (this.stepAccum >= tickRate) {
      const stepDt = this.stepAccum;
      this.stepAccum = 0;

      if (moveSpd > 0 && horizDistGoal > Math.max(0.25, stopDist * 0.72)) {
        const dir = new THREE.Vector3(toGoal.x, 0, toGoal.z).normalize();
        this.billboard.facingYaw = Math.atan2(-dir.x, -dir.z);
        const prevX = this.group.position.x, prevZ = this.group.position.z;
        this.group.position.addScaledVector(dir, moveSpd * stepDt);

        if (worldPhysics) {
          worldPhysics.resolveCollision(this.group.position, this.isBoss ? 0.8 : 0.55, this.group.position.y);
          const moved = Math.hypot(this.group.position.x - prevX, this.group.position.z - prevZ);
          if (moved < moveSpd * stepDt * 0.35) {
            const tangent = new THREE.Vector3(-dir.z * this.steerDir, 0, dir.x * this.steerDir);
            this.billboard.facingYaw = Math.atan2(-tangent.x, -tangent.z);
            this.group.position.addScaledVector(tangent, moveSpd * stepDt * 0.9);
            worldPhysics.resolveCollision(this.group.position, 0.55, this.group.position.y);
          }
          const targetY = worldPhysics.getGroundHeight(this.group.position.x, this.group.position.z, this.group.position.y);
          this.group.position.y += (targetY - this.group.position.y) * 0.45;
        }
      }

      this.billboard.animTimer += stepDt * (targetState === 2 ? 10 : 6);
      const col = Math.floor(this.billboard.animTimer) % 4;
      this.billboard.setDirectionalFrame(this.billboard.dirRow, targetState, col);
    }

    return false;
  }
}
