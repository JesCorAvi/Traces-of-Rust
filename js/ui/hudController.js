// HUD: stats, núcleo, radar, inventario, avisos y prompts de torretas.
// Exports: HUDController, SHORT_WEAPON_NAMES.
import { renderSpriteIconHTML } from '../spritesheets.js';
import { updateStatsAndModeHUD, updateInventoryHUD } from './hud/stats.js';
import { updateCoreDirectionIndicator, updateRadarHUD } from './hud/radar.js';
export { SHORT_WEAPON_NAMES } from './hud/stats.js';

export class HUDController {
  constructor() {
    this.bossTrailPct = 100;
    this.bossTargetPct = 100;
    this.bossTrailHoldTimer = 0;
    this.bossHideHudTimeout = null;
    this.coreAlertTimeout = null;
    this.waveBannerTimeout = null;
  }

  /**
   * Configura qué elementos del HUD se muestran según el modo activo.
   */
  applyModeLayout(hudConfig) {
    const isDefense = hudConfig.modeId === 'core_defense';

    const coreHudBox = document.getElementById('core-defense-hud');
    if (coreHudBox) coreHudBox.classList.toggle('hidden', !isDefense);

    const dirIndicator = document.getElementById('core-direction-indicator');
    if (dirIndicator) dirIndicator.classList.toggle('hidden', !isDefense);

    const timerText = document.getElementById('timer-text');
    if (timerText) {
      timerText.classList.toggle('timer-secondary-mode', isDefense);
    }

    const objHeaderSpan = document.querySelector('#hud-objective-tracker .objective-header span:last-child');
    if (objHeaderSpan && hudConfig.objectiveHeader) {
      objHeaderSpan.textContent = hudConfig.objectiveHeader;
    }

    document.getElementById('endgame-banner')?.classList.add('hidden');
    document.getElementById('boss-hud')?.classList.add('hidden');
    document.getElementById('core-attack-banner')?.classList.add('hidden');

    if (!isDefense) {
      document.getElementById('turret-interact-prompt')?.classList.add('hidden');
    }
  }


  updateStatsAndModeHUD(stats, kills, runSouls, rerollsLeft, activeBoss, modeTelemetry) {
    updateStatsAndModeHUD(stats, kills, runSouls, rerollsLeft, activeBoss, modeTelemetry);
  }

  updateInventoryHUD(skills, passives, lastUpgradedKey) {
    updateInventoryHUD(skills, passives, lastUpgradedKey);
  }

  updateCoreDirectionIndicator(camera, playerPos, corePos, coreRatio = 1) {
    updateCoreDirectionIndicator(camera, playerPos, corePos, coreRatio);
  }

  updateRadarHUD(playerPos, yaw, activeEnemies, activeBoss, corePos = null) {
    updateRadarHUD(playerPos, yaw, activeEnemies, activeBoss, corePos);
  }

  showBossBanner(boss, bossCfg) {
    if (this.bossHideHudTimeout) {
      clearTimeout(this.bossHideHudTimeout);
      this.bossHideHudTimeout = null;
    }
    this.bossTrailPct = 100;
    this.bossTargetPct = 100;
    this.bossTrailHoldTimer = 0;

    const alertEl = document.getElementById('boss-alert');
    if (alertEl) {
      alertEl.innerHTML = `${renderSpriteIconHTML('warning', 'sm')} <span>ALERTA: ${bossCfg.name} EN PLANTA</span> ${renderSpriteIconHTML('warning', 'sm')}`;
      alertEl.classList.remove('hidden');
      setTimeout(() => alertEl.classList.add('hidden'), 3800);
    }

    this.updateBossHUD(boss, false);
    document.getElementById('boss-hud')?.classList.remove('hidden');
  }

  updateBossHUD(activeBoss, triggerHitShake = false) {
    if (!activeBoss || !activeBoss.active) return;

    document.getElementById('boss-name').textContent = `// ${activeBoss.bossData.name}`;
    const phaseEl = document.getElementById('boss-phase');
    phaseEl.textContent = activeBoss.phase === 2 ? 'FASE II // FRENESÍ' : 'FASE I';
    phaseEl.classList.toggle('p2', activeBoss.phase === 2);

    const pct = Math.min(100, Math.max(0, (activeBoss.hp / activeBoss.maxHp) * 100));
    this.bossTargetPct = pct;
    if (this.bossTrailHoldTimer <= 0) this.bossTrailHoldTimer = 0.18;

    const hpBarEl = document.getElementById('boss-hp-bar');
    if (hpBarEl) hpBarEl.style.width = `${pct}%`;

    if (triggerHitShake) {
      const bossFrame = document.querySelector('.boss-bar-frame');
      if (bossFrame) {
        bossFrame.classList.add('boss-hit-flash', 'bar-shake');
        setTimeout(() => bossFrame.classList.remove('boss-hit-flash', 'bar-shake'), 140);
      }
    }
  }

  hideBossHUDDelayed() {
    this.bossTargetPct = 0;
    const hpBarEl = document.getElementById('boss-hp-bar');
    if (hpBarEl) hpBarEl.style.width = '0%';

    if (this.bossHideHudTimeout) clearTimeout(this.bossHideHudTimeout);
    this.bossHideHudTimeout = setTimeout(() => {
      document.getElementById('boss-hud')?.classList.add('hidden');
    }, 650);
  }

  triggerCoreDamageFeedback() {
    const corePlate = document.getElementById('core-defense-hud');
    if (corePlate) {
      corePlate.classList.add('bar-shake');
      setTimeout(() => corePlate.classList.remove('bar-shake'), 260);
    }
  }

  showCoreUnderAttackAlert(stateLabel = 'ALERTA') {
    const banner = document.getElementById('core-attack-banner');
    if (!banner) return;
    banner.innerHTML = `${renderSpriteIconHTML('warning', 'sm')} <span>¡NÚCLEO BAJO ATAQUE! // ${stateLabel}</span> ${renderSpriteIconHTML('warning', 'sm')}`;
    banner.classList.remove('hidden');

    if (this.coreAlertTimeout) clearTimeout(this.coreAlertTimeout);
    this.coreAlertTimeout = setTimeout(() => {
      banner.classList.add('hidden');
    }, 1850);
  }

  showWaveAnnouncement(text) {
    const alertEl = document.getElementById('boss-alert');
    if (!alertEl) return;
    alertEl.innerHTML = `${renderSpriteIconHTML('core', 'sm')} <span>${text}</span> ${renderSpriteIconHTML('warning', 'sm')}`;
    alertEl.classList.remove('hidden');

    if (this.waveBannerTimeout) clearTimeout(this.waveBannerTimeout);
    this.waveBannerTimeout = setTimeout(() => {
      alertEl.classList.add('hidden');
    }, 2600);
  }

  /**
   * Actualiza el marcador/flecha direccional hacia el Núcleo cuando el jugador se aleja o no lo mira.
   */
}