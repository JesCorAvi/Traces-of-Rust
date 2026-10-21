#!/usr/bin/env node
// Audita la integración Electron/Steamworks: IPC, preload, seguridad y contratos.
// Uso: node .claude/skills/electron-steam-bridge/scripts/audit-bridge.mjs [--json]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../../..');
const JSON_OUT = process.argv.includes('--json');

const MAIN_FILE = path.join(ROOT, 'electron-main.cjs');
const PRELOAD_FILE = path.join(ROOT, 'preload.cjs');

const errors = [];
const warnings = [];
const fail = msg => errors.push(msg);
const warn = msg => warnings.push(msg);

if (!fs.existsSync(MAIN_FILE)) {
  console.error(`No existe ${MAIN_FILE}`);
  process.exit(1);
}
if (!fs.existsSync(PRELOAD_FILE)) {
  console.error(`No existe ${PRELOAD_FILE}`);
  process.exit(1);
}

const mainSrc = fs.readFileSync(MAIN_FILE, 'utf8');
const preloadSrc = fs.readFileSync(PRELOAD_FILE, 'utf8');

// ---------------------------------------------------------------------------
// 1. Verificación de Seguridad en electron-main.cjs
// ---------------------------------------------------------------------------
if (!/contextIsolation\s*:\s*true/.test(mainSrc)) {
  fail('electron-main.cjs: contextIsolation debe ser true');
}
if (!/nodeIntegration\s*:\s*false/.test(mainSrc)) {
  fail('electron-main.cjs: nodeIntegration debe ser false');
}
if (!/backgroundThrottling\s*:\s*false/.test(mainSrc)) {
  warn('electron-main.cjs: backgroundThrottling debería ser false para evitar desincronización con Alt+Tab');
}

// ---------------------------------------------------------------------------
// 2. Canales IPC en electron-main.cjs
// ---------------------------------------------------------------------------
const mainHandleChannels = new Set();
for (const match of mainSrc.matchAll(/ipcMain\.handle\(\s*['"]([^'"]+)['"]/g)) {
  mainHandleChannels.add(match[1]);
}

const mainSendEvents = new Set();
for (const match of mainSrc.matchAll(/webContents\.send\(\s*['"]([^'"]+)['"]/g)) {
  mainSendEvents.add(match[1]);
}

// ---------------------------------------------------------------------------
// 3. Invocaciones y escuchas en preload.cjs
// ---------------------------------------------------------------------------
const preloadInvokes = new Set();
for (const match of preloadSrc.matchAll(/ipcRenderer\.invoke\(\s*['"]([^'"]+)['"]/g)) {
  preloadInvokes.add(match[1]);
}

const preloadListens = new Set();
for (const match of preloadSrc.matchAll(/ipcRenderer\.on\(\s*['"]([^'"]+)['"]/g)) {
  preloadListens.add(match[1]);
}

// Comprobar que toda invocación del preload existe en el main
for (const ch of preloadInvokes) {
  if (!mainHandleChannels.has(ch)) {
    fail(`preload.cjs: invoca canal no registrado en electron-main.cjs: "${ch}"`);
  }
}

// Comprobar que todo canal handle de main es consumido o conocido
for (const ch of mainHandleChannels) {
  if (!preloadInvokes.has(ch)) {
    warn(`electron-main.cjs: canal "${ch}" registrado en main pero no invocado desde preload.cjs`);
  }
}

// Comprobar eventos push
for (const ev of mainSendEvents) {
  if (!preloadListens.has(ev)) {
    warn(`electron-main.cjs: emite evento push "${ev}" pero preload.cjs no tiene listener con ipcRenderer.on`);
  }
}

// ---------------------------------------------------------------------------
// 4. Comprobar puentes de contexto expuestos
// ---------------------------------------------------------------------------
if (!/contextBridge\.exposeInMainWorld\(\s*['"]electronWindow['"]/.test(preloadSrc)) {
  fail('preload.cjs: falta exposición de window.electronWindow');
}
if (!/contextBridge\.exposeInMainWorld\(\s*['"]steamOnline['"]/.test(preloadSrc)) {
  fail('preload.cjs: falta exposición de window.steamOnline');
}

// Comprobar que los listeners devuelven función de desuscripción
const onMethodBlocks = preloadSrc.matchAll(/on[A-Z][a-zA-Z0-9_]*\s*:\s*\([^)]*\)\s*=>\s*\{([^}]+)\}/g);
for (const block of onMethodBlocks) {
  const body = block[1];
  if (!body.includes('return') || (!body.includes('removeListener') && !body.includes('off'))) {
    warn(`preload.cjs: un método listener push podría no devolver su función unsubscribe`);
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const report = {
  ok: errors.length === 0,
  mainChannels: mainHandleChannels.size,
  mainPushEvents: mainSendEvents.size,
  preloadInvokes: preloadInvokes.size,
  preloadListens: preloadListens.size,
  errors,
  warnings
};

if (JSON_OUT) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log('Auditoría Electron/Steam Bridge — Traces of Rust');
  console.log(`Canales IPC: ${report.mainChannels} · Eventos push: ${report.mainPushEvents} · Invocaciones preload: ${report.preloadInvokes}`);
  for (const w of warnings) console.log(`  WARN  ${w}`);
  for (const e of errors) console.log(`  ERROR ${e}`);
  console.log(`\n${errors.length} error(es), ${warnings.length} warning(s).`);
}

process.exit(errors.length === 0 ? 0 : 1);
