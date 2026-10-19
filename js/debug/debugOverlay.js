import * as THREE from 'three';
import { CORE_DEFENSE_CONFIG } from '../config.js';
import { AudioSys } from '../audio.js';

// ============================================================================
// MODO DEBUG VISUAL 3D (Activable con F3 o tecla B en cualquier modo)
// Dibuja caminos, waypoints, radios de detección/abandono y línea de objetivo
// ============================================================================

export class DebugOverlay {
  constructor(scene) {
    this.scene = scene;
    this.enabled = false;
    this.rootGroup = new THREE.Group();
    this.rootGroup.visible = false;
    this.scene.add(this.rootGroup);

    this.staticPathsGroup = new THREE.Group();
    this.dynamicGroup = new THREE.Group();
    this.rootGroup.add(this.staticPathsGroup, this.dynamicGroup);

    this.unitCircleGeo = this.createUnitCircleGeometry(28);
    this.wpBoxGeo = new THREE.BoxGeometry(0.45, 1.4, 0.45);

    this.mats = {
      detectPlayer: new THREE.LineBasicMaterial({ color: 0xff3333 }),
      detectCore:   new THREE.LineBasicMaterial({ color: 0xf0c954 }),
      abandon:      new THREE.LineBasicMaterial({ color: 0x4da6ff }),
      linePlayer:   new THREE.LineBasicMaterial({ color: 0xff4444 }),
      lineCore:     new THREE.LineBasicMaterial({ color: 0x55ff55 }),
      wpMarker:     new THREE.MeshBasicMaterial({ color: 0x00ffcc, wireframe: true })
    };

    this.cachedModeId = null;
    this.badgeEl = null;
  }

  createUnitCircleGeometry(segments = 28) {
    const pts = [];
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }

  toggle() {
    this.enabled = !this.enabled;
    this.rootGroup.visible = this.enabled;
    AudioSys.playUIClick();

    if (!this.badgeEl) {
      this.badgeEl = document.createElement('div');
      this.badgeEl.id = 'debug-mode-indicator';
      this.badgeEl.className = 'scale-picker-box';
      this.badgeEl.style.borderColor = '#f0c954';
      this.badgeEl.style.color = '#f0c954';
      const topBar = document.getElementById('top-bar');
      if (topBar) topBar.prepend(this.badgeEl);
    }

    if (this.badgeEl) {
      this.badgeEl.style.display = this.enabled ? 'inline-flex' : 'none';
      this.badgeEl.innerHTML = '<span>DEBUG IA/RUTAS [B / F3]: <b>ACTIVO</b></span>';
    }

    if (!this.enabled) {
      this.clearDynamicMeshes();
    }
    return this.enabled;
  }

  rebuildStaticPaths(modeId, worldPhysics) {
    while (this.staticPathsGroup.children.length > 0) {
      const child = this.staticPathsGroup.children[0];
      this.staticPathsGroup.remove(child);
      if (child.geometry && child.geometry !== this.wpBoxGeo) child.geometry.dispose();
    }

    if (modeId !== 'core_defense') return;

    const routes = CORE_DEFENSE_CONFIG.PATHS.ROUTES;
    Object.values(routes).forEach(rCfg => {
      const pts = rCfg.waypoints.map(wp => {
        const y = worldPhysics ? worldPhysics.getGroundHeight(wp.x, wp.z, wp.y ?? 2.0) : (wp.y || 0);
        return new THREE.Vector3(wp.x, y + 0.25, wp.z);
      });

      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const lineMat = new THREE.LineBasicMaterial({ color: rCfg.color || 0x00ffcc });
      const routeLine = new THREE.Line(lineGeo, lineMat);
      this.staticPathsGroup.add(routeLine);

      pts.forEach(p => {
        const marker = new THREE.Mesh(this.wpBoxGeo, this.mats.wpMarker);
        marker.position.set(p.x, p.y + 0.5, p.z);
        this.staticPathsGroup.add(marker);
      });
    });

    // Anillo del radio de parada de ataque del Núcleo
    const coreStopRing = new THREE.Line(this.unitCircleGeo, this.mats.lineCore);
    const stopR = CORE_DEFENSE_CONFIG.CORE.attackStopDistance;
    coreStopRing.scale.set(stopR, 1, stopR);
    coreStopRing.position.set(0, 0.2, 0);
    this.staticPathsGroup.add(coreStopRing);
  }

  clearDynamicMeshes() {
    while (this.dynamicGroup.children.length > 0) {
      const child = this.dynamicGroup.children[0];
      this.dynamicGroup.remove(child);
      if (child.userData.disposeGeo && child.geometry) {
        child.geometry.dispose();
      }
    }
  }

  update(modeId, enemyPool, playerPos, corePos, worldPhysics) {
    if (!this.enabled) return;

    if (this.cachedModeId !== modeId) {
      this.cachedModeId = modeId;
      this.rebuildStaticPaths(modeId, worldPhysics);
    }

    this.clearDynamicMeshes();

    const activeEnemies = enemyPool.active;
    for (let i = 0; i < activeEnemies.length; i++) {
      const e = activeEnemies[i];
      if (!e.active || e.state === 'dead') continue;

      const ePos = e.group.position;
      const yLift = ePos.y + 0.14;

      if (e.defenseAI && e.defenseAI.enabled) {
        const prof = e.defenseAI.profile;
        const isTargetingPlayer = e.defenseAI.targetKind === 'player';

        // 1. Círculo de Radio de Detección (o Core Override si ya ataca el núcleo)
        const activeDetectR = e.defenseAI.isAttackingCore
          ? prof.coreOverrideRadius
          : prof.detectRadius;
        const detectRing = new THREE.Line(
          this.unitCircleGeo,
          isTargetingPlayer ? this.mats.detectPlayer : this.mats.detectCore
        );
        detectRing.scale.set(activeDetectR, 1, activeDetectR);
        detectRing.position.set(ePos.x, yLift, ePos.z);
        this.dynamicGroup.add(detectRing);

        // 2. Círculo de Radio de Abandono (Azul)
        const abandonRing = new THREE.Line(this.unitCircleGeo, this.mats.abandon);
        abandonRing.scale.set(prof.abandonRadius, 1, prof.abandonRadius);
        abandonRing.position.set(ePos.x, yLift + 0.04, ePos.z);
        this.dynamicGroup.add(abandonRing);

        // 3. Línea hacia su objetivo actual (Rojo = Jugador, Verde = Núcleo/Waypoint)
        const targetVec = isTargetingPlayer
          ? playerPos.clone().add(new THREE.Vector3(0, 1.0, 0))
          : (corePos ? corePos.clone().add(new THREE.Vector3(0, 2.2, 0)) : new THREE.Vector3(0, 2.2, 0));

        const targetLineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(ePos.x, ePos.y + 1.1, ePos.z),
          targetVec
        ]);
        const targetLine = new THREE.Line(
          targetLineGeo,
          isTargetingPlayer ? this.mats.linePlayer : this.mats.lineCore
        );
        targetLine.userData.disposeGeo = true;
        this.dynamicGroup.add(targetLine);
      } else {
        // En modo Supervivencia muestra la línea directa hacia el jugador y el radio de visión del Weeper
        if (e.type === 'weeper') {
          const weeperRing = new THREE.Line(this.unitCircleGeo, this.mats.detectPlayer);
          weeperRing.scale.set(13, 1, 13);
          weeperRing.position.set(ePos.x, yLift, ePos.z);
          this.dynamicGroup.add(weeperRing);
        }

        const survLineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(ePos.x, ePos.y + 1.0, ePos.z),
          playerPos.clone().add(new THREE.Vector3(0, 1.0, 0))
        ]);
        const survLine = new THREE.Line(survLineGeo, this.mats.linePlayer);
        survLine.userData.disposeGeo = true;
        this.dynamicGroup.add(survLine);
      }
    }
  }
}