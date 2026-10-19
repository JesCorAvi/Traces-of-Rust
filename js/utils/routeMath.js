// Proyección de puntos sobre segmentos de ruta.
// Exports: projectPointToSegment, distancePointToSegment, closestPointOnRoutes.

export function projectPointToSegment(x, z, a, b) {
  const abx = b.x - a.x;
  const abz = b.z - a.z;
  const lenSq = abx * abx + abz * abz || 1;
  const t = Math.max(0, Math.min(1, ((x - a.x) * abx + (z - a.z) * abz) / lenSq));
  return { t, x: a.x + t * abx, z: a.z + t * abz };
}

export function distancePointToSegment(x, z, a, b) {
  const p = projectPointToSegment(x, z, a, b);
  return Math.hypot(x - p.x, z - p.z);
}

export function closestPointOnRoutes(x, z, routes) {
  let best = null;
  let bestDist = Infinity;
  for (const route of routes) {
    const wps = route.waypoints;
    for (let i = 0; i < wps.length - 1; i++) {
      const p = projectPointToSegment(x, z, wps[i], wps[i + 1]);
      const d = Math.hypot(x - p.x, z - p.z);
      if (d < bestDist) {
        bestDist = d;
        best = p;
      }
    }
  }
  return best ? { x: best.x, z: best.z, dist: bestDist } : null;
}
