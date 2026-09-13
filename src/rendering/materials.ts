/**
 * Shared materials.
 *
 * Brinewake renders with a small number of material *programs* and a lot of
 * vertex data. That is the whole trick behind the frame rate: hundreds of
 * creatures, thousands of rocks and a full harbour town all draw through five
 * or six shader variants.
 *
 * Every material extends three's Lambert lighting (cheap, per-fragment, and
 * flattering to faceted geometry) with:
 *   - an `aEmissive` vertex channel for bioluminescence and lamps
 *   - shared water uniforms (time, caustics, depth tint, murk)
 *   - optional vertex animation for creatures and vegetation
 */

import {
  Color,
  MeshBasicMaterial,
  MeshLambertMaterial,
  type Material,
  type WebGLProgramParametersWithUniforms,
  Vector3,
  AdditiveBlending,
  DoubleSide,
  NormalBlending,
  type Texture,
} from 'three';

/** Uniforms shared by every world material; updated once per frame. */
export const waterUniforms = {
  uTime: { value: 0 },
  /** Strength of the caustic impression on upward-facing surfaces. */
  uCaustic: { value: 0.55 },
  /** Direction light travels (i.e. downward-ish). */
  uSunDir: { value: new Vector3(0.35, -1, 0.2).normalize() },
  /** Ambient water tint blended into shaded surfaces with distance. */
  uWaterTint: { value: new Color('#2a7f96') },
  /** 0 at the surface, 1 in the abyss — drives desaturation and murk. */
  uDepthT: { value: 0 },
  /** World Y of the sea surface. */
  uSurfaceY: { value: 0 },
  /** Global sway strength for vegetation (currents, sub wash). */
  uCurrent: { value: new Vector3(0.4, 0, 0.1) },
  /** Position of the submarine, for local push effects on foliage. */
  uSubPos: { value: new Vector3() },
  /** Submarine wash radius. */
  uSubWash: { value: 6 },
  /** Global multiplier on emissive channels (used for the "lights out" fade). */
  uEmissiveBoost: { value: 1 },
};

const COMMON_PARS = /* glsl */ `
  uniform float uTime;
  uniform float uCaustic;
  uniform vec3 uSunDir;
  uniform vec3 uWaterTint;
  uniform float uDepthT;
  uniform float uSurfaceY;
  uniform float uEmissiveBoost;
  varying float vEmissiveV;
  varying vec3 vWorldPosV;
`;

/**
 * A cheap three-lobe caustic impression. Real caustics need a light-transport
 * pass we cannot afford; this reads convincingly on sand at 20 m and costs
 * about a dozen ALU ops.
 */
const CAUSTIC_FN = /* glsl */ `
  float bwCaustic(vec2 p, float t) {
    vec2 i = p;
    float c = 0.0;
    float inten = 0.0045;
    for (int n = 0; n < 3; n++) {
      float tt = t * (1.0 - (3.0 / float(n + 1)));
      i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
      c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
    }
    c /= 3.0;
    c = 1.17 - pow(c, 1.4);
    return clamp(pow(abs(c), 8.0), 0.0, 1.0);
  }
`;

interface SurfaceOpts {
  /** Apply the caustic impression to upward-facing surfaces. */
  caustics?: boolean;
  /** Blend the ambient water tint into the surface with depth. */
  waterBlend?: number;
  /** Emissive multiplier baked into this material. */
  emissiveScale?: number;
  transparent?: boolean;
  opacity?: number;
  side?: typeof DoubleSide | undefined;
  flatShading?: boolean;
  map?: Texture | null;
  name?: string;
  /** Faint vertical gradient that fakes ambient occlusion in crevices. */
  ao?: boolean;
  /**
   * A constant fraction of the surface's own colour added to the result.
   * The submarine uses this so it never becomes an unreadable silhouette
   * when the sun is behind it or when there is no sun at all.
   */
  ambientFloor?: number;
}

/**
 * The standard opaque world surface: terrain, rocks, wrecks, props, buildings.
 */
export function createSurfaceMaterial(opts: SurfaceOpts = {}): MeshLambertMaterial {
  const mat = new MeshLambertMaterial({
    vertexColors: true,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    ...(opts.side ? { side: opts.side } : {}),
    flatShading: false,
    map: opts.map ?? null,
    name: opts.name ?? 'surface',
    emissive: new Color(0x000000),
  });
  const caustics = opts.caustics ?? false;
  const waterBlend = opts.waterBlend ?? 0.35;
  const emissiveScale = opts.emissiveScale ?? 1;

  mat.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    Object.assign(shader.uniforms, waterUniforms);
    shader.uniforms.uWaterBlend = { value: waterBlend };
    shader.uniforms.uEmissiveScale = { value: emissiveScale };
    shader.uniforms.uAmbientFloor = { value: opts.ambientFloor ?? 0 };

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nattribute float aEmissive;\n${COMMON_PARS}`)
      .replace(
        '#include <fog_vertex>',
        `#include <fog_vertex>
         vEmissiveV = aEmissive;
         vWorldPosV = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>\n${COMMON_PARS}\nuniform float uWaterBlend;\nuniform float uEmissiveScale;\nuniform float uAmbientFloor;\n${caustics ? CAUSTIC_FN : ''}`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
         totalEmissiveRadiance += diffuseColor.rgb * vEmissiveV * uEmissiveScale * uEmissiveBoost * 1.6;
         totalEmissiveRadiance += diffuseColor.rgb * uAmbientFloor;`,
      )
      .replace(
        '#include <dithering_fragment>',
        `${caustics ? `
         {
           float up = clamp(vNormal.y * 0.5 + 0.5, 0.0, 1.0);
           float shallow = clamp(1.0 - (uSurfaceY - vWorldPosV.y) / 90.0, 0.0, 1.0);
           float amt = uCaustic * up * up * shallow * shallow;
           if (amt > 0.002) {
             float c = bwCaustic(vWorldPosV.xz * 0.11, uTime * 0.35);
             gl_FragColor.rgb += vec3(0.42, 0.78, 0.72) * c * amt * 0.5 * (1.0 - min(1.0, dot(gl_FragColor.rgb, vec3(0.4))));
           }
         }` : ''}
         {
           float d = clamp(length(vWorldPosV - cameraPosition) / 140.0, 0.0, 1.0);
           gl_FragColor.rgb = mix(gl_FragColor.rgb, uWaterTint, d * uWaterBlend * (0.4 + 0.6 * uDepthT));
         }
         #include <dithering_fragment>`,
      );
  };
  mat.customProgramCacheKey = () =>
    `bw-surface-${caustics ? 1 : 0}-${waterBlend.toFixed(2)}-${emissiveScale.toFixed(2)}-${(opts.ambientFloor ?? 0).toFixed(2)}`;
  return mat;
}

/**
 * Creature material. All swimming animation happens on the GPU, driven by
 * per-instance attributes, which is why a shoal of 200 fish costs one draw
 * call and almost no CPU.
 *
 * Per-vertex   : aEmissive, aBodyNorm (-1 tail .. +1 head), aFlex
 * Per-instance : aPhase, aSpeed, aAnimMode, aHue, aGlow
 */
export function createCreatureMaterial(opts: { instanced?: boolean; side?: typeof DoubleSide } = {}) {
  const instanced = opts.instanced ?? true;
  const mat = new MeshLambertMaterial({
    vertexColors: true,
    ...(opts.side ? { side: opts.side } : {}),
    name: instanced ? 'creature-inst' : 'creature',
  });

  mat.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    Object.assign(shader.uniforms, waterUniforms);

    const attrDecl = instanced
      ? `attribute float aPhase;
         attribute float aSpeed;
         attribute float aAnimMode;
         attribute float aHue;
         attribute float aGlow;`
      : `uniform float aPhase;
         uniform float aSpeed;
         uniform float aAnimMode;
         uniform float aHue;
         uniform float aGlow;`;

    if (!instanced) {
      shader.uniforms.aPhase = { value: 0 };
      shader.uniforms.aSpeed = { value: 1 };
      shader.uniforms.aAnimMode = { value: 0 };
      shader.uniforms.aHue = { value: 0 };
      shader.uniforms.aGlow = { value: 1 };
    }

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         attribute float aEmissive;
         attribute float aBodyNorm;
         attribute float aFlex;
         ${attrDecl}
         ${COMMON_PARS}
         varying float vHueV;
         varying float vGlowV;

         vec3 bwAnimate(vec3 p, float mode, float t, float bn, float flex) {
           // 0 swim: travelling wave down the body, strongest at the tail
           if (mode < 0.5) {
             float amp = pow(clamp((1.0 - bn) * 0.5, 0.0, 1.0), 1.7) * flex;
             float w = sin(t * 2.4 - bn * 2.6);
             p.x += w * amp * 0.28;
             p.y += sin(t * 1.1 + bn) * 0.012 * flex;
           }
           // 1 pulse: jellyfish bell contraction
           else if (mode < 1.5) {
             float s = sin(t * 1.6);
             float k = s * 0.5 + 0.5;
             float squash = mix(1.0, 0.74, pow(k, 2.0));
             float widen = mix(1.0, 1.16, pow(k, 2.0));
             float bell = clamp(bn * 0.5 + 0.5, 0.0, 1.0);
             p.y *= mix(1.0, squash, bell);
             p.x *= mix(1.0, widen, bell);
             p.z *= mix(1.0, widen, bell);
             float tent = clamp(-bn, 0.0, 1.0);
             p.x += sin(t * 1.4 + p.z * 3.0) * 0.05 * tent * flex;
             p.z += cos(t * 1.2 + p.x * 3.0) * 0.05 * tent * flex;
           }
           // 2 undulate: eels, ribbon fish — full-body sine
           else if (mode < 2.5) {
             float w = sin(t * 2.0 - bn * 5.2);
             p.x += w * 0.30 * flex;
             p.y += cos(t * 1.7 - bn * 4.0) * 0.05 * flex;
           }
           // 3 flap: rays and mantas — wings beat in Y
           else if (mode < 3.5) {
             float wing = clamp(abs(p.x) * 2.0, 0.0, 1.0);
             p.y += sin(t * 1.5 - wing * 1.6) * wing * wing * 0.42 * flex;
             p.z += sin(t * 1.5 - wing * 1.6) * wing * 0.05 * flex;
           }
           // 4 drift: slow rotation and breathing, for plankton and siphonophores
           else if (mode < 4.5) {
             float s = sin(t * 0.7 + bn * 1.5);
             p *= 1.0 + s * 0.05 * flex;
             p.x += sin(t * 0.4) * 0.05 * flex;
           }
           // 5 scuttle: crustacean legs, tiny vertical bob
           else if (mode < 5.5) {
             float legs = clamp(-p.y * 3.0, 0.0, 1.0) * flex;
             p.x += sin(t * 5.0 + p.z * 6.0) * 0.05 * legs;
             p.y += abs(sin(t * 5.0 + p.z * 6.0)) * 0.04 * legs;
           }
           // 6 jet: cephalopod mantle contraction and arm trailing
           else if (mode < 6.5) {
             float k = pow(max(0.0, sin(t * 1.2)), 3.0);
             float mantle = clamp(bn, 0.0, 1.0);
             p.x *= mix(1.0, 0.82, k * mantle);
             p.y *= mix(1.0, 0.82, k * mantle);
             float arms = clamp(-bn, 0.0, 1.0) * flex;
             p.x += sin(t * 2.0 + p.z * 4.0 + p.y * 3.0) * 0.09 * arms;
             p.y += cos(t * 1.8 + p.z * 4.0) * 0.07 * arms;
           }
           // 7 static: anemones, corals, sessile life — gentle sway only
           else {
             float sway = clamp(bn * 0.5 + 0.5, 0.0, 1.0) * flex;
             p.x += sin(t * 0.8 + p.y * 2.0) * 0.07 * sway;
             p.z += cos(t * 0.7 + p.y * 2.0) * 0.05 * sway;
           }
           return p;
         }`,
      )
      .replace(
        '#include <begin_vertex>',
        `vec3 transformed = bwAnimate(position, aAnimMode, uTime * aSpeed + aPhase, aBodyNorm, aFlex);`,
      )
      .replace(
        '#include <fog_vertex>',
        `#include <fog_vertex>
         vEmissiveV = aEmissive;
         vHueV = aHue;
         vGlowV = aGlow;
         vWorldPosV = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         ${COMMON_PARS}
         varying float vHueV;
         varying float vGlowV;
         vec3 bwHueShift(vec3 c, float h) {
           const vec3 k = vec3(0.57735);
           float ca = cos(h * 6.28318);
           return c * ca + cross(k, c) * sin(h * 6.28318) + k * dot(k, c) * (1.0 - ca);
         }`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
         if (abs(vHueV) > 0.001) diffuseColor.rgb = clamp(bwHueShift(diffuseColor.rgb, vHueV), 0.0, 1.0);`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
         totalEmissiveRadiance += diffuseColor.rgb * vEmissiveV * vGlowV * uEmissiveBoost * 2.2;`,
      )
      .replace(
        '#include <dithering_fragment>',
        `{
           float d = clamp(length(vWorldPosV - cameraPosition) / 120.0, 0.0, 1.0);
           gl_FragColor.rgb = mix(gl_FragColor.rgb, uWaterTint, d * 0.28 * (0.3 + 0.7 * uDepthT));
         }
         #include <dithering_fragment>`,
      );
  };
  mat.customProgramCacheKey = () => `bw-creature-${instanced ? 'i' : 's'}`;
  return mat;
}

/**
 * Vegetation: kelp, seagrass, soft corals, anemones. Sways with the current
 * and bends away from the submarine, which is one of those tiny touches that
 * makes the world feel physical.
 *
 * Per-vertex: aEmissive, aSway (0 = rooted, 1 = free tip)
 */
export function createFoliageMaterial(opts: { doubleSide?: boolean; stiffness?: number } = {}) {
  const mat = new MeshLambertMaterial({
    vertexColors: true,
    side: opts.doubleSide === false ? undefined : DoubleSide,
    name: 'foliage',
  });
  const stiffness = opts.stiffness ?? 1;
  mat.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
    Object.assign(shader.uniforms, waterUniforms);
    shader.uniforms.uStiffness = { value: stiffness };
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         attribute float aEmissive;
         attribute float aSway;
         uniform vec3 uCurrent;
         uniform vec3 uSubPos;
         uniform float uSubWash;
         uniform float uStiffness;
         ${COMMON_PARS}`,
      )
      .replace(
        '#include <begin_vertex>',
        `vec3 transformed = position;
         {
           vec3 wp = (modelMatrix * vec4(position, 1.0)).xyz;
           float s = aSway / max(uStiffness, 0.001);
           float phase = wp.x * 0.16 + wp.z * 0.13;
           float w = sin(uTime * 0.9 + phase) * 0.6 + sin(uTime * 1.7 + phase * 2.3) * 0.4;
           transformed.x += (uCurrent.x * 0.9 + w * 0.55) * s;
           transformed.z += (uCurrent.z * 0.9 + cos(uTime * 0.8 + phase) * 0.45) * s;
           transformed.y -= (abs(w) * 0.10) * s;
           vec3 d = wp - uSubPos;
           float dist = length(d);
           if (dist < uSubWash) {
             float push = (1.0 - dist / uSubWash);
             push *= push;
             transformed += normalize(d + vec3(0.001, 0.0, 0.0)) * push * s * 1.35;
           }
         }`,
      )
      .replace(
        '#include <fog_vertex>',
        `#include <fog_vertex>
         vEmissiveV = aEmissive;
         vWorldPosV = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${COMMON_PARS}`)
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
         totalEmissiveRadiance += diffuseColor.rgb * vEmissiveV * uEmissiveBoost * 2.0;`,
      )
      .replace(
        '#include <dithering_fragment>',
        `{
           float d = clamp(length(vWorldPosV - cameraPosition) / 110.0, 0.0, 1.0);
           gl_FragColor.rgb = mix(gl_FragColor.rgb, uWaterTint, d * 0.4 * (0.3 + 0.7 * uDepthT));
         }
         #include <dithering_fragment>`,
      );
  };
  mat.customProgramCacheKey = () => `bw-foliage-${stiffness.toFixed(2)}`;
  return mat;
}

/** Unlit additive glow — light halos, bioluminescent motes, sonar rings. */
export function createGlowMaterial(opts: { depthWrite?: boolean; opacity?: number } = {}) {
  return new MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: opts.depthWrite ?? false,
    opacity: opts.opacity ?? 1,
    fog: true,
    side: DoubleSide,
    name: 'glow',
  });
}

/** Flat unlit surface for UI-in-world elements, holograms and map planes. */
export function createUnlitMaterial(opts: { transparent?: boolean; opacity?: number } = {}) {
  return new MeshBasicMaterial({
    vertexColors: true,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    blending: NormalBlending,
    name: 'unlit',
  });
}

/** Advance the shared clock; call once per frame before rendering. */
export function updateWaterUniforms(dt: number): void {
  waterUniforms.uTime.value += dt;
}

/** Free GPU resources for a material or list of them. */
export function disposeMaterials(mats: Material | Material[] | null | undefined): void {
  if (!mats) return;
  if (Array.isArray(mats)) mats.forEach((m) => m.dispose());
  else mats.dispose();
}
