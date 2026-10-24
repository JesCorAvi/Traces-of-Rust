// Ingredientes del chiringuito, procedencia y presentación.
// Exports: INGREDIENTS, INGREDIENT_IDS, getIngredient, isFarmIngredient.

export const INGREDIENTS = {
  crab: {
    id: 'crab',
    name: 'Carne de cangrejo',
    shortName: 'Cangrejo',
    source: 'crabs',
    color: '#ff7b5c',
    icon: 'ingredient_crab',
    unit: 'porciones'
  },
  fish: {
    id: 'fish',
    name: 'Pescado fresco',
    shortName: 'Pescado',
    source: 'fishing',
    color: '#7fc7d9',
    icon: 'ingredient_fish',
    unit: 'piezas'
  },
  coconut: {
    id: 'coconut',
    name: 'Coco',
    shortName: 'Coco',
    source: 'farm',
    color: '#b98b5c',
    icon: 'ingredient_coconut',
    unit: 'unidades'
  },
  pineapple: {
    id: 'pineapple',
    name: 'Piña',
    shortName: 'Piña',
    source: 'farm',
    color: '#f4c542',
    icon: 'ingredient_pineapple',
    unit: 'unidades'
  },
  rice: {
    id: 'rice',
    name: 'Arroz',
    shortName: 'Arroz',
    source: 'farm',
    color: '#e8dfc2',
    icon: 'ingredient_rice',
    unit: 'unidades'
  },
  lime: {
    id: 'lime',
    name: 'Lima',
    shortName: 'Lima',
    source: 'farm',
    color: '#8ede63',
    icon: 'ingredient_lime',
    unit: 'unidades'
  },
  tomato: {
    id: 'tomato',
    name: 'Tomate',
    shortName: 'Tomate',
    source: 'farm',
    color: '#e14b38',
    icon: 'ingredient_tomato',
    unit: 'unidades'
  },
  chili: {
    id: 'chili',
    name: 'Chile',
    shortName: 'Chile',
    source: 'farm',
    color: '#d83a2a',
    icon: 'ingredient_chili',
    unit: 'unidades'
  },
  onion: {
    id: 'onion',
    name: 'Cebolla',
    shortName: 'Cebolla',
    source: 'farm',
    color: '#d7b9d8',
    icon: 'ingredient_onion',
    unit: 'unidades'
  },
  mango: {
    id: 'mango',
    name: 'Mango',
    shortName: 'Mango',
    source: 'farm',
    color: '#f0a33c',
    icon: 'ingredient_mango',
    unit: 'unidades'
  }
};

export const INGREDIENT_IDS = Object.keys(INGREDIENTS);

export const FARM_INGREDIENT_IDS = INGREDIENT_IDS.filter(
  id => INGREDIENTS[id].source === 'farm'
);

export function getIngredient(id) {
  return INGREDIENTS[id] || null;
}

export function isFarmIngredient(id) {
  return INGREDIENTS[id]?.source === 'farm';
}
