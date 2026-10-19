// Límites y reglas de colocación libre de torretas.
// Exports: PLACEMENT.

  // 8. COLOCACIÓN LIBRE DE TORRETAS
  // El jugador apunta al suelo con la cámara y coloca donde quiera dentro de estos límites.
export const PLACEMENT = {
    minPlayerDistance: 1.5,
    maxPlayerDistance: 10.5,
    minPathDistance: 2.5,     // Evita bloquear el paso de los enemigos
    minTurretDistance: 2.2,   // Separación mínima entre torretas
    minCorePadding: 0.8,      // Hueco extra respecto al radio del Núcleo
    maxTurrets: 16,           // Límite de rendimiento y anti-spam
    spawnClearance: 4.0,      // No construir encima de las compuertas
    enemyClearance: 1.8       // No construir encima de un enemigo
  };
