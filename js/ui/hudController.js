import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { renderSpriteIconHTML } from '../spritesheets.js';

export const SHORT_WEAPON_NAMES = {
  slash:        'Sierra',
  shotgun:      'Escopeta',
  flamethrower: 'Soplete',
  aura:         'Incensario',
  mines:        'Minas',
  harpoon:      'Arpón',
  orbital:      'Jaula',
  bolt:         'Desfibril.'
};

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
    const hpPct = Math.min(100, Math.max(0, (stats.hp / Math.max(1, stats.maxHp)) * 100));
    const expPct = Math.min(100, Math.max(0, (stats.exp / Math.max(1, stats.maxExp)) * 100));
    const stamPct = Math.min(100, Math.max(0, stats.stamina));

    document.getElementById('hp-bar').style.width = `${hpPct}%`;
    document.getElementById('hp-text').textContent = `${Math.ceil(Math.max(0, stats.hp))}/${stats.maxHp}`;
    document.getElementById('exp-bar').style.width = `${expPct}%`;
    document.getElementById('stam-bar').style.width = `${stamPct}%`;
    document.getElementById('level-text').textContent = `CICLO ${String(stats.level).padStart(2, '0')}`;
    document.getElementById('kills-text').textContent = kills;
    document.getElementById('souls-hud').textContent = `${runSouls}`;

    const compactItems = document.querySelectorAll('.counters-row-compact .compact-indicator-item');
    if (compactItems.length >= 3) {
      const valSpan = compactItems[2].querySelector('span:last-child');
      if (valSpan) valSpan.textContent = `${rerollsLeft}`;
    }

    if (!modeTelemetry) return;

    const bossAlertBox = document.getElementById('boss-killed-alert');
    const bossesKilledEl = document.getElementById('bosses-killed-hud');
    if (bossesKilledEl) {
      bossesKilledEl.textContent = `${modeTelemetry.bossesDefeated || 0}/${modeTelemetry.totalBosses || 5}`;
    }
    if (bossAlertBox) {
      bossAlertBox.classList.toggle('hidden', (modeTelemetry.bossesDefeated || 0) === 0 && !activeBoss);
    }

    const objDesc = document.getElementById('objective-task-desc');
    const chkBox = document.querySelector('#hud-objective-tracker .checkbox-box');
    const nextBossText = document.getElementById('next-boss-text');
    const waveText = document.getElementById('wave-text');

    if (objDesc) objDesc.textContent = modeTelemetry.objectiveText;
    if (chkBox) chkBox.textContent = modeTelemetry.objectiveCheck || '[ ]';
    if (nextBossText) nextBossText.textContent = modeTelemetry.subTaskText || '';
    if (waveText) waveText.textContent = modeTelemetry.waveBadgeText || '';

    // Elementos exclusivos del modo Defensa del Núcleo
    if (typeof modeTelemetry.coreHp === 'number') {
      const corePct = Math.min(100, Math.max(0, modeTelemetry.coreRatio * 100));
      const coreBar = document.getElementById('core-hp-bar');
      const coreVal = document.getElementById('core-hp-text');
      const coreWave = document.getElementById('core-wave-counter');
      const coreRem = document.getElementById('core-enemies-left');
      const coreStatus = document.getElementById('core-state-tag');

      if (coreBar) coreBar.style.width = `${corePct}%`;
      if (coreVal) coreVal.textContent = `${modeTelemetry.coreHp} / ${modeTelemetry.coreMaxHp}`;
      if (coreWave) coreWave.textContent = `OLEADA ${modeTelemetry.waveNumber}/${modeTelemetry.totalWaves}`;
      if (coreRem) coreRem.textContent = `HOSTILES: ${modeTelemetry.remainingEnemies}`;
      if (coreStatus) {
        coreStatus.textContent = modeTelemetry.coreStateLabel || 'ESTABLE';
        coreStatus.classList.toggle('critical', corePct < 45);
      }

      const scrapEl = document.getElementById('core-scrap-counter');
      if (scrapEl) scrapEl.textContent = `CHATARRA: ${modeTelemetry.scrap || 0}`;

      const turretEl = document.getElementById('core-turret-counter');
      if (turretEl) {
        turretEl.textContent = `TORRETAS: ${modeTelemetry.turretCount || 0}/${modeTelemetry.turretMax || 0}`;
      }

      const prompt = document.getElementById('turret-interact-prompt');
      const promptText = document.getElementById('turret-interact-text');
      const keyCap = document.getElementById('turret-key-cap');
      const placement = modeTelemetry.placement;
      const nearby = modeTelemetry.nearbyTurret;

      if (prompt) {
        prompt.classList.remove('hidden');
        prompt.classList.toggle('is-invalid', !!(placement && placement.active && !placement.valid));

        if (placement && placement.active) {
          if (keyCap) keyCap.textContent = 'LMB';
          if (promptText) {
            promptText.textContent = placement.valid
              ? `COLOCAR ${placement.typeName} · ${placement.cost} CHATARRA · [ESC] CANCELAR`
              : `${placement.reason} · [ESC] CANCELAR`;
          }
        } else if (nearby) {
          if (keyCap) keyCap.textContent = 'E';
          if (promptText) promptText.textContent = `MEJORAR / VENDER · ${nearby.name}`;
        } else {
          if (keyCap) keyCap.textContent = 'E';
          if (promptText) promptText.textContent = 'CONSTRUIR TORRETA';
        }
      }
    }
  }

  updateInventoryHUD(skills, passives, lastUpgradedKey) {
    const wEntries = Object.entries(skills);
    let wHtml = '';
    for (let i = 0; i < CONFIG.LIMITS.MAX_WEAPONS; i++) {
      if (wEntries[i]) {
        const [k, v] = wEntries[i];
        const sk = CONFIG.SKILLS[k];
        const shortName = SHORT_WEAPON_NAMES[k] || sk.name.split(' ')[0];
        const vibClass = lastUpgradedKey === k ? 'vibrate-up' : '';
        wHtml += `
          <div class="weapon-slot ${vibClass}" tabindex="0" title="${sk.name} (Nivel +${v}) — ${sk.desc}">
            <span class="weapon-slot-name">${renderSpriteIconHTML(sk.icon, 'sm')} <span>${shortName}</span></span>
            <span class="weapon-slot-lvl-text">NV.${v}</span>
          </div>`;
      } else {
        wHtml += `
          <div class="weapon-slot empty" title="Ranura de arma disponible">
            <span class="weapon-slot-name"><span>VACÍA</span></span>
            <span class="weapon-slot-lvl-text">--</span>
          </div>`;
      }
    }
    document.getElementById('skills-bar').innerHTML = wHtml;

    const pEntries = Object.entries(passives);
    const pCountEl = document.getElementById('passives-count');
    if (pCountEl) pCountEl.textContent = `${pEntries.length}`;

    let pHtml = '';
    for (let i = 0; i < CONFIG.LIMITS.MAX_PASSIVES; i++) {
      if (pEntries[i]) {
        const [k, v] = pEntries[i];
        const p = CONFIG.PASSIVES[k];
        const vibClass = lastUpgradedKey === k ? 'vibrate-up' : '';
        pHtml += `
          <div class="passive-slot ${vibClass}" tabindex="0" title="${p.name} (Nivel +${v}): ${p.format(v)} — ${p.desc}">
            <div class="passive-dock-icon-wrap">
              ${renderSpriteIconHTML(p.icon)}
            </div>
            <span class="passive-dock-lvl">x${v}</span>
          </div>`;
      } else {
        pHtml += `
          <div class="passive-slot empty" title="Ranura de implante pasivo disponible">
            <div class="passive-dock-icon-wrap">
              <span style="font-family:'Press Start 2P',monospace;font-size:8px;color:#6c7a65;">[ ]</span>
            </div>
            <span class="passive-dock-lvl">--</span>
          </div>`;
      }
    }
    document.getElementById('passives-bar').innerHTML = pHtml;
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
  updateCoreDirectionIndicator(camera, playerPos, corePos, coreRatio = 1) {
    const indicator = document.getElementById('core-direction-indicator');
    if (!indicator || !corePos) return;

    const dist = Math.hypot(corePos.x - playerPos.x, corePos.z - playerPos.z);
    const targetWorld = new THREE.Vector3(corePos.x, corePos.y + 2.8, corePos.z);
    const projected = targetWorld.clone().project(camera);

    const isBehind = projected.z > 1.0;
    const isOnScreen = !isBehind && Math.abs(projected.x) < 0.72 && Math.abs(projected.y) < 0.72;

    if (isOnScreen && dist < 14 && coreRatio > 0.5) {
      indicator.classList.add('dimmed');
    } else {
      indicator.classList.remove('dimmed');
    }

    let nx = projected.x;
    let ny = -projected.y;
    if (isBehind) {
      nx = -nx;
      ny = -ny;
    }

    const angle = Math.atan2(ny, nx);
    const radiusX = window.innerWidth * 0.36;
    const radiusY = window.innerHeight * 0.34;
    const cx = window.innerWidth * 0.5 + Math.cos(angle) * radiusX;
    const cy = window.innerHeight * 0.5 + Math.sin(angle) * radiusY;

    indicator.style.left = `${Math.round(cx)}px`;
    indicator.style.top = `${Math.round(cy)}px`;

    const arrowEl = indicator.querySelector('.core-dir-arrow');
    const distEl = indicator.querySelector('.core-dir-dist');
    if (arrowEl) {
      const deg = (angle * 180) / Math.PI + 90;
      arrowEl.style.transform = `rotate(${deg.toFixed(0)}deg)`;
    }
    if (distEl) {
      distEl.textContent = `NÚCLEO ${dist.toFixed(0)}M`;
    }
    indicator.classList.toggle('under-attack', coreRatio < 0.45);
  }

  updateRadarHUD(playerPos, yaw, activeEnemies, activeBoss, corePos = null) {
    const enemyDot = document.querySelector('.radar-dot.enemy-approx');
    const bossDot = document.querySelector('.radar-dot.boss-approx');
    const coreDot = document.querySelector('.radar-dot.core-approx');
    const threatLabel = document.getElementById('radar-threat-label');
    if (!enemyDot || !bossDot) return;

    const maxRadarDist = 34;
    const cosY = Math.cos(-yaw);
    const sinY = Math.sin(-yaw);

    // Punto del Núcleo en el radar (si estamos en modo Defensa)
    if (coreDot) {
      if (corePos) {
        coreDot.style.display = 'block';
        const dx = corePos.x - playerPos.x;
        const dz = corePos.z - playerPos.z;
        const rx = dx * cosY - dz * sinY;
        const rz = dx * sinY + dz * cosY;
        const normX = Math.max(-0.82, Math.min(0.82, rx / maxRadarDist));
        const normZ = Math.max(-0.82, Math.min(0.82, rz / maxRadarDist));
        coreDot.style.left = `${50 + normX * 42}%`;
        coreDot.style.top = `${50 + normZ * 42}%`;
      } else {
        coreDot.style.display = 'none';
      }
    }

    if (activeBoss && activeBoss.active && activeBoss.state !== 'dead') {
      bossDot.style.display = 'block';
      const dx = activeBoss.group.position.x - playerPos.x;
      const dz = activeBoss.group.position.z - playerPos.z;
      const rx = dx * cosY - dz * sinY;
      const rz = dx * sinY + dz * cosY;
      const normX = Math.max(-0.82, Math.min(0.82, rx / maxRadarDist));
      const normZ = Math.max(-0.82, Math.min(0.82, rz / maxRadarDist));
      bossDot.style.left = `${50 + normX * 42}%`;
      bossDot.style.top = `${50 + normZ * 42}%`;
      bossDot.style.right = 'auto';
    } else {
      bossDot.style.display = 'none';
    }

    let closest = null;
    let minDist = Infinity;
    for (let i = 0; i < activeEnemies.length; i++) {
      const e = activeEnemies[i];
      if (e.state === 'dead' || e.isBoss) continue;
      const d = e.group.position.distanceTo(playerPos);
      if (d < minDist) {
        minDist = d;
        closest = e;
      }
    }

    if (closest) {
      enemyDot.style.display = 'block';
      const dx = closest.group.position.x - playerPos.x;
      const dz = closest.group.position.z - playerPos.z;
      const rx = dx * cosY - dz * sinY;
      const rz = dx * sinY + dz * cosY;
      const normX = Math.max(-0.8, Math.min(0.8, rx / maxRadarDist));
      const normZ = Math.max(-0.8, Math.min(0.8, rz / maxRadarDist));
      enemyDot.style.left = `${50 + normX * 40}%`;
      enemyDot.style.top = `${50 + normZ * 40}%`;
    } else {
      enemyDot.style.display = 'none';
    }

    if (threatLabel) {
      if (activeBoss && activeBoss.active) {
        threatLabel.textContent = 'ALERTA: JEFE';
        threatLabel.style.color = '#ff6b6b';
      } else if (minDist < 8) {
        threatLabel.textContent = 'PROXIMIDAD CRÍTICA';
        threatLabel.style.color = '#f0c954';
      } else {
        threatLabel.textContent = `HOSTILES: ${activeEnemies.length}`;
        threatLabel.style.color = '#a8c499';
      }
    }
  }
}