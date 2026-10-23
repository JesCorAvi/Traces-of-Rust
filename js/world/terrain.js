// Relieve de playa compartido entre la malla visual y la física del mundo.
// Exporta: terrainHeightAt, terrainNormalAt, sandTintAt, TERRAIN.

const clamp01 = v => Math.max(0, Math.min(1, v));
const smoothstep = (a, b, v) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export const TERRAIN = Object.freeze({
  size: 520,
  shorelineZ: -58,
  waterY: -0.82,
  seaFloorY: -2.4,
  foamZ: -57.5
});

// Ruido de dunas barato y determinista: suma de ondas de baja y media frecuencia.
function duneField(x, z) {
  const broad = Math.sin(x * 0.041 + Math.sin(z * 0.017) * 1.7) * Math.cos(z * 0.033 + 0.55);
  const cross = Math.sin((x + z * 0.62) * 0.067 + 1.25) * 0.42;
  const wind = Math.sin(x * 0.018 - z * 0.026 + 2.4) * 0.55;
  const ripple = Math.sin(x * 0.37 + z * 0.21) * 0.035
    + Math.sin(x * 0.19 - z * 0.28 + 1.1) * 0.028;
  return broad * 0.82 + cross + wind + ripple;
}

/**
 * Altura del terreno de playa (sin estructuras). Las rutas y los props deben
 * consultar siempre esta función a través de worldPhysics.getGroundHeight().
 */
export function terrainHeightAt(x, z) {
  const radius = Math.hypot(x, z);

  // Pendiente suave desde la orilla hacia la jungla interior.
  const inlandRise = smoothstep(-54, 76, z) * 1.35;

  // Dunas jugables suaves en el centro y cordones más altos en el perímetro.
  // Abrimos la franja norte hacia el mar: así el océano se ve desde el
  // campamento y la orilla funciona como entrada natural de los cangrejos.
  const northFlatten = 0.2 + 0.8 * smoothstep(-48, -29, z);
  const innerDunes = duneField(x, z) * 0.74 * northFlatten;
  // Plataforma costera: mantiene toda la zona jugable por encima de la marea.
  const coastalShelf = smoothstep(-62, -46, z) * 1.28;
  const outerRidge = smoothstep(46, 145, radius);
  const duneRidge = outerRidge * (
    1.55
    + Math.sin(x * 0.028 + z * 0.022) * 0.85
    + Math.sin(x * 0.011 - z * 0.019) * 0.55
  );

  // Cordón de dunas paralelo a la costa, fuera del área de rutas.
  const backDune = smoothstep(28, 58, z) * smoothstep(120, 52, Math.abs(x)) * 0.36;

  // Pie de playa: la arena cae bajo el agua al cruzar la línea de costa.
  const shoreDrop = smoothstep(0, 1, (-z - 54) / 24) * 2.35;
  const wetFlat = smoothstep(-40, -54, z) * 0.32;

  // Dos médanos de referencia cercanos al campamento para que el relieve se
  // lea incluso con la cámara baja del modo tercera persona.
  const campDunes = (
    1.18 * Math.exp(-(((x + 25) ** 2) + ((z - 13) ** 2)) / 190) +
    1.05 * Math.exp(-(((x - 24) ** 2) + ((z + 18) ** 2)) / 230) +
    1.18 * Math.exp(-(((x + 13) ** 2) + ((z + 27) ** 2)) / 160) +
    1.05 * Math.exp(-(((x - 15) ** 2) + ((z + 31) ** 2)) / 180)
  ) * northFlatten;

  let h = coastalShelf + inlandRise + innerDunes + duneRidge + backDune + campDunes - shoreDrop - wetFlat;

  // Mantén plana la plaza de la despensa para que las torretas no queden torcidas.
  const plazaBlend = 1 - smoothstep(4.5, 10.5, radius);
  h = h * (1 - plazaBlend * 0.45);

  return h;
}

export function terrainNormalAt(x, z, eps = 0.4) {
  const hL = terrainHeightAt(x - eps, z);
  const hR = terrainHeightAt(x + eps, z);
  const hD = terrainHeightAt(x, z - eps);
  const hU = terrainHeightAt(x, z + eps);
  return { x: hL - hR, y: eps * 2, z: hD - hU, slope: Math.hypot(hR - hL, hU - hD) / (eps * 2) };
}

/** Tinte de arena: se oscurece y enfría hacia la orilla húmeda. */
export function sandTintAt(x, z, h) {
  const wet = clamp01(smoothstep(-36, -57, z) + smoothstep(0.3, 1.8, h) * 0.12);
  const dune = clamp01(h * 0.12 + 0.5);
  return {
    r: 1.0 * (1 - wet * 0.26) * (0.92 + dune * 0.08),
    g: 0.84 * (1 - wet * 0.18) * (0.9 + dune * 0.1),
    b: 0.62 * (1 - wet * 0.05) * (0.9 + dune * 0.1)
  };
}
