# Overlays, HUD y Comportamiento

## Capas

| Capa | Archivo | Responsabilidad |
|---|---|---|
| Estructura | `index.html` | HUD fijo y overlays de pantalla completa |
| Base | `css/style.css` | Fuentes, botones, barras, `.hidden` |
| HUD juego | `css/hud_core.css` | Stats, núcleo, radar, avisos |
| Menús | `css/hud_menus.css` | Inicio, pausa, resultados, tienda, modales |
| Torretas | `css/hud_turrets.css` | Terminal de construcción y economía |
| Tutorial | `css/hud_tutorial.css` | Panel y marcadores |
| Agregado | `css/hud_modes.css` | Importa las cuatro hojas |

`css/style.css` importa `hud_modes.css`; no añadas un `<link>` nuevo si la hoja ya se importa.

## Contrato de Overlay

```html
<div id="mi-pantalla" class="overlay hidden">
  ...
</div>
```

- `startGame()` ejecuta `document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden'))`.
- Abrir: `classList.remove('hidden')`.
- Cerrar: `classList.add('hidden')`.
- `.hidden { display: none !important; }` en `css/style.css`.
- `start-screen` es la única pantalla que puede estar visible sin `hidden` al cargar.
- Un panel que deba permanecer durante la partida (HUD) no debe usar `.overlay`.

## HUD por Modo

`HUDController.applyModeLayout(hudConfig)` ya controla:

| Elemento | Comportamiento |
|---|---|
| `core-defense-hud` | Visible solo en Defensa |
| `core-direction-indicator` | Defensa + `showCoreDirectionMarker` |
| `timer-text` | Clase `timer-secondary-mode` en Defensa |
| `hud-objective-tracker` | Header desde `hudConfig.objectiveHeader` |
| `coop-scrap-transfer` | Defensa + `coopScrapTransfer` |
| `coop-scrap-toast` | Se oculta fuera de Defensa |
| `turret-interact-prompt` | Se oculta fuera de Defensa |
| `wave-prep-prompt` | Se oculta fuera de Defensa |
| `endgame-banner`, `boss-hud`, `core-attack-banner` | Se ocultan al cambiar layout |

Si añades un elemento de un solo modo, añádelo aquí. No confíes en que "nunca se mostró".

## Pointer Lock

Patrones existentes:

- `startGame()` solicita `document.body.requestPointerLock()`.
- `finishRun()` y la pausa llaman a `document.exitPointerLock()`.
- `levelUp.js` sale del lock al abrir las cartas y lo recupera al elegir, desde el gesto del jugador.
- Un modal nuevo en partida debe salir del lock; el retorno debe ocurrir en un handler de usuario.

No llames a `requestPointerLock()` desde un callback asíncrono sin gesto: el navegador lo rechaza.

## Accesibilidad

- Usa `<button type="button">` siempre que sea posible.
- Para tarjetas clickables: `role="button"`, `tabIndex = 0`, `aria-pressed` si es toggle, y manejo de `Enter`/`Espacio`.
- Asocia `label` a inputs o usa `aria-label`.
- Mantén foco visible; no lo elimines con `outline: none` sin reemplazo.
- Los toggles deben reflejar su estado real (`aria-pressed`, texto `ACTIVADA`/`VENTANA`).

## Iconos y Sprites

- `renderSpriteIconHTML(iconKey, extraClass)` devuelve HTML con la clase de sprite.
- Tras inyectar HTML con iconos, llama a `refreshStaticDOMIcons()`.
- No uses `<img src="...png">`; los retratos de personaje son la excepción procedural (`getCharacterPortraitURL`).
- Los iconos deben tener un `iconKey` registrado en `js/spritesheets.js`; si falta, el hueco queda vacío.

## Avisos y Timers

- Guarda el ID de cada `setTimeout` en el controlador.
- Limpia el timer al cerrar el panel, cambiar de modo o reiniciar la partida.
- No acumules avisos: reemplaza el texto y reinicia el timer.
- Los avisos críticos pueden usar `role="status"` o `aria-live="polite"`.

## Setup Único

Patrón de `settingsMenu.js`:

```js
let initialized = false;
export function setupSettingsUI() {
  if (initialized) return;
  initialized = true;
  // listeners...
}
```

Úsalo si el setup se llama desde varios flujos o puede repetirse tras volver al menú. No lo uses para ocultar una inicialización que debe rehacerse por partida.

## Anti-Patterns

- Pantalla completa sin `.overlay`: se queda encima de la partida.
- Overlay sin `hidden` inicial: aparece al cargar.
- Elemento de Defensa sin guard en `applyModeLayout`: se filtra a Supervivencia.
- Listener registrado en cada apertura: se duplica y dispara varias veces.
- `innerHTML` con iconos sin `refreshStaticDOMIcons()`.
- `requestPointerLock()` desde un timeout o promesa.
- `setTimeout` sin guardar y sin limpiar.
