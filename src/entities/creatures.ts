/**
 * The living ocean.
 *
 * One `InstancedMesh` per species, one geometry built lazily the first time a
 * species is needed, and a few hundred instances updated on the CPU with
 * steering behaviours. All body animation happens in the vertex shader, so the
 * per-frame CPU cost is a position update and a matrix compose per animal.
 *
 * Populations are derived, not scripted: the system continuously works out
 * what *should* be swimming near the submarine given the region, depth, time
 * of day and the player's equipment, and quietly spawns and despawns to match.
 */

import {
  Color,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Object3D,
  Quaternion,
  Vector3,
  type BufferGeometry,
  type Material,
} from 'three';
import { buildCreature, defaultAnatomy, type Anatomy } from '../procedural/creatureBuilder';
import { derivePalette, resolveAnatomy, type SpeciesDef } from '../data/speciesTypes';
import { SPECIES, speciesById } from '../data/species/index';
import { Rng, hashString } from '../core/rng';
import { clamp, clamp01, damp, lerp, shortestAngle, smoothstep } from '../core/math';
import type { TerrainField } from '../world/terrain';
import type { EnvSample } from '../world/environment';
import { bus } from '../core/events';

const MAX_PER_SPECIES = 90;

export type CreatureState =
  | 'wander' | 'flee' | 'approach' | 'hold' | 'feed' | 'dart' | 'hooked' | 'captured';

export interface Creature {
  id: number;
  sp: number;
  alive: boolean;
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  yaw: number; pitch: number;
  /** Length in metres. */
  size: number;
  /** Scale factor applied to the canonical geometry. */
  scale: number;
  phase: number;
  hue: number;
  state: CreatureState;
  timer: number;
  school: number;
  /** Wander target. */
  tx: number; ty: number; tz: number;
  /** Home point for territorial and sessile animals. */
  hx: number; hy: number; hz: number;
  /** 0..1 how alarmed it is. */
  alarm: number;
  /** Set when the player has this on a line or in a beam. */
  engaged: boolean;
  /** Distance to the submarine, cached each frame. */
  dist: number;
}

interface SpeciesRuntime {
  def: SpeciesDef;
  index: number;
  geometry: BufferGeometry | null;
  mesh: InstancedMesh | null;
  /** Canonical model length in metres. */
  baseLength: number;
  instances: Creature[];
  live: number;
  aPhase: InstancedBufferAttribute | null;
  aSpeed: InstancedBufferAttribute | null;
  aAnim: InstancedBufferAttribute | null;
  aHue: InstancedBufferAttribute | null;
  aGlow: InstancedBufferAttribute | null;
  dirty: boolean;
}

interface School {
  id: number;
  sp: number;
  cx: number; cy: number; cz: number;
  tx: number; ty: number; tz: number;
  members: number;
  timer: number;
}

const _m = new Matrix4();
const _q = new Quaternion();
const _pos = new Vector3();
const _scl = new Vector3();
const _up = new Vector3(0, 1, 0);
const _fwd = new Vector3();

export class CreatureSystem {
  readonly root = new Object3D();
  private runtimes: SpeciesRuntime[] = [];
  private byId = new Map<string, SpeciesRuntime>();
  private schools: School[] = [];
  private nextSchool = 1;
  private nextId = 1;
  private material: Material;
  private terrain: TerrainField;
  private rng = new Rng(0xbeef);
  private spawnTimer = 0;
  private repopTimer = 0;

  /** Multiplier on all population targets, from the quality profile. */
  densityScale = 1;
  /** Total live creatures, for the debug overlay. */
  readonly stats = { live: 0, species: 0, schools: 0, drawn: 0 };

  /** Species the player has already discovered; drives the discovery event. */
  discovered = new Set<string>();

  constructor(terrain: TerrainField, material: Material) {
    this.terrain = terrain;
    this.material = material;
    this.root.name = 'creatures';
    for (let i = 0; i < SPECIES.length; i++) {
      const rt: SpeciesRuntime = {
        def: SPECIES[i], index: i, geometry: null, mesh: null,
        baseLength: ((SPECIES[i].size[0] + SPECIES[i].size[1]) / 2) / 100,
        instances: [], live: 0,
        aPhase: null, aSpeed: null, aAnim: null, aHue: null, aGlow: null, dirty: false,
      };
      this.runtimes.push(rt);
      this.byId.set(SPECIES[i].id, rt);
    }
  }

  /** Build the mesh for a species on first use. */
  private ensureMesh(rt: SpeciesRuntime): void {
    if (rt.mesh) return;
    const def = rt.def;
    const anatomy: Anatomy = resolveAnatomy(def, defaultAnatomy());
    const pal = derivePalette(def);
    const rng = new Rng(hashString(def.id));
    // Big animals get more detail; a shoal of sprats does not need any.
    anatomy.detail = rt.baseLength > 3 ? 1.2 : rt.baseLength > 0.5 ? 1 : 0.65;
    anatomy.glow = anatomy.glow ?? 0;
    const geo = buildCreature(anatomy, pal, rt.baseLength, rng);
    rt.geometry = geo;

    const cap = capacityFor(def);
    const mesh = new InstancedMesh(geo, this.material, cap);
    mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    mesh.count = 0;
    mesh.frustumCulled = false;
    mesh.name = `creature:${def.id}`;
    mesh.castShadow = rt.baseLength > 1.2;

    const mk = (n: number) => {
      const a = new InstancedBufferAttribute(new Float32Array(cap), n);
      a.setUsage(DynamicDrawUsage);
      return a;
    };
    rt.aPhase = mk(1); rt.aSpeed = mk(1); rt.aAnim = mk(1); rt.aHue = mk(1); rt.aGlow = mk(1);
    geo.setAttribute('aPhase', rt.aPhase);
    geo.setAttribute('aSpeed', rt.aSpeed);
    geo.setAttribute('aAnimMode', rt.aAnim);
    geo.setAttribute('aHue', rt.aHue);
    geo.setAttribute('aGlow', rt.aGlow);

    rt.mesh = mesh;
    this.root.add(mesh);
    this.stats.species++;
  }

  /** All live creatures within a radius, cheapest-first ordering not guaranteed. */
  query(pos: Vector3, radius: number, out: Creature[] = []): Creature[] {
    out.length = 0;
    const r2 = radius * radius;
    for (const rt of this.runtimes) {
      if (rt.live === 0) continue;
      for (let i = 0; i < rt.instances.length; i++) {
        const c = rt.instances[i];
        if (!c.alive) continue;
        const dx = c.x - pos.x, dy = c.y - pos.y, dz = c.z - pos.z;
        if (dx * dx + dy * dy + dz * dz <= r2) out.push(c);
      }
    }
    return out;
  }

  /** The nearest live creature to a point, optionally filtered. */
  nearest(pos: Vector3, radius: number, filter?: (c: Creature, d: SpeciesDef) => boolean): Creature | null {
    let best: Creature | null = null;
    let bestD = radius * radius;
    for (const rt of this.runtimes) {
      if (rt.live === 0) continue;
      for (let i = 0; i < rt.instances.length; i++) {
        const c = rt.instances[i];
        if (!c.alive) continue;
        if (filter && !filter(c, rt.def)) continue;
        const dx = c.x - pos.x, dy = c.y - pos.y, dz = c.z - pos.z;
        const d = dx * dx + dy * dy + dz * dz;
        if (d < bestD) { bestD = d; best = c; }
      }
    }
    return best;
  }

  definitionOf(c: Creature): SpeciesDef {
    return this.runtimes[c.sp].def;
  }

  /** Remove a creature (caught, eaten, despawned). */
  remove(c: Creature): void {
    if (!c.alive) return;
    c.alive = false;
    const rt = this.runtimes[c.sp];
    rt.live--;
    rt.dirty = true;
    if (c.school >= 0) {
      const s = this.schools.find((x) => x.id === c.school);
      if (s) s.members--;
    }
  }

  /** Spawn one creature of a species at a position. Returns null if at capacity. */
  spawn(speciesId: string, x: number, y: number, z: number, schoolId = -1): Creature | null {
    const rt = this.byId.get(speciesId);
    if (!rt) return null;
    this.ensureMesh(rt);
    const cap = capacityFor(rt.def);
    let slot: Creature | null = null;
    for (let i = 0; i < rt.instances.length; i++) {
      if (!rt.instances[i].alive) { slot = rt.instances[i]; break; }
    }
    if (!slot) {
      if (rt.instances.length >= cap) return null;
      slot = makeCreature(this.nextId++, rt.index);
      rt.instances.push(slot);
    }
    const def = rt.def;
    const r = this.rng;
    const sizeCm = r.range(def.size[0], def.size[1]);
    slot.alive = true;
    slot.x = x; slot.y = y; slot.z = z;
    slot.hx = x; slot.hy = y; slot.hz = z;
    slot.tx = x; slot.ty = y; slot.tz = z;
    slot.vx = r.signed(0.3); slot.vy = r.signed(0.1); slot.vz = r.signed(0.3);
    slot.yaw = r.next() * Math.PI * 2;
    slot.pitch = 0;
    slot.size = sizeCm / 100;
    slot.scale = slot.size / Math.max(0.02, rt.baseLength);
    slot.phase = r.next() * 100;
    slot.hue = def.variants ? Math.round(r.next() * def.variants) / Math.max(1, def.variants) * 0.14 - 0.07 : r.signed(0.02);
    slot.state = def.behaviour === 'sessile' ? 'hold' : 'wander';
    slot.timer = r.range(1, 5);
    slot.school = schoolId;
    slot.alarm = 0;
    slot.engaged = false;
    slot.dist = 9999;
    rt.live++;
    rt.dirty = true;

    // Per-instance shader parameters, written once.
    const i = rt.instances.indexOf(slot);
    if (rt.aPhase) {
      rt.aPhase.setX(i, slot.phase);
      rt.aSpeed!.setX(i, lerp(0.7, 1.6, r.next()) * animSpeedFor(def));
      rt.aAnim!.setX(i, def.anim);
      rt.aHue!.setX(i, slot.hue);
      rt.aGlow!.setX(i, 1);
      rt.aPhase.needsUpdate = true;
      rt.aSpeed!.needsUpdate = true;
      rt.aAnim!.needsUpdate = true;
      rt.aHue!.needsUpdate = true;
      rt.aGlow!.needsUpdate = true;
    }
    return slot;
  }

  /** Spawn a school around a centre point. */
  spawnSchool(speciesId: string, x: number, y: number, z: number): void {
    const rt = this.byId.get(speciesId);
    if (!rt || !rt.def.school) return;
    const [lo, hi] = rt.def.school;
    const n = Math.max(2, Math.round(this.rng.range(lo, hi) * this.densityScale));
    const id = this.nextSchool++;
    const school: School = {
      id, sp: rt.index, cx: x, cy: y, cz: z, tx: x, ty: y, tz: z, members: 0, timer: 0,
    };
    const spread = Math.max(2, Math.cbrt(n) * rt.baseLength * 2.6);
    for (let i = 0; i < n; i++) {
      const c = this.spawn(
        speciesId,
        x + this.rng.signed(spread),
        y + this.rng.signed(spread * 0.45),
        z + this.rng.signed(spread),
        id,
      );
      if (!c) break;
      school.members++;
    }
    if (school.members > 0) this.schools.push(school);
  }

  /**
   * Keep the population around the submarine appropriate to where it is.
   */
  private repopulate(
    sub: Vector3, env: EnvSample, phase: string, dt: number, lightOn: boolean,
  ): void {
    this.repopTimer -= dt;
    if (this.repopTimer > 0) return;
    this.repopTimer = 1.4;

    const depth = Math.max(0, -sub.y);
    const regionId = env.regionId;
    const candidates: SpeciesDef[] = [];
    let totalWeight = 0;
    for (const def of SPECIES) {
      if (!def.regions.includes(regionId)) continue;
      if (depth < def.depth[0] - 12 || depth > def.depth[1] + 12) continue;
      if (def.active && !def.active.includes('any') && !def.active.includes(phase as never)) continue;
      if (def.requires && !this.unlocked.has(def.requires)) continue;
      const w = (def.weight ?? 4) * rarityWeight(def.rarity);
      if (w <= 0) continue;
      candidates.push(def);
      totalWeight += w;
    }
    if (candidates.length === 0) return;

    // A budget of animals, scaled by the region's productivity.
    const budget = Math.round(190 * env.life * this.densityScale);
    let live = 0;
    for (const rt of this.runtimes) live += rt.live;
    this.stats.live = live;
    if (live >= budget) return;

    // Spawn one species per tick, chosen by weight, in a shell around the boat.
    const pick = this.rng.pickWeighted(candidates, (d) => (d.weight ?? 4) * rarityWeight(d.rarity));
    const rt = this.byId.get(pick.id)!;
    const perSpeciesCap = Math.max(1, Math.round(
      (pick.school ? pick.school[1] : 6) * this.densityScale * (pick.group === 'leviathan' ? 0.34 : 1),
    ));
    if (rt.live >= Math.min(perSpeciesCap, capacityFor(pick))) return;

    const a = this.rng.next() * Math.PI * 2;
    const dist = this.rng.range(46, 92);
    const x = sub.x + Math.cos(a) * dist;
    const z = sub.z + Math.sin(a) * dist;
    const seabed = this.terrain.height(x, z);
    // Nothing lives above the waterline, and a spawn point on dry land is a
    // spawn point wasted.
    if (seabed > -1.5) return;
    let y: number;
    switch (pick.behaviour) {
      case 'sessile':
      case 'burrower':
      case 'scavenger':
        y = seabed + this.rng.range(0.2, 2.4);
        break;
      case 'drifter':
      case 'migratory':
        y = clamp(sub.y + this.rng.signed(28), seabed + 4, -2);
        break;
      default:
        y = clamp(sub.y + this.rng.signed(20), seabed + 1.2, -2);
    }
    if (-y < pick.depth[0] || -y > pick.depth[1]) y = -clamp(-y, pick.depth[0], pick.depth[1]);
    if (y < seabed + 0.6) y = seabed + 0.6;
    if (y > -1.2) y = -1.2;

    // Light-attracted species prefer to appear where the lamps are pointing.
    if (pick.behaviour === 'lightAttracted' && lightOn) {
      const t = 0.45;
      const nx = lerp(x, sub.x, t), nz = lerp(z, sub.z, t);
      if (this.terrain.height(nx, nz) < y - 1) {
        if (pick.school) this.spawnSchool(pick.id, nx, y, nz);
        else this.spawn(pick.id, nx, y, nz);
        return;
      }
    }

    if (pick.school) this.spawnSchool(pick.id, x, y, z);
    else this.spawn(pick.id, x, y, z);
  }

  /** Progression flags that gate rare species. */
  unlocked = new Set<string>();

  /**
   * Step every creature.
   */
  update(
    dt: number, sub: Vector3, subVel: Vector3, env: EnvSample,
    phase: string, lightOn: boolean, lightRange: number, noise: number,
  ): void {
    this.repopulate(sub, env, phase, dt, lightOn);

    // Schools drift toward a slowly-changing target.
    for (let i = this.schools.length - 1; i >= 0; i--) {
      const s = this.schools[i];
      if (s.members <= 0) { this.schools.splice(i, 1); continue; }
      s.timer -= dt;
      if (s.timer <= 0) {
        s.timer = this.rng.range(4, 11);
        const seabed = this.terrain.height(s.cx, s.cz);
        s.tx = s.cx + this.rng.signed(34);
        s.tz = s.cz + this.rng.signed(34);
        s.ty = clamp(s.cy + this.rng.signed(10), seabed + 3, -3);
      }
      s.cx = damp(s.cx, s.tx, 0.35, dt);
      s.cy = damp(s.cy, s.ty, 0.35, dt);
      s.cz = damp(s.cz, s.tz, 0.35, dt);
    }
    this.stats.schools = this.schools.length;

    let live = 0;
    let drawn = 0;
    const despawn2 = 165 * 165;

    for (const rt of this.runtimes) {
      if (!rt.mesh) continue;
      const def = rt.def;
      const mesh = rt.mesh;
      let n = 0;
      for (let i = 0; i < rt.instances.length; i++) {
        const c = rt.instances[i];
        if (!c.alive) continue;

        const dx = c.x - sub.x, dy = c.y - sub.y, dz = c.z - sub.z;
        const d2 = dx * dx + dy * dy + dz * dz;
        c.dist = Math.sqrt(d2);
        if (d2 > despawn2 && !c.engaged) {
          this.remove(c);
          continue;
        }

        this.steer(c, def, rt, dt, sub, subVel, lightOn, lightRange, noise);

        // Write the instance transform.
        _pos.set(c.x, c.y, c.z);
        _fwd.set(
          Math.sin(c.yaw) * Math.cos(c.pitch),
          Math.sin(c.pitch),
          Math.cos(c.yaw) * Math.cos(c.pitch),
        );
        _m.lookAt(_zero.set(0, 0, 0), _fwd, _up);
        _q.setFromRotationMatrix(_m);
        _scl.setScalar(c.scale);
        _m.compose(_pos, _q, _scl);
        mesh.setMatrixAt(n, _m);
        if (rt.aPhase) rt.aGlow!.setX(n, c.engaged ? 2.2 : 1);
        n++;
        live++;
      }
      mesh.count = n;
      drawn += n > 0 ? 1 : 0;
      if (n > 0) {
        mesh.instanceMatrix.needsUpdate = true;
        if (rt.aGlow) rt.aGlow.needsUpdate = true;
      }
      mesh.visible = n > 0;
    }
    this.stats.live = live;
    this.stats.drawn = drawn;
  }

  /** Steering for a single animal. */
  private steer(
    c: Creature, def: SpeciesDef, rt: SpeciesRuntime, dt: number,
    sub: Vector3, subVel: Vector3, lightOn: boolean, lightRange: number, noise: number,
  ): void {
    const r = this.rng;
    const speed = def.speed;
    const agility = def.agility;
    const seabed = this.terrain.height(c.x, c.z);

    // --- reaction to the submarine ---------------------------------------
    const detect = lerp(10, 40, def.wariness) * noise;
    const near = c.dist < detect;
    if (near && !c.engaged) {
      const closing = subVel.length() > 1.6;
      switch (def.behaviour) {
        case 'curious':
        case 'follower':
          if (c.state !== 'flee') c.state = 'approach';
          break;
        case 'lightAttracted':
          if (lightOn && c.dist < lightRange * 1.6) c.state = 'approach';
          break;
        case 'lightShy':
          if (lightOn && c.dist < lightRange * 1.3) c.state = 'flee';
          break;
        case 'sessile':
          break;
        case 'ambush':
        case 'burrower':
          if (c.dist < 8) c.state = 'dart';
          break;
        default:
          if (def.wariness > 0.05 && c.dist < detect * (closing ? 1 : 0.6)) c.state = 'flee';
      }
      c.alarm = clamp01(c.alarm + dt * (def.wariness * 2.4));
    } else {
      c.alarm = Math.max(0, c.alarm - dt * 0.55);
      if (c.state === 'flee' && c.alarm < 0.12) c.state = 'wander';
    }

    // --- pick a target ---------------------------------------------------
    c.timer -= dt;
    let targetSpeed = speed;

    switch (c.state) {
      case 'hold': {
        // Sessile: sit on the seabed, no translation.
        c.y = damp(c.y, seabed + c.size * 0.3, 3, dt);
        c.vx *= Math.exp(-4 * dt);
        c.vz *= Math.exp(-4 * dt);
        c.vy *= Math.exp(-4 * dt);
        c.yaw += dt * 0.08;
        return;
      }
      case 'flee': {
        const dx = c.x - sub.x, dy = c.y - sub.y, dz = c.z - sub.z;
        const len = Math.max(0.001, Math.hypot(dx, dy, dz));
        c.tx = c.x + (dx / len) * 26;
        c.ty = c.y + (dy / len) * 10;
        c.tz = c.z + (dz / len) * 26;
        targetSpeed = speed * 1.85;
        break;
      }
      case 'approach': {
        // Stand off at a polite distance rather than colliding with the hull.
        const standoff = 5 + c.size * 2.2;
        const dx = sub.x - c.x, dy = sub.y - c.y, dz = sub.z - c.z;
        const len = Math.max(0.001, Math.hypot(dx, dy, dz));
        const k = (len - standoff) / len;
        c.tx = c.x + dx * k;
        c.ty = c.y + dy * k;
        c.tz = c.z + dz * k;
        targetSpeed = speed * 0.85;
        if (c.dist > 60) c.state = 'wander';
        break;
      }
      case 'dart': {
        if (c.timer <= 0) {
          c.timer = r.range(2, 6);
          c.state = 'wander';
        }
        targetSpeed = speed * 2.4;
        break;
      }
      case 'wander':
      case 'feed':
      default: {
        if (c.timer <= 0) {
          c.timer = r.range(2.5, 7);
          const range = def.behaviour === 'territorial' ? 9 : 26;
          const ox = def.behaviour === 'territorial' ? c.hx : c.x;
          const oy = def.behaviour === 'territorial' ? c.hy : c.y;
          const oz = def.behaviour === 'territorial' ? c.hz : c.z;
          c.tx = ox + r.signed(range);
          c.tz = oz + r.signed(range);
          let floor = this.terrain.height(c.tx, c.tz);
          // Never pick a destination on dry land, and if one comes up, head
          // back the way we came instead.
          if (floor > -2.5) {
            c.tx = c.x - (c.tx - c.x);
            c.tz = c.z - (c.tz - c.z);
            floor = this.terrain.height(c.tx, c.tz);
            if (floor > -2.5) { c.tx = c.hx; c.tz = c.hz; floor = this.terrain.height(c.tx, c.tz); }
          }
          const prefersFloor = def.behaviour === 'scavenger' || def.behaviour === 'burrower';
          const ceiling = -1.5;
          const floorY = Math.min(ceiling - 0.4, floor + c.size + 0.8);
          c.ty = prefersFloor
            ? Math.min(ceiling - 0.4, floor + r.range(0.4, 2.6))
            : clamp(oy + r.signed(9), floorY, ceiling);
          const dmin = -def.depth[1], dmax = Math.min(ceiling, -def.depth[0]);
          c.ty = clamp(c.ty, dmin, Math.max(dmin, dmax));
        }
        targetSpeed = speed * (def.behaviour === 'migratory' ? 1.25 : 0.75);
      }
    }

    // --- schooling --------------------------------------------------------
    let sx = 0, sy = 0, sz = 0;
    if (c.school >= 0) {
      const school = this.schools.find((s) => s.id === c.school);
      if (school && c.state !== 'flee') {
        // Cohesion toward the school centre, with separation from neighbours.
        sx = school.cx - c.x;
        sy = school.cy - c.y;
        sz = school.cz - c.z;
        const d = Math.max(0.001, Math.hypot(sx, sy, sz));
        const pull = smoothstep(2, 16, d) * 1.4;
        sx = (sx / d) * pull; sy = (sy / d) * pull; sz = (sz / d) * pull;
        // Sample a handful of neighbours rather than all of them.
        const list = rt.instances;
        const step = Math.max(1, Math.floor(list.length / 8));
        for (let k = 0; k < list.length; k += step) {
          const o = list[k];
          if (o === c || !o.alive || o.school !== c.school) continue;
          const ox = c.x - o.x, oy = c.y - o.y, oz = c.z - o.z;
          const dd = ox * ox + oy * oy + oz * oz;
          const want = c.size * 2.2;
          if (dd < want * want && dd > 1e-5) {
            const inv = 1 / Math.sqrt(dd);
            sx += ox * inv * 1.9;
            sy += oy * inv * 1.9;
            sz += oz * inv * 1.9;
          }
        }
        c.tx = c.x + sx * 8;
        c.ty = c.y + sy * 6;
        c.tz = c.z + sz * 8;
        targetSpeed = speed * 0.95;
      }
    }

    // --- move toward the target -------------------------------------------
    let dx = c.tx - c.x, dy = c.ty - c.y, dz = c.tz - c.z;
    const dist = Math.max(0.001, Math.hypot(dx, dy, dz));
    dx /= dist; dy /= dist; dz /= dist;


    // Avoid the seabed, and never breach the surface.
    const clearance = c.y - seabed;
    const wantClear = c.size * 0.7 + 0.6;
    if (clearance < wantClear) dy += (wantClear - clearance) * 0.9;
    if (c.y > -1.2) dy -= 2.4;
    // If the ground here is above water, this animal has strayed onto the
    // shore: steer it back downhill until it is in the sea again.
    if (seabed > -2) {
      const e = 3;
      const gx = this.terrain.height(c.x + e, c.z) - this.terrain.height(c.x - e, c.z);
      const gz = this.terrain.height(c.x, c.z + e) - this.terrain.height(c.x, c.z - e);
      const gl = Math.hypot(gx, gz) || 1;
      dx = -gx / gl * 2;
      dz = -gz / gl * 2;
      dy = -1;
      targetSpeed = speed * 1.6;
    }

    const accel = agility * 3.2;
    c.vx = damp(c.vx, dx * targetSpeed, accel, dt);
    c.vy = damp(c.vy, dy * targetSpeed * 0.7, accel, dt);
    c.vz = damp(c.vz, dz * targetSpeed, accel, dt);

    c.x += c.vx * dt;
    c.y += c.vy * dt;
    c.z += c.vz * dt;

    // Face the direction of travel.
    const hs = Math.hypot(c.vx, c.vz);
    if (hs > 0.02) {
      const wantYaw = Math.atan2(c.vx, c.vz);
      c.yaw += shortestAngle(c.yaw, wantYaw) * clamp01(dt * agility * 4.5);
      const wantPitch = clamp(Math.atan2(c.vy, hs), -0.8, 0.8);
      c.pitch = damp(c.pitch, wantPitch, 4, dt);
    }
  }

  /** Register a discovery; returns true if this is the first sighting. */
  observe(speciesId: string): boolean {
    if (this.discovered.has(speciesId)) return false;
    this.discovered.add(speciesId);
    const def = speciesById(speciesId);
    if (def) {
      bus.emit('discovery', {
        kind: 'species', id: def.id, name: def.name,
        subtitle: def.latin, first: true,
      });
    }
    return true;
  }

  clear(): void {
    for (const rt of this.runtimes) {
      for (const c of rt.instances) c.alive = false;
      rt.live = 0;
      if (rt.mesh) rt.mesh.count = 0;
    }
    this.schools.length = 0;
  }

  dispose(): void {
    for (const rt of this.runtimes) {
      rt.geometry?.dispose();
      if (rt.mesh) this.root.remove(rt.mesh);
      rt.mesh?.dispose();
    }
  }
}

const _zero = new Vector3();

function makeCreature(id: number, sp: number): Creature {
  return {
    id, sp, alive: false,
    x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, yaw: 0, pitch: 0,
    size: 1, scale: 1, phase: 0, hue: 0,
    state: 'wander', timer: 0, school: -1,
    tx: 0, ty: 0, tz: 0, hx: 0, hy: 0, hz: 0,
    alarm: 0, engaged: false, dist: 9999,
  };
}

function capacityFor(def: SpeciesDef): number {
  if (def.group === 'leviathan') return 3;
  if (def.school) return Math.min(MAX_PER_SPECIES, def.school[1] + 8);
  if (def.behaviour === 'sessile') return 26;
  return 14;
}

function rarityWeight(r: string): number {
  switch (r) {
    case 'common': return 1;
    case 'uncommon': return 0.5;
    case 'rare': return 0.18;
    case 'exotic': return 0.06;
    case 'legendary': return 0.02;
    case 'mythic': return 0.004;
    default: return 1;
  }
}

function animSpeedFor(def: SpeciesDef): number {
  // Small animals beat faster; leviathans move at a stately rate.
  const l = (def.size[0] + def.size[1]) / 200;
  return clamp(1.5 / Math.pow(Math.max(0.05, l), 0.34), 0.35, 3.4);
}

export { Color };
