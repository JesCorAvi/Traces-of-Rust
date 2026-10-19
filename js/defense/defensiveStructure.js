import * as THREE from 'three';
import { GameEvents } from '../core/eventBus.js';

// ============================================================================
// CLASE BASE ABSTRACTA PARA ESTRUCTURAS DEFENSIVAS (El Núcleo y futuras Torres)
// ============================================================================

let nextStructureUid = 1;

export class DefensiveStructure {
  /**
   * @param {THREE.Scene} scene
   * @param {Object} worldPhysics
   * @param {Object} opts
   */
  constructor(scene, worldPhysics, opts = {}) {
    this.uid = `struct_${nextStructureUid++}`;
    this.id = opts.id || this.uid;
    this.name = opts.name || 'ESTRUCTURA DEFENSIVA';
    this.structureType = opts.structureType || 'generic'; // 'core' | 'tower' (futuro)
    this.scene = scene;
    this.worldPhysics = worldPhysics;

    this.maxHp = opts.maxHp || 500;
    this.hp = this.maxHp;
    this.collisionRadius = opts.collisionRadius || 1.5;
    this.attackStopDistance = opts.attackStopDistance || (this.collisionRadius + 0.85);
    this.height = opts.height || 3.5;
    this.targetPriority = opts.targetPriority ?? 2;
    this.active = true;
    this.destroyed = false;

    this.group = new THREE.Group();
    const pos = opts.position || { x: 0, y: 0, z: 0 };
    const groundY = worldPhysics
      ? worldPhysics.getGroundHeight(pos.x, pos.z, pos.y || 0)
      : (pos.y || 0);
    this.group.position.set(pos.x, groundY, pos.z);
    this.scene.add(this.group);

    // Registro de colisión sólida e impenetrable (ni el jugador ni los enemigos pueden empujarla ni atravesarla)
    if (this.worldPhysics && typeof this.worldPhysics.registerDynamicCylinder === 'function') {
      this.worldPhysics.registerDynamicCylinder(
        this.uid,
        this.group.position.x,
        this.group.position.z,
        this.collisionRadius,
        groundY + this.height
      );
    }
  }

  get position() {
    return this.group.position;
  }

  getHpRatio() {
    return Math.max(0, Math.min(1, this.hp / Math.max(1, this.maxHp)));
  }

  /**
   * Aplica daño proveniente exclusivamente de entidades hostiles (nunca del jugador).
   */
  takeDamage(amount, attacker = null) {
    if (!this.active || this.destroyed || amount <= 0) return 0;

    const finalDmg = Math.max(1, Math.round(amount));
    this.hp = Math.max(0, this.hp - finalDmg);

    this.onDamaged(finalDmg, attacker);

    GameEvents.emit('structure:damaged', {
      structure: this,
      amount: finalDmg,
      hp: this.hp,
      maxHp: this.maxHp,
      attacker
    });

    if (this.hp <= 0 && !this.destroyed) {
      this.destroyed = true;
      this.onDestroyed(attacker);
      GameEvents.emit('structure:destroyed', {
        structure: this,
        attacker
      });
    }

    return finalDmg;
  }

  heal(amount) {
    if (!this.active || this.destroyed || amount <= 0) return;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    this.onHealed(amount);
  }

  // Hooks para subclases (como CoreMachine o futuras torres)
  onDamaged(_amount, _attacker) {}
  onHealed(_amount) {}
  onDestroyed(_attacker) {}
  update(_dt, _camPos) {}

  /**
   * Limpia mallas, luces, materiales y colisionadores al salir o reiniciar partida.
   */
  destroy() {
    this.active = false;
    if (this.worldPhysics && typeof this.worldPhysics.unregisterDynamicCylinder === 'function') {
      this.worldPhysics.unregisterDynamicCylinder(this.uid);
    }
    if (this.group) {
      this.scene.remove(this.group);
      this.group.traverse(child => {
        if (child.geometry && !child.userData.sharedGeo) {
          child.geometry.dispose();
        }
        if (child.material && !child.userData.sharedMat) {
          if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
          else child.material.dispose();
        }
      });
    }
  }
}