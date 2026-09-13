/**
 * Colour toolkit and the game's master palette.
 *
 * Brinewake's look depends on colour discipline more than on polygon count.
 * Every mesh in the game pulls its colours through here so that a region reads
 * as one painting rather than a pile of independently-tinted objects.
 */

import { Color } from 'three';
import { clamp01, lerp } from '../core/math';
import type { Rng } from '../core/rng';

// --- brand palette -----------------------------------------------------

export const Brand = {
  jade: '#398d89',
  abyssInk: '#082a35',
  sunlitSand: '#eedaa0',
  subYellow: '#eebd62',
  coralRose: '#eaa494',
  planktonMint: '#a5eee0',
  brassLight: '#d9b779',
  brassDark: '#7d5f38',
  parchment: '#f3e7cd',
  deepTeal: '#0d404a',
  rust: '#a4553c',
  bone: '#e6dfd0',
  seagrass: '#5f9455',
  violetDeep: '#3b2f63',
  glow: '#8ff2e2',
} as const;

/** Parse '#rrggbb' into a packed 0xRRGGBB integer. */
export function hexInt(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

export function toHex(n: number): string {
  return '#' + (n >>> 0).toString(16).padStart(6, '0').slice(-6);
}

/** Linear-space Color instance (three's colour management handles the rest). */
export function col(hex: string | number): Color {
  return new Color(hex as never);
}

// --- HSL helpers -------------------------------------------------------

export interface Hsl {
  h: number; // 0..1
  s: number; // 0..1
  l: number; // 0..1
}

export function rgbToHsl(r: number, g: number, b: number): Hsl {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h, s, l };
}

function hue2rgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 1) + 1) % 1;
  s = clamp01(s);
  l = clamp01(l);
  if (s === 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)];
}

export function hslHex(h: number, s: number, l: number): string {
  const [r, g, b] = hslToRgb(h, s, l);
  const to = (v: number) => Math.round(clamp01(v) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** Nudge a colour in HSL space — the workhorse for procedural variation. */
export function shift(
  hex: string | number,
  dh = 0,
  ds = 0,
  dl = 0,
): string {
  const c = new Color(hex as never);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  return hslHex(hsl.h + dh, hsl.s + ds, hsl.l + dl);
}

export function mixHex(a: string | number, b: string | number, t: number): string {
  const ca = new Color(a as never).clone();
  const cb = new Color(b as never);
  ca.lerp(cb, clamp01(t));
  return '#' + ca.getHexString();
}

/** Small random variation around a base colour — keeps flat-shaded meshes alive. */
export function jitter(hex: string, rng: Rng, h = 0.02, s = 0.06, l = 0.06): string {
  return shift(hex, rng.signed(h), rng.signed(s), rng.signed(l));
}

/**
 * Build a smooth N-stop ramp between key colours. Used for depth gradients,
 * creature body ramps and mineral banding.
 */
export function ramp(stops: string[], n: number): string[] {
  if (stops.length === 1) return new Array(n).fill(stops[0]);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    const f = t * (stops.length - 1);
    const i0 = Math.min(stops.length - 1, Math.floor(f));
    const i1 = Math.min(stops.length - 1, i0 + 1);
    out.push(mixHex(stops[i0], stops[i1], f - i0));
  }
  return out;
}

/** Sample a ramp continuously. */
export function sampleRamp(stops: string[], t: number): string {
  const f = clamp01(t) * (stops.length - 1);
  const i0 = Math.min(stops.length - 1, Math.floor(f));
  const i1 = Math.min(stops.length - 1, i0 + 1);
  return mixHex(stops[i0], stops[i1], f - i0);
}

/**
 * Harmonic colour scheme generation. Species and artefacts pick a *scheme*
 * rather than free-floating colours, which is why the bestiary looks like one
 * artist drew it.
 */
export type SchemeKind =
  | 'analogous'
  | 'complementary'
  | 'split'
  | 'triad'
  | 'monochrome'
  | 'warmCool';

export function scheme(baseHex: string, kind: SchemeKind, rng?: Rng): string[] {
  const c = new Color(baseHex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  const j = (v: number) => (rng ? v + rng.signed(0.015) : v);
  switch (kind) {
    case 'analogous':
      return [
        hslHex(j(hsl.h - 0.07), hsl.s, hsl.l),
        baseHex,
        hslHex(j(hsl.h + 0.07), hsl.s * 0.9, hsl.l * 1.12),
      ];
    case 'complementary':
      return [baseHex, hslHex(j(hsl.h + 0.5), hsl.s * 0.85, hsl.l * 1.05)];
    case 'split':
      return [
        baseHex,
        hslHex(j(hsl.h + 0.42), hsl.s * 0.8, hsl.l * 1.1),
        hslHex(j(hsl.h + 0.58), hsl.s * 0.8, hsl.l * 0.9),
      ];
    case 'triad':
      return [
        baseHex,
        hslHex(j(hsl.h + 1 / 3), hsl.s, hsl.l),
        hslHex(j(hsl.h + 2 / 3), hsl.s, hsl.l),
      ];
    case 'monochrome':
      return [
        hslHex(hsl.h, hsl.s * 0.7, hsl.l * 0.72),
        baseHex,
        hslHex(hsl.h, hsl.s * 0.9, Math.min(0.92, hsl.l * 1.3)),
      ];
    case 'warmCool':
      return [baseHex, hslHex(j(0.09), 0.55, 0.62), hslHex(j(0.55), 0.5, 0.5)];
  }
}

/** Rarity colours, used consistently by UI, particles and catalogue. */
export const RarityColour: Record<string, string> = {
  common: '#9fb6bd',
  uncommon: '#7fd0a6',
  rare: '#68b6f0',
  exotic: '#c79af5',
  legendary: '#f3c56b',
  mythic: '#f58fb6',
};

export const RarityLabel: Record<string, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  exotic: 'Exotic',
  legendary: 'Legendary',
  mythic: 'Mythic',
};

/** Multiplier applied to base value by rarity — keeps the economy legible. */
export const RarityValueMult: Record<string, number> = {
  common: 1,
  uncommon: 1.9,
  rare: 3.6,
  exotic: 7.5,
  legendary: 16,
  mythic: 34,
};

export const RarityOrder = ['common', 'uncommon', 'rare', 'exotic', 'legendary', 'mythic'] as const;
export type Rarity = (typeof RarityOrder)[number];

/**
 * Depth-driven ambient water colour. This one function is responsible for a
 * large share of the game's mood: it is what makes 20 m feel like a summer
 * afternoon and 4000 m feel like nothing at all.
 */
const DEPTH_STOPS: { d: number; c: string }[] = [
  { d: 0, c: '#7fd8d2' },
  { d: 18, c: '#43b0b4' },
  { d: 60, c: '#1f8299' },
  { d: 150, c: '#12607f' },
  { d: 340, c: '#0d4468' },
  { d: 700, c: '#132c55' },
  { d: 1300, c: '#101d3c' },
  { d: 2400, c: '#0a1228' },
  { d: 4200, c: '#050a18' },
  { d: 6500, c: '#02040c' },
  { d: 9500, c: '#010207' },
];

export function waterColourAt(depth: number): Color {
  let i = 0;
  while (i < DEPTH_STOPS.length - 2 && depth > DEPTH_STOPS[i + 1].d) i++;
  const a = DEPTH_STOPS[i], b = DEPTH_STOPS[i + 1];
  const t = clamp01((depth - a.d) / (b.d - a.d));
  return new Color(a.c).lerp(new Color(b.c), t);
}

/** How much daylight reaches a given depth, 1 at the surface. */
export function lightAt(depth: number): number {
  if (depth <= 0) return 1;
  return Math.exp(-depth / 120) * 0.85 + Math.exp(-depth / 460) * 0.15;
}

/** Fog density curve — tight near the surface, opaque in the abyss. */
export function fogDensityAt(depth: number, base: number): number {
  const murk = lerp(1, 2.1, clamp01(depth / 1400));
  return base * murk;
}
