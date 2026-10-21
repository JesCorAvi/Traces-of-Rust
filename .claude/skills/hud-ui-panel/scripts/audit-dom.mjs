#!/usr/bin/env node
// Audita IDs y overlays de la UI sin dependencias.
// Uso: node .claude/skills/hud-ui-panel/scripts/audit-dom.mjs [--json]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../../..');
const INDEX = path.join(ROOT, 'index.html');
const JS_DIR = path.join(ROOT, 'js');
const JSON_OUT = process.argv.includes('--json');

const errors = [];
const warnings = [];
const fail = msg => errors.push(msg);
const warn = msg => warnings.push(msg);

const html = fs.readFileSync(INDEX, 'utf8');

// IDs declarados en HTML
const htmlIds = new Map();
for (const match of html.matchAll(/\bid\s*=\s*["']([^"']+)["']/g)) {
  const id = match[1];
  htmlIds.set(id, (htmlIds.get(id) || 0) + 1);
}
for (const [id, count] of htmlIds) {
  if (count > 1) fail(`index.html: id duplicado "${id}" (${count} veces)`);
}

// Overlays que no arrancan ocultos
for (const match of html.matchAll(/<([a-zA-Z][\w-]*)\b[^>]*class\s*=\s*["']([^"']*)["'][^>]*>/g)) {
  const tag = match[1];
  const classes = match[2].split(/\s+/).filter(Boolean);
  if (!classes.includes('overlay')) continue;
  const idMatch = match[0].match(/\bid\s*=\s*["']([^"']+)["']/);
  const id = idMatch ? idMatch[1] : '(sin id)';
  if (!classes.includes('hidden') && id !== 'start-screen') {
    warn(`index.html: overlay "${id}" (<${tag}>) no tiene la clase hidden`);
  }
}

// Recorrer JS
const jsFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.js')) jsFiles.push(full);
  }
}
walk(JS_DIR);

// IDs creados dinámicamente desde JS
const dynamicIds = new Set();
for (const file of jsFiles) {
  const src = fs.readFileSync(file, 'utf8');
  for (const match of src.matchAll(/\bid\s*=\s*["'`]([^"'`$]+)["'`]/g)) {
    dynamicIds.add(match[1]);
  }
}

const refs = [];
for (const file of jsFiles) {
  const src = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file);
  for (const match of src.matchAll(/getElementById\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    refs.push({ id: match[1], file: rel, api: 'getElementById' });
  }
  for (const match of src.matchAll(/querySelector(?:All)?\(\s*['"]#([A-Za-z0-9_-]+)['"]\s*\)/g)) {
    refs.push({ id: match[1], file: rel, api: 'querySelector' });
  }
}

const missing = [];
for (const ref of refs) {
  if (htmlIds.has(ref.id) || dynamicIds.has(ref.id)) continue;
  missing.push(ref);
}
const uniqueMissing = [...new Map(missing.map(r => [`${r.id}|${r.file}|${r.api}`, r])).values()];
for (const ref of uniqueMissing) {
  warn(`${ref.file}: ${ref.api}("#${ref.id}") no aparece en index.html ni como id dinámico`);
}

const report = {
  ok: errors.length === 0,
  htmlIds: htmlIds.size,
  jsFiles: jsFiles.length,
  references: refs.length,
  missingReferences: uniqueMissing.length,
  errors,
  warnings
};

if (JSON_OUT) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log('Auditoría DOM — Traces of Rust');
  console.log(`IDs en index.html: ${htmlIds.size} · Archivos JS: ${jsFiles.length} · Referencias: ${refs.length}`);
  for (const w of warnings) console.log(`  WARN  ${w}`);
  for (const e of errors) console.log(`  ERROR ${e}`);
  console.log(`\n${errors.length} error(es), ${warnings.length} warning(s).`);
}

process.exit(errors.length === 0 ? 0 : 1);
