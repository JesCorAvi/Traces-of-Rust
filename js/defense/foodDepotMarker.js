// Baliza holográfica de la despensa central: el objetivo que los cangrejos
// intentan saquear. No tiene colisión; representa visualmente las vidas/comida.
// Exports: FoodDepotMarker.

import * as THREE from 'three';
import { disposeObject3D } from '../utils/dispose.js';

export class FoodDepotMarker {
  constructor(scene, worldPhysics) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.elapsed = 0;
    this.flashTimer = 0;
    this.ratio = 1;

    // Delante del punto de inicio: se ve como objetivo, pero no tapa la cámara.
    const x = 0;
    const z = -6.5;
    const y = worldPhysics ? worldPhysics.getGroundHeight(x, z, 0) : 0;
    this.group.position.set(x, y, z);
    scene.add(this.group);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0xa96b3f, roughness: 0.9, flatShading: true });
    const woodDarkMat = new THREE.MeshStandardMaterial({ color: 0x6b432b, roughness: 0.94, flatShading: true });
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0xe0bd83, roughness: 0.96 });
    const fruitMats = [
      new THREE.MeshStandardMaterial({ color: 0xff6b4f, roughness: 0.7, flatShading: true }),
      new THREE.MeshStandardMaterial({ color: 0xffd15a, roughness: 0.7, flatShading: true }),
      new THREE.MeshStandardMaterial({ color: 0x7fc75a, roughness: 0.7, flatShading: true })
    ];

    this.glowMat = new THREE.MeshBasicMaterial({
      color: 0xffd15a,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    });
    this.beamMat = new THREE.MeshBasicMaterial({
      color: 0xffd15a,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false
    });

    // Anillo base y columna de luz suave.
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.55, 24), this.glowMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.04;
    this.group.add(ring);

    this.beam = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.9, 14, 16, 1, true), this.beamMat);
    this.beam.position.y = 7;
    this.beam.visible = false;
    this.group.add(this.beam);

    // Cesta holográfica flotante.
    this.basket = new THREE.Group();
    this.basket.position.y = 2.8;
    this.basket.scale.setScalar(0.72);
    this.group.add(this.basket);

    const basketBase = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.9, 1.35), woodMat);
    basketBase.position.y = 0;
    this.basket.add(basketBase);

    for (let i = 0; i < 4; i++) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 0.12), woodDarkMat);
      slat.position.set(0, -0.4 + i * 0.22, 0.72);
      this.basket.add(slat);
      const slatBack = slat.clone();
      slatBack.position.z = -0.72;
      this.basket.add(slatBack);
    }

    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.06, 6, 16, Math.PI), ropeMat);
    handle.position.set(0, 0.5, 0);
    this.basket.add(handle);

    for (let i = 0; i < 9; i++) {
      const fruit = new THREE.Mesh(new THREE.IcosahedronGeometry(0.19, 0), fruitMats[i % fruitMats.length]);
      fruit.position.set(-0.65 + (i % 3) * 0.65, 0.55 + Math.floor(i / 3) * 0.18, (i % 2) * 0.28 - 0.14);
      fruit.castShadow = false;
      this.basket.add(fruit);
    }

    // Hoja de palmera que corona la cesta.
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.85, 4), new THREE.MeshStandardMaterial({
      color: 0x4fa865, roughness: 0.8, flatShading: true, side: THREE.DoubleSide
    }));
    leaf.position.set(0.55, 0.85, 0);
    leaf.rotation.z = -0.35;
    this.basket.add(leaf);

    // Sombrilla en miniatura: refuerza la lectura de «puesto de comida».
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.15, 6), woodMat);
    pole.position.y = 1.1;
    this.basket.add(pole);
    const canopy = new THREE.Mesh(
      new THREE.ConeGeometry(0.95, 0.35, 8),
      new THREE.MeshStandardMaterial({ color: 0xff8a68, roughness: 0.85, flatShading: true })
    );
    canopy.position.y = 1.62;
    this.basket.add(canopy);
    const canopyTrim = new THREE.Mesh(
      new THREE.TorusGeometry(0.9, 0.035, 5, 12),
      new THREE.MeshStandardMaterial({ color: 0xffe2a1, roughness: 0.9 })
    );
    canopyTrim.rotation.x = Math.PI / 2;
    canopyTrim.position.y = 1.48;
    this.basket.add(canopyTrim);

    this.light = new THREE.PointLight(0xffd36b, 16, 15, 1.5);
    this.light.position.y = 2.9;
    this.group.add(this.light);

    // Un par de destellos orbitando para que se lea como objetivo holográfico.
    this.sparkles = [];
    for (let i = 0; i < 5; i++) {
      const spark = new THREE.Mesh(new THREE.IcosahedronGeometry(0.06, 0), this.glowMat);
      this.group.add(spark);
      this.sparkles.push(spark);
    }
  }

  flashDamage() {
    this.flashTimer = 0.6;
  }

  setRatio(ratio) {
    this.ratio = Math.max(0, Math.min(1, Number(ratio) || 0));
  }

  update(dt) {
    this.elapsed += dt;
    this.basket.rotation.y += dt * 0.65;
    this.basket.position.y = 2.8 + Math.sin(this.elapsed * 1.6) * 0.14;

    const danger = this.ratio < 0.3;
    const baseColor = danger ? 0xff5a45 : (this.ratio < 0.6 ? 0xffa54e : 0xffd15a);
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      this.light.intensity = 55;
      this.glowMat.opacity = 0.9;
      this.beamMat.opacity = 0.32;
      this.light.color.setHex(0xffffff);
    } else {
      const pulse = 0.72 + Math.sin(this.elapsed * 1.8) * 0.18;
      this.light.intensity = 14 + pulse * 12;
      this.glowMat.opacity = 0.3 + pulse * 0.25;
      this.beamMat.opacity = 0.1 + pulse * 0.08;
      this.glowMat.color.setHex(baseColor);
      this.beamMat.color.setHex(baseColor);
      this.light.color.setHex(baseColor);
    }

    this.sparkles.forEach((spark, i) => {
      const a = this.elapsed * 0.55 + (i / this.sparkles.length) * Math.PI * 2;
      spark.position.set(
        Math.cos(a) * 1.55,
        2.9 + Math.sin(this.elapsed * 2.2 + i) * 0.35,
        Math.sin(a) * 1.15
      );
      spark.scale.setScalar(0.7 + Math.sin(this.elapsed * 4 + i) * 0.3);
    });
  }

  destroy() {
    if (!this.group) return;
    this.scene.remove(this.group);
    disposeObject3D(this.group);
    this.group = null;
  }
}
