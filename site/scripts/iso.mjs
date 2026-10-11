// Isometric drawing helpers (true 30° isometric). World units are px at scale 1.
// x runs right-down, y runs left-down, z runs up. Faces are flat fills; shading is the
// brand color mixed with white (top) or black (right) — neutral overlays, no new hues.

export const C = Math.cos(Math.PI / 6);
export const S = 0.5;

export const BRAND = {
  blue: '#0076C0',
  deepBlue: '#000ACA',
  green: '#00FF84',
  white: '#FFFFFF',
  lightGrey: '#F7F7F7',
  border: '#DDDDDD',
  grey: '#656263',
  darkGrey: '#231F20',
  heading: '#111827',
};

const r2 = (n) => Math.round(n * 100) / 100;

// Track every projected point so a scene can compute its own viewBox.
let bounds = null;
export function resetBounds() {
  bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
}
export function getBounds() {
  return bounds;
}
function track([x, y]) {
  if (!bounds) return;
  bounds.minX = Math.min(bounds.minX, x);
  bounds.minY = Math.min(bounds.minY, y);
  bounds.maxX = Math.max(bounds.maxX, x);
  bounds.maxY = Math.max(bounds.maxY, y);
}

export const P = (x, y, z = 0) => {
  const p = [(x - y) * C, (x + y) * S - z];
  track(p);
  return p;
};
export const pt = (x, y, z = 0) => P(x, y, z).map(r2).join(',');
const ptsStr = (arr) => arr.map(([x, y, z]) => pt(x, y, z)).join(' ');

function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
}
// Mix a color with white (amt > 0) or black (amt < 0).
export function shade(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  const t = amt > 0 ? 255 : 0;
  const a = Math.abs(amt);
  return rgbToHex([r + (t - r) * a, g + (t - g) * a, b + (t - b) * a]);
}

// Material: explicit face colors.
export const MAT = {
  machine: { top: '#FFFFFF', left: '#EFEFF1', right: '#DADADD' },
  machineWarm: { top: '#FAFAFA', left: '#ECECEE', right: '#D6D6D9' },
  floor: { top: '#E9E9EC', left: '#D4D4D8', right: '#C6C6CA' },
  belt: { top: '#3A3637', left: '#656263', right: '#4D4A4B' },
  frame: { top: '#8A8788', left: '#656263', right: '#4D4A4B' },
  dark: { top: '#3A3637', left: '#231F20', right: '#161314' },
  blue: { top: shade(BRAND.blue, 0.22), left: BRAND.blue, right: shade(BRAND.blue, -0.2) },
  deepBlue: { top: shade(BRAND.deepBlue, 0.25), left: BRAND.deepBlue, right: shade(BRAND.deepBlue, -0.25) },
  green: { top: shade(BRAND.green, 0.35), left: BRAND.green, right: shade(BRAND.green, -0.15) },
  paper: { top: '#FFFFFF', left: '#F4F4F5', right: '#E4E4E7' },
};

export function poly(points, fill, extra = '') {
  return `<polygon points="${ptsStr(points)}" fill="${fill}"${extra ? ' ' + extra : ''}/>`;
}

export function box({ x, y, z = 0, w, d, h, mat = MAT.machine, cls = '', id = '', faces = 'tlr' }) {
  const T = [[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]];
  const R = [[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]];
  const L = [[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]];
  let s = '';
  if (faces.includes('l')) s += poly(L, mat.left);
  if (faces.includes('r')) s += poly(R, mat.right);
  if (faces.includes('t')) s += poly(T, mat.top);
  const attrs = [cls && `class="${cls}"`, id && `id="${id}"`].filter(Boolean).join(' ');
  return attrs ? `<g ${attrs}>${s}</g>` : s;
}

// A flat parallelogram on a face, for panels, doors, screens.
// face: 'left' (plane y = y0, spans x,z), 'right' (plane x = x0, spans y,z), 'top' (plane z = z0, spans x,y)
export function panel(face, { x, y, z, u, v, fill, extra = '' }) {
  let p;
  if (face === 'left') p = [[x, y, z], [x + u, y, z], [x + u, y, z + v], [x, y, z + v]];
  else if (face === 'right') p = [[x, y, z], [x, y + u, z], [x, y + u, z + v], [x, y, z + v]];
  else p = [[x, y, z], [x + u, y, z], [x + u, y + v, z], [x, y + v, z]];
  return poly(p, fill, extra);
}

// SVG matrix that maps a 2D drawing (a right, b down) onto an iso face at world point (x,y,z).
export function faceMatrix(face, x, y, z) {
  const [ox, oy] = P(x, y, z);
  if (face === 'left') return `matrix(${r2(C)},${r2(S)},0,1,${r2(ox)},${r2(oy)})`;
  if (face === 'right') return `matrix(${r2(C)},${r2(-S)},0,1,${r2(ox)},${r2(oy)})`;
  return `matrix(${r2(C)},${r2(S)},${r2(-C)},${r2(S)},${r2(ox)},${r2(oy)})`;
}

// Convex hull (monotone chain) for cylinder silhouettes.
function hull(points) {
  const p = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper = [];
  for (const q of p.reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}
const ring = (cx, cy, cz, r, axis, n = 28) => {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const c = Math.cos(a) * r, s = Math.sin(a) * r;
    if (axis === 'z') out.push([cx + c, cy + s, cz]);
    else if (axis === 'y') out.push([cx + c, cy, cz + s]);
    else out.push([cx, cy + c, cz + s]);
  }
  return out;
};
const scr = (arr) => arr.map(([x, y, z]) => P(x, y, z));
const ptsScreen = (arr) => arr.map(([a, b]) => `${r2(a)},${r2(b)}`).join(' ');

// Cylinder along an axis. (x,y,z) is the start-cap center; len extends along +axis.
export function cylinder({ x, y, z = 0, r, len, axis = 'z', side = '#DADADD', cap = '#FFFFFF', cls = '' }) {
  const a = ring(x, y, z, r, axis);
  const end = axis === 'z' ? [x, y, z + len] : axis === 'y' ? [x, y + len, z] : [x + len, y, z];
  const b = ring(end[0], end[1], end[2], r, axis);
  const silhouette = hull(scr(a).concat(scr(b)));
  // visible cap: top for z, near (+y/+x) end otherwise
  const capRing = b;
  return `<g${cls ? ` class="${cls}"` : ''}><polygon points="${ptsScreen(silhouette)}" fill="${side}"/><polygon points="${ptsScreen(scr(capRing))}" fill="${cap}"/></g>`;
}

// Rounded iso slab (platform) using an SVG matrix on a rounded rect.
export function slab({ x, y, w, d, r = 30, thick = 16, mat = MAT.floor, cls = '' }) {
  // Top plane matrix maps (a,b) -> P(x+a, y+b, 0)
  const top = faceMatrix('top', x, y, 0);
  const side = faceMatrix('top', x, y, -thick);
  // track bounds for the four corners + thickness
  P(x, y, 0); P(x + w, y, 0); P(x + w, y + d, 0); P(x, y + d, 0); P(x + w, y + d, -thick); P(x, y + d, -thick); P(x + w, y, -thick);
  return `<g${cls ? ` class="${cls}"` : ''}><rect width="${w}" height="${d}" rx="${r}" transform="${side}" fill="${mat.left}"/><rect width="${w}" height="${d}" rx="${r}" transform="${top}" fill="${mat.top}"/></g>`;
}

// Simple standing person: body cylinder + head.
export function person({ x, y, z = 0, color = BRAND.blue, hair = BRAND.darkGrey, cls = '' }) {
  const body = cylinder({ x, y, z, r: 7, len: 26, side: shade(color, -0.08), cap: shade(color, 0.2) });
  const [hx, hy] = P(x, y, z + 36);
  return `<g${cls ? ` class="${cls}"` : ''}>${body}<circle cx="${r2(hx)}" cy="${r2(hy)}" r="7.5" fill="#E7E7EA"/><path d="M${r2(hx - 7.5)},${r2(hy)} a7.5,7.5 0 0 1 15,0 q-7.5,-3 -15,0z" fill="${hair}"/></g>`;
}

export function viewBoxFromBounds(pad = 16) {
  const b = getBounds();
  return {
    x: Math.floor(b.minX - pad),
    y: Math.floor(b.minY - pad),
    w: Math.ceil(b.maxX - b.minX + pad * 2),
    h: Math.ceil(b.maxY - b.minY + pad * 2),
  };
}

export const screenPoint = (x, y, z = 0) => P(x, y, z).map(r2);
