/**
 * Blended environment sampling.
 *
 * Region palettes are art direction; this is what turns them into the exact
 * fog colour, ambient light and particle density for wherever the submarine
 * happens to be, blended smoothly across boundaries and modulated by depth,
 * time of day and weather.
 */

import { Color } from 'three';
import { REGIONS } from '../data/regions';
import type { TerrainField } from './terrain';
import { clamp01, lerp, smoothstep } from '../core/math';
import { lightAt, waterColourAt } from '../procedural/palette';

export interface EnvSample {
  water: Color;
  void: Color;
  ambient: Color;
  sun: Color;
  glow: Color;
  fogDensity: number;
  snow: number;
  life: number;
  temperature: number;
  /** Index of the dominant region. */
  regionIndex: number;
  regionId: string;
  /** 0 at the surface, 1 in the deepest water. */
  depthT: number;
  /** Ambient light intensity multiplier from sunlight reaching this depth. */
  daylight: number;
  current: [number, number, number];
}

const _w = new Float32Array(REGIONS.length);
const _t = new Color();

export function sampleEnvironment(
  terrain: TerrainField,
  x: number, y: number, z: number,
  timeOfDay: number,
  weatherClarity: number,
  out: EnvSample,
): EnvSample {
  const depth = Math.max(0, -y);
  const w = terrain.regionWeights(x, z, _w);

  out.water.setRGB(0, 0, 0);
  out.void.setRGB(0, 0, 0);
  out.ambient.setRGB(0, 0, 0);
  out.sun.setRGB(0, 0, 0);
  out.glow.setRGB(0, 0, 0);
  out.fogDensity = 0;
  out.snow = 0;
  out.life = 0;
  out.temperature = 0;
  let cx = 0, cy = 0, cz = 0;
  let best = 0;

  for (let i = 0; i < REGIONS.length; i++) {
    const k = w[i];
    if (k > w[best]) best = i;
    if (k < 0.002) continue;
    const r = REGIONS[i];
    const p = r.palette;
    out.water.add(_t.set(p.water).multiplyScalar(k));
    out.void.add(_t.set(p.void).multiplyScalar(k));
    out.ambient.add(_t.set(p.ambient).multiplyScalar(k));
    out.sun.add(_t.set(p.sun).multiplyScalar(k));
    out.glow.add(_t.set(p.glow).multiplyScalar(k));
    out.fogDensity += r.fog * k;
    out.snow += r.snow * k;
    out.life += r.life * k;
    out.temperature += r.temperature * k;
    if (r.current) {
      cx += r.current[0] * k;
      cy += r.current[1] * k;
      cz += r.current[2] * k;
    }
  }

  out.regionIndex = best;
  out.regionId = REGIONS[best].id;
  out.current[0] = cx; out.current[1] = cy; out.current[2] = cz;

  // Depth curve. Region palettes describe *character*; this describes physics.
  const depthT = clamp01(Math.pow(depth / 6500, 0.55));
  out.depthT = depthT;

  // Daylight: strong at the surface, gone by ~600 m, and modulated by the
  // day/night cycle plus surface weather.
  const solar = solarIntensity(timeOfDay);
  const daylight = lightAt(depth) * solar * weatherClarity;
  out.daylight = daylight;

  // The physical water colour and the region's authored colour meet halfway;
  // deep water pulls hard toward the physical curve.
  const phys = waterColourAt(depth);
  out.water.lerp(phys, smoothstep(0, 900, depth) * 0.75);
  out.void.lerp(phys, smoothstep(0, 900, depth) * 0.8).multiplyScalar(lerp(1, 0.35, depthT));

  // Night desaturates and darkens the upper ocean without touching the deep.
  const nightK = (1 - solar) * (1 - smoothstep(80, 480, depth));
  if (nightK > 0.001) {
    out.water.lerp(_t.set('#16324f'), nightK * 0.7);
    out.void.lerp(_t.set('#0b1e33'), nightK * 0.8);
    out.ambient.lerp(_t.set('#2a4f7a'), nightK * 0.75);
    out.sun.lerp(_t.set('#93b6e8'), nightK * 0.85);
  }

  // Murk: fog thickens with depth and with poor surface weather.
  out.fogDensity *= lerp(1, 1.9, depthT) * lerp(1.35, 1, weatherClarity);
  out.snow *= lerp(0.8, 1.35, depthT);

  return out;
}

export function makeEnvSample(): EnvSample {
  return {
    water: new Color('#2a7f96'),
    void: new Color('#123a4c'),
    ambient: new Color('#5aa5b0'),
    sun: new Color('#ffeecc'),
    glow: new Color('#a8f0e0'),
    fogDensity: 0.008,
    snow: 0.5,
    life: 1,
    temperature: 15,
    regionIndex: 0,
    regionId: 'lantern_bay',
    depthT: 0,
    daylight: 1,
    current: [0, 0, 0],
  };
}

/**
 * Sun intensity over a 24 h cycle expressed as `timeOfDay` in [0,1),
 * where 0 is midnight, 0.25 dawn, 0.5 noon, 0.75 dusk.
 */
export function solarIntensity(timeOfDay: number): number {
  const a = (timeOfDay - 0.25) * Math.PI * 2;
  const s = Math.sin(a * 0.5 + Math.PI * 0.0);
  const elevation = Math.sin((timeOfDay - 0.25) * Math.PI * 2 * 0.5 + 0) * 0 +
    Math.sin(Math.PI * clamp01((timeOfDay - 0.22) / 0.56));
  void s;
  return clamp01(elevation);
}

/** Sun azimuth/elevation for the directional light. */
export function sunDirection(timeOfDay: number, out: { x: number; y: number; z: number }): void {
  const a = (timeOfDay - 0.25) * Math.PI * 2;
  const elev = Math.sin(Math.PI * clamp01((timeOfDay - 0.2) / 0.6));
  out.x = Math.cos(a) * 0.55;
  out.y = -Math.max(0.12, elev);
  out.z = Math.sin(a) * 0.55;
  const len = Math.hypot(out.x, out.y, out.z) || 1;
  out.x /= len; out.y /= len; out.z /= len;
}

/** Named phase of day for UI and spawn rules. */
export function dayPhase(timeOfDay: number): 'night' | 'dawn' | 'day' | 'dusk' {
  if (timeOfDay < 0.21 || timeOfDay >= 0.86) return 'night';
  if (timeOfDay < 0.31) return 'dawn';
  if (timeOfDay < 0.76) return 'day';
  return 'dusk';
}
