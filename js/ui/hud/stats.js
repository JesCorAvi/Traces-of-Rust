// HUD de estadísticas, telemetría de modo e inventario de armas/pasivas.
// Exports: SHORT_WEAPON_NAMES, updateStatsAndModeHUD, updateInventoryHUD.

import { CONFIG } from '../../config.js';
import { renderSpriteIconHTML } from '../../spritesheets.js';
import { ModeManager } from '../../modes/gameModeManager.js';
import { AudioSys } from '../../audio.js';
import { t } from '../../core/i18n.js';

const _t = (k, fb) => (typeof t === 'function' ? t(k) : fb);

export const SHORT_WEAPON_NAMES = {
  get slash()        { return _t('weapon.short.slash', 'Sierra'); },
  get shotgun()      { return _t('weapon.short.shotgun', 'Escopeta'); },
  get flamethrower() { return _t('weapon.short.flamethrower', 'Soplete'); },
  get aura()         { return _t('weapon.short.aura', 'Incensario'); },
  get mines()        { return _t('weapon.short.mines', 'Minas'); },
  get harpoon()      { return _t('weapon.short.harpoon', 'Arpón'); },
  get orbital()      { return _t('weapon.short.orbital', 'Jaula'); },
  get bolt()         { return _t('weapon.short.bolt', 'Desfibril.'); },
  get chakram()      { return _t('weapon.short.chakram', 'Bumerán'); },
  get welder()       { return _t('weapon.short.welder', 'Soldador'); },
  get grenade()      { return _t('weapon.short.grenade', 'Granadas'); },
  get hammer()       { return _t('weapon.short.hammer', 'Martillo'); },
  get acid()         { return _t('weapon.short.acid', 'Ácido'); }
};

export function updateStatsAndModeHUD(stats, kills, runSouls, rerollsLeft, activeBoss, modeTelemetry) {
const hpPct = Math.min(100, Math.max(0, (stats.hp / Math.max(1, stats.maxHp)) * 100));
const expPct = Math.min(100, Math.max(0, (stats.exp / Math.max(1, stats.maxExp)) * 100));
const stamPct = Math.min(100, Math.max(0, stats.stamina));

const hpBar = document.getElementById('hp-bar');
if (hpBar) hpBar.style.width = `${hpPct}%`;
const hpGhost = document.getElementById('hp-bar-ghost');
if (hpGhost) {
  const currentGhost = parseFloat(hpGhost.style.width) || 100;
  if (hpPct >= currentGhost) {
    hpGhost.style.transition = 'none';
    hpGhost.style.width = `${hpPct}%`;
  } else {
    hpGhost.style.transition = 'width 0.45s cubic-bezier(0.25, 1, 0.5, 1)';
    hpGhost.style.width = `${hpPct}%`;
  }
}
const bioPlate = document.querySelector('.biometrics-plate-compact');
if (bioPlate) bioPlate.classList.toggle('is-critical', hpPct <= 25);

document.getElementById('hp-text').textContent = `${Math.ceil(Math.max(0, stats.hp))}/${stats.maxHp}`;
document.getElementById('exp-bar').style.width = `${expPct}%`;
document.getElementById('stam-bar').style.width = `${stamPct}%`;
document.getElementById('level-text').textContent = _t('ui.results.cycle_val', 'CICLO {level}').replace('{level}', String(stats.level).padStart(2, '0'));
document.getElementById('kills-text').textContent = kills;
document.getElementById('souls-hud').textContent = `${runSouls}`;
if (!modeTelemetry || typeof modeTelemetry.coreHp !== 'number') {
  const scrapEl = document.getElementById('core-scrap-counter');
  if (scrapEl) scrapEl.textContent = `${runSouls}`;
}

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
  const coreGhost = document.getElementById('core-hp-bar-ghost');
  if (coreGhost) {
    const currentCoreGhost = parseFloat(coreGhost.style.width) || 100;
    if (corePct >= currentCoreGhost) {
      coreGhost.style.transition = 'none';
      coreGhost.style.width = `${corePct}%`;
    } else {
      coreGhost.style.transition = 'width 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
      coreGhost.style.width = `${corePct}%`;
    }
  }
  const coreHudBox = document.getElementById('core-defense-hud');
  if (coreHudBox) coreHudBox.classList.toggle('is-critical', corePct <= 25);
  if (coreVal) {
    const displayHp = Math.ceil(Number(modeTelemetry.coreHp) || 0);
    const displayMax = Math.round(Number(modeTelemetry.coreMaxHp) || 100);
    coreVal.textContent = _t('hud.core.integrity', '{hp}/{max} INTEGRIDAD').replace('{hp}', displayHp).replace('{max}', displayMax);
  }
  if (coreWave) {
    if (modeTelemetry.eventBadge) {
      coreWave.textContent = _t('hud.wave.event_badge', 'EVENTO // {title}').replace('{title}', modeTelemetry.eventBadge);
    } else {
      coreWave.textContent = _t('hud.wave.in_progress', 'OLEADA {current}/{total}').replace('{current}', modeTelemetry.waveNumber).replace('{total}', modeTelemetry.totalWaves);
    }
  }
  if (coreRem) {
    if (modeTelemetry.isFirstWavePrep || modeTelemetry.isPrep) {
      coreRem.textContent = _t('hud.core.hostiles_counter', 'HOSTILES: {count}').replace('{count}', '0');
    } else {
      coreRem.textContent = _t('hud.core.hostiles_counter', 'HOSTILES: {count}').replace('{count}', modeTelemetry.remainingEnemies || 0);
    }
  }
  if (coreStatus) {
    if (modeTelemetry.isFirstWavePrep) {
      coreStatus.textContent = _t('hud.core.state_free_exploration', 'EXPLORACIÓN LIBRE');
      coreStatus.classList.remove('critical');
    } else if (modeTelemetry.isPrep) {
      coreStatus.textContent = _t('hud.core.state_pause', 'PAUSA: {seconds}S').replace('{seconds}', Math.ceil(modeTelemetry.prepSeconds));
      coreStatus.classList.remove('critical');
    } else {
      coreStatus.textContent = modeTelemetry.coreStateLabel || _t('hud.core.state_stable', 'ESTABLE');
      coreStatus.classList.toggle('critical', corePct < 45);
    }
  }

  const scrapEl = document.getElementById('core-scrap-counter');
  if (scrapEl) scrapEl.textContent = `${modeTelemetry.scrap || 0}`;

  const turretEl = document.getElementById('core-turret-counter');
  if (turretEl) {
    turretEl.textContent = `${modeTelemetry.turretCount || 0}/${modeTelemetry.turretMax || 16}`;
  }

  
  // Indicador persistente de evento especial de contención (75s por defecto)
  const eventHud = document.getElementById('defense-event-hud');
  if (eventHud) {
    if (modeTelemetry && modeTelemetry.eventTelemetry) {
      const et = modeTelemetry.eventTelemetry;
      eventHud.classList.remove('hidden');
      const phaseEl = document.getElementById('event-hud-phase');
      const timerEl = document.getElementById('event-hud-timer');
      const indEl = document.getElementById('event-containment-indicator');
      const fillEl = document.getElementById('event-hud-bar-fill');

      if (phaseEl) {
        phaseEl.textContent = _t('hud.event.phase_format', 'FASE {phase}: {title}').replace('{phase}', et.phase).replace('{title}', et.phaseTitle);
      }
      if (timerEl) {
        timerEl.textContent = `${Math.ceil(et.remainingSec)}s`;
      }
      if (indEl) {
        if (et.inZone) {
          indEl.className = 'event-containment-indicator in-zone';
          indEl.textContent = _t('hud.event.inside_perimeter', '● DENTRO DEL PERÍMETRO (RADIO 15M)');
        } else {
          indEl.className = 'event-containment-indicator out-zone';
          indEl.textContent = _t('hud.event.outside_perimeter', '▲ FUERA DEL PERÍMETRO (A {dist}m) - ¡REGRESA!').replace('{dist}', et.distOutside);
        }
      }
      if (fillEl) {
        const pct = Math.min(100, Math.max(0, (et.progress || 0) * 100));
        fillEl.style.width = `${pct}%`;
      }
    } else {
      eventHud.classList.add('hidden');
    }
  }

  const btnRanges = document.getElementById('btn-toggle-turret-ranges');
  if (btnRanges) {
    btnRanges.classList.toggle('is-active', !!modeTelemetry.turretRangesVisible);
    if (!btnRanges.dataset.bound) {
      btnRanges.dataset.bound = 'true';
      const toggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const mode = ModeManager.activeMode;
        if (mode?.toggleTurretRanges) {
          const visible = mode.toggleTurretRanges();
          btnRanges.classList.toggle('is-active', !!visible);
          AudioSys.playUIClick?.();
        }
      };
      btnRanges.addEventListener('click', toggle);
      btnRanges.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') toggle(e);
      });
    }
  }

  const prepPrompt = document.getElementById('wave-prep-prompt');
  if (prepPrompt) {
    prepPrompt.classList.toggle('hidden', !modeTelemetry.isPrep);
    const skipSpan = document.getElementById('prep-skip-text') || prepPrompt.querySelector('.prep-skip-pill span:last-child');
    if (skipSpan) {
      skipSpan.textContent = modeTelemetry.isFirstWavePrep ? _t('hud.wave.start_wave', 'INICIAR OLEADA') : _t('hud.wave.skip_pause', 'SALTAR PAUSA');
    }
    if (!prepPrompt.dataset.bound) {
      prepPrompt.dataset.bound = 'true';
      const skip = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const mode = ModeManager.activeMode;
        if (mode?.canSkipPrep?.()) {
          mode.skipPrep();
        }
      };
      prepPrompt.addEventListener('click', skip);
      prepPrompt.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') skip(e);
      });
    }
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
          ? _t('hud.turret.place_valid', 'COLOCAR {name} · {cost} CHATARRA · [ESC] CANCELAR').replace('{name}', placement.typeName).replace('{cost}', placement.cost)
          : _t('hud.turret.place_invalid', '{reason} · [ESC] CANCELAR').replace('{reason}', placement.reason);
      }
    } else if (nearby) {
      if (keyCap) keyCap.textContent = 'E';
      if (promptText) promptText.textContent = _t('hud.turret.upgrade_sell', 'MEJORAR / VENDER · {name}').replace('{name}', nearby.name);
    } else {
      if (keyCap) keyCap.textContent = 'E';
      if (promptText) promptText.textContent = _t('hud.turret.build_turret', 'CONSTRUIR TORRETA');
    }
  }
}
}

export function updateInventoryHUD(skills, passives, lastUpgradedKey) {
const wEntries = Object.entries(skills);
let wHtml = '';
for (let i = 0; i < CONFIG.LIMITS.MAX_WEAPONS; i++) {
  if (wEntries[i]) {
    const [k, v] = wEntries[i];
    const sk = CONFIG.SKILLS[k];
    const shortName = SHORT_WEAPON_NAMES[k] || sk.name.split(' ')[0];
    const vibClass = lastUpgradedKey === k ? 'vibrate-up' : '';
    const titleStr = _t('hud.slot.weapon_title', '{name} (Nivel +{lvl}) — {desc}')
      .replace('{name}', sk.name)
      .replace('{lvl}', v)
      .replace('{desc}', sk.desc);
    const lvlStr = _t('hud.slot.level_short', 'NV.{lvl}').replace('{lvl}', v);
    wHtml += `
      <div class="weapon-slot ${vibClass}" tabindex="0" title="${titleStr}">
        <span class="weapon-slot-name">${renderSpriteIconHTML(sk.icon, "sm")}</span>
        <span class="weapon-slot-lvl-text">${lvlStr}</span>
      </div>`;
  } else {
    wHtml += `
      <div class="weapon-slot empty" title="${_t('hud.slot.weapon_empty', 'Ranura de arma disponible')}"></div>`;
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
    const titleStr = _t('hud.slot.passive_title', '{name} (Nivel +{lvl}): {stat} — {desc}')
      .replace('{name}', p.name)
      .replace('{lvl}', v)
      .replace('{stat}', p.format(v))
      .replace('{desc}', p.desc);
    pHtml += `
      <div class="passive-slot ${vibClass}" tabindex="0" title="${titleStr}">
        <div class="passive-dock-icon-wrap">
          ${renderSpriteIconHTML(p.icon, 'sm')}
        </div>
        <span class="passive-dock-lvl">x${v}</span>
      </div>`;
  } else {
    pHtml += `
      <div class="passive-slot empty" title="${_t('hud.slot.passive_empty', 'Ranura de implante disponible')}"></div>`;
  }
}
document.getElementById('passives-bar').innerHTML = pHtml;
}
