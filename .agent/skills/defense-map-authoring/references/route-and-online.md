# Trazado, Miniaturas y Online

## Trazado de rutas

La spline es Catmull-Rom con tensión 0.28. Consecuencias prácticas:

- Los puntos intermedios **no son waypoints exactos**: la curva los suaviza. Si necesitas un paso por un punto concreto, añade puntos cercanos que fijen la dirección.
- Un cambio brusco de dirección entre tres puntos puede generar un bucle o una curva que se salga del mapa. Comprueba la ruta en la miniatura y en partida.
- La altura se muestrea del terreno real y se suaviza; no hace falta poner `y` salvo que quieras forzar una cota.
- El primer punto se usa para la compuerta y el último para la esclusa. Si mueves el primer punto, mueves la compuerta.

### Reglas de diseño

- **Área jugable:** referencia ±44 en X/Z. No salgas del recinto construido.
- **Longitud:** una ruta demasiado corta deja pocas ventanas de tiro. En Fácil, prioriza bucles y recorrido largo.
- **Separación:** respeta `PLACEMENT.minPathDistance` (2.5 m) en zonas donde se pueda construir.
- **Compuertas:** deja `PLACEMENT.spawnClearance` (4 m) libre alrededor.
- **Convergencia Normal:** los carriles deben acercarse a ~7.6 m antes de la salida para premiar torretas de área.
- **Difícil:** mantén los flancos separados; evita que una sola torreta cubra ambos carriles.
- **Sin cruces ambiguos:** si dos rutas se cruzan, que sea visualmente intencionado (puente/pasarela) y no un punto donde las torretas bloqueen ambas.

## Miniaturas

`js/defense/routeThumbnailRenderer.js` dibuja la miniatura 2D procedural a partir de:

- `controlPoints` de cada ruta,
- `spawnPoints`/`exitPoints`,
- colores de ruta y balizas.

No hay que generar ni guardar imágenes. Si la miniatura no refleja la ruta, revisa el catálogo, no el renderer.

## Selector y persistencia

`js/ui/mapSelectorModal.js`:

- Pestañas `facil`/`normal`/`dificil`.
- Rejilla de 6 tarjetas por dificultad.
- Panel de detalle con nombre, badge, descripción y chips.
- Medallas desde `traces_td_map_records`.

Claves:

| Clave | Contenido |
|---|---|
| `traces_td_selected_map` | ID del mapa seleccionado |
| `traces_td_difficulty` | `facil`/`normal`/`dificil` |
| `traces_td_map_records` | `{ [mapId]: { completed, bestWave, lastPlayed } }` |

`js/modes/coreDefenseMode.js` → `recordMapProgress(victory, waves)` actualiza el récord al terminar.

## Online

- `MATCH_INFO` incluye `mapId` y `diff`; el Host los impone.
- `js/core/gameFlow.js` y `js/online/steamLobbyUI.js` copian esos valores a `localStorage` antes de arrancar.
- El Cliente genera el mapa localmente a partir del mismo `mapId`; no recibe geometría por red.
- **Ambos peers deben tener el mismo catálogo.** Si el Cliente no encuentra el `mapId`, `getMapById` cae al default de la dificultad y la partida diverge.
- Prueba siempre Host + Cliente con el mapa nuevo; no basta con la partida local.

## Checklist de Mapa Nuevo

- [ ] `id` único y estable.
- [ ] Dificultad correcta y 6 mapas en esa dificultad.
- [ ] `entrances`/`exits` coinciden con los arrays.
- [ ] `startingScrap: 10`, `maxLives` según dificultad.
- [ ] Todas las rutas tienen `id`, `name`, `color` y ≥ 2 `controlPoints`.
- [ ] Todos los `pathId` existen.
- [ ] Primer/último punto dentro del recinto.
- [ ] La miniatura muestra rutas y balizas.
- [ ] La partida completa transcurre sin enemigos atascados.
- [ ] Las torretas no bloquean la vía.
- [ ] `DEFAULT_MAP_IDS` actualizado si corresponde.
- [ ] `audit-maps.mjs` sin errores.
- [ ] Online verificado con el mismo build.
