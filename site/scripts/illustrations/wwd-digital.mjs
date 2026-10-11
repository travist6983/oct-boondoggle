// What We Do · Digital family illustrations (writes src/svg/wwd-digital-*.svg).
// Redraws the live flat icons (laptop / phone, blue envelope, green "i" bubble, deep-blue "…"
// bubble, green clipboard) as SVG in the same style, plus three animated stages:
//   email   – a laptop whose screen goes inbox → secure eNotice → PDF attachment
//   text    – a phone whose thread gets an SMS → a secure MMS → an MMS direct statement
//   lab     – Digital Services landing: laptop + phone; one envelope's letter becomes an email,
//             a text, a payment and an electronic bill.
// Brand colors only, with white tints for highlights. Every stage is aria-hidden: the HTML carries
// the content. Classes (no ids) so a stage or icon can repeat on a page.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BRAND, shade } from '../iso.mjs';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'svg');
mkdirSync(OUT, { recursive: true });

const INK = BRAND.darkGrey, BLUE = BRAND.blue, DEEP = BRAND.deepBlue, GREEN = BRAND.green;
const SKY = shade(BLUE, 0.38); // the envelope flap
const PALE = shade(BLUE, 0.9); // highlighted row
const MIST = shade(DEEP, 0.92);
const LINE = BRAND.border, LG = BRAND.lightGrey;
const SOFT = shade(INK, 0.55); // secondary text bars
const r2 = (n) => Math.round(n * 100) / 100;

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------
const envIcon = (x, y, w, cls = '') => {
  const h = w * 0.68, r = w * 0.1;
  return `<g class="${cls}" transform="translate(${r2(x)} ${r2(y)})"><rect width="${r2(w)}" height="${r2(h)}" rx="${r2(r)}" fill="${BLUE}"/><path d="M${r2(r * 0.6)} ${r2(r * 0.35)} L${r2(w / 2)} ${r2(h * 0.52)} L${r2(w - r * 0.6)} ${r2(r * 0.35)} Z" fill="${SKY}"/></g>`;
};
// Speech bubble: ellipse + tail ('l' tail bottom-left, 'r' bottom-right)
const bubble = (cx, cy, rx, ry, fill, tail = 'l') => {
  const s = tail === 'l' ? -1 : 1;
  const tx = cx + s * rx * 0.62, ty = cy + ry * 0.62;
  return `<ellipse cx="${r2(cx)}" cy="${r2(cy)}" rx="${r2(rx)}" ry="${r2(ry)}" fill="${fill}"/><path d="M${r2(tx - s * rx * 0.18)} ${r2(ty - ry * 0.22)} Q${r2(tx + s * rx * 0.1)} ${r2(ty + ry * 0.32)} ${r2(tx + s * rx * 0.42)} ${r2(ty + ry * 0.34)} Q${r2(tx + s * rx * 0.1)} ${r2(ty + ry * 0.1)} ${r2(tx + s * rx * 0.12)} ${r2(ty - ry * 0.3)} Z" fill="${fill}"/>`;
};
const info = (cx, cy, s, fill = DEEP) =>
  `<circle cx="${r2(cx + s * 0.06)}" cy="${r2(cy - s * 0.36)}" r="${r2(s * 0.11)}" fill="${fill}"/><path d="M${r2(cx - s * 0.16)} ${r2(cy - s * 0.12)} L${r2(cx + s * 0.06)} ${r2(cy - s * 0.17)} L${r2(cx - s * 0.06)} ${r2(cy + s * 0.3)} Q${r2(cx - s * 0.08)} ${r2(cy + s * 0.4)} ${r2(cx + s * 0.04)} ${r2(cy + s * 0.36)} L${r2(cx + s * 0.18)} ${r2(cy + s * 0.29)}" fill="none" stroke="${fill}" stroke-width="${r2(s * 0.12)}" stroke-linecap="round" stroke-linejoin="round"/>`;
const dots = (cx, cy, gap, r, fill, cls = '') =>
  [-1, 0, 1].map((k, i) => `<circle class="${cls}${cls ? ` ${cls}--${i}` : ''}" cx="${r2(cx + k * gap)}" cy="${r2(cy)}" r="${r2(r)}" fill="${fill}"/>`).join('');
const clipboard = (x, y, w, h, rows = 4) => {
  const clipW = w * 0.6, gap = (h * 0.72) / rows;
  let s = `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" rx="${r2(w * 0.07)}" fill="${GREEN}"/>`;
  s += `<rect x="${r2(x + (w - clipW) / 2)}" y="${r2(y - h * 0.05)}" width="${r2(clipW)}" height="${r2(h * 0.11)}" rx="${r2(h * 0.055)}" fill="${DEEP}"/>`;
  for (let i = 0; i < rows; i++) {
    const yy = y + h * 0.24 + i * gap;
    s += `<circle cx="${r2(x + w * 0.2)}" cy="${r2(yy)}" r="${r2(w * 0.055)}" fill="${DEEP}"/><rect x="${r2(x + w * 0.32)}" y="${r2(yy - w * 0.018)}" width="${r2(w * 0.52)}" height="${r2(w * 0.036)}" rx="${r2(w * 0.018)}" fill="${DEEP}"/>`;
  }
  return s;
};
const lock = (x, y, s, fill, shackleCls = '') =>
  `<g transform="translate(${r2(x)} ${r2(y)})"><path class="${shackleCls}" d="M${r2(s * 0.24)} ${r2(s * 0.5)} V${r2(s * 0.3)} a${r2(s * 0.26)} ${r2(s * 0.26)} 0 0 1 ${r2(s * 0.52)} 0 V${r2(s * 0.5)}" fill="none" stroke="${fill}" stroke-width="${r2(s * 0.12)}" stroke-linecap="round"/><rect x="0" y="${r2(s * 0.46)}" width="${r2(s)}" height="${r2(s * 0.62)}" rx="${r2(s * 0.12)}" fill="${fill}"/><circle cx="${r2(s / 2)}" cy="${r2(s * 0.72)}" r="${r2(s * 0.08)}" fill="${DEEP}"/><rect x="${r2(s / 2 - s * 0.03)}" y="${r2(s * 0.72)}" width="${r2(s * 0.06)}" height="${r2(s * 0.16)}" fill="${DEEP}"/></g>`;
const check = (cx, cy, r, ring = '#fff') =>
  `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(r)}" fill="${GREEN}" stroke="${ring}" stroke-width="${r2(r * 0.18)}"/><path d="M${r2(cx - r * 0.42)} ${r2(cy + r * 0.02)} L${r2(cx - r * 0.1)} ${r2(cy + r * 0.34)} L${r2(cx + r * 0.46)} ${r2(cy - r * 0.32)}" fill="none" stroke="${INK}" stroke-width="${r2(r * 0.24)}" stroke-linecap="round" stroke-linejoin="round"/>`;
const bar = (x, y, w, h, fill) => `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" rx="${r2(h / 2)}" fill="${fill}"/>`;
// A statement page (blue header band, rows, green total line)
const statement = (x, y, w, h) => {
  let s = `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" rx="${r2(w * 0.05)}" fill="#fff" stroke="${LINE}"/>`;
  s += `<path d="M${r2(x)} ${r2(y + w * 0.05)} a${r2(w * 0.05)} ${r2(w * 0.05)} 0 0 1 ${r2(w * 0.05)} ${r2(-w * 0.05)} h${r2(w * 0.9)} a${r2(w * 0.05)} ${r2(w * 0.05)} 0 0 1 ${r2(w * 0.05)} ${r2(w * 0.05)} v${r2(h * 0.13)} h${r2(-w)} Z" fill="${BLUE}"/>`;
  s += bar(x + w * 0.1, y + h * 0.06, w * 0.34, h * 0.04, '#fff');
  for (let i = 0; i < 4; i++) {
    const yy = y + h * (0.3 + i * 0.12);
    s += bar(x + w * 0.1, yy, w * (i % 2 ? 0.5 : 0.62), h * 0.035, SOFT) + bar(x + w * 0.74, yy, w * 0.16, h * 0.035, LINE);
  }
  s += `<rect x="${r2(x + w * 0.1)}" y="${r2(y + h * 0.8)}" width="${r2(w * 0.8)}" height="${r2(h * 0.1)}" rx="${r2(h * 0.03)}" fill="${GREEN}"/>` + bar(x + w * 0.16, y + h * 0.835, w * 0.3, h * 0.035, DEEP);
  return s;
};

// Laptop in its own 640 × 420 box. Screen interior: x 88–552, y 32–320.
const laptopBody = `<ellipse cx="320" cy="392" rx="300" ry="14" fill="${LG}"/>
  <rect x="72" y="16" width="496" height="320" rx="22" fill="${INK}"/>
  <rect x="88" y="32" width="464" height="288" rx="10" fill="#fff"/>`;
const laptopBase = `<rect x="12" y="336" width="616" height="40" rx="20" fill="${INK}"/><rect x="268" y="336" width="104" height="9" rx="4.5" fill="${shade(INK, 0.18)}"/>`;
// Phone in its own box: body at (x, y), w × h. Screen inset 14 / top 22 / bottom 46.
const phoneBody = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r2(w * 0.14)}" fill="${INK}"/>
  <rect x="${x + 12}" y="${y + 22}" width="${w - 24}" height="${h - 66}" rx="${r2(w * 0.07)}" fill="#fff"/>
  <rect x="${r2(x + w / 2 - w * 0.13)}" y="${y + h - 28}" width="${r2(w * 0.26)}" height="8" rx="4" fill="#fff"/>`;

const svgOpen = (cls, vb) => `<svg class="${cls}" viewBox="${vb}" aria-hidden="true" focusable="false">`;
const write = (name, svg) => writeFileSync(join(OUT, `wwd-digital-${name}.svg`), svg.replace(/\n\s*\n/g, '\n') + '\n');

// ---------------------------------------------------------------------------
// Email stage (laptop, 640 × 440)
// ---------------------------------------------------------------------------
function emailStage() {
  const rows = [0, 1, 2, 3].map((i) => {
    const y = 74 + i * 58;
    return `<g><circle cx="124" cy="${y + 26}" r="13" fill="${LINE}"/>${bar(148, y + 13, 150 - i * 14, 9, SOFT)}${bar(148, y + 31, 250 - i * 20, 7, LINE)}${bar(470, y + 14, 50, 7, LINE)}<rect x="96" y="${y + 55}" width="448" height="1" fill="${LG}"/></g>`;
  }).join('');
  return `${svgOpen('dg-svg dg-svg--email', '0 0 640 440')}
  <defs><clipPath id="dg-e-clip"><rect x="88" y="32" width="464" height="288" rx="10"/></clipPath></defs>
  ${laptopBody}
  <g clip-path="url(#dg-e-clip)">
    <rect x="88" y="32" width="464" height="34" fill="${LG}"/>
    ${dots(112, 49, 11, 3.6, LINE)}
    <rect class="dg-e-url" x="150" y="40" width="380" height="18" rx="9" fill="#fff" stroke="${LINE}"/>
    <g class="dg-e-inbox">
      <g class="dg-e-rows">${rows}</g>
      <g class="dg-e-newrow">
        <rect x="94" y="72" width="452" height="56" rx="9" fill="${PALE}"/>
        <rect x="94" y="72" width="5" height="56" rx="2.5" fill="${BLUE}"/>
        ${envIcon(110, 84, 46, 'dg-e-newicon')}
        ${bar(172, 86, 170, 10, INK)}${bar(172, 105, 260, 7, SOFT)}
        <circle cx="524" cy="100" r="7" fill="${GREEN}"/>
      </g>
    </g>
    <g class="dg-e-notice">
      <rect x="88" y="66" width="464" height="254" fill="#fff"/>
      <rect x="128" y="86" width="384" height="44" rx="22" fill="${LG}"/>
      <text class="dg-e-www" x="152" y="115" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="22" font-weight="600" fill="${INK}">www.</text>
      <g class="dg-e-lock">${lock(460, 76, 38, BLUE, 'dg-e-shackle')}</g>
      <g class="dg-e-auth">
        <rect x="200" y="158" width="240" height="30" rx="8" fill="#fff" stroke="${LINE}" stroke-width="2"/>${bar(214, 169, 90, 8, LINE)}
        <rect x="200" y="198" width="240" height="30" rx="8" fill="#fff" stroke="${LINE}" stroke-width="2"/>${dots(232, 213, 14, 4, INK, 'dg-e-pin')}
        <rect class="dg-e-go" x="200" y="240" width="240" height="32" rx="9" fill="${DEEP}"/>${bar(286, 252, 68, 8, '#fff')}
      </g>
    </g>
    <g class="dg-e-pdf">
      <rect x="88" y="66" width="464" height="254" fill="#fff"/>
      ${envIcon(112, 82, 40)}${bar(166, 84, 190, 10, INK)}${bar(166, 102, 120, 7, SOFT)}
      <rect x="104" y="130" width="432" height="1" fill="${LG}"/>
      ${bar(112, 148, 380, 8, LINE)}${bar(112, 166, 330, 8, LINE)}${bar(112, 184, 360, 8, LINE)}
      <g class="dg-e-attach">
        <rect x="112" y="214" width="168" height="76" rx="12" fill="#fff" stroke="${LINE}" stroke-width="2"/>
        <path d="M128 224 h28 l12 12 v42 h-40 Z" fill="#fff" stroke="${BLUE}" stroke-width="2.5" stroke-linejoin="round"/><path d="M156 224 v12 h12" fill="none" stroke="${BLUE}" stroke-width="2.5" stroke-linejoin="round"/>
        <text x="148" y="266" text-anchor="middle" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="12" font-weight="700" fill="${DEEP}">PDF</text>
        ${bar(182, 236, 82, 9, INK)}${bar(182, 254, 60, 7, SOFT)}
        <g class="dg-e-pdflock">${lock(236, 262, 20, DEEP, 'dg-e-pdfshackle')}</g>
        <g class="dg-e-pdfok">${check(258, 216, 13)}</g>
      </g>
    </g>
  </g>
  ${laptopBase}
  <g class="dg-e-bdots">${bubble(150, 46, 54, 38, DEEP, 'r')}${dots(150, 46, 18, 6, GREEN, 'dg-e-dot')}</g>
  <g class="dg-e-binfo">${bubble(508, 70, 46, 40, GREEN, 'l')}${info(510, 72, 50)}</g>
  <g class="dg-e-pass">
    <rect x="300" y="196" width="230" height="44" rx="6" fill="#fff" stroke="${GREEN}" stroke-width="5"/>
    <path d="M330 252 l10 -12 l10 12 Z" fill="${DEEP}"/>
    <rect x="300" y="250" width="270" height="44" rx="4" fill="${DEEP}"/>
    ${dots(352, 272, 22, 7, GREEN, 'dg-e-passdot')}
  </g>
  <g class="dg-e-doc">${clipboard(232, 182, 176, 218, 4)}<rect class="dg-e-portal" x="262" y="364" width="116" height="24" rx="12" fill="${DEEP}"/><path d="M308 376 h22 m-7 -6 l7 6 l-7 6" fill="none" stroke="${GREEN}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>
</svg>`;
}

// ---------------------------------------------------------------------------
// Text stage (phone, 420 × 480). Screen interior: x 122–298, y 32–424.
// ---------------------------------------------------------------------------
function textStage() {
  const X = 110, Y = 10, W = 200, H = 460;
  return `${svgOpen('dg-svg dg-svg--text', '0 0 420 480')}
  <defs><clipPath id="dg-t-clip"><rect x="${X + 12}" y="${Y + 22}" width="${W - 24}" height="${H - 66}" rx="14"/></clipPath></defs>
  <ellipse cx="210" cy="472" rx="120" ry="7" fill="${LG}"/>
  ${phoneBody(X, Y, W, H)}
  <g clip-path="url(#dg-t-clip)">
    <rect x="${X + 12}" y="${Y + 22}" width="${W - 24}" height="44" fill="${LG}"/>
    <circle cx="${X + 40}" cy="${Y + 44}" r="12" fill="${DEEP}"/>${bar(X + 60, Y + 38, 70, 9, INK)}${bar(X + 60, Y + 51, 44, 6, SOFT)}
    <g class="dg-t-thread">
      <g class="dg-t-sms">
        <path d="M134 96 h112 a14 14 0 0 1 14 14 v36 a14 14 0 0 1 -14 14 h-104 l-12 10 v-60 a14 14 0 0 1 14 -14 Z" fill="${GREEN}" transform="translate(-10 0)"/>
        <circle cx="146" cy="128" r="15" fill="#fff"/>${info(146, 129, 24)}
        ${bar(170, 116, 70, 7, INK)}${bar(170, 130, 56, 7, INK)}${bar(170, 144, 40, 6, shade(INK, 0.3))}
        <g class="dg-t-link"><rect x="124" y="176" width="140" height="30" rx="15" fill="#fff" stroke="${LINE}" stroke-width="2"/><path d="M142 191 a6 6 0 0 1 6 -6 h6 m4 12 h6 a6 6 0 0 0 0 -12 h-4 m-12 6 h12" fill="none" stroke="${BLUE}" stroke-width="2.6" stroke-linecap="round"/>${bar(176, 187, 70, 8, BLUE)}</g>
      </g>
      <g class="dg-t-typing"><path d="M124 226 h52 a16 16 0 0 1 0 32 h-40 l-12 8 Z" fill="${GREEN}"/>${dots(152, 242, 12, 4, DEEP, 'dg-t-tdot')}</g>
      <g class="dg-t-mms">
        <rect x="124" y="226" width="150" height="104" rx="14" fill="#fff" stroke="${LINE}" stroke-width="2"/>
        <g class="dg-t-lock">${lock(138, 238, 26, DEEP, 'dg-t-shackle')}</g>
        ${bar(172, 244, 86, 8, INK)}${bar(172, 258, 60, 6, SOFT)}
        <rect x="136" y="278" width="126" height="22" rx="6" fill="${LG}"/>${[0, 1, 2, 3].map((i) => `<circle class="dg-t-pin dg-t-pin--${i}" cx="${150 + i * 16}" cy="289" r="4.5" fill="${INK}"/>`).join('')}
        <g class="dg-t-slink"><rect x="136" y="306" width="126" height="18" rx="9" fill="${GREEN}"/><rect x="144" y="310" width="10" height="11" rx="2" fill="${DEEP}"/>${bar(160, 312, 70, 6, DEEP)}</g>
      </g>
      <g class="dg-t-direct">
        <path d="M118 348 h146 a14 14 0 0 1 14 14 v126 a14 14 0 0 1 -14 14 h-132 l-12 10 v-150 a14 14 0 0 1 14 -14 Z" fill="${MIST}"/>
        <g class="dg-t-stmt">${statement(132, 358, 132, 136)}</g>
        <g class="dg-t-zero">${check(266, 356, 12)}</g>
      </g>
    </g>
  </g>
  <g class="dg-t-pop">${bubble(330, 148, 62, 56, GREEN, 'l')}${info(332, 150, 70)}</g>
  <g class="dg-t-popdoc">${clipboard(300, 210, 104, 140, 4)}</g>
</svg>`;
}

// ---------------------------------------------------------------------------
// Landing lab (800 × 450): laptop (left), phone (right), cards fly from the envelope's dock.
// ---------------------------------------------------------------------------
function labStage() {
  // laptop at translate(30 70) scale(0.72): screen interior → x 93–427, y 93–300
  const L = 'translate(30 70) scale(0.72)';
  const P = { x: 588, y: 40, w: 168, h: 330 }; // phone body; screen x 600–744, y 62–326
  const rows = [1, 2].map((i) => {
    const y = 74 + i * 58;
    return `<g><circle cx="124" cy="${y + 26}" r="13" fill="${LINE}"/>${bar(148, y + 13, 150, 9, SOFT)}${bar(148, y + 31, 240, 7, LINE)}</g>`;
  }).join('');
  return `${svgOpen('dg-svg dg-svg--lab', '0 0 800 450')}
  <defs><clipPath id="dg-l-clip"><rect x="88" y="32" width="464" height="288" rx="10"/></clipPath><clipPath id="dg-l-pclip"><rect x="${P.x + 12}" y="${P.y + 22}" width="${P.w - 24}" height="${P.h - 66}" rx="12"/></clipPath></defs>
  <g transform="${L}">
    ${laptopBody}
    <g clip-path="url(#dg-l-clip)">
      <rect x="88" y="32" width="464" height="34" fill="${LG}"/>${dots(112, 49, 11, 3.6, LINE)}<rect x="150" y="40" width="380" height="18" rx="9" fill="#fff" stroke="${LINE}"/>
      <g class="dg-l-rows">${rows}</g>
      <g class="dg-l-mail"><rect x="94" y="72" width="452" height="56" rx="9" fill="${PALE}"/><rect x="94" y="72" width="5" height="56" rx="2.5" fill="${BLUE}"/>${envIcon(110, 84, 46)}${bar(172, 86, 170, 10, INK)}${bar(172, 105, 260, 7, SOFT)}<circle cx="524" cy="100" r="7" fill="${GREEN}"/></g>
      <g class="dg-l-bill"><rect x="88" y="66" width="464" height="254" fill="#fff"/>${statement(220, 82, 200, 226)}<g transform="translate(0 0)">${check(420, 96, 16)}</g></g>
    </g>
    ${laptopBase}
  </g>
  ${phoneBody(P.x, P.y, P.w, P.h)}
  <g clip-path="url(#dg-l-pclip)">
    <rect x="${P.x + 12}" y="${P.y + 22}" width="${P.w - 24}" height="34" fill="${LG}"/><circle cx="${P.x + 34}" cy="${P.y + 39}" r="9" fill="${DEEP}"/>${bar(P.x + 50, P.y + 35, 60, 8, INK)}
    <g class="dg-l-sms"><path d="M606 108 h104 a12 12 0 0 1 12 12 v30 a12 12 0 0 1 -12 12 h-96 l-10 8 v-50 a12 12 0 0 1 12 -12 Z" fill="${GREEN}"/><circle cx="626" cy="135" r="12" fill="#fff"/>${info(626, 136, 19)}${bar(646, 124, 62, 6, INK)}${bar(646, 136, 48, 6, INK)}${bar(646, 148, 34, 5, shade(INK, 0.3))}</g>
    <g class="dg-l-pay"><rect x="604" y="190" width="132" height="112" rx="14" fill="${MIST}"/><rect x="618" y="202" width="104" height="58" rx="8" fill="${DEEP}"/><rect x="618" y="214" width="104" height="10" fill="${shade(DEEP, -0.35)}"/>${bar(628, 238, 44, 6, '#fff')}<rect x="694" y="236" width="18" height="12" rx="3" fill="${GREEN}"/><rect class="dg-l-paybtn" x="618" y="270" width="104" height="22" rx="11" fill="${GREEN}"/><path d="M660 281 l6 6 l12 -12" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>
  </g>
  <g class="dg-l-fly dg-l-fly--email">${envIcon(-23, -15.6, 46)}</g>
  <g class="dg-l-fly dg-l-fly--sms">${bubble(0, 0, 30, 24, GREEN, 'l')}${info(1, 1, 30)}</g>
  <g class="dg-l-fly dg-l-fly--pay"><rect x="-30" y="-19" width="60" height="38" rx="7" fill="${DEEP}"/><rect x="-30" y="-11" width="60" height="7" fill="${shade(DEEP, -0.35)}"/><rect x="10" y="4" width="12" height="8" rx="2" fill="${GREEN}"/></g>
  <g class="dg-l-fly dg-l-fly--bill">${clipboard(-26, -32, 52, 64, 3)}</g>
  <circle class="dg-l-dock" cx="540" cy="386" r="1" fill="none"/>
</svg>`;
}

// ---------------------------------------------------------------------------
// Static icons (240 × 170), redrawn from the live flat icons
// ---------------------------------------------------------------------------
const miniLaptop = `<rect x="44" y="20" width="152" height="104" rx="9" fill="${INK}"/><rect x="52" y="28" width="136" height="88" rx="4" fill="#fff"/><rect x="20" y="124" width="200" height="16" rx="8" fill="${INK}"/>`;
const miniPhone = (x = 66) => `<rect x="${x}" y="8" width="80" height="150" rx="12" fill="${INK}"/><rect x="${x + 7}" y="18" width="66" height="116" rx="6" fill="#fff"/><rect x="${x + 28}" y="143" width="24" height="5" rx="2.5" fill="#fff"/>`;
const ICONS = {
  eblast: `${miniLaptop}${envIcon(82, 58, 72)}${bubble(80, 26, 30, 22, DEEP, 'r')}${dots(80, 26, 11, 3.6, GREEN)}${bubble(166, 46, 26, 22, GREEN, 'l')}${info(167, 47, 28)}`,
  enotice: `${miniLaptop}<rect x="64" y="38" width="112" height="16" rx="8" fill="${LG}"/><text x="74" y="50.5" font-family="Plus Jakarta Sans, Arial, sans-serif" font-size="10" font-weight="600" fill="${INK}">www.</text>${lock(152, 30, 22, BLUE)}${clipboard(88, 66, 64, 88, 4)}`,
  pdf: `${miniLaptop}<rect x="94" y="48" width="114" height="26" rx="3" fill="#fff" stroke="${GREEN}" stroke-width="4"/><path d="M106 84 l6 -8 l6 8 Z" fill="${DEEP}"/><rect x="94" y="82" width="124" height="26" rx="2" fill="${DEEP}"/>${dots(118, 95, 12, 4, GREEN)}`,
  sms: `${miniPhone(56)}${bubble(150, 72, 40, 34, GREEN, 'l')}${info(152, 74, 44)}`,
  mms: `${miniPhone(70)}${bubble(70, 90, 26, 22, GREEN, 'r')}${dots(70, 90, 9, 3.4, DEEP)}${clipboard(128, 44, 62, 84, 4)}`,
  direct: `${miniPhone(70)}<path d="M84 40 h56 a10 10 0 0 1 10 10 v62 a10 10 0 0 1 -10 10 h-50 l-10 8 v-80 a10 10 0 0 1 10 -10 Z" fill="${MIST}"/>${statement(90, 46, 54, 66)}${check(150, 44, 11)}`,
  pay: `${miniPhone(60)}<rect x="104" y="54" width="96" height="60" rx="8" fill="${DEEP}"/><rect x="104" y="66" width="96" height="10" fill="${shade(DEEP, -0.35)}"/><rect x="176" y="92" width="16" height="11" rx="2" fill="${GREEN}"/>${check(196, 56, 14)}`,
  bill: `${miniLaptop}${statement(86, 34, 68, 80)}${check(160, 40, 13)}`,
};

write('email-stage', emailStage());
write('text-stage', textStage());
write('lab', labStage());
for (const [k, v] of Object.entries(ICONS)) write(`icon-${k}`, `${svgOpen(`dg-icon dg-icon--${k}`, '0 0 240 170')}${v}</svg>`);
console.log('wwd-digital illustrations written');
