# Sistema de Localización e Internacionalización (i18n)
**Crabs wants your food! — Tactical Horror: Core Defense & Survival**

El sistema de localización de *Crabs wants your food!* soporta 9 idiomas con carga bajo demanda, fallback en caliente a español, pluralización CLDR, fuentes tipográficas dinámicas para glifos no latinos (CJK y Cirílico), pantalla de selección en primer arranque y selector dinámico en el menú de Ajustes.

---

## 1. Idiomas Soportados

| Código | Idioma | Nombre Nativo | Bandera SVG | Fuente Principal / Fallback |
|---|---|---|---|---|
| `es` | Español (Original) | Español | `assets/flags/es.svg` | Retro Pixel-Art / VT323 |
| `en` | English | English | `assets/flags/en.svg` | Retro Pixel-Art / VT323 |
| `pt-BR` | Português (Brasil) | Português | `assets/flags/pt-BR.svg` | Retro Pixel-Art / VT323 |
| `fr` | Français | Français | `assets/flags/fr.svg` | Retro Pixel-Art / VT323 |
| `ja` | 日本語 (Japonés) | 日本語 | `assets/flags/ja.svg` | Noto Sans JP |
| `zh-Hans` | 简体中文 (Chino Simplificado) | 简体中文 | `assets/flags/zh-Hans.svg` | Noto Sans SC |
| `zh-Hant` | 繁體中文 (Chino Tradicional) | 繁體中文 | `assets/flags/zh-Hant.svg` | Noto Sans TC |
| `ko` | 한국어 (Coreano) | 한국어 | `assets/flags/ko.svg` | Noto Sans KR |
| `ru` | Русский (Ruso) | Русский | `assets/flags/ru.svg` | Noto Sans (Cirílico) |

---

## 2. Arquitectura de Módulos

- **`js/core/i18n.js`**:
  - Motor central de localización.
  - Gestión de cache de diccionarios con importación dinámica (`await import('../../locales/${lang}.js')`).
  - Interpolación de variables `{param}`.
  - Plurales según estándar CLDR mediante `Intl.PluralRules(lang)`.
  - Fallback en caliente a `es.js` si una clave no existe en el idioma activo.
  - Actualización reactiva del DOM (`data-i18n`, `data-i18n-html`, `data-i18n-attr`).
  - Carga dinámica de Google Fonts para CJK y Cirílico (`updateLanguageFonts`).
  - Emisión de eventos globales (`GameEvents.emit('i18n:change')`).

- **`js/ui/languageSelector.js`**:
  - Componente UI unificado y reutilizable para selección de idioma.
  - Usado en la Pantalla de Primer Arranque (`#first-boot-lang-screen`) y en Ajustes (`#settings-screen`).
  - Soporte de entrada multimodal:
    - **Ratón y Pantalla Táctil**: Hover suave con `AudioSys.playUIHover()` y confirmación con `AudioSys.playUISelect()`.
    - **Teclado**: Navegación por cuadrícula 3×3 con flechas de dirección (Izquierda, Derecha, Arriba, Abajo), `Tab` y selección con `Enter` o `Espacio`.
    - **Mando / Gamepad**: Polling nativo vía Gamepad API (`navigator.getGamepads()`) con navegación mediante D-Pad / stick analógico (con debounce para evitar saltos indeseados) y botón A (Xbox) / Cruz (PS).
  - Suspensión automática del polling de mando cuando el modal no está visible para mantener 0 sobrecarga de CPU en combate.

- **`js/ui/settingsMenu.js`**:
  - Integración del selector de idioma en el panel de Ajustes con botón de detección automática `[ AUTOMÁTICO (SISTEMA) ]`.
  - Persistencia duradera en `gameSettings.language` (`saveGameSettings()`).

---

## 3. Cómo Añadir un Nuevo Idioma en el Futuro

Para incorporar un décimo idioma (por ejemplo, Alemán `de`, Italiano `it` o Polaco `pl`), sigue estos pasos:

### Paso 1: Crear el Archivo de Localización
Crea `locales/{código}.js` exportando por defecto un objeto con las 925 claves traducidas a partir de `locales/es.js`:
```javascript
// locales/de.js
export default {
  "ui.common.enabled": "AKTIVIERT",
  "ui.common.disabled": "DEAKTIVIERT",
  // ... resto de las 925 claves
};
```

### Paso 2: Añadir la Bandera SVG
Guarda una bandera vectorial SVG en `assets/flags/{código}.svg` con relación de aspecto 4:3 (`viewBox="0 0 640 480"`):
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" width="640" height="480">
  <!-- Vectores de la bandera -->
</svg>
```

### Paso 3: Registrar el Idioma en `SUPPORTED_LANGUAGES`
En `js/core/i18n.js`:
```javascript
export const SUPPORTED_LANGUAGES = [
  // ... idiomas existentes
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: 'de' }
];
```

Y en `detectSystemLanguage()`:
```javascript
if (l.startsWith('de')) return 'de';
```

### Paso 4: (Opcional) Fuentes Especiales
Si el idioma requiere un set de caracteres tipográficos no latinos (ej. Árabe, Tailandés, Devanagari):
1. En `js/core/i18n.js`, añade la URL de Google Fonts en el objeto `FONT_URLS`.
2. En `css/style.css`, añade la regla de fallback `html[lang="de"] { --font-retro: ...; }`.

### Paso 5: Validar la Paridad
Ejecuta la suite de verificación automatizada:
```bash
node scripts/verify-locales.mjs
node scripts/test-lifecycle-flow.mjs
node scripts/test-all.mjs
```

---

## 4. Scripts de Mantenimiento y Pruebas

- `node scripts/verify-locales.mjs` — Verifica que todos los archivos de idiomas contengan el 100% de las 925 claves del maestro en español.
- `node scripts/test-first-boot.mjs` — Valida la pantalla de primer arranque, banderas SVG y accesibilidad del componente.
- `node scripts/test-settings-lang.mjs` — Valida la opción de idioma y modo automático en el menú de Ajustes.
- `node scripts/test-lifecycle-flow.mjs` — Ejecuta la simulación completa de ciclo de vida (primer arranque, reinicio, cambio en caliente en ajustes, persistencia y variables interpoladas).
- `node scripts/test-all.mjs` — Ejecuta las 8 auditorías de skills del proyecto.
