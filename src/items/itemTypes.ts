/**
 * Item model.
 *
 * Everything the player can hold, sell, donate, research or craft with is an
 * `ItemDef`. Instances in cargo are `ItemStack`s, which carry the per-catch
 * details that make two of the same fish worth different money.
 */

import type { Rarity } from '../procedural/palette';

export type ItemCategory =
  | 'specimen'    // living or preserved creatures
  | 'mineral'
  | 'scrap'
  | 'organic'     // shells, coral, bone, biological samples
  | 'artifact'    // archaeological finds
  | 'souvenir'    // charming incidental objects
  | 'component'   // crafted or salvaged parts
  | 'consumable'  // bait, repair kits, charges
  | 'data'        // scans, photographs, logs
  | 'key';        // quest and progression items

export interface ItemDef {
  id: string;
  name: string;
  category: ItemCategory;
  rarity: Rarity;
  /** Base market value in marks before rarity, condition and demand. */
  value: number;
  /** Value to the museum if donated. Defaults to 2.2x market. */
  museumValue?: number;
  /** Research points granted the first time it is studied. */
  researchValue?: number;
  /** Cargo units consumed. Specimens are bulky; coins are not. */
  mass: number;
  /** Maximum stack size in one cargo slot. */
  stack: number;
  description: string;
  /** Flavour shown in the catalogue once identified. */
  lore?: string;
  /** Where the object came from, for souvenirs and artifacts. */
  origin?: string;
  tags?: string[];
  /** Key into the prop model registry. */
  model: string;
  colors?: string[];
  /** Tool required to collect it in the world, if any. */
  tool?: string;
  /** Minimum tool tier required (e.g. drill level). */
  toolTier?: number;
  /** Can this be donated to the museum? */
  donatable?: boolean;
  /** Used as a crafting material. */
  material?: boolean;
  /** Salvage and artifacts spawn with a condition value. */
  hasCondition?: boolean;
  /** Relics must be identified at the lab before they can be sold. */
  needsIdentification?: boolean;
  /** Research discipline this contributes to. */
  discipline?: Discipline;
  /** Region ids where it can be found (for the catalogue). */
  foundIn?: string[];
  /** Scale of the world pickup model, in metres. */
  size?: number;
}

export type Discipline =
  | 'biology' | 'geology' | 'engineering' | 'archaeology' | 'oceanography' | 'abyssal';

export interface ItemStack {
  itemId: string;
  count: number;
  /** 0..1, for salvage and artifacts. */
  condition?: number;
  /** Specimen length in centimetres. */
  sizeCm?: number;
  /** 0..1 catch quality; drives price and museum eligibility. */
  quality?: number;
  /** False for unidentified relics. */
  identified?: boolean;
  /** Colour/shape variant index. */
  variant?: number;
  /** True if the specimen was released alive (tagged rather than kept). */
  tagged?: boolean;
}

export function makeStack(itemId: string, count = 1, extra: Partial<ItemStack> = {}): ItemStack {
  return { itemId, count, ...extra };
}

/** Cargo units a stack occupies. */
export function stackMass(def: ItemDef, stack: ItemStack): number {
  const sizeFactor = stack.sizeCm ? 0.55 + (stack.sizeCm / 120) * 0.9 : 1;
  return def.mass * stack.count * (def.category === 'specimen' ? sizeFactor : 1);
}
