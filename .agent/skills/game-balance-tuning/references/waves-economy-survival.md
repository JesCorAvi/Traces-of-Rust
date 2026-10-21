# Oleadas, Economía, Colocación y Supervivencia

## `WAVES`

Fuente: `js/config/coreDefense/waves.js`.

```js
{
  totalWavesForVictory: 12,
  initialPrepTimeSec: 60,
  betweenWavesRestSec: 60,
  enableEndgameSwarmAfterVictory: false,
  coreHealPerWaveCompleted: 65,
  tdBaseHpMult: 2.8,
  hpMultiplierPerWave: 0.28,
  dmgMultiplierPerWave: 0.14,
  speedMultiplierPerWave: 0.025,
  playerDamageMultiplierVsRoute: 0.45,
  EVENTS: { ... },
  SCHEDULE: [ ... ]
}
```

### Ritmo

- La **primera** preparación no tiene límite: `waveManager` ignora el timer mientras `currentWaveIndex === 0`. El jugador explora hasta `[F]`.
- Entre oleadas hay `betweenWavesRestSec` (60 s), saltable con `[F]`.
- Al completar una oleada, el núcleo cura `coreHealPerWaveCompleted` (65 HP).
- `totalWavesForVictory` debe seguir siendo 12; HUD, victoria, récords y red lo asumen.

### Escalado

- HP: `tdBaseHpMult` y `hpMultiplierPerWave`.
- Daño: `dmgMultiplierPerWave`.
- Velocidad: `speedMultiplierPerWave`.
- Daño del jugador en ruta: `playerDamageMultiplierVsRoute: 0.45` (45%). Las torretas siguen siendo la fuente principal.

### `SCHEDULE`

Cada entrada:

```js
{ wave: 1, count: 10, interval: 1.25, routes: ['path_north'],
  composition: { zombie: 1.0, worm: 0.0, weeper: 0.0 },
  bossId: 'boss_butcher' }
```

- `count` debe ser positivo.
- `interval` es el tiempo entre spawns.
- `composition` son pesos acumulativos: primero `worm`, luego `weeper`; deben sumar ~1.
- `routes` es **fallback**. Si el mapa tiene rutas en `PathSystem`, `getActiveRoutes()` usa todas las del mapa y reparte los spawns; los IDs del schedule no tienen que coincidir con los del catálogo.
- `bossId` debe existir en `CONFIG.BOSS_SCHEDULE`; si no, cae al primer jefe.

### Eventos

`WAVES.EVENTS`:

```js
{
  intervalWaves: 3,
  eventDurationSec: 120,
  survivalRadius: 50,
  scrapReward: 30,
  maxEnemiesBase: 8,
  maxEnemiesPeak: 18,
  spawnIntervalStart: 2.2,
  spawnIntervalEnd: 1.1
}
```

- Se disparan tras las rondas 3, 6 y 9.
- Mini-modo de 2 minutos, zona de 100 m de diámetro (radio 50 m), escalado hasta 18 simultáneos.
- Fase final con atmósfera roja, niebla densa y drone de subgraves.
- Cambiar la duración/radio afecta a `defenseEventManager`, HUD y música.

## `SCRAP`

Fuente: `js/config/coreDefense/economy.js`.

```js
{
  startingScrap: 10,
  normalDropChance: 0.32,
  normalDropValue: 1,
  bossDropValue: 18,
  waveCompletionBonus: 6,
  maxActivePickups: 40
}
```

- Chatarra inicial: 10 en todas las dificultades.
- La chatarra de Defensa no se convierte en Dientes permanentes.
- Online: **toda** ganancia pasa por `MultiplayerSync.handleScrapIncome(mode, amount)`. Reparto 50/50 con residuo alternado; si no hay compañero, 100% al Host.
- La venta remota no abona chatarra al receptor.
- `maxActivePickups` limita el número de botines en el suelo.

## `PLACEMENT`

Fuente: `js/config/coreDefense/placement.js`.

```js
{
  minPlayerDistance: 1.5,
  maxPlayerDistance: 10.5,
  minPathDistance: 2.5,
  minTurretDistance: 2.2,
  minCorePadding: 0.8,
  maxTurrets: 16,
  spawnClearance: 4.0,
  enemyClearance: 1.8
}
```

Cambiar estos valores afecta a la UX de construcción y a la validez de todos los mapas. `maxTurrets: 16` es también un límite de rendimiento.

## `CORE` y muerte del jugador

`js/config/coreDefense/core.js`:

- `CORE.maxHp: 1500`, radio 2.35, altura 6.2, posición central.
- `PLAYER_DEATH_POLICY`: `respawn_with_penalty`, `respawnDelaySec: 5.0`, `coreHpPenaltyOnRespawn: 50`, `respawnInvulnSec: 2.5`.
- Al morir, el núcleo sufre −50 HP y el jugador revive a los 5 s.
- Los estados visuales del núcleo (`DAMAGE_STATES`) dependen de porcentajes; no cambies HP sin revisar umbrales.

## Supervivencia

`js/config/modesConfig.js` → `MODES_CONFIG.SURVIVAL`.

### `DIFFICULTY`

| Clave | Valor | Uso |
|---|---|---|
| `MAX_ACTIVE_ENEMIES` | 130 | Techo de enemigos activos |
| `AI_LOD_DIST` | 22.0 | Distancia de LOD de IA |
| `BASE_SPAWN_INTERVAL` | 1.05 | Intervalo base |
| `MIN_NORMAL_INTERVAL` | 0.22 | Intervalo mínimo |
| `HP_SCALE_PER_MIN` | 0.42 | Escalado de HP por minuto |
| `DMG_SCALE_PER_MIN` | 0.18 | Escalado de daño por minuto |
| `ENDGAME_START_TIME` | 900 | Inicio del enjambre final (15 min) |
| `ENDGAME_EXP_BASE` | 1.045 | Crecimiento exponencial final |
| `ENDGAME_SPAWN_BURST` | 4 | Ráfaga de spawn final |

### `BOSS_SCHEDULE`

| Tiempo | ID | HP | Daño | Velocidad | Recompensa |
|---|---|---|---|---|---|
| 180 s | `boss_butcher` | 850 | 26 | 4.3 | 12 |
| 360 s | `boss_siren` | 1650 | 32 | 4.6 | 18 |
| 540 s | `boss_furnace` | 2800 | 38 | 4.1 | 25 |
| 720 s | `boss_apostle` | 4200 | 45 | 5.0 | 35 |
| 900 s | `boss_warden` | 6500 | 55 | 5.4 | 50 |

- `WAVES.SCHEDULE[].bossId` usa estos mismos IDs.
- `CONFIG.BOSS_SCHEDULE` reexporta esta lista.
- No dupliques un jefe con estadísticas distintas entre modos sin revisar ambos consumidores.

## Verificación de Balance

- [ ] La primera oleada no tiene timer y `[F]` arranca.
- [ ] La oleada 12 se alcanza y la victoria se dispara una sola vez.
- [ ] Los eventos aparecen tras 3, 6 y 9; duran 120 s y recompensan 30.
- [ ] Una ruta llega a nivel 4; las otras se bloquean al pasar de nivel 2.
- [ ] La venta devuelve el 50% redondeado hacia abajo.
- [ ] Sin chatarra, la compra falla con sonido de error.
- [ ] En co-op, Host y Cliente usan la misma config y la economía cuadra.
- [ ] Ningún valor produce `NaN`, negativos o divisiones por cero.
