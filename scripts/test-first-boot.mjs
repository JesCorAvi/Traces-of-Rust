// scripts/test-first-boot.mjs
// Verifica la lógica, archivos SVG y renderizado de la Pantalla de Primer Arranque (Fase 5).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

console.log('🧪 Verificando Pantalla de Primer Arranque y Selector de Idioma (Fase 5)...\n');

let failed = 0;
function assert(cond, msg) {
  if (cond) {
    console.log(`  ✓ ${msg}`);
  } else {
    console.error(`  ❌ FALLO: ${msg}`);
    failed++;
  }
}

// 1. Verificar existencia y validez de las 9 banderas SVG
const EXPECTED_LANGUAGES = [
  { code: 'es', nativeName: 'Español', flag: 'es' },
  { code: 'en', nativeName: 'English', flag: 'en' },
  { code: 'pt-BR', nativeName: 'Português', flag: 'pt-BR' },
  { code: 'fr', nativeName: 'Français', flag: 'fr' },
  { code: 'ja', nativeName: '日本語', flag: 'ja' },
  { code: 'zh-Hans', nativeName: '简体中文', flag: 'zh-Hans' },
  { code: 'zh-Hant', nativeName: '繁體中文', flag: 'zh-Hant' },
  { code: 'ko', nativeName: '한국어', flag: 'ko' },
  { code: 'ru', nativeName: 'Русский', flag: 'ru' }
];

console.log('1. Banderas SVG en assets/flags/:');
for (const l of EXPECTED_LANGUAGES) {
  const flagPath = path.join(ROOT, 'assets', 'flags', `${l.flag}.svg`);
  assert(fs.existsSync(flagPath), `Existe ${l.flag}.svg`);
  if (fs.existsSync(flagPath)) {
    const content = fs.readFileSync(flagPath, 'utf8');
    assert(content.includes('<svg') && content.includes('viewBox="0 0 640 480"') && content.includes('</svg>'),
      `${l.flag}.svg tiene estructura SVG y viewBox 4:3 válida`);
  }
}

// 2. Verificar marcado en index.html
console.log('\n2. Marcado en index.html:');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
assert(html.includes('id="first-boot-lang-screen"') && html.includes('class="overlay hidden"'),
  '#first-boot-lang-screen existe en index.html con class="overlay hidden"');
assert(html.includes('id="first-boot-grid-container"'),
  '#first-boot-grid-container existe en index.html');
assert(html.includes('id="first-boot-lang-title"'),
  '#first-boot-lang-title existe en index.html');

// 3. Verificar estilos en css/hud_menus.css
console.log('\n3. Estilos en css/hud_menus.css:');
const css = fs.readFileSync(path.join(ROOT, 'css', 'hud_menus.css'), 'utf8');
assert(css.includes('#first-boot-lang-screen'), 'Contiene reglas para #first-boot-lang-screen');
assert(css.includes('.lang-grid'), 'Contiene reglas para .lang-grid');
assert(css.includes('.lang-card-btn'), 'Contiene reglas para .lang-card-btn');
assert(css.includes('.lang-native-name'), 'Contiene reglas para .lang-native-name con tamaño y peso uniformes');
assert(css.includes('.lang-card-btn.selected'), 'Contiene reglas para estado seleccionado');
assert(css.includes('.lang-flag-wrapper'), 'Contiene contenedor uniforme para bandera');

// 4. Verificar módulo js/ui/languageSelector.js
console.log('\n4. Módulo js/ui/languageSelector.js:');
const langModule = fs.readFileSync(path.join(ROOT, 'js', 'ui', 'languageSelector.js'), 'utf8');
assert(langModule.includes('export function renderLanguageGrid'), 'Exporta renderLanguageGrid');
assert(langModule.includes('export function initFirstBootLanguageFlow'), 'Exporta initFirstBootLanguageFlow');
assert(langModule.includes('export function isFirstBootLanguagePending'), 'Exporta isFirstBootLanguagePending');
assert(langModule.includes('getGamepads') && langModule.includes('pollGamepad'), 'Soporta Gamepad navigation (D-pad/stick/A)');
assert(langModule.includes('handleKeyDown'), 'Soporta Keyboard navigation (Arrow keys/Tab/Enter/Space)');

// 5. Verificar integración en main.js
console.log('\n5. Integración en js/main.js:');
const mainJs = fs.readFileSync(path.join(ROOT, 'js', 'main.js'), 'utf8');
assert(mainJs.includes('initFirstBootLanguageFlow'), 'main.js importa y llama a initFirstBootLanguageFlow');
assert(mainJs.includes('isFirstBootLanguagePending'), 'main.js comprueba isFirstBootLanguagePending antes de mostrar pantalla');

// 6. Simulación funcional básica de renderLanguageGrid y selección
console.log('\n6. Simulación funcional DOM con entorno virtual:');

// Mini DOM mock para Node
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
  closest() { return null; }
  querySelector(sel) {
    if (sel === '.lang-badge-active') {
      return this.children.find(c => c.classList.contains('lang-badge-active'));
    }
    return null;
  }
  click() {
    const list = this.listeners.get('click') || [];
    for (const cb of list) cb({ preventDefault() {} });
  }
  focus() {}
}

global.document = {
  createElement: (tag) => new MockElement(tag),
  activeElement: null,
  body: { contains: () => true }
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

// Cargar dinámicamente js/ui/languageSelector.js
const { renderLanguageGrid, isFirstBootLanguagePending } = await import('../js/ui/languageSelector.js');
const { gameSettings, saveGameSettings } = await import('../js/core/saveState.js');

// Probar estado pendiente de primer arranque
const originalLang = gameSettings.language;
delete gameSettings.language;
assert(isFirstBootLanguagePending() === true, 'isFirstBootLanguagePending() es true cuando language es undefined');

const containerMock = new MockElement('div');
let selectedCodeReceived = null;
const controller = renderLanguageGrid(containerMock, {
  currentLang: 'ja',
  onSelect: (code) => {
    selectedCodeReceived = code;
  }
});

assert(containerMock.children.length === 1, 'Se inyectó el contenedor de cuadrícula');
const grid = containerMock.children[0];
assert(grid.children.length === 9, 'Se generaron exactamente 9 botones de idioma');

// Verificar que japonés está preseleccionado
const jaBtn = grid.children.find(b => b.getAttribute('data-lang') === 'ja');
assert(jaBtn && jaBtn.classList.contains('selected'), 'El idioma inicial (ja) tiene clase selected');

// Simular clic en Francés
const frBtn = grid.children.find(b => b.getAttribute('data-lang') === 'fr');
frBtn.click();
assert(selectedCodeReceived === 'fr', 'Al hacer clic en fr se invocó onSelect("fr")');
assert(frBtn.classList.contains('selected'), 'El botón fr ahora tiene clase selected');
assert(!jaBtn.classList.contains('selected'), 'El botón ja ya no tiene clase selected');

controller.destroy();

// Restaurar configuración original
if (originalLang !== undefined) {
  gameSettings.language = originalLang;
} else {
  delete gameSettings.language;
}

console.log('\n--- Resultado de Pruebas ---');
if (failed === 0) {
  console.log('✨ Todas las comprobaciones de la Fase 5 pasaron con éxito.\n');
  process.exit(0);
} else {
  console.error(`❌ Fallaron ${failed} prueba(s).\n`);
  process.exit(1);
}
