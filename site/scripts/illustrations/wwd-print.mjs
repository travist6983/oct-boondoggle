// Print & Mail family labs (brand palette + neutrals only). Writes src/svg/wwd-print-*.svg.
// Each lab is a 1200 × 800 scene. The markup is the finished (static / reduced-motion) state;
// the motion layer (src/motion/pages/wwd-print.js) rewinds and replays it from scroll.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BRAND, shade } from '../iso.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'svg');
mkdirSync(OUT, { recursive: true });
const write = (name, svg) => writeFileSync(join(OUT, `wwd-print-${name}.svg`), svg.trim().replace(/\n\s*/g, '\n') + '\n');
const r1 = (n) => Math.round(n * 10) / 10;

const C = {
  ...BRAND,
  machine: '#E9EAEE',
  machineDark: '#DADCE1',
  bed: '#F7F7F7',
  back: '#F1F2F4',
  ink: BRAND.darkGrey,
  mute: '#9CA3AF',
};
const FONT = `font-family="Plus Jakarta Sans, PJS Fallback, system-ui, sans-serif"`;

// Lab backdrop: a faint dot grid ("drafting table") under every scene.
const grid = (id) => `<pattern id="${id}" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="14" cy="14" r="1.6" fill="#E3E5EA"/></pattern>`;
const backdrop = (id) => `<rect width="1200" height="800" fill="url(#${id})"/>`;

const check = (cx, cy, r, cls = '') => `<g class="${cls}" transform="translate(${cx} ${cy})"><circle r="${r}" fill="${C.green}"/>
  <path d="M${r1(-r * 0.45)},${r1(r * 0.02)} l${r1(r * 0.3)},${r1(r * 0.3)} l${r1(r * 0.6)},${r1(-r * 0.62)}" fill="none" stroke="${C.ink}" stroke-width="${r1(r * 0.22)}" stroke-linecap="round" stroke-linejoin="round"/></g>`;

// Print head carriage spanning [x, x + w] (drawn at y; the motion layer translates it).
const head = (x, y, w, cls) => `<g class="${cls}">
  <rect x="${x}" y="${y}" width="${w}" height="30" rx="9" fill="${C.deepBlue}"/>
  <rect x="${x}" y="${y}" width="${w}" height="10" rx="5" fill="${shade(C.deepBlue, 0.24)}"/>
  <rect x="${x + 18}" y="${y + 8}" width="46" height="5" rx="2.5" fill="${C.green}"/>
  <rect x="${x + w - 64}" y="${y + 7}" width="46" height="15" rx="4" fill="${shade(C.deepBlue, -0.3)}"/>
  <g fill="${C.blue}">${Array.from({ length: Math.floor((w - 40) / 13) }, (_, i) => `<rect x="${x + 22 + i * 13}" y="${y + 30}" width="6" height="5" rx="1"/>`).join('')}</g>
  <rect x="${x + 2}" y="${y + 38}" width="${w - 4}" height="3" rx="1.5" fill="${C.blue}" opacity=".8"/>
</g>`;

// ---------------------------------------------------------------------------
// 1. Print Document: press → tri-fold → inserter → sealed envelope.
// ---------------------------------------------------------------------------
{
  const SX = 187.5, SY = 150, SW = 285, SH = 380; // sheet box
  const F1 = SH / 3, F2 = (SH * 2) / 3; // fold lines (sheet coords)
  // Sheet content in sheet coords (0..SW × 0..SH): blank guides + the full-colour print layer.
  const blank = `<rect width="${SW}" height="${SH}" rx="4" fill="#fff" stroke="${C.border}" stroke-width="2"/>
    <g fill="${C.border}">${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="30" y="${150 + i * 22}" width="${[220, 200, 225, 180, 210, 150, 205, 120][i]}" height="7" rx="3.5"/>`).join('')}</g>`;
  const bars = [62, 96, 74, 118, 88];
  const printed = `<path d="M4,0 h${SW - 8} a4,4 0 0 1 4,4 v28 h-${SW} v-28 a4,4 0 0 1 4,-4z" fill="${C.blue}"/>
    <rect x="22" y="10" width="54" height="12" rx="6" fill="#fff" opacity=".85"/>
    <g fill="${C.ink}"><rect x="30" y="54" width="120" height="10" rx="5"/><rect x="30" y="72" width="92" height="10" rx="5"/><rect x="30" y="90" width="108" height="10" rx="5"/></g>
    ${check(SW - 46, 74, 17)}
    <g>${bars.map((h, i) => `<rect x="${32 + i * 26}" y="${236 - h}" width="18" height="${h}" rx="3" fill="${[C.blue, C.deepBlue, C.green, C.blue, C.ink][i]}"/>`).join('')}
      <rect x="28" y="238" width="134" height="3" rx="1.5" fill="${C.border}"/></g>
    <g transform="translate(218 190)" fill="none" stroke-width="18"><circle r="36" stroke="${C.blue}"/>
      <circle r="36" stroke="${C.green}" stroke-dasharray="70 400" transform="rotate(-90)"/><circle r="36" stroke="${C.deepBlue}" stroke-dasharray="46 400" stroke-dashoffset="-70" transform="rotate(-90)"/></g>
    <g fill="${C.grey}">${[0, 1, 2, 3, 4].map((i) => `<rect x="30" y="${266 + i * 18}" width="${[226, 204, 218, 168, 192][i]}" height="6" rx="3"/>`).join('')}</g>
    <g fill="${C.ink}">${Array.from({ length: 30 }, (_, i) => `<rect x="${30 + i * 7.6}" y="356" width="${[3, 1.6, 2.4, 1.2, 4][i % 5]}" height="14"/>`).join('')}</g>`;
  const panel = (name, y, h) => `<clipPath id="pd-clip-${name}"><rect y="${y}" width="${SW}" height="${h}"/></clipPath>`;
  const faces = `<use href="#pd-sheet-art"/>`;

  write('press', `<svg class="wwd-lab__art pm-art pm-art--press" viewBox="0 0 1200 800" aria-hidden="true" focusable="false">
  <defs>
    <clipPath id="pd-print-clip"><rect class="pd-print-mask" width="${SW}" height="${SH}"/></clipPath>
    ${panel('t', 0, F1)}${panel('m', F1, F1)}${panel('b', F2, SH - F2)}
    <g id="pd-sheet-art">${blank}<g clip-path="url(#pd-print-clip)">${printed}</g></g>
    ${grid('pd-grid')}
  </defs>
  ${backdrop('pd-grid')}
  <rect x="40" y="630" width="1120" height="112" rx="40" fill="#F2F3F5"/>
  <!-- paper stock (on-demand colour printing replaces pre-printed inventory) -->
  <g>${[0, 1, 2, 3, 4].map((i) => `<rect x="${52 + i * 2}" y="${520 - i * 9}" width="64" height="86" rx="4" fill="#fff" stroke="${C.border}" stroke-width="2"/>`).join('')}
    <rect x="44" y="606" width="88" height="14" rx="7" fill="${C.machineDark}"/></g>
  <!-- press -->
  <rect x="130" y="96" width="400" height="548" rx="28" fill="${C.machine}"/>
  <rect x="130" y="610" width="400" height="34" rx="17" fill="${C.machineDark}"/>
  <rect x="160" y="132" width="340" height="468" rx="16" fill="${C.bed}" stroke="${C.border}" stroke-width="2"/>
  <g>${[C.blue, C.deepBlue, C.green, C.ink].map((c, i) => `<rect x="${196 + i * 72}" y="604" width="52" height="16" rx="8" fill="${c}"/>`).join('')}</g>
  <rect x="226" y="80" width="208" height="22" rx="11" fill="${C.ink}"/>
  <rect x="246" y="87" width="168" height="5" rx="2.5" fill="${C.grey}"/>
  <!-- inserter -->
  <rect x="588" y="430" width="564" height="176" rx="26" fill="${C.machine}"/>
  <rect x="588" y="574" width="564" height="32" rx="16" fill="${C.machineDark}"/>
  <rect x="588" y="408" width="564" height="34" rx="14" fill="${C.machineDark}"/>
  <g class="pd-belt"><rect x="604" y="392" width="350" height="20" rx="10" fill="${C.ink}"/>
    <g class="pd-belt-ticks" fill="${C.grey}">${Array.from({ length: 14 }, (_, i) => `<rect x="${618 + i * 24}" y="399" width="12" height="6" rx="3"/>`).join('')}</g>
    <circle cx="614" cy="402" r="12" fill="${C.grey}"/><circle cx="944" cy="402" r="12" fill="${C.grey}"/></g>
  <g fill="${C.border}"><rect x="640" y="470" width="150" height="12" rx="6"/><rect x="640" y="494" width="110" height="12" rx="6"/></g>
  <g><rect x="972" y="458" width="150" height="74" rx="12" fill="${C.deepBlue}"/>
    <g fill="${C.green}"><rect x="990" y="476" width="70" height="8" rx="4"/><rect x="990" y="492" width="96" height="8" rx="4" opacity=".7"/><rect x="990" y="508" width="54" height="8" rx="4" opacity=".45"/></g>
    ${check(1096, 486, 13)}</g>
  <!-- the envelope on the inserter deck: its flap opens to the left (inside face showing) -->
  <path class="pd-flap-open" d="M930,268 L862,338 L930,408 Z" fill="${C.back}" stroke="${C.border}" stroke-width="2"/>
  <!-- the sheet: three panels so it can tri-fold (sheet coords, placed by .pd-letter) -->
  <g class="pd-letter" transform="translate(${SX} ${SY})">
    <g class="pd-panel pd-panel--m"><g clip-path="url(#pd-clip-m)">${faces}</g></g>
    <g class="pd-panel pd-panel--t"><g class="pd-face" clip-path="url(#pd-clip-t)">${faces}</g><rect class="pd-back" width="${SW}" height="${r1(F1)}" fill="${C.back}" stroke="${C.border}" stroke-width="2" opacity="0"/></g>
    <g class="pd-panel pd-panel--b"><g class="pd-face" clip-path="url(#pd-clip-b)">${faces}</g>
      <g class="pd-back" opacity="0"><rect y="${r1(F2)}" width="${SW}" height="${r1(SH - F2)}" fill="#fff" stroke="${C.border}" stroke-width="2"/>
        <g transform="translate(0 ${r1(F2 + (SH - F2))}) scale(1 -1)"><rect x="40" y="34" width="120" height="30" rx="5" fill="${C.bed}" stroke="${C.border}" stroke-width="2"/>
        <rect x="50" y="42" width="66" height="6" rx="3" fill="${C.ink}"/><rect x="50" y="53" width="92" height="6" rx="3" fill="${C.ink}"/>
        <rect x="${SW - 52}" y="20" width="28" height="32" rx="2" fill="${C.deepBlue}"/></g></g></g>
  </g>
  <g class="pd-env-front">
    <rect x="930" y="268" width="210" height="140" rx="10" fill="#fff" stroke="${C.border}" stroke-width="2"/>
    <rect x="958" y="330" width="112" height="46" rx="6" fill="${C.bed}" stroke="${C.border}" stroke-width="2"/>
    <g fill="${C.ink}"><rect x="970" y="342" width="56" height="7" rx="3.5"/><rect x="970" y="356" width="80" height="7" rx="3.5"/></g>
    <g transform="translate(1100 300)"><rect x="-19" y="-22" width="38" height="44" fill="#fff" stroke="${C.border}" stroke-width="2" stroke-dasharray="3 3"/><rect x="-15" y="-18" width="30" height="36" fill="${C.deepBlue}"/>
      <path d="M-11,8 q5.5,-8 11,0 t11,0" fill="none" stroke="${C.green}" stroke-width="3"/><circle cy="-6" r="5" fill="#fff"/></g>
  </g>
  <g class="pd-flap-top"><path class="pd-flap-closed" d="M930,268 L998,338 L930,408 Z" fill="#fff" stroke="${C.border}" stroke-width="2"/></g>
  ${check(1128, 270, 20, 'pd-badge')}
  ${head(168, 136, 324, 'pd-head')}
</svg>`);
}

// ---------------------------------------------------------------------------
// 2. Certified Mail: label + barcode → tracked along a timeline → proof of delivery.
// ---------------------------------------------------------------------------
{
  const nodes = [
    [228, 'Preparation'],
    [348, 'Tracking'],
    [468, 'Final delivery'],
    [588, 'Proof of delivery'],
  ];
  const barcode = Array.from({ length: 44 }, (_, i) => `<rect x="${176 + i * 6}" y="282" width="${[2, 4, 1.5, 3, 2.5, 1.5, 4, 2][i % 8]}" height="44"/>`).join('');
  write('certified', `<svg class="wwd-lab__art pm-art pm-art--certified" viewBox="0 0 1200 800" aria-hidden="true" focusable="false">
  <defs><clipPath id="ce-bar-clip"><rect class="ce-bar-mask" x="168" y="276" width="276" height="60"/></clipPath>${grid('ce-grid')}</defs>
  ${backdrop('ce-grid')}
  <rect x="40" y="680" width="1120" height="70" rx="35" fill="#F2F3F5"/>
  <!-- tracking timeline -->
  <g class="ce-track">
    <path d="M820,${nodes[0][0]} V${nodes[3][0]}" stroke="${C.border}" stroke-width="8" stroke-linecap="round"/>
    <path class="ce-progress" d="M820,${nodes[0][0]} V${nodes[3][0]}" stroke="${C.green}" stroke-width="8" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="0"/>
    ${nodes.map(([y, label], i) => `<g class="ce-node" data-i="${i}">
      <circle cx="820" cy="${y}" r="20" fill="${C.green}" stroke="${C.blue}" stroke-width="7"/>
      <text x="884" y="${y + 10}" ${FONT} font-size="31" font-weight="700" fill="${C.heading}">${label}</text></g>`).join('')}
  </g>
  <!-- the big certified envelope -->
  <g class="ce-env">
    <rect x="120" y="196" width="600" height="390" rx="18" fill="#fff" stroke="${C.border}" stroke-width="3"/>
    <path d="M120,586 L372,404 M720,586 L468,404" stroke="${C.border}" stroke-width="3" fill="none"/>
    <rect x="176" y="420" width="268" height="96" rx="10" fill="${C.bed}" stroke="${C.border}" stroke-width="3"/>
    <g fill="${C.ink}"><rect x="198" y="440" width="150" height="12" rx="6"/><rect x="198" y="462" width="196" height="12" rx="6"/><rect x="198" y="484" width="120" height="12" rx="6"/></g>
    <g transform="translate(660 262)"><rect x="-34" y="-40" width="68" height="80" fill="#fff" stroke="${C.border}" stroke-width="3" stroke-dasharray="5 5"/><rect x="-27" y="-33" width="54" height="66" fill="${C.deepBlue}"/>
      <path d="M-19,14 q9.5,-14 19,0 t19,0" fill="none" stroke="${C.green}" stroke-width="5"/><circle cy="-10" r="9" fill="#fff"/></g>
    <g fill="none" stroke="${C.grey}" stroke-width="3" opacity=".55"><path d="M520,232 q14,-10 28,0 t28,0 t28,0"/><path d="M520,250 q14,-10 28,0 t28,0 t28,0"/><path d="M520,268 q14,-10 28,0 t28,0 t28,0"/></g>
    <g class="ce-label">
      <rect x="150" y="226" width="312" height="132" rx="12" fill="#fff" stroke="${C.green}" stroke-width="6"/>
      <path d="M150,238 a12,12 0 0 1 12,-12 h288 a12,12 0 0 1 12,12 v26 h-312z" fill="${C.green}"/>
      <text x="306" y="255" text-anchor="middle" ${FONT} font-size="24" font-weight="800" letter-spacing="3" fill="${C.ink}">CERTIFIED</text>
      <g clip-path="url(#ce-bar-clip)" fill="${C.ink}">${barcode}</g>
      <g fill="${C.mute}"><rect x="176" y="336" width="150" height="7" rx="3.5"/><rect x="334" y="336" width="96" height="7" rx="3.5"/></g>
      <rect class="ce-beam" x="168" y="274" width="6" height="64" rx="3" fill="${C.green}" opacity="0"/>
    </g>
  </g>
  <!-- proof of delivery card -->
  <g class="ce-proof">
    <rect x="452" y="432" width="330" height="222" rx="18" fill="#fff" stroke="${C.border}" stroke-width="3"/>
    <path d="M452,450 a18,18 0 0 1 18,-18 h294 a18,18 0 0 1 18,18 v14 h-330z" fill="${C.deepBlue}"/>
    <g fill="${C.border}"><rect x="480" y="490" width="170" height="10" rx="5"/><rect x="480" y="512" width="220" height="10" rx="5"/></g>
    <rect x="480" y="604" width="270" height="4" rx="2" fill="${C.ink}"/>
    <path class="ce-sign" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="0" d="M490,592 c10,-40 22,-44 24,-12 c2,22 10,10 18,-10 c8,-20 14,-12 12,4 c-2,16 10,12 22,-6 c10,-14 16,-10 20,4 c4,12 16,4 30,-6 c12,-8 24,-6 36,-2" fill="none" stroke="${C.blue}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    ${check(744, 492, 24, 'ce-ok')}
  </g>
</svg>`);
}

// ---------------------------------------------------------------------------
// 3. MICR Check Printing: the check prints, the MICR line prints in magnetic ink,
//    a reader verifies every character. E-13B-style glyphs are abstract shapes, not data.
// ---------------------------------------------------------------------------
{
  const GY = 522, GH = 40;
  // Abstract E-13B-like glyphs: chunky verticals with offset blocks.
  const digit = (x, seed) => {
    const a = [10, 7, 12, 8, 11, 9][seed % 6], b = [6, 9, 5, 8, 6, 10][(seed + 2) % 6];
    const hb = [16, 22, 12, 26, 18, 14][(seed + 1) % 6];
    return `<rect x="${x}" y="${GY}" width="${a}" height="${GH}"/><rect x="${x + a + 3}" y="${GY + GH - hb}" width="${b}" height="${hb}"/><rect x="${x + a + 3}" y="${GY}" width="${b}" height="${seed % 2 ? 9 : 6}"/>`;
  };
  const transit = (x) => `<rect x="${x}" y="${GY}" width="7" height="${GH}"/><rect x="${x + 11}" y="${GY}" width="12" height="12"/><rect x="${x + 11}" y="${GY + GH - 12}" width="12" height="12"/>`;
  const onus = (x) => `<rect x="${x}" y="${GY}" width="6" height="${GH}"/><rect x="${x + 10}" y="${GY}" width="6" height="${GH - 12}"/><rect x="${x + 20}" y="${GY + GH - 12}" width="10" height="12"/>`;
  const seq = ['t', ...'012345678', 't', ...'0123456789', 'o', ...'0123'];
  let x = 150;
  const glyphs = seq.map((g, i) => {
    const w = g === 't' ? 23 : g === 'o' ? 30 : 26;
    const shape = g === 't' ? transit(x) : g === 'o' ? onus(x) : digit(x, i * 7 + 3);
    const out = `<g class="mi-g" data-i="${i}">${shape}<rect class="mi-u" x="${x - 2}" y="${GY + GH + 8}" width="${w + 4}" height="6" rx="3" fill="${C.green}"/></g>`;
    x += w + (g === 't' || g === 'o' ? 16 : 6);
    return out;
  });
  const micrEnd = x;
  write('micr', `<svg class="wwd-lab__art pm-art pm-art--micr" viewBox="0 0 1200 800" aria-hidden="true" focusable="false">
  <defs>
    <clipPath id="mi-check-clip"><rect x="90" y="150" width="1020" height="450" rx="18"/></clipPath>
    <clipPath id="mi-print-clip"><rect class="mi-print-mask" x="90" y="150" width="1020" height="450"/></clipPath>
    ${grid('mi-grid')}
    <pattern id="mi-safety" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="18" height="18" fill="#fff"/><rect width="2" height="18" fill="${C.blue}" opacity=".08"/></pattern>
  </defs>
  ${backdrop('mi-grid')}
  <rect x="40" y="680" width="1120" height="70" rx="35" fill="#F2F3F5"/>
  <g class="mi-check">
    <rect x="90" y="150" width="1020" height="450" rx="18" fill="url(#mi-safety)" stroke="${C.border}" stroke-width="3"/>
    <g clip-path="url(#mi-check-clip)"><rect x="90" y="150" width="1020" height="14" fill="${C.blue}" opacity=".85"/></g>
    <g clip-path="url(#mi-print-clip)">
      <g fill="${C.ink}"><rect x="130" y="196" width="230" height="18" rx="9"/></g>
      <g fill="${C.mute}"><rect x="130" y="224" width="170" height="10" rx="5"/><rect x="130" y="242" width="140" height="10" rx="5"/></g>
      <g fill="${C.ink}"><rect x="948" y="196" width="120" height="16" rx="8"/></g>
      <g fill="${C.mute}"><rect x="760" y="262" width="60" height="10" rx="5"/></g><rect x="830" y="276" width="238" height="3" fill="${C.grey}"/>
      <g fill="${C.ink}"><rect x="846" y="252" width="150" height="14" rx="7"/></g>
      <g fill="${C.mute}"><rect x="130" y="334" width="130" height="10" rx="5"/></g>
      <rect x="276" y="356" width="540" height="3" fill="${C.grey}"/><g fill="${C.ink}"><rect x="290" y="326" width="300" height="18" rx="9"/></g>
      <rect x="862" y="314" width="206" height="54" rx="10" fill="#fff" stroke="${C.grey}" stroke-width="3"/><g fill="${C.ink}"><rect x="884" y="333" width="150" height="16" rx="8"/></g>
      <rect x="130" y="424" width="686" height="3" fill="${C.grey}"/><g fill="${C.ink}"><rect x="140" y="396" width="420" height="16" rx="8"/></g>
      <g fill="${C.mute}"><rect x="130" y="472" width="60" height="10" rx="5"/></g><rect x="200" y="486" width="300" height="3" fill="${C.grey}"/>
      <rect x="690" y="486" width="378" height="3" fill="${C.grey}"/>
      <path class="mi-sign" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="0" d="M712,476 c12,-42 26,-46 28,-12 c2,24 12,10 20,-10 c8,-22 16,-12 14,6 c-2,16 12,12 24,-8 c10,-16 18,-10 22,6 c4,12 18,2 32,-8 c14,-8 30,-4 44,0" fill="none" stroke="${C.blue}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <g class="mi-micr" fill="${C.ink}">${glyphs.join('')}</g>
    ${check(1046, GY + 20, 30, 'mi-ok')}
  </g>
  <g class="mi-reader" transform="translate(${micrEnd - 40} 0)">
    <rect x="-34" y="${GY - 44}" width="68" height="128" rx="16" fill="${C.deepBlue}"/>
    <rect x="-34" y="${GY - 44}" width="68" height="22" rx="11" fill="${shade(C.deepBlue, 0.24)}"/>
    <circle cx="0" cy="${GY - 26}" r="5" fill="${C.green}"/>
    <rect x="-4" y="${GY - 6}" width="8" height="${GH + 12}" rx="4" fill="${C.green}" opacity=".9"/>
  </g>
  ${head(70, 150, 1060, 'mi-head')}
</svg>`);
}

// ---------------------------------------------------------------------------
// 4. /print-mail/ row pieces: a print-head carriage over the photo and a certified label.
// ---------------------------------------------------------------------------
write('row-head', `<svg class="pm-head__art" viewBox="0 0 400 44" preserveAspectRatio="none" aria-hidden="true" focusable="false">
  <rect x="0" y="6" width="400" height="26" rx="8" fill="${C.deepBlue}"/>
  <rect x="0" y="6" width="400" height="9" rx="4.5" fill="${shade(C.deepBlue, 0.24)}"/>
  <rect x="18" y="13" width="44" height="4" rx="2" fill="${C.green}"/>
  <rect x="340" y="12" width="40" height="14" rx="4" fill="${shade(C.deepBlue, -0.3)}"/>
  <g fill="${C.blue}">${Array.from({ length: 30 }, (_, i) => `<rect x="${32 + i * 11.5}" y="32" width="5" height="4" rx="1"/>`).join('')}</g>
  <rect x="2" y="40" width="396" height="2.4" rx="1.2" fill="${C.blue}"/>
</svg>`);

write('row-label', `<svg class="pm-label__art" viewBox="0 0 312 132" aria-hidden="true" focusable="false">
  <rect x="3" y="3" width="306" height="126" rx="12" fill="#fff" stroke="${C.green}" stroke-width="6"/>
  <path d="M3,15 a12,12 0 0 1 12,-12 h282 a12,12 0 0 1 12,12 v26 h-306z" fill="${C.green}"/>
  <text x="156" y="32" text-anchor="middle" ${FONT} font-size="24" font-weight="800" letter-spacing="3" fill="${C.ink}">CERTIFIED</text>
  <g fill="${C.ink}">${Array.from({ length: 44 }, (_, i) => `<rect x="${24 + i * 6}" y="54" width="${[2, 4, 1.5, 3, 2.5, 1.5, 4, 2][i % 8]}" height="42"/>`).join('')}</g>
  <g fill="${C.mute}"><rect x="24" y="108" width="150" height="7" rx="3.5"/><rect x="182" y="108" width="96" height="7" rx="3.5"/></g>
</svg>`);

console.log('wwd-print illustrations written');
