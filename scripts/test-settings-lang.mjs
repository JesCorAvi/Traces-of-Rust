// scripts/test-settings-lang.mjs
// Verifica la integración del Selector de Idioma en el Menú de Ajustes (Fase 6).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

console.log('🧪 Verificando Selector de Idioma en Ajustes (Fase 6)...\n');

let failed = 0;
function assert(cond, msg) {
  if (cond) {
    console.log(`  ✓ ${msg}`);
  } else {
    console.error(`  ❌ FALLO: ${msg}`);
    failed++;
  }
}

// 1. Verificar index.html
console.log('1. Marcado HTML en index.html:');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
assert(html.includes('id="settings-lang-container"'), 'Existe #settings-lang-container en index.html');
assert(html.includes('id="btn-lang-auto"'), 'Existe #btn-lang-auto en index.html');
assert(html.includes('data-i18n="ui.settings.language"'), 'Contiene data-i18n="ui.settings.language"');
assert(html.includes('data-i18n="ui.settings.language_auto"'), 'Contiene data-i18n="ui.settings.language_auto"');

// 2. Verificar estilos CSS en hud_menus.css
console.log('\n2. Estilos en css/hud_menus.css:');
const css = fs.readFileSync(path.join(ROOT, 'css', 'hud_menus.css'), 'utf8');
assert(css.includes('.settings-lang-container'), 'Contiene regla para .settings-lang-container');
assert(css.includes('.settings-lang-title-row'), 'Contiene regla para .settings-lang-title-row');
assert(css.includes('#btn-lang-auto.selected'), 'Contiene regla para #btn-lang-auto.selected');

// 3. Simulación funcional en entorno virtual
console.log('\n3. Simulación funcional de Ajustes:');

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
    if (sel === '.hidden') return null;
    return null;
  }
  querySelector(sel) {
    if (sel === '.lang-badge-active') {
      return this.children.find(c => c.classList.contains('lang-badge-active'));
    }
    return null;
  }
  querySelectorAll() { return []; }
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

// Crear elementos esperados por settingsMenu
getOrCreate('settings-lang-container');
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

global.document = {
  createElement: (tag) => new MockElement(tag),
  getElementById: (id) => domElements.get(id) || null,
  querySelector: () => null,
  querySelectorAll: () => [],
  documentElement: { lang: 'es' },
  activeElement: null,
  body: { contains: () => true },
  addEventListener: () => {}
};
global.window = {
  innerWidth: 1280,
  addEventListener: () => {},
  removeEventListener: () => {}
};
if (typeof globalThis.navigator === 'undefined') {
  global.navigator = { getGamepads: () => [] };
} else {
  try {
    globalThis.navigator.getGamepads = () => [];
  } catch (e) {
    Object.defineProperty(globalThis, 'navigator', {
      value: { getGamepads: () => [] },
      configurable: true,
      writable: true
    });
  }
}
global.localStorage = {
  _store: new Map(),
  getItem(k) { return this._store.get(k) || null; },
  setItem(k, v) { this._store.set(k, String(v)); },
  removeItem(k) { this._store.delete(k); },
  clear() { this._store.clear(); }
};
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = () => 1;
global.cancelAnimationFrame = () => {};

const { setupSettingsUI } = await import('../js/ui/settingsMenu.js');
const { gameSettings, saveGameSettings } = await import('../js/core/saveState.js');
const { getLanguage, setLanguage, initI18n } = await import('../js/core/i18n.js');

// 1. Inicializar ajustes
setupSettingsUI();

const container = domElements.get('settings-lang-container');
assert(container.children.length === 1, 'settings-lang-container contiene la cuadrícula de idiomas');
const grid = container.children[0];
assert(grid.children.length === 9, 'La cuadrícula de Ajustes contiene exactamente los 9 idiomas con banderas');

// 2. Probar selección manual de idioma (ej. Francés 'fr')
const frBtn = grid.children.find(b => b.getAttribute('data-lang') === 'fr');
assert(frBtn !== undefined, 'Se encontró el botón de francés en Ajustes');
frBtn.click();

assert(gameSettings.language === 'fr', 'gameSettings.language se actualizó a "fr"');
assert(frBtn.classList.contains('selected'), 'El botón "fr" tiene clase selected');
const autoBtn = domElements.get('btn-lang-auto');
assert(!autoBtn.classList.contains('selected'), 'El botón Automático NO está activo al elegir idioma manual');

// 3. Probar opción Automático
autoBtn.click();
assert(gameSettings.language === 'auto', 'Al pulsar Automático, gameSettings.language es "auto"');
assert(autoBtn.classList.contains('selected'), 'El botón Automático ahora tiene clase selected');

// 4. Probar reinicio / persistencia con "auto"
await initI18n(gameSettings.language);
assert(typeof getLanguage() === 'string' && getLanguage().length > 0,
  `initI18n("auto") resolvió dinámicamente al idioma detectado: "${getLanguage()}"`);

console.log('\n--- Resultado de Pruebas ---');
if (failed === 0) {
  console.log('✨ Todas las comprobaciones de la Fase 6 pasaron con éxito.\n');
  process.exit(0);
} else {
  console.error(`❌ Fallaron ${failed} prueba(s).\n`);
  process.exit(1);
}
