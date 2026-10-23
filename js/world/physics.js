// Física del mundo: alturas, rampas, cajas, cilindros y colisión.
// Exports: createWorldPhysics.

import { terrainHeightAt } from './terrain.js';

export function createWorldPhysics() {
  const walkableBoxes = [];
  const ramps = [];
  const cylinders = [];
  const dynamicCylinders = new Map();
  // Altura de la superficie de una rampa en un punto (x,z) de su huella
  function getRampSurfaceHeight(r, x, z) {
    const t = r.axis === 'z'
      ? 1 - (z - r.minZ) / (r.maxZ - r.minZ)
      : (x - r.minX) / (r.maxX - r.minX);
    return r.startY + Math.max(0, Math.min(1, t)) * (r.endY - r.startY);
  }
  const worldPhysics = {
    registerDynamicCylinder(id, x, z, r, topY = 6.0) {
      dynamicCylinders.set(id, { x, z, r, topY });
    },

    unregisterDynamicCylinder(id) {
      dynamicCylinders.delete(id);
    },

    isRampAt(x, z) {
      for (const r of ramps) {
        if (x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ) return true;
      }
      return false;
    },

    getTerrainHeight(x, z) {
      return terrainHeightAt(x, z);
    },

    getGroundHeight(x, z, currentY = 0, ignoreStepLimit = false, structuralOnly = false) {
      // La duna es la superficie base del mundo. Cajas, cubiertas y rampas se
      // elevan por encima de ella cuando su cota es superior.
      let h = terrainHeightAt(x, z);
      const stepTolerance = 0.82;

      for (const r of ramps) {
        if (x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ) {
          const rampY = getRampSurfaceHeight(r, x, z) + 0.03;
          // No teletransportar al jugador sobre la rampa si entra por el lateral o por debajo
          if ((ignoreStepLimit || currentY + stepTolerance >= rampY) && rampY > h) h = rampY;
        }
      }

      for (const b of walkableBoxes) {
        if (structuralOnly && b.isObstacle) continue;
        if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) {
          if ((ignoreStepLimit || currentY + stepTolerance >= b.topY) && b.topY + 0.02 > h) {
            h = b.topY + 0.02;
          }
        }
      }
      return h;
    },

    resolveCollision(pos, radius = 0.55, currentY = 0) {
      const stepTolerance = 0.82;
      for (const b of walkableBoxes) {
        if (currentY + stepTolerance >= b.topY) continue;
        const closestX = Math.max(b.minX, Math.min(pos.x, b.maxX));
        const closestZ = Math.max(b.minZ, Math.min(pos.z, b.maxZ));
        const dx = pos.x - closestX;
        const dz = pos.z - closestZ;
        const distSq = dx * dx + dz * dz;
        if (distSq < radius * radius) {
          const dist = Math.sqrt(distSq) || 0.001;
          const overlap = radius - dist;
          pos.x += (dx / dist) * overlap;
          pos.z += (dz / dist) * overlap;
        }
      }
      // Rampas: impiden entrar por el lateral o por debajo cuando la superficie local
      // está más alta que el paso permitido. Sin esto se atravesaba la losa visible.
      for (const r of ramps) {
        const insideX = pos.x >= r.minX && pos.x <= r.maxX;
        const insideZ = pos.z >= r.minZ && pos.z <= r.maxZ;

        if (insideX && insideZ) {
          const rampTop = getRampSurfaceHeight(r, pos.x, pos.z);
          if (currentY + stepTolerance >= rampTop) continue;
          const dl = pos.x - r.minX;
          const dr = r.maxX - pos.x;
          const db = pos.z - r.minZ;
          const df = r.maxZ - pos.z;
          const m = Math.min(dl, dr, db, df);
          const push = radius + 0.01;
          if (m === dl) pos.x = r.minX - push;
          else if (m === dr) pos.x = r.maxX + push;
          else if (m === db) pos.z = r.minZ - push;
          else pos.z = r.maxZ + push;
        } else {
          const closestX = Math.max(r.minX, Math.min(pos.x, r.maxX));
          const closestZ = Math.max(r.minZ, Math.min(pos.z, r.maxZ));
          const dx = pos.x - closestX;
          const dz = pos.z - closestZ;
          const distSq = dx * dx + dz * dz;
          if (distSq >= radius * radius) continue;
          const rampTop = getRampSurfaceHeight(r, closestX, closestZ);
          if (currentY + stepTolerance >= rampTop) continue;
          const dist = Math.sqrt(distSq) || 0.001;
          const overlap = radius - dist;
          pos.x += (dx / dist) * overlap;
          pos.z += (dz / dist) * overlap;
        }
      }
      for (const c of cylinders) {
        if (currentY + stepTolerance >= c.topY) continue;
        const dx = pos.x - c.x;
        const dz = pos.z - c.z;
        const minDist = radius + c.r;
        const distSq = dx * dx + dz * dz;
        if (distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq) || 0.001;
          const overlap = minDist - dist;
          pos.x += (dx / dist) * overlap;
          pos.z += (dz / dist) * overlap;
        }
      }
      for (const dc of dynamicCylinders.values()) {
        if (currentY + stepTolerance >= dc.topY) continue;
        const dx = pos.x - dc.x;
        const dz = pos.z - dc.z;
        const minDist = radius + dc.r;
        const distSq = dx * dx + dz * dz;
        if (distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq) || 0.001;
          const overlap = minDist - dist;
          pos.x += (dx / dist) * overlap;
          pos.z += (dz / dist) * overlap;
        }
      }
    }
  };
  return {
    worldPhysics,
    addWalkableBox: box => walkableBoxes.push(box),
    addRamp: ramp => ramps.push(ramp),
    addCylinder: cylinder => cylinders.push(cylinder)
  };
}
