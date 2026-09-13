/**
 * Atmosphere: light, fog, the sea surface seen from below, and sun shafts.
 *
 * This module is responsible for most of what people will actually remember
 * about the game's look. It owns:
 *   - a hemisphere ambient tuned per region
 *   - a directional "sun" that tracks the day/night cycle and casts shadows
 *     only where they read (above ~180 m)
 *   - the underside of the sea surface, including Snell's window
 *   - volumetric-looking light shafts that follow the camera
 */

import {
  AdditiveBlending,
  BackSide,
  BufferGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  FogExp2,
  HemisphereLight,
  Mesh,
  Object3D,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from 'three';
import type { EnvSample } from '../world/environment';
import { sunDirection } from '../world/environment';
import { clamp01, damp, lerp, smoothstep } from '../core/math';
import { waterUniforms } from './materials';

const SURFACE_SIZE = 2600;
const WHITE = new Color(1, 1, 1);
const SAND_BOUNCE = new Color('#d8bd8a');
const SKY_DAY = new Color('#8fc4de');
const SKY_NIGHT = new Color('#141e33');
const HAZE_DAY = new Color('#cfe0e6');
const HAZE_NIGHT = new Color('#1c2740');
const _sky = new Color();
const _haze = new Color();
const _target = new Color();
const _sunAir = new Color('#fff4e0');

export class Atmosphere {
  readonly ambient: HemisphereLight;
  readonly sun: DirectionalLight;
  readonly surface: Mesh;
  readonly shafts: Mesh;
  readonly voidShell: Mesh;
  readonly root = new Object3D();

  private surfaceMat: ShaderMaterial;
  private shaftMat: ShaderMaterial;
  private voidMat: ShaderMaterial;
  private scene: Scene;
  private sunDir = { x: 0.3, y: -1, z: 0.2 };
  private fog: FogExp2;
  private smoothedFog = 0.008;
  private shadowsEnabled = true;
  /** Debug/accessibility multipliers on the two light sources. */
  sunScale = 1;
  ambientScale = 1;
  /** True while the camera is out of the water. */
  above = false;
  private aboveMix = 0;

  constructor(scene: Scene) {
    this.scene = scene;
    this.fog = scene.fog as FogExp2;

    this.ambient = new HemisphereLight(0x8fd8d2, 0x123340, 0.8);
    scene.add(this.ambient);

    this.sun = new DirectionalLight(0xfff2cf, 1.2);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 420;
    this.sun.shadow.camera.left = -110;
    this.sun.shadow.camera.right = 110;
    this.sun.shadow.camera.top = 110;
    this.sun.shadow.camera.bottom = -110;
    this.sun.shadow.bias = -0.0012;
    this.sun.shadow.normalBias = 0.5;
    scene.add(this.sun);
    scene.add(this.sun.target);

    this.surfaceMat = makeSurfaceMaterial();
    this.surface = new Mesh(new PlaneGeometry(SURFACE_SIZE, SURFACE_SIZE, 48, 48), this.surfaceMat);
    this.surface.rotation.x = Math.PI / 2; // face downward, seen from below
    this.surfaceMat.side = DoubleSide;
    this.surface.renderOrder = -5;
    this.surface.frustumCulled = false;
    this.root.add(this.surface);

    this.shaftMat = makeShaftMaterial();
    this.shafts = new Mesh(buildShaftGeometry(), this.shaftMat);
    this.shafts.frustumCulled = false;
    this.shafts.renderOrder = 8;
    this.root.add(this.shafts);

    this.voidMat = makeVoidMaterial();
    this.voidShell = new Mesh(new SphereGeometry(2400, 24, 16), this.voidMat);
    this.voidShell.frustumCulled = false;
    this.voidShell.renderOrder = -10;
    this.root.add(this.voidShell);

    scene.add(this.root);
  }

  setShadows(on: boolean, mapSize: number): void {
    this.shadowsEnabled = on;
    this.sun.castShadow = on;
    if (this.sun.shadow.mapSize.x !== mapSize) {
      this.sun.shadow.mapSize.set(mapSize, mapSize);
      this.sun.shadow.map?.dispose();
      this.sun.shadow.map = null as never;
    }
  }

  setGodRays(on: boolean): void {
    this.shafts.visible = on;
  }

  /**
   * @param cam    camera world position
   * @param env    blended environment at the camera
   * @param tod    time of day, 0..1
   * @param dt     frame time
   */
  update(cam: Vector3, env: EnvSample, tod: number, dt: number): void {
    const depth = Math.max(0, -cam.y);
    // Crossing the surface is a blend rather than a switch, so breaking through
    // reads as a transition instead of a cut.
    this.above = cam.y > 0.2;
    this.aboveMix = damp(this.aboveMix, this.above ? 1 : 0, 5, dt);
    const A = this.aboveMix;

    // Fog and background follow the blended water colour, eased so region
    // transitions feel like swimming rather than switching.
    // Above water the horizon haze is a pale sky, not the water colour.
    const solar0 = clamp01(env.daylight * 1.6);
    _sky.copy(SKY_DAY).lerp(SKY_NIGHT, 1 - solar0);
    _haze.copy(HAZE_DAY).lerp(HAZE_NIGHT, 1 - solar0);
    _target.copy(env.water).lerp(_haze, A);
    const fogCol = this.fog.color;
    fogCol.lerp(_target, 1 - Math.exp(-2.6 * dt));
    this.smoothedFog = damp(this.smoothedFog, lerp(env.fogDensity, 0.00055, A), 2.4, dt);
    this.fog.density = this.smoothedFog;
    _target.copy(env.void).lerp(_sky, A);
    (this.scene.background as Color).lerp(_target, 1 - Math.exp(-2.6 * dt));

    waterUniforms.uWaterTint.value.copy(env.water).lerp(_haze, A);
    waterUniforms.uDepthT.value = env.depthT;
    waterUniforms.uCaustic.value = clamp01(env.daylight * 1.4) * smoothstep(140, 8, depth);
    waterUniforms.uCurrent.value.set(env.current[0], env.current[1], env.current[2]);

    // Lighting.
    sunDirection(tod, this.sunDir);
    waterUniforms.uSunDir.value.set(this.sunDir.x, this.sunDir.y, this.sunDir.z);

    // In air the sun is not attenuated by two hundred metres of water.
    const sunStrength = lerp(env.daylight, solar0, A);
    this.sun.color.copy(env.sun).lerp(_sunAir, A * 0.8);
    this.sun.intensity = lerp(0.03, 2.9, sunStrength) * this.sunScale * lerp(1, 1.35, A);
    this.sun.position.set(
      cam.x - this.sunDir.x * 140,
      Math.max(cam.y + 60, cam.y - this.sunDir.y * 140),
      cam.z - this.sunDir.z * 140,
    );
    this.sun.target.position.set(cam.x, cam.y, cam.z);
    this.sun.target.updateMatrixWorld();
    // Shadows only where there is enough light for them to mean anything.
    this.sun.castShadow = this.shadowsEnabled && (this.above || depth < 260) && sunStrength > 0.1;

    // Sky ambient is desaturated toward white so it colours the scene without
    // repainting every surface teal; the ground term carries the warm bounce
    // off the sediment, which is what keeps shallow sand looking like sand.
    this.ambient.color.copy(env.ambient).lerp(WHITE, 0.34).lerp(_sky, A * 0.75);
    this.ambient.groundColor.copy(env.void).lerp(SAND_BOUNCE, 0.55 * (1 - env.depthT))
      .multiplyScalar(lerp(0.35, 0.75, clamp01(env.daylight)));
    this.ambient.intensity = lerp(0.26, 0.52, clamp01(sunStrength * 0.85 + 0.12))
      * this.ambientScale * lerp(1, 1.5, A);

    // Sea surface: only worth drawing when it is anywhere near visible.
    const surfaceVisible = this.above ? cam.y < 220 : depth < 260;
    this.surface.visible = surfaceVisible;
    if (surfaceVisible) {
      this.surface.position.set(cam.x, 0, cam.z);
      const u = this.surfaceMat.uniforms;
      u.uTime.value = waterUniforms.uTime.value;
      u.uSunDir.value.set(this.sunDir.x, this.sunDir.y, this.sunDir.z);
      u.uDaylight.value = sunStrength;
      u.uWaterColor.value.copy(env.water);
      u.uDepth.value = depth;
      u.uCamY.value = cam.y;
      u.uAbove.value = A;
      u.uSky.value.copy(_sky);
    }

    // Light shafts.
    if (this.shafts.visible) {
      const shaftStrength = clamp01(env.daylight * 1.2) * smoothstep(320, 24, depth) * (1 - A);
      this.shafts.visible = shaftStrength > 0.015;
      if (this.shafts.visible) {
        this.shafts.position.set(cam.x, 0, cam.z);
        const u = this.shaftMat.uniforms;
        u.uTime.value = waterUniforms.uTime.value;
        u.uStrength.value = shaftStrength;
        u.uColor.value.copy(env.sun).lerp(env.water, 0.35);
        u.uSunDir.value.set(this.sunDir.x, this.sunDir.y, this.sunDir.z);
      }
    }

    // The void shell gives the deep a gradient rather than a flat clear colour.
    this.voidShell.position.copy(cam);
    const vu = this.voidMat.uniforms;
    vu.uTop.value.copy(env.water).multiplyScalar(lerp(1.15, 0.5, env.depthT)).lerp(_sky, A);
    vu.uBottom.value.copy(env.void).multiplyScalar(0.55).lerp(_haze, A);
    vu.uCamY.value = cam.y;
  }

  dispose(): void {
    this.surface.geometry.dispose();
    this.surfaceMat.dispose();
    this.shafts.geometry.dispose();
    this.shaftMat.dispose();
    this.voidShell.geometry.dispose();
    this.voidMat.dispose();
  }
}

// --- sea surface -------------------------------------------------------

function makeSurfaceMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    fog: false,
    uniforms: {
      uTime: { value: 0 },
      uSunDir: { value: new Vector3(0, -1, 0) },
      uDaylight: { value: 1 },
      uWaterColor: { value: new Color('#3fa8b4') },
      uDepth: { value: 0 },
      uCamY: { value: -5 },
      uAbove: { value: 0 },
      uSky: { value: new Color('#8fc4de') },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec2 vUv;
      varying vec3 vWorld;
      void main() {
        vUv = uv;
        vec3 p = position;
        // Gentle swell so the ceiling of the world is never a flat plane.
        float w = sin(p.x * 0.018 + uTime * 0.7) * 0.55
                + sin(p.y * 0.023 - uTime * 0.53) * 0.42
                + sin((p.x + p.y) * 0.011 + uTime * 0.31) * 0.7;
        p.z += w;
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uSunDir;
      uniform float uDaylight;
      uniform vec3 uWaterColor;
      uniform float uCamY;
      uniform float uAbove;
      uniform vec3 uSky;
      varying vec2 vUv;
      varying vec3 vWorld;

      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vnoise(vec2 p){
        vec2 i = floor(p), f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1,0)), u.x),
                   mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
      }

      void main() {
        vec3 viewDir = normalize(vWorld - cameraPosition);
        // Snell's window: from below, the whole sky is squeezed into a 97 degree
        // cone. Outside it the surface mirrors the dark water.
        float upness = clamp(viewDir.y, 0.0, 1.0);
        float window = smoothstep(0.62, 0.94, upness);

        // Rippled shimmer.
        vec2 rp = vWorld.xz * 0.06;
        float n = vnoise(rp + uTime * 0.16) * 0.6 + vnoise(rp * 2.7 - uTime * 0.22) * 0.4;
        float ripple = pow(n, 2.2);

        // Sun glitter inside the window.
        vec3 toSun = -normalize(uSunDir);
        float sunAlign = pow(clamp(dot(viewDir, toSun), 0.0, 1.0), 24.0);

        vec3 skyCol = mix(vec3(0.36, 0.66, 0.78), vec3(0.86, 0.94, 0.98), upness);
        skyCol = mix(uWaterColor * 0.6, skyCol, uDaylight);
        // Outside the window the surface behaves as a mirror of the lit water
        // beneath it, so it is slightly brighter than the fog, never darker.
        vec3 mirrorCol = uWaterColor * (1.05 + ripple * 0.5);
        vec3 col = mix(mirrorCol, skyCol, window);
        col += vec3(1.0, 0.96, 0.86) * (ripple * 0.3 + sunAlign * 1.6) * window * uDaylight;

        // Fade with distance so the plane edge is never visible.
        float dist = length(vWorld.xz - cameraPosition.xz);
        float a = (0.08 + window * 0.85) * smoothstep(1250.0, 240.0, dist);
        a *= smoothstep(300.0, 40.0, -uCamY);

        // Seen from above, the sea is an opaque sheet: dark water near the
        // shore, sky reflected toward the horizon, and glitter under the sun.
        if (uAbove > 0.001) {
          float grazing = 1.0 - clamp(-viewDir.y, 0.0, 1.0);
          vec3 deep = uWaterColor * 0.42;
          vec3 aboveCol = mix(deep, uSky, pow(grazing, 2.6));
          aboveCol += vec3(1.0, 0.97, 0.9) * pow(clamp(dot(reflect(viewDir, vec3(0.0,1.0,0.0)), toSun), 0.0, 1.0), 90.0) * 1.4 * uDaylight;
          aboveCol += uSky * ripple * 0.16;
          col = mix(col, aboveCol, uAbove);
          a = mix(a, smoothstep(4000.0, 300.0, dist), uAbove);
        }
        gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
      }
    `,
  });
}

// --- light shafts ------------------------------------------------------

/**
 * A ring of tall, thin, softly-faded quads. Cheap, and with additive blending
 * and a good falloff curve it reads as genuinely volumetric.
 */
function buildShaftGeometry(): BufferGeometry {
  const geo = new BufferGeometry();
  const pos: number[] = [];
  const uv: number[] = [];
  const seed: number[] = [];
  const COUNT = 22;
  for (let i = 0; i < COUNT; i++) {
    const a = (i / COUNT) * Math.PI * 2 + (i % 3) * 0.41;
    const r = 26 + (i % 5) * 21 + ((i * 37) % 11) * 5;
    const w = 9 + ((i * 13) % 9) * 3.4;
    const h = 260;
    const cx = Math.cos(a) * r;
    const cz = Math.sin(a) * r;
    // Two crossed quads per shaft so it reads from any angle.
    for (let k = 0; k < 2; k++) {
      const ang = a + k * Math.PI * 0.5;
      const dx = Math.cos(ang) * w;
      const dz = Math.sin(ang) * w;
      const quad = [
        [cx - dx, 2, cz - dz, 0, 0],
        [cx + dx, 2, cz + dz, 1, 0],
        [cx + dx, -h, cz + dz, 1, 1],
        [cx - dx, 2, cz - dz, 0, 0],
        [cx + dx, -h, cz + dz, 1, 1],
        [cx - dx, -h, cz - dz, 0, 1],
      ];
      for (const q of quad) {
        pos.push(q[0], q[1], q[2]);
        uv.push(q[3], q[4]);
        seed.push(i * 0.618 + k * 0.31);
      }
    }
  }
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  geo.setAttribute('aSeed', new Float32BufferAttribute(seed, 1));
  return geo;
}

function makeShaftMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    fog: false,
    uniforms: {
      uTime: { value: 0 },
      uStrength: { value: 1 },
      uColor: { value: new Color('#cfeeff') },
      uSunDir: { value: new Vector3(0, -1, 0) },
    },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uTime;
      uniform vec3 uSunDir;
      varying vec2 vUv;
      varying float vSeed;
      varying vec3 vWorld;
      void main() {
        vUv = uv;
        vSeed = aSeed;
        vec3 p = position;
        // Lean the shafts along the sun direction and drift them slowly.
        float depthT = -p.y / 260.0;
        p.x += uSunDir.x * depthT * 150.0 + sin(uTime * 0.25 + aSeed * 6.0) * depthT * 8.0;
        p.z += uSunDir.z * depthT * 150.0 + cos(uTime * 0.21 + aSeed * 5.0) * depthT * 8.0;
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uStrength;
      uniform vec3 uColor;
      varying vec2 vUv;
      varying float vSeed;
      varying vec3 vWorld;
      void main() {
        // Soft horizontally, fading with depth.
        float across = 1.0 - abs(vUv.x * 2.0 - 1.0);
        across = pow(across, 2.6);
        float down = pow(1.0 - vUv.y, 1.5);
        float flicker = 0.7 + 0.3 * sin(uTime * 0.8 + vSeed * 12.0 + vUv.y * 3.0);
        // Fade shafts that are very close to the camera to avoid a wall of white.
        float d = length(vWorld - cameraPosition);
        float near = smoothstep(3.0, 30.0, d);
        float far = smoothstep(340.0, 90.0, d);
        float a = across * down * flicker * uStrength * 0.055 * near * far;
        gl_FragColor = vec4(uColor, clamp(a, 0.0, 1.0));
      }
    `,
  });
}

function makeVoidMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    side: BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uTop: { value: new Color('#2a7f96') },
      uBottom: { value: new Color('#04070f') },
      uCamY: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vLocal;
      void main() {
        vLocal = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop;
      uniform vec3 uBottom;
      varying vec3 vLocal;
      void main() {
        float t = clamp(vLocal.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 col = mix(uBottom, uTop, pow(t, 1.35));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}
