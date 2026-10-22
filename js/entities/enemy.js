// Enemigo: billboard, stats, IA de defensa, movimiento y efectos de estado.
// Exports: Enemy.

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { AudioSys } from '../audio.js';
import { createBillboardSprite } from './billboard.js';
import { BossController } from './bossController.js';
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
    this.bossAI = null;
    this.defenseAI = null;
    this.isEventEnemy = false;
    this.netId = 0;
    this.isNetworkReplica = false;
    this.netTargetX = null;
    this.netTargetZ = null;
    this.netTargetIsLocal = true;
    this.visualState = 1;
    this.netVisualState = 1;
    this.yVel = 0;
    this.isGrounded = true;
    this.isJumping = false;
    this.jumpTargetY = 0;
    this.jumpCooldown = 0;
    this.landingSquashTimer = 0;
    this.group.visible = false;
    scene.add(this.group);
  }

  init(type, playerPos, gameTime, playerFwd, worldPhysics, bossCfg = null, defenseOpts = null) {
    this.bossAI?.destroy();
    this.bossAI = null;
    this.type = type;
    this.active = true;
    this.group.visible = true;
    this.isBoss = !!bossCfg;
    this.bossData = bossCfg;
    this.phase = 1;
    this.defenseAI = null;
    this.isEventEnemy = !!defenseOpts?.isEventEnemy;
    this.visualState = 1;
    this.netVisualState = 1;
    this._networkDrop = null;
    this._lastHitFeedbackAt = 0;
    this.isSplitChild = false;
    this.collisionRadius = 0.55;
    this.attackStopDistance = 1.65;
    this.enemyTickRate = 0.08;
    this.leakLives = 1;
    this.knockbackResist = 0;
    this.nestSpawnTimer = 0;
    this.nestSpawnInterval = 5;
    this.nestMaxChildren = 0;
    this.nestChildrenSpawned = 0;
    this.healPulseTimer = 0;
    this.healPulseInterval = 3;
    this.healPulseRadius = 5;
    this.healPulseAmount = 12;
    this.splitCount = 0;
    this.splitType = 'worm';

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
      const bossHpScale = defenseOpts?.bossHpMult ?? hpScale;
      this.hp = Math.round(bossCfg.hp * (defenseOpts ? bossHpScale : (1.35 + mins * 0.18)));
      this.maxHp = this.hp;
      this.dmg = Math.round(bossCfg.dmg * (defenseOpts ? dmgScale : 1));
      this.speed = bossCfg.speed * spdBoost;
      this.billboard.changeSheet(bossCfg.id, bossCfg.size);
      this.chargeVec = null;
      this.chargeTime = 0;
      this.collisionRadius = 0.8;
      this.attackStopDistance = 2.2;
      this.enemyTickRate = 0.08;
      this.leakLives = 20;
      this.bossAI = new BossController(this, bossCfg);
    } else {
      const archetype = CONFIG.ENEMY_TYPES[type] || null;
      if (archetype) {
        this.hp = archetype.hp * hpScale;
        this.maxHp = this.hp;
        this.dmg = archetype.dmg * dmgScale;
        this.speed = archetype.speed * spdBoost;
        this.billboard.changeSheet(type, archetype.size ?? 2.0);
        this.collisionRadius = archetype.collisionRadius ?? 0.55;
        this.attackStopDistance = archetype.attackStopDistance ?? 1.65;
        this.enemyTickRate = archetype.tickRate ?? 0.08;
        this.leakLives = archetype.leakLives ?? 1;
        this.knockbackResist = archetype.knockbackResist ?? 0;

        const spawnWorms = archetype.spawnWorms;
        if (spawnWorms) {
          this.nestSpawnInterval = spawnWorms.interval ?? 5;
          this.nestSpawnTimer = this.nestSpawnInterval;
          this.nestMaxChildren = spawnWorms.max ?? 3;
          this.nestChildrenSpawned = 0;
        }
        const healPulse = archetype.healPulse;
        if (healPulse) {
          this.healPulseInterval = healPulse.interval ?? 3;
          this.healPulseTimer = this.healPulseInterval;
          this.healPulseRadius = healPulse.radius ?? 5;
          this.healPulseAmount = healPulse.amount ?? 12;
        }
        const split = archetype.split;
        if (split) {
          this.splitCount = split.count ?? 2;
          this.splitType = split.type ?? 'worm';
        }
      } else {
        const size = type === 'weeper' ? 2.5 : 2.0;
        this.hp = (type === 'weeper' ? 48 : type === 'worm' ? 36 : 22) * hpScale;
        this.maxHp = this.hp;
        this.dmg = (type === 'weeper' ? 18 : 13) * dmgScale;
        this.speed = (type === 'weeper' ? 4.2 : 4.6) * spdBoost;
        this.billboard.changeSheet(type, size);
        this.collisionRadius = 0.55;
        this.attackStopDistance = 1.65;
        this.enemyTickRate = type === 'weeper' ? 0.06 : 0.08;
        this.leakLives = type === 'weeper' ? 3 : type === 'worm' ? 2 : 1;
      }
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
    this.yVel = 0;
    this.isGrounded = true;
    this.isJumping = false;
    this.jumpTargetY = 0;
    this.jumpCooldown = 0.2 + Math.random() * 0.3;
    this.landingSquashTimer = 0;
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

  onPlayerDead() {
    this.bossAI?.onPlayerDead();
  }

  onPlayerAlive() {
    this.bossAI?.onPlayerAlive();
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

    // Corrección suave de las réplicas del Cliente hacia la última posición
    // autoritativa del Host (10 Hz); el movimiento local sigue a 60 FPS.
    if (this.isNetworkReplica && this.netTargetX !== null) {
      const k = Math.min(1, dt * 8);
      this.group.position.x += (this.netTargetX - this.group.position.x) * k;
      this.group.position.z += (this.netTargetZ - this.group.position.z) * k;
    }

    const isDef = !!(this.defenseAI && this.defenseAI.enabled);

    if (this.burnTimer > 0) {
      this.burnTimer -= dt;
      if (callbacks.onBurnTick) callbacks.onBurnTick(this, this.burnDps * dt);
      if (this.state === 'dead') return false;
    }

    if (this.isBoss && this.bossAI?.hitFlashTimer > 0) {
      this.billboard.mesh.material.emissive.setHex(0xff5533);
    } else if (this.burnTimer > 0) {
      this.billboard.mesh.material.emissive.setHex(0x662200);
    } else if (this.stunTimer > 0) {
      this.billboard.mesh.material.emissive.setHex(0x2c4148);
    } else if (this.slowTimer > 0) {
      this.billboard.mesh.material.emissive.setHex(0x18282c);
    } else if (isDef && this.defenseAI.alertFlashTimer > 0) {
      this.billboard.mesh.material.emissive.setHex(0x881111);
    } else if (this.isBoss && this.bossAI?.isPhaseTransition) {
      const pulse = Math.sin(this.bossAI.stateAge * 18) > 0 ? 0x661010 : 0x220404;
      this.billboard.mesh.material.emissive.setHex(pulse);
    } else if (this.isBoss && this.phase === 2) {
      this.billboard.mesh.material.emissive.setHex(0x440808);
    } else {
      this.billboard.mesh.material.emissive.setHex(0x000000);
    }

    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.group.position);
    const horizDistPlayer = Math.hypot(toPlayer.x, toPlayer.z);
    const heightDiffPlayer = Math.abs(playerPos.y - this.group.position.y);

    // La IA del jefe decide antes de mover/atacar; la navegación sigue siendo la original.
    if (this.isBoss && this.bossAI) {
      this.bossAI.update(dt, {
        playerPos,
        playerAlive: callbacks.playerAlive !== false,
        callbacks,
        worldPhysics,
        horizDistPlayer,
        isNetworkReplica: this.isNetworkReplica
      });
    }

    // ========================================================================
    // FÍSICA VERTICAL, GRAVEDAD Y ATERRIZAJE (SALTO Y ESCALADA DE SUPERFICIES)
    // ========================================================================
    const GRAVITY = 23.0;
    this.jumpCooldown = Math.max(0, (this.jumpCooldown || 0) - dt);

    if (this.landingSquashTimer > 0) {
      this.landingSquashTimer -= dt;
      const t = Math.max(0, this.landingSquashTimer / 0.12);
      this.billboard.applyJuiceTransforms(1 + t * 0.22, 1 - t * 0.18, 0, 0);
    }

    const currentGroundY = worldPhysics
      ? worldPhysics.getGroundHeight(this.group.position.x, this.group.position.z, this.group.position.y)
      : 0;

    if (!this.isGrounded || this.yVel !== 0 || this.group.position.y > currentGroundY + 0.05) {
      this.isGrounded = false;
      this.yVel -= GRAVITY * dt;
      this.group.position.y += this.yVel * dt;

      if (this.group.position.y <= currentGroundY) {
        this.group.position.y = currentGroundY;
        this.yVel = 0;
        this.isGrounded = true;
        this.isJumping = false;
        this.jumpTargetY = 0;
        this.landingSquashTimer = 0.12;

        if (this.isBoss) callbacks.onCamShake?.(0.22);
      } else if (this.yVel > 1.8) {
        this.billboard.applyJuiceTransforms(0.9, 1.12, 0, 0);
      }
    } else {
      this.group.position.y = currentGroundY;
      this.isGrounded = true;
      this.yVel = 0;
    }

    // En modo Supervivencia se mantiene el reposicionamiento si se quedan demasiado atrás
    const maxBehindDist = this.isEventEnemy ? 120 : 48;
    const snapDist = this.isEventEnemy ? 65 : 27;
    if (!isDef && !this.isBoss && horizDistPlayer > maxBehindDist) {
      const ang = Math.random() * Math.PI * 2;
      this.group.position.x = playerPos.x + Math.sin(ang) * snapDist;
      this.group.position.z = playerPos.z + Math.cos(ang) * snapDist;
      return false;
    }

    if (this.isBoss) {
      if (this.chargeTime > 0 && this.bossAI?.canStartCharge === false) {
        this.chargeTime = 0;
        this.chargeVec = null;
      }

      if (this.chargeTime > 0 && this.chargeVec) {
        this.chargeTime -= dt;
        this.billboard.facingYaw = Math.atan2(-this.chargeVec.x, -this.chargeVec.z);
        this.group.position.addScaledVector(this.chargeVec, 18.5 * dt);
        if (worldPhysics) {
          const aheadH = worldPhysics.getGroundHeight(
            this.group.position.x + this.chargeVec.x * 0.85,
            this.group.position.z + this.chargeVec.z * 0.85,
            0, true
          );
          if (aheadH > this.group.position.y + 0.3 && this.isGrounded && this.jumpCooldown <= 0) {
            this.yVel = Math.min(13.5, Math.sqrt(2 * GRAVITY * (aheadH - this.group.position.y + 0.6)));
            this.isGrounded = false;
            this.isJumping = true;
            this.jumpTargetY = aheadH;
            this.jumpCooldown = 0.5;
          }
          const effY = (this.isJumping && this.jumpTargetY > this.group.position.y)
            ? Math.max(this.group.position.y, this.jumpTargetY - 0.7)
            : this.group.position.y;
          worldPhysics.resolveCollision(this.group.position, 0.85, effY);
        }
        if (horizDistPlayer < 2.2 && heightDiffPlayer < 2.2 && callbacks.onDealDamage) callbacks.onDealDamage(this);
        return false;
      }
    }

    let goalPos = playerPos;
    let attackTargetType = 'player';
    let targetStructure = null;
    let stopDist = this.isBoss ? 2.2 : (this.attackStopDistance || 1.65);

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
    if (this.isBoss && this.bossAI) {
      moveSpd *= this.bossAI.movementScale;
      // En réplicas, el Host marca el estado visual de ataque: evita deslizamientos.
      if (this.isNetworkReplica && this.netVisualState === 2) moveSpd = 0;
    }

    let targetState = 1; // WALK

    if (this.type === 'nest' && this.nestChildrenSpawned < this.nestMaxChildren) {
      this.nestSpawnTimer -= dt;
      if (this.nestSpawnTimer <= 0) {
        this.nestSpawnTimer = this.nestSpawnInterval;
        this.nestChildrenSpawned++;
        targetState = 2; // ATTACK / puesta
        callbacks.onNestSpawn?.(this);
      }
    }

    if (this.type === 'regenerator') {
      this.healPulseTimer -= dt;
      if (this.healPulseTimer <= 0) {
        this.healPulseTimer = this.healPulseInterval;
        targetState = 2; // ATTACK / pulso
        callbacks.onRegeneratorPulse?.(this);
      }
    }

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
    const bossAllowsContact = !this.isBoss || this.bossAI?.allowsContactDamage !== false;
    if (attackTargetType === 'player') {
      const vertDiff = Math.abs(playerPos.y - this.group.position.y);
      const inAttackRange = horizDistPlayer < stopDist && (vertDiff < 1.8 || (this.isJumping && vertDiff < 2.6));

      // Si el jugador está en una superficie elevada y a distancia de asalto, abalanzarse con un salto hacia él
      if (bossAllowsContact && horizDistPlayer < stopDist + 1.4 && playerPos.y > this.group.position.y + 0.45 && this.isGrounded && this.jumpCooldown <= 0) {
        const dy = playerPos.y - this.group.position.y;
        this.yVel = Math.min(14.0, Math.sqrt(2 * GRAVITY * (dy + 0.65)));
        this.isGrounded = false;
        this.isJumping = true;
        this.jumpTargetY = playerPos.y;
        this.jumpCooldown = 0.5;
        this.billboard.applyJuiceTransforms(1.15, 0.85, 0, 0);
      }

      if (bossAllowsContact && inAttackRange && moveSpd > 0 && this.state !== 'hurt') {
        targetState = 2; // ATTACK
        moveSpd *= 0.25;
        this.attackCharge += dt;
        if (this.attackCharge >= 0.35) {
          this.attackCharge = -0.55;
          if (horizDistPlayer < stopDist + 0.25 && vertDiff < 2.6 && callbacks.onDealDamage) {
            callbacks.onDealDamage(this);
          }
        }
      } else {
        this.attackCharge = Math.max(0, this.attackCharge - dt * 2);
      }
    } else if (bossAllowsContact && isDef && targetStructure && horizDistGoal <= stopDist + 0.25 && this.state !== 'hurt' && this.stunTimer <= 0) {
      targetState = 2; // ATTACK AL NÚCLEO O ESTRUCTURA
      moveSpd = 0;
      const dirToStruct = new THREE.Vector3().subVectors(targetStructure.position, this.group.position);
      this.billboard.facingYaw = Math.atan2(-dirToStruct.x, -dirToStruct.z);

      this.defenseAI.coreAttackTimer += dt;
      const atkInterval = this.defenseAI.profile.coreAttackInterval || 1.15;
      if (this.defenseAI.coreAttackTimer >= atkInterval) {
        this.defenseAI.coreAttackTimer = 0;
        // coreDamage está en vidas del núcleo; contra tropas aliadas se usa
        // el daño de melé normal del enemigo.
        const isCoreTarget = targetStructure === callbacks.coreMachine;
        const hitDmg = isCoreTarget
          ? (this.defenseAI.profile.coreDamage || this.dmg)
          : this.dmg;
        targetStructure.takeDamage(Math.round(hitDmg), this);
      }
    }

    if (this.isBoss && this.bossAI) {
      if (this.isNetworkReplica) {
        targetState = Number.isFinite(this.netVisualState) ? this.netVisualState : 1;
      } else if (this.state !== 'hurt') {
        targetState = this.bossAI.visualState;
      }

      const lockedYaw = this.bossAI.lockedFacingYaw;
      if (lockedYaw !== null) {
        this.billboard.facingYaw = lockedYaw;
      } else if (this.bossAI.shouldFacePlayer) {
        const dx = playerPos.x - this.group.position.x;
        const dz = playerPos.z - this.group.position.z;
        if (Math.abs(dx) + Math.abs(dz) > 0.001) {
          this.billboard.facingYaw = Math.atan2(-dx, -dz);
        }
      }
    }

    this.visualState = targetState;
    const isFar = !this.isBoss && horizDistPlayer > CONFIG.DIFFICULTY.AI_LOD_DIST;
    const tickRate = isFar ? 0.14 : (this.enemyTickRate || 0.08);

    this.stepAccum += dt;
    if (this.stepAccum >= tickRate) {
      const stepDt = this.stepAccum;
      this.stepAccum = 0;

      if (moveSpd > 0 && horizDistGoal > Math.max(0.25, stopDist * 0.72)) {
        const dir = new THREE.Vector3(toGoal.x, 0, toGoal.z).normalize();
        this.billboard.facingYaw = Math.atan2(-dir.x, -dir.z);

        const dyGoal = goalPos.y - this.group.position.y;

        // Comprobación de salto: ¿El objetivo está elevado (jugador sobre caja/plataforma)?
        // o ¿Hay un obstáculo (cajas, bidones, fosos, rampas) enfrente que bloquea el camino?
        let shouldJump = false;
        let jumpTargetElevation = 0;

        if (this.isGrounded && this.jumpCooldown <= 0) {
          // Caso A: El objetivo está a mayor altura (jugador subido a cajas, plataformas o rampas)
          if (dyGoal > 0.35 && horizDistGoal < 4.5) {
            shouldJump = true;
            jumpTargetElevation = goalPos.y;
          } else if (worldPhysics) {
            // Caso B: Sondeo hacia adelante para detectar obstáculos que se interpongan en el camino
            const probeDist = Math.max(0.8, Math.min(1.6, moveSpd * 0.3));
            const probeX = this.group.position.x + dir.x * probeDist;
            const probeZ = this.group.position.z + dir.z * probeDist;
            // ignoreStepLimit = true para obtener la cota superior real del obstáculo
            const obstacleTopY = worldPhysics.getGroundHeight(probeX, probeZ, 0, true);
            if (obstacleTopY > this.group.position.y + 0.35) {
              shouldJump = true;
              jumpTargetElevation = obstacleTopY;
            }
          }
        }

        if (shouldJump) {
          const dy = Math.max(0.6, jumpTargetElevation - this.group.position.y);
          // Velocidad vertical necesaria para coronar con holgura la superficie
          const jumpImpulse = Math.min(14.5, Math.max(8.8, Math.sqrt(2 * GRAVITY * (dy + 0.65))));
          this.yVel = jumpImpulse;
          this.isGrounded = false;
          this.isJumping = true;
          this.jumpTargetY = jumpTargetElevation;
          this.jumpCooldown = 0.45;
          this.billboard.applyJuiceTransforms(1.18, 0.82, 0, 0);

          if (horizDistPlayer < 14 && typeof AudioSys !== 'undefined' && Math.random() < 0.25) {
            AudioSys.play(110 + Math.random() * 40, 0.08, 'sawtooth', 0.03);
          }
        }

        const prevX = this.group.position.x, prevZ = this.group.position.z;
        // Si está saltando hacia un obstáculo, mantener o impulsar avance horizontal
        const airMod = this.isJumping ? 1.15 : 1.0;
        this.group.position.addScaledVector(dir, moveSpd * airMod * stepDt);

        if (worldPhysics) {
          // Si está saltando hacia una elevación, calculamos la cota efectiva para no ser repelido
          // por el frontal de la caja/plataforma mientras asciende
          const effectiveY = (this.isJumping && this.jumpTargetY > this.group.position.y)
            ? Math.max(this.group.position.y, this.jumpTargetY - 0.70)
            : this.group.position.y;

          worldPhysics.resolveCollision(
            this.group.position,
            this.collisionRadius || (this.isBoss ? 0.8 : 0.55),
            effectiveY
          );

          const moved = Math.hypot(this.group.position.x - prevX, this.group.position.z - prevZ);
          if (moved < moveSpd * stepDt * 0.35) {
            // Caso C: Si quedó atascado contra un obstáculo que se interpone, saltar y treparlo
            const blockH = worldPhysics.getGroundHeight(
              this.group.position.x + dir.x * 0.8,
              this.group.position.z + dir.z * 0.8,
              0, true
            );
            if (blockH > this.group.position.y + 0.25 && this.isGrounded && this.jumpCooldown <= 0) {
              const dyBlock = blockH - this.group.position.y;
              this.yVel = Math.min(14.5, Math.max(8.8, Math.sqrt(2 * GRAVITY * (dyBlock + 0.65))));
              this.isGrounded = false;
              this.isJumping = true;
              this.jumpTargetY = blockH;
              this.jumpCooldown = 0.45;
            } else {
              const tangent = new THREE.Vector3(-dir.z * this.steerDir, 0, dir.x * this.steerDir);
              this.billboard.facingYaw = Math.atan2(-tangent.x, -tangent.z);
              this.group.position.addScaledVector(tangent, moveSpd * stepDt * 0.9);
              worldPhysics.resolveCollision(
                this.group.position,
                this.collisionRadius || 0.55,
                effectiveY
              );
            }
          }
        }
      }

      this.billboard.animTimer += stepDt * (targetState === 2 ? 10 : 6);
      const col = Math.floor(this.billboard.animTimer) % 4;
      this.billboard.setDirectionalFrame(this.billboard.dirRow, targetState, col);
    }

    return false;
  }
}
