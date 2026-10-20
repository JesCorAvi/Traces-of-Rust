// Controlador de la interfaz del Selector de Mapas (estilo Bloons TD 6).
// Permite elegir entre 18 mapas (6 Fácil, 6 Normal, 6 Difícil), visualizando la ruta 2D,
// puntos de entrada/salida, estadísticas tácticas y medallas de superación.
// Exports: openMapSelector, closeMapSelector, setupMapSelectorEvents, getSelectedMapId.

import { AudioSys } from '../audio.js';
import { renderSpriteIconHTML } from '../spritesheets.js';
import {
  getMapsByDifficulty,
  getMapById,
  DEFAULT_MAP_IDS,
  DIFFICULTIES
} from '../defense/mapGenerator.js';
import { renderMapThumbnailCanvas } from '../defense/routeThumbnailRenderer.js';

let currentDiff = 'normal';
let selectedMapId = null;
let onLaunchCallback = null;
let isEventsSetup = false;

function getMapRecords() {
  try {
    return JSON.parse(localStorage.getItem('traces_td_map_records') || '{}');
  } catch (e) {
    return {};
  }
}

export function getSelectedMapId() {
  if (!selectedMapId) {
    const saved = localStorage.getItem('traces_td_selected_map');
    const diff = localStorage.getItem('traces_td_difficulty') || 'normal';
    selectedMapId = saved || DEFAULT_MAP_IDS[diff] || 'easy_plaza';
  }
  return selectedMapId;
}

export function openMapSelector(preferredDiff = null, onLaunch = null) {
  AudioSys.playUISelect();
  onLaunchCallback = onLaunch;

  currentDiff = preferredDiff || localStorage.getItem('traces_td_difficulty') || 'normal';
  const savedMap = localStorage.getItem('traces_td_selected_map');

  // Asegurar que el mapa seleccionado corresponda a la dificultad o establecer el predeterminado
  const currentMapObj = getMapById(savedMap);
  if (currentMapObj && currentMapObj.difficulty === currentDiff) {
    selectedMapId = currentMapObj.id;
  } else {
    selectedMapId = DEFAULT_MAP_IDS[currentDiff] || 'easy_plaza';
  }

  setupMapSelectorEvents();

  const screen = document.getElementById('map-select-screen');
  if (!screen) return;

  // Actualizar tabs
  updateDiffTabsUI();

  // Renderizar la rejilla 3x2 de tarjetas
  renderMapCardsGrid(currentDiff);

  // Actualizar el panel inferior de detalles
  updateSelectedMapDetails(selectedMapId);

  // Mostrar la pantalla de selector
  document.getElementById('start-screen')?.classList.add('hidden');
  document.getElementById('shop-screen')?.classList.add('hidden');
  screen.classList.remove('hidden');
}

export function closeMapSelector() {
  AudioSys.playUIClick();
  const screen = document.getElementById('map-select-screen');
  if (screen) screen.classList.add('hidden');
  document.getElementById('start-screen')?.classList.remove('hidden');
}

function updateDiffTabsUI() {
  const tabs = document.querySelectorAll('#map-diff-tabs .map-diff-tab');
  tabs.forEach(tab => {
    const diff = tab.dataset.diff;
    const isActive = diff === currentDiff;
    tab.classList.toggle('is-active-tab', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });
}

function switchDiffTab(diffKey) {
  if (currentDiff === diffKey) return;
  AudioSys.playUISelect();
  currentDiff = diffKey;
  localStorage.setItem('traces_td_difficulty', currentDiff);

  // Seleccionar el mapa por defecto de esta dificultad
  selectedMapId = DEFAULT_MAP_IDS[currentDiff] || 'easy_plaza';
  localStorage.setItem('traces_td_selected_map', selectedMapId);

  updateDiffTabsUI();
  renderMapCardsGrid(currentDiff);
  updateSelectedMapDetails(selectedMapId);
}

function selectMapCard(mapId) {
  AudioSys.playUIClick();
  selectedMapId = mapId;
  localStorage.setItem('traces_td_selected_map', selectedMapId);

  // Marcar visualmente la tarjeta activa
  const cards = document.querySelectorAll('#map-grid-container .map-card');
  cards.forEach(card => {
    const isSelected = card.dataset.mapId === mapId;
    card.classList.toggle('is-selected', isSelected);
    card.setAttribute('aria-selected', String(isSelected));
  });

  updateSelectedMapDetails(mapId);
}

function renderMapCardsGrid(diffKey) {
  const container = document.getElementById('map-grid-container');
  if (!container) return;

  container.innerHTML = '';
  const maps = getMapsByDifficulty(diffKey);
  const records = getMapRecords();

  maps.forEach(mapData => {
    const isSelected = mapData.id === selectedMapId;
    const rec = records[mapData.id] || { completed: false, bestWave: 0 };

    const card = document.createElement('div');
    card.className = `map-card ${isSelected ? 'is-selected' : ''}`;
    card.dataset.mapId = mapData.id;
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-selected', String(isSelected));

    // 1. Contenedor de la miniatura de la ruta
    const thumbWrap = document.createElement('div');
    thumbWrap.className = 'map-card-thumb';
    const canvas = renderMapThumbnailCanvas(mapData, 190, 115);
    thumbWrap.appendChild(canvas);

    // 2. Medalla / Estado de récord estilo BTD6
    const medalBadge = document.createElement('div');
    medalBadge.className = `map-card-medal ${rec.completed ? 'is-completed' : (rec.bestWave > 0 ? 'is-in-progress' : 'is-unbeaten')}`;
    if (rec.completed) {
      medalBadge.innerHTML = `<span class="ui-icon xs" data-ui-icon="star"></span> <span>SUPERADO</span>`;
    } else if (rec.bestWave > 0) {
      medalBadge.textContent = `REC: ${rec.bestWave}/12`;
    } else {
      medalBadge.textContent = 'SIN DATOS';
    }
    thumbWrap.appendChild(medalBadge);

    // 3. Etiqueta de ruta (Entradas / Salidas)
    const routeTag = document.createElement('div');
    routeTag.className = 'map-card-routetag';
    const entText = mapData.entrances === 1 ? '1 ENTRADA' : `${mapData.entrances} ENTRADAS`;
    const exitText = mapData.exits === 1 ? '1 SALIDA' : `${mapData.exits} SALIDAS`;
    routeTag.textContent = `${entText} · ${exitText}`;
    thumbWrap.appendChild(routeTag);

    // 4. Pie de la tarjeta: Título y Badge
    const cardInfo = document.createElement('div');
    cardInfo.className = 'map-card-info';
    cardInfo.innerHTML = `
      <div class="map-card-title">${mapData.name}</div>
      <div class="map-card-badge">${mapData.badge}</div>
    `;

    card.appendChild(thumbWrap);
    card.appendChild(cardInfo);

    // Eventos
    card.onclick = () => selectMapCard(mapData.id);
    card.ondblclick = () => launchGameWithSelectedMap();
    card.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectMapCard(mapData.id);
      }
    };

    container.appendChild(card);
  });
}

function updateSelectedMapDetails(mapId) {
  const mapData = getMapById(mapId);
  if (!mapData) return;

  const titleEl = document.getElementById('map-detail-title');
  const badgeEl = document.getElementById('map-detail-badge');
  const descEl = document.getElementById('map-detail-desc');
  const statsEl = document.getElementById('map-detail-stats');

  if (titleEl) titleEl.textContent = mapData.name;
  if (badgeEl) badgeEl.textContent = mapData.badge;
  if (descEl) descEl.textContent = mapData.desc;

  if (statsEl) {
    const diffMeta = DIFFICULTIES[mapData.difficulty] || DIFFICULTIES.normal;
    statsEl.innerHTML = `
      <div class="map-stat-chip">
        <span class="chip-label">DIFICULTAD:</span>
        <span class="chip-val ${mapData.difficulty}">${diffMeta.name}</span>
      </div>
      <div class="map-stat-chip">
        <span class="chip-label">CONTENCIÓN BASE:</span>
        <span class="chip-val lives">${mapData.maxLives} VIDAS</span>
      </div>
      <div class="map-stat-chip">
        <span class="chip-label">SUMINISTRO:</span>
        <span class="chip-val scrap">${mapData.startingScrap} CHATARRA</span>
      </div>
      <div class="map-stat-chip">
        <span class="chip-label">DISPOSICIÓN:</span>
        <span class="chip-val">${mapData.entrances} ENTRADA(S) / ${mapData.exits} SALIDA(S)</span>
      </div>
    `;
  }
}

function launchGameWithSelectedMap() {
  if (!selectedMapId) return;
  AudioSys.playUISelect();

  // Guardar mapa y dificultad seleccionados
  localStorage.setItem('traces_td_selected_map', selectedMapId);
  localStorage.setItem('traces_td_difficulty', currentDiff);

  // Cerrar selector
  const screen = document.getElementById('map-select-screen');
  if (screen) screen.classList.add('hidden');

  if (onLaunchCallback) {
    onLaunchCallback(selectedMapId, currentDiff);
  }
}

export function setupMapSelectorEvents() {
  if (isEventsSetup) return;
  isEventsSetup = true;

  // Botón Volver al menú
  const backBtn = document.getElementById('btn-map-back');
  if (backBtn) {
    backBtn.onclick = closeMapSelector;
  }

  // Pestañas de dificultad
  const tabFacil = document.getElementById('tab-map-facil');
  const tabNormal = document.getElementById('tab-map-normal');
  const tabDificil = document.getElementById('tab-map-dificil');

  if (tabFacil) tabFacil.onclick = () => switchDiffTab('facil');
  if (tabNormal) tabNormal.onclick = () => switchDiffTab('normal');
  if (tabDificil) tabDificil.onclick = () => switchDiffTab('dificil');

  // Botón Desplegar / Iniciar en este mapa
  const launchBtn = document.getElementById('btn-launch-map');
  if (launchBtn) {
    launchBtn.onclick = launchGameWithSelectedMap;
  }

  // Atajos de teclado mientras esté abierto
  window.addEventListener('keydown', (e) => {
    const screen = document.getElementById('map-select-screen');
    if (!screen || screen.classList.contains('hidden')) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closeMapSelector();
    } else if (e.key === 'Enter') {
      // Si el foco no está en un botón o input
      if (document.activeElement?.tagName !== 'BUTTON') {
        e.preventDefault();
        launchGameWithSelectedMap();
      }
    }
  });
}
