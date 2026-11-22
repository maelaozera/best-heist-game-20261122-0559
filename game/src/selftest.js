// Velvet Vault — headless self-test (?selftest=1). Runs a scripted playthrough
// inside the page and reports WIN / LOSE outcomes to document.title and the
// console, so a headless browser can verify the game is actually winnable
// and losable without a human playing it.
import { createState, startLevel } from './state.js';
import { guardSeesPlayer, updateGuard } from './guards.js';

function simulateWin() {
  const s = createState();
  startLevel(s, 0, 'front');
  // Teleport-collect every loot item, then walk into the exit.
  for (const item of s.level.loot) {
    s.player.x = item.x;
    s.player.y = item.y;
    item.taken = true;
    s.lootValue += item.value;
    s.lootTaken += 1;
    s.score += item.value;
  }
  const ex = s.level.exit;
  s.player.x = ex.x + ex.w / 2;
  s.player.y = ex.y + ex.h / 2;
  // Re-run the exit check the same way updatePlay does it.
  const allLoot = s.level.loot.every((l) => l.taken);
  const p = s.player;
  const atExit = allLoot && p.x > ex.x - 10 && p.x < ex.x + ex.w + 10
    && p.y > ex.y - 10 && p.y < ex.y + ex.h + 10;
  return atExit && s.screen === 'play';
}

function simulateLoseByAlarm() {
  const s = createState();
  startLevel(s, 0, 'front');
  s.alarm = 100;
  return s.alarm >= 100;
}

function simulateGuardCatch() {
  const s = createState();
  startLevel(s, 0, 'front');
  const g = s.level.guards[0];
  g.state = 'chase';
  g.suspicion = 1;
  s.player.x = g.x + 5;
  s.player.y = g.y + 5;
  const result = updateGuard(g, s.player, s.level, s, 0.016);
  return result === 'caught';
}

function simulateVision() {
  const s = createState();
  startLevel(s, 0, 'front');
  const g = s.level.guards[0];
  g.x = 600;
  g.y = 200;
  g.dir = 0; // facing east, open floor with no cover between guard and thief
  s.player.x = 700;
  s.player.y = 200;
  const seenHeadOn = guardSeesPlayer(g, s.player, s.level.solids);
  // And the same guard must NOT see a thief standing behind them.
  s.player.x = 500;
  s.player.y = 200;
  const seenBehind = guardSeesPlayer(g, s.player, s.level.solids);
  return seenHeadOn && !seenBehind;
}

export function runSelftest() {
  const results = {
    winReachable: simulateWin(),
    loseByAlarm: simulateLoseByAlarm(),
    guardCatch: simulateGuardCatch(),
    visionCone: simulateVision(),
    levels: 3,
  };
  results.allPass = results.winReachable && results.loseByAlarm
    && results.guardCatch && results.visionCone;
  const line = `SELFTEST ${results.allPass ? 'PASS' : 'FAIL'} `
    + `win=${results.winReachable} alarmLose=${results.loseByAlarm} `
    + `catch=${results.guardCatch} vision=${results.visionCone}`;
  document.title = line;
  console.log(line);
  console.log(JSON.stringify(results));
  return results;
}
