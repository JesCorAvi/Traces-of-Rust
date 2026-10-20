// Rutas de enemigos y perfiles de targeting por tipo.
// Exports: PATHS, TARGETING.

  // 4. CAMINOS DE ENEMIGOS (Aprovechan plataformas elevadas, escalones, rampas y diques de world.js)
export const PATHS = {
    waypointReachRadius: 1.85,
    corridorClearanceRadius: 2.8, // Evita que cajas aleatorias bloqueen los caminos
    stuckTimeoutSec: 2.4,
    stuckMinProgressDist: 0.45,
    maxFallY: -2.0,

    ROUTES: {
      // Ruta Norte: Nace en z=-42, sube los escalones de la plataforma Norte (z=-20, y=2.0m),
      // la cruza por arriba, baja por la rampa sur (z=-12 a -9) y entra al Núcleo.
      path_north: {
        id: 'path_north',
        name: 'Vía Elevada Norte',
        color: 0xd95326,
        waypoints: [
          { x: 0, y: 0.0, z: -42.0 },
          { x: 0, y: 0.0, z: -31.0 },
          { x: 0, y: 1.2, z: -26.5 },
          { x: 0, y: 2.0, z: -21.0 },
          { x: 0, y: 2.0, z: -15.5 },
          { x: 0, y: 0.9, z: -12.0 },
          { x: 0, y: 0.0, z: -7.5 },
          { x: 0, y: 0.0, z: 0.0 }
        ]
      },

      // Ruta Este: Nace en (42, 24), sube por la rampa sur de la plataforma Este (x=24, z=10, y=2.2m),
      // baja por los escalones norte y bordea el dique Este hacia el Núcleo.
      path_east: {
        id: 'path_east',
        name: 'Pasarela Industrial Este',
        color: 0xc42020,
        waypoints: [
          { x: 42.0, y: 0.0, z: 24.0 },
          { x: 24.0, y: 0.0, z: 23.5 },
          { x: 24.0, y: 1.2, z: 19.5 },
          { x: 24.0, y: 2.2, z: 12.0 },
          { x: 24.0, y: 2.2, z: 4.0 },
          { x: 24.0, y: 0.8, z: -0.5 },
          { x: 24.0, y: 0.0, z: -4.5 },
          { x: 11.5, y: 0.0, z: -2.0 },
          { x: 0.0,  y: 0.0, z: 0.0 }
        ]
      },

      // Ruta Oeste: Nace en (-42, 24), sube la rampa de la plataforma Oeste (x=-24, z=12, y=1.8m),
      // desciende por los escalones norte y avanza por el pasillo central oeste hasta el Núcleo.
      path_west: {
        id: 'path_west',
        name: 'Canal de Drenaje Oeste',
        color: 0xb89c46,
        waypoints: [
          { x: -42.0, y: 0.0, z: 24.0 },
          { x: -24.0, y: 0.0, z: 24.0 },
          { x: -24.0, y: 1.0, z: 20.5 },
          { x: -24.0, y: 1.8, z: 13.0 },
          { x: -24.0, y: 1.8, z: 6.5 },
          { x: -24.0, y: 0.7, z: 2.5 },
          { x: -24.0, y: 0.0, z: -2.0 },
          { x: -11.5, y: 0.0, z: -1.5 },
          { x: 0.0,   y: 0.0, z: 0.0 }
        ]
      }
    }
  };

  // 5. LÓGICA DE OBJETIVO E IA POR TIPO DE ENEMIGO (Núcleo vs Jugador vs Estructuras futuras)
  // Regla de abandono cuando ya ataca el núcleo: una vez el enemigo está golpeando el Núcleo,
  // ignora al jugador salvo que el jugador se pegue a menos de `coreOverrideRadius` metros.
export const TARGETING = {
    PRIORITIES: {
      CORE: 1,
      DEFENSIVE_STRUCTURE: 2, // Preparado para futuras torres
      PLAYER: 3
    },

    BY_ENEMY_TYPE: {
      // Zombie: equilibrado; persigue al jugador si se acerca a distancia media
      zombie: {
        coreDamage: 16,
        coreAttackInterval: 1.15,
        detectRadius: 8.5,
        abandonRadius: 13.5,
        coreOverrideRadius: 2.8,
        reactionTime: 0.35,
        aggroScareCooldown: 4.5
      },
      // Weeper (El Observador): cazador agresivo con el jugador, gran radio de detección
      weeper: {
        coreDamage: 24,
        coreAttackInterval: 1.0,
        detectRadius: 15.0,
        abandonRadius: 21.0,
        coreOverrideRadius: 5.2,
        reactionTime: 0.22,
        aggroScareCooldown: 3.5
      },
      // Worm (Gusano de Escoria): asediador obstinado; casi ignora al jugador y va directo al núcleo
      worm: {
        coreDamage: 30,
        coreAttackInterval: 1.25,
        detectRadius: 4.2,
        abandonRadius: 7.0,
        coreOverrideRadius: 1.8,
        reactionTime: 0.55,
        aggroScareCooldown: 6.0
      },
      // Bosses: enormes amenazas para el núcleo; atacan al jugador si les corta el paso
      boss: {
        coreDamage: 85,
        coreAttackInterval: 1.35,
        detectRadius: 10.5,
        abandonRadius: 16.0,
        coreOverrideRadius: 3.6,
        reactionTime: 0.4,
        aggroScareCooldown: 5.0
      }
    }
  };
