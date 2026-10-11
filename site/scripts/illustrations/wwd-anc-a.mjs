// What We Do · anc-a family (addresses and contact data): envelope stills for the static labs,
// one line glyph per ancillary service, and iso houses for the address-validation labs.
// Brand colors with neutral shading only. Writes src/svg/wwd-anc-a-*.svg.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BRAND, MAT, box, panel, poly, cylinder, faceMatrix, shade, resetBounds, viewBoxFromBounds, screenPoint } from '../iso.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'svg');
mkdirSync(OUT, { recursive: true });
const write = (name, svg) => writeFileSync(join(OUT, `wwd-anc-a-${name}.svg`), svg.replace(/\n\s*/g, '\n').trim() + '\n');
const FONT = 'Plus Jakarta Sans, sans-serif';

// ---------------------------------------------------------------------------
// Envelope stills: the same drawing (and coordinates) as the live envelope (src/svg/envelope.svg),
// so the static page shows exactly what the moving envelope ends on in each lab.
// ---------------------------------------------------------------------------
function envStill({ aec = false, badge = false, phone = false, tag = null, strike = false, corrected = false, num = '' } = {}) {
  const tagSvg = tag
    ? `<g transform="translate(0 -50)">
        <rect x="-30" y="-14" width="60" height="28" rx="14" fill="#fff" stroke="${corrected ? BRAND.green : BRAND.border}" stroke-width="1.5"/>
        <path d="M-19,1 l6,-5.5 l6,5.5 v6 h-12z" fill="${BRAND.blue}"/>
        <text x="10" y="6" text-anchor="middle" font-family="${FONT}" font-size="16" font-weight="800" fill="${BRAND.heading}">${tag}</text>
        ${strike ? `<path d="M-2,1 L22,1" stroke="${BRAND.grey}" stroke-width="2" stroke-linecap="round"/>` : ''}
      </g>`
    : '';
  return `<svg class="anc-env" viewBox="-60 -60 120 120" aria-hidden="true" focusable="false">
    <ellipse cx="0" cy="36" rx="28" ry="4" fill="${BRAND.darkGrey}" opacity=".12"/>
    <rect x="-44" y="-29" width="88" height="58" rx="3" fill="#fff" stroke="${BRAND.border}"/>
    <path d="M-44,29 L-6,4 M44,29 L6,4" stroke="${BRAND.border}" fill="none"/>
    <rect x="-32" y="-4" width="42" height="18" rx="2" fill="${BRAND.lightGrey}" stroke="${aec ? BRAND.green : BRAND.border}" stroke-width="${aec ? 1.6 : 1}"/>
    <rect x="-28" y="1" width="18" height="2.4" rx="1.2" fill="${BRAND.darkGrey}"/><rect x="-28" y="6" width="26" height="2.4" rx="1.2" fill="${BRAND.darkGrey}"/>
    ${num ? `<text x="-1" y="5" font-family="${FONT}" font-size="7" font-weight="700" fill="${BRAND.heading}">${num}</text>` : ''}
    ${phone ? `<rect x="-28" y="10" width="4" height="6.5" rx="1" fill="none" stroke="${BRAND.blue}" stroke-width="1.2"/><rect x="-22" y="11.5" width="16" height="2.4" rx="1.2" fill="${BRAND.blue}"/>` : ''}
    ${badge ? `<g transform="translate(-34 -20)"><circle r="6" fill="${BRAND.green}"/><path d="M-3,0 l2,2 l4,-4.2" fill="none" stroke="${BRAND.darkGrey}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></g>` : ''}
    <g transform="translate(30 -17)"><rect x="-9" y="-10" width="18" height="20" fill="#fff"/><rect x="-7" y="-8" width="14" height="16" fill="${BRAND.deepBlue}"/><path d="M-5,3 q2.5,-4 5,0 t5,0" fill="none" stroke="${BRAND.green}" stroke-width="1.3"/><circle cx="0" cy="-3" r="2.4" fill="#fff"/></g>
    <g fill="none" stroke="${BRAND.grey}" stroke-width=".9" opacity=".7"><path d="M-2,-24 q4,-3 8,0 t8,0"/><path d="M-2,-19 q4,-3 8,0 t8,0"/><path d="M-2,-14 q4,-3 8,0 t8,0"/></g>
    <path d="M-44,-29 L0,1 L44,-29 Z" fill="#fff" stroke="${BRAND.border}"/>
    ${tagSvg}
  </svg>`;
}
write('env-aec', envStill({ aec: true, badge: true }));
write('env-cdn', envStill({ aec: true, badge: true, tag: '48', corrected: true }));
write('env-vacant', envStill({ tag: '30', strike: true }));
write('env-return', envStill({ aec: true, tag: '48', corrected: true }));
write('env-phone', envStill({ phone: true, badge: true }));
write('env-line', envStill({ aec: true, badge: true, phone: true }));

// ---------------------------------------------------------------------------
// Service glyphs (24×24 line icons, currentColor) for the landing page's stations and rows.
// ---------------------------------------------------------------------------
const G = {
  aec: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M6.5 10h6M6.5 14h4"/><path d="m14 15.5 1.8 1.8 3.7-4"/>',
  'bankruptcy-deceased': '<path d="M4 6.5h6l2 2h8v9.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18Z"/><path d="M9 14h6"/>',
  'email-verification': '<circle cx="11" cy="12" r="3.2"/><path d="M14.2 12v1.4a2.3 2.3 0 0 0 4.6 0V12a7.8 7.8 0 1 0-3.2 6.3"/>',
  'litigious-scrub': '<path d="M12 4v16M7 20h10M5 7h14"/><path d="m5 7-2.5 6a2.8 2.8 0 0 0 5 0Zm14 0-2.5 6a2.8 2.8 0 0 0 5 0Z"/>',
  lockbox: '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/><path d="M12 14.5v2.5"/>',
  'phone-search': '<rect x="5" y="3" width="9" height="17" rx="2"/><path d="M8.5 17h2"/><circle cx="16.5" cy="13.5" r="3.2"/><path d="m18.8 15.8 2.4 2.4"/>',
  'renkim-360': '<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4.5v4h-4"/><path d="M9 10h6M9 13.5h6M9 17h4"/>',
  'return-mail-processing': '<rect x="3" y="7" width="15" height="11" rx="1.5"/><path d="m3 8 7.5 5L18 8"/><path d="M21 6.5v3.5h-3.5"/><path d="M21 10a5 5 0 0 0-4.5-5"/>',
  'usps-cass-dpv-ncoa': '<path d="M4 11.5 12 5l8 6.5"/><path d="M6 10v9.5h12V10"/><path d="m9.5 14.5 2 2 3.5-3.8"/>',
  'vacant-address-search': '<path d="M4 11.5 12 5l8 6.5"/><path d="M6 10v9.5h12V10" stroke-dasharray="2.2 2"/><path d="m10 13 4 4m0-4-4 4"/>',
  'renkim-reporting': '<path d="M4 20h16"/><path d="M7 16.5v-4M11 16.5v-8M15 16.5v-6M19 16.5V6"/>',
};
for (const [k, d] of Object.entries(G)) {
  write(`icon-${k}`, `<svg class="anc-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`);
}

// ---------------------------------------------------------------------------
// Iso houses (same drawing as the homepage neighborhood) with a mailbox and number plate.
// vacant: dark, boarded windows, an open/empty door, the mailbox flag down.
// ---------------------------------------------------------------------------
const r2 = (n) => Math.round(n * 100) / 100;
function house({ x, y, w = 100, d = 90, h = 70, roof = MAT.blue, num, vacant = false }) {
  const rh = 36, o = 6;
  const win = vacant ? '#9C9CA2' : shade(BRAND.blue, 0.55);
  let s = box({ x, y, w, d, h, mat: vacant ? MAT.machineWarm : MAT.machine });
  s += panel('left', { x: x + 12, y: y + d, z: 28, u: 22, v: 20, fill: win });
  s += panel('left', { x: x + w - 34, y: y + d, z: 28, u: 22, v: 20, fill: win });
  if (vacant) {
    // boards across the windows
    for (const wx of [x + 12, x + w - 34]) s += `<g transform="${faceMatrix('left', wx, y + d, 48)}"><path d="M-1,4 L23,14 M-1,14 L23,4" stroke="${BRAND.grey}" stroke-width="3" stroke-linecap="round"/></g>`;
  }
  s += panel('left', { x: x + w / 2 - 9, y: y + d, z: 0, u: 18, v: 32, fill: vacant ? BRAND.grey : BRAND.deepBlue });
  s += poly([[x - o, y - o, h], [x + w + o, y - o, h], [x + w + o, y + d / 2, h + rh], [x - o, y + d / 2, h + rh]], roof.top);
  s += poly([[x + w, y, h], [x + w, y + d, h], [x + w, y + d / 2, h + rh]], '#E9E9EC');
  s += poly([[x - o, y + d + o, h], [x + w + o, y + d + o, h], [x + w + o, y + d / 2, h + rh], [x - o, y + d / 2, h + rh]], roof.left);
  s += `<g transform="${faceMatrix('left', x + 10, y + d, 66)}"><rect x="0" y="0" width="24" height="15" rx="2" fill="#fff" stroke="${BRAND.border}"/>
    <text x="12" y="11.2" text-anchor="middle" font-family="${FONT}" font-size="10" font-weight="700" fill="${BRAND.heading}">${num}</text></g>`;
  return s;
}
function mailbox({ x, y, flag = true, mat = MAT.machine }) {
  let s = box({ x: x - 1.5, y: y - 1.5, w: 3, d: 3, h: 30, mat: MAT.frame });
  s += box({ x: x - 7, y: y - 14, w: 14, d: 24, h: 13, z: 30, mat });
  s += cylinder({ x, y: y - 14, z: 43, r: 7, len: 24, axis: 'y', side: shade(mat.left, -0.05), cap: mat.top });
  s += `<g transform="${faceMatrix('right', x + 7, y + 2, 40)}"><g transform="rotate(${flag ? 0 : -90})">
        <rect x="-1.2" y="-18" width="2.4" height="18" fill="${BRAND.grey}"/><rect x="-1.2" y="-18" width="10" height="7" fill="${flag ? BRAND.green : '#B8B8BD'}"/></g></g>`;
  return s;
}
const ROOFS = [MAT.deepBlue, MAT.blue, { top: '#B8B8BD', left: '#9C9CA2' }, { top: shade(BRAND.blue, 0.4), left: shade(BRAND.blue, 0.15) }];
const VACANT_ROOF = { top: '#CFCFD3', left: '#B8B8BD' };

// A single lot: house + mailbox on a small slab, with an anchor at the mailbox slot.
function lot({ num, roof, vacant = false, id }) {
  resetBounds();
  let s = `<g>${poly([[-20, -20, 0], [130, -20, 0], [130, 150, 0], [-20, 150, 0]], '#E9E9EC')}`;
  s += poly([[-20, 150, 0], [130, 150, 0], [130, 150, -10], [-20, 150, -10]], '#D4D4D8');
  s += poly([[130, -20, 0], [130, 150, 0], [130, 150, -10], [130, -20, -10]], '#C6C6CA');
  s += house({ x: 0, y: -10, num, roof, vacant });
  s += mailbox({ x: 56, y: 128, flag: !vacant, mat: vacant ? MAT.machineWarm : MAT.blue });
  s += '</g>';
  const slot = screenPoint(56, 140, 37);
  const vb = viewBoxFromBounds(10);
  return `<svg class="anc-house${vacant ? ' anc-house--vacant' : ''}" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}" aria-hidden="true" focusable="false"${id ? ` data-house="${id}"` : ''}>
    ${s}<circle class="anc-anchor" data-anchor="slot" cx="${r2(slot[0])}" cy="${r2(slot[1])}" r="1" fill="none"/></svg>`;
}
write('house-12', lot({ num: 12, roof: MAT.deepBlue }));
write('house-48', lot({ num: 48, roof: MAT.blue }));
write('house-30', lot({ num: 30, roof: ROOFS[2] }));
write('house-30-vacant', lot({ num: 30, roof: VACANT_ROOF, vacant: true }));
write('house-66', lot({ num: 66, roof: ROOFS[3] }));
console.log('wwd-anc-a illustrations written');
