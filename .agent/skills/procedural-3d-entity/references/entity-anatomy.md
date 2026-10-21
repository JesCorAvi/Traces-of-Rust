# Anatomía de Entidades 3D

## Torretas

Cadena de construcción (`js/defense/turret.js`):

1. `DefensiveStructure` registra HP, radio, altura y posición.
2. `buildMaterials(turret)` crea materiales comunes: `bodyMat`, `darkMat`, `rustMat`, `accentMat`, `glowMat`, `hazardMat`, `panelMat`, `gaugeMat`, `decalMat`, `muzzleFlashMat`.
3. `buildModel(turret)` monta el pedestal común y delega en `MODEL_BUILDERS[cfg.id]`.
4. `buildMuzzleFlash`, `buildHealthBar`, `applyUpgradeVisuals`.
5. `recomputeStats` recalcula `stats`, `specials` y `visualKeys`.

### Jerarquía obligatoria

```text
group
├── baseRoot   // pedestal octagonal, patas, anclajes, anillo hazard; NO gira
└── modelRoot  // plato, cabezal, cañones, radar; gira con faceTarget
```

Helpers:

- `addBasePart(geo, mat, x, y, z, rx, ry, rz)` → añade a `baseRoot`.
- `addPart(...)` → añade a `modelRoot`; las piezas emisivas no proyectan sombra.
- `addHiddenPart(name, ...)` → `visible = false` y registra en `visualParts[name]`.

### Model builders

`js/defense/turrets/models/registry.js`:

```js
MODEL_BUILDERS = { gunner, mortar, cryo, barracks, support }
```

Cada builder debe:

- Añadir piezas solo a `turret.modelRoot` (o `baseRoot` si son anclajes).
- Definir `turret.muzzleHeight` y `turret.muzzleForward`.
- Registrar piezas de mejora con `addHiddenPart('clave', ...)`.
- Guardar referencias animables: `barrelRecoilMesh`, `barrelBaseZ`, `radarDishMesh`.
- No crear materiales nuevos por instancia si el material común sirve.

### Apuntado y disparo

- `faceTarget(turret, targetPos)` fija `modelRoot.rotation.y = Math.atan2(-dx, -dz)`.
- `getMuzzleWorldPos` parte de `(0, muzzleHeight, -muzzleForward)` y aplica la rotación del `modelRoot`.
- `muzzleFlashMesh` se muestra mientras `firingFlash > 0`, rota aleatoriamente y escala entre 0.85 y 1.2.
- `barrelRecoilMesh.position.z` avanza +0.12 al disparar y vuelve con lerp.
- `radarDishMesh.rotation.y += dt * 2.2` para torres de soporte.

### Mejoras visuales

- `visualParts` asocia una clave de `upgrade.visual` a una pieza.
- `applyUpgradeVisuals` hace `part.visible = visualKeys.has(key)`.
- `visualKeys` se llena en `recomputeStats` recorriendo los upgrades ya comprados y añadiendo su `visual`.
- Si añades un `visual`, añade también la pieza con `addHiddenPart`; si no, no se verá nada.

## Estructuras defensivas

`DefensiveStructure` aporta HP, colisión, altura y destrucción. Úsala para muros, barricadas y estructuras fijas. No dupliques su lógica en una clase nueva.

## Props y geometría del mundo

- `js/world/geometry.js` y `js/world/props.js` construyen el escenario.
- Reutiliza `SHARED_GEO`/`SHARED_MAT` cuando existan.
- Consulta `worldPhysics.getGroundHeight(x, z)` antes de posicionar.
- Verifica despeje de rutas con `routeMath` y `PLACEMENT`.

## Enemigos y billboards

- `js/entities/billboard.js` gestiona el plano orientado a cámara.
- `js/entities/enemy.js` y `enemyPool.js` aportan estado y pooling.
- Los sprites viven en `js/sprites/entity/` y se registran en `spritesheets.js`.
- No conviertas un enemigo en modelo 3D sin revisar pooling, red y rendimiento.

## Errores Frecuentes

- Poner el cañón en `baseRoot`: la torreta no apunta.
- Poner las patas en `modelRoot`: la base gira con el objetivo.
- No definir `muzzleHeight`/`muzzleForward`: el flash sale del centro.
- Añadir `visual` sin `visualParts`: la mejora no se ve.
- Crear materiales por instancia: se multiplican las texturas y draw calls.
- No llamar a `disposeObject3D` en `destroy()`: fuga de VRAM.
