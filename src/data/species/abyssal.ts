/**
 * The Glasswork, the Nightfall Plain and the Brinewake.
 *
 * The last three regions. From here on the animals stop resembling anything a
 * player has seen before, which is entirely the point.
 */

import type { SpeciesDef } from '../speciesTypes';

export const ABYSSAL_SPECIES: SpeciesDef[] = [
  // --- The Glasswork ----------------------------------------------------
  {
    id: 'prism_shrimp', name: 'Prism Shrimp', latin: 'Vitrocaris refracta',
    group: 'crustacean', rarity: 'common', regions: ['glasswork'], depth: [1900, 3350], size: [4, 9],
    behaviour: 'loose', capture: ['net', 'sampler'], value: 88, research: 22, discipline: 'biology',
    speed: 0.9, agility: 1.3, wariness: 0.35, school: [8, 24],
    anatomy: { body: 'segmented', head: 'none', tail: 'fan', eyes: 'stalked', extras: ['antennae'], girth: 0.17, segments: 7, glow: 0.4 },
    colors: ['#cfe8f4', '#8fd8f0'], anim: 5,
    palette: { base: '#d8eef8', belly: '#f0fbff' },
    description:
      'Transparent even by the standards of deep shrimp, and it lives among crystal. Under a ' +
      'lamp the whole swarm scatters light like a broken chandelier.',
    weight: 11,
  },
  {
    id: 'glasswork_snailfish', name: 'Glasswork Snailfish', latin: 'Careproctus vitreus',
    group: 'fish', rarity: 'common', regions: ['glasswork', 'nightfall_plain'], depth: [2000, 5400], size: [12, 26],
    behaviour: 'loose', capture: ['trap', 'sampler'], bait: ['bait_fish_scrap'],
    value: 96, research: 26, discipline: 'biology',
    speed: 0.7, agility: 0.6, wariness: 0.3,
    anatomy: { body: 'globe', head: 'blunt', tail: 'fan', dorsal: 'fringe', pectoral: 'long', eyes: 'tiny', extras: ['sucker'], girth: 0.24 },
    colors: ['#e8d8e0', '#b090a8'], anim: 0,
    palette: { base: '#eddfe6' },
    description:
      'Pink, gelatinous and entirely without scales. Snailfish are the deepest-living fish ' +
      'known and this one is nowhere near the limit.',
    weight: 9,
  },
  {
    id: 'refraction_jelly', name: 'Refraction Medusa', latin: 'Colobonema vitreum',
    group: 'jelly', rarity: 'uncommon', regions: ['glasswork'], depth: [1900, 3350], size: [10, 22],
    behaviour: 'drifter', capture: ['sampler', 'photo'], value: 138, research: 40, discipline: 'biology',
    speed: 0.5, agility: 0.25, wariness: 0.1,
    anatomy: { body: 'bell', head: 'none', tail: 'none', eyes: 'none', girth: 0.18, glow: 0.75 },
    colors: ['#a8d8f0', '#e8f8ff'], anim: 1,
    description:
      'When something touches it, it drops its tentacles — all of them at once, still ' +
      'glowing — and jets away in the dark leaving them behind.',
    weight: 6,
  },
  {
    id: 'glass_squid', name: 'Cranch Squid', latin: 'Cranchia vitrea',
    group: 'cephalopod', rarity: 'uncommon', regions: ['glasswork', 'nightfall_plain'], depth: [1800, 4000], size: [15, 35],
    behaviour: 'drifter', capture: ['drone', 'net'], value: 186, research: 46, discipline: 'abyssal',
    speed: 0.9, agility: 1.1, wariness: 0.5,
    anatomy: { body: 'mantle', head: 'none', tail: 'none', pectoral: 'small', eyes: 'large', extras: ['tentacles', 'photophores'], girth: 0.24, glow: 0.5 },
    colors: ['#d0e8f0', '#7fc8e0'], anim: 6,
    palette: { base: '#dcf0f6' },
    description:
      'A transparent barrel with two enormous eyes and a light organ under each, so that even ' +
      'the eyes cast no shadow. When frightened it inflates into a ball and turns opaque.',
    weight: 5,
  },
  {
    id: 'crystal_urchin', name: 'Crystal Urchin', latin: 'Dermechinus vitreus',
    group: 'echinoderm', rarity: 'common', regions: ['glasswork'], depth: [1900, 3350], size: [5, 12],
    behaviour: 'sessile', capture: ['claw', 'sampler'], value: 72, research: 20, discipline: 'geology',
    speed: 0.02, agility: 0.05, wariness: 0,
    anatomy: { body: 'globe', head: 'none', tail: 'none', dorsal: 'none', pectoral: 'none', eyes: 'none', extras: ['spines'], girth: 0.3, glow: 0.35 },
    colors: ['#b0d8e8', '#e8f8ff'], anim: 7,
    description: 'Grows its spines out of the same mineral as the trench walls, and glows faintly along them.',
    weight: 10,
  },
  {
    id: 'glasswork_grenadier', name: 'Prismtail', latin: 'Coryphaenoides vitreus',
    group: 'fish', rarity: 'common', regions: ['glasswork'], depth: [2000, 3350], size: [45, 95],
    behaviour: 'scavenger', capture: ['trap', 'rod'], bait: ['bait_fish_scrap'],
    value: 108, research: 24, discipline: 'biology',
    speed: 1.0, agility: 0.6, wariness: 0.3,
    anatomy: { body: 'spindle', head: 'pointed', tail: 'whip', dorsal: 'fringe', pectoral: 'small', eyes: 'large', extras: ['photophores'], girth: 0.13, glow: 0.35 },
    colors: ['#5f6f80', '#a8e0f0'], anim: 0,
    description: 'The local rattail, silvered rather than grey, with a line of pale lights along the belly.',
    weight: 9,
  },
  {
    id: 'lightbearer_worm', name: 'Lightbearer', latin: 'Swima vitrea',
    group: 'worm', rarity: 'rare', regions: ['glasswork'], depth: [2200, 3350], size: [4, 10],
    behaviour: 'drifter', capture: ['sampler', 'drone'], value: 268, research: 68, discipline: 'abyssal',
    speed: 0.6, agility: 1.0, wariness: 0.6,
    anatomy: { body: 'worm', head: 'blunt', tail: 'none', eyes: 'none', extras: ['filaments', 'glowSpots'], girth: 0.09, segments: 12, glow: 0.95 },
    colors: ['#8fd0e8', '#ffffff'], anim: 2,
    description:
      'Swims with a row of luminous bombs along its front end. Detaches one when threatened, ' +
      'which burns green for several seconds while the worm leaves.',
    note: 'They grow back over a few days. Each worm carries eight.',
    weight: 3,
  },
  {
    id: 'glasswork_anemone', name: 'Facet Anemone', latin: 'Actinernus vitreus',
    group: 'echinoderm', rarity: 'common', regions: ['glasswork'], depth: [1900, 3350], size: [10, 28],
    behaviour: 'sessile', capture: ['sampler', 'claw'], value: 64, research: 18, discipline: 'biology',
    speed: 0, agility: 0, wariness: 0,
    anatomy: { body: 'star', head: 'none', tail: 'none', eyes: 'none', segments: 14, girth: 0.3, glow: 0.45 },
    colors: ['#9fb0f0', '#e0e8ff'], anim: 7,
    description: 'Anchors in a crystal crevice and opens into a pale blue rosette a hand across.',
    weight: 9,
  },
  {
    id: 'glasswork_chimaera', name: 'Silver Chimaera', latin: 'Harriotta vitrea',
    group: 'shark', rarity: 'rare', regions: ['glasswork'], depth: [2100, 3350], size: [80, 140],
    behaviour: 'solitary', capture: ['photo', 'trap'], bait: ['bait_fish_scrap'],
    value: 320, research: 78, discipline: 'abyssal',
    speed: 1.2, agility: 0.7, wariness: 0.55,
    anatomy: { body: 'spindle', head: 'pointed', tail: 'whip', dorsal: 'spiny', pectoral: 'wing', eyes: 'large', pattern: 'plain', girth: 0.11 },
    colors: ['#c0c8d4', '#8fa8c0'], anim: 0,
    description:
      'A long, pointed snout packed with electroreceptors, sweeping the sediment like a ' +
      'metal detector. Silver against black crystal is a striking thing to meet.',
    weight: 2,
  },
  {
    id: 'facet_isopod', name: 'Facet Isopod', latin: 'Bathynomus vitreus',
    group: 'crustacean', rarity: 'uncommon', regions: ['glasswork'], depth: [2000, 3350], size: [22, 46],
    behaviour: 'scavenger', capture: ['trap', 'claw'], bait: ['bait_fish_scrap'],
    value: 164, research: 38, discipline: 'biology',
    speed: 0.4, agility: 0.5, wariness: 0.15,
    anatomy: { body: 'segmented', head: 'none', tail: 'fan', eyes: 'large', extras: ['plates', 'legs', 'antennae'], girth: 0.24, segments: 9, glow: 0.2 },
    colors: ['#d0d8e0', '#8fa0b0'], anim: 5,
    description: 'Armour plates the colour of frost, each one with a faint internal shine.',
    weight: 7,
  },
  {
    id: 'prism_angler', name: 'Prism Angler', latin: 'Chaenophryne vitrea',
    group: 'fish', rarity: 'exotic', regions: ['glasswork'], depth: [2400, 3350], size: [14, 30],
    behaviour: 'ambush', capture: ['lure', 'trap'], bait: ['bait_lumen'],
    value: 448, research: 108, discipline: 'abyssal',
    speed: 0.5, agility: 0.5, wariness: 0.25,
    anatomy: { body: 'globe', head: 'lantern', tail: 'fan', dorsal: 'none', pectoral: 'small', eyes: 'tiny', extras: ['lure', 'filaments'], girth: 0.3, glow: 1 },
    colors: ['#241f2c', '#a8f0ff'], anim: 0,
    description:
      'Its lure is not a single point but a branched, faceted structure that splits the light ' +
      'into a dozen drifting sparks. It looks exactly like a fragment of the trench walls.',
    note: 'The males are a twentieth the size and fuse permanently to the female. Two of the ones caught had three.',
    weight: 1,
  },
  {
    id: 'glasswork_starfish', name: 'Brittlestar Chandelier', latin: 'Ophiocreas vitreus',
    group: 'echinoderm', rarity: 'uncommon', regions: ['glasswork'], depth: [1900, 3350], size: [30, 70],
    behaviour: 'sessile', capture: ['sampler', 'photo'], value: 142, research: 36, discipline: 'biology',
    speed: 0.1, agility: 0.2, wariness: 0,
    anatomy: { body: 'star', head: 'none', tail: 'none', eyes: 'none', segments: 5, girth: 0.16, glow: 0.5 },
    colors: ['#d0c0f0', '#ffffff'], anim: 7,
    description:
      'A basket star wound around a crystal spine, arms branching into hundreds of tips, all ' +
      'of them slowly closing on anything that drifts into them.',
    weight: 5,
  },

  // --- The Nightfall Plain ----------------------------------------------
  {
    id: 'nightfall_holothurian', name: 'Nightfall Cucumber', latin: 'Psychropotes nocturna',
    group: 'echinoderm', rarity: 'common', regions: ['nightfall_plain'], depth: [3100, 5400], size: [15, 40],
    behaviour: 'loose', capture: ['claw', 'sampler'], value: 84, research: 22, discipline: 'biology',
    speed: 0.1, agility: 0.2, wariness: 0.05,
    anatomy: { body: 'barrel', head: 'none', tail: 'none', eyes: 'none', extras: ['frill', 'crest'], girth: 0.24, glow: 0.2 },
    colors: ['#8f6f4a', '#d0a878'], anim: 4,
    description:
      'A sea cucumber the colour of old leather with a single sail on its back. It processes ' +
      'the top centimetre of the abyssal plain, forever.',
    note: 'Between them, these move most of the sediment on the deep seabed. Slowly.',
    weight: 12,
  },
  {
    id: 'nightfall_tripod', name: 'Plain Tripod', latin: 'Bathypterois nocturna',
    group: 'fish', rarity: 'common', regions: ['nightfall_plain'], depth: [3100, 5400], size: [28, 46],
    behaviour: 'sessile', capture: ['photo', 'trap'], value: 118, research: 30, discipline: 'biology',
    speed: 0.4, agility: 0.3, wariness: 0.2,
    anatomy: { body: 'spindle', head: 'pointed', tail: 'trident', dorsal: 'small', pectoral: 'long', eyes: 'tiny', girth: 0.1 },
    colors: ['#c8c0b0', '#7a7264'], anim: 0,
    description: 'Standing on the plain, facing the current, for however long it takes.',
    weight: 8,
  },
  {
    id: 'nightfall_anglerfish', name: 'Blackbeard Angler', latin: 'Melanocetus nocturnus',
    group: 'fish', rarity: 'rare', regions: ['nightfall_plain'], depth: [3200, 5400], size: [16, 34],
    behaviour: 'ambush', capture: ['lure', 'trap'], bait: ['bait_lumen'],
    value: 356, research: 88, discipline: 'abyssal',
    speed: 0.5, agility: 0.5, wariness: 0.2,
    anatomy: { body: 'globe', head: 'lantern', tail: 'fan', dorsal: 'none', pectoral: 'small', eyes: 'tiny', extras: ['lure'], girth: 0.32, glow: 1 },
    colors: ['#191720', '#8fe0ff'], anim: 0,
    description:
      'Black, spherical and almost entirely jaw, with a single blue-white light on a stalk ' +
      'above the mouth. It can swallow prey larger than itself, and frequently does.',
    note: 'Its stomach is elastic and its ribs are hinged. There is not much of a plan beyond that.',
    weight: 3,
  },
  {
    id: 'nightfall_ctenophore', name: 'Comb Drifter', latin: 'Beroe nocturna',
    group: 'jelly', rarity: 'common', regions: ['nightfall_plain', 'brinewake_trench'], depth: [2800, 7000], size: [4, 14],
    behaviour: 'drifter', capture: ['sampler', 'photo'], value: 76, research: 24, discipline: 'biology',
    speed: 0.35, agility: 0.3, wariness: 0,
    anatomy: { body: 'barrel', head: 'none', tail: 'none', eyes: 'none', extras: ['filaments'], girth: 0.2, glow: 0.7 },
    colors: ['#c0a8e0', '#ffe8ff'], anim: 4,
    description:
      'Eight rows of beating hairs run its length, and they diffract the lamplight into ' +
      'travelling rainbows. It is not bioluminescence; it is a comb.',
    note: 'It eats other comb jellies, whole, by unhinging the front of its own body.',
    weight: 10,
  },
  {
    id: 'nightfall_grenadier', name: 'Abyssal Rattail', latin: 'Coryphaenoides nocturnus',
    group: 'fish', rarity: 'common', regions: ['nightfall_plain'], depth: [3100, 5400], size: [50, 105],
    behaviour: 'scavenger', capture: ['trap', 'rod'], bait: ['bait_fish_scrap'],
    value: 124, research: 26, discipline: 'biology',
    speed: 0.9, agility: 0.5, wariness: 0.25,
    anatomy: { body: 'spindle', head: 'pointed', tail: 'whip', dorsal: 'fringe', pectoral: 'small', eyes: 'large', girth: 0.13 },
    colors: ['#4f5460', '#8f96a4'], anim: 0,
    description: 'The first thing to arrive at anything that has died. Usually within the hour.',
    weight: 11,
  },
  {
    id: 'nightfall_sea_spider', name: 'Abyssal Sea Spider', latin: 'Colossendeis nocturna',
    group: 'crustacean', rarity: 'uncommon', regions: ['nightfall_plain', 'brinewake_trench'], depth: [3000, 7500], size: [20, 55],
    behaviour: 'loose', capture: ['claw', 'photo'], value: 196, research: 48, discipline: 'biology',
    speed: 0.3, agility: 0.4, wariness: 0.2,
    anatomy: { body: 'crab', head: 'none', tail: 'none', eyes: 'tiny', extras: ['legs', 'antennae'], girth: 0.1, segments: 6 },
    colors: ['#d8ccb8', '#9a8c74'], anim: 5,
    description:
      'A body barely larger than a thumbnail and legs half a metre long. Its gut runs down ' +
      'the legs, because there is no room for it anywhere else.',
    note: 'The male carries the eggs on a dedicated extra pair of legs. Nothing else does this.',
    weight: 6,
  },
  {
    id: 'nightfall_cusk', name: 'Plainfish', latin: 'Abyssobrotula planities',
    group: 'fish', rarity: 'uncommon', regions: ['nightfall_plain', 'brinewake_trench'], depth: [3400, 8200], size: [12, 22],
    behaviour: 'loose', capture: ['trap', 'sampler'], bait: ['bait_fish_scrap'],
    value: 148, research: 40, discipline: 'abyssal',
    speed: 0.6, agility: 0.5, wariness: 0.2,
    anatomy: { body: 'eel', head: 'blunt', tail: 'pointed', dorsal: 'fringe', pectoral: 'small', eyes: 'none', girth: 0.1 },
    colors: ['#e0d8cc', '#a89c88'], anim: 2,
    description:
      'No eyes at all, in a species whose ancestors had them. Pale, small, and the deepest ' +
      'fish anyone had catalogued until this expedition started.',
    weight: 8,
  },
  {
    id: 'nightfall_vampire_star', name: 'Vampire Star', latin: 'Freyella nocturna',
    group: 'echinoderm', rarity: 'rare', regions: ['nightfall_plain'], depth: [3300, 5400], size: [40, 90],
    behaviour: 'sessile', capture: ['claw', 'photo'], value: 246, research: 58, discipline: 'biology',
    speed: 0.06, agility: 0.1, wariness: 0,
    anatomy: { body: 'star', head: 'none', tail: 'none', eyes: 'none', segments: 12, girth: 0.12, glow: 0.35 },
    colors: ['#7f2a4c', '#e08fa8'], anim: 7,
    description:
      'Twelve arms, each a metre long and no thicker than a pencil, spread flat on the ooze ' +
      'in a perfect wheel. It is deep red where there is nothing to be red for.',
    weight: 3,
  },
  {
    id: 'nightfall_leviathan_jelly', name: 'Nightfall Bell', latin: 'Stygiomedusa nocturna',
    group: 'jelly', rarity: 'legendary', regions: ['nightfall_plain'], depth: [3300, 5400], size: [180, 620],
    behaviour: 'drifter', capture: ['photo', 'scan'], protected: true,
    value: 0, research: 210, discipline: 'abyssal',
    speed: 0.3, agility: 0.1, wariness: 0.1,
    anatomy: { body: 'bell', head: 'none', tail: 'none', eyes: 'none', girth: 0.2, glow: 0.4 },
    colors: ['#5c1826', '#c05070'], anim: 1,
    description:
      'A bell a metre across trailing four dark arms ten metres long. It has been seen ' +
      'perhaps a hundred times in the history of the science. It has no stinging cells at all.',
    note: 'Nobody knows how it feeds. The arms are muscular, not venomous. They simply wrap.',
    weight: 1,
  },
  {
    id: 'nightfall_octopod', name: 'Ghost Octopod', latin: 'Casper nocturna',
    group: 'cephalopod', rarity: 'exotic', regions: ['nightfall_plain'], depth: [3500, 5400], size: [15, 30],
    behaviour: 'hider', capture: ['drone', 'photo'], value: 468, research: 116, discipline: 'abyssal',
    speed: 0.5, agility: 0.8, wariness: 0.45,
    anatomy: { body: 'mantle', head: 'none', tail: 'none', pectoral: 'none', eyes: 'large', extras: ['tentacles'], girth: 0.24 },
    colors: ['#eae6e2', '#c8c0bc'], anim: 6,
    palette: { base: '#f0ece8', belly: '#fbfaf8' },
    description:
      'Entirely white and without a single pigment cell, which is unheard of in an octopus. ' +
      'It broods its eggs on the stalks of dead sponges, for years.',
    note: 'Colour would be pointless here. It has stopped paying for something it cannot use.',
    weight: 2,
  },
  {
    id: 'nightfall_amphipod_giant', name: 'Titan Amphipod', latin: 'Alicella gigantea',
    group: 'crustacean', rarity: 'rare', regions: ['nightfall_plain', 'brinewake_trench'], depth: [4000, 8500], size: [20, 34],
    behaviour: 'scavenger', capture: ['trap'], bait: ['bait_fish_scrap'],
    value: 268, research: 62, discipline: 'abyssal',
    speed: 0.7, agility: 0.9, wariness: 0.2,
    anatomy: { body: 'segmented', head: 'none', tail: 'fan', eyes: 'tiny', extras: ['antennae', 'legs', 'plates'], girth: 0.22, segments: 9 },
    colors: ['#f0e8d0', '#c8b898'], anim: 5,
    description:
      'A shrimp the length of a forearm, thirty times the size of anything comparable in ' +
      'shallow water. Gigantism in the deep is common and badly understood.',
    weight: 4,
  },
  {
    id: 'nightfall_hagfish', name: 'Nightfall Hagfish', latin: 'Eptatretus nocturnus',
    group: 'eel', rarity: 'uncommon', regions: ['nightfall_plain'], depth: [3100, 5400], size: [40, 80],
    behaviour: 'scavenger', capture: ['trap'], bait: ['bait_fish_scrap'],
    value: 132, research: 34, discipline: 'biology',
    speed: 0.6, agility: 0.4, wariness: 0.15,
    anatomy: { body: 'eel', head: 'blunt', tail: 'pointed', dorsal: 'none', pectoral: 'none', eyes: 'none', extras: ['barbels'], girth: 0.07 },
    colors: ['#7a6a68', '#c0b0a8'], anim: 2,
    description:
      'Ties itself in a knot to tear food loose, and produces enough slime in seconds to ' +
      'choke anything that tries to swallow it. It has a skull but no jaw and no spine.',
    note: 'A litre of hagfish makes about twenty litres of slime. Do not put one in the specimen tank.',
    weight: 7,
  },

  // --- The Brinewake ----------------------------------------------------
  {
    id: 'wake_snailfish', name: 'Brinewake Snailfish', latin: 'Pseudoliparis brinewake',
    group: 'fish', rarity: 'uncommon', regions: ['brinewake_trench'], depth: [5200, 8400], size: [15, 28],
    behaviour: 'loose', capture: ['trap', 'sampler'], bait: ['bait_fish_scrap'],
    value: 224, research: 62, discipline: 'abyssal',
    speed: 0.6, agility: 0.6, wariness: 0.25,
    anatomy: { body: 'globe', head: 'blunt', tail: 'fan', dorsal: 'fringe', pectoral: 'long', eyes: 'tiny', girth: 0.24, glow: 0.15 },
    colors: ['#e8e2ee', '#b8a8c8'], anim: 0,
    palette: { base: '#ece8f2' },
    description:
      'The deepest fish in the world, translucent and pale violet, hanging in water at eleven ' +
      'hundred atmospheres as though it were nothing at all.',
    note: 'Its cells are stabilised by a compound that stops proteins collapsing under pressure.',
    weight: 9,
  },
  {
    id: 'wake_holothurian', name: 'Wake Cucumber', latin: 'Elpidia brinewake',
    group: 'echinoderm', rarity: 'common', regions: ['brinewake_trench'], depth: [5200, 9000], size: [6, 16],
    behaviour: 'loose', capture: ['claw', 'sampler'], value: 118, research: 30, discipline: 'biology',
    speed: 0.1, agility: 0.2, wariness: 0.05,
    anatomy: { body: 'barrel', head: 'none', tail: 'none', eyes: 'none', extras: ['legs'], girth: 0.24, segments: 5, glow: 0.25 },
    colors: ['#c8b0d8', '#f0e0ff'], anim: 5,
    description: 'Small, violet and everywhere. They are most of the visible biomass of the trench floor.',
    weight: 13,
  },
  {
    id: 'wake_amphipod', name: 'Hadal Amphipod', latin: 'Hirondellea brinewake',
    group: 'crustacean', rarity: 'common', regions: ['brinewake_trench'], depth: [5200, 9200], size: [2, 5],
    behaviour: 'scavenger', capture: ['trap', 'sampler'], bait: ['bait_fish_scrap'],
    value: 96, research: 26, discipline: 'abyssal',
    speed: 0.8, agility: 1.2, wariness: 0.2, school: [20, 70],
    anatomy: { body: 'segmented', head: 'none', tail: 'fan', eyes: 'none', extras: ['antennae', 'legs'], girth: 0.2, segments: 8 },
    colors: ['#e0d0e8', '#a890b8'], anim: 5,
    description:
      'Its shell is made of aluminium hydroxide, extracted from the trench sediment. In the ' +
      'hadal zone there is not enough calcium to build anything else.',
    note: 'It digests wood. There is no wood down here. Nobody has explained this.',
    weight: 14,
  },
  {
    id: 'wake_lanternjelly', name: 'Wake Lantern', latin: 'Crossota brinewake',
    group: 'jelly', rarity: 'uncommon', regions: ['brinewake_trench'], depth: [5200, 8600], size: [5, 14],
    behaviour: 'drifter', capture: ['sampler', 'photo'], value: 178, research: 46, discipline: 'abyssal',
    speed: 0.4, agility: 0.3, wariness: 0,
    anatomy: { body: 'bell', head: 'none', tail: 'none', eyes: 'none', girth: 0.18, glow: 1 },
    colors: ['#a87fe0', '#e8d0ff'], anim: 1,
    description:
      'Violet, with a ring of light around the bell margin that pulses once every few seconds ' +
      'in no obvious rhythm. In a black trench it is the only thing there is to look at.',
    weight: 9,
  },
  {
    id: 'wake_anemone', name: 'Wake Anemone', latin: 'Galatheanthemum brinewake',
    group: 'echinoderm', rarity: 'common', regions: ['brinewake_trench'], depth: [5400, 9200], size: [8, 22],
    behaviour: 'sessile', capture: ['sampler', 'claw'], value: 128, research: 32, discipline: 'biology',
    speed: 0, agility: 0, wariness: 0,
    anatomy: { body: 'star', head: 'none', tail: 'none', eyes: 'none', segments: 16, girth: 0.28, glow: 0.6 },
    colors: ['#9f7fe8', '#e0d0ff'], anim: 7,
    description: 'Grows in a papery tube on the trench wall and opens into a violet star.',
    weight: 10,
  },
  {
    id: 'wake_serpent', name: 'Wake Serpent', latin: 'Bathysauropsis brinewake',
    group: 'eel', rarity: 'rare', regions: ['brinewake_trench'], depth: [5600, 9000], size: [90, 190],
    behaviour: 'ambush', capture: ['lure', 'trap'], bait: ['bait_lumen'],
    value: 412, research: 102, discipline: 'abyssal',
    speed: 1.3, agility: 0.7, wariness: 0.4,
    anatomy: { body: 'eel', head: 'jawed', tail: 'ribbon', dorsal: 'fringe', pectoral: 'none', eyes: 'none', extras: ['photophores', 'barbels'], girth: 0.075, glow: 0.7 },
    colors: ['#241c34', '#c0a0ff'], anim: 2,
    description:
      'Two metres of blind, black eel with a line of violet lights and a habit of holding ' +
      'perfectly still in the beam until you have decided it is a rock.',
    weight: 4,
  },
  {
    id: 'wake_medusa_worm', name: 'Filament Weaver', latin: 'Chaetopterus brinewake',
    group: 'worm', rarity: 'rare', regions: ['brinewake_trench'], depth: [5400, 9200], size: [20, 50],
    behaviour: 'sessile', capture: ['sampler', 'drone'], value: 336, research: 84, discipline: 'abyssal',
    speed: 0, agility: 0, wariness: 0,
    anatomy: { body: 'worm', head: 'none', tail: 'none', eyes: 'none', extras: ['filaments', 'glowSpots'], girth: 0.07, segments: 15, glow: 0.95 },
    colors: ['#7f5fd0', '#e0d0ff'], anim: 7,
    description:
      'Builds a parchment tube and spins a mucus net inside it, then eats the net and its ' +
      'catch together and spins another. It does this every twenty minutes, forever.',
    note: 'The mucus glows. There is no light down here to justify that, and it does it anyway.',
    weight: 5,
  },
  {
    id: 'wake_octopod', name: 'Trench Octopod', latin: 'Grimpoteuthis brinewake',
    group: 'cephalopod', rarity: 'exotic', regions: ['brinewake_trench'], depth: [5600, 8800], size: [25, 55],
    behaviour: 'drifter', capture: ['drone', 'photo'], value: 620, research: 148, discipline: 'abyssal',
    speed: 0.6, agility: 0.8, wariness: 0.4,
    anatomy: { body: 'mantle', head: 'none', tail: 'none', pectoral: 'wing', eyes: 'large', extras: ['tentacles', 'glowSpots'], girth: 0.26, glow: 0.4 },
    colors: ['#a08fd0', '#e8d8ff'], anim: 3,
    description:
      'A dumbo octopod nine kilometres down, flapping placidly through the deepest water on ' +
      'the planet. It is the single most improbable animal in the catalogue.',
    weight: 2,
  },
  {
    id: 'wake_bristlemouth', name: 'Wake Bristlemouth', latin: 'Cyclothone brinewake',
    group: 'fish', rarity: 'common', regions: ['brinewake_trench', 'nightfall_plain'], depth: [3000, 8000], size: [3, 7],
    behaviour: 'loose', capture: ['net', 'sampler'], value: 82, research: 22, discipline: 'biology',
    speed: 0.8, agility: 0.9, wariness: 0.35, school: [10, 30],
    anatomy: { body: 'spindle', head: 'jawed', tail: 'fan', dorsal: 'small', eyes: 'tiny', extras: ['photophores'], girth: 0.11, glow: 0.6 },
    colors: ['#332c3c', '#8f7fd0'], anim: 0,
    description:
      'By number, the most abundant vertebrate on Earth, and almost nobody has heard of it. ' +
      'There are more of these than there are of everything else with a backbone, combined.',
    weight: 12,
  },
  {
    id: 'wake_glass_sponge_fish', name: 'Spicule Fish', latin: 'Spiculichthys brinewake',
    group: 'fish', rarity: 'exotic', regions: ['brinewake_trench'], depth: [6000, 9200], size: [10, 20],
    behaviour: 'hider', capture: ['drone', 'sampler'], value: 540, research: 130, discipline: 'abyssal',
    speed: 0.5, agility: 0.7, wariness: 0.7,
    anatomy: { body: 'compressed', head: 'pointed', tail: 'fan', dorsal: 'spiny', pectoral: 'long', eyes: 'none', extras: ['spines', 'glowSpots'], girth: 0.16, glow: 0.5 },
    colors: ['#d8d0e8', '#a8f0ff'], anim: 0,
    description:
      'Lives inside the lattice of a glass sponge and appears never to leave it. The spines ' +
      'along its back are silica, and they are grown, not secreted.',
    note: 'Nothing else with a backbone builds anything out of glass. This one does.',
    requires: 'research.abyssal_biology_3',
    weight: 2,
  },
  {
    id: 'wake_lightless', name: 'The Lightless', latin: 'incognita',
    group: 'anomaly', rarity: 'mythic', regions: ['brinewake_trench'], depth: [7600, 9200], size: [200, 400],
    behaviour: 'lightShy', capture: ['photo', 'scan'], protected: true,
    value: 0, research: 480, discipline: 'abyssal',
    speed: 1.8, agility: 0.9, wariness: 0.95,
    anatomy: {
      body: 'ribbon', head: 'none', tail: 'ribbon', dorsal: 'fringe', pectoral: 'none',
      eyes: 'none', extras: ['filaments'], girth: 0.05, glow: 0,
    },
    colors: ['#0a0810', '#1a1424'], anim: 2,
    palette: { base: '#0c0a12', belly: '#0c0a12', fin: '#100c18', glow: '#20182c' },
    description:
      'Four metres of something that is a slightly deeper black than the water it is in. It ' +
      'has no light, no eyes, and no discernible reaction to the submarine except that when ' +
      'the lamps come on it is not there any more.',
    note: 'Sonar returns a shape. Photography returns an absence. Both are correct.',
    requires: 'quest.deepest_signal',
    weight: 1,
  },
];
