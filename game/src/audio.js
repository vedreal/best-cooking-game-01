// Sizzle & Serve — every sound is synthesized with WebAudio, no audio files.
// One clear job: short effects and a light kitchen groove, all generated in
// code so the game loads nothing over the network.

let ctx = null;
let master = null;
let musicGain = null;
let muted = false;
let musicTimer = null;
let sizzleNodes = null;

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 0.9;
  return muted;
}

// Audio starts only after a user gesture, as browsers require.
export function ensureAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume();
    return true;
  }
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return false;
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.9;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.16;
    musicGain.connect(master);
    startMusic();
    return true;
  } catch {
    return false;
  }
}

function tone(freq, seconds, type, volume, when = 0, slideTo = null) {
  if (!ctx || !master) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + seconds);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t0);
  osc.stop(t0 + seconds + 0.05);
}

function noiseBurst(seconds, volume, filterFreq, when = 0) {
  if (!ctx || !master) return;
  const t0 = ctx.currentTime + when;
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  source.start(t0);
}

export function playClick() {
  tone(660, 0.06, 'triangle', 0.12);
}

export function playGrab() {
  tone(520, 0.07, 'triangle', 0.14);
  tone(780, 0.07, 'triangle', 0.1, 0.04);
}

export function playChop() {
  noiseBurst(0.09, 0.5, 900);
  tone(140, 0.09, 'sine', 0.35, 0, 70);
}

export function playPlace() {
  tone(330, 0.08, 'triangle', 0.16);
  tone(495, 0.08, 'triangle', 0.1, 0.05);
}

export function playDing() {
  tone(880, 0.18, 'sine', 0.22);
  tone(1318, 0.3, 'sine', 0.2, 0.1);
}

export function playServe() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.18, i * 0.07));
}

export function playError() {
  tone(220, 0.18, 'sawtooth', 0.12, 0, 160);
}

export function playBurnt() {
  tone(180, 0.35, 'sawtooth', 0.14, 0, 90);
  noiseBurst(0.25, 0.2, 400, 0.05);
}

export function playTick() {
  tone(1200, 0.04, 'square', 0.06);
}

export function playNewOrder() {
  tone(587, 0.12, 'triangle', 0.16);
  tone(880, 0.16, 'triangle', 0.16, 0.09);
}

// A looping grill hiss while at least one patty cooks; call with the count.
export function setSizzle(count) {
  if (!ctx || !master) return;
  if (count > 0 && !sizzleNodes) {
    const length = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 4200;
    filter.Q.value = 0.6;
    const gain = ctx.createGain();
    gain.gain.value = 0.05;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start();
    sizzleNodes = { source, gain };
  } else if (count === 0 && sizzleNodes) {
    try {
      sizzleNodes.source.stop();
    } catch {
      // Already stopped.
    }
    sizzleNodes = null;
  } else if (sizzleNodes) {
    sizzleNodes.gain.gain.value = 0.03 + 0.02 * Math.min(count, 2);
  }
}

// A gentle two-bar loop: a walking bass and a soft tick, kept quiet.
const BASS_LINE = [110, 0, 130.8, 0, 98, 0, 146.8, 0, 110, 0, 130.8, 0, 164.8, 146.8, 130.8, 0];
function startMusic() {
  if (!ctx || musicTimer !== null) return;
  let step = 0;
  musicTimer = window.setInterval(() => {
    if (!ctx || muted) {
      step = (step + 1) % BASS_LINE.length;
      return;
    }
    const note = BASS_LINE[step % BASS_LINE.length];
    if (note > 0) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = note;
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.42);
      osc.connect(gain);
      gain.connect(musicGain);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    }
    if (step % 4 === 2) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 2400;
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(musicGain);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    }
    step = (step + 1) % BASS_LINE.length;
  }, 240);
}
