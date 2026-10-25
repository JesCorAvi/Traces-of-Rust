// Modelos 3D cartoon de alta calidad con MeshToonMaterial y contorno por inverted hull.
// Diseñados con estética artesanal y detallada del Chiringuito: madera tallada,
// latón náutico, hierro forjado, marisco fresco y motivos caribeños.
// AssetFactory los clona y los cachea; este módulo construye plantillas optimizadas.
// Exports: MODEL_IDS, createModelFactory.

import * as THREE from 'three';
import { PALETTE } from './palette.js';

const OUTLINE_SCALE = 1.055;

function createGradientMap() {
  const data = new Uint8Array([50, 110, 185, 255]);
  const texture = new THREE.DataTexture(data, 4, 1, THREE.RedFormat);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

function createModelBuilders(api) {
  const { mat, mesh, group, THREE: T } = api;

  // -------------------------------------------------------------------------
  // 1. Cangrejo Playero Caribeño (El icono del juego)
  // -------------------------------------------------------------------------
  function crab() {
    const root = group('crab');

    // Caparazón acorazado (cúpula dorsal abombada)
    const shellGeo = new T.SphereGeometry(0.58, 20, 14);
    shellGeo.scale(1.28, 0.52, 0.94);
    const shellMat = mat(PALETTE.coral);
    const shell = new T.Mesh(shellGeo, shellMat);
    shell.position.y = 0.42;
    root.add(mesh(shell, 0.045));

    // Placa dorsal superior iluminada con motas de armadura
    const crestGeo = new T.SphereGeometry(0.42, 16, 10);
    crestGeo.scale(1.15, 0.38, 0.78);
    const crest = new T.Mesh(crestGeo, mat(PALETTE.coralLight));
    crest.position.set(0, 0.49, -0.04);
    root.add(mesh(crest, 0));

    // Borde perimetral acanalado (ribete de la coraza)
    const rim = new T.Mesh(new T.TorusGeometry(0.56, 0.038, 6, 24), mat(PALETTE.coralDark));
    rim.rotation.x = Math.PI / 2;
    rim.scale.set(1.24, 0.92, 1);
    rim.position.y = 0.36;
    root.add(mesh(rim, 0));

    // Vientre de color crema
    const bellyGeo = new T.SphereGeometry(0.52, 16, 10);
    bellyGeo.scale(1.18, 0.32, 0.88);
    const belly = new T.Mesh(bellyGeo, mat(PALETTE.cream));
    belly.position.y = 0.32;
    root.add(mesh(belly, 0));

    // Pedúnculos y ojos saltones caribeños
    const eyeStemMat = mat(PALETTE.coralDark);
    const eyeWhiteMat = mat(PALETTE.salt);
    const pupilMat = mat(PALETTE.ink);

    for (const side of [-1, 1]) {
      const stem = new T.Mesh(new T.CylinderGeometry(0.035, 0.045, 0.28, 8), eyeStemMat);
      stem.position.set(side * 0.18, 0.62, 0.36);
      stem.rotation.x = -0.18;
      stem.rotation.z = side * 0.18;
      root.add(mesh(stem, 0.02));

      // Esfera blanca del ojo
      const eye = new T.Mesh(new T.SphereGeometry(0.12, 14, 10), eyeWhiteMat);
      eye.position.set(side * 0.22, 0.76, 0.38);
      root.add(mesh(eye, 0.03));

      // Pupila negra viva con destello
      const pupil = new T.Mesh(new T.SphereGeometry(0.06, 10, 8), pupilMat);
      pupil.position.set(side * 0.22, 0.76, 0.48);
      root.add(mesh(pupil, 0));

      const glint = new T.Mesh(new T.SphereGeometry(0.022, 6, 5), eyeWhiteMat);
      glint.position.set(side * 0.24, 0.79, 0.52);
      root.add(mesh(glint, 0));
    }

    // Boca y mandíbulas frontales
    const mouth = new T.Mesh(new T.BoxGeometry(0.18, 0.06, 0.06), mat(PALETTE.tomatoDark));
    mouth.position.set(0, 0.34, 0.48);
    root.add(mesh(mouth, 0));

    // Brazos y pinzas titánicas articuladas
    const armMat = mat(PALETTE.coralDark);
    const clawMat = mat(PALETTE.coral);
    const tipMat = mat(PALETTE.pineapple);

    for (const side of [-1, 1]) {
      // Hombro
      const shoulder = new T.Mesh(new T.SphereGeometry(0.1, 10, 8), armMat);
      shoulder.position.set(side * 0.52, 0.38, 0.24);
      root.add(mesh(shoulder, 0.02));

      // Brazo superior
      const upperArm = new T.Mesh(new T.CylinderGeometry(0.075, 0.09, 0.36, 10), armMat);
      upperArm.rotation.z = side * -0.75;
      upperArm.rotation.y = side * 0.35;
      upperArm.position.set(side * 0.68, 0.44, 0.32);
      root.add(mesh(upperArm, 0.03));

      // Codo articulado
      const elbow = new T.Mesh(new T.SphereGeometry(0.11, 10, 8), clawMat);
      elbow.position.set(side * 0.84, 0.52, 0.38);
      root.add(mesh(elbow, 0.02));

      // Antebrazo hacia adelante
      const forearm = new T.Mesh(new T.CylinderGeometry(0.095, 0.12, 0.38, 10), clawMat);
      forearm.rotation.x = Math.PI / 2 - 0.2;
      forearm.rotation.z = side * -0.25;
      forearm.position.set(side * 0.82, 0.52, 0.54);
      root.add(mesh(forearm, 0.03));

      // Bulbo de la pinza
      const clawBulbGeo = new T.SphereGeometry(0.24, 14, 10);
      clawBulbGeo.scale(1.2, 0.85, 1);
      const clawBulb = new T.Mesh(clawBulbGeo, clawMat);
      clawBulb.position.set(side * 0.78, 0.54, 0.78);
      root.add(mesh(clawBulb, 0.04));

      // Dedos en tijera de la pinza con dientes afilados
      // Dedo fijo superior
      const dFixed = new T.Mesh(new T.ConeGeometry(0.09, 0.34, 8), tipMat);
      dFixed.rotation.x = Math.PI / 2 + 0.15;
      dFixed.rotation.z = side * -0.25;
      dFixed.position.set(side * 0.74, 0.61, 0.98);
      root.add(mesh(dFixed, 0.03));

      // Dedo móvil inferior
      const dMov = new T.Mesh(new T.ConeGeometry(0.075, 0.3, 8), tipMat);
      dMov.rotation.x = Math.PI / 2 - 0.25;
      dMov.rotation.z = side * 0.15;
      dMov.position.set(side * 0.74, 0.47, 0.96);
      root.add(mesh(dMov, 0.03));
    }

    // 6 Patas marchadoras (3 por lado, articuladas en 2 segmentos)
    const legMat = mat(PALETTE.coral);
    const jointMat = mat(PALETTE.coralDark);

    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const angle = 0.15 - i * 0.32;
        const startX = side * 0.44;
        const startZ = (i - 1) * 0.26;

        // Fémur ascendente
        const femur = new T.Mesh(new T.CylinderGeometry(0.048, 0.06, 0.38, 8), legMat);
        femur.rotation.z = side * -0.95;
        femur.rotation.y = angle;
        femur.position.set(startX + side * 0.16, 0.38, startZ);
        root.add(mesh(femur, 0.02));

        // Articulación de la rodilla
        const knee = new T.Mesh(new T.SphereGeometry(0.058, 8, 6), jointMat);
        knee.position.set(startX + side * 0.32, 0.48, startZ + Math.sin(angle) * 0.12);
        root.add(mesh(knee, 0));

        // Tibia descendente hasta la arena
        const tibia = new T.Mesh(new T.ConeGeometry(0.05, 0.52, 8), legMat);
        tibia.rotation.z = side * 0.55;
        tibia.rotation.y = angle;
        tibia.position.set(startX + side * 0.44, 0.24, startZ + Math.sin(angle) * 0.22);
        root.add(mesh(tibia, 0.025));

        // Punta dorada de la uña
        const clawTip = new T.Mesh(new T.SphereGeometry(0.028, 6, 5), tipMat);
        clawTip.position.set(startX + side * 0.56, 0.02, startZ + Math.sin(angle) * 0.3);
        root.add(mesh(clawTip, 0));
      }
    }

    return root;
  }

  // -------------------------------------------------------------------------
  // 2. Machete Playero Caribeño
  // -------------------------------------------------------------------------
  function knife() {
    const root = group('knife');

    // Hoja con perfil de machete caribeño (panza curva y punta para desmigar)
    const bladeShape = new T.Shape();
    bladeShape.moveTo(-0.9, 0.0);
    bladeShape.lineTo(-0.9, 0.18);
    bladeShape.lineTo(0.5, 0.18);
    bladeShape.quadraticCurveTo(0.88, 0.2, 1.1, 0.06);
    bladeShape.quadraticCurveTo(1.15, -0.04, 0.95, -0.16);
    bladeShape.quadraticCurveTo(0.4, -0.22, -0.4, -0.18);
    bladeShape.quadraticCurveTo(-0.7, -0.12, -0.9, 0.0);

    const bladeGeo = new T.ExtrudeGeometry(bladeShape, {
      depth: 0.045,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 3,
      steps: 1
    });
    bladeGeo.center();

    const blade = new T.Mesh(bladeGeo, mat(PALETTE.steel, { metalness: 0.2, roughness: 0.35 }));
    blade.position.set(0.12, 0.62, 0);
    root.add(mesh(blade, 0.038));

    // Bisel pulido del filo afilado (acero brillante)
    const edge = new T.Mesh(new T.BoxGeometry(1.6, 0.028, 0.05), mat(PALETTE.steelLight));
    edge.position.set(0.1, 0.49, 0);
    edge.rotation.z = 0.015;
    root.add(mesh(edge, 0));

    // Acanaladura de sangre central (ranura fresada)
    const groove = new T.Mesh(new T.BoxGeometry(0.95, 0.025, 0.055), mat(PALETTE.steelDark));
    groove.position.set(0.04, 0.64, 0);
    root.add(mesh(groove, 0));

    // Virola y guarda de latón náutico dorado
    const guard = new T.Mesh(new T.CylinderGeometry(0.13, 0.15, 0.08, 12), mat(PALETTE.gold));
    guard.rotation.z = Math.PI / 2;
    guard.position.set(-0.84, 0.62, 0);
    root.add(mesh(guard, 0.025));

    const spacer = new T.Mesh(new T.CylinderGeometry(0.11, 0.11, 0.04, 12), mat(PALETTE.woodDark));
    spacer.rotation.z = Math.PI / 2;
    spacer.position.set(-0.89, 0.62, 0);
    root.add(mesh(spacer, 0));

    // Empuñadura ergonómica de madera tallada con ondas para los dedos
    const handleGeo = new T.CylinderGeometry(0.085, 0.105, 0.62, 14);
    handleGeo.scale(1, 1, 0.82);
    const handle = new T.Mesh(handleGeo, mat(PALETTE.wood));
    handle.rotation.z = Math.PI / 2;
    handle.position.set(-1.22, 0.62, 0);
    root.add(mesh(handle, 0.045));

    // Ondas táctiles de agarre de madera
    for (let i = 0; i < 3; i++) {
      const rib = new T.Mesh(new T.TorusGeometry(0.09, 0.015, 6, 14), mat(PALETTE.woodLight));
      rib.rotation.y = Math.PI / 2;
      rib.position.set(-1.08 - i * 0.13, 0.62, 0);
      root.add(mesh(rib, 0));
    }

    // Remaches de latón dorado en ambos lados
    for (let i = 0; i < 3; i++) {
      for (const side of [-1, 1]) {
        const rivet = new T.Mesh(new T.CylinderGeometry(0.024, 0.024, 0.02, 8), mat(PALETTE.gold));
        rivet.rotation.x = Math.PI / 2;
        rivet.position.set(-1.08 - i * 0.13, 0.62, side * 0.095);
        root.add(mesh(rivet, 0));
      }
    }

    // Pomo de latón en la base con anilla para soga de marinero
    const pommel = new T.Mesh(new T.SphereGeometry(0.11, 12, 8), mat(PALETTE.gold));
    pommel.position.set(-1.54, 0.62, 0);
    root.add(mesh(pommel, 0.025));

    const ring = new T.Mesh(new T.TorusGeometry(0.065, 0.018, 6, 12), mat(PALETTE.gold));
    ring.position.set(-1.64, 0.62, 0);
    root.add(mesh(ring, 0));

    return root;
  }

  // -------------------------------------------------------------------------
  // 3. Caldero Marinero de Chiringuito
  // -------------------------------------------------------------------------
  function pot() {
    const root = group('pot');

    // Cuerpo panzudo del caldero de hierro forjado
    // Parte inferior esférica
    const baseGeo = new T.SphereGeometry(0.66, 24, 14, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.65);
    const potMat = mat(PALETTE.steelDark);
    const potBase = new T.Mesh(baseGeo, potMat);
    potBase.position.y = 0.52;
    root.add(mesh(potBase, 0.045));

    // Cilindro medio panzudo
    const belly = new T.Mesh(new T.CylinderGeometry(0.72, 0.64, 0.44, 24), potMat);
    belly.position.y = 0.54;
    root.add(mesh(belly, 0.045));

    // Labio superior biselado hacia afuera
    const rim = new T.Mesh(new T.TorusGeometry(0.73, 0.065, 8, 28), mat(PALETTE.steel));
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.77;
    root.add(mesh(rim, 0.035));

    // Trípode de 3 patas de hierro en la base para brasas
    const legMat = mat(PALETTE.steelDark);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const leg = new T.Mesh(new T.CylinderGeometry(0.045, 0.06, 0.22, 8), legMat);
      leg.position.set(Math.cos(a) * 0.42, 0.11, Math.sin(a) * 0.42);
      leg.rotation.z = Math.cos(a) * -0.25;
      leg.rotation.x = Math.sin(a) * 0.25;
      root.add(mesh(leg, 0.02));
    }

    // Remaches de forja decorativos alrededor del cuello
    const rivetMat = mat(PALETTE.gold);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const r = new T.Mesh(new T.SphereGeometry(0.028, 6, 5), rivetMat);
      r.position.set(Math.cos(a) * 0.73, 0.68, Math.sin(a) * 0.73);
      root.add(mesh(r, 0));
    }

    // Placas laterales de sujeción de asas
    for (const side of [-1, 1]) {
      const plate = new T.Mesh(new T.BoxGeometry(0.06, 0.16, 0.14), mat(PALETTE.steel));
      plate.position.set(side * 0.74, 0.62, 0);
      root.add(mesh(plate, 0.02));

      // Asas gruesas de hierro articuladas
      const handle = new T.Mesh(new T.TorusGeometry(0.18, 0.045, 6, 16, Math.PI), mat(PALETTE.steel));
      handle.rotation.z = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      handle.position.set(side * 0.84, 0.62, 0);
      root.add(mesh(handle, 0.035));
    }

    // Superficie del caldo marinero borboteando
    const soup = new T.Mesh(new T.CircleGeometry(0.68, 24), mat(PALETTE.coralLight, { side: T.DoubleSide }));
    soup.rotation.x = -Math.PI / 2;
    soup.position.y = 0.74;
    root.add(mesh(soup, 0));

    // Trocitos de marisco y verduras flotando en el guiso
    // Trozo de pinza de cangrejo
    const crabBit = new T.Mesh(new T.ConeGeometry(0.06, 0.22, 6), mat(PALETTE.coral));
    crabBit.rotation.x = 0.8;
    crabBit.rotation.z = -0.4;
    crabBit.position.set(-0.24, 0.78, 0.18);
    root.add(mesh(crabBit, 0.015));

    // Rodajita de lima
    const limeBit = new T.Mesh(new T.CylinderGeometry(0.09, 0.09, 0.025, 10), mat(PALETTE.lime));
    limeBit.rotation.x = 0.3;
    limeBit.position.set(0.22, 0.76, -0.16);
    root.add(mesh(limeBit, 0.015));

    // Hoja de laurel
    const leafBit = new T.Mesh(new T.BoxGeometry(0.16, 0.01, 0.08), mat(PALETTE.leafDark));
    leafBit.rotation.y = 0.6;
    leafBit.position.set(0.05, 0.76, 0.26);
    root.add(mesh(leafBit, 0));

    // Burbujas translúcidas de hervor
    const bubbleMat = mat(PALETTE.pineapple, { transparent: true, opacity: 0.85 });
    for (let i = 0; i < 5; i++) {
      const b = new T.Mesh(new T.SphereGeometry(0.05 + (i % 2) * 0.025, 8, 6), bubbleMat);
      b.position.set(-0.28 + (i * 0.15), 0.77, 0.12 * Math.sin(i * 2.1));
      root.add(mesh(b, 0.015));
    }

    return root;
  }

  // -------------------------------------------------------------------------
  // 4. Sartén Rústica de Hierro Fundido con Marisco al Fuego
  // -------------------------------------------------------------------------
  function pan() {
    const root = group('pan');

    // Sartén de hierro fundido con paredes inclinadas
    const panMat = mat('#222629');
    const panBody = new T.Mesh(new T.CylinderGeometry(0.72, 0.58, 0.18, 26), panMat);
    panBody.position.y = 0.09;
    root.add(mesh(panBody, 0.05));

    // Borde grueso redondeado
    const rim = new T.Mesh(new T.TorusGeometry(0.72, 0.045, 6, 26), mat(PALETTE.steelDark));
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.18;
    root.add(mesh(rim, 0.03));

    // Picos vertedores en los costados
    for (const side of [-1, 1]) {
      const spout = new T.Mesh(new T.ConeGeometry(0.08, 0.12, 6), panMat);
      spout.rotation.z = side * -Math.PI / 2;
      spout.position.set(0, 0.18, side * 0.73);
      root.add(mesh(spout, 0));
    }

    // Mango de hierro con funda de madera tallada y remaches
    const ironStem = new T.Mesh(new T.BoxGeometry(0.32, 0.07, 0.1), panMat);
    ironStem.position.set(0.82, 0.17, 0);
    root.add(mesh(ironStem, 0.02));

    // Mango de madera de palapa
    const handleGeo = new T.CylinderGeometry(0.075, 0.09, 0.78, 12);
    handleGeo.scale(1, 1, 0.82);
    const handle = new T.Mesh(handleGeo, mat(PALETTE.woodDark));
    handle.rotation.z = Math.PI / 2 - 0.04;
    handle.position.set(1.32, 0.18, 0);
    root.add(mesh(handle, 0.045));

    // Abrazadera de latón
    const band = new T.Mesh(new T.CylinderGeometry(0.095, 0.095, 0.06, 12), mat(PALETTE.gold));
    band.rotation.z = Math.PI / 2;
    band.position.set(0.96, 0.18, 0);
    root.add(mesh(band, 0));

    // Orificio de colgar en el extremo
    const hangEye = new T.Mesh(new T.TorusGeometry(0.055, 0.022, 6, 12), panMat);
    hangEye.rotation.x = Math.PI / 2;
    hangEye.position.set(1.74, 0.2, 0);
    root.add(mesh(hangEye, 0.02));

    // Fondo con salsa dorada de cocción burbujeante
    const oil = new T.Mesh(new T.CircleGeometry(0.58, 24), mat(PALETTE.mango, { transparent: true, opacity: 0.65, side: T.DoubleSide }));
    oil.rotation.x = -Math.PI / 2;
    oil.position.y = 0.14;
    root.add(mesh(oil, 0));

    // Camarón/langostino salteado curvado en 3D
    const shrimpCurve = new T.Mesh(new T.TorusGeometry(0.18, 0.055, 8, 16, Math.PI * 1.25), mat(PALETTE.coralLight));
    shrimpCurve.rotation.x = Math.PI / 2;
    shrimpCurve.position.set(-0.14, 0.17, -0.08);
    root.add(mesh(shrimpCurve, 0.025));

    // Pinza de cangrejo sonrosada dorándose
    const crabPincer = new T.Mesh(new T.ConeGeometry(0.08, 0.28, 8), mat(PALETTE.coral));
    crabPincer.rotation.x = Math.PI / 2;
    crabPincer.rotation.z = -0.5;
    crabPincer.position.set(0.16, 0.17, 0.12);
    root.add(mesh(crabPincer, 0.025));

    // Rodajita de pimiento chile rojo
    const chiliRing = new T.Mesh(new T.TorusGeometry(0.07, 0.022, 6, 12), mat(PALETTE.tomato));
    chiliRing.rotation.x = Math.PI / 2;
    chiliRing.position.set(-0.06, 0.17, 0.24);
    root.add(mesh(chiliRing, 0));

    // Pizcas de hierbas frescas picadas
    const herbMat = mat(PALETTE.leaf);
    for (let i = 0; i < 4; i++) {
      const herb = new T.Mesh(new T.BoxGeometry(0.04, 0.015, 0.04), herbMat);
      herb.position.set(-0.2 + i * 0.12, 0.165, -0.15 + (i % 2) * 0.28);
      root.add(mesh(herb, 0));
    }

    return root;
  }

  // -------------------------------------------------------------------------
  // 5. Caña de Pescar de Bambú y Latón
  // -------------------------------------------------------------------------
  function fishingRod() {
    const root = group('fishingRod');
    root.rotation.z = -0.22;

    // Empuñadura ergonómica de corcho playero
    const gripGeo = new T.CylinderGeometry(0.065, 0.085, 0.54, 12);
    const grip = new T.Mesh(gripGeo, mat(PALETTE.paperDark));
    grip.position.y = 0.28;
    root.add(mesh(grip, 0.04));

    // Culata metálica de latón
    const butt = new T.Mesh(new T.CylinderGeometry(0.086, 0.07, 0.05, 12), mat(PALETTE.gold));
    butt.position.y = 0.02;
    root.add(mesh(butt, 0));

    // Asiento del carrete con abrazaderas de latón
    const seat = new T.Mesh(new T.CylinderGeometry(0.068, 0.068, 0.2, 10), mat(PALETTE.steelDark));
    seat.position.y = 0.64;
    root.add(mesh(seat, 0.025));

    for (let sy of [0.56, 0.72]) {
      const ringClamp = new T.Mesh(new T.TorusGeometry(0.074, 0.018, 6, 12), mat(PALETTE.gold));
      ringClamp.rotation.x = Math.PI / 2;
      ringClamp.position.y = sy;
      root.add(mesh(ringClamp, 0));
    }

    // Carrete náutico de latón tradicional con manivela
    const reelBody = new T.Mesh(new T.CylinderGeometry(0.18, 0.18, 0.11, 16), mat(PALETTE.gold));
    reelBody.rotation.x = Math.PI / 2;
    reelBody.position.set(0.18, 0.64, 0);
    root.add(mesh(reelBody, 0.035));

    // Bobina interior con sedal blanco enrollado
    const spool = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 0.115, 14), mat(PALETTE.salt));
    spool.rotation.x = Math.PI / 2;
    spool.position.set(0.18, 0.64, 0);
    root.add(mesh(spool, 0));

    // Manivela en L con pomo de madera
    const crankStem = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 0.16, 6), mat(PALETTE.steel));
    crankStem.position.set(0.26, 0.56, 0.1);
    crankStem.rotation.z = 0.4;
    root.add(mesh(crankStem, 0));

    const crankKnob = new T.Mesh(new T.SphereGeometry(0.045, 8, 6), mat(PALETTE.woodDark));
    crankKnob.position.set(0.34, 0.52, 0.14);
    root.add(mesh(crankKnob, 0.02));

    // Caña de bambú en 4 tramos cónicos con nudos salientes
    const bambooMat = mat(PALETTE.woodLight);
    const nodeMat = mat(PALETTE.wood);

    const sections = [
      { botR: 0.055, topR: 0.044, len: 0.48, y: 0.98 },
      { botR: 0.044, topR: 0.034, len: 0.48, y: 1.44 },
      { botR: 0.034, topR: 0.025, len: 0.48, y: 1.90 },
      { botR: 0.025, topR: 0.016, len: 0.44, y: 2.34 }
    ];

    for (const sec of sections) {
      const rodPart = new T.Mesh(new T.CylinderGeometry(sec.topR, sec.botR, sec.len, 8), bambooMat);
      rodPart.position.y = sec.y;
      root.add(mesh(rodPart, 0.03));

      // Nudo saliente de bambú
      const bNode = new T.Mesh(new T.TorusGeometry(sec.botR + 0.012, 0.014, 5, 12), nodeMat);
      bNode.rotation.x = Math.PI / 2;
      bNode.position.y = sec.y - sec.len * 0.5;
      root.add(mesh(bNode, 0));
    }

    // 4 Anillas pasahilos metálicas a lo largo de la caña
    const guideMat = mat(PALETTE.gold);
    for (let gy of [1.1, 1.56, 2.02, 2.54]) {
      const eyelet = new T.Mesh(new T.TorusGeometry(0.042, 0.012, 5, 12), guideMat);
      eyelet.position.set(0.06, gy, 0);
      root.add(mesh(eyelet, 0));
    }

    // Sedal curvado que cae desde la puntera con boya y anzuelo
    const linePoints = [
      new T.Vector3(0.06, 2.55, 0),
      new T.Vector3(0.35, 2.1, 0.16),
      new T.Vector3(0.68, 1.4, 0.32),
      new T.Vector3(0.82, 0.65, 0.42)
    ];
    const lineGeo = new T.BufferGeometry().setFromPoints(linePoints);
    const line = new T.Line(lineGeo, new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }));
    root.add(line);

    // Boya de corcho tradicional roja y blanca
    const bobber = new T.Mesh(new T.SphereGeometry(0.095, 12, 10), mat(PALETTE.coral));
    bobber.position.set(0.82, 0.58, 0.42);
    root.add(mesh(bobber, 0.03));

    const whiteBand = new T.Mesh(new T.SphereGeometry(0.096, 12, 10, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5), mat(PALETTE.salt));
    whiteBand.position.set(0.82, 0.58, 0.42);
    root.add(mesh(whiteBand, 0));

    // Anzuelo metálico afilado al final de la línea
    const hook = new T.Mesh(new T.TorusGeometry(0.045, 0.012, 4, 12, Math.PI * 1.3), mat(PALETTE.steel));
    hook.position.set(0.82, 0.42, 0.42);
    hook.rotation.y = Math.PI / 2;
    root.add(mesh(hook, 0));

    return root;
  }

  // -------------------------------------------------------------------------
  // 6. Pala de Playa y Huerto
  // -------------------------------------------------------------------------
  function shovel() {
    const root = group('shovel');

    // Empuñadura ergonómica en D de madera con refuerzos de latón
    const grip = new T.Mesh(new T.TorusGeometry(0.18, 0.038, 6, 18), mat(PALETTE.woodDark));
    grip.position.y = 1.78;
    root.add(mesh(grip, 0.035));

    const crossbar = new T.Mesh(new T.CylinderGeometry(0.038, 0.038, 0.34, 8), mat(PALETTE.wood));
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position.y = 1.62;
    root.add(mesh(crossbar, 0.025));

    // Abrazaderas metálicas en la empuñadura
    for (const sx of [-0.16, 0.16]) {
      const clampMetal = new T.Mesh(new T.BoxGeometry(0.045, 0.08, 0.06), mat(PALETTE.steelDark));
      clampMetal.position.set(sx, 1.62, 0);
      root.add(mesh(clampMetal, 0));
    }

    // Astil largo de madera torneada
    const shaft = new T.Mesh(new T.CylinderGeometry(0.045, 0.055, 1.25, 10), mat(PALETTE.woodLight));
    shaft.position.y = 1.05;
    root.add(mesh(shaft, 0.04));

    // Casquillo metálico de inserción con pernos pasantes
    const socket = new T.Mesh(new T.CylinderGeometry(0.065, 0.075, 0.28, 10), mat(PALETTE.steelDark));
    socket.position.y = 0.52;
    root.add(mesh(socket, 0.03));

    for (let py of [0.46, 0.56]) {
      const rivet = new T.Mesh(new T.SphereGeometry(0.022, 6, 5), mat(PALETTE.gold));
      rivet.position.set(0, py, 0.08);
      root.add(mesh(rivet, 0));
    }

    // Hoja curvada estampada de acero
    const bladeShape = new T.Shape();
    bladeShape.moveTo(0, 0.44);
    bladeShape.quadraticCurveTo(0.36, 0.36, 0.32, -0.15);
    bladeShape.quadraticCurveTo(0.24, -0.48, 0, -0.58);
    bladeShape.quadraticCurveTo(-0.24, -0.48, -0.32, -0.15);
    bladeShape.quadraticCurveTo(-0.36, 0.36, 0, 0.44);

    const bladeGeo = new T.ExtrudeGeometry(bladeShape, {
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.022,
      bevelSize: 0.022,
      bevelSegments: 2,
      steps: 1
    });
    bladeGeo.center();

    const blade = new T.Mesh(bladeGeo, mat(PALETTE.steel, { metalness: 0.2, roughness: 0.4 }));
    blade.position.set(0, 0.3, 0);
    root.add(mesh(blade, 0.045));

    // Nervadura central de refuerzo en la pala
    const spine = new T.Mesh(new T.CylinderGeometry(0.025, 0.045, 0.72, 8), mat(PALETTE.steelDark));
    spine.position.set(0, 0.32, 0.04);
    root.add(mesh(spine, 0));

    // Hombros pisables doblados hacia atrás para la bota
    for (const side of [-1, 1]) {
      const footRest = new T.Mesh(new T.BoxGeometry(0.18, 0.03, 0.08), mat(PALETTE.steelDark));
      footRest.position.set(side * 0.22, 0.48, -0.02);
      root.add(mesh(footRest, 0));
    }

    // Granos de arena dorada adheridos en el filo
    const sandMat = mat(PALETTE.pineapple);
    for (let i = 0; i < 5; i++) {
      const sand = new T.Mesh(new T.SphereGeometry(0.024, 6, 5), sandMat);
      sand.position.set(-0.16 + i * 0.08, 0.06 - Math.abs(i - 2) * 0.02, 0.04);
      root.add(mesh(sand, 0));
    }

    return root;
  }

  // -------------------------------------------------------------------------
  // 7. Pez Loro / Pargo de Arrecife Caribeño
  // -------------------------------------------------------------------------
  function fish() {
    const root = group('fish');

    // Cuerpo hidrodinámico estilizado de pez tropical
    const bodyGeo = new T.SphereGeometry(0.64, 20, 14);
    bodyGeo.scale(1.35, 0.68, 0.46);
    const body = new T.Mesh(bodyGeo, mat(PALETTE.lagoon));
    body.position.set(0.04, 0.62, 0);
    root.add(mesh(body, 0.05));

    // Lomo oscuro de aguas profundas
    const backGeo = new T.SphereGeometry(0.58, 16, 10);
    backGeo.scale(1.28, 0.32, 0.42);
    const back = new T.Mesh(backGeo, mat(PALETTE.seaDark));
    back.position.set(0.02, 0.82, 0);
    root.add(mesh(back, 0));

    // Vientre blanco perla plateado
    const bellyGeo = new T.SphereGeometry(0.48, 16, 10);
    bellyGeo.scale(1.15, 0.32, 0.38);
    const belly = new T.Mesh(bellyGeo, mat(PALETTE.cream));
    belly.position.set(0.12, 0.42, 0);
    root.add(mesh(belly, 0));

    // Cabeza y boca con labios carnosos 3D
    const mouth = new T.Mesh(new T.TorusGeometry(0.085, 0.035, 6, 12), mat(PALETTE.coral));
    mouth.position.set(0.78, 0.58, 0);
    mouth.rotation.y = Math.PI / 2;
    root.add(mesh(mouth, 0.02));

    // Hendidura de opérculo branquial
    const gill = new T.Mesh(new T.TorusGeometry(0.24, 0.018, 5, 12, Math.PI * 0.7), mat(PALETTE.seaDeep));
    gill.position.set(0.36, 0.62, 0.22);
    gill.rotation.x = Math.PI / 2;
    gill.rotation.z = 0.55;
    root.add(mesh(gill, 0));

    // Ojos salientes tropicales
    for (const side of [-1, 1]) {
      const eyeBase = new T.Mesh(new T.SphereGeometry(0.13, 12, 10), mat(PALETTE.salt));
      eyeBase.position.set(0.52, 0.74, side * 0.24);
      root.add(mesh(eyeBase, 0.025));

      const pupil = new T.Mesh(new T.SphereGeometry(0.07, 10, 8), mat(PALETTE.ink));
      pupil.position.set(0.58, 0.74, side * 0.31);
      root.add(mesh(pupil, 0.015));

      const glint = new T.Mesh(new T.SphereGeometry(0.024, 6, 5), mat(PALETTE.salt));
      glint.position.set(0.61, 0.78, side * 0.34);
      root.add(mesh(glint, 0));
    }

    // Cola bífida en abanico con radios en relieve
    const tailShape = new T.Shape();
    tailShape.moveTo(0, 0.24);
    tailShape.quadraticCurveTo(-0.36, 0.52, -0.56, 0.22);
    tailShape.quadraticCurveTo(-0.4, 0, -0.56, -0.22);
    tailShape.quadraticCurveTo(-0.36, -0.52, 0, -0.24);
    tailShape.closePath();

    const tailGeo = new T.ExtrudeGeometry(tailShape, {
      depth: 0.055,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 2,
      steps: 1
    });
    tailGeo.center();

    const tail = new T.Mesh(tailGeo, mat(PALETTE.coral));
    tail.position.set(-0.84, 0.62, 0);
    root.add(mesh(tail, 0.038));

    // Franja dorada decorativa en la cola
    const tailStripe = new T.Mesh(new T.BoxGeometry(0.045, 0.44, 0.075), mat(PALETTE.gold));
    tailStripe.position.set(-0.88, 0.62, 0);
    root.add(mesh(tailStripe, 0));

    // Aleta dorsal estilizada en abanico
    const dorsalMat = mat(PALETTE.coral);
    const topFin = new T.Mesh(new T.ConeGeometry(0.24, 0.42, 5), dorsalMat);
    topFin.rotation.z = -0.35;
    topFin.scale.set(1, 1, 0.35);
    topFin.position.set(-0.06, 1.05, 0);
    root.add(mesh(topFin, 0.035));

    // Aletas pectorales laterales translúcidas
    for (const side of [-1, 1]) {
      const pecFin = new T.Mesh(new T.ConeGeometry(0.12, 0.34, 5), dorsalMat);
      pecFin.rotation.z = side * 1.1;
      pecFin.rotation.x = side * 0.35;
      pecFin.scale.set(1, 1, 0.3);
      pecFin.position.set(0.18, 0.54, side * 0.32);
      root.add(mesh(pecFin, 0.025));
    }

    return root;
  }

  // -------------------------------------------------------------------------
  // 8. Coco Playero Caribeño
  // -------------------------------------------------------------------------
  function coconut() {
    const root = group('coconut');

    // Cáscara exterior rugosa marrón con textura de coco seco
    const nutGeo = new T.SphereGeometry(0.62, 20, 16);
    nutGeo.scale(0.96, 1.08, 0.96);
    const nut = new T.Mesh(nutGeo, mat(PALETTE.woodDark));
    nut.position.y = 0.58;
    root.add(mesh(nut, 0.045));

    // Vetas fibrosas de la corteza
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI;
      const fiber = new T.Mesh(new T.TorusGeometry(0.58, 0.022, 5, 18), mat(PALETTE.woodGrain));
      fiber.rotation.y = a;
      fiber.position.y = 0.58;
      root.add(mesh(fiber, 0));
    }

    // Corte diagonal superior mostrando la carne blanca y agua de coco
    const meat = new T.Mesh(new T.CylinderGeometry(0.48, 0.46, 0.08, 20), mat(PALETTE.salt));
    meat.position.set(0, 1.02, 0);
    meat.rotation.x = -0.22;
    root.add(mesh(meat, 0.035));

    // Agua de coco cristalina turquesa brillante en el interior
    const water = new T.Mesh(new T.CircleGeometry(0.4, 20), mat(PALETTE.lagoonLight, { side: T.DoubleSide }));
    water.rotation.x = -Math.PI / 2 - 0.22;
    water.position.set(0, 1.05, 0.01);
    root.add(mesh(water, 0));

    // Pajita de bambú con rayas tropicales
    const straw = new T.Mesh(new T.CylinderGeometry(0.032, 0.032, 0.68, 10), mat(PALETTE.coral));
    straw.rotation.z = -0.42;
    straw.rotation.x = 0.18;
    straw.position.set(0.12, 1.25, 0.06);
    root.add(mesh(straw, 0.025));

    for (let i = 0; i < 3; i++) {
      const stripe = new T.Mesh(new T.CylinderGeometry(0.034, 0.034, 0.06, 10), mat(PALETTE.cream));
      stripe.rotation.z = -0.42;
      stripe.rotation.x = 0.18;
      stripe.position.set(0.06 + i * 0.06, 1.15 + i * 0.1, 0.04 + i * 0.02);
      root.add(mesh(stripe, 0));
    }

    // Rodaja de lima encajada en el borde del coco
    const limeWedge = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 0.045, 12, 1, false, 0, Math.PI), mat(PALETTE.lime));
    limeWedge.rotation.x = Math.PI / 2;
    limeWedge.rotation.z = 0.8;
    limeWedge.position.set(-0.36, 1.06, 0.12);
    root.add(mesh(limeWedge, 0.02));

    return root;
  }

  // -------------------------------------------------------------------------
  // 9. Zanahoria de Huerto Tropical
  // -------------------------------------------------------------------------
  function carrot() {
    const root = group('carrot');

    // Cuerpo cónico orgánico segmentado (5 niveles con curvatura suave)
    const carrotMat = mat(PALETTE.coral);
    const darkMat = mat(PALETTE.tomatoDark);

    const segments = [
      { botR: 0.32, topR: 0.34, h: 0.24, y: 1.18 },
      { botR: 0.28, topR: 0.32, h: 0.28, y: 0.94 },
      { botR: 0.22, topR: 0.28, h: 0.28, y: 0.68 },
      { botR: 0.14, topR: 0.22, h: 0.26, y: 0.43 },
      { botR: 0.04, topR: 0.14, h: 0.24, y: 0.20 }
    ];

    for (const s of segments) {
      const seg = new T.Mesh(new T.CylinderGeometry(s.topR, s.botR, s.h, 12), carrotMat);
      seg.position.y = s.y;
      root.add(mesh(seg, 0.04));

      // Estría horizontal en relieve
      const ring = new T.Mesh(new T.TorusGeometry(s.topR + 0.01, 0.016, 4, 16), darkMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = s.y + s.h * 0.45;
      root.add(mesh(ring, 0));
    }

    // Punta ligeramente curvada en la base
    const tip = new T.Mesh(new T.ConeGeometry(0.04, 0.12, 8), carrotMat);
    tip.position.set(0.02, 0.04, 0);
    tip.rotation.z = 0.2;
    root.add(mesh(tip, 0.02));

    // Corona superior redondeada
    const cap = new T.Mesh(new T.SphereGeometry(0.33, 14, 8), mat(PALETTE.coralLight));
    cap.scale.set(1, 0.42, 1);
    cap.position.y = 1.32;
    root.add(mesh(cap, 0.035));

    // Penacho frondoso de 5 tallos con hojas plumosas
    const leafMat = mat(PALETTE.leaf);
    const leafLight = mat(PALETTE.leafLight);

    const leaves = [
      { rz: 0.05, rx: 0, h: 0.72 },
      { rz: -0.38, rx: 0.15, h: 0.64 },
      { rz: 0.38, rx: -0.15, h: 0.62 },
      { rz: 0.12, rx: 0.36, h: 0.58 },
      { rz: -0.14, rx: -0.34, h: 0.56 }
    ];

    for (const leaf of leaves) {
      const stem = new T.Mesh(new T.CylinderGeometry(0.022, 0.035, leaf.h, 6), leafMat);
      stem.position.set(Math.sin(leaf.rz) * 0.12, 1.34 + leaf.h * 0.45, Math.sin(leaf.rx) * 0.12);
      stem.rotation.z = leaf.rz;
      stem.rotation.x = leaf.rx;
      root.add(mesh(stem, 0.02));

      // Hojas plumosas en abanico
      for (let f = 0; f < 3; f++) {
        const frond = new T.Mesh(new T.ConeGeometry(0.065, 0.24, 5), leafLight);
        frond.rotation.z = leaf.rz + (f - 1) * 0.35;
        frond.rotation.x = leaf.rx;
        frond.position.set(Math.sin(leaf.rz) * (0.16 + f * 0.08), 1.5 + f * 0.14, Math.sin(leaf.rx) * 0.16);
        root.add(mesh(frond, 0.02));
      }
    }

    return root;
  }

  return { crab, coconut, fish, knife, pot, pan, fishingRod, shovel, carrot };
}

export const MODEL_IDS = ['crab', 'coconut', 'fish', 'knife', 'pot', 'pan', 'fishingRod', 'shovel', 'carrot'];

// Crea una fábrica aislada con sus materiales y plantillas. AssetFactory la usa
// como cache; dispose() libera geometrías, materiales y la textura de bandas.
export function createModelFactory() {
  const gradientMap = createGradientMap();
  const outlineMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(PALETTE.ink),
    side: THREE.BackSide
  });
  const materialCache = new Map();
  const templates = new Map();
  const overrides = new Map();

  function mat(color, options = {}) {
    const key = `${color}|${JSON.stringify(options, (k, v) => (v instanceof THREE.Color ? v.getHexString() : v))}`;
    if (materialCache.has(key)) return materialCache.get(key);
    const material = new THREE.MeshToonMaterial({
      color: new THREE.Color(color),
      gradientMap,
      ...options
    });
    materialCache.set(key, material);
    return material;
  }

  function addOutline(meshObject, amount = 0.055) {
    if (!(amount > 0) || !meshObject.geometry) return;
    const outline = new THREE.Mesh(meshObject.geometry, outlineMaterial);
    outline.scale.setScalar(1 + amount);
    outline.castShadow = false;
    outline.receiveShadow = false;
    outline.name = `${meshObject.name || 'mesh'}_outline`;
    meshObject.add(outline);
  }

  function addMesh(parent, object, outline = 0.055) {
    object.castShadow = true;
    object.receiveShadow = false;
    if (outline > 0) addOutline(object, outline);
    parent.add(object);
    return object;
  }

  function mesh(object, outline = 0.055) {
    object.castShadow = true;
    object.receiveShadow = false;
    if (outline > 0) addOutline(object, outline);
    return object;
  }

  function group(name) {
    const root = new THREE.Group();
    root.name = name;
    return root;
  }

  const builders = createModelBuilders({
    THREE,
    mat,
    mesh,
    group
  });

  function buildTemplate(id) {
    const builder = overrides.get(id) || builders[id];
    if (!builder) return null;
    const template = builder();
    template.userData.mgAssetId = id;
    return template;
  }

  function getTemplate(id) {
    if (templates.has(id)) return templates.get(id);
    const template = buildTemplate(id);
    if (!template) return null;
    templates.set(id, template);
    return template;
  }

  function register(id, builder) {
    if (typeof builder !== 'function') return false;
    overrides.set(id, builder);
    templates.delete(id);
    return true;
  }

  function list() {
    return [...new Set([...MODEL_IDS, ...overrides.keys()])];
  }

  function disposeTemplate(template) {
    const geometries = new Set();
    const materials = new Set();
    template.traverse(child => {
      if (child.geometry) geometries.add(child.geometry);
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => materials.add(m));
        else materials.add(child.material);
      }
    });
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) {
      if (material !== outlineMaterial) material.dispose();
    }
  }

  function dispose() {
    for (const template of templates.values()) disposeTemplate(template);
    templates.clear();
    for (const material of materialCache.values()) material.dispose();
    materialCache.clear();
    outlineMaterial.dispose();
    gradientMap.dispose();
    overrides.clear();
  }

  return {
    getTemplate,
    register,
    list,
    dispose
  };
}
