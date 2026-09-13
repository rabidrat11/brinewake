/**
 * Submarine modules.
 *
 * Everything that can be bolted to the boat. A module contributes stat deltas,
 * occupies slots and mass, and may change the hull's appearance. The
 * progression is deliberately not a single ladder: hulls buy depth, power buys
 * range, lamps and sonar buy *seeing*, and tools buy the ability to take
 * things — and at any point a player can be strong on one axis and weak on the
 * others, which is what makes loadout a decision.
 */

import type { SubStats } from '../submarine/stats';
import type { Discipline } from '../items/itemTypes';
import type { SubVisualSpec } from '../procedural/submarineBuilder';

export type ModuleCategory =
  | 'hull' | 'engine' | 'power' | 'lamp' | 'sonar' | 'tool' | 'storage' | 'module';

export interface ModuleDef {
  id: string;
  name: string;
  category: ModuleCategory;
  /** 0 starter .. 5 endgame. */
  tier: number;
  /** Slots consumed. Hull, engine, power, lamp and sonar are fitted, not slotted. */
  slots: number;
  /** Mass added, against the hull's budget. */
  mass: number;
  /** Purchase price in marks; omitted for craft-only modules. */
  price?: number;
  /** Materials consumed to fabricate it. */
  recipe?: { item: string; count: number }[];
  /** Research node that must be unlocked first. */
  requires?: string;
  /** Modules that must already be fitted. */
  needs?: string[];
  /** Stat deltas, added after the base stats. */
  stats: Partial<SubStats>;
  /** Multiplicative modifiers, applied after all additions. */
  mult?: Partial<SubStats>;
  /** Visual changes to the hull. */
  visual?: Partial<SubVisualSpec>;
  /** Tool this module grants. */
  grants?: string;
  description: string;
  /** Flavour, shown in the workshop. */
  note?: string;
  discipline?: Discipline;
}

const M = (m: ModuleDef): ModuleDef => m;

export const MODULES: ModuleDef[] = [
  // ============================================================== HULLS
  M({
    id: 'hull_coastal', name: 'Bellows Coastal Hull', category: 'hull', tier: 0,
    slots: 0, mass: 0, price: 0,
    stats: { hullMax: 100, crushDepth: 60, slots: 4, massMax: 24, cargoMax: 14 },
    visual: { hull: 'coastal' },
    description: 'Riveted mild steel, built in the harbour for shallow work. It is honest and it is old.',
    note: 'The nameplate says 1948. The workshop thinks that is optimistic.',
  }),
  M({
    id: 'hull_reinforced', name: 'Reinforced Hull', category: 'hull', tier: 1,
    slots: 0, mass: 0, price: 1400,
    recipe: [{ item: 'comp_plating', count: 8 }, { item: 'scrap_plate', count: 14 }],
    requires: 'eng_hulls_1',
    stats: { hullMax: 170, crushDepth: 165, slots: 5, massMax: 32, cargoMax: 20, impactResistance: -0.15 },
    visual: { hull: 'reinforced' },
    description: 'Doubled frames and a second skin. Heavier, slower, and it will get you to the kelp floor.',
  }),
  M({
    id: 'hull_ceramic', name: 'Ceramic Composite Hull', category: 'hull', tier: 2,
    slots: 0, mass: 0, price: 5600,
    recipe: [{ item: 'comp_ceramic_tile', count: 14 }, { item: 'comp_pressure_ring', count: 2 }],
    requires: 'eng_hulls_2',
    stats: { hullMax: 260, crushDepth: 420, slots: 6, massMax: 42, cargoMax: 28, impactResistance: -0.05, pressureResistance: 0.35 },
    visual: { hull: 'ceramic' },
    description: 'Fired tiles over a steel frame. Brittle in a collision, superb under pressure.',
    note: 'Do not hit anything. The workshop is very clear about this.',
  }),
  M({
    id: 'hull_titanium', name: 'Titanium Frame Hull', category: 'hull', tier: 3,
    slots: 0, mass: 0, price: 16500,
    recipe: [{ item: 'comp_titanium_frame', count: 10 }, { item: 'comp_pressure_ring', count: 4 }],
    requires: 'eng_hulls_3',
    stats: { hullMax: 380, crushDepth: 980, slots: 7, massMax: 56, cargoMax: 36, impactResistance: -0.35, pressureResistance: 0.7 },
    visual: { hull: 'titanium' },
    description: 'Light for its strength and forgiving of a knock. The first hull that feels like a real ship.',
  }),
  M({
    id: 'hull_sphere', name: 'Pressure Sphere', category: 'hull', tier: 4,
    slots: 0, mass: 0, price: 48000,
    recipe: [{ item: 'comp_pressure_ring', count: 8 }, { item: 'comp_glass_dome', count: 2 }, { item: 'deepsteel_plate', count: 12 }],
    requires: 'eng_hulls_4',
    stats: { hullMax: 520, crushDepth: 3400, slots: 8, massMax: 68, cargoMax: 44, pressureResistance: 1.4 },
    visual: { hull: 'sphere' },
    description:
      'A true pressure sphere with the machinery hung outside it. Cramped, spherical, and the ' +
      'only shape the sea genuinely respects.',
    note: 'The deeper you go the tighter it holds itself together. That is not a comfort but it is true.',
  }),
  M({
    id: 'hull_abyssal', name: 'Abyssal Hull', category: 'hull', tier: 5,
    slots: 0, mass: 0, price: 130000,
    recipe: [{ item: 'comp_deep_alloy', count: 8 }, { item: 'comp_pressure_ring', count: 10 }, { item: 'unnamed_alloy', count: 4 }],
    requires: 'eng_hulls_5',
    stats: { hullMax: 720, crushDepth: 9400, slots: 9, massMax: 88, cargoMax: 56, pressureResistance: 2.6, impactResistance: -0.45 },
    visual: { hull: 'abyssal' },
    description: 'Built from something recovered rather than something mined. It goes anywhere.',
  }),

  // ============================================================= ENGINES
  M({
    id: 'engine_starter', name: 'Single Screw', category: 'engine', tier: 0,
    slots: 0, mass: 0, price: 0,
    stats: {}, visual: { engine: 'single' },
    description: 'One ducted propeller off a harbour launch. Unhurried and dependable.',
  }),
  M({
    id: 'engine_dual', name: 'Twin Screws', category: 'engine', tier: 1,
    slots: 0, mass: 2, price: 950,
    recipe: [{ item: 'comp_motor', count: 2 }, { item: 'scrap_propeller_blade', count: 4 }],
    requires: 'eng_propulsion_1',
    stats: { thrust: 7, maxSpeed: 2.6, turnRate: 0.32, drivePower: 0.5 },
    visual: { engine: 'dual' },
    description: 'Two screws in opposition. Faster, and it will turn on the spot.',
  }),
  M({
    id: 'engine_turbine', name: 'Electric Turbine', category: 'engine', tier: 2,
    slots: 0, mass: 3, price: 4200,
    recipe: [{ item: 'comp_turbine_stage', count: 3 }, { item: 'comp_motor', count: 2 }],
    requires: 'eng_propulsion_2',
    stats: { thrust: 15, maxSpeed: 5.5, turnRate: 0.2, pitchRate: 0.2, drivePower: 1.1, boostMult: 0.2 },
    visual: { engine: 'turbine' },
    description: 'A shrouded axial turbine. Quiet, powerful, and thirsty.',
  }),
  M({
    id: 'engine_mhd', name: 'Magnetohydrodynamic Drive', category: 'engine', tier: 3,
    slots: 0, mass: 4, price: 21000,
    recipe: [{ item: 'comp_magnet_coil', count: 4 }, { item: 'comp_cell_bank', count: 3 }],
    requires: 'eng_propulsion_3',
    stats: { thrust: 24, maxSpeed: 8, turnRate: 0.3, drivePower: 1.9, noise: -0.55 },
    visual: { engine: 'mhd' },
    description:
      'No moving parts at all: it pushes the water itself. Almost silent, which changes what ' +
      'will let you get close to it.',
    note: 'Shy species stop being shy. This is worth more than the speed.',
  }),
  M({
    id: 'engine_experimental', name: 'Experimental Drive', category: 'engine', tier: 5,
    slots: 0, mass: 5, price: 72000,
    recipe: [{ item: 'comp_deep_alloy', count: 4 }, { item: 'comp_reactor_core', count: 1 }, { item: 'comp_magnet_coil', count: 6 }],
    requires: 'eng_propulsion_4',
    stats: { thrust: 38, maxSpeed: 12.5, turnRate: 0.55, pitchRate: 0.45, verticalThrust: 8, drivePower: 2.4, boostMult: 0.55, noise: -0.35 },
    visual: { engine: 'experimental' },
    description: 'Nobody in the harbour will say what it is. It works and it goes very fast indeed.',
  }),

  // =============================================================== POWER
  M({
    id: 'power_lead_acid', name: 'Lead-Acid Bank', category: 'power', tier: 0,
    slots: 0, mass: 0, price: 0,
    stats: {},
    description: 'Twelve wet cells in a crate. Heavy, cheap, and it does not like being run flat.',
  }),
  M({
    id: 'power_improved', name: 'Sealed Cell Bank', category: 'power', tier: 1,
    slots: 0, mass: 2, price: 800,
    recipe: [{ item: 'comp_cell_bank', count: 2 }],
    requires: 'eng_power_1',
    stats: { batteryMax: 90, oxygenMax: 300 },
    description: 'Twice the capacity in the same crate, and it does not gas.',
  }),
  M({
    id: 'power_deep_cell', name: 'Deep-Cycle Bank', category: 'power', tier: 2,
    slots: 0, mass: 3, price: 3400,
    recipe: [{ item: 'comp_cell_bank', count: 4 }, { item: 'cobalt_crust', count: 8 }],
    requires: 'eng_power_2',
    stats: { batteryMax: 230, oxygenMax: 700, idlePower: -0.04 },
    description: 'The first bank that lets you stop planning every trip around the return leg.',
  }),
  M({
    id: 'power_thermal', name: 'Thermal Generator', category: 'power', tier: 3,
    slots: 1, mass: 3, price: 11500,
    recipe: [{ item: 'comp_thermocouple', count: 4 }, { item: 'thermal_mineral', count: 6 }],
    requires: 'eng_power_3',
    stats: { batteryMax: 180, recharge: 0.55, thermal: 200 },
    description:
      'Charges from the temperature difference between the hull and a vent plume. Sit in the ' +
      'warm water and the needle climbs.',
    note: 'The Emberfield stops being a place you visit and becomes a place you refuel.',
  }),
  M({
    id: 'power_reactor', name: 'Deep-Sea Reactor', category: 'power', tier: 4,
    slots: 1, mass: 5, price: 42000,
    recipe: [{ item: 'comp_reactor_core', count: 1 }, { item: 'comp_cell_bank', count: 6 }],
    requires: 'eng_power_4',
    stats: { batteryMax: 480, recharge: 1.6, oxygenMax: 1800 },
    description: 'It simply does not run out. The lab will not put its name to the paperwork.',
  }),
  M({
    id: 'power_lumen_bank', name: 'Lumen Bank', category: 'power', tier: 4,
    slots: 1, mass: 2, price: 26000,
    recipe: [{ item: 'comp_lumen_cell', count: 5 }, { item: 'lumen_pearl', count: 8 }],
    requires: 'abyss_biolum_2',
    stats: { batteryMax: 260, recharge: 0.9, lightDraw: -0.2 },
    description: 'Living light, harnessed. The lamps cost almost nothing to run off it.',
    discipline: 'abyssal',
  }),
  M({
    id: 'power_scrubber_2', name: 'Redundant Scrubbers', category: 'power', tier: 2,
    slots: 1, mass: 2, price: 2200,
    recipe: [{ item: 'comp_scrubber', count: 3 }],
    requires: 'eng_life_1',
    stats: { oxygenMax: 1200, oxygenRate: -0.18 },
    description: 'A second and third cartridge in parallel. Doubles your endurance and halves your worry.',
  }),
  M({
    id: 'power_life_extended', name: 'Extended Life Support', category: 'power', tier: 3,
    slots: 1, mass: 3, price: 9800,
    recipe: [{ item: 'comp_scrubber', count: 5 }, { item: 'comp_insulation', count: 6 }],
    requires: 'eng_life_2',
    stats: { oxygenMax: 3200, oxygenRate: -0.28, fieldRepair: 0.05 },
    description: 'A proper closed-cycle plant. You can stay down for hours and think about something else.',
  }),

  // =============================================================== LAMPS
  M({
    id: 'lamp_single', name: 'Bow Lamp', category: 'lamp', tier: 0,
    slots: 0, mass: 0, price: 0,
    stats: {}, visual: { lamps: 1 },
    description: 'One sealed-beam lamp on the bow. It is enough for the bay and nowhere else.',
  }),
  M({
    id: 'lamp_twin', name: 'Twin Lamps', category: 'lamp', tier: 1,
    slots: 0, mass: 1, price: 620,
    recipe: [{ item: 'scrap_lamp_housing', count: 2 }, { item: 'comp_lens', count: 2 }],
    requires: 'eng_optics_1',
    stats: { lightRange: 12, lightPower: 3, lightAngle: 0.06, lightDraw: 0.14 },
    visual: { lamps: 3 },
    description: 'Two more on the shoulders. The difference at sixty metres is not subtle.',
  }),
  M({
    id: 'lamp_flood', name: 'Floodlights', category: 'lamp', tier: 2,
    slots: 1, mass: 2, price: 2900,
    recipe: [{ item: 'comp_lens', count: 4 }, { item: 'comp_cell_bank', count: 1 }],
    requires: 'eng_optics_2',
    stats: { lightRange: 22, lightPower: 6, lightAngle: 0.16, lightDraw: 0.3, cameraTier: 1 },
    visual: { lamps: 4 },
    description: 'Wide and even, for working rather than searching.',
  }),
  M({
    id: 'lamp_search', name: 'Searchlights', category: 'lamp', tier: 3,
    slots: 1, mass: 2, price: 8600,
    recipe: [{ item: 'comp_lens', count: 6 }, { item: 'comp_magnet_coil', count: 1 }],
    requires: 'eng_optics_3',
    stats: { lightRange: 44, lightPower: 11, lightAngle: -0.1, lightDraw: 0.5, cameraTier: 1 },
    visual: { lamps: 5 },
    description: 'Narrow, brutal and long. You will see the wall before you hit it.',
  }),
  M({
    id: 'lamp_bio', name: 'Bioluminescent Array', category: 'lamp', tier: 4,
    slots: 1, mass: 1, price: 19000,
    recipe: [{ item: 'comp_lumen_cell', count: 4 }, { item: 'lumen_pearl', count: 6 }],
    requires: 'abyss_biolum_1',
    stats: { lightRange: 30, lightPower: 7, lightAngle: 0.3, lightDraw: -0.1, luck: 6 },
    visual: { lamps: 6, bioTrim: true },
    description:
      'Cold living light along the whole hull. Deep animals treat it as one of their own and ' +
      'come to look, which is worth more than the illumination.',
    discipline: 'abyssal',
  }),
  M({
    id: 'lamp_red_filter', name: 'Red Filter Set', category: 'lamp', tier: 2,
    slots: 1, mass: 0.5, price: 1600,
    recipe: [{ item: 'comp_lens', count: 2 }, { item: 'sea_glass', count: 6 }],
    requires: 'bio_behaviour_1',
    stats: { lightRange: -4, noise: -0.1, luck: 4 },
    description:
      'Almost nothing down here can see red. Filtered lamps let you watch an animal behaving ' +
      'as if you were not there.',
    discipline: 'biology',
  }),
  M({
    id: 'lamp_strobe', name: 'Survey Strobe', category: 'lamp', tier: 3,
    slots: 1, mass: 1, price: 6400,
    recipe: [{ item: 'comp_lens', count: 3 }, { item: 'comp_camera_body', count: 1 }],
    requires: 'ocean_survey_2',
    stats: { cameraTier: 2, lightPower: 2 },
    description: 'Synchronised to the shutter. Photographs stop being a matter of luck.',
  }),

  // =============================================================== SONAR
  M({
    id: 'sonar_basic', name: 'Basic Pulse', category: 'sonar', tier: 0,
    slots: 0, mass: 0, price: 0,
    stats: {},
    description: 'A single ping and an echo. Tells you the seabed is there and roughly how far.',
  }),
  M({
    id: 'sonar_mapping', name: 'Terrain Mapper', category: 'sonar', tier: 1,
    slots: 0, mass: 1, price: 1100,
    recipe: [{ item: 'comp_transducer', count: 2 }],
    requires: 'ocean_survey_1',
    stats: { sonarRange: 60, sonarTier: 1, sonarCooldown: -1 },
    visual: { sonarDome: true },
    description: 'Records what it hears onto the chart. The map stops being a blank rectangle.',
  }),
  M({
    id: 'sonar_biological', name: 'Biological Classifier', category: 'sonar', tier: 2,
    slots: 1, mass: 1, price: 4800,
    recipe: [{ item: 'comp_transducer', count: 3 }, { item: 'comp_hydrophone', count: 2 }],
    requires: 'bio_acoustics_1',
    stats: { sonarRange: 70, sonarTier: 2, sonarCooldown: -1, scanSpeed: 0.2 },
    visual: { sonarDome: true, antenna: true },
    description: 'Names what it finds. Most of the bestiary gets discovered this way first.',
    discipline: 'biology',
  }),
  M({
    id: 'sonar_mineral', name: 'Mineral Detector', category: 'sonar', tier: 3,
    slots: 1, mass: 2, price: 12000,
    recipe: [{ item: 'comp_transducer', count: 4 }, { item: 'comp_magnet_coil', count: 2 }],
    requires: 'geo_prospecting_2',
    stats: { sonarRange: 90, sonarTier: 3, luck: 8 },
    visual: { sonarDome: true, antenna: true },
    description: 'Picks metal and crystal out of the mud from a hundred metres.',
    discipline: 'geology',
  }),
  M({
    id: 'sonar_anomaly', name: 'Anomaly Array', category: 'sonar', tier: 4,
    slots: 2, mass: 2, price: 34000,
    recipe: [{ item: 'comp_transducer', count: 6 }, { item: 'comp_hydrophone', count: 4 }, { item: 'glyph_fragment', count: 3 }],
    requires: 'arch_signals_2',
    stats: { sonarRange: 140, sonarTier: 4, sonarCooldown: -1.5 },
    visual: { sonarDome: true, antenna: true },
    description:
      'Listens for returns that should not exist. It finds things that are not on the chart ' +
      'and, occasionally, things that are not there at all.',
    discipline: 'archaeology',
  }),
  M({
    id: 'sonar_hydrophone', name: 'Hydrophone Mast', category: 'sonar', tier: 2,
    slots: 1, mass: 1, price: 3200,
    recipe: [{ item: 'comp_hydrophone', count: 2 }],
    requires: 'ocean_acoustics_1',
    stats: { sonarRange: 40, noise: -0.15 },
    visual: { antenna: true },
    description: 'Passive listening. Whale song, shrimp static, and the sound of your own propeller.',
    discipline: 'oceanography',
  }),

  // =============================================================== TOOLS
  M({
    id: 'tool_rod', name: 'Line and Rod', category: 'tool', tier: 0,
    slots: 0, mass: 0, price: 0, grants: 'rod',
    stats: {},
    description: 'A boom, a reel and two hundred metres of line.',
  }),
  M({
    id: 'tool_rod_2', name: 'Heavy Line', category: 'tool', tier: 2,
    slots: 1, mass: 1, price: 2600, grants: 'rod',
    recipe: [{ item: 'comp_line_spool', count: 4 }, { item: 'comp_servo', count: 1 }],
    requires: 'bio_angling_1', needs: ['tool_rod'],
    stats: { fishingPower: 0.7 },
    description: 'Sixty-kilo braid on a powered reel. Things stop breaking off.',
  }),
  M({
    id: 'tool_rod_3', name: 'Deep Rig', category: 'tool', tier: 4,
    slots: 1, mass: 2, price: 15000, grants: 'rod',
    recipe: [{ item: 'comp_line_spool', count: 8 }, { item: 'comp_servo', count: 3 }, { item: 'comp_titanium_frame', count: 2 }],
    requires: 'bio_angling_2', needs: ['tool_rod'],
    stats: { fishingPower: 1.6 },
    description: 'You could land something the size of the boat on this. Once.',
  }),
  M({
    id: 'tool_net', name: 'Sweep Net', category: 'tool', tier: 1,
    slots: 1, mass: 1, price: 700, grants: 'net',
    recipe: [{ item: 'comp_net_mesh', count: 4 }],
    requires: 'bio_collection_1',
    stats: { netWidth: 2 },
    description: 'A hooped net on a folding boom, for taking a shoal in one pass.',
  }),
  M({
    id: 'tool_net_2', name: 'Wide Sweep Net', category: 'tool', tier: 3,
    slots: 1, mass: 2, price: 6800, grants: 'net',
    recipe: [{ item: 'comp_net_mesh', count: 8 }, { item: 'comp_servo', count: 2 }],
    requires: 'bio_collection_2', needs: ['tool_net'],
    stats: { netWidth: 5 },
    description: 'Four metres across. Aim carefully; it does not discriminate.',
  }),
  M({
    id: 'tool_trap', name: 'Baited Traps', category: 'tool', tier: 1,
    slots: 1, mass: 1, price: 480, grants: 'trap',
    recipe: [{ item: 'comp_net_mesh', count: 2 }, { item: 'scrap_plate', count: 4 }],
    requires: 'bio_collection_1',
    stats: {},
    description: 'Four collapsible pots. Set them, work elsewhere, come back.',
  }),
  M({
    id: 'tool_lure', name: 'Light Lure', category: 'tool', tier: 2,
    slots: 1, mass: 1, price: 3100, grants: 'lure',
    recipe: [{ item: 'comp_lens', count: 2 }, { item: 'comp_cell_bank', count: 1 }],
    requires: 'bio_behaviour_1',
    stats: { luck: 5 },
    description: 'A cold blue light on a boom. In the dark, curiosity does the work for you.',
  }),
  M({
    id: 'tool_sampler', name: 'Specimen Sampler', category: 'tool', tier: 2,
    slots: 1, mass: 1, price: 2400, grants: 'sampler',
    recipe: [{ item: 'comp_specimen_jar', count: 4 }, { item: 'comp_servo', count: 1 }],
    requires: 'bio_collection_1',
    stats: { specimenMax: 2 },
    visual: { arm: 'sampler' },
    description: 'A suction jar with a soft mouth. The only way to keep a jellyfish a jellyfish.',
  }),
  M({
    id: 'tool_claw', name: 'Manipulator Claw', category: 'tool', tier: 1,
    slots: 1, mass: 2, price: 900, grants: 'claw',
    recipe: [{ item: 'comp_servo', count: 2 }, { item: 'comp_plating', count: 2 }],
    requires: 'eng_manipulation_1',
    stats: {},
    visual: { arm: 'grabber' },
    description: 'Two fingers and a wrist. You will use it constantly.',
  }),
  M({
    id: 'tool_claw_2', name: 'Salvage Claw', category: 'tool', tier: 3,
    slots: 1, mass: 3, price: 7400, grants: 'claw',
    recipe: [{ item: 'comp_servo', count: 4 }, { item: 'comp_titanium_frame', count: 2 }],
    requires: 'eng_manipulation_2', needs: ['tool_claw'],
    stats: { cargoMax: 4, drillTier: 1 },
    visual: { arm: 'claw' },
    description: 'Three fingers, far more torque, and enough reach to prise a plate off a wreck.',
  }),
  M({
    id: 'tool_drill', name: 'Core Drill', category: 'tool', tier: 2,
    slots: 1, mass: 3, price: 5200, grants: 'drill',
    recipe: [{ item: 'comp_drill_head', count: 2 }, { item: 'comp_servo', count: 2 }],
    requires: 'geo_extraction_1',
    stats: { drillTier: 2 },
    visual: { arm: 'drill' },
    description: 'Gets at everything that is part of the rock rather than sitting on it.',
    discipline: 'geology',
  }),
  M({
    id: 'tool_drill_2', name: 'Diamond Drill', category: 'tool', tier: 4,
    slots: 1, mass: 4, price: 24000, grants: 'drill',
    recipe: [{ item: 'comp_drill_head', count: 4 }, { item: 'rare_crystal', count: 6 }, { item: 'comp_deep_alloy', count: 1 }],
    requires: 'geo_extraction_2', needs: ['tool_drill'],
    stats: { drillTier: 4 },
    visual: { arm: 'drill' },
    description: 'Through basalt in ten seconds. Through anything else in rather less.',
    discipline: 'geology',
  }),
  M({
    id: 'tool_scanner', name: 'Research Scanner', category: 'tool', tier: 1,
    slots: 1, mass: 1, price: 1900, grants: 'scanner',
    recipe: [{ item: 'comp_lens', count: 2 }, { item: 'comp_transducer', count: 1 }],
    requires: 'ocean_survey_1',
    stats: { scanSpeed: 0.2, researchBonus: 5 },
    description: 'Builds a full profile of anything you hold it on. The lab pays in knowledge.',
  }),
  M({
    id: 'tool_scanner_2', name: 'Deep Survey Scanner', category: 'tool', tier: 3,
    slots: 1, mass: 2, price: 11800, grants: 'scanner',
    recipe: [{ item: 'comp_lens', count: 4 }, { item: 'comp_transducer', count: 3 }, { item: 'phosphor_crystal', count: 4 }],
    requires: 'ocean_survey_2', needs: ['tool_scanner'],
    stats: { scanSpeed: 0.85, researchBonus: 18 },
    description: 'Four times faster and it works at range. Whole expeditions become worth more.',
  }),
  M({
    id: 'tool_camera', name: 'Deep Camera', category: 'tool', tier: 2,
    slots: 1, mass: 1, price: 3600, grants: 'camera',
    recipe: [{ item: 'comp_camera_body', count: 1 }, { item: 'comp_lens', count: 2 }],
    requires: 'ocean_imaging_1',
    stats: { cameraTier: 1 },
    description:
      'The only way to record something you must not take. A good photograph of a leviathan ' +
      'is the best-paid thing in the game.',
    discipline: 'oceanography',
  }),
  M({
    id: 'tool_camera_2', name: 'Plate Camera', category: 'tool', tier: 4,
    slots: 1, mass: 2, price: 18500, grants: 'camera',
    recipe: [{ item: 'comp_camera_body', count: 2 }, { item: 'comp_lens', count: 5 }, { item: 'rare_crystal', count: 3 }],
    requires: 'ocean_imaging_2', needs: ['tool_camera'],
    stats: { cameraTier: 3, researchBonus: 12 },
    description: 'Absurd resolution, absurd cost, and photographs the museum will hang.',
    discipline: 'oceanography',
  }),
  M({
    id: 'tool_drone', name: 'Tethered Drone', category: 'tool', tier: 3,
    slots: 2, mass: 3, price: 14000, grants: 'drone',
    recipe: [{ item: 'comp_drone_frame', count: 1 }, { item: 'comp_servo', count: 3 }, { item: 'comp_camera_body', count: 1 }],
    requires: 'eng_remote_1',
    stats: { droneRange: 40 },
    description: 'Goes where the boat will not fit, and takes what the boat would crush.',
  }),
  M({
    id: 'tool_drone_2', name: 'Long-Tether Drone', category: 'tool', tier: 5,
    slots: 2, mass: 4, price: 46000, grants: 'drone',
    recipe: [{ item: 'comp_drone_frame', count: 2 }, { item: 'comp_deep_alloy', count: 2 }, { item: 'comp_lumen_cell', count: 2 }],
    requires: 'eng_remote_2', needs: ['tool_drone'],
    stats: { droneRange: 110, luck: 6 },
    description: 'A hundred metres of tether. Entire caves become reachable without entering them.',
  }),

  // ============================================================= STORAGE
  M({
    id: 'store_crate', name: 'Deck Crates', category: 'storage', tier: 1,
    slots: 1, mass: 1, price: 420,
    recipe: [{ item: 'comp_plating', count: 3 }],
    stats: { cargoMax: 8 },
    visual: { cargoPods: 1 },
    description: 'Two lashed crates. Not elegant, and it doubles what you can carry home.',
  }),
  M({
    id: 'store_pods', name: 'External Pods', category: 'storage', tier: 2,
    slots: 1, mass: 2, price: 2100,
    recipe: [{ item: 'comp_plating', count: 6 }, { item: 'comp_pressure_ring', count: 1 }],
    requires: 'eng_stowage_1',
    stats: { cargoMax: 16 },
    visual: { cargoPods: 2 },
    description: 'Faired pressure pods either side. Free of the hull, so they cost you nothing inside.',
  }),
  M({
    id: 'store_pods_2', name: 'Quad Pods', category: 'storage', tier: 3,
    slots: 2, mass: 4, price: 8900,
    recipe: [{ item: 'comp_plating', count: 12 }, { item: 'comp_pressure_ring', count: 2 }],
    requires: 'eng_stowage_2', needs: ['store_pods'],
    stats: { cargoMax: 30, maxSpeed: -0.8 },
    visual: { cargoPods: 4 },
    description: 'Four of them. The boat handles like a barge and comes home very full.',
  }),
  M({
    id: 'store_specimen_tank', name: 'Specimen Tank', category: 'storage', tier: 2,
    slots: 1, mass: 2, price: 2800,
    recipe: [{ item: 'comp_specimen_jar', count: 6 }, { item: 'comp_scrubber', count: 1 }],
    requires: 'bio_husbandry_1',
    stats: { specimenMax: 5 },
    visual: { specimenTank: true },
    description: 'Chilled, aerated and gentle. Specimens arrive alive and are worth far more for it.',
    discipline: 'biology',
  }),
  M({
    id: 'store_specimen_tank_2', name: 'Live Well', category: 'storage', tier: 4,
    slots: 2, mass: 3, price: 16000,
    recipe: [{ item: 'comp_specimen_jar', count: 12 }, { item: 'comp_scrubber', count: 3 }, { item: 'comp_glass_dome', count: 1 }],
    requires: 'bio_husbandry_2', needs: ['store_specimen_tank'],
    stats: { specimenMax: 12, valueBonus: 10 },
    visual: { specimenTank: true },
    description: 'A circulating well the length of the spine. Everything comes up in perfect condition.',
    discipline: 'biology',
  }),
  M({
    id: 'store_relic_case', name: 'Relic Case', category: 'storage', tier: 2,
    slots: 1, mass: 2, price: 3600,
    recipe: [{ item: 'comp_stabiliser', count: 1 }, { item: 'comp_plating', count: 4 }],
    requires: 'arch_conservation_1',
    stats: { relicMax: 3 },
    description: 'Padded, pressure-held and locked. Relics stop arriving as gravel.',
    discipline: 'archaeology',
  }),
  M({
    id: 'store_relic_case_2', name: 'Artefact Stabiliser', category: 'storage', tier: 4,
    slots: 2, mass: 3, price: 19500,
    recipe: [{ item: 'comp_stabiliser', count: 3 }, { item: 'orichalcum_ingot', count: 2 }],
    requires: 'arch_conservation_2', needs: ['store_relic_case'],
    stats: { relicMax: 8, valueBonus: 12 },
    description: 'Holds a find at the pressure it was found at, all the way to the surface.',
    discipline: 'archaeology',
  }),
  M({
    id: 'store_mineral_hopper', name: 'Mineral Hopper', category: 'storage', tier: 3,
    slots: 1, mass: 3, price: 5400,
    recipe: [{ item: 'comp_plating', count: 8 }, { item: 'comp_pump', count: 1 }],
    requires: 'geo_extraction_1',
    stats: { cargoMax: 18, valueBonus: 4 },
    visual: { cargoPods: 3 },
    description: 'A dedicated ore hopper that dumps straight into the dealer’s chute at the dock.',
    discipline: 'geology',
  }),

  // ============================================================== MODULES
  M({
    id: 'mod_nav_computer', name: 'Navigation Computer', category: 'module', tier: 1,
    slots: 1, mass: 1, price: 1500,
    recipe: [{ item: 'comp_transducer', count: 1 }, { item: 'scrap_gear', count: 6 }],
    requires: 'ocean_survey_1',
    stats: { sonarRange: 20 },
    description: 'Dead reckoning, a heading hold and a chart that stays put. Fewer wrong turns.',
  }),
  M({
    id: 'mod_autopilot', name: 'Autopilot Aid', category: 'module', tier: 3,
    slots: 1, mass: 1, price: 7200,
    recipe: [{ item: 'comp_servo', count: 2 }, { item: 'comp_transducer', count: 2 }],
    requires: 'eng_control_1',
    stats: { turnRate: 0.25, pitchRate: 0.25, drivePower: -0.2 },
    description: 'Trims the boat continuously. It stops fighting you and starts helping.',
  }),
  M({
    id: 'mod_viewport', name: 'Reinforced Viewport', category: 'module', tier: 2,
    slots: 1, mass: 2, price: 3400,
    recipe: [{ item: 'comp_glass_dome', count: 1 }],
    requires: 'eng_hulls_2',
    stats: { crushDepth: 80, cameraTier: 1 },
    description: 'A thicker dome and a wider field of view. You can see what you are about to hit.',
  }),
  M({
    id: 'mod_pressure_bank', name: 'Pressure Reserve', category: 'module', tier: 3,
    slots: 1, mass: 2, price: 9600,
    recipe: [{ item: 'comp_pressure_ring', count: 2 }, { item: 'comp_pump', count: 2 }],
    requires: 'eng_pressure_1',
    stats: { pressureResistance: 0.5 },
    description:
      'A compensator bank that soaks up overpressure for a few minutes before the hull has to. ' +
      'This is what lets you dip below your rating on purpose.',
    note: 'It refills at port and at any mooring, and nowhere else.',
  }),
  M({
    id: 'mod_pressure_bank_2', name: 'Deep Compensator', category: 'module', tier: 5,
    slots: 2, mass: 3, price: 38000,
    recipe: [{ item: 'comp_pressure_ring', count: 5 }, { item: 'comp_deep_alloy', count: 2 }],
    requires: 'eng_pressure_2', needs: ['mod_pressure_bank'],
    stats: { pressureResistance: 1.4, crushDepth: 320 },
    description: 'Enough reserve to work a whole band below your rating, if you are quick about it.',
  }),
  M({
    id: 'mod_thermal_shield', name: 'Thermal Shielding', category: 'module', tier: 3,
    slots: 1, mass: 3, price: 8200,
    recipe: [{ item: 'comp_insulation', count: 8 }, { item: 'comp_ceramic_tile', count: 4 }],
    requires: 'geo_thermal_1',
    stats: { thermal: 400 },
    visual: { thermalPlates: true },
    description: 'Ceramic and wadding over the flanks. You can work inside a vent plume.',
    discipline: 'geology',
  }),
  M({
    id: 'mod_repair_drones', name: 'Repair Drones', category: 'module', tier: 4,
    slots: 1, mass: 2, price: 17000,
    recipe: [{ item: 'comp_drone_frame', count: 1 }, { item: 'comp_servo', count: 4 }],
    requires: 'eng_remote_1',
    stats: { fieldRepair: 0.5 },
    description: 'Three small welders that patch the hull while you carry on working.',
  }),
  M({
    id: 'mod_lab', name: 'Deep-Sea Laboratory', category: 'module', tier: 4,
    slots: 2, mass: 4, price: 22000,
    recipe: [{ item: 'comp_specimen_jar', count: 8 }, { item: 'comp_lens', count: 4 }, { item: 'comp_glass_dome', count: 1 }],
    requires: 'bio_field_lab_1',
    stats: { researchBonus: 35, scanSpeed: 0.3 },
    visual: { lab: true },
    description:
      'A blister aft with a bench in it. Specimens can be studied in the field, at depth, ' +
      'which is where half the interesting results are.',
    discipline: 'biology',
  }),
  M({
    id: 'mod_hydrophone_suite', name: 'Hydrophone Suite', category: 'module', tier: 3,
    slots: 1, mass: 1, price: 6600,
    recipe: [{ item: 'comp_hydrophone', count: 4 }],
    requires: 'ocean_acoustics_2',
    stats: { sonarRange: 30, luck: 5, researchBonus: 10 },
    visual: { antenna: true },
    description: 'Four elements on a spar. Leviathans stop being a matter of chance.',
    discipline: 'oceanography',
  }),
  M({
    id: 'mod_ballast_trim', name: 'Fine Ballast Trim', category: 'module', tier: 2,
    slots: 1, mass: 1, price: 2300,
    recipe: [{ item: 'comp_pump', count: 2 }],
    requires: 'eng_control_1',
    stats: { verticalThrust: 4.5, pitchRate: 0.15 },
    description: 'Small pumps and a proper trim tank. Hovering becomes effortless.',
  }),
  M({
    id: 'mod_collision_bumper', name: 'Collision Bumper', category: 'module', tier: 1,
    slots: 1, mass: 2, price: 900,
    recipe: [{ item: 'comp_plating', count: 4 }, { item: 'comp_insulation', count: 2 }],
    stats: { impactResistance: -0.4, maxSpeed: -0.3 },
    description: 'A rubberised ring round the bow. It looks silly and it saves the ceramic hull.',
  }),
  M({
    id: 'mod_market_ledger', name: "Trader's Ledger", category: 'module', tier: 2,
    slots: 1, mass: 0.5, price: 4200,
    requires: 'arch_appraisal_1',
    stats: { valueBonus: 15 },
    description: 'Knowing what a thing is worth before you sell it turns out to be worth fifteen per cent.',
  }),
  M({
    id: 'mod_prospector_kit', name: "Prospector's Kit", category: 'module', tier: 2,
    slots: 1, mass: 1, price: 3800,
    recipe: [{ item: 'comp_lens', count: 2 }, { item: 'scrap_gear', count: 4 }],
    requires: 'geo_prospecting_1',
    stats: { luck: 10 },
    description: 'A loupe, an assay kit and a good deal of patience. You find the good ones.',
    discipline: 'geology',
  }),
  M({
    id: 'mod_silent_running', name: 'Silent Running', category: 'module', tier: 4,
    slots: 1, mass: 2, price: 15500,
    recipe: [{ item: 'comp_insulation', count: 10 }, { item: 'comp_motor', count: 2 }],
    requires: 'bio_behaviour_2',
    stats: { noise: -0.45, maxSpeed: -1 },
    description: 'Rafted machinery and an anechoic coat. Wary animals stop noticing you at all.',
    discipline: 'biology',
  }),
  M({
    id: 'mod_beacon_launcher', name: 'Beacon Launcher', category: 'module', tier: 2,
    slots: 1, mass: 1, price: 2600,
    recipe: [{ item: 'scrap_plate', count: 4 }, { item: 'comp_cell_bank', count: 1 }],
    requires: 'ocean_survey_1',
    stats: {},
    description: 'Drops a marker on the chart from wherever you are. Simple and indispensable.',
  }),
  M({
    id: 'mod_glyph_reader', name: 'Glyph Reader', category: 'module', tier: 4,
    slots: 1, mass: 1, price: 21000,
    recipe: [{ item: 'comp_lens', count: 4 }, { item: 'glyph_fragment', count: 5 }],
    requires: 'arch_signals_1',
    stats: { researchBonus: 20 },
    description: 'A frame and a light that makes the eleven characters legible in situ.',
    discipline: 'archaeology',
  }),
  M({
    id: 'mod_abyssal_stabiliser', name: 'Abyssal Stabiliser', category: 'module', tier: 5,
    slots: 2, mass: 3, price: 56000,
    recipe: [{ item: 'unnamed_alloy', count: 2 }, { item: 'void_pearl', count: 4 }, { item: 'comp_deep_alloy', count: 2 }],
    requires: 'abyss_theory_3',
    stats: { pressureResistance: 1.2, crushDepth: 600, hullMax: 90 },
    description:
      'Nobody can explain what it does. Fitted, the hull stops complaining a kilometre before ' +
      'it used to. The lab has stopped asking questions and started asking for more.',
    discipline: 'abyssal',
  }),
];

export const MODULE_BY_ID = new Map(MODULES.map((m) => [m.id, m]));

export function moduleById(id: string): ModuleDef | undefined {
  return MODULE_BY_ID.get(id);
}

/** Modules that occupy an exclusive fitting rather than a slot. */
export const EXCLUSIVE: ModuleCategory[] = ['hull', 'engine', 'power', 'lamp', 'sonar'];

export const MODULE_COUNT = MODULES.length;
