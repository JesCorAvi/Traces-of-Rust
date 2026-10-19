import * as THREE from 'three';
import { CORE_DEFENSE_CONFIG } from '../config/coreDefenseConfig.js';
import { SpriteSheets } from '../spritesheets.js';
import { SHARED_GEO, SHARED_MAT } from '../combat.js';

// ============================================================================
// PUNTOS DE APARICIÓN INDUSTRIALES (Grietas / Compuertas en Modo Defensa)
// ============================================================================

export class SpawnPointSystem {
  constructor(scene, worldPhysics, vfxList) {
    this.scene = scene;
    this.worldPhysics = worldPhysics;
    this.vfx = vfxList;
    this.spawnPoints = new Map();
    this.rootGroup = new THREE.Group();
    this.elapsed = 0;

    this.scene.add(this.rootGroup);
    this.buildSpawnPortals();
  }

  buildSpawnPortals() {
    const metalTex = SpriteSheets.env.metal.tex;
    const crateTex = SpriteSheets.env.crate.tex;

    CORE_DEFENSE_CONFIG.SPAWN_POINTS.forEach(spCfg => {
      const group = new THREE.Group();
      const gy = this.worldPhysics
        ? this.worldPhysics.getGroundHeight(spCfg.position.x, spCfg.position.z, 0)
        : 0;
      group.position.set(spCfg.position.x, gy, spCfg.position.z);

      // Orientar la compuerta mirando hacia el centro del mapa (Núcleo)
      const angleToCenter = Math.atan2(-spCfg.position.x, -spCfg.position.z);
      group.rotation.y = angleToCenter;

      const frameMat = new THREE.MeshStandardMaterial({
        map: metalTex,
        color: 0x3b281c,
        roughness: 0.85,
        metalness: 0.4
      });
      const doorMat = new THREE.MeshStandardMaterial({
        map: crateTex,
        color: 0x261a14,
        roughness: 0.9
      });

      // Marco de compuerta en el suelo + foso abisal oscuro
      const rim = new THREE.Mesh(new THREE.RingGeometry(1.6, 2.45, 8), frameMat);
      rim.rotation.x = -Math.PI / 2;
      rim.position.y = 0.05;
      group.add(rim);

      const abyssDisc = new THREE.Mesh(
        new THREE.CircleGeometry(1.65, 8),
        new THREE.MeshBasicMaterial({ color: 0x040202 })
      );
      abyssDisc.rotation.x = -Math.PI / 2;
      abyssDisc.position.y = 0.03;
      group.add(abyssDisc);

      // Grieta luminosa biomecánica en el centro del foso
      const riftMat = new THREE.MeshBasicMaterial({
        color: spCfg.color || 0xc42020,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide
      });
      const riftRing = new THREE.Mesh(new THREE.RingGeometry(0.45, 1.35, 6), riftMat);
      riftRing.rotation.x = -Math.PI / 2;
      riftRing.position.y = 0.06;
      group.add(riftRing);

      // Dos hojas de compuerta abiertas en ángulo a los lados
      const hatchL = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.16, 2.4), doorMat);
      hatchL.position.set(-1.75, 0.45, 0);
      hatchL.rotation.z = 0.65;
      const hatchR = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.16, 2.4), doorMat);
      hatchR.position.set(1.75, 0.45, 0);
      hatchR.rotation.z = -0.65;
      group.add(hatchL, hatchR);

      // Arco industrial superior con luz de alarma
      const pillarL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 3.4, 0.45), frameMat);
      pillarL.position.set(-2.1, 1.7, -0.6);
      const pillarR = new THREE.Mesh(new THREE.BoxGeometry(0.45, 3.4, 0.45), frameMat);
      pillarR.position.set(2.1, 1.7, -0.6);
      const topBeam = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.5, 0.6), frameMat);
      topBeam.position.set(0, 3.5, -0.6);
      group.add(pillarL, pillarR, topBeam);

      const portalLight = new THREE.PointLight(spCfg.color || 0xc42020, 26, 14, 1.5);
      portalLight.position.set(0, 2.2, 0);
      group.add(portalLight);

      this.rootGroup.add(group);
      this.spawnPoints.set(spCfg.id, {
        ...spCfg,
        group,
        riftRing,
        riftMat,
        portalLight,
        activeFlash: 0,
        worldPos: group.position.clone()
      });
    });
  }

  getSpawnPointByPath(pathId) {
    for (const sp of this.spawnPoints.values()) {
      if (sp.pathId === pathId) return sp;
    }
    return this.spawnPoints.values().next().value;
  }

  getAllSpawnPoints() {
    return Array.from(this.spawnPoints.values());
  }

  /**
   * Dispara un efecto visual de emergencia (sombras, chispas y destello de grieta)
   * cuando un enemigo o boss emerge de este punto de aparición.
   */
  triggerSpawnEffect(spawnPointId, isBoss = false) {
    const sp = this.spawnPoints.get(spawnPointId);
    if (!sp) return;

    sp.activeFlash = isBoss ? 1.2 : 0.45;
    if (!this.vfx) return;

    const count = isBoss ? 10 : 3;
    for (let i = 0; i < count; i++) {
      const p = new THREE.Mesh(
        SHARED_GEO.spark,
        i % 2 === 0 ? SHARED_MAT.sparkBlood : SHARED_MAT.sparkGold
      );
      p.scale.setScalar(isBoss ? 1.8 : 1.2);
      p.position.copy(sp.worldPos).add(new THREE.Vector3(
        (Math.random() - 0.5) * 2.0,
        0.3 + Math.random() * 0.8,
        (Math.random() - 0.5) * 2.0
      ));
      this.scene.add(p);
      this.vfx.push({
        mesh: p,
        life: 0.42,
        vel: new THREE.Vector3((Math.random() - 0.5) * 4, 3.0 + Math.random() * 3, (Math.random() - 0.5) * 4),
        gravity: 12,
        floorY: sp.worldPos.y + 0.05
      });
    }
  }

  update(dt) {
    this.elapsed += dt;
    this.spawnPoints.forEach((sp, idx) => {
      sp.riftRing.rotation.z += dt * 1.1;
      if (sp.activeFlash > 0) {
        sp.activeFlash -= dt;
        sp.portalLight.intensity = 65;
        sp.riftMat.opacity = 1.0;
      } else {
        const pulse = 0.55 + Math.sin(this.elapsed * 3.2 + idx) * 0.25;
        sp.portalLight.intensity = 22 * pulse;
        sp.riftMat.opacity = pulse;
      }
    });
  }

  destroy() {
    if (!this.rootGroup) return;
    this.scene.remove(this.rootGroup);
    this.rootGroup.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    });
    this.spawnPoints.clear();
  }
}