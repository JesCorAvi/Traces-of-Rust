// Fachada de "juice": tweens, partículas, texto flotante, shake y flash.
// Exports: Juice.

import { PALETTE } from '../assets/palette.js';
import { clamp, rgba } from './Draw.js';
import { TweenManager } from './Tween.js';
import { Particles } from './Particles.js';
import { FloatingText } from './FloatingText.js';
import { ScreenShake } from './ScreenShake.js';

export class Juice {
  constructor() {
    this.tweens = new TweenManager();
    this.particles = new Particles();
    this.texts = new FloatingText();
    this.shake = new ScreenShake();
    this.flash = { alpha: 0, color: PALETTE.cream, decay: 2.7 };
  }

  update(dt) {
    this.tweens.update(dt);
    this.particles.update(dt);
    this.texts.update(dt);
    this.shake.update(dt);
    if (this.flash.alpha > 0) {
      this.flash.alpha = Math.max(0, this.flash.alpha - this.flash.decay * dt);
    }
  }

  render(ctx, width, height) {
    this.particles.render(ctx);
    this.texts.render(ctx, width, height);
    if (this.flash.alpha > 0) {
      ctx.save();
      ctx.globalAlpha = clamp(this.flash.alpha);
      ctx.fillStyle = this.flash.color;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  }

  popText(value, x, y, options = {}) {
    return this.texts.spawn(value, x, y, options);
  }

  perfectText(x, y, value = '¡PERFECTO!') {
    this.texts.spawn(value, x, y, {
      color: PALETTE.perfect,
      size: 26,
      life: 1.05,
      vy: -62,
      wobble: 0.8
    });
    this.particles.ring(x, y, 12, { radius: 12, color: PALETTE.perfect, size: [2, 4], glow: true });
  }

  goodText(x, y, value = '¡BIEN!') {
    this.texts.spawn(value, x, y, {
      color: PALETTE.good,
      size: 20,
      life: 0.85,
      vy: -52,
      wobble: 0.5
    });
  }

  failText(x, y, value = '¡FALLO!') {
    this.texts.spawn(value, x, y, {
      color: PALETTE.danger,
      size: 20,
      life: 0.9,
      vy: -46,
      rotation: -0.05,
      wobble: 1.2
    });
  }

  comboText(x, y, combo) {
    const level = Math.max(2, combo);
    this.texts.spawn(`¡COMBO x${level}!`, x, y, {
      color: level >= 6 ? PALETTE.perfect : PALETTE.pineapple,
      size: 18 + Math.min(10, level * 1.4),
      life: 1.0,
      vy: -70,
      wobble: 1.4
    });
    this.particles.ring(x, y, Math.min(22, 8 + level * 2), {
      radius: 8,
      color: level >= 6 ? PALETTE.perfect : PALETTE.mango,
      size: [2, 5],
      glow: true
    });
  }

  burst(x, y, count = 12, options = {}) {
    return this.particles.burst(x, y, count, options);
  }

  ring(x, y, count = 14, options = {}) {
    return this.particles.ring(x, y, count, options);
  }

  steam(x, y, count = 4, options = {}) {
    return this.particles.steam(x, y, count, options);
  }

  splash(x, y, count = 14, options = {}) {
    return this.particles.splash(x, y, count, options);
  }

  confetti(x, y, count = 24) {
    return this.particles.confetti(x, y, count);
  }

  shakeAdd(amount = 0.2) {
    this.shake.add(amount);
  }

  flashScreen(color = PALETTE.cream, strength = 0.32, decay = 2.7) {
    this.flash.color = color;
    this.flash.alpha = Math.max(this.flash.alpha, clamp(strength));
    this.flash.decay = Number(decay) || 2.7;
  }

  squash(target, options = {}) {
    if (!target) return;
    const {
      sx = 1.22,
      sy = 0.78,
      duration = 0.28,
      ease = 'backOut'
    } = options;
    if (!Number.isFinite(target.scaleX)) target.scaleX = 1;
    if (!Number.isFinite(target.scaleY)) target.scaleY = 1;
    const baseX = target.scaleX || 1;
    const baseY = target.scaleY || 1;
    const half = Math.max(0.04, duration * 0.34);
    this.tweens.to(target, { scaleX: baseX * sx, scaleY: baseY * sy }, {
      duration: half,
      ease: 'quadOut',
      onComplete: () => {
        this.tweens.to(target, { scaleX: baseX, scaleY: baseY }, {
          duration: Math.max(0.05, duration - half),
          ease
        });
      }
    });
  }

  pulse(target, property = 'scale', amount = 1.15, duration = 0.24) {
    if (!target) return;
    if (!Number.isFinite(target[property])) target[property] = 1;
    const base = target[property] || 1;
    this.tweens.to(target, { [property]: base * amount }, {
      duration: duration * 0.4,
      ease: 'backOut',
      onComplete: () => {
        this.tweens.to(target, { [property]: base }, {
          duration: duration * 0.6,
          ease: 'elasticOut'
        });
      }
    });
  }

  clear() {
    this.tweens.clear();
    this.particles.clear();
    this.texts.clear();
    this.shake.clear();
    this.flash.alpha = 0;
  }
}
