// Pedidos, reservas de ingredientes, sesiones de cocina y platos listos.
// Host autoritativo: las reservas se descuentan al crear el ticket.
// Exports: OrderSystem.

import { getRecipe } from '../config/chiringuito/recipes.js';
import { getQualityTier, getTipForOrder } from '../config/chiringuito/cooking.js';

let nextOrderId = 1;
let nextPlateId = 1;

function randomFrom(list) {
  if (!Array.isArray(list) || list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}

export class OrderSystem {
  constructor(inventory, options = {}) {
    this.inventory = inventory;
    this.orders = new Map();
    this.plates = new Map();
    this.onChange = options.onChange || null;
    this.onServed = options.onServed || null;
    this.onPlateReady = options.onPlateReady || null;
  }

  _changed() {
    this.onChange?.();
  }

  getOrder(orderId) {
    return this.orders.get(orderId) || null;
  }

  getPlate(plateId) {
    return this.plates.get(plateId) || null;
  }

  getWaitingOrders() {
    return Array.from(this.orders.values()).filter(o => o.status === 'waiting');
  }

  getActiveOrders() {
    return Array.from(this.orders.values()).filter(o => o.status !== 'served' && o.status !== 'lost');
  }

  getPlatesAtPass() {
    return Array.from(this.plates.values()).filter(p => p.atPass && !p.carrierId);
  }

  getPlateForOrder(orderId) {
    return Array.from(this.plates.values()).find(p => p.orderId === orderId && p.status === 'ready') || null;
  }

  getPlateForCarrier(carrierId) {
    return Array.from(this.plates.values()).find(p => p.carrierId === carrierId && p.status === 'carried') || null;
  }

  hasRecipeStock(recipe) {
    return !!(recipe && this.inventory.canAfford(recipe.ingredients));
  }

  availableRecipes(unlockedIds = []) {
    return unlockedIds
      .map(id => getRecipe(id))
      .filter(recipe => recipe && this.hasRecipeStock(recipe));
  }

  createOrderForCustomer(customerId, unlockedIds = [], options = {}) {
    if (!customerId) return null;
    let candidates = this.availableRecipes(unlockedIds);
    // La carta del día manda, pero si se queda sin existencias el cliente
    // pide cualquier plato disponible para no marcharse sin pedir.
    const menuIds = Array.isArray(options.menuRecipeIds) ? options.menuRecipeIds : [];
    if (menuIds.length) {
      const onMenu = candidates.filter(recipe => menuIds.includes(recipe.id));
      if (onMenu.length) candidates = onMenu;
    }
    if (candidates.length === 0) return null;
    const recipe = options.recipeId
      ? candidates.find(r => r.id === options.recipeId) || randomFrom(candidates)
      : randomFrom(candidates);
    if (!recipe) return null;
    if (!this.inventory.consume(recipe.ingredients)) return null;

    const id = `order_${nextOrderId++}`;
    const order = {
      id,
      customerId,
      recipeId: recipe.id,
      recipe,
      status: 'waiting',
      claimantId: null,
      createdAt: Date.now(),
      ingredients: { ...recipe.ingredients },
      ingredientsConsumed: false,
      plateId: null,
      quality: null
    };
    this.orders.set(id, order);
    this._changed();
    return order;
  }

  claim(orderId, actorId) {
    const order = this.orders.get(orderId);
    if (!order) return { ok: false, reason: 'NO_EXISTE' };
    if (order.status !== 'waiting') return { ok: false, reason: 'PEDIDO_NO_DISPONIBLE' };
    if (order.claimantId && order.claimantId !== actorId) return { ok: false, reason: 'OCUPADO' };
    order.claimantId = actorId || 'local';
    order.status = 'cooking';
    this._changed();
    return { ok: true, order };
  }

  cancelCooking(orderId, actorId = null, options = {}) {
    const order = this.orders.get(orderId);
    if (!order) return { ok: false, reason: 'NO_EXISTE' };
    if (order.status !== 'cooking') return { ok: false, reason: 'NO_EN_COCCION' };
    if (actorId && order.claimantId && order.claimantId !== actorId) return { ok: false, reason: 'NO_ES_TU_PEDIDO' };
    order.claimantId = null;
    order.status = options.lost ? 'lost' : 'waiting';
    this._changed();
    return { ok: true, order };
  }

  completeCooking(orderId, actorId, result = {}) {
    const order = this.orders.get(orderId);
    if (!order) return { ok: false, reason: 'NO_EXISTE' };
    if (order.status !== 'cooking') return { ok: false, reason: 'NO_EN_COCCION' };
    if (actorId && order.claimantId && order.claimantId !== actorId) return { ok: false, reason: 'NO_ES_TU_PEDIDO' };
    const score = Math.max(0, Math.min(100, Math.round(Number(result.score) || 0)));
    const quality = getQualityTier(score);
    const plateId = `plate_${nextPlateId++}`;
    const plate = {
      id: plateId,
      orderId,
      recipeId: order.recipeId,
      score,
      quality,
      carrierId: null,
      atPass: true,
      status: 'ready',
      createdAt: Date.now()
    };
    order.status = 'ready';
    order.claimantId = null;
    order.plateId = plateId;
    order.quality = quality.id;
    order.ingredientsConsumed = true;
    this.plates.set(plateId, plate);
    this.onPlateReady?.(plate, order);
    this._changed();
    return { ok: true, plate, order, quality };
  }

  pickPlate(plateId, carrierId) {
    const plate = this.plates.get(plateId);
    if (!plate || plate.status !== 'ready' || plate.carrierId) return { ok: false, reason: 'PLATO_NO_DISPONIBLE' };
    plate.carrierId = carrierId || 'local';
    plate.atPass = false;
    plate.status = 'carried';
    this._changed();
    return { ok: true, plate };
  }

  dropPlate(plateId, carrierId = null) {
    const plate = this.plates.get(plateId);
    if (!plate || plate.status !== 'carried') return { ok: false, reason: 'PLATO_NO_TRANSPORTADO' };
    if (carrierId && plate.carrierId !== carrierId) return { ok: false, reason: 'NO_ES_TU_PLATO' };
    plate.carrierId = null;
    plate.atPass = true;
    plate.status = 'ready';
    this._changed();
    return { ok: true, plate };
  }

  servePlate(plateId, customerId, actorId = null, modifiers = {}) {
    const plate = this.plates.get(plateId);
    if (!plate) return { ok: false, reason: 'PLATO_NO_EXISTE' };
    if (plate.status !== 'carried' && plate.status !== 'ready') return { ok: false, reason: 'PLATO_NO_DISPONIBLE' };
    if (actorId && plate.carrierId && plate.carrierId !== actorId) return { ok: false, reason: 'NO_ES_TU_PLATO' };
    if (plate.orderId && customerId) {
      const order = this.orders.get(plate.orderId);
      if (order && order.customerId !== customerId) return { ok: false, reason: 'CLIENTE_INCORRECTO' };
    }
    const order = this.orders.get(plate.orderId);
    if (!order) return { ok: false, reason: 'PEDIDO_NO_EXISTE' };
    if (order.status !== 'ready') return { ok: false, reason: 'PEDIDO_NO_LISTO' };

    const recipe = order.recipe;
    const patienceRatio = Math.max(0, Math.min(1, Number(modifiers.patienceRatio ?? 1)));
    const tip = getTipForOrder({
      recipe,
      qualityTier: plate.quality,
      patienceRatio,
      charm: modifiers.charm || 0,
      tipBonus: modifiers.tipBonus || 0,
      reputation: modifiers.reputation || 55
    });
    const total = recipe.price + tip;

    order.status = 'served';
    order.claimantId = null;
    plate.status = 'served';
    plate.carrierId = null;
    plate.atPass = false;
    this._changed();
    const result = {
      ok: true,
      order,
      plate,
      customerId: customerId || order.customerId,
      recipe,
      quality: plate.quality,
      price: recipe.price,
      tip,
      total
    };
    this.onServed?.(result);
    return result;
  }

  loseOrder(orderId, reason = 'CUSTOMER_LEFT') {
    const order = this.orders.get(orderId);
    if (!order) return null;
    if (order.status === 'served' || order.status === 'lost') return null;
    const plate = order.plateId ? this.plates.get(order.plateId) : null;
    if (plate && plate.status !== 'served') {
      this.plates.delete(plate.id);
    }
    if (!order.ingredientsConsumed) {
      this.inventory.returnMany(order.ingredients);
    }
    order.status = 'lost';
    order.claimantId = null;
    order.lostReason = reason;
    this._changed();
    return order;
  }

  removeOrder(orderId) {
    const order = this.orders.get(orderId);
    if (!order) return;
    if (order.plateId) this.plates.delete(order.plateId);
    this.orders.delete(orderId);
    this._changed();
  }

  clear() {
    this.orders.clear();
    this.plates.clear();
    this._changed();
  }

  serialize() {
    return {
      orders: Array.from(this.orders.values()).map(order => ({
        id: order.id,
        customerId: order.customerId,
        recipeId: order.recipeId,
        status: order.status,
        claimantId: order.claimantId,
        createdAt: order.createdAt,
        ingredients: { ...order.ingredients },
        ingredientsConsumed: order.ingredientsConsumed,
        plateId: order.plateId,
        quality: order.quality,
        lostReason: order.lostReason || null
      })),
      plates: Array.from(this.plates.values()).map(plate => ({
        id: plate.id,
        orderId: plate.orderId,
        recipeId: plate.recipeId,
        score: plate.score,
        qualityId: plate.quality?.id || 'burnt',
        qualityLabel: plate.quality?.label || 'QUEMADO',
        carrierId: plate.carrierId,
        atPass: plate.atPass,
        status: plate.status,
        createdAt: plate.createdAt
      }))
    };
  }

  applyNetworkState(data = {}) {
    if (!data) return;
    const incomingOrders = new Set();
    for (const raw of data.orders || []) {
      const recipe = getRecipe(raw.recipeId);
      if (!recipe) continue;
      incomingOrders.add(raw.id);
      let order = this.orders.get(raw.id);
      if (!order) {
        order = { id: raw.id, recipe, recipeId: raw.recipeId };
        this.orders.set(raw.id, order);
      }
      order.customerId = raw.customerId;
      order.recipeId = raw.recipeId;
      order.recipe = recipe;
      order.status = raw.status || order.status;
      order.claimantId = raw.claimantId || null;
      order.createdAt = raw.createdAt || order.createdAt || Date.now();
      order.ingredients = { ...(raw.ingredients || recipe.ingredients) };
      order.ingredientsConsumed = !!raw.ingredientsConsumed;
      order.plateId = raw.plateId || null;
      order.quality = raw.quality || null;
      order.lostReason = raw.lostReason || null;
    }
    for (const id of Array.from(this.orders.keys())) {
      if (!incomingOrders.has(id)) this.orders.delete(id);
    }
    const incomingPlates = new Set();
    for (const raw of data.plates || []) {
      const recipe = getRecipe(raw.recipeId);
      if (!recipe) continue;
      incomingPlates.add(raw.id);
      let plate = this.plates.get(raw.id);
      if (!plate) {
        plate = { id: raw.id, orderId: raw.orderId, recipeId: raw.recipeId };
        this.plates.set(raw.id, plate);
      }
      plate.orderId = raw.orderId;
      plate.recipeId = raw.recipeId;
      plate.score = raw.score || 0;
      plate.quality = getQualityTier(plate.score);
      plate.carrierId = raw.carrierId || null;
      plate.atPass = !!raw.atPass;
      plate.status = raw.status || plate.status || 'ready';
      plate.createdAt = raw.createdAt || plate.createdAt || Date.now();
    }
    for (const id of Array.from(this.plates.keys())) {
      if (!incomingPlates.has(id)) this.plates.delete(id);
    }
    for (const raw of data.orders || []) {
      const numeric = parseInt(String(raw.id).replace(/\D/g, ''), 10);
      if (Number.isFinite(numeric)) nextOrderId = Math.max(nextOrderId, numeric + 1);
    }
    for (const raw of data.plates || []) {
      const numeric = parseInt(String(raw.id).replace(/\D/g, ''), 10);
      if (Number.isFinite(numeric)) nextPlateId = Math.max(nextPlateId, numeric + 1);
    }
    this._changed();
  }

  restore(data = {}) {
    this.orders.clear();
    this.plates.clear();
    for (const raw of data.orders || []) {
      const recipe = getRecipe(raw.recipeId);
      if (!recipe) continue;
      this.orders.set(raw.id, {
        ...raw,
        recipe,
        ingredients: { ...(raw.ingredients || recipe.ingredients) }
      });
      const numeric = parseInt(String(raw.id).replace(/\D/g, ''), 10);
      if (Number.isFinite(numeric)) nextOrderId = Math.max(nextOrderId, numeric + 1);
    }
    for (const raw of data.plates || []) {
      const plate = {
        ...raw,
        quality: getQualityTier(raw.score)
      };
      this.plates.set(plate.id, plate);
      const numeric = parseInt(String(plate.id).replace(/\D/g, ''), 10);
      if (Number.isFinite(numeric)) nextPlateId = Math.max(nextPlateId, numeric + 1);
    }
    this._changed();
  }
}
