// Modelos 3D cartoon con MeshToonMaterial y contorno por inverted hull.
// AssetFactory los clona y los cachea; este módulo solo construye plantillas.
// Exports: MODEL_IDS, createModelFactory.

import * as THREE from 'three';
import { PALETTE } from './palette.js';

const OUTLINE_SCALE = 1.055;

function createGradientMap() {
  const data = new Uint8Array([64, 128, 196, 255]);
  const texture = new THREE.DataTexture(data, 4, 1, THREE.RedFormat);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

function createModelBuilders(api) {
  const { mat, mesh, group, THREE: T } = api;

  function carrot() {
    const root = group('carrot');
    const bodyMat = mat(PALETTE.tomato);
    const body = new T.Mesh(new T.ConeGeometry(0.31, 1.22, 10, 1), bodyMat);
    body.rotation.z = Math.PI;
    body.position.y = 0.64;
    root.add(mesh(body, 0.062));

    const cap = new T.Mesh(new T.SphereGeometry(0.29, 12, 8), mat(PALETTE.coral));
    cap.scale.set(1, 0.52, 1);
    cap.position.y = 1.23;
    root.add(mesh(cap, 0.055));

    const ridgeMat = mat(PALETTE.coralDark);
    for (let i = 0; i < 3; i++) {
      const ridge = new T.Mesh(new T.TorusGeometry(0.24 - i * 0.045, 0.012, 4, 16), ridgeMat);
      ridge.rotation.x = Math.PI / 2;
      ridge.position.y = 0.98 - i * 0.28;
      root.add(mesh(ridge, 0));
    }

    const leafMat = mat(PALETTE.leaf);
    const leafDark = mat(PALETTE.leafDark);
    const leaves = [
      { x: 0, z: 0, rz: 0.05, ry: 0, h: 0.62 },
      { x: 0.12, z: 0.04, rz: -0.36, ry: 0.5, h: 0.56 },
      { x: -0.12, z: -0.03, rz: 0.36, ry: -0.5, h: 0.52 }
    ];
    for (const leaf of leaves) {
      const cone = new T.Mesh(new T.ConeGeometry(0.075, leaf.h, 5), leafMat);
      cone.position.set(leaf.x, 1.38 + leaf.h * 0.3, leaf.z);
      cone.rotation.z = leaf.rz;
      cone.rotation.y = leaf.ry;
      root.add(mesh(cone, 0.045));
      const vein = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, leaf.h * 0.7, 4), leafDark);
      vein.position.set(leaf.x, 1.34 + leaf.h * 0.24, leaf.z + 0.02);
      vein.rotation.z = leaf.rz;
      vein.rotation.y = leaf.ry;
      root.add(mesh(vein, 0));
    }
    return root;
  }

  function knife() {
    const root = group('knife');
    const bladeShape = new T.Shape();
    bladeShape.moveTo(-1.0, 0.02);
    bladeShape.quadraticCurveTo(-0.2, 0.19, 0.9, 0.11);
    bladeShape.quadraticCurveTo(1.02, 0.09, 1.05, 0.02);
    bladeShape.quadraticCurveTo(0.92, -0.14, 0.4, -0.2);
    bladeShape.quadraticCurveTo(-0.3, -0.25, -1.0, 0.02);
    const bladeGeo = new T.ExtrudeGeometry(bladeShape, {
      depth: 0.075,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 2,
      steps: 1
    });
    bladeGeo.center();
    const blade = new T.Mesh(bladeGeo, mat(PALETTE.steel, { emissive: new T.Color(PALETTE.steelDark) }));
    blade.position.set(0, 0.62, 0);
    root.add(mesh(blade, 0.045));

    const shine = new T.Mesh(new T.BoxGeometry(1.25, 0.025, 0.085), mat(PALETTE.steelLight));
    shine.position.set(0.05, 0.6, 0.04);
    shine.rotation.z = -0.03;
    root.add(mesh(shine, 0));

    const handle = new T.Mesh(new T.CylinderGeometry(0.09, 0.11, 0.64, 10), mat(PALETTE.woodDark));
    handle.rotation.z = Math.PI / 2;
    handle.position.set(-1.32, 0.62, 0);
    root.add(mesh(handle, 0.05));

    const bolster = new T.Mesh(new T.BoxGeometry(0.1, 0.24, 0.16), mat(PALETTE.steelDark));
    bolster.position.set(-1.0, 0.62, 0);
    root.add(mesh(bolster, 0.035));

    for (let i = 0; i < 2; i++) {
      const rivet = new T.Mesh(new T.SphereGeometry(0.025, 8, 6), mat(PALETTE.gold));
      rivet.position.set(-1.2 - i * 0.22, 0.62, 0.11);
      root.add(mesh(rivet, 0));
    }
    return root;
  }

  function pot() {
    const root = group('pot');
    const body = new T.Mesh(new T.CylinderGeometry(0.72, 0.62, 0.8, 24), mat(PALETTE.steelDark));
    body.position.y = 0.4;
    root.add(mesh(body, 0.055));

    const rim = new T.Mesh(new T.TorusGeometry(0.72, 0.07, 8, 24), mat(PALETTE.steel));
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.8;
    root.add(mesh(rim, 0.045));

    const soup = new T.Mesh(new T.CircleGeometry(0.66, 24), mat(PALETTE.coral, { side: T.DoubleSide }));
    soup.rotation.x = -Math.PI / 2;
    soup.position.y = 0.78;
    root.add(mesh(soup, 0));

    const bubbleMat = mat(PALETTE.mango);
    for (let i = 0; i < 4; i++) {
      const bubble = new T.Mesh(new T.SphereGeometry(0.045 + (i % 2) * 0.02, 8, 6), bubbleMat);
      bubble.position.set(-0.35 + i * 0.23, 0.8, 0.12 * Math.sin(i * 1.7));
      root.add(mesh(bubble, 0.02));
    }

    const handleMat = mat(PALETTE.steel);
    for (const side of [-1, 1]) {
      const handle = new T.Mesh(new T.TorusGeometry(0.19, 0.05, 6, 14, Math.PI), handleMat);
      handle.rotation.z = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      handle.position.set(side * 0.8, 0.62, 0);
      root.add(mesh(handle, 0.04));
    }

    const rivetMat = mat(PALETTE.steelLight);
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const rivet = new T.Mesh(new T.SphereGeometry(0.025, 6, 5), rivetMat);
      rivet.position.set(Math.cos(angle) * 0.68, 0.3, Math.sin(angle) * 0.68);
      root.add(mesh(rivet, 0));
    }
    return root;
  }

  function pan() {
    const root = group('pan');
    const body = new T.Mesh(new T.CylinderGeometry(0.68, 0.58, 0.16, 24), mat(PALETTE.steel));
    body.position.y = 0.08;
    root.add(mesh(body, 0.055));

    const rim = new T.Mesh(new T.TorusGeometry(0.68, 0.045, 6, 24), mat(PALETTE.steelDark));
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.16;
    root.add(mesh(rim, 0.035));

    const oil = new T.Mesh(new T.CircleGeometry(0.56, 24), mat(PALETTE.pineapple, { transparent: true, opacity: 0.55, side: T.DoubleSide }));
    oil.rotation.x = -Math.PI / 2;
    oil.position.y = 0.168;
    root.add(mesh(oil, 0));

    const eggWhite = new T.Mesh(new T.SphereGeometry(0.3, 16, 10), mat(PALETTE.salt));
    eggWhite.scale.set(1.15, 0.18, 0.82);
    eggWhite.position.set(-0.08, 0.2, 0);
    root.add(mesh(eggWhite, 0.035));

    const yolk = new T.Mesh(new T.SphereGeometry(0.105, 12, 8), mat(PALETTE.mango));
    yolk.scale.set(1, 0.72, 1);
    yolk.position.set(-0.02, 0.27, 0.02);
    root.add(mesh(yolk, 0.03));

    const handle = new T.Mesh(new T.BoxGeometry(1.1, 0.095, 0.14), mat(PALETTE.woodDark));
    handle.position.set(1.15, 0.14, 0);
    handle.rotation.z = -0.06;
    root.add(mesh(handle, 0.05));

    const hole = new T.Mesh(new T.TorusGeometry(0.05, 0.018, 5, 10), mat(PALETTE.wood));
    hole.rotation.x = Math.PI / 2;
    hole.position.set(1.62, 0.18, 0);
    root.add(mesh(hole, 0.02));
    return root;
  }

  function fishingRod() {
    const root = group('fishingRod');
    root.rotation.z = -0.24;
    const handle = new T.Mesh(new T.CylinderGeometry(0.07, 0.095, 0.52, 8), mat(PALETTE.woodDark));
    handle.position.y = 0.27;
    root.add(mesh(handle, 0.05));

    const rod = new T.Mesh(new T.CylinderGeometry(0.024, 0.055, 1.9, 6), mat(PALETTE.woodLight));
    rod.position.y = 1.18;
    root.add(mesh(rod, 0.04));

    const reel = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 0.09, 12), mat(PALETTE.steel));
    reel.rotation.x = Math.PI / 2;
    reel.position.set(0.17, 0.58, 0);
    root.add(mesh(reel, 0.04));

    const reelHub = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.16, 8), mat(PALETTE.coral));
    reelHub.rotation.x = Math.PI / 2;
    reelHub.position.set(0.17, 0.58, 0);
    root.add(mesh(reelHub, 0.025));

    const knob = new T.Mesh(new T.SphereGeometry(0.045, 8, 6), mat(PALETTE.coralDark));
    knob.position.set(0.34, 0.5, 0.12);
    root.add(mesh(knob, 0.02));

    const linePoints = [
      new T.Vector3(0, 2.14, 0),
      new T.Vector3(0.32, 1.7, 0.18),
      new T.Vector3(0.62, 1.1, 0.32),
      new T.Vector3(0.74, 0.52, 0.4)
    ];
    const lineGeo = new T.BufferGeometry().setFromPoints(linePoints);
    const line = new T.Line(lineGeo, new T.LineBasicMaterial({ color: PALETTE.cream, transparent: true, opacity: 0.85 }));
    root.add(line);

    const bobber = new T.Mesh(new T.SphereGeometry(0.085, 10, 8), mat(PALETTE.coral));
    bobber.position.set(0.74, 0.44, 0.4);
    root.add(mesh(bobber, 0.035));
    const band = new T.Mesh(new T.TorusGeometry(0.087, 0.022, 5, 12), mat(PALETTE.salt));
    band.rotation.x = Math.PI / 2;
    band.position.set(0.74, 0.44, 0.4);
    root.add(mesh(band, 0.015));
    return root;
  }

  function shovel() {
    const root = group('shovel');
    const handle = new T.Mesh(new T.CylinderGeometry(0.045, 0.06, 1.25, 8), mat(PALETTE.woodLight));
    handle.position.y = 1.05;
    root.add(mesh(handle, 0.045));

    const grip = new T.Mesh(new T.TorusGeometry(0.18, 0.04, 6, 18), mat(PALETTE.wood));
    grip.position.y = 1.72;
    root.add(mesh(grip, 0.04));

    const crossbar = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 0.34, 6), mat(PALETTE.woodDark));
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position.y = 1.55;
    root.add(mesh(crossbar, 0.03));

    const bladeShape = new T.Shape();
    bladeShape.moveTo(0, 0.55);
    bladeShape.quadraticCurveTo(0.34, 0.4, 0.32, -0.18);
    bladeShape.quadraticCurveTo(0.26, -0.46, 0, -0.56);
    bladeShape.quadraticCurveTo(-0.26, -0.46, -0.32, -0.18);
    bladeShape.quadraticCurveTo(-0.34, 0.4, 0, 0.55);
    const bladeGeo = new T.ExtrudeGeometry(bladeShape, {
      depth: 0.08,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 2,
      steps: 1
    });
    bladeGeo.center();
    const blade = new T.Mesh(bladeGeo, mat(PALETTE.steel, { emissive: new T.Color(PALETTE.steelDark) }));
    blade.position.set(0, 0.35, 0);
    root.add(mesh(blade, 0.05));

    const spine = new T.Mesh(new T.BoxGeometry(0.06, 0.86, 0.12), mat(PALETTE.steelDark));
    spine.position.set(0, 0.4, 0.05);
    root.add(mesh(spine, 0.025));
    return root;
  }

  function fish() {
    const root = group('fish');
    const body = new T.Mesh(new T.SphereGeometry(0.62, 16, 12), mat(PALETTE.lagoon));
    body.scale.set(1.22, 0.62, 0.44);
    body.position.y = 0.62;
    root.add(mesh(body, 0.055));

    const belly = new T.Mesh(new T.SphereGeometry(0.42, 12, 8), mat(PALETTE.cream));
    belly.scale.set(1.0, 0.24, 0.34);
    belly.position.set(0.12, 0.43, 0.03);
    root.add(mesh(belly, 0.025));

    const tailShape = new T.Shape();
    tailShape.moveTo(0, 0.28);
    tailShape.quadraticCurveTo(-0.34, 0.48, -0.5, 0.18);
    tailShape.quadraticCurveTo(-0.38, 0, -0.5, -0.2);
    tailShape.quadraticCurveTo(-0.32, -0.46, 0, -0.3);
    tailShape.closePath();
    const tailGeo = new T.ExtrudeGeometry(tailShape, {
      depth: 0.07,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 1,
      steps: 1
    });
    tailGeo.center();
    const tail = new T.Mesh(tailGeo, mat(PALETTE.coral));
    tail.position.set(-0.78, 0.62, 0);
    tail.rotation.y = 0.05;
    root.add(mesh(tail, 0.04));

    const finMat = mat(PALETTE.coral);
    const topFin = new T.Mesh(new T.ConeGeometry(0.17, 0.34, 4), finMat);
    topFin.position.set(0.02, 1.0, 0);
    topFin.rotation.z = 0.1;
    topFin.scale.set(1, 1, 0.45);
    root.add(mesh(topFin, 0.04));

    for (const side of [-1, 1]) {
      const fin = new T.Mesh(new T.ConeGeometry(0.1, 0.28, 4), finMat);
      fin.position.set(0.1, 0.55, side * 0.3);
      fin.rotation.z = side * 0.95;
      fin.rotation.x = side * 0.2;
      fin.scale.set(1, 1, 0.35);
      root.add(mesh(fin, 0.025));
    }

    const eyeWhite = new T.Mesh(new T.SphereGeometry(0.11, 10, 8), mat(PALETTE.salt));
    eyeWhite.position.set(0.46, 0.75, 0.26);
    root.add(mesh(eyeWhite, 0.025));
    const pupil = new T.Mesh(new T.SphereGeometry(0.055, 8, 6), mat(PALETTE.ink));
    pupil.position.set(0.5, 0.75, 0.34);
    root.add(mesh(pupil, 0.015));
    const glint = new T.Mesh(new T.SphereGeometry(0.018, 6, 5), mat(PALETTE.salt));
    glint.position.set(0.52, 0.78, 0.38);
    root.add(mesh(glint, 0));

    const mouth = new T.Mesh(new T.TorusGeometry(0.075, 0.02, 4, 10, Math.PI), mat(PALETTE.coralDark));
    mouth.position.set(0.7, 0.55, 0.17);
    mouth.rotation.x = Math.PI / 2;
    mouth.rotation.z = Math.PI;
    root.add(mesh(mouth, 0.01));

    const gill = new T.Mesh(new T.TorusGeometry(0.22, 0.015, 4, 12, Math.PI), mat(PALETTE.seaDark));
    gill.position.set(0.28, 0.63, 0.28);
    gill.rotation.x = Math.PI / 2;
    gill.rotation.z = 0.4;
    root.add(mesh(gill, 0));
    return root;
  }

  return { carrot, knife, pot, pan, fishingRod, shovel, fish };
}

export const MODEL_IDS = ['carrot', 'knife', 'pot', 'pan', 'fishingRod', 'shovel', 'fish'];

// Crea una fábrica aislada con sus materiales y plantillas. AssetFactory la usa
// como cache; dispose() libera geometrías, materiales y la textura de bandas.
export function createModelFactory() {
  const gradientMap = createGradientMap();
  const outlineMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(PALETTE.ink),
    side: THREE.BackSide
  });
  const materialCache = new Map();
  const templates = new Map();
  const overrides = new Map();

  function mat(color, options = {}) {
    const key = `${color}|${JSON.stringify(options, (k, v) => (v instanceof THREE.Color ? v.getHexString() : v))}`;
    if (materialCache.has(key)) return materialCache.get(key);
    const material = new THREE.MeshToonMaterial({
      color: new THREE.Color(color),
      gradientMap,
      ...options
    });
    materialCache.set(key, material);
    return material;
  }

  function addOutline(meshObject, amount = 0.055) {
    if (!(amount > 0) || !meshObject.geometry) return;
    const outline = new THREE.Mesh(meshObject.geometry, outlineMaterial);
    outline.scale.setScalar(1 + amount);
    outline.castShadow = false;
    outline.receiveShadow = false;
    outline.name = `${meshObject.name || 'mesh'}_outline`;
    meshObject.add(outline);
  }

  function addMesh(parent, object, outline = 0.055) {
    object.castShadow = true;
    object.receiveShadow = false;
    if (outline > 0) addOutline(object, outline);
    parent.add(object);
    return object;
  }

  function mesh(object, outline = 0.055) {
    object.castShadow = true;
    object.receiveShadow = false;
    if (outline > 0) addOutline(object, outline);
    return object;
  }

  function group(name) {
    const root = new THREE.Group();
    root.name = name;
    return root;
  }

  const builders = createModelBuilders({
    THREE,
    mat,
    mesh,
    group
  });

  function buildTemplate(id) {
    const builder = overrides.get(id) || builders[id];
    if (!builder) return null;
    const template = builder();
    template.userData.mgAssetId = id;
    return template;
  }

  function getTemplate(id) {
    if (templates.has(id)) return templates.get(id);
    const template = buildTemplate(id);
    if (!template) return null;
    templates.set(id, template);
    return template;
  }

  function register(id, builder) {
    if (typeof builder !== 'function') return false;
    overrides.set(id, builder);
    // Las plantillas comparten materiales y geometrías; no las liberamos aquí
    // para no invalidar otros modelos. dispose() hace la limpieza global.
    templates.delete(id);
    return true;
  }

  function list() {
    return [...new Set([...MODEL_IDS, ...overrides.keys()])];
  }

  function disposeTemplate(template) {
    const geometries = new Set();
    const materials = new Set();
    template.traverse(child => {
      if (child.geometry) geometries.add(child.geometry);
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => materials.add(m));
        else materials.add(child.material);
      }
    });
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) {
      if (material !== outlineMaterial) material.dispose();
    }
  }

  function dispose() {
    for (const template of templates.values()) disposeTemplate(template);
    templates.clear();
    for (const material of materialCache.values()) material.dispose();
    materialCache.clear();
    outlineMaterial.dispose();
    gradientMap.dispose();
    overrides.clear();
  }

  return {
    getTemplate,
    register,
    list,
    dispose
  };
}
