# Traces of Rust

Juego web 3D de terror/supervivencia + tower defense con Three.js. Sin bundler ni package.json.
- Ejecutar: `python -m http.server 8000` en la raíz y abrir `http://localhost:8000`.
- No hay build/dev/test. Verificar cargando en navegador y revisando consola.
- Requiere servidor local (módulos ES); Three.js r160 se carga por importmap desde unpkg.

## Estructura
- `index.html`: canvas, HUD, menús, overlays y paneles de torretas/tutorial.
- `css/style.css`: base visual, HUD global, botones y barras. `css/hud_modes.css` agrega por `@import` las hojas `hud_core` (HUD en juego), `hud_menus` (menús/tienda/level-up), `hud_turrets` (torretas) y `hud_tutorial`.
- `js/main.js`: bootstrap, runtime compartido, cámara, bucle de render y wiring de módulos.
- `js/core/`: `saveState` (save/settings/carrera), `input` (teclado/ratón/pointer lock), `gameFlow` (inicio/fin/pausa/menú/botones).
- `js/gameplay/`: `modifiers`, `pickups`, `combatRuntime`, `playerVisuals`, `levelUp`.
- `js/config.js`: CONFIG global + reexport. `js/config/modesConfig.js`: catálogo y Supervivencia. `js/config/coreDefense/`: `core`, `routes`, `waves`, `economy`, `placement`, `tutorial`, `turrets` (barrel en `coreDefenseConfig.js`).
- `js/core/eventBus.js`: bus de eventos (`GameEvents`).
- `js/world.js`: orquesta `world/` (`scene`, `materials`, `geometry`, `physics`, `lights`, `props`, `dust`, `routeClearance`).
- `js/entities.js`: barrel de `entities/` (`billboard`, `enemy`, `enemyPool`).
- `js/combat.js`: barrel de `combat/` (`shared`, `weapons/*`, `bossAttacks`).
- `js/player/playerController.js`: actualización de armas del jugador.
- `js/modes/`: `gameModeManager`, `survivalMode`, `coreDefenseMode`, `enemyLoop`.
- `js/defense/`: `defensiveStructure` (base), `coreMachine`, `turret`, `turretSystem`, `allyUnit`, `enemyTargetAI`, `pathSystem`, `spawnPointSystem`, `exitPointSystem`, `mapGenerator`, `waveManager`, `defenseEventManager`; subcarpetas `turrets/` y `turretSystem/`.
- `js/sprites/`: `spritePalette` y subcarpetas `entity/`, `player/`, `turret/`, `ui/`; barrels `entitySprites.js`, `playerSprites.js`, `turretSprites.js`, `uiAtlasBuilder.js`; registro en `spritesheets.js`.
- `js/ui/`: `hudController` + `hud/` (`stats`, `radar`), `menusAndShop`, `resultsScreen`, `turretBuildMenu`.
- `js/tutorial/`: `towerDefenseTutorial` (orquestador y panel), `tutorialSteps` (datos de pasos), `tutorialMarkers` (anillos/haces 3D) y `practiceWave` (oleada de práctica).
- `js/debug/debugOverlay.js`: debug de rutas/IA. `js/audio.js`: audio WebAudio sintetizado.
- `js/utils/`: `routeMath` (proyección punto-segmento) y `dispose` (liberar Object3D).

## Sistemas
- Render: `world.js` + `main.js` (renderer/cámara). Input: `core/input.js`.
- Física: `worldPhysics` en `world/physics.js` (`getGroundHeight`, `resolveCollision`, `isRampAt`).
- UI: `index.html`, `css/*`, `js/ui/*`. Audio: `js/audio.js`.
- Estado/modos: `ModeManager`; flujo en `core/gameFlow.js`; run/stats en `main.js`; config en `js/config*`.
- Modo Defensa (Tower Defense): estilo Bloons TD 6 con rutas procedurales orgánicas a ras de suelo por pasillos despejados (loops y meandros), flechas de flujo animadas durante el descanso entre oleadas (60s, saltable con [F]), compuertas de entrada y esclusas de salida, contención por vidas (leaks). Chatarra inicial: 10 en todas las dificultades. Eventos especiales cada 3 rondas (reparación o infestación con pausa total del reloj, haz vertical sin niebla, baliza holográfica visible a distancia y recompensa de chatarra). Balance estilo Orcs Must Die / Dungeon Defenders: torretas indispensables con daño elevado, horda de ruta blindada ante armas ligeras del jugador (45% daño del jugador en ruta). Torretas inmunes a ataques directos; torre Taller como buffer/amplificador radial (cadencia, daño, alcance).
- Enemigos y Combate: Acechador (Weeper) con disparo de proyectiles a distancia y tasa de spawn progresiva; IA de seguimiento de ruta y fuga por esclusas en modo Defensa.
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
- No leas `.git/`, `node_modules/`, `dist/`, `build/`, lockfiles ni binarios.
- No instales dependencias sin preguntar. Verifica el arranque en navegador tras cambios.
- Abre Claude desde la raíz del repo para que las reglas deny de `.claude/settings.json` apliquen.
- Mantén las cabeceras y actualiza este mapa si mueves módulos.
