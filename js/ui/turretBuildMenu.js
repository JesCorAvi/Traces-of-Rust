// Panel DOM de construcción, mejora y venta de torretas.
// Exports: TurretBuildMenu.
import { CORE_DEFENSE_CONFIG } from '../config/coreDefenseConfig.js';
import { AudioSys } from '../audio.js';
import { renderSpriteIconHTML } from '../spritesheets.js';

// ============================================================================
// PANEL DE CONSTRUCCIÓN, MEJORA Y VENTA DE TORRETAS (COLOCACIÓN LIBRE)
// ============================================================================

function formatStats(cfg) {
  const b = cfg.base;
  switch (cfg.id) {
    case 'gunner':
      return `DAÑO ${b.damage} · CAD ${b.fireRate.toFixed(1)}/s · RANGO ${b.range}m`;
    case 'mortar':
      return `DAÑO ${b.damage} · ÁREA ${b.aoeRadius}m · CAD ${b.fireRate.toFixed(2)}/s`;
    case 'cryo':
      return `RALENT. ${Math.round((1 - b.slowFactor) * 100)}% · RADIO ${b.aoeRadius}m`;
    case 'barracks':
      return `ALIADOS ${b.allyCap} · CADA ${b.spawnInterval}s`;
    case 'support':
      return `CURA ${b.healAmount} · RADIO ${b.healRadius}m`;
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
  }

  ensureDom() {
    if (this.overlay) return;
    this.overlay = document.getElementById('turret-build-screen');
    this.content = document.getElementById('turret-build-content');
    const closeBtn = document.getElementById('btn-close-turret-build');
    if (closeBtn) closeBtn.onclick = () => this.close();
  }

  open(mode, turret, onClose) {
    this.ensureDom();
    if (!this.overlay) return;
    this.mode = mode;
    this.turretId = turret ? turret.id : null;
    this.onClose = onClose;
    this.isOpen = true;
    this.overlay.classList.remove('hidden');
    this.render();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    if (this.overlay) this.overlay.classList.add('hidden');
    const cb = this.onClose;
    this.onClose = null;
    if (cb) cb();
  }

  render() {
    if (!this.isOpen || !this.mode) return;

    const scrap = this.mode.getScrap();
    const turret = this.turretId ? this.mode.getTurretById(this.turretId) : null;

    if (this.turretId && !turret) {
      this.close();
      return;
    }

    const title = turret ? `TORRETA // ${turret.cfg.name}` : 'TERMINAL DE CONSTRUCCIÓN // TORRETAS';
    const head = `
      <div class="turret-panel-head">
        <span class="tape-strip">${renderSpriteIconHTML(turret ? turret.cfg.icon : 'turret_gunner', 'sm')} ${title}</span>
        <span class="turret-scrap-balance">${renderSpriteIconHTML('scrap', 'sm')} <b>${scrap}</b> CHATARRA</span>
      </div>`;

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
        ${head}
        <p class="turret-panel-sub">Elige una torreta y colócala libremente. Al cerrar este panel podrás apuntar al suelo: <b>verde</b> = válido, <b>rojo</b> = bloqueado. Clic izquierdo o <b>E</b> para colocar; <b>ESC</b> para cancelar.</p>
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
            ${!st.lockReason && scrap < st.next.cost ? '<div class="turret-lock">CHATARRA INSUFICIENTE</div>' : ''}
            <button class="rust-btn sm" data-action="upgrade" data-path="${i}" ${can ? '' : 'disabled'}>
              MEJORAR (${st.next.cost})
            </button>`;
        } else {
          nextBlock = `<div class="turret-next-name">NIVEL MÁXIMO</div>`;
        }

        return `
          <div class="turret-path" style="--path-color:${pathColorHex(path.color)}">
            <div class="turret-path-name">${path.name}</div>
            <div class="turret-pips">${pips}</div>
            ${nextBlock}
          </div>`;
      }).join('');

      this.content.innerHTML = `
        ${head}
        <div class="turret-summary">
          <span class="turret-summary-title">${renderSpriteIconHTML(cfg.icon, 'sm')} ${cfg.name}</span>
          <span class="turret-summary-role">${cfg.role}</span>
        </div>
        <div class="turret-summary-bar">
          <div class="turret-summary-hp" style="width:${hpPct}%"></div>
        </div>
        <div class="turret-summary-sub">INTEGRIDAD ${Math.ceil(turret.hp)} / ${turret.maxHp}</div>
        <div class="turret-upgrade-grid">${paths}</div>
        <div class="turret-panel-actions">
          <button class="rust-btn sm" data-action="switch-build">CONSTRUIR OTRA TORRETA</button>
          <button class="rust-btn sm danger" data-action="sell">VENDER (+${turret.getSellValue()} CHATARRA)</button>
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

    if (action === 'build') {
      const turretId = btn.dataset.turret;
      if (this.mode.beginTurretPlacement(turretId)) {
        this.close();
      } else {
        AudioSys.playUIError();
      }
      return;
    }

    if (action === 'upgrade') {
      const pathIndex = Number(btn.dataset.path);
      if (this.mode.upgradeTurret(this.turretId, pathIndex)) {
        this.render();
      } else {
        AudioSys.playUIError();
      }
      return;
    }

    if (action === 'sell') {
      const refund = this.mode.sellTurret(this.turretId);
      if (refund > 0) {
        AudioSys.playUISelect();
        this.close();
      } else {
        AudioSys.playUIError();
      }
    }
  }
}
