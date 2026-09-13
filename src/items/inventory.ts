/**
 * Cargo.
 *
 * Capacity is a mass budget rather than a slot grid, because inventory Tetris
 * is not the game anyone came for. What matters is the decision on the seabed:
 * the hold is full, and the thing in front of you is worth more than something
 * already in it.
 */

import { bus, toast } from '../core/events';
import { itemById, stackValue } from '../data/items/index';
import type { ItemDef, ItemStack } from './itemTypes';
import { stackMass } from './itemTypes';

export type SortMode = 'category' | 'value' | 'name' | 'mass' | 'recent';

export interface AddResult {
  added: number;
  rejected: number;
  full: boolean;
}

export class Inventory {
  stacks: ItemStack[];
  /** Total mass capacity in cargo units. */
  capacity = 14;
  /** Extra capacity reserved for live specimens. */
  specimenCapacity = 4;
  /** Slots for relics that need containment. */
  relicCapacity = 1;
  /** Ids the player has marked as favourites; never auto-sold. */
  favourites = new Set<string>();

  constructor(stacks: ItemStack[] = []) {
    this.stacks = stacks;
  }

  get usedMass(): number {
    let m = 0;
    for (const s of this.stacks) {
      const def = itemById(s.itemId);
      if (def) m += stackMass(def, s);
    }
    return m;
  }

  get freeMass(): number {
    return Math.max(0, this.capacity - this.usedMass);
  }

  get fillFraction(): number {
    return Math.min(1, this.usedMass / Math.max(0.001, this.capacity));
  }

  countOf(itemId: string): number {
    let n = 0;
    for (const s of this.stacks) if (s.itemId === itemId) n += s.count;
    return n;
  }

  specimenCount(): number {
    let n = 0;
    for (const s of this.stacks) {
      const def = itemById(s.itemId);
      if (def?.category === 'specimen') n += s.count;
    }
    return n;
  }

  relicCount(): number {
    let n = 0;
    for (const s of this.stacks) {
      const def = itemById(s.itemId);
      if (def?.needsIdentification) n += s.count;
    }
    return n;
  }

  /**
   * Can this stack be taken aboard? Returns the reason if not, so the HUD can
   * say something more useful than "full".
   */
  rejectReason(stack: ItemStack): string | null {
    const def = itemById(stack.itemId);
    if (!def) return 'Unknown item';
    if (def.category === 'specimen' && this.specimenCount() >= this.specimenCapacity) {
      return 'Specimen tanks full';
    }
    if (def.needsIdentification && this.relicCount() >= this.relicCapacity) {
      return 'Relic containment full';
    }
    if (stackMass(def, stack) > this.freeMass + 1e-6) return 'Hold full';
    return null;
  }

  /** Add a stack, merging where possible. Partial adds are allowed. */
  add(stack: ItemStack): AddResult {
    const def = itemById(stack.itemId);
    if (!def) return { added: 0, rejected: stack.count, full: false };

    let remaining = stack.count;
    let added = 0;

    // Merge into an existing compatible stack first.
    if (!hasPerItemDetail(stack)) {
      for (const s of this.stacks) {
        if (s.itemId !== stack.itemId || hasPerItemDetail(s)) continue;
        const room = def.stack - s.count;
        if (room <= 0) continue;
        const unit = { ...stack, count: 1 };
        const canFit = Math.floor(this.freeMass / Math.max(0.0001, stackMass(def, unit)));
        const take = Math.min(remaining, room, Math.max(0, canFit));
        if (take <= 0) break;
        s.count += take;
        remaining -= take;
        added += take;
        if (remaining === 0) break;
      }
    }

    while (remaining > 0) {
      const unit: ItemStack = { ...stack, count: 1 };
      const reason = this.rejectReason(unit);
      if (reason) break;
      const room = def.stack;
      const canFit = Math.floor(this.freeMass / Math.max(0.0001, stackMass(def, unit)));
      const take = Math.min(remaining, room, Math.max(1, canFit));
      this.stacks.push({ ...stack, count: take });
      remaining -= take;
      added += take;
      if (canFit <= 0) break;
    }

    if (added > 0) {
      bus.emit('ui:refresh');
    }
    if (remaining > 0) bus.emit('cargo:full');
    return { added, rejected: remaining, full: remaining > 0 };
  }

  /** Remove up to `count` of an item; returns how many were actually removed. */
  remove(itemId: string, count = 1): number {
    let left = count;
    for (let i = this.stacks.length - 1; i >= 0 && left > 0; i--) {
      const s = this.stacks[i];
      if (s.itemId !== itemId) continue;
      const take = Math.min(left, s.count);
      s.count -= take;
      left -= take;
      if (s.count <= 0) this.stacks.splice(i, 1);
    }
    if (left < count) bus.emit('ui:refresh');
    return count - left;
  }

  removeStack(stack: ItemStack, count = stack.count): number {
    const i = this.stacks.indexOf(stack);
    if (i < 0) return 0;
    const take = Math.min(count, stack.count);
    stack.count -= take;
    if (stack.count <= 0) this.stacks.splice(i, 1);
    bus.emit('ui:refresh');
    return take;
  }

  has(itemId: string, count = 1): boolean {
    return this.countOf(itemId) >= count;
  }

  clear(): ItemStack[] {
    const out = this.stacks;
    this.stacks = [];
    bus.emit('ui:refresh');
    return out;
  }

  /** Total market value of everything aboard. */
  totalValue(): number {
    let v = 0;
    for (const s of this.stacks) {
      const def = itemById(s.itemId);
      if (!def) continue;
      if (def.needsIdentification && !s.identified) continue;
      v += stackValue(def, {
        condition: s.condition, quality: s.quality, sizeCm: s.sizeCm, count: s.count,
      });
    }
    return v;
  }

  sort(mode: SortMode): void {
    const key = (s: ItemStack): [number, string] => {
      const def = itemById(s.itemId);
      if (!def) return [99, s.itemId];
      switch (mode) {
        case 'value':
          return [-stackValue(def, { condition: s.condition, quality: s.quality, sizeCm: s.sizeCm }), def.name];
        case 'name':
          return [0, def.name];
        case 'mass':
          return [-stackMass(def, s), def.name];
        case 'category':
        default:
          return [CATEGORY_ORDER.indexOf(def.category), def.name];
      }
    };
    this.stacks.sort((a, b) => {
      const ka = key(a), kb = key(b);
      return ka[0] - kb[0] || ka[1].localeCompare(kb[1]);
    });
    bus.emit('ui:refresh');
  }

  /** Drop the least valuable stack to make room; used by the quick-jettison. */
  jettisonWorst(): ItemStack | null {
    let worst: ItemStack | null = null;
    let worstScore = Infinity;
    for (const s of this.stacks) {
      const def = itemById(s.itemId);
      if (!def || this.favourites.has(s.itemId)) continue;
      const v = stackValue(def, { condition: s.condition, quality: s.quality, sizeCm: s.sizeCm });
      const score = v / Math.max(0.05, stackMass(def, s));
      if (score < worstScore) { worstScore = score; worst = s; }
    }
    if (!worst) return null;
    const def = itemById(worst.itemId);
    this.removeStack(worst);
    toast(`Jettisoned ${def?.name ?? worst.itemId}`, 'warn');
    return worst;
  }

  /** Everything of one category, for the market and museum screens. */
  byCategory(category: string): ItemStack[] {
    return this.stacks.filter((s) => itemById(s.itemId)?.category === category);
  }

  /** A shallow copy suitable for saving. */
  serialise(): ItemStack[] {
    return this.stacks.map((s) => ({ ...s }));
  }
}

const CATEGORY_ORDER = [
  'specimen', 'artifact', 'souvenir', 'mineral', 'organic', 'scrap',
  'component', 'consumable', 'data', 'key',
];

/** True when a stack carries per-item detail that stops it merging. */
function hasPerItemDetail(s: ItemStack): boolean {
  return s.sizeCm !== undefined || s.condition !== undefined ||
    s.quality !== undefined || s.variant !== undefined;
}

/** Convenience for the many systems that just want a definition and a stack. */
export function describeStack(stack: ItemStack): { def: ItemDef | undefined; label: string } {
  const def = itemById(stack.itemId);
  if (!def) return { def: undefined, label: stack.itemId };
  let label = def.name;
  if (stack.sizeCm) label += ` (${stack.sizeCm.toFixed(0)} cm)`;
  if (stack.count > 1) label += ` ×${stack.count}`;
  return { def, label };
}
