# Traces of Rust

Juego web 3D de terror/supervivencia + tower defense con Three.js.
- Ejecutar en navegador: `python -m http.server 8000` en la raíz y abrir `http://localhost:8000`.
- Ejecutar en Windows (con Steamworks Spacewar 480): `npm start` (o abrir `dist/Traces of Rust-win32-x64/Traces of Rust.exe`).
- Empaquetar ejecutable Windows: `npm run build:win`.
- Three.js r160 se carga por importmap desde unpkg.

## Estructura
- `index.html`: canvas, HUD, menús, overlays, paneles de torretas/tutorial y modal Steam Online.
- `electron-main.cjs`: proceso principal de Electron, integración de Steamworks SDK (`steamworks.js`), gestión de lobbies Spacewar (AppID 480), P2P y aceleración por GPU.
- `preload.cjs`: puente de contexto seguro (`window.steamOnline`) entre Electron y el renderizador.
- `steam_appid.txt`: ID de prueba de Steamworks (`480` para Spacewar).
- `js/online/steamLobbyUI.js`: interfaz y gestor de salas multijugador privadas P2P (exclusivas por código/ID) e invitaciones por Steam Overlay (`Shift + Tab`).
- `js/online/multiplayerSync.js`: orquestador de sincronización P2P en tiempo real en partida (avatares remotos 3D `RemotePlayer`, posiciones a 20Hz, animación direccional de 8 ángulos, ataques, sincronización de torretas construidas/mejoradas/vendidas con retroactividad `TURRET_STATE_SYNC`, fases de oleadas y estado del núcleo).
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
- `js/defense/`: `defensiveStructure` (base), `coreMachine`, `turret`, `turretSystem`, `allyUnit`, `enemyTargetAI`, `pathSystem`, `spawnPointSystem`, `exitPointSystem`, `mapGenerator`, `mapCatalog` (18 mapas: 6 fácil, 6 normal, 6 difícil), `routeThumbnailRenderer` (miniaturas 2D procedurales), `waveManager`, `defenseEventManager`; subcarpetas `turrets/` y `turretSystem/`.
- `js/sprites/`: `spritePalette` y subcarpetas `entity/`, `player/`, `turret/`, `ui/`; barrels `entitySprites.js`, `playerSprites.js`, `turretSprites.js`, `uiAtlasBuilder.js`; registro en `spritesheets.js`.
- `js/ui/`: `hudController` + `hud/` (`stats`, `radar`), `menusAndShop`, `resultsScreen`, `turretBuildMenu`, `mapSelectorModal` (selector de mapas estilo Bloons TD 6), `settingsMenu` (pantalla completa híbrida Electron/Web con persistencia).
- `js/tutorial/`: `towerDefenseTutorial` (orquestador y panel), `tutorialSteps` (datos de pasos), `tutorialMarkers` (anillos/haces 3D) y `practiceWave` (oleada de práctica).
- `js/debug/debugOverlay.js`: debug de rutas/IA. `js/audio.js`: audio WebAudio sintetizado.
- `js/utils/`: `routeMath` (proyección punto-segmento) y `dispose` (liberar Object3D).

## Sistemas
- Render: `world.js` + `main.js` (renderer/cámara). Input: `core/input.js`.
- Física: `worldPhysics` en `world/physics.js` (`getGroundHeight`, `resolveCollision`, `isRampAt`).
- UI: `index.html`, `css/*`, `js/ui/*`. Audio: `js/audio.js`.
- Estado/modos: `ModeManager`; flujo en `core/gameFlow.js`; run/stats en `main.js`; config en `js/config*`. Menú principal con formato PC idéntico a PokéBonk, Megabonk y Vampire Survivors con fondo 3D en vivo: la fábrica industrial, luces, linterna, partículas de polvo y props giran suavemente en una toma cinemática 3D en WebGL visible a pantalla completa bajo una viñeta sutil. Barra superior flotante con estatus de sector y cápsula de dientes/moneda (`start-currency-pill`). Flanco izquierdo con título horror, selector de modo dual lado a lado (cápsula Hero para Tower Defense como campaña principal por defecto y cápsula secundaria para Supervivencia arcade), selector de dificultad integrado, botón gigante de acción `[ JUGAR ]`, botón de tutorial y acciones secundarias. Centro abierto para disfrutar la escena 3D. Flanco derecho con expediente de servicio flotante translúcido (`start-dossier-card`) con estadísticas de carrera, directivas tácticas de misión y atajos de control.
- Modo Defensa (Tower Defense): estilo Bloons TD 6 con selector de mapas táctico de 18 zonas (6 en Fácil, 6 en Normal y 6 en Difícil) con miniaturas 2D procedurales en tiempo real que revelan las rutas, bucles, cruces y balizas de entrada/salida. Sistema de pestañas de dificultad, medallas de progreso/récord y persistencia (`traces_td_selected_map`, `traces_td_map_records`). Vías industriales inmersivas (pasarela de rejilla metálica, rieles de acero 3D y traviesas transversales) a ras de suelo o adaptadas sobre estructuras. Flechas de flujo animadas orientadas a la salida durante los descansos entre oleadas (saltable con [F]), compuertas de entrada y esclusas de salida con columnas de luz vertical (Skybeams de 60m, `fog: false`) y hologramas 3D flotantes visibles desde cualquier rincón del mapa, contención por vidas (leaks). Chatarra inicial: 10 en todas las dificultades. La primera ronda carece de límite de tiempo (exploración libre) para que el jugador inspeccione el mapa hasta pulsar [F]. En Normal las vías se acercan en el patio central formando un tramo paralelo a 7.6m (cuello de botella) para facilitar la defensa combinada con torretas de área; en Difícil los dos carriles avanzan por flancos independientes sin cruzarse para evitar defensas conjuntas triviales. Eventos especiales cada 3 rondas convertidos en un mini-modo supervivencia intenso de 2 minutos (120s) en una zona amplia (radio 15m / diámetro 30m) con anillo perimetral y 6 balizas delimitadoras, escalado progresivo de hostiles (hasta 18 simultáneos con Weepers en el clímax final), reloj congelado, recompensa de +30 chatarra y transición de atmósfera roja idéntica al último boss del modo Supervivencia durante la Fase 3 final (viñeta de sangre en pantalla, niebla densa roja 0x160303, iluminación ambiental roja 0x3a0808 y drone de subgraves). Balance estilo Orcs Must Die / Dungeon Defenders: torretas indispensables con daño elevado, horda de ruta blindada ante armas ligeras del jugador (45% daño del jugador en ruta). Torretas: modelos 3D mecánicos completos integrados con texturas procedurales (franjas de peligro hazard, paneles técnicos de acero remachado, medidores analógicos) y placas de calcomanías industriales específicas por clase. Pedestal octagonal con patas estabilizadoras anclado al suelo (`baseRoot`) y cabezal giratorio con cañones (`modelRoot`) que rota en 3D siguiendo al objetivo (`faceTarget`). Destello de disparo dinámico (muzzle flash), retroceso mecánico del cañón y rotación continua de radar/antena en torres tácticas, sin recortes de billboard 2D flotantes. Muerte del jugador en Defensa: sobrecarga al núcleo de -50 HP y tiempo de reconstrucción de 5 segundos antes de revivir.
- Enemigos y Combate: Acechador (Weeper) con disparo de proyectiles a distancia y tasa de spawn progresiva; IA de seguimiento de ruta y fuga por esclusas en modo Defensa.
- Multijugador Online P2P (Steamworks / Spacewar 480):
  - Lobbies y conexión: salas privadas exclusivas por código/ID o invitación directa mediante Steam Overlay (`Shift + Tab`, Rich Presence `+connect_lobby`). Sin buscador público de salas abiertas.
  - Transporte y drenaje de paquetes: bucle nativo a ~60Hz (`startP2PPump`) en Electron para lectura y reenvío instantáneo de paquetes P2P al renderer mediante IPC push (`onP2PPacket`). Envío fiable (`SendType.Reliable`) para eventos críticos y no fiable (`SendType.Unreliable`) para `POS` a 20Hz con `seq`. `backgroundThrottling: false` y switches anti-throttling evitan desfases con Alt+Tab/Overlay.
  - Modelo **Host Autoritativo** (listen server): el Host simula enemigos, torretas/tropas, oleadas, núcleo, eventos y pickups; el Cliente no crea enemigos ni decide fases, solo interpola réplicas y envía daño/recogidas.
  - Handshake y snapshot (`NET_READY`): `HELLO`/`HELLO_ACK` + `NET_READY` tras `startActiveMode`; el Host envía `MATCH_INFO` (modo/mapa/dificultad), torretas, `WAVE_STATE`, `CORE_SYNC`, `ENEMY_SPAWN` de vivos, `PICKUP_SPAWN`, `EVENT_START/STATE` y `STATE_SYNC_COMPLETE`. Los paquetes pre-ready se bufferizan y se reaplican; latido de reconciliación a 1Hz.
  - Economía de suma cero: bolsillos individuales; chatarra inicial y ganancias de partida repartidas 50/50 con residuo alternado (`SCRAP_GAIN`/`ECONOMY_SYNC`). `SCRAP_TRANSFER` con `[T]` (+5) y `[Shift+T]` (+1); la venta remota no abona chatarra al receptor.
  - Enemigos: `netId` incremental y `Map(netId -> enemy)` en `EnemyPool`; solo el Host emite `ENEMY_SPAWN` (reliable), `ENEMY_DIE`/`ENEMY_LEAK` y `ENEMY_BATCH_SYNC` (10Hz, unreliable, `seq`, troceado en bloques de 20 con x/z/hp/waypoint/estado). El Cliente extrapola a 60 FPS y corrige con lerp.
  - Daño y botín: torretas/tropas aliadas no aplican daño real en el Cliente; el daño de armas del Cliente se agrega y envía como `PLAYER_HIT` (20Hz) con HP visual mínimo 1. `PICKUP_SPAWN`/`PICKUP_COLLECT`/`PICKUP_COLLECTED` arbitran la recogida sin duplicados.
  - Eventos especiales: `EVENT_START` con coordenadas/fase/timer exactos, `EVENT_STATE` (fase 3 y atmósfera roja) y `EVENT_END`; todos los enemigos del evento nacen en el Host.
  - Avatares remotos (`RemotePlayer`): `POS` a 20Hz con `seq`, `pitch`, `isMoving` y `down/downTimer`; ghost de reconstrucción, flash de daño, linterna verde orientable y FX reales de todas las armas (`ATTACK` con origen/dirección/punto de impacto).
  - Ciclo de partida: `MATCH_INFO` valida modo/mapa/dificultad impuestos por el Host; `MATCH_RESTART` reinicia a ambos con el mismo `matchInfo` y `MATCH_END`/`MATCH_OVER`/`PLAYER_RUN_END` cierran la run o vuelven al menú limpiamente; `steam:peerDisconnected` saca a ambos sin quedar colgados.
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
