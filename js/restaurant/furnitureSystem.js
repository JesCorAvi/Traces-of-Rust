// Mobiliario del chiringuito: catálogo, colocación, plazas y serialización.
// Exports: FurnitureSystem.

import * as THREE from 'three';
import { FURNITURE, FURNITURE_LIST, getFurniture } from '../config/chiringuito/furniture.js';
import { ISLAND } from '../config/chiringuito/island.js';
import { buildFurnitureModel, getFurnitureSeatOffsets } from './furnitureModels.js';
import { disposeObject3D } from '../utils/dispose.js';

let nextFurnitureId = 1;

function rotateOffset(x, z, yaw) {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return { x: x * c - z * s, z: x * s + z * c };
}

export class FurnitureSystem {
  constructor(scene, worldPhysics, options = {}) {
    this.scene = scene;
    this.worldPhysics = worldPhysics;
    this.authority = options.authority !== false;
    this.onChange = options.onChange || null;
    this.group = new THREE.Group();
    this.group.name = 'chiringuito_furniture';
    scene.add(this.group);
    this.items = new Map();
    this.seats = new Map();
    this.preview = null;
    this.previewType = null;
    this._buildBaseFurniture();
  }

  getCatalog() {
    return FURNITURE_LIST;
  }

  getItem(id) {
    return this.items.get(id) || null;
  }

  getItems() {
    return Array.from(this.items.values());
  }

  getExtraItems() {
    return this.getItems().filter(item => !item.isBase);
  }

  getCapacity() {
    let seats = 0;
    for (const item of this.items.values()) seats += item.cfg.seats || 0;
    return seats;
  }

  getCharm() {
    let charm = 0;
    for (const item of this.items.values()) charm += item.cfg.charm || 0;
    return charm;
  }

  getPatienceBonus() {
    let bonus = 0;
    for (const item of this.items.values()) bonus += item.cfg.patienceBonus || 0;
    return bonus;
  }

  getTipBonus() {
    let bonus = 0;
    for (const item of this.items.values()) bonus += item.cfg.tipBonus || 0;
    return bonus;
  }

  getSeats() {
    return Array.from(this.seats.values());
  }

  getOpenSeats() {
    return this.getSeats().filter(seat => !seat.occupiedBy);
  }

  getSeatForCustomer(customerId) {
    return this.getSeats().find(seat => seat.occupiedBy === customerId) || null;
  }

  assignSeatForCustomer(customerId) {
    if (!customerId) return null;
    const existing = this.getSeatForCustomer(customerId);
    if (existing) return existing;
    const open = this.getOpenSeats();
    if (open.length === 0) return null;
    open.sort((a, b) => (a.sortIndex || 0) - (b.sortIndex || 0));
    const seat = open[0];
    seat.occupiedBy = customerId;
    return seat;
  }

  releaseSeat(customerId) {
    const seat = this.getSeatForCustomer(customerId);
    if (seat) seat.occupiedBy = null;
    return seat;
  }

  getBaseSeating() {
    return this.getItems().filter(item => item.isBase);
  }

  _buildBaseFurniture() {
    for (const base of ISLAND.seating.baseSeats || []) {
      this._addItem(base.typeId, base.x, base.z, base.yaw || 0, {
        id: base.furnitureId,
        isBase: true,
        silent: true
      });
    }
  }

  _groundAt(x, z) {
    return this.worldPhysics?.getGroundHeight(x, z, 0, true, true)
      ?? this.worldPhysics?.getGroundHeight(x, z, 0)
      ?? 0;
  }

  _addItem(typeId, x, z, yaw = 0, options = {}) {
    const cfg = getFurniture(typeId);
    if (!cfg) return null;
    const id = options.id || `furniture_${nextFurnitureId++}`;
    const ground = this._groundAt(x, z);
    const group = buildFurnitureModel(typeId, { accentColor: cfg.color });
    group.position.set(x, ground, z);
    group.rotation.y = yaw;
    group.userData.furnitureId = id;
    group.userData.typeId = typeId;
    this.group.add(group);

    const item = {
      id,
      typeId,
      cfg,
      x,
      z,
      yaw,
      ground,
      group,
      isBase: !!options.isBase,
      seats: [],
      collider: null
    };
    this._registerCollider(item);

    const offsets = getFurnitureSeatOffsets(typeId);
    offsets.forEach((offset, idx) => {
      const rotated = rotateOffset(offset.x, offset.z, yaw);
      const seat = {
        id: `${id}_seat_${idx}`,
        furnitureId: id,
        x: x + rotated.x,
        z: z + rotated.z,
        yaw: yaw + (offset.yaw || 0),
        sitY: Number.isFinite(offset.sitY) ? offset.sitY : 0.58,
        occupiedBy: null,
        sortIndex: this.seats.size
      };
      this.seats.set(seat.id, seat);
      item.seats.push(seat.id);
    });

    this.items.set(id, item);
    if (!options.silent) this.onChange?.();
    return item;
  }

  _registerCollider(item) {
    const physics = this.worldPhysics;
    if (!physics) return;
    const cfg = item.cfg;
    const isThinDecor = ['umbrella', 'lantern'].includes(item.typeId);
    if (isThinDecor) {
      const cyl = physics.addCylinder?.({
        x: item.x,
        z: item.z,
        r: item.typeId === 'umbrella' ? 0.32 : 0.22,
        topY: item.ground + 2.0
      });
      item.collider = cyl ? { kind: 'cylinder', ref: cyl } : null;
      return;
    }
    const width = cfg.size?.[0] || 1.2;
    const depth = cfg.size?.[1] || 1.2;
    const box = physics.addWalkableBox?.({
      minX: item.x - width / 2,
      maxX: item.x + width / 2,
      minZ: item.z - depth / 2,
      maxZ: item.z + depth / 2,
      bottomY: item.ground,
      topY: item.ground + Math.max(1.1, cfg.seats ? 1.15 : 0.95),
      isObstacle: true
    });
    item.collider = box ? { kind: 'box', ref: box } : null;
  }

  _unregisterCollider(item) {
    if (!item?.collider) return;
    if (item.collider.kind === 'box') this.worldPhysics?.removeWalkableBox?.(item.collider.ref);
    else this.worldPhysics?.removeCylinder?.(item.collider.ref);
    item.collider = null;
  }

  isInNoBuildLane(x, z, halfX = 0, halfZ = 0) {
    for (const lane of ISLAND.build.noBuildLanes || []) {
      if (
        x + halfX > lane.minX && x - halfX < lane.maxX &&
        z + halfZ > lane.minZ && z - halfZ < lane.maxZ
      ) return true;
    }
    return false;
  }

  canPlace(typeId, x, z, ignoreId = null) {
    const cfg = getFurniture(typeId);
    if (!cfg) return { valid: false, reason: 'MUEBLE DESCONOCIDO' };
    if (this.getExtraItems().length >= ISLAND.build.maxFurniture) {
      return { valid: false, reason: 'TERRAZA LLENA' };
    }
    const halfX = (cfg.size?.[0] || 1) / 2;
    const halfZ = (cfg.size?.[1] || 1) / 2;
    const zone = ISLAND.build.zone;
    if (x - halfX < zone.minX || x + halfX > zone.maxX || z - halfZ < zone.minZ || z + halfZ > zone.maxZ) {
      return { valid: false, reason: 'FUERA DE LA TERRAZA' };
    }
    if (this.isInNoBuildLane(x, z, halfX, halfZ)) {
      return { valid: false, reason: 'PASILLO RESERVADO' };
    }
    const stand = ISLAND.stand;
    if (Math.hypot(x - stand.x, z - stand.z) < 2.2 + halfX) {
      return { valid: false, reason: 'DEMASIADO CERCA DE LA BARRA' };
    }
    const kitchen = stand.kitchen;
    if (Math.hypot(x - kitchen.x, z - kitchen.z) < 2.0 + halfX) {
      return { valid: false, reason: 'DEMASIADO CERCA DE LA COCINA' };
    }
    const farm = ISLAND.farm.center;
    if (Math.hypot(x - farm.x, z - farm.z) < 7.0) {
      return { valid: false, reason: 'ZONA DE GRANJA' };
    }
    for (const item of this.items.values()) {
      if (item.id === ignoreId) continue;
      const otherX = (item.cfg.size?.[0] || 1) / 2;
      const otherZ = (item.cfg.size?.[1] || 1) / 2;
      if (
        Math.abs(x - item.x) < halfX + otherX - 0.05 &&
        Math.abs(z - item.z) < halfZ + otherZ - 0.05
      ) {
        return { valid: false, reason: 'ESPACIO OCUPADO' };
      }
    }
    return { valid: true, reason: 'LISTO PARA COLOCAR' };
  }

  place(typeId, x, z, yaw = 0, options = {}) {
    if (!this.authority && !options.remote) return { ok: false, reason: 'SOLO_HOST' };
    const check = this.canPlace(typeId, x, z);
    if (!check.valid) return { ok: false, reason: check.reason };
    const item = this._addItem(typeId, x, z, yaw, { silent: !!options.silent });
    return { ok: true, item };
  }

  remove(id, options = {}) {
    const item = this.items.get(id);
    if (!item || item.isBase) return { ok: false, reason: 'NO_VENDIBLE' };
    if (!this.authority && !options.remote) return { ok: false, reason: 'SOLO_HOST' };
    for (const seatId of item.seats) {
      const seat = this.seats.get(seatId);
      if (seat?.occupiedBy) return { ok: false, reason: 'ASIENTO OCUPADO' };
      this.seats.delete(seatId);
    }
    this._unregisterCollider(item);
    this.items.delete(id);
    this.group.remove(item.group);
    disposeObject3D(item.group);
    this.onChange?.();
    return { ok: true, refund: Math.floor((item.cfg.cost || 0) * 0.5), item };
  }

  setPreview(typeId) {
    if (this.previewType === typeId && this.preview) return;
    this.clearPreview();
    const cfg = getFurniture(typeId);
    if (!cfg) return;
    this.previewType = typeId;
    this.preview = buildFurnitureModel(typeId, { accentColor: cfg.color });
    this.preview.traverse(obj => {
      if (obj.isMesh) {
        obj.material = obj.material.clone();
        obj.material.transparent = true;
        obj.material.opacity = 0.42;
        obj.material.depthWrite = false;
        obj.castShadow = false;
      }
    });
    this.group.add(this.preview);
  }

  updatePreview(x, z, valid = true) {
    if (!this.preview) return;
    const ground = this._groundAt(x, z);
    this.preview.position.set(x, ground, z);
    this.preview.traverse(obj => {
      if (obj.isMesh && obj.material?.color) {
        obj.material.color.setHex(valid ? 0x9caf6b : 0xa52020);
      }
    });
  }

  clearPreview() {
    if (!this.preview) return;
    this.group.remove(this.preview);
    disposeObject3D(this.preview);
    this.preview = null;
    this.previewType = null;
  }

  update(dt) {
    const t = performance.now() * 0.001;
    for (const item of this.items.values()) {
      if (item.typeId === 'lantern') {
        item.group.children.forEach(child => {
          if (child.isMesh && child.material?.isMeshBasicMaterial) {
            const s = 0.9 + Math.sin(t * 3.2 + item.x) * 0.08;
            child.scale.setScalar(s);
          }
        });
      }
    }
  }

  serialize() {
    return this.getExtraItems().map(item => ({
      id: item.id,
      typeId: item.typeId,
      x: item.x,
      z: item.z,
      yaw: item.yaw
    }));
  }

  restore(items = []) {
    this.clearPreview();
    for (const item of this.getExtraItems()) {
      for (const seatId of item.seats) this.seats.delete(seatId);
      this._unregisterCollider(item);
      this.items.delete(item.id);
      this.group.remove(item.group);
      disposeObject3D(item.group);
    }
    for (const saved of items) {
      if (!getFurniture(saved.typeId)) continue;
      this._addItem(saved.typeId, saved.x, saved.z, saved.yaw || 0, {
        id: saved.id,
        silent: true
      });
    }
    this.onChange?.();
  }

  clearSeats() {
    for (const seat of this.seats.values()) seat.occupiedBy = null;
  }

  destroy() {
    this.clearPreview();
    for (const item of this.items.values()) this._unregisterCollider(item);
    this.items.clear();
    this.seats.clear();
    this.scene.remove(this.group);
    disposeObject3D(this.group);
  }
}
