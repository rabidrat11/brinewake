/**
 * The Vermilion Shelf and the Blue Drop.
 *
 * The reef is where the bestiary gets loud; the drop is where it gets big.
 */

import type { SpeciesDef } from '../speciesTypes';

export const REEF_SPECIES: SpeciesDef[] = [
  // --- Vermilion Shelf --------------------------------------------------
  {
    id: 'vermilion_tang', name: 'Vermilion Tang', latin: 'Zebrasoma vermilio',
    group: 'fish', rarity: 'common', regions: ['vermilion_shelf'], depth: [8, 90], size: [14, 26],
    behaviour: 'school', capture: ['net', 'rod'], bait: ['bait_algae'],
    value: 36, research: 9, discipline: 'biology',
    speed: 2.0, agility: 1.8, wariness: 0.5, school: [10, 30],
    anatomy: { body: 'compressed', head: 'pointed', tail: 'lunate', dorsal: 'sail', anal: true, pattern: 'gradient', girth: 0.24 },
    colors: ['#e2542c', '#ffd27a'], anim: 0,
    description:
      'A blade of orange with a scalpel at the base of the tail. Grazes algae in restless ' +
      'shoals that move across the reef like weather.',
    note: 'The "scalpel" is a genuine hinged spine. Handle with the manipulator, not the hand.',
    weight: 11,
  },
  {
    id: 'coral_butterfly', name: 'Lace Butterflyfish', latin: 'Chaetodon reticulum',
    group: 'fish', rarity: 'common', regions: ['vermilion_shelf'], depth: [6, 70], size: [10, 18],
    behaviour: 'loose', capture: ['net', 'sampler'], value: 41, research: 11, discipline: 'biology',
    speed: 1.7, agility: 1.9, wariness: 0.55, school: [2, 4],
    anatomy: { body: 'compressed', head: 'pointed', tail: 'fan', dorsal: 'tall', pattern: 'reticulated', girth: 0.26 },
    colors: ['#f4d24a', '#2a2a38'], anim: 0,
    description:
      'Almost always in pairs, and the pairs last for years. The false eyespot near the tail ' +
      'is aimed at predators who have not thought it through.',
    weight: 8,
  },
  {
    id: 'parrot_grazer', name: 'Coral Grazer', latin: 'Scarus lithophagus',
    group: 'fish', rarity: 'common', regions: ['vermilion_shelf'], depth: [5, 60], size: [28, 55],
    behaviour: 'loose', capture: ['rod', 'net'], bait: ['bait_algae'],
    value: 58, research: 14, discipline: 'biology',
    speed: 1.9, agility: 1.2, wariness: 0.5, school: [3, 9],
    anatomy: { body: 'spindle', head: 'beaked', tail: 'lunate', dorsal: 'long', pattern: 'mottled', girth: 0.21 },
    colors: ['#3fa8a0', '#e86f9c'], anim: 0,
    description:
      'Bites coral off the reef with a fused beak, digests the algae inside and excretes the ' +
      'limestone as sand. A large one produces most of a tonne of sand a year.',
    note: 'The beaches of the harbour are, in substantial part, made of this.',
    weight: 7,
  },
  {
    id: 'flame_goby', name: 'Flame Goby', latin: 'Nemateleotris ignis',
    group: 'fish', rarity: 'uncommon', regions: ['vermilion_shelf'], depth: [12, 95], size: [5, 9],
    behaviour: 'hider', capture: ['sampler', 'net'], value: 62, research: 16, discipline: 'biology',
    speed: 1.3, agility: 2.0, wariness: 0.75,
    anatomy: { body: 'spindle', head: 'pointed', tail: 'fan', dorsal: 'tall', pattern: 'gradient', girth: 0.13 },
    colors: ['#f5e6c0', '#e0342c'], anim: 0,
    description:
      'Hovers a hand-span above its burrow with the first dorsal spine raised like a flag, ' +
      'and disappears into the sand the instant anything changes.',
    weight: 5,
  },
  {
    id: 'cleaner_wrasse', name: 'Cleaner Wrasse', latin: 'Labroides mundator',
    group: 'fish', rarity: 'common', regions: ['vermilion_shelf'], depth: [5, 80], size: [6, 11],
    behaviour: 'territorial', capture: ['net', 'sampler'], value: 30, research: 12, discipline: 'biology',
    speed: 1.8, agility: 2.0, wariness: 0.3,
    anatomy: { body: 'spindle', head: 'pointed', tail: 'fan', dorsal: 'long', pattern: 'stripes', girth: 0.11 },
    colors: ['#4fc2e0', '#141a24'], anim: 0,
    description:
      'Runs a cleaning station: other fish queue, hold still, and open their mouths to be ' +
      'worked over. It is one of the few places on a reef where nothing eats anything.',
    note: 'Remove the cleaners from a patch of reef and within weeks the other fish leave too.',
    weight: 7,
  },
  {
    id: 'shelf_lionfish', name: 'Vermilion Lionfish', latin: 'Pterois vermilii',
    group: 'fish', rarity: 'uncommon', regions: ['vermilion_shelf'], depth: [10, 120], size: [22, 40],
    behaviour: 'ambush', active: ['dusk', 'night'], capture: ['net', 'photo'],
    value: 92, research: 24, discipline: 'biology',
    speed: 0.9, agility: 0.7, wariness: 0.15,
    anatomy: { body: 'spindle', head: 'bulbous', tail: 'fan', dorsal: 'spiny', pectoral: 'wing', pattern: 'stripes', extras: ['spines'], girth: 0.2 },
    colors: ['#c8402c', '#f8ecd8'], anim: 0,
    description:
      'Drifts with its pectoral fans spread, herding small fish into corners. Utterly ' +
      'unbothered by a submarine, because nothing has ever needed to bother it.',
    note: 'Eighteen venomous spines. The market pays well and the fish market pays more carefully.',
    weight: 4,
  },
  {
    id: 'shelf_octopus', name: 'Shelf Octopus', latin: 'Octopus vermilii',
    group: 'cephalopod', rarity: 'uncommon', regions: ['vermilion_shelf'], depth: [8, 140], size: [30, 70],
    behaviour: 'hider', active: ['night', 'dusk'], capture: ['trap', 'photo', 'drone'],
    value: 118, research: 30, discipline: 'biology',
    speed: 1.2, agility: 1.6, wariness: 0.6,
    anatomy: { body: 'mantle', head: 'none', tail: 'none', pectoral: 'none', eyes: 'large', extras: ['tentacles', 'siphon'], girth: 0.22 },
    colors: ['#b0564a', '#f0d0b8'], anim: 6,
    description:
      'Keeps a den marked by a midden of shells outside the entrance. Will reach out and ' +
      'touch a manipulator arm, then retreat and consider.',
    note: 'Two thirds of its neurons are in its arms. Each arm, in a limited sense, decides.',
    weight: 4,
  },
  {
    id: 'ribbon_moray', name: 'Ribbon Moray', latin: 'Rhinomuraena taenia',
    group: 'eel', rarity: 'rare', regions: ['vermilion_shelf'], depth: [15, 120], size: [70, 120],
    behaviour: 'hider', capture: ['photo', 'trap'], bait: ['bait_fish_scrap'],
    value: 186, research: 40, discipline: 'biology',
    speed: 1.1, agility: 0.6, wariness: 0.45,
    anatomy: { body: 'eel', head: 'jawed', tail: 'none', dorsal: 'fringe', pectoral: 'none', eyes: 'normal', extras: ['barbels', 'crest'], girth: 0.055 },
    colors: ['#2f6fd0', '#f5d03c'], anim: 2,
    description:
      'Electric blue with a yellow crest and flaring nostrils, waving from a hole in the ' +
      'reef like something in a parade.',
    note: 'Born black and male, turns blue and male, then yellow and female. In that order.',
    weight: 2,
  },
  {
    id: 'coral_hawkfish', name: 'Coral Hawkfish', latin: 'Cirrhitichthys corallis',
    group: 'fish', rarity: 'common', regions: ['vermilion_shelf'], depth: [6, 70], size: [7, 13],
    behaviour: 'ambush', capture: ['net', 'rod'], bait: ['bait_shrimp'],
    value: 28, research: 8, discipline: 'biology',
    speed: 1.4, agility: 1.9, wariness: 0.4,
    anatomy: { body: 'spindle', head: 'pointed', tail: 'fan', dorsal: 'spiny', pectoral: 'long', pattern: 'spots', girth: 0.19 },
    colors: ['#f0ece0', '#d8353c'], anim: 0,
    description:
      'Perches on a coral head propped on its pectoral fins, entirely motionless, and then ' +
      'is somewhere else.',
    weight: 8,
  },
  {
    id: 'tasselled_scorpionfish', name: 'Tasselled Scorpionfish', latin: 'Scorpaenopsis fimbria',
    group: 'fish', rarity: 'uncommon', regions: ['vermilion_shelf'], depth: [12, 130], size: [20, 36],
    behaviour: 'ambush', capture: ['claw', 'photo'], value: 84, research: 22, discipline: 'biology',
    speed: 0.6, agility: 0.5, wariness: 0.05,
    anatomy: { body: 'spindle', head: 'bulbous', tail: 'fan', dorsal: 'spiny', pattern: 'mottled', extras: ['beard', 'spines'], girth: 0.24 },
    colors: ['#8c6a4a', '#c8a06a'], anim: 0,
    description:
      'Indistinguishable from a lump of algae-covered rock until it opens a mouth the width ' +
      'of its own body. The scan often finds it before the eye does.',
    weight: 4,
  },
  {
    id: 'blue_chromis', name: 'Shelf Chromis', latin: 'Chromis caerulea',
    group: 'fish', rarity: 'common', regions: ['vermilion_shelf'], depth: [5, 60], size: [5, 9],
    behaviour: 'school', capture: ['net'], value: 14, research: 5, discipline: 'biology',
    speed: 2.3, agility: 2.0, wariness: 0.6, school: [30, 90],
    anatomy: { body: 'compressed', head: 'blunt', tail: 'forked', dorsal: 'small', pattern: 'plain', girth: 0.2 },
    colors: ['#4f9ee0', '#a8dcf4'], anim: 0,
    description:
      'Hangs in a blue cloud above a single coral head all day, and pours into it at the ' +
      'first alarm. Reforms about ten seconds later.',
    weight: 12,
  },
  {
    id: 'reef_pufferfish', name: 'Reef Puffer', latin: 'Arothron corallis',
    group: 'fish', rarity: 'uncommon', regions: ['vermilion_shelf'], depth: [8, 110], size: [18, 34],
    behaviour: 'curious', capture: ['net', 'photo'], value: 66, research: 18, discipline: 'biology',
    speed: 1.0, agility: 0.7, wariness: 0.25,
    anatomy: { body: 'globe', head: 'blunt', tail: 'fan', dorsal: 'small', pectoral: 'small', eyes: 'large', pattern: 'spots', extras: ['spines'], girth: 0.32 },
    colors: ['#d8b25c', '#3a3226'], anim: 0,
    description:
      'Sculls about on its pectoral fins with an expression of mild interest. When alarmed ' +
      'it swallows water until it is three times its own volume and entirely spherical.',
    note: 'The inflation takes about fifteen seconds to reverse. It looks embarrassed the whole time.',
    weight: 5,
  },
  {
    id: 'harlequin_shrimp', name: 'Harlequin Shrimp', latin: 'Hymenocera picta',
    group: 'crustacean', rarity: 'rare', regions: ['vermilion_shelf'], depth: [8, 90], size: [3, 6],
    behaviour: 'hider', capture: ['sampler', 'photo'], value: 152, research: 34, discipline: 'biology',
    speed: 0.5, agility: 1.2, wariness: 0.4,
    anatomy: { body: 'segmented', head: 'none', tail: 'fan', eyes: 'stalked', extras: ['claws', 'antennae'], girth: 0.2, segments: 6 },
    colors: ['#f6f0e4', '#c0429c'], anim: 5,
    description:
      'Cream, patterned with violet petals, with flattened claws like a pair of playing cards. ' +
      'Lives in monogamous pairs and eats nothing but sea stars.',
    note: 'It eats them slowly, over days, starting with an arm, keeping the star alive throughout.',
    weight: 2,
  },
  {
    id: 'giant_clam', name: 'Vermilion Clam', latin: 'Tridacna vermilii',
    group: 'echinoderm', rarity: 'uncommon', regions: ['vermilion_shelf'], depth: [6, 60], size: [25, 70],
    behaviour: 'sessile', capture: ['scan', 'photo'], protected: true,
    value: 0, research: 26, discipline: 'biology',
    speed: 0, agility: 0, wariness: 0,
    anatomy: { body: 'barrel', head: 'none', tail: 'none', dorsal: 'none', pectoral: 'none', eyes: 'none', extras: ['frill', 'shell'], girth: 0.34, glow: 0.15 },
    colors: ['#2f8f9c', '#c8e8d0'], anim: 7,
    description:
      'The mantle is a living stained-glass window, packed with algae that feed it in ' +
      'exchange for sunlight. Closes with an audible clap when a shadow crosses it.',
    note: 'They can live for over a century in the same square metre. Leave them there.',
    weight: 3,
  },
  {
    id: 'cardinal_fish', name: 'Lantern Cardinal', latin: 'Apogon lucidus',
    group: 'fish', rarity: 'common', regions: ['vermilion_shelf'], depth: [6, 80], size: [6, 11],
    behaviour: 'school', active: ['night', 'dusk'], capture: ['net', 'lure'],
    value: 22, research: 7, discipline: 'biology',
    speed: 1.5, agility: 1.6, wariness: 0.5, school: [12, 30],
    anatomy: { body: 'compressed', head: 'blunt', tail: 'forked', dorsal: 'small', eyes: 'large', pattern: 'stripes', girth: 0.2 },
    colors: ['#c8384a', '#f8e8d0'], anim: 0,
    description:
      'Hides under coral ledges all day in tidy ranks, all facing outward. The males brood ' +
      'the eggs in their mouths and cannot eat while doing it.',
    weight: 9,
  },
  {
    id: 'reef_lobster', name: 'Painted Reef Lobster', latin: 'Enoplometopus pictus',
    group: 'crustacean', rarity: 'uncommon', regions: ['vermilion_shelf'], depth: [15, 140], size: [12, 24],
    behaviour: 'hider', active: ['night'], capture: ['trap', 'claw'], bait: ['bait_fish_scrap'],
    value: 96, research: 22, discipline: 'biology',
    speed: 0.6, agility: 0.9, wariness: 0.55,
    anatomy: { body: 'segmented', head: 'none', tail: 'fan', eyes: 'stalked', extras: ['claws', 'antennae', 'spines'], girth: 0.19, segments: 8 },
    colors: ['#e0503c', '#f8d8c0'], anim: 5,
    description:
      'Scarlet, spotted with white, and entirely nocturnal. In daylight you will only ever ' +
      'see the antennae, waving from a crack.',
    weight: 5,
  },
  {
    id: 'blue_tang_school', name: 'Cobalt Surgeon', latin: 'Paracanthurus caeruleus',
    group: 'fish', rarity: 'uncommon', regions: ['vermilion_shelf'], depth: [8, 90], size: [15, 28],
    behaviour: 'school', capture: ['net'], value: 54, research: 13, discipline: 'biology',
    speed: 2.2, agility: 1.9, wariness: 0.55, school: [8, 26],
    anatomy: { body: 'compressed', head: 'pointed', tail: 'lunate', dorsal: 'sail', pattern: 'saddle', girth: 0.24 },
    colors: ['#2f6fe0', '#f5c53c'], anim: 0,
    description: 'Cobalt body, black brushstroke, yellow tail. Reef fish that look designed usually are not.',
    weight: 6,
  },
  {
    id: 'moray_shelf', name: 'Shelf Moray', latin: 'Gymnothorax vermilii',
    group: 'eel', rarity: 'common', regions: ['vermilion_shelf'], depth: [10, 130], size: [60, 110],
    behaviour: 'ambush', capture: ['trap', 'photo'], bait: ['bait_fish_scrap'],
    value: 72, research: 17, discipline: 'biology',
    speed: 1.3, agility: 0.7, wariness: 0.2,
    anatomy: { body: 'eel', head: 'jawed', tail: 'none', dorsal: 'fringe', pectoral: 'none', pattern: 'reticulated', girth: 0.1 },
    colors: ['#7a6a3f', '#e4dcc0'], anim: 2,
    description:
      'Breathes by opening and closing its mouth, which is why every moray appears to be ' +
      'about to say something threatening.',
    weight: 7,
  },
  {
    id: 'crown_starfish', name: 'Crown Sea Star', latin: 'Acanthaster corona',
    group: 'echinoderm', rarity: 'uncommon', regions: ['vermilion_shelf'], depth: [8, 100], size: [25, 50],
    behaviour: 'sessile', capture: ['claw', 'scan'], value: 44, research: 20, discipline: 'biology',
    speed: 0.1, agility: 0.1, wariness: 0,
    anatomy: { body: 'star', head: 'none', tail: 'none', eyes: 'none', extras: ['spines'], segments: 13, girth: 0.3 },
    colors: ['#8c3f5c', '#e8b04a'], anim: 7,
    description:
      'Thirteen arms, entirely covered in venomous spines, and an appetite for live coral. ' +
      'The Institute pays a bounty for every one removed from the shelf.',
    note: 'A single outbreak can strip a reef in a season. Nobody agrees on what starts them.',
    weight: 4,
  },
  {
    id: 'ghost_pipefish', name: 'Ornate Ghost Pipefish', latin: 'Solenostomus ornatus',
    group: 'fish', rarity: 'rare', regions: ['vermilion_shelf'], depth: [10, 100], size: [8, 14],
    behaviour: 'hider', capture: ['sampler', 'photo'], value: 168, research: 36, discipline: 'biology',
    speed: 0.4, agility: 0.6, wariness: 0.5,
    anatomy: { body: 'ribbon', head: 'tube', tail: 'fan', dorsal: 'fringe', pectoral: 'long', pattern: 'mottled', extras: ['filaments'], girth: 0.1 },
    colors: ['#e8c4a0', '#a8506a'], anim: 2,
    description:
      'Hangs head-down beside a feather star, fringed and frilled into near-invisibility. ' +
      'One of the hardest things on the shelf to actually see.',
    weight: 2,
  },

  // --- The Blue Drop ----------------------------------------------------
  {
    id: 'drop_jack', name: 'Bluewater Jack', latin: 'Caranx profundus',
    group: 'fish', rarity: 'common', regions: ['blue_drop'], depth: [30, 260], size: [45, 90],
    behaviour: 'school', capture: ['rod', 'net'], bait: ['bait_sprat'],
    value: 78, research: 14, discipline: 'biology',
    speed: 4.0, agility: 1.4, wariness: 0.5, school: [12, 40],
    anatomy: { body: 'torpedo', head: 'blunt', tail: 'lunate', dorsal: 'small', pattern: 'countershade', girth: 0.15 },
    colors: ['#b6c4cc', '#3f5a72'], anim: 0,
    description:
      'Hunts in a rotating wall of silver that pins baitfish against the surface. The most ' +
      'purely athletic thing in the upper ocean.',
    weight: 9,
  },
  {
    id: 'blue_lantern_squid', name: 'Bluewater Squid', latin: 'Abraliopsis caerulea',
    group: 'cephalopod', rarity: 'common', regions: ['blue_drop'], depth: [90, 400], size: [10, 22],
    behaviour: 'lightAttracted', active: ['night'], capture: ['lure', 'net'],
    value: 48, research: 15, discipline: 'biology',
    speed: 2.0, agility: 1.4, wariness: 0.4, school: [6, 18],
    anatomy: { body: 'mantle', head: 'none', tail: 'none', pectoral: 'small', eyes: 'large', extras: ['photophores', 'tentacles'], girth: 0.16, glow: 0.75 },
    colors: ['#4a5a7c', '#9fe8ff'], anim: 6,
    description:
      'Studded with light organs along the underside, exactly bright enough to erase its own ' +
      'silhouette against the surface. Comes eagerly to a lamp.',
    note: 'Counter-illumination. It measures the light above it and matches it, continuously.',
    weight: 8,
  },
  {
    id: 'sargasso_drifter', name: 'Weedline Drifter', latin: 'Histrio errans',
    group: 'fish', rarity: 'uncommon', regions: ['blue_drop'], depth: [1, 60], size: [8, 16],
    behaviour: 'drifter', capture: ['net', 'sampler'], value: 68, research: 20, discipline: 'biology',
    speed: 0.5, agility: 0.8, wariness: 0.3,
    anatomy: { body: 'globe', head: 'bulbous', tail: 'fan', dorsal: 'spiny', pectoral: 'long', pattern: 'mottled', extras: ['filaments', 'lure'], girth: 0.26 },
    colors: ['#b09a52', '#6a4f28'], anim: 0,
    description:
      'A frogfish that lives its entire life in floating weed, walking about on its pectoral ' +
      'fins like hands. It has a lure. It uses it on anything smaller than itself.',
    weight: 3,
  },
  {
    id: 'moon_jelly_bloom', name: 'Blue Drop Moon Jelly', latin: 'Aurelia caerulis',
    group: 'jelly', rarity: 'common', regions: ['blue_drop'], depth: [10, 300], size: [15, 35],
    behaviour: 'drifter', capture: ['sampler', 'photo'], value: 26, research: 8, discipline: 'biology',
    speed: 0.4, agility: 0.15, wariness: 0, school: [10, 40],
    anatomy: { body: 'bell', head: 'none', tail: 'none', eyes: 'none', girth: 0.16, glow: 0.3 },
    colors: ['#a8c8e0', '#dff0f8'], anim: 1,
    description:
      'In the right season they bloom in numbers that turn a cubic kilometre of water into ' +
      'slow, silent, pulsing glass.',
    weight: 10,
  },
  {
    id: 'thresher_shark', name: 'Ribbontail Thresher', latin: 'Alopias taenia',
    group: 'shark', rarity: 'rare', regions: ['blue_drop'], depth: [50, 400], size: [220, 380],
    behaviour: 'patrol', capture: ['photo', 'scan'], protected: true,
    value: 0, research: 58, discipline: 'biology',
    speed: 4.6, agility: 1.0, wariness: 0.6,
    anatomy: { body: 'torpedo', head: 'pointed', tail: 'ribbon', dorsal: 'tall', pectoral: 'long', eyes: 'large', pattern: 'countershade', girth: 0.11 },
    colors: ['#4a5f70', '#e0e8ee'], anim: 0,
    description:
      'The upper lobe of the tail is as long as the rest of the animal, and it uses it as a ' +
      'whip: a crack of it stuns a dozen fish at once.',
    note: 'The tail tip breaks the sound barrier in water. You can hear it from two hundred metres.',
    weight: 2,
  },
  {
    id: 'sailfin_hatchet', name: 'Silver Hatchetfish', latin: 'Argyropelecus argenteus',
    group: 'fish', rarity: 'common', regions: ['blue_drop', 'gloaming_canyon'], depth: [180, 600], size: [4, 8],
    behaviour: 'school', capture: ['net', 'sampler'], value: 32, research: 14, discipline: 'biology',
    speed: 1.4, agility: 1.2, wariness: 0.55, school: [10, 30],
    anatomy: { body: 'compressed', head: 'blunt', tail: 'forked', dorsal: 'small', eyes: 'tubular', extras: ['photophores'], girth: 0.3, glow: 0.85 },
    colors: ['#c8d8e0', '#6fa8c8'], anim: 0,
    description:
      'A living mirror three centimetres deep and almost nothing wide, with upward-pointing ' +
      'telescope eyes and a row of downward lights.',
    note: 'Seen edge-on it effectively does not exist. That is the entire design.',
    weight: 7,
  },
  {
    id: 'blue_drop_mola', name: 'Moonwheel', latin: 'Mola gigas',
    group: 'fish', rarity: 'rare', regions: ['blue_drop'], depth: [20, 380], size: [180, 310],
    behaviour: 'drifter', capture: ['photo', 'scan'], protected: true,
    value: 0, research: 64, discipline: 'biology',
    speed: 0.8, agility: 0.25, wariness: 0.2,
    anatomy: { body: 'compressed', head: 'blunt', tail: 'none', dorsal: 'sail', anal: true, pectoral: 'small', eyes: 'large', pattern: 'mottled', girth: 0.32 },
    colors: ['#8e9ea6', '#dee6e8'], anim: 0,
    description:
      'Two and a half metres of fish that appears to be missing its back half. Drifts up out ' +
      'of the cold to bask, and stares at a submarine with real, if slow, interest.',
    note: 'It eats jellyfish almost exclusively, which is a very inefficient way to weigh a tonne.',
    weight: 1,
  },
  {
    id: 'siphonophore_chain', name: 'Chain Siphonophore', latin: 'Praya catena',
    group: 'jelly', rarity: 'uncommon', regions: ['blue_drop', 'gloaming_canyon'], depth: [120, 700], size: [180, 900],
    behaviour: 'drifter', capture: ['sampler', 'photo'], value: 96, research: 40, discipline: 'biology',
    speed: 0.25, agility: 0.1, wariness: 0,
    anatomy: { body: 'worm', head: 'none', tail: 'none', eyes: 'none', extras: ['filaments', 'glowSpots'], girth: 0.03, segments: 20, glow: 0.7 },
    colors: ['#9fd8e8', '#e0f4ff'], anim: 4,
    description:
      'Not one animal but a colony of thousands, each specialised — some swim, some digest, ' +
      'some sting — strung along a single stem that can run longer than a whale.',
    note: 'The longest recorded specimen was forty-seven metres. It was not the whole animal.',
    weight: 3,
  },
  {
    id: 'blue_shark', name: 'Bluewater Shark', latin: 'Prionace profunda',
    group: 'shark', rarity: 'uncommon', regions: ['blue_drop'], depth: [20, 380], size: [180, 300],
    behaviour: 'curious', capture: ['photo', 'scan'], protected: true,
    value: 0, research: 44, discipline: 'biology',
    speed: 3.4, agility: 1.1, wariness: 0.3,
    anatomy: { body: 'torpedo', head: 'pointed', tail: 'lunate', dorsal: 'tall', pectoral: 'long', eyes: 'large', pattern: 'countershade', girth: 0.1 },
    colors: ['#3f6f9c', '#eef2f4'], anim: 0,
    description:
      'Long, slim and indigo. Approaches from below and behind, circles once at a polite ' +
      'distance, and leaves. Nine times out of ten it will do exactly that.',
    weight: 3,
  },
  {
    id: 'flying_squid', name: 'Neon Flying Squid', latin: 'Ommastrephes volans',
    group: 'cephalopod', rarity: 'uncommon', regions: ['blue_drop'], depth: [5, 250], size: [25, 55],
    behaviour: 'school', active: ['night'], capture: ['lure', 'net'],
    value: 74, research: 20, discipline: 'biology',
    speed: 3.8, agility: 1.7, wariness: 0.55, school: [6, 20],
    anatomy: { body: 'mantle', head: 'none', tail: 'none', pectoral: 'long', eyes: 'large', extras: ['tentacles', 'photophores'], girth: 0.14, glow: 0.5 },
    colors: ['#d0708c', '#3a2a4c'], anim: 6,
    description:
      'Jets hard enough to leave the water entirely and glide, fins spread, for thirty metres ' +
      'at a time. From below you see the shadow go.',
    weight: 5,
  },
  {
    id: 'lantern_shark', name: 'Velvet Lanternshark', latin: 'Etmopterus velutinus',
    group: 'shark', rarity: 'rare', regions: ['blue_drop', 'gloaming_canyon'], depth: [220, 800], size: [35, 55],
    behaviour: 'solitary', active: ['night'], capture: ['photo', 'trap'], bait: ['bait_fish_scrap'],
    value: 178, research: 42, discipline: 'biology',
    speed: 1.6, agility: 0.9, wariness: 0.5,
    anatomy: { body: 'torpedo', head: 'pointed', tail: 'fan', dorsal: 'small', pectoral: 'small', eyes: 'large', extras: ['photophores'], girth: 0.11, glow: 0.6 },
    colors: ['#2b2f3a', '#7fe8d0'], anim: 0,
    description:
      'A shark you could hold in two hands, glowing faintly green along the belly and flanks. ' +
      'The light is patterned; individuals can probably recognise each other by it.',
    weight: 2,
  },
  {
    id: 'ocean_sunlance', name: 'Sunlance', latin: 'Ammodytes solaris',
    group: 'fish', rarity: 'common', regions: ['blue_drop'], depth: [20, 200], size: [12, 22],
    behaviour: 'school', capture: ['net'], value: 18, research: 6, discipline: 'biology',
    speed: 3.0, agility: 2.0, wariness: 0.7, school: [60, 200],
    anatomy: { body: 'eel', head: 'pointed', tail: 'forked', dorsal: 'fringe', pectoral: 'none', pattern: 'countershade', girth: 0.045 },
    colors: ['#d8dee0', '#7f9fb0'], anim: 2,
    description:
      'Forms shoals so dense they read on sonar as solid ground. Dives into open water and ' +
      'vanishes as one animal.',
    weight: 11,
  },
  {
    id: 'drop_barracuda', name: 'Shelf-edge Barracuda', latin: 'Sphyraena marginis',
    group: 'fish', rarity: 'uncommon', regions: ['blue_drop', 'vermilion_shelf'], depth: [10, 200], size: [70, 140],
    behaviour: 'patrol', capture: ['rod', 'photo'], bait: ['bait_sprat'],
    value: 102, research: 18, discipline: 'biology',
    speed: 4.4, agility: 1.3, wariness: 0.35,
    anatomy: { body: 'torpedo', head: 'jawed', tail: 'lunate', dorsal: 'small', pattern: 'chevron', girth: 0.085 },
    colors: ['#a8b6bc', '#2e3a44'], anim: 0,
    description:
      'Hangs motionless at the shelf edge facing into the current, and accelerates from zero ' +
      'to twelve metres a second in under a second.',
    weight: 5,
  },
  {
    id: 'pelagic_seasnail', name: 'Sea Butterfly', latin: 'Clione papilio',
    group: 'echinoderm', rarity: 'uncommon', regions: ['blue_drop'], depth: [30, 400], size: [1, 3],
    behaviour: 'drifter', capture: ['sampler'], value: 40, research: 18, discipline: 'oceanography',
    speed: 0.3, agility: 0.6, wariness: 0,
    anatomy: { body: 'larva', head: 'none', tail: 'none', eyes: 'tiny', extras: ['wings'], girth: 0.24, glow: 0.35 },
    colors: ['#f2c2d0', '#ffe8f0'], anim: 4,
    description:
      'A sea snail that abandoned its shell and turned its foot into a pair of wings. Flaps ' +
      'through open water like a moth, and is only ever a centimetre long.',
    note: 'Their shelled cousins are the first thing an acidifying ocean dissolves.',
    weight: 4,
  },
];
