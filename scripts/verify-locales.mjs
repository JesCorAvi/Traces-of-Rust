import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const ES_PATH = pathToFileURL(path.resolve('locales/es.js')).href;
const { default: esDict } = await import(ES_PATH);
const esKeys = Object.keys(esDict);

const TARGET_LANGS = ['en', 'pt-BR', 'fr', 'ja', 'zh-Hans', 'zh-Hant', 'ko', 'ru'];

console.log(`Verificador de Localización — Crabs wants your food!`);
console.log(`Claves maestras en español (es.js): ${esKeys.length}\n`);

let allOk = true;

for (const lang of TARGET_LANGS) {
  const fileFullPath = path.resolve(`locales/${lang}.js`);
  if (!fs.existsSync(fileFullPath)) {
    console.log(`[PENDIENTE] ${lang}: Archivo no encontrado.`);
    allOk = false;
    continue;
  }

  const { default: langDict } = await import(pathToFileURL(fileFullPath).href);
  const langKeys = Object.keys(langDict);
  const missing = esKeys.filter(k => !(k in langDict));
  const extra = langKeys.filter(k => !(k in esDict));

  if (missing.length === 0) {
    console.log(`[OK] ${lang}: ${langKeys.length} claves (100% coincidencia).`);
  } else {
    console.log(`[ERROR] ${lang}: Faltan ${missing.length} claves.`);
    console.log(`        Ejemplos faltantes:`, missing.slice(0, 5));
    allOk = false;
  }
}

if (!allOk) {
  process.exit(1);
} else {
  console.log(`\n¡Todos los idiomas están 100% completos y sincronizados con es.js!`);
}
