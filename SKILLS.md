# Skills del Proyecto — Traces of Rust

Índice de las skills operativas del proyecto. La fuente de verdad es `.claude/skills/<nombre>/SKILL.md`; `.agent/skills/` mantiene una copia espejo idéntica.

## Estándar de las Skills

Cada skill sigue el mismo contrato:

- **Frontmatter YAML** con `name` y `description` entre comillas.
- **`SKILL.md` conciso** con `Overview`, `When to Use`, `When Not to Use`, `Mandatory Workflow`, reglas, `Validation Ladder` y `Output Expectations`.
- **Divulgación progresiva:** los detalles extensos viven en `references/` y se cargan solo cuando la tarea los necesita.
- **Scripts deterministas** en `scripts/` para comprobaciones mecánicas, sin dependencias npm.
- **Condición de parada:** pedir solo decisiones de producto; inferir el resto del repositorio y declarar suposiciones.
- **Validación por niveles:** estático → mecánico → runtime → integración, reportando el nivel máximo alcanzado.
- **Validación estructural:** `npm run validate:skills` comprueba frontmatter, secciones, referencias, scripts y espejo `.agent`.
- **Alcance:** son skills internas del repositorio; no se versionan ni se empaquetan como marketplace.

## Catálogo

| Skill | Cuándo usarla | Referencias | Script |
|---|---|---|---|
| `netcode-audit` | Enemigos, armas, torretas, pickups, economía, eventos o cualquier mecánica P2P. | `packet-contract`, `authority-lifecycle` | `audit-netcode.mjs` |
| `procedural-3d-entity` | Modelos 3D, torretas, estructuras, props, sprites y memoria de GPU. | `entity-anatomy`, `textures-and-memory` | — |
| `defense-map-authoring` | Mapas de Tower Defense, rutas, compuertas, miniaturas, récords y online. | `map-schema`, `route-and-online` | `audit-maps.mjs` |
| `game-balance-tuning` | Torretas, mejoras, oleadas, economía, colocación, eventos y jefes. | `turret-effects`, `waves-economy-survival` | `audit-config.mjs` |
| `hud-ui-panel` | HUD, overlays, menús, modales, iconos y persistencia de ajustes. | `overlay-and-hud`, `persistence-and-audio` | `audit-dom.mjs` |
| `playable-character-content` | Operadores: catálogo, retratos, temas, armas, `statMods` y réplica online. | `character-pipeline`, `stats-and-online` | — |
| `procedural-sfx` | WebAudio, efectos, UI sonora, drones y ajustes de audio. | `webaudio-patterns`, `sound-catalog` | `audit-audio.mjs` |
| `electron-steam-bridge` | Electron/Steamworks: IPC, preload, ventana, fullscreen, Overlay, P2P y build. | `ipc-and-steam`, `window-packaging` | — |

## Scripts de Auditoría

```bash
node .claude/skills/netcode-audit/scripts/audit-netcode.mjs
node .claude/skills/defense-map-authoring/scripts/audit-maps.mjs
node .claude/skills/game-balance-tuning/scripts/audit-config.mjs
node .claude/skills/hud-ui-panel/scripts/audit-dom.mjs
node .claude/skills/procedural-sfx/scripts/audit-audio.mjs
```

Todos aceptan `--json` para integración con otras herramientas y salen con código 1 si hay errores.

## Validación Estructural

```bash
npm run validate:skills
```

Comprueba:

- `name` coincide con la carpeta y `description` va entre comillas y bajo 1024 caracteres.
- Secciones obligatorias: `Overview`, `When to Use`, `When Not to Use`, `Mandatory Workflow`, `Validation Ladder`, `Output Expectations`, `References`.
- `SKILL.md` bajo 300 líneas y sin rutas `../`.
- Toda referencia y script mencionado existe.
- No hay referencias ni scripts huérfanos.
- `.agent/skills` es idéntico a `.claude/skills`.

## Casos de Humo

Prueba manual mínima al modificar una skill. Cada caso debe pasar sin regresiones.

| Skill | Escenario | Criterio de pase |
|---|---|---|
| `netcode-audit` | Añadir un pickup replicado | Spawn solo en Host, `netId`, paquete reliable y snapshot de late-join |
| `procedural-3d-entity` | Añadir una pieza visual de mejora | Pieza en `modelRoot`/`visualParts`, `visual` asociado y `destroy()` limpio |
| `defense-map-authoring` | Añadir un mapa Normal | 18 mapas, referencias `pathId` válidas y `audit-maps` sin errores |
| `game-balance-tuning` | Añadir un efecto de mejora | `case` en `recomputeStats`, consumidor real y `audit-config` sin errores |
| `hud-ui-panel` | Añadir un overlay de pausa | `.overlay hidden`, layout por modo, pointer lock y `audit-dom` sin errores |
| `playable-character-content` | Añadir un operador con pasiva | Tema propio, `statMods` consumidos y réplica online correcta |
| `procedural-sfx` | Añadir un sonido de UI | Método en `AudioSys`, volumen respetado, muteo y `audit-audio` sin errores |
| `electron-steam-bridge` | Añadir un método IPC | Main + preload + renderer, feature detection y prueba en navegador |

## Cómo se Cargan

- Claude Code descubre automáticamente `.claude/skills/*/SKILL.md` por el campo `description`.
- Si una tarea coincide, se carga el `SKILL.md`; las referencias se leen solo cuando hacen falta.
- Al modificar una skill, replica el cambio en `.agent/skills/` y ejecuta `npm run validate:skills`.
- No añadas versionado, manifiestos multiagente ni instaladores salvo que las skills vayan a distribuirse fuera del repo.

## Mantenimiento

- No dupliques en `SKILL.md` lo que ya vive en una referencia.
- Si cambias un símbolo del código, actualiza la referencia que lo menciona.
- Si añades un script, pruébalo contra el estado actual del repo antes de documentarlo.
- Mantén las descripciones en tercera persona, con verbos de acción y disparadores concretos.
