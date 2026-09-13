/**
 * Ashcombe harbour.
 *
 * The one place in the world that is entirely hand-placed. It is built on the
 * seaward edge of a headland, with a stone quay, three timber jetties, a
 * working waterfront and a dredged channel out into Lantern Bay.
 *
 * The harbour is also the game's progress meter: the museum starts as a single
 * room and becomes an exhibition hall, the laboratory grows a tower, the dock
 * gets longer, and lights come on in buildings that were dark. All of that is
 * driven by `setTier`, which rebuilds the town.
 */

import { Group, Mesh, Object3D, PointLight, Vector3, type Material } from 'three';
import { MeshBuilder } from '../procedural/geo';
import {
  HARBOUR_PALETTE, buildBuilding, buildBuoy, buildCrane, buildJetty,
  buildMooredBoat, buildQuay, type BuildingSpec,
} from '../procedural/buildings';
import { buildBoulder, buildPebbleField } from '../procedural/rocks';
import { Rng } from '../core/rng';
import { TAU, lerp } from '../core/math';
import { mixHex, shift } from '../procedural/palette';
import type { TerrainField } from './terrain';

/** Where the submarine sits when docked. */
export const BERTH = new Vector3(0, -3.4, -104);
/** Radius within which docking is offered. */
export const DOCK_RADIUS = 22;

export type FacilityId =
  | 'workshop' | 'market' | 'laboratory' | 'museum' | 'salvage' | 'store'
  | 'expedition' | 'tavern' | 'equipment' | 'collector' | 'harbourmaster' | 'aquarium';

export interface Facility {
  id: FacilityId;
  name: string;
  /** World position of the door, for the map and for NPC placement. */
  pos: Vector3;
  /** Tier at which the building appears. */
  minTier: number;
  colour: string;
}

interface BuildingPlacement {
  id: FacilityId;
  name: string;
  x: number;
  z: number;
  rot: number;
  spec: Omit<BuildingSpec, 'palette'>;
  minTier: number;
  /** Extra size added per town tier. */
  growth?: { w: number; h: number; storeys: number };
  colour: string;
}

const P = HARBOUR_PALETTE;

/** The waterfront is painted, weathered and cheerful; the roofs are not. */
const WALL_TONES = ['#dcd0b4', '#c9bfa4', '#e0d3ba', '#c2c9c0', '#d6c3ac', '#cdd4cd'];
const ROOF_TONES = ['#7a4a3c', '#5f5a52', '#8c5a48', '#4a5a5c', '#6b4a44', '#3f4a4c'];

const PLACEMENTS: BuildingPlacement[] = [
  {
    id: 'harbourmaster', name: "Harbour Master's Office", x: -30, z: -150, rot: 0.06, minTier: 0,
    colour: '#3f5f66',
    spec: {
      w: 7, d: 6, h: 4.4, roofPitch: 0.8, storeys: 2, roof: 'gable',
      chimney: true, lamp: true, lit: true, sign: 'HM', signColour: '#3f5f66',
      tower: true, towerHeight: 8.5,
    },
  },
  {
    id: 'workshop', name: 'Kestrel & Daughter, Submarine Works', x: 22, z: -152, rot: -0.1, minTier: 0,
    colour: '#8a5a3c',
    spec: {
      w: 13, d: 9, h: 5.6, roofPitch: 0.42, storeys: 1, roof: 'shed',
      chimney: true, porch: true, lamp: true, lit: true, sign: 'WORKS', signColour: '#8a5a3c',
    },
    growth: { w: 3, h: 0.8, storeys: 0 },
  },
  {
    id: 'market', name: 'Fish Market', x: -13, z: -160, rot: 0.02, minTier: 0,
    colour: '#4f7f6a',
    spec: {
      w: 11, d: 7, h: 3.8, roofPitch: 0.5, storeys: 1, roof: 'gable',
      porch: true, lamp: true, lit: true, sign: 'MARKET', signColour: '#4f7f6a',
    },
  },
  {
    id: 'salvage', name: "Vellum's Salvage", x: 42, z: -164, rot: 0.2, minTier: 0,
    colour: '#7a6a3c',
    spec: {
      w: 8, d: 7, h: 4, roofPitch: 0.36, storeys: 1, roof: 'shed',
      lamp: true, sign: 'SALVAGE', signColour: '#7a6a3c',
    },
  },
  {
    id: 'store', name: 'General Store', x: -46, z: -162, rot: -0.06, minTier: 0,
    colour: '#a8703c',
    spec: {
      w: 8, d: 6.5, h: 4.6, roofPitch: 0.7, storeys: 2, roof: 'gable',
      chimney: true, lamp: true, lit: true, sign: 'STORE', signColour: '#a8703c',
    },
  },
  {
    id: 'tavern', name: 'The Drowned Bell', x: -62, z: -150, rot: 0.14, minTier: 0,
    colour: '#8c3f4a',
    spec: {
      w: 9, d: 8, h: 5, roofPitch: 0.78, storeys: 2, roof: 'gable',
      chimney: true, porch: true, lamp: true, lit: true, sign: 'BELL', signColour: '#8c3f4a',
      dormers: true,
    },
  },
  {
    id: 'laboratory', name: 'Ashcombe Institute', x: 2, z: -178, rot: 0, minTier: 1,
    colour: '#4a7f9c',
    spec: {
      w: 14, d: 10, h: 6.5, roofPitch: 0.2, storeys: 3, roof: 'flat',
      lamp: true, lit: true, sign: 'INSTITUTE', signColour: '#4a7f9c',
      tower: true, towerHeight: 12,
    },
    growth: { w: 4, h: 1.6, storeys: 1 },
  },
  {
    id: 'museum', name: 'Harbour Museum', x: -34, z: -186, rot: 0.03, minTier: 1,
    colour: '#8f7fbf',
    spec: {
      w: 10, d: 9, h: 5, roofPitch: 0.44, storeys: 2, roof: 'hip',
      porch: true, lamp: true, lit: true, sign: 'MUSEUM', signColour: '#8f7fbf',
    },
    growth: { w: 6, h: 2.2, storeys: 1 },
  },
  {
    id: 'expedition', name: 'Expedition Office', x: 36, z: -180, rot: -0.14, minTier: 2,
    colour: '#c8a45c',
    spec: {
      w: 8, d: 7, h: 4.8, roofPitch: 0.6, storeys: 2, roof: 'gable',
      lamp: true, lit: true, sign: 'EXPED', signColour: '#c8a45c',
    },
  },
  {
    id: 'equipment', name: 'Deepwater Equipment', x: 58, z: -152, rot: 0.24, minTier: 2,
    colour: '#5f6b7f',
    spec: {
      w: 9, d: 7, h: 4.4, roofPitch: 0.3, storeys: 1, roof: 'shed',
      lamp: true, sign: 'EQUIP', signColour: '#5f6b7f',
    },
  },
  {
    id: 'collector', name: "Ondrey's Curiosities", x: -74, z: -168, rot: -0.2, minTier: 3,
    colour: '#a8628f',
    spec: {
      w: 7, d: 6, h: 5.2, roofPitch: 0.9, storeys: 2, roof: 'gable',
      chimney: true, lamp: true, lit: true, sign: 'CURIO', signColour: '#a8628f',
    },
  },
  {
    id: 'aquarium', name: 'Harbour Aquarium', x: -8, z: -200, rot: 0, minTier: 4,
    colour: '#3fa0a8',
    spec: {
      w: 16, d: 12, h: 6, roofPitch: 0.5, storeys: 2, roof: 'dome',
      lamp: true, lit: true, sign: 'AQUARIUM', signColour: '#3fa0a8',
    },
    growth: { w: 4, h: 1.2, storeys: 0 },
  },
];

export class Harbour {
  readonly root = new Object3D();
  readonly facilities: Facility[] = [];
  private geometries: import('three').BufferGeometry[] = [];
  private lights: PointLight[] = [];
  private terrain: TerrainField;
  private surfaceMat: Material;
  private glowMat: Material;
  private tier = 0;

  constructor(terrain: TerrainField, surfaceMat: Material, glowMat: Material) {
    this.terrain = terrain;
    this.surfaceMat = surfaceMat;
    this.glowMat = glowMat;
    this.root.name = 'harbour';
    // Level ground for the town and its approach, so nothing has to be
    // hand-adjusted when the terrain noise changes.
    terrain.addPad(0, -186, 96, 5.2, 0.55);
    terrain.addPad(0, -150, 74, 4.45, 0.4);
    terrain.addPad(0, -118, 46, -6.5, 0.6);
    this.build(0);
  }

  get townTier(): number {
    return this.tier;
  }

  /** Rebuild the town at a new tier. Called when the museum or lab expands. */
  setTier(tier: number): void {
    if (tier === this.tier) return;
    this.build(tier);
  }

  private clear(): void {
    for (const g of this.geometries) g.dispose();
    this.geometries.length = 0;
    for (const l of this.lights) {
      this.root.remove(l);
      l.dispose();
    }
    this.lights.length = 0;
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    this.facilities.length = 0;
  }

  private build(tier: number): void {
    this.clear();
    this.tier = tier;
    const rng = new Rng(0xa5c0);
    const solid = new MeshBuilder();
    const glow = new MeshBuilder();
    const seabed = (x: number, z: number) => this.terrain.height(x, z);

    // --- quay --------------------------------------------------------
    const quayLen = 190 + tier * 26;
    solid.save().translate(0, 0, -134).rotateY(Math.PI / 2);
    buildQuay(solid, quayLen, 4.2, 12, P, rng);
    solid.restore();

    // Quay deck, so it reads as a surface rather than a wall.
    solid.setColor(shift(P.stone, 0, 0, 0.06));
    solid.save().translate(0, 4.3, -142).rotateX(-Math.PI / 2);
    solid.plate([
      [-quayLen / 2, -9], [quayLen / 2, -9], [quayLen / 2, 9], [-quayLen / 2, 9],
    ], 0.4);
    solid.restore();

    // --- jetties -----------------------------------------------------
    const jetties = [-58, 0, 58].slice(0, 2 + Math.min(1, tier));
    for (const jx of jetties) {
      solid.save().translate(jx, 0, -116);
      buildJetty(solid, 34, 3.4, 1.4, (x, z) => seabed(x + jx, z - 116), P, rng);
      solid.restore();
    }

    // --- crane -------------------------------------------------------
    solid.save().translate(26, 4.4, -140);
    buildCrane(solid, 9 + tier * 0.8, 7, P);
    solid.restore();

    // --- buildings ---------------------------------------------------
    for (const b of PLACEMENTS) {
      if (tier < b.minTier) continue;
      const grow = b.growth
        ? {
          w: b.growth.w * Math.max(0, tier - b.minTier),
          h: b.growth.h * Math.max(0, tier - b.minTier),
          storeys: b.growth.storeys * Math.max(0, tier - b.minTier),
        }
        : { w: 0, h: 0, storeys: 0 };
      const ground = Math.max(4.42, seabed(b.x, b.z) - 0.05);
      solid.save().translate(b.x, ground, b.z).rotateY(b.rot);
      buildBuilding(solid, {
        ...b.spec,
        w: b.spec.w + grow.w,
        h: b.spec.h + grow.h,
        storeys: b.spec.storeys + grow.storeys,
        palette: {
          ...P,
          wall: mixHex(WALL_TONES[rng.int(0, WALL_TONES.length - 1)], b.colour, 0.12),
          wallAlt: shift(P.wallAlt, 0, rng.signed(0.04), rng.signed(0.06)),
          roof: ROOF_TONES[rng.int(0, ROOF_TONES.length - 1)],
          trim: b.colour,
          timber: shift(P.timber, 0, rng.signed(0.04), rng.signed(0.07)),
        },
      }, rng);
      solid.restore();

      // A warm light at each door once the place is open.
      if (b.spec.lit) {
        const l = new PointLight(0xffd9a0, 1.6, 22, 1.6);
        l.position.set(b.x, ground + b.spec.h * 0.7, b.z + b.spec.d * 0.5 + 1.2);
        this.root.add(l);
        this.lights.push(l);
      }

      this.facilities.push({
        id: b.id, name: b.name, minTier: b.minTier, colour: b.colour,
        pos: new Vector3(b.x, ground, b.z + b.spec.d * 0.5 + 1),
      });
    }

    // --- moored boats -------------------------------------------------
    const boatColours = ['#c8402c', '#3f7f9c', '#e0a04c', '#5f8f5a', '#8c5a9c'];
    for (let i = 0; i < 4 + Math.min(3, tier); i++) {
      const jx = jetties[i % jetties.length];
      const side = i % 2 === 0 ? -1 : 1;
      const z = -118 + (i % 3) * 9;
      solid.save();
      solid.translate(jx + side * 3.4, -0.5, z);
      solid.rotateY(side > 0 ? 0.05 : -0.05);
      buildMooredBoat(solid, rng.range(6, 9.5), P, rng, boatColours[i % boatColours.length]);
      solid.restore();
    }

    // --- underwater dressing -----------------------------------------
    // The seabed under a working harbour is not clean.
    for (let i = 0; i < 46; i++) {
      const x = rng.range(-90, 90);
      const z = rng.range(-136, -96);
      const h = seabed(x, z);
      if (h > 0) continue;
      solid.save().translate(x, h, z).rotateY(rng.next() * TAU);
      buildBoulder(solid, rng, rng.range(0.6, 2.4), {
        colors: ['#4b5750', '#63705f', '#828c76'],
        angularity: 0.45, dust: '#cdb37c', moss: '#5f9455',
      });
      solid.restore();
    }
    for (let i = 0; i < 14; i++) {
      const x = rng.range(-80, 80);
      const z = rng.range(-134, -100);
      const h = seabed(x, z);
      if (h > 0) continue;
      solid.save().translate(x, h, z);
      buildPebbleField(solid, rng, rng.range(1.5, 3.5), rng.int(8, 18),
        ['#63705f', '#b39a68', '#828c76']);
      solid.restore();
    }

    // --- berth marker -------------------------------------------------
    glow.save().translate(BERTH.x, BERTH.y + 1.6, BERTH.z);
    buildBuoy(glow, 1.4, '#e0a04c', '#ffe8b0');
    glow.restore();
    for (const side of [-1, 1]) {
      glow.save().translate(BERTH.x + side * 7, BERTH.y + 1.2, BERTH.z + 4);
      buildBuoy(glow, 0.9, side > 0 ? '#3fa060' : '#c8402c', side > 0 ? '#9fffc0' : '#ffb0a0');
      glow.restore();
    }

    // --- harbour lamps -------------------------------------------------
    const lampCount = 6 + tier;
    for (let i = 0; i < lampCount; i++) {
      const x = lerp(-quayLen * 0.42, quayLen * 0.42, i / (lampCount - 1));
      solid.setColor('#2e3a3e');
      solid.save().translate(x, 4.4, -136).rotateX(-Math.PI / 2);
      solid.loft([
        { z: 0, pts: [[0.18, 0], [0, 0.18], [-0.18, 0], [0, -0.18]] as [number, number][] },
        { z: 4.2, pts: [[0.1, 0], [0, 0.1], [-0.1, 0], [0, -0.1]] as [number, number][] },
      ]);
      solid.restore();
      glow.save().translate(x, 8.9, -136);
      glow.setColor('#ffdca0').setEmissive(1);
      glow.gem(0.32, 6, 1.1, 0.8);
      glow.restore();
      const l = new PointLight(0xffd9a0, 2.2, 26, 1.7);
      l.position.set(x, 8.9, -136);
      this.root.add(l);
      this.lights.push(l);
    }

    // --- meshes -------------------------------------------------------
    const solidGeo = solid.build();
    this.geometries.push(solidGeo);
    const solidMesh = new Mesh(solidGeo, this.surfaceMat);
    solidMesh.name = 'harbour-solid';
    solidMesh.castShadow = true;
    solidMesh.receiveShadow = true;
    solidMesh.frustumCulled = false;
    this.root.add(solidMesh);

    if (glow.vertexCount > 0) {
      const glowGeo = glow.build();
      this.geometries.push(glowGeo);
      const glowMesh = new Mesh(glowGeo, this.glowMat);
      glowMesh.name = 'harbour-glow';
      glowMesh.frustumCulled = false;
      this.root.add(glowMesh);
    }
  }

  /** Is the submarine close enough to dock? */
  canDock(pos: Vector3): boolean {
    return pos.distanceTo(BERTH) < DOCK_RADIUS;
  }

  distanceToBerth(pos: Vector3): number {
    return pos.distanceTo(BERTH);
  }

  facility(id: FacilityId): Facility | undefined {
    return this.facilities.find((f) => f.id === id);
  }

  dispose(): void {
    this.clear();
  }
}

export { mixHex };

/** A small group for the town, so the game can hide it when far away. */
export function makeHarbourGroup(): Group {
  const g = new Group();
  g.name = 'harbour-root';
  return g;
}
