// Escena, luces, terreno de dunas, mar y física del mundo tropical.
// Exports: createWorld.

import { createWorldMaterials } from './world/materials.js';
import { createWorldScene, updateWorldScene } from './world/scene.js';
import { createWorldPhysics } from './world/physics.js';
import { buildWorldGeometry } from './world/geometry.js';
import { createBeachLights } from './world/lights.js';
import { buildWorldProps } from './world/props.js';
import { createDust } from './world/dust.js';

export function createWorld() {
  const materials = createWorldMaterials();
  const { scene, ambientLight, sunLight, skyDome, ocean, shoreFoam, clouds } = createWorldScene(materials);
  const physics = createWorldPhysics();

  buildWorldGeometry(scene, materials, physics);
  const beachLights = createBeachLights(scene, materials);
  const propBillboards = buildWorldProps(scene, materials, physics);
  const dust = createDust(scene);
  // El polvo se conserva como referencia de luz, pero a 0.44x de resolución
  // los puntos podían leerse como cuadrados sobre el sol.
  dust.visible = false;

  return {
    scene,
    ambientLight,
    sunLight,
    skyDome,
    ocean,
    shoreFoam,
    clouds,
    beachLights,
    propBillboards,
    dust,
    worldPhysics: physics.worldPhysics,
    update(dt, camera) {
      updateWorldScene(scene, camera, dt);
    }
  };
}
