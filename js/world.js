// Escena, luces, geometría industrial y física del mundo.
// Exports: createWorld.

import { createWorldMaterials } from './world/materials.js';
import { createWorldScene } from './world/scene.js';
import { createWorldPhysics } from './world/physics.js';
import { buildWorldGeometry } from './world/geometry.js';
import { createCeilingLights } from './world/lights.js';
import { buildWorldProps } from './world/props.js';
import { createDust } from './world/dust.js';

export function createWorld() {
  const materials = createWorldMaterials();
  const { scene, ambientLight } = createWorldScene(materials);
  const physics = createWorldPhysics();

  buildWorldGeometry(scene, materials, physics);
  const ceilingLights = createCeilingLights(scene);
  const propBillboards = buildWorldProps(scene, materials);
  const dust = createDust(scene);

  return { scene, ambientLight, propBillboards, ceilingLights, dust, worldPhysics: physics.worldPhysics };
}
