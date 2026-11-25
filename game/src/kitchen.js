// Sizzle & Serve — the kitchen state: orders, stations, the plate, the hand.
// One clear job: hold everything that changes during a shift and the rules
// that move it, with no drawing and no input handling in here.

import {
  CHOPS_TO_FINISH,
  GRILL_BURNT_AT,
  GRILL_SECONDS,
  INGREDIENTS,
  MAX_HEARTS,
  MAX_ORDERS,
  RECIPES,
  SHIFT_SECONDS,
  availableRecipes,
  itemKey,
  patienceFor,
  serveScore,
  spawnEverySeconds,
} from './config.js';
import { mulberry32, pick } from './random.js';

export const PHASE_TITLE = 'title';
export const PHASE_PLAYING = 'playing';
export const PHASE_OVER = 'over';

export function createKitchen(seed = 20261125) {
  return {
    seed,
    rng: mulberry32(seed),
    phase: PHASE_TITLE,
    elapsed: 0,
    shiftLeft: SHIFT_SECONDS,
    score: 0,
    coins: 0,
    combo: 0,
    comboLeft: 0,
    hearts: MAX_HEARTS,
    servedCount: 0,
    expiredCount: 0,
    burntCount: 0,
    orders: [],
    nextOrderId: 1,
    spawnIn: 2,
    hand: null, // an item key, or null
    board: null, // { key, chops } — the item being chopped
    grill: [null, null], // each { key, cooked } — cooked seconds on the grill
    plate: [], // item keys, in the order they were added
    particles: [],
    floaters: [],
    message: null, // { text, until } banner text
    lastTickSecond: -1,
    servedFlash: 0,
    stars: 0,
  };
}

export function startShift(kitchen) {
  kitchen.phase = PHASE_PLAYING;
  kitchen.elapsed = 0;
  kitchen.shiftLeft = SHIFT_SECONDS;
  kitchen.score = 0;
  kitchen.coins = 0;
  kitchen.combo = 0;
  kitchen.comboLeft = 0;
  kitchen.hearts = MAX_HEARTS;
  kitchen.servedCount = 0;
  kitchen.expiredCount = 0;
  kitchen.burntCount = 0;
  kitchen.orders = [];
  kitchen.nextOrderId = 1;
  kitchen.spawnIn = 2;
  kitchen.hand = null;
  kitchen.board = null;
  kitchen.grill = [null, null];
  kitchen.plate = [];
  kitchen.particles = [];
  kitchen.floaters = [];
  kitchen.message = { text: 'Shift started — first ticket is in!', until: 3 };
  kitchen.lastTickSecond = -1;
  kitchen.servedFlash = 0;
  kitchen.stars = 0;
  spawnOrder(kitchen);
  // The first ticket is already on the board; the next one waits a full gap.
  kitchen.spawnIn = spawnEverySeconds(0);
}

export function spawnOrder(kitchen) {
  if (kitchen.orders.length >= MAX_ORDERS) return null;
  // Prefer a dish that is not already on the board, so the tickets vary.
  const onBoard = new Set(kitchen.orders.map((o) => o.recipe.id));
  const fresh = availableRecipes(kitchen.elapsed).filter((r) => !onBoard.has(r.id));
  const pool = fresh.length > 0 ? fresh : availableRecipes(kitchen.elapsed);
  const recipe = pick(kitchen.rng, pool);
  const patience = patienceFor(kitchen.elapsed);
  const order = {
    id: kitchen.nextOrderId++,
    recipe,
    patience,
    patienceLeft: patience,
    bornAt: kitchen.elapsed,
  };
  kitchen.orders.push(order);
  return order;
}

export function endShift(kitchen, reason) {
  kitchen.phase = PHASE_OVER;
  kitchen.endReason = reason;
  const served = kitchen.servedCount;
  kitchen.stars = served >= 14 ? 3 : served >= 9 ? 2 : served >= 5 ? 1 : 0;
}

function loseHeart(kitchen, why) {
  kitchen.hearts -= 1;
  kitchen.combo = 0;
  kitchen.comboLeft = 0;
  if (kitchen.hearts <= 0) endShift(kitchen, why);
}

// The clock: spawn tickets, drain patience, end the shift on time.
export function tickKitchen(kitchen, dt) {
  if (kitchen.phase !== PHASE_PLAYING) return;
  kitchen.elapsed += dt;
  kitchen.shiftLeft = Math.max(0, SHIFT_SECONDS - kitchen.elapsed);
  if (kitchen.comboLeft > 0) {
    kitchen.comboLeft -= dt;
    if (kitchen.comboLeft <= 0) kitchen.combo = 0;
  }
  if (kitchen.servedFlash > 0) kitchen.servedFlash -= dt;

  kitchen.spawnIn -= dt;
  if (kitchen.spawnIn <= 0) {
    const made = spawnOrder(kitchen);
    if (made) kitchen.onNewOrder?.(made);
    kitchen.spawnIn = spawnEverySeconds(kitchen.elapsed);
  }

  for (const order of kitchen.orders) order.patienceLeft -= dt;
  const expired = kitchen.orders.filter((o) => o.patienceLeft <= 0);
  if (expired.length > 0) {
    kitchen.orders = kitchen.orders.filter((o) => o.patienceLeft > 0);
    kitchen.expiredCount += expired.length;
    kitchen.onOrderExpired?.(expired[0]);
    loseHeart(kitchen, 'customers walked out');
    if (kitchen.phase !== PHASE_PLAYING) return;
  }

  for (let i = 0; i < kitchen.grill.length; i++) {
    const slot = kitchen.grill[i];
    if (slot) {
      slot.cooked += dt;
      if (slot.cooked / GRILL_SECONDS >= GRILL_BURNT_AT) {
        kitchen.grill[i] = null;
        kitchen.burntCount += 1;
        kitchen.onBurnt?.(i);
      }
    }
  }

  const whole = Math.ceil(kitchen.shiftLeft);
  if (whole <= 10 && whole !== kitchen.lastTickSecond && whole > 0) {
    kitchen.lastTickSecond = whole;
    kitchen.onTick?.(whole);
  }
  if (kitchen.shiftLeft <= 0) endShift(kitchen, 'shift over');
}

// --- The hand ---------------------------------------------------------------

export function grabIngredient(kitchen, ingredient) {
  if (kitchen.hand) return false;
  if (!INGREDIENTS[ingredient]) return false;
  kitchen.hand = itemKey(ingredient, 'none');
  return true;
}

export function trashHand(kitchen) {
  if (!kitchen.hand) return false;
  kitchen.hand = null;
  return true;
}

// --- The chopping board -----------------------------------------------------

export function placeOnBoard(kitchen) {
  if (!kitchen.hand || kitchen.board) return false;
  const [ingredient, prep] = kitchen.hand.split(':');
  if (INGREDIENTS[ingredient].prep !== 'chop' || prep) return false;
  kitchen.board = { key: kitchen.hand, chops: 0 };
  kitchen.hand = null;
  return true;
}

export function chopBoard(kitchen) {
  if (!kitchen.board) return false;
  kitchen.board.chops += 1;
  kitchen.onChop?.(kitchen.board);
  if (kitchen.board.chops >= CHOPS_TO_FINISH) {
    const [ingredient] = kitchen.board.key.split(':');
    kitchen.hand = itemKey(ingredient, 'chopped');
    kitchen.board = null;
    kitchen.onChopDone?.(kitchen.hand);
  }
  return true;
}

export function takeFromBoard(kitchen) {
  if (!kitchen.board || kitchen.hand) return false;
  kitchen.hand = kitchen.board.key;
  kitchen.board = null;
  return true;
}

// --- The grill ---------------------------------------------------------------

export function placeOnGrill(kitchen, slotIndex) {
  if (!kitchen.hand || kitchen.grill[slotIndex]) return false;
  const [ingredient, prep] = kitchen.hand.split(':');
  if (INGREDIENTS[ingredient].prep !== 'grill' || prep) return false;
  kitchen.grill[slotIndex] = { key: kitchen.hand, cooked: 0 };
  kitchen.hand = null;
  return true;
}

export function takeFromGrill(kitchen, slotIndex) {
  const slot = kitchen.grill[slotIndex];
  if (!slot || kitchen.hand) return false;
  kitchen.hand = itemKey('patty', 'grilled');
  kitchen.grill[slotIndex] = null;
  return true;
}

export function grillDoneness(slot) {
  return slot ? slot.cooked / GRILL_SECONDS : 0;
}

// --- The plate ---------------------------------------------------------------

export function addToPlate(kitchen) {
  if (!kitchen.hand || kitchen.plate.length >= 6) return false;
  kitchen.plate.push(kitchen.hand);
  kitchen.hand = null;
  return true;
}

export function takeFromPlate(kitchen) {
  if (kitchen.hand || kitchen.plate.length === 0) return false;
  kitchen.hand = kitchen.plate.pop();
  return true;
}

export function clearPlate(kitchen) {
  if (kitchen.plate.length === 0) return false;
  kitchen.plate = [];
  return true;
}

// --- Serving -----------------------------------------------------------------

function sameMultiset(a, b) {
  if (a.length !== b.length) return false;
  const counts = new Map();
  for (const item of a) counts.set(item, (counts.get(item) ?? 0) + 1);
  for (const item of b) {
    const left = counts.get(item) ?? 0;
    if (left === 0) return false;
    counts.set(item, left - 1);
  }
  return true;
}

export function matchingOrder(kitchen) {
  return kitchen.orders.find((o) => sameMultiset(kitchen.plate, o.recipe.items)) ?? null;
}

export function servePlate(kitchen) {
  const order = matchingOrder(kitchen);
  if (!order) return null;
  kitchen.combo = kitchen.comboLeft > 0 ? kitchen.combo + 1 : 1;
  kitchen.comboLeft = 20;
  const points = serveScore(order.recipe, order.patienceLeft, order.patience, kitchen.combo);
  kitchen.score += points;
  kitchen.coins += Math.max(5, Math.round(points / 12));
  kitchen.servedCount += 1;
  kitchen.orders = kitchen.orders.filter((o) => o.id !== order.id);
  kitchen.plate = [];
  kitchen.servedFlash = 0.6;
  kitchen.onServed?.(order, points);
  return { order, points };
}

// --- Particles and floating text --------------------------------------------

export function addParticles(kitchen, x, y, color, count, spread = 60, up = -90) {
  for (let i = 0; i < count; i++) {
    kitchen.particles.push({
      x: x + (kitchen.rng() - 0.5) * 30,
      y: y + (kitchen.rng() - 0.5) * 10,
      vx: (kitchen.rng() - 0.5) * spread,
      vy: up * (0.5 + kitchen.rng() * 0.8),
      life: 0.5 + kitchen.rng() * 0.5,
      age: 0,
      size: 2 + kitchen.rng() * 4,
      color,
    });
  }
  if (kitchen.particles.length > 300) kitchen.particles.splice(0, kitchen.particles.length - 300);
}

export function addFloater(kitchen, x, y, text, color = '#ffffff') {
  kitchen.floaters.push({ x, y, text, color, age: 0, life: 1.2 });
  if (kitchen.floaters.length > 24) kitchen.floaters.shift();
}

export function tickEffects(kitchen, dt) {
  for (const p of kitchen.particles) {
    p.age += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 60 * dt;
  }
  kitchen.particles = kitchen.particles.filter((p) => p.age < p.life);
  for (const f of kitchen.floaters) {
    f.age += dt;
    f.y -= 42 * dt;
  }
  kitchen.floaters = kitchen.floaters.filter((f) => f.age < f.life);
  if (kitchen.message && kitchen.elapsed > kitchen.message.until) kitchen.message = null;
}
