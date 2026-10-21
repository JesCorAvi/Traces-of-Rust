# Esquema de `MAP_CATALOG`

Fuente: `js/defense/mapCatalog.js`. Exporta `MAP_CATALOG`, `getMapsByDifficulty`, `getMapById` y `DEFAULT_MAP_IDS`.

## Estructura

```js
export const DEFAULT_MAP_IDS = {
  facil: 'easy_plaza',
  normal: 'norm_twins',
  dificil: 'hard_isolated'
};

export const MAP_CATALOG = {
  easy_plaza: {
    id: 'easy_plaza',
    difficulty: 'facil',
    name: 'Plaza Central',
    badge: 'FÁCIL // BUCLE 360°',
    desc: 'Descripción táctica para el selector.',
    entrances: 1,
    exits: 1,
    startingScrap: 10,
    maxLives: 150,
    routes: {
      path_main: {
        id: 'path_main',
        name: 'Vía Principal',
        color: 0x00e5ff,
        controlPoints: [
          { x: 0, z: -44 },
          { x: 10, z: -38 },
          { x: 0, z: 44 }
        ]
      }
    },
    spawnPoints: [
      { id: 'sp_1', name: 'COMPUERTA NORTE', pathId: 'path_main', color: 0x00e5ff }
    ],
    exitPoints: [
      { id: 'exit_1', name: 'ESCLUSA SUR', pathId: 'path_main', color: 0xff3b16 }
    ]
  }
};
```

## Campos

| Campo | Obligatorio | Regla |
|---|---|---|
| `id` | Sí | Igual a la clave del mapa; estable en el tiempo |
| `difficulty` | Sí | `facil`, `normal` o `dificil` |
| `name` | Sí | Texto visible en el selector |
| `badge` | Sí | Etiqueta corta de dificultad/identidad |
| `desc` | Sí | Descripción táctica de 1–2 frases |
| `entrances` | Sí | Igual a `spawnPoints.length` |
| `exits` | Sí | Igual a `exitPoints.length` |
| `startingScrap` | Sí | Invariante actual: 10 |
| `maxLives` | Sí | 150 / 100 / 75 según dificultad |
| `routes` | Sí | Al menos una ruta; claves = `route.id` |
| `spawnPoints` | Sí | Cada `pathId` debe existir |
| `exitPoints` | Sí | Cada `pathId` debe existir |

### Ruta

| Campo | Regla |
|---|---|
| `id` | Igual a la clave del objeto `routes` |
| `name` | Nombre visible |
| `color` | Color hexadecimal numérico (`0x...`) |
| `controlPoints` | ≥ 2; el primero es la compuerta y el último la esclusa |
| `controlPoints[].x/z` | Dentro del área jugable (referencia actual: ±44) |
| `controlPoints[].y` | Opcional; normalmente se muestrea el terreno |

## Invariantes por dificultad

```text
facil   → 1 entrada, 1 salida, 150 vidas, 10 chatarra, 6 mapas
normal  → 2 entradas, 1 salida, 100 vidas, 10 chatarra, 6 mapas
dificil → 2 entradas, 2 salidas, 75 vidas, 10 chatarra, 6 mapas
```

Total: **18 mapas**. Los prefijos (`easy_`, `norm_`, `hard_`) son convención, no validación funcional; el campo que manda es `difficulty`.

## Cómo se Genera

`js/defense/mapGenerator.js`:

1. `generateProceduralMap(diffKey, worldPhysics, mapId)` busca el mapa en el catálogo y cae al default de la dificultad.
2. Cada ruta se convierte en una spline Catmull-Rom (tensión 0.28) con `Math.max(50, controlPoints.length * 5)` muestras.
3. La altura se muestrea con `worldPhysics.getGroundHeight(x, z, 0, true)` y se suaviza en 3 pasadas.
4. Las compuertas usan el primer waypoint de su `pathId`; las esclusas, el último.
5. El resultado incluye `mapId`, `mapName`, `mapBadge`, `mapDesc`, `difficulty`, `maxLives`, `startingScrap`, `routes`, `spawnPoints`, `exitPoints` y `playerStartPos`.

## Errores de Validación

- Mapa sin `routes` o con `controlPoints` de menos de 2 puntos.
- `pathId` que no existe: la compuerta cae a `(0, 0, -44)` y la esclusa a `(0, 0, 44)`.
- `entrances`/`exits` distintos de los arrays reales: el panel miente.
- `startingScrap` distinto de 10 sin ajustar la economía global.
- `maxLives` distinto del valor de dificultad: rompe la lectura del selector.
- IDs duplicados de mapa, ruta, spawn o exit.
