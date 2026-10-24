// Minijuego base: orquesta fases, instrucciones, puntuación, juice y resultado.
// Los juegos concretos heredan y devuelven sus fases desde createPhases().
// Exports: MiniGame.

import { PALETTE } from '../assets/palette.js';
import { clamp, drawSunsetBackdrop, drawVignette } from './Draw.js';
import { ScoreTracker, accuracyLabel, accuracyColor } from './ScoreTracker.js';

const INSTRUCTION_SECONDS = 1.8;
const GO_SECONDS = 0.22;
const PHASE_RESULT_SECONDS = 0.95;

export class MiniGame {
  constructor({ id, title, difficulty = 1, services, options = {} } = {}) {
    if (!services) throw new Error('[MiniGame] Faltan los servicios del runner.');
    this.id = id || 'minigame';
    this.title = title || 'MINIJUEGO';
    this.difficulty = clamp(difficulty, 1, 5);
    this.options = options || {};
    this.services = services;
    this.view = services.view;
    this.input = services.input;
    this.juice = services.juice;
    this.audio = services.audio;
    this.assets = services.assets;

    this.score = new ScoreTracker();
    this.phases = this.createPhases();
    if (!Array.isArray(this.phases) || this.phases.length === 0) {
      throw new Error(`[MiniGame] "${this.id}" no ha definido fases.`);
    }

    this.phaseIndex = -1;
    this.phase = null;
    this.state = 'IDLE';
    this.width = 960;
    this.height = 540;
    this.elapsed = 0;
    this.result = null;
    this.resultTitle = 'MINIJUEGO COMPLETADO';
    this._instructionTime = 0;
    this._lastCountdown = 3;
    this._goTriggered = false;
    this._goTime = 0;
    this._phaseResultTimer = 0;
    this._skipRemaining = false;
    this._finishedNotified = false;

    this.onFinish = options.onFinish || null;
    this.onEnd = options.onEnd || null;
  }

  createPhases() {
    return [];
  }

  init() {
    this.onInit?.();
  }

  start() {
    if (this.state !== 'IDLE') return;
    this.state = 'INSTRUCTION';
    this.elapsed = 0;
    this._beginPhase(0);
  }

  _beginPhase(index) {
    if (index >= this.phases.length) {
      this._finish();
      return;
    }
    this.phaseIndex = index;
    this.phase = this.phases[index];
    this.input.resetStats();
    this.juice.clear();
    this.score.combo = 0;
    this.phase.enter(this);
    this.state = 'INSTRUCTION';
    this._instructionTime = INSTRUCTION_SECONDS;
    this._lastCountdown = 3;
    this._goTriggered = false;
    this._goTime = 0;
    this._skipRemaining = false;

    this.view.setPhaseLabel(`FASE ${index + 1}/${this.phases.length} · ${this.phase.title}`);
    this.view.setHint(this.phase.hint || this.phase.instruction);
    this.view.setProgress(0);
    this.view.setScore(0);
    this.view.setCombo(0);
    this.view.hidePhaseStamp();
    this.view.showInstruction(this.phase, 3);
    this.audio.countdown(3);
  }

  _startPlay() {
    if (this.state !== 'INSTRUCTION') return;
    this.state = 'PLAYING';
    this.input.resetStats();
    this.view.hideInstruction();
    this.view.setHint(this.phase?.hint || '');
    this.audio.startPhase(this.getTempo());
    this.phase?.onStart?.();
  }

  update(dt) {
    const delta = Math.min(0.05, Math.max(0, Number(dt) || 0));
    this.juice.update(delta);
    if (this.state === 'IDLE' || this.state === 'FINISHED' || this.state === 'ENDED') return;

    this.elapsed += delta;
    this.score.update(delta);

    if (this.state === 'INSTRUCTION') {
      if (!this._goTriggered) {
        this._instructionTime -= delta;
        const step = Math.max(0, Math.ceil(this._instructionTime / 0.6));
        if (step !== this._lastCountdown) {
          this._lastCountdown = step;
          if (step > 0) {
            this.view.setCountdown(step);
            this.audio.countdown(step);
          } else {
            this._goTriggered = true;
            this._goTime = GO_SECONDS;
            this.view.setCountdown('¡YA!');
            this.audio.countdown(0);
          }
        }
      } else {
        this._goTime -= delta;
        if (this._goTime <= 0) this._startPlay();
      }
      return;
    }

    if (this.state === 'PLAYING' && this.phase) {
      this.phase.update(delta);
      if (!this.phase.done) {
        this.view.setProgress(this.phase.getProgress());
        this.view.setScore(this.phase.getScore() * 100);
      }
      if (this.phase.done) this._completePhase();
      return;
    }

    if (this.state === 'PHASE_RESULT') {
      this._phaseResultTimer -= delta;
      if (this._phaseResultTimer <= 0) {
        this.view.hidePhaseStamp();
        if (this._skipRemaining || this.phaseIndex + 1 >= this.phases.length) this._finish();
        else this._beginPhase(this.phaseIndex + 1);
      }
    }
  }

  _completePhase() {
    if (!this.phase || this.state !== 'PLAYING') return;
    const phase = this.phase;
    const accuracy = Math.round(clamp(phase.getScore()) * 100) / 100;
    phase.exit();
    // El sello de fase sustituye a los textos flotantes para que el resultado
    // se lea sin solapamientos.
    this.juice.texts.clear();
    this.score.addPhase({
      id: phase.id,
      label: phase.title,
      accuracy,
      weight: phase.weight,
      stats: phase.stats
    });
    this.state = 'PHASE_RESULT';
    this._phaseResultTimer = PHASE_RESULT_SECONDS;
    this._skipRemaining = !!phase.meta?.skipRemaining;
    this.view.setProgress(1);
    this.view.setScore(accuracy * 100);
    this.view.showPhaseStamp({
      label: accuracyLabel(accuracy),
      color: accuracyColor(accuracy),
      detail: `${Math.round(accuracy * 100)}%`,
      kicker: phase.title
    });
    this.audio.phaseComplete(accuracy);
    if (accuracy >= 0.7) {
      this.juice.confetti(this.width * 0.5, this.height * 0.42, 26);
      this.juice.flashScreen(PALETTE.cream, 0.13, 3.2);
      this.juice.shakeAdd(0.13);
    } else {
      this.juice.shakeAdd(0.06);
    }
  }

  _finish() {
    if (this.state === 'FINISHED' || this.state === 'ENDED') return;
    this.state = 'FINISHED';
    this.audio.stopPhase();
    const stars = this.score.getStars();
    const accuracy = this.score.getAccuracy();
    this.result = this.score.buildResult({
      title: this.resultTitle,
      rewards: this.buildRewards(stars, accuracy),
      extras: this.getResultExtras?.() || {}
    });
    this.audio.result(stars);
    this.view.showResult(this.result);
    if (stars >= 2) {
      this.juice.confetti(this.width * 0.5, this.height * 0.35, stars === 3 ? 50 : 30);
    }
    if (!this._finishedNotified) {
      this._finishedNotified = true;
      this.onFinish?.(this.result);
    }
  }

  end() {
    if (this.state === 'ENDED') return;
    this.state = 'ENDED';
    this.audio.stopPhase();
    this.onEnd?.(this.result);
  }

  buildRewards(stars = 1, accuracy = 0) {
    return {
      pearls: stars,
      ingredients: {},
      accuracy: Math.round(accuracy * 100)
    };
  }

  getTempo() {
    return 96 + this.difficulty * 5;
  }

  getResult() {
    return this.result;
  }

  resize(width, height) {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.phase?.resize(this.width, this.height);
    this.onResize?.(this.width, this.height);
  }

  onPointerDown(point, event) {
    if (this.state === 'PLAYING') this.phase?.onPointerDown(this.input, event, point);
  }

  onPointerMove(point, event) {
    if (this.state === 'PLAYING') this.phase?.onPointerMove(this.input, event, point);
  }

  onPointerUp(point, event) {
    if (this.state === 'PLAYING') this.phase?.onPointerUp(this.input, event, point);
  }

  registerHit(quality = 'good', x = this.width * 0.5, y = this.height * 0.5, options = {}) {
    const combo = this.score.registerHit(quality);
    this.view.setCombo(combo);
    const showText = options.showText !== false;
    if (quality === 'perfect') {
      if (showText) this.juice.perfectText(x, y, options.label || '¡PERFECTO!');
      this.audio.play('perfect');
      this.juice.shakeAdd(0.11);
      this.juice.flashScreen(PALETTE.cream, 0.08, 4.2);
    } else {
      if (showText) this.juice.goodText(x, y, options.label || '¡BIEN!');
      this.audio.play('good');
      this.juice.shakeAdd(0.05);
    }
    if (combo >= 3 && (combo === 3 || combo % 5 === 0)) {
      this.audio.combo(combo);
      this.juice.comboText(x, y - 30, combo);
    }
    if (options.target) this.juice.squash(options.target, options.squash || {});
    return combo;
  }

  registerMiss(x = this.width * 0.5, y = this.height * 0.5, label = '¡FALLO!') {
    this.score.registerMiss();
    this.view.setCombo(0);
    this.juice.failText(x, y, label);
    this.audio.play('fail');
    this.juice.shakeAdd(0.2);
    this.juice.flashScreen(PALETTE.danger, 0.1, 4);
  }

  drawBackground(ctx, width, height) {
    drawSunsetBackdrop(ctx, width, height);
  }

  render(ctx, viewport = {}) {
    if (this.state === 'IDLE') return;
    const width = viewport.width || this.width;
    const height = viewport.height || this.height;
    this.drawBackground(ctx, width, height);

    const [ox, oy, rotation] = this.juice.shake.getOffset();
    ctx.save();
    ctx.translate(ox, oy);
    if (rotation !== 0) {
      ctx.translate(width * 0.5, height * 0.5);
      ctx.rotate(rotation);
      ctx.translate(-width * 0.5, -height * 0.5);
    }
    this.phase?.render(ctx, { width, height, game: this, state: this.state });
    this.juice.render(ctx, width, height);
    ctx.restore();

    drawVignette(ctx, width, height, 0.16);
  }

  dispose() {
    this.phase?.exit();
    this.audio?.dispose?.();
    this.juice?.clear?.();
    this.onDispose?.();
  }
}
