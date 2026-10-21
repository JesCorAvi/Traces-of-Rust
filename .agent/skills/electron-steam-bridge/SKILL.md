---
name: electron-steam-bridge
description: "Modifica la capa de escritorio Electron/Steamworks: IPC, preload, ventana, pantalla completa, Overlay, P2P y empaquetado. Úsala al cambiar `electron-main.cjs`, `preload.cjs` o el comportamiento fuera del navegador."
---

# Electron Steam Bridge

## Overview

Mantiene la integración de escritorio de **Traces of Rust**: proceso principal, puente seguro del preload, Steamworks (Spacewar AppID 480), ventana/pantalla completa, Steam Overlay, bombeo P2P y empaquetado Windows. El renderer web debe seguir funcionando sin Electron.

## When to Use

- Añadir o modificar un canal IPC o un método de `window.steamOnline`/`window.electronWindow`.
- Cambiar la ventana, el arranque, el foco, la pantalla completa o el Overlay.
- Tocar Steamworks, lobbies, Rich Presence, invitaciones o el pump P2P.
- Ajustar `npm start` o `npm run build:win`.

## When Not to Use

- Cambiar el formato o la frecuencia de paquetes de juego: usa `netcode-audit`.
- Cambiar la UI de salas: usa `hud-ui-panel` y `netcode-audit`.
- Cambiar configuraciones de balance: usa `game-balance-tuning`.
- Añadir sonidos o modelos: usa `procedural-sfx` o `procedural-3d-entity`.

## Mandatory Workflow

1. **Clasifica la capa.** Main, preload, renderer o build. Un cambio puede tocar varias, pero no mezcles responsabilidades.
2. **Define el contrato.** Canal, payload, retorno, evento push y comportamiento en navegador.
3. **Implementa main + preload.** `ipcMain.handle`/`webContents.send` y un método estrecho en `contextBridge`.
4. **Feature-detect en renderer.** No asumas Electron; añade fallback o degradación en `webRtcAdapter.js` si debe funcionar en navegador.
5. **Valida en Electron y navegador.** `npm start` y `python -m http.server 8000`.
6. **Empaqueta si toca.** `npm run build:win` y prueba el `.exe`.

**Condición de parada:** si el cambio exige una decisión de producto (¿el navegador debe soportar esta función?), implementa la degradación segura y declara la suposición. No instales dependencias sin permiso.

## Layer Decision Table

| Cambio | Main | Preload | Renderer |
|---|---|---|---|
| Nueva operación nativa | `ipcMain.handle` | método en bridge | `invoke` con feature detection |
| Evento push | `webContents.send` | `ipcRenderer.on` + return unsubscribe | callback |
| Pantalla completa | `window:*` | `electronWindow` | `settingsMenu.js` |
| Steam/lobby | `steam:*` | `steamOnline` | `steamLobbyUI.js` |
| P2P | pump + send/read | `sendP2P`/`onP2PPacket` | `multiplayerSync.js` |
| Fallback navegador | — | — | `webRtcAdapter.js` |
| Build | `package.json` + `scripts/postbuild-win.cjs` | — | — |

## Non-Negotiable Rules

- **Seguridad:** `contextIsolation: true`, `nodeIntegration: false`; el renderer nunca recibe `ipcRenderer` ni `require`.
- **Puente estrecho:** expón métodos concretos, no un `invoke` genérico.
- **Anti-throttling:** no elimines `backgroundThrottling: false` ni los switches de GPU/ocultación; evitan desincronización con Alt+Tab y Overlay.
- **Main no es autoridad de juego:** la simulación Host autoritativa vive en el renderer; main solo transporta.
- **Payloads serializables:** `sendP2P` acepta string/JSON; convierte `targetSteamId` a `BigInt` con manejo de error.
- **Suscripciones limpias:** los `on*` del preload devuelven una función para quitar el listener.
- **Overlay:** `electronEnableSteamOverlay()` y switches GPU son necesarios para `Shift + Tab`.
- **Empaquetado:** `steam_appid.txt` y `steam_api64.dll` deben copiarse al directorio del ejecutable.
- **Sin editar artefactos:** no toques `dist/`, `node_modules/`, lockfiles ni binarios.

## Validation Ladder

- **Nivel 0 — Estático:** contrato IPC completo (main + preload + renderer), feature detection, seguridad intacta.
- **Nivel 1 — Electron:** `npm start` arranca, ventana correcta y sin errores de consola.
- **Nivel 2 — Navegador:** `python -m http.server 8000` sigue funcionando con el fallback.
- **Nivel 3 — Steam:** Overlay, invitación, lobby, P2P y desconexión.
- **Nivel 4 — Build:** `npm run build:win`, `.exe` arranca con Steam y conserva `steam_appid.txt`/DLL.

**Reporta el nivel alcanzado y qué no se pudo probar (por ejemplo, "sin cuenta Steam real").**

## Output Expectations

- Capa(s) modificadas y contrato IPC.
- Comportamiento en Electron y en navegador.
- Riesgos de seguridad o compatibilidad.
- Nivel de validación alcanzado y artefactos generados.

## References

- `references/ipc-and-steam.md` — canales, preload, Steamworks, lobbies, P2P y ciclo de vida.
- `references/window-packaging.md` — ventana, pantalla completa, Overlay, scripts y empaquetado.

## Related Skills

- `netcode-audit` — paquetes y autoridad del juego.
- `hud-ui-panel` — UI de salas, ajustes y pantalla completa.
- `procedural-sfx` — audio de eventos de red.
- `game-balance-tuning` — configuración compartida entre peers.
