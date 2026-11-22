// Velvet Vault — boot + game loop. Parses ?shot= / ?selftest=, wires input
// to the state machine, and draws every frame on a 1280x720 canvas scaled
// to the window. No network, no assets: everything is drawn and synthesised.
import { WORLD_H, WORLD_W } from './config.js';
import { createInput, consumePressed, endFrame } from './input.js';
import { createState, hackCameras, resetRun, startLevel, startPlanning, throwCoin, updatePlay } from './state.js';
import { render } from './render.js';
import { applyShot } from './shots.js';
import { runSelftest } from './selftest.js';
import { ensureAudio, toggleMute } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

function fitCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = WORLD_W * dpr;
  canvas.height = WORLD_H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

const input = createInput(canvas);
const state = createState();
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const selftest = params.get('selftest');

if (shot) {
  applyShot(state, shot);
} else {
  state.screen = 'title';
}

if (selftest) {
  runSelftest();
  statusEl.textContent = document.title;
}

let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (consumePressed(input, 'mute')) state.muted = toggleMute();
  if (input.pressed.has('confirm') || input.pressed.has('interact')) ensureAudio();

  if (state.screen === 'title') {
    if (consumePressed(input, 'confirm')) {
      ensureAudio();
      startPlanning(state);
    }
  } else if (state.screen === 'planning') {
    if (consumePressed(input, 'route1') || consumePressed(input, 'confirm')) {
      startLevel(state, state.levelIndex, 'front');
    } else if (consumePressed(input, 'route2')) {
      startLevel(state, state.levelIndex, 'vent');
    } else if (input.mouseClicked) {
      if (input.clickY >= 470 && input.clickY <= 534) {
        if (input.clickX >= 340 && input.clickX <= 600) startLevel(state, state.levelIndex, 'front');
        if (input.clickX >= 680 && input.clickX <= 940) startLevel(state, state.levelIndex, 'vent');
      }
    }
  } else if (state.screen === 'play') {
    if (consumePressed(input, 'pause')) {
      state.screen = 'paused';
    } else {
      if (consumePressed(input, 'coin')) throwCoin(state, input.mouseX, input.mouseY);
      if (consumePressed(input, 'hack')) hackCameras(state);
      updatePlay(state, input, dt);
    }
  } else if (state.screen === 'paused') {
    if (consumePressed(input, 'pause') || consumePressed(input, 'confirm')) state.screen = 'play';
  } else if (state.screen === 'win' || state.screen === 'lose') {
    if (consumePressed(input, 'restart')) resetRun(state);
    else if (consumePressed(input, 'confirm')) resetRun(state);
  }

  // Keep the screen-reader status line in sync with the game.
  if (state.screen === 'play') {
    statusEl.textContent = `Room ${state.levelIndex + 1}, loot $${state.lootValue} of $${state.level.totalValue}, alarm ${Math.round(state.alarm)} percent, ${state.coins} coins, ${state.hacks} hacks.`;
  } else if (state.screen === 'win') {
    statusEl.textContent = `Clean getaway! Total score ${state.totalScore}.`;
  } else if (state.screen === 'lose') {
    statusEl.textContent = `Caught. ${state.loseReason || ''}`;
  }

  render(ctx, state);
  endFrame(input);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
