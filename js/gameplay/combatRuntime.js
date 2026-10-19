// Daño y muerte en runtime: enemigos, jugador y sus efectos.
// Exports: createCombatRuntime.

export function createCombatRuntime(rt) {
  function damageEnemy(en, amount, knockback, isDoT = false) {
    if (!en.active || en.state === 'dead') return;
    const mods = rt.getMods();
    const isCrit = !isDoT && Math.random() < mods.critChance;
    en.hp -= isCrit ? amount * 2.0 : amount;

    if (!isDoT) {
      en.state = 'hurt';
      en.stateTimer = 0.15;
      rt.AudioSys.play(isCrit ? 290 : 145, 0.05, 'square', 0.035);
    }
    if (knockback && !en.isBoss) {
      en.group.position.add(knockback);
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
    rt.stats.hp -= dmgAmount;
    rt.invuln = 0.72;
    rt.triggerScare(0.48);

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
