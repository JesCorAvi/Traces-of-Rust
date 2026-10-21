---
name: defense-map-authoring
description: "Crea, edita y valida mapas del modo Tower Defense a partir de `MAP_CATALOG`: rutas, compuertas, miniaturas, récords y arranque online. Úsala al añadir un mapa, retrazar una ruta o depurar entrada/salida."
---

# Defense Map Authoring

## Overview

Produce mapas **data-driven** para el modo Defensa: una entrada en `MAP_CATALOG` genera la spline 3D sobre el terreno, las compuertas y esclusas, la miniatura 2D, el selector, los récords y el `MATCH_INFO` online. El objetivo es no tocar código de sistema salvo que estés añadiendo una capacidad nueva al formato.

## When to Use

- Añadir, renombrar o eliminar un mapa de cualquiera de las tres dificultades.
- Retrazar una ruta, mover una compuerta o cambiar vidas/chatarra de un mapa.
- Depurar enemigos que nacen mal, se salen del mapa o no llegan a la esclusa.
- Revisar la validez de los 18 mapas antes de un build.

## When Not to Use

- Cambiar el balance global de oleadas o economía: usa `game-balance-tuning`.
- Cambiar la lógica de selección, récords o UI del selector: usa `hud-ui-panel`.
- Sincronizar el mapa entre peers: combínala con `netcode-audit`.
- Crear la geometría física del escenario: usa `procedural-3d-entity`.

## Mandatory Workflow

1. **Clasifica la operación.** Mapa nuevo, retrazado de ruta, ajuste de metadatos o corrección de compuertas.
2. **Lee la referencia correcta.** `references/map-schema.md` para el formato; `references/route-and-online.md` para trazado, miniaturas y online.
3. **Diseña antes de editar.** Fija dificultad, número de entradas/salidas, intención táctica y puntos de control.
4. **Edita solo `js/defense/mapCatalog.js`.** Mantén IDs estables y referencias `pathId` consistentes.
5. **Ejecuta la auditoría mecánica.** `node .claude/skills/defense-map-authoring/scripts/audit-maps.mjs`.
6. **Valida en juego.** Selector, miniatura, arranque, tránsito completo y récord.

**Condición de parada:** si el diseño del mapa exige una decisión de producto (número de rutas, dificultad, identidad visual), propone una opción basada en las invariantes y declara la suposición. No preguntes por coordenadas exactas si ya hay una ruta existente que sirve de patrón.

## Design Decision Table

| Decisión | Fácil | Normal | Difícil |
|---|---|---|---|
| Entradas / salidas | 1 / 1 | 2 / 1 | 2 / 2 |
| Vidas | 150 | 100 | 75 |
| Chatarra inicial | 10 | 10 | 10 |
| Identidad | Bucles largos | Convergencia a ~7.6 m | Flancos independientes |
| Presión | Aprendizaje | Defensa combinada | Cobertura dividida |

- **Ruta nueva:** copia la estructura de un mapa hermano de la misma dificultad.
- **Retrazado:** conserva primer/último punto si la compuerta/esclusa no debe moverse.
- **Ajuste de metadatos:** verifica que `entrances`/`exits` sigan coincidiendo con los arrays.

## Non-Negotiable Rules

- **Fuente única:** coordenadas, nombres, vidas y colores viven en `MAP_CATALOG`; la UI solo los consume.
- **IDs estables:** `id` de mapa y de ruta se persisten y viajan por red. No los renombres sin migración.
- **Referencias válidas:** cada `spawnPoints[].pathId` y `exitPoints[].pathId` debe existir en `routes`.
- **Primer y último waypoint:** definen la compuerta y la esclusa; no los dejes fuera del área jugable.
- **Contadores:** `entrances === spawnPoints.length`, `exits === exitPoints.length`.
- **Chatarra inicial:** 10 en todas las dificultades.
- **Sin assets:** las miniaturas son procedurales; no añadas imágenes.
- **Online:** Host y Cliente deben tener el mismo catálogo. Un `mapId` ausente cae a un default y produce una partida distinta.

## Validation Ladder

- **Nivel 0 — Estático:** ejecuta `audit-maps.mjs`; debe terminar sin errores.
- **Nivel 1 — Selector:** pestaña correcta, tarjeta, miniatura, conteos y récord visible.
- **Nivel 2 — Partida:** los enemigos nacen en la compuerta correcta y salen por la esclusa correcta.
- **Nivel 3 — Torretas:** no se puede construir sobre la vía, compuertas ni salidas; el cuello de botella se comporta como se diseñó.
- **Nivel 4 — Online:** Host y Cliente cargan el mismo `mapId`/`diff` desde `MATCH_INFO`; late-join funciona.

**Reporta el nivel alcanzado y cualquier mapa que no se haya jugado completo.**

## Output Expectations

- Operación realizada (mapa nuevo, retrazado, metadatos o fix).
- Archivos tocados y entradas modificadas.
- Resultado de `audit-maps.mjs` (errores/warnings).
- Niveles de validación alcanzados y riesgos (por ejemplo, "no probado online").

## References

- `references/map-schema.md` — esquema completo, campos e invariantes por dificultad.
- `references/route-and-online.md` — spline, compuertas, miniaturas, persistencia y `MATCH_INFO`.

## Related Skills

- `game-balance-tuning` — vidas, chatarra, oleadas y eventos del mapa.
- `hud-ui-panel` — selector, récords y pantallas.
- `netcode-audit` — mapa y dificultad impuestos por el Host.
- `procedural-3d-entity` — geometría y props del escenario.
