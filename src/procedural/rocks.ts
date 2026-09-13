/**
 * Stone.
 *
 * Rocks are convex polyhedra built from a dozen or so deliberately placed
 * points, hulled into fifteen to twenty-five large flat faces, and shaded
 * per face by which way the face happens to point. No spheres, no noise
 * displacement, no subdivision: the facets *are* the model, and they are big
 * enough to read from thirty metres.
 */

import { Vector3 } from 'three';
import { MeshBuilder } from './geo';
import { S_HEX, S_OCT, S_POINT, S_QUAD, ringFrom } from './sections';
import type { Rng } from '../core/rng';
import { TAU, clamp01, lerp } from '../core/math';
import { mixHex, shift } from './palette';

export interface RockOpts {
  colors: [string, string, string];
  /** 0 worn and rounded .. 1 freshly fractured. */
  angularity?: number;
  /** Vertical stretch. */
  stretch?: number;
  /** Sediment colour dusted onto upward faces. */
  dust?: string;
  /** Algal tint on light-facing surfaces; omitted below the photic zone. */
  moss?: string;
  /** Emissive strength for glowing minerals. */
  glow?: number;
}

/**
 * Face shading rule shared by everything made of stone: up-facing faces catch
 * light and sediment, side faces take the mid tone, down-facing faces go dark.
 * Quantised into steps so adjacent faces differ by a visible amount.
 */
function stoneFace(opts: RockOpts, size: number) {
  const dark = mixHex(opts.colors[0], '#0a0f14', 0.42);
  const mid = opts.colors[1];
  const light = opts.colors[2];
  const dust = opts.dust ?? light;
  const moss = opts.moss;
  return (nx: number, ny: number, nz: number, cx: number, cy: number, cz: number): string => {
    void nx; void nz; void cx; void cz;
    const up = ny;
    let c: string;
    if (up > 0.62) c = mixHex(light, dust, 0.55);
    else if (up > 0.2) c = light;
    else if (up > -0.15) c = mid;
    else if (up > -0.55) c = mixHex(mid, dark, 0.6);
    else c = dark;
    if (moss && up > 0.25) {
      // Patchy, and keyed to position so neighbouring rocks differ.
      const patch = Math.sin(cx * 3.1 + cz * 2.3 + cy * 1.7);
      if (patch > 0.05) c = mixHex(c, moss, 0.28 + 0.22 * clamp01(patch));
    }
    void size;
    return c;
  };
}

/**
 * Generate the point cloud for a stone. Points are placed on a deliberately
 * lopsided envelope — two or three dominant axes, a flat base, and a few
 * pulled-in vertices — so the hull comes out asymmetric and characterful
 * rather than spherical.
 */
function stonePoints(rng: Rng, size: number, opts: RockOpts): [number, number, number][] {
  const ang = opts.angularity ?? 0.5;
  const stretch = opts.stretch ?? 1;
  const half = size * 0.5;
  const pts: [number, number, number][] = [];

  // Three lobe directions give the stone its overall lean.
  const lobes: Vector3[] = [];
  const nLobes = rng.int(2, 3);
  for (let i = 0; i < nLobes; i++) {
    const v = new Vector3();
    rng.onSphere(v);
    v.y = Math.abs(v.y) * 0.6 + 0.2;
    lobes.push(v.normalize());
  }

  // A ring of shoulder vertices plus a top and a base ring: enough for a good
  // silhouette, few enough that every face is large.
  const shoulders = rng.int(5, 7);
  for (let i = 0; i < shoulders; i++) {
    const a = (i / shoulders) * TAU + rng.signed(0.22);
    let r = half * rng.range(0.82, 1.12);
    for (const l of lobes) {
      const dot = Math.cos(a) * l.x + Math.sin(a) * l.z;
      r *= 1 + Math.max(0, dot) * rng.range(0.1, 0.4);
    }
    const y = rng.range(-0.16, 0.22) * half * stretch;
    pts.push([Math.cos(a) * r, y, Math.sin(a) * r]);
  }

  // Upper ring, pulled in and up.
  const upper = rng.int(3, 5);
  for (let i = 0; i < upper; i++) {
    const a = (i / upper) * TAU + rng.signed(0.4);
    const r = half * rng.range(0.34, 0.62);
    pts.push([
      Math.cos(a) * r,
      half * stretch * rng.range(0.55, 0.92),
      Math.sin(a) * r,
    ]);
  }
  // Crown: one or two points, offset so the top is never symmetrical.
  pts.push([
    rng.signed(half * 0.28),
    half * stretch * rng.range(0.86, 1.1),
    rng.signed(half * 0.28),
  ]);
  if (rng.chance(0.5)) {
    pts.push([
      rng.signed(half * 0.4),
      half * stretch * rng.range(0.6, 0.85),
      rng.signed(half * 0.4),
    ]);
  }

  // Flat base ring, so the stone sits on the seabed instead of hovering.
  const base = rng.int(4, 6);
  const baseY = -half * stretch * rng.range(0.34, 0.52);
  for (let i = 0; i < base; i++) {
    const a = (i / base) * TAU + rng.signed(0.3);
    const r = half * rng.range(0.6, 0.95);
    pts.push([Math.cos(a) * r, baseY, Math.sin(a) * r]);
  }

  // Angular stones get a couple of vertices pushed out into sharp corners.
  if (ang > 0.4) {
    const spikes = Math.round(ang * 3);
    for (let i = 0; i < spikes; i++) {
      const v = new Vector3();
      rng.onSphere(v);
      v.y = v.y * 0.6 + 0.2;
      v.normalize().multiplyScalar(half * rng.range(1.05, 1.35));
      pts.push([v.x, Math.max(baseY, v.y * stretch), v.z]);
    }
  }
  return pts;
}

/** A single boulder. Fifteen to twenty-five faces, sitting flat on the ground. */
export function buildBoulder(b: MeshBuilder, rng: Rng, size: number, opts: RockOpts): void {
  const pts = stonePoints(rng, size, opts);
  if (opts.glow) b.setEmissive(opts.glow);
  b.hullShaded(pts, stoneFace(opts, size));
  if (opts.glow) b.setEmissive(0);
}

/** A cluster of stones, leaning on each other. */
export function buildRockFormation(b: MeshBuilder, rng: Rng, size: number, opts: RockOpts): void {
  const count = rng.int(2, 4);
  for (let i = 0; i < count; i++) {
    const s = size * rng.range(0.45, 1);
    const a = rng.next() * TAU;
    const d = i === 0 ? 0 : size * rng.range(0.2, 0.55);
    b.save();
    b.translate(Math.cos(a) * d, s * rng.range(-0.12, 0.12), Math.sin(a) * d);
    b.rotateY(rng.next() * TAU);
    b.rotateZ(rng.signed(0.22));
    buildBoulder(b, rng, s, opts);
    b.restore();
  }
}

/** A jagged outcrop: stacked angular slabs leaning off a spine. */
export function buildOutcrop(b: MeshBuilder, rng: Rng, size: number, opts: RockOpts): void {
  const slabs = rng.int(3, 5);
  const axis = rng.next() * TAU;
  for (let i = 0; i < slabs; i++) {
    const t = i / Math.max(1, slabs - 1);
    const s = size * lerp(1, 0.4, t) * rng.range(0.85, 1.15);
    b.save();
    b.translate(
      Math.cos(axis) * size * 0.24 * i + rng.signed(size * 0.06),
      size * 0.38 * i * rng.range(0.7, 1),
      Math.sin(axis) * size * 0.24 * i + rng.signed(size * 0.06),
    );
    b.rotateY(axis + rng.signed(0.6));
    b.rotateZ(rng.signed(0.45) + 0.1);
    buildBoulder(b, rng, s, { ...opts, angularity: Math.min(1, (opts.angularity ?? 0.5) + 0.35), stretch: rng.range(1.1, 1.7) });
    b.restore();
  }
}

/** Sharp mineral spires: tapered prisms, no cylinders. */
export function buildCrystalCluster(
  b: MeshBuilder, rng: Rng, size: number, colors: string[], glow = 0.4,
): void {
  const count = rng.int(3, 6);
  const base = rng.pick(colors);
  for (let i = 0; i < count; i++) {
    const h = size * rng.range(0.5, 1.4);
    const r = size * rng.range(0.07, 0.17);
    const a = (i / count) * TAU + rng.signed(0.6);
    const d = size * rng.range(0, 0.34);
    const face = shift(base, rng.signed(0.03), rng.signed(0.1), rng.signed(0.12));
    b.save();
    b.translate(Math.cos(a) * d, 0, Math.sin(a) * d);
    b.rotateY(rng.next() * TAU);
    b.rotateZ(rng.signed(0.4));
    b.rotateX(Math.PI / 2);
    b.setColor(face).setEmissive(glow * rng.range(0.6, 1.15));
    b.loft([
      { z: -h * 0.12, pts: ringFrom(S_HEX, r * 1.5, r * 1.5, 0) },
      { z: 0, pts: ringFrom(S_HEX, r, r, 0) },
      { z: h * 0.78, pts: ringFrom(S_HEX, r * 0.82, r * 0.82, 0) },
      { z: h, pts: ringFrom(S_POINT, 0, 0, 0) },
    ]);
    b.setEmissive(0);
    b.restore();
  }
}

/** A hydrothermal chimney: stacked mineral collars, glowing at the mouth. */
export function buildVentChimney(
  b: MeshBuilder, rng: Rng, height: number, rock: string, ember: string,
): void {
  const segs = Math.max(4, Math.round(height / 2.2));
  const rings = [];
  let x = 0, z = 0;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    x += rng.signed(height * 0.045);
    z += rng.signed(height * 0.045);
    const r = height * lerp(0.19, 0.06, Math.pow(t, 0.7)) * rng.range(0.86, 1.16);
    rings.push({ t, x, z, r, y: t * height });
  }
  b.save().rotateX(-Math.PI / 2);
  for (let i = 0; i < rings.length - 1; i++) {
    const a = rings[i], c = rings[i + 1];
    const t = a.t;
    b.setColor(t > 0.78
      ? mixHex(shift(rock, 0, 0, 0.1), ember, (t - 0.78) * 3.4)
      : mixHex(shift(rock, 0, 0.02, 0.02 + (i % 2) * 0.06), shift(rock, 0, 0, 0.14), t));
    b.loft([
      { z: a.y, pts: ringFrom(S_HEX, a.r, a.r, 0).map(([px, py]) => [px + a.x, py + a.z] as [number, number]) },
      { z: c.y, pts: ringFrom(S_HEX, c.r, c.r, 0).map(([px, py]) => [px + c.x, py + c.z] as [number, number]) },
    ], { capStart: false, capEnd: false });
  }
  b.restore();
  // Glowing throat.
  const top = rings[rings.length - 1];
  b.save().translate(top.x, height - 0.02, top.z).rotateX(-Math.PI / 2);
  b.setColor(ember).setEmissive(1);
  b.plate(hexOutline(top.r * 0.7), 0.02);
  b.setEmissive(0);
  b.restore();
  // Mineral flanges.
  const flanges = rng.int(1, 3);
  for (let i = 0; i < flanges; i++) {
    const idx = Math.round(rng.range(0.25, 0.8) * segs);
    const rr = rings[idx];
    b.setColor(shift(rock, 0, 0.05, 0.07));
    b.save().translate(rr.x, rr.y, rr.z).rotateY(rng.next() * TAU).rotateZ(rng.signed(0.3));
    b.rotateX(-Math.PI / 2);
    b.loft([
      { z: 0, pts: ringFrom(S_HEX, rr.r * 1.1, rr.r * 1.1, 0) },
      { z: height * 0.05, pts: ringFrom(S_HEX, rr.r * 1.95, rr.r * 1.95, 0) },
      { z: height * 0.075, pts: ringFrom(S_HEX, rr.r * 1.5, rr.r * 1.5, 0) },
    ]);
    b.restore();
  }
}

function hexOutline(r: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    out.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return out;
}

/** A natural stone arch: a chain of blocks following an arc. */
export function buildStoneArch(
  b: MeshBuilder, rng: Rng, span: number, height: number, opts: RockOpts,
): void {
  const segs = 11;
  for (let i = 0; i < segs; i++) {
    const t = (i + 0.5) / segs;
    const ang = Math.PI * t;
    const x = -Math.cos(ang) * span * 0.5;
    const y = Math.sin(ang) * height;
    const s = span * (0.24 + 0.1 * Math.pow(Math.abs(t - 0.5) * 2, 2));
    b.save();
    b.translate(x, y, rng.signed(span * 0.02));
    b.rotateZ(-ang + Math.PI / 2);
    b.rotateY(rng.signed(0.3));
    buildBoulder(b, rng, s, { ...opts, stretch: 0.75, angularity: 0.7 });
    b.restore();
  }
  for (const side of [-1, 1]) {
    b.save().translate(side * span * 0.5, height * 0.03, 0).rotateY(rng.next() * TAU);
    buildBoulder(b, rng, span * 0.32, opts);
    b.restore();
  }
}

/** Sediment mound with visible strata. */
export function buildSedimentMound(
  b: MeshBuilder, rng: Rng, size: number, colors: string[],
): void {
  const layers = rng.int(3, 4);
  b.save().rotateX(-Math.PI / 2);
  for (let i = 0; i < layers; i++) {
    const t = i / layers;
    const r0 = size * lerp(0.52, 0.16, t) * rng.range(0.92, 1.08);
    const r1 = size * lerp(0.52, 0.16, (i + 1) / layers);
    b.setColor(mixHex(colors[0], colors[1], t * 0.85 + rng.signed(0.06)));
    b.loft([
      { z: size * 0.1 * i, pts: ringFrom(S_OCT, r0, r0, 0) },
      { z: size * 0.1 * (i + 1), pts: ringFrom(S_OCT, r1, r1, 0) },
    ], { capStart: false, capEnd: i === layers - 1 });
  }
  b.restore();
}

/** A scatter of pebbles, each a tiny hull. */
export function buildPebbleField(
  b: MeshBuilder, rng: Rng, radius: number, count: number, colors: string[],
): void {
  for (let i = 0; i < count; i++) {
    const a = rng.next() * TAU;
    const d = Math.sqrt(rng.next()) * radius;
    const s = rng.range(0.14, 0.42);
    b.save();
    b.translate(Math.cos(a) * d, s * 0.12, Math.sin(a) * d);
    b.rotateY(rng.next() * TAU).rotateZ(rng.signed(0.4));
    const c = rng.pick(colors);
    const pts: [number, number, number][] = [];
    const n = 6;
    for (let k = 0; k < n; k++) {
      const aa = (k / n) * TAU;
      pts.push([Math.cos(aa) * s * rng.range(0.7, 1), rng.signed(s * 0.12), Math.sin(aa) * s * rng.range(0.7, 1)]);
    }
    pts.push([rng.signed(s * 0.2), s * 0.42, rng.signed(s * 0.2)]);
    pts.push([rng.signed(s * 0.2), -s * 0.28, rng.signed(s * 0.2)]);
    b.hullShaded(pts, (nx, ny) => {
      void nx;
      return ny > 0.3 ? shift(c, 0, 0, 0.08) : ny > -0.3 ? c : shift(c, 0, 0, -0.16);
    });
    b.restore();
  }
}

/** A geode: a stone shell split open on a glowing core. */
export function buildGeode(
  b: MeshBuilder, rng: Rng, size: number, shell: string, core: string,
): void {
  const opts: RockOpts = { colors: [shell, shell, shift(shell, 0, 0, 0.1)], angularity: 0.8 };
  b.save().rotateZ(0.4);
  buildBoulder(b, rng, size, opts);
  b.restore();
  b.save().translate(0, size * 0.06, size * 0.2).rotateX(-Math.PI / 2);
  b.setColor(core).setEmissive(0.8);
  b.loft([
    { z: 0, pts: ringFrom(S_OCT, size * 0.3, size * 0.3, 0) },
    { z: size * 0.12, pts: ringFrom(S_OCT, size * 0.22, size * 0.22, 0) },
  ]);
  b.setEmissive(0);
  b.restore();
  void S_QUAD;
}
