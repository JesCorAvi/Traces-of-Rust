import * as THREE from 'three';
import { CONFIG } from './config.js';
import { AudioSys } from './audio.js';
import { SpriteSheets } from './spritesheets.js';
import { createWorld } from './world.js';
import { createBillboardSprite, Enemy } from './entities.js';
import { executeSawSlash, fireBuckshot, fireDefibrillator } from './combat.js';

let save = JSON.parse(localStorage.getItem(CONFIG.SAVE_KEY)) || { souls: 0, dmg: 0, hp: 0, spd: 0, mag: 0 };
const saveGame = () => localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(save));

// Escena 3D, Cámara y Renderizador Low-Res con Sombras Reales
const { scene, altars, propBillboards, ceilingLights, dust } = createWorld();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 90);

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

// Jugador: 100% Billboard 2D Animado con Sombra Proyectada
const playerBillboard = createBillboardSprite('player', 2.0);
const playerGroup = playerBillboard.group;
scene.add(playerGroup);

// Linterna dramática 3D que proyecta sombras largas
const flashlight = new THREE.SpotLight(0xe6d7a5, 190, 38, Math.PI / 3.8, 0.45, 1.3);
flashlight.castShadow = true;
flashlight.shadow.mapSize.set(512, 512);
scene.add(flashlight, flashlight.target);

// Variables de estado y efectos de susto
let state = 'START', yaw = 0, pitch = -0.22, gameTime = 0, runSouls = 0, kills = 0;
let stats = {}, skills = {}, playerYVel = 0, dashCd = 0, invuln = 0, atkAnimTimer = 0;
let camShake = 0, targetFov = 70;
let spawnTimer = 0, slashTimer = 0, shotTimer = 0, boltTimer = 0;
const enemies = [], drops = [], orbitals = [], vfx = [];

// Efecto de Susto (Zoom brusco + Shake + Aberración Cromática + Flash)
function triggerScare(intensity = 0.45) {
  camShake = Math.max(camShake, intensity);
  camera.fov = 50;
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
    if (!isHidden && document.pointerLockElement) {
      document.exitPointerLock();
    }
    return;
  }

  const k = e.key.toLowerCase();
  keys[k] = true;
  if (state !== 'PLAYING') return;

  if (k === 'shift' && dashCd <= 0 && stats.stamina >= 35) {
    stats.stamina -= 35; dashCd = 0.85; invuln = 0.35;
    const fwd = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    playerGroup.position.add(fwd.multiplyScalar(4.0));
    AudioSys.play(340, 0.09, 'triangle');
  }
  if (e.code === 'Space' && playerGroup.position.y <= 0.01) {
    playerYVel = 8.2; AudioSys.play(220, 0.1, 'sine');
  }
  if (k === 'e') tryUseAltar();
});
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
document.addEventListener('mousemove', e => {
  if (document.pointerLockElement === document.body && state === 'PLAYING') {
    yaw -= e.movementX * 0.0028;
    pitch = Math.max(-0.95, Math.min(0.5, pitch - e.movementY * 0.0024));
  }
});

function damageEnemy(en, amount, knockback) {
  if (en.state === 'dead') return;
  en.hp -= amount;
  en.state = 'hurt';
  en.stateTimer = 0.18;
  if (knockback) en.group.position.add(knockback);
  AudioSys.play(145, 0.07, 'square', 0.04);

  if (en.hp <= 0) {
    en.state = 'dead';
    en.stateTimer = 0;
    kills++;
    const isTooth = Math.random() < 0.25 || en.type === 'boss';
    const dropSprite = new THREE.Mesh(
      new THREE.PlaneGeometry(0.65, 0.65),
      new THREE.MeshBasicMaterial({ color: isTooth ? 0xe6d7a5 : 0xa52020, side: THREE.DoubleSide })
    );
    dropSprite.position.copy(en.group.position).setY(0.45);
    scene.add(dropSprite);
    drops.push({ mesh: dropSprite, tooth: isTooth });
    updateHUD();
  }
}

function tryUseAltar() {
  altars.forEach(a => {
    if (!a.used && a.billboard.group.position.distanceTo(playerGroup.position) < 4.0) {
      a.used = true;
      a.lamp.intensity = 0;
      a.billboard.setFrame(1, 0);
      runSouls += 5;
      stats.hp = Math.min(stats.maxHp, stats.hp + 35);
      camShake = 0.25;
      AudioSys.play(520, 0.25, 'sawtooth', 0.08);
      updateHUD();
    }
  });
}

function addSkill(id) {
  skills[id] = (skills[id] || 0) + 1;
  if (id === 'vital') { stats.maxHp += 35; stats.hp = stats.maxHp; }
  if (id === 'orbital') {
    const hook = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.9),
      new THREE.MeshBasicMaterial({ map: SpriteSheets.env.slash.tex, transparent: true, alphaTest: 0.2, side: THREE.DoubleSide })
    );
    scene.add(hook);
    orbitals.push({ mesh: hook, angle: orbitals.length * 2.1 });
  }
  updateHUD();
}

function showLevelUp() {
  state = 'LEVEL_UP';
  document.exitPointerLock();
  const box = document.getElementById('upgrade-container');
  box.innerHTML = '';
  const avail = Object.keys(CONFIG.SKILLS).filter(k => (skills[k] || 0) < CONFIG.SKILLS[k].max);
  avail.sort(() => 0.5 - Math.random()).slice(0, 3).forEach(k => {
    const sk = CONFIG.SKILLS[k], lvl = skills[k] || 0;
    const card = document.createElement('div');
    card.className = 'upg-card';
    card.innerHTML = `<div style="color:#b89c46;font-weight:700">${sk.icon} ${sk.name} [NV.${lvl + 1}]</div>
                      <p style="font-size:0.76rem;color:#9ca392;margin:6px 0 0">${sk.desc}</p>`;
    card.onclick = () => {
      addSkill(k);
      document.getElementById('level-up-screen').classList.add('hidden');
      state = 'PLAYING';
      document.body.requestPointerLock();
    };
    box.appendChild(card);
  });
  document.getElementById('level-up-screen').classList.remove('hidden');
}

function updateHUD() {
  document.getElementById('hp-bar').style.width = Math.max(0, (stats.hp / stats.maxHp) * 100) + '%';
  document.getElementById('hp-text').textContent = `${Math.ceil(Math.max(0, stats.hp))}/${stats.maxHp}`;
  document.getElementById('exp-bar').style.width = ((stats.exp / stats.maxExp) * 100) + '%';
  document.getElementById('stam-bar').style.width = stats.stamina + '%';
  document.getElementById('level-text').textContent = `CICLO ${stats.level}`;
  document.getElementById('kills-text').textContent = `BAJAS: ${kills}`;
  document.getElementById('souls-hud').textContent = `DIENTES: ${runSouls} 🦷`;
  document.getElementById('skills-bar').innerHTML = Object.entries(skills)
    .map(([k, v]) => `<span class="skill-tag">${CONFIG.SKILLS[k].icon} ${v}</span>`)
    .join('');
}

function startGame() {
  AudioSys.init();
  enemies.forEach(e => scene.remove(e.group)); enemies.length = 0;
  drops.forEach(d => scene.remove(d.mesh)); drops.length = 0;
  orbitals.forEach(o => scene.remove(o.mesh)); orbitals.length = 0;
  vfx.forEach(v => scene.remove(v.mesh)); vfx.length = 0;

  stats = {
    maxHp: 100 + save.hp * 25, hp: 100 + save.hp * 25,
    speed: 6.0 + save.spd * 0.45, dmgMult: 1 + save.dmg * 0.2,
    magnet: 5.5 + save.mag * 1.6, stamina: 100,
    level: 1, exp: 0, maxExp: 5
  };
  skills = {};
  addSkill('slash'); // El jugador empieza únicamente con la Sierra de Amputación
  playerGroup.position.set(0, 0, 0);
  gameTime = 0; runSouls = 0; kills = 0;

  document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden'));
  document.getElementById('hud').classList.remove('hidden');
  updateHUD();
  state = 'PLAYING';
  document.body.requestPointerLock();
}

function gameOver() {
  state = 'GAME_OVER';
  document.exitPointerLock();
  save.souls += runSouls;
  saveGame();
  document.getElementById('go-time').textContent = document.getElementById('timer-text').textContent;
  document.getElementById('go-souls').textContent = runSouls;
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('game-over-screen').classList.remove('hidden');
}

// Bucle principal
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);

  // Parpadeo errático de lámparas industriales del techo
  ceilingLights.forEach(cl => {
    cl.light.intensity = Math.random() < 0.04 ? 2 : cl.baseIntensity;
  });

  if (state === 'PLAYING') {
    gameTime += dt;
    if (invuln > 0) invuln -= dt;
    if (dashCd > 0) dashCd -= dt;
    if (atkAnimTimer > 0) atkAnimTimer -= dt;
    stats.stamina = Math.min(100, stats.stamina + dt * 22);

    // Recuperación suave del zoom brusco de susto
    if (Math.abs(camera.fov - targetFov) > 0.2) {
      camera.fov += (targetFov - camera.fov) * dt * 6;
      camera.updateProjectionMatrix();
    }

    // Movimiento 3D del Jugador
    const fwd = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    const move = new THREE.Vector3();
    if (keys.w) move.add(fwd);
    if (keys.s) move.sub(fwd);
    if (keys.d) move.add(right);
    if (keys.a) move.sub(right);
    const isMoving = move.lengthSq() > 0;
    if (isMoving) {
      move.normalize().multiplyScalar(stats.speed * dt);
      playerGroup.position.add(move);
    }

    // Salto y gravedad
    if (playerGroup.position.y > 0 || playerYVel !== 0) {
      playerGroup.position.y += playerYVel * dt;
      playerYVel -= 22 * dt;
      if (playerGroup.position.y <= 0) { playerGroup.position.y = 0; playerYVel = 0; }
    }

    // Animación por frames del Billboard del Jugador
    playerBillboard.animTimer += dt * 7;
    const pRow = invuln > 0.35 ? 3 : atkAnimTimer > 0 ? 2 : isMoving ? 1 : 0;
    playerBillboard.setFrame(pRow, Math.floor(playerBillboard.animTimer) % 4);

    // Cámara en 3ª persona con Camera Shake de terror
    camera.position.copy(playerGroup.position)
      .add(fwd.clone().multiplyScalar(-5.8 * Math.cos(pitch)))
      .add(new THREE.Vector3(0, Math.max(1.1, -Math.sin(pitch) * 5.2 + 2.1), 0));
    if (camShake > 0) {
      camera.position.x += (Math.random() - 0.5) * camShake;
      camera.position.y += (Math.random() - 0.5) * camShake;
      camShake = Math.max(0, camShake - dt * 1.8);
    }
    camera.lookAt(playerGroup.position.clone().add(new THREE.Vector3(0, 1.3, 0)));

    // Orientación Billboard hacia la cámara para jugador, pilares y altares
    playerBillboard.faceCamera(camera.position);
    const camAngle = Math.atan2(camera.position.x - playerGroup.position.x, camera.position.z - playerGroup.position.z);
    propBillboards.forEach(p => { p.rotation.y = camAngle; });
    altars.forEach(a => {
      a.billboard.faceCamera(camera.position);
      if (!a.used) {
        a.billboard.animTimer += dt * 4;
        a.billboard.setFrame(0, Math.floor(a.billboard.animTimer) % 4);
      }
    });

    // Linterna con parpadeo de batería defectuosa
    flashlight.position.copy(playerGroup.position).add(new THREE.Vector3(0, 1.5, 0));
    flashlight.target.position.copy(flashlight.position).add(fwd);
    flashlight.intensity = Math.random() < 0.03 ? 25 : 190;

    // Interacción con terminales
    const nearAltar = altars.some(a => !a.used && a.billboard.group.position.distanceTo(playerGroup.position) < 4.0);
    document.getElementById('interact-prompt').classList.toggle('hidden', !nearAltar);

    // Armas Automáticas
    slashTimer += dt;
    if (skills.slash && slashTimer >= Math.max(0.35, 0.95 - skills.slash * 0.1)) {
      slashTimer = 0; atkAnimTimer = 0.22;
      executeSawSlash(scene, playerGroup.position, yaw, skills.slash, stats.dmgMult, enemies, vfx, damageEnemy);
    }
    shotTimer += dt;
    if (skills.shotgun && shotTimer >= Math.max(0.55, 1.5 - skills.shotgun * 0.15)) {
      shotTimer = 0; atkAnimTimer = 0.22;
      fireBuckshot(scene, playerGroup.position, skills.shotgun, stats.dmgMult, enemies, vfx, damageEnemy, () => {
        camShake = Math.max(camShake, 0.22);
      });
    }
    boltTimer += dt;
    if (skills.bolt && boltTimer >= Math.max(0.7, 2.1 - skills.bolt * 0.2)) {
      boltTimer = 0;
      fireDefibrillator(scene, playerGroup.position, skills.bolt, stats.dmgMult, enemies, vfx, damageEnemy);
    }

    // Ganchos orbitales (Billboards)
    orbitals.forEach(o => {
      o.angle += dt * (2.6 + (skills.orbital || 1) * 0.4);
      o.mesh.position.set(
        playerGroup.position.x + Math.cos(o.angle) * 3.1,
        1.0,
        playerGroup.position.z + Math.sin(o.angle) * 3.1
      );
      o.mesh.rotation.y = camAngle;
      enemies.forEach(e => {
        if (e.state !== 'dead' && e.group.position.distanceTo(o.mesh.position) < 1.3) {
          damageEnemy(e, 20 * stats.dmgMult * dt);
        }
      });
    });

    // Actualización y limpieza de VFX (postas, fogonazos, cartuchos y humo)
    for (let i = vfx.length - 1; i >= 0; i--) {
      const v = vfx[i];
      v.life -= dt;
      if (v.vel) {
        v.mesh.position.addScaledVector(v.vel, dt);
        if (v.gravity) v.vel.y -= v.gravity * dt;
        if (v.mesh.position.y < 0.05 && v.gravity) {
          v.mesh.position.y = 0.05;
          v.vel.y *= -0.4;
          v.vel.x *= 0.6;
          v.vel.z *= 0.6;
        }
      }
      if (v.scaleSpeed) v.mesh.scale.addScalar(v.scaleSpeed * dt);
      if (v.spin) {
        v.mesh.rotation.x += v.spin.x * dt;
        v.mesh.rotation.z += v.spin.z * dt;
      }
      if (v.billboard) v.mesh.rotation.y = camAngle;
      if (v.fade && v.mesh.material && v.maxLife) {
        v.mesh.material.opacity = Math.max(0, v.life / v.maxLife);
      }
      if (v.life <= 0) {
        scene.remove(v.mesh);
        vfx.splice(i, 1);
      }
    }

    // Actualización de Enemigos (con ventana de esquiva de 0.35s)
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      const finishedDeath = e.update(
        dt,
        playerGroup.position,
        fwd,
        camera.position,
        () => triggerScare(0.35),
        (attacker) => {
          if (playerGroup.position.y < 0.85 && invuln <= 0) {
            stats.hp -= attacker.dmg;
            invuln = 0.75;
            triggerScare(0.5);
            document.getElementById('damage-flash').style.opacity = 1;
            setTimeout(() => (document.getElementById('damage-flash').style.opacity = 0), 150);
            updateHUD();
            if (stats.hp <= 0) gameOver();
          }
        }
      );

      if (finishedDeath) {
        scene.remove(e.group);
        enemies.splice(i, 1);
      }
    }

    // Oleadas de enemigos emergiendo de la niebla (pasamos 'fwd' para que el weeper salga delante)
    spawnTimer -= dt;
    if (spawnTimer <= 0 && enemies.length < 95) {
      spawnTimer = Math.max(0.28, 1.1 - gameTime / 130);
      const r = Math.random();
      const type = gameTime > 40 && r > 0.95 ? 'boss' : gameTime > 18 && r > 0.76 ? 'weeper' : gameTime > 8 && r < 0.25 ? 'worm' : 'zombie';
      enemies.push(new Enemy(type, scene, playerGroup.position, gameTime, fwd));
    }

    // Recolección de botín (Billboards)
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.mesh.rotation.y = camAngle;
      const dist = d.mesh.position.distanceTo(playerGroup.position);
      if (dist < stats.magnet) {
        d.mesh.position.add(new THREE.Vector3().subVectors(playerGroup.position, d.mesh.position).normalize().multiplyScalar(17 * dt));
      }
      if (dist < 1.3) {
        if (d.tooth) runSouls++;
        else {
          stats.exp++;
          if (stats.exp >= stats.maxExp) {
            stats.level++; stats.exp -= stats.maxExp; stats.maxExp = Math.floor(stats.maxExp * 1.45);
            showLevelUp();
          }
        }
        AudioSys.play(d.tooth ? 620 : 420, 0.07, 'sine', 0.04);
        scene.remove(d.mesh);
        drops.splice(i, 1);
        updateHUD();
      }
    }

    dust.position.set(playerGroup.position.x, 0, playerGroup.position.z);
    const m = String(Math.floor(gameTime / 60)).padStart(2, '0');
    const s = String(Math.floor(gameTime % 60)).padStart(2, '0');
    document.getElementById('timer-text').textContent = `${m}:${s}`;
  } else if (state === 'START') {
    const t = performance.now() * 0.00025;
    camera.position.set(Math.sin(t) * 12, 4.2, Math.cos(t) * 12);
    camera.lookAt(0, 1.2, 0);
    playerBillboard.faceCamera(camera.position);
  }

  renderer.render(scene, camera);
}

// Inspector y Descargador de Spritesheets PNG
function initSpritesheetInspector() {
  const grid = document.getElementById('sheets-grid');
  const list = [
    SpriteSheets.player, SpriteSheets.zombie, SpriteSheets.weeper,
    SpriteSheets.worm, SpriteSheets.boss, SpriteSheets.altar,
    SpriteSheets.env.ground, SpriteSheets.env.pillar
  ];
  list.forEach(item => {
    const card = document.createElement('div');
    card.className = 'sheet-card';
    card.innerHTML = `<div class="sheet-card-title">${item.name}_sheet.png</div>`;
    card.appendChild(item.canvas);
    const btn = document.createElement('button');
    btn.className = 'term-btn-sm';
    btn.style.marginTop = '8px';
    btn.textContent = '⬇ Descargar PNG';
    btn.onclick = () => {
      const a = document.createElement('a');
      a.download = `${item.name}_sheet.png`;
      a.href = item.canvas.toDataURL('image/png');
      a.click();
    };
    card.appendChild(btn);
    grid.appendChild(card);
  });
}

// Tienda y Eventos de Menú
function renderShop() {
  document.getElementById('start-souls').textContent = save.souls;
  document.getElementById('shop-souls').textContent = save.souls;
  const list = document.getElementById('shop-list');
  list.innerHTML = '';
  CONFIG.SHOP.forEach(item => {
    const lvl = save[item.id] || 0;
    const cost = item.cost * (lvl + 1);
    const row = document.createElement('div');
    row.className = 'shop-row';
    row.innerHTML = `<span><b>${item.name}</b> [NV.${lvl}]</span>
                     <button class="term-btn-sm" ${save.souls < cost ? 'disabled' : ''}>${cost} 🦷</button>`;
    row.querySelector('button').onclick = () => {
      if (save.souls >= cost) {
        save.souls -= cost; save[item.id] = lvl + 1; saveGame(); renderShop();
      }
    };
    list.appendChild(row);
  });
}

document.getElementById('btn-start').onclick = startGame;
document.getElementById('btn-restart').onclick = () => {
  document.getElementById('game-over-screen').classList.add('hidden');
  document.getElementById('start-screen').classList.remove('hidden');
  renderShop(); state = 'START';
};
document.getElementById('btn-open-shop').onclick = () => {
  renderShop();
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('shop-screen').classList.remove('hidden');
};
document.getElementById('btn-close-shop').onclick = () => {
  document.getElementById('shop-screen').classList.add('hidden');
  document.getElementById('start-screen').classList.remove('hidden');
};
document.getElementById('btn-open-sheets').onclick = () => {
  if (document.pointerLockElement) document.exitPointerLock();
  document.getElementById('sheets-modal').classList.remove('hidden');
};
document.getElementById('btn-close-sheets').onclick = () => {
  document.getElementById('sheets-modal').classList.add('hidden');
};

initSpritesheetInspector();
renderShop();
animate();