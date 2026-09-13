/**
 * Final colour grade.
 *
 * This pass is doing a surprising amount of the game's mood work: it applies
 * the depth-dependent tint and desaturation, a soft vignette, a very slight
 * chromatic separation at the edges (reads as thick glass), a film grain that
 * hides banding in the dark regions, and the white flashes used by discovery
 * moments and hull impacts.
 */

import { Vector3 } from 'three';

export const GradeShader = {
  name: 'BrinewakeGrade',
  uniforms: {
    tDiffuse: { value: null as unknown },
    uTime: { value: 0 },
    /** 0 surface .. 1 abyss. */
    uDepthT: { value: 0 },
    /** Colour pushed into the shadows. */
    uShadowTint: { value: new Vector3(0.03, 0.10, 0.16) },
    /** Colour pushed into the highlights. */
    uHighlightTint: { value: new Vector3(1.0, 0.98, 0.92) },
    uSaturation: { value: 1.18 },
    uContrast: { value: 1.16 },
    uBrightness: { value: 1.0 },
    uVignette: { value: 0.26 },
    uAberration: { value: 0.0005 },
    uGrain: { value: 0.007 },
    /** Full-screen flash, 0..1, used for discoveries and impacts. */
    uFlash: { value: 0 },
    uFlashColor: { value: new Vector3(1, 1, 1) },
    /** Damage state: pushes the image red and warps the edges. */
    uDamage: { value: 0 },
    /** Pressure creak wobble. */
    uWobble: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uDepthT;
    uniform vec3 uShadowTint;
    uniform vec3 uHighlightTint;
    uniform float uSaturation;
    uniform float uContrast;
    uniform float uBrightness;
    uniform float uVignette;
    uniform float uAberration;
    uniform float uGrain;
    uniform float uFlash;
    uniform vec3 uFlashColor;
    uniform float uDamage;
    uniform float uWobble;
    varying vec2 vUv;

    float hash12(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    void main() {
      vec2 uv = vUv;
      vec2 centred = uv - 0.5;
      float r2 = dot(centred, centred);

      // Pressure wobble: a slow lens breathing that makes deep water feel heavy.
      if (uWobble > 0.001) {
        float w = sin(uTime * 1.7 + uv.y * 9.0) * 0.0012 + sin(uTime * 2.3 + uv.x * 7.0) * 0.0009;
        uv += w * uWobble;
      }

      // Chromatic separation grows toward the edges — thick viewport glass.
      float ab = uAberration * (1.0 + uDamage * 3.0);
      vec3 col;
      col.r = texture2D(tDiffuse, uv + centred * ab).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - centred * ab).b;

      // Split tone: cool shadows, warm highlights. Depth pushes it colder.
      float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
      vec3 shadowTint = mix(uShadowTint, uShadowTint * vec3(0.5, 0.8, 1.4), uDepthT);
      col = mix(col + shadowTint * (1.0 - lum) * 0.55,
                col * mix(vec3(1.0), uHighlightTint, 0.5),
                smoothstep(0.35, 0.95, lum));

      // Saturation, contrast, brightness.
      float sat = uSaturation * mix(1.0, 0.78, uDepthT);
      col = mix(vec3(lum), col, sat);
      col = (col - 0.5) * uContrast + 0.5;
      col *= uBrightness;

      // Vignette, slightly stronger with depth.
      float vig = 1.0 - uVignette * (1.0 + uDepthT * 0.6) * r2 * 2.2;
      col *= clamp(vig, 0.0, 1.0);

      // Damage: red pulse from the edges inward.
      if (uDamage > 0.001) {
        float edge = smoothstep(0.06, 0.34, r2);
        float pulse = 0.65 + 0.35 * sin(uTime * 6.0);
        col = mix(col, vec3(0.62, 0.06, 0.06), edge * uDamage * pulse * 0.7);
      }

      // Grain — essential in the abyss where there is almost no signal.
      float g = hash12(gl_FragCoord.xy + fract(uTime) * 91.7) - 0.5;
      col += g * uGrain * (0.5 + uDepthT);

      // Discovery flash.
      col = mix(col, uFlashColor, clamp(uFlash, 0.0, 1.0));

      gl_FragColor = vec4(max(col, 0.0), 1.0);
    }
  `,
};
