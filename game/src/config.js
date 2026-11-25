// Sizzle & Serve — configuration: the kitchen's ingredients, recipes and tuning.
// One clear job: every number and name the rest of the game reads lives here,
// so balancing the game means editing this file and nothing else.

export const VIEW_W = 1280;
export const VIEW_H = 720;

// A shift lasts three minutes of service.
export const SHIFT_SECONDS = 180;
export const MAX_HEARTS = 3;
export const MAX_ORDERS = 3;
export const COMBO_WINDOW_SECONDS = 20;

// An ingredient knows how it is prepared and what it looks like.
export const INGREDIENTS = {
  bun:     { name: 'Bun',     prep: 'none',  color: '#e8a94e', dark: '#b97a26', price: 10 },
  patty:   { name: 'Patty',   prep: 'grill', color: '#8a5a33', dark: '#5d3a1e', price: 30 },
  cheese:  { name: 'Cheese',  prep: 'none',  color: '#f7c948', dark: '#d9a41f', price: 15 },
  tomato:  { name: 'Tomato',  prep: 'chop',  color: '#e23b2e', dark: '#a81f16', price: 15 },
  lettuce: { name: 'Lettuce', prep: 'chop',  color: '#5dbb4a', dark: '#35822a', price: 15 },
  onion:   { name: 'Onion',   prep: 'chop',  color: '#c98fd6', dark: '#8e5a9e', price: 15 },
};

// A prepared item is an ingredient plus the step that finished it.
export function itemKey(ingredient, prep) {
  return prep === 'none' ? ingredient : `${ingredient}:${prep}`;
}
export function itemLabel(key) {
  const [ingredient, prep] = key.split(':');
  const base = INGREDIENTS[ingredient].name;
  if (prep === 'chopped') return `Chopped ${base}`;
  if (prep === 'grilled') return `Grilled ${base}`;
  return base;
}

// Recipes: the dishes the order board asks for. A recipe is a multiset of
// prepared items, so the plate matches in any order.
export const RECIPES = [
  {
    id: 'sunrise-melt',
    name: 'Sunrise Melt',
    items: ['bun', 'cheese', 'tomato:chopped'],
    baseScore: 100,
    color: '#f7b731',
    blurb: 'A quick golden melt for the morning crowd.',
  },
  {
    id: 'garden-crunch',
    name: 'Garden Crunch',
    items: ['tomato:chopped', 'lettuce:chopped', 'onion:chopped', 'cheese'],
    baseScore: 130,
    color: '#6ab04c',
    blurb: 'Crisp, fresh, and gone in a flash.',
  },
  {
    id: 'zest-bowl',
    name: 'Zest Bowl',
    items: ['tomato:chopped', 'onion:chopped', 'cheese', 'lettuce:chopped'],
    baseScore: 140,
    color: '#e77f67',
    blurb: 'Bright and sharp — the lunch-rush favourite.',
  },
  {
    id: 'ember-stack',
    name: 'Ember Stack',
    items: ['bun', 'patty:grilled', 'cheese', 'tomato:chopped', 'lettuce:chopped'],
    baseScore: 180,
    color: '#e15f41',
    blurb: 'The house stack. Tall, hot, and worth the wait.',
  },
  {
    id: 'smoky-double',
    name: 'Smoky Double',
    items: ['bun', 'patty:grilled', 'patty:grilled', 'cheese', 'onion:chopped'],
    baseScore: 220,
    color: '#786fa6',
    blurb: 'Two patties, one very hungry customer.',
  },
];

// How long an order waits before the customer walks out, by shift minute.
export function patienceFor(elapsedSeconds) {
  if (elapsedSeconds < 60) return 55;
  if (elapsedSeconds < 120) return 48;
  return 42;
}

// How often a new ticket appears, by shift minute.
export function spawnEverySeconds(elapsedSeconds) {
  if (elapsedSeconds < 60) return 17;
  if (elapsedSeconds < 120) return 14;
  return 11;
}

// Recipes unlock as the shift heats up: early tickets stay simple.
export function availableRecipes(elapsedSeconds) {
  if (elapsedSeconds < 45) return RECIPES.slice(0, 2);
  if (elapsedSeconds < 100) return RECIPES.slice(0, 4);
  return RECIPES;
}

// Chopping takes three good hits; a patty grills in about twelve seconds.
export const CHOPS_TO_FINISH = 3;
export const GRILL_SECONDS = 12;
export const GRILL_PERFECT_FROM = 0.55; // doneness fraction: the green zone
export const GRILL_PERFECT_TO = 0.92;
export const GRILL_BURNT_AT = 1.15;

// Scoring: base plus what is left of the customer's patience, times the combo.
export function serveScore(recipe, patienceLeft, patienceTotal, combo) {
  const patienceBonus = Math.round(60 * (patienceLeft / patienceTotal));
  return (recipe.baseScore + patienceBonus) * combo;
}
