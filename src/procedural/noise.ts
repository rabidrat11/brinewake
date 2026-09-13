/**
 * Noise field library.
 *
 * Terrain, coral placement, kelp bend, cave carving and colour variation all
 * come from here. Everything is seeded and allocation-free in the hot path.
 */

import { hashInts } from '../core/rng';

const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;
const F3 = 1 / 3;
const G3 = 1 / 6;

const GRAD3 = new Int8Array([
  1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0,
  1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1,
  0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1,
]);

/** Classic simplex noise on a permutation table. Deterministic per seed. */
export class Simplex {
  private perm = new Uint8Array(512);
  private permMod12 = new Uint8Array(512);

  constructor(seed: number | string = 0) {
    const s = typeof seed === 'string' ? hashInts(...[...seed].map((c) => c.charCodeAt(0))) : seed;
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    // Deterministic shuffle driven by the seed.
    let state = (s >>> 0) || 1;
    for (let i = 255; i > 0; i--) {
      state = (state + 0x6d2b79f5) | 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      const r = ((t ^ (t >>> 14)) >>> 0) % (i + 1);
      const tmp = p[i];
      p[i] = p[r];
      p[r] = tmp;
    }
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
  }

  /** 2D simplex noise in roughly [-1,1]. */
  noise2(xin: number, yin: number): number {
    const perm = this.perm;
    const permMod12 = this.permMod12;
    let n0 = 0, n1 = 0, n2 = 0;
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const X0 = i - t, Y0 = j - t;
    const x0 = xin - X0, y0 = yin - Y0;
    let i1: number, j1: number;
    if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      const gi0 = permMod12[ii + perm[jj]] * 3;
      t0 *= t0;
      n0 = t0 * t0 * (GRAD3[gi0] * x0 + GRAD3[gi0 + 1] * y0);
    }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      const gi1 = permMod12[ii + i1 + perm[jj + j1]] * 3;
      t1 *= t1;
      n1 = t1 * t1 * (GRAD3[gi1] * x1 + GRAD3[gi1 + 1] * y1);
    }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      const gi2 = permMod12[ii + 1 + perm[jj + 1]] * 3;
      t2 *= t2;
      n2 = t2 * t2 * (GRAD3[gi2] * x2 + GRAD3[gi2 + 1] * y2);
    }
    return 70 * (n0 + n1 + n2);
  }

  /** 3D simplex noise in roughly [-1,1]. Used for caves and drifting fields. */
  noise3(xin: number, yin: number, zin: number): number {
    const perm = this.perm;
    const permMod12 = this.permMod12;
    let n0 = 0, n1 = 0, n2 = 0, n3 = 0;
    const s = (xin + yin + zin) * F3;
    const i = Math.floor(xin + s), j = Math.floor(yin + s), k = Math.floor(zin + s);
    const t = (i + j + k) * G3;
    const x0 = xin - (i - t), y0 = yin - (j - t), z0 = zin - (k - t);
    let i1: number, j1: number, k1: number, i2: number, j2: number, k2: number;
    if (x0 >= y0) {
      if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
      else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
      else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
    } else {
      if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
      else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
      else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
    }
    const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3;
    const x3 = x0 - 1 + 3 * G3, y3 = y0 - 1 + 3 * G3, z3 = z0 - 1 + 3 * G3;
    const ii = i & 255, jj = j & 255, kk = k & 255;
    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 >= 0) {
      const gi0 = permMod12[ii + perm[jj + perm[kk]]] * 3;
      t0 *= t0;
      n0 = t0 * t0 * (GRAD3[gi0] * x0 + GRAD3[gi0 + 1] * y0 + GRAD3[gi0 + 2] * z0);
    }
    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 >= 0) {
      const gi1 = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]] * 3;
      t1 *= t1;
      n1 = t1 * t1 * (GRAD3[gi1] * x1 + GRAD3[gi1 + 1] * y1 + GRAD3[gi1 + 2] * z1);
    }
    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 >= 0) {
      const gi2 = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]] * 3;
      t2 *= t2;
      n2 = t2 * t2 * (GRAD3[gi2] * x2 + GRAD3[gi2 + 1] * y2 + GRAD3[gi2 + 2] * z2);
    }
    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 >= 0) {
      const gi3 = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]] * 3;
      t3 *= t3;
      n3 = t3 * t3 * (GRAD3[gi3] * x3 + GRAD3[gi3 + 1] * y3 + GRAD3[gi3 + 2] * z3);
    }
    return 32 * (n0 + n1 + n2 + n3);
  }

  /** Fractal Brownian motion. */
  fbm2(x: number, y: number, octaves = 4, lacunarity = 2, gain = 0.5): number {
    let amp = 1, freq = 1, sum = 0, norm = 0;
    for (let o = 0; o < octaves; o++) {
      sum += amp * this.noise2(x * freq, y * freq);
      norm += amp;
      amp *= gain;
      freq *= lacunarity;
    }
    return sum / norm;
  }

  fbm3(x: number, y: number, z: number, octaves = 4, lacunarity = 2, gain = 0.5): number {
    let amp = 1, freq = 1, sum = 0, norm = 0;
    for (let o = 0; o < octaves; o++) {
      sum += amp * this.noise3(x * freq, y * freq, z * freq);
      norm += amp;
      amp *= gain;
      freq *= lacunarity;
    }
    return sum / norm;
  }

  /** Ridged multifractal — sharp crests, good for canyon walls and reef spines. */
  ridged2(x: number, y: number, octaves = 4, lacunarity = 2, gain = 0.5): number {
    let amp = 1, freq = 1, sum = 0, norm = 0;
    for (let o = 0; o < octaves; o++) {
      const n = 1 - Math.abs(this.noise2(x * freq, y * freq));
      sum += amp * n * n;
      norm += amp;
      amp *= gain;
      freq *= lacunarity;
    }
    return sum / norm;
  }

  /** Billowy noise — rounded blobs, good for sediment mounds and cloudy silt. */
  billow2(x: number, y: number, octaves = 4): number {
    let amp = 1, freq = 1, sum = 0, norm = 0;
    for (let o = 0; o < octaves; o++) {
      sum += amp * Math.abs(this.noise2(x * freq, y * freq));
      norm += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return (sum / norm) * 2 - 1;
  }

  /** Domain-warped fbm — removes the "noise mush" look from open terrain. */
  warped2(x: number, y: number, warp = 0.5, octaves = 4): number {
    const qx = this.fbm2(x + 0.31, y + 5.7, 2);
    const qy = this.fbm2(x + 9.2, y + 1.3, 2);
    return this.fbm2(x + warp * qx, y + warp * qy, octaves);
  }
}

/**
 * Worley / cellular noise. Returns distance to the nearest feature point,
 * normalised to roughly [0,1]. Used for basalt cracking, crystal clusters,
 * scale patterns and coral cell structure.
 */
export function worley2(x: number, y: number, seed = 0): number {
  const xi = Math.floor(x), yi = Math.floor(y);
  let best = 8;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const cx = xi + dx, cy = yi + dy;
      const h = hashInts(cx, cy, seed);
      const px = cx + ((h & 0xffff) / 65536);
      const py = cy + (((h >>> 16) & 0xffff) / 65536);
      const ddx = px - x, ddy = py - y;
      const d = ddx * ddx + ddy * ddy;
      if (d < best) best = d;
    }
  }
  return Math.min(1, Math.sqrt(best));
}

/** Worley F2-F1 — produces cell *edges* rather than cell centres. */
export function worleyEdge2(x: number, y: number, seed = 0): number {
  const xi = Math.floor(x), yi = Math.floor(y);
  let b1 = 8, b2 = 8;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const cx = xi + dx, cy = yi + dy;
      const h = hashInts(cx, cy, seed);
      const px = cx + ((h & 0xffff) / 65536);
      const py = cy + (((h >>> 16) & 0xffff) / 65536);
      const ddx = px - x, ddy = py - y;
      const d = Math.sqrt(ddx * ddx + ddy * ddy);
      if (d < b1) { b2 = b1; b1 = d; } else if (d < b2) { b2 = d; }
    }
  }
  return Math.min(1, b2 - b1);
}

/** Cheap value noise for texture generation where quality matters less. */
export function valueNoise2(x: number, y: number, seed = 0): number {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hashInts(xi, yi, seed) / 4294967296;
  const b = hashInts(xi + 1, yi, seed) / 4294967296;
  const c = hashInts(xi, yi + 1, seed) / 4294967296;
  const d = hashInts(xi + 1, yi + 1, seed) / 4294967296;
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

export function valueFbm2(x: number, y: number, octaves = 4, seed = 0): number {
  let amp = 1, freq = 1, sum = 0, norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * valueNoise2(x * freq, y * freq, seed + o * 977);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}
