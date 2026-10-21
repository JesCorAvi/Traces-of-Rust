const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'dist', 'Traces of Rust-win32-x64');
if (!fs.existsSync(targetDir)) {
  console.warn('[POST-BUILD] Directorio destino no encontrado:', targetDir);
  process.exit(0);
}

const appidSrc = path.join(__dirname, '..', 'steam_appid.txt');
const appidDst = path.join(targetDir, 'steam_appid.txt');
if (fs.existsSync(appidSrc)) {
  fs.copyFileSync(appidSrc, appidDst);
  console.log('[POST-BUILD] Copiado:', appidDst);
}

const dllSrc = path.join(__dirname, '..', 'node_modules', 'steamworks.js', 'dist', 'win64', 'steam_api64.dll');
const dllDst = path.join(targetDir, 'steam_api64.dll');
if (fs.existsSync(dllSrc)) {
  fs.copyFileSync(dllSrc, dllDst);
  console.log('[POST-BUILD] Copiado:', dllDst);
}

console.log('[POST-BUILD] Binarios de Steam integrados con éxito en la raíz del ejecutable.');
