/**
 * Terrain streaming.
 *
 * The seabed is diced into 128 m chunks at three levels of detail. Each chunk
 * bakes three meshes — terrain, static props (boulders, outcrops, vents) and
 * vegetation — so a fully dressed chunk costs three draw calls no matter how
 * many rocks and kelp stipes are in it.
 *
 * Generation is time-budgeted: the manager will never spend more than a few
 * milliseconds a frame building chunks, so streaming never causes a hitch.
 */

import {
  BufferGeometry,
  Color,
  Frustum,
  Matrix4,
  Mesh,
  Object3D,
  Vector3,
} from 'three';
import type { TerrainField } from './terrain';
import { MeshBuilder } from '../procedural/geo';
import { FLORA, addSwayRange } from '../procedural/flora';
import {
  buildBoulder, buildCrystalCluster, buildOutcrop, buildPebbleField,
  buildRockFormation, buildSedimentMound, buildVentChimney,
} from '../procedural/rocks';
import { REGIONS } from '../data/regions';
import { Rng, hashInts } from '../core/rng';
import { clamp01, lerp, smoothstep } from '../core/math';
import { mixHex } from '../procedural/palette';
import type { RegionDef } from './regionTypes';

export const CHUNK_SIZE = 128;
const LOD_RES = [26, 13, 7];
/** Chunk-distance thresholds for each LOD, scaled by quality. */
const LOD_DIST = [2, 4];

export interface ChunkMaterials {
  terrain: import('three').Material;
  props: import('three').Material;
  foliage: import('three').Material;
}

interface Chunk {
  cx: number;
  cz: number;
  lod: number;
  group: Object3D;
  terrainMesh: Mesh | null;
  propMesh: Mesh | null;
  floraMesh: Mesh | null;
  /** Bounding sphere centre/radius for culling and distance. */
  centre: Vector3;
  radius: number;
  /** Prop anchor points other systems can hook onto (vents, nests). */
  anchors: { kind: string; pos: Vector3 }[];
  built: boolean;
}

interface PendingJob {
  cx: number;
  cz: number;
  lod: number;
  priority: number;
}

const _v = new Vector3();
const _frustum = new Frustum();
const _projScreen = new Matrix4();
const _weights = new Float32Array(REGIONS.length);

export class ChunkManager {
  readonly root = new Object3D();
  private chunks = new Map<string, Chunk>();
  private queue: PendingJob[] = [];
  private terrain: TerrainField;
  private mats: ChunkMaterials;
  private worldSeed: number;

  /** Radius in chunks around the viewer that stays loaded. */
  viewRadius = 6;
  detailScale = 1;
  /** Milliseconds per frame the manager may spend generating. */
  budgetMs = 4.5;

  readonly stats = { loaded: 0, queued: 0, built: 0, visible: 0, tris: 0 };

  constructor(terrain: TerrainField, mats: ChunkMaterials, worldSeed: number) {
    this.terrain = terrain;
    this.mats = mats;
    this.worldSeed = worldSeed;
    this.root.name = 'terrain';
    this.root.matrixAutoUpdate = false;
  }

  key(cx: number, cz: number): string {
    return `${cx},${cz}`;
  }

  /** Update streaming around a viewer position. Call once per frame. */
  update(viewer: Vector3, camera: import('three').Camera, dt: number): void {
    void dt;
    const ccx = Math.floor(viewer.x / CHUNK_SIZE);
    const ccz = Math.floor(viewer.z / CHUNK_SIZE);
    const R = Math.round(this.viewRadius);

    // Queue anything missing or at the wrong LOD.
    this.queue.length = 0;
    for (let dz = -R; dz <= R; dz++) {
      for (let dx = -R; dx <= R; dx++) {
        const d = Math.hypot(dx, dz);
        if (d > R + 0.5) continue;
        const cx = ccx + dx, cz = ccz + dz;
        const lod = d <= LOD_DIST[0] ? 0 : d <= LOD_DIST[1] ? 1 : 2;
        const k = this.key(cx, cz);
        const existing = this.chunks.get(k);
        if (!existing) {
          this.queue.push({ cx, cz, lod, priority: d });
        } else if (existing.lod !== lod) {
          // Hysteresis: only upgrade/downgrade when clearly past the boundary.
          const target = d <= LOD_DIST[0] - 0.35 ? 0
            : d <= LOD_DIST[1] - 0.35 ? 1
              : d > LOD_DIST[1] + 0.35 ? 2
                : existing.lod;
          if (target !== existing.lod) this.queue.push({ cx, cz, lod: target, priority: d + 0.01 });
        }
      }
    }
    this.queue.sort((a, b) => a.priority - b.priority);

    // Unload distant chunks.
    const maxD = (R + 1.6) * CHUNK_SIZE;
    for (const [k, c] of this.chunks) {
      const dx = (c.cx + 0.5) * CHUNK_SIZE - viewer.x;
      const dz = (c.cz + 0.5) * CHUNK_SIZE - viewer.z;
      if (Math.hypot(dx, dz) > maxD) {
        this.disposeChunk(c);
        this.chunks.delete(k);
      }
    }

    // Build within budget.
    const t0 = performance.now();
    let built = 0;
    while (this.queue.length > 0 && performance.now() - t0 < this.budgetMs) {
      const job = this.queue.shift()!;
      this.buildChunk(job.cx, job.cz, job.lod);
      built++;
      if (built > 6) break;
    }

    // Frustum culling.
    _projScreen.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    _frustum.setFromProjectionMatrix(_projScreen);
    let visible = 0;
    for (const c of this.chunks.values()) {
      const vis = _frustum.intersectsSphere({ center: c.centre, radius: c.radius } as never);
      c.group.visible = vis;
      if (vis) visible++;
    }

    this.stats.loaded = this.chunks.size;
    this.stats.queued = this.queue.length;
    this.stats.built = built;
    this.stats.visible = visible;
  }

  /** Force-build the chunks immediately around a point (used on load/teleport). */
  primeAround(pos: Vector3, radius = 3): void {
    const ccx = Math.floor(pos.x / CHUNK_SIZE);
    const ccz = Math.floor(pos.z / CHUNK_SIZE);
    for (let dz = -radius; dz <= radius; dz++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const d = Math.hypot(dx, dz);
        if (d > radius + 0.5) continue;
        const lod = d <= LOD_DIST[0] ? 0 : d <= LOD_DIST[1] ? 1 : 2;
        if (!this.chunks.has(this.key(ccx + dx, ccz + dz))) {
          this.buildChunk(ccx + dx, ccz + dz, lod);
        }
      }
    }
  }

  /** Drop every chunk — used when the world seed changes. */
  clear(): void {
    for (const c of this.chunks.values()) this.disposeChunk(c);
    this.chunks.clear();
    this.queue.length = 0;
  }

  private disposeChunk(c: Chunk): void {
    for (const m of [c.terrainMesh, c.propMesh, c.floraMesh]) {
      if (!m) continue;
      m.geometry.dispose();
      this.root.remove(m);
    }
    this.root.remove(c.group);
  }

  private buildChunk(cx: number, cz: number, lod: number): void {
    const k = this.key(cx, cz);
    const old = this.chunks.get(k);
    if (old) {
      this.disposeChunk(old);
      this.chunks.delete(k);
    }

    const group = new Object3D();
    group.matrixAutoUpdate = false;
    const ox = cx * CHUNK_SIZE;
    const oz = cz * CHUNK_SIZE;

    const terrainGeo = this.buildTerrainGeometry(ox, oz, LOD_RES[lod]);
    const terrainMesh = new Mesh(terrainGeo, this.mats.terrain);
    terrainMesh.frustumCulled = false;
    terrainMesh.matrixAutoUpdate = false;
    terrainMesh.receiveShadow = true;
    group.add(terrainMesh);

    let propMesh: Mesh | null = null;
    let floraMesh: Mesh | null = null;
    const anchors: { kind: string; pos: Vector3 }[] = [];

    if (lod <= 1) {
      const densityMul = (lod === 0 ? 1 : 0.45) * this.detailScale;
      const props = this.buildProps(ox, oz, densityMul, anchors);
      if (props) {
        propMesh = new Mesh(props, this.mats.props);
        propMesh.frustumCulled = false;
        propMesh.matrixAutoUpdate = false;
        propMesh.castShadow = lod === 0;
        propMesh.receiveShadow = true;
        group.add(propMesh);
      }
      const flora = this.buildFlora(ox, oz, densityMul);
      if (flora) {
        floraMesh = new Mesh(flora, this.mats.foliage);
        floraMesh.frustumCulled = false;
        floraMesh.matrixAutoUpdate = false;
        group.add(floraMesh);
      }
    }

    // Bounding sphere from the terrain geometry, padded for props.
    terrainGeo.computeBoundingSphere();
    const bs = terrainGeo.boundingSphere!;
    const centre = bs.center.clone();
    const radius = bs.radius + 24;

    this.root.add(group);
    this.chunks.set(k, {
      cx, cz, lod, group, terrainMesh, propMesh, floraMesh,
      centre, radius, anchors, built: true,
    });
  }

  // --- terrain mesh ----------------------------------------------------

  private buildTerrainGeometry(ox: number, oz: number, res: number): BufferGeometry {
    const step = CHUNK_SIZE / res;
    const n = res + 1;
    const heights = new Float32Array(n * n);
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        heights[j * n + i] = this.terrain.height(ox + i * step, oz + j * step);
      }
    }

    // Palette resolved at the four corners and bilinearly interpolated: region
    // influence changes over hundreds of metres, so this is visually exact and
    // avoids ten colour blends per vertex.
    const pal = [
      this.blendPalette(ox, oz),
      this.blendPalette(ox + CHUNK_SIZE, oz),
      this.blendPalette(ox, oz + CHUNK_SIZE),
      this.blendPalette(ox + CHUNK_SIZE, oz + CHUNK_SIZE),
    ];

    // Cavity map: a box-blurred copy of the height grid. Faces that sit below
    // their neighbourhood get darkened, which reads as ambient occlusion in
    // crevices and gives the flat-shaded terrain real depth.
    const blur = new Float32Array(n * n);
    const R = 2;
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        let sum = 0, cnt = 0;
        for (let dj = -R; dj <= R; dj++) {
          const jj = j + dj;
          if (jj < 0 || jj >= n) continue;
          for (let di = -R; di <= R; di++) {
            const ii = i + di;
            if (ii < 0 || ii >= n) continue;
            sum += heights[jj * n + ii];
            cnt++;
          }
        }
        blur[j * n + i] = sum / cnt;
      }
    }

    const b = new MeshBuilder();
    const rng = new Rng(hashInts(ox, oz, this.worldSeed ^ 0x51ed));
    const c = new Color();
    const tmp = new Color();

    for (let j = 0; j < res; j++) {
      for (let i = 0; i < res; i++) {
        const x0 = ox + i * step, x1 = x0 + step;
        const z0 = oz + j * step, z1 = z0 + step;
        const h00 = heights[j * n + i];
        const h10 = heights[j * n + i + 1];
        const h01 = heights[(j + 1) * n + i];
        const h11 = heights[(j + 1) * n + i + 1];

        // Split each quad along the shorter diagonal: fewer sliver triangles
        // and a far more natural faceting pattern.
        const flip = Math.abs(h00 - h11) > Math.abs(h10 - h01);

        const cav = (h00 + h10 + h01 + h11) * 0.25 -
          (blur[j * n + i] + blur[j * n + i + 1] + blur[(j + 1) * n + i] + blur[(j + 1) * n + i + 1]) * 0.25;

        const faceColour = (hs: number[], cxp: number, czp: number) => {
          const avg = (hs[0] + hs[1] + hs[2]) / 3;
          const dh = Math.max(...hs) - Math.min(...hs);
          const slope = clamp01(dh / (step * 0.9));
          const u = (cxp - ox) / CHUNK_SIZE, v = (czp - oz) / CHUNK_SIZE;
          bilerpPalette(pal, u, v, tmp, slope, avg, rng);
          // Cavity shading: concave ground darkens, convex crests catch light.
          const ao = clamp01(0.5 + cav / (step * 1.3));
          tmp.multiplyScalar(lerp(0.46, 1.22, ao));
          return tmp;
        };

        if (!flip) {
          c.copy(faceColour([h00, h10, h11], x0 + step * 0.66, z0 + step * 0.66));
          b.setColor(c);
          b.addTri(x0, h00, z0, x0, h01, z1, x1, h11, z1);
          c.copy(faceColour([h00, h01, h11], x0 + step * 0.33, z0 + step * 0.33));
          b.setColor(c);
          b.addTri(x0, h00, z0, x1, h11, z1, x1, h10, z0);
        } else {
          c.copy(faceColour([h00, h01, h10], x0 + step * 0.33, z0 + step * 0.5));
          b.setColor(c);
          b.addTri(x0, h00, z0, x0, h01, z1, x1, h10, z0);
          c.copy(faceColour([h01, h11, h10], x0 + step * 0.66, z0 + step * 0.5));
          b.setColor(c);
          b.addTri(x0, h01, z1, x1, h11, z1, x1, h10, z0);
        }
      }
    }
    return b.build();
  }

  /** Blended sediment/rock colours at a point. */
  private blendPalette(x: number, z: number): BlendedPalette {
    const w = this.terrain.regionWeights(x, z, _weights);
    const out: BlendedPalette = {
      sand: new Color(0, 0, 0), sandAlt: new Color(0, 0, 0),
      rock0: new Color(0, 0, 0), rock1: new Color(0, 0, 0), rock2: new Color(0, 0, 0),
      accent: new Color(0, 0, 0),
    };
    const t = new Color();
    for (let i = 0; i < REGIONS.length; i++) {
      const k = w[i];
      if (k < 0.002) continue;
      const p = REGIONS[i].palette;
      out.sand.add(t.set(p.sand).multiplyScalar(k));
      out.sandAlt.add(t.set(p.sandAlt).multiplyScalar(k));
      out.rock0.add(t.set(p.rock[0]).multiplyScalar(k));
      out.rock1.add(t.set(p.rock[1]).multiplyScalar(k));
      out.rock2.add(t.set(p.rock[2]).multiplyScalar(k));
      out.accent.add(t.set(p.accent).multiplyScalar(k));
    }
    return out;
  }

  // --- props -----------------------------------------------------------

  private buildProps(
    ox: number, oz: number, densityMul: number,
    anchors: { kind: string; pos: Vector3 }[],
  ): BufferGeometry | null {
    const rng = new Rng(hashInts(ox, oz, this.worldSeed ^ 0x9a11));
    const b = new MeshBuilder();
    const area = (CHUNK_SIZE * CHUNK_SIZE) / 10000;
    let placed = 0;

    const cxm = ox + CHUNK_SIZE * 0.5;
    const czm = oz + CHUNK_SIZE * 0.5;
    const region = this.terrain.dominantRegion(cxm, czm);
    const bould = region.terrain.boulders;

    // Rocks arrive in clumps rather than a uniform sprinkle: a few seed points
    // per chunk, each with its own size character, then satellites around them.
    const clumps = Math.round(7 * bould * area * densityMul);
    for (let ci = 0; ci < clumps; ci++) {
      const seedX = ox + rng.next() * CHUNK_SIZE;
      const seedZ = oz + rng.next() * CHUNK_SIZE;
      const spread = rng.range(3, 16);
      const clumpScale = rng.range(0.55, 1.9);
      const members = rng.int(1, 5);
      for (let i = 0; i < members; i++) {
        const ang = rng.next() * Math.PI * 2;
        const dd = i === 0 ? 0 : Math.sqrt(rng.next()) * spread;
        const x = seedX + Math.cos(ang) * dd;
        const z = seedZ + Math.sin(ang) * dd;
        const h = this.terrain.height(x, z);
        if (h > 1) continue;
        const slope = this.terrain.slope(x, z, 2.2);
        const local = this.terrain.dominantRegion(x, z);
        const size = rng.range(0.9, 5.4) * clumpScale * (1 + slope * 1.3);
        b.save();
        b.translate(x, h - size * 0.06, z);
        b.rotateY(rng.next() * Math.PI * 2);
        b.rotateZ(rng.signed(0.12) * slope);
        const opts = {
          colors: local.palette.rock,
          angularity: clamp01(local.terrain.cliffiness + rng.signed(0.35)),
          stretch: rng.range(0.6, 1.25),
          dust: local.palette.sand,
          moss: -h < 70 ? local.palette.accent : undefined,
        };
        if (slope > 0.42 && rng.chance(0.6)) buildOutcrop(b, rng, size * 1.6, opts);
        else if (rng.chance(0.22)) buildRockFormation(b, rng, size, opts);
        else buildBoulder(b, rng, size, opts);
        b.restore();
        placed++;
      }
    }

    // Pebble fields on flat sediment.
    const pebbleCount = Math.round(5 * area * densityMul);
    for (let i = 0; i < pebbleCount; i++) {
      const x = ox + rng.next() * CHUNK_SIZE;
      const z = oz + rng.next() * CHUNK_SIZE;
      if (this.terrain.slope(x, z, 3) > 0.24) continue;
      const h = this.terrain.height(x, z);
      if (h > 0) continue;
      const local = this.terrain.dominantRegion(x, z);
      b.save().translate(x, h, z);
      buildPebbleField(b, rng, rng.range(1.5, 4), rng.int(6, 18),
        [local.palette.rock[1], local.palette.sandAlt, local.palette.rock[2]]);
      b.restore();
      placed++;
    }

    // Sediment mounds on abyssal plains.
    if (region.terrain.amplitude < 60) {
      const mounds = Math.round(3.4 * area * densityMul);
      for (let i = 0; i < mounds; i++) {
        const x = ox + rng.next() * CHUNK_SIZE;
        const z = oz + rng.next() * CHUNK_SIZE;
        if (this.terrain.slope(x, z, 3) > 0.2) continue;
        const h = this.terrain.height(x, z);
        if (h > 0) continue;
        b.save().translate(x, h, z);
        buildSedimentMound(b, rng, rng.range(2, 6),
          [region.palette.sand, region.palette.sandAlt]);
        b.restore();
        placed++;
      }
    }

    // Region specialities.
    if (region.id === 'emberfield') {
      const vents = Math.round(4.2 * area * densityMul);
      for (let i = 0; i < vents; i++) {
        const x = ox + rng.next() * CHUNK_SIZE;
        const z = oz + rng.next() * CHUNK_SIZE;
        if (this.terrain.slope(x, z, 3) > 0.4) continue;
        const h = this.terrain.height(x, z);
        if (h > 0) continue;
        const height = rng.range(3, 13);
        b.save().translate(x, h, z);
        buildVentChimney(b, rng, height, region.palette.rock[1], region.palette.accent);
        b.restore();
        anchors.push({ kind: 'vent', pos: new Vector3(x, h + height, z) });
        placed++;
      }
    }
    if (region.id === 'glasswork' || region.id === 'brinewake_trench') {
      const clusters = Math.round(6.0 * area * densityMul);
      for (let i = 0; i < clusters; i++) {
        const x = ox + rng.next() * CHUNK_SIZE;
        const z = oz + rng.next() * CHUNK_SIZE;
        const h = this.terrain.height(x, z);
        if (h > 0) continue;
        b.save().translate(x, h, z).rotateY(rng.next() * Math.PI * 2);
        buildCrystalCluster(b, rng, rng.range(2.5, 11),
          [region.palette.accent, region.palette.accentAlt, region.palette.glow], 0.45);
        b.restore();
        placed++;
      }
    }

    if (placed === 0) return null;
    return b.build();
  }

  // --- vegetation ------------------------------------------------------

  private buildFlora(ox: number, oz: number, densityMul: number): BufferGeometry | null {
    const rng = new Rng(hashInts(ox, oz, this.worldSeed ^ 0x77c3));
    const b = new MeshBuilder();
    const area = (CHUNK_SIZE * CHUNK_SIZE) / 10000;
    const ranges: { start: number; count: number; baseY: number; height: number; scale: number }[] = [];
    const w = this.terrain.regionWeights(ox + CHUNK_SIZE * 0.5, oz + CHUNK_SIZE * 0.5, _weights);

    for (let ri = 0; ri < REGIONS.length; ri++) {
      const weight = w[ri];
      if (weight < 0.05) continue;
      const region = REGIONS[ri];
      for (const entry of region.flora) {
        const builder = FLORA[entry.kind];
        if (!builder) continue;
        const count = Math.round(entry.density * weight * area * densityMul * 1.15);
        for (let i = 0; i < count; i++) {
          const x = ox + rng.next() * CHUNK_SIZE;
          const z = oz + rng.next() * CHUNK_SIZE;
          const h = this.terrain.height(x, z);
          if (h > -1.2) continue;
          const depth = -h;
          if (entry.depth && (depth < entry.depth[0] || depth > entry.depth[1])) continue;
          const slope = this.terrain.slope(x, z, 2.4);
          if (entry.maxSlope !== undefined && slope > entry.maxSlope) continue;

          const scaleRange = entry.scale ?? [0.75, 1.3];
          const size = baseSizeFor(entry.kind) * rng.range(scaleRange[0], scaleRange[1]);
          const colors = entry.colors ?? paletteColoursFor(entry.kind, region);
          const start = b.vertexCount;
          b.save();
          b.translate(x, h, z);
          b.rotateY(rng.next() * Math.PI * 2);
          builder(b, { size, colors, glow: entry.glow, rng });
          b.restore();
          const added = b.vertexCount - start;
          if (added > 0) {
            ranges.push({
              start, count: added, baseY: h,
              height: size * 1.1,
              scale: swayScaleFor(entry.kind),
            });
          }
        }
      }
    }
    if (b.vertexCount === 0) return null;
    const geo = b.build();
    addSwayRange(geo, ranges, 1.7);
    return geo;
  }

  /** Anchors (vents etc.) inside a radius — used for particle emitters. */
  anchorsNear(pos: Vector3, radius: number, kind?: string): { kind: string; pos: Vector3 }[] {
    const out: { kind: string; pos: Vector3 }[] = [];
    const r2 = radius * radius;
    for (const c of this.chunks.values()) {
      if (c.centre.distanceToSquared(pos) > (radius + c.radius) ** 2) continue;
      for (const a of c.anchors) {
        if (kind && a.kind !== kind) continue;
        if (a.pos.distanceToSquared(pos) < r2) out.push(a);
      }
    }
    return out;
  }

  isLoadedAt(x: number, z: number): boolean {
    return this.chunks.has(this.key(Math.floor(x / CHUNK_SIZE), Math.floor(z / CHUNK_SIZE)));
  }
}

interface BlendedPalette {
  sand: Color; sandAlt: Color;
  rock0: Color; rock1: Color; rock2: Color;
  accent: Color;
}

const _pc = new Color();
const _pc2 = new Color();

/** The land palette. Ashcombe is a cold, grassy headland on old grey rock. */
const LAND_BEACH = ['#d9c69a', '#c9b489'];
const LAND_TURF = ['#5e7a4a', '#6b874f', '#516d43', '#77914f'];
const LAND_ROCK = ['#6b6d6a', '#7d7f7a', '#5a5c5c'];

/**
 * The terrain's face colour rule. Sediment on flat ground, rock on slopes,
 * with a small deterministic facet-to-facet variation that gives the low-poly
 * surface its hand-painted quality.
 */
function bilerpPalette(
  pal: BlendedPalette[], u: number, v: number, out: Color,
  slope: number, height: number, rng: Rng,
): void {
  const lerpPal = (a: Color, b: Color, c: Color, d: Color, target: Color) => {
    target.copy(a).lerp(b, u);
    _pc2.copy(c).lerp(d, u);
    target.lerp(_pc2, v);
  };

  const sandMix = rng.next();
  lerpPal(pal[0].sand, pal[1].sand, pal[2].sand, pal[3].sand, out);
  lerpPal(pal[0].sandAlt, pal[1].sandAlt, pal[2].sandAlt, pal[3].sandAlt, _pc);
  out.lerp(_pc, sandMix * 0.55);

  const rockMix = rng.next();
  const rockA = rockMix < 0.4 ? 0 : rockMix < 0.78 ? 1 : 2;
  const pick = (p: BlendedPalette) => (rockA === 0 ? p.rock0 : rockA === 1 ? p.rock1 : p.rock2);
  lerpPal(pick(pal[0]), pick(pal[1]), pick(pal[2]), pick(pal[3]), _pc);

  const rocky = smoothstep(0.26, 0.44, slope);
  out.lerp(_pc, rocky);

  if (height > -0.6) {
    // Above the waterline the palette changes entirely: a beach, then turf,
    // then bare rock on the steep ground and the tops.
    const beach = smoothstep(-0.6, 1.6, height);
    const turf = smoothstep(1.4, 5, height) * (1 - smoothstep(0.34, 0.6, slope));
    const bare = Math.max(smoothstep(0.38, 0.62, slope), smoothstep(34, 62, height));
    _pc.set(LAND_BEACH[rng.next() < 0.5 ? 0 : 1]);
    out.lerp(_pc, beach);
    _pc.set(LAND_TURF[Math.floor(rng.next() * LAND_TURF.length)]);
    out.lerp(_pc, turf * 0.92);
    _pc.set(LAND_ROCK[Math.floor(rng.next() * LAND_ROCK.length)]);
    out.lerp(_pc, bare * 0.85);
  } else {
    // Depth darkening: deeper facets read cooler and slightly darker.
    const dark = clamp01((-height) / 9000) * 0.35;
    out.multiplyScalar(1 - dark);
  }

  // Quantised facet value. Rather than dithering the colour (which reads as
  // noise), snap each face to one of a handful of brightness steps. Adjacent
  // facets then differ by a clean, visible amount — the low-poly look.
  const step = rng.next() < 0.5 ? 0 : rng.next() < 0.5 ? 1 : rng.next() < 0.5 ? 2 : 3;
  const VALUE_STEPS = [0.82, 0.92, 1.0, 1.09];
  out.multiplyScalar(VALUE_STEPS[step]);
}

export function baseSizeFor(kind: string): number {
  switch (kind) {
    case 'giantKelp': return 30;
    case 'kelpSmall': return 7.5;
    case 'eelgrass': return 2.4;
    case 'sandTuft': return 1.3;
    case 'seaLettuce': return 1.3;
    case 'barnacleCluster': return 1.1;
    case 'brainCoral': return 2.4;
    case 'staghornCoral': return 3.2;
    case 'fanCoral': return 3.0;
    case 'tubeSponge': return 2.2;
    case 'anemone': return 1.4;
    case 'featherStar': return 1.2;
    case 'seaWhip': return 4.2;
    case 'glassSponge': return 2.6;
    case 'tubeWorm': return 2.0;
    case 'lanternPolyp': return 1.9;
    case 'bambooCoral': return 3.4;
    case 'ventBacterialMat': return 3.2;
    case 'ventShrimpNest': return 1.8;
    case 'stoneLichen': return 2.4;
    case 'crystalSpine': return 3.6;
    case 'seaLily': return 2.6;
    case 'abyssalFan': return 5.5;
    case 'wakeFilament': return 4.0;
    default: return 2;
  }
}

export function swayScaleFor(kind: string): number {
  switch (kind) {
    case 'giantKelp': return 1.5;
    case 'kelpSmall': return 1.0;
    case 'eelgrass': return 0.55;
    case 'sandTuft': return 0.3;
    case 'seaLettuce': return 0.5;
    case 'seaWhip': return 0.8;
    case 'wakeFilament': return 0.7;
    case 'abyssalFan': return 0.35;
    case 'fanCoral': return 0.22;
    case 'anemone': return 0.4;
    case 'tubeWorm': return 0.2;
    case 'lanternPolyp': return 0.45;
    case 'seaLily': return 0.5;
    case 'featherStar': return 0.35;
    case 'brainCoral':
    case 'staghornCoral':
    case 'barnacleCluster':
    case 'stoneLichen':
    case 'crystalSpine':
    case 'ventBacterialMat':
    case 'ventShrimpNest': return 0.04;
    default: return 0.3;
  }
}

function paletteColoursFor(kind: string, region: RegionDef): string[] {
  const p = region.palette;
  switch (kind) {
    case 'giantKelp':
    case 'kelpSmall':
      return [mixHex(p.accent, '#3d6b2c', 0.35), mixHex(p.accentAlt, '#87a83c', 0.4), p.accent];
    case 'eelgrass':
    case 'sandTuft':
      return [p.accent, mixHex(p.accent, p.accentAlt, 0.5), p.accentAlt];
    case 'seaLettuce':
      return [mixHex(p.accentAlt, '#8fce62', 0.5), p.accent];
    case 'glassSponge':
      return [mixHex('#e6f0ee', p.water, 0.28), '#dceae6'];
    case 'tubeWorm':
      return [p.accent, mixHex('#f2e8dc', p.sand, 0.3)];
    case 'lanternPolyp':
      return [mixHex(p.rock[1], p.accent, 0.4), p.glow];
    case 'bambooCoral':
      return [mixHex('#efe8d8', p.water, 0.2), p.rock[0]];
    case 'ventBacterialMat':
      return [mixHex('#e8dcc0', p.accent, 0.25), mixHex('#c8a878', p.accentAlt, 0.3)];
    case 'ventShrimpNest':
      return [p.rock[1], mixHex('#f0d8c0', p.accent, 0.2)];
    case 'stoneLichen':
      return [mixHex(p.rock[2], p.accent, 0.35), mixHex(p.rock[1], p.accentAlt, 0.3)];
    case 'crystalSpine':
      return [p.accent, p.accentAlt, p.glow];
    case 'abyssalFan':
      return [mixHex(p.rock[2], p.accent, 0.4), p.glow];
    case 'wakeFilament':
      return [p.accent, p.accentAlt, p.glow];
    case 'seaLily':
      return [mixHex(p.sand, p.accent, 0.35), p.glow];
    case 'brainCoral':
    case 'staghornCoral':
    case 'fanCoral':
    case 'tubeSponge':
    case 'anemone':
    case 'featherStar':
      return [p.accent, p.accentAlt, mixHex(p.accent, p.glow, 0.4)];
    default:
      return [p.accent, p.accentAlt];
  }
}

export { lerp };
