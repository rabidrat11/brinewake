/**
 * Model gallery.
 *
 * A contact sheet for every procedural model in the game, laid out on a grid
 * under neutral studio lighting. This is the tool the art passes are actually
 * done against: it makes silhouette, proportion and palette problems obvious
 * in a way that finding the thing in the ocean never does.
 *
 *   /gallery.html?set=flora
 *   /gallery.html?set=submarine&cols=4
 */

import {
  AmbientLight, Color, DirectionalLight, Group, Mesh, Object3D,
  PerspectiveCamera, Scene, Vector3, WebGLRenderer, ACESFilmicToneMapping,
  SRGBColorSpace, Box3, HemisphereLight,
} from 'three';
import { MeshBuilder } from '../procedural/geo';
import { Rng } from '../core/rng';
import { FLORA, addSwayAttribute } from '../procedural/flora';
import {
  buildBoulder, buildCrystalCluster, buildGeode, buildOutcrop, buildPebbleField,
  buildRockFormation, buildSedimentMound, buildStoneArch, buildVentChimney,
} from '../procedural/rocks';
import {
  buildSubmarine, defaultSubSpec, LIVERIES, type SubVisualSpec,
} from '../procedural/submarineBuilder';
import {
  createCreatureMaterial, createFoliageMaterial, createSurfaceMaterial, waterUniforms,
} from '../rendering/materials';
import { buildCreature, defaultAnatomy, type Anatomy, type BodyKind } from '../procedural/creatureBuilder';
import { REGIONS } from '../data/regions';
import { baseSizeFor } from '../world/chunkManager';

interface Entry {
  name: string;
  note?: string;
  build: (root: Group) => void;
  /** Desired framing size in metres. */
  size?: number;
}

const params = new URLSearchParams(location.search);
const set = params.get('set') ?? 'flora';
const cols = parseInt(params.get('cols') ?? '0', 10);
const only = (params.get('only') ?? '').split(',').filter(Boolean);

const surface = createSurfaceMaterial({ waterBlend: 0, name: 'gallery' });
const foliage = createFoliageMaterial({ stiffness: 1 });
const glowMat = createSurfaceMaterial({ waterBlend: 0, emissiveScale: 1.8, name: 'gallery-glow' });
waterUniforms.uWaterTint.value.set('#ffffff');
waterUniforms.uDepthT.value = 0;
waterUniforms.uCaustic.value = 0;

function meshFromBuilder(b: MeshBuilder, mat = surface, sway = false): Mesh {
  const geo = b.build();
  if (sway) addSwayAttribute(geo, 1.6, 0.25);
  else addSwayAttribute(geo, 1, 0);
  return new Mesh(geo, mat);
}

function floraEntries(): Entry[] {
  const region = REGIONS[2];
  return Object.keys(FLORA).map((kind, i) => ({
    name: kind,
    build: (root) => {
      const b = new MeshBuilder();
      const rng = new Rng(1000 + i * 37);
      const colours = floraPalette(kind);
      FLORA[kind](b, { size: baseSizeFor(kind), colors: colours, glow: 0.6, rng });
      root.add(meshFromBuilder(b, foliage, true));
    },
    size: 4,
    note: region.id,
  }));
}

const FLORA_PALETTES: Record<string, string[]> = {
  eelgrass: ['#5f9455', '#89b757', '#4b7a41'],
  sandTuft: ['#7fa05c', '#a8c46f'],
  seaLettuce: ['#79b552', '#a6d76a'],
  kelpSmall: ['#4a6b2e', '#88a83c', '#6d8c33'],
  giantKelp: ['#3f6b2c', '#87a83c', '#a8bf52'],
  barnacleCluster: ['#cbbfa4', '#e6dcc4'],
  brainCoral: ['#d99a5e', '#f0c489'],
  staghornCoral: ['#e0836b', '#f4b58c', '#c0664f'],
  fanCoral: ['#d4557a', '#f2a0b4'],
  tubeSponge: ['#e0603c', '#f09a5e', '#c2402c'],
  anemone: ['#b8577f', '#f2c05e'],
  featherStar: ['#e8a13c', '#f6d68a'],
  seaWhip: ['#c86f4a', '#e8a070'],
  glassSponge: ['#dfeae6', '#c4d8d2'],
  tubeWorm: ['#d8402c', '#f0e6d4'],
  lanternPolyp: ['#4a5a6b', '#9ee8ff'],
  bambooCoral: ['#efe8d8', '#2f2c34'],
  ventBacterialMat: ['#e8dcc0', '#c8a878'],
  ventShrimpNest: ['#5a5248', '#f0d8c0'],
  stoneLichen: ['#7f9a6b', '#a8b884'],
  crystalSpine: ['#8fd8f0', '#c8a2f2', '#a8f0ff'],
  seaLily: ['#d8b48c', '#f2e0c0'],
  abyssalFan: ['#5c7f9c', '#7fffe0'],
  wakeFilament: ['#9f7fe8', '#c0a0ff', '#e0d0ff'],
};

function floraPalette(kind: string): string[] {
  return FLORA_PALETTES[kind] ?? ['#6f9c6a', '#a8c48a'];
}

function paletteFor(kind: string, i: number): string[] {
  const pals = [
    ['#3f7a3a', '#87b04a', '#c8f7b4'],
    ['#e8806f', '#f0b25e', '#ffd6b0'],
    ['#7d5fc0', '#4f7fd0', '#9ee8ff'],
    ['#e0623a', '#f2a24e', '#ffb765'],
    ['#8fd8f0', '#c8a2f2', '#a8f0ff'],
    ['#4fd0c0', '#b06fd0', '#7fffe0'],
  ];
  void kind;
  return pals[i % pals.length];
}

function rockEntries(): Entry[] {
  const colours: [string, string, string] = ['#4b5750', '#63705f', '#828c76'];
  const warm: [string, string, string] = ['#69503f', '#8c6b52', '#ad8763'];
  const out: Entry[] = [];
  for (let i = 0; i < 6; i++) {
    out.push({
      name: `boulder ${i + 1}`,
      size: 6,
      build: (root) => {
        const b = new MeshBuilder();
        buildBoulder(b, new Rng(200 + i * 91), 4, {
          colors: i % 2 ? warm : colours, angularity: i / 5, dust: '#cdb37c', moss: '#5f9455',
        });
        root.add(meshFromBuilder(b));
      },
    });
  }
  for (let i = 0; i < 3; i++) {
    out.push({
      name: `formation ${i + 1}`, size: 9,
      build: (root) => {
        const b = new MeshBuilder();
        buildRockFormation(b, new Rng(400 + i * 71), 5, { colors: colours, angularity: 0.4, dust: '#cdb37c' });
        root.add(meshFromBuilder(b));
      },
    });
    out.push({
      name: `outcrop ${i + 1}`, size: 12,
      build: (root) => {
        const b = new MeshBuilder();
        buildOutcrop(b, new Rng(500 + i * 61), 5, { colors: colours, angularity: 0.8 });
        root.add(meshFromBuilder(b));
      },
    });
  }
  out.push({
    name: 'crystal cluster', size: 12,
    build: (root) => {
      const b = new MeshBuilder();
      buildCrystalCluster(b, new Rng(9), 6, ['#8fd8f0', '#c8a2f2', '#a8f0ff'], 0.5);
      root.add(meshFromBuilder(b, glowMat));
    },
  });
  out.push({
    name: 'vent chimney', size: 14,
    build: (root) => {
      const b = new MeshBuilder();
      buildVentChimney(b, new Rng(11), 9, '#2e2c30', '#e0623a');
      root.add(meshFromBuilder(b, glowMat));
    },
  });
  out.push({
    name: 'stone arch', size: 18,
    build: (root) => {
      const b = new MeshBuilder();
      buildStoneArch(b, new Rng(13), 12, 7, { colors: colours, angularity: 0.5 });
      root.add(meshFromBuilder(b));
    },
  });
  out.push({
    name: 'sediment mound', size: 8,
    build: (root) => {
      const b = new MeshBuilder();
      buildSedimentMound(b, new Rng(17), 5, ['#cdb37c', '#8b7f5e']);
      root.add(meshFromBuilder(b));
    },
  });
  out.push({
    name: 'pebble field', size: 8,
    build: (root) => {
      const b = new MeshBuilder();
      buildPebbleField(b, new Rng(19), 3, 26, ['#63705f', '#b39a68', '#828c76']);
      root.add(meshFromBuilder(b));
    },
  });
  out.push({
    name: 'geode', size: 4,
    build: (root) => {
      const b = new MeshBuilder();
      buildGeode(b, new Rng(23), 2.4, '#63705f', '#a8f0ff');
      root.add(meshFromBuilder(b, glowMat));
    },
  });
  return out;
}

function submarineEntries(): Entry[] {
  const specs: { name: string; note: string; spec: Partial<SubVisualSpec> }[] = [
    { name: 'Bellows (starter)', note: 'coastal / single / 1 lamp', spec: {} },
    { name: 'Reinforced', note: 'reinforced / dual / 3 lamps', spec: { hull: 'reinforced', engine: 'dual', lamps: 3, sonarDome: true, cargoPods: 1 } },
    { name: 'Ceramic survey', note: 'ceramic / turbine / arm', spec: { hull: 'ceramic', engine: 'turbine', lamps: 4, sonarDome: true, antenna: true, arm: 'grabber', cargoPods: 2, specimenTank: true, livery: 'institute' } },
    { name: 'Titanium deep', note: 'titanium / mhd / drill', spec: { hull: 'titanium', engine: 'mhd', lamps: 5, sonarDome: true, antenna: true, arm: 'drill', cargoPods: 3, specimenTank: true, thermalPlates: true, livery: 'ember' } },
    { name: 'Pressure sphere', note: 'sphere / turbine / lab', spec: { hull: 'sphere', engine: 'turbine', lamps: 6, sonarDome: true, antenna: true, arm: 'claw', cargoPods: 4, specimenTank: true, lab: true, livery: 'glass' } },
    { name: 'Abyssal', note: 'abyssal / experimental / everything', spec: { hull: 'abyssal', engine: 'experimental', lamps: 6, sonarDome: true, antenna: true, arm: 'claw', cargoPods: 4, specimenTank: true, thermalPlates: true, bioTrim: true, lab: true, livery: 'abyssal' } },
  ];
  const out: Entry[] = specs.map((s) => ({
    name: s.name, note: s.note, size: 9,
    build: (root) => {
      const built = buildSubmarine({ ...defaultSubSpec(), ...s.spec }, surface, glowMat, 7);
      root.add(built.group);
    },
  }));
  for (const l of LIVERIES) {
    out.push({
      name: l.name, note: 'livery', size: 8,
      build: (root) => {
        const built = buildSubmarine({ ...defaultSubSpec(), lamps: 2, livery: l.id }, surface, glowMat, 7);
        root.add(built.group);
      },
    });
  }
  return out;
}

const creatureMat = createCreatureMaterial({ instanced: false });

function anatomyEntries(): Entry[] {
  const bodies: BodyKind[] = [
    'spindle', 'torpedo', 'compressed', 'eel', 'ribbon', 'globe', 'barrel',
    'flat', 'segmented', 'bell', 'ray', 'mantle', 'crab', 'star', 'worm', 'larva',
  ];
  const heads = ['blunt', 'pointed', 'hammer', 'lantern', 'beaked', 'bulbous', 'jawed', 'tube', 'shovel', 'sawtooth'] as const;
  const tails = ['forked', 'fan', 'pointed', 'ribbon', 'lunate', 'whip', 'paddle', 'trident', 'spade'] as const;
  const out: Entry[] = [];
  bodies.forEach((body, i) => {
    out.push({
      name: body, note: 'body plan', size: 4,
      build: (root) => {
        const a: Anatomy = { ...defaultAnatomy(), body, glow: 0.5, extras: ['glowSpots'] };
        if (body === 'crab' || body === 'segmented') a.extras = ['claws', 'antennae'];
        if (body === 'mantle') a.extras = ['tentacles'];
        if (body === 'star') a.segments = 5;
        const geo = buildCreature(a, palette(i), 2.4, new Rng(50 + i * 13));
        root.add(new Mesh(geo, creatureMat));
      },
    });
  });
  heads.forEach((head, i) => {
    out.push({
      name: head, note: 'head', size: 4,
      build: (root) => {
        const a: Anatomy = { ...defaultAnatomy(), head, glow: 0.4 };
        const geo = buildCreature(a, palette(i + 3), 2.4, new Rng(120 + i * 7));
        root.add(new Mesh(geo, creatureMat));
      },
    });
  });
  tails.forEach((tail, i) => {
    out.push({
      name: tail, note: 'tail', size: 4,
      build: (root) => {
        const a: Anatomy = { ...defaultAnatomy(), tail };
        const geo = buildCreature(a, palette(i + 1), 2.4, new Rng(200 + i * 11));
        root.add(new Mesh(geo, creatureMat));
      },
    });
  });
  const patterns = ['plain', 'stripes', 'bands', 'spots', 'gradient', 'countershade', 'mottled', 'reticulated', 'chevron', 'saddle'] as const;
  patterns.forEach((pattern, i) => {
    out.push({
      name: pattern, note: 'pattern', size: 4,
      build: (root) => {
        const a: Anatomy = { ...defaultAnatomy(), pattern };
        const geo = buildCreature(a, palette(i + 2), 2.4, new Rng(300 + i * 5));
        root.add(new Mesh(geo, creatureMat));
      },
    });
  });
  return out;
}

function palette(i: number) {
  const sets = [
    { base: '#e8925f', belly: '#f6e2c0', accent: '#8c3f2c', fin: '#f0b070', glow: '#ffd9a0', eye: '#f6f0e0' },
    { base: '#3f8fb0', belly: '#cfe8ef', accent: '#1c4a63', fin: '#6fb6cf', glow: '#a8f0ff', eye: '#f2f6f0' },
    { base: '#7fae4f', belly: '#e6f0c8', accent: '#3d6b2c', fin: '#a8cf6f', glow: '#d9f5b0', eye: '#f4f2e4' },
    { base: '#c85f7f', belly: '#f6dce4', accent: '#6b2c44', fin: '#e08fa8', glow: '#ffc8dc', eye: '#f8f0f2' },
    { base: '#8f7fc8', belly: '#dcd6f0', accent: '#3f3468', fin: '#b0a2e0', glow: '#cbb8ff', eye: '#f0eef8' },
    { base: '#4f4a56', belly: '#8e8896', accent: '#20202a', fin: '#6f6878', glow: '#7fffe0', eye: '#e8f2ee' },
  ];
  return sets[i % sets.length];
}

const SETS: Record<string, () => Entry[]> = {
  flora: floraEntries,
  rocks: rockEntries,
  submarine: submarineEntries,
  anatomy: anatomyEntries,
};

// --- scene setup --------------------------------------------------------

const container = document.getElementById('gal')!;
const labels = document.getElementById('labels')!;
document.getElementById('hdr')!.textContent = `Brinewake gallery · ${set}`;

const renderer = new WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = SRGBColorSpace;
renderer.toneMapping = ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
container.appendChild(renderer.domElement);

const scene = new Scene();
scene.background = new Color('#10171c');
scene.add(new AmbientLight(0xffffff, 0.55));
scene.add(new HemisphereLight(0xcfe6ff, 0x6a5f4a, 1.05));
const key = new DirectionalLight(0xfff4e0, 2.1);
key.position.set(4, 6, 6);
scene.add(key);
const fill = new DirectionalLight(0x9fd8e8, 1.35);
fill.position.set(-6, 2, -4);
scene.add(fill);
const rim = new DirectionalLight(0xffd9a0, 0.85);
rim.position.set(0, -3, -8);
scene.add(rim);

let entries = (SETS[set] ?? floraEntries)();
if (only.length) entries = entries.filter((e) => only.includes(e.name));
const n = entries.length;
const gridCols = cols || Math.ceil(Math.sqrt(n * 1.7));
const gridRows = Math.ceil(n / gridCols);

const cells: { group: Group; entry: Entry; centre: Vector3; radius: number }[] = [];
const cellSize = 10;
const FIT = 7.2;

entries.forEach((entry, i) => {
  const g = new Group();
  const inner = new Group();
  entry.build(inner);
  g.add(inner);
  // Centre the model on its own bounding box so the grid reads evenly.
  const box = new Box3().setFromObject(inner);
  const c = box.getCenter(new Vector3());
  const sz = box.getSize(new Vector3());
  // Normalise every model into the same cell so proportions can be compared.
  const fit = FIT / Math.max(sz.x, sz.y, sz.z, 0.001);
  const holder = new Group();
  g.remove(inner);
  inner.position.sub(c);
  holder.add(inner);
  holder.scale.setScalar(fit);
  g.add(holder);
  const cx = (i % gridCols) - (gridCols - 1) / 2;
  const cy = -(Math.floor(i / gridCols) - (gridRows - 1) / 2);
  g.position.set(cx * cellSize, cy * cellSize, 0);
  scene.add(g);
  cells.push({ group: g, entry, centre: g.position.clone(), radius: Math.max(sz.x, sz.y, sz.z) * 0.5 });

  const el = document.createElement('div');
  el.className = 'lbl';
  el.innerHTML = `<b>${entry.name}</b>${entry.note ? entry.note : ''}`;
  labels.appendChild(el);
});

const camera = new PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 4000);
const gridW = gridCols * cellSize;
const gridH = gridRows * cellSize;
const dist = Math.max(gridW / (2 * Math.tan((camera.fov * Math.PI) / 360) * camera.aspect),
  gridH / (2 * Math.tan((camera.fov * Math.PI) / 360))) * 1.12;
camera.position.set(0, 0, dist);
camera.lookAt(0, 0, 0);

let spin = true;
addEventListener('keydown', (e) => {
  if (e.code === 'Space') spin = !spin;
});
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const proj = new Vector3();
let t = 0;
function frame(): void {
  requestAnimationFrame(frame);
  t += 1 / 60;
  waterUniforms.uTime.value = t;
  if (spin) {
    for (const c of cells) c.group.rotation.y = t * 0.35;
  }
  renderer.render(scene, camera);

  cells.forEach((c, i) => {
    proj.copy(c.centre);
    proj.y -= cellSize * 0.42;
    proj.project(camera);
    const el = labels.children[i] as HTMLElement;
    el.style.left = `${(proj.x * 0.5 + 0.5) * innerWidth}px`;
    el.style.top = `${(-proj.y * 0.5 + 0.5) * innerHeight}px`;
  });
}
frame();

(window as unknown as { gallery: { scene: Scene; setSpin: (v: boolean) => void } }).gallery = {
  scene, setSpin: (v: boolean) => { spin = v; for (const c of cells) c.group.rotation.y = v ? c.group.rotation.y : 0; },
};

export {};
