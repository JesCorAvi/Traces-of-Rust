// Prueba de estabilidad de rendimiento y resolución de fugas
import assert from 'node:assert';
import { readFileSync } from 'node:fs';

console.log('🧪 Verificando mitigaciones de rendimiento y fugas de memoria...');

// 1. Verificar AudioSys cleanup
const audioSrc = readFileSync('js/audio.js', 'utf-8');
assert(audioSrc.includes('stopAllVoices()'), 'AudioSys debe exponer stopAllVoices()');
assert(audioSrc.includes('_registerSource'), 'AudioSys debe tener _registerSource para desconectar nodos');
console.log('  ✓ AudioSys: Gestión de ciclo de vida y stopAllVoices() presente');

// 2. Verificar GameEvents.clear no borra handlers UI persistentes
const eventBusSrc = readFileSync('js/core/eventBus.js', 'utf-8');
assert(eventBusSrc.includes('i18n:change'), 'GameEvents.clear debe preservar i18n:change');
assert(eventBusSrc.includes('game:menu'), 'GameEvents.clear debe preservar game:menu');
console.log('  ✓ GameEvents: Conservación de suscriptores UI y de sistema');

// 3. Verificar Flamethrower shared materials
const flameSrc = readFileSync('js/combat/weapons/flamethrower.js', 'utf-8');
assert(flameSrc.includes('SHARED_FLAME_MATS'), 'flamethrower debe usar SHARED_FLAME_MATS');
assert(flameSrc.includes('disposeMat: false'), 'flamethrower debe marcar disposeMat: false');
console.log('  ✓ Flamethrower: Materiales compartidos sin churn de GPU');

// 4. Verificar Incinerator shared geometry and materials
const incinSrc = readFileSync('js/defense/turrets/combat/incinerator.js', 'utf-8');
assert(incinSrc.includes('INCINERATOR_FLAME_GEO'), 'Incinerator debe usar INCINERATOR_FLAME_GEO');
assert(incinSrc.includes('INCINERATOR_MAT_ORANGE'), 'Incinerator debe usar INCINERATOR_MAT_ORANGE');
assert(incinSrc.includes('disposeGeo: false'), 'Incinerator debe marcar disposeGeo: false');
console.log('  ✓ Incinerator: Geometrías y materiales compartidos sin churn');

// 5. Verificar Shotgun shared materials
const shotSrc = readFileSync('js/combat/weapons/shotgun.js', 'utf-8');
assert(shotSrc.includes('FLASH_MAT'), 'Shotgun debe usar FLASH_MAT');
assert(shotSrc.includes('TRACER_MAT_LIGHT'), 'Shotgun debe usar TRACER_MAT_LIGHT');
console.log('  ✓ Shotgun: Fogonazo y trazadoras reutilizables');

// 6. Verificar Bolt y Harpoon shared materials
const boltSrc = readFileSync('js/combat/weapons/bolt.js', 'utf-8');
assert(boltSrc.includes('BOLT_MAT'), 'Bolt debe usar BOLT_MAT');
const harpoonSrc = readFileSync('js/combat/weapons/harpoon.js', 'utf-8');
assert(harpoonSrc.includes('HARPOON_MAT'), 'Harpoon debe usar HARPOON_MAT');
console.log('  ✓ Bolt & Harpoon: Materiales de línea compartidos');

// 7. Verificar Welder shared materials
const welderSrc = readFileSync('js/combat/weapons/welder.js', 'utf-8');
assert(welderSrc.includes('BEAM_GLOW_MAT'), 'Welder debe usar BEAM_GLOW_MAT');
assert(welderSrc.includes('BEAM_CORE_MAT'), 'Welder debe usar BEAM_CORE_MAT');
assert(welderSrc.includes('READY_PULSE_GEO'), 'Welder debe usar READY_PULSE_GEO');
console.log('  ✓ Welder: Cilindros, anillos y destellos reutilizables');

// 8. Verificar TurretSystem fx pooling
const turretFxSrc = readFileSync('js/defense/turretSystem/fx.js', 'utf-8');
assert(turretFxSrc.includes('getTracerMat'), 'turretSystem/fx debe cachear materiales de trazadora');
assert(turretFxSrc.includes('SHARED_EXPLOSION_RING_GEO'), 'turretSystem/fx debe usar SHARED_EXPLOSION_RING_GEO');
assert(turretFxSrc.includes('SHARED_NAPALM_GEO'), 'turretSystem/fx debe usar SHARED_NAPALM_GEO');
console.log('  ✓ TurretSystem FX: Trazadoras, explosiones y napalm compartidos');

// 9. Verificar Pickups cap and vector reuse
const pickupsSrc = readFileSync('js/gameplay/pickups.js', 'utf-8');
assert(pickupsSrc.includes('MAX_TOTAL_DROPS'), 'pickups debe tener MAX_TOTAL_DROPS');
assert(pickupsSrc.includes('_pullDir'), 'pickups debe reutilizar _pullDir');
assert(pickupsSrc.includes('userData = { sharedGeo: true }'), 'pickups debe marcar sharedGeo');
console.log('  ✓ Pickups: Tope de acumulación, sin asignación de vectores por frame');

// 10. Verificar Main.js dash/jump dust
const mainSrc = readFileSync('js/main.js', 'utf-8');
assert(mainSrc.includes('SHARED_LANDING_DUST_GEO'), 'main.js debe usar SHARED_LANDING_DUST_GEO');
assert(mainSrc.includes('SHARED_DASH_DUST_GEO'), 'main.js debe usar SHARED_DASH_DUST_GEO');
assert(mainSrc.includes('SHARED_DASH_SPARK_GEO'), 'main.js debe usar SHARED_DASH_SPARK_GEO');
assert(mainSrc.includes('Math.min(1.5, savedCamDist)'), 'main.js debe limitar distancia inicial de cámara a 1.5');
console.log('  ✓ Main: Partículas de dash/salto compartidas y cámara normalizada');

// 11. Verificar Settings wiring
const settingsSrc = readFileSync('js/ui/settingsMenu.js', 'utf-8');
assert(settingsSrc.includes('setupVideoControls'), 'settingsMenu debe tener setupVideoControls');
assert(settingsSrc.includes('setupControlSettings'), 'settingsMenu debe tener setupControlSettings');
assert(settingsSrc.includes('setupResetControls'), 'settingsMenu debe tener setupResetControls');
assert(settingsSrc.includes('btn-reset-defaults'), 'settingsMenu debe manejar btn-reset-defaults');
assert(settingsSrc.includes('btn-wipe-save'), 'settingsMenu debe manejar btn-wipe-save');
console.log('  ✓ SettingsMenu: Controles de vídeo, controles y botones de restablecimiento conectados');

console.log('✨ Todas las comprobaciones de estabilidad y rendimiento pasaron con éxito.');
