/**
 * The submarine.
 *
 * Modelled, not assembled. The hull is a single loft through eleven authored
 * cross-sections — rounded over the back, keeled under the belly, pinched at
 * the stern — and everything bolted to it is a flat plate or a short loft of
 * its own. There is not a sphere or a lathe anywhere in here, and every
 * surface is flat-shaded, so the boat reads as matte painted metal rather than
 * something varnished.
 *
 * The visual specification comes from the player's installed modules, so every
 * upgrade physically changes the vessel. The starter boat is a small, homemade
 * yellow thing with one lamp; the endgame boat is a dark armoured hull
 * bristling with instruments. They are the same builder.
 */

import { Group, Mesh, Object3D, Vector3, type Material } from 'three';
import { MeshBuilder, type LoftRing } from './geo';
import { S_BOX, S_HULL, S_OCT, S_POINT, ringFrom, type Section } from './sections';
import { Rng } from '../core/rng';
import { TAU, lerp } from '../core/math';
import { mixHex, shift } from './palette';

export type HullKind = 'coastal' | 'reinforced' | 'ceramic' | 'titanium' | 'sphere' | 'abyssal';
export type EngineKind = 'single' | 'dual' | 'turbine' | 'mhd' | 'experimental';
export type ArmKind = 'none' | 'grabber' | 'claw' | 'drill' | 'sampler';

export interface SubVisualSpec {
  hull: HullKind;
  engine: EngineKind;
  lamps: number;
  sonarDome: boolean;
  antenna: boolean;
  arm: ArmKind;
  cargoPods: number;
  specimenTank: boolean;
  thermalPlates: boolean;
  bioTrim: boolean;
  lab: boolean;
  livery: string;
}

export interface Livery {
  id: string;
  name: string;
  hull: string;
  trim: string;
  metal: string;
  brass: string;
  glass: string;
  accent: string;
  glow: string;
}

export const LIVERIES: Livery[] = [
  { id: 'harbour', name: 'Harbour Yellow', hull: '#f0b93f', trim: '#2b5560', metal: '#8a9096', brass: '#cfad70', glass: '#15323c', accent: '#d9713f', glow: '#ffe6a8' },
  { id: 'kelp', name: 'Kelp Green', hull: '#789e58', trim: '#2a4231', metal: '#878e8a', brass: '#c0a266', glass: '#122a27', accent: '#dcc052', glow: '#d5f2aa' },
  { id: 'coral', name: 'Coral Rose', hull: '#e0917c', trim: '#57333d', metal: '#968c92', brass: '#d6a976', glass: '#2a1a26', accent: '#eeca82', glow: '#ffd2c0' },
  { id: 'institute', name: 'Institute White', hull: '#ded9cb', trim: '#345063', metal: '#a2a7ac', brass: '#c2ac7a', glass: '#183440', accent: '#4a97b6', glow: '#dcefff' },
  { id: 'abyssal', name: 'Abyssal Black', hull: '#2a2c36', trim: '#15171f', metal: '#686e79', brass: '#978257', glass: '#0c1620', accent: '#67d6c6', glow: '#8ff0e0' },
  { id: 'ember', name: 'Ember Orange', hull: '#d47338', trim: '#3a2017', metal: '#877d72', brass: '#cba158', glass: '#1e1209', accent: '#f8bf5c', glow: '#ffca8c' },
  { id: 'glass', name: 'Glasswork Violet', hull: '#8878bd', trim: '#2c2747', metal: '#8c8ea1', brass: '#b49e78', glass: '#16162a', accent: '#9fe8f8', glow: '#c4b1fb' },
  { id: 'brine', name: 'Brine Teal', hull: '#3b878a', trim: '#153036', metal: '#828b94', brass: '#c0a670', glass: '#0e2429', accent: '#e8ce93', glow: '#a5eee0' },
];

export const LIVERY_BY_ID = new Map(LIVERIES.map((l) => [l.id, l]));

export function defaultSubSpec(): SubVisualSpec {
  return {
    hull: 'coastal', engine: 'single', lamps: 1, sonarDome: false, antenna: false,
    arm: 'none', cargoPods: 0, specimenTank: false, thermalPlates: false,
    bioTrim: false, lab: false, livery: 'harbour',
  };
}

/** One authored hull station: position along the boat and its cross-section. */
interface HullStation {
  t: number;
  w: number;
  h: number;
  y: number;
  section?: Section;
}

/**
 * Hull shapes. Each is a set of stations from stern (t=0) to bow (t=1), with
 * width and height as fractions of the hull radius. These curves are the
 * silhouette, and the silhouette is the character of the boat.
 */
const HULLS: Record<HullKind, { len: number; rad: number; stations: HullStation[] }> = {
  coastal: {
    len: 4.6, rad: 0.92,
    stations: [
      { t: 0.00, w: 0.26, h: 0.30, y: 0.02 },
      { t: 0.08, w: 0.42, h: 0.48, y: 0.01 },
      { t: 0.20, w: 0.66, h: 0.72, y: 0.00 },
      { t: 0.34, w: 0.86, h: 0.90, y: 0.00 },
      { t: 0.48, w: 0.98, h: 1.00, y: 0.00 },
      { t: 0.62, w: 1.00, h: 1.00, y: 0.00 },
      { t: 0.74, w: 0.94, h: 0.94, y: 0.00 },
      { t: 0.85, w: 0.78, h: 0.80, y: 0.01 },
      { t: 0.93, w: 0.56, h: 0.58, y: 0.02 },
      { t: 0.98, w: 0.30, h: 0.32, y: 0.03 },
      { t: 1.00, w: 0.06, h: 0.07, y: 0.03, section: S_POINT },
    ],
  },
  reinforced: {
    len: 5.1, rad: 1.02,
    stations: [
      { t: 0.00, w: 0.32, h: 0.34, y: 0.02 },
      { t: 0.09, w: 0.50, h: 0.54, y: 0.01 },
      { t: 0.22, w: 0.74, h: 0.78, y: 0.00 },
      { t: 0.36, w: 0.92, h: 0.94, y: 0.00 },
      { t: 0.50, w: 1.00, h: 1.00, y: 0.00 },
      { t: 0.64, w: 1.00, h: 1.00, y: 0.00 },
      { t: 0.76, w: 0.92, h: 0.94, y: 0.00 },
      { t: 0.86, w: 0.76, h: 0.80, y: 0.01 },
      { t: 0.94, w: 0.54, h: 0.58, y: 0.02 },
      { t: 0.99, w: 0.26, h: 0.28, y: 0.03 },
      { t: 1.00, w: 0.06, h: 0.06, y: 0.03, section: S_POINT },
    ],
  },
  ceramic: {
    len: 5.4, rad: 1.10,
    stations: [
      { t: 0.00, w: 0.34, h: 0.36, y: 0.02 },
      { t: 0.10, w: 0.56, h: 0.60, y: 0.01 },
      { t: 0.24, w: 0.80, h: 0.84, y: 0.00 },
      { t: 0.38, w: 0.96, h: 0.98, y: 0.00 },
      { t: 0.52, w: 1.00, h: 1.00, y: 0.00 },
      { t: 0.66, w: 0.99, h: 1.00, y: 0.00 },
      { t: 0.78, w: 0.90, h: 0.92, y: 0.00 },
      { t: 0.88, w: 0.72, h: 0.76, y: 0.01 },
      { t: 0.95, w: 0.48, h: 0.52, y: 0.02 },
      { t: 0.99, w: 0.22, h: 0.24, y: 0.03 },
      { t: 1.00, w: 0.05, h: 0.05, y: 0.03, section: S_POINT },
    ],
  },
  titanium: {
    len: 5.8, rad: 1.16,
    stations: [
      { t: 0.00, w: 0.40, h: 0.42, y: 0.01, section: S_BOX },
      { t: 0.10, w: 0.62, h: 0.64, y: 0.00, section: S_BOX },
      { t: 0.24, w: 0.84, h: 0.86, y: 0.00 },
      { t: 0.38, w: 0.98, h: 0.98, y: 0.00 },
      { t: 0.52, w: 1.00, h: 1.00, y: 0.00 },
      { t: 0.66, w: 1.00, h: 1.00, y: 0.00 },
      { t: 0.78, w: 0.92, h: 0.92, y: 0.00 },
      { t: 0.88, w: 0.74, h: 0.76, y: 0.01 },
      { t: 0.95, w: 0.50, h: 0.52, y: 0.02 },
      { t: 0.99, w: 0.24, h: 0.26, y: 0.02 },
      { t: 1.00, w: 0.06, h: 0.06, y: 0.02, section: S_POINT },
    ],
  },
  sphere: {
    len: 5.2, rad: 1.42,
    stations: [
      { t: 0.00, w: 0.24, h: 0.26, y: 0.02 },
      { t: 0.10, w: 0.46, h: 0.50, y: 0.01 },
      { t: 0.22, w: 0.74, h: 0.78, y: 0.00 },
      { t: 0.34, w: 0.94, h: 0.96, y: 0.00 },
      { t: 0.46, w: 1.00, h: 1.00, y: 0.00, section: S_OCT },
      { t: 0.58, w: 0.98, h: 1.00, y: 0.00, section: S_OCT },
      { t: 0.70, w: 0.88, h: 0.92, y: 0.00 },
      { t: 0.82, w: 0.70, h: 0.74, y: 0.01 },
      { t: 0.91, w: 0.48, h: 0.52, y: 0.02 },
      { t: 0.98, w: 0.22, h: 0.24, y: 0.02 },
      { t: 1.00, w: 0.05, h: 0.05, y: 0.02, section: S_POINT },
    ],
  },
  abyssal: {
    len: 6.4, rad: 1.52,
    stations: [
      { t: 0.00, w: 0.42, h: 0.44, y: 0.01, section: S_BOX },
      { t: 0.10, w: 0.66, h: 0.68, y: 0.00, section: S_BOX },
      { t: 0.22, w: 0.86, h: 0.88, y: 0.00, section: S_OCT },
      { t: 0.34, w: 0.98, h: 0.98, y: 0.00, section: S_OCT },
      { t: 0.48, w: 1.00, h: 1.00, y: 0.00, section: S_OCT },
      { t: 0.62, w: 1.00, h: 1.00, y: 0.00, section: S_OCT },
      { t: 0.74, w: 0.94, h: 0.94, y: 0.00 },
      { t: 0.85, w: 0.78, h: 0.80, y: 0.01 },
      { t: 0.93, w: 0.54, h: 0.56, y: 0.01 },
      { t: 0.98, w: 0.26, h: 0.28, y: 0.02 },
      { t: 1.00, w: 0.06, h: 0.06, y: 0.02, section: S_POINT },
    ],
  },
};

export interface BuiltSubmarine {
  group: Group;
  propellers: Object3D[];
  lampMounts: { pos: Vector3; dir: Vector3 }[];
  thrusterPorts: Vector3[];
  cockpit: Vector3;
  arm: Object3D | null;
  cargoPoint: Vector3;
  halfLength: number;
  radius: number;
  geometries: import('three').BufferGeometry[];
}

export function buildSubmarine(
  spec: SubVisualSpec,
  material: Material,
  glowMaterial: Material,
  seed = 1,
): BuiltSubmarine {
  const rng = new Rng(seed);
  const L = LIVERY_BY_ID.get(spec.livery) ?? LIVERIES[0];
  const dims = HULLS[spec.hull];
  const group = new Group();
  group.name = 'submarine';

  const body = new MeshBuilder();
  const glow = new MeshBuilder();
  const propellers: Object3D[] = [];
  const lampMounts: { pos: Vector3; dir: Vector3 }[] = [];
  const thrusterPorts: Vector3[] = [];
  const geometries: import('three').BufferGeometry[] = [];

  const half = dims.len / 2;
  const R = dims.rad;
  const stations = dims.stations;

  // --- hull ------------------------------------------------------------
  // Bands are coloured per-ring: a dark keel band, the hull colour above it,
  // and one painted stripe. Because the loft is flat-shaded, each band is a
  // clean field of colour with a hard edge, which is exactly the look wanted.
  const rings: LoftRing[] = stations.map((s) => ({
    z: lerp(-half, half, s.t),
    pts: ringFrom(s.section ?? S_HULL, s.w * R, s.h * R, s.y * R),
  }));
  const hullStart = body.vertexCount;
  body.setColor(L.hull);
  body.loft(rings);

  // Paint: belly dark, one waterline stripe, nose slightly lighter.
  const keel = mixHex(L.hull, L.trim, 0.8);
  const stripe = mixHex(L.hull, L.trim, 0.55);
  body.tint((v) => {
    const up = v.y / R;
    const t = v.z / half;
    // Plating: alternate bands of very slightly different value so the hull
    // reads as panels rather than one moulded shell.
    const band = Math.floor((t + 1) * 3.5);
    const panel = band % 2 === 0 ? L.hull : shift(L.hull, 0, -0.015, -0.035);
    if (up < -0.5) return band % 2 === 0 ? keel : shift(keel, 0, 0, -0.03);
    if (Math.abs(up - 0.06) < 0.13 && t < 0.68) return stripe;
    if (t > 0.74) return shift(L.hull, 0, -0.02, 0.05);
    return panel;
  }, hullStart);

  // Plating seams: thin octagonal collars, sunk into the hull colour.
  const seams = spec.hull === 'coastal' ? 3 : 4;
  for (let i = 0; i < seams; i++) {
    const t = lerp(0.18, 0.82, i / Math.max(1, seams - 1));
    const st = stationAt(stations, t);
    const z = lerp(-half, half, t);
    body.setColor(mixHex(L.hull, L.trim, 0.35));
    body.loft([
      { z: z - 0.035, pts: ringFrom(st.section ?? S_HULL, st.w * R * 1.012, st.h * R * 1.012, st.y * R) },
      { z: z + 0.035, pts: ringFrom(st.section ?? S_HULL, st.w * R * 1.012, st.h * R * 1.012, st.y * R) },
    ], { capStart: false, capEnd: false });
  }

  // --- viewport --------------------------------------------------------
  const vpZ = half * 0.68;
  const vpSt = stationAt(stations, 0.68);
  const vpR = R * 0.46;
  const vpY = R * 0.14;
  const vpFace = vpSt.w * R * 0.9;
  // Brass surround, built as a short octagonal collar standing proud.
  body.setColor(L.brass);
  body.save().translate(0, vpY, vpZ);
  body.loft([
    { z: 0, pts: ringFrom(S_OCT, vpR * 1.24, vpR * 1.24, 0) },
    { z: vpFace * 0.16, pts: ringFrom(S_OCT, vpR * 1.18, vpR * 1.18, 0) },
  ], { capStart: false, capEnd: false });
  // Dark glass, an octagonal dish with one bright facet where the light catches.
  body.setColor(L.glass);
  body.loft([
    { z: vpFace * 0.02, pts: ringFrom(S_OCT, vpR * 1.14, vpR * 1.14, 0) },
    { z: vpFace * 0.2, pts: ringFrom(S_OCT, vpR * 0.86, vpR * 0.86, 0) },
    { z: vpFace * 0.26, pts: ringFrom(S_POINT, 0, 0, 0) },
  ], { capStart: false, capEnd: false });
  body.restore();
  // Highlight facet: a single flat triangle of pale glass, upper left.
  body.save().translate(-vpR * 0.42, vpY + vpR * 0.5, vpZ + vpFace * 0.19);
  body.setColor(mixHex(L.glass, '#cfe8f2', 0.62));
  body.plate([[0, 0], [vpR * 0.5, -vpR * 0.18], [vpR * 0.16, -vpR * 0.5]], 0.005);
  body.restore();
  // Warm cabin glow behind the glass.
  glow.save().translate(0, vpY, vpZ + vpFace * 0.05);
  glow.setColor(L.glow).setEmissive(1);
  glow.plate(polygon(8, vpR * 0.7), 0.004);
  glow.restore();

  const cockpit = new Vector3(0, vpY + R * 0.06, vpZ - R * 0.55);

  // --- conning tower ---------------------------------------------------
  const towerH = spec.hull === 'sphere' || spec.hull === 'abyssal' ? R * 0.4 : R * 0.56;
  const towerZ = -half * 0.04;
  body.setColor(mixHex(L.hull, L.trim, 0.22));
  body.save().translate(0, R * 0.84, towerZ);
  body.loft([
    { z: -R * 0.34, pts: ringFrom(S_BOX, R * 0.24, R * 0.05, 0) },
    { z: -R * 0.2, pts: ringFrom(S_BOX, R * 0.3, R * 0.2, 0) },
    { z: R * 0.18, pts: ringFrom(S_BOX, R * 0.3, R * 0.2, 0) },
    { z: R * 0.3, pts: ringFrom(S_BOX, R * 0.2, R * 0.14, 0) },
  ]);
  body.restore();
  body.save().translate(0, R * 0.84 + towerH * 0.5, towerZ).rotateX(Math.PI / 2);
  body.loft([
    { z: -towerH * 0.5, pts: ringFrom(S_OCT, R * 0.3, R * 0.26, 0) },
    { z: towerH * 0.24, pts: ringFrom(S_OCT, R * 0.26, R * 0.22, 0) },
    { z: towerH * 0.5, pts: ringFrom(S_OCT, R * 0.17, R * 0.15, 0) },
  ]);
  body.restore();
  // Hatch ring.
  body.setColor(L.brass);
  body.save().translate(0, R * 0.84 + towerH, towerZ).rotateX(Math.PI / 2);
  body.loft([
    { z: 0, pts: ringFrom(S_OCT, R * 0.17, R * 0.15, 0) },
    { z: R * 0.06, pts: ringFrom(S_OCT, R * 0.14, R * 0.12, 0) },
  ]);
  body.restore();

  // --- dive planes -----------------------------------------------------
  for (const side of [-1, 1]) {
    const st = stationAt(stations, 0.62);
    const rootX = st.w * R;
    const z = lerp(-half, half, 0.62);
    body.setColor(L.trim);
    body.plateOn(
      [
        [0, R * 0.3], [R * 0.62, R * 0.14],
        [R * 0.8, -R * 0.2], [R * 0.5, -R * 0.34], [0, -R * 0.32],
      ],
      R * 0.055,
      new Vector3(side * rootX * 0.9, R * 0.06, z),
      new Vector3(side, 0.12 * side, 0),
      new Vector3(0, 0, -1),
    );
    // Actuator housing.
    body.setColor(L.metal);
    body.save().translate(side * rootX * 0.88, R * 0.08, z).rotateZ(Math.PI / 2);
    body.loft([
      { z: -R * 0.1, pts: ringFrom(S_OCT, R * 0.09, R * 0.09, 0) },
      { z: R * 0.1, pts: ringFrom(S_OCT, R * 0.07, R * 0.07, 0) },
    ]);
    body.restore();
  }

  // --- keel skids ------------------------------------------------------
  for (const side of [-1, 1]) {
    body.setColor(mixHex(L.metal, L.trim, 0.5));
    body.save().translate(side * R * 0.44, -R * 0.98, 0);
    body.loft([
      { z: -half * 0.6, pts: ringFrom(S_BOX, R * 0.075, R * 0.06, R * 0.24) },
      { z: -half * 0.36, pts: ringFrom(S_BOX, R * 0.095, R * 0.075, 0) },
      { z: half * 0.3, pts: ringFrom(S_BOX, R * 0.095, R * 0.075, 0) },
      { z: half * 0.54, pts: ringFrom(S_BOX, R * 0.075, R * 0.06, R * 0.26) },
    ]);
    body.restore();
    for (const z of [-half * 0.4, half * 0.26]) {
      body.setColor(mixHex(L.metal, L.trim, 0.25));
      body.save().translate(side * R * 0.44, -R * 0.72, z);
      body.loft([
        { z: -R * 0.07, pts: ringFrom(S_BOX, R * 0.055, R * 0.28, 0) },
        { z: R * 0.07, pts: ringFrom(S_BOX, R * 0.055, R * 0.28, 0) },
      ]);
      body.restore();
      body.setColor(mixHex(L.metal, L.trim, 0.5));
    }
  }

  // --- stern fins and engine -------------------------------------------
  addSternFins(body, L, half, R, spec.engine);
  buildEngine(body, glow, spec, L, half, R, propellers, thrusterPorts, geometries, material);

  // --- lamps -----------------------------------------------------------
  for (const lp of lampLayout(spec.lamps, R, half)) {
    body.save().translate(lp.pos.x, lp.pos.y, lp.pos.z);
    body.lookAlong(lp.dir.x, lp.dir.y, lp.dir.z);
    body.setColor(L.metal);
    body.loft([
      { z: -0.1, pts: ringFrom(S_OCT, 0.115, 0.115, 0) },
      { z: 0.06, pts: ringFrom(S_OCT, 0.155, 0.155, 0) },
    ], { capEnd: false });
    body.setColor(L.brass);
    body.loft([
      { z: 0.06, pts: ringFrom(S_OCT, 0.158, 0.158, 0) },
      { z: 0.1, pts: ringFrom(S_OCT, 0.14, 0.14, 0) },
    ], { capStart: false, capEnd: false });
    body.restore();

    glow.save().translate(lp.pos.x, lp.pos.y, lp.pos.z);
    glow.lookAlong(lp.dir.x, lp.dir.y, lp.dir.z);
    glow.translate(0, 0, 0.098);
    glow.setColor(L.glow).setEmissive(1);
    glow.plate(polygon(8, 0.125), 0.004);
    glow.restore();
    lampMounts.push({ pos: lp.pos.clone(), dir: lp.dir.clone() });
  }

  // --- optional modules ------------------------------------------------
  if (spec.sonarDome) {
    body.setColor(mixHex(L.metal, L.trim, 0.3));
    body.save().translate(0, -R * 0.7, half * 0.46).rotateX(Math.PI / 2);
    body.loft([
      { z: -R * 0.3, pts: ringFrom(S_OCT, R * 0.1, R * 0.16, 0) },
      { z: 0, pts: ringFrom(S_OCT, R * 0.3, R * 0.42, 0) },
      { z: R * 0.28, pts: ringFrom(S_OCT, R * 0.18, R * 0.26, 0) },
    ]);
    body.restore();
    glow.save().translate(0, -R * 0.92, half * 0.46).rotateX(Math.PI / 2);
    glow.setColor(L.accent).setEmissive(0.9);
    glow.plate(polygon(8, R * 0.12), 0.004);
    glow.restore();
  }

  if (spec.antenna) {
    const baseY = R * 0.84 + towerH;
    body.setColor(L.metal);
    body.save().translate(0, baseY + 0.42, towerZ);
    body.loft([
      { z: -0.42, pts: ringFrom(S_BOX, 0.022, 0.022, 0) },
      { z: 0.42, pts: ringFrom(S_BOX, 0.013, 0.013, 0) },
    ]);
    body.restore();
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * TAU;
      body.save().translate(0, baseY + 0.82, towerZ).rotateY(ang).rotateZ(1.05);
      body.loft([
        { z: 0, pts: ringFrom(S_BOX, 0.014, 0.014, 0) },
        { z: 0.3, pts: ringFrom(S_BOX, 0.008, 0.008, 0) },
      ]);
      body.restore();
    }
    glow.save().translate(0, baseY + 0.86, towerZ);
    glow.setColor(L.accent).setEmissive(1);
    glow.gem(0.04, 5, 1, 1);
    glow.restore();
  }

  if (spec.cargoPods > 0) {
    const podZs = [-half * 0.24, half * 0.14, -half * 0.58, half * 0.42];
    for (let i = 0; i < Math.min(4, spec.cargoPods); i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const z = podZs[i];
      body.setColor(mixHex(L.trim, L.hull, 0.25));
      body.save().translate(side * R * 0.94, -R * 0.3, z);
      body.loft([
        { z: -0.42, pts: ringFrom(S_POINT, 0, 0, 0) },
        { z: -0.32, pts: ringFrom(S_OCT, 0.13, 0.13, 0) },
        { z: 0.22, pts: ringFrom(S_OCT, 0.19, 0.19, 0) },
        { z: 0.4, pts: ringFrom(S_OCT, 0.1, 0.1, 0) },
        { z: 0.44, pts: ringFrom(S_POINT, 0, 0, 0) },
      ]);
      body.setColor(L.brass);
      body.loft([
        { z: -0.02, pts: ringFrom(S_OCT, 0.197, 0.197, 0) },
        { z: 0.03, pts: ringFrom(S_OCT, 0.197, 0.197, 0) },
      ], { capStart: false, capEnd: false });
      body.restore();
    }
  }

  if (spec.specimenTank) {
    body.setColor(mixHex(L.metal, '#e0e8ea', 0.3));
    body.save().translate(0, R * 0.98, half * 0.14).rotateZ(Math.PI / 2);
    body.loft([
      { z: -0.5, pts: ringFrom(S_OCT, 0.16, 0.16, 0) },
      { z: -0.4, pts: ringFrom(S_OCT, 0.22, 0.22, 0) },
      { z: 0.4, pts: ringFrom(S_OCT, 0.22, 0.22, 0) },
      { z: 0.5, pts: ringFrom(S_OCT, 0.16, 0.16, 0) },
    ]);
    body.restore();
    glow.setColor('#9fe8ff').setEmissive(0.55);
    glow.save().translate(0, R * 0.98, half * 0.14).rotateZ(Math.PI / 2);
    glow.loft([
      { z: -0.16, pts: ringFrom(S_OCT, 0.228, 0.228, 0) },
      { z: 0.16, pts: ringFrom(S_OCT, 0.228, 0.228, 0) },
    ], { capStart: false, capEnd: false });
    glow.restore();
  }

  if (spec.lab) {
    body.setColor(mixHex(L.hull, L.trim, 0.3));
    body.save().translate(0, R * 0.28, -half * 0.56);
    body.loft([
      { z: -R * 0.52, pts: ringFrom(S_OCT, R * 0.34, R * 0.26, 0) },
      { z: -R * 0.2, pts: ringFrom(S_OCT, R * 0.62, R * 0.44, 0) },
      { z: R * 0.24, pts: ringFrom(S_OCT, R * 0.62, R * 0.44, 0) },
      { z: R * 0.5, pts: ringFrom(S_OCT, R * 0.32, R * 0.24, 0) },
    ]);
    body.restore();
    for (const side of [-1, 1]) {
      glow.save().translate(side * R * 0.6, R * 0.32, -half * 0.56).rotateY(side * Math.PI * 0.5);
      glow.setColor('#bff2ff').setEmissive(0.85);
      glow.plate(polygon(6, R * 0.14), 0.004);
      glow.restore();
    }
  }

  if (spec.thermalPlates) {
    for (let i = 0; i < 6; i++) {
      const t = lerp(0.16, 0.78, i / 5);
      const st = stationAt(stations, t);
      const z = lerp(-half, half, t);
      for (const side of [-1, 1]) {
        body.setColor(mixHex(L.metal, L.accent, 0.18));
        body.save().translate(side * st.w * R * 0.86, st.h * R * 0.34, z).rotateZ(side * -0.55);
        body.plate([
          [-0.24, -0.05], [0.24, -0.05], [0.28, 0.05], [-0.28, 0.05],
        ].map(([x, y]) => [x * 1.6, y * 1.6] as [number, number]), 0.05);
        body.restore();
      }
    }
  }

  if (spec.bioTrim) {
    for (const side of [-1, 1]) {
      glow.setColor(L.glow).setEmissive(1);
      for (let i = 0; i < 9; i++) {
        const t0 = lerp(0.12, 0.84, i / 9), t1 = lerp(0.12, 0.84, (i + 1) / 9);
        const s0 = stationAt(stations, t0), s1 = stationAt(stations, t1);
        const z0 = lerp(-half, half, t0), z1 = lerp(-half, half, t1);
        const x0 = side * s0.w * R * 0.99, x1 = side * s1.w * R * 0.99;
        const y0 = s0.h * R * 0.1, y1 = s1.h * R * 0.1;
        glow.addQuad(x0, y0 - 0.02, z0, x1, y1 - 0.02, z1, x1, y1 + 0.02, z1, x0, y0 + 0.02, z0);
      }
    }
  }

  // --- manipulator arm -------------------------------------------------
  let armRoot: Object3D | null = null;
  if (spec.arm !== 'none') {
    armRoot = new Object3D();
    armRoot.name = 'arm';
    armRoot.position.set(R * 0.4, -R * 0.58, half * 0.38);
    const armB = new MeshBuilder();
    buildArm(armB, spec.arm, L);
    const armGeo = armB.build();
    geometries.push(armGeo);
    const armMesh = new Mesh(armGeo, material);
    armMesh.castShadow = true;
    armRoot.add(armMesh);
    group.add(armRoot);
  }

  void rng;

  const bodyGeo = body.build();
  geometries.push(bodyGeo);
  const bodyMesh = new Mesh(bodyGeo, material);
  bodyMesh.name = 'hull';
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  if (glow.vertexCount > 0) {
    const glowGeo = glow.build();
    geometries.push(glowGeo);
    const glowMesh = new Mesh(glowGeo, glowMaterial);
    glowMesh.name = 'glow';
    group.add(glowMesh);
  }

  for (const p of propellers) group.add(p);

  return {
    group, propellers, lampMounts, thrusterPorts, cockpit, arm: armRoot,
    cargoPoint: new Vector3(0, -R * 0.3, -half * 0.1),
    halfLength: half + 0.5, radius: R * 1.02, geometries,
  };
}

// --- helpers ------------------------------------------------------------

function polygon(sides: number, r: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * TAU + Math.PI / sides;
    out.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return out;
}

function stationAt(stations: HullStation[], t: number): HullStation {
  for (let i = 0; i < stations.length - 1; i++) {
    if (t >= stations[i].t && t <= stations[i + 1].t) {
      const k = (t - stations[i].t) / Math.max(1e-4, stations[i + 1].t - stations[i].t);
      return {
        t,
        w: lerp(stations[i].w, stations[i + 1].w, k),
        h: lerp(stations[i].h, stations[i + 1].h, k),
        y: lerp(stations[i].y, stations[i + 1].y, k),
        section: stations[i].section,
      };
    }
  }
  return stations[stations.length - 1];
}

function lampLayout(n: number, R: number, half: number): { pos: Vector3; dir: Vector3 }[] {
  const out: { pos: Vector3; dir: Vector3 }[] = [];
  if (n >= 1) out.push({ pos: new Vector3(0, R * 0.7, half * 0.56), dir: new Vector3(0, -0.16, 1).normalize() });
  if (n >= 2) {
    out.push({ pos: new Vector3(-R * 0.68, -R * 0.24, half * 0.58), dir: new Vector3(-0.2, -0.12, 1).normalize() });
    out.push({ pos: new Vector3(R * 0.68, -R * 0.24, half * 0.58), dir: new Vector3(0.2, -0.12, 1).normalize() });
  }
  if (n >= 4) {
    out.push({ pos: new Vector3(-R * 0.86, R * 0.34, half * 0.24), dir: new Vector3(-0.55, 0.05, 1).normalize() });
    out.push({ pos: new Vector3(R * 0.86, R * 0.34, half * 0.24), dir: new Vector3(0.55, 0.05, 1).normalize() });
  }
  if (n >= 6) {
    out.push({ pos: new Vector3(0, -R * 0.82, half * 0.04), dir: new Vector3(0, -1, 0.32).normalize() });
    out.push({ pos: new Vector3(0, R * 0.56, -half * 0.52), dir: new Vector3(0, 0.1, -1).normalize() });
  }
  return out.slice(0, Math.max(1, n));
}

/**
 * Rudder and stern planes. Each fin is one authored outline, placed with an
 * explicit span and chord direction so it always ends up where it is meant to:
 * root against the hull, tip outward, trailing edge swept aft.
 */
function addSternFins(b: MeshBuilder, L: Livery, half: number, R: number, engine: EngineKind): void {
  const z = -half * 0.66;
  const span = R * 0.92;
  const count = engine === 'single' ? 2 : engine === 'dual' ? 3 : engine === 'turbine' ? 4 : 5;
  b.setColor(L.trim);
  // x: outward from the hull. y: aft along the boat.
  const outline: [number, number][] = [
    [0, R * 0.42],
    [span * 0.62, R * 0.2],
    [span, -R * 0.18],
    [span * 0.72, -R * 0.44],
    [0, -R * 0.46],
  ];
  const dirs: [number, number][] = [[0, 1], [0, -1], [1, 0], [-1, 0], [0.7, 0.7]];
  for (let i = 0; i < Math.min(count, dirs.length); i++) {
    const [dx, dy] = dirs[i];
    b.plateOn(
      outline, R * 0.07,
      new Vector3(dx * R * 0.34, dy * R * 0.34, z),
      new Vector3(dx, dy, 0),
      new Vector3(0, 0, -1),
    );
  }
  // Collar where the fins meet the hull.
  b.setColor(L.metal);
  b.save().translate(0, 0, z);
  b.loft([
    { z: -R * 0.06, pts: ringFrom(S_OCT, R * 0.4, R * 0.4, 0) },
    { z: R * 0.06, pts: ringFrom(S_OCT, R * 0.42, R * 0.42, 0) },
  ], { capStart: false, capEnd: false });
  b.restore();
}

function buildEngine(
  body: MeshBuilder, glow: MeshBuilder, spec: SubVisualSpec, L: Livery,
  half: number, R: number,
  propellers: Object3D[], ports: Vector3[],
  geometries: import('three').BufferGeometry[],
  material: Material,
): void {
  const duct = (x: number, y: number, z: number, r: number, depth: number) => {
    // A dark shroud, not a chrome ring: from directly astern this is most of
    // what the player sees, and a bright one washes the whole boat out.
    body.setColor(mixHex(L.metal, L.trim, 0.62));
    body.save().translate(x, y, z);
    // A short octagonal barrel with a visible lip: a duct, not a torus.
    body.loft([
      { z: -depth * 0.5, pts: ringFrom(S_OCT, r * 1.06, r * 1.06, 0) },
      { z: -depth * 0.3, pts: ringFrom(S_OCT, r, r, 0) },
      { z: depth * 0.3, pts: ringFrom(S_OCT, r, r, 0) },
      { z: depth * 0.5, pts: ringFrom(S_OCT, r * 1.06, r * 1.06, 0) },
    ], { capStart: false, capEnd: false });
    // Inner wall, slightly darker, so the duct reads as hollow.
    body.setColor(mixHex(L.metal, '#101418', 0.55));
    body.loft([
      { z: -depth * 0.5, pts: ringFrom(S_OCT, r * 0.86, r * 0.86, 0) },
      { z: depth * 0.5, pts: ringFrom(S_OCT, r * 0.86, r * 0.86, 0) },
    ], { capStart: false, capEnd: false });
    body.restore();
  };

  switch (spec.engine) {
    case 'single':
      duct(0, 0, -half - 0.08, R * 0.46, 0.34);
      addPropeller(propellers, 0, 0, -half - 0.1, R * 0.38, 4, L.brass, mixHex(L.trim, L.hull, 0.35), geometries, material);
      ports.push(new Vector3(0, 0, -half - 0.34));
      break;
    case 'dual':
      for (const side of [-1, 1]) {
        duct(side * R * 0.58, -R * 0.08, -half - 0.04, R * 0.34, 0.38);
        addPropeller(propellers, side * R * 0.58, -R * 0.08, -half - 0.06, R * 0.32, 4, L.metal, L.trim, geometries, material);
        ports.push(new Vector3(side * R * 0.58, -R * 0.08, -half - 0.28));
      }
      break;
    case 'turbine':
      duct(0, 0, -half - 0.16, R * 0.52, 0.5);
      addPropeller(propellers, 0, 0, -half - 0.2, R * 0.46, 7, L.metal, L.accent, geometries, material);
      glow.save().translate(0, 0, -half - 0.46);
      glow.setColor(L.accent).setEmissive(0.9);
      glow.plate(polygon(8, R * 0.5), 0.005);
      glow.restore();
      ports.push(new Vector3(0, 0, -half - 0.5));
      break;
    case 'mhd':
      for (const side of [-1, 1]) {
        body.setColor(mixHex(L.metal, L.trim, 0.2));
        body.save().translate(side * R * 0.62, -R * 0.04, -half * 0.5);
        body.loft([
          { z: -0.9, pts: ringFrom(S_OCT, R * 0.3, R * 0.3, 0) },
          { z: -0.4, pts: ringFrom(S_OCT, R * 0.34, R * 0.34, 0) },
          { z: 0.5, pts: ringFrom(S_OCT, R * 0.34, R * 0.34, 0) },
          { z: 0.9, pts: ringFrom(S_OCT, R * 0.3, R * 0.3, 0) },
        ], { capStart: false, capEnd: false });
        body.restore();
        glow.save().translate(side * R * 0.62, -R * 0.04, -half * 0.5 - 0.9);
        glow.setColor(L.glow).setEmissive(1);
        glow.plate(polygon(8, R * 0.26), 0.005);
        glow.restore();
        ports.push(new Vector3(side * R * 0.62, -R * 0.04, -half - 0.2));
      }
      break;
    case 'experimental':
      duct(0, 0, -half - 0.24, R * 0.6, 0.56);
      addPropeller(propellers, 0, 0, -half - 0.3, R * 0.5, 9, L.metal, L.glow, geometries, material, 0.7);
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * TAU;
        glow.save().translate(Math.cos(a) * R * 0.52, Math.sin(a) * R * 0.52, -half - 0.3);
        glow.setColor(L.glow).setEmissive(1);
        glow.plate(polygon(6, R * 0.14), 0.005);
        glow.restore();
        ports.push(new Vector3(Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.5, -half - 0.6));
      }
      break;
  }
}

function addPropeller(
  out: Object3D[], x: number, y: number, z: number,
  radius: number, blades: number, hubColour: string, bladeColour: string,
  geometries: import('three').BufferGeometry[],
  material: Material,
  emissive = 0,
): void {
  const b = new MeshBuilder();
  b.setColor(hubColour);
  b.loft([
    { z: -radius * 0.2, pts: ringFrom(S_OCT, radius * 0.15, radius * 0.15, 0) },
    { z: 0, pts: ringFrom(S_OCT, radius * 0.2, radius * 0.2, 0) },
    { z: radius * 0.22, pts: ringFrom(S_OCT, radius * 0.1, radius * 0.1, 0) },
  ]);
  for (let i = 0; i < blades; i++) {
    const a = (i / blades) * TAU;
    b.save();
    b.rotateZ(a);
    b.translate(0, radius * 0.55, 0);
    b.rotateY(0.62);
    b.setColor(bladeColour);
    if (emissive) b.setEmissive(emissive);
    b.plate([
      [-radius * 0.34, -0.02], [-radius * 0.28, 0.1], [0, 0.14],
      [radius * 0.3, 0.06], [radius * 0.38, -0.06], [0, -0.14],
    ], radius * 0.05);
    b.setEmissive(0);
    b.restore();
  }
  const geo = b.build();
  geometries.push(geo);
  const mesh = new Mesh(geo, material);
  mesh.name = 'propeller';
  mesh.castShadow = true;
  mesh.position.set(x, y, z);
  out.push(mesh);
}

function buildArm(b: MeshBuilder, kind: ArmKind, L: Livery): void {
  const seg = (from: Vector3, to: Vector3, r0: number, r1: number, colour: string) => {
    b.setColor(colour);
    b.save();
    b.translate(from.x, from.y, from.z);
    b.lookAlong(to.x - from.x, to.y - from.y, to.z - from.z);
    const len = from.distanceTo(to);
    b.loft([
      { z: 0, pts: ringFrom(S_OCT, r0, r0, 0) },
      { z: len, pts: ringFrom(S_OCT, r1, r1, 0) },
    ]);
    b.restore();
  };

  const shoulder = new Vector3(0, 0, 0);
  const elbow = new Vector3(0, -0.32, 0.6);
  const wrist = new Vector3(0, -0.34, 1.16);
  seg(shoulder, elbow, 0.085, 0.062, L.metal);
  seg(elbow, wrist, 0.062, 0.05, L.metal);
  b.setColor(L.brass);
  b.save().translate(elbow.x, elbow.y, elbow.z);
  b.gem(0.085, 6, 0.9, 0.9);
  b.restore();

  switch (kind) {
    case 'grabber':
    case 'claw': {
      const fingers = kind === 'claw' ? 3 : 2;
      for (let i = 0; i < fingers; i++) {
        const a = (i / fingers) * TAU;
        b.setColor(L.trim);
        b.save().translate(wrist.x, wrist.y, wrist.z).rotateZ(a).translate(0.07, 0, 0).rotateX(1.25);
        b.plate([[0, 0], [0.045, 0.06], [0.05, 0.24], [0, 0.3], [-0.04, 0.22], [-0.045, 0.04]], 0.05);
        b.restore();
      }
      break;
    }
    case 'drill': {
      b.setColor(L.brass);
      b.save().translate(wrist.x, wrist.y, wrist.z);
      b.loft([
        { z: 0, pts: ringFrom(S_OCT, 0.1, 0.1, 0) },
        { z: 0.28, pts: ringFrom(S_OCT, 0.05, 0.05, 0) },
        { z: 0.4, pts: ringFrom(S_POINT, 0, 0, 0) },
      ]);
      b.restore();
      for (let i = 0; i < 3; i++) {
        b.setColor(L.metal);
        b.save().translate(wrist.x, wrist.y, wrist.z + 0.06).rotateZ((i / 3) * TAU);
        b.plate([[0.05, -0.16], [0.12, -0.08], [0.11, 0.12], [0.05, 0.16]], 0.02);
        b.restore();
      }
      break;
    }
    case 'sampler':
      b.setColor(L.glass);
      b.save().translate(wrist.x, wrist.y, wrist.z);
      b.loft([
        { z: 0, pts: ringFrom(S_OCT, 0.05, 0.05, 0) },
        { z: 0.1, pts: ringFrom(S_OCT, 0.1, 0.1, 0) },
        { z: 0.3, pts: ringFrom(S_OCT, 0.09, 0.09, 0) },
        { z: 0.36, pts: ringFrom(S_OCT, 0.06, 0.06, 0) },
      ]);
      b.restore();
      break;
    default:
      break;
  }
}
