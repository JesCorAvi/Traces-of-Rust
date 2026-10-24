// Screen shake leve basado en trauma; se aplica solo al canvas del minijuego.
// Exports: ScreenShake.

import { clamp, rand } from './Draw.js';

export class ScreenShake {
  constructor(options = {}) {
    this.trauma = 0;
    this.decay = Number(options.decay) || 1.9;
    this.maxOffset = Number(options.maxOffset) || 11;
    this.maxRotation = Number(options.maxRotation) || 0.018;
    this.offsetX = 0;
    this.offsetY = 0;
    this.rotation = 0;
  }

  add(amount = 0.2) {
    this.trauma = clamp(this.trauma + Math.max(0, amount));
  }

  update(dt) {
    const delta = Math.max(0, Number(dt) || 0);
    this.trauma = Math.max(0, this.trauma - this.decay * delta);
    const intensity = this.trauma * this.trauma;
    this.offsetX = rand(-1, 1) * this.maxOffset * intensity;
    this.offsetY = rand(-1, 1) * this.maxOffset * intensity;
    this.rotation = rand(-1, 1) * this.maxRotation * intensity;
  }

  getOffset() {
    return [this.offsetX, this.offsetY, this.rotation];
  }

  apply(ctx, callback) {
    const [ox, oy, rotation] = this.getOffset();
    ctx.save();
    ctx.translate(ox, oy);
    if (this.rotation !== 0) {
      ctx.translate(ctx.canvas.width * 0.5, ctx.canvas.height * 0.5);
      ctx.rotate(rotation);
      ctx.translate(-ctx.canvas.width * 0.5, -ctx.canvas.height * 0.5);
    }
    callback();
    ctx.restore();
  }

  clear() {
    this.trauma = 0;
    this.offsetX = 0;
    this.offsetY = 0;
    this.rotation = 0;
  }
}
