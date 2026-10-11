// About Us: four history vignettes (brand palette + neutrals only), written to src/svg/about-*.svg.
// Each SVG is drawn in its FINAL state, so the static / reduced-motion page shows the finished
// picture; the motion layer (src/motion/pages/about-vignettes.js) scrubs them from scroll.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BRAND, MAT, P, box, cylinder, shade, faceMatrix, resetBounds } from '../iso.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'svg');
mkdirSync(OUT, { recursive: true });
const r2 = (n) => Math.round(n * 100) / 100;
const W = 360, H = 260;
const svg = (name, body) =>
  writeFileSync(join(OUT, `about-${name}.svg`),
    `<svg class="vig vig--${name}" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">${body}</svg>`);

// Soft iso plinth the props stand on (screen-space ellipse shadow + slab).
const plinth = (cx, cy, rx, ry) =>
  `<ellipse cx="${cx}" cy="${cy + 6}" rx="${rx}" ry="${ry}" fill="#E9E9EC"/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#F2F2F4"/>`;

// Iso car (world units), placed with a screen translate.
function car(tx, ty, cls = '') {
  resetBounds();
  let s = '';
  s += box({ x: 0, y: 0, z: 6, w: 66, d: 32, h: 14, mat: MAT.blue });
  s += box({ x: 16, y: 3, z: 20, w: 32, d: 26, h: 12, mat: MAT.paper });
  // windows on the cabin's left and right faces
  const quad = (pts, fill) => `<polygon points="${pts.map((q) => P(...q).map(r2).join(',')).join(' ')}" fill="${fill}"/>`;
  s += quad([[19, 29, 22], [30, 29, 22], [30, 29, 30], [19, 29, 30]], shade(BRAND.deepBlue, 0.35));
  s += quad([[33, 29, 22], [45, 29, 22], [45, 29, 30], [33, 29, 30]], shade(BRAND.deepBlue, 0.35));
  s += quad([[48, 7, 21], [48, 25, 21], [48, 25, 30], [48, 7, 30]], shade(BRAND.deepBlue, 0.15));
  // wheels
  for (const [x, y] of [[12, 32], [54, 32]]) {
    const [wx, wy] = P(x, y, 5);
    s += `<ellipse cx="${r2(wx)}" cy="${r2(wy)}" rx="7" ry="7.5" fill="${BRAND.darkGrey}"/><ellipse cx="${r2(wx)}" cy="${r2(wy)}" rx="3" ry="3.2" fill="#8A8788"/>`;
  }
  for (const [x, y] of [[54, 0]]) {
    const [wx, wy] = P(x + 12, y, 5);
    s += `<ellipse cx="${r2(wx)}" cy="${r2(wy)}" rx="5.5" ry="6" fill="${BRAND.darkGrey}"/>`;
  }
  // headlight
  const [hx, hy] = P(66, 8, 13);
  s += `<circle cx="${r2(hx)}" cy="${r2(hy)}" r="2.4" fill="${BRAND.green}"/>`;
  return `<g class="${cls}" transform="translate(${tx} ${ty})">${s}</g>`;
}

// Iso database: three stacked discs.
function database(tx, ty, cls = '') {
  let s = '';
  const mats = [MAT.deepBlue, MAT.blue, MAT.deepBlue];
  for (let i = 0; i < 3; i++) {
    s += cylinder({ x: 0, y: 0, z: i * 15, r: 22, len: 12, side: mats[i].left, cap: mats[i].top });
  }
  // data rows on the top cap
  const [cx, cy] = P(0, 0, 42);
  s += `<path d="M${r2(cx - 12)},${r2(cy)} h24 M${r2(cx - 8)},${r2(cy + 5)} h16" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".9"/>`;
  return `<g class="${cls}" transform="translate(${tx} ${ty})">${s}</g>`;
}

const check = (cx, cy, r, cls = '') =>
  `<g class="${cls}" transform="translate(${cx} ${cy})"><circle r="${r}" fill="${BRAND.green}"/><path d="M${-r * 0.42},${r * 0.02} l${r * 0.3},${r * 0.3} l${r * 0.55},${-r * 0.6}" fill="none" stroke="${BRAND.darkGrey}" stroke-width="${r2(r * 0.22)}" stroke-linecap="round" stroke-linejoin="round"/></g>`;

const shield = (cx, cy, s = 1) => {
  const w = 20 * s, h = 24 * s;
  return `M${cx},${cy - h} L${cx + w},${cy - h + 7 * s} V${cy - 2 * s} C${cx + w},${cy + 10 * s} ${cx + 9 * s},${cy + 18 * s} ${cx},${cy + 22 * s} C${cx - 9 * s},${cy + 18 * s} ${cx - w},${cy + 10 * s} ${cx - w},${cy - 2 * s} V${cy - h + 7 * s} Z`;
};

// ---------------------------------------------------------------------------
// 1 · How It Started: a car maker's database, and Rena + Kim → RenKim (1982)
// ---------------------------------------------------------------------------
function started() {
  let s = '';
  // name merge (final: "RenKim" in one tile; JS starts it as two tiles "Rena" + "Kim")
  s += `<rect class="v1-tile-m" x="96" y="18" width="168" height="56" rx="16" fill="#fff" stroke="${BRAND.border}"/>`;
  s += `<g class="v1-tile-l" opacity="0"><rect x="96" y="18" width="110" height="56" rx="16" fill="#fff" stroke="${BRAND.border}"/></g>`;
  s += `<g class="v1-tile-r" opacity="0"><rect x="176" y="18" width="88" height="56" rx="16" fill="#fff" stroke="${BRAND.border}"/></g>`;
  s += `<text class="v1-plus" x="180" y="56" text-anchor="middle" opacity="0">+</text>`;
  s += `<text class="v1-ren" x="180" y="57" text-anchor="end">Ren</text>`;
  s += `<text class="v1-a" x="180" y="57" opacity="0">a</text>`;
  s += `<text class="v1-kim" x="180" y="57">Kim</text>`;
  s += `<text class="v1-year" x="180" y="98" text-anchor="middle">1982</text>`;
  // the client and the database, linked
  s += plinth(110, 196, 86, 30) + plinth(262, 196, 62, 24);
  s += `<path class="v1-link" pathLength="1" d="M150,184 C190,150 222,150 248,170" fill="none" stroke="${BRAND.blue}" stroke-width="2.5" stroke-dasharray="1 1" stroke-dashoffset="0" stroke-linecap="round"/>`;
  s += `<path class="v1-link-dots" d="M150,184 C190,150 222,150 248,170" fill="none" stroke="#fff" stroke-width="2.5" stroke-dasharray="2 7" stroke-linecap="round"/>`;
  s += car(84, 176, 'v1-car');
  s += database(262, 196, 'v1-db');
  s += `<g class="v1-lock" transform="translate(292 150)"><path d="${shield(0, 0, 0.62)}" fill="${BRAND.green}"/><rect x="-5" y="-4" width="10" height="8" rx="1.6" fill="${BRAND.darkGrey}"/><path d="M-3,-4 v-2.5 a3,3 0 0 1 6,0 v2.5" fill="none" stroke="${BRAND.darkGrey}" stroke-width="1.6"/></g>`;
  svg('started', s);
}

// ---------------------------------------------------------------------------
// 2 · 100% Employee Owned: one share splits; every piece is held by an employee
// ---------------------------------------------------------------------------
function esop() {
  let s = '';
  const cx = 180, cy = 92, R = 66, r = 38, n = 12;
  for (let i = 0; i < n; i++) {
    const a0 = ((i / n) * 360 - 90 + 1.4) * (Math.PI / 180);
    const a1 = (((i + 1) / n) * 360 - 90 - 1.4) * (Math.PI / 180);
    const mid = (a0 + a1) / 2;
    const pt = (rad, a) => `${r2(cx + rad * Math.cos(a))},${r2(cy + rad * Math.sin(a))}`;
    const d = `M${pt(R, a0)} A${R},${R} 0 0 1 ${pt(R, a1)} L${pt(r, a1)} A${r},${r} 0 0 0 ${pt(r, a0)} Z`;
    const fill = i % 2 ? BRAND.blue : BRAND.deepBlue;
    const ex = r2(Math.cos(mid) * 6), ey = r2(Math.sin(mid) * 6);
    s += `<path class="v2-w" data-dx="${r2(Math.cos(mid))}" data-dy="${r2(Math.sin(mid))}" transform="translate(${ex} ${ey})" d="${d}" fill="${fill}"/>`;
  }
  s += `<text class="v2-pct" x="${cx}" y="${cy + 6}" text-anchor="middle">100%</text>`;
  s += `<text class="v2-cap" x="${cx}" y="${cy + 22}" text-anchor="middle">ESOP</text>`;
  // the owners
  const colors = [BRAND.blue, BRAND.deepBlue, BRAND.darkGrey, BRAND.blue, BRAND.deepBlue, BRAND.grey];
  for (let i = 0; i < n; i++) {
    const x = 37 + i * 26, y = 222;
    const c = colors[i % colors.length];
    s += `<g class="v2-p" transform="translate(${x} ${y})"><circle cy="-15" r="6.2" fill="#E7E7EA"/><path d="M-6.2,-15 a6.2,6.2 0 0 1 12.4,0 q-6.2,-2.6 -12.4,0z" fill="${BRAND.darkGrey}"/><path d="M-9.5,14 v-12 a9.5,9.5 0 0 1 19,0 v12 z" fill="${c}"/><circle cx="0" cy="3" r="2" fill="${BRAND.green}"/></g>`;
  }
  s += `<path d="M24,242 H336" stroke="${BRAND.border}" stroke-width="2" stroke-linecap="round"/>`;
  svg('esop', s);
}

// ---------------------------------------------------------------------------
// 3 · Adding More Industries: the route branches; compliance shields light up
// ---------------------------------------------------------------------------
function industries() {
  let s = '';
  const bx = 112, by = 98;
  const nodes = [[236, 34], [276, 98], [236, 162]];
  s += `<path class="v3-trunk" pathLength="1" d="M18,${by} H${bx}" fill="none" stroke="${BRAND.blue}" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 1" stroke-dashoffset="0"/>`;
  nodes.forEach(([x, y]) => {
    s += `<path class="v3-b" pathLength="1" d="M${bx},${by} C${bx + 50},${by} ${x - 70},${y} ${x - 22},${y}" fill="none" stroke="${BRAND.blue}" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 1" stroke-dashoffset="0"/>`;
  });
  s += `<circle cx="${bx}" cy="${by}" r="6" fill="#fff" stroke="${BRAND.blue}" stroke-width="3"/>`;
  s += `<circle cx="18" cy="${by}" r="5" fill="${BRAND.blue}"/>`;
  // node glyphs: legal (scales), financial ($), documents
  const glyphs = [
    `<path d="M0,-11 V9 M-8,9 H8 M-12,-6 H12" stroke="#fff" stroke-width="2.2" stroke-linecap="round" fill="none"/><path d="M-12,-6 l-4.5,8 h9 z M12,-6 l-4.5,8 h9 z" fill="#fff"/>`,
    `<text x="0" y="7.5" text-anchor="middle" font-size="22" font-weight="800" fill="#fff">$</text>`,
    `<rect x="-8" y="-11" width="16" height="21" rx="2" fill="#fff"/><path d="M-4,-5 h8 M-4,0 h8 M-4,5 h5" stroke="${BRAND.deepBlue}" stroke-width="1.8" stroke-linecap="round"/>`,
  ];
  nodes.forEach(([x, y], i) => {
    s += `<g class="v3-n" transform="translate(${x} ${y})"><circle r="22" fill="${i === 1 ? BRAND.blue : BRAND.deepBlue}"/>${glyphs[i]}</g>`;
  });
  // compliance shields: operational procedures (gear), physical security (lock), data security (database)
  const icons = [
    `<circle r="5.2" fill="none" stroke="${BRAND.darkGrey}" stroke-width="2.4"/><path d="M0,-9 V-6 M0,6 V9 M-9,0 H-6 M6,0 H9 M-6.4,-6.4 L-4.3,-4.3 M4.3,4.3 L6.4,6.4 M-6.4,6.4 L-4.3,4.3 M4.3,-4.3 L6.4,-6.4" stroke="${BRAND.darkGrey}" stroke-width="2.4" stroke-linecap="round"/>`,
    `<rect x="-7" y="-3" width="14" height="10" rx="2" fill="${BRAND.darkGrey}"/><path d="M-4,-3 v-3 a4,4 0 0 1 8,0 v3" fill="none" stroke="${BRAND.darkGrey}" stroke-width="2.2"/>`,
    `<ellipse cx="0" cy="-6" rx="7" ry="2.6" fill="${BRAND.darkGrey}"/><path d="M-7,-6 v11 a7,2.6 0 0 0 14,0 v-11" fill="none" stroke="${BRAND.darkGrey}" stroke-width="2.2"/><path d="M-7,-0.5 a7,2.6 0 0 0 14,0" fill="none" stroke="${BRAND.darkGrey}" stroke-width="2.2"/>`,
  ];
  [110, 180, 250].forEach((x, i) => {
    const y = 216;
    s += `<g class="v3-s"><path d="${shield(x, y, 1.15)}" fill="#fff" stroke="${BRAND.border}" stroke-width="2"/>`;
    s += `<path class="v3-s-on" d="${shield(x, y, 1.15)}" fill="${BRAND.green}"/>`;
    s += `<g transform="translate(${x} ${y - 6})">${icons[i]}</g></g>`;
  });
  svg('industries', s);
}

// ---------------------------------------------------------------------------
// 4 · 40+ Years of Service: the years count up, the mail stacks up, the first client is still served
// ---------------------------------------------------------------------------
function forty() {
  let s = '';
  s += `<text class="v4-num" x="28" y="104">40+</text>`;
  s += `<text class="v4-label" x="32" y="132">YEARS</text>`;
  // envelope stack (iso)
  resetBounds();
  let stack = '';
  const n = 8;
  for (let i = 0; i < n; i++) {
    const z = i * 6;
    const edge = i % 2 ? MAT.blue : MAT.deepBlue;
    let e = box({ x: 0, y: 0, z, w: 58, d: 40, h: 5, mat: { top: '#FFFFFF', left: edge.left, right: edge.right } });
    // flap + stamp on the top face (drawn in face space: a along x, b along y)
    e += `<g transform="${faceMatrix('top', 0, 0, z + 5)}"><path d="M0,0 L29,21 L58,0 Z" fill="#EFEFF1" stroke="${BRAND.border}" stroke-width="0.8"/><rect x="45" y="27" width="9" height="9" fill="${BRAND.deepBlue}"/><rect x="6" y="28" width="22" height="3" rx="1.5" fill="${BRAND.grey}"/><rect x="6" y="33" width="15" height="3" rx="1.5" fill="${BRAND.border}"/></g>`;
    stack += `<g class="v4-e">${e}</g>`;
  }
  s += plinth(268, 182, 70, 24);
  s += `<g transform="translate(268 176)">${stack}</g>`;
  // the first client, still served
  s += plinth(106, 214, 70, 20);
  s += car(78, 196, 'v4-car');
  s += check(156, 170, 13, 'v4-check');
  svg('forty', s);
}

started();
esop();
industries();
forty();
console.log('about illustrations written');
