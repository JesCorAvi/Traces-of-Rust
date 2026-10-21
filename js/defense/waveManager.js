// Máquina de estados de oleadas, cola de spawns y escalado de dificultad.
// Exports: WaveManager.
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { CORE_DEFENSE_CONFIG } from '../config/coreDefenseConfig.js';
import { AudioSys } from '../audio.js';
import { GameEvents } from '../core/eventBus.js';

// ============================================================================
// SISTEMA DE OLEADAS PROGRESIVAS (Solo en Modo Defensa del Núcleo)
// ============================================================================

export class WaveManager {
  constructor(enemyPool, pathSystem, spawnPointSystem, worldPhysics) {
    this.enemyPool = enemyPool;
    this.pathSystem = pathSystem;
    this.spawnPointSystem = spawnPointSystem;
    this.worldPhysics = worldPhysics;
    this.cfg = CORE_DEFENSE_CONFIG.WAVES;

    this.currentWaveIndex = 0; // 0 = aún no iniciada la oleada 1
    this.totalWaves = this.cfg.totalWavesForVictory || this.cfg.SCHEDULE.length;
    this.state = 'PREP';       // 'PREP' | 'SPAWNING' | 'CLEARING' | 'VICTORY' | 'ENDGAME_SWARM'
    this.prepTimer = this.cfg.initialPrepTimeSec;
    this.spawnTimer = 0;
    this.spawnQueue = [];
    this.pendingBossCfg = null;
    this.activeRoutes = ['path_north'];
    this.wavesCompleted = 0;
    this.totalQueuedAtStart = 0;

    // En co-op online solo el Host decide transiciones de fase/oleada.
    this.isAuthority = true;
  }

  setAuthority(isAuthority) {
    this.isAuthority = !!isAuthority;
  }

  canSkipPrep() {
    return this.state === 'PREP';
  }

  skipPrep() {
    if (!this.canSkipPrep()) return false;
    // El cliente solicita el salto, pero el Host es quien arranca la oleada y
    // difunde el nuevo estado. El cliente lo aplica al recibir WAVE_STATE.
    if (!this.isAuthority) return true;
    this.prepTimer = 0;
    this.startNextWave();
    return true;
  }

  get currentWaveNumber() {
    return Math.max(1, this.currentWaveIndex);
  }

  getRemainingHostilesCount() {
    const aliveInWorld = this.enemyPool.active.filter(e => e.active && e.state !== 'dead').length;
    // En el Cliente la cola es solo informativa: los enemigos reales son los
    // replicados por el Host, así que no se suma para no duplicar el contador.
    if (!this.isAuthority) return aliveInWorld;
    const queuedCount = this.spawnQueue.length + (this.pendingBossCfg ? 1 : 0);
    return aliveInWorld + queuedCount;
  }

  getActiveRoutes(waveCfg = null) {
    if (this.pathSystem && this.pathSystem.routes.size > 0) {
      return Array.from(this.pathSystem.routes.keys());
    }
    return waveCfg?.routes && waveCfg.routes.length > 0 ? waveCfg.routes : ['path_north'];
  }

  buildWaveQueue(waveCfg) {
    const queue = [];
    const total = waveCfg.count;
    const comp = waveCfg.composition || { zombie: 1, worm: 0, weeper: 0 };
    const routes = this.getActiveRoutes(waveCfg);

    for (let i = 0; i < total; i++) {
      const r = Math.random();
      let type = 'zombie';
      if (r < comp.worm) {
        type = 'worm';
      } else if (r < comp.worm + comp.weeper) {
        type = 'weeper';
      }
      const routeId = routes[i % routes.length];
      queue.push({ type, routeId });
    }

    return queue;
  }

  startNextWave() {
    // Solo el Host genera la cola (Math.random local) y avanza la oleada.
    if (!this.isAuthority) return;
    this.currentWaveIndex++;
    const schedule = this.cfg.SCHEDULE;
    const waveCfg = schedule[Math.min(schedule.length - 1, this.currentWaveIndex - 1)];

    this.activeRoutes = this.getActiveRoutes(waveCfg);
    this.spawnQueue = this.buildWaveQueue(waveCfg);
    this.spawnInterval = waveCfg.interval || 1.0;
    this.spawnTimer = 0.25;
    this.state = 'SPAWNING';

    if (waveCfg.bossId) {
      this.pendingBossCfg = CONFIG.BOSS_SCHEDULE.find(b => b.id === waveCfg.bossId) || CONFIG.BOSS_SCHEDULE[0];
    } else {
      this.pendingBossCfg = null;
    }
    this.totalQueuedAtStart = this.spawnQueue.length + (this.pendingBossCfg ? 1 : 0);

    AudioSys.playWaveStart();

    GameEvents.emit('wave:started', {
      wave: this.currentWaveIndex,
      totalWaves: this.totalWaves,
      routes: this.activeRoutes,
      hasBoss: !!this.pendingBossCfg,
      bossName: this.pendingBossCfg ? this.pendingBossCfg.name : null,
      totalEnemies: this.spawnQueue.length + (this.pendingBossCfg ? 1 : 0)
    });
  }

  getWaveScalingMultipliers() {
    const w = Math.max(0, this.currentWaveIndex - 1);
    const baseMult = this.cfg.tdBaseHpMult || 2.8;
    return {
      hpMult: (1 + w * this.cfg.hpMultiplierPerWave) * baseMult,
      dmgMult: 1 + w * this.cfg.dmgMultiplierPerWave,
      spdMult: 1 + w * this.cfg.speedMultiplierPerWave
    };
  }

  spawnSingleFromQueue(playerPos, gameTime, playerFwd, onBossSpawned) {
    const scaling = this.getWaveScalingMultipliers();

    // Si hay un Boss asignado a esta oleada, aparece cuando queda la mitad de la cola
    if (this.pendingBossCfg && this.spawnQueue.length <= Math.floor(this.totalQueuedAtStart * 0.5)) {
      const bossCfg = this.pendingBossCfg;
      this.pendingBossCfg = null;
      const routeId = this.activeRoutes[0] || 'path_north';
      const sp = this.spawnPointSystem.getSpawnPointByPath(routeId);

      const boss = this.enemyPool.spawn(
        bossCfg.id,
        playerPos,
        gameTime,
        playerFwd,
        this.worldPhysics,
        bossCfg,
        {
          isDefenseMode: true,
          routeId,
          pathSystem: this.pathSystem,
          ...scaling
        }
      );

      if (boss) {
        if (sp) this.spawnPointSystem.triggerSpawnEffect(sp.id, true);
        if (onBossSpawned) onBossSpawned(boss, bossCfg);
      }
      return;
    }

    if (this.spawnQueue.length === 0) return;

    const nextItem = this.spawnQueue.shift();
    const sp = this.spawnPointSystem.getSpawnPointByPath(nextItem.routeId);
    const enemy = this.enemyPool.spawn(
      nextItem.type,
      playerPos,
      gameTime,
      playerFwd,
      this.worldPhysics,
      null,
      {
        isDefenseMode: true,
        routeId: nextItem.routeId,
        pathSystem: this.pathSystem,
        ...scaling
      }
    );

    if (enemy && sp) {
      this.spawnPointSystem.triggerSpawnEffect(sp.id, false);
    }
  }

  /**
   * Permite que el ataque de invocación de un Boss ("La Madre de Alambre")
   * engendre esbirros en la misma ruta por la que avanza el Boss.
   */
  spawnBossMinions(boss, count, playerPos, gameTime, playerFwd) {
    const routeId = boss?.defenseAI?.routeId || this.activeRoutes[0] || 'path_north';
    const scaling = this.getWaveScalingMultipliers();

    for (let i = 0; i < count; i++) {
      const type = i % 2 === 0 ? 'zombie' : 'worm';
      const minion = this.enemyPool.spawn(
        type,
        playerPos,
        gameTime,
        playerFwd,
        this.worldPhysics,
        null,
        {
          isDefenseMode: true,
          routeId,
          pathSystem: this.pathSystem,
          ...scaling
        }
      );
      if (minion && boss) {
        minion.group.position.copy(boss.group.position).add(
          new THREE.Vector3((Math.random() - 0.5) * 2.5, 0, (Math.random() - 0.5) * 2.5)
        );
        if (minion.defenseAI && boss.defenseAI) {
          minion.defenseAI.waypointIdx = boss.defenseAI.waypointIdx;
        }
      }
    }
  }

  update(dt, playerPos, gameTime, playerFwd, onBossSpawned) {
    if (this.state === 'VICTORY') return;

    // Cliente no autoritativo: no instancia enemigos ni avanza fases. Los
    // enemigos llegan por ENEMY_SPAWN y el estado por WAVE_STATE del Host.
    if (!this.isAuthority) return;

    if (this.state === 'PREP') {
      // En la primera ronda (currentWaveIndex === 0), la preparación no tiene límite de tiempo
      // para que el jugador explore libremente el mapa hasta que pulse [F].
      if (this.currentWaveIndex === 0) {
        return;
      }

      this.prepTimer -= dt;
      if (this.prepTimer <= 0) {
        this.startNextWave();
      }
      return;
    }

    if (this.state === 'SPAWNING') {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnTimer = this.spawnInterval;
        this.spawnSingleFromQueue(playerPos, gameTime, playerFwd, onBossSpawned);

        if (this.spawnQueue.length === 0 && !this.pendingBossCfg) {
          this.state = 'CLEARING';
        }
      }
      return;
    }

    if (this.state === 'CLEARING') {
      const remaining = this.getRemainingHostilesCount();
      if (remaining === 0) {
        this.wavesCompleted = this.currentWaveIndex;
        AudioSys.playUISelect();

        GameEvents.emit('wave:completed', {
          wave: this.currentWaveIndex,
          totalWaves: this.totalWaves
        });

        if (this.currentWaveIndex >= this.totalWaves) {
          if (this.cfg.enableEndgameSwarmAfterVictory) {
            this.state = 'ENDGAME_SWARM';
          } else {
            this.state = 'VICTORY';
            GameEvents.emit('defense:victory', {
              wavesCompleted: this.wavesCompleted,
              totalWaves: this.totalWaves
            });
          }
        } else {
          const evCfg = this.cfg.EVENTS || { intervalWaves: 3 };
          if (evCfg.intervalWaves > 0 && this.currentWaveIndex % evCfg.intervalWaves === 0) {
            this.state = 'EVENT';
            this.prepTimer = 0;
            const eventType = (Math.floor(this.currentWaveIndex / evCfg.intervalWaves) % 2 === 1) ? 'repair' : 'infestation';
            GameEvents.emit('defense:special_event_triggered', {
              waveIndex: this.currentWaveIndex,
              eventType
            });
          } else {
            this.state = 'PREP';
            this.prepTimer = this.cfg.betweenWavesRestSec;
          }
        }
      }
    }
  }

  completeSpecialEvent() {
    // El cliente espera al WAVE_STATE del Host para salir del evento.
    if (!this.isAuthority) return;
    this.state = 'PREP';
    this.prepTimer = this.cfg.betweenWavesRestSec;
    AudioSys.playUISelect();
  }

  // Snapshot autoritativo enviado por el Host. El cliente lo aplica sin
  // generar oleadas por su cuenta (sin el antiguo fast-forward con while).
  applyNetworkState(snap) {
    if (!snap) return;

    const prevWave = this.currentWaveIndex;
    const prevCompleted = this.wavesCompleted;
    const wasSpawning = this.state === 'SPAWNING';
    if (Number.isFinite(snap.currentWaveIndex)) this.currentWaveIndex = snap.currentWaveIndex;
    if (Number.isFinite(snap.wavesCompleted)) this.wavesCompleted = snap.wavesCompleted;
    if (Number.isFinite(snap.prepTimer)) this.prepTimer = Math.max(0, snap.prepTimer);
    if (Number.isFinite(snap.totalWaves)) this.totalWaves = snap.totalWaves;

    // Espejo del anuncio de fin de oleada (HUD/audio). Los efectos económicos
    // y el heal quedan bloqueados en el Cliente por la autoridad del Host.
    if (this.wavesCompleted > prevCompleted) {
      GameEvents.emit('wave:completed', {
        wave: this.wavesCompleted,
        totalWaves: this.totalWaves
      });
    }

    const waveAdvanced = this.currentWaveIndex > prevWave;
    const adoptingRunningWave = snap.state === 'SPAWNING' && !wasSpawning;

    // La cola solo se adopta al entrar en una oleada nueva o al recuperar
    // el estado en mitad de una oleada; los latidos no pisan el spawn local.
    if (waveAdvanced || adoptingRunningWave) {
      if (Array.isArray(snap.spawnQueue)) {
        this.spawnQueue = snap.spawnQueue.map(item => ({ type: item.type, routeId: item.routeId }));
      }
      if (Number.isFinite(snap.spawnInterval)) this.spawnInterval = snap.spawnInterval;
      if (Number.isFinite(snap.totalQueuedAtStart)) this.totalQueuedAtStart = snap.totalQueuedAtStart;
      if (Array.isArray(snap.activeRoutes) && snap.activeRoutes.length > 0) {
        this.activeRoutes = [...snap.activeRoutes];
      }
      this.pendingBossCfg = snap.pendingBossId
        ? (CONFIG.BOSS_SCHEDULE.find(b => b.id === snap.pendingBossId) || null)
        : null;
      this.spawnTimer = 0.25;
    }

    if (snap.state) this.state = snap.state;

    if (waveAdvanced) {
      GameEvents.emit('wave:started', {
        wave: this.currentWaveIndex,
        totalWaves: this.totalWaves,
        routes: this.activeRoutes,
        hasBoss: !!this.pendingBossCfg,
        bossName: this.pendingBossCfg ? this.pendingBossCfg.name : null,
        totalEnemies: this.spawnQueue.length + (this.pendingBossCfg ? 1 : 0)
      });
    }
  }
}