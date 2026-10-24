// Configuración del modo Chiringuito, compuesta por dominios.
// Exports: CHIRINGUITO_CONFIG.

import { CAMPAIGN, PHASES, PHASE_TIMERS, SEASONS, WAVE_ECONOMY, buildAfternoonWaves, getSeason, isFinalDay } from './chiringuito/seasons.js';
import { INGREDIENTS, INGREDIENT_IDS, FARM_INGREDIENT_IDS, getIngredient, isFarmIngredient } from './chiringuito/ingredients.js';
import { RECIPES, STARTING_RECIPE_IDS, getRecipe, recipeSteps, getRecipeAvailability } from './chiringuito/recipes.js';
import { FARM, FARM_CROPS, HARVEST_REWARDS, PLANT_REWARDS, getFarmCrop, getHarvestBonus, getHarvestAmount, getPlantYieldBonus } from './chiringuito/farm.js';
import { FISHING, FISH_TYPES, FISH_IDS, getFishType, pickFishType } from './chiringuito/fishing.js';
import { CUSTOMERS, CUSTOMER_ARCHETYPES, getCustomerArchetype } from './chiringuito/customers.js';
import { FURNITURE, FURNITURE_LIST, RESTAURANT_UPGRADES, getFurniture, getRestaurantUpgrade } from './chiringuito/furniture.js';
import { COOKING, QUALITY_TIERS, getQualityTier, getTipForOrder } from './chiringuito/cooking.js';
import { ISLAND } from './chiringuito/island.js';

export const CHIRINGUITO_CONFIG = {
  CAMPAIGN,
  PHASES,
  PHASE_TIMERS,
  SEASONS,
  WAVE_ECONOMY,
  INGREDIENTS,
  INGREDIENT_IDS,
  FARM_INGREDIENT_IDS,
  RECIPES,
  STARTING_RECIPE_IDS,
  FARM,
  FARM_CROPS,
  HARVEST_REWARDS,
  PLANT_REWARDS,
  FISHING,
  FISH_TYPES,
  FISH_IDS,
  CUSTOMERS,
  CUSTOMER_ARCHETYPES,
  FURNITURE,
  FURNITURE_LIST,
  RESTAURANT_UPGRADES,
  COOKING,
  QUALITY_TIERS,
  ISLAND,
  buildAfternoonWaves,
  getSeason,
  isFinalDay,
  getIngredient,
  isFarmIngredient,
  getRecipe,
  recipeSteps,
  getRecipeAvailability,
  getFarmCrop,
  getHarvestBonus,
  getHarvestAmount,
  getPlantYieldBonus,
  getFishType,
  pickFishType,
  getCustomerArchetype,
  getFurniture,
  getRestaurantUpgrade,
  getQualityTier,
  getTipForOrder
};
