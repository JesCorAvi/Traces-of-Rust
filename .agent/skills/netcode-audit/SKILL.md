---
name: netcode-audit
description: "Audita y desarrolla sincronización multijugador P2P Host autoritativo (Steamworks/WebRTC) para enemigos, armas, torretas, pickups, economía y eventos. Úsala siempre que una mecánica nueva o modificada deba replicarse entre Host y Cliente."
---

# Netcode Audit

## Overview

Garantiza que toda mecánica de **Traces of Rust** encaje en el modelo **Host autoritativo**: el Host simula y decide; el Cliente interpola, predice su propio movimiento y solicita acciones. El resultado esperado es un cambio replicado sin duplicados, sin spawns autónomos en Cliente, con late-join correcto y sin salir del presupuesto de ancho de banda.

## When to Use

- Añades o modificas enemigos, jefes, proyectiles, peligros, pickups, torretas, tropas, eventos, oleadas, núcleo o economía.
- Cambias el formato de un paquete, su frecuencia o su fiabilidad.
- Depuras duplicados, desincronización, late-join, desconexiones o reinicios de partida.
- Tocas `js/online/multiplayerSync.js`, `js/online/webRtcAdapter.js`, `js/online/steamLobbyUI.js` o los guards de red de `js/modes/*`.

## When Not to Use

- UI o audio estrictamente locales: usa `hud-ui-panel` o `procedural-sfx`.
- Cambios de transporte Electron/Steamworks puro (IPC, preload, ventana): usa `electron-steam-bridge`.
- Balance solo local sin entidades replicadas: usa `game-balance-tuning`.

## Mandatory Workflow

1. **Clasifica el cambio.** Entidad, estado continuo, mutación puntual, cosmético o ciclo de vida. Si no encaja en uno, divídelo.
2. **Fija la autoridad.** Decide quién calcula y quién observa con la tabla siguiente. No implementes antes de responder esto.
3. **Define el contrato de paquete.** Nombre en mayúsculas, dirección, fiabilidad, frecuencia, campos mínimos y tamaño estimado. Reutiliza un paquete existente si cubre el caso.
4. **Implementa en el Host y en el Cliente.** Guards de autoridad, `netId` si es entidad, snapshot para late-join y no-op o interpolación en el receptor.
5. **Añade el snapshot.** Si el estado puede existir antes de que un Cliente termine de cargar, debe entrar en `NET_READY`.
6. **Valida por niveles.** Empieza por revisión estática y partida local; después dos peers, late-join y desconexión.

**Condición de parada:** si el comportamiento cooperativo no está definido (¿el Cliente puede hacer X?), pregunta solo por esa decisión de producto. Para el resto, infiere del modelo existente y declara la suposición.

## Authority Decision Table

| Cambio | Autoridad | Patrón |
|---|---|---|
| Spawn de enemigo, jefe, proyectil o pickup | Host | `netId` + `ENEMY_SPAWN`/`PICKUP_SPAWN` reliable |
| Movimiento de enemigos | Host | `ENEMY_BATCH_SYNC` unreliable 10 Hz, chunks de 20 |
| Daño del arma del Cliente | Cliente agrega, Host aplica | `PLAYER_HIT` reliable, flush 20 Hz |
| Daño de torretas/tropas aliadas | Host | El Cliente no aplica daño real |
| Oleadas, núcleo, eventos, victoria | Host | `WAVE_STATE`, `CORE_SYNC`, `EVENT_*`, `MATCH_*` |
| Movimiento y animación del jugador | Cada peer | `POS` unreliable 20 Hz + interpolación |
| Construir/mejorar/vender torreta | Cada peer construye localmente; se replica al otro | `TURRET_BUILD`/`UPGRADE`/`SELL` reliable; venta remota sin reembolso |
| Recogida de pickup | Cliente solicita, Host arbitra | `PICKUP_COLLECT` → `PICKUP_COLLECTED` |
| Chatarra de partida | Host | `handleScrapIncome` 50/50; `SCRAP_GAIN`/`ECONOMY_SYNC` |
| Efectos visuales/sonido de ataque | Emisor | `ATTACK` unreliable, sin valor de juego |

## Non-Negotiable Rules

- **Spawn autónomo prohibido en Cliente:** todo spawn de enemigos, jefes, peligros o pickups va condicionado a `MultiplayerSync.isHost()` o a partida no online.
- **`netId` único:** asignado por el Host y registrado en `EnemyPool.networkEnemies` o en el mapa de pickups.
- **Clave `type` reservada:** el sobre añade `type`, `sender` y `t`; en el payload usa `enemyType`, `pickupType`, `hazardType`, `eventType` o `actionType`.
- **Fiabilidad:** reliable para spawns, muerte, fugas, torretas, economía, oleadas, eventos y cierre; unreliable solo para posición, lotes y cosméticos.
- **Presupuesto:** `POS` 20 Hz; `ENEMY_BATCH_SYNC` 10 Hz con bloques de **20** y campos `[netId,x,z,hp,wp,st,isLocal]`; paquete unreliable ≤ ~1200 bytes.
- **Snapshot completo:** `MATCH_INFO`, `TURRET_STATE_SYNC`, `WAVE_STATE`, `CORE_SYNC`, `ENEMY_SPAWN` de vivos, `PICKUP_SPAWN` activos, `EVENT_START`/`EVENT_STATE` y `STATE_SYNC_COMPLETE`.
- **Salida asimétrica:** el Cliente emite `PEER_LEFT`/cierre local; solo el Host emite `MATCH_END`. Al recibir `PEER_LEFT`, el Host destruye el `RemotePlayer`, reajusta la economía al 100% y sigue jugando.
- **Sin listeners huérfanos:** `GameEvents.on()` devuelve su unsubscribe; guárdalo en `eventUnsubs` y límpialo al cambiar de modo o reiniciar.

## Validation Ladder

- **Nivel 0 — Estático:** ejecuta `audit-netcode.mjs`; revisa autoridad, nombre de paquete, fiabilidad, `netId`, campos y guards.
- **Nivel 1 — Partida local:** el modo funciona offline; ningún guard de red rompe el flujo normal.
- **Nivel 2 — Dos peers:** Host y Cliente ven el mismo estado; sin duplicados de spawn, pickups ni daño.
- **Nivel 3 — Late-join:** un Cliente que entra a mitad recibe snapshot completo y converge sin reiniciar la partida.
- **Nivel 4 — Ciclo de vida:** desconexión de Cliente, desconexión de Host, `MATCH_RESTART` y vuelta al menú sin quedarse colgado.

**Reporta el nivel máximo alcanzado y lo que no se pudo probar** (por ejemplo, "Nivel 2; no se probó Steam Overlay real").

## Output Expectations

Al terminar, informa:

- Clasificación del cambio y autoridad elegida.
- Paquetes nuevos o modificados: nombre, fiabilidad, frecuencia y campos.
- Archivos tocados y guards añadidos.
- Snapshot/late-join cubierto o explícitamente no cubierto.
- Nivel de validación alcanzado y riesgos pendientes.

## References

Carga solo lo que necesites:

- `references/packet-contract.md` — catálogo de paquetes, dirección, fiabilidad, frecuencia y campos.
- `references/authority-lifecycle.md` — handshake, snapshot, economía, daño, desconexión, reinicio y cierre de salas.
- `scripts/audit-netcode.mjs` — auditoría estática de clave reservada, fiabilidad, chunk y frecuencias.

## Related Skills

- `game-balance-tuning` — números que viajan por la red.
- `defense-map-authoring` — `MATCH_INFO` y mapa/dificultad impuestos por el Host.
- `electron-steam-bridge` — transporte, IPC y bombeo P2P.
- `procedural-3d-entity` — entidades visuales replicadas.
