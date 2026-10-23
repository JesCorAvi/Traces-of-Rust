// Modo Supervivencia: bosses programados, spawns continuos y fase final.
// Exports: SurvivalMode.
import * as THREE from 'three';
import { CONFIG, MODES_CONFIG } from '../config.js';
import { AudioSys } from '../audio.js';
import { triggerBossSpecialAttack, spawnEnemyProjectile } from '../combat.js';
import { GameEvents } from '../core/eventBus.js';
import { updateEnemies } from './enemyLoop.js';

function pickExtraEnemyType(gameTime, isEndgame) {
  const cfg = MODES_CONFIG.SURVIVAL;
  const chance = isEndgame ? cfg.ENDGAME_EXTRA_SPAWN_CHANCE : cfg.EXTRA_SPAWN_CHANCE;
  if (!chance || Math.random() > chance) return null;

  const eligible = (cfg.EXTRA_ENEMY_SPAWNS || []).filter(entry => gameTime >= entry.after);
  if (eligible.length === 0) return null;

  let total = 0;
  for (const entry of eligible) total += Math.max(0, entry.weight || 0);
  if (total <= 0) return null;

  let roll = Math.random() * total;
  for (const entry of eligible) {
    roll -= Math.max(0, entry.weight || 0);
    if (roll <= 0) return entry.type;
  }
  return eligible[eligible.length - 1].type;
}

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
    ctx.scene.fog.color.setHex(0xf6aa8b);
    ctx.scene.fog.density = 0.0042;
    ctx.ambientLight.color.setHex(0xffc8a2);
    document.body.classList.remove('endgame-mode');
    AudioSys.setEndgameDrone(false);
    AudioSys.setBossMusic(false);
    AudioSys.setMusicState('COMBAT');
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
    AudioSys.setBossMusic(true);
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
    ctx.scene.fog.color.setHex(0x6f2638);
    ctx.scene.fog.density = 0.014;
    ctx.ambientLight.color.setHex(0x6a2934);
    AudioSys.setEndgameDrone(true);
    AudioSys.setMusicState('CLIMAX');
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

    // 3. Actualización de todos los cangrejos activos en la piscina
    const isNetworkClient = !!(ctx.net?.isMatchActive && !ctx.net.isHost());
    const playerTargets = (!isNetworkClient && ctx.net?.isMatchActive && typeof ctx.net.getPlayerTargets === 'function')
      ? ctx.net.getPlayerTargets(playerGroup.position, true)
      : null;

    const callbacks = {
      playerAlive: ctx.playerAlive !== false,
      playerTargets,
      vfxList: ctx.vfx,
      bossHazards,
      bossProjectiles,
      onScare: () => ctx.triggerScare(0.35),
      onDealDamage: attacker => {
        if (ctx.playerAlive !== false && attacker.netTargetIsLocal !== false) {
          ctx.dealDamageToPlayer(attacker.dmg);
        }
      },
      onBurnTick: (burningEnemy, burnDmg) => ctx.damageEnemy(
        burningEnemy, burnDmg, null, true,
        { visualOnly: isNetworkClient }
      ),
      onBossPhaseChange: () => ctx.onBossPhaseChange(),
      onCamShake: amount => ctx.addCamShake?.(amount)
    };

    if (!isNetworkClient) {
      callbacks.onShootProjectile = (origin, dir, speed, dmg) => {
        spawnEnemyProjectile(ctx.scene, bossProjectiles, origin, dir, speed, dmg);
        AudioSys.play(380, 0.12, 'sawtooth', 0.05);
      };
      callbacks.onBossSpecial = (boss, atkType, targetPos = playerGroup.position) => {
        return triggerBossSpecialAttack(
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

      callbacks.onNestSpawn = nest => {
        const child = enemyPool.spawn('worm', nest.group.position, gameTime, camFwd, worldPhysics);
        if (!child) return;
        const sx = nest.group.position.x + (Math.random() - 0.5) * 1.8;
        const sz = nest.group.position.z + (Math.random() - 0.5) * 1.8;
        const sy = worldPhysics ? worldPhysics.getGroundHeight(sx, sz, nest.group.position.y) : nest.group.position.y;
        child.group.position.set(sx, sy, sz);
      };

      callbacks.onRegeneratorPulse = regenerator => {
        const radius = regenerator.healPulseRadius || 5;
        const amount = regenerator.healPulseAmount || 12;
        for (const ally of enemyPool.active) {
          if (!ally.active || ally.state === 'dead' || ally.hp >= ally.maxHp) continue;
          const dx = ally.group.position.x - regenerator.group.position.x;
          const dz = ally.group.position.z - regenerator.group.position.z;
          if (Math.hypot(dx, dz) > radius) continue;
          ally.hp = Math.min(ally.maxHp, ally.hp + amount);
        }
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.4, radius, 24),
          new THREE.MeshBasicMaterial({
            color: 0x7f9f5a, transparent: true, opacity: 0.4,
            side: THREE.DoubleSide, depthWrite: false
          })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(regenerator.group.position.x, regenerator.group.position.y + 0.06, regenerator.group.position.z);
        ctx.scene.add(ring);
        ctx.vfx.push({ mesh: ring, disposeGeo: true, disposeMat: true, life: 0.35, maxLife: 0.35, fade: true });
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
        const baseType = gameTime > 90 && r > 0.88 ? 'weeper' : gameTime > 15 && r < 0.32 ? 'worm' : 'zombie';
        const type = pickExtraEnemyType(gameTime, false) || baseType;
        enemyPool.spawn(type, playerGroup.position, gameTime, camFwd, worldPhysics);
      } else {
        this.spawnTimer = 0.12;
        for (let b = 0; b < CONFIG.DIFFICULTY.ENDGAME_SPAWN_BURST; b++) {
          const r = Math.random();
          const baseType = r > 0.78 ? 'weeper' : r < 0.3 ? 'worm' : 'zombie';
          const type = pickExtraEnemyType(gameTime, true) || baseType;
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
      if (enemy.type === 'splitter') {
        for (let i = 0; i < (enemy.splitCount || 2); i++) {
          const child = ctx.enemyPool.spawn(
            enemy.splitType || 'worm',
            enemy.group.position,
            ctx.gameTime,
            ctx.camFwd,
            ctx.worldPhysics
          );
          if (!child) continue;
          const sx = enemy.group.position.x + (Math.random() - 0.5) * 1.8;
          const sz = enemy.group.position.z + (Math.random() - 0.5) * 1.8;
          const sy = ctx.worldPhysics
            ? ctx.worldPhysics.getGroundHeight(sx, sz, enemy.group.position.y)
            : enemy.group.position.y;
          child.group.position.set(sx, sy, sz);
          child.isSplitChild = true;
          child.hp = Math.max(1, child.hp * 0.5);
          child.maxHp = child.hp;
          child.dmg *= 0.6;
        }
      }

      // Las crías no repiten el botín completo del padre.
      const dropChance = enemy.isSplitChild ? 0.2 : 0.26;
      const isTooth = Math.random() < dropChance;
      if (!enemy.isSplitChild || isTooth) {
        const drop = ctx.spawnLorePickup(enemy.group.position, isTooth ? 'tooth' : 'serum');
        if (drop) enemy._networkDrop = { type: drop.type, pickupNetId: drop.pickupNetId };
      }
    }
  }

  onPlayerLethalDamage(ctx) {
    // En Supervivencia, llegar a 0 HP termina inmediatamente la partida
    ctx.triggerRunEnd({
      victory: false,
      modeId: 'survival',
      title: 'SOCORRISTA AGOTADO',
      cause: 'CAUSA: LA MAREA DE CANGREJOS TE ALCANZÓ',
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