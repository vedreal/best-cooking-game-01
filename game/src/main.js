// Sizzle & Serve — the game loop and wiring.
// One clear job: own the canvas, the clock and the state machine, and connect
// the kitchen, the renderer, the input and the sounds. No game rule lives here.

import {
  PHASE_OVER,
  PHASE_PLAYING,
  PHASE_TITLE,
  addFloater,
  addParticles,
  createKitchen,
  endShift,
  startShift,
  tickEffects,
  tickKitchen,
} from './kitchen.js';
import { LAYOUT, renderGame } from './render.js';
import { clickAt, keyAction, stationAt } from './input.js';
import { setupShot } from './shots.js';
import {
  ensureAudio,
  isMuted,
  playBurnt,
  playChop,
  playClick,
  playDing,
  playError,
  playGrab,
  playNewOrder,
  playPlace,
  playServe,
  playTick,
  setSizzle,
  toggleMute,
} from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = Number(params.get('seed') || 20261125);

let kitchen;
let shotMode = false;
if (shotName) {
  kitchen = setupShot(shotName, seedParam);
  shotMode = true;
} else {
  kitchen = createKitchen(seedParam);
}

let paused = false;
let time = 0;
let lastNow = performance.now();
// In a screenshot scene the cursor tells the story: over the plate when the
// hand carries the last ingredient, parked out of the way otherwise.
const mouse = shotName === 'cover' ? { x: 934, y: 470 } : { x: 640, y: 584 };
let hover = shotName === 'cover' ? 'plate' : null;

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * 1280,
    y: ((event.clientY - rect.top) / rect.height) * 720,
  };
}

function announce(text) {
  if (statusEl) statusEl.textContent = text;
}

function playSound(name) {
  if (name === 'click') playClick();
  else if (name === 'grab') playGrab();
  else if (name === 'chop') playChop();
  else if (name === 'place') playPlace();
  else if (name === 'ding') playDing();
  else if (name === 'serve') playServe();
  else if (name === 'error') playError();
}

// Kitchen events the loop subscribes to, for sound and feedback.
kitchen.onNewOrder = (order) => {
  playNewOrder();
  kitchen.message = { text: `New ticket: ${order.recipe.name}!`, until: kitchen.elapsed + 3 };
  announce(`New order: ${order.recipe.name}`);
};
kitchen.onOrderExpired = (order) => {
  playError();
  addFloater(kitchen, 640, 200, 'Customer walked out!', '#ff6b5e');
  announce(`Order ${order.recipe.name} expired. A customer walked out.`);
};
kitchen.onBurnt = (slot) => {
  playBurnt();
  const x = 552 + 28 + slot * 118 + 46;
  addParticles(kitchen, x, 430, '#5a4632', 26);
  addFloater(kitchen, x, 400, 'BURNT!', '#ff6b5e');
  announce('A patty burnt on the grill.');
};
kitchen.onChop = () => {
  addParticles(kitchen, 400, 440, '#e23b2e', 8, 50, -60);
};
kitchen.onChopDone = (item) => {
  playDing();
  addFloater(kitchen, 400, 400, 'Chopped!', '#5dbb4a');
  void item;
};
kitchen.onServed = (order, points) => {
  addParticles(kitchen, 1160, 430, '#f7c948', 30);
  addFloater(kitchen, 1160, 380, `+${points}`, '#f7c948');
  kitchen.message = { text: `${order.recipe.name} served! +${points} points`, until: kitchen.elapsed + 3 };
  announce(`${order.recipe.name} served for ${points} points.`);
};
kitchen.onTick = (second) => {
  if (second <= 5) playTick();
};

function startFromTitle() {
  ensureAudio();
  startShift(kitchen);
  announce('Shift started. Cook the orders before their patience runs out.');
}

function restart() {
  kitchen = createKitchen(seedParam);
  wireKitchenEvents();
  startShift(kitchen);
  paused = false;
}

function wireKitchenEvents() {
  kitchen.onNewOrder = (order) => {
    playNewOrder();
    kitchen.message = { text: `New ticket: ${order.recipe.name}!`, until: kitchen.elapsed + 3 };
  };
  kitchen.onOrderExpired = (order) => {
    playError();
    addFloater(kitchen, 640, 200, 'Customer walked out!', '#ff6b5e');
  };
  kitchen.onBurnt = (slot) => {
    playBurnt();
    const x = 552 + 28 + slot * 118 + 46;
    addParticles(kitchen, x, 430, '#5a4632', 26);
    addFloater(kitchen, x, 400, 'BURNT!', '#ff6b5e');
  };
  kitchen.onChop = () => addParticles(kitchen, 400, 440, '#e23b2e', 8, 50, -60);
  kitchen.onChopDone = () => {
    playDing();
    addFloater(kitchen, 400, 400, 'Chopped!', '#5dbb4a');
  };
  kitchen.onServed = (order, points) => {
    addParticles(kitchen, 1160, 430, '#f7c948', 30);
    addFloater(kitchen, 1160, 380, `+${points}`, '#f7c948');
    kitchen.message = { text: `${order.recipe.name} served! +${points} points`, until: kitchen.elapsed + 3 };
  };
  kitchen.onTick = (second) => {
    if (second <= 5) playTick();
  };
}

canvas.addEventListener('pointermove', (event) => {
  const p = canvasPoint(event);
  mouse.x = p.x;
  mouse.y = p.y;
  hover = stationAt(p.x, p.y);
});

canvas.addEventListener('pointerdown', (event) => {
  ensureAudio();
  const p = canvasPoint(event);
  mouse.x = p.x;
  mouse.y = p.y;
  const station = stationAt(p.x, p.y);
  if (station === 'mute') {
    toggleMute();
    playClick();
    return;
  }
  if (station === 'pause') {
    if (kitchen.phase === PHASE_PLAYING) {
      paused = !paused;
      playClick();
    }
    return;
  }
  if (kitchen.phase === PHASE_TITLE) {
    startFromTitle();
    return;
  }
  if (kitchen.phase === PHASE_OVER) return;
  if (paused) return;
  clickAt(kitchen, station, playSound);
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'm' || event.key === 'M') {
    ensureAudio();
    toggleMute();
    return;
  }
  if (event.key === 'p' || event.key === 'P') {
    if (kitchen.phase === PHASE_PLAYING) paused = !paused;
    return;
  }
  if (event.key === 'r' || event.key === 'R') {
    if (kitchen.phase === PHASE_OVER) {
      ensureAudio();
      restart();
    }
    return;
  }
  if (kitchen.phase === PHASE_TITLE && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    startFromTitle();
    return;
  }
  if (kitchen.phase !== PHASE_PLAYING || paused) return;
  if (event.key === ' ') event.preventDefault();
  const action = keyAction(kitchen, event.key);
  if (action) playSound(action);
});

function frame(now) {
  const dt = Math.min(0.05, (now - lastNow) / 1000);
  lastNow = now;
  time += dt;
  if (!shotMode) {
    if (kitchen.phase === PHASE_PLAYING && !paused) {
      tickKitchen(kitchen, dt);
      setSizzle(kitchen.grill.filter(Boolean).length);
    }
    tickEffects(kitchen, dt);
  } else {
    // A screenshot scene is frozen: the clock never moves, but steam and
    // glow still animate so the render is alive.
    tickEffects(kitchen, 0);
  }
  renderGame(ctx, kitchen, mouse, hover, time, paused);
  requestAnimationFrame(frame);
}

// Resize the canvas to its display size while keeping the 1280x720 kitchen.
function fitCanvas() {
  const scale = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
  canvas.style.width = `${Math.floor(1280 * scale)}px`;
  canvas.style.height = `${Math.floor(720 * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

// Exposed for play-tests: the harness and the maker can inspect the state.
window.__kitchen = () => kitchen;
window.__phase = () => kitchen.phase;

requestAnimationFrame(frame);
void LAYOUT;
void endShift;
void PHASE_OVER;
