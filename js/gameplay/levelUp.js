// Flujo de subida de nivel: aplicar mejoras y mostrar cartas.
// Exports: createLevelUpFlow.

import { HAND_WEAPONS } from './playerVisuals.js';

export function createLevelUpFlow(rt) {
  function applyUpgradeOption(opt) {
    rt.AudioSys.playUISelect();
    rt.lastUpgradedKey = opt.id;
    const modeId = rt.ModeManager.getSelectedModeId();
    rt.careerByMode[modeId].totalUpgradesBought = (rt.careerByMode[modeId].totalUpgradesBought || 0) + 1;
    rt.saveCareer();

    if (opt.category === 'weapon') {
      const current = rt.skills[opt.id] || 0;
      if (current < rt.CONFIG.LIMITS.MAX_LEVEL) {
        rt.skills[opt.id] = current + 1;
        if (opt.id === 'orbital') rt.syncOrbitalsCount();
        if (HAND_WEAPONS.includes(opt.id)) rt.currentHandWeapon = opt.id;
        rt.prewarmLoadoutSheets();
        rt.syncPlayerVisualLoadout(rt.currentHandWeapon);
      }
    } else if (opt.category === 'passive') {
      const current = rt.passives[opt.id] || 0;
      if (current < rt.CONFIG.LIMITS.MAX_LEVEL) {
        rt.passives[opt.id] = current + 1;
        if (opt.id === 'maxHp') {
          const bonus = rt.CONFIG.PASSIVES.maxHp.perLevel;
          rt.stats.maxHp += bonus;
          rt.stats.hp = Math.min(rt.stats.maxHp, rt.stats.hp + bonus);
        }
        if (opt.id === 'multishot') rt.syncOrbitalsCount();
      }
    } else if (opt.category === 'fallback') {
      if (opt.id === 'heal_pack') rt.stats.hp = Math.min(rt.stats.maxHp, rt.stats.hp + 75);
      if (opt.id === 'teeth_bag') rt.runSouls += 15;
    }
    rt.refreshHUD(true);
  }

  function showLevelUp() {
    rt.state = 'LEVEL_UP';
    if (document.pointerLockElement) document.exitPointerLock();
    rt.renderLevelUpCardsUI(rt.skills, rt.passives, rt.rerollsLeft, rt.maxRerollsRun, (_card, opt) => {
      applyUpgradeOption(opt);
      document.getElementById('level-up-screen').classList.add('hidden');
      rt.AudioSys.setMenuFilter?.(false);
      rt.state = 'PLAYING';
      document.body.requestPointerLock();
    });
    document.getElementById('level-up-screen').classList.remove('hidden');
    rt.AudioSys.setMenuFilter?.(true);
    document.querySelector('#upgrade-container .upg-card')?.focus();
  }

  document.getElementById('btn-reroll').onclick = () => {
    if (rt.rerollsLeft <= 0) { rt.AudioSys.playUIError(); return; }
    rt.rerollsLeft--;
    rt.AudioSys.playReroll();
    showLevelUp();
    rt.refreshHUD();
  };

  return { applyUpgradeOption, showLevelUp };
}
