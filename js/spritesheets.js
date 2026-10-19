// Registro de SpriteSheets y utilidades CSS/HTML para iconos y UI.
// Exports: SpriteSheets, initUISpritesCSS, refreshStaticDOMIcons, renderSpriteIconHTML, renderSpriteBadgeHTML, getPlayerLoadoutSheet, peekPlayerLoadoutSheet.
import { CONFIG } from './config.js';
import { getPlayerLoadoutSheet, peekPlayerLoadoutSheet } from './sprites/playerSprites.js';
import { buildEnemyDirectionalSheet, buildEnvironmentTextures } from './sprites/entitySprites.js';
import { buildTurretSheets, buildAllyDirectionalSheets } from './sprites/turretSprites.js';
import { buildMasterUIAtlas } from './sprites/uiAtlasBuilder.js';

export { getPlayerLoadoutSheet, peekPlayerLoadoutSheet };

function cropAtlasToDataURL(atlasCanvas, rect, scale = 1) {
  const c = document.createElement('canvas');
  c.width = rect.w * scale;
  c.height = rect.h * scale;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    atlasCanvas,
    rect.x, rect.y, rect.w, rect.h,
    0, 0, rect.w * scale, rect.h * scale
  );
  return c.toDataURL('image/png');
}

export function refreshStaticDOMIcons() {
  if (typeof document === 'undefined') return;
  const UI = CONFIG.UI_SPRITES;
  const scale = UI.SCALE;
  document.querySelectorAll('[data-ui-icon]').forEach(el => {
    const key = el.getAttribute('data-ui-icon');
    const pos = UI.ICONS[key] || UI.ICONS.warning;
    const bgX = -(pos.col * UI.ICON_SIZE * scale);
    const bgY = -((UI.ICONS_ORIGIN_Y + pos.row * UI.ICON_SIZE) * scale);
    el.style.backgroundPosition = `${bgX}px ${bgY}px`;
  });
}

export function initUISpritesCSS(customScale = CONFIG.UI_SPRITES.SCALE) {
  const scale = Math.max(1, Math.round(customScale));
  CONFIG.UI_SPRITES.SCALE = scale;

  const UI = CONFIG.UI_SPRITES;
  const atlasCanvas = SpriteSheets.ui_atlas.canvas;
  const root = document.documentElement.style;

  root.setProperty('--ui-scale', String(scale));
  root.setProperty('--ui-atlas', `url("${atlasCanvas.toDataURL('image/png')}")`);
  root.setProperty('--ui-atlas-w', `${UI.ATLAS_W * scale}px`);
  root.setProperty('--ui-atlas-h', `${UI.ATLAS_H * scale}px`);
  root.setProperty('--ui-icon-size', `${UI.ICON_SIZE * scale}px`);
  root.setProperty('--ui-badge-w', `${UI.BADGE_W * scale}px`);
  root.setProperty('--ui-badge-h', `${UI.BADGE_H * scale}px`);

  Object.entries(UI.NINE_SLICE).forEach(([key, cfg]) => {
    const url = cropAtlasToDataURL(atlasCanvas, cfg, 1);
    root.setProperty(`--slice-${key}`, `url("${url}")`);
    root.setProperty(`--slice-${key}-cut`, String(cfg.slice));
    const bw = key === 'bar_frame' ? Math.max(3, scale * 2) : cfg.slice * scale;
    root.setProperty(`--slice-${key}-bw`, `${bw}px`);
  });

  Object.entries(UI.BAR_FILLS).forEach(([key, cfg]) => {
    const url = cropAtlasToDataURL(atlasCanvas, cfg, scale);
    root.setProperty(`--bar-fill-${key}`, `url("${url}")`);
  });

  Object.entries(UI.CURSORS).forEach(([key, cfg]) => {
    const url = cropAtlasToDataURL(atlasCanvas, cfg, scale);
    root.setProperty(`--cursor-${key}`, `url("${url}") ${cfg.hotX * scale} ${cfg.hotY * scale}`);
  });

  refreshStaticDOMIcons();
}

export function renderSpriteIconHTML(iconKey, extraClass = '') {
  const UI = CONFIG.UI_SPRITES;
  const scale = UI.SCALE;
  const pos = UI.ICONS[iconKey] || UI.ICONS.warning;
  const bgX = -(pos.col * UI.ICON_SIZE * scale);
  const bgY = -((UI.ICONS_ORIGIN_Y + pos.row * UI.ICON_SIZE) * scale);
  return `<span class="ui-icon ${extraClass}" data-ui-icon="${iconKey}" style="background-position: ${bgX}px ${bgY}px;" aria-hidden="true"></span>`;
}

export function renderSpriteBadgeHTML(level = 0, extraClass = '') {
  const UI = CONFIG.UI_SPRITES;
  const scale = UI.SCALE;
  const clamped = Math.max(0, Math.min(8, level));
  const bgX = -(clamped * UI.BADGE_W * scale);
  const bgY = -(UI.BADGES_ORIGIN_Y * scale);
  return `<span class="ui-lvl-badge ${extraClass}" style="background-position: ${bgX}px ${bgY}px;" aria-label="+${clamped}"></span>`;
}

export const SpriteSheets = {
  player:       null,
  zombie:       buildEnemyDirectionalSheet('zombie'),
  weeper:       buildEnemyDirectionalSheet('weeper'),
  worm:         buildEnemyDirectionalSheet('worm'),
  boss_butcher: buildEnemyDirectionalSheet('boss_butcher'),
  boss_siren:   buildEnemyDirectionalSheet('boss_siren'),
  boss_furnace: buildEnemyDirectionalSheet('boss_furnace'),
  boss_apostle: buildEnemyDirectionalSheet('boss_apostle'),
  boss_warden:  buildEnemyDirectionalSheet('boss_warden'),
  ...buildTurretSheets(),
  ...buildAllyDirectionalSheets(),
  env:          buildEnvironmentTextures(),
  ui_atlas:     buildMasterUIAtlas()
};

SpriteSheets.player = getPlayerLoadoutSheet({ slash: 1 }, 'slash');
initUISpritesCSS(CONFIG.UI_SPRITES.SCALE);