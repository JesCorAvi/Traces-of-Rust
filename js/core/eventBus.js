// Bus de eventos con suscripción, emisión y limpieza centralizada.
// Exports: EventBus, GameEvents.
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
      // Preserva listeners del sistema y la interfaz que se configuran al importar módulos
      const persistent = new Map();
      const SYSTEM_EVENTS = ['i18n:change', 'mode:selected', 'game:menu'];
      SYSTEM_EVENTS.forEach(evt => {
        if (this.listeners.has(evt)) persistent.set(evt, this.listeners.get(evt));
      });
      this.listeners.clear();
      persistent.forEach((val, key) => this.listeners.set(key, val));
    }
  }
}

export const GameEvents = new EventBus();