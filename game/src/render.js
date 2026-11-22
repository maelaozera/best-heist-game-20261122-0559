// Velvet Vault — all drawing. One canvas, one frame: the room, the guards
// with their vision cones, the cameras, the loot, the exit and the alarm
// meter are always on screen together, so a screenshot tells the whole game.
import {
  CAMERA_HALF_ANGLE,
  CAMERA_RANGE,
  COLORS,
  GUARD_R,
  HUD_H,
  PLAYER_R,
  VISION_HALF_ANGLE,
  VISION_RANGE,
  WORLD_H,
  WORLD_W,
} from './config.js';
import { LEVEL_NAMES } from './levels.js';

function drawCone(ctx, x, y, dir, halfAngle, range, fill) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, dir - halfAngle, dir + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
  // Clockwise from the top edge: top-right, bottom-right, bottom-left, top-left.
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawLootIcon(ctx, item) {
  const { x, y, kind } = item;
  if (kind === 'vault') {
    ctx.fillStyle = '#8f8578';
    ctx.fillRect(x - 26, y - 26, 52, 52);
    ctx.strokeStyle = '#e8d9a0';
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 26, y - 26, 52, 52);
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#3a3325';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.lootGold;
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VAULT', x, y + 40);
  } else if (kind === 'gem') {
    ctx.fillStyle = COLORS.lootGem;
    ctx.beginPath();
    ctx.moveTo(x, y - 14);
    ctx.lineTo(x + 12, y);
    ctx.lineTo(x, y + 14);
    ctx.lineTo(x - 12, y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#dff8ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GEM', x, y + 28);
  } else if (kind === 'painting') {
    ctx.fillStyle = '#7a5c1e';
    ctx.fillRect(x - 20, y - 14, 40, 28);
    ctx.fillStyle = COLORS.lootArt;
    ctx.fillRect(x - 16, y - 10, 32, 20);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ART', x, y + 28);
  } else {
    ctx.fillStyle = COLORS.lootGold;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(x + i * 10, y + (i === 0 ? -4 : 4), 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GOLD', x, y + 28);
  }
  // Pulsing halo so loot reads at a glance.
  ctx.strokeStyle = 'rgba(255, 211, 77, 0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 30 + Math.sin(Date.now() / 300) * 3, 0, Math.PI * 2);
  ctx.stroke();
}

function drawGuard(ctx, g) {
  const hot = g.state === 'chase';
  const suspicious = g.state === 'suspicious';
  drawCone(
    ctx, g.x, g.y, g.dir,
    VISION_HALF_ANGLE, VISION_RANGE,
    hot ? COLORS.coneHot : suspicious ? 'rgba(255, 150, 60, 0.26)' : COLORS.cone,
  );
  ctx.fillStyle = hot ? COLORS.guard : COLORS.guardCalm;
  ctx.beginPath();
  ctx.arc(g.x, g.y, GUARD_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1a0d0d';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Facing tick + eyes.
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.lineTo(g.x + Math.cos(g.dir) * 18, g.y + Math.sin(g.dir) * 18);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(hot ? '!' : suspicious ? '?' : '', g.x, g.y - 20);
  // Suspicion arc above the guard.
  if (g.suspicion > 0.05) {
    ctx.strokeStyle = hot ? '#ff4d4d' : '#ffb02e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(g.x, g.y, GUARD_R + 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * g.suspicion);
    ctx.stroke();
  }
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GUARD', g.x, g.y + 30);
}

function drawCamera(ctx, cam) {
  const disabled = cam.disabled > 0;
  drawCone(
    ctx, cam.x, cam.y, cam.angle,
    CAMERA_HALF_ANGLE, CAMERA_RANGE,
    disabled ? 'rgba(120, 120, 120, 0.08)' : COLORS.cameraCone,
  );
  ctx.fillStyle = disabled ? '#777' : '#8cdcff';
  ctx.beginPath();
  ctx.arc(cam.x, cam.y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0b2a3a';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#dff4ff';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(disabled ? 'CAM OFF' : 'CAMERA', cam.x, cam.y + 24);
}

function drawHud(ctx, state) {
  const level = state.level;
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(0, 0, WORLD_W, HUD_H);
  ctx.fillStyle = '#2c2846';
  ctx.fillRect(0, HUD_H - 3, WORLD_W, 3);
  ctx.fillStyle = COLORS.hudText;
  ctx.textAlign = 'left';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('VELVET VAULT', 18, 30);
  ctx.font = '15px sans-serif';
  ctx.fillStyle = '#b9b3d6';
  ctx.fillText(`${LEVEL_NAMES[state.levelIndex]}  ·  Room ${state.levelIndex + 1}/3`, 18, 52);

  // Loot counter.
  ctx.fillStyle = COLORS.lootGold;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`LOOT  $${state.lootValue} / $${level.totalValue}   (${state.lootTaken}/${level.loot.length})`, 330, 30);
  ctx.fillStyle = '#b9b3d6';
  ctx.font = '15px sans-serif';
  ctx.fillText(`SCORE ${state.totalScore + state.score}`, 330, 52);

  // Alarm meter — big, labelled, colour-coded.
  const ax = 640;
  const aw = 260;
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 17px sans-serif';
  ctx.fillText('ALARM', ax, 26);
  ctx.fillStyle = '#2a2438';
  roundRect(ctx, ax + 80, 12, aw, 20, 6);
  ctx.fill();
  const frac = state.alarm / 100;
  ctx.fillStyle = frac < 0.5 ? COLORS.alarmLow : frac < 0.8 ? COLORS.alarmMid : COLORS.alarmHigh;
  if (frac > 0) {
    roundRect(ctx, ax + 80, 12, Math.max(8, aw * frac), 20, 6);
    ctx.fill();
  }
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  roundRect(ctx, ax + 80, 12, aw, 20, 6);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(`${Math.round(state.alarm)}%`, ax + 80 + aw + 10, 28);
  ctx.fillStyle = '#b9b3d6';
  ctx.font = '14px sans-serif';
  ctx.fillText(state.cameraSpotted ? 'CAMERA SEES YOU!' : state.alarm > 60 ? 'HIDE IN SHADOW!' : 'Stay out of the cones', ax, 52);

  // Timer + tools.
  const mins = Math.floor(state.time / 60);
  const secs = Math.floor(state.time % 60);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`TIME ${mins}:${String(secs).padStart(2, '0')}`, WORLD_W - 18, 30);
  ctx.font = '15px sans-serif';
  ctx.fillStyle = '#b9b3d6';
  ctx.fillText(`COINS x${state.coins} (Q / click)   HACK x${state.hacks} (H)`, WORLD_W - 18, 52);
  ctx.textAlign = 'left';
}

function drawMinimap(ctx, state) {
  const mw = 190;
  const mh = 128;
  const mx = WORLD_W - mw - 14;
  const my = WORLD_H - mh - 14;
  const sx = mw / WORLD_W;
  const sy = mh / WORLD_H;
  ctx.fillStyle = 'rgba(10, 8, 20, 0.85)';
  roundRect(ctx, mx, my, mw, mh, 8);
  ctx.fill();
  ctx.strokeStyle = '#4c4570';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#b9b3d6';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('MINIMAP', mx + 8, my + 14);
  const dot = (x, y, r, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(mx + x * sx, my + y * sy, r, 0, Math.PI * 2);
    ctx.fill();
  };
  for (const item of state.level.loot) if (!item.taken) dot(item.x, item.y, 3.5, COLORS.lootGold);
  for (const cam of state.level.cameras) dot(cam.x, cam.y, 3, '#8cdcff');
  for (const g of state.level.guards) dot(g.x, g.y, 3.5, g.state === 'chase' ? '#ff4d4d' : '#ffb02e');
  const ex = state.level.exit;
  ctx.fillStyle = COLORS.exit;
  ctx.fillRect(mx + ex.x * sx - 3, my + ex.y * sy - 3, 6, 6);
  dot(state.player.x, state.player.y, 4.5, '#fff');
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(mx + state.player.x * sx, my + state.player.y * sy, 6, 0, Math.PI * 2);
  ctx.stroke();
}

function drawRoom(ctx, state) {
  const level = state.level;
  // Floor checker.
  const tile = 64;
  for (let y = 0; y < WORLD_H / tile; y++) {
    for (let x = 0; x < WORLD_W / tile; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? COLORS.floor : COLORS.floorAlt;
      ctx.fillRect(x * tile, y * tile, tile, tile);
    }
  }
  // Shadow pools.
  for (const s of level.shadows) {
    ctx.fillStyle = COLORS.shadow;
    roundRect(ctx, s.x, s.y, s.w, s.h, 12);
    ctx.fill();
    ctx.fillStyle = '#5d7ec9';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SHADOW — HIDE HERE', s.x + s.w / 2, s.y + s.h / 2);
  }
  // Cover: crates and plants.
  for (const c of level.cover) {
    if (c.kind === 'crate') {
      ctx.fillStyle = COLORS.cover;
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = COLORS.coverTop;
      ctx.fillRect(c.x + 4, c.y + 4, c.w - 8, 10);
      ctx.strokeStyle = '#3a2c14';
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = '#e8d9a0';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('COVER', c.x + c.w / 2, c.y + c.h / 2 + 4);
    } else {
      ctx.fillStyle = COLORS.plant;
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2 - 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7ed491';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PLANT', c.x + c.w / 2, c.y + c.h / 2 + 4);
    }
  }
  // Walls.
  for (const w of level.walls) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = COLORS.wallTop;
    if (w.h <= 26) ctx.fillRect(w.x, w.y, w.w, 5);
    else ctx.fillRect(w.x, w.y, 5, w.h);
  }
  // Exit door.
  const ex = level.exit;
  const allLoot = level.loot.every((l) => l.taken);
  ctx.fillStyle = allLoot ? COLORS.exit : '#3f7d5c';
  ctx.fillRect(ex.x, ex.y, ex.w, ex.h);
  ctx.strokeStyle = '#d9ffe9';
  ctx.lineWidth = 2;
  ctx.strokeRect(ex.x, ex.y, ex.w, ex.h);
  ctx.fillStyle = '#04120a';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(allLoot ? 'EXIT ✓' : 'EXIT', ex.x + ex.w / 2, ex.y + ex.h / 2 + 5);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(allLoot ? 'ESCAPE NOW!' : 'Grab all loot to open', ex.x + ex.w / 2, ex.y - 8);
  // Loot.
  for (const item of level.loot) if (!item.taken) drawLootIcon(ctx, item);
  // Cameras (cones first, then bodies) and guards.
  for (const cam of level.cameras) drawCamera(ctx, cam);
  for (const g of level.guards) drawGuard(ctx, g);
  // Thrown coins.
  for (const c of state.thrownCoins) {
    ctx.fillStyle = COLORS.lootGold;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7a5c1e';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  // The thief.
  const p = state.player;
  ctx.fillStyle = state.sneaking ? '#6b6b8f' : COLORS.playerCoat;
  ctx.beginPath();
  ctx.arc(p.x, p.y, PLAYER_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#111';
  ctx.fillRect(p.x - 8, p.y - 4, 16, 6); // mask band
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(state.sneaking ? 'SNEAKING' : 'THIEF', p.x, p.y - 20);
  // Vault cracking progress.
  if (state.crackTarget) {
    const cx = state.crackTarget.x;
    const cy = state.crackTarget.y - 52;
    ctx.fillStyle = '#111';
    ctx.fillRect(cx - 50, cy - 8, 100, 14);
    ctx.fillStyle = COLORS.lootGold;
    ctx.fillRect(cx - 48, cy - 6, 96 * (state.crackProgress / 2.5), 10);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CRACKING THE VAULT… hold E', cx, cy - 14);
  }
  // Route hint + message.
  if (state.messageTimer > 0 && state.message) {
    ctx.fillStyle = 'rgba(10, 8, 20, 0.85)';
    const w = ctx.measureText(state.message).width + 28;
    roundRect(ctx, WORLD_W / 2 - w / 2, WORLD_H - 60, w, 34, 8);
    ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.message, WORLD_W / 2, WORLD_H - 38);
  }
  if (state.spottedFlash > 0) {
    ctx.fillStyle = `rgba(255, 40, 40, ${0.12 * state.spottedFlash})`;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  }
  drawMinimap(ctx, state);
  // Controls footer.
  ctx.fillStyle = 'rgba(10, 8, 20, 0.8)';
  ctx.fillRect(0, WORLD_H - 26, 420, 26);
  ctx.fillStyle = '#b9b3d6';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('WASD move · Shift sneak · E crack vault · Q / click coin · H hack cameras · Space pause', 10, WORLD_H - 8);
}

function overlay(ctx, title, lines, hint, accent) {
  ctx.fillStyle = 'rgba(8, 6, 18, 0.82)';
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  ctx.fillStyle = accent;
  ctx.font = 'bold 54px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, WORLD_W / 2, 240);
  ctx.fillStyle = '#f5f0dc';
  ctx.font = '20px sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, WORLD_W / 2, 300 + i * 32));
  ctx.fillStyle = '#b9b3d6';
  ctx.font = '17px sans-serif';
  ctx.fillText(hint, WORLD_W / 2, 300 + lines.length * 32 + 30);
}

export function render(ctx, state) {
  ctx.clearRect(0, 0, WORLD_W, WORLD_H);
  if (state.screen === 'title') {
    drawRoom(ctx, state);
    overlay(
      ctx, 'VELVET VAULT',
      [
        'A quiet heist in three rooms. Cross the floor, dodge the cones,',
        'crack the vault, grab every loot and slip out the exit.',
        'Guards patrol. Cameras sweep. The alarm only forgives shadows.',
      ],
      'Press ENTER to plan the heist  ·  WASD move · Shift sneak · E crack · Q coin · H hack',
      COLORS.lootGold,
    );
    return;
  }
  if (state.screen === 'planning') {
    drawRoom(ctx, state);
    overlay(
      ctx, 'PLAN THE HEIST',
      [
        '1 — FRONT DOOR: walk straight in. Fast, but the guards watch it.',
        '2 — VENT: slip in the side vent. Quiet and empty — a longer walk.',
        'Tools cost you: coins (3) lure a guard away · hacks (2) black out cameras 8s.',
        'The vault takes 2.5s of holding E — and standing still is dangerous.',
      ],
      'Press 1 for the front door or 2 for the vent  ·  click a route below works too',
      '#8cdcff',
    );
    // Clickable route boxes.
    ctx.fillStyle = '#2c2846';
    roundRect(ctx, 340, 470, 260, 64, 10);
    ctx.fill();
    roundRect(ctx, 680, 470, 260, 64, 10);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('1 — FRONT DOOR', 470, 508);
    ctx.fillText('2 — VENT', 810, 508);
    return;
  }
  if (state.screen === 'win') {
    drawRoom(ctx, state);
    overlay(
      ctx, 'CLEAN GETAWAY!',
      [
        `Every room robbed. Total score: ${state.totalScore}.`,
        'The Velvet Vault is empty — and nobody ever saw your face.',
      ],
      'Press R to run it again  ·  Press ENTER for the next planning board',
      COLORS.exit,
    );
    return;
  }
  if (state.screen === 'lose') {
    drawRoom(ctx, state);
    overlay(
      ctx, 'CAUGHT!',
      [
        state.loseReason || 'The heist is over.',
        `Loot banked this room: $${state.lootValue} · Alarm peaked at ${Math.round(state.alarm)}%.`,
        'Next time: watch the cones, toss a coin, hide in the shadows.',
      ],
      'Press R to retry this room  ·  Press ENTER to replan',
      '#ff4d4d',
    );
    return;
  }
  if (state.screen === 'paused') {
    drawRoom(ctx, state);
    overlay(ctx, 'PAUSED', ['The guards wait. The cameras keep sweeping.'], 'Press SPACE to resume', '#b9b3d6');
    return;
  }
  drawRoom(ctx, state);
  drawHud(ctx, state);
}
