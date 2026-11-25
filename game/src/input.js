// Sizzle & Serve — mouse and keyboard input.
// One clear job: turn clicks and keys into kitchen actions, and tell the
// renderer which station the cursor is over.

import {
  addToPlate,
  chopBoard,
  clearPlate,
  grabIngredient,
  grillDoneness,
  placeOnBoard,
  placeOnGrill,
  servePlate,
  takeFromBoard,
  takeFromGrill,
  takeFromPlate,
  trashHand,
} from './kitchen.js';
import { GRILL_PERFECT_FROM, GRILL_PERFECT_TO } from './config.js';
import { LAYOUT, PANTRY_ORDER, grillSlotRect, pantryBinRect } from './render.js';

function inside(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

// Which station, if any, sits under the cursor.
export function stationAt(x, y) {
  for (let i = 0; i < PANTRY_ORDER.length; i++) {
    if (inside(x, y, pantryBinRect(i))) return `pantry:${PANTRY_ORDER[i]}`;
  }
  if (inside(x, y, LAYOUT.board)) return 'board';
  for (let i = 0; i < 2; i++) {
    if (inside(x, y, grillSlotRect(i))) return `grill:${i}`;
  }
  if (inside(x, y, LAYOUT.stove)) return 'stove';
  if (inside(x, y, LAYOUT.plate)) return 'plate';
  if (inside(x, y, LAYOUT.serve)) return 'serve';
  if (inside(x, y, LAYOUT.trash)) return 'trash';
  if (inside(x, y, LAYOUT.muteButton)) return 'mute';
  if (inside(x, y, LAYOUT.pauseButton)) return 'pause';
  return null;
}

// A click on a station. Returns a short event name for the sound layer.
export function clickAt(kitchen, station, play) {
  if (!station) return null;
  if (station.startsWith('pantry:')) {
    const ingredient = station.slice('pantry:'.length);
    if (kitchen.hand) {
      play('error');
      return 'error';
    }
    if (grabIngredient(kitchen, ingredient)) {
      play('grab');
      return 'grab';
    }
    return null;
  }
  if (station === 'board') {
    if (kitchen.board) {
      if (chopBoard(kitchen)) {
        play('chop');
        return 'chop';
      }
      return null;
    }
    if (kitchen.hand) {
      if (placeOnBoard(kitchen)) {
        play('place');
        return 'place';
      }
      play('error');
      return 'error';
    }
    return null;
  }
  if (station.startsWith('grill:')) {
    const slot = Number(station.slice('grill:'.length));
    const onGrill = kitchen.grill[slot];
    if (onGrill) {
      if (kitchen.hand) {
        play('error');
        return 'error';
      }
      const done = grillDoneness(onGrill);
      if (takeFromGrill(kitchen, slot)) {
        play(done >= GRILL_PERFECT_FROM && done <= GRILL_PERFECT_TO ? 'ding' : 'grab');
        return 'grill-take';
      }
      return null;
    }
    if (kitchen.hand) {
      if (placeOnGrill(kitchen, slot)) {
        play('place');
        return 'place';
      }
      play('error');
      return 'error';
    }
    return null;
  }
  if (station === 'plate') {
    if (kitchen.hand) {
      if (addToPlate(kitchen)) {
        play('place');
        return 'place';
      }
      play('error');
      return 'error';
    }
    if (takeFromPlate(kitchen)) {
      play('grab');
      return 'grab';
    }
    return null;
  }
  if (station === 'serve') {
    const result = servePlate(kitchen);
    if (result) {
      play('serve');
      return 'serve';
    }
    play('error');
    return 'error';
  }
  if (station === 'trash') {
    if (kitchen.hand && trashHand(kitchen)) {
      play('error');
      return 'trash-hand';
    }
    if (clearPlate(kitchen)) {
      play('error');
      return 'trash-plate';
    }
    return null;
  }
  return null;
}

// Keyboard shortcuts. Returns an action name the main loop handles.
export function keyAction(kitchen, key) {
  const lower = key.toLowerCase();
  if (lower >= '1' && lower <= '6') {
    const ingredient = PANTRY_ORDER[Number(lower) - 1];
    if (!kitchen.hand && grabIngredient(kitchen, ingredient)) return 'grab';
    return 'error';
  }
  if (key === ' ' || lower === 'spacebar') {
    if (kitchen.board && chopBoard(kitchen)) return 'chop';
    if (kitchen.board) return 'chop';
    return null;
  }
  if (lower === 'enter') {
    const result = servePlate(kitchen);
    return result ? 'serve' : 'error';
  }
  if (lower === 't') {
    if (kitchen.hand && trashHand(kitchen)) return 'trash-hand';
    if (clearPlate(kitchen)) return 'trash-plate';
    return null;
  }
  if (lower === 'b') {
    if (takeFromBoard(kitchen)) return 'grab';
    return null;
  }
  return null;
}
