// Texto flotante con rebote, contorno y desvanecimiento. Pool fijo sin allocations.
// Exports: FloatingText.

import { PALETTE } from '../assets/palette.js';
import { clamp, text } from './Draw.js';
import { Easings } from './Tween.js';

const MAX_TEXTS = 24;

function makeText() {
  return {
    active: false,
    value: '',
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    maxLife: 1,
    size: 22,
    color: PALETTE.cream,
    outline: PALETTE.ink,
    outlineWidth: 4,
    rotation: 0,
    wobble: 0,
    alpha: 1
  };
}

export class FloatingText {
  constructor(max = MAX_TEXTS) {
    this.max = Math.max(4, max);
    this.pool = Array.from({ length: this.max }, makeText);
    this.cursor = 0;
  }

  spawn(value, x, y, options = {}) {
    const item = this.pool[this.cursor % this.max];
    this.cursor = (this.cursor + 1) % this.max;
    const life = Math.max(0.2, Number(options.life) || 0.9);
    // Apila textos cercanos para que los combos y los aciertos no se pisen.
    let stack = 0;
    for (const other of this.pool) {
      if (!other.active) continue;
      if (Math.abs(other.x - x) < 70 && Math.abs(other.y - y) < 120) stack += 22;
    }
    item.active = true;
    item.value = String(value);
    item.x = Number(x) || 0;
    item.y = (Number(y) || 0) - Math.min(88, stack);
    item.vx = Number(options.vx) || 0;
    item.vy = Number.isFinite(options.vy) ? options.vy : -54;
    item.life = life;
    item.maxLife = life;
    item.size = Math.max(10, Number(options.size) || 22);
    item.color = options.color || PALETTE.cream;
    item.outline = options.outline || PALETTE.ink;
    item.outlineWidth = Number.isFinite(options.outlineWidth) ? options.outlineWidth : 4;
    item.rotation = Number(options.rotation) || 0;
    item.wobble = Number(options.wobble) || 0;
    item.alpha = Number.isFinite(options.alpha) ? clamp(options.alpha) : 1;
    return item;
  }

  update(dt) {
    const delta = Math.max(0, Number(dt) || 0);
    for (const item of this.pool) {
      if (!item.active) continue;
      item.life -= delta;
      if (item.life <= 0) {
        item.active = false;
        continue;
      }
      item.x += item.vx * delta;
      item.y += item.vy * delta;
      item.vy += 22 * delta;
      item.wobble += delta * 9;
    }
  }

  render(ctx, width = 0, height = 0) {
    for (const item of this.pool) {
      if (!item.active) continue;
      const ratio = clamp(item.life / item.maxLife);
      const age = 1 - ratio;
      const pop = age < 0.18 ? Easings.backOut(age / 0.18) : 1;
      const alpha = Math.min(1, ratio * 2.6) * item.alpha;
      const wobble = Math.sin(item.wobble) * 2.4 * ratio;
      // Mantén los rótulos dentro del canvas: Press Start 2P ocupa ~0.8em
      // por glifo, así que reservamos media anchura estimada a cada lado.
      const half = Math.min(width * 0.5, String(item.value).length * item.size * 0.46);
      const x = width > 0 ? clamp(item.x + wobble, half + 8, width - half - 8) : item.x + wobble;
      const y = height > 0 ? clamp(item.y, item.size, height - item.size) : item.y;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(item.rotation);
      ctx.scale(pop, pop);
      text(ctx, item.value, 0, 0, {
        size: item.size,
        color: item.color,
        outline: item.outline,
        outlineWidth: item.outlineWidth,
        alpha,
        align: 'center',
        baseline: 'middle',
        family: '"Press Start 2P", "VT323", monospace',
        weight: '400'
      });
      ctx.restore();
    }
  }

  clear() {
    for (const item of this.pool) item.active = false;
    this.cursor = 0;
  }
}
