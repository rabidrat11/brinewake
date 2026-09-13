/**
 * A very small DOM helper.
 *
 * The interface is a few thousand elements built and torn down as screens
 * open and close. That does not need a framework; it needs a terse way to
 * write a tree, and a way to keep a handful of live readouts updated without
 * rebuilding anything. That is all this is.
 */

export type Child = Node | string | number | null | undefined | false | Child[];

export interface Attrs {
  class?: string;
  id?: string;
  title?: string;
  style?: Partial<CSSStyleDeclaration> | string;
  html?: string;
  data?: Record<string, string>;
  onClick?: (e: MouseEvent) => void;
  onInput?: (e: Event) => void;
  onChange?: (e: Event) => void;
  onPointerDown?: (e: PointerEvent) => void;
  onPointerMove?: (e: PointerEvent) => void;
  onPointerUp?: (e: PointerEvent) => void;
  onWheel?: (e: WheelEvent) => void;
  [key: string]: unknown;
}

/** Create an element. `el('div.row', { onClick }, 'text')` */
export function el<K extends keyof HTMLElementTagNameMap>(
  spec: string, attrs?: Attrs | Child, ...children: Child[]
): HTMLElementTagNameMap[K] {
  const [tagPart, ...classParts] = spec.split('.');
  const tag = (tagPart || 'div') as K;
  const node = document.createElement(tag);
  if (classParts.length) node.className = classParts.join(' ');

  let realAttrs: Attrs | null = null;
  const kids: Child[] = [];
  if (attrs !== undefined && attrs !== null && typeof attrs === 'object' && !(attrs instanceof Node) && !Array.isArray(attrs)) {
    realAttrs = attrs as Attrs;
  } else if (attrs !== undefined) {
    kids.push(attrs as Child);
  }
  kids.push(...children);

  if (realAttrs) {
    for (const [k, v] of Object.entries(realAttrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') node.className = node.className ? `${node.className} ${v}` : String(v);
      else if (k === 'html') node.innerHTML = String(v);
      else if (k === 'style') {
        if (typeof v === 'string') node.setAttribute('style', v);
        else Object.assign(node.style, v);
      } else if (k === 'data') {
        for (const [dk, dv] of Object.entries(v as Record<string, string>)) node.dataset[dk] = dv;
      } else if (k.startsWith('on') && typeof v === 'function') {
        node.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
      } else {
        node.setAttribute(k, String(v));
      }
    }
  }

  append(node, kids);
  return node;
}

export function append(parent: Node, child: Child): void {
  if (child === null || child === undefined || child === false) return;
  if (Array.isArray(child)) {
    for (const c of child) append(parent, c);
    return;
  }
  if (child instanceof Node) parent.appendChild(child);
  else parent.appendChild(document.createTextNode(String(child)));
}

export function clear(node: Element): void {
  while (node.firstChild) node.removeChild(node.firstChild);
}

/** Inline SVG, for gauges and icons. */
export function svg(spec: string, attrs: Record<string, string | number> = {}, ...children: SVGElement[]): SVGElement {
  const [tag, ...classes] = spec.split('.');
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  if (classes.length) node.setAttribute('class', classes.join(' '));
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  for (const c of children) node.appendChild(c);
  return node;
}

/** Describe an SVG arc path, used by every dial in the game. */
export function arcPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const p0x = cx + Math.cos(a0) * r;
  const p0y = cy + Math.sin(a0) * r;
  const p1x = cx + Math.cos(a1) * r;
  const p1y = cy + Math.sin(a1) * r;
  const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
  const sweep = a1 > a0 ? 1 : 0;
  return `M ${p0x.toFixed(2)} ${p0y.toFixed(2)} A ${r} ${r} 0 ${large} ${sweep} ${p1x.toFixed(2)} ${p1y.toFixed(2)}`;
}

/** Remove a node after its leave animation has played. */
export function dismiss(node: HTMLElement, className = 'leaving', ms = 320): void {
  node.classList.add(className);
  setTimeout(() => node.remove(), ms);
}

/** Format a number with thin separators, for money and distances. */
export function num(n: number, digits = 0): string {
  return n.toLocaleString('en-GB', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
