// Recetario del chiringuito. Los pasos del minijuego son data-driven.
// Exports: RECIPES, STARTING_RECIPE_IDS, getRecipe, getRecipeAvailability, recipeSteps.

export const STARTING_RECIPE_IDS = [
  'crab_skillet',
  'crab_bites',
  'crab_rice',
  'crab_ceviche',
  'crab_tacos',
  'pineapple_skewer',
  'island_salad',
  'tropical_coconut',
  'grilled_fish'
];

export const RECIPES = {
  // Platos de emergencia: solo necesitan cangrejo para que la noche nunca se
  // quede sin carta cuando aún no hay cosecha.
  crab_skillet: {
    id: 'crab_skillet',
    name: 'Cangrejo a la sartén',
    description: 'Cangrejo recién desmigado, sal de mar y un golpe de brasa. Sin huerto, sin excusas.',
    price: 9,
    unlockCost: 0,
    starting: true,
    color: 0xe9875a,
    ingredients: { crab: 1 },
    steps: {
      chop: { cuts: 2, speed: 0.68, zoneWidth: 0.32, label: 'DESMIGAR EL CANGREJO' },
      cook: { duration: 2.8, targetMin: 0.44, targetMax: 0.74, heatRate: 0.86, coolRate: 0.48, label: 'DORAR EN LA SARTÉN' },
      plate: { order: ['crab'], label: 'EMPLATAR EL CANGREJO' }
    }
  },

  crab_bites: {
    id: 'crab_bites',
    name: 'Bocaditos de cangrejo',
    description: 'Dos bocados de cangrejo a la plancha con sal de mar. El aperitivo de la casa.',
    price: 14,
    unlockCost: 0,
    starting: true,
    color: 0xd9754f,
    ingredients: { crab: 2 },
    steps: {
      chop: { cuts: 3, speed: 0.78, zoneWidth: 0.27, label: 'SEPARAR LOS BOCADOS' },
      cook: { duration: 3.2, targetMin: 0.46, targetMax: 0.76, heatRate: 0.8, coolRate: 0.44, label: 'MARCAR LA PLANCHA' },
      plate: { order: ['crab', 'crab'], label: 'MONTAR LOS BOCADITOS' }
    }
  },

  crab_rice: {
    id: 'crab_rice',
    name: 'Arroz de cangrejo',
    description: 'Arroz isleño salteado con cangrejo, lima y un golpe de chile.',
    price: 18,
    unlockCost: 0,
    starting: true,
    color: 0xf2d28b,
    ingredients: { crab: 1, rice: 1, lime: 1, chili: 1 },
    steps: {
      chop: { cuts: 3, speed: 0.76, zoneWidth: 0.24, label: 'PICAR EL CHILE Y LA LIMA' },
      cook: { duration: 4.2, targetMin: 0.42, targetMax: 0.72, heatRate: 0.72, coolRate: 0.44, label: 'SALTAR EL ARROZ' },
      plate: { order: ['rice', 'crab', 'lime', 'chili'], label: 'EMPLATAR EL ARROZ' }
    }
  },

  crab_ceviche: {
    id: 'crab_ceviche',
    name: 'Ceviche de cangrejo',
    description: 'Cangrejo fresco marinado en lima con cebolla y mango.',
    price: 22,
    unlockCost: 0,
    starting: true,
    color: 0xf6c6a0,
    ingredients: { crab: 1, lime: 1, onion: 1, mango: 1 },
    steps: {
      chop: { cuts: 4, speed: 0.88, zoneWidth: 0.21, label: 'PICAR CEBOLLA Y MANGO' },
      cook: { duration: 3.2, targetMin: 0.18, targetMax: 0.42, heatRate: 0.62, coolRate: 0.52, label: 'MARCAR EL CANGREJO' },
      plate: { order: ['crab', 'onion', 'mango', 'lime'], label: 'MONTAR EL CEVICHE' }
    }
  },

  crab_tacos: {
    id: 'crab_tacos',
    name: 'Tacos de cangrejo',
    description: 'Tortillas de maíz con cangrejo, tomate, cebolla y chile.',
    price: 20,
    unlockCost: 0,
    starting: true,
    color: 0xe6a25e,
    ingredients: { crab: 1, tomato: 1, chili: 1, onion: 1 },
    steps: {
      chop: { cuts: 3, speed: 0.92, zoneWidth: 0.23, label: 'PICAR EL RELLENO' },
      cook: { duration: 3.8, targetMin: 0.48, targetMax: 0.78, heatRate: 0.8, coolRate: 0.4, label: 'CALENTAR LA PLANCHA' },
      plate: { order: ['tomato', 'crab', 'onion', 'chili'], label: 'MONTA LOS TACOS' }
    }
  },

  pineapple_skewer: {
    id: 'pineapple_skewer',
    name: 'Brocheta de piña y cangrejo',
    description: 'Brocheta dulce y salada con piña caramelizada y chile.',
    price: 16,
    unlockCost: 0,
    starting: true,
    color: 0xf0bd55,
    ingredients: { crab: 1, pineapple: 1, chili: 1 },
    steps: {
      chop: { cuts: 3, speed: 0.82, zoneWidth: 0.26, label: 'TROCEAR LA PIÑA' },
      cook: { duration: 3.6, targetMin: 0.52, targetMax: 0.84, heatRate: 0.76, coolRate: 0.38, label: 'CARAMELIZAR' },
      plate: { order: ['pineapple', 'crab', 'chili'], label: 'ENSARTAR LA BROCHETA' }
    }
  },

  coconut_soup: {
    id: 'coconut_soup',
    name: 'Sopa de coco',
    description: 'Sopa cremosa de coco con arroz y carne de cangrejo.',
    price: 24,
    unlockCost: 40,
    starting: false,
    color: 0xf1e6cb,
    ingredients: { crab: 1, coconut: 1, rice: 1 },
    steps: {
      chop: { cuts: 2, speed: 0.7, zoneWidth: 0.28, label: 'ABRIR EL COCO' },
      cook: { duration: 4.8, targetMin: 0.36, targetMax: 0.64, heatRate: 0.58, coolRate: 0.32, label: 'COCINAR A FUEGO LENTO' },
      plate: { order: ['coconut', 'rice', 'crab'], label: 'SERVIR LA SOPA' }
    }
  },

  coconut_crab: {
    id: 'coconut_crab',
    name: 'Cangrejo al coco',
    description: 'Cangrejo entero bañado en salsa de coco, arroz y picante.',
    price: 30,
    unlockCost: 70,
    starting: false,
    color: 0xd88b58,
    ingredients: { crab: 2, coconut: 1, rice: 1, chili: 1 },
    steps: {
      chop: { cuts: 4, speed: 1.0, zoneWidth: 0.19, label: 'PREPARAR EL ALIÑO' },
      cook: { duration: 5.4, targetMin: 0.46, targetMax: 0.7, heatRate: 0.7, coolRate: 0.34, label: 'GLASEAR EL CANGREJO' },
      plate: { order: ['rice', 'coconut', 'crab', 'chili'], label: 'EMPLATAR EL CANGREJO' }
    }
  },

  island_salad: {
    id: 'island_salad',
    name: 'Ensalada isleña',
    description: 'Fresca, cítrica y sin cangrejo. El descanso del chef.',
    price: 14,
    unlockCost: 0,
    starting: true,
    color: 0x9fd07c,
    ingredients: { mango: 1, tomato: 1, onion: 1, lime: 1 },
    steps: {
      chop: { cuts: 4, speed: 0.9, zoneWidth: 0.25, label: 'CORTAR LA ENSALADA' },
      cook: { duration: 2.6, targetMin: 0.12, targetMax: 0.3, heatRate: 0.55, coolRate: 0.6, label: 'TEMPLAR LA LIMA' },
      plate: { order: ['mango', 'tomato', 'onion', 'lime'], label: 'ALIÑAR Y SERVIR' }
    }
  },

  grilled_fish: {
    id: 'grilled_fish',
    name: 'Pescado a la brasa',
    description: 'Pescado fresco de la laguna con lima, chile y un toque de brasa.',
    price: 19,
    unlockCost: 0,
    starting: true,
    color: 0xc8d4cf,
    ingredients: { fish: 1, lime: 1, chili: 1 },
    steps: {
      chop: { cuts: 3, speed: 0.82, zoneWidth: 0.25, label: 'LIMPIAR EL PESCADO' },
      cook: { duration: 4.0, targetMin: 0.44, targetMax: 0.74, heatRate: 0.72, coolRate: 0.4, label: 'MARCAR LA BRASA' },
      plate: { order: ['fish', 'lime', 'chili'], label: 'EMPLATAR EL PESCADO' }
    }
  },

  fish_tacos: {
    id: 'fish_tacos',
    name: 'Tacos de pesca',
    description: 'Tacos de pescado con tomate, cebolla y chile. La otra mitad del menú.',
    price: 23,
    unlockCost: 45,
    starting: false,
    color: 0xdca66b,
    ingredients: { fish: 1, tomato: 1, onion: 1, chili: 1 },
    steps: {
      chop: { cuts: 4, speed: 0.9, zoneWidth: 0.22, label: 'PICAR EL PESCADO Y LA CEBOLLA' },
      cook: { duration: 4.4, targetMin: 0.48, targetMax: 0.78, heatRate: 0.78, coolRate: 0.42, label: 'SELLAR EL PESCADO' },
      plate: { order: ['fish', 'tomato', 'onion', 'chili'], label: 'MONTAR LOS TACOS' }
    }
  },

  tropical_coconut: {
    id: 'tropical_coconut',
    name: 'Coco tropical',
    description: 'Bebida helada de coco, piña y lima para la sobremesa.',
    price: 10,
    unlockCost: 0,
    starting: true,
    color: 0xf7dfaa,
    ingredients: { coconut: 1, pineapple: 1, lime: 1 },
    steps: {
      chop: { cuts: 2, speed: 0.8, zoneWidth: 0.3, label: 'TROCEAR LA FRUTA' },
      cook: { duration: 2.4, targetMin: 0.2, targetMax: 0.46, heatRate: 0.5, coolRate: 0.7, label: 'ENFRIAR LA MEZCLA' },
      plate: { order: ['coconut', 'pineapple', 'lime'], label: 'DECORAR LA BEBIDA' }
    }
  }
};

export function getRecipe(id) {
  return RECIPES[id] || null;
}

export function recipeSteps(recipe) {
  return [recipe.steps.chop, recipe.steps.cook, recipe.steps.plate];
}

export function getRecipeAvailability(recipe, stock) {
  if (!recipe) return { available: false, missing: [] };
  const missing = [];
  for (const [id, need] of Object.entries(recipe.ingredients)) {
    const have = Number(stock?.[id] || 0);
    if (have < need) missing.push({ id, need, have, missing: need - have });
  }
  return { available: missing.length === 0, missing };
}
