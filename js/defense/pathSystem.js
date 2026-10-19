// Rutas de oleadas, waypoints y marcadores visuales del suelo.
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
  constructor(scene, worldPhysics) {
    this.scene = scene;
    this.worldPhysics = worldPhysics;
    this.cfg = CORE_DEFENSE_CONFIG.PATHS;
    this.routes = new Map();
    this.visualGroup = new THREE.Group();
    this.beaconMeshes = [];
    this.elapsed = 0;

    this.scene.add(this.visualGroup);
    this.initRoutes();
    this.buildSubtleWorldMarkers();
  }

  initRoutes() {
    Object.values(this.cfg.ROUTES).forEach(routeCfg => {
      const points = routeCfg.waypoints.map(wp => {
        const gy = this.worldPhysics
          ? this.worldPhysics.getGroundHeight(wp.x, wp.z, wp.y ?? 2.5)
          : (wp.y || 0);
        return new THREE.Vector3(wp.x, gy, wp.z);
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
   * Construye marcas sutiles e inmersivas en el suelo (cables oxidados, placas de guía
   * y balizas industriales de baja intensidad) que indican por dónde avanzará la horda.
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

    this.routes.forEach(route => {
      const wps = route.waypoints;
      const plateMat = new THREE.MeshStandardMaterial({
        map: metalTex,
        color: 0x3b2f22,
        roughness: 0.88,
        metalness: 0.35,
        polygonOffset: true,
        polygonOffsetFactor: -1
      });

      // Cables dobles oscuros tendidos sobre el suelo y las rampas
      const cablePointsL = [];
      const cablePointsR = [];

      for (let i = 0; i < wps.length - 1; i++) {
        const a = wps[i];
        const b = wps[i + 1];
        const segVec = new THREE.Vector3().subVectors(b, a);
        const segLen = segVec.length();
        const dir = segVec.clone().normalize();
        const right = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
        const yaw = Math.atan2(dir.x, dir.z);

        const steps = Math.max(2, Math.floor(segLen / 2.6));
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const px = THREE.MathUtils.lerp(a.x, b.x, t);
          const pz = THREE.MathUtils.lerp(a.z, b.z, t);
          const refY = THREE.MathUtils.lerp(a.y, b.y, t);
          const py = this.worldPhysics
            ? this.worldPhysics.getGroundHeight(px, pz, refY + 0.6)
            : refY;

          cablePointsL.push(new THREE.Vector3(px - right.x * 0.62, py + 0.035, pz - right.z * 0.62));
          cablePointsR.push(new THREE.Vector3(px + right.x * 0.62, py + 0.035, pz + right.z * 0.62));

          // Placas de desgaste metálico cada ~5.2m
          if (s < steps && s % 2 === 0) {
            const plate = new THREE.Mesh(plateGeo, plateMat);
            plate.userData.sharedGeo = true;
            plate.rotation.x = -Math.PI / 2;
            plate.rotation.z = yaw;
            plate.position.set(px, py + 0.025, pz);
            plate.receiveShadow = true;
            this.visualGroup.add(plate);
          }
        }

        // Pequeña baliza industrial en cada waypoint intermedio
        if (i > 0) {
          const post = new THREE.Mesh(postGeo, postMat);
          post.userData.sharedGeo = true;
          post.userData.sharedMat = true;
          post.position.set(a.x + right.x * 1.15, a.y + 0.22, a.z + right.z * 1.15);

          const ledMat = new THREE.MeshBasicMaterial({ color: route.color });
          const led = new THREE.Mesh(beaconGeo, ledMat);
          led.userData.sharedGeo = true;
          led.position.set(a.x + right.x * 1.15, a.y + 0.5, a.z + right.z * 1.15);

          this.visualGroup.add(post, led);
          this.beaconMeshes.push({ mesh: led, baseColor: route.color, phase: i * 0.9 });
        }
      }

      const cableMat = new THREE.LineBasicMaterial({
        color: 0x593822,
        transparent: true,
        opacity: 0.72
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

  /**
   * Encuentra el waypoint óptimo para reincorporarse al camino tras abandonar la persecución
   * al jugador: busca el segmento más cercano y apunta al extremo que avanza hacia el Núcleo.
   */
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

  update(dt) {
    this.elapsed += dt;
    // Pulso secuencial sutil en las balizas del suelo en dirección al núcleo
    for (let i = 0; i < this.beaconMeshes.length; i++) {
      const b = this.beaconMeshes[i];
      const wave = Math.sin(this.elapsed * 3.8 - b.phase);
      b.mesh.visible = wave > -0.45;
    }
  }

  destroy() {
    if (!this.visualGroup) return;
    this.scene.remove(this.visualGroup);
    disposeObject3D(this.visualGroup);
    this.beaconMeshes.length = 0;
    this.routes.clear();
  }
}