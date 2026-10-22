// Pantalla de carga inicial: presentación de Sandwish Studio, título del juego,
// barra de progreso animada y orquestación de precalentamiento para eliminar
// los tirones y congelamientos (freezes) iniciales de WebGL/Three.js.
// Exports: updateLoadingProgress, dismissLoadingScreen, nextFrame, delay.

let loadingScreenEl = null;
let barFillEl = null;
let statusEl = null;
let percentEl = null;

function ensureElements() {
  if (!loadingScreenEl && typeof document !== 'undefined') {
    loadingScreenEl = document.getElementById('loading-screen');
    barFillEl = document.getElementById('loading-bar-fill');
    statusEl = document.getElementById('loading-status');
    percentEl = document.getElementById('loading-percent');
  }
}

export function updateLoadingProgress(percent, message) {
  ensureElements();
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  if (barFillEl) {
    barFillEl.style.width = `${clamped}%`;
  }
  if (percentEl) {
    percentEl.textContent = `${clamped}%`;
  }
  if (statusEl && message) {
    statusEl.textContent = message;
  }
}

export function dismissLoadingScreen() {
  ensureElements();
  if (!loadingScreenEl) return;
  loadingScreenEl.classList.add('fade-out');
  setTimeout(() => {
    loadingScreenEl.classList.add('hidden');
    loadingScreenEl.style.display = 'none';
  }, 500);
}

export function nextFrame() {
  return new Promise(resolve => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    } else {
      setTimeout(resolve, 16);
    }
  });
}

export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
