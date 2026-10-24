// Base procedural persistente de La Caleta del Chiringuito.
// El terreno y el mar son los del mundo compartido; este módulo añade el
// deck, la barra, la cocina, la pizarra, la campana y las luces de la isla.
// Exports: ChiringuitoIslandGeometry.

import * as THREE from 'three';
import { ISLAND } from '../config/chiringuito/island.js';
import { terrainHeightAt } from './terrain.js';
import { disposeObject3D } from '../utils/dispose.js';

function makeMat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.88,
    metalness: opts.metalness ?? 0,
    flatShading: opts.flat !== false,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    transparent: !!opts.transparent,
    opacity: opts.opacity ?? 1
  });
}

function addBox(parent, w, h, d, x, y, z, material, cast = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addPost(parent, x, z, top, material, radius = 0.11) {
  const bottom = terrainHeightAt(x, z);
  const height = Math.max(0.4, top - bottom);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.2, height, 7), material);
  post.position.set(x, bottom + height / 2, z);
  post.castShadow = true;
  parent.add(post);
  return post;
}

export class ChiringuitoIslandGeometry {
  constructor(scene, worldPhysics) {
    this.scene = scene;
    this.worldPhysics = worldPhysics;
    this.group = new THREE.Group();
    this.group.name = 'chiringuito_island_base';
    this.lights = [];
    this.levelGroups = [];
    this.physicsBoxes = [];
    this.physicsCylinders = [];
    this.elapsed = 0;
    this.visualLevel = 0;
    this.night = 0;
    this.nightTarget = 0;

    const b = ISLAND.base;
    const groundSamples = [
      terrainHeightAt(b.x, b.z),
      terrainHeightAt(b.deckMinX, b.deckMinZ),
      terrainHeightAt(b.deckMaxX, b.deckMinZ),
      terrainHeightAt(b.deckMinX, b.deckMaxZ),
      terrainHeightAt(b.deckMaxX, b.deckMaxZ)
    ];
    this.deckTop = Math.max(...groundSamples) + ISLAND.base.deckHeight;
    this.deckBottom = this.deckTop - 0.45;
    this._buildDeck();
    this._buildStand();
    this._buildUpgradeLevels();
    this._buildBoardwalk();
    this._buildFishingDock();
    this._buildLandscaping();
    this.scene.add(this.group);
  }

  _addObstacleBox(minX, maxX, minZ, maxZ, topY, bottomY = null) {
    const box = this.worldPhysics?.addWalkableBox?.({
      minX, maxX, minZ, maxZ,
      bottomY: bottomY ?? this.deckTop - 0.2,
      topY,
      isObstacle: true
    });
    if (box) this.physicsBoxes.push(box);
    return box;
  }

  _addObstacleCylinder(x, z, radius, topY) {
    const cyl = this.worldPhysics?.addCylinder?.({ x, z, r: radius, topY });
    if (cyl) this.physicsCylinders.push(cyl);
    return cyl;
  }

  _buildDeck() {
    const b = ISLAND.base;
    const wood = makeMat(0x9b6a42);
    const woodDark = makeMat(0x64442d);
    const width = b.deckMaxX - b.deckMinX;
    const depth = b.deckMaxZ - b.deckMinZ;
    const cx = (b.deckMinX + b.deckMaxX) / 2;
    const cz = (b.deckMinZ + b.deckMaxZ) / 2;

    addBox(this.group, width, 0.34, depth, cx, this.deckTop - 0.17, cz, wood, false);
    for (let i = 0; i < Math.ceil(depth / 1.1); i++) {
      const z = b.deckMinZ + 0.55 + i * 1.1;
      if (z > b.deckMaxZ - 0.2) break;
      addBox(this.group, width - 0.4, 0.035, 0.06, cx, this.deckTop + 0.045, z, woodDark, false);
    }

    for (let x = b.deckMinX + 3; x <= b.deckMaxX - 2; x += 6) {
      for (const z of [b.deckMinZ + 1.3, b.deckMaxZ - 1.3]) {
        addPost(this.group, x, z, this.deckTop - 0.05, woodDark, 0.2);
      }
    }

    const box = this.worldPhysics?.addWalkableBox?.({
      minX: b.deckMinX,
      maxX: b.deckMaxX,
      minZ: b.deckMinZ,
      maxZ: b.deckMaxZ,
      bottomY: this.deckBottom,
      topY: this.deckTop,
      isObstacle: false
    });
    if (box) this.physicsBoxes.push(box);

    const railMat = makeMat(0x795238);
    // Barandilla perimetral con apertura al muelle de pesca y entrada sur.
    const railSegments = [
      { x: cx, z: b.deckMinZ + 0.15, w: width, d: 0.14 },
      { x: b.deckMinX + 0.15, z: cz, w: 0.14, d: depth },
      { x: b.deckMaxX - 0.15, z: (75 + b.deckMaxZ) / 2, w: 0.14, d: b.deckMaxZ - 75 }
    ];
    for (const seg of railSegments) {
      addBox(this.group, seg.w, 0.12, seg.d, seg.x, this.deckTop + 0.95, seg.z, railMat, false);
      this._addObstacleBox(
        seg.x - seg.w / 2,
        seg.x + seg.w / 2,
        seg.z - seg.d / 2,
        seg.z + seg.d / 2,
        this.deckTop + 1.25
      );
    }

    // Escalinata de acceso al deck desde el paseo de clientes.
    for (let i = 0; i < 3; i++) {
      const stepTop = this.deckTop - 0.08 - i * 0.16;
      const stepZ = b.deckMaxZ + 0.35 + i * 0.62;
      addBox(
        this.group,
        5.4,
        0.16,
        0.72,
        cx,
        this.deckTop - 0.16 - i * 0.16,
        stepZ,
        woodDark,
        false
      );
      const stepBox = this.worldPhysics?.addWalkableBox?.({
        minX: cx - 2.7,
        maxX: cx + 2.7,
        minZ: stepZ - 0.36,
        maxZ: stepZ + 0.36,
        bottomY: stepTop - 0.2,
        topY: stepTop,
        isObstacle: false
      });
      if (stepBox) this.physicsBoxes.push(stepBox);
    }
  }

  _buildStand() {
    const s = ISLAND.stand;
    const baseY = this.deckTop;
    const wood = makeMat(0x8a5a34);
    const woodDark = makeMat(0x5b3d27);
    const thatch = makeMat(0xb38450, { roughness: 0.98 });
    thatch.side = THREE.DoubleSide;
    const thatchDark = makeMat(0x8f6438, { roughness: 1.0 });
    const metal = makeMat(0x4f4e44, { metalness: 0.4, roughness: 0.5 });
    const glow = new THREE.MeshBasicMaterial({ color: 0xffd27a });

    // Mostrador principal.
    addBox(this.group, 10.4, 1.25, 1.4, s.counter.x, baseY + 0.62, s.counter.z, wood);
    addBox(this.group, 10.7, 0.16, 1.65, s.counter.x, baseY + 1.3, s.counter.z, woodDark);
    addBox(this.group, 9.4, 0.08, 0.9, s.counter.x, baseY + 1.4, s.counter.z - 0.2, makeMat(0xd7b07a), false);
    this._addObstacleBox(
      s.counter.x - 5.2,
      s.counter.x + 5.2,
      s.counter.z - 0.82,
      s.counter.z + 0.82,
      baseY + 1.5,
      baseY
    );

    // Postes, vigas y tejado a dos aguas con faldón de paja. La silueta es
    // mucho más de chiringuito que una carpa cónica flotante.
    const roofY = baseY + 4.8;
    for (const [ox, oz] of [[-5.2, -1.7], [5.2, -1.7], [-5.2, 2.4], [5.2, 2.4]]) {
      addPost(this.group, s.x + ox, s.z + oz, roofY, woodDark, 0.13);
      this._addObstacleCylinder(s.x + ox, s.z + oz, 0.22, roofY);
    }
    const ridgeZ = s.z + 0.2;
    addBox(this.group, 13.2, 0.24, 0.3, s.x, roofY + 1.42, ridgeZ, woodDark, false);
    const roofPanelSouth = addBox(this.group, 13.2, 0.16, 5.7, s.x, roofY + 0.84, ridgeZ + 2.55, thatch, false);
    roofPanelSouth.rotation.x = 0.23;
    const roofPanelNorth = addBox(this.group, 13.2, 0.16, 5.7, s.x, roofY + 0.84, ridgeZ - 2.55, thatch, false);
    roofPanelNorth.rotation.x = -0.23;
    // Capas de paja: rompen la lectura de "losa amarilla" y dan grosor al alero.
    for (let row = 0; row < 5; row++) {
      for (const side of [1, -1]) {
        addBox(
          this.group,
          13.25,
          0.055,
          0.18,
          s.x,
          roofY + 0.42 + row * 0.19,
          ridgeZ + side * (1.0 + row * 1.07),
          thatchDark,
          false
        );
      }
    }
    for (const zSide of [ridgeZ + 5.75, ridgeZ - 5.75]) {
      addBox(this.group, 13.3, 0.28, 0.34, s.x, roofY - 0.12, zSide, thatchDark, false);
      for (let i = 0; i < 16; i++) {
        addBox(this.group, 0.36, 0.34, 0.12, s.x - 6.0 + i * 0.8, roofY - 0.34, zSide, thatch, false);
      }
    }
    // Vigas vistas, tirantes y postes de refuerzo bajo el tejado.
    for (const side of [1, -1]) {
      for (let i = 0; i < 4; i++) {
        const rafter = addBox(this.group, 13.0, 0.1, 0.16, s.x, roofY + 0.34 + i * 0.2, ridgeZ + side * (0.7 + i * 1.55), woodDark, false);
        rafter.rotation.x = side * 0.23;
      }
    }
    addBox(this.group, 13.4, 0.22, 0.24, s.x, roofY + 0.6, ridgeZ + 2.8, wood, false);
    for (const x of [-6.2, 6.2]) {
      addPost(this.group, s.x + x, s.z + 4.25, roofY - 0.15, woodDark, 0.11);
      this._addObstacleCylinder(s.x + x, s.z + 4.25, 0.18, roofY);
      addBox(this.group, 0.16, 0.16, 4.2, s.x + x, roofY + 0.15, s.z + 2.15, woodDark, false).rotation.x = 0.23;
    }

    // Lámparas colgantes bajo el tejado.
    for (let i = 0; i < 5; i++) {
      const lx = s.x - 4.4 + i * 2.2;
      addBox(this.group, 0.025, 0.55, 0.025, lx, baseY + 3.72, s.z + 2.5, woodDark, false);
      const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffc46b });
      const bulb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.14, 0), bulbMat);
      bulb.position.set(lx, baseY + 3.4, s.z + 2.5);
      this.group.add(bulb);
    }

    // Letrero principal con textura procedural.
    this._addChiringuitoSign(s.x, baseY + 3.55, s.z + 4.85);

    // Estantería tras la barra con botellas de colores.
    const shelfMat = makeMat(0x4b3423);
    addBox(this.group, 7.2, 0.18, 0.6, s.x, baseY + 1.65, s.counter.z - 1.5, shelfMat);
    addBox(this.group, 7.2, 0.18, 0.6, s.x, baseY + 2.45, s.counter.z - 1.5, shelfMat);
    const bottleColors = [0x6fb8a8, 0xd26b4c, 0xdfbd66, 0x8db36b, 0xb877a8];
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 8; i++) {
        const bottle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.075, 0.095, 0.42, 7),
          makeMat(bottleColors[(i + row) % bottleColors.length], { roughness: 0.45 })
        );
        bottle.position.set(s.x - 2.9 + i * 0.82, baseY + 1.95 + row * 0.8, s.counter.z - 1.5);
        this.group.add(bottle);
      }
    }
    this._addObstacleBox(
      s.x - 3.6,
      s.x + 3.6,
      s.counter.z - 1.85,
      s.counter.z - 1.15,
      baseY + 2.7,
      baseY
    );

    // Cocina: plancha, campana y fuego.
    addBox(this.group, 2.7, 1.2, 1.45, s.kitchen.x, baseY + 0.6, s.kitchen.z, metal);
    addBox(this.group, 2.9, 0.12, 1.65, s.kitchen.x, baseY + 1.24, s.kitchen.z, makeMat(0x2d2c27), false);
    const grill = addBox(this.group, 1.7, 0.08, 0.85, s.kitchen.x, baseY + 1.33, s.kitchen.z, makeMat(0x2a2520), false);
    this._addObstacleBox(
      s.kitchen.x - 1.55,
      s.kitchen.x + 1.55,
      s.kitchen.z - 0.92,
      s.kitchen.z + 0.92,
      baseY + 1.55,
      baseY
    );
    const hood = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.55, 1.5), makeMat(0x3a352d));
    hood.position.set(s.kitchen.x, baseY + 2.3, s.kitchen.z);
    hood.castShadow = true;
    this.group.add(hood);
    this.grillGlow = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.7), new THREE.MeshBasicMaterial({
      color: 0xff7f3c,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    }));
    this.grillGlow.rotation.x = -Math.PI / 2;
    this.grillGlow.position.set(s.kitchen.x, baseY + 1.44, s.kitchen.z);
    this.group.add(this.grillGlow);
    const fireLight = new THREE.PointLight(0xff7f3c, 3.8, 8, 1.8);
    fireLight.position.set(s.kitchen.x, baseY + 1.6, s.kitchen.z);
    this.group.add(fireLight);
    this.lights.push({ light: fireLight, base: fireLight.intensity, phase: 1.4, fire: true });

    // Pase de platos.
    addBox(this.group, 2.0, 0.14, 1.0, s.pass.x, baseY + 1.38, s.pass.z, makeMat(0x4b4a43, { metalness: 0.3 }));
    for (let i = 0; i < 3; i++) {
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.035, 12), makeMat(0xe7dfcc));
      plate.position.set(s.pass.x - 0.55 + i * 0.55, baseY + 1.48, s.pass.z);
      this.group.add(plate);
    }

    // Pizarra del menú, con marco de madera y patas.
    addPost(this.group, s.menuBoard.x - 0.72, s.menuBoard.z + 0.08, baseY + 1.95, woodDark, 0.09);
    addPost(this.group, s.menuBoard.x + 0.72, s.menuBoard.z + 0.08, baseY + 1.95, woodDark, 0.09);
    addBox(this.group, 1.92, 1.28, 0.1, s.menuBoard.x, baseY + 1.48, s.menuBoard.z - 0.05, woodDark);
    addBox(this.group, 1.7, 1.08, 0.12, s.menuBoard.x, baseY + 1.48, s.menuBoard.z + 0.03, makeMat(0x23302a));
    this._addObstacleBox(
      s.menuBoard.x - 0.98,
      s.menuBoard.x + 0.98,
      s.menuBoard.z - 0.15,
      s.menuBoard.z + 0.22,
      baseY + 2.1,
      baseY
    );
    for (let i = 0; i < 4; i++) {
      addBox(this.group, 1.2, 0.035, 0.02, s.menuBoard.x, baseY + 1.08 + i * 0.2, s.menuBoard.z + 0.1, makeMat(0xe3d9b5), false);
    }
    addBox(this.group, 0.9, 0.08, 0.02, s.menuBoard.x, baseY + 1.86, s.menuBoard.z + 0.1, makeMat(0xe0b04f), false);

    // Campana de servicio y letrero.
    addBox(this.group, 0.18, 0.85, 0.18, s.bell.x, baseY + 0.42, s.bell.z, woodDark);
    this.bell = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), makeMat(0xd6b15b, { metalness: 0.5, roughness: 0.35 }));
    this.bell.position.set(s.bell.x, baseY + 0.96, s.bell.z);
    this.bell.rotation.x = Math.PI;
    this.group.add(this.bell);

    // Detalles: barriles, cajas de fruta y cuerdas.
    const barrelMat = makeMat(0x6f4d33);
    for (const [x, z] of [[-8.1, 79.7], [8.7, 79.7], [-7.4, 86.0]]) {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.9, 8), barrelMat);
      barrel.position.set(x, baseY + 0.45, z);
      barrel.castShadow = true;
      this.group.add(barrel);
      this._addObstacleCylinder(x, z, 0.54, baseY + 1.0);
    }

    // Guirnalda de luces cálidas.
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffd27a });
    const pointPositions = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      const x = -6.2 + t * 12.4;
      const z = s.counter.z + 2.3;
      const y = baseY + 3.25 - Math.sin(t * Math.PI) * 0.45;
      pointPositions.push(new THREE.Vector3(x, y, z));
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), bulbMat);
      bulb.position.set(x, y, z);
      this.group.add(bulb);
    }
    if (pointPositions.length > 1) {
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pointPositions),
        new THREE.LineBasicMaterial({ color: 0x5d4225 })
      );
      this.group.add(line);
    }
    const stringLight = new THREE.PointLight(0xffb05c, 6.2, 17, 1.7);
    stringLight.position.set(0, baseY + 3.2, s.counter.z + 2);
    this.group.add(stringLight);
    this.lights.push({ light: stringLight, base: stringLight.intensity, phase: 0.3, fire: false });
  }

  _buildLandscaping() {
    const palmMat = makeMat(0x7d5836, { roughness: 0.95 });
    const leafMat = makeMat(0x477f4b, { roughness: 0.9 });
    const spots = [
      [-31, 103], [-48, 92], [-28, 118], [36, 108], [55, 92], [62, 68], [46, 122]
    ];
    for (const [x, z] of spots) {
      const y = terrainHeightAt(x, z);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 4.8, 7), palmMat);
      trunk.position.set(x, y + 2.4, z);
      trunk.rotation.z = (x + z) % 2 ? 0.08 : -0.06;
      trunk.castShadow = true;
      this.group.add(trunk);
      this._addObstacleCylinder(x, z, 0.38, y + 4.6);
      for (let i = 0; i < 7; i++) {
        const ang = (i / 7) * Math.PI * 2;
        const frond = new THREE.Mesh(new THREE.ConeGeometry(0.28, 3.0, 4), leafMat);
        frond.position.set(x + Math.cos(ang) * 1.05, y + 4.55, z + Math.sin(ang) * 1.05);
        frond.rotation.z = Math.PI / 2 + Math.cos(ang) * 0.65;
        frond.rotation.x = Math.sin(ang) * 0.65;
        frond.castShadow = true;
        this.group.add(frond);
      }
    }
    // Rocas de paisaje secas alrededor de la cala.
    const rockMat = makeMat(0x6e685b);
    for (const [x, z, sc] of [[-24, 111, 0.9], [38, 95, 0.7], [58, 82, 1.1], [-43, 108, 0.8]]) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(sc, 0), rockMat);
      rock.position.set(x, terrainHeightAt(x, z) + sc * 0.4, z);
      rock.scale.set(1.3, 0.7, 1.0);
      rock.castShadow = true;
      this.group.add(rock);
    }
  }

  _addChiringuitoSign(x, y, z) {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 192;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1d2b25';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#c6a15c';
    ctx.lineWidth = 13;
    ctx.strokeRect(9, 9, canvas.width - 18, canvas.height - 18);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f2ce7a';
    ctx.font = 'bold 66px monospace';
    ctx.fillText('CHIRINGUITO', canvas.width / 2, 92);
    ctx.fillStyle = '#a9d8c8';
    ctx.font = 'bold 35px monospace';
    ctx.fillText('DEL ATARDECER', canvas.width / 2, 145);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(5.6, 1.4),
      new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, toneMapped: false })
    );
    sign.position.set(x, y, z);
    this.group.add(sign);
    addBox(this.group, 5.75, 1.55, 0.09, x, y, z - 0.07, makeMat(0x4b3423), false);
    const light = new THREE.PointLight(0xffc871, 3.0, 9, 1.8);
    light.position.set(x, y - 0.55, z + 0.2);
    this.group.add(light);
    this.lights.push({ light, base: light.intensity, phase: 0.7, fire: false });
  }

  _buildFishingDock() {
    const fishing = ISLAND.fishing;
    if (!fishing) return;
    const { dock, lagoon, spot } = fishing;
    const wood = makeMat(0x8b5f3d);
    const woodDark = makeMat(0x5a3b27);
    // La laguna es una alberca de marea por debajo del muelle: no debe tapar
    // las tablas ni los pies del jugador, y las dunas altas hacen de orilla.
    const waterY = this.deckTop - 0.34;

    // Laguna artificial de marea y orilla rocosa.
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(lagoon.width, lagoon.depth),
      new THREE.MeshStandardMaterial({
        color: 0x2f8796,
        roughness: 0.25,
        metalness: 0.12,
        transparent: true,
        opacity: 0.86,
        emissive: 0x0b3540,
        emissiveIntensity: 0.25
      })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(lagoon.x, waterY, lagoon.z);
    water.receiveShadow = true;
    this.group.add(water);
    const foam = new THREE.Mesh(
      new THREE.RingGeometry(Math.min(lagoon.width, lagoon.depth) * 0.34, Math.min(lagoon.width, lagoon.depth) * 0.37, 24),
      new THREE.MeshBasicMaterial({ color: 0xbfe8df, transparent: true, opacity: 0.16, side: THREE.DoubleSide })
    );
    foam.rotation.x = -Math.PI / 2;
    foam.position.set(lagoon.x, waterY + 0.015, lagoon.z);
    this.group.add(foam);

    const rockMat = makeMat(0x6b6658);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const x = lagoon.x + Math.cos(a) * lagoon.width * 0.48;
      const z = lagoon.z + Math.sin(a) * lagoon.depth * 0.48;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.45 + (i % 3) * 0.12, 0), rockMat);
      rock.position.set(x, terrainHeightAt(x, z) + 0.2, z);
      rock.scale.set(1.2, 0.65, 1.0);
      rock.castShadow = true;
      this.group.add(rock);
      this._addObstacleCylinder(x, z, 0.55 + (i % 3) * 0.1, terrainHeightAt(x, z) + 0.9);
    }

    // Muelle de madera que sale del deck.
    const dockWidth = dock.maxX - dock.minX;
    const dockDepth = dock.maxZ - dock.minZ;
    const dockCx = (dock.minX + dock.maxX) / 2;
    const dockCz = (dock.minZ + dock.maxZ) / 2;
    addBox(this.group, dockWidth, 0.24, dockDepth, dockCx, this.deckTop - 0.1, dockCz, wood, false);
    for (let i = 0; i < 8; i++) {
      const x = dock.minX + 0.5 + i * (dockWidth - 1) / 7;
      addBox(this.group, 0.08, 0.04, dockDepth - 0.3, x, this.deckTop + 0.035, dockCz, woodDark, false);
    }
    const dockBox = this.worldPhysics?.addWalkableBox?.({
      minX: dock.minX,
      maxX: dock.maxX,
      minZ: dock.minZ,
      maxZ: dock.maxZ,
      bottomY: this.deckTop - 0.5,
      topY: this.deckTop,
      isObstacle: false
    });
    if (dockBox) this.physicsBoxes.push(dockBox);
    for (const [x, z] of [[dock.minX + 0.6, dock.minZ + 0.5], [dock.maxX - 0.6, dock.minZ + 0.5], [dock.minX + 0.6, dock.maxZ - 0.5], [dock.maxX - 0.6, dock.maxZ - 0.5]]) {
      addPost(this.group, x, z, this.deckTop + 0.6, woodDark, 0.13);
    }
    this._addObstacleBox(dock.minX, dock.maxX, dock.minZ, dock.minZ + 0.12, this.deckTop + 0.95);
    this._addObstacleBox(dock.minX, dock.maxX, dock.maxZ - 0.12, dock.maxZ, this.deckTop + 0.95);

    // Puesto de pesca: banqueta, caña y cartel.
    const stoolX = spot.x - 1.25;
    const stoolZ = spot.z;
    addBox(this.group, 0.9, 0.14, 0.65, stoolX, this.deckTop + 0.48, stoolZ, woodDark);
    for (const [ox, oz] of [[-0.3, -0.22], [0.3, -0.22], [-0.3, 0.22], [0.3, 0.22]]) {
      addPost(this.group, stoolX + ox, stoolZ + oz, this.deckTop + 0.45, woodDark, 0.06);
    }
    this._addObstacleBox(stoolX - 0.5, stoolX + 0.5, stoolZ - 0.4, stoolZ + 0.4, this.deckTop + 0.9);
    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.035, 2.4, 5),
      makeMat(0x9b7a4d, { roughness: 0.5 })
    );
    rod.position.set(spot.x - 0.15, this.deckTop + 1.15, spot.z - 0.1);
    rod.rotation.z = -0.32;
    rod.rotation.x = 0.25;
    this.group.add(rod);
    addPost(this.group, spot.x + 0.35, spot.z + 0.3, this.deckTop + 2.0, woodDark, 0.06);
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 256;
    signCanvas.height = 80;
    const signCtx = signCanvas.getContext('2d');
    signCtx.fillStyle = '#1d2b25';
    signCtx.fillRect(0, 0, 256, 80);
    signCtx.strokeStyle = '#b79a5f';
    signCtx.lineWidth = 7;
    signCtx.strokeRect(4, 4, 248, 72);
    signCtx.fillStyle = '#f2ce7a';
    signCtx.font = 'bold 34px monospace';
    signCtx.textAlign = 'center';
    signCtx.fillText('PESCA', 128, 39);
    signCtx.fillStyle = '#8fd9c8';
    signCtx.font = 'bold 18px monospace';
    signCtx.fillText('LAGUNA', 128, 62);
    const signTex = new THREE.CanvasTexture(signCanvas);
    signTex.colorSpace = THREE.SRGBColorSpace;
    signTex.minFilter = THREE.NearestFilter;
    signTex.magFilter = THREE.NearestFilter;
    signTex.generateMipmaps = false;
    const fishingSign = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 0.5),
      new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide, toneMapped: false })
    );
    fishingSign.position.set(spot.x + 0.35, this.deckTop + 1.9, spot.z + 0.38);
    this.group.add(fishingSign);
    addBox(this.group, 1.7, 0.6, 0.06, spot.x + 0.35, this.deckTop + 1.9, spot.z + 0.32, makeMat(0x27312d));
    const signLight = new THREE.PointLight(0x8fd9c8, 2.2, 6, 1.8);
    signLight.position.set(spot.x, this.deckTop + 2.2, spot.z + 0.4);
    this.group.add(signLight);
    this.lights.push({ light: signLight, base: signLight.intensity, phase: 1.1, fire: false });

    // Un par de rocas y vegetación para integrar la laguna en la playa.
    for (let i = 0; i < 5; i++) {
      const angle = Math.PI * (0.15 + i * 0.16);
      const x = lagoon.x - Math.cos(angle) * (lagoon.width * 0.48);
      const z = lagoon.z + Math.sin(angle) * (lagoon.depth * 0.42);
      const plant = new THREE.Mesh(
        new THREE.ConeGeometry(0.32, 1.4 + (i % 3) * 0.3, 5),
        makeMat(0x3f7e52, { roughness: 0.9 })
      );
      plant.position.set(x, terrainHeightAt(x, z) + 0.65, z);
      plant.rotation.z = (i % 2 ? 0.12 : -0.1);
      plant.castShadow = true;
      this.group.add(plant);
    }
  }

  _buildUpgradeLevels() {
    const s = ISLAND.stand;
    const baseY = this.deckTop;
    const wood = makeMat(0x6c482e);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffd68a });

    const level1 = new THREE.Group();
    const awningMat = makeMat(0xc49a5c, { roughness: 0.98 });
    const awning = addBox(level1, 10.2, 0.18, 7.0, s.x + 7.0, baseY + 3.35, s.z + 1.0, awningMat, false);
    awning.rotation.x = 0.08;
    for (let i = 0; i < 8; i++) {
      addBox(level1, 10.0, 0.08, 0.12, s.x + 7.0, baseY + 2.9 - i * 0.02, s.z - 2.3 + i * 0.66, awningMat, false);
    }
    for (const [x, z] of [[2.2, -2.2], [11.8, -2.2], [2.2, 4.2], [11.8, 4.2]]) {
      addPost(level1, s.x + x, s.z + z, baseY + 3.3, wood);
    }
    level1.visible = false;
    this.group.add(level1);

    const level2 = new THREE.Group();
    const sign = addBox(level2, 4.8, 0.9, 0.16, s.x, baseY + 4.1, s.z - 1.9, makeMat(0x2a4a42));
    const signLight = new THREE.PointLight(0xffcf87, 4.0, 10, 1.8);
    signLight.position.set(s.x, baseY + 4.25, s.z - 1.5);
    level2.add(signLight);
    for (let i = 0; i < 6; i++) {
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4), glowMat);
      bulb.position.set(s.x - 2.1 + i * 0.84, baseY + 4.1, s.z - 1.98);
      level2.add(bulb);
    }
    level2.visible = false;
    this.group.add(level2);

    const level3 = new THREE.Group();
    const stageDeck = addBox(level3, 6.2, 0.32, 2.2, s.x, baseY + 0.16, s.z + 7.4, wood);
    stageDeck.receiveShadow = true;
    for (let i = 0; i < 4; i++) {
      const spotlight = new THREE.PointLight(i % 2 ? 0xffb37a : 0x8fe0cb, 3.5, 12, 1.7);
      spotlight.position.set(s.x - 2.4 + i * 1.6, baseY + 2.4, s.z + 6.8);
      level3.add(spotlight);
    }
    level3.visible = false;
    this.group.add(level3);

    this.levelGroups = [
      { level: 1, group: level1 },
      { level: 2, group: level2 },
      { level: 3, group: level3 }
    ];
  }

  _buildBoardwalk() {
    const c = ISLAND.customer;
    const wood = makeMat(0x7b5739);
    const startZ = ISLAND.base.deckMaxZ;
    const endZ = c.spawn.z + 1;
    const centerX = (ISLAND.base.deckMinX + ISLAND.base.deckMaxX) / 2;
    let z = startZ;
    while (z < endZ) {
      const y = terrainHeightAt(centerX, z) + 0.10;
      addBox(this.group, 5.6, 0.12, 2.0, centerX, y, z + 1, wood, false);
      // El paseo también es superficie caminable: sin esta caja los clientes
      // quedaban con los pies enterrados en las tablas.
      const plankBox = this.worldPhysics?.addWalkableBox?.({
        minX: centerX - 2.8,
        maxX: centerX + 2.8,
        minZ: z,
        maxZ: z + 2,
        bottomY: y - 0.2,
        topY: y + 0.06,
        isObstacle: false
      });
      if (plankBox) this.physicsBoxes.push(plankBox);
      z += 2;
    }
    for (let i = 0; i < 4; i++) {
      const zPos = startZ + 4 + i * 4;
      const x = centerX + (i % 2 === 0 ? -3.1 : 3.1);
      addPost(this.group, x, zPos, terrainHeightAt(x, zPos) + 2.0, makeMat(0x57412e), 0.08);
    }
  }

  setVisualLevel(level = 0) {
    this.visualLevel = Math.max(0, Math.min(3, Math.round(level)));
    for (const item of this.levelGroups) item.group.visible = this.visualLevel >= item.level;
  }

  setNight(value) {
    this.nightTarget = typeof value === 'number'
      ? Math.max(0, Math.min(1, value))
      : (value ? 1 : 0);
  }

  ringBell() {
    if (!this.bell) return;
    this.bell.userData.ring = 1;
  }

  update(dt) {
    this.elapsed += dt;
    this.night += (this.nightTarget - this.night) * (1 - Math.exp(-Math.max(0, dt) * 1.1));
    const nightGlow = 0.55 + this.night * 0.85;
    for (const entry of this.lights) {
      const flicker = entry.fire ? 0.86 + Math.sin(this.elapsed * 8 + entry.phase) * 0.12 : 0.97 + Math.sin(this.elapsed * 2 + entry.phase) * 0.03;
      entry.light.intensity = entry.base * nightGlow * flicker;
    }
    if (this.bell?.userData.ring > 0) {
      this.bell.userData.ring = Math.max(0, this.bell.userData.ring - dt * 1.8);
      this.bell.rotation.z = Math.sin(this.bell.userData.ring * 18) * 0.14 * this.bell.userData.ring;
    }
    if (this.grillGlow) {
      this.grillGlow.material.opacity = (0.5 + Math.sin(this.elapsed * 7.5) * 0.12) * (0.9 + this.night * 0.45);
    }
  }

  destroy() {
    for (const box of this.physicsBoxes) this.worldPhysics?.removeWalkableBox?.(box);
    for (const cyl of this.physicsCylinders) this.worldPhysics?.removeCylinder?.(cyl);
    this.physicsBoxes.length = 0;
    this.physicsCylinders.length = 0;
    this.scene.remove(this.group);
    disposeObject3D(this.group);
  }
}
