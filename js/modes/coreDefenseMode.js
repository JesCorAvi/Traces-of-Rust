// Modo Defender el Núcleo: sistemas de defensa, oleadas, economía y torretas.
// Exports: CoreDefenseMode.
import * as THREE from 'three';
import { MODES_CONFIG, CORE_DEFENSE_CONFIG } from '../config.js';
import { AudioSys } from '../audio.js';
import { triggerBossSpecialAttack, spawnEnemyProjectile } from '../combat.js';
import { GameEvents } from '../core/eventBus.js';
import { generateProceduralMap, DIFFICULTIES } from '../defense/mapGenerator.js';
import { ExitPointSystem } from '../defense/exitPointSystem.js';
import { PathSystem } from '../defense/pathSystem.js';
import { SpawnPointSystem } from '../defense/spawnPointSystem.js';
import { WaveManager } from '../defense/waveManager.js';
import { TurretSystem } from '../defense/turretSystem.js';
import { TowerDefenseTutorial } from '../tutorial/towerDefenseTutorial.js';
import { DefenseEventManager } from '../defense/defenseEventManager.js';
import { updateEnemies } from './enemyLoop.js';

// ============================================================================
// MODO 2: DEFENDER LAS INSTALACIONES (Tower Defense estilo Bloons TD 6)
// ============================================================================

export class CoreDefenseMode {
  constructor() {
    this.id = 'core_defense';
    this.meta = MODES_CONFIG.CATALOG.core_defense;
    this.coreMachine = null;
    this.pathSystem = null;
    this.spawnPointSystem = null;
    this.exitPointSystem = null;
    this.waveManager = null;
    this.turretSystem = null;
    this.defenseEventManager = null;
    this.tutorial = null;
    this.tutorialActive = false;
    this.extraStructures = []; // Tropas aliadas (los enemigos ya no atacan torretas)
    this.scrap = 0;
    this.activeBoss = null;
    this.bossesDefeated = 0;
    this.playerDownTimer = 0;
    this.difficulty = 'normal';
    this.lives = 100;
    this.maxLives = 100;
    this.mapData = null;
    this.spawnPoints = [];
    this.exitPoints = [];
    this.unsubscribers = [];
  }

  init(ctx) {
    this.cleanup();

    this.difficulty = localStorage.getItem('traces_td_difficulty') || 'normal';
    this.mapId = localStorage.getItem('traces_td_selected_map') || null;
    this.mapData = generateProceduralMap(this.difficulty, ctx.worldPhysics, this.mapId);
    this.mapId = this.mapData.mapId;
    this.lives = this.mapData.maxLives;
    this.maxLives = this.mapData.maxLives;
    this.scrap = this.mapData.startingScrap;
    this.spawnPoints = this.mapData.spawnPoints;
    this.exitPoints = this.mapData.exitPoints;

    // Sistema de contención global (vidas estilo Bloons TD 6)
    this.coreMachine = {
      hp: this.lives,
      maxHp: this.maxLives,
      position: new THREE.Vector3(0, 0, 0),
      hasPhysicalCore: false,
      collisionRadius: 0,
      attackStopDistance: 1.5,
      active: true,
      destroyed: false,
      currentDamageState: { label: this.getDamageStateLabel() },
      getHpRatio: () => Math.max(0, Math.min(1, this.lives / Math.max(1, this.maxLives))),
      takeDamage: amt => {
        this.lives = Math.max(0, this.lives - amt);
        if (this.coreMachine) {
          this.coreMachine.hp = this.lives;
          this.coreMachine.currentDamageState = { label: this.getDamageStateLabel() };
        }
        ctx.onCoreDamaged?.({ hp: this.lives, maxHp: this.maxLives, dmg: amt });
        if (this.lives <= 0) this.handleBreachDefeat(ctx);
      },
      heal: amt => {
        this.lives = Math.min(this.maxLives, this.lives + amt);
        if (this.coreMachine) {
          this.coreMachine.hp = this.lives;
          this.coreMachine.currentDamageState = { label: this.getDamageStateLabel() };
        }
      },
      applyShield: () => {},
      update: () => {},
      destroy: () => {}
    };

    this.pathSystem = new PathSystem(ctx.scene, ctx.worldPhysics, this.mapData.routes);
    this.spawnPointSystem = new SpawnPointSystem(ctx.scene, ctx.worldPhysics, ctx.vfx, this.mapData.spawnPoints);
    this.exitPointSystem = new ExitPointSystem(ctx.scene, ctx.worldPhysics, ctx.vfx, this.mapData.exitPoints);
    this.waveManager = new WaveManager(
      ctx.enemyPool,
      this.pathSystem,
      this.spawnPointSystem,
      ctx.worldPhysics
    );
    this.extraStructures = [];
    this.turretSystem = new TurretSystem(
      ctx.scene,
      ctx.worldPhysics,
      this.extraStructures,
      this
    );
    this.defenseEventManager = new DefenseEventManager(
      ctx.scene,
      ctx.worldPhysics,
      ctx.enemyPool,
      this,
      ctx.ambientLight
    );
    this.activeBoss = null;
    this.bossesDefeated = 0;
    this.playerDownTimer = 0;

    // Posición inicial del jugador en el centro del complejo
    const startPos = this.mapData.playerStartPos || { x: 0, y: 0, z: 0 };
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
      }),
      GameEvents.on('defense:special_event_triggered', payload => {
        if (this.defenseEventManager) {
          this.defenseEventManager.startEvent(payload.eventType);
        }
        ctx.onCoreUnderAttackAlert?.('¡EVENTO DE EMERGENCIA DETECTADO! // OLEADAS EN PAUSA');
        ctx.triggerScare?.(0.32);
      }),
      GameEvents.on('defense:event_completed', payload => {
        ctx.onCoreUnderAttackAlert?.(`¡${payload.title}! +${payload.scrapReward} CHATARRA`);
        AudioSys.playUISelect();
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
      showCoreDirectionMarker: false,
      objectiveHeader: this.meta.objectiveTitle
    };
  }

  getDamageStateLabel() {
    const ratio = this.lives / Math.max(1, this.maxLives);
    if (ratio <= 0.25) return 'CRÍTICO';
    if (ratio <= 0.5) return 'ALERTA';
    return 'ESTABLE';
  }

  handleEnemyLeak(enemy, ctx) {
    if (this.lives <= 0) return;
    const leakLives = enemy.isBoss ? 20 : (enemy.type === 'weeper' ? 3 : enemy.type === 'worm' ? 2 : 1);
    this.lives = Math.max(0, this.lives - leakLives);
    if (this.coreMachine) {
      this.coreMachine.hp = this.lives;
      this.coreMachine.currentDamageState = { label: this.getDamageStateLabel() };
    }

    AudioSys.play(180, 0.28, 'sawtooth', 0.12);
    AudioSys.play(240, 0.22, 'square', 0.08);

    const ep = this.exitPointSystem ? this.exitPointSystem.getExitPointByPath(enemy.defenseAI?.routeId) : null;
    if (ep && this.exitPointSystem) {
      this.exitPointSystem.triggerLeakEffect(ep.id);
    }

    ctx.onCoreDamaged?.({ hp: this.lives, maxHp: this.maxLives, dmg: leakLives });
    ctx.onCoreUnderAttackAlert?.(`¡FUGA DETECTADA! -${leakLives} ${leakLives === 1 ? 'VIDA' : 'VIDAS'}`);
    ctx.triggerScare?.(0.25);

    if (this.lives <= 0) {
      this.handleBreachDefeat(ctx);
    }
  }

  recordMapProgress(victory, waves) {
    if (!this.mapId) return;
    try {
      const records = JSON.parse(localStorage.getItem('traces_td_map_records') || '{}');
      const prev = records[this.mapId] || { completed: false, bestWave: 0 };
      records[this.mapId] = {
        completed: Boolean(prev.completed || victory),
        bestWave: Math.max(prev.bestWave || 0, waves || 0),
        lastPlayed: Date.now()
      };
      localStorage.setItem('traces_td_map_records', JSON.stringify(records));
    } catch (e) {
      // ignorar errores de localStorage
    }
  }

  handleBreachDefeat(ctx) {
    this.recordMapProgress(false, this.waveManager ? this.waveManager.wavesCompleted : 0);
    ctx.triggerScare(0.8);
    ctx.triggerRunEnd({
      victory: false,
      modeId: 'core_defense',
      mapId: this.mapId,
      mapName: this.mapData?.mapName || 'Sector Industrial',
      title: 'BRECHA DE CONTENCIÓN',
      cause: 'CAUSA: LOS HOSTILES ESCAPARON DE LAS INSTALACIONES Y DESBORDARON EL PERÍMETRO',
      wavesCompleted: this.waveManager ? this.waveManager.wavesCompleted : 0,
      currentWave: this.waveManager ? this.waveManager.currentWaveNumber : 1,
      totalWaves: this.waveManager ? this.waveManager.totalWaves : 12,
      coreHpLeft: 0,
      coreMaxHp: this.maxLives,
      bossesDefeated: this.bossesDefeated
    });
  }

  handleCoreDestroyed(ctx) {
    this.handleBreachDefeat(ctx);
  }

  handleVictory(ctx, payload) {
    this.recordMapProgress(true, payload.wavesCompleted);
    AudioSys.playUISelect();
    ctx.addRunSouls(35);
    const diffName = (DIFFICULTIES[this.difficulty] || DIFFICULTIES.normal).name;
    ctx.triggerRunEnd({
      victory: true,
      modeId: 'core_defense',
      mapId: this.mapId,
      mapName: this.mapData?.mapName || 'Sector Industrial',
      title: 'INSTALACIONES ASEGURADAS',
      cause: `PROTOCOLO DE CONTENCIÓN COMPLETADO // ${this.lives} VIDAS PRESERVADAS (${diffName})`,
      wavesCompleted: payload.wavesCompleted,
      currentWave: payload.wavesCompleted,
      totalWaves: payload.totalWaves,
      coreHpLeft: this.lives,
      coreMaxHp: this.maxLives,
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
        const startPos = this.mapData?.playerStartPos || { x: 0, y: 0, z: 0 };
        const gy = worldPhysics.getGroundHeight(startPos.x, startPos.z, 0);
        playerGroup.position.set(startPos.x, gy, startPos.z);
        ctx.revivePlayerAfterPenalty(CORE_DEFENSE_CONFIG.PLAYER_DEATH_POLICY.respawnInvulnSec);
      }
    }

    const isPrep = !!(this.waveManager && !this.tutorialActive && this.waveManager.state === 'PREP');
    if (this.coreMachine) this.coreMachine.update(dt, camera.position);
    if (this.pathSystem) this.pathSystem.update(dt, isPrep);
    if (this.spawnPointSystem) this.spawnPointSystem.update(dt);
    if (this.exitPointSystem) this.exitPointSystem.update(dt);
    if (this.turretSystem) this.turretSystem.update(dt, ctx);
    if (this.defenseEventManager) this.defenseEventManager.update(dt, ctx);

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

    const callbacks = {
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
      onShootProjectile: (origin, dir, speed, dmg) => {
        spawnEnemyProjectile(ctx.scene, bossProjectiles, origin, dir, speed, dmg);
        AudioSys.play(380, 0.12, 'sawtooth', 0.05);
      },
      onEnemyEscaped: enemy => {
        this.handleEnemyLeak(enemy, ctx);
      },
      onBossPhaseChange: () => ctx.onBossPhaseChange(),
      onBossSpecial: (boss, atkType) => {
        const targetPos = playerGroup.position;
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
    };
    updateEnemies(enemyPool, dt, playerGroup.position, camFwd, camera.position, worldPhysics, callbacks);
  }

  onEnemyKilled(enemy, ctx) {
    if (this.defenseEventManager) {
      this.defenseEventManager.onEnemyKilled(enemy);
    }
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

  canSkipPrep() {
    return !!(this.waveManager && !this.tutorialActive && this.waveManager.canSkipPrep());
  }

  skipPrep() {
    if (!this.canSkipPrep()) return false;
    AudioSys.playUISelect();
    return this.waveManager.skipPrep();
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
    const isPrep = !!(wm && !this.tutorialActive && wm.state === 'PREP');
    const isFirstWavePrep = isPrep && wm && wm.currentWaveIndex === 0;
    const prepSeconds = isPrep ? Math.max(0, wm.prepTimer) : 0;

    const eventInfo = this.defenseEventManager ? this.defenseEventManager.getActiveEventInfo() : null;

    let subTaskText = `HOSTILES RESTANTES: ${remaining}`;
    if (this.tutorialActive) {
      subTaskText = 'TUTORIAL INTERACTIVO EN CURSO';
    } else if (eventInfo) {
      subTaskText = eventInfo.subTaskText;
    } else if (isFirstWavePrep) {
      subTaskText = 'EXPLORACIÓN LIBRE // [F] INICIAR OLEADA 1';
    } else if (isPrep) {
      subTaskText = `PRÓXIMA OLEADA EN: ${prepSeconds.toFixed(1)}S · [F] SALTAR`;
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

    const diffMeta = DIFFICULTIES[this.difficulty] || DIFFICULTIES.normal;

    const eventAliveCount = eventInfo && this.defenseEventManager
      ? this.defenseEventManager.eventEnemies.filter(e => e.active && e.state !== 'dead').length
      : 0;

    return {
      objectiveText: eventInfo ? `[!] ${eventInfo.objectiveText}` : `Contén la brecha (${diffMeta.name})`,
      objectiveCheck: (eventInfo || this.lives < this.maxLives * 0.4) ? '[!]' : '[ ]',
      subTaskText,
      waveBadgeText: eventInfo ? `EVENTO // ${eventInfo.badgeText}` : (isFirstWavePrep ? 'EXPLORACIÓN // PREP. INICIAL' : (isPrep ? `PREPARACIÓN // OLEADA ${waveNum}/${totalW}` : `OLEADA ${waveNum} / ${totalW}`)),
      eventBadge: eventInfo ? eventInfo.badgeText : null,
      remainingEnemies: eventInfo ? eventAliveCount : remaining,
      waveNumber: waveNum,
      totalWaves: totalW,
      isPrep: isPrep && !eventInfo,
      isFirstWavePrep: isFirstWavePrep && !eventInfo,
      prepSeconds,
      canSkipPrep: isPrep && !eventInfo,
      coreHp: this.lives,
      coreMaxHp: this.maxLives,
      coreRatio: this.lives / Math.max(1, this.maxLives),
      coreStateLabel: stateLabel,
      corePosition: null,
      hasPhysicalCore: false,
      spawnPoints: this.spawnPoints || (this.spawnPointSystem ? this.spawnPointSystem.getAllSpawnPoints() : []),
      exitPoints: this.exitPoints || [],
      difficulty: this.difficulty,
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

    if (this.coreMachine && this.coreMachine.destroy) {
      this.coreMachine.destroy();
    }
    this.coreMachine = null;

    if (this.pathSystem) {
      this.pathSystem.destroy();
      this.pathSystem = null;
    }
    if (this.spawnPointSystem) {
      this.spawnPointSystem.destroy();
      this.spawnPointSystem = null;
    }
    if (this.exitPointSystem) {
      this.exitPointSystem.destroy();
      this.exitPointSystem = null;
    }
    if (this.turretSystem) {
      this.turretSystem.destroy();
      this.turretSystem = null;
    }
    if (this.defenseEventManager) {
      this.defenseEventManager.cleanup();
      this.defenseEventManager = null;
    }
    document.body.classList.remove('endgame-mode');
    AudioSys.setEndgameDrone(false);
    this.extraStructures.forEach(st => st.destroy());
    this.extraStructures.length = 0;
    this.scrap = 0;
    this.waveManager = null;
    this.activeBoss = null;
    this.playerDownTimer = 0;
    this.spawnPoints = [];
    this.exitPoints = [];
    this.mapData = null;
  }
}