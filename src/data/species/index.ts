/** The complete bestiary, assembled and indexed. */

import type { SpeciesDef } from '../speciesTypes';
import { SHALLOW_SPECIES } from './shallow';
import { REEF_SPECIES } from './reef';
import { DEEP_SPECIES } from './deep';
import { ABYSSAL_SPECIES } from './abyssal';
import { LEVIATHAN_SPECIES } from './leviathans';

export const SPECIES: SpeciesDef[] = [
  ...SHALLOW_SPECIES,
  ...REEF_SPECIES,
  ...DEEP_SPECIES,
  ...ABYSSAL_SPECIES,
  ...LEVIATHAN_SPECIES,
];

export const SPECIES_BY_ID = new Map(SPECIES.map((s) => [s.id, s]));

export function speciesById(id: string): SpeciesDef | undefined {
  return SPECIES_BY_ID.get(id);
}

/** All species that can occur in a region at a given depth. */
export function speciesFor(regionId: string, depth: number): SpeciesDef[] {
  return SPECIES.filter(
    (s) => s.regions.includes(regionId) && depth >= s.depth[0] && depth <= s.depth[1],
  );
}

const BY_REGION = new Map<string, SpeciesDef[]>();
for (const s of SPECIES) {
  for (const r of s.regions) {
    let list = BY_REGION.get(r);
    if (!list) {
      list = [];
      BY_REGION.set(r, list);
    }
    list.push(s);
  }
}

export function speciesInRegion(regionId: string): SpeciesDef[] {
  return BY_REGION.get(regionId) ?? [];
}

export const SPECIES_COUNT = SPECIES.length;
