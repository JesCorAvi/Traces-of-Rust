// Vista DOM del minijuego: marco, tarjeta de instrucción, combo, progreso,
// sello de fase y pantalla de resultado. El canvas lo gestiona el runner.
// Exports: MinigameView.

import { AssetFactory, PALETTE } from '../assets/AssetFactory.js';
import { applyPaletteVars } from '../assets/palette.js';
import { clamp } from '../core/Draw.js';

let overlayCounter = 0;

const REWARD_LABELS = Object.freeze({
  crab: 'CANGREJO',
  fish: 'PESCADO',
  coconut: 'COCO',
  pineapple: 'PIÑA',
  rice: 'ARROZ',
  lime: 'LIMA',
  tomato: 'TOMATE',
  chili: 'CHILE',
  onion: 'CEBOLLA',
  mango: 'MANGO',
  carrot: 'ZANAHORIA',
  pearls: 'PERLAS',
  golden_salt: 'SAL DORADA'
});

function formatRewardKey(key) {
  return REWARD_LABELS[key] || String(key)
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toUpperCase();
}

export class MinigameView {
  constructor(options = {}) {
    this.options = options;
    this.title = options.title || 'MINIJUEGO';
    this.kicker = options.kicker || 'CHIRINGUITO // MINIJUEGO';
    this.difficulty = options.difficulty || 1;
    this.onAbort = options.onAbort || null;
    this.onContinue = options.onContinue || null;
    this.mount = options.mount || document.body;
    this.overlay = null;
    this.stage = null;
    this.canvas = null;
    this.hud = null;
    this.instruction = null;
    this.instructionKicker = null;
    this.instructionTitle = null;
    this.instructionText = null;
    this.gestureCanvas = null;
    this.countdownEl = null;
    this.phaseLabelEl = null;
    this.progressFill = null;
    this.scoreEl = null;
    this.comboEl = null;
    this.comboValue = null;
    this.comboFill = null;
    this.stamp = null;
    this.result = null;
    this.resultTitle = null;
    this.starsEl = null;
    this.rankEl = null;
    this.resultScore = null;
    this.resultBreakdown = null;
    this.resultRewards = null;
    this.continueButton = null;
    this.hintEl = null;
    this.errorEl = null;
    this._resizeObserver = null;
    this._windowResize = null;
    this._abortHandler = null;
    this._continueHandler = null;
    this._lastProgress = -1;
    this._build();
  }

  _build() {
    const overlay = document.createElement('div');
    overlay.className = 'overlay mg-overlay hidden';
    overlay.id = `mg-overlay-${++overlayCounter}`;
    overlay.setAttribute('aria-hidden', 'true');
    applyPaletteVars(overlay);

    overlay.innerHTML = `
      <div class="mg-frame" role="dialog" aria-modal="true" aria-label="${this.title}" tabindex="-1">
        <header class="mg-header">
          <div class="mg-heading">
            <span class="mg-kicker"></span>
            <span class="mg-title"></span>
          </div>
          <div class="mg-header-right">
            <span class="mg-difficulty">DIFICULTAD ${this.difficulty}/5</span>
            <button type="button" class="mg-btn ghost mg-abort">[ SALIR (ESC) ]</button>
          </div>
        </header>
        <div class="mg-stage">
          <canvas class="mg-canvas" aria-label="Área de juego del minijuego"></canvas>
          <div class="mg-hud" aria-hidden="true">
            <div class="mg-combo hidden">
              <span>COMBO</span>
              <b>x0</b>
              <div class="mg-combo-track"><i></i></div>
            </div>
            <div class="mg-phase-box">
              <span class="mg-phase-label">PREPARANDO...</span>
              <div class="mg-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div>
              <span class="mg-score">PRECISIÓN 0%</span>
            </div>
          </div>
          <div class="mg-instruction hidden" aria-live="polite">
            <div class="mg-instruction-card">
              <div class="mg-gesture-wrap">
                <canvas class="mg-gesture" width="320" height="320" aria-hidden="true"></canvas>
              </div>
              <span class="mg-instruction-kicker">FASE</span>
              <h2 class="mg-instruction-title">PREPARADO</h2>
              <p class="mg-instruction-text">SIGUE LA INDICACIÓN.</p>
              <div class="mg-countdown">3</div>
            </div>
          </div>
          <div class="mg-phase-stamp hidden" aria-live="polite">
            <span class="mg-stamp-kicker"></span>
            <strong></strong>
            <em></em>
          </div>
          <div class="mg-result hidden" role="dialog" aria-modal="true" aria-label="Resultado del minijuego">
            <div class="mg-result-card">
              <span class="mg-result-kicker">RESULTADO</span>
              <h2 class="mg-result-title">MINIJUEGO COMPLETADO</h2>
              <div class="mg-stars" aria-label="Estrellas"></div>
              <div class="mg-rank"></div>
              <div class="mg-result-score"></div>
              <div class="mg-result-breakdown"></div>
              <div class="mg-result-rewards"></div>
              <button type="button" class="mg-btn primary mg-continue">CONTINUAR</button>
            </div>
          </div>
          <div class="mg-error hidden" role="alert"></div>
        </div>
        <footer class="mg-footer">
          <span class="mg-hint">USA EL RATÓN O EL DEDO. ESC PARA SALIR.</span>
          <span class="mg-footer-mark">CHIRINGUITO // MINIJUEGO</span>
        </footer>
      </div>
    `;

    this.overlay = overlay;
    this.frame = overlay.querySelector('.mg-frame');
    this.stage = overlay.querySelector('.mg-stage');
    this.canvas = overlay.querySelector('.mg-canvas');
    this.hud = overlay.querySelector('.mg-hud');
    this.instruction = overlay.querySelector('.mg-instruction');
    this.instructionKicker = overlay.querySelector('.mg-instruction-kicker');
    this.instructionTitle = overlay.querySelector('.mg-instruction-title');
    this.instructionText = overlay.querySelector('.mg-instruction-text');
    this.gestureCanvas = overlay.querySelector('.mg-gesture');
    this.countdownEl = overlay.querySelector('.mg-countdown');
    this.phaseLabelEl = overlay.querySelector('.mg-phase-label');
    this.progressFill = overlay.querySelector('.mg-progress i');
    this.progressBar = overlay.querySelector('.mg-progress');
    this.scoreEl = overlay.querySelector('.mg-score');
    this.comboEl = overlay.querySelector('.mg-combo');
    this.comboValue = overlay.querySelector('.mg-combo b');
    this.comboFill = overlay.querySelector('.mg-combo-track i');
    this.stamp = overlay.querySelector('.mg-phase-stamp');
    this.result = overlay.querySelector('.mg-result');
    this.resultTitle = overlay.querySelector('.mg-result-title');
    this.starsEl = overlay.querySelector('.mg-stars');
    this.rankEl = overlay.querySelector('.mg-rank');
    this.resultScore = overlay.querySelector('.mg-result-score');
    this.resultBreakdown = overlay.querySelector('.mg-result-breakdown');
    this.resultRewards = overlay.querySelector('.mg-result-rewards');
    this.continueButton = overlay.querySelector('.mg-continue');
    this.hintEl = overlay.querySelector('.mg-hint');
    this.errorEl = overlay.querySelector('.mg-error');
    overlay.querySelector('.mg-kicker').textContent = this.kicker;
    overlay.querySelector('.mg-title').textContent = this.title;

    this._abortHandler = () => this.onAbort?.('button');
    this._continueHandler = () => this.onContinue?.();
    overlay.querySelector('.mg-abort').addEventListener('click', this._abortHandler);
    this.continueButton.addEventListener('click', this._continueHandler);

    this.mount.appendChild(overlay);
  }

  open() {
    if (!this.overlay) return;
    this.overlay.classList.remove('hidden');
    this.overlay.setAttribute('aria-hidden', 'false');
    if (document.pointerLockElement) document.exitPointerLock?.();
    this.frame?.focus?.({ preventScroll: true });
  }

  close() {
    if (!this.overlay) return;
    this.overlay.classList.add('hidden');
    this.overlay.setAttribute('aria-hidden', 'true');
  }

  destroy() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    if (this._windowResize) {
      window.removeEventListener('resize', this._windowResize);
      this._windowResize = null;
    }
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    this.frame = null;
    this.stage = null;
    this.canvas = null;
    this.instruction = null;
    this.result = null;
    this.continueButton = null;
  }

  getCanvas() {
    return this.canvas;
  }

  getStageSize() {
    if (!this.stage) return { width: 960, height: 540 };
    const rect = this.stage.getBoundingClientRect();
    return {
      width: Math.max(320, Math.round(rect.width || 960)),
      height: Math.max(180, Math.round(rect.height || 540))
    };
  }

  observeResize(callback) {
    if (!this.stage) return;
    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(() => callback(this.getStageSize()));
      this._resizeObserver.observe(this.stage);
    } else {
      this._windowResize = () => callback(this.getStageSize());
      window.addEventListener('resize', this._windowResize);
    }
    callback(this.getStageSize());
  }

  setTitle(title) {
    this.title = title || this.title;
    const el = this.overlay?.querySelector('.mg-title');
    if (el) el.textContent = this.title;
  }

  setPhaseLabel(value) {
    if (this.phaseLabelEl) this.phaseLabelEl.textContent = String(value || '');
  }

  setHint(value) {
    if (this.hintEl) this.hintEl.textContent = String(value || '');
  }

  setScore(value) {
    if (this.scoreEl) this.scoreEl.textContent = `PRECISIÓN ${Math.round(clamp(Number(value) || 0, 0, 100))}%`;
  }

  setCombo(combo = 0) {
    if (!this.comboEl) return;
    const value = Math.max(0, Math.round(Number(combo) || 0));
    this.comboEl.classList.toggle('hidden', value < 2);
    this.comboEl.classList.toggle('is-hot', value >= 6);
    if (this.comboValue) this.comboValue.textContent = `x${value}`;
    if (this.comboFill) this.comboFill.style.transform = `scaleX(${clamp(value / 12)})`;
  }

  setProgress(value = 0) {
    const progress = clamp(Number(value) || 0);
    if (Math.abs(progress - this._lastProgress) < 0.004 && progress !== 0 && progress !== 1) return;
    this._lastProgress = progress;
    if (this.progressFill) this.progressFill.style.transform = `scaleX(${progress})`;
    if (this.progressBar) this.progressBar.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
  }

  showInstruction(phase = {}, countdown = 3) {
    if (!this.instruction) return;
    this.instructionKicker.textContent = phase.kicker || 'FASE';
    this.instructionTitle.textContent = phase.title || 'PREPARADO';
    this.instructionText.textContent = phase.instruction || 'SIGUE LA INDICACIÓN.';
    this._drawGesture(phase.gesture || 'gesture-tap');
    this.instruction.classList.remove('hidden');
    this.instruction.classList.remove('is-in');
    void this.instruction.offsetWidth;
    this.instruction.classList.add('is-in');
    this.setCountdown(countdown);
  }

  _drawGesture(gestureId) {
    const canvas = this.gestureCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const sprite = AssetFactory.getSprite(gestureId);
    if (!sprite) return;
    const size = canvas.width;
    const scale = Math.min((size * 0.82) / sprite.width, (size * 0.82) / sprite.height);
    sprite.draw(ctx, size * 0.5, size * 0.5, { scale });
  }

  setCountdown(value) {
    if (!this.countdownEl) return;
    this.countdownEl.textContent = String(value);
    this.countdownEl.classList.remove('is-pop');
    void this.countdownEl.offsetWidth;
    this.countdownEl.classList.add('is-pop');
  }

  hideInstruction() {
    this.instruction?.classList.add('hidden');
  }

  showPhaseStamp({ label = '', color = PALETTE.cream, detail = '', kicker = '' } = {}) {
    if (!this.stamp) return;
    this.stamp.querySelector('.mg-stamp-kicker').textContent = kicker;
    this.stamp.querySelector('strong').textContent = label;
    this.stamp.querySelector('em').textContent = detail;
    this.stamp.style.setProperty('--stamp-color', color);
    this.stamp.classList.remove('hidden');
    this.stamp.classList.remove('is-in');
    void this.stamp.offsetWidth;
    this.stamp.classList.add('is-in');
  }

  hidePhaseStamp() {
    this.stamp?.classList.add('hidden');
  }

  showResult(result = {}) {
    if (!this.result) return;
    this.hidePhaseStamp();
    this.hud?.classList.add('is-hidden');
    if (this.hintEl) this.hintEl.textContent = 'RESULTADO LISTO · PULSA CONTINUAR';
    this.resultTitle.textContent = result.title || 'MINIJUEGO COMPLETADO';
    this.starsEl.innerHTML = '';
    const stars = clamp(Number(result.stars) || 0, 0, 3);
    for (let i = 0; i < 3; i++) {
      const star = document.createElement('canvas');
      star.className = 'mg-star';
      star.width = 128;
      star.height = 128;
      const ctx = star.getContext('2d');
      const sprite = AssetFactory.getSprite('star');
      const scale = Math.min(120 / sprite.width, 120 / sprite.height);
      if (sprite) sprite.draw(ctx, 64, 64, { scale, alpha: i < stars ? 1 : 0.18 });
      this.starsEl.appendChild(star);
    }
    this.rankEl.textContent = result.rank || '';
    this.rankEl.style.color = result.color || PALETTE.cream;
    this.resultScore.textContent = `PUNTUACIÓN ${Math.round(Number(result.score) || 0)}/100`;
    this.resultBreakdown.innerHTML = '';
    const phaseRows = Array.isArray(result.phases) ? result.phases : [];
    for (const phase of phaseRows) {
      const row = document.createElement('div');
      row.className = 'mg-result-row';
      const name = document.createElement('span');
      name.textContent = phase.label;
      const score = document.createElement('b');
      score.textContent = `${phase.score}%`;
      score.style.color = phase.color || PALETTE.cream;
      row.appendChild(name);
      row.appendChild(score);
      this.resultBreakdown.appendChild(row);
    }
    const stats = document.createElement('div');
    stats.className = 'mg-result-stats';
    stats.textContent = `COMBO MÁX. ${result.maxCombo || 0} · PERFECTOS ${result.perfects || 0} · FALLOS ${result.misses || 0}`;
    this.resultBreakdown.appendChild(stats);

    this.resultRewards.innerHTML = '';
    const rewards = result.rewards || {};
    const rewardItems = [];
    if (Number(rewards.pearls) > 0) rewardItems.push(`PERLAS +${Math.round(rewards.pearls)}`);
    if (rewards.ingredients && typeof rewards.ingredients === 'object') {
      for (const [id, amount] of Object.entries(rewards.ingredients)) {
        if (Number(amount) > 0) rewardItems.push(`${formatRewardKey(id)} +${Math.round(amount)}`);
      }
    }
    if (Array.isArray(rewards.extra)) {
      for (const item of rewards.extra) rewardItems.push(String(item));
    }
    if (rewards.rare) rewardItems.push(`RARO: ${formatRewardKey(rewards.rare)}`);
    if (rewardItems.length === 0) rewardItems.push('SIN RECOMPENSA ADICIONAL');
    for (const item of rewardItems) {
      const chip = document.createElement('span');
      chip.className = 'mg-reward-chip';
      chip.textContent = item;
      this.resultRewards.appendChild(chip);
    }

    this.result.classList.remove('hidden');
    this.result.classList.remove('is-in');
    void this.result.offsetWidth;
    this.result.classList.add('is-in');
    this.continueButton?.focus?.({ preventScroll: true });
  }

  hideResult() {
    this.result?.classList.add('hidden');
    this.hud?.classList.remove('is-hidden');
  }

  setError(message) {
    if (!this.errorEl) return;
    this.errorEl.textContent = String(message || 'ERROR DESCONOCIDO');
    this.errorEl.classList.remove('hidden');
  }
}
