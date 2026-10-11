// Services page illustrations (brand palette + neutrals only). Writes src/svg/services-*.svg.
// The sheet pieces share the envelope's sheet geometry (60 × 80 units, centred on 0,0), so the
// traveling envelope (paper state) and the big press sheet can hand off without a visible jump.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BRAND, shade } from '../iso.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'svg');
mkdirSync(OUT, { recursive: true });
const write = (name, svg) => writeFileSync(join(OUT, `services-${name}.svg`), svg.replace(/\n\s*/g, '\n'));

// The envelope's paper state: white sheet, rough (uncleaned) address, ruled guides.
const paper = `
  <rect x="-30" y="-40" width="60" height="80" rx="2" fill="#fff" stroke="${BRAND.border}"/>
  <g><rect x="-22" y="-30" width="11" height="3" rx="1.5" fill="#9CA3AF"/><rect x="-9" y="-30" width="13" height="3" rx="1.5" fill="#9CA3AF"/>
  <rect x="-22" y="-25" width="20" height="3" rx="1.5" fill="#9CA3AF" opacity=".55"/><rect x="-22" y="-20" width="9" height="3" rx="1.5" fill="#9CA3AF"/><rect x="-11" y="-20" width="12" height="3" rx="1.5" fill="#9CA3AF" opacity=".55"/></g>
  <g>${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="-22" y="${-6 + i * 6}" width="${[44, 40, 44, 36, 42, 28][i]}" height="2" rx="1" fill="${BRAND.border}"/>`).join('')}</g>`;

// 1. Hero still: the blank sheet waiting on the seam (same box as the 120 × 120 envelope layer).
write('sheet-still', `<svg class="svc-sheet-still" viewBox="-60 -60 120 120" aria-hidden="true" focusable="false">
  <ellipse cx="0" cy="48" rx="28" ry="4" fill="${BRAND.darkGrey}" opacity=".12"/>${paper}
</svg>`);

// 2. Big press sheet, blank (fills its box exactly).
write('sheet-blank', `<svg class="svc-sheet__blank" viewBox="-30 -40 60 80" preserveAspectRatio="none" aria-hidden="true" focusable="false">${paper}
</svg>`);

// 3. Big press sheet, printed layer (everything except the photo, which is an <img> laid over
//    the window at x −24…24, y −14…14). Revealed top → bottom under the print head.
// MICR line: E-13B-style blocky digits between transit/on-us symbols, drawn as rects.
const micrDigit = (x, seed) => {
  const s = [[0.9, 2.2, 0.9], [1.6, 0.8, 1.6], [0.8, 1.8, 1.2], [1.4, 1.4, 0.7], [0.7, 2.2, 1.4], [1.8, 0.9, 1.1]][seed % 6];
  const a = s[0] * 0.55, b = s[1] * 0.45, c = s[2] * 0.5;
  return `<rect x="${x}" y="31" width="${a}" height="3.2"/><rect x="${x + a + 0.25}" y="${31 + (seed % 3) * 0.6}" width="${b}" height="${3.2 - (seed % 3) * 0.6}"/><rect x="${x + a + b + 0.5}" y="31" width="${c}" height="${seed % 2 ? 3.2 : 2}"/>`;
};
const transit = (x) => `<rect x="${x}" y="31" width="0.7" height="3.2"/><rect x="${x + 1.2}" y="31" width="1.2" height="1.2"/><rect x="${x + 1.2}" y="33" width="1.2" height="1.2"/>`;
let micr = transit(-24);
let mx = -20.6;
for (let i = 0; i < 8; i++) { micr += micrDigit(mx, i * 7 + 3); mx += 3.5; }
micr += transit(mx + 0.4); mx += 3.8;
for (let i = 0; i < 3; i++) { micr += micrDigit(mx, i * 5 + 1); mx += 3.5; }
micr += `<rect x="${mx}" y="31" width="1.3" height="3.2"/><rect x="${mx + 1.6}" y="31" width="0.6" height="3.2"/><rect x="${mx + 2.5}" y="31" width="1.3" height="3.2"/>`;

write('sheet-print', `<svg class="svc-sheet__print-art" viewBox="-30 -40 60 80" preserveAspectRatio="none" aria-hidden="true" focusable="false">
  <rect x="-30" y="-40" width="60" height="80" rx="2" fill="#fff" stroke="${BRAND.border}"/>
  <path d="M-28,-40 h56 a2,2 0 0 1 2,2 v3 h-60 v-3 a2,2 0 0 1 2,-2z" fill="${BRAND.blue}"/>
  <g fill="${BRAND.darkGrey}"><rect x="-24" y="-30" width="22" height="2.6" rx="1.3"/><rect x="-24" y="-25.5" width="17" height="2.6" rx="1.3"/><rect x="-24" y="-21" width="20" height="2.6" rx="1.3"/></g>
  <g transform="translate(17 -25)"><circle r="4.6" fill="${BRAND.green}"/><path d="M-2.3,0 l1.6,1.6 l3.2,-3.4" fill="none" stroke="${BRAND.darkGrey}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></g>
  <rect x="-24" y="-14" width="48" height="28" rx="1.5" fill="${BRAND.lightGrey}"/>
  <g fill="${BRAND.grey}"><rect x="-24" y="18" width="44" height="1.8" rx=".9"/><rect x="-24" y="21.6" width="38" height="1.8" rx=".9"/><rect x="-24" y="25.2" width="41" height="1.8" rx=".9"/></g>
  <g class="svc-micr" fill="${BRAND.darkGrey}">${micr}</g>
</svg>`);

// 4. Print head carriage (spans the sheet width; the motion layer moves it down the sheet).
write('head', `<svg class="svc-head__art" viewBox="0 0 400 44" preserveAspectRatio="none" aria-hidden="true" focusable="false">
  <rect x="0" y="6" width="400" height="26" rx="8" fill="${BRAND.deepBlue}"/>
  <rect x="0" y="6" width="400" height="9" rx="4.5" fill="${shade(BRAND.deepBlue, 0.24)}"/>
  <rect x="18" y="13" width="44" height="4" rx="2" fill="${BRAND.green}"/>
  <rect x="340" y="12" width="40" height="14" rx="4" fill="${shade(BRAND.deepBlue, -0.3)}"/>
  <g fill="${BRAND.blue}">${Array.from({ length: 30 }, (_, i) => `<rect x="${32 + i * 11.5}" y="32" width="5" height="4" rx="1"/>`).join('')}</g>
  <rect x="2" y="40" width="396" height="2.4" rx="1.2" fill="${BRAND.blue}"/>
</svg>`);

// 5. Phone (screen on the front) with a slot for the landed SMS bubble.
write('phone', `<svg class="svc-phone__art" viewBox="0 0 120 230" aria-hidden="true" focusable="false">
  <rect x="2" y="2" width="116" height="226" rx="20" fill="${BRAND.darkGrey}"/>
  <rect x="8" y="8" width="104" height="214" rx="15" fill="${BRAND.deepBlue}"/>
  <rect x="44" y="14" width="32" height="7" rx="3.5" fill="${BRAND.darkGrey}"/>
  <g fill="#fff" opacity=".22"><rect x="18" y="40" width="44" height="18" rx="8"/><rect x="18" y="64" width="60" height="18" rx="8"/></g>
  <g class="svc-phone__msg"><rect x="34" y="96" width="70" height="34" rx="12" fill="${BRAND.green}"/><path d="M92,128 l8,8 l-1,-10z" fill="${BRAND.green}"/>
    <rect x="44" y="105" width="44" height="3.6" rx="1.8" fill="${BRAND.darkGrey}"/><rect x="44" y="113" width="30" height="3.6" rx="1.8" fill="${BRAND.darkGrey}"/><rect x="44" y="121" width="38" height="3.6" rx="1.8" fill="${BRAND.darkGrey}" opacity=".5"/></g>
  <rect x="40" y="208" width="40" height="4" rx="2" fill="#fff" opacity=".5"/>
</svg>`);

// 6. Flying pieces: the email card and the SMS bubble that leave the envelope.
write('fly-email', `<svg class="svc-fly__art" viewBox="0 0 72 50" aria-hidden="true" focusable="false">
  <rect x="1" y="1" width="70" height="48" rx="5" fill="#fff" stroke="${BRAND.border}"/>
  <path d="M1.5,4 L36,28 L70.5,4" fill="none" stroke="${BRAND.blue}" stroke-width="3" stroke-linejoin="round"/>
</svg>`);
write('fly-sms', `<svg class="svc-fly__art" viewBox="0 0 64 46" aria-hidden="true" focusable="false">
  <rect x="1" y="1" width="62" height="34" rx="14" fill="${BRAND.green}"/><path d="M14,34 l-4,11 l14,-11z" fill="${BRAND.green}"/>
  <circle cx="20" cy="18" r="3.6" fill="${BRAND.darkGrey}"/><circle cx="32" cy="18" r="3.6" fill="${BRAND.darkGrey}"/><circle cx="44" cy="18" r="3.6" fill="${BRAND.darkGrey}"/>
</svg>`);

console.log('services illustrations written');
