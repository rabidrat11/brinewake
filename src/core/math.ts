/** Small numeric helpers shared across simulation and rendering. */

export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function inverseLerp(a: number, b: number, v: number): number {
  return a === b ? 0 : (v - a) / (b - a);
}

export function remap(v: number, inA: number, inB: number, outA: number, outB: number): number {
  return lerp(outA, outB, clamp01(inverseLerp(inA, inB, v)));
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0 || 1));
  return t * t * (3 - 2 * t);
}

export function smootherstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0 || 1));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/**
 * Frame-rate independent exponential approach. `rate` is roughly "how much of
 * the remaining distance is covered per second", expressed as a half-life-ish
 * smoothing constant. Use this everywhere instead of `lerp(a,b,0.1)`.
 */
export function damp(current: number, target: number, rate: number, dt: number): number {
  return lerp(current, target, 1 - Math.exp(-rate * dt));
}

export function dampAngle(current: number, target: number, rate: number, dt: number): number {
  return current + shortestAngle(current, target) * (1 - Math.exp(-rate * dt));
}

/** Signed smallest rotation from `a` to `b`, in radians. */
export function shortestAngle(a: number, b: number): number {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

/** Critically-damped spring step. Returns the new value; velocity is in `vel[0]`. */
export function spring(
  current: number,
  target: number,
  vel: Float32Array | number[],
  index: number,
  stiffness: number,
  damping: number,
  dt: number,
): number {
  const a = (target - current) * stiffness - vel[index] * damping;
  vel[index] += a * dt;
  return current + vel[index] * dt;
}

export function moveTowards(current: number, target: number, maxDelta: number): number {
  const d = target - current;
  if (Math.abs(d) <= maxDelta) return target;
  return current + Math.sign(d) * maxDelta;
}

/** Triangle wave in [0,1] with period 1. */
export function pingPong(t: number): number {
  const x = t - Math.floor(t);
  return x < 0.5 ? x * 2 : 2 - x * 2;
}

export function wrap(v: number, lo: number, hi: number): number {
  const span = hi - lo;
  return lo + ((((v - lo) % span) + span) % span);
}

export function dist2(ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.sqrt(dx * dx + dy * dy);
}

export function dist3(
  ax: number, ay: number, az: number,
  bx: number, by: number, bz: number,
): number {
  const dx = bx - ax, dy = by - ay, dz = bz - az;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function distSq3(
  ax: number, ay: number, az: number,
  bx: number, by: number, bz: number,
): number {
  const dx = bx - ax, dy = by - ay, dz = bz - az;
  return dx * dx + dy * dy + dz * dz;
}

// --- easing ------------------------------------------------------------

export const Ease = {
  linear: (t: number) => t,
  inQuad: (t: number) => t * t,
  outQuad: (t: number) => t * (2 - t),
  inOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  inCubic: (t: number) => t * t * t,
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outQuart: (t: number) => 1 - Math.pow(1 - t, 4),
  outExpo: (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  outBack: (t: number) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  outElastic: (t: number) => {
    if (t === 0 || t === 1) return t;
    const c4 = (2 * Math.PI) / 3;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  inOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
};

/** Format a number of currency units the way the game's UI wants it. */
export function formatMoney(n: number): string {
  const v = Math.round(n);
  return v.toLocaleString('en-GB');
}

export function formatDepth(m: number): string {
  return `${Math.max(0, Math.round(m))} m`;
}

/** 12.4 -> "12.4 cm" / 240 -> "2.4 m" — sizes are stored in centimetres. */
export function formatSize(cm: number): string {
  if (cm >= 100) return `${(cm / 100).toFixed(cm >= 1000 ? 0 : 1)} m`;
  return `${cm.toFixed(cm < 10 ? 1 : 0)} cm`;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function roundTo(v: number, step: number): number {
  return Math.round(v / step) * step;
}
