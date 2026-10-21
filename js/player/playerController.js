// Actualización de armas, minas, orbitales, hazards y VFX del jugador.
// Exports: updatePlayerWeaponsAndCombat.
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { AudioSys } from '../audio.js';
import { setPlaneFrameUV } from '../entities.js';
import {
  SHARED_GEO,
  SHARED_MAT,
  executeSawSlash,
  fireBuckshot,
  fireFlamethrower,
  spawnShrapnelMine,
  fireHarpoon,
  fireDefibrillator
} from '../combat.js';

// ============================================================================
// CONTROLADOR COMPARTIDO DE ARMAMENTO, MINAS, ORBITALES, HAZARDS Y VFX
// Reutilizado idénticamente en Supervivencia y en Defensa del Núcleo
// ============================================================================

export function updatePlayerWeaponsAndCombat({
  dt,
  gameTime,
  scene,
  playerGroup,
  yaw,
  playerFacingYaw,
  camAngle,
  skills,
  mods,
  weaponTimers,
  auraMesh,
  orbitals,
  minesList,
  bossHazards,
  bossProjectiles,
  vfx,
  activeEnemies,
  worldPhysics,
  coreMachine,
  damageEnemy,
  dealDamageToPlayer,
  addCamShake,
  triggerWeaponVisualAttack,
  sendAutomaticAttack,
  cleanupVfxItem
}) {
  const cdFactor = 1 / mods.atkSpeedMult;

  // 1. Sierra de Amputación
  if (skills.slash) {
    weaponTimers.slash += dt;
    const cd = Math.max(0.26, (CONFIG.SKILLS.slash.baseCd - skills.slash * 0.06) * cdFactor);
    if (weaponTimers.slash >= cd) {
      weaponTimers.slash = 0;
      const slashYaw = executeSawSlash(
        scene, playerGroup.position, yaw, skills.slash, mods,
        activeEnemies, vfx, damageEnemy, s => addCamShake(s * mods.shakeMod),
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
        activeEnemies, vfx, damageEnemy, () => addCamShake(0.2 * mods.shakeMod)
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
      fireFlamethrower(
        scene, playerGroup.position, yaw, skills.flamethrower, mods,
        activeEnemies, vfx, damageEnemy, playerFacingYaw
      );
      triggerWeaponVisualAttack('flamethrower', yaw, 0.14, true);
    }
  }

  // 4. Incensario de Bilis (Aura)
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
          e.applySlow(Math.min(0.85, 0.6 + (mods.auraSlowBonus || 0)), 0.6);
          damageEnemy(e, dmg, null, true);
        }
      });
      sendAutomaticAttack?.('aura', playerGroup.position.clone());
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
      const harpoonYaw = fireHarpoon(
        scene, playerGroup.position, yaw, skills.harpoon, mods,
        activeEnemies, vfx, damageEnemy, playerFacingYaw
      );
      triggerWeaponVisualAttack('harpoon', harpoonYaw, 0.25);
    }
  }

  // 7. Desfibrilador Roto
  if (skills.bolt) {
    weaponTimers.bolt += dt;
    const cd = Math.max(0.5, (CONFIG.SKILLS.bolt.baseCd - skills.bolt * 0.12) * cdFactor);
    if (weaponTimers.bolt >= cd) {
      const boltYaw = fireDefibrillator(
        scene, playerGroup.position, playerFacingYaw, skills.bolt, mods,
        activeEnemies, vfx, damageEnemy
      );
      if (boltYaw !== null) {
        weaponTimers.bolt = 0;
        triggerWeaponVisualAttack('bolt', boltYaw, 0.24);
      }
    }
  }

  // 8. Jaulas de Carnicero Orbitales
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
        damageEnemy(e, CONFIG.SKILLS.orbital.baseDmg * mult * mods.dmgMult * (mods.orbitalDmgMult || 1.0) * dt, null, true);

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
          sendAutomaticAttack?.(
            'orbital',
            e.group.position.clone().add(new THREE.Vector3(0, 1.1, 0)),
            o.group.position.clone()
          );
        }
      }
    });
  });

  // 9. Detonación de Minas (Nunca dañan al jugador ni al Núcleo)
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
      const dmg = CONFIG.SKILLS.mines.baseDmg * (1 + (m.level - 1) * 0.28) * mods.dmgMult * (mods.explosiveDmgMult || 1.0);
      AudioSys.playMineExplode();
      addCamShake(0.22 * mods.shakeMod);

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
      sendAutomaticAttack?.('mine_blast', m.group.position.clone());
      scene.remove(m.group);
      minesList.splice(i, 1);
    }
  }

  // 10. Zonas telegrafiadas de Bosses (Pueden dañar al jugador y, en modo Defensa, también al Núcleo)
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
        addCamShake(0.25 * mods.shakeMod);
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
        if (coreMachine && coreMachine.active && !coreMachine.destroyed && coreMachine.position.distanceTo(h.center) <= h.radius + coreMachine.collisionRadius) {
          coreMachine.takeDamage(h.dmg * 0.75, h.boss || null);
        }
      } else if (h.type === 'cone') {
        AudioSys.play(82, 0.25, 'square', 0.1);
        addCamShake(0.25 * mods.shakeMod);
        const toP = new THREE.Vector3().subVectors(playerGroup.position, h.origin).setY(0);
        if (toP.length() <= h.radius && h.dir.angleTo(toP.clone().normalize()) <= h.arc) {
          dealDamageToPlayer(h.dmg);
        }
        if (coreMachine && coreMachine.active && !coreMachine.destroyed) {
          const toC = new THREE.Vector3().subVectors(coreMachine.position, h.origin).setY(0);
          if (toC.length() <= h.radius + coreMachine.collisionRadius && h.dir.angleTo(toC.clone().normalize()) <= h.arc) {
            coreMachine.takeDamage(h.dmg * 0.85, h.boss || null);
          }
        }
      }
      scene.remove(h.mesh);
      if (h.mesh.geometry) h.mesh.geometry.dispose();
      if (h.mesh.material) h.mesh.material.dispose();
      bossHazards.splice(i, 1);
    }
  }

  // 11. Proyectiles de Bosses
  for (let i = bossProjectiles.length - 1; i >= 0; i--) {
    const p = bossProjectiles[i];
    p.life -= dt;
    p.mesh.position.addScaledVector(p.vel, dt);
    p.mesh.rotation.x += 10 * dt;
    p.mesh.rotation.y += 12 * dt;

    if (p.mesh.position.distanceTo(playerGroup.position.clone().add(new THREE.Vector3(0, 1.0, 0))) < 0.95) {
      dealDamageToPlayer(p.dmg);
      p.life = 0;
    } else if (coreMachine && coreMachine.active && !coreMachine.destroyed) {
      const dCore = Math.hypot(p.mesh.position.x - coreMachine.position.x, p.mesh.position.z - coreMachine.position.z);
      if (dCore < coreMachine.collisionRadius + 0.35) {
        coreMachine.takeDamage(p.dmg * 0.65, null);
        p.life = 0;
      }
    }
    if (p.life <= 0) {
      scene.remove(p.mesh);
      if (p.mesh.material && !p.sharedMat) p.mesh.material.dispose();
      bossProjectiles.splice(i, 1);
    }
  }

  // 12. Partículas y VFX
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
}