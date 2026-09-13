/**
 * The heads-up display.
 *
 * Deliberately sparse: a depth dial, four small gauges, the current tool, and
 * a reticle. Everything else appears only when it is relevant — the fight bar
 * while a fish is on, sonar blips for nine seconds after a pulse, a discovery
 * card for the four seconds it takes to read it.
 */

import { Vector3 } from 'three';
import { arcPath, clear, dismiss, el, num, svg } from './dom';
import { bus, type DiscoveryPayload, type ToastPayload } from '../core/events';
import { clamp01, formatDepth, lerp } from '../core/math';
import type { Submarine } from '../submarine/submarine';
import type { Inventory } from '../items/inventory';
import type { ToolSystem } from '../interaction/tools';
import type { Sonar } from '../interaction/sonar';
import type { PerspectiveCamera } from 'three';

const DIAL_START = Math.PI * 0.75;
const DIAL_SWEEP = Math.PI * 1.5;

export class Hud {
  readonly root: HTMLElement;

  private dialArc!: SVGElement;
  private dialNum!: HTMLElement;
  private dialUnit!: HTMLElement;
  private dialWarn!: SVGElement;

  private gauges = new Map<string, { root: HTMLElement; fill: HTMLElement; value: HTMLElement }>();
  private toolChip!: HTMLElement;
  private toolName!: HTMLElement;
  private toolSub!: HTMLElement;
  private reticle!: HTMLElement;
  private targetLabel!: HTMLElement;
  private targetProgress!: HTMLElement;
  private targetProgressFill!: HTMLElement;
  private toasts!: HTMLElement;
  private ribbon!: HTMLElement;
  private ribbonMarker!: HTMLElement;
  private ribbonCrush!: HTMLElement;
  private ribbonTicks: HTMLElement[] = [];
  private fight!: HTMLElement;
  private fightName!: HTMLElement;
  private fightTension!: HTMLElement;
  private fightLine!: HTMLElement;
  private fightStrike!: HTMLElement;
  private blips!: HTMLElement;
  private objective!: HTMLElement;

  private discoveryQueue: DiscoveryPayload[] = [];
  private discoveryNode: HTMLElement | null = null;
  private discoveryTimer = 0;
  private toastNodes: { node: HTMLElement; life: number }[] = [];
  private blipPool: HTMLElement[] = [];

  constructor(parent: HTMLElement) {
    this.root = el('div.hud');
    this.build();
    parent.appendChild(this.root);

    bus.on('toast', (t) => this.pushToast(t));
    bus.on('discovery', (d) => this.discoveryQueue.push(d));
  }

  private build(): void {
    // --- depth dial ---
    const dial = el('div.dial');
    const s = svg('svg', { viewBox: '0 0 118 118', width: 118, height: 118 });
    s.appendChild(svg('circle', {
      cx: 59, cy: 59, r: 50, fill: 'rgba(6,26,34,0.72)',
      stroke: 'rgba(201,168,106,0.24)', 'stroke-width': 1,
    }));
    s.appendChild(svg('path', {
      d: arcPath(59, 59, 47, DIAL_START, DIAL_START + DIAL_SWEEP),
      fill: 'none', stroke: 'rgba(255,255,255,0.09)', 'stroke-width': 4, 'stroke-linecap': 'round',
    }));
    this.dialWarn = svg('path', {
      d: '', fill: 'none', stroke: 'rgba(226,99,79,0.45)', 'stroke-width': 4, 'stroke-linecap': 'round',
    });
    s.appendChild(this.dialWarn);
    this.dialArc = svg('path', {
      d: arcPath(59, 59, 47, DIAL_START, DIAL_START + 0.001),
      fill: 'none', stroke: '#8ff0dc', 'stroke-width': 4, 'stroke-linecap': 'round',
    });
    s.appendChild(this.dialArc);
    // Tick marks.
    for (let i = 0; i <= 10; i++) {
      const a = DIAL_START + (i / 10) * DIAL_SWEEP;
      const r0 = i % 5 === 0 ? 38 : 41;
      s.appendChild(svg('line', {
        x1: 59 + Math.cos(a) * r0, y1: 59 + Math.sin(a) * r0,
        x2: 59 + Math.cos(a) * 44, y2: 59 + Math.sin(a) * 44,
        stroke: i % 5 === 0 ? 'rgba(201,168,106,0.7)' : 'rgba(201,168,106,0.3)',
        'stroke-width': i % 5 === 0 ? 1.5 : 1,
      }));
    }
    dial.appendChild(s);
    this.dialNum = el('div.dial-num', '0');
    this.dialUnit = el('div.dial-unit', 'metres');
    dial.appendChild(el('div.dial-value', this.dialNum, this.dialUnit));

    // --- gauges ---
    const left = el('div.hud-left',
      dial,
      this.makeGauge('hull', 'Hull', 'H'),
      this.makeGauge('battery', 'Power', 'P'),
      this.makeGauge('oxygen', 'Life support', 'O'),
      this.makeGauge('cargo', 'Hold', 'C'),
    );

    // --- tool chip ---
    this.toolName = el('div.tc-name', 'Manipulator');
    this.toolSub = el('div.tc-sub', 'READY');
    this.toolChip = el('div.toolchip',
      el('div.tc-key', 'X'),
      el('div', this.toolName, this.toolSub),
    );
    this.objective = el('div.gauge', { style: 'display:none' });
    const right = el('div.hud-right', this.objective, this.toolChip);

    // --- reticle ---
    const ret = svg('svg', { viewBox: '0 0 26 26', width: 26, height: 26 });
    ret.appendChild(svg('circle', { cx: 13, cy: 13, r: 8, fill: 'none', stroke: 'rgba(242,231,205,0.8)', 'stroke-width': 1 }));
    ret.appendChild(svg('circle', { cx: 13, cy: 13, r: 1.4, fill: 'rgba(242,231,205,0.9)' }));
    for (const [x1, y1, x2, y2] of [[13, 0, 13, 4], [13, 22, 13, 26], [0, 13, 4, 13], [22, 13, 26, 13]]) {
      ret.appendChild(svg('line', { x1, y1, x2, y2, stroke: 'rgba(242,231,205,0.55)', 'stroke-width': 1 }));
    }
    this.reticle = el('div.reticle');
    this.reticle.appendChild(ret);
    this.targetLabel = el('div.target-label', { style: 'display:none' });
    this.targetProgressFill = el('div');
    this.targetProgress = el('div.target-progress', { style: 'display:none' }, this.targetProgressFill);

    // --- depth ribbon ---
    this.ribbonMarker = el('div.depth-marker', el('span', '0 m'));
    this.ribbonCrush = el('div.depth-crush');
    this.ribbon = el('div.depth-ribbon');
    this.ribbonTicks = [];
    for (let i = 0; i < 6; i++) {
      const label = el('span', '');
      const tick = el('div.tick', label, el('i'));
      this.ribbonTicks.push(label);
      this.ribbon.appendChild(tick);
    }
    this.ribbon.appendChild(this.ribbonCrush);
    this.ribbon.appendChild(this.ribbonMarker);

    // --- fight ---
    this.fightName = el('div.fight-name', '');
    this.fightTension = el('i');
    this.fightLine = el('i');
    this.fightStrike = el('div.fight-strike', { style: 'display:none' }, 'STRIKE — click!');
    this.fight = el('div.fight', { style: 'display:none' },
      this.fightName,
      el('div.fight-bar', this.fightTension, el('div.safe', { style: 'left:78%' })),
      el('div.fight-labels', el('span', 'Line tension'), el('span', 'Snap')),
      el('div.fight-line', this.fightLine),
      el('div.fight-labels', el('span', 'Line out'), el('span', 'Aboard')),
      this.fightStrike,
    );

    this.toasts = el('div.toasts');
    this.blips = el('div', { style: 'position:absolute;inset:0;pointer-events:none' });

    this.root.append(
      this.blips, left, right, this.ribbon, this.reticle,
      this.targetLabel, this.targetProgress, this.fight, this.toasts,
    );
  }

  private makeGauge(key: string, label: string, icon: string): HTMLElement {
    const fill = el('div.gauge-fill');
    const value = el('b', '100');
    const root = el('div.gauge',
      el('div.gauge-icon', icon),
      el('div.gauge-body',
        el('div.gauge-head', el('span', label), value),
        el('div.gauge-bar', fill),
      ),
    );
    this.gauges.set(key, { root, fill, value });
    return root;
  }

  private setGauge(key: string, frac: number, text: string, warnAt = 0.3, badAt = 0.14): void {
    const g = this.gauges.get(key);
    if (!g) return;
    g.fill.style.width = `${(clamp01(frac) * 100).toFixed(1)}%`;
    g.value.textContent = text;
    g.root.classList.toggle('warn', frac < warnAt && frac >= badAt);
    g.root.classList.toggle('bad', frac < badAt);
  }

  // --- per-frame -------------------------------------------------------

  update(
    dt: number, sub: Submarine, inv: Inventory, tools: ToolSystem, sonar: Sonar,
    camera: PerspectiveCamera, objective: string | null,
  ): void {
    const depth = sub.depth;
    const crush = sub.stats.crushDepth;

    // Dial: scaled to the current crush depth so it always reads usefully.
    const dialMax = Math.max(60, crush * 1.35);
    const t = clamp01(depth / dialMax);
    this.dialArc.setAttribute('d', arcPath(59, 59, 47, DIAL_START, DIAL_START + DIAL_SWEEP * Math.max(0.001, t)));
    const over = depth > crush;
    this.dialArc.setAttribute('stroke', over ? '#e2634f' : depth > crush * 0.9 ? '#f0b45c' : '#8ff0dc');
    this.dialNum.textContent = Math.round(depth).toString();
    this.dialUnit.textContent = over ? 'OVER CRUSH' : 'metres';
    const crushT = clamp01(crush / dialMax);
    this.dialWarn.setAttribute('d', arcPath(59, 59, 47, DIAL_START + DIAL_SWEEP * crushT, DIAL_START + DIAL_SWEEP));

    this.setGauge('hull', sub.hullFraction, `${Math.round(sub.hull)}`);
    this.setGauge('battery', sub.batteryFraction, `${Math.round(sub.battery)}`);
    this.setGauge('oxygen', sub.oxygenFraction, `${Math.floor(sub.oxygen / 60)}:${String(Math.floor(sub.oxygen % 60)).padStart(2, '0')}`);
    this.setGauge('cargo', inv.fillFraction, `${inv.usedMass.toFixed(1)}/${inv.capacity}`, 0.99, 1.01);
    const cargoG = this.gauges.get('cargo');
    if (cargoG) {
      cargoG.root.classList.toggle('warn', inv.fillFraction > 0.85);
      cargoG.root.classList.toggle('bad', inv.fillFraction >= 0.995);
    }

    // Tool chip.
    const def = tools.activeDef;
    this.toolName.textContent = def.name;
    const cooling = tools.cooldown > 0.05;
    this.toolChip.classList.toggle('cooling', cooling);
    this.toolSub.textContent = cooling ? `${tools.cooldown.toFixed(1)}s` : def.short;

    // Reticle and target.
    const hasTarget = !!(tools.targetCreature || tools.targetPickup);
    this.reticle.classList.toggle('active', hasTarget);
    if (hasTarget && tools.prompt) {
      this.targetLabel.style.display = '';
      this.targetLabel.textContent = tools.prompt;
    } else {
      this.targetLabel.style.display = 'none';
    }
    if (tools.progress > 0.01) {
      this.targetProgress.style.display = '';
      this.targetProgressFill.style.width = `${(tools.progress * 100).toFixed(0)}%`;
    } else {
      this.targetProgress.style.display = 'none';
    }

    // Depth ribbon.
    const ribbonMax = Math.max(120, crush * 1.6);
    const markerT = clamp01(depth / ribbonMax);
    this.ribbonMarker.style.top = `${(markerT * 100).toFixed(1)}%`;
    (this.ribbonMarker.firstChild as HTMLElement).textContent = formatDepth(depth);
    this.ribbonCrush.style.top = `${(clamp01(crush / ribbonMax) * 100).toFixed(1)}%`;
    for (let i = 0; i < this.ribbonTicks.length; i++) {
      const v = (i / (this.ribbonTicks.length - 1)) * ribbonMax;
      this.ribbonTicks[i].textContent = v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0);
    }

    // Fight panel.
    const f = tools.fishing;
    if (f.phase === 'idle') {
      this.fight.style.display = 'none';
    } else {
      this.fight.style.display = '';
      this.fightName.textContent = f.species?.name ?? '';
      this.fightTension.style.width = `${(clamp01(f.tension) * 100).toFixed(1)}%`;
      const lineT = f.startDistance > 0 ? 1 - clamp01(f.distance / f.startDistance) : 0;
      this.fightLine.style.width = `${(lineT * 100).toFixed(1)}%`;
      this.fightStrike.style.display = f.strikeWindow ? '' : 'none';
    }

    // Objective.
    if (objective) {
      this.objective.style.display = '';
      clear(this.objective);
      this.objective.appendChild(el('div.gauge-body',
        el('div.gauge-head', el('span', 'Objective')),
        el('div', { style: 'font-size:12px;color:var(--cream)' }, objective),
      ));
    } else {
      this.objective.style.display = 'none';
    }

    this.updateBlips(sonar, camera);
    this.updateToasts(dt);
    this.updateDiscovery(dt);
  }

  /** Project sonar contacts to screen space. */
  private updateBlips(sonar: Sonar, camera: PerspectiveCamera): void {
    const contacts = sonar.contacts;
    while (this.blipPool.length < contacts.length) {
      const b = el('div', {
        style: 'position:absolute;transform:translate(-50%,-50%);pointer-events:none;' +
          'font-size:9px;letter-spacing:.12em;text-transform:uppercase;white-space:nowrap;' +
          'text-shadow:0 1px 4px #000;display:flex;align-items:center;gap:5px',
      });
      this.blipPool.push(b);
      this.blips.appendChild(b);
    }
    const w = window.innerWidth, h = window.innerHeight;
    for (let i = 0; i < this.blipPool.length; i++) {
      const node = this.blipPool[i];
      const c = contacts[i];
      if (!c) { node.style.display = 'none'; continue; }
      _p.set(c.x, c.y, c.z).project(camera);
      if (_p.z > 1 || _p.z < -1) { node.style.display = 'none'; continue; }
      const alpha = clamp01(c.life / c.maxLife);
      node.style.display = '';
      node.style.left = `${((_p.x * 0.5 + 0.5) * w).toFixed(0)}px`;
      node.style.top = `${((-_p.y * 0.5 + 0.5) * h).toFixed(0)}px`;
      node.style.opacity = (alpha * 0.9).toFixed(2);
      node.style.color = c.colour;
      node.innerHTML =
        `<span style="display:inline-block;width:${(5 + c.size * 7).toFixed(0)}px;` +
        `height:${(5 + c.size * 7).toFixed(0)}px;border:1px solid ${c.colour};` +
        `border-radius:50%;box-shadow:0 0 8px ${c.colour}"></span>` +
        `<span>${c.label}</span>`;
    }
  }

  private pushToast(t: ToastPayload): void {
    if (!t.text) return;
    const node = el(`div.toast.${t.tone ?? 'neutral'}`, t.text);
    this.toasts.appendChild(node);
    this.toastNodes.push({ node, life: t.duration ?? 3.2 });
    while (this.toastNodes.length > 5) {
      const old = this.toastNodes.shift();
      if (old) dismiss(old.node);
    }
  }

  private updateToasts(dt: number): void {
    for (let i = this.toastNodes.length - 1; i >= 0; i--) {
      const t = this.toastNodes[i];
      t.life -= dt;
      if (t.life <= 0) {
        dismiss(t.node);
        this.toastNodes.splice(i, 1);
      }
    }
  }

  private updateDiscovery(dt: number): void {
    if (this.discoveryNode) {
      this.discoveryTimer -= dt;
      if (this.discoveryTimer <= 0) {
        dismiss(this.discoveryNode, 'leaving', 520);
        this.discoveryNode = null;
      }
      return;
    }
    const d = this.discoveryQueue.shift();
    if (!d) return;
    const kicker = {
      species: 'New species recorded',
      item: 'New object catalogued',
      wreck: 'Wreck identified',
      location: 'Location charted',
      mystery: 'Something unaccounted for',
      flora: 'New flora recorded',
      geology: 'New formation recorded',
    }[d.kind] ?? 'Discovery';
    this.discoveryNode = el('div.discovery',
      el('div.d-kicker', kicker),
      el('div.d-name', d.name),
      d.subtitle ? el('div.d-sub', d.subtitle) : null,
      el('div.d-rule'),
    );
    this.root.appendChild(this.discoveryNode);
    this.discoveryTimer = 4.2;
  }

  setVisible(v: boolean): void {
    this.root.classList.toggle('hidden', !v);
  }

  dispose(): void {
    this.root.remove();
  }
}

const _p = new Vector3();

export { lerp, num };
