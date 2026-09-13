/**
 * Loadout resolution.
 *
 * Turns a list of installed module ids into the numbers the simulation uses,
 * the appearance the builder uses, and the tools the player can select. Also
 * answers the question the workshop screen keeps asking: can this be fitted,
 * and if not, why not.
 */

import { MODULES, EXCLUSIVE, moduleById, type ModuleDef } from '../data/modules';
import { baseStats, type SubStats, type StatKey } from './stats';
import { defaultSubSpec, type SubVisualSpec } from '../procedural/submarineBuilder';
import type { ToolId } from '../interaction/tools';

export interface LoadoutSummary {
  stats: SubStats;
  visual: SubVisualSpec;
  tools: ToolId[];
  slotsUsed: number;
  slotsTotal: number;
  massUsed: number;
  massTotal: number;
  overSlots: boolean;
  overMass: boolean;
}

const TOOL_ORDER: ToolId[] = [
  'claw', 'rod', 'net', 'trap', 'lure', 'sampler', 'drill', 'scanner', 'camera', 'drone',
];

export function resolveLoadout(moduleIds: string[], livery = 'harbour'): LoadoutSummary {
  const mods: ModuleDef[] = [];
  for (const id of moduleIds) {
    const m = moduleById(id);
    if (m) mods.push(m);
  }

  const stats = baseStats();
  const visual: SubVisualSpec = { ...defaultSubSpec(), livery };
  const toolSet = new Set<ToolId>();

  // Additive pass. Exclusive categories keep only the highest tier fitted.
  const bestExclusive = new Map<string, ModuleDef>();
  for (const m of mods) {
    if (EXCLUSIVE.includes(m.category)) {
      const cur = bestExclusive.get(m.category);
      if (!cur || m.tier > cur.tier) bestExclusive.set(m.category, m);
    }
  }

  let slotsUsed = 0;
  let massUsed = 0;

  for (const m of mods) {
    if (EXCLUSIVE.includes(m.category) && bestExclusive.get(m.category) !== m) continue;
    slotsUsed += m.slots;
    massUsed += m.mass;
    for (const [k, v] of Object.entries(m.stats)) {
      const key = k as StatKey;
      (stats[key] as number) = (stats[key] as number) + (v as number);
    }
    if (m.visual) Object.assign(visual, m.visual);
    if (m.grants) toolSet.add(m.grants as ToolId);
  }

  // Multiplicative pass, so percentage modules stack sensibly.
  for (const m of mods) {
    if (!m.mult) continue;
    if (EXCLUSIVE.includes(m.category) && bestExclusive.get(m.category) !== m) continue;
    for (const [k, v] of Object.entries(m.mult)) {
      const key = k as StatKey;
      (stats[key] as number) = (stats[key] as number) * (v as number);
    }
  }

  // Sanity floors: a module set should never make the boat unusable.
  stats.maxSpeed = Math.max(2.4, stats.maxSpeed);
  stats.turnRate = Math.max(0.4, stats.turnRate);
  stats.pitchRate = Math.max(0.35, stats.pitchRate);
  stats.lightRange = Math.max(8, stats.lightRange);
  stats.lightAngle = Math.max(0.26, Math.min(1.1, stats.lightAngle));
  stats.sonarCooldown = Math.max(1.6, stats.sonarCooldown);
  stats.noise = Math.max(0.25, stats.noise);
  stats.oxygenRate = Math.max(0.35, stats.oxygenRate);
  stats.drivePower = Math.max(0.4, stats.drivePower);
  stats.impactResistance = Math.max(0.25, stats.impactResistance);

  // An overloaded boat is slow and clumsy rather than forbidden.
  const overMass = massUsed > stats.massMax;
  if (overMass) {
    const excess = (massUsed - stats.massMax) / Math.max(1, stats.massMax);
    stats.maxSpeed *= Math.max(0.45, 1 - excess * 0.8);
    stats.turnRate *= Math.max(0.5, 1 - excess * 0.6);
    stats.verticalThrust *= Math.max(0.5, 1 - excess * 0.6);
  }

  const tools = TOOL_ORDER.filter((t) => toolSet.has(t));
  if (tools.length === 0) tools.push('claw');

  return {
    stats, visual, tools,
    slotsUsed, slotsTotal: stats.slots,
    massUsed, massTotal: stats.massMax,
    overSlots: slotsUsed > stats.slots,
    overMass,
  };
}

/** Why a module cannot be fitted right now, or null if it can. */
export function fitProblem(
  m: ModuleDef, installed: string[], unlockedResearch: string[],
): string | null {
  if (installed.includes(m.id)) return 'Already fitted';
  if (m.requires && !unlockedResearch.includes(m.requires)) return 'Research required';
  if (m.needs) {
    for (const n of m.needs) {
      if (!installed.includes(n)) {
        return `Requires ${moduleById(n)?.name ?? n}`;
      }
    }
  }
  const after = resolveLoadout([...installed, m.id]);
  if (after.overSlots) return 'Not enough module slots';
  return null;
}

/** Everything the workshop can currently offer, in display order. */
export function purchasableModules(unlockedResearch: string[]): ModuleDef[] {
  return MODULES
    .filter((m) => m.price !== undefined && m.price > 0)
    .filter((m) => !m.requires || unlockedResearch.includes(m.requires))
    .sort((a, b) => a.category.localeCompare(b.category) || a.tier - b.tier);
}

/** Modules that exist but are still behind research, for the "coming soon" list. */
export function lockedModules(unlockedResearch: string[]): ModuleDef[] {
  return MODULES.filter((m) => m.requires && !unlockedResearch.includes(m.requires));
}
