// Velvet Vault — deterministic screenshot scenes (?shot=start|play|loot|end).
// Each scene freezes a readable moment with the room, a guard cone, a camera,
// loot and the alarm meter all in one frame.
import { startLevel } from './state.js';

export function applyShot(state, shot) {
  if (shot === 'start') {
    startLevel(state, 0, 'front');
    state.screen = 'title';
    state.alarm = 12;
    return;
  }
  if (shot === 'play') {
    startLevel(state, 0, 'front');
    // Mid-room: the thief halfway across, a guard cone sweeping toward them,
    // a camera cone overhead, loot still on the floor, alarm half full.
    state.player = { x: 560, y: 380 };
    state.level.guards[0].x = 640;
    state.level.guards[0].y = 250;
    state.level.guards[0].dir = Math.PI * 0.72;
    state.level.guards[0].state = 'suspicious';
    state.level.guards[0].suspicion = 0.6;
    state.level.guards[1].x = 980;
    state.level.guards[1].y = 320;
    state.level.guards[1].dir = Math.PI;
    state.level.cameras[0].angle = Math.PI / 2 + 0.4;
    state.level.loot[0].taken = true;
    state.lootValue = 400;
    state.lootTaken = 1;
    state.score = 400;
    state.alarm = 46;
    state.time = 47;
    state.message = 'SPOTTED? No — the cone just missed. Keep to the shadows.';
    state.messageTimer = 99;
    state.screen = 'play';
    return;
  }
  if (shot === 'loot') {
    startLevel(state, 1, 'vent');
    // Cracking the vault: thief beside it, progress bar half full, a guard
    // approaching from the left, camera sweeping, alarm climbing.
    state.player = { x: 640, y: 422 };
    state.level.guards[0].x = 470;
    state.level.guards[0].y = 420;
    state.level.guards[0].dir = 0;
    state.level.guards[0].state = 'suspicious';
    state.level.guards[0].suspicion = 0.5;
    state.level.cameras[0].angle = Math.PI / 2 - 0.5;
    state.crackTarget = state.level.loot[0];
    state.crackProgress = 1.4;
    state.level.loot[1].taken = true;
    state.lootValue = 700;
    state.lootTaken = 1;
    state.score = 700;
    state.alarm = 58;
    state.time = 96;
    state.message = 'Hold E — the vault is almost open…';
    state.messageTimer = 99;
    state.screen = 'play';
    return;
  }
  if (shot === 'end') {
    startLevel(state, 2, 'front');
    for (const item of state.level.loot) item.taken = true;
    state.lootValue = state.level.totalValue;
    state.lootTaken = state.level.loot.length;
    state.totalScore = 8420;
    state.score = 0;
    state.alarm = 22;
    state.time = 184;
    state.screen = 'win';
    return;
  }
  // Unknown shot: just play room 1.
  startLevel(state, 0, 'front');
}
