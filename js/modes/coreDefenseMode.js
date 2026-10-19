import * as THREE from 'three';
import { MODES_CONFIG, CORE_DEFENSE_CONFIG } from '../config.js';
import { AudioSys } from '../audio.js';
import { triggerBossSpecialAttack } from '../combat.js';
import { GameEvents } from '../core/eventBus.js';
import { CoreMachine } from '../defense/coreMachine.js';
import { PathSystem } from '../defense/pathSystem.js';
import { SpawnPointSystem } from '../defense/spawnPointSystem.js';
import { WaveManager } from '../defense/waveManager.js';
import { TurretSystem } from '../defense/turretSystem.js';
import { TowerDefenseTutorial } from '../tutorial/towerDefenseTutorial.js';

// ============================================================================
// MODO 2: DEFENDER EL NÚCLEO (Tower Defense con colocación libre de torretas)
// ============================================================================

export class CoreDefenseMode {
  constructor() {
    this.id = 'core_defense';
    this.meta = MODES_CONFIG.CATALOG.core_defense;
    this.coreMachine = null;
    this.pathSystem = null;
    this.spawnPointSystem = null;
    this.waveManager = null;
    this.turretSystem = null;
    this.tutorial = null;
    this.tutorialActive = false;
    this.extraStructures = []; // Torretas y tropas aliadas (contrato de la IA enemiga)
    this.scrap = 0;
    this.activeBoss = null;
    this.bossesDefeated = 0;
    this.playerDownTimer = 0;
    this.unsubscribers = [];
  }

  init(ctx) {
    this.cleanup();

    this.coreMachine = new CoreMachine(ctx.scene, ctx.worldPhysics, ctx.vfx);
    this.pathSystem = new PathSystem(ctx.scene, ctx.worldPhysics);
    this.spawnPointSystem = new SpawnPointSystem(ctx.scene, ctx.worldPhysics, ctx.vfx);
    this.waveManager = new WaveManager(
      ctx.enemyPool,
      this.pathSystem,
      this.spawnPointSystem,
      ctx.worldPhysics
    );
    this.extraStructures = [];
    this.scrap = CORE_DEFENSE_CONFIG.SCRAP.startingScrap;
    this.turretSystem = new TurretSystem(
      ctx.scene,
      ctx.worldPhysics,
      this.extraStructures,
      this
    );
    this.activeBoss = null;
    this.bossesDefeated = 0;
    this.playerDownTimer = 0;

    // Colocar al jugador frente al Núcleo, fuera de su radio de colisión sólida
    const startPos = CORE_DEFENSE_CONFIG.CORE.playerStartPos;
    const gy = ctx.worldPhysics.getGroundHeight(startPos.x, startPos.z, 0);
    ctx.playerGroup.position.set(startPos.x, gy, startPos.z);

    ctx.scene.fog.color.setHex(0x040604);
    ctx.scene.fog.density = 0.035;
    ctx.ambientLight.color.setHex(0x212b20);
    document.body.classList.remove('endgame-mode');
    AudioSys.setEndgameDrone(false);

    // Suscripciones a eventos del Núcleo y las Oleadas
    this.unsubscribers.push(
      GameEvents.on('core:damaged', payload => {
        ctx.onCoreDamaged(payload);
      }),
      GameEvents.on('core:alert_under_attack', payload => {
        ctx.onCoreUnderAttackAlert(payload);
      }),
      GameEvents.on('core:destroyed', () => {
        this.handleCoreDestroyed(ctx);
      }),
      GameEvents.on('wave:started', payload => {
        ctx.onWaveStarted(payload);
      }),
      GameEvents.on('wave:completed', payload => {
        const healAmt = CORE_DEFENSE_CONFIG.WAVES.coreHealPerWaveCompleted || 0;
        if (healAmt > 0 && this.coreMachine && !this.coreMachine.destroyed) {
          this.coreMachine.heal(healAmt);
        }
        this.addScrap(CORE_DEFENSE_CONFIG.SCRAP.waveCompletionBonus || 0);
        ctx.onWaveCompleted(payload);
      }),
      GameEvents.on('defense:victory', payload => {
        this.handleVictory(ctx, payload);
      })
    );

    if (ctx.tutorialRequested) {
      this.tutorial = new TowerDefenseTutorial(this, ctx);
      this.tutorialActive = true;
    }
  }

  getHudConfig() {
    return {
      modeId: 'core_defense',
      showTimerAsPrimary: false,
      showCoreBar: true,
      showWaveCounter: true,
      showCoreDirectionMarker: true,
      objectiveHeader: this.meta.objectiveTitle
    };
  }

  handleCoreDestroyed(ctx) {
    ctx.triggerScare(0.75);
    ctx.triggerRunEnd({
      victory: false,
      modeId: 'core_defense',
      title: 'COLAPSO DEL NÚCLEO',
      cause: 'CAUSA: DESTRUCCIÓN DEL REACTOR BIOMECÁNICO CENTRAL',
      wavesCompleted: this.waveManager ? this.waveManager.wavesCompleted : 0,
      currentWave: this.waveManager ? this.waveManager.currentWaveNumber : 1,
      totalWaves: this.waveManager ? this.waveManager.totalWaves : 12,
      coreHpLeft: 0,
      coreMaxHp: this.coreMachine ? this.coreMachine.maxHp : 1500,
      bossesDefeated: this.bossesDefeated
    });
  }

  handleVictory(ctx, payload) {
    AudioSys.playUISelect();
    ctx.addRunSouls(25); // Bonificación por defender el núcleo con éxito
    ctx.triggerRunEnd({
      victory: true,
      modeId: 'core_defense',
      title: 'NÚCLEO ASEGURADO',
      cause: 'PROTOCOLO DE CONTENCIÓN COMPLETADO // REACTOR ESTABILIZADO',
      wavesCompleted: payload.wavesCompleted,
      currentWave: payload.wavesCompleted,
      totalWaves: payload.totalWaves,
      coreHpLeft: this.coreMachine ? Math.ceil(this.coreMachine.hp) : 0,
      coreMaxHp: this.coreMachine ? this.coreMachine.maxHp : 1500,
      bossesDefeated: this.bossesDefeated
    });
  }

  update(dt, ctx) {
    const {
      playerGroup,
      camera,
      camFwd,
      worldPhysics,
      enemyPool,
      bossHazards,
      bossProjectiles,
      gameTime
    } = ctx;

    // Gestión de abatimiento temporal del jugador en modo Defensa
    let playerAlive = true;
    if (this.playerDownTimer > 0) {
      playerAlive = false;
      this.playerDownTimer -= dt;
      if (this.playerDownTimer <= 0) {
        const startPos = CORE_DEFENSE_CONFIG.CORE.playerStartPos;
        const gy = worldPhysics.getGroundHeight(startPos.x, startPos.z, 0);
        playerGroup.position.set(startPos.x, gy, startPos.z);
        ctx.revivePlayerAfterPenalty(CORE_DEFENSE_CONFIG.PLAYER_DEATH_POLICY.respawnInvulnSec);
      }
    }

    if (this.coreMachine) this.coreMachine.update(dt, camera.position);
    if (this.pathSystem) this.pathSystem.update(dt);
    if (this.spawnPointSystem) this.spawnPointSystem.update(dt);
    if (this.turretSystem) this.turretSystem.update(dt, ctx);

    if (this.tutorialActive && this.tutorial) {
      this.tutorial.update(dt, ctx);
    }

    if (this.waveManager && !this.tutorialActive) {
      this.waveManager.update(dt, playerGroup.position, gameTime, camFwd, (boss, bossCfg) => {
        this.activeBoss = boss;
        AudioSys.playBossHorn();
        ctx.triggerScare(0.45);
        ctx.setActiveBoss(boss, bossCfg);
      });
    }

    const activeEnemies = enemyPool.active;
    for (let i = activeEnemies.length - 1; i >= 0; i--) {
      const e = activeEnemies[i];
      const finishedDeath = e.update(dt, playerGroup.position, camFwd, camera.position, worldPhysics, {
        playerAlive,
        coreMachine: this.coreMachine,
        extraStructures: this.extraStructures,
        pathSystem: this.pathSystem,
        vfxList: ctx.vfx,
        onScare: () => ctx.triggerScare(0.32),
        onDealDamage: attacker => {
          if (playerAlive) ctx.dealDamageToPlayer(attacker.dmg);
        },
        onBurnTick: (burningEnemy, burnDmg) => ctx.damageEnemy(burningEnemy, burnDmg, null, true),
        onBossPhaseChange: () => ctx.onBossPhaseChange(),
        onBossSpecial: (boss, atkType) => {
          // Si el Boss está atacando al Núcleo, sus ataques de área también dañan al Núcleo
          const targetPos = boss.defenseAI?.targetKind === 'player'
            ? playerGroup.position
            : (this.coreMachine ? this.coreMachine.position : playerGroup.position);

          triggerBossSpecialAttack(
            ctx.scene,
            boss,
            atkType,
            targetPos,
            worldPhysics,
            bossHazards,
            bossProjectiles,
            count => {
              if (this.waveManager) {
                this.waveManager.spawnBossMinions(boss, count, playerGroup.position, gameTime, camFwd);
              }
            }
          );
        }
      });

      if (finishedDeath) {
        enemyPool.release(i);
      }
    }
  }

  onEnemyKilled(enemy, ctx) {
    const scrapCfg = CORE_DEFENSE_CONFIG.SCRAP;

    if (enemy.isBoss) {
      this.bossesDefeated++;
      this.activeBoss = null;
      ctx.addRunSouls(enemy.bossData.teethReward || 15);
      ctx.spawnLorePickup(enemy.group.position, 'chest');

      // Los bosses sueltan un caché de chatarra repartido alrededor
      const chunks = 5;
      const valueEach = Math.max(1, Math.round((scrapCfg.bossDropValue || 15) / chunks));
      for (let i = 0; i < chunks; i++) {
        const ang = (i / chunks) * Math.PI * 2;
        const r = 1.2 + Math.random() * 1.2;
        const pos = enemy.group.position.clone().add(
          new THREE.Vector3(Math.cos(ang) * r, 0, Math.sin(ang) * r)
        );
        ctx.spawnLorePickup(pos, 'scrap', valueEach);
      }
    } else {
      const isTooth = Math.random() < 0.28;
      ctx.spawnLorePickup(enemy.group.position, isTooth ? 'tooth' : 'serum');

      if (Math.random() < (scrapCfg.normalDropChance || 0)) {
        ctx.spawnLorePickup(enemy.group.position, 'scrap', scrapCfg.normalDropValue || 1);
      }
    }
  }

  // --------------------------------------------------------------------------
  // ECONOMÍA Y TORRETAS (CHATARRA)
  // --------------------------------------------------------------------------

  addScrap(amount) {
    if (!amount || amount <= 0) return;
    this.scrap += amount;
  }

  spendScrap(amount) {
    if (!amount || amount <= 0) return true;
    if (this.scrap < amount) return false;
    this.scrap -= amount;
    return true;
  }

  getScrap() {
    return this.scrap;
  }

  getNearbyTurret(playerPos) {
    if (!this.turretSystem) return null;
    return this.turretSystem.findNearbyTurret(playerPos);
  }

  getTurretById(turretId) {
    if (!this.turretSystem) return null;
    return this.turretSystem.getTurretById(turretId);
  }

  beginTurretPlacement(typeId) {
    if (!this.turretSystem) return false;
    return this.turretSystem.beginPlacement(typeId);
  }

  isTurretPlacementActive() {
    return !!(this.turretSystem && this.turretSystem.isPlacing());
  }

  confirmTurretPlacement() {
    if (!this.turretSystem) return false;
    return this.turretSystem.confirmPlacement();
  }

  cancelTurretPlacement() {
    if (!this.turretSystem) return;
    this.turretSystem.cancelPlacement();
  }

  getPlacementState() {
    if (!this.turretSystem) return null;
    return this.turretSystem.getPlacementState();
  }

  upgradeTurret(turretId, pathIndex) {
    if (!this.turretSystem) return false;
    return this.turretSystem.upgradeTurret(turretId, pathIndex);
  }

  sellTurret(turretId) {
    if (!this.turretSystem) return 0;
    return this.turretSystem.sellTurret(turretId);
  }

  handleTutorialKey(key) {
    if (!this.tutorial || !this.tutorialActive) return false;
    return this.tutorial.handleKey(key);
  }

  onPlayerLethalDamage(ctx) {
    const policy = CORE_DEFENSE_CONFIG.PLAYER_DEATH_POLICY;
    if (policy.mode === 'instant_defeat') {
      ctx.triggerRunEnd({
        victory: false,
        modeId: 'core_defense',
        title: 'DEFENSOR ABATIDO',
        cause: 'CAUSA: EL OPERARIO CAYÓ DEJANDO EL NÚCLEO DESPROTEGIDO',
        wavesCompleted: this.waveManager ? this.waveManager.wavesCompleted : 0,
        currentWave: this.waveManager ? this.waveManager.currentWaveNumber : 1,
        totalWaves: this.waveManager ? this.waveManager.totalWaves : 12,
        coreHpLeft: this.coreMachine ? Math.ceil(this.coreMachine.hp) : 0,
        coreMaxHp: this.coreMachine ? this.coreMachine.maxHp : 1500,
        bossesDefeated: this.bossesDefeated
      });
      return true;
    }

    // Reconstrucción de emergencia: el jugador queda abatido unos segundos, los enemigos que
    // lo perseguían vuelven a la ruta hacia el Núcleo, y el Núcleo sufre una sobrecarga.
    this.playerDownTimer = policy.respawnDelaySec;
    if (this.coreMachine && !this.coreMachine.destroyed) {
      this.coreMachine.takeDamage(policy.coreHpPenaltyOnRespawn, null);
    }
    ctx.notifyPlayerEmergencyRespawn(policy.respawnDelaySec, policy.coreHpPenaltyOnRespawn);
    return false;
  }

  getHudTelemetry(ctx = null) {
    const wm = this.waveManager;
    const remaining = wm ? wm.getRemainingHostilesCount() : 0;
    const waveNum = wm ? wm.currentWaveNumber : 1;
    const totalW = wm ? wm.totalWaves : 12;

    let subTaskText = `HOSTILES RESTANTES: ${remaining}`;
    if (this.tutorialActive) {
      subTaskText = 'TUTORIAL INTERACTIVO EN CURSO';
    } else if (wm && wm.state === 'PREP') {
      subTaskText = `PRÓXIMA OLEADA EN: ${wm.prepTimer.toFixed(1)}S`;
    } else if (this.playerDownTimer > 0) {
      subTaskText = `RECONSTRUYENDO OPERARIO: ${this.playerDownTimer.toFixed(1)}S`;
    }

    const coreHp = this.coreMachine ? Math.ceil(this.coreMachine.hp) : 0;
    const coreMax = this.coreMachine ? this.coreMachine.maxHp : 1500;
    const stateLabel = this.coreMachine ? this.coreMachine.currentDamageState.label : 'ESTABLE';
    const nearbyTurret = ctx && ctx.playerGroup && this.turretSystem
      ? this.turretSystem.findNearbyTurret(ctx.playerGroup.position)
      : null;
    const placement = this.getPlacementState();

    return {
      objectiveText: `Protege el Núcleo (${stateLabel})`,
      objectiveCheck: coreHp < coreMax * 0.45 ? '[!]' : '[ ]',
      subTaskText,
      waveBadgeText: `OLEADA ${waveNum} / ${totalW}`,
      remainingEnemies: remaining,
      waveNumber: waveNum,
      totalWaves: totalW,
      coreHp,
      coreMaxHp: coreMax,
      coreRatio: coreHp / Math.max(1, coreMax),
      coreStateLabel: stateLabel,
      corePosition: this.coreMachine ? this.coreMachine.position : null,
      spawnPoints: this.spawnPointSystem ? this.spawnPointSystem.getAllSpawnPoints() : [],
      bossesDefeated: this.bossesDefeated,
      totalBosses: 5,
      scrap: this.scrap,
      turretCount: this.turretSystem ? this.turretSystem.getTurretCount() : 0,
      turretMax: this.turretSystem ? this.turretSystem.getMaxTurretCount() : 0,
      nearbyTurret: nearbyTurret ? {
        id: nearbyTurret.id,
        name: nearbyTurret.cfg.name
      } : null,
      placement: placement ? {
        active: placement.active,
        typeId: placement.typeId,
        typeName: placement.typeName,
        cost: placement.cost,
        valid: placement.valid,
        reason: placement.reason
      } : null
    };
  }

  cleanup() {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers.length = 0;

    if (this.tutorial) {
      this.tutorial.destroy();
      this.tutorial = null;
    }
    this.tutorialActive = false;

    if (this.coreMachine) {
      this.coreMachine.destroy();
      this.coreMachine = null;
    }
    if (this.pathSystem) {
      this.pathSystem.destroy();
      this.pathSystem = null;
    }
    if (this.spawnPointSystem) {
      this.spawnPointSystem.destroy();
      this.spawnPointSystem = null;
    }
    if (this.turretSystem) {
      this.turretSystem.destroy();
      this.turretSystem = null;
    }
    this.extraStructures.forEach(st => st.destroy());
    this.extraStructures.length = 0;
    this.scrap = 0;
    this.waveManager = null;
    this.activeBoss = null;
    this.playerDownTimer = 0;
  }
}