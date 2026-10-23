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
    const woodTex = SpriteSheets.env.crate.tex;
    const plankTex = SpriteSheets.env.metal.tex;
    const thatchTex = SpriteSheets.env.thatch.tex;
    const fabricTex = SpriteSheets.env.fabric.tex;

    this.VisualRoot = new THREE.Group();
    this.group.add(this.VisualRoot);

    this.armorMat = new THREE.MeshStandardMaterial({
      map: plankTex,
      roughness: 0.9,
      metalness: 0.03,
      color: 0xd4a878
    });

    this.rustMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      roughness: 0.94,
      metalness: 0.02,
      color: 0xa9663d
    });

    this.coolerMat = new THREE.MeshStandardMaterial({
      map: woodTex,
      roughness: 0.88,
      metalness: 0.02,
      color: 0xf0d6ad
    });

    this.thatchMat = new THREE.MeshStandardMaterial({
      map: thatchTex,
      roughness: 0.98,
      side: THREE.DoubleSide,
      color: 0xf2d491
    });

    this.fabricMat = new THREE.MeshStandardMaterial({
      map: fabricTex,
      roughness: 0.9,
      side: THREE.DoubleSide
    });

    this.glassCageMat = new THREE.MeshStandardMaterial({
      color: 0xa9f0df,
      roughness: 0.18,
      metalness: 0.05,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.heartMat = new THREE.MeshStandardMaterial({
      color: 0xffd15a,
      emissive: 0xffc14d,
      emissiveIntensity: 1.3,
      roughness: 0.42,
      flatShading: true
    });

    this.leafMat = new THREE.MeshStandardMaterial({
      color: 0x4f9f5d,
      roughness: 0.75,
      flatShading: true
    });

    this.crackMat = new THREE.MeshBasicMaterial({
      color: 0xff6a52,
      transparent: true,
      opacity: 0.0,
      side: THREE.DoubleSide
    });

    // 1. Tarima circular de madera sobre la arena.
    const basePlinth = new THREE.Mesh(
      new THREE.CylinderGeometry(2.35, 2.65, 0.42, 10),
      this.armorMat
    );
    basePlinth.position.y = 0.21;
    basePlinth.castShadow = true;
    basePlinth.receiveShadow = true;
    this.VisualRoot.add(basePlinth);

    const deckRim = new THREE.Mesh(
      new THREE.TorusGeometry(2.4, 0.12, 6, 22),
      this.rustMat
    );
    deckRim.rotation.x = Math.PI / 2;
    deckRim.position.y = 0.42;
    this.VisualRoot.add(deckRim);

    // 2. Nevera-mostrador con cúpula de cristal.
    const counter = new THREE.Mesh(
      new THREE.BoxGeometry(3.1, 1.55, 2.25),
      this.coolerMat
    );
    counter.position.y = 1.2;
    counter.castShadow = true;
    counter.receiveShadow = true;
    this.VisualRoot.add(counter);

    const counterTop = new THREE.Mesh(
      new THREE.BoxGeometry(3.35, 0.22, 2.45),
      this.armorMat
    );
    counterTop.position.y = 2.05;
    counterTop.castShadow = true;
    this.VisualRoot.add(counterTop);

    // Franjas de tela del mostrador.
    for (const side of [-1, 1]) {
      const stripe = new THREE.Mesh(
        new THREE.PlaneGeometry(2.6, 1.25),
        this.fabricMat
      );
      stripe.position.set(0, 1.22, side * 1.14);
      stripe.rotation.y = side < 0 ? Math.PI : 0;
      this.VisualRoot.add(stripe);
    }

    // 3. Cúpula de cristal que conserva la comida fresca.
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(2.25, 2.1, 1.7),
      this.glassCageMat
    );
    glass.position.y = 3.2;
    this.VisualRoot.add(glass);

    const glassFrame = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.12, 1.85),
      this.rustMat
    );
    glassFrame.position.y = 4.28;
    this.VisualRoot.add(glassFrame);

    // 4. Piña luminosa: el corazón de la despensa.
    this.heartMesh = new THREE.Group();
    this.heartMesh.position.y = 3.15;
    this.VisualRoot.add(this.heartMesh);

    const pineappleBody = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.72, 1),
      this.heartMat
    );
    pineappleBody.scale.set(0.9, 1.35, 0.9);
    this.heartMesh.add(pineappleBody);

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const scale = new THREE.Mesh(
          new THREE.BoxGeometry(0.16, 0.08, 0.06),
          this.leafMat
        );
        const ang = (col / 4) * Math.PI * 2 + row * 0.5;
        scale.position.set(
          Math.cos(ang) * 0.55,
          -0.45 + row * 0.3,
          Math.sin(ang) * 0.55
        );
        scale.rotation.y = -ang;
        this.heartMesh.add(scale);
      }
    }

    for (let i = 0; i < 6; i++) {
      const leaf = new THREE.Mesh(
        new THREE.ConeGeometry(0.13, 0.72, 4),
        this.leafMat
      );
      const ang = (i / 6) * Math.PI * 2;
      leaf.position.set(Math.cos(ang) * 0.26, 0.9, Math.sin(ang) * 0.26);
      leaf.rotation.z = Math.cos(ang) * 0.32;
      leaf.rotation.x = Math.sin(ang) * 0.32;
      this.heartMesh.add(leaf);
    }

    // 5. Anillo de cuerda luminosa alrededor de la piña.
    this.innerRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.02, 0.065, 6, 18),
      this.rustMat
    );
    this.innerRing.position.y = 3.15;
    this.VisualRoot.add(this.innerRing);

    // 6. Postes y sombrilla de paja que cubre la despensa.
    for (const [px, pz] of [[-1.95, -1.35], [1.95, -1.35], [-1.95, 1.35], [1.95, 1.35]]) {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.14, 4.15, 6),
        this.rustMat
      );
      post.position.set(px, 2.4, pz);
      post.castShadow = true;
      this.VisualRoot.add(post);
    }

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(3.2, 1.25, 8),
      this.thatchMat
    );
    roof.position.y = 4.95;
    roof.rotation.y = Math.PI / 8;
    roof.castShadow = true;
    roof.receiveShadow = true;
    this.VisualRoot.add(roof);

    const roofRim = new THREE.Mesh(
      new THREE.CylinderGeometry(3.05, 3.05, 0.12, 8, 1, true),
      this.thatchMat
    );
    roofRim.position.y = 4.36;
    this.VisualRoot.add(roofRim);

    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const flag = new THREE.Mesh(
        new THREE.ConeGeometry(0.22, 0.55, 4),
        this.fabricMat
      );
      flag.position.set(Math.cos(ang) * 2.85, 4.15, Math.sin(ang) * 2.85);
      flag.rotation.z = Math.PI;
      flag.rotation.y = -ang;
      this.VisualRoot.add(flag);
    }

    // 7. Veleta de la despensa.
    this.sirenSpinner = new THREE.Group();
    this.sirenSpinner.position.set(0, 5.62, 0);
    this.VisualRoot.add(this.sirenSpinner);

    this.beaconMat = new THREE.MeshBasicMaterial({ color: 0xffc857 });
    const vaneFlag = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.3, 0.18), this.beaconMat);
    vaneFlag.position.x = 0.5;
    const vaneTail = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 0.12), this.beaconMat);
    vaneTail.position.x = -0.65;
    vaneTail.rotation.y = 0.5;
    this.sirenSpinner.add(vaneFlag, vaneTail);

    // 8. Luces cálidas del puesto.
    this.coreLight = new THREE.PointLight(0xffc857, 38, 18, 1.5);
    this.coreLight.position.set(0, 3.2, 0);
    this.group.add(this.coreLight);

    this.beaconLight = new THREE.PointLight(0xffcf68, 22, 26, 1.3);
    this.beaconLight.position.set(0, 5.4, 0);
    this.group.add(this.beaconLight);

    // 9. Grietas de sobrecarga visibles con el daño, sobre la nevera.
    this.crackMeshes = [];
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
      const crackPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.55, 1.6),
        this.crackMat
      );
      crackPlane.position.set(Math.cos(ang) * 1.58, 1.3, Math.sin(ang) * 1.18);
      crackPlane.rotation.y = -ang + Math.PI / 2;
      this.VisualRoot.add(crackPlane);
      this.crackMeshes.push(crackPlane);
    }
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
      if (hpRatio < 0.9 && this.smokeTimer <= 0) {
        this.smokeTimer = st.smokeRate;
        const smoke = new THREE.Mesh(
          SHARED_GEO.spark,
          new THREE.MeshBasicMaterial({
            color: hpRatio < 0.45 ? 0x4a1e1e : 0x4f6258,
            transparent: true,
            opacity: 0.65
          })
        );
        smoke.scale.setScalar(1.6);
        smoke.position.copy(this.group.position).add(new THREE.Vector3(
          (Math.random() - 0.5) * 1.5,
          4.9,
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