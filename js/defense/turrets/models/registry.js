// Registro de constructores de modelos por tipo de torreta.
// Exports: MODEL_BUILDERS.

import { buildGunnerModel } from './gunner.js';
import { buildMortarModel } from './mortar.js';
import { buildCryoModel } from './cryo.js';
import { buildBarracksModel } from './barracks.js';
import { buildSupportModel } from './support.js';
import { buildTeslaModel } from './tesla.js';
import { buildIncineratorModel } from './incinerator.js';
import { buildRailgunModel } from './railgun.js';
import { buildCollectorModel } from './collector.js';
import { buildPressModel } from './press.js';
import { buildEjectorModel } from './ejector.js';

export const MODEL_BUILDERS = {
  gunner: buildGunnerModel,
  mortar: buildMortarModel,
  cryo: buildCryoModel,
  barracks: buildBarracksModel,
  support: buildSupportModel,
  tesla: buildTeslaModel,
  incinerator: buildIncineratorModel,
  railgun: buildRailgunModel,
  collector: buildCollectorModel,
  press: buildPressModel,
  ejector: buildEjectorModel
};
