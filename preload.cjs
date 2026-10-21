const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronWindow', {
  isElectron: true,
  setFullscreen: (flag) => ipcRenderer.invoke('window:setFullscreen', !!flag),
  toggleFullscreen: () => ipcRenderer.invoke('window:toggleFullscreen'),
  isFullscreen: () => ipcRenderer.invoke('window:isFullscreen'),
  onFullscreenChanged: (callback) => {
    const handler = (_, isFullscreen) => callback(isFullscreen);
    ipcRenderer.on('window:fullscreenChanged', handler);
    return () => ipcRenderer.removeListener('window:fullscreenChanged', handler);
  }
});

contextBridge.exposeInMainWorld('steamOnline', {
  isElectron: true,
  getStatus: () => ipcRenderer.invoke('steam:getStatus'),
  createLobby: () => ipcRenderer.invoke('steam:createLobby'),
  getLobbies: () => ipcRenderer.invoke('steam:getLobbies'),
  joinLobby: (lobbyId) => ipcRenderer.invoke('steam:joinLobby', lobbyId),
  getLobbyInfo: () => ipcRenderer.invoke('steam:getLobbyInfo'),
  setLobbyData: (key, value) => ipcRenderer.invoke('steam:setLobbyData', { key, value }),
  leaveLobby: () => ipcRenderer.invoke('steam:leaveLobby'),
  openInviteDialog: () => ipcRenderer.invoke('steam:openInviteDialog'),
  openOverlay: () => ipcRenderer.invoke('steam:openOverlay'),
  sendP2P: (targetSteamId, data, reliable = false) => ipcRenderer.invoke('steam:sendP2P', { targetSteamId, data, reliable }),
  readP2P: () => ipcRenderer.invoke('steam:readP2P'),
  onLobbyUpdated: (callback) => {
    const handler = (_, details) => callback(details);
    ipcRenderer.on('steam:lobbyUpdated', handler);
    return () => ipcRenderer.removeListener('steam:lobbyUpdated', handler);
  },
  onJoinRequested: (callback) => {
    const handler = (_, lobbyId) => callback(lobbyId);
    ipcRenderer.on('steam:onJoinRequested', handler);
    return () => ipcRenderer.removeListener('steam:onJoinRequested', handler);
  },
  onP2PPacket: (callback) => {
    const handler = (_, packet) => callback(packet);
    ipcRenderer.on('steam:p2pPacket', handler);
    return () => ipcRenderer.removeListener('steam:p2pPacket', handler);
  },
  onPeerDisconnected: (callback) => {
    const handler = (_, packet) => callback(packet);
    ipcRenderer.on('steam:peerDisconnected', handler);
    return () => ipcRenderer.removeListener('steam:peerDisconnected', handler);
  }
});
