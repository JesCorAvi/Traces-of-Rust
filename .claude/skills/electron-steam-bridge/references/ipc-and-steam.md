# IPC, Preload y Steamworks

## Procesos

| Archivo | Rol |
|---|---|
| `electron-main.cjs` | Ventana, Steamworks, lobbies, P2P, IPC y ciclo de vida |
| `preload.cjs` | `contextBridge` con `electronWindow` y `steamOnline` |
| `js/online/steamLobbyUI.js` | UI de salas e invitaciones |
| `js/online/multiplayerSync.js` | Paquetes y autoridad de partida |
| `js/online/webRtcAdapter.js` | Emulación de `steamOnline` en navegador |

## Seguridad

```js
webPreferences: {
  preload: path.join(__dirname, 'preload.cjs'),
  contextIsolation: true,
  nodeIntegration: false,
  backgroundThrottling: false
}
```

- No expongas `ipcRenderer` completo ni `require`.
- No aceptes rutas o comandos arbitrarios desde el renderer.
- Valida y sanea payloads en main.
- El renderer no debe poder abrir/cerrar ventanas o ejecutar shell sin un método dedicado.

## Canales `steam:*`

| Canal | Tipo | Payload | Retorno |
|---|---|---|---|
| `steam:getStatus` | invoke | — | Estado de Steamworks |
| `steam:createLobby` | invoke | — | ID de sala |
| `steam:getLobbies` | invoke | — | Lista de salas |
| `steam:joinLobby` | invoke | `lobbyId` | Resultado |
| `steam:getLobbyInfo` | invoke | — | Datos de sala |
| `steam:setLobbyData` | invoke | `{ key, value }` | Resultado |
| `steam:leaveLobby` | invoke | — | Resultado |
| `steam:openInviteDialog` | invoke | — | Resultado |
| `steam:openOverlay` | invoke | — | Resultado |
| `steam:sendP2P` | invoke | `{ targetSteamId, data, reliable }` | `boolean` |
| `steam:readP2P` | invoke | — | `{ senderSteamId, text }` o `null` |

Eventos push:

| Canal | Suscripción | Payload |
|---|---|---|
| `steam:lobbyUpdated` | `onLobbyUpdated(cb)` | Detalles de sala |
| `steam:onJoinRequested` | `onJoinRequested(cb)` | `lobbyId` |
| `steam:p2pPacket` | `onP2PPacket(cb)` | `{ senderSteamId, text }` |
| `steam:peerDisconnected` | `onPeerDisconnected(cb)` | Datos del peer |

## Canales `window:*`

| Canal | Tipo | Retorno |
|---|---|---|
| `window:setFullscreen` | invoke | Estado real |
| `window:toggleFullscreen` | invoke | Estado real |
| `window:isFullscreen` | invoke | `boolean` |
| `window:fullscreenChanged` | push | `boolean` |

## Preload

```js
contextBridge.exposeInMainWorld('electronWindow', {
  isElectron: true,
  setFullscreen: flag => ipcRenderer.invoke('window:setFullscreen', !!flag),
  toggleFullscreen: () => ipcRenderer.invoke('window:toggleFullscreen'),
  isFullscreen: () => ipcRenderer.invoke('window:isFullscreen'),
  onFullscreenChanged: callback => {
    const handler = (_, value) => callback(value);
    ipcRenderer.on('window:fullscreenChanged', handler);
    return () => ipcRenderer.removeListener('window:fullscreenChanged', handler);
  }
});
```

Reglas:

- Métodos estrechos y con nombre de dominio.
- Retorna siempre la función de baja en los `on*`.
- No expongas objetos de Electron.
- Si añades un método, actualiza también el fallback de navegador si debe existir allí.

## Steamworks

- `steamworks.init(480)` — Spacewar; `steam_appid.txt` contiene `480`.
- `electronEnableSteamOverlay()` configura el Overlay.
- Rich Presence:
  - `connect`: `+connect_lobby <id>`
  - `steam_player_group`: ID de sala
  - `steam_player_group_size`: número de miembros
  - `status`: `En sala de espera`, `En sala co-op`, `Menú Principal`
- `+connect_lobby` en `process.argv` se procesa tras `did-finish-load` y se emite como `steam:onJoinRequested`.
- Si Steam no está disponible, el juego debe seguir funcionando en local.

## Pump P2P

- `startP2PPump()` en main usa `setInterval` a ~60 Hz.
- El pump usa `readP2PPacket(avail)`; el handler manual `steam:readP2P` usa 4096. Convierte con `Buffer.toString('utf-8')`.
- Reenvía al renderer por `steam:p2pPacket`.
- Envío: `SendType.Reliable` o `SendType.Unreliable`.
- `acceptP2PSession` se intenta antes de enviar.
- El renderer no debe hacer polling pesado; el pump ya empuja.

## Ciclo de Vida

- `app.whenReady()` → `createWindow()` → `startP2PPump()`.
- `window-all-closed` abandona el lobby y sale (excepto macOS).
- `activate` recrea la ventana en macOS.
- `mainWindow.on('closed')` limpia la referencia.
- Al salir, cerrar lobby y limpiar listeners del renderer.

## Al Añadir un Canal

1. `ipcMain.handle` o `ipcMain.on` en main.
2. Método en `preload.cjs`.
3. Consumo con `window.steamOnline?.metodo` o `window.electronWindow?.metodo`.
4. Fallback en `webRtcAdapter.js` o degradación explícita.
5. Prueba Electron + navegador.
6. Documenta el canal en esta referencia.
