// Rutas de oleadas, pasarelas industriales con rieles 3D, balizas, cruces giratorios y flechas de flujo.
// Exports: PathSystem.
import * as THREE from 'three';
import { CORE_DEFENSE_CONFIG } from '../config/coreDefenseConfig.js';
import { SpriteSheets } from '../spritesheets.js';
import { projectPointToSegment } from '../utils/routeMath.js';
import { disposeObject3D } from '../utils/dispose.js';

// ============================================================================
// SISTEMA DE CAMINOS Y VÍAS INDUSTRIALES (Solo en Modo Defensa)
// ============================================================================

/**
 * Calcula la intersección 2D (plano XZ) entre dos segmentos (p1->p2) y (p3->p4).
 * Retorna { x, y, z } si se cruzan y están a una cota vertical similar (ΔY < 1.0m), o null.
 */
function getSegmentIntersection2D(p1, p2, p3, p4) {
  const d1x = p2.x - p1.x;
  const d1z = p2.z - p1.z;
  const d2x = p4.x - p3.x;
  const d2z = p4.z - p3.z;
  const denom = d1x * d2z - d1z * d2x;
  if (Math.abs(denom) < 1e-5) return null;

  const t = ((p3.x - p1.x) * d2z - (p3.z - p1.z) * d2x) / denom;
  const u = ((p3.x - p1.x) * d1z - (p3.z - p1.z) * d1x) / denom;

  if (t >= 0.01 && t <= 0.99 && u >= 0.01 && u <= 0.99) {
    const ix = p1.x + t * d1x;
    const iz = p1.z + t * d1z;
    const iy1 = p1.y + t * (p2.y - p1.y);
    const iy2 = p3.y + u * (p4.y - p3.y);
    if (Math.abs(iy1 - iy2) > 1.0) return null; // No cruzan físicamente si uno va sobre puente/elevación
    return { x: ix, y: Math.max(iy1, iy2), z: iz };
  }
  return null;
}

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
          ? this.worldPhysics.getGroundHeight(wp.x, wp.z, 0, true, true)
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
   * 2. Rieles laterales de acero 3D con volumen (interrumpidos limpiamente en cruces).
   * 3. Placas de intersección giratorias remachadas con textura especializada y sin z-fighting.
   * 4. Traviesas transversales metálicas remachadas.
   * 5. Balizas de señalización en postes laterales.
   * 6. Flechas de flujo direccionales (apuntando hacia la salida) activas en descansos.
   */
  buildSubtleWorldMarkers() {
    const metalTex = SpriteSheets?.env?.metal?.tex || null;
    const intersectionTex = SpriteSheets?.env?.intersection?.tex || metalTex;

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

    const junctionMat = new THREE.MeshStandardMaterial({
      map: intersectionTex,
      color: 0x3d3024,
      roughness: 0.85,
      metalness: 0.45,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3
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

    // -------------------------------------------------------------------------
    // Detección de intersecciones y bifurcaciones entre rutas
    // -------------------------------------------------------------------------
    const allSegments = [];
    const gatePoints = [];

    this.routes.forEach(route => {
      const wps = route.waypoints;
      if (wps.length >= 2) {
        gatePoints.push(wps[0]);
        gatePoints.push(wps[wps.length - 1]);
      }
      for (let i = 0; i < wps.length - 1; i++) {
        allSegments.push({
          routeId: route.id,
          segIdx: i,
          a: wps[i],
          b: wps[i + 1]
        });
      }
    });

    const rawCrossings = [];

    // 1. Cruces de traza directa (XZ)
    for (let i = 0; i < allSegments.length; i++) {
      for (let j = i + 1; j < allSegments.length; j++) {
        const s1 = allSegments[i];
        const s2 = allSegments[j];
        if (s1.routeId === s2.routeId && Math.abs(s1.segIdx - s2.segIdx) <= 4) continue;
        const pt = getSegmentIntersection2D(s1.a, s1.b, s2.a, s2.b);
        if (pt) {
          const nearGate = gatePoints.some(g => Math.hypot(pt.x - g.x, pt.z - g.z) < 2.2);
          if (!nearGate) rawCrossings.push(pt);
        }
      }
    }

    // 2. Nodos convergentes de rutas distintas que se tocan o pasan a menos de 0.85m
    this.routes.forEach(r1 => {
      this.routes.forEach(r2 => {
        if (r1.id >= r2.id) return;
        r1.waypoints.forEach(w1 => {
          r2.waypoints.forEach(w2 => {
            const d = Math.hypot(w1.x - w2.x, w1.z - w2.z);
            if (d < 0.85 && Math.abs(w1.y - w2.y) < 0.8) {
              const cx = (w1.x + w2.x) * 0.5;
              const cz = (w1.z + w2.z) * 0.5;
              const cy = Math.max(w1.y, w2.y);
              const nearGate = gatePoints.some(g => Math.hypot(cx - g.x, cz - g.z) < 2.2);
              if (!nearGate) rawCrossings.push({ x: cx, y: cy, z: cz });
            }
          });
        });
      });
    });

    // Agrupar cruces cercanos en un único centro de intersección (radio cluster 1.8m)
    const junctions = [];
    for (const pt of rawCrossings) {
      let cluster = null;
      for (const junc of junctions) {
        if (Math.hypot(junc.x - pt.x, junc.z - pt.z) < 1.8) {
          cluster = junc;
          break;
        }
      }
      if (cluster) {
        cluster.x = (cluster.x * cluster.count + pt.x) / (cluster.count + 1);
        cluster.y = Math.max(cluster.y, pt.y);
        cluster.z = (cluster.z * cluster.count + pt.z) / (cluster.count + 1);
        cluster.count++;
      } else {
        junctions.push({ x: pt.x, y: pt.y, z: pt.z, count: 1 });
      }
    }

    // Placa de intersección y topes de esquina
    const junctionGeo = new THREE.PlaneGeometry(2.35, 2.35);
    const cornerStudGeo = new THREE.BoxGeometry(0.2, 0.08, 0.2);

    junctions.forEach(j => {
      const surfaceY = this.worldPhysics
        ? this.worldPhysics.getGroundHeight(j.x, j.z, 0, true, true)
        : j.y;
      const jy = Math.max(j.y, surfaceY);

      // Placa de cruce con textura especializada y renderOrder superior (sin Z-fighting)
      const jMesh = new THREE.Mesh(junctionGeo, junctionMat);
      jMesh.rotation.x = -Math.PI / 2;
      jMesh.position.set(j.x, jy + 0.029, j.z);
      jMesh.receiveShadow = true;
      jMesh.renderOrder = 20;
      this.visualGroup.add(jMesh);

      // Topes esquineros remachados para delimitar el cruce
      for (const ox of [-1.05, 1.05]) {
        for (const oz of [-1.05, 1.05]) {
          const stud = new THREE.Mesh(cornerStudGeo, tieMat);
          stud.position.set(j.x + ox, jy + 0.045, j.z + oz);
          this.visualGroup.add(stud);
        }
      }
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
          ? this.worldPhysics.getGroundHeight(midX, midZ, 0, true, true)
          : midRefY;
        const py = Math.max(midRefY, surfaceY);

        // Comprobar si este tramo o sus extremos caen dentro de un cruce
        const isNearJunction = junctions.some(j =>
          Math.hypot(midX - j.x, midZ - j.z) < 1.25 ||
          Math.hypot(a.x - j.x, a.z - j.z) < 0.95 ||
          Math.hypot(b.x - j.x, b.z - j.z) < 0.95
        );

        // 1. Plancha / Pasarela metálica de suelo (1.35m de ancho)
        const walkGeo = new THREE.PlaneGeometry(1.35, segLen + 0.06);
        const walkMesh = new THREE.Mesh(walkGeo, walkwayMat);
        walkMesh.rotation.x = -Math.PI / 2;
        walkMesh.rotation.z = yaw;
        walkMesh.position.set(midX, py + 0.025, midZ);
        walkMesh.receiveShadow = true;
        this.visualGroup.add(walkMesh);

        // 2. Rieles laterales de acero 3D (se omiten dentro del cruce para no cortar el camino transversal)
        if (!isNearJunction) {
          const railGeo = new THREE.BoxGeometry(0.08, 0.06, segLen + 0.04);
          const railL = new THREE.Mesh(railGeo, railMat);
          railL.rotation.y = yaw;
          railL.position.set(midX - right.x * 0.62, py + 0.045, midZ - right.z * 0.62);

          const railR = new THREE.Mesh(railGeo, railMat);
          railR.rotation.y = yaw;
          railR.position.set(midX + right.x * 0.62, py + 0.045, midZ + right.z * 0.62);

          this.visualGroup.add(railL, railR);
        }

        // 3. Traviesas metálicas transversales cada tramo (se omiten dentro del cruce)
        const isTieInJunction = junctions.some(j => Math.hypot(a.x - j.x, a.z - j.z) < 1.15);
        if (!isTieInJunction) {
          const tieGeo = new THREE.BoxGeometry(1.4, 0.035, 0.24);
          const tieMesh = new THREE.Mesh(tieGeo, tieMat);
          tieMesh.rotation.y = yaw;
          tieMesh.position.set(a.x, a.y + 0.035, a.z);
          this.visualGroup.add(tieMesh);
        }

        // 4. Flechas de flujo en el centro de la pasarela (apuntan estrictamente hacia la salida)
        // Se colocan en el centro del tramo elevadas sobre la pasarela (libres de la traviesa)
        if (segLen >= 0.7) {
          const spawnArrow = (t) => {
            const px = a.x + dir.x * segLen * t;
            const pz = a.z + dir.z * segLen * t;

            // Omitir flechas si caen dentro de la plataforma de cruce
            const isArrowInJunction = junctions.some(j => Math.hypot(px - j.x, pz - j.z) < 1.05);
            if (isArrowInJunction) return;

            const refY = a.y + (b.y - a.y) * t;
            const gY = this.worldPhysics
              ? this.worldPhysics.getGroundHeight(px, pz, 0, true, true)
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
            ? this.worldPhysics.getGroundHeight(a.x + right.x * 1.05, a.z + right.z * 1.05, 0, true, true)
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
