import * as THREE from 'three';
import { SpriteSheets } from './spritesheets.js';
import { AudioSys } from './audio.js';

export function executeSawSlash(scene, playerPos, yaw, level, dmgMult, enemies, vfx, onDamage) {
  const size = 2.8 + level * 0.4;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({
      map: SpriteSheets.env.slash.tex,
      transparent: true,
      alphaTest: 0.2,
      side: THREE.DoubleSide
    })
  );
  const fwd = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
  mesh.position.copy(playerPos).add(fwd.clone().multiplyScalar(1.7));
  mesh.position.y = 1.05;
  scene.add(mesh);
  vfx.push({ mesh, life: 0.16, maxLife: 0.16, billboard: true });
  AudioSys.play(210, 0.11, 'sawtooth', 0.06);

  const dmg = 26 * dmgMult * (1 + level * 0.3);
  enemies.forEach(e => {
    if (e.state === 'dead') return;
    const toE = new THREE.Vector3().subVectors(e.group.position, playerPos);
    if (toE.length() < 4.3 + level * 0.35 && fwd.angleTo(toE.clone().normalize()) < 1.15) {
      onDamage(e, dmg, toE.normalize().multiplyScalar(1.6));
    }
  });
}

export function fireBuckshot(scene, playerPos, level, dmgMult, enemies, vfx, onDamage, triggerFlash) {
  const alive = enemies.filter(e => e.state !== 'dead');
  if (!alive.length) return;

  // Apunta hacia el enemigo más cercano dentro de 16m
  const closest = alive.reduce((a, b) =>
    a.group.position.distanceTo(playerPos) < b.group.position.distanceTo(playerPos) ? a : b
  );
  if (closest.group.position.distanceTo(playerPos) > 16) return;

  // Sonido potente de escopeta en capas (grave + chasquido metálico)
  AudioSys.play(75, 0.24, 'sawtooth', 0.11);
  AudioSys.play(260, 0.09, 'square', 0.07);
  if (triggerFlash) triggerFlash();

  // Dirección central del disparo y posición de la boca del cañón
  const baseDir = new THREE.Vector3()
    .subVectors(closest.group.position, playerPos)
    .setY(0)
    .normalize();
  const rightDir = new THREE.Vector3(-baseDir.z, 0, baseDir.x);
  const muzzlePos = playerPos.clone()
    .add(baseDir.clone().multiplyScalar(0.9))
    .add(new THREE.Vector3(0, 1.15, 0));

  // 1. Fogonazo de luz 3D + destello visual en la boca del cañón
  const flashGroup = new THREE.Group();
  flashGroup.position.copy(muzzlePos);
  const flashLight = new THREE.PointLight(0xffaa33, 180, 14, 1.5);
  const flashSprite = new THREE.Mesh(
    new THREE.PlaneGeometry(1.3, 1.3),
    new THREE.MeshBasicMaterial({ color: 0xffe699, transparent: true, opacity: 0.95, side: THREE.DoubleSide })
  );
  flashGroup.add(flashLight, flashSprite);
  scene.add(flashGroup);
  vfx.push({ mesh: flashGroup, life: 0.08, maxLife: 0.08, billboard: true, scaleSpeed: 6 });

  // 2. Expulsión del cartucho rojo calibre 12 (estilo Buckshot Roulette)
  const shell = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.22, 0.1),
    new THREE.MeshBasicMaterial({ color: 0xa52020 })
  );
  shell.position.copy(muzzlePos);
  scene.add(shell);
  vfx.push({
    mesh: shell,
    life: 1.1,
    vel: rightDir.clone().multiplyScalar(3.5 + Math.random() * 1.5).add(new THREE.Vector3(0, 4.2, 0)),
    gravity: 16,
    spin: { x: 18, z: 14 }
  });

  // 3. Bocanadas de humo de pólvora
  for (let s = 0; s < 3; s++) {
    const smoke = new THREE.Mesh(
      new THREE.PlaneGeometry(0.55, 0.55),
      new THREE.MeshBasicMaterial({ color: 0x877a5c, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
    );
    smoke.position.copy(muzzlePos).add(baseDir.clone().multiplyScalar(0.4 + s * 0.35));
    scene.add(smoke);
    vfx.push({
      mesh: smoke,
      life: 0.35,
      maxLife: 0.35,
      billboard: true,
      fade: true,
      scaleSpeed: 2.8,
      vel: baseDir.clone().multiplyScalar(2.2).add(new THREE.Vector3((Math.random() - 0.5) * 1.2, 1.4, (Math.random() - 0.5) * 1.2))
    });
  }

  // 4. Abanico de perdigones individuales (9 postas en Nv.1 hasta 17 en Nv.5)
  const pelletCount = 7 + level * 2;
  const spreadArc = 0.52 + level * 0.04;
  const maxRange = 14.5;
  const dmgPerPellet = (9.5 + level * 2.2) * dmgMult;

  for (let i = 0; i < pelletCount; i++) {
    const t = pelletCount > 1 ? (i / (pelletCount - 1)) - 0.5 : 0;
    const yawOffset = t * spreadArc + (Math.random() - 0.5) * 0.08;
    const pelletDir = baseDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), yawOffset);
    pelletDir.y = (Math.random() - 0.5) * 0.14;
    pelletDir.normalize();

    let hitEnemy = null;
    let hitDist = maxRange * (0.82 + Math.random() * 0.25);

    alive.forEach(e => {
      const toE = new THREE.Vector3().subVectors(e.group.position, muzzlePos);
      toE.y = 0;
      const horizDir = new THREE.Vector3(pelletDir.x, 0, pelletDir.z).normalize();
      const forwardDist = toE.dot(horizDir);
      if (forwardDist > 0.4 && forwardDist < hitDist) {
        const perpDist = toE.clone().sub(horizDir.multiplyScalar(forwardDist)).length();
        if (perpDist < 0.95) {
          hitDist = forwardDist;
          hitEnemy = e;
        }
      }
    });

    const endPos = muzzlePos.clone().add(pelletDir.clone().multiplyScalar(hitDist));

    // Estela incandescente de cada posta
    const tracerMat = new THREE.LineBasicMaterial({
      color: i % 2 === 0 ? 0xffe699 : 0xd97724,
      transparent: true,
      opacity: 0.9
    });
    const tracer = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([muzzlePos.clone(), endPos]),
      tracerMat
    );
    scene.add(tracer);
    vfx.push({ mesh: tracer, life: 0.14, maxLife: 0.14, fade: true });

    // Perdigón físico viajando a alta velocidad por el aire
    const pelletMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.14, 0.14),
      new THREE.MeshBasicMaterial({ color: 0xfff0b3 })
    );
    pelletMesh.position.copy(muzzlePos);
    scene.add(pelletMesh);
    const speed = 52 + Math.random() * 14;
    vfx.push({
      mesh: pelletMesh,
      life: Math.min(0.22, hitDist / speed),
      vel: pelletDir.clone().multiplyScalar(speed)
    });

    // Impacto del perdigón: daño, empuje y salpicadura de sangre/chispas
    if (hitEnemy) {
      const knock = pelletDir.clone().setY(0).normalize().multiplyScalar(0.45);
      onDamage(hitEnemy, dmgPerPellet, knock);

      const spark = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.22, 0.22),
        new THREE.MeshBasicMaterial({ color: 0xa52020 })
      );
      spark.position.copy(endPos);
      scene.add(spark);
      vfx.push({
        mesh: spark,
        life: 0.22,
        vel: new THREE.Vector3((Math.random() - 0.5) * 4, 2 + Math.random() * 2, (Math.random() - 0.5) * 4),
        gravity: 14
      });
    }
  }
}

export function fireDefibrillator(scene, playerPos, level, dmgMult, enemies, vfx, onDamage) {
  const near = enemies
    .filter(e => e.state !== 'dead' && e.group.position.distanceTo(playerPos) < 13)
    .slice(0, 2 + level);
  if (!near.length) return;

  AudioSys.play(480, 0.14, 'sawtooth', 0.06);
  const pts = [playerPos.clone().add(new THREE.Vector3(0, 1.1, 0))];
  near.forEach(e => {
    pts.push(e.group.position.clone().add(new THREE.Vector3(0, 1.1, 0)));
    onDamage(e, 24 * dmgMult * (1 + level * 0.25));
  });
  const bolt = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: 0xb89c46 })
  );
  scene.add(bolt);
  vfx.push({ mesh: bolt, life: 0.12 });
}