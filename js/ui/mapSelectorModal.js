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
import { t } from '../core/i18n.js';
import { GameEvents } from '../core/eventBus.js';

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

  // Renderizar las 6 tarjetas de mapas
  renderMapCards();

  // Actualizar detalle inferior del mapa seleccionado
  updateSelectedMapDetails(selectedMapId);

  // Mostrar overlay
  screen.classList.remove('hidden');
  AudioSys.setMenuFilter?.(true);

  // Foco en la tarjeta seleccionada para accesibilidad con mando/teclado
  setTimeout(() => {
    const activeCard = document.querySelector(`.map-card[data-map-id="${selectedMapId}"]`);
    if (activeCard) activeCard.focus();
  }, 50);
}

export function closeMapSelector() {
  const screen = document.getElementById('map-select-screen');
  if (screen) screen.classList.add('hidden');
  AudioSys.setMenuFilter?.(false);
  onLaunchCallback = null;
}

export function setupMapSelectorEvents() {
  if (isEventsSetup) return;
  isEventsSetup = true;

  // Tabs de dificultad
  const tabFacil = document.getElementById('tab-map-facil');
  const tabNormal = document.getElementById('tab-map-normal');
  const tabDificil = document.getElementById('tab-map-dificil');

  if (tabFacil) tabFacil.onclick = () => switchDifficultyTab('facil');
  if (tabNormal) tabNormal.onclick = () => switchDifficultyTab('normal');
  if (tabDificil) tabDificil.onclick = () => switchDifficultyTab('dificil');

  // Botón volver
  const btnBack = document.getElementById('btn-map-back');
  if (btnBack) {
    btnBack.onclick = () => {
      AudioSys.playUIClick();
      closeMapSelector();
    };
  }

  // Botón de Despliegue Hero
  const btnLaunch = document.getElementById('btn-launch-map');
  if (btnLaunch) {
    btnLaunch.onclick = () => {
      launchGameWithSelectedMap();
    };
  }

  // Atajos de teclado: Escape para volver
  document.addEventListener('keydown', (e) => {
    const screen = document.getElementById('map-select-screen');
    if (!screen || screen.classList.contains('hidden')) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closeMapSelector();
    }
  });

  GameEvents.on('i18n:change', () => {
    const screen = document.getElementById('map-select-screen');
    if (screen && !screen.classList.contains('hidden')) {
      renderMapCards();
      if (selectedMapId) updateSelectedMapDetails(selectedMapId);
    }
  });
}

function switchDifficultyTab(diffKey) {
  if (currentDiff === diffKey) return;
  AudioSys.playUIClick();
  currentDiff = diffKey;
  localStorage.setItem('traces_td_difficulty', currentDiff);

  // Seleccionar automáticamente el mapa predeterminado de esa dificultad
  selectedMapId = DEFAULT_MAP_IDS[currentDiff] || 'easy_plaza';
  localStorage.setItem('traces_td_selected_map', selectedMapId);

  updateDiffTabsUI();
  renderMapCards();
  updateSelectedMapDetails(selectedMapId);
}

function updateDiffTabsUI() {
  const tabs = [
    { el: document.getElementById('tab-map-facil'), key: 'facil' },
    { el: document.getElementById('tab-map-normal'), key: 'normal' },
    { el: document.getElementById('tab-map-dificil'), key: 'dificil' }
  ];

  tabs.forEach(({ el, key }) => {
    if (!el) return;
    const isActive = key === currentDiff;
    el.classList.toggle('is-active-tab', isActive);
    el.setAttribute('aria-selected', String(isActive));
  });
}

function renderMapCards() {
  const container = document.getElementById('map-grid-container');
  if (!container) return;
  container.innerHTML = '';

  const maps = getMapsByDifficulty(currentDiff);
  const records = getMapRecords();

  maps.forEach(mapData => {
    const isSelected = mapData.id === selectedMapId;
    const rec = records[mapData.id] || { completed: false, bestWave: 0 };

    const card = document.createElement('div');
    card.className = `map-card ${isSelected ? 'is-selected' : ''}`;
    card.setAttribute('data-map-id', mapData.id);
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Mapa ${mapData.name}, ${mapData.badge}`);

    // 1. Contenedor de la miniatura de ruta 2D
    const thumbWrap = document.createElement('div');
    thumbWrap.className = 'map-card-thumb';

    // Canvas procedural con la silueta de vías
    const canvas = renderMapThumbnailCanvas(mapData, 240, 110);
    thumbWrap.appendChild(canvas);

    // 2. Medalla / Estado de récord estilo BTD6
    const medalBadge = document.createElement('div');
    medalBadge.className = `map-card-medal ${rec.completed ? 'is-completed' : (rec.bestWave > 0 ? 'is-in-progress' : 'is-unbeaten')}`;
    if (rec.completed) {
      medalBadge.innerHTML = `<span class="ui-icon xs" data-ui-icon="star"></span> <span>${t('ui.map_select.status_completed')}</span>`;
    } else if (rec.bestWave > 0) {
      medalBadge.textContent = t('ui.map_select.status_record', { bestWave: rec.bestWave });
    } else {
      medalBadge.textContent = t('ui.map_select.status_no_data');
    }
    thumbWrap.appendChild(medalBadge);

    // 3. Etiqueta de ruta (Entradas / Salidas)
    const routeTag = document.createElement('div');
    routeTag.className = 'map-card-routetag';
    const entText = t('ui.map_select.entrances', { count: mapData.entrances });
    const exitText = t('ui.map_select.exits', { count: mapData.exits });
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
    const diffName = t(`diff.${mapData.difficulty}`);
    statsEl.innerHTML = `
      <div class="map-stat-chip">
        <span class="chip-label">${t('ui.map_select.diff_label')}</span>
        <span class="chip-val ${mapData.difficulty}">${diffName}</span>
      </div>
      <div class="map-stat-chip">
        <span class="chip-label">${t('ui.map_select.lives_label')}</span>
        <span class="chip-val lives">${t('ui.map_select.lives_val', { count: mapData.maxLives })}</span>
      </div>
      <div class="map-stat-chip">
        <span class="chip-label">${t('ui.map_select.scrap_label')}</span>
        <span class="chip-val scrap">${t('ui.map_select.scrap_val', { count: mapData.startingScrap })}</span>
      </div>
      <div class="map-stat-chip">
        <span class="chip-label">${t('ui.map_select.layout_label')}</span>
        <span class="chip-val">${t('ui.map_select.layout_val', { entrances: mapData.entrances, exits: mapData.exits })}</span>
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

  const chosenMapId = selectedMapId;
  const chosenDiff = currentDiff;
  const cb = onLaunchCallback;

  closeMapSelector();

  // Si hay callback registrado por gameFlow, ejecutarlo
  if (typeof cb === 'function') {
    cb(chosenMapId, chosenDiff);
  }
}

function selectMapCard(mapId) {
  if (selectedMapId === mapId) return;
  selectedMapId = mapId;
  AudioSys.playUIClick();

  // Actualizar tarjetas activas
  const cards = document.querySelectorAll('.map-card');
  cards.forEach(card => {
    const isThis = card.getAttribute('data-map-id') === mapId;
    card.classList.toggle('is-selected', isThis);
  });

  updateSelectedMapDetails(mapId);
}
