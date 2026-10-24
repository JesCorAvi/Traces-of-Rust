// Clientes del chiringuito: llegada, asientos, pedidos, paciencia y salida.
// Exports: CustomerSystem.

import * as THREE from 'three';
import { CUSTOMERS, getCustomerArchetype } from '../config/chiringuito/customers.js';
import { ISLAND } from '../config/chiringuito/island.js';
import { createCustomerModel } from '../entities/customerModel.js';
import { disposeObject3D } from '../utils/dispose.js';
import { AudioSys } from '../audio.js';

let nextCustomerId = 1;

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function groundAt(worldPhysics, x, z) {
  // Ignora el límite de escalón y las cajas-obstáculo: los clientes deben
  // caminar sobre el deck y el paseo, no por debajo de ellos.
  return worldPhysics?.getGroundHeight(x, z, 0, true, true) ?? 0;
}

export class CustomerSystem {
  constructor(scene, worldPhysics, furnitureSystem, orderSystem, options = {}) {
    this.scene = scene;
    this.worldPhysics = worldPhysics;
    this.furniture = furnitureSystem;
    this.orders = orderSystem;
    this.onCustomerServed = options.onCustomerServed || null;
    this.onCustomerLost = options.onCustomerLost || null;
    this.onServiceComplete = options.onServiceComplete || null;
    this.onChange = options.onChange || null;
    this.authority = options.authority !== false;

    this.customers = new Map();
    this.targetCustomers = 0;
    this.spawnedCount = 0;
    this.servedCount = 0;
    this.lostCount = 0;
    this.totalRevenue = 0;
    this.totalTips = 0;
    this.arrivalsAllowed = false;
    this.serviceActive = false;
    this.serviceComplete = false;
    this.arrivalTimer = 0;
    this.elapsed = 0;
    this.unlockedRecipeIds = [];
    this.menuRecipeIds = [];
    this.spawnInterval = CUSTOMERS.arrivalIntervalStart;
    this.lastTicketAttempt = 0;
    this.customerVariant = 0;
    this.kitchenBonus = 0;
  }

  configureService({ targetCustomers = 0, unlockedRecipeIds = [], menuRecipeIds = [], kitchenBonus = 0 } = {}) {
    this.targetCustomers = Math.max(0, Math.min(CUSTOMERS.maxPerNight, Math.round(targetCustomers)));
    this.unlockedRecipeIds = [...unlockedRecipeIds];
    this.menuRecipeIds = Array.isArray(menuRecipeIds) ? [...menuRecipeIds] : [];
    this.kitchenBonus = Math.max(0, Number(kitchenBonus) || 0);
    this.spawnedCount = 0;
    this.servedCount = 0;
    this.lostCount = 0;
    this.totalRevenue = 0;
    this.totalTips = 0;
    this.arrivalTimer = 0;
    this.elapsed = 0;
    this.arrivalsAllowed = true;
    this.serviceActive = true;
    this.serviceComplete = false;
    this.spawnInterval = CUSTOMERS.arrivalIntervalStart;
    this._changed();
  }

  startService() {
    this.serviceActive = true;
    this.serviceComplete = false;
    this.arrivalsAllowed = true;
    this.arrivalTimer = 0.8;
    this._changed();
  }

  setArrivalsAllowed(allowed) {
    this.arrivalsAllowed = !!allowed;
    if (!allowed) this.targetCustomers = this.spawnedCount;
  }

  forceClose() {
    this.arrivalsAllowed = false;
    this.targetCustomers = this.spawnedCount;
    for (const customer of this.customers.values()) {
      if (customer.state === 'LEAVING') continue;
      if (customer.state === 'EATING') {
        customer.eatTimer = Math.min(customer.eatTimer, 1.2);
        continue;
      }
      this._startLeaving(customer, 'CLOSING_TIME');
    }
    this._changed();
  }

  forceComplete() {
    this.arrivalsAllowed = false;
    this.serviceActive = false;
    this.serviceComplete = true;
    for (const customer of Array.from(this.customers.values())) {
      if (customer.orderId) this.orders.loseOrder(customer.orderId, 'CLOSING_TIME');
      if (customer.seatId) this.furniture.releaseSeat(customer.id);
      this._removeCustomer(customer);
    }
    this.onServiceComplete?.(this.getStats());
    this._changed();
  }

  setRecipes(unlockedRecipeIds = []) {
    this.unlockedRecipeIds = [...unlockedRecipeIds];
  }

  _changed() {
    this.onChange?.();
  }

  getCustomer(id) {
    return this.customers.get(id) || null;
  }

  getActiveCustomers() {
    return Array.from(this.customers.values());
  }

  getStats() {
    return {
      target: this.targetCustomers,
      spawned: this.spawnedCount,
      served: this.servedCount,
      lost: this.lostCount,
      revenue: this.totalRevenue,
      tips: this.totalTips,
      active: this.customers.size
    };
  }

  isDone() {
    return !!this.serviceComplete;
  }

  getNearestCustomer(playerPos, radius = CUSTOMERS.serveRadius) {
    if (!playerPos) return null;
    let best = null;
    let bestDist = radius;
    for (const customer of this.customers.values()) {
      const d = Math.hypot(playerPos.x - customer.x, playerPos.z - customer.z);
      if (d < bestDist) {
        best = customer;
        bestDist = d;
      }
    }
    return best;
  }

  getQueueSlot() {
    for (let i = 0; i < ISLAND.customer.queue.length; i++) {
      const used = Array.from(this.customers.values()).some(c =>
        c.queueSlot === i
        && !c.seatId
        && c.state !== 'LEAVING'
        && c.state !== 'EATING'
      );
      if (!used) return i;
    }
    return -1;
  }

  spawnCustomer() {
    if (this.customers.size >= CUSTOMERS.maxConcurrent) return false;
    const queueSlot = this.getQueueSlot();
    if (queueSlot < 0) {
      this.lostCount++;
      this.onCustomerLost?.(null, 'NO_QUEUE');
      return false;
    }
    const archetype = getCustomerArchetype(this.customerVariant);
    const variant = this.customerVariant++;
    const id = `customer_${nextCustomerId++}`;
    const spawn = ISLAND.customer.spawn;
    const y = groundAt(this.worldPhysics, spawn.x, spawn.z);
    const group = createCustomerModel(archetype, variant);
    group.position.set(spawn.x, y, spawn.z);
    this.scene.add(group);

    const patienceMult = archetype.patienceMult || 1;
    const customer = {
      id,
      archetype,
      variant,
      group,
      x: spawn.x,
      z: spawn.z,
      targetX: spawn.x,
      targetZ: spawn.z,
      yaw: 0,
      state: 'ARRIVING',
      stateTimer: 0,
      queueSlot,
      seatId: null,
      orderId: null,
      orderPatience: 0,
      maxOrderPatience: CUSTOMERS.orderPatienceSec * patienceMult * (1 + (this.furniture.getPatienceBonus() || 0)),
      queuePatience: CUSTOMERS.queuePatienceSec * patienceMult,
      eatTimer: 0,
      ticketCooldown: 0,
      isWalkable: true
    };
    this.customers.set(id, customer);
    this.spawnedCount++;
    this._setState(customer, 'ARRIVING_TO_QUEUE');
    AudioSys.playCustomerArrive?.();
    this._changed();
    return customer;
  }

  _setState(customer, state) {
    customer.state = state;
    customer.stateTimer = 0;
  }

  _queuePosition(customer) {
    const slot = ISLAND.customer.queue[customer.queueSlot] || ISLAND.customer.queue[0];
    return slot || ISLAND.customer.spawn;
  }

  _seatPosition(customer) {
    const seat = customer.seatId ? this.furniture.getSeats().find(s => s.id === customer.seatId) : null;
    return seat || null;
  }

  _setTarget(customer, x, z) {
    customer.targetX = x;
    customer.targetZ = z;
  }

  _moveTowards(customer, x, z, dt, speedMult = 1) {
    const dx = x - customer.x;
    const dz = z - customer.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.14) {
      customer.x = x;
      customer.z = z;
      return true;
    }
    const speed = CUSTOMERS.walkSpeed * (customer.archetype.speedMult || 1) * speedMult;
    const step = Math.min(dist, speed * dt);
    customer.x += (dx / dist) * step;
    customer.z += (dz / dist) * step;
    customer.yaw = Math.atan2(dx, dz);
    return false;
  }

  _updateVisual(customer, dt) {
    const group = customer.group;
    if (!group) return;
    const y = groundAt(this.worldPhysics, customer.x, customer.z);
    group.position.x = customer.x;
    group.position.y = y;
    group.position.z = customer.z;
    group.rotation.y = customer.yaw;
    const parts = group.userData.parts;
    if (!parts) return;

    const moving = customer.state === 'ARRIVING_TO_QUEUE'
      || customer.state === 'WALKING_TO_SEAT'
      || customer.state === 'LEAVING';
    const seat = customer.seatId ? this._seatPosition(customer) : null;
    const sitHipY = seat?.sitY ?? 0.56;
    group.userData.walkPhase = (group.userData.walkPhase || 0) + dt * (moving ? 7.2 : 1.4);
    const phase = group.userData.walkPhase;
    if (moving) {
      parts.leftLeg.rotation.x = Math.sin(phase) * 0.48;
      parts.rightLeg.rotation.x = -Math.sin(phase) * 0.48;
      parts.leftArm.rotation.x = -Math.sin(phase) * 0.38;
      parts.rightArm.rotation.x = Math.sin(phase) * 0.38;
      parts.hip.rotation.z = Math.sin(phase * 0.5) * 0.025;
    } else if (customer.state === 'EATING') {
      parts.leftLeg.rotation.x = -0.96;
      parts.rightLeg.rotation.x = -0.96;
      parts.leftArm.rotation.x = -0.5;
      parts.rightArm.rotation.x = -0.5 + Math.sin(phase * 3) * 0.18;
      parts.hip.rotation.z = 0;
      parts.hip.position.y = sitHipY;
    } else if (customer.state === 'SEATED_WAITING_ORDER' || customer.state === 'WAITING_FOOD') {
      parts.leftLeg.rotation.x = -0.92;
      parts.rightLeg.rotation.x = -0.92;
      parts.leftArm.rotation.x = -0.2;
      parts.rightArm.rotation.x = -0.2;
      parts.hip.rotation.z = 0;
      parts.hip.position.y = sitHipY;
      parts.head.rotation.y = Math.sin(phase * 0.8) * 0.12;
    } else {
      parts.leftLeg.rotation.x = 0;
      parts.rightLeg.rotation.x = 0;
      parts.leftArm.rotation.x = 0;
      parts.rightArm.rotation.x = 0;
      parts.hip.rotation.z = 0;
      parts.hip.position.y = 0.86;
      parts.head.rotation.y = 0;
    }

    if (parts.torso) {
      parts.torso.scale.y = customer.state === 'EATING' ? 0.94 + Math.sin(phase * 2.2) * 0.02 : 1;
    }
  }

  _tryCreateTicket(customer) {
    if (customer.orderId) return true;
    if (customer.ticketCooldown > 0) return false;
    customer.ticketCooldown = 1.2;
    const order = this.orders.createOrderForCustomer(customer.id, this.unlockedRecipeIds, {
      menuRecipeIds: this.menuRecipeIds
    });
    if (!order) return false;
    customer.orderId = order.id;
    customer.orderPatience = customer.maxOrderPatience;
    AudioSys.playOrderTicket?.();
    this._setState(customer, 'WAITING_FOOD');
    this._changed();
    return true;
  }

  _assignSeat(customer) {
    const seat = this.furniture.assignSeatForCustomer(customer.id);
    if (!seat) return false;
    customer.seatId = seat.id;
    customer.queueSlot = -1;
    this._setTarget(customer, seat.x, seat.z);
    this._setState(customer, 'WALKING_TO_SEAT');
    return true;
  }

  _startLeaving(customer, reason = 'LEFT') {
    if (customer.state === 'LEAVING') return;
    if (customer.orderId) {
      this.orders.loseOrder(customer.orderId, reason);
      customer.orderId = null;
    }
    if (customer.seatId) {
      this.furniture.releaseSeat(customer.id);
      customer.seatId = null;
    }
    const exit = ISLAND.customer.exit;
    this._setTarget(customer, exit.x, exit.z);
    this._setState(customer, 'LEAVING');
    this._changed();
  }

  _removeCustomer(customer) {
    const group = customer.group;
    this.customers.delete(customer.id);
    if (group) {
      this.scene.remove(group);
      disposeObject3D(group);
    }
    this._changed();
  }

  _onServed(customer, result) {
    this.servedCount++;
    this.totalRevenue += result.total || 0;
    this.totalTips += result.tip || 0;
    customer.orderId = null;
    customer.eatTimer = CUSTOMERS.eatDurationSec;
    this._setState(customer, 'EATING');
    this.onCustomerServed?.(customer, result);
    this._changed();
    return result;
  }

  serveCustomer(customerId, plateId, actorId, modifiers = {}) {
    if (!this.authority) return { ok: false, reason: 'SOLO_HOST' };
    const customer = this.customers.get(customerId);
    if (!customer) return { ok: false, reason: 'CLIENTE_NO_EXISTE' };
    if (!customer.orderId) return { ok: false, reason: 'SIN_PEDIDO' };
    if (customer.state !== 'WAITING_FOOD' && customer.state !== 'SEATED_WAITING_ORDER') {
      return { ok: false, reason: 'CLIENTE_OCUPADO' };
    }
    const patienceRatio = clamp01(customer.orderPatience / Math.max(1, customer.maxOrderPatience));
    const result = this.orders.servePlate(plateId, customer.id, actorId, {
      ...modifiers,
      patienceRatio
    });
    if (!result.ok) return result;
    this._onServed(customer, result);
    return result;
  }

  update(dt, context = {}) {
    this.elapsed += dt;
    if (context.simulate === false) {
      for (const customer of this.customers.values()) this._updateVisual(customer, dt);
      return;
    }
    if (!this.serviceActive) return;

    if (this.arrivalsAllowed && this.spawnedCount < this.targetCustomers) {
      this.arrivalTimer -= dt;
      const progress = Math.min(1, this.elapsed / 150);
      this.spawnInterval = CUSTOMERS.arrivalIntervalStart
        + (CUSTOMERS.arrivalIntervalEnd - CUSTOMERS.arrivalIntervalStart) * progress;
      if (this.arrivalTimer <= 0) {
        this.arrivalTimer = this.spawnInterval * (0.8 + Math.random() * 0.45);
        this.spawnCustomer();
      }
    }

    for (const customer of Array.from(this.customers.values())) {
      if (customer.ticketCooldown > 0) customer.ticketCooldown -= dt;
      if (customer.state === 'ARRIVING_TO_QUEUE') {
        const spot = this._queuePosition(customer);
        if (this._moveTowards(customer, spot.x, spot.z, dt)) {
          this._setState(customer, 'WAITING_SEAT');
          customer.queuePatience = CUSTOMERS.queuePatienceSec * (customer.archetype.patienceMult || 1);
          this._tryAssignSeat(customer);
        }
      } else if (customer.state === 'WAITING_SEAT') {
        customer.queuePatience -= dt;
        this._tryAssignSeat(customer);
        if (customer.queuePatience <= 0) {
          this.lostCount++;
          this.onCustomerLost?.(customer, 'QUEUE_TIMEOUT');
          this._startLeaving(customer, 'QUEUE_TIMEOUT');
        }
      } else if (customer.state === 'WALKING_TO_SEAT') {
        const seat = this._seatPosition(customer);
        if (!seat) {
          this.furniture.releaseSeat(customer.id);
          customer.seatId = null;
          this._setState(customer, 'WAITING_SEAT');
          continue;
        }
        if (this._moveTowards(customer, seat.x, seat.z, dt)) {
          customer.yaw = seat.yaw + Math.PI;
          this._tryCreateTicket(customer);
          if (!customer.orderId) this._setState(customer, 'SEATED_WAITING_ORDER');
        }
      } else if (customer.state === 'SEATED_WAITING_ORDER') {
        customer.orderPatience = Math.max(0, customer.maxOrderPatience);
        this._tryCreateTicket(customer);
        if (!customer.orderId) {
          customer.queuePatience -= dt;
          if (customer.queuePatience <= 0) {
            this.lostCount++;
            this.onCustomerLost?.(customer, 'NO_MENU');
            this._startLeaving(customer, 'NO_MENU');
          }
        }
      } else if (customer.state === 'WAITING_FOOD') {
        // La paciencia se congela mientras el pedido está en la cocina: el
        // jugador está dentro de un minijuego y no puede atender otra cosa.
        const order = customer.orderId ? this.orders.getOrder(customer.orderId) : null;
        const cooking = order?.status === 'cooking';
        if (!cooking) {
          customer.orderPatience -= dt;
          if (customer.orderPatience <= 0) {
            this.lostCount++;
            this.onCustomerLost?.(customer, 'ORDER_TIMEOUT');
            this._startLeaving(customer, 'ORDER_TIMEOUT');
          }
        }
      } else if (customer.state === 'EATING') {
        customer.eatTimer -= dt;
        if (customer.eatTimer <= 0) this._startLeaving(customer, 'FINISHED');
      } else if (customer.state === 'LEAVING') {
        const exit = ISLAND.customer.exit;
        if (this._moveTowards(customer, exit.x, exit.z, dt)) {
          this._removeCustomer(customer);
        }
      }
      this._updateVisual(customer, dt);
    }

    if (!this.arrivalsAllowed && this.spawnedCount >= this.targetCustomers && this.customers.size === 0 && !this.serviceComplete) {
      this.serviceActive = false;
      this.serviceComplete = true;
      this.onServiceComplete?.(this.getStats());
    }
    this._changed();
  }

  _tryAssignSeat(customer) {
    if (customer.state !== 'WAITING_SEAT' || customer.seatId) return false;
    const ok = this._assignSeat(customer);
    if (ok) this._changed();
    return ok;
  }

  applyNetworkState(data = {}) {
    if (!data) return;
    this.targetCustomers = data.targetCustomers || 0;
    this.spawnedCount = data.spawnedCount || 0;
    this.servedCount = data.servedCount || 0;
    this.lostCount = data.lostCount || 0;
    this.totalRevenue = data.totalRevenue || 0;
    this.totalTips = data.totalTips || 0;
    this.arrivalsAllowed = !!data.arrivalsAllowed;
    this.serviceActive = !!data.serviceActive;
    this.serviceComplete = !!data.serviceComplete;
    this.arrivalTimer = data.arrivalTimer || 0;
    this.elapsed = data.elapsed || 0;
    this.unlockedRecipeIds = [...(data.unlockedRecipeIds || this.unlockedRecipeIds)];
    const incoming = new Set();
    for (const raw of data.customers || []) {
      incoming.add(raw.id);
      let customer = this.customers.get(raw.id);
      if (!customer) {
        const archetype = getCustomerArchetype(raw.variant || 0);
        const variant = raw.variant || 0;
        const y = groundAt(this.worldPhysics, raw.x, raw.z);
        const group = createCustomerModel(archetype, variant);
        group.position.set(raw.x, y, raw.z);
        group.rotation.y = raw.yaw || 0;
        this.scene.add(group);
        customer = {
          id: raw.id,
          archetype,
          variant,
          group,
          x: raw.x,
          z: raw.z,
          targetX: raw.targetX ?? raw.x,
          targetZ: raw.targetZ ?? raw.z,
          yaw: raw.yaw || 0,
          state: raw.state || 'WAITING_SEAT',
          stateTimer: 0,
          queueSlot: raw.queueSlot || 0,
          seatId: null,
          orderId: null,
          orderPatience: 0,
          maxOrderPatience: raw.maxOrderPatience || CUSTOMERS.orderPatienceSec,
          queuePatience: raw.queuePatience || CUSTOMERS.queuePatienceSec,
          eatTimer: 0,
          ticketCooldown: 1.2,
          isWalkable: true
        };
        this.customers.set(customer.id, customer);
      }
      customer.state = raw.state || customer.state;
      customer.queueSlot = raw.queueSlot ?? customer.queueSlot;
      customer.x = raw.x ?? customer.x;
      customer.z = raw.z ?? customer.z;
      customer.targetX = raw.targetX ?? customer.targetX;
      customer.targetZ = raw.targetZ ?? customer.targetZ;
      customer.yaw = raw.yaw ?? customer.yaw;
      customer.orderId = raw.orderId || null;
      customer.orderPatience = raw.orderPatience ?? customer.orderPatience;
      customer.maxOrderPatience = raw.maxOrderPatience ?? customer.maxOrderPatience;
      customer.queuePatience = raw.queuePatience ?? customer.queuePatience;
      customer.eatTimer = raw.eatTimer ?? customer.eatTimer;
      customer.seatId = raw.seatId || null;
      customer.group.position.x = customer.x;
      customer.group.position.z = customer.z;
      customer.group.position.y = groundAt(this.worldPhysics, customer.x, customer.z);
      customer.group.rotation.y = customer.yaw;
    }
    for (const [id, customer] of Array.from(this.customers.entries())) {
      if (incoming.has(id)) continue;
      if (customer.group) {
        this.scene.remove(customer.group);
        disposeObject3D(customer.group);
      }
      this.customers.delete(id);
    }
    for (const seat of this.furniture.getSeats()) seat.occupiedBy = null;
    for (const customer of this.customers.values()) {
      if (!customer.seatId) continue;
      const seat = this.furniture.getSeats().find(s => s.id === customer.seatId);
      if (seat) seat.occupiedBy = customer.id;
    }
    this._changed();
  }

  serialize() {
    return {
      targetCustomers: this.targetCustomers,
      spawnedCount: this.spawnedCount,
      servedCount: this.servedCount,
      lostCount: this.lostCount,
      totalRevenue: this.totalRevenue,
      totalTips: this.totalTips,
      arrivalsAllowed: this.arrivalsAllowed,
      serviceActive: this.serviceActive,
      serviceComplete: this.serviceComplete,
      arrivalTimer: this.arrivalTimer,
      elapsed: this.elapsed,
      unlockedRecipeIds: [...this.unlockedRecipeIds],
      customers: Array.from(this.customers.values()).map(c => ({
        id: c.id,
        variant: c.variant,
        archetypeId: c.archetype.id,
        x: c.x,
        z: c.z,
        state: c.state,
        queueSlot: c.queueSlot,
        seatId: c.seatId,
        orderId: c.orderId,
        orderPatience: c.orderPatience,
        maxOrderPatience: c.maxOrderPatience,
        queuePatience: c.queuePatience,
        eatTimer: c.eatTimer,
        targetX: c.targetX,
        targetZ: c.targetZ,
        yaw: c.yaw
      }))
    };
  }

  restore(data = {}) {
    this.clear();
    this.targetCustomers = data.targetCustomers || 0;
    this.spawnedCount = data.spawnedCount || 0;
    this.servedCount = data.servedCount || 0;
    this.lostCount = data.lostCount || 0;
    this.totalRevenue = data.totalRevenue || 0;
    this.totalTips = data.totalTips || 0;
    this.arrivalsAllowed = !!data.arrivalsAllowed;
    this.serviceActive = !!data.serviceActive;
    this.serviceComplete = !!data.serviceComplete;
    this.arrivalTimer = data.arrivalTimer || 0;
    this.elapsed = data.elapsed || 0;
    this.unlockedRecipeIds = [...(data.unlockedRecipeIds || [])];
    for (const raw of data.customers || []) {
      const archetype = getCustomerArchetype(raw.variant || 0);
      const variant = raw.variant || 0;
      const y = groundAt(this.worldPhysics, raw.x, raw.z);
      const group = createCustomerModel(archetype, variant);
      group.position.set(raw.x, y, raw.z);
      group.rotation.y = raw.yaw || 0;
      this.scene.add(group);
      const customer = {
        id: raw.id,
        archetype,
        variant,
        group,
        x: raw.x,
        z: raw.z,
        targetX: raw.targetX ?? raw.x,
        targetZ: raw.targetZ ?? raw.z,
        yaw: raw.yaw || 0,
        state: raw.state || 'WAITING_SEAT',
        stateTimer: 0,
        queueSlot: raw.queueSlot || 0,
        seatId: raw.seatId || null,
        orderId: raw.orderId || null,
        orderPatience: raw.orderPatience || 0,
        maxOrderPatience: raw.maxOrderPatience || CUSTOMERS.orderPatienceSec,
        queuePatience: raw.queuePatience || CUSTOMERS.queuePatienceSec,
        eatTimer: raw.eatTimer || 0,
        ticketCooldown: 1.2,
        isWalkable: true
      };
      if (customer.seatId) {
        const seat = this.furniture.getSeats().find(s => s.id === customer.seatId);
        if (seat) seat.occupiedBy = customer.id;
      }
      this.customers.set(customer.id, customer);
      const numeric = parseInt(String(customer.id).replace(/\D/g, ''), 10);
      if (Number.isFinite(numeric)) nextCustomerId = Math.max(nextCustomerId, numeric + 1);
    }
    this._changed();
  }

  clear() {
    for (const customer of this.customers.values()) {
      if (customer.group) {
        this.scene.remove(customer.group);
        disposeObject3D(customer.group);
      }
    }
    this.customers.clear();
    this.furniture.clearSeats();
    this.serviceActive = false;
    this.serviceComplete = false;
    this.arrivalsAllowed = false;
    this._changed();
  }

  destroy() {
    this.clear();
    this.onCustomerServed = null;
    this.onCustomerLost = null;
    this.onServiceComplete = null;
  }
}
