/** Shape of a region definition. Data lives in `src/data/regions.ts`. */

export interface RegionPalette {
  /** Ambient water colour used for fog and distance tint. */
  water: string;
  /** Deep background colour behind everything. */
  void: string;
  /** Primary sediment colour. */
  sand: string;
  /** Secondary sediment / gravel. */
  sandAlt: string;
  /** Rock family, dark to light. */
  rock: [string, string, string];
  /** Accent used for flora, coral and detail objects. */
  accent: string;
  accentAlt: string;
  /** Colour of ambient bioluminescence and particles. */
  glow: string;
  /** Ambient light colour. */
  ambient: string;
  /** Directional (sun/moon-derived) light colour. */
  sun: string;
}

export interface TerrainParams {
  /** Seabed depth in metres at the region centre. */
  baseDepth: number;
  /** Vertical amplitude of medium-scale relief. */
  amplitude: number;
  /** Horizontal feature size in metres; larger = smoother, grander. */
  scale: number;
  /** Mix of ridged (1) versus rolling (0) noise. */
  ridged: number;
  /** Domain warp strength — kills the "noise mush" look. */
  warp: number;
  /** Extra high-frequency roughness. */
  detail: number;
  /** How steeply cliffs form (0 rolling dunes .. 1 sheer walls). */
  cliffiness: number;
  /** Boulder scatter density multiplier. */
  boulders: number;
}

export interface FloraEntry {
  /** Builder key, resolved by `procedural/flora.ts`. */
  kind: string;
  /** Instances per 100 m x 100 m tile at full density. */
  density: number;
  /** Depth band this flora tolerates. */
  depth?: [number, number];
  /** Maximum seabed slope (0 flat .. 1 vertical) it will grow on. */
  maxSlope?: number;
  /** Scale multiplier range. */
  scale?: [number, number];
  /** Colour override; otherwise derived from the region accent. */
  colors?: string[];
  /** Emissive strength 0..1. */
  glow?: number;
}

export interface ScatterEntry {
  /** Item id in the item database. */
  item: string;
  /** Relative weight within this region's scatter table. */
  weight: number;
  /** Only spawn between these depths. */
  depth?: [number, number];
  /** Requires a specific tool tier to harvest, e.g. 'drill:2'. */
  requires?: string;
}

export interface RegionDef {
  id: string;
  /** Display name. */
  name: string;
  /** One-line evocative subtitle used on the map and arrival card. */
  subtitle: string;
  /** Longer description for the catalogue. */
  description: string;
  /** Progression index, 0 = starting waters. */
  order: number;
  /** World-space centre of influence. */
  centre: [number, number];
  /** Influence radius in metres. */
  radius: number;
  /** Depth band the region occupies, for the map and for gating. */
  depthRange: [number, number];
  /** Crush depth (metres) the submarine must survive to explore this safely. */
  requiredDepthRating: number;
  palette: RegionPalette;
  terrain: TerrainParams;
  flora: FloraEntry[];
  scatter: ScatterEntry[];
  /** Ambient particle density multiplier (marine snow). */
  snow: number;
  /** Base fog density; combined with the depth curve at runtime. */
  fog: number;
  /** Creature population multiplier. */
  life: number;
  /** Music/ambience cue key. */
  ambience: string;
  /** Sonar hue for this region on the map. */
  mapColor: string;
  /** Free-text hazard note shown on the map. */
  hazard?: string;
  /** Currents that push the submarine, in m/s. */
  current?: [number, number, number];
  /** Temperature in Celsius — matters for thermal shielding. */
  temperature: number;
}
