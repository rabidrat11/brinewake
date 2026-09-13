/**
 * Crafted components, consumables, bait, records and key items.
 */

import type { ItemDef } from '../../items/itemTypes';

export const CRAFTED_ITEMS: ItemDef[] = [
  // --- components -------------------------------------------------------
  {
    id: 'comp_plating', name: 'Rolled Plating', category: 'component', rarity: 'common',
    value: 46, mass: 1.6, stack: 20, model: 'plate', colors: ['#8a8f97', '#5c6068'],
    material: true, discipline: 'engineering', description: 'Steel plate, annealed and rolled to the workshop’s gauge.',
  },
  {
    id: 'comp_ceramic_tile', name: 'Ceramic Tile', category: 'component', rarity: 'uncommon',
    value: 118, mass: 1.0, stack: 20, model: 'tile', colors: ['#e0dcd0', '#a8a49c'],
    material: true, discipline: 'engineering', description: 'Fired at a temperature the harbour kiln can only just reach.',
  },
  {
    id: 'comp_titanium_frame', name: 'Titanium Frame Section', category: 'component', rarity: 'rare',
    value: 340, mass: 2.4, stack: 12, model: 'frame', colors: ['#9aa0a8', '#6b7078'],
    material: true, discipline: 'engineering', description: 'Light, unreasonably strong, and a nuisance to weld.',
  },
  {
    id: 'comp_pressure_ring', name: 'Pressure Ring', category: 'component', rarity: 'rare',
    value: 420, mass: 3.0, stack: 8, model: 'ring_big', colors: ['#7a8088', '#c8a45c'],
    material: true, discipline: 'engineering', description: 'The part that stops the sea getting in. Machined to four microns.',
  },
  {
    id: 'comp_motor', name: 'Sealed Motor', category: 'component', rarity: 'uncommon',
    value: 165, mass: 2.0, stack: 10, model: 'motor', colors: ['#4a4e56', '#c8a45c'],
    material: true, discipline: 'engineering', description: 'Oil-filled and pressure-compensated, so it does not care how deep it goes.',
  },
  {
    id: 'comp_turbine_stage', name: 'Turbine Stage', category: 'component', rarity: 'rare',
    value: 380, mass: 2.6, stack: 8, model: 'turbine', colors: ['#8f939c', '#e0a05c'],
    material: true, discipline: 'engineering', description: 'Nine blades on a single forging. Balanced to a thousandth of a gram.',
  },
  {
    id: 'comp_magnet_coil', name: 'Field Coil', category: 'component', rarity: 'exotic',
    value: 640, mass: 2.2, stack: 6, model: 'coil', colors: ['#b4713c', '#5f9c7a'],
    material: true, discipline: 'engineering', description: 'Eleven kilometres of wire in a package the size of a loaf.',
  },
  {
    id: 'comp_cell_bank', name: 'Cell Bank', category: 'component', rarity: 'uncommon',
    value: 190, mass: 2.8, stack: 10, model: 'cell', colors: ['#3f4a55', '#a8c44c'],
    material: true, discipline: 'engineering', description: 'Twenty-four cells in series, potted in resin.',
  },
  {
    id: 'comp_thermocouple', name: 'Thermocouple Array', category: 'component', rarity: 'rare',
    value: 360, mass: 1.4, stack: 8, model: 'array', colors: ['#c8a45c', '#3a3630'],
    material: true, discipline: 'engineering', description: 'Turns a temperature difference into current. Useless anywhere but a vent field.',
  },
  {
    id: 'comp_reactor_core', name: 'Compact Core', category: 'component', rarity: 'legendary',
    value: 2200, mass: 4.0, stack: 3, model: 'core', colors: ['#2e3440', '#7fffe0'],
    material: true, discipline: 'engineering', description: 'The lab will not explain how it works and the workshop has stopped asking.',
  },
  {
    id: 'comp_lens', name: 'Ground Lens', category: 'component', rarity: 'uncommon',
    value: 140, mass: 0.5, stack: 16, model: 'lens', colors: ['#c8dce4', '#c8a45c'],
    material: true, discipline: 'engineering', description: 'Ground and polished from a single crystal, over four days.',
  },
  {
    id: 'comp_transducer', name: 'Sonar Transducer', category: 'component', rarity: 'uncommon',
    value: 210, mass: 1.2, stack: 12, model: 'transducer', colors: ['#4a5266', '#8fd8f0'],
    material: true, discipline: 'engineering', description: 'Sings at forty kilohertz and listens for what comes back.',
  },
  {
    id: 'comp_hydrophone', name: 'Hydrophone', category: 'component', rarity: 'uncommon',
    value: 175, mass: 0.8, stack: 12, model: 'hydrophone', colors: ['#3a3a3c', '#c8a45c'],
    material: true, discipline: 'oceanography', description: 'Hears a shrimp click at two kilometres. Hears other things further.',
  },
  {
    id: 'comp_servo', name: 'Manipulator Servo', category: 'component', rarity: 'uncommon',
    value: 155, mass: 1.0, stack: 14, model: 'motor', colors: ['#6b7078', '#e0a05c'],
    material: true, discipline: 'engineering', description: 'Enough torque to close a claw on a rock and not let go.',
  },
  {
    id: 'comp_glass_dome', name: 'Pressure Viewport', category: 'component', rarity: 'rare',
    value: 460, mass: 3.4, stack: 6, model: 'dome', colors: ['#c8dce4', '#8a8f97'],
    material: true, discipline: 'engineering', description: 'A truncated cone of acrylic. The deeper you go, the harder the sea holds it in.',
  },
  {
    id: 'comp_ballast_pump', name: 'Ballast Pump', category: 'component', rarity: 'uncommon',
    value: 185, mass: 2.2, stack: 10, model: 'pump', colors: ['#4a5266', '#c8a45c'],
    material: true, discipline: 'engineering', description: 'Moves four hundred litres a minute against whatever the sea has to say about it.',
  },
  {
    id: 'comp_scrubber', name: 'CO2 Scrubber', category: 'component', rarity: 'uncommon',
    value: 130, mass: 1.6, stack: 12, model: 'canister', colors: ['#7a8088', '#5f9c7a'],
    material: true, discipline: 'engineering', description: 'Soda lime in a cartridge. The single most important part of the boat.',
  },
  {
    id: 'comp_insulation', name: 'Thermal Wadding', category: 'component', rarity: 'uncommon',
    value: 96, mass: 0.9, stack: 20, model: 'wadding', colors: ['#e0d8c0', '#c0b090'],
    material: true, discipline: 'engineering', description: 'Spun mineral fibre. Itches unbelievably.',
  },
  {
    id: 'comp_deep_alloy', name: 'Abyssal Alloy Billet', category: 'component', rarity: 'legendary',
    value: 1850, mass: 3.2, stack: 4, model: 'ingot', colors: ['#38304c', '#c0a0ff'],
    material: true, discipline: 'abyssal', description: 'Made from the unnamed alloy, at some cost, and worth every mark of it.',
  },
  {
    id: 'comp_lumen_cell', name: 'Lumen Cell', category: 'component', rarity: 'rare',
    value: 420, mass: 0.6, stack: 10, model: 'cell', colors: ['#e0f8ff', '#8fd8f0'],
    material: true, discipline: 'abyssal', description: 'A lumen pearl in a housing. It has been lit for nine months and shows no sign of stopping.',
  },
  {
    id: 'comp_net_mesh', name: 'Woven Mesh', category: 'component', rarity: 'common',
    value: 34, mass: 0.6, stack: 24, model: 'mesh', colors: ['#8a9078', '#5f6b4c'],
    material: true, discipline: 'engineering', description: 'Tarred twine, knotted by hand on the quayside.',
  },
  {
    id: 'comp_line_spool', name: 'Braided Line', category: 'component', rarity: 'common',
    value: 28, mass: 0.4, stack: 30, model: 'coil', colors: ['#c8c0a0', '#8a8470'],
    material: true, discipline: 'engineering', description: 'Two hundred metres, rated to sixty kilos, and it will be tested.',
  },
  {
    id: 'comp_specimen_jar', name: 'Specimen Jar', category: 'component', rarity: 'common',
    value: 22, mass: 0.5, stack: 30, model: 'jar', colors: ['#c8dce4', '#c8a45c'],
    material: true, discipline: 'biology', description: 'Ground-glass stopper, wire clip, and a label nobody ever fills in.',
  },
  {
    id: 'comp_drone_frame', name: 'Drone Frame', category: 'component', rarity: 'rare',
    value: 480, mass: 2.0, stack: 6, model: 'frame', colors: ['#e8c05c', '#4a4e56'],
    material: true, discipline: 'engineering', description: 'Small, tethered, and far better at catching a jellyfish than a submarine is.',
  },
  {
    id: 'comp_camera_body', name: 'Camera Body', category: 'component', rarity: 'rare',
    value: 390, mass: 1.2, stack: 8, model: 'camera', colors: ['#3a3630', '#c8a45c'],
    material: true, discipline: 'oceanography', description: 'Housed to nine thousand metres, which is optimistic of somebody.',
  },
  {
    id: 'comp_drill_head', name: 'Drill Head', category: 'component', rarity: 'rare',
    value: 355, mass: 2.8, stack: 8, model: 'drillhead', colors: ['#8f939c', '#c8a45c'],
    material: true, discipline: 'engineering', description: 'Tungsten teeth on a hardened crown. Replaceable, and it will need replacing.',
  },
  {
    id: 'comp_stabiliser', name: 'Artefact Stabiliser', category: 'component', rarity: 'exotic',
    value: 780, mass: 1.8, stack: 6, model: 'stabiliser', colors: ['#4a5266', '#c8a45c'],
    material: true, discipline: 'archaeology', description: 'Holds a relic at the pressure it was found at, all the way home.',
  },

  // --- consumables ------------------------------------------------------
  {
    id: 'kit_repair', name: 'Repair Kit', category: 'consumable', rarity: 'common',
    value: 60, mass: 1.0, stack: 12, model: 'kit', colors: ['#c8402c', '#e8e0cc'],
    description: 'Patch, clamp and epoxy. Restores 35 hull, in the field, once.',
  },
  {
    id: 'kit_repair_large', name: 'Hull Foam Charge', category: 'consumable', rarity: 'uncommon',
    value: 190, mass: 1.6, stack: 8, model: 'kit', colors: ['#e0a05c', '#e8e0cc'],
    description: 'Two-part foam that sets in seawater. Restores 90 hull and half a nerve.',
  },
  {
    id: 'kit_sealant', name: 'Pressure Sealant', category: 'consumable', rarity: 'uncommon',
    value: 240, mass: 0.8, stack: 8, model: 'canister', colors: ['#5f9cc8', '#e8e0cc'],
    description: 'Raises effective crush depth by 12 % for three minutes. Do not rely on it twice.',
  },
  {
    id: 'kit_ballast', name: 'Ballast Stones', category: 'consumable', rarity: 'common',
    value: 25, mass: 3.0, stack: 12, model: 'chunk', colors: ['#5c5f68', '#3a3d44'],
    description: 'Sink faster and cheaper. Dropping them is instant, free and irreversible.',
  },
  {
    id: 'kit_charge', name: 'Emergency Cell', category: 'consumable', rarity: 'uncommon',
    value: 140, mass: 1.2, stack: 8, model: 'cell', colors: ['#a8c44c', '#3f4a55'],
    description: 'Forty per cent of a battery, in one lump, for when the lamps start to gutter.',
  },
  {
    id: 'kit_flare', name: 'Marker Flare', category: 'consumable', rarity: 'common',
    value: 30, mass: 0.3, stack: 20, model: 'flare', colors: ['#e0623a', '#ffd8a0'],
    description: 'Burns for four minutes underwater and leaves a mark on the chart.',
  },
  {
    id: 'kit_oxygen', name: 'Spare Scrubber', category: 'consumable', rarity: 'common',
    value: 45, mass: 1.4, stack: 10, model: 'canister', colors: ['#5f9c7a', '#e8e0cc'],
    description: 'Another six hundred seconds of not thinking about it.',
  },
  {
    id: 'bait_worm', name: 'Lugworm', category: 'consumable', rarity: 'common',
    value: 4, mass: 0.1, stack: 60, model: 'bait', colors: ['#a8705c', '#e0c0a8'],
    description: 'Dug out of the harbour flats at low tide. Universally popular.',
  },
  {
    id: 'bait_bread', name: 'Bread Paste', category: 'consumable', rarity: 'common',
    value: 2, mass: 0.1, stack: 60, model: 'bait', colors: ['#e0cfa0', '#c8b078'],
    description: 'It should not work. It works.',
  },
  {
    id: 'bait_shrimp', name: 'Peeled Shrimp', category: 'consumable', rarity: 'common',
    value: 8, mass: 0.1, stack: 50, model: 'bait', colors: ['#f0b0a0', '#e88f7c'],
    description: 'The good bait. Everything wants it, including the things you were not after.',
  },
  {
    id: 'bait_fish_scrap', name: 'Fish Scrap', category: 'consumable', rarity: 'common',
    value: 5, mass: 0.2, stack: 50, model: 'bait', colors: ['#a8a08c', '#8a7f6c'],
    description: 'Whatever the market could not sell. Traps love it.',
  },
  {
    id: 'bait_algae', name: 'Algae Pellet', category: 'consumable', rarity: 'common',
    value: 6, mass: 0.1, stack: 50, model: 'bait', colors: ['#7fae4f', '#5f8f3a'],
    description: 'For grazers, who will ignore anything with a face on it.',
  },
  {
    id: 'bait_urchin', name: 'Cracked Urchin', category: 'consumable', rarity: 'common',
    value: 12, mass: 0.2, stack: 40, model: 'bait', colors: ['#6b5f7a', '#e0c0a8'],
    description: 'Irresistible to anything with the jaw strength to normally do this itself.',
  },
  {
    id: 'bait_sprat', name: 'Live Sprat', category: 'consumable', rarity: 'uncommon',
    value: 18, mass: 0.2, stack: 30, model: 'bait', colors: ['#d6e2e8', '#7fa8bf'],
    description: 'For the fast ones, who will not look at anything that is not running away.',
  },
  {
    id: 'bait_lumen', name: 'Lumen Bait', category: 'consumable', rarity: 'rare',
    value: 85, mass: 0.2, stack: 20, model: 'bait', colors: ['#8ff0e0', '#e0f8ff'],
    description: 'A pinch of luminous bacteria in a gel capsule. The only thing the deep will come to.',
  },
  {
    id: 'bait_vent_shrimp', name: 'Vent Shrimp', category: 'consumable', rarity: 'uncommon',
    value: 40, mass: 0.1, stack: 30, model: 'bait', colors: ['#e8d0b8', '#c04a2c'],
    description: 'Caught by the thousand, and worth more as bait than as a specimen.',
  },
  {
    id: 'kit_tag', name: 'Tracking Tag', category: 'consumable', rarity: 'uncommon',
    value: 110, mass: 0.2, stack: 16, model: 'tag', colors: ['#e0623a', '#3a3a3c'],
    description: 'Fired into the flank of something too large to keep. It reports for two years.',
  },

  // --- records ----------------------------------------------------------
  {
    id: 'data_photo', name: 'Photograph', category: 'data', rarity: 'common',
    value: 0, mass: 0, stack: 999, model: 'photo', colors: ['#e8e0cc', '#3a3a3c'],
    discipline: 'oceanography', researchValue: 8,
    description: 'One exposure. The lab will pay for it in research, not marks.',
  },
  {
    id: 'data_scan', name: 'Scan Record', category: 'data', rarity: 'common',
    value: 0, mass: 0, stack: 999, model: 'photo', colors: ['#8fd8f0', '#2c3a4c'],
    discipline: 'biology', researchValue: 10,
    description: 'A full acoustic and optical profile. Worth more than the animal would have been.',
  },
  {
    id: 'data_sediment', name: 'Sediment Core', category: 'data', rarity: 'uncommon',
    value: 55, mass: 1.2, stack: 12, model: 'core_tube', colors: ['#c8b48a', '#8a7a5c'],
    discipline: 'oceanography', researchValue: 22, donatable: true,
    description: 'Half a metre of mud, and forty thousand years of weather, in order.',
  },
  {
    id: 'data_water_sample', name: 'Water Sample', category: 'data', rarity: 'common',
    value: 18, mass: 0.4, stack: 24, model: 'vial', colors: ['#8fc8d8', '#e8f0f4'],
    discipline: 'oceanography', researchValue: 9,
    description: 'Temperature, salinity, oxygen, and whatever else happened to be in it.',
  },
  {
    id: 'data_hydrophone_log', name: 'Hydrophone Log', category: 'data', rarity: 'uncommon',
    value: 65, mass: 0.2, stack: 16, model: 'reel', colors: ['#4a4e56', '#c8a45c'],
    discipline: 'oceanography', researchValue: 24, donatable: true,
    description: 'Twelve minutes of recording. Four of them are whales. One of them is not.',
  },
  {
    id: 'data_research_log', name: 'Research Log', category: 'data', rarity: 'rare',
    value: 130, mass: 0.3, stack: 12, model: 'book', colors: ['#3a4a5c', '#e0d8c0'],
    discipline: 'archaeology', researchValue: 40, donatable: true,
    description: 'Somebody else’s notebook, recovered from a station that is not on any chart.',
  },

  // --- key items --------------------------------------------------------
  {
    id: 'key_workshop_order', name: 'Workshop Order', category: 'key', rarity: 'uncommon',
    value: 0, mass: 0, stack: 1, model: 'paper', colors: ['#e8e0cc', '#5f4a2c'],
    description: 'Signed and stamped. The workshop will not start without it.',
  },
  {
    id: 'key_institute_pass', name: 'Institute Pass', category: 'key', rarity: 'rare',
    value: 0, mass: 0, stack: 1, model: 'badge', colors: ['#3a5f8f', '#e8e0cc'],
    description: 'Gets you into the back rooms, where they keep the things they will not publish.',
  },
  {
    id: 'key_deep_charter', name: 'Deep Charter', category: 'key', rarity: 'legendary',
    value: 0, mass: 0, stack: 1, model: 'paper', colors: ['#e8e0cc', '#c8402c'],
    description: 'Permission, of a sort, to go below five thousand metres. Mostly it is a waiver.',
  },
  {
    id: 'key_wake_sounding', name: 'The Wake Sounding', category: 'key', rarity: 'mythic',
    value: 0, mass: 0, stack: 1, model: 'reel', colors: ['#38304c', '#c0a0ff'],
    description:
      'Eleven seconds of recording, looped. Everyone who hears it says it sounds like ' +
      'something different, and everyone is quite certain about it.',
  },
];
