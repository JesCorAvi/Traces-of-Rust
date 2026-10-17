import * as THREE from 'three';
import { CONFIG } from './config.js';
import { AudioSys } from './audio.js';
import { SpriteSheets, getPlayerLoadoutSheet } from './spritesheets.js';
import { createWorld } from './world.js';
import { createBillboardSprite, EnemyPool } from './entities.js';
import {
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

// Escena 3D Industrial con Relieve y Física
const { scene, ambientLight, propBillboards, ceilingLights, dust, worldPhysics } = createWorld();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;
document.getElementById('game-container').appendChild(renderer.domElement);

function updateResolution() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(
    Math.floor(window.innerWidth * CONFIG.PIXEL_SCALE),
    Math.floor(window.innerHeight * CONFIG.PIXEL_SCALE),
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
playerBillboard.mesh.material.emissiveIntensity = 0.68;

const playerGroup = playerBillboard.group;
scene.add(playerGroup);

// Luz personal frontal situada entre la cámara y el jugador
const playerLanternLight = new THREE.PointLight(0xffe0a3, 28, 8.5, 1.4);
scene.add(playerLanternLight);

let currentHandWeapon = 'slash';

// Actualiza el Atlas 8-Dir del jugador según el arma que acaba de disparar/atacar,
// conservando la dirección (dirRow) y el frame actual sin reiniciar la animación
function syncPlayerVisualLoadout(activeHand = currentHandWeapon) {
  currentHandWeapon = activeHand;
  const sheet = getPlayerLoadoutSheet(skills, currentHandWeapon);

  playerBillboard.tex = sheet.tex;
  playerBillboard.glowTex = sheet.glowTex;
  playerBillboard.cols = sheet.cols;
  playerBillboard.rows = sheet.rows;
  playerBillboard.numDirs = sheet.numDirs;

  if (playerBillboard.mesh.material.map !== sheet.tex) {
    playerBillboard.mesh.material.map = sheet.tex;
    playerBillboard.mesh.material.emissiveMap = sheet.tex;
    playerBillboard.mesh.material.needsUpdate = true;
  }
  if (playerBillboard.glowMesh.material.map !== sheet.glowTex) {
    playerBillboard.glowMesh.material.map = sheet.glowTex;
    playerBillboard.glowMesh.material.needsUpdate = true;
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
flashlight.castShadow = true;
flashlight.shadow.mapSize.set(512, 512);
scene.add(flashlight, flashlight.target);

// Pool de Enemigos
const enemyPool = new EnemyPool(scene, CONFIG.DIFFICULTY.MAX_ACTIVE_ENEMIES);

// Variables de estado de partida y orientación 3D del personaje
let state = 'START', lastMenuScreen = 'start-screen';
let yaw = 0, pitch = -0.22, playerFacingYaw = 0, aimLockTimer = 0;
let gameTime = 0, runSouls = 0, kills = 0;
let stats = {}, skills = {}, passives = {}, rerollsLeft = CONFIG.LIMITS.REROLLS_PER_RUN;
let playerYVel = 0, isGrounded = true, dashCd = 0, invuln = 0, atkAnimTimer = 0;
let camShake = 0, targetFov = 70, spawnTimer = 0;
let nextBossIdx = 0, activeBoss = null, bossesDefeated = 0, isEndgame = false;

const weaponTimers = { slash: 0, shotgun: 0, flamethrower: 0, aura: 0, mines: 0, harpoon: 0, bolt: 0 };
const drops = [], orbitals = [], minesList = [], vfx = [], bossHazards = [], bossProjectiles = [];

function getActiveModifiers() {
  const permDmg = 1 + (save.dmg || 0) * 0.03;
  const permAtkSpd = 1 + (save.atkSpd || 0) * 0.025;
  const permMoveSpd = 1 + (save.spd || 0) * 0.02;
  const permMag = (save.mag || 0) * 0.35;

  return {
    dmgMult: permDmg * (1 + (passives.dmg || 0) * CONFIG.PASSIVES.dmg.perLevel),
    atkSpeedMult: permAtkSpd * (1 + (passives.atkSpd || 0) * CONFIG.PASSIVES.atkSpd.perLevel),
    moveSpeed: 6.3 * permMoveSpd * (1 + (passives.moveSpd || 0) * CONFIG.PASSIVES.moveSpd.perLevel),
    areaMult: 1 + (passives.area || 0) * CONFIG.PASSIVES.area.perLevel,
    critChance: (passives.crit || 0) * CONFIG.PASSIVES.crit.perLevel,
    magnetRange: 5.8 + permMag + (passives.magnet || 0) * CONFIG.PASSIVES.magnet.perLevel,
    regenPerSec: (passives.regen || 0) * CONFIG.PASSIVES.regen.perLevel,
    bonusProjectiles: (passives.multishot || 0) * CONFIG.PASSIVES.multishot.perLevel
  };
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

// Cambia inmediatamente el sprite del arma en la mano del jugador cuando ataca con ella
// y orienta al personaje hacia el ángulo del disparo/tajo
function triggerWeaponVisualAttack(weaponId, targetYaw = null, animDuration = 0.24) {
  // El sprite NO se gira al atacar: solo cambia el arma y se activa la animación de ataque.
  // El ataque sale hacia `yaw` (hacia donde mira la cámara).
  atkAnimTimer = animDuration;
  syncPlayerVisualLoadout(weaponId);
}

function triggerScare(intensity = 0.42) {
  camShake = Math.max(camShake, intensity);
  camera.fov = 52;
  camera.updateProjectionMatrix();
  AudioSys.playScare();

  document.body.classList.add('chromatic');
  const flash = document.getElementById('scare-flash');
  flash.style.opacity = 1;
  setTimeout(() => {
    flash.style.opacity = 0;
    document.body.classList.remove('chromatic');
  }, 180);
}

// Controles
const keys = {};
window.addEventListener('keydown', e => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const modal = document.getElementById('sheets-modal');
    const isHidden = modal.classList.toggle('hidden');
    if (!isHidden && document.pointerLockElement) document.exitPointerLock();
    return;
  }

  const k = e.key.toLowerCase();
  keys[k] = true;
  if (state !== 'PLAYING') return;

  if (k === 'shift' && dashCd <= 0 && stats.stamina >= 35) {
    stats.stamina -= 35; dashCd = 0.85; invuln = 0.35;
    const dashDir = new THREE.Vector3(-Math.sin(playerFacingYaw), 0, -Math.cos(playerFacingYaw));
    playerGroup.position.add(dashDir.multiplyScalar(3.8));
    worldPhysics.resolveCollision(playerGroup.position, 0.55, playerGroup.position.y);
    AudioSys.play(340, 0.09, 'triangle');
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
    yaw -= e.movementX * 0.0028;
    pitch = Math.max(-0.95, Math.min(0.5, pitch - e.movementY * 0.0024));
  }
});

// Daño a enemigos, caída de Dientes (🦷) y recompensas de Boss
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

  if (en.isBoss) updateBossHUD();

  if (en.hp <= 0) {
    en.state = 'dead';
    en.stateTimer = 0;
    kills++;

    if (en.isBoss) {
      bossesDefeated++;
      runSouls += en.bossData.teethReward || 15;
      activeBoss = null;
      document.getElementById('boss-hud').classList.add('hidden');
      AudioSys.playBossHorn();

      const chest = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 0.75, 0.75),
        new THREE.MeshBasicMaterial({ color: 0xd4af37 })
      );
      chest.position.copy(en.group.position).add(new THREE.Vector3(0, 0.5, 0));
      scene.add(chest);
      drops.push({ mesh: chest, isBossChest: true, isTooth: false });

      if (bossesDefeated >= CONFIG.BOSS_SCHEDULE.length && !isEndgame) {
        activateEndgamePhase();
      }
    } else {
      const isTooth = Math.random() < 0.26;
      const dropSprite = new THREE.Mesh(
        new THREE.PlaneGeometry(0.62, 0.62),
        new THREE.MeshBasicMaterial({ color: isTooth ? 0xe6d7a5 : 0xa52020, side: THREE.DoubleSide })
      );
      dropSprite.position.copy(en.group.position).add(new THREE.Vector3(0, 0.45, 0));
      scene.add(dropSprite);
      drops.push({ mesh: dropSprite, isBossChest: false, isTooth });
    }
    updateHUD();
  }
}

// Gestión de Armas y Pasivas en Subida de Nivel
function applyUpgradeOption(opt) {
  AudioSys.playUISelect();
  if (opt.category === 'weapon') {
    const current = skills[opt.id] || 0;
    if (current >= CONFIG.LIMITS.MAX_LEVEL) return;
    if (current === 0 && Object.keys(skills).length >= CONFIG.LIMITS.MAX_WEAPONS) return;
    skills[opt.id] = current + 1;

    if (opt.id === 'orbital') {
      syncOrbitalsCount();
    }
    if (['shotgun', 'flamethrower', 'harpoon', 'slash', 'bolt', 'mines'].includes(opt.id)) {
      currentHandWeapon = opt.id;
    }
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
      badge: lvl === 0 ? 'ARMA NUEVA (VISIBLE EN 8-DIR)' : 'MEJORA DE ARMA',
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
      badgeClass: 'badge-passive', desc: `${p.desc} (${p.format(lvl + 1)})`
    });
  });

  return pool;
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

  choices.forEach(opt => {
    const card = document.createElement('div');
    card.className = 'upg-card';
    const lvlLabel = opt.category === 'fallback'
      ? 'EXTRA'
      : (opt.currentLvl === 0 ? 'NUEVO (+1)' : `+${opt.currentLvl} ➔ +${opt.nextLvl}`);

    card.innerHTML = `
      <span class="upg-type-badge ${opt.badgeClass}">${opt.badge}</span>
      <div class="upg-title-row">
        <span>${opt.icon} ${opt.name}</span>
        <span class="upg-lvl-pill">${lvlLabel}</span>
      </div>
      <p style="font-size:0.74rem;color:#a89f88;margin:6px 0 0">${opt.desc}</p>
    `;
    card.onmouseenter = () => AudioSys.playUIClick();
    card.onclick = () => {
      applyUpgradeOption(opt);
      document.getElementById('level-up-screen').classList.add('hidden');
      state = 'PLAYING';
      document.body.requestPointerLock();
    };
    box.appendChild(card);
  });

  const rerollBtn = document.getElementById('btn-reroll');
  document.getElementById('reroll-count').textContent = rerollsLeft;
  rerollBtn.disabled = rerollsLeft <= 0 || pool.length <= 1;
}

function showLevelUp() {
  state = 'LEVEL_UP';
  if (document.pointerLockElement) document.exitPointerLock();
  rollLevelUpCards();
  document.getElementById('level-up-screen').classList.remove('hidden');
}

document.getElementById('btn-reroll').onclick = () => {
  if (rerollsLeft <= 0) return;
  rerollsLeft--;
  AudioSys.playReroll();
  rollLevelUpCards();
};

// Bosses cada 3 minutos
function spawnScheduledBoss(bossCfg, fwd) {
  AudioSys.playBossHorn();
  triggerScare(0.45);
  const boss = enemyPool.spawn(bossCfg.id, playerGroup.position, gameTime, fwd, worldPhysics, bossCfg);
  if (!boss) return;
  activeBoss = boss;

  const alertEl = document.getElementById('boss-alert');
  alertEl.textContent = `⚠️ ALERTA: ${bossCfg.name} EN PLANTA ⚠️`;
  alertEl.classList.remove('hidden');
  setTimeout(() => alertEl.classList.add('hidden'), 3800);

  updateBossHUD();
  document.getElementById('boss-hud').classList.remove('hidden');
}

function updateBossHUD() {
  if (!activeBoss || !activeBoss.active || activeBoss.state === 'dead') {
    document.getElementById('boss-hud').classList.add('hidden');
    return;
  }
  document.getElementById('boss-name').textContent = `// ${activeBoss.bossData.name}`;
  const phaseEl = document.getElementById('boss-phase');
  phaseEl.textContent = activeBoss.phase === 2 ? 'FASE II // FRENESÍ' : 'FASE I';
  phaseEl.classList.toggle('p2', activeBoss.phase === 2);
  document.getElementById('boss-hp-bar').style.width =
    Math.max(0, (activeBoss.hp / activeBoss.maxHp) * 100) + '%';
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
}

function updateHUD() {
  document.getElementById('hp-bar').style.width = Math.max(0, (stats.hp / stats.maxHp) * 100) + '%';
  document.getElementById('hp-text').textContent = `${Math.ceil(Math.max(0, stats.hp))} / ${stats.maxHp}`;
  document.getElementById('exp-bar').style.width = ((stats.exp / stats.maxExp) * 100) + '%';
  document.getElementById('stam-bar').style.width = stats.stamina + '%';
  document.getElementById('level-text').textContent = `CICLO ${String(stats.level).padStart(2, '0')}`;
  document.getElementById('kills-text').textContent = kills;
  document.getElementById('souls-hud').textContent = `${runSouls} 🦷`;
  document.getElementById('bosses-killed-hud').textContent = `${bossesDefeated}/5`;

  const wEntries = Object.entries(skills);
  document.getElementById('weapons-count').textContent = `${wEntries.length}/${CONFIG.LIMITS.MAX_WEAPONS}`;
  let wHtml = '';
  for (let i = 0; i < CONFIG.LIMITS.MAX_WEAPONS; i++) {
    if (wEntries[i]) {
      const [k, v] = wEntries[i];
      const sk = CONFIG.SKILLS[k];
      wHtml += `<div class="weapon-slot"><span>${sk.icon} ${sk.name.split(' ')[0]}</span><span class="lvl-badge">+${v}</span></div>`;
    } else {
      wHtml += `<div class="weapon-slot empty"><span>[ RANURA VACÍA ]</span><span>--</span></div>`;
    }
  }
  document.getElementById('skills-bar').innerHTML = wHtml;

  const pEntries = Object.entries(passives);
  document.getElementById('passives-count').textContent = `${pEntries.length}/${CONFIG.LIMITS.MAX_PASSIVES}`;
  let pHtml = '';
  for (let i = 0; i < CONFIG.LIMITS.MAX_PASSIVES; i++) {
    if (pEntries[i]) {
      const [k, v] = pEntries[i];
      const p = CONFIG.PASSIVES[k];
      pHtml += `<div class="passive-slot"><span>${p.icon} ${p.name} <b>+${v}</b></span><span>${p.format(v)}</span></div>`;
    } else {
      pHtml += `<div class="passive-slot empty"><span>[ RANURA DE IMPLANTE VACÍA ]</span><span>--</span></div>`;
    }
  }
  document.getElementById('passives-bar').innerHTML = pHtml;
}

function startGame() {
  AudioSys.init();
  AudioSys.setEndgameDrone(false);
  document.body.classList.remove('endgame-mode');
  document.getElementById('endgame-banner').classList.add('hidden');
  document.getElementById('boss-hud').classList.add('hidden');
  scene.fog.color.setHex(0x040604);
  scene.fog.density = 0.038;
  ambientLight.color.setHex(0x1e281d);

  enemyPool.clearAll();
  drops.forEach(d => scene.remove(d.mesh)); drops.length = 0;
  orbitals.forEach(o => scene.remove(o.group)); orbitals.length = 0;
  minesList.forEach(m => scene.remove(m.group)); minesList.length = 0;
  vfx.forEach(v => scene.remove(v.mesh)); vfx.length = 0;
  bossHazards.forEach(h => scene.remove(h.mesh)); bossHazards.length = 0;
  bossProjectiles.forEach(p => scene.remove(p.mesh)); bossProjectiles.length = 0;

  const baseHp = 100 + (save.hp || 0) * 5;
  stats = { maxHp: baseHp, hp: baseHp, stamina: 100, level: 1, exp: 0, maxExp: 5 };
  skills = {};
  passives = {};
  rerollsLeft = CONFIG.LIMITS.REROLLS_PER_RUN + Math.min(3, save.reroll || 0);
  nextBossIdx = 0;
  activeBoss = null;
  bossesDefeated = 0;
  isEndgame = false;

  skills.slash = 1;
  currentHandWeapon = 'slash';
  yaw = 0;
  playerFacingYaw = 0;
  aimLockTimer = 0;
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
  state = 'PLAYING';
  document.body.requestPointerLock();
}

function gameOver() {
  state = 'GAME_OVER';
  if (document.pointerLockElement) document.exitPointerLock();

  save.souls = (save.souls || 0) + runSouls;
  saveGame();

  document.getElementById('go-time').textContent = document.getElementById('timer-text').textContent;
  document.getElementById('go-bosses').textContent = `${bossesDefeated} / ${CONFIG.BOSS_SCHEDULE.length}`;
  document.getElementById('go-kills').textContent = kills;
  document.getElementById('go-souls').textContent = `+${runSouls} 🦷`;
  document.getElementById('go-total-souls').textContent = `${save.souls} 🦷`;
  document.getElementById('go-level').textContent = `CICLO ${stats.level}`;
  document.getElementById('go-endgame').textContent = isEndgame
    ? 'ALCANZADA (PROTOCOLO 15:00 SUPERADO)'
    : 'CAÍDO ANTES DEL MINUTO 15:00';

  const wSummary = Object.entries(skills).map(([k, v]) => `${CONFIG.SKILLS[k].icon} ${CONFIG.SKILLS[k].name} +${v}`).join(' · ');
  const pSummary = Object.entries(passives).map(([k, v]) => `${CONFIG.PASSIVES[k].icon} ${CONFIG.PASSIVES[k].name} +${v}`).join(' · ');
  document.getElementById('go-loadout').innerHTML =
    `<b>ARMAS:</b> ${wSummary || 'Ninguna'}<br><b>PASIVAS:</b> ${pSummary || 'Ninguna'}`;

  document.getElementById('hud').classList.add('hidden');
  document.getElementById('game-over-screen').classList.remove('hidden');
}

function dealDamageToPlayer(dmgAmount) {
  if (invuln > 0 || state !== 'PLAYING') return;
  stats.hp -= dmgAmount;
  invuln = 0.72;
  triggerScare(0.48);
  document.getElementById('damage-flash').style.opacity = 1;
  setTimeout(() => (document.getElementById('damage-flash').style.opacity = 0), 150);
  updateHUD();
  if (stats.hp <= 0) gameOver();
}

function renderShop() {
  document.getElementById('start-souls').textContent = save.souls || 0;
  document.getElementById('shop-souls').textContent = save.souls || 0;
  const goTotal = document.getElementById('go-total-souls');
  if (goTotal) goTotal.textContent = `${save.souls || 0} 🦷`;

  const list = document.getElementById('shop-list');
  list.innerHTML = '';

  CONFIG.SHOP.forEach(item => {
    const lvl = save[item.id] || 0;
    const isMaxed = item.max && lvl >= item.max;
    const cost = Math.floor(item.cost * Math.pow(1.45, lvl));
    const row = document.createElement('div');
    row.className = 'shop-row';
    row.innerHTML = `
      <div class="shop-row-info">
        <b>${item.name} [NV. ${lvl}${item.max ? '/' + item.max : ''}]</b>
        <div class="shop-row-sub">${item.desc}</div>
      </div>
      <button class="rust-btn sm" ${(save.souls || 0) < cost || isMaxed ? 'disabled' : ''}>
        ${isMaxed ? 'MÁXIMO' : `COMPRAR (${cost} 🦷)`}
      </button>
    `;
    const btn = row.querySelector('button');
    btn.onmouseenter = () => AudioSys.playUIClick();
    btn.onclick = () => {
      if (!isMaxed && (save.souls || 0) >= cost) {
        AudioSys.playUISelect();
        save.souls -= cost;
        save[item.id] = lvl + 1;
        saveGame();
        renderShop();
      }
    };
    list.appendChild(row);
  });
}

// Bucle Principal
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);

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

    if (mods.regenPerSec > 0 && stats.hp < stats.maxHp) {
      stats.hp = Math.min(stats.maxHp, stats.hp + mods.regenPerSec * dt);
      updateHUD();
    }

    if (Math.abs(camera.fov - targetFov) > 0.2) {
      camera.fov += (targetFov - camera.fov) * dt * 6;
      camera.updateProjectionMatrix();
    }

    // Vectores de la cámara en el mundo
    const camFwd = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    const camRight = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    const move = new THREE.Vector3();
    if (keys.w) move.add(camFwd);
    if (keys.s) move.sub(camFwd);
    if (keys.d) move.add(camRight);
    if (keys.a) move.sub(camRight);
    const isMoving = move.lengthSq() > 0;

    if (isMoving) {
      move.normalize();
      // Si no está bloqueado apuntando un disparo, el personaje mira hacia donde camina
      // (permite ver las 8 direcciones al moverse con WASD o al orbitar la cámara con el ratón)
      if (aimLockTimer <= 0) {
        playerFacingYaw = Math.atan2(-move.x, -move.z);
      }
      playerGroup.position.addScaledVector(move, mods.moveSpeed * dt);
      worldPhysics.resolveCollision(playerGroup.position, 0.55, playerGroup.position.y);
    }

    playerBillboard.facingYaw = playerFacingYaw;

    // Relieve y salto
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
    document.getElementById('elev-text').textContent = `COTA: ${playerGroup.position.y.toFixed(1)}m`;

    // Cámara 3ª persona
    camera.position.copy(playerGroup.position)
      .add(camFwd.clone().multiplyScalar(-5.8 * Math.cos(pitch)))
      .add(new THREE.Vector3(0, Math.max(1.1, -Math.sin(pitch) * 5.2 + 2.1), 0));
    if (camShake > 0) {
      camera.position.x += (Math.random() - 0.5) * camShake;
      camera.position.y += (Math.random() - 0.5) * camShake;
      camShake = Math.max(0, camShake - dt * 1.8);
    }
    camera.lookAt(playerGroup.position.clone().add(new THREE.Vector3(0, 1.3, 0)));

    // Selección de vista entre las 8 direcciones (según ángulo entre playerFacingYaw y camera.position)
    playerBillboard.faceCamera(camera.position);

    // Selección de estado de animación (0:IDLE, 1:WALK, 2:JUMP, 3:ATTACK, 4:HURT) sin reiniciar el frame al girar
    const ST = CONFIG.DIRECTIONAL.STATES;
    const FPS = CONFIG.DIRECTIONAL.ANIM_FPS;
    let pState = ST.IDLE;
    let fps = FPS.IDLE;

    if (invuln > 0.35) {
      pState = ST.HURT; fps = FPS.HURT;
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

    // Luz personal entre cámara y jugador
    const toCam = new THREE.Vector3().subVectors(camera.position, playerGroup.position).setY(0).normalize();
    playerLanternLight.position.copy(playerGroup.position)
      .addScaledVector(toCam, 1.1)
      .add(new THREE.Vector3(0, 1.35, 0));

    // Linterna apunta hacia donde mira la cámara
    flashlight.position.copy(playerGroup.position)
      .addScaledVector(camFwd, 0.55)
      .add(new THREE.Vector3(0, 1.5, 0));
    flashlight.target.position.copy(flashlight.position).add(camFwd);
    flashlight.intensity = Math.random() < 0.03 ? 25 : 195;

    // Comprobación de Bosses cada 3 minutos
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

    // === EJECUCIÓN DE LAS 8 ARMAS (CADA ARMA CAMBIA EL SPRITE AL ATACAR CON ELLA) ===
    const cdFactor = 1 / mods.atkSpeedMult;
    const activeEnemies = enemyPool.active;

    // 1. Sierra de Amputación
    if (skills.slash) {
      weaponTimers.slash += dt;
      const cd = Math.max(0.26, (CONFIG.SKILLS.slash.baseCd - skills.slash * 0.06) * cdFactor);
      if (weaponTimers.slash >= cd) {
        weaponTimers.slash = 0;
        const slashYaw = executeSawSlash(
          scene, playerGroup.position, yaw, skills.slash, mods,
          activeEnemies, vfx, damageEnemy, s => { camShake = Math.max(camShake, s); },
          playerFacingYaw
        );
        triggerWeaponVisualAttack('slash', slashYaw, 0.22);
      }
    }

    // 2. Escopeta Calibre 12
    if (skills.shotgun) {
      weaponTimers.shotgun += dt;
      const cd = Math.max(0.4, (CONFIG.SKILLS.shotgun.baseCd - skills.shotgun * 0.08) * cdFactor);
      if (weaponTimers.shotgun >= cd) {
        const shotYaw = fireBuckshot(
          scene, playerGroup.position, yaw, playerFacingYaw, skills.shotgun, mods,
          activeEnemies, vfx, damageEnemy, () => { camShake = Math.max(camShake, 0.2); }
        );
        if (shotYaw !== null) {
          weaponTimers.shotgun = 0;
          triggerWeaponVisualAttack('shotgun', shotYaw, 0.28);
        }
      }
    }

    // 3. Soplete Incinerador
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

    // 4. Incensario de Bilis (Aura)
    if (skills.aura) {
      auraMesh.visible = true;
      const auraRadius = (CONFIG.SKILLS.aura.baseRange + skills.aura * 0.35 + mods.bonusProjectiles * 0.35) * mods.areaMult;
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

    // 5. Minas de Metralla
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

    // 6. Arpón Neumático
    if (skills.harpoon) {
      weaponTimers.harpoon += dt;
      const cd = Math.max(0.5, (CONFIG.SKILLS.harpoon.baseCd - skills.harpoon * 0.1) * cdFactor);
      if (weaponTimers.harpoon >= cd) {
        weaponTimers.harpoon = 0;
        const harpoonYaw = fireHarpoon(scene, playerGroup.position, yaw, skills.harpoon, mods, activeEnemies, vfx, damageEnemy, playerFacingYaw);
        triggerWeaponVisualAttack('harpoon', harpoonYaw, 0.25);
      }
    }

    // 7. Desfibrilador Roto
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

    // 8. Orbitales animados
    orbitals.forEach(o => {
      const lvl = skills.orbital || 1;
      o.angle += dt * (2.7 + lvl * 0.38) * mods.atkSpeedMult;
      o.animTimer += dt * 8;
      o.orbTex.offset.set((Math.floor(o.animTimer) % 4) * 0.25, 0);
      o.eerieLight.intensity = Math.random() < 0.1 ? 8 : 24;

      const r = (CONFIG.SKILLS.orbital.baseRange + lvl * 0.15) * mods.areaMult;
      o.group.position.set(
        playerGroup.position.x + Math.cos(o.angle) * r,
        playerGroup.position.y + 1.05 + Math.sin(o.animTimer) * 0.12,
        playerGroup.position.z + Math.sin(o.angle) * r
      );
      o.sprite.rotation.y = camAngle;

      o.trailTimer -= dt;
      if (o.trailTimer <= 0) {
        o.trailTimer = 0.055;
        const ember = new THREE.Mesh(
          new THREE.BoxGeometry(0.16, 0.16, 0.16),
          new THREE.MeshBasicMaterial({ color: Math.random() < 0.5 ? 0xb89c46 : 0x6e1414, transparent: true, opacity: 0.8 })
        );
        ember.position.copy(o.group.position);
        scene.add(ember);
        vfx.push({ mesh: ember, life: 0.22, maxLife: 0.22, fade: true, scaleSpeed: -2.5 });
      }

      if (o.hitCd > 0) o.hitCd -= dt;
      activeEnemies.forEach(e => {
        if (e.state !== 'dead' && e.group.position.distanceTo(o.group.position) < 1.45) {
          const mult = 1 + (lvl - 1) * CONFIG.SKILLS.orbital.scalePerLvl;
          damageEnemy(e, CONFIG.SKILLS.orbital.baseDmg * mult * mods.dmgMult * dt, null, true);

          if (o.hitCd <= 0) {
            o.hitCd = 0.18;
            AudioSys.play(310, 0.05, 'sawtooth', 0.03);
            const blood = new THREE.Mesh(
              new THREE.BoxGeometry(0.2, 0.2, 0.2),
              new THREE.MeshBasicMaterial({ color: 0xa52020 })
            );
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

    // Minas
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
        camShake = Math.max(camShake, 0.22);

        const blast = new THREE.Mesh(
          new THREE.PlaneGeometry(blastRadius * 1.4, blastRadius * 1.4),
          new THREE.MeshBasicMaterial({ color: 0xff8822, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
        );
        blast.position.copy(m.group.position).add(new THREE.Vector3(0, 1.0, 0));
        scene.add(blast);
        vfx.push({ mesh: blast, life: 0.2, maxLife: 0.2, billboard: true, fade: true });

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

    // Zonas Telegrafiadas de Bosses
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
          camShake = Math.max(camShake, 0.25);
          const pillar = new THREE.Mesh(
            new THREE.CylinderGeometry(h.radius * 0.85, h.radius, 3.6, 12),
            new THREE.MeshBasicMaterial({ color: 0xff5511, transparent: true, opacity: 0.85 })
          );
          pillar.position.copy(h.center).add(new THREE.Vector3(0, 1.8, 0));
          scene.add(pillar);
          vfx.push({ mesh: pillar, life: 0.22, maxLife: 0.22, fade: true });

          if (playerGroup.position.distanceTo(h.center) <= h.radius) {
            dealDamageToPlayer(h.dmg);
          }
        } else if (h.type === 'cone') {
          AudioSys.play(82, 0.25, 'square', 0.1);
          camShake = Math.max(camShake, 0.25);
          const toP = new THREE.Vector3().subVectors(playerGroup.position, h.origin).setY(0);
          if (toP.length() <= h.radius && h.dir.angleTo(toP.clone().normalize()) <= h.arc) {
            dealDamageToPlayer(h.dmg);
          }
        }
        scene.remove(h.mesh);
        bossHazards.splice(i, 1);
      }
    }

    // Proyectiles de Bosses
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
        bossProjectiles.splice(i, 1);
      }
    }

    // VFX
    for (let i = vfx.length - 1; i >= 0; i--) {
      const v = vfx[i];
      v.life -= dt;
      if (v.sheetTex && v.maxLife) {
        const progress = 1 - Math.max(0, v.life / v.maxLife);
        const frame = Math.min(v.totalFrames - 1, Math.floor(progress * v.totalFrames));
        v.sheetTex.offset.set(frame * (1 / v.totalFrames), 0);
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
      if (v.life <= 0) { scene.remove(v.mesh); vfx.splice(i, 1); }
    }

    // Actualización del Pool de Enemigos
    for (let i = activeEnemies.length - 1; i >= 0; i--) {
      const e = activeEnemies[i];
      const finishedDeath = e.update(dt, playerGroup.position, camFwd, camera.position, worldPhysics, {
        onScare: () => triggerScare(0.35),
        onDealDamage: attacker => dealDamageToPlayer(attacker.dmg),
        onBurnTick: (burningEnemy, burnDmg) => damageEnemy(burningEnemy, burnDmg, null, true),
        onBossPhaseChange: () => updateBossHUD(),
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

    // Aparición Progresiva + Avalancha en Fase Final (15:00+)
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

    // Recolección de Experiencia, Dientes (🦷) y Cofres de Boss
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.mesh.rotation.y = camAngle;
      const dist = d.mesh.position.distanceTo(playerGroup.position);
      if (dist < mods.magnetRange) {
        d.mesh.position.add(new THREE.Vector3().subVectors(playerGroup.position, d.mesh.position).normalize().multiplyScalar(18 * dt));
      }
      if (dist < 1.4) {
        scene.remove(d.mesh);
        drops.splice(i, 1);

        if (d.isBossChest) {
          stats.hp = Math.min(stats.maxHp, stats.hp + stats.maxHp * 0.5);
          stats.level++;
          AudioSys.playUISelect();
          updateHUD();
          showLevelUp();
        } else if (d.isTooth) {
          runSouls++;
          AudioSys.play(640, 0.07, 'sine', 0.05);
          updateHUD();
        } else {
          stats.exp++;
          AudioSys.play(420, 0.06, 'sine', 0.04);
          if (stats.exp >= stats.maxExp) {
            stats.level++;
            stats.exp -= stats.maxExp;
            stats.maxExp = Math.floor(stats.maxExp * 1.38);
            showLevelUp();
          }
          updateHUD();
        }
      }
    }

    dust.position.set(playerGroup.position.x, playerGroup.position.y, playerGroup.position.z);
    const m = String(Math.floor(gameTime / 60)).padStart(2, '0');
    const s = String(Math.floor(gameTime % 60)).padStart(2, '0');
    document.getElementById('timer-text').textContent = `${m}:${s}`;
    document.getElementById('wave-text').textContent = isEndgame
      ? '⚠️ EXTERMINIO ACTIVO'
      : `AMENAZA: NIVEL ${1 + Math.floor(gameTime / 90)}`;
  } else if (state === 'START') {
    // En la pantalla de inicio la cámara orbita 360° alrededor del personaje mostrando las 8 direcciones
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

// Inspector de Spritesheets PNG [TAB]
function initSpritesheetInspector() {
  const grid = document.getElementById('sheets-grid');
  const list = [
    SpriteSheets.player, SpriteSheets.zombie, SpriteSheets.weeper, SpriteSheets.worm,
    SpriteSheets.boss_butcher, SpriteSheets.boss_siren, SpriteSheets.boss_furnace,
    SpriteSheets.boss_apostle, SpriteSheets.boss_warden,
    SpriteSheets.env.slash, SpriteSheets.env.orbital,
    SpriteSheets.env.ground, SpriteSheets.env.crate, SpriteSheets.env.metal
  ];
  list.forEach(item => {
    const card = document.createElement('div');
    card.className = 'sheet-card';
    card.innerHTML = `<div class="sheet-card-title">${item.name}.png (${item.canvas.width}x${item.canvas.height})</div>`;
    item.canvas.style.width = '100%';
    item.canvas.style.height = 'auto';
    card.appendChild(item.canvas);
    const btn = document.createElement('button');
    btn.className = 'rust-btn sm';
    btn.style.marginTop = '6px';
    btn.textContent = '⬇ Descargar PNG';
    btn.onclick = () => {
      AudioSys.playUIClick();
      const a = document.createElement('a');
      a.download = `${item.name}.png`;
      a.href = item.canvas.toDataURL('image/png');
      a.click();
    };
    card.appendChild(btn);
    grid.appendChild(card);
  });
}

document.getElementById('btn-start').onclick = () => { AudioSys.playUISelect(); startGame(); };
document.getElementById('btn-shop-play').onclick = () => { AudioSys.playUISelect(); startGame(); };
document.getElementById('btn-restart').onclick = () => { AudioSys.playUISelect(); startGame(); };

document.getElementById('btn-open-shop').onclick = () => {
  AudioSys.init();
  AudioSys.playUIClick();
  lastMenuScreen = 'start-screen';
  renderShop();
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('shop-screen').classList.remove('hidden');
};

document.getElementById('btn-go-shop').onclick = () => {
  AudioSys.playUIClick();
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
};

document.getElementById('btn-open-sheets').onclick = () => {
  AudioSys.playUIClick();
  if (document.pointerLockElement) document.exitPointerLock();
  document.getElementById('sheets-modal').classList.remove('hidden');
};
document.getElementById('btn-close-sheets').onclick = () => {
  AudioSys.playUIClick();
  document.getElementById('sheets-modal').classList.add('hidden');
};

syncPlayerVisualLoadout('slash');
initSpritesheetInspector();
renderShop();
animate();