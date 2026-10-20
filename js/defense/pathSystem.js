// Rutas de oleadas, waypoints, marcadores visuales del suelo y flechas de flujo.
// Exports: PathSystem.
import * as THREE from 'three';
import { CORE_DEFENSE_CONFIG } from '../config/coreDefenseConfig.js';
import { SpriteSheets } from '../spritesheets.js';
import { projectPointToSegment } from '../utils/routeMath.js';
import { disposeObject3D } from '../utils/dispose.js';

// ============================================================================
// SISTEMA DE CAMINOS Y NAVEGACIÓN POR WAYPOINTS (Solo en Modo Defensa)
// ============================================================================

export class PathSystem {
  constructor(scene, worldPhysics, routesMap = null) {
    this.scene = scene;
    this.worldPhysics = worldPhysics;
    this.cfg = CORE_DEFENSE_CONFIG.PATHS;
    this.routes = new Map();
    this.visualGroup = new THREE.Group();
    this.flowArrowsGroup = new THREE.Group();
    this.beaconMeshes = [];
    this.arrowItems = [];
    this.elapsed = 0;

    this.visualGroup.add(this.flowArrowsGroup);
    this.scene.add(this.visualGroup);
    this.initRoutes(routesMap);
    this.buildSubtleWorldMarkers();
  }

  initRoutes(customRoutes = null) {
    const source = customRoutes || this.cfg.ROUTES;
    Object.values(source).forEach(routeCfg => {
      const points = routeCfg.waypoints.map(wp => {
        return new THREE.Vector3(wp.x, 0.0, wp.z);
      });
      this.routes.set(routeCfg.id, {
        id: routeCfg.id,
        name: routeCfg.name,
        color: routeCfg.color || 0xb89c46,
        waypoints: points
      });
    });
  }

  /**
   * Construye marcas inmersivas en el suelo (cables industriales a ras de piso,
   * placas de desgaste, balizas de señalización y flechas de flujo animadas durante descansos).
   */
  buildSubtleWorldMarkers() {
    const metalTex = SpriteSheets.env.metal.tex;
    const plateGeo = new THREE.PlaneGeometry(1.15, 0.55);
    const beaconGeo = new THREE.BoxGeometry(0.18, 0.26, 0.18);
    const postGeo = new THREE.BoxGeometry(0.22, 0.45, 0.22);
    const postMat = new THREE.MeshStandardMaterial({
      color: 0x2b1d14,
      roughness: 0.9,
      metalness: 0.3
    });

    // Geometría chevron para flechas indicadoras de flujo de enemigos
    const chevronShape = new THREE.Shape();
    chevronShape.moveTo(0, 0.48);
    chevronShape.lineTo(-0.34, -0.32);
    chevronShape.lineTo(0, -0.14);
    chevronShape.lineTo(0.34, -0.32);
    chevronShape.closePath();
    const arrowGeo = new THREE.ShapeGeometry(chevronShape);

    this.routes.forEach(route => {
      const wps = route.waypoints;
      const plateMat = new THREE.MeshStandardMaterial({
        map: metalTex,
        color: 0x483a2c,
        roughness: 0.85,
        metalness: 0.4,
        polygonOffset: true,
        polygonOffsetFactor: -3,
        polygonOffsetUnits: -3
      });

      const arrowMat = new THREE.MeshBasicMaterial({
        color: route.color || 0x4aa3df,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        side: THREE.DoubleSide
      });

      // Cables dobles oscuros tendidos a ras del suelo metálico
      const cablePointsL = [];
      const cablePointsR = [];
      let totalDist = 0;

      for (let i = 0; i < wps.length - 1; i++) {
        const a = wps[i];
        const b = wps[i + 1];
        const segVec = new THREE.Vector3().subVectors(b, a);
        const segLen = segVec.length();
        const dir = segVec.clone().normalize();
        const right = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
        const yaw = Math.atan2(dir.x, dir.z);

        const steps = Math.max(1, Math.floor(segLen / 1.5));
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const px = THREE.MathUtils.lerp(a.x, b.x, t);
          const pz = THREE.MathUtils.lerp(a.z, b.z, t);
          const py = 0.035;

          cablePointsL.push(new THREE.Vector3(px - right.x * 0.55, py, pz - right.z * 0.55));
          cablePointsR.push(new THREE.Vector3(px + right.x * 0.55, py, pz + right.z * 0.55));

          // Placas de desgaste cada ~5m
          if (s === 0 && i % 4 === 0) {
            const plate = new THREE.Mesh(plateGeo, plateMat);
            plate.userData.sharedGeo = true;
            plate.rotation.x = -Math.PI / 2;
            plate.rotation.z = yaw;
            plate.position.set(px, 0.02, pz);
            plate.receiveShadow = true;
            this.visualGroup.add(plate);
          }
        }

        // Flecha de flujo indicadora de dirección cada ~3.2m
        if (i % 2 === 0) {
          const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
          arrowMesh.rotation.x = -Math.PI / 2;
          arrowMesh.rotation.z = yaw;
          arrowMesh.position.set(a.x, 0.05, a.z);
          this.flowArrowsGroup.add(arrowMesh);
          this.arrowItems.push({
            mesh: arrowMesh,
            phase: totalDist * 0.4
          });
        }
        totalDist += segLen;

        // Balizas industriales espaciadas cada ~8 waypoints
        if (i > 0 && i % 8 === 0) {
          const post = new THREE.Mesh(postGeo, postMat);
          post.userData.sharedGeo = true;
          post.userData.sharedMat = true;
          post.position.set(a.x + right.x * 1.15, 0.22, a.z + right.z * 1.15);

          const ledMat = new THREE.MeshBasicMaterial({ color: route.color });
          const led = new THREE.Mesh(beaconGeo, ledMat);
          led.userData.sharedGeo = true;
          led.position.set(a.x + right.x * 1.15, 0.5, a.z + right.z * 1.15);

          this.visualGroup.add(post, led);
          this.beaconMeshes.push({ mesh: led, baseColor: route.color, phase: i * 0.45 });
        }
      }

      const cableMat = new THREE.LineBasicMaterial({
        color: route.color ? new THREE.Color(route.color).lerp(new THREE.Color(0x2b1c10), 0.5) : 0x593822,
        transparent: true,
        opacity: 0.85,
        depthTest: true
      });
      const lineL = new THREE.Line(new THREE.BufferGeometry().setFromPoints(cablePointsL), cableMat);
      const lineR = new THREE.Line(new THREE.BufferGeometry().setFromPoints(cablePointsR), cableMat);
      this.visualGroup.add(lineL, lineR);
    });
  }

  getRoute(routeId) {
    return this.routes.get(routeId) || this.routes.values().next().value;
  }

  getWaypoint(routeId, index) {
    const route = this.getRoute(routeId);
    if (!route) return new THREE.Vector3(0, 0, 0);
    const clampedIdx = Math.max(0, Math.min(route.waypoints.length - 1, index));
    return route.waypoints[clampedIdx];
  }

  isFinalWaypoint(routeId, index) {
    const route = this.getRoute(routeId);
    if (!route) return true;
    return index >= route.waypoints.length - 1;
  }

  findRejoinWaypointIndex(routeId, currentPos) {
    const route = this.getRoute(routeId);
    if (!route || route.waypoints.length === 0) return 0;

    const wps = route.waypoints;
    let bestSegmentEndIdx = 0;
    let minDistSq = Infinity;

    for (let i = 0; i < wps.length - 1; i++) {
      const p = projectPointToSegment(currentPos.x, currentPos.z, wps[i], wps[i + 1]);
      const dSq = (currentPos.x - p.x) ** 2 + (currentPos.z - p.z) ** 2;

      if (dSq < minDistSq) {
        minDistSq = dSq;
        bestSegmentEndIdx = i + 1;
      }
    }

    return Math.min(wps.length - 1, bestSegmentEndIdx);
  }

  update(dt, isPrep = true) {
    this.elapsed += dt;

    // Pulso secuencial sutil en las balizas del suelo en dirección a la salida
    for (let i = 0; i < this.beaconMeshes.length; i++) {
      const b = this.beaconMeshes[i];
      const wave = Math.sin(this.elapsed * 3.8 - b.phase);
      b.mesh.visible = wave > -0.45;
    }

    // Las flechas de flujo solo se muestran durante descansos/preparación entre oleadas
    this.flowArrowsGroup.visible = !!isPrep;
    if (isPrep) {
      for (let i = 0; i < this.arrowItems.length; i++) {
        const item = this.arrowItems[i];
        const wave = Math.sin(this.elapsed * 5.0 - item.phase);
        item.mesh.material.opacity = Math.max(0.18, 0.4 + 0.55 * wave);
        const sc = 0.95 + 0.12 * Math.max(0, wave);
        item.mesh.scale.set(sc, sc, 1);
      }
    }
  }

  destroy() {
    if (!this.visualGroup) return;
    this.scene.remove(this.visualGroup);
    disposeObject3D(this.visualGroup);
    this.beaconMeshes.length = 0;
    this.arrowItems.length = 0;
    this.routes.clear();
  }
}
