// Daño y muerte en runtime: enemigos, jugador y sus efectos.
// Exports: createCombatRuntime.

export function createCombatRuntime(rt) {
  function damageEnemy(en, amount, knockback, isDoT = false) {
    if (!en.active || en.state === 'dead') return;
    const mods = rt.getMods();
    const isCrit = !isDoT && Math.random() < mods.critChance;
    let appliedDmg = amount;
    // En modo defensa, los enemigos de ruta tienen blindaje frente a armas ligeras del jugador (estilo Orcs Must Die / Dungeon Defenders)
    // Los enemigos de eventos especiales (en.isEventEnemy) reciben daño completo del jugador (100%) para poder resolverlos a solas.
    if (!isDoT && en.defenseAI && en.defenseAI.enabled && !en.isEventEnemy) {
      appliedDmg *= 0.45;
    }
    en.hp -= isCrit ? appliedDmg * 2.0 : appliedDmg;

    if (!isDoT) {
      en.state = 'hurt';
      en.stateTimer = 0.15;
      rt.AudioSys.play(isCrit ? 290 : 145, 0.05, 'square', 0.035);
      if (isCrit || appliedDmg >= 35) {
        rt.triggerHitstop?.(isCrit ? 0.08 : 0.04);
        rt.addCamShake?.(isCrit ? 0.28 : 0.12);
      }
    }
    if (knockback && !en.isBoss) {
      const kb = knockback.clone ? knockback.clone() : knockback;
      if (mods.knockbackMult && mods.knockbackMult !== 1.0) {
        kb.multiplyScalar(mods.knockbackMult);
      }
      en.group.position.add(kb);
      rt.worldPhysics.resolveCollision(en.group.position, 0.55, en.group.position.y);
    }
    if (en.isBoss) rt.hudController.updateBossHUD(rt.activeBoss, !isDoT);

    if (en.hp <= 0) {
      en.hp = 0;
      en.state = 'dead';
      en.stateTimer = 0;
      rt.kills++;
      if (en.isBoss) {
        rt.activeBoss = null;
        rt.hudController.hideBossHUDDelayed();
        rt.AudioSys.playBossHorn();
      }
      rt.ModeManager.onEnemyKilled(en, rt.buildModeContext());
      rt.refreshHUD();
    }
  }

  function dealDamageToPlayer(dmgAmount) {
    if (rt.invuln > 0 || rt.state !== 'PLAYING') return;
    const mods = rt.getMods();
    let netDmg = dmgAmount;
    if (mods.damageReduction > 0) {
      netDmg *= Math.max(0.2, 1 - mods.damageReduction);
    }
    rt.stats.hp -= netDmg;
    rt.invuln = 0.72;
    rt.triggerScare(0.48);
    rt.triggerPlayerHurtJuice?.(netDmg);

    const hpFrame = document.querySelector('.biometrics-plate-compact');
    if (hpFrame) {
      hpFrame.classList.add('bar-shake');
      setTimeout(() => hpFrame.classList.remove('bar-shake'), 320);
    }
    document.getElementById('damage-flash').style.opacity = 1;
    setTimeout(() => (document.getElementById('damage-flash').style.opacity = 0), 150);
    rt.refreshHUD();

    if (rt.stats.hp <= 0) {
      rt.ModeManager.onPlayerLethalDamage(rt.buildModeContext());
    }
  }

  return { damageEnemy, dealDamageToPlayer };
}
