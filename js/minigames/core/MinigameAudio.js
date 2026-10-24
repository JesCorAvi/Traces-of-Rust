// Audio de minijuego: SFX vía AssetFactory y una capa musical procedural que
// acelera al final de cada fase. Sin AudioContext nuevos: usa el grafo de AudioSys.
// Exports: MinigameAudio.

import { AudioSys } from '../../audio.js';
import { AssetFactory } from '../assets/AssetFactory.js';
import { clamp } from './Draw.js';

const PATTERN = [
  { kick: true, marimba: 261.63 },
  { shaker: true },
  { marimba: 329.63 },
  { shaker: true, rim: true },
  { kick: true, marimba: 392.0 },
  { shaker: true },
  { marimba: 440.0 },
  { shaker: true, rim: true }
];

export class MinigameAudio {
  constructor() {
    this._timer = null;
    this._running = false;
    this._tempo = 96;
    this._progress = 0;
    this._step = 0;
    this._prevMenuFilter = null;
    this._masterVolume = 0.82;
  }

  play(name, options = {}) {
    return AssetFactory.playSound(name, options);
  }

  countdown(step) {
    if (step > 0) {
      this.play('countdown', { rate: 1 + (3 - Math.min(3, step)) * 0.06 });
    } else {
      this.play('countdownGo');
    }
  }

  startPhase(tempo = 96) {
    this.stopPhase(false);
    this._tempo = Math.max(60, Math.min(180, Number(tempo) || 96));
    this._progress = 0;
    this._step = 0;
    this._running = true;
    if (!AudioSys.ctx) AssetFactory.unlockAudio();
    this._prevMenuFilter = AudioSys.menuFiltered;
    if (AudioSys.ctx) AudioSys.setMenuFilter(true);
    this._scheduleNext(0.1);
  }

  setProgress(value) {
    this._progress = clamp(value);
  }

  setIntensity(value) {
    this._masterVolume = Math.max(0.15, Math.min(1, Number(value) || 0.82));
  }

  _tempoCurve() {
    // Mantiene el pulso estable y acelera en el último 40% de la fase.
    const t = clamp((this._progress - 0.6) / 0.4);
    return t * t * (3 - 2 * t);
  }

  _scheduleNext(delaySeconds = null) {
    if (!this._running) return;
    if (this._timer !== null) clearTimeout(this._timer);
    const bpm = this._tempo * (1 + 0.38 * this._tempoCurve());
    const interval = delaySeconds !== null ? delaySeconds : 60 / Math.max(40, bpm) / 2;
    this._timer = setTimeout(() => this._tick(), Math.max(40, interval * 1000));
  }

  _tick() {
    this._timer = null;
    if (!this._running) return;
    if (typeof document !== 'undefined' && document.hidden) {
      this._scheduleNext(0.15);
      return;
    }

    const step = PATTERN[this._step % PATTERN.length];
    const volume = this._masterVolume;
    if (step.kick) this.play('musicKick', { volume });
    if (step.shaker) this.play('musicShaker', { volume: volume * 0.85 });
    if (step.rim) this.play('musicRim', { volume: volume * 0.8 });
    if (step.marimba) {
      this.play('musicMarimba', {
        rate: step.marimba / 440,
        volume: volume * 0.92
      });
    }

    this._step = (this._step + 1) % PATTERN.length;
    const bpm = this._tempo * (1 + 0.38 * this._tempoCurve());
    const interval = 60 / Math.max(40, bpm) / 2;
    this._scheduleNext(interval);
  }

  combo(level = 3) {
    this.play('combo', {
      rate: 1 + Math.min(0.38, Math.max(0, level) * 0.035),
      volume: 0.92
    });
  }

  phaseComplete(accuracy = 0) {
    this.stopPhase();
    if (accuracy >= 0.65) {
      this.play('phaseClear');
    } else {
      this.play('fail');
    }
  }

  result(stars = 1) {
    this.play('resultFanfare', { volume: 0.88 });
    if (stars >= 2) {
      this.play('star', { delay: 0.35, volume: 0.8 });
    }
    if (stars >= 3) {
      this.play('star', { delay: 0.55, rate: 1.12, volume: 0.7 });
    }
  }

  stopPhase(restoreFilter = true) {
    this._running = false;
    if (this._timer !== null) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    if (restoreFilter && this._prevMenuFilter !== null && AudioSys.ctx) {
      AudioSys.setMenuFilter(this._prevMenuFilter);
    }
    this._prevMenuFilter = null;
  }

  dispose() {
    this.stopPhase();
  }
}
