# Texturas, Materiales y Memoria

## Principio

Todo el arte es procedural. No se carga ninguna imagen externa: se dibuja en `HTMLCanvasElement` y se sube a GPU como `THREE.CanvasTexture`.

## Helper estándar

`js/sprites/spritePalette.js` exporta:

- `makeTexture(canvas, repeat = 1)` — crea `CanvasTexture` con `NearestFilter`, `SRGBColorSpace` y `RepeatWrapping` opcional.
- `applyEnvironmentDither(ctx, w, h)` — dithering Bayer 4×4 contra la paleta industrial.
- `applyCleanSpriteOutlineRect(ctx, w, h)` — contorno negro de 1 px.
- `applyIcon16Outline(ctx, ox, oy)` — contorno para iconos de 16×16.

Si generas una textura nueva, usa `makeTexture`; ya fija `NearestFilter` y `SRGBColorSpace`. Añade `tex.generateMipmaps = false` explícitamente si sigues el patrón estricto de pixel-art.

## Filtros obligatorios

```js
const tex = new THREE.CanvasTexture(canvas);
tex.magFilter = THREE.NearestFilter;
tex.minFilter = THREE.NearestFilter;
tex.generateMipmaps = false;
tex.colorSpace = THREE.SRGBColorSpace;
```

- `NearestFilter` conserva el pixel-art; cualquier filtro lineal lo emborrona.
- `generateMipmaps = false` evita mezclas entre niveles de mip.
- Usa `RepeatWrapping` solo en texturas que deban repetirse (metal, rejilla, hazard).

## Paleta

La paleta base vive en `PAL` dentro de `spritePalette.js` (negro abisal, verde moho, óxido, sangre, latón, acero, blanco ocular). Para materiales de torreta, respeta los colores de `cfg.color` y los materiales comunes de `models/base.js`; no introduzcas colores fuera de la estética.

## Materiales compartidos

- Reutiliza `SHARED_GEO`/`SHARED_MAT` (`js/combat/shared.js`) para proyectiles, flashes y piezas repetidas.
- Marca recursos reutilizados:

```js
mesh.userData.sharedGeo = true;
mesh.userData.sharedMat = true;
```

- No clones materiales por instancia salvo que el color o la textura deban variar. Un material nuevo por torreta multiplica draw calls y VRAM.

## Ciclo de vida

`js/utils/dispose.js`:

```js
export function disposeObject3D(root) {
  root.traverse(obj => {
    if (!obj.userData.sharedGeo && obj.geometry) obj.geometry.dispose();
    if (!obj.userData.sharedMat && obj.material) {
      if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
      else obj.material.dispose();
    }
  });
}
```

Patrón de `destroy()`:

```js
destroy() {
  if (this.group) {
    if (this.group.parent) this.group.parent.remove(this.group);
    disposeObject3D(this.group);
    this.group = null;
  }
}
```

- Las texturas embebidas en materiales se liberan al disponer el material; si una textura se comparte fuera del árbol, guárdala y dispónla explícitamente.
- No dispongas recursos compartidos desde una instancia: se romperían las demás.
- Tras destruir, pon referencias a `null` para facilitar el GC.

## Rendimiento

- Prefiere geometrías de bajo poligonaje (cilindros de 6–12 segmentos, cajas).
- Los pools de enemigos/proyectiles deben reutilizar mallas, no crear/destruir por spawn.
- Evita `castShadow` en piezas emisivas; `addPart` ya lo desactiva para `glowMat`/`accentMat`.
- Mantén el número de materiales por torreta acotado a los comunes.
- Comprueba `renderer.info.memory.geometries` y `.textures` antes/después de un ciclo de construcción y destrucción.

## Anti-Patterns

- `TextureLoader` o cualquier PNG/JPG.
- `LinearFilter`, `generateMipmaps` activo o `anisotropy` alto en pixel-art.
- Crear un `CanvasTexture` nuevo en cada frame.
- Compartir una geometría sin `userData.sharedGeo`.
- Disponer un material compartido desde una torreta.
- Duplicar la paleta en cada archivo de sprites.
