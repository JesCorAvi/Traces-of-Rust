// Modelos procedurales del mobiliario del chiringuito.
// Exports: buildFurnitureModel, getFurnitureSeatOffsets.

import * as THREE from 'three';

const MAT = {
  wood: () => new THREE.MeshStandardMaterial({ color: 0x9a643d, roughness: 0.9, flatShading: true }),
  woodDark: () => new THREE.MeshStandardMaterial({ color: 0x5f3d28, roughness: 0.95, flatShading: true }),
  rope: () => new THREE.MeshStandardMaterial({ color: 0xe1c38e, roughness: 0.96 }),
  fabric: color => new THREE.MeshStandardMaterial({ color, roughness: 0.84, flatShading: true }),
  metal: () => new THREE.MeshStandardMaterial({ color: 0x5e5b51, roughness: 0.55, metalness: 0.35 }),
  leaf: () => new THREE.MeshStandardMaterial({ color: 0x4f8b4a, roughness: 0.88, flatShading: true }),
  glow: color => new THREE.MeshBasicMaterial({ color })
};

function addBox(group, size, pos, mat, cast = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
  mesh.position.set(...pos);
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addCylinder(group, rTop, rBottom, h, pos, mat, segments = 8) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, segments), mat);
  mesh.position.set(...pos);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addStool(group, x, z, yaw = 0, color = 0x9a643d) {
  const wood = MAT.wood();
  const seat = addCylinder(group, 0.36, 0.4, 0.14, [x, 0.62, z], wood, 8);
  seat.rotation.y = yaw;
  for (let i = 0; i < 3; i++) {
    const a = yaw + i * Math.PI * 2 / 3;
    const leg = addCylinder(group, 0.045, 0.06, 0.55, [x + Math.cos(a) * 0.28, 0.3, z + Math.sin(a) * 0.28], MAT.woodDark(), 5);
    leg.rotation.z = Math.cos(a) * 0.08;
    leg.rotation.x = Math.sin(a) * 0.08;
  }
}

function addChair(group, x, z, yaw = 0) {
  const wood = MAT.wood();
  addBox(group, [0.58, 0.08, 0.52], [x, 0.48, z], wood);
  addBox(group, [0.58, 0.62, 0.07], [x - Math.sin(yaw) * 0.23, 0.78, z - Math.cos(yaw) * 0.23], wood);
  for (const [ox, oz] of [[-0.22, -0.18], [0.22, -0.18], [-0.22, 0.18], [0.22, 0.18]]) {
    addCylinder(group, 0.035, 0.045, 0.46, [x + ox, 0.24, z + oz], MAT.woodDark(), 5);
  }
}

export function getFurnitureSeatOffsets(typeId) {
  switch (typeId) {
    case 'stool':
      return [{ x: 0, z: 0, yaw: 0, sitY: 0.75 }];
    case 'table':
      // Los laterales son taburetes altos; los extremos, sillas bajas.
      return [
        { x: -0.86, z: 0, yaw: Math.PI / 2, sitY: 0.75 },
        { x: 0.86, z: 0, yaw: -Math.PI / 2, sitY: 0.75 },
        { x: 0, z: -0.86, yaw: Math.PI, sitY: 0.58 },
        { x: 0, z: 0.86, yaw: 0, sitY: 0.58 }
      ];
    case 'lounger':
      return [{ x: 0, z: 0, yaw: 0, sitY: 0.56 }];
    default:
      return [];
  }
}

/**
 * Construye un grupo procedural listo para colocar en el suelo.
 * La base del grupo está en y=0; el llamador coloca el grupo en el suelo.
 */
export function buildFurnitureModel(typeId, options = {}) {
  const group = new THREE.Group();
  const accent = options.accentColor || 0x5e9c52;

  switch (typeId) {
    case 'stool': {
      addStool(group, 0, 0, 0, accent);
      break;
    }
    case 'table': {
      const wood = MAT.wood();
      addBox(group, [2.2, 0.14, 2.0], [0, 0.78, 0], wood);
      for (const [x, z] of [[-0.9, -0.78], [0.9, -0.78], [-0.9, 0.78], [0.9, 0.78]]) {
        addCylinder(group, 0.06, 0.08, 0.76, [x, 0.38, z], MAT.woodDark(), 5);
      }
      // Mantel claro, vajilla y centro de mesa: la terraza debe leerse como
      // un restaurante, no como un banco de picnic.
      addBox(group, [2.02, 0.035, 1.82], [0, 0.87, 0], MAT.fabric(0xf0e4ca), false);
      addBox(group, [2.02, 0.08, 0.08], [0, 0.82, 0], MAT.fabric(accent));
      addStool(group, -0.86, 0, Math.PI / 2);
      addStool(group, 0.86, 0, -Math.PI / 2);
      addChair(group, 0, -0.9, Math.PI);
      addChair(group, 0, 0.9, 0);
      // Los asientos llevan un cojín del color de la casa. Los taburetes son
      // más altos que las sillas: el cojín debe apoyar en cada asiento, no
      // quedar enterrado dentro de él.
      for (const [x, z, y] of [[-0.86, 0, 0.72], [0.86, 0, 0.72], [0, -0.9, 0.55], [0, 0.9, 0.55]]) {
        addBox(group, [0.46, 0.06, 0.4], [x, y, z], MAT.fabric(accent), false);
      }
      for (const [x, z] of [[-0.63, -0.5], [0.63, -0.5], [0, 0.5]]) {
        const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.025, 10), MAT.fabric(0xf7f0dc));
        plate.position.set(x, 0.91, z);
        group.add(plate);
      }
      addCylinder(group, 0.07, 0.09, 0.24, [0, 0.96, 0], MAT.woodDark(), 5);
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.22, 0.18, 8), MAT.fabric(accent));
      bowl.position.set(0, 1.05, 0);
      group.add(bowl);
      break;
    }
    case 'lounger': {
      const fabric = MAT.fabric(accent);
      addBox(group, [0.95, 0.16, 2.0], [0, 0.42, 0], fabric);
      const back = addBox(group, [0.95, 0.12, 0.95], [0, 0.72, -0.72], fabric);
      back.rotation.x = -0.55;
      for (const [x, z] of [[-0.35, -0.75], [0.35, -0.75], [-0.35, 0.75], [0.35, 0.75]]) {
        addBox(group, [0.08, 0.34, 0.08], [x, 0.18, z], MAT.woodDark());
      }
      break;
    }
    case 'umbrella': {
      addCylinder(group, 0.06, 0.08, 2.6, [0, 1.3, 0], MAT.wood(), 6);
      const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.8, 0.65, 12), MAT.fabric(0xe3c77e));
      canopy.position.y = 2.55;
      canopy.castShadow = true;
      group.add(canopy);
      const trim = new THREE.Mesh(new THREE.TorusGeometry(1.76, 0.045, 5, 12), MAT.rope());
      trim.rotation.x = Math.PI / 2;
      trim.position.y = 2.24;
      group.add(trim);
      break;
    }
    case 'lantern': {
      addCylinder(group, 0.06, 0.09, 2.1, [0, 1.05, 0], MAT.woodDark(), 6);
      const bulb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 0), MAT.glow(0xffb052));
      bulb.position.y = 2.05;
      group.add(bulb);
      const shade = new THREE.Mesh(new THREE.ConeGeometry(0.52, 0.35, 8), MAT.wood());
      shade.position.y = 2.38;
      group.add(shade);
      break;
    }
    case 'planter': {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.38, 0.72, 7), MAT.fabric(0x8c5f45));
      pot.position.y = 0.36;
      pot.castShadow = true;
      group.add(pot);
      for (let i = 0; i < 5; i++) {
        const a = i * Math.PI * 2 / 5;
        const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.1, 5), MAT.leaf());
        leaf.position.set(Math.cos(a) * 0.25, 1.02, Math.sin(a) * 0.25);
        leaf.rotation.z = Math.cos(a) * 0.35;
        leaf.rotation.x = Math.sin(a) * 0.35;
        group.add(leaf);
      }
      break;
    }
    case 'stage': {
      addBox(group, [4.2, 0.45, 3.1], [0, 0.22, 0], MAT.woodDark());
      addBox(group, [3.7, 0.12, 2.6], [0, 0.5, 0], MAT.wood());
      for (const x of [-1.5, 1.5]) {
        addBox(group, [0.6, 0.9, 0.5], [x, 0.95, -0.8], MAT.metal());
        const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.24, 8), MAT.glow(0x9fd8d0));
        cone.position.set(x, 1.0, -0.52);
        group.add(cone);
      }
      addBox(group, [2.8, 2.0, 0.16], [0, 1.5, -1.42], MAT.fabric(0x2f6e78));
      break;
    }
    default:
      break;
  }

  group.name = `furniture_${typeId}`;
  return group;
}
