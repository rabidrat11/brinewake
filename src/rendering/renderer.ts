/**
 * Render pipeline.
 *
 * One WebGL2 context, a small post chain (bloom -> grade -> output) and a set
 * of quality tiers that can be changed at runtime. The renderer knows nothing
 * about the game; the game hands it a scene and a camera.
 */

import {
  ACESFilmicToneMapping,
  Clock,
  Color,
  FogExp2,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector2,
  WebGLRenderer,
  WebGLRenderTarget,
  HalfFloatType,
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { GradeShader } from './gradeShader';

export type QualityTier = 'low' | 'medium' | 'high' | 'ultra';

export interface QualityProfile {
  pixelRatio: number;
  bloom: boolean;
  bloomStrength: number;
  shadows: boolean;
  shadowMapSize: number;
  msaaSamples: number;
  /** Multiplier on view distance and chunk radius. */
  viewScale: number;
  /** Multiplier on instanced scatter density. */
  detailScale: number;
  /** Multiplier on particle counts. */
  particleScale: number;
  godRays: boolean;
}

export const QUALITY: Record<QualityTier, QualityProfile> = {
  low: {
    pixelRatio: 1, bloom: false, bloomStrength: 0, shadows: false, shadowMapSize: 512,
    msaaSamples: 0, viewScale: 0.72, detailScale: 0.45, particleScale: 0.4, godRays: false,
  },
  medium: {
    pixelRatio: 1.25, bloom: true, bloomStrength: 0.22, shadows: false, shadowMapSize: 1024,
    msaaSamples: 0, viewScale: 0.9, detailScale: 0.75, particleScale: 0.75, godRays: true,
  },
  high: {
    pixelRatio: 1.5, bloom: true, bloomStrength: 0.28, shadows: true, shadowMapSize: 2048,
    msaaSamples: 4, viewScale: 1, detailScale: 1, particleScale: 1, godRays: true,
  },
  ultra: {
    pixelRatio: 2, bloom: true, bloomStrength: 0.34, shadows: true, shadowMapSize: 4096,
    msaaSamples: 8, viewScale: 1.25, detailScale: 1.35, particleScale: 1.3, godRays: true,
  },
};

export class RenderSystem {
  readonly renderer: WebGLRenderer;
  readonly scene = new Scene();
  readonly camera: PerspectiveCamera;
  readonly clock = new Clock();
  readonly canvas: HTMLCanvasElement;

  composer!: EffectComposer;
  private renderPass!: RenderPass;
  private bloomPass!: UnrealBloomPass;
  private gradePass!: ShaderPass;
  private outputPass!: OutputPass;
  private target!: WebGLRenderTarget;

  quality: QualityTier = 'high';
  profile: QualityProfile = QUALITY.high;

  /** Frame statistics for the debug overlay. */
  readonly stats = { fps: 0, frameMs: 0, drawCalls: 0, triangles: 0, programs: 0 };
  private fpsAccum = 0;
  private fpsFrames = 0;

  constructor(container: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'bw-canvas';
    container.appendChild(this.canvas);

    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      powerPreference: 'high-performance',
      stencil: false,
      alpha: false,
      failIfMajorPerformanceCaveat: false,
    });
    this.renderer.setClearColor(new Color('#08202c'), 1);
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.84;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate = true;

    this.camera = new PerspectiveCamera(58, 1, 0.12, 5200);
    this.camera.position.set(0, 6, 20);

    this.scene.fog = new FogExp2(0x2a7f96, 0.008);
    this.scene.background = new Color('#2a7f96');

    this.renderer.info.autoReset = false;
    this.buildComposer();
    this.setQuality('high');
    window.addEventListener('resize', this.onResize);
    this.onResize();
  }

  private buildComposer(): void {
    const size = this.renderer.getDrawingBufferSize(new Vector2());
    this.target = new WebGLRenderTarget(Math.max(2, size.x), Math.max(2, size.y), {
      type: HalfFloatType,
      samples: this.profile.msaaSamples,
    });
    this.composer = new EffectComposer(this.renderer, this.target);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    this.bloomPass = new UnrealBloomPass(new Vector2(size.x, size.y), 0.28, 0.6, 0.86);
    this.composer.addPass(this.bloomPass);

    this.gradePass = new ShaderPass(GradeShader);
    this.composer.addPass(this.gradePass);

    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);
  }

  /** Access the grade pass uniforms (depth tint, vignette, flash, etc.). */
  get grade() {
    return this.gradePass.uniforms;
  }

  setQuality(tier: QualityTier): void {
    this.quality = tier;
    this.profile = QUALITY[tier];
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.profile.pixelRatio));
    this.renderer.shadowMap.enabled = this.profile.shadows;
    this.bloomPass.enabled = this.profile.bloom;
    this.bloomPass.strength = this.profile.bloomStrength;
    // Rebuild the MSAA target if the sample count changed.
    if (this.target.samples !== this.profile.msaaSamples) {
      this.target.samples = this.profile.msaaSamples;
      this.target.dispose();
    }
    this.onResize();
  }

  setExposure(v: number): void {
    this.renderer.toneMappingExposure = v;
  }

  setFov(v: number): void {
    this.camera.fov = v;
    this.camera.updateProjectionMatrix();
  }

  private onResize = (): void => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    const dbs = this.renderer.getDrawingBufferSize(new Vector2());
    this.bloomPass.setSize(dbs.x, dbs.y);
  };

  render(dt: number): void {
    const t0 = performance.now();
    this.renderer.info.reset();
    this.composer.render(dt);
    const t1 = performance.now();
    this.stats.frameMs = t1 - t0;
    this.fpsAccum += dt;
    this.fpsFrames++;
    if (this.fpsAccum >= 0.5) {
      this.stats.fps = this.fpsFrames / this.fpsAccum;
      this.fpsAccum = 0;
      this.fpsFrames = 0;
      const info = this.renderer.info;
      this.stats.drawCalls = info.render.calls;
      this.stats.triangles = info.render.triangles;
      this.stats.programs = info.programs?.length ?? 0;
    }
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
    this.composer.dispose();
    this.renderer.dispose();
    this.canvas.remove();
  }
}
