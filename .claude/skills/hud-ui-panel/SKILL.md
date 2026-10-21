---
name: hud-ui-panel
description: "Implementa y revisa HUD, overlays, menús, modales, iconos y persistencia de ajustes sobre el juego 3D. Úsala al añadir paneles, botones, estados de modo o preferencias de usuario."
---

# HUD UI Panel

## Overview

Produce interfaces DOM/CSS coherentes con la estética industrial pixel-art de **Traces of Rust**, integradas con el estado de partida, el pointer lock, los sprites procedurales y la persistencia existente. El resultado debe funcionar en ambos modos, en navegador y Electron, sin listeners duplicados ni elementos que se filtren entre pantallas.

## When to Use

- Añadir o modificar HUD, overlays, menús, modales, tiendas o pantallas de resultados.
- Añadir botones, toggles, sliders, iconos o avisos temporales.
- Cambiar el layout del HUD entre Defensa y Supervivencia.
- Persistir una preferencia de usuario o migrar un ajuste existente.

## When Not to Use

- Crear iconos o sprites: usa `procedural-3d-entity`.
- Cambiar sonidos de UI: combínala con `procedural-sfx`.
- Cambiar el selector de mapas o sus récords: usa `defense-map-authoring`.
- Añadir un operador al selector: usa `playable-character-content`.
- Cambiar el bridge de pantalla completa Electron: usa `electron-steam-bridge`.

## Mandatory Workflow

1. **Clasifica la superficie.** HUD en juego, overlay de pantalla completa, modal, panel embebido o preferencia.
2. **Diseña los estados.** Cerrado/abierto, modo Defensa/Supervivencia, sin conexión/online, vacío/con datos. Si no puedes enumerarlos, no empieces a escribir DOM.
3. **Elige la capa.** `index.html` para estructura, hoja `hud_*` correcta para estilos, `js/ui/*` para lógica. Nada de estilos estructurales inline salvo valores dinámicos.
4. **Implementa el contrato.** Overlay con `.overlay hidden`, IDs únicos, botones accesibles, pointer lock y sonidos.
5. **Registra el layout por modo.** Si el elemento es específico de Defensa, gestiónalo en `HUDController.applyModeLayout`.
6. **Valida.** Ejecuta `audit-dom.mjs` y prueba el flujo completo en ambos modos y en Electron si aplica.

**Condición de parada:** si el diseño visual no está definido, reutiliza el patrón de un panel hermano y declara la suposición. No preguntes por colores o tipografías que ya están en las hojas existentes.

## Decision Table

| Necesidad | Patrón | Ubicación |
|---|---|---|
| Pantalla completa nueva | `<div class="overlay hidden">` | `index.html` + `hud_menus.css` |
| HUD fijo en partida | Elemento fuera de `.overlay` | `index.html` + `hud_core.css` |
| Panel de torretas | Overlay/terminal existente | `hud_turrets.css` + `js/ui/turretBuildMenu.js` |
| Modal de selección | Overlay + tarjetas accesibles | `js/ui/*Modal.js` |
| Aviso temporal | Elemento existente + timeout limpiado | `HUDController` |
| Preferencia persistente | `gameSettings` + `saveGameSettings()` | `js/core/saveState.js` |
| Icono | `renderSpriteIconHTML` + `refreshStaticDOMIcons` | `js/spritesheets.js` |

## Non-Negotiable Rules

- **Overlay contract:** toda pantalla completa usa `class="overlay hidden"`; `startGame()` oculta todos los `.overlay`. Un panel que deba sobrevivir al inicio no es overlay.
- **ID único:** verifica con `audit-dom.mjs`; no reutilices IDs entre HUD y menús.
- **Modo explícito:** cualquier elemento de un solo modo debe ocultarse en el otro desde `applyModeLayout`.
- **Pointer lock:** al abrir un modal en partida, `exitPointerLock()`; para volver a jugar, solicita el lock desde un gesto de usuario.
- **Sonido de UI:** `playUIClick` en hover/clic suave, `playUISelect` al confirmar, `playUIError` al rechazar.
- **Iconos procedurales:** nada de imágenes externas; usa el atlas y refresca tras inyectar HTML.
- **Setup único:** protege la inicialización con un flag; no dupliques listeners al abrir/cerrar.
- **Limpieza:** guarda y ejecuta los `setTimeout` y las suscripciones de `GameEvents` al cerrar o cambiar de modo.
- **Persistencia con default:** toda preferencia nueva necesita valor inicial y migración de guardados antiguos.

## Validation Ladder

- **Nivel 0 — Estático:** `audit-dom.mjs` sin IDs duplicados ni referencias inexistentes; imports y exports correctos.
- **Nivel 1 — Render:** el panel abre/cierra, no tapa el HUD por error y se ve en 1280×720 y 960×540.
- **Nivel 2 — Modos:** Defensa y Supervivencia muestran solo sus elementos; pausa, resultados y menú funcionan.
- **Nivel 3 — Input:** teclado y ratón, `Enter`/`Espacio`, pointer lock y `Escape` sin bloqueos.
- **Nivel 4 — Integración:** Electron, pantalla completa y flujo online sin errores de consola.

**Reporta el nivel alcanzado y cualquier resolución, navegador o flujo que no se haya probado.**

## Output Expectations

- Superficie y estados implementados.
- Archivos tocados (HTML, hoja CSS, módulo JS, bootstrap).
- Persistencia añadida y migración.
- Resultado de `audit-dom.mjs`.
- Niveles de validación alcanzados y riesgos.

## References

- `references/overlay-and-hud.md` — capas, contrato de overlay, layout por modo, pointer lock, accesibilidad e iconos.
- `references/persistence-and-audio.md` — claves de `localStorage`, defaults, ajustes, sonidos de UI y setup único.

## Related Skills

- `procedural-3d-entity` — iconos y sprites.
- `procedural-sfx` — sonidos de interacción.
- `defense-map-authoring` — selector de mapas y récords.
- `playable-character-content` — selector de operadores.
- `electron-steam-bridge` — pantalla completa y puente nativo.
