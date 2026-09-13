/**
 * Lantern Bay and the Kelp Cathedral.
 *
 * The first two regions, and the ones a player will spend their opening hours
 * in. Nothing here is dangerous; almost everything is charming.
 */

import type { SpeciesDef } from '../speciesTypes';

export const SHALLOW_SPECIES: SpeciesDef[] = [
  // --- Lantern Bay ------------------------------------------------------
  {
    id: 'silverspine', name: 'Silverspine', latin: 'Argentacus vulgaris',
    group: 'fish', rarity: 'common', regions: ['lantern_bay'], depth: [2, 34], size: [9, 17],
    behaviour: 'school', capture: ['rod', 'net'], bait: ['bait_worm', 'bait_bread'],
    value: 12, research: 4, discipline: 'biology',
    speed: 2.4, agility: 1.5, wariness: 0.45, school: [14, 40],
    anatomy: { body: 'spindle', head: 'blunt', tail: 'forked', dorsal: 'small', pattern: 'countershade', girth: 0.15 },
    colors: ['#b8c6cf', '#4d6c85'], anim: 0,
    description:
      'The most abundant fish in the bay, and the first thing almost every pilot catches. ' +
      'A hand-length shoal fish with a bright lateral stripe that flickers when the school turns.',
    note: 'The whole shoal turns in about a fifth of a second. Nobody is leading.',
    weight: 12,
  },
  {
    id: 'copper_bream', name: 'Copper Bream', latin: 'Sparus aeneus',
    group: 'fish', rarity: 'common', regions: ['lantern_bay', 'kelp_cathedral'], depth: [4, 48], size: [18, 34],
    behaviour: 'loose', capture: ['rod', 'net'], bait: ['bait_worm', 'bait_shrimp'],
    value: 24, research: 5, discipline: 'biology',
    speed: 2.1, agility: 1.1, wariness: 0.5, school: [3, 8],
    anatomy: { body: 'compressed', head: 'blunt', tail: 'forked', dorsal: 'spiny', pattern: 'gradient', girth: 0.2 },
    colors: ['#c8894e', '#6b3f28'], anim: 0,
    description:
      'A deep-bodied fish the colour of an old penny, common over sand and eelgrass. Sold ' +
      'by weight at the market and eaten by roughly everyone in the harbour.',
    note: 'Bream taste better in the months the eelgrass is flowering. No one can explain why.',
    weight: 9,
  },
  {
    id: 'bay_flounder', name: 'Bay Flounder', latin: 'Pleuronectes portus',
    group: 'fish', rarity: 'common', regions: ['lantern_bay'], depth: [3, 30], size: [20, 42],
    behaviour: 'burrower', capture: ['rod', 'net', 'claw'], bait: ['bait_worm'],
    value: 31, research: 7, discipline: 'biology',
    speed: 1.1, agility: 0.6, wariness: 0.25,
    anatomy: { body: 'flat', head: 'shovel', tail: 'fan', dorsal: 'none', pectoral: 'none', pattern: 'mottled', girth: 0.14 },
    colors: ['#a8916a', '#5e4d32'], anim: 3,
    description:
      'Lies under a thin layer of sand with both eyes on its upper side, waiting. You will ' +
      'usually find one by accidentally landing on it.',
    note: 'Flounder larvae start out symmetrical. One eye migrates across the skull over a few weeks.',
    weight: 6,
  },
  {
    id: 'harbour_sprat', name: 'Harbour Sprat', latin: 'Clupea minima',
    group: 'fish', rarity: 'common', regions: ['lantern_bay'], depth: [1, 18], size: [4, 8],
    behaviour: 'school', capture: ['net'], value: 4, research: 3, discipline: 'biology',
    speed: 2.8, agility: 1.9, wariness: 0.7, school: [40, 120],
    anatomy: { body: 'spindle', head: 'pointed', tail: 'forked', dorsal: 'small', pelvic: false, pattern: 'countershade', girth: 0.12 },
    colors: ['#d6e2e8', '#7fa8bf'], anim: 0,
    description:
      'Tiny, silver and numberless. Worthless individually and quite valuable by the netful, ' +
      'which is the entire basis of the harbour economy.',
    weight: 14,
  },
  {
    id: 'lantern_goby', name: 'Lantern Goby', latin: 'Gobius luminis',
    group: 'fish', rarity: 'uncommon', regions: ['lantern_bay'], depth: [5, 40], size: [5, 9],
    behaviour: 'hider', active: ['night', 'dusk'], capture: ['trap', 'sampler'],
    value: 38, research: 12, discipline: 'biology',
    speed: 1.4, agility: 1.8, wariness: 0.6,
    anatomy: { body: 'spindle', head: 'bulbous', tail: 'fan', dorsal: 'tall', eyes: 'large', pattern: 'spots', extras: ['glowSpots'], girth: 0.2, glow: 0.55 },
    colors: ['#5c4a6b', '#ffd98a'], anim: 0,
    description:
      'A thumb-sized goby that lives under stones and comes out after dark with a line of ' +
      'pale gold spots along each flank. The bay is full of them and almost nobody notices.',
    note: 'The spots are bacterial. The goby grows its own light and cannot switch it off.',
    weight: 4,
  },
  {
    id: 'sandclad_crab', name: 'Sandclad Crab', latin: 'Carcinus arenatus',
    group: 'crustacean', rarity: 'common', regions: ['lantern_bay'], depth: [2, 36], size: [8, 16],
    behaviour: 'scavenger', capture: ['trap', 'claw'], bait: ['bait_fish_scrap'],
    value: 19, research: 6, discipline: 'biology',
    speed: 0.7, agility: 0.9, wariness: 0.3,
    anatomy: { body: 'crab', head: 'none', tail: 'none', eyes: 'stalked', extras: ['claws', 'carapace'], girth: 0.3, segments: 4 },
    colors: ['#c2a878', '#7a5a38'], anim: 5,
    description:
      'Decorates its own shell with grains of sand and fragments of shell until it is ' +
      'effectively invisible on the seabed. Extremely bad at this on bare rock.',
    weight: 8,
  },
  {
    id: 'moonshell_snail', name: 'Moonshell', latin: 'Naticarius lunae',
    group: 'echinoderm', rarity: 'common', regions: ['lantern_bay'], depth: [2, 26], size: [4, 9],
    behaviour: 'sessile', capture: ['claw', 'sampler'], value: 14, research: 5, discipline: 'biology',
    speed: 0.1, agility: 0.2, wariness: 0,
    anatomy: { body: 'globe', head: 'none', tail: 'none', dorsal: 'none', pectoral: 'none', eyes: 'none', extras: ['shell'], girth: 0.3 },
    colors: ['#e2d3b4', '#8c6f4a'], anim: 7,
    description:
      'A predatory sea snail that drills a neat round hole through other shells. The bay is ' +
      'littered with its victims, each perforated like a button.',
    weight: 7,
  },
  {
    id: 'ribbon_pipefish', name: 'Ribbon Pipefish', latin: 'Syngnathus taenia',
    group: 'fish', rarity: 'uncommon', regions: ['lantern_bay', 'kelp_cathedral'], depth: [3, 44], size: [12, 24],
    behaviour: 'hider', capture: ['sampler', 'drone'], value: 46, research: 14, discipline: 'biology',
    speed: 0.8, agility: 0.5, wariness: 0.55,
    anatomy: { body: 'eel', head: 'tube', tail: 'none', dorsal: 'small', pectoral: 'none', pattern: 'bands', girth: 0.06 },
    colors: ['#7fa05c', '#c8d88a'], anim: 2,
    description:
      'Hangs vertically among eelgrass blades and sways at exactly the rate the grass does. ' +
      'The males carry the eggs in a pouch along the belly.',
    note: 'It cannot swim against anything much. A strong current simply takes it somewhere else.',
    weight: 4,
  },
  {
    id: 'spotted_ray', name: 'Spotted Ray', latin: 'Raja punctata',
    group: 'ray', rarity: 'uncommon', regions: ['lantern_bay'], depth: [8, 55], size: [45, 85],
    behaviour: 'patrol', capture: ['photo', 'net'], value: 74, research: 20, discipline: 'biology',
    speed: 1.6, agility: 0.8, wariness: 0.4,
    anatomy: { body: 'ray', head: 'none', tail: 'whip', eyes: 'normal', pattern: 'spots', girth: 0.1, wide: 1.05, tall: 0.9 },
    colors: ['#9a8f74', '#3e3729'], anim: 3,
    description:
      'Cruises a few centimetres above the sand with its wingtips brushing the ripples. ' +
      'Utterly placid unless stepped on, which is difficult from a submarine.',
    weight: 3,
  },
  {
    id: 'jewel_anemonefish', name: 'Jewel Anemonefish', latin: 'Amphiprion gemma',
    group: 'fish', rarity: 'uncommon', regions: ['lantern_bay', 'vermilion_shelf'], depth: [4, 40], size: [6, 11],
    behaviour: 'territorial', capture: ['net', 'sampler'], value: 52, research: 15, discipline: 'biology',
    speed: 1.6, agility: 1.7, wariness: 0.35,
    anatomy: { body: 'compressed', head: 'blunt', tail: 'fan', dorsal: 'spiny', pattern: 'bands', girth: 0.22 },
    colors: ['#f08a3c', '#fdf2e0'], anim: 0,
    description:
      'Lives its entire adult life inside one anemone and will square up to a two-tonne ' +
      'submarine on its behalf. It is 9 cm long.',
    note: 'Every one of them is born male. The largest of a pair becomes female and stays that way.',
    weight: 3,
  },
  {
    id: 'glass_shrimp', name: 'Glass Shrimp', latin: 'Palaemon vitreus',
    group: 'crustacean', rarity: 'common', regions: ['lantern_bay', 'kelp_cathedral'], depth: [2, 50], size: [3, 6],
    behaviour: 'loose', capture: ['net', 'trap', 'sampler'], value: 9, research: 4, discipline: 'biology',
    speed: 1.2, agility: 1.6, wariness: 0.5, school: [8, 22],
    anatomy: { body: 'segmented', head: 'none', tail: 'fan', eyes: 'stalked', extras: ['antennae'], girth: 0.16, segments: 7 },
    colors: ['#d8e6e2', '#8fbfae'], anim: 5,
    palette: { base: '#dbeae6', belly: '#f2f8f4' },
    description:
      'Almost perfectly transparent apart from its eyes and a thread of gut. You mostly see ' +
      'a pair of black dots moving through the water with nothing attached.',
    weight: 9,
  },
  {
    id: 'bay_cuttlefish', name: 'Bay Cuttlefish', latin: 'Sepia portus',
    group: 'cephalopod', rarity: 'uncommon', regions: ['lantern_bay', 'kelp_cathedral'], depth: [6, 60], size: [14, 28],
    behaviour: 'curious', capture: ['net', 'drone', 'photo'], value: 88, research: 24, discipline: 'biology',
    speed: 1.5, agility: 1.4, wariness: 0.2,
    anatomy: { body: 'mantle', head: 'none', tail: 'none', pectoral: 'long', eyes: 'large', extras: ['tentacles'], girth: 0.19 },
    colors: ['#b39b78', '#4a3a5c'], anim: 6,
    description:
      'Will follow a submarine for several minutes, changing colour the whole time, then ' +
      'lose interest all at once and jet away backwards.',
    note: 'It is colourblind. It matches colours it cannot see, using polarisation instead.',
    weight: 3,
  },
  {
    id: 'sea_hare', name: 'Marbled Sea Hare', latin: 'Aplysia marmorata',
    group: 'echinoderm', rarity: 'common', regions: ['lantern_bay'], depth: [2, 22], size: [10, 24],
    behaviour: 'sessile', capture: ['claw', 'sampler'], value: 17, research: 6, discipline: 'biology',
    speed: 0.15, agility: 0.2, wariness: 0.1,
    anatomy: { body: 'worm', head: 'blunt', tail: 'none', eyes: 'tiny', extras: ['frill'], girth: 0.2, segments: 9 },
    colors: ['#8a6d55', '#c4a882'], anim: 7,
    description:
      'A large, soft, entirely defenceless sea slug that grazes algae off rock. When alarmed ' +
      'it releases a cloud of purple ink and continues at the same speed.',
    weight: 5,
  },
  {
    id: 'kelp_perch', name: 'Kelp Perch', latin: 'Brachyistius herbae',
    group: 'fish', rarity: 'common', regions: ['lantern_bay', 'kelp_cathedral'], depth: [8, 70], size: [11, 20],
    behaviour: 'loose', capture: ['rod', 'net'], bait: ['bait_shrimp'],
    value: 21, research: 6, discipline: 'biology',
    speed: 1.9, agility: 1.4, wariness: 0.45, school: [5, 14],
    anatomy: { body: 'compressed', head: 'pointed', tail: 'forked', dorsal: 'spiny', pattern: 'stripes', girth: 0.19 },
    colors: ['#a8b463', '#4f6030'], anim: 0,
    description: 'Hovers among kelp fronds nose-up, matching the vertical lines of the stipes.',
    weight: 8,
  },
  {
    id: 'redtail_wrasse', name: 'Redtail Wrasse', latin: 'Labrus rufacauda',
    group: 'fish', rarity: 'uncommon', regions: ['lantern_bay', 'vermilion_shelf'], depth: [6, 60], size: [16, 30],
    behaviour: 'curious', capture: ['rod', 'net'], bait: ['bait_shrimp', 'bait_urchin'],
    value: 44, research: 11, discipline: 'biology',
    speed: 2.0, agility: 1.6, wariness: 0.3,
    anatomy: { body: 'spindle', head: 'pointed', tail: 'fan', dorsal: 'long', pattern: 'gradient', girth: 0.17 },
    colors: ['#4a8f9a', '#d94f3c'], anim: 0,
    description:
      'Inquisitive to the point of nuisance. Will inspect a lamp, a manipulator arm, or a ' +
      'newly disturbed patch of sand, and often gets caught doing it.',
    weight: 5,
  },
  {
    id: 'painted_starfish', name: 'Painted Sea Star', latin: 'Asterias picta',
    group: 'echinoderm', rarity: 'common', regions: ['lantern_bay', 'vermilion_shelf'], depth: [3, 70], size: [10, 26],
    behaviour: 'sessile', capture: ['claw', 'sampler'], value: 16, research: 6, discipline: 'biology',
    speed: 0.05, agility: 0.1, wariness: 0,
    anatomy: { body: 'star', head: 'none', tail: 'none', eyes: 'none', segments: 5, girth: 0.3 },
    colors: ['#e0714f', '#f6d3a8'], anim: 7,
    description:
      'Five arms, no brain, no blood and a stomach it can turn inside out through its mouth. ' +
      'Also, unmistakably, a star.',
    weight: 7,
  },
  {
    id: 'silt_urchin', name: 'Silt Urchin', latin: 'Echinus limosus',
    group: 'echinoderm', rarity: 'common', regions: ['lantern_bay', 'kelp_cathedral'], depth: [4, 80], size: [6, 13],
    behaviour: 'sessile', capture: ['claw'], value: 13, research: 5, discipline: 'biology',
    speed: 0.05, agility: 0.1, wariness: 0,
    anatomy: { body: 'globe', head: 'none', tail: 'none', dorsal: 'none', pectoral: 'none', eyes: 'none', extras: ['spines'], girth: 0.3 },
    colors: ['#6b5f7a', '#2e2740'], anim: 7,
    description:
      'A pincushion that eats kelp holdfasts. Where urchins are abundant the kelp forest is ' +
      'usually in trouble.',
    weight: 8,
  },
  {
    id: 'ghost_pipe_jelly', name: 'Ghost Pipe Jelly', latin: 'Aurelia tenuis',
    group: 'jelly', rarity: 'common', regions: ['lantern_bay', 'kelp_cathedral'], depth: [1, 60], size: [8, 22],
    behaviour: 'drifter', capture: ['sampler', 'photo'], value: 22, research: 8, discipline: 'biology',
    speed: 0.4, agility: 0.15, wariness: 0,
    anatomy: { body: 'bell', head: 'none', tail: 'none', eyes: 'none', girth: 0.16, glow: 0.2 },
    colors: ['#cfe6ea', '#8fb6c8'], anim: 1,
    description:
      'Four pale horseshoes visible through the bell are its gonads; everything else is ' +
      'essentially water. Pulses slowly upward all day and sinks all night.',
    weight: 6,
  },

  // --- Kelp Cathedral ---------------------------------------------------
  {
    id: 'cathedral_rockfish', name: 'Cathedral Rockfish', latin: 'Sebastes basilica',
    group: 'fish', rarity: 'common', regions: ['kelp_cathedral'], depth: [22, 95], size: [24, 46],
    behaviour: 'territorial', capture: ['rod', 'trap'], bait: ['bait_shrimp', 'bait_fish_scrap'],
    value: 42, research: 10, discipline: 'biology',
    speed: 1.3, agility: 0.9, wariness: 0.35,
    anatomy: { body: 'spindle', head: 'bulbous', tail: 'fan', dorsal: 'spiny', pattern: 'mottled', extras: ['spines'], girth: 0.22 },
    colors: ['#a8553f', '#2f2e2a'], anim: 0,
    description:
      'Sits in the same crevice for decades. Some of the larger individuals in this forest ' +
      'were here before the harbour had a lighthouse.',
    note: 'Rockfish routinely live past a hundred years. Nobody knows how long these ones live.',
    weight: 8,
  },
  {
    id: 'kelp_greenling', name: 'Kelp Greenling', latin: 'Hexagrammos frondis',
    group: 'fish', rarity: 'common', regions: ['kelp_cathedral'], depth: [18, 80], size: [20, 38],
    behaviour: 'hider', capture: ['rod', 'net'], bait: ['bait_worm'],
    value: 33, research: 9, discipline: 'biology',
    speed: 1.8, agility: 1.3, wariness: 0.5,
    anatomy: { body: 'spindle', head: 'pointed', tail: 'fan', dorsal: 'long', pattern: 'reticulated', girth: 0.16 },
    colors: ['#5c8a3f', '#c8d47a'], anim: 0,
    description: 'Patterned exactly like sunlight through kelp, which is not a coincidence.',
    weight: 7,
  },
  {
    id: 'forest_eel', name: 'Forest Eel', latin: 'Anguilla silvatica',
    group: 'eel', rarity: 'uncommon', regions: ['kelp_cathedral'], depth: [25, 96], size: [70, 140],
    behaviour: 'ambush', active: ['night', 'dusk'], capture: ['trap', 'rod'], bait: ['bait_fish_scrap'],
    value: 96, research: 22, discipline: 'biology',
    speed: 1.5, agility: 0.7, wariness: 0.3,
    anatomy: { body: 'eel', head: 'jawed', tail: 'none', dorsal: 'fringe', pectoral: 'none', pattern: 'mottled', girth: 0.1 },
    colors: ['#4a5c3a', '#c2b46a'], anim: 2,
    description:
      'Holds station in a holdfast with only its head showing, mouth working. Comes out at ' +
      'dusk and swims like a length of ribbon being pulled through water.',
    weight: 4,
  },
  {
    id: 'holdfast_crab', name: 'Holdfast Crab', latin: 'Pugettia radicis',
    group: 'crustacean', rarity: 'common', regions: ['kelp_cathedral'], depth: [20, 90], size: [7, 14],
    behaviour: 'hider', capture: ['trap', 'claw'], bait: ['bait_fish_scrap'],
    value: 24, research: 7, discipline: 'biology',
    speed: 0.6, agility: 1.0, wariness: 0.4,
    anatomy: { body: 'crab', head: 'none', tail: 'none', eyes: 'stalked', extras: ['claws', 'carapace'], girth: 0.26, segments: 4 },
    colors: ['#7d6f3a', '#3f3a1e'], anim: 5,
    description:
      'Decorates its shell with living algae, which continues to grow. Older individuals are ' +
      'walking gardens.',
    weight: 7,
  },
  {
    id: 'lanternfish_shoal', name: 'Green Lanternfish', latin: 'Myctophum viride',
    group: 'fish', rarity: 'uncommon', regions: ['kelp_cathedral', 'blue_drop'], depth: [40, 220], size: [6, 12],
    behaviour: 'school', active: ['night'], capture: ['net', 'lure'],
    value: 34, research: 13, discipline: 'biology',
    speed: 2.2, agility: 1.7, wariness: 0.55, school: [20, 60],
    anatomy: { body: 'spindle', head: 'blunt', tail: 'forked', eyes: 'large', pattern: 'countershade', extras: ['photophores'], girth: 0.15, glow: 0.8 },
    colors: ['#39434f', '#8ff0a8'], anim: 0,
    description:
      'Rises hundreds of metres every night to feed and sinks again before dawn. In aggregate ' +
      'this is the largest animal migration on the planet, and it happens twice a day.',
    weight: 5,
  },
  {
    id: 'ochre_nudibranch', name: 'Ochre Nudibranch', latin: 'Chromodoris ochracea',
    group: 'echinoderm', rarity: 'uncommon', regions: ['kelp_cathedral', 'vermilion_shelf'], depth: [10, 100], size: [3, 8],
    behaviour: 'sessile', capture: ['sampler', 'photo'], value: 58, research: 18, discipline: 'biology',
    speed: 0.08, agility: 0.1, wariness: 0,
    anatomy: { body: 'worm', head: 'blunt', tail: 'none', eyes: 'none', extras: ['frill', 'antennae'], girth: 0.18, segments: 7 },
    colors: ['#e8a13c', '#3b2a5c'], anim: 7,
    description:
      'Sea slugs are, without much competition, the most beautifully coloured animals in ' +
      'shallow water. This one is ochre with a violet fringe and is entirely poisonous.',
    note: 'It steals stinging cells from the hydroids it eats and mounts them on its own back.',
    weight: 3,
  },
  {
    id: 'sunfish_juvenile', name: 'Moonwheel Juvenile', latin: 'Mola parva',
    group: 'fish', rarity: 'rare', regions: ['kelp_cathedral', 'blue_drop'], depth: [15, 160], size: [40, 90],
    behaviour: 'drifter', capture: ['photo', 'scan'], protected: true,
    value: 0, research: 46, discipline: 'biology',
    speed: 0.7, agility: 0.3, wariness: 0.15,
    anatomy: { body: 'compressed', head: 'blunt', tail: 'none', dorsal: 'sail', anal: true, pectoral: 'small', eyes: 'large', pattern: 'plain', girth: 0.3 },
    colors: ['#9fb0b8', '#dfe8ea'], anim: 0,
    description:
      'A young moonwheel: essentially a swimming head with two enormous fins. It lies on its ' +
      'side at the surface to let birds pick parasites off, and appears to enjoy it.',
    note: 'The adults reach three metres and two tonnes. This one is not yet a metre.',
    weight: 1,
  },
  {
    id: 'bull_kelp_snail', name: 'Bull Kelp Snail', latin: 'Norrisia gigas',
    group: 'echinoderm', rarity: 'common', regions: ['kelp_cathedral'], depth: [20, 85], size: [4, 8],
    behaviour: 'sessile', capture: ['claw'], value: 15, research: 5, discipline: 'biology',
    speed: 0.06, agility: 0.1, wariness: 0,
    anatomy: { body: 'globe', head: 'none', tail: 'none', dorsal: 'none', pectoral: 'none', eyes: 'none', extras: ['shell'], girth: 0.28 },
    colors: ['#8c5a2e', '#e0c78c'], anim: 7,
    description: 'Spends its life climbing a single kelp stipe, grazing, and falling off.',
    weight: 6,
  },
  {
    id: 'sea_otter_shadow', name: 'Reef Cormorant', latin: 'Phalacrocorax profundus',
    group: 'fish', rarity: 'rare', regions: ['kelp_cathedral'], depth: [1, 40], size: [60, 90],
    behaviour: 'migratory', active: ['day'], capture: ['photo'], protected: true,
    value: 0, research: 34, discipline: 'biology',
    speed: 4.2, agility: 1.8, wariness: 0.85,
    anatomy: { body: 'torpedo', head: 'beaked', tail: 'fan', dorsal: 'none', pectoral: 'wing', pelvic: false, pattern: 'countershade', girth: 0.14 },
    colors: ['#2e3136', '#7a8288'], anim: 0,
    description:
      'A diving bird, forty metres down and flying. It stays for less than a minute at a time ' +
      'and photographing one is a genuine achievement.',
    note: 'It is the only animal in the catalogue that has to go home to breathe.',
    weight: 1,
  },
  {
    id: 'canopy_jelly', name: 'Canopy Jelly', latin: 'Chrysaora frondis',
    group: 'jelly', rarity: 'uncommon', regions: ['kelp_cathedral'], depth: [10, 90], size: [18, 40],
    behaviour: 'drifter', capture: ['sampler', 'photo'], value: 48, research: 16, discipline: 'biology',
    speed: 0.5, agility: 0.2, wariness: 0,
    anatomy: { body: 'bell', head: 'none', tail: 'none', eyes: 'none', girth: 0.18, glow: 0.35 },
    colors: ['#c88a5c', '#f4d8b0'], anim: 1,
    description:
      'Amber bell, tentacles trailing three times its own diameter. Drifts through the kelp ' +
      'canopy where the light is greenest and does not appear to mind bumping into things.',
    weight: 4,
  },
  {
    id: 'stipe_shrimp', name: 'Stipe Shrimp', latin: 'Hippolyte caulis',
    group: 'crustacean', rarity: 'common', regions: ['kelp_cathedral'], depth: [18, 90], size: [2, 5],
    behaviour: 'hider', capture: ['net', 'sampler'], value: 11, research: 4, discipline: 'biology',
    speed: 1.0, agility: 1.8, wariness: 0.6, school: [4, 12],
    anatomy: { body: 'segmented', head: 'none', tail: 'fan', eyes: 'stalked', extras: ['antennae'], girth: 0.15, segments: 7 },
    colors: ['#6f9c4a', '#d0e08c'], anim: 5,
    description: 'Exactly the green of a kelp blade, including a paler stripe down its back.',
    weight: 8,
  },
  {
    id: 'grove_wolf_eel', name: 'Grove Wolf-eel', latin: 'Anarrhichthys nemoris',
    group: 'eel', rarity: 'rare', regions: ['kelp_cathedral'], depth: [40, 98], size: [110, 190],
    behaviour: 'territorial', capture: ['photo', 'trap'], bait: ['bait_urchin'],
    value: 165, research: 38, discipline: 'biology',
    speed: 1.2, agility: 0.6, wariness: 0.25,
    anatomy: { body: 'eel', head: 'jawed', tail: 'none', dorsal: 'fringe', pectoral: 'small', eyes: 'normal', pattern: 'spots', girth: 0.13 },
    colors: ['#6b6a74', '#2c2b33'], anim: 2,
    description:
      'Enormous, wrinkled, and entirely gentle unless you are a sea urchin. Pairs stay ' +
      'together for life in the same den and look out of it side by side.',
    note: 'They crush urchins whole. The teeth are worn flat by middle age.',
    weight: 2,
  },
  {
    id: 'seagrass_seahorse', name: 'Cathedral Seahorse', latin: 'Hippocampus basilicae',
    group: 'fish', rarity: 'rare', regions: ['kelp_cathedral', 'lantern_bay'], depth: [4, 60], size: [8, 15],
    behaviour: 'sessile', capture: ['sampler', 'photo'], value: 128, research: 32, discipline: 'biology',
    speed: 0.3, agility: 0.4, wariness: 0.5,
    anatomy: { body: 'eel', head: 'tube', tail: 'whip', dorsal: 'small', pectoral: 'small', eyes: 'normal', extras: ['crest', 'plates'], girth: 0.12, tall: 1.6 },
    colors: ['#c89a4a', '#5c4020'], anim: 7,
    description:
      'Holds onto a single blade of grass with its tail and stays there. Finding one requires ' +
      'looking at a patch of eelgrass for considerably longer than feels sensible.',
    note: 'The male gives birth. This is not a metaphor; he has a pouch and everything.',
    weight: 2,
  },
  {
    id: 'grove_squid', name: 'Grove Squid', latin: 'Loligo nemoris',
    group: 'cephalopod', rarity: 'uncommon', regions: ['kelp_cathedral', 'blue_drop'], depth: [25, 180], size: [20, 40],
    behaviour: 'school', active: ['night', 'dusk'], capture: ['net', 'lure'],
    value: 68, research: 19, discipline: 'biology',
    speed: 2.6, agility: 1.5, wariness: 0.5, school: [8, 24],
    anatomy: { body: 'mantle', head: 'none', tail: 'none', pectoral: 'long', eyes: 'large', extras: ['tentacles'], girth: 0.15 },
    colors: ['#cfa8a0', '#5c3a4a'], anim: 6,
    description:
      'Moves in loose formation, all facing the same way, all changing colour at once. ' +
      'What they are saying to each other is an open question.',
    weight: 5,
  },
  {
    id: 'bladder_wrack_fish', name: 'Bladderfish', latin: 'Physiculus vesica',
    group: 'fish', rarity: 'common', regions: ['kelp_cathedral'], depth: [30, 96], size: [14, 26],
    behaviour: 'loose', capture: ['rod', 'net'], bait: ['bait_worm'],
    value: 27, research: 8, discipline: 'biology',
    speed: 1.6, agility: 1.1, wariness: 0.45, school: [4, 10],
    anatomy: { body: 'globe', head: 'blunt', tail: 'fan', dorsal: 'small', eyes: 'large', pattern: 'spots', girth: 0.26 },
    colors: ['#8f9c5c', '#e6e0a8'], anim: 0,
    description: 'Round, slow and buoyant. Bobs among the floats of the kelp canopy pretending to be one.',
    weight: 6,
  },
];
