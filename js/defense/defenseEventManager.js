// Gestor de eventos especiales de interrupción entre oleadas (cada X rondas).
// Tipos de evento: Reparación de Subestación y Purga de Infestación.
// Exports: DefenseEventManager.

import * as THREE from 'three';
import { CORE_DEFENSE_CONFIG } from '../config/coreDefenseConfig.js';
import { AudioSys } from '../audio.js';
import { GameEvents } from '../core/eventBus.js';
import { disposeObject3D } from '../utils/dispose.js';

export class DefenseEventManager {
  constructor(scene, worldPhysics, enemyPool, mode) {
    this.scene = scene;
    this.worldPhysics = worldPhysics;
    this.enemyPool = enemyPool;
    this.mode = mode;
    this.cfg = CORE_DEFENSE_CONFIG.WAVES.EVENTS || {
      intervalWaves: 3,
      repairDurationSec: 8.5,
      repairRadius: 3.2,
      repairScrapReward: 30,
      infestationHostileCount: 12,
      infestationScrapReward: 35
    };

    this.activeEvent = null;
    this.visualGroup = new THREE.Group();
    this.scene.add(this.visualGroup);
    this.eventEnemies = [];
    this.pulseTimer = 0;
    this.spawnTimer = 0;
  }

  isEventActive() {
    return this.activeEvent !== null;
  }

  getActiveEventInfo() {
    if (!this.activeEvent) return null;

    if (this.activeEvent.type === 'repair') {
      const pct = Math.min(100, Math.floor(this.activeEvent.progress * 100));
      const inZone = this.activeEvent.playerInRadius;
      return {
        type: 'repair',
        badgeText: 'REPARACIÓN EN CURSO',
        objectiveText: `Repara la ${this.activeEvent.targetName}`,
        subTaskText: inZone
          ? `REPARANDO: ${pct}% · ¡HOSTILES ATACANDO!`
          : `▲ [${this.activeEvent.targetName} // ${Math.round(this.activeEvent.distToPlayer || 0)}m]`,
        progress: this.activeEvent.progress
      };
    } else {
      const remaining = this.eventEnemies.filter(e => e.active && e.state !== 'dead').length;
      return {
        type: 'infestation',
        badgeText: 'BROTE DE INFESTACIÓN',
        objectiveText: `Purga el nido en ${this.activeEvent.targetName}`,
        subTaskText: `▲ [${this.activeEvent.targetName} // ${Math.round(this.activeEvent.distToPlayer || 0)}m] · ${remaining} HOSTILES`,
        progress: 1 - (remaining / Math.max(1, this.activeEvent.totalEnemies))
      };
    }
  }

  startEvent(type = 'repair') {
    this.cleanupVisuals();

    const locations = [
      { x: 22, z: -16, name: 'SUBESTACIÓN ESTE' },
      { x: -22, z: 14, name: 'GENERADOR OESTE' },
      { x: 0, z: -26, name: 'CONSOLA DE CONTROL NORTE' },
      { x: 18, z: 22, name: 'RELAIS DE ENERGÍA SUR' }
    ];
    const loc = locations[Math.floor(Math.random() * locations.length)];
    const gy = this.worldPhysics ? this.worldPhysics.getGroundHeight(loc.x, loc.z, 0, true) : 0;
    const targetPos = new THREE.Vector3(loc.x, gy, loc.z);

    this.activeEvent = {
      type,
      targetName: loc.name,
      position: targetPos,
      progress: 0,
      playerInRadius: false,
      distToPlayer: 999,
      totalEnemies: this.cfg.infestationHostileCount || 12,
      repairSoundTimer: 0
    };

    this.eventEnemies = [];
    this.spawnTimer = 0.5;

    // Crear marcador 3D en el mundo
    this.buildEventWorldVisuals(targetPos, type);

    // Sonido de alarma industrial
    AudioSys.play(140, 0.45, 'sawtooth', 0.12);
    AudioSys.play(210, 0.35, 'square', 0.08);

    GameEvents.emit('defense:event_started', {
      type,
      location: loc.name,
      position: targetPos
    });
  }

  buildEventWorldVisuals(pos, type) {
    const isRepair = type === 'repair';
    const mainColor = isRepair ? 0xf0ad4e : 0xd9534f;

    // 1. Haz de luz vertical prominente hacia el cielo (ignora la niebla para verse desde lejos)
    const beamGeo = new THREE.CylinderGeometry(0.35, 1.4, 60, 16);
    const beamMat = new THREE.MeshBasicMaterial({
      color: mainColor,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      fog: false // ¡Sin niebla: visible desde cualquier rincón del mapa!
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(pos.x, pos.y + 30, pos.z);
    this.visualGroup.add(beam);

    // 2. Punto de referencia flotante elevado sobre el objetivo (holograma que se ve desde lejos)
    const markerGroup = new THREE.Group();
    markerGroup.position.set(pos.x, pos.y + 7.5, pos.z);

    const diamondGeo = new THREE.OctahedronGeometry(1.1, 0);
    const diamondMat = new THREE.MeshBasicMaterial({
      color: mainColor,
      transparent: true,
      opacity: 0.95,
      fog: false,
      depthTest: false // Visible a través de paredes y obstáculos
    });
    const diamond = new THREE.Mesh(diamondGeo, diamondMat);
    diamond.renderOrder = 999;
    markerGroup.add(diamond);

    // Halo circular flotante
    const haloGeo = new THREE.RingGeometry(1.4, 1.7, 24);
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

    this.visualGroup.add(markerGroup);
    this.floatingMarker = markerGroup;

    // 3. Anillo de radio en el suelo
    const radius = isRepair ? (this.cfg.repairRadius || 3.2) : 5.0;
    const ringGeo = new THREE.RingGeometry(radius - 0.25, radius, 32);
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

    // 4. Estructura o consola central
    const consoleGeo = new THREE.BoxGeometry(0.8, 1.2, 0.8);
    const consoleMat = new THREE.MeshStandardMaterial({
      color: 0x221a14,
      metalness: 0.6,
      roughness: 0.7
    });
    const terminal = new THREE.Mesh(consoleGeo, consoleMat);
    terminal.position.set(pos.x, pos.y + 0.6, pos.z);
    terminal.castShadow = true;

    // Baliza superior parpadeante
    const beaconLightGeo = new THREE.BoxGeometry(0.3, 0.25, 0.3);
    const beaconLightMat = new THREE.MeshBasicMaterial({ color: mainColor });
    const beaconLight = new THREE.Mesh(beaconLightGeo, beaconLightMat);
    beaconLight.position.set(pos.x, pos.y + 1.35, pos.z);

    this.visualGroup.add(terminal, beaconLight);
    this.beaconMesh = beaconLight;
  }

  update(dt, ctx) {
    if (!this.activeEvent) return;

    this.pulseTimer += dt;
    if (this.pulseRing) {
      const scale = 1 + Math.sin(this.pulseTimer * 4) * 0.08;
      this.pulseRing.scale.set(scale, scale, 1);
    }
    if (this.beaconMesh) {
      this.beaconMesh.visible = Math.sin(this.pulseTimer * 6) > -0.2;
    }
    if (this.floatingMarker) {
      this.floatingMarker.rotation.y += dt * 1.8;
      const baseY = this.activeEvent.position.y + 7.5;
      this.floatingMarker.position.y = baseY + Math.sin(this.pulseTimer * 3.5) * 0.45;
    }

    const playerPos = ctx.playerGroup.position;
    const ev = this.activeEvent;
    const distToPlayer = Math.hypot(playerPos.x - ev.position.x, playerPos.z - ev.position.z);
    ev.distToPlayer = distToPlayer;

    if (ev.type === 'repair') {
      const inRadius = distToPlayer <= (this.cfg.repairRadius || 3.2);
      ev.playerInRadius = inRadius;

      if (inRadius) {
        const repairRate = 1.0 / (this.cfg.repairDurationSec || 8.5);
        ev.progress = Math.min(1.0, ev.progress + dt * repairRate);

        ev.repairSoundTimer = (ev.repairSoundTimer || 0) + dt;
        if (ev.repairSoundTimer >= 0.28) {
          ev.repairSoundTimer = 0;
          AudioSys.play(320 + Math.random() * 80, 0.05, 'square', 0.03);
        }

        if (ev.progress >= 1.0) {
          this.completeEvent();
          return;
        }
      }

      // Generar enemigos que emboscan al jugador mientras repara
      this.spawnTimer -= dt;
      const aliveEventCount = this.eventEnemies.filter(e => e.active && e.state !== 'dead').length;
      if (this.spawnTimer <= 0 && aliveEventCount < 6) {
        this.spawnTimer = 2.2;
        this.spawnAmbushEnemy(ctx, playerPos);
      }
    } else if (ev.type === 'infestation') {
      // Si la infestación no ha spawneado su tanda inicial
      if (this.eventEnemies.length === 0) {
        this.spawnInfestationSwarm(ctx, ev.position, ev.totalEnemies);
      }

      const remaining = this.eventEnemies.filter(e => e.active && e.state !== 'dead').length;
      if (remaining === 0 && this.eventEnemies.length > 0) {
        this.completeEvent();
      }
    }
  }

  spawnAmbushEnemy(ctx, playerPos) {
    const ang = Math.random() * Math.PI * 2;
    const dist = 12 + Math.random() * 8;
    const sx = playerPos.x + Math.sin(ang) * dist;
    const sz = playerPos.z + Math.cos(ang) * dist;
    const sy = this.worldPhysics ? this.worldPhysics.getGroundHeight(sx, sz, 0, true) : 0;

    const type = Math.random() < 0.65 ? 'zombie' : 'worm';
    const enemy = this.enemyPool.spawn(
      type,
      playerPos,
      ctx.gameTime,
      ctx.camFwd,
      this.worldPhysics,
      null,
      {
        isDefenseMode: false, // ¡No va por las vías de TD, ataca al jugador directamente!
        hpMult: 0.9,          // Vida equilibrada de supervivencia para que el jugador se encargue solo
        dmgMult: 1.0,
        spdMult: 1.0
      }
    );

    if (enemy) {
      enemy.group.position.set(sx, sy, sz);
      enemy.isEventEnemy = true;
      enemy.defenseAI = null; // No sigue carriles de escape
      this.eventEnemies.push(enemy);
    }
  }

  spawnInfestationSwarm(ctx, centerPos, count) {
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const r = 2.0 + Math.random() * 3.5;
      const sx = centerPos.x + Math.sin(ang) * r;
      const sz = centerPos.z + Math.cos(ang) * r;
      const sy = this.worldPhysics ? this.worldPhysics.getGroundHeight(sx, sz, 0, true) : 0;

      const type = i % 3 === 2 ? 'weeper' : (i % 2 === 0 ? 'zombie' : 'worm');
      const enemy = this.enemyPool.spawn(
        type,
        ctx.playerGroup.position,
        ctx.gameTime,
        ctx.camFwd,
        this.worldPhysics,
        null,
        {
          isDefenseMode: false,
          hpMult: 0.95,
          dmgMult: 1.0,
          spdMult: 1.05
        }
      );

      if (enemy) {
        enemy.group.position.set(sx, sy, sz);
        enemy.isEventEnemy = true;
        enemy.defenseAI = null;
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

  completeEvent() {
    if (!this.activeEvent) return;

    const isRepair = this.activeEvent.type === 'repair';
    const scrapReward = isRepair
      ? (this.cfg.repairScrapReward || 30)
      : (this.cfg.infestationScrapReward || 35);

    // Otorgar chatarra extra
    this.mode.addScrap(scrapReward);

    // Sonidos triunfales
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

    const eventTitle = isRepair ? 'SUBESTACIÓN RESTAURADA' : 'INFESTACIÓN ERRADICADA';
    GameEvents.emit('defense:event_completed', {
      type: this.activeEvent.type,
      scrapReward,
      title: eventTitle
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
  }

  cleanup() {
    this.cleanupVisuals();
    if (this.visualGroup) {
      this.scene.remove(this.visualGroup);
      disposeObject3D(this.visualGroup);
    }
    this.eventEnemies.length = 0;
    this.activeEvent = null;
  }
}
