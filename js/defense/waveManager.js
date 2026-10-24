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

    // Encuentro personalizado del Chiringuito: dos oleadas por tarde, sin
    // eventos especiales ni victoria de campaña al terminar.
    this.customWaves = null;
    this.customScaling = null;
    this.encounterMode = null;
    this.encounterStarted = false;
    this.customBetweenWavesRestSec = this.cfg.betweenWavesRestSec;

    // En co-op online solo el Host decide transiciones de fase/oleada.
    this.isAuthority = true;
  }

  configureEncounter({ waves, scaling = null, betweenWavesRestSec = 15, mode = 'afternoon' } = {}) {
    if (!Array.isArray(waves) || waves.length === 0) return false;
    this.customWaves = waves.map((wave, idx) => ({
      ...wave,
      wave: wave.wave || idx + 1,
      composition: { ...(wave.composition || { zombie: 1 }) }
    }));
    this.customScaling = scaling ? { ...scaling } : null;
    this.encounterMode = mode;
    this.customBetweenWavesRestSec = Math.max(0, Number(betweenWavesRestSec) || 0);
    this.totalWaves = this.customWaves.length;
    this.currentWaveIndex = 0;
    this.wavesCompleted = 0;
    this.state = 'PREP';
    this.prepTimer = 0;
    this.spawnTimer = 0;
    this.spawnQueue = [];
    this.pendingBossCfg = null;
    this.encounterStarted = false;
    return true;
  }

  beginEncounter() {
    if (!this.customWaves || this.encounterStarted || !this.isAuthority) return false;
    this.encounterStarted = true;
    this.state = 'SPAWNING';
    this.currentWaveIndex = 0;
    this.wavesCompleted = 0;
    this.startNextWave();
    return true;
  }

  resetEncounter() {
    this.customWaves = null;
    this.customScaling = null;
    this.encounterMode = null;
    this.encounterStarted = false;
    this.currentWaveIndex = 0;
    this.wavesCompleted = 0;
    this.spawnQueue = [];
    this.pendingBossCfg = null;
    this.state = 'PREP';
    this.prepTimer = 0;
    this.spawnTimer = 0;
  }

  isEncounterComplete() {
    return this.state === 'COMPLETE';
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
    const comp = waveCfg.composition || { zombie: 1 };
    const routes = this.getActiveRoutes(waveCfg);
    const entries = Object.entries(comp).filter(([, weight]) => Number(weight) > 0);
    const totalWeight = entries.reduce((sum, [, weight]) => sum + Number(weight), 0);

    for (let i = 0; i < total; i++) {
      let type = 'zombie';
      if (entries.length > 0 && totalWeight > 0) {
        let roll = Math.random() * totalWeight;
        for (const [candidate, weight] of entries) {
          roll -= Number(weight);
          if (roll <= 0) {
            type = candidate;
            break;
          }
        }
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
    const schedule = this.customWaves || this.cfg.SCHEDULE;
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
    if (this.customScaling) {
      const waveBoost = 1 + Math.max(0, this.currentWaveIndex - 1) * 0.08;
      return {
        hpMult: (this.customScaling.hpMult ?? 1.0) * waveBoost,
        bossHpMult: (this.customScaling.bossHpMult ?? 1.1) * waveBoost,
        dmgMult: this.customScaling.dmgMult ?? 1.0,
        spdMult: this.customScaling.spdMult ?? 1.0
      };
    }
    const w = Math.max(0, this.currentWaveIndex - 1);
    const baseMult = this.cfg.tdBaseHpMult ?? 1.0;
    const bossBaseMult = this.cfg.tdBossHpMult ?? 1.1;
    return {
      hpMult: (1 + w * (this.cfg.hpMultiplierPerWave ?? 0.22)) * baseMult,
      // El jefe ya trae un HP base muy alto; usa una curva propia para no
      // convertir la oleada 12 en un muro de decenas de miles de HP.
      bossHpMult: (1 + w * (this.cfg.bossHpMultiplierPerWave ?? 0.18)) * bossBaseMult,
      dmgMult: 1 + w * (this.cfg.dmgMultiplierPerWave ?? 0.07),
      spdMult: 1 + w * (this.cfg.speedMultiplierPerWave ?? 0.025)
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
  spawnBossMinions(boss, count, playerPos, gameTime, playerFwd, forcedType = null) {
    const routeId = boss?.defenseAI?.routeId || this.activeRoutes[0] || 'path_north';
    const scaling = this.getWaveScalingMultipliers();

    for (let i = 0; i < count; i++) {
      const type = forcedType || (i % 2 === 0 ? 'zombie' : 'worm');
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
    if (this.state === 'VICTORY' || this.state === 'COMPLETE') return;

    // Cliente no autoritativo: no instancia enemigos ni avanza fases. Los
    // enemigos llegan por ENEMY_SPAWN y el estado por WAVE_STATE del Host.
    if (!this.isAuthority) return;
    if (this.customWaves && !this.encounterStarted) return;

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
          if (this.customWaves && this.encounterMode === 'afternoon') {
            this.state = 'COMPLETE';
            this.prepTimer = 0;
            GameEvents.emit('chiringuito:afternoon_complete', {
              wavesCompleted: this.wavesCompleted,
              totalWaves: this.totalWaves
            });
          } else if (this.cfg.enableEndgameSwarmAfterVictory) {
            this.state = 'ENDGAME_SWARM';
          } else {
            this.state = 'VICTORY';
            GameEvents.emit('defense:victory', {
              wavesCompleted: this.wavesCompleted,
              totalWaves: this.totalWaves
            });
          }
        } else if (this.customWaves) {
          this.state = 'PREP';
          this.prepTimer = this.customBetweenWavesRestSec;
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

  serialize() {
    return {
      customWaves: this.customWaves ? this.customWaves.map(w => ({ ...w, composition: { ...w.composition } })) : null,
      customScaling: this.customScaling ? { ...this.customScaling } : null,
      encounterMode: this.encounterMode,
      encounterStarted: this.encounterStarted,
      currentWaveIndex: this.currentWaveIndex,
      totalWaves: this.totalWaves,
      state: this.state,
      prepTimer: this.prepTimer,
      spawnTimer: this.spawnTimer,
      spawnQueue: (this.spawnQueue || []).map(item => ({ ...item })),
      pendingBossId: this.pendingBossCfg?.id || null,
      activeRoutes: [...(this.activeRoutes || [])],
      wavesCompleted: this.wavesCompleted,
      spawnInterval: this.spawnInterval,
      totalQueuedAtStart: this.totalQueuedAtStart
    };
  }

  restore(snapshot = {}) {
    if (!snapshot) return false;
    if (Array.isArray(snapshot.customWaves) && snapshot.customWaves.length) {
      this.customWaves = snapshot.customWaves.map(w => ({ ...w, composition: { ...(w.composition || {}) } }));
    }
    this.customScaling = snapshot.customScaling ? { ...snapshot.customScaling } : this.customScaling;
    this.encounterMode = snapshot.encounterMode || this.encounterMode;
    this.encounterStarted = !!snapshot.encounterStarted;
    this.currentWaveIndex = Math.max(0, Number(snapshot.currentWaveIndex) || 0);
    this.totalWaves = Math.max(1, Number(snapshot.totalWaves) || this.totalWaves);
    this.state = snapshot.state || 'PREP';
    this.prepTimer = Math.max(0, Number(snapshot.prepTimer) || 0);
    this.spawnTimer = Math.max(0, Number(snapshot.spawnTimer) || 0);
    this.spawnQueue = Array.isArray(snapshot.spawnQueue) ? snapshot.spawnQueue.map(item => ({ ...item })) : [];
    this.pendingBossCfg = snapshot.pendingBossId
      ? (CONFIG.BOSS_SCHEDULE.find(b => b.id === snapshot.pendingBossId) || null)
      : null;
    this.activeRoutes = Array.isArray(snapshot.activeRoutes) && snapshot.activeRoutes.length
      ? [...snapshot.activeRoutes]
      : this.activeRoutes;
    this.wavesCompleted = Math.max(0, Number(snapshot.wavesCompleted) || 0);
    this.spawnInterval = Number(snapshot.spawnInterval) || this.spawnInterval;
    this.totalQueuedAtStart = Math.max(0, Number(snapshot.totalQueuedAtStart) || 0);
    return true;
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