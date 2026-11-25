// Sizzle & Serve — staged scenes for the entry's screenshots.
// One clear job: build a fixed, readable moment of real gameplay for each
// screenshot name, using the same state the game itself plays with. The
// screenshots are real renders of the game's own code, frozen mid-service.

import { RECIPES } from './config.js';
import { createKitchen, startShift } from './kitchen.js';

function order(id, recipeId, patienceLeft, patience) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  return { id, recipe, patience, patienceLeft, bornAt: 0 };
}

// Every shot returns a kitchen in the middle of a shift, with its clock
// frozen so the screenshot is the same on every run.
export function setupShot(name, seed = 20261125) {
  const kitchen = createKitchen(seed);
  startShift(kitchen);
  kitchen.phase = 'playing';

  if (name === 'cover') {
    // The full service at a glance: three tickets, a dish mid-assembly,
    // a patty on the grill, a tomato half-chopped, and a plate to serve.
    kitchen.elapsed = 46;
    kitchen.shiftLeft = 134;
    kitchen.score = 1250;
    kitchen.coins = 86;
    kitchen.combo = 3;
    kitchen.comboLeft = 12;
    kitchen.servedCount = 6;
    kitchen.orders = [
      order(7, 'ember-stack', 31, 48),
      order(8, 'garden-crunch', 22, 48),
      order(9, 'sunrise-melt', 41, 55),
    ];
    kitchen.board = { key: 'tomato', chops: 2 };
    kitchen.grill = [{ key: 'patty', cooked: 8.4 }, null];
    kitchen.plate = ['bun', 'patty:grilled', 'cheese', 'tomato:chopped'];
    kitchen.hand = 'lettuce:chopped';
    kitchen.message = { text: 'Order #7 is nearly ready — ring the bell!', until: 9999 };
    return kitchen;
  }

  if (name === 'orders') {
    // The shift just opened: the board fills, the pantry is full, the
    // counter is clean and the first tickets are in.
    kitchen.elapsed = 8;
    kitchen.shiftLeft = 172;
    kitchen.score = 0;
    kitchen.coins = 0;
    kitchen.orders = [
      order(1, 'sunrise-melt', 48, 55),
      order(2, 'garden-crunch', 52, 55),
    ];
    kitchen.message = { text: 'First tickets are in — grab an ingredient!', until: 9999 };
    return kitchen;
  }

  if (name === 'chop') {
    // Hands-on prep: a tomato two chops in, a patty sizzling, tickets waiting.
    kitchen.elapsed = 29;
    kitchen.shiftLeft = 151;
    kitchen.score = 340;
    kitchen.coins = 28;
    kitchen.combo = 2;
    kitchen.comboLeft = 9;
    kitchen.servedCount = 2;
    kitchen.orders = [
      order(4, 'garden-crunch', 26, 48),
      order(5, 'ember-stack', 44, 48),
    ];
    kitchen.board = { key: 'tomato', chops: 2 };
    kitchen.grill = [null, { key: 'patty', cooked: 5.2 }];
    kitchen.plate = ['lettuce:chopped'];
    kitchen.message = { text: 'Chop! Chop! One more hit finishes the tomato.', until: 9999 };
    return kitchen;
  }

  if (name === 'serve') {
    // The payoff: a finished Ember Stack on the plate, its ticket matched,
    // the bell glowing green and ready to ring.
    kitchen.elapsed = 73;
    kitchen.shiftLeft = 107;
    kitchen.score = 980;
    kitchen.coins = 64;
    kitchen.combo = 2;
    kitchen.comboLeft = 14;
    kitchen.servedCount = 5;
    kitchen.orders = [
      order(11, 'ember-stack', 19, 48),
      order(12, 'zest-bowl', 33, 48),
    ];
    kitchen.plate = ['bun', 'patty:grilled', 'cheese', 'tomato:chopped', 'lettuce:chopped'];
    kitchen.message = { text: 'Ember Stack complete — ring the bell to serve!', until: 9999 };
    return kitchen;
  }

  return kitchen;
}

export const SHOT_NAMES = ['cover', 'orders', 'chop', 'serve'];
