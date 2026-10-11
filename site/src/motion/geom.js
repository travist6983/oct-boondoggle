import { MotionPathPlugin } from 'gsap/MotionPathPlugin';

const SVGNS = 'http://www.w3.org/2000/svg';
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => t * t * (3 - 2 * t);
// Map v from [a,b] to [0,1], clamped.
export const range = (v, a, b) => clamp((v - a) / (b - a));

export function el(name, attrs = {}, parent) {
  const n = document.createElementNS(SVGNS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (parent) parent.appendChild(n);
  return n;
}

// Size a stage's route <svg> to its frame so 1 user unit = 1 CSS px of the frame.
export function prepRouteSvg(svg, w, h) {
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('width', w);
  svg.setAttribute('height', h);
  svg.replaceChildren();
  return svg;
}

// Matrix that maps an SVG element's user space into frame-local CSS px.
export function toFrameMatrix(node, frame) {
  const ctm = node.getScreenCTM();
  const fr = frame.getBoundingClientRect();
  const m = new DOMMatrix([ctm.a, ctm.b, ctm.c, ctm.d, ctm.e, ctm.f]);
  return new DOMMatrix().translate(-fr.left, -fr.top).multiply(m);
}

export function relRect(node, frame) {
  const r = node.getBoundingClientRect();
  const f = frame.getBoundingClientRect();
  return { x: r.left - f.left, y: r.top - f.top, w: r.width, h: r.height, cx: r.left - f.left + r.width / 2, cy: r.top - f.top + r.height / 2 };
}

/**
 * A leg of the route: an SVG path the envelope rides, positioned with
 * MotionPathPlugin.getPositionOnPath and mapped into frame-local px.
 * `pre` optionally transforms user-space points first (e.g. a camera zoom).
 */
export class Leg {
  constructor(path, frame, { ink = null, pre = null } = {}) {
    this.path = path;
    this.ink = ink;
    this.pre = pre;
    this.m = toFrameMatrix(path, frame);
    this.raw = MotionPathPlugin.getRawPath(path);
    MotionPathPlugin.cacheRawPathMeasurements(this.raw);
    this._lastInk = -1;
  }
  at(t) {
    const p = MotionPathPlugin.getPositionOnPath(this.raw, clamp(t), true);
    let x = p.x, y = p.y;
    if (this.pre) [x, y] = this.pre(x, y);
    const m = this.m;
    return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f, angle: p.angle };
  }
  draw(t) {
    if (!this.ink) return;
    const v = Math.round(clamp(t) * 1000) / 1000;
    if (v !== this._lastInk) {
      this.ink.style.strokeDashoffset = String(1 - v);
      this._lastInk = v;
    }
  }
  // Monotonic y → t lookup so a leg can be "tracked" by the focus line.
  buildYTable(n = 360) {
    const ys = new Float32Array(n + 1);
    let max = -Infinity;
    for (let i = 0; i <= n; i++) {
      max = Math.max(max, this.at(i / n).y);
      ys[i] = max;
    }
    this.ys = ys;
    this.n = n;
    return this;
  }
  tAtY(y) {
    const ys = this.ys, n = this.n;
    if (y <= ys[0]) return 0;
    if (y >= ys[n]) return 1;
    let lo = 0, hi = n;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (ys[mid] < y) lo = mid; else hi = mid;
    }
    const span = ys[hi] - ys[lo] || 1;
    return (lo + (y - ys[lo]) / span) / n;
  }
  // Fraction along the path closest to a frame-local point.
  tNear(px, py, n = 400) {
    let best = 0, bd = Infinity;
    for (let i = 0; i <= n; i++) {
      const p = this.at(i / n);
      const d = (p.x - px) ** 2 + (p.y - py) ** 2;
      if (d < bd) { bd = d; best = i / n; }
    }
    return best;
  }
}

// Plan (dashed) + ink (drawn) pair inside a route svg.
export function routePair(svg, d) {
  const plan = el('path', { d, class: 'route-plan' }, svg);
  const ink = el('path', { d, class: 'route-ink', pathLength: '1' }, svg);
  return { plan, ink };
}

// Smooth, y-monotonic path through points (vertical tangents at each point).
export function verticalPath(points) {
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const k = (y1 - y0) * 0.5;
    d += ` C${x0},${y0 + k} ${x1},${y1 - k} ${x1},${y1}`;
  }
  return d;
}

// Piecewise keyframe mapping (progress → value) with smoothstep easing between keys.
export function keyed(keys, p) {
  if (p <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [p1, v1] = keys[i];
    if (p <= p1) {
      const [p0, v0] = keys[i - 1];
      return lerp(v0, v1, smooth(range(p, p0, p1)));
    }
  }
  return keys[keys.length - 1][1];
}
