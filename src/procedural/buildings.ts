/**
 * Harbour architecture.
 *
 * The town is built from a small kit of authored parts — a hull-and-roof box,
 * a gable, a lean-to, a chimney, a window, a jetty pile — assembled per
 * building with different proportions and palettes. Every piece is a loft or a
 * plate, flat-shaded, and sized so the whole waterfront reads as one place
 * rather than a row of unrelated models.
 */

import { Vector3 } from 'three';
import { MeshBuilder } from './geo';
import { S_BOX, S_HEX, S_OCT, S_POINT, S_QUAD, ringFrom } from './sections';
import type { Rng } from '../core/rng';
import { TAU, lerp } from '../core/math';
import { mixHex, shift } from './palette';

export interface BuildingPalette {
  wall: string;
  wallAlt: string;
  roof: string;
  trim: string;
  window: string;
  stone: string;
  timber: string;
}

export const HARBOUR_PALETTE: BuildingPalette = {
  wall: '#d8cbb0',
  wallAlt: '#c2b294',
  roof: '#8c5a4a',
  trim: '#3f5f66',
  window: '#f4d894',
  stone: '#8a8578',
  timber: '#6b4f36',
};

export interface BuildingSpec {
  /** Footprint in metres. */
  w: number;
  d: number;
  /** Wall height to the eaves. */
  h: number;
  /** 0 flat, 1 steep. */
  roofPitch: number;
  /** Storeys, which controls window rows. */
  storeys: number;
  /** Roof style. */
  roof: 'gable' | 'hip' | 'flat' | 'shed' | 'dome';
  palette: BuildingPalette;
  /** Extra features. */
  chimney?: boolean;
  porch?: boolean;
  sign?: string;
  signColour?: string;
  /** A lantern over the door. */
  lamp?: boolean;
  /** Lights in the windows. */
  lit?: boolean;
  /** A row of dormers in the roof. */
  dormers?: boolean;
  /** A small tower on one corner. */
  tower?: boolean;
  towerHeight?: number;
}

/** The core building: walls, roof, windows, door. */
export function buildBuilding(b: MeshBuilder, spec: BuildingSpec, rng: Rng): void {
  const { w, d, h, palette: p } = spec;
  const hw = w / 2, hd = d / 2;

  // --- walls -----------------------------------------------------------
  b.setColor(p.wall);
  b.loft([
    { z: -hd, pts: ringFrom(S_BOX, hw, h * 0.5, h * 0.5) },
    { z: hd, pts: ringFrom(S_BOX, hw, h * 0.5, h * 0.5) },
  ]);
  // A plinth course in stone, which grounds the building.
  b.setColor(p.stone);
  b.loft([
    { z: -hd - 0.06, pts: ringFrom(S_BOX, hw + 0.08, h * 0.09, h * 0.09) },
    { z: hd + 0.06, pts: ringFrom(S_BOX, hw + 0.08, h * 0.09, h * 0.09) },
  ]);

  // --- roof ------------------------------------------------------------
  const ridge = h + spec.roofPitch * Math.min(hw, hd) * 1.5;
  b.setColor(p.roof);
  switch (spec.roof) {
    case 'gable': {
      // Two slopes meeting at a ridge running along +Z, with overhang.
      const ow = hw + 0.22, od = hd + 0.22;
      for (const side of [-1, 1]) {
        b.addQuad(
          side * ow, h, -od, side * ow, h, od,
          0, ridge, od, 0, ridge, -od,
        );
      }
      // Gable ends.
      for (const zz of [-hd, hd]) {
        b.setColor(p.wallAlt);
        b.addTri(-hw, h, zz, hw, h, zz, 0, ridge, zz);
      }
      // Ridge cap.
      b.setColor(shift(p.roof, 0, 0, -0.1));
      b.loft([
        { z: -od, pts: ringFrom(S_QUAD, 0.09, 0.07, ridge) },
        { z: od, pts: ringFrom(S_QUAD, 0.09, 0.07, ridge) },
      ]);
      break;
    }
    case 'hip': {
      const ow = hw + 0.18, od = hd + 0.18;
      const rz = hd * 0.35;
      b.addQuad(-ow, h, -od, ow, h, -od, rz, ridge, -rz, -rz, ridge, -rz);
      b.addQuad(ow, h, od, -ow, h, od, -rz, ridge, rz, rz, ridge, rz);
      b.addQuad(ow, h, -od, ow, h, od, rz, ridge, rz, rz, ridge, -rz);
      b.addQuad(-ow, h, od, -ow, h, -od, -rz, ridge, -rz, -rz, ridge, rz);
      break;
    }
    case 'shed': {
      const ow = hw + 0.2, od = hd + 0.2;
      b.addQuad(-ow, h, -od, ow, h * 0.72, -od, ow, h * 0.72, od, -ow, h, od);
      b.setColor(p.wallAlt);
      b.addQuad(-hw, h, -hd, -hw, h, hd, hw, h * 0.72, hd, hw, h * 0.72, -hd);
      break;
    }
    case 'dome': {
      b.save().translate(0, h, 0).rotateX(-Math.PI / 2);
      b.loft([
        { z: 0, pts: ringFrom(S_OCT, hw * 1.02, hd * 1.02, 0) },
        { z: (ridge - h) * 0.5, pts: ringFrom(S_OCT, hw * 0.85, hd * 0.85, 0) },
        { z: (ridge - h) * 0.85, pts: ringFrom(S_OCT, hw * 0.5, hd * 0.5, 0) },
        { z: ridge - h, pts: ringFrom(S_POINT, 0, 0, 0) },
      ], { capStart: false });
      b.restore();
      break;
    }
    case 'flat':
    default: {
      b.setColor(p.roof);
      b.save().translate(0, h + 0.06, 0).rotateX(-Math.PI / 2);
      b.plate([
        [-hw - 0.15, -hd - 0.15], [hw + 0.15, -hd - 0.15],
        [hw + 0.15, hd + 0.15], [-hw - 0.15, hd + 0.15],
      ], 0.12);
      b.restore();
      // Parapet.
      b.setColor(p.wallAlt);
      b.loft([
        { z: -hd - 0.1, pts: ringFrom(S_BOX, hw + 0.1, 0.16, h + 0.24) },
        { z: hd + 0.1, pts: ringFrom(S_BOX, hw + 0.1, 0.16, h + 0.24) },
      ]);
      break;
    }
  }

  // --- windows and door -------------------------------------------------
  const rows = Math.max(1, spec.storeys);
  const cols = Math.max(1, Math.round(w / 2.1));
  for (let r = 0; r < rows; r++) {
    const y = lerp(h * 0.34, h * 0.86, rows === 1 ? 0 : r / (rows - 1));
    for (let c = 0; c < cols; c++) {
      const x = lerp(-hw * 0.68, hw * 0.68, cols === 1 ? 0.5 : c / (cols - 1));
      if (r === 0 && Math.abs(x) < w * 0.14) continue; // leave room for the door
      for (const zz of [-hd - 0.02, hd + 0.02]) {
        b.setColor(spec.lit ? p.window : mixHex(p.window, '#2c3a40', 0.72));
        if (spec.lit) b.setEmissive(0.85);
        b.save().translate(x, y, zz);
        b.plate([[-0.28, -0.36], [0.28, -0.36], [0.28, 0.36], [-0.28, 0.36]], 0.04);
        b.restore();
        b.setEmissive(0);
        b.setColor(p.trim);
        b.save().translate(x, y, zz * 1.004);
        b.plate([[-0.34, -0.42], [0.34, -0.42], [0.34, 0.42], [-0.34, 0.42]], 0.02);
        b.restore();
      }
    }
  }

  // Door on the +Z face.
  b.setColor(p.timber);
  b.save().translate(0, h * 0.3, hd + 0.03);
  b.plate([[-0.42, -h * 0.3], [0.42, -h * 0.3], [0.42, h * 0.3], [-0.42, h * 0.3]], 0.06);
  b.restore();
  b.setColor(p.trim);
  b.save().translate(0, h * 0.3, hd + 0.05);
  b.plate([[-0.5, -h * 0.32], [0.5, -h * 0.32], [0.5, h * 0.34], [-0.5, h * 0.34]], 0.02);
  b.restore();

  if (spec.lamp) {
    b.setColor('#f0d08a').setEmissive(1);
    b.save().translate(0, h * 0.72, hd + 0.18);
    b.gem(0.13, 6, 1.2, 0.9);
    b.restore();
    b.setEmissive(0);
    b.setColor(p.trim);
    b.save().translate(0, h * 0.82, hd + 0.1).rotateZ(Math.PI / 2);
    b.loft([
      { z: -0.02, pts: ringFrom(S_QUAD, 0.03, 0.03, 0) },
      { z: 0.16, pts: ringFrom(S_QUAD, 0.03, 0.03, 0) },
    ]);
    b.restore();
  }

  if (spec.chimney) {
    const cx = hw * rng.range(-0.5, 0.5);
    b.setColor(p.stone);
    b.save().translate(cx, 0, hd * rng.range(-0.4, 0.4)).rotateX(-Math.PI / 2);
    b.loft([
      { z: h * 0.5, pts: ringFrom(S_BOX, 0.32, 0.28, 0) },
      { z: ridge + 0.7, pts: ringFrom(S_BOX, 0.28, 0.24, 0) },
    ]);
    b.restore();
    b.setColor(shift(p.stone, 0, 0, -0.15));
    b.save().translate(cx, ridge + 0.78, 0).rotateX(-Math.PI / 2);
    b.plate([[-0.34, -0.3], [0.34, -0.3], [0.34, 0.3], [-0.34, 0.3]], 0.1);
    b.restore();
  }

  if (spec.porch) {
    b.setColor(p.timber);
    for (const side of [-1, 1]) {
      b.save().translate(side * 0.72, 0, hd + 0.8).rotateX(-Math.PI / 2);
      b.loft([
        { z: 0, pts: ringFrom(S_QUAD, 0.08, 0.08, 0) },
        { z: h * 0.62, pts: ringFrom(S_QUAD, 0.07, 0.07, 0) },
      ]);
      b.restore();
    }
    b.setColor(p.roof);
    b.save().translate(0, h * 0.66, hd + 0.42).rotateX(-Math.PI / 2 + 0.2);
    b.plate([[-1.0, -0.9], [1.0, -0.9], [1.0, 0.9], [-1.0, 0.9]], 0.08);
    b.restore();
  }

  if (spec.tower) {
    const th = spec.towerHeight ?? h * 1.7;
    const tw = Math.min(hw, hd) * 0.6;
    b.setColor(p.wallAlt);
    b.save().translate(hw - tw * 0.7, 0, -hd + tw * 0.7).rotateX(-Math.PI / 2);
    b.loft([
      { z: 0, pts: ringFrom(S_OCT, tw, tw, 0) },
      { z: th, pts: ringFrom(S_OCT, tw * 0.92, tw * 0.92, 0) },
    ]);
    b.restore();
    b.setColor(p.roof);
    b.save().translate(hw - tw * 0.7, th, -hd + tw * 0.7).rotateX(-Math.PI / 2);
    b.loft([
      { z: 0, pts: ringFrom(S_OCT, tw * 1.12, tw * 1.12, 0) },
      { z: tw * 1.5, pts: ringFrom(S_POINT, 0, 0, 0) },
    ]);
    b.restore();
    if (spec.lit) {
      b.setColor('#ffe8a8').setEmissive(1);
      b.save().translate(hw - tw * 0.7, th - 0.5, -hd + tw * 0.7 + tw);
      b.plate([[-tw * 0.5, -0.4], [tw * 0.5, -0.4], [tw * 0.5, 0.4], [-tw * 0.5, 0.4]], 0.04);
      b.restore();
      b.setEmissive(0);
    }
  }

  if (spec.sign) {
    b.setColor(spec.signColour ?? p.trim);
    b.save().translate(0, h * 0.62, hd + 0.14);
    b.plate([[-w * 0.3, -0.2], [w * 0.3, -0.2], [w * 0.3, 0.2], [-w * 0.3, 0.2]], 0.05);
    b.restore();
    b.setColor(shift(spec.signColour ?? p.trim, 0, 0, 0.3));
    b.save().translate(0, h * 0.62, hd + 0.18);
    b.plate([[-w * 0.26, -0.14], [w * 0.26, -0.14], [w * 0.26, 0.14], [-w * 0.26, 0.14]], 0.02);
    b.restore();
  }
}

/** A quay wall: stone blocks with a bullnose coping. */
export function buildQuay(
  b: MeshBuilder, length: number, height: number, depth: number, p: BuildingPalette, rng: Rng,
): void {
  const courses = Math.max(3, Math.round(height / 0.9));
  for (let i = 0; i < courses; i++) {
    const t0 = i / courses, t1 = (i + 1) / courses;
    const inset = t0 * depth * 0.1;
    b.setColor(shift(p.stone, 0, rng.signed(0.02), rng.signed(0.07) + (i % 2) * 0.03));
    b.loft([
      { z: -length / 2, pts: ringFrom(S_BOX, depth * 0.5 - inset, (t1 - t0) * height * 0.5, lerp(0, height, (t0 + t1) * 0.5)) },
      { z: length / 2, pts: ringFrom(S_BOX, depth * 0.5 - inset, (t1 - t0) * height * 0.5, lerp(0, height, (t0 + t1) * 0.5)) },
    ]);
  }
  // Coping.
  b.setColor(shift(p.stone, 0, 0, 0.12));
  b.loft([
    { z: -length / 2 - 0.1, pts: ringFrom(S_BOX, depth * 0.54, 0.16, height + 0.1) },
    { z: length / 2 + 0.1, pts: ringFrom(S_BOX, depth * 0.54, 0.16, height + 0.1) },
  ]);
  // Bollards.
  const bollards = Math.max(2, Math.round(length / 7));
  for (let i = 0; i < bollards; i++) {
    const z = lerp(-length / 2 + 3, length / 2 - 3, bollards === 1 ? 0.5 : i / (bollards - 1));
    b.setColor('#3a3a3c');
    b.save().translate(depth * 0.3, height + 0.2, z).rotateX(-Math.PI / 2);
    b.loft([
      { z: 0, pts: ringFrom(S_OCT, 0.2, 0.2, 0) },
      { z: 0.5, pts: ringFrom(S_OCT, 0.17, 0.17, 0) },
      { z: 0.62, pts: ringFrom(S_OCT, 0.25, 0.25, 0) },
    ]);
    b.restore();
  }
}

/** A timber jetty on piles, with a deck and mooring cleats. */
export function buildJetty(
  b: MeshBuilder, length: number, width: number, deckY: number,
  seabedAt: (x: number, z: number) => number,
  p: BuildingPalette, rng: Rng,
): void {
  const bays = Math.max(2, Math.round(length / 3.2));
  for (let i = 0; i <= bays; i++) {
    const z = lerp(-length / 2, length / 2, i / bays);
    for (const side of [-1, 1]) {
      const x = side * (width / 2 - 0.25);
      const floor = seabedAt(x, z);
      b.setColor(shift(p.timber, 0, rng.signed(0.04), rng.signed(0.08)));
      b.save().translate(x, 0, z).rotateX(-Math.PI / 2);
      b.loft([
        { z: floor - 0.4, pts: ringFrom(S_OCT, 0.17, 0.17, 0) },
        { z: deckY + 0.1, pts: ringFrom(S_OCT, 0.15, 0.15, 0) },
      ]);
      b.restore();
      // Cross brace.
      if (i < bays) {
        const z2 = lerp(-length / 2, length / 2, (i + 1) / bays);
        b.setColor(shift(p.timber, 0, 0, -0.08));
        b.tube(
          [new Vector3(x, floor + 0.6, z), new Vector3(x, deckY - 0.3, z2)],
          0.07, 4,
        );
      }
    }
  }
  // Deck planks.
  const planks = Math.max(4, Math.round(length / 0.55));
  for (let i = 0; i < planks; i++) {
    const z = lerp(-length / 2, length / 2, i / (planks - 1));
    b.setColor(shift(p.timber, 0, rng.signed(0.03), rng.signed(0.1) + 0.12));
    b.save().translate(0, deckY, z).rotateX(-Math.PI / 2);
    b.plate([
      [-width / 2, -0.24], [width / 2, -0.24], [width / 2, 0.24], [-width / 2, 0.24],
    ], 0.1);
    b.restore();
  }
}

/** A moored fishing boat, seen mostly from underneath. */
export function buildMooredBoat(
  b: MeshBuilder, length: number, p: BuildingPalette, rng: Rng, colour: string,
): void {
  const half = length / 2;
  const beam = length * 0.28;
  const draft = length * 0.16;
  b.setColor(colour);
  b.loft([
    { z: -half, pts: ringFrom(S_POINT, 0, 0, 0) },
    { z: -half * 0.78, pts: ringFrom(S_HEX, beam * 0.36, draft * 0.5, -draft * 0.3) },
    { z: -half * 0.3, pts: ringFrom(S_HEX, beam * 0.48, draft * 0.72, -draft * 0.2) },
    { z: half * 0.2, pts: ringFrom(S_HEX, beam * 0.5, draft * 0.78, -draft * 0.16) },
    { z: half * 0.7, pts: ringFrom(S_HEX, beam * 0.4, draft * 0.6, -draft * 0.2) },
    { z: half, pts: ringFrom(S_HEX, beam * 0.2, draft * 0.34, -draft * 0.3) },
  ]);
  // Gunwale stripe.
  b.setColor(shift(colour, 0, 0, -0.24));
  b.loft([
    { z: -half * 0.78, pts: ringFrom(S_HEX, beam * 0.37, draft * 0.09, draft * 0.34) },
    { z: half * 0.7, pts: ringFrom(S_HEX, beam * 0.41, draft * 0.09, draft * 0.34) },
  ], { capStart: false, capEnd: false });
  // Wheelhouse.
  b.setColor(p.wall);
  b.save().translate(0, draft * 0.5, -half * 0.15);
  b.loft([
    { z: -length * 0.1, pts: ringFrom(S_BOX, beam * 0.3, draft * 0.42, draft * 0.42) },
    { z: length * 0.1, pts: ringFrom(S_BOX, beam * 0.3, draft * 0.42, draft * 0.42) },
  ]);
  b.restore();
  b.setColor(p.roof);
  b.save().translate(0, draft * 0.95, -half * 0.15).rotateX(-Math.PI / 2);
  b.plate([
    [-beam * 0.34, -length * 0.12], [beam * 0.34, -length * 0.12],
    [beam * 0.34, length * 0.12], [-beam * 0.34, length * 0.12],
  ], 0.08);
  b.restore();
  // Mast.
  b.setColor(p.timber);
  b.save().translate(0, draft * 0.4, -half * 0.02).rotateX(-Math.PI / 2);
  b.loft([
    { z: 0, pts: ringFrom(S_QUAD, 0.08, 0.08, 0) },
    { z: length * 0.44, pts: ringFrom(S_QUAD, 0.05, 0.05, 0) },
  ]);
  b.restore();
  void rng;
}

/** A crane on the quay, for lifting submarines out of the water. */
export function buildCrane(b: MeshBuilder, height: number, reach: number, p: BuildingPalette): void {
  b.setColor(p.trim);
  b.save().rotateX(-Math.PI / 2);
  b.loft([
    { z: 0, pts: ringFrom(S_BOX, 0.5, 0.5, 0) },
    { z: height * 0.12, pts: ringFrom(S_BOX, 0.34, 0.34, 0) },
    { z: height, pts: ringFrom(S_BOX, 0.22, 0.22, 0) },
  ]);
  b.restore();
  // Jib.
  b.setColor(shift(p.trim, 0, 0, 0.12));
  b.save().translate(0, height, 0).rotateZ(-0.28);
  b.loft([
    { z: -0.3, pts: ringFrom(S_BOX, 0.2, 0.2, 0) },
    { z: reach, pts: ringFrom(S_BOX, 0.12, 0.12, 0) },
  ]);
  b.restore();
  // Hook and cable.
  const tipX = Math.cos(-0.28 + Math.PI / 2) * reach;
  const tipY = height + Math.sin(-0.28 + Math.PI / 2) * reach;
  b.setColor('#2e2e32');
  b.tube([new Vector3(tipX, tipY, 0), new Vector3(tipX, tipY - height * 0.5, 0)], 0.035, 4);
  b.setColor('#8a8f97');
  b.save().translate(tipX, tipY - height * 0.5, 0);
  b.gem(0.22, 6, 0.9, 1.3);
  b.restore();
}

/** A navigation buoy: the marker that says a mooring has been found. */
export function buildBuoy(b: MeshBuilder, size: number, colour: string, glow: string): void {
  b.setColor(colour);
  b.save().rotateX(-Math.PI / 2);
  b.loft([
    { z: -size * 0.6, pts: ringFrom(S_POINT, 0, 0, 0) },
    { z: -size * 0.3, pts: ringFrom(S_OCT, size * 0.4, size * 0.4, 0) },
    { z: size * 0.2, pts: ringFrom(S_OCT, size * 0.5, size * 0.5, 0) },
    { z: size * 0.45, pts: ringFrom(S_OCT, size * 0.34, size * 0.34, 0) },
  ]);
  b.restore();
  b.setColor(shift(colour, 0, 0, -0.2));
  b.save().rotateX(-Math.PI / 2);
  b.loft([
    { z: size * 0.45, pts: ringFrom(S_OCT, size * 0.12, size * 0.12, 0) },
    { z: size * 1.0, pts: ringFrom(S_OCT, size * 0.09, size * 0.09, 0) },
  ]);
  b.restore();
  b.setColor(glow).setEmissive(1);
  b.save().translate(0, size * 1.06, 0);
  b.gem(size * 0.16, 6, 1.2, 1);
  b.restore();
  b.setEmissive(0);
}

export { TAU };
