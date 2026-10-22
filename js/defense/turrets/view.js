// Vista de torreta: halo, destello de disparo, barra de vida y actualización visual.
// Exports: buildBillboard, buildMuzzleFlash, buildHealthBar, updateHealthBar.

import * as THREE from 'three';

export function buildBillboard(turret) {
  // Las torretas ahora son modelos 3D completos con texturas y calcomanías industriales.
  // Ya no se utiliza el recorte 2D de billboard flotante que causaba colisión visual.
}

export function buildMuzzleFlash(turret) {
  if (!turret.muzzleFlashMat) return;
  const flashSize = turret.cfg.id === 'mortar'
    ? 1.15
    : turret.cfg.id === 'railgun'
      ? 1.0
      : 0.72;
  const geo = new THREE.PlaneGeometry(flashSize, flashSize);
  const mesh = new THREE.Mesh(geo, turret.muzzleFlashMat);
  mesh.visible = false;
  mesh.position.set(0, turret.muzzleHeight || 0.9, -(turret.muzzleForward || 0.85));
  turret.modelRoot.add(mesh);
  turret.muzzleFlashMesh = mesh;
}

export function buildHealthBar(turret) {
  turret.hpBarGroup = new THREE.Group();
  turret.hpBarGroup.position.y = (turret.cfg.base.height || 1.6) + 0.35;

  const bgMat = new THREE.MeshBasicMaterial({
    color: 0x050605, transparent: true, opacity: 0.85, depthTest: false
  });
  const fillMat = new THREE.MeshBasicMaterial({
    color: turret.cfg.color, transparent: true, opacity: 0.95, depthTest: false
  });

  const bg = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.085), bgMat);
  bg.renderOrder = 20;
  const fill = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.055), fillMat);
  fill.position.z = 0.002;
  fill.renderOrder = 21;

  turret.hpBarBg = bg;
  turret.hpBarFill = fill;
  turret.hpBarGroup.add(bg, fill);
  turret.hpBarGroup.visible = false;
  turret.group.add(turret.hpBarGroup);
}

export function updateHealthBar(turret, cameraPos) {
  const ratio = Math.max(0, turret.hp / Math.max(1, turret.maxHp));
  turret.hpBarGroup.visible = ratio < 0.999;
  if (!turret.hpBarGroup.visible) return;

  const angle = Math.atan2(
    cameraPos.x - turret.group.position.x,
    cameraPos.z - turret.group.position.z
  );
  turret.hpBarGroup.rotation.y = angle;

  turret.hpBarFill.scale.x = Math.max(0.001, ratio);
  turret.hpBarFill.position.x = -(0.86 - 0.86 * ratio) * 0.5;
}
