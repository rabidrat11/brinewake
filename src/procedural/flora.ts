/**
 * Marine vegetation and sessile life.
 *
 * Twenty-four builders, all authored geometry: blades are single flat plates
 * with four or five vertices, stems are four- or six-sided lofts, and every
 * colour is applied per face. A whole kelp plant costs about two hundred
 * triangles, and the silhouette is the point — you should be able to name any
 * of these from a black shape at fifty metres.
 */

import { BufferGeometry, Float32BufferAttribute, Vector3 } from 'three';
import { MeshBuilder } from './geo';
import { S_HEX, S_OCT, S_POINT, S_QUAD, S_QUAD_POINT, ringFrom } from './sections';
import type { Rng } from '../core/rng';
import { TAU, lerp } from '../core/math';
import { mixHex, shift } from './palette';

export interface FloraOpts {
  size: number;
  colors: string[];
  glow?: number;
  rng: Rng;
}

export type FloraBuilder = (b: MeshBuilder, o: FloraOpts) => void;

/** A tapering stem: a four-sided loft that bends along a lean direction. */
function stem(
  b: MeshBuilder, h: number, r0: number, r1: number,
  lean: number, bend: number, segs = 4,
): void {
  const rings = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const off = Math.pow(t, 1.7) * bend;
    const r = lerp(r0, r1, t);
    rings.push({
      z: h * t,
      pts: ringFrom(t === 1 && r1 < 1e-4 ? S_QUAD_POINT : S_QUAD, r, r, 0)
        .map(([x, y]) => [x + Math.cos(lean) * off, y - Math.sin(lean) * off] as [number, number]),
    });
  }
  b.save().rotateX(-Math.PI / 2);
  b.loft(rings);
  b.restore();
}

/** A blade: one flat plate, five vertices, standing from a base point. */
function blade(
  b: MeshBuilder, base: Vector3, dir: number, length: number, width: number,
  droop: number, thickness = 0,
): void {
  const tipX = Math.cos(dir) * length;
  const tipZ = Math.sin(dir) * length;
  const tipY = length * (0.9 - droop);
  const midY = length * (0.55 - droop * 0.25);
  b.plateOn(
    [
      [-width * 0.5, 0],
      [width * 0.5, 0],
      [width * 0.62, 0.42],
      [width * 0.18, 0.86],
      [-width * 0.42, 0.7],
    ],
    thickness,
    base,
    new Vector3(Math.cos(dir + Math.PI / 2), 0, Math.sin(dir + Math.PI / 2)),
    new Vector3(tipX, tipY, tipZ).normalize().multiplyScalar(1),
  );
  // Rebuild the outline in real units: the plate above is in [0..1] chord.
  void midY;
}

/** A blade, expressed directly as two triangles so its shape is exact. */
function bladeQuad(
  b: MeshBuilder, bx: number, by: number, bz: number,
  dir: number, length: number, width: number, droop: number, curl = 0,
): void {
  const cx = Math.cos(dir), cz = Math.sin(dir);
  const px = -Math.sin(dir), pz = Math.cos(dir);
  const pts: Vector3[] = [];
  const N = 4;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const reach = length * t;
    const rise = length * (t - droop * t * t * 1.6);
    pts.push(new Vector3(
      bx + cx * reach * 0.55 + px * Math.sin(t * 2.4) * curl * width,
      by + rise,
      bz + cz * reach * 0.55 + pz * Math.sin(t * 2.4) * curl * width,
    ));
  }
  for (let i = 0; i < N; i++) {
    const w0 = width * (0.35 + 0.65 * Math.sin(Math.min(1, (i / N) * 1.25) * Math.PI * 0.85)) * 0.5;
    const w1 = width * (0.35 + 0.65 * Math.sin(Math.min(1, ((i + 1) / N) * 1.25) * Math.PI * 0.85)) * 0.5
      * (i === N - 1 ? 0.15 : 1);
    const a = pts[i], c = pts[i + 1];
    b.addQuad(
      a.x + px * w0, a.y, a.z + pz * w0, c.x + px * w1, c.y, c.z + pz * w1,
      c.x - px * w1, c.y, c.z - pz * w1, a.x - px * w0, a.y, a.z - pz * w0,
    );
    b.addQuad(
      a.x - px * w0, a.y, a.z - pz * w0, c.x - px * w1, c.y, c.z - pz * w1,
      c.x + px * w1, c.y, c.z + pz * w1, a.x + px * w0, a.y, a.z + pz * w0,
    );
  }
}

// --- shallow / temperate ------------------------------------------------

const eelgrass: FloraBuilder = (b, o) => {
  const { rng, size } = o;
  const blades = rng.int(8, 14);
  for (let i = 0; i < blades; i++) {
    const h = size * rng.range(0.65, 1.2);
    const a = rng.next() * TAU;
    const d = size * rng.range(0, 0.1);
    b.setColor(mixHex(o.colors[i % o.colors.length], o.colors[(i + 1) % o.colors.length], rng.next() * 0.5));
    bladeQuad(b, Math.cos(a) * d, 0, Math.sin(a) * d, a, h, size * 0.11, rng.range(0.15, 0.4), 0.3);
  }
};

const sandTuft: FloraBuilder = (b, o) => {
  const { rng, size } = o;
  const n = rng.int(4, 7);
  for (let i = 0; i < n; i++) {
    const a = rng.next() * TAU;
    b.setColor(shift(o.colors[0], 0, rng.signed(0.08), rng.signed(0.1)));
    bladeQuad(b, 0, 0, 0, a, size * rng.range(0.35, 0.7), size * 0.07, 0.35, 0.2);
  }
};

const seaLettuce: FloraBuilder = (b, o) => {
  const { rng, size } = o;
  const sheets = rng.int(3, 5);
  for (let i = 0; i < sheets; i++) {
    const a = rng.next() * TAU;
    const h = size * rng.range(0.4, 0.75);
    const w = size * rng.range(0.35, 0.6);
    b.setColor(mixHex(o.colors[i % o.colors.length], '#c8e878', rng.next() * 0.35));
    // A ruffled sheet: three plates fanned from a common base.
    for (let k = -1; k <= 1; k++) {
      b.plateOn(
        [[-w * 0.5, 0], [w * 0.5, 0], [w * 0.62, h * 0.55], [0, h], [-w * 0.55, h * 0.7]],
        0,
        new Vector3(0, 0, 0),
        new Vector3(Math.cos(a + k * 0.5), 0, Math.sin(a + k * 0.5)),
        new Vector3(Math.sin(k * 0.3) * 0.4, 1, 0).normalize(),
      );
    }
  }
};

function kelpPlant(b: MeshBuilder, o: FloraOpts, h: number, blades: number): void {
  const { rng } = o;
  const lean = rng.next() * TAU;
  const bend = h * rng.range(0.1, 0.22);
  b.setColor(mixHex(o.colors[0], '#c8b878', 0.22));
  stem(b, h, h * 0.017, h * 0.009, lean, bend, 6);

  for (let i = 0; i < blades; i++) {
    const t = 0.14 + (i / blades) * 0.84;
    const y = h * t;
    const off = Math.pow(t, 1.7) * bend;
    const bx = Math.cos(lean) * off;
    const bz = Math.sin(lean) * off;
    const a = lean + i * 2.399 + rng.signed(0.3);
    const bl = h * lerp(0.055, 0.105, Math.pow(t, 1.2)) * rng.range(0.85, 1.25);
    b.setColor(mixHex(
      o.colors[(i % Math.max(1, o.colors.length - 1)) + 1] ?? o.colors[0],
      o.colors[0], rng.next() * 0.4,
    ));
    bladeQuad(b, bx, y, bz, a, bl, bl * 0.5, rng.range(0.45, 0.8), 0.35);
    // Gas float at the blade base.
    if (h > 6 && rng.chance(0.7)) {
      b.save().translate(bx + Math.cos(a) * bl * 0.06, y + bl * 0.04, bz + Math.sin(a) * bl * 0.06);
      b.setColor(shift(o.colors[0], 0.02, 0.06, 0.02));
      b.gem(h * 0.022, 5, 1.4, 1.1);
      b.restore();
    }
  }
}

const kelpSmall: FloraBuilder = (b, o) => {
  kelpPlant(b, o, o.size * o.rng.range(0.8, 1.35), o.rng.int(9, 14));
};

const giantKelp: FloraBuilder = (b, o) => {
  const { rng, size } = o;
  const stipes = rng.int(2, 4);
  for (let i = 0; i < stipes; i++) {
    b.save().translate(rng.signed(size * 0.04), 0, rng.signed(size * 0.04));
    kelpPlant(b, o, size * rng.range(0.78, 1.2), rng.int(16, 26));
    b.restore();
  }
  // Holdfast: a knot of angular roots.
  b.setColor(shift(o.colors[0], 0, -0.15, -0.2));
  const roots = rng.int(5, 7);
  for (let i = 0; i < roots; i++) {
    const a = (i / roots) * TAU + rng.signed(0.3);
    b.save().translate(0, size * 0.012, 0).rotateY(a).rotateZ(1.15 + rng.signed(0.2));
    stem(b, size * 0.075, size * 0.016, size * 0.006, 0, 0, 2);
    b.restore();
  }
};

const barnacleCluster: FloraBuilder = (b, o) => {
  const { rng, size } = o;
  const n = rng.int(4, 9);
  for (let i = 0; i < n; i++) {
    const a = rng.next() * TAU;
    const d = Math.sqrt(rng.next()) * size * 0.38;
    const s = size * rng.range(0.08, 0.2);
    b.save().translate(Math.cos(a) * d, 0, Math.sin(a) * d).rotateY(rng.next() * TAU).rotateZ(rng.signed(0.18));
    b.setColor(shift(o.colors[0], 0, rng.signed(0.06), rng.signed(0.12)));
    b.save().rotateX(-Math.PI / 2);
    b.loft([
      { z: 0, pts: ringFrom(S_HEX, s, s, 0) },
      { z: s * 0.7, pts: ringFrom(S_HEX, s * 0.72, s * 0.72, 0) },
      { z: s * 1.15, pts: ringFrom(S_HEX, s * 0.42, s * 0.42, 0) },
    ], { capEnd: false });
    b.setColor(shift(o.colors[0], 0, -0.12, -0.28));
    b.loft([
      { z: s * 1.15, pts: ringFrom(S_HEX, s * 0.42, s * 0.42, 0) },
      { z: s * 1.18, pts: ringFrom(S_HEX, s * 0.3, s * 0.3, 0) },
    ], { capStart: false });
    b.restore();
    b.restore();
  }
};

// --- reef ---------------------------------------------------------------

const brainCoral: FloraBuilder = (b, o) => {
  const { rng, size } = o;
  // A faceted dome, then a set of raised ridges walking across it.
  const r = size * 0.5;
  b.save().rotateX(-Math.PI / 2);
  b.setColor(o.colors[0]);
  b.loft([
    { z: 0, pts: ringFrom(S_OCT, r, r, 0) },
    { z: r * 0.42, pts: ringFrom(S_OCT, r * 0.94, r * 0.94, 0) },
    { z: r * 0.72, pts: ringFrom(S_OCT, r * 0.7, r * 0.7, 0) },
    { z: r * 0.86, pts: ringFrom(S_OCT, r * 0.36, r * 0.36, 0) },
    { z: r * 0.9, pts: ringFrom(S_POINT, 0, 0, 0) },
  ], { capStart: false });
  b.restore();
  const ridges = rng.int(4, 7);
  for (let i = 0; i < ridges; i++) {
    const a = (i / ridges) * Math.PI + rng.signed(0.2);
    b.setColor(mixHex(o.colors[1] ?? o.colors[0], o.colors[0], rng.next() * 0.4));
    const segs = 5;
    for (let k = 0; k < segs; k++) {
      const t0 = k / segs - 0.5, t1 = (k + 1) / segs - 0.5;
      const w = r * 0.085;
      const y0 = r * (0.9 - Math.abs(t0) * Math.abs(t0) * 3.0);
      const y1 = r * (0.9 - Math.abs(t1) * Math.abs(t1) * 3.0);
      if (y0 < 0.02 || y1 < 0.02) continue;
      const x0 = Math.cos(a) * r * t0 * 1.9, z0 = Math.sin(a) * r * t0 * 1.9;
      const x1 = Math.cos(a) * r * t1 * 1.9, z1 = Math.sin(a) * r * t1 * 1.9;
      const px = -Math.sin(a) * w, pz = Math.cos(a) * w;
      b.addQuad(
        x0 + px, y0 + r * 0.1, z0 + pz, x1 + px, y1 + r * 0.1, z1 + pz,
        x1 - px, y1 + r * 0.1, z1 - pz, x0 - px, y0 + r * 0.1, z0 - pz,
      );
    }
  }
};

const staghornCoral: FloraBuilder = (b, o) => {
  const { rng, size } = o;
  const branch = (from: Vector3, dir: Vector3, len: number, rad: number, depth: number): void => {
    if (depth > 3 || len < size * 0.06) return;
    const to = from.clone().addScaledVector(dir, len);
    b.setColor(mixHex(o.colors[depth % o.colors.length], o.colors[0], 0.25 + depth * 0.12));
    b.save();
    b.translate(from.x, from.y, from.z);
    b.lookAlong(dir.x, dir.y, dir.z);
    b.loft([
      { z: 0, pts: ringFrom(S_QUAD, rad, rad, 0) },
      { z: len, pts: ringFrom(depth >= 3 ? S_QUAD_POINT : S_QUAD, rad * 0.6, rad * 0.6, 0) },
    ], { capStart: false });
    b.restore();
    const kids = depth < 2 ? rng.int(2, 3) : rng.int(1, 2);
    for (let i = 0; i < kids; i++) {
      const nd = dir.clone();
      nd.x += rng.signed(0.8); nd.z += rng.signed(0.8); nd.y += rng.range(0.05, 0.45);
      branch(to, nd.normalize(), len * rng.range(0.55, 0.75), rad * 0.66, depth + 1);
    }
  };
  const trunks = rng.int(2, 3);
  for (let i = 0; i < trunks; i++) {
    const a = (i / trunks) * TAU + rng.signed(0.5);
    branch(
      new Vector3(Math.cos(a) * size * 0.1, 0, Math.sin(a) * size * 0.1),
      new Vector3(rng.signed(0.3), 1, rng.signed(0.3)).normalize(),
      size * rng.range(0.26, 0.38), size * 0.048, 0,
    );
  }
};

const fanCoral: FloraBuilder = (b, o) => {
  const { rng, size } = o;
  const facing = rng.next() * TAU;
  const col = o.colors[0];
  b.save().rotateY(facing);
  b.setColor(shift(col, 0, 0, -0.1));
  stem(b, size * 0.22, size * 0.03, size * 0.024, 0, 0, 2);
  // The fan is one authored plate with a scalloped edge, plus rib lines.
  const w = size * 0.75, h = size * 0.85;
  const outline: [number, number][] = [
    [0, 0], [w * 0.42, h * 0.18], [w * 0.62, h * 0.5], [w * 0.5, h * 0.82],
    [w * 0.2, h], [0, h * 0.92], [-w * 0.2, h],
    [-w * 0.5, h * 0.82], [-w * 0.62, h * 0.5], [-w * 0.42, h * 0.18],
  ];
  b.setColor(col);
  b.plateOn(outline, size * 0.02, new Vector3(0, size * 0.18, 0),
    new Vector3(1, 0, 0), new Vector3(0, 1, 0));
  // Ribs, slightly proud, in a lighter tone.
  b.setColor(mixHex(col, o.colors[1] ?? '#ffffff', 0.4));
  const ribs = rng.int(5, 8);
  for (let i = 0; i < ribs; i++) {
    const t = (i / (ribs - 1)) * 2 - 1;
    const ang = t * 1.05;
    const len = h * (1 - Math.abs(t) * 0.28);
    b.plateOn(
      [[-size * 0.012, 0], [size * 0.012, 0], [size * 0.008, len], [-size * 0.008, len]],
      size * 0.03,
      new Vector3(0, size * 0.2, 0),
      new Vector3(Math.cos(ang + Math.PI / 2), Math.sin(ang + Math.PI / 2), 0),
      new Vector3(Math.sin(ang), Math.cos(ang), 0),
    );
  }
  b.restore();
};

const tubeSponge: FloraBuilder = (b, o) => {
  const { rng, size } = o;
  const tubes = rng.int(3, 6);
  for (let i = 0; i < tubes; i++) {
    const h = size * rng.range(0.42, 1);
    const r = size * rng.range(0.13, 0.22);
    const a = rng.next() * TAU;
    const d = size * rng.range(0, 0.2);
    b.save().translate(Math.cos(a) * d, 0, Math.sin(a) * d).rotateZ(rng.signed(0.28)).rotateY(a);
    b.setColor(shift(o.colors[i % o.colors.length], 0, rng.signed(0.07), rng.signed(0.09)));
    b.save().rotateX(-Math.PI / 2);
    b.loft([
      { z: 0, pts: ringFrom(S_HEX, r * 1.2, r * 1.2, 0) },
      { z: h * 0.3, pts: ringFrom(S_HEX, r, r, 0) },
      { z: h, pts: ringFrom(S_HEX, r * 1.05, r * 1.05, 0) },
    ], { capEnd: false });
    b.setColor(mixHex(o.colors[0], '#101418', 0.55));
    b.loft([
      { z: h, pts: ringFrom(S_HEX, r * 0.72, r * 0.72, 0) },
      { z: h * 0.55, pts: ringFrom(S_HEX, r * 0.66, r * 0.66, 0) },
    ], { capStart: false });
    b.restore();
    b.restore();
  }
};

const anemone: FloraBuilder = (b, o) => {
  const { rng, size } = o;
  b.setColor(mixHex(o.colors[0], '#f0e2d0', 0.35));
  b.save().rotateX(-Math.PI / 2);
  b.loft([
    { z: 0, pts: ringFrom(S_OCT, size * 0.13, size * 0.13, 0) },
    { z: size * 0.14, pts: ringFrom(S_OCT, size * 0.085, size * 0.085, 0) },
    { z: size * 0.42, pts: ringFrom(S_OCT, size * 0.1, size * 0.1, 0) },
    { z: size * 0.5, pts: ringFrom(S_OCT, size * 0.085, size * 0.085, 0) },
  ]);
  b.restore();
  const tips = o.colors[1] ?? o.colors[0];
  const n = rng.int(12, 20);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rng.signed(0.14);
    const ring = rng.range(0.45, 1);
    const len = size * rng.range(0.3, 0.56) * ring;
    const lean = lerp(0.15, 1.25, ring);
    b.setColor(shift(tips, 0, rng.signed(0.08), rng.signed(0.1)));
    b.save();
    b.translate(Math.cos(a) * size * 0.085 * ring, size * 0.47, Math.sin(a) * size * 0.085 * ring);
    b.rotateY(-a).rotateZ(lean);
    stem(b, len, size * 0.026, 0, 0, len * 0.3, 3);
    b.restore();
  }
};

const featherStar: FloraBuilder = (b, o) => {
  const { rng, size } = o;
  const arms = rng.int(5, 9);
  const c = o.colors[0];
  b.setColor(c);
  b.save().rotateX(-Math.PI / 2);
  b.loft([
    { z: 0, pts: ringFrom(S_HEX, size * 0.07, size * 0.07, 0) },
    { z: size * 0.06, pts: ringFrom(S_HEX, size * 0.05, size * 0.05, 0) },
  ]);
  b.restore();
  for (let i = 0; i < arms; i++) {
    const a = (i / arms) * TAU + rng.signed(0.14);
    const len = size * rng.range(0.35, 0.55);
    b.setColor(mixHex(c, o.colors[1] ?? c, rng.next() * 0.5));
    // The arm is a curved chain of quads with pinnules as small side plates.
    const N = 4;
    for (let k = 0; k < N; k++) {
      const t0 = k / N, t1 = (k + 1) / N;
      const r0 = len * t0, r1 = len * t1;
      const y0 = len * 0.55 * Math.sin(t0 * 1.5), y1 = len * 0.55 * Math.sin(t1 * 1.5);
      const w0 = size * 0.02 * (1 - t0 * 0.6), w1 = size * 0.02 * (1 - t1 * 0.6);
      const px = -Math.sin(a), pz = Math.cos(a);
      b.addQuad(
        Math.cos(a) * r0 + px * w0, y0, Math.sin(a) * r0 + pz * w0,
        Math.cos(a) * r1 + px * w1, y1, Math.sin(a) * r1 + pz * w1,
        Math.cos(a) * r1 - px * w1, y1, Math.sin(a) * r1 - pz * w1,
        Math.cos(a) * r0 - px * w0, y0, Math.sin(a) * r0 - pz * w0,
      );
      if (k > 0) {
        for (const s of [-1, 1]) {
          b.plateOn(
            [[0, 0], [size * 0.05, size * 0.012], [size * 0.075, 0], [size * 0.05, -size * 0.012]],
            0,
            new Vector3(Math.cos(a) * r0, y0, Math.sin(a) * r0),
            new Vector3(px * s, 0.3, pz * s),
            new Vector3(Math.cos(a), 0.4, Math.sin(a)),
          );
        }
      }
    }
  }
};

// --- deep ---------------------------------------------------------------

const seaWhip: FloraBuilder = (b, o) => {
  const { rng, size } = o;
  const n = rng.int(4, 7);
  for (let i = 0; i < n; i++) {
    const h = size * rng.range(0.6, 1.3);
    const a = rng.next() * TAU;
    b.setColor(shift(o.colors[i % o.colors.length], 0, rng.signed(0.07), rng.signed(0.09)));
    if (o.glow) b.setEmissive(o.glow);
    b.save().translate(Math.cos(a) * size * 0.1, 0, Math.sin(a) * size * 0.1);
    stem(b, h, h * 0.036, h * 0.01, a, h * 0.3, 5);
    b.restore();
    b.setEmissive(0);
  }
};

const glassSponge: FloraBuilder = (b, o) => {
  const { rng, size } = o;
  const h = size * rng.range(0.7, 1.15);
  const r = size * rng.range(0.26, 0.4);
  const c = o.colors[0] ?? '#e8f2ee';
  // A vase: a loft with an open, flared mouth and a visibly thin wall.
  b.setColor(c);
  b.save().rotateX(-Math.PI / 2);
  b.loft([
    { z: 0, pts: ringFrom(S_OCT, r * 0.3, r * 0.3, 0) },
    { z: h * 0.2, pts: ringFrom(S_OCT, r * 0.55, r * 0.55, 0) },
    { z: h * 0.6, pts: ringFrom(S_OCT, r * 0.82, r * 0.82, 0) },
    { z: h, pts: ringFrom(S_OCT, r, r, 0) },
  ], { capEnd: false });
  b.setColor(shift(c, 0, 0, -0.2));
  b.loft([
    { z: h, pts: ringFrom(S_OCT, r * 0.86, r * 0.86, 0) },
    { z: h * 0.55, pts: ringFrom(S_OCT, r * 0.62, r * 0.62, 0) },
    { z: h * 0.2, pts: ringFrom(S_OCT, r * 0.4, r * 0.4, 0) },
  ], { capStart: false, capEnd: false });
  b.restore();
  // Lattice ribs on the outside, which is what makes it read as glass.
  b.setColor(shift(c, 0, 0, 0.1));
  const ribs = 8;
  for (let i = 0; i < ribs; i++) {
    const a = (i / ribs) * TAU;
    for (let k = 0; k < 3; k++) {
      const t0 = k / 3, t1 = (k + 1) / 3;
      const r0 = r * (0.3 + 0.7 * t0), r1 = r * (0.3 + 0.7 * t1);
      const a0 = a + t0 * 0.6, a1 = a + t1 * 0.6;
      const w = r * 0.05;
      b.addQuad(
        Math.cos(a0) * r0 - w, h * t0, Math.sin(a0) * r0, Math.cos(a1) * r1 - w, h * t1, Math.sin(a1) * r1,
        Math.cos(a1) * r1 + w, h * t1, Math.sin(a1) * r1, Math.cos(a0) * r0 + w, h * t0, Math.sin(a0) * r0,
      );
    }
  }
};

const tubeWorm: FloraBuilder = (b, o) => {
  const { rng, size } = o;
  const n = rng.int(5, 11);
  const tube = o.colors[1] ?? '#f0e8dc';
  const plume = o.colors[0] ?? '#d8402c';
  for (let i = 0; i < n; i++) {
    const a = rng.next() * TAU;
    const d = Math.sqrt(rng.next()) * size * 0.32;
    const h = size * rng.range(0.35, 1);
    b.save().translate(Math.cos(a) * d, 0, Math.sin(a) * d).rotateZ(rng.signed(0.3)).rotateY(a);
    b.setColor(shift(tube, 0, rng.signed(0.03), rng.signed(0.09)));
    b.save().rotateX(-Math.PI / 2);
    b.loft([
      { z: 0, pts: ringFrom(S_HEX, size * 0.05, size * 0.05, 0) },
      { z: h * 0.5, pts: ringFrom(S_HEX, size * 0.042, size * 0.042, 0) },
      { z: h, pts: ringFrom(S_HEX, size * 0.038, size * 0.038, 0) },
    ], { capEnd: false });
    b.setColor(shift(plume, 0, rng.signed(0.06), rng.signed(0.08)));
    if (o.glow) b.setEmissive(o.glow);
    b.loft([
      { z: h, pts: ringFrom(S_HEX, size * 0.03, size * 0.03, 0) },
      { z: h + size * 0.05, pts: ringFrom(S_HEX, size * 0.06, size * 0.06, 0) },
      { z: h + size * 0.12, pts: ringFrom(S_HEX, size * 0.042, size * 0.042, 0) },
      { z: h + size * 0.15, pts: ringFrom(S_POINT, 0, 0, 0) },
    ]);
    b.setEmissive(0);
    b.restore();
    b.restore();
  }
};

const lanternPolyp: FloraBuilder = (b, o) => {
  const { rng, size } = o;
  const n = rng.int(3, 6);
  const glowCol = o.colors[1] ?? '#9ee8ff';
  for (let i = 0; i < n; i++) {
    const a = rng.next() * TAU;
    const d = rng.next() * size * 0.28;
    const h = size * rng.range(0.4, 0.9);
    b.save().translate(Math.cos(a) * d, 0, Math.sin(a) * d).rotateZ(rng.signed(0.24));
    b.setColor(mixHex(o.colors[0], '#cfd8dc', 0.32));
    stem(b, h, size * 0.032, size * 0.02, a, h * 0.12, 3);
    b.save().translate(Math.cos(a) * h * 0.12, h + size * 0.06, Math.sin(a) * h * 0.12);
    b.setColor(glowCol).setEmissive(o.glow ?? 0.9);
    b.gem(size * 0.075, 6, 1.3, 1.0);
    b.setEmissive(0);
    b.restore();
    b.restore();
  }
};

const bambooCoral: FloraBuilder = (b, o) => {
  const { rng, size } = o;
  const h = size * rng.range(0.7, 1.15);
  const segs = rng.int(5, 8);
  const light = o.colors[0] ?? '#f0ece0';
  const dark = o.colors[1] ?? '#2c2a30';
  const lean = rng.next() * TAU;
  b.save().rotateX(-Math.PI / 2);
  for (let i = 0; i < segs; i++) {
    const t0 = i / segs, t1 = (i + 1) / segs;
    const r0 = size * 0.024 * (1 - t0 * 0.45), r1 = size * 0.024 * (1 - t1 * 0.45);
    const o0 = Math.pow(t0, 1.6) * h * 0.14, o1 = Math.pow(t1, 1.6) * h * 0.14;
    b.setColor(i % 2 === 0 ? light : dark);
    if (i % 2 === 0 && o.glow) b.setEmissive(o.glow);
    b.loft([
      { z: h * t0, pts: ringFrom(S_HEX, r0 * (i % 2 ? 1 : 1.25), r0 * (i % 2 ? 1 : 1.25), 0).map(([x, y]) => [x + Math.cos(lean) * o0, y - Math.sin(lean) * o0] as [number, number]) },
      { z: h * t1, pts: ringFrom(S_HEX, r1 * (i % 2 ? 1 : 1.25), r1 * (i % 2 ? 1 : 1.25), 0).map(([x, y]) => [x + Math.cos(lean) * o1, y - Math.sin(lean) * o1] as [number, number]) },
    ], { capStart: i === 0, capEnd: i === segs - 1 });
    b.setEmissive(0);
  }
  b.restore();
  const br = rng.int(2, 4);
  for (let i = 0; i < br; i++) {
    const t = rng.range(0.35, 0.85);
    const a = rng.next() * TAU;
    b.save().translate(Math.cos(lean) * Math.pow(t, 1.6) * h * 0.14, h * t, Math.sin(lean) * Math.pow(t, 1.6) * h * 0.14);
    b.rotateY(a).rotateZ(0.95);
    b.setColor(light);
    if (o.glow) b.setEmissive(o.glow * 0.6);
    stem(b, h * 0.24, size * 0.014, size * 0.008, 0, 0, 2);
    b.setEmissive(0);
    b.restore();
  }
};

const ventBacterialMat: FloraBuilder = (b, o) => {
  const { rng, size } = o;
  const patches = rng.int(3, 6);
  for (let i = 0; i < patches; i++) {
    const a = rng.next() * TAU;
    const d = Math.sqrt(rng.next()) * size * 0.45;
    const r = size * rng.range(0.14, 0.34);
    b.save().translate(Math.cos(a) * d, 0.02 + rng.next() * 0.03, Math.sin(a) * d).rotateY(rng.next() * TAU);
    b.setColor(shift(o.colors[i % o.colors.length], 0, rng.signed(0.09), rng.signed(0.11)));
    if (o.glow) b.setEmissive(o.glow);
    // Irregular flat polygon lying on the ground.
    const n = rng.int(5, 7);
    const outline: [number, number][] = [];
    for (let k = 0; k < n; k++) {
      const aa = (k / n) * TAU;
      const rr = r * rng.range(0.6, 1.15);
      outline.push([Math.cos(aa) * rr, Math.sin(aa) * rr]);
    }
    b.plateOn(outline, 0, new Vector3(0, 0, 0), new Vector3(1, 0, 0), new Vector3(0, 0, 1));
    b.setEmissive(0);
    b.restore();
  }
};

const ventShrimpNest: FloraBuilder = (b, o) => {
  const { rng, size } = o;
  b.setColor(shift(o.colors[0], 0, 0, -0.14));
  b.save().rotateX(-Math.PI / 2);
  b.loft([
    { z: 0, pts: ringFrom(S_OCT, size * 0.32, size * 0.32, 0) },
    { z: size * 0.11, pts: ringFrom(S_OCT, size * 0.24, size * 0.24, 0) },
    { z: size * 0.19, pts: ringFrom(S_OCT, size * 0.1, size * 0.1, 0) },
  ], { capStart: false });
  b.restore();
  const n = rng.int(5, 10);
  for (let i = 0; i < n; i++) {
    const a = rng.next() * TAU;
    const d = rng.range(0.06, 0.3) * size;
    b.save().translate(Math.cos(a) * d, size * 0.06 + rng.next() * size * 0.07, Math.sin(a) * d);
    b.rotateY(rng.next() * TAU);
    b.setColor(shift(o.colors[1] ?? '#e8d0c0', 0, rng.signed(0.08), rng.signed(0.1)));
    b.gem(size * 0.04, 5, 0.6, 0.5);
    b.restore();
  }
};

const stoneLichen: FloraBuilder = (b, o) => {
  const { rng, size } = o;
  const n = rng.int(3, 6);
  for (let i = 0; i < n; i++) {
    const a = rng.next() * TAU;
    const d = Math.sqrt(rng.next()) * size * 0.42;
    const r = size * rng.range(0.1, 0.24);
    b.save().translate(Math.cos(a) * d, 0.015, Math.sin(a) * d);
    b.setColor(shift(o.colors[i % o.colors.length], 0, rng.signed(0.07), rng.signed(0.1)));
    if (o.glow) b.setEmissive(o.glow);
    const pts = rng.int(6, 9);
    const outline: [number, number][] = [];
    for (let k = 0; k < pts; k++) {
      const aa = (k / pts) * TAU;
      outline.push([Math.cos(aa) * r * rng.range(0.55, 1.2), Math.sin(aa) * r * rng.range(0.55, 1.2)]);
    }
    b.plateOn(outline, 0, new Vector3(0, 0, 0), new Vector3(1, 0, 0), new Vector3(0, 0, 1));
    b.setEmissive(0);
    b.restore();
  }
};

const crystalSpine: FloraBuilder = (b, o) => {
  const { rng, size } = o;
  const n = rng.int(2, 4);
  for (let i = 0; i < n; i++) {
    const h = size * rng.range(0.5, 1.35);
    const r = size * rng.range(0.05, 0.11);
    const a = rng.next() * TAU;
    b.save().translate(Math.cos(a) * size * 0.13, 0, Math.sin(a) * size * 0.13);
    b.rotateY(a).rotateZ(rng.signed(0.32)).rotateX(-Math.PI / 2);
    b.setColor(shift(o.colors[i % o.colors.length], 0, rng.signed(0.08), rng.signed(0.1)));
    b.setEmissive(o.glow ?? 0.4);
    b.loft([
      { z: -h * 0.08, pts: ringFrom(S_HEX, r * 1.4, r * 1.4, 0) },
      { z: h * 0.12, pts: ringFrom(S_HEX, r, r, 0) },
      { z: h * 0.82, pts: ringFrom(S_HEX, r * 0.78, r * 0.78, 0) },
      { z: h, pts: ringFrom(S_POINT, 0, 0, 0) },
    ]);
    b.setEmissive(0);
    b.restore();
  }
};

const seaLily: FloraBuilder = (b, o) => {
  const { rng, size } = o;
  const h = size * rng.range(0.6, 1.05);
  const lean = rng.next() * TAU;
  b.setColor(shift(o.colors[0], 0, -0.1, -0.06));
  stem(b, h, size * 0.022, size * 0.016, lean, h * 0.14, 4);
  const topX = Math.cos(lean) * h * 0.14, topZ = Math.sin(lean) * h * 0.14;
  b.save().translate(topX, h, topZ);
  b.setColor(shift(o.colors[0], 0, rng.signed(0.06), rng.signed(0.08)));
  if (o.glow) b.setEmissive(o.glow);
  b.save().rotateX(-Math.PI / 2);
  b.loft([
    { z: 0, pts: ringFrom(S_HEX, size * 0.03, size * 0.03, 0) },
    { z: size * 0.055, pts: ringFrom(S_HEX, size * 0.06, size * 0.06, 0) },
  ]);
  b.restore();
  const arms = rng.int(5, 8);
  for (let i = 0; i < arms; i++) {
    const a = (i / arms) * TAU;
    const len = size * rng.range(0.18, 0.3);
    b.save().rotateY(-a).rotateZ(-0.7);
    stem(b, len, size * 0.012, size * 0.004, 0, len * 0.3, 3);
    b.restore();
  }
  b.setEmissive(0);
  b.restore();
};

const abyssalFan: FloraBuilder = (b, o) => {
  const { rng, size } = o;
  const facing = rng.next() * TAU;
  const c = o.colors[0];
  const glowC = o.colors[1] ?? c;
  b.save().rotateY(facing);
  b.setColor(shift(c, 0, 0, -0.15));
  stem(b, size * 0.26, size * 0.03, size * 0.024, 0, 0, 2);
  const ribs = rng.int(7, 11);
  for (let i = 0; i < ribs; i++) {
    const t = (i / (ribs - 1)) * 2 - 1;
    const ang = t * 1.2;
    const len = size * (1 - Math.abs(t) * 0.42) * rng.range(0.9, 1.1);
    b.setColor(c);
    b.save().translate(0, size * 0.26, 0).rotateZ(-ang);
    stem(b, len, size * 0.016, size * 0.005, 0, len * 0.12, 3);
    b.restore();
    const tipX = Math.sin(ang) * len, tipY = size * 0.26 + Math.cos(ang) * len;
    b.save().translate(tipX, tipY, 0);
    b.setColor(glowC).setEmissive(o.glow ?? 0.55);
    b.gem(size * 0.022, 5, 1, 1);
    b.setEmissive(0);
    b.restore();
  }
  b.restore();
};

const wakeFilament: FloraBuilder = (b, o) => {
  const { rng, size } = o;
  const n = rng.int(3, 6);
  for (let i = 0; i < n; i++) {
    const h = size * rng.range(0.8, 1.7);
    const a = rng.next() * TAU;
    const coil = rng.range(0.5, 1.4);
    b.setColor(shift(o.colors[i % o.colors.length], 0, rng.signed(0.1), rng.signed(0.1)));
    b.setEmissive((o.glow ?? 0.8) * rng.range(0.7, 1.1));
    const segs = 7;
    b.save().rotateX(-Math.PI / 2);
    const rings = [];
    for (let k = 0; k <= segs; k++) {
      const t = k / segs;
      const rr = size * 0.014 * (1 - t * 0.5) * (1 + Math.sin(t * 12) * 0.3);
      const ox = Math.cos(a + t * coil * TAU) * h * 0.1 * t;
      const oz = Math.sin(a + t * coil * TAU) * h * 0.1 * t;
      rings.push({
        z: h * t,
        pts: ringFrom(k === segs ? S_QUAD_POINT : S_QUAD, rr, rr, 0)
          .map(([x, y]) => [x + ox, y - oz] as [number, number]),
      });
    }
    b.loft(rings);
    b.restore();
    b.setEmissive(0);
  }
};

export const FLORA: Record<string, FloraBuilder> = {
  eelgrass, sandTuft, seaLettuce, kelpSmall, giantKelp, barnacleCluster,
  brainCoral, staghornCoral, fanCoral, tubeSponge, anemone, featherStar,
  seaWhip, glassSponge, tubeWorm, lanternPolyp, bambooCoral,
  ventBacterialMat, ventShrimpNest, stoneLichen, crystalSpine,
  seaLily, abyssalFan, wakeFilament,
};

/** Derive the `aSway` attribute from local height. */
export function addSwayAttribute(geo: BufferGeometry, power = 1.6, scale = 1): void {
  const pos = geo.getAttribute('position');
  const n = pos.count;
  const sway = new Float32Array(n);
  let minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < n; i++) {
    const y = pos.getY(i);
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const span = Math.max(0.001, maxY - minY);
  for (let i = 0; i < n; i++) {
    const t = (pos.getY(i) - minY) / span;
    sway[i] = Math.pow(t, power) * scale;
  }
  geo.setAttribute('aSway', new Float32BufferAttribute(sway, 1));
}

/** Per-instance sway, for merged chunk geometry. */
export function addSwayRange(
  geo: BufferGeometry,
  ranges: { start: number; count: number; baseY: number; height: number; scale: number }[],
  power = 1.6,
): void {
  const pos = geo.getAttribute('position');
  const sway = new Float32Array(pos.count);
  for (const r of ranges) {
    const span = Math.max(0.05, r.height);
    for (let i = r.start; i < r.start + r.count && i < pos.count; i++) {
      const t = Math.max(0, Math.min(1, (pos.getY(i) - r.baseY) / span));
      sway[i] = Math.pow(t, power) * r.scale;
    }
  }
  geo.setAttribute('aSway', new Float32BufferAttribute(sway, 1));
}

export { blade };
