# Ventana, Overlay y Empaquetado

## Ventana

```js
new BrowserWindow({
  width: 1280,
  height: 720,
  minWidth: 960,
  minHeight: 540,
  title: 'Traces of Rust - Tactical Horror',
  backgroundColor: '#050705',
  autoHideMenuBar: true,
  webPreferences: { ... }
});
```

- `mainWindow.loadFile('index.html')`.
- `backgroundThrottling: false` es obligatorio para no congelar rAF con Alt+Tab/Overlay.
- No cambies el tamaño mínimo sin revisar el layout 2D.

## Pantalla Completa

- `window:setFullscreen`, `window:toggleFullscreen`, `window:isFullscreen` usan `win.setFullScreen()` y devuelven el estado real.
- `F11` y `Alt+Enter` alternan con `before-input-event`.
- `enter-full-screen`/`leave-full-screen` emiten `window:fullscreenChanged`.
- `js/ui/settingsMenu.js`:
  - Resuelve `window.electronWindow` primero.
  - Si no, `window.steamOnline`.
  - Si no, Fullscreen API del navegador.
- En navegador no se fuerza el fullscreen al arrancar: requiere gesto de usuario.

## Steam Overlay

- `steamworks.electronEnableSteamOverlay()`.
- `Shift + Tab` abre el Overlay.
- Switches relevantes:
  - `in-process-gpu`
  - `disable-direct-composition`
  - `enable-gpu-rasterization`
  - `enable-zero-copy`
  - `ignore-gpu-blocklist`
  - `disable-background-timer-throttling`
  - `disable-renderer-backgrounding`
  - `disable-backgrounding-occluded-windows`
- No elimines estos switches sin probar Alt+Tab y Overlay en una partida online.

## Invitaciones

- Rich Presence `connect = +connect_lobby <id>`.
- Al arrancar con `+connect_lobby`, main espera `did-finish-load` y emite `steam:onJoinRequested`.
- `steamLobbyUI.js` procesa la invitación y une a la sala.
- Al cerrar sesión, limpia Rich Presence (`connect`, `steam_player_group`, tamaño, estado).

## Scripts

`package.json`:

```json
{
  "main": "electron-main.cjs",
  "scripts": {
    "start": "electron .",
    "build:win": "electron-packager . \"Traces of Rust\" --platform=win32 --arch=x64 --out=dist --overwrite --ignore=\"^/dist$\" && node scripts/postbuild-win.cjs"
  }
}
```

- `npm start` requiere Electron instalado.
- `npm run build:win` genera `dist/Traces of Rust-win32-x64/`.
- `scripts/postbuild-win.cjs` copia:
  - `steam_appid.txt`
  - `node_modules/steamworks.js/dist/win64/steam_api64.dll` → raíz del ejecutable
- Si actualizas `steamworks.js`, verifica la ruta de la DLL y el empaquetado del binario nativo.

## Checklist de Build

- [ ] `npm start` funciona con Steam abierto y sin Steam.
- [ ] `python -m http.server 8000` funciona en navegador.
- [ ] Overlay `Shift + Tab` abre.
- [ ] Invitación `+connect_lobby` une a la sala.
- [ ] `F11`/`Alt+Enter` y el botón de ajustes sincronizan el estado.
- [ ] `npm run build:win` termina sin errores.
- [ ] El `.exe` arranca desde `dist/`.
- [ ] `steam_appid.txt` y `steam_api64.dll` están junto al `.exe`.
- [ ] La partida online sobrevive a Alt+Tab y al Overlay.

## Anti-Patterns

- Añadir `nodeIntegration: true` para "simplificar".
- Exponer `ipcRenderer` o `require` en el preload.
- Quitar `backgroundThrottling: false` o los switches anti-throttling.
- Mover simulación de enemigos a main.
- Añadir dependencias sin preguntar.
- Editar `dist/` manualmente en lugar de reconstruir.
- Olvidar copiar `steam_appid.txt`/DLL tras cambiar el empaquetado.
