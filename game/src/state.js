// Velvet Vault — the game state machine: title, route planning, play, win,
// lose and pause. Owns the thief, the alarm, the loot, the tools and the
// score; guards.js and the renderer read from it.
import {
  ALARM_DECAY_RATE,
  COIN_COUNT,
  COIN_LURE_RADIUS,
  COIN_LURE_TIME,
  HACK_COUNT,
  HACK_DURATION,
  PLAYER_R,
  PLAYER_SPEED,
  SNEAK_SPEED,
  VAULT_CRACK_TIME,
  clamp,
  resolveCircleRects,
} from './config.js';
import { buildLevel } from './levels.js';
import { applyCameraAlarm, updateCamera, updateGuard } from './guards.js';
import {
  playCaught,
  playCoin,
  playCrackTick,
  playHack,
  playPickup,
  playSpotted,
  playWin,
} from './audio.js';

export function createState() {
  return {
    screen: 'title', // title | planning | play | win | lose | paused
    levelIndex: 0,
    level: buildLevel(0),
    route: 'front',
    player: { x: 80, y: 640 },
    sneaking: false,
    alarm: 0,
    lootValue: 0,
    lootTaken: 0,
    score: 0,
    coins: COIN_COUNT,
    hacks: HACK_COUNT,
    thrownCoins: [],
    time: 0,
    crackProgress: 0,
    crackTarget: null,
    message: '',
    messageTimer: 0,
    spottedFlash: 0,
    cameraSpotted: false,
    totalScore: 0,
    levelScores: [],
    muted: false,
  };
}

export function startPlanning(state) {
  state.screen = 'planning';
  state.message = '';
}

export function startLevel(state, levelIndex, route) {
  state.levelIndex = levelIndex;
  state.level = buildLevel(levelIndex);
  state.route = route;
  const spawn = route === 'vent' ? state.level.ventSpawn : state.level.frontSpawn;
  state.player = { x: spawn.x, y: spawn.y };
  state.alarm = 0;
  state.lootValue = 0;
  state.lootTaken = 0;
  state.coins = COIN_COUNT;
  state.hacks = HACK_COUNT;
  state.thrownCoins = [];
  state.time = 0;
  state.crackProgress = 0;
  state.crackTarget = null;
  state.screen = 'play';
  state.message = route === 'vent'
    ? 'Vent route — quiet, but the long way round.'
    : 'Front door — direct, and the guards are watching it.';
  state.messageTimer = 3.5;
}

export function playerInShadow(state) {
  const p = state.player;
  return state.level.shadows.some((s) => p.x >= s.x && p.x <= s.x + s.w && p.y >= s.y && p.y <= s.y + s.h);
}

function nearestLoot(state, maxDist) {
  let best = null;
  let bestDist = maxDist;
  for (const item of state.level.loot) {
    if (item.taken) continue;
    const d = Math.hypot(item.x - state.player.x, item.y - state.player.y);
    if (d < bestDist) {
      bestDist = d;
      best = item;
    }
  }
  return best;
}

function collectLoot(state, item) {
  item.taken = true;
  state.lootValue += item.value;
  state.lootTaken += 1;
  state.score += item.value;
  playPickup();
  state.message = `Looted ${item.label} — +$${item.value}`;
  state.messageTimer = 2.2;
}

function finishLevel(state) {
  const timeBonus = Math.max(0, Math.round(600 - state.time * 4));
  const alarmBonus = Math.round((100 - state.alarm) * 3);
  const gained = state.score + timeBonus + alarmBonus;
  state.levelScores.push({ level: state.levelIndex, score: gained });
  state.totalScore += gained;
  playWin();
  if (state.levelIndex >= 2) {
    state.screen = 'win';
  } else {
    state.message = `Room cleared! +$${timeBonus} time, +$${alarmBonus} clean getaway.`;
    state.messageTimer = 2.5;
    startLevel(state, state.levelIndex + 1, state.route);
    state.message = `Room ${state.levelIndex + 1} — ${state.level.name}. ${state.message}`;
    state.messageTimer = 3;
  }
}

function loseGame(state, reason) {
  state.screen = 'lose';
  state.loseReason = reason;
  playCaught();
}

export function throwCoin(state, tx, ty) {
  if (state.coins <= 0) {
    state.message = 'No coins left!';
    state.messageTimer = 1.5;
    return;
  }
  state.coins -= 1;
  const coin = { x: state.player.x, y: state.player.y, tx, ty, t: 0 };
  state.thrownCoins.push(coin);
  playCoin();
  // The nearest guard in earshot walks over to investigate the clink.
  let best = null;
  let bestDist = COIN_LURE_RADIUS;
  for (const g of state.level.guards) {
    const d = Math.hypot(tx - g.x, ty - g.y);
    if (d < bestDist) {
      bestDist = d;
      best = g;
    }
  }
  if (best) {
    best.lure = { x: tx, y: ty };
    best.lureTimer = COIN_LURE_TIME;
    best.state = 'patrol';
    best.suspicion = Math.max(0, best.suspicion - 0.5);
    state.message = 'Coin tossed — a guard goes to look.';
  } else {
    state.message = 'Coin tossed — nobody heard it.';
  }
  state.messageTimer = 2;
}

export function hackCameras(state) {
  if (state.hacks <= 0) {
    state.message = 'No hacks left!';
    state.messageTimer = 1.5;
    return;
  }
  state.hacks -= 1;
  for (const cam of state.level.cameras) cam.disabled = HACK_DURATION;
  playHack();
  state.message = `Cameras dark for ${HACK_DURATION}s. Move!`;
  state.messageTimer = 2.5;
}

export function updatePlay(state, input, dt) {
  const p = state.player;
  state.time += dt;
  if (state.messageTimer > 0) state.messageTimer -= dt;
  if (state.spottedFlash > 0) state.spottedFlash -= dt;

  // Movement.
  let mx = 0;
  let my = 0;
  if (input.keys.has('up')) my -= 1;
  if (input.keys.has('down')) my += 1;
  if (input.keys.has('left')) mx -= 1;
  if (input.keys.has('right')) mx += 1;
  state.sneaking = input.keys.has('sneak');
  if (mx !== 0 || my !== 0) {
    const len = Math.hypot(mx, my);
    const speed = state.sneaking ? SNEAK_SPEED : PLAYER_SPEED;
    p.x += (mx / len) * speed * dt;
    p.y += (my / len) * speed * dt;
    p.x = clamp(p.x, 26 + PLAYER_R, 1280 - 26 - PLAYER_R);
    p.y = clamp(p.y, 72 + PLAYER_R, 720 - 26 - PLAYER_R);
    resolveCircleRects(p, PLAYER_R, state.level.solids);
  }

  // Mouse click throws a coin toward the click point.
  if (input.mouseClicked) {
    throwCoin(state, input.clickX, input.clickY);
  }

  // Thrown coins animate to their target.
  for (const c of state.thrownCoins) {
    c.t += dt;
    const dx = c.tx - c.x;
    const dy = c.ty - c.y;
    const d = Math.hypot(dx, dy);
    if (d > 4) {
      const step = Math.min(d, 420 * dt);
      c.x += (dx / d) * step;
      c.y += (dy / d) * step;
    }
  }
  state.thrownCoins = state.thrownCoins.filter((c) => c.t < 6);

  // Vault cracking: hold E beside the vault.
  const near = nearestLoot(state, 46);
  if (near && near.kind === 'vault' && input.keys.has('interact')) {
    state.crackTarget = near;
    state.crackProgress += dt;
    if (Math.random() < dt * 6) playCrackTick();
    if (state.crackProgress >= VAULT_CRACK_TIME) {
      collectLoot(state, near);
      state.crackProgress = 0;
      state.crackTarget = null;
    }
  } else {
    state.crackProgress = 0;
    state.crackTarget = null;
    // Walk-over loot (gold, gems, paintings) is grabbed on touch.
    if (near && near.kind !== 'vault') collectLoot(state, near);
  }

  // Guards and cameras.
  for (const cam of state.level.cameras) updateCamera(cam, dt);
  let wasSpotted = false;
  for (const g of state.level.guards) {
    const was = g.state;
    const result = updateGuard(g, p, state.level, state, dt);
    if (result === 'caught') {
      loseGame(state, 'A guard grabbed you in the open.');
      return;
    }
    if (g.state === 'chase' && was !== 'chase') {
      wasSpotted = true;
    }
  }
  if (wasSpotted) {
    playSpotted();
    state.spottedFlash = 0.6;
    state.message = 'SPOTTED! Break line of sight — hide in shadow!';
    state.messageTimer = 2;
  }
  applyCameraAlarm(state, state.level, dt);

  // Alarm cools down when unseen and hiding in shadow.
  const anyChase = state.level.guards.some((g) => g.state === 'chase');
  if (!anyChase && !state.cameraSpotted && playerInShadow(state)) {
    state.alarm = clamp(state.alarm - ALARM_DECAY_RATE * 2.2 * dt, 0, 100);
  } else if (!anyChase && !state.cameraSpotted) {
    state.alarm = clamp(state.alarm - ALARM_DECAY_RATE * dt, 0, 100);
  }
  if (state.alarm >= 100) {
    loseGame(state, 'The alarm hit 100% — security locked the room down.');
    return;
  }

  // Exit: only open once every loot item is taken.
  const allLoot = state.level.loot.every((l) => l.taken);
  const ex = state.level.exit;
  if (allLoot && p.x > ex.x - 10 && p.x < ex.x + ex.w + 10 && p.y > ex.y - 10 && p.y < ex.y + ex.h + 10) {
    finishLevel(state);
  }
}

export function resetRun(state) {
  const fresh = createState();
  Object.assign(state, fresh);
  startPlanning(state);
}
