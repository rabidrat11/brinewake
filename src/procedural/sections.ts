/**
 * Cross-section library.
 *
 * Every lofted body in Brinewake is described by a spine of stations, and each
 * station picks one of these eight-point outlines. Because they all share a
 * vertex count they can be blended into each other along a body, which is what
 * lets a fish transition smoothly from a keeled belly to a flat, wide skull
 * without any of the geometry being a sphere stuck onto a tube.
 *
 * Outlines are given in the section plane, normalised so that x and y run to
 * roughly ±1, listed anticlockwise starting from the top.
 */

export type Section = readonly [number, number][];

/** Rounded, slightly belly-heavy: the default fish body. */
export const S_OVAL: Section = [
  [0, 1], [0.58, 0.76], [0.9, 0.12], [0.7, -0.58],
  [0, -1], [-0.7, -0.58], [-0.9, 0.12], [-0.58, 0.76],
];

/** Deep and narrow — laterally compressed reef fish. */
export const S_KEEL: Section = [
  [0, 1], [0.26, 0.62], [0.38, 0], [0.28, -0.6],
  [0, -1], [-0.28, -0.6], [-0.38, 0], [-0.26, 0.62],
];

/** Wide and shallow — rays, flatfish, skull plates. */
export const S_FLAT: Section = [
  [0, 0.34], [0.55, 0.3], [1, 0], [0.55, -0.26],
  [0, -0.34], [-0.55, -0.26], [-1, 0], [-0.55, 0.3],
];

/** Near-circular, for eels and worms. */
export const S_ROUND: Section = [
  [0, 1], [0.71, 0.71], [1, 0], [0.71, -0.71],
  [0, -1], [-0.71, -0.71], [-1, 0], [-0.71, 0.71],
];

/** Chamfered box — crustacean carapace, isopod segments, machinery. */
export const S_BOX: Section = [
  [-0.55, 1], [0.55, 1], [1, 0.45], [1, -0.55],
  [0.55, -1], [-0.55, -1], [-1, -0.55], [-1, 0.45],
];

/** Flat-bottomed dome — bottom dwellers that rest on the seabed. */
export const S_DOME: Section = [
  [0, 1], [0.68, 0.72], [1, 0.1], [0.95, -0.32],
  [0, -0.4], [-0.95, -0.32], [-1, 0.1], [-0.68, 0.72],
];

/** Downward wedge — jaws, beaks, gulping mouths. */
export const S_JAW: Section = [
  [0, 0.55], [0.62, 0.44], [0.95, -0.1], [0.7, -0.8],
  [0, -1], [-0.7, -0.8], [-0.95, -0.1], [-0.62, 0.44],
];

/** Tall triangular fin section, used for keels and crests. */
export const S_BLADE: Section = [
  [0, 1], [0.14, 0.5], [0.2, 0], [0.14, -0.5],
  [0, -1], [-0.14, -0.5], [-0.2, 0], [-0.14, 0.5],
];

/** Rounded above, keeled below — a hull that sits the right way up. */
export const S_HULL: Section = [
  [0, 1], [0.64, 0.78], [0.96, 0.12], [0.82, -0.6],
  [0, -0.9], [-0.82, -0.6], [-0.96, 0.12], [-0.64, 0.78],
];

/** An eight-sided ring, for ducts, rims and machined parts. */
export const S_OCT: Section = [
  [0, 1], [0.707, 0.707], [1, 0], [0.707, -0.707],
  [0, -1], [-0.707, -0.707], [-1, 0], [-0.707, 0.707],
];

/** Four- and six-sided rings, for thin stems where eight is wasteful. */
export const S_QUAD: Section = [[0, 1], [1, 0], [0, -1], [-1, 0]];
export const S_HEX: Section = [
  [0, 1], [0.87, 0.5], [0.87, -0.5], [0, -1], [-0.87, -0.5], [-0.87, 0.5],
];
export const S_QUAD_POINT: Section = [[0, 0], [0, 0], [0, 0], [0, 0]];
export const S_HEX_POINT: Section = [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]];

/** A degenerate ring, for closing a loft to a point. */
export const S_POINT: Section = [
  [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0],
];

/** Blend two sections. Both must have the same vertex count (they all do). */
export function blendSection(a: Section, b: Section, t: number): Section {
  const out: [number, number][] = [];
  for (let i = 0; i < a.length; i++) {
    out.push([a[i][0] + (b[i][0] - a[i][0]) * t, a[i][1] + (b[i][1] - a[i][1]) * t]);
  }
  return out;
}

/** Scale and offset a section into world units for one loft ring. */
export function ringFrom(
  section: Section, halfWidth: number, halfHeight: number, yOffset = 0,
): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < section.length; i++) {
    out.push([section[i][0] * halfWidth, section[i][1] * halfHeight + yOffset]);
  }
  return out;
}
