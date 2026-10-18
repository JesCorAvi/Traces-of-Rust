import * as THREE from 'three';
import { CONFIG } from './config.js';
import { SpriteSheets } from './spritesheets.js';
import { AudioSys } from './audio.js';
import { setPlaneFrameUV } from './entities.js';

// Geometrías y materiales compartidos en VRAM para evitar crear objetos o clonar texturas en combate
export const SHARED_GEO = {
  spark: new THREE.BoxGeometry(0.18, 0.18, 0.18),
  shell: new THREE.BoxGeometry(0.1, 0.22, 0.1),
  flame: new THREE.PlaneGeometry(0.55, 0.55),
  muzzleFlash: new THREE.PlaneGeometry(1.2, 1.2),
  mineBody: new THREE.CylinderGeometry(0.38, 0.45, 0.18, 8),
  mineLed: new THREE.BoxGeometry(0.14, 0.14, 0.14),
  orbitalPlane: new THREE.PlaneGeometry(1.35, 1.35),
  bossProj: new THREE.BoxGeometry(0.42, 0.42, 0.42)
};

export const SHARED_MAT = {
  sparkBlood: new THREE.MeshBasicMaterial({ color: 0xa52020 }),
  sparkGold:  new THREE.MeshBasicMaterial({ color: 0xffe699 }),
  shellRed:   new THREE.MeshBasicMaterial({ color: 0xa52020 }),
  mineBody:   new THREE.MeshStandardMaterial({ color: 0x3b2316, roughness: 0.85 }),
  mineLed:    new THREE.MeshBasicMaterial({ color: 0xff2222 }),
  slashMat:   null,
  orbitalMat: null
};

let combatFlashLight = null;
let combatFlashTimer = 0;

export function initCombatLight(scene) {
  if (!combatFlashLight) {
    combatFlashLight = new THREE.PointLight(0xffaa33, 0, 12, 1.5);
    scene.add(combatFlashLight);
  }
  if (!SHARED_MAT.slashMat && SpriteSheets.env && SpriteSheets.env.slash) {
    SHARED_MAT.slashMat = new THREE.MeshBasicMaterial({
      map: SpriteSheets.env.slash.tex,
      transparent: true,
      alphaTest: 0.15,
      side: THREE.DoubleSide
    });
  }
  if (!SHARED_MAT.orbitalMat && SpriteSheets.env && SpriteSheets.env.orbital) {
    SHARED_MAT.orbitalMat = new THREE.MeshBasicMaterial({
      map: SpriteSheets.env.orbital.tex,
      transparent: true,
      alphaTest: 0.2,
      side: THREE.DoubleSide
    });
  }
}

export function triggerCombatFlash(pos, colorHex, intensity, duration = 0.09) {
  if (!combatFlashLight) return;
  combatFlashLight.position.copy(pos);
  combatFlashLight.color.setHex(colorHex);
  combatFlashLight.intensity = intensity;
  combatFlashTimer = duration;
}

export function updateCombatLight(dt) {
  if (!combatFlashLight || combatFlashTimer <= 0) return;
  combatFlashTimer -= dt;
  if (combatFlashTimer <= 0) {
    combatFlashLight.intensity = 0;
  }
}

function getWeaponScaling(id, level) {
  const cfg = CONFIG.SKILLS[id];
  const mult = 1 + (level - 1) * cfg.scalePerLvl;
  return { cfg, mult };
}

export function getDirectionalHandPos(playerPos, facingYaw, forwardDist = 0.85, rightOffset = 0.36, heightOffset = 1.08) {
  const fwd = new THREE.Vector3(-Math.sin(facingYaw), 0, -Math.cos(facingYaw));
  const right = new THREE.Vector3(Math.cos(facingYaw), 0, -Math.sin(facingYaw));
  return playerPos.clone()
    .addScaledVector(fwd, forwardDist)
    .addScaledVector(right, rightOffset)
    .add(new THREE.Vector3(0, heightOffset, 0));
}

// 1. SIERRA DE AMPUTACIÓN (Usa UVs directas en vez de clonar la textura en cada tajo)
export function executeSawSlash(scene, playerPos, facingYaw, level, mods, enemies, vfx, onDamage, onMicroShake, bodyYaw = facingYaw) {
  const { cfg, mult } = getWeaponScaling('slash', level);
  const size = (3.1 + level * 0.3) * mods.areaMult;
  const dmg = cfg.baseDmg * mult * mods.dmgMult;
  const range = (cfg.baseRange + level * 0.28) * mods.areaMult;

  AudioSys.play(195, 0.13, 'sawtooth', 0.06);
  AudioSys.play(90, 0.09, 'square', 0.04);
  if (onMicroShake) onMicroShake(0.09);

  const handOrigin = getDirectionalHandPos(playerPos, bodyYaw, 0.5, 0.32, 1.05);
  const fwd = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), facingYaw);

  const slashPos = handOrigin.clone().add(fwd.clone().multiplyScalar(1.35 * mods.areaMult));
  triggerCombatFlash(slashPos, 0xd95326, 85, 0.12);

  const geo = new THREE.PlaneGeometry(size, size * 0.75);
  setPlaneFrameUV(geo, 4, 1, 0, 0);

  const mesh = new THREE.Mesh(geo, SHARED_MAT.slashMat);
  mesh.position.copy(slashPos);
  scene.add(mesh);

  vfx.push({
    mesh,
    disposeGeo: true,
    life: 0.2,
    maxLife: 0.2,
    billboard: true,
    uvTotalFrames: 4
  });

  enemies.forEach(e => {
    if (e.state === 'dead') return;
    const toE = new THREE.Vector3().subVectors(e.group.position, playerPos);
    if (Math.abs(toE.y) < 2.2 && toE.length() < range && fwd.angleTo(toE.clone().setY(0).normalize()) < 1.15) {
      onDamage(e, dmg, toE.clone().setY(0).normalize().multiplyScalar(1.65));

      for (let p = 0; p < 3; p++) {
        const spark = new THREE.Mesh(
          SHARED_GEO.spark,
          p % 2 === 0 ? SHARED_MAT.sparkBlood : SHARED_MAT.sparkGold
        );
        spark.position.copy(e.group.position).add(new THREE.Vector3(0, 1.0, 0));
        scene.add(spark);
        vfx.push({
          mesh: spark,
          life: 0.24,
          vel: new THREE.Vector3((Math.random() - 0.5) * 6, 2.5 + Math.random() * 3, (Math.random() - 0.5) * 6),
          gravity: 16,
          floorY: playerPos.y + 0.05
        });
      }
    }
  });

  return facingYaw;
}

export function createOrbitalUnit(scene, angle) {
  const group = new THREE.Group();
  const geo = new THREE.PlaneGeometry(1.35, 1.35);
  setPlaneFrameUV(geo, 4, 1, 0, 0);

  const sprite = new THREE.Mesh(geo, SHARED_MAT.orbitalMat);
  group.add(sprite);
  scene.add(group);

  return { group, sprite, geo, angle, animTimer: Math.random(), trailTimer: 0, hitCd: 0 };
}

// 2. ESCOPETA CALIBRE 12
export function fireBuckshot(scene, playerPos, aimYaw, bodyYaw, level, mods, enemies, vfx, onDamage, triggerFlash) {
  const alive = enemies.filter(e => e.state !== 'dead');
  if (!alive.length) return null;

  const { cfg, mult } = getWeaponScaling('shotgun', level);
  const maxRange = cfg.baseRange * mods.areaMult;
  const closest = alive.reduce((a, b) =>
    a.group.position.distanceTo(playerPos) < b.group.position.distanceTo(playerPos) ? a : b
  );
  if (closest.group.position.distanceTo(playerPos) > maxRange) return null;

  AudioSys.play(75, 0.24, 'sawtooth', 0.1);
  AudioSys.play(260, 0.09, 'square', 0.06);
  if (triggerFlash) triggerFlash();

  const baseDir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), aimYaw);
  const rightDir = new THREE.Vector3(-baseDir.z, 0, baseDir.x);
  const muzzlePos = getDirectionalHandPos(playerPos, bodyYaw, 0.95, 0.38, 1.12);

  triggerCombatFlash(muzzlePos, 0xffaa33, 150, 0.08);

  const flashSprite = new THREE.Mesh(
    SHARED_GEO.muzzleFlash,
    new THREE.MeshBasicMaterial({ color: 0xffe699, transparent: true, opacity: 0.95, side: THREE.DoubleSide })
  );
  flashSprite.position.copy(muzzlePos);
  scene.add(flashSprite);
  vfx.push({ mesh: flashSprite, disposeMat: true, life: 0.08, maxLife: 0.08, billboard: true, scaleSpeed: 6 });

  const shell = new THREE.Mesh(SHARED_GEO.shell, SHARED_MAT.shellRed);
  shell.position.copy(muzzlePos);
  scene.add(shell);
  vfx.push({
    mesh: shell,
    life: 1.0,
    vel: rightDir.clone().multiplyScalar(3.5 + Math.random()).add(new THREE.Vector3(0, 4.0, 0)),
    gravity: 16,
    floorY: playerPos.y + 0.05,
    spin: { x: 18, z: 14 }
  });

  const bonusProj = cfg.usesMultishot ? (mods.bonusProjectiles || 0) : 0;
  const pelletCount = 7 + level * 2 + bonusProj * 3;
  const spreadArc = (0.48 + level * 0.03 + bonusProj * 0.06) * mods.areaMult;
  const dmgPerPellet = cfg.baseDmg * mult * mods.dmgMult;

  for (let i = 0; i < pelletCount; i++) {
    const t = pelletCount > 1 ? (i / (pelletCount - 1)) - 0.5 : 0;
    const yawOffset = t * spreadArc + (Math.random() - 0.5) * 0.06;
    const pelletDir = baseDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), yawOffset).normalize();

    let hitEnemy = null;
    let hitDist = maxRange * (0.85 + Math.random() * 0.2);

    alive.forEach(e => {
      const toE = new THREE.Vector3().subVectors(e.group.position, muzzlePos);
      if (Math.abs(toE.y) > 2.2) return;
      toE.y = 0;
      const forwardDist = toE.dot(pelletDir);
      if (forwardDist > 0.4 && forwardDist < hitDist) {
        const perpDist = toE.clone().sub(pelletDir.clone().multiplyScalar(forwardDist)).length();
        if (perpDist < 0.95) {
          hitDist = forwardDist;
          hitEnemy = e;
        }
      }
    });

    const endPos = muzzlePos.clone().add(pelletDir.clone().multiplyScalar(hitDist));
    const tracer = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([muzzlePos.clone(), endPos]),
      new THREE.LineBasicMaterial({ color: i % 2 === 0 ? 0xffe699 : 0xd97724, transparent: true, opacity: 0.85 })
    );
    scene.add(tracer);
    vfx.push({ mesh: tracer, disposeGeo: true, disposeMat: true, life: 0.13, maxLife: 0.13, fade: true });

    if (hitEnemy) {
      onDamage(hitEnemy, dmgPerPellet, pelletDir.clone().multiplyScalar(0.42));
    }
  }
  return aimYaw;
}

// 3. SOPLETE INCINERADOR
export function fireFlamethrower(scene, playerPos, facingYaw, level, mods, enemies, vfx, onDamage, bodyYaw = facingYaw) {
  const { cfg, mult } = getWeaponScaling('flamethrower', level);
  const fwd = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), facingYaw);
  const nozzle = getDirectionalHandPos(playerPos, bodyYaw, 0.92, 0.36, 1.05);
  const range = (cfg.baseRange + level * 0.45) * mods.areaMult;

  if (Math.random() < 0.45) AudioSys.play(110 + Math.random() * 40, 0.08, 'sawtooth', 0.03);

  const particleCount = 3;
  const coneHalfAngle = 0.65 * mods.areaMult;

  for (let i = 0; i < particleCount; i++) {
    const spread = (Math.random() - 0.5) * (coneHalfAngle * 1.4);
    const dir = fwd.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), spread);
    const flame = new THREE.Mesh(
      SHARED_GEO.flame,
      new THREE.MeshBasicMaterial({
        color: Math.random() < 0.5 ? 0xff7711 : 0xffcc33,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide
      })
    );
    flame.position.copy(nozzle);
    scene.add(flame);
    vfx.push({
      mesh: flame,
      disposeMat: true,
      life: 0.24,
      maxLife: 0.24,
      billboard: true,
      fade: true,
      scaleSpeed: 3.5,
      vel: dir.multiplyScalar(range * 3.2).add(new THREE.Vector3(0, 1.1, 0))
    });
  }

  const dmg = cfg.baseDmg * mult * mods.dmgMult;
  enemies.forEach(e => {
    if (e.state === 'dead') return;
    const toE = new THREE.Vector3().subVectors(e.group.position, playerPos);
    if (Math.abs(toE.y) < 2.2 && toE.length() < range && fwd.angleTo(toE.clone().setY(0).normalize()) < coneHalfAngle) {
      onDamage(e, dmg);
      e.burnTimer = 2.5 + level * 0.3;
      e.burnDps = dmg * 1.6;
    }
  });
}

// 4. MINAS DE METRALLA
export function spawnShrapnelMine(scene, playerPos, level, mods, worldPhysics, minesList) {
  const cfg = CONFIG.SKILLS.mines;
  const count = 1 + (cfg.usesMultishot ? (mods.bonusProjectiles || 0) : 0);
  AudioSys.play(420, 0.06, 'sine', 0.04);

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

// 5. ARPÓN NEUMÁTICO
export function fireHarpoon(scene, playerPos, facingYaw, level, mods, enemies, vfx, onDamage, bodyYaw = facingYaw) {
  const alive = enemies.filter(e => e.state !== 'dead');
  const { cfg, mult } = getWeaponScaling('harpoon', level);
  const maxRange = cfg.baseRange * mods.areaMult;
  const count = 1 + (cfg.usesMultishot ? (mods.bonusProjectiles || 0) : 0);

  const baseDir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), facingYaw);

  AudioSys.play(150, 0.18, 'triangle', 0.08);
  const start = getDirectionalHandPos(playerPos, bodyYaw, 0.85, 0.36, 1.08);
  const dmg = cfg.baseDmg * mult * mods.dmgMult;
  const maxPierce = 2 + level;

  for (let h = 0; h < count; h++) {
    const offsetAngle = count === 1 ? 0 : ((h / (count - 1)) - 0.5) * Math.min(0.85, count * 0.18);
    const dir = baseDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), offsetAngle).normalize();
    const end = start.clone().add(dir.clone().multiplyScalar(maxRange));

    const cable = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([start, end]),
      new THREE.LineBasicMaterial({ color: 0xc8c2ac })
    );
    scene.add(cable);
    vfx.push({ mesh: cable, disposeGeo: true, disposeMat: true, life: 0.18, maxLife: 0.18, fade: true });

    let pierced = 0;
    alive.forEach(e => {
      if (pierced >= maxPierce) return;
      const toE = new THREE.Vector3().subVectors(e.group.position, playerPos);
      if (Math.abs(toE.y) > 2.2) return;
      toE.y = 0;
      const fwdDist = toE.dot(dir);
      if (fwdDist > 0 && fwdDist < maxRange) {
        const perp = toE.clone().sub(dir.clone().multiplyScalar(fwdDist)).length();
        if (perp < 1.05 * mods.areaMult) {
          pierced++;
          onDamage(e, dmg, dir.clone().multiplyScalar(2.2));
        }
      }
    });
  }
  return facingYaw;
}

// 6. DESFIBRILADOR ROTO
export function fireDefibrillator(scene, playerPos, facingYaw, level, mods, enemies, vfx, onDamage) {
  const { cfg, mult } = getWeaponScaling('bolt', level);
  const range = cfg.baseRange * mods.areaMult;
  const maxTargets = 2 + level;
  const near = enemies
    .filter(e => e.state !== 'dead' && e.group.position.distanceTo(playerPos) < range)
    .slice(0, maxTargets);
  if (!near.length) return null;

  AudioSys.play(480, 0.14, 'sawtooth', 0.06);
  const pts = [getDirectionalHandPos(playerPos, facingYaw, 0.6, 0.3, 1.1)];
  const dmg = cfg.baseDmg * mult * mods.dmgMult;

  near.forEach(e => {
    pts.push(e.group.position.clone().add(new THREE.Vector3(0, 1.1, 0)));
    onDamage(e, dmg);
  });
  const bolt = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: 0xb89c46 })
  );
  scene.add(bolt);
  vfx.push({ mesh: bolt, disposeGeo: true, disposeMat: true, life: 0.12 });
  return facingYaw;
}

// === ATAQUES ESPECIALES TELEGRAFIADOS DE LOS BOSSES ===
export function triggerBossSpecialAttack(scene, boss, attackType, playerPos, worldPhysics, hazards, projectiles, onSummon) {
  const bPos = boss.group.position.clone();
  const isP2 = boss.phase === 2;
  AudioSys.play(115, 0.35, 'sawtooth', 0.08);

  if (attackType === 'cone_saw') {
    const dir = new THREE.Vector3().subVectors(playerPos, bPos).setY(0).normalize();
    const angle = Math.atan2(dir.x, dir.z);
    const radius = isP2 ? 8.5 : 6.8;
    const geo = new THREE.CircleGeometry(radius, 18, -Math.PI * 0.28, Math.PI * 0.56);
    const mat = new THREE.MeshBasicMaterial({ color: 0xc42020, transparent: true, opacity: 0.45, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = angle - Math.PI / 2;
    mesh.position.set(bPos.x, bPos.y + 0.06, bPos.z);
    scene.add(mesh);

    hazards.push({
      type: 'cone', mesh, origin: bPos.clone(), dir, radius, arc: 0.9,
      timer: isP2 ? 0.75 : 0.95, maxTimer: isP2 ? 0.75 : 0.95, dmg: boss.dmg * 1.25
    });
  } else if (attackType === 'charge') {
    const dir = new THREE.Vector3().subVectors(playerPos, bPos).setY(0).normalize();
    const len = 14;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, len),
      new THREE.MeshBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.z = -Math.atan2(dir.x, dir.z);
    mesh.position.copy(bPos).addScaledVector(dir, len * 0.5).setY(bPos.y + 0.06);
    scene.add(mesh);

    hazards.push({
      type: 'charge_line', mesh, boss, dir,
      timer: 0.75, maxTimer: 0.75, dmg: 0
    });
  } else if (attackType === 'shockwave') {
    const radius = isP2 ? 9.5 : 7.5;
    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(0.4, radius, 24),
      new THREE.MeshBasicMaterial({ color: 0xc42020, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(bPos.x, bPos.y + 0.06, bPos.z);
    scene.add(mesh);

    hazards.push({
      type: 'circle', mesh, center: bPos.clone(), radius,
      timer: isP2 ? 0.85 : 1.05, maxTimer: isP2 ? 0.85 : 1.05, dmg: boss.dmg * 1.3
    });
  } else if (attackType === 'floor_bombs') {
    const count = isP2 ? 6 : 4;
    for (let i = 0; i < count; i++) {
      const offsetX = i === 0 ? 0 : (Math.random() - 0.5) * 11;
      const offsetZ = i === 0 ? 0 : (Math.random() - 0.5) * 11;
      const cx = playerPos.x + offsetX;
      const cz = playerPos.z + offsetZ;
      const cy = worldPhysics ? worldPhysics.getGroundHeight(cx, cz, playerPos.y) : 0;
      const radius = 2.6;

      const mesh = new THREE.Mesh(
        new THREE.CircleGeometry(radius, 18),
        new THREE.MeshBasicMaterial({ color: 0xd9381e, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(cx, cy + 0.07, cz);
      scene.add(mesh);

      hazards.push({
        type: 'circle', mesh, center: new THREE.Vector3(cx, cy, cz), radius,
        timer: 1.05 + i * 0.12, maxTimer: 1.05 + i * 0.12, dmg: boss.dmg * 1.15
      });
    }
  } else if (attackType === 'radial_slag' || attackType === 'spiral_blades') {
    const count = isP2 ? 12 : 8;
    const baseAngle = Math.random() * Math.PI * 2;
    for (let i = 0; i < count; i++) {
      const a = baseAngle + (i / count) * Math.PI * 2;
      const dir = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
      const pMesh = new THREE.Mesh(
        SHARED_GEO.bossProj,
        new THREE.MeshBasicMaterial({ color: attackType === 'spiral_blades' ? 0xe6d7a5 : 0xff6611 })
      );
      pMesh.position.copy(bPos).add(new THREE.Vector3(0, 1.1, 0));
      scene.add(pMesh);
      projectiles.push({
        mesh: pMesh,
        vel: dir.multiplyScalar(isP2 ? 10.5 : 8.2),
        life: 3.2,
        dmg: boss.dmg * 0.85
      });
    }
  } else if (attackType === 'summon') {
    if (onSummon) onSummon(isP2 ? 5 : 3);
  }
}