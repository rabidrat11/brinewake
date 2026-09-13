/**
 * Procedural geometry toolkit.
 *
 * Every visible surface in Brinewake is built here. Nothing is loaded from
 * disk: fish, kelp, wrecks, statues, the harbour and the submarine are all
 * triangle soup assembled by these builders.
 *
 * Design notes
 * ------------
 * - Vertices carry position, normal, colour, uv and an *emissive* scalar. The
 *   emissive channel is what makes bioluminescence cost zero extra draw calls.
 * - Geometry is non-indexed by default. For a faceted low-poly look that is
 *   what you want anyway, and it makes per-face colouring trivial.
 * - The builder owns a transform stack, so composing a creature reads like
 *   turtle graphics rather than matrix bookkeeping.
 */

import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Matrix3,
  Matrix4,
  Vector3,
} from 'three';
import { TAU, clamp01, lerp } from '../core/math';

const _v0 = new Vector3();
const _v1 = new Vector3();
const _v2 = new Vector3();
const _v3 = new Vector3();
const _n = new Vector3();
const _e1 = new Vector3();
const _e2 = new Vector3();
const _c = new Color();

/** One cross-section of a loft: a polygon in the local XY plane at depth z. */
export interface LoftRing {
  z: number;
  pts: [number, number][];
  /** Optional per-ring colour, applied to the band leading away from it. */
  color?: string;
}

export interface LoftOpts extends ShapeOpts {
  capStart?: boolean;
  capEnd?: boolean;
}

export interface ShapeOpts {
  /** Compute smooth (averaged/analytic) normals rather than hard facets. */
  smooth?: boolean;
  /** Close the ends of tubes/cylinders/lathes. */
  caps?: boolean;
  /** Override the current colour for this shape only. */
  color?: string | number;
  /** Override the current emissive strength for this shape only. */
  emissive?: number;
}

export class MeshBuilder {
  private pos: number[] = [];
  private nrm: number[] = [];
  private clr: number[] = [];
  private uv: number[] = [];
  private emi: number[] = [];
  private flx: number[] = [];

  private m = new Matrix4();
  private nMat = new Matrix3();
  private stack: Matrix4[] = [];
  private r = 1;
  private g = 1;
  private b = 1;
  private e = 0;
  private f = 1;

  /** Number of vertices written so far. */
  get vertexCount(): number {
    return this.pos.length / 3;
  }

  get triangleCount(): number {
    return this.pos.length / 9;
  }

  // --- transform stack -------------------------------------------------

  save(): this {
    this.stack.push(this.m.clone());
    return this;
  }

  restore(): this {
    const m = this.stack.pop();
    if (m) {
      this.m.copy(m);
      this.nMat.setFromMatrix4(this.m).invert().transpose();
    }
    return this;
  }

  /** Reset the transform to identity. */
  identity(): this {
    this.m.identity();
    this.nMat.identity();
    return this;
  }

  private touched(): void {
    this.nMat.setFromMatrix4(this.m).invert().transpose();
  }

  translate(x: number, y: number, z: number): this {
    this.m.multiply(_tmpMat.makeTranslation(x, y, z));
    this.touched();
    return this;
  }

  rotateX(a: number): this {
    this.m.multiply(_tmpMat.makeRotationX(a));
    this.touched();
    return this;
  }

  rotateY(a: number): this {
    this.m.multiply(_tmpMat.makeRotationY(a));
    this.touched();
    return this;
  }

  rotateZ(a: number): this {
    this.m.multiply(_tmpMat.makeRotationZ(a));
    this.touched();
    return this;
  }

  scale(x: number, y = x, z = x): this {
    this.m.multiply(_tmpMat.makeScale(x, y, z));
    this.touched();
    return this;
  }

  transform(mat: Matrix4): this {
    this.m.multiply(mat);
    this.touched();
    return this;
  }

  /** Point the local +Z axis along a direction, keeping roll stable. */
  lookAlong(dx: number, dy: number, dz: number): this {
    _v0.set(dx, dy, dz);
    if (_v0.lengthSq() < 1e-9) return this;
    _v0.normalize();
    const up = Math.abs(_v0.y) > 0.98 ? _v1.set(1, 0, 0) : _v1.set(0, 1, 0);
    _v2.copy(up).cross(_v0).normalize();
    _v3.copy(_v0).cross(_v2).normalize();
    _tmpMat.makeBasis(_v2, _v3, _v0);
    this.m.multiply(_tmpMat);
    this.touched();
    return this;
  }

  // --- material state --------------------------------------------------

  setColor(c: string | number | Color): this {
    if (c instanceof Color) {
      this.r = c.r; this.g = c.g; this.b = c.b;
    } else {
      _c.set(c as never);
      this.r = _c.r; this.g = _c.g; this.b = _c.b;
    }
    return this;
  }

  setEmissive(v: number): this {
    this.e = v;
    return this;
  }

  /**
   * Animation flexibility for the following vertices, 0..1. The creature
   * shader multiplies its deformation by this, so eyes and shells can be told
   * to hold still while fins and tentacles are free to move.
   */
  setFlex(v: number): this {
    this.f = v;
    return this;
  }

  // --- raw primitives --------------------------------------------------

  /** Add a triangle in local space. Normals default to the face normal. */
  addTri(
    ax: number, ay: number, az: number,
    bx: number, by: number, bz: number,
    cx: number, cy: number, cz: number,
    na?: Vector3, nb?: Vector3, nc?: Vector3,
    uvs?: number[],
  ): this {
    _v0.set(ax, ay, az).applyMatrix4(this.m);
    _v1.set(bx, by, bz).applyMatrix4(this.m);
    _v2.set(cx, cy, cz).applyMatrix4(this.m);
    const p = this.pos;
    p.push(_v0.x, _v0.y, _v0.z, _v1.x, _v1.y, _v1.z, _v2.x, _v2.y, _v2.z);

    const nr = this.nrm;
    if (na && nb && nc) {
      _n.copy(na).applyMatrix3(this.nMat).normalize();
      nr.push(_n.x, _n.y, _n.z);
      _n.copy(nb).applyMatrix3(this.nMat).normalize();
      nr.push(_n.x, _n.y, _n.z);
      _n.copy(nc).applyMatrix3(this.nMat).normalize();
      nr.push(_n.x, _n.y, _n.z);
    } else {
      _e1.subVectors(_v1, _v0);
      _e2.subVectors(_v2, _v0);
      _n.crossVectors(_e1, _e2);
      if (_n.lengthSq() < 1e-16) _n.set(0, 1, 0);
      else _n.normalize();
      nr.push(_n.x, _n.y, _n.z, _n.x, _n.y, _n.z, _n.x, _n.y, _n.z);
    }

    const cl = this.clr;
    cl.push(this.r, this.g, this.b, this.r, this.g, this.b, this.r, this.g, this.b);
    const em = this.emi;
    em.push(this.e, this.e, this.e);
    const fl = this.flx;
    fl.push(this.f, this.f, this.f);
    const u = this.uv;
    if (uvs) u.push(uvs[0], uvs[1], uvs[2], uvs[3], uvs[4], uvs[5]);
    else u.push(0, 0, 1, 0, 0.5, 1);
    return this;
  }

  /** Quad as two triangles, wound a-b-c-d. */
  addQuad(
    ax: number, ay: number, az: number,
    bx: number, by: number, bz: number,
    cx: number, cy: number, cz: number,
    dx: number, dy: number, dz: number,
    na?: Vector3, nb?: Vector3, nc?: Vector3, nd?: Vector3,
  ): this {
    this.addTri(ax, ay, az, bx, by, bz, cx, cy, cz, na, nb, nc, [0, 0, 1, 0, 1, 1]);
    this.addTri(ax, ay, az, cx, cy, cz, dx, dy, dz, na, nc, nd, [0, 0, 1, 1, 0, 1]);
    return this;
  }

  // --- shapes ----------------------------------------------------------

  box(w: number, h: number, d: number, opts: ShapeOpts = {}): this {
    const c = this.pushState(opts);
    const x = w / 2, y = h / 2, z = d / 2;
    // +Z, -Z, +X, -X, +Y, -Y
    this.addQuad(-x, -y, z, x, -y, z, x, y, z, -x, y, z);
    this.addQuad(x, -y, -z, -x, -y, -z, -x, y, -z, x, y, -z);
    this.addQuad(x, -y, z, x, -y, -z, x, y, -z, x, y, z);
    this.addQuad(-x, -y, -z, -x, -y, z, -x, y, z, -x, y, -z);
    this.addQuad(-x, y, z, x, y, z, x, y, -z, -x, y, -z);
    this.addQuad(-x, -y, -z, x, -y, -z, x, -y, z, -x, -y, z);
    this.popState(c);
    return this;
  }

  /** A box with its 8 corners pulled in — reads far better than a plain cube. */
  bevelBox(w: number, h: number, d: number, bevel: number, opts: ShapeOpts = {}): this {
    const c = this.pushState(opts);
    const x = w / 2, y = h / 2, z = d / 2;
    const bx = Math.min(bevel, x * 0.9), by = Math.min(bevel, y * 0.9), bz = Math.min(bevel, z * 0.9);
    const verts: [number, number, number][] = [];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
      verts.push([sx * (x - bx), sy * y, sz * z]);
      verts.push([sx * x, sy * (y - by), sz * z]);
      verts.push([sx * x, sy * y, sz * (z - bz)]);
    }
    this.convexHull(verts);
    this.popState(c);
    return this;
  }

  /** UV sphere. Cheap and predictable; prefer `icosphere` for rocks. */
  sphere(r: number, wSeg = 8, hSeg = 6, opts: ShapeOpts = {}): this {
    const c = this.pushState(opts);
    const smooth = opts.smooth ?? false;
    for (let iy = 0; iy < hSeg; iy++) {
      const v0 = iy / hSeg, v1 = (iy + 1) / hSeg;
      const p0 = v0 * Math.PI, p1 = v1 * Math.PI;
      for (let ix = 0; ix < wSeg; ix++) {
        const u0 = ix / wSeg, u1 = (ix + 1) / wSeg;
        const t0 = u0 * TAU, t1 = u1 * TAU;
        const a = sph(r, t0, p0), b = sph(r, t1, p0);
        const cc = sph(r, t1, p1), d = sph(r, t0, p1);
        const na = smooth ? nrm(a) : undefined;
        const nb = smooth ? nrm(b) : undefined;
        const nc = smooth ? nrm(cc) : undefined;
        const nd = smooth ? nrm(d) : undefined;
        if (iy === 0) {
          this.addTri(a.x, a.y, a.z, cc.x, cc.y, cc.z, d.x, d.y, d.z, na, nc, nd);
        } else if (iy === hSeg - 1) {
          this.addTri(a.x, a.y, a.z, b.x, b.y, b.z, cc.x, cc.y, cc.z, na, nb, nc);
        } else {
          this.addQuad(a.x, a.y, a.z, b.x, b.y, b.z, cc.x, cc.y, cc.z, d.x, d.y, d.z, na, nb, nc, nd);
        }
      }
    }
    this.popState(c);
    return this;
  }

  /**
   * A faceted gem: two pyramids joined at a belt. Six to ten triangles, one
   * unmistakable silhouette. This is the low-poly answer to "small round
   * thing" — eyes, pearls, floats, buds — and it never reads as a sphere.
   */
  gem(r: number, sides = 6, topH = 1, botH = 0.7, opts: ShapeOpts = {}): this {
    const c = this.pushState(opts);
    for (let i = 0; i < sides; i++) {
      const a0 = (i / sides) * TAU, a1 = ((i + 1) / sides) * TAU;
      const x0 = Math.cos(a0) * r, z0 = Math.sin(a0) * r;
      const x1 = Math.cos(a1) * r, z1 = Math.sin(a1) * r;
      this.addTri(0, r * topH, 0, x0, 0, z0, x1, 0, z1);
      this.addTri(0, -r * botH, 0, x1, 0, z1, x0, 0, z0);
    }
    this.popState(c);
    return this;
  }

  /** Subdivided icosahedron — even triangle distribution, the best rock base. */
  icosphere(r: number, subdiv = 1, opts: ShapeOpts = {}): this {
    const c = this.pushState(opts);
    const tris = icoTris(subdiv);
    const smooth = opts.smooth ?? false;
    for (let i = 0; i < tris.length; i += 9) {
      const ax = tris[i] * r, ay = tris[i + 1] * r, az = tris[i + 2] * r;
      const bx = tris[i + 3] * r, by = tris[i + 4] * r, bz = tris[i + 5] * r;
      const cx = tris[i + 6] * r, cy = tris[i + 7] * r, cz = tris[i + 8] * r;
      if (smooth) {
        this.addTri(ax, ay, az, bx, by, bz, cx, cy, cz,
          _sn0.set(tris[i], tris[i + 1], tris[i + 2]),
          _sn1.set(tris[i + 3], tris[i + 4], tris[i + 5]),
          _sn2.set(tris[i + 6], tris[i + 7], tris[i + 8]));
      } else {
        this.addTri(ax, ay, az, bx, by, bz, cx, cy, cz);
      }
    }
    this.popState(c);
    return this;
  }

  /** Cylinder / truncated cone along +Y, centred at the origin. */
  cylinder(rTop: number, rBot: number, h: number, seg = 8, opts: ShapeOpts = {}): this {
    const c = this.pushState(opts);
    const caps = opts.caps ?? true;
    const smooth = opts.smooth ?? false;
    const y0 = -h / 2, y1 = h / 2;
    for (let i = 0; i < seg; i++) {
      const t0 = (i / seg) * TAU, t1 = ((i + 1) / seg) * TAU;
      const c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1);
      const slope = (rBot - rTop) / (h || 1);
      const n0 = smooth ? _sn0.set(c0, slope, s0).normalize() : undefined;
      const n1 = smooth ? _sn1.set(c1, slope, s1).normalize() : undefined;
      if (rTop < 1e-5) {
        this.addTri(c0 * rBot, y0, s0 * rBot, c1 * rBot, y0, s1 * rBot, 0, y1, 0, n0, n1, n0);
      } else if (rBot < 1e-5) {
        this.addTri(0, y0, 0, c1 * rTop, y1, s1 * rTop, c0 * rTop, y1, s0 * rTop, n0, n1, n0);
      } else {
        this.addQuad(
          c0 * rBot, y0, s0 * rBot, c1 * rBot, y0, s1 * rBot,
          c1 * rTop, y1, s1 * rTop, c0 * rTop, y1, s0 * rTop,
          n0, n1, n1, n0,
        );
      }
    }
    if (caps) {
      if (rTop > 1e-5) this.disc(rTop, seg, y1, 1);
      if (rBot > 1e-5) this.disc(rBot, seg, y0, -1);
    }
    this.popState(c);
    return this;
  }

  cone(r: number, h: number, seg = 8, opts: ShapeOpts = {}): this {
    return this.cylinder(0, r, h, seg, opts);
  }

  /** Flat disc in the XZ plane at height `y`, facing `dir` (+1 up, -1 down). */
  disc(r: number, seg = 8, y = 0, dir: 1 | -1 = 1, opts: ShapeOpts = {}): this {
    const c = this.pushState(opts);
    for (let i = 0; i < seg; i++) {
      const t0 = (i / seg) * TAU, t1 = ((i + 1) / seg) * TAU;
      if (dir > 0) {
        this.addTri(0, y, 0, Math.cos(t0) * r, y, Math.sin(t0) * r, Math.cos(t1) * r, y, Math.sin(t1) * r);
      } else {
        this.addTri(0, y, 0, Math.cos(t1) * r, y, Math.sin(t1) * r, Math.cos(t0) * r, y, Math.sin(t0) * r);
      }
    }
    this.popState(c);
    return this;
  }

  capsule(r: number, h: number, seg = 8, rings = 3, opts: ShapeOpts = {}): this {
    const c = this.pushState(opts);
    this.cylinder(r, r, h, seg, { ...opts, caps: false });
    this.save().translate(0, h / 2, 0).hemisphere(r, seg, rings, 1, opts).restore();
    this.save().translate(0, -h / 2, 0).hemisphere(r, seg, rings, -1, opts).restore();
    this.popState(c);
    return this;
  }

  hemisphere(r: number, seg = 8, rings = 3, dir: 1 | -1 = 1, opts: ShapeOpts = {}): this {
    const c = this.pushState(opts);
    const smooth = opts.smooth ?? false;
    for (let iy = 0; iy < rings; iy++) {
      const p0 = (iy / rings) * (Math.PI / 2), p1 = ((iy + 1) / rings) * (Math.PI / 2);
      for (let ix = 0; ix < seg; ix++) {
        const t0 = (ix / seg) * TAU, t1 = ((ix + 1) / seg) * TAU;
        const a = hemi(r, t0, p0, dir), b = hemi(r, t1, p0, dir);
        const cc = hemi(r, t1, p1, dir), d = hemi(r, t0, p1, dir);
        const na = smooth ? nrm(a) : undefined, nb = smooth ? nrm(b) : undefined;
        const nc = smooth ? nrm(cc) : undefined, nd = smooth ? nrm(d) : undefined;
        if (iy === rings - 1) {
          if (dir > 0) this.addTri(a.x, a.y, a.z, b.x, b.y, b.z, cc.x, cc.y, cc.z, na, nb, nc);
          else this.addTri(a.x, a.y, a.z, cc.x, cc.y, cc.z, b.x, b.y, b.z, na, nc, nb);
        } else if (dir > 0) {
          this.addQuad(a.x, a.y, a.z, b.x, b.y, b.z, cc.x, cc.y, cc.z, d.x, d.y, d.z, na, nb, nc, nd);
        } else {
          this.addQuad(a.x, a.y, a.z, d.x, d.y, d.z, cc.x, cc.y, cc.z, b.x, b.y, b.z, na, nd, nc, nb);
        }
      }
    }
    this.popState(c);
    return this;
  }

  torus(R: number, r: number, majSeg = 12, minSeg = 6, opts: ShapeOpts = {}): this {
    const c = this.pushState(opts);
    const smooth = opts.smooth ?? false;
    for (let i = 0; i < majSeg; i++) {
      const a0 = (i / majSeg) * TAU, a1 = ((i + 1) / majSeg) * TAU;
      for (let j = 0; j < minSeg; j++) {
        const b0 = (j / minSeg) * TAU, b1 = ((j + 1) / minSeg) * TAU;
        const p = (a: number, b: number) => {
          const cr = R + r * Math.cos(b);
          return { x: Math.cos(a) * cr, y: r * Math.sin(b), z: Math.sin(a) * cr };
        };
        const nfn = (a: number, b: number) =>
          new Vector3(Math.cos(a) * Math.cos(b), Math.sin(b), Math.sin(a) * Math.cos(b));
        const A = p(a0, b0), B = p(a1, b0), C = p(a1, b1), D = p(a0, b1);
        this.addQuad(A.x, A.y, A.z, B.x, B.y, B.z, C.x, C.y, C.z, D.x, D.y, D.z,
          smooth ? nfn(a0, b0) : undefined, smooth ? nfn(a1, b0) : undefined,
          smooth ? nfn(a1, b1) : undefined, smooth ? nfn(a0, b1) : undefined);
      }
    }
    this.popState(c);
    return this;
  }

  /** Plane in XZ, subdivided, optionally displaced by a height function. */
  plane(
    w: number, d: number, wSeg = 1, dSeg = 1,
    height?: (u: number, v: number) => number,
    opts: ShapeOpts = {},
  ): this {
    const c = this.pushState(opts);
    for (let j = 0; j < dSeg; j++) {
      for (let i = 0; i < wSeg; i++) {
        const u0 = i / wSeg, u1 = (i + 1) / wSeg;
        const v0 = j / dSeg, v1 = (j + 1) / dSeg;
        const x0 = (u0 - 0.5) * w, x1 = (u1 - 0.5) * w;
        const z0 = (v0 - 0.5) * d, z1 = (v1 - 0.5) * d;
        const h = height ?? (() => 0);
        this.addQuad(
          x0, h(u0, v0), z0, x1, h(u1, v0), z1 === z0 ? z0 : z0, x1, h(u1, v1), z1, x0, h(u0, v1), z1,
        );
      }
    }
    this.popState(c);
    return this;
  }

  /**
   * Surface of revolution from a 2D profile `[radius, y]`. The single most
   * useful builder in the game: pots, buoys, lamps, jellyfish bells, columns.
   */
  lathe(profile: [number, number][], seg = 10, opts: ShapeOpts = {}): this {
    const c = this.pushState(opts);
    const smooth = opts.smooth ?? false;
    const normals: Vector3[] = [];
    if (smooth) {
      for (let i = 0; i < profile.length; i++) {
        const p = profile[Math.max(0, i - 1)];
        const q = profile[Math.min(profile.length - 1, i + 1)];
        const dx = q[0] - p[0], dy = q[1] - p[1];
        normals.push(new Vector3(dy, -dx, 0).normalize());
      }
    }
    for (let i = 0; i < profile.length - 1; i++) {
      const [r0, y0] = profile[i];
      const [r1, y1] = profile[i + 1];
      for (let s = 0; s < seg; s++) {
        const t0 = (s / seg) * TAU, t1 = ((s + 1) / seg) * TAU;
        const c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1);
        const rot = (n: Vector3, ct: number, st: number) =>
          new Vector3(n.x * ct, n.y, n.x * st).normalize();
        const nA = smooth ? rot(normals[i], c0, s0) : undefined;
        const nB = smooth ? rot(normals[i], c1, s1) : undefined;
        const nC = smooth ? rot(normals[i + 1], c1, s1) : undefined;
        const nD = smooth ? rot(normals[i + 1], c0, s0) : undefined;
        if (r0 < 1e-5 && r1 < 1e-5) continue;
        if (r0 < 1e-5) {
          this.addTri(0, y0, 0, c1 * r1, y1, s1 * r1, c0 * r1, y1, s0 * r1, nA, nC, nD);
        } else if (r1 < 1e-5) {
          this.addTri(c0 * r0, y0, s0 * r0, c1 * r0, y0, s1 * r0, 0, y1, 0, nA, nB, nC);
        } else {
          this.addQuad(
            c0 * r0, y0, s0 * r0, c1 * r0, y0, s1 * r0,
            c1 * r1, y1, s1 * r1, c0 * r1, y1, s0 * r1,
            nA, nB, nC, nD,
          );
        }
      }
    }
    this.popState(c);
    return this;
  }

  /**
   * Generalised tube swept along a path with a per-section radius and an
   * optional cross-section shaper (used to squash fish bodies laterally).
   */
  tube(
    path: Vector3[],
    radius: number | ((t: number, i: number) => number),
    sides = 8,
    opts: ShapeOpts & {
      /** Multiply the local (x,y) of the ring — [wide, tall]. */
      section?: (t: number) => [number, number];
      startCap?: boolean;
      endCap?: boolean;
    } = {},
  ): this {
    if (path.length < 2) return this;
    const c = this.pushState(opts);
    const smooth = opts.smooth ?? false;
    const n = path.length;
    const rings: Vector3[][] = [];
    const ringNormals: Vector3[][] = [];

    // Parallel-transport frames: stable, no flipping at inflection points.
    const tangents: Vector3[] = [];
    for (let i = 0; i < n; i++) {
      const a = path[Math.max(0, i - 1)], b = path[Math.min(n - 1, i + 1)];
      tangents.push(new Vector3().subVectors(b, a).normalize());
    }
    let normal = new Vector3(0, 1, 0);
    if (Math.abs(tangents[0].dot(normal)) > 0.95) normal = new Vector3(1, 0, 0);
    normal.crossVectors(tangents[0], normal).cross(tangents[0]).normalize();

    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      if (i > 0) {
        const axis = new Vector3().crossVectors(tangents[i - 1], tangents[i]);
        const len = axis.length();
        if (len > 1e-6) {
          axis.divideScalar(len);
          const angle = Math.acos(clamp01(tangents[i - 1].dot(tangents[i]) * 0.5 + 0.5) * 2 - 1);
          normal.applyAxisAngle(axis, angle);
        }
        normal.addScaledVector(tangents[i], -normal.dot(tangents[i])).normalize();
      }
      const binormal = new Vector3().crossVectors(tangents[i], normal).normalize();
      const r = typeof radius === 'number' ? radius : radius(t, i);
      const sec = opts.section ? opts.section(t) : [1, 1];
      const ring: Vector3[] = [];
      const rn: Vector3[] = [];
      for (let s = 0; s < sides; s++) {
        const a = (s / sides) * TAU;
        const cx = Math.cos(a) * sec[0], cy = Math.sin(a) * sec[1];
        const p = new Vector3()
          .copy(path[i])
          .addScaledVector(binormal, cx * r)
          .addScaledVector(normal, cy * r);
        ring.push(p);
        rn.push(new Vector3()
          .addScaledVector(binormal, cx / (sec[0] || 1))
          .addScaledVector(normal, cy / (sec[1] || 1))
          .normalize());
      }
      rings.push(ring);
      ringNormals.push(rn);
    }

    for (let i = 0; i < n - 1; i++) {
      for (let s = 0; s < sides; s++) {
        const s1 = (s + 1) % sides;
        const A = rings[i][s], B = rings[i][s1], C = rings[i + 1][s1], D = rings[i + 1][s];
        this.addQuad(A.x, A.y, A.z, B.x, B.y, B.z, C.x, C.y, C.z, D.x, D.y, D.z,
          smooth ? ringNormals[i][s] : undefined, smooth ? ringNormals[i][s1] : undefined,
          smooth ? ringNormals[i + 1][s1] : undefined, smooth ? ringNormals[i + 1][s] : undefined);
      }
    }
    if (opts.startCap ?? true) this.fanCap(rings[0], path[0], true);
    if (opts.endCap ?? true) this.fanCap(rings[n - 1], path[n - 1], false);
    this.popState(c);
    return this;
  }

  private fanCap(ring: Vector3[], centre: Vector3, reverse: boolean): void {
    for (let s = 0; s < ring.length; s++) {
      const a = ring[s], b = ring[(s + 1) % ring.length];
      if (reverse) {
        this.addTri(centre.x, centre.y, centre.z, b.x, b.y, b.z, a.x, a.y, a.z);
      } else {
        this.addTri(centre.x, centre.y, centre.z, a.x, a.y, a.z, b.x, b.y, b.z);
      }
    }
  }

  /**
   * Flat double-sided ribbon along a path — fins, tails, kelp blades, banners.
   * `width(t)` is the half-width; the ribbon lies in the plane containing the
   * path tangent and `up`.
   */
  ribbon(
    path: Vector3[],
    width: (t: number) => number,
    up = new Vector3(0, 0, 1),
    opts: ShapeOpts & { thickness?: number } = {},
  ): this {
    if (path.length < 2) return this;
    const c = this.pushState(opts);
    const th = opts.thickness ?? 0;
    const n = path.length;
    const left: Vector3[] = [], right: Vector3[] = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const a = path[Math.max(0, i - 1)], b = path[Math.min(n - 1, i + 1)];
      _v0.subVectors(b, a).normalize();
      _v1.crossVectors(_v0, up).normalize();
      if (_v1.lengthSq() < 1e-8) _v1.set(1, 0, 0);
      const w = width(t);
      left.push(new Vector3().copy(path[i]).addScaledVector(_v1, w));
      right.push(new Vector3().copy(path[i]).addScaledVector(_v1, -w));
    }
    for (let i = 0; i < n - 1; i++) {
      const A = left[i], B = right[i], C = right[i + 1], D = left[i + 1];
      if (th > 0) {
        const off = up.clone().multiplyScalar(th / 2);
        const A1 = A.clone().add(off), B1 = B.clone().add(off);
        const C1 = C.clone().add(off), D1 = D.clone().add(off);
        const A2 = A.clone().sub(off), B2 = B.clone().sub(off);
        const C2 = C.clone().sub(off), D2 = D.clone().sub(off);
        this.addQuad(A1.x, A1.y, A1.z, B1.x, B1.y, B1.z, C1.x, C1.y, C1.z, D1.x, D1.y, D1.z);
        this.addQuad(D2.x, D2.y, D2.z, C2.x, C2.y, C2.z, B2.x, B2.y, B2.z, A2.x, A2.y, A2.z);
        this.addQuad(A1.x, A1.y, A1.z, D1.x, D1.y, D1.z, D2.x, D2.y, D2.z, A2.x, A2.y, A2.z);
        this.addQuad(C1.x, C1.y, C1.z, B1.x, B1.y, B1.z, B2.x, B2.y, B2.z, C2.x, C2.y, C2.z);
      } else {
        this.addQuad(A.x, A.y, A.z, B.x, B.y, B.z, C.x, C.y, C.z, D.x, D.y, D.z);
        this.addQuad(D.x, D.y, D.z, C.x, C.y, C.z, B.x, B.y, B.z, A.x, A.y, A.z);
      }
    }
    this.popState(c);
    return this;
  }

  /** Extrude a closed 2D polygon (XY) along +Z. */
  extrude(shape: [number, number][], depth: number, opts: ShapeOpts = {}): this {
    const c = this.pushState(opts);
    const z0 = -depth / 2, z1 = depth / 2;
    const nPts = shape.length;
    // Side walls
    for (let i = 0; i < nPts; i++) {
      const [x0, y0] = shape[i];
      const [x1, y1] = shape[(i + 1) % nPts];
      this.addQuad(x0, y0, z0, x1, y1, z0, x1, y1, z1, x0, y0, z1);
    }
    // Caps by fan triangulation (shapes here are convex or near-convex)
    const tris = triangulate(shape);
    for (let i = 0; i < tris.length; i += 3) {
      const a = shape[tris[i]], b = shape[tris[i + 1]], cc = shape[tris[i + 2]];
      this.addTri(a[0], a[1], z1, b[0], b[1], z1, cc[0], cc[1], z1);
      this.addTri(cc[0], cc[1], z0, b[0], b[1], z0, a[0], a[1], z0);
    }
    this.popState(c);
    return this;
  }

  /**
   * Loft a surface through explicit cross-sections.
   *
   * This is the primary modelling operation in Brinewake and the reason the
   * models are actual low-poly meshes rather than primitives stacked on each
   * other. A ring is a hand-authored polygon in the section plane; the loft
   * connects consecutive rings with quads and closes the ends.
   *
   * Because every vertex position is chosen rather than derived from a sphere,
   * a silhouette can be *designed*: a jawed head is a set of rings that get
   * wide and hook downward, not a ball glued to a tube.
   */
  loft(rings: LoftRing[], opts: LoftOpts = {}): this {
    if (rings.length < 2) return this;
    const c = this.pushState(opts);
    const smooth = opts.smooth ?? false;
    const n = rings.length;
    const sides = rings[0].pts.length;
    // Rings may be authored with different vertex counts — most often a
    // degenerate closing point. Normalise them all to the first ring's count so
    // callers can mix a hexagonal body with a single-point tip without thinking
    // about it.
    const norm: LoftRing[] = rings.map((r) => {
      if (r.pts.length === sides) return r;
      const out: [number, number][] = [];
      const degenerate = r.pts.every((p) => p[0] === r.pts[0][0] && p[1] === r.pts[0][1]);
      for (let k = 0; k < sides; k++) {
        out.push(degenerate
          ? [r.pts[0][0], r.pts[0][1]]
          : r.pts[Math.round((k / sides) * r.pts.length) % r.pts.length]);
      }
      return { z: r.z, pts: out, color: r.color };
    });

    for (let i = 0; i < n - 1; i++) {
      const a = norm[i];
      const b = norm[i + 1];
      const colA = a.color ?? null;
      for (let k = 0; k < sides; k++) {
        const k1 = (k + 1) % sides;
        const p0 = a.pts[k], p1 = a.pts[k1];
        const p2 = b.pts[k1], p3 = b.pts[k];
        if (colA) this.setColor(colA);
        // Degenerate rings (a ring collapsed to a point) become triangles.
        const aDeg = p0[0] === p1[0] && p0[1] === p1[1];
        const bDeg = p2[0] === p3[0] && p2[1] === p3[1];
        if (aDeg && bDeg) continue;
        // Sections are authored clockwise in the XY plane (top first, then the
        // +x flank), so the quad is wound in reverse to put the normals out.
        if (aDeg) {
          this.addTri(p3[0], p3[1], b.z, p2[0], p2[1], b.z, p0[0], p0[1], a.z);
        } else if (bDeg) {
          this.addTri(p2[0], p2[1], b.z, p1[0], p1[1], a.z, p0[0], p0[1], a.z);
        } else {
          this.addQuad(
            p3[0], p3[1], b.z, p2[0], p2[1], b.z,
            p1[0], p1[1], a.z, p0[0], p0[1], a.z,
          );
        }
      }
    }

    if (opts.capStart ?? true) this.capRing(norm[0], true);
    if (opts.capEnd ?? true) this.capRing(norm[n - 1], false);

    if (smooth) this.smoothRange(this.vertexCount, 0);
    this.popState(c);
    return this;
  }

  /** Close a loft ring with a triangle fan from its centroid. */
  private capRing(ring: LoftRing, front: boolean): void {
    const pts = ring.pts;
    let cx = 0, cy = 0;
    for (const p of pts) { cx += p[0]; cy += p[1]; }
    cx /= pts.length; cy /= pts.length;
    if (ring.color) this.setColor(ring.color);
    for (let k = 0; k < pts.length; k++) {
      const k1 = (k + 1) % pts.length;
      const a = pts[k], b = pts[k1];
      if (a[0] === b[0] && a[1] === b[1]) continue;
      if (front) this.addTri(cx, cy, ring.z, a[0], a[1], ring.z, b[0], b[1], ring.z);
      else this.addTri(cx, cy, ring.z, b[0], b[1], ring.z, a[0], a[1], ring.z);
    }
  }

  /** Average normals of coincident vertices, for the few surfaces that want it. */
  private smoothRange(_end: number, _start: number): void {
    // Intentionally a no-op: Brinewake is a flat-shaded game. Kept so callers
    // can express intent without the renderer quietly softening every edge.
  }

  /**
   * A flat polygon plate — fins, blades, leaves, sails. Two-sided, optionally
   * with a slight thickness, and authored as an explicit outline. This is what
   * a fin should be: five or six vertices, one flat face.
   */
  plate(outline: [number, number][], thickness = 0, opts: ShapeOpts = {}): this {
    const c = this.pushState(opts);
    const tris = triangulate(outline);
    const h = thickness * 0.5;
    for (let i = 0; i < tris.length; i += 3) {
      const a = outline[tris[i]], b = outline[tris[i + 1]], cc = outline[tris[i + 2]];
      this.addTri(a[0], a[1], h, b[0], b[1], h, cc[0], cc[1], h);
      this.addTri(cc[0], cc[1], -h, b[0], b[1], -h, a[0], a[1], -h);
    }
    if (thickness > 0) {
      for (let i = 0; i < outline.length; i++) {
        const a = outline[i], b = outline[(i + 1) % outline.length];
        this.addQuad(a[0], a[1], h, b[0], b[1], h, b[0], b[1], -h, a[0], a[1], -h);
      }
    }
    this.popState(c);
    return this;
  }

  /**
   * A plate placed with explicit basis vectors: `spanDir` is the outline's x,
   * `chordDir` is its y, and thickness runs along their cross product. Fins,
   * planes and rudders are placed with this rather than a stack of rotations
   * whose combined effect nobody can predict.
   */
  plateOn(
    outline: [number, number][], thickness: number,
    origin: Vector3, spanDir: Vector3, chordDir: Vector3,
    opts: ShapeOpts = {},
  ): this {
    const c = this.pushState(opts);
    const u = _pv0.copy(spanDir).normalize();
    const v = _pv1.copy(chordDir).normalize();
    const w = _pv2.crossVectors(u, v).normalize();
    const tris = triangulate(outline);
    const h = thickness * 0.5;
    const at = (p: [number, number], sign: number, out: Vector3) =>
      out.copy(origin)
        .addScaledVector(u, p[0])
        .addScaledVector(v, p[1])
        .addScaledVector(w, sign * h);
    const A = new Vector3(), B = new Vector3(), C = new Vector3();
    for (let i = 0; i < tris.length; i += 3) {
      const p0 = outline[tris[i]], p1 = outline[tris[i + 1]], p2 = outline[tris[i + 2]];
      at(p0, 1, A); at(p1, 1, B); at(p2, 1, C);
      this.addTri(A.x, A.y, A.z, B.x, B.y, B.z, C.x, C.y, C.z);
      at(p2, -1, A); at(p1, -1, B); at(p0, -1, C);
      this.addTri(A.x, A.y, A.z, B.x, B.y, B.z, C.x, C.y, C.z);
    }
    if (thickness > 0) {
      const D = new Vector3();
      for (let i = 0; i < outline.length; i++) {
        const p0 = outline[i], p1 = outline[(i + 1) % outline.length];
        at(p0, 1, A); at(p1, 1, B); at(p1, -1, C); at(p0, -1, D);
        this.addQuad(A.x, A.y, A.z, B.x, B.y, B.z, C.x, C.y, C.z, D.x, D.y, D.z);
      }
    }
    this.popState(c);
    return this;
  }

  /** Convex hull of an arbitrary point cloud — the crystal/rock workhorse. */
  convexHull(points: [number, number, number][]): this {
    const tris = quickHull(points);
    for (const [a, b, cc] of tris) {
      const P = points[a], Q = points[b], R = points[cc];
      this.addTri(P[0], P[1], P[2], Q[0], Q[1], Q[2], R[0], R[1], R[2]);
    }
    return this;
  }

  /**
   * A convex polyhedron from a point cloud, with each face given its own
   * colour by a callback that sees the face normal and centroid. This is how
   * rocks are made: a dozen deliberately placed points, hulled into fifteen or
   * twenty big flat faces, each shaded by which way it happens to point.
   */
  hullShaded(
    points: [number, number, number][],
    colour: (nx: number, ny: number, nz: number, cx: number, cy: number, cz: number) => string,
  ): this {
    const tris = quickHull(points);
    for (const [ia, ib, ic] of tris) {
      const A = points[ia], B = points[ib], C = points[ic];
      _pv0.set(B[0] - A[0], B[1] - A[1], B[2] - A[2]);
      _pv1.set(C[0] - A[0], C[1] - A[1], C[2] - A[2]);
      _pv2.crossVectors(_pv0, _pv1);
      if (_pv2.lengthSq() < 1e-12) continue;
      _pv2.normalize();
      const cx = (A[0] + B[0] + C[0]) / 3;
      const cy = (A[1] + B[1] + C[1]) / 3;
      const cz = (A[2] + B[2] + C[2]) / 3;
      this.setColor(colour(_pv2.x, _pv2.y, _pv2.z, cx, cy, cz));
      this.addTri(A[0], A[1], A[2], B[0], B[1], B[2], C[0], C[1], C[2]);
    }
    return this;
  }

  /** Merge another builder's contents, applying this builder's transform. */
  addBuilder(other: MeshBuilder): this {
    const p = other.pos, nr = other.nrm, cl = other.clr, u = other.uv, em = other.emi;
    for (let i = 0; i < p.length; i += 3) {
      _v0.set(p[i], p[i + 1], p[i + 2]).applyMatrix4(this.m);
      this.pos.push(_v0.x, _v0.y, _v0.z);
      _n.set(nr[i], nr[i + 1], nr[i + 2]).applyMatrix3(this.nMat).normalize();
      this.nrm.push(_n.x, _n.y, _n.z);
      this.clr.push(cl[i], cl[i + 1], cl[i + 2]);
    }
    for (let i = 0; i < u.length; i++) this.uv.push(u[i]);
    for (let i = 0; i < em.length; i++) this.emi.push(em[i]);
    const fl = other.flx;
    for (let i = 0; i < fl.length; i++) this.flx.push(fl[i]);
    return this;
  }

  /** Add an existing BufferGeometry (from three's own generators, if ever needed). */
  addGeometry(geo: BufferGeometry, color?: string | number): this {
    const src = geo.index ? geo.toNonIndexed() : geo;
    const p = src.getAttribute('position');
    const nAttr = src.getAttribute('normal');
    const saveColor = { r: this.r, g: this.g, b: this.b };
    if (color !== undefined) this.setColor(color);
    for (let i = 0; i < p.count; i += 3) {
      const get = (k: number) => [p.getX(k), p.getY(k), p.getZ(k)] as const;
      const [ax, ay, az] = get(i), [bx, by, bz] = get(i + 1), [cx, cy, cz] = get(i + 2);
      if (nAttr) {
        this.addTri(ax, ay, az, bx, by, bz, cx, cy, cz,
          _sn0.set(nAttr.getX(i), nAttr.getY(i), nAttr.getZ(i)),
          _sn1.set(nAttr.getX(i + 1), nAttr.getY(i + 1), nAttr.getZ(i + 1)),
          _sn2.set(nAttr.getX(i + 2), nAttr.getY(i + 2), nAttr.getZ(i + 2)));
      } else {
        this.addTri(ax, ay, az, bx, by, bz, cx, cy, cz);
      }
    }
    this.r = saveColor.r; this.g = saveColor.g; this.b = saveColor.b;
    if (src !== geo) src.dispose();
    return this;
  }

  /**
   * Displace every vertex added since `from` (a vertex index from
   * `vertexCount`).
   *
   * The callback sees vertices in the builder's *current local space*, which
   * is almost always what a shape author means: a boulder deformer wants to
   * think in terms of its own centre, not the world origin it happens to have
   * been translated to. Normals are recomputed per-face afterwards.
   */
  deform(fn: (v: Vector3, i: number) => void, from = 0): this {
    _inv.copy(this.m).invert();
    for (let i = from; i < this.pos.length / 3; i++) {
      _v0.set(this.pos[i * 3], this.pos[i * 3 + 1], this.pos[i * 3 + 2]).applyMatrix4(_inv);
      fn(_v0, i);
      _v0.applyMatrix4(this.m);
      this.pos[i * 3] = _v0.x;
      this.pos[i * 3 + 1] = _v0.y;
      this.pos[i * 3 + 2] = _v0.z;
    }
    this.recomputeFaceNormals(from);
    return this;
  }

  /** As `deform`, but the callback sees world-space positions. */
  deformWorld(fn: (v: Vector3, i: number) => void, from = 0): this {
    for (let i = from; i < this.pos.length / 3; i++) {
      _v0.set(this.pos[i * 3], this.pos[i * 3 + 1], this.pos[i * 3 + 2]);
      fn(_v0, i);
      this.pos[i * 3] = _v0.x;
      this.pos[i * 3 + 1] = _v0.y;
      this.pos[i * 3 + 2] = _v0.z;
    }
    this.recomputeFaceNormals(from);
    return this;
  }

  /** Recompute flat normals for the triangles starting at vertex `from`. */
  recomputeFaceNormals(from = 0): this {
    const start = Math.floor(from / 3) * 3;
    for (let i = start; i < this.pos.length / 3; i += 3) {
      _v0.set(this.pos[i * 3], this.pos[i * 3 + 1], this.pos[i * 3 + 2]);
      _v1.set(this.pos[i * 3 + 3], this.pos[i * 3 + 4], this.pos[i * 3 + 5]);
      _v2.set(this.pos[i * 3 + 6], this.pos[i * 3 + 7], this.pos[i * 3 + 8]);
      _e1.subVectors(_v1, _v0);
      _e2.subVectors(_v2, _v0);
      _n.crossVectors(_e1, _e2);
      if (_n.lengthSq() < 1e-16) _n.set(0, 1, 0); else _n.normalize();
      for (let k = 0; k < 3; k++) {
        this.nrm[(i + k) * 3] = _n.x;
        this.nrm[(i + k) * 3 + 1] = _n.y;
        this.nrm[(i + k) * 3 + 2] = _n.z;
      }
    }
    return this;
  }

  /**
   * Recolour vertices by a function of position — gradients, wear, moss.
   * Positions are given in the builder's current local space, matching
   * `deform`.
   */
  tint(fn: (v: Vector3, i: number) => Color | string | null, from = 0): this {
    _inv.copy(this.m).invert();
    for (let i = from; i < this.pos.length / 3; i++) {
      _v0.set(this.pos[i * 3], this.pos[i * 3 + 1], this.pos[i * 3 + 2]).applyMatrix4(_inv);
      const r = fn(_v0, i);
      if (!r) continue;
      if (r instanceof Color) _c.copy(r); else _c.set(r as never);
      this.clr[i * 3] = _c.r;
      this.clr[i * 3 + 1] = _c.g;
      this.clr[i * 3 + 2] = _c.b;
    }
    return this;
  }

  /** Bounding box of everything built so far. */
  bounds(): { min: Vector3; max: Vector3 } {
    const min = new Vector3(Infinity, Infinity, Infinity);
    const max = new Vector3(-Infinity, -Infinity, -Infinity);
    for (let i = 0; i < this.pos.length; i += 3) {
      min.x = Math.min(min.x, this.pos[i]); max.x = Math.max(max.x, this.pos[i]);
      min.y = Math.min(min.y, this.pos[i + 1]); max.y = Math.max(max.y, this.pos[i + 1]);
      min.z = Math.min(min.z, this.pos[i + 2]); max.z = Math.max(max.z, this.pos[i + 2]);
    }
    return { min, max };
  }

  /** Uniformly rescale so the largest dimension equals `size`. */
  normaliseTo(size: number, axis: 'x' | 'y' | 'z' | 'max' = 'max'): this {
    const { min, max } = this.bounds();
    const dx = max.x - min.x, dy = max.y - min.y, dz = max.z - min.z;
    const cur = axis === 'x' ? dx : axis === 'y' ? dy : axis === 'z' ? dz : Math.max(dx, dy, dz);
    if (cur < 1e-6) return this;
    const s = size / cur;
    for (let i = 0; i < this.pos.length; i++) this.pos[i] *= s;
    return this;
  }

  /** Shift so the object's local origin sits at the given anchor of the bbox. */
  centre(x = true, y = true, z = true): this {
    const { min, max } = this.bounds();
    const cx = x ? (min.x + max.x) / 2 : 0;
    const cy = y ? (min.y + max.y) / 2 : 0;
    const cz = z ? (min.z + max.z) / 2 : 0;
    for (let i = 0; i < this.pos.length; i += 3) {
      this.pos[i] -= cx; this.pos[i + 1] -= cy; this.pos[i + 2] -= cz;
    }
    return this;
  }

  build(): BufferGeometry {
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new Float32BufferAttribute(this.nrm, 3));
    g.setAttribute('color', new Float32BufferAttribute(this.clr, 3));
    g.setAttribute('uv', new Float32BufferAttribute(this.uv, 2));
    g.setAttribute('aEmissive', new Float32BufferAttribute(this.emi, 1));
    g.setAttribute('aFlex', new Float32BufferAttribute(this.flx, 1));
    g.computeBoundingSphere();
    g.computeBoundingBox();
    return g;
  }

  private pushState(opts: ShapeOpts): { r: number; g: number; b: number; e: number } | null {
    if (opts.color === undefined && opts.emissive === undefined) return null;
    const s = { r: this.r, g: this.g, b: this.b, e: this.e };
    if (opts.color !== undefined) this.setColor(opts.color);
    if (opts.emissive !== undefined) this.e = opts.emissive;
    return s;
  }

  private popState(s: { r: number; g: number; b: number; e: number } | null): void {
    if (!s) return;
    this.r = s.r; this.g = s.g; this.b = s.b; this.e = s.e;
  }
}

const _tmpMat = new Matrix4();
const _inv = new Matrix4();
const _pv0 = new Vector3();
const _pv1 = new Vector3();
const _pv2 = new Vector3();
const _sn0 = new Vector3();
const _sn1 = new Vector3();
const _sn2 = new Vector3();

function sph(r: number, theta: number, phi: number) {
  return {
    x: r * Math.sin(phi) * Math.cos(theta),
    y: r * Math.cos(phi),
    z: r * Math.sin(phi) * Math.sin(theta),
  };
}

function hemi(r: number, theta: number, phi: number, dir: number) {
  return {
    x: r * Math.cos(phi) * Math.cos(theta),
    y: dir * r * Math.sin(phi),
    z: r * Math.cos(phi) * Math.sin(theta),
  };
}

const _nrmTmp = new Vector3();
function nrm(p: { x: number; y: number; z: number }): Vector3 {
  return _nrmTmp.set(p.x, p.y, p.z).normalize().clone();
}

// --- icosphere cache ---------------------------------------------------

const icoCache = new Map<number, Float32Array>();

function icoTris(subdiv: number): Float32Array {
  const key = Math.max(0, Math.min(4, subdiv | 0));
  const cached = icoCache.get(key);
  if (cached) return cached;
  const t = (1 + Math.sqrt(5)) / 2;
  let verts: number[][] = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ].map((v) => {
    const l = Math.hypot(v[0], v[1], v[2]);
    return [v[0] / l, v[1] / l, v[2] / l];
  });
  let faces: number[][] = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];
  for (let s = 0; s < key; s++) {
    const mid = new Map<string, number>();
    const nf: number[][] = [];
    const getMid = (a: number, b: number) => {
      const k = a < b ? `${a}_${b}` : `${b}_${a}`;
      const e = mid.get(k);
      if (e !== undefined) return e;
      const p = [
        (verts[a][0] + verts[b][0]) / 2,
        (verts[a][1] + verts[b][1]) / 2,
        (verts[a][2] + verts[b][2]) / 2,
      ];
      const l = Math.hypot(p[0], p[1], p[2]);
      verts.push([p[0] / l, p[1] / l, p[2] / l]);
      const idx = verts.length - 1;
      mid.set(k, idx);
      return idx;
    };
    for (const [a, b, c] of faces) {
      const ab = getMid(a, b), bc = getMid(b, c), ca = getMid(c, a);
      nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
    }
    faces = nf;
  }
  const out = new Float32Array(faces.length * 9);
  let i = 0;
  for (const [a, b, c] of faces) {
    out[i++] = verts[a][0]; out[i++] = verts[a][1]; out[i++] = verts[a][2];
    out[i++] = verts[b][0]; out[i++] = verts[b][1]; out[i++] = verts[b][2];
    out[i++] = verts[c][0]; out[i++] = verts[c][1]; out[i++] = verts[c][2];
  }
  icoCache.set(key, out);
  return out;
}

// --- 2D polygon triangulation (ear clipping) ---------------------------

export function triangulate(poly: [number, number][]): number[] {
  const n = poly.length;
  if (n < 3) return [];
  const idx: number[] = [];
  for (let i = 0; i < n; i++) idx.push(i);
  // Ensure counter-clockwise winding.
  let area = 0;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = poly[i];
    const [x1, y1] = poly[(i + 1) % n];
    area += x0 * y1 - x1 * y0;
  }
  if (area < 0) idx.reverse();
  const out: number[] = [];
  let guard = 0;
  while (idx.length > 3 && guard++ < 4096) {
    let clipped = false;
    for (let i = 0; i < idx.length; i++) {
      const a = idx[(i + idx.length - 1) % idx.length];
      const b = idx[i];
      const c = idx[(i + 1) % idx.length];
      const A = poly[a], B = poly[b], C = poly[c];
      const cross = (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]);
      if (cross <= 0) continue;
      let contains = false;
      for (const j of idx) {
        if (j === a || j === b || j === c) continue;
        if (pointInTri(poly[j], A, B, C)) { contains = true; break; }
      }
      if (contains) continue;
      out.push(a, b, c);
      idx.splice(i, 1);
      clipped = true;
      break;
    }
    if (!clipped) break;
  }
  if (idx.length === 3) out.push(idx[0], idx[1], idx[2]);
  return out;
}

function pointInTri(
  p: [number, number], a: [number, number], b: [number, number], c: [number, number],
): boolean {
  const d1 = (p[0] - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (p[1] - b[1]);
  const d2 = (p[0] - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (p[1] - c[1]);
  const d3 = (p[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (p[1] - a[1]);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}

// --- 3D convex hull (incremental, adequate for <200 points) ------------

export function quickHull(points: [number, number, number][]): [number, number, number][] {
  const n = points.length;
  if (n < 4) return n === 3 ? [[0, 1, 2]] : [];
  // Start with a tetrahedron from extreme points.
  let i0 = 0, i1 = 0;
  for (let i = 1; i < n; i++) {
    if (points[i][0] < points[i0][0]) i0 = i;
    if (points[i][0] > points[i1][0]) i1 = i;
  }
  if (i0 === i1) return [];
  let i2 = -1, best = 1e-9;
  for (let i = 0; i < n; i++) {
    if (i === i0 || i === i1) continue;
    const d = triAreaSq(points[i0], points[i1], points[i]);
    if (d > best) { best = d; i2 = i; }
  }
  if (i2 < 0) return [];
  let i3 = -1; best = 1e-9;
  for (let i = 0; i < n; i++) {
    if (i === i0 || i === i1 || i === i2) continue;
    const d = Math.abs(volume(points[i0], points[i1], points[i2], points[i]));
    if (d > best) { best = d; i3 = i; }
  }
  if (i3 < 0) return [];

  let faces: [number, number, number][] =
    volume(points[i0], points[i1], points[i2], points[i3]) < 0
      ? [[i0, i1, i2], [i0, i3, i1], [i1, i3, i2], [i2, i3, i0]]
      : [[i0, i2, i1], [i0, i1, i3], [i1, i2, i3], [i2, i0, i3]];

  for (let p = 0; p < n; p++) {
    if (p === i0 || p === i1 || p === i2 || p === i3) continue;
    const visible: [number, number, number][] = [];
    const kept: [number, number, number][] = [];
    for (const f of faces) {
      if (volume(points[f[0]], points[f[1]], points[f[2]], points[p]) < -1e-9) visible.push(f);
      else kept.push(f);
    }
    if (visible.length === 0) continue;
    // Find the horizon: edges belonging to exactly one visible face.
    const edgeCount = new Map<string, [number, number]>();
    for (const f of visible) {
      const es: [number, number][] = [[f[0], f[1]], [f[1], f[2]], [f[2], f[0]]];
      for (const e of es) {
        const k = `${Math.min(e[0], e[1])}_${Math.max(e[0], e[1])}`;
        if (edgeCount.has(k)) edgeCount.delete(k);
        else edgeCount.set(k, e);
      }
    }
    faces = kept;
    for (const e of edgeCount.values()) faces.push([e[0], e[1], p]);
    if (faces.length > 4000) break;
  }
  return faces;
}

function triAreaSq(a: number[], b: number[], c: number[]): number {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
  const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
  return cx * cx + cy * cy + cz * cz;
}

function volume(a: number[], b: number[], c: number[], d: number[]): number {
  const ax = b[0] - a[0], ay = b[1] - a[1], az = b[2] - a[2];
  const bx = c[0] - a[0], by = c[1] - a[1], bz = c[2] - a[2];
  const cx = d[0] - a[0], cy = d[1] - a[1], cz = d[2] - a[2];
  return (
    ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx)
  );
}

// --- path helpers ------------------------------------------------------

/** Sample a Catmull-Rom spline through control points. */
export function splinePath(controls: Vector3[], samples: number, tension = 0.5): Vector3[] {
  if (controls.length < 2) return controls.slice();
  const out: Vector3[] = [];
  const n = controls.length;
  for (let i = 0; i < samples; i++) {
    const t = (i / (samples - 1)) * (n - 1);
    const seg = Math.min(n - 2, Math.floor(t));
    const lt = t - seg;
    const p0 = controls[Math.max(0, seg - 1)];
    const p1 = controls[seg];
    const p2 = controls[seg + 1];
    const p3 = controls[Math.min(n - 1, seg + 2)];
    out.push(catmullRom(p0, p1, p2, p3, lt, tension));
  }
  return out;
}

function catmullRom(p0: Vector3, p1: Vector3, p2: Vector3, p3: Vector3, t: number, s: number): Vector3 {
  const t2 = t * t, t3 = t2 * t;
  const f = (a: number, b: number, c: number, d: number) => {
    const m1 = s * (c - a), m2 = s * (d - b);
    return (2 * b - 2 * c + m1 + m2) * t3 + (-3 * b + 3 * c - 2 * m1 - m2) * t2 + m1 * t + b;
  };
  return new Vector3(
    f(p0.x, p1.x, p2.x, p3.x),
    f(p0.y, p1.y, p2.y, p3.y),
    f(p0.z, p1.z, p2.z, p3.z),
  );
}

/** A straight line path of `n` samples from a to b. */
export function linePath(a: Vector3, b: Vector3, n: number): Vector3[] {
  const out: Vector3[] = [];
  for (let i = 0; i < n; i++) out.push(new Vector3().lerpVectors(a, b, i / (n - 1)));
  return out;
}

/** Path along +Z with a gentle S-curve — the default fish spine. */
export function spinePath(length: number, n: number, curve = 0): Vector3[] {
  const out: Vector3[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    out.push(new Vector3(Math.sin(t * Math.PI) * curve, 0, lerp(-length / 2, length / 2, t)));
  }
  return out;
}
