// Velvet Vault — shared constants: world size, colours, speeds and tool costs.
// Everything visual in the game reads from here so the palette stays consistent.
export const WORLD_W = 1280;
export const WORLD_H = 720;
export const HUD_H = 64;
export const PLAY_TOP = HUD_H + 8;

export const PLAYER_R = 13;
export const PLAYER_SPEED = 165;
export const SNEAK_SPEED = 78;
export const GUARD_SPEED = 95;
export const CHASE_SPEED = 148;
export const GUARD_R = 14;

export const VISION_RANGE = 235;
export const VISION_HALF_ANGLE = 0.62; // radians, about 35 degrees each side
export const CAMERA_RANGE = 250;
export const CAMERA_HALF_ANGLE = 0.5;

export const ALARM_MAX = 100;
export const ALARM_SEEN_RATE = 26; // per second while any watcher sees the thief
export const ALARM_CAMERA_RATE = 34;
export const ALARM_DECAY_RATE = 7;
export const SUSPICION_RATE = 1.6; // per second while the thief is inside a cone
export const SUSPICION_DECAY = 0.55;

export const COIN_COUNT = 3;
export const HACK_COUNT = 2;
export const HACK_DURATION = 8; // seconds cameras stay dark
export const VAULT_CRACK_TIME = 2.5; // seconds holding E beside the vault
export const COIN_LURE_RADIUS = 280;
export const COIN_LURE_TIME = 4;

export const COLORS = {
  floor: '#1c1a2e',
  floorAlt: '#221f38',
  wall: '#3a3454',
  wallTop: '#4c4570',
  cover: '#6b4f2a',
  coverTop: '#8a6a3c',
  plant: '#2e6b3a',
  shadow: '#101a33',
  lootGold: '#ffd34d',
  lootGem: '#7fe7ff',
  lootArt: '#ff9ecf',
  exit: '#39d98a',
  guard: '#ff5d5d',
  guardCalm: '#e8b23a',
  cone: 'rgba(255, 214, 90, 0.20)',
  coneHot: 'rgba(255, 70, 70, 0.30)',
  cameraCone: 'rgba(140, 220, 255, 0.16)',
  player: '#f2f2f7',
  playerCoat: '#23233a',
  hudBg: '#12101f',
  hudText: '#f5f0dc',
  alarmLow: '#39d98a',
  alarmMid: '#ffb02e',
  alarmHigh: '#ff4d4d',
};

// Deterministic random numbers so every level layout is the same on every run.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function nextRandom() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// True when the segment (x1,y1)-(x2,y2) crosses any rect in `rects`.
export function segmentBlocked(x1, y1, x2, y2, rects) {
  for (const r of rects) {
    if (segmentHitsRect(x1, y1, x2, y2, r)) return true;
  }
  return false;
}

function segmentHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  if (dx === 0) {
    if (x1 < r.x || x1 > r.x + r.w) return false;
  } else {
    let t1 = (r.x - x1) / dx;
    let t2 = (r.x + r.w - x1) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  if (dy === 0) {
    if (y1 < r.y || y1 > r.y + r.h) return false;
  } else {
    let t1 = (r.y - y1) / dy;
    let t2 = (r.y + r.h - y1) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}

// Push a circle out of every rect it overlaps; returns nothing, mutates pos.
export function resolveCircleRects(pos, radius, rects) {
  for (const r of rects) {
    const cx = clamp(pos.x, r.x, r.x + r.w);
    const cy = clamp(pos.y, r.y, r.y + r.h);
    const dx = pos.x - cx;
    const dy = pos.y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < radius * radius) {
      if (d2 === 0) {
        pos.y = r.y - radius;
      } else {
        const d = Math.sqrt(d2);
        pos.x = cx + (dx / d) * radius;
        pos.y = cy + (dy / d) * radius;
      }
    }
  }
}
