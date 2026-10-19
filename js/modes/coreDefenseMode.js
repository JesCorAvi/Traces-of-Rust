import * as THREE from 'three';
import { MODES_CONFIG, CORE_DEFENSE_CONFIG } from '../config.js';
import { AudioSys } from '../audio.js';
import { triggerBossSpecialAttack } from '../combat.js';
import { GameEvents } from '../core/eventBus.js';
import { CoreMachine } from '../defense/coreMachine.js';
import { PathSystem } from '../defense/pathSystem.js';
import { SpawnPointSystem } from '../defense/spawnPointSystem.js';
import { WaveManager } from '../defense/waveManager.js';

// ============================================================================
// MODO 2: DEFENDER EL NÚCLEO (Base de Tower Defense sin torres por ahora)
// ============================================================================

export class CoreDefenseMode {
  constructor() {
    this.id = 'core_defense';
    this.meta = MODES_CONFIG.CATALOG.core_defense;
    this.coreMachine = null;
    this.pathSystem = null;
    this.spawnPointSystem = null;
    this.waveManager = null;
    this.extraStructures = []; // Lista preparada para futuras torres defensivas
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
        ctx.onWaveCompleted(payload);
      }),
      GameEvents.on('defense:victory', payload => {
        this.handleVictory(ctx, payload);
      })
    );
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

    if (this.waveManager) {
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
    if (enemy.isBoss) {
      this.bossesDefeated++;
      this.activeBoss = null;
      ctx.addRunSouls(enemy.bossData.teethReward || 15);
      ctx.spawnLorePickup(enemy.group.position, 'chest');
    } else {
      const isTooth = Math.random() < 0.28;
      ctx.spawnLorePickup(enemy.group.position, isTooth ? 'tooth' : 'serum');
    }
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

  getHudTelemetry() {
    const wm = this.waveManager;
    const remaining = wm ? wm.getRemainingHostilesCount() : 0;
    const waveNum = wm ? wm.currentWaveNumber : 1;
    const totalW = wm ? wm.totalWaves : 12;

    let subTaskText = `HOSTILES RESTANTES: ${remaining}`;
    if (wm && wm.state === 'PREP') {
      subTaskText = `PRÓXIMA OLEADA EN: ${wm.prepTimer.toFixed(1)}S`;
    } else if (this.playerDownTimer > 0) {
      subTaskText = `RECONSTRUYENDO OPERARIO: ${this.playerDownTimer.toFixed(1)}S`;
    }

    const coreHp = this.coreMachine ? Math.ceil(this.coreMachine.hp) : 0;
    const coreMax = this.coreMachine ? this.coreMachine.maxHp : 1500;
    const stateLabel = this.coreMachine ? this.coreMachine.currentDamageState.label : 'ESTABLE';

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
      totalBosses: 5
    };
  }

  cleanup() {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers.length = 0;

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
    this.extraStructures.forEach(st => st.destroy());
    this.extraStructures.length = 0;
    this.waveManager = null;
    this.activeBoss = null;
    this.playerDownTimer = 0;
  }
}