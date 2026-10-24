// Granja procedural del chiringuito: parcelas, cosecha y regeneración matinal.
// Exports: FarmSystem.

import * as THREE from 'three';
import { FARM_CROPS, FARM, getPlantYieldBonus } from '../config/chiringuito/farm.js';
import { ISLAND } from '../config/chiringuito/island.js';
import { disposeObject3D } from '../utils/dispose.js';
import { AudioSys } from '../audio.js';

function plotKey(plot) {
  return plot.id || plot.ingredientId;
}

export class FarmSystem {
  constructor(scene, worldPhysics, options = {}) {
    this.scene = scene;
    this.worldPhysics = worldPhysics;
    this.authority = options.authority !== false;
    this.onHarvest = options.onHarvest || null;
    this.onPlant = options.onPlant || null;
    this.elapsed = 0;
    this.yieldBonus = 0;
    this.group = new THREE.Group();
    this.group.name = 'chiringuito_farm';
    scene.add(this.group);
    this.plots = new Map();
    this.physicsBoxes = [];
    this._buildPlots();
  }

  _buildPlots() {
    for (const source of ISLAND.farm.plots) {
      const crop = FARM_CROPS.find(item => item.ingredientId === source.ingredientId);
      if (!crop) continue;
      const ground = this.worldPhysics?.getGroundHeight(source.x, source.z, 0) ?? 0;
      const plotGroup = new THREE.Group();
      plotGroup.position.set(source.x, ground, source.z);
      plotGroup.name = `farm_${source.ingredientId}`;

      const soil = new THREE.Mesh(
        new THREE.BoxGeometry(3.3, 0.22, 2.8),
        new THREE.MeshStandardMaterial({ color: 0x5f4630, roughness: 0.98, flatShading: true })
      );
      soil.position.y = 0.11;
      soil.receiveShadow = true;
      plotGroup.add(soil);

      const rim = new THREE.Mesh(
        new THREE.BoxGeometry(3.55, 0.12, 3.05),
        new THREE.MeshStandardMaterial({ color: 0x7d5b37, roughness: 0.96, flatShading: true })
      );
      rim.position.y = 0.06;
      rim.receiveShadow = true;
      plotGroup.add(rim);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(1.7, 1.85, 20),
        new THREE.MeshBasicMaterial({
          color: 0xffd36b,
          transparent: true,
          opacity: 0.0,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.04;
      plotGroup.add(ring);

      const cropGroup = new THREE.Group();
      cropGroup.position.y = 0.22;
      plotGroup.add(cropGroup);

      const sproutGroup = new THREE.Group();
      sproutGroup.position.y = 0.24;
      sproutGroup.visible = false;
      for (let i = 0; i < 3; i++) {
        const sprout = new THREE.Mesh(
          new THREE.ConeGeometry(0.07, 0.36 + i * 0.08, 4),
          new THREE.MeshStandardMaterial({ color: 0x6f9d52, roughness: 0.9, flatShading: true })
        );
        sprout.position.set((i - 1) * 0.32, 0.18, (i % 2) * 0.18 - 0.09);
        sprout.rotation.z = (i - 1) * 0.22;
        sproutGroup.add(sprout);
      }
      plotGroup.add(sproutGroup);

      const plot = {
        id: source.id,
        ingredientId: source.ingredientId,
        name: crop.name,
        crop,
        x: source.x,
        z: source.z,
        ground,
        group: plotGroup,
        cropGroup,
        sproutGroup,
        ring,
        ready: true,
        growing: false,
        yield: FARM.baseYield,
        plantScore: 0,
        plantBonus: 0,
        highlight: 0
      };
      this._buildCropMeshes(plot);
      this.group.add(plotGroup);
      this.plots.set(plotKey(plot), plot);

      // La parcela es una superficie baja pero caminable: evita que el
      // jugador quede enterrado hasta las rodillas al cosechar.
      const plotBox = this.worldPhysics?.addWalkableBox?.({
        minX: source.x - 1.7,
        maxX: source.x + 1.7,
        minZ: source.z - 1.45,
        maxZ: source.z + 1.45,
        bottomY: ground,
        topY: ground + 0.24,
        isObstacle: false
      });
      if (plotBox) this.physicsBoxes.push(plotBox);
    }
  }

  _buildCropMeshes(plot) {
    const color = new THREE.Color(plot.crop.color || '#7aa35a');
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.82, flatShading: true });
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x4f7a42, roughness: 0.9, flatShading: true });
    const shape = plot.crop.shape;

    if (shape === 'palm' || shape === 'tree') {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, plot.crop.height, 6), stemMat);
      trunk.position.y = plot.crop.height / 2;
      trunk.castShadow = true;
      plot.cropGroup.add(trunk);
      const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.72, 0), mat);
      crown.position.y = plot.crop.height;
      crown.scale.set(1.3, 0.68, 1.3);
      crown.castShadow = true;
      plot.cropGroup.add(crown);
      for (let i = 0; i < 3; i++) {
        const fruit = new THREE.Mesh(new THREE.IcosahedronGeometry(0.19, 0), mat);
        const a = i * Math.PI * 2 / 3;
        fruit.position.set(Math.cos(a) * 0.58, plot.crop.height - 0.2, Math.sin(a) * 0.58);
        plot.cropGroup.add(fruit);
      }
    } else if (shape === 'grass' || shape === 'tuft') {
      for (let i = 0; i < 7; i++) {
        const blade = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.55 + (i % 3) * 0.12, 4), mat);
        const a = (i / 7) * Math.PI * 2;
        blade.position.set(Math.cos(a) * 0.36, 0.25, Math.sin(a) * 0.3);
        blade.rotation.z = 0.15 * Math.cos(a);
        plot.cropGroup.add(blade);
      }
    } else {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.48, 0.34, 7), stemMat);
      base.position.y = 0.17;
      plot.cropGroup.add(base);
      const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 0), mat);
      crown.position.y = 0.78;
      crown.scale.set(1.0, 0.72, 1.0);
      crown.castShadow = true;
      plot.cropGroup.add(crown);
      if (shape === 'vine') {
        for (let i = 0; i < 4; i++) {
          const fruit = new THREE.Mesh(new THREE.IcosahedronGeometry(0.15, 0), mat);
          const a = i * Math.PI / 2;
          fruit.position.set(Math.cos(a) * 0.38, 0.56, Math.sin(a) * 0.38);
          plot.cropGroup.add(fruit);
        }
      }
    }
  }

  _computeYield(plot) {
    const value = FARM.baseYield + this.yieldBonus + (Number(plot?.plantBonus) || 0);
    return Math.max(1, Math.min(FARM.maxYield, Math.round(value)));
  }

  _refreshPlot(plot) {
    plot.cropGroup.visible = !!plot.ready;
    plot.sproutGroup.visible = !!plot.growing && !plot.ready;
    plot.ring.material.opacity = plot.highlight > 0 ? 0.55 + Math.sin(this.elapsed * 5) * 0.18 : 0;
  }

  getNearestPlot(playerPos) {
    if (!playerPos) return null;
    let best = null;
    let bestDist = ISLAND.farm.harvestRadius;
    for (const plot of this.plots.values()) {
      // Las parcelas con cultivo en crecimiento no ofrecen interacción, pero
      // las vacías sí: son el punto de siembra.
      if (plot.growing) continue;
      const d = Math.hypot(playerPos.x - plot.x, playerPos.z - plot.z);
      if (d < bestDist) {
        best = plot;
        bestDist = d;
      }
    }
    return best;
  }

  setHighlight(plotId) {
    for (const [id, plot] of this.plots) {
      const next = id === plotId ? 1 : 0;
      if (plot.highlight !== next) {
        plot.highlight = next;
        this._refreshPlot(plot);
      }
    }
  }

  harvest(plotId, options = {}) {
    const plot = this.plots.get(plotId);
    if (!plot) return { ok: false, reason: 'NOT_FOUND' };
    if (!plot.ready || plot.growing) return { ok: false, reason: 'EMPTY' };
    if (options.playerPos && Math.hypot(options.playerPos.x - plot.x, options.playerPos.z - plot.z) > ISLAND.farm.harvestRadius + 0.4) {
      return { ok: false, reason: 'TOO_FAR' };
    }
    if (!this.authority && !options.remote) return { ok: true, pending: true, plotId };

    plot.ready = false;
    plot.growing = false;
    const bonus = Math.max(
      FARM.harvestBonusMin ?? -2,
      Math.min(FARM.harvestBonusMax ?? 2, Math.round(Number(options.bonus) || 0))
    );
    const amount = Math.max(1, Math.min(
      FARM.maxYield,
      Math.round((plot.yield || FARM.baseYield) + bonus)
    ));
    plot.plantScore = 0;
    plot.plantBonus = 0;
    plot.yield = this._computeYield(plot);
    this._refreshPlot(plot);
    AudioSys.playHarvest?.();
    if (!options.silent) {
      this.onHarvest?.(plot.ingredientId, amount, plot);
    }
    return { ok: true, ingredientId: plot.ingredientId, amount, bonus, plotId };
  }

  applyRemoteHarvest(plotId, ingredientId = null, amount = null) {
    const plot = this.plots.get(plotId);
    if (!plot) return;
    plot.ready = false;
    plot.growing = false;
    plot.plantScore = 0;
    plot.plantBonus = 0;
    plot.yield = this._computeYield(plot);
    this._refreshPlot(plot);
    if (ingredientId) this.onHarvest?.(ingredientId, amount || plot.yield, plot);
  }

  plant(plotId, options = {}) {
    const plot = this.plots.get(plotId);
    if (!plot) return { ok: false, reason: 'NOT_FOUND' };
    if (plot.ready || plot.growing) return { ok: false, reason: 'NOT_EMPTY' };
    if (!this.authority && !options.remote) return { ok: true, pending: true, plotId };
    const score = Math.max(0, Math.min(100, Number(options.score) || 0));
    plot.plantScore = score;
    plot.plantBonus = getPlantYieldBonus(score);
    plot.growing = true;
    plot.ready = false;
    plot.yield = this._computeYield(plot);
    this._refreshPlot(plot);
    if (!options.silent) this.onPlant?.(plot.ingredientId, plot);
    return {
      ok: true,
      plotId,
      ingredientId: plot.ingredientId,
      plantScore: plot.plantScore,
      plantBonus: plot.plantBonus,
      yield: plot.yield
    };
  }

  applyRemotePlant(plotId, score = 0) {
    const plot = this.plots.get(plotId);
    if (!plot) return;
    plot.plantScore = Math.max(0, Math.min(100, Number(score) || 0));
    plot.plantBonus = getPlantYieldBonus(plot.plantScore);
    plot.growing = true;
    plot.ready = false;
    plot.yield = this._computeYield(plot);
    this._refreshPlot(plot);
  }

  newMorning(options = {}) {
    const initial = !!options.initial;
    for (const plot of this.plots.values()) {
      if (initial) {
        plot.ready = true;
        plot.growing = false;
        plot.plantScore = 0;
        plot.plantBonus = 0;
      } else if (plot.growing) {
        plot.ready = true;
        plot.growing = false;
      } else if (!plot.ready) {
        plot.plantScore = 0;
        plot.plantBonus = 0;
      }
      // Las parcelas vacías no se regeneran solas: el jugador debe sembrarlas
      // durante la mañana siguiente para mantener la despensa.
      plot.yield = this._computeYield(plot);
      this._refreshPlot(plot);
    }
  }

  setYieldBonus(extra = 0) {
    this.yieldBonus = Math.max(0, Math.floor(Number(extra) || 0));
    for (const plot of this.plots.values()) plot.yield = this._computeYield(plot);
  }

  update(dt, playerPos = null) {
    this.elapsed += dt;
    const nearest = this.getNearestPlot(playerPos);
    this.setHighlight(nearest?.id || null);
    for (const plot of this.plots.values()) {
      if (plot.highlight > 0) {
        plot.ring.material.opacity = 0.4 + Math.sin(this.elapsed * 5) * 0.15;
      }
    }
  }

  serialize() {
    const plots = {};
    for (const [id, plot] of this.plots) {
      plots[id] = {
        ready: !!plot.ready,
        growing: !!plot.growing,
        yield: plot.yield,
        plantScore: plot.plantScore || 0,
        plantBonus: plot.plantBonus || 0
      };
    }
    return plots;
  }

  restore(data = {}) {
    for (const [id, plot] of this.plots) {
      const state = data[id];
      if (state) {
        plot.ready = !!state.ready;
        plot.growing = !!state.growing && !plot.ready;
        plot.plantScore = Math.max(0, Math.min(100, Number(state.plantScore) || 0));
        plot.plantBonus = Number.isFinite(Number(state.plantBonus))
          ? Math.max(-1, Math.min(2, Number(state.plantBonus)))
          : (plot.plantScore > 0 ? getPlantYieldBonus(plot.plantScore) : 0);
        plot.yield = Math.max(1, Math.min(FARM.maxYield, Number(state.yield || this._computeYield(plot))));
      } else {
        plot.ready = true;
        plot.growing = false;
      }
      this._refreshPlot(plot);
    }
  }

  destroy() {
    for (const box of this.physicsBoxes) this.worldPhysics?.removeWalkableBox?.(box);
    this.physicsBoxes.length = 0;
    this.plots.clear();
    this.scene.remove(this.group);
    disposeObject3D(this.group);
  }
}
