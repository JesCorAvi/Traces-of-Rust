// Billboards 2D: UV por frame, selección de dirección y sprite con glow/sombra.
// Exports: setPlaneFrameUV, selectDirectionIndex, createBillboardSprite.

import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { SpriteSheets } from '../spritesheets.js';

export function setPlaneFrameUV(geometry, totalCols, totalRows, col, row) {
  const uv = geometry.attributes.uv;
  const u0 = col / totalCols;
  const u1 = (col + 1) / totalCols;
  const v1 = 1 - row / totalRows;
  const v0 = 1 - (row + 1) / totalRows;

  uv.setXY(0, u0, v1);
  uv.setXY(1, u1, v1);
  uv.setXY(2, u0, v0);
  uv.setXY(3, u1, v0);
  uv.needsUpdate = true;
}

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
