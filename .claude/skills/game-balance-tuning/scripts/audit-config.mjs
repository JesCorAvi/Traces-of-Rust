#!/usr/bin/env node
// Audita la configuración de balance sin dependencias ni ejecutar el juego.
// Uso: node .claude/skills/game-balance-tuning/scripts/audit-config.mjs [--json]

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../../..');
const JSON_OUT = process.argv.includes('--json');

const errors = [];
const warnings = [];
const fail = msg => errors.push(msg);
const warn = msg => warnings.push(msg);

function loadModule(rel, exportNames) {
  const file = path.join(ROOT, rel);
  let src = fs.readFileSync(file, 'utf8');
  src = src.replace(/\bexport\s+const\s+/g, 'const ');
  src = src.replace(/\bexport\s+function\s+/g, 'function ');
  src += `\nmodule.exports = { ${exportNames.join(', ')} };`;
  const sandbox = { module: { exports: {} }, exports: {} };
  vm.runInNewContext(src, sandbox, { filename: file });
  return sandbox.module.exports;
}

function readText(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

let turretCfg;
let waveCfg;
let scrapCfg;
let placementCfg;
let modesCfg;
try {
  turretCfg = loadModule('js/config/coreDefense/turrets.js', ['TURRETS', 'TURRET_UPGRADE_RULES']);
  waveCfg = loadModule('js/config/coreDefense/waves.js', ['WAVES']);
  scrapCfg = loadModule('js/config/coreDefense/economy.js', ['SCRAP']);
  placementCfg = loadModule('js/config/coreDefense/placement.js', ['PLACEMENT']);
  modesCfg = loadModule('js/config/modesConfig.js', ['MODES_CONFIG']);
} catch (err) {
  console.error(`No se pudo cargar la configuración: ${err.message}`);
  process.exit(1);
}

const { TURRETS, TURRET_UPGRADE_RULES } = turretCfg;
const { WAVES } = waveCfg;
const { SCRAP } = scrapCfg;
const { PLACEMENT } = placementCfg;
const BOSS_SCHEDULE = modesCfg.MODES_CONFIG?.SURVIVAL?.BOSS_SCHEDULE || [];
const bossIds = new Set(BOSS_SCHEDULE.map(b => b.id));

// Claves que recomputeStats reconoce (case '...':)
const statsSrc = readText('js/defense/turrets/stats.js');
const supportedEffects = new Set();
for (const match of statsSrc.matchAll(/case\s+'([^']+)'\s*:/g)) supportedEffects.add(match[1]);

// ---------------------------------------------------------------------------
// Torretas
// ---------------------------------------------------------------------------
const turretEntries = Object.entries(TURRETS || {});
if (turretEntries.length === 0) fail('TURRETS está vacío');

for (const [key, turret] of turretEntries) {
  const where = `torreta "${key}"`;
  if (!turret || typeof turret !== 'object') {
    fail(`${where}: no es un objeto`);
    continue;
  }
  if (turret.id !== key) fail(`${where}: id "${turret.id}" no coincide con la clave`);
  if (!Number.isFinite(turret.cost) || turret.cost < 0) fail(`${where}: cost inválido`);
  if (!turret.base || typeof turret.base !== 'object') {
    fail(`${where}: falta base`);
    continue;
  }
  for (const stat of ['damage', 'range', 'fireRate', 'hp']) {
    if (!Number.isFinite(turret.base[stat]) || turret.base[stat] < 0) fail(`${where}: base.${stat} inválido`);
  }

  const paths = Array.isArray(turret.paths) ? turret.paths : [];
  if (paths.length !== 3) fail(`${where}: ${paths.length} rutas; se esperan 3`);
  const seenPathIds = new Set();
  for (const [pIndex, route] of paths.entries()) {
    const pWhere = `${where} ruta[${pIndex}]`;
    if (!route || typeof route !== 'object') {
      fail(`${pWhere}: no es un objeto`);
      continue;
    }
    if (!route.id) fail(`${pWhere}: sin id`);
    else if (seenPathIds.has(route.id)) fail(`${pWhere}: id duplicado "${route.id}"`);
    else seenPathIds.add(route.id);

    const upgrades = Array.isArray(route.upgrades) ? route.upgrades : [];
    if (upgrades.length !== 4) fail(`${pWhere}: ${upgrades.length} niveles; se esperan 4`);
    let prevCost = -Infinity;
    for (const [uIndex, up] of upgrades.entries()) {
      const uWhere = `${pWhere} nivel[${uIndex}]`;
      if (!up || typeof up !== 'object') {
        fail(`${uWhere}: no es un objeto`);
        continue;
      }
      if (!Number.isFinite(up.cost) || up.cost < 0) fail(`${uWhere}: cost inválido`);
      if (Number.isFinite(up.cost) && up.cost < prevCost) warn(`${uWhere}: cost ${up.cost} menor que el nivel anterior (${prevCost})`);
      if (Number.isFinite(up.cost)) prevCost = up.cost;
      if (!up.name || !up.desc) warn(`${uWhere}: falta name/desc`);
      const effects = up.effects && typeof up.effects === 'object' ? up.effects : {};
      if (Object.keys(effects).length === 0 && !up.special) warn(`${uWhere}: sin effects ni special`);
      for (const fxKey of Object.keys(effects)) {
        if (!supportedEffects.has(fxKey)) fail(`${uWhere}: effect "${fxKey}" no reconocido por recomputeStats`);
      }
    }
  }
}

const rules = TURRET_UPGRADE_RULES || {};
if (rules.maxTier !== 4) fail(`TURRET_UPGRADE_RULES.maxTier=${rules.maxTier}; se esperan 4`);
if (!(rules.freeTier >= 1 && rules.freeTier <= rules.specializedTier)) fail('freeTier/specializedTier incoherentes');
if (!(rules.specializedTier <= rules.maxTier)) fail('specializedTier supera maxTier');
if (!(rules.sellRefund > 0 && rules.sellRefund <= 1)) fail('sellRefund fuera de (0, 1]');

// ---------------------------------------------------------------------------
// Oleadas
// ---------------------------------------------------------------------------
if (!WAVES || typeof WAVES !== 'object') {
  fail('WAVES no existe');
} else {
  const schedule = Array.isArray(WAVES.SCHEDULE) ? WAVES.SCHEDULE : [];
  if (schedule.length !== 12) fail(`WAVES.SCHEDULE tiene ${schedule.length} entradas; se esperan 12`);
  if (WAVES.totalWavesForVictory !== 12) warn(`totalWavesForVictory=${WAVES.totalWavesForVictory}; referencia 12`);
  if (WAVES.totalWavesForVictory !== schedule.length) warn('totalWavesForVictory no coincide con SCHEDULE');

  for (const [i, wave] of schedule.entries()) {
    const where = `oleada[${i}]`;
    if (!wave || typeof wave !== 'object') {
      fail(`${where}: no es un objeto`);
      continue;
    }
    if (wave.wave !== i + 1) warn(`${where}: wave=${wave.wave}; se esperaba ${i + 1}`);
    if (!Number.isFinite(wave.count) || wave.count <= 0) fail(`${where}: count inválido`);
    if (!Number.isFinite(wave.interval) || wave.interval <= 0) fail(`${where}: interval inválido`);
    const comp = wave.composition || {};
    const sum = ['zombie', 'worm', 'weeper'].reduce((acc, k) => acc + (Number(comp[k]) || 0), 0);
    if (Math.abs(sum - 1) > 0.01) warn(`${where}: composition suma ${sum.toFixed(3)}; referencia 1`);
    if (wave.bossId && !bossIds.has(wave.bossId)) fail(`${where}: bossId "${wave.bossId}" no existe en BOSS_SCHEDULE`);
  }

  const events = WAVES.EVENTS || {};
  if (!(events.intervalWaves > 0)) fail('EVENTS.intervalWaves inválido');
  if (!(events.eventDurationSec > 0)) fail('EVENTS.eventDurationSec inválido');
  if (!(events.survivalRadius > 0)) fail('EVENTS.survivalRadius inválido');
  if (!(events.maxEnemiesBase > 0) || !(events.maxEnemiesPeak >= events.maxEnemiesBase)) fail('EVENTS.maxEnemies* incoherentes');
  if (!(events.spawnIntervalStart > 0) || !(events.spawnIntervalEnd > 0)) fail('EVENTS.spawnInterval* inválido');
  if (events.spawnIntervalEnd > events.spawnIntervalStart) warn('EVENTS.spawnIntervalEnd > spawnIntervalStart (el clímax spawnearía más lento)');
}

// ---------------------------------------------------------------------------
// Economía y colocación
// ---------------------------------------------------------------------------
if (!SCRAP || typeof SCRAP !== 'object') {
  fail('SCRAP no existe');
} else {
  if (!(SCRAP.startingScrap > 0)) fail('SCRAP.startingScrap inválido');
  if (!(SCRAP.normalDropChance >= 0 && SCRAP.normalDropChance <= 1)) fail('SCRAP.normalDropChance fuera de [0,1]');
  if (!(SCRAP.normalDropValue > 0) || !(SCRAP.bossDropValue > 0)) fail('SCRAP valores de drop inválidos');
  if (!(SCRAP.maxActivePickups > 0)) fail('SCRAP.maxActivePickups inválido');
  if (SCRAP.startingScrap !== 10) warn(`startingScrap=${SCRAP.startingScrap}; la invariante actual es 10`);
}

if (!PLACEMENT || typeof PLACEMENT !== 'object') {
  fail('PLACEMENT no existe');
} else {
  for (const [key, value] of Object.entries(PLACEMENT)) {
    if (!Number.isFinite(value) || value < 0) fail(`PLACEMENT.${key} inválido`);
  }
  if (!Number.isInteger(PLACEMENT.maxTurrets) || PLACEMENT.maxTurrets <= 0) fail('PLACEMENT.maxTurrets debe ser entero positivo');
}

// ---------------------------------------------------------------------------
// Reporte
// ---------------------------------------------------------------------------
const report = {
  ok: errors.length === 0,
  turrets: turretEntries.length,
  supportedEffects: supportedEffects.size,
  waves: Array.isArray(WAVES?.SCHEDULE) ? WAVES.SCHEDULE.length : 0,
  bosses: BOSS_SCHEDULE.length,
  errors,
  warnings
};

if (JSON_OUT) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log('Auditoría de balance — Traces of Rust');
  console.log(`Torretas: ${report.turrets} · Efectos soportados: ${report.supportedEffects} · Oleadas: ${report.waves} · Jefes: ${report.bosses}`);
  for (const w of warnings) console.log(`  WARN  ${w}`);
  for (const e of errors) console.log(`  ERROR ${e}`);
  console.log(`\n${errors.length} error(es), ${warnings.length} warning(s).`);
}

process.exit(errors.length === 0 ? 0 : 1);
