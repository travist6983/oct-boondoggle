// Industries Served illustrations (brand palette only): one inline SVG sprite with
//  - nine industry glyphs (used in the postmarks and the route-map stops),
//  - the postmark ring + cancellation waves,
//  - the envelope "paper" that the photo window opens out of.
// Written to src/svg/industries-sprite.svg and inlined once per page (<!--@svg industries-sprite-->).
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BRAND } from '../iso.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'svg');
mkdirSync(OUT, { recursive: true });

// 24×24 line glyphs. Stroke styling comes from the wrapping <g>.
const GLYPHS = {
  automotive: `<path d="M3.5 15.6v-3.3l1.8-4a2 2 0 0 1 1.8-1.2h9.8a2 2 0 0 1 1.8 1.2l1.8 4v3.3a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1Z"/><path d="M4 12.2h16M9.2 7.4l-.9 4.8M14.8 7.4l.9 4.8"/><circle cx="7.6" cy="16.8" r="1.9" fill="#fff"/><circle cx="16.4" cy="16.8" r="1.9" fill="#fff"/>`,
  'class-action': `<path d="M12 4.2v15.3M7.5 19.5h9M4.8 7.2h14.4M12 4.2l-1.2 3M12 4.2l1.2 3"/><path d="M4.8 7.2 2.4 13h4.8Z"/><path d="M2.4 13a2.4 2.4 0 0 0 4.8 0"/><path d="M19.2 7.2 16.8 13h4.8Z"/><path d="M16.8 13a2.4 2.4 0 0 0 4.8 0"/>`,
  financial: `<path d="M3.2 9.3 12 4.2l8.8 5.1Z"/><path d="M5.6 11.2v5.6M9.9 11.2v5.6M14.1 11.2v5.6M18.4 11.2v5.6"/><path d="M4.2 18.6h15.6M3.2 20.6h17.6"/>`,
  gov: `<path d="M12 3.2v2.4"/><path d="M7.4 10.6a4.6 4.6 0 0 1 9.2 0Z"/><path d="M5.2 12.6h13.6"/><path d="M7 14.6v4M10.3 14.6v4M13.7 14.6v4M17 14.6v4"/><path d="M4 20.6h16"/>`,
  healthcare: `<rect x="3.8" y="3.8" width="16.4" height="16.4" rx="4.2"/><path d="M12 8.2v7.6M8.2 12h7.6"/>`,
  mortgage: `<path d="M3.6 11.6 12 4.6l8.4 7"/><path d="M5.9 9.8v10h12.2v-10"/><path d="M10.2 19.8v-5h3.6v5"/>`,
  receivables: `<path d="M6.8 3.4h10.4v17.2l-2.1-1.3-1.7 1.3-1.7-1.3-1.7 1.3-1.7-1.3-1.5 1.3Z"/><path d="M9.4 7.8h5.2M9.4 11h5.2M9.4 14.2h3"/>`,
  telecom: `<circle cx="12" cy="8.6" r="1.4"/><path d="M12 10.2v10.2M9.2 20.4h5.6M12 10.4l-2.6 10M12 10.4l2.6 10"/><path d="M8.6 5.4a4.6 4.6 0 0 0 0 6.4M15.4 5.4a4.6 4.6 0 0 1 0 6.4M6.2 3.2a7.8 7.8 0 0 0 0 10.8M17.8 3.2a7.8 7.8 0 0 1 0 10.8"/>`,
  utility: `<path d="M12 3.4a5.8 5.8 0 0 0-3.5 10.4c.6.5.9 1.1.9 1.8v.8h5.2v-.8c0-.7.3-1.3.9-1.8A5.8 5.8 0 0 0 12 3.4Z"/><path d="M9.6 18.6h4.8M10.4 20.8h3.2"/><path d="M12.7 7.2l-1.9 3.2h2.6l-1.9 3.1"/>`,
};

const g = (body) => `<g fill="none" stroke="${BRAND.blue}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</g>`;
const symbols = Object.entries(GLYPHS)
  .map(([id, body]) => `<symbol id="g-${id}" viewBox="0 0 24 24">${g(body)}</symbol>`)
  .join('\n  ');

// Postmark ring: a round dated-postmark look with the company's own facts (name, town, est. 1982).
const ring = `<symbol id="pm-ring" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="48" fill="#fff"/>
    <circle cx="50" cy="50" r="45.5" fill="none" stroke="${BRAND.deepBlue}" stroke-width="2.6"/>
    <circle cx="50" cy="50" r="32.5" fill="none" stroke="${BRAND.deepBlue}" stroke-width="1.2"/>
    <path id="pm-arc" d="M50,50 m-39,0 a39,39 0 1,1 78,0 a39,39 0 1,1 -78,0" fill="none"/>
    <text font-family="Plus Jakarta Sans, PJS Fallback, Arial, sans-serif" font-size="8" font-weight="700" letter-spacing="1.25" fill="${BRAND.deepBlue}"><textPath href="#pm-arc" startOffset="1">RENKIM · SOUTHGATE, MI · EST. 1982 ·</textPath></text>
  </symbol>`;

// Cancellation waves, to the left of the ring.
const wave = (y) => `M0,${y} q6.25,-5 12.5,0 t12.5,0 t12.5,0 t12.5,0 t12.5,0`;
const waves = `<symbol id="pm-waves" viewBox="0 0 64 44"><g fill="none" stroke="${BRAND.deepBlue}" stroke-width="2.2" stroke-linecap="round">
    <path d="${wave(8)}"/><path d="${wave(22)}"/><path d="${wave(36)}"/></g></symbol>`;

// Envelope paper the photo window opens out of (stretched to the figure; strokes stay hairline).
const paper = `<symbol id="ind-paper" viewBox="0 0 160 100" preserveAspectRatio="none">
    <rect x="0.5" y="0.5" width="159" height="99" rx="4" fill="#fff" stroke="${BRAND.border}" vector-effect="non-scaling-stroke"/>
    <path d="M1.5,1.5 L80,52 L158.5,1.5" fill="none" stroke="${BRAND.border}" stroke-width="1.4" vector-effect="non-scaling-stroke"/>
    <rect x="86" y="60" width="44" height="3.2" rx="1.6" fill="${BRAND.border}"/>
    <rect x="86" y="67" width="34" height="3.2" rx="1.6" fill="${BRAND.border}"/>
    <rect x="86" y="74" width="40" height="3.2" rx="1.6" fill="${BRAND.border}"/>
    <rect x="133" y="8" width="18" height="21" rx="1.5" fill="none" stroke="${BRAND.grey}" stroke-opacity="0.45" stroke-dasharray="2.5 2.5" vector-effect="non-scaling-stroke"/>
  </symbol>`;

writeFileSync(
  join(OUT, 'industries-sprite.svg'),
  `<svg class="sprite" width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden">
  ${symbols}
  ${ring}
  ${waves}
  ${paper}
</svg>
`,
);

// One postmark per industry: waves + ring + glyph. Inlined in each article's figure.
for (const id of Object.keys(GLYPHS)) {
  writeFileSync(
    join(OUT, `industries-postmark-${id}.svg`),
    `<svg class="postmark__svg" viewBox="0 0 150 100" aria-hidden="true" focusable="false"><use class="postmark__waves" href="#pm-waves" x="0" y="28" width="64" height="44"/><use href="#pm-ring" x="50" y="0" width="100" height="100"/><use href="#g-${id}" x="81" y="31" width="38" height="38"/></svg>
`,
  );
}
console.log('industries illustrations written');
