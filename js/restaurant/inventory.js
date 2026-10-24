// Inventario compartido del chiringuito.
// La comida es de los dos jugadores: no hay bolsillos individuales.
// Exports: RestaurantInventory.

import { INGREDIENT_IDS } from '../config/chiringuito/ingredients.js';

function emptyStock() {
  const stock = {};
  for (const id of INGREDIENT_IDS) stock[id] = 0;
  return stock;
}

export class RestaurantInventory {
  constructor(stock = null) {
    this.stock = { ...emptyStock(), ...(stock || {}) };
    this.onChange = null;
  }

  _changed() {
    this.onChange?.();
  }

  getStock() {
    return { ...this.stock };
  }

  get(ingredientId) {
    return Math.max(0, Number(this.stock[ingredientId] || 0));
  }

  getCrabMeat() {
    return this.get('crab');
  }

  setStock(stock = {}) {
    this.stock = { ...emptyStock(), ...stock };
    for (const id of INGREDIENT_IDS) {
      this.stock[id] = Math.max(0, Math.floor(Number(this.stock[id] || 0)));
    }
    this._changed();
  }

  add(ingredientId, amount = 1) {
    if (!INGREDIENT_IDS.includes(ingredientId)) return 0;
    const value = Math.max(0, Math.floor(Number(amount) || 0));
    if (value <= 0) return 0;
    this.stock[ingredientId] = this.get(ingredientId) + value;
    this._changed();
    return value;
  }

  addMany(map = {}) {
    let added = 0;
    for (const [id, amount] of Object.entries(map)) added += this.add(id, amount);
    return added;
  }

  remove(ingredientId, amount = 1) {
    if (!INGREDIENT_IDS.includes(ingredientId)) return 0;
    const value = Math.max(0, Math.floor(Number(amount) || 0));
    const available = this.get(ingredientId);
    const removed = Math.min(available, value);
    if (removed <= 0) return 0;
    this.stock[ingredientId] = available - removed;
    this._changed();
    return removed;
  }

  has(requirements = {}) {
    for (const [id, amount] of Object.entries(requirements)) {
      if (this.get(id) < Number(amount || 0)) return false;
    }
    return true;
  }

  canAfford(requirements = {}) {
    return this.has(requirements);
  }

  consume(requirements = {}) {
    if (!this.has(requirements)) return false;
    for (const [id, amount] of Object.entries(requirements)) {
      this.stock[id] = this.get(id) - Math.max(0, Number(amount) || 0);
    }
    this._changed();
    return true;
  }

  returnMany(requirements = {}) {
    this.addMany(requirements);
  }

  clear() {
    this.stock = emptyStock();
    this._changed();
  }

  serialize() {
    return { stock: this.getStock() };
  }

  restore(data = {}) {
    this.setStock(data.stock || {});
  }
}
