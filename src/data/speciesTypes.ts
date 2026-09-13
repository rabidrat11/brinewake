/**
 * Species definitions.
 *
 * A species is an anatomy, a palette, a habitat and a behaviour. The renderer
 * turns the first two into a mesh; the ecology system turns the last two into
 * something that swims about. Everything the catalogue shows comes from here.
 */

import type { Anatomy, CreaturePalette } from '../procedural/creatureBuilder';
import type { Rarity } from '../procedural/palette';
import { mixHex, shift } from '../procedural/palette';

export type CreatureGroup =
  | 'fish' | 'shark' | 'ray' | 'eel' | 'crustacean' | 'cephalopod'
  | 'jelly' | 'echinoderm' | 'micro' | 'worm' | 'leviathan' | 'anomaly';

export type Behaviour =
  | 'school'        // tight shoals, turn together
  | 'loose'         // loose aggregation
  | 'solitary'      // wanders alone
  | 'territorial'   // holds a patch and defends it
  | 'curious'       // approaches the submarine
  | 'hider'         // stays near cover, bolts when approached
  | 'lightAttracted'
  | 'lightShy'
  | 'scavenger'     // seeks the seabed and wrecks
  | 'burrower'      // sits in sediment, emerges rarely
  | 'ambush'        // motionless, then a sudden dart
  | 'follower'      // trails the submarine at a distance
  | 'migratory'     // long straight transits
  | 'drifter'       // carried by the current
  | 'sessile'       // does not move from its anchor
  | 'patrol';       // predictable circuits

export type CaptureMethod =
  | 'rod' | 'net' | 'trap' | 'lure' | 'sampler' | 'drone' | 'photo' | 'scan' | 'claw';

export type DayPhase = 'day' | 'night' | 'dawn' | 'dusk' | 'any';

export interface SpeciesDef {
  id: string;
  name: string;
  /** Mock-binomial; adds a lot of charm to the catalogue for very little cost. */
  latin?: string;
  group: CreatureGroup;
  rarity: Rarity;
  /** Region ids where it occurs. */
  regions: string[];
  /** Depth band in metres. */
  depth: [number, number];
  /** Adult length range in centimetres. */
  size: [number, number];
  behaviour: Behaviour;
  /** When it is active. */
  active?: DayPhase[];
  /** Ways the player can obtain or record it. */
  capture: CaptureMethod[];
  /** Baits this species prefers, by item id. */
  bait?: string[];
  /** Base market value for an average specimen. */
  value: number;
  /** Research points for the first study. */
  research: number;
  /** Which discipline it advances. */
  discipline?: 'biology' | 'oceanography' | 'abyssal' | 'geology';
  /** Swim speed in m/s. */
  speed: number;
  /** Turning agility, 0.2 sluggish .. 2 darting. */
  agility: number;
  /** How wary it is of the submarine, 0 fearless .. 1 flees instantly. */
  wariness: number;
  /** School size range, when schooling. */
  school?: [number, number];
  /** Anatomy overrides. */
  anatomy: Partial<Anatomy>;
  /** Base and accent colour; the rest of the palette is derived. */
  colors: [string, string];
  /** Full palette override, when the derived one is not right. */
  palette?: Partial<CreaturePalette>;
  /** Vertex animation mode: 0 swim, 1 pulse, 2 undulate, 3 flap, 4 drift, 5 scuttle, 6 jet, 7 sway. */
  anim: number;
  /** Catalogue description. */
  description: string;
  /** A short observation that appears once the species is fully researched. */
  note?: string;
  /** Cannot be kept: photograph, scan or tag only. */
  protected?: boolean;
  /** Appears only after this research node or quest flag. */
  requires?: string;
  /** Weight in the spawn table relative to siblings. */
  weight?: number;
  /** Item id produced when caught; defaults to `spec_<id>`. */
  item?: string;
  /** Colour variants: extra hue shifts that appear as distinct specimens. */
  variants?: number;
}

/**
 * Derive a full creature palette from the species' two authored colours.
 * Belly is a desaturated, lightened base; fins pick up the accent; the eye is
 * a warm off-white unless the species overrides it.
 */
export function derivePalette(def: SpeciesDef): CreaturePalette {
  const [base, accent] = def.colors;
  const p: CreaturePalette = {
    base,
    belly: shift(mixHex(base, '#f2ece0', 0.55), 0, -0.25, 0.14),
    accent,
    fin: mixHex(base, accent, 0.55),
    glow: shift(accent, 0, 0.2, 0.28),
    eye: '#f4efe2',
  };
  return { ...p, ...(def.palette ?? {}) };
}

/** Fill in the anatomy defaults a species did not specify. */
export function resolveAnatomy(def: SpeciesDef, base: Anatomy): Anatomy {
  return { ...base, ...def.anatomy, extras: def.anatomy.extras ?? base.extras };
}

/** Average size, used for value and cargo maths. */
export function averageSize(def: SpeciesDef): number {
  return (def.size[0] + def.size[1]) / 2;
}
