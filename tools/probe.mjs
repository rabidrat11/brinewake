import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const browser = await chromium.launch({ args: ['--use-angle=metal'] });
const page = await browser.newPage({ viewport: { width: 1000, height: 600 } });
await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });
await page.waitForFunction('window.brinewake !== undefined');
await page.waitForTimeout(1500);
await page.evaluate(`(() => { const g = window.brinewake;
  g.setFreeCamMode(true); g.teleport(46, 26, -62); g.timeOfDay = 0.42; g.setFreeCam(3.55, -0.24);
})()`);
await page.waitForTimeout(2500);
const steps = [
  ['all', ''],
  ['no-creatures', 'window.brinewake.creatures.root.visible=false'],
  ['no-pickups', 'window.brinewake.pickups.root.visible=false'],
  ['no-chunkflora', `window.brinewake.chunks.root.traverse(o=>{if(o.material&&o.material.name==='foliage')o.visible=false})`],
];
for (const [name, js] of steps) {
  if (js) await page.evaluate(js);
  await page.waitForTimeout(400);
  writeFileSync(`/Users/raph/brinewake/.art/probe-${name}.png`, await page.screenshot());
}
await browser.close();
console.log('done');
