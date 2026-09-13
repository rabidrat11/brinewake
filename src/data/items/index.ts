/** The complete item database, assembled and indexed. */

import type { ItemDef } from '../../items/itemTypes';
import { MATERIAL_ITEMS } from './materials';
import { RELIC_ITEMS } from './relics';
import { CRAFTED_ITEMS } from './crafted';
import { SPECIES } from '../species/index';
import { averageSize } from '../speciesTypes';
import { RarityValueMult } from '../../procedural/palette';

/** Specimen items are derived from the bestiary rather than written twice. */
function specimenItems(): ItemDef[] {
  const out: ItemDef[] = [];
  for (const s of SPECIES) {
    if (s.protected) continue;
    const size = averageSize(s);
    out.push({
      id: s.item ?? `spec_${s.id}`,
      name: s.name,
      category: 'specimen',
      rarity: s.rarity,
      value: Math.max(2, Math.round(s.value)),
      museumValue: Math.round(s.value * 2.4 + s.research * 6),
      researchValue: s.research,
      discipline: s.discipline ?? 'biology',
      mass: Math.max(0.2, Math.min(9, 0.25 + size / 45)),
      stack: size > 120 ? 2 : size > 45 ? 6 : 14,
      model: `creature:${s.id}`,
      donatable: true,
      description: s.description,
      lore: s.note,
      foundIn: s.regions,
      size: size / 100,
      tags: [s.group],
    });
  }
  return out;
}

export const ITEMS: ItemDef[] = [
  ...MATERIAL_ITEMS,
  ...RELIC_ITEMS,
  ...CRAFTED_ITEMS,
  ...specimenItems(),
];

export const ITEM_BY_ID = new Map(ITEMS.map((i) => [i.id, i]));

export function itemById(id: string): ItemDef | undefined {
  return ITEM_BY_ID.get(id);
}

export function requireItem(id: string): ItemDef {
  const i = ITEM_BY_ID.get(id);
  if (!i) throw new Error(`Unknown item: ${id}`);
  return i;
}

/** Market value for a specific stack, accounting for rarity and condition. */
export function stackValue(
  def: ItemDef,
  opts: { condition?: number; quality?: number; sizeCm?: number; count?: number } = {},
): number {
  const count = opts.count ?? 1;
  let v = def.value * RarityValueMult[def.rarity];
  if (opts.condition !== undefined) v *= 0.35 + opts.condition * 0.9;
  if (opts.quality !== undefined) v *= 0.55 + opts.quality * 0.8;
  if (opts.sizeCm !== undefined && def.size) {
    const nominal = def.size * 100;
    v *= 0.6 + 0.7 * (opts.sizeCm / Math.max(1, nominal));
  }
  return Math.max(1, Math.round(v)) * count;
}

/** Museum value, which rewards quality and rarity far more than the market. */
export function museumValue(def: ItemDef, quality = 1): number {
  const base = def.museumValue ?? def.value * 2.2;
  return Math.round(base * RarityValueMult[def.rarity] * (0.6 + quality * 0.7));
}

export const ITEM_COUNT = ITEMS.length;
