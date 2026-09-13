/**
 * The creature generator.
 *
 * Animals are *modelled*, not assembled from primitives. Every body is a loft
 * through a spine of hand-authored cross-sections: the head is the front third
 * of that spine given a different outline, not a sphere glued to a tube. Fins,
 * tails and jaws are flat plates with explicit outlines — five or six vertices
 * each, one flat face, a silhouette you could cut out of paper.
 *
 * A typical animal costs 180-400 triangles.
 *
 * Output geometry carries:
 *   aBodyNorm  -1 at the tail tip .. +1 at the snout (drives the swim wave)
 *   aFlex      how freely a vertex may deform
 *   aEmissive  bioluminescence
 */

import { BufferGeometry, Float32BufferAttribute, Vector3 } from 'three';
import { MeshBuilder, type LoftRing } from './geo';
import {
  S_BOX, S_DOME, S_FLAT, S_JAW, S_KEEL, S_OVAL, S_POINT, S_ROUND,
  blendSection, ringFrom, type Section,
} from './sections';
import type { Rng } from '../core/rng';
import { TAU, clamp01, lerp } from '../core/math';
import { mixHex, shift } from './palette';

export type BodyKind =
  | 'spindle' | 'compressed' | 'eel' | 'globe' | 'flat' | 'segmented'
  | 'bell' | 'ray' | 'mantle' | 'crab' | 'star' | 'worm' | 'larva' | 'barrel'
  | 'ribbon' | 'torpedo';

export type HeadKind =
  | 'blunt' | 'pointed' | 'hammer' | 'lantern' | 'beaked' | 'bulbous'
  | 'jawed' | 'tube' | 'none' | 'shovel' | 'sawtooth';

export type TailKind =
  | 'forked' | 'fan' | 'pointed' | 'ribbon' | 'lunate' | 'whip' | 'paddle'
  | 'none' | 'trident' | 'spade';

export type FinKind = 'none' | 'small' | 'tall' | 'sail' | 'long' | 'wing' | 'spiny' | 'fringe';
export type EyeKind = 'normal' | 'large' | 'tiny' | 'none' | 'stalked' | 'tubular' | 'ring';
export type PatternKind =
  | 'plain' | 'stripes' | 'bands' | 'spots' | 'gradient' | 'countershade'
  | 'mottled' | 'reticulated' | 'chevron' | 'saddle';

export type ExtraKind =
  | 'antennae' | 'lure' | 'spines' | 'barbels' | 'glowSpots' | 'tentacles'
  | 'shell' | 'carapace' | 'frill' | 'armour' | 'legs' | 'claws' | 'siphon'
  | 'gills' | 'photophores' | 'crest' | 'tusks' | 'plates' | 'filaments'
  | 'sucker' | 'horn' | 'wings' | 'beard' | 'pearls';

export interface CreaturePalette {
  base: string;
  belly: string;
  accent: string;
  fin: string;
  glow: string;
  eye: string;
}

export interface Anatomy {
  body: BodyKind;
  head: HeadKind;
  tail: TailKind;
  dorsal: FinKind;
  pectoral: FinKind;
  pelvic?: boolean;
  anal?: boolean;
  eyes: EyeKind;
  pattern: PatternKind;
  extras: ExtraKind[];
  /** Body half-height as a fraction of length. */
  girth: number;
  /** Vertical scale of the body cross-section. */
  tall: number;
  /** Lateral scale of the body cross-section. */
  wide: number;
  /** Segment count for segmented, worm and star bodies. */
  segments?: number;
  /** Bioluminescence, 0..1. */
  glow?: number;
  /** Detail multiplier; small shoal fish get fewer stations. */
  detail?: number;
}

export function defaultAnatomy(): Anatomy {
  return {
    body: 'spindle', head: 'blunt', tail: 'forked', dorsal: 'small', pectoral: 'small',
    pelvic: true, anal: true, eyes: 'normal', pattern: 'countershade', extras: [],
    girth: 0.13, tall: 1, wide: 0.66,
  };
}

/** One cross-section of a body: position along the spine and its outline. */
interface Station {
  t: number;
  /** Half-width, as a multiple of the body radius. */
  w: number;
  /** Half-height, as a multiple of the body radius. */
  h: number;
  /** Vertical offset of the section centre, as a multiple of the radius. */
  y: number;
  section: Section;
}

// --- body plans ---------------------------------------------------------

/** The canonical fish. Widest a little forward of centre, narrow peduncle. */
const FISH: Station[] = [
  { t: 0.00, w: 0.07, h: 0.11, y: 0.00, section: S_OVAL },
  { t: 0.07, w: 0.15, h: 0.26, y: 0.00, section: S_OVAL },
  { t: 0.17, w: 0.32, h: 0.52, y: 0.01, section: S_OVAL },
  { t: 0.30, w: 0.54, h: 0.78, y: 0.02, section: S_OVAL },
  { t: 0.44, w: 0.70, h: 0.95, y: 0.03, section: S_OVAL },
  { t: 0.58, w: 0.76, h: 1.00, y: 0.03, section: S_OVAL },
  { t: 0.71, w: 0.72, h: 0.95, y: 0.02, section: S_OVAL },
  { t: 0.82, w: 0.60, h: 0.82, y: 0.00, section: S_OVAL },
  { t: 0.91, w: 0.45, h: 0.62, y: -0.03, section: S_OVAL },
  { t: 0.97, w: 0.27, h: 0.38, y: -0.06, section: S_OVAL },
  { t: 1.00, w: 0.06, h: 0.10, y: -0.08, section: S_POINT },
];

function scaleStations(src: Station[], w: number, h: number, section?: Section): Station[] {
  return src.map((s) => ({
    t: s.t, w: s.w * w, h: s.h * h, y: s.y,
    section: section ? blendSection(s.section, section, 1) : s.section,
  }));
}

function stationsFor(a: Anatomy): Station[] {
  switch (a.body) {
    case 'spindle':
      return FISH.map((s) => ({ ...s }));
    case 'torpedo':
      // Slimmer, more even: a fish built for speed.
      return FISH.map((s) => ({
        ...s,
        w: s.w * 0.85,
        h: lerp(s.h, 0.72 + 0.28 * s.h, 0.55),
      }));
    case 'compressed':
      return [
        { t: 0.00, w: 0.06, h: 0.14, y: 0, section: S_KEEL },
        { t: 0.08, w: 0.13, h: 0.42, y: 0, section: S_KEEL },
        { t: 0.20, w: 0.24, h: 0.92, y: 0, section: S_KEEL },
        { t: 0.34, w: 0.31, h: 1.34, y: 0, section: S_KEEL },
        { t: 0.50, w: 0.34, h: 1.52, y: 0, section: S_KEEL },
        { t: 0.66, w: 0.32, h: 1.44, y: -0.02, section: S_KEEL },
        { t: 0.80, w: 0.27, h: 1.14, y: -0.05, section: S_KEEL },
        { t: 0.90, w: 0.20, h: 0.76, y: -0.08, section: S_KEEL },
        { t: 0.97, w: 0.11, h: 0.40, y: -0.10, section: S_KEEL },
        { t: 1.00, w: 0.03, h: 0.10, y: -0.11, section: S_POINT },
      ];
    case 'eel':
      return [
        { t: 0.00, w: 0.05, h: 0.08, y: 0, section: S_ROUND },
        { t: 0.06, w: 0.20, h: 0.30, y: 0, section: S_ROUND },
        { t: 0.16, w: 0.44, h: 0.62, y: 0, section: S_ROUND },
        { t: 0.30, w: 0.62, h: 0.86, y: 0, section: S_ROUND },
        { t: 0.46, w: 0.70, h: 0.96, y: 0, section: S_ROUND },
        { t: 0.62, w: 0.72, h: 1.00, y: 0, section: S_ROUND },
        { t: 0.76, w: 0.72, h: 1.00, y: 0, section: S_ROUND },
        { t: 0.87, w: 0.70, h: 0.96, y: 0, section: S_ROUND },
        { t: 0.95, w: 0.60, h: 0.82, y: -0.02, section: S_ROUND },
        { t: 1.00, w: 0.28, h: 0.38, y: -0.04, section: S_ROUND },
      ];
    case 'ribbon':
      return [
        { t: 0.00, w: 0.04, h: 0.30, y: 0, section: S_KEEL },
        { t: 0.12, w: 0.10, h: 0.86, y: 0, section: S_KEEL },
        { t: 0.28, w: 0.14, h: 1.10, y: 0, section: S_KEEL },
        { t: 0.46, w: 0.15, h: 1.16, y: 0, section: S_KEEL },
        { t: 0.64, w: 0.15, h: 1.14, y: 0, section: S_KEEL },
        { t: 0.80, w: 0.14, h: 1.02, y: -0.02, section: S_KEEL },
        { t: 0.92, w: 0.12, h: 0.74, y: -0.05, section: S_KEEL },
        { t: 1.00, w: 0.05, h: 0.24, y: -0.08, section: S_KEEL },
      ];
    case 'globe':
      return [
        { t: 0.00, w: 0.10, h: 0.12, y: 0, section: S_ROUND },
        { t: 0.10, w: 0.34, h: 0.38, y: 0, section: S_ROUND },
        { t: 0.24, w: 0.72, h: 0.76, y: 0, section: S_ROUND },
        { t: 0.40, w: 1.00, h: 1.00, y: 0, section: S_ROUND },
        { t: 0.58, w: 1.10, h: 1.08, y: 0, section: S_ROUND },
        { t: 0.74, w: 1.00, h: 1.00, y: -0.02, section: S_ROUND },
        { t: 0.88, w: 0.72, h: 0.76, y: -0.06, section: S_ROUND },
        { t: 0.96, w: 0.40, h: 0.44, y: -0.10, section: S_ROUND },
        { t: 1.00, w: 0.12, h: 0.14, y: -0.12, section: S_POINT },
      ];
    case 'barrel':
      return [
        { t: 0.00, w: 0.20, h: 0.22, y: 0, section: S_ROUND },
        { t: 0.10, w: 0.72, h: 0.76, y: 0, section: S_ROUND },
        { t: 0.30, w: 0.94, h: 0.98, y: 0, section: S_ROUND },
        { t: 0.55, w: 1.00, h: 1.00, y: 0, section: S_ROUND },
        { t: 0.78, w: 0.94, h: 0.96, y: 0, section: S_ROUND },
        { t: 0.92, w: 0.76, h: 0.80, y: 0, section: S_ROUND },
        { t: 1.00, w: 0.36, h: 0.40, y: 0, section: S_ROUND },
      ];
    case 'flat':
      return [
        { t: 0.00, w: 0.10, h: 0.12, y: 0, section: S_FLAT },
        { t: 0.10, w: 0.42, h: 0.30, y: 0, section: S_FLAT },
        { t: 0.26, w: 0.90, h: 0.48, y: 0, section: S_FLAT },
        { t: 0.44, w: 1.14, h: 0.56, y: 0, section: S_FLAT },
        { t: 0.62, w: 1.10, h: 0.54, y: 0, section: S_FLAT },
        { t: 0.78, w: 0.88, h: 0.46, y: 0, section: S_FLAT },
        { t: 0.90, w: 0.58, h: 0.36, y: 0, section: S_FLAT },
        { t: 1.00, w: 0.18, h: 0.16, y: 0, section: S_FLAT },
      ];
    case 'segmented':
      return segmentedStations(a.segments ?? 8);
    case 'worm':
      return wormStations(a.segments ?? 12);
    case 'crab':
      return [
        { t: 0.00, w: 0.62, h: 0.30, y: 0, section: S_BOX },
        { t: 0.14, w: 0.88, h: 0.46, y: 0, section: S_BOX },
        { t: 0.34, w: 1.05, h: 0.58, y: 0, section: S_DOME },
        { t: 0.56, w: 1.08, h: 0.60, y: 0, section: S_DOME },
        { t: 0.76, w: 0.94, h: 0.52, y: 0, section: S_DOME },
        { t: 0.90, w: 0.68, h: 0.40, y: 0, section: S_DOME },
        { t: 1.00, w: 0.34, h: 0.24, y: 0, section: S_DOME },
      ];
    case 'larva':
      return [
        { t: 0.00, w: 0.16, h: 0.18, y: 0, section: S_ROUND },
        { t: 0.20, w: 0.56, h: 0.62, y: 0, section: S_ROUND },
        { t: 0.46, w: 0.88, h: 0.94, y: 0, section: S_ROUND },
        { t: 0.72, w: 0.86, h: 0.90, y: 0, section: S_ROUND },
        { t: 0.90, w: 0.54, h: 0.58, y: 0, section: S_ROUND },
        { t: 1.00, w: 0.14, h: 0.16, y: 0, section: S_POINT },
      ];
    default:
      return FISH.map((s) => ({ ...s }));
  }
}

function segmentedStations(n: number): Station[] {
  const out: Station[] = [];
  const total = Math.max(4, n);
  for (let i = 0; i <= total; i++) {
    const t = i / total;
    // A shrimp: fat carapace forward, tapering ringed abdomen aft, with a
    // visible pinch at every joint so the segments read individually.
    const env = t < 0.62
      ? 0.30 + 0.95 * Math.pow(t / 0.62, 0.85)
      : 1.25 - 0.75 * Math.pow((t - 0.62) / 0.38, 1.4);
    const pinch = i % 2 === 0 ? 1 : 0.84;
    out.push({
      t, w: env * pinch * 0.8, h: env * pinch,
      y: -Math.pow(1 - t, 2.2) * 0.55,
      section: t < 0.6 ? S_BOX : S_ROUND,
    });
  }
  return out;
}

function wormStations(n: number): Station[] {
  const out: Station[] = [];
  const total = Math.max(6, n);
  for (let i = 0; i <= total; i++) {
    const t = i / total;
    const env = Math.pow(Math.sin(Math.min(1, 0.12 + t * 1.02) * Math.PI * 0.94), 0.4);
    const ring = i % 2 === 0 ? 1.12 : 0.9;
    out.push({ t, w: env * ring * 0.9, h: env * ring, y: 0, section: S_ROUND });
  }
  return out;
}

// --- heads --------------------------------------------------------------

/**
 * Heads are not attached; they are the front of the same loft, re-shaped.
 * Each case rewrites the stations from `t >= 0.72` and may add a plate or two.
 */
function shapeHead(st: Station[], a: Anatomy): Station[] {
  const front = (t: number) => st.filter((s) => s.t >= t);
  const set = (t: number, w: number, h: number, y: number, sec?: Section) => {
    let best = st[0];
    for (const s of st) if (Math.abs(s.t - t) < Math.abs(best.t - t)) best = s;
    best.w = w; best.h = h; best.y = y;
    if (sec) best.section = sec;
  };
  void front;

  switch (a.head) {
    case 'blunt':
      set(0.91, 0.56, 0.76, -0.01);
      set(0.97, 0.44, 0.60, -0.03);
      set(1.00, 0.24, 0.32, -0.05, S_ROUND);
      break;
    case 'pointed':
      set(0.91, 0.36, 0.50, -0.02);
      set(0.97, 0.18, 0.24, -0.04);
      set(1.00, 0.02, 0.03, -0.05, S_POINT);
      break;
    case 'bulbous':
      set(0.82, 0.76, 1.06, 0.05, S_ROUND);
      set(0.91, 0.76, 1.04, 0.05, S_ROUND);
      set(0.97, 0.52, 0.70, 0.00, S_ROUND);
      set(1.00, 0.16, 0.22, -0.04, S_ROUND);
      break;
    case 'jawed':
      set(0.82, 0.72, 0.98, 0.02, S_JAW);
      set(0.91, 0.78, 1.02, -0.02, S_JAW);
      set(0.97, 0.66, 0.86, -0.08, S_JAW);
      set(1.00, 0.38, 0.52, -0.14, S_JAW);
      break;
    case 'lantern':
      set(0.71, 0.86, 1.10, 0.02, S_ROUND);
      set(0.82, 0.94, 1.18, 0.00, S_JAW);
      set(0.91, 0.88, 1.10, -0.06, S_JAW);
      set(0.97, 0.64, 0.80, -0.16, S_JAW);
      set(1.00, 0.30, 0.40, -0.24, S_JAW);
      break;
    case 'hammer':
      set(0.82, 0.62, 0.80, 0.00);
      set(0.91, 1.90, 0.40, 0.00, S_FLAT);
      set(0.97, 2.30, 0.34, 0.00, S_FLAT);
      set(1.00, 2.20, 0.30, 0.00, S_FLAT);
      break;
    case 'shovel':
      set(0.82, 0.74, 0.66, -0.06, S_FLAT);
      set(0.91, 0.92, 0.44, -0.12, S_FLAT);
      set(0.97, 0.86, 0.30, -0.16, S_FLAT);
      set(1.00, 0.50, 0.18, -0.18, S_FLAT);
      break;
    case 'beaked':
      set(0.91, 0.44, 0.62, -0.02);
      set(0.97, 0.26, 0.36, -0.06);
      set(1.00, 0.10, 0.14, -0.09, S_ROUND);
      break;
    case 'tube':
      set(0.71, 0.34, 0.44, 0.00, S_ROUND);
      set(0.82, 0.26, 0.32, 0.00, S_ROUND);
      set(0.91, 0.22, 0.26, 0.00, S_ROUND);
      set(0.97, 0.20, 0.24, 0.00, S_ROUND);
      set(1.00, 0.18, 0.22, 0.00, S_ROUND);
      break;
    case 'sawtooth':
      set(0.91, 0.40, 0.44, -0.02, S_FLAT);
      set(0.97, 0.24, 0.24, -0.03, S_FLAT);
      set(1.00, 0.12, 0.10, -0.03, S_FLAT);
      break;
    case 'none':
    default:
      break;
  }
  return st;
}

// --- the builder --------------------------------------------------------

export function buildCreature(
  anatomy: Anatomy, pal: CreaturePalette, length: number, rng: Rng,
): BufferGeometry {
  const b = new MeshBuilder();
  const a = anatomy;
  b.setFlex(1).setColor(pal.base);

  switch (a.body) {
    case 'bell': buildBell(b, a, pal, length, rng); break;
    case 'ray': buildRay(b, a, pal, length, rng); break;
    case 'mantle': buildMantle(b, a, pal, length, rng); break;
    case 'star': buildStar(b, a, pal, length, rng); break;
    default: buildLofted(b, a, pal, length, rng); break;
  }

  const geo = b.build();
  annotateBody(geo, length);
  return geo;
}

/** Every fish-shaped animal: one loft, plates for everything that sticks out. */
function buildLofted(
  b: MeshBuilder, a: Anatomy, pal: CreaturePalette, length: number, rng: Rng,
): void {
  const st = shapeHead(stationsFor(a), a);
  // Serpentine plans read as sausages at fish proportions; slim them down.
  const slim = a.body === 'eel' ? 0.5 : a.body === 'worm' ? 0.55
    : a.body === 'ribbon' ? 0.55 : a.body === 'segmented' ? 0.8 : 1;
  const r = length * a.girth * slim;
  const halfL = length * 0.5;

  const rings: LoftRing[] = st.map((s) => ({
    z: lerp(-halfL, halfL, s.t),
    pts: ringFrom(s.section, s.w * r * a.wide * 2.1, s.h * r * a.tall * 2.1, s.y * r * 2.1),
  }));

  // Colour the body band by band. Doing it here rather than as a post-pass
  // means every facet takes one flat colour, which is the whole point.
  const start = b.vertexCount;
  b.loft(rings, { capStart: true, capEnd: true });
  paintBody(b, a, pal, length, r, start, rng);

  addTail(b, a, pal, length, r, rng);
  addFins(b, a, pal, length, r, st);
  addHeadDetail(b, a, pal, length, r);
  addExtras(b, a, pal, length, r, rng);
  addEyes(b, a, pal, length, r, st);
}

/**
 * Body colour. Flat-shaded geometry wants flat colour regions, so patterns are
 * applied as hard thresholds rather than gradients: a stripe is a stripe.
 */
function paintBody(
  b: MeshBuilder, a: Anatomy, pal: CreaturePalette, length: number,
  r: number, from: number, rng: Rng,
): void {
  const halfL = length * 0.5;
  const freq = rng.range(4, 9);
  const phase = rng.next() * TAU;
  const hh = r * a.tall * 2.1;

  b.tint((v) => {
    const t = v.z / halfL;               // -1 tail .. +1 snout
    const up = clamp01(v.y / (hh * 0.9) * 0.5 + 0.5);
    const counter = up < 0.42 ? pal.belly : up < 0.56 ? mixHex(pal.belly, pal.base, 0.5) : pal.base;
    switch (a.pattern) {
      case 'countershade':
        return counter;
      case 'stripes':
        return Math.sin(t * freq * 2 + phase) > 0.1 ? pal.accent : counter;
      case 'bands':
        return Math.sin(t * freq + phase) > 0 ? pal.base : pal.accent;
      case 'chevron':
        return Math.sin(t * freq * 2 + Math.abs(v.y) / hh * 5 + phase) > 0.25 ? pal.accent : counter;
      case 'saddle':
        return Math.sin(t * freq * 0.7 + phase) > 0.4 && up > 0.5 ? pal.accent : counter;
      case 'spots': {
        const s = Math.sin(t * freq * 4 + phase) * Math.sin(v.y * 9 / hh) * Math.sin(v.x * 8 / hh);
        return s > 0.25 ? pal.accent : counter;
      }
      case 'reticulated': {
        const s = Math.abs(Math.sin(t * freq * 2.4)) * Math.abs(Math.sin(v.y * 7 / hh));
        return s > 0.45 ? pal.accent : pal.base;
      }
      case 'mottled': {
        const s = Math.sin(t * 9.1 + phase) + Math.sin(v.x * 7.7 / hh) + Math.sin(v.y * 6.3 / hh);
        return s > 0.4 ? pal.accent : s < -0.6 ? shift(pal.base, 0, 0, -0.08) : pal.base;
      }
      case 'gradient':
        return t > 0.25 ? pal.base : t > -0.3 ? mixHex(pal.base, pal.accent, 0.5) : pal.accent;
      case 'plain':
      default:
        return null;
    }
  }, from);
}

// --- appendages ---------------------------------------------------------

/** Caudal fin: an authored outline standing in the vertical plane at the tail. */
function addTail(
  b: MeshBuilder, a: Anatomy, pal: CreaturePalette, length: number, r: number, rng: Rng,
): void {
  if (a.tail === 'none') return;
  const z = -length * 0.5;
  const s = Math.max(r * 2.4, length * 0.17);
  b.setColor(pal.fin).setFlex(1.7);
  b.save().translate(0, 0, z + s * 0.05).rotateY(Math.PI / 2);

  // Outlines run along +x, which the rotateY above sends aft.
  const OUTLINES: Record<string, [number, number][]> = {
    forked: [
      [0, 0], [s * 0.72, s * 0.98], [s * 0.98, s * 0.6],
      [s * 0.42, 0], [s * 0.98, -s * 0.6], [s * 0.72, -s * 0.98],
    ],
    lunate: [
      [0, 0], [s * 0.5, s * 1.3], [s * 1.02, s * 0.95],
      [s * 0.32, 0], [s * 1.02, -s * 0.95], [s * 0.5, -s * 1.3],
    ],
    fan: [
      [0, 0], [s * 0.46, s * 0.88], [s * 0.92, s * 0.72],
      [s * 1.04, 0], [s * 0.92, -s * 0.72], [s * 0.46, -s * 0.88],
    ],
    spade: [
      [0, 0], [s * 0.36, s * 0.82], [s * 0.92, s * 0.62],
      [s * 1.08, 0], [s * 0.92, -s * 0.62], [s * 0.36, -s * 0.82],
    ],
    pointed: [
      [0, s * 0.34], [s * 1.15, 0], [0, -s * 0.34],
    ],
    trident: [
      [0, 0], [s * 0.9, s * 0.78], [s * 0.48, s * 0.2],
      [s * 1.15, 0], [s * 0.48, -s * 0.2], [s * 0.9, -s * 0.78],
    ],
    paddle: [
      [0, s * 0.2], [s * 0.42, s * 0.92], [s * 0.98, s * 0.58],
      [s * 1.02, -s * 0.58], [s * 0.42, -s * 0.92], [0, -s * 0.2],
    ],
  };

  const outline = OUTLINES[a.tail];
  if (outline) {
    b.plate(outline, r * 0.16);
  } else if (a.tail === 'ribbon' || a.tail === 'whip') {
    // A trailing tail is a chain of narrowing plates, so it can bend.
    b.restore();
    b.setColor(pal.fin).setFlex(2.6);
    const len = length * (a.tail === 'whip' ? 0.55 : 0.6);
    const segs = 4;
    for (let i = 0; i < segs; i++) {
      const t0 = i / segs, t1 = (i + 1) / segs;
      const w0 = s * (a.tail === 'whip' ? 0.22 : 0.5) * (1 - t0 * 0.85);
      const w1 = s * (a.tail === 'whip' ? 0.22 : 0.5) * (1 - t1 * 0.85);
      const z0 = z - len * t0, z1 = z - len * t1;
      b.addQuad(0, w0, z0, 0, w1, z1, 0, -w1, z1, 0, -w0, z0);
      b.addQuad(0, -w0, z0, 0, -w1, z1, 0, w1, z1, 0, w0, z0);
    }
    b.setFlex(1);
    return;
  }
  b.restore();
  b.setFlex(1);
  void rng;
}

function addFins(
  b: MeshBuilder, a: Anatomy, pal: CreaturePalette, length: number, r: number, st: Station[],
): void {
  const hh = r * a.tall * 2.1;
  const hw = r * a.wide * 2.1;
  b.setColor(pal.fin).setFlex(1.4);

  // Dorsal
  if (a.dorsal !== 'none') {
    const h = hh * (a.dorsal === 'sail' ? 2.2 : a.dorsal === 'tall' ? 1.5 : 0.85);
    const zc = length * 0.06;
    const len = length * (a.dorsal === 'long' || a.dorsal === 'sail' ? 0.46 : 0.26);
    if (a.dorsal === 'spiny') {
      for (let i = 0; i < 6; i++) {
        const t = i / 5;
        const z = lerp(length * 0.24, -length * 0.04, t);
        const hgt = h * (0.7 + 0.55 * Math.sin(t * Math.PI));
        b.save().translate(0, bodyTopAt(st, z, length, hh), z).rotateY(Math.PI / 2);
        b.plate([[0, 0], [-r * 0.2, hgt], [r * 0.24, hgt * 0.25]], r * 0.09);
        b.restore();
      }
    } else if (a.dorsal === 'fringe') {
      // A continuous ridge fin, built as a strip of quads following the back.
      b.setFlex(1.7);
      const segs = 7;
      for (let i = 0; i < segs; i++) {
        const t0 = i / segs, t1 = (i + 1) / segs;
        const z0 = lerp(length * 0.34, -length * 0.42, t0);
        const z1 = lerp(length * 0.34, -length * 0.42, t1);
        const b0 = bodyTopAt(st, z0, length, hh), b1 = bodyTopAt(st, z1, length, hh);
        const f0 = b0 + hh * 0.5 * Math.sin(Math.min(1, 0.2 + t0) * Math.PI * 0.9);
        const f1 = b1 + hh * 0.5 * Math.sin(Math.min(1, 0.2 + t1) * Math.PI * 0.9);
        b.addQuad(0, b0, z0, 0, f0, z0, 0, f1, z1, 0, b1, z1);
        b.addQuad(0, b1, z1, 0, f1, z1, 0, f0, z0, 0, b0, z0);
      }
      b.setFlex(1.4);
    } else {
      b.save().translate(0, bodyTopAt(st, zc, length, hh) - hh * 0.1, zc).rotateY(Math.PI / 2);
      b.plate([
        [-len * 0.5, 0], [-len * 0.18, h], [len * 0.26, h * 0.72], [len * 0.5, 0],
      ], r * 0.14);
      b.restore();
    }
  }

  // Pectorals: swept-back plates on the flank behind the head.
  if (a.pectoral !== 'none') {
    const span = hw * (a.pectoral === 'wing' ? 3.6 : a.pectoral === 'long' ? 2.5 : 1.5);
    const chord = hh * (a.pectoral === 'wing' ? 0.9 : 0.65);
    for (const side of [-1, 1]) {
      b.save();
      b.translate(side * hw * 0.82, -hh * 0.2, length * 0.2);
      b.rotateZ(side * -0.3);
      b.rotateY(side > 0 ? 0.55 : Math.PI - 0.55);
      b.rotateX(Math.PI / 2);
      b.plate([
        [0, chord * 0.5], [span * 0.55, chord * 0.08],
        [span, -chord * 0.6], [span * 0.42, -chord * 0.78], [0, -chord * 0.45],
      ], r * 0.1);
      b.restore();
    }
  }

  // Pelvic
  if (a.pelvic) {
    for (const side of [-1, 1]) {
      b.save();
      b.translate(side * hw * 0.42, -hh * 0.86, length * 0.02);
      b.rotateZ(side * -0.55);
      b.rotateY(side > 0 ? 0.4 : Math.PI - 0.4);
      b.rotateX(Math.PI / 2);
      b.plate([[0, hh * 0.16], [hh * 0.62, 0], [hh * 0.42, -hh * 0.42], [0, -hh * 0.18]], r * 0.08);
      b.restore();
    }
  }

  // Anal
  if (a.anal) {
    b.save().translate(0, -hh * 0.86, -length * 0.2).rotateY(Math.PI / 2);
    b.plate([
      [length * 0.09, 0], [length * 0.03, -hh * 0.72], [-length * 0.07, -hh * 0.46], [-length * 0.09, 0],
    ], r * 0.1);
    b.restore();
  }
  b.setFlex(1);
}

/** Interpolate the top of the body at a given z, for mounting dorsal fins. */
function bodyTopAt(st: Station[], z: number, length: number, hh: number): number {
  const t = clamp01(z / length + 0.5);
  let a = st[0], c = st[st.length - 1];
  for (let i = 0; i < st.length - 1; i++) {
    if (t >= st[i].t && t <= st[i + 1].t) { a = st[i]; c = st[i + 1]; break; }
  }
  const k = (t - a.t) / Math.max(1e-4, c.t - a.t);
  return lerp(a.h, c.h, k) * hh + lerp(a.y, c.y, k) * hh;
}

/** Teeth, beaks and rostra: the bits that make a head recognisable. */
function addHeadDetail(
  b: MeshBuilder, a: Anatomy, pal: CreaturePalette, length: number, r: number,
): void {
  const z = length * 0.5;
  const hh = r * a.tall * 2.1;
  const hw = r * a.wide * 2.1;
  switch (a.head) {
    case 'jawed':
    case 'lantern': {
      const n = a.head === 'lantern' ? 5 : 6;
      const size = hh * (a.head === 'lantern' ? 0.34 : 0.22);
      b.setColor('#f2ecd8').setFlex(0.2);
      for (let i = 0; i < n; i++) {
        const t = (i / (n - 1)) * 2 - 1;
        const x = t * hw * 0.6;
        const zz = z - hh * 0.5 - Math.abs(t) * hh * 0.25;
        b.save().translate(x, -hh * 0.22, zz);
        b.plate([[0, 0], [size * 0.28, -size], [-size * 0.28, -size * 0.85]], size * 0.16);
        b.restore();
        b.save().translate(x, hh * 0.12, zz);
        b.plate([[0, 0], [size * 0.24, size * 0.85], [-size * 0.24, size * 0.7]], size * 0.14);
        b.restore();
      }
      b.setFlex(1);
      break;
    }
    case 'beaked':
      b.setColor(mixHex(pal.accent, '#2c2318', 0.55)).setFlex(0.2);
      b.save().translate(0, -hh * 0.16, z - hh * 0.1).rotateY(Math.PI / 2);
      b.plate([[0, hh * 0.18], [-hh * 0.7, 0], [0, -hh * 0.2]], hw * 0.5);
      b.restore();
      b.setFlex(1);
      break;
    case 'sawtooth': {
      b.setColor(mixHex(pal.base, '#d8d0c0', 0.4)).setFlex(0.35);
      const len = length * 0.3;
      b.save().translate(0, -hh * 0.05, z);
      b.plate([
        [hw * 0.42, 0], [hw * 0.14, len], [-hw * 0.14, len], [-hw * 0.42, 0],
      ].map(([x, y]) => [x, y] as [number, number]), hh * 0.18);
      b.restore();
      // The teeth along the rostrum, alternating.
      b.setColor('#efe8d4');
      for (let i = 0; i < 7; i++) {
        const t = i / 6;
        for (const side of [-1, 1]) {
          b.save().translate(side * hw * (0.32 - t * 0.2), -hh * 0.05, z + len * t);
          b.plate([[0, 0], [side * hh * 0.22, hh * 0.06], [0, hh * 0.12]], hh * 0.06);
          b.restore();
        }
      }
      b.setFlex(1);
      break;
    }
    default:
      break;
  }
}

function addEyes(
  b: MeshBuilder, a: Anatomy, pal: CreaturePalette, length: number, r: number, st: Station[],
): void {
  if (a.eyes === 'none') return;
  const hh = r * a.tall * 2.1;
  const hw = r * a.wide * 2.1;
  const z = a.head === 'hammer' ? length * 0.5 - hh * 0.2 : length * 0.42;
  const size = hh * (a.eyes === 'large' ? 0.42 : a.eyes === 'tiny' ? 0.13 : a.eyes === 'tubular' ? 0.34 : 0.24);
  const xAt = a.head === 'hammer' ? hw * 2.05 : bodyWidthAt(st, z, length, hw) * 0.94;
  b.setFlex(0);
  for (const side of [-1, 1]) {
    if (a.eyes === 'stalked') {
      b.setColor(mixHex(pal.base, pal.accent, 0.45));
      b.save().translate(side * xAt * 0.55, hh * 0.5, z).rotateZ(side * -0.55);
      b.cylinder(size * 0.34, size * 0.44, hh * 0.9, 4, { caps: false });
      b.restore();
      b.save().translate(side * xAt * 0.85, hh * 1.05, z);
      b.setColor(pal.eye);
      b.gem(size * 0.85, 6, 0.85, 0.85);
      b.setColor('#0a0b10');
      b.save().translate(side * size * 0.4, 0, 0);
      b.gem(size * 0.5, 6, 0.7, 0.7);
      b.restore();
      b.restore();
      continue;
    }
    if (a.eyes === 'tubular') {
      b.save().translate(side * xAt * 0.5, hh * 0.42, z).rotateX(-Math.PI / 2);
      b.setColor(mixHex(pal.base, '#141c26', 0.55));
      b.cylinder(size * 0.95, size * 0.7, hh * 0.8, 6);
      b.restore();
      b.save().translate(side * xAt * 0.5, hh * 0.86, z);
      b.setColor(pal.glow).setEmissive(0.7);
      b.gem(size * 0.8, 6, 0.6, 0.6);
      b.setEmissive(0);
      b.restore();
      continue;
    }
    // A flat octagonal patch set into the flank, with a smaller dark pupil
    // proud of it. On a faceted head this reads far better than a ball.
    b.save().translate(side * xAt * 0.99, hh * 0.28, z).rotateY(side * Math.PI * 0.5);
    b.setColor(pal.eye);
    b.plate(octagon(size), size * 0.5);
    b.translate(0, 0, size * 0.3);
    b.setColor('#0a0b10');
    b.plate(octagon(size * 0.58), size * 0.3);
    b.restore();
    if (a.eyes === 'ring') {
      b.setColor(pal.glow).setEmissive(1);
      b.save().rotateY(side * Math.PI * 0.5);
      b.torus(size * 1.2, size * 0.16, 8, 4);
      b.restore();
      b.setEmissive(0);
    }
    b.restore();
  }
  b.setFlex(1);
}

function bodyWidthAt(st: Station[], z: number, length: number, hw: number): number {
  const t = clamp01(z / length + 0.5);
  let a = st[0], c = st[st.length - 1];
  for (let i = 0; i < st.length - 1; i++) {
    if (t >= st[i].t && t <= st[i + 1].t) { a = st[i]; c = st[i + 1]; break; }
  }
  const k = (t - a.t) / Math.max(1e-4, c.t - a.t);
  return lerp(a.w, c.w, k) * hw;
}

// --- non-fish body plans -------------------------------------------------

/** Jellyfish: a lofted bell with an authored margin, plus trailing tentacles. */
function buildBell(
  b: MeshBuilder, a: Anatomy, pal: CreaturePalette, length: number, rng: Rng,
): void {
  const R = length * 0.42;
  const H = length * 0.5;
  const glow = a.glow ?? 0.4;
  const rings: LoftRing[] = [];
  const profile: [number, number][] = [
    [0.00, 1.00], [0.34, 0.96], [0.62, 0.84], [0.84, 0.60],
    [0.98, 0.24], [1.00, -0.06], [0.94, -0.26], [0.88, -0.30],
  ];
  for (const [rr, yy] of profile) {
    rings.push({
      z: yy * H,
      pts: ringFrom(S_ROUND, rr * R, rr * R, 0),
    });
  }
  b.setColor(pal.base).setEmissive(glow * 0.55);
  // Bell apex forward, margin aft: jellyfish swim bell-first, so this is both
  // correct and the orientation the swim animation expects.
  b.loft(rings, { capStart: false, capEnd: false });
  b.setEmissive(0);

  // Radial canals: flat plates inside the bell rather than tubes on it.
  b.setColor(pal.accent).setEmissive(glow * 0.9).setFlex(0.6);
  const canals = 6;
  for (let i = 0; i < canals; i++) {
    const ang = (i / canals) * TAU;
    b.save().rotateZ(ang).rotateY(Math.PI / 2);
    b.plate([
      [H * 0.9, 0], [H * 0.4, R * 0.16], [-H * 0.12, R * 0.9],
      [-H * 0.2, R * 0.74], [H * 0.5, 0],
    ], R * 0.02);
    b.restore();
  }
  b.setEmissive(0);

  // Tentacles: narrow quad strips, cheap and they bend well.
  const n = rng.int(7, 13);
  b.setColor(pal.fin).setFlex(2.4).setEmissive(glow * 0.5);
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * TAU + rng.signed(0.12);
    const len = length * rng.range(0.7, 1.5);
    const rr = R * rng.range(0.72, 0.98);
    const px = Math.cos(ang) * rr, py = Math.sin(ang) * rr;
    const segs = 4;
    for (let k = 0; k < segs; k++) {
      const t0 = k / segs, t1 = (k + 1) / segs;
      const w0 = R * 0.05 * (1 - t0 * 0.8), w1 = R * 0.05 * (1 - t1 * 0.8);
      const s0 = 1 - t0 * 0.3, s1 = 1 - t1 * 0.3;
      const z0 = -H * 0.28 - len * t0, z1 = -H * 0.28 - len * t1;
      b.addQuad(
        px * s0 - w0, py * s0, z0, px * s0 + w0, py * s0, z0,
        px * s1 + w1, py * s1, z1, px * s1 - w1, py * s1, z1,
      );
      b.addQuad(
        px * s1 - w1, py * s1, z1, px * s1 + w1, py * s1, z1,
        px * s0 + w0, py * s0, z0, px * s0 - w0, py * s0, z0,
      );
    }
  }
  b.setEmissive(0).setFlex(1);
  addExtras(b, a, pal, length, R * 0.4, rng);
}

/** Rays: two authored wing plates and a slim lofted body between them. */
function buildRay(
  b: MeshBuilder, a: Anatomy, pal: CreaturePalette, length: number, rng: Rng,
): void {
  const span = length * 1.5 * a.wide;
  const r = length * a.girth;

  // Central body — a flattened loft so the animal has real volume at the middle.
  const st = scaleStations(stationsFor({ ...a, body: 'flat' } as Anatomy), 0.45, 0.6);
  const rings: LoftRing[] = st.map((s) => ({
    z: lerp(-length * 0.5, length * 0.5, s.t),
    pts: ringFrom(s.section, s.w * r * 3.4, s.h * r * 2.6, s.y * r),
  }));
  const start = b.vertexCount;
  b.setColor(pal.base);
  b.loft(rings);
  paintBody(b, a, pal, length, r, start, rng);

  // Wings: two flat plates, each a single authored outline. This is what a
  // manta looks like from above and there is no reason to build it any other way.
  b.setColor(mixHex(pal.base, pal.accent, 0.18)).setFlex(1.9);
  for (const side of [-1, 1]) {
    b.save().rotateX(Math.PI / 2);
    const w = span * 0.5 * side;
    b.plate([
      [0, length * 0.34],
      [w * 0.34, length * 0.36],
      [w * 0.72, length * 0.16],
      [w, -length * 0.16],
      [w * 0.78, -length * 0.3],
      [w * 0.34, -length * 0.32],
      [0, -length * 0.3],
    ], r * 0.5);
    b.restore();
  }
  b.setFlex(1);

  // Cephalic lobes at the front, which is the manta's signature.
  if (a.extras.includes('horn')) {
    b.setColor(pal.accent).setFlex(1.2);
    for (const side of [-1, 1]) {
      b.save().translate(side * r * 1.5, 0, length * 0.42).rotateX(Math.PI / 2);
      b.plate([[0, 0], [side * r * 0.7, length * 0.14], [side * r * 0.3, length * 0.18], [0, length * 0.04]], r * 0.3);
      b.restore();
    }
    b.setFlex(1);
  }

  addTail(b, a, pal, length, r * 0.6, rng);
  addEyes(b, a, pal, length * 0.78, r * 1.1, st);
  addExtras(b, a, pal, length, r, rng);
}

/** Squid and octopus: a lofted mantle pointing forward, arms trailing aft. */
function buildMantle(
  b: MeshBuilder, a: Anatomy, pal: CreaturePalette, length: number, rng: Rng,
): void {
  const r = length * a.girth * 2.2;
  const glow = a.glow ?? 0;
  const rings: LoftRing[] = [];
  const profile: [number, number][] = [
    [-0.40, 0.58], [-0.24, 0.88], [-0.04, 1.00], [0.14, 0.96],
    [0.30, 0.80], [0.42, 0.54], [0.50, 0.26], [0.56, 0.00],
  ];
  for (const [t, rr] of profile) {
    rings.push({ z: t * length, pts: ringFrom(S_ROUND, rr * r * a.wide, rr * r * a.tall, 0) });
  }
  const start = b.vertexCount;
  b.setColor(pal.base).setEmissive(glow * 0.35);
  b.loft(rings, { capStart: true, capEnd: false });
  b.setEmissive(0);
  paintBody(b, a, pal, length, r * 0.5, start, rng);

  // Head, aft of the mantle, carrying the eyes.
  b.setColor(mixHex(pal.base, pal.accent, 0.3));
  const headRings: LoftRing[] = [
    { z: -length * 0.34, pts: ringFrom(S_ROUND, r * 0.5, r * 0.46, 0) },
    { z: -length * 0.26, pts: ringFrom(S_ROUND, r * 0.82, r * 0.74, 0) },
    { z: -length * 0.40, pts: ringFrom(S_ROUND, r * 0.86, r * 0.78, 0) },
  ];
  b.loft([headRings[0], headRings[1]], { capStart: false });

  // Fins along the mantle: two plates.
  if (a.pectoral !== 'none') {
    b.setColor(pal.fin).setFlex(1.6);
    for (const side of [-1, 1]) {
      b.save().translate(side * r * 0.7, 0, 0).rotateX(Math.PI / 2);
      b.plate([
        [0, length * 0.42], [side * r * 1.35, length * 0.14],
        [side * r * 1.15, -length * 0.18], [0, -length * 0.12],
      ], r * 0.14);
      b.restore();
    }
    b.setFlex(1);
  }

  // Arms: tapering quad strips.
  const arms = 8;
  b.setColor(mixHex(pal.base, pal.fin, 0.45)).setFlex(2.5);
  for (let i = 0; i < arms; i++) {
    const ang = (i / arms) * TAU + rng.signed(0.08);
    const len = length * rng.range(0.36, 0.52);
    const bx = Math.cos(ang) * r * 0.5, by = Math.sin(ang) * r * 0.5;
    const segs = 3;
    for (let k = 0; k < segs; k++) {
      const t0 = k / segs, t1 = (k + 1) / segs;
      const w0 = r * 0.16 * (1 - t0 * 0.85), w1 = r * 0.16 * (1 - t1 * 0.85);
      const sp0 = 1 + t0 * 1.2, sp1 = 1 + t1 * 1.2;
      const z0 = -length * 0.4 - len * t0, z1 = -length * 0.4 - len * t1;
      b.addQuad(
        bx * sp0 - w0, by * sp0, z0, bx * sp0 + w0, by * sp0, z0,
        bx * sp1 + w1, by * sp1, z1, bx * sp1 - w1, by * sp1, z1,
      );
      b.addQuad(
        bx * sp1 - w1, by * sp1, z1, bx * sp1 + w1, by * sp1, z1,
        bx * sp0 + w0, by * sp0, z0, bx * sp0 - w0, by * sp0, z0,
      );
    }
  }
  b.setFlex(1);

  // Cephalopod eyes: large, on the sides of the head.
  b.setFlex(0);
  for (const side of [-1, 1]) {
    b.save().translate(side * r * 0.78, r * 0.1, -length * 0.28);
    b.setColor(pal.eye);
    b.gem(r * 0.3, 6, 0.55, 0.55);
    b.save().translate(side * r * 0.12, 0, 0);
    b.setColor('#08090c');
    b.gem(r * 0.19, 6, 0.5, 0.5);
    b.restore();
    b.restore();
  }
  b.setFlex(1);
  addExtras(b, a, pal, length, r * 0.5, rng);
}

/** Sea stars and anemones: radial arms as tapered lofts. */
function buildStar(
  b: MeshBuilder, a: Anatomy, pal: CreaturePalette, length: number, rng: Rng,
): void {
  const arms = a.segments ?? 5;
  const R = length * 0.5;
  const glow = a.glow ?? 0;
  b.setColor(pal.base).setEmissive(glow * 0.5);
  // Central disc.
  b.loft([
    { z: -R * 0.14, pts: ringFrom(S_ROUND, R * 0.22, R * 0.22, 0) },
    { z: 0, pts: ringFrom(S_ROUND, R * 0.36, R * 0.36, 0) },
    { z: R * 0.1, pts: ringFrom(S_ROUND, R * 0.2, R * 0.2, 0) },
  ]);
  for (let i = 0; i < arms; i++) {
    const ang = (i / arms) * TAU + rng.signed(0.05);
    const len = R * rng.range(0.85, 1.05);
    const thick = R * (arms > 8 ? 0.07 : 0.16);
    b.setColor(mixHex(pal.base, pal.accent, i % 2 ? 0.3 : 0));
    b.setFlex(1.5);
    b.save().rotateY(-ang).rotateX(Math.PI / 2);
    b.loft([
      { z: 0, pts: ringFrom(S_ROUND, thick, thick * 0.6, 0) },
      { z: len * 0.45, pts: ringFrom(S_ROUND, thick * 0.72, thick * 0.44, len * 0.06) },
      { z: len * 0.8, pts: ringFrom(S_ROUND, thick * 0.4, thick * 0.26, len * 0.1) },
      { z: len, pts: ringFrom(S_POINT, 0, 0, len * 0.12) },
    ]);
    b.restore();
  }
  b.setEmissive(0).setFlex(1);
  addExtras(b, a, pal, length, R * 0.25, rng);
}

// --- extras -------------------------------------------------------------

function addExtras(
  b: MeshBuilder, a: Anatomy, pal: CreaturePalette, length: number, r: number, rng: Rng,
): void {
  const glow = a.glow ?? 0;
  const hh = r * a.tall * 2.1;
  const hw = r * a.wide * 2.1;

  for (const ex of a.extras) {
    switch (ex) {
      case 'lure': {
        const stalk = length * rng.range(0.3, 0.5);
        b.setColor(mixHex(pal.base, '#241c2c', 0.5)).setFlex(1.9);
        b.save().translate(0, hh * 0.8, length * 0.4).rotateX(-0.75);
        b.cylinder(hh * 0.05, hh * 0.09, stalk, 4, { caps: false });
        b.restore();
        b.save().translate(0, hh * 0.8 + stalk * 0.72, length * 0.4 + stalk * 0.6);
        b.setColor(pal.glow).setEmissive(1);
        b.gem(hh * 0.3, 6, 1.1, 1.1);
        b.setEmissive(0);
        b.restore();
        b.setFlex(1);
        break;
      }
      case 'antennae': {
        b.setColor(mixHex(pal.base, pal.accent, 0.5)).setFlex(2.3);
        for (const side of [-1, 1]) {
          const len = length * rng.range(0.5, 1.0);
          const segs = 3;
          for (let k = 0; k < segs; k++) {
            const t0 = k / segs, t1 = (k + 1) / segs;
            const w0 = hh * 0.05 * (1 - t0 * 0.8), w1 = hh * 0.05 * (1 - t1 * 0.8);
            const x0 = side * (hw * 0.4 + len * t0 * 0.36), x1 = side * (hw * 0.4 + len * t1 * 0.36);
            const y0 = hh * 0.3 + Math.sin(t0 * 2) * len * 0.14;
            const y1 = hh * 0.3 + Math.sin(t1 * 2) * len * 0.14;
            const z0 = length * 0.46 + len * t0 * 0.72, z1 = length * 0.46 + len * t1 * 0.72;
            b.addQuad(x0 - w0, y0, z0, x0 + w0, y0, z0, x1 + w1, y1, z1, x1 - w1, y1, z1);
            b.addQuad(x1 - w1, y1, z1, x1 + w1, y1, z1, x0 + w0, y0, z0, x0 - w0, y0, z0);
          }
        }
        b.setFlex(1);
        break;
      }
      case 'barbels': {
        b.setColor(mixHex(pal.base, pal.belly, 0.5)).setFlex(2.1);
        const n = rng.int(2, 4);
        for (let i = 0; i < n; i++) {
          const side = i % 2 === 0 ? -1 : 1;
          const len = length * rng.range(0.1, 0.24);
          b.save().translate(side * hw * 0.3, -hh * 0.5, length * 0.44).rotateX(0.9);
          b.cylinder(hh * 0.015, hh * 0.05, len, 4, { caps: false });
          b.restore();
        }
        b.setFlex(1);
        break;
      }
      case 'spines': {
        b.setColor(mixHex(pal.accent, '#f0ead8', 0.3)).setFlex(0.5);
        const n = rng.int(9, 16);
        for (let i = 0; i < n; i++) {
          const t = rng.next();
          const ang = rng.next() * TAU;
          const z = lerp(length * 0.36, -length * 0.34, t);
          const rr = 0.75 + 0.3 * Math.sin(t * Math.PI);
          b.save();
          b.translate(Math.cos(ang) * hw * rr, Math.sin(ang) * hh * rr, z);
          b.lookAlong(Math.cos(ang), Math.sin(ang), 0.15);
          b.cylinder(0, hh * 0.13, hh * rng.range(0.5, 1.05), 4, { caps: false });
          b.restore();
        }
        b.setFlex(1);
        break;
      }
      case 'glowSpots':
      case 'photophores': {
        b.setColor(pal.glow).setEmissive(Math.max(0.7, glow)).setFlex(0.5);
        const n = ex === 'photophores' ? rng.int(7, 11) : rng.int(4, 7);
        for (let i = 0; i < n; i++) {
          const t = i / Math.max(1, n - 1);
          const z = lerp(length * 0.32, -length * 0.4, t);
          const y = ex === 'photophores' ? -hh * 0.62 : hh * (rng.next() - 0.5) * 1.2;
          const x = ex === 'photophores' ? (i % 2 ? hw * 0.42 : -hw * 0.42) : hw * rng.signed(0.8);
          b.save().translate(x, y, z);
          b.gem(hh * 0.075, 5, 0.55, 0.55);
          b.restore();
        }
        b.setEmissive(0).setFlex(1);
        break;
      }
      case 'filaments':
      case 'tentacles': {
        if (a.body === 'mantle' || a.body === 'bell') break;
        b.setColor(ex === 'filaments' ? pal.glow : pal.fin);
        b.setEmissive(ex === 'filaments' ? Math.max(0.5, glow) : glow * 0.4).setFlex(2.6);
        const n = rng.int(4, 8);
        for (let i = 0; i < n; i++) {
          const ang = (i / n) * TAU;
          const len = length * rng.range(0.4, 1.1);
          const bx = Math.cos(ang) * hw * 0.6, by = Math.sin(ang) * hh * 0.6;
          for (let k = 0; k < 3; k++) {
            const t0 = k / 3, t1 = (k + 1) / 3;
            const w0 = hh * 0.05 * (1 - t0 * 0.8), w1 = hh * 0.05 * (1 - t1 * 0.8);
            const z0 = -length * 0.38 - len * t0, z1 = -length * 0.38 - len * t1;
            b.addQuad(bx - w0, by, z0, bx + w0, by, z0, bx + w1, by, z1, bx - w1, by, z1);
            b.addQuad(bx - w1, by, z1, bx + w1, by, z1, bx + w0, by, z0, bx - w0, by, z0);
          }
        }
        b.setEmissive(0).setFlex(1);
        break;
      }
      case 'shell': {
        b.setColor(mixHex(pal.accent, '#f2e8d4', 0.4)).setFlex(0);
        b.save().translate(0, hh * 0.5, 0).rotateX(Math.PI / 2);
        b.loft([
          { z: -hh * 0.9, pts: ringFrom(S_POINT, 0, 0, 0) },
          { z: -hh * 0.5, pts: ringFrom(S_ROUND, hh * 0.6, hh * 0.6, 0) },
          { z: 0, pts: ringFrom(S_ROUND, hh * 1.0, hh * 1.0, 0) },
          { z: hh * 0.55, pts: ringFrom(S_ROUND, hh * 0.72, hh * 0.72, 0) },
          { z: hh * 0.85, pts: ringFrom(S_POINT, 0, 0, 0) },
        ]);
        b.restore();
        b.setFlex(1);
        break;
      }
      case 'carapace': {
        b.setColor(mixHex(pal.base, pal.accent, 0.4)).setFlex(0.2);
        b.save().translate(0, hh * 0.42, length * 0.02).rotateX(Math.PI / 2);
        b.loft([
          { z: -length * 0.28, pts: ringFrom(S_DOME, hw * 0.5, hw * 0.5, 0) },
          { z: 0, pts: ringFrom(S_DOME, hw * 1.15, hw * 1.15, 0) },
          { z: length * 0.26, pts: ringFrom(S_DOME, hw * 0.62, hw * 0.62, 0) },
        ]);
        b.restore();
        b.setFlex(1);
        break;
      }
      case 'plates':
      case 'armour': {
        b.setColor(mixHex(pal.base, '#8f9299', 0.35)).setFlex(0.3);
        for (let i = 0; i < 6; i++) {
          const t = i / 5;
          const z = lerp(length * 0.3, -length * 0.34, t);
          const w = hw * (0.9 + 0.28 * Math.sin(t * Math.PI));
          b.save().translate(0, hh * 0.66, z).rotateX(0.16);
          b.plate([
            [-w, 0], [-w * 0.6, hh * 0.22], [w * 0.6, hh * 0.22], [w, 0],
          ], length * 0.06);
          b.restore();
        }
        b.setFlex(1);
        break;
      }
      case 'frill':
      case 'crest': {
        b.setColor(pal.accent).setEmissive(glow * 0.6).setFlex(1.5);
        b.save().translate(0, hh * 0.9, length * 0.2).rotateY(Math.PI / 2);
        b.plate([
          [-length * 0.2, 0], [-length * 0.06, hh * 0.9],
          [length * 0.1, hh * 0.75], [length * 0.2, 0],
        ], hw * 0.1);
        b.restore();
        b.setEmissive(0).setFlex(1);
        break;
      }
      case 'gills': {
        b.setColor(mixHex(pal.base, '#8c3b3b', 0.5)).setFlex(0.4);
        for (const side of [-1, 1]) {
          for (let i = 0; i < 4; i++) {
            b.save().translate(side * hw * 0.9, 0, length * 0.26 - i * hh * 0.3).rotateY(side * Math.PI * 0.5);
            b.plate([[0, -hh * 0.4], [hh * 0.1, -hh * 0.34], [hh * 0.1, hh * 0.34], [0, hh * 0.4]], hh * 0.03);
            b.restore();
          }
        }
        b.setFlex(1);
        break;
      }
      case 'horn':
      case 'tusks': {
        if (a.body === 'ray') break;
        b.setColor(mixHex(pal.accent, '#f0e6d0', 0.5)).setFlex(0.2);
        const sides = ex === 'tusks' ? [-1, 1] : [0];
        for (const side of sides) {
          b.save();
          b.translate(side * hw * 0.4, ex === 'horn' ? hh * 0.85 : -hh * 0.2, length * 0.4);
          b.rotateX(ex === 'horn' ? -0.85 : -1.4);
          b.cylinder(0, hh * 0.16, hh * 1.5, 4, { caps: false });
          b.restore();
        }
        b.setFlex(1);
        break;
      }
      case 'wings': {
        b.setColor(pal.fin).setFlex(1.9);
        for (const side of [-1, 1]) {
          b.save().translate(side * hw * 0.7, hh * 0.1, length * 0.06).rotateX(Math.PI / 2);
          b.plate([
            [0, length * 0.16], [side * hw * 2.6, length * 0.1],
            [side * hw * 3.1, -length * 0.12], [side * hw * 1.4, -length * 0.2], [0, -length * 0.14],
          ], hh * 0.08);
          b.restore();
        }
        b.setFlex(1);
        break;
      }
      case 'legs': {
        b.setColor(mixHex(pal.base, pal.accent, 0.4)).setFlex(1.5);
        const n = a.body === 'crab' ? 4 : (a.segments ?? 5);
        for (const side of [-1, 1]) {
          for (let i = 0; i < n; i++) {
            const t = n === 1 ? 0.5 : i / (n - 1);
            const z = lerp(length * 0.26, -length * 0.28, t);
            const out = lerp(0.9, 1.5, t) * hw;
            const knee = new Vector3(side * (hw * 0.7 + out * 0.5), -hh * 0.1, z + out * 0.12);
            const foot = new Vector3(side * (hw * 0.7 + out * 1.1), -hh * 1.5, z + out * 0.3);
            b.tube([new Vector3(side * hw * 0.6, -hh * 0.2, z), knee], hh * 0.09, 4);
            b.tube([knee, foot], (k) => hh * 0.075 * (1 - k * 0.6), 4);
          }
        }
        b.setFlex(1);
        break;
      }
      case 'claws': {
        b.setColor(mixHex(pal.base, pal.accent, 0.5)).setFlex(1.3);
        for (const side of [-1, 1]) {
          const base = new Vector3(side * hw * 0.7, -hh * 0.1, length * 0.24);
          const mid = new Vector3(side * hw * 1.5, hh * 0.1, length * 0.48);
          b.tube([base, mid], hh * 0.13, 5);
          b.save().translate(mid.x, mid.y, mid.z).rotateY(side * -0.5);
          b.setColor(pal.accent);
          b.loft([
            { z: -length * 0.06, pts: ringFrom(S_BOX, hh * 0.16, hh * 0.14, 0) },
            { z: length * 0.02, pts: ringFrom(S_BOX, hh * 0.3, hh * 0.24, 0) },
            { z: length * 0.1, pts: ringFrom(S_BOX, hh * 0.22, hh * 0.2, 0) },
          ]);
          for (const k of [-1, 1]) {
            b.save().translate(0, k * hh * 0.12, length * 0.12).rotateX(k * 0.3);
            b.setColor(mixHex(pal.accent, '#f0e8d8', 0.45));
            b.cylinder(0, hh * 0.09, length * 0.18, 4, { caps: false });
            b.restore();
          }
          b.restore();
        }
        b.setFlex(1);
        break;
      }
      case 'siphon': {
        b.setColor(mixHex(pal.base, pal.belly, 0.4)).setFlex(0.9);
        b.save().translate(0, -hh * 0.45, -length * 0.16).rotateX(1.25);
        b.cylinder(hh * 0.22, hh * 0.34, hh * 1.0, 5);
        b.restore();
        b.setFlex(1);
        break;
      }
      case 'sucker': {
        b.setColor(mixHex(pal.belly, pal.accent, 0.3)).setFlex(0.4);
        b.save().translate(0, -hh * 0.9, length * 0.02).rotateX(Math.PI / 2);
        b.loft([
          { z: 0, pts: ringFrom(S_ROUND, hh * 0.85, hh * 0.85, 0) },
          { z: hh * 0.3, pts: ringFrom(S_ROUND, hh * 0.55, hh * 0.55, 0) },
        ]);
        b.restore();
        b.setFlex(1);
        break;
      }
      case 'beard': {
        b.setColor(mixHex(pal.fin, pal.belly, 0.4)).setFlex(2.4);
        const n = rng.int(5, 9);
        for (let i = 0; i < n; i++) {
          const ang = rng.range(-1.0, 1.0);
          const len = length * rng.range(0.08, 0.2);
          b.save().translate(Math.sin(ang) * hw * 0.5, -hh * 0.6, length * 0.4).rotateX(1.2);
          b.cylinder(hh * 0.012, hh * 0.04, len, 3, { caps: false });
          b.restore();
        }
        b.setFlex(1);
        break;
      }
      case 'pearls': {
        b.setColor(pal.glow).setEmissive(Math.max(0.6, glow)).setFlex(0.4);
        const n = rng.int(3, 6);
        for (let i = 0; i < n; i++) {
          const t = i / Math.max(1, n - 1);
          b.save().translate(0, hh * 0.95, lerp(length * 0.28, -length * 0.28, t));
          b.gem(hh * 0.2, 6, 1, 1);
          b.restore();
        }
        b.setEmissive(0).setFlex(1);
        break;
      }
    }
  }
}

function octagon(r: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + Math.PI / 8;
    out.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return out;
}

/** Write aBodyNorm from the local Z extent. */
function annotateBody(geo: BufferGeometry, length: number): void {
  const pos = geo.getAttribute('position');
  const n = pos.count;
  const arr = new Float32Array(n);
  const half = Math.max(0.001, length * 0.5);
  for (let i = 0; i < n; i++) arr[i] = Math.max(-1, Math.min(1, pos.getZ(i) / half));
  geo.setAttribute('aBodyNorm', new Float32BufferAttribute(arr, 1));
}
