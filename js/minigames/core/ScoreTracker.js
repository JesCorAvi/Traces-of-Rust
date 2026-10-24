// Puntuación, combos, estrellas y rango final de los minijuegos.
// Exports: ScoreTracker, accuracyLabel, accuracyColor, clampAccuracy, RANK_COLORS.

import { PALETTE } from '../assets/palette.js';
import { clamp } from './Draw.js';

export const RANK_COLORS = Object.freeze({
  PERFECTO: PALETTE.perfect,
  GENIAL: PALETTE.good,
  BIEN: PALETTE.mango,
  MAL: PALETTE.danger
});

export const clampAccuracy = value => clamp(value);

// Los umbrales coinciden con los tiers de calidad de la cocina
// (QUEMADO/ACEPTABLE/BUENO/PERFECTO) para que rango y calidad no se contradigan.
export function accuracyLabel(accuracy) {
  const value = clampAccuracy(accuracy);
  if (value >= 0.9) return 'PERFECTO';
  if (value >= 0.7) return 'GENIAL';
  if (value >= 0.45) return 'BIEN';
  return 'MAL';
}

export function accuracyColor(accuracy) {
  return RANK_COLORS[accuracyLabel(accuracy)] || PALETTE.cream;
}

export function starCount(accuracy) {
  const value = clampAccuracy(accuracy);
  if (value >= 0.9) return 3;
  if (value >= 0.7) return 2;
  return 1;
}

export class ScoreTracker {
  constructor() {
    this.reset();
  }

  reset() {
    this.combo = 0;
    this.maxCombo = 0;
    this.hits = 0;
    this.misses = 0;
    this.perfects = 0;
    this.goods = 0;
    this.phases = [];
    this.elapsed = 0;
  }

  update(dt) {
    this.elapsed += Math.max(0, Number(dt) || 0);
  }

  registerHit(quality = 'good', points = 1) {
    this.combo++;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.hits++;
    if (quality === 'perfect') this.perfects++;
    else this.goods++;
    return this.combo;
  }

  registerMiss() {
    this.misses++;
    this.combo = 0;
    return this.combo;
  }

  addPhase({ id = '', label = '', accuracy = 0, weight = 1, stats = null } = {}) {
    const result = {
      id,
      label: label || id,
      accuracy: clampAccuracy(accuracy),
      weight: Math.max(0.01, Number(weight) || 1),
      stats: stats || null
    };
    this.phases.push(result);
    return result;
  }

  getAccuracy() {
    if (!this.phases.length) {
      const attempts = this.hits + this.misses;
      return attempts > 0 ? clampAccuracy(this.hits / attempts) : 0;
    }
    let total = 0;
    let weight = 0;
    for (const phase of this.phases) {
      total += phase.accuracy * phase.weight;
      weight += phase.weight;
    }
    return weight > 0 ? clampAccuracy(total / weight) : 0;
  }

  getScore() {
    return Math.round(this.getAccuracy() * 100);
  }

  getStars() {
    return starCount(this.getAccuracy());
  }

  getRank() {
    return accuracyLabel(this.getAccuracy());
  }

  getComboMultiplier() {
    return 1 + Math.min(1.25, this.combo * 0.05);
  }

  buildResult({ title = 'RESULTADO', rewards = {}, extras = {} } = {}) {
    const score = Math.round(this.getAccuracy() * 100);
    // Rango y estrellas usan el mismo valor redondeado que ve el jugador.
    const accuracy = score / 100;
    const stars = starCount(accuracy);
    const rank = accuracyLabel(accuracy);
    return {
      title,
      score,
      stars,
      rank,
      color: RANK_COLORS[rank] || PALETTE.cream,
      accuracy,
      combo: this.combo,
      maxCombo: this.maxCombo,
      hits: this.hits,
      misses: this.misses,
      perfects: this.perfects,
      goods: this.goods,
      durationMs: Math.round(this.elapsed * 1000),
      phases: this.phases.map(phase => ({
        id: phase.id,
        label: phase.label,
        score: Math.round(phase.accuracy * 100),
        rank: accuracyLabel(phase.accuracy),
        color: accuracyColor(phase.accuracy)
      })),
      rewards,
      ...extras
    };
  }
}
