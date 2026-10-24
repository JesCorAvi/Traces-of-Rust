// Núcleo del chiringuito: inventario, perlas, recetas, upgrades, granja,
// mobiliario, clientes, pedidos y platos.
// Exports: RestaurantSystem.

import { CHIRINGUITO_CONFIG } from '../config/chiringuitoConfig.js';
import { RestaurantInventory } from './inventory.js';
import { FarmSystem } from './farmSystem.js';
import { FurnitureSystem } from './furnitureSystem.js';
import { OrderSystem } from './orderSystem.js';
import { CustomerSystem } from './customerSystem.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export class RestaurantSystem {
  constructor(scene, worldPhysics, options = {}) {
    this.scene = scene;
    this.worldPhysics = worldPhysics;
    this.authority = options.authority !== false;
    this.onChange = options.onChange || null;
    this.onServiceComplete = options.onServiceComplete || null;
    this.onDayStats = options.onDayStats || null;

    this.inventory = new RestaurantInventory();
    this.furniture = new FurnitureSystem(scene, worldPhysics, {
      authority: this.authority,
      onChange: () => this._changed()
    });
    this.farm = new FarmSystem(scene, worldPhysics, {
      authority: this.authority,
      onHarvest: (ingredientId, amount) => {
        this.inventory.add(ingredientId, amount);
        this._changed();
      }
    });
    this.orders = new OrderSystem(this.inventory, {
      onChange: () => this._changed()
    });
    this.customers = new CustomerSystem(scene, worldPhysics, this.furniture, this.orders, {
      authority: this.authority,
      onChange: () => this._changed(),
      onCustomerServed: (customer, result) => this._handleCustomerServed(customer, result),
      onCustomerLost: (customer, reason) => this._handleCustomerLost(customer, reason),
      onServiceComplete: stats => this._handleServiceComplete(stats)
    });

    this.pearls = 0;
    this.reputation = CHIRINGUITO_CONFIG.CUSTOMERS.reputationStart;
    this.unlockedRecipeIds = [...CHIRINGUITO_CONFIG.STARTING_RECIPE_IDS];
    this.menuRecipeIds = [...this.unlockedRecipeIds];
    this.upgrades = new Set();
    this.stats = {
      customersServed: 0,
      customersLost: 0,
      totalRevenue: 0,
      totalTips: 0,
      bestDish: null,
      nightsCompleted: 0
    };
    this.lastServiceStats = null;
    this.currentDay = 1;
    this.currentSeasonIndex = 0;
  }

  _changed() {
    this.onChange?.();
  }

  getInventory() { return this.inventory; }
  getOrders() { return this.orders; }
  getCustomers() { return this.customers; }
  getFurniture() { return this.furniture; }
  getFarm() { return this.farm; }
  getPearls() { return this.pearls; }
  getReputation() { return this.reputation; }
  getUnlockedRecipeIds() { return [...this.unlockedRecipeIds]; }
  getMenuRecipeIds() { return [...this.menuRecipeIds]; }
  isOnDailyMenu(recipeId) { return this.menuRecipeIds.includes(recipeId); }
  getMenuRecipes() { return this.menuRecipeIds.map(id => CHIRINGUITO_CONFIG.getRecipe(id)).filter(Boolean); }

  toggleMenuRecipe(recipeId) {
    if (!this.authority) return { ok: false, reason: 'SOLO_HOST' };
    if (!this.isRecipeUnlocked(recipeId)) return { ok: false, reason: 'RECETA_BLOQUEADA' };
    const idx = this.menuRecipeIds.indexOf(recipeId);
    if (idx >= 0) this.menuRecipeIds.splice(idx, 1);
    else this.menuRecipeIds.push(recipeId);
    this._changed();
    return { ok: true, recipeId, onMenu: idx < 0 };
  }

  setMenuRecipeIds(ids = []) {
    this.menuRecipeIds = (Array.isArray(ids) ? ids : [])
      .filter(id => this.unlockedRecipeIds.includes(id));
    this._changed();
  }
  hasUpgrade(id) { return this.upgrades.has(id); }
  getLastServiceStats() { return this.lastServiceStats; }

  addPearls(amount) {
    const value = Math.max(0, Math.round(Number(amount) || 0));
    if (value <= 0) return 0;
    this.pearls += value;
    this._changed();
    return value;
  }

  spendPearls(amount) {
    const value = Math.max(0, Math.round(Number(amount) || 0));
    if (this.pearls < value) return false;
    this.pearls -= value;
    this._changed();
    return true;
  }

  addReputation(amount) {
    this.reputation = Math.max(
      CHIRINGUITO_CONFIG.CUSTOMERS.reputationMin,
      Math.min(CHIRINGUITO_CONFIG.CUSTOMERS.reputationMax, this.reputation + (Number(amount) || 0))
    );
    this._changed();
  }

  isRecipeUnlocked(recipeId) {
    return this.unlockedRecipeIds.includes(recipeId);
  }

  unlockRecipe(recipeId) {
    if (!this.authority) return { ok: false, reason: 'SOLO_HOST' };
    const recipe = CHIRINGUITO_CONFIG.getRecipe(recipeId);
    if (!recipe) return { ok: false, reason: 'RECETA_NO_EXISTE' };
    if (this.unlockedRecipeIds.includes(recipeId)) return { ok: false, reason: 'YA_DESBLOQUEADA' };
    const cost = Math.max(0, recipe.unlockCost || 0);
    if (!this.spendPearls(cost)) return { ok: false, reason: 'PERLAS_INSUFICIENTES' };
    this.unlockedRecipeIds.push(recipeId);
    if (!this.menuRecipeIds.includes(recipeId)) this.menuRecipeIds.push(recipeId);
    this._changed();
    return { ok: true, recipe, cost };
  }

  getUpgradeCatalog() {
    return Object.values(CHIRINGUITO_CONFIG.RESTAURANT_UPGRADES);
  }

  canBuyUpgrade(upgradeId) {
    const upgrade = CHIRINGUITO_CONFIG.getRestaurantUpgrade(upgradeId);
    if (!upgrade) return { ok: false, reason: 'MEJORA_NO_EXISTE' };
    if (this.upgrades.has(upgradeId)) return { ok: false, reason: 'YA_COMPRADA' };
    if (upgrade.requires && !this.upgrades.has(upgrade.requires)) {
      return { ok: false, reason: 'REQUIERE_MEJORA_PREVIA' };
    }
    if (this.pearls < (upgrade.cost || 0)) return { ok: false, reason: 'PERLAS_INSUFICIENTES' };
    return { ok: true, upgrade };
  }

  buyUpgrade(upgradeId) {
    if (!this.authority) return { ok: false, reason: 'SOLO_HOST' };
    const check = this.canBuyUpgrade(upgradeId);
    if (!check.ok) return check;
    this.spendPearls(check.upgrade.cost || 0);
    this.upgrades.add(upgradeId);
    this._changed();
    return { ok: true, upgrade: check.upgrade };
  }

  getCapacity() {
    return this.furniture.getCapacity();
  }

  getCharm() {
    const upgradeCharm = this.hasUpgrade('fame') ? 2 : 0;
    return this.furniture.getCharm() + upgradeCharm + Math.max(0, (this.reputation - 50) * 0.02);
  }

  getPatienceBonus() {
    return this.furniture.getPatienceBonus() + (this.hasUpgrade('terrace') ? 0.10 : 0);
  }

  getTipBonus() {
    let bonus = this.furniture.getTipBonus();
    for (const id of this.upgrades) {
      const upgrade = CHIRINGUITO_CONFIG.getRestaurantUpgrade(id);
      bonus += upgrade?.tipBonus || 0;
    }
    return bonus;
  }

  getCustomerBonus() {
    let bonus = 0;
    for (const id of this.upgrades) {
      const upgrade = CHIRINGUITO_CONFIG.getRestaurantUpgrade(id);
      bonus += upgrade?.customerBonus || 0;
    }
    return bonus;
  }

  getKitchenSpeedBonus() {
    let bonus = 0;
    for (const id of this.upgrades) {
      const upgrade = CHIRINGUITO_CONFIG.getRestaurantUpgrade(id);
      bonus += upgrade?.kitchenSpeed || 0;
    }
    return bonus;
  }

  getVisualLevel() {
    let level = 0;
    for (const id of this.upgrades) {
      const upgrade = CHIRINGUITO_CONFIG.getRestaurantUpgrade(id);
      level = Math.max(level, upgrade?.visualLevel || 0);
    }
    return level;
  }

  getTargetCustomers(day = this.currentDay) {
    const cfg = CHIRINGUITO_CONFIG.CUSTOMERS;
    const capacity = this.getCapacity();
    const charm = this.getCharm();
    const reputationBonus = ((this.reputation - 50) / 50) * cfg.reputationBonusMax;
    const base = cfg.basePerNight + day * 0.22 + capacity * cfg.perSeat + charm * cfg.perCharm + reputationBonus;
    const upgraded = base * (1 + this.getCustomerBonus());
    return Math.max(1, Math.min(cfg.maxPerNight, Math.round(upgraded)));
  }

  startNight(day = this.currentDay, seasonIndex = this.currentSeasonIndex) {
    if (!this.authority) return false;
    this.currentDay = day;
    this.currentSeasonIndex = seasonIndex;
    this.customers.clear();
    this.orders.clear();
    this.customers.setRecipes(this.unlockedRecipeIds);
    this.customers.configureService({
      targetCustomers: this.getTargetCustomers(day),
      unlockedRecipeIds: this.unlockedRecipeIds,
      menuRecipeIds: this.menuRecipeIds,
      kitchenBonus: this.getKitchenSpeedBonus()
    });
    this.customers.startService();
    return true;
  }

  closeNight() {
    this.customers.setArrivalsAllowed(false);
  }

  getServeModifiers() {
    return {
      charm: this.getCharm(),
      tipBonus: this.getTipBonus(),
      reputation: this.reputation
    };
  }

  serveCustomer(customerId, plateId, actorId = null) {
    if (!this.authority) return { ok: false, reason: 'SOLO_HOST' };
    return this.customers.serveCustomer(customerId, plateId, actorId, this.getServeModifiers());
  }

  _handleCustomerServed(customer, result) {
    this.pearls += result.total || 0;
    this.stats.customersServed++;
    this.stats.totalRevenue += result.price || 0;
    this.stats.totalTips += result.tip || 0;
    this.addReputation(CHIRINGUITO_CONFIG.CUSTOMERS.reputationServed);
    if (!this.stats.bestDish || (result.price || 0) > (this.stats.bestDish.price || 0)) {
      this.stats.bestDish = {
        id: result.recipe.id,
        name: result.recipe.name,
        price: result.price,
        quality: result.quality?.label || ''
      };
    }
    this.onDayStats?.(this.getDayStats());
    this._changed();
  }

  _handleCustomerLost(customer, reason) {
    this.stats.customersLost++;
    this.addReputation(-CHIRINGUITO_CONFIG.CUSTOMERS.reputationLost);
    this._changed();
  }

  _handleServiceComplete(stats) {
    this.lastServiceStats = { ...stats };
    this.stats.nightsCompleted++;
    this.onDayStats?.(this.getDayStats());
    this.onServiceComplete?.(stats);
    this._changed();
  }

  getDayStats() {
    return {
      day: this.currentDay,
      seasonIndex: this.currentSeasonIndex,
      capacity: this.getCapacity(),
      charm: this.getCharm(),
      reputation: this.reputation,
      pearls: this.pearls,
      ...this.stats
    };
  }

  getServiceTelemetry() {
    return {
      active: this.customers.serviceActive,
      complete: this.customers.serviceComplete,
      target: this.customers.targetCustomers,
      spawned: this.customers.spawnedCount,
      served: this.customers.servedCount,
      lost: this.customers.lostCount,
      activeCustomers: this.customers.customers.size,
      capacity: this.getCapacity(),
      occupiedSeats: this.furniture.getSeats().filter(s => s.occupiedBy).length,
      pearls: this.pearls,
      reputation: this.reputation
    };
  }

  newMorning() {
    this.customers.clear();
    this.orders.clear();
    this.farm.newMorning();
    this._changed();
  }

  resetForSeason(seasonIndex = 0) {
    this.customers.clear();
    this.orders.clear();
    this.inventory.clear();
    this.farm.newMorning({ initial: true });
    this.furniture.clearSeats();
    this.menuRecipeIds = this.menuRecipeIds.filter(id => this.unlockedRecipeIds.includes(id));
    this.currentSeasonIndex = seasonIndex;
    this.currentDay = 1;
    this.lastServiceStats = null;
    this._changed();
  }

  resetForCampaign() {
    this.customers.clear();
    this.orders.clear();
    this.inventory.clear();
    this.farm.newMorning({ initial: true });
    this.furniture.restore([]);
    this.unlockedRecipeIds = [...CHIRINGUITO_CONFIG.STARTING_RECIPE_IDS];
    this.menuRecipeIds = [...this.unlockedRecipeIds];
    this.upgrades.clear();
    this.pearls = 0;
    this.reputation = CHIRINGUITO_CONFIG.CUSTOMERS.reputationStart;
    this.stats = {
      customersServed: 0,
      customersLost: 0,
      totalRevenue: 0,
      totalTips: 0,
      bestDish: null,
      nightsCompleted: 0
    };
    this.lastServiceStats = null;
    this.currentDay = 1;
    this.currentSeasonIndex = 0;
    this._changed();
  }

  update(dt, playerPos = null, context = {}) {
    this.farm.update(dt, playerPos);
    this.furniture.update(dt);
    this.customers.update(dt, {
      simulate: context.simulate !== false && this.authority
    });
  }

  applyNetworkState(data = {}) {
    if (!data) return;
    this.pearls = Math.max(0, Number(data.pearls) || 0);
    this.reputation = Math.max(0, Math.min(100, Number(data.reputation ?? this.reputation)));
    this.unlockedRecipeIds = Array.isArray(data.unlockedRecipeIds)
      ? [...data.unlockedRecipeIds]
      : this.unlockedRecipeIds;
    if (Array.isArray(data.menuRecipeIds)) {
      this.menuRecipeIds = data.menuRecipeIds.filter(id => this.unlockedRecipeIds.includes(id));
    } else {
      this.menuRecipeIds = this.menuRecipeIds.filter(id => this.unlockedRecipeIds.includes(id));
    }
    this.upgrades = new Set(Array.isArray(data.upgrades) ? data.upgrades : []);
    this.stats = { ...this.stats, ...(data.stats || {}) };
    this.lastServiceStats = data.lastServiceStats || null;
    this.currentDay = Math.max(1, Number(data.currentDay) || this.currentDay);
    this.currentSeasonIndex = Math.max(0, Number(data.currentSeasonIndex) || 0);
    this.inventory.setStock(data.inventory?.stock || data.inventory || {});
    const currentFurnitureSig = JSON.stringify(this.furniture.serialize());
    const nextFurnitureSig = JSON.stringify(data.furniture || []);
    if (currentFurnitureSig !== nextFurnitureSig) {
      this.furniture.restore(data.furniture || []);
    }
    this.farm.restore(data.farm || {});
    this.orders.applyNetworkState(data.orders || {});
    this.customers.applyNetworkState(data.customers || {});
    this._changed();
  }

  serialize() {
    return {
      pearls: this.pearls,
      reputation: this.reputation,
      unlockedRecipeIds: [...this.unlockedRecipeIds],
      menuRecipeIds: [...this.menuRecipeIds],
      upgrades: [...this.upgrades],
      stats: clone(this.stats),
      lastServiceStats: this.lastServiceStats ? clone(this.lastServiceStats) : null,
      currentDay: this.currentDay,
      currentSeasonIndex: this.currentSeasonIndex,
      inventory: this.inventory.serialize(),
      furniture: this.furniture.serialize(),
      farm: this.farm.serialize(),
      orders: this.orders.serialize(),
      customers: this.customers.serialize()
    };
  }

  restore(data = {}) {
    this.pearls = Math.max(0, Number(data.pearls) || 0);
    this.reputation = Math.max(0, Math.min(100, Number(data.reputation ?? CHIRINGUITO_CONFIG.CUSTOMERS.reputationStart)));
    this.unlockedRecipeIds = Array.isArray(data.unlockedRecipeIds) && data.unlockedRecipeIds.length
      ? [...data.unlockedRecipeIds]
      : [...CHIRINGUITO_CONFIG.STARTING_RECIPE_IDS];
    // Los saves anteriores a una ampliación del recetario reciben las recetas
    // iniciales nuevas sin perder las que ya habían desbloqueado.
    const newlyAddedRecipes = [];
    for (const id of CHIRINGUITO_CONFIG.STARTING_RECIPE_IDS) {
      if (!this.unlockedRecipeIds.includes(id)) {
        this.unlockedRecipeIds.push(id);
        newlyAddedRecipes.push(id);
      }
    }
    this.menuRecipeIds = Array.isArray(data.menuRecipeIds)
      ? data.menuRecipeIds.filter(id => this.unlockedRecipeIds.includes(id))
      : [...this.unlockedRecipeIds];
    // Las recetas nuevas de una migración entran en la carta sin recuperar
    // las que el jugador había quitado a propósito.
    for (const id of newlyAddedRecipes) {
      if (!this.menuRecipeIds.includes(id)) this.menuRecipeIds.push(id);
    }
    this.upgrades = new Set(Array.isArray(data.upgrades) ? data.upgrades : []);
    this.stats = { ...this.stats, ...(data.stats || {}) };
    this.lastServiceStats = data.lastServiceStats || null;
    this.currentDay = Math.max(1, Number(data.currentDay) || 1);
    this.currentSeasonIndex = Math.max(0, Number(data.currentSeasonIndex) || 0);
    this.inventory.restore(data.inventory || {});
    this.furniture.restore(data.furniture || []);
    this.farm.restore(data.farm || {});
    this.orders.restore(data.orders || {});
    this.customers.restore(data.customers || {});
    this._changed();
  }

  destroy() {
    this.customers.destroy();
    this.furniture.destroy();
    this.farm.destroy();
    this.orders.clear();
    this.onChange = null;
  }
}
