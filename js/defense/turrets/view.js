// Vista de torreta: billboard, halo, barra de vida y actualización visual.
// Exports: buildBillboard, buildHealthBar, updateHealthBar.

import * as THREE from 'three';
import { createBillboardSprite } from '../../entities.js';

export function buildBillboard(turret) {
const sprite = createBillboardSprite(turret.cfg.spriteKey, turret.cfg.spriteSize);
sprite.shadowDisc.visible = false;
sprite.shadowDisc.userData.sharedGeo = true;
sprite.shadowDisc.userData.sharedMat = true;
sprite.mesh.castShadow = false;
sprite.mesh.receiveShadow = false;
// Emisión suave para que la torreta se lea en la oscuridad sin convertirse en una luz
const mat = sprite.mesh.material;
mat.emissive = new THREE.Color(turret.cfg.color);
mat.emissiveMap = sprite.tex;
mat.emissiveIntensity = 0.55;
mat.needsUpdate = true;
sprite.glowMesh.visible = true;
sprite.group.position.y = turret.cfg.base.height * 0.55;
sprite.setDirectionalFrame(0, 0, 0);
turret.group.add(sprite.group);
turret.sprite = sprite;
turret.spriteMountY = turret.cfg.base.height * 0.55;
}

export function buildHealthBar(turret) {
turret.hpBarGroup = new THREE.Group();
turret.hpBarGroup.position.y = turret.spriteMountY + turret.cfg.spriteSize + 0.24;

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
