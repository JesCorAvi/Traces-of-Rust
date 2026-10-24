// Minijuego de prueba del sistema base. Cuatro fases cortas que ejercitan todos
// los gestos, el juice, la puntuación y el resultado. No es la cocina final.
// Exports: SandboxGame.

import { MiniGame } from '../../core/MiniGame.js';
import { Phase } from '../../core/Phase.js';
import { AssetFactory, PALETTE } from '../../assets/AssetFactory.js';
import {
  TAU, clamp, lerp, rand, pick, circle, fillRoundRect, strokeRoundRect,
  text, rgba, drawWoodSurface, drawPalmLeaf, drawVignette, drawBubble
} from '../../core/Draw.js';

const GESTURE_SPRITES = [
  'carrot', 'knife', 'pot', 'pan', 'saltshaker', 'plate', 'tomato', 'fish',
  'star', 'spark', 'gesture-drag', 'gesture-circle', 'gesture-shake',
  'gesture-tap', 'gesture-hold', 'gesture-zigzag', 'gesture-rub', 'gesture-flick'
];

const SANDBOX_SOUNDS = [
  'chop', 'slice', 'stir', 'sizzle', 'shake', 'splash', 'perfect', 'good',
  'fail', 'combo', 'tap', 'star', 'phaseClear'
];

class SandboxPhase extends Phase {
  constructor(options = {}) {
    super(options);
    this.difficulty = clamp(options.difficulty || 1, 1, 5);
    this.accent = options.accent || PALETTE.coral;
    this.visual = { scaleX: 1, scaleY: 1 };
  }

  onEnter() {
    this.width = this.game.width;
    this.height = this.game.height;
    this.juice = this.game.juice;
    this.audio = this.game.audio;
    this.assets = this.game.assets;
    this.updateLayout();
    this.resetState();
    this.syncInputTarget();
  }

  onResize() {
    this.width = this.game.width;
    this.height = this.game.height;
    this.updateLayout();
    this.syncInputTarget();
  }

  updateLayout() {}
  resetState() {}

  syncInputTarget() {
    this.game.input.clearCircleTarget();
  }

  drawSprite(ctx, id, x, y, scale = 1, options = {}) {
    const sprite = this.assets.getSprite(id);
    if (!sprite) return null;
    sprite.draw(ctx, x, y, { scale, ...options });
    return sprite;
  }

  drawPointerRing(ctx, x, y, color = PALETTE.cream, radius = 18) {
    ctx.save();
    ctx.globalAlpha = 0.8;
    circle(ctx, x, y, radius, null, PALETTE.ink, 4);
    circle(ctx, x, y, radius, null, color, 2);
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// FASE 1 · ARRASTRE
// ---------------------------------------------------------------------------

class DragPhase extends SandboxPhase {
  constructor(difficulty) {
    super({
      id: 'drag',
      title: 'ARRASTRE',
      kicker: 'FASE 1 · CUCHILLO',
      instruction: 'Mantén pulsado y arrastra el cuchillo por la línea de puntos. Corta limpio y sin salirte.',
      gesture: 'gesture-drag',
      duration: 10,
      weight: 1,
      hint: 'ARRASTRA DE IZQUIERDA A DERECHA · LOS CORTES LIMPIOS DAN MÁS PUNTOS',
      accent: PALETTE.coral,
      difficulty
    });
  }

  updateLayout() {
    const w = this.width;
    const h = this.height;
    const boardW = Math.min(w * 0.78, 780);
    const boardH = Math.min(h * 0.36, 224);
    this.board = {
      x: (w - boardW) / 2,
      y: h * 0.47,
      w: boardW,
      h: boardH
    };
    this.guide = {
      x0: this.board.x + boardW * 0.1,
      x1: this.board.x + boardW * 0.9,
      y: this.board.y + boardH * 0.54
    };
    this.carrot = {
      x: (this.guide.x0 + this.guide.x1) * 0.5,
      y: this.board.y + boardH * 0.76,
      scale: Math.min(1.05, boardH / 175)
    };
    this.tolerance = Math.max(17, 34 - this.difficulty * 2.3);
    this.knife = { x: this.guide.x0, y: this.guide.y - 20, rotation: -0.12 };
  }

  resetState() {
    this.progress = 0;
    this.attemptTime = 0;
    this.accuracySum = 0;
    this.cuts = 0;
    this.cutMarks = [];
    this.completed = false;
    this.lastSound = -1;
    this.lastWarn = -2;
    this.trail = [];
    this.hasDragged = false;
    this.knifeVisual = { scaleX: 1, scaleY: 1 };
    this.carrotVisual = { scaleX: 1, scaleY: 1 };
  }

  onUpdate(dt) {
    if (this.done) return;
    const input = this.game.input;
    const guide = this.guide;
    const inRangeX = input.x >= guide.x0 - 14 && input.x <= guide.x1 + 14;
    const t = clamp((input.x - guide.x0) / Math.max(1, guide.x1 - guide.x0));
    const distance = Math.abs(input.y - guide.y);
    const accuracy = clamp(1 - distance / this.tolerance);

    if (input.down && inRangeX) {
      this.hasDragged = true;
      this.progress = Math.max(this.progress, t);
      this.attemptTime += dt;
      this.accuracySum += accuracy * dt;
      this.trail.push({ x: input.x, y: input.y, life: 0.28, maxLife: 0.28, color: accuracy > 0.65 ? PALETTE.pineapple : PALETTE.coral });
      if (this.trail.length > 22) this.trail.shift();
      this.knife.x = input.x;
      this.knife.y = input.y;
      this.knife.rotation = clamp(-0.12 + input.dy * 0.004, -0.5, 0.35);

      if (this.elapsed - this.lastSound > 0.16) {
        this.lastSound = this.elapsed;
        this.audio.play('slice', { rate: 0.92 + Math.random() * 0.16, volume: 0.62 });
      }

      if (accuracy > 0.58 && Math.random() < 0.35) {
        this.juice.burst(input.x, input.y + 8, 2, {
          speed: [25, 80],
          angle: [Math.PI * 0.1, Math.PI * 0.9],
          colors: [PALETTE.coral, PALETTE.pineapple, PALETTE.cream],
          life: [0.2, 0.45],
          size: [1.5, 3.5],
          gravity: 180,
          shape: 'circle'
        });
      }

      const marks = [0.33, 0.66, 1.0];
      while (this.cuts < marks.length && this.progress >= marks[this.cuts]) {
        const cutX = lerp(guide.x0, guide.x1, marks[this.cuts]);
        this.cutMarks.push({ x: cutX, y: guide.y, spin: rand(-0.12, 0.12) });
        this.cuts++;
        const perfect = this.cuts === marks.length || accuracy > 0.72;
        this.game.registerHit(perfect ? 'perfect' : 'good', cutX, this.board.y + this.board.h * 0.2, {
          label: this.cuts === marks.length ? '¡CORTE PERFECTO!' : '¡CORTE!',
          target: this.carrotVisual,
          showText: this.cuts === marks.length
        });
        this.juice.burst(cutX, guide.y, 14, {
          speed: [80, 240],
          angle: [-Math.PI * 0.85, -Math.PI * 0.15],
          colors: [PALETTE.coral, PALETTE.tomato, PALETTE.pineapple, PALETTE.cream],
          life: [0.35, 0.8],
          size: [2, 6],
          gravity: 620,
          shape: ['circle', 'leaf'],
          endSize: 0.5
        });
        this.juice.shakeAdd(0.12);
        this.audio.play('chop', { volume: 0.8 });
      }

      if (this.progress >= 0.975 && accuracy > 0.22) {
        this.completed = true;
        this.game.registerHit('perfect', guide.x1, guide.y, {
          label: '¡CORTE LIMPIO!',
          target: this.carrotVisual,
          showText: false
        });
        this.juice.confetti(guide.x1, guide.y, 22);
        this.finish(this.getScore(), { completed: true });
      }
    } else if (!input.down && !this.hasDragged && this.elapsed - this.lastWarn > 1.4) {
      this.lastWarn = this.elapsed;
      this.juice.popText('MANTÉN PULSADO', this.width * 0.5, this.board.y - 18, {
        color: PALETTE.cream,
        size: 14,
        life: 0.7,
        vy: -26
      });
    }

    for (const point of this.trail) point.life -= dt;
    this.trail = this.trail.filter(point => point.life > 0);
    this.stats = { progress: this.progress, cuts: this.cuts, accuracy: this.getAccuracy() };
  }

  onTimeUp() {
    if (!this.completed) {
      this.game.registerMiss(this.width * 0.5, this.board.y + 20, this.progress > 0.55 ? '¡CASI!' : '¡CORTE A MEDIAS!');
    }
  }

  getAccuracy() {
    return this.attemptTime > 0 ? clamp(this.accuracySum / this.attemptTime) : 0;
  }

  getScore() {
    const accuracy = this.getAccuracy();
    const completion = clamp(this.progress);
    if (completion <= 0.02) return 0;
    let score = completion * (accuracy * 0.62 + 0.38);
    if (this.completed) score = Math.min(1, score + 0.08);
    if (this.progress < 0.35) score *= 0.72;
    return clamp(score);
  }

  render(ctx) {
    const board = this.board;
    const guide = this.guide;
    drawWoodSurface(ctx, board.x, board.y, board.w, board.h, {
      base: '#8a5a35',
      dark: '#5a351f',
      light: '#bd7b45',
      radius: 22,
      lineWidth: 5
    });
    // Tabla de corte elevada y asa.
    ctx.save();
    fillRoundRect(ctx, board.x + 18, board.y + 14, board.w - 36, board.h - 28, 18, '#c98d55');
    strokeRoundRect(ctx, board.x + 18, board.y + 14, board.w - 36, board.h - 28, 18, PALETTE.ink, 4);
    circle(ctx, board.x + board.w - 42, board.y + 38, 12, '#8a5a35', PALETTE.ink, 3);
    ctx.restore();

    // Guía punteada.
    ctx.save();
    ctx.strokeStyle = rgba(PALETTE.ink, 0.35);
    ctx.lineWidth = 8;
    ctx.setLineDash([9, 12]);
    ctx.beginPath();
    ctx.moveTo(guide.x0, guide.y);
    ctx.lineTo(guide.x1, guide.y);
    ctx.stroke();
    ctx.strokeStyle = rgba(PALETTE.cream, 0.8);
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.setLineDash([]);
    circle(ctx, guide.x0, guide.y, 8, PALETTE.lagoon, PALETTE.ink, 3);
    const pulse = 11 + Math.sin(this.elapsed * 6) * 3;
    circle(ctx, guide.x1, guide.y, pulse, null, PALETTE.pineapple, 3);
    ctx.restore();

    // Zanahoria tumbada sobre la guía.
    this.drawSprite(ctx, 'carrot', this.carrot.x, this.carrot.y, this.carrot.scale * 0.94, {
      rotation: Math.PI / 2,
      sx: this.carrotVisual.scaleX,
      sy: this.carrotVisual.scaleY
    });

    // Marcas de corte.
    for (const mark of this.cutMarks) {
      ctx.save();
      ctx.translate(mark.x, mark.y);
      ctx.rotate(mark.spin);
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, -54);
      ctx.lineTo(0, 54);
      ctx.stroke();
      ctx.strokeStyle = PALETTE.cream;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // Estela.
    for (const point of this.trail) {
      const alpha = clamp(point.life / point.maxLife);
      ctx.globalAlpha = alpha * 0.38;
      circle(ctx, point.x, point.y, 3 + alpha * 4, point.color);
    }
    ctx.globalAlpha = 1;

    // Cuchillo.
    const knifeX = this.game.input.down ? this.knife.x : guide.x0 + Math.sin(this.elapsed * 2.4) * 5;
    const knifeY = this.game.input.down ? this.knife.y : guide.y - 24 + Math.cos(this.elapsed * 3.1) * 4;
    this.drawSprite(ctx, 'knife', knifeX, knifeY, 0.78, {
      rotation: this.game.input.down ? this.knife.rotation : -0.12,
      sx: this.knifeVisual.scaleX,
      sy: this.knifeVisual.scaleY
    });
    if (!this.game.input.down) {
      this.drawPointerRing(ctx, guide.x0, guide.y + 34, PALETTE.pineapple, 15);
    }

    // Barra de progreso local.
    const barW = board.w * 0.7;
    const barX = board.x + (board.w - barW) / 2;
    const barY = board.y + board.h + 18;
    fillRoundRect(ctx, barX, barY, barW, 14, 7, rgba(PALETTE.ink, 0.7));
    const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    grad.addColorStop(0, PALETTE.coral);
    grad.addColorStop(0.65, PALETTE.mango);
    grad.addColorStop(1, PALETTE.lime);
    fillRoundRect(ctx, barX + 2, barY + 2, Math.max(0, (barW - 4) * this.progress), 10, 5, grad);
    strokeRoundRect(ctx, barX, barY, barW, 14, 7, PALETTE.ink, 2);
  }
}

// ---------------------------------------------------------------------------
// FASE 2 · CÍRCULOS
// ---------------------------------------------------------------------------

class CirclePhase extends SandboxPhase {
  constructor(difficulty) {
    super({
      id: 'circle',
      title: 'REMOVER',
      kicker: 'FASE 2 · OLLA',
      instruction: 'Haz círculos dentro de la olla. Mantén una velocidad constante y no salgas del borde.',
      gesture: 'gesture-circle',
      duration: 11,
      weight: 1,
      hint: 'CÍRCULOS CONSTANTES DENTRO DE LA OLLA · LA VELOCIDAD IMPORTA',
      accent: PALETTE.lagoon,
      difficulty
    });
    this.potVisual = { scaleX: 1, scaleY: 1 };
  }

  updateLayout() {
    const w = this.width;
    const h = this.height;
    const scale = Math.max(1.02, Math.min(w / 750, h / 480) * 1.15);
    this.potScale = scale;
    this.soup = { x: w * 0.5, y: h * 0.53 };
    this.circleTarget = {
      x: this.soup.x,
      y: this.soup.y,
      inner: Math.max(12, 15 * scale),
      outer: Math.max(30, 38 * scale)
    };
    this.targetSpeed = 4.5 + this.difficulty * 0.34;
    this.speedTolerance = 2.1 - this.difficulty * 0.12;
    this.turnsRequired = 1.7 + this.difficulty * 0.38;
  }

  syncInputTarget() {
    this.game.input.setCircleTarget(this.circleTarget);
  }

  resetState() {
    this.speedScoreSum = 0;
    this.speedTime = 0;
    this.lastHalfTurn = 0;
    this.lastStir = -1;
    this.lastSizzle = -1;
    this.lastSteam = -1;
    this.completed = false;
    this.circleStats = { turns: 0, angularSpeed: 0, inBandRatio: 0, consistency: 0 };
  }

  onUpdate(dt) {
    if (this.done) return;
    const stats = this.game.input.getCircleStats();
    this.circleStats = stats;
    if (stats.angularSpeed > 0.15) {
      const speedAccuracy = clamp(1 - Math.abs(stats.angularSpeed - this.targetSpeed) / (this.targetSpeed * 1.15));
      this.speedScoreSum += speedAccuracy * dt;
      this.speedTime += dt;
    }

    const halfTurns = Math.floor(stats.turns * 2);
    if (halfTurns > this.lastHalfTurn) {
      this.lastHalfTurn = halfTurns;
      const perfect = stats.consistency > 0.55 && stats.inBandRatio > 0.45;
      this.game.registerHit(perfect ? 'perfect' : 'good', this.soup.x, this.soup.y - 8, {
        label: perfect ? '¡REMOVIENDO!' : '¡SIGUE ASÍ!',
        target: this.potVisual,
        showText: perfect
      });
      this.juice.burst(this.soup.x, this.soup.y, 12, {
        speed: [40, 140],
        angle: [-Math.PI * 0.9, -Math.PI * 0.1],
        colors: [PALETTE.coral, PALETTE.mango, PALETTE.cream, PALETTE.lagoonLight],
        life: [0.3, 0.7],
        size: [2, 5],
        gravity: 520,
        shape: 'circle'
      });
      this.audio.play('splash', { volume: 0.72 });
    }

    if (this.elapsed - this.lastStir > 0.24) {
      this.lastStir = this.elapsed;
      this.audio.play('stir', { rate: 0.9 + Math.random() * 0.15, volume: 0.52 });
    }
    if (this.elapsed - this.lastSizzle > 0.5) {
      this.lastSizzle = this.elapsed;
      this.audio.play('sizzle', { volume: 0.44 });
    }
    if (this.elapsed - this.lastSteam > 0.16) {
      this.lastSteam = this.elapsed;
      this.juice.steam(this.soup.x + rand(-16, 16), this.soup.y - 28, 1);
    }
    if (stats.turns > 0.1 && Math.random() < 0.22) {
      this.juice.particles.spawn({
        x: this.soup.x + rand(-28, 28),
        y: this.soup.y + rand(-10, 10),
        vx: rand(-10, 10),
        vy: rand(-42, -18),
        life: rand(0.3, 0.65),
        size: rand(2, 5),
        endSize: 0,
        color: pick([PALETTE.mango, PALETTE.coral, PALETTE.cream]),
        gravity: -10,
        drag: 0.8,
        shape: 'circle',
        alpha: 0.8
      });
    }

    if (stats.turns >= this.turnsRequired && stats.inBandRatio > 0.3) {
      this.completed = true;
      this.game.registerHit('perfect', this.soup.x, this.soup.y - 20, { label: '¡EN SU PUNTO!', target: this.potVisual });
      this.juice.confetti(this.soup.x, this.soup.y - 20, 24);
      this.finish(this.getScore(), { completed: true });
    }

    this.stats = {
      turns: stats.turns,
      angularSpeed: stats.angularSpeed,
      inBandRatio: stats.inBandRatio,
      consistency: stats.consistency
    };
  }

  onTimeUp() {
    if (!this.completed) {
      this.game.registerMiss(this.soup.x, this.soup.y - 20, this.circleStats.turns > 0.8 ? '¡SE ENFRIÓ!' : '¡NI LO TOCASTE!');
    }
  }

  getScore() {
    const stats = this.circleStats;
    const turns = clamp(stats.turns / this.turnsRequired);
    const speed = this.speedTime > 0 ? clamp(this.speedScoreSum / this.speedTime) : 0;
    const band = clamp(stats.inBandRatio / 0.7);
    let score = turns * 0.45 + speed * 0.3 + band * 0.25;
    if (this.completed) score = Math.min(1, score + 0.06);
    if (stats.turns < 0.4) score *= 0.55;
    return clamp(score);
  }

  render(ctx) {
    const { x: cx, y: cy } = this.soup;
    const scale = this.potScale;
    const potWidth = 170 * scale;

    // Trivet.
    ctx.save();
    circle(ctx, cx, cy + 44 * scale, potWidth * 0.5, rgba(PALETTE.ink, 0.28));
    circle(ctx, cx, cy + 44 * scale, potWidth * 0.43, rgba(PALETTE.wood, 0.85), PALETTE.ink, 3);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      circle(ctx, cx + Math.cos(a) * potWidth * 0.36, cy + 44 * scale + Math.sin(a) * potWidth * 0.36 * 0.42, 3, PALETTE.woodDark);
    }
    ctx.restore();

    // Olla.
    const potY = cy + (0.86 * 150 - 56) * scale;
    this.drawSprite(ctx, 'pot', cx, potY, scale, {
      sx: this.potVisual.scaleX,
      sy: this.potVisual.scaleY
    });

    // Superficie del caldo, viva y por encima del sprite.
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, 46 * scale, 17 * scale, 0, 0, TAU);
    const soupGrad = ctx.createLinearGradient(0, cy - 18 * scale, 0, cy + 18 * scale);
    soupGrad.addColorStop(0, PALETTE.coralLight);
    soupGrad.addColorStop(0.55, PALETTE.tomato);
    soupGrad.addColorStop(1, PALETTE.coralDark);
    ctx.fillStyle = soupGrad;
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.clip();
    for (let i = 0; i < 7; i++) {
      const a = this.elapsed * (0.6 + i * 0.08) + i * 1.7;
      const r = (8 + i * 4 + Math.sin(this.elapsed * 2 + i) * 3) * scale;
      drawBubble(ctx, cx + Math.cos(a) * r, cy + Math.sin(a * 1.3) * r * 0.38, (2.5 + (i % 3) * 1.6) * scale, PALETTE.lagoonLight, 0.55);
    }
    ctx.restore();

    // Banda guía de remoción.
    const inner = this.circleTarget.inner;
    const outer = this.circleTarget.outer;
    const guideR = (inner + outer) * 0.5;
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = PALETTE.lagoonLight;
    ctx.lineWidth = Math.max(10, outer - inner);
    ctx.beginPath();
    ctx.arc(cx, cy, guideR, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 0.92;
    ctx.setLineDash([8, 10]);
    ctx.lineWidth = 4;
    ctx.strokeStyle = PALETTE.cream;
    ctx.beginPath();
    ctx.arc(cx, cy, guideR, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 0.65;
    ctx.strokeStyle = PALETTE.lagoon;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, outer, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, inner, 0, TAU);
    ctx.stroke();
    ctx.restore();

    // Flechas de giro.
    const arrowAngle = this.elapsed * 1.6;
    for (let i = 0; i < 4; i++) {
      const a = arrowAngle + (i / 4) * TAU;
      const ax = cx + Math.cos(a) * guideR;
      const ay = cy + Math.sin(a) * guideR;
      const tangent = a + Math.PI / 2;
      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(tangent);
      ctx.fillStyle = PALETTE.cream;
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-6, -6);
      ctx.lineTo(-6, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Cuchara de madera siguiendo al puntero.
    const pointerX = this.game.input.x || cx;
    const pointerY = this.game.input.y || cy;
    if (this.game.input.down || this.game.input.x || this.game.input.y) {
      drawSpoon(ctx, pointerX, pointerY, -0.7 + this.game.input.dx * 0.02, scale);
      this.drawPointerRing(ctx, pointerX, pointerY, this.speedInBand() ? PALETTE.lime : PALETTE.coral, 15);
    } else {
      drawSpoon(ctx, cx + guideR, cy, -0.7 + Math.sin(this.elapsed * 2) * 0.1, scale);
    }

    // Anillo de progreso alrededor de la olla.
    const progress = clamp(this.circleStats.turns / this.turnsRequired);
    const ringR = potWidth * 0.64;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = rgba(PALETTE.ink, 0.42);
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = PALETTE.lagoonLight;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, -Math.PI / 2, -Math.PI / 2 + TAU * progress);
    ctx.stroke();
    if (progress > 0.02) {
      const endAngle = -Math.PI / 2 + TAU * progress;
      circle(ctx, cx + Math.cos(endAngle) * ringR, cy + Math.sin(endAngle) * ringR, 6, PALETTE.cream, PALETTE.ink, 2);
    }
    ctx.restore();

    // Contador de vueltas.
    const turns = this.circleStats.turns || 0;
    fillRoundRect(ctx, 16, this.height - 46, 250, 30, 10, rgba(PALETTE.ink, 0.66));
    strokeRoundRect(ctx, 16, this.height - 46, 250, 30, 10, rgba(PALETTE.cream, 0.3), 2);
    text(ctx, `VUELTAS ${turns.toFixed(1)} / ${this.turnsRequired.toFixed(1)}`, 28, this.height - 31, {
      size: 11,
      family: '"Press Start 2P", monospace',
      color: PALETTE.cream,
      align: 'left',
      outline: PALETTE.ink,
      outlineWidth: 3
    });

    // Medidor de velocidad.
    drawSpeedMeter(ctx, cx, cy + 118 * scale, potWidth * 0.42, this.circleStats.angularSpeed, this.targetSpeed, this.speedTolerance);
  }

  speedInBand() {
    return Math.abs((this.circleStats?.angularSpeed || 0) - this.targetSpeed) <= this.speedTolerance * 0.7;
  }
}

function drawSpoon(ctx, x, y, rotation, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.lineCap = 'round';
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(0, -82);
  ctx.stroke();
  ctx.strokeStyle = PALETTE.woodLight;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(0, -82);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, -4, 17, 25, 0, 0, TAU);
  ctx.fillStyle = PALETTE.wood;
  ctx.fill();
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.globalAlpha = 0.34;
  ctx.fillStyle = PALETTE.cream;
  ctx.beginPath();
  ctx.ellipse(-5, -10, 5, 10, -0.2, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawSpeedMeter(ctx, x, y, width, speed, target, tolerance) {
  const height = 12;
  const left = x - width * 0.5;
  ctx.save();
  fillRoundRect(ctx, left, y, width, height, 6, rgba(PALETTE.ink, 0.6));
  const bandStart = clamp((target - tolerance) / (target * 2.2));
  const bandWidth = clamp((tolerance * 2) / (target * 2.2));
  fillRoundRect(ctx, left + width * bandStart, y + 2, width * bandWidth, height - 4, 4, rgba(PALETTE.lime, 0.8));
  const marker = clamp(speed / (target * 2.2));
  const mx = left + width * marker;
  ctx.fillStyle = PALETTE.cream;
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(mx, y - 6);
  ctx.lineTo(mx + 6, y - 14);
  ctx.lineTo(mx - 6, y - 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  text(ctx, 'VELOCIDAD', x, y + 28, {
    size: 10,
    family: '"Press Start 2P", monospace',
    color: PALETTE.cream,
    outline: PALETTE.ink,
    outlineWidth: 3
  });
  ctx.restore();
}

// ---------------------------------------------------------------------------
// FASE 3 · AGITAR / SAZONAR
// ---------------------------------------------------------------------------

class ShakePhase extends SandboxPhase {
  constructor(difficulty) {
    super({
      id: 'shake',
      title: 'SAZONAR',
      kicker: 'FASE 3 · SALERO',
      instruction: 'Mantén pulsado y agita el salero. Suelta cuando el nivel esté en la zona verde.',
      gesture: 'gesture-shake',
      duration: 10,
      weight: 1,
      hint: 'AGITA SIN PARAR · SUELTA EN LA ZONA VERDE',
      accent: PALETTE.mango,
      difficulty
    });
    this.shakerVisual = { scaleX: 1, scaleY: 1 };
    this.plateVisual = { scaleX: 1, scaleY: 1 };
    this.shaker = { x: 0, y: 0, rotation: 0 };
    this.band = { min: 0, max: 0, center: 0.62 };
  }

  updateLayout() {
    const w = this.width;
    const h = this.height;
    this.plate = { x: w * 0.5, y: h * 0.61, scale: Math.max(0.9, Math.min(w / 1000, h / 700) * 1.3) };
    this.bar = { x: w * 0.18, y: h * 0.84, w: w * 0.64, h: 34 };
    this.bandCenter = 0.62;
    this.bandHalf = Math.max(0.07, 0.13 - this.difficulty * 0.012);
    this.band = {
      center: this.bandCenter,
      min: this.bandCenter - this.bandHalf,
      max: this.bandCenter + this.bandHalf
    };
    this.shakerRest = { x: w * 0.62, y: h * 0.42 };
    this.shaker.x = this.game?.input?.x || this.shakerRest.x;
    this.shaker.y = this.game?.input?.y || this.shakerRest.y;
  }

  resetState() {
    this.season = 0.18;
    this.holding = false;
    this.wasHolding = false;
    this.released = false;
    this.completed = false;
    this.releaseAccuracy = 0;
    this.failLabel = '';
    this.shakeEnergy = 0;
    this.lastShakeSound = -1;
    this.lastSizzle = -1;
    this.saltTimer = 0;
    this.releaseTimer = 0;
    this.osc = { energy: 0, changes: 0, amplitude: 0 };
    this.stats = {};
  }

  onUpdate(dt) {
    if (this.done) return;
    const input = this.game.input;
    this.holding = input.down;
    const osc = input.getOscillation();
    this.osc = osc;
    const intensity = clamp(osc.energy / 620);
    this.shakeEnergy = intensity;

    if (this.holding) {
      this.shaker.x = input.x;
      this.shaker.y = input.y;
      this.shaker.rotation = clamp(input.dx * 0.018, -0.55, 0.55);
      this.season = clamp(this.season + dt * (0.018 + intensity * 0.27));
      if (intensity > 0.1) {
        const squashTimer = Math.floor(this.elapsed * 8);
        if (squashTimer !== this._lastSquash) {
          this._lastSquash = squashTimer;
          this.juice.squash(this.shakerVisual, { sx: 1.06, sy: 0.94, duration: 0.16 });
        }
      }
      this.saltTimer -= dt;
      if (this.saltTimer <= 0 && intensity > 0.04) {
        this.saltTimer = 0.045;
        for (let i = 0; i < 2 + Math.round(intensity * 3); i++) {
          this.juice.particles.spawn({
            x: this.shaker.x + rand(-10, 10),
            y: this.shaker.y + 28,
            vx: rand(-28, 28),
            vy: rand(90, 200),
            life: rand(0.35, 0.7),
            size: rand(1.5, 3.5),
            endSize: 0.5,
            color: PALETTE.salt,
            gravity: 540,
            drag: 0.5,
            shape: 'circle',
            alpha: 0.85
          });
        }
      }
      if (this.elapsed - this.lastShakeSound > 0.18 && intensity > 0.06) {
        this.lastShakeSound = this.elapsed;
        this.audio.play('shake', { rate: 0.92 + Math.random() * 0.18, volume: 0.62 });
      }
      if (this.elapsed - this.lastSizzle > 0.42) {
        this.lastSizzle = this.elapsed;
        this.audio.play('sizzle', { volume: 0.4 });
      }
    } else {
      this.shaker.x = lerp(this.shaker.x, this.shakerRest.x, 0.18);
      this.shaker.y = lerp(this.shaker.y, this.shakerRest.y, 0.18);
      this.shaker.rotation = lerp(this.shaker.rotation, -0.18, 0.16);
    }

    if (input.justReleased && this.wasHolding && !this.released) {
      this._release();
    }
    this.wasHolding = this.holding;
    this.stats = { season: this.season, energy: intensity, released: this.released };
  }

  onTimeUp() {
    if (!this.released) {
      this.released = true;
      this.completed = false;
      this.releaseAccuracy = 0;
      this.failLabel = '¡SE QUEMÓ!';
      this.game.registerMiss(this.width * 0.5, this.plate.y - 70, '¡SE QUEMÓ!');
      this.finish(0.08, { timeUp: true, released: false });
    }
  }

  _release() {
    this.released = true;
    const distance = Math.abs(this.season - this.band.center);
    const half = this.bandHalf;
    const inBand = distance <= half;
    if (inBand) {
      const accuracy = clamp(1 - distance / Math.max(0.001, half));
      const quality = clamp(accuracy * 0.72 + clamp(this.shakeEnergy) * 0.28);
      this.completed = true;
      this.releaseAccuracy = quality;
      this.game.registerHit(accuracy > 0.55 ? 'perfect' : 'good', this.shaker.x, this.shaker.y - 40, {
        label: accuracy > 0.55 ? '¡EN SU PUNTO!' : '¡BUEN TOQUE!',
        target: this.shakerVisual
      });
      this.juice.confetti(this.plate.x, this.plate.y - 40, 22);
      this.finish(quality, { released: true, inBand: true });
      return;
    }
    this.completed = false;
    this.releaseAccuracy = clamp(0.12 + Math.max(0, 1 - Math.abs(this.season - this.band.center) / 0.5) * 0.22);
    this.failLabel = this.season < this.band.min ? '¡POCO SAL!' : '¡SALADOS!';
    this.game.registerMiss(this.shaker.x, this.shaker.y - 40, this.failLabel);
    this.finish(this.releaseAccuracy, { released: true, inBand: false });
  }

  getScore() {
    return clamp(this.releaseAccuracy);
  }

  render(ctx) {
    const plate = this.plate;
    const scale = plate.scale;
    // Plato y montaña de sal.
    ctx.save();
    ctx.translate(plate.x, plate.y);
    circle(ctx, 0, 18 * scale, 88 * scale, rgba(PALETTE.ink, 0.22));
    this.drawSprite(ctx, 'plate', 0, 0, scale, {
      sx: this.plateVisual.scaleX,
      sy: this.plateVisual.scaleY
    });
    const saltSize = clamp(this.season);
    const mound = 8 + saltSize * 26 * scale;
    ctx.beginPath();
    ctx.ellipse(0, -2 * scale, 28 * scale + saltSize * 18 * scale, mound * 0.55, 0, Math.PI, TAU);
    ctx.closePath();
    const saltGrad = ctx.createLinearGradient(0, -mound, 0, 0);
    saltGrad.addColorStop(0, PALETTE.salt);
    saltGrad.addColorStop(1, '#c7d6cc');
    ctx.fillStyle = saltGrad;
    ctx.fill();
    ctx.strokeStyle = rgba(PALETTE.ink, 0.35);
    ctx.lineWidth = 2;
    ctx.stroke();
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU + this.elapsed * 0.2;
      const r = 10 + (i % 3) * 8 + saltSize * 14;
      ctx.globalAlpha = 0.5 + Math.sin(this.elapsed * 3 + i) * 0.2;
      circle(ctx, Math.cos(a) * r * 0.9, -mound * 0.35 + Math.sin(a) * r * 0.3, 1.6 + (i % 2), PALETTE.salt);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // Salero.
    const shakerX = this.shaker.x || this.shakerRest.x;
    const shakerY = this.shaker.y || this.shakerRest.y;
    this.drawSprite(ctx, 'saltshaker', shakerX, shakerY, 0.82, {
      rotation: this.shaker.rotation,
      sx: this.shakerVisual.scaleX,
      sy: this.shakerVisual.scaleY
    });
    if (this.holding) {
      this.drawPointerRing(ctx, shakerX, shakerY + 46, this.shakeEnergy > 0.18 ? PALETTE.lime : PALETTE.mango, 16);
    }

    // Barra de sazón.
    const bar = this.bar;
    const trackX = bar.x;
    const trackY = bar.y;
    const trackW = bar.w;
    const trackH = bar.h;
    fillRoundRect(ctx, trackX - 8, trackY - 12, trackW + 16, trackH + 34, 16, rgba(PALETTE.ink, 0.65));
    fillRoundRect(ctx, trackX, trackY, trackW, trackH, trackH / 2, '#3b2518');
    const fillW = trackW * clamp(this.season);
    const fillGrad = ctx.createLinearGradient(trackX, 0, trackX + Math.max(1, fillW), 0);
    fillGrad.addColorStop(0, PALETTE.salt);
    fillGrad.addColorStop(1, PALETTE.pineapple);
    fillRoundRect(ctx, trackX + 2, trackY + 2, Math.max(0, fillW - 4), trackH - 4, trackH / 2, fillGrad);
    const bandX = trackX + trackW * this.band.min;
    const bandW = trackW * (this.band.max - this.band.min);
    const bandGrad = ctx.createLinearGradient(0, trackY, 0, trackY + trackH);
    bandGrad.addColorStop(0, PALETTE.lime);
    bandGrad.addColorStop(1, '#3d9c3d');
    fillRoundRect(ctx, bandX, trackY + 3, bandW, trackH - 6, trackH / 2, bandGrad);
    strokeRoundRect(ctx, bandX, trackY + 3, bandW, trackH - 6, trackH / 2, PALETTE.cream, 2);
    const markerX = trackX + fillW;
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(markerX, trackY - 8);
    ctx.lineTo(markerX, trackY + trackH + 8);
    ctx.stroke();
    ctx.strokeStyle = PALETTE.cream;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(markerX, trackY - 8);
    ctx.lineTo(markerX + 7, trackY - 18);
    ctx.lineTo(markerX - 7, trackY - 18);
    ctx.closePath();
    ctx.fillStyle = PALETTE.cream;
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 2;
    ctx.stroke();

    text(ctx, 'SOSO', trackX + 4, trackY + trackH + 22, {
      size: 10, family: '"Press Start 2P", monospace', color: PALETTE.cream,
      align: 'left', outline: PALETTE.ink, outlineWidth: 3
    });
    text(ctx, 'PERFECTO', trackX + trackW * 0.5, trackY + trackH + 22, {
      size: 10, family: '"Press Start 2P", monospace', color: PALETTE.lime,
      align: 'center', outline: PALETTE.ink, outlineWidth: 3
    });
    text(ctx, 'SALADO', trackX + trackW - 4, trackY + trackH + 22, {
      size: 10, family: '"Press Start 2P", monospace', color: PALETTE.coral,
      align: 'right', outline: PALETTE.ink, outlineWidth: 3
    });

    // Medidor de agitado.
    const meterX = this.width * 0.5 - 90;
    const meterY = this.height * 0.15;
    const meterW = 180;
    fillRoundRect(ctx, meterX, meterY, meterW, 14, 7, rgba(PALETTE.ink, 0.55));
    const energyW = meterW * clamp(this.shakeEnergy);
    if (energyW > 2) {
      const energyGrad = ctx.createLinearGradient(meterX, 0, meterX + meterW, 0);
      energyGrad.addColorStop(0, PALETTE.mango);
      energyGrad.addColorStop(1, PALETTE.coral);
      fillRoundRect(ctx, meterX + 2, meterY + 2, energyW - 4, 10, 5, energyGrad);
    }
    text(ctx, 'AGITA EL SALERO', this.width * 0.5, meterY + 28, {
      size: 10, family: '"Press Start 2P", monospace', color: PALETTE.cream,
      outline: PALETTE.ink, outlineWidth: 3
    });
  }
}

// ---------------------------------------------------------------------------
// FASE 4 · RITMO
// ---------------------------------------------------------------------------

class TapPhase extends SandboxPhase {
  constructor(difficulty) {
    super({
      id: 'tap',
      title: 'RITMO',
      kicker: 'FASE 4 · TOMATES',
      instruction: 'Toca cada tomate justo cuando el aro se cierre sobre él. Encadena aciertos para subir el combo.',
      gesture: 'gesture-tap',
      duration: 13,
      weight: 1,
      hint: 'TOCA CUANDO EL ARO TOQUE EL TOMATE · ¡NO TARDE!',
      accent: PALETTE.tomato,
      difficulty
    });
    this.targets = [];
    this.resolved = 0;
    this.completed = false;
  }

  updateLayout() {
    this.playArea = {
      x: this.width * 0.12,
      y: this.height * 0.45,
      w: this.width * 0.76,
      h: this.height * 0.34
    };
  }

  resetState() {
    this.targets = [];
    this.resolved = 0;
    this.completed = false;
    this.hitCount = 0;
    this.beatPulse = 0;
    const slots = [
      [0.18, 0.28], [0.5, 0.2], [0.82, 0.3],
      [0.26, 0.72], [0.56, 0.62], [0.82, 0.7]
    ];
    const spacing = Math.max(0.86, 1.06 - this.difficulty * 0.03);
    for (let i = 0; i < slots.length; i++) {
      this.targets.push({
        nx: clamp(slots[i][0] + rand(-0.035, 0.035), 0.1, 0.9),
        ny: clamp(slots[i][1] + rand(-0.035, 0.035), 0.12, 0.86),
        spawn: 0.55 + i * spacing,
        life: 1.24,
        perfectAge: 0.82,
        perfectWindow: Math.max(0.075, 0.155 - this.difficulty * 0.012),
        state: 'pending',
        age: -1,
        accuracy: 0,
        entered: false,
        visual: { scaleX: 1, scaleY: 1 }
      });
    }
  }

  _targetPosition(target) {
    const area = this.playArea;
    return {
      x: area.x + area.w * target.nx,
      y: area.y + area.h * target.ny
    };
  }

  onUpdate(dt) {
    if (this.done) return;
    this.beatPulse += dt * 3.4;
    for (const target of this.targets) {
      if (target.state !== 'pending') continue;
      target.age = this.elapsed - target.spawn;
      if (!target.entered && target.age >= 0) {
        target.entered = true;
        this.audio.play('pop', { rate: 0.9 + Math.random() * 0.2, volume: 0.5 });
        const pos = this._targetPosition(target);
        this.juice.burst(pos.x, pos.y, 6, {
          speed: [20, 70],
          angle: [0, TAU],
          colors: [PALETTE.tomato, PALETTE.coral, PALETTE.cream],
          life: [0.2, 0.45],
          size: [1.5, 3],
          gravity: 60,
          shape: 'circle'
        });
      }
      if (target.age > target.life) {
        target.state = 'miss';
        this.resolved++;
        const pos = this._targetPosition(target);
        this.game.registerMiss(pos.x, pos.y, '¡SE PASÓ!');
        this.audio.play('pop', { rate: 0.6, volume: 0.35 });
      }
    }
    if (this.resolved >= this.targets.length && !this.completed) {
      this.completed = true;
      this.juice.confetti(this.width * 0.5, this.height * 0.4, 30);
      this.finish(this.getScore(), { completed: true });
    }
    this.stats = { resolved: this.resolved, hits: this.hitCount };
  }

  onPointerDownInternal(input, event, point) {
    if (this.done) return;
    let best = null;
    let bestDist = Infinity;
    for (const target of this.targets) {
      if (target.state !== 'pending') continue;
      if (target.age < 0.08 || target.age > target.life) continue;
      const pos = this._targetPosition(target);
      const radius = 42 + (1 - target.age / target.life) * 26;
      const distance = Math.hypot(point.x - pos.x, point.y - pos.y);
      if (distance <= radius && distance < bestDist) {
        best = target;
        bestDist = distance;
      }
    }
    if (!best) return;

    const pos = this._targetPosition(best);
    const delta = Math.abs(best.age - best.perfectAge);
    let accuracy = 0;
    if (delta <= best.perfectWindow) {
      accuracy = 1;
      best.state = 'hit';
      this.game.registerHit('perfect', pos.x, pos.y, { label: '¡PERFECTO!', target: best.visual });
      this.juice.confetti(pos.x, pos.y, 18);
      this.audio.play('tap', { rate: 1.12, volume: 0.65 });
    } else if (delta <= best.perfectWindow * 2.4) {
      accuracy = 0.62;
      best.state = 'hit';
      this.game.registerHit('good', pos.x, pos.y, { label: '¡BIEN!', target: best.visual });
      this.audio.play('tap', { volume: 0.55 });
    } else {
      accuracy = 0.18;
      best.state = 'miss';
      this.game.registerMiss(pos.x, pos.y, best.age < best.perfectAge ? '¡MUY PRONTO!' : '¡TARDE!');
      this.audio.play('error', { volume: 0.5 });
    }
    best.accuracy = accuracy;
    best.hitAt = this.elapsed;
    this.resolved++;
    this.hitCount += best.state === 'hit' ? 1 : 0;
    this.juice.burst(pos.x, pos.y, 14, {
      speed: [80, 240],
      angle: [0, TAU],
      colors: [PALETTE.tomato, PALETTE.coral, PALETTE.pineapple, PALETTE.cream],
      life: [0.35, 0.8],
      size: [2, 6],
      gravity: 620,
      shape: ['circle', 'leaf'],
      endSize: 0.5
    });
    this.juice.shakeAdd(accuracy >= 0.62 ? 0.1 : 0.18);
  }

  onTimeUp() {
    if (this.completed) return;
    for (const target of this.targets) {
      if (target.state === 'pending') {
        target.state = 'miss';
        target.accuracy = 0;
      }
    }
  }

  getScore() {
    if (!this.targets.length) return 0;
    let sum = 0;
    let resolved = 0;
    for (const target of this.targets) {
      if (target.state === 'hit') sum += target.accuracy;
      if (target.state !== 'pending') resolved++;
    }
    const accuracy = sum / this.targets.length;
    const completion = resolved / this.targets.length;
    return clamp(accuracy * 0.82 + completion * 0.18);
  }

  render(ctx) {
    const area = this.playArea;
    // Panel de ritmo.
    ctx.save();
    fillRoundRect(ctx, area.x - 18, area.y - 26, area.w + 36, area.h + 52, 22, rgba(PALETTE.ink, 0.32));
    strokeRoundRect(ctx, area.x - 18, area.y - 26, area.w + 36, area.h + 52, 22, rgba(PALETTE.cream, 0.22), 2);
    ctx.restore();

    for (const target of this.targets) {
      if (target.age < 0 && target.state === 'pending') continue;
      const pos = this._targetPosition(target);
      const scale = Math.max(0.52, Math.min(0.78, this.width / 1500));
      if (target.state === 'hit') {
        const t = clamp((this.elapsed - (target.hitAt || this.elapsed)) / 0.45);
        this.drawSprite(ctx, 'tomato', pos.x, pos.y, scale * (1 + t * 0.3), {
          alpha: 1 - t * 0.55,
          sx: target.visual.scaleX,
          sy: target.visual.scaleY
        });
        ctx.save();
        ctx.globalAlpha = 1 - t * 0.6;
        ctx.strokeStyle = PALETTE.lime;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(pos.x - 18, pos.y);
        ctx.lineTo(pos.x - 6, pos.y + 14);
        ctx.lineTo(pos.x + 22, pos.y - 18);
        ctx.stroke();
        ctx.restore();
      } else if (target.state === 'miss') {
        this.drawSprite(ctx, 'tomato', pos.x, pos.y, scale, {
          rotation: 0.22,
          alpha: 0.42,
          sx: target.visual.scaleX,
          sy: target.visual.scaleY
        });
        ctx.save();
        ctx.globalAlpha = 0.65;
        ctx.strokeStyle = PALETTE.danger;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(pos.x - 16, pos.y - 16);
        ctx.lineTo(pos.x + 16, pos.y + 16);
        ctx.moveTo(pos.x + 16, pos.y - 16);
        ctx.lineTo(pos.x - 16, pos.y + 16);
        ctx.stroke();
        ctx.restore();
      } else {
        const age = Math.max(0, target.age);
        const progress = clamp(age / target.life);
        const bob = Math.sin(this.elapsed * 7 + target.spawn * 10) * 4;
        this.drawSprite(ctx, 'tomato', pos.x, pos.y + bob, scale, {
          sx: target.visual.scaleX,
          sy: target.visual.scaleY
        });
        const ringRadius = 26 + (1 - progress) * 46;
        const timingDelta = Math.abs(age - target.perfectAge);
        const ringColor = timingDelta <= target.perfectWindow
          ? PALETTE.lime
          : timingDelta <= target.perfectWindow * 2.4
            ? PALETTE.pineapple
            : PALETTE.coral;
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = PALETTE.ink;
        ctx.lineWidth = 7;
        circle(ctx, pos.x, pos.y + bob, ringRadius, null, PALETTE.ink, 7);
        circle(ctx, pos.x, pos.y + bob, ringRadius, null, ringColor, 4);
        if (timingDelta <= target.perfectWindow) {
          ctx.globalAlpha = 0.5 + Math.sin(this.elapsed * 18) * 0.2;
          circle(ctx, pos.x, pos.y + bob, ringRadius + 6, null, PALETTE.cream, 2);
        }
        ctx.restore();
      }
    }

    // Barra de ritmo.
    const beatY = this.height * 0.87;
    const beatX = this.width * 0.28;
    const beatW = this.width * 0.44;
    const spacing = Math.max(0.86, 1.06 - this.difficulty * 0.03);
    const local = (this.elapsed % spacing) / spacing;
    fillRoundRect(ctx, beatX, beatY, beatW, 12, 6, rgba(PALETTE.ink, 0.62));
    for (let i = 0; i < 8; i++) {
      const x = beatX + (i / 8) * beatW;
      circle(ctx, x, beatY + 6, i % 2 === 0 ? 3 : 2, rgba(PALETTE.cream, 0.45));
    }
    const pulseX = beatX + local * beatW;
    circle(ctx, pulseX, beatY + 6, 9, PALETTE.tomato, PALETTE.ink, 3);
    text(ctx, 'RITMO', beatX - 24, beatY + 6, {
      size: 10, family: '"Press Start 2P", monospace', color: PALETTE.cream,
      align: 'right', outline: PALETTE.ink, outlineWidth: 3
    });
    text(ctx, '¡TOCA EL TOMATE!', this.width * 0.5, beatY + 34, {
      size: 10, family: '"Press Start 2P", monospace', color: PALETTE.cream,
      align: 'center', outline: PALETTE.ink, outlineWidth: 3
    });
  }
}

// ---------------------------------------------------------------------------
// Minijuego
// ---------------------------------------------------------------------------

export class SandboxGame extends MiniGame {
  constructor({ services, difficulty = 1, options = {} } = {}) {
    super({
      id: 'sandbox',
      title: 'LABORATORIO DE GESTOS',
      difficulty,
      services,
      options
    });
    this.resultTitle = 'LABORATORIO COMPLETADO';
    this._background = null;
    this._backgroundKey = '';
  }

  createPhases() {
    return [
      new DragPhase(this.difficulty),
      new CirclePhase(this.difficulty),
      new ShakePhase(this.difficulty),
      new TapPhase(this.difficulty)
    ];
  }

  onInit() {
    this.assets.preload({
      sprites: GESTURE_SPRITES,
      sounds: SANDBOX_SOUNDS,
      models: []
    });
  }

  onResize() {
    this._background = null;
    this._backgroundKey = '';
  }

  buildRewards(stars = 1, accuracy = 0) {
    return {
      pearls: stars,
      ingredients: { carrot: stars },
      extra: stars === 3 ? ['INGREDIENTE RARO: SAL DORADA'] : [],
      accuracy: Math.round(accuracy * 100)
    };
  }

  drawBackground(ctx, width, height) {
    const key = `${width}x${height}`;
    if (!this._background || this._backgroundKey !== key) {
      this._background = this._buildBackground(width, height);
      this._backgroundKey = key;
    }
    if (this._background) ctx.drawImage(this._background, 0, 0, width, height);
    else {
      ctx.fillStyle = PALETTE.inkBlue;
      ctx.fillRect(0, 0, width, height);
    }
  }

  _buildBackground(width, height) {
    if (typeof document === 'undefined') return null;
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.scale(scale, scale);

    // Cielo y mar del atardecer.
    const sky = ctx.createLinearGradient(0, 0, 0, height * 0.58);
    sky.addColorStop(0, PALETTE.skyTop);
    sky.addColorStop(0.45, PALETTE.skyMid);
    sky.addColorStop(1, PALETTE.skyLow);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height * 0.6);
    const sun = ctx.createRadialGradient(width * 0.78, height * 0.2, 8, width * 0.78, height * 0.2, height * 0.24);
    sun.addColorStop(0, 'rgba(255,240,168,0.96)');
    sun.addColorStop(0.35, 'rgba(255,207,74,0.32)');
    sun.addColorStop(1, 'rgba(255,138,101,0)');
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, width, height * 0.6);
    circle(ctx, width * 0.78, height * 0.2, height * 0.075, PALETTE.sun);

    const sea = ctx.createLinearGradient(0, height * 0.38, 0, height * 0.62);
    sea.addColorStop(0, PALETTE.sea);
    sea.addColorStop(1, PALETTE.seaDeep);
    ctx.fillStyle = sea;
    ctx.fillRect(0, height * 0.38, width, height * 0.24);
    for (let i = 0; i < 18; i++) {
      const y = height * 0.39 + (i / 18) * height * 0.2;
      const w = width * rand(0.05, 0.22);
      ctx.globalAlpha = 0.12 + (1 - i / 18) * 0.14;
      fillRoundRect(ctx, rand(0, width - w), y, w, 2, 2, PALETTE.cream);
    }
    ctx.globalAlpha = 1;

    // Mostrador de madera.
    drawWoodSurface(ctx, -30, height * 0.47, width + 60, height * 0.6, {
      base: '#7a4a2b',
      dark: '#4a2a18',
      light: '#ad6d40',
      radius: 0,
      lineWidth: 0
    });
    // Mantel de rayas.
    ctx.save();
    ctx.globalAlpha = 0.85;
    const clothY = height * 0.47;
    ctx.fillStyle = PALETTE.coral;
    ctx.fillRect(0, clothY, width, 18);
    ctx.fillStyle = PALETTE.cream;
    for (let x = -20; x < width + 20; x += 42) {
      ctx.save();
      ctx.translate(x, clothY);
      ctx.rotate(-0.18);
      ctx.fillRect(0, -20, 16, 54);
      ctx.restore();
    }
    ctx.restore();

    // Tabla central.
    const boardW = Math.min(width * 0.8, 800);
    const boardH = Math.min(height * 0.38, 230);
    const boardX = (width - boardW) / 2;
    const boardY = height * 0.46;
    drawWoodSurface(ctx, boardX, boardY, boardW, boardH, {
      base: '#91613c',
      dark: '#5b361f',
      light: '#c18551',
      radius: 26,
      lineWidth: 5
    });
    ctx.save();
    circle(ctx, boardX + boardW - 38, boardY + 34, 13, '#5b361f', PALETTE.ink, 3);
    ctx.restore();

    // Palmeras en las esquinas.
    drawPalmLeaf(ctx, -20, height * 0.12, width * 0.24, 0.35, PALETTE.leafDark);
    drawPalmLeaf(ctx, width + 20, height * 0.08, width * 0.22, Math.PI - 0.35, PALETTE.leafDark);
    drawPalmLeaf(ctx, -10, height * 0.4, width * 0.18, 0.7, PALETTE.leaf);
    drawPalmLeaf(ctx, width + 10, height * 0.4, width * 0.18, Math.PI - 0.7, PALETTE.leaf);

    // Guirnalda de luces.
    ctx.save();
    ctx.strokeStyle = rgba(PALETTE.ink, 0.7);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.08);
    ctx.quadraticCurveTo(width * 0.5, height * 0.16, width, height * 0.07);
    ctx.stroke();
    for (let i = 0; i < 14; i++) {
      const t = i / 14;
      const x = t * width;
      const y = height * 0.08 + Math.sin(t * Math.PI) * height * 0.07 + 4;
      const glow = ctx.createRadialGradient(x, y, 1, x, y, 10);
      glow.addColorStop(0, 'rgba(255,229,138,0.95)');
      glow.addColorStop(1, 'rgba(255,178,63,0)');
      ctx.fillStyle = glow;
      circle(ctx, x, y, 10, glow);
      circle(ctx, x, y, 3.5, i % 3 === 0 ? PALETTE.coral : PALETTE.pineapple);
    }
    ctx.restore();

    // Viñeta.
    drawVignette(ctx, width, height, 0.32);
    return canvas;
  }
}
