// HUD: stats, núcleo, radar, inventario, avisos y prompts de torretas.
// Exports: HUDController, SHORT_WEAPON_NAMES.
import * as THREE from 'three';
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
    this.scrapToastTimeout = null;
  }

  /**
   * Configura qué elementos del HUD se muestran según el modo activo.
   */
  applyModeLayout(hudConfig) {
    const isDefense = hudConfig.modeId === 'core_defense';

    const coreHudBox = document.getElementById('core-defense-hud');
    if (coreHudBox) coreHudBox.classList.toggle('hidden', !isDefense);

    const dirIndicator = document.getElementById('core-direction-indicator');
    if (dirIndicator) {
      const showMarker = isDefense && !!hudConfig.showCoreDirectionMarker;
      dirIndicator.classList.toggle('hidden', !showMarker);
      if (!showMarker) dirIndicator.style.display = 'none';
    }

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

    const coopTransfer = document.getElementById('coop-scrap-transfer');
    if (coopTransfer) {
      coopTransfer.classList.toggle('hidden', !(isDefense && !!hudConfig.coopScrapTransfer));
    }
    const coopToast = document.getElementById('coop-scrap-toast');
    if (coopToast && !isDefense) coopToast.classList.add('hidden');

    if (!isDefense) {
      document.getElementById('turret-interact-prompt')?.classList.add('hidden');
      document.getElementById('wave-prep-prompt')?.classList.add('hidden');
      document.getElementById('btn-toggle-turret-ranges')?.classList.add('hidden');
    } else {
      document.getElementById('btn-toggle-turret-ranges')?.classList.remove('hidden');
    }

    const turretsItem = document.getElementById('floating-turrets-item');
    if (turretsItem) turretsItem.style.display = isDefense ? '' : 'none';
  }


  updateStatsAndModeHUD(stats, kills, runSouls, rerollsLeft, activeBoss, modeTelemetry) {
    updateStatsAndModeHUD(stats, kills, runSouls, rerollsLeft, activeBoss, modeTelemetry);
  }

  updateInventoryHUD(skills, passives, lastUpgradedKey) {
    updateInventoryHUD(skills, passives, lastUpgradedKey);
  }

  hideCoreDirectionIndicator() {
    const dirIndicator = document.getElementById('core-direction-indicator');
    if (dirIndicator) {
      dirIndicator.classList.add('hidden');
      dirIndicator.style.display = 'none';
    }
  }

  updateCoreDirectionIndicator(camera, playerPos, corePos, coreRatio = 1) {
    updateCoreDirectionIndicator(camera, playerPos, corePos, coreRatio);
  }

  updateRadarHUD(playerPos, yaw, activeEnemies, activeBoss, corePos = null, coopPos = null) {
    updateRadarHUD(playerPos, yaw, activeEnemies, activeBoss, corePos, coopPos);
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
    const hpGhostEl = document.getElementById('boss-hp-bar-ghost');
    if (hpGhostEl) {
      const currentBossGhost = parseFloat(hpGhostEl.style.width) || 100;
      if (pct >= currentBossGhost) {
        hpGhostEl.style.transition = 'none';
        hpGhostEl.style.width = `${pct}%`;
      } else {
        hpGhostEl.style.transition = 'width 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
        hpGhostEl.style.width = `${pct}%`;
      }
    }

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
    const hpGhostEl = document.getElementById('boss-hp-bar-ghost');
    if (hpGhostEl) hpGhostEl.style.width = '0%';

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

  // Número de daño flotante proyectado desde el mundo (feedback del Cliente).
  showDamageNumber(camera, worldPos, damage, isCrit = false) {
    const container = document.getElementById('damage-numbers');
    if (!container || !camera || !worldPos) return;
    const projected = worldPos.clone().project(camera);
    if (projected.z > 1 || projected.z < -1) return;
    const x = (projected.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-projected.y * 0.5 + 0.5) * window.innerHeight;
    if (x < -40 || y < -40 || x > window.innerWidth + 40 || y > window.innerHeight + 40) return;

    const el = document.createElement('div');
    el.className = `dmg-number${isCrit ? ' is-crit' : ''}`;
    el.textContent = `${isCrit ? '¡' : ''}${Math.round(damage)}${isCrit ? '!' : ''}`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 780);
  }

  showScrapTransferToast(text, tone = 'send') {
    const el = document.getElementById('coop-scrap-toast');
    if (!el) return;
    el.textContent = text;
    el.classList.remove('hidden', 'is-send', 'is-receive', 'is-error');
    el.classList.add(tone === 'receive' ? 'is-receive' : (tone === 'error' ? 'is-error' : 'is-send'));
    if (this.scrapToastTimeout) clearTimeout(this.scrapToastTimeout);
    this.scrapToastTimeout = setTimeout(() => {
      el.classList.add('hidden');
    }, 1900);
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

  showPlayerDownOverlay(totalDurationSec = 5, corePenalty = 10) {
    const overlay = document.getElementById('player-down-overlay');
    if (!overlay) return;
    const titleEl = overlay.querySelector('.player-down-title');
    if (titleEl) {
      titleEl.textContent = `[ OPERADOR ABATIDO // SOBRECARGA DEL NÚCLEO -${corePenalty} VIDAS ]`;
    }
    const cdEl = document.getElementById('player-down-countdown');
    if (cdEl) {
      cdEl.textContent = `RECONSTRUYENDO EN ${totalDurationSec.toFixed(1)}s...`;
    }
    const barEl = document.getElementById('player-down-progress-bar');
    if (barEl) {
      barEl.style.width = '0%';
    }
    overlay.classList.remove('hidden');
  }

  updatePlayerDownCountdown(remainingSec, totalDurationSec = 5) {
    const cdEl = document.getElementById('player-down-countdown');
    if (cdEl) {
      cdEl.textContent = `RECONSTRUYENDO EN ${Math.max(0, remainingSec).toFixed(1)}s...`;
    }
    const barEl = document.getElementById('player-down-progress-bar');
    if (barEl) {
      const pct = Math.min(100, Math.max(0, (1 - (remainingSec / totalDurationSec)) * 100));
      barEl.style.width = `${pct}%`;
    }
  }

  hidePlayerDownOverlay() {
    const overlay = document.getElementById('player-down-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  showKineticAlertBanner({ tag = 'ALERTA DE SECTOR', title = 'EVENTO INICIADO', sub = '', theme = 'hazard', durationMs = 3500 } = {}) {
    const banner = document.getElementById('kinetic-event-banner');
    if (!banner) return;

    banner.classList.remove('hidden', 'theme-critical', 'theme-success');
    if (theme === 'critical') banner.classList.add('theme-critical');
    else if (theme === 'success') banner.classList.add('theme-success');

    const tagEl = document.getElementById('kinetic-banner-tag');
    if (tagEl) tagEl.textContent = tag;
    const titleEl = document.getElementById('kinetic-banner-title');
    if (titleEl) titleEl.textContent = title;
    const subEl = document.getElementById('kinetic-banner-sub');
    if (subEl) subEl.textContent = sub;

    if (this.kineticBannerTimeout) clearTimeout(this.kineticBannerTimeout);
    this.kineticBannerTimeout = setTimeout(() => {
      banner.classList.add('hidden');
    }, durationMs);
  }

  hideKineticAlertBanner() {
    const banner = document.getElementById('kinetic-event-banner');
    if (banner) banner.classList.add('hidden');
    if (this.kineticBannerTimeout) {
      clearTimeout(this.kineticBannerTimeout);
      this.kineticBannerTimeout = null;
    }
  }

  showTeammateDownAlert(msg = '¡COMPAÑERO ABATIDO! -10 VIDAS AL NÚCLEO') {
    this.showKineticAlertBanner({
      tag: '¡COMPAÑERO ABATIDO!',
      title: msg,
      sub: 'PENALIZACIÓN AL NÚCLEO // CUBRE SU POSICIÓN',
      theme: 'critical',
      durationMs: 3800
    });
  }

}
