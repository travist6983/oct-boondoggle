// Generates the original isometric illustrations (brand palette only) as SVG files in src/svg/.
// They are inlined into index.html at build time, so every illustration is present in the
// static, reduced-motion page. The motion layer animates groups by id/class.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BRAND, MAT, P, pt, box, panel, poly, cylinder, slab, person, faceMatrix, shade,
  resetBounds, viewBoxFromBounds, screenPoint,
} from './iso.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'svg');
mkdirSync(OUT, { recursive: true });

const r2 = (n) => Math.round(n * 100) / 100;
const sp = (x, y, z) => screenPoint(x, y, z).join(',');

// ---------------------------------------------------------------------------
// Small flat pieces reused in scenes (screen space)
// ---------------------------------------------------------------------------
function flatSheet(cx, cy, s = 1, { printed = true, cls = 'still' } = {}) {
  const w = 30 * s, h = 40 * s, x = cx - w / 2, y = cy - h;
  const bars = printed
    ? `<rect x="${r2(x + 4 * s)}" y="${r2(y + 5 * s)}" width="${r2(10 * s)}" height="${r2(2 * s)}" fill="${BRAND.blue}"/>
       <rect x="${r2(x + 4 * s)}" y="${r2(y + 10 * s)}" width="${r2(16 * s)}" height="${r2(1.6 * s)}" fill="${BRAND.grey}"/>
       <rect x="${r2(x + 4 * s)}" y="${r2(y + 14 * s)}" width="${r2(20 * s)}" height="${r2(1.6 * s)}" fill="${BRAND.grey}"/>
       <rect x="${r2(x + 4 * s)}" y="${r2(y + 20 * s)}" width="${r2(5 * s)}" height="${r2(5 * s)}" fill="${BRAND.blue}"/>
       <rect x="${r2(x + 10 * s)}" y="${r2(y + 20 * s)}" width="${r2(5 * s)}" height="${r2(5 * s)}" fill="${BRAND.deepBlue}"/>
       <rect x="${r2(x + 16 * s)}" y="${r2(y + 20 * s)}" width="${r2(5 * s)}" height="${r2(5 * s)}" fill="${BRAND.green}"/>`
    : '';
  return `<g class="${cls}"><rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" rx="${r2(1.5 * s)}" fill="#fff" stroke="${BRAND.border}" stroke-width="1"/>${bars}</g>`;
}

function flatEnvelope(cx, cy, s = 1, { cls = 'still', stamped = false } = {}) {
  const w = 44 * s, h = 29 * s, x = cx - w / 2, y = cy - h;
  return `<g class="${cls}">
    <rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" rx="${r2(2 * s)}" fill="#fff" stroke="${BRAND.border}"/>
    <path d="M${r2(x)},${r2(y)} L${r2(cx)},${r2(y + h * 0.55)} L${r2(x + w)},${r2(y)}" fill="none" stroke="${BRAND.border}"/>
    <rect x="${r2(x + 7 * s)}" y="${r2(y + 15 * s)}" width="${r2(18 * s)}" height="${r2(7 * s)}" rx="${r2(1 * s)}" fill="${BRAND.lightGrey}" stroke="${BRAND.border}" stroke-width=".8"/>
    ${stamped ? `<rect x="${r2(x + w - 11 * s)}" y="${r2(y + 3 * s)}" width="${r2(7 * s)}" height="${r2(8 * s)}" fill="${BRAND.deepBlue}"/>` : ''}
  </g>`;
}

// ---------------------------------------------------------------------------
// 1. Production line: prep desk (People) → scan gate (Processes) → inkjet printer +
//    inserter (Technology) → phone (digital fork)
// ---------------------------------------------------------------------------
function production() {
  resetBounds();
  const BELT_Y0 = 120, BELT_Y1 = 170, BELT_Z = 18, ROUTE_Y = 145;
  let back = '', mid = '', front = '';

  // Platform + a second small pad for the phone
  back += slab({ x: -40, y: -60, w: 760, d: 290, r: 46, thick: 18 });
  back += slab({ x: 690, y: -160, w: 150, d: 150, r: 60, thick: 14 });

  // Floor tile hairlines
  let tiles = '';
  for (let x = 0; x <= 680; x += 40) tiles += `<line x1="${sp(x, -40, 0).split(',')[0]}" y1="${sp(x, -40, 0).split(',')[1]}" x2="${sp(x, 210, 0).split(',')[0]}" y2="${sp(x, 210, 0).split(',')[1]}"/>`;
  back += `<g stroke="#DCDCE0" stroke-width=".8" opacity=".8">${tiles}</g>`;

  // --- Station 1: prep desk + people (The People)
  back += person({ x: 150, y: 24, color: BRAND.deepBlue, cls: 'ppl ppl-2' });
  back += box({ x: 40, y: 60, w: 120, d: 44, h: 40, mat: MAT.machine });
  back += box({ x: 84, y: 70, w: 6, d: 6, h: 10, z: 40, mat: MAT.frame });
  back += box({ x: 62, y: 72, w: 54, d: 4, h: 36, z: 48, mat: MAT.dark });
  back += panel('left', { x: 65, y: 76, z: 51, u: 48, v: 30, fill: BRAND.deepBlue });
  back += panel('left', { x: 70, y: 76, z: 72, u: 24, v: 3, fill: BRAND.green, extra: 'class="screen-line"' });
  back += panel('left', { x: 70, y: 76, z: 65, u: 34, v: 2.4, fill: shade(BRAND.blue, 0.3) });
  back += panel('left', { x: 70, y: 76, z: 59, u: 20, v: 2.4, fill: shade(BRAND.blue, 0.3) });
  // paper stack on the desk
  back += box({ x: 126, y: 72, w: 24, d: 22, h: 10, z: 40, mat: MAT.paper });

  // --- Station 2: scan gate, back pillar (Processes)
  back += box({ x: 222, y: 104, w: 10, d: 8, h: 98, mat: MAT.machine });

  // --- Station 3: inkjet printer body (Technology)
  back += box({ x: 300, y: 18, w: 170, d: 90, h: 96, mat: MAT.machine, cls: 'printer-body' });
  back += cylinder({ x: 330, y: 26, z: 112, r: 12, len: 74, axis: 'y', side: '#E4E4E7', cap: '#FFFFFF' });
  back += box({ x: 360, y: 26, w: 90, d: 74, h: 6, z: 96, mat: MAT.machineWarm });
  back += panel('left', { x: 312, y: 108, z: 14, u: 62, v: 64, fill: '#E2E2E5' });
  back += panel('left', { x: 384, y: 108, z: 14, u: 62, v: 64, fill: '#E2E2E5' });
  back += panel('left', { x: 368, y: 108, z: 40, u: 3, v: 12, fill: BRAND.grey });
  back += panel('left', { x: 440, y: 108, z: 40, u: 3, v: 12, fill: BRAND.grey });
  back += panel('right', { x: 470, y: 30, z: 52, u: 46, v: 32, fill: BRAND.deepBlue });
  back += panel('right', { x: 470, y: 36, z: 72, u: 30, v: 3, fill: BRAND.green, extra: 'class="status-led"' });
  back += panel('right', { x: 470, y: 36, z: 64, u: 24, v: 2.4, fill: shade(BRAND.blue, 0.35) });
  // printed stacks next to the printer (palette version of the original tiles)
  back += box({ x: 488, y: -40, w: 52, d: 46, h: 30, mat: MAT.paper });
  const tile = (tx, ty, c) => panel('top', { x: tx, y: ty, z: 30, u: 10, v: 10, fill: c });
  back += tile(492, -36, BRAND.blue) + tile(504, -36, BRAND.green) + tile(516, -36, BRAND.deepBlue) + tile(528, -36, BRAND.darkGrey);
  back += tile(492, -22, BRAND.deepBlue) + tile(504, -22, BRAND.blue) + tile(516, -22, BRAND.green) + tile(528, -22, BRAND.blue);
  back += tile(492, -8, BRAND.green) + tile(504, -8, BRAND.darkGrey) + tile(516, -8, BRAND.blue) + tile(528, -8, BRAND.deepBlue);

  // --- Station 4: inserter + envelope hopper
  back += box({ x: 520, y: 40, w: 120, d: 68, h: 70, mat: MAT.machine, cls: 'inserter-body' });
  back += box({ x: 540, y: 52, w: 64, d: 44, h: 22, z: 70, mat: MAT.paper });
  for (let i = 0; i < 4; i++) back += panel('left', { x: 540, y: 96, z: 73 + i * 5, u: 64, v: 0.8, fill: BRAND.border });
  back += panel('left', { x: 530, y: 108, z: 18, u: 40, v: 30, fill: BRAND.blue });
  back += panel('left', { x: 584, y: 108, z: 44, u: 8, v: 8, fill: BRAND.green, extra: 'class="status-led"' });
  back += panel('left', { x: 598, y: 108, z: 44, u: 8, v: 8, fill: BRAND.deepBlue });

  // --- Belt (conveyor)
  mid += box({ x: -10, y: BELT_Y0, w: 660, d: BELT_Y1 - BELT_Y0, h: BELT_Z - 4, mat: MAT.machine });
  mid += box({ x: -10, y: BELT_Y0 + 3, w: 660, d: BELT_Y1 - BELT_Y0 - 6, h: 4, z: BELT_Z - 4, mat: MAT.belt });
  let rollers = '';
  for (let x = 4; x < 650; x += 22) {
    const a = screenPoint(x, BELT_Y0 + 3, BELT_Z), b = screenPoint(x, BELT_Y1 - 3, BELT_Z);
    rollers += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`;
  }
  mid += `<g stroke="#fff" stroke-opacity=".12" stroke-width="1">${rollers}</g>`;

  // Route along the belt (the pinned leg the envelope follows)
  const rA = screenPoint(-10, ROUTE_Y, BELT_Z), rB = screenPoint(650, ROUTE_Y, BELT_Z);
  mid += `<path id="prod-route" class="route-plan route-plan--dark" d="M${rA} L${rB}"/>`;
  mid += `<path id="prod-route-ink" class="route-ink" pathLength="1" d="M${rA} L${rB}"/>`;
  // station anchors (screen points on the route) for the motion layer
  const anchors = { start: -10, people: 96, scan: 227, print: 382, insert: 606, end: 650 };
  for (const [k, x] of Object.entries(anchors)) {
    const [ax, ay] = screenPoint(x, ROUTE_Y, BELT_Z);
    mid += `<circle class="anchor" data-anchor="${k}" cx="${ax}" cy="${ay}" r="0.5" fill="none"/>`;
  }

  // Bridges over the belt (drawn after belt)
  // scan gate beam + front pillar
  front += `<polygon class="scan-light" points="${pt(227, 112, 96)} ${pt(227, 178, 96)} ${pt(227, 178, BELT_Z)} ${pt(227, 112, BELT_Z)}" fill="${BRAND.green}" opacity=".16"/>`;
  front += box({ x: 222, y: 104, w: 10, d: 82, h: 12, z: 96, mat: MAT.deepBlue });
  front += panel('left', { x: 224, y: 186, z: 100, u: 6, v: 4, fill: BRAND.green, extra: 'class="status-led"' });
  front += box({ x: 222, y: 178, w: 10, d: 8, h: 96, mat: MAT.machine });
  // printer head bridge
  front += box({ x: 376, y: 100, w: 14, d: 92, h: 10, z: 104, mat: MAT.deepBlue });
  front += box({ x: 376, y: 184, w: 14, d: 8, h: 104, mat: MAT.machine });
  front += `<g id="print-head">${box({ x: 372, y: 128, w: 22, d: 22, h: 16, z: 88, mat: MAT.blue })}
    <g class="ink-drops" fill="${BRAND.deepBlue}">${[0, 1, 2].map((i) => {
      const [dx, dy] = screenPoint(383, 136 + i * 4, 80 - i * 9);
      return `<circle cx="${dx}" cy="${dy}" r="1.4"/>`;
    }).join('')}</g></g>`;
  // inserter sealing bridge
  front += box({ x: 600, y: 100, w: 14, d: 90, h: 10, z: 72, mat: MAT.frame });
  front += cylinder({ x: 607, y: 112, z: 64, r: 5, len: 66, axis: 'y', side: BRAND.darkGrey, cap: BRAND.grey });
  front += box({ x: 600, y: 182, w: 14, d: 8, h: 72, mat: MAT.machine });

  // people in front of the belt: prep crew + gate monitor
  front += person({ x: 70, y: 200, color: BRAND.blue, cls: 'ppl ppl-1' });
  front += person({ x: 118, y: 212, color: BRAND.deepBlue, cls: 'ppl ppl-4' });
  front += person({ x: 262, y: 206, color: BRAND.grey, cls: 'ppl ppl-3' });

  // --- Phone (digital fork) on its own pad, screen on the right (+x) face
  const PH = { x: 752, y: -128, w: 12, d: 80, h: 140 };
  front += box({ ...PH, mat: MAT.dark });
  front += `<g transform="${faceMatrix('right', PH.x + PH.w, PH.y + PH.d - 5, 132)}">
      <rect x="0" y="0" width="70" height="124" rx="6" fill="${BRAND.deepBlue}"/>
      <rect x="27" y="5" width="16" height="3" rx="1.5" fill="${BRAND.darkGrey}"/>
      <g class="phone-msg phone-msg--sms"><rect x="8" y="22" width="44" height="22" rx="8" fill="${BRAND.green}"/>
        <rect x="14" y="29" width="28" height="2.6" rx="1.3" fill="${BRAND.darkGrey}"/><rect x="14" y="35" width="18" height="2.6" rx="1.3" fill="${BRAND.darkGrey}"/></g>
      <g class="phone-msg phone-msg--email"><rect x="8" y="54" width="54" height="34" rx="4" fill="#fff"/>
        <rect x="13" y="59" width="14" height="10" rx="1" fill="${BRAND.blue}"/><path d="M13,59 l7,5 l7,-5" fill="none" stroke="#fff" stroke-width="1.2"/>
        <rect x="31" y="60" width="26" height="2.6" rx="1.3" fill="${BRAND.darkGrey}"/><rect x="31" y="66" width="18" height="2.6" rx="1.3" fill="${BRAND.grey}"/>
        <rect x="13" y="75" width="44" height="2.4" rx="1.2" fill="${BRAND.border}"/><rect x="13" y="80" width="34" height="2.4" rx="1.2" fill="${BRAND.border}"/></g>
    </g>`;
  P(PH.x + PH.w, PH.y + PH.d - 5 - 70, 132); // bounds for screen face
  const smsTarget = screenPoint(PH.x + PH.w, PH.y + PH.d - 5 - 30 * 0.866, 132 - 33);
  const emailTarget = screenPoint(PH.x + PH.w, PH.y + PH.d - 5 - 35 * 0.866, 132 - 71);
  // fork paths: from the seal point on the belt to the phone screen
  const seal = screenPoint(606, ROUTE_Y, BELT_Z + 40);
  front += `<path id="fork-sms" class="fork-path" d="M${seal} C${r2(seal[0] + 40)},${r2(seal[1] - 160)} ${r2(smsTarget[0] - 120)},${r2(smsTarget[1] - 120)} ${smsTarget}"/>`;
  front += `<path id="fork-email" class="fork-path" d="M${seal} C${r2(seal[0] + 120)},${r2(seal[1] - 40)} ${r2(emailTarget[0] - 80)},${r2(emailTarget[1] + 40)} ${emailTarget}"/>`;
  front += `<circle class="anchor" data-anchor="phone" cx="${smsTarget[0]}" cy="${smsTarget[1]}" r=".5" fill="none"/>`;
  // flying bubbles (positioned by MotionPathPlugin)
  front += `<g id="fly-sms" class="fly"><g transform="scale(1.6)"><rect x="-17" y="-10" width="34" height="20" rx="8" fill="${BRAND.green}"/><path d="M-9,10 l-2,6 l7,-6z" fill="${BRAND.green}"/><circle cx="-7" cy="0" r="2" fill="${BRAND.darkGrey}"/><circle cx="0" cy="0" r="2" fill="${BRAND.darkGrey}"/><circle cx="7" cy="0" r="2" fill="${BRAND.darkGrey}"/></g></g>`;
  front += `<g id="fly-email" class="fly"><g transform="scale(1.6)"><rect x="-18" y="-12" width="36" height="24" rx="3" fill="#fff" stroke="${BRAND.border}"/><path d="M-18,-12 L0,2 L18,-12" fill="none" stroke="${BRAND.blue}" stroke-width="2"/></g></g>`;

  // --- HUD chips at the scan gate (decorative duplicates of USPS CASS · DPV · NCOA)
  const g = screenPoint(227, 182, 40);
  const chips = ['USPS CASS', 'DPV', 'NCOA'];
  let hud = `<g class="hud" font-family="Plus Jakarta Sans, sans-serif" font-size="19" font-weight="700">`;
  chips.forEach((label, i) => {
    const cx = r2(g[0] - 270 - i * 26), cy = r2(g[1] + 30 + i * 46);
    const w = label.length * 12.4 + 48;
    hud += `<g class="hud-chip hud-chip-${i}"><line class="hud-lead" x1="${r2(cx + w)}" y1="${r2(cy + 18)}" x2="${r2(g[0] - 2)}" y2="${r2(g[1] - 6 + i * 8)}" stroke="${BRAND.blue}" stroke-width="1"/>
      <rect x="${cx}" y="${cy}" width="${r2(w)}" height="36" rx="18" fill="#fff" stroke="${BRAND.border}"/>
      <circle cx="${r2(cx + 18)}" cy="${r2(cy + 18)}" r="10" fill="${BRAND.green}"/><path d="M${r2(cx + 13.5)},${r2(cy + 18)} l3.5,3.5 l6,-6.5" fill="none" stroke="${BRAND.darkGrey}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="${r2(cx + 36)}" y="${r2(cy + 24.5)}" fill="${BRAND.heading}">${label}</text></g>`;
  });
  hud += '</g>';
  for (let i = 0; i < 3; i++) { const sx = g[0] - 290 - i * 26, sy = g[1] + 80 + i * 46; P((sx / 0.866 + sy * 2) / 2, (sy * 2 - sx / 0.866) / 2, 0); }
  

  // --- Stills (static/reduced-motion only)
  const stillSheet = screenPoint(450, ROUTE_Y, BELT_Z);
  const stillEnv = screenPoint(630, ROUTE_Y, BELT_Z);
  let stills = flatSheet(stillSheet[0], stillSheet[1], 1.4);
  stills += flatEnvelope(stillEnv[0], stillEnv[1], 1.3);
  stills += `<g class="still"><path d="M${seal} C${r2(seal[0] + 40)},${r2(seal[1] - 160)} ${r2(smsTarget[0] - 120)},${r2(smsTarget[1] - 120)} ${smsTarget}" class="route-plan route-plan--dark"/>
             <path d="M${seal} C${r2(seal[0] + 120)},${r2(seal[1] - 40)} ${r2(emailTarget[0] - 80)},${r2(emailTarget[1] + 40)} ${emailTarget}" class="route-plan route-plan--dark"/></g>`;

  const vb = viewBoxFromBounds(24);
  // widen left for HUD chips
  
  const svg = `<svg class="iso iso--production" viewBox="${vb.x} ${vb.y} ${vb.w + (vb.x < 0 ? 0 : 0)} ${vb.h}" aria-hidden="true" focusable="false">
  <g class="iso-back">${back}</g><g class="iso-mid">${mid}</g><g class="iso-front">${front}</g>${hud}<g class="iso-stills">${stills}</g>
</svg>`;
  writeFileSync(join(OUT, 'production.svg'), fix(svg, vb));
  return vb;
}

// ---------------------------------------------------------------------------
// 2. Neighborhood: houses 12, 30, 48 with mailboxes; wrong route → corrected route → delivery
// ---------------------------------------------------------------------------
function house({ x, y, w = 100, d = 90, h = 70, roof = MAT.blue, num }) {
  const rh = 36, o = 6;
  let s = box({ x, y, w, d, h, mat: MAT.machine });
  // windows + door on the street-facing (+y) face
  s += panel('left', { x: x + 12, y: y + d, z: 28, u: 22, v: 20, fill: shade(BRAND.blue, 0.55) });
  s += panel('left', { x: x + w - 34, y: y + d, z: 28, u: 22, v: 20, fill: shade(BRAND.blue, 0.55) });
  s += panel('left', { x: x + w / 2 - 9, y: y + d, z: 0, u: 18, v: 32, fill: BRAND.deepBlue });
  // roof (gable along x)
  s += poly([[x - o, y - o, h], [x + w + o, y - o, h], [x + w + o, y + d / 2, h + rh], [x - o, y + d / 2, h + rh]], roof.top);
  s += poly([[x + w, y, h], [x + w, y + d, h], [x + w, y + d / 2, h + rh]], '#E9E9EC');
  s += poly([[x - o, y + d + o, h], [x + w + o, y + d + o, h], [x + w + o, y + d / 2, h + rh], [x - o, y + d / 2, h + rh]], roof.left);
  // house number plate on the facade
  s += `<g transform="${faceMatrix('left', x + 10, y + d, 66)}"><rect x="0" y="0" width="22" height="14" rx="2" fill="#fff" stroke="${BRAND.border}"/>
    <text x="11" y="10.5" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="9.5" font-weight="700" fill="${BRAND.heading}">${num}</text></g>`;
  return s;
}

function mailbox({ x, y, num }) {
  // post + box (elongated toward the street), door on +y face, flag on +x face
  let s = box({ x: x - 1.5, y: y - 1.5, w: 3, d: 3, h: 30, mat: MAT.frame });
  s += box({ x: x - 7, y: y - 14, w: 14, d: 24, h: 13, z: 30, mat: num === 48 ? MAT.blue : MAT.machine });
  s += cylinder({ x: x, y: y - 14, z: 43, r: 7, len: 24, axis: 'y', side: num === 48 ? shade(BRAND.blue, -0.1) : '#E2E2E5', cap: num === 48 ? shade(BRAND.blue, 0.15) : '#F4F4F5' });
  s += `<g class="mb-door mb-door-${num}">${panel('left', { x: x - 5.5, y: y + 10, z: 32, u: 11, v: 15, fill: num === 48 ? shade(BRAND.blue, -0.25) : '#D2D2D6' })}</g>`;
  s += `<g transform="${faceMatrix('right', x + 7, y + 2, 40)}"><g class="mb-flag mb-flag-${num}" transform="rotate(${num === 48 ? 0 : -90})">
        <rect x="-1.2" y="-18" width="2.4" height="18" fill="${BRAND.grey}"/><rect x="-1.2" y="-18" width="10" height="7" fill="${BRAND.green}"/></g></g>`;
  return s;
}

function neighborhood() {
  resetBounds();
  let s = '';
  s += slab({ x: -40, y: -50, w: 600, d: 340, r: 50, thick: 18 });
  // sidewalk + curb + street
  s += poly([[-40, 92, 0], [560, 92, 0], [560, 132, 0], [-40, 132, 0]], '#F4F4F5');
  s += poly([[-40, 132, 0], [560, 132, 0], [560, 138, 0], [-40, 138, 0]], '#C6C6CA');
  s += poly([[-40, 138, 0], [560, 138, 0], [560, 226, 0], [-40, 226, 0]], BRAND.grey);
  let dashes = '';
  for (let x = -30; x < 550; x += 40) dashes += poly([[x, 180, 0], [x + 20, 180, 0], [x + 20, 184, 0], [x, 184, 0]], '#FFFFFF', 'opacity=".75"');
  s += dashes;
  s += poly([[-40, 226, 0], [560, 226, 0], [560, 260, 0], [-40, 260, 0]], '#F4F4F5');
  // hedges on the near side
  for (const hx of [10, 150, 300, 440]) s += box({ x: hx, y: 236, w: 70, d: 16, h: 10, mat: { top: '#E2E2E5', left: '#D2D2D6', right: '#C2C2C6' } });

  // houses + mailboxes (far side of the street, facing it)
  s += house({ x: 10, y: -20, num: 12, roof: MAT.deepBlue });
  s += house({ x: 190, y: -20, num: 30, roof: { top: '#B8B8BD', left: '#9C9CA2' } });
  s += house({ x: 370, y: -20, num: 48, roof: MAT.blue });
  s += `<g class="house-dim house-dim-12">${poly([[10, -20, 0], [110, -20, 0], [110, 70, 0], [10, 70, 0]], 'none')}</g>`;
  s += mailbox({ x: 62, y: 116, num: 12 });
  s += mailbox({ x: 242, y: 116, num: 30 });
  s += mailbox({ x: 422, y: 116, num: 48 });

  // routes
  const Z = 6, LANE = 160;
  const a0 = screenPoint(-44, LANE, Z), b = screenPoint(22, LANE, Z);
  const slot12 = screenPoint(62, 128, 37), slot48 = screenPoint(422, 128, 37);
  const turn48 = screenPoint(400, LANE, Z), near48 = screenPoint(422, 142, Z + 10);
  const near12 = screenPoint(62, 142, Z + 10), turn12 = screenPoint(44, LANE, Z);
  const correct = `M${a0} L${b} L${turn48} Q${near48} ${slot48}`;
  const wrong = `M${b} L${turn12} Q${near12} ${slot12}`;
  const routes = `
    <path id="hood-route" class="route-plan route-plan--dark" d="${correct}"/>
    <path id="hood-route-ink" class="route-ink" pathLength="1" d="${correct}"/>
    <path id="hood-wrong" class="route-wrong" pathLength="1" d="${wrong}"/>
    <g class="wrong-x" transform="translate(${slot12[0]},${r2(slot12[1] - 34)})"><circle r="9" fill="#fff" stroke="${BRAND.grey}"/><path d="M-3.5,-3.5 L3.5,3.5 M3.5,-3.5 L-3.5,3.5" stroke="${BRAND.grey}" stroke-width="2" stroke-linecap="round"/></g>
    <g class="return-arrow" transform="translate(${r2(near12[0] - 26)},${r2(near12[1] + 6)})"><path d="M10,-8 A9,9 0 1 0 12,6" fill="none" stroke="${BRAND.grey}" stroke-width="1.8" stroke-linecap="round"/><path d="M12,6 l-1,-6 l-5,3z" fill="${BRAND.grey}"/></g>
    <g class="deliver-check" transform="translate(${slot48[0]},${r2(slot48[1] - 52)})"><circle r="11" fill="${BRAND.green}"/><path d="M-5,0 l3.5,3.5 l6.5,-7" fill="none" stroke="${BRAND.darkGrey}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></g>
    <circle class="anchor" data-anchor="start" cx="${a0[0]}" cy="${a0[1]}" r=".5" fill="none"/>
    <circle class="anchor" data-anchor="mb48" cx="${slot48[0]}" cy="${slot48[1]}" r=".5" fill="none"/>
    <circle class="anchor" data-anchor="mb12" cx="${slot12[0]}" cy="${slot12[1]}" r=".5" fill="none"/>`;
  // still: envelope resting at mailbox 48 with flag up is handled via CSS (.still) + flag class
  const stills = `<g class="iso-stills">${flatEnvelope(slot48[0] - 30, slot48[1] - 10, 0.8, { stamped: true })}</g>`;
  const vb = viewBoxFromBounds(28);
  const svg = `<svg class="iso iso--hood" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}" aria-hidden="true" focusable="false">
  <g id="hood-zoom">${s}${routes}${stills}</g></svg>`;
  writeFileSync(join(OUT, 'neighborhood.svg'), svg);
  return vb;
}

// ---------------------------------------------------------------------------
// 3. Postage/sorting station for the values route
// ---------------------------------------------------------------------------
function postage() {
  resetBounds();
  let s = slab({ x: -20, y: -20, w: 150, d: 120, r: 36, thick: 12 });
  s += box({ x: 0, y: 0, w: 46, d: 38, h: 34, mat: MAT.deepBlue });
  s += box({ x: 4, y: 4, w: 38, d: 30, h: 12, z: 34, mat: MAT.deepBlue });
  for (let i = 0; i < 3; i++) s += box({ x: 6 + i * 12, y: 8, w: 9, d: 22, h: 10, z: 46, mat: MAT.paper });
  s += box({ x: 58, y: 6, w: 54, d: 70, h: 30, mat: MAT.machine });
  s += box({ x: 64, y: 34, w: 42, d: 8, h: 2, z: 30, mat: MAT.dark });
  s += `<g id="stamp-arm">${box({ x: 78, y: 18, w: 14, d: 14, h: 26, z: 30, mat: MAT.blue })}${box({ x: 74, y: 14, w: 22, d: 22, h: 6, z: 56, mat: MAT.blue })}</g>`;
  s += panel('left', { x: 64, y: 76, z: 10, u: 16, v: 10, fill: BRAND.green, extra: 'class="status-led"' });
  s += panel('left', { x: 86, y: 76, z: 12, u: 20, v: 3, fill: BRAND.grey });
  const vb = viewBoxFromBounds(10);
  writeFileSync(join(OUT, 'postage.svg'), `<svg class="iso iso--postage" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}" aria-hidden="true" focusable="false">${s}</svg>`);
}

// ---------------------------------------------------------------------------
// 4. Hero data record (flat UI card) — materializes on load, collapses into a sheet on scroll
// ---------------------------------------------------------------------------
function heroRecord() {
  const rows = [
    [70, 150, BRAND.darkGrey], [54, 190, BRAND.darkGrey], [62, 120, BRAND.darkGrey],
    [46, 96, BRAND.blue], [66, 170, BRAND.darkGrey], [50, 132, BRAND.grey],
  ];
  let rowSvg = '';
  rows.forEach(([lw, vw, c], i) => {
    const y = 120 + i * 40;
    rowSvg += `<g class="rec-row" style="--i:${i}">
      <rect class="rec-bar" x="76" y="${y}" width="${lw}" height="8" rx="4" fill="${BRAND.border}"/>
      <rect class="rec-bar rec-bar--v" x="176" y="${y - 2}" width="${vw}" height="12" rx="6" fill="${c}"/>
      ${i < 5 ? `<line x1="76" x2="444" y1="${y + 24}" y2="${y + 24}" stroke="#F1F1F2"/>` : ''}
    </g>`;
  });
  let bits = '';
  for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) {
    const on = (r * 7 + c * 3) % 4 === 0 || (r + c) % 5 === 0;
    bits += `<rect class="rec-bit" style="--i:${r * 6 + c}" x="${360 + c * 12}" y="${61 + r * 7}" width="8" height="4" rx="1" fill="${on ? BRAND.green : '#fff'}" opacity="${on ? 1 : 0.35}"/>`;
  }
  // check column (verified fields)
  let checks = '';
  [0, 1, 2, 4].forEach((i) => {
    const y = 124 + i * 40;
    checks += `<g class="rec-check" style="--i:${i}" transform="translate(424 ${y})"><circle r="8" fill="${BRAND.green}"/><path d="M-3.5,0 l2.5,2.5 l4.5,-5" fill="none" stroke="${BRAND.darkGrey}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  });
  const svg = `<svg class="hero-art" viewBox="0 0 520 460" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="rk-blue-grad" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${BRAND.deepBlue}"/><stop offset="1" stop-color="${BRAND.blue}"/></linearGradient>
    <clipPath id="rec-clip"><rect x="40" y="40" width="440" height="360" rx="21"/></clipPath>
  </defs>
  <g id="rec-card">
    <rect x="48" y="54" width="440" height="360" rx="21" fill="${BRAND.darkGrey}" opacity=".06"/>
    <rect id="rec-card-bg" x="40" y="40" width="440" height="360" rx="21" fill="#fff" stroke="${BRAND.border}"/>
    <g clip-path="url(#rec-clip)">
      <rect x="40" y="40" width="440" height="56" fill="url(#rk-blue-grad)"/>
      <circle cx="68" cy="68" r="5" fill="#fff" opacity=".9"/><circle cx="84" cy="68" r="5" fill="#fff" opacity=".55"/><circle cx="100" cy="68" r="5" fill="#fff" opacity=".3"/>
      <rect x="124" y="63" width="120" height="10" rx="5" fill="#fff" opacity=".85"/>
      ${bits}
    </g>
    ${rowSvg}${checks}
  </g>
  <g id="rec-sheet" opacity="0">
    <rect x="-30" y="-40" width="60" height="80" rx="2" fill="#fff" stroke="${BRAND.border}"/>
    <rect x="-22" y="-30" width="26" height="3" rx="1.5" fill="${BRAND.grey400 || '#9CA3AF'}"/>
    <rect x="-22" y="-25" width="20" height="3" rx="1.5" fill="#9CA3AF"/>
    <rect x="-22" y="-20" width="23" height="3" rx="1.5" fill="#9CA3AF"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="-22" y="${-6 + i * 6}" width="${[44, 40, 44, 36, 42, 28][i]}" height="2" rx="1" fill="${BRAND.border}"/>`).join('')}
  </g>
</svg>`;
  writeFileSync(join(OUT, 'hero-record.svg'), svg);
}

// Hero background: fine wave lines (the live site's signature), as light SVG instead of a 90 KB PNG
function heroWaves() {
  let paths = '';
  const N = 46;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const x0 = 120 + 640 * t, y3 = 120 + 300 * t;
    paths += `<path d="M${r2(x0)},560 C${r2(560 + 80 * t)},${r2(470 - 160 * t)} ${r2(860 - 60 * t)},${r2(330 + 110 * Math.sin(t * 3.2))} 1320,${r2(y3)}"/>`;
  }
  writeFileSync(join(OUT, 'hero-waves.svg'), `<svg class="hero-waves" viewBox="0 0 1320 560" preserveAspectRatio="xMaxYMax slice" aria-hidden="true" focusable="false"><g fill="none" stroke="${BRAND.blue}" stroke-width=".7" opacity=".28">${paths}</g></svg>`);
}

// ---------------------------------------------------------------------------
// 5. The traveling envelope (flat), all states in one SVG; centered at 0,0
// ---------------------------------------------------------------------------
function envelope() {
  const sheetContent = (id) => `
    <rect x="-30" y="-40" width="60" height="80" rx="2" fill="#fff" stroke="${BRAND.border}"/>
    <g class="env-addr-rough"><rect x="-22" y="-30" width="11" height="3" rx="1.5" fill="#9CA3AF"/><rect x="-9" y="-30" width="13" height="3" rx="1.5" fill="#9CA3AF"/>
      <rect x="-22" y="-25" width="20" height="3" rx="1.5" fill="#9CA3AF" opacity=".55"/><rect x="-22" y="-20" width="9" height="3" rx="1.5" fill="#9CA3AF"/><rect x="-11" y="-20" width="12" height="3" rx="1.5" fill="#9CA3AF" opacity=".55"/></g>
    <g class="env-addr-clean"><rect x="-22" y="-30" width="26" height="3" rx="1.5" fill="${BRAND.darkGrey}"/><rect x="-22" y="-25" width="20" height="3" rx="1.5" fill="${BRAND.darkGrey}"/><rect x="-22" y="-20" width="23" height="3" rx="1.5" fill="${BRAND.darkGrey}"/>
      <circle cx="17" cy="-25" r="5" fill="${BRAND.green}"/><path d="M14.5,-25 l1.8,1.8 l3.4,-3.6" fill="none" stroke="${BRAND.darkGrey}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></g>
    <g class="env-guides">${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="-22" y="${-6 + i * 6}" width="${[44, 40, 44, 36, 42, 28][i]}" height="2" rx="1" fill="${BRAND.border}"/>`).join('')}</g>
    <g class="env-print" clip-path="url(#env-print-clip-${id})">
      <rect x="-30" y="-40" width="60" height="5" fill="${BRAND.blue}"/>
      ${[0, 1, 2, 3].map((i) => `<rect x="-22" y="${-6 + i * 6}" width="${[44, 40, 44, 36][i]}" height="2" rx="1" fill="${BRAND.grey}"/>`).join('')}
      <rect x="-22" y="20" width="9" height="9" fill="${BRAND.blue}"/><rect x="-11" y="20" width="9" height="9" fill="${BRAND.deepBlue}"/><rect x="0" y="20" width="9" height="9" fill="${BRAND.green}"/><rect x="11" y="20" width="9" height="9" fill="${BRAND.darkGrey}"/>
    </g>`;
  const panelDef = (id, y0, y1) => `<clipPath id="env-panel-${id}"><rect x="-32" y="${y0}" width="64" height="${r2(y1 - y0)}"/></clipPath><clipPath id="env-print-clip-${id}"><rect class="env-print-mask" x="-32" y="-42" width="64" height="0"/></clipPath>`;
  const T = -40, A = -13.33, B = 13.33, E = 40;
  const svg = `<svg class="env-svg" viewBox="-60 -60 120 120" aria-hidden="true" focusable="false">
  <defs>${panelDef('t', T - 2, A)}${panelDef('m', A, B)}${panelDef('b', B, E + 2)}</defs>
  <ellipse class="env-shadow" cx="0" cy="48" rx="28" ry="4" fill="${BRAND.darkGrey}" opacity=".12"/>
  <g class="env-flap-back" transform="translate(0 -29) scale(1 -1)"><path d="M-44,0 L0,30 L44,0 Z" fill="#ECECEE" stroke="${BRAND.border}"/></g>
  <g class="env-letter">
    <g class="env-panel env-panel--m" clip-path="url(#env-panel-m)">${sheetContent('m')}</g>
    <g class="env-panel env-panel--t" data-pivot="${A}"><g class="env-face" clip-path="url(#env-panel-t)">${sheetContent('t')}</g><rect class="env-back" x="-30" y="${T}" width="60" height="${r2(A - T)}" fill="#F4F4F5" stroke="${BRAND.border}"/></g>
    <g class="env-panel env-panel--b" data-pivot="${B}"><g class="env-face" clip-path="url(#env-panel-b)">${sheetContent('b')}</g><rect class="env-back" x="-30" y="${B}" width="60" height="${r2(E - B)}" fill="#F4F4F5" stroke="${BRAND.border}"/></g>
    <rect class="env-scan" x="-36" y="-41" width="72" height="2.5" fill="${BRAND.green}"/>
    <rect class="env-scan-glow" x="-36" y="-49" width="72" height="10" fill="${BRAND.green}" opacity=".18"/>
  </g>
  <g class="env-shell">
    <rect x="-44" y="-29" width="88" height="58" rx="3" fill="#fff" stroke="${BRAND.border}"/>
    <path d="M-44,29 L-6,4 M44,29 L6,4" stroke="${BRAND.border}" fill="none"/>
    <rect class="env-window" x="-32" y="-4" width="42" height="18" rx="2" fill="${BRAND.lightGrey}" stroke="${BRAND.border}"/>
    <g class="env-window-addr"><rect x="-28" y="1" width="18" height="2.4" rx="1.2" fill="${BRAND.darkGrey}"/><rect x="-28" y="6" width="26" height="2.4" rx="1.2" fill="${BRAND.darkGrey}"/>
      <text class="env-num" x="-1" y="5" font-family="Plus Jakarta Sans, sans-serif" font-size="7" font-weight="700" fill="${BRAND.heading}">12</text></g>
    <g class="env-phone"><rect x="-28" y="10" width="4" height="6.5" rx="1" fill="none" stroke="${BRAND.blue}" stroke-width="1.2"/><rect x="-22" y="11.5" width="16" height="2.4" rx="1.2" fill="${BRAND.blue}"/></g>
    <g class="env-badge" transform="translate(-34 -20)"><circle r="6" fill="${BRAND.green}"/><path d="M-3,0 l2,2 l4,-4.2" fill="none" stroke="${BRAND.darkGrey}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></g>
    <g class="env-stamp" transform="translate(30 -17)">
      <rect x="-9" y="-10" width="18" height="20" fill="#fff"/>
      <rect x="-9" y="-10" width="18" height="20" fill="none" stroke="#fff" stroke-width="2.4" stroke-dasharray="1.6 1.6"/>
      <rect x="-7" y="-8" width="14" height="16" fill="${BRAND.deepBlue}"/>
      <path d="M-5,3 q2.5,-4 5,0 t5,0" fill="none" stroke="${BRAND.green}" stroke-width="1.3"/>
      <circle cx="0" cy="-3" r="2.4" fill="#fff"/>
    </g>
    <g class="env-cancel" fill="none" stroke="${BRAND.grey}" stroke-width=".9" opacity=".7"><path d="M-2,-24 q4,-3 8,0 t8,0"/><path d="M-2,-19 q4,-3 8,0 t8,0"/><path d="M-2,-14 q4,-3 8,0 t8,0"/></g>
  </g>
  <g class="env-tag" transform="translate(0 -50)">
    <rect class="env-tag-bg" x="-30" y="-14" width="60" height="28" rx="14" fill="#fff" stroke="${BRAND.border}" stroke-width="1.5"/>
    <path d="M-19,1 l6,-5.5 l6,5.5 v6 h-12z" fill="${BRAND.blue}"/>
    <text class="env-tag-num" x="10" y="6" text-anchor="middle" font-family="Plus Jakarta Sans, sans-serif" font-size="16" font-weight="800" fill="${BRAND.heading}">12</text>
    <path class="env-tag-strike" d="M-2,1 L22,1" stroke="${BRAND.grey}" stroke-width="2" stroke-linecap="round"/>
  </g>
  <g class="env-flap-front" transform="translate(0 -29) scale(1 -1)"><path d="M-44,0 L0,30 L44,0 Z" fill="#fff" stroke="${BRAND.border}"/></g>
</svg>`;
  writeFileSync(join(OUT, 'envelope.svg'), svg);
}

// Static envelope icon for the values heading (stamped) — reduced-motion still
function envelopeStill() {
  writeFileSync(join(OUT, 'envelope-still.svg'), `<svg class="env-still" viewBox="0 0 96 66" aria-hidden="true" focusable="false">
  <rect x="2" y="4" width="88" height="58" rx="3" fill="#fff" stroke="${BRAND.border}"/>
  <path d="M2,4 L46,36 L90,4" fill="none" stroke="${BRAND.border}"/>
  <rect x="14" y="36" width="42" height="18" rx="2" fill="${BRAND.lightGrey}" stroke="${BRAND.border}"/>
  <rect x="18" y="41" width="18" height="2.4" rx="1.2" fill="${BRAND.darkGrey}"/><rect x="18" y="46" width="26" height="2.4" rx="1.2" fill="${BRAND.darkGrey}"/>
  <rect x="67" y="10" width="18" height="20" fill="${BRAND.deepBlue}"/><path d="M70,23 q2.5,-4 5,0 t5,0" fill="none" stroke="${BRAND.green}" stroke-width="1.3"/>
</svg>`);
}

// Ensure fractional viewBox is valid
function fix(svg) { return svg; }

const prodVB = production();
neighborhood();
postage();
heroRecord();
heroWaves();
envelope();
envelopeStill();
console.log('illustrations written to src/svg', prodVB);

// Inner-page illustrations: every scripts/illustrations/<page>.mjs writes its own src/svg/<page>-*.svg.
import { readdirSync } from 'node:fs';
const pageDir = join(dirname(fileURLToPath(import.meta.url)), 'illustrations');
for (const f of readdirSync(pageDir).filter((n) => n.endsWith('.mjs')).sort()) await import(join(pageDir, f));
