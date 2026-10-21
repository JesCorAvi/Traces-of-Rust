---
name: procedural-sfx
description: "Diseña e integra sonidos sintetizados con WebAudio en `AudioSys`, respetando volumen, muteo y ciclo de vida de nodos. Úsala al añadir efectos, UI sonora, drones o ajustes de audio."
---

# Procedural SFX

## Overview

Produce audio sintetizado en tiempo real para **Traces of Rust** sin archivos externos. El resultado debe respetar la cadena `masterVol`/`sfxVol`/`ambVol`, el muteo, el gesto de usuario que crea el `AudioContext` y el ciclo de vida de osciladores y drones.

## When to Use

- Añadir un efecto de arma, impacto, UI, evento, jefe o estado del jugador.
- Crear o ajustar un drone ambiental o una sirena.
- Corregir sonidos que no respetan el volumen, se solapan o dejan nodos vivos.
- Conectar los ajustes de audio con `gameSettings`.

## When Not to Use

- Crear o modificar sprites/modelos: usa `procedural-3d-entity`.
- Cambiar el HUD que dispara el sonido: usa `hud-ui-panel`.
- Añadir un paquete de red para replicar audio: usa `netcode-audit` (el audio de ataque remoto ya viaja en `ATTACK`).
- Cambiar la lógica de combate: usa `game-balance-tuning`.

## Mandatory Workflow

1. **Clasifica el sonido.** One-shot puntual, secuencia corta, loop/drone o sonido semántico reutilizable.
2. **Busca uno existente.** Revisa `references/sound-catalog.md`; reutiliza antes de duplicar.
3. **Elige el patrón.** `play()` para un one-shot; un método `playX()` para algo reutilizable o con varios nodos.
4. **Implementa con seguridad.** Respeta volúmenes, rampas exponenciales y `stop()`; guarda referencias de nodos largos.
5. **Conecta ajustes si toca.** Si añades o cambias volumen/muteo, sincroniza `gameSettings` con `applyGameSettings`.
6. **Valida.** Ejecuta `audit-audio.mjs` y prueba en partida con muteo, volumen 0 y cambios de modo.

**Condición de parada:** si el diseño sonoro no está definido, usa un sonido existente como referencia y declara la suposición. No preguntes por frecuencias que ya siguen un patrón en `audio.js`.

## Decision Table

| Necesidad | Patrón | Nota |
|---|---|---|
| Clic, impacto, pickup | `AudioSys.play(freq, dur, type, vol)` | Duración corta |
| Varios tonos encadenados | `setTimeout` + varios `play` | Guarda timers si el estado puede terminar |
| Sonido reutilizable | Método `playX()` en `AudioSys` | Evita frecuencias mágicas en call sites |
| Drone/loop | Nodos persistentes + start/stop | Guarda osc/gain y limpia |
| UI estándar | `playUIClick`/`playUISelect`/`playUIError` | Consistencia |
| Evento/jefe | `playIndustrialSiren`/`playBossHorn`/`setEndgameDrone` | Reutiliza atmósfera |
| Jugador abatido | `playPlayerDowned` + hum + `playPlayerRevived` | Ciclo completo |

## Non-Negotiable Rules

- **Cero archivos de audio:** nada de `.mp3`, `.wav`, `.ogg`; todo WebAudio.
- **Sin `AudioContext` nuevos:** usa `AudioSys.ctx`.
- **Sin saltarse la mezcla:** no conectes a `ctx.destination` sin `masterVol`/`sfxVol`.
- **Rampas seguras:** `exponentialRampToValueAtTime` con objetivo `0.0001`, nunca `0`.
- **Nodos cortos:** cada one-shot crea, conecta, arranca y para su oscilador.
- **Nodos largos con referencia:** drones y hum deben poder detenerse.
- **Muteo real:** `muted` corta one-shots y drones.
- **Ajustes coherentes:** `gameSettings` usa 0–100; `applyGameSettings(gameSettings)` convierte a 0–1.
- **Sin sonidos por frame sin throttle:** limita impactos/ticks repetidos.
- **Estado limpio:** al salir de evento/jefe, `setEndgameDrone(false)` y `stopPlayerDownHum()`.

## Validation Ladder

- **Nivel 0 — Estático:** `audit-audio.mjs` sin archivos externos ni volúmenes fuera de rango.
- **Nivel 1 — Gesto:** no hay audio antes de `init()`; tras el primer clic/partida, suena.
- **Nivel 2 — Mezcla:** muteo y volúmenes 0/100 se comportan; no hay clipping evidente.
- **Nivel 3 — Ciclo:** repetir 100 veces no deja nodos; el hum/drone se detiene al salir.
- **Nivel 4 — Integración:** pausa, Alt+Tab, cambio de modo y co-op sin errores de `AudioContext`.

**Reporta el nivel alcanzado y qué escenario de mezcla o ciclo no se pudo probar.**

## Output Expectations

- Sonido(s) añadidos y método elegido.
- Frecuencias/duraciones/volúmenes y por qué.
- Cambios de ajustes o muteo.
- Resultado de `audit-audio.mjs`.
- Niveles de validación alcanzados y riesgos.

## References

- `references/webaudio-patterns.md` — `AudioSys`, one-shots, métodos semánticos, nodos largos y errores.
- `references/sound-catalog.md` — catálogo de sonidos existentes y cuándo reutilizarlos.

## Related Skills

- `hud-ui-panel` — sonidos de interacción.
- `netcode-audit` — `ATTACK` remoto y audio de eventos.
- `procedural-3d-entity` — muzzle flash y feedback visual.
- `game-balance-tuning` — frecuencia de impacts y eventos.
