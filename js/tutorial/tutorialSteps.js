// Pasos del tutorial interactivo del modo Defensa.
// Exports: TUTORIAL_STEPS.

export const TUTORIAL_STEPS = [
  {
    id: 'intro',
    title: 'ADIESTRAMIENTO DE DEFENSA',
    text: 'Tu misión: proteger el NÚCLEO durante 12 oleadas. Los enemigos avanzan por tres rutas industriales. Recoge CHATARRA de los hostiles abatidos, construye torretas y mejóralas para resistir. Pulsa [ESPACIO] para empezar.',
    hint: '[ESPACIO] CONTINUAR'
  },
  {
    id: 'build',
    title: 'PASO 1 · CONSTRUIR',
    text: 'Pulsa [E] para abrir el terminal de torretas y elige CLAVADORA. Después apunta al suelo con la cámara: el anillo verde indica una posición válida y el rojo una bloqueada. Coloca con clic izquierdo o [E].',
    hint: 'Anillo verde junto al núcleo · [E] abre el terminal',
    markers: ['build']
  },
  {
    id: 'upgrade',
    title: 'PASO 2 · MEJORAR',
    text: 'Acércate a tu torreta y pulsa [E]. Tiene 3 rutas de mejora de 4 niveles. Sube CADENCIA al nivel 2 para desbloquear el CAÑÓN GEMELO. Solo una ruta puede superar el nivel 2: elige tu especialización.',
    hint: 'Acércate a la torreta y pulsa [E]',
    markers: ['build']
  },
  {
    id: 'synergy',
    title: 'PASO 3 · SINERGIA',
    text: 'Combina roles. La ESCARCHA ralentiza y agrupa a los hostiles; la BOMBARDA castiga el grupo con daño en área. Construye una de cada cerca de la ruta. Los anillos cian y naranja son solo sugerencias: puedes colocarlas donde prefieras.',
    hint: 'Construye ESCARCHA + BOMBARDA',
    markers: ['cryo', 'mortar']
  },
  {
    id: 'practice',
    title: 'PASO 4 · FUEGO REAL',
    text: 'Una avanzada hostil se aproxima. Observa cómo la Escarcha frena al grupo y la Bombarda lo castiga. Los enemigos abatidos sueltan CHATARRA que vuela hacia ti.',
    hint: 'Defiende el núcleo',
    markers: ['cryo', 'mortar']
  },
  {
    id: 'done',
    title: 'ADIESTRAMIENTO COMPLETADO',
    text: 'Sinergias avanzadas: ESCARCHA (Fractura) + daño de área/incendiario (+40%); CUARTEL (Élite/Juggernaut) + TALLER (Reparación/Escudo); TALLER (Sobrecarga) + CLAVADORA (Tormenta). Vender devuelve el 50%. Pulsa [ESPACIO] para comenzar las oleadas reales.',
    hint: '[ESPACIO] COMENZAR ASALTO'
  }
];
