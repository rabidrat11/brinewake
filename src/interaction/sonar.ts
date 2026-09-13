/**
 * Sonar.
 *
 * A pulse that expands from the boat, lights up whatever it touches and fades.
 * Mechanically it reveals the map, classifies contacts and finds things the
 * lamps cannot reach; visually it is the game's signature effect, and it is
 * drawn as an expanding shell of geometry rather than a screen-space trick so
 * that it occludes correctly against the terrain.
 *
 * Classification tiers:
 *   0  terrain only
 *   1  objects and salvage
 *   2  creature contacts, with size
 *   3  mineral deposits
 *   4  anomalies, ruins and the things that do not return a normal echo
 */

import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Mesh,
  Object3D,
  ShaderMaterial,
  Vector3,
} from 'three';
import type { Submarine } from '../submarine/submarine';
import type { CreatureSystem } from '../entities/creatures';
import type { PickupSystem } from '../entities/pickups';
import type { TerrainField } from '../world/terrain';
import { bus, toast } from '../core/events';
import { clamp01 } from '../core/math';
import { itemById } from '../data/items/index';

export interface SonarContact {
  kind: 'creature' | 'item' | 'terrain' | 'landmark' | 'anomaly';
  id: string;
  label: string;
  x: number; y: number; z: number;
  /** Seconds until the contact fades from the HUD. */
  life: number;
  maxLife: number;
  /** Relative size, for the blip. */
  size: number;
  colour: string;
}

export class Sonar {
  readonly root = new Object3D();
  private mesh: Mesh;
  private mat: ShaderMaterial;

  /** Seconds until the next pulse may be fired. */
  cooldown = 0;
  /** Radius of the live pulse, or 0 when idle. */
  radius = 0;
  private pulsing = false;
  private origin = new Vector3();
  contacts: SonarContact[] = [];
  /** Grid cells revealed on the map, as packed keys. */
  revealed = new Set<number>();

  constructor() {
    this.mat = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      fog: false,
      uniforms: {
        uRadius: { value: 0 },
        uWidth: { value: 5 },
        uColour: { value: new Color('#9ff0e0') },
        uOpacity: { value: 0 },
      },
      vertexShader: /* glsl */ `
        uniform float uRadius;
        varying float vFade;
        varying vec3 vLocal;
        void main() {
          vLocal = position;
          vec3 p = normalize(position) * uRadius;
          vFade = clamp(p.y * 0.02 + 0.6, 0.2, 1.0);
          vec4 wp = modelMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColour;
        uniform float uOpacity;
        varying float vFade;
        varying vec3 vLocal;
        void main() {
          // A latitude banding so the shell reads as a sweep rather than a bubble.
          float band = 0.55 + 0.45 * sin(normalize(vLocal).y * 22.0);
          gl_FragColor = vec4(uColour, uOpacity * vFade * band * 0.34);
        }
      `,
    });
    this.mesh = new Mesh(makeShell(), this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 9;
    this.mesh.visible = false;
    this.root.add(this.mesh);
  }

  get ready(): boolean {
    return this.cooldown <= 0;
  }

  /** Fire a pulse. Returns false if it is still recharging or out of power. */
  fire(sub: Submarine): boolean {
    if (this.cooldown > 0) return false;
    if (sub.battery < sub.stats.sonarCost) {
      toast('Not enough power for a pulse', 'warn');
      return false;
    }
    sub.battery -= sub.stats.sonarCost;
    this.cooldown = sub.stats.sonarCooldown;
    this.pulsing = true;
    this.radius = 1;
    this.origin.copy(sub.position);
    this.mesh.position.copy(this.origin);
    this.mesh.visible = true;
    bus.emit('toast', { text: '', tone: 'neutral', duration: 0 });
    return true;
  }

  update(
    dt: number, sub: Submarine, creatures: CreatureSystem,
    pickups: PickupSystem, terrain: TerrainField,
  ): void {
    this.cooldown = Math.max(0, this.cooldown - dt);

    for (let i = this.contacts.length - 1; i >= 0; i--) {
      this.contacts[i].life -= dt;
      if (this.contacts[i].life <= 0) this.contacts.splice(i, 1);
    }

    if (!this.pulsing) {
      this.mesh.visible = false;
      return;
    }

    const range = sub.stats.sonarRange;
    const prev = this.radius;
    this.radius += range * 0.55 * dt;
    const t = clamp01(this.radius / range);
    this.mat.uniforms.uRadius.value = this.radius;
    this.mat.uniforms.uOpacity.value = (1 - t) * (1 - t);

    // Anything the shell crossed this frame becomes a contact.
    this.sweep(prev, this.radius, sub, creatures, pickups, terrain);

    if (this.radius >= range) {
      this.pulsing = false;
      this.mesh.visible = false;
    }
  }

  private sweep(
    r0: number, r1: number, sub: Submarine, creatures: CreatureSystem,
    pickups: PickupSystem, terrain: TerrainField,
  ): void {
    const tier = sub.stats.sonarTier;

    if (tier >= 2) {
      const list = creatures.query(this.origin, r1 + 4);
      for (const c of list) {
        const d = Math.hypot(c.x - this.origin.x, c.y - this.origin.y, c.z - this.origin.z);
        if (d < r0 || d > r1) continue;
        const def = creatures.definitionOf(c);
        this.addContact({
          kind: 'creature', id: def.id,
          label: tier >= 2 ? def.name : 'Contact',
          x: c.x, y: c.y, z: c.z,
          life: 9, maxLife: 9,
          size: clamp01(c.size / 3),
          colour: def.group === 'leviathan' ? '#f0b060' : '#8ff0d8',
        });
      }
    }

    if (tier >= 1) {
      const near = pickups.within(this.origin, r1 + 3);
      for (const p of near) {
        const d = Math.hypot(p.x - this.origin.x, p.y - this.origin.y, p.z - this.origin.z);
        if (d < r0 || d > r1) continue;
        const def = itemById(p.itemId);
        if (!def) continue;
        const isMineral = def.category === 'mineral';
        if (isMineral && tier < 3) continue;
        this.addContact({
          kind: 'item', id: p.id,
          label: tier >= 3 ? def.name : def.category === 'mineral' ? 'Mineral' : 'Object',
          x: p.x, y: p.y, z: p.z,
          life: 14, maxLife: 14,
          size: 0.2,
          colour: isMineral ? '#f0d080' : '#a8d8ff',
        });
      }
    }

    // Map reveal: mark the 32 m cells the shell has crossed.
    const step = 32;
    const cells = Math.ceil(r1 / step);
    for (let dz = -cells; dz <= cells; dz++) {
      for (let dx = -cells; dx <= cells; dx++) {
        const d = Math.hypot(dx, dz) * step;
        if (d < r0 || d > r1) continue;
        const wx = this.origin.x + dx * step;
        const wz = this.origin.z + dz * step;
        this.revealed.add(packCell(wx, wz));
        void terrain;
      }
    }
  }

  private addContact(c: SonarContact): void {
    // Replace an existing contact for the same thing rather than stacking.
    const i = this.contacts.findIndex((x) => x.id === c.id && x.kind === c.kind);
    if (i >= 0) this.contacts[i] = c;
    else this.contacts.push(c);
    if (this.contacts.length > 160) this.contacts.shift();
  }

  /** Add a contact from outside — landmarks and quest markers use this. */
  mark(c: SonarContact): void {
    this.addContact(c);
  }

  serialise(): number[] {
    return [...this.revealed];
  }

  restore(cells: number[]): void {
    this.revealed = new Set(cells);
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.mat.dispose();
  }
}

/** Pack a world position into a 32 m map cell key. */
export function packCell(x: number, z: number): number {
  const cx = Math.floor(x / 32) + 512;
  const cz = Math.floor(z / 32) + 512;
  return (cx & 1023) | ((cz & 1023) << 10);
}

export function unpackCell(key: number): [number, number] {
  const cx = (key & 1023) - 512;
  const cz = ((key >> 10) & 1023) - 512;
  return [cx * 32 + 16, cz * 32 + 16];
}

/** A low-poly sphere shell used as the pulse geometry. */
function makeShell(): BufferGeometry {
  const geo = new BufferGeometry();
  const pos: number[] = [];
  const rings = 14, seg = 20;
  for (let i = 0; i < rings; i++) {
    const p0 = (i / rings) * Math.PI, p1 = ((i + 1) / rings) * Math.PI;
    for (let j = 0; j < seg; j++) {
      const t0 = (j / seg) * Math.PI * 2, t1 = ((j + 1) / seg) * Math.PI * 2;
      const v = (p: number, t: number) => [
        Math.sin(p) * Math.cos(t), Math.cos(p), Math.sin(p) * Math.sin(t),
      ];
      const a = v(p0, t0), b = v(p0, t1), c = v(p1, t1), d = v(p1, t0);
      pos.push(...a, ...b, ...c, ...a, ...c, ...d);
    }
  }
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
  geo.boundingSphere = null;
  return geo;
}
