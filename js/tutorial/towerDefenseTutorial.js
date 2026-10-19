// Tutorial interactivo opcional del modo Defensa (construcción, mejoras, sinergias y oleada de práctica).
// Exports: TowerDefenseTutorial.
import { CORE_DEFENSE_CONFIG } from '../config/coreDefenseConfig.js';
import { AudioSys } from '../audio.js';
import { GameEvents } from '../core/eventBus.js';
import { TUTORIAL_STEPS } from './tutorialSteps.js';
import { TutorialMarkers } from './tutorialMarkers.js';
import { PracticeWave } from './practiceWave.js';

// ============================================================================
// TUTORIAL INTERACTIVO OPCIONAL DEL MODO DEFENDER EL NÚCLEO
// Guía al jugador por construcción libre, mejora, sinergias y una oleada real.
// ============================================================================

export class TowerDefenseTutorial {
  constructor(mode, ctx) {
    this.mode = mode;
    this.ctx = ctx;
    this.scene = ctx.scene;
    this.worldPhysics = ctx.worldPhysics;
    this.cfg = CORE_DEFENSE_CONFIG.TUTORIAL;
    this.active = true;
    this.destroyed = false;
    this.stepIndex = -1;
    this.step = null;
    this.unsubs = [];
    this.markers = new TutorialMarkers(this.scene, this.worldPhysics, this.cfg.spots || {});
    this.practice = new PracticeWave(this.cfg);

    this.dom = {
      panel: document.getElementById('td-tutorial-panel'),
      step: document.getElementById('td-tutorial-step'),
      title: document.getElementById('td-tutorial-title'),
      text: document.getElementById('td-tutorial-text'),
      hint: document.getElementById('td-tutorial-hint')
    };

    this.subscribe();
    if (this.dom.panel) this.dom.panel.classList.remove('hidden');
    this.enterStep(0);
  }

  subscribe() {
    this.unsubs.push(
      GameEvents.on('turret:built', () => {
        if (this.step && this.step.id === 'build') this.advance();
      }),
      GameEvents.on('turret:upgraded', payload => {
        if (!this.step) return;
        if (this.step.id === 'upgrade') {
          if (payload && payload.level >= 2) this.advance();
          else this.updateHint('NIVEL 1 COMPRADO · COMPRA EL SIGUIENTE PARA DESBLOQUEAR EL CAMBIO DE COMPORTAMIENTO');
        }
      })
    );
  }

  enterStep(index) {
    if (!this.active) return;
    if (index >= TUTORIAL_STEPS.length) {
      this.finish();
      return;
    }

    this.stepIndex = index;
    this.step = TUTORIAL_STEPS[index];
    this.markers.setActive(this.step.markers);

    if (this.step.id === 'build') {
      this.mode.addScrap(this.cfg.startingBonusScrap || 0);
    } else if (this.step.id === 'upgrade') {
      this.mode.addScrap(24);
    } else if (this.step.id === 'synergy') {
      this.mode.addScrap(40);
    } else if (this.step.id === 'practice') {
      this.practice.reset();
    }

    this.renderPanel();
  }

  advance() {
    if (!this.active) return;
    this.enterStep(this.stepIndex + 1);
  }

  renderPanel() {
    if (!this.step) return;
    if (this.dom.step) {
      const n = Math.max(0, this.stepIndex);
      this.dom.step.textContent = this.step.id === 'intro' || this.step.id === 'done'
        ? 'TUTORIAL'
        : `PASO ${n} / ${TUTORIAL_STEPS.length - 2}`;
    }
    if (this.dom.title) this.dom.title.textContent = this.step.title;
    if (this.dom.text) this.dom.text.textContent = this.step.text;
    this.updateHint(this.step.hint);
  }

  updateHint(text) {
    if (!this.dom.hint) return;
    this.dom.hint.textContent = text || '';
  }

  update(dt, ctx) {
    if (!this.active) return;
    this.ctx = ctx;
    this.markers.update(dt);

    if (this.step.id === 'practice') {
      if (this.practice.update(dt, ctx, this.mode)) this.advance();
      return;
    }

    // Comprobaciones de respaldo por si el evento tarda un frame
    if (this.step.id === 'build') {
      if (this.mode.turretSystem.getTurretCount() > 0) this.advance();
    } else if (this.step.id === 'upgrade') {
      const upgraded = this.mode.turretSystem.getTurrets().some(t =>
        t.levels.some(level => level >= 2)
      );
      if (upgraded) this.advance();
    } else if (this.step.id === 'synergy') {
      const types = new Set(this.mode.turretSystem.getTurrets().map(t => t.cfg.id));
      if (types.has('cryo') && types.has('mortar')) this.advance();
    }
  }

  handleKey(key) {
    if (!this.active) return false;
    const k = (key || '').toLowerCase();

    if (k === 'f') {
      this.skip();
      return true;
    }

    if ((this.step.id === 'intro' || this.step.id === 'done') &&
        (k === ' ' || k === 'space' || k === 'enter')) {
      this.advance();
      return true;
    }

    return false;
  }

  skip() {
    if (!this.active) return;
    AudioSys.playUIClick();
    this.practice.clear(this.ctx);
    this.finish();
  }

  finish() {
    if (!this.active) return;
    AudioSys.playUISelect();
    this.teardown();
  }

  teardown() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.active = false;

    if (this.dom.panel) this.dom.panel.classList.add('hidden');
    this.unsubs.forEach(unsub => unsub());
    this.unsubs.length = 0;

    this.markers.dispose();
    this.markers = null;

    if (this.mode.turretSystem) this.mode.cancelTurretPlacement();
    this.mode.tutorialActive = false;
    this.mode.tutorial = null;
  }

  destroy() {
    this.teardown();
  }
}
