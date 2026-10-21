# Estadísticas y Réplica Online

## Claves Genéricas Consumidas

`js/gameplay/modifiers.js` → `getActiveModifiers(save, gameSettings, passives, character)`:

| Clave de `statMods` | Efecto devuelto |
|---|---|
| `moveSpeedMult` | `moveSpeed` base × valor |
| `atkSpeedMult` | `atkSpeedMult` |
| `critChanceBonus` | `critChance` |
| `areaMult` | `areaMult` (área/alcance de armas) |
| `regenPerSec` | `regenPerSec` |
| `bonusProjectiles` | `bonusProjectiles` (multishot; minas) |
| `dmgMult` | `dmgMult` global |
| `damageReduction` | `damageReduction` |
| `knockbackMult` | `knockbackMult` |

Además, `baseHpBonus` se suma al HP inicial en `js/core/gameFlow.js`.

El objeto `mods` se pasa a las armas desde `rt.getMods()` y a `playerController`; úsalo en lugar de leer `CHARACTERS` dentro del arma.

## Claves Específicas Pendientes

Declaradas en `charactersConfig.js` pero **sin consumidor**:

| Clave | Consumidor natural |
|---|---|
| `slashDmgMult` | `js/combat/weapons/saw.js` |
| `projectileDmgMult` | `shotgun.js`, `mines.js`, `harpoon.js` |
| `fireDmgMult` | `flamethrower.js` |
| `auraSlowBonus` | `playerController.js` (aura) |
| `explosiveDmgMult` | `mines.js` |
| `harpoonDmgMult` | `harpoon.js` |
| `orbitalDmgMult` | `playerController.js` (orbitales) |
| `boltChainsExtra` | `bolt.js` |
| `extraOrbitals` | `playerController.js` (número de orbitales) |
| `rangeMult` | cálculo de alcance en `js/combat/weapons/*` y `playerController.js` |

Si una pasiva usa una de estas claves, hoy **no hace nada**. Para implementarla:

1. Añade la clave al retorno de `getActiveModifiers`:

```js
const charSlashMult = charMods.slashDmgMult || 1.0;
return {
  // ...
  slashDmgMult: charSlashMult
};
```

2. Consúmela en el módulo del arma:

```js
const dmg = cfg.baseDmg * mult * mods.dmgMult * (mods.slashDmgMult || 1);
```

3. Si el arma ya usa `mods.dmgMult` global, evita aplicar ambos y duplicar el efecto.
4. Si el Cliente reporta daño, el valor enviado en `PLAYER_HIT` debe incluir el modificador local; el Host no conoce el personaje del Cliente para recalcularlo.

## Pasivas Booleanas o de Comportamiento

- `allyRanged`, `allyAoe`, `continuous`, etc. son claves de torreta, no de personaje.
- Para una pasiva booleana de personaje, añade una clave nueva y consúmela explícitamente; no la metas en `statMods` esperando que el motor la lea.

## Réplica Online

- `multiplayerSync.js` envía `charId` en `HELLO` y en `POS`.
- `RemotePlayer.applyCharacterVisual(charId)`:
  - Resuelve `getCharacterById(charId)`.
  - Carga la hoja con `getPlayerLoadoutSheet(skills, char.weapon, charId)`.
  - Cambia el color/tema del avatar.
- Si el ID no existe en el peer, cae a Otto: apariencia distinta entre jugadores.
- El estado de estadísticas no se replica como entidad; cada peer aplica sus propios `statMods`.
- El daño del Cliente se agrega y envía como `PLAYER_HIT`; el Host aplica el daño reportado.
- Cambiar de personaje a mitad de partida no es un flujo previsto; si lo permites, fuerza `applyCharacterVisual` en el peer.

## Validación de Pasivas

Para cada clave:

1. Mide el valor con y sin personaje (HP, daño por impacto, cadencia, área, regeneración).
2. Comprueba que no se aplica dos veces al recomputar o reiniciar.
3. Comprueba que el HUD refleja el resultado si muestra la estadística.
4. En co-op, comprueba que el peer remoto ve el personaje correcto y que el daño reportado es coherente.

## Anti-Patterns

- Declarar una pasiva en `passiveDesc` sin implementar la clave.
- Usar `dmgMult` para una pasiva de arma única.
- Leer `CHARACTERS` dentro del arma en lugar de `mods`.
- Añadir una clave a `statMods` sin añadirla a `getActiveModifiers`.
- Duplicar el multiplicador en el arma y en el daño global.
- Asumir que el Host conoce el personaje del Cliente.
