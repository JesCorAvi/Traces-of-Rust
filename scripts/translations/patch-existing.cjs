const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const turrets = require('./turrets-complete.json');

const files = [
  { file: '../../locales/fr.js', langKey: 'fr', header: '// French localization dictionary for Traces of Rust.' },
  { file: '../../locales/pt-BR.js', langKey: 'pt', header: '// Portuguese (Brazil) localization dictionary for Traces of Rust.' },
  { file: '../../locales/ru.js', langKey: 'ru', header: '// Russian localization dictionary for Traces of Rust.' },
  { file: '../../locales/ja.js', langKey: 'ja', header: '// Japanese localization dictionary for Traces of Rust.' }
];

async function patch() {
  for (const item of files) {
    const fullPath = path.resolve(__dirname, item.file);
    const mod = await import(pathToFileURL(fullPath).href);
    const dict = Object.assign({}, mod.default);

    const langTurrets = turrets[item.langKey];
    for (const [k, v] of Object.entries(langTurrets)) {
      dict[k] = v;
    }

    const keys = Object.keys(dict);
    const outLines = [item.header, 'export default {'];
    keys.forEach((k, idx) => {
      const isLast = idx === keys.length - 1;
      outLines.push(`  ${JSON.stringify(k)}: ${JSON.stringify(dict[k])}${isLast ? '' : ','}`);
    });
    outLines.push('};');
    outLines.push('');

    fs.writeFileSync(fullPath, outLines.join('\n'), 'utf-8');
    console.log(`Patched ${item.file} with clean turret translations (${keys.length} keys)`);
  }
}

patch().catch(console.error);
