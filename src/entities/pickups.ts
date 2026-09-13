/**
 * Scavengeable objects on the seabed.
 *
 * Placement is deterministic: given the world seed and a chunk coordinate, the
 * same objects appear in the same places on every machine, so a save only has
 * to record which ones have been taken. Rendering is one instanced mesh per
 * item type, so a seabed littered with two hundred objects costs a couple of
 * dozen draw calls.
 */

import {
  DynamicDrawUsage,
  InstancedMesh,
  Matrix4,
  Object3D,
  Quaternion,
  Vector3,
  type BufferGeometry,
  type Material,
} from 'three';
import { MeshBuilder } from '../procedural/geo';
import { buildProp } from '../procedural/props';
import { Rng, hashInts, hashString } from '../core/rng';
import { itemById } from '../data/items/index';
import { REGIONS } from '../data/regions';
import type { TerrainField } from '../world/terrain';
import type { ItemDef, ItemStack } from '../items/itemTypes';
import { clamp01, lerp } from '../core/math';

const CHUNK = 128;
const CAPACITY = 40;

export interface Pickup {
  /** Stable id: chunk coordinate plus index. */
  id: string;
  itemId: string;
  x: number; y: number; z: number;
  yaw: number;
  scale: number;
  condition: number;
  variant: number;
  /** Set once the player has taken it. */
  taken: boolean;
  /** Requires this tool to collect. */
  tool?: string;
  toolTier: number;
  /** Distance to the submarine, refreshed each frame. */
  dist: number;
}

interface TypeRuntime {
  itemId: string;
  def: ItemDef;
  geometry: BufferGeometry | null;
  mesh: InstancedMesh | null;
  live: Pickup[];
}

const _m = new Matrix4();
const _q = new Quaternion();
const _p = new Vector3();
const _s = new Vector3();
const _e = new Vector3();

export class PickupSystem {
  readonly root = new Object3D();
  private types = new Map<string, TypeRuntime>();
  private chunks = new Map<string, Pickup[]>();
  private terrain: TerrainField;
  private material: Material;
  private worldSeed: number;
  /** Ids the player has already collected, persisted in the save. */
  taken = new Set<string>();
  /** Density multiplier from the quality profile. */
  densityScale = 1;
  /** Extra chance of rare finds, from modules and research. */
  luck = 0;

  readonly stats = { visible: 0, types: 0, chunks: 0 };

  constructor(terrain: TerrainField, material: Material, worldSeed: number) {
    this.terrain = terrain;
    this.material = material;
    this.worldSeed = worldSeed;
    this.root.name = 'pickups';
  }

  private key(cx: number, cz: number): string {
    return `${cx},${cz}`;
  }

  /** Deterministically generate the scatter for one chunk. */
  private generateChunk(cx: number, cz: number): Pickup[] {
    const out: Pickup[] = [];
    const ox = cx * CHUNK, oz = cz * CHUNK;
    const rng = new Rng(hashInts(cx, cz, this.worldSeed ^ 0x5ca7));
    const w = this.terrain.regionWeights(ox + CHUNK * 0.5, oz + CHUNK * 0.5);

    for (let ri = 0; ri < REGIONS.length; ri++) {
      const weight = w[ri];
      if (weight < 0.08) continue;
      const region = REGIONS[ri];
      // Roughly ten objects per chunk in a productive region.
      const count = Math.round(rng.range(5, 11) * weight * this.densityScale);
      for (let i = 0; i < count; i++) {
        const table = region.scatter;
        if (table.length === 0) continue;
        const entry = rng.pickWeighted(table, (e) => {
          const def = itemById(e.item);
          if (!def) return 0;
          // Rarer things are rarer, and luck nudges that.
          const rare = def.rarity === 'common' ? 1
            : def.rarity === 'uncommon' ? 0.55
              : def.rarity === 'rare' ? 0.2 : 0.07;
          return e.weight * (rare + this.luck * 0.1);
        });
        const def = itemById(entry.item);
        if (!def) continue;

        const x = ox + rng.next() * CHUNK;
        const z = oz + rng.next() * CHUNK;
        const h = this.terrain.height(x, z);
        if (h > -1.5) continue;
        const depth = -h;
        if (entry.depth && (depth < entry.depth[0] || depth > entry.depth[1])) continue;
        if (this.terrain.slope(x, z, 2.5) > 0.55) continue;

        const size = def.size ?? sizeFor(def);
        out.push({
          id: `${cx}:${cz}:${i}`,
          itemId: def.id,
          x, y: h + size * 0.22, z,
          yaw: rng.next() * Math.PI * 2,
          scale: rng.range(0.85, 1.2),
          condition: clamp01(rng.range(0.25, 1) + (def.hasCondition ? 0 : 1)),
          variant: rng.int(0, 3),
          taken: false,
          tool: def.tool,
          toolTier: def.toolTier ?? 0,
          dist: 9999,
        });
      }
    }
    return out;
  }

  private ensureType(itemId: string): TypeRuntime | null {
    let t = this.types.get(itemId);
    if (t) return t;
    const def = itemById(itemId);
    if (!def) return null;
    const b = new MeshBuilder();
    const rng = new Rng(hashString(itemId));
    const size = def.size ?? sizeFor(def);
    buildProp(b, def.model, {
      size,
      colors: def.colors ?? ['#a8a49c', '#7a7670'],
      rng,
      condition: 1,
      glow: def.category === 'data' ? 0.4 : 0,
    });
    const geometry = b.build();
    const mesh = new InstancedMesh(geometry, this.material, CAPACITY);
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    mesh.count = 0;
    mesh.frustumCulled = false;
    mesh.castShadow = true;
    mesh.name = `pickup:${itemId}`;
    this.root.add(mesh);
    t = { itemId, def, geometry, mesh, live: [] };
    this.types.set(itemId, t);
    this.stats.types = this.types.size;
    return t;
  }

  /** Stream pickups around the submarine. */
  update(pos: Vector3, elapsed: number): void {
    const ccx = Math.floor(pos.x / CHUNK);
    const ccz = Math.floor(pos.z / CHUNK);
    const R = 2;

    for (const t of this.types.values()) t.live.length = 0;

    for (let dz = -R; dz <= R; dz++) {
      for (let dx = -R; dx <= R; dx++) {
        const k = this.key(ccx + dx, ccz + dz);
        let list = this.chunks.get(k);
        if (!list) {
          list = this.generateChunk(ccx + dx, ccz + dz);
          for (const p of list) if (this.taken.has(p.id)) p.taken = true;
          this.chunks.set(k, list);
        }
        for (const p of list) {
          if (p.taken) continue;
          const ddx = p.x - pos.x, ddy = p.y - pos.y, ddz = p.z - pos.z;
          p.dist = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz);
          if (p.dist > 130) continue;
          const t = this.ensureType(p.itemId);
          if (t) t.live.push(p);
        }
      }
    }

    // Forget distant chunks so the map does not grow without bound.
    if (this.chunks.size > 120) {
      for (const [k] of this.chunks) {
        const [kx, kz] = k.split(',').map(Number);
        if (Math.abs(kx - ccx) > R + 2 || Math.abs(kz - ccz) > R + 2) this.chunks.delete(k);
        if (this.chunks.size <= 100) break;
      }
    }
    this.stats.chunks = this.chunks.size;

    let visible = 0;
    for (const t of this.types.values()) {
      const mesh = t.mesh!;
      const n = Math.min(t.live.length, CAPACITY);
      for (let i = 0; i < n; i++) {
        const p = t.live[i];
        // A slow bob and turn, so a metal thing on the seabed catches the eye.
        const bob = Math.sin(elapsed * 0.7 + p.yaw * 3) * 0.02;
        _p.set(p.x, p.y + bob, p.z);
        _e.set(0, p.yaw + elapsed * 0.06, 0);
        _q.setFromAxisAngle(UP, _e.y);
        _s.setScalar(p.scale);
        _m.compose(_p, _q, _s);
        mesh.setMatrixAt(i, _m);
      }
      mesh.count = n;
      mesh.visible = n > 0;
      if (n > 0) mesh.instanceMatrix.needsUpdate = true;
      visible += n;
    }
    this.stats.visible = visible;
  }

  /** The nearest collectable pickup within range. */
  nearest(pos: Vector3, radius: number): Pickup | null {
    let best: Pickup | null = null;
    let bestD = radius;
    for (const t of this.types.values()) {
      for (const p of t.live) {
        if (p.taken) continue;
        if (p.dist < bestD) { bestD = p.dist; best = p; }
      }
    }
    return best;
  }

  /** All live pickups within a radius, for the net and the dredge. */
  within(pos: Vector3, radius: number, out: Pickup[] = []): Pickup[] {
    out.length = 0;
    for (const t of this.types.values()) {
      for (const p of t.live) {
        if (!p.taken && p.dist <= radius) out.push(p);
      }
    }
    return out;
  }

  /** Mark a pickup collected and return the stack it yields. */
  collect(p: Pickup): ItemStack | null {
    if (p.taken) return null;
    const def = itemById(p.itemId);
    if (!def) return null;
    p.taken = true;
    this.taken.add(p.id);
    const stack: ItemStack = { itemId: p.itemId, count: 1, variant: p.variant };
    if (def.hasCondition) stack.condition = p.condition;
    if (def.needsIdentification) stack.identified = false;
    return stack;
  }

  serialise(): string[] {
    return [...this.taken];
  }

  restore(ids: string[]): void {
    this.taken = new Set(ids);
    this.chunks.clear();
  }

  clear(): void {
    this.chunks.clear();
    for (const t of this.types.values()) {
      t.live.length = 0;
      if (t.mesh) t.mesh.count = 0;
    }
  }

  dispose(): void {
    for (const t of this.types.values()) {
      t.geometry?.dispose();
      if (t.mesh) this.root.remove(t.mesh);
      t.mesh?.dispose();
    }
    this.types.clear();
  }
}

const UP = new Vector3(0, 1, 0);

/** A sensible world size for an item that did not specify one. */
function sizeFor(def: ItemDef): number {
  switch (def.category) {
    case 'mineral': return lerp(0.28, 0.55, clamp01(def.mass / 3));
    case 'scrap': return lerp(0.4, 0.9, clamp01(def.mass / 4));
    case 'organic': return lerp(0.3, 0.8, clamp01(def.mass / 3));
    case 'artifact': return lerp(0.35, 1.1, clamp01(def.mass / 6));
    case 'souvenir': return lerp(0.22, 0.7, clamp01(def.mass / 4));
    case 'component': return 0.45;
    case 'consumable': return 0.35;
    default: return 0.35;
  }
}
