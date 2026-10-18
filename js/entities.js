import * as THREE from 'three';
import { CONFIG } from './config.js';
import { SpriteSheets } from './spritesheets.js';
import { AudioSys } from './audio.js';

// Actualiza las coordenadas UV de los 4 vértices de un PlaneGeometry para mostrar la celda (col, row)
// sin necesidad de clonar texturas (tex.clone()) ni saturar la VRAM
export function setPlaneFrameUV(geometry, totalCols, totalRows, col, row) {
  const uv = geometry.attributes.uv;
  const u0 = col / totalCols;
  const u1 = (col + 1) / totalCols;
  const v1 = 1 - row / totalRows;
  const v0 = 1 - (row + 1) / totalRows;

  // Orden de vértices en THREE.PlaneGeometry: 0:TL, 1:TR, 2:BL, 3:BR
  uv.setXY(0, u0, v1);
  uv.setXY(1, u1, v1);
  uv.setXY(2, u0, v0);
  uv.setXY(3, u1, v0);
  uv.needsUpdate = true;
}

// Calcula qué sector direccional (0 .. numDirs-1) debe mostrarse según hacia dónde mira la entidad
export function selectDirectionIndex(entityPos, entityFacingYaw, camPos, currentDir, numDirs = 8) {
  if (numDirs <= 1) return 0;

  const dx = camPos.x - entityPos.x;
  const dz = camPos.z - entityPos.z;

  const backX = Math.sin(entityFacingYaw);
  const backZ = Math.cos(entityFacingYaw);
  const rightX = Math.cos(entityFacingYaw);
  const rightZ = -Math.sin(entityFacingYaw);

  const cosA = dx * backX + dz * backZ;
  const sinA = dx * rightX + dz * rightZ;

  let deg = Math.atan2(sinA, cosA) * (180 / Math.PI);
  if (deg < 0) deg += 360;

  const sectorSize = 360 / numDirs;
  const halfSector = sectorSize * 0.5;
  const hysteresis = CONFIG.DIRECTIONAL.HYSTERESIS_DEG;

  if (currentDir >= 0 && currentDir < numDirs) {
    const centerDeg = currentDir * sectorSize;
    let diff = Math.abs(deg - centerDeg);
    if (diff > 180) diff = 360 - diff;
    if (diff <= halfSector + hysteresis) {
      return currentDir;
    }
  }

  return Math.floor(((deg + halfSector) % 360) / sectorSize);
}

const SHARED_SHADOW_GEO = new THREE.CircleGeometry(0.64, 10);
const SHARED_SHADOW_MAT = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.58 });

// Componente Billboard Direccional Optimizado: Comparte la textura original del Atlas sin clonarla
export function createBillboardSprite(sheetKey, size = 2.0) {
  const group = new THREE.Group();

  function getSheetInfo(key) {
    const s = SpriteSheets[key] || SpriteSheets.zombie;
    if (s.tex) {
      s.tex.repeat.set(1, 1);
      s.tex.offset.set(0, 0);
    }
    if (s.glowTex) {
      s.glowTex.repeat.set(1, 1);
      s.glowTex.offset.set(0, 0);
    }
    return {
      tex: s.tex,
      glowTex: s.glowTex,
      cols: s.cols || 16,
      rows: s.rows || 1,
      numDirs: s.numDirs || 1
    };
  }

  const initial = getSheetInfo(sheetKey);
  const geo = new THREE.PlaneGeometry(size, size);
  setPlaneFrameUV(geo, initial.cols, initial.rows, 0, 0);

  const mat = new THREE.MeshStandardMaterial({
    map: initial.tex,
    alphaTest: 0.5,
    transparent: true,
    roughness: 0.88,
    side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = size * 0.5;
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const glowMat = new THREE.MeshBasicMaterial({
    map: initial.glowTex,
    alphaTest: 0.5,
    transparent: true,
    side: THREE.DoubleSide
  });
  const glowMesh = new THREE.Mesh(geo, glowMat);
  glowMesh.position.y = size * 0.5;

  const shadowDisc = new THREE.Mesh(SHARED_SHADOW_GEO, SHARED_SHADOW_MAT);
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.02;
  const initScale = size / 2.0;
  shadowDisc.scale.set(initScale, initScale, 1);

  group.add(mesh, glowMesh, shadowDisc);

  return {
    group,
    geo,
    mesh,
    glowMesh,
    shadowDisc,
    tex: initial.tex,
    glowTex: initial.glowTex,
    cols: initial.cols,
    rows: initial.rows,
    numDirs: initial.numDirs,
    currentKey: sheetKey,
    dirRow: 0,
    stateIdx: 0,
    col: 0,
    lastTotalCol: -1,
    lastDirRow: -1,
    facingYaw: 0,
    animTimer: Math.random(),

    changeSheet(newKey, newSize = 2.0) {
      if (this.currentKey !== newKey) {
        const info = getSheetInfo(newKey);
        this.currentKey = newKey;
        this.tex = info.tex;
        this.glowTex = info.glowTex;
        this.cols = info.cols;
        this.rows = info.rows;
        this.numDirs = info.numDirs;
        this.lastTotalCol = -1;
        this.lastDirRow = -1;

        this.mesh.material.map = this.tex;
        this.glowMesh.material.map = this.glowTex;
      }

      const scaleRatio = newSize / 2.0;
      this.mesh.scale.set(scaleRatio, scaleRatio, 1);
      this.glowMesh.scale.set(scaleRatio, scaleRatio, 1);
      this.mesh.position.y = newSize * 0.5;
      this.glowMesh.position.y = newSize * 0.5;
      this.shadowDisc.scale.set(scaleRatio, scaleRatio, 1);
    },

    setDirectionalFrame(dirRow, stateIdx, frameInState) {
      this.dirRow = Math.max(0, Math.min(this.rows - 1, dirRow));
      this.stateIdx = stateIdx;
      this.col = frameInState % 4;

      const totalCol = this.stateIdx * 4 + this.col;
      if (totalCol === this.lastTotalCol && this.dirRow === this.lastDirRow) return;
      this.lastTotalCol = totalCol;
      this.lastDirRow = this.dirRow;

      setPlaneFrameUV(this.geo, this.cols, this.rows, totalCol, this.dirRow);
    },

    faceCamera(camPos) {
      const angle = Math.atan2(camPos.x - this.group.position.x, camPos.z - this.group.position.z);
      this.mesh.rotation.y = angle;
      this.glowMesh.rotation.y = angle;
      this.dirRow = selectDirectionIndex(this.group.position, this.facingYaw, camPos, this.dirRow, this.numDirs);
    }
  };
}

export class Enemy {
  constructor(scene) {
    this.scene = scene;
    this.billboard = createBillboardSprite('zombie', 2.0);
    this.group = this.billboard.group;
    this.active = false;
    this.isBoss = false;
    this.group.visible = false;
    scene.add(this.group);
  }

  init(type, playerPos, gameTime, playerFwd, worldPhysics, bossCfg = null) {
    this.type = type;
    this.active = true;
    this.group.visible = true;
    this.isBoss = !!bossCfg;
    this.bossData = bossCfg;
    this.phase = 1;

    const mins = gameTime / 60;
    let hpScale = 1 + mins * CONFIG.DIFFICULTY.HP_SCALE_PER_MIN;
    let dmgScale = 1 + mins * CONFIG.DIFFICULTY.DMG_SCALE_PER_MIN;
    let spdBoost = 1;

    if (gameTime > CONFIG.DIFFICULTY.ENDGAME_START_TIME) {
      const overSec = gameTime - CONFIG.DIFFICULTY.ENDGAME_START_TIME;
      const expMult = Math.pow(CONFIG.DIFFICULTY.ENDGAME_EXP_BASE, overSec);
      hpScale *= expMult;
      dmgScale *= Math.min(8, expMult);
      spdBoost = Math.min(1.85, 1 + overSec * 0.012);
    }

    if (this.isBoss) {
      // Escalado de vida para que los Bosses aguanten el DPS de las armas mejoradas y se aprecie su barra
      this.hp = Math.round(bossCfg.hp * (1.35 + mins * 0.18));
      this.maxHp = this.hp;
      this.dmg = bossCfg.dmg;
      this.speed = bossCfg.speed;
      this.billboard.changeSheet(bossCfg.id, bossCfg.size);
      this.specialTimer = 3.2;
      this.chargeVec = null;
      this.chargeTime = 0;
    } else {
      const size = type === 'weeper' ? 2.5 : 2.0;
      this.hp = (type === 'weeper' ? 52 : type === 'worm' ? 36 : 22) * hpScale;
      this.maxHp = this.hp;
      this.dmg = (type === 'weeper' ? 20 : 13) * dmgScale;
      this.speed = (type === 'weeper' ? 7.5 : 4.6) * spdBoost;
      this.billboard.changeSheet(type, size);
      this.chargeVec = null;
      this.chargeTime = 0;
    }

    this.state = 'walk';
    this.stateTimer = 0;
    this.stepAccum = 0;
    this.attackCharge = 0;
    this.hasTriggeredScare = false;
    this.burnTimer = 0;
    this.burnDps = 0;
    this.slowTimer = 0;
    this.steerDir = Math.random() < 0.5 ? 1 : -1;
    this.billboard.mesh.material.emissive.setHex(0x000000);

    let ang;
    if (type === 'weeper' || this.isBoss) {
      const baseAng = Math.atan2(playerFwd.x, playerFwd.z);
      ang = baseAng + (Math.random() - 0.5) * 1.2;
    } else {
      ang = Math.random() * Math.PI * 2;
    }

    const dist = this.isBoss ? 20 : (24 + Math.random() * 12);
    const sx = playerPos.x + Math.sin(ang) * dist;
    const sz = playerPos.z + Math.cos(ang) * dist;
    const sy = worldPhysics ? worldPhysics.getGroundHeight(sx, sz, 2.0) : 0;
    this.group.position.set(sx, sy, sz);
    this.billboard.setDirectionalFrame(0, 1, 0);
  }

  update(dt, playerPos, playerFwd, camPos, worldPhysics, callbacks) {
    if (!this.active) return false;
    this.billboard.faceCamera(camPos);

    if (this.state === 'dead') {
      this.stateTimer += dt;
      const frame = Math.min(3, Math.floor(this.stateTimer * 8));
      this.billboard.setDirectionalFrame(this.billboard.dirRow, 3, frame);
      return this.stateTimer > 0.5;
    }

    if (this.burnTimer > 0) {
      this.burnTimer -= dt;
      this.billboard.mesh.material.emissive.setHex(0x662200);
      if (callbacks.onBurnTick) callbacks.onBurnTick(this, this.burnDps * dt);
      if (this.state === 'dead') return false;
    } else if (this.isBoss && this.phase === 2) {
      this.billboard.mesh.material.emissive.setHex(0x440808);
    } else {
      this.billboard.mesh.material.emissive.setHex(0x000000);
    }

    if (this.isBoss && this.phase === 1 && this.hp <= this.maxHp * 0.5) {
      this.phase = 2;
      this.speed *= 1.28;
      AudioSys.playBossHorn();
      if (callbacks.onBossPhaseChange) callbacks.onBossPhaseChange(this);
    }

    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.group.position);
    const horizDist = Math.hypot(toPlayer.x, toPlayer.z);
    const heightDiff = Math.abs(playerPos.y - this.group.position.y);

    if (!this.isBoss && horizDist > 48) {
      const ang = Math.random() * Math.PI * 2;
      this.group.position.x = playerPos.x + Math.sin(ang) * 27;
      this.group.position.z = playerPos.z + Math.cos(ang) * 27;
      return false;
    }

    if (this.isBoss) {
      if (this.chargeTime > 0) {
        this.chargeTime -= dt;
        this.billboard.facingYaw = Math.atan2(-this.chargeVec.x, -this.chargeVec.z);
        this.group.position.addScaledVector(this.chargeVec, 18.5 * dt);
        if (worldPhysics) {
          worldPhysics.resolveCollision(this.group.position, 0.85, this.group.position.y);
          this.group.position.y = worldPhysics.getGroundHeight(this.group.position.x, this.group.position.z, this.group.position.y);
        }
        if (horizDist < 2.1 && heightDiff < 1.8 && callbacks.onDealDamage) callbacks.onDealDamage(this);
        return false;
      }

      this.specialTimer -= dt * (this.phase === 2 ? 1.45 : 1.0);
      if (this.specialTimer <= 0) {
        this.specialTimer = 3.6;
        const atkList = this.bossData.attacks;
        const chosen = atkList[Math.floor(Math.random() * atkList.length)];
        if (callbacks.onBossSpecial) callbacks.onBossSpecial(this, chosen);
      }
    }

    let moveSpd = this.speed;
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      moveSpd *= 0.6;
    }

    let targetState = 1; // WALK

    if (this.type === 'weeper') {
      const dirToEnemy = toPlayer.clone().negate().normalize();
      const watched = playerFwd.angleTo(dirToEnemy) < 0.95 && horizDist < 26;
      if (watched) {
        moveSpd = 0;
        targetState = 0; // IDLE
        this.attackCharge = 0;
      } else if (!this.hasTriggeredScare && horizDist < 13 && horizDist > 8) {
        this.hasTriggeredScare = true;
        this.group.position.add(toPlayer.clone().setY(0).normalize().multiplyScalar(1.1));
        if (callbacks.onScare) callbacks.onScare();
      }
    }

    if (this.state === 'hurt') {
      this.stateTimer -= dt;
      moveSpd *= this.isBoss ? 0.75 : 0.2;
      targetState = 3; // HURT
      if (this.stateTimer <= 0) this.state = 'walk';
    }

    const hitReach = this.isBoss ? 2.2 : 1.65;
    if (horizDist < hitReach && heightDiff < 1.6 && moveSpd > 0 && this.state !== 'hurt') {
      targetState = 2; // ATTACK
      moveSpd *= 0.25;
      this.attackCharge += dt;
      if (this.attackCharge >= 0.35) {
        this.attackCharge = -0.55;
        if (horizDist < hitReach + 0.15 && heightDiff < 1.7 && callbacks.onDealDamage) {
          callbacks.onDealDamage(this);
        }
      }
    } else {
      this.attackCharge = Math.max(0, this.attackCharge - dt * 2);
    }

    const isFar = !this.isBoss && horizDist > CONFIG.DIFFICULTY.AI_LOD_DIST;
    const tickRate = isFar ? 0.18 : (this.type === 'weeper' ? 0.06 : 0.085);

    this.stepAccum += dt;
    if (this.stepAccum >= tickRate) {
      const stepDt = this.stepAccum;
      this.stepAccum = 0;

      if (moveSpd > 0 && horizDist > 1.1) {
        const dir = new THREE.Vector3(toPlayer.x, 0, toPlayer.z).normalize();
        this.billboard.facingYaw = Math.atan2(-dir.x, -dir.z);
        const prevX = this.group.position.x, prevZ = this.group.position.z;
        this.group.position.addScaledVector(dir, moveSpd * stepDt);

        if (worldPhysics && !isFar) {
          worldPhysics.resolveCollision(this.group.position, this.isBoss ? 0.8 : 0.55, this.group.position.y);
          const moved = Math.hypot(this.group.position.x - prevX, this.group.position.z - prevZ);
          if (moved < moveSpd * stepDt * 0.35) {
            const tangent = new THREE.Vector3(-dir.z * this.steerDir, 0, dir.x * this.steerDir);
            this.billboard.facingYaw = Math.atan2(-tangent.x, -tangent.z);
            this.group.position.addScaledVector(tangent, moveSpd * stepDt * 0.9);
            worldPhysics.resolveCollision(this.group.position, 0.55, this.group.position.y);
          }
          const targetY = worldPhysics.getGroundHeight(this.group.position.x, this.group.position.z, this.group.position.y);
          this.group.position.y += (targetY - this.group.position.y) * 0.45;
        }
      }

      this.billboard.animTimer += stepDt * (targetState === 2 ? 10 : 6);
      const col = Math.floor(this.billboard.animTimer) % 4;
      this.billboard.setDirectionalFrame(this.billboard.dirRow, targetState, col);
    }

    return false;
  }
}

export class EnemyPool {
  constructor(scene, maxCount = CONFIG.DIFFICULTY.MAX_ACTIVE_ENEMIES) {
    this.pool = [];
    this.active = [];
    for (let i = 0; i < maxCount; i++) {
      this.pool.push(new Enemy(scene));
    }
  }

  spawn(type, playerPos, gameTime, playerFwd, worldPhysics, bossCfg = null) {
    let enemy = this.pool.pop();
    if (!enemy) {
      if (bossCfg) {
        const idx = this.active.findIndex(e => !e.isBoss);
        if (idx !== -1) {
          enemy = this.active.splice(idx, 1)[0];
        }
      }
      if (!enemy) return null;
    }
    enemy.init(type, playerPos, gameTime, playerFwd, worldPhysics, bossCfg);
    this.active.push(enemy);
    return enemy;
  }

  release(index) {
    const enemy = this.active[index];
    enemy.active = false;
    enemy.group.visible = false;
    this.active.splice(index, 1);
    this.pool.push(enemy);
  }

  clearAll() {
    while (this.active.length > 0) {
      this.release(this.active.length - 1);
    }
  }
}