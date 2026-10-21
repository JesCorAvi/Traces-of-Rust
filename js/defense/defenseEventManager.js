// Gestor de eventos especiales de interrupción entre oleadas (cada 3 rondas).
// Mini-modo supervivencia intenso de 2 minutos (120s) en una zona amplia de contención (radio 50m, diámetro 100m).
// Exports: DefenseEventManager.

import * as THREE from 'three';
import { CORE_DEFENSE_CONFIG } from '../config/coreDefenseConfig.js';
import { AudioSys } from '../audio.js';
import { GameEvents } from '../core/eventBus.js';
import { disposeObject3D } from '../utils/dispose.js';

export class DefenseEventManager {
  constructor(scene, worldPhysics, enemyPool, mode, ambientLight = null) {
    this.scene = scene;
    this.worldPhysics = worldPhysics;
    this.enemyPool = enemyPool;
    this.mode = mode;
    this.ambientLight = ambientLight;
    this.cfg = CORE_DEFENSE_CONFIG.WAVES.EVENTS || {
      intervalWaves: 3,
      eventDurationSec: 120.0,
      survivalRadius: 50.0,
      scrapReward: 30,
      maxEnemiesBase: 8,
      maxEnemiesPeak: 18,
      spawnIntervalStart: 2.2,
      spawnIntervalEnd: 1.1
    };

    this.activeEvent = null;
    this.visualGroup = new THREE.Group();
    this.scene.add(this.visualGroup);
    this.eventEnemies = [];
    this.pulseTimer = 0;
    this.spawnTimer = 0;
    this.warningSoundTimer = 0;
    this.boundaryLeds = [];
    this.beamMesh = null;
    this.diamondMesh = null;
    this.haloMesh = null;
    this.redAtmosphereActive = false;
    this.lastCtx = null;
  }

  isEventActive() {
    return this.activeEvent !== null;
  }

  getActiveEventInfo() {
    if (!this.activeEvent) return null;

    const ev = this.activeEvent;
    const remainingSec = Math.max(0, Math.ceil(ev.duration - ev.elapsedSurvivalTime));
    const mins = Math.floor(remainingSec / 60);
    const secs = (remainingSec % 60).toString().padStart(2, '0');
    const timeStr = `${mins}:${secs}`;
    const aliveCount = this.eventEnemies.filter(e => e.active && e.state !== 'dead').length;
    const article = ev.article || 'la';

    let subTaskText = '';
    if (ev.playerInRadius) {
      subTaskText = `SUPERVIVENCIA: ${timeStr} · ${aliveCount} HOSTILES`;
    } else {
      const distOutside = Math.max(1, Math.round(ev.distToPlayer - ev.radius));
      subTaskText = `¡VUELVE AL PERÍMETRO! // A ${distOutside}m`;
    }

    let badgeText = 'ASALTO DE CONTENCIÓN';
    if (ev.intensityPhase === 3) {
      badgeText = '¡CLÍMAX DE SUPERVIVENCIA!';
    } else if (ev.intensityPhase === 2) {
      badgeText = 'ENJAMBRE EN AUMENTO';
    }

    const titlePrefix = ev.type === 'repair'
      ? `Defiende ${article} ${ev.targetName}`
      : `Sobrevive a la purga en ${ev.targetName}`;

    return {
      type: ev.type,
      badgeText,
      objectiveText: `${titlePrefix} [${timeStr}]`,
      subTaskText,
      progress: ev.progress,
      phase: ev.intensityPhase || 1,
      timeRemaining: remainingSec,
      timeStr,
      playerInRadius: !!ev.playerInRadius,
      distOutside: Math.max(0, Math.round((ev.distToPlayer || 0) - ev.radius)),
      aliveCount
    };
  }

  startEvent(type = 'repair', options = {}) {
    this.cleanupVisuals();

    let loc;
    let targetPos;
    if (options.position && Number.isFinite(options.position.x)) {
      targetPos = new THREE.Vector3(options.position.x, options.position.y, options.position.z);
      loc = {
        name: options.targetName || 'ZONA DE CONTENCIÓN',
        article: options.article || 'la'
      };
    } else {
      const locations = [
        { x: 22, z: -16, name: 'SUBESTACIÓN ESTE', article: 'la' },
        { x: -22, z: 14, name: 'GENERADOR OESTE', article: 'el' },
        { x: 0, z: -26, name: 'CONSOLA NORTE', article: 'la' },
        { x: 18, z: 22, name: 'RELÉ SUR', article: 'el' }
      ];
      loc = locations[Math.floor(Math.random() * locations.length)];
      const gy = this.worldPhysics ? this.worldPhysics.getGroundHeight(loc.x, loc.z, 0, true) : 0;
      targetPos = new THREE.Vector3(loc.x, gy, loc.z);
    }

    const duration = Number.isFinite(options.duration) ? options.duration : (this.cfg.eventDurationSec || 120.0);
    const radius = Number.isFinite(options.radius) ? options.radius : (this.cfg.survivalRadius || 50.0);
    const scrapReward = this.cfg.scrapReward || 30;
    const waveIndex = Number.isFinite(options.waveIndex)
      ? options.waveIndex
      : (this.mode?.waveManager?.currentWaveIndex || 1);

    this.activeEvent = {
      type,
      targetName: loc.name,
      article: loc.article || 'la',
      position: targetPos,
      duration,
      radius,
      scrapReward,
      waveIndex,
      elapsedSurvivalTime: Number.isFinite(options.elapsed) ? options.elapsed : 0,
      progress: Number.isFinite(options.progress) ? options.progress : 0,
      playerInRadius: false,
      distToPlayer: 999,
      intensityPhase: Number.isFinite(options.phase) ? options.phase : 1,
      warnedPhase2: false,
      warnedPhase3: false
    };

    if (this.activeEvent.intensityPhase === 3) {
      this.activateRedAtmosphere(this.lastCtx);
        AudioSys.playIndustrialSiren?.();
        const networkHud = this.lastCtx?.hudController || this.mode?.net?.ctx?.hudController;
        networkHud?.showKineticAlertBanner?.({
          tag: '¡ALERTA MÁXIMA // CLÍMAX DE CONTENCIÓN!',
          title: 'FASE 3: PURGA DE WEEPERS (ÚLTIMOS 40s)',
          sub: 'HOSTILES EN MÁXIMA AGRESIVIDAD // SOBREVIVE',
          theme: 'critical',
          durationMs: 3800
        });
      if (this.beamMesh) this.beamMesh.material.color.setHex(0xff2222);
      if (this.diamondMesh) this.diamondMesh.material.color.setHex(0xff3333);
      if (this.haloMesh) this.haloMesh.material.color.setHex(0xff3333);
    }

    this.eventEnemies = [];
    this.spawnTimer = 0.5;
    this.warningSoundTimer = 0;

    // Crear marcador y perímetro 3D en el mundo
    this.buildEventWorldVisuals(targetPos, type, radius);

    // Alarma inicial de evento de emergencia
    AudioSys.setMusicState?.('CLIMAX');
    AudioSys.playIndustrialSiren?.();
    const eventLocationName = (options.targetName || loc.name || 'ZONA DE CONTENCIÓN').toUpperCase();
    const hudCtrl = this.lastCtx?.hudController || this.mode?.net?.ctx?.hudController;
    hudCtrl?.showKineticAlertBanner?.({
      tag: 'ALERTA DE SECTOR // PROTOCOLO DE CONTENCIÓN',
      title: '¡EVENTO ESPECIAL INICIADO! (120s)',
      sub: `SOBREVIVE AL ASALTO EN ${eventLocationName}`,
      theme: 'hazard',
      durationMs: 3800
    });
    AudioSys.play(140, 0.45, 'sawtooth', 0.12);
    AudioSys.play(210, 0.35, 'square', 0.08);

    GameEvents.emit('defense:event_started', {
      type,
      location: loc.name,
      position: targetPos,
      duration,
      radius
    });
  }

  buildEventWorldVisuals(pos, type, radius) {
    const isRepair = type === 'repair';
    const mainColor = isRepair ? 0xf0ad4e : 0xd9534f;

    // 1. Haz de luz vertical hacia el cielo (ignora la niebla para verse desde cualquier punto del mapa)
    const beamGeo = new THREE.CylinderGeometry(0.35, 1.4, 60, 16);
    const beamMat = new THREE.MeshBasicMaterial({
      color: mainColor,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      fog: false
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(pos.x, pos.y + 30, pos.z);
    this.visualGroup.add(beam);
    this.beamMesh = beam;

    // 2. Punto de referencia flotante elevado sobre el objetivo (holograma a 7.5m de altura)
    const markerGroup = new THREE.Group();
    markerGroup.position.set(pos.x, pos.y + 7.5, pos.z);

    const diamondGeo = new THREE.OctahedronGeometry(1.2, 0);
    const diamondMat = new THREE.MeshBasicMaterial({
      color: mainColor,
      transparent: true,
      opacity: 0.95,
      fog: false,
      depthTest: false
    });
    const diamond = new THREE.Mesh(diamondGeo, diamondMat);
    diamond.renderOrder = 999;
    markerGroup.add(diamond);
    this.diamondMesh = diamond;

    const haloGeo = new THREE.RingGeometry(1.5, 1.85, 24);
    const haloMat = new THREE.MeshBasicMaterial({
      color: mainColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
      fog: false,
      depthTest: false
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.renderOrder = 999;
    markerGroup.add(halo);
    this.haloMesh = halo;

    this.visualGroup.add(markerGroup);
    this.floatingMarker = markerGroup;

    // 3. Anillo perimetral amplio en el suelo (radio 50m, diámetro 100m)
    const ringGeo = new THREE.RingGeometry(radius - 0.45, radius, 80);
    const ringMat = new THREE.MeshBasicMaterial({
      color: mainColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(pos.x, pos.y + 0.08, pos.z);
    this.visualGroup.add(ring);
    this.pulseRing = ring;

    // Anillo interior sutil a mitad de radio
    const innerRingGeo = new THREE.RingGeometry(radius * 0.5 - 0.25, radius * 0.5, 60);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: mainColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25,
      depthWrite: false
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.set(pos.x, pos.y + 0.06, pos.z);
    this.visualGroup.add(innerRing);

    // 4. Balizas perimetrales en los bordes del área (16 postes delimitadores cada 22.5°)
    const postGeo = new THREE.BoxGeometry(0.2, 0.9, 0.2);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x221a14, roughness: 0.8 });
    const ledGeo = new THREE.BoxGeometry(0.25, 0.2, 0.25);
    const ledMat = new THREE.MeshBasicMaterial({ color: mainColor });

    this.boundaryLeds = [];
    const postCount = 16;
    for (let i = 0; i < postCount; i++) {
      const ang = (i / postCount) * Math.PI * 2;
      const bx = pos.x + Math.sin(ang) * radius;
      const bz = pos.z + Math.cos(ang) * radius;
      const by = this.worldPhysics ? this.worldPhysics.getGroundHeight(bx, bz, 0, true) : pos.y;

      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(bx, by + 0.45, bz);

      const led = new THREE.Mesh(ledGeo, ledMat);
      led.position.set(bx, by + 0.95, bz);

      this.visualGroup.add(post, led);
      this.boundaryLeds.push(led);
    }

    // 5. Estructura o consola central
    const consoleGeo = new THREE.BoxGeometry(0.9, 1.3, 0.9);
    const consoleMat = new THREE.MeshStandardMaterial({
      color: 0x221a14,
      metalness: 0.6,
      roughness: 0.7
    });
    const terminal = new THREE.Mesh(consoleGeo, consoleMat);
    terminal.position.set(pos.x, pos.y + 0.65, pos.z);
    terminal.castShadow = true;

    // Baliza superior parpadeante
    const beaconLightGeo = new THREE.BoxGeometry(0.35, 0.28, 0.35);
    const beaconLightMat = new THREE.MeshBasicMaterial({ color: mainColor });
    const beaconLight = new THREE.Mesh(beaconLightGeo, beaconLightMat);
    beaconLight.position.set(pos.x, pos.y + 1.45, pos.z);

    this.visualGroup.add(terminal, beaconLight);
    this.beaconMesh = beaconLight;
  }

  update(dt, ctx) {
    if (!this.activeEvent) return;

    this.lastCtx = ctx;
    if (ctx?.ambientLight && !this.ambientLight) {
      this.ambientLight = ctx.ambientLight;
    }

    const ev = this.activeEvent;
    this.pulseTimer += dt;

    // Animación visual del perímetro y balizas
    if (this.pulseRing) {
      const scale = 1 + Math.sin(this.pulseTimer * 3.5) * 0.04;
      this.pulseRing.scale.set(scale, scale, 1);
      // Si el jugador está fuera del perímetro, el anillo parpadea en rojo advertencia
      if (!ev.playerInRadius) {
        this.pulseRing.material.color.setHex(Math.sin(this.pulseTimer * 10) > 0 ? 0xff2222 : 0x881111);
      } else if (ev.intensityPhase === 3) {
        // En Fase 3 (Clímax), el anillo pulsa en rojo sangre amenazante
        this.pulseRing.material.color.setHex(Math.sin(this.pulseTimer * 8) > 0 ? 0xff2222 : 0x991111);
      } else {
        const isRepair = ev.type === 'repair';
        this.pulseRing.material.color.setHex(isRepair ? 0xf0ad4e : 0xd9534f);
      }
    }

    if (this.beaconMesh) {
      this.beaconMesh.visible = Math.sin(this.pulseTimer * 6) > -0.2;
    }

    for (let i = 0; i < this.boundaryLeds.length; i++) {
      this.boundaryLeds[i].visible = Math.sin(this.pulseTimer * 5 + i) > -0.1;
    }

    if (this.floatingMarker) {
      this.floatingMarker.rotation.y += dt * 1.8;
      const baseY = ev.position.y + 7.5;
      this.floatingMarker.position.y = baseY + Math.sin(this.pulseTimer * 3.5) * 0.45;
    }

    // Comprobación de distancia del jugador a la zona amplia (radio 50m, diámetro 100m)
    const playerPos = ctx.playerGroup.position;
    const distToPlayer = Math.hypot(playerPos.x - ev.position.x, playerPos.z - ev.position.z);
    ev.distToPlayer = distToPlayer;

    const inZone = distToPlayer <= ev.radius;
    ev.playerInRadius = inZone;

    // Cliente: el Host dicta temporizador, fase, spawns y final del evento.
    // Solo se animan perímetro/balizas y se calcula la distancia para el HUD.
    if (this.mode?.isNetworked && !this.mode?.isNetworkHost) {
      this.eventEnemies = this.eventEnemies.filter(e => e.active && e.state !== 'dead');
      return;
    }

    if (inZone) {
      // El temporizador avanza mientras el jugador defiende el perímetro
      ev.elapsedSurvivalTime += dt;
      ev.progress = Math.min(1.0, ev.elapsedSurvivalTime / ev.duration);
    } else {
      // Advertencia sonora periódica si está fuera del perímetro
      this.warningSoundTimer += dt;
      if (this.warningSoundTimer >= 1.8) {
        this.warningSoundTimer = 0;
        AudioSys.play(180, 0.12, 'sawtooth', 0.05);
      }
    }

    // Gestión de Fases de Intensidad a lo largo de los 2 minutos (120s)
    if (ev.elapsedSurvivalTime < 40) {
      ev.intensityPhase = 1;
    } else if (ev.elapsedSurvivalTime < 80) {
      ev.intensityPhase = 2;
      if (!ev.warnedPhase2) {
        ev.warnedPhase2 = true;
        AudioSys.playBossHorn?.();
        ctx.triggerScare?.(0.3);
      }
    } else {
      ev.intensityPhase = 3; // ¡CLÍMAX FINAL (últimos 40s)!
      if (!ev.warnedPhase3) {
        ev.warnedPhase3 = true;
        this.activateRedAtmosphere(ctx);
        AudioSys.playIndustrialSiren?.();
        ctx?.hudController?.showKineticAlertBanner?.({
          tag: '¡ALERTA MÁXIMA // CLÍMAX DE CONTENCIÓN!',
          title: 'FASE 3: PURGA DE WEEPERS (ÚLTIMOS 40s)',
          sub: 'HOSTILES EN MÁXIMA AGRESIVIDAD // SOBREVIVE',
          theme: 'critical',
          durationMs: 3800
        });
      }
      // En Fase 3, el haz y holograma reflejan el color de alerta roja apocalíptica
      if (this.beamMesh) this.beamMesh.material.color.setHex(0xff2222);
      if (this.diamondMesh) this.diamondMesh.material.color.setHex(0xff3333);
      if (this.haloMesh) this.haloMesh.material.color.setHex(0xff3333);
    }

    // Parámetros dinámicos según la fase de supervivencia y oleada alcanzada
    const waveIdx = ev.waveIndex || 1;
    const waveProgress = Math.max(0, waveIdx - 1);
    const waveHpMult = 1 + waveProgress * (this.cfg.hpScalingPerWave || 0.16);
    const waveDmgMult = 1 + waveProgress * (this.cfg.dmgScalingPerWave || 0.08);

    let maxAlive = this.cfg.maxEnemiesBase || 30;
    let spawnInterval = this.cfg.spawnIntervalStart || 0.65;
    let hpMult = waveHpMult;
    let spdMult = 1.0;
    let dmgMult = waveDmgMult;

    if (ev.intensityPhase === 2) {
      maxAlive = Math.round(((this.cfg.maxEnemiesBase || 30) + (this.cfg.maxEnemiesPeak || 65)) * 0.5);
      spawnInterval = ((this.cfg.spawnIntervalStart || 0.65) + (this.cfg.spawnIntervalEnd || 0.22)) * 0.5;
      hpMult = waveHpMult * 1.1;
      spdMult = 1.12;
      dmgMult = waveDmgMult * 1.1;
    } else if (ev.intensityPhase === 3) {
      maxAlive = this.cfg.maxEnemiesPeak || 65;
      spawnInterval = this.cfg.spawnIntervalEnd || 0.22;
      hpMult = waveHpMult * 1.25;
      spdMult = 1.2;
      dmgMult = waveDmgMult * 1.2;
    }

    // Limpiar enemigos muertos del array
    this.eventEnemies = this.eventEnemies.filter(e => e.active && e.state !== 'dead');

    // Generación de oleadas envolventes alrededor del perímetro
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.eventEnemies.length < maxAlive) {
      this.spawnTimer = spawnInterval;
      this.spawnPerimeterAssaultWave(ctx, ev, hpMult, spdMult, dmgMult, maxAlive);
    }

    // Si ha completado los 2 minutos (120 segundos) en el perímetro
    if (ev.progress >= 1.0) {
      this.completeEvent();
    }
  }

  /**
   * Spawnea enemigos de asalto distribuidos por todo el mapa (compuertas y sectores amplios)
   * dirigiéndose hacia la posición del jugador, otorgando espacio táctico para maniobrar y esquivar.
   */
  spawnPerimeterAssaultWave(ctx, ev, hpMult, spdMult, dmgMult, maxAlive = 30) {
    const aliveCount = this.eventEnemies.length;
    const remainingSlots = Math.max(1, maxAlive - aliveCount);
    const burstSize = ev.intensityPhase === 3 ? Math.floor(4 + Math.random() * 3) : (ev.intensityPhase === 2 ? Math.floor(3 + Math.random() * 2) : Math.floor(2 + Math.random() * 2));
    const countToSpawn = Math.min(burstSize, remainingSlots);
    const playerPos = ctx.playerGroup.position;
    const mapSpawnPoints = this.mode?.spawnPointSystem ? this.mode.spawnPointSystem.getAllSpawnPoints() : [];

    for (let i = 0; i < countToSpawn; i++) {
      let sx, sz;
      // 35% de probabilidad de emerger de compuertas/portales del mapa; 65% dispersos por el mapa
      if (mapSpawnPoints.length > 0 && Math.random() < 0.35) {
        const sp = mapSpawnPoints[Math.floor(Math.random() * mapSpawnPoints.length)];
        const jitterAng = Math.random() * Math.PI * 2;
        const jitterDist = Math.random() * 5.0;
        sx = sp.position.x + Math.sin(jitterAng) * jitterDist;
        sz = sp.position.z + Math.cos(jitterAng) * jitterDist;
      } else {
        // Dispersos por todo el mapa en abanico 360°, a distancia amplia (38m a 72m)
        const ang = Math.random() * Math.PI * 2;
        const dist = 38.0 + Math.random() * 34.0;
        sx = playerPos.x + Math.sin(ang) * dist;
        sz = playerPos.z + Math.cos(ang) * dist;
      }

      // Margen de seguridad: asegurar que nunca spawneen a menos de 32m del jugador
      const distToPlayer = Math.hypot(sx - playerPos.x, sz - playerPos.z);
      if (distToPlayer < 32.0) {
        const pushAng = Math.atan2(sx - playerPos.x, sz - playerPos.z) || (Math.random() * Math.PI * 2);
        sx = playerPos.x + Math.sin(pushAng) * 42.0;
        sz = playerPos.z + Math.cos(pushAng) * 42.0;
      }

      const sy = this.worldPhysics ? this.worldPhysics.getGroundHeight(sx, sz, 0, true) : 0;

      // Composición de enemigos según la fase
      let type = 'zombie';
      const roll = Math.random();
      if (ev.intensityPhase === 1) {
        type = roll < 0.7 ? 'zombie' : 'worm';
      } else if (ev.intensityPhase === 2) {
        type = roll < 0.5 ? 'zombie' : (roll < 0.75 ? 'worm' : 'weeper');
      } else {
        // En Fase 3 (Clímax): alta presencia de Weepers (disparan a distancia) y zombis de choque
        type = roll < 0.4 ? 'zombie' : (roll < 0.7 ? 'weeper' : 'worm');
      }

      const enemy = this.enemyPool.spawn(
        type,
        playerPos,
        ctx.gameTime,
        ctx.camFwd,
        this.worldPhysics,
        null,
        {
          isDefenseMode: false, // Atacan directamente y convergen hacia el jugador
          isEventEnemy: true,
          hpMult,
          dmgMult,
          spdMult
        }
      );

      if (enemy) {
        enemy.group.position.set(sx, sy, sz);
        enemy.isEventEnemy = true;
        enemy.defenseAI = null; // No siguen vías de escape
        this.eventEnemies.push(enemy);
      }
    }
  }

  onEnemyKilled(enemy) {
    if (!this.activeEvent) return;
    if (enemy.isEventEnemy) {
      AudioSys.play(260, 0.08, 'triangle', 0.04);
    }
  }

  /**
   * Activa la atmósfera roja de pesadilla inspirada en el último boss de Supervivencia:
   * viñeta roja profunda, niebla densa carmesí (0x160303), luz ambiental roja (0x3a0808)
   * y drone de subgraves perturbador.
   */
  activateRedAtmosphere(ctx) {
    if (this.redAtmosphereActive) return;
    this.redAtmosphereActive = true;
    document.body.classList.add('endgame-mode');

    const c = ctx || this.lastCtx;
    const scene = c?.scene || this.scene;
    if (scene?.fog) {
      scene.fog.color.setHex(0x160303);
      scene.fog.density = 0.058;
    }

    const amb = c?.ambientLight || this.ambientLight;
    if (amb) {
      amb.color.setHex(0x3a0808);
    }

    AudioSys.setEndgameDrone(true);
    AudioSys.playBossHorn?.();
    c?.triggerScare?.(0.5);
  }

  /**
   * Restaura la atmósfera normal de defensa (niebla 0x040604, luz 0x212b20, quita viñeta y drone).
   */
  deactivateRedAtmosphere() {
    if (!this.redAtmosphereActive) return;
    document.body.classList.remove('endgame-mode');

    const c = this.lastCtx;
    const scene = c?.scene || this.scene;
    if (scene?.fog) {
      scene.fog.color.setHex(0x040604);
      scene.fog.density = 0.035;
    }

    const amb = c?.ambientLight || this.ambientLight;
    if (amb) {
      amb.color.setHex(0x212b20);
    }

    AudioSys.setEndgameDrone(false);
    this.redAtmosphereActive = false;
  }

  applyNetworkState(data) {
    if (!this.activeEvent || !data) return;
    const ev = this.activeEvent;
    if (Number.isFinite(data.elapsed)) ev.elapsedSurvivalTime = Math.max(0, data.elapsed);
    if (Number.isFinite(data.progress)) ev.progress = Math.max(0, Math.min(1, data.progress));
    if (Number.isFinite(data.phase) && data.phase !== ev.intensityPhase) {
      ev.intensityPhase = data.phase;
      if (data.phase === 3) {
        this.activateRedAtmosphere(this.lastCtx);
        if (this.beamMesh) this.beamMesh.material.color.setHex(0xff2222);
        if (this.diamondMesh) this.diamondMesh.material.color.setHex(0xff3333);
        if (this.haloMesh) this.haloMesh.material.color.setHex(0xff3333);
      } else {
        this.deactivateRedAtmosphere();
      }
    }
    this.eventEnemies = this.eventEnemies.filter(e => e.active && e.state !== 'dead');
  }

  completeEvent(options = {}) {
    if (!this.activeEvent) return;
    const fromNetwork = !!options.fromNetwork;

    // Restaurar la atmósfera antes de concluir
    this.deactivateRedAtmosphere();

    const ev = this.activeEvent;
    const scrapReward = ev.scrapReward || 30;

    // En el Cliente la recompensa ya viaja por SCRAP_GAIN desde el Host.
    if (!fromNetwork) this.mode.addScrap(scrapReward);

    // Sonidos triunfales
    AudioSys.setMusicState?.('PREP');
    AudioSys.playUISelect();
    AudioSys.play(380, 0.25, 'triangle', 0.09);
    AudioSys.play(520, 0.35, 'sine', 0.1);

    // Eliminar o pacificar enemigos del evento restantes
    this.eventEnemies.forEach(e => {
      if (e.active && e.state !== 'dead') {
        e.hp = 0;
        e.state = 'dead';
        e.stateTimer = 0;
      }
    });
    this.eventEnemies.length = 0;

    const eventTitle = ev.type === 'repair'
      ? 'SUBESTACIÓN DEFENDIDA'
      : 'SECTOR PURGADO';

    GameEvents.emit('defense:event_completed', {
      type: ev.type,
      scrapReward,
      title: eventTitle
    });

    const completionHud = this.lastCtx?.hudController || this.mode?.net?.ctx?.hudController;
    completionHud?.showKineticAlertBanner?.({
      tag: 'SECTOR ASEGURADO // RECOMPENSA OBTENIDA',
      title: `¡EVENTO DE CONTENCIÓN SUPERADO! +${scrapReward} CHATARRA`,
      sub: 'ZONA PACIFICADA // SISTEMAS DEFENSIVOS REFORZADOS',
      theme: 'success',
      durationMs: 3800
    });

    this.cleanupVisuals();
    this.activeEvent = null;

    // Reanudar la preparación de oleadas en WaveManager
    if (this.mode.waveManager) {
      this.mode.waveManager.completeSpecialEvent();
    }
  }

  cleanupVisuals() {
    while (this.visualGroup.children.length > 0) {
      const child = this.visualGroup.children[0];
      this.visualGroup.remove(child);
      disposeObject3D(child);
    }
    this.pulseRing = null;
    this.beaconMesh = null;
    this.floatingMarker = null;
    this.beamMesh = null;
    this.diamondMesh = null;
    this.haloMesh = null;
    this.boundaryLeds.length = 0;
  }

  cleanup() {
    this.deactivateRedAtmosphere();
    this.cleanupVisuals();
    if (this.visualGroup) {
      this.scene.remove(this.visualGroup);
      disposeObject3D(this.visualGroup);
    }
    this.eventEnemies.length = 0;
    this.activeEvent = null;
    this.lastCtx = null;
  }
}
