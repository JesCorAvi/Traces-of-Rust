// Reactor central: modelo industrial, estados de daño, luces y eventos del núcleo.
// Exports: CoreMachine.
import * as THREE from 'three';
import { CORE_DEFENSE_CONFIG } from '../config/coreDefenseConfig.js';
import { SpriteSheets } from '../spritesheets.js';
import { AudioSys } from '../audio.js';
import { SHARED_GEO, SHARED_MAT, triggerCombatFlash } from '../combat.js';
import { GameEvents } from '../core/eventBus.js';
import { DefensiveStructure } from './defensiveStructure.js';

// ============================================================================
// EL NÚCLEO: REACTOR BIOMECÁNICO INDUSTRIAL (Solo en Modo Defensa del Núcleo)
// ============================================================================

export class CoreMachine extends DefensiveStructure {
  constructor(scene, worldPhysics, vfxList) {
    const cfg = CORE_DEFENSE_CONFIG.CORE;
    super(scene, worldPhysics, {
      id: cfg.id,
      name: cfg.name,
      structureType: 'core',
      position: cfg.position,
      maxHp: cfg.maxHp,
      collisionRadius: cfg.collisionRadius,
      attackStopDistance: cfg.attackStopDistance,
      height: cfg.height,
      targetPriority: CORE_DEFENSE_CONFIG.TARGETING.PRIORITIES.CORE
    });

    this.cfg = cfg;
    this.vfx = vfxList;
    this.pulseTimer = 0;
    this.hitFlashTimer = 0;
    this.shakeTimer = 0;
    this.smokeTimer = 0;
    this.sparkTimer = 0;
    this.lastAlertTime = -99;
    this.elapsed = 0;
    this.currentDamageState = cfg.DAMAGE_STATES[0];

    this.buildIndustrialMesh();
  }

  buildIndustrialMesh() {
    const metalTex = SpriteSheets.env.metal.tex;
    const crateTex = SpriteSheets.env.crate.tex;

    this.VisualRoot = new THREE.Group();
    this.group.add(this.VisualRoot);

    this.armorMat = new THREE.MeshStandardMaterial({
      map: metalTex,
      roughness: 0.8,
      metalness: 0.5,
      color: 0x6e6552
    });

    this.rustMat = new THREE.MeshStandardMaterial({
      map: crateTex,
      roughness: 0.88,
      metalness: 0.3,
      color: 0x5c2e1e
    });

    this.glassCageMat = new THREE.MeshStandardMaterial({
      color: 0x162216,
      roughness: 0.3,
      metalness: 0.2,
      transparent: true,
      opacity: 0.52
    });

    this.heartMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      emissive: 0xd4af37,
      emissiveIntensity: 1.6,
      roughness: 0.35,
      flatShading: true
    });

    this.crackMat = new THREE.MeshBasicMaterial({
      color: 0xff3311,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide
    });

    // 1. Pedestal octogonal pesado de fundición
    const basePlinth = new THREE.Mesh(
      new THREE.CylinderGeometry(2.25, 2.5, 1.15, 8),
      this.armorMat
    );
    basePlinth.position.y = 0.575;
    basePlinth.castShadow = true;
    basePlinth.receiveShadow = true;
    this.VisualRoot.add(basePlinth);

    // 2. Cámara de contención transparente y corazón biomecánico latente
    const glassCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(1.32, 1.32, 2.7, 8),
      this.glassCageMat
    );
    glassCylinder.position.y = 2.5;
    this.VisualRoot.add(glassCylinder);

    this.heartMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.88, 1),
      this.heartMat
    );
    this.heartMesh.position.y = 2.55;
    this.VisualRoot.add(this.heartMesh);

    // 3. Dos anillos giroscópicos oxidados que rodean el corazón
    this.innerRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.12, 0.09, 6, 12),
      this.rustMat
    );
    this.innerRing.position.y = 2.55;
    this.VisualRoot.add(this.innerRing);

    // 4. Cuatro columnas/tuberías verticales de enfriamiento y grietas de sobrecarga
    this.crackMeshes = [];
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
      const px = Math.cos(ang) * 1.68;
      const pz = Math.sin(ang) * 1.68;

      const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.28, 4.2, 6),
        this.rustMat
      );
      pipe.position.set(px, 2.6, pz);
      pipe.castShadow = true;
      this.VisualRoot.add(pipe);

      // Grietas luminosas visibles cuando el núcleo pierde vida
      const crackPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.55, 2.2),
        this.crackMat
      );
      crackPlane.position.set(Math.cos(ang) * 1.38, 2.5, Math.sin(ang) * 1.38);
      crackPlane.rotation.y = -ang + Math.PI / 2;
      this.VisualRoot.add(crackPlane);
      this.crackMeshes.push(crackPlane);
    }

    // 5. Cúpula superior con chimeneas de escape
    const topCap = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 2.0, 0.9, 8),
      this.armorMat
    );
    topCap.position.y = 4.3;
    topCap.castShadow = true;
    this.VisualRoot.add(topCap);

    const chimneyPositions = [
      [-0.75, 5.2, -0.75],
      [0.75, 5.4, 0.75],
      [-0.75, 5.0, 0.75]
    ];
    chimneyPositions.forEach(([cx, cy, cz]) => {
      const stack = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.28, 1.5, 6),
        this.rustMat
      );
      stack.position.set(cx, cy, cz);
      this.VisualRoot.add(stack);
    });

    // 6. Sirena rotatoria y balizas de aviso en la cúspide (visibles desde lejos)
    this.sirenSpinner = new THREE.Group();
    this.sirenSpinner.position.set(0, 5.85, 0);
    this.VisualRoot.add(this.sirenSpinner);

    this.beaconMat = new THREE.MeshBasicMaterial({ color: 0xb89c46 });
    const beaconLeft = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.36, 0.36), this.beaconMat);
    beaconLeft.position.x = -0.35;
    const beaconRight = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.36, 0.36), this.beaconMat);
    beaconRight.position.x = 0.35;
    this.sirenSpinner.add(beaconLeft, beaconRight);

    // 7. Iluminación propia del reactor
    this.coreLight = new THREE.PointLight(0xd4af37, 68, 22, 1.4);
    this.coreLight.position.set(0, 3.0, 0);
    this.group.add(this.coreLight);

    this.beaconLight = new THREE.PointLight(0xb89c46, 35, 32, 1.2);
    this.beaconLight.position.set(0, 6.2, 0);
    this.group.add(this.beaconLight);
  }

  resolveDamageState() {
    const ratio = this.getHpRatio();
    const states = this.cfg.DAMAGE_STATES;
    for (let i = 0; i < states.length; i++) {
      if (ratio >= states[i].minPct) return states[i];
    }
    return states[states.length - 1];
  }

  onDamaged(amount, attacker) {
    this.hitFlashTimer = 0.16;
    this.shakeTimer = 0.28;

    // Sonido metálico pesado de impacto contra la carcasa del reactor
    AudioSys.playCoreHit();

    triggerCombatFlash(
      this.group.position.clone().add(new THREE.Vector3(0, 2.5, 0)),
      0xff3311,
      125,
      0.11
    );

    // Chispas y esquirlas al recibir el golpe
    if (this.vfx) {
      for (let i = 0; i < 6; i++) {
        const spark = new THREE.Mesh(
          SHARED_GEO.spark,
          i % 2 === 0 ? SHARED_MAT.sparkGold : SHARED_MAT.sparkBlood
        );
        spark.position.copy(this.group.position).add(new THREE.Vector3(
          (Math.random() - 0.5) * 2.4,
          1.4 + Math.random() * 2.2,
          (Math.random() - 0.5) * 2.4
        ));
        this.scene.add(spark);
        this.vfx.push({
          mesh: spark,
          life: 0.36,
          vel: new THREE.Vector3(
            (Math.random() - 0.5) * 8,
            3.5 + Math.random() * 4,
            (Math.random() - 0.5) * 8
          ),
          gravity: 16,
          floorY: this.group.position.y + 0.05
        });
      }
    }

    const prevState = this.currentDamageState;
    this.currentDamageState = this.resolveDamageState();

    GameEvents.emit('core:damaged', {
      core: this,
      amount,
      hp: this.hp,
      currentHp: this.hp,
      maxHp: this.maxHp,
      ratio: this.getHpRatio(),
      state: this.currentDamageState,
      attacker
    });

    if (prevState.id !== this.currentDamageState.id) {
      AudioSys.playCoreLeak();
      GameEvents.emit('core:state_changed', {
        core: this,
        state: this.currentDamageState
      });
    }

    if (this.elapsed - this.lastAlertTime >= this.cfg.underAttackAlertCooldown) {
      this.lastAlertTime = this.elapsed;
      GameEvents.emit('core:alert_under_attack', {
        core: this,
        hp: this.hp,
        maxHp: this.maxHp,
        state: this.currentDamageState
      });
    }
  }

  onDestroyed(attacker) {
    // Gran explosión industrial de colapso del reactor
    AudioSys.playBossHorn();
    AudioSys.playCoreDestroyed();

    if (this.vfx) {
      for (let i = 0; i < 28; i++) {
        const debris = new THREE.Mesh(
          SHARED_GEO.spark,
          i % 3 === 0 ? SHARED_MAT.sparkGold : SHARED_MAT.sparkBlood
        );
        debris.scale.setScalar(1.8);
        debris.position.copy(this.group.position).add(new THREE.Vector3(0, 2.4, 0));
        this.scene.add(debris);
        this.vfx.push({
          mesh: debris,
          life: 0.95,
          vel: new THREE.Vector3(
            (Math.random() - 0.5) * 16,
            5 + Math.random() * 9,
            (Math.random() - 0.5) * 16
          ),
          gravity: 14,
          floorY: 0.05
        });
      }
    }

    GameEvents.emit('core:destroyed', {
      core: this,
      attacker
    });
  }

  update(dt) {
    if (!this.active) return;
    this.elapsed += dt;

    const st = this.resolveDamageState();
    this.currentDamageState = st;
    const hpRatio = this.getHpRatio();

    // 1. Latido inquietante del corazón biomecánico y giroscopio
    this.pulseTimer += dt * st.pulseSpeed;
    const beat = 1.0 + Math.pow(Math.max(0, Math.sin(this.pulseTimer * Math.PI)), 4) * 0.26;
    this.heartMesh.scale.setScalar(beat);
    this.heartMesh.rotation.y += dt * 0.9;
    this.heartMesh.rotation.z += dt * 0.5;

    this.innerRing.rotation.x += dt * (1.2 + (1 - hpRatio) * 3.5);
    this.innerRing.rotation.y -= dt * 1.5;

    // 2. Sirena superior giratoria y parpadeo según nivel de daño
    this.sirenSpinner.rotation.y += dt * st.sirenSpinSpeed;
    const sirenFlash = Math.sin(this.elapsed * st.sirenSpinSpeed * 2.5) > 0;
    this.beaconLight.color.setHex(st.beaconColor);
    this.beaconLight.intensity = sirenFlash ? 58 : 10;
    this.beaconMat.color.setHex(sirenFlash ? 0xfff6e0 : st.beaconColor);

    // 3. Color del corazón, grietas luminosas y flash de impacto
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
      this.heartMat.color.setHex(0xffffff);
      this.heartMat.emissive.setHex(0xff2222);
      this.armorMat.emissive.setHex(0x551111);
      this.coreLight.color.setHex(0xff2222);
      this.coreLight.intensity = 135;
    } else {
      this.heartMat.color.setHex(st.heartColor);
      this.heartMat.emissive.setHex(st.heartColor);
      this.armorMat.emissive.setHex(0x000000);
      this.coreLight.color.setHex(st.heartColor);
      this.coreLight.intensity = 52 + (beat - 1.0) * 140;
    }

    // Visibilidad de grietas en la carcasa según el daño sufrido
    const damageFactor = 1.0 - hpRatio;
    this.crackMat.opacity = damageFactor > 0.2
      ? Math.min(0.95, damageFactor * (0.7 + Math.abs(Math.sin(this.elapsed * 9)) * 0.35))
      : 0;

    // 4. Vibración física del reactor al ser golpeado o estar en estado crítico
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const amp = 0.14;
      this.VisualRoot.position.set(
        (Math.random() - 0.5) * amp,
        0,
        (Math.random() - 0.5) * amp
      );
    } else if (hpRatio < 0.35) {
      this.VisualRoot.position.set(
        (Math.random() - 0.5) * 0.04,
        0,
        (Math.random() - 0.5) * 0.04
      );
    } else {
      this.VisualRoot.position.set(0, 0, 0);
    }

    // 5. Columnas de humo y chispas automáticas proporcionales al deterioro
    if (this.vfx) {
      this.smokeTimer -= dt;
      if (this.smokeTimer <= 0) {
        this.smokeTimer = st.smokeRate;
        const smoke = new THREE.Mesh(
          SHARED_GEO.spark,
          new THREE.MeshBasicMaterial({
            color: hpRatio < 0.45 ? 0x261212 : 0x364035,
            transparent: true,
            opacity: 0.65
          })
        );
        smoke.scale.setScalar(1.6);
        smoke.position.copy(this.group.position).add(new THREE.Vector3(
          (Math.random() - 0.5) * 1.5,
          5.3,
          (Math.random() - 0.5) * 1.5
        ));
        this.scene.add(smoke);
        this.vfx.push({
          mesh: smoke,
          disposeMat: true,
          life: 0.9,
          maxLife: 0.9,
          fade: true,
          scaleSpeed: 2.2,
          vel: new THREE.Vector3((Math.random() - 0.5) * 0.8, 2.4 + Math.random(), (Math.random() - 0.5) * 0.8)
        });
      }

      if (hpRatio < 0.85) {
        this.sparkTimer -= dt;
        if (this.sparkTimer <= 0) {
          this.sparkTimer = st.sparkRate;
          const sp = new THREE.Mesh(SHARED_GEO.spark, SHARED_MAT.sparkGold);
          sp.position.copy(this.group.position).add(new THREE.Vector3(
            (Math.random() - 0.5) * 2.2,
            1.8 + Math.random() * 2.2,
            (Math.random() - 0.5) * 2.2
          ));
          this.scene.add(sp);
          this.vfx.push({
            mesh: sp,
            life: 0.28,
            vel: new THREE.Vector3((Math.random() - 0.5) * 6, 2.5 + Math.random() * 3, (Math.random() - 0.5) * 6),
            gravity: 16,
            floorY: 0.05
          });
        }
      }
    }
  }
}