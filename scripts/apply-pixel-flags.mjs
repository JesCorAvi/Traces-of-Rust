// scripts/apply-pixel-flags.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const flagsDir = path.join(ROOT, 'assets', 'flags');

for (const file of fs.readdirSync(flagsDir)) {
  if (!file.endsWith('.svg')) continue;
  const fp = path.join(flagsDir, file);
  let content = fs.readFileSync(fp, 'utf8');
  if (!content.includes('shape-rendering')) {
    content = content.replace('<svg ', '<svg shape-rendering="crispEdges" ');
    fs.writeFileSync(fp, content, 'utf8');
    console.log('✓ Added shape-rendering="crispEdges" to', file);
  }
}
