#!/usr/bin/env node
// Auditoría estática de MultiplayerSync: clave reservada, fiabilidad y presupuesto.
// Uso: node .claude/skills/netcode-audit/scripts/audit-netcode.mjs [--json]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../../..');
const SYNC_FILE = path.join(ROOT, 'js/online/multiplayerSync.js');
const MAIN_FILE = path.join(ROOT, 'electron-main.cjs');
const JSON_OUT = process.argv.includes('--json');

const errors = [];
const warnings = [];
const fail = msg => errors.push(msg);
const warn = msg => warnings.push(msg);

const src = fs.readFileSync(SYNC_FILE, 'utf8');
const rel = path.relative(ROOT, SYNC_FILE);

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

function extractCalls(source, method) {
  const calls = [];
  const needle = `${method}(`;
  let index = 0;
  while ((index = source.indexOf(needle, index)) !== -1) {
    // Evita coincidencias dentro de strings o nombres de métodos más largos.
    const before = source[index - 1];
    if (before && /[\w$]/.test(before)) {
      index += needle.length;
      continue;
    }
    const open = index + needle.length - 1;
    let depth = 0;
    let quote = null;
    let escaped = false;
    let end = -1;
    for (let i = open; i < source.length; i++) {
      const ch = source[i];
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
    calls.push({ index, raw: source.slice(open + 1, end) });
    index = end + 1;
  }
  return calls;
}

function topLevelKeys(objectText) {
  const text = objectText.trim();
  if (!text.startsWith('{') || !text.endsWith('}')) return null;
  const body = text.slice(1, -1);
  const keys = [];
  let segment = '';
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (quote) {
      segment += ch;
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      segment += ch;
      continue;
    }
    if (ch === '(' || ch === '[' || ch === '{') {
      depth++;
      segment += ch;
      continue;
    }
    if (ch === ')' || ch === ']' || ch === '}') {
      depth--;
      segment += ch;
      continue;
    }
    if (ch === ',' && depth === 0) {
      const key = segment.trim().match(/^([A-Za-z_$][\w$]*)\s*:/);
      if (key) keys.push(key[1]);
      segment = '';
      continue;
    }
    segment += ch;
  }
  const key = segment.trim().match(/^([A-Za-z_$][\w$]*)\s*:/);
  if (key) keys.push(key[1]);
  return keys;
}

// ---------------------------------------------------------------------------
// 1. Clave `type` en el payload de nivel superior
// ---------------------------------------------------------------------------
const payloadCalls = [
  ...extractCalls(src, 'broadcast').map(c => ({ kind: 'broadcast', ...c })),
  ...extractCalls(src, 'sendToPeer').map(c => ({ kind: 'sendToPeer', ...c }))
];

for (const call of payloadCalls) {
  const args = splitArgs(call.raw);
  const packet = args[0]?.match(/^['"]([A-Z0-9_]+)['"]$/)?.[1];
  if (!packet) continue;
  const payloadIndex = call.kind === 'broadcast' ? 1 : 2;
  const payload = args[payloadIndex];
  if (!payload) continue;
  const keys = topLevelKeys(payload);
  if (keys && keys.includes('type')) {
    fail(`${rel}: ${packet} usa la clave reservada "type" en el payload (${call.kind})`);
  }
}

// ---------------------------------------------------------------------------
// 2. Fiabilidad esperada
// ---------------------------------------------------------------------------
const EXPECTED_RELIABILITY = {
  POS: false,
  ENEMY_BATCH_SYNC: false,
  ATTACK: false,
  PLAYER_HIT: true,
  STAGE_MATCH: true,
  CHAR_READY: true,
  CANCEL_STAGE: true,
  ENEMY_SPAWN: true,
  ENEMY_DIE: true,
  ENEMY_LEAK: true,
  PICKUP_SPAWN: true,
  PICKUP_COLLECTED: true,
  TURRET_STATE_SYNC: true,
  WAVE_STATE: true,
  CORE_SYNC: true,
  EVENT_START: true,
  EVENT_STATE: true,
  EVENT_END: true,
  MATCH_INFO: true,
  MATCH_END: true,
  NET_READY: true
};

for (const call of payloadCalls) {
  const args = splitArgs(call.raw);
  const packet = args[0]?.match(/^['"]([A-Z0-9_]+)['"]$/)?.[1];
  if (!packet || !(packet in EXPECTED_RELIABILITY)) continue;
  const index = call.kind === 'broadcast' ? 2 : 3;
  const literal = args[index];
  if (literal === 'true' || literal === 'false') {
    const value = literal === 'true';
    if (value !== EXPECTED_RELIABILITY[packet]) {
      fail(`${rel}: ${packet} usa reliable=${value}; se esperaba ${EXPECTED_RELIABILITY[packet]}`);
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Presupuesto y frecuencias
// ---------------------------------------------------------------------------
if (!/const\s+CHUNK\s*=\s*20\b/.test(src)) fail(`${rel}: no se encuentra el chunk de 20 en sendEnemyBatch`);
if (!/sendTimer\s*>=\s*0\.05\b/.test(src)) fail(`${rel}: no se encuentra el envío POS a 20 Hz (0.05)`);
if (!/enemySyncTimer\s*>=\s*0\.1\b/.test(src)) fail(`${rel}: no se encuentra el batch de enemigos a 10 Hz (0.1)`);
if (!/stateHeartbeat\s*>=\s*1\.0\b/.test(src)) warn(`${rel}: no se encuentra el latido de 1 Hz`);

const main = fs.readFileSync(MAIN_FILE, 'utf8');
if (!/readP2PPacket\s*\(/.test(main)) warn(`${path.relative(ROOT, MAIN_FILE)}: no se encuentra readP2PPacket en el pump`);
if (!/setInterval\([\s\S]*?,\s*16\s*\)/.test(main)) warn(`${path.relative(ROOT, MAIN_FILE)}: el pump P2P no parece correr a ~60 Hz`);

const report = {
  ok: errors.length === 0,
  file: rel,
  calls: payloadCalls.length,
  errors,
  warnings
};

if (JSON_OUT) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log('Auditoría netcode — Traces of Rust');
  console.log(`Archivo: ${rel} · Llamadas de red analizadas: ${payloadCalls.length}`);
  for (const w of warnings) console.log(`  WARN  ${w}`);
  for (const e of errors) console.log(`  ERROR ${e}`);
  console.log(`\n${errors.length} error(es), ${warnings.length} warning(s).`);
}

process.exit(errors.length === 0 ? 0 : 1);
