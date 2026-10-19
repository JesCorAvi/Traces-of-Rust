import { MODES_CONFIG } from '../config.js';
import { GameEvents } from '../core/eventBus.js';
import { SurvivalMode } from './survivalMode.js';
import { CoreDefenseMode } from './coreDefenseMode.js';

// ============================================================================
// GESTOR CENTRAL DE MODOS DE JUEGO (Registro único, sin condicionales dispersos)
// ============================================================================

class GameModeManager {
  constructor() {
    this.registeredModes = new Map();
    this.selectedModeId = MODES_CONFIG.DEFAULT_MODE;
    this.activeMode = null;

    // Registro inicial de los dos modos oficiales
    this.registerMode('survival', () => new SurvivalMode());
    this.registerMode('core_defense', () => new CoreDefenseMode());
  }

  /**
   * Permite registrar un nuevo modo de juego en el futuro desde un único punto.
   * @param {string} modeId
   * @param {Function} factoryFn
   */
  registerMode(modeId, factoryFn) {
    this.registeredModes.set(modeId, factoryFn);
  }

  getAvailableModes() {
    return Object.values(MODES_CONFIG.CATALOG);
  }

  getSelectedModeId() {
    return this.selectedModeId;
  }

  getSelectedModeCatalog() {
    return MODES_CONFIG.CATALOG[this.selectedModeId] || MODES_CONFIG.CATALOG.survival;
  }

  selectMode(modeId) {
    if (!this.registeredModes.has(modeId)) {
      console.warn(`[GameModeManager] Modo desconocido: ${modeId}, usando survival.`);
      this.selectedModeId = 'survival';
      return;
    }
    this.selectedModeId = modeId;
    GameEvents.emit('mode:selected', {
      modeId: this.selectedModeId,
      catalog: this.getSelectedModeCatalog()
    });
  }

  startActiveMode(ctx) {
    this.cleanupActiveMode(ctx);
    const factory = this.registeredModes.get(this.selectedModeId) || this.registeredModes.get('survival');
    this.activeMode = factory();
    this.activeMode.init(ctx);
    return this.activeMode;
  }

  updateActiveMode(dt, ctx) {
    if (!this.activeMode) return;
    this.activeMode.update(dt, ctx);
  }

  onEnemyKilled(enemy, ctx) {
    if (!this.activeMode) return;
    this.activeMode.onEnemyKilled(enemy, ctx);
  }

  onPlayerLethalDamage(ctx) {
    if (!this.activeMode) return true;
    return this.activeMode.onPlayerLethalDamage(ctx);
  }

  getHudConfig() {
    if (!this.activeMode) {
      return {
        modeId: this.selectedModeId,
        showTimerAsPrimary: this.selectedModeId === 'survival',
        showCoreBar: this.selectedModeId === 'core_defense',
        showWaveCounter: this.selectedModeId === 'core_defense',
        showCoreDirectionMarker: this.selectedModeId === 'core_defense'
      };
    }
    return this.activeMode.getHudConfig();
  }

  getHudTelemetry(ctx) {
    if (!this.activeMode) return null;
    return this.activeMode.getHudTelemetry(ctx);
  }

  cleanupActiveMode(ctx) {
    if (this.activeMode) {
      this.activeMode.cleanup(ctx);
      this.activeMode = null;
    }
    GameEvents.clear();
  }
}

export const ModeManager = new GameModeManager();