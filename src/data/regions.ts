/**
 * The ten regions of Brinewake.
 *
 * These are art direction as data. Every palette here was chosen against the
 * others so that a descent reads as one continuous painting: turquoise gives
 * way to jade, jade to slate blue, slate to violet, violet to ember, ember to
 * bone, and finally to a black that is only ever broken by living light.
 */

import type { RegionDef } from '../world/regionTypes';

export const REGIONS: RegionDef[] = [
  {
    id: 'lantern_bay',
    name: 'Lantern Bay',
    subtitle: 'Where the harbour lights end and the water begins',
    description:
      'A sheltered crescent of sand and eelgrass, warm enough to swim in and shallow enough ' +
      'that the afternoon reaches the bottom. Half the town has dropped something here at ' +
      'some point, and most of it is still down there.',
    order: 0,
    centre: [0, 420],
    radius: 980,
    depthRange: [3, 46],
    requiredDepthRating: 0,
    palette: {
      water: '#5fc9c2',
      void: '#8fdcd0',
      sand: '#cdb37c',
      sandAlt: '#b39a68',
      rock: ['#4b5750', '#63705f', '#828c76'],
      accent: '#5f9455',
      accentAlt: '#8fbf62',
      glow: '#bff6e6',
      ambient: '#8fd8d2',
      sun: '#fff2cf',
    },
    terrain: {
      baseDepth: 22, amplitude: 13, scale: 115, ridged: 0.2,
      warp: 0.6, detail: 0.4, cliffiness: 0.35, boulders: 0.9,
    },
    flora: [
      { kind: 'eelgrass', density: 58, maxSlope: 0.45, scale: [0.7, 1.5] },
      { kind: 'seaLettuce', density: 16, maxSlope: 0.6, scale: [0.6, 1.2] },
      { kind: 'kelpSmall', density: 5, depth: [12, 46], maxSlope: 0.4 },
      { kind: 'barnacleCluster', density: 8, maxSlope: 1 },
      { kind: 'sandTuft', density: 30, maxSlope: 0.35 },
    ],
    scatter: [
      { item: 'scrap_plate', weight: 10 },
      { item: 'scrap_wire', weight: 8 },
      { item: 'glass_bottle', weight: 9 },
      { item: 'clam_shell', weight: 14 },
      { item: 'quartz_pebble', weight: 7 },
      { item: 'iron_nodule', weight: 6 },
      { item: 'lost_boot', weight: 5 },
      { item: 'ceramic_shard', weight: 7 },
      { item: 'copper_coin', weight: 4 },
      { item: 'brass_compass', weight: 1 },
      { item: 'toy_submarine', weight: 1 },
      { item: 'bottle_with_note', weight: 2 },
    ],
    snow: 0.35, fog: 0.00465, life: 1.15,
    ambience: 'bay',
    mapColor: '#63c8bd',
    temperature: 17,
  },

  {
    id: 'kelp_cathedral',
    name: 'The Kelp Cathedral',
    subtitle: 'Green columns, green light, green silence',
    description:
      'Giant kelp grows in colonnades here, forty metres from holdfast to canopy, and the ' +
      'light comes down between them in shafts. Sound behaves strangely. Fishermen have ' +
      'always been slightly reluctant to talk about it.',
    order: 1,
    centre: [-980, 1340],
    radius: 860,
    depthRange: [24, 98],
    requiredDepthRating: 60,
    palette: {
      water: '#2f8f7c',
      void: '#1d6b5f',
      sand: '#a89871',
      sandAlt: '#8b7f5e',
      rock: ['#36423a', '#4a5745', '#657057'],
      accent: '#3f7a3a',
      accentAlt: '#87b04a',
      glow: '#c8f7b4',
      ambient: '#4f9e8b',
      sun: '#e9f5c0',
    },
    terrain: {
      baseDepth: 58, amplitude: 26, scale: 140, ridged: 0.4,
      warp: 0.8, detail: 0.5, cliffiness: 0.55, boulders: 1.2,
    },
    flora: [
      { kind: 'giantKelp', density: 17, maxSlope: 0.55, scale: [0.7, 1.45] },
      { kind: 'kelpSmall', density: 14, maxSlope: 0.6 },
      { kind: 'eelgrass', density: 18, maxSlope: 0.5 },
      { kind: 'seaLettuce', density: 12 },
      { kind: 'featherStar', density: 6, maxSlope: 1 },
      { kind: 'sandTuft', density: 12, maxSlope: 0.3 },
    ],
    scatter: [
      { item: 'scrap_plate', weight: 8 },
      { item: 'scrap_gear', weight: 6 },
      { item: 'iron_nodule', weight: 9 },
      { item: 'copper_nodule', weight: 7 },
      { item: 'abalone_shell', weight: 8 },
      { item: 'kelp_holdfast', weight: 10 },
      { item: 'glass_float', weight: 5 },
      { item: 'fishing_lure_old', weight: 4 },
      { item: 'silver_spoon', weight: 2 },
      { item: 'pocket_watch', weight: 1 },
      { item: 'ships_bell', weight: 1 },
    ],
    snow: 0.5, fog: 0.00682, life: 1.35,
    ambience: 'kelp',
    mapColor: '#4fa86a',
    temperature: 14,
  },

  {
    id: 'vermilion_shelf',
    name: 'The Vermilion Shelf',
    subtitle: 'A city of small animals, built out of limestone and patience',
    description:
      'Warm-water reef stacked on the bones of older reef. Everything here is either ' +
      'brightly coloured or trying very hard to look like something that is. The densest ' +
      'concentration of life above four hundred metres.',
    order: 2,
    centre: [980, 1280],
    radius: 900,
    depthRange: [30, 165],
    requiredDepthRating: 120,
    palette: {
      water: '#2c9aae',
      void: '#1a6f88',
      sand: '#d6bd8b',
      sandAlt: '#bb9e70',
      rock: ['#69503f', '#8c6b52', '#ad8763'],
      accent: '#e8806f',
      accentAlt: '#f0b25e',
      glow: '#ffd6b0',
      ambient: '#5cc2c8',
      sun: '#fff0cd',
    },
    terrain: {
      baseDepth: 74, amplitude: 36, scale: 100, ridged: 0.65,
      warp: 1.0, detail: 0.7, cliffiness: 0.75, boulders: 1.0,
    },
    flora: [
      { kind: 'brainCoral', density: 18, maxSlope: 0.7, scale: [0.7, 1.7] },
      { kind: 'staghornCoral', density: 24, maxSlope: 0.8 },
      { kind: 'fanCoral', density: 20, maxSlope: 1 },
      { kind: 'tubeSponge', density: 14, maxSlope: 1 },
      { kind: 'anemone', density: 16, maxSlope: 0.9 },
      { kind: 'featherStar', density: 10 },
      { kind: 'sandTuft', density: 10, maxSlope: 0.3 },
    ],
    scatter: [
      { item: 'coral_fragment', weight: 14 },
      { item: 'conch_shell', weight: 10 },
      { item: 'pearl', weight: 3 },
      { item: 'quartz_pebble', weight: 8 },
      { item: 'copper_nodule', weight: 8 },
      { item: 'scrap_valve', weight: 6 },
      { item: 'amphora_shard', weight: 7 },
      { item: 'ancient_coin', weight: 4 },
      { item: 'enamel_badge', weight: 3 },
      { item: 'diver_helmet', weight: 1 },
      { item: 'ceramic_cat', weight: 1 },
      { item: 'sea_glass', weight: 9 },
    ],
    snow: 0.4, fog: 0.00589, life: 1.6,
    ambience: 'reef',
    mapColor: '#e8806f',
    temperature: 19,
  },

  {
    id: 'blue_drop',
    name: 'The Blue Drop',
    subtitle: 'The shelf ends. Everything after this is falling.',
    description:
      'The continental edge, where the seabed simply stops and the water below turns from ' +
      'blue to a colour with no name. The most vertigo-inducing place in the archipelago, ' +
      'and the one every pilot remembers their first sight of.',
    order: 3,
    centre: [40, 2460],
    radius: 1180,
    depthRange: [120, 430],
    requiredDepthRating: 260,
    palette: {
      water: '#1a6d93',
      void: '#0c3f63',
      sand: '#94907c',
      sandAlt: '#787564',
      rock: ['#2c3946', '#42525f', '#5c6d79'],
      accent: '#4f8fb0',
      accentAlt: '#7fb2c9',
      glow: '#b6e8ff',
      ambient: '#2f7fa4',
      sun: '#d8ecff',
    },
    terrain: {
      baseDepth: 260, amplitude: 78, scale: 240, ridged: 0.45,
      warp: 0.6, detail: 0.5, cliffiness: 0.9, boulders: 0.5,
    },
    flora: [
      { kind: 'seaWhip', density: 12, maxSlope: 1, scale: [0.8, 1.6] },
      { kind: 'glassSponge', density: 8, maxSlope: 1 },
      { kind: 'fanCoral', density: 7, depth: [120, 260], maxSlope: 1 },
      { kind: 'tubeWorm', density: 6 },
    ],
    scatter: [
      { item: 'manganese_nodule', weight: 12 },
      { item: 'iron_nodule', weight: 9 },
      { item: 'scrap_plate', weight: 7 },
      { item: 'scrap_battery', weight: 5 },
      { item: 'whale_bone', weight: 4 },
      { item: 'sea_glass', weight: 6 },
      { item: 'brass_sextant', weight: 2 },
      { item: 'antique_binoculars', weight: 2 },
      { item: 'sounding_lead', weight: 4 },
      { item: 'cobalt_crust', weight: 5, depth: [260, 430] },
    ],
    snow: 0.9, fog: 0.00806, life: 0.9,
    ambience: 'drop',
    mapColor: '#4f8fb0',
    current: [0.6, -0.15, 0.2],
    temperature: 9,
  },

  {
    id: 'gloaming_canyon',
    name: 'Gloaming Canyon',
    subtitle: 'The last of the light, spent carefully',
    description:
      'A submarine canyon cut through violet mudstone, narrow enough in places to touch both ' +
      'walls. This is the twilight zone: not dark, but never bright, and full of animals that ' +
      'have decided to make their own light rather than wait for anyone else s.',
    order: 4,
    centre: [-1540, 3320],
    radius: 1060,
    depthRange: [360, 820],
    requiredDepthRating: 560,
    palette: {
      water: '#243a72',
      void: '#141d4a',
      sand: '#6f6a85',
      sandAlt: '#57536b',
      rock: ['#2e2a4c', '#413a63', '#584f7c'],
      accent: '#7d5fc0',
      accentAlt: '#4f7fd0',
      glow: '#9ee8ff',
      ambient: '#2b3f78',
      sun: '#7f9fd8',
    },
    terrain: {
      baseDepth: 560, amplitude: 130, scale: 200, ridged: 0.8,
      warp: 1.1, detail: 0.7, cliffiness: 0.95, boulders: 0.8,
    },
    flora: [
      { kind: 'seaWhip', density: 14, maxSlope: 1, glow: 0.1 },
      { kind: 'glassSponge', density: 12, maxSlope: 1 },
      { kind: 'lanternPolyp', density: 16, maxSlope: 1, glow: 0.85 },
      { kind: 'tubeWorm', density: 9 },
      { kind: 'bambooCoral', density: 8, maxSlope: 0.9, glow: 0.2 },
    ],
    scatter: [
      { item: 'manganese_nodule', weight: 11 },
      { item: 'cobalt_crust', weight: 10 },
      { item: 'phosphor_crystal', weight: 7 },
      { item: 'scrap_pressure_valve', weight: 6 },
      { item: 'whale_bone', weight: 5 },
      { item: 'ancient_coin', weight: 4 },
      { item: 'bronze_figurine', weight: 3 },
      { item: 'sealed_crate', weight: 2 },
      { item: 'strange_key', weight: 1 },
      { item: 'lumen_pearl', weight: 2 },
    ],
    snow: 1.3, fog: 0.01054, life: 1.0,
    ambience: 'canyon',
    mapColor: '#7d5fc0',
    current: [-0.4, 0, 0.5],
    hazard: 'Narrow passages. Reduced manoeuvring room.',
    temperature: 5,
  },

  {
    id: 'emberfield',
    name: 'The Emberfield',
    subtitle: 'Warm ground, in the coldest water there is',
    description:
      'A field of hydrothermal vents on young basalt. Mineral-rich water comes out of the ' +
      'seabed at temperatures that would boil at the surface, and around each chimney there ' +
      'is a small, furious, entirely sunless ecosystem.',
    order: 5,
    centre: [1520, 3540],
    radius: 980,
    depthRange: [700, 1320],
    requiredDepthRating: 950,
    palette: {
      water: '#14202e',
      void: '#0a1018',
      sand: '#3a3630',
      sandAlt: '#2b2823',
      rock: ['#1c1c20', '#2e2c30', '#454247'],
      accent: '#e0623a',
      accentAlt: '#f2a24e',
      glow: '#ffb765',
      ambient: '#22303f',
      sun: '#3f5468',
    },
    terrain: {
      baseDepth: 980, amplitude: 90, scale: 150, ridged: 0.65,
      warp: 0.8, detail: 1.1, cliffiness: 0.7, boulders: 1.4,
    },
    flora: [
      { kind: 'tubeWorm', density: 26, maxSlope: 1, colors: ['#e04a3a', '#f4e8dd'] },
      { kind: 'ventBacterialMat', density: 20, maxSlope: 0.7, glow: 0.25 },
      { kind: 'glassSponge', density: 7 },
      { kind: 'ventShrimpNest', density: 10 },
    ],
    scatter: [
      { item: 'sulphide_chunk', weight: 14 },
      { item: 'copper_nodule', weight: 10 },
      { item: 'cobalt_crust', weight: 9 },
      { item: 'thermal_mineral', weight: 8 },
      { item: 'obsidian_shard', weight: 9 },
      { item: 'gold_flake', weight: 4 },
      { item: 'scrap_pressure_valve', weight: 5 },
      { item: 'vent_chimney_core', weight: 3 },
      { item: 'ember_geode', weight: 2 },
    ],
    snow: 0.7, fog: 0.01302, life: 0.85,
    ambience: 'vents',
    mapColor: '#e0623a',
    hazard: 'Superheated plumes. Thermal shielding advised.',
    temperature: 4,
  },

  {
    id: 'halloway_deep',
    name: 'Halloway Deep',
    subtitle: 'Someone built here. Nobody agrees on when.',
    description:
      'A drowned terrace of dressed stone, colonnades and stairs, a kilometre and a half ' +
      'below a sea that has not been that low in any recorded interglacial. The Institute ' +
      'lists it as a natural formation. The Institute has not been down here.',
    order: 6,
    centre: [220, 4680],
    radius: 1040,
    depthRange: [1200, 2150],
    requiredDepthRating: 1700,
    palette: {
      water: '#101a34',
      void: '#070b1a',
      sand: '#4e4a52',
      sandAlt: '#3a3740',
      rock: ['#33323d', '#4a4954', '#666472'],
      accent: '#5ec0b0',
      accentAlt: '#c9b48a',
      glow: '#7fe6d8',
      ambient: '#16223f',
      sun: '#33507a',
    },
    terrain: {
      baseDepth: 1650, amplitude: 110, scale: 220, ridged: 0.4,
      warp: 0.5, detail: 0.6, cliffiness: 0.75, boulders: 0.9,
    },
    flora: [
      { kind: 'glassSponge', density: 14, maxSlope: 1 },
      { kind: 'lanternPolyp', density: 12, glow: 0.7 },
      { kind: 'bambooCoral', density: 10, glow: 0.25 },
      { kind: 'stoneLichen', density: 22, maxSlope: 1, glow: 0.1 },
    ],
    scatter: [
      { item: 'carved_block', weight: 10 },
      { item: 'halloway_tile', weight: 12 },
      { item: 'bronze_figurine', weight: 7 },
      { item: 'ancient_coin', weight: 8 },
      { item: 'ceremonial_bowl', weight: 5 },
      { item: 'obsidian_shard', weight: 6 },
      { item: 'glyph_fragment', weight: 6 },
      { item: 'lumen_pearl', weight: 4 },
      { item: 'sealed_crate', weight: 3 },
      { item: 'orichalcum_ingot', weight: 2 },
      { item: 'tide_astrolabe', weight: 1 },
    ],
    snow: 1.1, fog: 0.01488, life: 0.75,
    ambience: 'ruins',
    mapColor: '#5ec0b0',
    temperature: 3,
  },

  {
    id: 'glasswork',
    name: 'The Glasswork',
    subtitle: 'A trench that refracts its own darkness',
    description:
      'Vast intergrown mineral formations, some of them thirty metres tall, clear enough ' +
      'that a lamp thrown against one lights a hundred more. Nobody has satisfactorily ' +
      'explained how the crystals grew this large, or this deliberately.',
    order: 7,
    centre: [-1760, 5460],
    radius: 980,
    depthRange: [1900, 3350],
    requiredDepthRating: 2900,
    palette: {
      water: '#0a1424',
      void: '#04070f',
      sand: '#4a5560',
      sandAlt: '#333c46',
      rock: ['#26313e', '#38465a', '#516378'],
      accent: '#8fd8f0',
      accentAlt: '#c8a2f2',
      glow: '#a8f0ff',
      ambient: '#0f1c33',
      sun: '#2a4470',
    },
    terrain: {
      baseDepth: 2600, amplitude: 190, scale: 180, ridged: 0.9,
      warp: 1.2, detail: 0.9, cliffiness: 1, boulders: 1.6,
    },
    flora: [
      { kind: 'crystalSpine', density: 22, maxSlope: 1, glow: 0.4 },
      { kind: 'glassSponge', density: 16 },
      { kind: 'lanternPolyp', density: 10, glow: 0.9 },
      { kind: 'stoneLichen', density: 14, glow: 0.15 },
    ],
    scatter: [
      { item: 'rare_crystal', weight: 12 },
      { item: 'prism_shard', weight: 11 },
      { item: 'cobalt_crust', weight: 8 },
      { item: 'gold_flake', weight: 6 },
      { item: 'phosphor_crystal', weight: 9 },
      { item: 'orichalcum_ingot', weight: 4 },
      { item: 'glyph_fragment', weight: 5 },
      { item: 'starlight_geode', weight: 3 },
      { item: 'deepsteel_plate', weight: 4 },
    ],
    snow: 1.4, fog: 0.01674, life: 0.6,
    ambience: 'glass',
    mapColor: '#8fd8f0',
    hazard: 'Crystal fields. Hull abrasion risk at speed.',
    temperature: 2,
  },

  {
    id: 'nightfall_plain',
    name: 'The Nightfall Plain',
    subtitle: 'Flat, black, and larger than every country you know',
    description:
      'Abyssal plain. Sediment two hundred metres thick, laid down one millimetre a century. ' +
      'Almost nothing happens here, which is precisely why the things that do happen are so ' +
      'extraordinary.',
    order: 8,
    centre: [960, 6280],
    radius: 1450,
    depthRange: [3100, 5450],
    requiredDepthRating: 5000,
    palette: {
      water: '#05080f',
      void: '#010206',
      sand: '#3c3a3a',
      sandAlt: '#2a2929',
      rock: ['#1a1c20', '#282b30', '#3a3e45'],
      accent: '#4fd0c0',
      accentAlt: '#b06fd0',
      glow: '#7fffe0',
      ambient: '#070d16',
      sun: '#132038',
    },
    terrain: {
      baseDepth: 4400, amplitude: 45, scale: 420, ridged: 0.15,
      warp: 0.4, detail: 0.35, cliffiness: 0.3, boulders: 0.4,
    },
    flora: [
      { kind: 'seaLily', density: 12, maxSlope: 0.5, glow: 0.1 },
      { kind: 'lanternPolyp', density: 8, glow: 1 },
      { kind: 'glassSponge', density: 9 },
      { kind: 'abyssalFan', density: 7, glow: 0.3 },
    ],
    scatter: [
      { item: 'manganese_nodule', weight: 18 },
      { item: 'abyssal_compound', weight: 9 },
      { item: 'whale_bone', weight: 6 },
      { item: 'meteoric_iron', weight: 4 },
      { item: 'deepsteel_plate', weight: 6 },
      { item: 'lumen_pearl', weight: 5 },
      { item: 'sealed_crate', weight: 3 },
      { item: 'derelict_beacon', weight: 2 },
      { item: 'void_pearl', weight: 2 },
    ],
    snow: 1.7, fog: 0.01922, life: 0.5,
    ambience: 'abyss',
    mapColor: '#4fd0c0',
    temperature: 1.5,
  },

  {
    id: 'brinewake_trench',
    name: 'The Brinewake',
    subtitle: 'The deepest water anyone has a name for',
    description:
      'A hadal trench nine kilometres down, holding a hundred and ten megapascals and ' +
      'something else besides. The pressure here would flatten every other submarine in ' +
      'the harbour. The light here was not made by the sun and was not made by us.',
    order: 9,
    centre: [-240, 7480],
    radius: 1250,
    depthRange: [5200, 9200],
    requiredDepthRating: 9000,
    palette: {
      water: '#020308',
      void: '#000103',
      sand: '#2e2b33',
      sandAlt: '#1d1b22',
      rock: ['#111015', '#1c1b22', '#2b2932'],
      accent: '#9f7fe8',
      accentAlt: '#4fe0c8',
      glow: '#c0a8ff',
      ambient: '#04060d',
      sun: '#0a1020',
    },
    terrain: {
      baseDepth: 7600, amplitude: 340, scale: 260, ridged: 0.85,
      warp: 1.4, detail: 0.8, cliffiness: 1, boulders: 1.1,
    },
    flora: [
      { kind: 'abyssalFan', density: 14, glow: 0.55 },
      { kind: 'lanternPolyp', density: 14, glow: 1 },
      { kind: 'crystalSpine', density: 10, glow: 0.6 },
      { kind: 'wakeFilament', density: 18, glow: 0.9 },
    ],
    scatter: [
      { item: 'abyssal_compound', weight: 14 },
      { item: 'void_pearl', weight: 7 },
      { item: 'meteoric_iron', weight: 6 },
      { item: 'deepsteel_plate', weight: 8 },
      { item: 'glyph_fragment', weight: 7 },
      { item: 'wake_filament_sample', weight: 9 },
      { item: 'orichalcum_ingot', weight: 5 },
      { item: 'starlight_geode', weight: 4 },
      { item: 'unnamed_alloy', weight: 3 },
    ],
    snow: 2.1, fog: 0.02232, life: 0.42,
    ambience: 'wake',
    mapColor: '#9f7fe8',
    hazard: 'Extreme pressure. Hull integrity critical.',
    current: [0.2, 0.35, -0.3],
    temperature: 2,
  },
];

export const REGION_BY_ID = new Map(REGIONS.map((r) => [r.id, r]));

export function regionById(id: string): RegionDef {
  const r = REGION_BY_ID.get(id);
  if (!r) throw new Error(`Unknown region: ${id}`);
  return r;
}

/** The harbour sits at the world origin; everything is measured from here. */
export const HARBOUR_POS: [number, number] = [0, -60];
