const fs = require('fs');
const path = require('path');

const files = [
  path.resolve(__dirname, '../../css/style.css'),
  path.resolve(__dirname, '../../css/hud_core.css'),
  path.resolve(__dirname, '../../css/hud_menus.css'),
  path.resolve(__dirname, '../../css/hud_turrets.css'),
  path.resolve(__dirname, '../../css/hud_tutorial.css'),
  path.resolve(__dirname, '../../index.html')
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  const initialRetro = (content.match(/'Press Start 2P', monospace/g) || []).length;
  const initialBody = (content.match(/'VT323', monospace/g) || []).length;

  // Do not replace inside the definition of --font-retro or --font-body
  content = content.replace(/font-family:\s*'Press Start 2P',\s*monospace/g, 'font-family: var(--font-retro, \'Press Start 2P\', monospace)');
  content = content.replace(/font-family:\s*'VT323',\s*monospace/g, 'font-family: var(--font-body, \'VT323\', monospace)');

  fs.writeFileSync(file, content, 'utf-8');
  console.log(`Updated ${path.basename(file)}: replaced ${initialRetro} retro and ${initialBody} body fonts.`);
}
