// Tweens numéricos con easings cartoon. Sin dependencias externas.
// Exports: Easings, TweenManager, clamp01.

export const clamp01 = value => Math.max(0, Math.min(1, Number(value) || 0));

export const Easings = Object.freeze({
  linear: t => t,
  quadIn: t => t * t,
  quadOut: t => 1 - (1 - t) * (1 - t),
  quadInOut: t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  cubicIn: t => t * t * t,
  cubicOut: t => 1 - Math.pow(1 - t, 3),
  cubicInOut: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  quartOut: t => 1 - Math.pow(1 - t, 4),
  sineInOut: t => -(Math.cos(Math.PI * t) - 1) / 2,
  backOut: t => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  backIn: t => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  elasticOut: t => {
    if (t === 0 || t === 1) return t;
    const c4 = (2 * Math.PI) / 3;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  bounceOut: t => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) {
      const x = t - 1.5 / d1;
      return n1 * x * x + 0.75;
    }
    if (t < 2.5 / d1) {
      const x = t - 2.25 / d1;
      return n1 * x * x + 0.9375;
    }
    const x = t - 2.625 / d1;
    return n1 * x * x + 0.984375;
  }
});

function resolveEase(ease) {
  if (typeof ease === 'function') return ease;
  if (typeof ease === 'string' && Easings[ease]) return Easings[ease];
  return Easings.cubicOut;
}

export class TweenManager {
  constructor() {
    this._tweens = [];
  }

  to(target, props, options = {}) {
    if (!target) return { cancel() {} };
    const {
      duration = 0.3,
      delay = 0,
      ease = 'cubicOut',
      onUpdate = null,
      onComplete = null
    } = options;
    const values = {};
    const starts = {};
    for (const [key, value] of Object.entries(props || {})) {
      if (Number.isFinite(value) && Number.isFinite(target[key])) {
        starts[key] = target[key];
        values[key] = value;
      }
    }
    const tween = {
      target,
      starts,
      values,
      duration: Math.max(0.0001, Number(duration) || 0.0001),
      delay: Math.max(0, Number(delay) || 0),
      elapsed: 0,
      ease: resolveEase(ease),
      onUpdate,
      onComplete,
      cancelled: false,
      dead: false
    };
    this._tweens.push(tween);

    const manager = this;
    return {
      cancel() {
        tween.cancelled = true;
        const index = manager._tweens.indexOf(tween);
        if (index >= 0) manager._tweens.splice(index, 1);
      }
    };
  }

  update(dt) {
    const delta = Math.max(0, Number(dt) || 0);
    for (let i = this._tweens.length - 1; i >= 0; i--) {
      const tween = this._tweens[i];
      if (tween.cancelled) {
        this._tweens.splice(i, 1);
        continue;
      }
      if (tween.delay > 0) {
        tween.delay -= delta;
        if (tween.delay > 0) continue;
      }
      tween.elapsed += delta;
      const raw = clamp01(tween.elapsed / tween.duration);
      const t = tween.ease(raw);
      for (const key of Object.keys(tween.values)) {
        const start = tween.starts[key];
        const end = tween.values[key];
        tween.target[key] = start + (end - start) * t;
      }
      if (typeof tween.onUpdate === 'function') tween.onUpdate(tween.target, t);
      if (raw >= 1) {
        for (const key of Object.keys(tween.values)) tween.target[key] = tween.values[key];
        tween.dead = true;
        this._tweens.splice(i, 1);
        if (typeof tween.onComplete === 'function') tween.onComplete(tween.target);
      }
    }
  }

  kill(target) {
    for (let i = this._tweens.length - 1; i >= 0; i--) {
      if (this._tweens[i].target === target) this._tweens.splice(i, 1);
    }
  }

  clear() {
    this._tweens.length = 0;
  }

  get size() {
    return this._tweens.length;
  }
}
