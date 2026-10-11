// What We Do · Print & Mail family.
// Detail pages: the envelope leaves the gutter, dives into its pinned lab, the lab plays the
// service (press → inserter, certified tracking, MICR), and the envelope comes back out.
// /print-mail/: the envelope dips into each row while that row's station plays under the focus
// line. Every visual state is a pure function of scrollY (via lead()).
import { startWwd, WWD_STATE } from './wwd-common.js';
import { clamp, range, lerp, smooth } from '../geom.js';
import { writer } from '../kit.js';

const VB_W = 1200; // lab scenes are 1200 × 800
const GREEN = '#00FF84', BORDER = '#DDDDDD', BLUE = '#0076C0';
const fmt = (n) => Math.round(n).toLocaleString('en-US');
// Custom properties (the writer only handles plain style keys).
const vars = new WeakMap();
const setVar = (node, name, value) => {
  const m = vars.get(node) || {};
  if (m[name] === value) return;
  m[name] = value;
  vars.set(node, m);
  node.style.setProperty(name, value);
};
const pop = (t) => (t <= 0 ? 0 : t < 0.6 ? lerp(1.35, 0.94, t / 0.6) : lerp(0.94, 1, (t - 0.6) / 0.4));
const at = (cx, cy, k) => `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) scale(${k.toFixed(4)}) translate(${(-cx).toFixed(1)} ${(-cy).toFixed(1)})`;

export function init() {
  const page = document.body.dataset.wwd;
  const builders = {
    'print-mail': rowsLab,
    'print-mail/print-document': (ctx, api) => pinnedLab(ctx, api, pressStory(api.lab)),
    'print-mail/certified-mail': (ctx, api) => pinnedLab(ctx, api, certifiedStory(api.lab)),
    'print-mail/micr-check-printing': (ctx, api) => pinnedLab(ctx, api, micrStory(api.lab)),
  };
  startWwd(builders[page] ?? (() => null));
}

// ---------------------------------------------------------------------------
// Pinned lab: fly in from the gutter → dive into the entry dock → the story owns the
// envelope (hidden, or placed in scene coords) → fly back out to the gutter.
// ---------------------------------------------------------------------------
function pinnedLab(ctx, { lab, gx, gs, lead, docTop }, story) {
  const pin = lab.closest('.pm-pin');
  story.render(1); // finished state while measuring (no transforms left over)
  pin.style.setProperty('--lab-h', `${lab.offsetHeight}px`); // CSS centres the pinned lab on the focus line
  const WT = docTop(pin), WH = pin.offsetHeight, LH = lab.offsetHeight;
  const ST = parseFloat(getComputedStyle(lab).top) || 0;
  const r = lab.getBoundingClientRect();
  const LL = r.left, k = r.width / VB_W;
  const labTop = (sy) => Math.min(Math.max(ST, WT - sy), WT + WH - LH - sy);
  const F = ctx.F;

  // Ownership runs while lead() is inside the pin wrapper: u = 0 … 1.
  const pinStartU = clamp((F - ST) / WH);
  const pinEndU = 1 - (LH + ST - F) / WH;
  const a = Math.min(Math.max(pinStartU - 0.06, 0.08), 0.2); // reach the dock
  const s0 = Math.max(a + 0.05, pinStartU); // story starts once pinned
  const s1 = Math.max(s0 + 0.3, Math.min(pinEndU, 0.93) - 0.04); // story ends
  const ds = story.dockScale(ctx, k);

  const scene = (sy, [x, y]) => ({ x: LL + x * k, y: labTop(sy) + y * k });
  const arc = (p0, p1, t) => {
    const cx = (p0.x + p1.x) / 2, cy = Math.min(p0.y, p1.y) - 70;
    const u = 1 - t;
    return { x: u * u * p0.x + 2 * u * t * cx + t * t * p1.x, y: u * u * p0.y + 2 * u * t * cy + t * t * p1.y };
  };

  return {
    name: 'pm-lab',
    stateAfter: { ...story.exitState, shrink: 0 }, // the envelope keeps what it earned in the lab
    endDocY: WT + WH,
    update(sy) {
      const L = lead(sy);
      const u = (L - WT) / WH;
      const p = range(u, s0, s1);
      story.render(p);
      if (u <= 0 || u >= 1) return null;
      const g = { x: gx, y: L - sy };
      if (u < s0) {
        const f = smooth(range(u, 0, a));
        const pos = arc(g, scene(sy, story.entry), f);
        const dive = smooth(range(u, a, s0));
        return { pose: { x: pos.x, y: pos.y + dive * 10, scale: lerp(gs, ds, f), tilt: 0 }, s: { ...story.entryState, shrink: dive } };
      }
      if (u <= s1) {
        const e = story.envelope(p);
        const pos = scene(sy, e.pt);
        return { pose: { x: pos.x, y: pos.y, scale: ds * (e.scale ?? 1), tilt: 0 }, s: { ...e.s, shrink: e.shrink ?? 0 } };
      }
      const f = smooth(range(u, s1, 1));
      const pos = arc(scene(sy, story.exit), g, f);
      return { pose: { x: pos.x, y: pos.y, scale: lerp(ds, gs, f), tilt: 0 }, s: { ...story.exitState, shrink: 0 } };
    },
  };
}

// ---------------------------------------------------------------------------
// Print Document: the sheet drops from the feeder, prints in full colour, tri-folds,
// rides the inserter belt into the envelope; the flap seals and the envelope ships.
// ---------------------------------------------------------------------------
function pressStory(lab) {
  const w = writer();
  const q = (s) => lab.querySelector(s);
  const mask = q('.pd-print-mask'), head = q('.pd-head'), letter = q('.pd-letter');
  const top = q('.pd-panel--t'), bot = q('.pd-panel--b');
  const topFace = top.querySelector('.pd-face'), topBack = top.querySelector('.pd-back');
  const botFace = bot.querySelector('.pd-face'), botBack = bot.querySelector('.pd-back');
  const flapOpen = q('.pd-flap-open'), flapClosed = q('.pd-flap-closed'), front = q('.pd-env-front'), badge = q('.pd-badge');
  const ticks = q('.pd-belt-ticks');
  const [num1, num2] = [...lab.querySelectorAll('.pm-count__num')];
  const SX = 187.5, SY = 150, SH = 380, F1 = SH / 3, F2 = (2 * SH) / 3;
  const K = 0.62, X0 = 612, X1 = 960, Y0 = 392 - F1 * K; // belt geometry (scene coords)
  const ENV = [1035, 338];
  const END = { ...WWD_STATE, badge: 1 };

  return {
    entry: [330, 92],
    exit: ENV,
    entryState: { num: '' },
    exitState: END,
    dockScale: (ctx) => (ctx.mobile ? 0.5 : 0.78),
    envelope(p) {
      if (p < 0.5) return { pt: [330, 92], shrink: 1, s: { num: '' } };
      return { pt: ENV, shrink: 1 - smooth(range(p, 0.95, 1)), s: END };
    },
    render(p) {
      // 1 · the blank sheet drops out of the feeder
      const appear = smooth(range(p, 0, 0.07));
      // 2 · print
      const pr = range(p, 0.08, 0.42);
      w(mask, 'height', (SH * pr).toFixed(1));
      w(head, 'transform', `translate(0 ${(SH * pr).toFixed(1)})`);
      w(head, 'style:opacity', String(1 - range(p, 0.43, 0.47)));
      if (num1) w(num1, 'text', fmt(80e6 * pr));
      // 3 · tri-fold (top third, then bottom third over the middle)
      const f = range(p, 0.48, 0.58);
      const st = 1 - 2 * clamp(f * 1.15), sb = 1 - 2 * clamp(f * 1.15 - 0.15);
      w(top, 'transform', `translate(0 ${F1.toFixed(2)}) scale(1 ${st.toFixed(3)}) translate(0 ${(-F1).toFixed(2)})`);
      w(bot, 'transform', `translate(0 ${F2.toFixed(2)}) scale(1 ${sb.toFixed(3)}) translate(0 ${(-F2).toFixed(2)})`);
      w(topFace, 'style:opacity', st >= 0 ? '1' : '0');
      w(topBack, 'style:opacity', st < 0 ? '1' : '0');
      w(botFace, 'style:opacity', sb >= 0 ? '1' : '0');
      w(botBack, 'style:opacity', sb < 0 ? '1' : '0');
      // 4 · lift onto the belt, ride into the envelope
      const m = smooth(range(p, 0.58, 0.66));
      const ride = smooth(range(p, 0.66, 0.8));
      const s = lerp(1, K, m);
      const x = lerp(SX, X0, m) + (X1 - X0) * ride;
      const y = lerp(SY - 40 * (1 - appear), Y0 - F1 * K, m) - Math.sin(m * Math.PI) * 46;
      w(letter, 'transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(4)})`);
      w(letter, 'style:opacity', String(Math.round(appear * (1 - range(p, 0.9, 0.92)) * 1000) / 1000));
      w(ticks, 'transform', `translate(${((ride * 168) % 24).toFixed(1)} 0)`);
      if (num2) w(num2, 'text', fmt(30e6 * ride));
      // 5 · the flap closes, the check pops
      const c = range(p, 0.8, 0.86);
      w(flapOpen, 'transform', `translate(930 0) scale(${clamp(1 - 2 * c).toFixed(3)} 1) translate(-930 0)`);
      w(flapClosed, 'transform', `translate(930 0) scale(${clamp(2 * c - 1).toFixed(3)} 1) translate(-930 0)`);
      w(flapOpen, 'style:opacity', c < 0.5 ? '1' : '0');
      w(flapClosed, 'style:opacity', c > 0.5 ? '1' : '0');
      const b = range(p, 0.86, 0.9);
      // 6 · the envelope shrinks to the traveling size and hands off
      const out = smooth(range(p, 0.9, 0.97));
      const shrinkTo = at(ENV[0], ENV[1], lerp(1, 0.42, out));
      const fade = 1 - range(p, 0.95, 0.99);
      w(front, 'transform', shrinkTo);
      w(front, 'style:opacity', String(fade));
      w(flapClosed.parentNode, 'transform', shrinkTo);
      w(flapClosed.parentNode, 'style:opacity', String(fade));
      w(badge, 'transform', `${shrinkTo} translate(1128 270) scale(${pop(b).toFixed(3)})`);
      w(badge, 'style:opacity', String(b > 0 ? fade : 0));
    },
  };
}

// ---------------------------------------------------------------------------
// Certified Mail: the big envelope grows out of the dock and gets the certified label and
// barcode; then the traveling envelope is tracked down the timeline to proof of delivery.
// ---------------------------------------------------------------------------
function certifiedStory(lab) {
  const w = writer();
  const q = (s) => lab.querySelector(s);
  const env = q('.ce-env'), label = q('.ce-label'), mask = q('.ce-bar-mask'), beam = q('.ce-beam');
  const nodes = [...lab.querySelectorAll('.ce-node circle')], progress = q('.ce-progress');
  const proof = q('.ce-proof'), sign = q('.ce-sign'), ok = q('.ce-ok');
  const DOCK = [420, 391];
  const NODE_Y = [228, 348, 468, 588];
  const CERT = { ...WWD_STATE, badge: 1 };
  const travel = (p) => smooth(range(p, 0.44, 0.8));

  return {
    entry: DOCK,
    exit: [820, NODE_Y[3]],
    entryState: { ...WWD_STATE },
    exitState: CERT,
    dockScale: (ctx) => (ctx.mobile ? 0.4 : 0.74),
    envelope(p) {
      if (p < 0.4) return { pt: DOCK, shrink: 1, s: WWD_STATE };
      const t = travel(p);
      return { pt: [820, lerp(NODE_Y[0], NODE_Y[3], t)], shrink: 1 - smooth(range(p, 0.4, 0.44)), s: CERT };
    },
    render(p) {
      // the big certified envelope grows out of the dock and stays on stage
      const grow = smooth(range(p, 0, 0.08));
      w(env, 'transform', at(DOCK[0], DOCK[1], lerp(0.14, 1, grow)));
      w(env, 'style:opacity', String(Math.round(grow * 1000) / 1000));
      // certified label stamps on, the barcode prints, a scan reads it
      const l = range(p, 0.1, 0.18);
      w(label, 'transform', at(306, 292, pop(l)));
      w(label, 'style:opacity', l > 0 ? '1' : '0');
      w(mask, 'width', (276 * range(p, 0.16, 0.28)).toFixed(1));
      const sc = range(p, 0.28, 0.34);
      w(beam, 'transform', `translate(${(270 * sc).toFixed(1)} 0)`);
      w(beam, 'style:opacity', sc > 0 && sc < 1 ? '1' : '0');
      // tracked every step of the way
      const t = travel(p);
      const reached = [p >= 0.33, t >= 1 / 3 - 0.01, t >= 2 / 3 - 0.01, t >= 0.999];
      nodes.forEach((n, i) => {
        w(n, 'fill', reached[i] ? GREEN : '#fff');
        w(n, 'stroke', reached[i] ? BLUE : BORDER);
      });
      w(progress, 'stroke-dashoffset', (1 - t).toFixed(3));
      // proof of delivery
      const pc = smooth(range(p, 0.8, 0.86));
      w(proof, 'transform', `translate(0 ${(60 * (1 - pc)).toFixed(1)})`);
      w(proof, 'style:opacity', String(pc));
      w(sign, 'stroke-dashoffset', (1 - range(p, 0.84, 0.94)).toFixed(3));
      const o = range(p, 0.94, 0.98);
      w(ok, 'transform', `translate(744 492) scale(${pop(o).toFixed(3)})`);
      w(ok, 'style:opacity', o > 0 ? '1' : '0');
    },
  };
}

// ---------------------------------------------------------------------------
// MICR Check Printing: the check grows out of the envelope, prints under the head, the MICR
// line prints in magnetic ink, the reader verifies each character, and the check goes back.
// ---------------------------------------------------------------------------
function micrSetup(root) {
  const w = writer();
  const q = (s) => root.querySelector(s);
  const glyphs = [...root.querySelectorAll('.mi-g')];
  const under = glyphs.map((g) => g.querySelector('.mi-u'));
  const gx = under.map((u) => parseFloat(u.getAttribute('x')) + parseFloat(u.getAttribute('width')));
  const reader = q('.mi-reader');
  const rx0 = parseFloat(under[0].getAttribute('x')) - 30;
  const rx1 = gx[gx.length - 1] + 14;
  return {
    w, q, glyphs, under, reader, ok: q('.mi-ok'),
    micr(mp, rp) {
      // characters print one by one, then the reader verifies them
      const n = glyphs.length;
      glyphs.forEach((g, i) => w(g, 'style:opacity', mp >= (i + 0.5) / n ? '1' : '0'));
      const x = lerp(rx0, rx1, rp);
      w(reader, 'transform', `translate(${x.toFixed(1)} 0)`);
      w(reader, 'style:opacity', String(range(rp, 0, 0.04) * (1 - range(rp, 0.97, 1))));
      under.forEach((u, i) => w(u, 'fill', rp > 0 && x >= gx[i] ? GREEN : BORDER));
    },
  };
}

function micrStory(lab) {
  const m = micrSetup(lab);
  const { w, q } = m;
  const check = q('.mi-check'), mask = q('.mi-print-mask'), head = q('.mi-head'), sign = q('.mi-sign');
  const DOCK = [210, 375];
  const END = { ...WWD_STATE, badge: 1 };
  return {
    entry: DOCK,
    exit: DOCK,
    entryState: { ...WWD_STATE },
    exitState: END,
    dockScale: (ctx) => (ctx.mobile ? 0.5 : 0.78),
    envelope(p) {
      return { pt: DOCK, shrink: p < 0.5 ? 1 : 1 - smooth(range(p, 0.95, 1)), s: p < 0.5 ? WWD_STATE : END };
    },
    render(p) {
      const grow = smooth(range(p, 0, 0.08)), back = smooth(range(p, 0.9, 0.97));
      w(check, 'transform', at(DOCK[0], DOCK[1], lerp(0.12, 1, grow) * lerp(1, 0.12, back)));
      w(check, 'style:opacity', String(Math.round(grow * (1 - range(p, 0.94, 0.97)) * 1000) / 1000));
      const pr = range(p, 0.08, 0.42);
      w(mask, 'height', (450 * pr).toFixed(1));
      w(head, 'transform', `translate(0 ${(450 * pr).toFixed(1)})`);
      w(head, 'style:opacity', String(range(p, 0.02, 0.06) * (1 - range(p, 0.42, 0.46))));
      w(sign, 'stroke-dashoffset', (1 - range(pr, 0.66, 0.78)).toFixed(3));
      m.micr(range(p, 0.46, 0.64), range(p, 0.64, 0.84));
      const o = range(p, 0.84, 0.88);
      w(m.ok, 'transform', `translate(1046 542) scale(${pop(o).toFixed(3)})`);
      w(m.ok, 'style:opacity', o > 0 ? '1' : '0');
    },
  };
}

// ---------------------------------------------------------------------------
// /print-mail/: each row is a station. The focus line is the print head: the row's station
// plays as the line crosses its media, and the envelope dips in from the gutter.
// ---------------------------------------------------------------------------
function rowsLab(ctx, { gx, gs, lead, state, docTop }) {
  const w = writer();
  const rows = [...document.querySelectorAll('.pm-row')];
  if (!rows.length) return null;
  const micrRoot = document.querySelector('.pm-media--micr');
  const micr = micrRoot ? micrSetup(micrRoot) : null;
  if (micr) micr.micr(1, 1);

  const info = rows.map((row) => {
    const media = row.querySelector('.pm-media');
    const r = media.getBoundingClientRect();
    return {
      row, media, kind: row.dataset.station,
      top: docTop(media), h: media.offsetHeight, left: r.left,
      photo: media.querySelector('.pm-photo'), head: media.querySelector('.pm-head'),
      label: media.querySelector('.pm-label'), dots: [...media.querySelectorAll('.pm-track li')], track: media.querySelector('.pm-track'),
    };
  });
  const first = info[0].top - 120;
  const last = info[info.length - 1].top + info[info.length - 1].h + 120;
  const dip = ctx.mobile ? 30 : 34;
  const cert = info.find((m) => m.kind === 'certified');

  const station = (m, mp) => {
    if (m.kind === 'print') {
      const pr = range(mp, 0.04, 0.86);
      w(m.photo, 'style:clipPath', `inset(0 0 ${(100 - pr * 100).toFixed(2)}% 0)`);
      w(m.head, 'style:transform', `translate3d(0, ${(pr * m.h).toFixed(1)}px, 0)`);
      w(m.head, 'style:opacity', String(1 - range(mp, 0.86, 0.92)));
      return pr >= 1;
    }
    if (m.kind === 'certified') {
      const l = range(mp, 0.28, 0.38);
      w(m.label, 'style:transform', `scale(${pop(l).toFixed(3)})`);
      w(m.label, 'style:opacity', l > 0 ? '1' : '0');
      const t = range(mp, 0.42, 0.82);
      m.dots.forEach((d, i) => w(d, 'class', `is-off|${t >= i / 3 - 0.001 && mp >= 0.42 ? 0 : 1}`));
      setVar(m.track, '--trk', t.toFixed(3));
      return mp >= 0.84;
    }
    if (m.kind === 'micr' && micr) {
      micr.micr(range(mp, 0.12, 0.48), range(mp, 0.5, 0.8));
      const o = range(mp, 0.8, 0.86);
      w(micr.ok, 'transform', `translate(1046 542) scale(${pop(o).toFixed(3)})`);
      w(micr.ok, 'style:opacity', o > 0 ? '1' : '0');
      return mp >= 0.86;
    }
    return false;
  };

  return {
    name: 'pm-rows',
    update(sy) {
      const L = lead(sy);
      let x = gx;
      for (const m of info) {
        const mp = (L - m.top) / m.h;
        w(m.row, 'class', `is-done|${station(m, mp) ? 1 : 0}`);
        const t = (L - (m.top - 70)) / (m.h + 140);
        if (t > 0 && t < 1) x = lerp(gx, m.left + dip, smooth(range(t, 0, 0.24)) * (1 - smooth(range(t, 0.76, 1))));
      }
      if (L < first || L > last) return null;
      const badge = cert && (L - cert.top) / cert.h >= 0.84 ? 1 : 0;
      return { pose: { x, y: L - sy, scale: gs, tilt: 0 }, s: { ...state, badge } };
    },
  };
}
