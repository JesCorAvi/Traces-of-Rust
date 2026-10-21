# Contrato de Paquetes P2P

Fuente: `js/online/multiplayerSync.js`. El sobre de `broadcast()`/`sendToPeer()` es:

```js
JSON.stringify({ ...payload, type, sender, t })
```

`type`, `sender` y `t` son del transporte. En el payload nunca uses `type`; emplea sufijos semánticos (`enemyType`, `pickupType`, etc.).

## Ciclo de partida y handshake

| Paquete | Dirección | Fiabilidad | Cuándo | Campos clave |
|---|---|---|---|---|
| `LOBBY_PING` / `LOBBY_PING_ACK` | Ambos | Reliable | Descubrimiento en lobby | `sender` |
| `HELLO` | Ambos | Reliable | Entrada y reintento cada 1 s | `charId`, `x/y/z`, `yaw`, `t` |
| `HELLO_ACK` | Ambos | Reliable | Confirmación de presencia | `charId`, posición, `t` |
| `NET_READY` | Ambos | Reliable | `startActiveMode` completado | `role` (`host`/`client`) |
| `MATCH_INFO` | Host → Cliente | Reliable | Inicio y late-join | `mode`, `mapId`, `diff`, `timestamp` |
| `STATE_SYNC_COMPLETE` | Host → Cliente | Reliable | Fin del snapshot | `modeId` |
| `START_MATCH` | Host → Cliente | Reliable | Arranque remoto | Estado de match |
| `MATCH_RESTART` | Host → Cliente | Reliable | Reintentar | `mode`, `mapId`, `diff`, `timestamp` |
| `MATCH_END` | Host → Cliente | Reliable | Host sale o termina | `matchTimestamp` |
| `MATCH_OVER` | Host → Cliente | Reliable | Fin de run compartida | `outcome` saneado |
| `PLAYER_RUN_END` | Cliente → Host | Reliable | Cliente termina su run | Resultado |
| `PEER_LEFT` | Cliente → Host | Reliable | Cliente vuelve al menú | `matchTimestamp` |

## Oleada, núcleo y eventos

| Paquete | Dirección | Fiabilidad | Cuándo | Campos clave |
|---|---|---|---|---|
| `WAVE_STATE` | Host → Cliente | Reliable | Cambio de fase, late-join, latido 1 Hz | `currentWaveIndex`, `totalWaves`, `state`, `prepTimer`, `wavesCompleted`, `spawnQueue`, `spawnInterval`, `pendingBossId`, `activeRoutes` |
| `WAVE_ACTION` | Cliente → Host | Reliable | `SKIP_PREP`, inicio manual | `action` |
| `CORE_SYNC` | Host → Cliente | Reliable | Daño, curación, late-join | `currentHp`, `maxHp` |
| `CORE_DAMAGE_REQUEST` | Cliente → Host | Reliable | Muerte del jugador Cliente | `amount` (1–500), `reason` |
| `EVENT_START` | Host → Cliente | Reliable | Evento especial | `eventType`, `targetName`, `article`, `x/y/z`, `duration`, `radius`, `elapsed`, `phase`, `progress` |
| `EVENT_STATE` | Host → Cliente | Reliable | Fase 3 / atmósfera roja | `elapsed`, `phase`, `progress` |
| `EVENT_END` | Host → Cliente | Reliable | Evento completado | `eventType`, `title`, `scrapReward` |
| `MATCH_VICTORY` | Host → Cliente | Reliable | 12 oleadas completadas | `wavesCompleted`, `totalWaves`, `matchTimestamp` |

## Enemigos, jefes y proyectiles

| Paquete | Dirección | Fiabilidad | Cuándo | Campos clave |
|---|---|---|---|---|
| `ENEMY_SPAWN` | Host → Cliente | Reliable | Spawn y late-join | `netId`, `enemyType`, `x/y/z`, `hp`, `maxHp`, `dmg`, `speed`, `routeId`, `waypointIdx`, `isDefenseMode`, `isEventEnemy`, `isBoss`, `bossId`, `phase`, `steerDir`, `state`, `matchTimestamp` |
| `ENEMY_DIE` | Host → Cliente | Reliable | Muerte | `netId`, `x/z`, `enemyType`, `isBoss`, `dropType`, `pickupNetId` |
| `ENEMY_LEAK` | Host → Cliente | Reliable | Fuga por esclusa | `netId`, `routeId` |
| `ENEMY_BATCH_SYNC` | Host → Cliente | Unreliable | 10 Hz y late-join | `seq`, `e[]`, `matchTimestamp`; cada fila `[netId,x,z,hp,wp,st,isLocal]`; chunks de 20 |
| `ENEMY_PROJECTILE` | Host → Cliente | Unreliable | Proyectil de jefe | `x/y/z`, `vx/vy/vz`, `life`, `dmg` |
| `ENEMY_HAZARD` | Host → Cliente | Unreliable | Telegrafía de jefe | `hazardType`, `x/y/z`, `dirX/dirZ`, `radius`, `arc`, `timer`, `maxTimer`, `dmg`, `bossNetId` |

## Jugador, daño y ataques

| Paquete | Dirección | Fiabilidad | Cuándo | Campos clave |
|---|---|---|---|---|
| `POS` | Ambos | Unreliable | 20 Hz | `seq`, `x/y/z`, `yaw`, `pitch`, `isMoving`, `pState`, `hp`, `maxHp`, `down`, `downTimer`, `charId` |
| `PLAYER_HIT` | Cliente → Host | Reliable | Flush 20 Hz | `netId`, `damage`, `isCrit`, `knockbackX`, `knockbackZ`, `dot`, `burnDps`, `burnDuration` |
| `ATTACK` | Ambos | Unreliable | FX de arma | `weaponId`, `x/y/z`, `originX/Y/Z`, `dirX/Y/Z`, `hitX/Y/Z` |

## Pickups y economía

| Paquete | Dirección | Fiabilidad | Cuándo | Campos clave |
|---|---|---|---|---|
| `PICKUP_SPAWN` | Host → Cliente | Reliable | Spawn y late-join | `pickupNetId`, `pickupType`, `value`, `x/y/z` |
| `PICKUP_COLLECT` | Cliente → Host | Reliable | Solicitud de recogida | Datos del pickup |
| `PICKUP_COLLECTED` | Host → Ambos | Reliable | Recogida arbitrada | `pickupNetId` y datos |
| `SCRAP_GAIN` | Host → Cliente | Reliable | Ingreso de partida 50/50 | `amount` |
| `ECONOMY_SYNC` | Host → Cliente | Reliable | Late-join / residuo | `scrap`, `initial` |
| `SCRAP_TRANSFER` | Ambos | Reliable | `[T]` / `[Shift+T]` | `amount` |

## Torretas

| Paquete | Dirección | Fiabilidad | Cuándo | Campos clave |
|---|---|---|---|---|
| `TURRET_BUILD` | Ambos | Reliable | Construcción | `typeId`, `x/y/z`, `yaw`, `turretId` |
| `TURRET_UPGRADE` | Ambos | Reliable | Mejora | `turretId`, `pathIndex`, `level`, posición |
| `TURRET_SELL` | Ambos | Reliable | Venta | `turretId`, posición |
| `TURRET_STATE_SYNC` | Host → Cliente | Reliable | Late-join | `turrets[]` con `id`, `typeId`, `x/y/z`, `yaw`, `levels` |

## Regla de tamaño

Un paquete unreliable debe quedar por debajo de ~1200 bytes. Si añades campos a `ENEMY_BATCH_SYNC`, reduce el chunk o mueve el dato a un paquete reliable puntual. Nunca envíes el estado completo de todos los enemigos en un único paquete no fiable.
