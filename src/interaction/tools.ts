/**
 * Tools.
 *
 * Nine ways of getting something out of the ocean, each with its own feel:
 *
 *   rod      a real fight, with tension, runs and a line that breaks
 *   net      one sweep, good for shoals, useless on anything large
 *   trap     left behind and collected later, works while you are elsewhere
 *   lure     draws light-seeking animals to you instead of chasing them
 *   sampler  the only way to take a jellyfish without destroying it
 *   claw     picks objects off the seabed at arm's length
 *   drill    the only way through hard mineral
 *   scanner  earns research rather than cargo, and works on anything
 *   camera   earns the most of all, and cannot be rushed
 *   drone    reaches into places the boat cannot
 *
 * The tool system owns targeting, cooldowns, energy and the fishing fight; the
 * individual outcomes are raised as events so the economy, catalogue, quests
 * and audio can all react without knowing about each other.
 */

import { Vector3 } from 'three';
import type { Submarine } from '../submarine/submarine';
import type { CreatureSystem, Creature } from '../entities/creatures';
import type { PickupSystem, Pickup } from '../entities/pickups';
import type { Inventory } from '../items/inventory';
import type { GameState } from '../core/state';
import type { SpeciesDef } from '../data/speciesTypes';
import { bus, toast } from '../core/events';
import { itemById } from '../data/items/index';
import { speciesById } from '../data/species/index';
import { clamp, clamp01, damp, lerp } from '../core/math';
import { Rng } from '../core/rng';

export type ToolId =
  | 'rod' | 'net' | 'trap' | 'lure' | 'sampler' | 'claw' | 'drill'
  | 'scanner' | 'camera' | 'drone';

export interface ToolDef {
  id: ToolId;
  name: string;
  short: string;
  /** Module id that must be installed. */
  module: string;
  /** Working range in metres. */
  range: number;
  /** Energy cost per use, or per second for held tools. */
  energy: number;
  /** Seconds before it can be used again. */
  cooldown: number;
  /** True for tools that are held down rather than triggered. */
  held: boolean;
  description: string;
}

export const TOOLS: Record<ToolId, ToolDef> = {
  rod: {
    id: 'rod', name: 'Line and Rod', short: 'ROD', module: 'tool_rod',
    range: 26, energy: 0.4, cooldown: 0.6, held: false,
    description: 'Cast at a single fish and fight it. The oldest method and still the best one.',
  },
  net: {
    id: 'net', name: 'Sweep Net', short: 'NET', module: 'tool_net',
    range: 16, energy: 2.4, cooldown: 4, held: false,
    description: 'One sweep ahead of the boat. Takes several small fish at once and lets big ones through.',
  },
  trap: {
    id: 'trap', name: 'Baited Trap', short: 'TRAP', module: 'tool_trap',
    range: 8, energy: 0.6, cooldown: 1.5, held: false,
    description: 'Drop it, bait it, come back. It fishes while you do something else.',
  },
  lure: {
    id: 'lure', name: 'Light Lure', short: 'LURE', module: 'tool_lure',
    range: 32, energy: 1.6, cooldown: 0, held: true,
    description: 'A cold blue light on a boom. Nothing in the dark can resist looking at it.',
  },
  sampler: {
    id: 'sampler', name: 'Specimen Sampler', short: 'SAMP', module: 'tool_sampler',
    range: 9, energy: 1.2, cooldown: 2.2, held: false,
    description: 'A gentle suction jar. The only way to take something soft-bodied intact.',
  },
  claw: {
    id: 'claw', name: 'Manipulator Claw', short: 'CLAW', module: 'tool_claw',
    range: 7, energy: 0.9, cooldown: 0.7, held: false,
    description: 'Picks things up. Unglamorous, and you will use it more than anything else.',
  },
  drill: {
    id: 'drill', name: 'Core Drill', short: 'DRILL', module: 'tool_drill',
    range: 6, energy: 3.5, cooldown: 0.2, held: true,
    description: 'For everything that is part of the seabed rather than lying on it.',
  },
  scanner: {
    id: 'scanner', name: 'Research Scanner', short: 'SCAN', module: 'tool_scanner',
    range: 34, energy: 1.4, cooldown: 0.5, held: true,
    description: 'Hold on a subject to build a profile. Earns research instead of cargo.',
  },
  camera: {
    id: 'camera', name: 'Deep Camera', short: 'CAM', module: 'tool_camera',
    range: 60, energy: 0.8, cooldown: 1.2, held: false,
    description:
      'Scored on framing, distance and light. A good photograph of a leviathan is worth more ' +
      'than a hold full of anything.',
  },
  drone: {
    id: 'drone', name: 'Tethered Drone', short: 'DRONE', module: 'tool_drone',
    range: 45, energy: 2.6, cooldown: 6, held: false,
    description: 'Sent out on a tether to reach what the boat cannot, and to take what it must not crush.',
  },
};

export type FightPhase = 'idle' | 'casting' | 'waiting' | 'strike' | 'fighting' | 'landed' | 'lost';

export interface FishingState {
  phase: FightPhase;
  /** The creature on the line. */
  target: Creature | null;
  species: SpeciesDef | null;
  /** 0..1 line tension; 1 breaks. */
  tension: number;
  /** Metres of line out. Reaches zero to land the fish. */
  distance: number;
  startDistance: number;
  /** 0..1 how hard the fish is currently pulling. */
  pull: number;
  /** Seconds left in the current phase. */
  timer: number;
  /** True while the player is reeling. */
  reeling: boolean;
  /** Set while the strike window is open. */
  strikeWindow: boolean;
  /** Where the line ends, for the visual. */
  tip: Vector3;
}

export interface DeployedTrap {
  id: number;
  x: number; y: number; z: number;
  bait: string | null;
  /** Seconds it has been soaking. */
  soak: number;
  /** Contents so far. */
  catches: { speciesId: string; sizeCm: number; quality: number }[];
  full: boolean;
}

export interface ToolContext {
  sub: Submarine;
  creatures: CreatureSystem;
  pickups: PickupSystem;
  inventory: Inventory;
  state: GameState;
  /** Forward direction the player is aiming, in world space. */
  aim: Vector3;
  /** Camera position, for photograph scoring. */
  eye: Vector3;
  dt: number;
  /** True while the primary action is held. */
  using: boolean;
  /** True on the frame the primary action was pressed. */
  pressed: boolean;
  /** True on the frame it was released. */
  released: boolean;
}

const _v = new Vector3();
const _v2 = new Vector3();
const _aimPoint = new Vector3();

export class ToolSystem {
  /** Tools the boat currently carries, in cycle order. */
  available: ToolId[] = ['claw'];
  activeIndex = 0;
  cooldown = 0;
  /** 0..1 progress of a held tool. */
  progress = 0;
  /** What the active tool is currently pointed at. */
  targetCreature: Creature | null = null;
  targetPickup: Pickup | null = null;
  /** Human-readable prompt for the HUD. */
  prompt = '';

  readonly fishing: FishingState = {
    phase: 'idle', target: null, species: null, tension: 0, distance: 0,
    startDistance: 0, pull: 0, timer: 0, reeling: false, strikeWindow: false,
    tip: new Vector3(),
  };

  traps: DeployedTrap[] = [];
  private nextTrapId = 1;
  private rng = new Rng(0x70015);
  /** Set while the lure is lit, for the creature system to read. */
  lureActive = false;
  /** Position of the drone while deployed, or null. */
  drone: { pos: Vector3; target: Vector3; out: number; returning: boolean } | null = null;

  get active(): ToolId {
    return this.available[this.activeIndex] ?? 'claw';
  }

  get activeDef(): ToolDef {
    return TOOLS[this.active];
  }

  setAvailable(tools: ToolId[]): void {
    this.available = tools.length ? tools : ['claw'];
    this.activeIndex = Math.min(this.activeIndex, this.available.length - 1);
  }

  next(): void {
    this.activeIndex = (this.activeIndex + 1) % this.available.length;
    this.cancel();
  }

  prev(): void {
    this.activeIndex = (this.activeIndex - 1 + this.available.length) % this.available.length;
    this.cancel();
  }

  select(tool: ToolId): void {
    const i = this.available.indexOf(tool);
    if (i >= 0) {
      this.activeIndex = i;
      this.cancel();
    }
  }

  /** Abandon whatever the current tool was doing. */
  cancel(): void {
    if (this.fishing.phase !== 'idle') this.endFight('lost', 'Line cut');
    this.progress = 0;
    this.lureActive = false;
  }

  update(ctx: ToolContext): void {
    const dt = ctx.dt;
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.updateTraps(ctx, dt);
    this.updateDrone(ctx, dt);

    // Aim point: a metre-accurate spot in front of the boat.
    const def = this.activeDef;
    _aimPoint.copy(ctx.sub.position).addScaledVector(ctx.aim, def.range * 0.5);

    this.acquireTarget(ctx, def);

    if (this.fishing.phase !== 'idle') {
      this.updateFight(ctx, dt);
      return;
    }

    if (def.held) this.updateHeldTool(ctx, def, dt);
    else if (ctx.pressed) this.triggerTool(ctx, def);
    else this.progress = damp(this.progress, 0, 6, dt);
  }

  // --- targeting -------------------------------------------------------

  private acquireTarget(ctx: ToolContext, def: ToolDef): void {
    this.targetCreature = null;
    this.targetPickup = null;
    this.prompt = '';

    const wantsCreature = def.id === 'rod' || def.id === 'net' || def.id === 'sampler' ||
      def.id === 'scanner' || def.id === 'camera' || def.id === 'drone';
    const wantsPickup = def.id === 'claw' || def.id === 'drill' || def.id === 'scanner' ||
      def.id === 'drone';

    if (wantsCreature) {
      // Prefer whatever is closest to the aim ray rather than closest in space.
      let best: Creature | null = null;
      let bestScore = -1;
      const list = ctx.creatures.query(ctx.sub.position, def.range);
      for (const c of list) {
        _v.set(c.x - ctx.sub.position.x, c.y - ctx.sub.position.y, c.z - ctx.sub.position.z);
        const d = _v.length();
        if (d < 0.01) continue;
        _v.divideScalar(d);
        const align = _v.dot(ctx.aim);
        if (align < 0.55) continue;
        const cdef = ctx.creatures.definitionOf(c);
        if (!canTarget(def.id, cdef)) continue;
        const score = align * 2 - d / def.range;
        if (score > bestScore) { bestScore = score; best = c; }
      }
      this.targetCreature = best;
    }

    if (wantsPickup && !this.targetCreature) {
      const p = ctx.pickups.nearest(ctx.sub.position, def.range);
      if (p) {
        const needsDrill = (p.toolTier ?? 0) > 0;
        if (def.id === 'drill' ? needsDrill : !needsDrill || def.id === 'scanner') {
          this.targetPickup = p;
        }
      }
    }

    if (this.targetCreature) {
      const d = ctx.creatures.definitionOf(this.targetCreature);
      this.prompt = `${d.name}`;
    } else if (this.targetPickup) {
      this.prompt = itemById(this.targetPickup.itemId)?.name ?? '';
    }
  }

  // --- held tools -------------------------------------------------------

  private updateHeldTool(ctx: ToolContext, def: ToolDef, dt: number): void {
    if (def.id === 'lure') {
      this.lureActive = ctx.using && ctx.sub.battery > 1;
      if (this.lureActive) ctx.sub.battery = Math.max(0, ctx.sub.battery - def.energy * dt);
      this.progress = this.lureActive ? 1 : 0;
      return;
    }

    if (!ctx.using || ctx.sub.battery <= 1) {
      this.progress = damp(this.progress, 0, 5, dt);
      return;
    }
    ctx.sub.battery = Math.max(0, ctx.sub.battery - def.energy * dt);

    if (def.id === 'scanner') {
      const speed = ctx.sub.stats.scanSpeed;
      if (this.targetCreature) {
        this.progress = Math.min(1, this.progress + dt * 0.34 * speed);
        if (this.progress >= 1) {
          this.completeScan(ctx, ctx.creatures.definitionOf(this.targetCreature));
          this.progress = 0;
        }
      } else if (this.targetPickup) {
        this.progress = Math.min(1, this.progress + dt * 0.5 * speed);
        if (this.progress >= 1) {
          this.completeItemScan(ctx, this.targetPickup);
          this.progress = 0;
        }
      } else {
        this.progress = damp(this.progress, 0, 4, dt);
      }
      return;
    }

    if (def.id === 'drill') {
      const p = this.targetPickup;
      if (!p) { this.progress = damp(this.progress, 0, 4, dt); return; }
      const tier = ctx.sub.stats.drillTier;
      if (tier < (p.toolTier ?? 1)) {
        this.prompt = 'Drill tier too low';
        return;
      }
      this.progress = Math.min(1, this.progress + dt * (0.34 + tier * 0.1));
      ctx.sub.armExtension = 1;
      if (this.progress >= 1) {
        this.collectPickup(ctx, p);
        this.progress = 0;
      }
    }
  }

  // --- triggered tools --------------------------------------------------

  private triggerTool(ctx: ToolContext, def: ToolDef): void {
    if (this.cooldown > 0) return;
    if (ctx.sub.battery < def.energy) {
      toast('Not enough power', 'warn');
      return;
    }

    switch (def.id) {
      case 'claw': {
        const p = this.targetPickup;
        if (!p) { toast('Nothing in reach', 'neutral'); return; }
        if ((p.toolTier ?? 0) > 0) { toast('Needs the drill', 'warn'); return; }
        ctx.sub.battery -= def.energy;
        this.cooldown = def.cooldown;
        ctx.sub.armExtension = 1;
        this.collectPickup(ctx, p);
        break;
      }
      case 'rod': {
        const c = this.targetCreature;
        if (!c) { toast('No fish in range', 'neutral'); return; }
        ctx.sub.battery -= def.energy;
        this.cooldown = def.cooldown;
        this.beginFight(ctx, c);
        break;
      }
      case 'net': {
        ctx.sub.battery -= def.energy;
        this.cooldown = def.cooldown;
        this.sweepNet(ctx, def);
        break;
      }
      case 'sampler': {
        const c = this.targetCreature;
        if (!c) { toast('No specimen in reach', 'neutral'); return; }
        ctx.sub.battery -= def.energy;
        this.cooldown = def.cooldown;
        this.takeSample(ctx, c);
        break;
      }
      case 'trap': {
        ctx.sub.battery -= def.energy;
        this.cooldown = def.cooldown;
        this.deployOrCollectTrap(ctx);
        break;
      }
      case 'camera': {
        ctx.sub.battery -= def.energy;
        this.cooldown = def.cooldown;
        this.takePhoto(ctx, def);
        break;
      }
      case 'drone': {
        ctx.sub.battery -= def.energy;
        this.cooldown = def.cooldown;
        this.launchDrone(ctx);
        break;
      }
      default:
        break;
    }
  }

  // --- fishing ----------------------------------------------------------

  private beginFight(ctx: ToolContext, c: Creature): void {
    const f = this.fishing;
    const def = ctx.creatures.definitionOf(c);
    f.target = c;
    f.species = def;
    f.phase = 'waiting';
    f.tension = 0.2;
    f.distance = c.dist;
    f.startDistance = Math.max(4, c.dist);
    f.pull = 0;
    // Bait the fish likes shortens the wait considerably.
    const wantsBait = def.bait ?? [];
    let baitBonus = 0;
    for (const b of wantsBait) if (ctx.inventory.has(b)) baitBonus += 0.5;
    f.timer = this.rng.range(1.2, 4.5) / (1 + baitBonus);
    f.reeling = false;
    f.strikeWindow = false;
    c.engaged = true;
    bus.emit('catch:started', { speciesId: def.id, method: 'rod' });
  }

  private updateFight(ctx: ToolContext, dt: number): void {
    const f = this.fishing;
    const c = f.target;
    const def = f.species;
    if (!c || !def || !c.alive) { this.endFight('lost', 'It got away'); return; }

    f.tip.set(c.x, c.y, c.z);
    _v.set(c.x - ctx.sub.position.x, c.y - ctx.sub.position.y, c.z - ctx.sub.position.z);
    const realDist = _v.length();

    switch (f.phase) {
      case 'waiting': {
        f.timer -= dt;
        // The fish is drawn toward the boat while it considers the bait.
        c.state = 'approach';
        if (realDist > TOOLS.rod.range * 1.6) { this.endFight('lost', 'Out of range'); return; }
        if (f.timer <= 0) {
          f.phase = 'strike';
          f.strikeWindow = true;
          // Wary fish give a shorter window.
          f.timer = lerp(1.1, 0.42, def.wariness);
          bus.emit('toast', { text: 'Strike!', tone: 'good', duration: 0.9 });
        }
        break;
      }
      case 'strike': {
        f.timer -= dt;
        if (ctx.pressed) {
          f.phase = 'fighting';
          f.strikeWindow = false;
          f.distance = Math.max(3, realDist);
          f.startDistance = f.distance;
          f.tension = 0.3;
          f.pull = 0.4;
          f.timer = 0.7;
        } else if (f.timer <= 0) {
          this.endFight('lost', 'It spat the hook');
        }
        break;
      }
      case 'fighting': {
        f.reeling = ctx.using;
        // The fish runs in bursts; between runs it can be gained on.
        f.timer -= dt;
        if (f.timer <= 0) {
          const stamina = clamp01(f.distance / f.startDistance);
          f.pull = this.rng.range(0.25, 1) * lerp(0.5, 1.15, stamina) * fishStrength(def);
          f.timer = this.rng.range(0.6, 1.8);
        }

        const lineStrength = ctx.sub.stats.fishingPower;
        // Reeling adds tension and takes line; slacking off bleeds both.
        if (f.reeling) {
          f.tension += (0.34 + f.pull * 0.85) * dt / lineStrength;
          f.distance -= (1.9 - f.pull * 0.9) * dt;
        } else {
          f.tension -= 0.55 * dt;
          f.distance += f.pull * 1.5 * dt;
        }
        f.tension = clamp(f.tension, 0, 1.2);
        f.distance = clamp(f.distance, 0, f.startDistance * 1.6);

        // Drag the fish toward the boat so the line reads honestly.
        const wantDist = f.distance;
        if (realDist > 0.01) {
          _v.divideScalar(realDist);
          c.x = ctx.sub.position.x + _v.x * wantDist;
          c.y = ctx.sub.position.y + _v.y * wantDist;
          c.z = ctx.sub.position.z + _v.z * wantDist;
          c.state = 'hooked';
        }

        if (f.tension >= 1) { this.endFight('lost', 'The line broke'); return; }
        if (f.distance <= 1.6) { this.landFish(ctx); return; }
        if (f.distance > f.startDistance * 1.55) { this.endFight('lost', 'It ran out the line'); return; }
        break;
      }
      default:
        break;
    }
  }

  private landFish(ctx: ToolContext): void {
    const f = this.fishing;
    const c = f.target!;
    const def = f.species!;
    const sizeCm = c.size * 100;
    // Quality rewards a clean fight: low peak tension, few mistakes.
    const quality = clamp01(1 - f.tension * 0.55);
    const first = ctx.state.recordSpecies(def.id, sizeCm);
    ctx.creatures.observe(def.id);

    const stack = { itemId: `spec_${def.id}`, count: 1, sizeCm, quality };
    const res = ctx.inventory.add(stack);
    if (res.added === 0) {
      toast(`${def.name} released — ${ctx.inventory.rejectReason(stack) ?? 'no room'}`, 'warn');
    } else {
      ctx.state.data.stats.catches++;
      ctx.state.recordItem(stack.itemId);
      bus.emit('catch:success', { speciesId: def.id, sizeCm, quality, method: 'rod' });
      if (first) bus.emit('discovery', { kind: 'species', id: def.id, name: def.name, subtitle: def.latin, first: true });
      else toast(`${def.name} — ${sizeCm.toFixed(0)} cm`, 'good');
    }
    ctx.creatures.remove(c);
    this.resetFight();
  }

  private endFight(phase: 'lost' | 'landed', message: string): void {
    const f = this.fishing;
    if (f.target) {
      f.target.engaged = false;
      f.target.state = 'flee';
    }
    if (phase === 'lost' && f.species) {
      bus.emit('catch:escaped', { speciesId: f.species.id, reason: message });
      toast(message, 'warn');
    }
    this.resetFight();
  }

  private resetFight(): void {
    const f = this.fishing;
    if (f.target) f.target.engaged = false;
    f.phase = 'idle';
    f.target = null;
    f.species = null;
    f.tension = 0;
    f.distance = 0;
    f.pull = 0;
    f.strikeWindow = false;
    f.reeling = false;
  }

  // --- net --------------------------------------------------------------

  private sweepNet(ctx: ToolContext, def: ToolDef): void {
    const width = 2.4 + ctx.sub.stats.netWidth;
    const list = ctx.creatures.query(ctx.sub.position, def.range);
    let taken = 0;
    for (const c of list) {
      const cdef = ctx.creatures.definitionOf(c);
      if (!cdef.capture.includes('net')) continue;
      if (c.size > 0.55) continue;
      _v.set(c.x - ctx.sub.position.x, c.y - ctx.sub.position.y, c.z - ctx.sub.position.z);
      const d = _v.length();
      if (d < 0.01) continue;
      _v.divideScalar(d);
      // A cone ahead of the boat, widened by the net spread.
      if (_v.dot(ctx.aim) < 1 - width * 0.05) continue;
      const sizeCm = c.size * 100;
      const stack = { itemId: `spec_${cdef.id}`, count: 1, sizeCm, quality: 0.55 };
      if (ctx.inventory.rejectReason(stack)) break;
      const first = ctx.state.recordSpecies(cdef.id, sizeCm);
      ctx.inventory.add(stack);
      ctx.state.recordItem(stack.itemId);
      ctx.state.data.stats.catches++;
      ctx.creatures.observe(cdef.id);
      ctx.creatures.remove(c);
      taken++;
      if (first) {
        bus.emit('discovery', { kind: 'species', id: cdef.id, name: cdef.name, subtitle: cdef.latin, first: true });
      }
      if (taken >= 8) break;
    }
    if (taken === 0) toast('The net comes back empty', 'neutral');
    else {
      toast(`Netted ${taken} specimen${taken === 1 ? '' : 's'}`, 'good');
      bus.emit('catch:success', { speciesId: 'net', sizeCm: 0, quality: 0.55, method: 'net' });
    }
  }

  // --- sampler ----------------------------------------------------------

  private takeSample(ctx: ToolContext, c: Creature): void {
    const cdef = ctx.creatures.definitionOf(c);
    if (!cdef.capture.includes('sampler')) {
      toast(`${cdef.name} cannot be sampled`, 'warn');
      return;
    }
    const sizeCm = c.size * 100;
    const stack = { itemId: `spec_${cdef.id}`, count: 1, sizeCm, quality: 0.95 };
    const reason = ctx.inventory.rejectReason(stack);
    if (reason) { toast(reason, 'warn'); return; }
    const first = ctx.state.recordSpecies(cdef.id, sizeCm);
    ctx.inventory.add(stack);
    ctx.state.recordItem(stack.itemId);
    ctx.state.data.stats.catches++;
    ctx.creatures.observe(cdef.id);
    ctx.creatures.remove(c);
    bus.emit('catch:success', { speciesId: cdef.id, sizeCm, quality: 0.95, method: 'sampler' });
    if (first) {
      bus.emit('discovery', { kind: 'species', id: cdef.id, name: cdef.name, subtitle: cdef.latin, first: true });
    } else {
      toast(`Sampled ${cdef.name}`, 'good');
    }
  }

  // --- traps ------------------------------------------------------------

  private deployOrCollectTrap(ctx: ToolContext): void {
    // If one is within reach, haul it instead of dropping another.
    for (let i = 0; i < this.traps.length; i++) {
      const t = this.traps[i];
      const d = Math.hypot(t.x - ctx.sub.position.x, t.y - ctx.sub.position.y, t.z - ctx.sub.position.z);
      if (d < 9) {
        this.haulTrap(ctx, i);
        return;
      }
    }
    if (this.traps.length >= 4) {
      toast('No traps left aboard', 'warn');
      return;
    }
    // Drop it on the seabed below the boat.
    const bait = ['bait_fish_scrap', 'bait_shrimp', 'bait_worm', 'bait_urchin', 'bait_vent_shrimp']
      .find((b) => ctx.inventory.has(b)) ?? null;
    if (bait) ctx.inventory.remove(bait, 1);
    this.traps.push({
      id: this.nextTrapId++,
      x: ctx.sub.position.x, y: ctx.sub.position.y - 1.5, z: ctx.sub.position.z,
      bait, soak: 0, catches: [], full: false,
    });
    toast(bait ? 'Trap set and baited' : 'Trap set (no bait aboard)', 'neutral');
  }

  private haulTrap(ctx: ToolContext, index: number): void {
    const t = this.traps[index];
    this.traps.splice(index, 1);
    if (t.catches.length === 0) {
      toast('The trap is empty', 'neutral');
      return;
    }
    let kept = 0;
    for (const cat of t.catches) {
      const stack = { itemId: `spec_${cat.speciesId}`, count: 1, sizeCm: cat.sizeCm, quality: cat.quality };
      if (ctx.inventory.rejectReason(stack)) break;
      const first = ctx.state.recordSpecies(cat.speciesId, cat.sizeCm);
      ctx.inventory.add(stack);
      ctx.state.recordItem(stack.itemId);
      ctx.state.data.stats.catches++;
      ctx.creatures.observe(cat.speciesId);
      kept++;
      if (first) {
        const sd = speciesById(cat.speciesId);
        if (sd) {
          bus.emit('discovery', {
            kind: 'species', id: sd.id, name: sd.name, subtitle: sd.latin, first: true,
          });
        }
      }
    }
    toast(`Trap hauled: ${kept} specimen${kept === 1 ? '' : 's'}`, 'good');
  }

  private updateTraps(ctx: ToolContext, dt: number): void {
    for (const t of this.traps) {
      if (t.full) continue;
      t.soak += dt;
      // A catch roughly every forty seconds while baited.
      const rate = t.bait ? 1 / 40 : 1 / 140;
      if (this.rng.next() < rate * dt) {
        const candidates = ctx.creatures.query(_v.set(t.x, t.y, t.z), 40);
        const usable = candidates.filter((c) => {
          const d = ctx.creatures.definitionOf(c);
          return d.capture.includes('trap');
        });
        if (usable.length === 0) continue;
        const pick = this.rng.pick(usable);
        const d = ctx.creatures.definitionOf(pick);
        t.catches.push({
          speciesId: d.id,
          sizeCm: pick.size * 100,
          quality: 0.6 + this.rng.next() * 0.3,
        });
        if (t.catches.length >= 4) t.full = true;
      }
    }
  }

  // --- scanning and photography -----------------------------------------

  private completeScan(ctx: ToolContext, def: SpeciesDef): void {
    const first = !ctx.state.hasSeenSpecies(def.id);
    ctx.state.recordSpecies(def.id, this.targetCreature ? this.targetCreature.size * 100 : 0);
    ctx.state.addResearch(def.discipline ?? 'biology', def.research);
    ctx.state.data.stats.scans++;
    ctx.creatures.observe(def.id);
    bus.emit('scan:complete', { targetKind: 'species', targetId: def.id, value: def.research });
    if (first) {
      bus.emit('discovery', { kind: 'species', id: def.id, name: def.name, subtitle: def.latin, first: true });
    } else {
      toast(`Scanned ${def.name} · +${def.research} research`, 'good');
    }
  }

  private completeItemScan(ctx: ToolContext, p: Pickup): void {
    const def = itemById(p.itemId);
    if (!def) return;
    const points = def.researchValue ?? 3;
    ctx.state.addResearch(def.discipline ?? 'geology', points);
    ctx.state.data.stats.scans++;
    bus.emit('scan:complete', { targetKind: 'item', targetId: def.id, value: points });
    toast(`Analysed ${def.name} · +${points} research`, 'good');
  }

  /**
   * Photograph scoring. Framing is the whole skill: how much of the frame the
   * subject fills, how centred it is, how close, and whether it is lit.
   */
  private takePhoto(ctx: ToolContext, def: ToolDef): void {
    const c = this.targetCreature;
    if (!c) { toast('Nothing worth photographing', 'neutral'); return; }
    const cdef = ctx.creatures.definitionOf(c);

    _v.set(c.x - ctx.eye.x, c.y - ctx.eye.y, c.z - ctx.eye.z);
    const dist = _v.length();
    _v.divideScalar(Math.max(0.001, dist));
    const align = clamp01(_v.dot(ctx.aim));

    // Apparent size: the subject should fill a good part of the frame.
    const apparent = clamp01((c.size / Math.max(2, dist)) * 6);
    const centring = Math.pow(clamp01((align - 0.86) / 0.14), 0.8);
    const range = clamp01(1 - Math.abs(dist - def.range * 0.28) / (def.range * 0.6));
    const lit = ctx.sub.lightsOn && dist < ctx.sub.stats.lightRange ? 1 : 0.62;
    const gear = 0.6 + ctx.sub.stats.cameraTier * 0.14;
    const steady = clamp01(1 - ctx.sub.smoothedSpeed / 7);

    const score = clamp01(
      (apparent * 0.34 + centring * 0.3 + range * 0.16 + steady * 0.1 + (lit - 0.6) * 0.25) * gear,
    );

    const record = ctx.state.speciesRecord(cdef.id);
    const improved = score > record.bestPhoto + 0.001;
    const first = !ctx.state.hasSeenSpecies(cdef.id);
    ctx.state.recordSpecies(cdef.id, c.size * 100, score);
    ctx.state.data.stats.photographs++;
    ctx.creatures.observe(cdef.id);

    const research = Math.round(cdef.research * (0.35 + score * 0.9));
    ctx.state.addResearch(cdef.discipline ?? 'biology', research);
    ctx.inventory.add({ itemId: 'data_photo', count: 1, quality: score });
    bus.emit('photo:taken', { speciesId: cdef.id, score });

    const grade = score > 0.85 ? 'Superb' : score > 0.65 ? 'Good' : score > 0.4 ? 'Passable' : 'Poor';
    if (first) {
      bus.emit('discovery', { kind: 'species', id: cdef.id, name: cdef.name, subtitle: cdef.latin, first: true });
    } else {
      toast(`${grade} photograph of ${cdef.name}${improved ? ' — personal best' : ''}`, improved ? 'good' : 'neutral');
    }
  }

  // --- drone ------------------------------------------------------------

  private launchDrone(ctx: ToolContext): void {
    if (this.drone) {
      this.drone.returning = true;
      return;
    }
    const range = Math.max(12, ctx.sub.stats.droneRange);
    const target = new Vector3().copy(ctx.sub.position).addScaledVector(ctx.aim, range * 0.8);
    this.drone = { pos: ctx.sub.position.clone(), target, out: 0, returning: false };
    toast('Drone away', 'neutral');
  }

  private updateDrone(ctx: ToolContext, dt: number): void {
    const d = this.drone;
    if (!d) return;
    const speed = 9;
    const dest = d.returning ? ctx.sub.position : d.target;
    _v2.subVectors(dest, d.pos);
    const dist = _v2.length();
    if (dist > 0.4) {
      _v2.divideScalar(dist);
      d.pos.addScaledVector(_v2, Math.min(dist, speed * dt));
    } else if (!d.returning) {
      // Arrived: take whatever delicate thing is nearest.
      const c = ctx.creatures.nearest(d.pos, 7, (_c, def) => def.capture.includes('drone'));
      if (c) {
        const cdef = ctx.creatures.definitionOf(c);
        const sizeCm = c.size * 100;
        const stack = { itemId: `spec_${cdef.id}`, count: 1, sizeCm, quality: 1 };
        if (!ctx.inventory.rejectReason(stack)) {
          const first = ctx.state.recordSpecies(cdef.id, sizeCm);
          ctx.inventory.add(stack);
          ctx.state.recordItem(stack.itemId);
          ctx.state.data.stats.catches++;
          ctx.creatures.observe(cdef.id);
          ctx.creatures.remove(c);
          bus.emit('catch:success', { speciesId: cdef.id, sizeCm, quality: 1, method: 'drone' });
          if (first) {
            bus.emit('discovery', { kind: 'species', id: cdef.id, name: cdef.name, subtitle: cdef.latin, first: true });
          }
        }
      } else {
        const p = ctx.pickups.nearest(d.pos, 6);
        if (p) this.collectPickup(ctx, p);
      }
      d.returning = true;
    } else {
      this.drone = null;
      toast('Drone recovered', 'neutral');
    }
    d.out += dt;
    if (d.out > 40) d.returning = true;
  }

  // --- shared -----------------------------------------------------------

  private collectPickup(ctx: ToolContext, p: Pickup): void {
    const stack = ctx.pickups.collect(p);
    if (!stack) return;
    const def = itemById(stack.itemId);
    const reason = ctx.inventory.rejectReason(stack);
    if (reason) {
      // Put it back rather than destroying it.
      p.taken = false;
      ctx.pickups.taken.delete(p.id);
      toast(reason, 'warn');
      return;
    }
    ctx.inventory.add(stack);
    ctx.state.data.stats.salvaged++;
    const first = ctx.state.recordItem(stack.itemId);
    bus.emit('item:collected', { stack, x: p.x, y: p.y, z: p.z });
    if (first && def) {
      bus.emit('discovery', {
        kind: 'item', id: def.id, name: def.name,
        subtitle: def.category === 'souvenir' ? 'Souvenir' : undefined, first: true,
      });
    } else if (def) {
      toast(def.name, 'neutral');
    }
  }
}

function canTarget(tool: ToolId, def: SpeciesDef): boolean {
  switch (tool) {
    case 'rod': return def.capture.includes('rod');
    case 'net': return def.capture.includes('net');
    case 'sampler': return def.capture.includes('sampler');
    case 'drone': return def.capture.includes('drone');
    // The scanner and camera work on anything; that is rather the point of them.
    case 'scanner':
    case 'camera':
      void def;
      return true;
    default: return false;
  }
}

/** How hard a species pulls, from its size and agility. */
function fishStrength(def: SpeciesDef): number {
  const size = (def.size[0] + def.size[1]) / 200;
  return clamp(0.45 + size * 0.55 + def.agility * 0.18, 0.4, 2.4);
}
