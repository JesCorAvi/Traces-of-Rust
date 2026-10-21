# Pipeline de un Operador

## 1. Catálogo

`js/config/charactersConfig.js`:

```js
export const DEFAULT_CHARACTER_ID = 'otto';

export const CHARACTERS = {
  nuevoId: {
    id: 'nuevoId',
    weapon: 'shotgun',
    weaponTitle: 'Escopeta de Trinchera',
    title: 'Sargento K. Briggs',
    role: 'Infantería de Brecha',
    desc: '...',
    passive: 'Supresión Cinética',
    passiveDesc: '+30 HP, +20% daño y knockback x2.',
    statMods: { baseHpBonus: 30, projectileDmgMult: 1.20, knockbackMult: 2.0 },
    color: '#d4a034',
    accentColor: '#5c4210',
    icon: 'shotgun'
  }
};
```

- Las claves del objeto definen el orden del selector; añade al final.
- `id` debe coincidir con la clave.
- `getSelectedCharacterId()` valida el guardado y cae a `DEFAULT_CHARACTER_ID`.
- `setSelectedCharacterId(id)` ignora IDs inexistentes.
- `getCharacterById(id)` cae a Otto si el ID no existe.

## 2. Arma

Valores soportados por `playerController`:

| `weapon` | Módulo / función |
|---|---|
| `slash` | `js/combat/weapons/saw.js` → `executeSawSlash` |
| `shotgun` | `js/combat/weapons/shotgun.js` → `fireBuckshot` |
| `flamethrower` | `js/combat/weapons/flamethrower.js` → `fireFlamethrower` |
| `aura` | `js/player/playerController.js` (aura) |
| `mines` | `js/combat/weapons/mines.js` → `spawnShrapnelMine` |
| `harpoon` | `js/combat/weapons/harpoon.js` → `fireHarpoon` |
| `orbital` | `js/player/playerController.js` (orbitales) |
| `bolt` | `js/combat/weapons/bolt.js` → `fireDefibrillator` |

El `icon` debe existir en el atlas de `renderSpriteIconHTML`. Si el arma es nueva, primero intégrala en combate, HUD y hoja de sprites.

## 3. Tema Visual

`js/sprites/player/body.js` → `CHARACTER_THEMES`:

```js
nuevoId: {
  coatBase: '#...', coatHi: '#...', coatDark: '#...', coatTrim: '#...',
  belt: '#...', buckle: '#...',
  legs: '#...', boots: '#...', bootTrim: '#...',
  maskBase: '#...', maskHi: '#...', eyeGlow: '#...',
  feature: '...' // rasgo distintivo dibujado por el renderer
}
```

- `drawPlayer8DirCell(..., charId)` busca el tema; si falta, usa `CHARACTER_THEMES.otto`.
- El retrato usa el mismo tema; si falta, también cae a Otto.
- `feature` debe tener soporte en el dibujo; si usas un valor nuevo, añade su rama.

## 4. Retrato

`js/sprites/player/portraits.js`:

- `drawCharacterPortrait(ctx, charId)` dibuja 32×32.
- `getCharacterPortraitURL(charId)` cachea el data URL.
- No hay archivos PNG; el retrato se genera del tema.

## 5. Hoja de Sprites en Partida

- `getPlayerLoadoutSheet(skills, activeHand, charId)` compone las 8 direcciones con el arma activa y el tema.
- `js/gameplay/playerVisuals.js` precarga y sincroniza la hoja del operador.
- `startGame()` llama a `prewarmLoadoutSheets()` y `syncPlayerVisualLoadout(startWeapon)`.
- Si el arma no tiene render, el personaje puede quedar sin arma visible.

## 6. Selector

`js/ui/characterSelectorModal.js`:

- `renderCharacterGrid()` recorre `Object.values(CHARACTERS)`.
- Pinta retrato, título, rol, arma, pasiva y botón.
- `setSelectedCharacterId`, `updateCharacterSelectorCard()`, `refreshStaticDOMIcons()`.
- `onCharacterChange(fn)` notifica a otros módulos.
- La tarjeta compacta del menú usa `getCharacterPortraitURL` y `renderSpriteIconHTML`.

No hay una lista hardcodeada que actualizar; si el personaje no aparece, el problema está en `CHARACTERS`.

## 7. Orden de Render

1. `CHARACTERS` define los datos.
2. `CHARACTER_THEMES` define la paleta.
3. `portraits.js` genera el retrato.
4. `spritesheets.js`/`playerSprites.js` generan la hoja 8-direcciones.
5. `playerVisuals.js` aplica la hoja al jugador local.
6. `multiplayerSync.js` aplica la hoja al `RemotePlayer` con el `charId` recibido.

## Checklist Visual

- [ ] El retrato no es idéntico al de Otto.
- [ ] El cuerpo en partida usa la paleta propia.
- [ ] El arma se ve en las 8 direcciones.
- [ ] El icono de arma aparece en el selector y el HUD.
- [ ] El personaje se mantiene tras recargar.
- [ ] Un ID inválido cae a Otto sin romper.
