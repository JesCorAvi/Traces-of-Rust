// Tutorial interactivo opcional del modo Defensa (construcción, mejoras, sinergias y oleada de práctica).
// Exports: TowerDefenseTutorial.
import * as THREE from 'three';
import { CORE_DEFENSE_CONFIG } from '../config/coreDefenseConfig.js';
import { AudioSys } from '../audio.js';
import { GameEvents } from '../core/eventBus.js';

// ============================================================================
// TUTORIAL INTERACTIVO OPCIONAL DEL MODO DEFENDER EL NÚCLEO
// Guía al jugador por construcción libre, mejora, sinergias y una oleada real.
// ============================================================================

const STEPS = [
  {
    id: 'intro',
    title: 'ADIESTRAMIENTO DE DEFENSA',
    text: 'Tu misión: proteger el NÚCLEO durante 12 oleadas. Los enemigos avanzan por tres rutas industriales. Recoge CHATARRA de los hostiles abatidos, construye torretas y mejóralas para resistir. Pulsa [ESPACIO] para empezar.',
    hint: '[ESPACIO] CONTINUAR'
  },
  {
    id: 'build',
    title: 'PASO 1 · CONSTRUIR',
    text: 'Pulsa [E] para abrir el terminal de torretas y elige CLAVADORA. Después apunta al suelo con la cámara: el anillo verde indica una posición válida y el rojo una bloqueada. Coloca con clic izquierdo o [E].',
    hint: 'Anillo verde junto al núcleo · [E] abre el terminal',
    markers: ['build']
  },
  {
    id: 'upgrade',
    title: 'PASO 2 · MEJORAR',
    text: 'Acércate a tu torreta y pulsa [E]. Tiene 3 rutas de mejora de 4 niveles. Sube CADENCIA al nivel 2 para desbloquear el CAÑÓN GEMELO. Solo una ruta puede superar el nivel 2: elige tu especialización.',
    hint: 'Acércate a la torreta y pulsa [E]',
    markers: ['build']
  },
  {
    id: 'synergy',
    title: 'PASO 3 · SINERGIA',
    text: 'Combina roles. La ESCARCHA ralentiza y agrupa a los hostiles; la BOMBARDA castiga el grupo con daño en área. Construye una de cada cerca de la ruta. Los anillos cian y naranja son solo sugerencias: puedes colocarlas donde prefieras.',
    hint: 'Construye ESCARCHA + BOMBARDA',
    markers: ['cryo', 'mortar']
  },
  {
    id: 'practice',
    title: 'PASO 4 · FUEGO REAL',
    text: 'Una avanzada hostil se aproxima. Observa cómo la Escarcha frena al grupo y la Bombarda lo castiga. Los enemigos abatidos sueltan CHATARRA que vuela hacia ti.',
    hint: 'Defiende el núcleo',
    markers: ['cryo', 'mortar']
  },
  {
    id: 'done',
    title: 'ADIESTRAMIENTO COMPLETADO',
    text: 'Sinergias avanzadas: ESCARCHA (Fractura) + daño de área/incendiario (+40%); CUARTEL (Élite/Juggernaut) + TALLER (Reparación/Escudo); TALLER (Sobrecarga) + CLAVADORA (Tormenta). Vender devuelve el 50%. Pulsa [ESPACIO] para comenzar las oleadas reales.',
    hint: '[ESPACIO] COMENZAR ASALTO'
  }
];

export class TowerDefenseTutorial {
  constructor(mode, ctx) {
    this.mode = mode;
    this.ctx = ctx;
    this.scene = ctx.scene;
    this.worldPhysics = ctx.worldPhysics;
    this.cfg = CORE_DEFENSE_CONFIG.TUTORIAL;
    this.active = true;
    this.destroyed = false;
    this.stepIndex = -1;
    this.step = null;
    this.unsubs = [];
    this.markerPulse = 0;
    this.markers = {};

    this.practiceEnemies = [];
    this.practiceSpawned = 0;
    this.practiceSpawnTimer = 0;
    this.practiceElapsed = 0;

    this.dom = {
      panel: document.getElementById('td-tutorial-panel'),
      step: document.getElementById('td-tutorial-step'),
      title: document.getElementById('td-tutorial-title'),
      text: document.getElementById('td-tutorial-text'),
      hint: document.getElementById('td-tutorial-hint')
    };

    this.buildMarkers();
    this.subscribe();
    if (this.dom.panel) this.dom.panel.classList.remove('hidden');
    this.enterStep(0);
  }

  subscribe() {
    this.unsubs.push(
      GameEvents.on('turret:built', () => {
        if (this.step && this.step.id === 'build') this.advance();
      }),
      GameEvents.on('turret:upgraded', payload => {
        if (!this.step) return;
        if (this.step.id === 'upgrade') {
          if (payload && payload.level >= 2) this.advance();
          else this.updateHint('NIVEL 1 COMPRADO · COMPRA EL SIGUIENTE PARA DESBLOQUEAR EL CAMBIO DE COMPORTAMIENTO');
        }
      })
    );
  }

  buildMarkers() {
    const spots = this.cfg.spots || {};
    const defs = {
      build: { color: 0x9caf6b, pos: spots.build },
      cryo: { color: 0x6f8f9c, pos: spots.cryo },
      mortar: { color: 0xa54a2a, pos: spots.mortar }
    };

    Object.entries(defs).forEach(([key, def]) => {
      if (!def.pos) return;
      const y = this.worldPhysics
        ? this.worldPhysics.getGroundHeight(def.pos.x, def.pos.z, 0)
        : 0;

      const group = new THREE.Group();
      group.position.set(def.pos.x, y, def.pos.z);

      const ringMat = new THREE.MeshBasicMaterial({
        color: def.color,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.38, 28), ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.05;

      const beamMat = new THREE.MeshBasicMaterial({
        color: def.color,
        transparent: true,
        opacity: 0.22,
        depthWrite: false
      });
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.4, 6), beamMat);
      beam.position.y = 1.7;

      group.add(ring, beam);
      group.visible = false;
      this.scene.add(group);

      this.markers[key] = { group, ring, ringMat, beamMat, baseColor: def.color };
    });
  }

  setMarkers(names) {
    const active = new Set(names || []);
    Object.entries(this.markers).forEach(([key, m]) => {
      m.group.visible = active.has(key);
    });
  }

  enterStep(index) {
    if (!this.active) return;
    if (index >= STEPS.length) {
      this.finish();
      return;
    }

    this.stepIndex = index;
    this.step = STEPS[index];
    this.setMarkers(this.step.markers);

    if (this.step.id === 'build') {
      this.mode.addScrap(this.cfg.startingBonusScrap || 0);
    } else if (this.step.id === 'upgrade') {
      this.mode.addScrap(24);
    } else if (this.step.id === 'synergy') {
      this.mode.addScrap(40);
    } else if (this.step.id === 'practice') {
      this.practiceEnemies = [];
      this.practiceSpawned = 0;
      this.practiceSpawnTimer = 0.3;
      this.practiceElapsed = 0;
    }

    this.renderPanel();
  }

  advance() {
    if (!this.active) return;
    this.enterStep(this.stepIndex + 1);
  }

  renderPanel() {
    if (!this.step) return;
    if (this.dom.step) {
      const n = Math.max(0, this.stepIndex);
      this.dom.step.textContent = this.step.id === 'intro' || this.step.id === 'done'
        ? 'TUTORIAL'
        : `PASO ${n} / ${STEPS.length - 2}`;
    }
    if (this.dom.title) this.dom.title.textContent = this.step.title;
    if (this.dom.text) this.dom.text.textContent = this.step.text;
    this.updateHint(this.step.hint);
  }

  updateHint(text) {
    if (!this.dom.hint) return;
    this.dom.hint.textContent = text || '';
  }

  update(dt, ctx) {
    if (!this.active) return;
    this.ctx = ctx;
    this.markerPulse += dt;

    Object.values(this.markers).forEach(m => {
      if (!m.group.visible) return;
      const pulse = 0.75 + Math.sin(this.markerPulse * 3.2) * 0.2;
      m.ringMat.opacity = 0.45 * pulse + 0.15;
      m.beamMat.opacity = 0.16 * pulse + 0.08;
      m.ring.scale.setScalar(0.98 + Math.sin(this.markerPulse * 2.1) * 0.04);
    });

    if (this.step.id === 'practice') {
      this.updatePractice(dt, ctx);
      return;
    }

    // Comprobaciones de respaldo por si el evento tarda un frame
    if (this.step.id === 'build') {
      if (this.mode.turretSystem.getTurretCount() > 0) this.advance();
    } else if (this.step.id === 'upgrade') {
      const upgraded = this.mode.turretSystem.getTurrets().some(t =>
        t.levels.some(level => level >= 2)
      );
      if (upgraded) this.advance();
    } else if (this.step.id === 'synergy') {
      const types = new Set(this.mode.turretSystem.getTurrets().map(t => t.cfg.id));
      if (types.has('cryo') && types.has('mortar')) this.advance();
    }
  }

  updatePractice(dt, ctx) {
    const total = this.cfg.practiceEnemyCount || 6;
    this.practiceElapsed += dt;

    if (this.practiceSpawned < total) {
      this.practiceSpawnTimer -= dt;
      if (this.practiceSpawnTimer <= 0) {
        this.practiceSpawnTimer = 0.8;
        this.spawnPracticeEnemy(ctx);
      }
    }

    let allCleared = true;
    for (const enemy of this.practiceEnemies) {
      if (!enemy._tutorialCleared) {
        if (!enemy.active || enemy.state === 'dead') {
          enemy._tutorialCleared = true;
        } else {
          allCleared = false;
        }
      }
    }

    if (this.practiceSpawned >= total && allCleared) {
      this.advance();
      return;
    }

    // Seguridad: si algo se atasca, no bloquear el tutorial indefinidamente
    if (this.practiceElapsed > 45) {
      this.clearPracticeEnemies();
      this.advance();
    }
  }

  spawnPracticeEnemy(ctx) {
    const total = this.cfg.practiceEnemyCount || 6;
    if (this.practiceSpawned >= total) return;

    const pathSystem = this.mode.pathSystem;
    const wp = pathSystem ? pathSystem.getWaypoint('path_north', 5) : { x: 0, y: 0, z: -12 };

    const enemy = ctx.enemyPool.spawn(
      'zombie',
      ctx.playerGroup.position,
      ctx.gameTime,
      ctx.camFwd,
      ctx.worldPhysics,
      null,
      {
        isDefenseMode: true,
        routeId: 'path_north',
        pathSystem,
        hpMult: 0.55,
        dmgMult: 0.4,
        spdMult: 0.85
      }
    );

    if (!enemy) return;
    this.practiceSpawned++;
    enemy.group.position.set(
      wp.x + (Math.random() - 0.5) * 1.6,
      wp.y,
      wp.z + (Math.random() - 0.5) * 1.2
    );
    if (enemy.defenseAI) {
      enemy.defenseAI.waypointIdx = 6;
      enemy.defenseAI.profile = {
        ...enemy.defenseAI.profile,
        coreDamage: 2,
        detectRadius: 5.0,
        abandonRadius: 7.0
      };
    }
    enemy._tutorialCleared = false;
    this.practiceEnemies.push(enemy);
  }

  clearPracticeEnemies() {
    if (!this.ctx || !this.ctx.damageEnemy) return;
    for (const enemy of this.practiceEnemies) {
      if (!enemy._tutorialCleared && enemy.active && enemy.state !== 'dead') {
        this.ctx.damageEnemy(enemy, 999999, null, true);
      }
      enemy._tutorialCleared = true;
    }
  }

  handleKey(key) {
    if (!this.active) return false;
    const k = (key || '').toLowerCase();

    if (k === 'f') {
      this.skip();
      return true;
    }

    if ((this.step.id === 'intro' || this.step.id === 'done') &&
        (k === ' ' || k === 'space' || k === 'enter')) {
      this.advance();
      return true;
    }

    return false;
  }

  skip() {
    if (!this.active) return;
    AudioSys.playUIClick();
    this.clearPracticeEnemies();
    this.finish();
  }

  finish() {
    if (!this.active) return;
    AudioSys.playUISelect();
    this.teardown();
  }

  teardown() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.active = false;

    if (this.dom.panel) this.dom.panel.classList.add('hidden');
    this.unsubs.forEach(unsub => unsub());
    this.unsubs.length = 0;

    Object.values(this.markers).forEach(m => {
      this.scene.remove(m.group);
      m.group.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
    });
    this.markers = {};

    if (this.mode.turretSystem) this.mode.cancelTurretPlacement();
    this.mode.tutorialActive = false;
    this.mode.tutorial = null;
  }

  destroy() {
    this.teardown();
  }
}
