// Punto de entrada: escena, renderer, bucle, cámara, input, jugador, drops y wiring de UI.
// No exporta módulos; inicializa el juego al cargar.
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { AudioSys } from './audio.js';
import {
  SpriteSheets,
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
  renderModeSelectorUI,
  updateCareerDossierForSelectedMode,
  updateStartPlayButton,
  renderShopUI,
  renderLevelUpCardsUI
} from './ui/menusAndShop.js';
import { presentRunResultsScreen } from './ui/resultsScreen.js';
import { updatePlayerWeaponsAndCombat } from './player/playerController.js';
import { save, saveGame, gameSettings, careerByMode, saveCareer } from './core/saveState.js';
import { getActiveModifiers } from './gameplay/modifiers.js';
import { createPlayerVisuals } from './gameplay/playerVisuals.js';
import { createCombatRuntime } from './gameplay/combatRuntime.js';
import { createLevelUpFlow } from './gameplay/levelUp.js';
import { createPickupSystem } from './gameplay/pickups.js';
import { keys, setupInput } from './core/input.js';
import { setupGameFlow } from './core/gameFlow.js';

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

const pickupSystem = createPickupSystem({ scene, worldPhysics, drops });
const spawnLorePickup = pickupSystem.spawnLorePickup;

function cleanupVfxItem(v) {
  scene.remove(v.mesh);
  if (v.disposeGeo && v.mesh.geometry) v.mesh.geometry.dispose();
  if (v.disposeMat && v.mesh.material) v.mesh.material.dispose();
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
  const mods = getActiveModifiers(save, gameSettings, passives);
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
    triggerRunEnd: outcome => flowRuntime.finishRun(outcome),
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
    const mods = getActiveModifiers(save, gameSettings, passives);
    if (invuln > 0) invuln -= dt;
    if (dashCd > 0) dashCd -= dt;
    if (atkAnimTimer > 0) atkAnimTimer -= dt;
    stats.stamina = Math.min(100, stats.stamina + dt * 22);


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

    pickupSystem.updateDrops(dt, {
      playerGroup,
      gameTime,
      camAngle,
      stats,
      magnetRange: mods.magnetRange,
      onTooth: () => { runSouls++; },
      onScrap: value => ModeManager.activeMode?.addScrap?.(value),
      showLevelUp,
      refreshHUD
    });

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

    const hasPhysical = !!(activeCore && activeCore.hasPhysicalCore !== false && activeCore.position);
    const corePos = hasPhysical ? activeCore.position : null;
    if (corePos) {
      const coreRatio = typeof activeCore.getHpRatio === 'function' ? activeCore.getHpRatio() : 1;
      hudController.updateCoreDirectionIndicator(camera, playerGroup.position, corePos, coreRatio);
    } else {
      hudController.hideCoreDirectionIndicator?.();
    }
    hudController.updateRadarHUD(playerGroup.position, yaw, enemyPool.active, activeBoss, corePos);
    debugOverlay.update(ModeManager.getSelectedModeId(), enemyPool, playerGroup.position, corePos, worldPhysics);
  } else if (state === 'START') {
    const t = performance.now() * 0.00032;
    camera.position.set(Math.sin(t) * 12.5, 3.8 + Math.sin(t * 0.6) * 0.35, Math.cos(t) * 12.5);
    camera.lookAt(0, 1.2, 0);
    playerBillboard.facingYaw = 0;
    playerBillboard.faceCamera(camera.position);
    playerBillboard.animTimer += dt * CONFIG.DIRECTIONAL.ANIM_FPS.IDLE;
    playerBillboard.setDirectionalFrame(playerBillboard.dirRow, 0, Math.floor(playerBillboard.animTimer) % 4);
    const camAngle = Math.atan2(camera.position.x, camera.position.z);
    propBillboards.forEach(p => { p.rotation.y = camAngle; });
    dust.position.set(0, 0, 0);
    playerLanternLight.position.set(Math.sin(t) * 2.8, 2.2, Math.cos(t) * 2.8);
  }

  renderer.render(scene, camera);
}

// Botones de navegación y Ajustes
const playerVisuals = createPlayerVisuals({
  playerBillboard,
  renderer,
  getSkills: () => skills,
  getCurrentHandWeapon: () => currentHandWeapon,
  setCurrentHandWeapon: value => { currentHandWeapon = value; }
});
const { prewarmLoadoutSheets, syncPlayerVisualLoadout } = playerVisuals;

const combatRuntime = createCombatRuntime({
  getMods: () => getActiveModifiers(save, gameSettings, passives),
  get state() { return state; }, set state(v) { state = v; },
  get stats() { return stats; },
  get invuln() { return invuln; }, set invuln(v) { invuln = v; },
  get kills() { return kills; }, set kills(v) { kills = v; },
  get activeBoss() { return activeBoss; }, set activeBoss(v) { activeBoss = v; },
  worldPhysics, hudController, AudioSys, ModeManager, buildModeContext, refreshHUD, triggerScare
});
const { damageEnemy, dealDamageToPlayer } = combatRuntime;

const levelUpFlow = createLevelUpFlow({
  get state() { return state; }, set state(v) { state = v; },
  get lastUpgradedKey() { return lastUpgradedKey; }, set lastUpgradedKey(v) { lastUpgradedKey = v; },
  get skills() { return skills; },
  get passives() { return passives; },
  get stats() { return stats; },
  get maxRerollsRun() { return maxRerollsRun; },
  get rerollsLeft() { return rerollsLeft; }, set rerollsLeft(v) { rerollsLeft = v; },
  get currentHandWeapon() { return currentHandWeapon; }, set currentHandWeapon(v) { currentHandWeapon = v; },
  get runSouls() { return runSouls; }, set runSouls(v) { runSouls = v; },
  AudioSys, ModeManager, careerByMode, saveCareer, CONFIG, syncOrbitalsCount,
  prewarmLoadoutSheets, syncPlayerVisualLoadout, renderLevelUpCardsUI, refreshHUD
});
const { showLevelUp } = levelUpFlow;

const flowRuntime = {
  get state() { return state; }, set state(v) { state = v; },
  get pendingTutorial() { return pendingTutorial; }, set pendingTutorial(v) { pendingTutorial = v; },
  get currentHandWeapon() { return currentHandWeapon; }, set currentHandWeapon(v) { currentHandWeapon = v; },
  get yaw() { return yaw; }, set yaw(v) { yaw = v; },
  get playerFacingYaw() { return playerFacingYaw; }, set playerFacingYaw(v) { playerFacingYaw = v; },
  get dashTimer() { return dashTimer; }, set dashTimer(v) { dashTimer = v; },
  get playerYVel() { return playerYVel; }, set playerYVel(v) { playerYVel = v; },
  get gameTime() { return gameTime; }, set gameTime(v) { gameTime = v; },
  get runSouls() { return runSouls; }, set runSouls(v) { runSouls = v; },
  get kills() { return kills; }, set kills(v) { kills = v; },
  get stats() { return stats; }, set stats(v) { stats = v; },
  get skills() { return skills; }, set skills(v) { skills = v; },
  get passives() { return passives; }, set passives(v) { passives = v; },
  get maxRerollsRun() { return maxRerollsRun; }, set maxRerollsRun(v) { maxRerollsRun = v; },
  get rerollsLeft() { return rerollsLeft; }, set rerollsLeft(v) { rerollsLeft = v; },
  get activeBoss() { return activeBoss; }, set activeBoss(v) { activeBoss = v; },
  get lastMenuScreen() { return lastMenuScreen; }, set lastMenuScreen(v) { lastMenuScreen = v; },
  scene, playerGroup, worldPhysics, enemyPool, drops, orbitals, minesList, vfx,
  bossHazards, bossProjectiles, auraMesh, weaponTimers,
  hudController, debugOverlay, turretBuildMenu, ModeManager, AudioSys, CONFIG,
  save, saveGame, careerByMode, saveCareer,
  buildModeContext, prewarmLoadoutSheets, syncPlayerVisualLoadout,
  refreshHUD, refreshStaticDOMIcons, presentRunResultsScreen,
  renderModeSelectorUI, updateCareerDossierForSelectedMode, updateStartPlayButton, renderShopUI,
  cleanupVfxItem, initUISpritesCSS
};
setupGameFlow(flowRuntime);

const inputRuntime = {
  get state() { return state; }, set state(v) { state = v; },
  get yaw() { return yaw; }, set yaw(v) { yaw = v; },
  get pitch() { return pitch; }, set pitch(v) { pitch = v; },
  get dashCd() { return dashCd; }, set dashCd(v) { dashCd = v; },
  get dashTimer() { return dashTimer; }, set dashTimer(v) { dashTimer = v; },
  get dashGhostTimer() { return dashGhostTimer; }, set dashGhostTimer(v) { dashGhostTimer = v; },
  get invuln() { return invuln; }, set invuln(v) { invuln = v; },
  get stats() { return stats; }, set stats(v) { stats = v; },
  get playerFacingYaw() { return playerFacingYaw; }, set playerFacingYaw(v) { playerFacingYaw = v; },
  get isGrounded() { return isGrounded; }, set isGrounded(v) { isGrounded = v; },
  get playerYVel() { return playerYVel; }, set playerYVel(v) { playerYVel = v; },
  playerGroup,
  camera,
  gameSettings,
  ModeManager,
  turretBuildMenu,
  debugOverlay,
  dashDirVec,
  openTurretBuildMenu: flowRuntime.openTurretBuildMenu,
  togglePauseGame: flowRuntime.togglePauseGame
};
setupInput(inputRuntime);

refreshStaticDOMIcons();
renderModeSelectorUI(careerByMode, () => flowRuntime.updateTdTutorialButton());
updateCareerDossierForSelectedMode(careerByMode);
flowRuntime.updateTdTutorialButton();
renderShopUI(save, saveGame);
const wavePrepPrompt = document.getElementById('wave-prep-prompt');
if (wavePrepPrompt) {
  wavePrepPrompt.addEventListener('click', () => {
    if (state === 'PLAYING') {
      if (ModeManager.activeMode?.skipPrep?.()) {
        document.body.requestPointerLock();
      }
    }
  });
}

syncPlayerVisualLoadout('slash');
animate();