# Traces of Rust

Juego web 3D de terror/supervivencia + tower defense con Three.js. Sin bundler ni package.json.
- Ejecutar: `python -m http.server 8000` en la raíz y abrir `http://localhost:8000`.
- No hay build/dev/test. Verificar cargando en navegador y revisando consola.
- Requiere servidor local (módulos ES); Three.js r160 se carga por importmap desde unpkg.

## Estructura
- `index.html`: canvas, HUD, menús, overlays y paneles de torretas/tutorial.
- `css/style.css`: base visual, HUD global, botones y barras. `css/hud_modes.css`: HUD por modo, tienda, torretas y tutorial.
- `js/main.js`: arranque, bucle, cámara, input, jugador, drops, estado de run y wiring de UI.
- `js/config.js`: CONFIG global + reexport de configs. `js/config/modesConfig.js`: catálogo y Supervivencia. `js/config/coreDefenseConfig.js`: Defensa, torretas, mejoras, colocación y tutorial.
- `js/core/eventBus.js`: bus de eventos (`GameEvents`).
- `js/world.js`: escena, luces, geometría y `worldPhysics` (suelo, rampas, colisión).
- `js/entities.js`: billboards, `Enemy`, `EnemyPool`.
- `js/combat.js`: armas, proyectiles, VFX y recursos compartidos.
- `js/player/playerController.js`: actualización de armas del jugador.
- `js/modes/`: `gameModeManager` (registro), `survivalMode`, `coreDefenseMode`.
- `js/defense/`: `defensiveStructure` (base), `coreMachine` (reactor), `turret`, `turretSystem` (colocación/combate), `allyUnit`, `enemyTargetAI`, `pathSystem`, `spawnPointSystem`, `waveManager`.
- `js/sprites/`: `spritePalette` (paleta/outline), `playerSprites`, `entitySprites`, `turretSprites`, `uiAtlasBuilder`. `js/spritesheets.js`: registro de hojas/iconos.
- `js/ui/`: `hudController` (HUD), `menusAndShop` (menú/tienda/level-up), `resultsScreen`, `turretBuildMenu`.
- `js/tutorial/towerDefenseTutorial.js`: tutorial interactivo de Defensa.
- `js/debug/debugOverlay.js`: debug de rutas/IA.
- `js/audio.js`: audio WebAudio sintetizado (`AudioSys`).
- `js/assets.js`, `assets/`, `models/`: legacy muerto; no leer.

## Sistemas
- Render: `world.js` + `main.js` (renderer/cámara). Input: listeners de `main.js` y variable `state`.
- Física: `worldPhysics` en `world.js` (`getGroundHeight`, `resolveCollision`, `isRampAt`).
- UI: `index.html`, `css/*`, `js/ui/*`. Audio: `js/audio.js` (sin ficheros).
- Estado/modos: `ModeManager`; run/stats en `main.js`; configuración en `js/config*`.
- Arte: procedural en `js/sprites/*`; no hay texturas externas.

## Convenciones
- ES modules vanilla, imports relativos, sin dependencias npm.
- Identificadores en inglés; comentarios/UI en español.
- Estética oscura industrial pixel-art (Buckshot Roulette); NearestFilter.
- Unidades: segundos, metros, daño por impacto.
- Objetos con `destroy()`; marcar `userData.sharedGeo/sharedMat`.
- Cambios puntuales; no reescribir archivos completos ni cambiar comportamiento sin pedirlo.

## Reglas para el asistente
- Lee este archivo primero; no explores todo el proyecto.
- Usa Grep antes de Read; lee por rangos (`offset`/`limit`) en archivos >300 líneas.
- No leas `.git/`, `assets/`, `models/`, `js/assets.js`, `node_modules/`, `dist/`, `build/`, lockfiles ni binarios.
- No instales dependencias sin preguntar. Verifica el arranque en navegador tras cambios.
- Abre Claude desde la raíz del repo para que las reglas deny de `.claude/settings.json` apliquen.
- Mantén las cabeceras y actualiza este mapa si mueves módulos.
