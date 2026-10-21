# Autoridad, Snapshot y Ciclo de Vida

## Roles

- **Host (listen server):** única autoridad sobre IA, oleadas, núcleo, eventos, pickups, economía global, torretas/tropas y victoria/derrota.
- **Cliente:** predice su movimiento local; agrega daño (`PLAYER_HIT`); solicita recogidas (`PICKUP_COLLECT`); solicita torretas (`TURRET_BUILD`/`UPGRADE`/`SELL`). No crea enemigos ni decide fases.

`MultiplayerSync.isHost()` se fija al arrancar (`info.isHost`) y cae al propietario del lobby si falta. `isOnline()` exige partida activa y `window.steamOnline`; no basta con estar en una sala.

## Handshake y late-join

1. El jugador entra al lobby; `HELLO` se emite de inmediato y se reintenta cada 1 s hasta confirmar presencia (máximo ~20 intentos).
2. Al arrancar el modo, `gameFlow.startGame()` llama a `MultiplayerSync.onLocalModeReady()`.
3. Cada peer emite `NET_READY` reliable con su rol.
4. El Host ejecuta `sendFullState(peerId)` en este orden:
   - `MATCH_INFO`
   - `TURRET_STATE_SYNC`
   - `WAVE_STATE`
   - `CORE_SYNC`
   - `ENEMY_SPAWN` de todos los vivos
   - `PICKUP_SPAWN` de todos los activos
   - `EVENT_START` / `EVENT_STATE` si hay evento
   - `ECONOMY_SYNC` inicial
   - `ENEMY_BATCH_SYNC` de alineación
   - `STATE_SYNC_COMPLETE`
5. El Cliente reintenta `NET_READY` cada 1 s hasta recibir `STATE_SYNC_COMPLETE` (máximo ~20 intentos).
6. Los paquetes que llegan antes de que exista escena/modo se bufferizan en `pendingStatePackets` y se reaplican al estar listo.

**Regla:** cualquier estado persistente que un Cliente pueda perderse debe entrar en `sendFullState`. Un evento visual efímero no necesita snapshot.

## Latido autoritativo

Cada 1 s, el Host reenvía `WAVE_STATE` y `CORE_SYNC`. Esto corrige pérdidas de paquetes reliable puntuales sin enviar un snapshot completo. Si añades estado crítico nuevo, considera incluirlo en este latido o en `sendFullState`.

## Economía de suma cero

- `handleScrapIncome(mode, amount)` solo se ejecuta en el Host.
- Con compañero (`remotePlayers.size > 0`): `hostShare = floor(amount / 2)`, `clientShare = amount - hostShare`; si el importe es impar, el residuo alterna con `scrapOddToHost` y se envía `SCRAP_GAIN` al Cliente.
- Sin compañero: el Host recibe el 100%.
- El Cliente no genera ingresos propios; devuelve `true` sin acreditar.
- La venta remota se aplica sin abonar chatarra en el receptor.
- `SCRAP_TRANSFER` resta localmente antes de enviar y reembolsa si el envío falla.
- Al desconectarse el compañero, el Host reajusta automáticamente al 100%.

## Daño

- **Cliente → enemigos:** agrega impactos en `pendingPlayerHits` y los envía como `PLAYER_HIT` reliable cada 50 ms. El Host aplica el daño real.
- **Torretas/tropas aliadas en Cliente:** no aplican daño real; solo FX. El Host replica muertes y HP.
- **Daño al jugador:** el Host valida y aplica `damageReduction`; el Cliente muestra HP visual mínimo 1.
- **Muerte del jugador Cliente:** `CORE_DAMAGE_REQUEST` (1–500) solicita la sobrecarga; el Host decide y sincroniza `CORE_SYNC`.

## Torretas

1. Cada peer valida en local la posición, el coste y las reglas antes de emitir `TURRET_BUILD`/`UPGRADE`/`SELL` reliable.
2. El peer receptor crea o modifica la réplica; la venta remota se aplica sin reembolso.
3. `TURRET_STATE_SYNC` (Host → Cliente) cubre late-join con `id`, `typeId`, posición, `yaw` y `levels`.
4. El Cliente no ejecuta daño de torreta; solo animación y estado visual.

## Desconexión y cierre

- **Cliente sale al menú:** emite `PEER_LEFT` (o cierre local). El Host destruye su `RemotePlayer`, oculta el atajo `[T]`, pasa la economía al 100% y continúa.
- **Host sale o termina:** emite `MATCH_END`; el Cliente vuelve al menú con `"El Host ha finalizado la sesión."`.
- **Fin de run sin cerrar sesión:** `onLocalRunEnded()` desuscribe eventos, limpia pending hits/spawns y mantiene `_matchInfo` para `MATCH_RESTART`.
- **Reinicio:** `MATCH_RESTART` lleva el mismo `matchInfo` a ambos peers; el Host reenvía el snapshot.
- **Cierre de sala:** `setLobbyData('status', 'ENDED')` + `leaveLobby()`; en WebRTC se destruye el `Peer` para liberar el código.
- **`steam:peerDisconnected`:** debe sacar a ambos sin dejar la UI colgada.

## Anti-Patterns

- Spawn de enemigos/pickups en Cliente "porque también los ve".
- Aplicar daño real de torretas en Cliente.
- Enviar el estado completo en un paquete unreliable.
- Añadir estado persistente sin snapshot de late-join.
- Emitir `MATCH_END` desde el Cliente.
- Usar `type` como clave de payload.
- Reutilizar `netId` tras reiniciar sin limpiar mapas.
- Registrar listeners de `GameEvents` sin guardar el unsubscribe.
- Asumir que `isOnline()` es cierto solo por estar en lobby.

## Escenarios de Prueba

1. Partida local sin red: ningún guard rompe el flujo.
2. Host + Cliente desde el inicio: estado convergente.
3. Cliente entra a mitad de oleada: snapshot completo.
4. Cliente muere: `CORE_DAMAGE_REQUEST` y núcleo sincronizado.
5. Cliente sale: Host continúa y economía al 100%.
6. Host sale: Cliente vuelve al menú.
7. Reintentar: ambos arrancan con el mismo `matchInfo`.
8. Alt+Tab/Overlay: sin congelación ni desincronización.
