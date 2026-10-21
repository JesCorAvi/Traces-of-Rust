// Modo Supervivencia: bosses programados, spawns continuos y fase final.
// Exports: SurvivalMode.
import * as THREE from 'three';
import { CONFIG, MODES_CONFIG } from '../config.js';
import { AudioSys } from '../audio.js';
import { triggerBossSpecialAttack, spawnEnemyProjectile } from '../combat.js';
import { GameEvents } from '../core/eventBus.js';
import { updateEnemies } from './enemyLoop.js';

// ============================================================================
// MODO 1: SUPERVIVENCIA (Comportamiento original 100% intacto)
// ============================================================================

export class SurvivalMode {
  constructor() {
    this.id = 'survival';
    this.meta = MODES_CONFIG.CATALOG.survival;
    this.spawnTimer = 0;
    this.nextBossIdx = 0;
    this.activeBoss = null;
    this.bossesDefeated = 0;
    this.isEndgame = false;
  }

  init(ctx) {
    this.spawnTimer = 0;
    this.nextBossIdx = 0;
    this.activeBoss = null;
    this.bossesDefeated = 0;
    this.isEndgame = false;

    ctx.playerGroup.position.set(0, 0, 0);
    ctx.scene.fog.color.setHex(0x040604);
    ctx.scene.fog.density = 0.038;
    ctx.ambientLight.color.setHex(0x1e281d);
    document.body.classList.remove('endgame-mode');
    AudioSys.setEndgameDrone(false);
  }

  getHudConfig() {
    return {
      modeId: 'survival',
      showTimerAsPrimary: true,
      showCoreBar: false,
      showWaveCounter: false,
      showCoreDirectionMarker: false,
      objectiveHeader: this.meta.objectiveTitle
    };
  }

  spawnScheduledBoss(bossCfg, camFwd, ctx) {
    AudioSys.playBossHorn();
    ctx.triggerScare(0.45);
    const boss = ctx.enemyPool.spawn(
      bossCfg.id,
      ctx.playerGroup.position,
      ctx.gameTime,
      camFwd,
      ctx.worldPhysics,
      bossCfg
    );
    if (!boss) return;
    this.activeBoss = boss;
    ctx.setActiveBoss(boss, bossCfg);
  }

  activateEndgamePhase(ctx) {
    this.isEndgame = true;
    document.body.classList.add('endgame-mode');
    ctx.scene.fog.color.setHex(0x160303);
    ctx.scene.fog.density = 0.058;
    ctx.ambientLight.color.setHex(0x3a0808);
    AudioSys.setEndgameDrone(true);
    AudioSys.playBossHorn();
    GameEvents.emit('survival:endgame_started', {});
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

    // 1. Calendario original de 5 Bosses (Cada 3 minutos: 03:00, 06:00, 09:00, 12:00, 15:00)
    if (this.nextBossIdx < CONFIG.BOSS_SCHEDULE.length) {
      const nextCfg = CONFIG.BOSS_SCHEDULE[this.nextBossIdx];
      if (gameTime >= nextCfg.time) {
        this.spawnScheduledBoss(nextCfg, camFwd, ctx);
        this.nextBossIdx++;
      }
    }

    // 2. Fase final a partir del minuto 15:00
    if (!this.isEndgame && gameTime >= CONFIG.DIFFICULTY.ENDGAME_START_TIME) {
      this.activateEndgamePhase(ctx);
    }

    // 3. Actualización de todos los enemigos activos en la piscina
    const isNetworkClient = !!(ctx.net?.isMatchActive && !ctx.net.isHost());
    const playerTargets = (!isNetworkClient && ctx.net?.isMatchActive && typeof ctx.net.getPlayerTargets === 'function')
      ? ctx.net.getPlayerTargets(playerGroup.position, true)
      : null;

    const callbacks = {
      playerAlive: true,
      playerTargets,
      onScare: () => ctx.triggerScare(0.35),
      onDealDamage: attacker => {
        if (attacker.netTargetIsLocal !== false) ctx.dealDamageToPlayer(attacker.dmg);
      },
      onBurnTick: (burningEnemy, burnDmg) => ctx.damageEnemy(
        burningEnemy, burnDmg, null, true,
        { visualOnly: isNetworkClient }
      ),
      onBossPhaseChange: () => ctx.onBossPhaseChange()
    };

    if (!isNetworkClient) {
      callbacks.onShootProjectile = (origin, dir, speed, dmg) => {
        spawnEnemyProjectile(ctx.scene, bossProjectiles, origin, dir, speed, dmg);
        AudioSys.play(380, 0.12, 'sawtooth', 0.05);
      };
      callbacks.onBossSpecial = (boss, atkType, targetPos = playerGroup.position) => {
        triggerBossSpecialAttack(
          ctx.scene,
          boss,
          atkType,
          targetPos,
          worldPhysics,
          bossHazards,
          bossProjectiles,
          count => {
            for (let s = 0; s < count; s++) {
              enemyPool.spawn(
                s % 2 === 0 ? 'zombie' : 'worm',
                targetPos,
                gameTime,
                camFwd,
                worldPhysics
              );
            }
          }
        );
      };
    }
    updateEnemies(enemyPool, dt, playerGroup.position, camFwd, camera.position, worldPhysics, callbacks);

    // 4. Sistema de aparición continua alrededor del jugador (Idéntico al original)
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      if (!this.isEndgame) {
        const progress = Math.min(1, gameTime / CONFIG.DIFFICULTY.ENDGAME_START_TIME);
        this.spawnTimer = Math.max(
          CONFIG.DIFFICULTY.MIN_NORMAL_INTERVAL,
          CONFIG.DIFFICULTY.BASE_SPAWN_INTERVAL - progress * 0.82
        );
        const r = Math.random();
        // El Weeper aparece solo en etapas más avanzadas y con menor probabilidad
        const type = gameTime > 90 && r > 0.88 ? 'weeper' : gameTime > 15 && r < 0.32 ? 'worm' : 'zombie';
        enemyPool.spawn(type, playerGroup.position, gameTime, camFwd, worldPhysics);
      } else {
        this.spawnTimer = 0.12;
        for (let b = 0; b < CONFIG.DIFFICULTY.ENDGAME_SPAWN_BURST; b++) {
          const r = Math.random();
          const type = r > 0.78 ? 'weeper' : r < 0.3 ? 'worm' : 'zombie';
          enemyPool.spawn(type, playerGroup.position, gameTime, camFwd, worldPhysics);
        }
      }
    }
  }

  onEnemyKilled(enemy, ctx) {
    if (enemy.isBoss) {
      this.bossesDefeated++;
      this.activeBoss = null;
      ctx.addRunSouls(enemy.bossData.teethReward || 15);
      const chestDrop = ctx.spawnLorePickup(enemy.group.position, 'chest');
      if (chestDrop) enemy._networkDrop = { type: 'chest', pickupNetId: chestDrop.pickupNetId };

      if (this.bossesDefeated >= CONFIG.BOSS_SCHEDULE.length && !this.isEndgame) {
        this.activateEndgamePhase(ctx);
      }
    } else {
      const isTooth = Math.random() < 0.26;
      const drop = ctx.spawnLorePickup(enemy.group.position, isTooth ? 'tooth' : 'serum');
      if (drop) enemy._networkDrop = { type: drop.type, pickupNetId: drop.pickupNetId };
    }
  }

  onPlayerLethalDamage(ctx) {
    // En Supervivencia, llegar a 0 HP termina inmediatamente la partida
    ctx.triggerRunEnd({
      victory: false,
      modeId: 'survival',
      title: 'PACIENTE EXPIRADO',
      cause: 'CAUSA: DESMEMBRAMIENTO EN PLANTA INDUSTRIAL',
      bossesDefeated: this.bossesDefeated,
      totalBosses: CONFIG.BOSS_SCHEDULE.length,
      isEndgame: this.isEndgame
    });
    return true;
  }

  getHudTelemetry(ctx) {
    let subTaskText = 'FASE FINAL ACTIVA';
    if (this.nextBossIdx < CONFIG.BOSS_SCHEDULE.length) {
      const nextCfg = CONFIG.BOSS_SCHEDULE[this.nextBossIdx];
      const rem = Math.max(0, nextCfg.time - ctx.gameTime);
      const bm = String(Math.floor(rem / 60)).padStart(2, '0');
      const bs = String(Math.floor(rem % 60)).padStart(2, '0');
      subTaskText = `PRÓX. JEFE: ${bm}:${bs}`;
    }

    let objDesc = this.meta.objectiveDefault;
    let chk = '[ ]';
    if (this.isEndgame) {
      objDesc = 'Sobrevive al Exterminio';
      chk = '[X]';
    } else if (this.activeBoss && this.activeBoss.active) {
      objDesc = `Amputa: ${this.activeBoss.bossData.name.replace('EL ', '').replace('LA ', '')}`;
      chk = '[!]';
    }

    return {
      objectiveText: objDesc,
      objectiveCheck: chk,
      subTaskText,
      waveBadgeText: this.isEndgame
        ? 'EXTERMINIO ACTIVO'
        : `AMENAZA: NIVEL ${1 + Math.floor(ctx.gameTime / 90)}`,
      bossesDefeated: this.bossesDefeated,
      totalBosses: CONFIG.BOSS_SCHEDULE.length
    };
  }

  cleanup() {
    this.activeBoss = null;
    document.body.classList.remove('endgame-mode');
  }
}