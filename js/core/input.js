// Entrada de teclado y ratón, pointer lock, dash y colocación de torretas.
// Exports: keys, setupInput.

import * as THREE from 'three';
import { AudioSys } from '../audio.js';

export const keys = {};

export function clearMovementKeys() {
  Object.keys(keys).forEach(key => { keys[key] = false; });
}

export function setupInput(rt) {
window.addEventListener('keydown', e => {
  if (e.key === 'F3' || (e.key.toLowerCase() === 'b' && rt.state === 'PLAYING')) {
    e.preventDefault();
    rt.debugOverlay.toggle();
    return;
  }
  // Muerte estricta: no se leen inputs de juego mientras el operario está caído.
  // No se interceptan combinaciones del navegador (Ctrl/Cmd/Alt).
  if (rt.isDead) {
    const deadKey = e.key.toLowerCase();
    const gameKey = ['w', 'a', 's', 'd', 'shift', ' ', 'e', 'f', 'g', 'v', 't', 'p'].includes(deadKey)
      || e.code === 'Space';
    if (gameKey && !e.ctrlKey && !e.metaKey && !e.altKey) e.preventDefault();
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
    if (k === 'v' && !e.repeat) {
      e.preventDefault();
      const visible = rt.ModeManager.activeMode?.toggleTurretRanges?.();
      AudioSys.playUIClick?.();
      const btn = document.getElementById('btn-toggle-turret-ranges');
      if (btn) btn.classList.toggle('is-active', !!visible);
      return;
    }
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
    if (k === 'v' && !e.repeat) {
      e.preventDefault();
      const visible = mode?.toggleTurretRanges?.();
      AudioSys.playUIClick?.();
      const btn = document.getElementById('btn-toggle-turret-ranges');
      if (btn) btn.classList.toggle('is-active', !!visible);
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
    rt.dashCd = 0.85;
    const bar = document.getElementById('stam-bar');
    const cdBar = document.getElementById('dash-cd-bar');
    const tracker = document.getElementById('stamina-tracker-overlay');
    if (bar) {
      bar.style.width = Math.max(0, rt.stats.stamina) + '%';
      bar.classList.toggle('low-energy', rt.stats.stamina < 35);
    }
    if (cdBar) cdBar.style.width = '0%';
    if (tracker) tracker.classList.add('visible');
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
  if (document.pointerLockElement === document.body && rt.state === 'PLAYING' && !rt.isDead) {
    const sens = (rt.gameSettings.mouseSens || 100) / 100;
    rt.yaw -= e.movementX * 0.0028 * sens;
    rt.pitch = Math.max(-0.95, Math.min(0.5, rt.pitch - e.movementY * 0.0024 * sens));

    // Inercia dinámica para el viewmodel en primera persona
    rt.swayInputX = Math.max(-18, Math.min(18, (rt.swayInputX || 0) - e.movementX * 0.35));
    rt.swayInputY = Math.max(-14, Math.min(14, (rt.swayInputY || 0) - e.movementY * 0.25));
  }
});

window.addEventListener('wheel', e => {
  if (rt.state !== 'PLAYING' || rt.isDead) return;
  // Si hay menús modales interactivos en pantalla, permitir scroll de la UI y no hacer zoom
  if (rt.state === 'BUILD' || rt.state === 'PAUSED' || rt.state === 'LEVEL_UP') return;

  // Ajuste de distancia de cámara con la rueda del ratón:
  // - deltaY > 0 (rueda hacia abajo / atrás): aleja la cámara (máximo 2.5x distancia base)
  // - deltaY < 0 (rueda hacia arriba / adelante): acerca la cámara (mínimo 0.0 = primera persona)
  const rawDelta = e.deltaMode === 1 ? e.deltaY * 20 : e.deltaY;
  const zoomStep = Math.sign(rawDelta) * Math.min(0.25, Math.max(0.08, Math.abs(rawDelta) * 0.002));

  const current = rt.targetCamDistMult ?? 1.0;
  const next = Math.max(0.0, Math.min(2.5, current + zoomStep));
  rt.targetCamDistMult = Math.round(next * 100) / 100;

  try {
    localStorage.setItem('traces_camera_dist', String(rt.targetCamDistMult));
  } catch (_) {}
}, { passive: true });

window.addEventListener('mousedown', e => {
  document.body.classList.add('mouse-pressed');
  if (rt.state !== 'PLAYING' || rt.isDead) return;
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

  // Clic de rueda (botón central): restablecer distancia de cámara predeterminada (1.0x)
  if (e.button === 1) {
    e.preventDefault();
    rt.targetCamDistMult = 1.0;
    try {
      localStorage.setItem('traces_camera_dist', '1.0');
    } catch (_) {}
    return;
  }

  // Recuperar el pointer lock si se perdió (por ejemplo al cancelar una colocación)
  if (e.button === 0 && !document.pointerLockElement) {
    document.body.requestPointerLock();
  }
});

window.addEventListener('mouseup', () => {
  document.body.classList.remove('mouse-pressed');
});
window.addEventListener('blur', () => {
  document.body.classList.remove('mouse-pressed');
});

window.addEventListener('contextmenu', e => {
  if (rt.state === 'PLAYING' && rt.ModeManager.activeMode?.isTurretPlacementActive?.()) {
    e.preventDefault();
  }
});
}
