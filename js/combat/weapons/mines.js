// Minas de metralla: colocación y temporizadores de detonación.
// Exports: spawnShrapnelMine.

import * as THREE from 'three';
import { CONFIG } from '../../config.js';
import { AudioSys } from '../../audio.js';
import { SHARED_GEO, SHARED_MAT } from '../shared.js';

// 4. MINAS DE METRALLA
export function spawnShrapnelMine(scene, playerPos, level, mods, worldPhysics, minesList) {
  const cfg = CONFIG.SKILLS.mines;
  const count = 1 + (cfg.usesMultishot ? (mods.bonusProjectiles || 0) : 0);
  AudioSys.playMinePlace();

  for (let i = 0; i < count; i++) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(SHARED_GEO.mineBody, SHARED_MAT.mineBody);
    body.position.y = 0.09;
    const led = new THREE.Mesh(SHARED_GEO.mineLed, SHARED_MAT.mineLed);
    led.position.y = 0.2;
    group.add(body, led);

    const ang = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const dist = i === 0 ? 0 : 1.4 + Math.random() * 0.8;
    const mx = playerPos.x + Math.cos(ang) * dist;
    const mz = playerPos.z + Math.sin(ang) * dist;
    const my = worldPhysics ? worldPhysics.getGroundHeight(mx, mz, playerPos.y) : playerPos.y;

    group.position.set(mx, my, mz);
    scene.add(group);
    minesList.push({ group, led, level, armTimer: 0.45, life: 14.0 });
  }
}
