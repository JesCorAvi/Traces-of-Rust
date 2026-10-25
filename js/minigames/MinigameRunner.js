// Runner reutilizable: monta el overlay, el canvas, el bucle RAF, pointer events,
// pausa por visibilidad y limpieza completa. Los juegos solo implementan MiniGame.
// Exports: MinigameRunner.

import { AssetFactory } from './assets/AssetFactory.js';
import { PALETTE } from './assets/palette.js';
import { GestureInput } from './core/GestureInput.js';
import { Juice } from './core/Juice.js';
import { MinigameAudio } from './core/MinigameAudio.js';
import { MinigameView } from './views/MinigameView.js';

export class MinigameRunner {
  constructor(options = {}) {
    if (typeof options.createGame !== 'function') {
      throw new Error('[MinigameRunner] createGame es obligatorio.');
    }
    this.options = options;
    this.title = options.title || 'MINIJUEGO';
    this.kicker = options.kicker || 'CHIRINGUITO // MINIJUEGO';
    this.difficulty = Math.max(1, Math.min(5, Number(options.difficulty) || 1));
    this.mount = options.mount || document.body;
    this.onComplete = options.onComplete || null;
    this.onAbort = options.onAbort || null;
    this.onError = options.onError || null;
    this.restorePointerLock = !!options.restorePointerLock;

    this.input = new GestureInput();
    this.juice = new Juice();
    this.audio = new MinigameAudio();
    this.view = new MinigameView({
      title: this.title,
      kicker: this.kicker,
      difficulty: this.difficulty,
      mount: this.mount,
      onAbort: reason => this.abort(reason),
      onContinue: () => this.continue()
    });

    this.services = {
      view: this.view,
      input: this.input,
      juice: this.juice,
      audio: this.audio,
      assets: AssetFactory
    };

    let createdGame = null;
    try {
      createdGame = options.createGame({
        services: this.services,
        difficulty: this.difficulty,
        options: options.options || {}
      });
    } catch (error) {
      this.view.destroy();
      throw error;
    }
    if (!createdGame) {
      this.view.destroy();
      throw new Error('[MinigameRunner] createGame no devolvió un MiniGame.');
    }
    this.game = createdGame;

    this._ctx = null;
    this._canvasInfo = { width: 960, height: 540, dpr: 1 };
    this._raf = 0;
    this._lastTime = 0;
    this._running = false;
    this._destroyed = false;
    this._paused = false;
    this._pointerActive = false;
    this._audioUnlocked = false;

    this._pointerDownHandler = event => this._onPointerDown(event);
    this._pointerMoveHandler = event => this._onPointerMove(event);
    this._pointerUpHandler = event => this._onPointerUp(event);
    this._pointerCancelHandler = event => this._onPointerCancel(event);
    this._contextMenuHandler = event => event.preventDefault();
    this._keyHandler = event => this._onKeyDown(event);
    this._visibilityHandler = () => this._onVisibilityChange();

    this._bindPointer();
    window.addEventListener('keydown', this._keyHandler, true);
    document.addEventListener('visibilitychange', this._visibilityHandler);
    this.view.observeResize(size => this._resize(size));
  }

  _bindPointer() {
    const canvas = this.view.getCanvas();
    if (!canvas) return;
    canvas.addEventListener('pointerdown', this._pointerDownHandler);
    canvas.addEventListener('pointermove', this._pointerMoveHandler);
    canvas.addEventListener('pointerup', this._pointerUpHandler);
    canvas.addEventListener('pointercancel', this._pointerCancelHandler);
    canvas.addEventListener('lostpointercapture', this._pointerCancelHandler);
    canvas.addEventListener('contextmenu', this._contextMenuHandler);
  }

  _unbindPointer() {
    const canvas = this.view.getCanvas();
    if (!canvas) return;
    canvas.removeEventListener('pointerdown', this._pointerDownHandler);
    canvas.removeEventListener('pointermove', this._pointerMoveHandler);
    canvas.removeEventListener('pointerup', this._pointerUpHandler);
    canvas.removeEventListener('pointercancel', this._pointerCancelHandler);
    canvas.removeEventListener('lostpointercapture', this._pointerCancelHandler);
    canvas.removeEventListener('contextmenu', this._contextMenuHandler);
  }

  start() {
    if (this._destroyed || this._running) return;
    AssetFactory.unlockAudio();
    this._audioUnlocked = true;
    this.view.open();
    this.game.init();
    this._resize(this.view.getStageSize());
    this.game.start();
    this._running = true;
    this._lastTime = performance.now();
    this._raf = requestAnimationFrame(time => this._loop(time));
  }

  _resize(size) {
    if (this._destroyed) return;
    const canvas = this.view.getCanvas();
    if (!canvas) return;
    const width = Math.max(320, Math.round(size.width || 960));
    const height = Math.max(180, Math.round(size.height || 540));
    const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    this._canvasInfo = { width, height, dpr };
    this._ctx = canvas.getContext('2d', { alpha: false });
    if (this._ctx) {
      this._ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this._ctx.imageSmoothingEnabled = false;
    }
    this.game.resize(width, height);
    this._render(0);
  }

  _loop(time) {
    if (this._destroyed) return;
    if (this._paused) {
      this._lastTime = time;
      this._raf = requestAnimationFrame(next => this._loop(next));
      return;
    }
    const dt = Math.min(0.05, Math.max(0, (time - this._lastTime) / 1000));
    this._lastTime = time;

    try {
      this.input.update(dt);
      if (this.game.state === 'PLAYING' && this.game.phase) {
        this.audio.setProgress(this.game.phase.getProgress());
      }
      this.game.update(dt);
      this._render(dt);
      this.input.endFrame();
    } catch (error) {
      this._fail(error);
      return;
    }

    this._raf = requestAnimationFrame(next => this._loop(next));
  }

  _render(dt) {
    const ctx = this._ctx;
    if (!ctx) return;
    const { width, height, dpr } = this._canvasInfo;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = PALETTE.inkBlue;
    ctx.fillRect(0, 0, width, height);
    this.game.render(ctx, { width, height, dt });
  }

  _localPoint(event) {
    const canvas = this.view.getCanvas();
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const { width, height } = this._canvasInfo;
    const sx = rect.width > 0 ? width / rect.width : 1;
    const sy = rect.height > 0 ? height / rect.height : 1;
    return {
      x: (event.clientX - rect.left) * sx,
      y: (event.clientY - rect.top) * sy
    };
  }

  _onPointerDown(event) {
    if (this._destroyed) return;
    if (!this._audioUnlocked) {
      AssetFactory.unlockAudio();
      this._audioUnlocked = true;
    }
    if (this.game.state !== 'PLAYING') return;
    const point = this._localPoint(event);
    this._pointerActive = true;
    try {
      this.view.getCanvas()?.setPointerCapture?.(event.pointerId);
    } catch (error) {}
    this.input.begin(point.x, point.y, event);
    this.game.onPointerDown(point, event);
    event.preventDefault();
  }

  _onPointerMove(event) {
    if (this._destroyed) return;
    const point = this._localPoint(event);
    this.input.move(point.x, point.y, event);
    if (this._pointerActive) this.game.onPointerMove(point, event);
  }

  _onPointerUp(event) {
    if (this._destroyed) return;
    const point = this._localPoint(event);
    this.input.end(point.x, point.y, event);
    if (this._pointerActive) this.game.onPointerUp(point, event);
    this._pointerActive = false;
    try {
      this.view.getCanvas()?.releasePointerCapture?.(event.pointerId);
    } catch (error) {}
    event.preventDefault();
  }

  _onPointerCancel(event) {
    if (this._destroyed || !this._pointerActive) return;
    this.input.cancel();
    this.game.onPointerUp({ x: this.input.x, y: this.input.y }, event);
    this._pointerActive = false;
  }

  _onKeyDown(event) {
    if (this._destroyed) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.abort('escape');
      return;
    }
    if ((event.key === 'Enter' || event.code === 'Space') && this.game.state === 'FINISHED') {
      event.preventDefault();
      event.stopPropagation();
      this.continue();
    }
  }

  _onVisibilityChange() {
    if (this._destroyed) return;
    this._paused = !!document.hidden;
    this._lastTime = performance.now();
    if (this._paused) {
      this.audio.stopPhase();
      this.juice.shake.clear();
    } else if (this.game.state === 'PLAYING') {
      this.audio.startPhase(this.game.getTempo());
    }
  }

  continue() {
    if (this._destroyed || this.game.state !== 'FINISHED') return;
    const result = this.game.getResult();
    this.game.end();
    this.onComplete?.(result);
    this.destroy();
  }

  abort(reason = 'abort') {
    if (this._destroyed) return;
    const result = this.game?.getResult?.() || null;
    this.onAbort?.({ reason, result });
    this.destroy();
  }

  _fail(error) {
    console.error('[MinigameRunner] Error en el minijuego:', error);
    this.audio.stopPhase();
    this.view.setError(`ERROR EN EL MINIJUEGO // ${error?.message || error}`);
    this._running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;
    this.onError?.(error);
  }

  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    this._running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;
    this._unbindPointer();
    window.removeEventListener('keydown', this._keyHandler, true);
    document.removeEventListener('visibilitychange', this._visibilityHandler);
    this.input?.dispose();
    this.audio?.dispose();
    this.juice?.clear();
    this.game?.dispose();
    this.view?.destroy();
    if (this.restorePointerLock && !document.pointerLockElement) {
      try {
        const lockPromise = document.body.requestPointerLock?.();
        if (lockPromise?.catch) lockPromise.catch(() => {});
      } catch (error) {}
    }
    this.game = null;
    this.input = null;
    this.audio = null;
    this.juice = null;
    this.view = null;
    this.services = null;
    this._ctx = null;
    this._canvasInfo = null;
  }
}
