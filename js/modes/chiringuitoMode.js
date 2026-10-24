// Modo Chiringuito: campaña de 3 temporadas, granja, defensa con torretas
// y servicio manual de clientes. Sustituye a CoreDefenseMode manteniendo el
// id estable `core_defense`.
// Exports: ChiringuitoMode.

import * as THREE from 'three';
import { CONFIG, CHIRINGUITO_CONFIG, MODES_CONFIG } from '../config.js';
import { AudioSys } from '../audio.js';
import { GameEvents } from '../core/eventBus.js';
import { buildIslandRouteData, selectSeasonRoute } from '../defense/chiringuitoIsland.js';
import { buildAfternoonWaves, PHASE_TIMERS } from '../config/chiringuito/seasons.js';
import { PathSystem } from '../defense/pathSystem.js';
import { SpawnPointSystem } from '../defense/spawnPointSystem.js';
import { ExitPointSystem } from '../defense/exitPointSystem.js';
import { WaveManager } from '../defense/waveManager.js';
import { TurretSystem } from '../defense/turretSystem.js';
import { FoodDepotMarker } from '../defense/foodDepotMarker.js';
import { updateEnemies } from './enemyLoop.js';
import { triggerBossSpecialAttack, spawnEnemyProjectile } from '../combat.js';
import { CampaignDirector } from './chiringuito/campaignDirector.js';
import { RestaurantSystem } from '../restaurant/restaurantSystem.js';
import { ChiringuitoIslandGeometry } from '../world/chiringuitoIslandGeometry.js';
import { ChiringuitoUI } from '../ui/chiringuitoUI.js';
import { disposeObject3D } from '../utils/dispose.js';
import {
  loadCampaign,
  saveCampaign,
  markCampaignEnded
} from '../core/chiringuitoSave.js';

const AUTHORITY_NOTE = 'CHIRINGUITO';

function dist2D(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function phaseProgressLabel(director) {
  if (director.phase === 'MORNING') return 'GESTIONA LA MAÑANA';
  if (director.isAfternoon) return `OLEADA ${director.waveIndex}/${director.waveCount}`;
  if (director.isNight) return 'SERVICIO NOCTURNO';
  return director.phaseLabel;
}

export class ChiringuitoMode {
  constructor() {
    this.id = 'core_defense';
    this.meta = MODES_CONFIG.CATALOG.core_defense;
    this._ctx = null;
    this.net = null;
    this.isNetworked = false;
    this.isNetworkHost = false;
    this.isAuthority = true;
    this._initialized = false;
    this._ended = false;
    this._dirty = false;
    this._saveTimer = 0;
    this._saveCooldown = 0;
    this._unsubscribers = [];
    this._pageHideHandler = null;
    this._elapsed = 0;

    this.scrap = 0;
    this.initialScrapTotal = 0;
    this.bossesDefeated = 0;
    this.activeBoss = null;
    this.extraStructures = [];
    this.spawnPoints = [];
    this.exitPoints = [];
    this.mapData = null;
    this.mapId = null;
    this.difficulty = 'facil';

    this.island = null;
    this.pathSystem = null;
    this.spawnPointSystem = null;
    this.exitPointSystem = null;
    this.waveManager = null;
    this.turretSystem = null;
    this.depotMarker = null;
    this.restaurant = null;
    this.director = null;
    this.ui = null;
    this.coreMachine = null;
    this._encounterData = null;

    this._carriedPlateId = null;
    this._tray = null;
    this._trayPlateMat = null;
    this._placingFurniture = null;
    this._furniturePlacementState = null;
    this._atmosphere = null;
    this._baseAtmosphere = null;

    this._cookingOrderId = null;
    this._killScrapCounter = 0;
  }

  get lives() {
    return this.director?.pantryLives ?? 0;
  }

  get maxLives() {
    return this.director?.pantryMax ?? 1;
  }

  get seasonLabel() {
    return this.director?.seasonLabel || 'Temporada I';
  }

  init(ctx) {
    this._ctx = ctx;
    this.net = ctx.net || null;
    this.isNetworked = !!(this.net && this.net.isMatchActive);
    this.isNetworkHost = this.isNetworked && !!this.net.isHost?.();
    this.isAuthority = !this.isNetworked || this.isNetworkHost;
    this._ended = false;
    this._initialized = false;
    this._dirty = false;
    this._saveTimer = 0;
    this._saveCooldown = 0;
    this._elapsed = 0;
    this._carriedPlateId = null;
    this._placingFurniture = null;
    this._furniturePlacementState = null;
    this._cookingOrderId = null;
    this._killScrapCounter = 0;

    const saved = ctx.resumeCampaign ? loadCampaign() : null;
    const savedSeasonIndex = saved?.director?.seasonIndex ?? saved?.seasonIndex ?? 0;
    const savedRouteId = saved?.director?.routeMapId || saved?.routeMapId || saved?.routeId || null;
    const initialSeason = CHIRINGUITO_CONFIG.getSeason(savedSeasonIndex);
    const initialRoute = savedRouteId || selectSeasonRoute(savedSeasonIndex).id;
    this.difficulty = initialSeason.difficulty;
    this.mapId = initialRoute;
    this.initialScrapTotal = initialSeason.startingScrap;

    // La isla, el deck y su física existen antes que la granja, el mobiliario
    // y las torretas para que todos usen la altura correcta del suelo.
    this.island = new ChiringuitoIslandGeometry(ctx.scene, ctx.worldPhysics);
    this.island.setVisualLevel(0);
    this._buildRouteSystems(initialRoute, savedSeasonIndex);
    this.depotMarker = new FoodDepotMarker(ctx.scene, ctx.worldPhysics);
    this.turretSystem = new TurretSystem(ctx.scene, ctx.worldPhysics, this.extraStructures, this);
    this.restaurant = new RestaurantSystem(ctx.scene, ctx.worldPhysics, {
      authority: this.isAuthority,
      onChange: () => this._markDirty(),
      onServiceComplete: stats => this._onNightServiceComplete(stats)
    });
    this.director = this._createDirector();
    this.coreMachine = this._createCoreMachine();
    this._createTray();
    this._subscribeEvents();
    this._captureBaseAtmosphere();
    if (ctx.sunLight) this._baseAtmosphere.sunIntensity = ctx.sunLight.intensity;

    this._initialized = true;

    if (saved) {
      this._restoreCampaign(saved);
    } else {
      this.restaurant.resetForCampaign();
      this.scrap = initialSeason.startingScrap;
      this.director.startNewCampaign(initialRoute);
      this._placePlayerAtIsland();
      this._applyPhaseAtmosphere(this.director.phase, true);
    }

    this.ui = new ChiringuitoUI(this);
    this.ui.updateAll();
    if (saved?.director?.phase === 'DAY_SUMMARY') this.ui.showDaySummary(this.director.getDaySummary());
    if (saved?.director?.phase === 'SEASON_SUMMARY') this.ui.showSeasonSummary(this.director.getSeasonSummary());

    this._pageHideHandler = () => this.saveNow('pagehide');
    window.addEventListener('pagehide', this._pageHideHandler);
    window.addEventListener('beforeunload', this._pageHideHandler);

    if (this.isAuthority && !saved) this.saveNow('new_campaign');
  }

  _createDirector() {
    return new CampaignDirector({
      onPhaseChanged: (next, prev, options) => this._onPhaseChanged(next, prev, options),
      onMorningStart: (day, seasonIndex, season) => this._onMorningStart(day, seasonIndex, season),
      onAfternoonIntroComplete: (day, seasonIndex) => this._beginAfternoonEncounter(day, seasonIndex),
      onNightStart: (day, seasonIndex, season) => this._onNightStart(day, seasonIndex, season),
      onNightArrivalsClose: () => this._onNightArrivalsClose(),
      onNightForceClose: () => this._onNightForceClose(),
      onNightTimeout: () => this._onNightTimeout(),
      onDaySummary: summary => this._onDaySummary(summary),
      onSeasonSummary: summary => this._onSeasonSummary(summary),
      onSeasonTransitionReady: nextSeasonIndex => this._onSeasonTransition(nextSeasonIndex),
      onDefeat: result => this._onDefeat(result),
      onVictory: result => this._onVictory(result),
      onSaveRequested: reason => this.saveNow(reason)
    });
  }

  _createCoreMachine() {
    const mode = this;
    return {
      hasPhysicalCore: false,
      position: new THREE.Vector3(0, 0, 0),
      collisionRadius: 0,
      attackStopDistance: 1.5,
      active: true,
      destroyed: false,
      get hp() { return mode.director?.pantryLives ?? 0; },
      get maxHp() { return mode.director?.pantryMax ?? 1; },
      getHpRatio: () => Math.max(0, Math.min(1, (mode.director?.pantryLives || 0) / Math.max(1, mode.director?.pantryMax || 1))),
      currentDamageState: { label: 'DESPENSA A SALVO' },
      takeDamage: amount => mode.applyCoreDamage(amount, mode._ctx, 'core'),
      heal: amount => mode.director?.healPantry(amount),
      applyShield: () => {},
      update: () => {
        if (!mode.coreMachine) return;
        const ratio = mode.coreMachine.getHpRatio();
        mode.coreMachine.currentDamageState = {
          label: ratio <= 0.25 ? 'COMIDA CRÍTICA' : ratio <= 0.5 ? 'DESPENSA EN ALERTA' : 'DESPENSA A SALVO'
        };
        mode.coreMachine.destroyed = !!mode._ended;
      },
      destroy: () => {}
    };
  }

  _buildRouteSystems(routeMapId, seasonIndex = 0) {
    if (this.pathSystem) this.pathSystem.destroy();
    if (this.spawnPointSystem) this.spawnPointSystem.destroy();
    if (this.exitPointSystem) this.exitPointSystem.destroy();
    if (this.waveManager) {
      this.waveManager = null;
    }

    const routeData = buildIslandRouteData(routeMapId, this._ctx.worldPhysics, seasonIndex);
    this.mapData = routeData;
    this.mapId = routeData.routeMapId;
    this.routeMapId = routeData.routeMapId;
    this.spawnPoints = routeData.spawnPoints;
    this.exitPoints = routeData.exitPoints;

    this.pathSystem = new PathSystem(this._ctx.scene, this._ctx.worldPhysics, routeData.routes);
    this.spawnPointSystem = new SpawnPointSystem(
      this._ctx.scene,
      this._ctx.worldPhysics,
      this._ctx.vfx,
      routeData.spawnPoints
    );
    this.exitPointSystem = new ExitPointSystem(
      this._ctx.scene,
      this._ctx.worldPhysics,
      this._ctx.vfx,
      routeData.exitPoints
    );
    this.waveManager = new WaveManager(
      this._ctx.enemyPool,
      this.pathSystem,
      this.spawnPointSystem,
      this._ctx.worldPhysics
    );
    this.waveManager.setAuthority(this.isAuthority);
  }

  _subscribeEvents() {
    this._unsubscribers.push(
      GameEvents.on('wave:started', payload => {
        if (!this._initialized || this._ended) return;
        this.director?.onWaveStarted(payload);
        this._refreshUI();
      }),
      GameEvents.on('wave:completed', payload => {
        if (!this._initialized || this._ended) return;
        this.director?.onWaveCompleted(payload);
        this.addScrap(CHIRINGUITO_CONFIG.WAVE_ECONOMY.scrapPerWave);
        this._refreshUI();
      }),
      GameEvents.on('chiringuito:afternoon_complete', () => {
        if (!this._initialized || this._ended) return;
        this.director?.onAfternoonComplete();
        this.addScrap(CHIRINGUITO_CONFIG.WAVE_ECONOMY.scrapPerAfternoon);
        this.activeBoss = null;
        this._ctx?.clearActiveBoss?.();
        AudioSys.setBossMusic?.(false);
        this._markDirty();
        this._refreshUI();
      }),
      GameEvents.on('turret:built', () => this._markDirty()),
      GameEvents.on('turret:upgraded', () => this._markDirty()),
      GameEvents.on('turret:sold', () => this._markDirty())
    );
  }

  _captureBaseAtmosphere() {
    const scene = this._ctx.scene;
    this._baseAtmosphere = {
      fogColor: scene.fog?.color?.getHex?.() ?? 0xf6aa8b,
      fogDensity: scene.fog?.density ?? 0.0042,
      backgroundColor: scene.background?.getHex?.() ?? 0xf7a283,
      ambientColor: this._ctx.ambientLight?.color?.getHex?.() ?? 0xffc8a2,
      ambientIntensity: this._ctx.ambientLight?.intensity ?? 1,
      sunColor: this._ctx.sunLight?.color?.getHex?.() ?? 0xffc27a,
      sunIntensity: this._ctx.sunLight?.intensity ?? 1
    };
    this._atmoState = {
      fog: new THREE.Color(this._baseAtmosphere.fogColor),
      fogDensity: this._baseAtmosphere.fogDensity,
      background: new THREE.Color(this._baseAtmosphere.backgroundColor),
      ambient: new THREE.Color(this._baseAtmosphere.ambientColor),
      ambientIntensity: this._baseAtmosphere.ambientIntensity,
      sun: new THREE.Color(this._baseAtmosphere.sunColor),
      sunIntensity: this._baseAtmosphere.sunIntensity,
      night: 0
    };
    this._atmosphereTarget = null;
    if (scene.userData.tropical) scene.userData.tropical.nightFactor = 0;
  }

  _resolveAtmospherePreset(phase) {
    const a = CHIRINGUITO_CONFIG.ISLAND.atmosphere;
    // El barrido empieza al limpiar la tarde y termina de asentarse durante
    // la intro nocturna. Nada cambia de golpe al pulsar F.
    if (phase === 'AFTERNOON_CLEARING'
      || phase === 'NIGHT_INTRO'
      || phase === 'NIGHT_ACTIVE'
      || phase === 'NIGHT_CLOSING') {
      return { preset: a.night, night: 1 };
    }
    if (phase === 'MORNING'
      || phase === 'DAY_SUMMARY'
      || phase === 'SEASON_SUMMARY'
      || phase === 'SEASON_TRANSITION') {
      return { preset: a.morning, night: 0 };
    }
    return { preset: a.afternoon, night: 0 };
  }

  _applyPhaseAtmosphere(phase, immediate = false) {
    const scene = this._ctx?.scene;
    if (!scene || !this._atmoState) return;
    const { preset, night } = this._resolveAtmospherePreset(phase);
    this._atmosphere = preset;
    this._atmosphereTarget = {
      fog: new THREE.Color(preset.fog),
      fogDensity: preset.fogDensity,
      background: new THREE.Color(preset.fog),
      ambient: new THREE.Color(preset.ambient),
      ambientIntensity: preset.ambientIntensity ?? this._baseAtmosphere.ambientIntensity,
      sun: new THREE.Color(preset.sun),
      sunIntensity: preset.sunIntensity,
      night
    };
    this.island?.setNight(night);
    if (immediate) {
      const s = this._atmoState;
      const t = this._atmosphereTarget;
      s.fog.copy(t.fog);
      s.background.copy(t.background);
      s.ambient.copy(t.ambient);
      s.sun.copy(t.sun);
      s.fogDensity = t.fogDensity;
      s.ambientIntensity = t.ambientIntensity;
      s.sunIntensity = t.sunIntensity;
      s.night = t.night;
      this._writeAtmosphere();
    }
  }

  _writeAtmosphere() {
    const scene = this._ctx?.scene;
    const s = this._atmoState;
    if (!scene || !s) return;
    if (scene.fog?.color) scene.fog.color.copy(s.fog);
    if (scene.fog) scene.fog.density = s.fogDensity;
    if (scene.background?.isColor) scene.background.copy(s.background);
    if (this._ctx.ambientLight?.color) {
      this._ctx.ambientLight.color.copy(s.ambient);
      this._ctx.ambientLight.intensity = s.ambientIntensity;
    }
    if (this._ctx.sunLight?.color) {
      this._ctx.sunLight.color.copy(s.sun);
      this._ctx.sunLight.intensity = s.sunIntensity;
    }
    if (scene.userData.tropical) scene.userData.tropical.nightFactor = s.night;
  }

  _updateAtmosphere(dt) {
    const s = this._atmoState;
    const t = this._atmosphereTarget;
    if (!s || !t) return;
    const k = 1 - Math.exp(-Math.max(0, dt) * 0.5);
    s.fog.lerp(t.fog, k);
    s.background.lerp(t.background, k);
    s.ambient.lerp(t.ambient, k);
    s.sun.lerp(t.sun, k);
    s.fogDensity += (t.fogDensity - s.fogDensity) * k;
    s.ambientIntensity += (t.ambientIntensity - s.ambientIntensity) * k;
    s.sunIntensity += (t.sunIntensity - s.sunIntensity) * k;
    s.night += (t.night - s.night) * k;
    this._writeAtmosphere();
  }

  _onPhaseChanged(next, prev) {
    if (!this._initialized) return;
    // Ningún panel de gestión debe sobrevivir a un cambio de fase. Los
    // resúmenes se abren después, desde sus callbacks.
    this.ui?.closeAllPanels?.();
    this._cookingOrderId = null;
    this._applyPhaseAtmosphere(next);
    if (next === 'MORNING') {
      AudioSys.setMusicState?.('PREP');
      AudioSys.setBossMusic?.(false);
      this.ui?.hidePhaseOverlays?.();
    } else if (next === 'AFTERNOON_INTRO'
      || next === 'AFTERNOON_WAVE_1'
      || next === 'INTERMISSION'
      || next === 'AFTERNOON_WAVE_2') {
      AudioSys.setMusicState?.('COMBAT');
    } else if (next === 'NIGHT_INTRO' || next === 'NIGHT_ACTIVE') {
      AudioSys.setMusicState?.('PREP');
      AudioSys.setBossMusic?.(false);
    }
    this._markDirty();
    this._refreshUI();
    if (this.isNetworkHost) this.net?.sendChiringuitoState?.();
  }

  _onMorningStart(day, seasonIndex, season) {
    if (!this.restaurant) return;
    this.restaurant.currentDay = day;
    this.restaurant.currentSeasonIndex = seasonIndex;
    this.restaurant.newMorning();
    this._applyPhaseAtmosphere('MORNING');
    this._refreshUI();
  }

  _onNightStart(day, seasonIndex, season) {
    if (!this.restaurant) return;
    this.restaurant.startNight(day, seasonIndex);
    this._applyPhaseAtmosphere('NIGHT_ACTIVE');
    this._dirty = true;
    this._refreshUI();
  }

  _onNightArrivalsClose() {
    this.restaurant?.closeNight();
    this._refreshUI();
  }

  _onNightForceClose() {
    this.restaurant?.customers.forceClose();
    this._refreshUI();
  }

  _onNightTimeout() {
    if (this._ended) return;
    this.restaurant?.customers.forceComplete();
    this._finishNight();
  }

  _onNightServiceComplete(stats) {
    this._finishNight(stats);
  }

  _finishNight(stats = null) {
    if (!this.director || this._ended) return;
    if (this.director.phase !== 'NIGHT_ACTIVE' && this.director.phase !== 'NIGHT_CLOSING') return;
    const serviceStats = stats || this.restaurant?.customers.getStats() || null;
    this.director.completeNight(serviceStats);
    this._markDirty();
    this.saveNow('night_complete');
    this._refreshUI();
  }

  _onDaySummary(summary) {
    this.saveNow('day_summary');
    this.ui?.showDaySummary(summary);
  }

  _onSeasonSummary(summary) {
    this.saveNow('season_summary');
    this.ui?.showSeasonSummary(summary);
  }

  _onSeasonTransition(nextSeasonIndex) {
    if (this._ended) return;
    const nextSeason = CHIRINGUITO_CONFIG.getSeason(nextSeasonIndex);
    const nextRoute = selectSeasonRoute(nextSeasonIndex, { avoidMapId: this.mapId });
    this.turretSystem?.clearAll();
    this._ctx.enemyPool.clearAll();
    this._clearCombatArtifacts();
    this._carriedPlateId = null;
    this._cookingOrderId = null;
    this._syncTrayVisual();
    this.activeBoss = null;
    this._ctx?.clearActiveBoss?.();
    this.bossesDefeated = 0;
    this.scrap = nextSeason.startingScrap;
    this.initialScrapTotal = nextSeason.startingScrap;
    this._killScrapCounter = 0;
    this.difficulty = nextSeason.difficulty;
    this.restaurant?.resetForSeason(nextSeasonIndex);
    this._buildRouteSystems(nextRoute.id, nextSeasonIndex);
    AudioSys.playSeasonFanfare?.();
    this.director.startNewSeason(nextSeasonIndex, nextRoute.id);
    this._placePlayerAtIsland();
    this.island?.setVisualLevel(this.restaurant?.getVisualLevel() || 0);
    this._applyPhaseAtmosphere('MORNING', true);
    this.ui?.closeAllPanels?.();
    this._markDirty();
    this.saveNow('season_transition');
    this.net?.sendChiringuitoState?.();
    this._refreshUI();
  }

  _beginAfternoonEncounter(day, seasonIndex) {
    if (!this.director || !this.waveManager) return;
    const encounter = buildAfternoonWaves(seasonIndex, day);
    this._encounterData = encounter;
    this.waveManager.setAuthority(this.isAuthority);
    this.waveManager.configureEncounter({
      waves: encounter.waves,
      scaling: encounter.scaling,
      betweenWavesRestSec: PHASE_TIMERS.intermissionSec,
      mode: 'afternoon'
    });
    if (this.isAuthority) this.waveManager.beginEncounter();
    AudioSys.playWaveStart?.();
    this._markDirty();
    this._refreshUI();
  }

  _placePlayerAtIsland() {
    const start = CHIRINGUITO_CONFIG.ISLAND.playerStart;
    // El spawn está sobre el deck: hay que resolver la superficie estructural
    // sin el límite de escalón o el jugador nace bajo la tarima.
    const y = this._ctx.worldPhysics.getGroundHeight(start.x, start.z, 0, true, true);
    this._ctx.playerGroup.position.set(start.x, y, start.z);
    this._ctx.playerGroup.rotation.y = start.yaw || 0;
  }

  _createTray() {
    if (!this._ctx?.playerGroup) return;
    const group = new THREE.Group();
    group.name = 'chiringuito_carried_tray';
    const trayMat = new THREE.MeshStandardMaterial({ color: 0x9a6b3f, roughness: 0.82, flatShading: true });
    const tray = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.06, 0.52), trayMat);
    tray.position.y = 0.02;
    group.add(tray);
    this._trayPlateMat = new THREE.MeshStandardMaterial({ color: 0xf3e6c8, roughness: 0.72 });
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.045, 12), this._trayPlateMat);
    plate.position.y = 0.08;
    group.add(plate);
    const food = new THREE.Mesh(new THREE.IcosahedronGeometry(0.14, 0), new THREE.MeshStandardMaterial({
      color: 0xe0a25a,
      roughness: 0.8,
      flatShading: true
    }));
    food.position.y = 0.14;
    group.add(food);
    group.position.set(0.33, 0.92, -0.28);
    group.visible = false;
    group.userData.food = food;
    this._ctx.playerGroup.add(group);
    this._tray = group;
  }

  _syncTrayVisual() {
    if (!this._tray) return;
    const plate = this._carriedPlateId ? this.restaurant?.orders.getPlate(this._carriedPlateId) : null;
    this._tray.visible = !!plate;
    if (plate?.recipeId) {
      const recipe = CHIRINGUITO_CONFIG.getRecipe(plate.recipeId);
      if (recipe && this._trayPlateMat) this._trayPlateMat.color.setHex(recipe.color);
      if (this._tray.userData.food?.material && recipe) {
        this._tray.userData.food.material.color.setHex(recipe.color);
      }
    }
    if (plate && !plate.carrierId) {
      this._carriedPlateId = null;
      this._tray.visible = false;
    }
  }

  _markDirty() {
    this._dirty = true;
  }

  _refreshUI() {
    this.ui?.updateAll?.();
  }

  // La cocina es una fase de 5 pasos: mientras el minijuego está abierto (o
  // cualquier pedido está en estado cooking), el servicio y el reloj de fase se
  // pausan. Así una receta no consume toda la noche ni hace desertar al resto
  // de clientes. El Host sigue siendo el único que avanza la simulación.
  _isKitchenBusy() {
    if (this.ui?.isCookingOpen?.()) return true;
    const orders = this.restaurant?.orders?.getActiveOrders?.() || [];
    return orders.some(order => order?.status === 'cooking');
  }

  update(dt, ctx) {
    if (!this._initialized || this._ended) return;
    this._elapsed += dt;
    this._saveCooldown = Math.max(0, this._saveCooldown - dt);
    const kitchenBusy = this._isKitchenBusy();

    if (this.isAuthority) {
      if (!kitchenBusy) this.director.update(dt);
    } else if (!kitchenBusy && Number.isFinite(this.director.phaseTimer) && this.director.phaseTimer > 0) {
      // El Cliente solo interpola el reloj; las transiciones llegan del Host.
      this.director.phaseTimer = Math.max(0, this.director.phaseTimer - dt);
    }
    this._updateAtmosphere(dt);
    this.island?.update(dt);
    this.pathSystem?.update(dt, this.director.phase === 'MORNING' || this.director.phase === 'INTERMISSION');
    this.spawnPointSystem?.update(dt);
    this.exitPointSystem?.update(dt);
    if (this.depotMarker) {
      this.depotMarker.setRatio(this.coreMachine.getHpRatio());
      this.depotMarker.update(dt);
    }
    this.turretSystem?.update(dt, ctx);
    if (!kitchenBusy) {
      this.restaurant?.update(dt, ctx.playerGroup?.position, { simulate: this.isAuthority });
    }
    this._updateFurniturePlacement(ctx);

    if (this.director.isAfternoon) {
      if (this.waveManager) {
        this.waveManager.update(
          dt,
          ctx.playerGroup.position,
          ctx.gameTime,
          ctx.camFwd,
          (boss, bossCfg) => this._onBossSpawned(boss, bossCfg, ctx)
        );
      }
      if (ctx.enemyPool.active.length > 0) this._updateEnemies(dt, ctx);
    }

    this.coreMachine?.update?.();
    this._syncTrayVisual();
    this._checkCarriedPlate();
    // El save es continuo: en fases activas también deben persistir la cola de
    // oleada, los enemigos vivos y la paciencia de los clientes, aunque no haya
    // una compra o cosecha que marque dirty.
    if (this.director.isAfternoon || this.director.isNight) this._dirty = true;
    this._saveTimer += dt;
    if (this._dirty && this.isAuthority && this._saveTimer >= CHIRINGUITO_CONFIG.CAMPAIGN.autosaveIntervalSec) {
      this._saveTimer = 0;
      this.saveNow('autosave');
    }
    this.ui?.updateLive?.(dt);
  }

  _updateEnemies(dt, ctx) {
    const isNetworkClient = this.isNetworked && !this.isNetworkHost;
    const callbacks = {
      playerAlive: false,
      playerTargets: null,
      coreMachine: this.coreMachine,
      extraStructures: this.extraStructures,
      pathSystem: this.pathSystem,
      vfxList: ctx.vfx,
      bossHazards: ctx.bossHazards,
      bossProjectiles: ctx.bossProjectiles,
      onScare: () => {},
      onDealDamage: () => {},
      onBurnTick: (burningEnemy, burnDmg) => ctx.damageEnemy(
        burningEnemy,
        burnDmg,
        null,
        true,
        { visualOnly: isNetworkClient }
      ),
      onEnemyEscaped: enemy => this.handleEnemyLeak(enemy, ctx),
      onBossPhaseChange: () => ctx.onBossPhaseChange?.(),
      onCamShake: amount => ctx.addCamShake?.(amount)
    };

    if (this.isAuthority) {
      callbacks.onShootProjectile = (origin, dir, speed, dmg) => {
        spawnEnemyProjectile(ctx.scene, ctx.bossProjectiles, origin, dir, speed, dmg);
        AudioSys.play(380, 0.12, 'sawtooth', 0.05);
      };
      callbacks.onBossSpecial = (boss, atkType, targetPos = null) => {
        const target = targetPos || this._getBossTargetPosition(ctx);
        return triggerBossSpecialAttack(
          ctx.scene,
          boss,
          atkType,
          target,
          ctx.worldPhysics,
          ctx.bossHazards,
          ctx.bossProjectiles,
          count => this.waveManager?.spawnBossMinions(boss, count, target, ctx.gameTime, ctx.camFwd)
        );
      };
      callbacks.onNestSpawn = nest => {
        this.waveManager?.spawnBossMinions(nest, 1, nest.group.position, ctx.gameTime, ctx.camFwd, 'worm');
      };
      callbacks.onRegeneratorPulse = regenerator => {
        const radius = regenerator.healPulseRadius || 5;
        const amount = regenerator.healPulseAmount || 12;
        for (const ally of ctx.enemyPool.active) {
          if (!ally.active || ally.state === 'dead' || ally.hp >= ally.maxHp) continue;
          if (Math.hypot(ally.group.position.x - regenerator.group.position.x, ally.group.position.z - regenerator.group.position.z) > radius) continue;
          ally.hp = Math.min(ally.maxHp, ally.hp + amount);
        }
      };
    }

    updateEnemies(
      ctx.enemyPool,
      dt,
      ctx.playerGroup.position,
      ctx.camFwd,
      ctx.camera.position,
      ctx.worldPhysics,
      callbacks
    );
  }

  _getBossTargetPosition(ctx) {
    let best = null;
    let bestDist = Infinity;
    for (const turret of this.turretSystem?.getTurrets() || []) {
      if (!turret || turret.destroyed) continue;
      const d = ctx.playerGroup.position.distanceTo(turret.group.position);
      if (d < bestDist) {
        best = turret.group.position;
        bestDist = d;
      }
    }
    if (best) return best.clone();
    const exit = this.exitPoints?.[0]?.position;
    return exit ? new THREE.Vector3(exit.x, exit.y || 0, exit.z) : ctx.playerGroup.position.clone();
  }

  _onBossSpawned(boss, bossCfg, ctx) {
    this.activeBoss = boss;
    AudioSys.playBossHorn?.();
    AudioSys.setBossMusic?.(true);
    ctx.setActiveBoss?.(boss, bossCfg);
    this._markDirty();
  }

  handleEnemyLeak(enemy, ctx = this._ctx) {
    if (!this.isAuthority || this._ended || !enemy) return;
    const leak = enemy.isBoss ? 20 : (enemy.leakLives ?? 1);
    if (this.isNetworkHost) this.net?.sendEnemyLeak?.(enemy);
    AudioSys.playCoreLeak?.();
    const exit = this.exitPointSystem?.getExitPointByPath(enemy.defenseAI?.routeId);
    if (exit) this.exitPointSystem.triggerLeakEffect(exit.id);
    this.applyCoreDamage(leak, ctx, 'leak');
    ctx?.onCoreUnderAttackAlert?.(`¡FUGA DETECTADA! -${leak} COMIDA`);
    ctx?.triggerScare?.(0.25);
  }

  applyRemoteCoreState(hp, maxHp) {
    if (!this.isClient() || !this.director) return;
    if (Number.isFinite(hp)) this.director.pantryLives = Math.max(0, Math.round(hp));
    if (Number.isFinite(maxHp) && maxHp > 0) this.director.pantryMax = Math.round(maxHp);
    this._refreshUI();
  }

  applyCoreDamage(amount, ctx = this._ctx, reason = 'core') {
    if (!this.isAuthority || this._ended) return;
    const clean = Math.max(0, Math.round(Number(amount) || 0));
    if (clean <= 0) return;
    const prev = this.lives;
    this.director.applyPantryDamage(clean);
    const newHp = this.lives;
    if (newHp !== prev) {
      GameEvents.emit('core:damaged', {
        currentHp: newHp,
        hp: newHp,
        maxHp: this.maxLives,
        dmg: prev - newHp,
        reason
      });
      ctx?.onCoreDamaged?.({ currentHp: newHp, hp: newHp, maxHp: this.maxLives, dmg: prev - newHp, reason });
      this._markDirty();
    }
  }

  onEnemyKilled(enemy, ctx = this._ctx) {
    if (!enemy || !this.isAuthority) return;
    if (enemy.type === 'splitter' && this.waveManager) {
      this.waveManager.spawnBossMinions(
        enemy,
        enemy.splitCount || 2,
        enemy.group.position,
        ctx.gameTime,
        ctx.camFwd,
        'worm'
      );
    }

    const crab = enemy.isBoss
      ? CHIRINGUITO_CONFIG.WAVE_ECONOMY.crabPerBoss
      : (['hulk', 'nest', 'regenerator', 'splitter'].includes(enemy.type)
          ? CHIRINGUITO_CONFIG.WAVE_ECONOMY.crabPerEliteKill
          : CHIRINGUITO_CONFIG.WAVE_ECONOMY.crabPerKill);
    this.restaurant.inventory.add('crab', crab);

    const economy = CHIRINGUITO_CONFIG.WAVE_ECONOMY;
    let scrap = 0;
    if (enemy.isBoss) {
      scrap = economy.scrapPerBoss;
    } else if (['hulk', 'nest', 'regenerator', 'splitter'].includes(enemy.type)) {
      scrap = economy.scrapPerEliteKill;
    } else {
      // La madera de las bajas normales cae por tandas. El contador es local
      // del Host; el Cliente nunca acredita chatarra por su cuenta.
      const every = Math.max(1, Math.round(economy.scrapKillsPerDrop || 1));
      this._killScrapCounter = (this._killScrapCounter + 1) % every;
      if (this._killScrapCounter === 0) scrap = economy.scrapPerKill;
    }
    if (scrap > 0) this.addScrap(scrap);

    if (enemy.isBoss) {
      this.bossesDefeated++;
      this.activeBoss = null;
      AudioSys.setBossMusic?.(false);
      ctx.clearActiveBoss?.();
      ctx.addRunSouls?.(15);
    }
    this._markDirty();
    this._refreshUI();
  }

  _checkCarriedPlate() {
    if (!this._carriedPlateId) return;
    const plate = this.restaurant?.orders.getPlate(this._carriedPlateId);
    if (!plate || plate.status === 'served' || plate.status === 'lost') {
      this._carriedPlateId = null;
      this._syncTrayVisual();
    }
  }

  // ------------------------------------------------------------------------
  // Interacción contextual
  // ------------------------------------------------------------------------
  getInteractionTarget(playerPos = this._ctx?.playerGroup?.position) {
    if (!playerPos || !this.director) return null;
    const d = this.director;
    const actor = this.getActorId();
    const carried = this._carriedPlateId ? this.restaurant?.orders.getPlate(this._carriedPlateId) : null;

    if (carried) {
      const customers = this.restaurant.customers.getActiveCustomers();
      for (const customer of customers) {
        if (customer.orderId === carried.orderId && dist2D(playerPos, customer) <= CHIRINGUITO_CONFIG.CUSTOMERS.serveRadius) {
          const recipe = CHIRINGUITO_CONFIG.getRecipe(carried.recipeId);
          return {
            type: 'serve',
            customerId: customer.id,
            plateId: carried.id,
            text: `SERVIR ${recipe?.name || 'PLATO'}`,
            key: 'E'
          };
        }
      }
      if (dist2D(playerPos, CHIRINGUITO_CONFIG.ISLAND.stand.pass) <= 2.8) {
        return { type: 'dropPlate', plateId: carried.id, text: 'DEJAR PLATO EN EL PASE', key: 'E' };
      }
    }

    if (!carried && d.canServe()) {
      const plates = this.restaurant.orders.getPlatesAtPass();
      if (plates.length > 0 && dist2D(playerPos, CHIRINGUITO_CONFIG.ISLAND.stand.pass) <= 2.8) {
        const recipe = CHIRINGUITO_CONFIG.getRecipe(plates[0].recipeId);
        return { type: 'pickupPlate', plateId: plates[0].id, text: `RECOGER ${recipe?.name || 'PLATO'}`, key: 'E' };
      }
    }

    if (d.canCook() && dist2D(playerPos, CHIRINGUITO_CONFIG.ISLAND.stand.kitchen) <= 3.0) {
      return { type: 'kitchen', text: 'ABRIR COMANDAS', key: 'E' };
    }

    if (d.phase === 'MORNING' && dist2D(playerPos, CHIRINGUITO_CONFIG.ISLAND.stand.menuBoard) <= 4.8) {
      return { type: 'menu', text: 'ABRIR RECETARIO Y MEJORAS', key: 'E' };
    }

    if (d.phase === 'MORNING') {
      const plot = this.restaurant.farm.getNearestPlot(playerPos);
      if (plot) {
        if (plot.ready) {
          return {
            type: 'farm',
            action: 'harvest',
            plotId: plot.id,
            text: `COSECHAR ${plot.name.toUpperCase()}`,
            key: 'E'
          };
        }
        return {
          type: 'farm',
          action: 'plant',
          plotId: plot.id,
          text: `SEMBRAR ${plot.name.toUpperCase()}`,
          key: 'E'
        };
      }
    }

    if (d.phase === 'MORNING') {
      const fishing = CHIRINGUITO_CONFIG.ISLAND.fishing;
      if (fishing && dist2D(playerPos, fishing.spot) <= (fishing.interactRadius || 3.2)) {
        return {
          type: 'fishing',
          text: CHIRINGUITO_CONFIG.FISHING.interactionPrompt,
          key: 'E'
        };
      }
    }

    if (d.phase === 'MORNING' && dist2D(playerPos, CHIRINGUITO_CONFIG.ISLAND.stand.bell) <= 2.8) {
      return { type: 'bell', text: 'TOCAR LA CAMPANA E INICIAR LA TARDE', key: 'F' };
    }

    const turret = this.turretSystem?.findNearbyTurret(playerPos);
    if (turret) return { type: 'turret', turretId: turret.id, text: `AJUSTAR ${turret.cfg.name.toUpperCase()}`, key: 'E' };

    return null;
  }

  handleInteract(ctx = this._ctx) {
    const playerPos = ctx?.playerGroup?.position;
    const target = this.getInteractionTarget(playerPos);
    if (!target) return false;
    switch (target.type) {
      case 'farm': {
        if (target.action === 'plant') {
          this.ui?.openFarmMinigame?.(target.plotId);
          return true;
        }
        this.ui?.openHarvestMinigame?.(target.plotId);
        return true;
      }
      case 'fishing':
        this.ui?.openFishingMinigame?.();
        return true;
      case 'menu':
        this.ui?.openRecipeBook?.();
        return true;
      case 'kitchen':
        this.ui?.openOrderBoard?.();
        return true;
      case 'pickupPlate':
        return this.pickupPlate(target.plateId);
      case 'dropPlate':
        return this.dropCarriedPlate();
      case 'serve':
        return this.serveCarriedToCustomer(target.customerId);
      case 'turret':
        this.ui?.openTurretMenu?.(target.turretId);
        return true;
      case 'bell':
        return this.startAfternoon();
      default:
        return false;
    }
  }

  getActorId() {
    if (!this.isNetworked) return 'local';
    return this.isNetworkHost ? 'host' : 'guest';
  }

  // ------------------------------------------------------------------------
  // Fases y servicio
  // ------------------------------------------------------------------------
  startAfternoon() {
    if (!this.director) return false;
    if (!this.director.canStartAfternoon()) return false;
    if (!this.isAuthority) {
      this._requestNetworkAction('PHASE_ACTION', { phase: 'MORNING' });
      this.ui?.closeAllPanels?.();
      this._refreshUI();
      return true;
    }
    this.ui?.closeAllPanels?.();
    this.island?.ringBell();
    AudioSys.playBell?.();
    const ok = this.director.startAfternoon();
    if (ok) {
      this._markDirty();
      this._refreshUI();
    }
    return ok;
  }

  handlePhaseAction(ctx = this._ctx) {
    if (!this.director) return false;
    if (!this.isAuthority) {
      if (!['MORNING', 'DAY_SUMMARY', 'SEASON_SUMMARY'].includes(this.director.phase)) return false;
      this.ui?.closeAllPanels?.();
      this._requestNetworkAction('PHASE_ACTION', { phase: this.director.phase });
      return true;
    }
    switch (this.director.phase) {
      case 'MORNING':
        return this.startAfternoon();
      case 'DAY_SUMMARY': {
        this.ui?.hideDaySummary?.();
        const advanced = this.director.advanceFromDaySummary();
        this._refreshUI();
        return advanced;
      }
      case 'SEASON_SUMMARY': {
        this.ui?.hideSeasonSummary?.();
        const advanced = this.director.advanceFromSeasonSummary();
        this._refreshUI();
        return advanced;
      }
      default:
        return false;
    }
  }

  canAdvancePhase() {
    if (!this.director) return false;
    return this.director.phase === 'MORNING'
      || this.director.phase === 'DAY_SUMMARY'
      || this.director.phase === 'SEASON_SUMMARY';
  }

  getPhaseActionLabel() {
    if (!this.director) return '';
    switch (this.director.phase) {
      case 'MORNING': return 'INICIAR TARDE';
      case 'DAY_SUMMARY': return 'SIGUIENTE MAÑANA';
      case 'SEASON_SUMMARY': return this.director.isFinalSeason ? 'CERRAR CAMPAÑA' : 'NUEVA TEMPORADA';
      default: return '';
    }
  }

  isSummaryOpen() {
    return !!this.director && ['DAY_SUMMARY', 'SEASON_SUMMARY'].includes(this.director.phase);
  }

  blocksGameplayInput() {
    return !!this.ui?.blocksGameplayInput?.();
  }

  isCookingOverlayOpen() {
    return !!this.ui?.isCookingOpen?.();
  }

  restorePhaseUI() {
    if (!this.ui || !this.director) return;
    this.ui.updateAll();
    if (this.director.phase === 'DAY_SUMMARY') this.ui.showDaySummary(this.director.getDaySummary());
    if (this.director.phase === 'SEASON_SUMMARY') this.ui.showSeasonSummary(this.director.getSeasonSummary());
  }

  getOrderBoardData() {
    const orders = this.restaurant.orders.getActiveOrders().map(order => {
      const recipe = CHIRINGUITO_CONFIG.getRecipe(order.recipeId);
      const customer = this.restaurant.customers.getCustomer(order.customerId);
      return {
        ...order,
        recipe,
        customer,
        patienceRatio: customer ? Math.max(0, customer.orderPatience / Math.max(1, customer.maxOrderPatience)) : 1,
        canClaim: order.status === 'waiting'
      };
    });
    const plates = this.restaurant.orders.getPlatesAtPass().map(plate => {
      const recipe = CHIRINGUITO_CONFIG.getRecipe(plate.recipeId);
      return { ...plate, recipe };
    });
    return {
      orders,
      plates,
      cooking: this._cookingOrderId,
      kitchenSpeed: this.restaurant.getKitchenSpeedBonus()
    };
  }

  startCooking(orderId) {
    if (!this.director?.canCook()) return { ok: false, reason: 'FUERA_DE_SERVICIO' };
    if (this._carriedPlateId) return { ok: false, reason: 'LLEVAS_UN_PLATO' };
    if (this.restaurant.orders.getPlateForCarrier(this.getActorId())) return { ok: false, reason: 'YA_COCINAS' };
    if (!this.isAuthority) {
      const localClaim = this.restaurant.orders.claim(orderId, this.getActorId());
      if (!localClaim.ok) return localClaim;
      this._cookingOrderId = orderId;
      this._requestNetworkAction('COOKING_START', { orderId });
      this._refreshUI();
      return {
        ok: true,
        order: localClaim.order,
        recipe: localClaim.order.recipe,
        kitchenSpeed: this.restaurant.getKitchenSpeedBonus()
      };
    }
    const claim = this.restaurant.orders.claim(orderId, this.getActorId());
    if (!claim.ok) return claim;
    this._cookingOrderId = orderId;
    this._markDirty();
    this._refreshUI();
    return {
      ok: true,
      order: claim.order,
      recipe: claim.order.recipe,
      kitchenSpeed: this.restaurant.getKitchenSpeedBonus()
    };
  }

  cancelCooking(orderId, options = {}) {
    if (!this.isAuthority) {
      this.restaurant.orders.cancelCooking(orderId, this.getActorId(), options);
      this._cookingOrderId = null;
      this._requestNetworkAction('COOKING_CANCEL', { orderId });
      this._refreshUI();
      return { ok: true };
    }
    const result = this.restaurant.orders.cancelCooking(orderId, this.getActorId(), options);
    this._cookingOrderId = null;
    this._markDirty();
    this._refreshUI();
    return result;
  }

  completeCooking(orderId, result = {}) {
    this._cookingOrderId = null;
    if (!this.isAuthority) {
      this._requestNetworkAction('COOKING_RESULT', { orderId, result });
      this._refreshUI();
      return { ok: true, pending: true };
    }
    const completed = this.restaurant.orders.completeCooking(orderId, this.getActorId(), result);
    if (completed.ok) {
      this._markDirty();
      this.saveNow('cooking_complete');
      this._refreshUI();
    }
    return completed;
  }

  pickupPlate(plateId) {
    if (this._carriedPlateId) return false;
    const plate = this.restaurant.orders.getPlate(plateId);
    if (!plate || plate.status !== 'ready' || plate.carrierId) return false;
    if (!this.isAuthority) {
      plate.carrierId = this.getActorId();
      plate.atPass = false;
      plate.status = 'carried';
      this._carriedPlateId = plateId;
      this._syncTrayVisual();
      this._requestNetworkAction('PICK_PLATE', { plateId });
      AudioSys.playUISelect?.();
      this._refreshUI();
      return true;
    }
    const result = this.restaurant.orders.pickPlate(plateId, this.getActorId());
    if (!result.ok) return false;
    this._carriedPlateId = plateId;
    this._syncTrayVisual();
    AudioSys.playUISelect?.();
    this._markDirty();
    this._refreshUI();
    return true;
  }

  dropCarriedPlate() {
    if (!this._carriedPlateId) return false;
    if (!this.isAuthority) {
      const plateId = this._carriedPlateId;
      const plate = this.restaurant.orders.getPlate(plateId);
      if (plate) {
        plate.carrierId = null;
        plate.atPass = true;
        plate.status = 'ready';
      }
      this._carriedPlateId = null;
      this._syncTrayVisual();
      this._requestNetworkAction('DROP_PLATE', { plateId });
      this._refreshUI();
      return true;
    }
    const result = this.restaurant.orders.dropPlate(this._carriedPlateId, this.getActorId());
    if (!result.ok) return false;
    this._carriedPlateId = null;
    this._syncTrayVisual();
    this._markDirty();
    this._refreshUI();
    return true;
  }

  serveCarriedToCustomer(customerId) {
    if (!this._carriedPlateId) return false;
    const plate = this.restaurant.orders.getPlate(this._carriedPlateId);
    if (!plate) return false;
    if (!this.isAuthority) {
      const plateId = this._carriedPlateId;
      this._carriedPlateId = null;
      this._syncTrayVisual();
      this._requestNetworkAction('SERVE_PLATE', { customerId, plateId });
      AudioSys.playUISelect?.();
      this._refreshUI();
      return true;
    }
    const result = this.restaurant.serveCustomer(customerId, plate.id, this.getActorId());
    if (!result.ok) {
      AudioSys.playUIError?.();
      return false;
    }
    this._carriedPlateId = null;
    this._syncTrayVisual();
    AudioSys.playServeDish?.();
    AudioSys.playPearls?.(result.total || 1);
    this._markDirty();
    this.saveNow('plate_served');
    this._refreshUI();
    return true;
  }

  getCarriedPlate() {
    return this._carriedPlateId ? this.restaurant?.orders.getPlate(this._carriedPlateId) || null : null;
  }

  harvestPlot(plotId, result = {}) {
    const score = Math.max(0, Math.min(100, Number(result.score) || 0));
    const bonus = CHIRINGUITO_CONFIG.getHarvestBonus(score);
    if (!this.isAuthority) {
      this._requestNetworkAction('HARVEST', { plotId, score, bonus });
      this._refreshUI();
      return { ok: true, pending: true };
    }
    const harvest = this.restaurant.farm.harvest(plotId, {
      playerPos: this._ctx?.playerGroup?.position,
      bonus
    });
    if (!harvest.ok) {
      AudioSys.playUIError?.();
      return harvest;
    }
    AudioSys.playHarvest?.();
    this._markDirty();
    this.saveNow('plot_harvested');
    this._refreshUI();
    return harvest;
  }

  plantPlot(plotId, result = {}) {
    const score = Math.max(0, Math.min(100, Number(result.score) || 0));
    if (!this.isAuthority) {
      this.restaurant.farm.applyRemotePlant(plotId, score);
      this._requestNetworkAction('PLANT', { plotId, score });
      AudioSys.playUISelect?.();
      this._refreshUI();
      return true;
    }
    const planted = this.restaurant.farm.plant(plotId, { score });
    if (!planted.ok) {
      AudioSys.playUIError?.();
      return false;
    }
    AudioSys.playHarvest?.();
    this._markDirty();
    this.saveNow('plot_planted');
    this._refreshUI();
    return true;
  }

  completeFishing(result = {}) {
    const fishType = CHIRINGUITO_CONFIG.getFishType?.(result.fishId) || null;
    const rare = !!result.rare || !!fishType?.rare;
    const pearls = rare ? (CHIRINGUITO_CONFIG.FISHING.rarePearls || 2) : 0;
    const amount = Math.max(
      CHIRINGUITO_CONFIG.FISHING.fishPerCatchMin || 1,
      Math.min(CHIRINGUITO_CONFIG.FISHING.fishPerCatchMax || 3, Math.round(Number(result.amount) || 1))
    );
    if (!this.isAuthority) {
      this.restaurant.inventory.add('fish', amount);
      if (pearls) this.restaurant.addPearls(pearls);
      this._requestNetworkAction('FISHING_RESULT', {
        amount,
        score: result.score || 0,
        fishId: result.fishId || null,
        rare,
        pearls
      });
      this._refreshUI();
      return true;
    }
    this.restaurant.inventory.add('fish', amount);
    if (pearls) this.restaurant.addPearls(pearls);
    AudioSys.playUISelect?.();
    if (pearls) AudioSys.playPearls?.(pearls);
    this._markDirty();
    this.saveNow('fish_caught');
    this._refreshUI();
    return true;
  }

  // ------------------------------------------------------------------------
  // Construcción: torretas
  // ------------------------------------------------------------------------
  getScrap() { return this.scrap; }

  addScrap(amount) {
    if (!this.isAuthority) return;
    const value = Math.max(0, Number(amount) || 0);
    if (value <= 0) return;
    this.scrap += value;
    this._markDirty();
  }

  spendScrap(amount) {
    const value = Math.max(0, Number(amount) || 0);
    if (this.scrap < value) return false;
    this.scrap -= value;
    this._markDirty();
    return true;
  }

  getNearbyTurret(playerPos) {
    return this.turretSystem?.findNearbyTurret(playerPos) || null;
  }

  getTurretById(turretId) {
    return this.turretSystem?.getTurretById(turretId) || null;
  }

  beginTurretPlacement(typeId) {
    if (!this.director?.canBuildTurrets()) return false;
    return this.turretSystem?.beginPlacement(typeId) || false;
  }

  isTurretPlacementActive() {
    return !!this.turretSystem?.isPlacing();
  }

  confirmTurretPlacement() {
    if (!this.director?.canBuildTurrets()) return false;
    if (!this.isAuthority) {
      const state = this.turretSystem?.getPlacementState?.();
      if (!state?.valid || !state.position) {
        AudioSys.playUIError?.();
        return false;
      }
      this._requestNetworkAction('BUILD_TURRET', {
        typeId: state.typeId,
        x: state.position.x,
        y: state.position.y,
        z: state.position.z
      });
      this.turretSystem?.cancelPlacement();
      return true;
    }
    const ok = this.turretSystem?.confirmPlacement() || false;
    if (ok) this._markDirty();
    return ok;
  }

  cancelTurretPlacement() {
    this.turretSystem?.cancelPlacement();
  }

  getPlacementState() {
    return this.turretSystem?.getPlacementState() || null;
  }

  upgradeTurret(turretId, pathIndex) {
    if (!this.director?.canBuildTurrets()) return false;
    const turret = this.turretSystem?.getTurretById(turretId);
    if (!this.isAuthority) {
      if (!turret) return false;
      this._requestNetworkAction('UPGRADE_TURRET', {
        turretId,
        x: turret.group.position.x,
        z: turret.group.position.z,
        pathIndex
      });
      return true;
    }
    const ok = this.turretSystem?.upgradeTurret(turretId, pathIndex) || false;
    if (ok) this._markDirty();
    return ok;
  }

  sellTurret(turretId, options = {}) {
    const turret = this.turretSystem?.getTurretById(turretId);
    if (!this.isAuthority) {
      if (turret) {
        this._requestNetworkAction('SELL_TURRET', {
          turretId,
          x: turret.group.position.x,
          z: turret.group.position.z
        });
      }
      return 0;
    }
    const refund = this.turretSystem?.sellTurret(turretId, options) || 0;
    if (refund) this._markDirty();
    return refund;
  }

  toggleTurretRanges(forceState = null) {
    return this.turretSystem?.toggleTurretRanges(forceState) || false;
  }

  areTurretRangesVisible() {
    return !!this.turretSystem?.areTurretRangesVisible;
  }

  // ------------------------------------------------------------------------
  // Construcción: mobiliario
  // ------------------------------------------------------------------------
  getFurnitureCatalog() {
    return this.restaurant?.furniture.getCatalog() || [];
  }

  beginFurniturePlacement(typeId) {
    if (!this.director?.canBuildFurniture()) return false;
    const cfg = CHIRINGUITO_CONFIG.getFurniture(typeId);
    if (!cfg) return false;
    if (this.restaurant.pearls < (cfg.cost || 0)) {
      AudioSys.playUIError?.();
      return false;
    }
    this._placingFurniture = typeId;
    this.restaurant.furniture.setPreview(typeId);
    this._furniturePlacementState = { typeId, valid: false, reason: 'APUNTA A LA TERRAZA' };
    AudioSys.playUIClick?.();
    return true;
  }

  isFurniturePlacementActive() {
    return !!this._placingFurniture;
  }

  _computeFurnitureCandidate(ctx) {
    const camera = ctx?.camera;
    const player = ctx?.playerGroup?.position;
    if (!camera || !player) return null;
    const origin = camera.position;
    const dir = camera.getWorldDirection(new THREE.Vector3());
    let hit = null;
    for (let t = 1; t <= 24; t += 0.4) {
      const x = origin.x + dir.x * t;
      const y = origin.y + dir.y * t;
      const z = origin.z + dir.z * t;
      const ground = ctx.worldPhysics.getGroundHeight(x, z, y);
      if (y <= ground + 0.3) {
        hit = new THREE.Vector3(x, ground, z);
        break;
      }
    }
    const fwd = ctx.camFwd ? new THREE.Vector3(ctx.camFwd.x, 0, ctx.camFwd.z).normalize() : new THREE.Vector3(0, 0, -1);
    if (!hit) {
      hit = new THREE.Vector3(player.x + fwd.x * 4, 0, player.z + fwd.z * 4);
    }
    if (new THREE.Vector2(hit.x - player.x, hit.z - player.z).dot(new THREE.Vector2(fwd.x, fwd.z)) < 0.4) {
      hit.set(player.x + fwd.x * 4, 0, player.z + fwd.z * 4);
    }
    const dx = hit.x - player.x;
    const dz = hit.z - player.z;
    const dist = Math.hypot(dx, dz);
    const maxDist = 11;
    let x = hit.x;
    let z = hit.z;
    if (dist > maxDist) {
      x = player.x + (dx / dist) * maxDist;
      z = player.z + (dz / dist) * maxDist;
    }
    const grid = CHIRINGUITO_CONFIG.ISLAND.build.gridSize || 1.4;
    x = Math.round(x / grid) * grid;
    z = Math.round(z / grid) * grid;
    const y = ctx.worldPhysics.getGroundHeight(x, z, player.y + 0.4);
    return new THREE.Vector3(x, y, z);
  }

  _updateFurniturePlacement(ctx) {
    if (!this._placingFurniture) return;
    const candidate = this._computeFurnitureCandidate(ctx);
    if (!candidate) {
      this._furniturePlacementState = { typeId: this._placingFurniture, valid: false, reason: 'SIN SUPERFICIE' };
      return;
    }
    const check = this.restaurant.furniture.canPlace(this._placingFurniture, candidate.x, candidate.z);
    this._furniturePlacementState = {
      typeId: this._placingFurniture,
      valid: check.valid,
      reason: check.reason,
      position: candidate
    };
    this.restaurant.furniture.updatePreview(candidate.x, candidate.z, check.valid);
  }

  getFurniturePlacementState() {
    return this._furniturePlacementState;
  }

  confirmFurniturePlacement() {
    if (!this._placingFurniture) return false;
    const state = this._furniturePlacementState;
    if (!state?.valid || !state.position) {
      AudioSys.playUIError?.();
      return false;
    }
    const cfg = CHIRINGUITO_CONFIG.getFurniture(this._placingFurniture);
    if (!this.isAuthority) {
      if (!cfg) return false;
      this._requestNetworkAction('BUILD_FURNITURE', {
        typeId: this._placingFurniture,
        x: state.position.x,
        y: state.position.y,
        z: state.position.z,
        yaw: 0
      });
      this._placingFurniture = null;
      this._furniturePlacementState = null;
      this.restaurant.furniture.clearPreview();
      return true;
    }
    if (!cfg || !this.restaurant.spendPearls(cfg.cost || 0)) {
      AudioSys.playUIError?.();
      return false;
    }
    const placed = this.restaurant.furniture.place(this._placingFurniture, state.position.x, state.position.z, 0);
    if (!placed.ok) {
      this.restaurant.addPearls(cfg.cost || 0);
      AudioSys.playUIError?.();
      return false;
    }
    this._placingFurniture = null;
    this._furniturePlacementState = null;
    this.restaurant.furniture.clearPreview();
    this._markDirty();
    this.saveNow('furniture_built');
    this._refreshUI();
    return true;
  }

  cancelFurniturePlacement() {
    this._placingFurniture = null;
    this._furniturePlacementState = null;
    this.restaurant?.furniture.clearPreview();
  }

  sellFurniture(furnitureId) {
    if (!this.director?.canBuildFurniture()) return false;
    if (!this.isAuthority) {
      this._requestNetworkAction('SELL_FURNITURE', { id: furnitureId });
      return true;
    }
    const result = this.restaurant.furniture.remove(furnitureId);
    if (!result.ok) return false;
    this.restaurant.addPearls(result.refund || 0);
    this._markDirty();
    this.saveNow('furniture_sold');
    this._refreshUI();
    return true;
  }

  // ------------------------------------------------------------------------
  // Recetas, mejoras y datos de UI
  // ------------------------------------------------------------------------
  getRecipeBookData() {
    const recipes = Object.values(CHIRINGUITO_CONFIG.RECIPES).map(recipe => {
      const unlocked = this.restaurant.isRecipeUnlocked(recipe.id);
      const availability = CHIRINGUITO_CONFIG.getRecipeAvailability(recipe, this.restaurant.inventory.getStock());
      return {
        ...recipe,
        unlocked,
        availability,
        unlockCost: recipe.unlockCost || 0
      };
    });
    return {
      recipes,
      stock: this.restaurant.inventory.getStock(),
      pearls: this.restaurant.pearls,
      menuRecipeIds: this.restaurant.getMenuRecipeIds(),
      canEditMenu: this.director?.phase === 'MORNING',
      upgrades: this.getRestaurantUpgradeData(),
      stats: this.restaurant.getDayStats()
    };
  }

  toggleMenuRecipe(recipeId) {
    if (this.director?.phase !== 'MORNING') {
      return { ok: false, reason: 'FUERA_DE_LA_MANANA' };
    }
    if (!this.isAuthority) {
      this._requestNetworkAction('TOGGLE_MENU', { recipeId });
      return { ok: true, pending: true };
    }
    const result = this.restaurant.toggleMenuRecipe(recipeId);
    if (result.ok) {
      this._markDirty();
      this.saveNow('daily_menu');
      this._refreshUI();
    }
    return result;
  }

  unlockRecipe(recipeId) {
    if (!this.isAuthority) {
      this._requestNetworkAction('UNLOCK_RECIPE', { recipeId });
      return { ok: true, pending: true };
    }
    const result = this.restaurant.unlockRecipe(recipeId);
    if (result.ok) {
      this._markDirty();
      this.saveNow('recipe_unlocked');
      this._refreshUI();
    }
    return result;
  }

  getRestaurantUpgradeData() {
    return this.restaurant.getUpgradeCatalog().map(upgrade => ({
      ...upgrade,
      owned: this.restaurant.hasUpgrade(upgrade.id),
      canBuy: this.restaurant.canBuyUpgrade(upgrade.id)
    }));
  }

  buyRestaurantUpgrade(upgradeId) {
    if (!this.isAuthority) {
      this._requestNetworkAction('BUY_UPGRADE', { upgradeId });
      return { ok: true, pending: true };
    }
    const result = this.restaurant.buyUpgrade(upgradeId);
    if (result.ok) {
      this.island?.setVisualLevel(this.restaurant.getVisualLevel());
      this._markDirty();
      this.saveNow('upgrade_bought');
      this._refreshUI();
    }
    return result;
  }

  getChiringuitoTelemetry() {
    const d = this.director;
    if (!d) return null;
    const inventory = this.restaurant?.inventory;
    const service = this.restaurant?.getServiceTelemetry();
    return {
      ...d.getTelemetry(this.waveManager),
      scrap: this.scrap,
      pearls: this.restaurant?.pearls || 0,
      crab: inventory?.get('crab') || 0,
      stock: inventory?.getStock() || {},
      capacity: this.restaurant?.getCapacity() || 0,
      charm: this.restaurant?.getCharm() || 0,
      service,
      nearby: this.getInteractionTarget(this._ctx?.playerGroup?.position),
      carriedPlate: this.getCarriedPlate(),
      remainingEnemies: this.waveManager?.getRemainingHostilesCount?.() || 0,
      waveNumber: this.waveManager?.currentWaveNumber || 1,
      waveTotal: this.waveManager?.totalWaves || 2,
      turretCount: this.turretSystem?.getTurretCount() || 0,
      turretMax: this.turretSystem?.getMaxTurretCount?.() || 16,
      placingFurniture: this._furniturePlacementState,
      placement: this.getPlacementState(),
      boss: this.activeBoss ? {
        name: this.activeBoss.bossData?.name,
        hp: this.activeBoss.hp,
        maxHp: this.activeBoss.maxHp
      } : null
    };
  }

  getHudConfig() {
    return {
      modeId: 'core_defense',
      chiringuito: true,
      showTimerAsPrimary: false,
      showCoreBar: true,
      showWaveCounter: true,
      showCoreDirectionMarker: false,
      coopScrapTransfer: false,
      objectiveHeader: 'CHIRINGUITO DEL ATARDECER'
    };
  }

  getHudTelemetry(ctx = null) {
    const d = this.director;
    const chiringuito = this.getChiringuitoTelemetry();
    if (!d) {
      return {
        objectiveText: 'PREPARANDO LA CALETA',
        subTaskText: '',
        waveBadgeText: '',
        coreHp: 0,
        coreMaxHp: 1,
        coreRatio: 0,
        isPrep: false,
        canSkipPrep: false,
        chiringuito: null
      };
    }
    const nearby = this.getInteractionTarget(ctx?.playerGroup?.position);
    let objectiveText = 'GESTIONA EL CHIRINGUITO';
    if (d.phase === 'MORNING') objectiveText = 'PREPARA LA MAÑANA';
    else if (d.isAfternoon) objectiveText = 'DEFIENDE LA DESPENSA';
    else if (d.isNight) objectiveText = 'ATIENDE A LOS CLIENTES';
    else if (d.phase === 'DAY_SUMMARY') objectiveText = 'DÍA COMPLETADO';
    else if (d.phase === 'SEASON_SUMMARY') objectiveText = 'TEMPORADA COMPLETADA';

    const turret = this.turretSystem?.findNearbyTurret(ctx?.playerGroup?.position) || null;
    return {
      objectiveText,
      objectiveCheck: d.pantryLives < d.pantryMax * 0.4 ? '[!]' : '[ ]',
      subTaskText: nearby?.text || (d.canCook() ? 'COCINA Y SIRVE LOS PEDIDOS' : phaseProgressLabel(d)),
      waveBadgeText: d.isAfternoon ? `TARDE // OLEADA ${this.waveManager?.currentWaveNumber || 1}/${this.waveManager?.totalWaves || 2}` : d.phaseLabel,
      eventBadge: null,
      eventTelemetry: null,
      remainingEnemies: this.waveManager?.getRemainingHostilesCount?.() || 0,
      waveNumber: this.waveManager?.currentWaveNumber || 1,
      totalWaves: this.waveManager?.totalWaves || 2,
      isPrep: d.phase === 'MORNING',
      isFirstWavePrep: d.phase === 'MORNING',
      prepSeconds: 0,
      canSkipPrep: this.canAdvancePhase(),
      coreHp: d.pantryLives,
      coreMaxHp: d.pantryMax,
      turretRangesVisible: this.areTurretRangesVisible(),
      coreRatio: d.pantryLives / Math.max(1, d.pantryMax),
      coreStateLabel: d.pantryLives <= d.pantryMax * 0.25 ? 'COMIDA CRÍTICA' : d.pantryLives <= d.pantryMax * 0.5 ? 'DESPENSA EN ALERTA' : 'DESPENSA A SALVO',
      corePosition: null,
      hasPhysicalCore: false,
      spawnPoints: this.spawnPoints,
      exitPoints: this.exitPoints,
      difficulty: this.difficulty,
      bossesDefeated: this.bossesDefeated,
      totalBosses: 3,
      scrap: this.scrap,
      turretCount: this.turretSystem?.getTurretCount() || 0,
      turretMax: this.turretSystem?.getMaxTurretCount?.() || 16,
      nearbyTurret: turret ? { id: turret.id, name: turret.cfg.name } : null,
      placement: this.getPlacementState(),
      chiringuito
    };
  }

  // ------------------------------------------------------------------------
  // Red: snapshot autoritativo del Host y acciones del Cliente
  // ------------------------------------------------------------------------
  isClient() {
    return this.isNetworked && !this.isNetworkHost;
  }

  _requestNetworkAction(action, payload = {}) {
    if (!this.isClient()) return false;
    this.net?.sendChiringuitoAction?.(action, payload);
    return true;
  }

  buildNetworkSnapshot() {
    const snapshot = this._buildSaveSnapshot();
    snapshot.epoch = this.director?.epoch || 1;
    snapshot.routeMapId = this.director?.routeMapId || this.mapId;
    snapshot.network = true;
    snapshot.player = null;
    // Los enemigos viajan por ENEMY_SPAWN/ENEMY_BATCH_SYNC; no duplicar en el
    // snapshot del restaurante.
    snapshot.enemies = [];
    return snapshot;
  }

  applyNetworkSnapshot(snapshot = {}) {
    if (!this.isClient() || !snapshot) return;
    const previousEpoch = this.director?.epoch || 0;
    const incomingEpoch = Number(snapshot.director?.epoch ?? snapshot.epoch ?? previousEpoch);
    const incomingRoute = snapshot.director?.routeMapId || snapshot.routeMapId || snapshot.routeId;
    const epochChanged = incomingEpoch !== previousEpoch || (incomingRoute && incomingRoute !== this.mapId);

    if (epochChanged) {
      this.turretSystem?.clearAll();
      this._ctx.enemyPool.clearAll();
      this._clearCombatArtifacts();
      this._carriedPlateId = null;
      this._cookingOrderId = null;
      this._syncTrayVisual();
      this.ui?.closeAllPanels?.();
      this.restaurant?.resetForSeason(snapshot.seasonIndex ?? this.director?.seasonIndex ?? 0);
      if (incomingRoute) this._buildRouteSystems(incomingRoute, snapshot.seasonIndex ?? 0);
      this.difficulty = CHIRINGUITO_CONFIG.getSeason(snapshot.seasonIndex ?? 0).difficulty;
      this.mapId = incomingRoute || this.mapId;
      this._networkTurretSignature = null;
      this._placePlayerAtIsland();
      this.island?.setVisualLevel(this.restaurant?.getVisualLevel() || 0);
    }

    this.director?.applyNetworkState(snapshot.director || {});
    this.scrap = Math.max(0, Number(snapshot.scrap) || 0);
    this.bossesDefeated = Math.max(0, Number(snapshot.bossesDefeated) || 0);
    this.restaurant?.applyNetworkState(snapshot.restaurant || {});
    if (Array.isArray(snapshot.turrets)) this._applyNetworkTurrets(snapshot.turrets);

    if (this.director?.isAfternoon && snapshot.wave && this.waveManager) {
      this.waveManager.restore(snapshot.wave);
    }

    const actor = this.getActorId();
    const carried = this._carriedPlateId ? this.restaurant?.orders.getPlate(this._carriedPlateId) : null;
    if (carried && carried.carrierId && carried.carrierId !== actor) {
      this._carriedPlateId = null;
    }
    if (!this._carriedPlateId && this.restaurant?.orders) {
      const networkPlate = Array.from(this.restaurant.orders.plates.values())
        .find(p => p.carrierId === actor && p.status === 'carried');
      if (networkPlate) this._carriedPlateId = networkPlate.id;
    }
    this._syncTrayVisual();
    this._applyPhaseAtmosphere(this.director?.phase || 'MORNING');
    this._refreshUI();
    if (this.director?.phase === 'DAY_SUMMARY' && this.ui?._summaryPhase !== 'DAY_SUMMARY') {
      this.ui?.showDaySummary?.(this.director.getDaySummary());
    }
    if (this.director?.phase === 'SEASON_SUMMARY' && this.ui?._summaryPhase !== 'SEASON_SUMMARY') {
      this.ui?.showSeasonSummary?.(this.director.getSeasonSummary());
    }
  }

  _applyNetworkTurrets(turrets) {
    if (!this.turretSystem) return;
    const signature = JSON.stringify(turrets || []);
    if (this._networkTurretSignature === signature) return;
    this._networkTurretSignature = signature;
    this.turretSystem.clearAll();
    for (const data of turrets || []) {
      const cfg = CONFIG.CORE_DEFENSE?.TURRETS?.[data.typeId];
      if (!cfg) continue;
      const pos = new THREE.Vector3(data.x, data.y, data.z);
      const turret = this.turretSystem.createTurret(pos, cfg);
      if (turret && Array.isArray(data.levels)) {
        data.levels.forEach((level, idx) => {
          while (turret.levels[idx] < level) {
            if (!turret.upgrade(idx)) break;
          }
        });
      }
    }
  }

  handleNetworkAction(action, payload = {}, senderId = null) {
    if (!this.isAuthority) return false;
    const actor = 'guest';
    let changed = false;
    switch (action) {
      case 'HARVEST': {
        const score = Math.max(0, Math.min(100, Number(payload.score) || 0));
        const bonus = CHIRINGUITO_CONFIG.getHarvestBonus(score);
        const result = this.restaurant.farm.harvest(payload.plotId, { silent: false, bonus });
        changed = !!result?.ok;
        break;
      }
      case 'PLANT': {
        const score = Math.max(0, Math.min(100, Number(payload.score) || 0));
        const result = this.restaurant.farm.plant(payload.plotId, { silent: false, score });
        changed = !!result?.ok;
        break;
      }
      case 'FISHING_RESULT': {
        const amount = Math.max(
          CHIRINGUITO_CONFIG.FISHING.fishPerCatchMin || 1,
          Math.min(CHIRINGUITO_CONFIG.FISHING.fishPerCatchMax || 3, Math.round(Number(payload.amount) || 1))
        );
        this.restaurant.inventory.add('fish', amount);
        if (payload.rare) {
          this.restaurant.addPearls(Number(payload.pearls) || CHIRINGUITO_CONFIG.FISHING.rarePearls || 2);
          AudioSys.playPearls?.(Number(payload.pearls) || 2);
        }
        changed = true;
        break;
      }
      case 'BUILD_TURRET': {
        const cfg = CONFIG.CORE_DEFENSE?.TURRETS?.[payload.typeId];
        if (cfg && this.director?.canBuildTurrets() && this.scrap >= cfg.cost) {
          const x = Number(payload.x);
          const z = Number(payload.z);
          const y = this._ctx.worldPhysics.getGroundHeight(x, z, payload.y ?? 0);
          const tooClose = this.turretSystem.getTurrets().some(t =>
            Math.hypot(t.group.position.x - x, t.group.position.z - z) < 1.2
          );
          if (!tooClose && this.spendScrap(cfg.cost)) {
            this.turretSystem.createTurret(new THREE.Vector3(x, y, z), cfg);
            changed = true;
          }
        }
        break;
      }
      case 'UPGRADE_TURRET': {
        const turret = this._findNetworkTurret(payload);
        if (turret && this.director?.canBuildTurrets()) {
          changed = this.turretSystem.upgradeTurret(turret.id, payload.pathIndex);
        }
        break;
      }
      case 'SELL_TURRET': {
        const turret = this._findNetworkTurret(payload);
        if (turret) {
          this.turretSystem.sellTurret(turret.id);
          changed = true;
        }
        break;
      }
      case 'BUILD_FURNITURE': {
        const cfg = CHIRINGUITO_CONFIG.getFurniture(payload.typeId);
        if (cfg && this.director?.canBuildFurniture() && this.restaurant.pearls >= cfg.cost) {
          const x = Number(payload.x);
          const z = Number(payload.z);
          const check = this.restaurant.furniture.canPlace(payload.typeId, x, z);
          if (check.valid && this.restaurant.spendPearls(cfg.cost)) {
            const placed = this.restaurant.furniture.place(payload.typeId, x, z, payload.yaw || 0, { remote: true });
            if (!placed.ok) this.restaurant.addPearls(cfg.cost);
            else changed = true;
          }
        }
        break;
      }
      case 'SELL_FURNITURE': {
        const result = this.restaurant.furniture.remove(payload.id, { remote: true });
        if (result.ok) {
          this.restaurant.addPearls(result.refund || 0);
          changed = true;
        }
        break;
      }
      case 'UNLOCK_RECIPE': {
        changed = this.restaurant.unlockRecipe(payload.recipeId).ok;
        break;
      }
      case 'TOGGLE_MENU': {
        if (this.director?.phase === 'MORNING') {
          changed = this.restaurant.toggleMenuRecipe(payload.recipeId).ok;
        }
        break;
      }
      case 'BUY_UPGRADE': {
        const result = this.restaurant.buyUpgrade(payload.upgradeId);
        if (result.ok) {
          this.island?.setVisualLevel(this.restaurant.getVisualLevel());
          changed = true;
        }
        break;
      }
      case 'COOKING_START': {
        const claim = this.restaurant.orders.claim(payload.orderId, actor);
        changed = claim.ok;
        break;
      }
      case 'COOKING_CANCEL': {
        const cancel = this.restaurant.orders.cancelCooking(payload.orderId, actor);
        changed = cancel.ok;
        break;
      }
      case 'COOKING_RESULT': {
        const completed = this.restaurant.orders.completeCooking(payload.orderId, actor, payload.result || {});
        changed = completed.ok;
        break;
      }
      case 'PICK_PLATE': {
        const picked = this.restaurant.orders.pickPlate(payload.plateId, actor);
        changed = picked.ok;
        break;
      }
      case 'DROP_PLATE': {
        const dropped = this.restaurant.orders.dropPlate(payload.plateId, actor);
        changed = dropped.ok;
        break;
      }
      case 'SERVE_PLATE': {
        const served = this.restaurant.serveCustomer(payload.customerId, payload.plateId, actor);
        changed = served.ok;
        break;
      }
      case 'PHASE_ACTION': {
        changed = this.handlePhaseAction();
        break;
      }
      default:
        break;
    }
    if (changed) {
      this._markDirty();
      this.saveNow(`net_action_${action}`);
      this.net?.sendChiringuitoState?.();
    }
    return changed;
  }

  _findNetworkTurret(payload = {}) {
    if (!this.turretSystem) return null;
    const x = Number(payload.x);
    const z = Number(payload.z);
    if (Number.isFinite(x) && Number.isFinite(z)) {
      let best = null;
      let bestDist = 2.2;
      for (const turret of this.turretSystem.getTurrets()) {
        const d = Math.hypot(turret.group.position.x - x, turret.group.position.z - z);
        if (d < bestDist) {
          best = turret;
          bestDist = d;
        }
      }
      if (best) return best;
    }
    return payload.turretId ? this.turretSystem.getTurretById(payload.turretId) : null;
  }

  // ------------------------------------------------------------------------
  // Ciclo de campaña y guardado
  // ------------------------------------------------------------------------
  _onDefeat(result = {}) {
    if (this._ended) return;
    this._ended = true;
    this.saveNow('defeat_final');
    const campaign = this._buildSaveSnapshot();
    const outcome = this._buildOutcome(false, result);
    markCampaignEnded(campaign, {
      victory: false,
      customersServed: this.restaurant?.stats.customersServed || 0,
      pearls: this.restaurant?.pearls || 0
    });
    this.ui?.closeAllPanels?.();
    this._ctx.triggerRunEnd(outcome);
  }

  _onVictory(result = {}) {
    if (this._ended) return;
    this._ended = true;
    const campaign = this._buildSaveSnapshot();
    const outcome = this._buildOutcome(true, result);
    markCampaignEnded(campaign, {
      victory: true,
      customersServed: this.restaurant?.stats.customersServed || 0,
      pearls: this.restaurant?.pearls || 0
    });
    this._ctx.addRunSouls?.(50);
    this.ui?.closeAllPanels?.();
    this._ctx.triggerRunEnd(outcome);
  }

  _buildOutcome(victory, extra = {}) {
    const d = this.director;
    const stats = this.restaurant?.stats || {};
    const daysCompleted = (d?.seasonIndex || 0) * CHIRINGUITO_CONFIG.CAMPAIGN.daysPerSeason + (d?.day || 1);
    return {
      victory,
      modeId: 'core_defense',
      campaign: true,
      mapId: CHIRINGUITO_CONFIG.ISLAND.id,
      mapName: CHIRINGUITO_CONFIG.ISLAND.name,
      title: victory ? 'EL CHIRINGUITO BRILLA' : 'LA CALETA HA CAÍDO',
      cause: victory
        ? `CAMPAÑA COMPLETADA // ${stats.customersServed || 0} CLIENTES ATENDIDOS // ${this.restaurant?.pearls || 0} PERLAS`
        : `CAUSA: LA DESPENSA SE QUEDÓ SIN COMIDA EN EL DÍA ${d?.day || 1} DE LA ${d?.seasonLabel || 'TEMPORADA'}`,
      seasonIndex: d?.seasonIndex || 0,
      seasonLabel: d?.seasonLabel || 'Temporada I',
      day: d?.day || 1,
      daysCompleted,
      customersServed: stats.customersServed || 0,
      customersLost: stats.customersLost || 0,
      pearls: this.restaurant?.pearls || 0,
      reputation: this.restaurant?.reputation || 0,
      bestDish: stats.bestDish || null,
      coreHpLeft: d?.pantryLives || 0,
      coreMaxHp: d?.pantryMax || 1,
      bossesDefeated: this.bossesDefeated,
      wavesCompleted: (d?.seasonIndex || 0) * 30 + (d?.day || 1) * 2,
      currentWave: 2,
      totalWaves: 90,
      ...extra
    };
  }

  _buildSaveSnapshot() {
    const d = this.director;
    const turrets = (this.turretSystem?.getTurrets() || []).map(turret => ({
      typeId: turret.cfg.id,
      x: turret.group.position.x,
      y: turret.group.position.y,
      z: turret.group.position.z,
      levels: Array.isArray(turret.levels) ? [...turret.levels] : [0, 0, 0]
    }));
    return {
      seasonIndex: d?.seasonIndex || 0,
      day: d?.day || 1,
      phase: d?.phase || 'MORNING',
      routeId: d?.routeMapId || this.mapId,
      routeMapId: d?.routeMapId || this.mapId,
      director: d?.getSnapshot() || null,
      scrap: this.scrap,
      turrets,
      restaurant: this.restaurant?.serialize() || null,
      wave: this.director?.isAfternoon ? this.waveManager?.serialize?.() : null,
      enemies: this._serializeEnemies(),
      player: {
        x: this._ctx?.playerGroup?.position.x || 0,
        y: this._ctx?.playerGroup?.position.y || 0,
        z: this._ctx?.playerGroup?.position.z || 0,
        yaw: this._ctx?.playerGroup?.rotation.y || 0
      },
      carriedPlateId: this._carriedPlateId,
      bossesDefeated: this.bossesDefeated
    };
  }

  _serializeEnemies() {
    if (!this.isAuthority || !this._ctx?.enemyPool) return [];
    return this._ctx.enemyPool.active
      .filter(enemy => enemy.active && enemy.state !== 'dead')
      .map(enemy => ({
        type: enemy.type,
        isBoss: !!enemy.isBoss,
        bossId: enemy.bossData?.id || null,
        x: enemy.group.position.x,
        y: enemy.group.position.y,
        z: enemy.group.position.z,
        hp: enemy.hp,
        maxHp: enemy.maxHp,
        routeId: enemy.defenseAI?.routeId || null,
        waypointIdx: enemy.defenseAI?.waypointIdx || 0
      }));
  }

  _restoreCampaign(saved) {
    if (!saved) return;
    this._killScrapCounter = 0;
    this.director.restore(saved.director || {});
    this.restaurant.restore(saved.restaurant || {});
    // Un cierre a mitad del minijuego no conserva la sesión de cocina. El
    // ticket vuelve a la cola y mantiene sus ingredientes reservados.
    if (this.restaurant?.orders) {
      for (const order of this.restaurant.orders.orders.values()) {
        if (order.status === 'cooking') {
          order.status = 'waiting';
          order.claimantId = null;
        }
      }
      this._cookingOrderId = null;
    }
    this.scrap = Number.isFinite(saved.scrap) ? saved.scrap : (CHIRINGUITO_CONFIG.getSeason(this.director.seasonIndex).startingScrap);
    this.initialScrapTotal = this.scrap;
    this.difficulty = CHIRINGUITO_CONFIG.getSeason(this.director.seasonIndex).difficulty;
    this.bossesDefeated = saved.bossesDefeated || 0;

    if (Array.isArray(saved.turrets)) {
      for (const t of saved.turrets) {
        const cfg = CHIRINGUITO_CONFIG.TURRETS?.[t.typeId] || CONFIG.CORE_DEFENSE?.TURRETS?.[t.typeId];
        if (!cfg) continue;
        const pos = new THREE.Vector3(t.x, t.y, t.z);
        const turret = this.turretSystem.createTurret(pos, cfg);
        if (turret && Array.isArray(t.levels)) {
          t.levels.forEach((level, idx) => {
            while (turret.levels[idx] < level) {
              if (!turret.upgrade(idx)) break;
            }
          });
        }
      }
    }

    if (saved.player) {
      const p = saved.player;
      // Recalcula la cota: los saves antiguos guardaron al jugador bajo la
      // tarima con el cálculo anterior.
      const y = this._ctx.worldPhysics.getGroundHeight(p.x, p.z, 0, true, true);
      this._ctx.playerGroup.position.set(p.x, y, p.z);
      this._ctx.playerGroup.rotation.y = p.yaw || 0;
    }

    if (this.director.isAfternoon && saved.wave) {
      this.waveManager.restore(saved.wave);
      this._restoreEnemies(saved.enemies || []);
    }

    if (saved.carriedPlateId) {
      const plate = this.restaurant.orders.getPlate(saved.carriedPlateId);
      if (plate && (plate.status === 'carried' || plate.status === 'ready')) {
        if (plate.status === 'ready') this.restaurant.orders.pickPlate(plate.id, this.getActorId());
        this._carriedPlateId = plate.id;
      }
    }
    this._syncTrayVisual();
    this.island.setVisualLevel(this.restaurant.getVisualLevel());
    this._applyPhaseAtmosphere(this.director.phase, true);
    this._initialized = true;
    this._refreshUI();
  }

  _restoreEnemies(enemies) {
    if (!Array.isArray(enemies) || enemies.length === 0) return;
    const ctx = this._ctx;
    const playerPos = ctx.playerGroup.position;
    for (const data of enemies) {
      const bossCfg = data.isBoss && data.bossId
        ? (CONFIG.BOSS_SCHEDULE.find(b => b.id === data.bossId) || null)
        : null;
      const enemy = ctx.enemyPool.spawn(
        data.type,
        playerPos,
        ctx.gameTime,
        ctx.camFwd,
        ctx.worldPhysics,
        bossCfg,
        {
          isDefenseMode: true,
          routeId: data.routeId,
          pathSystem: this.pathSystem,
          hpMult: 1,
          dmgMult: 1,
          spdMult: 1,
          bossHpMult: 1
        }
      );
      if (!enemy) continue;
      enemy.group.position.set(data.x, data.y ?? 0, data.z);
      if (Number.isFinite(data.hp)) enemy.hp = data.hp;
      if (Number.isFinite(data.maxHp)) enemy.maxHp = data.maxHp;
      if (enemy.defenseAI && Number.isFinite(data.waypointIdx)) {
        enemy.defenseAI.waypointIdx = data.waypointIdx;
      }
      if (data.isBoss) this.activeBoss = enemy;
    }
  }

  saveNow(reason = 'manual') {
    if (!this.isAuthority || !this._initialized || this._ended) return false;
    if (!this.director || this._ended) return false;
    if (this._saveCooldown > 0 && reason === 'autosave') return false;
    const snapshot = this._buildSaveSnapshot();
    const ok = saveCampaign(snapshot);
    if (ok) {
      this._dirty = false;
      this._saveCooldown = 0.25;
    }
    return ok;
  }

  _clearCombatArtifacts() {
    const ctx = this._ctx;
    if (!ctx) return;
    for (const list of [ctx.bossHazards, ctx.bossProjectiles]) {
      if (!Array.isArray(list)) continue;
      for (const item of list) {
        if (item?.mesh) {
          ctx.scene.remove(item.mesh);
          disposeObject3D(item.mesh);
        }
      }
      list.length = 0;
    }
  }

  // ------------------------------------------------------------------------
  // Hooks del jugador y ciclo de vida
  // ------------------------------------------------------------------------
  isPlayerCombatActive() { return false; }
  isPlayerDamageImmune() { return true; }
  allowsLevelUpPickups() { return false; }
  getPlayerCharacterId() { return 'cook'; }
  getPlayerLoadout() { return { skills: {}, activeHand: 'none', charId: 'cook' }; }

  onPlayerLethalDamage() { return false; }
  canSkipPrep() { return false; }
  skipPrep() { return false; }
  handleTutorialKey() { return false; }

  toggleTurretRangesSafe() {
    return this.toggleTurretRanges();
  }

  cleanup() {
    if (this._initialized && this.isAuthority && !this._ended) this.saveNow('cleanup');
    if (this._pageHideHandler) {
      window.removeEventListener('pagehide', this._pageHideHandler);
      window.removeEventListener('beforeunload', this._pageHideHandler);
      this._pageHideHandler = null;
    }
    for (const unsub of this._unsubscribers) {
      try { unsub?.(); } catch (err) {}
    }
    this._unsubscribers.length = 0;
    this.ui?.destroy?.();
    this.ui = null;
    if (this._tray?.parent) this._tray.parent.remove(this._tray);
    disposeObject3D(this._tray);
    this._tray = null;
    this.restaurant?.destroy();
    this.restaurant = null;
    this.turretSystem?.destroy();
    this.turretSystem = null;
    this.pathSystem?.destroy();
    this.pathSystem = null;
    this.spawnPointSystem?.destroy();
    this.spawnPointSystem = null;
    this.exitPointSystem?.destroy();
    this.exitPointSystem = null;
    this.waveManager = null;
    this.depotMarker?.destroy();
    this.depotMarker = null;
    this.island?.destroy();
    this.island = null;
    this._ctx?.enemyPool?.clearAll?.();
    this._clearCombatArtifacts();
    this.extraStructures.forEach(structure => structure.destroy?.());
    this.extraStructures.length = 0;
    this._carriedPlateId = null;
    this.activeBoss = null;
    this.director = null;
    this.coreMachine = null;
    this._initialized = false;
    this._ended = false;
    this._dirty = false;
    this._placingFurniture = null;
    this._furniturePlacementState = null;
    this._cookingOrderId = null;
    this.mapData = null;
    this.spawnPoints = [];
    this.exitPoints = [];
    this._resetAtmosphere();
  }

  _resetAtmosphere() {
    const scene = this._ctx?.scene;
    if (!scene) return;
    if (scene.userData.tropical) scene.userData.tropical.nightFactor = 0;
    const base = this._baseAtmosphere;
    if (!base) return;
    if (scene.fog?.color) scene.fog.color.setHex(base.fogColor);
    if (scene.fog) scene.fog.density = base.fogDensity;
    if (scene.background?.isColor) scene.background.setHex(base.backgroundColor ?? base.fogColor);
    if (this._ctx.ambientLight?.color) {
      this._ctx.ambientLight.color.setHex(base.ambientColor);
      this._ctx.ambientLight.intensity = base.ambientIntensity;
    }
    if (this._ctx.sunLight?.color) {
      this._ctx.sunLight.color.setHex(base.sunColor);
      this._ctx.sunLight.intensity = base.sunIntensity;
    }
    this._atmoState = null;
    this._atmosphereTarget = null;
  }
}
