// Pasos del tutorial interactivo del modo Defensa.
// Exports: TUTORIAL_STEPS.

import { t } from '../core/i18n.js';
const _t = (k, fb) => (typeof t === 'function' ? t(k) : fb);

export const TUTORIAL_STEPS = [
  {
    id: 'intro',
    get title() { return _t('tutorial.step.intro.title', 'ADIESTRAMIENTO DE DEFENSA'); },
    get text() { return _t('tutorial.step.intro.text', 'Tu misión: proteger el NÚCLEO durante 12 oleadas. Los enemigos avanzan por tres rutas industriales. Recoge CHATARRA de los hostiles abatidos, construye torretas y mejóralas para resistir. Pulsa [ESPACIO] para empezar.'); },
    get hint() { return _t('tutorial.step.intro.hint', '[ESPACIO] CONTINUAR'); }
  },
  {
    id: 'build',
    get title() { return _t('tutorial.step.build.title', 'PASO 1 · CONSTRUIR'); },
    get text() { return _t('tutorial.step.build.text', 'Pulsa [E] para abrir el terminal de torretas y elige CLAVADORA. Después apunta al suelo con la cámara: el anillo verde indica una posición válida y el rojo una bloqueada. Coloca con clic izquierdo o [E].'); },
    get hint() { return _t('tutorial.step.build.hint', 'Anillo verde junto al núcleo · [E] abre el terminal'); },
    markers: ['build']
  },
  {
    id: 'upgrade',
    get title() { return _t('tutorial.step.upgrade.title', 'PASO 2 · MEJORAR'); },
    get text() { return _t('tutorial.step.upgrade.text', 'Acércate a tu torreta y pulsa [E]. Tiene 3 rutas de mejora de 4 niveles. Sube CADENCIA al nivel 2 para desbloquear el CAÑÓN GEMELO. Solo una ruta puede superar el nivel 2: elige tu especialización.'); },
    get hint() { return _t('tutorial.step.upgrade.hint', 'Acércate a la torreta y pulsa [E]'); },
    markers: ['build']
  },
  {
    id: 'synergy',
    get title() { return _t('tutorial.step.synergy.title', 'PASO 3 · SINERGIA'); },
    get text() { return _t('tutorial.step.synergy.text', 'Combina roles. La ESCARCHA ralentiza y agrupa a los hostiles; la BOMBARDA castiga el grupo con daño en área. Construye una de cada cerca de la ruta. Los anillos cian y naranja son solo sugerencias: puedes colocarlas donde prefieras.'); },
    get hint() { return _t('tutorial.step.synergy.hint', 'Construye ESCARCHA + BOMBARDA'); },
    markers: ['cryo', 'mortar']
  },
  {
    id: 'practice',
    get title() { return _t('tutorial.step.practice.title', 'PASO 4 · FUEGO REAL'); },
    get text() { return _t('tutorial.step.practice.text', 'Una avanzada hostil se aproxima. Observa cómo la Escarcha frena al grupo y la Bombarda lo castiga. Los enemigos abatidos sueltan CHATARRA que vuela hacia ti.'); },
    get hint() { return _t('tutorial.step.practice.hint', 'Defiende el núcleo'); },
    markers: ['cryo', 'mortar']
  },
  {
    id: 'done',
    get title() { return _t('tutorial.step.done.title', 'ADIESTRAMIENTO COMPLETADO'); },
    get text() { return _t('tutorial.step.done.text', 'Sinergias avanzadas: ESCARCHA (Fractura) + daño de área/incendiario (+40%); CUARTEL (Élite/Juggernaut) + TALLER (Reparación/Escudo); TALLER (Sobrecarga) + CLAVADORA (Tormenta). Vender devuelve el 50%. Pulsa [ESPACIO] para comenzar las oleadas reales.'); },
    get hint() { return _t('tutorial.step.done.hint', '[ESPACIO] COMENZAR ASALTO'); }
  }
];
