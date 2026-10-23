// scripts/test-all.mjs
// Ejecuta la suite completa de auditorías y validaciones de Crabs wants your food!.

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const steps = [
  { name: 'Validar skills', cmd: 'node', args: ['scripts/validate-skills.mjs'] },
  { name: 'Auditoría mapas', cmd: 'node', args: ['.agent/skills/defense-map-authoring/scripts/audit-maps.mjs'] },
  { name: 'Auditoría bridge Electron/Steam', cmd: 'node', args: ['.agent/skills/electron-steam-bridge/scripts/audit-bridge.mjs'] },
  { name: 'Auditoría balance y config', cmd: 'node', args: ['.agent/skills/game-balance-tuning/scripts/audit-config.mjs'] },
  { name: 'Auditoría DOM', cmd: 'node', args: ['.agent/skills/hud-ui-panel/scripts/audit-dom.mjs'] },
  { name: 'Auditoría netcode', cmd: 'node', args: ['.agent/skills/netcode-audit/scripts/audit-netcode.mjs'] },
  { name: 'Auditoría personajes', cmd: 'node', args: ['.agent/skills/playable-character-content/scripts/audit-characters.mjs'] },
  { name: 'Auditoría 3D y entidades', cmd: 'node', args: ['.agent/skills/procedural-3d-entity/scripts/audit-entities.mjs'] },
  { name: 'Auditoría audio y SFX', cmd: 'node', args: ['.agent/skills/procedural-sfx/scripts/audit-audio.mjs'] },
  { name: 'Estabilidad y rendimiento', cmd: 'node', args: ['scripts/test-performance-stability.mjs'] },
];

console.log('🧪 Iniciando suite de pruebas completas de Crabs wants your food!...\n');
let failed = 0;

for (const step of steps) {
  try {
    execFileSync(step.cmd, step.args, { cwd: root, stdio: 'inherit' });
  } catch (err) {
    console.error(`❌ Falló: ${step.name}`);
    failed++;
  }
}

if (failed > 0) {
  console.error(`\n❌ Fallaron ${failed} prueba(s).`);
  process.exit(1);
} else {
  console.log('\n✨ Todas las auditorías y validaciones pasaron con 0 errores y 0 warnings.');
}
