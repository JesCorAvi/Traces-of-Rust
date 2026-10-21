---
name: procedural-3d-entity
description: "Construye y modifica entidades 3D procedurales (torretas, estructuras, props) y sprites pixel-art sin texturas externas, con jerarquía, materiales y liberación de VRAM correctos. Úsala al tocar modelos, `baseRoot`/`modelRoot`, niveles visuales o `destroy()`."
---

# Procedural 3D Entity

## Overview

Produce entidades visuales coherentes con la estética **dark industrial pixel-art** de **Traces of Rust**, generadas en tiempo de ejecución con Three.js r160 y canvas 2D. El resultado debe verse bien, integrarse con la lógica de juego y liberar geometría, materiales y texturas al destruirse.

## When to Use

- Crear o modificar modelos de torretas, estructuras defensivas, props o geometrías del mundo.
- Añadir piezas visuales por nivel (`visualParts`, `visualKeys`) o efectos de disparo.
- Crear o ajustar sprites procedurales en `js/sprites/*`.
- Corregir fugas de VRAM, filtrado borroso o recursos compartidos mal marcados.

## When Not to Use

- Solo cambias números de daño, alcance o coste: usa `game-balance-tuning`.
- Solo cambias el HUD o un panel: usa `hud-ui-panel`.
- Añades un operador jugable: usa `playable-character-content`.
- El modelo debe replicarse por red: combínala con `netcode-audit`.

## Mandatory Workflow

1. **Clasifica la entidad.** Torreta mecánica, estructura defensiva, prop/geometría del mundo, enemigo billboard o sprite de UI. Cada familia tiene una base distinta.
2. **Localiza el patrón existente.** Reutiliza la clase base y el builder más cercano antes de crear una jerarquía nueva.
3. **Construye la jerarquía.** Separa lo que no gira (`baseRoot`) de lo que apunta (`modelRoot`). Añade piezas con los helpers existentes.
4. **Genera materiales y texturas.** Canvas 2D, paleta compartida, `NearestFilter`, sin `TextureLoader`.
5. **Integra juego y niveles.** Engancha `faceTarget`, disparo, retroceso, muzzle flash y `visualParts` a las mejoras.
6. **Cierra el ciclo de vida y valida.** `destroy()` con `disposeObject3D`, recursos compartidos y ejecuta `audit-entities.mjs`.

**Condición de parada:** si el diseño requiere una decisión artística no deducible (silueta, paleta, tamaño), propone una opción coherente con la clase existente y declara la suposición. No preguntes por detalles que ya están en `spritePalette` o en un modelo hermano.

## Decision Table

| Necesidad | Base o patrón | Referencia |
|---|---|---|
| Torreta con cañón que apunta | `Turret` + `models/base.js` + builder por tipo | `references/entity-anatomy.md` |
| Estructura defensiva fija | `DefensiveStructure` | `js/defense/defensiveStructure.js` |
| Prop/geometría del mundo | `world/geometry.js` y `world/props.js` | `js/world/` |
| Enemigo 2D | `entities/billboard.js` + sprites | `js/entities/`, `js/sprites/entity/` |
| Icono o panel de UI | `js/sprites/ui/` + atlas | `js/spritesheets.js` |
| Textura procedural | Canvas 2D + `CanvasTexture` | `references/textures-and-memory.md` |

## Non-Negotiable Rules

- **Cero texturas externas:** nada de PNG/JPG; todo se dibuja en canvas o se genera por geometría.
- **Pixel-art nítido:** `minFilter = magFilter = THREE.NearestFilter`, `generateMipmaps = false`.
- **Paleta única:** usa `js/sprites/spritePalette.js`; no inventes colores aislados.
- **Recursos compartidos:** marca `userData.sharedGeo = true` y `userData.sharedMat = true` en pools y piezas reutilizadas.
- **Destrucción limpia:** `destroy()` desconecta de la escena y llama a `disposeObject3D`; no dejes texturas ni materiales vivos.
- **Suelo y rutas:** coloca con `worldPhysics.getGroundHeight(x, z)` y verifica que no bloqueas vías (`routeMath`, `PLACEMENT`).
- **Sin billboards flotantes para torretas:** la torreta es un modelo 3D con base anclada y cabezal giratorio.

## Validation Ladder

- **Nivel 0 — Estático:** ejecuta `audit-entities.mjs`; cero texturas externas, NearestFilter, generateMipmaps y disposeObject3D en entidades dinámicas.
- **Nivel 1 — Escena:** el modelo aparece, está anclado al suelo, no parpadea ni tiene caras invertidas.
- **Nivel 2 — Combate:** `faceTarget` apunta, el muzzle flash nace en la boca correcta, el retroceso se reinicia y las mejoras muestran/ocultan piezas.
- **Nivel 3 — Memoria:** construir/destruir 50+ instancias no incrementa `renderer.info.memory` de forma sostenida.
- **Nivel 4 — Integración:** torreta construible/mejorable/vendible y, si aplica, réplica online correcta.

**Reporta el nivel alcanzado y cualquier comprobación visual o de memoria que no se haya podido ejecutar.**

## Output Expectations

- Tipo de entidad y patrón elegido.
- Archivos tocados y jerarquía (`baseRoot`/`modelRoot`, piezas, `visualParts`).
- Texturas/materiales generados y cómo se comparten.
- Resultado de `audit-entities.mjs`.
- Nivel de validación alcanzado, capturas o comprobaciones realizadas y riesgos.

## References

- `references/entity-anatomy.md` — jerarquía de torretas, apuntado, disparo, niveles y builders.
- `references/textures-and-memory.md` — canvas, paleta, filtros, recursos compartidos y `dispose`.
- `scripts/audit-entities.mjs` — auditoría estática de texturas externas, CanvasTexture y disposeObject3D.

## Related Skills

- `procedural-sfx` — sonido del disparo o la mejora.
- `netcode-audit` — torretas y entidades replicadas.
- `game-balance-tuning` — estadísticas y efectos de las mejoras.
- `playable-character-content` — sprites 8-direcciones del jugador.
