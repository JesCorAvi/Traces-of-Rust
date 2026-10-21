# Catálogo de Sonidos

Reutiliza estos métodos antes de crear uno nuevo. Todos respetan `muted` y la mezcla.

## UI

| Método | Carácter | Uso típico |
|---|---|---|
| `playUIClick()` | Clic metálico seco | Hover, tarjetas, botones suaves |
| `playUISelect()` | Interruptor pesado | Confirmar, abrir panel, comprar |
| `playUIError()` | Zumbido grave | Acción rechazada, chatarra insuficiente |
| `playPause()` | Relé mecánico | Pausa/reanudar |
| `playReroll()` | Secuencia de tres tonos | Reroll de cartas |

## Combate y atmósfera

| Método | Carácter | Uso típico |
|---|---|---|
| `playBossHorn()` | Cuerno grave de tres tonos | Aparición de jefe, fase crítica |
| `playScare()` | Disonancia ascendente | Sustos, eventos |
| `playIndustrialSiren()` | Sirena con barrido y filtro | Eventos, alertas críticas |
| `setEndgameDrone(active)` | Cambia el drone ambiental a 38 Hz | Fase 3 / enjambre final |

## Jugador

| Método | Carácter | Uso típico |
|---|---|---|
| `playPlayerDowned()` | Impacto grave descendente | Jugador cae a 0 HP |
| `startPlayerDownHum()` | Hum continuo de reconstrucción | Durante los 5 s de espera |
| `stopPlayerDownHum()` | Detiene el hum | Al revivir o salir |
| `playPlayerRevived()` | Barrido ascendente | Reconstrucción completada |
| `playTacticalAlarm()` | Alarma de tres pulsos | Compañero abatido en co-op |

## Genérico

| Método | Uso |
|---|---|
| `play(freq, dur, type, vol)` | Cualquier one-shot |
| `applyGameSettings(settings)` | Sincronizar `gameSettings` 0–100 → mezcla 0–1 |
| `applySettings(settings)` | Sincronizar volúmenes/muteo ya normalizados |
| `updateDroneVolume()` | Recalcular ganancia del drone |
| `init()` | Crear contexto y drone |

## Dónde se Usan

- `js/core/gameFlow.js`: UI, pausa, inicio.
- `js/ui/*`: apertura/cierre de paneles y selección.
- `js/gameplay/levelUp.js`: selección y reroll.
- `js/gameplay/combatRuntime.js`: impactos y jefe.
- `js/gameplay/pickups.js`: recogida.
- `js/player/playerController.js` y `js/combat/weapons/*`: disparos.
- `js/defense/*`: torretas, núcleo, oleadas, eventos.
- `js/modes/*`: jefes y endgame.
- `js/main.js`: muerte y reconstrucción del jugador.

## Cuándo Crear un Método Nuevo

- El sonido se usa en 2+ sitios.
- Requiere varios osciladores, filtros o una envolvente compleja.
- Necesita un nombre de dominio claro (`playCoreMeltdown`, `playTurretOverheat`).

No crees un método para un único `play()` de dos líneas; usa el genérico en el call site.

## Mapa de Frecuencias

Los sonidos existentes usan mayoritariamente:

- Graves industriales: 38–120 Hz.
- Cuerpo de impacto: 140–320 Hz.
- Avisos/UI: 380–880 Hz.
- Tono agudo ocasional: ~920 Hz.

Mantén el volumen relativo entre 0.02 y 0.16; los casos más fuertes llegan a 0.2.
