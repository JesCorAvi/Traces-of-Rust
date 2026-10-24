// Director de campaña: temporada, día, fases y transiciones del Chiringuito.
// No posee la escena: delega en ChiringuitoMode y en los sistemas de restaurante.
// Exports: CampaignDirector.

import {
  CAMPAIGN,
  PHASES,
  PHASE_TIMERS,
  SEASONS,
  WAVE_ECONOMY,
  getSeason
} from '../../config/chiringuito/seasons.js';

const WAVE_PHASES = new Set([PHASES.AFTERNOON_WAVE_1, PHASES.AFTERNOON_WAVE_2]);
const AFTERNOON_PHASES = new Set([
  PHASES.AFTERNOON_INTRO,
  PHASES.AFTERNOON_WAVE_1,
  PHASES.INTERMISSION,
  PHASES.AFTERNOON_WAVE_2,
  PHASES.AFTERNOON_CLEARING
]);
const NIGHT_PHASES = new Set([PHASES.NIGHT_INTRO, PHASES.NIGHT_ACTIVE, PHASES.NIGHT_CLOSING]);

function phaseLabel(phase) {
  switch (phase) {
    case PHASES.MORNING: return 'MAÑANA';
    case PHASES.AFTERNOON_INTRO:
    case PHASES.AFTERNOON_WAVE_1:
    case PHASES.INTERMISSION:
    case PHASES.AFTERNOON_WAVE_2:
    case PHASES.AFTERNOON_CLEARING: return 'TARDE';
    case PHASES.NIGHT_INTRO:
    case PHASES.NIGHT_ACTIVE:
    case PHASES.NIGHT_CLOSING: return 'NOCHE';
    case PHASES.DAY_SUMMARY: return 'RESUMEN DEL DÍA';
    case PHASES.SEASON_SUMMARY: return 'RESUMEN DE TEMPORADA';
    case PHASES.SEASON_TRANSITION: return 'NUEVA TEMPORADA';
    case PHASES.COMPLETE: return 'CAMPAÑA COMPLETA';
    case PHASES.DEFEAT: return 'CAMPAÑA PERDIDA';
    default: return phase;
  }
}

export class CampaignDirector {
  constructor(options = {}) {
    this.onPhaseChanged = options.onPhaseChanged || null;
    this.onMorningStart = options.onMorningStart || null;
    this.onMorningTimeout = options.onMorningTimeout || null;
    this.onAfternoonIntroComplete = options.onAfternoonIntroComplete || null;
    this.onNightStart = options.onNightStart || null;
    this.onNightArrivalsClose = options.onNightArrivalsClose || null;
    this.onNightForceClose = options.onNightForceClose || null;
    this.onNightTimeout = options.onNightTimeout || null;
    this.onDaySummary = options.onDaySummary || null;
    this.onSeasonSummary = options.onSeasonSummary || null;
    this.onSeasonTransitionReady = options.onSeasonTransitionReady || null;
    this.onDefeat = options.onDefeat || null;
    this.onVictory = options.onVictory || null;
    this.onSaveRequested = options.onSaveRequested || null;

    this.initialized = false;
    this.seasonIndex = 0;
    this.day = 1;
    this.phase = PHASES.MORNING;
    this.phaseTimer = 0;
    this.pantryLives = 0;
    this.pantryMax = 0;
    this.routeMapId = null;
    this.epoch = 0;
    this.waveIndex = 0;
    this.waveCount = CAMPAIGN.wavesPerAfternoon;
    this.arrivalsClosed = false;
    this.nightStartTriggered = false;
    this.nightForceClosed = false;
    this.nightTimeoutFired = false;
    this.morningExpired = false;
    this.daySummaryShown = false;
    this.seasonSummaryShown = false;
    this._defeatTriggered = false;
    this._victoryTriggered = false;
    this.lastDayStats = null;
  }

  get season() {
    return getSeason(this.seasonIndex);
  }

  get seasonLabel() {
    return this.season.label || `Temporada ${this.seasonIndex + 1}`;
  }

  get isAfternoon() {
    return AFTERNOON_PHASES.has(this.phase);
  }

  get isNight() {
    return NIGHT_PHASES.has(this.phase);
  }

  get isWavePhase() {
    return WAVE_PHASES.has(this.phase);
  }

  get isFinalDayOfSeason() {
    return this.day >= CAMPAIGN.daysPerSeason;
  }

  get isFinalSeason() {
    return this.seasonIndex >= CAMPAIGN.seasonCount - 1;
  }

  get phaseLabel() {
    return phaseLabel(this.phase);
  }

  canStartAfternoon() {
    return this.phase === PHASES.MORNING;
  }

  canBuildTurrets() {
    return this.phase === PHASES.MORNING || this.isAfternoon;
  }

  canBuildFurniture() {
    return this.phase === PHASES.MORNING;
  }

  canCook() {
    return this.phase === PHASES.NIGHT_ACTIVE || this.phase === PHASES.NIGHT_CLOSING;
  }

  canServe() {
    return this.phase === PHASES.NIGHT_ACTIVE || this.phase === PHASES.NIGHT_CLOSING;
  }

  startNewCampaign(routeMapId, options = {}) {
    this._defeatTriggered = false;
    this._victoryTriggered = false;
    this.daySummaryShown = false;
    this.seasonSummaryShown = false;
    this.arrivalsClosed = false;
    this.nightStartTriggered = false;
    this.nightForceClosed = false;
    this.nightTimeoutFired = false;
    this.morningExpired = false;
    this.lastDayStats = null;
    this.day = 1;
    this.epoch = (options.epoch || 0) + 1;
    this.configureSeason(0, routeMapId);
    this.initialized = true;
    this._setPhase(PHASES.MORNING, 0, { silent: true });
    this._startMorning({ heal: false });
    this.onSaveRequested?.('campaign_start');
  }

  configureSeason(seasonIndex, routeMapId) {
    const season = getSeason(seasonIndex);
    this.seasonIndex = season.index;
    this.routeMapId = routeMapId || null;
    this.pantryMax = season.pantryMax;
    this.pantryLives = season.pantryMax;
    this.waveIndex = 0;
    this.waveCount = CAMPAIGN.wavesPerAfternoon;
    this.arrivalsClosed = false;
    this.nightForceClosed = false;
    this.nightTimeoutFired = false;
  }

  startNewSeason(seasonIndex, routeMapId, options = {}) {
    this.daySummaryShown = false;
    this.seasonSummaryShown = false;
    this.day = 1;
    this.epoch += 1;
    this.configureSeason(seasonIndex, routeMapId);
    this._setPhase(PHASES.MORNING, 0, { silent: false });
    this._startMorning({ heal: false });
    this.onSaveRequested?.('season_start');
  }

  restore(snapshot = {}) {
    if (!snapshot) return false;
    this.seasonIndex = Math.max(0, Math.min(CAMPAIGN.seasonCount - 1, Number(snapshot.seasonIndex) || 0));
    this.day = Math.max(1, Math.min(CAMPAIGN.daysPerSeason, Number(snapshot.day) || 1));
    this.phase = Object.values(PHASES).includes(snapshot.phase) ? snapshot.phase : PHASES.MORNING;
    this.phaseTimer = Math.max(0, Number(snapshot.phaseTimer) || 0);
    this.pantryLives = Math.max(0, Number(snapshot.pantryLives) || 0);
    this.pantryMax = Math.max(1, Number(snapshot.pantryMax) || this.season.pantryMax);
    this.routeMapId = snapshot.routeMapId || null;
    this.epoch = Math.max(1, Number(snapshot.epoch) || 1);
    this.waveIndex = Math.max(0, Number(snapshot.waveIndex) || 0);
    this.waveCount = Math.max(1, Number(snapshot.waveCount) || CAMPAIGN.wavesPerAfternoon);
    this.arrivalsClosed = !!snapshot.arrivalsClosed;
    this.nightStartTriggered = !!snapshot.nightStartTriggered;
    this.daySummaryShown = !!snapshot.daySummaryShown;
    this.seasonSummaryShown = !!snapshot.seasonSummaryShown;
    this.nightForceClosed = false;
    this.nightTimeoutFired = false;
    this.morningExpired = false;
    if (this.phase === PHASES.MORNING && this.phaseTimer <= 0) {
      // Compatibilidad con saves anteriores al reloj de mañana.
      this.phaseTimer = PHASE_TIMERS.morningDurationSec;
    }
    this._defeatTriggered = this.phase === PHASES.DEFEAT;
    this._victoryTriggered = this.phase === PHASES.COMPLETE;
    this.initialized = true;
    this.onPhaseChanged?.(this.phase, this.phase, { restored: true });
    return true;
  }

  _setPhase(next, timer = 0, options = {}) {
    const prev = this.phase;
    this.phase = next;
    this.phaseTimer = Math.max(0, Number(timer) || 0);
    if (!options.silent) this.onPhaseChanged?.(next, prev, options);
  }

  _startMorning({ heal = true } = {}) {
    if (heal) this.healPantry(this.pantryMax * WAVE_ECONOMY.morningPantryHealRatio);
    this.waveIndex = 0;
    this.arrivalsClosed = false;
    this.nightStartTriggered = false;
    this.nightForceClosed = false;
    this.nightTimeoutFired = false;
    this.morningExpired = false;
    this.daySummaryShown = false;
    this.phaseTimer = PHASE_TIMERS.morningDurationSec;
    this.onMorningStart?.(this.day, this.seasonIndex, this.season);
    this.onSaveRequested?.('morning');
  }

  startAfternoon() {
    if (!this.canStartAfternoon() || this._defeatTriggered) return false;
    this._setPhase(PHASES.AFTERNOON_INTRO, PHASE_TIMERS.afternoonIntroSec);
    this.onSaveRequested?.('afternoon_start');
    return true;
  }

  onWaveStarted(payload = {}) {
    if (!this.isAfternoon) return;
    const wave = Number(payload.wave) || 1;
    this.waveIndex = wave;
    this._setPhase(wave <= 1 ? PHASES.AFTERNOON_WAVE_1 : PHASES.AFTERNOON_WAVE_2, 0);
    this.onSaveRequested?.('wave_started');
  }

  onWaveCompleted(payload = {}) {
    const wave = Number(payload.wave) || this.waveIndex;
    this.waveIndex = wave;
    this.healPantry(WAVE_ECONOMY.wavePantryHeal);
    if (wave < this.waveCount) {
      this._setPhase(PHASES.INTERMISSION, 0, { intermission: true });
    }
    this.onSaveRequested?.('wave_completed');
  }

  onAfternoonComplete() {
    if (!this.isAfternoon) return;
    this._setPhase(PHASES.AFTERNOON_CLEARING, PHASE_TIMERS.afternoonClearingSec);
    this.onSaveRequested?.('afternoon_complete');
  }

  update(dt) {
    if (!this.initialized) return;
    if (this.phase === PHASES.MORNING) {
      if (this.phaseTimer > 0) this.phaseTimer = Math.max(0, this.phaseTimer - dt);
      if (this.phaseTimer <= 0 && !this.morningExpired) {
        this.morningExpired = true;
        this.onMorningTimeout?.();
        this.startAfternoon();
      }
      return;
    }
    if (this.phase === PHASES.AFTERNOON_INTRO) {
      this.phaseTimer -= dt;
      if (this.phaseTimer <= 0) {
        this._setPhase(PHASES.AFTERNOON_WAVE_1, 0);
        this.onAfternoonIntroComplete?.(this.day, this.seasonIndex);
      }
      return;
    }
    if (this.phase === PHASES.AFTERNOON_CLEARING) {
      this.phaseTimer -= dt;
      if (this.phaseTimer <= 0) {
        this._setPhase(PHASES.NIGHT_INTRO, PHASE_TIMERS.nightIntroSec);
      }
      return;
    }
    if (this.phase === PHASES.NIGHT_INTRO) {
      this.phaseTimer -= dt;
      if (this.phaseTimer <= 0) {
        this.nightStartTriggered = true;
        this._setPhase(PHASES.NIGHT_ACTIVE, PHASE_TIMERS.nightDurationSec);
        this.onNightStart?.(this.day, this.seasonIndex, this.season);
      }
      return;
    }
    if (this.phase === PHASES.NIGHT_ACTIVE) {
      this.phaseTimer = Math.max(0, this.phaseTimer - dt);
      if (!this.arrivalsClosed && this.phaseTimer <= PHASE_TIMERS.nightDurationSec - PHASE_TIMERS.nightArrivalsUntilSec) {
        this.arrivalsClosed = true;
        this.onNightArrivalsClose?.();
      }
      if (this.phaseTimer <= 0) {
        this._setPhase(PHASES.NIGHT_CLOSING, PHASE_TIMERS.nightClosingGraceSec);
        if (!this.nightForceClosed) {
          this.nightForceClosed = true;
          this.onNightForceClose?.();
        }
      }
      return;
    }
    if (this.phase === PHASES.NIGHT_CLOSING) {
      this.phaseTimer = Math.max(0, this.phaseTimer - dt);
      if (!this.nightForceClosed) {
        this.nightForceClosed = true;
        this.onNightForceClose?.();
      }
      if (this.phaseTimer <= 0 && !this.nightTimeoutFired) {
        this.nightTimeoutFired = true;
        this.onNightTimeout?.();
      }
    }
  }

  completeNight(stats = null) {
    if (this.phase === PHASES.DAY_SUMMARY || this.phase === PHASES.SEASON_SUMMARY || this.phase === PHASES.COMPLETE) return false;
    this.lastDayStats = stats || this.lastDayStats;
    this.daySummaryShown = true;
    this._setPhase(PHASES.DAY_SUMMARY, 0);
    this.onDaySummary?.(this.getDaySummary());
    this.onSaveRequested?.('night_complete');
    return true;
  }

  getDaySummary() {
    return {
      seasonIndex: this.seasonIndex,
      seasonLabel: this.seasonLabel,
      day: this.day,
      dayCount: CAMPAIGN.daysPerSeason,
      pantryLives: this.pantryLives,
      pantryMax: this.pantryMax,
      lastService: this.lastDayStats,
      isFinalDay: this.isFinalDayOfSeason,
      isFinalSeason: this.isFinalSeason
    };
  }

  advanceFromDaySummary() {
    if (this.phase !== PHASES.DAY_SUMMARY) return false;
    if (this.isFinalDayOfSeason) {
      this.seasonSummaryShown = true;
      this._setPhase(PHASES.SEASON_SUMMARY, 0);
      this.onSeasonSummary?.(this.getSeasonSummary());
      return true;
    }
    this.day += 1;
    this._setPhase(PHASES.MORNING, 0);
    this._startMorning({ heal: true });
    return true;
  }

  getSeasonSummary() {
    return {
      seasonIndex: this.seasonIndex,
      seasonLabel: this.seasonLabel,
      isFinalSeason: this.isFinalSeason,
      pantryLives: this.pantryLives,
      pantryMax: this.pantryMax,
      lastService: this.lastDayStats
    };
  }

  advanceFromSeasonSummary() {
    if (this.phase !== PHASES.SEASON_SUMMARY) return false;
    if (this.isFinalSeason) {
      this._triggerVictory();
      return true;
    }
    this._setPhase(PHASES.SEASON_TRANSITION, 0);
    this.onSeasonTransitionReady?.(this.seasonIndex + 1);
    return true;
  }

  applyPantryDamage(amount) {
    if (this._defeatTriggered) return this.pantryLives;
    const dmg = Math.max(0, Math.round(Number(amount) || 0));
    this.pantryLives = Math.max(0, this.pantryLives - dmg);
    this.onSaveRequested?.('pantry_damage');
    if (this.pantryLives <= 0) this._triggerDefeat();
    return this.pantryLives;
  }

  healPantry(amount) {
    const heal = Math.max(0, Number(amount) || 0);
    this.pantryLives = Math.min(this.pantryMax, this.pantryLives + heal);
    return this.pantryLives;
  }

  _triggerDefeat() {
    if (this._defeatTriggered) return;
    this._defeatTriggered = true;
    this._setPhase(PHASES.DEFEAT, 0);
    this.onDefeat?.({
      seasonIndex: this.seasonIndex,
      seasonLabel: this.seasonLabel,
      day: this.day,
      pantryLives: 0,
      pantryMax: this.pantryMax
    });
    this.onSaveRequested?.('defeat');
  }

  _triggerVictory() {
    if (this._victoryTriggered) return;
    this._victoryTriggered = true;
    this._setPhase(PHASES.COMPLETE, 0);
    this.onVictory?.({
      seasonIndex: this.seasonIndex,
      seasonLabel: this.seasonLabel,
      day: this.day
    });
    this.onSaveRequested?.('victory');
  }

  getTelemetry(waveManager = null) {
    let timer = this.phaseTimer;
    if (this.phase === PHASES.INTERMISSION) timer = waveManager?.prepTimer || 0;
    if (this.isWavePhase) timer = 0;
    return {
      seasonIndex: this.seasonIndex,
      seasonLabel: this.seasonLabel,
      difficulty: this.season.difficulty,
      day: this.day,
      daysPerSeason: CAMPAIGN.daysPerSeason,
      phase: this.phase,
      phaseLabel: this.phaseLabel,
      phaseTimer: timer,
      pantryLives: this.pantryLives,
      pantryMax: this.pantryMax,
      routeMapId: this.routeMapId,
      waveIndex: waveManager?.currentWaveIndex || this.waveIndex,
      waveCount: this.waveCount,
      epoch: this.epoch,
      canStartAfternoon: this.canStartAfternoon(),
      canBuildTurrets: this.canBuildTurrets(),
      canBuildFurniture: this.canBuildFurniture(),
      canCook: this.canCook(),
      canServe: this.canServe(),
      isAfternoon: this.isAfternoon,
      isNight: this.isNight,
      isFinalDay: this.isFinalDayOfSeason
    };
  }

  applyNetworkState(snapshot = {}) {
    if (!snapshot) return;
    const prevPhase = this.phase;
    this.seasonIndex = Math.max(0, Math.min(CAMPAIGN.seasonCount - 1, Number(snapshot.seasonIndex ?? this.seasonIndex) || 0));
    this.day = Math.max(1, Math.min(CAMPAIGN.daysPerSeason, Number(snapshot.day ?? this.day) || 1));
    this.phase = Object.values(PHASES).includes(snapshot.phase) ? snapshot.phase : this.phase;
    this.phaseTimer = Math.max(0, Number(snapshot.phaseTimer) || 0);
    this.pantryLives = Math.max(0, Number(snapshot.pantryLives) || 0);
    this.pantryMax = Math.max(1, Number(snapshot.pantryMax) || this.pantryMax);
    this.routeMapId = snapshot.routeMapId || this.routeMapId;
    this.epoch = Math.max(1, Number(snapshot.epoch) || this.epoch);
    this.waveIndex = Math.max(0, Number(snapshot.waveIndex) || 0);
    this.waveCount = Math.max(1, Number(snapshot.waveCount) || this.waveCount);
    this.arrivalsClosed = !!snapshot.arrivalsClosed;
    this.nightStartTriggered = !!snapshot.nightStartTriggered;
    this.daySummaryShown = !!snapshot.daySummaryShown;
    this.seasonSummaryShown = !!snapshot.seasonSummaryShown;
    this.lastDayStats = snapshot.lastDayStats || this.lastDayStats;
    this.initialized = true;
    if (prevPhase !== this.phase) this.onPhaseChanged?.(this.phase, prevPhase, { network: true });
  }

  getSnapshot() {
    return {
      seasonIndex: this.seasonIndex,
      day: this.day,
      phase: this.phase,
      phaseTimer: this.phaseTimer,
      pantryLives: this.pantryLives,
      pantryMax: this.pantryMax,
      routeMapId: this.routeMapId,
      epoch: this.epoch,
      waveIndex: this.waveIndex,
      waveCount: this.waveCount,
      arrivalsClosed: this.arrivalsClosed,
      nightStartTriggered: this.nightStartTriggered,
      nightForceClosed: this.nightForceClosed,
      nightTimeoutFired: this.nightTimeoutFired,
      morningExpired: this.morningExpired,
      daySummaryShown: this.daySummaryShown,
      seasonSummaryShown: this.seasonSummaryShown,
      lastDayStats: this.lastDayStats
    };
  }
}
