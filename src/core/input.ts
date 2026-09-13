/**
 * Input.
 *
 * An action-based layer over keyboard, mouse and gamepad. Nothing in the game
 * reads `KeyW`; systems ask for the `thrust` axis or whether `sonar` was
 * pressed this frame. That is what makes remapping and controller support a
 * data change rather than a refactor.
 */

export type ActionId =
  | 'thrustForward' | 'thrustBack' | 'strafeLeft' | 'strafeRight'
  | 'ascend' | 'descend' | 'boost' | 'brake'
  | 'lookLeft' | 'lookRight' | 'lookUp' | 'lookDown'
  | 'useTool' | 'altTool' | 'nextTool' | 'prevTool'
  | 'lights' | 'sonar' | 'scan' | 'interact' | 'camera'
  | 'map' | 'inventory' | 'catalogue' | 'research' | 'quests' | 'sub'
  | 'pause' | 'cancel' | 'confirm' | 'freeLook' | 'zoom' | 'debug'
  | 'quickSell' | 'photo' | 'ping';

export interface Binding {
  /** KeyboardEvent.code values. */
  keys?: string[];
  /** Mouse buttons: 0 left, 1 middle, 2 right. */
  mouse?: number[];
  /** Gamepad button indices (standard mapping). */
  pad?: number[];
  /** Gamepad axis as [index, direction] where direction is +1 or -1. */
  padAxis?: [number, number];
}

export const DEFAULT_BINDINGS: Record<ActionId, Binding> = {
  thrustForward: { keys: ['KeyW', 'ArrowUp'], padAxis: [1, -1] },
  thrustBack: { keys: ['KeyS', 'ArrowDown'], padAxis: [1, 1] },
  strafeLeft: { keys: ['KeyA', 'ArrowLeft'], padAxis: [0, -1] },
  strafeRight: { keys: ['KeyD', 'ArrowRight'], padAxis: [0, 1] },
  ascend: { keys: ['Space'], pad: [7] },
  descend: { keys: ['ShiftLeft', 'ShiftRight'], pad: [6] },
  boost: { keys: ['KeyE'], pad: [10] },
  brake: { keys: ['KeyQ'], pad: [11] },
  lookLeft: { keys: [], padAxis: [2, -1] },
  lookRight: { keys: [], padAxis: [2, 1] },
  lookUp: { keys: [], padAxis: [3, -1] },
  lookDown: { keys: [], padAxis: [3, 1] },
  useTool: { mouse: [0], pad: [5] },
  altTool: { mouse: [2], pad: [4] },
  nextTool: { keys: ['KeyX'], pad: [3] },
  prevTool: { keys: ['KeyZ'] },
  lights: { keys: ['KeyF'], pad: [2] },
  sonar: { keys: ['KeyR'], pad: [0] },
  scan: { keys: ['KeyC'], pad: [1] },
  interact: { keys: ['KeyE'] },
  camera: { keys: ['KeyV'] },
  map: { keys: ['KeyM'], pad: [8] },
  inventory: { keys: ['KeyI', 'Tab'] },
  catalogue: { keys: ['KeyB'] },
  research: { keys: ['KeyN'] },
  quests: { keys: ['KeyJ'] },
  sub: { keys: ['KeyU'] },
  pause: { keys: ['Escape'], pad: [9] },
  cancel: { keys: ['Escape'], pad: [1] },
  confirm: { keys: ['Enter'], pad: [0] },
  freeLook: { keys: ['AltLeft'], mouse: [1] },
  zoom: { keys: ['KeyT'] },
  debug: { keys: ['Backquote'] },
  quickSell: { keys: ['KeyG'] },
  photo: { keys: ['KeyP'] },
  ping: { keys: ['KeyH'] },
};

interface PointerState {
  x: number;
  y: number;
  dx: number;
  dy: number;
  wheel: number;
  locked: boolean;
}

export class Input {
  private down = new Set<string>();
  private pressedThisFrame = new Set<string>();
  private releasedThisFrame = new Set<string>();
  private mouseDown = new Set<number>();
  private mousePressed = new Set<number>();
  private mouseReleased = new Set<number>();
  private bindings: Record<ActionId, Binding>;
  private padIndex: number | null = null;
  private prevPadButtons: boolean[] = [];

  readonly pointer: PointerState = { x: 0, y: 0, dx: 0, dy: 0, wheel: 0, locked: false };

  /** Set while a text field or modal has focus; movement input is suppressed. */
  uiCaptured = false;
  /** Mouse sensitivity multiplier. */
  sensitivity = 1;
  invertY = false;
  /** Gamepad dead zone. */
  deadZone = 0.16;
  /** Set false to ignore gamepads entirely. */
  gamepadEnabled = true;

  private el: HTMLElement;

  constructor(el: HTMLElement, bindings?: Partial<Record<ActionId, Binding>>) {
    this.el = el;
    this.bindings = { ...DEFAULT_BINDINGS, ...(bindings ?? {}) } as Record<ActionId, Binding>;
    window.addEventListener('keydown', this.onKeyDown, { passive: false });
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    el.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mousemove', this.onMouseMove);
    el.addEventListener('wheel', this.onWheel, { passive: false });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    window.addEventListener('gamepadconnected', this.onGamepadConnected);
    window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected);
  }

  setBinding(action: ActionId, binding: Binding): void {
    this.bindings[action] = binding;
  }

  getBinding(action: ActionId): Binding {
    return this.bindings[action];
  }

  getBindings(): Record<ActionId, Binding> {
    return this.bindings;
  }

  resetBindings(): void {
    this.bindings = { ...DEFAULT_BINDINGS };
  }

  /** Human-readable label for the primary key bound to an action. */
  label(action: ActionId): string {
    const b = this.bindings[action];
    if (b.keys && b.keys.length) return keyLabel(b.keys[0]);
    if (b.mouse && b.mouse.length) return ['LMB', 'MMB', 'RMB'][b.mouse[0]] ?? 'Mouse';
    return '—';
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.repeat) return;
    // Tab and Space would otherwise scroll or move focus.
    if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      if (!this.uiCaptured) e.preventDefault();
    }
    this.down.add(e.code);
    this.pressedThisFrame.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.down.delete(e.code);
    this.releasedThisFrame.add(e.code);
  };

  private onBlur = (): void => {
    this.down.clear();
    this.mouseDown.clear();
  };

  private onMouseDown = (e: MouseEvent): void => {
    this.mouseDown.add(e.button);
    this.mousePressed.add(e.button);
  };

  private onMouseUp = (e: MouseEvent): void => {
    this.mouseDown.delete(e.button);
    this.mouseReleased.add(e.button);
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (this.pointer.locked) {
      this.pointer.dx += e.movementX;
      this.pointer.dy += e.movementY;
    } else {
      this.pointer.dx += e.movementX ?? 0;
      this.pointer.dy += e.movementY ?? 0;
    }
    this.pointer.x = e.clientX;
    this.pointer.y = e.clientY;
  };

  private onWheel = (e: WheelEvent): void => {
    if (this.uiCaptured) return;
    e.preventDefault();
    this.pointer.wheel += Math.sign(e.deltaY);
  };

  private onPointerLockChange = (): void => {
    this.pointer.locked = document.pointerLockElement === this.el;
  };

  private onGamepadConnected = (e: GamepadEvent): void => {
    this.padIndex = e.gamepad.index;
  };

  private onGamepadDisconnected = (e: GamepadEvent): void => {
    if (this.padIndex === e.gamepad.index) this.padIndex = null;
  };

  requestPointerLock(): void {
    if (!this.pointer.locked) void this.el.requestPointerLock?.();
  }

  exitPointerLock(): void {
    if (this.pointer.locked) document.exitPointerLock();
  }

  private pad(): Gamepad | null {
    if (!this.gamepadEnabled) return null;
    const pads = navigator.getGamepads?.();
    if (!pads) return null;
    if (this.padIndex !== null && pads[this.padIndex]) return pads[this.padIndex];
    for (const p of pads) if (p && p.connected) return p;
    return null;
  }

  get hasGamepad(): boolean {
    return this.pad() !== null;
  }

  /** Is the action currently held? */
  held(action: ActionId): boolean {
    if (this.uiCaptured && MOVEMENT_ACTIONS.has(action)) return false;
    const b = this.bindings[action];
    if (b.keys) for (const k of b.keys) if (this.down.has(k)) return true;
    if (b.mouse) for (const m of b.mouse) if (this.mouseDown.has(m)) return true;
    const p = this.pad();
    if (p) {
      if (b.pad) for (const i of b.pad) if (p.buttons[i]?.pressed) return true;
      if (b.padAxis) {
        const v = p.axes[b.padAxis[0]] ?? 0;
        if (Math.abs(v) > this.deadZone && Math.sign(v) === b.padAxis[1]) return true;
      }
    }
    return false;
  }

  /** Was the action pressed since the last frame? */
  pressed(action: ActionId): boolean {
    const b = this.bindings[action];
    if (b.keys) for (const k of b.keys) if (this.pressedThisFrame.has(k)) return true;
    if (b.mouse) for (const m of b.mouse) if (this.mousePressed.has(m)) return true;
    const p = this.pad();
    if (p && b.pad) {
      for (const i of b.pad) {
        if (p.buttons[i]?.pressed && !this.prevPadButtons[i]) return true;
      }
    }
    return false;
  }

  released(action: ActionId): boolean {
    const b = this.bindings[action];
    if (b.keys) for (const k of b.keys) if (this.releasedThisFrame.has(k)) return true;
    if (b.mouse) for (const m of b.mouse) if (this.mouseReleased.has(m)) return true;
    return false;
  }

  /** Signed axis from a pair of actions, including analogue stick values. */
  axis(neg: ActionId, pos: ActionId): number {
    let v = 0;
    if (this.held(neg)) v -= 1;
    if (this.held(pos)) v += 1;
    const p = this.pad();
    if (p && !this.uiCaptured) {
      const bn = this.bindings[neg].padAxis;
      const bp = this.bindings[pos].padAxis;
      if (bn && bp && bn[0] === bp[0]) {
        const raw = p.axes[bn[0]] ?? 0;
        if (Math.abs(raw) > this.deadZone) {
          const scaled = (Math.abs(raw) - this.deadZone) / (1 - this.deadZone);
          v = Math.sign(raw) * scaled * (bp[1] > 0 ? 1 : -1);
        }
      }
    }
    return Math.max(-1, Math.min(1, v));
  }

  /** Analogue trigger value 0..1 for an action, falling back to digital. */
  analog(action: ActionId): number {
    const p = this.pad();
    const b = this.bindings[action];
    if (p && b.pad) {
      let best = 0;
      for (const i of b.pad) best = Math.max(best, p.buttons[i]?.value ?? 0);
      if (best > 0.02) return best;
    }
    return this.held(action) ? 1 : 0;
  }

  /** Look delta for this frame, combining mouse and right stick. */
  lookDelta(out: { x: number; y: number }): void {
    out.x = this.pointer.dx * 0.0022 * this.sensitivity;
    out.y = this.pointer.dy * 0.0022 * this.sensitivity * (this.invertY ? -1 : 1);
    const p = this.pad();
    if (p && !this.uiCaptured) {
      const rx = p.axes[2] ?? 0;
      const ry = p.axes[3] ?? 0;
      if (Math.abs(rx) > this.deadZone) out.x += Math.sign(rx) * (Math.abs(rx) - this.deadZone) * 0.045 * this.sensitivity;
      if (Math.abs(ry) > this.deadZone) {
        out.y += Math.sign(ry) * (Math.abs(ry) - this.deadZone) * 0.045 * this.sensitivity * (this.invertY ? -1 : 1);
      }
    }
  }

  /** Call at the end of each frame. */
  endFrame(): void {
    this.pressedThisFrame.clear();
    this.releasedThisFrame.clear();
    this.mousePressed.clear();
    this.mouseReleased.clear();
    this.pointer.dx = 0;
    this.pointer.dy = 0;
    this.pointer.wheel = 0;
    const p = this.pad();
    if (p) {
      this.prevPadButtons.length = p.buttons.length;
      for (let i = 0; i < p.buttons.length; i++) this.prevPadButtons[i] = p.buttons[i].pressed;
    }
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    window.removeEventListener('gamepadconnected', this.onGamepadConnected);
    window.removeEventListener('gamepaddisconnected', this.onGamepadDisconnected);
  }
}

const MOVEMENT_ACTIONS = new Set<ActionId>([
  'thrustForward', 'thrustBack', 'strafeLeft', 'strafeRight',
  'ascend', 'descend', 'boost', 'brake', 'useTool', 'altTool',
]);

export function keyLabel(code: string): string {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Arrow')) return { Up: '↑', Down: '↓', Left: '←', Right: '→' }[code.slice(5)] ?? code;
  const map: Record<string, string> = {
    Space: 'Space', ShiftLeft: 'L Shift', ShiftRight: 'R Shift',
    ControlLeft: 'L Ctrl', ControlRight: 'R Ctrl', AltLeft: 'Alt', AltRight: 'Alt',
    Escape: 'Esc', Enter: 'Enter', Tab: 'Tab', Backquote: '`',
    BracketLeft: '[', BracketRight: ']', Semicolon: ';', Quote: "'",
    Comma: ',', Period: '.', Slash: '/', Backslash: '\\', Minus: '-', Equal: '=',
  };
  return map[code] ?? code;
}
