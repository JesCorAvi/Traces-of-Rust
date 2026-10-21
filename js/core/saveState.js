// Persistencia de la partida, ajustes y carrera por modo.
// Exports: save, saveGame, gameSettings, careerByMode, saveCareer.

import { CONFIG } from '../config.js';
import { loadCareerStatsByMode, saveCareerStatsByMode } from './career.js';

export const save = JSON.parse(localStorage.getItem(CONFIG.SAVE_KEY)) || {
  souls: 0, dmg: 0, hp: 0, spd: 0, atkSpd: 0, mag: 0, reroll: 0
};
export const saveGame = () => localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(save));

const SETTINGS_KEY = 'echoes_rust_settings_v1';

export const gameSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {
  masterVol: 85, sfxVol: 90, ambVol: 80, musicVol: 70, muted: false,
  resScale: 0.44, fov: 70, shadows: true, crt: true, fpsCounter: false,
  mouseSens: 100, camShake: 100, fullscreen: true
};
// Preferencias nuevas: los guardados antiguos no las tienen.
if (typeof gameSettings.fullscreen !== 'boolean') gameSettings.fullscreen = true;
if (typeof gameSettings.musicVol !== 'number') gameSettings.musicVol = 70;

export const saveGameSettings = () => localStorage.setItem(SETTINGS_KEY, JSON.stringify(gameSettings));
export const careerByMode = loadCareerStatsByMode();
export const saveCareer = () => saveCareerStatsByMode(careerByMode);
