// Fase 2 de cosecha: frotar rápido para quitar la tierra del fruto.
// Exports: CleanPhase.

import { HarvestPhase } from '../HarvestPhase.js';
import { PALETTE } from '../../../assets/palette.js';
import { drawSoilPatch } from '../HarvestArt.js';
import {
  TAU, clamp, rand, circle, ellipse, fillRoundRect, strokeRoundRect, text, rgba, drawHand
} from '../../../core/Draw.js';

export class CleanPhase extends HarvestPhase {
  constructor(options = {}) {
    super({
      ...options,
      id: 'clean',
      title: 'LIMPIAR',
      kicker: 'FASE 2 · LIMPIAR',
      instruction: 'Frota rápido sobre el fruto para quitar la tierra. Cuanto más limpio, mejor será la cosecha.',
      gesture: 'gesture-rub',
      duration: 8,
      weight: 0.9,
      hint: 'FROTA DE IZQUIERDA A DERECHA · QUITA TODA LA TIERRA',
      accent: PALETTE.mango
    });
  }

  updateLayout() {
    const w = this.width;
    const h = this.height;
    this.produceCenter = { x: w * 0.5, y: h * 0.53 };
    this.produceScale = Math.max(1.1, Math.min(w / 760, h / 500) * 1.55);
    this.produceRadius = 80 * this.produceScale;
    this.table = { x: w * 0.22, y: h * 0.74, w: w * 0.56, h: h * 0.12 };
    this.cleanBar = { x: w * 0.27, y: h * 0.87, w: w * 0.46, h: 22 };
  }

  resetState() {
    this.initialDirt = clamp(0.58 + this.difficulty * 0.035, 0.55, 0.78);
    this.dirt = this.initialDirt;
    this.spots = Array.from({ length: 13 }, (_, i) => {
      const a = rand(0, TAU);
      const r = rand(0.12, 0.82);
      return {
        x: Math.cos(a) * r * 72,
        y: Math.sin(a) * r * 42,
        size: rand(6, 15),
        shade: i % 3,
        opacity: rand(0.45, 0.9)
      };
    });
    this.lastScrubSound = -1;
    this.lastDirtParticle = -1;
    this.completed = false;
    this.scrubTime = 0;
    this.cleanSparkle = 0;
  }

  onUpdate(dt) {
    if (this.done || this.completed) return;
    const input = this.game.input;
    const center = this.produceCenter;
    const near = Math.hypot(input.x - center.x, input.y - center.y) <= this.produceRadius * 1.05;
    if (input.down && near) {
      const osc = input.getOscillation();
      const energy = clamp(osc.energy / 520);
      const changes = osc.changes || 0;
      const scrub = energy * 0.75 + Math.min(0.3, changes * 0.035);
      if (scrub > 0.08) {
        this.scrubTime += dt;
        this.dirt = Math.max(0, this.dirt - dt * (0.08 + scrub * 0.9));
        this.cleanSparkle = Math.min(1, this.cleanSparkle + dt * 2);
        if (this.elapsed - this.lastScrubSound > 0.12) {
          this.lastScrubSound = this.elapsed;
          this.game.audio.play('scrub', { rate: 0.9 + Math.random() * 0.2, volume: 0.48 });
        }
        if (this.elapsed - this.lastDirtParticle > 0.055) {
          this.lastDirtParticle = this.elapsed;
          for (let i = 0; i < 2; i++) {
            this.game.juice.particles.spawn({
              x: center.x + rand(-52, 52) * this.produceScale * 0.6,
              y: center.y + rand(-28, 30),
              vx: rand(-100, 100),
              vy: rand(-140, -20),
              life: rand(0.25, 0.6),
              size: rand(1.5, 4.5),
              color: rand(0, 1) > 0.4 ? '#5c3b25' : '#7a5133',
              gravity: 620,
              drag: 1,
              shape: 'circle',
              alpha: 0.8
            });
          }
        }
      }
    }
    if (this.dirt <= 0.035) {
      this.completed = true;
      this.game.registerHit('perfect', center.x, center.y - this.produceRadius * 0.7, {
        label: '¡FRUTO LIMPIO!'
      });
      this.game.audio.play('harvest', { rate: 1.12, volume: 0.85 });
      this.game.juice.burst(center.x, center.y, 24, {
        speed: [60, 220],
        angle: [0, TAU],
        colors: [PALETTE.cream, PALETTE.lime, PALETTE.pineapple, this.cropColor],
        life: [0.35, 0.9],
        size: [2, 5],
        gravity: 380,
        shape: ['spark', 'circle'],
        glow: true
      });
      this.finish(this.getScore(), { dirt: this.dirt });
    }
  }

  onTimeUp() {
    if (!this.completed) {
      this.game.registerMiss(this.produceCenter.x, this.produceCenter.y - 30, this.dirt < 0.25 ? '¡CASI LIMPIO!' : '¡MUY SUCIO!');
    }
  }

  getScore() {
    if (this.scrubTime <= 0) return 0;
    const removed = 1 - clamp(this.dirt / Math.max(0.001, this.initialDirt));
    const speed = clamp(1 - this.elapsed / this.duration * 0.35);
    return clamp(removed * 0.82 + speed * 0.18);
  }

  render(ctx) {
    const center = this.produceCenter;
    drawSoilPatch(ctx, this.table.x, this.table.y, this.table.w, this.table.h, this.elapsed);
    this.drawProduce(ctx, center.x, center.y, this.produceScale, {
      rotation: Math.sin(this.elapsed * 1.8) * 0.03,
      sx: 1 + Math.sin(this.elapsed * 18) * this.cleanSparkle * 0.008 * (this.game.input.down ? 1 : 0),
      sy: 1 + Math.cos(this.elapsed * 17) * this.cleanSparkle * 0.008 * (this.game.input.down ? 1 : 0)
    });
    // Tierra.
    const dirtRatio = clamp(this.dirt / Math.max(0.001, this.initialDirt));
    for (const spot of this.spots) {
      ctx.save();
      ctx.globalAlpha = spot.opacity * dirtRatio;
      const x = center.x + spot.x * this.produceScale;
      const y = center.y + spot.y * this.produceScale;
      ctx.fillStyle = spot.shade === 0 ? '#5c3b25' : spot.shade === 1 ? '#7a5133' : '#8b6845';
      ctx.beginPath();
      ctx.ellipse(x, y, spot.size, spot.size * 0.58, (spot.x + spot.y) * 0.02, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    // Brillo limpio.
    if (dirtRatio < 0.5) {
      ctx.save();
      ctx.globalAlpha = (1 - dirtRatio) * 0.55;
      const shine = ctx.createRadialGradient(center.x - 20, center.y - 20, 2, center.x, center.y, 60 * this.produceScale);
      shine.addColorStop(0, 'rgba(255,255,255,0.8)');
      shine.addColorStop(1, 'rgba(255,255,255,0)');
      circle(ctx, center.x, center.y, 60 * this.produceScale, shine);
      for (let i = 0; i < 4; i++) {
        const a = this.elapsed * 2 + i * 1.6;
        circle(ctx, center.x + Math.cos(a) * 60, center.y + Math.sin(a) * 34, 2.4, PALETTE.pineapple);
      }
      ctx.restore();
    }

    const input = this.game.input;
    if (input.down) {
      drawHand(ctx, input.x, input.y, 0.66, Math.sin(this.elapsed * 20) * 0.12, PALETTE.cream);
      this.drawPointerRing(ctx, input.x, input.y, this.dirt < 0.2 ? PALETTE.lime : PALETTE.mango, 16);
    } else {
      this.drawPointerRing(ctx, center.x, center.y + this.produceRadius * 0.55, PALETTE.pineapple, 15);
      this.drawNote(ctx, 'FROTA SOBRE EL FRUTO', center.x, center.y - this.produceRadius * 0.9, {
        size: 10,
        color: PALETTE.paper
      });
    }

    // Barra de limpieza.
    const bar = this.cleanBar;
    fillRoundRect(ctx, bar.x - 8, bar.y - 8, bar.w + 16, bar.h + 34, 12, rgba(PALETTE.ink, 0.62));
    fillRoundRect(ctx, bar.x, bar.y, bar.w, bar.h, bar.h * 0.5, '#3b2518');
    const clean = 1 - dirtRatio;
    const grad = ctx.createLinearGradient(bar.x, 0, bar.x + bar.w, 0);
    grad.addColorStop(0, PALETTE.lagoonLight);
    grad.addColorStop(1, PALETTE.lime);
    fillRoundRect(ctx, bar.x + 2, bar.y + 2, Math.max(0, (bar.w - 4) * clean), bar.h - 4, bar.h * 0.5, grad);
    strokeRoundRect(ctx, bar.x, bar.y, bar.w, bar.h, bar.h * 0.5, PALETTE.ink, 2);
    this.drawCounterPill(ctx, `LIMPIEZA ${Math.round(clean * 100)}%`, 16, 64, {
      width: 160,
      size: 9,
      color: clean > 0.8 ? PALETTE.lime : PALETTE.mango
    });
    this.drawNote(ctx, 'FROTA DE IZQUIERDA A DERECHA', this.width * 0.5, this.height * 0.2, {
      size: 9,
      color: PALETTE.paper
    });
  }
}
