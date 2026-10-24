// Interfaz del modo Chiringuito: HUD de fases, construcción, recetario,
// comandas, minijuego de cocina y resúmenes de día/temporada.
// Exports: ChiringuitoUI.

import { CONFIG, CHIRINGUITO_CONFIG } from '../config.js';
import { AudioSys } from '../audio.js';
import { MinigameRunner } from '../minigames/MinigameRunner.js';
import { CookingGame } from '../minigames/games/cooking/CookingGame.js';
import { FishingGame } from '../minigames/games/fishing/FishingGame.js';
import { HarvestGame } from '../minigames/games/harvest/HarvestGame.js';
import { PlantingGame } from '../minigames/games/planting/PlantingGame.js';

function el(tag, className = '', html = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html) node.innerHTML = html;
  return node;
}

function formatSeconds(value) {
  const sec = Math.max(0, Math.ceil(Number(value) || 0));
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

function pct(value) {
  return `${Math.max(0, Math.min(100, Math.round((Number(value) || 0) * 100)))}%`;
}

function ingredientHtml(id, amount = null) {
  const ingredient = CHIRINGUITO_CONFIG.getIngredient(id);
  if (!ingredient) return '';
  const n = amount !== null ? ` <b>×${amount}</b>` : '';
  return `<span class="cg-ingredient"><span class="cg-dot" style="background:${ingredient.color}"></span>${ingredient.shortName}${n}</span>`;
}

function qualityClass(id) {
  return `cg-quality-${id || 'burnt'}`;
}

export class ChiringuitoUI {
  constructor(mode) {
    this.mode = mode;
    this.overlayRoot = null;
    this.hud = null;
    this.buildOverlay = null;
    this.recipeOverlay = null;
    this.orderOverlay = null;
    this.cookingOverlay = null;
    this.fishingOverlay = null;
    this.summaryOverlay = null;
    this.buildTab = 'turrets';
    this._hudTimer = 0;
    this._panelTimer = 0;
    this._cookingMinigame = null;
    this._cookingOrderId = null;
    this._cookingCancelOnClose = true;
    this._fishingMinigame = null;
    this._harvestMinigame = null;
    this._harvestPlotId = null;
    this._plantingMinigame = null;
    this._plantingPlotId = null;
    this._modalOpen = false;
    this._summaryPhase = null;

    document.body.classList.add('chiringuito-mode');
    this.nightTint = el('div', 'chiringuito-night-tint');
    document.body.appendChild(this.nightTint);
    this._createHud();
    this._createBuildOverlay();
    this._createRecipeOverlay();
    this._createOrderOverlay();
    this._createSummaryOverlay();
    this._bindGlobalInput();
    this.updateAll();
  }

  // ------------------------------------------------------------------------
  // HUD
  // ------------------------------------------------------------------------
  _createHud() {
    const host = document.getElementById('hud') || document.body;
    this.hud = el('div', '', '');
    this.hud.id = 'chiringuito-hud';
    this.hud.innerHTML = `
      <div class="cg-hud-top">
        <div class="cg-season-phase">
          <div class="cg-season-line"><span id="cg-season-label">TEMPORADA I</span> <span id="cg-day-label">DÍA 01/15</span></div>
          <div class="cg-phase-line"><span id="cg-phase-label">MAÑANA</span><span id="cg-phase-timer"></span></div>
        </div>
        <div class="cg-pantry">
          <div class="cg-micro-label">DESPENSA <b id="cg-pantry-text">150/150</b></div>
          <div class="cg-bar"><div class="cg-bar-fill" id="cg-pantry-fill"></div></div>
        </div>
        <div class="cg-phase-action-wrap">
          <button type="button" class="rust-btn sm cg-phase-btn hidden" id="cg-phase-action">F · INICIAR TARDE</button>
        </div>
      </div>

      <div class="cg-hud-left">
        <div class="cg-resource-row">
          <span class="cg-resource"><span class="cg-resource-key">MADERA</span><b id="cg-scrap">0</b></span>
          <span class="cg-resource"><span class="cg-resource-key">PERLAS</span><b id="cg-pearls">0</b></span>
          <span class="cg-resource"><span class="cg-resource-key">CANGREJO</span><b id="cg-crab">0</b></span>
        </div>
        <div class="cg-service-row">
          <span id="cg-seats">PLAZAS 0</span>
          <span id="cg-orders">COMANDAS 0</span>
          <span id="cg-carried">MANOS LIBRES</span>
        </div>
        <div class="cg-action-row">
          <button type="button" class="rust-btn sm" id="cg-open-build">B · CONSTRUIR</button>
          <button type="button" class="rust-btn sm" id="cg-open-recipes">I · RECETARIO</button>
        </div>
        <div class="cg-objective" id="cg-objective">GESTIONA EL CHIRINGUITO</div>
      </div>

      <div class="cg-prompt hidden" id="cg-interact-prompt">
        <span class="cg-key" id="cg-interact-key">E</span>
        <span id="cg-interact-text">INTERACTUAR</span>
      </div>

      <div class="cg-night-ticket" id="cg-night-ticket">
        <span id="cg-night-ticket-text"></span>
      </div>
    `;
    host.appendChild(this.hud);
    this.refs = {
      season: this.hud.querySelector('#cg-season-label'),
      day: this.hud.querySelector('#cg-day-label'),
      phase: this.hud.querySelector('#cg-phase-label'),
      phaseTimer: this.hud.querySelector('#cg-phase-timer'),
      pantryText: this.hud.querySelector('#cg-pantry-text'),
      pantryFill: this.hud.querySelector('#cg-pantry-fill'),
      phaseAction: this.hud.querySelector('#cg-phase-action'),
      scrap: this.hud.querySelector('#cg-scrap'),
      pearls: this.hud.querySelector('#cg-pearls'),
      crab: this.hud.querySelector('#cg-crab'),
      seats: this.hud.querySelector('#cg-seats'),
      orders: this.hud.querySelector('#cg-orders'),
      carried: this.hud.querySelector('#cg-carried'),
      objective: this.hud.querySelector('#cg-objective'),
      prompt: this.hud.querySelector('#cg-interact-prompt'),
      promptKey: this.hud.querySelector('#cg-interact-key'),
      promptText: this.hud.querySelector('#cg-interact-text'),
      nightTicket: this.hud.querySelector('#cg-night-ticket'),
      nightTicketText: this.hud.querySelector('#cg-night-ticket-text'),
      openBuild: this.hud.querySelector('#cg-open-build'),
      openRecipes: this.hud.querySelector('#cg-open-recipes')
    };
    this.refs.phaseAction.addEventListener('click', () => {
      AudioSys.playUISelect?.();
      this.mode.handlePhaseAction();
      this.updateAll();
    });
    this.refs.openBuild.addEventListener('click', () => this.openBuildMenu());
    this.refs.openRecipes.addEventListener('click', () => this.openRecipeBook());
    this.refs.prompt.addEventListener('click', () => {
      if (this.blocksGameplayInput()) return;
      if (this.mode.isTurretPlacementActive?.()) this.mode.confirmTurretPlacement();
      else if (this.mode.isFurniturePlacementActive?.()) this.mode.confirmFurniturePlacement();
      else this.mode.handleInteract();
      this.updateAll();
    });
  }

  updateHUD() {
    if (!this.refs) return;
    const t = this.mode.getChiringuitoTelemetry();
    if (!t) return;
    document.body.classList.toggle('chiringuito-night', !!t.isNight);
    this.refs.season.textContent = (t.seasonLabel || 'TEMPORADA').toUpperCase();
    this.refs.day.textContent = `DÍA ${String(t.day).padStart(2, '0')}/${t.daysPerSeason || 15}`;
    this.refs.phase.textContent = t.phaseLabel || '';
    this.refs.phase.dataset.phase = t.phase || '';
    let timer = t.phaseTimer > 0 ? formatSeconds(t.phaseTimer) : '';
    if (t.isAfternoon) timer = `OLEADA ${t.waveNumber || 1}/${t.waveTotal || 2} · ${t.remainingEnemies || 0} HOSTILES`;
    this.refs.phaseTimer.textContent = timer;
    this.refs.phaseTimer.classList.toggle('hidden', !timer);
    const warningSec = CHIRINGUITO_CONFIG.PHASE_TIMERS?.morningWarningSec ?? 30;
    this.refs.phaseTimer.classList.toggle('is-warning', t.phase === 'MORNING' && t.phaseTimer > 0 && t.phaseTimer <= warningSec);
    this.refs.pantryText.textContent = `${Math.round(t.pantryLives)}/${Math.round(t.pantryMax)}`;
    this.refs.pantryFill.style.width = pct(t.pantryLives / Math.max(1, t.pantryMax));
    this.refs.pantryFill.classList.toggle('is-low', t.pantryLives / Math.max(1, t.pantryMax) <= 0.25);
    this.refs.scrap.textContent = Math.floor(t.scrap || 0);
    this.refs.pearls.textContent = Math.floor(t.pearls || 0);
    this.refs.crab.textContent = Math.floor(t.crab || 0);
    const occupied = t.service?.occupiedSeats || 0;
    this.refs.seats.textContent = `PLAZAS ${occupied}/${t.capacity || 0}`;
    const activeOrders = this.mode.restaurant?.orders.getActiveOrders().length || 0;
    this.refs.orders.textContent = `COMANDAS ${activeOrders}`;
    const carried = t.carriedPlate;
    this.refs.carried.textContent = carried
      ? `LLEVAS: ${(CHIRINGUITO_CONFIG.getRecipe(carried.recipeId)?.name || 'PLATO').toUpperCase()}`
      : 'MANOS LIBRES';
    this.refs.carried.classList.toggle('is-carrying', !!carried);
    this.refs.objective.textContent = t.phaseLabel === 'MAÑANA'
      ? 'RECOGE INGREDIENTES · CONSTRUYE · REVISA RECETAS'
      : t.phaseLabel === 'TARDE'
        ? 'DEFIENDE LA DESPENSA CON TUS TORRETAS'
        : t.phaseLabel === 'NOCHE'
          ? 'COCINA Y SIRVE LOS PEDIDOS'
          : 'GESTIONA EL CHIRINGUITO';
    this.refs.nightTicket.classList.toggle('hidden', !t.isNight);
    if (t.isNight) {
      this.refs.nightTicketText.textContent = `SERVICIO // ${t.service?.served || 0} servidos · ${t.service?.lost || 0} perdidos · ${Math.round(t.service?.reputation || t.reputation || 0)} reputación`;
    }
    const actionLabel = this.mode.getPhaseActionLabel();
    this.refs.phaseAction.textContent = `F · ${actionLabel}`;
    this.refs.phaseAction.classList.toggle('hidden', !actionLabel || this._summaryPhase);
    this.refs.openBuild.classList.toggle('hidden', !(t.canBuildTurrets || t.canBuildFurniture));
    this.refs.openRecipes.classList.toggle('hidden', t.phase !== 'MORNING');
    const placement = t.placement || t.placingFurniture;
    let promptData = t.nearby;
    if (placement) {
      const movingText = placement.valid
        ? `COLOCAR ${String(placement.typeId || '').toUpperCase()} · CLIC O E PARA CONFIRMAR`
        : `NO VÁLIDO: ${placement.reason || 'ZONA BLOQUEADA'}`;
      promptData = { key: 'E', text: movingText };
    }
    this.refs.prompt.classList.toggle('hidden', !promptData || this.blocksGameplayInput());
    if (promptData) {
      this.refs.promptKey.textContent = promptData.key || 'E';
      this.refs.promptText.textContent = promptData.text || 'INTERACTUAR';
    }
  }

  updateAll() {
    this.updateHUD();
    if (this.buildOverlay && !this.buildOverlay.classList.contains('hidden')) this._renderBuildMenu(false);
    if (this.recipeOverlay && !this.recipeOverlay.classList.contains('hidden')) this._renderRecipeBook(false);
    if (this.orderOverlay && !this.orderOverlay.classList.contains('hidden')) this._renderOrderBoard(false);
  }

  updateLive(dt) {
    this._hudTimer -= dt;
    if (this._hudTimer <= 0) {
      this._hudTimer = 0.18;
      this.updateHUD();
    }
    const morningTimer = this.mode.director?.phase === 'MORNING' ? this.mode.director.phaseTimer : 0;
    if (this.orderOverlay && !this.orderOverlay.classList.contains('hidden')) {
      this._panelTimer -= dt;
      if (this._panelTimer <= 0) {
        this._panelTimer = 0.6;
        this._renderOrderBoard(false);
      }
    }
  }

  // ------------------------------------------------------------------------
  // Overlays comunes
  // ------------------------------------------------------------------------
  _createOverlayShell(id, extraClass = '') {
    const overlay = el('div', `overlay hidden cg-overlay ${extraClass}`);
    overlay.id = id;
    const panel = el('div', 'metal-plate cg-panel');
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    return { overlay, panel };
  }

  _openOverlay(overlay) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    this._modalOpen = true;
    document.body.classList.add('chiringuito-modal-open');
    if (document.pointerLockElement) document.exitPointerLock?.();
  }

  _closeOverlay(overlay) {
    if (!overlay) return;
    overlay.classList.add('hidden');
    this._modalOpen = [this.buildOverlay, this.recipeOverlay, this.orderOverlay, this.cookingOverlay, this.fishingOverlay, this.summaryOverlay]
      .some(el => el && !el.classList.contains('hidden'));
    if (!this._modalOpen) {
      document.body.classList.remove('chiringuito-modal-open');
      this._requestPointerLock();
    }
  }

  _requestPointerLock() {
    if (this._summaryPhase) return;
    if (!document.pointerLockElement) {
      try {
        const lockPromise = document.body.requestPointerLock?.();
        if (lockPromise?.catch) lockPromise.catch(() => {});
      } catch (err) {}
    }
  }

  blocksGameplayInput() {
    return !!this._modalOpen || !!this._summaryPhase || this.isCookingOpen() || this.isFishingOpen() || this.isHarvestOpen() || this.isPlantingOpen();
  }

  closeAllPanels() {
    this._destroyCookingMinigame({ cancelOrder: true });
    this._destroyFishingMinigame();
    this._destroyHarvestMinigame();
    this._destroyPlantingMinigame();
    for (const overlay of [this.buildOverlay, this.recipeOverlay, this.orderOverlay, this.cookingOverlay, this.fishingOverlay, this.summaryOverlay]) {
      overlay?.classList.add('hidden');
    }
    this._summaryPhase = null;
    this._modalOpen = false;
    document.body.classList.remove('chiringuito-modal-open');
  }

  destroy() {
    this._destroyCookingMinigame({ cancelOrder: false });
    this._destroyFishingMinigame();
    this._destroyHarvestMinigame();
    this._destroyPlantingMinigame();
    document.body.classList.remove('chiringuito-mode', 'chiringuito-modal-open', 'chiringuito-night');
    this.nightTint?.remove();
    this.nightTint = null;
    this.hud?.remove();
    this.buildOverlay?.remove();
    this.recipeOverlay?.remove();
    this.orderOverlay?.remove();
    this.cookingOverlay?.remove();
    this.fishingOverlay?.remove();
    this.summaryOverlay?.remove();
    this.hud = null;
    this.buildOverlay = null;
    this.recipeOverlay = null;
    this.orderOverlay = null;
    this.cookingOverlay = null;
    this.summaryOverlay = null;
    this._modalOpen = false;
    this._summaryPhase = null;
  }

  // ------------------------------------------------------------------------
  // Construcción
  // ------------------------------------------------------------------------
  _createBuildOverlay() {
    const { overlay, panel } = this._createOverlayShell('cg-build-screen');
    panel.innerHTML = `
      <div class="cg-panel-header">
        <span class="tape-label">TERMINAL DE CONSTRUCCIÓN // CHIRINGUITO</span>
        <span class="cg-wallet" id="cg-build-wallet"></span>
        <button type="button" class="rust-btn sm" id="cg-build-close">[ CERRAR (B) ]</button>
      </div>
      <div class="cg-tabs">
        <button type="button" class="rust-btn sm is-active" data-cg-build-tab="turrets">TORRETAS</button>
        <button type="button" class="rust-btn sm" data-cg-build-tab="furniture">CHIRINGUITO</button>
      </div>
      <div class="cg-panel-body" id="cg-build-content"></div>
      <div class="cg-panel-footer" id="cg-build-footer">COLOCA TORRETAS PARA LA TARDE Y MOBILIARIO PARA LA NOCHE.</div>
    `;
    this.buildOverlay = overlay;
    this.buildContent = panel.querySelector('#cg-build-content');
    this.buildWallet = panel.querySelector('#cg-build-wallet');
    panel.querySelector('#cg-build-close').addEventListener('click', () => this.closeBuildMenu());
    panel.querySelectorAll('[data-cg-build-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.buildTab = btn.dataset.cgBuildTab;
        panel.querySelectorAll('[data-cg-build-tab]').forEach(b => b.classList.toggle('is-active', b === btn));
        this._renderBuildMenu();
      });
    });
    overlay.addEventListener('mousedown', e => {
      if (e.target === overlay) this.closeBuildMenu();
    });
  }

  openBuildMenu() {
    if (!this.buildOverlay) return;
    AudioSys.playUIClick?.();
    this._closeOtherOverlays(this.buildOverlay);
    this._renderBuildMenu();
    this._openOverlay(this.buildOverlay);
  }

  closeBuildMenu() {
    if (!this.buildOverlay) return;
    this._closeOverlay(this.buildOverlay);
  }

  _renderBuildMenu(playSound = false) {
    if (!this.buildContent) return;
    const t = this.mode.getChiringuitoTelemetry();
    if (!t) return;
    this.buildWallet.innerHTML = `<span>MADERA <b>${Math.floor(t.scrap)}</b></span><span>PERLAS <b>${Math.floor(t.pearls)}</b></span>`;
    if (this.buildTab === 'turrets') {
      const turrets = Object.values(CONFIG.CORE_DEFENSE?.TURRETS || {});
      this.buildContent.innerHTML = turrets.map(turret => `
        <div class="cg-card">
          <div class="cg-card-head"><b>${turret.name}</b><span class="cg-cost">${turret.cost} MADERA</span></div>
          <div class="cg-card-sub">${turret.desc || 'TORRETA DE DEFENSA'}</div>
          <button type="button" class="rust-btn sm" data-cg-build-turret="${turret.id}" ${t.canBuildTurrets && t.scrap >= turret.cost ? '' : 'disabled'}>
            COLOCAR TORRETA
          </button>
        </div>
      `).join('');
      this.buildContent.querySelectorAll('[data-cg-build-turret]').forEach(btn => {
        btn.addEventListener('click', () => {
          const ok = this.mode.beginTurretPlacement(btn.dataset.cgBuildTurret);
          if (ok) {
            if (playSound) AudioSys.playUIClick?.();
            this.closeBuildMenu();
          } else AudioSys.playUIError?.();
        });
      });
      this.buildContent.querySelectorAll('button').forEach(b => {
        if (b.dataset.cgBuildTurret) b.disabled = b.disabled || !t.canBuildTurrets;
      });
      if (this.buildOverlay) {
        const footer = this.buildOverlay.querySelector('#cg-build-footer');
        if (footer) footer.textContent = t.canBuildTurrets
          ? 'COLOCA TORRETAS DURANTE LA MAÑANA O LA TARDE. CLIC IZQUIERDO CONFIRMA, ESC/CANCELA.'
          : 'LAS TORRETAS SOLO SE CONSTRUYEN DURANTE LA MAÑANA O LA TARDE.';
      }
    } else {
      const furniture = this.mode.getFurnitureCatalog();
      const upgrades = this.mode.getRestaurantUpgradeData();
      const placedFurniture = this.mode.restaurant.furniture.getExtraItems();
      const furnitureHtml = furniture.map(item => `
        <div class="cg-card">
          <div class="cg-card-head"><b>${item.name}</b><span class="cg-cost">${item.cost} PERLAS</span></div>
          <div class="cg-card-sub">${item.desc}</div>
          <div class="cg-card-meta">${item.seats ? `PLAZAS +${item.seats}` : ''} ${item.charm ? `· ENCANTO +${item.charm}` : ''} ${item.tipBonus ? `· PROPINAS +${Math.round(item.tipBonus * 100)}%` : ''}</div>
          <button type="button" class="rust-btn sm" data-cg-build-furniture="${item.id}" ${t.canBuildFurniture && t.pearls >= item.cost ? '' : 'disabled'}>COLOCAR MUEBLE</button>
        </div>
      `).join('');
      const upgradesHtml = upgrades.map(upgrade => `
        <div class="cg-card cg-upgrade-card">
          <div class="cg-card-head"><b>${upgrade.name}</b><span class="cg-cost">${upgrade.cost} PERLAS</span></div>
          <div class="cg-card-sub">${upgrade.desc}</div>
          <button type="button" class="rust-btn sm" data-cg-buy-upgrade="${upgrade.id}" ${(upgrade.owned || !upgrade.canBuy?.ok) ? 'disabled' : ''}>
            ${upgrade.owned ? 'YA CONSTRUIDA' : (upgrade.canBuy?.ok ? 'COMPRAR MEJORA' : ({ PERLAS_INSUFICIENTES: 'FALTAN PERLAS', REQUIERE_MEJORA_PREVIA: 'REQUIERE MEJORA PREVIA' }[upgrade.canBuy?.reason] || 'NO DISPONIBLE'))}
          </button>
        </div>
      `).join('');
      this.buildContent.innerHTML = `
        <div class="cg-section-title">TERRAZA Y DECORACIÓN</div>
        <div class="cg-card-grid">${furnitureHtml}</div>
        <div class="cg-section-title">MEJORAS DEL CHIRINGUITO</div>
        <div class="cg-card-grid">${upgradesHtml}</div>
        <div class="cg-section-title">MOBILIARIO COLOCADO</div>
        <div class="cg-card-grid">${placedFurniture.length ? placedFurniture.map(item => `
          <div class="cg-card"><div class="cg-card-head"><b>${item.cfg.name}</b><span class="cg-cost">${Math.floor((item.cfg.cost || 0) * 0.5)} PERLAS AL VENDER</span></div><button type="button" class="rust-btn sm" data-cg-sell-furniture="${item.id}" ${t.canBuildFurniture ? '' : 'disabled'}>VENDER MUEBLE</button></div>
        `).join('') : '<div class="cg-empty">AÚN NO HAS COLOCADO MOBILIARIO.</div>'}</div>
      `;
      this.buildContent.querySelectorAll('[data-cg-build-furniture]').forEach(btn => {
        btn.addEventListener('click', () => {
          const ok = this.mode.beginFurniturePlacement(btn.dataset.cgBuildFurniture);
          if (ok) {
            if (playSound) AudioSys.playUIClick?.();
            this.closeBuildMenu();
          } else AudioSys.playUIError?.();
        });
      });
      this.buildContent.querySelectorAll('[data-cg-sell-furniture]').forEach(btn => {
        btn.addEventListener('click', () => {
          const ok = this.mode.sellFurniture(btn.dataset.cgSellFurniture);
          if (!ok) AudioSys.playUIError?.();
          else AudioSys.playUISelect?.();
          this._renderBuildMenu();
        });
      });
      this.buildContent.querySelectorAll('[data-cg-buy-upgrade]').forEach(btn => {
        btn.addEventListener('click', () => {
          const result = this.mode.buyRestaurantUpgrade(btn.dataset.cgBuyUpgrade);
          if (!result.ok) AudioSys.playUIError?.();
          else AudioSys.playUISelect?.();
          this._renderBuildMenu();
        });
      });
      if (this.buildOverlay) {
        const footer = this.buildOverlay.querySelector('#cg-build-footer');
        if (footer) footer.textContent = t.canBuildFurniture
          ? 'AMUEBLA LA TERRAZA POR LA MAÑANA. MÁS PLAZAS = MÁS CLIENTES Y PROPINAS.'
          : 'EL MOBILIARIO SOLO SE COLOCA POR LA MAÑANA.';
      }
    }
  }

  // ------------------------------------------------------------------------
  // Recetario / inventario
  // ------------------------------------------------------------------------
  _createRecipeOverlay() {
    const { overlay, panel } = this._createOverlayShell('cg-recipe-screen');
    panel.innerHTML = `
      <div class="cg-panel-header">
        <span class="tape-label">RECETARIO DE LA CALETA</span>
        <span class="cg-wallet" id="cg-recipe-wallet"></span>
        <button type="button" class="rust-btn sm" id="cg-recipe-close">[ CERRAR (I) ]</button>
      </div>
      <div class="cg-panel-body" id="cg-recipe-content"></div>
      <div class="cg-panel-footer">ELIGE LA CARTA DE HOY POR LA MAÑANA. LAS RECETAS DESBLOQUEADAS Y LAS MEJORAS PERSISTEN ENTRE TEMPORADAS.</div>
    `;
    this.recipeOverlay = overlay;
    this.recipeContent = panel.querySelector('#cg-recipe-content');
    this.recipeWallet = panel.querySelector('#cg-recipe-wallet');
    panel.querySelector('#cg-recipe-close').addEventListener('click', () => this.closeRecipeBook());
    overlay.addEventListener('mousedown', e => {
      if (e.target === overlay) this.closeRecipeBook();
    });
  }

  openRecipeBook() {
    if (!this.recipeOverlay) return;
    AudioSys.playUIClick?.();
    this._closeOtherOverlays(this.recipeOverlay);
    this._renderRecipeBook();
    this._openOverlay(this.recipeOverlay);
  }

  closeRecipeBook() {
    if (!this.recipeOverlay) return;
    this._closeOverlay(this.recipeOverlay);
  }

  _renderRecipeBook() {
    if (!this.recipeContent) return;
    const data = this.mode.getRecipeBookData();
    this.recipeWallet.innerHTML = `<span>PERLAS <b>${Math.floor(data.pearls || 0)}</b></span><span>CANGREJO <b>${data.stock.crab || 0}</b></span>`;
    const stockChips = Object.values(CHIRINGUITO_CONFIG.INGREDIENTS)
      .map(ing => `<span class="cg-stock-chip">${ingredientHtml(ing.id, data.stock[ing.id] || 0)}</span>`)
      .join('');
    const menuIds = new Set(data.menuRecipeIds || []);
    const menuCount = data.recipes.filter(recipe => recipe.unlocked && menuIds.has(recipe.id)).length;
    const cards = data.recipes.map(recipe => {
      const missing = recipe.availability.missing || [];
      const requirements = Object.entries(recipe.ingredients)
        .map(([id, amount]) => ingredientHtml(id, amount))
        .join('');
      const onMenu = menuIds.has(recipe.id);
      const menuButton = recipe.unlocked
        ? `<button type="button" class="rust-btn sm cg-menu-toggle ${onMenu ? 'is-on' : ''}" data-cg-menu="${recipe.id}" ${data.canEditMenu ? '' : 'disabled'}>${onMenu ? '✓ EN LA CARTA DE HOY' : '+ AÑADIR A LA CARTA'}</button>`
        : '';
      const unlock = recipe.unlocked
        ? `<span class="cg-ready ${recipe.availability.available ? 'is-ok' : 'is-missing'}">${recipe.availability.available ? 'LISTO PARA COCINAR' : 'FALTAN INGREDIENTES'}</span>`
        : `<button type="button" class="rust-btn sm" data-cg-unlock="${recipe.id}" ${data.pearls >= recipe.unlockCost ? '' : 'disabled'}>DESBLOQUEAR · ${recipe.unlockCost} PERLAS</button>`;
      return `
        <div class="cg-recipe-card ${recipe.unlocked ? '' : 'is-locked'} ${onMenu ? 'is-on-menu' : ''}">
          <div class="cg-recipe-head"><b>${recipe.name}</b><span class="cg-cost">${recipe.price} PERLAS / RACIÓN</span></div>
          <div class="cg-card-sub">${recipe.description}</div>
          <div class="cg-requirements">${requirements}</div>
          ${missing.length ? `<div class="cg-missing">FALTA: ${missing.map(m => `${CHIRINGUITO_CONFIG.getIngredient(m.id)?.shortName || m.id} ×${m.missing}`).join(' · ')}</div>` : ''}
          <div class="cg-recipe-actions">${unlock}${menuButton}</div>
        </div>
      `;
    }).join('');
    const menuHint = data.canEditMenu
      ? 'MARCA LOS PLATOS QUE QUIERES OFRECER ESTA NOCHE. LOS CLIENTES PEDIRÁN DE ESTA CARTA.'
      : 'LA CARTA SE ELIGE POR LA MAÑANA. DURANTE LA NOCHE SE MANTIENE LA SELECCIÓN DEL DÍA.';
    this.recipeContent.innerHTML = `
      <div class="cg-stock-row">${stockChips}</div>
      <div class="cg-menu-banner">
        <div class="cg-menu-banner-head"><b>CARTA DE HOY</b><span>${menuCount} PLATO${menuCount === 1 ? '' : 'S'} EN CARTA</span></div>
        <p>${menuHint}</p>
        ${menuCount === 0 ? '<div class="cg-missing">CARTA VACÍA: LOS CLIENTES PEDIRÁN CUALQUIER PLATO DISPONIBLE EN DESPENSA.</div>' : ''}
      </div>
      <div class="cg-section-title">PLATOS DE LA CASA</div>
      <div class="cg-recipe-grid">${cards}</div>
    `;
    this.recipeContent.querySelectorAll('[data-cg-unlock]').forEach(btn => {
      btn.addEventListener('click', () => {
        const result = this.mode.unlockRecipe(btn.dataset.cgUnlock);
        if (!result.ok) AudioSys.playUIError?.();
        else AudioSys.playUISelect?.();
        this._renderRecipeBook();
      });
    });
    this.recipeContent.querySelectorAll('[data-cg-menu]').forEach(btn => {
      btn.addEventListener('click', () => {
        const result = this.mode.toggleMenuRecipe(btn.dataset.cgMenu);
        if (!result.ok) AudioSys.playUIError?.();
        else AudioSys.playUISelect?.();
        this._renderRecipeBook();
      });
    });
  }

  // ------------------------------------------------------------------------
  // Comandas
  // ------------------------------------------------------------------------
  _createOrderOverlay() {
    const { overlay, panel } = this._createOverlayShell('cg-order-screen');
    panel.innerHTML = `
      <div class="cg-panel-header">
        <span class="tape-label">COMANDAS Y PASE DE COCINA</span>
        <button type="button" class="rust-btn sm" id="cg-order-close">[ CERRAR ]</button>
      </div>
      <div class="cg-panel-body" id="cg-order-content"></div>
      <div class="cg-panel-footer" id="cg-order-footer">ELIGE UN PEDIDO, COCÍNALO Y LLEVA EL PLATO A LA MESA.</div>
    `;
    this.orderOverlay = overlay;
    this.orderContent = panel.querySelector('#cg-order-content');
    panel.querySelector('#cg-order-close').addEventListener('click', () => this.closeOrderBoard());
    overlay.addEventListener('mousedown', e => {
      if (e.target === overlay) this.closeOrderBoard();
    });
  }

  openOrderBoard() {
    if (!this.orderOverlay) return;
    AudioSys.playUIClick?.();
    this._closeOtherOverlays(this.orderOverlay);
    this._renderOrderBoard();
    this._openOverlay(this.orderOverlay);
  }

  closeOrderBoard(restoreLock = true) {
    if (!this.orderOverlay) return;
    if (restoreLock) this._closeOverlay(this.orderOverlay);
    else this.orderOverlay.classList.add('hidden');
  }

  _renderOrderBoard() {
    if (!this.orderContent) return;
    const data = this.mode.getOrderBoardData();
    const ordersHtml = data.orders.length === 0
      ? '<div class="cg-empty">NO HAY COMANDAS ACTIVAS. LOS CLIENTES IRÁN LLEGANDO.</div>'
      : data.orders.map(order => {
        const customerName = order.customer?.archetype?.name || 'CLIENTE';
        const patience = pct(order.patienceRatio);
        const status = order.status === 'cooking'
          ? 'EN COCINA'
          : order.status === 'ready'
            ? 'PLATO LISTO'
            : 'ESPERANDO';
        const canClaim = order.canClaim && !order.claimantId;
        return `
          <div class="cg-ticket ${qualityClass(order.quality)}">
            <div class="cg-ticket-head">
              <span>${order.recipe?.name || 'PLATO'}</span>
              <span class="cg-ticket-status">${status}</span>
            </div>
            <div class="cg-ticket-sub">${customerName} · ${order.recipe?.price || 0} PERLAS BASE</div>
            <div class="cg-ticket-requirements">${Object.entries(order.recipe?.ingredients || {}).map(([id, n]) => ingredientHtml(id, n)).join('')}</div>
            <div class="cg-patience"><div class="cg-patience-fill" style="width:${patience}"></div></div>
            <button type="button" class="rust-btn sm" data-cg-cook="${order.id}" ${canClaim ? '' : 'disabled'}>${status === 'ESPERANDO' ? 'COCINAR ESTE PEDIDO' : status}</button>
          </div>
        `;
      }).join('');
    const platesHtml = data.plates.length
      ? data.plates.map(plate => `
        <div class="cg-plate-row">
          <span>${CHIRINGUITO_CONFIG.getRecipe(plate.recipeId)?.name || 'PLATO'} <em class="${qualityClass(plate.quality?.id)}">${plate.quality?.label || ''}</em></span>
          <button type="button" class="rust-btn sm" data-cg-plate-pick="${plate.id}">RECOGER PLATO</button>
        </div>
      `).join('')
      : '<div class="cg-empty">EL PASE ESTÁ VACÍO.</div>';
    this.orderContent.innerHTML = `
      <div class="cg-section-title">COMANDAS ACTIVAS</div>
      <div class="cg-ticket-grid">${ordersHtml}</div>
      <div class="cg-section-title">PASE DE PLATOS</div>
      <div class="cg-plate-list">${platesHtml}</div>
    `;
    this.orderContent.querySelectorAll('[data-cg-cook]').forEach(btn => {
      btn.addEventListener('click', () => {
        const result = this.mode.startCooking(btn.dataset.cgCook);
        if (!result.ok) {
          AudioSys.playUIError?.();
          this._renderOrderBoard(false);
          const footer = this.orderOverlay?.querySelector('#cg-order-footer');
          if (footer) footer.textContent = `NO SE PUDO COCINAR: ${result.reason || 'PEDIDO NO DISPONIBLE'}`;
          return;
        }
        this.closeOrderBoard(false);
        this.openCooking(result);
      });
    });
    this.orderContent.querySelectorAll('[data-cg-plate-pick]').forEach(btn => {
      btn.addEventListener('click', () => {
        const ok = this.mode.pickupPlate(btn.dataset.cgPlatePick);
        if (!ok) AudioSys.playUIError?.();
        else AudioSys.playUISelect?.();
        this.closeOrderBoard();
      });
    });
    const footer = this.orderOverlay?.querySelector('#cg-order-footer');
    if (footer) {
      footer.textContent = data.orders.some(o => o.canClaim)
        ? 'ELIGE UNA COMANDA, COMPLETA EL MINIJUEGO Y RECOGE EL PLATO DEL PASE.'
        : 'ESPERA A QUE LOS CLIENTES SE SIENTEN O A QUE SE LIBERE UN PEDIDO.';
    }
  }

  // ------------------------------------------------------------------------
  // Minijuego de cocina: puente con el sistema nuevo de minijuegos
  // ------------------------------------------------------------------------
  _getCookingDifficulty(recipe) {
    const season = this.mode?.director?.seasonIndex ?? 0;
    const day = this.mode?.director?.day ?? 1;
    const ingredients = Object.keys(recipe?.ingredients || {}).length;
    const price = Number(recipe?.price) || 0;
    const raw = 1
      + season * 1.1
      + Math.min(1.2, ingredients * 0.28)
      + Math.min(0.5, day / 30)
      + Math.min(0.4, price / 60);
    return Math.max(1, Math.min(5, Math.round(raw)));
  }

  isCookingOpen() {
    return !!this._cookingMinigame;
  }

  openCooking(data = {}) {
    if (!data?.recipe || this._cookingMinigame) return;
    const orderId = data.orderId || data.order?.id || null;
    this._closeOtherOverlays(null);
    this._cookingOrderId = orderId;
    this._cookingCancelOnClose = true;
    this._modalOpen = true;
    document.body.classList.add('chiringuito-modal-open');
    const difficulty = this._getCookingDifficulty(data.recipe);
    const recipeName = data.recipe.name || 'COCINA';
    AudioSys.playUISelect?.();
    let runner = null;
    try {
      runner = new MinigameRunner({
        title: `COCINA // ${recipeName.toUpperCase()}`,
        kicker: 'CHIRINGUITO // COCINA',
        difficulty,
        restorePointerLock: true,
        createGame: ({ services, difficulty: gameDifficulty }) => new CookingGame({
          services,
          difficulty: gameDifficulty,
          recipe: data.recipe,
          kitchenSpeed: data.kitchenSpeed || this.mode?.restaurant?.getKitchenSpeedBonus?.() || 0,
          orderId
        }),
        onComplete: result => this._completeCookingMinigame(result),
        onAbort: info => this._abortCookingMinigame(info),
        onError: error => {
          console.error('[ChiringuitoUI] Error en el minijuego de cocina:', error);
          this.updateAll();
        }
      });
      this._cookingMinigame = runner;
      runner.start();
    } catch (error) {
      console.error('[ChiringuitoUI] No se pudo abrir la cocina:', error);
      try { runner?.destroy(); } catch (destroyError) {}
      this._cookingMinigame = null;
      this._cookingOrderId = null;
      this._cookingCancelOnClose = true;
      this._modalOpen = false;
      document.body.classList.remove('chiringuito-modal-open');
      AudioSys.playUIError?.();
      if (orderId) this.mode.cancelCooking?.(orderId);
      this.updateAll();
    }
  }

  _completeCookingMinigame(result = {}) {
    const orderId = this._cookingOrderId;
    this._cookingMinigame = null;
    this._cookingOrderId = null;
    this._cookingCancelOnClose = true;
    this._modalOpen = false;
    document.body.classList.remove('chiringuito-modal-open');
    if (!orderId) return;
    const score = Math.max(0, Math.min(100, Math.round(Number(result.score) || 0)));
    const quality = CHIRINGUITO_CONFIG.getQualityTier(score);
    const completed = this.mode.completeCooking(orderId, {
      score,
      quality: quality?.id,
      durationMs: result.durationMs || 0
    });
    if (!completed?.ok) {
      AudioSys.playUIError?.();
    } else {
      AudioSys.playCookResult?.(quality?.id || 'ok');
    }
    this.updateAll();
  }

  _abortCookingMinigame(info = {}) {
    const orderId = this._cookingOrderId;
    const cancel = this._cookingCancelOnClose;
    this._cookingMinigame = null;
    this._cookingOrderId = null;
    this._cookingCancelOnClose = true;
    this._modalOpen = false;
    document.body.classList.remove('chiringuito-modal-open');
    if (orderId && cancel) this.mode.cancelCooking?.(orderId);
    AudioSys.playUIClick?.();
    this.updateAll();
  }

  _destroyCookingMinigame({ cancelOrder = false } = {}) {
    const runner = this._cookingMinigame;
    const orderId = this._cookingOrderId;
    this._cookingMinigame = null;
    this._cookingOrderId = null;
    this._cookingCancelOnClose = true;
    this._modalOpen = false;
    document.body.classList.remove('chiringuito-modal-open');
    if (runner) {
      runner.restorePointerLock = false;
      runner.destroy();
    }
    if (cancelOrder && orderId) this.mode.cancelCooking?.(orderId);
  }

  closeCooking(restoreLock = true, options = {}) {
    this._cookingCancelOnClose = options.cancelOrder !== false;
    if (this._cookingMinigame) {
      this._cookingMinigame.abort('close-cooking');
    } else {
      this._cookingCancelOnClose = true;
    }
  }

  _cancelCooking() {
    this._cookingCancelOnClose = true;
    if (this._cookingMinigame) this._cookingMinigame.abort('cancel');
    else this.closeCooking(true, { cancelOrder: true });
  }


  // ------------------------------------------------------------------------
  // Minijuego de siembra: puente con el sistema nuevo
  // ------------------------------------------------------------------------
  _getPlantingDifficulty(plot) {
    const season = this.mode?.director?.seasonIndex ?? 0;
    const day = this.mode?.director?.day ?? 1;
    const height = Number(plot?.crop?.height) || 0.8;
    return Math.max(1, Math.min(5, Math.round(1 + season * 1.1 + day / 20 + height * 0.6)));
  }

  isPlantingOpen() {
    return !!this._plantingMinigame;
  }

  openFarmMinigame(plotId) {
    if (this._plantingMinigame) return;
    const plot = this.mode?.restaurant?.farm?.plots?.get?.(plotId);
    if (!plot || plot.ready || plot.growing) return;
    this._closeOtherOverlays(null);
    this._modalOpen = true;
    document.body.classList.add('chiringuito-modal-open');
    this._plantingPlotId = plotId;
    const difficulty = this._getPlantingDifficulty(plot);
    let runner = null;
    try {
      runner = new MinigameRunner({
        title: `SIEMBRA // ${String(plot.name || 'PARCELA').toUpperCase()}`,
        kicker: 'CHIRINGUITO // GRANJA',
        difficulty,
        restorePointerLock: true,
        createGame: ({ services, difficulty: gameDifficulty }) => new PlantingGame({
          services,
          difficulty: gameDifficulty,
          ingredientId: plot.ingredientId,
          plotName: plot.name,
          crop: plot.crop,
          plotYield: plot.yield
        }),
        onComplete: result => this._completePlantingMinigame(result),
        onAbort: info => this._abortPlantingMinigame(info),
        onError: error => {
          console.error('[ChiringuitoUI] Error en el minijuego de siembra:', error);
          this.updateAll();
        }
      });
      this._plantingMinigame = runner;
      runner.start();
    } catch (error) {
      console.error('[ChiringuitoUI] No se pudo abrir la siembra:', error);
      try { runner?.destroy(); } catch (destroyError) {}
      this._plantingMinigame = null;
      this._plantingPlotId = null;
      this._modalOpen = false;
      document.body.classList.remove('chiringuito-modal-open');
      AudioSys.playUIError?.();
      this.updateAll();
    }
  }

  _completePlantingMinigame(result = {}) {
    const plotId = this._plantingPlotId;
    this._plantingMinigame = null;
    this._plantingPlotId = null;
    this._modalOpen = false;
    document.body.classList.remove('chiringuito-modal-open');
    if (!plotId) return;
    const completed = this.mode.plantPlot(plotId, { score: result.score || 0 });
    if (!completed) AudioSys.playUIError?.();
    this.updateAll();
  }

  _abortPlantingMinigame(info = {}) {
    this._plantingMinigame = null;
    this._plantingPlotId = null;
    this._modalOpen = false;
    document.body.classList.remove('chiringuito-modal-open');
    AudioSys.playUIClick?.();
    this.updateAll();
  }

  _destroyPlantingMinigame() {
    const runner = this._plantingMinigame;
    this._plantingMinigame = null;
    this._plantingPlotId = null;
    this._modalOpen = false;
    document.body.classList.remove('chiringuito-modal-open');
    if (runner) {
      runner.restorePointerLock = false;
      runner.destroy();
    }
  }

  closeFarmMinigame(cancel = false) {
    if (this._plantingMinigame) this._plantingMinigame.abort(cancel ? 'cancel' : 'close');
  }

  // ------------------------------------------------------------------------
  // Minijuego de pesca: puente con el sistema nuevo
  // ------------------------------------------------------------------------
  _getFishingDifficulty() {
    const season = this.mode?.director?.seasonIndex ?? 0;
    const day = this.mode?.director?.day ?? 1;
    return Math.max(1, Math.min(5, Math.round(1 + season * 1.15 + Math.min(1.1, day / 14))));
  }

  isFishingOpen() {
    return !!this._fishingMinigame;
  }

  openFishingMinigame() {
    if (this._fishingMinigame) return;
    this._closeOtherOverlays(null);
    this._modalOpen = true;
    document.body.classList.add('chiringuito-modal-open');
    const difficulty = this._getFishingDifficulty();
    let runner = null;
    try {
      runner = new MinigameRunner({
        title: 'PESCA // LAGUNA DEL CHIRINGUITO',
        kicker: 'CHIRINGUITO // PESCA',
        difficulty,
        restorePointerLock: true,
        createGame: ({ services, difficulty: gameDifficulty }) => new FishingGame({
          services,
          difficulty: gameDifficulty
        }),
        onComplete: result => this._completeFishingMinigame(result),
        onAbort: info => this._abortFishingMinigame(info),
        onError: error => {
          console.error('[ChiringuitoUI] Error en el minijuego de pesca:', error);
          this.updateAll();
        }
      });
      this._fishingMinigame = runner;
      runner.start();
    } catch (error) {
      console.error('[ChiringuitoUI] No se pudo abrir la pesca:', error);
      try { runner?.destroy(); } catch (destroyError) {}
      this._fishingMinigame = null;
      this._modalOpen = false;
      document.body.classList.remove('chiringuito-modal-open');
      AudioSys.playUIError?.();
      this.updateAll();
    }
  }

  _completeFishingMinigame(result = {}) {
    this._fishingMinigame = null;
    this._modalOpen = false;
    document.body.classList.remove('chiringuito-modal-open');
    if (result.escaped || !result.fishAmount) {
      this.updateAll();
      return;
    }
    const completed = this.mode.completeFishing({
      amount: result.fishAmount,
      score: result.score || 0,
      fishId: result.fishId || null,
      rare: !!result.rare
    });
    if (completed) AudioSys.playUISelect?.();
    else AudioSys.playUIError?.();
    this.updateAll();
  }

  _abortFishingMinigame(info = {}) {
    this._fishingMinigame = null;
    this._modalOpen = false;
    document.body.classList.remove('chiringuito-modal-open');
    AudioSys.playUIClick?.();
    this.updateAll();
  }

  _destroyFishingMinigame() {
    const runner = this._fishingMinigame;
    this._fishingMinigame = null;
    this._modalOpen = false;
    document.body.classList.remove('chiringuito-modal-open');
    if (runner) {
      runner.restorePointerLock = false;
      runner.destroy();
    }
  }

  closeFishingMinigame(cancel = false) {
    if (this._fishingMinigame) this._fishingMinigame.abort(cancel ? 'cancel' : 'close');
  }


  // ------------------------------------------------------------------------
  // Minijuego de cosecha: puente con el sistema nuevo
  // ------------------------------------------------------------------------
  _getHarvestDifficulty(plot) {
    const season = this.mode?.director?.seasonIndex ?? 0;
    const day = this.mode?.director?.day ?? 1;
    const height = Number(plot?.crop?.height) || 0.8;
    return Math.max(1, Math.min(5, Math.round(1 + season * 1.1 + day / 20 + height * 0.6)));
  }

  isHarvestOpen() {
    return !!this._harvestMinigame;
  }

  openHarvestMinigame(plotId) {
    if (this._harvestMinigame) return;
    const plot = this.mode?.restaurant?.farm?.plots?.get?.(plotId);
    if (!plot || !plot.ready || plot.growing) return;
    this._closeOtherOverlays(null);
    this._modalOpen = true;
    document.body.classList.add('chiringuito-modal-open');
    this._harvestPlotId = plotId;
    const difficulty = this._getHarvestDifficulty(plot);
    let runner = null;
    try {
      runner = new MinigameRunner({
        title: `COSECHA // ${String(plot.name || 'PARCELA').toUpperCase()}`,
        kicker: 'CHIRINGUITO // GRANJA',
        difficulty,
        restorePointerLock: true,
        createGame: ({ services, difficulty: gameDifficulty }) => new HarvestGame({
          services,
          difficulty: gameDifficulty,
          ingredientId: plot.ingredientId,
          plotName: plot.name,
          crop: plot.crop,
          plotYield: plot.yield
        }),
        onComplete: result => this._completeHarvestMinigame(result),
        onAbort: info => this._abortHarvestMinigame(info),
        onError: error => {
          console.error('[ChiringuitoUI] Error en el minijuego de cosecha:', error);
          this.updateAll();
        }
      });
      this._harvestMinigame = runner;
      runner.start();
    } catch (error) {
      console.error('[ChiringuitoUI] No se pudo abrir la cosecha:', error);
      try { runner?.destroy(); } catch (destroyError) {}
      this._harvestMinigame = null;
      this._harvestPlotId = null;
      this._modalOpen = false;
      document.body.classList.remove('chiringuito-modal-open');
      AudioSys.playUIError?.();
      this.updateAll();
    }
  }

  _completeHarvestMinigame(result = {}) {
    const plotId = this._harvestPlotId;
    this._harvestMinigame = null;
    this._harvestPlotId = null;
    this._modalOpen = false;
    document.body.classList.remove('chiringuito-modal-open');
    if (!plotId) return;
    const completed = this.mode.harvestPlot(plotId, { score: result.score || 0 });
    if (!completed?.ok) AudioSys.playUIError?.();
    this.updateAll();
  }

  _abortHarvestMinigame(info = {}) {
    this._harvestMinigame = null;
    this._harvestPlotId = null;
    this._modalOpen = false;
    document.body.classList.remove('chiringuito-modal-open');
    AudioSys.playUIClick?.();
    this.updateAll();
  }

  _destroyHarvestMinigame() {
    const runner = this._harvestMinigame;
    this._harvestMinigame = null;
    this._harvestPlotId = null;
    this._modalOpen = false;
    document.body.classList.remove('chiringuito-modal-open');
    if (runner) {
      runner.restorePointerLock = false;
      runner.destroy();
    }
  }

  closeHarvestMinigame(cancel = false) {
    if (this._harvestMinigame) this._harvestMinigame.abort(cancel ? 'cancel' : 'close');
  }

  // ------------------------------------------------------------------------
  // Resúmenes
  // ------------------------------------------------------------------------
  _createSummaryOverlay() {
    const { overlay, panel } = this._createOverlayShell('cg-summary-screen', 'cg-summary-overlay');
    panel.innerHTML = `
      <div class="tape-strip"><span class="tape-label" id="cg-summary-kicker">PARTE DEL DÍA</span></div>
      <h1 class="buckshot-title" id="cg-summary-title">DÍA COMPLETADO</h1>
      <div id="cg-summary-body" class="cg-summary-body"></div>
      <button type="button" class="rust-btn primary" id="cg-summary-continue">[ SIGUIENTE MAÑANA ]</button>
    `;
    this.summaryOverlay = overlay;
    this.summaryBody = panel.querySelector('#cg-summary-body');
    this.summaryTitle = panel.querySelector('#cg-summary-title');
    this.summaryKicker = panel.querySelector('#cg-summary-kicker');
    this.summaryContinue = panel.querySelector('#cg-summary-continue');
    this.summaryContinue.addEventListener('click', () => {
      AudioSys.playUISelect?.();
      const phase = this._summaryPhase;
      this._summaryPhase = null;
      this.summaryOverlay.classList.add('hidden');
      this._modalOpen = false;
      document.body.classList.remove('chiringuito-modal-open');
      this.mode.handlePhaseAction();
      this.updateAll();
      if (phase === 'DAY_SUMMARY' && this.mode.director?.phase === 'MORNING') this._requestPointerLock();
      if (phase === 'SEASON_SUMMARY' && this.mode.director?.phase === 'MORNING') this._requestPointerLock();
    });
  }

  showDaySummary(summary) {
    if (!this.summaryOverlay) return;
    const service = summary.lastService || summary.lastService;
    this._summaryPhase = 'DAY_SUMMARY';
    this.summaryKicker.textContent = `${summary.seasonLabel || 'TEMPORADA'} // PARTE DEL DÍA ${summary.day}`;
    this.summaryTitle.textContent = summary.isFinalDay ? 'ÚLTIMA NOCHE DE TEMPORADA' : 'DÍA COMPLETADO';
    this.summaryBody.innerHTML = `
      <div class="cg-summary-grid">
        <div class="cg-summary-card"><span>DESPENSA</span><b>${Math.round(summary.pantryLives)}/${Math.round(summary.pantryMax)}</b></div>
        <div class="cg-summary-card"><span>CLIENTES</span><b>${this.mode.restaurant?.stats.customersServed || 0}</b></div>
        <div class="cg-summary-card"><span>PERLAS</span><b>${Math.floor(this.mode.restaurant?.pearls || 0)}</b></div>
        <div class="cg-summary-card"><span>REPUTACIÓN</span><b>${Math.round(this.mode.restaurant?.reputation || 0)}</b></div>
      </div>
      <p class="plate-sub">${service ? `SERVICIO: ${service.served || 0} servidos · ${service.lost || 0} perdidos · ${service.revenue || 0} perlas cobradas.` : 'LA NOCHE HA TERMINADO.'}</p>
      <p class="plate-sub" style="color:#877a5c;">MAÑANA TOCA RECOGER LA GRANJA, REVISAR EL MENÚ Y PREPARAR LA DEFENSA.</p>
    `;
    this.summaryContinue.textContent = summary.isFinalDay ? '[ CERRAR LA TEMPORADA ]' : '[ SIGUIENTE MAÑANA ]';
    this._closeOtherOverlays(this.summaryOverlay);
    this._openOverlay(this.summaryOverlay);
  }

  showSeasonSummary(summary) {
    if (!this.summaryOverlay) return;
    this._summaryPhase = 'SEASON_SUMMARY';
    this.summaryKicker.textContent = `${summary.seasonLabel || 'TEMPORADA'} // TEMPORADA COMPLETADA`;
    this.summaryTitle.textContent = summary.isFinalSeason ? 'FINAL DE CAMPAÑA' : 'NUEVA TEMPORADA';
    this.summaryBody.innerHTML = `
      <div class="cg-summary-grid">
        <div class="cg-summary-card"><span>TEMPORADA</span><b>${summary.seasonLabel || ''}</b></div>
        <div class="cg-summary-card"><span>DÍAS</span><b>15</b></div>
        <div class="cg-summary-card"><span>PERLAS</span><b>${Math.floor(this.mode.restaurant?.pearls || 0)}</b></div>
        <div class="cg-summary-card"><span>CLIENTES</span><b>${this.mode.restaurant?.stats.customersServed || 0}</b></div>
      </div>
      <p class="plate-sub">${summary.isFinalSeason ? 'LA CALETA HA SOBREVIVIDO A LAS TRES TEMPORADAS.' : 'EL RECORRIDO DE CANGREJOS CAMBIARÁ. LAS TORRETAS SE RETIRAN, PERO EL CHIRINGUITO, EL DINERO Y LAS RECETAS PERMANECEN.'}</p>
      <p class="plate-sub" style="color:#f0c954;">${summary.isFinalSeason ? 'PREPÁRATE PARA EL ÚLTIMO SERVICIO.' : 'NUEVA TEMPORADA · NUEVO RECORRIDO · MISMA CALETA.'}</p>
    `;
    this.summaryContinue.textContent = summary.isFinalSeason ? '[ CERRAR LA CAMPAÑA ]' : '[ ABRIR NUEVA TEMPORADA ]';
    this._closeOtherOverlays(this.summaryOverlay);
    this._openOverlay(this.summaryOverlay);
  }

  hideDaySummary() {
    if (this._summaryPhase === 'DAY_SUMMARY') this.hideSummary();
  }

  hideSeasonSummary() {
    if (this._summaryPhase === 'SEASON_SUMMARY') this.hideSummary();
  }

  hideSummary() {
    if (!this.summaryOverlay) return;
    this._summaryPhase = null;
    this.summaryOverlay.classList.add('hidden');
    this._modalOpen = [this.buildOverlay, this.recipeOverlay, this.orderOverlay, this.cookingOverlay, this.fishingOverlay].some(el => el && !el.classList.contains('hidden'));
    if (!this._modalOpen) document.body.classList.remove('chiringuito-modal-open');
  }

  hidePhaseOverlays() {
    // La UI de fase evita que una capa vieja tape la mañana nueva.
    this.hideSummary();
  }

  // ------------------------------------------------------------------------
  // Turret menu facade
  // ------------------------------------------------------------------------
  openTurretMenu(turretId) {
    document.dispatchEvent(new CustomEvent('chiringuito:open-turret', { detail: { turretId } }));
  }

  // ------------------------------------------------------------------------
  // Input global de UI
  // ------------------------------------------------------------------------
  _bindGlobalInput() {
    window.addEventListener('keydown', e => {
      if (!this.blocksGameplayInput()) return;
      // El mismo keydown que abre B/I ya fue procesado y prevenido por el
      // input del juego; sin este corte la UI lo cerraría en el acto.
      if (e.defaultPrevented) return;
      const k = e.key.toLowerCase();
      if (e.key === 'Escape') {
        e.preventDefault();
        if (this.isCookingOpen()) this._cancelCooking();
        else if (this.buildOverlay && !this.buildOverlay.classList.contains('hidden')) this.closeBuildMenu();
        else if (this.recipeOverlay && !this.recipeOverlay.classList.contains('hidden')) this.closeRecipeBook();
        else if (this.orderOverlay && !this.orderOverlay.classList.contains('hidden')) this.closeOrderBoard();
        else if (this._summaryPhase) this.hideSummary();
        return;
      }
      if (k === 'b' && this.buildOverlay && !this.buildOverlay.classList.contains('hidden')) {
        e.preventDefault();
        this.closeBuildMenu();
        return;
      }
      if (k === 'i' && this.recipeOverlay && !this.recipeOverlay.classList.contains('hidden')) {
        e.preventDefault();
        this.closeRecipeBook();
        return;
      }
      // Bloqueo de teclas de gameplay mientras hay un panel abierto.
      if (['w', 'a', 's', 'd', 'shift', ' ', 'e', 'f', 'v', 'p', 't'].includes(k) || e.code === 'Space') {
        // Espacio pertenece al minijuego, no al salto del jugador.
        if (!this.isCookingOpen()) e.preventDefault();
      }
    });
  }

  _closeOtherOverlays(keep) {
    for (const overlay of [this.buildOverlay, this.recipeOverlay, this.orderOverlay, this.cookingOverlay, this.fishingOverlay, this.summaryOverlay]) {
      if (overlay && overlay !== keep && !overlay.classList.contains('hidden')) {
        overlay.classList.add('hidden');
      }
    }
  }
}
