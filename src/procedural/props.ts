/**
 * Collectible props.
 *
 * Every object the player can pick up has a model here. They are seen from two
 * or three metres, so each is twenty to seventy triangles with a silhouette
 * that reads instantly: a coin is a disc on edge, a helmet is a sphere with a
 * face plate, a lantern is a box with a handle. Colours come from the item
 * definition, so one builder serves a family of related objects.
 */

import { MeshBuilder } from './geo';
import { S_BOX, S_HEX, S_OCT, S_POINT, S_QUAD, ringFrom } from './sections';
import type { Rng } from '../core/rng';
import { TAU } from '../core/math';
import { mixHex, shift } from './palette';

export interface PropOpts {
  /** Longest dimension in metres. */
  size: number;
  colors: string[];
  rng: Rng;
  /** 0 wrecked .. 1 pristine; drives grime and breakage. */
  condition?: number;
  glow?: number;
}

export type PropBuilder = (b: MeshBuilder, o: PropOpts) => void;

const c0 = (o: PropOpts) => o.colors[0] ?? '#a8a49c';
const c1 = (o: PropOpts) => o.colors[1] ?? shift(c0(o), 0, 0, -0.15);

function poly(sides: number, r: number, phase = 0): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * TAU + phase;
    out.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return out;
}

/** A short prism: the base of half the props in the game. */
function prism(b: MeshBuilder, section: typeof S_OCT, r: number, h: number, taper = 1): void {
  b.loft([
    { z: -h / 2, pts: ringFrom(section, r, r, 0) },
    { z: h / 2, pts: ringFrom(section, r * taper, r * taper, 0) },
  ]);
}

// --- geology ------------------------------------------------------------

const pebble: PropBuilder = (b, o) => {
  const s = o.size * 0.5;
  const pts: [number, number, number][] = [];
  const n = 7;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    pts.push([Math.cos(a) * s * o.rng.range(0.7, 1), o.rng.signed(s * 0.2), Math.sin(a) * s * o.rng.range(0.7, 1)]);
  }
  pts.push([o.rng.signed(s * 0.2), s * 0.62, o.rng.signed(s * 0.2)]);
  pts.push([o.rng.signed(s * 0.2), -s * 0.5, o.rng.signed(s * 0.2)]);
  b.hullShaded(pts, (nx, ny) => (void nx, ny > 0.3 ? c0(o) : ny > -0.3 ? mixHex(c0(o), c1(o), 0.5) : c1(o)));
};

const nodule: PropBuilder = (b, o) => {
  const s = o.size * 0.5;
  const pts: [number, number, number][] = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU;
    const r = s * o.rng.range(0.72, 1.05);
    pts.push([Math.cos(a) * r, o.rng.signed(s * 0.34), Math.sin(a) * r]);
  }
  pts.push([0, s * 0.85, 0], [0, -s * 0.72, 0]);
  b.hullShaded(pts, (nx, ny) => (void nx, ny > 0.25 ? mixHex(c0(o), '#e8e0d0', 0.16) : c1(o)));
};

const shard: PropBuilder = (b, o) => {
  const s = o.size;
  b.setColor(c0(o));
  b.save().rotateZ(o.rng.signed(0.5)).rotateY(o.rng.next() * TAU);
  b.loft([
    { z: -s * 0.5, pts: ringFrom(S_QUAD, s * 0.1, s * 0.06, 0) },
    { z: 0, pts: ringFrom(S_QUAD, s * 0.2, s * 0.1, 0) },
    { z: s * 0.5, pts: ringFrom(S_POINT, 0, 0, 0) },
  ]);
  b.restore();
  b.setColor(c1(o));
  b.save().translate(s * 0.1, -s * 0.1, 0).rotateZ(1).rotateY(1.4);
  b.loft([
    { z: -s * 0.3, pts: ringFrom(S_QUAD, s * 0.07, s * 0.05, 0) },
    { z: s * 0.3, pts: ringFrom(S_POINT, 0, 0, 0) },
  ]);
  b.restore();
};

const crystalProp: PropBuilder = (b, o) => {
  const s = o.size;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU + o.rng.signed(0.4);
    b.setColor(shift(c0(o), 0, o.rng.signed(0.06), o.rng.signed(0.1)));
    b.setEmissive(o.glow ?? 0.35);
    b.save().translate(Math.cos(a) * s * 0.12, 0, Math.sin(a) * s * 0.12);
    b.rotateZ(o.rng.signed(0.5)).rotateY(a).rotateX(-Math.PI / 2);
    const h = s * o.rng.range(0.5, 1);
    b.loft([
      { z: -h * 0.1, pts: ringFrom(S_HEX, s * 0.1, s * 0.1, 0) },
      { z: h * 0.75, pts: ringFrom(S_HEX, s * 0.08, s * 0.08, 0) },
      { z: h, pts: ringFrom(S_POINT, 0, 0, 0) },
    ]);
    b.restore();
    b.setEmissive(0);
  }
};

const slab: PropBuilder = (b, o) => {
  const s = o.size;
  b.setColor(c0(o));
  b.save().rotateY(o.rng.next() * TAU).rotateZ(o.rng.signed(0.2));
  prism(b, S_OCT, s * 0.45, s * 0.14);
  b.restore();
  b.setColor(c1(o));
  b.save().translate(0, s * 0.08, 0).rotateY(o.rng.next() * TAU);
  prism(b, S_OCT, s * 0.3, s * 0.04);
  b.restore();
};

const flake: PropBuilder = (b, o) => {
  const s = o.size;
  for (let i = 0; i < 4; i++) {
    b.setColor(i % 2 ? c0(o) : c1(o));
    b.save().translate(o.rng.signed(s * 0.2), i * s * 0.04, o.rng.signed(s * 0.2));
    b.rotateY(o.rng.next() * TAU).rotateZ(o.rng.signed(0.3));
    b.plate(poly(5, s * o.rng.range(0.15, 0.3)), s * 0.02);
    b.restore();
  }
};

const geode: PropBuilder = (b, o) => {
  const s = o.size * 0.5;
  const pts: [number, number, number][] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    pts.push([Math.cos(a) * s * o.rng.range(0.8, 1), o.rng.signed(s * 0.25), Math.sin(a) * s * o.rng.range(0.8, 1)]);
  }
  pts.push([0, s * 0.9, 0], [0, -s * 0.8, 0]);
  b.hullShaded(pts, (nx, ny) => (void nx, ny > 0 ? c0(o) : shift(c0(o), 0, 0, -0.12)));
  b.save().translate(0, s * 0.1, s * 0.4).rotateX(-Math.PI / 2);
  b.setColor(c1(o)).setEmissive(o.glow ?? 0.55);
  b.plate(poly(7, s * 0.42), s * 0.05);
  b.setEmissive(0);
  b.restore();
};

const ingot: PropBuilder = (b, o) => {
  const s = o.size;
  b.setColor(c0(o));
  b.loft([
    { z: -s * 0.4, pts: ringFrom(S_BOX, s * 0.16, s * 0.1, 0) },
    { z: s * 0.4, pts: ringFrom(S_BOX, s * 0.2, s * 0.13, 0) },
  ]);
  b.setColor(c1(o));
  b.save().translate(0, s * 0.11, 0);
  b.plate([[-s * 0.08, -s * 0.14], [s * 0.08, -s * 0.14], [s * 0.08, s * 0.14], [-s * 0.08, s * 0.14]], s * 0.01);
  b.restore();
};

const pearlProp: PropBuilder = (b, o) => {
  b.setColor(c0(o)).setEmissive(o.glow ?? 0);
  b.gem(o.size * 0.42, 8, 1, 1);
  b.setEmissive(0);
};

const chunk: PropBuilder = (b, o) => {
  const s = o.size * 0.5;
  const pts: [number, number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    pts.push([Math.cos(a) * s * o.rng.range(0.75, 1.1), o.rng.signed(s * 0.4), Math.sin(a) * s * o.rng.range(0.75, 1.1)]);
  }
  pts.push([o.rng.signed(s * 0.3), s * 0.8, o.rng.signed(s * 0.3)]);
  pts.push([0, -s * 0.6, 0]);
  b.hullShaded(pts, (nx, ny) => (void nx, ny > 0.2 ? c0(o) : c1(o)));
};

// --- scrap and machinery ------------------------------------------------

const plate: PropBuilder = (b, o) => {
  const s = o.size;
  b.setColor(c0(o));
  b.save().rotateZ(o.rng.signed(0.25)).rotateX(o.rng.signed(0.2));
  b.plate([
    [-s * 0.45, -s * 0.3], [s * 0.45, -s * 0.32], [s * 0.42, s * 0.3], [-s * 0.46, s * 0.28],
  ], s * 0.05);
  b.restore();
  b.setColor(c1(o));
  for (let i = 0; i < 4; i++) {
    b.save().translate((-0.3 + i * 0.2) * s, s * 0.04, o.rng.signed(s * 0.2));
    b.gem(s * 0.035, 5, 0.6, 0.2);
    b.restore();
  }
};

const coil: PropBuilder = (b, o) => {
  const s = o.size;
  b.setColor(c0(o));
  b.save().rotateX(-Math.PI / 2);
  for (let i = 0; i < 5; i++) {
    b.setColor(i % 2 ? c0(o) : shift(c0(o), 0, 0, -0.08));
    b.loft([
      { z: i * s * 0.07, pts: ringFrom(S_OCT, s * 0.34, s * 0.34, 0) },
      { z: (i + 1) * s * 0.07, pts: ringFrom(S_OCT, s * 0.34, s * 0.34, 0) },
    ], { capStart: i === 0, capEnd: i === 4 });
  }
  b.restore();
  b.setColor(c1(o));
  b.save().rotateX(-Math.PI / 2);
  b.loft([
    { z: -s * 0.02, pts: ringFrom(S_OCT, s * 0.16, s * 0.16, 0) },
    { z: s * 0.38, pts: ringFrom(S_OCT, s * 0.16, s * 0.16, 0) },
  ]);
  b.restore();
};

const gear: PropBuilder = (b, o) => {
  const s = o.size;
  b.setColor(c0(o));
  b.save().rotateX(-Math.PI / 2);
  prism(b, S_OCT, s * 0.32, s * 0.1);
  b.restore();
  const teeth = 8;
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * TAU;
    b.save().translate(Math.cos(a) * s * 0.38, 0, Math.sin(a) * s * 0.38).rotateY(-a);
    b.setColor(i % 2 ? c0(o) : shift(c0(o), 0, 0, 0.06));
    b.plate([[-s * 0.06, -s * 0.05], [s * 0.06, -s * 0.05], [s * 0.05, s * 0.05], [-s * 0.05, s * 0.05]], s * 0.1);
    b.restore();
  }
  b.setColor(c1(o));
  b.save().rotateX(-Math.PI / 2);
  prism(b, S_HEX, s * 0.1, s * 0.12);
  b.restore();
};

const valve: PropBuilder = (b, o) => {
  const s = o.size;
  b.setColor(c0(o));
  b.save().rotateX(-Math.PI / 2);
  b.loft([
    { z: -s * 0.3, pts: ringFrom(S_HEX, s * 0.16, s * 0.16, 0) },
    { z: -s * 0.1, pts: ringFrom(S_HEX, s * 0.22, s * 0.22, 0) },
    { z: s * 0.05, pts: ringFrom(S_HEX, s * 0.2, s * 0.2, 0) },
    { z: s * 0.18, pts: ringFrom(S_HEX, s * 0.1, s * 0.1, 0) },
  ]);
  b.restore();
  // Handwheel.
  b.setColor(c1(o));
  b.save().translate(0, s * 0.28, 0).rotateX(-Math.PI / 2);
  b.plate(poly(8, s * 0.26), s * 0.03);
  b.restore();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU;
    b.save().translate(Math.cos(a) * s * 0.34, 0, Math.sin(a) * s * 0.34).rotateY(-a);
    b.setColor(c0(o));
    prism(b, S_QUAD, s * 0.05, s * 0.14);
    b.restore();
  }
};

const cell: PropBuilder = (b, o) => {
  const s = o.size;
  b.setColor(c0(o));
  b.save().rotateX(-Math.PI / 2);
  prism(b, S_BOX, s * 0.22, s * 0.7);
  b.restore();
  b.setColor(c1(o));
  b.save().translate(0, s * 0.37, 0).rotateX(-Math.PI / 2);
  prism(b, S_BOX, s * 0.16, s * 0.08);
  b.restore();
  for (const side of [-1, 1]) {
    b.save().translate(side * s * 0.1, s * 0.44, 0);
    b.setColor(shift(c1(o), 0, 0, 0.14));
    b.gem(s * 0.05, 5, 0.8, 0.2);
    b.restore();
  }
};

const rivets: PropBuilder = (b, o) => {
  const s = o.size;
  for (let i = 0; i < 7; i++) {
    const a = o.rng.next() * TAU;
    const d = Math.sqrt(o.rng.next()) * s * 0.4;
    b.setColor(i % 2 ? c0(o) : c1(o));
    b.save().translate(Math.cos(a) * d, o.rng.next() * s * 0.05, Math.sin(a) * d);
    b.gem(s * 0.07, 5, 0.7, 0.3);
    b.restore();
  }
};

const lampProp: PropBuilder = (b, o) => {
  const s = o.size;
  b.setColor(c0(o));
  b.save().rotateX(-Math.PI / 2);
  b.loft([
    { z: -s * 0.3, pts: ringFrom(S_OCT, s * 0.2, s * 0.2, 0) },
    { z: s * 0.14, pts: ringFrom(S_OCT, s * 0.26, s * 0.26, 0) },
    { z: s * 0.24, pts: ringFrom(S_OCT, s * 0.22, s * 0.22, 0) },
  ]);
  b.restore();
  b.save().translate(0, s * 0.26, 0).rotateX(-Math.PI / 2);
  b.setColor(c1(o)).setEmissive(o.glow ?? 0.2);
  b.plate(poly(8, s * 0.2), s * 0.02);
  b.setEmissive(0);
  b.restore();
};

const bladeProp: PropBuilder = (b, o) => {
  const s = o.size;
  b.setColor(c0(o));
  b.save().rotateZ(o.rng.signed(0.4));
  b.plate([
    [-s * 0.08, -s * 0.45], [s * 0.14, -s * 0.2], [s * 0.2, s * 0.2],
    [0, s * 0.48], [-s * 0.16, s * 0.1],
  ], s * 0.05);
  b.restore();
};

const beacon: PropBuilder = (b, o) => {
  const s = o.size;
  b.setColor(c0(o));
  b.save().rotateX(-Math.PI / 2);
  b.loft([
    { z: -s * 0.4, pts: ringFrom(S_OCT, s * 0.26, s * 0.26, 0) },
    { z: s * 0.1, pts: ringFrom(S_OCT, s * 0.22, s * 0.22, 0) },
    { z: s * 0.24, pts: ringFrom(S_OCT, s * 0.12, s * 0.12, 0) },
  ]);
  b.restore();
  b.setColor(c1(o)).setEmissive(0.9);
  b.save().translate(0, s * 0.34, 0);
  b.gem(s * 0.11, 6, 1, 0.6);
  b.restore();
  b.setEmissive(0);
  b.setColor(shift(c0(o), 0, 0, -0.1));
  b.save().translate(0, s * 0.05, 0).rotateX(-Math.PI / 2);
  b.plate(poly(8, s * 0.34), s * 0.03);
  b.restore();
};

// --- organic ------------------------------------------------------------

const shellProp: PropBuilder = (b, o) => {
  const s = o.size;
  b.setColor(c0(o));
  b.save().rotateX(-Math.PI / 2);
  b.loft([
    { z: 0, pts: ringFrom(S_OCT, s * 0.42, s * 0.42, 0) },
    { z: s * 0.1, pts: ringFrom(S_OCT, s * 0.32, s * 0.32, 0) },
    { z: s * 0.17, pts: ringFrom(S_OCT, s * 0.16, s * 0.16, 0) },
    { z: s * 0.2, pts: ringFrom(S_POINT, 0, 0, 0) },
  ]);
  b.restore();
  b.setColor(c1(o));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU;
    b.save().translate(Math.cos(a) * s * 0.2, s * 0.09, Math.sin(a) * s * 0.2).rotateY(-a);
    b.plate([[-s * 0.02, -s * 0.16], [s * 0.02, -s * 0.16], [s * 0.02, s * 0.16], [-s * 0.02, s * 0.16]], s * 0.01);
    b.restore();
  }
};

const conch: PropBuilder = (b, o) => {
  const s = o.size;
  const turns = 2.2;
  const segs = 12;
  b.setColor(c0(o));
  for (let i = 0; i < segs; i++) {
    const t0 = i / segs, t1 = (i + 1) / segs;
    const a0 = t0 * turns * TAU, a1 = t1 * turns * TAU;
    const r0 = s * 0.45 * (1 - t0 * 0.85), r1 = s * 0.45 * (1 - t1 * 0.85);
    const y0 = s * 0.42 * t0, y1 = s * 0.42 * t1;
    const d0 = s * 0.3 * (1 - t0 * 0.7), d1 = s * 0.3 * (1 - t1 * 0.7);
    b.setColor(i % 2 ? c0(o) : mixHex(c0(o), c1(o), 0.5));
    b.loft([
      { z: 0, pts: ringFrom(S_HEX, r0, r0, 0).map(([x, y]) => [x + Math.cos(a0) * d0, y + Math.sin(a0) * d0] as [number, number]) },
      { z: 0.001, pts: ringFrom(S_HEX, r1, r1, 0).map(([x, y]) => [x + Math.cos(a1) * d1, y + Math.sin(a1) * d1] as [number, number]) },
    ], { capStart: false, capEnd: false });
    void y0; void y1;
  }
  b.save().rotateX(-Math.PI / 2);
  b.setColor(mixHex(c1(o), '#f0e0d0', 0.4));
  b.loft([
    { z: 0, pts: ringFrom(S_OCT, s * 0.2, s * 0.2, 0) },
    { z: s * 0.44, pts: ringFrom(S_POINT, 0, 0, 0) },
  ]);
  b.restore();
};

const coralProp: PropBuilder = (b, o) => {
  const s = o.size;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU + o.rng.signed(0.4);
    b.setColor(i === 0 ? c0(o) : mixHex(c0(o), c1(o), 0.5));
    b.save().translate(Math.cos(a) * s * 0.08, 0, Math.sin(a) * s * 0.08);
    b.rotateZ(o.rng.signed(0.5)).rotateY(a).rotateX(-Math.PI / 2);
    b.loft([
      { z: 0, pts: ringFrom(S_HEX, s * 0.09, s * 0.09, 0) },
      { z: s * 0.3, pts: ringFrom(S_HEX, s * 0.06, s * 0.06, 0) },
      { z: s * 0.45, pts: ringFrom(S_HEX, s * 0.08, s * 0.08, 0) },
    ]);
    b.restore();
  }
};

const holdfast: PropBuilder = (b, o) => {
  const s = o.size;
  b.setColor(c0(o));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    b.save().rotateY(a).rotateZ(1.1);
    b.loft([
      { z: 0, pts: ringFrom(S_QUAD, s * 0.06, s * 0.06, 0) },
      { z: s * 0.38, pts: ringFrom(S_QUAD, s * 0.03, s * 0.03, 0) },
    ]);
    b.restore();
  }
  b.setColor(c1(o));
  b.save().rotateX(-Math.PI / 2);
  prism(b, S_HEX, s * 0.09, s * 0.4);
  b.restore();
};

const bone: PropBuilder = (b, o) => {
  const s = o.size;
  b.setColor(c0(o));
  b.save().rotateX(-Math.PI / 2);
  b.loft([
    { z: -s * 0.25, pts: ringFrom(S_OCT, s * 0.3, s * 0.3, 0) },
    { z: -s * 0.12, pts: ringFrom(S_OCT, s * 0.18, s * 0.18, 0) },
    { z: s * 0.12, pts: ringFrom(S_OCT, s * 0.18, s * 0.18, 0) },
    { z: s * 0.25, pts: ringFrom(S_OCT, s * 0.3, s * 0.3, 0) },
  ]);
  b.restore();
  b.setColor(c1(o));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU + 0.4;
    b.save().translate(Math.cos(a) * s * 0.24, s * 0.24, Math.sin(a) * s * 0.24).rotateZ(o.rng.signed(0.3));
    prism(b, S_QUAD, s * 0.05, s * 0.2);
    b.restore();
  }
};

const vial: PropBuilder = (b, o) => {
  const s = o.size;
  b.setColor(mixHex(c0(o), '#dfeef4', 0.55));
  b.save().rotateX(-Math.PI / 2);
  b.loft([
    { z: -s * 0.34, pts: ringFrom(S_HEX, s * 0.14, s * 0.14, 0) },
    { z: s * 0.18, pts: ringFrom(S_HEX, s * 0.14, s * 0.14, 0) },
    { z: s * 0.26, pts: ringFrom(S_HEX, s * 0.08, s * 0.08, 0) },
  ]);
  b.restore();
  b.setColor(c0(o)).setEmissive(o.glow ?? 0.3);
  b.save().translate(0, -s * 0.14, 0).rotateX(-Math.PI / 2);
  prism(b, S_HEX, s * 0.115, s * 0.3);
  b.restore();
  b.setEmissive(0);
  b.setColor(c1(o));
  b.save().translate(0, s * 0.3, 0).rotateX(-Math.PI / 2);
  prism(b, S_HEX, s * 0.085, s * 0.09);
  b.restore();
};

// --- household and instruments -------------------------------------------

const coin: PropBuilder = (b, o) => {
  const s = o.size;
  b.setColor(c0(o));
  b.save().rotateX(-Math.PI / 2).rotateZ(o.rng.next() * TAU);
  b.plate(poly(10, s * 0.45), s * 0.07);
  b.restore();
  b.setColor(c1(o));
  b.save().translate(0, s * 0.04, 0).rotateX(-Math.PI / 2);
  b.plate(poly(6, s * 0.2), s * 0.01);
  b.restore();
};

const bottleProp: PropBuilder = (b, o) => {
  const s = o.size;
  b.setColor(c0(o));
  b.save().rotateX(-Math.PI / 2);
  b.loft([
    { z: -s * 0.48, pts: ringFrom(S_OCT, s * 0.18, s * 0.18, 0) },
    { z: -s * 0.05, pts: ringFrom(S_OCT, s * 0.2, s * 0.2, 0) },
    { z: s * 0.12, pts: ringFrom(S_OCT, s * 0.1, s * 0.1, 0) },
    { z: s * 0.4, pts: ringFrom(S_OCT, s * 0.08, s * 0.08, 0) },
    { z: s * 0.48, pts: ringFrom(S_OCT, s * 0.1, s * 0.1, 0) },
  ]);
  b.restore();
  b.setColor(c1(o));
  b.save().translate(0, -s * 0.2, 0).rotateX(-Math.PI / 2);
  prism(b, S_OCT, s * 0.205, s * 0.14);
  b.restore();
};

const compass: PropBuilder = (b, o) => {
  const s = o.size;
  b.setColor(c0(o));
  b.save().rotateX(-Math.PI / 2);
  b.loft([
    { z: -s * 0.1, pts: ringFrom(S_OCT, s * 0.44, s * 0.44, 0) },
    { z: s * 0.05, pts: ringFrom(S_OCT, s * 0.46, s * 0.46, 0) },
    { z: s * 0.1, pts: ringFrom(S_OCT, s * 0.4, s * 0.4, 0) },
  ]);
  b.restore();
  b.setColor(c1(o));
  b.save().translate(0, s * 0.11, 0).rotateX(-Math.PI / 2);
  b.plate(poly(10, s * 0.38), s * 0.01);
  b.restore();
  b.setColor('#c8402c');
  b.save().translate(0, s * 0.13, 0).rotateX(-Math.PI / 2).rotateZ(o.rng.next() * TAU);
  b.plate([[0, s * 0.3], [s * 0.05, 0], [0, -s * 0.3], [-s * 0.05, 0]], s * 0.01);
  b.restore();
};

const watch: PropBuilder = (b, o) => {
  const s = o.size;
  b.setColor(c0(o));
  b.save().rotateZ(0.2);
  b.plate(poly(10, s * 0.4), s * 0.16);
  b.restore();
  b.setColor(c1(o));
  b.save().translate(0, 0, s * 0.09).rotateZ(0.2);
  b.plate(poly(10, s * 0.32), s * 0.01);
  b.restore();
  b.setColor(c0(o));
  b.save().translate(0, s * 0.44, 0);
  b.plate(poly(6, s * 0.1), s * 0.05);
  b.restore();
};

const helmetProp: PropBuilder = (b, o) => {
  const s = o.size;
  b.setColor(c0(o));
  b.save().rotateX(-Math.PI / 2);
  b.loft([
    { z: -s * 0.4, pts: ringFrom(S_OCT, s * 0.34, s * 0.34, 0) },
    { z: -s * 0.3, pts: ringFrom(S_OCT, s * 0.44, s * 0.44, 0) },
    { z: 0, pts: ringFrom(S_OCT, s * 0.42, s * 0.42, 0) },
    { z: s * 0.24, pts: ringFrom(S_OCT, s * 0.32, s * 0.32, 0) },
    { z: s * 0.36, pts: ringFrom(S_OCT, s * 0.14, s * 0.14, 0) },
  ]);
  b.restore();
  // Face port.
  b.setColor(c1(o));
  b.save().translate(0, s * 0.02, s * 0.36).rotateX(0);
  b.plate(poly(8, s * 0.19), s * 0.04);
  b.restore();
  b.setColor(mixHex(c0(o), '#f0f4f6', 0.5));
  b.save().translate(0, s * 0.02, s * 0.4);
  b.plate(poly(8, s * 0.14), s * 0.01);
  b.restore();
  // Side ports.
  for (const side of [-1, 1]) {
    b.setColor(c1(o));
    b.save().translate(side * s * 0.34, s * 0.02, s * 0.08).rotateY(side * Math.PI * 0.5);
    b.plate(poly(6, s * 0.11), s * 0.03);
    b.restore();
  }
};

const lanternProp: PropBuilder = (b, o) => {
  const s = o.size;
  b.setColor(c0(o));
  b.save().rotateX(-Math.PI / 2);
  b.loft([
    { z: -s * 0.4, pts: ringFrom(S_HEX, s * 0.22, s * 0.22, 0) },
    { z: -s * 0.26, pts: ringFrom(S_HEX, s * 0.17, s * 0.17, 0) },
    { z: s * 0.22, pts: ringFrom(S_HEX, s * 0.17, s * 0.17, 0) },
    { z: s * 0.34, pts: ringFrom(S_HEX, s * 0.24, s * 0.24, 0) },
  ], { capStart: true, capEnd: true });
  b.restore();
  b.setColor(c1(o)).setEmissive(o.glow ?? 0.35);
  b.save().rotateX(-Math.PI / 2);
  prism(b, S_HEX, s * 0.145, s * 0.4);
  b.restore();
  b.setEmissive(0);
  b.setColor(c0(o));
  b.save().translate(0, s * 0.46, 0).rotateX(-Math.PI / 2);
  b.plate(poly(8, s * 0.13), s * 0.03);
  b.restore();
};

const boxProp: PropBuilder = (b, o) => {
  const s = o.size;
  b.setColor(c0(o));
  b.save().rotateY(o.rng.signed(0.4));
  b.loft([
    { z: -s * 0.3, pts: ringFrom(S_BOX, s * 0.36, s * 0.22, 0) },
    { z: s * 0.3, pts: ringFrom(S_BOX, s * 0.36, s * 0.22, 0) },
  ]);
  b.setColor(c1(o));
  b.save().translate(0, s * 0.23, 0).rotateX(-Math.PI / 2);
  b.plate([[-s * 0.37, -s * 0.31], [s * 0.37, -s * 0.31], [s * 0.37, s * 0.31], [-s * 0.37, s * 0.31]], s * 0.03);
  b.restore();
  b.restore();
};

const crate: PropBuilder = (b, o) => {
  const s = o.size;
  b.setColor(c0(o));
  b.save().rotateY(o.rng.signed(0.5));
  b.loft([
    { z: -s * 0.34, pts: ringFrom(S_BOX, s * 0.34, s * 0.3, 0) },
    { z: s * 0.34, pts: ringFrom(S_BOX, s * 0.34, s * 0.3, 0) },
  ]);
  b.setColor(c1(o));
  for (const z of [-s * 0.2, s * 0.2]) {
    b.save().translate(0, 0, z).rotateX(-Math.PI / 2);
    b.loft([
      { z: -s * 0.02, pts: ringFrom(S_BOX, s * 0.35, s * 0.31, 0) },
      { z: s * 0.02, pts: ringFrom(S_BOX, s * 0.35, s * 0.31, 0) },
    ], { capStart: false, capEnd: false });
    b.restore();
  }
  b.restore();
};

const bookProp: PropBuilder = (b, o) => {
  const s = o.size;
  b.setColor(c0(o));
  b.save().rotateZ(o.rng.signed(0.2));
  b.plate([
    [-s * 0.3, -s * 0.42], [s * 0.3, -s * 0.42], [s * 0.3, s * 0.42], [-s * 0.3, s * 0.42],
  ], s * 0.14);
  b.setColor(c1(o));
  b.save().translate(s * 0.02, 0, 0);
  b.plate([
    [-s * 0.26, -s * 0.38], [s * 0.28, -s * 0.38], [s * 0.28, s * 0.38], [-s * 0.26, s * 0.38],
  ], s * 0.16);
  b.restore();
  b.restore();
};

const keyProp: PropBuilder = (b, o) => {
  const s = o.size;
  b.setColor(c0(o));
  b.save().rotateX(-Math.PI / 2);
  b.loft([
    { z: -s * 0.4, pts: ringFrom(S_QUAD, s * 0.05, s * 0.05, 0) },
    { z: s * 0.28, pts: ringFrom(S_QUAD, s * 0.05, s * 0.05, 0) },
  ]);
  b.restore();
  b.save().translate(0, s * 0.4, 0).rotateX(-Math.PI / 2);
  b.plate(poly(6, s * 0.16), s * 0.04);
  b.restore();
  b.setColor(c1(o));
  for (let i = 0; i < 3; i++) {
    b.save().translate(s * 0.1, -s * (0.34 - i * 0.09), 0);
    b.plate([[-s * 0.08, -s * 0.03], [s * 0.08, -s * 0.03], [s * 0.08, s * 0.03], [-s * 0.08, s * 0.03]], s * 0.05);
    b.restore();
  }
};

const figurine: PropBuilder = (b, o) => {
  const s = o.size;
  b.setColor(c0(o));
  b.save().rotateX(-Math.PI / 2);
  b.loft([
    { z: -s * 0.48, pts: ringFrom(S_OCT, s * 0.2, s * 0.2, 0) },
    { z: -s * 0.4, pts: ringFrom(S_OCT, s * 0.13, s * 0.13, 0) },
    { z: -s * 0.05, pts: ringFrom(S_BOX, s * 0.12, s * 0.08, 0) },
    { z: s * 0.2, pts: ringFrom(S_BOX, s * 0.14, s * 0.09, 0) },
    { z: s * 0.28, pts: ringFrom(S_OCT, s * 0.07, s * 0.07, 0) },
    { z: s * 0.44, pts: ringFrom(S_OCT, s * 0.11, s * 0.11, 0) },
    { z: s * 0.5, pts: ringFrom(S_POINT, 0, 0, 0) },
  ]);
  b.restore();
  b.setColor(c1(o));
  for (const side of [-1, 1]) {
    b.save().translate(side * s * 0.14, s * 0.08, 0).rotateZ(side * 0.2);
    prism(b, S_QUAD, s * 0.045, s * 0.28);
    b.restore();
  }
};

const tablet: PropBuilder = (b, o) => {
  const s = o.size;
  b.setColor(c0(o));
  b.save().rotateZ(o.rng.signed(0.3));
  b.plate([
    [-s * 0.3, -s * 0.42], [s * 0.32, -s * 0.38], [s * 0.28, s * 0.4], [-s * 0.32, s * 0.36],
  ], s * 0.09);
  b.setColor(c1(o));
  b.setEmissive(o.glow ?? 0.2);
  for (let i = 0; i < 4; i++) {
    b.save().translate(0, s * (0.24 - i * 0.16), s * 0.05);
    b.plate([[-s * 0.18, -s * 0.02], [s * 0.16, -s * 0.02], [s * 0.16, s * 0.02], [-s * 0.18, s * 0.02]], s * 0.005);
    b.restore();
  }
  b.setEmissive(0);
  b.restore();
};

const bowlProp: PropBuilder = (b, o) => {
  const s = o.size;
  b.setColor(c0(o));
  b.save().rotateX(-Math.PI / 2);
  b.loft([
    { z: -s * 0.2, pts: ringFrom(S_OCT, s * 0.14, s * 0.14, 0) },
    { z: -s * 0.1, pts: ringFrom(S_OCT, s * 0.3, s * 0.3, 0) },
    { z: s * 0.16, pts: ringFrom(S_OCT, s * 0.45, s * 0.45, 0) },
  ], { capEnd: false });
  b.setColor(c1(o));
  b.loft([
    { z: s * 0.16, pts: ringFrom(S_OCT, s * 0.42, s * 0.42, 0) },
    { z: -s * 0.04, pts: ringFrom(S_OCT, s * 0.24, s * 0.24, 0) },
  ], { capStart: false });
  b.restore();
};

const kitProp: PropBuilder = (b, o) => {
  const s = o.size;
  b.setColor(c0(o));
  b.save().rotateY(o.rng.signed(0.3));
  b.loft([
    { z: -s * 0.24, pts: ringFrom(S_BOX, s * 0.32, s * 0.2, 0) },
    { z: s * 0.24, pts: ringFrom(S_BOX, s * 0.32, s * 0.2, 0) },
  ]);
  b.setColor(c1(o));
  b.save().translate(0, s * 0.21, 0).rotateX(-Math.PI / 2);
  b.plate([[-s * 0.08, -s * 0.02], [s * 0.08, -s * 0.02], [s * 0.08, s * 0.02], [-s * 0.08, s * 0.02]], s * 0.02);
  b.plate([[-s * 0.02, -s * 0.08], [s * 0.02, -s * 0.08], [s * 0.02, s * 0.08], [-s * 0.02, s * 0.08]], s * 0.02);
  b.restore();
  b.restore();
};

const canister: PropBuilder = (b, o) => {
  const s = o.size;
  b.setColor(c0(o));
  b.save().rotateX(-Math.PI / 2);
  b.loft([
    { z: -s * 0.42, pts: ringFrom(S_OCT, s * 0.16, s * 0.16, 0) },
    { z: -s * 0.34, pts: ringFrom(S_OCT, s * 0.2, s * 0.2, 0) },
    { z: s * 0.3, pts: ringFrom(S_OCT, s * 0.2, s * 0.2, 0) },
    { z: s * 0.4, pts: ringFrom(S_OCT, s * 0.13, s * 0.13, 0) },
  ]);
  b.restore();
  b.setColor(c1(o));
  b.save().translate(0, s * 0.02, 0).rotateX(-Math.PI / 2);
  b.loft([
    { z: -s * 0.06, pts: ringFrom(S_OCT, s * 0.205, s * 0.205, 0) },
    { z: s * 0.06, pts: ringFrom(S_OCT, s * 0.205, s * 0.205, 0) },
  ], { capStart: false, capEnd: false });
  b.restore();
};

const baitProp: PropBuilder = (b, o) => {
  const s = o.size;
  for (let i = 0; i < 4; i++) {
    b.setColor(i % 2 ? c0(o) : c1(o));
    b.save().translate(o.rng.signed(s * 0.2), o.rng.next() * s * 0.1, o.rng.signed(s * 0.2));
    b.rotateY(o.rng.next() * TAU).rotateZ(o.rng.signed(0.5));
    b.gem(s * o.rng.range(0.1, 0.18), 5, 1.4, 0.6);
    b.restore();
  }
};

const photoProp: PropBuilder = (b, o) => {
  const s = o.size;
  b.setColor(c0(o));
  b.save().rotateZ(o.rng.signed(0.3));
  b.plate([[-s * 0.4, -s * 0.3], [s * 0.4, -s * 0.3], [s * 0.4, s * 0.3], [-s * 0.4, s * 0.3]], s * 0.02);
  b.setColor(c1(o));
  b.save().translate(0, 0, s * 0.015);
  b.plate([[-s * 0.32, -s * 0.22], [s * 0.32, -s * 0.22], [s * 0.32, s * 0.24], [-s * 0.32, s * 0.24]], s * 0.005);
  b.restore();
  b.restore();
};

const genericTool: PropBuilder = (b, o) => {
  const s = o.size;
  b.setColor(c0(o));
  b.save().rotateX(-Math.PI / 2);
  b.loft([
    { z: -s * 0.4, pts: ringFrom(S_HEX, s * 0.12, s * 0.12, 0) },
    { z: s * 0.1, pts: ringFrom(S_HEX, s * 0.18, s * 0.18, 0) },
    { z: s * 0.36, pts: ringFrom(S_HEX, s * 0.1, s * 0.1, 0) },
  ]);
  b.restore();
  b.setColor(c1(o));
  b.save().translate(0, s * 0.2, 0).rotateX(-Math.PI / 2);
  b.plate(poly(6, s * 0.24), s * 0.03);
  b.restore();
};

/**
 * The registry. Related objects deliberately share a builder — a coin and a
 * badge really are a disc with a device on it — but the colours, proportions
 * and seeds come from the item definition, so no two look alike.
 */
export const PROPS: Record<string, PropBuilder> = {
  // geology
  pebble, nodule, shard, crystal: crystalProp, slab, flake, geode, ingot,
  pearl: pearlProp, chunk,
  // scrap
  plate, coil, gear, valve, cell, rivets, lamp: lampProp, blade: bladeProp, beacon,
  // organic
  shell: shellProp, conch, coral: coralProp, holdfast, bone, vial,
  // household
  coin, bottle: bottleProp, float: pearlProp, compass, watch, helmet: helmetProp,
  lantern: lanternProp, box: boxProp, crate, book: bookProp, key: keyProp,
  figurine, tablet, bowl: bowlProp, kit: kitProp, canister, bait: baitProp,
  photo: photoProp,
  // aliases onto the closest authored form
  spoon: genericTool, ring: coin, button: coin, badge: coin, thimble: canister,
  sextant: compass, binoculars: watch, lead: nodule, telescope: genericTool,
  astrolabe: compass, bell: lanternProp, spoke: genericTool, cup: bowlProp,
  cat: figurine, musicbox: boxProp, toysub: figurine, chess: figurine,
  globe: pearlProp, whalecarving: figurine, camera: boxProp, tin: boxProp,
  spectacles: watch, pipe: genericTool, tankard: bowlProp, brush: genericTool,
  inkwell: bottleProp, harmonica: boxProp, soldier: figurine, marbles: rivets,
  lure: baitProp, whistle: genericTool, slate: bookProp, scraper: bladeProp,
  charm: coin, paperweight: pearlProp, cufflinks: coin, padlock: boxProp,
  mirror: watch, knife: bladeProp, valentine: boxProp, telegraph: valve,
  porthole: compass, lifebuoy: coin, hinge: plate, dividers: genericTool,
  bootjack: bladeProp, brooch: coin, runninglamp: lanternProp, prism: crystalProp,
  fid: genericTool, messkit: bowlProp, necklace: rivets, barometer: compass,
  flag: photoProp, figurehead: figurine, block: slab, tile: plate,
  boot: boxProp, paper: photoProp, reel: coin, core_tube: canister,
  tag: coin, flare: canister, jar: vial, mesh: plate, wadding: boxProp,
  pump: valve, dome: bowlProp, hydrophone: canister, transducer: canister,
  lens: coin, core: geode, array: plate, turbine: gear, motor: cell,
  ring_big: coin, frame: plate, drillhead: crystalProp, stabiliser: canister,
};

export function buildProp(b: MeshBuilder, model: string, o: PropOpts): void {
  const fn = PROPS[model] ?? pebble;
  fn(b, o);
}
