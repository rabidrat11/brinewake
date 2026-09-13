/**
 * Deterministic pseudo-random number generation.
 *
 * Everything in Brinewake that must look the same on two machines — terrain,
 * scatter, creature proportions, souvenir variants — draws from one of these.
 * They are cheap, allocation-free once constructed, and reproducible from a
 * 32-bit seed.
 */

/** Mix a string into a 32-bit seed. FNV-1a with a final avalanche. */
export function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b);
  h ^= h >>> 16;
  return h >>> 0;
}

/** Combine several integers into one well-mixed 32-bit seed. */
export function hashInts(...values: number[]): number {
  let h = 0x9e3779b9;
  for (let i = 0; i < values.length; i++) {
    let v = values[i] | 0;
    v = Math.imul(v ^ (v >>> 16), 0x45d9f3b);
    v = Math.imul(v ^ (v >>> 16), 0x45d9f3b);
    v ^= v >>> 16;
    h = Math.imul(h ^ v, 0x27220a95);
    h = (h << 13) | (h >>> 19);
  }
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  h = Math.imul(h, 0x297a2d39);
  h ^= h >>> 15;
  return h >>> 0;
}

/** Raw 32-bit hash of 2 coordinates -> [0,1). Stateless; ideal for scatter. */
export function hash2(x: number, y: number, seed = 0): number {
  return hashInts(x, y, seed) / 4294967296;
}

export function hash3(x: number, y: number, z: number, seed = 0): number {
  return hashInts(x, y, z, seed) / 4294967296;
}

/**
 * Small-state generator (mulberry32). ~2ns/call, period 2^32, good enough for
 * every visual and gameplay purpose here and trivially serialisable.
 */
export class Rng {
  private s: number;

  constructor(seed: number | string = 1) {
    this.s = (typeof seed === 'string' ? hashString(seed) : seed >>> 0) || 1;
  }

  /** Current internal state — save/restore for reproducible replays. */
  get state(): number {
    return this.s;
  }
  set state(v: number) {
    this.s = v >>> 0 || 1;
  }

  /** Uniform [0,1). */
  next(): number {
    this.s = (this.s + 0x6d2b79f5) | 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Uniform [min,max). */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** Uniform integer [min,max] inclusive. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** True with probability p. */
  chance(p: number): boolean {
    return this.next() < p;
  }

  /** Symmetric [-a,a). */
  signed(a = 1): number {
    return (this.next() * 2 - 1) * a;
  }

  /** Approximately gaussian via the sum of three uniforms (Bates). */
  gauss(mean = 0, sd = 1): number {
    const u = this.next() + this.next() + this.next();
    return mean + (u - 1.5) * 2 * sd;
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** Weighted pick. `weight` defaults to a numeric `weight` field. */
  pickWeighted<T>(arr: readonly T[], weight: (item: T) => number): T {
    let total = 0;
    for (let i = 0; i < arr.length; i++) total += Math.max(0, weight(arr[i]));
    let r = this.next() * total;
    for (let i = 0; i < arr.length; i++) {
      r -= Math.max(0, weight(arr[i]));
      if (r <= 0) return arr[i];
    }
    return arr[arr.length - 1];
  }

  /** Fisher-Yates, in place. */
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const t = arr[i];
      arr[i] = arr[j];
      arr[j] = t;
    }
    return arr;
  }

  /** Pick `n` distinct entries (or all of them, if the array is shorter). */
  sample<T>(arr: readonly T[], n: number): T[] {
    const copy = arr.slice();
    this.shuffle(copy);
    return copy.slice(0, Math.min(n, copy.length));
  }

  /** A point on the unit sphere, written into `out`. */
  onSphere(out: { x: number; y: number; z: number }): void {
    const z = this.next() * 2 - 1;
    const a = this.next() * Math.PI * 2;
    const r = Math.sqrt(Math.max(0, 1 - z * z));
    out.x = Math.cos(a) * r;
    out.y = Math.sin(a) * r;
    out.z = z;
  }

  /** A fresh independent stream derived from this one — keeps subsystems from
   *  disturbing each other's sequences. */
  fork(tag: string | number = 0): Rng {
    const t = typeof tag === 'string' ? hashString(tag) : tag;
    return new Rng(hashInts(this.s, t, 0x5bf03635));
  }
}

/** Convenience: a generator keyed by a stable name + world seed. */
export function namedRng(worldSeed: number, ...tags: (string | number)[]): Rng {
  let h = worldSeed >>> 0;
  for (const t of tags) h = hashInts(h, typeof t === 'string' ? hashString(t) : t);
  return new Rng(h);
}
