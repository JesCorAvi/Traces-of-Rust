// Marcadores 3D del tutorial de Defensa: anillos y haces sobre las posiciones sugeridas.
// Exports: TutorialMarkers.
import * as THREE from 'three';

const MARKER_DEFS = {
  build: { color: 0x9caf6b },
  cryo: { color: 0x6f8f9c },
  mortar: { color: 0xa54a2a }
};

export class TutorialMarkers {
  constructor(scene, worldPhysics, spots = {}) {
    this.scene = scene;
    this.markers = {};
    this.pulse = 0;
    this.build(worldPhysics, spots);
  }

  build(worldPhysics, spots) {
    Object.entries(MARKER_DEFS).forEach(([key, def]) => {
      const pos = spots[key];
      if (!pos) return;
      const y = worldPhysics
        ? worldPhysics.getGroundHeight(pos.x, pos.z, 0)
        : 0;

      const group = new THREE.Group();
      group.position.set(pos.x, y, pos.z);

      const ringMat = new THREE.MeshBasicMaterial({
        color: def.color,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.38, 28), ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.05;

      const beamMat = new THREE.MeshBasicMaterial({
        color: def.color,
        transparent: true,
        opacity: 0.22,
        depthWrite: false
      });
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.4, 6), beamMat);
      beam.position.y = 1.7;

      group.add(ring, beam);
      group.visible = false;
      this.scene.add(group);

      this.markers[key] = { group, ring, ringMat, beamMat };
    });
  }

  setActive(names) {
    const active = new Set(names || []);
    Object.entries(this.markers).forEach(([key, m]) => {
      m.group.visible = active.has(key);
    });
  }

  update(dt) {
    this.pulse += dt;
    Object.values(this.markers).forEach(m => {
      if (!m.group.visible) return;
      const pulse = 0.75 + Math.sin(this.pulse * 3.2) * 0.2;
      m.ringMat.opacity = 0.45 * pulse + 0.15;
      m.beamMat.opacity = 0.16 * pulse + 0.08;
      m.ring.scale.setScalar(0.98 + Math.sin(this.pulse * 2.1) * 0.04);
    });
  }

  dispose() {
    Object.values(this.markers).forEach(m => {
      this.scene.remove(m.group);
      m.group.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
    });
    this.markers = {};
  }
}
