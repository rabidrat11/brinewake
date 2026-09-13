/** Screenshot the model gallery for a given set. */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const sets = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const colsArg = process.argv.find((a) => a.startsWith('--cols='));
const tagArg = process.argv.find((a) => a.startsWith('--tag='));
const angleArg = process.argv.find((a) => a.startsWith('--angle='));
const angle = angleArg ? parseFloat(angleArg.split('=')[1]) : null;
const tiltArg = process.argv.find((a) => a.startsWith('--tilt='));
const tilt = tiltArg ? parseFloat(tiltArg.split('=')[1]) : 0;
mkdirSync(resolve('.art'), { recursive: true });

const browser = await chromium.launch({ args: ['--use-angle=metal'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });

for (const set of sets.length ? sets : ['flora', 'rocks', 'submarine']) {
  const extra = (onlyArg ? '&only=' + onlyArg.split('=')[1] : '') + (colsArg ? '&cols=' + colsArg.split('=')[1] : '');
  await page.goto(`http://127.0.0.1:5173/gallery.html?set=${set}${extra}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1400);
  if (angle !== null) {
    await page.evaluate(`(() => {
      const g = window.gallery; g.setSpin(false);
      g.scene.traverse(o => { if (o.parent === g.scene && o.type === 'Group') { o.rotation.y = ${angle}; o.rotation.x = ${tilt}; } });
    })()`);
    await page.waitForTimeout(400);
  }
  const tag = tagArg ? '-' + tagArg.split('=')[1] : '';
  writeFileSync(resolve('.art', `gallery-${set}${tag}.png`), await page.screenshot());
  console.log('gallery', set);
}
if (errs.length) console.log('errors:\n' + errs.slice(0, 20).join('\n'));
await browser.close();
