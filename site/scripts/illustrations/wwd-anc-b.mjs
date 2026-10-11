// Ancillary B labs (Bankruptcy & Deceased, Email Verification, Litigious Scrub, Lockbox, Renkim 360),
// written to src/svg/wwd-anc-b-*.svg. Brand palette + neutrals only; records are abstract bars (no
// names, emails or numbers). Each SVG is drawn in its FINAL state, so the static / reduced-motion
// page shows the finished picture; src/motion/pages/wwd-anc-b-scenes.js scrubs them from scroll.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BRAND } from '../iso.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'svg');
mkdirSync(OUT, { recursive: true });
const W = 800, H = 600;
const r2 = (n) => Math.round(n * 100) / 100;
const B = BRAND;
const SOFT = '#EDEDED', MID = '#B9B7B8', TINT = 'rgba(0,118,192,0.06)', TINT_STROKE = 'rgba(0,118,192,0.28)';

const svg = (name, body) =>
  writeFileSync(join(OUT, `wwd-anc-b-${name}.svg`),
    `<svg class="anc-art wwd-lab__art anc-art--${name}" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">${body}</svg>\n`);

// Dotted lab floor.
const floor = (id) => `<defs><pattern id="${id}" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3" fill="${SOFT}"/></pattern></defs><rect width="${W}" height="${H}" fill="url(#${id})"/>`;

// Positioned group whose base translate the motion layer keeps (data-x / data-y).
const at = (x, y, cls, body, extra = '') => `<g class="${cls}" data-x="${r2(x)}" data-y="${r2(y)}" transform="translate(${r2(x)} ${r2(y)})"${extra}>${body}</g>`;

// Status marks.
const check = (r = 11) => `<circle r="${r}" fill="${B.green}"/><path d="M${r2(-r * 0.45)},${r2(r * 0.05)} l${r2(r * 0.31)},${r2(r * 0.31)} l${r2(r * 0.58)},${r2(-r * 0.64)}" fill="none" stroke="${B.darkGrey}" stroke-width="${r2(Math.max(2, r * 0.22))}" stroke-linecap="round" stroke-linejoin="round"/>`;
const cross = (r = 11) => `<circle r="${r}" fill="${B.grey}"/><path d="M${r2(-r * 0.36)},${r2(-r * 0.36)} l${r2(r * 0.72)},${r2(r * 0.72)} M${r2(r * 0.36)},${r2(-r * 0.36)} l${r2(-r * 0.72)},${r2(r * 0.72)}" stroke="#fff" stroke-width="${r2(Math.max(2, r * 0.2))}" stroke-linecap="round"/>`;

// Glyphs (drawn around 0,0 in a ~20px box, stroke = currentColor-like param).
const G = {
  coinSlash: (c) => `<circle r="7.5" fill="none" stroke="${c}" stroke-width="2"/><path d="M-1.6,-3.6 h3.4 a1.8,1.8 0 0 1 0,3.6 h-3 a1.8,1.8 0 0 0 0,3.6 h3.6 M0,-5.6 v11.2" fill="none" stroke="${c}" stroke-width="1.5" stroke-linecap="round"/><path d="M-8.5,8.5 L8.5,-8.5" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`,
  ribbon: (c) => `<path d="M0,-8 C4.6,-8 4.6,-1.5 0,2.4 C-4.6,-1.5 -4.6,-8 0,-8 Z" fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round"/><path d="M0,2.4 L-5.4,9 M0,2.4 L5.4,9" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`,
  scales: (c) => `<path d="M0,-9 V8 M-6,9 H6 M-9,-5 H9" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/><path d="M-9,-5 L-12.5,2 H-5.5 Z M9,-5 L5.5,2 H12.5 Z" fill="none" stroke="${c}" stroke-width="1.6" stroke-linejoin="round"/><circle cy="-9" r="1.6" fill="${c}"/>`,
  shield: (c, tick = true) => `<path d="M0,-10 L-8,-7 v5.5 c0,5.2 3.4,9.2 8,10.8 c4.6,-1.6 8,-5.6 8,-10.8 V-7 Z" fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round"/>${tick ? `<path d="M-3.6,-0.4 l2.6,2.6 l4.8,-5.2" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` : ''}`,
  lock: (c) => `<rect x="-6.5" y="-2" width="13" height="10" rx="2" fill="${c}"/><path d="M-4,-2 v-3 a4,4 0 0 1 8,0 v3" fill="none" stroke="${c}" stroke-width="2"/>`,
  at: (c) => `<circle r="4" fill="none" stroke="${c}" stroke-width="2"/><path d="M4,-1 v2.6 a2.4,2.4 0 0 0 4.8,0 V0 a8.8,8.8 0 1 0 -3.4,7" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"/>`,
  mail: (c) => `<rect x="-9" y="-6.5" width="18" height="13" rx="2" fill="none" stroke="${c}" stroke-width="2"/><path d="M-8,-5 L0,1.5 L8,-5" fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round"/>`,
  doc: (c) => `<path d="M-7,-9 h9 l5,5 v13 h-14 Z" fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round"/><path d="M-3.5,-1 h7 M-3.5,3 h7" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>`,
  search: (c) => `<circle cx="-2" cy="-2" r="5.5" fill="none" stroke="${c}" stroke-width="2"/><path d="M2,2 L7,7" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/>`,
};

// Abstract person record (avatar + bars + status slot).
function record({ w = 300, h = 62, cls = '', flagged = null, mark = 'ok', fade = false }) {
  const cy = h / 2;
  let s = `<rect x="3" y="5" width="${w}" height="${h}" rx="12" fill="${B.darkGrey}" opacity=".05"/>`;
  s += `<rect class="rec__bg" width="${w}" height="${h}" rx="12" fill="#fff" stroke="${flagged ? TINT_STROKE : B.border}"/>`;
  s += `<g class="rec__body"${fade ? ' opacity=".42"' : ''}>`;
  s += `<circle cx="31" cy="${cy}" r="15" fill="${SOFT}"/><circle cx="31" cy="${cy - 4}" r="5.2" fill="${MID}"/><path d="M21.5,${cy + 10.5} a9.5,7.5 0 0 1 19,0" fill="${MID}"/>`;
  s += `<rect x="58" y="${cy - 11}" width="${r2(w * 0.34)}" height="8" rx="4" fill="${B.darkGrey}"/>`;
  s += `<rect x="58" y="${cy + 4}" width="${r2(w * 0.47)}" height="6" rx="3" fill="${B.border}"/>`;
  s += `</g>`;
  s += `<g class="rec__mark" transform="translate(${w - 30} ${cy})">${mark === 'ok' ? check(11) : `<circle r="12" fill="${B.deepBlue}"/>${G[flagged]('#fff')}`}</g>`;
  return `<g class="rec ${cls}">${s}</g>`;
}

// Small sheet (a letter) used for fly-outs.
const sheet = (w = 26, h = 34) => `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="2.5" fill="#fff" stroke="${B.border}"/><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="4" fill="${B.blue}"/><rect x="${-w / 2 + 4}" y="${-h / 2 + 9}" width="${w * 0.55}" height="2.6" rx="1.3" fill="${B.darkGrey}"/><rect x="${-w / 2 + 4}" y="${-h / 2 + 15}" width="${w * 0.7}" height="2.2" rx="1.1" fill="${B.border}"/><rect x="${-w / 2 + 4}" y="${-h / 2 + 20}" width="${w * 0.6}" height="2.2" rx="1.1" fill="${B.border}"/>`;

// Static envelope (shown only on the static page; the live page has the one traveling envelope).
const envStill = (x, y, k = 1, badge = true) => `<g class="anc-still" transform="translate(${x} ${y}) scale(${k})">
  <ellipse cx="0" cy="40" rx="40" ry="5" fill="${B.darkGrey}" opacity=".08"/>
  <rect x="-44" y="-29" width="88" height="58" rx="3" fill="#fff" stroke="${B.border}"/>
  <path d="M-44,-29 L0,3 L44,-29" fill="none" stroke="${B.border}"/>
  <rect x="-32" y="5" width="40" height="16" rx="2" fill="${B.lightGrey}" stroke="${B.border}"/>
  <rect x="-28" y="9" width="18" height="2.6" rx="1.3" fill="${B.darkGrey}"/><rect x="-28" y="14" width="26" height="2.6" rx="1.3" fill="${B.darkGrey}"/>
  <rect x="22" y="-22" width="16" height="18" fill="${B.deepBlue}"/><path d="M25,-10 q2.5,-4 5,0 t5,0" fill="none" stroke="${B.green}" stroke-width="1.3"/>
  ${badge ? `<g transform="translate(-34 -20)">${check(7)}</g>` : ''}
</g>`;

// ---------------------------------------------------------------------------
// Bankruptcy & Deceased: screen every record before anything is sent.
// Left: six records; a green scan beam passes down them with the envelope riding the lane.
// Clean records send their letter to the outbound tray; flagged ones (bankruptcy, deceased) are
// set aside in a "handled with care" tray marked with the compliance shield.
// ---------------------------------------------------------------------------
export const BD = { rows: 6, x: 36, w: 300, h: 62, y0: 40, gap: 88, flagged: { 1: 'coinSlash', 4: 'ribbon' }, lane: 404, out: { x: 470, y: 40, w: 296, h: 214 }, care: { x: 470, y: 316, w: 296, h: 248 } };
(function bankruptcy() {
  const { rows, x, w, h, y0, gap, flagged, lane, out, care } = BD;
  let s = floor('anc-dots-bd');
  // lane
  s += `<path d="M${lane},24 V576" stroke="${B.blue}" stroke-opacity=".3" stroke-width="2" stroke-dasharray="2 8" stroke-linecap="round"/>`;
  // outbound tray
  s += `<g class="bd-out"><rect x="${out.x}" y="${out.y}" width="${out.w}" height="${out.h}" rx="18" fill="${B.lightGrey}" stroke="${B.border}"/>`;
  s += `<g transform="translate(${out.x + 30} ${out.y + 30})"><circle r="15" fill="${B.blue}"/>${G.mail('#fff')}</g>`;
  s += `<rect x="${out.x + 56}" y="${out.y + 25}" width="96" height="9" rx="4.5" fill="${B.border}"/>`;
  // the tray well
  s += `<rect x="${out.x + 24}" y="${out.y + 66}" width="${out.w - 48}" height="${out.h - 90}" rx="12" fill="#fff" stroke="${B.border}"/></g>`;
  // care tray (flagged) with shield
  s += `<g class="bd-care"><rect x="${care.x}" y="${care.y}" width="${care.w}" height="${care.h}" rx="18" fill="${TINT}" stroke="${TINT_STROKE}" stroke-dasharray="5 6"/>`;
  s += `<g transform="translate(${care.x + 30} ${care.y + 30})"><circle r="15" fill="${B.deepBlue}"/>${G.shield('#fff')}</g>`;
  s += `<rect x="${care.x + 56}" y="${care.y + 25}" width="120" height="9" rx="4.5" fill="${TINT_STROKE}"/></g>`;
  // outbound letters (final positions, stacked)
  const clean = [...Array(rows).keys()].filter((i) => !(i in flagged));
  clean.forEach((i, k) => {
    s += at(out.x + 98 + k * 34, out.y + 140 - k * 4, `bd-sheet bd-sheet-${i}`, `<g transform="rotate(${(k - 1.5) * 4})">${sheet(40, 52)}</g>`);
  });
  // dashed slots left behind by flagged records
  Object.keys(flagged).forEach((i) => {
    const y = y0 + i * gap;
    s += `<rect class="bd-slot bd-slot-${i}" x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="none" stroke="${B.border}" stroke-width="1.5" stroke-dasharray="6 6"/>`;
  });
  // records (clean ones in place; flagged ones drawn in their FINAL spot in the care tray)
  for (let i = 0; i < rows; i++) {
    const y = y0 + i * gap;
    if (i in flagged) {
      const k = Object.keys(flagged).indexOf(String(i));
      const tx = care.x + 22, ty = care.y + 70 + k * 84;
      s += `<g class="bd-rec bd-rec-${i} is-flagged" data-x="${tx}" data-y="${ty}" data-from-x="${x}" data-from-y="${y}" transform="translate(${tx} ${ty}) scale(.84)">${record({ w, h, flagged: flagged[i], mark: 'flag' })}</g>`;
    } else {
      s += at(x, y, `bd-rec bd-rec-${i}`, record({ w, h }));
    }
  }
  // scan beam (hidden on the static page: it rests past the last row)
  s += at(0, 576, 'bd-beam', `<rect x="${x - 10}" y="-13" width="${w + 20}" height="26" rx="13" fill="${B.green}" opacity=".14"/><rect x="${x - 10}" y="-1.5" width="${w + 20}" height="3" rx="1.5" fill="${B.green}"/>`, ' opacity="0"');
  s += envStill(out.x + out.w / 2, out.y + out.h + 30, 0.9);
  svg('bankruptcy', s);
})();

// ---------------------------------------------------------------------------
// Email Verification: the envelope fans email cards out to six addresses. Valid inboxes accept
// (green check); invalid ones bounce the card back (grey cross, dashed branch). A deliverability
// gauge rises with every accepted email.
// ---------------------------------------------------------------------------
export const EV = { hub: [400, 96], pills: [[118, 232], [190, 392], [300, 514], [500, 514], [610, 392], [682, 232]], bad: [1, 4], pw: 176, ph: 56, gauge: [690, 78] };
(function email() {
  const { hub, pills, bad, pw, ph, gauge } = EV;
  let s = floor('anc-dots-ev');
  // send ring around the envelope
  s += `<g class="ev-hub" transform="translate(${hub[0]} ${hub[1]})"><circle r="70" fill="${TINT}" stroke="${TINT_STROKE}" stroke-dasharray="4 7"/><circle r="52" fill="#fff" stroke="${B.border}"/></g>`;
  // branches
  pills.forEach(([cx, cy], i) => {
    const isBad = bad.includes(i);
    const d = `M${hub[0]},${hub[1] + 52} C${hub[0]},${hub[1] + 120} ${cx},${cy - 120} ${cx},${cy - ph / 2}`;
    s += `<path class="ev-plan" d="${d}" fill="none" stroke="${B.blue}" stroke-opacity=".28" stroke-width="2" stroke-dasharray="2 8" stroke-linecap="round"/>`;
    s += `<path class="ev-branch ev-branch-${i}${isBad ? ' is-bad' : ''}" id="ev-branch-${i}" d="${d}" pathLength="1" fill="none" stroke="${isBad ? B.grey : B.blue}" stroke-width="${isBad ? 2 : 3}" stroke-linecap="round"${isBad ? ' stroke-dasharray="0.02 0.03"' : ''}/>`;
  });
  // address pills
  pills.forEach(([cx, cy], i) => {
    const isBad = bad.includes(i);
    let p = `<rect x="${-pw / 2 + 2}" y="${-ph / 2 + 4}" width="${pw}" height="${ph}" rx="${ph / 2}" fill="${B.darkGrey}" opacity=".05"/>`;
    p += `<rect class="ev-pill__bg" x="${-pw / 2}" y="${-ph / 2}" width="${pw}" height="${ph}" rx="${ph / 2}" fill="#fff" stroke="${isBad ? B.border : B.green}" stroke-width="${isBad ? 1 : 2}"/>`;
    p += `<g class="ev-pill__body"${isBad ? ' opacity=".45"' : ''}><g transform="translate(${-pw / 2 + 28} 0)"><circle r="17" fill="${SOFT}"/>${G.at(B.blue)}</g>`;
    p += `<rect x="${-pw / 2 + 54}" y="-10" width="62" height="7" rx="3.5" fill="${B.darkGrey}"/><rect x="${-pw / 2 + 54}" y="4" width="84" height="6" rx="3" fill="${B.border}"/></g>`;
    if (isBad) p += `<path class="ev-strike" d="M${-pw / 2 + 50},0 H${pw / 2 - 40}" stroke="${B.grey}" stroke-width="2" stroke-linecap="round" pathLength="1"/>`;
    p += `<g class="ev-mark" transform="translate(${pw / 2 - 24} 0)">${isBad ? cross(11) : check(11)}</g>`;
    s += at(cx, cy, `ev-pill ev-pill-${i}${isBad ? ' is-bad' : ''}`, p);
  });
  // flying email cards (rest inside the valid inboxes on the static page)
  pills.forEach(([cx, cy], i) => {
    const isBad = bad.includes(i);
    const card = `<rect x="-17" y="-12" width="34" height="24" rx="3" fill="#fff" stroke="${B.blue}" stroke-width="1.5"/><path d="M-15,-10 L0,1 L15,-10" fill="none" stroke="${B.blue}" stroke-width="1.5"/><circle cx="13" cy="-11" r="4" fill="${B.green}"/>`;
    s += at(cx, cy - ph / 2 - 22, `ev-card ev-card-${i}`, card, isBad ? ' opacity="0"' : '');
  });
  // deliverability gauge (no numbers)
  const [gx, gy] = gauge;
  s += `<g class="ev-gauge" transform="translate(${gx} ${gy})"><rect x="-74" y="-58" width="148" height="104" rx="16" fill="#fff" stroke="${B.border}"/>`;
  s += `<path d="M-46,22 A46,46 0 0 1 46,22" fill="none" stroke="${SOFT}" stroke-width="10" stroke-linecap="round"/>`;
  s += `<path class="ev-gauge__fill" d="M-46,22 A46,46 0 0 1 46,22" pathLength="1" fill="none" stroke="${B.green}" stroke-width="10" stroke-linecap="round" stroke-dasharray="0.92 1"/>`;
  s += `<g class="ev-gauge__needle" transform="translate(0 22) rotate(67)"><path d="M0,0 L0,-40" stroke="${B.darkGrey}" stroke-width="3" stroke-linecap="round"/></g><circle cy="22" r="6" fill="${B.darkGrey}"/>`;
  s += `<g transform="translate(-50 -38)">${G.mail(B.blue)}</g><rect x="-34" y="-42" width="50" height="7" rx="3.5" fill="${B.border}"/></g>`;
  s += envStill(hub[0], hub[1], 0.82);
  svg('email', s);
})();

// ---------------------------------------------------------------------------
// Litigious Scrub: a scrub bar (with the scales emblem) passes down the account table. Risky
// accounts are flagged and struck through; the rest are cleared for contact.
// ---------------------------------------------------------------------------
export const LS = { x: 36, y: 36, w: 580, head: 56, rows: 6, rh: 74, flagged: [2, 4], lane: 712 };
(function litigious() {
  const { x, y, w, head, rows, rh, flagged, lane } = LS;
  const tableH = head + rows * rh + 16;
  let s = floor('anc-dots-ls');
  s += `<path d="M${lane},24 V576" stroke="${B.blue}" stroke-opacity=".3" stroke-width="2" stroke-dasharray="2 8" stroke-linecap="round"/>`;
  s += `<g class="ls-table"><rect class="ls-table__shadow" x="${x + 4}" y="${y + 8}" width="${w}" height="${tableH}" rx="20" fill="${B.darkGrey}" opacity=".05"/>`;
  s += `<rect class="ls-table__bg" x="${x}" y="${y}" width="${w}" height="${tableH}" rx="20" fill="#fff" stroke="${B.border}"/>`;
  s += `<path d="M${x},${y + 20} a20,20 0 0 1 20,-20 h${w - 40} a20,20 0 0 1 20,20 v${head - 20} h-${w} Z" fill="${B.blue}"/>`;
  s += `<circle cx="${x + 26}" cy="${y + head / 2}" r="5" fill="#fff" opacity=".9"/><circle cx="${x + 42}" cy="${y + head / 2}" r="5" fill="#fff" opacity=".55"/><circle cx="${x + 58}" cy="${y + head / 2}" r="5" fill="#fff" opacity=".3"/>`;
  s += `<rect x="${x + 82}" y="${y + head / 2 - 5}" width="120" height="10" rx="5" fill="#fff" opacity=".85"/>`;
  s += `<g class="ls-ready" transform="translate(${x + w - 34} ${y + head / 2})">${check(13)}</g></g>`;
  for (let i = 0; i < rows; i++) {
    const ry = y + head + 8 + i * rh;
    const isF = flagged.includes(i);
    let r = '';
    if (i > 0) r += `<path d="M18,0 H${w - 18}" stroke="${SOFT}"/>`;
    r += `<rect class="ls-row__tint" x="8" y="4" width="${w - 16}" height="${rh - 8}" rx="12" fill="${isF ? 'rgba(101,98,99,0.07)' : 'transparent'}"/>`;
    r += `<g class="ls-row__body"${isF ? ' opacity=".4"' : ''}><circle cx="44" cy="${rh / 2}" r="16" fill="${SOFT}"/><circle cx="44" cy="${rh / 2 - 4}" r="5.5" fill="${MID}"/><path d="M34,${rh / 2 + 11} a10,8 0 0 1 20,0" fill="${MID}"/>`;
    r += `<rect x="74" y="${rh / 2 - 11}" width="${110 + (i % 3) * 18}" height="8" rx="4" fill="${B.darkGrey}"/><rect x="74" y="${rh / 2 + 4}" width="${150 - (i % 2) * 24}" height="6" rx="3" fill="${B.border}"/>`;
    r += `<rect x="290" y="${rh / 2 - 4}" width="${120 - (i % 3) * 20}" height="8" rx="4" fill="${B.border}"/></g>`;
    if (isF) r += `<path class="ls-strike" d="M66,${rh / 2} H${w - 70}" pathLength="1" stroke="${B.grey}" stroke-width="2.4" stroke-linecap="round"/>`;
    r += `<g class="ls-mark" transform="translate(${w - 40} ${rh / 2})">${isF ? `<circle r="13" fill="${B.deepBlue}"/>${G.scales('#fff')}` : check(12)}</g>`;
    s += at(x, ry, `ls-row ls-row-${i}${isF ? ' is-flagged' : ''}`, r);
  }
  // scrub bar with the scales emblem; parked below the table on the static page
  const bar = `<rect x="${x - 6}" y="-14" width="${w + 12}" height="28" rx="14" fill="${B.deepBlue}" opacity=".1"/><rect x="${x - 6}" y="-4" width="${w + 12}" height="8" rx="4" fill="${B.deepBlue}"/><rect x="${x - 6}" y="-5" width="${w + 12}" height="2" rx="1" fill="${B.green}"/>
    <path d="M${x + w + 6},0 H${lane - 52}" stroke="${B.deepBlue}" stroke-width="3" stroke-dasharray="3 6" stroke-linecap="round"/>
    <g transform="translate(${x + w + 30} 0)"><circle r="22" fill="${B.deepBlue}"/>${G.scales('#fff')}</g>`;
  s += at(0, y + tableH + 6, 'ls-scrub', bar, ' opacity="0"');
  s += envStill(lane, 300, 0.85);
  svg('litigious', s);
})();

// ---------------------------------------------------------------------------
// Lockbox: the live "Flow of Operations" — Receiving → Processing → Reporting — redrawn.
// ---------------------------------------------------------------------------
export const LB = {
  cols: [140, 400, 660],
  door: [140, 178],
  tray: [140, 324],
  rack: [140, 462],
  scanner: [400, 380],
  bank: [400, 178],
  check: [400, 262],
  ret: [500, 538],
  report: [660, 238],
  ids: [[612, 404], [612, 452], [612, 500]],
};
(function lockbox() {
  const { cols, door, tray, rack, scanner, bank, check: chkAt, ret, report, ids } = LB;
  let s = floor('anc-dots-lb');
  // station labels (text from the live diagram)
  ['Receiving', 'Processing', 'Reporting'].forEach((t, i) => {
    s += `<g class="lb-label lb-label-${i}" transform="translate(${cols[i]} 46)"><rect x="-82" y="-21" width="164" height="42" rx="21" fill="${B.deepBlue}"/><text y="7" text-anchor="middle" fill="#fff" font-size="19" font-weight="600">${t}</text></g>`;
  });
  // flow arcs (Receiving → Processing below, Processing → Reporting above), as in the live diagram
  s += `<path class="lb-arc lb-arc-1" d="M206,512 C238,584 334,584 352,432" pathLength="1" fill="none" stroke="${B.blue}" stroke-width="3" stroke-linecap="round"/><path d="M344,442 l8,-10 l5,12" fill="none" stroke="${B.blue}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lb-arrow lb-arrow-1"/>`;
  s += `<path class="lb-arc lb-arc-2" d="M470,124 C504,78 568,78 600,118" pathLength="1" fill="none" stroke="${B.blue}" stroke-width="3" stroke-linecap="round"/><path d="M590,116 l10,2 l-2,-10" fill="none" stroke="${B.blue}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lb-arrow lb-arrow-2"/>`;

  // RECEIVING · PO box wall
  let box = `<rect x="-78" y="-58" width="156" height="116" rx="12" fill="#fff" stroke="${B.border}"/>`;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const hot = r === 1 && c === 1;
    box += `<rect x="${-66 + c * 46}" y="${-48 + r * 34}" width="40" height="28" rx="4" fill="${hot ? B.blue : B.lightGrey}" stroke="${hot ? B.blue : B.border}"/>`;
    box += `<rect x="${-58 + c * 46}" y="${-38 + r * 34}" width="24" height="3" rx="1.5" fill="${hot ? '#fff' : B.border}"/>`;
  }
  s += at(door[0], door[1], 'lb-pobox', box);
  // incoming payment envelopes (drop into the PO box)
  [-50, 0, 50].forEach((dx, i) => {
    s += at(door[0] + dx, door[1] - 92, `lb-in lb-in-${i}`, `<rect x="-15" y="-10" width="30" height="20" rx="2" fill="#fff" stroke="${B.border}"/><path d="M-15,-10 L0,1 L15,-10" fill="none" stroke="${B.border}"/>`, ' opacity="0"');
  });
  // collection tray
  s += at(tray[0], tray[1], 'lb-tray', `<path d="M-74,-14 h148 l-10,40 h-128 Z" fill="${B.lightGrey}" stroke="${B.border}" stroke-linejoin="round"/><rect x="-46" y="-30" width="30" height="20" rx="2" fill="#fff" stroke="${B.border}" transform="rotate(-6)"/><rect x="-10" y="-32" width="30" height="20" rx="2" fill="#fff" stroke="${B.border}" transform="rotate(4)"/><rect x="22" y="-28" width="30" height="20" rx="2" fill="#fff" stroke="${B.border}" transform="rotate(-3)"/>`);
  // secured sorting rack
  let rack2 = `<rect x="-78" y="-40" width="156" height="84" rx="12" fill="${TINT}" stroke="${TINT_STROKE}"/>`;
  for (let c = 0; c < 3; c++) rack2 += `<rect x="${-62 + c * 44}" y="-24" width="36" height="52" rx="5" fill="#fff" stroke="${B.border}"/><rect class="lb-sorted lb-sorted-${c}" x="${-56 + c * 44}" y="-14" width="24" height="32" rx="2" fill="#fff" stroke="${B.blue}"/>`;
  rack2 += `<g transform="translate(66 -36)"><circle r="14" fill="${B.deepBlue}"/>${G.lock('#fff')}</g>`;
  s += at(rack[0], rack[1], 'lb-rack', rack2);

  // PROCESSING · scanner, payment check, bank, non-payment mailed back
  let scan = `<rect x="-86" y="-34" width="172" height="68" rx="12" fill="#fff" stroke="${B.border}"/><rect x="-72" y="-20" width="144" height="40" rx="6" fill="${B.lightGrey}" stroke="${B.border}"/><circle cx="66" cy="-24" r="4" fill="${B.green}"/>`;
  s += at(scanner[0], scanner[1], 'lb-scanner', scan);
  s += at(scanner[0], scanner[1], 'lb-beam', `<rect x="-3" y="-20" width="6" height="40" fill="${B.green}"/><rect x="-14" y="-20" width="28" height="40" fill="${B.green}" opacity=".14"/>`, ' opacity="0"');
  // the payment check (final: deposited at the bank)
  const chk = `<rect x="-38" y="-17" width="76" height="34" rx="3" fill="#fff" stroke="${B.blue}" stroke-width="1.5"/><rect x="-32" y="-11" width="30" height="4" rx="2" fill="${B.darkGrey}"/><rect x="-32" y="-3" width="44" height="3" rx="1.5" fill="${B.border}"/><path d="M-32,9 h6 m3,0 h6 m3,0 h10 m3,0 h6" stroke="${B.deepBlue}" stroke-width="2.4"/><circle cx="26" cy="-6" r="6" fill="none" stroke="${B.green}" stroke-width="2"/>`;
  s += at(chkAt[0], chkAt[1], 'lb-check', chk);
  // bank
  let bk = `<path d="M-58,-26 L0,-56 L58,-26 Z" fill="${B.blue}"/><rect x="-58" y="-26" width="116" height="8" fill="${B.deepBlue}"/>`;
  for (let c = 0; c < 4; c++) bk += `<rect x="${-46 + c * 28}" y="-14" width="12" height="42" rx="2" fill="#fff" stroke="${B.border}"/>`;
  bk += `<rect x="-62" y="28" width="124" height="10" rx="3" fill="${B.deepBlue}"/>`;
  bk += `<g class="lb-deposit" transform="translate(52 -50)">${check(12)}</g>`;
  s += at(bank[0], bank[1], 'lb-bank', bk);
  // deposit link (scanner → bank)
  s += `<path class="lb-wire" d="M${scanner[0]},${scanner[1] - 36} V${chkAt[1] + 20}" fill="none" stroke="${B.green}" stroke-width="3" stroke-dasharray="3 7" stroke-linecap="round"/>`;
  // non-payment: scanned and mailed back (return arrow out of the scanner)
  s += `<path class="lb-return-path" d="M${scanner[0] + 88},${scanner[1] + 8} C${scanner[0] + 140},${scanner[1] + 30} ${scanner[0] + 140},${ret[1] - 50} ${ret[0] + 6},${ret[1] - 14}" fill="none" stroke="${B.grey}" stroke-width="2.4" stroke-dasharray="3 6" stroke-linecap="round"/>`;
  s += at(ret[0], ret[1], 'lb-ret', `<rect x="-17" y="-11" width="34" height="22" rx="2" fill="#fff" stroke="${B.grey}"/><path d="M-17,-11 L0,1 L17,-11" fill="none" stroke="${B.grey}"/><path d="M-26,0 h-10 m4,-4 l-4,4 l4,4" fill="none" stroke="${B.grey}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`);

  // REPORTING · daily report + batch IDs
  let rep = `<rect x="-82" y="-104" width="164" height="208" rx="10" fill="#fff" stroke="${B.border}"/><rect x="-82" y="-104" width="164" height="10" rx="5" fill="${B.blue}"/>`;
  rep += `<rect x="-64" y="-80" width="70" height="8" rx="4" fill="${B.darkGrey}"/><rect x="-64" y="-64" width="104" height="5" rx="2.5" fill="${B.border}"/>`;
  rep += `<path d="M-64,62 H64" stroke="${B.border}" stroke-width="2"/>`;
  [[-50, 70], [-16, 98], [18, 84], [52, 112]].forEach(([bx, bh], i) => {
    rep += `<rect class="lb-bar lb-bar-${i}" data-h="${bh}" x="${bx - 11}" y="${62 - bh}" width="22" height="${bh}" rx="3" fill="${i % 2 ? B.blue : B.deepBlue}"/>`;
  });
  rep += `<rect x="-64" y="74" width="128" height="5" rx="2.5" fill="${B.border}"/><rect x="-64" y="86" width="90" height="5" rx="2.5" fill="${B.border}"/>`;
  rep += `<g class="lb-confirm" transform="translate(64 -82)">${check(13)}</g>`;
  s += at(report[0], report[1], 'lb-report', rep);
  ids.forEach(([ix, iy], i) => {
    let tag = `<rect x="-58" y="-18" width="148" height="36" rx="18" fill="#fff" stroke="${B.border}"/><path d="M-40,-8 v16 M-35,-8 v16 M-31,-8 v16 M-25,-8 v16 M-20,-8 v16 M-16,-8 v16" stroke="${B.darkGrey}" stroke-width="2"/><rect x="-4" y="-5" width="${54 - i * 8}" height="10" rx="5" fill="${B.border}"/>`;
    tag += `<g class="lb-id-mark" transform="translate(70 0)">${check(10)}</g>`;
    s += at(ix, iy, `lb-id lb-id-${i}`, tag);
  });
  s += envStill(532, 300, 0.56);
  svg('lockbox', s);
})();

// ---------------------------------------------------------------------------
// Renkim 360: the full circle — document creation → print & eNotice → the recipient's mailbox →
// archived in Renkim 360 — around a secure, searchable portal; the archive shelf keeps up to
// seven years.
// ---------------------------------------------------------------------------
export const R3 = { c: [430, 304], r: 210, nodes: { top: [430, 94], right: [640, 304], bottom: [430, 514], left: [220, 304] }, shelf: [62, 136], portal: [430, 304] };
(function r360() {
  const { c, r, nodes, shelf } = R3;
  let s = floor('anc-dots-r3');
  // the ring: dashed plan + ink (full on the static page)
  const ring = `M${c[0]},${c[1] - r} A${r},${r} 0 1 1 ${c[0] - 0.01},${c[1] - r}`;
  s += `<path d="${ring}" fill="none" stroke="${B.blue}" stroke-opacity=".3" stroke-width="2" stroke-dasharray="2 8" stroke-linecap="round"/>`;
  s += `<path class="r3-ring" id="r3-ring" d="${ring}" pathLength="1" fill="none" stroke="${B.blue}" stroke-width="3" stroke-linecap="round"/>`;
  // nodes
  const node = (key, glyph, extra = '') => {
    const [x, y] = nodes[key];
    return at(x, y, `r3-node r3-node--${key}`, `<circle r="44" fill="#fff" stroke="${B.border}"/><circle class="r3-node__ring" r="44" fill="none" stroke="${B.green}" stroke-width="3"/>${glyph}${extra}`);
  };
  // creation: a data sheet being generated
  s += node('top', `<g transform="translate(0 -2)"><rect x="-17" y="-22" width="34" height="44" rx="3" fill="#fff" stroke="${B.blue}" stroke-width="2"/><rect x="-11" y="-14" width="16" height="4" rx="2" fill="${B.darkGrey}"/><rect class="r3-gen" x="-11" y="-5" width="22" height="3" rx="1.5" fill="${B.border}"/><rect class="r3-gen" x="-11" y="2" width="18" height="3" rx="1.5" fill="${B.border}"/><rect class="r3-gen" x="-11" y="9" width="22" height="3" rx="1.5" fill="${B.border}"/></g>`);
  // print & eNotice: printed sheet + email card
  s += node('right', `<g transform="translate(-8 4)"><rect x="-16" y="-8" width="32" height="18" rx="3" fill="${B.deepBlue}"/><rect x="-11" y="-22" width="22" height="16" rx="1" fill="#fff" stroke="${B.border}"/><rect class="r3-print" x="-10" y="6" width="20" height="16" rx="1" fill="#fff" stroke="${B.border}"/></g><g class="r3-enotice" transform="translate(18 -14)"><rect x="-12" y="-8" width="24" height="16" rx="2.5" fill="#fff" stroke="${B.blue}" stroke-width="1.5"/><path d="M-11,-7 L0,1 L11,-7" fill="none" stroke="${B.blue}" stroke-width="1.5"/></g>`);
  // the recipient's mailbox (flag rises)
  s += node('bottom', `<g transform="translate(-4 6)"><path d="M-20,-4 a12,12 0 0 1 12,-12 h22 a8,8 0 0 1 8,8 v20 h-42 Z" fill="${B.blue}"/><rect x="-3" y="12" width="6" height="16" fill="${B.grey}"/><g class="r3-flag" transform="translate(16 -10)"><rect x="0" y="-16" width="3" height="18" fill="${B.grey}"/><rect x="0" y="-16" width="12" height="7" fill="${B.green}"/></g></g>`);
  // archive vault (Renkim 360)
  s += node('left', `<g><rect x="-20" y="-20" width="40" height="40" rx="6" fill="${B.deepBlue}"/><circle r="9" fill="none" stroke="#fff" stroke-width="2.4"/><path d="M0,-9 v4 M0,5 v4 M-9,0 h4 M5,0 h4" stroke="#fff" stroke-width="2"/></g>`);
  // the shelf: up to seven years (seven slots, no labels)
  let sh = `<rect x="-36" y="-16" width="72" height="352" rx="12" fill="#fff" stroke="${B.border}"/><g transform="translate(0 -2)">${G.lock(B.deepBlue)}</g>`;
  for (let i = 0; i < 7; i++) sh += `<rect x="-24" y="${14 + i * 44}" width="48" height="34" rx="5" fill="${B.lightGrey}" stroke="${B.border}"/><g class="r3-slot r3-slot-${i}" transform="translate(0 ${31 + i * 44})"><rect x="-17" y="-12" width="34" height="24" rx="2" fill="#fff" stroke="${B.blue}" stroke-width="1.5"/><rect x="-11" y="-6" width="14" height="3" rx="1.5" fill="${B.deepBlue}"/><rect x="-11" y="1" width="20" height="2.6" rx="1.3" fill="${B.border}"/></g>`;
  s += at(shelf[0], shelf[1], 'r3-shelf', sh);
  // portal (center): branded, searchable, 24×7
  let pt = `<rect x="-118" y="-92" width="236" height="184" rx="14" fill="${B.darkGrey}" opacity=".05" transform="translate(4 7)"/><rect x="-118" y="-92" width="236" height="184" rx="14" fill="#fff" stroke="${B.border}"/>`;
  pt += `<path d="M-118,-78 a14,14 0 0 1 14,-14 h208 a14,14 0 0 1 14,14 v16 h-236 Z" fill="${B.blue}"/><circle cx="-102" cy="-77" r="3.5" fill="#fff" opacity=".9"/><circle cx="-90" cy="-77" r="3.5" fill="#fff" opacity=".55"/><circle cx="-78" cy="-77" r="3.5" fill="#fff" opacity=".3"/>`;
  pt += `<rect x="-100" y="-50" width="200" height="28" rx="14" fill="${B.lightGrey}" stroke="${B.border}"/><g transform="translate(-82 -36) scale(.8)">${G.search(B.blue)}</g><rect class="r3-query" x="-66" y="-40" width="96" height="8" rx="4" fill="${B.darkGrey}"/>`;
  for (let i = 0; i < 4; i++) {
    pt += `<g class="r3-res r3-res-${i}" transform="translate(0 ${-4 + i * 22})"><rect class="r3-res__bg" x="-100" y="-9" width="200" height="18" rx="5" fill="${i === 0 ? 'rgba(0,255,132,0.16)' : '#fff'}"/><g transform="translate(-88 0) scale(.6)">${G.doc(B.blue)}</g><rect x="-74" y="-3" width="${70 - i * 8}" height="6" rx="3" fill="${i === 0 ? B.darkGrey : B.border}"/><rect x="${10 - i * 4}" y="-3" width="40" height="6" rx="3" fill="${B.border}"/></g>`;
  }
  pt += `<g class="r3-found" transform="translate(88 -4)">${check(8)}</g>`;
  // 24×7 badge (from the copy)
  pt += `<g class="r3-clock" transform="translate(104 -98)"><circle r="26" fill="${B.deepBlue}"/><circle r="26" fill="none" stroke="${B.green}" stroke-width="3"/><text y="5" text-anchor="middle" fill="#fff" font-size="13" font-weight="700">24×7</text></g>`;
  s += at(c[0], c[1], 'r3-portal', pt);
  s += envStill(nodes.top[0] + 74, nodes.top[1] - 40, 0.62);
  svg('r360', s);
})();

console.log('wwd-anc-b labs written');
