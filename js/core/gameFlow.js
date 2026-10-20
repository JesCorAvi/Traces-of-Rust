// Flujo de partida: inicio, fin, pausa, menú y wiring de botones.
// Exports: setupGameFlow.

import { openMapSelector } from '../ui/mapSelectorModal.js';

export function setupGameFlow(rt) {
function clearSharedRunState() {
  rt.ModeManager.cleanupActiveMode(rt.buildModeContext());
  rt.enemyPool.clearAll();
  rt.drops.forEach(d => rt.scene.remove(d.group)); rt.drops.length = 0;
  rt.orbitals.forEach(o => { rt.scene.remove(o.group); o.geo.dispose(); }); rt.orbitals.length = 0;
  rt.minesList.forEach(m => rt.scene.remove(m.group)); rt.minesList.length = 0;
  rt.vfx.forEach(v => rt.cleanupVfxItem(v)); rt.vfx.length = 0;
  rt.bossHazards.forEach(h => { rt.scene.remove(h.mesh); h.mesh.geometry.dispose(); h.mesh.material.dispose(); }); rt.bossHazards.length = 0;
  rt.bossProjectiles.forEach(p => { rt.scene.remove(p.mesh); p.mesh.material.dispose(); }); rt.bossProjectiles.length = 0;
  rt.activeBoss = null;
  rt.auraMesh.visible = false;
  rt.debugOverlay.clearDynamicMeshes();
}

function startGame(options = {}) {
  rt.pendingTutorial = !!options.tutorial;
  rt.AudioSys.init();
  clearSharedRunState();

  const modeId = rt.ModeManager.getSelectedModeId();
  rt.careerByMode[modeId].runs = (rt.careerByMode[modeId].runs || 0) + 1;
  rt.saveCareer();

  const charId = rt.getSelectedCharacterId ? rt.getSelectedCharacterId() : (localStorage.getItem('traces_selected_character') || 'otto');
  const character = (rt.getCharacterById ? rt.getCharacterById(charId) : null) || rt.CONFIG.CHARACTERS?.[charId] || rt.CONFIG.CHARACTERS?.otto;
  rt.activeCharacter = character;

  const baseHp = 100 + (rt.save.hp || 0) * 5 + (character?.statMods?.baseHpBonus || 0);
  rt.stats = { maxHp: baseHp, hp: baseHp, stamina: 100, level: 1, exp: 0, maxExp: 5 };
  const startWp = character?.weapon || 'slash';
  rt.skills = { [startWp]: 1 };
  rt.passives = {};
  Object.keys(rt.weaponTimers).forEach(k => { rt.weaponTimers[k] = 0; });
  rt.maxRerollsRun = rt.CONFIG.LIMITS.REROLLS_PER_RUN + Math.min(3, rt.save.reroll || 0);
  rt.rerollsLeft = rt.maxRerollsRun;
  rt.currentHandWeapon = startWp;
  rt.yaw = 0; rt.playerFacingYaw = 0; rt.dashTimer = 0; rt.playerYVel = 0;
  rt.gameTime = 0; rt.runSouls = 0; rt.kills = 0;

  rt.prewarmLoadoutSheets();
  rt.syncPlayerVisualLoadout(startWp);

  rt.ModeManager.startActiveMode(rt.buildModeContext());
  rt.pendingTutorial = false;
  rt.hudController.applyModeLayout(rt.ModeManager.getHudConfig());
  rt.debugOverlay.rebuildStaticPaths(modeId, rt.worldPhysics);
  document.getElementById('top-bar')?.classList.remove('hidden');

  document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden'));
  document.getElementById('hud').classList.remove('hidden');
  rt.refreshHUD(true);
  rt.refreshStaticDOMIcons();
  rt.state = 'PLAYING';
  document.body.requestPointerLock();
}

function finishRun(outcome) {
  if (rt.state === 'GAME_OVER') return;
  rt.state = 'GAME_OVER';
  if (document.pointerLockElement) document.exitPointerLock();

  rt.save.souls = (rt.save.souls || 0) + rt.runSouls;
  rt.saveGame();

  rt.presentRunResultsScreen({
    outcome,
    stats: rt.stats,
    skills: rt.skills,
    passives: rt.passives,
    kills: rt.kills,
    runSouls: rt.runSouls,
    totalSouls: rt.save.souls,
    gameTime: rt.gameTime,
    careerByMode: rt.careerByMode,
    saveCareerFn: rt.saveCareer
  });
}

function returnToMainMenu() {
  rt.AudioSys.playUISelect();
  clearSharedRunState();
  rt.state = 'START';
  rt.playerGroup.position.set(0, 0, 0);
  document.querySelectorAll('.overlay').forEach(el => el.classList.add('hidden'));
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('top-bar')?.classList.add('hidden');
  document.getElementById('start-screen').classList.remove('hidden');
  rt.renderModeSelectorUI(rt.careerByMode);
  rt.updateCareerDossierForSelectedMode(rt.careerByMode);
  rt.updateStartPlayButton?.(rt.ModeManager.getSelectedModeId(), localStorage.getItem('traces_td_difficulty') || 'normal');
  rt.renderShopUI(rt.save, rt.saveGame);
}

function togglePauseGame() {
  if (rt.state === 'PLAYING') {
    rt.state = 'PAUSED';
    rt.AudioSys.playPause();
    if (document.pointerLockElement) document.exitPointerLock();
    document.getElementById('pause-screen').classList.remove('hidden');
    document.getElementById('btn-resume')?.focus();
  } else if (rt.state === 'PAUSED') {
    rt.state = 'PLAYING';
    rt.AudioSys.playPause();
    document.getElementById('pause-screen').classList.add('hidden');
    document.body.requestPointerLock();
  }
}

function openTurretBuildMenu(nearbyTurret = null) {
  if (rt.state !== 'PLAYING') return;
  rt.state = 'BUILD';
  if (document.pointerLockElement) document.exitPointerLock();
  document.getElementById('turret-interact-prompt')?.classList.add('hidden');
  rt.turretBuildMenu.open(rt.ModeManager.activeMode, nearbyTurret, () => {
    rt.state = 'PLAYING';
    document.body.requestPointerLock();
  });
}

function showTutorialPrompt() {
  document.getElementById('start-screen')?.classList.add('hidden');
  document.getElementById('shop-screen')?.classList.add('hidden');
  document.getElementById('tutorial-prompt-screen')?.classList.remove('hidden');
}

function requestStartGame() {
  rt.AudioSys.playUISelect();
  const tutorialKey = rt.CONFIG.CORE_DEFENSE.TUTORIAL.choiceKey;
  if (rt.ModeManager.getSelectedModeId() === 'core_defense') {
    if (!localStorage.getItem(tutorialKey)) {
      showTutorialPrompt();
      return;
    }
    openMapSelector(localStorage.getItem('traces_td_difficulty') || 'normal', () => {
      startGame({ tutorial: false });
    });
    return;
  }
  startGame({ tutorial: false });
}

function updateTdTutorialButton() {
  const btn = document.getElementById('btn-td-tutorial');
  if (!btn) return;
  btn.classList.toggle('hidden', rt.ModeManager.getSelectedModeId() !== 'core_defense');
}

document.getElementById('btn-start').onclick = requestStartGame;
document.getElementById('btn-shop-play').onclick = requestStartGame;
document.getElementById('btn-restart').onclick = () => { rt.AudioSys.playUISelect(); startGame({ tutorial: false }); };
document.getElementById('btn-results-menu').onclick = () => returnToMainMenu();
document.getElementById('btn-pause-to-menu').onclick = () => returnToMainMenu();
document.getElementById('btn-resume').onclick = () => togglePauseGame();

document.getElementById('btn-open-shop').onclick = () => {
  rt.AudioSys.init(); rt.AudioSys.playUISelect(); rt.lastMenuScreen = 'start-screen';
  rt.renderShopUI(rt.save, rt.saveGame);
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('shop-screen').classList.remove('hidden');
};
document.getElementById('btn-go-shop').onclick = () => {
  rt.AudioSys.playUISelect(); rt.lastMenuScreen = 'game-over-screen';
  rt.renderShopUI(rt.save, rt.saveGame);
  document.getElementById('game-over-screen').classList.add('hidden');
  document.getElementById('shop-screen').classList.remove('hidden');
};
document.getElementById('btn-close-shop').onclick = () => {
  rt.AudioSys.playUIClick();
  document.getElementById('shop-screen').classList.add('hidden');
  document.getElementById(rt.lastMenuScreen).classList.remove('hidden');
};
document.getElementById('btn-open-manual').onclick = () => document.getElementById('manual-modal').classList.remove('hidden');
document.getElementById('btn-close-manual').onclick = () => document.getElementById('manual-modal').classList.add('hidden');
document.getElementById('btn-open-settings').onclick = () => {
  rt.lastMenuScreen = 'start-screen';
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('settings-screen').classList.remove('hidden');
};
document.getElementById('btn-pause-settings').onclick = () => {
  rt.lastMenuScreen = 'pause-screen';
  document.getElementById('pause-screen').classList.add('hidden');
  document.getElementById('settings-screen').classList.remove('hidden');
};
document.getElementById('btn-close-settings').onclick = () => {
  document.getElementById('settings-screen').classList.add('hidden');
  document.getElementById(rt.lastMenuScreen).classList.remove('hidden');
};
document.getElementById('btn-open-sheets')?.addEventListener('click', () => document.getElementById('sheets-modal')?.classList.remove('hidden'));
document.getElementById('btn-close-sheets').onclick = () => document.getElementById('sheets-modal').classList.add('hidden');

document.getElementById('btn-tutorial-yes').onclick = () => {
  localStorage.setItem(rt.CONFIG.CORE_DEFENSE.TUTORIAL.choiceKey, 'tutorial');
  document.getElementById('tutorial-prompt-screen').classList.add('hidden');
  rt.AudioSys.playUISelect();
  startGame({ tutorial: true });
};
document.getElementById('btn-tutorial-no').onclick = () => {
  localStorage.setItem(rt.CONFIG.CORE_DEFENSE.TUTORIAL.choiceKey, 'skipped');
  document.getElementById('tutorial-prompt-screen').classList.add('hidden');
  rt.AudioSys.playUISelect();
  openMapSelector(localStorage.getItem('traces_td_difficulty') || 'normal', () => {
    startGame({ tutorial: false });
  });
};
document.getElementById('btn-td-tutorial').onclick = () => {
  rt.AudioSys.playUISelect();
  localStorage.setItem(rt.CONFIG.CORE_DEFENSE.TUTORIAL.choiceKey, 'tutorial');
  startGame({ tutorial: true });
};

document.getElementById('ui-scale-select').onchange = e => {
  rt.initUISpritesCSS(parseInt(e.target.value, 10) || 2);
  rt.refreshStaticDOMIcons();
  if (rt.state !== 'START') rt.refreshHUD(true);
};

  rt.startGame = startGame;
  rt.finishRun = finishRun;
  rt.returnToMainMenu = returnToMainMenu;
  rt.togglePauseGame = togglePauseGame;
  rt.openTurretBuildMenu = openTurretBuildMenu;
  rt.requestStartGame = requestStartGame;
  rt.updateTdTutorialButton = updateTdTutorialButton;
  rt.clearSharedRunState = clearSharedRunState;

}
