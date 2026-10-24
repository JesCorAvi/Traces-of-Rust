// Pool de partículas 2D para salpicaduras, vapor, chispas, polvo y confeti.
// Exports: Particles.

import { PALETTE, PALETTE_FLAT } from '../assets/palette.js';
import { TAU, circle, ellipse, starPath, sparkPath, rand, pick, clamp } from './Draw.js';

const MAX_PARTICLES = 280;

function makeParticle() {
  return {
    active: false,
    x: 0, y: 0, vx: 0, vy: 0,
    life: 0, maxLife: 1,
    size: 4, endSize: 4,
    color: PALETTE.cream,
    gravity: 0,
    drag: 0,
    rotation: 0,
    spin: 0,
    shape: 'circle',
    alpha: 1,
    glow: false
  };
}

export class Particles {
  constructor(max = MAX_PARTICLES) {
    this.max = Math.max(16, max);
    this.pool = Array.from({ length: this.max }, makeParticle);
    this.cursor = 0;
    this.activeCount = 0;
  }

  _next() {
    for (let i = 0; i < this.max; i++) {
      const index = (this.cursor + i) % this.max;
      if (!this.pool[index].active) {
        this.cursor = (index + 1) % this.max;
        return this.pool[index];
      }
    }
    // Si el pool está lleno, recicla la partícula más antigua.
    const recycled = this.pool[this.cursor];
    this.cursor = (this.cursor + 1) % this.max;
    return recycled;
  }

  spawn(options = {}) {
    const p = this._next();
    const wasActive = p.active;
    const life = Math.max(0.05, Number(options.life) || 0.7);
    p.active = true;
    p.x = Number(options.x) || 0;
    p.y = Number(options.y) || 0;
    p.vx = Number(options.vx) || 0;
    p.vy = Number(options.vy) || 0;
    p.life = life;
    p.maxLife = life;
    p.size = Math.max(0.5, Number(options.size) || 5);
    p.endSize = Number.isFinite(options.endSize) ? options.endSize : 0;
    p.color = options.color || pick(PALETTE_FLAT);
    p.gravity = Number(options.gravity) || 0;
    p.drag = Number(options.drag) || 0;
    p.rotation = Number(options.rotation) || rand(0, TAU);
    p.spin = Number(options.spin) || 0;
    p.shape = options.shape || 'circle';
    p.alpha = Number.isFinite(options.alpha) ? clamp(options.alpha) : 1;
    p.glow = !!options.glow;
    if (!wasActive) this.activeCount++;
    return p;
  }

  burst(x, y, count = 12, options = {}) {
    const {
      speed = [70, 220],
      angle = [0, TAU],
      colors = PALETTE_FLAT,
      life = [0.35, 0.85],
      size = [2, 7],
      gravity = 420,
      drag = 1.2,
      spread = 0,
      shape = 'circle',
      glow = false,
      alpha = 1,
      endSize = 0,
      spin = [-8, 8]
    } = options;
    const [smin, smax] = Array.isArray(speed) ? speed : [speed, speed];
    const [amin, amax] = Array.isArray(angle) ? angle : [angle, angle];
    const [lmin, lmax] = Array.isArray(life) ? life : [life, life];
    const [zmin, zmax] = Array.isArray(size) ? size : [size, size];
    const [spinMin, spinMax] = Array.isArray(spin) ? spin : [spin, spin];
    for (let i = 0; i < count; i++) {
      const a = rand(amin - spread, amax + spread);
      const s = rand(smin, smax);
      this.spawn({
        x: x + rand(-2, 2),
        y: y + rand(-2, 2),
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: rand(lmin, lmax),
        size: rand(zmin, zmax),
        endSize,
        color: Array.isArray(colors) ? pick(colors) : colors,
        gravity,
        drag,
        shape: Array.isArray(shape) ? pick(shape) : shape,
        spin: rand(spinMin, spinMax),
        glow,
        alpha
      });
    }
  }

  confetti(x, y, count = 24) {
    this.burst(x, y, count, {
      speed: [120, 360],
      angle: [-Math.PI * 0.9, -Math.PI * 0.1],
      colors: [PALETTE.coral, PALETTE.mango, PALETTE.pineapple, PALETTE.lagoon, PALETTE.lime, PALETTE.cream],
      life: [0.7, 1.5],
      size: [3, 7],
      gravity: 620,
      drag: 0.7,
      shape: ['square', 'star', 'leaf'],
      spin: [-12, 12],
      endSize: 1
    });
  }

  ring(x, y, count = 14, options = {}) {
    const {
      radius = 18,
      speed = [90, 190],
      color = PALETTE.cream,
      life = [0.25, 0.5],
      size = [2, 5],
      gravity = 0,
      shape = 'spark',
      glow = true
    } = options;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * TAU + rand(-0.08, 0.08);
      const s = rand(speed[0], speed[1]);
      this.spawn({
        x: x + Math.cos(a) * radius,
        y: y + Math.sin(a) * radius,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: rand(life[0], life[1]),
        size: rand(size[0], size[1]),
        color,
        gravity,
        drag: 1.5,
        shape,
        glow,
        spin: rand(-6, 6)
      });
    }
  }

  steam(x, y, count = 4, options = {}) {
    for (let i = 0; i < count; i++) {
      this.spawn({
        x: x + rand(-8, 8),
        y: y + rand(-4, 4),
        vx: rand(-12, 12),
        vy: rand(-42, -22),
        life: rand(0.55, 1.1),
        size: rand(5, 11),
        endSize: rand(16, 28),
        color: options.color || PALETTE.steam,
        gravity: -6,
        drag: 0.9,
        shape: 'steam',
        alpha: options.alpha ?? 0.45
      });
    }
  }

  splash(x, y, count = 14, options = {}) {
    this.burst(x, y, count, {
      speed: [80, 260],
      angle: [-Math.PI * 0.92, -Math.PI * 0.08],
      spread: 0.15,
      colors: [PALETTE.lagoonLight, PALETTE.lagoon, PALETTE.cream],
      life: [0.35, 0.85],
      size: [2, 6],
      gravity: 780,
      drag: 1.1,
      shape: 'circle',
      endSize: 1,
      ...options
    });
  }

  update(dt) {
    const delta = Math.max(0, Number(dt) || 0);
    let active = 0;
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      if (!p.active) continue;
      p.life -= delta;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      if (p.drag > 0) {
        const damping = Math.max(0, 1 - p.drag * delta);
        p.vx *= damping;
        p.vy *= damping;
      }
      p.vy += p.gravity * delta;
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.rotation += p.spin * delta;
      active++;
    }
    this.activeCount = active;
  }

  render(ctx) {
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      if (!p.active) continue;
      const ratio = clamp(p.life / p.maxLife);
      const lifeT = 1 - ratio;
      const size = Math.max(0.2, p.size + (p.endSize - p.size) * lifeT);
      ctx.save();
      ctx.globalAlpha = clamp(p.alpha * ratio);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      const fill = p.color || PALETTE.cream;

      if (p.glow) {
        ctx.globalAlpha *= 0.25;
        circle(ctx, 0, 0, size * 1.9, fill);
        ctx.globalAlpha = clamp(p.alpha * ratio);
      }

      switch (p.shape) {
        case 'square':
          ctx.fillStyle = fill;
          ctx.fillRect(-size * 0.5, -size * 0.5, size, size);
          break;
        case 'spark':
          sparkPath(ctx, 0, 0, size, 0.22);
          ctx.fillStyle = fill;
          ctx.fill();
          break;
        case 'star':
          starPath(ctx, 0, 0, size, size * 0.45, 5);
          ctx.fillStyle = fill;
          ctx.fill();
          break;
        case 'leaf':
          ellipse(ctx, 0, 0, size, size * 0.45, 0, fill);
          ctx.strokeStyle = 'rgba(36,20,15,0.35)';
          ctx.lineWidth = Math.max(1, size * 0.08);
          ctx.beginPath();
          ctx.moveTo(-size * 0.7, 0);
          ctx.lineTo(size * 0.7, 0);
          ctx.stroke();
          break;
        case 'steam':
          circle(ctx, 0, 0, size, fill);
          ctx.globalAlpha *= 0.55;
          circle(ctx, size * 0.35, -size * 0.25, size * 0.68, fill);
          break;
        case 'ring':
          ctx.strokeStyle = fill;
          ctx.lineWidth = Math.max(1, size * 0.16);
          ctx.beginPath();
          ctx.arc(0, 0, size, 0, TAU);
          ctx.stroke();
          break;
        case 'circle':
        default:
          circle(ctx, 0, 0, size, fill);
          break;
      }
      ctx.restore();
    }
  }

  clear() {
    for (const p of this.pool) p.active = false;
    this.activeCount = 0;
    this.cursor = 0;
  }
}
