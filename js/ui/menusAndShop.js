// Barrel de UI de menú: selector de modo, tienda, cartas de level-up, operador y ajustes.
// Exports: renderModeSelectorUI, updateCareerDossierForSelectedMode, renderShopUI, renderLevelUpCardsUI, setupCharacterSelectorUI, updateCharacterSelectorCard, openCharacterSelectorModal, closeCharacterSelectorModal, onCharacterChange, setupSettingsUI, applyStoredFullscreen, setFullscreen, toggleFullscreen, isFullscreen.

export { renderModeSelectorUI, updateCareerDossierForSelectedMode, updateStartPlayButton } from './modeSelector.js';
export { renderShopUI } from './shop.js';
export { renderLevelUpCardsUI } from './levelUpCards.js';
export { setupCharacterSelectorUI, updateCharacterSelectorCard, openCharacterSelectorModal, closeCharacterSelectorModal, onCharacterChange } from './characterSelectorModal.js';
export { setupSettingsUI, applyStoredFullscreen, setFullscreen, toggleFullscreen, isFullscreen } from './settingsMenu.js';
