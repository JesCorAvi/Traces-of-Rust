// Generador procedural de miniaturas 2D para rutas de mapas estilo Bloons TD 6.
// Dibuja en un canvas 2D el plano esquemático de la fábrica, obstáculos y trazados de spline.
// Exports: renderMapThumbnailCanvas, renderMapThumbnailDataURL.

/**
 * Convierte coordenadas del mundo 3D (-50 a +50) a píxeles del canvas 2D con márgenes de seguridad.
 */
function worldToCanvas(x, z, cw, ch, padding = null) {
  const padX = (padding && typeof padding === 'object') ? padding.x : (typeof padding === 'number' ? padding : Math.round(cw * 0.08));
  const padY = (padding && typeof padding === 'object') ? padding.y : (typeof padding === 'number' ? padding : Math.round(ch * 0.14));
  const innerW = cw - padX * 2;
  const innerH = ch - padY * 2;
  // El área jugable de MAP_CATALOG está en [-44, 44] para X y Z.
  // Con span 104 (rango -52 a +52), los waypoints extremos (±44) y las splines (±46)
  // quedan perfectamente dentro del área visible con holgura segura para balizas y glow.
  const span = 104;
  const nx = (x + 52) / span;
  const nz = (z + 52) / span;
  return {
    px: padX + Math.max(0, Math.min(1, nx)) * innerW,
    py: padY + Math.max(0, Math.min(1, nz)) * innerH
  };
}

/**
 * Obtiene los puntos de la ruta suavizados usando Catmull-Rom si solo se dispone de controlPoints.
 */
function getRoutePoints(route, samplesPerSegment = 8) {
  if (route.waypoints && route.waypoints.length >= 2) {
    return route.waypoints;
  }
  const pts = route.controlPoints;
  if (!pts || pts.length < 2) return [];
  if (pts.length === 2) return pts;

  const result = [];
  const n = pts.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(n - 1, i + 2)];

    for (let s = 0; s < samplesPerSegment; s++) {
      const t = s / samplesPerSegment;
      const t2 = t * t;
      const t3 = t2 * t;

      const x = 0.5 * (
        (2 * p1.x) +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
      );
      const z = 0.5 * (
        (2 * p1.z) +
        (-p0.z + p2.z) * t +
        (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 +
        (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3
      );
      result.push({ x, z });
    }
  }
  result.push({ x: pts[n - 1].x, z: pts[n - 1].z });
  return result;
}

/**
 * Renderiza el plano del mapa en un elemento Canvas HTML5.
 * @param {Object} mapData - Datos del mapa con routes, spawnPoints, exitPoints.
 * @param {number} width - Ancho del canvas (default 240)
 * @param {number} height - Alto del canvas (default 110)
 * @returns {HTMLCanvasElement}
 */
export function renderMapThumbnailCanvas(mapData, width = 240, height = 110) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // 1. Suelo base industrial oscuro
  ctx.fillStyle = '#060a07';
  ctx.fillRect(0, 0, width, height);

  // 2. Rejilla sutil de fábrica
  ctx.strokeStyle = '#0e1610';
  ctx.lineWidth = 1;
  const gridStep = 18;
  for (let gx = 0; gx < width; gx += gridStep) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, height);
    ctx.stroke();
  }
  for (let gy = 0; gy < height; gy += gridStep) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(width, gy);
    ctx.stroke();
  }

  // 2b. Límite perimetral táctico del sector
  const arenaTL = worldToCanvas(-46, -46, width, height);
  const arenaBR = worldToCanvas(46, 46, width, height);
  ctx.save();
  ctx.strokeStyle = 'rgba(39, 56, 42, 0.4)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.strokeRect(arenaTL.px, arenaTL.py, arenaBR.px - arenaTL.px, arenaBR.py - arenaTL.py);
  ctx.restore();

  // 3. Obstáculos / Plataformas principales de la fábrica
  // Plataforma Norte (-22z), Plataforma Sur (+22z) y bloques perimetrales
  const platforms = [
    { x: -10, z: -28, w: 20, d: 12 }, // Plataforma Norte
    { x: -10, z: 16,  w: 20, d: 12 }, // Plataforma Sur
    { x: -38, z: -10, w: 10, d: 20 }, // Bloque Oeste
    { x: 28,  z: -10, w: 10, d: 20 }  // Bloque Este
  ];

  ctx.fillStyle = '#0f1711';
  ctx.strokeStyle = '#1e2d21';
  ctx.lineWidth = 1;
  platforms.forEach(p => {
    const tl = worldToCanvas(p.x, p.z, width, height);
    const br = worldToCanvas(p.x + p.w, p.z + p.d, width, height);
    const pw = br.px - tl.px;
    const ph = br.py - tl.py;
    ctx.fillRect(tl.px, tl.py, pw, ph);
    ctx.strokeRect(tl.px, tl.py, pw, ph);
  });

  // 4. Zona del Reactor Biomecánico Central (Centro del mapa)
  const centerPos = worldToCanvas(0, 0, width, height);
  ctx.fillStyle = 'rgba(240, 201, 84, 0.12)';
  ctx.beginPath();
  ctx.arc(centerPos.px, centerPos.py, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(240, 201, 84, 0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#f0c954';
  ctx.fillRect(centerPos.px - 2, centerPos.py - 2, 4, 4);

  // 5. Rutas / Trazados Spline
  if (mapData.routes) {
    Object.values(mapData.routes).forEach(route => {
      const wps = getRoutePoints(route, 8);
      if (!wps || wps.length < 2) return;

      const baseColor = typeof route.color === 'number'
        ? '#' + route.color.toString(16).padStart(6, '0')
        : (route.color || '#00e5ff');

      // Capa de resplandor exterior
      ctx.strokeStyle = baseColor;
      ctx.globalAlpha = 0.28;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      wps.forEach((pt, idx) => {
        const c = worldToCanvas(pt.x, pt.z, width, height);
        if (idx === 0) ctx.moveTo(c.px, c.py);
        else ctx.lineTo(c.px, c.py);
      });
      ctx.stroke();

      // Capa principal de neón
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Capa central brillante
      ctx.strokeStyle = '#ffffff';
      ctx.globalAlpha = 0.75;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.globalAlpha = 1.0;

      // Flechas direccionales hacia la salida
      const arrowCount = 4;
      const step = Math.floor(wps.length / (arrowCount + 1));
      for (let i = 1; i <= arrowCount; i++) {
        const idx = i * step;
        if (idx < wps.length - 1) {
          const p1 = worldToCanvas(wps[idx].x, wps[idx].z, width, height);
          const p2 = worldToCanvas(wps[idx + 1].x, wps[idx + 1].z, width, height);
          const angle = Math.atan2(p2.py - p1.py, p2.px - p1.px);

          ctx.save();
          ctx.translate(p1.px, p1.py);
          ctx.rotate(angle);
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(3, 0);
          ctx.lineTo(-3, -3);
          ctx.lineTo(-1, 0);
          ctx.lineTo(-3, 3);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }
    });
  }

  // 6. Balizas de Entrada (Spawn Points - Verde Neón)
  if (mapData.spawnPoints) {
    mapData.spawnPoints.forEach(sp => {
      let x = sp.position?.x;
      let z = sp.position?.z;
      if ((x === undefined || z === undefined) && sp.pathId && mapData.routes?.[sp.pathId]) {
        const r = mapData.routes[sp.pathId];
        const pts = r.waypoints || r.controlPoints;
        if (pts && pts.length > 0) {
          x = pts[0].x;
          z = pts[0].z;
        }
      }
      if (x === undefined || z === undefined) return;
      const pos = worldToCanvas(x, z, width, height);
      // Anillo exterior pulsante
      ctx.strokeStyle = '#8ef77b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(pos.px, pos.py, 4.5, 0, Math.PI * 2);
      ctx.stroke();

      // Núcleo verde
      ctx.fillStyle = '#8ef77b';
      ctx.beginPath();
      ctx.arc(pos.px, pos.py, 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // 7. Balizas de Salida (Exit Points - Rojo Peligro)
  if (mapData.exitPoints) {
    mapData.exitPoints.forEach(ep => {
      let x = ep.position?.x;
      let z = ep.position?.z;
      if ((x === undefined || z === undefined) && ep.pathId && mapData.routes?.[ep.pathId]) {
        const r = mapData.routes[ep.pathId];
        const pts = r.waypoints || r.controlPoints;
        if (pts && pts.length > 0) {
          const last = pts[pts.length - 1];
          x = last.x;
          z = last.z;
        }
      }
      if (x === undefined || z === undefined) return;
      const pos = worldToCanvas(x, z, width, height);
      // Anillo exterior
      ctx.strokeStyle = '#ff3b16';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(pos.px, pos.py, 4.5, 0, Math.PI * 2);
      ctx.stroke();

      // Núcleo rojo
      ctx.fillStyle = '#ff3b16';
      ctx.beginPath();
      ctx.arc(pos.px, pos.py, 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // 8. Marco perimetral y efecto scanline
  ctx.strokeStyle = '#27382a';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  for (let sy = 0; sy < height; sy += 2) {
    ctx.fillRect(0, sy, width, 1);
  }

  return canvas;
}

/**
 * Devuelve la miniatura del mapa como una DataURL en formato PNG.
 */
export function renderMapThumbnailDataURL(mapData, width = 240, height = 110) {
  const canvas = renderMapThumbnailCanvas(mapData, width, height);
  return canvas.toDataURL('image/png');
}
