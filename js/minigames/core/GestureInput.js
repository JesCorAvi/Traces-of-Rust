// Entrada por gestos con pointer events: arrastre, mantener/soltar, círculos,
// zigzag, frotar/agitar, taps y flicks. Coordenadas en píxeles lógicos del canvas.
// Exports: GestureInput.

import { TAU, clamp } from './Draw.js';

const nowSeconds = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;

function shortestAngle(delta) {
  return ((delta + Math.PI) % TAU + TAU) % TAU - Math.PI;
}

function emptyCircle() {
  return {
    target: null,
    lastAngle: null,
    totalAngle: 0,
    absAngle: 0,
    turns: 0,
    direction: 0,
    totalTime: 0,
    inBandTime: 0,
    radius: 0,
    avgRadius: 0,
    radiusSamples: 0,
    lastMoveTime: 0,
    speedSamples: []
  };
}

export class GestureInput {
  constructor() {
    this.reset();
  }

  reset() {
    this.down = false;
    this.justPressed = false;
    this.justReleased = false;
    this.justTapped = false;
    this.pointerType = 'mouse';
    this.pointerId = null;
    this.x = 0;
    this.y = 0;
    this.prevX = 0;
    this.prevY = 0;
    this.downX = 0;
    this.downY = 0;
    this.dx = 0;
    this.dy = 0;
    this.speed = 0;
    this.peakSpeed = 0;
    this.downTime = 0;
    this.releaseTime = 0;
    this.path = [];
    this.lastTap = null;
    this.tapTimes = [];
    this.flick = null;
    this.osc = this._emptyOsc();
    this.zigzag = this._emptyOsc();
    this.circle = emptyCircle();
    this._dragDistance = 0;
  }

  _emptyOsc() {
    return {
      lastDir: 0,
      changes: 0,
      distance: 0,
      amplitude: 0,
      changeTimes: [],
      startX: 0,
      startY: 0
    };
  }

  resetStats() {
    const target = this.circle?.target || null;
    this.path.length = 0;
    this.speed = 0;
    this.peakSpeed = 0;
    this.flick = null;
    this.osc = this._emptyOsc();
    this.zigzag = this._emptyOsc();
    this.circle = emptyCircle();
    this.circle.target = target;
    this.lastTap = null;
    this.tapTimes.length = 0;
    this._dragDistance = 0;
  }

  resetCircle() {
    const target = this.circle.target;
    this.circle = emptyCircle();
    this.circle.target = target;
  }

  setCircleTarget(target = null) {
    this.circle = emptyCircle();
    if (!target) return;
    this.circle.target = {
      x: Number(target.x) || 0,
      y: Number(target.y) || 0,
      inner: Math.max(1, Number(target.inner) || 12),
      outer: Math.max(2, Number(target.outer) || 80)
    };
  }

  clearCircleTarget() {
    this.circle = emptyCircle();
  }

  begin(x, y, event = {}) {
    const time = nowSeconds();
    this.down = true;
    this.justPressed = true;
    this.justReleased = false;
    this.justTapped = false;
    this.pointerType = event.pointerType || 'mouse';
    this.pointerId = event.pointerId ?? null;
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.downX = x;
    this.downY = y;
    this.dx = 0;
    this.dy = 0;
    this.speed = 0;
    this.peakSpeed = 0;
    this.downTime = time;
    this.releaseTime = 0;
    this._dragDistance = 0;
    this.path.length = 0;
    this.path.push({ x, y, t: time });
    this.osc = this._emptyOsc();
    this.osc.startX = x;
    this.osc.startY = y;
    this.zigzag = this._emptyOsc();
    this.zigzag.startX = x;
    this.zigzag.startY = y;
    this.flick = null;
    this.circle.lastAngle = null;
    this.circle.speedSamples.length = 0;
  }

  move(x, y, event = {}) {
    const time = nowSeconds();
    this.pointerType = event.pointerType || this.pointerType;
    if (!this.down) {
      this.x = x;
      this.y = y;
      this.prevX = x;
      this.prevY = y;
      // Los círculos también se reconocen en hover: remover con el ratón no
      // debería exigir mantener pulsado. El resto de gestos sí lo exige.
      if (this.circle.target) this._updateCircle(x, y, time, event);
      return;
    }

    const dx = x - this.prevX;
    const dy = y - this.prevY;
    const dt = Math.max(0.001, time - (this.path[this.path.length - 1]?.t || this.downTime));
    this.dx = dx;
    this.dy = dy;
    this.speed = Math.hypot(dx, dy) / dt;
    this.peakSpeed = Math.max(this.peakSpeed, this.speed);
    this._dragDistance = Math.hypot(x - this.downX, y - this.downY);

    this.prevX = x;
    this.prevY = y;
    this.x = x;
    this.y = y;

    this.path.push({ x, y, t: time });
    const cutoff = time - 0.6;
    while (this.path.length > 2 && this.path[0].t < cutoff) this.path.shift();

    // Oscilación horizontal/vertical (agitar, frotar, zigzag).
    if (Math.abs(dx) > 1.2) {
      const dir = Math.sign(dx);
      if (this.osc.lastDir !== 0 && dir !== this.osc.lastDir) {
        this.osc.changes++;
        this.osc.changeTimes.push(time);
      }
      this.osc.lastDir = dir;
      this.osc.distance += Math.abs(dx);
      this.osc.amplitude = Math.max(this.osc.amplitude, Math.abs(x - this.osc.startX));
    }
    if (Math.abs(dy) > 1.2) {
      const dir = Math.sign(dy);
      if (this.zigzag.lastDir !== 0 && dir !== this.zigzag.lastDir) {
        this.zigzag.changes++;
        this.zigzag.changeTimes.push(time);
      }
      this.zigzag.lastDir = dir;
      this.zigzag.distance += Math.abs(dy);
      this.zigzag.amplitude = Math.max(this.zigzag.amplitude, Math.abs(y - this.zigzag.startY));
    }
    const oscCutoff = time - 1.4;
    while (this.osc.changeTimes.length && this.osc.changeTimes[0] < oscCutoff) this.osc.changeTimes.shift();
    while (this.zigzag.changeTimes.length && this.zigzag.changeTimes[0] < oscCutoff) this.zigzag.changeTimes.shift();

    this._updateCircle(x, y, time, event);
  }

  _updateCircle(x, y, time, event) {
    const target = this.circle.target;
    if (!target) return;
    const rx = x - target.x;
    const ry = y - target.y;
    const radius = Math.hypot(rx, ry);
    this.circle.radius = radius;
    this.circle.radiusSamples++;
    this.circle.avgRadius += (radius - this.circle.avgRadius) / Math.min(30, this.circle.radiusSamples);

    const withinBand = radius >= target.inner * 0.78 && radius <= target.outer * 1.28;
    if (!withinBand || radius < 4) {
      this.circle.lastAngle = null;
      return;
    }

    const angle = Math.atan2(ry, rx);
    if (this.circle.lastAngle === null) {
      this.circle.lastAngle = angle;
      this.circle.lastMoveTime = time;
      return;
    }
    const dt = Math.max(0.001, time - this.circle.lastMoveTime);
    const delta = shortestAngle(angle - this.circle.lastAngle);
    if (Math.abs(delta) > 1.15) {
      // Salto de pointer (p. ej. al salir y entrar del área): no cuenta como giro.
      this.circle.lastAngle = angle;
      this.circle.lastMoveTime = time;
      return;
    }
    this.circle.absAngle += Math.abs(delta);
    this.circle.totalAngle += delta;
    this.circle.turns = this.circle.absAngle / TAU;
    if (Math.abs(delta) > 0.015) this.circle.direction = Math.sign(delta);
    const angularSpeed = Math.abs(delta) / dt;
    if (withinBand) {
      this.circle.speedSamples.push({ t: time, speed: angularSpeed, radius });
      const cutoff = time - 1.2;
      while (this.circle.speedSamples.length && this.circle.speedSamples[0].t < cutoff) {
        this.circle.speedSamples.shift();
      }
    }
    this.circle.lastAngle = angle;
    this.circle.lastMoveTime = time;
  }

  end(x, y, event = {}) {
    if (!this.down) return;
    if (Number.isFinite(x) && Number.isFinite(y)) this.move(x, y, event);
    const time = nowSeconds();
    const duration = Math.max(0, time - this.downTime);
    const dx = this.x - this.downX;
    const dy = this.y - this.downY;
    const distance = Math.hypot(dx, dy);
    this.down = false;
    this.justPressed = false;
    this.justReleased = true;
    this.releaseTime = time;

    const isTap = duration < 0.38 && distance < 14;
    this.justTapped = isTap;
    if (isTap) {
      this.lastTap = { x: this.x, y: this.y, t: time, duration };
      this.tapTimes.push(time);
      while (this.tapTimes.length > 10) this.tapTimes.shift();
    }

    const speed = this.peakSpeed;
    const threshold = 340;
    this.flick = {
      up: dy < -18 && speed >= threshold,
      down: dy > 18 && speed >= threshold,
      left: dx < -18 && speed >= threshold,
      right: dx > 18 && speed >= threshold,
      distance,
      speed,
      dx,
      dy
    };

    this.circle.lastAngle = null;
  }

  cancel() {
    this.end(this.x, this.y, { pointerType: this.pointerType, pointerId: this.pointerId });
  }

  update(dt) {
    const target = this.circle.target;
    if (target) {
      this.circle.totalTime += dt;
      if (this.circle.radius >= target.inner * 0.78 && this.circle.radius <= target.outer * 1.28) {
        this.circle.inBandTime += dt;
      }
    }
  }

  endFrame() {
    this.justPressed = false;
    this.justReleased = false;
    this.justTapped = false;
    this.lastTap = null;
    this.flick = null;
  }

  getDrag() {
    const distance = Math.hypot(this.x - this.downX, this.y - this.downY);
    return {
      dx: this.x - this.downX,
      dy: this.y - this.downY,
      distance,
      progress: clamp(distance / Math.max(1, this._dragDistance || distance)),
      speed: this.speed,
      angle: Math.atan2(this.y - this.downY, this.x - this.downX)
    };
  }

  getHoldTime() {
    if (this.down) return Math.max(0, nowSeconds() - this.downTime);
    if (this.releaseTime <= 0) return 0;
    return Math.max(0, this.releaseTime - this.downTime);
  }

  getOscillation() {
    const duration = Math.max(0.15, this.down ? nowSeconds() - this.downTime : this.releaseTime - this.downTime);
    return {
      changes: this.osc.changes,
      distance: this.osc.distance,
      amplitude: this.osc.amplitude,
      frequency: this.osc.changes / duration,
      energy: this.osc.distance / duration,
      directionChanges: this.osc.changes
    };
  }

  getZigzag() {
    const duration = Math.max(0.15, this.down ? nowSeconds() - this.downTime : this.releaseTime - this.downTime);
    return {
      changes: this.zigzag.changes,
      distance: this.zigzag.distance,
      amplitude: this.zigzag.amplitude,
      frequency: this.zigzag.changes / duration,
      energy: this.zigzag.distance / duration
    };
  }

  getCircleStats() {
    const c = this.circle;
    const samples = c.speedSamples;
    let mean = 0;
    if (samples.length) {
      for (const sample of samples) mean += sample.speed;
      mean /= samples.length;
    }
    let variance = 0;
    if (samples.length > 1) {
      for (const sample of samples) variance += Math.pow(sample.speed - mean, 2);
      variance /= samples.length;
    }
    const std = Math.sqrt(variance);
    const consistency = mean > 0.001 ? Math.max(0, 1 - Math.min(1, std / mean)) : 0;
    return {
      turns: c.turns,
      direction: c.direction,
      angularSpeed: mean,
      consistency,
      inBandRatio: c.totalTime > 0.01 ? c.inBandTime / c.totalTime : 0,
      radius: c.radius,
      avgRadius: c.avgRadius,
      totalTime: c.totalTime,
      inBandTime: c.inBandTime,
      samples: samples.length
    };
  }

  getTapRhythm() {
    const intervals = [];
    for (let i = 1; i < this.tapTimes.length; i++) intervals.push(this.tapTimes[i] - this.tapTimes[i - 1]);
    return {
      count: this.tapTimes.length,
      intervals,
      averageInterval: intervals.length ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 0
    };
  }

  dispose() {
    this.reset();
  }
}
