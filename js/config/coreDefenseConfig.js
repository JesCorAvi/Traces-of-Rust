// Configuración del modo Defensa: composición de los módulos de config/coreDefense.
// Exports: CORE_DEFENSE_CONFIG.

import { CORE, PLAYER_DEATH_POLICY, SPAWN_POINTS } from './coreDefense/core.js';
import { PATHS, TARGETING } from './coreDefense/routes.js';
import { WAVES } from './coreDefense/waves.js';
import { SCRAP } from './coreDefense/economy.js';
import { PLACEMENT } from './coreDefense/placement.js';
import { TUTORIAL } from './coreDefense/tutorial.js';
import { TURRET_UPGRADE_RULES, TURRETS } from './coreDefense/turrets.js';

export const CORE_DEFENSE_CONFIG = {
  CORE,
  PLAYER_DEATH_POLICY,
  SPAWN_POINTS,
  PATHS,
  TARGETING,
  WAVES,
  SCRAP,
  PLACEMENT,
  TUTORIAL,
  TURRET_UPGRADE_RULES,
  TURRETS
};
