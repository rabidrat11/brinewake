/**
 * Leviathans.
 *
 * These are not bosses. They are weather. A leviathan encounter is a scripted
 * moment of scale — the submarine is four metres long and the thing crossing
 * in front of it is thirty — and the correct response is to stop moving and
 * look. They cannot be caught; they can be photographed, scanned and tagged.
 */

import type { SpeciesDef } from '../speciesTypes';

export const LEVIATHAN_SPECIES: SpeciesDef[] = [
  {
    id: 'harbour_whale', name: 'Bay Grey Whale', latin: 'Eschrichtius portus',
    group: 'leviathan', rarity: 'rare', regions: ['lantern_bay', 'kelp_cathedral', 'blue_drop'],
    depth: [4, 180], size: [900, 1400],
    behaviour: 'migratory', capture: ['photo', 'scan'], protected: true,
    value: 0, research: 150, discipline: 'biology',
    speed: 2.6, agility: 0.35, wariness: 0.35,
    anatomy: {
      body: 'torpedo', head: 'blunt', tail: 'paddle', dorsal: 'none', pectoral: 'long',
      pelvic: false, anal: false, eyes: 'normal', pattern: 'mottled',
      extras: ['plates'], girth: 0.11, tall: 1.05, wide: 0.85,
    },
    colors: ['#77808a', '#c8c0b4'], anim: 3,
    description:
      'Fourteen metres of grey whale working its way along the coast, scarred with barnacles ' +
      'and old rope. It passes through the bay twice a year and the whole harbour knows when.',
    note: 'They feed by rolling onto one side and ploughing the seabed. Always the right side.',
    weight: 1,
  },
  {
    id: 'drop_manta', name: 'Blue Drop Manta', latin: 'Mobula caeruli',
    group: 'leviathan', rarity: 'rare', regions: ['blue_drop', 'vermilion_shelf'],
    depth: [10, 320], size: [400, 700],
    behaviour: 'curious', capture: ['photo', 'scan'], protected: true,
    value: 0, research: 120, discipline: 'biology',
    speed: 2.8, agility: 0.8, wariness: 0.2,
    anatomy: {
      body: 'ray', head: 'none', tail: 'whip', eyes: 'normal', pattern: 'saddle',
      extras: ['horn'], girth: 0.08, wide: 1.15, tall: 0.75,
    },
    colors: ['#2f3a4a', '#f2f4f6'], anim: 3,
    description:
      'Seven metres of wing, banking in slow circles through a plankton bloom with its mouth ' +
      'open. It will come and look at a submarine, repeatedly, and quite deliberately.',
    note: 'It has the largest brain of any fish, and it appears to be using most of it on curiosity.',
    weight: 1,
  },
  {
    id: 'kelp_leviathan', name: 'Cathedral Sturgeon', latin: 'Acipenser basilicae',
    group: 'leviathan', rarity: 'rare', regions: ['kelp_cathedral'],
    depth: [30, 98], size: [280, 480],
    behaviour: 'patrol', capture: ['photo', 'scan'], protected: true,
    value: 0, research: 96, discipline: 'biology',
    speed: 1.6, agility: 0.5, wariness: 0.5,
    anatomy: {
      body: 'spindle', head: 'shovel', tail: 'forked', dorsal: 'small', pectoral: 'long',
      eyes: 'tiny', pattern: 'plain', extras: ['plates', 'barbels'], girth: 0.1,
    },
    colors: ['#5f6a52', '#c8c0a0'], anim: 0,
    description:
      'Five metres of armoured, whiskered fish that has not changed shape in two hundred ' +
      'million years. Cruises the forest floor stirring the sediment with its snout.',
    note: 'This individual is tagged. The tag was fitted forty-one years ago and it was already large.',
    weight: 1,
  },
  {
    id: 'shelf_whaleshark', name: 'Vermilion Whale Shark', latin: 'Rhincodon vermilii',
    group: 'leviathan', rarity: 'rare', regions: ['vermilion_shelf', 'blue_drop'],
    depth: [8, 260], size: [700, 1100],
    behaviour: 'migratory', capture: ['photo', 'scan'], protected: true,
    value: 0, research: 140, discipline: 'biology',
    speed: 1.9, agility: 0.4, wariness: 0.15,
    anatomy: {
      body: 'torpedo', head: 'shovel', tail: 'lunate', dorsal: 'tall', pectoral: 'long',
      eyes: 'tiny', pattern: 'spots', girth: 0.12,
    },
    colors: ['#3c4a58', '#e8eef2'], anim: 0,
    description:
      'Eleven metres of shark that eats nothing larger than a fingernail. The spot pattern ' +
      'behind the gills is unique to each animal, like a fingerprint.',
    note: 'This one has a notch out of the upper tail lobe. The Institute calls her Bell.',
    weight: 1,
  },
  {
    id: 'canyon_sixgill', name: 'Gloaming Sixgill', latin: 'Hexanchus crepusculi',
    group: 'leviathan', rarity: 'exotic', regions: ['gloaming_canyon', 'blue_drop'],
    depth: [200, 900], size: [380, 560],
    behaviour: 'patrol', capture: ['photo', 'scan'], protected: true,
    value: 0, research: 170, discipline: 'biology',
    speed: 1.4, agility: 0.4, wariness: 0.45,
    anatomy: {
      body: 'torpedo', head: 'blunt', tail: 'pointed', dorsal: 'small', pectoral: 'long',
      eyes: 'ring', pattern: 'countershade', extras: ['gills'], girth: 0.12, glow: 0.25,
    },
    colors: ['#4a4f58', '#9aa4ae'], anim: 0,
    palette: { eye: '#7fe0c8' },
    description:
      'A five-metre shark with six gill slits instead of five, which is an arrangement that ' +
      'stopped being fashionable in the Jurassic. Rises at night, sinks by day.',
    note: 'Its eyes shine back at a lamp in a flat, luminous green. It does not blink.',
    weight: 1,
  },
  {
    id: 'ember_leviathan', name: 'Emberfield Chimaerid', latin: 'Ignisqualus magnus',
    group: 'leviathan', rarity: 'exotic', regions: ['emberfield'],
    depth: [800, 1320], size: [420, 620],
    behaviour: 'patrol', capture: ['photo', 'scan'], protected: true,
    value: 0, research: 190, discipline: 'abyssal',
    speed: 1.5, agility: 0.5, wariness: 0.55,
    anatomy: {
      body: 'spindle', head: 'jawed', tail: 'whip', dorsal: 'spiny', pectoral: 'wing',
      eyes: 'large', pattern: 'mottled', extras: ['photophores', 'plates'], girth: 0.13, glow: 0.55,
    },
    colors: ['#3a2c28', '#ff8a48'], anim: 0,
    description:
      'Six metres, wing-finned, patrolling the thermal plumes with two rows of orange lights ' +
      'down each flank. Rides the warm water like a glider riding a thermal.',
    weight: 1,
  },
  {
    id: 'halloway_leviathan', name: 'Colonnade Serpent', latin: 'Regalecus halloway',
    group: 'leviathan', rarity: 'legendary', regions: ['halloway_deep'],
    depth: [1200, 2150], size: [900, 1600],
    behaviour: 'drifter', capture: ['photo', 'scan'], protected: true,
    value: 0, research: 280, discipline: 'abyssal',
    speed: 1.1, agility: 0.35, wariness: 0.6,
    anatomy: {
      body: 'ribbon', head: 'blunt', tail: 'ribbon', dorsal: 'fringe', pectoral: 'long',
      eyes: 'large', extras: ['crest', 'glowSpots'], girth: 0.032, glow: 0.5,
    },
    colors: ['#c8ccd8', '#8f5fd0'], anim: 2,
    palette: { fin: '#9f6fe0', glow: '#c8a0ff' },
    description:
      'Sixteen metres of silver ribbon standing upright between the drowned columns with a ' +
      'violet crest running its entire length. It moves without appearing to move.',
    note: 'It holds station in the same courtyard for weeks. The Institute will not print why.',
    weight: 1,
  },
  {
    id: 'glasswork_leviathan', name: 'Glasswork Colossus', latin: 'Architeuthis vitreus',
    group: 'leviathan', rarity: 'legendary', regions: ['glasswork', 'nightfall_plain'],
    depth: [1800, 4200], size: [800, 1500],
    behaviour: 'lightShy', capture: ['photo', 'scan'], protected: true,
    value: 0, research: 320, discipline: 'abyssal',
    speed: 2.4, agility: 0.7, wariness: 0.8,
    anatomy: {
      body: 'mantle', head: 'none', tail: 'none', pectoral: 'long', eyes: 'large',
      extras: ['tentacles', 'photophores'], girth: 0.13, glow: 0.35,
    },
    colors: ['#a04a5c', '#f0c8d0'], anim: 6,
    description:
      'A giant squid, fifteen metres including the feeding tentacles, in a trench made of ' +
      'glass. It holds absolutely still in the beam, considers, and then is not there.',
    note: 'The eye is twenty-seven centimetres across. It is looking directly at you.',
    weight: 1,
  },
  {
    id: 'nightfall_leviathan', name: 'Nightfall Sleeper', latin: 'Somniosus nocturnus',
    group: 'leviathan', rarity: 'legendary', regions: ['nightfall_plain'],
    depth: [3100, 5400], size: [600, 900],
    behaviour: 'patrol', capture: ['photo', 'scan'], protected: true,
    value: 0, research: 300, discipline: 'abyssal',
    speed: 0.9, agility: 0.25, wariness: 0.3,
    anatomy: {
      body: 'torpedo', head: 'blunt', tail: 'lunate', dorsal: 'small', pectoral: 'long',
      eyes: 'none', pattern: 'plain', extras: ['barbels'], girth: 0.13,
    },
    colors: ['#4a4438', '#7a7264'], anim: 0,
    description:
      'Nine metres of sleeper shark moving at a walking pace across the abyssal plain. Both ' +
      'eyes are occupied by a parasitic copepod, permanently. It appears not to mind.',
    note: 'Sleeper sharks live for four hundred years. This one may predate the harbour.',
    weight: 1,
  },
  {
    id: 'brinewake_leviathan', name: 'The Wake', latin: 'incognita maxima',
    group: 'leviathan', rarity: 'mythic', regions: ['brinewake_trench'],
    depth: [6500, 9200], size: [2400, 4200],
    behaviour: 'drifter', capture: ['photo', 'scan'], protected: true,
    value: 0, research: 900, discipline: 'abyssal',
    speed: 1.2, agility: 0.2, wariness: 0.5,
    anatomy: {
      body: 'bell', head: 'none', tail: 'none', eyes: 'none',
      extras: ['filaments', 'tentacles', 'glowSpots'], girth: 0.16, glow: 0.85,
    },
    colors: ['#3a2860', '#c0a0ff'], anim: 1,
    palette: { fin: '#7f5fd0', glow: '#d8c0ff' },
    description:
      'Forty metres of something bell-shaped and slowly pulsing at the bottom of the deepest ' +
      'trench in the world. The filaments trail out of sonar range in every direction. It ' +
      'does not react to the submarine, to the lamps, or to the sonar.',
    note:
      'The pulse is regular: one every eleven seconds, and it has been eleven seconds in every ' +
      'recording anyone has ever made, at every depth, for as long as there have been recordings.',
    requires: 'quest.the_wake',
    weight: 1,
  },
  {
    id: 'white_whale', name: 'The Pale Cow', latin: 'Eschrichtius albus',
    group: 'leviathan', rarity: 'mythic', regions: ['lantern_bay', 'blue_drop', 'kelp_cathedral'],
    depth: [4, 300], size: [1100, 1500],
    behaviour: 'migratory', capture: ['photo', 'scan'], protected: true,
    value: 0, research: 420, discipline: 'biology',
    speed: 2.4, agility: 0.35, wariness: 0.75,
    anatomy: {
      body: 'torpedo', head: 'blunt', tail: 'paddle', dorsal: 'none', pectoral: 'long',
      pelvic: false, anal: false, eyes: 'normal', pattern: 'plain', girth: 0.115,
    },
    colors: ['#e8e4dc', '#c0bcb4'], anim: 3,
    palette: { base: '#f0ece4', belly: '#fbf9f4' },
    description:
      'An entirely white grey whale. Six recorded sightings in ninety years, four of them by ' +
      'the same fisherman, who nobody believed. The harbour will believe a photograph.',
    note: 'Not albino: the eyes are dark. Nobody has an explanation and everyone has a theory.',
    weight: 1,
  },
  {
    id: 'drowned_bell_swarm', name: 'Bell Chorus', latin: 'Stygiomedusa gregis',
    group: 'leviathan', rarity: 'exotic', regions: ['gloaming_canyon', 'halloway_deep'],
    depth: [600, 2100], size: [200, 420],
    behaviour: 'drifter', capture: ['photo', 'scan'], protected: true,
    value: 0, research: 210, discipline: 'abyssal',
    speed: 0.5, agility: 0.15, wariness: 0.1, school: [4, 9],
    anatomy: { body: 'bell', head: 'none', tail: 'none', eyes: 'none', girth: 0.19, glow: 0.7 },
    colors: ['#4a2050', '#e090c0'], anim: 1,
    description:
      'Four-metre bells, six or seven of them, all pulsing at the same rate and drifting in ' +
      'formation. They are not touching and they are not connected and they are in time.',
    weight: 1,
  },
];
