/**
 * Submarine capability stats.
 *
 * Every module contributes deltas to this structure; the game only ever reads
 * the computed totals. Keeping it a flat record of numbers makes upgrades,
 * tooltips, comparisons and save files all trivial.
 */

export interface SubStats {
  /** Maximum hull integrity. */
  hullMax: number;
  /** Depth in metres the hull survives indefinitely. */
  crushDepth: number;
  /** Hull damage per second per metre beyond crush depth, scaled. */
  pressureResistance: number;
  /** Collision damage multiplier (lower is better). */
  impactResistance: number;

  /** Forward thrust in newtons-ish (tuned units). */
  thrust: number;
  /** Reverse thrust fraction of forward. */
  reverseFactor: number;
  /** Vertical thrust for ballast control. */
  verticalThrust: number;
  /** Yaw responsiveness, radians/s at full input. */
  turnRate: number;
  /** Pitch responsiveness. */
  pitchRate: number;
  /** Peak speed in m/s at cruise. */
  maxSpeed: number;
  /** Boost multiplier on thrust. */
  boostMult: number;

  /** Battery capacity in kilojoules (display units). */
  batteryMax: number;
  /** Passive recharge per second (thermal/reactor modules). */
  recharge: number;
  /** Energy drawn per second at full throttle. */
  drivePower: number;
  /** Idle draw for life support and instruments. */
  idlePower: number;

  /** Life-support endurance in seconds at full tanks. */
  oxygenMax: number;
  /** Oxygen consumed per second. */
  oxygenRate: number;

  /** Lamp range in metres. */
  lightRange: number;
  /** Lamp cone half-angle in radians. */
  lightAngle: number;
  /** Lamp intensity. */
  lightPower: number;
  /** Lamp energy draw per second when on. */
  lightDraw: number;

  /** Sonar radius in metres. */
  sonarRange: number;
  /** Seconds between sonar pulses. */
  sonarCooldown: number;
  /** Sonar classification level: 0 terrain, 1 objects, 2 creatures, 3 minerals, 4 anomalies. */
  sonarTier: number;
  /** Sonar energy per pulse. */
  sonarCost: number;

  /** Cargo capacity in units. */
  cargoMax: number;
  /** Dedicated specimen capacity (fresh storage). */
  specimenMax: number;
  /** Relic containment slots. */
  relicMax: number;

  /** Total module slots and mass budget. */
  slots: number;
  massMax: number;

  /** Thermal shielding rating: metres of safe proximity to vents. */
  thermal: number;
  /** Scan speed multiplier. */
  scanSpeed: number;
  /** Bonus to research yield. */
  researchBonus: number;
  /** Bonus to sale value. */
  valueBonus: number;
  /** Extra chance for rare finds. */
  luck: number;
  /** Drill tier for hard minerals. */
  drillTier: number;
  /** Fishing skill modifier: line strength and lure attraction. */
  fishingPower: number;
  /** Net capture width. */
  netWidth: number;
  /** Repair rate outside port, hull per second. */
  fieldRepair: number;
  /** Camera quality for photography scoring. */
  cameraTier: number;
  /** Maximum tow/drone deployment range. */
  droneRange: number;
  /** Noise level; louder scares shy creatures. */
  noise: number;
}

export function baseStats(): SubStats {
  return {
    hullMax: 100,
    crushDepth: 60,
    pressureResistance: 1,
    impactResistance: 1,

    thrust: 15.5,
    reverseFactor: 0.45,
    verticalThrust: 8.5,
    turnRate: 1.15,
    pitchRate: 0.95,
    maxSpeed: 8.5,
    boostMult: 1.55,

    batteryMax: 100,
    recharge: 0,
    drivePower: 1.5,
    idlePower: 0.16,

    oxygenMax: 900,
    oxygenRate: 1,

    lightRange: 26,
    lightAngle: 0.44,
    lightPower: 7,
    lightDraw: 0.32,

    sonarRange: 90,
    sonarCooldown: 6,
    sonarTier: 0,
    sonarCost: 2.4,

    cargoMax: 14,
    specimenMax: 4,
    relicMax: 1,

    slots: 4,
    massMax: 24,

    thermal: 0,
    scanSpeed: 1,
    researchBonus: 0,
    valueBonus: 0,
    luck: 0,
    drillTier: 0,
    fishingPower: 1,
    netWidth: 0,
    fieldRepair: 0,
    cameraTier: 0,
    droneRange: 0,
    noise: 1,
  };
}

export type StatKey = keyof SubStats;

/** Human-readable labels and formatting for the upgrade screens. */
export const STAT_META: Partial<Record<StatKey, {
  label: string; unit?: string; higherIsBetter?: boolean; group: string; digits?: number;
}>> = {
  hullMax: { label: 'Hull integrity', group: 'Survivability' },
  crushDepth: { label: 'Crush depth', unit: ' m', group: 'Survivability' },
  pressureResistance: { label: 'Pressure tolerance', group: 'Survivability', digits: 2 },
  impactResistance: { label: 'Impact damage taken', higherIsBetter: false, group: 'Survivability', digits: 2 },
  thermal: { label: 'Thermal shielding', group: 'Survivability' },
  fieldRepair: { label: 'Field repair', unit: '/s', group: 'Survivability', digits: 2 },

  thrust: { label: 'Thrust', group: 'Propulsion' },
  maxSpeed: { label: 'Top speed', unit: ' m/s', group: 'Propulsion', digits: 1 },
  turnRate: { label: 'Turn rate', group: 'Propulsion', digits: 2 },
  pitchRate: { label: 'Pitch rate', group: 'Propulsion', digits: 2 },
  verticalThrust: { label: 'Ballast power', group: 'Propulsion', digits: 1 },
  boostMult: { label: 'Boost', unit: 'x', group: 'Propulsion', digits: 2 },

  batteryMax: { label: 'Battery', unit: ' kJ', group: 'Power' },
  recharge: { label: 'Recharge', unit: '/s', group: 'Power', digits: 2 },
  drivePower: { label: 'Drive draw', unit: '/s', higherIsBetter: false, group: 'Power', digits: 2 },
  idlePower: { label: 'Idle draw', unit: '/s', higherIsBetter: false, group: 'Power', digits: 2 },
  oxygenMax: { label: 'Life support', unit: ' s', group: 'Power' },

  lightRange: { label: 'Lamp range', unit: ' m', group: 'Sensors' },
  lightPower: { label: 'Lamp power', group: 'Sensors', digits: 1 },
  sonarRange: { label: 'Sonar range', unit: ' m', group: 'Sensors' },
  sonarCooldown: { label: 'Sonar cycle', unit: ' s', higherIsBetter: false, group: 'Sensors', digits: 1 },
  sonarTier: { label: 'Sonar classification', group: 'Sensors' },
  cameraTier: { label: 'Camera', group: 'Sensors' },
  scanSpeed: { label: 'Scan speed', unit: 'x', group: 'Sensors', digits: 2 },

  cargoMax: { label: 'Cargo', unit: ' u', group: 'Capacity' },
  specimenMax: { label: 'Specimen tanks', group: 'Capacity' },
  relicMax: { label: 'Relic containment', group: 'Capacity' },
  slots: { label: 'Module slots', group: 'Capacity' },
  massMax: { label: 'Mass budget', group: 'Capacity' },

  drillTier: { label: 'Drill tier', group: 'Tools' },
  fishingPower: { label: 'Line strength', group: 'Tools', digits: 2 },
  netWidth: { label: 'Net spread', unit: ' m', group: 'Tools', digits: 1 },
  droneRange: { label: 'Drone range', unit: ' m', group: 'Tools' },
  researchBonus: { label: 'Research yield', unit: '%', group: 'Bonuses' },
  valueBonus: { label: 'Sale value', unit: '%', group: 'Bonuses' },
  luck: { label: 'Rare find chance', unit: '%', group: 'Bonuses' },
  noise: { label: 'Acoustic signature', higherIsBetter: false, group: 'Bonuses', digits: 2 },
};
