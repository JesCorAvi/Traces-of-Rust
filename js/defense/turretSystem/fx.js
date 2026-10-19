// VFX y hazards de torretas: trazadoras, explosiones, pulsos, chispas, conchas y napalm.
// Exports: updateFx, updateHazards, spawnTracer, spawnExplosion, spawnPulse, spawnSparks, spawnShell, spawnNapalm, removeFx.

import * as THREE from 'three';
import { SHARED_GEO, SHARED_MAT } from '../../combat.js';

export function updateFx(system, dt) {
for (let i = system.fx.length - 1; i >= 0; i--) {
  const item = system.fx[i];
  item.life -= dt;

  if (item.type === 'shell') {
    item.t += dt / item.duration;
    const t = Math.min(1, item.t);
    item.mesh.position.lerpVectors(item.start, item.end, t);
    item.mesh.position.y += Math.sin(t * Math.PI) * item.arcHeight;
    if (item.t >= 1) {
      if (item.onImpact) item.onImpact();
      removeFx(system, i, item);
    }
    continue;
  }

  if (item.type === 'spark') {
    item.mesh.position.addScaledVector(item.vel, dt);
    item.vel.y -= (item.gravity || 12) * dt;
    const k = Math.max(0, item.life / item.maxLife);
    item.mesh.scale.setScalar(item.baseScale * (0.4 + k * 0.6));
    continue;
  }

  if (item.type === 'ring') {
    const k = Math.max(0, item.life / item.maxLife);
    const progress = 1 - k;
    item.mesh.scale.setScalar(0.25 + progress * 0.75);
    if (item.mat) item.mat.opacity = item.baseOpacity * k;
  }

  if (item.type === 'tracer') {
    const k = Math.max(0, item.life / item.maxLife);
    if (item.mat) item.mat.opacity = item.baseOpacity * k;
  }

  if (item.life <= 0) {
    removeFx(system, i, item);
  }
}
}

export function updateHazards(system, dt, ctx) {
for (let i = system.hazards.length - 1; i >= 0; i--) {
  const h = system.hazards[i];
  h.life -= dt;
  h.tick -= dt;

  if (h.tick <= 0) {
    h.tick = 0.5;
    const enemies = ctx.enemyPool.active;
    for (let e = 0; e < enemies.length; e++) {
      const enemy = enemies[e];
      if (!enemy.active || enemy.state === 'dead') continue;
      if (system.inRadius(h.pos, enemy.group.position, h.radius)) {
        enemy.applyBurn(h.dps, 0.75);
      }
    }
  }

  if (h.mat) h.mat.opacity = Math.max(0, 0.3 * (h.life / h.duration));

  if (h.life <= 0) {
    system.scene.remove(h.mesh);
    h.mesh.geometry.dispose();
    h.mat.dispose();
    system.hazards.splice(i, 1);
  }
}
}

export function spawnTracer(system, from, to, color, life = 0.06) {
const geo = new THREE.BufferGeometry().setFromPoints([from.clone(), to.clone()]);
const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 });
const line = new THREE.Line(geo, mat);
system.scene.add(line);
system.fx.push({ type: 'tracer', mesh: line, mat, life, maxLife: life, baseOpacity: 0.85 });
}

export function spawnExplosion(system, pos, radius, color) {
const ringGeo = new THREE.RingGeometry(radius * 0.25, radius, 20);
const mat = new THREE.MeshBasicMaterial({
  color, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false
});
const ring = new THREE.Mesh(ringGeo, mat);
ring.rotation.x = -Math.PI / 2;
ring.position.copy(pos);
ring.position.y = (pos.y || 0) + 0.06;
system.scene.add(ring);
system.fx.push({ type: 'ring', mesh: ring, mat, life: 0.32, maxLife: 0.32, baseOpacity: 0.5 });
system.spawnSparks(pos.clone().add(new THREE.Vector3(0, 0.4, 0)), color);
}

export function spawnPulse(system, pos, radius, color) {
const ringGeo = new THREE.RingGeometry(radius * 0.2, radius, 24);
const mat = new THREE.MeshBasicMaterial({
  color, transparent: true, opacity: 0.42, side: THREE.DoubleSide, depthWrite: false
});
const ring = new THREE.Mesh(ringGeo, mat);
ring.rotation.x = -Math.PI / 2;
ring.position.copy(pos);
ring.position.y = (pos.y || 0) + 0.07;
system.scene.add(ring);
system.fx.push({ type: 'ring', mesh: ring, mat, life: 0.55, maxLife: 0.55, baseOpacity: 0.42 });
}

export function spawnSparks(system, pos, color) {
const mats = [SHARED_MAT.sparkGold, SHARED_MAT.sparkBlood];
for (let i = 0; i < 4; i++) {
  const mesh = new THREE.Mesh(SHARED_GEO.spark, mats[i % mats.length]);
  mesh.position.copy(pos);
  const scale = 0.7 + Math.random() * 0.7;
  mesh.scale.setScalar(scale);
  system.scene.add(mesh);
  system.fx.push({
    type: 'spark',
    mesh,
    life: 0.3 + Math.random() * 0.25,
    maxLife: 0.55,
    baseScale: scale,
    vel: new THREE.Vector3(
      (Math.random() - 0.5) * 6,
      2 + Math.random() * 4,
      (Math.random() - 0.5) * 6
    ),
    gravity: 14,
    shared: true
  });
}
}

export function spawnShell(system, from, to, duration, arcHeight, onImpact) {
const mesh = new THREE.Mesh(SHARED_GEO.spark, SHARED_MAT.sparkGold);
mesh.scale.setScalar(1.1);
mesh.position.copy(from);
system.scene.add(mesh);
system.fx.push({
  type: 'shell',
  mesh,
  start: from.clone(),
  end: to.clone(),
  t: 0,
  duration: Math.max(0.15, duration),
  arcHeight,
  onImpact,
  shared: true,
  life: 10,
  maxLife: 10
});
}

export function spawnNapalm(system, pos, radius, dps, duration) {
if (radius <= 0 || dps <= 0 || duration <= 0) return;
const geo = new THREE.CircleGeometry(radius, 20);
const mat = new THREE.MeshBasicMaterial({
  color: 0xa54a2a, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false
});
const mesh = new THREE.Mesh(geo, mat);
mesh.rotation.x = -Math.PI / 2;
mesh.position.copy(pos);
mesh.position.y = (pos.y || 0) + 0.045;
system.scene.add(mesh);

system.hazards.push({
  pos: pos.clone(),
  radius,
  dps,
  duration,
  life: duration,
  tick: 0,
  mesh,
  mat
});
}

export function removeFx(system, index, item) {
  system.scene.remove(item.mesh);
  if (!item.shared) {
    if (item.mesh.geometry) item.mesh.geometry.dispose();
    if (item.mat) item.mat.dispose();
    else if (item.mesh.material) item.mesh.material.dispose();
  }
  system.fx.splice(index, 1);
}
