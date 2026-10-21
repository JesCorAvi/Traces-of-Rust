// Entrada de teclado y ratón, pointer lock, dash y colocación de torretas.
// Exports: keys, setupInput.

import * as THREE from 'three';
import { AudioSys } from '../audio.js';

export const keys = {};

export function setupInput(rt) {
window.addEventListener('keydown', e => {
  if (e.key === 'F3' || (e.key.toLowerCase() === 'b' && rt.state === 'PLAYING')) {
    e.preventDefault();
    rt.debugOverlay.toggle();
    return;
  }
  const k = e.key.toLowerCase();

  // Transferencia rápida de chatarra en co-op: T envía +5, Shift+T envía +1.
  if (
    k === 't' && !e.repeat && rt.MultiplayerSync?.isMatchActive &&
    (rt.state === 'PLAYING' || rt.state === 'BUILD' || rt.state === 'LEVEL_UP' || rt.state === 'PAUSED')
  ) {
    e.preventDefault();
    rt.MultiplayerSync.sendScrapToPeer(e.shiftKey ? 1 : 5);
    return;
  }

  if (rt.state === 'BUILD') {
    if (k === 'e' || k === 'escape') {
      e.preventDefault();
      rt.turretBuildMenu.close();
      return;
    }
    if ((k === 'f' || k === 'g') && rt.ModeManager.activeMode?.canSkipPrep?.()) {
      e.preventDefault();
      rt.turretBuildMenu.close();
      rt.ModeManager.activeMode.skipPrep();
      return;
    }
    return;
  }

  if (rt.state === 'PLAYING' && rt.ModeManager.getSelectedModeId() === 'core_defense') {
    const mode = rt.ModeManager.activeMode;
    if (mode?.handleTutorialKey?.(k)) {
      e.preventDefault();
      return;
    }
    if (mode?.isTurretPlacementActive?.()) {
      if (k === 'e') {
        e.preventDefault();
        mode.confirmTurretPlacement();
        return;
      }
      if (k === 'escape') {
        e.preventDefault();
        mode.cancelTurretPlacement();
        document.body.requestPointerLock();
        return;
      }
    }
    if ((k === 'f' || k === 'g') && mode?.canSkipPrep?.()) {
      e.preventDefault();
      mode.skipPrep();
      return;
    }
  }

  if (rt.state === 'LEVEL_UP') {
    const cards = Array.from(document.querySelectorAll('#upgrade-container .upg-card'));
    if (['1', '2', '3', '4'].includes(k)) {
      const idx = parseInt(k, 10) - 1;
      if (cards[idx]) { e.preventDefault(); cards[idx].click(); }
      return;
    }
    if (k === 'r') { e.preventDefault(); document.getElementById('btn-reroll')?.click(); return; }
    return;
  }

  if (k === 'p' && (rt.state === 'PLAYING' || rt.state === 'PAUSED')) {
    e.preventDefault();
    rt.togglePauseGame();
    return;
  }

  if (k === 'e' && rt.state === 'PLAYING' && rt.ModeManager.getSelectedModeId() === 'core_defense') {
    const mode = rt.ModeManager.activeMode;
    if (mode?.isTurretPlacementActive?.()) {
      e.preventDefault();
      mode.confirmTurretPlacement();
      return;
    }
    const nearby = mode?.getNearbyTurret?.(rt.playerGroup.position) || null;
    e.preventDefault();
    rt.openTurretBuildMenu(nearby);
    return;
  }

  keys[k] = true;
  if (rt.state !== 'PLAYING') return;

  if (k === 'shift' && rt.dashCd <= 0 && rt.stats.stamina >= 35 && rt.dashTimer <= 0) {
    rt.stats.stamina -= 35;
    document.getElementById('stam-bar').style.width = Math.max(0, rt.stats.stamina) + '%';
    rt.dashCd = 0.85;
    rt.dashTimer = 0.24;
    rt.dashGhostTimer = 0.045; // Provoca la primera estela y chispas instantáneamente al despegar
    rt.invuln = 0.35;
    if (rt.playerBillboard) rt.playerBillboard.animTimer = 0; // Sincroniza la animación para iniciar siempre desde el fotograma 0 de empuje
    if (typeof rt.camShake === 'number') rt.camShake = Math.max(rt.camShake, 0.12);
    const camFwd = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), rt.yaw);
    const camRight = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), rt.yaw);
    rt.dashDirVec.set(0, 0, 0);
    if (keys.w) rt.dashDirVec.add(camFwd);
    if (keys.s) rt.dashDirVec.sub(camFwd);
    if (keys.d) rt.dashDirVec.add(camRight);
    if (keys.a) rt.dashDirVec.sub(camRight);
    if (rt.dashDirVec.lengthSq() > 0) {
      rt.dashDirVec.normalize();
      rt.playerFacingYaw = Math.atan2(-rt.dashDirVec.x, -rt.dashDirVec.z);
    } else {
      rt.dashDirVec.set(-Math.sin(rt.playerFacingYaw), 0, -Math.cos(rt.playerFacingYaw)).normalize();
    }
    rt.camera.fov = 78;
    rt.camera.updateProjectionMatrix();
    AudioSys.playDash();
  }
  if (e.code === 'Space' && rt.isGrounded) {
    rt.playerYVel = 9.2;
    rt.isGrounded = false;
    AudioSys.play(220, 0.1, 'sine');
  }
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
document.addEventListener('mousemove', e => {
  if (document.pointerLockElement === document.body && rt.state === 'PLAYING') {
    const sens = (rt.gameSettings.mouseSens || 100) / 100;
    rt.yaw -= e.movementX * 0.0028 * sens;
    rt.pitch = Math.max(-0.95, Math.min(0.5, rt.pitch - e.movementY * 0.0024 * sens));
  }
});

window.addEventListener('mousedown', e => {
  if (rt.state !== 'PLAYING') return;
  const mode = rt.ModeManager.activeMode;

  if (mode?.isTurretPlacementActive?.()) {
    if (e.button === 0) {
      e.preventDefault();
      mode.confirmTurretPlacement();
    } else if (e.button === 2) {
      e.preventDefault();
      mode.cancelTurretPlacement();
    }
    return;
  }

  // Recuperar el pointer lock si se perdió (por ejemplo al cancelar una colocación)
  if (e.button === 0 && !document.pointerLockElement) {
    document.body.requestPointerLock();
  }
});

window.addEventListener('contextmenu', e => {
  if (rt.state === 'PLAYING' && rt.ModeManager.activeMode?.isTurretPlacementActive?.()) {
    e.preventDefault();
  }
});
}
