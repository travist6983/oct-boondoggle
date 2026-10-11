// What We Do · Ancillary A (addresses and contact data).
// One "records lab" engine drives every page's lab: the envelope leaves the gutter, works its
// docks inside the lab while scan sweeps and status marks play, then returns to the gutter
// carrying the marks it earned (green window, check badge, phone, corrected address tag).
// Every state is a pure function of the envelope's lead (scroll), so it replays in reverse.
import { startWwd, WWD_STATE } from './wwd-common.js';
import { Leg, prepRouteSvg, routePair, clamp, lerp, smooth, range } from '../geom.js';
import { docTop, writer } from '../kit.js';

export function init() {
  startWwd(buildLab);
}

const LABS = { landing: lineLab, aec: aecLab, cdn: cdnLab, vacant: vacantLab, return: returnLab, phone: phoneLab };

function buildLab(ctx, api) {
  const kind = [...document.body.classList].find((c) => c.startsWith('anc-page--'))?.slice(10);
  return LABS[kind] ? recordsLab(ctx, api, LABS[kind]) : null;
}

// Smooth curve through points (Catmull-Rom → cubic Bézier).
function smoothPath(pts) {
  const f = (n) => n.toFixed(1);
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
  }
  return d;
}

/**
 * make({ ctx, lab, L, es }) → {
 *   pts: route points (lab-local px), stops: [{ i, at, until? }] (when the envelope reaches point i),
 *   or ride: { from, to, A, Z } (one constant-speed ride between two points) with ready(pOfT, tOf),
 *   state(p): envelope marks, frame?(p, w, lead): per-frame scene writes, scale?: envelope scale factor,
 *   runwayAfter?: lead runway after the lab, in viewport heights }
 * Elements with data-at="p" get .is-on once p ≥ at; data-active="a,b" gets .is-active in [a, b).
 */
function recordsLab(ctx, api, make) {
  const { lab, gx, gs, lead } = api;
  const w = writer();
  const svg = lab.querySelector('.anc-lab__route');
  const box = lab.getBoundingClientRect();
  prepRouteSvg(svg, lab.clientWidth, lab.clientHeight);
  const top = docTop(lab);
  const es = parseFloat(getComputedStyle(lab).getPropertyValue('--es')) || 1;
  const L = (el) => {
    const b = el.getBoundingClientRect();
    return { x: b.left - box.left, y: b.top - box.top, w: b.width, h: b.height, cx: b.left - box.left + b.width / 2, cy: b.top - box.top + b.height / 2 };
  };
  const cfg = make({ ctx, lab, L, es, W: box.width, H: box.height });

  // The lab owns the envelope while its lead is within the lab plus a runway above and below
  // (never before the gutter starts at the top of the body).
  const body = document.querySelector('.wwd-body');
  const bodyTop = docTop(body), bodyEnd = bodyTop + body.offsetHeight;
  const m = ctx.vh * 0.3;
  const s0 = Math.max(top - m, bodyTop + 4), s1 = Math.min(top + box.height + ctx.vh * (cfg.runwayAfter ?? 0.3), bodyEnd - 8);
  const span = s1 - s0;

  // The route starts and ends on the gutter line and the envelope leaves/rejoins it at the
  // gutter's own speed (Hermite ease), so both hand-offs are seamless.
  const gxL = gx - box.left;
  const pts = [[gxL, s0 - top], ...cfg.pts, [gxL, s1 - top]];
  const { plan, ink } = routePair(svg, smoothPath(pts));
  const leg = new Leg(plan, lab, { ink });
  const tAt = pts.map(([x, y]) => leg.tNear(x, y, 600));
  const v = span / Math.max(1, leg.raw.totalLength); // dt/dp when riding at gutter speed
  const o = 1; // cfg.pts indices are offset by the gutter start point
  const keys = [[0, 0]];
  let first, last;
  if (cfg.ride) {
    // one constant-speed ride from the first to the last point (no holds), eased in and out of the gutter
    const { from, to, A, Z } = cfg.ride;
    const t0 = tAt[from + o], t1 = tAt[to + o], slope = (t1 - t0) / (Z - A);
    keys.push([A, t0, { m0: v, m1: slope }], [Z, t1, { m0: slope, m1: slope }], [1, 1, { m0: slope, m1: v }]);
    cfg.ready?.((tt) => A + (tt - t0) / slope, (i) => tAt[i + o]);
    first = A;
    last = Z;
  } else {
    cfg.stops.forEach((s, i) => {
      keys.push([s.at, tAt[s.i + o], i === 0 ? { m0: v, m1: 0 } : null]);
      if (s.until != null) keys.push([s.until, tAt[s.i + o]]);
    });
    keys.push([1, 1, { m0: 0, m1: v }]);
    first = cfg.stops[0].at;
    last = cfg.stops[cfg.stops.length - 1].until ?? cfg.stops[cfg.stops.length - 1].at;
  }

  const steps = [...lab.querySelectorAll('[data-at]')].map((n) => [n, parseFloat(n.dataset.at)]);
  const actives = [...lab.querySelectorAll('[data-active]')].map((n) => [n, ...n.dataset.active.split(',').map(Number)]);
  const final = cfg.state(1);
  const scale = es * (cfg.scale ?? 1);

  return {
    name: 'anc-lab',
    stateAfter: { ...WWD_STATE, ...final }, // the marks it earned ride on through the bands
    endDocY: s1,
    update(sy) {
      const Ld = lead(sy);
      const p = clamp((Ld - s0) / span);
      for (const [n, at] of steps) w(n, 'class', `is-on|${p >= at ? 1 : 0}`);
      for (const [n, a, b] of actives) w(n, 'class', `is-active|${p >= a && p < b ? 1 : 0}`);
      cfg.frame?.(p, w, Ld);
      const t = mixedKeys(keys, p);
      leg.draw(t);
      if (Ld < s0 || Ld > s1) return null; // the shared gutter carries it (with stateAfter)
      const q = leg.at(t);
      const k = Math.min(smooth(range(p, first * 0.35, first)), 1 - smooth(range(p, last, last + (1 - last) * 0.65)));
      return {
        pose: { x: box.left + q.x, y: top - sy + q.y, scale: lerp(gs, scale, k), tilt: 0 },
        s: { ...WWD_STATE, ...cfg.state(p) },
      };
    },
  };
}

// Piecewise keyframes (progress → value). A segment is smoothstep (stops at both ends) unless its
// end key carries Hermite tangents { m0, m1 } (dvalue/dprogress at the start and end).
function mixedKeys(keys, p) {
  if (p <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [p1, v1, h] = keys[i];
    if (p <= p1) {
      const [p0, v0] = keys[i - 1];
      const u = range(p, p0, p1);
      if (!h) return lerp(v0, v1, smooth(u));
      const d = p1 - p0, u2 = u * u, u3 = u2 * u;
      return (2 * u3 - 3 * u2 + 1) * v0 + (u3 - 2 * u2 + u) * d * h.m0 + (-2 * u3 + 3 * u2) * v1 + (u3 - u2) * d * h.m1;
    }
  }
  return keys[keys.length - 1][1];
}

const fade = (p, a, b) => smooth(range(p, a, b));

// ---------------------------------------------------------------------------
// Address Element Correction: the envelope docks; a scan reads the address left to right and
// each missing element (directional, suffix, unit, ZIP+4) is corrected as the beam passes it.
// ---------------------------------------------------------------------------
function aecLab({ lab, L, es }) {
  const dock = L(lab.querySelector('[data-dock="main"]'));
  const bodyEl = lab.querySelector('.anc-card__body');
  const B = L(bodyEl);
  const scan = lab.querySelector('.anc-scan');
  const P0 = 0.32, P1 = 0.62;
  lab.querySelectorAll('.anc-slot').forEach((s) => {
    s.dataset.at = (P0 + (P1 - P0) * clamp((L(s).cx - B.x) / B.w)).toFixed(3);
  });
  return {
    pts: [[2, dock.cy - 46 * es], [dock.cx, dock.cy], [2, dock.cy + 64 * es]],
    stops: [{ i: 1, at: 0.3, until: 0.74 }],
    state: (p) => ({ aec: p >= 0.66, badge: fade(p, 0.66, 0.72) }),
    frame(p, w) {
      const v = range(p, P0, P1);
      w(scan, 'style:transform', `translate3d(${(v * (B.w - 3)).toFixed(1)}px,0,0)`);
      w(scan, 'style:opacity', p > P0 && p < P1 ? '1' : '0');
    },
  };
}

// ---------------------------------------------------------------------------
// USPS CASS, DPV, NCOA: standardize at the curb (CASS), confirm the delivery point at house 12
// (DPV), then follow the change of address to house 48 (NCOA).
// ---------------------------------------------------------------------------
function cdnLab({ lab, L, es, H }) {
  const steps = { cass: [0.2, 0.34], dpv: [0.36, 0.5], ncoa: [0.52, 0.72] };
  lab.querySelectorAll('.anc-step').forEach((n) => (n.dataset.active = steps[n.dataset.step].join(',')));
  const slot = (lot) => {
    const a = L(lab.querySelector(`[data-lot="${lot}"] .anc-anchor`));
    return [a.cx, a.cy - 24 * es];
  };
  const a12 = slot(12), a48 = slot(48);
  const street = L(lab.querySelector('.anc-street'));
  const entryEl = lab.querySelector('[data-dock="entry"]');
  const entryOn = entryEl && getComputedStyle(entryEl).position !== 'absolute';
  const entry = entryOn ? L(entryEl) : null;
  const pts = entryOn
    ? [[2, entry.cy - 30], [entry.cx, entry.cy], a12, a48, [(a12[0] + a48[0]) / 2, street.y + street.h - 8], [2, H - 18]]
    : [[2, street.y + 20], [a12[0] - 30 * es, a12[1] - 20], a12, a48, [(a12[0] + a48[0]) / 2, street.y + street.h - 8], [2, H - 18]];
  return {
    pts,
    stops: [{ i: 1, at: 0.24, until: 0.34 }, { i: 2, at: 0.44, until: 0.56 }, { i: 3, at: 0.66, until: 0.76 }],
    scale: 0.8,
    state: (p) => ({
      tag: fade(p, 0.2, 0.26),
      num: p >= 0.58 ? '48' : '12',
      strike: p >= 0.54 && p < 0.58 ? 1 : 0,
      corrected: p >= 0.68,
      aec: p >= 0.3,
      badge: fade(p, 0.72, 0.76),
    }),
  };
}

// ---------------------------------------------------------------------------
// Vacant Address Search: a search sweeps the street; occupied houses check green, house 30 is
// flagged vacant, so the envelope addressed to it is held back (its tag is struck) and returns.
// ---------------------------------------------------------------------------
function vacantLab({ lab, L, es, H }) {
  const street = L(lab.querySelector('.anc-street'));
  const sweep = lab.querySelector('.anc-sweep');
  const P0 = 0.3, P1 = 0.64;
  let vacantAt = 0.45;
  lab.querySelectorAll('.anc-lot').forEach((lot) => {
    const at = (P0 + (P1 - P0) * clamp((L(lot).cx - street.x) / street.w)).toFixed(3);
    lot.querySelector('.anc-flag').dataset.at = at;
    const row = lab.querySelector(`[data-addr="${lot.dataset.lot}"]`);
    if (row) row.dataset.at = at;
    if (lot.classList.contains('anc-lot--vacant')) {
      lot.dataset.at = at;
      vacantAt = +at;
    }
  });
  // the envelope waits low, in front of the vacant house's mailbox
  const a = L(lab.querySelector('[data-lot="30"] .anc-anchor'));
  const a30 = [a.cx, a.cy + 6 * es];
  const sw = L(sweep);
  return {
    pts: [[2, a30[1] - 10], a30, [a30[0] * 0.5, street.y + street.h - 6], [2, H - 18]],
    stops: [{ i: 1, at: 0.3, until: Math.max(vacantAt + 0.12, 0.7) }],
    scale: 0.62,
    state: (p) => ({ tag: fade(p, 0.2, 0.26), num: '30', strike: p >= vacantAt + 0.02 ? 1 : 0 }),
    frame(p, w) {
      const v = range(p, P0, P1);
      w(sweep, 'style:transform', `translate3d(${(v * street.w - sw.w / 2).toFixed(1)}px,0,0)`);
      w(sweep, 'style:opacity', p > P0 && p < P1 ? '1' : '0');
    },
  };
}

// ---------------------------------------------------------------------------
// Return Mail Processing: the returned envelope (to house 12) is received, scanned, the record
// is updated to house 48, and the envelope goes back out to the right address.
// ---------------------------------------------------------------------------
function returnLab({ lab, L, H }) {
  const tray = L(lab.querySelector('[data-dock="tray"]'));
  const scanDock = lab.querySelector('[data-dock="scan"]');
  const sd = L(scanDock);
  const scanBox = L(scanDock.parentElement);
  const scan = lab.querySelector('.anc-scan--h');
  const S0 = 0.48, S1 = 0.6;
  return {
    pts: [[2, tray.cy - 40], [tray.cx, tray.cy], [sd.cx, sd.cy], [sd.cx * 0.55, H - 22], [2, H - 18]],
    stops: [{ i: 1, at: 0.28, until: 0.38 }, { i: 2, at: 0.46, until: 0.74 }],
    state: (p) => ({
      tag: fade(p, 0.2, 0.26),
      num: p >= 0.66 ? '48' : '12',
      strike: p >= 0.62 && p < 0.66 ? 1 : 0,
      corrected: p >= 0.68,
      aec: p >= 0.68,
    }),
    frame(p, w) {
      const v = range(p, S0, S1);
      w(scan, 'style:transform', `translate3d(0,${(8 + v * (scanBox.h - 16)).toFixed(1)}px,0)`);
      w(scan, 'style:opacity', p > S0 && p < S1 ? '1' : '0');
    },
  };
}

// ---------------------------------------------------------------------------
// Phone Search: a search runs down the candidate numbers, the verified match fills the record's
// phone field, and the envelope gains its phone mark.
// ---------------------------------------------------------------------------
function phoneLab({ lab, L, es }) {
  const dock = L(lab.querySelector('[data-dock="main"]'));
  const list = L(lab.querySelector('.anc-cands'));
  const sweep = lab.querySelector('.anc-sweep--v');
  const sw = L(sweep);
  const match = L(lab.querySelector('.anc-cand--match'));
  const P0 = 0.32, P1 = 0.56;
  const stopAt = (match.cy - list.y) / list.h; // the sweep settles on the match
  return {
    pts: [[2, dock.cy - 46 * es], [dock.cx, dock.cy], [2, dock.cy + 64 * es]],
    stops: [{ i: 1, at: 0.3, until: 0.76 }],
    state: (p) => ({ phone: fade(p, 0.64, 0.7), badge: fade(p, 0.68, 0.72) }),
    frame(p, w) {
      const v = range(p, P0, P1);
      // sweep the whole list once, then come back to rest on the match
      const pos = v < 0.75 ? v / 0.75 : lerp(1, stopAt, (v - 0.75) / 0.25);
      w(sweep, 'style:transform', `translate3d(0,${(list.y - sw.y + pos * list.h - sw.h / 2).toFixed(1)}px,0)`);
      w(sweep, 'style:opacity', p > P0 && p < P1 + 0.04 ? '1' : '0');
    },
  };
}

// ---------------------------------------------------------------------------
// Landing: the service line. The envelope visits each of the eleven stations in turn (each one
// lights up), picking up marks at AEC, Phone Search, and USPS CASS/DPV/NCOA; below, each row's
// icon lights as the envelope passes it in the gutter.
// ---------------------------------------------------------------------------
function lineLab({ lab, L, W, H }) {
  const stations = [...lab.querySelectorAll('.anc-station')];
  const tiles = stations.map((s) => ({ s, r: L(s.querySelector('.anc-station__tile')) }));
  // group into rows, then snake: left→right, right→left, …
  const rows = [];
  for (const t of tiles) {
    const row = rows.find((r) => Math.abs(r[0].r.cy - t.r.cy) < 8);
    row ? row.push(t) : rows.push([t]);
  }
  rows.forEach((r, i) => r.sort((a, b) => (i % 2 ? b.r.cx - a.r.cx : a.r.cx - b.r.cx)));
  const order = rows.flat();
  const pts = [[2, rows[0][0].r.cy]];
  const idx = [];
  rows.forEach((r, i) => {
    r.forEach((t) => { idx.push(pts.length); pts.push([t.r.cx, t.r.cy]); });
    const next = rows[i + 1];
    if (next) {
      const edge = i % 2 ? 30 : W - 30;
      pts.push([edge, r[0].r.cy + (next[0].r.cy - r[0].r.cy) * 0.15], [edge, next[0].r.cy - (next[0].r.cy - r[0].r.cy) * 0.15]);
    }
  });
  pts.push([2, H - 16]);
  const at = {};
  const rowsEls = [...document.querySelectorAll('.anc-row')].map((r) => [r, docTop(r) + r.offsetHeight * 0.45]);
  return {
    pts,
    stops: [],
    ride: { from: idx[0], to: idx[idx.length - 1], A: 0.24, Z: 0.84 },
    runwayAfter: 0.45,
    scale: 0.72,
    // each station lights the moment the envelope reaches it
    ready(pOfT, tOf) {
      order.forEach((t, j) => {
        const v = Math.max(0, pOfT(tOf(idx[j])) - 0.004).toFixed(4);
        t.s.dataset.at = v;
        at[t.s.dataset.key] = +v;
      });
    },
    state: (p) => ({
      aec: p >= at.aec,
      phone: fade(p, at['phone-search'], at['phone-search'] + 0.03),
      badge: fade(p, at['usps-cass-dpv-ncoa'], at['usps-cass-dpv-ncoa'] + 0.03),
    }),
    frame(p, w, Ld) {
      for (const [r, y] of rowsEls) w(r, 'class', `is-reached|${Ld >= y ? 1 : 0}`);
    },
  };
}
