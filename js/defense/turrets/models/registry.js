// Registro de constructores de modelos por tipo de torreta.
// Exports: MODEL_BUILDERS.

import { buildGunnerModel } from './gunner.js';
import { buildMortarModel } from './mortar.js';
import { buildCryoModel } from './cryo.js';
import { buildBarracksModel } from './barracks.js';
import { buildSupportModel } from './support.js';

export const MODEL_BUILDERS = {
  gunner: buildGunnerModel,
  mortar: buildMortarModel,
  cryo: buildCryoModel,
  barracks: buildBarracksModel,
  support: buildSupportModel
};
