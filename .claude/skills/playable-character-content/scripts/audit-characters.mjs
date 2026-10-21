#!/usr/bin/env node
// Audita el catálogo de operadores: IDs, temas, armas, iconos y statMods.
// Uso: node .claude/skills/playable-character-content/scripts/audit-characters.mjs [--json]

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function loadModule(rel, exportNames) {
  const file = path.join(ROOT, rel);
  let src = fs.readFileSync(file, 'utf8');
  src = src.replace(/\bimport\s+.*?from\s+['"][^'"]+['"];?\s*/g, '');
  src = src.replace(/\bexport\s+const\s+/g, 'const ');
  src = src.replace(/\bexport\s+function\s+/g, 'function ');
  src = src.replace(/\bexport\s+default\s+/g, 'const __default__ = ');
  src += `\nmodule.exports = { ${exportNames.join(', ')} };`;
  const sandbox = { module: { exports: {} }, exports: {} };
  vm.runInNewContext(src, sandbox, { filename: file });
  return sandbox.module.exports;
}

function readText(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

// ---------------------------------------------------------------------------
// Load data
// ---------------------------------------------------------------------------
let CHARACTERS;
try {
  ({ CHARACTERS } = loadModule('js/config/charactersConfig.js', ['CHARACTERS']));
} catch (err) {
  console.error(`No se pudo cargar charactersConfig.js: ${err.message}`);
  process.exit(1);
}

// CHARACTER_THEMES: body.js
let CHARACTER_THEMES;
try {
  const bodySrc = readText('js/sprites/player/body.js');
  const themeMatch = bodySrc.match(/export\s+const\s+CHARACTER_THEMES\s*=\s*\{/);
  if (themeMatch) {
    const start = themeMatch.index + themeMatch[0].length - 1;
    let depth = 0;
    let end = start;
    for (let i = start; i < bodySrc.length; i++) {
      if (bodySrc[i] === '{') depth++;
      else if (bodySrc[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
    }
    const themeObj = bodySrc.slice(start, end);
    const sandbox = { module: { exports: {} } };
    vm.runInNewContext(`module.exports = ${themeObj};`, sandbox, { filename: 'body.js' });
    CHARACTER_THEMES = sandbox.module.exports;
  } else {
    CHARACTER_THEMES = {};
    warn('No se encontró CHARACTER_THEMES en body.js');
  }
} catch (err) {
  CHARACTER_THEMES = {};
  warn(`No se pudo parsear CHARACTER_THEMES: ${err.message}`);
}

// Valid weapons (from CONFIG.SKILLS in config.js)
const VALID_WEAPONS = new Set([
  'slash', 'shotgun', 'flamethrower', 'aura', 'mines', 'harpoon', 'orbital', 'bolt'
]);

// Valid weapon icons (row 0 in CONFIG.UI_SPRITES.ICONS)
const VALID_ICONS = new Set([
  'slash', 'shotgun', 'flamethrower', 'aura', 'mines', 'harpoon', 'orbital', 'bolt',
  'turret_gunner', 'turret_mortar', 'turret_cryo', 'turret_barracks', 'turret_support'
]);

// Recognized statMod keys: todas activamente consumidas por el motor de combate
const CONSUMED_STAT_KEYS = new Set([
  'moveSpeedMult', 'atkSpeedMult', 'critChanceBonus', 'areaMult',
  'regenPerSec', 'bonusProjectiles', 'dmgMult', 'damageReduction',
  'knockbackMult', 'baseHpBonus',
  'slashDmgMult', 'projectileDmgMult', 'fireDmgMult', 'auraSlowBonus',
  'explosiveDmgMult', 'harpoonDmgMult', 'orbitalDmgMult', 'boltChainsExtra',
  'extraOrbitals', 'rangeMult'
]);

// Claves de arma pendientes de consumidor (vacío: todas implementadas)
const PENDING_WEAPON_STAT_KEYS = new Set([]);

const ALL_RECOGNIZED_STAT_KEYS = new Set([...CONSUMED_STAT_KEYS, ...PENDING_WEAPON_STAT_KEYS]);

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------
const charEntries = Object.entries(CHARACTERS || {});
if (charEntries.length === 0) fail('CHARACTERS está vacío');

const charIds = new Set();
const themeIds = new Set(Object.keys(CHARACTER_THEMES || {}));
const pendingStatUses = new Map();

for (const [key, char] of charEntries) {
  const where = `operador "${key}"`;
  if (!char || typeof char !== 'object') {
    fail(`${where}: no es un objeto`);
    continue;
  }

  // ID match
  if (char.id !== key) fail(`${where}: id "${char.id}" no coincide con la clave`);
  if (charIds.has(char.id)) fail(`${where}: id duplicado "${char.id}"`);
  charIds.add(char.id);

  // Required fields: title (name), role, weapon, icon
  const displayName = char.title || char.name;
  if (!displayName) fail(`${where}: falta title/name`);
  if (!char.role) fail(`${where}: falta role`);
  if (!char.passive) warn(`${where}: falta passive`);
  if (!char.passiveDesc) warn(`${where}: falta passiveDesc`);

  // Weapon
  if (!char.weapon) {
    fail(`${where}: falta weapon`);
  } else if (!VALID_WEAPONS.has(char.weapon)) {
    fail(`${where}: weapon "${char.weapon}" no es válida (${Array.from(VALID_WEAPONS).join(', ')})`);
  }

  // Icon
  if (!char.icon) {
    fail(`${where}: falta icon`);
  } else if (!VALID_ICONS.has(char.icon)) {
    fail(`${where}: icon "${char.icon}" no está registrado en CONFIG.UI_SPRITES.ICONS`);
  }

  // Theme in body.js
  if (!themeIds.has(key)) {
    fail(`${where}: sin entrada en CHARACTER_THEMES (caerá silenciosamente a Otto)`);
  } else {
    const theme = CHARACTER_THEMES[key];
    if (!theme.feature) warn(`${where}: tema no define "feature" visual`);
  }

  // statMods
  if (char.statMods && typeof char.statMods === 'object') {
    for (const modKey of Object.keys(char.statMods)) {
      if (!ALL_RECOGNIZED_STAT_KEYS.has(modKey)) {
        fail(`${where}: statMod "${modKey}" desconocido`);
      } else if (PENDING_WEAPON_STAT_KEYS.has(modKey)) {
        if (!pendingStatUses.has(modKey)) pendingStatUses.set(modKey, []);
        pendingStatUses.get(modKey).push(key);
      }
    }
  }

  // Colors
  if (!char.color) warn(`${where}: falta color primario`);
  if (!char.accentColor) warn(`${where}: falta accentColor`);
}

// Un solo aviso agregado: el hallazgo es el mismo aunque afecte a varios operadores.
if (pendingStatUses.size > 0) {
  const detail = Array.from(pendingStatUses.entries())
    .map(([modKey, ids]) => `${modKey} (${ids.join(', ')})`)
    .join('; ');
  warn(`statMods pendientes de consumidor en arma: ${detail}`);
}

// Orphan themes check
for (const themeId of themeIds) {
  if (!charIds.has(themeId)) {
    warn(`CHARACTER_THEMES["${themeId}"] no tiene operador en CHARACTERS (tema huérfano)`);
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const report = {
  ok: errors.length === 0,
  characters: charEntries.length,
  themes: themeIds.size,
  weapons: VALID_WEAPONS.size,
  icons: VALID_ICONS.size,
  pendingStatKeys: Object.fromEntries(pendingStatUses),
  errors,
  warnings
};

if (JSON_OUT) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log('Auditoría de personajes — Traces of Rust');
  console.log(`Archivo: js/config/charactersConfig.js`);
  console.log(`Operadores: ${report.characters} · Temas: ${report.themes} · Armas válidas: ${report.weapons}`);
  for (const w of warnings) console.log(`  WARN  ${w}`);
  for (const e of errors) console.log(`  ERROR ${e}`);
  console.log(`\n${errors.length} error(es), ${warnings.length} warning(s).`);
}

process.exit(errors.length === 0 ? 0 : 1);
