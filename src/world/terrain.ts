/**
 * The seabed.
 *
 * A single continuous height field covering roughly 5.8 x 9.3 km, blended from
 * ten art-directed region profiles and then cut by hand-placed macro features
 * (the shelf escarpment, the canyon, the trench, a few seamounts). The
 * blending is what keeps the world from looking like undirected noise: each
 * region contributes its own amplitude, roughness and cliff character, and the
 * transitions between them are deliberate.
 *
 * Everything here is a pure function of (x, z) and the world seed, so terrain
 * is identical on every machine and can be re-derived rather than saved.
 */

import { Vector3 } from 'three';
import { Simplex, worleyEdge2 } from '../procedural/noise';
import { REGIONS } from '../data/regions';
import type { RegionDef, TerrainParams } from './regionTypes';
import { clamp, clamp01, lerp, smoothstep } from '../core/math';

export const WORLD_BOUNDS = {
  minX: -2900, maxX: 2900,
  minZ: -760, maxZ: 8700,
};

/** Height of the encircling land rim above sea level. */
const RIM_HEIGHT = 42;
/** Distance over which the seabed climbs into the rim. */
const RIM_FALLOFF = 520;

export interface TerrainSample {
  /** World-space Y of the seabed (negative below the surface). */
  height: number;
  /** 0 flat .. 1 vertical. */
  slope: number;
  /** Index into REGIONS of the dominant region. */
  region: number;
  /** Blend weight of the dominant region, 0..1. */
  regionWeight: number;
}

interface MacroFeature {
  kind: 'trench' | 'ridge' | 'escarpment' | 'basin' | 'seamount' | 'terrace';
  /** Polyline in world XZ. */
  path: [number, number][];
  /** Half-width of the influence in metres. */
  width: number;
  /** Depth (negative) or height (positive) delta at the centre line. */
  amount: number;
  /** Extra flat floor width for trenches. */
  floor?: number;
  /** Shaping exponent. */
  power?: number;
}

/**
 * Hand-placed macro composition. These are the shapes a player will actually
 * remember: the drop-off, the canyon they thread, the trench they finally
 * dare. Noise fills in between them; it never invents them.
 */
const FEATURES: MacroFeature[] = [
  // The shelf escarpment — the Blue Drop's defining wall.
  {
    kind: 'escarpment',
    path: [[-2600, 2020], [-1500, 2160], [-500, 2260], [500, 2230], [1500, 2120], [2600, 1980]],
    width: 420, amount: -210, power: 1.6,
  },
  // A second, gentler step down into the twilight.
  {
    kind: 'escarpment',
    path: [[-2600, 3050], [-1200, 3160], [200, 3210], [1600, 3120], [2600, 3000]],
    width: 520, amount: -240, power: 1.3,
  },
  // Gloaming Canyon proper: a deep, sinuous cut.
  {
    kind: 'trench',
    path: [
      [-2500, 3900], [-2050, 3620], [-1700, 3380], [-1420, 3120],
      [-1220, 2860], [-1080, 2600], [-1000, 2360],
    ],
    width: 300, amount: -260, floor: 70, power: 1.9,
  },
  // Its tributary, which most pilots miss entirely.
  {
    kind: 'trench',
    path: [[-2150, 4400], [-1900, 4050], [-1740, 3760], [-1690, 3520]],
    width: 190, amount: -190, floor: 40, power: 2.1,
  },
  // The Emberfield rift — young basalt, raised shoulders.
  {
    kind: 'ridge',
    path: [[900, 3900], [1350, 3620], [1750, 3380], [2150, 3160]],
    width: 340, amount: 130, power: 1.4,
  },
  {
    kind: 'trench',
    path: [[900, 3900], [1350, 3620], [1750, 3380], [2150, 3160]],
    width: 110, amount: -150, floor: 26, power: 2.4,
  },
  // Halloway's great terrace: a broad, unnaturally level shelf.
  {
    kind: 'terrace',
    path: [[-350, 4780], [220, 4680], [780, 4600]],
    width: 620, amount: 90, power: 2.2,
  },
  // The Glasswork trench.
  {
    kind: 'trench',
    path: [[-2500, 5900], [-2100, 5620], [-1760, 5440], [-1400, 5280], [-1000, 5180]],
    width: 380, amount: -520, floor: 120, power: 1.7,
  },
  // The Brinewake itself — the deepest cut in the world.
  {
    kind: 'trench',
    path: [
      [-1400, 8200], [-900, 7960], [-450, 7700], [-120, 7420],
      [100, 7120], [220, 6820],
    ],
    width: 640, amount: -2100, floor: 180, power: 1.5,
  },
  // Seamounts: landmarks visible from a long way off.
  { kind: 'seamount', path: [[-560, 900]], width: 300, amount: 46, power: 2 },
  { kind: 'seamount', path: [[1420, 720]], width: 260, amount: 38, power: 2 },
  { kind: 'seamount', path: [[380, 2860]], width: 420, amount: 230, power: 1.8 },
  { kind: 'seamount', path: [[-2050, 2450]], width: 380, amount: 170, power: 1.9 },
  { kind: 'seamount', path: [[2180, 5100]], width: 520, amount: 640, power: 1.7 },
  { kind: 'seamount', path: [[-820, 6100]], width: 460, amount: 420, power: 1.8 },
  { kind: 'seamount', path: [[1650, 7600]], width: 600, amount: 980, power: 1.6 },
  // Ashcombe: the headland the harbour is built on. It rises out of the water
  // and encloses the bay from the north, which is why there is a town here.
  {
    kind: 'seamount',
    path: [[-620, -330], [-220, -300], [180, -300], [560, -330]],
    width: 300, amount: 62, power: 1.25,
  },
  // The shelf the quay stands on: shallow, level, and dredged in front of it.
  { kind: 'terrace', path: [[-160, -152], [160, -152]], width: 90, amount: 16, power: 1.4 },
  // The harbour approach: a dredged channel out of Lantern Bay.
  { kind: 'basin', path: [[0, -138], [0, 120], [30, 440]], width: 96, amount: -7, power: 1.7 },
];

const _tmpWeights = new Float32Array(REGIONS.length);

export class TerrainField {
  readonly seed: number;
  private base: Simplex;
  private detail: Simplex;
  private warp: Simplex;
  private ridge: Simplex;
  private micro: Simplex;

  /** Flattened pads requested by landmarks, applied after everything else. */
  private pads: { x: number; z: number; r: number; y: number; blend: number }[] = [];

  constructor(seed: number) {
    this.seed = seed;
    this.base = new Simplex(seed);
    this.detail = new Simplex(seed + 7717);
    this.warp = new Simplex(seed + 31337);
    this.ridge = new Simplex(seed + 90211);
    this.micro = new Simplex(seed + 5153);
  }

  /** Request a level platform, used by wrecks, ruins and the harbour. */
  addPad(x: number, z: number, radius: number, y: number, blend = 0.5): void {
    this.pads.push({ x, z, r: radius, y, blend });
  }

  clearPads(): void {
    this.pads.length = 0;
  }

  /**
   * Region influence weights at a point, normalised to sum to 1.
   * Written into `out` to avoid per-vertex allocation.
   */
  regionWeights(x: number, z: number, out: Float32Array = _tmpWeights): Float32Array {
    let total = 0;
    for (let i = 0; i < REGIONS.length; i++) {
      const r = REGIONS[i];
      const dx = x - r.centre[0];
      const dz = z - r.centre[1];
      const d = Math.sqrt(dx * dx + dz * dz) / r.radius;
      // Smooth, fast-decaying bump: dominant near the centre, gone by ~1.6r.
      const w = d > 2.2 ? 1e-6 : Math.exp(-d * d * d * 2.4) + 1e-6;
      out[i] = w;
      total += w;
    }
    const inv = 1 / total;
    for (let i = 0; i < REGIONS.length; i++) out[i] *= inv;
    return out;
  }

  /** The region a point most belongs to. */
  dominantRegion(x: number, z: number): RegionDef {
    const w = this.regionWeights(x, z);
    let best = 0;
    for (let i = 1; i < w.length; i++) if (w[i] > w[best]) best = i;
    return REGIONS[best];
  }

  dominantRegionIndex(x: number, z: number): number {
    const w = this.regionWeights(x, z);
    let best = 0;
    for (let i = 1; i < w.length; i++) if (w[i] > w[best]) best = i;
    return best;
  }

  /** Blended terrain parameters at a point. */
  blendedParams(x: number, z: number, out: TerrainParams): TerrainParams {
    const w = this.regionWeights(x, z);
    out.baseDepth = 0; out.amplitude = 0; out.scale = 0; out.ridged = 0;
    out.warp = 0; out.detail = 0; out.cliffiness = 0; out.boulders = 0;
    for (let i = 0; i < REGIONS.length; i++) {
      const t = REGIONS[i].terrain;
      const k = w[i];
      out.baseDepth += t.baseDepth * k;
      out.amplitude += t.amplitude * k;
      out.scale += t.scale * k;
      out.ridged += t.ridged * k;
      out.warp += t.warp * k;
      out.detail += t.detail * k;
      out.cliffiness += t.cliffiness * k;
      out.boulders += t.boulders * k;
    }
    return out;
  }

  /** Seabed height (world Y, negative under water) at a point. */
  height(x: number, z: number): number {
    const p = this.blendedParams(x, z, _params);
    const s = 1 / Math.max(20, p.scale);

    // Domain-warped fractal base.
    const wx = this.warp.noise2(x * s * 0.6, z * s * 0.6) * p.warp * 60;
    const wz = this.warp.noise2(x * s * 0.6 + 91.3, z * s * 0.6 - 17.7) * p.warp * 60;
    const nx = (x + wx) * s;
    const nz = (z + wz) * s;

    const rolling = this.base.fbm2(nx, nz, 4, 2.05, 0.5);
    const ridged = this.ridge.ridged2(nx * 0.85, nz * 0.85, 4, 2.1, 0.55) * 2 - 1;
    let n = lerp(rolling, ridged, clamp01(p.ridged));

    // Cliffiness sharpens the profile without raising the octave count.
    if (p.cliffiness > 0.05) {
      const sharp = Math.sign(n) * Math.pow(Math.abs(n), lerp(1, 0.42, clamp01(p.cliffiness)));
      n = lerp(n, sharp, clamp01(p.cliffiness));
    }

    let h = -p.baseDepth + n * p.amplitude;

    // High-frequency relief: gravel, ripples, small outcrops.
    h += this.detail.fbm2(x * 0.035, z * 0.035, 3, 2.2, 0.45) * p.detail * 3.4;
    h += this.micro.noise2(x * 0.16, z * 0.16) * p.detail * 0.55;

    // Macro features.
    for (let i = 0; i < FEATURES.length; i++) h = applyFeature(FEATURES[i], x, z, h);

    // Sand ripples in flat shallow sediment — reads beautifully under caustics.
    if (h > -160) {
      const rip = Math.sin(x * 0.32 + this.micro.noise2(x * 0.02, z * 0.02) * 6) *
        Math.sin(z * 0.11 + 1.7);
      h += rip * 0.16 * smoothstep(-160, -20, h);
    }

    // Encircling land rim keeps the ocean a bounded, comprehensible place.
    h += this.rim(x, z);

    // Landmark pads.
    for (let i = 0; i < this.pads.length; i++) {
      const pad = this.pads[i];
      const dx = x - pad.x, dz = z - pad.z;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d < pad.r) {
        const t = 1 - smoothstep(pad.r * (1 - pad.blend), pad.r, d);
        h = lerp(h, pad.y, t);
      }
    }

    return h;
  }

  /** Contribution of the world rim: 0 inside, rising to land at the edges. */
  private rim(x: number, z: number): number {
    const b = WORLD_BOUNDS;
    const dx = Math.max(b.minX - x, x - b.maxX, 0);
    const dz = Math.max(b.minZ - z, z - b.maxZ, 0);
    const d = Math.max(dx, dz);
    if (d <= 0) {
      // Inside: a soft shoaling shoulder so the wall does not appear abruptly.
      const inset = Math.min(x - b.minX, b.maxX - x, z - b.minZ, b.maxZ - z);
      if (inset > RIM_FALLOFF) return 0;
      const t = 1 - inset / RIM_FALLOFF;
      const wob = this.base.fbm2(x * 0.004, z * 0.004, 3) * 0.35 + 1;
      return Math.pow(t, 2.6) * 260 * wob;
    }
    const t = clamp01(d / 220);
    return 260 + t * RIM_HEIGHT * 6;
  }

  /** Surface normal, computed by central differences. */
  normal(x: number, z: number, out: Vector3, eps = 1.4): Vector3 {
    const hL = this.height(x - eps, z);
    const hR = this.height(x + eps, z);
    const hD = this.height(x, z - eps);
    const hU = this.height(x, z + eps);
    return out.set(hL - hR, 2 * eps, hD - hU).normalize();
  }

  /** Slope at a point: 0 flat, 1 vertical. */
  slope(x: number, z: number, eps = 1.4): number {
    const n = this.normal(x, z, _nrmTmp, eps);
    return clamp01(1 - n.y);
  }

  sample(x: number, z: number, out: TerrainSample = { height: 0, slope: 0, region: 0, regionWeight: 0 }): TerrainSample {
    out.height = this.height(x, z);
    out.slope = this.slope(x, z);
    const w = this.regionWeights(x, z);
    let best = 0;
    for (let i = 1; i < w.length; i++) if (w[i] > w[best]) best = i;
    out.region = best;
    out.regionWeight = w[best];
    return out;
  }

  /** Is a world point inside the playable basin? */
  inBounds(x: number, z: number): boolean {
    const b = WORLD_BOUNDS;
    return x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ;
  }

  /**
   * How far outside the safe basin a point is, 0..1. Used to warn the pilot
   * and gently turn them around rather than putting an invisible wall up.
   */
  outOfBoundsFactor(x: number, z: number): number {
    const b = WORLD_BOUNDS;
    const inset = Math.min(x - b.minX, b.maxX - x, z - b.minZ, b.maxZ - z);
    if (inset > RIM_FALLOFF * 0.5) return 0;
    return clamp01(1 - inset / (RIM_FALLOFF * 0.5));
  }

  /**
   * Cheap "is there rock between these two points" test, used by sonar and by
   * the camera's collision avoidance. Samples the height field along the ray.
   */
  raycastDown(x: number, z: number, fromY: number): number | null {
    const h = this.height(x, z);
    return fromY >= h ? h : null;
  }

  /** Deterministic cell-noise value used for boulder and detail scatter. */
  cellNoise(x: number, z: number, scale: number): number {
    return worleyEdge2(x * scale, z * scale, this.seed);
  }
}

const _params: TerrainParams = {
  baseDepth: 0, amplitude: 0, scale: 100, ridged: 0,
  warp: 0, detail: 0, cliffiness: 0, boulders: 0,
};
const _nrmTmp = new Vector3();

// --- macro feature evaluation -----------------------------------------

function applyFeature(f: MacroFeature, x: number, z: number, h: number): number {
  const d = distanceToPath(f.path, x, z);
  if (d > f.width) return h;
  const floor = f.floor ?? 0;
  let t: number;
  if (d <= floor) t = 1;
  else t = 1 - (d - floor) / Math.max(1, f.width - floor);
  t = clamp01(t);
  const shaped = Math.pow(t, f.power ?? 1.5);

  switch (f.kind) {
    case 'trench':
      return h + f.amount * shaped;
    case 'ridge':
    case 'seamount':
      return h + f.amount * shaped;
    case 'basin':
      return h + f.amount * shaped;
    case 'escarpment': {
      // One-sided step: deeper on the far side of the line.
      const side = pathSide(f.path, x, z);
      const step = smoothstep(-f.width, f.width, side * f.width);
      return h + f.amount * step;
    }
    case 'terrace': {
      // Pull toward a level plane rather than adding to it.
      const target = h + f.amount;
      return lerp(h, Math.max(h, target), shaped * 0.85);
    }
  }
  return h;
}

/** Distance from a point to a polyline in XZ (single point paths supported). */
function distanceToPath(path: [number, number][], x: number, z: number): number {
  if (path.length === 1) {
    const dx = x - path[0][0], dz = z - path[0][1];
    return Math.sqrt(dx * dx + dz * dz);
  }
  let best = Infinity;
  for (let i = 0; i < path.length - 1; i++) {
    const ax = path[i][0], az = path[i][1];
    const bx = path[i + 1][0], bz = path[i + 1][1];
    const dx = bx - ax, dz = bz - az;
    const len2 = dx * dx + dz * dz;
    let t = len2 > 0 ? ((x - ax) * dx + (z - az) * dz) / len2 : 0;
    t = clamp(t, 0, 1);
    const px = ax + dx * t, pz = az + dz * t;
    const ex = x - px, ez = z - pz;
    const d = ex * ex + ez * ez;
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}

/** Signed side of a polyline (-1 .. 1), used by escarpments. */
function pathSide(path: [number, number][], x: number, z: number): number {
  let bestD = Infinity;
  let sign = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const ax = path[i][0], az = path[i][1];
    const bx = path[i + 1][0], bz = path[i + 1][1];
    const dx = bx - ax, dz = bz - az;
    const len2 = dx * dx + dz * dz;
    let t = len2 > 0 ? ((x - ax) * dx + (z - az) * dz) / len2 : 0;
    t = clamp(t, 0, 1);
    const px = ax + dx * t, pz = az + dz * t;
    const ex = x - px, ez = z - pz;
    const d = ex * ex + ez * ez;
    if (d < bestD) {
      bestD = d;
      sign = Math.sign(dx * ez - dz * ex);
      const dist = Math.sqrt(d);
      sign *= Math.min(1, dist / 200);
    }
  }
  return sign;
}
