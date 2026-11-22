// Velvet Vault — keyboard + mouse input, kept in one place so the game loop
// only reads a plain object. Keys are tracked by code, so WASD and arrows
// both work, and the mouse position is kept in world coordinates.
export function createInput(canvas) {
  const keys = new Set();
  const input = {
    keys,
    mouseX: 640,
    mouseY: 360,
    mouseClicked: false,
    clickX: 0,
    clickY: 0,
    pressed: new Set(), // edge-triggered keys, consumed by the loop each frame
  };

  const KEYMAP = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
    ShiftLeft: 'sneak', ShiftRight: 'sneak',
    KeyE: 'interact',
    KeyQ: 'coin',
    KeyH: 'hack',
    Space: 'pause',
    Enter: 'confirm',
    Digit1: 'route1',
    Digit2: 'route2',
    KeyM: 'mute',
    KeyR: 'restart',
  };

  window.addEventListener('keydown', (e) => {
    const action = KEYMAP[e.code];
    if (action) {
      if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
      if (!e.repeat) input.pressed.add(action);
      keys.add(action);
    }
  });
  window.addEventListener('keyup', (e) => {
    const action = KEYMAP[e.code];
    if (action) keys.delete(action);
  });
  window.addEventListener('blur', () => keys.clear());

  function updateMouse(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = 1280 / rect.width;
    const scaleY = 720 / rect.height;
    input.mouseX = (e.clientX - rect.left) * scaleX;
    input.mouseY = (e.clientY - rect.top) * scaleY;
  }
  canvas.addEventListener('mousemove', updateMouse);
  canvas.addEventListener('mousedown', (e) => {
    updateMouse(e);
    input.mouseClicked = true;
    input.clickX = input.mouseX;
    input.clickY = input.mouseY;
  });
  return input;
}

export function consumePressed(input, action) {
  if (input.pressed.has(action)) {
    input.pressed.delete(action);
    return true;
  }
  return false;
}

export function endFrame(input) {
  input.pressed.clear();
  input.mouseClicked = false;
}
