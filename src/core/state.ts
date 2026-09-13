/**
 * Player state.
 *
 * One serialisable object holding everything a save file needs, plus the small
 * amount of behaviour that keeps it consistent. Systems mutate it through the
 * methods here rather than reaching in, so that every change can raise an
 * event and every field has exactly one place that writes it.
 */

import { bus } from './events';
import type { ItemStack } from '../items/itemTypes';
import type { Discipline } from '../items/itemTypes';

export const SAVE_VERSION = 4;

export interface SpeciesRecord {
  /** Times caught, photographed or scanned. */
  count: number;
  /** Largest specimen seen, in centimetres. */
  best: number;
  /** Best photograph score, 0..1. */
  bestPhoto: number;
  /** Has been fully studied at the lab. */
  studied: boolean;
  /** Released alive with a tracking tag. */
  tagged: boolean;
  /** First seen at this in-game day. */
  firstDay: number;
}

export interface QuestState {
  id: string;
  /** Progress per objective. */
  progress: number[];
  /** In-game day accepted. */
  accepted: number;
  /** Set when every objective is met and the quest is awaiting hand-in. */
  ready: boolean;
}

export interface MuseumRecord {
  count: number;
  best: number;
  /** In-game day of the first donation. */
  day: number;
}

export interface NpcState {
  met: boolean;
  /** 0..100; unlocks dialogue and personal quests. */
  affinity: number;
  seen: string[];
  /** Quest ids this character has already given. */
  given: string[];
}

export interface AquariumTank {
  id: string;
  speciesId: string;
  /** 0..1; falls if the tank is unsuitable. */
  health: number;
  addedDay: number;
}

export interface PlayerStats {
  deepestDepth: number;
  distanceTravelled: number;
  expeditions: number;
  catches: number;
  photographs: number;
  scans: number;
  salvaged: number;
  moneyEarned: number;
  moneySpent: number;
  rescues: number;
  hullBreaches: number;
  timeSubmerged: number;
}

export interface SaveState {
  version: number;
  slot: number;
  name: string;
  createdAt: number;
  updatedAt: number;
  playedSeconds: number;
  worldSeed: number;

  /** In-game day number and time of day 0..1. */
  day: number;
  timeOfDay: number;
  weather: string;

  money: number;

  sub: {
    modules: string[];
    livery: string;
    hull: number;
    battery: number;
    oxygen: number;
    pressureReserve: number;
    x: number; y: number; z: number; yaw: number;
    docked: boolean;
  };

  cargo: ItemStack[];
  storage: ItemStack[];

  species: Record<string, SpeciesRecord>;
  items: Record<string, number>;
  landmarks: string[];
  regionsVisited: string[];
  moorings: string[];
  mapExplored: number[];

  research: {
    points: Record<Discipline, number>;
    unlocked: string[];
    progress: Record<string, number>;
  };

  quests: {
    active: QuestState[];
    completed: string[];
    offered: string[];
    /** Procedural contract board, regenerated each day. */
    board: QuestState[];
    boardDay: number;
  };

  museum: {
    donated: Record<string, MuseumRecord>;
    tier: number;
    exhibits: string[];
  };

  aquarium: {
    tanks: AquariumTank[];
    capacity: number;
  };

  market: {
    demand: Record<string, number>;
    day: number;
  };

  npc: Record<string, NpcState>;
  flags: string[];
  stats: PlayerStats;
  /** Ids of tutorial prompts already shown. */
  seenTips: string[];
}

export function newSave(slot: number, name: string, worldSeed: number): SaveState {
  return {
    version: SAVE_VERSION,
    slot,
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    playedSeconds: 0,
    worldSeed,
    day: 1,
    timeOfDay: 0.34,
    weather: 'calm',
    money: 180,
    sub: {
      modules: ['hull_coastal', 'engine_starter', 'power_lead_acid', 'lamp_single', 'sonar_basic', 'tool_rod'],
      livery: 'harbour',
      hull: 100, battery: 100, oxygen: 900, pressureReserve: 0,
      x: 0, y: -6, z: 40, yaw: 0, docked: true,
    },
    cargo: [],
    storage: [],
    species: {},
    items: {},
    landmarks: [],
    regionsVisited: ['lantern_bay'],
    moorings: [],
    mapExplored: [],
    research: {
      points: { biology: 0, geology: 0, engineering: 0, archaeology: 0, oceanography: 0, abyssal: 0 },
      unlocked: [],
      progress: {},
    },
    quests: { active: [], completed: [], offered: [], board: [], boardDay: 0 },
    museum: { donated: {}, tier: 0, exhibits: [] },
    aquarium: { tanks: [], capacity: 3 },
    market: { demand: {}, day: 0 },
    npc: {},
    flags: [],
    stats: {
      deepestDepth: 0, distanceTravelled: 0, expeditions: 0, catches: 0,
      photographs: 0, scans: 0, salvaged: 0, moneyEarned: 0, moneySpent: 0,
      rescues: 0, hullBreaches: 0, timeSubmerged: 0,
    },
    seenTips: [],
  };
}

/**
 * Thin wrapper that owns the save object and raises events on the changes
 * other systems care about.
 */
export class GameState {
  data: SaveState;

  constructor(data: SaveState) {
    this.data = data;
  }

  // --- money -----------------------------------------------------------

  get money(): number {
    return this.data.money;
  }

  addMoney(amount: number, reason: string): void {
    if (amount === 0) return;
    this.data.money = Math.max(0, this.data.money + amount);
    if (amount > 0) this.data.stats.moneyEarned += amount;
    else this.data.stats.moneySpent += -amount;
    bus.emit('money:changed', { delta: amount, total: this.data.money, reason });
  }

  canAfford(amount: number): boolean {
    return this.data.money >= amount;
  }

  spend(amount: number, reason: string): boolean {
    if (!this.canAfford(amount)) return false;
    this.addMoney(-amount, reason);
    return true;
  }

  // --- flags -----------------------------------------------------------

  hasFlag(flag: string): boolean {
    return this.data.flags.includes(flag);
  }

  setFlag(flag: string): void {
    if (!this.data.flags.includes(flag)) this.data.flags.push(flag);
  }

  clearFlag(flag: string): void {
    const i = this.data.flags.indexOf(flag);
    if (i >= 0) this.data.flags.splice(i, 1);
  }

  // --- discovery -------------------------------------------------------

  speciesRecord(id: string): SpeciesRecord {
    let r = this.data.species[id];
    if (!r) {
      r = { count: 0, best: 0, bestPhoto: 0, studied: false, tagged: false, firstDay: this.data.day };
      this.data.species[id] = r;
    }
    return r;
  }

  hasSeenSpecies(id: string): boolean {
    return !!this.data.species[id];
  }

  recordSpecies(id: string, sizeCm: number, photoScore = 0, tagged = false): boolean {
    const first = !this.data.species[id];
    const r = this.speciesRecord(id);
    r.count++;
    r.best = Math.max(r.best, sizeCm);
    r.bestPhoto = Math.max(r.bestPhoto, photoScore);
    if (tagged) r.tagged = true;
    return first;
  }

  recordItem(id: string, count = 1): boolean {
    const first = !this.data.items[id];
    this.data.items[id] = (this.data.items[id] ?? 0) + count;
    return first;
  }

  hasSeenItem(id: string): boolean {
    return !!this.data.items[id];
  }

  discoverLandmark(id: string): boolean {
    if (this.data.landmarks.includes(id)) return false;
    this.data.landmarks.push(id);
    bus.emit('landmark:discovered', { landmarkId: id });
    return true;
  }

  visitRegion(id: string): boolean {
    if (this.data.regionsVisited.includes(id)) return false;
    this.data.regionsVisited.push(id);
    return true;
  }

  addMooring(id: string): boolean {
    if (this.data.moorings.includes(id)) return false;
    this.data.moorings.push(id);
    return true;
  }

  // --- research --------------------------------------------------------

  addResearch(discipline: Discipline, points: number): void {
    if (points <= 0) return;
    this.data.research.points[discipline] =
      (this.data.research.points[discipline] ?? 0) + points;
  }

  spendResearch(discipline: Discipline, points: number): boolean {
    const have = this.data.research.points[discipline] ?? 0;
    if (have < points) return false;
    this.data.research.points[discipline] = have - points;
    return true;
  }

  hasResearch(nodeId: string): boolean {
    return this.data.research.unlocked.includes(nodeId);
  }

  unlockResearch(nodeId: string): void {
    if (this.hasResearch(nodeId)) return;
    this.data.research.unlocked.push(nodeId);
    bus.emit('research:unlocked', { nodeId });
  }

  // --- npc -------------------------------------------------------------

  npcState(id: string): NpcState {
    let n = this.data.npc[id];
    if (!n) {
      n = { met: false, affinity: 0, seen: [], given: [] };
      this.data.npc[id] = n;
    }
    return n;
  }

  addAffinity(id: string, amount: number): void {
    const n = this.npcState(id);
    n.affinity = Math.max(0, Math.min(100, n.affinity + amount));
  }

  // --- stats -----------------------------------------------------------

  noteDepth(depth: number): void {
    if (depth > this.data.stats.deepestDepth) {
      this.data.stats.deepestDepth = depth;
      bus.emit('depth:record', { depth });
    }
  }
}
