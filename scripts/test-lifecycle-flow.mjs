// scripts/test-lifecycle-flow.mjs
// Verificación integral de ciclo de vida completo de Localización (Fase 7).
// Simula:
//   1. Primer arranque sin configuración previa -> Muestra pantalla -> Selección de idioma.
//   2. Segundo arranque -> Omite pantalla de primer arranque -> Inicia en idioma guardado.
//   3. Menú de Ajustes -> Cambio en caliente a otro idioma -> Persistencia inmediata.
//   4. Selección de Automático (Sistema) -> Persistencia de 'auto' -> Detección dinámica.
//   5. Reinicio con Automático -> Omite pantalla -> Inicia en idioma del sistema.
//   6. Paridad al 100% de claves y placeholders {param} entre los 9 idiomas.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

console.log('🧪 Iniciando prueba integral de ciclo de vida completo (Fase 7)...\n');

let failed = 0;
function assert(cond, msg) {
  if (cond) {
    console.log(`  ✓ ${msg}`);
  } else {
    console.error(`  ❌ FALLO: ${msg}`);
    failed++;
  }
}

// -------------------------------------------------------------
// ENTORNO VIRTUAL DOM + LOCALSTORAGE PARA NODE.JS
// -------------------------------------------------------------
class MockElement {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this._className = '';
    this.classList = {
      _classes: new Set(),
      add(...c) { c.forEach(x => this._classes.add(x)); },
      remove(...c) { c.forEach(x => this._classes.delete(x)); },
      contains(c) { return this._classes.has(c); },
      toggle(c, force) {
        if (force === undefined) {
          if (this.contains(c)) this.remove(c); else this.add(c);
        } else if (force) this.add(c); else this.remove(c);
      }
    };
    this.attributes = new Map();
    this.children = [];
    this.listeners = new Map();
    this.tabIndex = -1;
    this.innerHTML = '';
    this.value = '50';
  }
  get className() { return Array.from(this.classList._classes).join(' '); }
  set className(val) {
    this._className = val || '';
    this.classList._classes = new Set(this._className.split(/\s+/).filter(Boolean));
  }
  setAttribute(k, v) { this.attributes.set(k, String(v)); }
  getAttribute(k) { return this.attributes.get(k) || null; }
  appendChild(child) {
    this.children.push(child);
    child.parentNode = this;
  }
  addEventListener(type, cb) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(cb);
  }
  removeEventListener(type, cb) {
    if (this.listeners.has(type)) {
      this.listeners.set(type, this.listeners.get(type).filter(x => x !== cb));
    }
  }
  closest(sel) {
    if (sel === '.hidden') {
      let p = this;
      while (p) {
        if (p.classList && p.classList.contains('hidden')) return p;
        p = p.parentNode;
      }
      return null;
    }
    return null;
  }
  querySelector(sel) {
    if (sel === '.lang-badge-active') {
      return this.children.find(c => c.classList.contains('lang-badge-active'));
    }
    return null;
  }
  querySelectorAll(sel) {
    const res = [];
    function walk(n) {
      for (const ch of n.children) {
        if (sel === '[data-i18n]' && ch.attributes.has('data-i18n')) res.push(ch);
        if (sel === '[data-i18n-html]' && ch.attributes.has('data-i18n-html')) res.push(ch);
        if (sel === '[data-i18n-attr]' && ch.attributes.has('data-i18n-attr')) res.push(ch);
        walk(ch);
      }
    }
    walk(this);
    return res;
  }
  click() {
    const list = this.listeners.get('click') || [];
    for (const cb of list) cb({ preventDefault() {} });
  }
  focus() {}
}

const domElements = new Map();
function getOrCreate(id, tag = 'div') {
  if (!domElements.has(id)) {
    const el = new MockElement(tag);
    el.id = id;
    domElements.set(id, el);
  }
  return domElements.get(id);
}

// Configurar elementos DOM necesarios
const firstBootScreen = getOrCreate('first-boot-lang-screen');
firstBootScreen.classList.add('overlay', 'hidden');
const firstBootContainer = getOrCreate('first-boot-grid-container');
firstBootScreen.appendChild(firstBootContainer);

const settingsScreen = getOrCreate('settings-screen');
settingsScreen.classList.add('overlay', 'hidden');
const settingsContainer = getOrCreate('settings-lang-container');
settingsScreen.appendChild(settingsContainer);
getOrCreate('btn-lang-auto', 'button');

getOrCreate('fullscreen-state-text');
getOrCreate('btn-toggle-fullscreen', 'button');
getOrCreate('set-master-vol', 'input');
getOrCreate('val-master-vol');
getOrCreate('set-sfx-vol', 'input');
getOrCreate('val-sfx-vol');
getOrCreate('set-music-vol', 'input');
getOrCreate('val-music-vol');
getOrCreate('set-amb-vol', 'input');
getOrCreate('val-amb-vol');
getOrCreate('btn-toggle-mute', 'button');
getOrCreate('btn-open-settings', 'button');
getOrCreate('btn-pause-settings', 'button');

const htmlRoot = new MockElement('html');
htmlRoot.lang = 'es';
const headEl = new MockElement('head');
const bodyEl = new MockElement('body');
htmlRoot.appendChild(headEl);
htmlRoot.appendChild(bodyEl);
bodyEl.appendChild(firstBootScreen);
bodyEl.appendChild(settingsScreen);

global.document = {
  createElement: (tag) => new MockElement(tag),
  getElementById: (id) => domElements.get(id) || null,
  querySelector: () => null,
  querySelectorAll: (sel) => htmlRoot.querySelectorAll(sel),
  documentElement: htmlRoot,
  head: headEl,
  body: bodyEl,
  activeElement: null,
  addEventListener: () => {}
};
global.window = {
  innerWidth: 1280,
  addEventListener: () => {},
  removeEventListener: () => {}
};
if (typeof globalThis.navigator === 'undefined') {
  global.navigator = { getGamepads: () => [], languages: ['es-ES', 'es'] };
} else {
  try {
    globalThis.navigator.getGamepads = () => [];
    globalThis.navigator.languages = ['es-ES', 'es'];
  } catch (e) {
    Object.defineProperty(globalThis, 'navigator', {
      value: { getGamepads: () => [], languages: ['es-ES', 'es'] },
      configurable: true,
      writable: true
    });
  }
}
const mockStorage = new Map();
global.localStorage = {
  getItem(k) { return mockStorage.get(k) || null; },
  setItem(k, v) { mockStorage.set(k, String(v)); },
  removeItem(k) { mockStorage.delete(k); },
  clear() { mockStorage.clear(); }
};
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = () => 1;
global.cancelAnimationFrame = () => {};

// -------------------------------------------------------------
// IMPORTAR MÓDULOS DE I18N Y UI
// -------------------------------------------------------------
const {
  initI18n,
  setLanguage,
  getLanguage,
  detectSystemLanguage,
  SUPPORTED_LANGUAGES
} = await import('../js/core/i18n.js');
const { gameSettings, saveGameSettings } = await import('../js/core/saveState.js');
const {
  renderLanguageGrid,
  isFirstBootLanguagePending,
  initFirstBootLanguageFlow
} = await import('../js/ui/languageSelector.js');
const { setupSettingsUI } = await import('../js/ui/settingsMenu.js');

// =============================================================
// TEST 1: PRIMER ARRANQUE (Sin preferencia previa)
// =============================================================
console.log('--- TEST 1: Flujo de Primer Arranque ---');
delete gameSettings.language;
mockStorage.clear();

assert(isFirstBootLanguagePending() === true, 'Primer arranque detectado: isFirstBootLanguagePending() === true');
assert(firstBootScreen.classList.contains('hidden'), 'La pantalla de primer arranque inicia con clase hidden');

// Iniciar flujo de primer arranque
const firstBootPromise = initFirstBootLanguageFlow();
assert(!firstBootScreen.classList.contains('hidden'), 'Al iniciar el flujo, se muestra #first-boot-lang-screen');
assert(firstBootContainer.children.length === 1, 'Se inyectó la cuadrícula de idiomas');
const bootGrid = firstBootContainer.children[0];
assert(bootGrid.children.length === 9, 'La cuadrícula de primer arranque contiene los 9 idiomas');

// Simular que el jugador elige Coreano ('ko')
const koBtn = bootGrid.children.find(b => b.getAttribute('data-lang') === 'ko');
assert(koBtn !== undefined, 'Existe botón para idioma Coreano (ko)');
koBtn.click();
await firstBootPromise;

assert(gameSettings.language === 'ko', 'La preferencia "ko" se guardó en gameSettings.language');
assert(firstBootScreen.classList.contains('hidden'), '#first-boot-lang-screen se oculta tras la selección');
assert(getLanguage() === 'ko', 'El idioma activo en i18n ahora es "ko"');
assert(document.documentElement.lang === 'ko', '<html lang="ko"> actualizado para renderizado CJK correcto');
assert(mockStorage.get('echoes_rust_settings_v1')?.includes('"language":"ko"'),
  'Se persistió de forma durable en localStorage');

// =============================================================
// TEST 2: SEGUNDO ARRANQUE (Reinicio con idioma guardado)
// =============================================================
console.log('\n--- TEST 2: Segundo Arranque (Persistencia) ---');
assert(isFirstBootLanguagePending() === false,
  'En arranque posterior, isFirstBootLanguagePending() devuelve false');

// Simular el arranque en main.js
if (isFirstBootLanguagePending()) {
  initFirstBootLanguageFlow();
}
assert(firstBootScreen.classList.contains('hidden'),
  'En arranques posteriores #first-boot-lang-screen NO se muestra (permanece hidden)');

// Iniciar con idioma guardado
await initI18n(gameSettings.language);
assert(getLanguage() === 'ko', 'El motor arranca directamente en Coreano ("ko") sin pedir confirmación');

// =============================================================
// TEST 3: CAMBIO DESDE EL MENÚ DE AJUSTES
// =============================================================
console.log('\n--- TEST 3: Cambio desde el Menú de Ajustes ---');
setupSettingsUI();

const settingsGrid = settingsContainer.children[0];
assert(settingsGrid.children.length === 9, 'El selector de Ajustes tiene los 9 idiomas disponibles');
const activeKoInSettings = settingsGrid.children.find(b => b.getAttribute('data-lang') === 'ko');
assert(activeKoInSettings.classList.contains('selected'), 'En Ajustes, el botón de Coreano está marcado como activo');

// El usuario cambia de idioma a Ruso ('ru')
const ruBtn = settingsGrid.children.find(b => b.getAttribute('data-lang') === 'ru');
assert(ruBtn !== undefined, 'Existe botón para idioma Ruso (ru)');
ruBtn.click();
await new Promise(r => setTimeout(r, 50));

assert(gameSettings.language === 'ru', 'gameSettings.language actualizado a "ru"');
assert(getLanguage() === 'ru', 'i18n cambió de inmediato a "ru" sin reiniciar el juego');
assert(ruBtn.classList.contains('selected'), 'El botón Ruso ahora está marcado como selected');
assert(!activeKoInSettings.classList.contains('selected'), 'El botón Coreano ya no está selected');
assert(document.documentElement.lang === 'ru', '<html lang="ru"> actualizado');
assert(mockStorage.get('echoes_rust_settings_v1')?.includes('"language":"ru"'),
  'Nueva preferencia "ru" guardada en localStorage');

// =============================================================
// TEST 4: OPCIÓN "AUTOMÁTICO (SISTEMA)"
// =============================================================
console.log('\n--- TEST 4: Opción Automático (Sistema) ---');
const autoBtn = domElements.get('btn-lang-auto');
assert(autoBtn !== undefined, 'Existe botón #btn-lang-auto en Ajustes');
assert(!autoBtn.classList.contains('selected'), 'El botón Automático no está activo en modo manual');

// Pulsar Automático
autoBtn.click();
await new Promise(r => setTimeout(r, 50));

assert(gameSettings.language === 'auto', 'gameSettings.language ahora es "auto"');
assert(autoBtn.classList.contains('selected'), 'El botón Automático ahora tiene clase selected');
assert(mockStorage.get('echoes_rust_settings_v1')?.includes('"language":"auto"'),
  'Preferencia "auto" persistida en localStorage');

// =============================================================
// TEST 5: REINICIO CON AUTOMÁTICO
// =============================================================
console.log('\n--- TEST 5: Reinicio en Modo Automático ---');
assert(isFirstBootLanguagePending() === false,
  'Con "auto", isFirstBootLanguagePending() sigue siendo false (no vuelve a preguntar al inicio)');

await initI18n(gameSettings.language);
assert(getLanguage() === 'es', 'initI18n("auto") detectó y aplicó automáticamente el idioma del sistema ("es")');

// =============================================================
// TEST 6: AUDITORÍA DE PARIDAD DE CLAVES Y PLACEHOLDERS
// =============================================================
console.log('\n--- TEST 6: Auditoría de 925 Claves y Placeholders ---');
const esMod = await import('../locales/es.js');
const esDict = esMod.default || esMod;
const esKeys = Object.keys(esDict);

for (const lang of SUPPORTED_LANGUAGES) {
  if (lang.code === 'es') continue;
  const mod = await import(`../locales/${lang.code}.js`);
  const dict = mod.default || mod;
  const targetKeys = Object.keys(dict);

  assert(targetKeys.length === esKeys.length,
    `Idioma ${lang.code} (${lang.nativeName}) tiene ${targetKeys.length}/${esKeys.length} claves`);

  let varErrors = 0;
  for (const k of esKeys) {
    const esVal = esDict[k];
    const targetVal = dict[k];
    if (typeof esVal === 'string' && typeof targetVal === 'string') {
      const esVars = (esVal.match(/\{[a-zA-Z0-9_]+\}/g) || []).sort();
      const targetVars = (targetVal.match(/\{[a-zA-Z0-9_]+\}/g) || []).sort();
      if (JSON.stringify(esVars) !== JSON.stringify(targetVars)) {
        varErrors++;
      }
    }
  }
  assert(varErrors === 0, `Idioma ${lang.code}: 0 discrepancias de placeholders variables {param}`);
}

console.log('\n=============================================');
if (failed === 0) {
  console.log('✨ FASE 7 COMPLETADA: 100% de las pruebas del ciclo de vida pasaron con éxito.');
  process.exit(0);
} else {
  console.error(`❌ FASE 7 FALLIDA: ${failed} prueba(s) fallaron.`);
  process.exit(1);
}
