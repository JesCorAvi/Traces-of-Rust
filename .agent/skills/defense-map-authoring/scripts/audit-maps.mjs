#!/usr/bin/env node
// Audita MAP_CATALOG sin dependencias: estructura, conteos, referencias y defaults.
// Uso: node .claude/skills/defense-map-authoring/scripts/audit-maps.mjs [--json]

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../../..');
const MAP_FILE = path.join(ROOT, 'js/defense/mapCatalog.js');
const JSON_OUT = process.argv.includes('--json');

const EXPECTED = {
  facil: { count: 6, maxLives: 150, entrances: 1, exits: 1 },
  normal: { count: 6, maxLives: 100, entrances: 2, exits: 1 },
  dificil: { count: 6, maxLives: 75, entrances: 2, exits: 2 }
};

function loadCatalog() {
  let src = fs.readFileSync(MAP_FILE, 'utf8');
  src = src.replace(/\bimport\s+.*?from\s+['"][^'"]+['"];?\s*/g, '');
  src = src.replace(/\bexport\s+(?:const|let|var)\s+/g, 'const ');
  src = src.replace(/\bexport\s+function\s+/g, 'function ');
  src = src.replace(/\bexport\s+default\s+/g, 'const __default__ = ');
  src += '\nmodule.exports = { MAP_CATALOG, DEFAULT_MAP_IDS };';
  const sandbox = { module: { exports: {} }, exports: {} };
  vm.runInNewContext(src, sandbox, { filename: MAP_FILE });
  return sandbox.module.exports;
}

const errors = [];
const warnings = [];
const fail = msg => errors.push(msg);
const warn = msg => warnings.push(msg);

let data;
try {
  data = loadCatalog();
} catch (err) {
  console.error(`No se pudo cargar ${MAP_FILE}: ${err.message}`);
  process.exit(1);
}

const { MAP_CATALOG, DEFAULT_MAP_IDS } = data;
if (!MAP_CATALOG || typeof MAP_CATALOG !== 'object') {
  console.error('MAP_CATALOG no es un objeto.');
  process.exit(1);
}

const entries = Object.entries(MAP_CATALOG);
const byDiff = { facil: 0, normal: 0, dificil: 0 };
const mapIds = new Set();

for (const [key, map] of entries) {
  const where = `mapa "${key}"`;
  if (!map || typeof map !== 'object') {
    fail(`${where}: no es un objeto`);
    continue;
  }
  if (map.id !== key) fail(`${where}: id "${map.id}" no coincide con la clave`);
  if (mapIds.has(map.id)) fail(`${where}: id duplicado "${map.id}"`);
  mapIds.add(map.id);

  const diff = EXPECTED[map.difficulty];
  if (!diff) {
    fail(`${where}: difficulty "${map.difficulty}" inválida`);
  } else {
    byDiff[map.difficulty]++;
  }

  if (!map.name || !map.badge || !map.desc) warn(`${where}: falta name/badge/desc`);
  if (map.startingScrap !== 10) warn(`${where}: startingScrap=${map.startingScrap}; la invariante actual es 10`);
  if (diff && map.maxLives !== diff.maxLives) warn(`${where}: maxLives=${map.maxLives}; esperado ${diff.maxLives} para ${map.difficulty}`);

  const routes = map.routes && typeof map.routes === 'object' ? Object.entries(map.routes) : [];
  if (routes.length === 0) {
    fail(`${where}: no tiene rutas`);
    continue;
  }

  const routeIds = new Set();
  for (const [rKey, route] of routes) {
    const rWhere = `${where} ruta "${rKey}"`;
    if (!route || typeof route !== 'object') {
      fail(`${rWhere}: no es un objeto`);
      continue;
    }
    if (route.id !== rKey) fail(`${rWhere}: id "${route.id}" no coincide con la clave`);
    routeIds.add(rKey);
    if (!route.name) warn(`${rWhere}: falta name`);
    if (!Number.isFinite(route.color)) warn(`${rWhere}: color no numérico`);
    const pts = Array.isArray(route.controlPoints) ? route.controlPoints : [];
    if (pts.length < 2) fail(`${rWhere}: necesita al menos 2 controlPoints`);
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.z)) {
        fail(`${rWhere}: controlPoint[${i}] sin x/z numéricos`);
        continue;
      }
      if (Math.abs(p.x) > 60 || Math.abs(p.z) > 60) {
        warn(`${rWhere}: controlPoint[${i}] (${p.x}, ${p.z}) fuera del rango de referencia ±60`);
      }
    }
  }

  const spawns = Array.isArray(map.spawnPoints) ? map.spawnPoints : [];
  const exits = Array.isArray(map.exitPoints) ? map.exitPoints : [];
  if (!Array.isArray(map.spawnPoints)) fail(`${where}: spawnPoints no es un array`);
  if (!Array.isArray(map.exitPoints)) fail(`${where}: exitPoints no es un array`);
  if (map.entrances !== spawns.length) fail(`${where}: entrances=${map.entrances} pero spawnPoints=${spawns.length}`);
  if (map.exits !== exits.length) fail(`${where}: exits=${map.exits} pero exitPoints=${exits.length}`);
  if (diff) {
    if (map.entrances !== diff.entrances) warn(`${where}: entrances=${map.entrances}; referencia ${diff.entrances}`);
    if (map.exits !== diff.exits) warn(`${where}: exits=${map.exits}; referencia ${diff.exits}`);
  }

  const spawnIds = new Set();
  for (const [i, sp] of spawns.entries()) {
    if (!sp || !sp.id) fail(`${where}: spawnPoints[${i}] sin id`);
    else if (spawnIds.has(sp.id)) fail(`${where}: spawnPoint duplicado "${sp.id}"`);
    else spawnIds.add(sp.id);
    if (!sp?.pathId || !routeIds.has(sp.pathId)) fail(`${where}: spawnPoints[${i}].pathId "${sp?.pathId}" no existe`);
  }
  const exitIds = new Set();
  for (const [i, ep] of exits.entries()) {
    if (!ep || !ep.id) fail(`${where}: exitPoints[${i}] sin id`);
    else if (exitIds.has(ep.id)) fail(`${where}: exitPoint duplicado "${ep.id}"`);
    else exitIds.add(ep.id);
    if (!ep?.pathId || !routeIds.has(ep.pathId)) fail(`${where}: exitPoints[${i}].pathId "${ep?.pathId}" no existe`);
  }
}

for (const [diff, spec] of Object.entries(EXPECTED)) {
  if (byDiff[diff] !== spec.count) fail(`Dificultad ${diff}: ${byDiff[diff]} mapas; esperados ${spec.count}`);
}

if (!DEFAULT_MAP_IDS || typeof DEFAULT_MAP_IDS !== 'object') {
  fail('DEFAULT_MAP_IDS no existe');
} else {
  for (const [diff, spec] of Object.entries(EXPECTED)) {
    const id = DEFAULT_MAP_IDS[diff];
    if (!id) fail(`DEFAULT_MAP_IDS.${diff} no definido`);
    else if (!MAP_CATALOG[id]) fail(`DEFAULT_MAP_IDS.${diff}="${id}" no existe en MAP_CATALOG`);
    else if (MAP_CATALOG[id].difficulty !== diff) fail(`DEFAULT_MAP_IDS.${diff}="${id}" pertenece a ${MAP_CATALOG[id].difficulty}`);
    void spec;
  }
}

const report = {
  ok: errors.length === 0,
  file: path.relative(ROOT, MAP_FILE),
  totalMaps: entries.length,
  byDifficulty: byDiff,
  errors,
  warnings
};

if (JSON_OUT) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log('Auditoría de mapas — Traces of Rust');
  console.log(`Archivo: ${report.file}`);
  console.log(`Mapas: ${entries.length} (fácil ${byDiff.facil}, normal ${byDiff.normal}, difícil ${byDiff.dificil})`);
  for (const w of warnings) console.log(`  WARN  ${w}`);
  for (const e of errors) console.log(`  ERROR ${e}`);
  console.log(`\n${errors.length} error(es), ${warnings.length} warning(s).`);
}

process.exit(errors.length === 0 ? 0 : 1);
