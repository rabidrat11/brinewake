/**
 * Visual check harness.
 *
 * Loads the game in headless Chromium, drives it through a small script of
 * teleports and settings, and writes PNGs to .art/. This is how the art
 * direction gets reviewed without a human in the loop for every iteration.
 *
 * Usage: node tools/shot.mjs [--url=http://127.0.0.1:5173] [shotName ...]
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const urlArg = args.find((a) => a.startsWith('--url='));
const url = urlArg ? urlArg.split('=')[1] : 'http://127.0.0.1:5173';
const only = args.filter((a) => !a.startsWith('--'));
const outDir = resolve('.art');
mkdirSync(outDir, { recursive: true });

/** Each shot: name, and a function body evaluated in the page. */
const SHOTS = [
  { name: 'sub-portrait', setup: `g.teleportAboveSeabed(0, 240, 14); g.timeOfDay = 0.42; g.setFreeCam(0.2, -0.1); g.camera.zoom = 0.7;` },
  { name: 'harbour', setup: `g.teleport(0, -4, -95); g.timeOfDay = 0.78; g.setFreeCam(3.1416, 0.06); g.camera.zoom = 1.6;` },
  { name: 'harbour-above', setup: `g.setFreeCamMode(true); g.teleport(46, 26, -62); g.timeOfDay = 0.42; g.setFreeCam(3.55, -0.24);` },
  { name: 'harbour-dusk', setup: `g.setFreeCamMode(true); g.teleport(-52, 16, -70); g.timeOfDay = 0.79; g.setFreeCam(2.75, -0.14);` },
  { name: 'bay-surface', setup: `g.camera.zoom = 1; g.teleport(0, -7, 240); g.timeOfDay = 0.42; g.setFreeCam(0.2, -0.18);` },
  { name: 'bay-floor', setup: `g.teleportAboveSeabed(-120, 520, 9); g.timeOfDay = 0.4; g.setFreeCam(1.1, -0.14);` },
  { name: 'kelp', setup: `g.teleportAboveSeabed(-980, 1340, 16); g.timeOfDay = 0.45; g.setFreeCam(0.6, -0.02);` },
  { name: 'reef', setup: `g.teleportAboveSeabed(980, 1280, 11); g.timeOfDay = 0.5; g.setFreeCam(2.2, -0.1);` },
  { name: 'drop', setup: `g.teleport(40, -150, 2180); g.timeOfDay = 0.5; g.setFreeCam(3.1, -0.35);` },
  { name: 'canyon', setup: `g.teleportAboveSeabed(-1540, 3320, 22); g.timeOfDay = 0.5; g.setFreeCam(0.9, 0.02);` },
  { name: 'vents', setup: `g.teleportAboveSeabed(1520, 3540, 14); g.setFreeCam(1.6, -0.05);` },
  { name: 'ruins', setup: `g.teleportAboveSeabed(220, 4680, 18); g.setFreeCam(2.4, 0);` },
  { name: 'glass', setup: `g.teleportAboveSeabed(-1760, 5460, 20); g.setFreeCam(0.4, -0.02);` },
  { name: 'abyss', setup: `g.teleportAboveSeabed(960, 6280, 14); g.setFreeCam(1.2, 0);` },
  { name: 'trench', setup: `g.teleportAboveSeabed(-240, 7480, 26); g.setFreeCam(2.9, 0.02);` },
  { name: 'night-bay', setup: `g.teleportAboveSeabed(0, 300, 10); g.timeOfDay = 0.02; g.setFreeCam(0.4, -0.1);` },
];

const browser = await chromium.launch({
  args: [
    '--use-angle=metal',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    '--enable-gpu-rasterization',
  ],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 1 });
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}\n${e.stack ?? ''}`));

await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForFunction('window.brinewake !== undefined', { timeout: 30000 });
await page.waitForTimeout(1500);

const shots = only.length ? SHOTS.filter((s) => only.includes(s.name)) : SHOTS;
for (const shot of shots) {
  await page.evaluate(`(() => { const g = window.brinewake; g.camera.zoom = 1; ${shot.setup} })()`);
  // Let chunk streaming and the atmosphere ease-in settle.
  await page.waitForTimeout(2600);
  const buf = await page.screenshot({ type: 'png' });
  writeFileSync(resolve(outDir, `${shot.name}.png`), buf);
  process.stdout.write(`shot ${shot.name}\n`);
}

const errs = logs.filter((l) => l.startsWith('[error]') || l.startsWith('[pageerror]'));
if (errs.length) {
  console.log('--- page errors ---');
  console.log(errs.slice(0, 40).join('\n'));
} else {
  console.log('no page errors');
}
const perf = await page.evaluate(`JSON.stringify({
  render: window.brinewake.render.stats,
  creatures: window.brinewake.creatures.stats,
  pickups: window.brinewake.pickups.stats,
  chunks: window.brinewake.chunks.stats,
  region: window.brinewake.env.regionId,
})`);
console.log('stats', perf);
await browser.close();
