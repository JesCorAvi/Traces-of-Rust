import * as THREE from 'three';
import { SpriteSheets } from './spritesheets.js';
import { createBillboardSprite } from './entities.js';

export function createWorld() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x040604);
  scene.fog = new THREE.FogExp2(0x040604, 0.046);

  // Luz ambiental mínima y sucia para forzar alto contraste
  scene.add(new THREE.AmbientLight(0x1b241a, 0.55));

  // Suelo 3D industrial con recepción de sombras y relieve
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(500, 500),
    new THREE.MeshStandardMaterial({
      map: SpriteSheets.env.ground.tex,
      bumpMap: SpriteSheets.env.ground.tex,
      bumpScale: 0.08,
      roughness: 0.92,
      metalness: 0.15
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Lámparas cenitales industriales que parpadean
  const ceilingLights = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const r = 22 + (i % 2) * 18;
    const light = new THREE.PointLight(0xb89c46, 32, 26, 1.8);
    light.position.set(Math.cos(angle) * r, 6.5, Math.sin(angle) * r);
    scene.add(light);
    ceilingLights.push({ light, baseIntensity: 32, seed: Math.random() * 100 });
  }

  // Pilares oxidados y cadenas colgantes como Billboards 2D con sombra 3D
  const propBillboards = [];
  const pillarMat = new THREE.MeshStandardMaterial({
    map: SpriteSheets.env.pillar.tex,
    alphaTest: 0.5,
    transparent: true,
    roughness: 0.9,
    side: THREE.DoubleSide
  });

  for (let i = 0; i < 140; i++) {
    const x = (Math.random() - 0.5) * 240;
    const z = (Math.random() - 0.5) * 240;
    if (Math.hypot(x, z) < 12) continue;

    const h = 4.8 + Math.random() * 2.2;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.8, h), pillarMat);
    mesh.position.set(x, h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    propBillboards.push(mesh);
  }

  // Terminales de Transfusión (Altares interactivos 100% Billboard Animado)
  const altars = [];
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2 + 0.3;
    const dist = 28 + Math.random() * 35;
    const billboard = createBillboardSprite('altar', 2.4);
    billboard.group.position.set(Math.cos(ang) * dist, 0, Math.sin(ang) * dist);

    const lamp = new THREE.PointLight(0xa52020, 15, 9);
    lamp.position.set(0, 2.2, 0.3);
    billboard.group.add(lamp);

    scene.add(billboard.group);
    altars.push({ billboard, lamp, used: false });
  }

  // Polvo y ceniza industrial flotando en el aire 3D
  const dustGeo = new THREE.BufferGeometry();
  const dustPts = new Float32Array(600 * 3);
  for (let i = 0; i < 600; i++) {
    dustPts[i * 3] = (Math.random() - 0.5) * 80;
    dustPts[i * 3 + 1] = Math.random() * 6;
    dustPts[i * 3 + 2] = (Math.random() - 0.5) * 80;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPts, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({ color: 0x877a5c, size: 0.12, transparent: true, opacity: 0.45 })
  );
  scene.add(dust);

  return { scene, altars, propBillboards, ceilingLights, dust };
}