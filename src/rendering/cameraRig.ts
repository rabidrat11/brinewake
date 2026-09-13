/**
 * Third-person camera.
 *
 * The camera is the player's second most important relationship with the boat
 * after the controls, so it does rather more than follow:
 *
 *  - it leads the submarine slightly in the direction of travel, so corners
 *    open up before you reach them
 *  - it eases outward with speed and inward in tight spaces
 *  - it widens its field of view under acceleration
 *  - it never allows the seabed between itself and the boat
 *  - it can be released for free orbit, dropped into the cockpit, or framed on
 *    a discovery
 */

import { PerspectiveCamera, Quaternion, Vector3 } from 'three';
import type { Submarine } from '../submarine/submarine';
import type { TerrainField } from '../world/terrain';
import { clamp, clamp01, damp, lerp, smoothstep } from '../core/math';

export type ViewMode = 'chase' | 'orbit' | 'cockpit';

const _v = new Vector3();
const _v2 = new Vector3();
const _target = new Vector3();
const _ideal = new Vector3();
const _q = new Quaternion();

export class CameraRig {
  yaw = 0;
  pitch = -0.12;
  mode: ViewMode = 'chase';

  /** Base distance behind the boat. */
  distance = 9.5;
  /** Player-adjustable zoom multiplier. */
  zoom = 1;
  /** Base field of view. */
  baseFov = 58;
  fovSpeedGain = 9;
  shakeAmount = 1;
  /** Reduced-motion accessibility switch. */
  reducedMotion = false;

  private pos = new Vector3(0, 0, -10);
  private look = new Vector3();
  private curDistance = 9.5;
  private shake = 0;
  private shakeSeed = Math.random() * 100;
  private fov = 58;
  private terrain: TerrainField;
  /** Non-null while a cinematic framing is active. */
  private cinematic: { pos: Vector3; look: Vector3; t: number; dur: number } | null = null;

  constructor(terrain: TerrainField) {
    this.terrain = terrain;
  }

  /** Add a screen shake impulse, 0..1. */
  addShake(amount: number): void {
    if (this.reducedMotion) return;
    this.shake = Math.min(1.4, this.shake + amount * this.shakeAmount);
  }

  /** Frame a point of interest for a moment (discoveries, arrivals). */
  frame(pos: Vector3, look: Vector3, duration = 3): void {
    this.cinematic = { pos: pos.clone(), look: look.clone(), t: 0, dur: duration };
  }

  cancelFrame(): void {
    this.cinematic = null;
  }

  get isFraming(): boolean {
    return this.cinematic !== null;
  }

  /** Rotate the camera; called from the input layer. */
  rotate(dx: number, dy: number): void {
    this.yaw -= dx;
    this.pitch = clamp(this.pitch - dy, -1.32, 1.28);
  }

  update(sub: Submarine, camera: PerspectiveCamera, dt: number): void {
    if (this.cinematic) {
      const c = this.cinematic;
      c.t += dt;
      const k = 1 - Math.exp(-4 * dt);
      this.pos.lerp(c.pos, k);
      this.look.lerp(c.look, k);
      camera.position.copy(this.pos);
      camera.lookAt(this.look);
      this.fov = damp(this.fov, this.baseFov - 6, 3, dt);
      camera.fov = this.fov;
      camera.updateProjectionMatrix();
      if (c.t >= c.dur) this.cinematic = null;
      return;
    }

    if (this.mode === 'cockpit') {
      this.updateCockpit(sub, camera, dt);
      return;
    }

    const speedT = clamp01(sub.smoothedSpeed / Math.max(2, sub.stats.maxSpeed));

    // Anchor slightly above the hull and ahead along the velocity, so the boat
    // sits low in frame when moving and the water opens up in front of it.
    _target.copy(sub.position);
    _target.y += 1.05;
    if (!this.reducedMotion) {
      _v.copy(sub.velocity).multiplyScalar(0.28 * (1 - 0.4 * speedT));
      _v.clampLength(0, 4.5);
      _target.add(_v);
    }

    // Ideal camera position on a sphere behind the look direction.
    const wantDistance = this.distance * this.zoom * lerp(0.88, 1.24, speedT);
    const cy = Math.cos(this.pitch);
    _v2.set(
      -Math.sin(this.yaw) * cy,
      -Math.sin(this.pitch),
      -Math.cos(this.yaw) * cy,
    );
    _ideal.copy(_target).addScaledVector(_v2, wantDistance);
    _ideal.y += 1.1 * cy;

    // Terrain avoidance: walk the segment from the anchor outward and stop at
    // the first point that would put the camera inside the seabed.
    let allowed = wantDistance;
    const steps = 7;
    for (let i = 1; i <= steps; i++) {
      const t = (i / steps) * wantDistance;
      const px = _target.x + _v2.x * t;
      const py = _target.y + _v2.y * t + 1.1 * cy * (t / wantDistance);
      const pz = _target.z + _v2.z * t;
      const h = this.terrain.height(px, pz);
      if (py < h + 1.5) {
        allowed = Math.max(2.6, t - 0.9);
        break;
      }
    }
    // Also never let the camera surface out of the water.
    _ideal.copy(_target).addScaledVector(_v2, allowed);
    _ideal.y += 1.1 * cy * (allowed / wantDistance);
    if (_ideal.y > -0.9) _ideal.y = -0.9;

    // Pulling in is fast (avoid clipping), pushing out is slow (avoid whiplash).
    const closing = allowed < this.curDistance;
    this.curDistance = damp(this.curDistance, allowed, closing ? 16 : 3.4, dt);

    const followRate = this.reducedMotion ? 18 : lerp(7.5, 12, speedT);
    this.pos.x = damp(this.pos.x, _ideal.x, followRate, dt);
    this.pos.y = damp(this.pos.y, _ideal.y, followRate * 0.85, dt);
    this.pos.z = damp(this.pos.z, _ideal.z, followRate, dt);

    this.look.x = damp(this.look.x, _target.x, 14, dt);
    this.look.y = damp(this.look.y, _target.y, 14, dt);
    this.look.z = damp(this.look.z, _target.z, 14, dt);

    // Shake: decays fast, and never enough to make anyone motion sick.
    this.shake = Math.max(0, this.shake - dt * 2.6);
    let sx = 0, sy = 0;
    if (this.shake > 0.001) {
      const t = performance.now() * 0.001;
      sx = Math.sin(t * 41 + this.shakeSeed) * this.shake * 0.28;
      sy = Math.cos(t * 37.3 + this.shakeSeed * 1.7) * this.shake * 0.28;
    }

    camera.position.set(this.pos.x + sx, this.pos.y + sy, this.pos.z);
    camera.lookAt(this.look);

    // A hint of roll from the boat's bank, and from lateral acceleration.
    const bank = sub.roll * 0.32;
    _q.setFromAxisAngle(_v.set(0, 0, 1), bank);
    camera.quaternion.multiply(_q);

    const targetFov = this.baseFov + speedT * this.fovSpeedGain +
      sub.stress * 3 + (this.reducedMotion ? 0 : 0);
    this.fov = damp(this.fov, targetFov, 3.5, dt);
    camera.fov = this.fov;
    camera.updateProjectionMatrix();
  }

  private updateCockpit(sub: Submarine, camera: PerspectiveCamera, dt: number): void {
    const local = sub.built ? sub.built.cockpit : _v.set(0, 0.4, 1.4);
    sub.localToWorld(local, _ideal);
    this.pos.copy(_ideal);
    camera.position.copy(this.pos);

    // Look along the hull, modulated by where the player has aimed.
    const relYaw = clamp(this.yaw - sub.yaw, -1.15, 1.15);
    const relPitch = clamp(this.pitch, -0.95, 0.95);
    _v2.set(
      Math.sin(sub.yaw + relYaw) * Math.cos(sub.pitch + relPitch),
      Math.sin(sub.pitch + relPitch),
      Math.cos(sub.yaw + relYaw) * Math.cos(sub.pitch + relPitch),
    );
    _target.copy(this.pos).add(_v2);
    camera.lookAt(_target);
    _q.setFromAxisAngle(_v.set(0, 0, 1), sub.roll * 0.85);
    camera.quaternion.multiply(_q);

    const speedT = clamp01(sub.smoothedSpeed / Math.max(2, sub.stats.maxSpeed));
    this.fov = damp(this.fov, this.baseFov + 4 + speedT * this.fovSpeedGain * 0.6, 3.5, dt);
    camera.fov = this.fov;
    camera.updateProjectionMatrix();
  }

  cycleMode(): ViewMode {
    this.mode = this.mode === 'chase' ? 'cockpit' : this.mode === 'cockpit' ? 'orbit' : 'chase';
    return this.mode;
  }

  /** Snap the camera to the boat without easing (after teleports and loads). */
  snap(sub: Submarine, camera: PerspectiveCamera): void {
    this.yaw = sub.yaw;
    this.pitch = -0.12;
    const cy = Math.cos(this.pitch);
    this.look.copy(sub.position);
    this.look.y += 1.05;
    this.pos.copy(this.look).add(
      _v2.set(-Math.sin(this.yaw) * cy, -Math.sin(this.pitch), -Math.cos(this.yaw) * cy)
        .multiplyScalar(this.distance * this.zoom),
    );
    this.curDistance = this.distance * this.zoom;
    camera.position.copy(this.pos);
    camera.lookAt(this.look);
  }
}

export { smoothstep };
