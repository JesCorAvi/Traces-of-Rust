// Adaptador P2P para navegador: replica la interfaz de preload.cjs (Steamworks)
// sobre WebRTC, usando PeerJS solo para señalización y STUN públicos gratuitos.
// Exports: installWebRtcAdapter, normalizeRoomCode.

const ROOM_PREFIX = 'traces-of-rust-room-';
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_CODE_LENGTH = 6;
const MAX_MEMBERS = 4;
const CONTROL_KEY = '__tracesWebRtc';
const PEERJS_CDNS = [
  'https://esm.sh/peerjs@1.5.4',
  'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/+esm',
  'https://unpkg.com/peerjs@1.5.4/dist/bundler.mjs'
];
const PEER_OPTIONS = {
  debug: 1,
  config: {
    iceServers: [
      { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
      { urls: 'stun:stun.cloudflare.com:3478' }
    ]
  }
};

const listeners = {
  lobbyUpdated: new Set(),
  lobbyJoined: new Set(),
  lobbyClosed: new Set(),
  p2pPacket: new Set(),
  peerDisconnected: new Set()
};

let installed = false;
let localSteamId = '';
let localPlayerName = 'Operador Host';
let currentRole = 'host';
let currentPeer = null;
let currentRoomCode = '';
let currentHostPeerId = '';
let lobby = null;
let lobbyData = {};
let hostMembers = new Map();
let peers = new Map();
let pendingReliable = [];
let pendingWelcome = null;
let joinSignal = null;
let teardown = false;
let toastTimer = null;
let peerCtorPromise = null;

function addListener(name, callback) {
  if (typeof callback !== 'function') return () => {};
  listeners[name].add(callback);
  return () => listeners[name].delete(callback);
}

function emit(name, payload) {
  for (const callback of Array.from(listeners[name])) {
    try {
      callback(payload);
    } catch (err) {
      console.warn(`[WebRTC] Error en listener ${name}:`, err);
    }
  }
}

function randomBytes(length) {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
    return bytes;
  }
  for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return bytes;
}

function createLocalSteamId() {
  const bytes = randomBytes(6);
  let suffix = '';
  for (const byte of bytes) suffix += byte.toString(16).padStart(2, '0');
  return `web_${suffix}`;
}

function generateRoomCode() {
  const bytes = randomBytes(ROOM_CODE_LENGTH);
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_ALPHABET[bytes[i] % ROOM_CODE_ALPHABET.length];
  }
  return code;
}

function roomPeerId(code) {
  return `${ROOM_PREFIX}${code}`;
}

function sanitizeSteamId(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim().slice(0, 64);
}

function sanitizePlayerName(value, fallback = 'Operador Cliente') {
  const name = String(value || '').trim().slice(0, 32);
  return name || fallback;
}

export function normalizeRoomCode(value) {
  if (value === null || value === undefined) return '';
  let raw = String(value).trim();
  if (!raw) return '';

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      raw = url.searchParams.get('room') || raw;
    } catch (e) {}
  }

  const prefixIndex = raw.toUpperCase().indexOf(ROOM_PREFIX.toUpperCase());
  if (prefixIndex >= 0) {
    raw = raw.slice(prefixIndex + ROOM_PREFIX.length);
  } else {
    const roomParamIndex = raw.toUpperCase().indexOf('ROOM=');
    if (roomParamIndex >= 0) raw = raw.slice(roomParamIndex + 5);
  }

  const compact = raw.replace(/\s+/g, '').toUpperCase();
  return /^[A-Z0-9]{6}$/.test(compact) ? compact : '';
}

function isReliableSendType(sendType) {
  if (sendType === true) return true;
  if (typeof sendType === 'number') return sendType === 2;
  if (typeof sendType === 'string') {
    const normalized = sendType.trim().toLowerCase();
    return normalized === 'reliable' || normalized === '2';
  }
  return false;
}

async function loadPeerCtor() {
  if (peerCtorPromise) return peerCtorPromise;
  const loader = (async () => {
    let lastError = null;
    for (const url of PEERJS_CDNS) {
      try {
        const mod = await import(url);
        const ctor = mod?.Peer
          || mod?.default?.Peer
          || (typeof mod?.default === 'function' ? mod.default : null);
        if (typeof ctor === 'function') return ctor;
      } catch (err) {
        lastError = err;
      }
    }
    throw new Error('No se pudo cargar PeerJS desde el CDN: ' + (lastError?.message || 'sin conexión'));
  })();
  peerCtorPromise = loader.catch((err) => {
    peerCtorPromise = null;
    throw err;
  });
  return peerCtorPromise;
}

function createPeerInstance(PeerCtor, id) {
  return new PeerCtor(id || undefined, PEER_OPTIONS);
}

function waitForPeerOpen(peer, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    if (peer.open) return resolve();
    let settled = false;
    const timer = setTimeout(() => finish(new Error('Tiempo de espera al conectar con PeerJS.')), timeoutMs);
    const onOpen = () => finish();
    const onError = (err) => finish(err);
    function finish(err) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        peer.off('open', onOpen);
        peer.off('error', onError);
      } catch (e) {}
      if (err) reject(err); else resolve();
    }
    peer.on('open', onOpen);
    peer.on('error', onError);
  });
}

function waitForConnOpen(conn, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    if (conn.open) return resolve();
    let settled = false;
    const timer = setTimeout(() => finish(new Error('Tiempo de espera al abrir el canal WebRTC.')), timeoutMs);
    const onOpen = () => finish();
    const onError = (err) => finish(err || new Error('Error al abrir el canal WebRTC.'));
    function finish(err) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        conn.off('open', onOpen);
        conn.off('error', onError);
      } catch (e) {}
      if (err) reject(err); else resolve();
    }
    conn.on('open', onOpen);
    conn.on('error', onError);
  });
}

function waitForWelcome(timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (pendingWelcome === waiter) pendingWelcome = null;
      reject(new Error('El Host no confirmó la conexión WebRTC.'));
    }, timeoutMs);
    const waiter = {
      resolve: () => {
        clearTimeout(timer);
        if (pendingWelcome === waiter) pendingWelcome = null;
        resolve();
      },
      reject: (err) => {
        clearTimeout(timer);
        if (pendingWelcome === waiter) pendingWelcome = null;
        reject(err);
      }
    };
    pendingWelcome = waiter;
  });
}

function rejectPendingWelcome(message) {
  const waiter = pendingWelcome;
  pendingWelcome = null;
  if (waiter) {
    try { waiter.reject(new Error(message)); } catch (e) {}
  }
}

function beginJoinSignal() {
  let rejectFn = () => {};
  const promise = new Promise((_, reject) => { rejectFn = reject; });
  promise.catch(() => {});
  joinSignal = {
    promise,
    fail: (message) => rejectFn(new Error(message))
  };
  return joinSignal;
}

function failJoin(message) {
  if (!joinSignal) return;
  try { joinSignal.fail(message); } catch (e) {}
}

function describeJoinError(err) {
  if (!err) return 'No se pudo conectar a la sala.';
  if (err.type === 'peer-unavailable') return 'La sala no existe o el Host ya no está disponible.';
  if (err.type === 'unavailable-id') return 'Ese código de sala ya está en uso.';
  if (err.type === 'network' || err.type === 'server-error' || err.type === 'socket-error') {
    return 'No se pudo contactar con el servidor de señalización PeerJS.';
  }
  return err.message || String(err);
}

function showToast(message, tone = 'ok') {
  if (typeof document === 'undefined' || !document.body) return;
  let el = document.getElementById('webrtc-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'webrtc-toast';
    el.style.cssText = [
      'position:fixed',
      'left:50%',
      'bottom:92px',
      'transform:translate(-50%, 8px)',
      'z-index:10050',
      'padding:9px 16px',
      'background:rgba(6,10,6,0.96)',
      'border:1px solid #4e8a44',
      'box-shadow:0 0 18px rgba(0,0,0,0.65)',
      'font-family:"VT323",monospace',
      'font-size:17px',
      'letter-spacing:0.4px',
      'pointer-events:none',
      'opacity:0',
      'transition:opacity .18s ease, transform .18s ease',
      'white-space:nowrap'
    ].join(';');
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.style.color = tone === 'error' ? '#ff8a7a' : (tone === 'warn' ? '#f0c954' : '#9cf58a');
  el.style.borderColor = tone === 'error' ? '#8a2020' : '#4e8a44';
  el.style.opacity = '1';
  el.style.transform = 'translate(-50%, 0)';
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translate(-50%, 8px)';
  }, 2800);
}

async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      // En iframes/headless el permiso puede quedarse pendiente: no bloquear
      // la UI y caer al portapapeles clásico si no responde.
      const wrote = navigator.clipboard.writeText(text).then(() => true).catch(() => false);
      const copied = await Promise.race([
        wrote,
        new Promise((resolve) => setTimeout(() => resolve(false), 1500))
      ]);
      if (copied) return true;
    }
  } catch (e) {}
  try {
    const input = document.createElement('textarea');
    input.value = text;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.focus();
    input.select();
    const copied = document.execCommand('copy');
    input.remove();
    return !!copied;
  } catch (e) {
    return false;
  }
}

function buildInviteUrl(code) {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('room', code);
    url.hash = '';
    return url.toString();
  } catch (e) {
    return String(window.location?.href || '') + `?room=${code}`;
  }
}

function getLobbyDetails() {
  if (currentRole === 'host') {
    if (!currentRoomCode) return null;
    const members = Array.from(hostMembers.values()).map((member) => ({
      steamId: member.steamId,
      isOwner: member.steamId === localSteamId,
      playerName: member.playerName
    }));
    return {
      lobbyId: currentRoomCode,
      ownerSteamId: localSteamId,
      memberCount: members.length,
      memberLimit: MAX_MEMBERS,
      title: `SALA CO-OP WEBRTC: ${localPlayerName}`,
      hostName: localPlayerName,
      hostSteamId: localSteamId,
      matchState: lobbyData.matchState ?? null,
      members
    };
  }

  if (!lobby) return null;
  const members = Array.isArray(lobby.members) ? lobby.members : [];
  return {
    lobbyId: lobby.lobbyId || currentRoomCode,
    ownerSteamId: lobby.ownerSteamId || currentHostPeerId,
    memberCount: members.length || lobby.memberCount || 1,
    memberLimit: lobby.memberLimit || MAX_MEMBERS,
    title: lobby.title || 'SALA CO-OP WEBRTC',
    hostName: lobby.hostName || 'Operador Host',
    hostSteamId: lobby.hostSteamId || lobby.ownerSteamId || currentHostPeerId,
    matchState: lobby.matchState ?? null,
    members
  };
}

function sanitizeLobby(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const members = Array.isArray(raw.members)
    ? raw.members
      .filter((member) => member && member.steamId)
      .map((member) => ({
        steamId: sanitizeSteamId(member.steamId),
        isOwner: !!member.isOwner,
        playerName: sanitizePlayerName(member.playerName, 'Operador')
      }))
    : [];
  return {
    lobbyId: raw.lobbyId ? String(raw.lobbyId).slice(0, 32) : currentRoomCode,
    ownerSteamId: raw.ownerSteamId ? sanitizeSteamId(raw.ownerSteamId) : null,
    memberCount: Number(raw.memberCount) || members.length || 1,
    memberLimit: Number(raw.memberLimit) || MAX_MEMBERS,
    title: raw.title ? String(raw.title).slice(0, 64) : 'SALA CO-OP WEBRTC',
    hostName: raw.hostName ? sanitizePlayerName(raw.hostName, 'Operador Host') : 'Operador Host',
    hostSteamId: raw.hostSteamId ? sanitizeSteamId(raw.hostSteamId) : null,
    matchState: raw.matchState ?? null,
    members
  };
}

function sendControl(record, message) {
  if (!record || !record.reliableConn || !record.reliableConn.open) return false;
  try {
    record.reliableConn.send({ [CONTROL_KEY]: true, ...message });
    return true;
  } catch (err) {
    console.warn('[WebRTC] Error al enviar control:', err);
    return false;
  }
}

function getAllPeerRecords() {
  return Array.from(peers.values());
}

function resolvePeer(targetId) {
  const target = String(targetId || '');
  if (!target) return null;
  if (peers.has(target)) return peers.get(target);
  for (const record of peers.values()) {
    if (record.steamId && record.steamId === target) return record;
  }
  // Un cliente solo tiene al Host: permite resolver antes de recibir WELCOME.
  if (currentRole === 'client' && peers.size === 1) {
    return peers.values().next().value;
  }
  return null;
}

function queueReliablePacket(peerId, text) {
  pendingReliable.push({ peerId, text, ts: Date.now() });
  if (pendingReliable.length > 200) {
    pendingReliable.splice(0, pendingReliable.length - 200);
  }
}

function flushPendingReliable(record) {
  if (!record || !record.reliableConn || !record.reliableConn.open) return;
  const now = Date.now();
  const remaining = [];
  for (const packet of pendingReliable) {
    if (packet.peerId !== record.peerId) {
      remaining.push(packet);
      continue;
    }
    if (now - packet.ts > 10000) continue;
    try {
      record.reliableConn.send(packet.text);
    } catch (err) {
      remaining.push(packet);
    }
  }
  pendingReliable = remaining;
}

function sendP2PPacket(targetId, payload, sendType = 'Unreliable') {
  const record = resolvePeer(targetId);
  if (!record || payload === undefined) return false;

  const reliable = isReliableSendType(sendType);
  let text;
  try {
    text = typeof payload === 'string' ? payload : JSON.stringify(payload);
  } catch (err) {
    console.warn('[WebRTC] Payload P2P no serializable:', err);
    return false;
  }
  if (typeof text !== 'string') return false;

  const preferred = reliable ? record.reliableConn : record.unreliableConn;
  const fallback = record.reliableConn;
  let conn = preferred && preferred.open ? preferred : null;
  if (!conn && fallback && fallback.open) conn = fallback;

  if (!conn) {
    if (reliable) queueReliablePacket(record.peerId, text);
    return false;
  }

  try {
    conn.send(text);
    return true;
  } catch (err) {
    const alternate = preferred === fallback ? record.unreliableConn : fallback;
    if (alternate && alternate.open) {
      try {
        alternate.send(text);
        return true;
      } catch (e) {}
    }
    if (reliable) queueReliablePacket(record.peerId, text);
    return false;
  }
}

function getOrCreatePeerRecord(peerId) {
  let record = peers.get(peerId);
  if (!record) {
    record = {
      peerId,
      steamId: '',
      playerName: 'Operador Cliente',
      helloReceived: false,
      reliableConn: null,
      unreliableConn: null,
      closeTimer: null,
      disconnectedNotified: false
    };
    peers.set(peerId, record);
  }
  return record;
}

function broadcastLobbyState() {
  if (currentRole !== 'host' || !currentRoomCode) return;
  const details = getLobbyDetails();
  if (!details) return;
  for (const record of getAllPeerRecords()) {
    if (!record.helloReceived) continue;
    sendControl(record, { type: 'LOBBY_STATE', lobby: details });
  }
}

function rejectPeerRecord(record, reason) {
  sendControl(record, { type: 'REJECT', reason });
  setTimeout(() => {
    try { record.reliableConn?.close(); } catch (e) {}
    try { record.unreliableConn?.close(); } catch (e) {}
    peers.delete(record.peerId);
  }, 250);
}

function handleHello(record, message) {
  if (currentRole !== 'host') return;
  const steamId = sanitizeSteamId(message.steamId) || record.peerId;
  const existing = hostMembers.get(steamId);

  if (steamId === localSteamId || (existing && existing.peerId !== record.peerId)) {
    rejectPeerRecord(record, 'duplicate');
    return;
  }
  if (!existing && hostMembers.size >= MAX_MEMBERS) {
    rejectPeerRecord(record, 'full');
    return;
  }

  record.steamId = steamId;
  record.playerName = sanitizePlayerName(message.playerName, 'Operador Cliente');
  record.helloReceived = true;

  if (!existing) {
    hostMembers.set(steamId, {
      steamId,
      isOwner: false,
      playerName: record.playerName,
      peerId: record.peerId
    });
  }

  sendControl(record, {
    type: 'WELCOME',
    hostSteamId: localSteamId,
    hostName: localPlayerName,
    lobby: getLobbyDetails()
  });
  broadcastLobbyState();
  const details = getLobbyDetails();
  if (details) emit('lobbyUpdated', details);
}

function handleWelcome(record, message) {
  if (currentRole !== 'client') return;
  record.steamId = sanitizeSteamId(message.hostSteamId) || record.steamId || record.peerId;
  currentHostPeerId = record.peerId;
  if (message.lobby) {
    lobby = sanitizeLobby(message.lobby);
    if (lobby) {
      lobby.ownerSteamId = lobby.ownerSteamId || record.steamId;
      lobby.hostSteamId = lobby.hostSteamId || record.steamId;
    }
  }
  const waiter = pendingWelcome;
  if (waiter) waiter.resolve();
  const details = getLobbyDetails();
  if (details) emit('lobbyUpdated', details);
}

function handleLobbyState(record, message) {
  if (currentRole !== 'client') return;
  const nextLobby = sanitizeLobby(message.lobby);
  if (!nextLobby) return;
  lobby = nextLobby;
  if (!lobby.ownerSteamId) lobby.ownerSteamId = record.steamId || currentHostPeerId;
  if (!lobby.hostSteamId) lobby.hostSteamId = lobby.ownerSteamId;
  lobbyData.matchState = lobby.matchState;
  const details = getLobbyDetails();
  if (details) emit('lobbyUpdated', details);
}

function handleControlMessage(record, message) {
  switch (message.type) {
    case 'HELLO':
      handleHello(record, message);
      break;
    case 'WELCOME':
      handleWelcome(record, message);
      break;
    case 'LOBBY_STATE':
      handleLobbyState(record, message);
      break;
    case 'LOBBY_CLOSED':
    case 'REJECT':
      if (currentRole === 'client') {
        const isEnded = message.type === 'LOBBY_CLOSED' || message.reason === 'ended';
        const msg = isEnded
          ? 'Esta partida ya ha finalizado o la sala se ha cerrado.'
          : (message.reason === 'full' ? 'La sala está llena (máximo 4 operadores).' : 'El Host rechazó la conexión.');
        rejectPendingWelcome(msg);
        failJoin(msg);
      }
      break;
    case 'ROOM_CLOSED':
      if (currentRole === 'client') handleHostDisconnect(record, message.reason || 'host-left');
      break;
    case 'PING':
      if (currentRole === 'host') sendControl(record, { type: 'PONG' });
      break;
    default:
      break;
  }
}

function handleIncomingData(record, raw) {
  let message = raw;
  if (typeof raw === 'string') {
    try { message = JSON.parse(raw); } catch (e) { message = null; }
  }

  if (message && typeof message === 'object' && message[CONTROL_KEY] === true) {
    handleControlMessage(record, message);
    return;
  }

  let text;
  try {
    text = typeof raw === 'string' ? raw : JSON.stringify(raw);
  } catch (e) {
    return;
  }
  if (typeof text !== 'string') return;

  const senderSteamId = record.steamId
    || record.peerId
    || (currentRole === 'client' ? currentHostPeerId : '');
  if (!senderSteamId) return;
  emit('p2pPacket', { senderSteamId, text });
}

function handleClientGone(record) {
  if (record.disconnectedNotified || teardown) return;
  record.disconnectedNotified = true;
  const steamId = record.steamId || record.peerId;
  const wasMember = !!(steamId && hostMembers.delete(steamId));
  peers.delete(record.peerId);
  if (!wasMember) return;
  broadcastLobbyState();
  const details = getLobbyDetails();
  if (details) emit('lobbyUpdated', details);
  emit('peerDisconnected', { steamId, error: 'connection-closed' });
}

function handleHostDisconnect(record, reason) {
  if (currentRole !== 'client' || teardown) return;
  if (record.disconnectedNotified) return;
  record.disconnectedNotified = true;
  const hostSteamId = record.steamId || currentHostPeerId;
  failJoin('El Host cerró la sala.');
  rejectPendingWelcome('El Host cerró la sala.');
  emit('peerDisconnected', { steamId: hostSteamId, error: reason || 'host-left' });
  emit('lobbyClosed', { reason: reason || 'host-left' });
  leaveLobby({ silent: true });
}

function handleConnectionClosed(record, channelName, conn) {
  if (teardown) return;
  if (channelName === 'unreliable') {
    if (record.unreliableConn === conn) record.unreliableConn = null;
    return;
  }
  if (record.reliableConn === conn) record.reliableConn = null;
  if (record.closeTimer) clearTimeout(record.closeTimer);
  record.closeTimer = setTimeout(() => {
    record.closeTimer = null;
    if (record.reliableConn && record.reliableConn.open) return;
    if (currentRole === 'host') {
      handleClientGone(record);
    } else if (currentRole === 'client' && record.peerId === currentHostPeerId) {
      handleHostDisconnect(record, 'host-left');
    }
  }, 350);
}

function attachConnection(record, conn, channelName) {
  const key = channelName === 'unreliable' ? 'unreliableConn' : 'reliableConn';
  record[key] = conn;

  const onOpen = () => {
    if (channelName === 'reliable') flushPendingReliable(record);
  };

  conn.on('data', (raw) => handleIncomingData(record, raw));
  conn.on('close', () => handleConnectionClosed(record, channelName, conn));
  conn.on('error', (err) => {
    console.warn('[WebRTC] Error en DataChannel:', err?.type || err?.message || err);
  });
  if (conn.open) onOpen(); else conn.on('open', onOpen);
}

function handleIncomingConnection(conn) {
  if (currentRole !== 'host' || !currentRoomCode) {
    try { conn.close(); } catch (e) {}
    return;
  }

  const channelName = conn.metadata?.channel === 'unreliable' ? 'unreliable' : 'reliable';
  const record = getOrCreatePeerRecord(conn.peer);

  const isEnded = lobbyData.status === 'ENDED';
  if (channelName === 'reliable' && !record.helloReceived && (isEnded || hostMembers.size >= MAX_MEMBERS)) {
    const rejectReason = isEnded ? 'ended' : 'full';
    const rejectType = isEnded ? 'LOBBY_CLOSED' : 'REJECT';
    const rejectConnection = () => {
      try {
        conn.send({ [CONTROL_KEY]: true, type: rejectType, reason: rejectReason });
      } catch (e) {}
      setTimeout(() => {
        try { conn.close(); } catch (e) {}
        peers.delete(record.peerId);
      }, 250);
    };
    conn.on('close', () => peers.delete(record.peerId));
    if (conn.open) rejectConnection(); else conn.on('open', rejectConnection);
    return;
  }

  attachConnection(record, conn, channelName);
}

function bindPeerLifecycle(peer) {
  peer.on('error', (err) => {
    const type = err?.type || '';
    if (currentPeer !== peer) return;
    if (type === 'peer-unavailable') {
      failJoin('La sala no existe o el Host ya no está disponible.');
      return;
    }
    if (type === 'network' || type === 'server-error' || type === 'socket-error') {
      failJoin('No se pudo contactar con el servidor de señalización PeerJS.');
    }
    if (type !== 'unavailable-id') {
      console.warn('[WebRTC] Error de PeerJS:', type || err?.message || err);
    }
  });

  peer.on('disconnected', () => {
    if (currentPeer !== peer || peer.destroyed) return;
    if (peer._torReconnectTimer) return;
    peer._torReconnectTimer = setTimeout(() => {
      peer._torReconnectTimer = null;
      if (peer.destroyed || currentPeer !== peer) return;
      try { peer.reconnect(); } catch (e) {}
    }, 2000);
  });
}

function resetSessionState() {
  peers = new Map();
  hostMembers = new Map();
  lobby = null;
  lobbyData = {};
  currentRoomCode = '';
  currentHostPeerId = '';
  currentRole = 'host';
  localPlayerName = 'Operador Host';
  pendingReliable = [];
  pendingWelcome = null;
  joinSignal = null;
}

async function createLobby() {
  if (typeof RTCPeerConnection === 'undefined') {
    return { success: false, error: 'WebRTC no está disponible en este navegador.' };
  }

  leaveLobby({ silent: true });

  let PeerCtor;
  try {
    PeerCtor = await loadPeerCtor();
  } catch (err) {
    return { success: false, error: err.message };
  }

  let lastError = null;
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateRoomCode();
    const peer = createPeerInstance(PeerCtor, roomPeerId(code));
    try {
      await waitForPeerOpen(peer, 15000);
    } catch (err) {
      lastError = err;
      try { peer.destroy(); } catch (e) {}
      if (err?.type === 'unavailable-id') continue;
      return { success: false, error: describeJoinError(err) };
    }

    currentPeer = peer;
    currentRoomCode = code;
    currentHostPeerId = roomPeerId(code);
    currentRole = 'host';
    localPlayerName = 'Operador Host';
    hostMembers = new Map();
    hostMembers.set(localSteamId, {
      steamId: localSteamId,
      isOwner: true,
      playerName: localPlayerName,
      peerId: currentHostPeerId
    });
    lobbyData = {};

    bindPeerLifecycle(peer);
    peer.on('connection', handleIncomingConnection);

    const details = getLobbyDetails();
    emit('lobbyJoined', details);
    emit('lobbyUpdated', details);
    console.log(`[WebRTC] Sala creada: ${code}`);
    return { success: true, ...details };
  }

  return {
    success: false,
    error: 'No se pudo reservar un código de sala libre: ' + describeJoinError(lastError)
  };
}

async function joinLobby(rawCode) {
  const code = normalizeRoomCode(rawCode);
  if (!code) {
    return { success: false, error: 'Código inválido. Introduce 6 caracteres alfanuméricos (ej. A7K9X2).' };
  }
  if (typeof RTCPeerConnection === 'undefined') {
    return { success: false, error: 'WebRTC no está disponible en este navegador.' };
  }

  if (currentRole === 'client' && currentRoomCode === code && lobby) {
    return { success: true, ...getLobbyDetails() };
  }

  leaveLobby({ silent: true });

  let PeerCtor;
  try {
    PeerCtor = await loadPeerCtor();
  } catch (err) {
    return { success: false, error: err.message };
  }

  currentRole = 'client';
  localPlayerName = 'Operador Cliente';
  currentRoomCode = code;
  currentHostPeerId = roomPeerId(code);

  const peer = createPeerInstance(PeerCtor);
  currentPeer = peer;

  try {
    await waitForPeerOpen(peer, 15000);
  } catch (err) {
    const message = describeJoinError(err);
    currentPeer = null;
    try { peer.destroy(); } catch (e) {}
    resetSessionState();
    return { success: false, error: message };
  }

  bindPeerLifecycle(peer);

  const signal = beginJoinSignal();
  const hostRecord = getOrCreatePeerRecord(currentHostPeerId);
  const welcomePromise = waitForWelcome(12000);
  welcomePromise.catch(() => {});

  try {
    const reliable = peer.connect(currentHostPeerId, {
      reliable: true,
      serialization: 'json',
      metadata: { channel: 'reliable' }
    });
    attachConnection(hostRecord, reliable, 'reliable');

    const unreliable = peer.connect(currentHostPeerId, {
      reliable: false,
      serialization: 'json',
      metadata: { channel: 'unreliable' }
    });
    attachConnection(hostRecord, unreliable, 'unreliable');

    await Promise.race([waitForConnOpen(reliable, 12000), signal.promise]);
    sendControl(hostRecord, {
      type: 'HELLO',
      steamId: localSteamId,
      playerName: localPlayerName
    });
    await Promise.race([welcomePromise, signal.promise]);
  } catch (err) {
    const message = describeJoinError(err);
    leaveLobby({ silent: true });
    return { success: false, error: message };
  } finally {
    if (joinSignal === signal) joinSignal = null;
  }

  const details = getLobbyDetails();
  emit('lobbyJoined', details);
  emit('lobbyUpdated', details);
  console.log(`[WebRTC] Conectado a la sala: ${code}`);
  return { success: true, ...details };
}

function leaveLobby(options = {}) {
  const records = getAllPeerRecords();
  const peer = currentPeer;
  const wasHost = currentRole === 'host' && !!currentRoomCode;

  if (wasHost) {
    lobbyData.status = 'ENDED';
    for (const record of records) {
      if (record.helloReceived) {
        sendControl(record, { type: 'LOBBY_CLOSED', reason: 'ended' });
      }
    }
  }

  teardown = true;
  if (joinSignal) {
    try { joinSignal.fail('Conexión cancelada.'); } catch (e) {}
  }
  rejectPendingWelcome('Conexión cancelada.');

  for (const record of records) {
    if (record.closeTimer) clearTimeout(record.closeTimer);
    try { record.reliableConn?.close(); } catch (e) {}
    try { record.unreliableConn?.close(); } catch (e) {}
  }

  // Destruye el Peer del Host inmediatamente para que el ID traces-of-rust-room-CODIGO
  // quede inmediatamente inexistente en el servidor de señalización de PeerJS
  if (peer) {
    try { peer.destroy(); } catch (e) {}
  }

  resetSessionState();
  currentPeer = null;
  setTimeout(() => { teardown = false; }, 250);

  if (!options.silent) {
    console.log('[WebRTC] Sesión de sala cerrada.');
  }
  return true;
}

async function openInviteDialog() {
  if (!currentRoomCode) {
    showToast('CREA UNA SALA ANTES DE COPIAR EL ENLACE', 'warn');
    return { success: false, error: 'No hay ninguna sala activa.' };
  }
  const url = buildInviteUrl(currentRoomCode);
  const copied = await copyToClipboard(url);
  if (copied) {
    showToast(`ENLACE COPIADO: ${currentRoomCode}`, 'ok');
  } else {
    showToast(`CÓDIGO DE SALA: ${currentRoomCode}`, 'warn');
    try { window.prompt('Copia el enlace de la sala:', url); } catch (e) {}
  }
  return { success: true, copied, code: currentRoomCode, url, text: url };
}

function getStatus() {
  return {
    connected: true,
    mode: 'WEBRTC',
    isWebRtc: true,
    steamId: localSteamId,
    playerName: localPlayerName,
    lobbyId: currentRoomCode || null,
    isHost: currentRole === 'host',
    message: 'Enlace WebRTC P2P activo (STUN público, sin TURN).'
  };
}

function getLobbyInfo() {
  return getLobbyDetails();
}

function getLobbyMembers() {
  const details = getLobbyDetails();
  return details?.members || [];
}

function setLobbyData(key, value) {
  if (currentRole !== 'host' || !currentRoomCode) return false;
  if (typeof key !== 'string' || !key) return false;
  lobbyData[key] = value;
  if (key === 'matchState') lobbyData.matchState = value;
  broadcastLobbyState();
  const details = getLobbyDetails();
  if (details) emit('lobbyUpdated', details);
  return true;
}

function getLobbyData(key) {
  if (!currentRoomCode) return key ? undefined : {};
  if (key) return lobbyData[key];
  return { ...lobbyData };
}

export function installWebRtcAdapter() {
  if (typeof window === 'undefined' || installed) return false;
  if (window.steamOnline) return false;
  if (typeof RTCPeerConnection === 'undefined') return false;

  localSteamId = localSteamId || createLocalSteamId();

  const adapter = {
    isElectron: false,
    isWebRtc: true,
    mode: 'WEBRTC',
    getStatus,
    isAvailable: () => true,
    createLobby,
    getLobbies: () => [],
    joinLobby,
    getLobbyInfo,
    getLobbyMembers,
    setLobbyData,
    getLobbyData,
    leaveLobby,
    openInviteDialog,
    openOverlay: () => ({ success: false, message: 'Steam Overlay no está disponible en navegador.' }),
    sendP2P: (targetId, data, reliable = false) => {
      return sendP2PPacket(targetId, data, reliable ? 'Reliable' : 'Unreliable');
    },
    sendP2PPacket,
    readP2P: () => null,
    onLobbyUpdated: (callback) => addListener('lobbyUpdated', callback),
    onLobbyJoined: (callback) => addListener('lobbyJoined', callback),
    onLobbyClosed: (callback) => addListener('lobbyClosed', callback),
    onJoinRequested: () => () => {},
    onP2PPacket: (callback) => addListener('p2pPacket', callback),
    onPeerDisconnected: (callback) => addListener('peerDisconnected', callback),
    getLocalSteamId: () => localSteamId,
    getRoomCode: () => currentRoomCode,
    showToast: (msg, tone) => showToast(msg, tone)
  };

  window.steamOnline = adapter;
  installed = true;

  window.addEventListener('beforeunload', () => {
    try { leaveLobby({ silent: true }); } catch (e) {}
  });

  console.log('[WebRTC] Adaptador web instalado como window.steamOnline (PeerJS + STUN).');
  return true;
}
