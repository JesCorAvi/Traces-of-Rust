# Torretas, Mejoras y Efectos

Fuente: `js/config/coreDefense/turrets.js` y `js/defense/turrets/stats.js`.

## Esquema de torreta

```js
gunner: {
  id: 'gunner',
  name: 'CLAVADORA',
  role: 'DAÑO DIRECTO',
  icon: 'turret_gunner',
  spriteKey: 'turret_gunner',
  description: '...',
  cost: 10,
  color: 0xb89c46,
  spriteSize: 1.5,
  base: {
    damage: 15, range: 11, fireRate: 2.8, hp: 220,
    collisionRadius: 0.55, height: 1.7, attackStopDistance: 1.6,
    projectileSpeed: 42, tracer: true
  },
  paths: [
    {
      id: 'rate', name: 'CADENCIA', color: 0xd9b38c,
      upgrades: [
        {
          cost: 6, name: 'Cerrojo rápido', desc: '+25% de cadencia.',
          effects: { fireRateMult: 1.25 }
        },
        {
          cost: 12, name: 'Cañón gemelo', desc: '...',
          effects: { projectileCount: 2 },
          special: 'twin', visual: 'twin_barrels'
        }
      ]
    }
  ]
}
```

Reglas:

- 3 rutas, 4 niveles cada una.
- `cost` creciente dentro de la ruta.
- `effects` es plano; no anides objetos.
- `special` lo consume el módulo de combate; `visual` debe existir en `visualParts`.

## Reglas BTD6

```js
TURRET_UPGRADE_RULES = {
  maxTier: 4,
  freeTier: 2,
  specializedTier: 3,
  sellRefund: 0.5
};
```

- Hasta nivel 2 se puede subir cualquier ruta.
- Al llegar a nivel 3 en una ruta, las demás quedan bloqueadas (`'OTRA RUTA ESPECIALIZADA'`).
- La venta devuelve `floor(invested * 0.5)`.
- `maxTier` documenta el techo; `path.upgrades.length` es el límite real.

## Claves de `effects` Reconocidas

Cualquier clave no listada se ignora con `default: break`.

### Ofensiva y control

| Clave | Operación | Efecto |
|---|---|---|
| `damageMult` | multiplica | Daño × valor |
| `damageFlat` | suma | Daño + valor |
| `fireRateMult` | multiplica | Cadencia × valor |
| `rangeMult` | multiplica | Alcance × valor |
| `aoeRadiusMult` | multiplica | Radio de área × valor |
| `slowFactor` | mínimo | Factor de ralentización (menor = más lento) |

### Proyectiles y explosivos

| Clave | Operación | Efecto |
|---|---|---|
| `projectileCount` | máximo | Proyectiles por disparo |
| `pierce` | máximo | Enemigos atravesados |
| `burstCount` | máximo | Balas por ráfaga |
| `shellCount` | máximo | Proyectiles de mortero |
| `cluster` | máximo | Número de submuniciones |
| `clusterDamageMult` | multiplica | Daño de submuniciones |
| `clusterRadiusMult` | multiplica | Radio de submuniciones |
| `explosionRadius` | máximo | Radio de explosión |
| `explosionDamageMult` | multiplica | Daño de explosión |

### Fuego

| Clave | Operación | Efecto |
|---|---|---|
| `burnDps` | suma | Daño por segundo de quemadura |
| `burnDuration` | suma | Duración de quemadura |
| `burnDpsMult` | multiplica | Multiplicador de DPS de quemadura |
| `burnDurationMult` | multiplica | Multiplicador de duración |
| `napalmDps` | suma | DPS de napalm |
| `napalmDuration` | suma | Duración de napalm |
| `napalmRadius` | máximo | Radio de napalm |
| `napalmDpsMult` | multiplica | DPS de napalm |
| `napalmDurationMult` | multiplica | Duración de napalm |
| `napalmRadiusMult` | multiplica | Radio de napalm |
| `ignitionDamage` | suma | Daño de ignición |

### Hielo y fragilidad

| Clave | Operación | Efecto |
|---|---|---|
| `freezeDuration` | máximo | Duración de congelación |
| `freezeEvery` | primer valor | Cada N disparos congela |
| `frozenDamageMult` | máximo | Daño contra congelados |
| `frostbiteDps` | suma | DPS de congelación |
| `frostbiteDpsMult` | multiplica | Multiplicador de frostbite |
| `brittleMult` | máximo | Multiplicador de fragilidad |

### Aliados

| Clave | Operación | Efecto |
|---|---|---|
| `allyCap` | suma | Capacidad de tropas |
| `alliesPerSpawn` | suma | Tropas por spawn |
| `alliesPerSpawnSet` | máximo | Fija tropas por spawn |
| `allyDamageMult` | multiplica | Daño de aliados |
| `allyHpMult` | multiplica | HP de aliados |
| `allySpeedMult` | multiplica | Velocidad de aliados |
| `allyRangeMult` | multiplica | Alcance de aliados |
| `allyArmor` | máximo | Armadura de aliados |
| `allyRanged` | booleano | Aliados a distancia |
| `allyAoe` | booleano | Aliados con área |
| `spawnIntervalMult` | multiplica | Intervalo de spawn |

### Soporte

| Clave | Operación | Efecto |
|---|---|---|
| `healAmountMult` | multiplica | Curación |
| `healRadiusMult` | multiplica | Radio de curación |
| `buffFireRate` | suma | Buff de cadencia a cercanas |
| `buffDamage` | suma | Buff de daño a cercanas |
| `buffRange` | suma | Buff de alcance a cercanas |
| `buffScrap` | suma | Generación de chatarra |
| `auraArmor` | suma | Armadura en aura |
| `shieldAmount` | suma | Escudo |
| `shieldAmountMult` | multiplica | Escudo |
| `shieldInterval` | mínimo | Intervalo de escudo |
| `overclockBurst` | máximo | Ráfaga de overclock |
| `overclockBurstDuration` | máximo | Duración de overclock |
| `overclockBurstInterval` | asigna | Intervalo de overclock |
| `continuous` | booleano | Ataque continuo |
| `continuousHeal` | booleano | Curación continua |
| `barrier` | booleano | Barrera |

## Cómo Añadir un Efecto

1. Añade el `case` en `recomputeStats` (`js/defense/turrets/stats.js`).
2. Consume el valor en el módulo de combate/objetivo correspondiente:
   - `js/defense/turrets/combat/*`
   - `js/defense/turretSystem/*`
   - `js/defense/turrets/targeting.js`
3. Si la mejora debe verse, crea la pieza con `addHiddenPart('clave', ...)` y usa `visual: 'clave'`.
4. Si la mejora cambia el comportamiento, implementa `special` en el módulo que dispara.
5. Añade el caso a `references/turret-effects.md` y ejecuta `audit-config.mjs`.

## Anti-Patterns

- Efecto sin `case`: no hace nada y no avisa.
- `special` sin consumidor.
- `visual` sin pieza en `visualParts`.
- Ruta con 3 o 5 niveles.
- Coste que baja al mejorar.
- `damageMult` multiplicativo acumulado sin querer al recomputar.
- Cambiar `sellRefund` sin revisar la economía de la partida.
