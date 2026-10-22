// Daño y muerte en runtime: enemigos, jugador y sus efectos.
// Exports: createCombatRuntime.

import * as THREE from 'three';
import { SHARED_GEO, SHARED_MAT } from '../combat.js';

export function createCombatRuntime(rt) {
  function spawnHitFeedback(en, damage, isCrit) {
    const scene = rt.scene;
    const vfx = rt.vfx;
    if (!scene || !vfx || !en?.group) return;
    const now = performance.now();
    if (en._lastHitFeedbackAt && now - en._lastHitFeedbackAt < 60) return;
    en._lastHitFeedbackAt = now;
    const base = en.group.position;
    const count = isCrit ? 4 : 2;
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(SHARED_GEO.spark, SHARED_MAT.sparkBlood);
      mesh.position.copy(base).add(new THREE.Vector3(0, 1.05, 0));
      scene.add(mesh);
      vfx.push({
        mesh,
        life: 0.24,
        maxLife: 0.24,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 6,
          2.2 + Math.random() * 3,
          (Math.random() - 0.5) * 6
        ),
        gravity: 16,
        floorY: base.y + 0.05
      });
    }
    rt.hudController?.showDamageNumber?.(rt.camera, base.clone().add(new THREE.Vector3(0, 1.55, 0)), damage, isCrit);
  }

  function damageEnemy(en, amount, knockback, isDoT = false, opts = {}) {
    if (!en.active || en.state === 'dead') return;
    const mods = rt.getMods();
    const isReplicaClient = !!(rt.net?.isMatchActive && !rt.net.isHost() && en.isNetworkReplica);
    const isCrit = opts.isCrit !== undefined
      ? !!opts.isCrit
      : (!isDoT && Math.random() < mods.critChance);

    // La transición de fase protege al jefe desde el mismo frame en que cruza el 50%.
    if (!isReplicaClient && en.isBoss && en.bossAI?.isInvulnerable) {
      rt.AudioSys.play?.(165, 0.06, 'square', 0.028);
      return;
    }

    let appliedDmg = amount;
    if (!opts.finalDamage) {
      // En modo defensa, los enemigos de ruta tienen blindaje frente a armas
      // ligeras del jugador. Los enemigos de evento reciben daño completo.
      if (!isDoT && en.defenseAI && en.defenseAI.enabled && !en.isEventEnemy) {
        appliedDmg *= 0.45;
      }
      if (isCrit) appliedDmg *= 2.0;
    }

    const kb = knockback
      ? (knockback.clone ? knockback.clone() : knockback)
      : null;

    // Cliente: daño visual inmediato y envío al Host. El HP local nunca baja
    // de 1 ni dispara muertes/recompensas; la autoridad real es del Host.
    if (isReplicaClient) {
      en.hp = Math.max(1, en.hp - appliedDmg);
      if (en.isBoss) en.bossAI?.flashHit?.();
      if (!isDoT) {
        en.state = 'hurt';
        en.stateTimer = 0.15;
        rt.AudioSys.playHit?.(isCrit);
        if (isCrit || appliedDmg >= 35) rt.addCamShake?.(isCrit ? 0.28 : 0.12);
        spawnHitFeedback(en, appliedDmg, isCrit);
      }
      if (kb && !en.isBoss) {
        if (mods.knockbackMult && mods.knockbackMult !== 1.0) kb.multiplyScalar(mods.knockbackMult);
        en.group.position.add(kb);
        rt.worldPhysics.resolveCollision(en.group.position, 0.55, en.group.position.y);
      }
      if (en.isBoss) rt.hudController.updateBossHUD(rt.activeBoss, !isDoT);
      if (!opts.visualOnly && Number.isFinite(en.netId)) {
        rt.net.queuePlayerHit(en.netId, appliedDmg, isCrit, kb, {
          dot: isDoT,
          burnDps: opts.burnDps,
          burnDuration: opts.burnDuration
        });
      }
      return;
    }

    en.hp -= appliedDmg;
    if (en.isBoss) en.bossAI?.onDamaged?.(appliedDmg);

    if (!isDoT) {
      en.state = 'hurt';
      en.stateTimer = 0.15;
      if (opts.fromRemote) {
        rt.AudioSys.playHit?.(isCrit, { remote: true });
        spawnHitFeedback(en, appliedDmg, isCrit);
      } else {
        rt.AudioSys.playHit?.(isCrit);
        if (isCrit || appliedDmg >= 35) {
          rt.triggerHitstop?.(isCrit ? 0.08 : 0.04);
          rt.addCamShake?.(isCrit ? 0.28 : 0.12);
        }
      }
    }
    if (kb && !en.isBoss) {
      // El Cliente ya aplicó su multiplicador antes de enviar PLAYER_HIT.
      if (!opts.fromRemote && mods.knockbackMult && mods.knockbackMult !== 1.0) {
        kb.multiplyScalar(mods.knockbackMult);
      }
      en.group.position.add(kb);
      rt.worldPhysics.resolveCollision(en.group.position, 0.55, en.group.position.y);
    }
    if (opts.burnDps && opts.burnDuration) {
      en.applyBurn(opts.burnDps, opts.burnDuration);
    }
    if (en.isBoss) rt.hudController.updateBossHUD(rt.activeBoss, !isDoT);

    if (en.hp <= 0) {
      en.hp = 0;
      en.bossAI?.markDead?.();
      en.state = 'dead';
      en.stateTimer = 0;
      rt.kills++;
      if (en.isBoss) {
        rt.activeBoss = null;
        rt.hudController.hideBossHUDDelayed();
        rt.AudioSys.playBossHorn();
        rt.AudioSys.setBossMusic?.(false);
      } else {
        rt.AudioSys.playEnemyDeath?.();
      }
      rt.ModeManager.onEnemyKilled(en, rt.buildModeContext());
      // El Host declara la muerte después de generar los drops, para incluir
      // en ENEMY_DIE el tipo/pickupNetId del botín principal.
      rt.net?.sendEnemyDie?.(en);
      rt.refreshHUD();
    }
  }

  function dealDamageToPlayer(dmgAmount) {
    // En co-op el mundo sigue vivo mientras el jugador está en un menú local.
    const simActive = rt.state === 'PLAYING' || rt.isOnlineSimulationActive?.();
    if (rt.isPlayerDead?.() || rt.invuln > 0 || !simActive || rt.stats.hp <= 0) return;
    const mods = rt.getMods();
    let netDmg = dmgAmount;
    if (mods.damageReduction > 0) {
      netDmg *= Math.max(0.2, 1 - mods.damageReduction);
    }
    rt.stats.hp = Math.max(0, rt.stats.hp - netDmg);
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
      rt.stats.hp = 0;
      // El estado estricto se activa antes de consultar la política del modo, de
      // modo que buildModeContext() ya expone playerAlive=false.
      rt.onPlayerDeath?.();
      rt.ModeManager.onPlayerLethalDamage(rt.buildModeContext());
    }
  }

  return { damageEnemy, dealDamageToPlayer };
}
