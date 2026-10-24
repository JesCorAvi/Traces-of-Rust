// Escena tropical: cielo de atardecer, mar, espuma y relieve de dunas.
// Exports: createWorldScene, updateWorldScene.

import * as THREE from 'three';
import { TERRAIN, terrainHeightAt, sandTintAt } from './terrain.js';

const SUN_DIR = new THREE.Vector3(-0.34, 0.11, -1).normalize();
// Luna baja sobre el mar, en el arco de visión por defecto del chiringuito.
const MOON_DIR = new THREE.Vector3(0.584, 0.122, -0.803).normalize();

function createSkyDome() {
  // Domo de atardecer pintado en canvas. Un MeshBasicMaterial conserva los
  // colores exactos y evita el apagado que producía el shader personalizado.
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 1024;
  const ctx = c.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 0, c.height);
  gradient.addColorStop(0.00, '#2e5fc7');
  gradient.addColorStop(0.22, '#5778d3');
  gradient.addColorStop(0.38, '#a68dcc');
  gradient.addColorStop(0.49, '#f09da8');
  gradient.addColorStop(0.54, '#ffc08a');
  gradient.addColorStop(0.57, '#ff9f83');
  gradient.addColorStop(0.62, '#d97a8d');
  gradient.addColorStop(0.76, '#87445e');
  gradient.addColorStop(1.00, '#4c2b43');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, c.width, c.height);

  // Bandas de nubes suaves y cálidas en el ecuador del domo.
  function paintCloud(x, y, width, height, alpha, warm = true) {
    ctx.save();
    ctx.translate(x, y);
    // Sombra inferior rosada y cuerpo cálido superior.
    ctx.fillStyle = `rgba(178, 101, 132, ${alpha * 0.55})`;
    ctx.beginPath();
    ctx.ellipse(0, height * 0.28, width, height * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = warm ? `rgba(255, 235, 211, ${alpha})` : `rgba(248, 203, 211, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(-width * 0.22, 0, width * 0.66, height, 0, 0, Math.PI * 2);
    ctx.ellipse(width * 0.25, -height * 0.12, width * 0.55, height * 0.82, 0, 0, Math.PI * 2);
    ctx.ellipse(width * 0.62, height * 0.1, width * 0.32, height * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255, 249, 232, ${alpha * 0.72})`;
    ctx.beginPath();
    ctx.ellipse(-width * 0.34, -height * 0.22, width * 0.32, height * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  paintCloud(260, 392, 215, 34, 0.62);
  paintCloud(690, 425, 250, 29, 0.5, false);
  paintCloud(1080, 375, 300, 42, 0.6);
  paintCloud(1500, 430, 240, 32, 0.48, false);
  paintCloud(1840, 388, 180, 28, 0.55);
  paintCloud(510, 315, 160, 22, 0.32);
  paintCloud(1280, 315, 200, 24, 0.34, false);
  paintCloud(900, 485, 380, 22, 0.38, false);
  paintCloud(1630, 495, 300, 18, 0.3, false);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.generateMipmaps = false;

  const material = new THREE.MeshBasicMaterial({
    map: tex,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    toneMapped: false
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(430, 40, 24), material);
  sky.renderOrder = -30;
  sky.frustumCulled = false;
  return sky;
}

function createNightSkyDome() {
  const c = document.createElement('canvas');
  c.width = 2048;
  c.height = 1024;
  const ctx = c.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 0, c.height);
  gradient.addColorStop(0.00, '#050a1c');
  gradient.addColorStop(0.34, '#0b1736');
  gradient.addColorStop(0.58, '#172b52');
  gradient.addColorStop(0.72, '#28456c');
  gradient.addColorStop(0.84, '#35516f');
  gradient.addColorStop(1.00, '#1b2b3e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, c.width, c.height);

  // Estrellas deterministas: el mismo cielo cada noche.
  let seed = 20261024;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 820; i++) {
    const x = rand() * c.width;
    const y = rand() * c.height * 0.62;
    const size = rand() < 0.72 ? 2 : 3 + Math.floor(rand() * 2);
    const alpha = 0.35 + rand() * 0.55;
    ctx.fillStyle = rand() < 0.16
      ? `rgba(180, 210, 255, ${alpha})`
      : `rgba(255, 248, 225, ${alpha})`;
    ctx.fillRect(x, y, size, size);
  }

  // Velo de nubes nocturnas, muy tenue, para no romper la silueta lunar.
  ctx.save();
  ctx.globalAlpha = 0.10;
  ctx.fillStyle = '#6f86ad';
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.ellipse(180 + i * 240, 640 + (i % 3) * 34, 210 + (i % 4) * 50, 26, 0.06, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;

  const material = new THREE.MeshBasicMaterial({
    map: tex,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    fog: false,
    toneMapped: false
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(430, 40, 24), material);
  sky.renderOrder = -29;
  sky.frustumCulled = false;
  return sky;
}

function makeMoonTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const glow = ctx.createRadialGradient(64, 64, 31, 64, 64, 64);
  glow.addColorStop(0, 'rgba(205, 225, 255, 0.42)');
  glow.addColorStop(0.55, 'rgba(160, 195, 245, 0.16)');
  glow.addColorStop(1, 'rgba(140, 180, 235, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = '#eef3ff';
  ctx.beginPath();
  ctx.arc(64, 64, 27, 0, Math.PI * 2);
  ctx.fill();
  // Mares y cráteres.
  ctx.fillStyle = 'rgba(156, 174, 208, 0.42)';
  for (const [x, y, r] of [[54, 55, 7], [72, 72, 9], [58, 78, 5], [78, 54, 4], [68, 45, 3]]) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  return tex;
}

function makeMoonGlowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(225, 238, 255, 0.95)');
  g.addColorStop(0.22, 'rgba(186, 214, 255, 0.62)');
  g.addColorStop(0.52, 'rgba(135, 178, 240, 0.24)');
  g.addColorStop(1, 'rgba(110, 150, 220, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeSunTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255, 255, 238, 1)');
  g.addColorStop(0.28, 'rgba(255, 245, 195, 1)');
  g.addColorStop(0.48, 'rgba(255, 214, 128, 0.95)');
  g.addColorStop(0.72, 'rgba(255, 171, 112, 0.36)');
  g.addColorStop(1, 'rgba(255, 133, 102, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  return tex;
}

function makeGlowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
  g.addColorStop(0, 'rgba(255, 249, 208, 1)');
  g.addColorStop(0.16, 'rgba(255, 226, 150, 0.95)');
  g.addColorStop(0.42, 'rgba(255, 174, 111, 0.42)');
  g.addColorStop(1, 'rgba(255, 132, 108, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createCloudLayer(scene, cloudTex) {
  const clouds = [];
  const cloudMat = new THREE.SpriteMaterial({
    map: cloudTex,
    color: 0xffd2b1,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    fog: false
  });

  for (let i = 0; i < 14; i++) {
    const sprite = new THREE.Sprite(cloudMat.clone());
    const angle = (i / 14) * Math.PI * 2 + 0.35;
    const dist = 170 + (i % 5) * 34;
    sprite.position.set(
      Math.cos(angle) * dist,
      31 + (i % 4) * 10 + Math.sin(i * 2.1) * 7,
      Math.sin(angle) * dist
    );
    sprite.scale.set(58 + (i % 3) * 20, 22 + (i % 2) * 10, 1);
    sprite.material.opacity = 0.26 + (i % 4) * 0.08;
    sprite.material.color.setHex(i % 3 === 0 ? 0xffc3b6 : (i % 3 === 1 ? 0xffd9c2 : 0xffe9d1));
    sprite.material.rotation = (i * 0.73) % Math.PI;
    sprite.renderOrder = -20;
    sprite.userData.drift = 0.004 + (i % 5) * 0.0013;
    sprite.userData.baseX = sprite.position.x;
    scene.add(sprite);
    clouds.push(sprite);
  }
  return clouds;
}

function buildGround(materials) {
  const segments = 200;
  const geo = new THREE.PlaneGeometry(TERRAIN.size, TERRAIN.size, segments, segments);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = -pos.getY(i);
    const h = terrainHeightAt(x, z);
    pos.setZ(i, h);
    const tint = sandTintAt(x, z, h);
    colors[i * 3] = tint.r;
    colors[i * 3 + 1] = tint.g;
    colors[i * 3 + 2] = tint.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const ground = new THREE.Mesh(geo, materials.groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  ground.castShadow = false;
  ground.frustumCulled = false;
  return ground;
}

export function createWorldScene(materials) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf7a283);
  scene.fog = new THREE.FogExp2(0xf6aa8b, 0.0042);

  const ambientLight = new THREE.AmbientLight(0xffc8a2, 1.0);
  scene.add(ambientLight);

  const hemi = new THREE.HemisphereLight(0x9fd8ff, 0xffae74, 0.8);
  scene.add(hemi);

  const sunLight = new THREE.DirectionalLight(0xffc27a, 3.1);
  sunLight.position.copy(SUN_DIR).multiplyScalar(110);
  sunLight.target.position.set(0, 0, 0);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.near = 5;
  sunLight.shadow.camera.far = 260;
  sunLight.shadow.camera.left = -85;
  sunLight.shadow.camera.right = 85;
  sunLight.shadow.camera.top = 85;
  sunLight.shadow.camera.bottom = -85;
  sunLight.shadow.bias = -0.00045;
  sunLight.shadow.normalBias = 0.025;
  scene.add(sunLight, sunLight.target);

  const skyDome = createSkyDome();
  scene.add(skyDome);

  const nightSky = createNightSkyDome();
  scene.add(nightSky);

  const sunTexture = makeSunTexture();
  const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: sunTexture,
    color: 0xffc27a,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
    toneMapped: false
  }));
  sunGlow.position.copy(SUN_DIR).multiplyScalar(360);
  sunGlow.scale.set(84, 84, 1);
  sunGlow.renderOrder = -14;
  scene.add(sunGlow);

  const sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({
    map: sunTexture,
    color: 0xfff4cc,
    transparent: true,
    opacity: 1,
    blending: THREE.NormalBlending,
    depthTest: false,
    depthWrite: false,
    fog: false,
    toneMapped: false
  }));
  sunDisc.position.copy(SUN_DIR).multiplyScalar(358);
  sunDisc.scale.set(27, 27, 1);
  sunDisc.renderOrder = -13;
  scene.add(sunDisc);

  const moonTexture = makeMoonTexture();
  const moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeMoonGlowTexture(),
    color: 0xbcd6ff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
    toneMapped: false
  }));
  moonGlow.position.copy(MOON_DIR).multiplyScalar(356);
  moonGlow.scale.set(90, 90, 1);
  moonGlow.renderOrder = -14;
  scene.add(moonGlow);

  const moonDisc = new THREE.Sprite(new THREE.SpriteMaterial({
    map: moonTexture,
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    blending: THREE.NormalBlending,
    depthTest: false,
    depthWrite: false,
    fog: false,
    toneMapped: false
  }));
  moonDisc.position.copy(MOON_DIR).multiplyScalar(352);
  moonDisc.scale.set(30, 30, 1);
  moonDisc.renderOrder = -12;
  scene.add(moonDisc);

  const moonLight = new THREE.DirectionalLight(0x9fb8e8, 0);
  moonLight.position.copy(MOON_DIR).multiplyScalar(100);
  moonLight.target.position.set(0, 0, 0);
  scene.add(moonLight, moonLight.target);

  // Las nubes van pintadas en el domo; los sprites adicionales podían
  // recortarse sobre el sol a baja resolución.
  const clouds = [];

  const ground = buildGround(materials);
  scene.add(ground);

  const ocean = new THREE.Mesh(new THREE.PlaneGeometry(900, 500, 1, 1), materials.oceanMat);
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.set(0, TERRAIN.waterY, -305);
  ocean.receiveShadow = false;
  scene.add(ocean);

  const shoreFoam = new THREE.Mesh(new THREE.PlaneGeometry(520, 2.8), materials.foamMat);
  shoreFoam.rotation.x = -Math.PI / 2;
  shoreFoam.position.set(0, TERRAIN.waterY + 0.025, -63.5);
  shoreFoam.renderOrder = 2;
  scene.add(shoreFoam);

  const shoreFoamBack = shoreFoam.clone();
  shoreFoamBack.scale.set(0.94, 1, 1);
  shoreFoamBack.position.set(0, TERRAIN.waterY + 0.015, -66.4);
  shoreFoamBack.material = materials.foamMat.clone();
  shoreFoamBack.material.opacity = 0.4;
  scene.add(shoreFoamBack);

  scene.userData.tropical = {
    skyDome,
    nightSky,
    sunGlow,
    sunDisc,
    moonGlow,
    moonDisc,
    moonLight,
    nightFactor: 0,
    clouds,
    ocean,
    shoreFoam,
    shoreFoamBack,
    elapsed: 0,
    waterTex: materials.waterTex,
    foamTex: materials.foamTex
  };

  return {
    scene,
    ambientLight,
    sunLight,
    skyDome,
    nightSky,
    moonGlow,
    moonDisc,
    moonLight,
    ocean,
    shoreFoam,
    clouds,
    sunGlow,
    sunDisc
  };
}

export function updateWorldScene(scene, camera, dt = 0) {
  const fx = scene.userData.tropical;
  if (!fx) return;
  fx.elapsed += dt;
  const t = fx.elapsed;

  if (fx.skyDome) {
    if (camera) fx.skyDome.position.copy(camera.position);
  }
  if (fx.nightSky) {
    if (camera) fx.nightSky.position.copy(camera.position);
    fx.nightSky.material.opacity = fx.nightFactor || 0;
  }
  if (fx.sunGlow && camera) {
    fx.sunGlow.position.copy(camera.position).addScaledVector(SUN_DIR, 355);
    fx.sunGlow.material.opacity = 0.5 * (1 - (fx.nightFactor || 0));
  }
  if (fx.sunDisc && camera) {
    fx.sunDisc.position.copy(camera.position).addScaledVector(SUN_DIR, 358);
    fx.sunDisc.material.opacity = 1 - (fx.nightFactor || 0);
  }
  if (fx.moonGlow && camera) {
    fx.moonGlow.position.copy(camera.position).addScaledVector(MOON_DIR, 356);
    fx.moonGlow.material.opacity = 0.7 * (fx.nightFactor || 0);
  }
  if (fx.moonDisc && camera) {
    fx.moonDisc.position.copy(camera.position).addScaledVector(MOON_DIR, 352);
    fx.moonDisc.material.opacity = fx.nightFactor || 0;
  }
  if (fx.moonLight) {
    fx.moonLight.intensity = 0.75 * (fx.nightFactor || 0);
  }
  if (fx.waterTex) {
    fx.waterTex.offset.x = (t * 0.006) % 1;
    fx.waterTex.offset.y = (t * 0.003) % 1;
  }
  if (fx.foamTex) {
    fx.foamTex.offset.x = (t * 0.018) % 1;
    fx.foamTex.offset.y = Math.sin(t * 0.35) * 0.08;
  }
  if (fx.shoreFoam) {
    fx.shoreFoam.position.z = -63.5 + Math.sin(t * 0.26) * 0.7;
  }
  if (fx.shoreFoamBack) {
    fx.shoreFoamBack.position.z = -66.4 + Math.sin(t * 0.19 + 1.8) * 1.0;
  }
  for (const cloud of fx.clouds) {
    cloud.position.x = cloud.userData.baseX + Math.sin(t * 0.012 + cloud.position.z * 0.01) * 9;
    cloud.material.opacity = Math.max(0.12, 0.28 + Math.sin(t * 0.09 + cloud.position.z) * 0.08);
  }
}
