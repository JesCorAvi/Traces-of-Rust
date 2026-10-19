// Punto de entrada: escena, renderer, bucle, cámara, input, jugador, drops y wiring de UI.
// No exporta módulos; inicializa el juego al cargar.
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { AudioSys } from './audio.js';
import {
  SpriteSheets,
  getPlayerLoadoutSheet,
  peekPlayerLoadoutSheet,
  initUISpritesCSS,
  refreshStaticDOMIcons
} from './spritesheets.js';
import { createWorld } from './world.js';
import { createBillboardSprite, EnemyPool } from './entities.js';
import {
  initCombatLight,
  updateCombatLight,
  createOrbitalUnit
} from './combat.js';
import { ModeManager } from './modes/gameModeManager.js';
import { DebugOverlay } from './debug/debugOverlay.js';
import { HUDController } from './ui/hudController.js';
import { TurretBuildMenu } from './ui/turretBuildMenu.js';
import {
  loadCareerStatsByMode,
  saveCareerStatsByMode,
  renderModeSelectorUI,
  updateCareerDossierForSelectedMode,
  renderShopUI,
  renderLevelUpCardsUI
} from './ui/menusAndShop.js';
import { presentRunResultsScreen } from './ui/resultsScreen.js';
import { updatePlayerWeaponsAndCombat } from './player/playerController.js';

let save = JSON.parse(localStorage.getItem(CONFIG.SAVE_KEY)) || {
  souls: 0, dmg: 0, hp: 0, spd: 0, atkSpd: 0, mag: 0, reroll: 0
};
const saveGame = () => localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(save));

let gameSettings = JSON.parse(localStorage.getItem('echoes_rust_settings_v1')) || {
  masterVol: 85, sfxVol: 90, ambVol: 80, muted: false,
  resScale: 0.44, fov: 70, shadows: true, crt: true, fpsCounter: false,
  mouseSens: 100, camShake: 100
};
const saveSettings = () => localStorage.setItem('echoes_rust_settings_v1', JSON.stringify(gameSettings));

let careerByMode = loadCareerStatsByMode();
const saveCareer = () => saveCareerStatsByMode(careerByMode);

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

const debugOverlay = new DebugOverlay(scene);
const hudController = new HUDController();
const turretBuildMenu = new TurretBuildMenu();

// Jugador: Billboard 2D de 8 Direcciones
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
const HAND_WEAPONS = ['slash', 'shotgun', 'flamethrower', 'harpoon', 'bolt', 'mines'];

let prewarmGeneration = 0;
function prewarmLoadoutSheets() {
  const snapshot = { ...skills };
  const gen = ++prewarmGeneration;
  const queue = HAND_WEAPONS
    .filter(w => snapshot[w] && !peekPlayerLoadoutSheet(snapshot, w))
    .sort((a, b) => (b === currentHandWeapon) - (a === currentHandWeapon));
  const next = () => {
    if (gen !== prewarmGeneration) return;
    const w = queue.shift();
    if (!w) return;
    const s = getPlayerLoadoutSheet(snapshot, w);
    s.tex.repeat.set(1, 1); s.tex.offset.set(0, 0);
    s.glowTex.repeat.set(1, 1); s.glowTex.offset.set(0, 0);
    renderer.initTexture(s.tex);
    renderer.initTexture(s.glowTex);
    if (w === currentHandWeapon) syncPlayerVisualLoadout(currentHandWeapon);
    setTimeout(next, 0);
  };
  setTimeout(next, 0);
}

function syncPlayerVisualLoadout(activeHand = currentHandWeapon) {
  currentHandWeapon = activeHand;
  const sheet = peekPlayerLoadoutSheet(skills, currentHandWeapon);
  if (!sheet) return;

  sheet.tex.repeat.set(1, 1); sheet.tex.offset.set(0, 0);
  sheet.glowTex.repeat.set(1, 1); sheet.glowTex.offset.set(0, 0);

  playerBillboard.tex = sheet.tex;
  playerBillboard.glowTex = sheet.glowTex;
  playerBillboard.cols = sheet.cols;
  playerBillboard.rows = sheet.rows;
  playerBillboard.numDirs = sheet.numDirs;
  playerBillboard.lastTotalCol = -1;
  playerBillboard.lastDirRow = -1;

  if (playerBillboard.mesh.material.map !== sheet.tex) {
    playerBillboard.mesh.material.map = sheet.tex;
    playerBillboard.mesh.material.emissiveMap = sheet.tex;
    playerBillboard.mesh.material.needsUpdate = true;
  }
  if (playerBillboard.glowMesh.material.map !== sheet.glowTex) {
    playerBillboard.glowMesh.material.map = sheet.glowTex;
  }
  playerBillboard.setDirectionalFrame(playerBillboard.dirRow, playerBillboard.stateIdx, playerBillboard.col);
}

const auraMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  new THREE.MeshBasicMaterial({
    map: SpriteSheets.env.aura.tex, transparent: true, opacity: 0.72, alphaTest: 0.1, side: THREE.DoubleSide
  })
);
auraMesh.rotation.x = -Math.PI / 2;
auraMesh.visible = false;
scene.add(auraMesh);

const flashlight = new THREE.SpotLight(0xe6d7a5, 195, 40, Math.PI / 3.6, 0.45, 1.3);
flashlight.castShadow = gameSettings.shadows;
flashlight.shadow.mapSize.set(512, 512);
scene.add(flashlight, flashlight.target);

const enemyPool = new EnemyPool(scene, CONFIG.DIFFICULTY.MAX_ACTIVE_ENEMIES);

let state = 'START', lastMenuScreen = 'start-screen';
let pendingTutorial = false;
let yaw = 0, pitch = -0.22, playerFacingYaw = 0;
let gameTime = 0, runSouls = 0, kills = 0;
let stats = {}, skills = {}, passives = {}, rerollsLeft = CONFIG.LIMITS.REROLLS_PER_RUN, maxRerollsRun = CONFIG.LIMITS.REROLLS_PER_RUN;
let playerYVel = 0, isGrounded = true, dashCd = 0, invuln = 0, atkAnimTimer = 0;
let dashTimer = 0, dashGhostTimer = 0;
const dashDirVec = new THREE.Vector3();
let camShake = 0, targetFov = 70;
let activeBoss = null;
let fpsFrames = 0, fpsTimer = 0;

const weaponTimers = { slash: 0, shotgun: 0, flamethrower: 0, aura: 0, mines: 0, harpoon: 0, bolt: 0 };
const drops = [], orbitals = [], minesList = [], vfx = [], bossHazards = [], bossProjectiles = [];

const PICKUP_ASSETS = {
  smallGeo:  new THREE.PlaneGeometry(0.9, 0.9),
  chestGeo:  new THREE.PlaneGeometry(1.45, 1.45),
  shadowGeo: new THREE.CircleGeometry(0.32, 10),
  shadowMat: new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.58 }),
  mats:      {},
  texs:      {}
};

[
  { key: 'serum', sheet: SpriteSheets.env.pickup_serum },
  { key: 'tooth', sheet: SpriteSheets.env.pickup_tooth },
  { key: 'chest', sheet: SpriteSheets.env.pickup_chest },
  { key: 'scrap', sheet: SpriteSheets.env.pickup_scrap }
].forEach(({ key, sheet }) => {
  const t = sheet.tex;
  t.repeat.set(0.25, 1); t.offset.set(0, 0);
  PICKUP_ASSETS.texs[key] = t;
  PICKUP_ASSETS.mats[key] = new THREE.MeshBasicMaterial({
    map: t, transparent: true, alphaTest: 0.15, side: THREE.DoubleSide
  });
});

function spawnLorePickup(originPos, type = 'serum', value = 1) {
  // Limita la chatarra física simultánea para no saturar la escena
  if (type === 'scrap' && drops.length >= (CONFIG.CORE_DEFENSE.SCRAP.maxActivePickups || 40)) {
    return;
  }

  const group = new THREE.Group();
  const isChest = type === 'chest';
  const isTooth = type === 'tooth';
  const isScrap = type === 'scrap';
  const groundY = worldPhysics ? worldPhysics.getGroundHeight(originPos.x, originPos.z, originPos.y) : originPos.y;
  group.position.set(originPos.x, groundY, originPos.z);

  const spriteMesh = new THREE.Mesh(
    isChest ? PICKUP_ASSETS.chestGeo : PICKUP_ASSETS.smallGeo,
    PICKUP_ASSETS.mats[type] || PICKUP_ASSETS.mats.serum
  );
  const baseHeight = isChest ? 0.72 : (isScrap ? 0.42 : 0.48);
  spriteMesh.position.y = baseHeight;

  const shadowDisc = new THREE.Mesh(PICKUP_ASSETS.shadowGeo, PICKUP_ASSETS.shadowMat);
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.025;
  if (isChest) shadowDisc.scale.set(1.6, 1.6, 1);
  if (isScrap) shadowDisc.scale.set(0.75, 0.75, 1);

  group.add(spriteMesh, shadowDisc);
  scene.add(group);
  drops.push({
    group, spriteMesh, shadowDisc, baseHeight,
    bobPhase: Math.random() * Math.PI * 2,
    age: 0,
    isBossChest: isChest,
    isTooth,
    isScrap,
    value: Math.max(1, value)
  });
}

function cleanupVfxItem(v) {
  scene.remove(v.mesh);
  if (v.disposeGeo && v.mesh.geometry) v.mesh.geometry.dispose();
  if (v.disposeMat && v.mesh.material) v.mesh.material.dispose();
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

function syncOrbitalsCount() {
  if (!skills.orbital) return;
  const targetCount = skills.orbital + (passives.multishot || 0);
  while (orbitals.length < targetCount) orbitals.push(createOrbitalUnit(scene, 0));
  orbitals.forEach((o, idx) => { o.angle = (idx / orbitals.length) * Math.PI * 2; });
}

function triggerWeaponVisualAttack(weaponId, _targetYaw = null, animDuration = 0.24, onlyIfIdle = false) {
  if (onlyIfIdle && atkAnimTimer > 0.05) return;
  atkAnimTimer = animDuration;
  syncPlayerVisualLoadout(weaponId);
}

function triggerScare(intensity = 0.42) {
  const mods = getActiveModifiers();
  camShake = Math.max(camShake, intensity * mods.shakeMod);
  if (mods.shakeMod <= 0) return;
  camera.fov = 56;
  camera.updateProjectionMatrix();
  AudioSys.playScare();
  const flash = document.getElementById('scare-flash');
  flash.style.opacity = 1;
  setTimeout(() => { flash.style.opacity = 0; }, 180);
}

function buildModeContext(camFwd = new THREE.Vector3(0, 0, -1)) {
  return {
    scene,
    ambientLight,
    playerGroup,
    camera,
    camFwd,
    worldPhysics,
    enemyPool,
    vfx,
    bossHazards,
    bossProjectiles,
    gameTime,
    triggerScare,
    damageEnemy,
    dealDamageToPlayer,
    spawnLorePickup,
    addRunSouls: amt => { runSouls += amt; refreshHUD(); },
    setActiveBoss: (boss, bossCfg) => {
      activeBoss = boss;
      hudController.showBossBanner(boss, bossCfg);
      refreshHUD();
    },
    onBossPhaseChange: () => hudController.updateBossHUD(activeBoss, true),
    onCoreDamaged: () => {
      hudController.triggerCoreDamageFeedback();
      refreshHUD();
    },
    onCoreUnderAttackAlert: payload => {
      hudController.showCoreUnderAttackAlert(payload.state?.label || 'ALERTA');
    },
    onWaveStarted: payload => {
      const msg = payload.hasBoss
        ? `OLEADA ${payload.wave} // JEFE EN RUTA: ${payload.bossName}`
        : `OLEADA ${payload.wave} / ${payload.totalWaves} EN CURSO`;
      hudController.showWaveAnnouncement(msg);
      refreshHUD();
    },
    onWaveCompleted: payload => {
      hudController.showWaveAnnouncement(`OLEADA ${payload.wave} COMPLETADA`);
      refreshHUD();
    },
    notifyPlayerEmergencyRespawn: (delaySec, corePenalty) => {
      hudController.showWaveAnnouncement(`OPERARIO ABATIDO // SOBRECARGA AL NÚCLEO (-${corePenalty} HP)`);
      stats.hp = 1;
      invuln = delaySec + 1.0;
      refreshHUD();
    },
    revivePlayerAfterPenalty: invulnSec => {
      stats.hp = stats.maxHp;
      invuln = invulnSec;
      AudioSys.playUISelect();
      refreshHUD();
    },
    triggerRunEnd: outcome => finishRun(outcome),
    tutorialRequested: pendingTutorial
  };
}

function refreshHUD(includeInventory = false) {
  const ctx = buildModeContext();
  const telemetry = ModeManager.getHudTelemetry(ctx);
  hudController.updateStatsAndModeHUD(stats, kills, runSouls, rerollsLeft, activeBoss, telemetry);
  if (includeInventory) {
    hudController.updateInventoryHUD(skills, passives, lastUpgradedKey);
    lastUpgradedKey = null;
  }
}

function damageEnemy(en, amount, knockback, isDoT = false) {
  if (!en.active || en.state === 'dead') return;
  const mods = getActiveModifiers();
  const isCrit = !isDoT && Math.random() < mods.critChance;
  en.hp -= isCrit ? amount * 2.0 : amount;

  if (!isDoT) {
    en.state = 'hurt';
    en.stateTimer = 0.15;
    AudioSys.play(isCrit ? 290 : 145, 0.05, 'square', 0.035);
  }
  if (knockback && !en.isBoss) {
    en.group.position.add(knockback);
    worldPhysics.resolveCollision(en.group.position, 0.55, en.group.position.y);
  }
  if (en.isBoss) hudController.updateBossHUD(activeBoss, !isDoT);

  if (en.hp <= 0) {
    en.hp = 0;
    en.state = 'dead';
    en.stateTimer = 0;
    kills++;
    if (en.isBoss) {
      activeBoss = null;
      hudController.hideBossHUDDelayed();
      AudioSys.playBossHorn();
    }
    ModeManager.onEnemyKilled(en, buildModeContext());
    refreshHUD();
  }
}

function dealDamageToPlayer(dmgAmount) {
  if (invuln > 0 || state !== 'PLAYING') return;
  stats.hp -= dmgAmount;
  invuln = 0.72;
  triggerScare(0.48);

  const hpFrame = document.querySelector('.biometrics-plate-compact');
  if (hpFrame) {
    hpFrame.classList.add('bar-shake');
    setTimeout(() => hpFrame.classList.remove('bar-shake'), 320);
  }
  document.getElementById('damage-flash').style.opacity = 1;
  setTimeout(() => (document.getElementById('damage-flash').style.opacity = 0), 150);
  refreshHUD();

  if (stats.hp <= 0) {
    ModeManager.onPlayerLethalDamage(buildModeContext());
  }
}

function applyUpgradeOption(opt) {
  AudioSys.playUISelect();
  lastUpgradedKey = opt.id;
  const modeId = ModeManager.getSelectedModeId();
  careerByMode[modeId].totalUpgradesBought = (careerByMode[modeId].totalUpgradesBought || 0) + 1;
  saveCareer();

  if (opt.category === 'weapon') {
    const current = skills[opt.id] || 0;
    if (current < CONFIG.LIMITS.MAX_LEVEL) {
      skills[opt.id] = current + 1;
      if (opt.id === 'orbital') syncOrbitalsCount();
      if (HAND_WEAPONS.includes(opt.id)) currentHandWeapon = opt.id;
      prewarmLoadoutSheets();
      syncPlayerVisualLoadout(currentHandWeapon);
    }
  } else if (opt.category === 'passive') {
    const current = passives[opt.id] || 0;
    if (current < CONFIG.LIMITS.MAX_LEVEL) {
      passives[opt.id] = current + 1;
      if (opt.id === 'maxHp') {
        const bonus = CONFIG.PASSIVES.maxHp.perLevel;
        stats.maxHp += bonus;
        stats.hp = Math.min(stats.maxHp, stats.hp + bonus);
      }
      if (opt.id === 'multishot') syncOrbitalsCount();
    }
  } else if (opt.category === 'fallback') {
    if (opt.id === 'heal_pack') stats.hp = Math.min(stats.maxHp, stats.hp + 75);
    if (opt.id === 'teeth_bag') runSouls += 15;
  }
  refreshHUD(true);
}

function showLevelUp() {
  state = 'LEVEL_UP';
  if (document.pointerLockElement) document.exitPointerLock();
  renderLevelUpCardsUI(skills, passives, rerollsLeft, maxRerollsRun, (_card, opt) => {
    applyUpgradeOption(opt);
    document.getElementById('level-up-screen').classList.add('hidden');
    state = 'PLAYING';
    document.body.requestPointerLock();
  });
  document.getElementById('level-up-screen').classList.remove('hidden');
  document.querySelector('#upgrade-container .upg-card')?.focus();
}

document.getElementById('btn-reroll').onclick = () => {
  if (rerollsLeft <= 0) { AudioSys.playUIError(); return; }
  rerollsLeft--;
  AudioSys.playReroll();
  showLevelUp();
  refreshHUD();
};

function clearSharedRunState() {
  ModeManager.cleanupActiveMode(buildModeContext());
  enemyPool.clearAll();
  drops.forEach(d => scene.remove(d.group)); drops.length = 0;
  orbitals.forEach(o => { scene.remove(o.group); o.geo.dispose(); }); orbitals.length = 0;
  minesList.forEach(m => scene.remove(m.group)); minesList.length = 0;
  vfx.forEach(v => cleanupVfxItem(v)); vfx.length = 0;
  bossHazards.forEach(h => { scene.remove(h.mesh); h.mesh.geometry.dispose(); h.mesh.material.dispose(); }); bossHazards.length = 0;
  bossProjectiles.forEach(p => { scene.remove(p.mesh); p.mesh.material.dispose(); }); bossProjectiles.length = 0;
  activeBoss = null;
  auraMesh.visible = false;
  debugOverlay.clearDynamicMeshes();
}

function startGame(options = {}) {
  pendingTutorial = !!options.tutorial;
  AudioSys.init();
  clearSharedRunState();

  const modeId = ModeManager.getSelectedModeId();
  careerByMode[modeId].runs = (careerByMode[modeId].runs || 0) + 1;
  saveCareer();

  const baseHp = 100 + (save.hp || 0) * 5;
  stats = { maxHp: baseHp, hp: baseHp, stamina: 100, level: 1, exp: 0, maxExp: 5 };
  skills = { slash: 1 };
  passives = {};
  Object.keys(weaponTimers).forEach(k => { weaponTimers[k] = 0; });
  maxRerollsRun = CONFIG.LIMITS.REROLLS_PER_RUN + Math.min(3, save.reroll || 0);
  rerollsLeft = maxRerollsRun;
  currentHandWeapon = 'slash';
  yaw = 0; playerFacingYaw = 0; dashTimer = 0; playerYVel = 0;
  gameTime = 0; runSouls = 0; kills = 0;

  prewarmLoadoutSheets();
  syncPlayerVisualLoadout('slash');

  ModeManager.startActiveMode(buildModeContext());
  pendingTutorial = false;
  hudController.applyModeLayout(ModeManager.getHudConfig());
  debugOverlay.rebuildStaticPaths(modeId, worldPhysics);

  document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden'));
  document.getElementById('hud').classList.remove('hidden');
  refreshHUD(true);
  refreshStaticDOMIcons();
  state = 'PLAYING';
  document.body.requestPointerLock();
}

function finishRun(outcome) {
  if (state === 'GAME_OVER') return;
  state = 'GAME_OVER';
  if (document.pointerLockElement) document.exitPointerLock();

  save.souls = (save.souls || 0) + runSouls;
  saveGame();

  presentRunResultsScreen({
    outcome, stats, skills, passives, kills, runSouls,
    totalSouls: save.souls, gameTime, careerByMode, saveCareerFn: saveCareer
  });
}

function returnToMainMenu() {
  AudioSys.playUISelect();
  clearSharedRunState();
  state = 'START';
  playerGroup.position.set(0, 0, 0);
  document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden'));
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('start-screen').classList.remove('hidden');
  renderModeSelectorUI(careerByMode);
  updateCareerDossierForSelectedMode(careerByMode);
  renderShopUI(save, saveGame);
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

function openTurretBuildMenu(nearbyTurret = null) {
  if (state !== 'PLAYING') return;
  state = 'BUILD';
  if (document.pointerLockElement) document.exitPointerLock();
  document.getElementById('turret-interact-prompt')?.classList.add('hidden');
  turretBuildMenu.open(ModeManager.activeMode, nearbyTurret, () => {
    state = 'PLAYING';
    document.body.requestPointerLock();
  });
}

const keys = {};
window.addEventListener('keydown', e => {
  if (e.key === 'F3' || (e.key.toLowerCase() === 'b' && state === 'PLAYING')) {
    e.preventDefault();
    debugOverlay.toggle();
    return;
  }
  if (e.key === 'Tab' && state !== 'LEVEL_UP') {
    e.preventDefault();
    const modal = document.getElementById('sheets-modal');
    const isHidden = modal.classList.toggle('hidden');
    if (!isHidden && document.pointerLockElement) document.exitPointerLock();
    return;
  }

  const k = e.key.toLowerCase();

  if (state === 'BUILD') {
    if (k === 'e' || k === 'escape') {
      e.preventDefault();
      turretBuildMenu.close();
    }
    return;
  }

  if (state === 'PLAYING' && ModeManager.getSelectedModeId() === 'core_defense') {
    const mode = ModeManager.activeMode;
    if (mode?.handleTutorialKey?.(k)) {
      e.preventDefault();
      return;
    }
    if (mode?.isTurretPlacementActive?.()) {
      if (k === 'e') {
        e.preventDefault();
        mode.confirmTurretPlacement();
        return;
      }
      if (k === 'escape') {
        e.preventDefault();
        mode.cancelTurretPlacement();
        document.body.requestPointerLock();
        return;
      }
    }
  }

  if (state === 'LEVEL_UP') {
    const cards = Array.from(document.querySelectorAll('#upgrade-container .upg-card'));
    if (['1', '2', '3', '4'].includes(k)) {
      const idx = parseInt(k, 10) - 1;
      if (cards[idx]) { e.preventDefault(); cards[idx].click(); }
      return;
    }
    if (k === 'r') { e.preventDefault(); document.getElementById('btn-reroll')?.click(); return; }
    return;
  }

  if (k === 'p' && (state === 'PLAYING' || state === 'PAUSED')) {
    e.preventDefault();
    togglePauseGame();
    return;
  }

  if (k === 'e' && state === 'PLAYING' && ModeManager.getSelectedModeId() === 'core_defense') {
    const mode = ModeManager.activeMode;
    if (mode?.isTurretPlacementActive?.()) {
      e.preventDefault();
      mode.confirmTurretPlacement();
      return;
    }
    const nearby = mode?.getNearbyTurret?.(playerGroup.position) || null;
    e.preventDefault();
    openTurretBuildMenu(nearby);
    return;
  }

  keys[k] = true;
  if (state !== 'PLAYING') return;

  if (k === 'shift' && dashCd <= 0 && stats.stamina >= 35 && dashTimer <= 0) {
    stats.stamina -= 35;
    document.getElementById('stam-bar').style.width = Math.max(0, stats.stamina) + '%';
    dashCd = 0.85; dashTimer = 0.22; dashGhostTimer = 0; invuln = 0.35;
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
  }
  if (e.code === 'Space' && isGrounded) {
    playerYVel = 9.2;
    isGrounded = false;
    AudioSys.play(220, 0.1, 'sine');
  }
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
document.addEventListener('mousemove', e => {
  if (document.pointerLockElement === document.body && state === 'PLAYING') {
    const sens = (gameSettings.mouseSens || 100) / 100;
    yaw -= e.movementX * 0.0028 * sens;
    pitch = Math.max(-0.95, Math.min(0.5, pitch - e.movementY * 0.0024 * sens));
  }
});

window.addEventListener('mousedown', e => {
  if (state !== 'PLAYING') return;
  const mode = ModeManager.activeMode;

  if (mode?.isTurretPlacementActive?.()) {
    if (e.button === 0) {
      e.preventDefault();
      mode.confirmTurretPlacement();
    } else if (e.button === 2) {
      e.preventDefault();
      mode.cancelTurretPlacement();
    }
    return;
  }

  // Recuperar el pointer lock si se perdió (por ejemplo al cancelar una colocación)
  if (e.button === 0 && !document.pointerLockElement) {
    document.body.requestPointerLock();
  }
});

window.addEventListener('contextmenu', e => {
  if (state === 'PLAYING' && ModeManager.activeMode?.isTurretPlacementActive?.()) {
    e.preventDefault();
  }
});

const clock = new THREE.Clock();
let hudTickTimer = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);
  updateCombatLight(dt);

  if (gameSettings.fpsCounter) {
    fpsFrames++; fpsTimer += dt;
    if (fpsTimer >= 0.5) {
      document.getElementById('fps-val').textContent = Math.round(fpsFrames / fpsTimer);
      fpsFrames = 0; fpsTimer = 0;
    }
  }

  ceilingLights.forEach(cl => {
    cl.light.intensity = Math.random() < 0.04 ? 2 : cl.baseIntensity;
  });

  if (state === 'PLAYING') {
    gameTime += dt;
    const mods = getActiveModifiers();
    if (invuln > 0) invuln -= dt;
    if (dashCd > 0) dashCd -= dt;
    if (atkAnimTimer > 0) atkAnimTimer -= dt;
    stats.stamina = Math.min(100, stats.stamina + dt * 22);

    const pickupFrameOffset = (Math.floor(gameTime * 6.5) % 4) * 0.25;
    PICKUP_ASSETS.texs.serum.offset.x = pickupFrameOffset;
    PICKUP_ASSETS.texs.tooth.offset.x = pickupFrameOffset;
    PICKUP_ASSETS.texs.chest.offset.x = pickupFrameOffset;
    PICKUP_ASSETS.texs.scrap.offset.x = pickupFrameOffset;

    if (mods.regenPerSec > 0 && stats.hp < stats.maxHp) {
      stats.hp = Math.min(stats.maxHp, stats.hp + mods.regenPerSec * dt);
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
      playerGroup.position.addScaledVector(dashDirVec, 20.5 * dt);
      worldPhysics.resolveCollision(playerGroup.position, 0.55, playerGroup.position.y);
    } else if (isMoving) {
      move.normalize();
      playerFacingYaw = Math.atan2(-move.x, -move.z);
      playerGroup.position.addScaledVector(move, mods.moveSpeed * dt);
      worldPhysics.resolveCollision(playerGroup.position, 0.55, playerGroup.position.y);
    }

    playerBillboard.facingYaw = playerFacingYaw;
    const groundY = worldPhysics.getGroundHeight(playerGroup.position.x, playerGroup.position.z, playerGroup.position.y);
    if (playerGroup.position.y > groundY + 0.02 || playerYVel !== 0) {
      isGrounded = false;
      playerGroup.position.y += playerYVel * dt;
      playerYVel -= 23 * dt;
      if (playerGroup.position.y <= groundY) {
        playerGroup.position.y = groundY; playerYVel = 0; isGrounded = true;
      }
    } else {
      playerGroup.position.y = groundY; isGrounded = true;
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
    let pState = ST.IDLE, fps = FPS.IDLE;
    if (dashTimer > 0) { pState = ST.DASH; fps = FPS.DASH; }
    else if (invuln > 0.38) { pState = ST.HURT; fps = FPS.HURT; }
    else if (atkAnimTimer > 0 && isMoving) { pState = ST.ATTACK_WALK; fps = FPS.ATTACK_WALK; }
    else if (atkAnimTimer > 0) { pState = ST.ATTACK; fps = FPS.ATTACK; }
    else if (!isGrounded) { pState = ST.JUMP; fps = FPS.JUMP; }
    else if (isMoving) { pState = ST.WALK; fps = FPS.WALK; }

    playerBillboard.animTimer += dt * fps;
    playerBillboard.setDirectionalFrame(playerBillboard.dirRow, pState, Math.floor(playerBillboard.animTimer) % 4);

    const camAngle = Math.atan2(camera.position.x - playerGroup.position.x, camera.position.z - playerGroup.position.z);
    propBillboards.forEach(p => { p.rotation.y = camAngle; });

    const toCam = new THREE.Vector3().subVectors(camera.position, playerGroup.position).setY(0).normalize();
    playerLanternLight.position.copy(playerGroup.position).addScaledVector(toCam, 1.1).add(new THREE.Vector3(0, 1.35, 0));
    flashlight.position.copy(playerGroup.position).addScaledVector(camFwd, 0.55).add(new THREE.Vector3(0, 1.5, 0));
    flashlight.target.position.copy(flashlight.position).add(camFwd);

    const modeCtx = buildModeContext(camFwd);
    ModeManager.updateActiveMode(dt, modeCtx);

    const activeCore = ModeManager.activeMode?.coreMachine || null;
    updatePlayerWeaponsAndCombat({
      dt, gameTime, scene, playerGroup, yaw, playerFacingYaw, camAngle,
      skills, mods, weaponTimers, auraMesh, orbitals, minesList,
      bossHazards, bossProjectiles, vfx, activeEnemies: enemyPool.active,
      worldPhysics, coreMachine: activeCore, damageEnemy, dealDamageToPlayer,
      addCamShake: s => { camShake = Math.max(camShake, s); },
      triggerWeaponVisualAttack, cleanupVfxItem
    });

    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.age = (d.age || 0) + dt;
      d.spriteMesh.rotation.y = camAngle;
      d.spriteMesh.position.y = d.baseHeight + Math.sin(gameTime * 5.2 + d.bobPhase) * 0.1;
      const dist = d.group.position.distanceTo(playerGroup.position);
      if (dist < mods.magnetRange) {
        const pullDir = new THREE.Vector3().subVectors(playerGroup.position, d.group.position).normalize();
        d.group.position.addScaledVector(pullDir, 18.5 * dt);
      } else if (d.isScrap && d.age > 0.5) {
        // La chatarra siempre acaba llegando al operario: evita abandonar el núcleo
        // para recogerla cuando las torretas matan lejos.
        const pullDir = new THREE.Vector3().subVectors(playerGroup.position, d.group.position).normalize();
        d.group.position.addScaledVector(pullDir, 7.5 * dt);
      }
      if (dist < 1.45) {
        scene.remove(d.group);
        drops.splice(i, 1);
        if (d.isBossChest) {
          stats.hp = Math.min(stats.maxHp, stats.hp + stats.maxHp * 0.5);
          stats.level++; AudioSys.playUISelect(); showLevelUp();
        } else if (d.isTooth) {
          runSouls++; AudioSys.play(640, 0.07, 'sine', 0.05);
        } else if (d.isScrap) {
          ModeManager.activeMode?.addScrap?.(d.value || 1);
          AudioSys.play(520, 0.07, 'square', 0.045);
        } else {
          stats.exp++; AudioSys.play(420, 0.06, 'sine', 0.04);
          if (stats.exp >= stats.maxExp) {
            stats.level++; stats.exp -= stats.maxExp;
            stats.maxExp = Math.floor(stats.maxExp * 1.38);
            showLevelUp();
          }
        }
        refreshHUD();
      }
    }

    dust.position.copy(playerGroup.position);
    const m = String(Math.floor(gameTime / 60)).padStart(2, '0');
    const s = String(Math.floor(gameTime % 60)).padStart(2, '0');
    document.getElementById('timer-text').textContent = `${m}:${s}`;
    document.getElementById('compact-time-indicator').textContent = `${m}:${s}`;

    hudTickTimer += dt;
    if (hudTickTimer >= 0.15) {
      hudTickTimer = 0;
      refreshHUD();
    }

    const corePos = activeCore ? activeCore.position : null;
    if (corePos) {
      hudController.updateCoreDirectionIndicator(camera, playerGroup.position, corePos, activeCore.getHpRatio());
    }
    hudController.updateRadarHUD(playerGroup.position, yaw, enemyPool.active, activeBoss, corePos);
    debugOverlay.update(ModeManager.getSelectedModeId(), enemyPool, playerGroup.position, corePos, worldPhysics);
  } else if (state === 'START') {
    const t = performance.now() * 0.00045;
    camera.position.set(Math.sin(t) * 11, 3.6, Math.cos(t) * 11);
    camera.lookAt(0, 1.1, 0);
    playerBillboard.facingYaw = 0;
    playerBillboard.faceCamera(camera.position);
    playerBillboard.animTimer += dt * CONFIG.DIRECTIONAL.ANIM_FPS.IDLE;
    playerBillboard.setDirectionalFrame(playerBillboard.dirRow, 0, Math.floor(playerBillboard.animTimer) % 4);
    playerLanternLight.position.set(Math.sin(t) * 3, 2.2, Math.cos(t) * 3);
  }

  renderer.render(scene, camera);
}

// Botones de navegación y Ajustes
function showTutorialPrompt() {
  document.getElementById('start-screen')?.classList.add('hidden');
  document.getElementById('shop-screen')?.classList.add('hidden');
  document.getElementById('tutorial-prompt-screen')?.classList.remove('hidden');
}

function requestStartGame() {
  AudioSys.playUISelect();
  const tutorialKey = CONFIG.CORE_DEFENSE.TUTORIAL.choiceKey;
  if (ModeManager.getSelectedModeId() === 'core_defense' && !localStorage.getItem(tutorialKey)) {
    showTutorialPrompt();
    return;
  }
  startGame({ tutorial: false });
}

function updateTdTutorialButton() {
  const btn = document.getElementById('btn-td-tutorial');
  if (!btn) return;
  btn.classList.toggle('hidden', ModeManager.getSelectedModeId() !== 'core_defense');
}

document.getElementById('btn-start').onclick = requestStartGame;
document.getElementById('btn-shop-play').onclick = requestStartGame;
document.getElementById('btn-restart').onclick = () => { AudioSys.playUISelect(); startGame({ tutorial: false }); };
document.getElementById('btn-results-menu').onclick = () => returnToMainMenu();
document.getElementById('btn-pause-to-menu').onclick = () => returnToMainMenu();
document.getElementById('btn-resume').onclick = () => togglePauseGame();

document.getElementById('btn-open-shop').onclick = () => {
  AudioSys.init(); AudioSys.playUISelect(); lastMenuScreen = 'start-screen';
  renderShopUI(save, saveGame);
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('shop-screen').classList.remove('hidden');
};
document.getElementById('btn-go-shop').onclick = () => {
  AudioSys.playUISelect(); lastMenuScreen = 'game-over-screen';
  renderShopUI(save, saveGame);
  document.getElementById('game-over-screen').classList.add('hidden');
  document.getElementById('shop-screen').classList.remove('hidden');
};
document.getElementById('btn-close-shop').onclick = () => {
  AudioSys.playUIClick();
  document.getElementById('shop-screen').classList.add('hidden');
  document.getElementById(lastMenuScreen).classList.remove('hidden');
};
document.getElementById('btn-open-manual').onclick = () => document.getElementById('manual-modal').classList.remove('hidden');
document.getElementById('btn-close-manual').onclick = () => document.getElementById('manual-modal').classList.add('hidden');
document.getElementById('btn-open-settings').onclick = () => {
  lastMenuScreen = 'start-screen';
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('settings-screen').classList.remove('hidden');
};
document.getElementById('btn-pause-settings').onclick = () => {
  lastMenuScreen = 'pause-screen';
  document.getElementById('pause-screen').classList.add('hidden');
  document.getElementById('settings-screen').classList.remove('hidden');
};
document.getElementById('btn-close-settings').onclick = () => {
  document.getElementById('settings-screen').classList.add('hidden');
  document.getElementById(lastMenuScreen).classList.remove('hidden');
};
document.getElementById('btn-open-sheets').onclick = () => document.getElementById('sheets-modal').classList.remove('hidden');
document.getElementById('btn-close-sheets').onclick = () => document.getElementById('sheets-modal').classList.add('hidden');

document.getElementById('btn-tutorial-yes').onclick = () => {
  localStorage.setItem(CONFIG.CORE_DEFENSE.TUTORIAL.choiceKey, 'tutorial');
  document.getElementById('tutorial-prompt-screen').classList.add('hidden');
  AudioSys.playUISelect();
  startGame({ tutorial: true });
};
document.getElementById('btn-tutorial-no').onclick = () => {
  localStorage.setItem(CONFIG.CORE_DEFENSE.TUTORIAL.choiceKey, 'skipped');
  document.getElementById('tutorial-prompt-screen').classList.add('hidden');
  AudioSys.playUISelect();
  startGame({ tutorial: false });
};
document.getElementById('btn-td-tutorial').onclick = () => {
  AudioSys.playUISelect();
  localStorage.setItem(CONFIG.CORE_DEFENSE.TUTORIAL.choiceKey, 'tutorial');
  startGame({ tutorial: true });
};

document.getElementById('ui-scale-select').onchange = e => {
  initUISpritesCSS(parseInt(e.target.value, 10) || 2);
  refreshStaticDOMIcons();
  if (state !== 'START') refreshHUD(true);
};

refreshStaticDOMIcons();
renderModeSelectorUI(careerByMode, () => updateTdTutorialButton());
updateCareerDossierForSelectedMode(careerByMode);
updateTdTutorialButton();
renderShopUI(save, saveGame);
syncPlayerVisualLoadout('slash');
animate();