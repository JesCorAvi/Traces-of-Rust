#!/usr/bin/env node
// Sincroniza .claude/skills → .agent/skills (espejo byte-a-byte).
// Uso: node scripts/sync-skills.mjs [--dry-run]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(ROOT, '.claude', 'skills');
const TARGET = path.join(ROOT, '.agent', 'skills');
const DRY_RUN = process.argv.includes('--dry-run');

if (!fs.existsSync(SOURCE)) {
  console.error(`No existe ${SOURCE}`);
  process.exit(1);
}

function listFiles(dir) {
  const out = [];
  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      const rel = path.relative(dir, full).replace(/\\/g, '/');
      if (entry.isDirectory()) walk(full);
      else out.push(rel);
    }
  }
  walk(dir);
  return out.sort();
}

// Recoger archivos fuente
const sourceFiles = listFiles(SOURCE);

// Limpiar archivos en target que ya no existen en source
const targetFiles = fs.existsSync(TARGET) ? listFiles(TARGET) : [];
const sourceSet = new Set(sourceFiles);
let removed = 0;
for (const rel of targetFiles) {
  if (!sourceSet.has(rel)) {
    const full = path.join(TARGET, rel);
    if (DRY_RUN) {
      console.log(`  BORRAR ${rel}`);
    } else {
      fs.unlinkSync(full);
    }
    removed++;
  }
}

// Copiar archivos nuevos o modificados
let copied = 0;
let skipped = 0;
for (const rel of sourceFiles) {
  const src = path.join(SOURCE, rel);
  const dst = path.join(TARGET, rel);
  const srcBuf = fs.readFileSync(src);

  if (fs.existsSync(dst)) {
    const dstBuf = fs.readFileSync(dst);
    if (srcBuf.equals(dstBuf)) {
      skipped++;
      continue;
    }
  }

  if (DRY_RUN) {
    console.log(`  COPIAR ${rel}`);
  } else {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.writeFileSync(dst, srcBuf);
  }
  copied++;
}

// Limpiar carpetas vacías en target
if (!DRY_RUN && fs.existsSync(TARGET)) {
  function pruneEmpty(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) pruneEmpty(path.join(dir, entry.name));
    }
    if (fs.readdirSync(dir).length === 0 && dir !== TARGET) {
      fs.rmdirSync(dir);
    }
  }
  pruneEmpty(TARGET);
}

console.log(`Sync .claude/skills → .agent/skills: ${copied} copiado(s), ${skipped} sin cambios, ${removed} borrado(s).${DRY_RUN ? ' (dry-run)' : ''}`);
