/**
 * The submarine: physics, systems and presentation.
 *
 * Movement is the thing this game lives or dies by, so the model here is
 * deliberately more than a velocity vector:
 *
 *  - thrust acts along the hull's own forward axis, so the boat slips when you
 *    turn hard and has to be flown into a corner
 *  - drag is anisotropic (a hull moves through water far more easily nose-first
 *    than sideways), which is what produces the characteristic "settling" feel
 *  - buoyancy is close to neutral with a slow restoring bob, so releasing the
 *    controls leaves the boat drifting rather than stopping dead
 *  - the hull banks into turns and pitches with vertical thrust, both damped
 *    springs rather than direct sets
 */

import {
  Euler,
  Group,
  Object3D,
  PointLight,
  Quaternion,
  SpotLight,
  Vector3,
  type Material,
} from 'three';
import {
  buildSubmarine, defaultSubSpec, type BuiltSubmarine, type SubVisualSpec,
} from '../procedural/submarineBuilder';
import { baseStats, type SubStats } from './stats';
import type { TerrainField } from '../world/terrain';
import { clamp, clamp01, damp, lerp, shortestAngle, smoothstep } from '../core/math';
import { bus } from '../core/events';

const _v = new Vector3();
const _v2 = new Vector3();
const _q = new Quaternion();
const _e = new Euler();

export interface SubInput {
  /** -1 .. 1 throttle. */
  throttle: number;
  /** -1 .. 1 rudder (yaw). */
  rudder: number;
  /** -1 .. 1 ballast (up positive). */
  ballast: number;
  /** 0..1 boost. */
  boost: number;
  /** 0..1 brake. */
  brake: number;
  /** Desired heading yaw from the camera, radians; null to fly on rudder alone. */
  desiredYaw: number | null;
  /** Desired pitch from the camera, radians. */
  desiredPitch: number | null;
  /** True when the pilot is actively steering with the camera. */
  followCamera: boolean;
}

export function emptyInput(): SubInput {
  return {
    throttle: 0, rudder: 0, ballast: 0, boost: 0, brake: 0,
    desiredYaw: null, desiredPitch: null, followCamera: true,
  };
}

export class Submarine {
  readonly root = new Group();
  readonly position = new Vector3(0, -6, 0);
  readonly velocity = new Vector3();
  /** Orientation as yaw/pitch/roll in radians. */
  yaw = 0;
  pitch = 0;
  roll = 0;
  private yawVel = 0;
  private pitchVel = 0;
  private rollVel = 0;

  stats: SubStats = baseStats();
  spec: SubVisualSpec = defaultSubSpec();
  built: BuiltSubmarine | null = null;

  // --- systems ---
  hull = 100;
  battery = 100;
  oxygen = 900;
  lightsOn = true;
  /** Set while docked; physics and drain are suspended. */
  docked = false;
  /** Cumulative cargo mass, set by the inventory. */
  cargoMass = 0;

  /** Engine load 0..1, drives audio and bubbles. */
  engineLoad = 0;
  /** Propeller angle. */
  private propAngle = 0;
  /** Smoothed speed for camera and audio. */
  smoothedSpeed = 0;
  /** Set when the hull scraped something this frame. */
  lastImpact = 0;
  /** Seconds of continuous overpressure, for the creak audio and warnings. */
  overpressure = 0;
  /** True when the boat is resting on the seabed. */
  grounded = false;

  private lamps: SpotLight[] = [];
  private cabinLight: PointLight | null = null;
  private terrain: TerrainField;
  private material: Material;
  private glowMaterial: Material;
  private lightTarget = new Object3D();

  constructor(terrain: TerrainField, material: Material, glowMaterial: Material) {
    this.terrain = terrain;
    this.material = material;
    this.glowMaterial = glowMaterial;
    this.root.add(this.lightTarget);
    this.rebuild();
  }

  /** Rebuild the hull mesh and lights from the current visual spec. */
  rebuild(): void {
    if (this.built) {
      for (const g of this.built.geometries) g.dispose();
      this.root.remove(this.built.group);
    }
    for (const l of this.lamps) {
      this.root.remove(l);
      l.dispose();
    }
    this.lamps.length = 0;

    this.built = buildSubmarine(this.spec, this.material, this.glowMaterial, 7);
    this.root.add(this.built.group);

    for (const mount of this.built.lampMounts) {
      const spot = new SpotLight(0xfff0d0, this.stats.lightPower, this.stats.lightRange,
        this.stats.lightAngle, 0.55, 1.1);
      spot.position.copy(mount.pos);
      const target = new Object3D();
      target.position.copy(mount.pos).addScaledVector(mount.dir, 10);
      this.built.group.add(target);
      spot.target = target;
      spot.castShadow = false;
      this.built.group.add(spot);
      this.lamps.push(spot);
    }

    if (!this.cabinLight) {
      this.cabinLight = new PointLight(0xffe0a8, 0.55, 9, 1.4);
      this.root.add(this.cabinLight);
    }
    this.cabinLight.position.copy(this.built.cockpit);
    bus.emit('sub:loadout-changed');
  }

  applyStats(stats: SubStats): void {
    this.stats = stats;
    this.hull = Math.min(this.hull, stats.hullMax);
    this.battery = Math.min(this.battery, stats.batteryMax);
    this.oxygen = Math.min(this.oxygen, stats.oxygenMax);
    for (const l of this.lamps) {
      l.intensity = stats.lightPower;
      l.distance = stats.lightRange;
      l.angle = stats.lightAngle;
    }
  }

  get depth(): number {
    return Math.max(0, -this.position.y);
  }

  get speed(): number {
    return this.velocity.length();
  }

  get forward(): Vector3 {
    return _v.set(
      Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      Math.cos(this.yaw) * Math.cos(this.pitch),
    );
  }

  /** Local -> world for a point on the hull. */
  localToWorld(local: Vector3, out: Vector3): Vector3 {
    _e.set(this.pitch, this.yaw, this.roll, 'YXZ');
    _q.setFromEuler(_e);
    return out.copy(local).applyQuaternion(_q).add(this.position);
  }

  /**
   * One simulation step.
   */
  update(input: SubInput, dt: number): void {
    if (this.docked) {
      this.velocity.multiplyScalar(Math.exp(-6 * dt));
      this.syncTransform(dt);
      return;
    }

    const s = this.stats;
    const massPenalty = 1 / (1 + this.cargoMass / Math.max(1, s.massMax) * 0.55);
    const powered = this.battery > 0.5;

    // --- orientation -----------------------------------------------------
    // Rudder input plus, when the pilot is flying with the camera, a gentle
    // pull toward where they are looking. The pull scales with throttle so a
    // stationary boat pivots on the spot instead of drifting round.
    let yawTorque = input.rudder * s.turnRate;
    if (input.followCamera && input.desiredYaw !== null) {
      const err = shortestAngle(this.yaw, input.desiredYaw);
      const authority = 0.55 + 0.85 * clamp01(Math.abs(input.throttle));
      yawTorque += clamp(err * 2.1, -1, 1) * s.turnRate * authority;
    }
    if (!powered) yawTorque *= 0.25;
    this.yawVel = damp(this.yawVel, yawTorque, 4.2, dt);
    this.yaw += this.yawVel * dt;

    let pitchTorque = 0;
    if (input.desiredPitch !== null && input.followCamera) {
      const err = input.desiredPitch - this.pitch;
      pitchTorque += clamp(err * 2.0, -1, 1) * s.pitchRate * (0.35 + 0.65 * clamp01(Math.abs(input.throttle)));
    }
    // Ballast tilts the nose a little, which reads as the boat "leaning" into a climb.
    pitchTorque += input.ballast * 0.34 * s.pitchRate;
    if (!powered) pitchTorque *= 0.3;
    this.pitchVel = damp(this.pitchVel, pitchTorque, 3.6, dt);
    this.pitch = clamp(this.pitch + this.pitchVel * dt, -1.25, 1.25);

    // Bank into the turn; a purely cosmetic torque that does a lot of work.
    const targetRoll = clamp(-this.yawVel * 0.62, -0.5, 0.5) *
      clamp01(this.smoothedSpeed / Math.max(1, s.maxSpeed * 0.5));
    this.rollVel = damp(this.rollVel, (targetRoll - this.roll) * 5.5, 6, dt);
    this.roll += this.rollVel * dt;

    // --- translation -----------------------------------------------------
    const fwd = _v2.set(
      Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      Math.cos(this.yaw) * Math.cos(this.pitch),
    );

    let throttle = input.throttle;
    if (throttle < 0) throttle *= s.reverseFactor;
    const boost = 1 + input.boost * (s.boostMult - 1);
    const thrustMag = powered ? throttle * s.thrust * boost * massPenalty : 0;
    this.engineLoad = damp(this.engineLoad, Math.abs(throttle) * (0.55 + 0.45 * input.boost), 5, dt);

    this.velocity.addScaledVector(fwd, thrustMag * dt);

    // Vertical thrust (ballast pumps).
    if (powered) this.velocity.y += input.ballast * s.verticalThrust * dt;

    // Near-neutral buoyancy with a slow restoring force, plus cargo weight.
    const buoyancy = 0.55 - (this.cargoMass / Math.max(1, s.massMax)) * 0.85;
    this.velocity.y += buoyancy * dt;

    // Surface clamp: the boat cannot leave the water.
    if (this.position.y > -1.4) {
      this.velocity.y = Math.min(this.velocity.y, 0);
      this.position.y = Math.min(this.position.y, -1.4);
    }

    // Anisotropic drag. Forward motion is cheap, sideways and vertical are not.
    const v = this.velocity;
    const along = fwd.dot(v);
    _v.copy(fwd).multiplyScalar(along);
    const lateralX = v.x - _v.x;
    const lateralY = v.y - _v.y;
    const lateralZ = v.z - _v.z;

    const brake = 1 + input.brake * 4.5;
    const dragAlong = Math.exp(-(0.42 + Math.abs(along) * 0.062) * brake * dt);
    const dragLateral = Math.exp(-(2.6 + Math.hypot(lateralX, lateralY, lateralZ) * 0.2) * brake * dt);
    const newAlong = along * dragAlong;

    v.set(
      fwd.x * newAlong + lateralX * dragLateral,
      fwd.y * newAlong + lateralY * dragLateral,
      fwd.z * newAlong + lateralZ * dragLateral,
    );

    // Speed ceiling: soft, so boosting past it feels like effort rather than a wall.
    const sp = v.length();
    const cap = s.maxSpeed * boost;
    if (sp > cap) v.multiplyScalar(lerp(1, cap / sp, clamp01((sp - cap) / (cap * 0.4))));

    this.position.addScaledVector(v, dt);
    this.smoothedSpeed = damp(this.smoothedSpeed, sp, 4, dt);

    this.collide(dt);
    this.updateSystems(input, dt);
    this.syncTransform(dt);
  }

  /** Push the hull out of the seabed and take damage from hard contacts. */
  private collide(dt: number): void {
    const r = this.built ? this.built.radius + 0.35 : 1.2;
    const halfLen = this.built ? this.built.halfLength : 2.4;
    this.grounded = false;
    let deepest = 0;
    let nx = 0, ny = 1, nz = 0;

    // Sample under the nose, centre and tail so long hulls do not clip through
    // ridges that a single sphere would step over.
    const fwd = this.forward.clone();
    for (const t of [-0.72, -0.2, 0.3, 0.78]) {
      const px = this.position.x + fwd.x * halfLen * t;
      const py = this.position.y + fwd.y * halfLen * t;
      const pz = this.position.z + fwd.z * halfLen * t;
      const h = this.terrain.height(px, pz);
      const pen = h + r - py;
      if (pen > deepest) {
        deepest = pen;
        this.terrain.normal(px, pz, _v);
        nx = _v.x; ny = _v.y; nz = _v.z;
      }
    }

    if (deepest > 0) {
      this.grounded = true;
      this.position.x += nx * deepest * 0.9;
      this.position.y += ny * deepest * 1.0;
      this.position.z += nz * deepest * 0.9;
      const vn = this.velocity.x * nx + this.velocity.y * ny + this.velocity.z * nz;
      if (vn < 0) {
        // Remove the into-surface component and lose some tangential speed.
        this.velocity.x -= nx * vn * 1.25;
        this.velocity.y -= ny * vn * 1.25;
        this.velocity.z -= nz * vn * 1.25;
        this.velocity.multiplyScalar(0.86);
        const impact = -vn;
        if (impact > 2.2) {
          const dmg = (impact - 2.2) * 2.4 * this.stats.impactResistance;
          this.damage(dmg, 'collision');
          this.lastImpact = Math.min(1, impact / 9);
          bus.emit('sub:collide', {
            speed: impact, x: this.position.x, y: this.position.y, z: this.position.z,
          });
        }
      }
    }
    this.lastImpact = Math.max(0, this.lastImpact - dt * 2.4);
  }

  private updateSystems(input: SubInput, dt: number): void {
    const s = this.stats;

    // Energy.
    let draw = s.idlePower;
    draw += Math.abs(input.throttle) * s.drivePower * (1 + input.boost * 0.9);
    draw += Math.abs(input.ballast) * s.drivePower * 0.42;
    if (this.lightsOn) draw += s.lightDraw * (this.lamps.length * 0.55 + 0.45);
    this.battery = clamp(this.battery - draw * dt + s.recharge * dt, 0, s.batteryMax);

    // Life support.
    this.oxygen = clamp(this.oxygen - s.oxygenRate * dt, 0, s.oxygenMax);
    if (this.oxygen <= 0) this.damage(1.5 * dt, 'life support');

    // Pressure.
    const over = this.depth - s.crushDepth;
    if (over > 0) {
      this.overpressure += dt;
      const rate = (over / Math.max(40, s.crushDepth * 0.35)) / Math.max(0.35, s.pressureResistance);
      this.damage(rate * 1.9 * dt, 'pressure');
    } else {
      this.overpressure = Math.max(0, this.overpressure - dt * 2);
    }

    // Field repair.
    if (s.fieldRepair > 0 && this.hull < s.hullMax) {
      this.hull = Math.min(s.hullMax, this.hull + s.fieldRepair * dt);
    }

    // Lamps follow the battery: they dim and gutter as it runs down.
    const power = clamp01(this.battery / Math.max(1, s.batteryMax * 0.18));
    for (const l of this.lamps) {
      l.visible = this.lightsOn && this.battery > 0.2;
      l.intensity = s.lightPower * lerp(0.25, 1, power);
    }
    if (this.cabinLight) this.cabinLight.intensity = 0.55 * lerp(0.2, 1, power);
  }

  damage(amount: number, cause: string): void {
    if (amount <= 0) return;
    const before = this.hull;
    this.hull = Math.max(0, this.hull - amount);
    if (this.hull !== before) bus.emit('sub:damage', { amount, cause });
    if (this.hull <= 0 && before > 0) bus.emit('sub:destroyed', { cause });
  }

  repair(amount: number): void {
    this.hull = Math.min(this.stats.hullMax, this.hull + amount);
  }

  /** Push the visual transform and animate moving parts. */
  private syncTransform(dt: number): void {
    this.root.position.copy(this.position);
    _e.set(this.pitch, this.yaw, this.roll, 'YXZ');
    this.root.quaternion.setFromEuler(_e);

    if (this.built) {
      const spin = (this.engineLoad * 26 + 2.2) * (this.docked ? 0.15 : 1);
      this.propAngle += spin * dt;
      for (const p of this.built.propellers) p.rotation.z = this.propAngle;
      if (this.built.arm) {
        // The arm stows against the hull and extends when there is work to do.
        const t = this.armExtension;
        this.built.arm.rotation.x = lerp(-0.9, 0.1, t);
        this.built.arm.rotation.y = lerp(0.5, 0, t);
      }
    }
  }

  /** 0 stowed .. 1 extended, driven by the tool system. */
  armExtension = 0;

  /** Emergency recovery: called when the hull fails. */
  resetAt(x: number, y: number, z: number): void {
    this.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
    this.yaw = 0; this.pitch = 0; this.roll = 0;
    this.yawVel = 0; this.pitchVel = 0; this.rollVel = 0;
    this.hull = this.stats.hullMax;
    this.battery = this.stats.batteryMax;
    this.oxygen = this.stats.oxygenMax;
    this.overpressure = 0;
  }

  /** Depth at which the hull starts complaining, for the HUD warning band. */
  get warningDepth(): number {
    return this.stats.crushDepth * 0.92;
  }

  get hullFraction(): number {
    return clamp01(this.hull / Math.max(1, this.stats.hullMax));
  }

  get batteryFraction(): number {
    return clamp01(this.battery / Math.max(1, this.stats.batteryMax));
  }

  get oxygenFraction(): number {
    return clamp01(this.oxygen / Math.max(1, this.stats.oxygenMax));
  }

  /** How hard the pressure hull is being stressed, 0..1, for creaks and grade. */
  get stress(): number {
    const over = this.depth - this.warningDepth;
    if (over <= 0) return 0;
    return clamp01(over / Math.max(30, this.stats.crushDepth * 0.25));
  }

  dispose(): void {
    if (this.built) for (const g of this.built.geometries) g.dispose();
    for (const l of this.lamps) l.dispose();
  }
}

export { smoothstep };
