// ============================================================================
// BUS DE EVENTOS CENTRALIZADO (Desacopla Núcleo, Oleadas, IA, Modos y HUD)
// ============================================================================

class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Suscribe un callback a un evento. Devuelve una función para cancelar la suscripción.
   */
  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    const set = this.listeners.get(eventName);
    set.add(callback);
    return () => this.off(eventName, callback);
  }

  /**
   * Suscribe un callback que se ejecutará una única vez.
   */
  once(eventName, callback) {
    const wrapper = payload => {
      this.off(eventName, wrapper);
      callback(payload);
    };
    return this.on(eventName, wrapper);
  }

  /**
   * Elimina un callback específico de un evento.
   */
  off(eventName, callback) {
    const set = this.listeners.get(eventName);
    if (!set) return;
    set.delete(callback);
    if (set.size === 0) {
      this.listeners.delete(eventName);
    }
  }

  /**
   * Emite un evento con datos opcionales a todos los suscriptores activos.
   */
  emit(eventName, payload = {}) {
    const set = this.listeners.get(eventName);
    if (!set) return;
    Array.from(set).forEach(cb => {
      try {
        cb(payload);
      } catch (err) {
        console.error(`[EventBus] Error en listener de "${eventName}":`, err);
      }
    });
  }

  /**
   * Limpia los listeners de un evento o de todo el bus al cambiar de modo.
   */
  clear(eventName = null) {
    if (eventName) {
      this.listeners.delete(eventName);
    } else {
      this.listeners.clear();
    }
  }
}

export const GameEvents = new EventBus();