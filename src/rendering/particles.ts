/**
 * Particles.
 *
 * Three systems, all of them cheap:
 *
 *  - Marine snow: a fixed cloud of points that wraps around the camera
 *    entirely in the vertex shader, so 6000 motes cost one draw call and no
 *    CPU work at all.
 *  - Emitters: a pooled CPU system for bubbles, sediment puffs, vent plumes
 *    and pickup sparkles, where individual behaviour matters.
 *  - Bioluminescent motes: like snow, but they brighten near the submarine's
 *    lamps, which is the single best "the deep is alive" cue in the game.
 */

import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  NormalBlending,
  Points,
  ShaderMaterial,
  Vector3,
} from 'three';
import { Rng } from '../core/rng';

// --- marine snow --------------------------------------------------------

const SNOW_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aSeed;
  uniform vec3 uCam;
  uniform float uTime;
  uniform vec3 uBox;
  uniform float uPixelRatio;
  uniform float uSinkRate;
  uniform vec3 uCurrent;
  varying float vAlpha;
  varying float vSeed;

  void main() {
    vec3 p = position;
    // Slow sink plus a lazy horizontal wander, both seeded per mote.
    p.y -= uTime * uSinkRate * (0.5 + aSeed * 0.9);
    p.x += sin(uTime * 0.21 + aSeed * 31.0) * 0.9 + uCurrent.x * uTime * 0.35;
    p.z += cos(uTime * 0.17 + aSeed * 19.0) * 0.9 + uCurrent.z * uTime * 0.35;

    // Wrap into a box centred on the camera.
    vec3 rel = p - uCam;
    rel = mod(rel + uBox * 0.5, uBox) - uBox * 0.5;
    vec3 world = uCam + rel;

    vec4 mv = modelViewMatrix * vec4(world, 1.0);
    gl_Position = projectionMatrix * mv;

    float dist = -mv.z;
    gl_PointSize = aSize * uPixelRatio * (40.0 / max(dist, 1.0));
    // Fade at the edge of the wrap box and very close to the lens.
    float edge = 1.0 - max(max(abs(rel.x) / (uBox.x * 0.5), abs(rel.y) / (uBox.y * 0.5)),
                           abs(rel.z) / (uBox.z * 0.5));
    vAlpha = smoothstep(0.0, 0.22, edge) * smoothstep(0.4, 2.2, dist);
    vSeed = aSeed;
  }
`;

const SNOW_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vSeed;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = dot(c, c);
    if (d > 0.25) discard;
    float soft = smoothstep(0.25, 0.02, d);
    float tw = 0.75 + 0.25 * sin(vSeed * 57.0);
    gl_FragColor = vec4(uColor, soft * vAlpha * uOpacity * tw);
  }
`;

export class MarineSnow {
  readonly points: Points;
  private mat: ShaderMaterial;
  private box: Vector3;

  constructor(count = 6000, boxSize = 120, seed = 5) {
    const rng = new Rng(seed);
    const pos = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const seeds = new Float32Array(count);
    this.box = new Vector3(boxSize, boxSize * 0.8, boxSize);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = rng.range(-0.5, 0.5) * this.box.x;
      pos[i * 3 + 1] = rng.range(-0.5, 0.5) * this.box.y;
      pos[i * 3 + 2] = rng.range(-0.5, 0.5) * this.box.z;
      // Heavy tail: mostly tiny motes, occasionally a big flake.
      size[i] = Math.pow(rng.next(), 2.4) * 3.4 + 0.35;
      seeds[i] = rng.next();
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
    geo.setAttribute('aSize', new Float32BufferAttribute(size, 1));
    geo.setAttribute('aSeed', new Float32BufferAttribute(seeds, 1));
    geo.boundingSphere = null;

    this.mat = new ShaderMaterial({
      uniforms: {
        uCam: { value: new Vector3() },
        uTime: { value: 0 },
        uBox: { value: this.box },
        uPixelRatio: { value: 1 },
        uColor: { value: new Color('#dff4ee') },
        uOpacity: { value: 0.5 },
        uSinkRate: { value: 0.22 },
        uCurrent: { value: new Vector3() },
      },
      vertexShader: SNOW_VERT,
      fragmentShader: SNOW_FRAG,
      transparent: true,
      depthWrite: false,
      blending: NormalBlending,
    });

    this.points = new Points(geo, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 6;
  }

  update(cam: Vector3, time: number, density: number, colour: Color, current: Vector3, pixelRatio: number): void {
    const u = this.mat.uniforms;
    u.uCam.value.copy(cam);
    u.uTime.value = time;
    u.uOpacity.value = Math.min(0.85, density * 0.38);
    u.uColor.value.copy(colour);
    u.uCurrent.value.copy(current);
    u.uPixelRatio.value = pixelRatio;
    this.points.visible = density > 0.02;
  }

  setCount(_count: number): void {
    // Density is expressed through opacity; rebuilding the buffer at runtime
    // is not worth the hitch.
  }

  dispose(): void {
    this.points.geometry.dispose();
    this.mat.dispose();
  }
}

// --- bioluminescent motes ----------------------------------------------

export class GlowMotes {
  readonly points: Points;
  private mat: ShaderMaterial;

  constructor(count = 1400, boxSize = 90, seed = 11) {
    const rng = new Rng(seed);
    const pos = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = rng.range(-0.5, 0.5) * boxSize;
      pos[i * 3 + 1] = rng.range(-0.5, 0.5) * boxSize * 0.7;
      pos[i * 3 + 2] = rng.range(-0.5, 0.5) * boxSize;
      size[i] = Math.pow(rng.next(), 2) * 4 + 0.6;
      seeds[i] = rng.next();
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
    geo.setAttribute('aSize', new Float32BufferAttribute(size, 1));
    geo.setAttribute('aSeed', new Float32BufferAttribute(seeds, 1));
    geo.boundingSphere = null;

    this.mat = new ShaderMaterial({
      uniforms: {
        uCam: { value: new Vector3() },
        uTime: { value: 0 },
        uBox: { value: new Vector3(boxSize, boxSize * 0.7, boxSize) },
        uPixelRatio: { value: 1 },
        uColor: { value: new Color('#7fffe0') },
        uOpacity: { value: 0.6 },
        uSubPos: { value: new Vector3() },
        uLightRange: { value: 24 },
      },
      vertexShader: /* glsl */ `
        attribute float aSize;
        attribute float aSeed;
        uniform vec3 uCam;
        uniform float uTime;
        uniform vec3 uBox;
        uniform float uPixelRatio;
        uniform vec3 uSubPos;
        uniform float uLightRange;
        varying float vAlpha;
        varying float vPulse;
        void main() {
          vec3 p = position;
          float t = uTime * (0.12 + aSeed * 0.2);
          p.x += sin(t * 1.7 + aSeed * 40.0) * 2.4;
          p.y += sin(t * 1.1 + aSeed * 22.0) * 1.8;
          p.z += cos(t * 1.4 + aSeed * 33.0) * 2.4;
          vec3 rel = p - uCam;
          rel = mod(rel + uBox * 0.5, uBox) - uBox * 0.5;
          vec3 world = uCam + rel;

          // Motes brighten as the boat's lamps sweep over them.
          float d = length(world - uSubPos);
          vPulse = 0.35 + 0.65 * smoothstep(uLightRange * 1.4, uLightRange * 0.25, d);
          vPulse *= 0.55 + 0.45 * sin(uTime * (1.4 + aSeed * 2.5) + aSeed * 60.0);

          vec4 mv = modelViewMatrix * vec4(world, 1.0);
          gl_Position = projectionMatrix * mv;
          float dist = -mv.z;
          gl_PointSize = aSize * uPixelRatio * (34.0 / max(dist, 1.0));
          float edge = 1.0 - max(max(abs(rel.x) / (uBox.x * 0.5), abs(rel.y) / (uBox.y * 0.5)),
                                 abs(rel.z) / (uBox.z * 0.5));
          vAlpha = smoothstep(0.0, 0.25, edge) * smoothstep(0.5, 3.0, dist);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying float vAlpha;
        varying float vPulse;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = dot(c, c);
          if (d > 0.25) discard;
          float soft = smoothstep(0.25, 0.0, d);
          gl_FragColor = vec4(uColor * (0.6 + vPulse), soft * vAlpha * uOpacity * max(0.0, vPulse));
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });

    this.points = new Points(geo, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 7;
  }

  update(
    cam: Vector3, time: number, density: number, colour: Color,
    subPos: Vector3, lightRange: number, pixelRatio: number,
  ): void {
    const u = this.mat.uniforms;
    u.uCam.value.copy(cam);
    u.uTime.value = time;
    u.uOpacity.value = Math.min(1, density);
    u.uColor.value.copy(colour);
    u.uSubPos.value.copy(subPos);
    u.uLightRange.value = lightRange;
    u.uPixelRatio.value = pixelRatio;
    this.points.visible = density > 0.02;
  }

  dispose(): void {
    this.points.geometry.dispose();
    this.mat.dispose();
  }
}

// --- pooled emitters ----------------------------------------------------

export type EmitKind = 'bubble' | 'sediment' | 'plume' | 'spark' | 'ink' | 'scan';

interface Particle {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  life: number; maxLife: number;
  size: number;
  r: number; g: number; b: number;
  kind: EmitKind;
  seed: number;
}

const KIND_PARAMS: Record<EmitKind, {
  gravity: number; drag: number; wobble: number; grow: number; additive: boolean;
}> = {
  bubble: { gravity: 2.1, drag: 1.2, wobble: 1.5, grow: 0.25, additive: false },
  sediment: { gravity: -0.12, drag: 1.9, wobble: 0.3, grow: 1.4, additive: false },
  plume: { gravity: 1.4, drag: 0.6, wobble: 0.9, grow: 2.2, additive: false },
  spark: { gravity: 0.3, drag: 2.4, wobble: 0.6, grow: -0.4, additive: true },
  ink: { gravity: -0.05, drag: 2.6, wobble: 0.2, grow: 2.8, additive: false },
  scan: { gravity: 0, drag: 3.4, wobble: 0.1, grow: -0.6, additive: true },
};

export class EmitterField {
  readonly points: Points;
  readonly additivePoints: Points;
  private pool: Particle[] = [];
  private active = 0;
  private mat: ShaderMaterial;
  private matAdd: ShaderMaterial;
  private geo: BufferGeometry;
  private geoAdd: BufferGeometry;
  private posArr: Float32Array;
  private sizeArr: Float32Array;
  private colArr: Float32Array;
  private posArrAdd: Float32Array;
  private sizeArrAdd: Float32Array;
  private colArrAdd: Float32Array;
  private rng = new Rng(1337);
  private capacity: number;

  constructor(capacity = 900) {
    this.capacity = capacity;
    for (let i = 0; i < capacity; i++) {
      this.pool.push({
        x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0,
        life: 0, maxLife: 1, size: 1, r: 1, g: 1, b: 1, kind: 'bubble', seed: 0,
      });
    }
    this.posArr = new Float32Array(capacity * 3);
    this.sizeArr = new Float32Array(capacity);
    this.colArr = new Float32Array(capacity * 3);
    this.posArrAdd = new Float32Array(capacity * 3);
    this.sizeArrAdd = new Float32Array(capacity);
    this.colArrAdd = new Float32Array(capacity * 3);

    this.geo = makeParticleGeometry(this.posArr, this.sizeArr, this.colArr);
    this.geoAdd = makeParticleGeometry(this.posArrAdd, this.sizeArrAdd, this.colArrAdd);
    this.mat = makeParticleMaterial(false);
    this.matAdd = makeParticleMaterial(true);
    this.points = new Points(this.geo, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
    this.additivePoints = new Points(this.geoAdd, this.matAdd);
    this.additivePoints.frustumCulled = false;
    this.additivePoints.renderOrder = 7;
  }

  get activeCount(): number {
    return this.active;
  }

  emit(
    kind: EmitKind, x: number, y: number, z: number,
    opts: {
      count?: number; speed?: number; spread?: number; size?: number;
      life?: number; colour?: Color | string; dir?: Vector3;
    } = {},
  ): void {
    const count = opts.count ?? 1;
    const speed = opts.speed ?? 0.6;
    const spread = opts.spread ?? 0.5;
    const size = opts.size ?? 0.16;
    const life = opts.life ?? 2.2;
    const c = opts.colour instanceof Color ? opts.colour : new Color(opts.colour ?? '#ffffff');
    for (let i = 0; i < count; i++) {
      if (this.active >= this.capacity) return;
      const p = this.pool[this.active++];
      p.kind = kind;
      p.x = x + this.rng.signed(spread * 0.4);
      p.y = y + this.rng.signed(spread * 0.4);
      p.z = z + this.rng.signed(spread * 0.4);
      const dx = opts.dir ? opts.dir.x : 0;
      const dy = opts.dir ? opts.dir.y : 0;
      const dz = opts.dir ? opts.dir.z : 0;
      p.vx = dx * speed + this.rng.signed(spread) * speed;
      p.vy = dy * speed + this.rng.signed(spread) * speed;
      p.vz = dz * speed + this.rng.signed(spread) * speed;
      p.maxLife = life * this.rng.range(0.7, 1.3);
      p.life = p.maxLife;
      p.size = size * this.rng.range(0.6, 1.5);
      p.r = c.r; p.g = c.g; p.b = c.b;
      p.seed = this.rng.next();
    }
  }

  update(dt: number, time: number): void {
    let n = 0, nAdd = 0;
    for (let i = 0; i < this.active; i++) {
      const p = this.pool[i];
      p.life -= dt;
      if (p.life <= 0) {
        // Swap-remove.
        this.pool[i] = this.pool[this.active - 1];
        this.pool[this.active - 1] = p;
        this.active--;
        i--;
        continue;
      }
      const par = KIND_PARAMS[p.kind];
      p.vy += par.gravity * dt;
      const d = Math.exp(-par.drag * dt);
      p.vx *= d; p.vy *= d; p.vz *= d;
      if (par.wobble > 0) {
        const w = par.wobble * dt;
        p.vx += Math.sin(time * 3.1 + p.seed * 40) * w;
        p.vz += Math.cos(time * 2.7 + p.seed * 33) * w;
      }
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;

      const t = 1 - p.life / p.maxLife;
      const size = p.size * (1 + par.grow * t);
      const fade = p.kind === 'spark' || p.kind === 'scan'
        ? Math.pow(p.life / p.maxLife, 0.7)
        : Math.sin(Math.min(1, (p.life / p.maxLife) * 1.6) * Math.PI * 0.5) *
          Math.min(1, t * 8);

      if (par.additive) {
        this.posArrAdd[nAdd * 3] = p.x;
        this.posArrAdd[nAdd * 3 + 1] = p.y;
        this.posArrAdd[nAdd * 3 + 2] = p.z;
        this.sizeArrAdd[nAdd] = size * fade;
        this.colArrAdd[nAdd * 3] = p.r;
        this.colArrAdd[nAdd * 3 + 1] = p.g;
        this.colArrAdd[nAdd * 3 + 2] = p.b;
        nAdd++;
      } else {
        this.posArr[n * 3] = p.x;
        this.posArr[n * 3 + 1] = p.y;
        this.posArr[n * 3 + 2] = p.z;
        this.sizeArr[n] = size * fade;
        this.colArr[n * 3] = p.r;
        this.colArr[n * 3 + 1] = p.g;
        this.colArr[n * 3 + 2] = p.b;
        n++;
      }
    }
    this.geo.setDrawRange(0, n);
    this.geoAdd.setDrawRange(0, nAdd);
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.aSize.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
    this.geoAdd.attributes.position.needsUpdate = true;
    this.geoAdd.attributes.aSize.needsUpdate = true;
    this.geoAdd.attributes.color.needsUpdate = true;
  }

  setPixelRatio(r: number): void {
    this.mat.uniforms.uPixelRatio.value = r;
    this.matAdd.uniforms.uPixelRatio.value = r;
  }

  clear(): void {
    this.active = 0;
    this.geo.setDrawRange(0, 0);
    this.geoAdd.setDrawRange(0, 0);
  }

  dispose(): void {
    this.geo.dispose();
    this.geoAdd.dispose();
    this.mat.dispose();
    this.matAdd.dispose();
  }
}

function makeParticleGeometry(pos: Float32Array, size: Float32Array, col: Float32Array): BufferGeometry {
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('aSize', new Float32BufferAttribute(size, 1));
  g.setAttribute('color', new Float32BufferAttribute(col, 3));
  g.setDrawRange(0, 0);
  g.boundingSphere = null;
  return g;
}

function makeParticleMaterial(additive: boolean): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uPixelRatio: { value: 1 },
      uFogColor: { value: new Color('#2a7f96') },
      uFogDensity: { value: 0.008 },
    },
    vertexShader: /* glsl */ `
      attribute float aSize;
      varying vec3 vColor;
      varying float vDist;
      void main() {
        vColor = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        vDist = -mv.z;
        gl_PointSize = aSize * 220.0 / max(vDist, 0.6);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uFogColor;
      uniform float uFogDensity;
      varying vec3 vColor;
      varying float vDist;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = dot(c, c);
        if (d > 0.25) discard;
        float soft = smoothstep(0.25, 0.03, d);
        float f = 1.0 - exp(-pow(vDist * uFogDensity, 2.0));
        vec3 col = mix(vColor, uFogColor, f);
        gl_FragColor = vec4(col, soft * (1.0 - f * 0.85));
      }
    `,
    transparent: true,
    depthWrite: false,
    vertexColors: true,
    blending: additive ? AdditiveBlending : NormalBlending,
  });
}

export function updateParticleFog(field: EmitterField, colour: Color, density: number): void {
  const anyField = field as unknown as { mat: ShaderMaterial; matAdd: ShaderMaterial };
  anyField.mat.uniforms.uFogColor.value.copy(colour);
  anyField.mat.uniforms.uFogDensity.value = density;
  anyField.matAdd.uniforms.uFogColor.value.copy(colour);
  anyField.matAdd.uniforms.uFogDensity.value = density;
}
