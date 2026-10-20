// Materiales y ensamblaje del modelo 3D común de torretas.
// Exports: buildMaterials, buildModel.

import * as THREE from 'three';
import { SpriteSheets } from '../../../spritesheets.js';
import { MODEL_BUILDERS } from './registry.js';
import {
  getHazardTexture,
  getTechPanelTexture,
  getGaugeTexture,
  getTurretDecalTexture,
  getMuzzleFlashTexture
} from '../../../sprites/turret/turretTextures.js';

export function buildMaterials(turret) {
  const metalTex = SpriteSheets.env.metal.tex;
  const crateTex = SpriteSheets.env.crate.tex;

  turret.bodyMat = new THREE.MeshStandardMaterial({
    map: metalTex, color: 0x3a3126, roughness: 0.86, metalness: 0.42
  });
  turret.darkMat = new THREE.MeshStandardMaterial({
    map: crateTex, color: 0x241d16, roughness: 0.92, metalness: 0.3
  });
  turret.rustMat = new THREE.MeshStandardMaterial({
    map: crateTex, color: 0x4a2c1d, roughness: 0.9, metalness: 0.25
  });
  turret.accentMat = new THREE.MeshStandardMaterial({
    color: turret.cfg.color,
    emissive: turret.cfg.color,
    emissiveIntensity: 0.6,
    roughness: 0.5,
    metalness: 0.3
  });
  turret.glowMat = new THREE.MeshBasicMaterial({ color: turret.cfg.color });

  // Materiales de detalle con texturas y calcomanías pixel-art
  const hazardTex = getHazardTexture();
  turret.hazardMat = new THREE.MeshStandardMaterial({
    map: hazardTex, roughness: 0.82, metalness: 0.35
  });

  const panelTex = getTechPanelTexture();
  turret.panelMat = new THREE.MeshStandardMaterial({
    map: panelTex, roughness: 0.85, metalness: 0.4
  });

  const gaugeTex = getGaugeTexture('#' + turret.cfg.color.toString(16).padStart(6, '0'));
  turret.gaugeMat = new THREE.MeshBasicMaterial({
    map: gaugeTex, transparent: true
  });

  const decalTex = getTurretDecalTexture(turret.cfg.id);
  turret.decalMat = new THREE.MeshBasicMaterial({
    map: decalTex, transparent: true
  });

  const flashTex = getMuzzleFlashTexture(turret.cfg.id);
  turret.muzzleFlashMat = new THREE.MeshBasicMaterial({
    map: flashTex,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    side: THREE.DoubleSide
  });
}

export function buildModel(turret) {
  const r = turret.cfg.base.collisionRadius;

  // 1. Pedestal común ANCLADO AL SUELO (en baseRoot, NO rota al apuntar)
  // Base octagonal biselada pesada
  turret.addBasePart(
    new THREE.CylinderGeometry(r * 1.35, r * 1.6, 0.28, 8),
    turret.darkMat, 0, 0.14, 0
  );

  // 4 garras / patas estabilizadoras atornilladas al suelo en las diagonales
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
    turret.addBasePart(
      new THREE.BoxGeometry(0.2, 0.22, 0.38),
      turret.rustMat,
      Math.cos(a) * r * 1.35, 0.11, Math.sin(a) * r * 1.35,
      0, -a, 0
    );
    // Perno de anclaje de acero
    turret.addBasePart(
      new THREE.CylinderGeometry(0.04, 0.04, 0.26, 6),
      turret.bodyMat,
      Math.cos(a) * r * 1.45, 0.15, Math.sin(a) * r * 1.45
    );
  }

  // Anillo perimetral de franjas de advertencia industrial (hazard stripes)
  const hazardRing = new THREE.Mesh(
    new THREE.TorusGeometry(r * 1.38, 0.038, 6, 24),
    turret.hazardMat
  );
  hazardRing.rotation.x = Math.PI / 2;
  hazardRing.position.y = 0.28;
  turret.baseRoot.add(hazardRing);

  // Anillo interior de conducto de energía luminosa
  const glowRing = new THREE.Mesh(
    new THREE.TorusGeometry(r * 1.15, 0.026, 6, 16),
    turret.glowMat
  );
  glowRing.rotation.x = Math.PI / 2;
  glowRing.position.y = 0.29;
  turret.baseRoot.add(glowRing);

  // Plato giratorio central (engranaje de rotación donde apoya el cabezal)
  turret.addBasePart(
    new THREE.CylinderGeometry(r * 0.88, r * 0.95, 0.1, 12),
    turret.bodyMat, 0, 0.33, 0
  );

  // 2. Cabezal giratorio (en modelRoot, gira suavemente para seguir a los objetivos)
  // Montura de pivote que asienta sobre el plato giratorio
  turret.addPart(
    new THREE.CylinderGeometry(r * 0.72, r * 0.82, 0.12, 10),
    turret.rustMat, 0, 0.41, 0
  );

  // Construir las piezas específicas de cada torreta
  const builder = MODEL_BUILDERS[turret.cfg.id];
  if (builder) builder(turret);
}
