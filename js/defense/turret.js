// Torreta: modelo 3D, sprite procedural, estadísticas, mejoras y disparo.
// Exports: Turret.
import * as THREE from 'three';
import { CORE_DEFENSE_CONFIG } from '../config/coreDefenseConfig.js';
import { DefensiveStructure } from './defensiveStructure.js';
import { createBillboardSprite } from '../entities.js';
import { SpriteSheets } from '../spritesheets.js';
import { AudioSys } from '../audio.js';
import { triggerCombatFlash } from '../combat.js';

// ============================================================================
// TORRETA DEFENSIVA
// Modelo 3D simple con sprite procedural encima. Las mejoras estilo BTD6 se
// resuelven con datos: 3 rutas x 4 niveles, crosspath y especiales de conducta.
// ============================================================================

const Y_AXIS = new THREE.Vector3(0, 1, 0);

export class Turret extends DefensiveStructure {
  constructor(scene, worldPhysics, position, cfg, system, facingYaw = 0, turretId = null) {
    super(scene, worldPhysics, {
      id: turretId || `${cfg.id}_${Date.now()}_${Math.floor(Math.random() * 9999)}`,
      name: cfg.name,
      structureType: 'tower',
      position,
      maxHp: cfg.base.hp,
      collisionRadius: cfg.base.collisionRadius,
      attackStopDistance: cfg.base.attackStopDistance,
      height: cfg.base.height,
      targetPriority: 2
    });

    this.cfg = cfg;
    this.system = system;
    this.facingYaw = facingYaw;
    this.base = cfg.base;
    this.paths = cfg.paths;
    this.levels = [0, 0, 0];
    this.invested = cfg.cost;
    this.specials = new Set();
    this.visualKeys = new Set();
    this.stats = null;

    this.fireTimer = 0;
    this.animTimer = Math.random();
    this.firingFlash = 0;
    this.pulseCount = 0;
    this.spawnTimer = 0;
    this.supportPulseTimer = 0;
    this.supportShieldTimer = 0;
    this.burstActive = 0;
    this.burstCooldown = 0;
    this.hitFlashTimer = 0;

    this.supportFireRateBonus = 0;
    this.supportDamageBonus = 0;

    this.modelRoot = new THREE.Group();
    this.modelRoot.rotation.y = facingYaw;
    this.group.add(this.modelRoot);
    this.visualParts = {};

    this.buildMaterials();
    this.recomputeStats();
    this.buildModel();
    this.buildBillboard();
    this.buildHealthBar();
    this.applyUpgradeVisuals();
  }

  buildMaterials() {
    const metalTex = SpriteSheets.env.metal.tex;
    const crateTex = SpriteSheets.env.crate.tex;

    this.bodyMat = new THREE.MeshStandardMaterial({
      map: metalTex, color: 0x3a3126, roughness: 0.86, metalness: 0.42
    });
    this.darkMat = new THREE.MeshStandardMaterial({
      map: crateTex, color: 0x241d16, roughness: 0.92, metalness: 0.3
    });
    this.rustMat = new THREE.MeshStandardMaterial({
      map: crateTex, color: 0x4a2c1d, roughness: 0.9, metalness: 0.25
    });
    this.accentMat = new THREE.MeshStandardMaterial({
      color: this.cfg.color,
      emissive: this.cfg.color,
      emissiveIntensity: 0.6,
      roughness: 0.5,
      metalness: 0.3
    });
    this.glowMat = new THREE.MeshBasicMaterial({ color: this.cfg.color });
  }

  addPart(geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, visible = true) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    // Las piezas emisivas no proyectan sombra (rendimiento y coherencia visual)
    const emissive = mat === this.glowMat || mat === this.accentMat;
    mesh.castShadow = !emissive;
    mesh.receiveShadow = !emissive;
    mesh.visible = visible;
    this.modelRoot.add(mesh);
    return mesh;
  }

  addHiddenPart(name, geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = this.addPart(geo, mat, x, y, z, rx, ry, rz, false);
    this.visualParts[name] = mesh;
    return mesh;
  }

  buildModel() {
    const r = this.cfg.base.collisionRadius;

    // Pedestal común
    this.addPart(
      new THREE.CylinderGeometry(r * 1.25, r * 1.5, 0.3, 8),
      this.darkMat, 0, 0.15, 0
    );
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
      this.addPart(
        new THREE.BoxGeometry(0.16, 0.22, 0.26),
        this.rustMat,
        Math.cos(a) * r * 1.25, 0.11, Math.sin(a) * r * 1.25,
        0, -a, 0
      );
    }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 1.32, 0.032, 6, 16), this.glowMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.31;
    this.modelRoot.add(ring);

    if (this.cfg.id === 'gunner') this.buildGunnerModel();
    else if (this.cfg.id === 'mortar') this.buildMortarModel();
    else if (this.cfg.id === 'cryo') this.buildCryoModel();
    else if (this.cfg.id === 'barracks') this.buildBarracksModel();
    else if (this.cfg.id === 'support') this.buildSupportModel();

    // Franja emisiva común
    this.addPart(new THREE.BoxGeometry(0.34, 0.05, 0.05), this.glowMat, 0, 0.34, -r * 1.28);
  }

  buildGunnerModel() {
    this.addPart(new THREE.BoxGeometry(0.62, 0.42, 0.66), this.bodyMat, 0, 0.62, 0);
    this.addPart(new THREE.BoxGeometry(0.42, 0.2, 0.3), this.darkMat, 0, 0.92, -0.12);
    this.addPart(new THREE.CylinderGeometry(0.13, 0.15, 0.22, 6), this.rustMat, 0, 0.9, -0.18);

    // Cañón principal
    this.addPart(new THREE.BoxGeometry(0.13, 0.13, 0.95), this.darkMat, 0, 0.9, -0.72);
    this.addPart(new THREE.BoxGeometry(0.08, 0.08, 0.86), this.accentMat, 0, 0.9, -0.7);
    this.addPart(new THREE.BoxGeometry(0.22, 0.16, 0.3), this.rustMat, 0, 0.9, -0.2);

    // Piezas de mejora (ocultas)
    this.addHiddenPart(
      'twin_barrels',
      new THREE.BoxGeometry(0.11, 0.11, 0.9),
      this.darkMat, 0.17, 0.9, -0.7
    );
    this.addHiddenPart(
      'ammo_drum',
      new THREE.CylinderGeometry(0.2, 0.2, 0.18, 8),
      this.rustMat, 0.3, 0.72, 0.05, 0, 0, Math.PI / 2
    );
    this.addHiddenPart(
      'long_barrel',
      new THREE.BoxGeometry(0.1, 0.1, 1.5),
      this.accentMat, 0, 0.9, -1.0
    );
    this.addHiddenPart(
      'rail_coils',
      new THREE.TorusGeometry(0.16, 0.035, 5, 10),
      this.glowMat, 0, 0.9, -1.05, Math.PI / 2, 0, 0
    );
    this.addHiddenPart(
      'fuel_tank',
      new THREE.CylinderGeometry(0.16, 0.16, 0.5, 7),
      this.rustMat, -0.3, 0.65, 0.08, 0, 0, Math.PI / 2
    );
    this.addHiddenPart(
      'explosive_tank',
      new THREE.CylinderGeometry(0.18, 0.18, 0.42, 7),
      this.accentMat, 0.3, 0.62, 0.1, 0, 0, Math.PI / 2
    );

    this.muzzleHeight = 0.9;
    this.muzzleForward = 1.18;
  }

  buildMortarModel() {
    this.addPart(new THREE.BoxGeometry(0.8, 0.32, 0.72), this.bodyMat, 0, 0.5, 0);
    this.addPart(new THREE.CylinderGeometry(0.26, 0.3, 0.22, 8), this.rustMat, 0, 0.7, 0);
    this.addPart(
      new THREE.CylinderGeometry(0.15, 0.19, 1.05, 8),
      this.darkMat, 0, 1.15, -0.16, -0.72, 0, 0
    );
    this.addPart(
      new THREE.CylinderGeometry(0.19, 0.21, 0.16, 8),
      this.accentMat, 0, 1.52, -0.48, -0.72, 0, 0
    );
    this.addPart(new THREE.BoxGeometry(0.34, 0.16, 0.3), this.rustMat, 0.34, 0.6, 0.1);

    this.addHiddenPart(
      'cluster_tubes',
      new THREE.CylinderGeometry(0.09, 0.11, 0.7, 6),
      this.rustMat, -0.18, 1.08, -0.1, -0.72, 0, 0
    );
    this.addHiddenPart(
      'autoloader',
      new THREE.CylinderGeometry(0.2, 0.2, 0.5, 8),
      this.accentMat, 0.36, 0.78, -0.08, 0, 0, Math.PI / 2
    );
    this.addHiddenPart(
      'fuel_tanks',
      new THREE.CylinderGeometry(0.14, 0.14, 0.6, 7),
      this.rustMat, -0.36, 0.62, 0.12, 0, 0, Math.PI / 2
    );
    this.addHiddenPart(
      'siege_barrel',
      new THREE.CylinderGeometry(0.22, 0.28, 1.25, 8),
      this.accentMat, 0, 1.22, -0.2, -0.72, 0, 0
    );
    this.addHiddenPart(
      'barrage_racks',
      new THREE.BoxGeometry(0.55, 0.18, 0.5),
      this.rustMat, 0, 0.72, 0.25
    );
    this.addHiddenPart(
      'inferno_tanks',
      new THREE.CylinderGeometry(0.17, 0.17, 0.7, 7),
      this.accentMat, -0.4, 0.68, 0.16, 0, 0, Math.PI / 2
    );

    this.muzzleHeight = 1.58;
    this.muzzleForward = 0.55;
  }

  buildCryoModel() {
    this.addPart(new THREE.CylinderGeometry(0.4, 0.46, 0.55, 8), this.bodyMat, 0, 0.62, 0);
    this.addPart(new THREE.CylinderGeometry(0.3, 0.34, 0.7, 8), this.darkMat, 0, 1.1, 0);
    this.addPart(new THREE.CylinderGeometry(0.2, 0.24, 0.28, 8), this.accentMat, 0, 1.5, 0);
    this.addPart(new THREE.BoxGeometry(0.14, 0.5, 0.14), this.rustMat, -0.42, 0.9, 0);
    this.addPart(new THREE.BoxGeometry(0.14, 0.5, 0.14), this.rustMat, 0.42, 0.9, 0);

    this.addHiddenPart(
      'frost_coils',
      new THREE.TorusGeometry(0.34, 0.045, 6, 12),
      this.glowMat, 0, 1.16, 0, Math.PI / 2, 0, 0
    );
    this.addHiddenPart(
      'radiator_fins',
      new THREE.BoxGeometry(0.72, 0.42, 0.08),
      this.rustMat, 0, 1.05, 0.34
    );
    this.addHiddenPart(
      'crystal_core',
      new THREE.IcosahedronGeometry(0.24, 0),
      this.glowMat, 0, 1.55, 0
    );
    this.addHiddenPart(
      'ice_spikes',
      new THREE.ConeGeometry(0.1, 0.5, 5),
      this.glowMat, 0.34, 1.3, -0.12
    );
    this.addHiddenPart(
      'shatter_crystal',
      new THREE.OctahedronGeometry(0.3, 0),
      this.glowMat, 0, 1.7, 0
    );
    this.addHiddenPart(
      'blizzard_core',
      new THREE.TorusGeometry(0.5, 0.06, 6, 16),
      this.glowMat, 0, 1.2, 0, Math.PI / 2, 0, 0
    );

    this.muzzleHeight = 1.5;
    this.muzzleForward = 0.2;
  }

  buildBarracksModel() {
    this.addPart(new THREE.BoxGeometry(0.95, 0.5, 0.85), this.bodyMat, 0, 0.58, 0);
    this.addPart(new THREE.BoxGeometry(0.7, 0.28, 0.6), this.darkMat, 0, 0.94, 0);
    this.addPart(new THREE.BoxGeometry(0.4, 0.18, 0.44), this.rustMat, 0, 1.04, 0.12);
    this.addPart(new THREE.BoxGeometry(0.08, 1.05, 0.08), this.rustMat, 0.38, 1.35, 0.2);
    this.addPart(new THREE.BoxGeometry(0.38, 0.2, 0.04), this.accentMat, 0.55, 1.72, 0.2);
    this.addPart(new THREE.BoxGeometry(0.62, 0.12, 0.3), this.darkMat, 0, 0.37, 0.34);

    this.addHiddenPart(
      'extra_bunks',
      new THREE.BoxGeometry(0.75, 0.16, 0.22),
      this.rustMat, 0, 0.42, -0.34
    );
    this.addHiddenPart(
      'battalion_bunks',
      new THREE.BoxGeometry(0.85, 0.24, 0.26),
      this.accentMat, 0, 0.38, -0.36
    );
    this.addHiddenPart(
      'armor_plates',
      new THREE.BoxGeometry(1.0, 0.16, 0.9),
      this.rustMat, 0, 0.84, 0
    );
    this.addHiddenPart(
      'heavy_armor',
      new THREE.BoxGeometry(1.08, 0.26, 0.98),
      this.bodyMat, 0, 0.9, 0
    );
    this.addHiddenPart(
      'antenna',
      new THREE.BoxGeometry(0.06, 0.75, 0.06),
      this.accentMat, -0.34, 1.4, -0.16
    );
    this.addHiddenPart(
      'drone_rack',
      new THREE.BoxGeometry(0.42, 0.14, 0.32),
      this.accentMat, -0.3, 1.08, -0.2
    );

    this.muzzleHeight = 1.2;
    this.muzzleForward = 0.4;
  }

  buildSupportModel() {
    this.addPart(new THREE.BoxGeometry(0.72, 0.34, 0.72), this.bodyMat, 0, 0.5, 0);
    this.addPart(new THREE.CylinderGeometry(0.11, 0.14, 0.9, 6), this.rustMat, 0, 1.05, 0);
    this.addPart(new THREE.BoxGeometry(0.42, 0.09, 0.09), this.accentMat, 0, 1.3, 0);
    this.addPart(new THREE.BoxGeometry(0.09, 0.42, 0.09), this.accentMat, 0, 1.3, 0);
    this.addPart(new THREE.BoxGeometry(0.26, 0.14, 0.26), this.darkMat, 0, 0.72, 0.28);

    this.addHiddenPart(
      'tool_arms',
      new THREE.BoxGeometry(0.5, 0.1, 0.1),
      this.rustMat, 0.34, 0.95, -0.18, 0, 0, -0.35
    );
    this.addHiddenPart(
      'tesla_coils',
      new THREE.TorusGeometry(0.22, 0.04, 5, 12),
      this.glowMat, 0, 1.45, 0, Math.PI / 2, 0, 0
    );
    this.addHiddenPart(
      'surge_core',
      new THREE.IcosahedronGeometry(0.2, 0),
      this.glowMat, 0, 1.6, 0
    );
    const dome = this.addHiddenPart(
      'dome',
      new THREE.SphereGeometry(0.62, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshBasicMaterial({
        color: 0x6f8f9c, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false
      }),
      0, 0.34, 0
    );
    dome.castShadow = false;
    dome.receiveShadow = false;
    this.addHiddenPart(
      'barrier_ring',
      new THREE.TorusGeometry(0.72, 0.045, 6, 20),
      this.glowMat, 0, 0.6, 0, Math.PI / 2, 0, 0
    );
    this.addHiddenPart(
      'repair_beacon',
      new THREE.CylinderGeometry(0.06, 0.08, 0.55, 6),
      this.glowMat, 0, 1.72, 0
    );

    this.muzzleHeight = 1.35;
    this.muzzleForward = 0.2;
  }

  buildBillboard() {
    const sprite = createBillboardSprite(this.cfg.spriteKey, this.cfg.spriteSize);
    sprite.shadowDisc.visible = false;
    sprite.shadowDisc.userData.sharedGeo = true;
    sprite.shadowDisc.userData.sharedMat = true;
    sprite.mesh.castShadow = false;
    sprite.mesh.receiveShadow = false;
    // Emisión suave para que la torreta se lea en la oscuridad sin convertirse en una luz
    const mat = sprite.mesh.material;
    mat.emissive = new THREE.Color(this.cfg.color);
    mat.emissiveMap = sprite.tex;
    mat.emissiveIntensity = 0.55;
    mat.needsUpdate = true;
    sprite.glowMesh.visible = true;
    sprite.group.position.y = this.cfg.base.height * 0.55;
    sprite.setDirectionalFrame(0, 0, 0);
    this.group.add(sprite.group);
    this.sprite = sprite;
    this.spriteMountY = this.cfg.base.height * 0.55;
  }

  buildHealthBar() {
    this.hpBarGroup = new THREE.Group();
    this.hpBarGroup.position.y = this.spriteMountY + this.cfg.spriteSize + 0.24;

    const bgMat = new THREE.MeshBasicMaterial({
      color: 0x050605, transparent: true, opacity: 0.85, depthTest: false
    });
    const fillMat = new THREE.MeshBasicMaterial({
      color: this.cfg.color, transparent: true, opacity: 0.95, depthTest: false
    });

    const bg = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.085), bgMat);
    bg.renderOrder = 20;
    const fill = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.055), fillMat);
    fill.position.z = 0.002;
    fill.renderOrder = 21;

    this.hpBarBg = bg;
    this.hpBarFill = fill;
    this.hpBarGroup.add(bg, fill);
    this.hpBarGroup.visible = false;
    this.group.add(this.hpBarGroup);
  }

  // --------------------------------------------------------------------------
  // ESTADÍSTICAS Y MEJORAS
  // --------------------------------------------------------------------------

  recomputeStats() {
    const s = {
      ...this.base,
      projectileCount: 1,
      pierce: 0,
      burstCount: 0,
      shellCount: 1,
      cluster: 0,
      clusterDamageMult: 1,
      clusterRadiusMult: 1,
      burnDps: 0,
      burnDuration: 0,
      burnDpsMult: 1,
      burnDurationMult: 1,
      explosionRadius: 0,
      explosionDamageMult: 1,
      napalmDps: 0,
      napalmDuration: 0,
      napalmRadius: 0,
      napalmDpsMult: 1,
      napalmDurationMult: 1,
      napalmRadiusMult: 1,
      freezeDuration: 0,
      freezeEvery: 0,
      frozenDamageMult: 1,
      frostbiteDps: 0,
      frostbiteDpsMult: 1,
      brittleMult: 1,
      ignitionDamage: 0,
      alliesPerSpawn: 1,
      allyArmor: 0,
      allyRanged: false,
      allyAoe: false,
      allyHp: this.base.allyHp || 60,
      allyDamage: this.base.allyDamage || 6,
      allySpeed: this.base.allySpeed || 4.2,
      allyRange: this.base.allyRange || 10,
      allyAttackInterval: this.base.allyAttackInterval || 0.9,
      allyCap: this.base.allyCap || 0,
      spawnInterval: this.base.spawnInterval || 8,
      healAmount: this.base.healAmount || 0,
      healRadius: this.base.healRadius || 0,
      buffFireRate: 0,
      buffDamage: 0,
      auraArmor: 0,
      shieldAmount: 0,
      shieldInterval: 10,
      overclockBurst: 0,
      overclockBurstDuration: 0,
      overclockBurstInterval: 0,
      continuous: false,
      continuousHeal: false,
      barrier: false
    };

    const specials = new Set();
    const visuals = new Set();

    const add = (key, v) => { s[key] = (s[key] ?? 0) + v; };
    const mul = (key, v) => { s[key] = (s[key] ?? 1) * v; };
    const max = (key, v) => { s[key] = Math.max(s[key] ?? 0, v); };
    const min = (key, v) => { s[key] = Math.min(s[key] ?? v, v); };
    const setTrue = key => { s[key] = true; };

    for (let p = 0; p < this.paths.length; p++) {
      const path = this.paths[p];
      const level = this.levels[p];
      for (let u = 0; u < level; u++) {
        const up = path.upgrades[u];
        if (!up) continue;
        if (up.special) specials.add(up.special);
        if (up.visual) visuals.add(up.visual);

        const fx = up.effects || {};
        Object.entries(fx).forEach(([key, v]) => {
          switch (key) {
            case 'damageMult': mul('damage', v); break;
            case 'damageFlat': add('damage', v); break;
            case 'fireRateMult': mul('fireRate', v); break;
            case 'rangeMult': mul('range', v); break;
            case 'aoeRadiusMult': mul('aoeRadius', v); break;
            case 'slowFactor': min('slowFactor', v); break;
            case 'projectileCount': max('projectileCount', v); break;
            case 'pierce': max('pierce', v); break;
            case 'burstCount': max('burstCount', v); break;
            case 'shellCount': max('shellCount', v); break;
            case 'cluster': max('cluster', v); break;
            case 'clusterDamageMult': mul('clusterDamageMult', v); break;
            case 'clusterRadiusMult': mul('clusterRadiusMult', v); break;
            case 'burnDps': add('burnDps', v); break;
            case 'burnDuration': add('burnDuration', v); break;
            case 'burnDpsMult': mul('burnDpsMult', v); break;
            case 'burnDurationMult': mul('burnDurationMult', v); break;
            case 'explosionRadius': max('explosionRadius', v); break;
            case 'explosionDamageMult': mul('explosionDamageMult', v); break;
            case 'napalmDps': add('napalmDps', v); break;
            case 'napalmDuration': add('napalmDuration', v); break;
            case 'napalmRadius': max('napalmRadius', v); break;
            case 'napalmDpsMult': mul('napalmDpsMult', v); break;
            case 'napalmDurationMult': mul('napalmDurationMult', v); break;
            case 'napalmRadiusMult': mul('napalmRadiusMult', v); break;
            case 'freezeDuration': max('freezeDuration', v); break;
            case 'freezeEvery': s.freezeEvery = s.freezeEvery || v; break;
            case 'frozenDamageMult': max('frozenDamageMult', v); break;
            case 'frostbiteDps': add('frostbiteDps', v); break;
            case 'frostbiteDpsMult': mul('frostbiteDpsMult', v); break;
            case 'brittleMult': max('brittleMult', v); break;
            case 'ignitionDamage': add('ignitionDamage', v); break;
            case 'allyCap': add('allyCap', v); break;
            case 'alliesPerSpawn': add('alliesPerSpawn', v); break;
            case 'alliesPerSpawnSet': max('alliesPerSpawn', v); break;
            case 'allyDamageMult': mul('allyDamage', v); break;
            case 'allyHpMult': mul('allyHp', v); break;
            case 'allySpeedMult': mul('allySpeed', v); break;
            case 'allyRangeMult': mul('allyRange', v); break;
            case 'allyArmor': max('allyArmor', v); break;
            case 'allyRanged': setTrue('allyRanged'); break;
            case 'allyAoe': setTrue('allyAoe'); break;
            case 'spawnIntervalMult': mul('spawnInterval', v); break;
            case 'healAmountMult': mul('healAmount', v); break;
            case 'healRadiusMult': mul('healRadius', v); break;
            case 'buffFireRate': add('buffFireRate', v); break;
            case 'buffDamage': add('buffDamage', v); break;
            case 'auraArmor': add('auraArmor', v); break;
            case 'shieldAmount': add('shieldAmount', v); break;
            case 'shieldAmountMult': mul('shieldAmount', v); break;
            case 'shieldInterval': min('shieldInterval', v); break;
            case 'overclockBurst': max('overclockBurst', v); break;
            case 'overclockBurstDuration': max('overclockBurstDuration', v); break;
            case 'overclockBurstInterval': s.overclockBurstInterval = v; break;
            case 'continuous': setTrue('continuous'); break;
            case 'continuousHeal': setTrue('continuousHeal'); break;
            case 'barrier': setTrue('barrier'); break;
            default: break;
          }
        });
      }
    }

    s.damage = Math.max(0, s.damage || 0);
    s.fireRate = Math.max(0.05, s.fireRate || 1);
    s.range = Math.max(1, s.range || 1);
    s.allyCap = Math.max(0, s.allyCap || 0);
    s.alliesPerSpawn = Math.max(1, s.alliesPerSpawn || 1);
    s.spawnInterval = Math.max(0.5, s.spawnInterval || 8);
    s.slowFactor = s.slowFactor ?? 0.6;
    s.slowDuration = s.slowDuration || 1.6;
    s.aoeRadius = s.aoeRadius || 0;

    this.stats = s;
    this.specials = specials;
    this.visualKeys = visuals;

    if (this.modelRoot) this.applyUpgradeVisuals();
  }

  applyUpgradeVisuals() {
    Object.entries(this.visualParts).forEach(([key, part]) => {
      if (!part) return;
      part.visible = this.visualKeys.has(key);
    });
  }

  getUpgradeState(pathIndex) {
    const rules = CORE_DEFENSE_CONFIG.TURRET_UPGRADE_RULES;
    const path = this.paths[pathIndex];
    const level = this.levels[pathIndex];
    if (!path) return null;

    if (level >= path.upgrades.length) {
      return { path, level, next: null, canBuy: false, lockReason: 'NIVEL MÁXIMO' };
    }

    const nextTier = level + 1;
    let lockReason = null;
    if (nextTier > rules.freeTier) {
      const otherSpecialized = this.levels.some((l, i) => i !== pathIndex && l >= rules.specializedTier);
      if (otherSpecialized) lockReason = 'OTRA RUTA ESPECIALIZADA';
    }

    return {
      path,
      level,
      next: path.upgrades[level],
      nextTier,
      canBuy: !lockReason,
      lockReason
    };
  }

  upgrade(pathIndex) {
    const state = this.getUpgradeState(pathIndex);
    if (!state || !state.next || !state.canBuy) return false;
    this.levels[pathIndex]++;
    this.invested += state.next.cost;
    this.recomputeStats();
    this.applyUpgradeVisuals();
    this.fireTimer = Math.min(this.fireTimer, 0.15);
    AudioSys.playUISelect();
    return true;
  }

  getSellValue() {
    return Math.floor(this.invested * CORE_DEFENSE_CONFIG.TURRET_UPGRADE_RULES.sellRefund);
  }

  // --------------------------------------------------------------------------
  // COMBATE
  // --------------------------------------------------------------------------

  getEffectiveDamage() {
    return this.stats.damage * (1 + this.supportDamageBonus);
  }

  getEffectiveFireRate() {
    return this.stats.fireRate * (1 + this.supportFireRateBonus);
  }

  getEnemiesInRange(enemies) {
    const out = [];
    const pos = this.group.position;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.active || e.state === 'dead') continue;
      const dx = e.group.position.x - pos.x;
      const dz = e.group.position.z - pos.z;
      const dy = Math.abs(e.group.position.y - pos.y);
      if (dy > 4.5) continue;
      const d = Math.hypot(dx, dz);
      if (d <= this.stats.range) {
        out.push({ enemy: e, dist: d });
      }
    }
    out.sort((a, b) => a.dist - b.dist);
    return out;
  }

  findTarget(enemies) {
    const list = this.getEnemiesInRange(enemies);
    if (list.length === 0) return null;
    if (this.cfg.id === 'mortar') {
      // Preferir el enemigo con más vecinos dentro del radio de explosión
      let best = list[0].enemy;
      let bestScore = -1;
      for (let i = 0; i < Math.min(list.length, 10); i++) {
        const candidate = list[i].enemy;
        let score = 0;
        for (let j = 0; j < list.length; j++) {
          const e = list[j].enemy;
          const dx = e.group.position.x - candidate.group.position.x;
          const dz = e.group.position.z - candidate.group.position.z;
          if (Math.hypot(dx, dz) <= this.stats.aoeRadius * 1.6) score++;
        }
        if (score > bestScore) {
          bestScore = score;
          best = candidate;
        }
      }
      return best;
    }
    return list[0].enemy;
  }

  getMuzzleWorldPos() {
    const local = new THREE.Vector3(0, this.muzzleHeight || 1, -(this.muzzleForward || 0.8));
    local.applyAxisAngle(Y_AXIS, this.modelRoot.rotation.y);
    return this.group.position.clone().add(local);
  }

  faceTarget(targetPos) {
    const dx = targetPos.x - this.group.position.x;
    const dz = targetPos.z - this.group.position.z;
    this.modelRoot.rotation.y = Math.atan2(-dx, -dz);
  }

  update(dt, ctx) {
    if (this.destroyed || !this.active) return;

    this.animTimer += dt;
    if (this.firingFlash > 0) this.firingFlash -= dt;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    const enemies = ctx.enemyPool.active;

    if (this.sprite) {
      this.sprite.faceCamera(ctx.camera.position);
      const state = this.firingFlash > 0 ? 1 : 0;
      const fps = state === 1 ? 12 : 4;
      this.sprite.setDirectionalFrame(0, state, Math.floor(this.animTimer * fps) % 4);
    }

    this.updateHealthBar(ctx.camera.position);

    if (this.cfg.id === 'barracks') {
      this.updateBarracks(dt, ctx);
    } else if (this.cfg.id === 'support') {
      this.updateSupport(dt, ctx);
    } else {
      this.updateCombat(dt, enemies, ctx);
    }

    if (this.hitFlashTimer > 0) {
      const c = new THREE.Color(0x6e1414);
      this.accentMat.emissive.copy(c);
      this.accentMat.emissiveIntensity = 0.9;
    } else {
      this.accentMat.emissive.setHex(this.cfg.color);
      this.accentMat.emissiveIntensity = 0.6;
    }
  }

  updateCombat(dt, enemies, ctx) {
    this.fireTimer -= dt;
    if (this.fireTimer > 0) return;

    if (this.cfg.id === 'cryo') {
      this.fireCryo(enemies);
      const interval = this.stats.continuous ? 0.35 : 1 / Math.max(0.05, this.getEffectiveFireRate());
      this.fireTimer = interval;
      return;
    }

    const target = this.findTarget(enemies);
    if (!target) {
      this.fireTimer = 0;
      return;
    }

    const interval = 1 / Math.max(0.05, this.getEffectiveFireRate());
    this.fireTimer = interval;

    this.faceTarget(target.group.position);

    if (this.cfg.id === 'gunner') this.fireGunner(target, enemies, ctx);
    else if (this.cfg.id === 'mortar') this.fireMortar(target, enemies, ctx);
  }

  fireGunner(primary, enemies, ctx) {
    const muzzle = this.getMuzzleWorldPos();
    const primaryCount = Math.max(1, this.stats.projectileCount);
    const sorted = this.getEnemiesInRange(enemies).map(x => x.enemy);
    const primaries = sorted.slice(0, primaryCount);
    if (primaries.length === 0) primaries.push(primary);

    const shots = this.stats.burstCount > 0 ? this.stats.burstCount : 1;
    const maxHits = 1 + Math.max(0, this.stats.pierce);
    const dmg = this.getEffectiveDamage();

    for (let i = 0; i < shots; i++) {
      const target = primaries[i % primaries.length];
      if (!target || !target.active || target.state === 'dead') continue;

      const aim = target.group.position.clone().add(new THREE.Vector3(0, 1.0, 0));
      const hits = this.collectLineHits(enemies, muzzle, aim, maxHits);
      const finalHits = hits.length > 0 ? hits : [target];

      for (let h = 0; h < finalHits.length; h++) {
        const e = finalHits[h];
        this.system.damageEnemy(e, dmg, this);
        if (this.stats.burnDps > 0) {
          e.applyBurn(
            this.stats.burnDps * this.stats.burnDpsMult,
            this.stats.burnDuration * this.stats.burnDurationMult
          );
        }
      }

      this.system.spawnTracer(muzzle, aim, this.cfg.color, 0.06);

      if (this.stats.explosionRadius > 0) {
        this.system.damageArea(
          target.group.position,
          this.stats.explosionRadius,
          dmg * this.stats.explosionDamageMult,
          this
        );
        this.system.spawnExplosion(target.group.position, this.stats.explosionRadius, this.cfg.color);
      }
    }

    triggerCombatFlash(muzzle, this.cfg.color, 62, 0.06);
    AudioSys.play(this.stats.burstCount > 0 ? 180 : 240, 0.05, 'square', 0.03);
    this.firingFlash = 0.16;
  }

  collectLineHits(enemies, origin, aim, maxHits) {
    const dir = aim.clone().sub(origin);
    if (dir.lengthSq() < 0.0001) return [];
    dir.normalize();

    const hits = [];
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.active || e.state === 'dead') continue;
      const toE = e.group.position.clone().add(new THREE.Vector3(0, 1.0, 0)).sub(origin);
      const proj = toE.dot(dir);
      if (proj <= 0.2 || proj > this.stats.range + 4) continue;
      const perp = toE.clone().addScaledVector(dir, -proj).length();
      if (perp <= 0.9 + (e.isBoss ? 0.7 : 0)) {
        hits.push({ enemy: e, proj });
      }
    }
    hits.sort((a, b) => a.proj - b.proj);
    return hits.slice(0, maxHits).map(h => h.enemy);
  }

  fireMortar(primary, enemies, ctx) {
    const muzzle = this.getMuzzleWorldPos();
    const sorted = this.getEnemiesInRange(enemies).map(x => x.enemy);
    const shells = Math.max(1, Math.round(this.stats.shellCount));

    for (let i = 0; i < shells; i++) {
      const target = sorted[i % sorted.length] || primary;
      if (!target) continue;

      const flight = 0.4 + Math.random() * 0.1;
      // Predicción sencilla: los enemigos se mueven hacia el núcleo, así que se apunta
      // delante de su posición actual para que la concha no caiga detrás.
      const moveYaw = target.billboard ? target.billboard.facingYaw : 0;
      const moveSpeed = (target.speed || 0) * (target.slowTimer > 0 ? (target.slowFactor || 0.6) : 1);
      const lead = new THREE.Vector3(-Math.sin(moveYaw), 0, -Math.cos(moveYaw))
        .multiplyScalar(moveSpeed * flight);
      const aim = target.group.position.clone().add(lead);

      if (i >= sorted.length) {
        aim.x += (Math.random() - 0.5) * this.stats.aoeRadius * 1.2;
        aim.z += (Math.random() - 0.5) * this.stats.aoeRadius * 1.2;
      }
      this.system.spawnShell(
        muzzle,
        aim,
        flight,
        2.4,
        () => this.explodeAt(aim)
      );
    }

    triggerCombatFlash(muzzle, this.cfg.color, 80, 0.1);
    AudioSys.play(105, 0.12, 'sine', 0.05);
    this.firingFlash = 0.24;
  }

  explodeAt(pos) {
    const dmg = this.getEffectiveDamage();
    const radius = this.stats.aoeRadius;

    if (this.stats.cluster > 0) {
      const n = this.stats.cluster;
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2 + Math.random() * 0.3;
        const off = radius * 0.62;
        const p = pos.clone().add(new THREE.Vector3(
          Math.cos(ang) * off, 0, Math.sin(ang) * off
        ));
        const r = radius * this.stats.clusterRadiusMult;
        this.system.damageArea(p, r, dmg * this.stats.clusterDamageMult, this);
        this.system.spawnExplosion(p, r, this.cfg.color);
      }
    } else {
      this.system.damageArea(pos, radius, dmg, this);
      this.system.spawnExplosion(pos, radius, this.cfg.color);
    }

    if (this.stats.napalmDps > 0) {
      this.system.spawnNapalm(
        pos,
        this.stats.napalmRadius * this.stats.napalmRadiusMult,
        this.stats.napalmDps * this.stats.napalmDpsMult,
        this.stats.napalmDuration * this.stats.napalmDurationMult
      );
    }

    if (this.stats.ignitionDamage > 0) {
      this.system.damageArea(pos, radius, this.stats.ignitionDamage, this);
    }

    AudioSys.play(62, 0.18, 'sawtooth', 0.06);
  }

  fireCryo(enemies) {
    // El pulso se centra en el enemigo más cercano dentro del alcance, no en la torreta:
    // los emplazamientos están retirados de la ruta y si no el hielo nunca llegaría.
    const targets = this.getEnemiesInRange(enemies);
    const primary = targets.length > 0 ? targets[0].enemy : null;
    const center = primary ? primary.group.position.clone() : this.group.position.clone();
    const radius = this.stats.aoeRadius;

    if (primary) this.faceTarget(primary.group.position);

    const inRange = [];
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.active || e.state === 'dead') continue;
      if (this.system.inRadius(center, e.group.position, radius)) {
        inRange.push(e);
      }
    }

    if (inRange.length === 0 && !this.stats.continuous && !primary) return;

    this.pulseCount++;
    const freezeNow = this.stats.freezeEvery > 0
      && this.pulseCount % this.stats.freezeEvery === 0
      && this.stats.freezeDuration > 0;

    for (let i = 0; i < inRange.length; i++) {
      const e = inRange[i];
      e.applySlow(this.stats.slowFactor, this.stats.slowDuration);
      if (freezeNow) e.applyStun(this.stats.freezeDuration);

      if (this.stats.damage > 0) {
        this.system.damageEnemy(e, this.getEffectiveDamage(), this);
      }

      if (this.stats.frostbiteDps > 0 && (e.slowTimer > 0 || e.stunTimer > 0)) {
        e.applyBurn(this.stats.frostbiteDps * this.stats.frostbiteDpsMult, 1.0);
      }
    }

    this.system.spawnPulse(center, radius, this.cfg.color);
    if (inRange.length > 0) {
      AudioSys.play(520, 0.07, 'sine', 0.025);
      this.firingFlash = 0.2;
    }
  }

  updateBarracks(dt, ctx) {
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;
    this.spawnTimer = this.stats.spawnInterval;

    const alive = this.system.countAlliesFor(this);
    if (alive >= this.stats.allyCap) return;

    let spawned = 0;
    for (let i = 0; i < this.stats.alliesPerSpawn; i++) {
      if (this.system.countAlliesFor(this) >= this.stats.allyCap) break;
      if (this.system.spawnAlly(this)) spawned++;
    }

    if (spawned > 0) {
      this.firingFlash = 0.35;
      this.system.spawnPulse(this.group.position, 2.2, this.cfg.color);
      AudioSys.play(260, 0.1, 'triangle', 0.04);
    }
  }

  updateSupport(dt, ctx) {
    const s = this.stats;

    if (s.continuousHeal) {
      const perSecond = s.healAmount / Math.max(0.5, s.pulseInterval || 3);
      this.system.healAround(this, perSecond * dt, s.healRadius);
    } else {
      this.supportPulseTimer -= dt;
      if (this.supportPulseTimer <= 0) {
        this.supportPulseTimer = s.pulseInterval || 3;
        this.system.healAround(this, s.healAmount, s.healRadius);
        this.system.spawnPulse(this.group.position, s.healRadius * 0.55, this.cfg.color);
      }
    }

    if (s.shieldAmount > 0) {
      this.supportShieldTimer -= dt;
      if (this.supportShieldTimer <= 0) {
        this.supportShieldTimer = s.shieldInterval || 10;
        this.system.shieldAround(this, s.shieldAmount, s.healRadius);
        this.system.spawnPulse(this.group.position, s.healRadius * 0.7, 0x6f8f9c);
      }
    }

    if (s.overclockBurst > 0) {
      if (this.burstActive > 0) {
        this.burstActive -= dt;
      } else {
        this.burstCooldown -= dt;
        if (this.burstCooldown <= 0) {
          this.burstActive = s.overclockBurstDuration || 5;
          this.burstCooldown = s.overclockBurstInterval || 20;
          this.system.spawnPulse(this.group.position, 4.5, this.cfg.color);
          AudioSys.play(380, 0.16, 'sawtooth', 0.05);
        }
      }
    }
  }

  updateHealthBar(cameraPos) {
    const ratio = Math.max(0, this.hp / Math.max(1, this.maxHp));
    this.hpBarGroup.visible = ratio < 0.999;
    if (!this.hpBarGroup.visible) return;

    const angle = Math.atan2(
      cameraPos.x - this.group.position.x,
      cameraPos.z - this.group.position.z
    );
    this.hpBarGroup.rotation.y = angle;

    this.hpBarFill.scale.x = Math.max(0.001, ratio);
    this.hpBarFill.position.x = -(0.86 - 0.86 * ratio) * 0.5;
  }

  onShieldDamaged() {
    AudioSys.play(420, 0.06, 'triangle', 0.025);
  }

  onDamaged(amount, attacker) {
    this.hitFlashTimer = 0.18;
    AudioSys.play(88, 0.08, 'square', 0.035);
    if (this.system) {
      this.system.spawnSparks(
        this.group.position.clone().add(new THREE.Vector3(0, this.cfg.base.height * 0.8, 0)),
        this.cfg.color
      );
    }
  }

  onDestroyed(attacker) {
    this.active = false;
    if (this.system) this.system.handleTurretDestroyed(this);
  }
}
