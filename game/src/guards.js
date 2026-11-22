// Velvet Vault — watchers: guard patrols, vision cones, suspicion, chasing,
// lures, and the rotating security cameras. Pure geometry, no rendering here.
import {
  ALARM_CAMERA_RATE,
  ALARM_SEEN_RATE,
  CAMERA_HALF_ANGLE,
  CAMERA_RANGE,
  CHASE_SPEED,
  GUARD_R,
  PLAYER_R,
  SUSPICION_DECAY,
  SUSPICION_RATE,
  VISION_HALF_ANGLE,
  VISION_RANGE,
  angleDiff,
  clamp,
  segmentBlocked,
} from './config.js';

export function guardSeesPlayer(guard, player, blockers) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > VISION_RANGE) return false;
  if (Math.abs(angleDiff(Math.atan2(dy, dx), guard.dir)) > VISION_HALF_ANGLE) return false;
  return !segmentBlocked(guard.x, guard.y, player.x, player.y, blockers);
}

export function cameraSeesPlayer(camera, player, blockers) {
  if (camera.disabled > 0) return false;
  const dx = player.x - camera.x;
  const dy = player.y - camera.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CAMERA_RANGE) return false;
  if (Math.abs(angleDiff(Math.atan2(dy, dx), camera.angle)) > CAMERA_HALF_ANGLE) return false;
  return !segmentBlocked(camera.x, camera.y, player.x, player.y, blockers);
}

function moveToward(entity, tx, ty, speed, dt) {
  const dx = tx - entity.x;
  const dy = ty - entity.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const step = Math.min(dist, speed * dt);
  entity.x += (dx / dist) * step;
  entity.y += (dy / dist) * step;
  entity.dir = Math.atan2(dy, dx);
  return dist - step < 2;
}

// Advance one guard for dt seconds. Returns 'caught' when the guard grabs
// the thief, otherwise null. Mutates guard + state.alarm.
export function updateGuard(guard, player, level, state, dt) {
  const blockers = level.solids;
  if (guard.lureTimer > 0) {
    guard.lureTimer -= dt;
    if (guard.lure) {
      moveToward(guard, guard.lure.x, guard.lure.y, guard.speed * 1.15, dt);
      if (Math.hypot(guard.lure.x - guard.x, guard.lure.y - guard.y) < 12) {
        guard.pause = 1.2;
        guard.lure = null;
      }
    }
    if (guard.lureTimer <= 0) guard.lure = null;
    return null;
  }
  if (guard.pause > 0) {
    guard.pause -= dt;
    return null;
  }

  const seen = guardSeesPlayer(guard, player, blockers);
  const sneaking = state.sneaking;
  if (seen) {
    guard.suspicion = clamp(guard.suspicion + SUSPICION_RATE * dt * (sneaking ? 0.45 : 1), 0, 1);
    state.alarm = clamp(state.alarm + ALARM_SEEN_RATE * dt * level.alarmSensitivity * (sneaking ? 0.6 : 1), 0, 100);
    if (guard.suspicion > 0.35 && guard.state === 'patrol') guard.state = 'suspicious';
    if (guard.suspicion >= 0.85) guard.state = 'chase';
  } else {
    guard.suspicion = clamp(guard.suspicion - SUSPICION_DECAY * dt, 0, 1);
    if (guard.suspicion < 0.3 && guard.state === 'suspicious') guard.state = 'patrol';
    if (guard.suspicion < 0.15 && guard.state === 'chase') guard.state = 'patrol';
  }

  if (guard.state === 'chase') {
    moveToward(guard, player.x, player.y, CHASE_SPEED, dt);
    if (Math.hypot(player.x - guard.x, player.y - guard.y) < GUARD_R + PLAYER_R + 2) {
      return 'caught';
    }
  } else {
    const target = guard.waypoints[guard.wpIndex];
    const arrived = moveToward(guard, target[0], target[1], guard.speed, dt);
    if (arrived) {
      guard.wpIndex = (guard.wpIndex + 1) % guard.waypoints.length;
      guard.pause = 0.7;
    }
  }
  return null;
}

export function updateCamera(camera, dt) {
  if (camera.disabled > 0) camera.disabled -= dt;
  camera.angle = camera.baseAngle + Math.sin(performance.now() / 1000 * camera.speed + camera.phase) * camera.sweep;
}

export function anyCameraSees(level, player) {
  for (const cam of level.cameras) {
    if (cameraSeesPlayer(cam, player, level.solids)) return cam;
  }
  return null;
}

export function applyCameraAlarm(state, level, dt) {
  const cam = anyCameraSees(level, state.player);
  if (cam) {
    state.alarm = clamp(state.alarm + ALARM_CAMERA_RATE * dt * level.alarmSensitivity, 0, 100);
    state.cameraSpotted = true;
  } else {
    state.cameraSpotted = false;
  }
  return cam;
}
