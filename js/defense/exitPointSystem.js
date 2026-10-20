// Compuertas de salida y brechas de contención (Modo Defensa Bloons TD 6).
// Exports: ExitPointSystem.

import * as THREE from 'three';
import { SpriteSheets } from '../spritesheets.js';
import { SHARED_GEO, SHARED_MAT } from '../combat.js';
import { disposeObject3D } from '../utils/dispose.js';

export class ExitPointSystem {
  constructor(scene, worldPhysics, vfxList, exitPointsList) {
    this.scene = scene;
    this.worldPhysics = worldPhysics;
    this.vfx = vfxList;
    this.exitPoints = new Map();
    this.rootGroup = new THREE.Group();
    this.elapsed = 0;

    this.scene.add(this.rootGroup);
    this.buildExitGates(exitPointsList || []);
  }

  buildExitGates(list) {
    const metalTex = SpriteSheets?.env?.metal?.tex || null;

    list.forEach(exitCfg => {
      const group = new THREE.Group();
      const pos = exitCfg.position;
      const gy = this.worldPhysics
        ? this.worldPhysics.getGroundHeight(pos.x, pos.z, pos.y || 0)
        : (pos.y || 0);

      group.position.set(pos.x, gy, pos.z);

      // Marco de compuerta de evacuación
      const pillarGeo = new THREE.BoxGeometry(0.75, 4.2, 0.75);
      const beamGeo = new THREE.BoxGeometry(4.4, 0.85, 0.85);
      const frameMat = new THREE.MeshStandardMaterial({
        map: metalTex,
        color: 0x3d281a,
        roughness: 0.85,
        metalness: 0.4
      });

      // Pilar izquierdo y pilar derecho
      const pillarL = new THREE.Mesh(pillarGeo, frameMat);
      pillarL.position.set(-1.8, 2.1, 0);
      pillarL.castShadow = true;
      group.add(pillarL);

      const pillarR = new THREE.Mesh(pillarGeo, frameMat);
      pillarR.position.set(1.8, 2.1, 0);
      pillarR.castShadow = true;
      group.add(pillarR);

      // Viga superior
      const beam = new THREE.Mesh(beamGeo, frameMat);
      beam.position.set(0, 4.2, 0);
      beam.castShadow = true;
      group.add(beam);

      // Barrera de advertencia láser (campo de fuerza translúcido rojo)
      const fieldGeo = new THREE.PlaneGeometry(3.2, 3.8);
      const fieldMat = new THREE.MeshBasicMaterial({
        color: 0xff2222,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide
      });
      const fieldMesh = new THREE.Mesh(fieldGeo, fieldMat);
      fieldMesh.position.set(0, 1.9, 0);
      group.add(fieldMesh);

      // Luz de baliza de emergencia superior (roja)
      const beaconLight = new THREE.PointLight(0xff2222, 2.2, 16, 1.4);
      beaconLight.position.set(0, 4.8, 0);
      group.add(beaconLight);

      const beaconMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.24, 0.35, 8),
        new THREE.MeshBasicMaterial({ color: 0xff3333 })
      );
      beaconMesh.position.set(0, 4.8, 0);
      group.add(beaconMesh);

      // Marca de advertencia en el suelo (anillo con franjas)
      const rimMat = new THREE.MeshStandardMaterial({
        color: 0x5a1818,
        roughness: 0.9,
        polygonOffset: true,
        polygonOffsetFactor: -1
      });
      const rim = new THREE.Mesh(new THREE.RingGeometry(1.4, 2.4, 12), rimMat);
      rim.rotation.x = -Math.PI / 2;
      rim.position.y = 0.04;
      group.add(rim);

      // Columna de luz vertical (Skybeam de emergencia rojo) hacia el cielo, visible desde lejos (fog: false)
      const skyBeamGeo = new THREE.CylinderGeometry(1.8, 0.6, 60, 16, 1, true);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xff1e1e,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
        side: THREE.DoubleSide,
        fog: false
      });
      const skyBeam = new THREE.Mesh(skyBeamGeo, beamMat);
      skyBeam.position.set(0, 30, 0);
      group.add(skyBeam);

      const coreBeamGeo = new THREE.CylinderGeometry(0.38, 0.15, 60, 8, 1, true);
      const coreBeamMat = new THREE.MeshBasicMaterial({
        color: 0xff6666,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
        side: THREE.DoubleSide,
        fog: false
      });
      const coreBeam = new THREE.Mesh(coreBeamGeo, coreBeamMat);
      coreBeam.position.set(0, 30, 0);
      group.add(coreBeam);

      // Holograma 3D flotante sobre la compuerta de evacuación (a 7.0m de altura, sobre cualquier obstáculo)
      const holoGroup = new THREE.Group();
      holoGroup.position.set(0, 7.0, 0);

      const glyphGeo = new THREE.OctahedronGeometry(1.0, 0);
      const glyphMat = new THREE.MeshBasicMaterial({
        color: 0xff2222,
        fog: false
      });
      const glyphMesh = new THREE.Mesh(glyphGeo, glyphMat);
      holoGroup.add(glyphMesh);

      const ringGeo = new THREE.TorusGeometry(1.5, 0.07, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xff3333,
        transparent: true,
        opacity: 0.85,
        fog: false
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      holoGroup.add(ringMesh);

      group.add(holoGroup);

      this.rootGroup.add(group);

      this.exitPoints.set(exitCfg.id, {
        ...exitCfg,
        group,
        beaconLight,
        fieldMesh,
        beaconMesh,
        skyBeam,
        coreBeam,
        holoGroup,
        flashTimer: 0
      });
    });
  }

  getExitPointByPath(pathId) {
    for (const ep of this.exitPoints.values()) {
      if (ep.pathId === pathId) return ep;
    }
    // Retornar la primera si ninguna coincide
    return this.exitPoints.values().next().value || null;
  }

  triggerLeakEffect(exitPointId) {
    const ep = this.exitPoints.get(exitPointId) || this.exitPoints.values().next().value;
    if (!ep) return;

    ep.flashTimer = 0.6;
    if (ep.beaconLight) {
      ep.beaconLight.intensity = 7.0;
      ep.beaconLight.color.setHex(0xffffff);
    }
    if (ep.fieldMesh && ep.fieldMesh.material) {
      ep.fieldMesh.material.opacity = 0.85;
    }

    // Chispas de alarma en la compuerta
    if (this.vfx) {
      const p = ep.group.position;
      for (let i = 0; i < 8; i++) {
        const spark = new THREE.Mesh(SHARED_GEO.spark, SHARED_MAT.sparkBlood);
        spark.position.copy(p).add(new THREE.Vector3((Math.random() - 0.5) * 2.0, 1.2 + Math.random(), (Math.random() - 0.5) * 1.5));
        this.scene.add(spark);
        this.vfx.push({
          mesh: spark,
          vel: new THREE.Vector3((Math.random() - 0.5) * 4, 3 + Math.random() * 3, (Math.random() - 0.5) * 4),
          life: 0.45
        });
      }
    }
  }

  update(dt) {
    this.elapsed += dt;

    this.exitPoints.forEach(ep => {
      // Rotación y flotación del holograma de evacuación
      if (ep.holoGroup) {
        ep.holoGroup.rotation.y += dt * 1.8;
        ep.holoGroup.position.y = 7.0 + Math.sin(this.elapsed * 3.0) * 0.4;
      }
      if (ep.skyBeam) {
        ep.skyBeam.material.opacity = 0.28 + 0.16 * Math.sin(this.elapsed * 4.5);
      }

      if (ep.flashTimer > 0) {
        ep.flashTimer -= dt;
        if (ep.flashTimer <= 0) {
          if (ep.beaconLight) {
            ep.beaconLight.intensity = 2.2;
            ep.beaconLight.color.setHex(0xff2222);
          }
          if (ep.fieldMesh && ep.fieldMesh.material) {
            ep.fieldMesh.material.opacity = 0.35;
          }
        }
      } else if (ep.beaconLight) {
        // Pulso suave continuo de sirena
        const pulse = 1.6 + Math.sin(this.elapsed * 4.5) * 0.9;
        ep.beaconLight.intensity = pulse;
      }
    });
  }

  destroy() {
    this.exitPoints.forEach(ep => {
      if (ep.beaconLight) ep.beaconLight.dispose?.();
    });
    this.exitPoints.clear();
    disposeObject3D(this.rootGroup);
    this.scene.remove(this.rootGroup);
  }
}
