# Sizzle & Serve

An original cooking game for the make.fun bounty
[**best-cooking-game-20261125-0137**](https://make.fun/competitions/best-cooking-game-20261125-0137)
— "Make the best cooking game". It runs in a desktop browser from static
files, with no network request, played with keyboard and mouse.

## The game

You run a tiny kitchen through a 3-minute shift. Tickets roll in on the
order board — each one names a dish and a patience bar. Grab ingredients
from the pantry, chop them on the board, grill patties on the stove (pull
them off in the green zone or they burn), stack the dish on the plate, and
ring the bell to serve before the customer walks out. Three walk-outs end
the shift early; served dishes build a combo that pays more.

Five original recipes — Sunrise Melt, Garden Crunch, Zest Bowl, Ember Stack
and Smoky Double — unlock as the shift heats up, while tickets arrive faster
and patience runs shorter.

## Play it

```sh
node serve.ts
# then open http://localhost:8080
```

No build step, no dependencies, no network: `game/index.html` and its ES
modules, all art drawn on canvas and all sound synthesized with WebAudio.

## Controls

| Input | Does |
| --- | --- |
| Click a pantry bin (or keys `1`–`6`) | Grab an ingredient |
| Click the chopping board (or `SPACE`) | Chop what is on the board (3 hits) |
| Click a grill slot | Put a patty on / take it off |
| Click the plate | Add the held item / take the last one back |
| Click the serve bell (or `ENTER`) | Serve a finished dish |
| Click the trash (or `T`) | Throw away the held item / clear the plate |
| `B` | Take an unchopped item back off the board |
| `P` / `M` | Pause / mute |
| `R` | Cook again after the shift ends |

## Layout

- `main.ts` — the entry program: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json` with the vendored make.fun library.
- `vendor/makefun-game.ts` — the kit's dossier library, copied unchanged.
- `game/` — the playable game as static files.
  - `index.html` — the page; one canvas, one module script.
  - `src/config.js` — ingredients, recipes, tuning.
  - `src/random.js` — seeded randomness.
  - `src/kitchen.js` — orders, stations, plate, hand, scoring.
  - `src/render.js` — all canvas drawing and the kitchen layout.
  - `src/input.js` — mouse and keyboard handling.
  - `src/audio.js` — synthesized sound effects and music.
  - `src/shots.js` — staged screenshot scenes (frozen mid-service).
  - `src/main.js` — the loop and state machine.
- `screenshots/` — 4 renders of the game's own code, taken in headless
  Chromium: cover (full service), order board, chopping, serving.
- `serve.ts` — a tiny static server for local play-testing.

## Screenshots

The cover is `screenshots/1-cover.jpg`: three tickets on the order board,
a dish mid-assembly on the plate, a patty grilling, a tomato half-chopped,
the shift timer running and a plate nearly ready to serve. The other shots
show the opening tickets, the chopping board at work, and a finished Ember
Stack matched to its ticket at the serve bell.

## License

MIT — see `LICENSE`.
