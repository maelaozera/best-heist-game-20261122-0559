// Velvet Vault — the three rooms. Each level is a fixed, hand-placed layout:
// outer walls, interior walls with door gaps, cover crates and plants that block
// sight, shadow pools where the alarm cools down, patrol routes, cameras,
// loot and the exit. Two entry routes per room: the front door (busy, direct)
// and the vent (quiet, narrow, far from the guards' start).
import { PLAY_TOP, WORLD_H, WORLD_W } from './config.js';

function wall(x, y, w, h) {
  return { x, y, w, h };
}

function loot(x, y, kind, value, label) {
  return { x, y, kind, value, label, taken: false };
}

function guard(x, y, waypoints, speed) {
  return {
    x, y, waypoints, wpIndex: 0, dir: 0, speed,
    state: 'patrol', suspicion: 0, lure: null, lureTimer: 0, pause: 0,
  };
}

function camera(x, y, baseAngle, sweep, speed, phase) {
  return { x, y, baseAngle, sweep, speed, phase, angle: baseAngle, disabled: 0 };
}

const BOUND = 26; // outer wall thickness

function outerWalls() {
  return [
    wall(0, PLAY_TOP - 8, WORLD_W, BOUND), // north (below the HUD strip)
    wall(0, WORLD_H - BOUND, WORLD_W, BOUND), // south
    wall(0, PLAY_TOP - 8, BOUND, WORLD_H), // west
    wall(WORLD_W - BOUND, PLAY_TOP - 8, BOUND, WORLD_H), // east
  ];
}

export const LEVEL_NAMES = [
  'Room 1 — The Velvet Gallery',
  'Room 2 — The Gilded Vault',
  'Room 3 — The Midnight Ledger',
];

export function buildLevel(index) {
  const walls = outerWalls();
  const cover = [];
  const shadows = [];
  const guards = [];
  const cameras = [];
  const lootItems = [];
  let exit;
  let frontSpawn;
  let ventSpawn;

  if (index === 0) {
    // Gallery: one long hall, a central display block, two guards crossing.
    walls.push(wall(430, PLAY_TOP + 60, 26, 220));
    walls.push(wall(430, PLAY_TOP + 360, 26, 170));
    walls.push(wall(820, PLAY_TOP + 60, 26, 170));
    walls.push(wall(820, PLAY_TOP + 310, 26, 220));
    cover.push({ x: 560, y: 300, w: 120, h: 70, kind: 'crate' });
    cover.push({ x: 700, y: 470, w: 90, h: 60, kind: 'plant' });
    cover.push({ x: 180, y: 480, w: 110, h: 60, kind: 'crate' });
    cover.push({ x: 980, y: 180, w: 100, h: 60, kind: 'plant' });
    shadows.push({ x: 60, y: 120, w: 150, h: 110 });
    shadows.push({ x: 1060, y: 480, w: 150, h: 130 });
    shadows.push({ x: 560, y: 560, w: 180, h: 80 });
    guards.push(guard(640, 200, [[640, 200], [640, 560], [300, 560], [300, 200]], 92));
    guards.push(guard(1050, 480, [[1050, 480], [900, 480], [900, 220], [1050, 220]], 88));
    cameras.push(camera(640, PLAY_TOP + 4, Math.PI / 2, 0.9, 0.55, 0));
    lootItems.push(loot(640, 150, 'painting', 400, 'Velvet Portrait'));
    lootItems.push(loot(1120, 620, 'gem', 600, 'Star Sapphire'));
    lootItems.push(loot(120, 620, 'gold', 250, 'Gold Bars'));
    exit = { x: 1180, y: 90, w: 60, h: 44 };
    frontSpawn = { x: 80, y: 640 };
    ventSpawn = { x: 1220, y: 640 };
  } else if (index === 1) {
    // Vault: cross-shaped walls, a central vault, three guards, two cameras.
    walls.push(wall(300, PLAY_TOP + 40, 26, 200));
    walls.push(wall(300, PLAY_TOP + 320, 26, 200));
    walls.push(wall(940, PLAY_TOP + 40, 26, 200));
    walls.push(wall(940, PLAY_TOP + 320, 26, 200));
    walls.push(wall(560, PLAY_TOP + 240, 220, 26));
    cover.push({ x: 120, y: 180, w: 110, h: 60, kind: 'crate' });
    cover.push({ x: 480, y: 120, w: 90, h: 60, kind: 'plant' });
    cover.push({ x: 820, y: 480, w: 110, h: 60, kind: 'crate' });
    cover.push({ x: 1080, y: 160, w: 90, h: 60, kind: 'plant' });
    cover.push({ x: 180, y: 500, w: 100, h: 60, kind: 'crate' });
    shadows.push({ x: 60, y: 110, w: 140, h: 100 });
    shadows.push({ x: 1060, y: 520, w: 150, h: 100 });
    shadows.push({ x: 360, y: 560, w: 170, h: 70 });
    guards.push(guard(640, 160, [[640, 160], [640, 480], [420, 480], [420, 160]], 100));
    guards.push(guard(1100, 300, [[1100, 300], [1100, 560], [860, 560], [860, 300]], 96));
    guards.push(guard(180, 300, [[180, 300], [180, 560], [380, 560], [380, 300]], 96));
    cameras.push(camera(640, PLAY_TOP + 4, Math.PI / 2, 1.1, 0.7, 0));
    cameras.push(camera(1228, 360, Math.PI, 0.9, 0.6, 1.4));
    lootItems.push(loot(640, 340, 'vault', 1200, 'The Gilded Vault'));
    lootItems.push(loot(1150, 130, 'gem', 700, 'Emerald Eye'));
    // Painting sits clear of the top-left shadow pool so its ART label
    // never overlaps the "SHADOW — HIDE HERE" text.
    lootItems.push(loot(250, 130, 'painting', 500, 'Midnight Ledger'));
    lootItems.push(loot(1150, 620, 'gold', 300, 'Gold Bars'));
    exit = { x: 1180, y: 90, w: 60, h: 44 };
    frontSpawn = { x: 80, y: 640 };
    ventSpawn = { x: 1220, y: 640 };
  } else {
    // Ledger: tightest room, four guards, three cameras, alarm bites faster.
    walls.push(wall(260, PLAY_TOP + 40, 26, 180));
    walls.push(wall(260, PLAY_TOP + 300, 26, 220));
    walls.push(wall(640, PLAY_TOP + 40, 26, 150));
    walls.push(wall(640, PLAY_TOP + 270, 26, 250));
    walls.push(wall(1010, PLAY_TOP + 40, 26, 180));
    walls.push(wall(1010, PLAY_TOP + 300, 26, 220));
    walls.push(wall(760, PLAY_TOP + 240, 180, 26));
    cover.push({ x: 120, y: 160, w: 100, h: 56, kind: 'crate' });
    cover.push({ x: 420, y: 120, w: 90, h: 56, kind: 'plant' });
    cover.push({ x: 830, y: 120, w: 90, h: 56, kind: 'plant' });
    cover.push({ x: 1120, y: 480, w: 100, h: 56, kind: 'crate' });
    cover.push({ x: 180, y: 520, w: 100, h: 56, kind: 'crate' });
    cover.push({ x: 480, y: 520, w: 110, h: 56, kind: 'crate' });
    shadows.push({ x: 60, y: 110, w: 130, h: 100 });
    shadows.push({ x: 1090, y: 560, w: 140, h: 80 });
    shadows.push({ x: 700, y: 560, w: 150, h: 70 });
    guards.push(guard(470, 180, [[470, 180], [470, 540], [180, 540], [180, 180]], 108));
    guards.push(guard(830, 180, [[830, 180], [830, 540], [1120, 540], [1120, 180]], 104));
    guards.push(guard(640, 420, [[640, 420], [940, 420], [940, 560], [640, 560]], 100));
    guards.push(guard(1120, 300, [[1120, 300], [1120, 120], [900, 120], [900, 300]], 100));
    cameras.push(camera(470, PLAY_TOP + 4, Math.PI / 2, 1.2, 0.85, 0));
    cameras.push(camera(830, PLAY_TOP + 4, Math.PI / 2, 1.2, 0.8, 2.1));
    cameras.push(camera(1228, 360, Math.PI, 1.0, 0.7, 0.9));
    lootItems.push(loot(640, 340, 'vault', 1500, 'The Midnight Ledger'));
    lootItems.push(loot(120, 120, 'gem', 800, 'Black Diamond'));
    lootItems.push(loot(1160, 120, 'painting', 600, 'Heiress Portrait'));
    lootItems.push(loot(120, 620, 'gold', 350, 'Gold Bars'));
    lootItems.push(loot(1160, 620, 'gem', 700, 'Ruby Heart'));
    exit = { x: 1180, y: 90, w: 60, h: 44 };
    frontSpawn = { x: 80, y: 640 };
    ventSpawn = { x: 1220, y: 640 };
  }

  const solids = walls.concat(cover.map((c) => ({ x: c.x, y: c.y, w: c.w, h: c.h })));
  return {
    index,
    name: LEVEL_NAMES[index],
    walls,
    cover,
    shadows,
    solids,
    guards,
    cameras,
    loot: lootItems,
    exit,
    frontSpawn,
    ventSpawn,
    alarmSensitivity: index === 2 ? 1.35 : index === 1 ? 1.15 : 1.0,
    totalValue: lootItems.reduce((s, l) => s + l.value, 0),
  };
}
