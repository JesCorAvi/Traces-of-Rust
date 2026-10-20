// Rutas de oleadas, pasarelas industriales con rieles 3D, balizas y flechas de flujo.
// Exports: PathSystem.
import * as THREE from 'three';
import { CORE_DEFENSE_CONFIG } from '../config/coreDefenseConfig.js';
import { SpriteSheets } from '../spritesheets.js';
import { projectPointToSegment } from '../utils/routeMath.js';
import { disposeObject3D } from '../utils/dispose.js';

// ============================================================================
// SISTEMA DE CAMINOS Y VÍAS INDUSTRIALES (Solo en Modo Defensa)
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
        const gy = this.worldPhysics
          ? this.worldPhysics.getGroundHeight(wp.x, wp.z, 0, true)
          : (wp.y || 0);
        return new THREE.Vector3(wp.x, Math.max(wp.y || 0, gy), wp.z);
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
   * Construye vías industriales inmersivas:
   * 1. Pasarela de rejilla metálica oxidada continua.
   * 2. Rieles laterales de acero 3D con volumen.
   * 3. Traviesas transversales metálicas remachadas.
   * 4. Balizas de señalización en postes laterales.
   * 5. Flechas de flujo direccionales (apuntando hacia la salida) activas en descansos.
   */
  buildSubtleWorldMarkers() {
    const metalTex = SpriteSheets.env.metal.tex;

    // Materiales industriales compartidos
    const walkwayMat = new THREE.MeshStandardMaterial({
      map: metalTex,
      color: 0x3d3024,
      roughness: 0.85,
      metalness: 0.45,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2
    });

    const railMat = new THREE.MeshStandardMaterial({
      color: 0x241c14,
      roughness: 0.75,
      metalness: 0.65
    });

    const tieMat = new THREE.MeshStandardMaterial({
      color: 0x1c1510,
      roughness: 0.9,
      metalness: 0.4
    });

    const beaconGeo = new THREE.BoxGeometry(0.18, 0.26, 0.18);
    const postGeo = new THREE.BoxGeometry(0.22, 0.45, 0.22);
    const postMat = new THREE.MeshStandardMaterial({
      color: 0x2b1d14,
      roughness: 0.9,
      metalness: 0.3
    });

    // Geometría de doble flecha (chevron >>) en plano XZ, apuntando estrictamente hacia +Z (hacia la salida).
    // Con rotation.y = yaw (donde yaw = Math.atan2(dir.x, dir.z)), la punta apunta exactamente a la salida.
    const arrowGeo = new THREE.BufferGeometry();
    const arrowVerts = new Float32Array([
      // Chevron 1 (frontal)
      0.00, 0.00, 0.44, 0.00, 0.00, 0.24, -0.30, 0.00, 0.04,
      -0.30, 0.00, 0.04, 0.00, 0.00, 0.24, -0.30, 0.00, -0.08,
      0.00, 0.00, 0.44, 0.30, 0.00, 0.04, 0.00, 0.00, 0.24,
      0.30, 0.00, 0.04, 0.30, 0.00, -0.08, 0.00, 0.00, 0.24,
      // Chevron 2 (posterior)
      0.00, 0.00, 0.12, 0.00, 0.00, -0.08, -0.30, 0.00, -0.28,
      -0.30, 0.00, -0.28, 0.00, 0.00, -0.08, -0.30, 0.00, -0.40,
      0.00, 0.00, 0.12, 0.30, 0.00, -0.28, 0.00, 0.00, -0.08,
      0.30, 0.00, -0.28, 0.30, 0.00, -0.40, 0.00, 0.00, -0.08
    ]);
    arrowGeo.setAttribute('position', new THREE.BufferAttribute(arrowVerts, 3));
    arrowGeo.computeVertexNormals();

    const getRouteGlowColor = rId => {
      if (rId === 'path_main') return 0x00e5ff;   // Cian eléctrico (Fácil)
      if (rId === 'path_west') return 0xffc107;   // Ámbar dorado (Normal Oeste)
      if (rId === 'path_east') return 0xff3366;   // Rojo coral (Normal Este)
      if (rId === 'path_alpha') return 0xff7700;  // Naranja fuego (Difícil Alfa)
      if (rId === 'path_beta') return 0xd946ef;   // Magenta eléctrico (Difícil Beta)
      return 0xffd700;
    };

    this.routes.forEach(route => {
      const wps = route.waypoints;
      const glowColor = getRouteGlowColor(route.id);
      let totalDist = 0;

      for (let i = 0; i < wps.length - 1; i++) {
        const a = wps[i];
        const b = wps[i + 1];
        const segVec = new THREE.Vector3().subVectors(b, a);
        const segLen = segVec.length();
        if (segLen < 0.05) continue;

        const dir = segVec.clone().normalize();
        const right = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
        const yaw = Math.atan2(dir.x, dir.z);

        // Posición y altura central del tramo
        const midX = (a.x + b.x) * 0.5;
        const midZ = (a.z + b.z) * 0.5;
        const midRefY = (a.y + b.y) * 0.5;
        const surfaceY = this.worldPhysics
          ? this.worldPhysics.getGroundHeight(midX, midZ, 0, true)
          : midRefY;
        const py = Math.max(midRefY, surfaceY);

        // 1. Plancha / Pasarela metálica de suelo (1.35m de ancho)
        const walkGeo = new THREE.PlaneGeometry(1.35, segLen + 0.06);
        const walkMesh = new THREE.Mesh(walkGeo, walkwayMat);
        walkMesh.rotation.x = -Math.PI / 2;
        walkMesh.rotation.z = yaw;
        walkMesh.position.set(midX, py + 0.025, midZ);
        walkMesh.receiveShadow = true;
        this.visualGroup.add(walkMesh);

        // 2. Rieles laterales de acero 3D (a izquierda y derecha ±0.62m)
        const railGeo = new THREE.BoxGeometry(0.08, 0.06, segLen + 0.04);
        const railL = new THREE.Mesh(railGeo, railMat);
        railL.rotation.y = yaw;
        railL.position.set(midX - right.x * 0.62, py + 0.045, midZ - right.z * 0.62);

        const railR = new THREE.Mesh(railGeo, railMat);
        railR.rotation.y = yaw;
        railR.position.set(midX + right.x * 0.62, py + 0.045, midZ + right.z * 0.62);

        this.visualGroup.add(railL, railR);

        // 3. Traviesas metálicas transversales cada tramo
        const tieGeo = new THREE.BoxGeometry(1.4, 0.035, 0.24);
        const tieMesh = new THREE.Mesh(tieGeo, tieMat);
        tieMesh.rotation.y = yaw;
        tieMesh.position.set(a.x, a.y + 0.035, a.z);
        this.visualGroup.add(tieMesh);

        // 4. Flechas de flujo en el centro de la pasarela (apuntan estrictamente hacia la salida)
        // Se colocan en el centro del tramo elevadas sobre la pasarela (libres de la traviesa)
        if (segLen >= 0.7) {
          const spawnArrow = (t) => {
            const px = a.x + dir.x * segLen * t;
            const pz = a.z + dir.z * segLen * t;
            const refY = a.y + (b.y - a.y) * t;
            const gY = this.worldPhysics
              ? this.worldPhysics.getGroundHeight(px, pz, 0, true)
              : refY;
            const arrowY = Math.max(refY, gY) + 0.058;

            const arrowMat = new THREE.MeshBasicMaterial({
              color: glowColor,
              transparent: true,
              opacity: 0.85,
              depthTest: true,
              depthWrite: false,
              polygonOffset: true,
              polygonOffsetFactor: -4,
              polygonOffsetUnits: -4,
              side: THREE.DoubleSide
            });

            const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
            arrowMesh.rotation.y = yaw;
            arrowMesh.position.set(px, arrowY, pz);
            arrowMesh.renderOrder = 25;
            this.flowArrowsGroup.add(arrowMesh);
            this.arrowItems.push({
              mesh: arrowMesh,
              mat: arrowMat,
              phase: (totalDist + segLen * t) * 0.45
            });
          };

          if (segLen >= 2.6) {
            spawnArrow(0.32);
            spawnArrow(0.68);
          } else {
            spawnArrow(0.5);
          }
        }
        totalDist += segLen;

        // 5. Baliza de señalización en poste lateral cada ~8 waypoints
        if (i > 0 && i % 8 === 0) {
          const beaconGroundY = this.worldPhysics
            ? this.worldPhysics.getGroundHeight(a.x + right.x * 1.05, a.z + right.z * 1.05, 0, true)
            : a.y;
          const postY = Math.max(a.y, beaconGroundY);

          const post = new THREE.Mesh(postGeo, postMat);
          post.position.set(a.x + right.x * 1.05, postY + 0.22, a.z + right.z * 1.05);

          const ledMat = new THREE.MeshBasicMaterial({ color: glowColor });
          const led = new THREE.Mesh(beaconGeo, ledMat);
          led.position.set(a.x + right.x * 1.05, postY + 0.5, a.z + right.z * 1.05);

          this.visualGroup.add(post, led);
          this.beaconMeshes.push({ mesh: led, baseColor: glowColor, phase: i * 0.45 });
        }
      }
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

    // Pulso secuencial en balizas
    for (let i = 0; i < this.beaconMeshes.length; i++) {
      const b = this.beaconMeshes[i];
      const wave = Math.sin(this.elapsed * 3.8 - b.phase);
      b.mesh.visible = wave > -0.45;
    }

    // Flechas de flujo activas y pulsando con onda luminosa hacia la salida durante la preparación/descanso
    this.flowArrowsGroup.visible = !!isPrep;
    if (isPrep) {
      for (let i = 0; i < this.arrowItems.length; i++) {
        const item = this.arrowItems[i];
        // Onda que avanza en dirección hacia la salida
        const wave = Math.sin(this.elapsed * 5.2 - item.phase);
        const norm = (wave + 1) * 0.5; // 0..1
        if (item.mat) item.mat.opacity = 0.38 + 0.62 * norm;
        const sc = 0.94 + 0.14 * norm;
        item.mesh.scale.set(sc, 1, sc); // Escalar en X y Z (plano de la flecha)
      }
    }
  }

  destroy() {
    if (!this.visualGroup) return;
    this.scene.remove(this.visualGroup);
    disposeObject3D(this.visualGroup);
    for (let i = 0; i < this.arrowItems.length; i++) {
      if (this.arrowItems[i]?.mat) this.arrowItems[i].mat.dispose();
    }
    this.beaconMeshes.length = 0;
    this.arrowItems.length = 0;
    this.routes.clear();
  }
}
