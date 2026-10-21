# Persistencia, Ajustes y Audio de UI

## Claves de `localStorage`

| Clave | Fuente | Contenido |
|---|---|---|
| `echoes_rust_buckshot_save_v4` | `CONFIG.SAVE_KEY` | Progreso permanente (`souls`, `dmg`, `hp`, ...) |
| `echoes_rust_settings_v1` | `SETTINGS_KEY` | Ajustes gráficos y de audio |
| `echoes_rust_career_modes_v2` | `MODES_CONFIG.CAREER_STORAGE_KEY` | Carrera por modo |
| `traces_td_selected_map` | Selector | ID del mapa |
| `traces_td_difficulty` | Selector | `facil`/`normal`/`dificil` |
| `traces_td_map_records` | Modo Defensa | Récords por mapa |
| `traces_selected_character` | `charactersConfig` | Operador seleccionado |
| `echoes_rust_td_tutorial_choice_v1` | Tutorial | Elección de tutorial |

## `gameSettings`

`js/core/saveState.js`:

```js
{
  masterVol: 85, sfxVol: 90, ambVol: 80, muted: false,
  resScale: 0.44, fov: 70, shadows: true, crt: true, fpsCounter: false,
  mouseSens: 100, camShake: 100, fullscreen: true
}
```

- Escalas de audio: **0–100**.
- `mouseSens: 100` = sensibilidad normal.
- `fullscreen` se rellena si un guardado antiguo no lo tiene.
- Guarda con `saveGameSettings()`.

Toda preferencia nueva:

1. Añade el default al objeto de `saveState.js`.
2. Si el guardado puede ser antiguo, normaliza el valor al cargar.
3. Lee el valor en el módulo que lo consume.
4. Guarda al cambiar y refleja el estado en la UI.

## Audio de UI

- `AudioSys.playUIClick()` — hover o clic suave.
- `AudioSys.playUISelect()` — confirmar o abrir.
- `AudioSys.playUIError()` — acción rechazada.
- `AudioSys.playPause()` — pausa/reanudar.
- `AudioSys.init()` — debe ejecutarse tras un gesto de usuario; el arranque de partida ya lo hace.

Al añadir un panel, sigue el patrón de `characterSelectorModal.js`: sonido al abrir/cerrar, sonido al seleccionar y `playUIError` cuando falte un requisito.

## Ajustes y Puente Nativo

- `js/ui/settingsMenu.js` resuelve `window.electronWindow` primero y `window.steamOnline` después; si no hay bridge, usa la Fullscreen API.
- `applyStoredFullscreen()` se llama al arrancar.
- `onFullscreenChanged` y `fullscreenchange` mantienen el estado real.
- No dupliques la lógica de pantalla completa en otro módulo.

## Setup y Persistencia de Paneles

- Guarda referencias DOM una vez (`cardEl`, `modalEl`) en lugar de consultar en cada apertura.
- Si el panel se reconstruye, vuelve a enlazar listeners con `onclick` o guarda y elimina los `addEventListener`.
- `onCharacterChange(fn)` es el patrón para notificar cambios sin acoplar módulos.
- Los valores dinámicos (color de personaje, progreso) pueden ir inline; la estructura y el tema van en CSS.

## Migración

Ejemplo real:

```js
if (typeof gameSettings.fullscreen !== 'boolean') gameSettings.fullscreen = true;
```

- No borres una clave antigua sin migrar su valor.
- No cambies el nombre de una clave existente sin leer la anterior.
- Si cambias el formato, versiona la clave (`_v2`) y migra una sola vez.

## Anti-Patterns

- Escribir `localStorage` directamente para una preferencia que ya tiene helper.
- Guardar estado efímero de partida (timers, enemigos, torretas).
- Leer una preferencia sin default: `undefined` rompe sliders y toggles.
- Mezclar escala 0–100 con 0–1 en el mismo ajuste.
- Añadir un slider de audio sin llamar a `AudioSys.applyGameSettings(gameSettings)`.
- Duplicar el manejo de `fullscreen` en dos módulos.
