// Módulo de sincronización en tiempo real para partidas multijugador online P2P sobre Steamworks.
// Sincroniza: avatares de compañeros (RemotePlayers), posiciones 3D a 20Hz con seq, animación
// direccional, disparos/ataques, torretas colocadas/mejoradas/vendidas, economía de chatarra
// (reparto de suma cero + transferencias) y, con Host autoritativo, oleadas y estado del núcleo.

import * as THREE from 'three';
import { createBillboardSprite } from '../entities.js';
import { getPlayerLoadoutSheet } from '../spritesheets.js';
import { getCharacterById } from '../config/charactersConfig.js';
import { GameEvents } from '../core/eventBus.js';
import { CORE_DEFENSE_CONFIG } from '../config/coreDefenseConfig.js';
import { CONFIG } from '../config.js';
import { AudioSys } from '../audio.js';
import { spawnEnemyProjectile } from '../combat.js';
import { ModeManager } from '../modes/gameModeManager.js';
import { getCurrentLobbyData, getLocalPlayerSteamId, launchClientMatch, getLastLaunchedMatchTimestamp, setLastLaunchedMatchTimestamp } from './steamLobbyUI.js';

// Generador de etiquetas flotantes tácticas para jugadores remotos
function createNameplateSprite(nameText) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  function draw(hp = 100, maxHp = 100, down = false, downTimer = 0) {
    ctx.clearRect(0, 0, 256, 64);

    // Fondo oscuro militar
    ctx.fillStyle = 'rgba(5, 8, 5, 0.90)';
    ctx.fillRect(8, 8, 240, 48);
    ctx.strokeStyle = down ? '#6b2424' : '#2b442b';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, 240, 48);

    // Nombre / Rol de Operador
    ctx.font = 'bold 13px "Press Start 2P", monospace, sans-serif';
    ctx.fillStyle = down ? '#ff6b6b' : '#8ef77b';
    ctx.textAlign = 'center';
    ctx.fillText(nameText, 128, 27);

    if (down) {
      ctx.font = 'bold 11px "Press Start 2P", monospace, sans-serif';
      ctx.fillStyle = '#ffb0a0';
      const secs = Math.max(0, Math.ceil(downTimer || 0));
      ctx.fillText(`RECONSTRUYENDO ${secs}s`, 128, 47);
      return;
    }

    // Barra de Salud de fondo
    ctx.fillStyle = '#3a1212';
    ctx.fillRect(18, 36, 220, 12);

    // Barra de Salud rellena
    const pct = Math.max(0, Math.min(1, hp / (maxHp || 100)));
    ctx.fillStyle = pct > 0.35 ? '#55de3e' : '#ff4444';
    ctx.fillRect(18, 36, 220 * pct, 12);

    ctx.strokeStyle = '#182418';
    ctx.lineWidth = 1;
    ctx.strokeRect(18, 36, 220, 12);
  }

  draw(100, 100);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;

  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2.4, 0.6, 1);
  sprite.position.set(0, 2.35, 0);

  return { sprite, texture, draw };
}

// Representación 3D del compañero en la escena (espejo exacto del jugador local)
class RemotePlayer {
  constructor(steamId, scene) {
    this.steamId = steamId;
    this.scene = scene;

    // Sprite 2.0 idéntico al jugador local
    this.billboard = createBillboardSprite('player', 2.0);
    this.billboard.mesh.castShadow = false;
    this.billboard.mesh.receiveShadow = false;
    this.billboard.mesh.material.roughness = 0.6;
    this.billboard.mesh.material.emissive = new THREE.Color(0x92c28a);
    this.billboard.mesh.material.emissiveMap = this.billboard.tex;
    this.billboard.mesh.material.emissiveIntensity = 0.75;
    this.billboard.mesh.material.needsUpdate = true;

    // Vinculación directa al grupo del billboard para cálculos correctos de faceCamera()
    this.group = this.billboard.group;

    // Luz de linterna sutil del compañero para distinguirlo en la niebla y oscuridad
    this.lanternLight = new THREE.PointLight(0x75f085, 22, 8.5, 1.4);
    this.lanternLight.position.set(0, 1.4, 0);
    this.group.add(this.lanternLight);

    // Haz direccional que sigue yaw/pitch del compañero.
    this.flashlight = new THREE.SpotLight(0x75f085, 28, 26, 0.62, 0.5, 1.2);
    this.flashlight.position.set(0, 1.5, 0);
    this.flashlightTarget = new THREE.Object3D();
    this.group.add(this.flashlight, this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;

    // Etiqueta flotante con salud y rol (depthTest: false garantiza visibilidad permanente)
    const shortId = steamId.length > 6 ? steamId.slice(-4) : steamId;
    this.nameplate = createNameplateSprite(`CO-OP #${shortId}`);
    this.group.add(this.nameplate.sprite);

    this.scene.add(this.group);

    this.targetPos = new THREE.Vector3();
    this.facingYaw = 0;
    this.targetYaw = 0;
    this.pState = 0;
    this.pitch = 0;
    this.isMoving = false;
    this.isDown = false;
    this.downTimer = 0;
    this.hurtFlashTimer = 0;
    this.attackHoldTimer = 0;
    this.animTimer = 0;
    this.hp = 100;
    this.maxHp = 100;
    this.charId = null;
    this.isFirstPacket = true;
    this.lastPacketTime = performance.now();
    this.lastSeq = null;
    this.stale = false;

    // Inicializar inmediatamente con visual de personaje válido para evitar invisibilidad
    this.applyCharacterVisual('otto');
  }

  setTargetData(data) {
    // Descarta paquetes Unreliable reordenados o duplicados.
    if (data.seq !== undefined) {
      if (this.lastSeq !== null && data.seq <= this.lastSeq) return;
      this.lastSeq = data.seq;
    }
    this.lastPacketTime = performance.now();
    if (this.stale) {
      this.stale = false;
      this.group.visible = true;
    }
    if (data.x !== undefined && data.y !== undefined && data.z !== undefined) {
      this.targetPos.set(data.x, data.y, data.z);
      if (this.isFirstPacket) {
        this.group.position.copy(this.targetPos);
        this.isFirstPacket = false;
      }
    }
    if (data.yaw !== undefined) {
      this.targetYaw = data.yaw;
      if (this.isFirstPacket) {
        this.facingYaw = data.yaw;
      }
    }
    if (data.pitch !== undefined) this.pitch = data.pitch;
    if (data.isMoving !== undefined) this.isMoving = !!data.isMoving;
    if (data.pState !== undefined) this.pState = data.pState;

    const prevHp = this.hp;
    const hpChanged = data.hp !== undefined
      && (data.hp !== this.hp || (data.maxHp !== undefined && data.maxHp !== this.maxHp));
    if (hpChanged) {
      this.hp = data.hp;
      this.maxHp = data.maxHp || this.maxHp || 100;
      if (!this.isDown && this.hp < prevHp) this.hurtFlashTimer = 0.18;
    }

    const down = !!data.down;
    const prevDown = this.isDown;
    const prevDownSec = Math.ceil(this.downTimer);
    if (data.downTimer !== undefined) this.downTimer = Math.max(0, data.downTimer);
    const downSecChanged = Math.ceil(this.downTimer) !== prevDownSec;

    if (down !== this.isDown) {
      this.setDownState(down, this.downTimer);
      if (down && !prevDown) {
        MultiplayerSync.ctx?.hudController?.showTeammateDownAlert?.('¡COMPAÑERO ABATIDO! -50 HP AL NÚCLEO');
        AudioSys.playTacticalAlarm?.();
      }
    } else if (hpChanged || (this.isDown && downSecChanged)) {
      // Redibuja solo cuando cambia HP, estado o el segundo del contador.
      this.nameplate.draw(this.hp, this.maxHp, this.isDown, this.downTimer);
      this.nameplate.texture.needsUpdate = true;
    }

    if (data.charId && data.charId !== this.charId) {
      this.applyCharacterVisual(data.charId);
    }
  }

  setDownState(down, downTimer = 0) {
    this.isDown = !!down;
    this.downTimer = Math.max(0, downTimer);

    const mat = this.billboard.mesh.material;
    mat.transparent = this.isDown;
    mat.opacity = this.isDown ? 0.32 : 1.0;
    mat.depthWrite = !this.isDown;
    mat.needsUpdate = true;

    const glowMat = this.billboard.glowMesh.material;
    glowMat.transparent = true;
    glowMat.opacity = this.isDown ? 0.12 : 1.0;
    glowMat.needsUpdate = true;

    this.lanternLight.intensity = this.isDown ? 3 : 22;
    this.flashlight.intensity = this.isDown ? 0 : 28;

    this.nameplate.draw(this.hp, this.maxHp, this.isDown, this.downTimer);
    this.nameplate.texture.needsUpdate = true;
  }

  applyCharacterVisual(charId) {
    if (this.charId === charId && this.billboard.tex) return;
    this.charId = charId;
    const char = getCharacterById(charId);
    if (!char) return;
    try {
      const skills = { [char.weapon]: 1 };
      const sheet = getPlayerLoadoutSheet(skills, char.weapon, charId);
      if (sheet && sheet.tex) {
        sheet.tex.repeat.set(1, 1);
        sheet.tex.offset.set(0, 0);
        if (sheet.glowTex) {
          sheet.glowTex.repeat.set(1, 1);
          sheet.glowTex.offset.set(0, 0);
        }
        this.billboard.tex = sheet.tex;
        this.billboard.glowTex = sheet.glowTex;
        this.billboard.cols = sheet.cols;
        this.billboard.rows = sheet.rows;
        this.billboard.numDirs = sheet.numDirs;
        this.billboard.lastTotalCol = -1;
        this.billboard.lastDirRow = -1;
        this.billboard.mesh.material.map = sheet.tex;
        this.billboard.glowMesh.material.map = sheet.glowTex;
        this.billboard.mesh.material.emissiveMap = sheet.tex;
        this.billboard.mesh.material.needsUpdate = true;
        this.billboard.glowMesh.material.needsUpdate = true;
        this.billboard.setDirectionalFrame(this.billboard.dirRow || 0, this.pState || 0, 0);
      }
    } catch (e) {
      console.warn('[RemotePlayer] Error al aplicar visual de personaje:', e);
    }
  }

  update(dt, camAngle, camera) {
    // Timeout de desconexión: si el peer deja de enviar POS, ocultamos su avatar.
    if (performance.now() - this.lastPacketTime > 3000) {
      if (!this.stale) {
        this.stale = true;
        this.group.visible = false;
      }
      return;
    }

    // Interpolación de posición a 60 FPS
    this.group.position.lerp(this.targetPos, Math.min(1.0, dt * 18));

    // Interpolación de rotación yaw
    let diff = (this.targetYaw - this.facingYaw + Math.PI) % (Math.PI * 2) - Math.PI;
    this.facingYaw += diff * Math.min(1.0, dt * 16);

    this.billboard.facingYaw = this.facingYaw;
    this.billboard.faceCamera(camera.position);

    // Linterna verde orientada por yaw/pitch.
    if (this.flashlight.intensity > 0) {
      const cp = Math.cos(this.pitch || 0);
      const dir = new THREE.Vector3(
        -Math.sin(this.facingYaw) * cp,
        Math.sin(this.pitch || 0),
        -Math.cos(this.facingYaw) * cp
      );
      this.flashlightTarget.position
        .set(0, 1.5, 0)
        .addScaledVector(dir, 6);
    }

    // Flash rojo breve al recibir daño.
    if (this.hurtFlashTimer > 0) {
      this.hurtFlashTimer -= dt;
      this.billboard.mesh.material.emissive.setHex(0x8a1a1a);
    } else {
      this.billboard.mesh.material.emissive.setHex(0x92c28a);
    }

    // Animación direccional de frames.
    const ST = CONFIG.DIRECTIONAL.STATES;
    const FPS = CONFIG.DIRECTIONAL.ANIM_FPS;
    let visualState = this.isDown
      ? ST.IDLE
      : (this.pState === ST.IDLE && this.isMoving ? ST.WALK : this.pState);
    if (!this.isDown && this.attackHoldTimer > 0) {
      this.attackHoldTimer -= dt;
      visualState = ST.ATTACK;
    }
    let fps = FPS.IDLE;
    if (visualState === ST.WALK) fps = FPS.WALK;
    else if (visualState === ST.DASH) fps = FPS.DASH;
    else if (visualState === ST.HURT) fps = FPS.HURT;
    else if (visualState === ST.ATTACK) fps = FPS.ATTACK;
    else if (visualState === ST.ATTACK_WALK) fps = FPS.ATTACK_WALK;
    else if (visualState === ST.JUMP) fps = FPS.JUMP;

    this.animTimer += dt * fps;
    this.billboard.setDirectionalFrame(this.billboard.dirRow, visualState, Math.floor(this.animTimer) % 4);
  }

  triggerAttackVisual(weaponId, duration = 0.18) {
    if (this.isDown) return;
    this.attackHoldTimer = Math.max(this.attackHoldTimer, duration);
    AudioSys.play(320, 0.12, 'square', 0.06);
    this.billboard.applyJuiceTransforms(1.04, 0.96, 0, 0);
    setTimeout(() => {
      this.billboard.applyJuiceTransforms(1.0, 1.0, 0, 0);
    }, Math.max(120, duration * 1000));
  }

  destroy() {
    if (this.group && this.scene) {
      this.scene.remove(this.group);
      if (this.nameplate && this.nameplate.texture) {
        this.nameplate.texture.dispose();
      }
      if (this.nameplate && this.nameplate.sprite && this.nameplate.sprite.material) {
        this.nameplate.sprite.material.dispose();
      }
      if (this.billboard && this.billboard.group) {
        this.billboard.group.traverse(obj => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
            else obj.material.dispose();
          }
        });
      }
    }
  }
}

// Paquetes de estado que pueden llegar mientras el modo local aún carga.
// Se bufferizan y se reaplican en onLocalModeReady() para no perder torretas,
// oleadas, núcleo ni ingresos de chatarra.
// Paquetes válidos fuera de una partida activa (menú/lobby).
const PRE_MATCH_PACKET_TYPES = new Set([
  'START_MATCH',
  'LOBBY_PING',
  'LOBBY_PING_ACK',
  // Un peer puede completar el handshake justo antes de que onMatchStarted()
  // marque la sesión como activa en el otro extremo.
  'HELLO',
  'HELLO_ACK'
]);

const BUFFERED_PACKET_TYPES = new Set([
  'PEER_LEFT',
  'TURRET_BUILD',
  'TURRET_UPGRADE',
  'TURRET_SELL',
  'TURRET_STATE_SYNC',
  'WAVE_STATE',
  'CORE_SYNC',
  'CORE_DAMAGE_REQUEST',
  'ECONOMY_SYNC',
  'SCRAP_GAIN',
  'SCRAP_TRANSFER',
  'EVENT_START',
  'EVENT_STATE',
  'EVENT_END',
  'ENEMY_SPAWN',
  'ENEMY_DIE',
  'ENEMY_LEAK',
  'PICKUP_SPAWN',
  'PICKUP_COLLECTED',
  'MATCH_INFO',
  'MATCH_VICTORY'
]);

// Orquestador Central de Red Multijugador en tiempo real
export const MultiplayerSync = {
  ctx: null,
  remotePlayers: new Map(),
  knownPeers: new Set(),
  sendTimer: 0,
  isApplyingRemote: false,
  isMatchActive: false,
  handshakeTimer: null,
  p2pUnsub: null,
  peerUnsub: null,
  modeReady: false,
  stateSyncReceived: false,
  stateSyncTimer: null,
  stateHeartbeat: 0,
  posSeq: 0,
  scrapOddToHost: false,
  remoteTurretIds: new Map(),
  pendingStatePackets: [],
  eventUnsubs: [],
  sentEnemySpawns: new Set(),
  enemySyncTimer: 0,
  enemyBatchSeq: 0,
  lastEnemyBatchSeq: 0,
  pendingPlayerHits: new Map(),
  playerHitFlushTimer: 0,
  _matchInfo: null,
  _endingFromRemote: false,
  _matchInfoRestartCount: 0,
  _isHostRole: undefined,

  init(context) {
    this.ctx = context;
    this.remotePlayers.clear();
    this.knownPeers.clear();
    this.remoteTurretIds.clear();
    this.bindGameEvents();
    this.setupP2PListener();
    console.log('[MultiplayerSync] Sistema de sincronización P2P push inicializado.');
  },

  setupP2PListener() {
    if (this.p2pUnsub) {
      try { this.p2pUnsub(); } catch (e) {}
      this.p2pUnsub = null;
    }
    if (window.steamOnline && typeof window.steamOnline.onP2PPacket === 'function') {
      this.p2pUnsub = window.steamOnline.onP2PPacket(packet => {
        if (packet && packet.senderSteamId && packet.text) {
          this.handlePacket(packet.senderSteamId, packet.text);
        }
      });
      console.log('[MultiplayerSync] Escuchador de paquetes P2P conectado al bus IPC.');
    }
    if (this.peerUnsub) {
      try { this.peerUnsub(); } catch (e) {}
      this.peerUnsub = null;
    }
    if (window.steamOnline && typeof window.steamOnline.onPeerDisconnected === 'function') {
      this.peerUnsub = window.steamOnline.onPeerDisconnected(packet => {
        this.handlePeerDisconnected(packet);
      });
    }
  },

  isOnline() {
    // Señal de "partida online activa": no basta con estar en un lobby, para
    // evitar enviar POS/eventos durante una partida local estando en sala.
    return !!(this.isMatchActive && window.steamOnline);
  },

  isHost() {
    // El rol se fija al arrancar la partida (info.isHost de steamLobbyUI).
    // Si no está disponible, se cae al propietario del lobby.
    if (this._isHostRole !== undefined) return this._isHostRole;
    const lobby = getCurrentLobbyData();
    const localId = getLocalPlayerSteamId();
    return !!(lobby && lobby.ownerSteamId && localId && lobby.ownerSteamId === localId);
  },

  getBroadcastTargets() {
    const targets = new Set(this.knownPeers);
    for (const peerId of this.remotePlayers.keys()) {
      targets.add(peerId);
    }
    const lobby = getCurrentLobbyData();
    const localId = getLocalPlayerSteamId();

    if (lobby) {
      if (lobby.members) {
        lobby.members.forEach(m => {
          if (m.steamId && m.steamId !== localId) targets.add(m.steamId);
        });
      }
      if (lobby.ownerSteamId && lobby.ownerSteamId !== localId) {
        targets.add(lobby.ownerSteamId);
      }
      if (lobby.hostSteamId && lobby.hostSteamId !== localId) {
        targets.add(lobby.hostSteamId);
      }
    }

    if (localId) targets.delete(localId);
    return Array.from(targets);
  },

  broadcast(type, payload, reliable = false) {
    if (!window.steamOnline || !window.steamOnline.sendP2P) return;
    const targets = this.getBroadcastTargets();
    if (targets.length === 0) return;

    const localId = getLocalPlayerSteamId();
    // El sobre manda: `type` se escribe después del payload para que ningún
    // campo de entidad (enemyType, pickupType...) pueda sobrescribir el tipo
    // de mensaje y hacer que el receptor lo descarte.
    const msg = JSON.stringify({
      ...payload,
      type,
      sender: localId,
      t: Date.now()
    });

    targets.forEach(peerId => {
      window.steamOnline.sendP2P(peerId, msg, reliable);
    });
  },

  sendToPeer(peerId, type, payload = {}, reliable = false) {
    if (!peerId || !window.steamOnline || !window.steamOnline.sendP2P) return false;
    const localId = getLocalPlayerSteamId();
    const msg = JSON.stringify({
      ...payload,
      type,
      sender: localId,
      t: Date.now()
    });
    window.steamOnline.sendP2P(peerId, msg, reliable);
    return true;
  },

  getLocalSteamId() {
    return getLocalPlayerSteamId();
  },

  getPrimaryPeerId() {
    // Prioriza un peer del que ya tengamos avatar (conexión confirmada).
    for (const peerId of this.remotePlayers.keys()) return peerId;
    const targets = this.getBroadcastTargets();
    return targets.length > 0 ? targets[0] : null;
  },

  onMatchStarted(info = {}) {
    this.isMatchActive = true;
    this.modeReady = false;
    this.stateSyncReceived = false;
    this.posSeq = 0;
    this.sendTimer = 0;
    this.scrapOddToHost = false;
    this.stateHeartbeat = 0;
    this.remoteTurretIds.clear();
    this.pendingStatePackets.length = 0;
    for (const [_, rp] of this.remotePlayers) rp.destroy();
    this.remotePlayers.clear();
    this.knownPeers.clear();
    this.sentEnemySpawns.clear();
    this.pendingPlayerHits.clear();
    this.enemySyncTimer = 0;
    this.enemyBatchSeq = 0;
    this.lastEnemyBatchSeq = 0;
    this.playerHitFlushTimer = 0;
    this._endingFromRemote = false;
    this._matchInfoRestartCount = 0;
    this._matchInfo = {
      mode: info.mode || ModeManager?.getSelectedModeId?.() || 'core_defense',
      mapId: info.mapId || localStorage.getItem('traces_td_selected_map') || undefined,
      diff: info.diff || localStorage.getItem('traces_td_difficulty') || undefined,
      timestamp: info.timestamp || Date.now()
    };
    this._isHostRole = typeof info.isHost === 'boolean' ? info.isHost : undefined;
    this.clearStateSyncRetry();
    console.log('[MultiplayerSync] Señal de match iniciada:', info);

    const lobby = getCurrentLobbyData();
    const localId = getLocalPlayerSteamId();
    if (lobby) {
      if (lobby.members) {
        lobby.members.forEach(m => {
          if (m.steamId && m.steamId !== localId) this.knownPeers.add(m.steamId);
        });
      }
      if (lobby.ownerSteamId && lobby.ownerSteamId !== localId) {
        this.knownPeers.add(lobby.ownerSteamId);
      }
      if (lobby.hostSteamId && lobby.hostSteamId !== localId) {
        this.knownPeers.add(lobby.hostSteamId);
      }
    }

    const charId = localStorage.getItem('traces_selected_character') || 'otto';
    const initPos = this.ctx?.playerGroup?.position || { x: 0, y: 0, z: 0 };
    const initYaw = this.ctx?.playerGroup?.rotation?.y || 0;

    // Handshake inmediato con posición inicial garantizada
    this.broadcast('HELLO', {
      charId,
      x: initPos.x,
      y: initPos.y,
      z: initPos.z,
      yaw: initYaw,
      t: Date.now()
    }, true);

    // Bucle activo de reintentos cada 1s hasta confirmar presencia del compañero
    if (this.handshakeTimer) clearInterval(this.handshakeTimer);
    let attempts = 0;
    this.handshakeTimer = setInterval(() => {
      if (!this.isMatchActive || this.remotePlayers.size > 0 || attempts++ > 20) {
        clearInterval(this.handshakeTimer);
        this.handshakeTimer = null;
        return;
      }
      const curPos = this.ctx?.playerGroup?.position || { x: 0, y: 0, z: 0 };
      this.broadcast('HELLO', {
        charId,
        x: curPos.x,
        y: curPos.y,
        z: curPos.z,
        t: Date.now()
      }, true);
    }, 1000);
  },

  // Se invoca desde gameFlow.startGame() cuando el modo ya existe en escena.
  onLocalModeReady() {
    // startGame() ejecuta GameEvents.clear(); re-suscribimos siempre, después
    // de que el modo haya registrado sus propios listeners.
    this.bindGameEvents();
    if (!this.isMatchActive) return;
    this.modeReady = true;
    const mode = ModeManager?.activeMode;
    if (!mode) return;

    // Reaplica lo que llegó durante la carga (antes de tener escena/modo).
    const pending = this.pendingStatePackets.splice(0);
    for (const packet of pending) {
      try {
        this.handlePacket(packet.senderSteamId, JSON.stringify(packet.data));
      } catch (e) {
        console.warn('[MultiplayerSync] Error al reaplicar paquete pendiente:', e);
      }
    }

    this.broadcast('NET_READY', { role: this.isHost() ? 'host' : 'client' }, true);

    if (this.isHost()) {
      // Snapshot completo para todos los peers presentes.
      for (const peerId of this.getBroadcastTargets()) {
        this.sendFullState(peerId);
      }
    } else {
      this.startStateSyncRetry();
    }
    console.log('[MultiplayerSync] Modo local listo; snapshot de red solicitado.');
  },

  startStateSyncRetry() {
    this.clearStateSyncRetry();
    let attempts = 0;
    this.stateSyncTimer = setInterval(() => {
      if (!this.isMatchActive || this.stateSyncReceived || attempts++ > 20) {
        this.clearStateSyncRetry();
        return;
      }
      this.broadcast('NET_READY', { role: 'client' }, true);
    }, 1000);
  },

  clearStateSyncRetry() {
    if (this.stateSyncTimer) {
      clearInterval(this.stateSyncTimer);
      this.stateSyncTimer = null;
    }
  },

  markStateSynced() {
    this.stateSyncReceived = true;
    this.clearStateSyncRetry();
  },

  sendFullState(targetPeerId) {
    if (!this.modeReady || !targetPeerId) return;
    const mode = ModeManager?.activeMode;
    if (!mode) return;

    if (this._matchInfo) {
      this.sendToPeer(targetPeerId, 'MATCH_INFO', { ...this._matchInfo }, true);
    }

    this.sendTurretStateSync(targetPeerId);
    this.sendWaveSnapshot(targetPeerId);
    this.sendCoreSnapshot(targetPeerId);
    this.sendExistingEnemies(targetPeerId);
    this.sendExistingPickups(targetPeerId);
    this.sendEventStart(targetPeerId);
    this.sendEventState(targetPeerId);

    if (typeof mode.getInitialNetworkScrapShare === 'function') {
      this.sendToPeer(targetPeerId, 'ECONOMY_SYNC', {
        scrap: mode.getInitialNetworkScrapShare(),
        initial: true
      }, true);
    }

    // Última instantánea de posiciones/HP para alinear a los enemigos ya vivos.
    this.sendEnemyBatch(targetPeerId);

    // Marca explícita de fin de snapshot (aunque no haya torretas).
    this.sendToPeer(targetPeerId, 'STATE_SYNC_COMPLETE', { modeId: mode.id }, true);
  },

  buildWaveSnapshot() {
    const wm = ModeManager?.activeMode?.waveManager;
    if (!wm) return null;
    return {
      currentWaveIndex: wm.currentWaveIndex,
      totalWaves: wm.totalWaves,
      state: wm.state,
      prepTimer: wm.prepTimer,
      wavesCompleted: wm.wavesCompleted,
      spawnQueue: (wm.spawnQueue || []).map(item => ({ type: item.type, routeId: item.routeId })),
      spawnInterval: wm.spawnInterval,
      totalQueuedAtStart: wm.totalQueuedAtStart,
      pendingBossId: wm.pendingBossCfg ? wm.pendingBossCfg.id : null,
      activeRoutes: Array.isArray(wm.activeRoutes) ? [...wm.activeRoutes] : null
    };
  },

  sendWaveSnapshot(targetPeerId = null) {
    if (!this.isMatchActive || !this.isHost() || !this.modeReady) return;
    const snap = this.buildWaveSnapshot();
    if (!snap) return;
    if (targetPeerId) {
      this.sendToPeer(targetPeerId, 'WAVE_STATE', snap, true);
    } else {
      this.broadcast('WAVE_STATE', snap, true);
    }
  },

  sendCoreSnapshot(targetPeerId = null) {
    if (!this.isMatchActive || !this.isHost() || !this.modeReady) return;
    const mode = ModeManager?.activeMode;
    if (!mode) return;
    const currentHp = Number.isFinite(mode.lives)
      ? mode.lives
      : (mode.coreMachine ? mode.coreMachine.hp : undefined);
    if (!Number.isFinite(currentHp)) return;
    const maxHp = mode.maxLives || (mode.coreMachine ? mode.coreMachine.maxHp : undefined);
    const payload = { currentHp, maxHp };
    if (targetPeerId) {
      this.sendToPeer(targetPeerId, 'CORE_SYNC', payload, true);
    } else {
      this.broadcast('CORE_SYNC', payload, true);
    }
  },

  // --------------------------------------------------------------------------
  // ENEMIGOS AUTORITATIVOS DEL HOST
  // --------------------------------------------------------------------------
  buildEnemySpawnPayload(enemy) {
    const pos = enemy.group.position;
    const ai = enemy.defenseAI;
    return {
      netId: enemy.netId,
      enemyType: enemy.type,
      x: pos.x, y: pos.y, z: pos.z,
      hp: enemy.hp,
      maxHp: enemy.maxHp,
      dmg: enemy.dmg,
      speed: enemy.speed,
      routeId: ai?.routeId || null,
      waypointIdx: ai?.waypointIdx || 0,
      isDefenseMode: !!ai?.enabled,
      isEventEnemy: !!enemy.isEventEnemy,
      isBoss: !!enemy.isBoss,
      bossId: enemy.isBoss ? (enemy.bossData?.id || null) : null,
      phase: enemy.phase || 1,
      steerDir: enemy.steerDir,
      state: enemy.state,
      matchTimestamp: this._matchInfo?.timestamp || 0
    };
  },

  sendEnemySpawn(enemy, targetPeerId = null) {
    if (!this.isMatchActive || !this.isHost() || !enemy || enemy.netId === undefined) return;
    const payload = this.buildEnemySpawnPayload(enemy);
    if (targetPeerId) {
      this.sendToPeer(targetPeerId, 'ENEMY_SPAWN', payload, true);
    } else {
      this.broadcast('ENEMY_SPAWN', payload, true);
    }
  },

  sendExistingEnemies(targetPeerId) {
    const pool = this.ctx?.enemyPool;
    if (!pool) return;
    for (const enemy of pool.active) {
      if (enemy && enemy.active && enemy.netId !== undefined) {
        this.sendEnemySpawn(enemy, targetPeerId);
      }
    }
  },

  flushEnemySpawns() {
    if (!this.isMatchActive || !this.isHost() || !this.modeReady) return;
    const pool = this.ctx?.enemyPool;
    if (!pool) return;
    for (const enemy of pool.active) {
      if (!enemy || !enemy.active || enemy.netId === undefined) continue;
      if (this.sentEnemySpawns.has(enemy.netId)) continue;
      this.sentEnemySpawns.add(enemy.netId);
      this.sendEnemySpawn(enemy);
    }
  },

  sendEnemyDie(enemy) {
    if (!this.isMatchActive || !this.isHost() || !enemy || enemy.netId === undefined) return;
    const pos = enemy.group.position;
    const drop = enemy._networkDrop || null;
    this.broadcast('ENEMY_DIE', {
      netId: enemy.netId,
      x: pos.x, z: pos.z,
      enemyType: enemy.type,
      isBoss: !!enemy.isBoss,
      dropType: drop?.type || null,
      pickupNetId: drop?.pickupNetId ?? null,
      matchTimestamp: this._matchInfo?.timestamp || 0
    }, true);
  },

  sendEnemyLeak(enemy) {
    if (!this.isMatchActive || !this.isHost() || !enemy || enemy.netId === undefined) return;
    this.broadcast('ENEMY_LEAK', {
      netId: enemy.netId,
      routeId: enemy.defenseAI?.routeId || null,
      matchTimestamp: this._matchInfo?.timestamp || 0
    }, true);
  },

  sendEnemyBatch(targetPeerId = null) {
    if (!this.isMatchActive || !this.isHost() || !this.modeReady) return;
    const pool = this.ctx?.enemyPool;
    if (!pool) return;
    const list = [];
    for (const e of pool.active) {
      if (!e || !e.active || e.state === 'dead') continue;
      list.push([
        e.netId,
        Math.round(e.group.position.x * 100) / 100,
        Math.round(e.group.position.z * 100) / 100,
        Math.round(e.hp * 10) / 10,
        e.defenseAI?.waypointIdx || 0,
        e.visualState || 1,
        e.netTargetIsLocal === false ? 1 : 0
      ]);
    }
    if (list.length === 0 && !targetPeerId) return;
    this.enemyBatchSeq++;

    // Unreliable de Steam limita el paquete a ~1200 bytes: se trocea en
    // bloques de 20 enemigos con el mismo seq. El Cliente aplica cada parte.
    const CHUNK = 20;
    const chunks = [];
    if (list.length === 0) {
      chunks.push([]);
    } else {
      for (let i = 0; i < list.length; i += CHUNK) {
        chunks.push(list.slice(i, i + CHUNK));
      }
    }

    for (const chunk of chunks) {
      const payload = {
        seq: this.enemyBatchSeq,
        e: chunk,
        matchTimestamp: this._matchInfo?.timestamp || 0
      };
      if (targetPeerId) {
        this.sendToPeer(targetPeerId, 'ENEMY_BATCH_SYNC', payload, false);
      } else {
        this.broadcast('ENEMY_BATCH_SYNC', payload, false);
      }
    }
  },

  // Proyectiles y telegrafías de boss creados por el Host. Se replican una
  // sola vez por objeto y el Cliente los simula localmente para esquivarlos.
  flushEnemyAttacks() {
    if (!this.isMatchActive || !this.isHost() || !this.modeReady) return;

    const projectiles = this.ctx?.bossProjectiles;
    if (projectiles) {
      for (const p of projectiles) {
        if (!p || p._netSent || !p.mesh || !p.vel) continue;
        p._netSent = true;
        this.broadcast('ENEMY_PROJECTILE', {
          x: p.mesh.position.x, y: p.mesh.position.y, z: p.mesh.position.z,
          vx: p.vel.x, vy: p.vel.y, vz: p.vel.z,
          life: p.life,
          dmg: p.dmg,
          matchTimestamp: this._matchInfo?.timestamp || 0
        }, false);
      }
    }

    const hazards = this.ctx?.bossHazards;
    if (hazards) {
      for (const h of hazards) {
        if (!h || h._netSent) continue;
        h._netSent = true;
        const center = h.center || h.origin || h.mesh?.position;
        if (!center) continue;
        this.broadcast('ENEMY_HAZARD', {
          hazardType: h.type,
          x: center.x, y: center.y, z: center.z,
          dirX: h.dir?.x || 0, dirZ: h.dir?.z || 0,
          radius: h.radius || 0,
          arc: h.arc || 0,
          timer: h.timer,
          maxTimer: h.maxTimer,
          dmg: h.dmg || 0,
          bossNetId: h.boss?.netId ?? null,
          matchTimestamp: this._matchInfo?.timestamp || 0
        }, false);
      }
    }
  },

  queuePlayerHit(netId, damage, isCrit, knockback, opts = {}) {
    if (!this.isMatchActive || this.isHost() || !Number.isFinite(netId)) return;
    if (!Number.isFinite(damage) || damage <= 0) return;
    let entry = this.pendingPlayerHits.get(netId);
    if (!entry) {
      entry = { damage: 0, isCrit: false, kx: 0, kz: 0, dot: false, burnDps: 0, burnDuration: 0 };
      this.pendingPlayerHits.set(netId, entry);
    }
    entry.damage += damage;
    entry.isCrit = entry.isCrit || !!isCrit;
    entry.kx += knockback?.x || 0;
    entry.kz += knockback?.z || 0;
    entry.dot = entry.dot || !!opts.dot;
    if (opts.burnDps) {
      entry.burnDps = Math.max(entry.burnDps, opts.burnDps);
      entry.burnDuration = Math.max(entry.burnDuration, opts.burnDuration || 0);
    }
  },

  flushPlayerHits() {
    if (!this.isMatchActive || this.isHost() || this.pendingPlayerHits.size === 0) return;
    const hostId = this.getPrimaryPeerId();
    if (!hostId) {
      this.pendingPlayerHits.clear();
      return;
    }
    for (const [netId, hit] of this.pendingPlayerHits) {
      this.sendToPeer(hostId, 'PLAYER_HIT', {
        netId,
        damage: hit.damage,
        isCrit: hit.isCrit,
        knockbackX: hit.kx,
        knockbackZ: hit.kz,
        dot: hit.dot,
        burnDps: hit.burnDps,
        burnDuration: hit.burnDuration
      }, true);
    }
    this.pendingPlayerHits.clear();
  },

  getPlayerTargets(localPos, localAlive = true) {
    const targets = [{
      id: 'local',
      position: localPos,
      alive: localAlive !== false,
      isLocal: true
    }];
    for (const [steamId, rp] of this.remotePlayers) {
      if (!rp || rp.stale) continue;
      targets.push({
        id: steamId,
        position: rp.group.position,
        alive: !rp.isDown && rp.hp > 0,
        isLocal: false
      });
    }
    return targets;
  },

  // --------------------------------------------------------------------------
  // PICKUPS COMPARTIDOS
  // --------------------------------------------------------------------------
  sendPickupSpawn(drop) {
    if (!this.isMatchActive || !this.isHost() || !drop || drop.pickupNetId === undefined) return;
    this.broadcast('PICKUP_SPAWN', {
      pickupNetId: drop.pickupNetId,
      pickupType: drop.type,
      value: drop.value,
      x: drop.group.position.x,
      y: drop.group.position.y,
      z: drop.group.position.z
    }, true);
  },

  sendExistingPickups(targetPeerId) {
    const drops = this.ctx?.drops;
    if (!Array.isArray(drops)) return;
    for (const d of drops) {
      if (!d || d.pickupNetId === undefined) continue;
      this.sendToPeer(targetPeerId, 'PICKUP_SPAWN', {
        pickupNetId: d.pickupNetId,
        pickupType: d.type,
        value: d.value,
        x: d.group.position.x,
        y: d.group.position.y,
        z: d.group.position.z
      }, true);
    }
  },

  requestPickupCollect(data) {
    if (!this.isMatchActive || this.isHost()) return;
    const hostId = this.getPrimaryPeerId();
    if (hostId) this.sendToPeer(hostId, 'PICKUP_COLLECT', data, true);
  },

  broadcastPickupCollected(data) {
    if (!this.isMatchActive || !this.isHost()) return;
    this.broadcast('PICKUP_COLLECTED', data, true);
  },

  // --------------------------------------------------------------------------
  // EVENTOS ESPECIALES
  // --------------------------------------------------------------------------
  buildEventStartPayload() {
    const ev = ModeManager?.activeMode?.defenseEventManager?.activeEvent;
    if (!ev) return null;
    return {
      eventType: ev.type,
      targetName: ev.targetName,
      article: ev.article,
      x: ev.position.x, y: ev.position.y, z: ev.position.z,
      duration: ev.duration,
      radius: ev.radius,
      elapsed: ev.elapsedSurvivalTime,
      phase: ev.intensityPhase,
      progress: ev.progress,
      waveIndex: ev.waveIndex || 1
    };
  },

  sendEventStart(targetPeerId = null) {
    if (!this.isMatchActive || !this.isHost() || !this.modeReady) return;
    const payload = this.buildEventStartPayload();
    if (!payload) return;
    if (targetPeerId) {
      this.sendToPeer(targetPeerId, 'EVENT_START', payload, true);
    } else {
      this.broadcast('EVENT_START', payload, true);
    }
  },

  sendEventState(targetPeerId = null) {
    if (!this.isMatchActive || !this.isHost() || !this.modeReady) return;
    const ev = ModeManager?.activeMode?.defenseEventManager?.activeEvent;
    if (!ev) return;
    const payload = {
      elapsed: ev.elapsedSurvivalTime,
      phase: ev.intensityPhase,
      progress: ev.progress
    };
    if (targetPeerId) {
      this.sendToPeer(targetPeerId, 'EVENT_STATE', payload, true);
    } else {
      this.broadcast('EVENT_STATE', payload, true);
    }
  },

  // --------------------------------------------------------------------------
  // MATCH: INFO, RESTART Y SALIDA LIMPIA
  // --------------------------------------------------------------------------
  getMatchInfo() {
    return this._matchInfo ? { ...this._matchInfo } : null;
  },

  broadcastMatchRestart() {
    if (!this.isMatchActive || !this.isHost()) return null;
    const payload = {
      ...(this.getMatchInfo() || { mode: ModeManager?.getSelectedModeId?.() }),
      timestamp: Date.now()
    };
    this.broadcast('MATCH_RESTART', payload, true);
    return payload;
  },

  notifyMatchEnd() {
    if (!this.isMatchActive || this._endingFromRemote) return;
    if (this.isHost()) {
      this.broadcast('MATCH_END', {
        matchTimestamp: this._matchInfo?.timestamp || 0
      }, true);
    } else {
      this.broadcast('PEER_LEFT', {
        matchTimestamp: this._matchInfo?.timestamp || 0
      }, true);
    }
  },

  sanitizeOutcome(outcome = {}) {
    return {
      victory: !!outcome.victory,
      modeId: outcome.modeId || ModeManager?.getSelectedModeId?.() || null,
      title: outcome.title || null,
      cause: outcome.cause || null,
      wavesCompleted: outcome.wavesCompleted || 0,
      currentWave: outcome.currentWave || 0,
      totalWaves: outcome.totalWaves || 0,
      coreHpLeft: outcome.coreHpLeft ?? 0,
      coreMaxHp: outcome.coreMaxHp ?? 0,
      bossesDefeated: outcome.bossesDefeated || 0,
      totalBosses: outcome.totalBosses || 0,
      isEndgame: !!outcome.isEndgame,
      matchTimestamp: this._matchInfo?.timestamp || 0
    };
  },

  broadcastMatchOver(outcome = {}) {
    if (!this.isMatchActive || !this.isHost()) return;
    this.broadcast('MATCH_OVER', { outcome: this.sanitizeOutcome(outcome) }, true);
  },

  requestRunEnd(outcome = {}) {
    if (!this.isMatchActive || this.isHost()) return;
    const hostId = this.getPrimaryPeerId();
    if (!hostId) return;
    this.sendToPeer(hostId, 'PLAYER_RUN_END', {
      outcome: this.sanitizeOutcome(outcome)
    }, true);
  },

  // --------------------------------------------------------------------------
  // RÉPLICAS DE ENEMIGOS, PICKUPS Y ATAQUES EN EL CLIENTE
  // --------------------------------------------------------------------------
  spawnReplicatedEnemy(data) {
    const pool = this.ctx?.enemyPool;
    const mode = ModeManager?.activeMode;
    if (!pool || !Number.isFinite(data.netId)) return;
    if (data.matchTimestamp && this._matchInfo?.timestamp && data.matchTimestamp !== this._matchInfo.timestamp) return;
    if (pool.getByNetId(data.netId)) return;

    const bossCfg = data.bossId
      ? (CONFIG.BOSS_SCHEDULE.find(b => b.id === data.bossId) || null)
      : null;
    const pathSystem = mode?.pathSystem || null;
    const defenseOpts = data.isDefenseMode
      ? {
          fromNetwork: true,
          netId: data.netId,
          isDefenseMode: true,
          routeId: data.routeId,
          pathSystem,
          hpMult: 1, dmgMult: 1, spdMult: 1
        }
      : {
          fromNetwork: true,
          netId: data.netId,
          hpMult: 1, dmgMult: 1, spdMult: 1
        };

    const playerPos = this.ctx?.playerGroup?.position || new THREE.Vector3();
    const enemyType = data.enemyType || data.type || 'zombie';
    const enemy = pool.spawn(
      enemyType,
      playerPos,
      0,
      new THREE.Vector3(0, 0, -1),
      this.ctx?.worldPhysics || null,
      bossCfg,
      defenseOpts
    );
    if (!enemy) return;

    enemy.group.position.set(data.x, data.y, data.z);
    enemy.hp = Number.isFinite(data.hp) ? data.hp : enemy.hp;
    enemy.maxHp = Number.isFinite(data.maxHp) ? data.maxHp : enemy.maxHp;
    if (Number.isFinite(data.dmg)) enemy.dmg = data.dmg;
    if (Number.isFinite(data.speed)) enemy.speed = data.speed;
    if (Number.isFinite(data.steerDir)) enemy.steerDir = data.steerDir;
    if (Number.isFinite(data.phase)) enemy.phase = data.phase;
    enemy.isEventEnemy = !!data.isEventEnemy;
    enemy.netTargetX = data.x;
    enemy.netTargetZ = data.z;

    if (enemy.defenseAI) {
      enemy.defenseAI.waypointIdx = data.waypointIdx || 1;
      enemy.defenseAI.lastProgressPos.copy(enemy.group.position);
    }
    if (data.state === 'dead') {
      enemy.state = 'dead';
      enemy.stateTimer = 0;
    }

    if (data.isEventEnemy && mode?.defenseEventManager?.activeEvent) {
      mode.defenseEventManager.eventEnemies.push(enemy);
    }
    if (data.isBoss && mode) {
      mode.activeBoss = enemy;
      this.ctx?.setActiveBoss?.(enemy, bossCfg || enemy.bossData);
    }
    if (data.isDefenseMode && data.routeId && mode?.spawnPointSystem) {
      const sp = mode.spawnPointSystem.getSpawnPointByPath(data.routeId);
      if (sp) mode.spawnPointSystem.triggerSpawnEffect(sp.id, !!data.isBoss);
    }
  },

  handleEnemyDiePacket(data) {
    if (data.matchTimestamp && this._matchInfo?.timestamp && data.matchTimestamp !== this._matchInfo.timestamp) return;
    const pool = this.ctx?.enemyPool;
    const mode = ModeManager?.activeMode;
    const enemy = pool?.getByNetId(data.netId);
    if (enemy) {
      if (enemy.state !== 'dead') {
        enemy.hp = 0;
        enemy.state = 'dead';
        enemy.stateTimer = 0;
        enemy.netTargetX = null;
        this.ctx?.onNetworkKill?.();
        if (enemy.isBoss && mode) {
          mode.activeBoss = null;
          mode.bossesDefeated = (mode.bossesDefeated || 0) + 1;
          this.ctx?.clearActiveBoss?.();
          AudioSys.playBossHorn?.();
        }
      }
      AudioSys.play(120, 0.1, 'square', 0.04);
    } else if (Number.isFinite(data.x) && Number.isFinite(data.z)) {
      this.spawnRemoteBloodAt(data.x, 1.2, data.z, 4);
    }

    // Respaldo si PICKUP_SPAWN no llegó: recrea el botín principal.
    if (data.pickupNetId != null && data.dropType) {
      const exists = Array.isArray(this.ctx?.drops)
        && this.ctx.drops.some(drop => drop.pickupNetId === data.pickupNetId);
      if (!exists) {
        this.spawnReplicatedPickup({
          pickupNetId: data.pickupNetId,
          pickupType: data.dropType,
          value: 1,
          x: data.x || 0,
          y: 0,
          z: data.z || 0
        });
      }
    }
  },

  handleEnemyLeakPacket(data) {
    if (data.matchTimestamp && this._matchInfo?.timestamp && data.matchTimestamp !== this._matchInfo.timestamp) return;
    const pool = this.ctx?.enemyPool;
    const mode = ModeManager?.activeMode;
    const enemy = pool?.getByNetId(data.netId);
    if (!enemy) return;
    pool.despawnByNetId(data.netId);
    if (data.routeId && mode?.exitPointSystem) {
      const ep = mode.exitPointSystem.getExitPointByPath(data.routeId);
      if (ep) mode.exitPointSystem.triggerLeakEffect(ep.id);
    }
    AudioSys.play(180, 0.2, 'sawtooth', 0.08);
  },

  applyEnemyBatch(data) {
    if (!data || !Array.isArray(data.e)) return;
    if (data.matchTimestamp && this._matchInfo?.timestamp && data.matchTimestamp !== this._matchInfo.timestamp) return;
    if (Number.isFinite(data.seq)) {
      // Varias partes comparten seq; solo se descartan lotes más antiguos.
      if (data.seq < this.lastEnemyBatchSeq) return;
      if (data.seq > this.lastEnemyBatchSeq) this.lastEnemyBatchSeq = data.seq;
    }
    const pool = this.ctx?.enemyPool;
    if (!pool) return;
    for (const row of data.e) {
      if (!Array.isArray(row)) continue;
      const [netId, x, z, hp, waypointIdx, visualState, targetPlayer] = row;
      const enemy = pool.getByNetId(netId);
      if (!enemy) continue;
      if (Number.isFinite(x) && Number.isFinite(z)) {
        enemy.netTargetX = x;
        enemy.netTargetZ = z;
      }
      if (Number.isFinite(hp)) enemy.hp = hp;
      if (enemy.defenseAI && Number.isFinite(waypointIdx) && waypointIdx > 0) {
        enemy.defenseAI.waypointIdx = waypointIdx;
      }
      if (Number.isFinite(visualState)) enemy.visualState = visualState;
      enemy.netTargetIsLocal = targetPlayer !== 1;
    }
  },

  spawnReplicatedProjectile(data) {
    const projectiles = this.ctx?.bossProjectiles;
    const scene = this.ctx?.scene;
    if (!projectiles || !scene) return;
    if (data.matchTimestamp && this._matchInfo?.timestamp && data.matchTimestamp !== this._matchInfo.timestamp) return;
    const speed = Math.hypot(data.vx || 0, data.vy || 0, data.vz || 0);
    if (speed < 0.01) return;
    const dir = new THREE.Vector3(data.vx / speed, data.vy / speed, data.vz / speed);
    spawnEnemyProjectile(
      scene,
      projectiles,
      new THREE.Vector3(data.x, data.y, data.z),
      dir,
      speed,
      data.dmg || 1
    );
    const p = projectiles[projectiles.length - 1];
    if (p && Number.isFinite(data.life)) p.life = Math.max(0.1, data.life);
    const now = performance.now();
    if (!this._lastEnemyAttackSoundAt || now - this._lastEnemyAttackSoundAt > 120) {
      this._lastEnemyAttackSoundAt = now;
      const dist = this.ctx?.playerGroup
        ? this.ctx.playerGroup.position.distanceTo(new THREE.Vector3(data.x, data.y, data.z))
        : 0;
      AudioSys.play(380, 0.08, 'sawtooth', Math.max(0.01, 0.06 * (1 - dist / 30)));
    }
  },

  spawnReplicatedHazard(data) {
    const scene = this.ctx?.scene;
    const hazards = this.ctx?.bossHazards;
    if (!scene || !hazards) return;
    if (data.matchTimestamp && this._matchInfo?.timestamp && data.matchTimestamp !== this._matchInfo.timestamp) return;

    const x = data.x, y = data.y, z = data.z;
    const timer = Number.isFinite(data.timer) ? data.timer : 1.0;
    const maxTimer = Number.isFinite(data.maxTimer) ? data.maxTimer : timer;
    let mesh = null;
    let hazard = null;
    const hazardType = data.hazardType || data.type;

    if (hazardType === 'circle') {
      const radius = data.radius || 3;
      mesh = new THREE.Mesh(
        new THREE.RingGeometry(0.4, radius, 24),
        new THREE.MeshBasicMaterial({ color: 0xc42020, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, y + 0.06, z);
      scene.add(mesh);
      hazard = {
        type: 'circle', mesh, center: new THREE.Vector3(x, y, z), radius,
        timer, maxTimer, dmg: data.dmg || 0
      };
    } else if (hazardType === 'cone') {
      const radius = data.radius || 6;
      const dir = new THREE.Vector3(data.dirX || 0, 0, data.dirZ || 0).normalize();
      const angle = Math.atan2(dir.x, dir.z);
      mesh = new THREE.Mesh(
        new THREE.CircleGeometry(radius, 18, -Math.PI * 0.28, Math.PI * 0.56),
        new THREE.MeshBasicMaterial({ color: 0xc42020, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.rotation.z = angle - Math.PI / 2;
      mesh.position.set(x, y + 0.06, z);
      scene.add(mesh);
      hazard = {
        type: 'cone', mesh, origin: new THREE.Vector3(x, y, z), dir, radius,
        arc: data.arc || 0.9, timer, maxTimer, dmg: data.dmg || 0
      };
    } else if (hazardType === 'charge_line') {
      const dir = new THREE.Vector3(data.dirX || 0, 0, data.dirZ || 0).normalize();
      const len = 14;
      mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2.2, len),
        new THREE.MeshBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.rotation.z = -Math.atan2(dir.x, dir.z);
      mesh.position.set(x + dir.x * len * 0.5, y + 0.06, z + dir.z * len * 0.5);
      scene.add(mesh);
      const boss = data.bossNetId != null
        ? this.ctx?.enemyPool?.getByNetId(data.bossNetId)
        : null;
      hazard = {
        type: 'charge_line', mesh, boss, dir, timer, maxTimer, dmg: 0
      };
    }

    if (hazard) {
      hazards.push(hazard);
      const now = performance.now();
      if (!this._lastHazardSoundAt || now - this._lastHazardSoundAt > 120) {
        this._lastHazardSoundAt = now;
        const dist = this.ctx?.playerGroup
          ? this.ctx.playerGroup.position.distanceTo(new THREE.Vector3(x, y, z))
          : 0;
        AudioSys.play(115, 0.22, 'sawtooth', Math.max(0.01, 0.07 * (1 - dist / 32)));
      }
    }
  },

  applyRemotePlayerHit(data) {
    if (!this.isHost()) return;
    const enemy = this.ctx?.enemyPool?.getByNetId(data.netId);
    if (!enemy || !enemy.active || enemy.state === 'dead') return;
    const damage = Math.max(0.1, Math.min(10000, Number(data.damage) || 0));
    const knockback = new THREE.Vector3(Number(data.knockbackX) || 0, 0, Number(data.knockbackZ) || 0);
    this.ctx?.damageEnemy?.(enemy, damage, knockback, !!data.dot, {
      isCrit: !!data.isCrit,
      finalDamage: true,
      fromRemote: true,
      burnDps: Math.max(0, Math.min(1000, Number(data.burnDps) || 0)),
      burnDuration: Math.max(0, Math.min(10, Number(data.burnDuration) || 0))
    });
  },

  spawnReplicatedPickup(data) {
    const ps = this.ctx?.pickupSystem;
    if (!ps || !Number.isFinite(data.pickupNetId)) return;
    if (Array.isArray(this.ctx?.drops) && this.ctx.drops.some(d => d.pickupNetId === data.pickupNetId)) return;
    ps.spawnLorePickup(
      new THREE.Vector3(data.x, data.y, data.z),
      data.pickupType || data.type,
      data.value,
      { fromNetwork: true, pickupNetId: data.pickupNetId }
    );
  },

  handlePickupCollectRequest(senderSteamId, data) {
    const ps = this.ctx?.pickupSystem;
    if (!ps || !Number.isFinite(data.pickupNetId)) return;
    const drop = ps.removePickupByNetId(data.pickupNetId);
    if (!drop) return;

    const type = data.pickupType || data.type || drop.type;
    const value = Number.isFinite(data.value) ? data.value : drop.value;
    if (type === 'scrap') {
      ModeManager?.activeMode?.addScrap?.(value || 1);
    }
    this.broadcast('PICKUP_COLLECTED', {
      pickupNetId: data.pickupNetId,
      pickupType: type,
      value,
      collector: senderSteamId
    }, true);
  },

  handlePickupCollected(data) {
    const ps = this.ctx?.pickupSystem;
    if (!ps) return;
    ps.removePickupByNetId(data.pickupNetId);
    const type = data.pickupType || data.type;
    if (data.collector === getLocalPlayerSteamId() && type !== 'scrap') {
      ps.applyCollectedReward?.({ ...data, pickupType: type });
    }
  },

  validateMatchInfo(data) {
    if (!data || this.isHost()) return;
    const now = Date.now();
    if (now - (this._lastMatchInfoRestartAt || 0) < 5000) return;

    const localMode = ModeManager?.getSelectedModeId?.();
    const localMap = localStorage.getItem('traces_td_selected_map');
    const localDiff = localStorage.getItem('traces_td_difficulty');
    const modeMismatch = data.mode && data.mode !== localMode;
    const mapMismatch = data.mode === 'core_defense' && data.mapId && localMap && data.mapId !== localMap;
    const diffMismatch = data.mode === 'core_defense' && data.diff && localDiff && data.diff !== localDiff;
    if (!modeMismatch && !mapMismatch && !diffMismatch) return;

    this._lastMatchInfoRestartAt = now;
    this._matchInfo = { mode: data.mode, mapId: data.mapId, diff: data.diff };
    console.warn('[MultiplayerSync] MatchInfo del Host distinto; recargando partida:', data);
    setTimeout(() => {
      launchClientMatch({
        mode: data.mode,
        mapId: data.mapId,
        diff: data.diff,
        timestamp: Date.now(),
        action: 'START'
      });
    }, 0);
  },

  playRemoteAttackFx(data) {
    const scene = this.ctx?.scene;
    const vfx = this.ctx?.vfx;
    if (!scene || !vfx) return;

    const origin = new THREE.Vector3(
      data.originX ?? data.x ?? 0,
      data.originY ?? data.y ?? 0,
      data.originZ ?? data.z ?? 0
    );
    const dir = new THREE.Vector3(data.dirX || 0, data.dirY || 0, data.dirZ || 0);
    if (dir.lengthSq() < 0.0001) dir.set(0, 0, -1);
    dir.normalize();
    const hasHit = Number.isFinite(data.hitX) && Number.isFinite(data.hitY) && Number.isFinite(data.hitZ);
    const hit = hasHit
      ? new THREE.Vector3(data.hitX, data.hitY, data.hitZ)
      : origin.clone().addScaledVector(dir, 3.5);
    const weapon = data.weaponId || 'slash';
    const dist = this.ctx?.playerGroup
      ? this.ctx.playerGroup.position.distanceTo(origin)
      : 0;
    const vol = Math.max(0.02, 0.1 * Math.max(0, 1 - dist / 32));

    const addTracer = (color, life = 0.14) => {
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([origin.clone(), hit.clone()]),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 })
      );
      scene.add(line);
      vfx.push({ mesh: line, disposeGeo: true, disposeMat: true, life, maxLife: life, fade: true });
    };

    const addMuzzle = (color = 0xffe699) => {
      const flash = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2, 1.2),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
      );
      flash.position.copy(origin);
      scene.add(flash);
      vfx.push({
        mesh: flash, disposeGeo: true, disposeMat: true,
        life: 0.08, maxLife: 0.08, billboard: true, fade: true, scaleSpeed: 6
      });
    };

    switch (weapon) {
      case 'slash': {
        const slash = new THREE.Mesh(
          new THREE.PlaneGeometry(3.2, 2.3),
          new THREE.MeshBasicMaterial({ color: 0xd95326, transparent: true, opacity: 0.6, side: THREE.DoubleSide })
        );
        slash.position.copy(hit);
        scene.add(slash);
        vfx.push({ mesh: slash, disposeGeo: true, disposeMat: true, life: 0.2, maxLife: 0.2, billboard: true, fade: true });
        AudioSys.play(195, 0.13, 'sawtooth', vol * 0.7);
        break;
      }
      case 'shotgun': {
        addMuzzle();
        addTracer(0xffe699, 0.13);
        AudioSys.play(75, 0.24, 'sawtooth', vol);
        AudioSys.play(260, 0.09, 'square', vol * 0.6);
        break;
      }
      case 'flamethrower': {
        addMuzzle(0xffaa33);
        for (let i = 0; i < 3; i++) {
          const flame = new THREE.Mesh(
            new THREE.PlaneGeometry(0.55, 0.55),
            new THREE.MeshBasicMaterial({
              color: i % 2 === 0 ? 0xff7711 : 0xffcc33,
              transparent: true, opacity: 0.8, side: THREE.DoubleSide
            })
          );
          flame.position.copy(origin);
          scene.add(flame);
          const spread = (Math.random() - 0.5) * 0.5;
          const fdir = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), spread);
          vfx.push({
            mesh: flame, disposeGeo: true, disposeMat: true,
            life: 0.26, maxLife: 0.26, billboard: true, fade: true, scaleSpeed: 3.2,
            vel: fdir.multiplyScalar(9).add(new THREE.Vector3(0, 1.0, 0))
          });
        }
        AudioSys.play(110, 0.08, 'sawtooth', vol * 0.5);
        break;
      }
      case 'aura': {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.8, 2.8, 24),
          new THREE.MeshBasicMaterial({ color: 0xd97724, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(origin.x, origin.y + 0.06, origin.z);
        scene.add(ring);
        vfx.push({ mesh: ring, disposeGeo: true, disposeMat: true, life: 0.35, maxLife: 0.35, fade: true });
        AudioSys.play(260, 0.1, 'sine', vol * 0.5);
        break;
      }
      case 'mine_blast': {
        const blast = new THREE.Mesh(
          new THREE.PlaneGeometry(3.6, 3.6),
          new THREE.MeshBasicMaterial({ color: 0xff8822, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
        );
        blast.position.copy(hit);
        scene.add(blast);
        vfx.push({ mesh: blast, disposeGeo: true, disposeMat: true, life: 0.2, maxLife: 0.2, billboard: true, fade: true });
        AudioSys.play(68, 0.22, 'sawtooth', vol);
        break;
      }
      case 'mines': {
        const pulse = new THREE.Mesh(
          new THREE.RingGeometry(0.3, 0.9, 16),
          new THREE.MeshBasicMaterial({ color: 0xffc56b, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
        );
        pulse.rotation.x = -Math.PI / 2;
        pulse.position.set(origin.x, origin.y + 0.06, origin.z);
        scene.add(pulse);
        vfx.push({ mesh: pulse, disposeGeo: true, disposeMat: true, life: 0.28, maxLife: 0.28, fade: true });
        AudioSys.play(420, 0.06, 'sine', vol * 0.5);
        break;
      }
      case 'harpoon': {
        addTracer(0xc8c2ac, 0.18);
        AudioSys.play(150, 0.18, 'triangle', vol * 0.8);
        break;
      }
      case 'bolt': {
        addTracer(0xb89c46, 0.12);
        AudioSys.play(480, 0.14, 'sawtooth', vol * 0.7);
        break;
      }
      case 'orbital': {
        addTracer(0xffe699, 0.12);
        AudioSys.play(310, 0.12, 'sawtooth', vol * 0.6);
        break;
      }
      default: {
        addTracer(0xe6d7a5, 0.12);
        AudioSys.play(200, 0.1, 'triangle', vol * 0.6);
      }
    }

    if (hasHit) this.spawnRemoteBloodAt(hit.x, hit.y, hit.z, weapon === 'shotgun' ? 3 : 2);
  },

  spawnRemoteBloodAt(x, y, z, count = 3) {
    const scene = this.ctx?.scene;
    const vfx = this.ctx?.vfx;
    if (!scene || !vfx) return;
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.18, 0.18),
        new THREE.MeshBasicMaterial({ color: 0xa52020 })
      );
      mesh.position.set(x, y, z);
      scene.add(mesh);
      vfx.push({
        mesh,
        disposeGeo: true,
        disposeMat: true,
        life: 0.22,
        maxLife: 0.22,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 5,
          2 + Math.random() * 3,
          (Math.random() - 0.5) * 5
        ),
        gravity: 15,
        floorY: y - 0.5
      });
    }
  },


  removeRemotePlayer(peerId) {
    if (!peerId) return;
    const id = String(peerId);
    const rp = this.remotePlayers.get(id);
    if (rp) {
      try {
        rp.destroy();
      } catch (e) {
        console.warn('[MultiplayerSync] Error destruyendo RemotePlayer:', e);
      }
      this.remotePlayers.delete(id);
    }
    this.knownPeers.delete(id);
    if (this.remotePlayers.size === 0) {
      const coopDot = document.querySelector('.radar-dot.coop-approx');
      if (coopDot) coopDot.style.display = 'none';
    }
  },

  handlePeerLeft(peerId = null) {
    console.log('[MultiplayerSync] Procesando salida de compañero:', peerId);
    if (peerId) {
      this.removeRemotePlayer(peerId);
    } else {
      for (const id of Array.from(this.remotePlayers.keys())) {
        this.removeRemotePlayer(id);
      }
    }

    // Toast y aviso claro en el HUD del Host
    this.ctx?.hudController?.showScrapTransferToast?.('Compañero desconectado. Continuando misión en solitario.', 'error');
    this.ctx?.hudController?.showWaveAnnouncement?.('COMPAÑERO DESCONECTADO // MISIÓN EN SOLITARIO');
    AudioSys.playUIError?.();

    // Ocultar botón y atajo de enviar chatarra (T)
    const coopTransfer = document.getElementById('coop-scrap-transfer');
    if (coopTransfer) coopTransfer.classList.add('hidden');
    const coopDot = document.querySelector('.radar-dot.coop-approx');
    if (coopDot) coopDot.style.display = 'none';

    // Desactivar coopScrapTransfer en hudConfig del modo activo
    const activeMode = ModeManager?.activeMode;
    if (activeMode && activeMode.hudConfig) {
      activeMode.hudConfig.coopScrapTransfer = false;
    }
  },

  handlePeerDisconnected(packet) {
    if (!this.isMatchActive) return;
    const id = packet?.steamId ? String(packet.steamId) : null;
    if (id && !this.knownPeers.has(id) && !this.remotePlayers.has(id)) return;
    console.warn('[MultiplayerSync] Peer desconectado:', packet);

    if (this.isHost()) {
      // Si somos Host, el cliente se desconectó. NO salimos de la partida.
      this.handlePeerLeft(id);
    } else {
      // Si somos Cliente y el Host se cayó o desconectó, salimos al menú.
      AudioSys.playUIError?.();
      this._endingFromRemote = true;
      this.ctx?.onMatchEnded?.('El Host ha finalizado la sesión.');
    }
  },

  // Fin de la partida sin cerrar la sesión P2P: permite reiniciar en co-op y
  // conserva _matchInfo hasta que se pulse Reintentar o Volver al Menú.
  onLocalRunEnded() {
    this.modeReady = false;
    this.stateSyncReceived = false;
    this.clearStateSyncRetry();
    this.pendingStatePackets.length = 0;
    this.pendingPlayerHits.clear();
    this.sentEnemySpawns.clear();
    this.enemySyncTimer = 0;
    this.playerHitFlushTimer = 0;
    for (const unsub of this.eventUnsubs) {
      try { unsub(); } catch (e) {}
    }
    this.eventUnsubs.length = 0;
  },

  // Reparto 50/50 de la chatarra generada por la partida. El residuo impar
  // alterna entre Host y Cliente para que la suma sea exactamente la misma
  // que en una partida de un solo jugador.
  handleScrapIncome(mode, amount) {
    if (!mode || !Number.isFinite(amount) || amount <= 0) return true;
    if (!this.isMatchActive) return false;
    if (!this.isHost()) return true; // el Cliente no genera ingresos propios

    // Reajuste dinámico de Economía: Como ya no hay compañero conectado (remotePlayers.size === 0),
    // handleScrapIncome() pasa automáticamente a darle el 100% de la chatarra generada al Host
    if (this.remotePlayers.size === 0) {
      mode.scrap += amount;
      return true;
    }

    let hostShare = Math.floor(amount / 2);
    let clientShare = amount - hostShare;
    if (amount % 2 === 1) {
      if (this.scrapOddToHost) {
        hostShare += 1;
        clientShare -= 1;
      }
      this.scrapOddToHost = !this.scrapOddToHost;
    }

    if (hostShare > 0) mode.scrap += hostShare;
    if (clientShare > 0) this.broadcast('SCRAP_GAIN', { amount: clientShare }, true);
    return true;
  },

  requestCoreDamage(amount, reason = 'player_death') {
    if (!this.isMatchActive || this.isHost()) return false;
    const value = Math.max(1, Math.min(500, Math.floor(amount) || 0));
    this.broadcast('CORE_DAMAGE_REQUEST', { amount: value, reason }, true);
    return true;
  },

  sendScrapToPeer(amount) {
    const value = Math.floor(Number(amount) || 0);
    if (!this.isMatchActive || value <= 0) return false;
    if (!window.steamOnline?.sendP2P) {
      this.ctx?.hudController?.showScrapTransferToast?.('STEAM P2P NO DISPONIBLE', 'error');
      return false;
    }

    const peerId = this.getPrimaryPeerId();
    const peerConnected = !!peerId && (this.remotePlayers.size > 0 || this.knownPeers.has(peerId));
    if (!peerConnected) {
      this.ctx?.hudController?.showScrapTransferToast?.('SIN COMPAÑERO CONECTADO', 'error');
      AudioSys.playUIError?.();
      return false;
    }

    const mode = ModeManager?.activeMode;
    if (!mode || typeof mode.spendScrap !== 'function') return false;
    if (mode.getScrap() < value || !mode.spendScrap(value)) {
      this.ctx?.hudController?.showScrapTransferToast?.('CHATARRA INSUFICIENTE', 'error');
      AudioSys.playUIError?.();
      return false;
    }

    if (!this.sendToPeer(peerId, 'SCRAP_TRANSFER', { amount: value }, true)) {
      mode.addScrap(value, { local: true }); // devolución si el envío falla
      this.ctx?.hudController?.showScrapTransferToast?.('NO SE PUDO ENVIAR LA CHATARRA', 'error');
      return false;
    }
    this.ctx?.hudController?.showScrapTransferToast?.(`-${value} CHATARRA ENVIADA`, 'send');
    AudioSys.play(760, 0.14, 'triangle', 0.07);
    return true;
  },

  sendTurretStateSync(targetPeerId = null) {
    const turretSystem = ModeManager?.activeMode?.turretSystem || this.ctx?.getTurretSystem?.();
    if (!turretSystem || !turretSystem.turrets) return;
    const turretList = [];
    for (const [_, t] of turretSystem.turrets) {
      const pos = t.position || t.group.position;
      turretList.push({
        id: t.id,
        typeId: t.cfg.id,
        x: pos.x,
        y: pos.y,
        z: pos.z,
        yaw: t.facingYaw || 0,
        levels: t.levels ? [...t.levels] : [0, 0, 0]
      });
    }
    if (turretList.length > 0) {
      if (targetPeerId) {
        this.sendToPeer(targetPeerId, 'TURRET_STATE_SYNC', { turrets: turretList }, true);
      } else {
        this.broadcast('TURRET_STATE_SYNC', { turrets: turretList }, true);
      }
    }
  },

  bindGameEvents() {
    // ModeManager.cleanupActiveMode() hace GameEvents.clear() al arrancar cada
    // partida, por lo que hay que re-suscribir estos listeners en cada match.
    for (const unsub of this.eventUnsubs) {
      try { unsub(); } catch (e) {}
    }
    this.eventUnsubs.length = 0;
    const on = (eventName, callback) => {
      this.eventUnsubs.push(GameEvents.on(eventName, callback));
    };

    // Sincronización de torretas construidas
    on('turret:built', ({ turret, typeId }) => {
      if (this.isApplyingRemote || !this.isOnline()) return;
      const pos = turret.position || turret.group.position;
      this.broadcast('TURRET_BUILD', {
        typeId,
        x: pos.x,
        y: pos.y,
        z: pos.z,
        yaw: turret.facingYaw || 0,
        turretId: turret.id
      }, true);
    });

    // Sincronización de torretas mejoradas
    on('turret:upgraded', ({ turret, pathIndex, level }) => {
      if (this.isApplyingRemote || !this.isOnline()) return;
      const pos = turret.position || turret.group.position;
      this.broadcast('TURRET_UPGRADE', {
        turretId: turret.id,
        x: pos.x,
        y: pos.y,
        z: pos.z,
        pathIndex,
        level: level ?? turret.levels[pathIndex]
      }, true);
    });

    // Sincronización de torretas vendidas
    on('turret:sold', ({ turret }) => {
      if (this.isApplyingRemote || !this.isOnline()) return;
      const pos = turret.position || turret.group.position;
      this.broadcast('TURRET_SELL', {
        turretId: turret.id,
        x: pos.x,
        y: pos.y,
        z: pos.z
      }, true);
    });

    // Sincronización de fases de oleada (Host autoritativo)
    on('wave:skip_prep', () => {
      if (this.isApplyingRemote || !this.isOnline()) return;
      this.sendWaveAction('SKIP_PREP');
    });

    on('wave:started', () => {
      if (this.isApplyingRemote || !this.isOnline() || !this.isHost()) return;
      this.sendWaveSnapshot();
    });

    on('wave:completed', () => {
      if (this.isApplyingRemote || !this.isOnline() || !this.isHost()) return;
      this.sendWaveSnapshot();
      // Este listener se registra después del modo, así que el heal de fin de
      // oleada ya se aplicó; el snapshot del Núcleo lleva el HP curado.
      this.sendCoreSnapshot();
    });

    on('defense:special_event_triggered', () => {
      if (this.isApplyingRemote || !this.isOnline() || !this.isHost()) return;
      // El modo ya creó activeEvent (incluye coordenadas exactas y fase).
      this.sendEventStart();
      this.sendWaveSnapshot();
    });

    on('defense:event_completed', payload => {
      if (this.isApplyingRemote || !this.isOnline() || !this.isHost()) return;
      this.broadcast('EVENT_END', {
        eventType: payload?.type || null,
        title: payload?.title || null,
        scrapReward: payload?.scrapReward || 0
      }, true);
      // El estado pasa a PREP justo después de este evento; el latido lo corrige.
      this.sendWaveSnapshot();
    });

    on('defense:victory', payload => {
      if (this.isApplyingRemote || !this.isOnline() || !this.isHost()) return;
      this.broadcast('MATCH_VICTORY', {
        wavesCompleted: payload.wavesCompleted,
        totalWaves: payload.totalWaves,
        matchTimestamp: this._matchInfo?.timestamp || 0
      }, true);
    });

    // Sincronización de daño al Núcleo (emitido por el Host)
    on('core:damaged', payload => {
      if (this.isApplyingRemote || !this.isOnline() || !this.isHost()) return;
      const currentHp = payload?.currentHp ?? payload?.hp;
      if (currentHp === undefined) return;
      this.broadcast('CORE_SYNC', { currentHp, maxHp: payload.maxHp }, true);
    });
  },

  sendAttack(weaponId, origin, dir, hit = null) {
    if (!this.isOnline()) return;
    this.broadcast('ATTACK', {
      weaponId,
      x: origin.x,
      y: origin.y,
      z: origin.z,
      originX: origin.x,
      originY: origin.y,
      originZ: origin.z,
      dirX: dir.x,
      dirY: dir.y || 0,
      dirZ: dir.z,
      hitX: hit ? hit.x : null,
      hitY: hit ? hit.y : null,
      hitZ: hit ? hit.z : null
    }, false);
  },

  sendWaveAction(action, payload = {}) {
    if (!this.isOnline()) return;
    this.broadcast('WAVE_ACTION', { action, ...payload }, true);
  },

  ensureRemotePlayer(senderSteamId, data = null) {
    let rp = this.remotePlayers.get(senderSteamId);
    if (!rp && this.ctx && this.ctx.scene) {
      rp = new RemotePlayer(senderSteamId, this.ctx.scene);
      this.remotePlayers.set(senderSteamId, rp);
      console.log(`[MultiplayerSync] RemotePlayer visual instanciado para: ${senderSteamId}`);
      try {
        AudioSys.play(700, 0.25, 'triangle', 0.15);
      } catch (e) {}
    }
    if (rp && data) {
      if (data.charId) rp.applyCharacterVisual(data.charId);
      if (data.x !== undefined && data.y !== undefined && data.z !== undefined) {
        rp.setTargetData(data);
      }
    }
    return rp;
  },

  remoteTurretKey(senderSteamId, remoteId) {
    return `${senderSteamId}:${remoteId}`;
  },

  registerRemoteTurret(senderSteamId, remoteId, turret) {
    if (!turret || remoteId === undefined || remoteId === null) return;
    this.remoteTurretIds.set(this.remoteTurretKey(senderSteamId, remoteId), turret.id);
  },

  // Resuelve el ID de red del emisor a la instancia local. Prioriza el mapa
  // de IDs y deja la distancia solo como respaldo para estados antiguos.
  resolveTurretForPacket(senderSteamId, remoteId, pos, radius = 1.2) {
    const turretSystem = ModeManager?.activeMode?.turretSystem || this.ctx?.getTurretSystem?.();
    if (!turretSystem || !turretSystem.turrets) return null;

    const key = this.remoteTurretKey(senderSteamId, remoteId);
    const mappedId = this.remoteTurretIds.get(key);
    if (mappedId) {
      const mapped = turretSystem.getTurretById(mappedId);
      if (mapped) return mapped;
      this.remoteTurretIds.delete(key);
    }

    if (remoteId !== undefined && remoteId !== null) {
      const direct = turretSystem.getTurretById(remoteId);
      // Los IDs locales pueden coincidir entre peers (turret_0, turret_1...).
      // Solo aceptamos el ID directo si la posición también corresponde.
      if (direct && (!pos || direct.position.distanceTo(pos) < Math.max(radius, 1.6))) {
        this.remoteTurretIds.set(key, direct.id);
        return direct;
      }
    }

    if (pos) {
      for (const t of turretSystem.turrets.values()) {
        if (t.position.distanceTo(pos) < radius) {
          this.remoteTurretIds.set(key, t.id);
          return t;
        }
      }
    }
    return null;
  },

  handlePacket(senderSteamId, text) {
    try {
      if (!senderSteamId) return;
      const localId = getLocalPlayerSteamId();
      if (senderSteamId === localId) return;

      const data = JSON.parse(text);
      if (!data || !data.type) return;

      if (!this.isMatchActive && !PRE_MATCH_PACKET_TYPES.has(data.type)) return;

      this.knownPeers.add(senderSteamId);

      if (this.isMatchActive && !this.modeReady && BUFFERED_PACKET_TYPES.has(data.type)) {
        if (this.pendingStatePackets.length < 200) {
          this.pendingStatePackets.push({ senderSteamId, data });
        }
        return;
      }

      switch (data.type) {
        case 'LOBBY_PING': {
          console.log('[MultiplayerSync] LOBBY_PING recibido de:', senderSteamId);
          const myId = getLocalPlayerSteamId();
          this.broadcast('LOBBY_PING_ACK', { sender: myId }, true);
          break;
        }

        case 'LOBBY_PING_ACK': {
          console.log('[MultiplayerSync] LOBBY_PING_ACK confirmado de:', senderSteamId);
          break;
        }

        case 'HELLO': {
          console.log('[MultiplayerSync] Handshake HELLO recibido de:', senderSteamId, data);
          const myChar = localStorage.getItem('traces_selected_character') || 'otto';
          const curPos = this.ctx?.playerGroup?.position || { x: 0, y: 0, z: 0 };
          this.broadcast('HELLO_ACK', {
            charId: myChar,
            x: curPos.x,
            y: curPos.y,
            z: curPos.z,
            t: Date.now()
          }, true);
          this.ensureRemotePlayer(senderSteamId, data);

          // Snapshot completo solo cuando el modo local ya está cargado.
          if (this.modeReady) {
            if (this.isHost()) this.sendFullState(senderSteamId);
            else this.sendTurretStateSync(senderSteamId);
          }
          break;
        }

        case 'HELLO_ACK': {
          console.log('[MultiplayerSync] Handshake HELLO_ACK recibido de:', senderSteamId, data);
          this.ensureRemotePlayer(senderSteamId, data);
          if (this.modeReady) {
            if (this.isHost()) this.sendFullState(senderSteamId);
            else this.sendTurretStateSync(senderSteamId);
          }
          break;
        }

        case 'NET_READY': {
          // El Host responde con el snapshot completo; el Cliente, si aún no
          // tiene el modo cargado, esperará a su propio NET_READY.
          if (this.isHost()) {
            if (this.modeReady) this.sendFullState(senderSteamId);
          } else if (this.modeReady && data.role === 'host') {
            // Solo respondemos al Host; evita ping-pong entre clientes.
            this.sendToPeer(senderSteamId, 'NET_READY', { role: 'client' }, true);
          }
          break;
        }

        case 'STATE_SYNC_COMPLETE': {
          if (this.modeReady) {
            this.markStateSynced();
            console.log('[MultiplayerSync] Snapshot de estado recibido; sincronización completa.');
          }
          break;
        }

        case 'ECONOMY_SYNC': {
          const mode = ModeManager?.activeMode;
          if (mode && data.initial && Number.isFinite(data.scrap)) {
            // Solo aplica la chatarra inicial si el Cliente aún no ha tocado su bolsillo.
            const initial = typeof mode.getInitialNetworkScrapShare === 'function'
              ? mode.getInitialNetworkScrapShare()
              : data.scrap;
            if (mode.scrap === initial) mode.scrap = data.scrap;
          }
          break;
        }

        case 'SCRAP_GAIN': {
          if (this.isHost()) break;
          const mode = ModeManager?.activeMode;
          const gain = Math.floor(Number(data.amount) || 0);
          if (mode && gain > 0) {
            mode.addScrap(gain, { fromTransfer: true });
          }
          break;
        }

        case 'SCRAP_TRANSFER': {
          const mode = ModeManager?.activeMode;
          const amount = Math.floor(Number(data.amount) || 0);
          if (mode && amount > 0 && amount <= 9999) {
            mode.addScrap(amount, { fromTransfer: true });
            this.ctx?.hudController?.showScrapTransferToast?.(`+${amount} CHATARRA RECIBIDA`, 'receive');
            AudioSys.play(920, 0.16, 'triangle', 0.08);
          }
          break;
        }

        case 'CORE_DAMAGE_REQUEST': {
          if (!this.isHost()) break;
          const mode = ModeManager?.activeMode;
          const amount = Math.floor(Number(data.amount) || 0);
          if (mode && typeof mode.applyCoreDamage === 'function' && amount > 0) {
            mode.applyCoreDamage(amount, mode._ctx, data.reason || 'remote');
          }
          break;
        }

        case 'WAVE_STATE': {
          if (this.isHost()) break;
          const mode = ModeManager?.activeMode;
          if (mode?.waveManager) {
            this.isApplyingRemote = true;
            try {
              // Si el Host ya cerró el evento especial, cerramos el espejo local.
              if (data.state !== 'EVENT' && mode.defenseEventManager?.isEventActive?.()) {
                mode.defenseEventManager.completeEvent({ fromNetwork: true });
              }
              mode.waveManager.applyNetworkState(data);
              this.markStateSynced();
              if (data.state === 'VICTORY' && typeof mode.handleNetworkVictory === 'function') {
                mode.handleNetworkVictory(data);
              }
            } finally {
              this.isApplyingRemote = false;
            }
          }
          break;
        }

        case 'EVENT_START': {
          if (this.isHost()) break;
          const mode = ModeManager?.activeMode;
          if (mode?.defenseEventManager && !mode.defenseEventManager.isEventActive?.()) {
            this.isApplyingRemote = true;
            try {
              mode.defenseEventManager.startEvent(data.eventType, {
                position: new THREE.Vector3(data.x, data.y, data.z),
                targetName: data.targetName,
                article: data.article,
                duration: data.duration,
                radius: data.radius,
                elapsed: data.elapsed,
                phase: data.phase,
                progress: data.progress,
                waveIndex: data.waveIndex
              });
            } finally {
              this.isApplyingRemote = false;
            }
          }
          break;
        }

        case 'EVENT_STATE': {
          if (this.isHost()) break;
          const mode = ModeManager?.activeMode;
          if (mode?.defenseEventManager?.isEventActive?.()) {
            mode.defenseEventManager.applyNetworkState(data);
          }
          break;
        }

        case 'EVENT_END': {
          if (this.isHost()) break;
          const mode = ModeManager?.activeMode;
          if (mode?.defenseEventManager?.isEventActive?.()) {
            this.isApplyingRemote = true;
            try {
              mode.defenseEventManager.completeEvent({ fromNetwork: true });
            } finally {
              this.isApplyingRemote = false;
            }
          }
          break;
        }

        case 'MATCH_VICTORY': {
          if (this.isHost()) break;
          const ts = data.matchTimestamp;
          if (ts && this._matchInfo?.timestamp && ts !== this._matchInfo.timestamp) break;
          const mode = ModeManager?.activeMode;
          if (mode && typeof mode.handleNetworkVictory === 'function') {
            mode.handleNetworkVictory(data);
          }
          break;
        }

        case 'MATCH_INFO': {
          if (this.isHost()) break;
          // El Host es autoritativo también para el timestamp de la partida:
          // un late-join desde matchState antiguo debe adoptar el actual.
          this._matchInfo = {
            mode: data.mode || this._matchInfo?.mode,
            mapId: data.mapId || this._matchInfo?.mapId,
            diff: data.diff || this._matchInfo?.diff,
            timestamp: data.timestamp || this._matchInfo?.timestamp || Date.now()
          };
          this.validateMatchInfo(data);
          break;
        }

        case 'MATCH_RESTART': {
          if (this.isHost()) break;
          const info = {
            mode: data.mode,
            mapId: data.mapId,
            diff: data.diff,
            timestamp: data.timestamp || Date.now(),
            action: 'START',
            isHost: false
          };
          setLastLaunchedMatchTimestamp(info.timestamp);
          launchClientMatch(info);
          break;
        }

        case 'PEER_LEFT': {
          const senderSteamId = senderId ? String(senderId) : null;
          this.handlePeerLeft(senderSteamId);
          break;
        }

        case 'MATCH_END': {
          if (!this.isMatchActive) break;
          // Solo el Host puede emitir MATCH_END / cerrar la partida para ambos.
          if (this.isHost()) {
            console.warn('[MultiplayerSync] MATCH_END recibido en Host de un cliente. Tratándolo como PEER_LEFT.');
            this.handlePeerLeft(senderId ? String(senderId) : null);
            break;
          }
          const ts = data.matchTimestamp;
          if (ts && this._matchInfo?.timestamp && ts !== this._matchInfo.timestamp) break;
          this._endingFromRemote = true;
          this.ctx?.onMatchEnded?.('El Host ha finalizado la sesión.');
          break;
        }

        case 'MATCH_OVER': {
          if (this.isHost()) break;
          if (data.outcome) {
            const ts = data.outcome.matchTimestamp;
            if (ts && this._matchInfo?.timestamp && ts !== this._matchInfo.timestamp) break;
            this.ctx?.onRemoteRunEnded?.(data.outcome);
          }
          break;
        }

        case 'PLAYER_RUN_END': {
          if (!this.isHost()) break;
          if (data.outcome) {
            const ts = data.outcome.matchTimestamp;
            if (ts && this._matchInfo?.timestamp && ts !== this._matchInfo.timestamp) break;
            this.ctx?.onRemoteRunEnded?.(data.outcome);
          }
          break;
        }

        case 'ENEMY_SPAWN': {
          if (this.isHost()) break;
          this.spawnReplicatedEnemy(data);
          break;
        }

        case 'ENEMY_DIE': {
          if (this.isHost()) break;
          this.handleEnemyDiePacket(data);
          break;
        }

        case 'ENEMY_LEAK': {
          if (this.isHost()) break;
          this.handleEnemyLeakPacket(data);
          break;
        }

        case 'ENEMY_BATCH_SYNC': {
          if (this.isHost()) break;
          this.applyEnemyBatch(data);
          break;
        }

        case 'ENEMY_PROJECTILE': {
          if (this.isHost()) break;
          this.spawnReplicatedProjectile(data);
          break;
        }

        case 'ENEMY_HAZARD': {
          if (this.isHost()) break;
          this.spawnReplicatedHazard(data);
          break;
        }

        case 'PLAYER_HIT': {
          if (!this.isHost()) break;
          this.applyRemotePlayerHit(data);
          break;
        }

        case 'PICKUP_SPAWN': {
          if (this.isHost()) break;
          this.spawnReplicatedPickup(data);
          break;
        }

        case 'PICKUP_COLLECT': {
          if (!this.isHost()) break;
          this.handlePickupCollectRequest(senderSteamId, data);
          break;
        }

        case 'PICKUP_COLLECTED': {
          if (this.isHost()) break;
          this.handlePickupCollected(data);
          break;
        }

        case 'START_MATCH': {
          const lastTs = getLastLaunchedMatchTimestamp();
          if (data.action === 'START' && (!lastTs || data.timestamp > lastTs)) {
            setLastLaunchedMatchTimestamp(data.timestamp);
            launchClientMatch(data);
          }
          break;
        }

        case 'POS': {
          const rp = this.ensureRemotePlayer(senderSteamId);
          if (rp) {
            if (data.charId) rp.applyCharacterVisual(data.charId);
            rp.setTargetData(data);
          }
          break;
        }

        case 'ATTACK': {
          const rp = this.ensureRemotePlayer(senderSteamId);
          if (rp) {
            const durations = {
              slash: 0.22, shotgun: 0.28, flamethrower: 0.14, mines: 0.22,
              mine_blast: 0.2, harpoon: 0.25, bolt: 0.24, aura: 0.2, orbital: 0.15
            };
            rp.triggerAttackVisual(data.weaponId, durations[data.weaponId] || 0.2);
            this.playRemoteAttackFx(data);
          }
          break;
        }

        case 'TURRET_BUILD': {
          const turretSystem = ModeManager?.activeMode?.turretSystem || this.ctx?.getTurretSystem?.();
          const cfg = CORE_DEFENSE_CONFIG.TURRETS[data.typeId];
          if (turretSystem && cfg) {
            const pos = new THREE.Vector3(data.x, data.y, data.z);
            // Evita solapar dos torretas creadas en el mismo instante por ambos peers.
            const minSeparation = Math.max(1.0, (cfg.base?.collisionRadius || 0.5) * 2);
            let turret = this.resolveTurretForPacket(senderSteamId, data.turretId, pos, minSeparation);
            if (!turret) {
              this.isApplyingRemote = true;
              try {
                turret = turretSystem.createTurret(pos, cfg);
              } catch (e) {
                console.warn('[MultiplayerSync] Error al crear torreta remota:', e);
              } finally {
                this.isApplyingRemote = false;
              }
            }
            this.registerRemoteTurret(senderSteamId, data.turretId, turret);
          }
          break;
        }

        case 'TURRET_UPGRADE': {
          const pos = new THREE.Vector3(data.x, data.y, data.z);
          const turret = this.resolveTurretForPacket(senderSteamId, data.turretId, pos, 1.2);
          if (turret) {
            this.isApplyingRemote = true;
            try {
              turret.upgrade(data.pathIndex);
            } catch (e) {
              console.warn('[MultiplayerSync] Error al mejorar torreta remota:', e);
            } finally {
              this.isApplyingRemote = false;
            }
          }
          break;
        }

        case 'TURRET_SELL': {
          const pos = new THREE.Vector3(data.x, data.y, data.z);
          const turret = this.resolveTurretForPacket(senderSteamId, data.turretId, pos, 1.2);
          if (turret) {
            const turretSystem = ModeManager?.activeMode?.turretSystem || this.ctx?.getTurretSystem?.();
            const localId = turret.id;
            this.isApplyingRemote = true;
            try {
              // remote: el receptor elimina la torreta pero no recibe reembolso.
              turretSystem.sellTurret(localId, { remote: true });
              this.remoteTurretIds.delete(this.remoteTurretKey(senderSteamId, data.turretId));
            } catch (e) {
              console.warn('[MultiplayerSync] Error al vender torreta remota:', e);
            } finally {
              this.isApplyingRemote = false;
            }
          }
          break;
        }

        case 'TURRET_STATE_SYNC': {
          const turretSystem = ModeManager?.activeMode?.turretSystem || this.ctx?.getTurretSystem?.();
          if (turretSystem && Array.isArray(data.turrets)) {
            this.isApplyingRemote = true;
            try {
              for (const tData of data.turrets) {
                const cfg = CORE_DEFENSE_CONFIG.TURRETS[tData.typeId];
                if (!cfg) continue;
                const pos = new THREE.Vector3(tData.x, tData.y, tData.z);
                let turret = this.resolveTurretForPacket(senderSteamId, tData.id, pos, 0.8);
                if (!turret) {
                  turret = turretSystem.createTurret(pos, cfg);
                }
                this.registerRemoteTurret(senderSteamId, tData.id, turret);
                if (turret && Array.isArray(tData.levels)) {
                  tData.levels.forEach((lvl, pIdx) => {
                    while (turret.levels[pIdx] < lvl) {
                      if (!turret.upgrade(pIdx)) break;
                    }
                  });
                }
              }
            } catch (e) {
              console.warn('[MultiplayerSync] Error en TURRET_STATE_SYNC:', e);
            } finally {
              this.isApplyingRemote = false;
            }
          }
          break;
        }

        case 'WAVE_ACTION': {
          const modeManager = ModeManager || this.ctx?.getModeManager?.();
          const mode = modeManager?.activeMode;
          if (!mode) break;
          if (data.action === 'SKIP_PREP') {
            this.isApplyingRemote = true;
            try {
              mode.skipPrep?.();
              // Si el Host ejecuta el salto solicitado por el Cliente, difunde
              // el nuevo estado explícitamente (el guard isApplyingRemote
              // silenciaría el listener normal de wave:started).
              if (this.isHost()) this.sendWaveSnapshot();
            } finally {
              this.isApplyingRemote = false;
            }
          }
          // START_WAVE / WAVE_SYNC quedan obsoletos: el estado real viaja
          // siempre como snapshot WAVE_STATE desde el Host.
          break;
        }

        case 'CORE_SYNC': {
          const modeManager = ModeManager || this.ctx?.getModeManager?.();
          const mode = modeManager?.activeMode;
          if (!mode || data.currentHp === undefined) break;
          this.isApplyingRemote = true;
          try {
            if (typeof mode.applyRemoteCoreState === 'function') {
              mode.applyRemoteCoreState(data.currentHp, data.maxHp);
            } else if (mode.coreMachine) {
              mode.coreMachine.hp = data.currentHp;
              mode.coreMachine.updateVisualDamage?.();
            }
          } finally {
            this.isApplyingRemote = false;
          }
          break;
        }
      }
    } catch (e) {
      console.warn('[MultiplayerSync] Error al parsear paquete:', e);
    }
  },

  update(dt, camAngle, camera, localState) {
    if (!this.isOnline()) {
      return;
    }

    // 1. Envío periódico de posición a 20Hz (cada 50ms). Se conserva el
    // remanente para no perder cadencia cuando dt no es múltiplo exacto.
    this.sendTimer += dt;
    if (this.sendTimer >= 0.05) {
      this.sendTimer %= 0.05;
      this.posSeq++;
      this.broadcast('POS', {
        seq: this.posSeq,
        x: localState.x,
        y: localState.y,
        z: localState.z,
        yaw: localState.yaw,
        pitch: localState.pitch ?? 0,
        isMoving: !!localState.isMoving,
        pState: localState.pState,
        hp: localState.hp,
        maxHp: localState.maxHp,
        down: !!localState.down,
        downTimer: localState.downTimer || 0,
        charId: localState.charId
      }, false);
    }

    // 1b. Daño agregado del Cliente hacia el Host (máx. 20 Hz).
    this.playerHitFlushTimer += dt;
    if (this.playerHitFlushTimer >= 0.05) {
      this.playerHitFlushTimer %= 0.05;
      this.flushPlayerHits();
    }

    // 1c. Enemigos/proyectiles/telegrafías y latido autoritativo del Host.
    if (this.isHost() && this.modeReady) {
      this.flushEnemySpawns();
      this.flushEnemyAttacks();

      this.enemySyncTimer += dt;
      if (this.enemySyncTimer >= 0.1) {
        this.enemySyncTimer %= 0.1;
        this.sendEnemyBatch();
      }
    }

    // 1d. Latido autoritativo: corrige oleada, cola, Núcleo y evento aunque
    // se pierda algún evento puntual (reliable, 1 Hz).
    this.stateHeartbeat += dt;
    if (this.stateHeartbeat >= 1.0) {
      this.stateHeartbeat = 0;
      if (this.isHost() && this.modeReady) {
        this.sendWaveSnapshot();
        this.sendCoreSnapshot();
        this.sendEventState();
      }
    }

    // 2. Actualización de animación y visuales de cada compañero remoto
    for (const [_, player] of this.remotePlayers) {
      player.update(dt, camAngle, camera);
    }
  },

  getPrimaryRemotePlayerPos() {
    for (const [_, p] of this.remotePlayers) {
      if (p.group && p.group.position) return p.group.position;
    }
    return null;
  },

  reset() {
    if (this.handshakeTimer) {
      clearInterval(this.handshakeTimer);
      this.handshakeTimer = null;
    }
    this.clearStateSyncRetry();
    for (const unsub of this.eventUnsubs) {
      try { unsub(); } catch (e) {}
    }
    this.eventUnsubs.length = 0;
    for (const [_, player] of this.remotePlayers) {
      player.destroy();
    }
    this.remotePlayers.clear();
    this.knownPeers.clear();
    this.remoteTurretIds.clear();
    this.pendingStatePackets.length = 0;
    this.sentEnemySpawns.clear();
    this.pendingPlayerHits.clear();
    this.enemySyncTimer = 0;
    this.enemyBatchSeq = 0;
    this.lastEnemyBatchSeq = 0;
    this.playerHitFlushTimer = 0;
    this.isMatchActive = false;
    this.modeReady = false;
    this.stateSyncReceived = false;
    this.stateHeartbeat = 0;
    this.posSeq = 0;
    this.sendTimer = 0;
    this.scrapOddToHost = false;
    this._matchInfo = null;
    this._endingFromRemote = false;
    this._lastMatchInfoRestartAt = 0;
    this._isHostRole = undefined;
  }
};
