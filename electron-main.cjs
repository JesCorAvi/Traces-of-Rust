const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let steamworks = null;
try {
  steamworks = require('steamworks.js');
  if (steamworks && typeof steamworks.electronEnableSteamOverlay === 'function') {
    steamworks.electronEnableSteamOverlay();
    console.log('[STEAM] Soporte de Steam Overlay configurado para Electron.');
  }
} catch (e) {
  console.warn('[STEAM] No se pudo invocar electronEnableSteamOverlay:', e.message);
}

// Optimización WebGL y compatibilidad de Overlay
app.commandLine.appendSwitch('in-process-gpu');
app.commandLine.appendSwitch('disable-direct-composition');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
// Sincronizar el locale de Chromium con el sistema operativo
try {
  const sysLocale = app.getSystemLocale ? app.getSystemLocale() : (app.getLocale ? app.getLocale() : null);
  if (sysLocale) {
    app.commandLine.appendSwitch('lang', sysLocale);
  }
} catch (e) {}
// Mantener la simulación y el render activos con la ventana minimizada/ocluida
// (Alt+Tab, Overlay de Steam). Sin esto, rAF se congela y el cliente se desincroniza.
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

let steamClient = null;
let currentLobby = null;
let mainWindow = null;
const lobbyPeers = new Set();

function getLobbyDetails(lobby) {
  if (!lobby) return null;
  const ownerId = lobby.getOwner ? lobby.getOwner().steamId64.toString() : null;
  const rawMembers = lobby.getMembers ? lobby.getMembers().map(m => m.steamId64.toString()) : [];

  // Fusionar miembros devueltos por Steam con los registrados en tiempo real por callbacks
  const allMemberIds = new Set(rawMembers);
  lobbyPeers.forEach(id => allMemberIds.add(id));
  if (ownerId) allMemberIds.add(ownerId);

  const members = Array.from(allMemberIds).map(id => ({
    steamId: id,
    isOwner: id === ownerId
  }));

  return {
    lobbyId: lobby.id.toString(),
    ownerSteamId: ownerId,
    memberCount: Math.max(members.length, lobby.getMemberCount ? Number(lobby.getMemberCount()) : 1),
    memberLimit: lobby.getMemberLimit ? Number(lobby.getMemberLimit()) : 4,
    title: lobby.getData('title') || 'SALA CO-OP',
    hostName: lobby.getData('hostName') || 'Host',
    hostSteamId: lobby.getData('hostSteamId') || ownerId,
    matchState: lobby.getData('matchState') || null,
    members
  };
}

function setupSteamCallbacks() {
  if (!steamClient || !steamClient.callback || !steamworks) return;
  const { SteamCallback } = steamworks;

  // 1. Notificación cuando miembros entran, salen o se desconectan del lobby
  steamClient.callback.register(SteamCallback.LobbyChatUpdate, (param) => {
    try {
      if (param.user_changed) {
        const userStr = param.user_changed.toString();
        // ChatMemberStateChange.Entered = 0
        if (param.member_state_change === 0) {
          lobbyPeers.add(userStr);
          try {
            steamClient.networking.acceptP2PSession(param.user_changed);
            console.log('[STEAM P2P] Sesión P2P pre-aceptada con nuevo miembro del lobby:', userStr);
            // Enviar saludo P2P fiable para calentar la sesión
            const localId = steamClient.localplayer.getSteamId().steamId64;
            const ackBuf = Buffer.from(JSON.stringify({ type: 'LOBBY_PING_ACK', sender: localId.toString() }));
            steamClient.networking.sendP2PPacket(param.user_changed, steamClient.networking.SendType.Reliable, ackBuf);
          } catch (e) {}
        } else {
          lobbyPeers.delete(userStr);
        }
      }
      if (currentLobby && steamClient && steamClient.localplayer) {
        const count = currentLobby.getMemberCount ? currentLobby.getMemberCount().toString() : '1';
        steamClient.localplayer.setRichPresence('steam_player_group_size', count);
      }
      if (mainWindow && !mainWindow.isDestroyed() && currentLobby) {
        const details = getLobbyDetails(currentLobby);
        mainWindow.webContents.send('steam:lobbyUpdated', details);
      }
    } catch (e) {
      console.warn('[STEAM CALLBACK] Error en LobbyChatUpdate:', e);
    }
  });

  // 2. Notificación cuando cambian los metadatos del lobby
  steamClient.callback.register(SteamCallback.LobbyDataUpdate, (param) => {
    try {
      if (mainWindow && !mainWindow.isDestroyed() && currentLobby) {
        const details = getLobbyDetails(currentLobby);
        mainWindow.webContents.send('steam:lobbyUpdated', details);
      }
    } catch (e) {
      console.warn('[STEAM CALLBACK] Error en LobbyDataUpdate:', e);
    }
  });

  // 3. Aceptar solicitudes de sesión P2P entrantes (evita que Steam descarte paquetes)
  steamClient.callback.register(SteamCallback.P2PSessionRequest, (param) => {
    try {
      steamClient.networking.acceptP2PSession(param.remote);
      lobbyPeers.add(param.remote.toString());
      console.log('[STEAM P2P] Sesión P2P aceptada con operador:', param.remote.toString());
    } catch (e) {
      console.warn('[STEAM P2P] Error al aceptar sesión P2P:', e);
    }
  });

  // 4. Registro de fallos de conexión P2P para diagnóstico
  steamClient.callback.register(SteamCallback.P2PSessionConnectFail, (param) => {
    console.warn('[STEAM P2P] Fallo de conexión P2P con:', param.remote?.toString(), 'Código error:', param.error);
    try {
      if (mainWindow && !mainWindow.isDestroyed()) {
        const remoteId = param.remote?.steamId64
          ? param.remote.steamId64.toString()
          : (param.remote?.toString ? param.remote.toString() : null);
        mainWindow.webContents.send('steam:peerDisconnected', {
          steamId: remoteId,
          error: param.error
        });
      }
    } catch (e) {}
  });

  // 5. Invitación aceptada desde el Overlay de Steam o la lista de amigos
  steamClient.callback.register(SteamCallback.GameLobbyJoinRequested, (param) => {
    try {
      if (mainWindow && !mainWindow.isDestroyed() && param.lobby_steam_id) {
        mainWindow.webContents.send('steam:onJoinRequested', param.lobby_steam_id.toString());
      }
    } catch (e) {
      console.warn('[STEAM CALLBACK] Error en GameLobbyJoinRequested:', e);
    }
  });
}

// Bucle nativo a ~60Hz para drenar y reenviar paquetes P2P instantáneamente al frontend
let p2pPollInterval = null;
function startP2PPump() {
  if (p2pPollInterval) return;
  p2pPollInterval = setInterval(() => {
    if (!steamClient || !steamClient.networking || !mainWindow || mainWindow.isDestroyed()) return;
    try {
      let drained = 0;
      let avail = 0;
      while ((avail = steamClient.networking.isP2PPacketAvailable()) > 0 && drained++ < 50) {
        const packet = steamClient.networking.readP2PPacket(avail);
        if (packet && packet.data) {
          const senderId = packet.steamId && packet.steamId.steamId64
            ? packet.steamId.steamId64.toString()
            : packet.steamId.toString();
          const text = packet.data.toString('utf-8');
          mainWindow.webContents.send('steam:p2pPacket', {
            senderSteamId: senderId,
            text
          });
        }
      }
    } catch (err) {}
  }, 16);
}

// Inicialización de Steamworks (App ID 480: Spacewar - Protocolo de Pruebas de Steam)
try {
  if (steamworks) {
    steamClient = steamworks.init(480);
    console.log('[STEAM] Steamworks SDK conectado con éxito a través de Spacewar (AppID: 480)');
    console.log('[STEAM] Operador local:', steamClient.localplayer.getName());
    setupSteamCallbacks();
  }
} catch (err) {
  console.warn('[STEAM] No se pudo conectar a Steam client:', err.message);
}

// Configuración de IPC Handlers para el frontend
ipcMain.handle('steam:getStatus', async () => {
  if (!steamClient) {
    return {
      connected: false,
      message: 'Steam no detectado o no iniciado en segundo plano.'
    };
  }

  try {
    return {
      connected: true,
      appId: 480,
      appName: 'Spacewar (Steam Dev Testbed)',
      playerName: steamClient.localplayer.getName(),
      steamId: steamClient.localplayer.getSteamId().steamId64.toString(),
      currentLobbyId: currentLobby ? currentLobby.id.toString() : null
    };
  } catch (err) {
    return { connected: false, message: err.message };
  }
});

ipcMain.handle('steam:createLobby', async () => {
  if (!steamClient) throw new Error('Steam no está inicializado');

  try {
    lobbyPeers.clear();
    if (currentLobby) {
      try { currentLobby.leave(); } catch (e) {}
      currentLobby = null;
    }

    // Crea un lobby público de hasta 4 jugadores
    const lobby = await steamClient.matchmaking.createLobby(steamClient.matchmaking.LobbyType.Public, 4);
    currentLobby = lobby;
    if (typeof lobby.setJoinable === 'function') {
      lobby.setJoinable(true);
    }

    const hostName = steamClient.localplayer.getName();
    const hostSteamId = steamClient.localplayer.getSteamId().steamId64.toString();
    const lobbyIdStr = lobby.id.toString();

    lobby.setData('game', 'traces_of_rust');
    lobby.setData('title', `SALA CO-OP: ${hostName}`);
    lobby.setData('hostName', hostName);
    lobby.setData('hostSteamId', hostSteamId);
    lobby.setData('version', '1.0.0');

    // Rich Presence requerido por Steam para habilitar "Invitar al juego" en Shift+Tab
    try {
      steamClient.localplayer.setRichPresence('connect', `+connect_lobby ${lobbyIdStr}`);
      steamClient.localplayer.setRichPresence('steam_player_group', lobbyIdStr);
      steamClient.localplayer.setRichPresence('steam_player_group_size', '1');
      steamClient.localplayer.setRichPresence('status', 'En sala de espera');
      console.log('[STEAM] Rich Presence configurado para invitaciones en Steam Overlay.');
    } catch (e) {
      console.warn('[STEAM] Error al fijar Rich Presence:', e);
    }

    const details = getLobbyDetails(lobby);
    return {
      success: true,
      ...details
    };
  } catch (err) {
    console.error('[STEAM] Error al crear sala:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('steam:getLobbies', async () => {
  // Salas públicas desactivadas: conexión exclusiva por código / ID
  return [];
});

ipcMain.handle('steam:joinLobby', async (_, lobbyIdStr) => {
  if (!steamClient) throw new Error('Steam no está inicializado');

  try {
    lobbyPeers.clear();
    if (currentLobby) {
      try { currentLobby.leave(); } catch (e) {}
      currentLobby = null;
    }

    const targetId = BigInt(lobbyIdStr);
    const lobby = await steamClient.matchmaking.joinLobby(targetId);
    currentLobby = lobby;

    // Comprobar si la sala ya ha finalizado
    const lobbyStatus = lobby.getData ? lobby.getData('status') : '';
    if (lobbyStatus === 'ENDED') {
      try { lobby.leave(); } catch (e) {}
      currentLobby = null;
      return { success: false, error: 'Esta partida ya ha finalizado o la sala se ha cerrado.' };
    }

    // Aceptar de inmediato sesión P2P con el Host y enviar paquete de enlace
    const owner = lobby.getOwner ? lobby.getOwner() : null;
    if (owner && owner.steamId64) {
      const ownerIdStr = owner.steamId64.toString();
      lobbyPeers.add(ownerIdStr);
      try {
        steamClient.networking.acceptP2PSession(owner.steamId64);
        console.log('[STEAM P2P] Sesión P2P pre-aceptada con el Host:', ownerIdStr);
        const myId = steamClient.localplayer.getSteamId().steamId64;
        const pingBuf = Buffer.from(JSON.stringify({ type: 'LOBBY_PING', sender: myId.toString() }));
        steamClient.networking.sendP2PPacket(owner.steamId64, steamClient.networking.SendType.Reliable, pingBuf);
      } catch (e) {
        console.warn('[STEAM P2P] Error al pre-aceptar P2P con el host:', e);
      }
    }

    // Rich Presence para unirse y agrupar en amigos de Steam
    try {
      steamClient.localplayer.setRichPresence('connect', `+connect_lobby ${lobbyIdStr}`);
      steamClient.localplayer.setRichPresence('steam_player_group', lobbyIdStr);
      const count = lobby.getMemberCount ? lobby.getMemberCount().toString() : '2';
      steamClient.localplayer.setRichPresence('steam_player_group_size', count);
      steamClient.localplayer.setRichPresence('status', 'En sala co-op');
    } catch (e) {}

    const details = getLobbyDetails(lobby);
    return {
      success: true,
      ...details
    };
  } catch (err) {
    console.error('[STEAM] Error al unirse a la sala:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('steam:getLobbyInfo', async () => {
  if (!currentLobby) return null;
  return getLobbyDetails(currentLobby);
});

ipcMain.handle('steam:setLobbyData', async (_, { key, value }) => {
  if (!currentLobby) return false;
  try {
    const strVal = typeof value === 'string' ? value : JSON.stringify(value);
    const ok = currentLobby.setData(key, strVal);
    if (ok && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('steam:lobbyUpdated', getLobbyDetails(currentLobby));
    }
    return ok;
  } catch (e) {
    console.warn('[STEAM] Error al fijar datos de sala:', e);
    return false;
  }
});

ipcMain.handle('steam:leaveLobby', async () => {
  if (currentLobby) {
    try {
      const myId = steamClient?.localplayer?.getSteamId?.()?.steamId64?.toString?.() || '';
      const owner = currentLobby.getOwner ? currentLobby.getOwner() : null;
      const ownerId = owner && owner.steamId64 ? owner.steamId64.toString() : '';
      if (ownerId && ownerId === myId) {
        currentLobby.setData('status', 'ENDED');
      }
    } catch (e) {}
    try { currentLobby.leave(); } catch (e) {}
    currentLobby = null;
  }
  try {
    if (steamClient && steamClient.localplayer) {
      steamClient.localplayer.setRichPresence('connect', '');
      steamClient.localplayer.setRichPresence('steam_player_group', '');
      steamClient.localplayer.setRichPresence('steam_player_group_size', '');
      steamClient.localplayer.setRichPresence('status', 'Menú Principal');
    }
  } catch (e) {}
  return { success: true };
});

ipcMain.handle('steam:openInviteDialog', async () => {
  if (!steamClient) return { success: false };

  try {
    if (currentLobby) {
      // Intenta abrir el diálogo de invitación nativo del lobby
      if (typeof currentLobby.openInviteDialog === 'function') {
        currentLobby.openInviteDialog();
        return { success: true };
      }
      if (steamClient.overlay && typeof steamClient.overlay.activateInviteDialog === 'function') {
        steamClient.overlay.activateInviteDialog(currentLobby.id);
        return { success: true };
      }
    }
    if (steamClient.overlay) {
      steamClient.overlay.activateDialog(steamClient.overlay.Dialog.Friends);
      return { success: true };
    }
  } catch (e) {
    console.warn('[STEAM] Error al abrir diálogo de invitación:', e);
  }
  return { success: false };
});

ipcMain.handle('steam:openOverlay', async () => {
  if (steamClient && steamClient.overlay) {
    steamClient.overlay.activateDialog(steamClient.overlay.Dialog.Friends);
    return { success: true };
  }
  return { success: false };
});

// Envío fiable (Reliable = 2) o no fiable con buffering y NAT traversal (Unreliable = 0)
ipcMain.handle('steam:sendP2P', async (_, { targetSteamId, data, reliable = false }) => {
  if (!steamClient || !steamClient.networking) return false;
  try {
    const targetBigInt = BigInt(targetSteamId);
    try { steamClient.networking.acceptP2PSession(targetBigInt); } catch (e) {}

    const buffer = Buffer.from(typeof data === 'string' ? data : JSON.stringify(data));
    const sendType = reliable
      ? steamClient.networking.SendType.Reliable
      : steamClient.networking.SendType.Unreliable;
    return steamClient.networking.sendP2PPacket(
      targetBigInt,
      sendType,
      buffer
    );
  } catch (err) {
    console.warn('[STEAM P2P] Error al enviar paquete:', err);
    return false;
  }
});

ipcMain.handle('steam:readP2P', async () => {
  if (!steamClient || !steamClient.networking) return null;
  try {
    if (steamClient.networking.isP2PPacketAvailable()) {
      const packet = steamClient.networking.readP2PPacket(4096);
      if (packet && packet.data) {
        const senderId = packet.steamId && packet.steamId.steamId64
          ? packet.steamId.steamId64.toString()
          : packet.steamId.toString();
        return {
          senderSteamId: senderId,
          text: packet.data.toString('utf-8')
        };
      }
    }
  } catch (err) {}
  return null;
});

// Control nativo de pantalla completa (ventana real de Windows).
function getUsableMainWindow() {
  return mainWindow && !mainWindow.isDestroyed() ? mainWindow : null;
}

ipcMain.handle('window:setFullscreen', async (_, flag) => {
  const win = getUsableMainWindow();
  if (!win) return false;
  win.setFullScreen(Boolean(flag));
  return win.isFullScreen();
});

ipcMain.handle('window:toggleFullscreen', async () => {
  const win = getUsableMainWindow();
  if (!win) return false;
  win.setFullScreen(!win.isFullScreen());
  return win.isFullScreen();
});

ipcMain.handle('window:isFullscreen', async () => {
  const win = getUsableMainWindow();
  return win ? win.isFullScreen() : false;
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 960,
    minHeight: 540,
    title: 'Traces of Rust - Tactical Horror',
    backgroundColor: '#050705',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  });

  mainWindow.loadFile('index.html');
  startP2PPump();

  // Si se inició el juego directamente aceptando una invitación de Steam (+connect_lobby)
  mainWindow.webContents.on('did-finish-load', () => {
    try {
      const args = process.argv;
      const idx = args.indexOf('+connect_lobby');
      if (idx !== -1 && args[idx + 1]) {
        const lobbyId = args[idx + 1];
        console.log('[STEAM] Lanzamiento por invitación detectado. Conectando a sala:', lobbyId);
        setTimeout(() => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('steam:onJoinRequested', lobbyId);
          }
        }, 1200);
      }
    } catch (e) {}
  });

  // Notificar al renderer si la ventana entra/sale de pantalla completa
  // (F11, Alt+Enter o cualquier cambio nativo).
  const notifyFullscreenChanged = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window:fullscreenChanged', mainWindow.isFullScreen());
    }
  };
  mainWindow.on('enter-full-screen', notifyFullscreenChanged);
  mainWindow.on('leave-full-screen', notifyFullscreenChanged);

  // Alternar pantalla completa con F11 o Alt+Enter.
  mainWindow.webContents.on('before-input-event', (event, input) => {
    const toggleKey = input.key === 'F11' || (input.key === 'Enter' && input.alt);
    if (toggleKey && input.type === 'keyDown') {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
      event.preventDefault();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (currentLobby) {
    try { currentLobby.leave(); } catch (e) {}
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
