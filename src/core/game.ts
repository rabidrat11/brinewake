/**
 * The game shell.
 *
 * Owns the systems, drives the fixed-step simulation and the variable-step
 * render, and mediates between them. Deliberately not a god object: it wires
 * systems together and does almost nothing itself.
 */

import { Color, Vector3 } from 'three';
import { RenderSystem, type QualityTier } from '../rendering/renderer';
import { Atmosphere } from '../rendering/atmosphere';
import {
  createCreatureMaterial, createFoliageMaterial, createSurfaceMaterial,
  updateWaterUniforms, waterUniforms,
} from '../rendering/materials';
import { CameraRig } from '../rendering/cameraRig';
import { EmitterField, GlowMotes, MarineSnow, updateParticleFog } from '../rendering/particles';
import { TerrainField } from '../world/terrain';
import { Harbour, BERTH } from '../world/harbour';
import { ChunkManager } from '../world/chunkManager';
import { dayPhase, makeEnvSample, sampleEnvironment, type EnvSample } from '../world/environment';
import { Submarine, emptyInput, type SubInput } from '../submarine/submarine';
import { resolveLoadout } from '../submarine/loadout';
import { CreatureSystem } from '../entities/creatures';
import { PickupSystem } from '../entities/pickups';
import { ToolSystem, type ToolContext } from '../interaction/tools';
import { Sonar } from '../interaction/sonar';
import { Inventory } from '../items/inventory';
import { GameState, newSave } from './state';
import { Hud } from '../ui/hud';
import { injectStyles } from '../ui/style';
import { Input } from './input';
import { bus, toast } from './events';
import { clamp, clamp01, damp, lerp } from './math';

export class Game {
  readonly render: RenderSystem;
  readonly input: Input;
  readonly terrain: TerrainField;
  readonly chunks: ChunkManager;
  readonly atmosphere: Atmosphere;
  readonly camera: CameraRig;
  readonly sub: Submarine;
  readonly snow: MarineSnow;
  readonly motes: GlowMotes;
  readonly fx: EmitterField;
  readonly creatures: CreatureSystem;
  readonly pickups: PickupSystem;
  readonly tools = new ToolSystem();
  readonly sonar = new Sonar();
  readonly inventory = new Inventory();
  readonly env: EnvSample = makeEnvSample();
  readonly hud: Hud;
  readonly harbour: Harbour;
  state: GameState;

  worldSeed = 20260908;
  /** 0..1 through the day. */
  timeOfDay = 0.38;
  /** In-game seconds per real second. */
  timeScale = 40;
  weatherClarity = 1;

  /** Debug fly camera; the submarine is hidden and physics suspended. */
  freeCamMode = false;
  private freeCam = { yaw: 0, pitch: -0.25, pos: new Vector3(0, -12, 60), speed: 24 };

  private running = false;
  private lastTime = 0;
  private accumulator = 0;
  private readonly fixedStep = 1 / 60;
  elapsed = 0;
  paused = false;
  /** Set while a full-screen menu owns the input. */
  uiOpen = false;

  private subInput: SubInput = emptyInput();
  private bubbleTimer = 0;
  private sedimentTimer = 0;
  private ventTimer = 0;
  private lookTmp = { x: 0, y: 0 };
  private tmpV = new Vector3();
  private tmpV2 = new Vector3();
  private aim = new Vector3(0, 0, 1);
  private snowColour = new Color();
  private toolCtx: ToolContext;
  private lastPos = new Vector3();
  /** Objective line shown on the HUD, set by the quest system. */
  objective: string | null = null;

  constructor(container: HTMLElement, uiRoot: HTMLElement) {
    injectStyles();
    this.render = new RenderSystem(container);
    this.input = new Input(this.render.canvas);
    this.state = new GameState(newSave(0, 'Expedition', this.worldSeed));
    this.terrain = new TerrainField(this.worldSeed);

    const mats = {
      terrain: createSurfaceMaterial({ caustics: true, waterBlend: 0.26, name: 'terrain' }),
      props: createSurfaceMaterial({ caustics: true, waterBlend: 0.24, name: 'props' }),
      foliage: createFoliageMaterial(),
    };
    this.chunks = new ChunkManager(this.terrain, mats, this.worldSeed);
    this.render.scene.add(this.chunks.root);

    this.atmosphere = new Atmosphere(this.render.scene);

    const subMat = createSurfaceMaterial({
      caustics: true, waterBlend: 0.07, ambientFloor: 0.2, name: 'sub',
    });
    const subGlow = createSurfaceMaterial({ waterBlend: 0.05, emissiveScale: 1.7, name: 'sub-glow' });
    this.sub = new Submarine(this.terrain, subMat, subGlow);
    this.render.scene.add(this.sub.root);
    this.sub.position.copy(BERTH);

    this.camera = new CameraRig(this.terrain);

    this.creatures = new CreatureSystem(this.terrain, createCreatureMaterial({ instanced: true }));
    this.render.scene.add(this.creatures.root);

    const propMat = createSurfaceMaterial({
      caustics: true, waterBlend: 0.16, ambientFloor: 0.14, name: 'pickup',
    });
    this.pickups = new PickupSystem(this.terrain, propMat, this.worldSeed);
    this.render.scene.add(this.pickups.root);

    this.render.scene.add(this.sonar.root);

    this.harbour = new Harbour(this.terrain, subMat, subGlow);
    this.render.scene.add(this.harbour.root);

    this.snow = new MarineSnow(6000, 130, this.worldSeed);
    this.render.scene.add(this.snow.points);
    this.motes = new GlowMotes(1500, 96, this.worldSeed + 3);
    this.render.scene.add(this.motes.points);
    this.fx = new EmitterField(1100);
    this.render.scene.add(this.fx.points);
    this.render.scene.add(this.fx.additivePoints);

    this.hud = new Hud(uiRoot);

    this.toolCtx = {
      sub: this.sub, creatures: this.creatures, pickups: this.pickups,
      inventory: this.inventory, state: this.state,
      aim: this.aim, eye: this.render.camera.position,
      dt: 0, using: false, pressed: false, released: false,
    };

    this.applyLoadout();
    this.chunks.primeAround(this.sub.position, 3);
    this.camera.snap(this.sub, this.render.camera);
    this.lastPos.copy(this.sub.position);

    this.render.canvas.addEventListener('click', () => {
      if (!this.paused && !this.uiOpen) this.input.requestPointerLock();
    });

    bus.on('sub:collide', (e) => {
      this.camera.addShake(clamp01(e.speed / 12) * 0.8);
      this.fx.emit('sediment', e.x, e.y - 0.6, e.z, {
        count: 6, speed: 1.4, spread: 1.2, size: 0.5, life: 2.4,
        colour: this.env.water.clone().lerp(new Color('#d8c8a0'), 0.5),
      });
    });
    bus.on('sub:destroyed', () => this.rescue());
    bus.on('discovery', () => {
      const g = this.render.grade;
      g.uFlash.value = 0.22;
      (g.uFlashColor.value as Vector3).set(0.75, 0.95, 0.9);
    });
  }

  /** Recompute stats, appearance and available tools from the module list. */
  applyLoadout(): void {
    const l = resolveLoadout(this.state.data.sub.modules, this.state.data.sub.livery);
    this.sub.spec = l.visual;
    this.sub.applyStats(l.stats);
    this.sub.rebuild();
    this.tools.setAvailable(l.tools);
    this.inventory.capacity = l.stats.cargoMax;
    this.inventory.specimenCapacity = l.stats.specimenMax;
    this.inventory.relicCapacity = l.stats.relicMax;
    this.pickups.luck = l.stats.luck;
  }

  setQuality(tier: QualityTier): void {
    this.render.setQuality(tier);
    const p = this.render.profile;
    this.chunks.viewRadius = 6 * p.viewScale;
    this.chunks.detailScale = p.detailScale;
    this.creatures.densityScale = p.detailScale;
    this.pickups.densityScale = p.detailScale;
    this.atmosphere.setShadows(p.shadows, p.shadowMapSize);
    this.atmosphere.setGodRays(p.godRays);
    this.fx.setPixelRatio(this.render.renderer.getPixelRatio());
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.frame);
    bus.emit('game:started');
  }

  stop(): void {
    this.running = false;
  }

  private frame = (now: number): void => {
    if (!this.running) return;
    requestAnimationFrame(this.frame);
    const raw = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = clamp(raw, 0, 0.1);
    this.elapsed += dt;

    if (!this.paused) {
      this.accumulator += dt;
      let steps = 0;
      while (this.accumulator >= this.fixedStep && steps < 5) {
        this.fixedUpdate(this.fixedStep);
        this.accumulator -= this.fixedStep;
        steps++;
      }
      if (steps === 5) this.accumulator = 0;
    }

    this.update(this.paused ? 0 : dt);
    this.render.render(dt);
    this.input.endFrame();
  };

  private fixedUpdate(dt: number): void {
    const before = this.timeOfDay;
    this.timeOfDay = (this.timeOfDay + (dt * this.timeScale) / 86400) % 1;
    if (this.timeOfDay < before) this.state.data.day++;
    this.state.data.timeOfDay = this.timeOfDay;
    this.state.data.playedSeconds += dt;

    if (!this.freeCamMode) {
      this.readSubInput();
      this.sub.update(this.subInput, dt);
      // Travel and depth statistics.
      const d = this.sub.position.distanceTo(this.lastPos);
      if (d < 40) this.state.data.stats.distanceTravelled += d;
      this.lastPos.copy(this.sub.position);
      this.state.noteDepth(this.sub.depth);
      if (!this.sub.docked) this.state.data.stats.timeSubmerged += dt;
    }
    bus.emit('sim:tick', { dt, elapsed: this.elapsed });
  }

  private readSubInput(): void {
    const i = this.input;
    const s = this.subInput;
    if (this.uiOpen) {
      s.throttle = 0; s.rudder = 0; s.ballast = 0; s.boost = 0; s.brake = 1;
      return;
    }
    s.throttle = i.axis('thrustBack', 'thrustForward');
    s.rudder = i.axis('strafeLeft', 'strafeRight');
    s.ballast = (i.held('ascend') ? 1 : 0) - (i.held('descend') ? 1 : 0);
    s.boost = i.analog('boost');
    s.brake = i.analog('brake');
    const orbiting = this.camera.mode === 'orbit' || i.held('freeLook');
    s.followCamera = !orbiting;
    s.desiredYaw = orbiting ? null : this.camera.yaw;
    s.desiredPitch = orbiting ? null : clamp(this.camera.pitch * 0.85, -1.05, 1.05);
  }

  private update(dt: number): void {
    updateWaterUniforms(dt);

    this.input.lookDelta(this.lookTmp);
    if (this.freeCamMode) {
      this.updateFreeCam(dt);
    } else {
      if (!this.uiOpen) {
        if (this.input.pointer.locked || this.input.held('freeLook')) {
          this.camera.rotate(this.lookTmp.x, this.lookTmp.y);
        }
        if (this.input.pointer.wheel !== 0) {
          this.camera.zoom = clamp(this.camera.zoom + this.input.pointer.wheel * 0.12, 0.55, 2.2);
        }
        if (this.input.pressed('camera')) this.camera.cycleMode();
        if (this.input.pressed('lights')) {
          this.sub.lightsOn = !this.sub.lightsOn;
          toast(this.sub.lightsOn ? 'Lamps on' : 'Lamps off', 'neutral');
        }
        if (this.input.pressed('nextTool')) this.tools.next();
        if (this.input.pressed('prevTool')) this.tools.prev();
        if (this.input.pressed('sonar')) this.sonar.fire(this.sub);
      }
      this.camera.update(this.sub, this.render.camera, dt);
      this.sub.root.visible = this.camera.mode !== 'cockpit';
    }

    const cam = this.render.camera.position;
    const focus = this.freeCamMode ? cam : this.sub.position;

    sampleEnvironment(this.terrain, focus.x, focus.y, focus.z, this.timeOfDay, this.weatherClarity, this.env);
    this.atmosphere.update(cam, this.env, this.timeOfDay, dt);
    waterUniforms.uSubPos.value.copy(focus);
    waterUniforms.uSubWash.value = this.freeCamMode ? 3 : 7 + this.sub.smoothedSpeed * 0.5;

    const g = this.render.grade;
    g.uTime.value = this.elapsed;
    g.uDepthT.value = damp(g.uDepthT.value as number, this.env.depthT, 2, dt);
    g.uDamage.value = damp(g.uDamage.value as number,
      this.freeCamMode ? 0 : clamp01(1 - this.sub.hullFraction * 1.6), 2.5, dt);
    g.uWobble.value = damp(g.uWobble.value as number, this.freeCamMode ? 0 : this.sub.stress, 1.5, dt);
    g.uFlash.value = Math.max(0, (g.uFlash.value as number) - dt * 1.8);

    // Aim direction: where the camera is looking.
    this.render.camera.getWorldDirection(this.aim);

    if (!this.freeCamMode && !this.uiOpen) {
      this.toolCtx.dt = dt;
      this.toolCtx.using = this.input.held('useTool');
      this.toolCtx.pressed = this.input.pressed('useTool');
      this.toolCtx.released = this.input.released('useTool');
      this.toolCtx.eye = cam;
      this.tools.update(this.toolCtx);
      this.sub.armExtension = damp(this.sub.armExtension, this.toolCtx.using ? 1 : 0, 5, dt);
    }

    this.creatures.update(
      dt, focus, this.sub.velocity, this.env, dayPhase(this.timeOfDay),
      this.sub.lightsOn || this.tools.lureActive,
      this.sub.stats.lightRange * (this.tools.lureActive ? 1.7 : 1),
      this.sub.stats.noise,
    );
    this.pickups.update(focus, this.elapsed);
    this.sonar.update(dt, this.sub, this.creatures, this.pickups, this.terrain);
    this.updateParticles(dt, cam);
    this.chunks.update(focus, this.render.camera, dt);

    this.hud.update(
      dt, this.sub, this.inventory, this.tools, this.sonar,
      this.render.camera, this.objective,
    );
  }

  private updateParticles(dt: number, cam: Vector3): void {
    const pr = this.render.renderer.getPixelRatio();
    this.snowColour.copy(this.env.glow).lerp(this.env.water, 0.45);
    const inAir = cam.y > 0.4 ? 0 : 1;
    this.snow.update(cam, this.elapsed,
      this.env.snow * this.render.profile.particleScale * inAir,
      this.snowColour, this.tmpV.set(...this.env.current), pr);
    this.motes.update(cam, this.elapsed,
      clamp01(this.env.depthT * 1.5 - 0.12) * this.render.profile.particleScale * inAir,
      this.env.glow, this.sub.position, this.sub.stats.lightRange, pr);

    if (!this.freeCamMode && !this.sub.docked) {
      this.bubbleTimer -= dt;
      const load = this.sub.engineLoad;
      if (load > 0.05 && this.bubbleTimer <= 0 && this.sub.built) {
        this.bubbleTimer = lerp(0.09, 0.02, load);
        for (const port of this.sub.built.thrusterPorts) {
          this.sub.localToWorld(port, this.tmpV);
          this.tmpV2.copy(this.sub.velocity).multiplyScalar(-0.12);
          this.fx.emit('bubble', this.tmpV.x, this.tmpV.y, this.tmpV.z, {
            count: 1 + Math.round(load * 2),
            speed: 0.6 + load * 1.4, spread: 0.3,
            size: 0.07 + load * 0.06, life: 1.6,
            colour: '#dff6ff', dir: this.tmpV2,
          });
        }
      }

      this.sedimentTimer -= dt;
      if (this.sedimentTimer <= 0) {
        this.sedimentTimer = 0.06;
        const h = this.terrain.height(this.sub.position.x, this.sub.position.z);
        const clearance = this.sub.position.y - h;
        if (clearance < 4.5 && this.sub.smoothedSpeed > 1.4) {
          const k = clamp01(1 - clearance / 4.5) * clamp01(this.sub.smoothedSpeed / 6);
          this.fx.emit('sediment',
            this.sub.position.x - this.sub.velocity.x * 0.25, h + 0.35,
            this.sub.position.z - this.sub.velocity.z * 0.25, {
              count: 1 + Math.round(k * 2), speed: 0.35 + k, spread: 0.8,
              size: 0.4 + k * 0.5, life: 2.6,
              colour: this.env.water.clone().lerp(new Color('#d8c8a0'), 0.55),
            });
        }
      }
    }

    this.ventTimer -= dt;
    if (this.ventTimer <= 0) {
      this.ventTimer = 0.22;
      const anchors = this.chunks.anchorsNear(cam, 90, 'vent');
      for (const a of anchors) {
        this.fx.emit('plume', a.pos.x, a.pos.y, a.pos.z, {
          count: 1, speed: 1.4, spread: 0.25, size: 0.6, life: 4.2,
          colour: '#2c2622', dir: this.tmpV.set(0, 1, 0),
        });
        this.fx.emit('spark', a.pos.x, a.pos.y, a.pos.z, {
          count: 1, speed: 1.1, spread: 0.3, size: 0.12, life: 1.6,
          colour: '#ffb765', dir: this.tmpV.set(0, 1, 0),
        });
      }
    }

    this.fx.update(dt, this.elapsed);
    updateParticleFog(this.fx, this.env.water, this.env.fogDensity);
  }

  /** Hull failure: the harbour comes and gets you, for a fee and your cargo. */
  private rescue(): void {
    const lost = this.inventory.totalValue();
    const fee = Math.round(80 + this.state.data.stats.deepestDepth * 0.12);
    this.inventory.clear();
    this.state.addMoney(-Math.min(fee, this.state.money), 'rescue');
    this.state.data.stats.rescues++;
    this.state.data.stats.hullBreaches++;
    this.sub.resetAt(0, -8, 90);
    this.camera.snap(this.sub, this.render.camera);
    this.chunks.primeAround(this.sub.position, 2);
    toast(`Rescued. Cargo lost (${lost} marks) and a ${fee} mark tow.`, 'bad');
    bus.emit('sub:rescued', { lostCargo: lost, fee });
  }

  private updateFreeCam(dt: number): void {
    const c = this.freeCam;
    if (this.input.pointer.locked || this.input.held('freeLook')) {
      c.yaw -= this.lookTmp.x;
      c.pitch = clamp(c.pitch - this.lookTmp.y, -1.45, 1.45);
    }
    const fwd = this.tmpV.set(
      Math.sin(c.yaw) * Math.cos(c.pitch), Math.sin(c.pitch), Math.cos(c.yaw) * Math.cos(c.pitch),
    );
    const right = this.tmpV2.set(Math.cos(c.yaw), 0, -Math.sin(c.yaw));
    const speed = c.speed * (this.input.held('boost') ? 4 : 1);
    const move = new Vector3();
    move.addScaledVector(fwd, this.input.axis('thrustBack', 'thrustForward'));
    move.addScaledVector(right, this.input.axis('strafeLeft', 'strafeRight'));
    move.y += (this.input.held('ascend') ? 1 : 0) - (this.input.held('descend') ? 1 : 0);
    if (move.lengthSq() > 0) c.pos.addScaledVector(move.normalize(), speed * dt);
    this.render.camera.position.copy(c.pos);
    this.render.camera.lookAt(c.pos.x + fwd.x, c.pos.y + fwd.y, c.pos.z + fwd.z);
  }

  setFreeCam(yaw: number, pitch: number): void {
    this.freeCam.yaw = yaw;
    this.freeCam.pitch = pitch;
    this.camera.yaw = yaw;
    this.camera.pitch = pitch;
  }

  teleportAboveSeabed(x: number, z: number, offset = 12): void {
    const h = this.terrain.height(x, z);
    this.teleport(x, h + offset, z);
  }

  teleport(x: number, y: number, z: number): void {
    this.freeCam.pos.set(x, y, z);
    this.sub.position.set(x, y, z);
    this.sub.velocity.set(0, 0, 0);
    this.render.camera.position.set(x, y, z);
    this.lastPos.set(x, y, z);
    this.chunks.primeAround(this.sub.position, 3);
    this.camera.snap(this.sub, this.render.camera);
  }

  setFreeCamMode(on: boolean): void {
    this.freeCamMode = on;
    this.sub.root.visible = !on;
    if (on) this.freeCam.pos.copy(this.render.camera.position);
  }

  dispose(): void {
    this.stop();
    this.input.dispose();
    this.chunks.clear();
    this.atmosphere.dispose();
    this.snow.dispose();
    this.motes.dispose();
    this.fx.dispose();
    this.creatures.dispose();
    this.pickups.dispose();
    this.sonar.dispose();
    this.hud.dispose();
    this.harbour.dispose();
    this.sub.dispose();
    this.render.dispose();
  }
}
