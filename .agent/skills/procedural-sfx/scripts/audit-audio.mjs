#!/usr/bin/env node
// Audita el uso de WebAudio sin dependencias.
// Uso: node .claude/skills/procedural-sfx/scripts/audit-audio.mjs [--json]

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

const SCAN_DIRS = ['js', 'css'];
const SCAN_FILES = ['index.html'];
const AUDIO_EXT = /\.(mp3|wav|ogg|m4a|aac|flac)(?:[?#"')\s]|$)/i;

const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else files.push(full);
  }
}
for (const dir of SCAN_DIRS) {
  const full = path.join(ROOT, dir);
  if (fs.existsSync(full)) walk(full);
}
for (const file of SCAN_FILES) {
  const full = path.join(ROOT, file);
  if (fs.existsSync(full)) files.push(full);
}

// ---------------------------------------------------------------------------
// Archivos de audio externos
// ---------------------------------------------------------------------------
for (const file of files) {
  const rel = path.relative(ROOT, file);
  const src = fs.readFileSync(file, 'utf8');
  if (AUDIO_EXT.test(src) || /new\s+Audio\s*\(/.test(src)) {
    fail(`${rel}: referencia a audio externo (no permitido; todo debe ser WebAudio procedural)`);
  }
}

// ---------------------------------------------------------------------------
// AudioContext fuera de audio.js
// ---------------------------------------------------------------------------
for (const file of files) {
  if (!file.endsWith('.js')) continue;
  const rel = path.relative(ROOT, file);
  if (rel.replace(/\\/g, '/').endsWith('js/audio.js')) continue;
  const src = fs.readFileSync(file, 'utf8');
  if (/new\s+(window\.)?(AudioContext|webkitAudioContext)\s*\(/.test(src)) {
    warn(`${rel}: crea su propio AudioContext; usa AudioSys.ctx`);
  }
}

// ---------------------------------------------------------------------------
// Llamadas a AudioSys.play con volumen literal
// ---------------------------------------------------------------------------
function splitArgs(text) {
  const args = [];
  let depth = 0;
  let current = '';
  let quote = null;
  let escaped = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      current += ch;
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === '(' || ch === '[' || ch === '{') {
      depth++;
      current += ch;
      continue;
    }
    if (ch === ')' || ch === ']' || ch === '}') {
      depth--;
      current += ch;
      continue;
    }
    if (ch === ',' && depth === 0) {
      args.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) args.push(current.trim());
  return args;
}

function extractPlayCalls(src) {
  const calls = [];
  const needle = 'AudioSys.play(';
  let index = 0;
  while ((index = src.indexOf(needle, index)) !== -1) {
    const open = index + needle.length - 1;
    let depth = 0;
    let quote = null;
    let escaped = false;
    let end = -1;
    for (let i = open; i < src.length; i++) {
      const ch = src[i];
      if (quote) {
        if (escaped) escaped = false;
        else if (ch === '\\') escaped = true;
        else if (ch === quote) quote = null;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') {
        quote = ch;
        continue;
      }
      if (ch === '(') depth++;
      else if (ch === ')') {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end === -1) break;
    const raw = src.slice(open + 1, end);
    calls.push({ index, raw, args: splitArgs(raw) });
    index = end + 1;
  }
  return calls;
}

const playCalls = [];
for (const file of files) {
  if (!file.endsWith('.js')) continue;
  const rel = path.relative(ROOT, file);
  const src = fs.readFileSync(file, 'utf8');
  for (const call of extractPlayCalls(src)) {
    playCalls.push({ file: rel, ...call });
    if (call.args.length >= 4) {
      const vol = call.args[3];
      if (/^\d*\.?\d+$/.test(vol)) {
        const value = Number(vol);
        if (value > 0.2) warn(`${rel}: AudioSys.play con vol=${vol} (> 0.2)`);
        if (value <= 0) warn(`${rel}: AudioSys.play con vol=${vol} (inaudible)`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Sincronización de ajustes
// ---------------------------------------------------------------------------
let applySettingsCalls = 0;
for (const file of files) {
  if (!file.endsWith('.js')) continue;
  const src = fs.readFileSync(file, 'utf8');
  applySettingsCalls += (src.match(/AudioSys\.(?:applySettings|applyGameSettings)\s*\(/g) || []).length;
}
if (applySettingsCalls === 0) {
  warn('AudioSys.applySettings/applyGameSettings no se llama: los volúmenes de gameSettings no se aplican');
}

const report = {
  ok: errors.length === 0,
  scannedFiles: files.length,
  playCalls: playCalls.length,
  applySettingsCalls,
  errors,
  warnings
};

if (JSON_OUT) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log('Auditoría de audio — Traces of Rust');
  console.log(`Archivos escaneados: ${files.length} · Llamadas a AudioSys.play: ${playCalls.length} · applySettings: ${applySettingsCalls}`);
  for (const w of warnings) console.log(`  WARN  ${w}`);
  for (const e of errors) console.log(`  ERROR ${e}`);
  console.log(`\n${errors.length} error(es), ${warnings.length} warning(s).`);
}

process.exit(errors.length === 0 ? 0 : 1);
