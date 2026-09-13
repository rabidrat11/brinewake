/**
 * Minerals, scrap and natural materials.
 *
 * These are the things the ocean floor is actually made of, and the things
 * every upgrade is eventually paid for with.
 */

import type { ItemDef } from '../../items/itemTypes';

export const MATERIAL_ITEMS: ItemDef[] = [
  // --- minerals ---------------------------------------------------------
  {
    id: 'quartz_pebble', name: 'Quartz Pebble', category: 'mineral', rarity: 'common',
    value: 6, mass: 0.3, stack: 40, model: 'pebble', colors: ['#e8e4dc', '#c8c4bc'],
    material: true, discipline: 'geology', researchValue: 2,
    foundIn: ['lantern_bay', 'vermilion_shelf'],
    description: 'A water-clear lump of silica, rounded by a few thousand years of being knocked about.',
  },
  {
    id: 'iron_nodule', name: 'Iron Nodule', category: 'mineral', rarity: 'common',
    value: 9, mass: 0.5, stack: 40, model: 'nodule', colors: ['#7a5a44', '#48342a'],
    material: true, discipline: 'geology', researchValue: 3,
    foundIn: ['lantern_bay', 'kelp_cathedral', 'blue_drop'],
    description: 'Ferrous concretion. Rusty on the outside, dense and grey within.',
  },
  {
    id: 'copper_nodule', name: 'Copper Nodule', category: 'mineral', rarity: 'common',
    value: 16, mass: 0.5, stack: 40, model: 'nodule', colors: ['#b4713c', '#5fa88a'],
    material: true, discipline: 'geology', researchValue: 4,
    foundIn: ['kelp_cathedral', 'vermilion_shelf', 'emberfield'],
    description: 'Bright green where the seawater has got at it, salmon-pink where it has not.',
  },
  {
    id: 'manganese_nodule', name: 'Manganese Nodule', category: 'mineral', rarity: 'common',
    value: 22, mass: 0.7, stack: 30, model: 'nodule', colors: ['#3a3630', '#5c564c'],
    material: true, discipline: 'geology', researchValue: 6,
    foundIn: ['blue_drop', 'gloaming_canyon', 'nightfall_plain'],
    description:
      'A black potato that took ten million years to grow, one atomic layer at a time, ' +
      'around a shark tooth.',
    lore: 'Cut one open and you can count the layers like tree rings.',
  },
  {
    id: 'cobalt_crust', name: 'Cobalt Crust', category: 'mineral', rarity: 'uncommon',
    value: 46, mass: 0.8, stack: 24, model: 'slab', colors: ['#3f4a6b', '#7a86a8'],
    material: true, discipline: 'geology', researchValue: 9,
    foundIn: ['blue_drop', 'gloaming_canyon', 'emberfield', 'glasswork'],
    description: 'Blue-black pavement that grows on bare rock where the current keeps it swept clean.',
  },
  {
    id: 'sulphide_chunk', name: 'Sulphide Chunk', category: 'mineral', rarity: 'uncommon',
    value: 52, mass: 0.9, stack: 24, model: 'shard', colors: ['#6b5c3a', '#c8a03c'],
    material: true, discipline: 'geology', researchValue: 10,
    foundIn: ['emberfield'],
    description: 'Brassy, brittle, and warm to the manipulator when freshly broken off a chimney.',
  },
  {
    id: 'thermal_mineral', name: 'Thermal Mineral', category: 'mineral', rarity: 'rare',
    value: 118, mass: 0.6, stack: 16, model: 'crystal', colors: ['#e0623a', '#ffb765'],
    material: true, discipline: 'geology', researchValue: 20,
    foundIn: ['emberfield'],
    description:
      'Crystallises only in water above sixty degrees. It holds its heat for hours after ' +
      'you bring it up, which is the entire reason anyone wants it.',
  },
  {
    id: 'obsidian_shard', name: 'Obsidian Shard', category: 'mineral', rarity: 'common',
    value: 24, mass: 0.4, stack: 30, model: 'shard', colors: ['#14141a', '#2e2e38'],
    material: true, discipline: 'geology', researchValue: 6,
    foundIn: ['emberfield', 'halloway_deep'],
    description: 'Volcanic glass with an edge sharper than any blade the workshop can grind.',
  },
  {
    id: 'gold_flake', name: 'Gold Flake', category: 'mineral', rarity: 'rare',
    value: 165, mass: 0.1, stack: 20, model: 'flake', colors: ['#e8c05c', '#f6e2a0'],
    material: true, discipline: 'geology', researchValue: 14,
    foundIn: ['emberfield', 'glasswork'],
    description: 'Precipitated out of vent fluid in flakes the size of a fingernail.',
  },
  {
    id: 'phosphor_crystal', name: 'Phosphor Crystal', category: 'mineral', rarity: 'uncommon',
    value: 74, mass: 0.4, stack: 20, model: 'crystal', colors: ['#8fe0c8', '#d8fff0'],
    material: true, discipline: 'geology', researchValue: 15,
    foundIn: ['gloaming_canyon', 'glasswork'],
    description: 'Holds a lamp beam for a minute or two after the lamp goes off.',
  },
  {
    id: 'rare_crystal', name: 'Glasswork Crystal', category: 'mineral', rarity: 'rare',
    value: 210, mass: 0.7, stack: 12, model: 'crystal', colors: ['#a8dcf0', '#e0f6ff'],
    material: true, discipline: 'geology', researchValue: 26,
    foundIn: ['glasswork'],
    description: 'Optically perfect for eighty centimetres. Nobody can explain how it grew that clean.',
  },
  {
    id: 'prism_shard', name: 'Prism Shard', category: 'mineral', rarity: 'uncommon',
    value: 96, mass: 0.4, stack: 20, model: 'shard', colors: ['#c8a2f2', '#f0e0ff'],
    material: true, discipline: 'geology', researchValue: 18,
    foundIn: ['glasswork'],
    description: 'Splits a lamp beam into nine distinct colours, three of which have no name.',
  },
  {
    id: 'starlight_geode', name: 'Starlight Geode', category: 'mineral', rarity: 'exotic',
    value: 480, mass: 1.4, stack: 6, model: 'geode', colors: ['#4a5266', '#a8f0ff'],
    material: true, discipline: 'geology', researchValue: 48, donatable: true,
    foundIn: ['glasswork', 'brinewake_trench'],
    description:
      'Grey and unremarkable until you crack it, and then a cavity full of needles that ' +
      'hold light without any light going in.',
  },
  {
    id: 'ember_geode', name: 'Ember Geode', category: 'mineral', rarity: 'rare',
    value: 265, mass: 1.3, stack: 8, model: 'geode', colors: ['#4a3028', '#ff9a4c'],
    material: true, discipline: 'geology', researchValue: 32, donatable: true,
    foundIn: ['emberfield'],
    description: 'A hollow basalt ball lined with orange crystal, still faintly warm.',
  },
  {
    id: 'meteoric_iron', name: 'Meteoric Iron', category: 'mineral', rarity: 'rare',
    value: 320, mass: 1.6, stack: 8, model: 'nodule', colors: ['#5c5f68', '#8f939c'],
    material: true, discipline: 'geology', researchValue: 38, donatable: true,
    foundIn: ['nightfall_plain', 'brinewake_trench'],
    description:
      'It fell into the ocean before there was anyone to see it. Nickel-iron, with a crystal ' +
      'structure that cannot form anywhere warmer than deep space.',
  },
  {
    id: 'abyssal_compound', name: 'Abyssal Compound', category: 'mineral', rarity: 'rare',
    value: 240, mass: 0.6, stack: 12, model: 'flake', colors: ['#2c3a4c', '#6fd0c0'],
    material: true, discipline: 'abyssal', researchValue: 34,
    foundIn: ['nightfall_plain', 'brinewake_trench'],
    description: 'A salt that only stays a salt below three kilometres. Above that it simply stops.',
  },
  {
    id: 'orichalcum_ingot', name: 'Orichalcum Ingot', category: 'mineral', rarity: 'exotic',
    value: 620, mass: 2.2, stack: 6, model: 'ingot', colors: ['#c88a3c', '#f0d090'],
    material: true, discipline: 'archaeology', researchValue: 60, donatable: true,
    needsIdentification: true,
    foundIn: ['halloway_deep', 'glasswork', 'brinewake_trench'],
    description:
      'A cast bar of a copper alloy nobody has been able to reproduce. Cast, note. Somebody ' +
      'melted this and poured it into a mould.',
    lore: 'Every ingot recovered so far carries the same three-line mark on one face.',
  },
  {
    id: 'unnamed_alloy', name: 'Unnamed Alloy', category: 'mineral', rarity: 'legendary',
    value: 1450, mass: 1.8, stack: 4, model: 'ingot', colors: ['#38304c', '#c0a0ff'],
    material: true, discipline: 'abyssal', researchValue: 140, donatable: true,
    needsIdentification: true,
    foundIn: ['brinewake_trench'],
    description:
      'Assays as fourteen elements in proportions that should not form a solid. It does, and ' +
      'it is stronger than anything in the workshop.',
  },
  {
    id: 'deepsteel_plate', name: 'Deepsteel Plate', category: 'mineral', rarity: 'uncommon',
    value: 130, mass: 2.4, stack: 12, model: 'slab', colors: ['#4a4e58', '#787d88'],
    material: true, discipline: 'engineering', researchValue: 16,
    foundIn: ['glasswork', 'nightfall_plain', 'brinewake_trench'],
    description: 'Salvaged plating from something that was built to be down here. Not by us.',
  },
  {
    id: 'void_pearl', name: 'Void Pearl', category: 'mineral', rarity: 'exotic',
    value: 720, mass: 0.2, stack: 8, model: 'pearl', colors: ['#1a1826', '#7f5fd0'],
    discipline: 'abyssal', researchValue: 66, donatable: true,
    foundIn: ['nightfall_plain', 'brinewake_trench'],
    description:
      'A pearl that absorbs light instead of returning it. Held up to a lamp it looks like a ' +
      'hole cut in the water.',
  },
  {
    id: 'lumen_pearl', name: 'Lumen Pearl', category: 'mineral', rarity: 'rare',
    value: 285, mass: 0.2, stack: 12, model: 'pearl', colors: ['#e0f8ff', '#a8e0ff'],
    discipline: 'biology', researchValue: 30, donatable: true,
    foundIn: ['gloaming_canyon', 'halloway_deep', 'nightfall_plain'],
    description: 'Grown by something, around something. It gives out a steady, cold, faint light.',
  },
  {
    id: 'pearl', name: 'Pearl', category: 'mineral', rarity: 'uncommon',
    value: 128, mass: 0.1, stack: 20, model: 'pearl', colors: ['#f6f0e4', '#e0d8c8'],
    discipline: 'biology', researchValue: 10, donatable: true,
    foundIn: ['vermilion_shelf'],
    description: 'The oyster spent four years making this out of an irritation.',
  },
  {
    id: 'vent_chimney_core', name: 'Chimney Core', category: 'mineral', rarity: 'uncommon',
    value: 88, mass: 2.8, stack: 8, model: 'chunk', colors: ['#3a3630', '#c07040'],
    material: true, discipline: 'geology', researchValue: 22, donatable: true,
    foundIn: ['emberfield'], toolTier: 2,
    description: 'A cross-section cut from a live vent chimney. Banded like an onion.',
  },

  // --- scrap ------------------------------------------------------------
  {
    id: 'scrap_plate', name: 'Steel Plate', category: 'scrap', rarity: 'common',
    value: 8, mass: 1.2, stack: 24, model: 'plate', colors: ['#6b7078', '#8a4c38'],
    material: true, hasCondition: true, discipline: 'engineering', researchValue: 2,
    foundIn: ['lantern_bay', 'kelp_cathedral', 'blue_drop'],
    description: 'Off something. Nobody in the harbour is going to ask what.',
  },
  {
    id: 'scrap_wire', name: 'Copper Wire', category: 'scrap', rarity: 'common',
    value: 11, mass: 0.4, stack: 40, model: 'coil', colors: ['#b4713c', '#3a3a3a'],
    material: true, discipline: 'engineering', researchValue: 2,
    foundIn: ['lantern_bay'],
    description: 'A coil of it, tarred and mostly intact.',
  },
  {
    id: 'scrap_gear', name: 'Bronze Gear', category: 'scrap', rarity: 'common',
    value: 18, mass: 0.7, stack: 24, model: 'gear', colors: ['#a8874c', '#5f9c7a'],
    material: true, hasCondition: true, discipline: 'engineering', researchValue: 4,
    foundIn: ['kelp_cathedral', 'vermilion_shelf'],
    description: 'Forty-one teeth, three of them missing.',
  },
  {
    id: 'scrap_valve', name: 'Brass Valve', category: 'scrap', rarity: 'common',
    value: 26, mass: 0.9, stack: 20, model: 'valve', colors: ['#c8a45c', '#4a4e56'],
    material: true, hasCondition: true, discipline: 'engineering', researchValue: 5,
    foundIn: ['vermilion_shelf', 'blue_drop'],
    description: 'Seized solid. The workshop can free it.',
  },
  {
    id: 'scrap_pressure_valve', name: 'Pressure Valve', category: 'scrap', rarity: 'uncommon',
    value: 62, mass: 1.1, stack: 16, model: 'valve', colors: ['#8f939c', '#c8a45c'],
    material: true, hasCondition: true, discipline: 'engineering', researchValue: 10,
    foundIn: ['gloaming_canyon', 'emberfield'],
    description: 'Rated to two hundred atmospheres, and it looks like it meant it.',
  },
  {
    id: 'scrap_battery', name: 'Spent Cell', category: 'scrap', rarity: 'common',
    value: 20, mass: 1.5, stack: 16, model: 'cell', colors: ['#3f4a55', '#a8c44c'],
    material: true, hasCondition: true, discipline: 'engineering', researchValue: 5,
    foundIn: ['blue_drop'],
    description: 'Dead, leaking, and full of perfectly good lead.',
  },
  {
    id: 'scrap_bearing', name: 'Steel Bearing', category: 'scrap', rarity: 'common',
    value: 14, mass: 0.5, stack: 30, model: 'gear', colors: ['#8a8f97', '#5c5f66'],
    material: true, discipline: 'engineering', researchValue: 3,
    foundIn: ['kelp_cathedral', 'vermilion_shelf'],
    description: 'Still spins. That is more than can be said for most of what comes up.',
  },
  {
    id: 'scrap_hull_rivet', name: 'Hull Rivets', category: 'scrap', rarity: 'common',
    value: 7, mass: 0.3, stack: 50, model: 'rivets', colors: ['#7a5a44', '#8a8f97'],
    material: true, discipline: 'engineering', researchValue: 2,
    foundIn: ['lantern_bay', 'blue_drop'],
    description: 'A handful of them, still in the shape of the plate they used to hold.',
  },
  {
    id: 'scrap_lamp_housing', name: 'Lamp Housing', category: 'scrap', rarity: 'uncommon',
    value: 44, mass: 1.0, stack: 12, model: 'lamp', colors: ['#8a8f97', '#c8e0e8'],
    material: true, hasCondition: true, discipline: 'engineering', researchValue: 8,
    foundIn: ['blue_drop', 'gloaming_canyon'],
    description: 'The glass is intact. That is genuinely surprising.',
  },
  {
    id: 'scrap_propeller_blade', name: 'Propeller Blade', category: 'scrap', rarity: 'uncommon',
    value: 58, mass: 2.0, stack: 8, model: 'blade', colors: ['#a8874c', '#6b7078'],
    material: true, hasCondition: true, discipline: 'engineering', researchValue: 9,
    foundIn: ['kelp_cathedral', 'blue_drop'],
    description: 'One blade of four. Bent, but the bronze is worth having.',
  },
  {
    id: 'derelict_beacon', name: 'Derelict Beacon', category: 'scrap', rarity: 'rare',
    value: 190, mass: 2.4, stack: 4, model: 'beacon', colors: ['#3f4a55', '#e0623a'],
    material: true, hasCondition: true, discipline: 'engineering', researchValue: 28,
    donatable: true, foundIn: ['nightfall_plain'],
    description:
      'Still transmitting, on a frequency nobody uses, in a code the harbour master does not ' +
      'recognise. The battery should have died forty years ago.',
  },

  // --- natural materials ------------------------------------------------
  {
    id: 'clam_shell', name: 'Clam Shell', category: 'organic', rarity: 'common',
    value: 5, mass: 0.3, stack: 40, model: 'shell', colors: ['#e0d4b8', '#b8a480'],
    material: true, discipline: 'biology', researchValue: 2,
    foundIn: ['lantern_bay'],
    description: 'Both halves, still hinged. Somebody ate well.',
  },
  {
    id: 'abalone_shell', name: 'Abalone Shell', category: 'organic', rarity: 'uncommon',
    value: 38, mass: 0.4, stack: 24, model: 'shell', colors: ['#6f8fa8', '#e0c0f0'],
    material: true, donatable: true, discipline: 'biology', researchValue: 6,
    foundIn: ['kelp_cathedral'],
    description: 'Dull outside, and inside a sheet of nacre that changes colour as you turn it.',
  },
  {
    id: 'conch_shell', name: 'Conch Shell', category: 'organic', rarity: 'uncommon',
    value: 42, mass: 0.8, stack: 16, model: 'conch', colors: ['#f0d8b0', '#e08f7c'],
    material: true, donatable: true, discipline: 'biology', researchValue: 7,
    foundIn: ['vermilion_shelf'],
    description: 'Hold it to your ear and you hear your own blood, which is a slight disappointment.',
  },
  {
    id: 'coral_fragment', name: 'Coral Fragment', category: 'organic', rarity: 'common',
    value: 12, mass: 0.4, stack: 30, model: 'coral', colors: ['#e8927c', '#f0d0b0'],
    material: true, discipline: 'biology', researchValue: 3,
    foundIn: ['vermilion_shelf'],
    description: 'A broken branch. It will not regrow, so take the loose ones.',
  },
  {
    id: 'kelp_holdfast', name: 'Kelp Holdfast', category: 'organic', rarity: 'common',
    value: 10, mass: 0.6, stack: 24, model: 'holdfast', colors: ['#4a6b2e', '#7a6a3f'],
    material: true, discipline: 'biology', researchValue: 3,
    foundIn: ['kelp_cathedral'],
    description: 'The root mass of a plant that grew forty metres on nothing but light.',
  },
  {
    id: 'whale_bone', name: 'Whale Vertebra', category: 'organic', rarity: 'uncommon',
    value: 68, mass: 3.2, stack: 6, model: 'bone', colors: ['#e6dfd0', '#c0b8a4'],
    material: true, donatable: true, discipline: 'biology', researchValue: 14,
    foundIn: ['blue_drop', 'gloaming_canyon', 'nightfall_plain'],
    description:
      'A single vertebra the size of a footstool. A whale fall feeds a patch of seabed for ' +
      'thirty years and this is what is left at the end.',
  },
  {
    id: 'sea_glass', name: 'Sea Glass', category: 'organic', rarity: 'common',
    value: 9, mass: 0.1, stack: 50, model: 'pebble', colors: ['#8fc8b8', '#c8e0d8'],
    donatable: true, discipline: 'oceanography', researchValue: 2,
    foundIn: ['vermilion_shelf', 'blue_drop'],
    description: 'A bottle, forty years of surf, and now this.',
  },
  {
    id: 'wake_filament_sample', name: 'Filament Sample', category: 'organic', rarity: 'rare',
    value: 270, mass: 0.3, stack: 10, model: 'vial', colors: ['#9f7fe8', '#e0d0ff'],
    material: true, discipline: 'abyssal', researchValue: 44,
    foundIn: ['brinewake_trench'], tool: 'sampler',
    description:
      'A length of the filament that runs through the trench. It is still glowing in the ' +
      'specimen tank, four days later, with no source of energy.',
  },
  {
    id: 'strange_organic', name: 'Unclassified Tissue', category: 'organic', rarity: 'rare',
    value: 190, mass: 0.4, stack: 10, model: 'vial', colors: ['#7fd0c0', '#e0f8f0'],
    material: true, discipline: 'abyssal', researchValue: 36,
    foundIn: ['gloaming_canyon', 'nightfall_plain'], tool: 'sampler',
    description: 'It is alive, it is not any phylum on the chart, and it keeps warm.',
  },
  {
    id: 'lost_boot', name: 'Lost Boot', category: 'scrap', rarity: 'common',
    value: 3, mass: 0.6, stack: 12, model: 'boot', colors: ['#4a3a30', '#6b5a48'],
    foundIn: ['lantern_bay'],
    description: 'One boot. There is always exactly one boot.',
  },
  {
    id: 'ceramic_shard', name: 'Ceramic Shard', category: 'artifact', rarity: 'common',
    value: 14, mass: 0.2, stack: 40, model: 'shard', colors: ['#d8cbb4', '#5f7a9c'],
    donatable: true, discipline: 'archaeology', researchValue: 4,
    foundIn: ['lantern_bay', 'vermilion_shelf'],
    description: 'Blue glaze on white. The pattern is a bird, or half of one.',
  },
  {
    id: 'glass_bottle', name: 'Glass Bottle', category: 'souvenir', rarity: 'common',
    value: 11, mass: 0.4, stack: 24, model: 'bottle', colors: ['#7fa88f', '#c8dcc8'],
    donatable: true, discipline: 'archaeology', researchValue: 3,
    foundIn: ['lantern_bay'],
    description: 'Hand-blown, seams down both sides, a bubble trapped in the shoulder.',
  },
  {
    id: 'glass_float', name: 'Net Float', category: 'souvenir', rarity: 'uncommon',
    value: 34, mass: 0.5, stack: 16, model: 'float', colors: ['#5fa8b0', '#a8dce0'],
    donatable: true, discipline: 'archaeology', researchValue: 5,
    foundIn: ['kelp_cathedral'],
    description: 'A green glass ball in a rotted rope net. It has been drifting since before the harbour was paved.',
  },
];
