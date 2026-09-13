/**
 * Gloaming Canyon, the Emberfield and Halloway Deep.
 *
 * Below four hundred metres nothing is lit from above, and the bestiary starts
 * making its own arrangements.
 */

import type { SpeciesDef } from '../speciesTypes';

export const DEEP_SPECIES: SpeciesDef[] = [
  // --- Gloaming Canyon --------------------------------------------------
  {
    id: 'gloaming_lanternfish', name: 'Violet Lanternfish', latin: 'Myctophum crepusculum',
    group: 'fish', rarity: 'common', regions: ['gloaming_canyon'], depth: [340, 800], size: [7, 14],
    behaviour: 'school', capture: ['net', 'lure'], value: 44, research: 14, discipline: 'biology',
    speed: 2.0, agility: 1.6, wariness: 0.5, school: [16, 44],
    anatomy: { body: 'spindle', head: 'blunt', tail: 'forked', eyes: 'large', extras: ['photophores'], girth: 0.16, glow: 0.9 },
    colors: ['#3a3550', '#b09fff'], anim: 0,
    description:
      'Violet where the violet lanternfish of the shallower water is green. The canyon has ' +
      'its own colour and everything in it has agreed to use it.',
    weight: 11,
  },
  {
    id: 'gulper_eel', name: 'Gulper', latin: 'Eurypharynx pelecanoides',
    group: 'eel', rarity: 'rare', regions: ['gloaming_canyon', 'nightfall_plain'], depth: [500, 3400], size: [60, 160],
    behaviour: 'ambush', capture: ['photo', 'trap'], bait: ['bait_lumen'],
    value: 210, research: 52, discipline: 'abyssal',
    speed: 0.8, agility: 0.4, wariness: 0.3,
    anatomy: { body: 'eel', head: 'jawed', tail: 'whip', dorsal: 'fringe', pectoral: 'none', eyes: 'tiny', extras: ['glowSpots'], girth: 0.07, glow: 0.5 },
    colors: ['#22202c', '#e06f9c'], anim: 2,
    description:
      'Almost entirely mouth, tapering into a whip with a light on the end. The jaw is longer ' +
      'than the skull and hinges open into a bag.',
    note: 'It waves the lit tail tip in front of its own mouth. Nobody is quite sure that works.',
    weight: 3,
  },
  {
    id: 'canyon_dragonfish', name: 'Canyon Dragonfish', latin: 'Stomias caverna',
    group: 'fish', rarity: 'uncommon', regions: ['gloaming_canyon'], depth: [400, 900], size: [20, 38],
    behaviour: 'ambush', capture: ['lure', 'trap'], bait: ['bait_lumen'],
    value: 128, research: 32, discipline: 'biology',
    speed: 1.4, agility: 0.9, wariness: 0.35,
    anatomy: { body: 'eel', head: 'lantern', tail: 'fan', dorsal: 'fringe', pectoral: 'none', eyes: 'large', extras: ['barbels', 'photophores'], girth: 0.07, glow: 0.85 },
    colors: ['#1c1a26', '#6fe0d0'], anim: 2,
    description:
      'Black as ink, with a lit barbel hanging from the chin and teeth too long to close over. ' +
      'The skin absorbs over 99.5 per cent of the light that hits it.',
    note: 'It has a second, red light behind the eye. Almost nothing down here can see red.',
    weight: 5,
  },
  {
    id: 'vampire_squid', name: 'Cloak Squid', latin: 'Vampyroteuthis pallium',
    group: 'cephalopod', rarity: 'rare', regions: ['gloaming_canyon'], depth: [500, 1200], size: [18, 32],
    behaviour: 'drifter', capture: ['drone', 'photo'], value: 246, research: 60, discipline: 'abyssal',
    speed: 0.9, agility: 1.1, wariness: 0.45,
    anatomy: { body: 'mantle', head: 'none', tail: 'none', pectoral: 'small', eyes: 'large', extras: ['tentacles', 'photophores'], girth: 0.24, glow: 0.7 },
    colors: ['#6b2a3c', '#ff9fb0'], anim: 6,
    description:
      'Webbed arms that turn inside out into a spined cloak when it is frightened. It does ' +
      'not hunt: it drifts in the oxygen minimum eating what falls past.',
    note: 'When threatened it releases a cloud of glowing mucus instead of ink, and leaves.',
    weight: 2,
  },
  {
    id: 'gloaming_hatchet', name: 'Violet Hatchetfish', latin: 'Sternoptyx violacea',
    group: 'fish', rarity: 'common', regions: ['gloaming_canyon'], depth: [380, 850], size: [3, 7],
    behaviour: 'school', capture: ['net', 'sampler'], value: 38, research: 15, discipline: 'biology',
    speed: 1.2, agility: 1.1, wariness: 0.5, school: [8, 22],
    anatomy: { body: 'compressed', head: 'blunt', tail: 'forked', eyes: 'tubular', extras: ['photophores'], girth: 0.32, glow: 0.9 },
    colors: ['#b8c0d8', '#8f7fe0'], anim: 0,
    description: 'A silver coin on edge with lights along the bottom and eyes pointed straight up.',
    weight: 8,
  },
  {
    id: 'ribbon_oarfish', name: 'Gloaming Oarfish', latin: 'Regalecus crepusculi',
    group: 'fish', rarity: 'legendary', regions: ['gloaming_canyon', 'blue_drop'], depth: [300, 900], size: [400, 900],
    behaviour: 'drifter', capture: ['photo', 'scan'], protected: true,
    value: 0, research: 140, discipline: 'biology',
    speed: 1.1, agility: 0.4, wariness: 0.5,
    anatomy: { body: 'ribbon', head: 'blunt', tail: 'none', dorsal: 'fringe', pectoral: 'long', eyes: 'large', extras: ['crest'], girth: 0.035 },
    colors: ['#d8dce4', '#d0405c'], anim: 2,
    palette: { fin: '#e0405c', glow: '#ff8fa8' },
    description:
      'Nine metres of silver ribbon standing vertically in the water with a crimson crest ' +
      'along its whole back. Sailors have been calling these sea serpents for a very long time ' +
      'and it is hard to say they were wrong.',
    note: 'It swims head-up, undulating only the dorsal fin. The body stays perfectly straight.',
    weight: 1,
  },
  {
    id: 'canyon_prawn', name: 'Scarlet Canyon Prawn', latin: 'Acanthephyra caverna',
    group: 'crustacean', rarity: 'common', regions: ['gloaming_canyon'], depth: [400, 1000], size: [8, 16],
    behaviour: 'loose', capture: ['trap', 'net'], bait: ['bait_fish_scrap'],
    value: 52, research: 14, discipline: 'biology',
    speed: 1.0, agility: 1.3, wariness: 0.4, school: [4, 12],
    anatomy: { body: 'segmented', head: 'none', tail: 'fan', eyes: 'stalked', extras: ['antennae', 'spines'], girth: 0.17, segments: 8, glow: 0.3 },
    colors: ['#c8203c', '#f08090'], anim: 5,
    description:
      'Scarlet, because red light does not reach this deep and red is therefore invisible. ' +
      'Under a submarine lamp it is the brightest thing in the canyon.',
    note: 'When attacked it vomits a cloud of glowing fluid at the attacker and swims off dark.',
    weight: 9,
  },
  {
    id: 'canyon_chimaera', name: 'Spookfish', latin: 'Chimaera spectralis',
    group: 'shark', rarity: 'rare', regions: ['gloaming_canyon'], depth: [450, 1100], size: [70, 130],
    behaviour: 'solitary', capture: ['photo', 'trap'], bait: ['bait_fish_scrap'],
    value: 224, research: 56, discipline: 'biology',
    speed: 1.3, agility: 0.7, wariness: 0.5,
    anatomy: { body: 'spindle', head: 'bulbous', tail: 'whip', dorsal: 'spiny', pectoral: 'wing', eyes: 'large', pattern: 'plain', girth: 0.12 },
    colors: ['#8e93a8', '#e8ecf4'], anim: 0,
    palette: { eye: '#c8f0e0' },
    description:
      'A relative of the sharks that split off four hundred million years ago and has been ' +
      'quietly getting stranger ever since. Enormous green eyes, wing-like fins, and a tail ' +
      'like a length of string.',
    note: 'The eyes shine back at a lamp with a flat, unblinking green. It is unsettling and it should not be.',
    weight: 2,
  },
  {
    id: 'glass_octopus', name: 'Glass Octopus', latin: 'Vitreledonella vitrea',
    group: 'cephalopod', rarity: 'exotic', regions: ['gloaming_canyon', 'nightfall_plain'], depth: [500, 2000], size: [25, 45],
    behaviour: 'drifter', capture: ['drone', 'photo'], value: 420, research: 92, discipline: 'abyssal',
    speed: 0.7, agility: 1.0, wariness: 0.4,
    anatomy: { body: 'mantle', head: 'none', tail: 'none', pectoral: 'none', eyes: 'tubular', extras: ['tentacles'], girth: 0.2, glow: 0.25 },
    colors: ['#cfe4ee', '#8fb8d0'], anim: 6,
    palette: { base: '#d4e8f0', belly: '#eef8fc', fin: '#b8d8e8' },
    description:
      'Almost entirely transparent. What you can see of it is the optic nerves, the gut and ' +
      'the eyes, hanging in the water in the shape of an octopus.',
    note: 'Fewer than a dozen have ever been observed alive. This is now several dozen.',
    weight: 1,
  },
  {
    id: 'canyon_grenadier', name: 'Rattail', latin: 'Coryphaenoides caverna',
    group: 'fish', rarity: 'common', regions: ['gloaming_canyon', 'nightfall_plain'], depth: [600, 3000], size: [40, 90],
    behaviour: 'scavenger', capture: ['trap', 'rod'], bait: ['bait_fish_scrap'],
    value: 66, research: 16, discipline: 'biology',
    speed: 1.0, agility: 0.6, wariness: 0.25,
    anatomy: { body: 'spindle', head: 'pointed', tail: 'whip', dorsal: 'fringe', pectoral: 'small', eyes: 'large', pattern: 'plain', girth: 0.13 },
    colors: ['#5c5f6b', '#9fa4b0'], anim: 0,
    description:
      'The commonest large fish in the deep ocean by a wide margin, and one almost nobody ' +
      'has heard of. Follows the smell of a dead thing for kilometres.',
    weight: 10,
  },
  {
    id: 'brittle_star_deep', name: 'Gloaming Brittle Star', latin: 'Ophiura crepusculi',
    group: 'echinoderm', rarity: 'common', regions: ['gloaming_canyon', 'halloway_deep'], depth: [400, 2100], size: [10, 24],
    behaviour: 'sessile', capture: ['claw', 'sampler'], value: 34, research: 12, discipline: 'biology',
    speed: 0.2, agility: 0.4, wariness: 0.1,
    anatomy: { body: 'star', head: 'none', tail: 'none', eyes: 'none', segments: 5, girth: 0.18, glow: 0.4 },
    colors: ['#7f5f9c', '#d0b0ff'], anim: 7,
    description:
      'Five whip-thin arms that flicker with light when disturbed, and detach entirely if ' +
      'grabbed. It grows them back.',
    weight: 8,
  },
  {
    id: 'canyon_isopod', name: 'Canyon Isopod', latin: 'Bathynomus caverna',
    group: 'crustacean', rarity: 'uncommon', regions: ['gloaming_canyon', 'nightfall_plain'], depth: [500, 3500], size: [18, 40],
    behaviour: 'scavenger', capture: ['trap', 'claw'], bait: ['bait_fish_scrap'],
    value: 112, research: 28, discipline: 'biology',
    speed: 0.4, agility: 0.5, wariness: 0.15,
    anatomy: { body: 'segmented', head: 'none', tail: 'fan', eyes: 'large', extras: ['antennae', 'plates', 'legs'], girth: 0.24, segments: 9 },
    colors: ['#c4b096', '#6a5a48'], anim: 5,
    description:
      'A woodlouse the size of a cat. Arrives at a fallen carcass within hours, eats until it ' +
      'cannot walk, and then does not eat again for years.',
    note: 'One kept in an aquarium refused food for five years and appeared entirely well.',
    weight: 6,
  },
  {
    id: 'stoplight_loosejaw', name: 'Stoplight Loosejaw', latin: 'Malacosteus niger',
    group: 'fish', rarity: 'rare', regions: ['gloaming_canyon'], depth: [500, 1300], size: [15, 26],
    behaviour: 'ambush', capture: ['lure', 'trap'], bait: ['bait_lumen'],
    value: 198, research: 48, discipline: 'abyssal',
    speed: 1.2, agility: 0.8, wariness: 0.4,
    anatomy: { body: 'spindle', head: 'jawed', tail: 'fan', dorsal: 'small', pectoral: 'none', eyes: 'large', extras: ['photophores', 'barbels'], girth: 0.12, glow: 0.8 },
    colors: ['#1a1820', '#e04030'], anim: 0,
    palette: { glow: '#ff5040' },
    description:
      'Carries a red searchlight under each eye and can see red, which almost nothing else ' +
      'down here can. It hunts with a torch nobody else can detect.',
    note: 'The jaw has no floor. It closes on prey like a trap with nothing in the way.',
    weight: 2,
  },
  {
    id: 'canyon_pyrosome', name: 'Fire Column', latin: 'Pyrosoma columnare',
    group: 'jelly', rarity: 'uncommon', regions: ['gloaming_canyon', 'blue_drop'], depth: [200, 900], size: [60, 300],
    behaviour: 'drifter', capture: ['sampler', 'photo'], value: 88, research: 34, discipline: 'oceanography',
    speed: 0.2, agility: 0.05, wariness: 0,
    anatomy: { body: 'barrel', head: 'none', tail: 'none', eyes: 'none', girth: 0.14, glow: 0.85 },
    colors: ['#e8b0d0', '#fff0f8'], anim: 4,
    description:
      'A hollow tube of thousands of individual animals, open at one end, drifting mouth-first. ' +
      'Touch it anywhere and a wave of blue light runs the whole length.',
    note: 'The light is contagious between colonies. Two touching pyrosomes will flash together.',
    weight: 4,
  },
  {
    id: 'gloaming_medusa', name: 'Bell of the Gloaming', latin: 'Atolla crepusculi',
    group: 'jelly', rarity: 'uncommon', regions: ['gloaming_canyon'], depth: [420, 1200], size: [12, 26],
    behaviour: 'drifter', capture: ['sampler', 'photo'], value: 78, research: 26, discipline: 'biology',
    speed: 0.45, agility: 0.2, wariness: 0,
    anatomy: { body: 'bell', head: 'none', tail: 'none', eyes: 'none', girth: 0.17, glow: 0.95 },
    colors: ['#8c1830', '#ff5a7a'], anim: 1,
    description:
      'Deep crimson with one trailing tentacle far longer than the rest. When attacked it ' +
      'fires a rotating pinwheel of blue light — a burglar alarm, calling something larger.',
    note: 'The alarm works. Follow one that is flashing and something will arrive.',
    weight: 5,
  },

  // --- The Emberfield ---------------------------------------------------
  {
    id: 'vent_shrimp', name: 'Ember Shrimp', latin: 'Rimicaris ignis',
    group: 'crustacean', rarity: 'common', regions: ['emberfield'], depth: [700, 1320], size: [3, 6],
    behaviour: 'loose', capture: ['net', 'sampler'], value: 46, research: 16, discipline: 'biology',
    speed: 0.9, agility: 1.4, wariness: 0.3, school: [30, 90],
    anatomy: { body: 'segmented', head: 'none', tail: 'fan', eyes: 'none', extras: ['antennae'], girth: 0.18, segments: 6 },
    colors: ['#e8d0b8', '#c04a2c'], anim: 5,
    description:
      'Swarms in the thousands on the flanks of a chimney, in water at eighty degrees. It has ' +
      'no eyes, but a patch of light-sensitive tissue on its back that reads the glow of the vent.',
    note: 'The vents glow faintly in the infrared. The shrimp are using it to avoid being boiled.',
    weight: 14,
  },
  {
    id: 'vent_tubeworm_giant', name: 'Ember Tubeworm', latin: 'Riftia ignea',
    group: 'worm', rarity: 'common', regions: ['emberfield'], depth: [720, 1300], size: [60, 210],
    behaviour: 'sessile', capture: ['sampler', 'claw'], value: 68, research: 26, discipline: 'biology',
    speed: 0, agility: 0, wariness: 0,
    anatomy: { body: 'worm', head: 'none', tail: 'none', eyes: 'none', extras: ['frill'], girth: 0.05, segments: 12 },
    colors: ['#f2ece0', '#d02c28'], anim: 7,
    description:
      'Two metres of white tube with a scarlet plume. It has no mouth, no gut and no anus: ' +
      'bacteria living inside it convert hydrogen sulphide into food, and it lives on that.',
    note: 'It grows faster than almost any marine invertebrate known. Nothing else has that deal.',
    weight: 10,
  },
  {
    id: 'scaly_foot_snail', name: 'Ironfoot Snail', latin: 'Chrysomallon ferrum',
    group: 'echinoderm', rarity: 'rare', regions: ['emberfield'], depth: [800, 1300], size: [3, 6],
    behaviour: 'sessile', capture: ['claw', 'sampler'], value: 235, research: 62, discipline: 'geology',
    speed: 0.02, agility: 0.05, wariness: 0,
    anatomy: { body: 'globe', head: 'none', tail: 'none', dorsal: 'none', pectoral: 'none', eyes: 'none', extras: ['shell', 'plates'], girth: 0.3 },
    colors: ['#3a3a42', '#8c7f5c'], anim: 7,
    description:
      'Armours its foot with plates of iron sulphide taken straight out of the vent fluid. ' +
      'It is the only animal known to build any part of itself from metal.',
    note: 'A specimen will rust in a laboratory. The Institute keeps theirs in oil.',
    weight: 2,
  },
  {
    id: 'ember_crab', name: 'Yeti Crab', latin: 'Kiwa hirsuta',
    group: 'crustacean', rarity: 'uncommon', regions: ['emberfield'], depth: [750, 1300], size: [10, 18],
    behaviour: 'sessile', capture: ['claw', 'trap'], value: 148, research: 38, discipline: 'biology',
    speed: 0.3, agility: 0.5, wariness: 0.2,
    anatomy: { body: 'crab', head: 'none', tail: 'none', eyes: 'none', extras: ['claws', 'carapace', 'beard'], girth: 0.28, segments: 4 },
    colors: ['#eae2d0', '#c0b090'], anim: 5,
    description:
      'Pale, blind and covered in bristles that it farms bacteria on. It waves its arms ' +
      'rhythmically over the vent flow to keep the crop supplied.',
    note: 'It is dancing to feed itself. This is not a figure of speech; the motion is regular.',
    weight: 5,
  },
  {
    id: 'ember_eelpout', name: 'Ember Eelpout', latin: 'Thermarces ignis',
    group: 'fish', rarity: 'common', regions: ['emberfield'], depth: [720, 1320], size: [18, 34],
    behaviour: 'ambush', capture: ['trap', 'rod'], bait: ['bait_vent_shrimp'],
    value: 74, research: 20, discipline: 'biology',
    speed: 0.9, agility: 0.7, wariness: 0.25,
    anatomy: { body: 'eel', head: 'blunt', tail: 'fan', dorsal: 'fringe', pectoral: 'small', eyes: 'tiny', pattern: 'plain', girth: 0.11 },
    colors: ['#e8c8b0', '#a06848'], anim: 2,
    description:
      'Pink, soft and almost translucent, lying in coils among the tubeworms eating the ' +
      'shrimp that get too close.',
    weight: 8,
  },
  {
    id: 'ember_octopod', name: 'Ashen Octopod', latin: 'Muusoctopus cinereus',
    group: 'cephalopod', rarity: 'uncommon', regions: ['emberfield'], depth: [800, 1320], size: [25, 50],
    behaviour: 'hider', capture: ['drone', 'photo'], value: 168, research: 42, discipline: 'biology',
    speed: 0.8, agility: 1.0, wariness: 0.5,
    anatomy: { body: 'mantle', head: 'none', tail: 'none', pectoral: 'none', eyes: 'normal', extras: ['tentacles'], girth: 0.24 },
    colors: ['#b0a098', '#6a4a4a'], anim: 6,
    description:
      'Broods its eggs on warm rock near a vent, one female to a crevice, for years without ' +
      'eating. Then the eggs hatch and she dies.',
    note: 'The longest recorded brooding period of any animal: four and a half years.',
    weight: 4,
  },
  {
    id: 'sulphur_polychaete', name: 'Pompeii Worm', latin: 'Alvinella pompeiana',
    group: 'worm', rarity: 'uncommon', regions: ['emberfield'], depth: [780, 1320], size: [6, 14],
    behaviour: 'sessile', capture: ['sampler'], value: 96, research: 34, discipline: 'biology',
    speed: 0, agility: 0, wariness: 0,
    anatomy: { body: 'worm', head: 'none', tail: 'none', eyes: 'none', extras: ['filaments'], girth: 0.09, segments: 14 },
    colors: ['#d8c8a0', '#a03a2c'], anim: 7,
    description:
      'Lives in a paper tube on the chimney wall with its tail in water at eighty degrees and ' +
      'its head in water at twenty-two. The largest thermal gradient any animal endures.',
    weight: 6,
  },
  {
    id: 'ember_zoarcid', name: 'Chimney Grazer', latin: 'Pachycara fumaria',
    group: 'fish', rarity: 'uncommon', regions: ['emberfield'], depth: [850, 1320], size: [22, 44],
    behaviour: 'patrol', capture: ['trap', 'rod'], bait: ['bait_vent_shrimp'],
    value: 88, research: 24, discipline: 'biology',
    speed: 1.1, agility: 0.8, wariness: 0.35,
    anatomy: { body: 'eel', head: 'blunt', tail: 'fan', dorsal: 'fringe', pectoral: 'small', eyes: 'tiny', pattern: 'mottled', girth: 0.1 },
    colors: ['#8a8272', '#c8b898'], anim: 2,
    description: 'Works its way up and down the chimneys picking shrimp off the mineral crust.',
    weight: 7,
  },
  {
    id: 'ember_anemone', name: 'Ember Anemone', latin: 'Maractis ignea',
    group: 'echinoderm', rarity: 'common', regions: ['emberfield'], depth: [700, 1320], size: [8, 20],
    behaviour: 'sessile', capture: ['sampler', 'claw'], value: 42, research: 14, discipline: 'biology',
    speed: 0, agility: 0, wariness: 0,
    anatomy: { body: 'star', head: 'none', tail: 'none', eyes: 'none', segments: 11, girth: 0.28, glow: 0.2 },
    colors: ['#e07a3c', '#ffd8a0'], anim: 7,
    description: 'Rings the base of every chimney in a collar of orange, waiting for the current to bring something.',
    weight: 9,
  },
  {
    id: 'ember_leviathan_worm', name: 'Ember Serpent', latin: 'Ignisanguis profundus',
    group: 'worm', rarity: 'exotic', regions: ['emberfield'], depth: [900, 1320], size: [180, 340],
    behaviour: 'burrower', capture: ['photo', 'scan'], protected: true,
    value: 0, research: 118, discipline: 'abyssal',
    speed: 1.4, agility: 0.6, wariness: 0.6,
    anatomy: { body: 'worm', head: 'jawed', tail: 'pointed', eyes: 'none', extras: ['plates', 'filaments'], girth: 0.075, segments: 26, glow: 0.5 },
    colors: ['#4a1a18', '#ff8040'], anim: 2,
    description:
      'Three metres of segmented worm with a mouth at both apparent ends and a habit of ' +
      'rising vertically out of the basalt when the vent flow changes. Not in any index.',
    note: 'Only one end is a mouth. The other is a lure. It has been getting away with this for a long time.',
    requires: 'research.abyssal_biology_1',
    weight: 1,
  },
  {
    id: 'basalt_limpet', name: 'Basalt Limpet', latin: 'Lepetodrilus basalti',
    group: 'echinoderm', rarity: 'common', regions: ['emberfield'], depth: [700, 1320], size: [1, 3],
    behaviour: 'sessile', capture: ['claw', 'sampler'], value: 22, research: 8, discipline: 'geology',
    speed: 0.01, agility: 0.05, wariness: 0,
    anatomy: { body: 'globe', head: 'none', tail: 'none', dorsal: 'none', pectoral: 'none', eyes: 'none', extras: ['shell'], girth: 0.3 },
    colors: ['#5a5248', '#8c8070'], anim: 7,
    description: 'Fifteen hundred to the square metre in places. The vent field runs on these.',
    weight: 12,
  },
  {
    id: 'plume_jelly', name: 'Plume Jelly', latin: 'Benthocodon fumus',
    group: 'jelly', rarity: 'uncommon', regions: ['emberfield', 'halloway_deep'], depth: [800, 1900], size: [6, 14],
    behaviour: 'drifter', capture: ['sampler', 'photo'], value: 84, research: 26, discipline: 'biology',
    speed: 0.5, agility: 0.3, wariness: 0,
    anatomy: { body: 'bell', head: 'none', tail: 'none', eyes: 'none', girth: 0.19, glow: 0.6 },
    colors: ['#8c2c3c', '#ffb0a0'], anim: 1,
    description:
      'An opaque red bell — unusual for a jelly — that hides the glow of whatever it has just ' +
      'eaten. Transparency is a liability when your food is luminous.',
    weight: 6,
  },

  // --- Halloway Deep ----------------------------------------------------
  {
    id: 'halloway_tripod', name: 'Tripod Fish', latin: 'Bathypterois halloway',
    group: 'fish', rarity: 'uncommon', regions: ['halloway_deep', 'nightfall_plain'], depth: [1200, 4200], size: [25, 40],
    behaviour: 'sessile', capture: ['photo', 'trap'], value: 156, research: 44, discipline: 'biology',
    speed: 0.5, agility: 0.3, wariness: 0.2,
    anatomy: { body: 'spindle', head: 'pointed', tail: 'trident', dorsal: 'small', pectoral: 'long', eyes: 'tiny', pattern: 'plain', girth: 0.1 },
    colors: ['#d8cfc0', '#8a8070'], anim: 0,
    description:
      'Stands on the seabed on three elongated fin rays, facing into the current with its ' +
      'pectorals held up like antennae, and waits. It may stand there for days.',
    note: 'It is effectively blind. The raised fins are feeling for prey drifting past.',
    weight: 4,
  },
  {
    id: 'halloway_cusk', name: 'Colonnade Cusk-eel', latin: 'Bassozetus columnae',
    group: 'fish', rarity: 'common', regions: ['halloway_deep'], depth: [1200, 2150], size: [30, 65],
    behaviour: 'scavenger', capture: ['trap', 'rod'], bait: ['bait_fish_scrap'],
    value: 92, research: 22, discipline: 'biology',
    speed: 0.9, agility: 0.5, wariness: 0.2,
    anatomy: { body: 'eel', head: 'blunt', tail: 'pointed', dorsal: 'fringe', pectoral: 'small', eyes: 'tiny', pattern: 'plain', girth: 0.1 },
    colors: ['#b0a8a0', '#6a625c'], anim: 2,
    description: 'Pale and slack-bodied, drifting between the fallen columns with no obvious hurry.',
    weight: 9,
  },
  {
    id: 'sea_pig', name: 'Sea Pig', latin: 'Scotoplanes globosa',
    group: 'echinoderm', rarity: 'common', regions: ['halloway_deep', 'nightfall_plain'], depth: [1400, 5200], size: [8, 16],
    behaviour: 'loose', capture: ['claw', 'sampler'], value: 58, research: 20, discipline: 'biology',
    speed: 0.15, agility: 0.3, wariness: 0.05, school: [4, 14],
    anatomy: { body: 'globe', head: 'none', tail: 'none', dorsal: 'none', pectoral: 'none', eyes: 'none', extras: ['legs', 'antennae'], girth: 0.32, segments: 5 },
    colors: ['#e8c8b8', '#c09080'], anim: 5,
    description:
      'A pink, translucent sea cucumber that walks on inflatable legs. They gather in herds ' +
      'of a dozen, all facing the same way, all pointing into the current.',
    note: 'Everyone who sees one for the first time laughs. This is the correct response.',
    weight: 8,
  },
  {
    id: 'halloway_amphipod', name: 'Terrace Amphipod', latin: 'Eurythenes halloway',
    group: 'crustacean', rarity: 'common', regions: ['halloway_deep', 'nightfall_plain'], depth: [1200, 5400], size: [4, 12],
    behaviour: 'scavenger', capture: ['trap', 'sampler'], bait: ['bait_fish_scrap'],
    value: 38, research: 14, discipline: 'biology',
    speed: 0.8, agility: 1.2, wariness: 0.2, school: [10, 40],
    anatomy: { body: 'segmented', head: 'none', tail: 'fan', eyes: 'tiny', extras: ['antennae', 'legs'], girth: 0.2, segments: 8 },
    colors: ['#e0dcc8', '#a09880'], anim: 5,
    description:
      'A bait trap left for an hour will come up containing several hundred of these and ' +
      'nothing else. They find food from a kilometre away.',
    weight: 12,
  },
  {
    id: 'stone_crinoid', name: 'Colonnade Crinoid', latin: 'Bathycrinus lapidis',
    group: 'echinoderm', rarity: 'uncommon', regions: ['halloway_deep'], depth: [1300, 2150], size: [20, 45],
    behaviour: 'sessile', capture: ['sampler', 'claw'], value: 104, research: 30, discipline: 'biology',
    speed: 0, agility: 0, wariness: 0,
    anatomy: { body: 'star', head: 'none', tail: 'none', eyes: 'none', segments: 10, girth: 0.2, glow: 0.15 },
    colors: ['#e0d8c0', '#b0a488'], anim: 7,
    description:
      'A sea lily on a stalk, holding a fan of arms into the current. They grow thickest on ' +
      'the dressed stone, which is worth thinking about.',
    note: 'The colonies here follow the terrace edges exactly. Crinoids do not usually do that.',
    weight: 6,
  },
  {
    id: 'halloway_dumbo', name: 'Dumbo Octopus', latin: 'Grimpoteuthis halloway',
    group: 'cephalopod', rarity: 'rare', regions: ['halloway_deep', 'nightfall_plain'], depth: [1400, 5000], size: [20, 40],
    behaviour: 'drifter', capture: ['drone', 'photo'], value: 296, research: 72, discipline: 'abyssal',
    speed: 0.6, agility: 0.9, wariness: 0.3,
    anatomy: { body: 'mantle', head: 'none', tail: 'none', pectoral: 'wing', eyes: 'large', extras: ['tentacles'], girth: 0.26, glow: 0.15 },
    colors: ['#d4a8b0', '#8a5a68'], anim: 3,
    description:
      'Swims by flapping two ear-like fins on the top of its head, arms trailing in a webbed ' +
      'bell beneath. It is one of the most purely delightful animals in the ocean.',
    note: 'It swallows its prey whole and entire. There is no beak worth speaking of.',
    weight: 2,
  },
  {
    id: 'halloway_glassfish', name: 'Halloway Glassfish', latin: 'Cryptopsaras vitrea',
    group: 'fish', rarity: 'rare', regions: ['halloway_deep'], depth: [1300, 2150], size: [10, 20],
    behaviour: 'lightShy', capture: ['drone', 'sampler'], value: 218, research: 54, discipline: 'abyssal',
    speed: 1.0, agility: 1.2, wariness: 0.8,
    anatomy: { body: 'spindle', head: 'bulbous', tail: 'fan', dorsal: 'small', eyes: 'ring', extras: ['glowSpots'], girth: 0.19, glow: 0.7 },
    colors: ['#a8c0c8', '#5ec0b0'], anim: 0,
    palette: { base: '#b4ccd4', belly: '#dfeef2' },
    description:
      'Transparent to the point that its own skeleton is the most visible part of it, with a ' +
      'ring of green light around each eye. Flees the lamps immediately.',
    weight: 3,
  },
  {
    id: 'terrace_holothurian', name: 'Blue Sea Cucumber', latin: 'Enypniastes caerulea',
    group: 'echinoderm', rarity: 'uncommon', regions: ['halloway_deep'], depth: [1200, 2150], size: [12, 25],
    behaviour: 'drifter', capture: ['sampler', 'photo'], value: 128, research: 36, discipline: 'biology',
    speed: 0.4, agility: 0.4, wariness: 0.3,
    anatomy: { body: 'barrel', head: 'none', tail: 'none', eyes: 'none', extras: ['frill', 'filaments'], girth: 0.22, glow: 0.55 },
    colors: ['#5c7fd0', '#c8dcff'], anim: 4,
    description:
      'A sea cucumber that swims, which is already surprising, by flapping a translucent veil ' +
      'around its mouth. Its entire skin can shed and glow if something bites it.',
    note: 'The glowing skin sticks to the attacker, and then something larger eats the attacker.',
    weight: 4,
  },
  {
    id: 'halloway_lophiid', name: 'Statue Angler', latin: 'Lophiodes statuae',
    group: 'fish', rarity: 'rare', regions: ['halloway_deep'], depth: [1400, 2150], size: [26, 52],
    behaviour: 'ambush', capture: ['lure', 'trap'], bait: ['bait_lumen'],
    value: 242, research: 60, discipline: 'abyssal',
    speed: 0.6, agility: 0.5, wariness: 0.2,
    anatomy: { body: 'globe', head: 'lantern', tail: 'fan', dorsal: 'none', pectoral: 'long', eyes: 'tiny', extras: ['lure', 'spines'], girth: 0.3, glow: 0.9 },
    colors: ['#2c2a30', '#8fe0c8'], anim: 0,
    description:
      'Sits among the fallen statuary with its lure held out and does not move for hours. ' +
      'The sonar returns are indistinguishable from the carvings.',
    weight: 3,
  },
  {
    id: 'halloway_squid', name: 'Colonnade Squid', latin: 'Chiroteuthis columnae',
    group: 'cephalopod', rarity: 'uncommon', regions: ['halloway_deep'], depth: [1200, 2150], size: [35, 80],
    behaviour: 'drifter', capture: ['drone', 'net'], value: 172, research: 44, discipline: 'biology',
    speed: 1.1, agility: 1.0, wariness: 0.5,
    anatomy: { body: 'mantle', head: 'none', tail: 'none', pectoral: 'long', eyes: 'large', extras: ['tentacles', 'photophores'], girth: 0.12, glow: 0.55 },
    colors: ['#a05c7c', '#ffd0e0'], anim: 6,
    description:
      'Hangs vertically with two enormously long feeding tentacles trailing below, each ' +
      'tipped with a small light. It fishes with itself.',
    weight: 5,
  },
  {
    id: 'ghost_shark_halloway', name: 'Halloway Ghost Shark', latin: 'Hydrolagus halloway',
    group: 'shark', rarity: 'exotic', regions: ['halloway_deep'], depth: [1500, 2150], size: [90, 150],
    behaviour: 'solitary', capture: ['photo', 'scan'], protected: true,
    value: 0, research: 128, discipline: 'abyssal',
    speed: 1.2, agility: 0.6, wariness: 0.7,
    anatomy: { body: 'spindle', head: 'bulbous', tail: 'whip', dorsal: 'spiny', pectoral: 'wing', eyes: 'large', pattern: 'plain', extras: ['glowSpots'], girth: 0.13, glow: 0.3 },
    colors: ['#c8ccd8', '#8fd8e0'], anim: 0,
    palette: { eye: '#a8f0e0' },
    description:
      'Ivory white, entirely silent, and apparently unbothered by anything. It passes through ' +
      'the colonnades slowly and does not react to the lamps at all.',
    note: 'It has a retractable club of spines on its forehead. Nobody has established what for.',
    weight: 1,
  },
  {
    id: 'halloway_barreleye', name: 'Barreleye', latin: 'Macropinna halloway',
    group: 'fish', rarity: 'exotic', regions: ['halloway_deep', 'glasswork'], depth: [1400, 2800], size: [10, 18],
    behaviour: 'drifter', capture: ['drone', 'photo'], value: 380, research: 96, discipline: 'abyssal',
    speed: 0.6, agility: 0.8, wariness: 0.55,
    anatomy: { body: 'spindle', head: 'bulbous', tail: 'fan', dorsal: 'small', pectoral: 'long', eyes: 'tubular', girth: 0.2, glow: 0.4 },
    colors: ['#3f4a5c', '#7fe0c0'], anim: 0,
    description:
      'Its head is a transparent dome full of clear fluid, and its eyes are two green barrels ' +
      'inside it, pointing straight up through the roof of its own skull. It can rotate them forward.',
    note: 'For eighty years everyone drew it wrong, because the dome collapses when you bring it up.',
    weight: 1,
  },
];
