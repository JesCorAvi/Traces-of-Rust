// Fase base de un minijuego. Cada fase es una mecánica corta con su propia
// puntuación, render y entrada; el MiniGame la orquesta y la puntúa.
// Exports: Phase.

import { clamp } from './Draw.js';
import { accuracyLabel, accuracyColor } from './ScoreTracker.js';

export class Phase {
  constructor(options = {}) {
    this.id = options.id || 'phase';
    this.title = options.title || 'FASE';
    this.kicker = options.kicker || '';
    this.instruction = options.instruction || '';
    this.gesture = options.gesture || 'gesture-tap';
    this.hint = options.hint || this.instruction;
    this.duration = Math.max(0.5, Number(options.duration) || 10);
    this.weight = Math.max(0.01, Number(options.weight) || 1);
    this.accent = options.accent || null;

    this.game = null;
    this.elapsed = 0;
    this.done = false;
    this.accuracy = 0;
    this.meta = {};
    this.stats = {};
    this.width = 960;
    this.height = 540;
  }

  enter(game) {
    this.game = game;
    this.elapsed = 0;
    this.done = false;
    this.accuracy = 0;
    this.meta = {};
    this.stats = {};
    this.width = game.width;
    this.height = game.height;
    this.onEnter?.();
  }

  update(dt) {
    if (this.done) return;
    this.elapsed += dt;
    this.onUpdate?.(dt);
    if (!this.done && this.duration > 0 && this.elapsed >= this.duration) {
      this.onTimeUp?.();
      if (!this.done) this.finish(this.getScore(), { timeUp: true });
    }
  }

  finish(accuracy = 0, meta = {}) {
    if (this.done) return;
    this.done = true;
    this.accuracy = clamp(accuracy);
    this.meta = meta;
  }

  getScore() {
    return this.accuracy;
  }

  getProgress() {
    return this.duration > 0 ? clamp(this.elapsed / this.duration) : 0;
  }

  getRank() {
    return accuracyLabel(this.getScore());
  }

  getRankColor() {
    return accuracyColor(this.getScore());
  }

  onPointerDown(input, event, point) {
    this.onPointerDownInternal?.(input, event, point);
  }

  onPointerMove(input, event, point) {
    this.onPointerMoveInternal?.(input, event, point);
  }

  onPointerUp(input, event, point) {
    this.onPointerUpInternal?.(input, event, point);
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.onResize?.(width, height);
  }

  render(ctx, viewport) {
    this.onRender?.(ctx, viewport);
  }

  exit() {
    this.onExit?.();
  }
}
