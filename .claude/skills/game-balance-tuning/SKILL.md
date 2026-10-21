---
name: game-balance-tuning
description: "Ajusta y valida el balance data-driven de torretas, mejoras, oleadas, economía, colocación, eventos y jefes. Úsala al cambiar números o reglas de juego y antes de tocar lógica de combate."
---

# Game Balance Tuning

## Overview

Mantiene el balance de **Traces of Rust** en los módulos de configuración, no disperso por la lógica. El resultado esperado es un cambio medible, coherente entre dificultades, válido en solitario y en co-op, y sin efectos que el motor ignore en silencio.

## When to Use

- Cambiar daño, cadencia, alcance, coste, HP, vidas, chatarra o escalado.
- Añadir o modificar una ruta de mejora, un efecto, un evento o un jefe.
- Ajustar la curva de 12 oleadas, los descansos o el mini-modo de eventos.
- Revisar por qué una mejora "no hace nada" o un jefe no aparece.

## When Not to Use

- Añadir una torreta o un modelo nuevo: usa `procedural-3d-entity` y después vuelve aquí para las estadísticas.
- Cambiar el formato de los paquetes de red: usa `netcode-audit`.
- Cambiar el mapa, sus rutas o sus compuertas: usa `defense-map-authoring`.
- Cambiar el HUD o la tienda: usa `hud-ui-panel`.

## Mandatory Workflow

1. **Define el objetivo medible.** "Reducir el tiempo de matar de la oleada 6" es válido; "que sea más divertido" no.
2. **Localiza la capa correcta.** Usa la tabla de fuentes. No metas números en `js/defense/*` si pertenecen a config.
3. **Comprueba el esquema.** Para torretas, lee `references/turret-effects.md`; para oleadas/economía, `references/waves-economy-survival.md`.
4. **Edita solo la configuración.** Mantén la estructura de 3 rutas × 4 niveles y las claves de `effects` reconocidas.
5. **Ejecuta la auditoría.** `node .claude/skills/game-balance-tuning/scripts/audit-config.mjs`.
6. **Valida en juego.** Una partida no basta: comprueba la oleada afectada, la compra/mejora y el co-op si toca economía.

**Condición de parada:** si el objetivo exige una decisión de diseño (subir dificultad global vs. un solo jefe), propone la opción menos invasiva y declara la suposición. No preguntes por valores que ya existen en la configuración.

## Config Source Table

| Sistema | Archivo | Export |
|---|---|---|
| Torretas y mejoras | `js/config/coreDefense/turrets.js` | `TURRETS`, `TURRET_UPGRADE_RULES` |
| Oleadas y eventos | `js/config/coreDefense/waves.js` | `WAVES` |
| Economía | `js/config/coreDefense/economy.js` | `SCRAP` |
| Colocación | `js/config/coreDefense/placement.js` | `PLACEMENT` |
| Núcleo/muerte | `js/config/coreDefense/core.js` | `CORE`, `PLAYER_DEATH_POLICY`, `SPAWN_POINTS` |
| Rutas/objetivos | `js/config/coreDefense/routes.js` | `PATHS`, `TARGETING` |
| Tutorial | `js/config/coreDefense/tutorial.js` | `TUTORIAL` |
| Supervivencia/jefes | `js/config/modesConfig.js` | `MODES_CONFIG.SURVIVAL` |
| Agregado | `js/config/coreDefenseConfig.js`, `js/config.js` | `CORE_DEFENSE_CONFIG`, `CONFIG` |

## Decision Table

| Quieres cambiar… | Toca… | Verifica… |
|---|---|---|
| Daño/cadencia/alcance de torreta | `TURRETS[].base` | Tiempo de matar de la oleada objetivo |
| Comportamiento de mejora | `paths[].upgrades[].effects` o `special` | Clave en `recomputeStats` y consumidor real |
| Coste/progresión | `cost` y `TURRET_UPGRADE_RULES` | Venta al 50%, bloqueo de tercera ruta |
| HP/cantidad/ritmo de oleada | `WAVES.SCHEDULE` y escalado | 12 oleadas, eventos tras 3/6/9 |
| Recompensas | `SCRAP` | Economía 50/50 online |
| Dificultad de colocación | `PLACEMENT` | Mapas existentes siguen siendo jugables |
| Jefes de Supervivencia | `MODES_CONFIG.SURVIVAL` | IDs usados por `WAVES.SCHEDULE` |

## Non-Negotiable Rules

- **3 rutas × 4 niveles** por torreta; `freeTier: 2`, `specializedTier: 3`, `sellRefund: 0.5`.
- **Solo una ruta** puede pasar de nivel 2; el bloqueo lo aplica `getUpgradeState`.
- **Efectos reconocidos:** cualquier clave fuera del `switch` de `recomputeStats` se ignora en silencio. Añade el `case` antes de usarla.
- **`special` y `visual` necesitan consumidor:** un string sin lógica o sin `visualParts` no hace nada.
- **Primera oleada sin límite de tiempo:** el jugador explora hasta `[F]`.
- **12 oleadas, eventos cada 3:** no cambies `totalWavesForVictory` sin revisar HUD, victoria y red.
- **Chatarra inicial 10** en todas las dificultades.
- **45% de daño del jugador en ruta:** las torretas deben seguir siendo la fuente principal.
- **Economía online:** toda ganancia pasa por `MultiplayerSync.handleScrapIncome`; nunca acredites chatarra directamente en el Cliente.
- **Sin dependencias nuevas** para ajustar números.

## Validation Ladder

- **Nivel 0 — Estático:** `audit-config.mjs` sin errores; ninguna clave de efecto desconocida.
- **Nivel 1 — Compra/mejora:** una torreta sube a nivel 4 en una ruta; las otras quedan bloqueadas al pasar de nivel 2; la venta devuelve el 50%.
- **Nivel 2 — Oleada afectada:** la curva de HP/daño/velocidad se comporta como se espera; no hay `NaN`.
- **Nivel 3 — Partida completa:** 12 oleadas, eventos tras 3/6/9, victoria/derrota y recompensas.
- **Nivel 4 — Co-op:** Host y Cliente con la misma config; economía 50/50 y jefes/eventos sincronizados.

**Reporta el nivel alcanzado y el escenario concreto probado** (por ejemplo, "oleada 6 en Normal, no se probó Difícil").

## Output Expectations

- Objetivo y suposición de diseño.
- Archivos y constantes modificadas, con valores antes/después.
- Resultado de `audit-config.mjs`.
- Niveles de validación alcanzados y riesgos de balance pendientes.

## References

- `references/turret-effects.md` — esquema de torreta, reglas BTD6 y catálogo completo de `effects`.
- `references/waves-economy-survival.md` — oleadas, eventos, economía, colocación, Supervivencia y jefes.

## Related Skills

- `procedural-3d-entity` — modelo y piezas visuales de la torreta.
- `netcode-audit` — efectos de red de la economía y los eventos.
- `defense-map-authoring` — vidas, chatarra y rutas del mapa.
- `hud-ui-panel` — presentación de costes, récords y avisos.
