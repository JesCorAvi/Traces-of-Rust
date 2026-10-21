# Patrones WebAudio

## `AudioSys`

`js/audio.js` exporta un singleton con:

```js
{
  ctx, humOsc, humGain,
  masterVol: 0.85, sfxVol: 0.9, ambVol: 0.8, muted: false,
  isEndgameActive: false
}
```

### `init()`

- Crea `AudioContext` si no existe.
- Reanuda el contexto si está suspendido.
- Crea el drone ambiental (sawtooth 56 Hz → lowpass 155 Hz).
- Debe ejecutarse tras un gesto de usuario.

### `play(freq, dur, type, vol)`

```js
AudioSys.play(320, 0.09, 'square', 0.045);
```

- Ganancia efectiva: `vol * masterVol * sfxVol`.
- Si `muted` o la ganancia es ≤ 0.0005, no crea nodos.
- Frecuencia: `freq` → `max(26, freq * 0.3)` con rampa exponencial.
- Ganancia: `effectiveVol` → `0.0001`.
- El oscilador se detiene en `now + dur`.

### Mezcla

- One-shots: `masterVol * sfxVol`.
- Drone: `masterVol * ambVol` con base 0.024 (0.055 en endgame).
- Muteo: `muted` pone la ganancia del drone a 0 y bloquea one-shots.

## One-Shot Seguro

```js
playMiImpacto() {
  if (!this.ctx || this.muted) return;
  this.play(180, 0.08, 'square', 0.05);
}
```

Reglas:

- No crees un `AudioContext` por llamada.
- No conectes a `ctx.destination` directamente.
- No uses `exponentialRampToValueAtTime(0, ...)`.
- No dejes osciladores sin `stop()`.
- No llames a `play()` desde un bucle por frame sin cooldown.

## Secuencia Corta

```js
playMiAlarma() {
  if (!this.ctx || this.muted) return;
  this.play(880, 0.12, 'square', 0.08);
  setTimeout(() => this.play(580, 0.12, 'square', 0.08), 110);
}
```

- Guarda los timers si la secuencia puede quedar huérfana al cambiar de modo.
- No anides secuencias largas sin un método dedicado.

## Nodo Largo / Drone

Patrón de `startPlayerDownHum`:

```js
startMiHum() {
  if (!this.ctx || this.muted || this.miHumGain) return;
  try {
    this.miOsc = this.ctx.createOscillator();
    this.miGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 95;
    this.miOsc.type = 'sawtooth';
    this.miOsc.frequency.setValueAtTime(44, this.ctx.currentTime);
    this.miGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.miGain.gain.linearRampToValueAtTime(0.09 * this.masterVol * this.sfxVol, this.ctx.currentTime + 0.3);
    this.miOsc.connect(filter);
    filter.connect(this.miGain);
    this.miGain.connect(this.ctx.destination);
    this.miOsc.start();
  } catch (e) {
    console.warn('[Audio] Error al iniciar hum:', e);
  }
}
```

- Guarda referencias (`osc`, `gain`) para poder parar.
- En `stop`, rampa a 0.0001, `osc.stop(now + 0.22)` y limpia referencias tras el stop.
- Si el contexto se suspende, no asumas que el nodo sigue vivo.

## Ajustes

`gameSettings` usa 0–100. `applySettings` espera 0–1; usa el helper que hace la conversión y el clamp:

```js
AudioSys.applyGameSettings(gameSettings);
```

`js/main.js` lo llama al arrancar. Si añades un slider o tocas el muteo, vuelve a llamarlo al cambiar el ajuste. Para valores ya normalizados puedes usar la API de bajo nivel:

```js
AudioSys.applySettings({
  masterVol: gameSettings.masterVol / 100,
  sfxVol: gameSettings.sfxVol / 100,
  ambVol: gameSettings.ambVol / 100,
  muted: gameSettings.muted
});
```

## Errores Frecuentes

- `AudioContext was not allowed to start`: falta gesto de usuario.
- `exponentialRampToValueAtTime` con 0: excepción.
- Sonido inaudible: `masterVol`/`sfxVol` a 0 o contexto suspendido.
- Drone que sigue sonando al volver al menú: falta `setEndgameDrone(false)` o stop.
- Nodos acumulados: `osc.stop()` no llamado o loop por frame.
- Audio duplicado en co-op: el Cliente reproduce FX locales además del `ATTACK` remoto.
- Slider que no cambia nada: `applyGameSettings` no invocado tras el cambio.
