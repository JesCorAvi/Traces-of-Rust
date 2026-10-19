// Tropa aliada del Cuartel (guardia/élite/dron) con HP, targeting y ataque.
// Exports: AllyUnit.
import * as THREE from 'three';
import { createBillboardSprite } from '../entities.js';
import { AudioSys } from '../audio.js';

// ============================================================================
// TROPAS ALIADAS DEL CUARTEL
// Contrato mínimo que entiende la IA enemiga: active, destroyed, position,
// attackStopDistance y takeDamage. No registran colisión estática porque se mueven.
// ============================================================================

const ALLY_SIZES = {
  guard: 1.2,
  elite: 1.35,
  drone: 1.1
};

export class AllyUnit {
  constructor(scene, type, position, owner, stats) {
    this.scene = scene;
    this.type = type;
    this.owner = owner;
    this.rallyPos = position.clone();
    this.active = true;
    this.destroyed = false;
    this.attackStopDistance = 1.2;

    this.maxHp = Math.max(1, Math.round(stats.allyHp));
    this.hp = this.maxHp;
    this.damage = Math.max(1, stats.allyDamage);
    this.speed = stats.allySpeed;
    this.range = stats.allyRange;
    this.attackInterval = stats.allyAttackInterval || 0.9;
    this.armor = stats.allyArmor || 0;
    this.aoe = !!stats.allyAoe;
    this.ranged = !!stats.allyRanged || type === 'drone';
    this.leashRadius = Math.max(10, stats.allyRange + 3);
    this.damageReduction = 0;
    this.shieldHp = 0;

    const size = ALLY_SIZES[type] || ALLY_SIZES.guard;
    this.billboard = createBillboardSprite(`ally_${type}`, size);
    // La sombra usa geometría/material compartidos globalmente: no deben liberarse aquí
    this.billboard.shadowDisc.userData.sharedGeo = true;
    this.billboard.shadowDisc.userData.sharedMat = true;
    this.group = this.billboard.group;
    this.group.position.copy(position);
    this.scene.add(this.group);

    this.facingYaw = 0;
    this.stateIdx = 0;
    this.animTimer = Math.random();
    this.attackTimer = 0;
    this.hitFlashTimer = 0;

    this.buildHealthBar(size);
  }

  get position() {
    return this.group.position;
  }

  buildHealthBar(size) {
    this.hpBarGroup = new THREE.Group();
    this.hpBarGroup.position.y = size + 0.35;

    const bgMat = new THREE.MeshBasicMaterial({
      color: 0x050605, transparent: true, opacity: 0.85, depthTest: false
    });
    const fillMat = new THREE.MeshBasicMaterial({
      color: 0x9caf6b, transparent: true, opacity: 0.95, depthTest: false
    });

    const bg = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.065), bgMat);
    bg.renderOrder = 20;
    const fill = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.045), fillMat);
    fill.position.z = 0.002;
    fill.renderOrder = 21;

    this.hpBarFill = fill;
    this.hpBarBg = bg;
    this.hpBarGroup.add(bg, fill);
    this.hpBarGroup.visible = false;
    this.group.add(this.hpBarGroup);
  }

  takeDamage(amount, attacker = null) {
    if (!this.active || this.destroyed || amount <= 0) return 0;

    let incoming = amount;
    if (this.shieldHp > 0) {
      const absorbed = Math.min(this.shieldHp, incoming);
      this.shieldHp -= absorbed;
      incoming -= absorbed;
      if (incoming <= 0) return absorbed;
    }
    incoming *= Math.max(0, 1 - this.damageReduction);
    const finalDmg = Math.max(1, Math.round(incoming));
    this.hp -= finalDmg;
    this.hitFlashTimer = 0.15;

    if (this.hp <= 0) {
      this.hp = 0;
      this.destroyed = true;
      this.active = false;
      this.group.visible = false;
      if (this.owner && this.owner.system) {
        this.owner.system.handleAllyDestroyed(this);
      }
    }
    return finalDmg;
  }

  heal(amount) {
    if (!this.active || this.destroyed || amount <= 0) return;
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  applyShield(amount) {
    this.shieldHp = Math.max(this.shieldHp, amount);
  }

  findTarget(enemies) {
    let best = null;
    let bestDist = Infinity;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.active || e.state === 'dead') continue;
      const distRally = Math.hypot(
        e.group.position.x - this.rallyPos.x,
        e.group.position.z - this.rallyPos.z
      );
      if (distRally > this.leashRadius) continue;
      const dist = Math.hypot(
        e.group.position.x - this.group.position.x,
        e.group.position.z - this.group.position.z
      );
      if (dist < bestDist) {
        best = e;
        bestDist = dist;
      }
    }
    return best;
  }

  update(dt, enemies, worldPhysics, cameraPos, system) {
    if (this.destroyed) return false;

    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;
    const target = this.findTarget(enemies);

    let moveDir = null;
    let desiredState = 0;
    let inAttackRange = false;

    if (target) {
      const dx = target.group.position.x - this.group.position.x;
      const dz = target.group.position.z - this.group.position.z;
      const dist = Math.hypot(dx, dz);
      const stopRange = this.ranged ? Math.min(this.range, 7.0) : 1.25;
      this.facingYaw = Math.atan2(-dx, -dz);

      if (dist > stopRange) {
        moveDir = new THREE.Vector3(dx, 0, dz).normalize();
        desiredState = 1;
      } else {
        inAttackRange = true;
        desiredState = 2;
        this.attackTimer -= dt;
        if (this.attackTimer <= 0) {
          this.attackTimer = this.attackInterval;
          this.performAttack(target, system);
        }
      }
    } else {
      const dx = this.rallyPos.x - this.group.position.x;
      const dz = this.rallyPos.z - this.group.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 1.4) {
        moveDir = new THREE.Vector3(dx, 0, dz).normalize();
        this.facingYaw = Math.atan2(-moveDir.x, -moveDir.z);
        desiredState = 1;
      } else {
        desiredState = 0;
      }
    }

    if (moveDir) {
      const step = this.speed * dt;
      this.group.position.addScaledVector(moveDir, step);
      if (worldPhysics) {
        worldPhysics.resolveCollision(this.group.position, 0.35, this.group.position.y);
        const targetY = worldPhysics.getGroundHeight(
          this.group.position.x, this.group.position.z, this.group.position.y
        );
        this.group.position.y += (targetY - this.group.position.y) * 0.35;
      }
    } else if (worldPhysics) {
      const targetY = worldPhysics.getGroundHeight(
        this.group.position.x, this.group.position.z, this.group.position.y
      );
      this.group.position.y += (targetY - this.group.position.y) * 0.35;
    }

    this.stateIdx = desiredState;
    this.billboard.facingYaw = this.facingYaw;
    this.billboard.faceCamera(cameraPos);
    this.animTimer += dt * (desiredState === 2 ? 10 : 6);
    const frame = Math.floor(this.animTimer) % 4;
    this.billboard.setDirectionalFrame(this.billboard.dirRow, desiredState, frame);

    if (this.hitFlashTimer > 0) {
      this.billboard.mesh.material.emissive.setHex(0x6e1414);
    } else {
      this.billboard.mesh.material.emissive.setHex(0x000000);
    }

    this.updateHealthBar(cameraPos);
    return true;
  }

  performAttack(target, system) {
    if (!target || !target.active || target.state === 'dead') return;
    const pos = this.group.position.clone().add(new THREE.Vector3(0, 0.9, 0));

    if (this.ranged) {
      const end = target.group.position.clone().add(new THREE.Vector3(0, 1.0, 0));
      system.spawnTracer(pos, end, 0x6f8f9c, 0.08);
      system.damageEnemy(target, this.damage, this);
    } else {
      system.damageEnemy(target, this.damage, this);
      if (this.aoe) {
        system.damageArea(target.group.position, 1.7, this.damage * 0.6, this);
        system.spawnExplosion(target.group.position.clone().setY(target.group.position.y + 0.1), 1.7, 0x9caf6b);
      }
    }

    AudioSys.play(this.ranged ? 320 : 180, 0.05, 'square', 0.025);
  }

  updateHealthBar(cameraPos) {
    const ratio = Math.max(0, this.hp / this.maxHp);
    this.hpBarGroup.visible = ratio < 0.999;
    if (!this.hpBarGroup.visible) return;

    const angle = Math.atan2(
      cameraPos.x - this.group.position.x,
      cameraPos.z - this.group.position.z
    );
    this.hpBarGroup.rotation.y = angle;

    const width = 0.54 * ratio;
    this.hpBarFill.scale.x = Math.max(0.001, ratio);
    this.hpBarFill.position.x = -(0.54 - width) * 0.5;
  }

  destroy() {
    this.active = false;
    this.destroyed = true;
    if (this.group) {
      this.scene.remove(this.group);
      this.group.traverse(obj => {
        if (obj.userData.sharedGeo || obj.userData.sharedMat) return;
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
    }
  }
}
