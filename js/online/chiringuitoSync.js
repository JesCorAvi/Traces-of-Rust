// Sincronización P2P del modo Chiringuito. El Host es autoritativo para
// fase, restaurante, clientes, pedidos, cocina y economía; el Cliente envía
// acciones y aplica snapshots.
// Exports: ChiringuitoSync.

import { ModeManager } from '../modes/gameModeManager.js';

export const ChiringuitoSync = {
  _tick: 0,

  getMode() {
    const mode = ModeManager.activeMode;
    return mode?.id === 'core_defense' ? mode : null;
  },

  isActive() {
    return !!this.getMode();
  },

  tick(net, dt) {
    if (!net?.isMatchActive || !net.isHost?.() || !net.modeReady) return;
    const mode = this.getMode();
    if (!mode) return;
    this._tick += dt;
    if (this._tick < 1.0) return;
    this._tick = 0;
    this.sendState(net);
  },

  buildPayload(mode) {
    return {
      snapshot: mode.buildNetworkSnapshot(),
      epoch: mode.director?.epoch || 1,
      timestamp: Date.now()
    };
  },

  sendSnapshot(net, targetPeerId) {
    if (!net?.isMatchActive || !net.isHost?.()) return;
    const mode = this.getMode();
    if (!mode || !net.modeReady) return;
    const payload = this.buildPayload(mode);
    if (targetPeerId) net.sendToPeer(targetPeerId, 'CG_SNAPSHOT', payload, true);
    else net.broadcast('CG_SNAPSHOT', payload, true);
  },

  sendState(net, targetPeerId = null) {
    if (!net?.isMatchActive || !net.isHost?.()) return;
    const mode = this.getMode();
    if (!mode || !net.modeReady) return;
    const payload = this.buildPayload(mode);
    if (targetPeerId) net.sendToPeer(targetPeerId, 'CG_STATE', payload, true);
    else net.broadcast('CG_STATE', payload, true);
  },

  handleSnapshot(net, data) {
    if (net.isHost?.()) return;
    const mode = this.getMode();
    if (!mode) return;
    mode.applyNetworkSnapshot(data?.snapshot || data);
  },

  handleState(net, data) {
    if (net.isHost?.()) return;
    const mode = this.getMode();
    if (!mode) return;
    mode.applyNetworkSnapshot(data?.snapshot || data);
  },

  handleAction(net, senderId, data) {
    if (!net.isHost?.()) return;
    const mode = this.getMode();
    if (!mode || !data?.action) return;
    mode.handleNetworkAction(data.action, data.payload || {}, senderId);
  }
};
