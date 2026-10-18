import * as THREE from 'three';
import { CONFIG } from './config.js';
import { AudioSys } from './audio.js';
import {
  SpriteSheets,
  getPlayerLoadoutSheet,
  peekPlayerLoadoutSheet,
  initUISpritesCSS,
  renderSpriteIconHTML,
  renderSpriteBadgeHTML,
  refreshStaticDOMIcons
} from './spritesheets.js';
import { createWorld } from './world.js';
import { createBillboardSprite, setPlaneFrameUV, EnemyPool } from './entities.js';
import {
  SHARED_GEO,
  SHARED_MAT,
  initCombatLight,
  updateCombatLight,
  executeSawSlash,
  createOrbitalUnit,
  fireBuckshot,
  fireFlamethrower,
  spawnShrapnelMine,
  fireHarpoon,
  fireDefibrillator,
  triggerBossSpecialAttack
} from './combat.js';

let save = JSON.parse(localStorage.getItem(CONFIG.SAVE_KEY)) || {
  souls: 0, dmg: 0, hp: 0, spd: 0, atkSpd: 0, mag: 0, reroll: 0
};
const saveGame = () => localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(save));

// Ajustes del Sistema persistentes (Vídeo, Audio, Controles)
let gameSettings = JSON.parse(localStorage.getItem('echoes_rust_settings_v1')) || {
  masterVol: 85,
  sfxVol: 90,
  ambVol: 80,
  muted: false,
  resScale: 0.44,
  fov: 70,
  shadows: true,
  crt: true,
  fpsCounter: false,
  mouseSens: 100,
  camShake: 100
};
const saveSettings = () => localStorage.setItem('echoes_rust_settings_v1', JSON.stringify(gameSettings));

// Expediente de Carrera / Historial de Partidas
let careerStats = JSON.parse(localStorage.getItem('echoes_rust_career_v1')) || {
  runs: 0,
  totalTimeSec: 0,
  totalKills: 0,
  totalBosses: 0,
  totalUpgradesBought: 0
};
const saveCareer = () => localStorage.setItem('echoes_rust_career_v1', JSON.stringify(careerStats));

const SHORT_WEAPON_NAMES = {
  slash:        'Sierra',
  shotgun:      'Escopeta',
  flamethrower: 'Soplete',
  aura:         'Incensario',
  mines:        'Minas',
  harpoon:      'Arpón',
  orbital:      'Jaula',
  bolt:         'Desfibril.'
};

function injectUIFixesAndNormalizeDOM() {
  if (!document.getElementById('main-js-ui-fixes')) {
    const style = document.createElement('style');
    style.id = 'main-js-ui-fixes';
    style.textContent = `
      /* Ajustes para el HUD estilo Megabonk manteniendo estética industrial */
      #hp-bar, #exp-bar, #stam-bar {
        display: block !important;
        height: 100% !important;
        background-repeat: repeat-x !important;
        background-size: auto 100% !important;
      }
      #hp-bar {
        background-color: #c42b2b !important;
        background-image: var(--bar-fill-hp) !important;
      }
      #exp-bar {
        background-color: #c8a846 !important;
        background-image: var(--bar-fill-exp) !important;
      }
      #stam-bar {
        background-color: #527848 !important;
        background-image: var(--bar-fill-stam) !important;
      }
      .boss-bar-frame {
        height: 24px !important;
        border-width: 4px !important;
        border-image: var(--slice-bar_frame) 5 fill / 4px stretch !important;
      }
      #boss-hp-bar {
        display: block !important;
        height: 100% !important;
        background-color: #b82525 !important;
        background-image: var(--bar-fill-boss) !important;
      }

      /* Casillas compactas de armas (Arriba-Izquierda estilo Megabonk) */
      .slots-grid-compact .weapon-slot {
        width: 58px !important;
        height: 58px !important;
        padding: 2px !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: space-between !important;
      }
      .slots-grid-compact .weapon-slot-lvl-text {
        font-family: 'Press Start 2P', monospace !important;
        font-size: 8px !important;
        color: #f0c954 !important;
        text-shadow: 2px 2px 0 #050605, -1px -1px 0 #050605 !important;
        line-height: 1 !important;
        margin-top: 2px !important;
      }

      /* Dock inferior de Implantes Pasivos (Iconos en fila estilo Megabonk) */
      #passives-bar.slots-horizontal-row {
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 10px !important;
      }
      #passives-bar .passive-slot {
        min-width: 58px !important;
        width: 58px !important;
        height: 58px !important;
        padding: 3px !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: space-between !important;
        position: relative !important;
      }
      #passives-bar .passive-dock-icon-wrap {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        flex: 1 !important;
      }
      #passives-bar .passive-dock-lvl {
        font-family: 'Press Start 2P', monospace !important;
        font-size: 8px !important;
        color: #f0c954 !important;
        background: rgba(5, 6, 5, 0.9) !important;
        border: 1px solid #63533b !important;
        padding: 1px 4px !important;
        line-height: 1.1 !important;
        white-space: nowrap !important;
      }

      /* Tarjetas de subida de nivel */
      .passive-affected-weapons {
        padding-top: 3px !important;
        border-top: 1px dotted #2c3a28 !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 4px !important;
      }
      .passive-weapons-grid {
        display: grid !important;
        gap: 4px !important;
        width: 100% !important;
      }
      .passive-weapons-grid.cols-1 { grid-template-columns: minmax(0, max-content) !important; }
      .passive-weapons-grid.cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
      .passive-weapons-grid.cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
      .passive-weapons-grid.cols-4 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
      .passive-weapon-pill {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: flex-start !important;
        gap: 5px !important;
        background: #070a07 !important;
        border: 1px solid #63533b !important;
        color: #f5ecd3 !important;
        padding: 2px 6px !important;
        font-family: 'VT323', monospace !important;
        font-size: 17px !important;
        line-height: 1.15 !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }
      .upg-title-left span {
        line-height: 1.4 !important;
        display: inline-block !important;
      }
      .upg-card.is-selected {
        border-image-source: var(--slice-card_hover) !important;
        outline: 3px solid #f0c954 !important;
        outline-offset: 2px !important;
        transform: translateY(1px) !important;
      }
      .weapon-slot:focus-visible,
      .passive-slot:focus-visible {
        outline: 2px dashed #f0c954 !important;
        outline-offset: 2px !important;
      }
      .reroll-btn {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 8px !important;
        white-space: nowrap !important;
        width: auto !important;
        min-width: 320px !important;
        padding: 4px 14px !important;
      }
      .reroll-count-pill {
        background: #050605;
        border: 1px solid #63533b;
        color: #f0c954;
        padding: 2px 6px;
        font-size: 10px;
        line-height: 1.2;
      }
      .rust-btn:hover:not(:disabled) .reroll-count-pill {
        background: #161d15;
        color: #f5ecd3;
        border-color: #050605;
      }
      .rust-btn:disabled .reroll-count-pill {
        color: #6c7a65;
        border-color: #243022;
      }

      /* Estilos para el Menú de Escritorio y Ajustes */
      .desktop-start-overlay {
        background: rgba(4, 5, 4, 0.94) !important;
        padding: 24px !important;
        overflow-y: auto !important;
      }
      .desktop-launcher-layout {
        display: grid;
        grid-template-columns: 1fr 340px;
        gap: 16px;
        max-width: 1080px;
        width: 100%;
        margin: auto;
        align-items: start;
      }
      .desktop-nav-plate {
        text-align: left;
        padding: 20px 24px !important;
      }
      .desktop-main-title {
        font-size: 34px !important;
        margin: 10px 0 6px !important;
      }
      .desktop-menu-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 14px;
      }
      .desktop-menu-btn {
        justify-content: flex-start !important;
        width: 100% !important;
        padding: 10px 16px !important;
        font-size: 13px !important;
      }
      .desktop-version-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 16px;
        padding-top: 10px;
        border-top: 1px dashed #364832;
        font-family: 'Press Start 2P', monospace;
        font-size: 8px;
        color: #877a5c;
      }
      .desktop-dossier-plate {
        text-align: left;
        padding: 16px 20px !important;
      }
      .desktop-quick-controls {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 4px 10px;
        font-family: 'Press Start 2P', monospace;
        font-size: 8px;
        color: #a8c499;
        margin-top: 10px;
        padding-top: 8px;
        border-top: 1px dashed #364832;
      }
      .settings-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin: 10px 0;
      }
      .settings-span-full {
        grid-column: span 2;
      }
      .settings-section {
        margin: 0 !important;
      }
      .settings-section-title {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-family: 'Press Start 2P', monospace;
        font-size: 11px;
        color: #f0c954;
        margin-bottom: 10px;
        border-bottom: 1px dashed #364832;
        padding-bottom: 4px;
        width: 100%;
      }
      .setting-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
        font-size: 18px;
        color: #e6dec8;
      }
      .setting-row select, .setting-row input[type="range"] {
        background: #050605;
        color: #f5ecd3;
        border: 1px solid #877a5c;
        font-family: 'Press Start 2P', monospace;
        font-size: 10px;
        padding: 4px 8px;
      }
      .setting-row input[type="range"] {
        accent-color: #b89c46;
        cursor: pointer;
      }
      .settings-two-cols {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      @media (max-width: 900px) {
        .desktop-launcher-layout { grid-template-columns: 1fr; }
        .settings-grid { grid-template-columns: 1fr; }
        .settings-span-full { grid-column: span 1; }
        .settings-two-cols { grid-template-columns: 1fr; }
      }
    `;
    document.head.appendChild(style);
  }

  refreshStaticDOMIcons();
}

// Escena 3D Industrial con Relieve y Física
const { scene, ambientLight, propBillboards, ceilingLights, dust, worldPhysics } = createWorld();
initCombatLight(scene);
const camera = new THREE.PerspectiveCamera(gameSettings.fov || 70, window.innerWidth / window.innerHeight, 0.1, 100);

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.shadowMap.enabled = gameSettings.shadows;
renderer.shadowMap.type = THREE.BasicShadowMap;
document.getElementById('game-container').appendChild(renderer.domElement);

function updateResolution() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(
    Math.floor(window.innerWidth * (gameSettings.resScale || 0.44)),
    Math.floor(window.innerHeight * (gameSettings.resScale || 0.44)),
    false
  );
}
window.addEventListener('resize', updateResolution);
updateResolution();

// Jugador: Billboard 2D de 8 Direcciones con Iluminación Propia
const playerBillboard = createBillboardSprite('player', 2.0);
playerBillboard.mesh.castShadow = false;
playerBillboard.mesh.receiveShadow = false;
playerBillboard.mesh.material.roughness = 0.6;
playerBillboard.mesh.material.emissive = new THREE.Color(0xb5aa8c);
playerBillboard.mesh.material.emissiveMap = playerBillboard.tex;
playerBillboard.mesh.material.emissiveIntensity = 0.68;
playerBillboard.mesh.material.needsUpdate = true;

const playerGroup = playerBillboard.group;
scene.add(playerGroup);

const playerLanternLight = new THREE.PointLight(0xffe0a3, 28, 8.5, 1.4);
scene.add(playerLanternLight);

let currentHandWeapon = 'slash';
let lastUpgradedKey = null;
let currentLevelChoices = [];
const HAND_WEAPONS = ['slash', 'shotgun', 'flamethrower', 'harpoon', 'bolt', 'mines'];

// Construye los sheets del jugador de uno en uno, repartidos entre frames,
// para no bloquear el hilo principal con 6 canvases de golpe.
let prewarmGeneration = 0;
function prewarmLoadoutSheets() {
  const snapshot = { ...skills };
  const gen = ++prewarmGeneration;
  const queue = HAND_WEAPONS
    .filter(w => snapshot[w] && !peekPlayerLoadoutSheet(snapshot, w))
    .sort((a, b) => (b === currentHandWeapon) - (a === currentHandWeapon)); // el arma en mano primero
  const next = () => {
    if (gen !== prewarmGeneration) return; // llegó un prewarm más reciente
    const w = queue.shift();
    if (!w) return;
    const s = getPlayerLoadoutSheet(snapshot, w);
    s.tex.repeat.set(1, 1);
    s.tex.offset.set(0, 0);
    s.glowTex.repeat.set(1, 1);
    s.glowTex.offset.set(0, 0);
    renderer.initTexture(s.tex);
    renderer.initTexture(s.glowTex);
    if (w === currentHandWeapon) syncPlayerVisualLoadout(currentHandWeapon);
    setTimeout(next, 0);
  };
  setTimeout(next, 0);
}

function syncPlayerVisualLoadout(activeHand = currentHandWeapon) {
  currentHandWeapon = activeHand;
  // Si el sheet aún no está listo, se conserva el sprite actual unos frames
  const sheet = peekPlayerLoadoutSheet(skills, currentHandWeapon);
  if (!sheet) return;

  sheet.tex.repeat.set(1, 1);
  sheet.tex.offset.set(0, 0);
  sheet.glowTex.repeat.set(1, 1);
  sheet.glowTex.offset.set(0, 0);

  playerBillboard.tex = sheet.tex;
  playerBillboard.glowTex = sheet.glowTex;
  playerBillboard.cols = sheet.cols;
  playerBillboard.rows = sheet.rows;
  playerBillboard.numDirs = sheet.numDirs;
  playerBillboard.lastTotalCol = -1;
  playerBillboard.lastDirRow = -1;

  if (playerBillboard.mesh.material.map !== sheet.tex) {
    const hadEmissiveMap = !!playerBillboard.mesh.material.emissiveMap;
    playerBillboard.mesh.material.map = sheet.tex;
    playerBillboard.mesh.material.emissiveMap = sheet.tex;
    if (!hadEmissiveMap) playerBillboard.mesh.material.needsUpdate = true;
  }
  if (playerBillboard.glowMesh.material.map !== sheet.glowTex) {
    playerBillboard.glowMesh.material.map = sheet.glowTex;
  }
  playerBillboard.setDirectionalFrame(playerBillboard.dirRow, playerBillboard.stateIdx, playerBillboard.col);
}

// Aura Corrosiva (Incensario de Bilis)
const auraMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  new THREE.MeshBasicMaterial({
    map: SpriteSheets.env.aura.tex,
    transparent: true,
    opacity: 0.72,
    alphaTest: 0.1,
    side: THREE.DoubleSide
  })
);
auraMesh.rotation.x = -Math.PI / 2;
auraMesh.visible = false;
scene.add(auraMesh);

// Linterna 3D
const flashlight = new THREE.SpotLight(0xe6d7a5, 195, 40, Math.PI / 3.6, 0.45, 1.3);
flashlight.castShadow = gameSettings.shadows;
flashlight.shadow.mapSize.set(512, 512);
scene.add(flashlight, flashlight.target);

// Pool de Enemigos
const enemyPool = new EnemyPool(scene, CONFIG.DIFFICULTY.MAX_ACTIVE_ENEMIES);

// Variables de estado de partida, movimiento/dash y rastro amarillo de barra de Boss
let state = 'START', lastMenuScreen = 'start-screen';
let yaw = 0, pitch = -0.22, playerFacingYaw = 0, aimLockTimer = 0;
let gameTime = 0, runSouls = 0, kills = 0;
let stats = {}, skills = {}, passives = {}, rerollsLeft = CONFIG.LIMITS.REROLLS_PER_RUN, maxRerollsRun = CONFIG.LIMITS.REROLLS_PER_RUN;
let playerYVel = 0, isGrounded = true, dashCd = 0, invuln = 0, atkAnimTimer = 0;
let dashTimer = 0, dashGhostTimer = 0;
const dashDirVec = new THREE.Vector3();
let camShake = 0, targetFov = 70, spawnTimer = 0;
let nextBossIdx = 0, activeBoss = null, bossesDefeated = 0, isEndgame = false;

// Control del efecto amarillo de vida perdida del Boss
let bossTrailPct = 100;
let bossTargetPct = 100;
let bossTrailHoldTimer = 0;
let bossHideHudTimeout = null;

// Control de FPS en vivo
let fpsFrames = 0, fpsTimer = 0, currentFps = 60;

const weaponTimers = { slash: 0, shotgun: 0, flamethrower: 0, aura: 0, mines: 0, harpoon: 0, bolt: 0 };
const drops = [], orbitals = [], minesList = [], vfx = [], bossHazards = [], bossProjectiles = [];

// ============================================================================
// RECURSOS COMPARTIDOS EN VRAM PARA PICKUPS DEL LORE (SUERO, DIENTE Y MALETÍN)
// ============================================================================
const PICKUP_ASSETS = {
  smallGeo:  new THREE.PlaneGeometry(0.9, 0.9),
  chestGeo:  new THREE.PlaneGeometry(1.45, 1.45),
  shadowGeo: new THREE.CircleGeometry(0.32, 10),
  shadowMat: new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.58 }),
  mats:      {},
  texs:      {}
};

function initPickupSharedAssets() {
  const types = [
    { key: 'serum', sheet: SpriteSheets.env.pickup_serum },
    { key: 'tooth', sheet: SpriteSheets.env.pickup_tooth },
    { key: 'chest', sheet: SpriteSheets.env.pickup_chest }
  ];
  types.forEach(({ key, sheet }) => {
    const t = sheet.tex;
    t.repeat.set(0.25, 1);
    t.offset.set(0, 0);
    PICKUP_ASSETS.texs[key] = t;
    PICKUP_ASSETS.mats[key] = new THREE.MeshBasicMaterial({
      map: t,
      transparent: true,
      alphaTest: 0.15,
      side: THREE.DoubleSide
    });
  });
}
initPickupSharedAssets();

function prewarmAllGPUAssets() {
  const allSheets = [
    SpriteSheets.player,
    SpriteSheets.zombie,
    SpriteSheets.weeper,
    SpriteSheets.worm,
    SpriteSheets.boss_butcher,
    SpriteSheets.boss_siren,
    SpriteSheets.boss_furnace,
    SpriteSheets.boss_apostle,
    SpriteSheets.boss_warden
  ];
  allSheets.forEach(s => {
    if (!s) return;
    if (s.tex) {
      s.tex.repeat.set(1, 1);
      s.tex.offset.set(0, 0);
      renderer.initTexture(s.tex);
    }
    if (s.glowTex) {
      s.glowTex.repeat.set(1, 1);
      s.glowTex.offset.set(0, 0);
      renderer.initTexture(s.glowTex);
    }
  });

  Object.values(SpriteSheets.env).forEach(envItem => {
    if (envItem && envItem.tex) renderer.initTexture(envItem.tex);
  });

  // (Eliminado: generar un sheet por arma aquí gastaba segundos de carga y memoria
  //  en firmas de caché que casi nunca se reutilizan en una partida real.)

  const dummyGroup = new THREE.Group();
  dummyGroup.position.copy(camera.position).add(new THREE.Vector3(0, 0, -3));
  dummyGroup.add(
    new THREE.Mesh(PICKUP_ASSETS.smallGeo, PICKUP_ASSETS.mats.serum),
    new THREE.Mesh(PICKUP_ASSETS.smallGeo, PICKUP_ASSETS.mats.tooth),
    new THREE.Mesh(PICKUP_ASSETS.chestGeo, PICKUP_ASSETS.mats.chest),
    new THREE.Mesh(SHARED_GEO.spark, SHARED_MAT.slashMat),
    new THREE.Mesh(SHARED_GEO.orbitalPlane, SHARED_MAT.orbitalMat),
    new THREE.Mesh(SHARED_GEO.mineBody, SHARED_MAT.mineBody)
  );
  // Variantes de material que se crean en caliente durante el combate
  const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, 1)]);
  const flatGeo = new THREE.PlaneGeometry(1, 1);
  const warmMats = [
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }),
    new THREE.LineBasicMaterial({ color: 0xffffff }),
    new THREE.MeshBasicMaterial({ color: 0xffe699, transparent: true, opacity: 0.9, side: THREE.DoubleSide }),
    new THREE.MeshBasicMaterial({ color: 0xff6611 })
  ];
  dummyGroup.add(new THREE.Line(lineGeo, warmMats[0]));
  dummyGroup.add(new THREE.Line(lineGeo, warmMats[1]));
  dummyGroup.add(new THREE.Mesh(flatGeo, warmMats[2]));
  dummyGroup.add(new THREE.Mesh(SHARED_GEO.bossProj, warmMats[3]));
  dummyGroup.add(new THREE.Mesh(SHARED_GEO.spark, SHARED_MAT.sparkBlood));
  dummyGroup.add(new THREE.Mesh(SHARED_GEO.spark, SHARED_MAT.sparkGold));
  dummyGroup.add(new THREE.Mesh(SHARED_GEO.shell, SHARED_MAT.shellRed));
  dummyGroup.add(new THREE.Mesh(SHARED_GEO.mineLed, SHARED_MAT.mineLed));
  dummyGroup.traverse(o => { o.frustumCulled = false; });

  scene.add(dummyGroup);
  if (enemyPool.pool[0]) enemyPool.pool[0].group.visible = true;
  const auraWasVisible = auraMesh.visible;
  auraMesh.visible = true;

  // Un frame real (no solo compile) para que también se suban texturas y se enlacen los programas
  renderer.render(scene, camera);

  auraMesh.visible = auraWasVisible;
  if (enemyPool.pool[0]) enemyPool.pool[0].group.visible = false;
  scene.remove(dummyGroup);
  lineGeo.dispose();
  flatGeo.dispose();
  warmMats.forEach(m => m.dispose());
}

function spawnLorePickup(originPos, type = 'serum') {
  const group = new THREE.Group();
  const isChest = type === 'chest';
  const isTooth = type === 'tooth';

  const groundY = worldPhysics
    ? worldPhysics.getGroundHeight(originPos.x, originPos.z, originPos.y)
    : originPos.y;
  group.position.set(originPos.x, groundY, originPos.z);

  const spriteMesh = new THREE.Mesh(
    isChest ? PICKUP_ASSETS.chestGeo : PICKUP_ASSETS.smallGeo,
    PICKUP_ASSETS.mats[type] || PICKUP_ASSETS.mats.serum
  );
  const baseHeight = isChest ? 0.72 : 0.48;
  spriteMesh.position.y = baseHeight;

  const shadowDisc = new THREE.Mesh(PICKUP_ASSETS.shadowGeo, PICKUP_ASSETS.shadowMat);
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.025;
  if (isChest) shadowDisc.scale.set(1.6, 1.6, 1);

  group.add(spriteMesh, shadowDisc);
  scene.add(group);

  drops.push({
    group,
    spriteMesh,
    shadowDisc,
    baseHeight,
    bobPhase: Math.random() * Math.PI * 2,
    isBossChest: isChest,
    isTooth
  });
}

function cleanupVfxItem(v) {
  scene.remove(v.mesh);
  if (v.disposeGeo && v.mesh.geometry) v.mesh.geometry.dispose();
  if (v.disposeMat && v.mesh.material) v.mesh.material.dispose();
  if (v.disposeTex) v.disposeTex.dispose();
}

function getActiveModifiers() {
  const permDmg = 1 + (save.dmg || 0) * 0.03;
  const permAtkSpd = 1 + (save.atkSpd || 0) * 0.025;
  const permMoveSpd = 1 + (save.spd || 0) * 0.02;
  const permMag = (save.mag || 0) * 0.35;
  const shakeMod = (gameSettings.camShake ?? 100) / 100;

  return {
    dmgMult: permDmg * (1 + (passives.dmg || 0) * CONFIG.PASSIVES.dmg.perLevel),
    atkSpeedMult: permAtkSpd * (1 + (passives.atkSpd || 0) * CONFIG.PASSIVES.atkSpd.perLevel),
    moveSpeed: 6.3 * permMoveSpd * (1 + (passives.moveSpd || 0) * CONFIG.PASSIVES.moveSpd.perLevel),
    areaMult: 1 + (passives.area || 0) * CONFIG.PASSIVES.area.perLevel,
    critChance: (passives.crit || 0) * CONFIG.PASSIVES.crit.perLevel,
    magnetRange: 5.8 + permMag + (passives.magnet || 0) * CONFIG.PASSIVES.magnet.perLevel,
    regenPerSec: (passives.regen || 0) * CONFIG.PASSIVES.regen.perLevel,
    bonusProjectiles: (passives.multishot || 0) * CONFIG.PASSIVES.multishot.perLevel,
    shakeMod
  };
}

function getPassiveAffectedWeaponsHTML(passiveId) {
  const pCfg = CONFIG.PASSIVES[passiveId];
  if (!pCfg) return '';

  if (pCfg.targetType === 'player_stat') {
    return `
      <div class="passive-affected-weapons">
        <span class="passive-affected-label">AFECTA A:</span>
        <div class="passive-weapons-grid cols-1">
          <span class="passive-weapon-pill" title="Mejora directa a las constantes del jugador">${renderSpriteIconHTML('suit', 'sm')} <span>TRAJE / JUGADOR</span></span>
        </div>
      </div>`;
  }

  const equippedIds = Object.keys(skills).filter(k => skills[k] > 0);
  const matching = equippedIds.filter(wId => {
    const wCfg = CONFIG.SKILLS[wId];
    if (!wCfg) return false;
    if (pCfg.targetType === 'multishot_weapons') return wCfg.usesMultishot === true;
    return true;
  });

  if (matching.length === 0) {
    return `
      <div class="passive-affected-weapons">
        <span class="passive-affected-label">ARMAS AFECTADAS:</span>
        <span class="passive-weapon-none">NINGUNA EQUIPADA COMPATIBLE</span>
      </div>`;
  }

  const colClass = `cols-${Math.min(4, matching.length)}`;
  const pills = matching
    .map(wId => {
      const fullName = CONFIG.SKILLS[wId].name;
      const shortName = SHORT_WEAPON_NAMES[wId] || fullName.split(' ')[0];
      return `<span class="passive-weapon-pill" title="${fullName} (Nivel +${skills[wId]})">${renderSpriteIconHTML(CONFIG.SKILLS[wId].icon, 'sm')} <span>${shortName}</span></span>`;
    })
    .join('');

  return `
    <div class="passive-affected-weapons">
      <span class="passive-affected-label">ARMAS AFECTADAS (${matching.length}):</span>
      <div class="passive-weapons-grid ${colClass}">${pills}</div>
    </div>`;
}

function syncOrbitalsCount() {
  if (!skills.orbital) return;
  const targetCount = skills.orbital + (passives.multishot || 0);
  while (orbitals.length < targetCount) {
    orbitals.push(createOrbitalUnit(scene, 0));
  }
  orbitals.forEach((o, idx) => {
    o.angle = (idx / orbitals.length) * Math.PI * 2;
  });
}

function triggerWeaponVisualAttack(weaponId, targetYaw = null, animDuration = 0.24) {
  atkAnimTimer = animDuration;
  syncPlayerVisualLoadout(weaponId);
}

function spawnDashAfterimage() {
  const ghostGeo = playerBillboard.geo.clone();
  const ghostMat = new THREE.MeshBasicMaterial({
    map: playerBillboard.tex,
    transparent: true,
    opacity: 0.55,
    alphaTest: 0.2,
    color: 0xd4af37,
    side: THREE.DoubleSide
  });
  const ghostMesh = new THREE.Mesh(ghostGeo, ghostMat);
  ghostMesh.position.copy(playerGroup.position).add(new THREE.Vector3(0, 1.0, 0));
  ghostMesh.rotation.y = playerBillboard.mesh.rotation.y;
  scene.add(ghostMesh);

  vfx.push({
    mesh: ghostMesh,
    disposeGeo: true,
    disposeMat: true,
    life: 0.18,
    maxLife: 0.18,
    fade: true,
    billboard: true
  });
}

function triggerScare(intensity = 0.42) {
  const mods = getActiveModifiers();
  camShake = Math.max(camShake, intensity * mods.shakeMod);
  if (mods.shakeMod <= 0) return;

  camera.fov = 56;
  camera.updateProjectionMatrix();
  AudioSys.playScare();

  // Sin filtro CSS sobre el canvas WebGL (provocaba un tirón al crear la capa la primera vez)
  const flash = document.getElementById('scare-flash');
  flash.style.opacity = 1;
  setTimeout(() => {
    flash.style.opacity = 0;
  }, 180);
}

function togglePauseGame() {
  if (state === 'PLAYING') {
    state = 'PAUSED';
    AudioSys.playPause();
    if (document.pointerLockElement) document.exitPointerLock();
    document.getElementById('pause-screen').classList.remove('hidden');
    document.getElementById('btn-resume')?.focus();
  } else if (state === 'PAUSED') {
    state = 'PLAYING';
    AudioSys.playPause();
    document.getElementById('pause-screen').classList.add('hidden');
    document.body.requestPointerLock();
  }
}

// Controles
const keys = {};
window.addEventListener('keydown', e => {
  if (e.key === 'Tab' && state !== 'LEVEL_UP') {
    e.preventDefault();
    const modal = document.getElementById('sheets-modal');
    const isHidden = modal.classList.toggle('hidden');
    if (!isHidden && document.pointerLockElement) document.exitPointerLock();
    return;
  }

  const k = e.key.toLowerCase();

  if (state === 'LEVEL_UP') {
    const cards = Array.from(document.querySelectorAll('#upgrade-container .upg-card'));
    if (['1', '2', '3', '4'].includes(k)) {
      const idx = parseInt(k, 10) - 1;
      if (cards[idx]) {
        e.preventDefault();
        cards[idx].click();
      }
      return;
    }
    if (k === 'r') {
      e.preventDefault();
      document.getElementById('btn-reroll')?.click();
      return;
    }
    if (['arrowright', 'arrowdown', 'arrowleft', 'arrowup'].includes(k) && cards.length > 0) {
      e.preventDefault();
      const activeIdx = cards.indexOf(document.activeElement);
      const step = (k === 'arrowright' || k === 'arrowdown') ? 1 : -1;
      const nextIdx = activeIdx === -1 ? 0 : (activeIdx + step + cards.length) % cards.length;
      cards[nextIdx].focus();
      AudioSys.playUIClick();
      return;
    }
    return;
  }

  if (k === 'p' && (state === 'PLAYING' || state === 'PAUSED')) {
    e.preventDefault();
    togglePauseGame();
    return;
  }

  keys[k] = true;
  if (state !== 'PLAYING') return;

  if (k === 'shift' && dashCd <= 0 && stats.stamina >= 35 && dashTimer <= 0) {
    stats.stamina -= 35;
    document.getElementById('stam-bar').style.width = Math.max(0, stats.stamina) + '%';
    dashCd = 0.85;
    dashTimer = 0.22;
    dashGhostTimer = 0;
    invuln = 0.35;

    const camFwd = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    const camRight = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    dashDirVec.set(0, 0, 0);
    if (keys.w) dashDirVec.add(camFwd);
    if (keys.s) dashDirVec.sub(camFwd);
    if (keys.d) dashDirVec.add(camRight);
    if (keys.a) dashDirVec.sub(camRight);

    if (dashDirVec.lengthSq() > 0) {
      dashDirVec.normalize();
      playerFacingYaw = Math.atan2(-dashDirVec.x, -dashDirVec.z);
    } else {
      dashDirVec.set(-Math.sin(playerFacingYaw), 0, -Math.cos(playerFacingYaw)).normalize();
    }

    camera.fov = 77;
    camera.updateProjectionMatrix();
    AudioSys.play(340, 0.11, 'triangle', 0.07);
    AudioSys.play(160, 0.14, 'sawtooth', 0.05);
  }
  if (e.code === 'Space' && isGrounded) {
    playerYVel = 9.2;
    isGrounded = false;
    AudioSys.play(220, 0.1, 'sine');
  }
});
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
document.addEventListener('mousemove', e => {
  if (document.pointerLockElement === document.body && state === 'PLAYING') {
    const sens = (gameSettings.mouseSens || 100) / 100;
    yaw -= e.movementX * 0.0028 * sens;
    pitch = Math.max(-0.95, Math.min(0.5, pitch - e.movementY * 0.0024 * sens));
  }
});

function damageEnemy(en, amount, knockback, isDoT = false) {
  if (!en.active || en.state === 'dead') return;
  const mods = getActiveModifiers();
  const isCrit = !isDoT && Math.random() < mods.critChance;
  const finalDmg = isCrit ? amount * 2.0 : amount;

  en.hp -= finalDmg;
  if (!isDoT) {
    en.state = 'hurt';
    en.stateTimer = 0.15;
    AudioSys.play(isCrit ? 290 : 145, 0.05, 'square', 0.035);
  }
  if (knockback && !en.isBoss) {
    en.group.position.add(knockback);
    worldPhysics.resolveCollision(en.group.position, 0.55, en.group.position.y);
  }

  if (en.isBoss) {
    updateBossHUD(!isDoT);
  }

  if (en.hp <= 0) {
    en.hp = 0;
    en.state = 'dead';
    en.stateTimer = 0;
    kills++;

    if (en.isBoss) {
      bossesDefeated++;
      runSouls += en.bossData.teethReward || 15;
      bossTargetPct = 0;
      bossTrailHoldTimer = 0.08;
      const hpBarEl = document.getElementById('boss-hp-bar');
      const hpNumEl = document.getElementById('boss-hp-num');
      if (hpBarEl) hpBarEl.style.width = '0%';
      if (hpNumEl) hpNumEl.textContent = `0 / ${Math.ceil(en.maxHp)} (DERROTADO)`;

      activeBoss = null;
      if (bossHideHudTimeout) clearTimeout(bossHideHudTimeout);
      bossHideHudTimeout = setTimeout(() => {
        if (!activeBoss) document.getElementById('boss-hud').classList.add('hidden');
      }, 650);

      AudioSys.playBossHorn();
      spawnLorePickup(en.group.position, 'chest');

      if (bossesDefeated >= CONFIG.BOSS_SCHEDULE.length && !isEndgame) {
        activateEndgamePhase();
      }
    } else {
      const isTooth = Math.random() < 0.26;
      spawnLorePickup(en.group.position, isTooth ? 'tooth' : 'serum');
    }
    updateStatsHUD();
  }
}

function applyUpgradeOption(opt) {
  AudioSys.playUISelect();
  lastUpgradedKey = opt.id;
  careerStats.totalUpgradesBought++;
  saveCareer();

  if (opt.category === 'weapon') {
    const current = skills[opt.id] || 0;
    if (current >= CONFIG.LIMITS.MAX_LEVEL) return;
    if (current === 0 && Object.keys(skills).length >= CONFIG.LIMITS.MAX_WEAPONS) return;
    skills[opt.id] = current + 1;

    if (opt.id === 'orbital') {
      syncOrbitalsCount();
    }
    if (HAND_WEAPONS.includes(opt.id)) {
      currentHandWeapon = opt.id;
    }
    prewarmLoadoutSheets();
    syncPlayerVisualLoadout(currentHandWeapon);
  } else if (opt.category === 'passive') {
    const current = passives[opt.id] || 0;
    if (current >= CONFIG.LIMITS.MAX_LEVEL) return;
    if (current === 0 && Object.keys(passives).length >= CONFIG.LIMITS.MAX_PASSIVES) return;
    passives[opt.id] = current + 1;

    if (opt.id === 'maxHp') {
      const bonus = CONFIG.PASSIVES.maxHp.perLevel;
      stats.maxHp += bonus;
      stats.hp = Math.min(stats.maxHp, stats.hp + bonus);
    }
    if (opt.id === 'multishot') {
      syncOrbitalsCount();
    }
  } else if (opt.category === 'fallback') {
    if (opt.id === 'heal_pack') stats.hp = Math.min(stats.maxHp, stats.hp + 75);
    if (opt.id === 'teeth_bag') runSouls += 15;
  }
  updateHUD();
}

function buildAvailableUpgradePool() {
  const pool = [];
  const weaponsCount = Object.keys(skills).length;
  const passivesCount = Object.keys(passives).length;
  const weaponsFull = weaponsCount >= CONFIG.LIMITS.MAX_WEAPONS;
  const passivesFull = passivesCount >= CONFIG.LIMITS.MAX_PASSIVES;

  Object.keys(CONFIG.SKILLS).forEach(id => {
    const lvl = skills[id] || 0;
    if (lvl >= CONFIG.LIMITS.MAX_LEVEL) return;
    if (weaponsFull && lvl === 0) return;
    const sk = CONFIG.SKILLS[id];
    pool.push({
      category: 'weapon', id, name: sk.name, icon: sk.icon,
      currentLvl: lvl, nextLvl: lvl + 1,
      badge: lvl === 0 ? 'ARMA NUEVA' : 'MEJORA DE ARMA',
      badgeClass: 'badge-weapon', desc: sk.desc
    });
  });

  Object.keys(CONFIG.PASSIVES).forEach(id => {
    const lvl = passives[id] || 0;
    if (lvl >= CONFIG.LIMITS.MAX_LEVEL) return;
    if (passivesFull && lvl === 0) return;
    const p = CONFIG.PASSIVES[id];
    pool.push({
      category: 'passive', id, name: p.name, icon: p.icon,
      currentLvl: lvl, nextLvl: lvl + 1,
      badge: lvl === 0 ? 'PASIVA NUEVA' : 'MEJORA PASIVA',
      badgeClass: 'badge-passive',
      desc: `${p.desc} (${p.format(lvl + 1)})`,
      affectedHtml: getPassiveAffectedWeaponsHTML(id)
    });
  });

  return pool;
}

function renderRerollChargesUI() {
  const chargesEl = document.getElementById('reroll-charges');
  if (!chargesEl) return;
  let html = '';
  for (let i = 0; i < maxRerollsRun; i++) {
    const isAvailable = i < rerollsLeft;
    const iconKey = isAvailable ? 'charge_on' : 'charge_off';
    const label = isAvailable ? `Fusible ${i + 1}: Disponible` : `Fusible ${i + 1}: Gastado`;
    html += `<span title="${label}">${renderSpriteIconHTML(iconKey, 'sm')}</span>`;
  }
  chargesEl.innerHTML = html;
}

function selectLevelUpCard(cardEl, opt) {
  document.querySelectorAll('#upgrade-container .upg-card').forEach(c => c.classList.remove('is-selected'));
  cardEl.classList.add('is-selected');
  applyUpgradeOption(opt);
  document.getElementById('level-up-screen').classList.add('hidden');
  state = 'PLAYING';
  document.body.requestPointerLock();
}

function rollLevelUpCards() {
  const box = document.getElementById('upgrade-container');
  box.innerHTML = '';

  const wCount = Object.keys(skills).length;
  const pCount = Object.keys(passives).length;
  document.getElementById('lvlup-slots-info').textContent =
    `ARMAS: ${wCount}/${CONFIG.LIMITS.MAX_WEAPONS} | PASIVAS: ${pCount}/${CONFIG.LIMITS.MAX_PASSIVES}`;

  const pool = buildAvailableUpgradePool();
  let choices = [];

  if (pool.length > 0) {
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    choices = shuffled.slice(0, CONFIG.LIMITS.OPTIONS_PER_LEVEL);
  } else {
    choices = CONFIG.FALLBACK_REWARDS.map(fb => ({
      category: 'fallback', id: fb.id, name: fb.name, icon: fb.icon,
      currentLvl: 8, nextLvl: 8,
      badge: 'SUMINISTRO DE EMERGENCIA', badgeClass: 'badge-fallback', desc: fb.desc
    }));
  }
  currentLevelChoices = choices;

  choices.forEach((opt, idx) => {
    const card = document.createElement('div');
    card.className = 'upg-card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `${opt.badge}: ${opt.name}`);
    card.title = `[Tecla ${idx + 1}] ${opt.name} — ${opt.desc}`;

    const badgeContent = opt.category === 'fallback'
      ? `<span>SUMINISTRO</span>`
      : (opt.currentLvl === 0
          ? `<span>NUEVO</span> ${renderSpriteBadgeHTML(1)}`
          : `${renderSpriteBadgeHTML(opt.currentLvl)} <span>▸</span> ${renderSpriteBadgeHTML(opt.nextLvl)}`);

    card.innerHTML = `
      <div>
        <span class="upg-type-badge ${opt.badgeClass}">${opt.badge}</span>
        <div class="upg-title-row">
          <span class="upg-title-left">${renderSpriteIconHTML(opt.icon)} <span>${opt.name}</span></span>
          <span class="upg-lvl-pill">${badgeContent}</span>
        </div>
        <p class="upg-desc">${opt.desc}</p>
      </div>
      ${opt.affectedHtml || ''}
    `;
    card.onmouseenter = () => AudioSys.playUIClick();
    card.onclick = () => selectLevelUpCard(card, opt);
    card.onkeydown = e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectLevelUpCard(card, opt);
      }
    };
    box.appendChild(card);
  });

  renderRerollChargesUI();
  const rerollBtn = document.getElementById('btn-reroll');
  const restLabel = rerollsLeft === 0
    ? '0 RESTANTES · AGOTADO'
    : (rerollsLeft === 1 ? '1 RESTANTE' : `${rerollsLeft} RESTANTES`);

  rerollBtn.innerHTML = `
    ${renderSpriteIconHTML('reroll', 'sm')}
    <span>ACTUALIZAR OPCIONES</span>
    <span class="reroll-count-pill">[<span id="reroll-count">${restLabel}</span>]</span>
  `;
  rerollBtn.disabled = rerollsLeft <= 0 || pool.length <= 1;
}

function showLevelUp() {
  state = 'LEVEL_UP';
  if (document.pointerLockElement) document.exitPointerLock();
  rollLevelUpCards();
  document.getElementById('level-up-screen').classList.remove('hidden');
  const firstCard = document.querySelector('#upgrade-container .upg-card');
  if (firstCard) firstCard.focus();
}

document.getElementById('btn-reroll').onclick = () => {
  if (rerollsLeft <= 0) {
    AudioSys.playUIError();
    return;
  }
  rerollsLeft--;
  AudioSys.playReroll();
  rollLevelUpCards();
  updateStatsHUD();
};

function spawnScheduledBoss(bossCfg, fwd) {
  AudioSys.playBossHorn();
  triggerScare(0.45);
  const boss = enemyPool.spawn(bossCfg.id, playerGroup.position, gameTime, fwd, worldPhysics, bossCfg);
  if (!boss) return;
  activeBoss = boss;

  if (bossHideHudTimeout) {
    clearTimeout(bossHideHudTimeout);
    bossHideHudTimeout = null;
  }
  bossTrailPct = 100;
  bossTargetPct = 100;
  bossTrailHoldTimer = 0;

  const trailEl = document.getElementById('boss-hp-segments');
  if (trailEl) trailEl.style.width = '100%';

  const alertEl = document.getElementById('boss-alert');
  alertEl.innerHTML = `${renderSpriteIconHTML('warning', 'sm')} <span>ALERTA: ${bossCfg.name} EN PLANTA</span> ${renderSpriteIconHTML('warning', 'sm')}`;
  alertEl.classList.remove('hidden');
  setTimeout(() => alertEl.classList.add('hidden'), 3800);

  updateBossHUD(false);
  updateStatsHUD();
  document.getElementById('boss-hud').classList.remove('hidden');
}

function updateBossHUD(triggerHitShake = false) {
  if (!activeBoss || !activeBoss.active) return;

  document.getElementById('boss-name').textContent = `// ${activeBoss.bossData.name}`;
  const phaseEl = document.getElementById('boss-phase');
  phaseEl.textContent = activeBoss.phase === 2 ? 'FASE II // FRENESÍ' : 'FASE I';
  phaseEl.classList.toggle('p2', activeBoss.phase === 2);

  const pct = Math.min(100, Math.max(0, (activeBoss.hp / activeBoss.maxHp) * 100));
  bossTargetPct = pct;
  if (bossTrailHoldTimer <= 0) {
    bossTrailHoldTimer = 0.18;
  }

  const hpBarEl = document.getElementById('boss-hp-bar');
  if (hpBarEl) hpBarEl.style.width = `${pct}%`;

  const hpNumEl = document.getElementById('boss-hp-num');
  if (hpNumEl) {
    hpNumEl.textContent = `${Math.ceil(Math.max(0, activeBoss.hp))} / ${Math.ceil(activeBoss.maxHp)} (${Math.ceil(pct)}%)`;
  }

  if (triggerHitShake) {
    const bossFrame = document.querySelector('.boss-bar-frame');
    if (bossFrame) {
      bossFrame.classList.add('boss-hit-flash', 'bar-shake');
      setTimeout(() => bossFrame.classList.remove('boss-hit-flash', 'bar-shake'), 140);
    }
  }
}

function activateEndgamePhase() {
  isEndgame = true;
  document.body.classList.add('endgame-mode');
  document.getElementById('endgame-banner').classList.remove('hidden');
  scene.fog.color.setHex(0x160303);
  scene.fog.density = 0.058;
  ambientLight.color.setHex(0x3a0808);
  AudioSys.setEndgameDrone(true);
  AudioSys.playBossHorn();
  updateStatsHUD();
}

function updateStatsHUD() {
  const hpPct = Math.min(100, Math.max(0, (stats.hp / stats.maxHp) * 100));
  const expPct = Math.min(100, Math.max(0, (stats.exp / Math.max(1, stats.maxExp)) * 100));
  const stamPct = Math.min(100, Math.max(0, stats.stamina));

  document.getElementById('hp-bar').style.width = `${hpPct}%`;
  document.getElementById('hp-text').textContent = `${Math.ceil(Math.max(0, stats.hp))}/${stats.maxHp}`;
  document.getElementById('exp-bar').style.width = `${expPct}%`;
  document.getElementById('stam-bar').style.width = `${stamPct}%`;
  document.getElementById('level-text').textContent = `CICLO ${String(stats.level).padStart(2, '0')}`;
  document.getElementById('kills-text').textContent = kills;
  document.getElementById('souls-hud').textContent = `${runSouls}`;

  // Actualizar el tercer contador compacto superior izquierdo (Fusibles de Reroll restantes)
  const compactItems = document.querySelectorAll('.counters-row-compact .compact-indicator-item');
  if (compactItems.length >= 3) {
    const valSpan = compactItems[2].querySelector('span:last-child');
    if (valSpan) valSpan.textContent = `${rerollsLeft}`;
  }

  const bossAlertBox = document.getElementById('boss-killed-alert');
  const bossesKilledEl = document.getElementById('bosses-killed-hud');
  if (bossesKilledEl) bossesKilledEl.textContent = `${bossesDefeated}/5`;
  if (bossAlertBox) {
    bossAlertBox.classList.toggle('hidden', bossesDefeated === 0 && !activeBoss);
  }

  // Actualizar nota de objetivo estilo Megabonk en el lateral izquierdo
  const objDesc = document.getElementById('objective-task-desc');
  const chkBox = document.querySelector('#hud-objective-tracker .checkbox-box');
  if (objDesc) {
    if (isEndgame) {
      objDesc.textContent = 'Sobrevive al Exterminio';
      if (chkBox) chkBox.textContent = '[X]';
    } else if (activeBoss && activeBoss.active) {
      objDesc.textContent = `Amputa: ${activeBoss.bossData.name.replace('EL ', '').replace('LA ', '')}`;
      if (chkBox) chkBox.textContent = '[!]';
    } else {
      objDesc.textContent = 'Encuentra y Amputa al Jefe';
      if (chkBox) chkBox.textContent = '[ ]';
    }
  }
}

function updateInventoryHUD() {
  const wEntries = Object.entries(skills);
  const wCountEl = document.getElementById('weapons-count');
  if (wCountEl) wCountEl.textContent = `${wEntries.length}/${CONFIG.LIMITS.MAX_WEAPONS}`;

  // Cuadrícula 2x2 de armas arriba a la izquierda (Icono + Nivel debajo como en Megabonk)
  let wHtml = '';
  for (let i = 0; i < CONFIG.LIMITS.MAX_WEAPONS; i++) {
    if (wEntries[i]) {
      const [k, v] = wEntries[i];
      const sk = CONFIG.SKILLS[k];
      const shortName = SHORT_WEAPON_NAMES[k] || sk.name.split(' ')[0];
      const vibClass = lastUpgradedKey === k ? 'vibrate-up' : '';
      wHtml += `
        <div class="weapon-slot ${vibClass}" tabindex="0" title="${sk.name} (Nivel +${v}) — ${sk.desc}">
          <span class="weapon-slot-name">${renderSpriteIconHTML(sk.icon, 'sm')} <span>${shortName}</span></span>
          <span class="weapon-slot-lvl-text">NV.${v}</span>
        </div>`;
    } else {
      wHtml += `
        <div class="weapon-slot empty" title="Ranura de arma disponible">
          <span class="weapon-slot-name"><span>VACÍA</span></span>
          <span class="weapon-slot-lvl-text">--</span>
        </div>`;
    }
  }
  document.getElementById('skills-bar').innerHTML = wHtml;

  // Fila horizontal de implantes pasivos en la bandeja inferior central (Estilo Megabonk)
  const pEntries = Object.entries(passives);
  const pCountEl = document.getElementById('passives-count');
  if (pCountEl) pCountEl.textContent = `${pEntries.length}`;

  let pHtml = '';
  for (let i = 0; i < CONFIG.LIMITS.MAX_PASSIVES; i++) {
    if (pEntries[i]) {
      const [k, v] = pEntries[i];
      const p = CONFIG.PASSIVES[k];
      const vibClass = lastUpgradedKey === k ? 'vibrate-up' : '';
      pHtml += `
        <div class="passive-slot ${vibClass}" tabindex="0" title="${p.name} (Nivel +${v}): ${p.format(v)} — ${p.desc}">
          <div class="passive-dock-icon-wrap">
            ${renderSpriteIconHTML(p.icon)}
          </div>
          <span class="passive-dock-lvl">x${v}</span>
        </div>`;
    } else {
      pHtml += `
        <div class="passive-slot empty" title="Ranura de implante pasivo disponible">
          <div class="passive-dock-icon-wrap">
            <span style="font-family:'Press Start 2P',monospace;font-size:8px;color:#6c7a65;">[ ]</span>
          </div>
          <span class="passive-dock-lvl">--</span>
        </div>`;
    }
  }
  document.getElementById('passives-bar').innerHTML = pHtml;
  lastUpgradedKey = null;
}

function updateHUD() {
  updateStatsHUD();
  updateInventoryHUD();
}

// Actualiza los puntos del Radar Circular (Arriba-Derecha) en tiempo real
function updateRadarHUD() {
  const enemyDot = document.querySelector('.radar-dot.enemy-approx');
  const bossDot = document.querySelector('.radar-dot.boss-approx');
  const threatLabel = document.getElementById('radar-threat-label');
  if (!enemyDot || !bossDot) return;

  const activeEnemies = enemyPool.active;
  const maxRadarDist = 32;

  // 1. Posición del Boss activo en el radar
  if (activeBoss && activeBoss.active && activeBoss.state !== 'dead') {
    bossDot.style.display = 'block';
    const dx = activeBoss.group.position.x - playerGroup.position.x;
    const dz = activeBoss.group.position.z - playerGroup.position.z;
    const cosY = Math.cos(-yaw);
    const sinY = Math.sin(-yaw);
    const rx = dx * cosY - dz * sinY;
    const rz = dx * sinY + dz * cosY;
    const normX = Math.max(-0.82, Math.min(0.82, rx / maxRadarDist));
    const normZ = Math.max(-0.82, Math.min(0.82, rz / maxRadarDist));
    bossDot.style.left = `${50 + normX * 42}%`;
    bossDot.style.top = `${50 + normZ * 42}%`;
    bossDot.style.right = 'auto';
  } else {
    bossDot.style.display = 'none';
  }

  // 2. Enemigo vivo más cercano en el radar
  let closest = null;
  let minDist = Infinity;
  for (let i = 0; i < activeEnemies.length; i++) {
    const e = activeEnemies[i];
    if (e.state === 'dead' || e.isBoss) continue;
    const d = e.group.position.distanceTo(playerGroup.position);
    if (d < minDist) {
      minDist = d;
      closest = e;
    }
  }

  if (closest) {
    enemyDot.style.display = 'block';
    const dx = closest.group.position.x - playerGroup.position.x;
    const dz = closest.group.position.z - playerGroup.position.z;
    const cosY = Math.cos(-yaw);
    const sinY = Math.sin(-yaw);
    const rx = dx * cosY - dz * sinY;
    const rz = dx * sinY + dz * cosY;
    const normX = Math.max(-0.8, Math.min(0.8, rx / maxRadarDist));
    const normZ = Math.max(-0.8, Math.min(0.8, rz / maxRadarDist));
    enemyDot.style.left = `${50 + normX * 40}%`;
    enemyDot.style.top = `${50 + normZ * 40}%`;
  } else {
    enemyDot.style.display = 'none';
  }

  if (threatLabel) {
    if (activeBoss && activeBoss.active) {
      threatLabel.textContent = 'ALERTA: JEFE';
      threatLabel.style.color = '#ff6b6b';
    } else if (minDist < 8) {
      threatLabel.textContent = 'PROXIMIDAD CRÍTICA';
      threatLabel.style.color = '#f0c954';
    } else {
      threatLabel.textContent = `HOSTILES: ${activeEnemies.length}`;
      threatLabel.style.color = '#a8c499';
    }
  }
}

function updateCareerScreen() {
  document.getElementById('career-runs').textContent = careerStats.runs;
  const m = String(Math.floor(careerStats.totalTimeSec / 60)).padStart(2, '0');
  const s = String(Math.floor(careerStats.totalTimeSec % 60)).padStart(2, '0');
  document.getElementById('career-best-time').textContent = `${m}:${s}`;
  document.getElementById('career-total-kills').textContent = careerStats.totalKills;
  document.getElementById('career-total-bosses').textContent = careerStats.totalBosses;
  document.getElementById('career-upgrades-count').textContent = careerStats.totalUpgradesBought;
}

function startGame() {
  AudioSys.init();
  AudioSys.setEndgameDrone(false);
  document.body.classList.remove('endgame-mode');
  document.getElementById('endgame-banner').classList.add('hidden');
  document.getElementById('boss-hud').classList.add('hidden');
  if (bossHideHudTimeout) {
    clearTimeout(bossHideHudTimeout);
    bossHideHudTimeout = null;
  }
  scene.fog.color.setHex(0x040604);
  scene.fog.density = 0.038;
  ambientLight.color.setHex(0x1e281d);

  enemyPool.clearAll();
  drops.forEach(d => scene.remove(d.group)); drops.length = 0;
  orbitals.forEach(o => { scene.remove(o.group); o.geo.dispose(); }); orbitals.length = 0;
  minesList.forEach(m => scene.remove(m.group)); minesList.length = 0;
  vfx.forEach(v => cleanupVfxItem(v)); vfx.length = 0;
  bossHazards.forEach(h => { scene.remove(h.mesh); h.mesh.geometry.dispose(); h.mesh.material.dispose(); }); bossHazards.length = 0;
  bossProjectiles.forEach(p => { scene.remove(p.mesh); p.mesh.material.dispose(); }); bossProjectiles.length = 0;

  careerStats.runs++;
  saveCareer();

  const baseHp = 100 + (save.hp || 0) * 5;
  stats = { maxHp: baseHp, hp: baseHp, stamina: 100, level: 1, exp: 0, maxExp: 5 };
  skills = {};
  passives = {};
  maxRerollsRun = CONFIG.LIMITS.REROLLS_PER_RUN + Math.min(3, save.reroll || 0);
  rerollsLeft = maxRerollsRun;
  nextBossIdx = 0;
  activeBoss = null;
  bossesDefeated = 0;
  isEndgame = false;
  bossTrailPct = 100;
  bossTargetPct = 100;

  skills.slash = 1;
  currentHandWeapon = 'slash';
  yaw = 0;
  playerFacingYaw = 0;
  aimLockTimer = 0;
  dashTimer = 0;
  prewarmLoadoutSheets();
  syncPlayerVisualLoadout('slash');
  auraMesh.visible = false;

  playerGroup.position.set(0, 0, 0);
  playerYVel = 0;
  gameTime = 0;
  runSouls = 0;
  kills = 0;

  document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden'));
  document.getElementById('hud').classList.remove('hidden');
  updateHUD();
  refreshStaticDOMIcons();
  state = 'PLAYING';
  document.body.requestPointerLock();
}

function gameOver() {
  state = 'GAME_OVER';
  if (document.pointerLockElement) document.exitPointerLock();

  save.souls = (save.souls || 0) + runSouls;
  saveGame();

  careerStats.totalKills += kills;
  careerStats.totalBosses += bossesDefeated;
  if (gameTime > careerStats.totalTimeSec) {
    careerStats.totalTimeSec = gameTime;
  }
  saveCareer();

  document.getElementById('go-time').textContent = document.getElementById('timer-text').textContent;
  document.getElementById('go-bosses').textContent = `${bossesDefeated} / ${CONFIG.BOSS_SCHEDULE.length}`;
  document.getElementById('go-kills').textContent = kills;
  document.getElementById('go-souls').innerHTML = `+${runSouls} ${renderSpriteIconHTML('tooth', 'sm')}`;
  document.getElementById('go-total-souls').innerHTML = `${save.souls} ${renderSpriteIconHTML('tooth', 'sm')}`;
  document.getElementById('go-level').textContent = `CICLO ${stats.level}`;
  document.getElementById('go-endgame').textContent = isEndgame
    ? 'ALCANZADA (PROTOCOLO 15:00 SUPERADO)'
    : 'CAÍDO ANTES DEL MINUTO 15:00';

  const wSummary = Object.entries(skills)
    .map(([k, v]) => `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:8px;">${renderSpriteIconHTML(CONFIG.SKILLS[k].icon, 'sm')} ${CONFIG.SKILLS[k].name} ${renderSpriteBadgeHTML(v)}</span>`)
    .join('');
  const pSummary = Object.entries(passives)
    .map(([k, v]) => `<span style="display:inline-flex;align-items:center;gap:4px;margin-right:8px;">${renderSpriteIconHTML(CONFIG.PASSIVES[k].icon, 'sm')} ${CONFIG.PASSIVES[k].name} ${renderSpriteBadgeHTML(v)}</span>`)
    .join('');
  document.getElementById('go-loadout').innerHTML =
    `<div style="margin-bottom:6px;"><b>ARMAS:</b> ${wSummary || 'Ninguna'}</div><div><b>PASIVAS:</b> ${pSummary || 'Ninguna'}</div>`;

  document.getElementById('hud').classList.add('hidden');
  document.getElementById('game-over-screen').classList.remove('hidden');
}

function dealDamageToPlayer(dmgAmount) {
  if (invuln > 0 || state !== 'PLAYING') return;
  stats.hp -= dmgAmount;
  invuln = 0.72;
  triggerScare(0.48);

  const hpFrame = document.querySelector('.hp-frame, .hp-frame-compact, .biometrics-plate-compact');
  if (hpFrame) {
    hpFrame.classList.add('bar-shake');
    setTimeout(() => hpFrame.classList.remove('bar-shake'), 320);
  }

  document.getElementById('damage-flash').style.opacity = 1;
  setTimeout(() => (document.getElementById('damage-flash').style.opacity = 0), 150);
  updateStatsHUD();
  if (stats.hp <= 0) gameOver();
}

function renderShop() {
  document.getElementById('start-souls').textContent = save.souls || 0;
  document.getElementById('shop-souls').textContent = save.souls || 0;
  const goTotal = document.getElementById('go-total-souls');
  if (goTotal) goTotal.innerHTML = `${save.souls || 0} ${renderSpriteIconHTML('tooth', 'sm')}`;

  const list = document.getElementById('shop-list');
  list.innerHTML = '';

  CONFIG.SHOP.forEach(item => {
    const lvl = save[item.id] || 0;
    const isMaxed = item.max && lvl >= item.max;
    const cost = Math.floor(item.cost * Math.pow(1.45, lvl));
    const canAfford = (save.souls || 0) >= cost && !isMaxed;

    const row = document.createElement('div');
    row.className = 'shop-row';
    row.innerHTML = `
      <div class="shop-row-left">
        ${renderSpriteIconHTML(item.icon || 'dmg')}
        <div class="shop-row-info">
          <b>${item.name} [NV. ${lvl}${item.max ? '/' + item.max : ''}]</b>
          <div class="shop-row-sub">${item.desc}</div>
        </div>
      </div>
      <button class="rust-btn sm" ${!canAfford ? 'disabled' : ''}>
        <span>${isMaxed ? 'MÁXIMO' : `COMPRAR (${cost})`}</span>
        ${!isMaxed ? renderSpriteIconHTML('tooth', 'sm') : ''}
      </button>
    `;
    const btn = row.querySelector('button');
    btn.onmouseenter = () => AudioSys.playUIClick();
    btn.onclick = () => {
      if (canAfford) {
        AudioSys.playUISelect();
        save.souls -= cost;
        save[item.id] = lvl + 1;
        saveGame();
        renderShop();
      } else {
        AudioSys.playUIError();
      }
    };
    list.appendChild(row);
  });
}

// Bucle Principal
const clock = new THREE.Clock();
let regenHudTimer = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);

  updateCombatLight(dt);

  // Contador de FPS en vivo
  if (gameSettings.fpsCounter) {
    fpsFrames++;
    fpsTimer += dt;
    if (fpsTimer >= 0.5) {
      currentFps = Math.round(fpsFrames / fpsTimer);
      fpsFrames = 0;
      fpsTimer = 0;
      const fpsValEl = document.getElementById('fps-val');
      if (fpsValEl) fpsValEl.textContent = currentFps;
    }
  }

  ceilingLights.forEach(cl => {
    cl.light.intensity = Math.random() < (isEndgame ? 0.15 : 0.04) ? 2 : cl.baseIntensity;
    if (isEndgame) cl.light.color.setHex(0xc42020);
    else cl.light.color.setHex(0xb89c46);
  });

  if (state === 'PLAYING') {
    gameTime += dt;
    const mods = getActiveModifiers();

    if (invuln > 0) invuln -= dt;
    if (dashCd > 0) dashCd -= dt;
    if (atkAnimTimer > 0) atkAnimTimer -= dt;
    if (aimLockTimer > 0) aimLockTimer -= dt;
    stats.stamina = Math.min(100, stats.stamina + dt * 22);
    document.getElementById('stam-bar').style.width = `${Math.min(100, Math.max(0, stats.stamina))}%`;

    const pickupFrameOffset = (Math.floor(gameTime * 6.5) % 4) * 0.25;
    PICKUP_ASSETS.texs.serum.offset.x = pickupFrameOffset;
    PICKUP_ASSETS.texs.tooth.offset.x = pickupFrameOffset;
    PICKUP_ASSETS.texs.chest.offset.x = pickupFrameOffset;

    if (bossTrailPct > bossTargetPct) {
      if (bossTrailHoldTimer > 0) {
        bossTrailHoldTimer -= dt;
      } else {
        const dropSpeed = Math.max(24, (bossTrailPct - bossTargetPct) * 3.8);
        bossTrailPct = Math.max(bossTargetPct, bossTrailPct - dropSpeed * dt);
        const trailEl = document.getElementById('boss-hp-segments');
        if (trailEl) trailEl.style.width = `${bossTrailPct}%`;
      }
    }

    if (mods.regenPerSec > 0 && stats.hp < stats.maxHp) {
      stats.hp = Math.min(stats.maxHp, stats.hp + mods.regenPerSec * dt);
      regenHudTimer += dt;
      if (regenHudTimer >= 0.25) {
        regenHudTimer = 0;
        document.getElementById('hp-bar').style.width = Math.max(0, (stats.hp / stats.maxHp) * 100) + '%';
        document.getElementById('hp-text').textContent = `${Math.ceil(Math.max(0, stats.hp))}/${stats.maxHp}`;
      }
    }

    if (Math.abs(camera.fov - targetFov) > 0.2) {
      camera.fov += (targetFov - camera.fov) * dt * 8;
      camera.updateProjectionMatrix();
    }

    const camFwd = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    const camRight = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    const move = new THREE.Vector3();
    if (keys.w) move.add(camFwd);
    if (keys.s) move.sub(camFwd);
    if (keys.d) move.add(camRight);
    if (keys.a) move.sub(camRight);
    const isMoving = move.lengthSq() > 0;

    if (dashTimer > 0) {
      dashTimer -= dt;
      const dashSpeed = 20.5;
      playerGroup.position.addScaledVector(dashDirVec, dashSpeed * dt);
      worldPhysics.resolveCollision(playerGroup.position, 0.55, playerGroup.position.y);

      dashGhostTimer -= dt;
      if (dashGhostTimer <= 0) {
        dashGhostTimer = 0.045;
        spawnDashAfterimage();
      }
    } else if (isMoving) {
      move.normalize();
      if (aimLockTimer <= 0) {
        playerFacingYaw = Math.atan2(-move.x, -move.z);
      }
      playerGroup.position.addScaledVector(move, mods.moveSpeed * dt);
      worldPhysics.resolveCollision(playerGroup.position, 0.55, playerGroup.position.y);
    }

    playerBillboard.facingYaw = playerFacingYaw;

    const groundY = worldPhysics.getGroundHeight(playerGroup.position.x, playerGroup.position.z, playerGroup.position.y);
    if (playerGroup.position.y > groundY || playerYVel !== 0) {
      playerGroup.position.y += playerYVel * dt;
      playerYVel -= 23 * dt;
      if (playerGroup.position.y <= groundY) {
        playerGroup.position.y = groundY;
        playerYVel = 0;
        isGrounded = true;
      }
    } else {
      playerGroup.position.y = groundY;
      isGrounded = true;
    }
    document.getElementById('elev-text').textContent = `COTA: ${playerGroup.position.y.toFixed(1)}M`;

    camera.position.copy(playerGroup.position)
      .add(camFwd.clone().multiplyScalar(-5.8 * Math.cos(pitch)))
      .add(new THREE.Vector3(0, Math.max(1.1, -Math.sin(pitch) * 5.2 + 2.1), 0));
    if (camShake > 0) {
      camera.position.x += (Math.random() - 0.5) * camShake;
      camera.position.y += (Math.random() - 0.5) * camShake;
      camShake = Math.max(0, camShake - dt * 1.8);
    }
    camera.lookAt(playerGroup.position.clone().add(new THREE.Vector3(0, 1.3, 0)));

    playerBillboard.faceCamera(camera.position);

    const ST = CONFIG.DIRECTIONAL.STATES;
    const FPS = CONFIG.DIRECTIONAL.ANIM_FPS;
    let pState = ST.IDLE;
    let fps = FPS.IDLE;

    if (dashTimer > 0) {
      pState = ST.DASH; fps = FPS.DASH;
    } else if (invuln > 0.38) {
      pState = ST.HURT; fps = FPS.HURT;
    } else if (atkAnimTimer > 0 && isMoving) {
      pState = ST.ATTACK_WALK; fps = FPS.ATTACK_WALK;
    } else if (atkAnimTimer > 0) {
      pState = ST.ATTACK; fps = FPS.ATTACK;
    } else if (!isGrounded) {
      pState = ST.JUMP; fps = FPS.JUMP;
    } else if (isMoving) {
      pState = ST.WALK; fps = FPS.WALK;
    }

    playerBillboard.animTimer += dt * fps;
    playerBillboard.setDirectionalFrame(
      playerBillboard.dirRow,
      pState,
      Math.floor(playerBillboard.animTimer) % CONFIG.DIRECTIONAL.FRAMES_PER_STATE
    );

    const camAngle = Math.atan2(camera.position.x - playerGroup.position.x, camera.position.z - playerGroup.position.z);
    propBillboards.forEach(p => { p.rotation.y = camAngle; });

    const toCam = new THREE.Vector3().subVectors(camera.position, playerGroup.position).setY(0).normalize();
    playerLanternLight.position.copy(playerGroup.position)
      .addScaledVector(toCam, 1.1)
      .add(new THREE.Vector3(0, 1.35, 0));

    flashlight.position.copy(playerGroup.position)
      .addScaledVector(camFwd, 0.55)
      .add(new THREE.Vector3(0, 1.5, 0));
    flashlight.target.position.copy(flashlight.position).add(camFwd);
    flashlight.intensity = Math.random() < 0.03 ? 25 : 195;

    if (nextBossIdx < CONFIG.BOSS_SCHEDULE.length) {
      const nextCfg = CONFIG.BOSS_SCHEDULE[nextBossIdx];
      const rem = Math.max(0, nextCfg.time - gameTime);
      const bm = String(Math.floor(rem / 60)).padStart(2, '0');
      const bs = String(Math.floor(rem % 60)).padStart(2, '0');
      document.getElementById('next-boss-text').textContent = `PRÓX. BOSS: ${bm}:${bs}`;

      if (gameTime >= nextCfg.time) {
        spawnScheduledBoss(nextCfg, camFwd);
        nextBossIdx++;
      }
    } else {
      document.getElementById('next-boss-text').textContent = 'FASE FINAL ACTIVA';
    }

    if (!isEndgame && gameTime >= CONFIG.DIFFICULTY.ENDGAME_START_TIME) {
      activateEndgamePhase();
    }

    const cdFactor = 1 / mods.atkSpeedMult;
    const activeEnemies = enemyPool.active;

    if (skills.slash) {
      weaponTimers.slash += dt;
      const cd = Math.max(0.26, (CONFIG.SKILLS.slash.baseCd - skills.slash * 0.06) * cdFactor);
      if (weaponTimers.slash >= cd) {
        weaponTimers.slash = 0;
        const slashYaw = executeSawSlash(
          scene, playerGroup.position, yaw, skills.slash, mods,
          activeEnemies, vfx, damageEnemy, s => { camShake = Math.max(camShake, s * mods.shakeMod); },
          playerFacingYaw
        );
        triggerWeaponVisualAttack('slash', slashYaw, 0.22);
      }
    }

    if (skills.shotgun) {
      weaponTimers.shotgun += dt;
      const cd = Math.max(0.4, (CONFIG.SKILLS.shotgun.baseCd - skills.shotgun * 0.08) * cdFactor);
      if (weaponTimers.shotgun >= cd) {
        const shotYaw = fireBuckshot(
          scene, playerGroup.position, yaw, playerFacingYaw, skills.shotgun, mods,
          activeEnemies, vfx, damageEnemy, () => { camShake = Math.max(camShake, 0.2 * mods.shakeMod); }
        );
        if (shotYaw !== null) {
          weaponTimers.shotgun = 0;
          triggerWeaponVisualAttack('shotgun', shotYaw, 0.28);
        }
      }
    }

    if (skills.flamethrower) {
      weaponTimers.flamethrower += dt;
      if (weaponTimers.flamethrower >= CONFIG.SKILLS.flamethrower.baseCd * cdFactor) {
        weaponTimers.flamethrower = 0;
        fireFlamethrower(scene, playerGroup.position, yaw, skills.flamethrower, mods, activeEnemies, vfx, damageEnemy, playerFacingYaw);
        if (atkAnimTimer <= 0.05) {
          triggerWeaponVisualAttack('flamethrower', yaw, 0.14);
        }
      }
    }

    if (skills.aura) {
      auraMesh.visible = true;
      const auraRadius = (CONFIG.SKILLS.aura.baseRange + skills.aura * 0.35) * mods.areaMult;
      auraMesh.scale.set(auraRadius * 2, auraRadius * 2, 1);
      auraMesh.position.set(playerGroup.position.x, playerGroup.position.y + 0.06, playerGroup.position.z);
      auraMesh.rotation.z += dt * 1.4;

      weaponTimers.aura += dt;
      if (weaponTimers.aura >= CONFIG.SKILLS.aura.baseCd * cdFactor) {
        weaponTimers.aura = 0;
        const dmg = CONFIG.SKILLS.aura.baseDmg * (1 + (skills.aura - 1) * 0.22) * mods.dmgMult;
        activeEnemies.forEach(e => {
          if (e.state !== 'dead' && e.group.position.distanceTo(playerGroup.position) < auraRadius) {
            e.slowTimer = 0.6;
            damageEnemy(e, dmg, null, true);
          }
        });
      }
    }

    if (skills.mines) {
      weaponTimers.mines += dt;
      const cd = Math.max(0.85, (CONFIG.SKILLS.mines.baseCd - skills.mines * 0.16) * cdFactor);
      const maxMines = 10 + mods.bonusProjectiles * 4;
      if (weaponTimers.mines >= cd && minesList.length < maxMines) {
        weaponTimers.mines = 0;
        spawnShrapnelMine(scene, playerGroup.position, skills.mines, mods, worldPhysics, minesList);
        triggerWeaponVisualAttack('mines', playerFacingYaw, 0.22);
      }
    }

    if (skills.harpoon) {
      weaponTimers.harpoon += dt;
      const cd = Math.max(0.5, (CONFIG.SKILLS.harpoon.baseCd - skills.harpoon * 0.1) * cdFactor);
      if (weaponTimers.harpoon >= cd) {
        weaponTimers.harpoon = 0;
        const harpoonYaw = fireHarpoon(scene, playerGroup.position, yaw, skills.harpoon, mods, activeEnemies, vfx, damageEnemy, playerFacingYaw);
        triggerWeaponVisualAttack('harpoon', harpoonYaw, 0.25);
      }
    }

    if (skills.bolt) {
      weaponTimers.bolt += dt;
      const cd = Math.max(0.5, (CONFIG.SKILLS.bolt.baseCd - skills.bolt * 0.12) * cdFactor);
      if (weaponTimers.bolt >= cd) {
        const boltYaw = fireDefibrillator(scene, playerGroup.position, playerFacingYaw, skills.bolt, mods, activeEnemies, vfx, damageEnemy);
        if (boltYaw !== null) {
          weaponTimers.bolt = 0;
          triggerWeaponVisualAttack('bolt', boltYaw, 0.24);
        }
      }
    }

    orbitals.forEach(o => {
      const lvl = skills.orbital || 1;
      o.angle += dt * (2.7 + lvl * 0.38) * mods.atkSpeedMult;
      o.animTimer += dt * 8;
      setPlaneFrameUV(o.geo, 4, 1, Math.floor(o.animTimer) % 4, 0);

      const r = (CONFIG.SKILLS.orbital.baseRange + lvl * 0.15) * mods.areaMult;
      o.group.position.set(
        playerGroup.position.x + Math.cos(o.angle) * r,
        playerGroup.position.y + 1.05 + Math.sin(o.animTimer) * 0.12,
        playerGroup.position.z + Math.sin(o.angle) * r
      );
      o.sprite.rotation.y = camAngle;

      o.trailTimer -= dt;
      if (o.trailTimer <= 0) {
        o.trailTimer = 0.065;
        const ember = new THREE.Mesh(
          SHARED_GEO.spark,
          new THREE.MeshBasicMaterial({ color: Math.random() < 0.5 ? 0xb89c46 : 0x6e1414, transparent: true, opacity: 0.8 })
        );
        ember.position.copy(o.group.position);
        scene.add(ember);
        vfx.push({ mesh: ember, disposeMat: true, life: 0.2, maxLife: 0.2, fade: true, scaleSpeed: -2.5 });
      }

      if (o.hitCd > 0) o.hitCd -= dt;
      activeEnemies.forEach(e => {
        if (e.state !== 'dead' && e.group.position.distanceTo(o.group.position) < 1.45) {
          const mult = 1 + (lvl - 1) * CONFIG.SKILLS.orbital.scalePerLvl;
          damageEnemy(e, CONFIG.SKILLS.orbital.baseDmg * mult * mods.dmgMult * dt, null, true);

          if (o.hitCd <= 0) {
            o.hitCd = 0.18;
            AudioSys.play(310, 0.05, 'sawtooth', 0.03);
            const blood = new THREE.Mesh(SHARED_GEO.spark, SHARED_MAT.sparkBlood);
            blood.position.copy(o.group.position);
            scene.add(blood);
            vfx.push({
              mesh: blood, life: 0.2,
              vel: new THREE.Vector3((Math.random() - 0.5) * 4, 2.5, (Math.random() - 0.5) * 4),
              gravity: 15, floorY: playerGroup.position.y + 0.05
            });
          }
        }
      });
    });

    for (let i = minesList.length - 1; i >= 0; i--) {
      const m = minesList[i];
      m.life -= dt; m.armTimer -= dt;
      m.led.visible = Math.floor(gameTime * 8) % 2 === 0;

      let triggered = m.life <= 0;
      if (m.armTimer <= 0) {
        triggered = activeEnemies.some(e => e.state !== 'dead' && e.group.position.distanceTo(m.group.position) < 1.65);
      }
      if (triggered) {
        const blastRadius = (CONFIG.SKILLS.mines.baseRange + m.level * 0.3) * mods.areaMult;
        const dmg = CONFIG.SKILLS.mines.baseDmg * (1 + (m.level - 1) * 0.28) * mods.dmgMult;
        AudioSys.play(68, 0.28, 'sawtooth', 0.11);
        camShake = Math.max(camShake, 0.22 * mods.shakeMod);

        const blast = new THREE.Mesh(
          new THREE.PlaneGeometry(blastRadius * 1.4, blastRadius * 1.4),
          new THREE.MeshBasicMaterial({ color: 0xff8822, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
        );
        blast.position.copy(m.group.position).add(new THREE.Vector3(0, 1.0, 0));
        scene.add(blast);
        vfx.push({ mesh: blast, disposeGeo: true, disposeMat: true, life: 0.2, maxLife: 0.2, billboard: true, fade: true });

        activeEnemies.forEach(e => {
          if (e.state !== 'dead' && e.group.position.distanceTo(m.group.position) < blastRadius) {
            const knock = new THREE.Vector3().subVectors(e.group.position, m.group.position).setY(0).normalize().multiplyScalar(2.4);
            damageEnemy(e, dmg, knock);
          }
        });
        scene.remove(m.group);
        minesList.splice(i, 1);
      }
    }

    for (let i = bossHazards.length - 1; i >= 0; i--) {
      const h = bossHazards[i];
      h.timer -= dt;
      h.mesh.material.opacity = 0.25 + Math.abs(Math.sin(gameTime * 18)) * 0.55;

      if (h.timer <= 0) {
        if (h.type === 'charge_line') {
          if (h.boss && h.boss.active && h.boss.state !== 'dead') {
            h.boss.chargeVec = h.dir;
            h.boss.chargeTime = 0.65;
            AudioSys.play(90, 0.3, 'sawtooth', 0.09);
          }
        } else if (h.type === 'circle') {
          AudioSys.play(72, 0.26, 'sawtooth', 0.1);
          camShake = Math.max(camShake, 0.25 * mods.shakeMod);
          const pillar = new THREE.Mesh(
            new THREE.CylinderGeometry(h.radius * 0.85, h.radius, 3.6, 12),
            new THREE.MeshBasicMaterial({ color: 0xff5511, transparent: true, opacity: 0.85 })
          );
          pillar.position.copy(h.center).add(new THREE.Vector3(0, 1.8, 0));
          scene.add(pillar);
          vfx.push({ mesh: pillar, disposeGeo: true, disposeMat: true, life: 0.22, maxLife: 0.22, fade: true });

          if (playerGroup.position.distanceTo(h.center) <= h.radius) {
            dealDamageToPlayer(h.dmg);
          }
        } else if (h.type === 'cone') {
          AudioSys.play(82, 0.25, 'square', 0.1);
          camShake = Math.max(camShake, 0.25 * mods.shakeMod);
          const toP = new THREE.Vector3().subVectors(playerGroup.position, h.origin).setY(0);
          if (toP.length() <= h.radius && h.dir.angleTo(toP.clone().normalize()) <= h.arc) {
            dealDamageToPlayer(h.dmg);
          }
        }
        scene.remove(h.mesh);
        if (h.mesh.geometry) h.mesh.geometry.dispose();
        if (h.mesh.material) h.mesh.material.dispose();
        bossHazards.splice(i, 1);
      }
    }

    for (let i = bossProjectiles.length - 1; i >= 0; i--) {
      const p = bossProjectiles[i];
      p.life -= dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.x += 10 * dt;
      p.mesh.rotation.y += 12 * dt;

      if (p.mesh.position.distanceTo(playerGroup.position.clone().add(new THREE.Vector3(0, 1.0, 0))) < 0.95) {
        dealDamageToPlayer(p.dmg);
        p.life = 0;
      }
      if (p.life <= 0) {
        scene.remove(p.mesh);
        if (p.mesh.material) p.mesh.material.dispose();
        bossProjectiles.splice(i, 1);
      }
    }

    for (let i = vfx.length - 1; i >= 0; i--) {
      const v = vfx[i];
      v.life -= dt;
      if (v.uvTotalFrames && v.maxLife && v.mesh.geometry) {
        const progress = 1 - Math.max(0, v.life / v.maxLife);
        const frame = Math.min(v.uvTotalFrames - 1, Math.floor(progress * v.uvTotalFrames));
        setPlaneFrameUV(v.mesh.geometry, v.uvTotalFrames, 1, frame, 0);
      }
      if (v.vel) {
        v.mesh.position.addScaledVector(v.vel, dt);
        if (v.gravity) v.vel.y -= v.gravity * dt;
        const fy = v.floorY ?? 0.05;
        if (v.mesh.position.y < fy && v.gravity) {
          v.mesh.position.y = fy;
          v.vel.y *= -0.4; v.vel.x *= 0.6; v.vel.z *= 0.6;
        }
      }
      if (v.scaleSpeed) v.mesh.scale.addScalar(v.scaleSpeed * dt);
      if (v.spin) { v.mesh.rotation.x += v.spin.x * dt; v.mesh.rotation.z += v.spin.z * dt; }
      if (v.billboard) v.mesh.rotation.y = camAngle;
      if (v.fade && v.mesh.material && v.maxLife) {
        v.mesh.material.opacity = Math.max(0, v.life / v.maxLife);
      }
      if (v.life <= 0) {
        cleanupVfxItem(v);
        vfx.splice(i, 1);
      }
    }

    for (let i = activeEnemies.length - 1; i >= 0; i--) {
      const e = activeEnemies[i];
      const finishedDeath = e.update(dt, playerGroup.position, camFwd, camera.position, worldPhysics, {
        onScare: () => triggerScare(0.35),
        onDealDamage: attacker => dealDamageToPlayer(attacker.dmg),
        onBurnTick: (burningEnemy, burnDmg) => damageEnemy(burningEnemy, burnDmg, null, true),
        onBossPhaseChange: () => updateBossHUD(true),
        onBossSpecial: (boss, atkType) => {
          triggerBossSpecialAttack(
            scene, boss, atkType, playerGroup.position, worldPhysics,
            bossHazards, bossProjectiles,
            count => {
              for (let s = 0; s < count; s++) {
                enemyPool.spawn(s % 2 === 0 ? 'zombie' : 'worm', playerGroup.position, gameTime, camFwd, worldPhysics);
              }
            }
          );
        }
      });

      if (finishedDeath) {
        enemyPool.release(i);
      }
    }

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      if (!isEndgame) {
        const progress = Math.min(1, gameTime / CONFIG.DIFFICULTY.ENDGAME_START_TIME);
        spawnTimer = Math.max(
          CONFIG.DIFFICULTY.MIN_NORMAL_INTERVAL,
          CONFIG.DIFFICULTY.BASE_SPAWN_INTERVAL - progress * 0.82
        );
        const r = Math.random();
        const type = gameTime > 35 && r > 0.76 ? 'weeper' : gameTime > 12 && r < 0.28 ? 'worm' : 'zombie';
        enemyPool.spawn(type, playerGroup.position, gameTime, camFwd, worldPhysics);
      } else {
        spawnTimer = 0.12;
        for (let b = 0; b < CONFIG.DIFFICULTY.ENDGAME_SPAWN_BURST; b++) {
          const r = Math.random();
          const type = r > 0.65 ? 'weeper' : r < 0.3 ? 'worm' : 'zombie';
          enemyPool.spawn(type, playerGroup.position, gameTime, camFwd, worldPhysics);
        }
      }
    }

    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.spriteMesh.rotation.y = camAngle;
      d.spriteMesh.position.y = d.baseHeight + Math.sin(gameTime * 5.2 + d.bobPhase) * 0.1;

      const dist = d.group.position.distanceTo(playerGroup.position);
      if (dist < mods.magnetRange) {
        const pullDir = new THREE.Vector3().subVectors(playerGroup.position, d.group.position).normalize();
        d.group.position.addScaledVector(pullDir, 18.5 * dt);
      }
      if (dist < 1.45) {
        scene.remove(d.group);
        drops.splice(i, 1);

        if (d.isBossChest) {
          stats.hp = Math.min(stats.maxHp, stats.hp + stats.maxHp * 0.5);
          stats.level++;
          AudioSys.playUISelect();
          updateStatsHUD();
          showLevelUp();
        } else if (d.isTooth) {
          runSouls++;
          AudioSys.play(640, 0.07, 'sine', 0.05);
          updateStatsHUD();
        } else {
          stats.exp++;
          AudioSys.play(420, 0.06, 'sine', 0.04);
          if (stats.exp >= stats.maxExp) {
            stats.level++;
            stats.exp -= stats.maxExp;
            stats.maxExp = Math.floor(stats.maxExp * 1.38);
            showLevelUp();
          }
          updateStatsHUD();
        }
      }
    }

    dust.position.set(playerGroup.position.x, playerGroup.position.y, playerGroup.position.z);
    const m = String(Math.floor(gameTime / 60)).padStart(2, '0');
    const s = String(Math.floor(gameTime % 60)).padStart(2, '0');
    const timeFormatted = `${m}:${s}`;
    document.getElementById('timer-text').textContent = timeFormatted;
    const compactTimeEl = document.getElementById('compact-time-indicator');
    if (compactTimeEl) compactTimeEl.textContent = timeFormatted;

    document.getElementById('wave-text').textContent = isEndgame
      ? 'EXTERMINIO ACTIVO'
      : `AMENAZA: NIVEL ${1 + Math.floor(gameTime / 90)}`;

    updateRadarHUD();
  } else if (state === 'START') {
    const t = performance.now() * 0.00045;
    camera.position.set(Math.sin(t) * 11, 3.6, Math.cos(t) * 11);
    camera.lookAt(0, 1.1, 0);
    playerBillboard.facingYaw = 0;
    playerBillboard.faceCamera(camera.position);
    playerBillboard.animTimer += dt * CONFIG.DIRECTIONAL.ANIM_FPS.IDLE;
    playerBillboard.setDirectionalFrame(
      playerBillboard.dirRow,
      CONFIG.DIRECTIONAL.STATES.IDLE,
      Math.floor(playerBillboard.animTimer) % 4
    );
    playerLanternLight.position.set(Math.sin(t) * 3, 2.2, Math.cos(t) * 3);
  }

  renderer.render(scene, camera);
}

function initSpritesheetInspector() {
  const grid = document.getElementById('sheets-grid');
  grid.innerHTML = '';
  const list = [
    SpriteSheets.ui_atlas,
    SpriteSheets.env.pickup_serum,
    SpriteSheets.env.pickup_tooth,
    SpriteSheets.env.pickup_chest,
    SpriteSheets.player, SpriteSheets.zombie, SpriteSheets.weeper, SpriteSheets.worm,
    SpriteSheets.boss_butcher, SpriteSheets.boss_siren, SpriteSheets.boss_furnace,
    SpriteSheets.boss_apostle, SpriteSheets.boss_warden,
    SpriteSheets.env.slash, SpriteSheets.env.orbital,
    SpriteSheets.env.ground, SpriteSheets.env.crate, SpriteSheets.env.metal
  ];
  list.forEach(item => {
    if (!item || !item.canvas) return;
    const card = document.createElement('div');
    card.className = 'sheet-card';
    card.innerHTML = `<div class="sheet-card-title">${item.name}.png (${item.canvas.width}x${item.canvas.height})</div>`;
    item.canvas.style.width = '100%';
    item.canvas.style.height = 'auto';
    card.appendChild(item.canvas);
    const btn = document.createElement('button');
    btn.className = 'rust-btn sm';
    btn.style.marginTop = '6px';
    btn.innerHTML = '<span>⬇ DESCARGAR PNG</span>';
    btn.onmouseenter = () => AudioSys.playUIClick();
    btn.onclick = () => {
      AudioSys.playUISelect();
      const a = document.createElement('a');
      a.download = `${item.name}.png`;
      a.href = item.canvas.toDataURL('image/png');
      a.click();
    };
    card.appendChild(btn);
    grid.appendChild(card);
  });
}

document.querySelectorAll('.rust-btn').forEach(btn => {
  btn.addEventListener('mouseenter', () => {
    if (!btn.disabled) AudioSys.playUIClick();
  });
});

// Sincronización del menú de Ajustes del Sistema con localStorage y audio/vídeo
function applySettingsToDOM() {
  document.getElementById('set-master-vol').value = gameSettings.masterVol;
  document.getElementById('val-master-vol').textContent = `${gameSettings.masterVol}%`;
  document.getElementById('set-sfx-vol').value = gameSettings.sfxVol;
  document.getElementById('val-sfx-vol').textContent = `${gameSettings.sfxVol}%`;
  document.getElementById('set-amb-vol').value = gameSettings.ambVol;
  document.getElementById('val-amb-vol').textContent = `${gameSettings.ambVol}%`;

  const muteBtn = document.getElementById('btn-toggle-mute');
  muteBtn.querySelector('span').textContent = gameSettings.muted ? 'ACTIVADO (SILENCIO)' : 'DESACTIVADO';

  document.getElementById('set-res-scale').value = String(gameSettings.resScale);
  document.getElementById('set-fov').value = gameSettings.fov;
  document.getElementById('val-fov').textContent = `${gameSettings.fov}°`;

  const shadBtn = document.getElementById('btn-toggle-shadows');
  shadBtn.querySelector('span').textContent = gameSettings.shadows ? 'ACTIVADAS' : 'DESACTIVADAS';

  const crtBtn = document.getElementById('btn-toggle-crt');
  crtBtn.querySelector('span').textContent = gameSettings.crt ? 'ACTIVADOS' : 'DESACTIVADOS';

  const fpsBtn = document.getElementById('btn-toggle-fps');
  fpsBtn.querySelector('span').textContent = gameSettings.fpsCounter ? 'VISIBLE' : 'OCULTO';
  document.getElementById('fps-counter').classList.toggle('hidden', !gameSettings.fpsCounter);

  document.getElementById('set-sens').value = gameSettings.mouseSens;
  document.getElementById('val-sens').textContent = `${(gameSettings.mouseSens / 100).toFixed(1)}x`;

  document.getElementById('set-shake').value = gameSettings.camShake;
  document.getElementById('val-shake').textContent = `${gameSettings.camShake}%`;

  AudioSys.applySettings({
    masterVol: gameSettings.masterVol / 100,
    sfxVol: gameSettings.sfxVol / 100,
    ambVol: gameSettings.ambVol / 100,
    muted: gameSettings.muted
  });

  camera.fov = gameSettings.fov;
  camera.updateProjectionMatrix();
  renderer.shadowMap.enabled = gameSettings.shadows;
  flashlight.castShadow = gameSettings.shadows;
  document.getElementById('crt-overlay').style.display = gameSettings.crt ? 'block' : 'none';
  document.getElementById('grain-overlay').style.display = gameSettings.crt ? 'block' : 'none';
  updateResolution();
}

// Listeners de los controles de Ajustes
document.getElementById('set-master-vol').oninput = e => {
  gameSettings.masterVol = parseInt(e.target.value, 10);
  document.getElementById('val-master-vol').textContent = `${gameSettings.masterVol}%`;
  saveSettings();
  applySettingsToDOM();
};
document.getElementById('set-sfx-vol').oninput = e => {
  gameSettings.sfxVol = parseInt(e.target.value, 10);
  document.getElementById('val-sfx-vol').textContent = `${gameSettings.sfxVol}%`;
  saveSettings();
  applySettingsToDOM();
};
document.getElementById('set-amb-vol').oninput = e => {
  gameSettings.ambVol = parseInt(e.target.value, 10);
  document.getElementById('val-amb-vol').textContent = `${gameSettings.ambVol}%`;
  saveSettings();
  applySettingsToDOM();
};
document.getElementById('btn-toggle-mute').onclick = () => {
  AudioSys.playUISelect();
  gameSettings.muted = !gameSettings.muted;
  saveSettings();
  applySettingsToDOM();
};
document.getElementById('set-res-scale').onchange = e => {
  AudioSys.playUISelect();
  gameSettings.resScale = parseFloat(e.target.value);
  saveSettings();
  updateResolution();
};
document.getElementById('set-fov').oninput = e => {
  gameSettings.fov = parseInt(e.target.value, 10);
  document.getElementById('val-fov').textContent = `${gameSettings.fov}°`;
  saveSettings();
  applySettingsToDOM();
};
document.getElementById('btn-toggle-shadows').onclick = () => {
  AudioSys.playUISelect();
  gameSettings.shadows = !gameSettings.shadows;
  saveSettings();
  applySettingsToDOM();
};
document.getElementById('btn-toggle-crt').onclick = () => {
  AudioSys.playUISelect();
  gameSettings.crt = !gameSettings.crt;
  saveSettings();
  applySettingsToDOM();
};
document.getElementById('btn-toggle-fps').onclick = () => {
  AudioSys.playUISelect();
  gameSettings.fpsCounter = !gameSettings.fpsCounter;
  saveSettings();
  applySettingsToDOM();
};
document.getElementById('set-sens').oninput = e => {
  gameSettings.mouseSens = parseInt(e.target.value, 10);
  document.getElementById('val-sens').textContent = `${(gameSettings.mouseSens / 100).toFixed(1)}x`;
  saveSettings();
};
document.getElementById('set-shake').oninput = e => {
  gameSettings.camShake = parseInt(e.target.value, 10);
  document.getElementById('val-shake').textContent = `${gameSettings.camShake}%`;
  saveSettings();
};

document.getElementById('btn-reset-defaults').onclick = () => {
  AudioSys.playUISelect();
  gameSettings = {
    masterVol: 85, sfxVol: 90, ambVol: 80, muted: false,
    resScale: 0.44, fov: 70, shadows: true, crt: true, fpsCounter: false,
    mouseSens: 100, camShake: 100
  };
  saveSettings();
  applySettingsToDOM();
};

document.getElementById('btn-wipe-save').onclick = () => {
  if (confirm('¿Estás seguro de borrar todo tu progreso y dientes acumulados?')) {
    AudioSys.playUIError();
    localStorage.removeItem(CONFIG.SAVE_KEY);
    localStorage.removeItem('echoes_rust_career_v1');
    save = { souls: 0, dmg: 0, hp: 0, spd: 0, atkSpd: 0, mag: 0, reroll: 0 };
    careerStats = { runs: 0, totalTimeSec: 0, totalKills: 0, totalBosses: 0, totalUpgradesBought: 0 };
    renderShop();
    updateCareerScreen();
  }
};

const scaleSelect = document.getElementById('ui-scale-select');
if (scaleSelect) {
  scaleSelect.onchange = e => {
    AudioSys.playUISelect();
    const newScale = parseInt(e.target.value, 10) || 2;
    initUISpritesCSS(newScale);
    refreshStaticDOMIcons();
    if (state === 'PLAYING' || state === 'PAUSED' || state === 'LEVEL_UP') updateHUD();
    if (state === 'LEVEL_UP') rollLevelUpCards();
    renderShop();
  };
}

// Botones de navegación del Menú de Escritorio
document.getElementById('btn-start').onclick = () => { AudioSys.playUISelect(); startGame(); };
document.getElementById('btn-shop-play').onclick = () => { AudioSys.playUISelect(); startGame(); };
document.getElementById('btn-restart').onclick = () => { AudioSys.playUISelect(); startGame(); };

document.getElementById('btn-open-shop').onclick = () => {
  AudioSys.init();
  AudioSys.playUISelect();
  lastMenuScreen = 'start-screen';
  renderShop();
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('shop-screen').classList.remove('hidden');
};

document.getElementById('btn-open-settings').onclick = () => {
  AudioSys.playUISelect();
  lastMenuScreen = 'start-screen';
  applySettingsToDOM();
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('settings-screen').classList.remove('hidden');
};

document.getElementById('btn-pause-settings').onclick = () => {
  AudioSys.playUISelect();
  lastMenuScreen = 'pause-screen';
  applySettingsToDOM();
  document.getElementById('pause-screen').classList.add('hidden');
  document.getElementById('settings-screen').classList.remove('hidden');
};

document.getElementById('btn-close-settings').onclick = () => {
  AudioSys.playUISelect();
  document.getElementById('settings-screen').classList.add('hidden');
  document.getElementById(lastMenuScreen).classList.remove('hidden');
  if (lastMenuScreen === 'start-screen') {
    document.getElementById('start-souls').textContent = save.souls || 0;
  }
};

document.getElementById('btn-open-manual').onclick = () => {
  AudioSys.playUISelect();
  document.getElementById('manual-modal').classList.remove('hidden');
};
document.getElementById('btn-close-manual').onclick = () => {
  AudioSys.playUISelect();
  document.getElementById('manual-modal').classList.add('hidden');
};

// Pantalla Completa nativa de Escritorio
document.getElementById('btn-toggle-fullscreen').onclick = () => {
  AudioSys.playUISelect();
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
    document.getElementById('fullscreen-btn-text').textContent = '[ PANTALLA COMPLETA: ACTIVADA ]';
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
    document.getElementById('fullscreen-btn-text').textContent = '[ PANTALLA COMPLETA: DESACTIVADA ]';
  }
};

document.getElementById('btn-resume').onclick = () => { togglePauseGame(); };
document.getElementById('btn-pause-to-menu').onclick = () => {
  AudioSys.playUISelect();
  state = 'START';
  document.getElementById('pause-screen').classList.add('hidden');
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('start-screen').classList.remove('hidden');
  document.getElementById('start-souls').textContent = save.souls || 0;
  updateCareerScreen();
  renderShop();
};

document.getElementById('btn-go-shop').onclick = () => {
  AudioSys.playUISelect();
  lastMenuScreen = 'game-over-screen';
  renderShop();
  document.getElementById('game-over-screen').classList.add('hidden');
  document.getElementById('shop-screen').classList.remove('hidden');
};

document.getElementById('btn-close-shop').onclick = () => {
  AudioSys.playUIClick();
  renderShop();
  document.getElementById('shop-screen').classList.add('hidden');
  document.getElementById(lastMenuScreen).classList.remove('hidden');
  if (lastMenuScreen === 'start-screen') {
    document.getElementById('start-souls').textContent = save.souls || 0;
  }
};

document.getElementById('btn-open-sheets').onclick = () => {
  AudioSys.playUISelect();
  if (document.pointerLockElement) document.exitPointerLock();
  document.getElementById('sheets-modal').classList.remove('hidden');
};
document.getElementById('btn-close-sheets').onclick = () => {
  AudioSys.playUISelect();
  document.getElementById('sheets-modal').classList.add('hidden');
};

injectUIFixesAndNormalizeDOM();
applySettingsToDOM();
syncPlayerVisualLoadout('slash');
prewarmAllGPUAssets();
initSpritesheetInspector();
renderShop();
updateCareerScreen();
animate();