// Ancillary B lab scenes. Each scene scrubs its SVG (drawn in the final state by
// scripts/illustrations/wwd-anc-b.mjs) from u ∈ [0, 1] and returns where the envelope is:
//   update(u) → { x, y, ew, s }   (lab SVG units; ew = envelope width in units; s = envelope state)
// Every write is a pure function of u, so scrolling backwards replays the scene in reverse.
import { clamp, lerp, smooth, range, keyed } from '../geom.js';
import { WWD_STATE } from './wwd-common.js';

const q = (root, s) => root.querySelector(s);
const qa = (root, s) => [...root.querySelectorAll(s)];
const base = (el) => [parseFloat(el.dataset.x), parseFloat(el.dataset.y)];
const f3 = (n) => Math.round(n * 1000) / 1000;
const f1 = (n) => Math.round(n * 10) / 10;

// A tiny pop: 0 → overshoot → 1 over t ∈ [0, 1].
const pop = (t) => (t <= 0 ? 0 : t < 0.6 ? lerp(0, 1.18, smooth(t / 0.6)) : lerp(1.18, 1, smooth((t - 0.6) / 0.4)));
// Quadratic arc between two points with a lift.
const arc = (a, b, t, lift) => {
  const c = [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - lift];
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
};
// Keyframed point: keys = [[u, [x, y]], …], smoothstep between keys.
const kp = (keys, u) => [keyed(keys.map(([k, p]) => [k, p[0]]), u), keyed(keys.map(([k, p]) => [k, p[1]]), u)];

function place(w, el, x, y, k = 1, rot = 0) {
  w(el, 'transform', `translate(${f1(x)} ${f1(y)})${rot ? ` rotate(${f1(rot)})` : ''}${k !== 1 ? ` scale(${f3(k)})` : ''}`);
}
const op = (w, el, v) => w(el, 'style:opacity', String(f3(clamp(v))));
// Pop a mark in place. Marks are positioned with a translate() attribute, which a CSS transform
// would replace, so the base translate is folded into the style transform.
const baseT = (el) => {
  if (!el._t) {
    const m = /translate\(([-\d.]+)[ ,]+([-\d.]+)\)/.exec(el.getAttribute('transform') || '');
    el._t = m ? [parseFloat(m[1]), parseFloat(m[2])] : [0, 0];
  }
  return el._t;
};
const popAt = (w, el, t) => {
  const k = pop(clamp(t));
  const [x, y] = baseT(el);
  w(el, 'style:opacity', k > 0 ? '1' : '0');
  w(el, 'style:transform', `translate(${x}px, ${y}px) scale(${f3(Math.max(k, 0.001))})`);
};
const draw = (w, path, t) => w(path, 'style:strokeDashoffset', String(f3(1 - clamp(t))));

// The envelope state: sealed + stamped, optionally opened (flap) and badged.
const env = ({ seal = 1, badge = 0 } = {}) => ({ ...WWD_STATE, seal, badge });

// ---------------------------------------------------------------------------
// Bankruptcy & Deceased: the scan beam and the envelope pass every record; clean records send
// their letter to the outbound tray, flagged ones move to the care tray.
// ---------------------------------------------------------------------------
function bankruptcy(svg, w) {
  const recs = qa(svg, '.bd-rec');
  const beam = q(svg, '.bd-beam');
  const lane = 404, top = 30, bottom = 570, U0 = 0.05, U1 = 0.78;
  const rows = recs.map((el, i) => {
    const flagged = el.classList.contains('is-flagged');
    const [fx, fy] = flagged ? [parseFloat(el.dataset.fromX), parseFloat(el.dataset.fromY)] : base(el);
    const cy = fy + 31;
    return {
      el, flagged, cy, at: U0 + ((cy - top) / (bottom - top)) * (U1 - U0),
      from: [fx, fy], to: base(el),
      mark: q(el, '.rec__mark'), bg: q(el, '.rec__bg'),
      sheet: q(svg, `.bd-sheet-${i}`), slot: q(svg, `.bd-slot-${i}`),
    };
  });
  const OUT = [618, 150];
  return {
    update(u) {
      const by = lerp(top, bottom, range(u, U0, U1));
      place(w, beam, 0, by);
      op(w, beam, u > U0 && u < U1 ? Math.min(1, range(u, U0, U0 + 0.03), 1 - range(u, U1 - 0.03, U1)) : 0);
      const gather = range(u, 0.9, 0.95);
      rows.forEach((r) => {
        const t = u - r.at;
        if (r.flagged) {
          popAt(w, r.mark, t / 0.035);
          w(r.bg, 'stroke', t > 0 ? 'rgba(0,118,192,0.55)' : '#DDDDDD');
          const m = smooth(range(t, 0.02, 0.12));
          const [x, y] = arc(r.from, r.to, m, 40);
          place(w, r.el, x, y, lerp(1, 0.84, m));
          op(w, r.slot, range(t, 0.04, 0.08));
        } else {
          popAt(w, r.mark, t / 0.035);
          const s = r.sheet;
          const m = smooth(range(t, 0.01, 0.09));
          const [tx, ty] = base(s);
          const from = [300, r.cy];
          const [x, y] = gather > 0 ? [lerp(tx, OUT[0], smooth(gather)), lerp(ty, OUT[1] + 10, smooth(gather))] : arc(from, [tx, ty], m, 60);
          place(w, s, x, y, gather > 0 ? lerp(1, 0.3, smooth(gather)) : lerp(0.5, 1, m));
          op(w, s, t < 0.01 ? 0 : gather >= 1 ? 0 : 1);
        }
      });
      // envelope rides the lane with the beam, then collects the letters and is cleared
      const p = u < 0.8 ? [lane, clamp(by, 44, 556)] : kp([[0.8, [lane, 556]], [0.9, [OUT[0], OUT[1] + 6]]], u);
      return { x: p[0], y: p[1], ew: 104, s: env({ badge: range(u, 0.95, 0.99) }) };
    },
  };
}

// ---------------------------------------------------------------------------
// Email Verification: the envelope opens and sends an email card down each branch; valid
// inboxes accept, invalid ones bounce. The deliverability gauge rises with every acceptance.
// ---------------------------------------------------------------------------
function email(svg, w) {
  const HUB = [400, 96];
  const pills = qa(svg, '.ev-pill').map((el, i) => {
    const branch = q(svg, `.ev-branch-${i}`);
    const len = branch.getTotalLength();
    return {
      el, bad: el.classList.contains('is-bad'), branch, len,
      at: 0.07 + i * 0.112,
      card: q(svg, `.ev-card-${i}`), cardRest: base(q(svg, `.ev-card-${i}`)),
      bg: q(el, '.ev-pill__bg'), body: q(el, '.ev-pill__body'), mark: q(el, '.ev-mark'), strike: q(el, '.ev-strike'),
    };
  });
  const fill = q(svg, '.ev-gauge__fill');
  const needle = q(svg, '.ev-gauge__needle');
  const pt = (p, t) => {
    const a = p.branch.getPointAtLength(clamp(t) * p.len);
    return [a.x, a.y];
  };
  return {
    update(u) {
      let accepted = 0;
      pills.forEach((p) => {
        const t = u - p.at;
        // branch draws, then the card travels it
        const d = range(t, 0, 0.05);
        const bounced = p.bad && t >= 0.1;
        w(p.branch, 'class', `is-bounced|${bounced ? 1 : 0}`);
        draw(w, p.branch, bounced ? 1 : d);
        const go = smooth(range(t, 0.03, 0.1));
        let pos, k = 1, o;
        if (!p.bad) {
          const settle = smooth(range(t, 0.1, 0.13));
          const end = pt(p, 1);
          pos = settle > 0 ? [lerp(end[0], p.cardRest[0], settle), lerp(end[1], p.cardRest[1], settle)] : pt(p, go);
          o = t > 0.03 ? 1 : 0;
          k = lerp(0.7, 1, go);
          if (t >= 0.1) accepted++;
        } else {
          const back = smooth(range(t, 0.1, 0.16));
          pos = back > 0 ? pt(p, lerp(1, 0.55, back)) : pt(p, go);
          o = t > 0.03 ? 1 - back : 0;
          k = lerp(0.7, 1, go);
        }
        place(w, p.card, pos[0], pos[1], k);
        op(w, p.card, o);
        const res = t >= 0.1;
        popAt(w, p.mark, (t - 0.1) / 0.035);
        w(p.bg, 'stroke', res && !p.bad ? '#00FF84' : '#DDDDDD');
        w(p.bg, 'stroke-width', res && !p.bad ? '2' : '1');
        op(w, p.body, p.bad ? lerp(1, 0.45, range(t, 0.1, 0.14)) : 1);
        if (p.strike) draw(w, p.strike, range(t, 0.1, 0.14));
      });
      const g = 0.06 + 0.86 * (accepted / 4);
      w(fill, 'stroke-dasharray', `${f3(g)} 1`);
      w(needle, 'transform', `translate(0 22) rotate(${f1(-80 + 160 * g)})`);
      // the envelope opens to send, then closes and is cleared
      const seal = keyed([[0.03, 1], [0.07, 0.15], [0.78, 0.15], [0.84, 1]], u);
      return { x: HUB[0], y: HUB[1], ew: 100, s: env({ seal, badge: range(u, 0.86, 0.92) }) };
    },
  };
}

// ---------------------------------------------------------------------------
// Litigious Scrub: the scrub bar passes each account; risky ones are flagged and struck, then
// the flagged rows are scrubbed out and the list is marked ready for contact.
// ---------------------------------------------------------------------------
function litigious(svg, w) {
  const RH = 74, HEAD = 92, LANE = 712, U0 = 0.05, U1 = 0.76;
  const rowsEl = qa(svg, '.ls-row');
  const end = HEAD + rowsEl.length * RH + 8;
  const rows = rowsEl.map((el) => {
    const [x, y] = base(el);
    return {
      el, x, y, flagged: el.classList.contains('is-flagged'), cy: y + RH / 2,
      body: q(el, '.ls-row__body'), tint: q(el, '.ls-row__tint'), strike: q(el, '.ls-strike'), mark: q(el, '.ls-mark'),
    };
  });
  rows.forEach((r) => { r.at = U0 + ((r.cy - HEAD) / (end - HEAD)) * (U1 - U0); });
  const scrub = q(svg, '.ls-scrub');
  const tableBg = q(svg, '.ls-table__bg'), tableShadow = q(svg, '.ls-table__shadow');
  const H0 = parseFloat(tableBg.getAttribute('height'));
  const ready = q(svg, '.ls-ready');
  return {
    update(u) {
      const sy = lerp(HEAD, end, range(u, U0, U1));
      place(w, scrub, 0, sy);
      op(w, scrub, u > U0 && u < U1 + 0.02 ? Math.min(range(u, U0, U0 + 0.03), 1 - range(u, U1, U1 + 0.02)) : 0);
      const c = smooth(range(u, 0.8, 0.9));
      let removed = 0;
      rows.forEach((r) => {
        const t = u - r.at;
        popAt(w, r.mark, t / 0.035);
        if (r.flagged) {
          op(w, r.tint, range(t, 0, 0.03));
          op(w, r.body, lerp(1, 0.4, range(t, 0.01, 0.05)) * (1 - c));
          draw(w, r.strike, range(t, 0.01, 0.05));
          op(w, r.strike, 1 - c);
          op(w, r.mark, t > 0 ? 1 - c : 0);
          op(w, r.tint, range(t, 0, 0.03) * (1 - c));
          // squash out of the list (around the row's middle)
          w(r.el, 'transform', `translate(${r.x} ${f1(r.y - removed * RH * c + RH / 2)}) scale(1 ${f3(Math.max(0.001, 1 - c))}) translate(0 ${-RH / 2})`);
          removed++;
        } else {
          w(r.el, 'transform', `translate(${r.x} ${f1(r.y - removed * RH * c)})`);
        }
      });
      w(tableBg, 'height', String(f1(H0 - removed * RH * c)));
      w(tableShadow, 'height', String(f1(H0 - removed * RH * c)));
      popAt(w, ready, (u - 0.9) / 0.04);
      const p = u < 0.78 ? [LANE, clamp(sy, 60, 540)] : kp([[0.78, [LANE, Math.min(540, end)]], [0.93, [LANE, 64]]], u);
      return { x: p[0], y: p[1], ew: 96, s: env({ badge: range(u, 0.92, 0.97) }) };
    },
  };
}

// ---------------------------------------------------------------------------
// Lockbox: Receiving → Processing → Reporting. The envelope (a client payment) goes into the PO
// box, is collected, opened and sorted; its check is scanned and deposited; a non-payment is
// scanned and mailed back; then the daily report confirms and the batch IDs tick.
// ---------------------------------------------------------------------------
function lockbox(svg, w) {
  const ins = qa(svg, '.lb-in');
  const sorted = qa(svg, '.lb-sorted');
  const labels = qa(svg, '.lb-label');
  const arcs = [q(svg, '.lb-arc-1'), q(svg, '.lb-arc-2')];
  const arrows = [q(svg, '.lb-arrow-1'), q(svg, '.lb-arrow-2')];
  const beam = q(svg, '.lb-beam');
  const check = q(svg, '.lb-check'), checkTo = base(check);
  const deposit = q(svg, '.lb-deposit');
  const wire = q(svg, '.lb-wire');
  const retPath = q(svg, '.lb-return-path'), ret = q(svg, '.lb-ret'), retTo = base(ret);
  const retLen = retPath.getTotalLength();
  const bars = qa(svg, '.lb-bar');
  const confirm = q(svg, '.lb-confirm');
  const ids = qa(svg, '.lb-id').map((el) => q(el, '.lb-id-mark'));
  bars.forEach((b) => { b.style.transformBox = 'fill-box'; });
  const SCAN = [400, 380], DOOR = [140, 178];
  const arc1 = arcs[0], arc1Len = arc1.getTotalLength();
  const arc2 = arcs[1], arc2Len = arc2.getTotalLength();
  const along = (path, len, t) => { const a = path.getPointAtLength(clamp(t) * len); return [a.x, a.y]; };
  return {
    update(u) {
      // incoming payments drop into the PO box
      ins.forEach((el, i) => {
        const t = range(u, 0.0 + i * 0.025, 0.07 + i * 0.025);
        const [bx, by] = base(el);
        place(w, el, lerp(bx, DOOR[0], t), lerp(by - 26, DOOR[1], smooth(t)), lerp(1, 0.5, t));
        op(w, el, t > 0 && t < 1 ? Math.min(1, t * 6, (1 - t) * 4) : 0);
      });
      sorted.forEach((el, i) => op(w, el, range(u, 0.22 + i * 0.02, 0.25 + i * 0.02)));
      // station highlight
      const st = u < 0.3 ? 0 : u < 0.76 ? 1 : 2;
      labels.forEach((el, i) => op(w, el, i === st ? 1 : 0.42));
      draw(w, arcs[0], range(u, 0.28, 0.38));
      op(w, arrows[0], range(u, 0.36, 0.38));
      draw(w, arcs[1], range(u, 0.77, 0.84));
      op(w, arrows[1], range(u, 0.82, 0.84));
      // the payment check: out of the envelope → scanner bed → deposited at the bank
      const out = smooth(range(u, 0.41, 0.45));
      const dep = smooth(range(u, 0.52, 0.58));
      const cx = SCAN[0], cy = lerp(SCAN[1] + 8, SCAN[1], out);
      place(w, check, lerp(cx, checkTo[0], dep), lerp(cy, checkTo[1], dep), lerp(0.6, 1, out));
      op(w, check, u > 0.41 ? 1 : 0);
      const scanning = (u > 0.45 && u < 0.52) || (u > 0.6 && u < 0.66);
      place(w, beam, SCAN[0] - 66 + 132 * (u < 0.56 ? range(u, 0.45, 0.52) : range(u, 0.6, 0.66)), SCAN[1]);
      op(w, beam, scanning ? 1 : 0);
      op(w, wire, range(u, 0.52, 0.56));
      popAt(w, deposit, (u - 0.58) / 0.035);
      // non-payment: scanned, then mailed back along the return path
      const r = smooth(range(u, 0.66, 0.73));
      const rp = r > 0 ? along(retPath, retLen, r) : [SCAN[0] + 60, SCAN[1]];
      place(w, ret, r >= 1 ? retTo[0] : rp[0], r >= 1 ? retTo[1] : rp[1]);
      op(w, ret, u > 0.6 ? 1 : 0);
      op(w, retPath, range(u, 0.64, 0.68));
      // reporting
      bars.forEach((b, i) => {
        const k = smooth(range(u, 0.84 + i * 0.02, 0.89 + i * 0.02));
        const h = parseFloat(b.dataset.h);
        w(b, 'transform', `translate(0 ${f1(h * (1 - k))}) scale(1 ${f3(Math.max(k, 0.001))})`);
      });
      popAt(w, confirm, (u - 0.92) / 0.035);
      ids.forEach((m, i) => popAt(w, m, (u - (0.88 + i * 0.025)) / 0.035));
      // the envelope's route
      let p;
      if (u < 0.28) p = kp([[0, [140, 104]], [0.09, DOOR], [0.17, [140, 314]], [0.24, [140, 448]], [0.28, along(arc1, arc1Len, 0)]], u);
      else if (u < 0.38) p = along(arc1, arc1Len, range(u, 0.28, 0.38));
      else if (u < 0.68) p = kp([[0.38, [352, 432]], [0.41, [SCAN[0] - 6, SCAN[1] - 2]]], u);
      else if (u < 0.77) p = kp([[0.68, [SCAN[0] - 6, SCAN[1] - 2]], [0.77, [470, 124]]], u);
      else if (u < 0.84) p = along(arc2, arc2Len, range(u, 0.77, 0.84));
      else p = kp([[0.84, [600, 118]], [0.9, [532, 300]]], u);
      const seal = keyed([[0.22, 1], [0.28, 0.1], [0.9, 0.1], [0.95, 1]], u);
      const ew = keyed([[0, 66], [0.09, 52], [0.17, 62], [0.4, 70], [0.9, 62]], u);
      return { x: p[0], y: p[1], ew, s: env({ seal, badge: range(u, 0.95, 0.99) }) };
    },
  };
}

// ---------------------------------------------------------------------------
// Renkim 360: the envelope rides the full circle — creation → print & eNotice → the recipient's
// mailbox → archived — while the shelf fills (up to seven years) and the portal finds the file.
// ---------------------------------------------------------------------------
function r360(svg, w) {
  const C = [430, 304], R = 210;
  const ring = q(svg, '.r3-ring');
  const nodes = ['top', 'right', 'bottom', 'left'].map((k) => q(svg, `.r3-node--${k} .r3-node__ring`));
  const gen = qa(svg, '.r3-gen');
  const printed = q(svg, '.r3-print'), enotice = q(svg, '.r3-enotice'), flag = q(svg, '.r3-flag');
  const slots = qa(svg, '.r3-slot');
  const res = qa(svg, '.r3-res');
  const query = q(svg, '.r3-query'), found = q(svg, '.r3-found'), clock = q(svg, '.r3-clock');
  const hl = q(svg, '.r3-res-0 .r3-res__bg');
  gen.forEach((g) => { g.style.transformBox = 'fill-box'; g.style.transformOrigin = 'left center'; });
  query.style.transformBox = 'fill-box';
  query.style.transformOrigin = 'left center';
  const ANG = [[0.04, -90], [0.1, -90], [0.27, 0], [0.33, 0], [0.5, 90], [0.56, 90], [0.73, 180], [0.79, 180], [0.94, 270]];
  return {
    update(u) {
      const a = keyed(ANG, u);
      const rad = (a * Math.PI) / 180;
      draw(w, ring, (a + 90) / 360);
      const arrive = [0.04, 0.27, 0.5, 0.73];
      nodes.forEach((n, i) => op(w, n, range(u, arrive[i], arrive[i] + 0.04)));
      gen.forEach((g, i) => w(g, 'style:transform', `scaleX(${f3(Math.max(0.001, smooth(range(u, 0.05 + i * 0.015, 0.09 + i * 0.015))))})`));
      w(printed, 'transform', `translate(0 ${f1(lerp(-14, 0, smooth(range(u, 0.27, 0.31))))})`);
      op(w, printed, range(u, 0.27, 0.29));
      popAt(w, enotice, (u - 0.3) / 0.035);
      w(flag, 'transform', `translate(16 -10) rotate(${f1(lerp(90, 0, smooth(range(u, 0.5, 0.55))))} 1.5 2)`);
      slots.forEach((s, i) => op(w, s, range(u, 0.08 + i * 0.105, 0.12 + i * 0.105)));
      res.forEach((r, i) => op(w, r, range(u, 0.12 + i * 0.2, 0.16 + i * 0.2)));
      w(query, 'style:transform', `scaleX(${f3(Math.max(0.001, smooth(range(u, 0.82, 0.9))))})`);
      op(w, hl, range(u, 0.9, 0.93));
      popAt(w, found, (u - 0.91) / 0.035);
      w(clock, 'transform', `translate(104 -98) rotate(${f1(lerp(-8, 0, smooth(range(u, 0.0, 0.1))))})`);
      return { x: C[0] + R * Math.cos(rad), y: C[1] + R * Math.sin(rad), ew: 74, s: env({ badge: range(u, 0.94, 0.98) }) };
    },
  };
}

export const SCENES = {
  'bankruptcy-deceased': { art: 'bankruptcy', make: bankruptcy },
  'email-verification': { art: 'email', make: email },
  'litigious-scrub': { art: 'litigious', make: litigious },
  lockbox: { art: 'lockbox', make: lockbox },
  'renkim-360': { art: 'r360', make: r360 },
};
