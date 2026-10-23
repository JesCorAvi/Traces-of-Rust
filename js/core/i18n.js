// Gestor de Internacionalización y Localización para Crabs wants your food!.
// Soporta 9 idiomas, carga bajo demanda, fallback en caliente a español,
// interpolación de variables {param}, plurales CLDR con Intl.PluralRules y refresco del DOM.

import esLocale from '../../locales/es.js';
import { GameEvents } from './eventBus.js';

export const SUPPORTED_LANGUAGES = [
  { code: 'es', name: 'Español', nativeName: 'Español', flag: 'es' },
  { code: 'en', name: 'English', nativeName: 'English', flag: 'en' },
  { code: 'pt-BR', name: 'Português', nativeName: 'Português', flag: 'pt-BR' },
  { code: 'fr', name: 'Français', nativeName: 'Français', flag: 'fr' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: 'ja' },
  { code: 'zh-Hans', name: 'Simplified Chinese', nativeName: '简体中文', flag: 'zh-Hans' },
  { code: 'zh-Hant', name: 'Traditional Chinese', nativeName: '繁體中文', flag: 'zh-Hant' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: 'ko' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: 'ru' }
];

export const DEFAULT_LANGUAGE = 'es';

const localesCache = new Map();
localesCache.set('es', esLocale);

const pluralRulesCache = new Map();

function getPluralRules(lang) {
  if (!pluralRulesCache.has(lang)) {
    try {
      pluralRulesCache.set(lang, new Intl.PluralRules(lang));
    } catch (e) {
      // Fallback a inglés/estándar si el runtime falla con algún tag
      pluralRulesCache.set(lang, new Intl.PluralRules('en'));
    }
  }
  return pluralRulesCache.get(lang);
}

let currentLanguage = DEFAULT_LANGUAGE;
let isInitialized = false;

/**
 * Normaliza una cadena de locale a uno de los códigos soportados del juego.
 * @param {string} raw
 * @returns {string|null}
 */
function mapLocaleToSupported(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const l = raw.toLowerCase().trim();

  if (l.startsWith('es')) return 'es';
  if (l === 'pt-br' || l.startsWith('pt')) return 'pt-BR';
  if (l.startsWith('fr')) return 'fr';
  if (l.startsWith('ja')) return 'ja';
  if (l === 'zh-tw' || l === 'zh-hk' || l === 'zh-mo' || l.includes('hant')) return 'zh-Hant';
  if (l.startsWith('zh')) return 'zh-Hans';
  if (l.startsWith('ko')) return 'ko';
  if (l.startsWith('ru') || l.startsWith('be') || l.startsWith('uk')) return 'ru';
  if (l.startsWith('en')) return 'en';
  return null;
}

/**
 * Normaliza y detecta el idioma real del sistema o navegador del jugador.
 * Prioriza la configuración regional del sistema operativo (Intl API) y
 * los idiomas preferidos del usuario, evitando falsos positivos de 'en-US'
 * causados por la configuración de interfaz por defecto de Chromium/Electron.
 */
export function detectSystemLanguage() {
  const candidates = [];

  // 1. Intl API (refleja la configuración regional y de fecha real del SO Windows/macOS/Linux)
  try {
    if (typeof Intl !== 'undefined') {
      const dt = typeof Intl.DateTimeFormat === 'function' ? Intl.DateTimeFormat().resolvedOptions?.()?.locale : null;
      if (dt) candidates.push(dt);
      const pr = typeof Intl.PluralRules === 'function' ? (new Intl.PluralRules()).resolvedOptions?.()?.locale : null;
      if (pr) candidates.push(pr);
      const nf = typeof Intl.NumberFormat === 'function' ? Intl.NumberFormat().resolvedOptions?.()?.locale : null;
      if (nf) candidates.push(nf);
    }
  } catch (e) {}

  // 2. Navigator API (idiomas configurados en el navegador o Electron)
  if (typeof navigator !== 'undefined') {
    if (Array.isArray(navigator.languages)) {
      for (const lang of navigator.languages) {
        if (lang) candidates.push(lang);
      }
    }
    if (navigator.language) candidates.push(navigator.language);
    if (navigator.userLanguage) candidates.push(navigator.userLanguage);
    if (navigator.systemLanguage) candidates.push(navigator.systemLanguage);
  }

  // Pase 1: Buscar si el sistema o navegador contiene algún idioma soportado no-inglés
  // (ej. si Windows está en español pero Chromium arranca con interfaz en inglés,
  // el usuario desea jugar en su idioma nativo).
  for (const raw of candidates) {
    const code = mapLocaleToSupported(raw);
    if (code && code !== 'en') {
      return code;
    }
  }

  // Pase 2: Si no hay idioma alternativo soportado pero sí inglés
  for (const raw of candidates) {
    const code = mapLocaleToSupported(raw);
    if (code === 'en') {
      return 'en';
    }
  }

  // Fallback por defecto si no coincide ningún candidato (idioma original del juego)
  return 'es';
}

/**
 * Obtiene el idioma activo actualmente.
 */
export function getLanguage() {
  return currentLanguage;
}

/**
 * Carga un catálogo de idioma bajo demanda si no está cacheado.
 */
export async function loadLanguage(lang) {
  if (!SUPPORTED_LANGUAGES.some(l => l.code === lang)) {
    lang = DEFAULT_LANGUAGE;
  }

  if (localesCache.has(lang)) {
    return localesCache.get(lang);
  }

  try {
    const mod = await import(`../../locales/${lang}.js`);
    const dict = mod.default || mod;
    localesCache.set(lang, dict);
    return dict;
  } catch (err) {
    console.warn(`[i18n] No se pudo cargar el archivo para el idioma "${lang}". Usando fallback español.`, err);
    return localesCache.get('es');
  }
}

/**
 * Traduce una clave con soporte para parámetros {name} y plurales automáticos.
 * Si falta en el idioma actual, realiza fallback transparente a español.
 */
export function t(key, params = null) {
  if (!key) return '';

  const activeDict = localesCache.get(currentLanguage) || localesCache.get('es') || {};
  const fallbackDict = localesCache.get('es') || {};

  let candidateKeys = [key];

  // Si se incluye parámetro count numérico, resolver la categoría de plural CLDR (one, few, many, other)
  if (params && typeof params.count === 'number') {
    const pr = getPluralRules(currentLanguage);
    const cat = pr.select(params.count);
    candidateKeys = [
      `${key}.${cat}`,
      `${key}.other`,
      key
    ];
  }

  let text = null;

  // 1. Buscar en diccionario activo
  for (const k of candidateKeys) {
    if (typeof activeDict[k] === 'string') {
      text = activeDict[k];
      break;
    }
  }

  // 2. Si no se encontró, buscar en diccionario de fallback español
  if (text === null) {
    // Si fue plural en otro idioma (ej: ruso con 'few' o 'many'), el español busca con plural de 'es'
    if (params && typeof params.count === 'number') {
      const esPr = getPluralRules('es');
      const esCat = esPr.select(params.count);
      const esCandidateKeys = [
        `${key}.${esCat}`,
        `${key}.other`,
        key
      ];
      for (const k of esCandidateKeys) {
        if (typeof fallbackDict[k] === 'string') {
          text = fallbackDict[k];
          break;
        }
      }
    } else {
      for (const k of candidateKeys) {
        if (typeof fallbackDict[k] === 'string') {
          text = fallbackDict[k];
          break;
        }
      }
    }
  }

  // 3. Si la clave no existe en ningún diccionario, devolver la clave original
  if (text === null) {
    return key;
  }

  // 4. Interpolación de variables {param}
  if (params && typeof params === 'object') {
    return text.replace(/\{(\w+)\}/g, (match, pName) => {
      if (params[pName] !== undefined && params[pName] !== null) {
        return String(params[pName]);
      }
      return match;
    });
  }

  return text;
}

const FONT_STYLESHEETS = {
  'ja': 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap',
  'zh-Hans': 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&display=swap',
  'zh-Hant': 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700&display=swap',
  'ko': 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap',
  'ru': 'https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&display=swap'
};

/**
 * Carga de forma dinámica y condicional únicamente la fuente necesaria
 * para el idioma activo (Noto Sans JP / SC / TC / KR / RU).
 */
export function updateLanguageFonts(lang) {
  if (typeof document === 'undefined') return;

  const linkId = 'i18n-font-loader';
  let link = document.getElementById(linkId);
  const targetUrl = FONT_STYLESHEETS[lang];

  if (!targetUrl) {
    if (link) {
      link.remove();
    }
    return;
  }

  if (!link) {
    link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }

  if (link.getAttribute('href') !== targetUrl) {
    link.setAttribute('href', targetUrl);
  }
}

/**
 * Actualiza todos los elementos del DOM que utilicen atributos de traducción:
 * - data-i18n: reemplaza el textContent
 * - data-i18n-html: reemplaza el innerHTML
 * - data-i18n-attr: reemplaza atributos específicos (ej: "title:clave|placeholder:clave")
 */
export function updateDOMTranslations(root = null) {
  if (typeof document === 'undefined') return;
  const targetRoot = root || document;

  // Actualizar atributo lang en <html> para renderizado tipográfico CJK correcto
  if (document.documentElement) {
    document.documentElement.lang = currentLanguage;
  }

  // Cargar dinámicamente la fuente tipográfica adecuada para el idioma
  updateLanguageFonts(currentLanguage);

  // data-i18n
  const textElements = targetRoot.querySelectorAll('[data-i18n]');
  for (let i = 0; i < textElements.length; i++) {
    const el = textElements[i];
    const k = el.getAttribute('data-i18n');
    if (k) {
      el.textContent = t(k);
    }
  }

  // data-i18n-html
  const htmlElements = targetRoot.querySelectorAll('[data-i18n-html]');
  for (let i = 0; i < htmlElements.length; i++) {
    const el = htmlElements[i];
    const k = el.getAttribute('data-i18n-html');
    if (k) {
      el.innerHTML = t(k);
    }
  }

  // data-i18n-attr (ej: "title:ui.topbar.teeth_title|placeholder:ui.online.join_placeholder")
  const attrElements = targetRoot.querySelectorAll('[data-i18n-attr]');
  for (let i = 0; i < attrElements.length; i++) {
    const el = attrElements[i];
    const attrSpecs = el.getAttribute('data-i18n-attr');
    if (!attrSpecs) continue;

    const pairs = attrSpecs.split('|');
    for (const pair of pairs) {
      const idx = pair.indexOf(':');
      if (idx > 0) {
        const attrName = pair.substring(0, idx).trim();
        const keyName = pair.substring(idx + 1).trim();
        if (attrName && keyName) {
          el.setAttribute(attrName, t(keyName));
        }
      }
    }
  }
}

/**
 * Cambia el idioma activo, cargándolo bajo demanda si es necesario,
 * y refresca de inmediato toda la interfaz sin recargar la página.
 */
export async function setLanguage(lang) {
  if (!SUPPORTED_LANGUAGES.some(l => l.code === lang)) {
    lang = DEFAULT_LANGUAGE;
  }

  await loadLanguage(lang);
  currentLanguage = lang;

  updateDOMTranslations();

  // Notificar a todos los módulos y pantallas reactivas
  GameEvents.emit('i18n:change', { language: lang });

  return lang;
}

/**
 * Inicializa el sistema de localización con un idioma guardado o detectado.
 */
export async function initI18n(preferredLanguage = null) {
  let target = preferredLanguage;
  if (!target || target === 'auto') {
    target = detectSystemLanguage();
  }
  await setLanguage(target);
  isInitialized = true;
  return currentLanguage;
}

export function isI18nReady() {
  return isInitialized;
}
