// HUD del radar y marcador direccional del Núcleo.
// Exports: updateCoreDirectionIndicator, updateRadarHUD.

import * as THREE from 'three';

export function updateCoreDirectionIndicator(camera, playerPos, corePos, coreRatio = 1) {
const indicator = document.getElementById('core-direction-indicator');
if (!indicator) return;
if (!corePos) {
  indicator.classList.add('hidden');
  indicator.style.display = 'none';
  return;
}
indicator.style.display = '';

const dist = Math.hypot(corePos.x - playerPos.x, corePos.z - playerPos.z);
const targetWorld = new THREE.Vector3(corePos.x, corePos.y + 2.8, corePos.z);
const projected = targetWorld.clone().project(camera);

const isBehind = projected.z > 1.0;
const isOnScreen = !isBehind && Math.abs(projected.x) < 0.72 && Math.abs(projected.y) < 0.72;

if (isOnScreen && dist < 14 && coreRatio > 0.5) {
  indicator.classList.add('dimmed');
} else {
  indicator.classList.remove('dimmed');
}

let nx = projected.x;
let ny = -projected.y;
if (isBehind) {
  nx = -nx;
  ny = -ny;
}

const angle = Math.atan2(ny, nx);
const radiusX = window.innerWidth * 0.36;
const radiusY = window.innerHeight * 0.34;
const cx = window.innerWidth * 0.5 + Math.cos(angle) * radiusX;
const cy = window.innerHeight * 0.5 + Math.sin(angle) * radiusY;

indicator.style.left = `${Math.round(cx)}px`;
indicator.style.top = `${Math.round(cy)}px`;

const arrowEl = indicator.querySelector('.core-dir-arrow');
const distEl = indicator.querySelector('.core-dir-dist');
if (arrowEl) {
  const deg = (angle * 180) / Math.PI + 90;
  arrowEl.style.transform = `rotate(${deg.toFixed(0)}deg)`;
}
if (distEl) {
  distEl.textContent = `NÚCLEO ${dist.toFixed(0)}M`;
}
indicator.classList.toggle('under-attack', coreRatio < 0.45);
}

export function updateRadarHUD(playerPos, yaw, activeEnemies, activeBoss, corePos = null, coopPos = null) {
const enemyDot = document.querySelector('.radar-dot.enemy-approx');
const bossDot = document.querySelector('.radar-dot.boss-approx');
const coreDot = document.querySelector('.radar-dot.core-approx');
const coopDot = document.querySelector('.radar-dot.coop-approx');
const threatLabel = document.getElementById('radar-threat-label');
if (!enemyDot || !bossDot) return;

const maxRadarDist = 34;
const cosY = Math.cos(-yaw);
const sinY = Math.sin(-yaw);

// Punto del Compañero Co-Op en el radar
if (coopDot) {
  if (coopPos) {
    coopDot.style.display = 'block';
    const dx = coopPos.x - playerPos.x;
    const dz = coopPos.z - playerPos.z;
    const rx = dx * cosY - dz * sinY;
    const rz = dx * sinY + dz * cosY;
    const normX = Math.max(-0.84, Math.min(0.84, rx / maxRadarDist));
    const normZ = Math.max(-0.84, Math.min(0.84, rz / maxRadarDist));
    coopDot.style.left = `${50 + normX * 42}%`;
    coopDot.style.top = `${50 + normZ * 42}%`;
  } else {
    coopDot.style.display = 'none';
  }
}

// Punto del Núcleo en el radar (si estamos en modo Defensa)
if (coreDot) {
  if (corePos) {
    coreDot.style.display = 'block';
    const dx = corePos.x - playerPos.x;
    const dz = corePos.z - playerPos.z;
    const rx = dx * cosY - dz * sinY;
    const rz = dx * sinY + dz * cosY;
    const normX = Math.max(-0.82, Math.min(0.82, rx / maxRadarDist));
    const normZ = Math.max(-0.82, Math.min(0.82, rz / maxRadarDist));
    coreDot.style.left = `${50 + normX * 42}%`;
    coreDot.style.top = `${50 + normZ * 42}%`;
  } else {
    coreDot.style.display = 'none';
  }
}

if (activeBoss && activeBoss.active && activeBoss.state !== 'dead') {
  bossDot.style.display = 'block';
  const dx = activeBoss.group.position.x - playerPos.x;
  const dz = activeBoss.group.position.z - playerPos.z;
  const rx = dx * cosY - dz * sinY;
  const rz = dx * sinY + dz * cosY;
  const normX = Math.max(-0.82, Math.min(0.82, rx / maxRadarDist));
  const normZ = Math.max(-0.82, Math.min(0.82, rz / maxRadarDist));
  bossDot.style.left = `${50 + normX * 42}%`;
  bossDot.style.top = `${50 + normZ * 42}%`;
  bossDot.style.right = 'auto';
} else {
  bossDot.style.display = 'none';
}

let closest = null;
let minDist = Infinity;
for (let i = 0; i < activeEnemies.length; i++) {
  const e = activeEnemies[i];
  if (e.state === 'dead' || e.isBoss) continue;
  const d = e.group.position.distanceTo(playerPos);
  if (d < minDist) {
    minDist = d;
    closest = e;
  }
}

if (closest) {
  enemyDot.style.display = 'block';
  const dx = closest.group.position.x - playerPos.x;
  const dz = closest.group.position.z - playerPos.z;
  const rx = dx * cosY - dz * sinY;
  const rz = dx * sinY + dz * cosY;
  const normX = Math.max(-0.8, Math.min(0.8, rx / maxRadarDist));
  const normZ = Math.max(-0.8, Math.min(0.8, rz / maxRadarDist));
  enemyDot.style.left = `${50 + normX * 40}%`;
  enemyDot.style.top = `${50 + normZ * 40}%`;
} else {
  enemyDot.style.display = 'none';
}

if (threatLabel) {
  if (activeBoss && activeBoss.active) {
    threatLabel.textContent = 'ALERTA: JEFE';
    threatLabel.style.color = '#ff6b6b';
  } else if (minDist < 8) {
    threatLabel.textContent = 'PROXIMIDAD CRÍTICA';
    threatLabel.style.color = '#f0c954';
  } else {
    threatLabel.textContent = `HOSTILES: ${activeEnemies.length}`;
    threatLabel.style.color = '#a8c499';
  }
}
}
