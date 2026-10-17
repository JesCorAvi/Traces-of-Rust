import * as THREE from 'three';
import { SpriteSheets } from './spritesheets.js';

// Crea un Billboard 2D con su propio clon de textura UV para animar los 16 frames
// + capa emisiva para ojos brillantes en la oscuridad + sombra proyectada real
export function createBillboardSprite(sheetKey, size = 2.0) {
  const sheet = SpriteSheets[sheetKey];
  const group = new THREE.Group();

  const tex = sheet.tex.clone();
  tex.needsUpdate = true;
  tex.repeat.set(0.25, 0.25);

  const glowTex = sheet.glowTex.clone();
  glowTex.needsUpdate = true;
  glowTex.repeat.set(0.25, 0.25);

  const geo = new THREE.PlaneGeometry(size, size);

  // Capa principal que recibe luz 3D y proyecta sombra recortada (alphaTest: 0.5)
  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    alphaTest: 0.5,
    transparent: true,
    roughness: 0.88,
    side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = size * 0.5;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.customDepthMaterial = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
    map: tex,
    alphaTest: 0.5
  });

  // Capa emisiva (ojos y dientes que brillan en la oscuridad/niebla)
  const glowMat = new THREE.MeshBasicMaterial({
    map: glowTex,
    alphaTest: 0.5,
    transparent: true,
    side: THREE.DoubleSide
  });
  const glowMesh = new THREE.Mesh(geo, glowMat);
  glowMesh.position.y = size * 0.5;

  // Sombra de contacto suave bajo los pies en el suelo 3D
  const shadowDisc = new THREE.Mesh(
    new THREE.CircleGeometry(size * 0.32, 12),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.58 })
  );
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.02;

  group.add(mesh, glowMesh, shadowDisc);

  return {
    group,
    mesh,
    glowMesh,
    tex,
    glowTex,
    row: 0,
    col: 0,
    animTimer: Math.random(),
    setFrame(row, col) {
      this.row = row;
      this.col = col % 4;
      const u = this.col * 0.25;
      const v = 0.75 - this.row * 0.25;
      this.tex.offset.set(u, v);
      this.glowTex.offset.set(u, v);
    },
    faceCamera(camPos) {
      const angle = Math.atan2(camPos.x - this.group.position.x, camPos.z - this.group.position.z);
      this.mesh.rotation.y = angle;
      this.glowMesh.rotation.y = angle;
    }
  };
}

export class Enemy {
  constructor(type, scene, playerPos, gameTime, playerFwd = new THREE.Vector3(0, 0, -1)) {
    this.type = type;
    const scale = 1 + (gameTime / 60) * 0.45;
    const size = type === 'boss' ? 3.8 : type === 'weeper' ? 2.5 : 2.0;

    this.hp = (type === 'boss' ? 400 : type === 'weeper' ? 52 : type === 'worm' ? 36 : 22) * scale;
    this.maxHp = this.hp;
    this.dmg = type === 'boss' ? 30 : type === 'weeper' ? 20 : 13;
    // Velocidad ajustada para poder esquivar y reaccionar
    this.speed = type === 'weeper' ? 7.6 : type === 'boss' ? 3.8 : 4.6;

    this.billboard = createBillboardSprite(type, size);
    this.group = this.billboard.group;

    this.state = 'walk'; // 'idle' | 'walk' | 'attack' | 'hurt' | 'dead'
    this.stateTimer = 0;
    this.stepAccum = 0;
    this.attackCharge = 0; // Tiempo preparando el golpe antes de dañar
    this.hasTriggeredScare = false;

    // El Observador (weeper) aparece en el arco frontal del jugador para no atacar a traición por la espalda
    let ang;
    if (type === 'weeper') {
      const baseAng = Math.atan2(playerFwd.x, playerFwd.z);
      ang = baseAng + (Math.random() - 0.5) * 1.4;
    } else {
      ang = Math.random() * Math.PI * 2;
    }

    const dist = 25 + Math.random() * 12;
    this.group.position.set(
      playerPos.x + Math.sin(ang) * dist,
      0,
      playerPos.z + Math.cos(ang) * dist
    );
    this.billboard.setFrame(1, 0);
    scene.add(this.group);
  }

  update(dt, playerPos, playerFwd, camPos, onScare, onDealDamage) {
    this.billboard.faceCamera(camPos);

    if (this.state === 'dead') {
      this.stateTimer += dt;
      const frame = Math.min(3, Math.floor(this.stateTimer * 8));
      this.billboard.setFrame(3, frame);
      return this.stateTimer > 0.55;
    }

    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.group.position);
    const dist = toPlayer.length();
    let moveSpd = this.speed;
    let targetRow = 1; // Fila 1: WALK

    // El Observador (weeper): se congela cuando lo miras (cono amplio de 0.95 rad)
    if (this.type === 'weeper') {
      const dirToEnemy = toPlayer.clone().negate().normalize();
      const watched = playerFwd.angleTo(dirToEnemy) < 0.95 && dist < 26;
      if (watched) {
        moveSpd = 0;
        targetRow = 0; // Fila 0: IDLE
        this.attackCharge = 0;
      } else if (!this.hasTriggeredScare && dist < 13 && dist > 8) {
        // Susto a distancia segura (>8m) para que dé miedo pero no sea un golpe inevitable
        this.hasTriggeredScare = true;
        this.group.position.add(toPlayer.clone().normalize().multiplyScalar(1.1));
        if (onScare) onScare();
      }
    }

    // Aturdimiento al recibir daño
    if (this.state === 'hurt') {
      this.stateTimer -= dt;
      moveSpd *= 0.2;
      targetRow = 3;
      if (this.stateTimer <= 0) this.state = 'walk';
    }

    // Ventana de esquiva (Attack Wind-up de 0.35s antes de conectar el golpe)
    if (dist < 1.65 && moveSpd > 0 && this.state !== 'hurt') {
      targetRow = 2; // Animación de ataque
      moveSpd *= 0.25;
      this.attackCharge += dt;

      if (this.attackCharge >= 0.35) {
        this.attackCharge = -0.55; // Enfriamiento tras atacar
        if (dist < 1.75 && onDealDamage) onDealDamage(this);
      }
    } else {
      this.attackCharge = Math.max(0, this.attackCharge - dt * 2);
    }

    // Movimiento entrecortado tipo stop-motion
    this.stepAccum += dt;
    const tickRate = this.type === 'weeper' ? 0.06 : 0.085;
    if (this.stepAccum >= tickRate) {
      const stepDt = this.stepAccum;
      this.stepAccum = 0;

      if (moveSpd > 0 && dist > 1.1) {
        toPlayer.y = 0;
        toPlayer.normalize();
        this.group.position.add(toPlayer.multiplyScalar(moveSpd * stepDt));
      }

      this.billboard.animTimer += stepDt * (targetRow === 2 ? 10 : 6);
      const col = Math.floor(this.billboard.animTimer) % 4;
      this.billboard.setFrame(targetRow, col);

      // Glitch sutil de silueta
      if (Math.random() < 0.06) {
        this.billboard.mesh.scale.set(1.12, 0.92, 1);
      } else {
        this.billboard.mesh.scale.set(1, 1, 1);
      }
    }

    return false;
  }
}