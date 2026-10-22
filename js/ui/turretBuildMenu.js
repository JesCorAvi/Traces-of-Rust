// Panel DOM de construcción, mejora y venta de torretas.
// Exports: TurretBuildMenu.
import { CORE_DEFENSE_CONFIG } from '../config/coreDefenseConfig.js';
import { AudioSys } from '../audio.js';
import { renderSpriteIconHTML } from '../spritesheets.js';
import { t } from '../core/i18n.js';
import { GameEvents } from '../core/eventBus.js';

// ============================================================================
// PANEL DE CONSTRUCCIÓN, MEJORA Y VENTA DE TORRETAS (COLOCACIÓN LIBRE)
// ============================================================================

function formatStats(cfg) {
  const b = cfg.base;
  const dmg = t('turret.stat.damage');
  const cad = t('turret.stat.fireRate');
  const rng = t('turret.stat.range');
  const aoe = t('turret.stat.aoe');
  const rlt = t('turret.stat.slow');
  const rad = t('turret.stat.radius');
  const ally = t('turret.stat.allies');
  const ev = t('turret.stat.every');
  const bDmg = t('turret.stat.buffDamage');
  const chn = t('turret.stat.chain');
  const brn = t('turret.stat.burn');
  const sgl = t('turret.stat.singleTarget');
  const scr = t('turret.stat.scrapPerWave');
  const psh = t('turret.stat.push');
  const stn = t('turret.stat.stun');

  switch (cfg.id) {
    case 'gunner':
      return `${dmg} ${b.damage} · ${cad} ${b.fireRate.toFixed(1)}/s · ${rng} ${b.range}m`;
    case 'mortar':
      return `${dmg} ${b.damage} · ${aoe} ${b.aoeRadius}m · ${cad} ${b.fireRate.toFixed(2)}/s`;
    case 'cryo':
      return `${rlt} ${Math.round((1 - b.slowFactor) * 100)}% · ${rad} ${b.aoeRadius}m`;
    case 'barracks':
      return `${ally} ${b.allyCap} · ${ev} ${b.spawnInterval}s`;
    case 'support':
      return `${bDmg} +${Math.round((b.buffDamage || 0.15) * 100)}% · ${cad} +${Math.round((b.buffFireRate || 0.15) * 100)}% · ${rad} ${b.range}m`;
    case 'tesla':
      return `${dmg} ${b.damage} · ${cad} ${b.fireRate.toFixed(1)}/s · ${chn} ${b.chainCount} · ${rng} ${b.range}m`;
    case 'incinerator':
      return `${dmg} ${b.damage} · ${brn} ${b.burnDps}/s · ${rng} ${b.range}m`;
    case 'railgun':
      return `${dmg} ${b.damage} · ${rng} ${b.range}m · ${sgl}`;
    case 'collector':
      return `${scr} +${b.scrapPerWave} · +${b.scrapAmount}/${b.scrapInterval}s`;
    case 'press':
      return `${dmg} ${b.damage} · ${aoe} ${b.aoeRadius}m · ${stn} ${b.freezeDuration}s`;
    case 'ejector':
      return `${psh} ${b.pushDistance}m · ${aoe} ${b.aoeRadius}m · ${cad} ${b.fireRate.toFixed(1)}/s`;
    default:
      return '';
  }
}

function pathColorHex(color) {
  return `#${color.toString(16).padStart(6, '0')}`;
}

export class TurretBuildMenu {
  constructor() {
    this.overlay = null;
    this.content = null;
    this.mode = null;
    this.turretId = null;
    this.onClose = null;
    this.isOpen = false;

    GameEvents.on('i18n:change', () => {
      if (this.isOpen) {
        this.render();
      }
    });
  }

  ensureDom() {
    if (this.overlay) return;
    this.overlay = document.getElementById('turret-build-screen');
    this.content = document.getElementById('turret-build-content');
    const closeBtn = document.getElementById('btn-close-turret-build');
    if (closeBtn) closeBtn.onclick = () => this.close();
    const skipBtn = document.getElementById('btn-skip-prep-build');
    if (skipBtn) {
      skipBtn.onclick = () => {
        if (this.mode?.canSkipPrep?.()) {
          this.close();
          this.mode.skipPrep();
        }
      };
    }
  }

  open(mode, turret, onClose) {
    this.ensureDom();
    if (!this.overlay) return;
    this.mode = mode;
    this.turretId = turret ? turret.id : null;
    this.onClose = onClose;
    this.isOpen = true;
    this.overlay.classList.remove('hidden');
    AudioSys.setMenuFilter?.(true);
    this.render();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    if (this.overlay) this.overlay.classList.add('hidden');
    AudioSys.setMenuFilter?.(false);
    const cb = this.onClose;
    this.onClose = null;
    if (cb) cb();
  }

  // Cierre forzado sin ejecutar onClose (por ejemplo, al terminar la partida
  // mientras el panel estaba abierto en co-op).
  closeSilently() {
    this.isOpen = false;
    this.onClose = null;
    this.turretId = null;
    if (this.overlay) this.overlay.classList.add('hidden');
    AudioSys.setMenuFilter?.(false);
  }

  render() {
    if (!this.isOpen || !this.mode) return;

    const skipBtn = document.getElementById('btn-skip-prep-build');
    if (skipBtn) {
      skipBtn.classList.toggle('hidden', !this.mode?.canSkipPrep?.());
    }

    const scrap = this.mode.getScrap();
    const turret = this.turretId ? this.mode.getTurretById(this.turretId) : null;

    if (this.turretId && !turret) {
      this.close();
      return;
    }

    const title = turret ? t('ui.turret_modal.title_turret', { name: turret.cfg.name }) : t('ui.turret_modal.title_place');
    const titleEl = document.getElementById('turret-modal-title-text');
    if (titleEl) titleEl.textContent = title;
    const iconEl = document.getElementById('turret-modal-icon');
    if (iconEl) iconEl.setAttribute('data-ui-icon', turret ? turret.cfg.icon : 'turret_gunner');
    const scrapValEl = document.getElementById('turret-modal-scrap-val');
    if (scrapValEl) scrapValEl.textContent = `${scrap}`;

    if (!turret) {
      const cards = Object.values(CORE_DEFENSE_CONFIG.TURRETS).map(cfg => {
        const can = scrap >= cfg.cost;
        return `
          <button class="turret-card ${can ? '' : 'is-locked'}"
                  data-action="build" data-turret="${cfg.id}" ${can ? '' : 'disabled'}>
            <span class="turret-card-top">
              ${renderSpriteIconHTML(cfg.icon, 'sm')}
              <span class="turret-card-name">${cfg.name}</span>
              <span class="turret-card-cost">${cfg.cost}</span>
            </span>
            <span class="turret-card-role">${cfg.role}</span>
            <span class="turret-card-desc">${cfg.description}</span>
            <span class="turret-card-stats">${formatStats(cfg)}</span>
          </button>`;
      }).join('');

      this.content.innerHTML = `
        <p class="turret-panel-sub">${t('ui.turret_modal.place_instructions_html')}</p>
        <div class="turret-shop-grid">${cards}</div>`;
    } else {
      const cfg = turret.cfg;
      const hpPct = Math.max(0, Math.min(100, (turret.hp / turret.maxHp) * 100));

      const paths = turret.paths.map((path, i) => {
        const st = turret.getUpgradeState(i);
        const pips = [1, 2, 3, 4].map(tier =>
          `<span class="turret-pip ${tier <= st.level ? 'is-filled' : ''}"></span>`
        ).join('');

        let nextBlock;
        if (st.next) {
          const can = st.canBuy && scrap >= st.next.cost;
          nextBlock = `
            <div class="turret-next-name">${st.next.name}</div>
            <div class="turret-next-desc">${st.next.desc}</div>
            ${st.lockReason ? `<div class="turret-lock">${st.lockReason}</div>` : ''}
            ${!st.lockReason && scrap < st.next.cost ? `<div class="turret-lock">${t('ui.turret_modal.not_enough_scrap')}</div>` : ''}
            <button class="rust-btn sm" data-action="upgrade" data-path="${i}" ${can ? '' : 'disabled'}>
              ${t('ui.turret_modal.upgrade_btn', { cost: st.next.cost })}
            </button>`;
        } else {
          nextBlock = `<div class="turret-next-name">${t('ui.turret_modal.max_level')}</div>`;
        }

        return `
          <div class="turret-path" style="--path-color:${pathColorHex(path.color)}">
            <div class="turret-path-name">${path.name}</div>
            <div class="turret-pips">${pips}</div>
            ${nextBlock}
          </div>`;
      }).join('');

      this.content.innerHTML = `
        <div class="turret-summary">
          <span class="turret-summary-title">${renderSpriteIconHTML(cfg.icon, 'sm')} ${cfg.name}</span>
          <span class="turret-summary-role">${cfg.role}</span>
        </div>
        <div class="turret-summary-bar">
          <div class="turret-summary-hp" style="width:${hpPct}%"></div>
        </div>
        <div class="turret-summary-sub">${t('ui.turret_modal.integrity', { hp: Math.ceil(turret.hp), maxHp: turret.maxHp })}</div>
        <div class="turret-upgrade-grid">${paths}</div>
        <div class="turret-panel-actions">
          <button class="rust-btn sm" data-action="switch-build">${t('ui.turret_modal.btn_switch_build')}</button>
          <button class="rust-btn sm danger" data-action="sell">${t('ui.turret_modal.btn_sell', { refund: turret.getSellValue() })}</button>
        </div>`;
    }

    this.content.querySelectorAll('[data-action]').forEach(btn => {
      btn.onclick = () => this.handleAction(btn);
    });
  }

  handleAction(btn) {
    const action = btn.dataset.action;
    if (!action || !this.mode) return;

    if (action === 'switch-build') {
      this.turretId = null;
      this.render();
      return;
    }

    if (action === 'send-scrap') {
      if (!this.mode.sendScrapToPeer?.(5)) AudioSys.playUIError();
      return;
    }

    if (action === 'build') {
      const turretId = btn.dataset.turret;
      if (this.mode.beginTurretPlacement(turretId)) {
        this.close();
      }
      return;
    }

    if (action === 'upgrade') {
      const pathIdx = parseInt(btn.dataset.path, 10);
      const turret = this.turretId ? this.mode.getTurretById(this.turretId) : null;
      if (turret && this.mode.upgradeTurret(turret, pathIdx)) {
        AudioSys.playUISelect();
        this.render();
      } else {
        AudioSys.playUIError();
      }
      return;
    }

    if (action === 'sell') {
      const turret = this.turretId ? this.mode.getTurretById(this.turretId) : null;
      if (turret) {
        this.mode.sellTurret(turret);
        this.close();
      }
    }
  }
}
