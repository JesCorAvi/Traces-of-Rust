#!/usr/bin/env node
// Audita entidades 3D, sprites procedurales y gestión de memoria GPU.
// Uso: node .claude/skills/procedural-3d-entity/scripts/audit-entities.mjs [--json]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../../..');
const JSON_OUT = process.argv.includes('--json');

const errors = [];
const warnings = [];
const fail = msg => errors.push(msg);
const warn = msg => warnings.push(msg);

const SCAN_DIRS = ['js'];
const TEXTURE_EXT = /\.(png|jpe?g|gif|webp|bmp|tga|dds|hdr)\b/i;

const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.js')) files.push(full);
  }
}
for (const d of SCAN_DIRS) {
  const p = path.join(ROOT, d);
  if (fs.existsSync(p)) walk(p);
}

// ---------------------------------------------------------------------------
// 1. Texturas externas prohibidas (Cero PNG/JPG, cero TextureLoader)
// ---------------------------------------------------------------------------
let scannedFiles = 0;
for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const src = fs.readFileSync(file, 'utf8');
  scannedFiles++;

  // TextureLoader check
  if (/\bTextureLoader\b/.test(src)) {
    fail(`${rel}: uso de TextureLoader prohibido (todo debe ser procedural vía canvas/geometría)`);
  }

  // External image file reference in strings
  const lines = src.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Ignore comments
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
    if (TEXTURE_EXT.test(line) && !line.includes('mimeType') && !line.includes('data:image')) {
      fail(`${rel}:${i + 1}: referencia a textura o archivo externo (${line.trim()})`);
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Filtros de CanvasTexture y generateMipmaps
// ---------------------------------------------------------------------------
let canvasTextureCount = 0;
for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const src = fs.readFileSync(file, 'utf8');

  const matches = [...src.matchAll(/new\s+(?:THREE\.)?CanvasTexture\s*\(/g)];
  if (matches.length > 0) {
    canvasTextureCount += matches.length;
    // Check if the file configures NearestFilter
    if (!src.includes('NearestFilter')) {
      warn(`${rel}: crea CanvasTexture pero no menciona NearestFilter (pixel-art requiere NearestFilter)`);
    }
    // Check if generateMipmaps = false is set
    if (!src.includes('generateMipmaps = false') && !src.includes('generateMipmaps=false')) {
      warn(`${rel}: CanvasTexture sin generateMipmaps = false (desperdicia memoria GPU en mipmaps no usados)`);
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Verificación de disposeObject3D en sistemas defensivos y entidades dinámicas
// ---------------------------------------------------------------------------
const DYNAMIC_ENTITIES = [
  'js/defense/turret.js',
  'js/defense/defensiveStructure.js',
  'js/defense/allyUnit.js',
  'js/defense/pathSystem.js',
  'js/defense/spawnPointSystem.js',
  'js/defense/exitPointSystem.js',
  'js/defense/turretSystem.js'
];

let entitiesChecked = 0;
for (const rel of DYNAMIC_ENTITIES) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) continue;
  entitiesChecked++;
  const src = fs.readFileSync(full, 'utf8');
  const hasDestroy = /\bdestroy\s*\(/.test(src) || /extends\s+DefensiveStructure\b/.test(src);
  const hasDispose = /\bdisposeObject3D\b/.test(src) || /extends\s+DefensiveStructure\b/.test(src);
  if (!hasDestroy) {
    warn(`${rel}: no define método destroy() explícito (ni hereda de DefensiveStructure)`);
  }
  if (!hasDispose) {
    fail(`${rel}: entidad dinámica sin invocación ni herencia de disposeObject3D`);
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const report = {
  ok: errors.length === 0,
  scannedFiles,
  canvasTextures: canvasTextureCount,
  dynamicEntities: entitiesChecked,
  errors,
  warnings
};

if (JSON_OUT) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log('Auditoría 3D y Entidades Procedurales — Traces of Rust');
  console.log(`Archivos escaneados: ${scannedFiles} · CanvasTextures: ${canvasTextureCount} · Entidades dinámicas: ${entitiesChecked}`);
  for (const w of warnings) console.log(`  WARN  ${w}`);
  for (const e of errors) console.log(`  ERROR ${e}`);
  console.log(`\n${errors.length} error(es), ${warnings.length} warning(s).`);
}

process.exit(errors.length === 0 ? 0 : 1);
