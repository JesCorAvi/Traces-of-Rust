// scripts/unify-lang-screen.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, '..', 'locales');

for (const file of fs.readdirSync(dir)) {
  if (!file.endsWith('.js')) continue;
  const fp = path.join(dir, file);
  let content = fs.readFileSync(fp, 'utf8');
  content = content.replace(/"ui\.lang_screen\.title"\s*:\s*"[^"]+"/, '"ui.lang_screen.title": "SELECT YOUR LANGUAGE"');
  content = content.replace(/"ui\.lang_screen\.subtitle"\s*:\s*"[^"]+"/, '"ui.lang_screen.subtitle": "SELECT YOUR LANGUAGE"');
  fs.writeFileSync(fp, content, 'utf8');
  console.log('✓ Updated', file);
}
