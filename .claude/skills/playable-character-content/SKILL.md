---
name: playable-character-content
description: "Añade y modifica operadores jugables: catálogo, retratos, temas 8-direcciones, armas, `statMods`, selector y réplica online. Úsala al crear un personaje o cambiar su pasiva/estadísticas."
---

# Playable Character Content

## Overview

Produce un operador jugable completo y consistente: entrada en `CHARACTERS`, tema visual propio, retrato procedural, arma inicial válida, pasiva implementada de verdad y réplica correcta en co-op. El resultado no debe caer silenciosamente en Otto ni mostrar una pasiva que el motor ignora.

## When to Use

- Añadir un operador nuevo al selector.
- Cambiar el arma, el rol, la pasiva o los `statMods` de un operador.
- Cambiar el retrato, la paleta o el tema 8-direcciones de un personaje.
- Depurar un personaje que se ve como Otto o cuya pasiva no tiene efecto.

## When Not to Use

- Añadir un arma nueva al juego: primero crea el módulo en `js/combat/weapons/`, luego vuelve aquí.
- Cambiar el selector como componente de UI: usa `hud-ui-panel`.
- Cambiar el modelo 3D de una torreta: usa `procedural-3d-entity`.
- Ajustar el daño global de las armas: usa `game-balance-tuning`.

## Mandatory Workflow

1. **Define la identidad.** ID estable, nombre, rol, arma y pasiva. La pasiva debe describir un efecto implementable.
2. **Elige el arma.** Debe existir en el runtime y en el render de armas. Si no existe, crea el arma antes.
3. **Añade la entrada.** `CHARACTERS` en `js/config/charactersConfig.js`, al final para conservar el orden del selector.
4. **Añade el tema.** `CHARACTER_THEMES` en `js/sprites/player/body.js`; sin él, el personaje se dibuja como Otto.
5. **Implementa la pasiva.** Usa una clave genérica de `modifiers.js` o añade una clave específica y consúmela en el arma. No dejes `statMods` decorativos.
6. **Valida.** Ejecuta `audit-characters.mjs`, luego selector, tarjeta, partida, impacto medible de la pasiva y co-op.

**Condición de parada:** si la pasiva requiere un comportamiento nuevo en un arma, implementa la clave y su consumo; no la documentes como si funcionara. Si el efecto exige una decisión de diseño, propone una opción medible y declara la suposición.

## Decision Table

| Necesidad | Dónde |
|---|---|
| ID, nombre, rol, arma, pasiva, colores | `js/config/charactersConfig.js` |
| Tema visual 8-direcciones | `js/sprites/player/body.js` → `CHARACTER_THEMES` |
| Retrato | `js/sprites/player/portraits.js` (se genera del tema) |
| Hoja de sprites con arma | `getPlayerLoadoutSheet(skills, activeHand, charId)` |
| Selector y tarjeta | `js/ui/characterSelectorModal.js` |
| Estadísticas base | `js/gameplay/modifiers.js` y `js/core/gameFlow.js` |
| Arma específica | `js/combat/weapons/*.js` o `js/player/playerController.js` |
| Réplica online | `js/online/multiplayerSync.js` (`HELLO`, `POS`, `RemotePlayer`) |

## Non-Negotiable Rules

- **ID estable y único:** se guarda en `traces_selected_character` y viaja a los peers.
- **Arma válida:** `slash`, `shotgun`, `flamethrower`, `aura`, `mines`, `harpoon`, `orbital` o `bolt`.
- **Icono válido:** debe existir en el registro de `renderSpriteIconHTML`.
- **Tema obligatorio:** sin `CHARACTER_THEMES[id]`, el dibujo cae a Otto sin avisar.
- **Pasiva real:** `passive`/`passiveDesc` son texto; el efecto debe estar en `statMods` o en código.
- **Claves genéricas primero:** `moveSpeedMult`, `atkSpeedMult`, `critChanceBonus`, `areaMult`, `regenPerSec`, `bonusProjectiles`, `dmgMult`, `damageReduction`, `knockbackMult`, `baseHpBonus`.
- **Claves específicas requieren consumidor:** hoy `slashDmgMult`, `projectileDmgMult`, `fireDmgMult`, `auraSlowBonus`, `explosiveDmgMult`, `harpoonDmgMult`, `orbitalDmgMult`, `boltChainsExtra`, `extraOrbitals` y `rangeMult` no se consumen.
- **Sin valores redundantes:** no uses `dmgMult` genérico si la pasiva debe afectar solo a un arma.
- **Online:** Host y Cliente deben compartir catálogo; un ID desconocido cae a Otto.

## Validation Ladder

- **Nivel 0 — Estático:** ejecuta `audit-characters.mjs`; ID único, arma/icono válidos, tema presente, claves de `statMods` consumidas o marcadas como pendientes.
- **Nivel 1 — Selector:** tarjeta, retrato, rol, arma y pasiva correctos; selección con ratón y teclado.
- **Nivel 2 — Partida:** tema propio en 8 direcciones, arma inicial correcta y HUD coherente.
- **Nivel 3 — Pasiva:** efecto medible (HP, daño, cadencia, área, regeneración, etc.).
- **Nivel 4 — Co-op:** el peer remoto ve el operador correcto; el daño reportado incluye los mods locales.

**Reporta el nivel alcanzado y qué pasiva o flujo online no se pudo verificar.**

## Output Expectations

- Identidad del operador y arma elegida.
- Archivos tocados y claves de `statMods` implementadas.
- Evidencia del efecto de la pasiva (valor antes/después).
- Resultado de `audit-characters.mjs`.
- Nivel de validación alcanzado y riesgos.

## References

- `references/character-pipeline.md` — catálogo, tema, retrato, sprites, selector y orden de render.
- `references/stats-and-online.md` — claves de `statMods`, implementación de pasivas y réplica P2P.
- `scripts/audit-characters.mjs` — auditoría estática de catálogo, temas, armas, iconos y statMods.

## Related Skills

- `procedural-3d-entity` — sprites, temas y retratos.
- `game-balance-tuning` — daño, cadencia y estadísticas.
- `hud-ui-panel` — selector y tarjeta de operador.
- `netcode-audit` — `charId` y `RemotePlayer`.
