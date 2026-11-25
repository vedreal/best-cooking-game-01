// Sizzle & Serve — everything the player sees, drawn on one canvas.
// One clear job: turn the kitchen state into a readable, warm picture.
// All art is drawn in code; the game loads no image files at all.

// Layout of the kitchen, shared with input.js for hit-testing.
export const LAYOUT = {
  tickets: { x: 248, y: 10, w: 218, h: 84, gap: 12 },
  pantry: { x: 28, y: 150, w: 104, h: 96, cols: 2, gap: 10 },
  board: { x: 284, y: 330, w: 232, h: 226 },
  stove: { x: 552, y: 330, w: 248, h: 226 },
  plate: { x: 836, y: 330, w: 196, h: 226 },
  serve: { x: 1068, y: 330, w: 184, h: 226 },
  trash: { x: 1216, y: 576, w: 44, h: 48 },
  hand: { x: 28, y: 636, w: 250, h: 66 },
  muteButton: { x: 1150, y: 636, w: 52, h: 40 },
  pauseButton: { x: 1210, y: 636, w: 52, h: 40 },
};

const PANTRY_ORDER = ['tomato', 'lettuce', 'onion', 'bun', 'patty', 'cheese'];
const PANTRY_KEYS = ['1', '2', '3', '4', '5', '6'];

export function pantryBinRect(index) {
  const { x, y, w, h, cols, gap } = LAYOUT.pantry;
  const col = index % cols;
  const row = Math.floor(index / cols);
  return { x: x + col * (w + gap), y: y + row * (h + gap), w, h };
}

export function grillSlotRect(index) {
  const { x, y } = LAYOUT.stove;
  return { x: x + 28 + index * 118, y: y + 78, w: 92, h: 92 };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = '700', align = 'left', font = 'Trebuchet MS, Verdana, sans-serif') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

// --- Food drawing ------------------------------------------------------------

export function drawIngredient(ctx, key, x, y, r, time = 0) {
  const [ingredient, prep] = key.split(':');
  ctx.save();
  ctx.translate(x, y);
  if (ingredient === 'bun') {
    ctx.fillStyle = '#e8a94e';
    ctx.beginPath();
    ctx.arc(0, r * 0.25, r, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d18f35';
    ctx.fillRect(-r, r * 0.2, r * 2, r * 0.28);
    ctx.fillStyle = '#fff3d6';
    for (const [sx, sy] of [[-0.5, -0.45], [0, -0.62], [0.5, -0.45], [-0.2, -0.2], [0.3, -0.18]]) {
      ctx.beginPath();
      ctx.ellipse(sx * r, sy * r, r * 0.09, r * 0.06, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (ingredient === 'patty') {
    const burnt = prep === 'burnt';
    ctx.fillStyle = burnt ? '#2b1d12' : prep === 'grilled' ? '#6e4525' : '#8a5a33';
    roundRect(ctx, -r, -r * 0.55, r * 2, r * 1.1, r * 0.4);
    ctx.fill();
    if (!burnt) {
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = r * 0.12;
      for (const dx of [-0.5, 0, 0.5]) {
        ctx.beginPath();
        ctx.moveTo(dx * r, -r * 0.4);
        ctx.lineTo(dx * r, r * 0.4);
        ctx.stroke();
      }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.3, -r * 0.3, r * 0.5, r * 0.16, -0.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (ingredient === 'cheese') {
    ctx.fillStyle = '#f7c948';
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.6);
    ctx.lineTo(r, r * 0.6);
    ctx.lineTo(r * 0.85, -r * 0.7);
    ctx.lineTo(-r * 0.85, -r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e0a92c';
    for (const [hx, hy] of [[-0.4, 0.1], [0.25, -0.25], [0.45, 0.3]]) {
      ctx.beginPath();
      ctx.arc(hx * r, hy * r, r * 0.13, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (ingredient === 'tomato') {
    if (prep === 'chopped') {
      for (let i = -1; i <= 1; i++) {
        ctx.fillStyle = '#e23b2e';
        ctx.beginPath();
        ctx.moveTo(i * r * 0.6, -r * 0.5);
        ctx.lineTo(i * r * 0.6 + r * 0.42, r * 0.55);
        ctx.lineTo(i * r * 0.6 - r * 0.42, r * 0.55);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#f0837a';
        ctx.beginPath();
        ctx.arc(i * r * 0.6, r * 0.1, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = '#e23b2e';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.ellipse(-r * 0.35, -r * 0.4, r * 0.32, r * 0.18, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3f9e3a';
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i - 2) * 0.5;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * r * 0.55, -r * 0.75 + Math.sin(a) * r * 0.3, r * 0.28, r * 0.12, a, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (ingredient === 'lettuce') {
    if (prep === 'chopped') {
      ctx.strokeStyle = '#5dbb4a';
      ctx.lineWidth = r * 0.22;
      ctx.lineCap = 'round';
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * r * 0.55 - r * 0.4, r * 0.55);
        ctx.lineTo(i * r * 0.55 + r * 0.4, -r * 0.55);
        ctx.stroke();
      }
      ctx.strokeStyle = '#35822a';
      ctx.lineWidth = r * 0.1;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * r * 0.55 - r * 0.3, r * 0.35);
        ctx.lineTo(i * r * 0.55 + r * 0.3, -r * 0.35);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = '#5dbb4a';
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const rr = r * (i % 2 === 0 ? 0.95 : 0.72);
        const px = Math.cos(a) * rr;
        const py = Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#35822a';
      ctx.lineWidth = r * 0.1;
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, 0);
      ctx.lineTo(r * 0.6, 0);
      ctx.moveTo(0, -r * 0.6);
      ctx.lineTo(0, r * 0.6);
      ctx.stroke();
    }
  } else if (ingredient === 'onion') {
    if (prep === 'chopped') {
      ctx.strokeStyle = '#c98fd6';
      ctx.lineWidth = r * 0.16;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc((i - 1) * r * 0.55, 0, r * 0.32, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.strokeStyle = '#f3e3f7';
      ctx.lineWidth = r * 0.07;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc((i - 1) * r * 0.55, 0, r * 0.2, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = '#b678c9';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f3e3f7';
      ctx.lineWidth = r * 0.09;
      for (const rr of [0.68, 0.46, 0.24]) {
        ctx.beginPath();
        ctx.arc(0, 0, r * rr, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = '#8e5a9e';
      ctx.beginPath();
      ctx.moveTo(-r * 0.2, -r * 0.85);
      ctx.lineTo(0, -r * 1.15);
      ctx.lineTo(r * 0.2, -r * 0.85);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
  void time;
}

// A dish mid-assembly: the plate's items as a little stacked tower.
function drawDishStack(ctx, items, cx, baseY, width) {
  const bandH = 15;
  const totalH = items.length * bandH;
  let y = baseY - totalH;
  for (const key of items) {
    const [ingredient, prep] = key.split(':');
    const w = width * (ingredient === 'bun' ? 0.94 : 0.86);
    const bx = cx - w / 2;
    if (ingredient === 'bun') {
      ctx.fillStyle = '#e8a94e';
      ctx.beginPath();
      ctx.arc(cx, y + bandH, w / 2, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff3d6';
      for (const sx of [-0.3, 0, 0.3]) {
        ctx.beginPath();
        ctx.ellipse(cx + sx * w, y + bandH * 0.35, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (ingredient === 'patty') {
      ctx.fillStyle = prep === 'burnt' ? '#2b1d12' : '#6e4525';
      roundRect(ctx, bx, y + 2, w, bandH - 2, 6);
      ctx.fill();
    } else if (ingredient === 'cheese') {
      ctx.fillStyle = '#f7c948';
      ctx.beginPath();
      ctx.moveTo(bx, y + 3);
      ctx.lineTo(bx + w, y + 3);
      ctx.lineTo(bx + w - 8, y + bandH + 4);
      ctx.lineTo(bx + w * 0.55, y + bandH - 2);
      ctx.lineTo(bx + 8, y + bandH + 4);
      ctx.closePath();
      ctx.fill();
    } else if (ingredient === 'tomato') {
      ctx.fillStyle = '#e23b2e';
      roundRect(ctx, bx, y + 3, w, bandH - 4, 6);
      ctx.fill();
    } else if (ingredient === 'lettuce') {
      ctx.fillStyle = '#5dbb4a';
      ctx.beginPath();
      for (let i = 0; i <= 10; i++) {
        const px = bx + (i / 10) * w;
        const py = y + bandH / 2 + (i % 2 === 0 ? -4 : 4);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.lineTo(bx + w, y + bandH);
      ctx.lineTo(bx, y + bandH);
      ctx.closePath();
      ctx.fill();
    } else if (ingredient === 'onion') {
      ctx.fillStyle = '#c98fd6';
      roundRect(ctx, bx + 6, y + 4, w - 12, bandH - 6, 6);
      ctx.fill();
      ctx.strokeStyle = '#f3e3f7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx + 12, y + bandH / 2);
      ctx.lineTo(bx + w - 12, y + bandH / 2);
      ctx.stroke();
    }
    y += bandH;
  }
}

// --- The kitchen ----------------------------------------------------------------

function drawWall(ctx, time) {
  ctx.fillStyle = '#f6e3c5';
  ctx.fillRect(0, 104, 1280, 226);
  ctx.fillStyle = '#efd3a8';
  for (let y = 104; y < 330; y += 38) {
    ctx.fillRect(0, y, 1280, 2);
    for (let x = (y / 38) % 2 === 0 ? 0 : 40; x < 1280; x += 80) {
      ctx.fillRect(x, y, 2, 38);
    }
  }
  // Shelf with jars and a hanging pan.
  ctx.fillStyle = '#8a5a33';
  ctx.fillRect(880, 180, 360, 12);
  const jars = ['#e23b2e', '#5dbb4a', '#f7c948', '#c98fd6'];
  jars.forEach((c, i) => {
    const jx = 910 + i * 78;
    ctx.fillStyle = c;
    roundRect(ctx, jx, 148, 44, 32, 6);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(jx + 12, 140, 20, 8);
  });
  ctx.strokeStyle = '#5d3a1e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(1240, 206, 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(1240, 190, 1240, 180);
  ctx.stroke();
  // Framed menu poster, above the chopping board.
  ctx.fillStyle = '#fff8ec';
  ctx.fillRect(300, 118, 150, 74);
  ctx.strokeStyle = '#8a5a33';
  ctx.lineWidth = 4;
  ctx.strokeRect(300, 118, 150, 74);
  text(ctx, "TODAY'S", 375, 140, 13, '#8a5a33', '800', 'center');
  text(ctx, 'MENU', 375, 160, 20, '#c0392b', '900', 'center');
  text(ctx, 'fresh • fast • hot', 375, 182, 11, '#8a5a33', '600', 'center');
  void time;
}

function drawCounter(ctx) {
  ctx.fillStyle = '#a9713f';
  ctx.fillRect(0, 330, 1280, 226);
  ctx.fillStyle = '#c08a52';
  ctx.fillRect(0, 330, 1280, 10);
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let x = 0; x < 1280; x += 64) ctx.fillRect(x, 340, 2, 216);
}

function drawPantry(ctx, kitchen, hover) {
  text(ctx, 'PANTRY', LAYOUT.pantry.x, 132, 15, '#5d3a1e', '900');
  PANTRY_ORDER.forEach((ingredient, i) => {
    const r = pantryBinRect(i);
    const isHover = hover === `pantry:${ingredient}`;
    ctx.fillStyle = isHover ? '#ffe9b8' : '#fff8ec';
    roundRect(ctx, r.x, r.y, r.w, r.h, 12);
    ctx.fill();
    ctx.strokeStyle = isHover ? '#e67e22' : '#d9c39a';
    ctx.lineWidth = isHover ? 3 : 2;
    ctx.stroke();
    drawIngredient(ctx, ingredient, r.x + r.w / 2, r.y + 40, 30);
    text(ctx, ingredient[0].toUpperCase() + ingredient.slice(1), r.x + r.w / 2, r.y + 76, 13, '#5d3a1e', '700', 'center');
    ctx.fillStyle = '#b9a07a';
    roundRect(ctx, r.x + 8, r.y + 8, 20, 20, 5);
    ctx.fill();
    text(ctx, PANTRY_KEYS[i], r.x + 18, r.y + 19, 12, '#fff', '800', 'center');
  });
}

function drawBoard(ctx, kitchen, hover) {
  const b = LAYOUT.board;
  text(ctx, 'CHOPPING BOARD', b.x + 4, 348, 15, '#5d3a1e', '900');
  const isHover = hover === 'board';
  ctx.fillStyle = isHover ? '#f3d9a4' : '#e9c893';
  roundRect(ctx, b.x + 16, b.y + 46, b.w - 32, 130, 14);
  ctx.fill();
  ctx.strokeStyle = '#b98d54';
  ctx.lineWidth = 3;
  ctx.stroke();
  if (kitchen.board) {
    const cx = b.x + b.w / 2;
    const cy = b.y + 112;
    drawIngredient(ctx, kitchen.board.key, cx, cy, 42);
    // Cut marks show the chopping progress on the ingredient itself.
    if (kitchen.board.chops > 0) {
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 3;
      for (let i = 0; i < kitchen.board.chops; i++) {
        const lx = cx - 24 + i * 24;
        ctx.beginPath();
        ctx.moveTo(lx, cy - 30);
        ctx.lineTo(lx + 8, cy + 30);
        ctx.stroke();
      }
    }
    const pct = kitchen.board.chops / 3;
    ctx.fillStyle = '#fff';
    roundRect(ctx, b.x + 40, b.y + 186, b.w - 80, 14, 7);
    ctx.fill();
    ctx.fillStyle = '#e67e22';
    roundRect(ctx, b.x + 40, b.y + 186, (b.w - 80) * pct, 14, 7);
    ctx.fill();
    text(ctx, `CHOP! ${kitchen.board.chops}/3`, cx, b.y + 214, 14, '#5d3a1e', '800', 'center');
  } else {
    text(ctx, 'Drop a tomato, lettuce', b.x + b.w / 2, b.y + 100, 14, '#8a6a42', '600', 'center');
    text(ctx, 'or onion here — click', b.x + b.w / 2, b.y + 122, 14, '#8a6a42', '600', 'center');
    text(ctx, '3 times to chop', b.x + b.w / 2, b.y + 144, 14, '#8a6a42', '600', 'center');
    text(ctx, '(or press SPACE)', b.x + b.w / 2, b.y + 196, 12, '#f3e0bd', '600', 'center');
  }
}

function drawStove(ctx, kitchen, time, hover) {
  const s = LAYOUT.stove;
  text(ctx, 'GRILL', s.x + 4, 348, 15, '#5d3a1e', '900');
  ctx.fillStyle = '#3a3f4a';
  roundRect(ctx, s.x + 8, s.y + 40, s.w - 16, 150, 14);
  ctx.fill();
  ctx.fillStyle = '#565d6b';
  roundRect(ctx, s.x + 8, s.y + 40, s.w - 16, 10, 5);
  ctx.fill();
  kitchen.grill.forEach((slot, i) => {
    const r = grillSlotRect(i);
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    ctx.fillStyle = '#22252c';
    ctx.beginPath();
    ctx.arc(cx, cy, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 3;
    ctx.stroke();
    if (slot) {
      const done = slot.cooked / 12;
      const perfect = done >= 0.55 && done <= 0.92;
      const burnt = done >= 1.15;
      drawIngredient(ctx, 'patty:grilled', cx, cy, 34);
      if (done < 0.55) {
        ctx.fillStyle = '#f7c948';
      } else if (perfect) {
        ctx.fillStyle = '#5dbb4a';
      } else {
        ctx.fillStyle = '#e23b2e';
      }
      ctx.beginPath();
      ctx.arc(cx, cy, 50, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(done, 1.15) / 1.15);
      ctx.lineWidth = 6;
      ctx.strokeStyle = ctx.fillStyle;
      ctx.stroke();
      if (perfect) text(ctx, 'PERFECT!', cx, cy - 58, 13, '#5dbb4a', '900', 'center');
      if (burnt) text(ctx, 'BURNT!', cx, cy - 58, 13, '#e23b2e', '900', 'center');
      // Steam wisps.
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 3;
      for (let w = 0; w < 2; w++) {
        const wx = cx - 14 + w * 28;
        const phase = (time * 1.4 + w) % 1;
        ctx.beginPath();
        ctx.moveTo(wx, cy - 48);
        ctx.quadraticCurveTo(wx + 8 * Math.sin(phase * 6), cy - 62 - phase * 14, wx, cy - 76 - phase * 14);
        ctx.globalAlpha = 0.6 * (1 - phase);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    } else {
      text(ctx, 'patty', cx, cy - 8, 12, '#8b93a3', '600', 'center');
      text(ctx, 'here', cx, cy + 10, 12, '#8b93a3', '600', 'center');
    }
    if (hover === `grill:${i}`) {
      ctx.strokeStyle = '#e67e22';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 52, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
  text(ctx, 'Click a patty when the ring is green', s.x + s.w / 2, s.y + 208, 12, '#f3e0bd', '600', 'center');
}

function drawPlateStation(ctx, kitchen, hover) {
  const p = LAYOUT.plate;
  text(ctx, 'PLATE', p.x + 4, 348, 15, '#5d3a1e', '900');
  const cx = p.x + p.w / 2;
  const cy = p.y + 140;
  const isHover = hover === 'plate';
  ctx.fillStyle = '#fdfdfd';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 82, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = isHover ? '#e67e22' : '#d9c39a';
  ctx.lineWidth = isHover ? 3 : 2;
  ctx.stroke();
  ctx.fillStyle = '#e8e2d5';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 58, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  if (kitchen.plate.length > 0) {
    drawDishStack(ctx, kitchen.plate, cx, cy - 6, 104);
    const match = kitchen.plate.length > 0;
    if (match) text(ctx, `${kitchen.plate.length} item${kitchen.plate.length > 1 ? 's' : ''} on the plate`, cx, p.y + 196, 13, '#5d3a1e', '700', 'center');
  } else {
    text(ctx, 'Click with an item', cx, cy - 46, 13, '#f3e0bd', '600', 'center');
    text(ctx, 'in hand to add it', cx, cy - 26, 13, '#f3e0bd', '600', 'center');
  }
  text(ctx, 'Click empty-handed to take back', cx, p.y + 216, 11, '#f3e0bd', '600', 'center');
}

function drawServe(ctx, kitchen, time, hover) {
  const s = LAYOUT.serve;
  text(ctx, 'SERVE', s.x + 4, 348, 15, '#5d3a1e', '900');
  const match = kitchen.plate.length > 0 && kitchen.orders.some((o) => {
    const a = [...kitchen.plate].sort();
    const b = [...o.recipe.items].sort();
    return a.length === b.length && a.every((v, i) => v === b[i]);
  });
  const glow = match ? 0.6 + 0.4 * Math.sin(time * 5) : 0;
  ctx.fillStyle = '#7a4a21';
  roundRect(ctx, s.x + 8, s.y + 40, s.w - 16, 150, 14);
  ctx.fill();
  ctx.fillStyle = '#3a2a18';
  roundRect(ctx, s.x + 20, s.y + 52, s.w - 40, 92, 10);
  ctx.fill();
  // The bell.
  ctx.fillStyle = '#f7c948';
  ctx.beginPath();
  ctx.arc(s.x + s.w / 2, s.y + 92, 20, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(s.x + s.w / 2 - 24, s.y + 90, 48, 6);
  ctx.fillStyle = '#d9a41f';
  ctx.beginPath();
  ctx.arc(s.x + s.w / 2, s.y + 100, 5, 0, Math.PI * 2);
  ctx.fill();
  if (match) {
    ctx.save();
    ctx.globalAlpha = glow;
    ctx.strokeStyle = '#5dbb4a';
    ctx.lineWidth = 5;
    roundRect(ctx, s.x + 8, s.y + 40, s.w - 16, 150, 14);
    ctx.stroke();
    ctx.restore();
    text(ctx, 'READY — click to serve!', s.x + s.w / 2, s.y + 166, 15, '#ffe9b8', '900', 'center');
    text(ctx, '(or press ENTER)', s.x + s.w / 2, s.y + 186, 12, '#f3e0bd', '600', 'center');
  } else if (kitchen.plate.length > 0) {
    text(ctx, 'Not what any ticket asks for', s.x + s.w / 2, s.y + 166, 12, '#f3e0bd', '600', 'center');
    text(ctx, 'yet — check the board', s.x + s.w / 2, s.y + 186, 12, '#f3e0bd', '600', 'center');
  } else {
    text(ctx, 'Finish a dish on the', s.x + s.w / 2, s.y + 166, 12, '#f3e0bd', '600', 'center');
    text(ctx, 'plate, then ring the bell', s.x + s.w / 2, s.y + 186, 12, '#f3e0bd', '600', 'center');
  }
  if (hover === 'serve' && match) {
    ctx.strokeStyle = '#e67e22';
    ctx.lineWidth = 3;
    roundRect(ctx, s.x + 8, s.y + 40, s.w - 16, 150, 14);
    ctx.stroke();
  }
  // Trash can.
  const t = LAYOUT.trash;
  ctx.fillStyle = '#8b93a3';
  roundRect(ctx, t.x, t.y, t.w, t.h, 6);
  ctx.fill();
  ctx.fillStyle = '#6b7280';
  ctx.fillRect(t.x - 3, t.y - 4, t.w + 6, 8);
  text(ctx, 'TRASH', t.x + t.w / 2, t.y + t.h + 12, 10, '#5d3a1e', '800', 'center');
}

// --- Top bar: order board, timer, score --------------------------------------

function drawTickets(ctx, kitchen, time) {
  const t = LAYOUT.tickets;
  kitchen.orders.forEach((order, i) => {
    const x = t.x + i * (t.w + t.gap);
    const y = t.y;
    const matches = kitchen.plate.length > 0 && (() => {
      const a = [...kitchen.plate].sort();
      const b = [...order.recipe.items].sort();
      return a.length === b.length && a.every((v, idx) => v === b[idx]);
    })();
    const urgent = order.patienceLeft < 12;
    ctx.fillStyle = matches ? '#e8f7e4' : '#fff8ec';
    roundRect(ctx, x, y, t.w, t.h, 10);
    ctx.fill();
    ctx.strokeStyle = matches ? '#5dbb4a' : urgent ? '#e23b2e' : '#d9c39a';
    ctx.lineWidth = matches || urgent ? 3 : 2;
    ctx.stroke();
    ctx.fillStyle = order.recipe.color;
    roundRect(ctx, x, y, t.w, 24, 10);
    ctx.fill();
    ctx.fillRect(x, y + 14, t.w, 10);
    text(ctx, order.recipe.name.toUpperCase(), x + 10, y + 13, 13, '#fff', '900');
    text(ctx, `#${order.id}`, x + t.w - 10, y + 13, 12, 'rgba(255,255,255,0.9)', '700', 'right');
    order.recipe.items.forEach((item, j) => {
      drawIngredient(ctx, item, x + 24 + j * 34, y + 46, 13);
    });
    const pct = Math.max(0, order.patienceLeft / order.patience);
    ctx.fillStyle = '#e8e2d5';
    roundRect(ctx, x + 10, y + 68, t.w - 20, 8, 4);
    ctx.fill();
    ctx.fillStyle = pct > 0.5 ? '#5dbb4a' : pct > 0.25 ? '#f7c948' : '#e23b2e';
    if (pct > 0) {
      roundRect(ctx, x + 10, y + 68, (t.w - 20) * pct, 8, 4);
      ctx.fill();
    }
    if (urgent) {
      text(ctx, `${Math.ceil(order.patienceLeft)}s`, x + t.w - 10, y + 46, 14, '#e23b2e', '900', 'right');
    }
    if (matches) text(ctx, '✓', x + t.w - 12, y + 46, 18, '#2f7d32', '900', 'right');
  });
  for (let i = kitchen.orders.length; i < 3; i++) {
    const x = t.x + i * (t.w + t.gap);
    ctx.fillStyle = 'rgba(255,248,236,0.45)';
    roundRect(ctx, x, t.y, t.w, t.h, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(217,195,154,0.6)';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, 'waiting for the next ticket…', x + t.w / 2, t.y + t.h / 2, 12, '#8a6a42', '600', 'center');
  }
  void time;
}

function drawTopBar(ctx, kitchen, time) {
  ctx.fillStyle = '#2e2118';
  ctx.fillRect(0, 0, 1280, 104);
  text(ctx, 'SIZZLE', 24, 34, 30, '#f7c948', '900');
  text(ctx, '& SERVE', 24, 64, 30, '#fff8ec', '900');
  text(ctx, 'KITCHEN', 150, 88, 11, '#c9a86a', '800');
  drawTickets(ctx, kitchen, time);
  const rx = 950;
  const urgent = kitchen.shiftLeft <= 30 && kitchen.phase === 'playing';
  const timerColor = urgent ? (Math.sin(time * 6) > 0 ? '#ff6b5e' : '#fff') : '#fff8ec';
  text(ctx, formatTime(kitchen.shiftLeft), rx + 150, 32, 34, timerColor, '900', 'center');
  text(ctx, 'SHIFT', rx + 150, 58, 11, '#c9a86a', '800', 'center');
  text(ctx, `SCORE ${kitchen.score}`, rx, 84, 15, '#fff8ec', '800');
  if (kitchen.combo > 1) text(ctx, `COMBO x${kitchen.combo}`, rx + 150, 84, 15, '#f7c948', '900', 'center');
  text(ctx, `COINS ${kitchen.coins}`, 1264, 84, 15, '#f7c948', '800', 'right');
  for (let i = 0; i < 3; i++) {
    const hx = 1206 + i * 22;
    ctx.fillStyle = i < kitchen.hearts ? '#e23b2e' : 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.arc(hx, 28, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(hx + 6, 28, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hx - 6, 30);
    ctx.lineTo(hx + 14, 30);
    ctx.lineTo(hx + 4, 44);
    ctx.closePath();
    ctx.fill();
  }
}

// --- Bottom bar ----------------------------------------------------------------

function drawBottomBar(ctx, kitchen, mouse, hover) {
  ctx.fillStyle = '#2e2118';
  ctx.fillRect(0, 600, 1280, 120);
  const h = LAYOUT.hand;
  ctx.fillStyle = '#463223';
  roundRect(ctx, h.x, h.y, h.w, h.h, 10);
  ctx.fill();
  ctx.strokeStyle = kitchen.hand ? '#f7c948' : '#6b563e';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'IN HAND', h.x + 12, h.y + 14, 11, '#c9a86a', '800');
  if (kitchen.hand) {
    drawIngredient(ctx, kitchen.hand, h.x + 34, h.y + 42, 20);
    const label = kitchen.hand.split(':').map((s) => s[0].toUpperCase() + s.slice(1)).join(' ');
    text(ctx, label, h.x + 62, h.y + 42, 14, '#fff8ec', '700');
  } else {
    text(ctx, 'empty — grab an ingredient', h.x + 14, h.y + 42, 13, '#8a7a66', '600');
  }
  text(ctx, 'Click a bin to grab  •  1–6 pick ingredients  •  SPACE chops  •  ENTER serves  •  T trashes  •  P pauses', 640, 648, 14, '#c9a86a', '600', 'center');
  text(ctx, 'Serve the dish a ticket asks for before its patience runs out. Three walk-outs end the shift.', 640, 674, 13, '#8a7a66', '600', 'center');
  text(ctx, `Dishes served: ${kitchen.servedCount}   •   Burnt: ${kitchen.burntCount}   •   Walk-outs: ${kitchen.expiredCount}`, 640, 698, 12, '#6b5a44', '600', 'center');
  for (const [rect, label] of [[LAYOUT.muteButton, 'SND'], [LAYOUT.pauseButton, 'II']]) {
    ctx.fillStyle = '#463223';
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    ctx.strokeStyle = '#6b563e';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1, 14, '#fff8ec', '800', 'center');
  }
  void mouse;
  void hover;
}

// --- Overlays --------------------------------------------------------------------

function drawTitle(ctx, kitchen, time) {
  ctx.fillStyle = 'rgba(30,20,12,0.72)';
  ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = '#fff8ec';
  roundRect(ctx, 340, 120, 600, 440, 20);
  ctx.fill();
  ctx.strokeStyle = '#e8a94e';
  ctx.lineWidth = 4;
  ctx.stroke();
  text(ctx, 'SIZZLE & SERVE', 640, 180, 44, '#c0392b', '900', 'center');
  text(ctx, 'a tiny kitchen, a very busy shift', 640, 222, 17, '#8a6a42', '600', 'center');
  const lines = [
    'Tickets roll in on the order board — cook what they ask for.',
    'Chop it, grill it, stack it on the plate, ring the bell.',
    'Serve before patience runs out. Three walk-outs end the shift.',
    'Combos pay more. Burnt patties pay nothing.',
  ];
  lines.forEach((line, i) => text(ctx, line, 640, 268 + i * 30, 16, '#5d3a1e', '600', 'center'));
  const pulse = 0.65 + 0.35 * Math.sin(time * 4);
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#c0392b';
  roundRect(ctx, 490, 420, 300, 56, 28);
  ctx.fill();
  ctx.restore();
  text(ctx, 'CLICK TO START YOUR SHIFT', 640, 449, 18, '#fff', '900', 'center');
  text(ctx, 'Mouse + keyboard  •  1–6 grab  •  SPACE chop  •  ENTER serve', 640, 508, 13, '#8a6a42', '600', 'center');
  text(ctx, '3-minute shift  •  original recipes, drawn and scored in code', 640, 532, 13, '#8a6a42', '600', 'center');
  void kitchen;
}

function drawGameOver(ctx, kitchen) {
  ctx.fillStyle = 'rgba(30,20,12,0.78)';
  ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = '#fff8ec';
  roundRect(ctx, 360, 110, 560, 470, 20);
  ctx.fill();
  ctx.strokeStyle = '#e8a94e';
  ctx.lineWidth = 4;
  ctx.stroke();
  const reason = kitchen.endReason === 'shift over' ? 'SHIFT COMPLETE!' : 'THE KITCHEN CLOSED EARLY';
  text(ctx, reason, 640, 168, 32, '#c0392b', '900', 'center');
  for (let i = 0; i < 3; i++) {
    const sx = 560 + i * 80;
    ctx.fillStyle = i < kitchen.stars ? '#f7c948' : '#d9c39a';
    ctx.beginPath();
    for (let p = 0; p < 10; p++) {
      const a = -Math.PI / 2 + (p * Math.PI) / 5;
      const rr = p % 2 === 0 ? 30 : 13;
      const px = sx + Math.cos(a) * rr;
      const py = 224 + Math.sin(a) * rr;
      if (p === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
  text(ctx, `SCORE  ${kitchen.score}`, 640, 300, 30, '#2e2118', '900', 'center');
  text(ctx, `Coins earned: ${kitchen.coins}      Dishes served: ${kitchen.servedCount}`, 640, 342, 17, '#5d3a1e', '700', 'center');
  text(ctx, `Walk-outs: ${kitchen.expiredCount}      Burnt patties: ${kitchen.burntCount}`, 640, 372, 15, '#8a6a42', '600', 'center');
  const verdict = kitchen.stars === 3 ? 'Head-chef material. The lunch rush fears you.'
    : kitchen.stars === 2 ? 'A solid shift — the regulars are coming back.'
    : kitchen.stars === 1 ? 'The kitchen survived. Barely. Cook again?'
    : 'A rough first shift. The stove believes in you.';
  text(ctx, verdict, 640, 420, 16, '#5d3a1e', '600', 'center');
  ctx.fillStyle = '#c0392b';
  roundRect(ctx, 490, 460, 300, 56, 28);
  ctx.fill();
  text(ctx, 'PRESS R TO COOK AGAIN', 640, 489, 18, '#fff', '900', 'center');
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(30,20,12,0.6)';
  ctx.fillRect(0, 0, 1280, 720);
  text(ctx, 'PAUSED', 640, 340, 48, '#fff8ec', '900', 'center');
  text(ctx, 'Press P to get back to the stove', 640, 390, 18, '#f7c948', '600', 'center');
}

// --- Particles, floaters, banner ---------------------------------------------------

function drawEffects(ctx, kitchen) {
  for (const p of kitchen.particles) {
    ctx.save();
    ctx.globalAlpha = 1 - p.age / p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  for (const f of kitchen.floaters) {
    ctx.save();
    ctx.globalAlpha = 1 - f.age / f.life;
    text(ctx, f.text, f.x, f.y, 20, f.color, '900', 'center');
    ctx.restore();
  }
  if (kitchen.message) {
    ctx.fillStyle = 'rgba(46,33,24,0.9)';
    roundRect(ctx, 470, 108, 340, 34, 17);
    ctx.fill();
    text(ctx, kitchen.message.text, 640, 126, 15, '#f7c948', '700', 'center');
  }
}

// --- Main entry ---------------------------------------------------------------------

export function renderGame(ctx, kitchen, mouse, hover, time, paused) {
  ctx.clearRect(0, 0, 1280, 720);
  drawWall(ctx, time);
  drawCounter(ctx);
  drawPantry(ctx, kitchen, hover);
  drawBoard(ctx, kitchen, hover);
  drawStove(ctx, kitchen, time, hover);
  drawPlateStation(ctx, kitchen, hover);
  drawServe(ctx, kitchen, time, hover);
  drawTopBar(ctx, kitchen, time);
  drawBottomBar(ctx, kitchen, mouse, hover);
  drawEffects(ctx, kitchen);
  // The carried item follows the cursor.
  if (kitchen.hand && kitchen.phase === 'playing' && !paused) {
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = 'rgba(247,201,72,0.25)';
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 30, 0, Math.PI * 2);
    ctx.fill();
    drawIngredient(ctx, kitchen.hand, mouse.x, mouse.y - 4, 22);
    ctx.restore();
  }
  if (kitchen.phase === 'title') drawTitle(ctx, kitchen, time);
  if (kitchen.phase === 'over') drawGameOver(ctx, kitchen);
  if (paused && kitchen.phase === 'playing') drawPaused(ctx);
}

export { PANTRY_ORDER, PANTRY_KEYS };
