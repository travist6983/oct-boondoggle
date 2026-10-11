// Industries Served journey: "One route, nine stops".
// The envelope rests under the hero, flies into the sidebar transit map and rides it as you read
// the nine industries (below 1024px it rides a sticky stop strip instead), then drops out of the
// map into the 100% Employee Owned band. Each industry photo opens out of an envelope window and
// receives a postmark; list checks tick as they enter. Every state is a pure function of scrollY.
import { startMotion, journeyOf } from '../runtime.js';
import { employeeStage } from '../stages.js';
import { Leg, prepRouteSvg, routePair, clamp, range, smooth, lerp } from '../geom.js';
import { docTop, writer, tiltFrom, SEALED } from '../kit.js';

const STATE = { ...SEALED, stamp: 1 };
const REST_SCALE = 0.72; // resting under the hero
const MAP_SCALE = 0.44; // riding the sidebar line
const STRIP_SCALE = 0.36; // riding the mobile strip
const RAIL = 11; // strip rail centre below the stops (matches .route-map__stops::before)

export function init() {
  startMotion(buildJourney);
}

function buildJourney(ctx, { scrollToY }) {
  const band = document.querySelector('.employee');
  const strip = ctx.vw < 1024;
  const bandX = ctx.mobile ? ctx.rail : ctx.containerRight - 120;
  // Desktop: the long sideways move to the band lane is split between this section's bottom
  // padding and the band's top padding, so it never whips across in a few px of scroll.
  const exitX = strip ? bandX : ctx.containerLeft + (bandX - ctx.containerLeft) * 0.45;
  const stages = [
    industriesStage(ctx, { strip, exitX, band, scrollToY }),
    employeeStage(ctx, exitX, bandX, { section: band, state: STATE }),
  ];
  return journeyOf(stages, Math.max(1, docTop(band) + band.offsetHeight - ctx.vh));
}

// Piecewise-linear map through [x, y] keys (x ascending).
function through(keys, x) {
  if (x <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (x <= keys[i][0]) {
      const [x0, y0] = keys[i - 1], [x1, y1] = keys[i];
      return lerp(y0, y1, (x - x0) / (x1 - x0 || 1));
    }
  }
  return keys[keys.length - 1][1];
}
const q3 = (v) => Math.round(v * 1000) / 1000;

function industriesStage(ctx, { strip, exitX, band, scrollToY }) {
  const section = document.querySelector('.ind');
  const svg = section.querySelector('.route');
  const layout = section.querySelector('.ind-layout');
  const side = section.querySelector('.ind-side');
  const map = section.querySelector('.route-map');
  const track = map.querySelector('.route-map__track');
  const list = map.querySelector('.route-map__stops');
  const line = map.querySelector('.route-map__line');
  const fill = map.querySelector('.route-map__fill');
  const stops = [...map.querySelectorAll('.stop')];
  const articles = stops.map((s) => document.getElementById(s.dataset.stop));
  const w = writer();
  const { vh, F } = ctx;
  const W = section.offsetWidth, H = section.offsetHeight;
  prepRouteSvg(svg, W, H);
  const secTop = docTop(section);
  const secLeft = section.getBoundingClientRect().left;
  const headerH = document.getElementById('site-header').offsetHeight;

  // --- Sticky geometry, measured in normal flow --------------------------------
  const stickyEl = strip ? map : side;
  const stickyTop = parseFloat(getComputedStyle(stickyEl).top) || 0;
  stickyEl.style.position = 'static';
  const nat = stickyEl.getBoundingClientRect();
  const natTop = nat.top + window.scrollY;
  const rel = (node) => {
    const r = node.getBoundingClientRect();
    return { x: r.left - nat.left, y: r.top - nat.top, w: r.width, h: r.height, cx: r.left - nat.left + r.width / 2, cy: r.top - nat.top + r.height / 2 };
  };
  let stopX = [], stopY = [], lineEnd = 0, railY = 0, trackX = 0, trackW = 0, maxScroll = 0;
  if (strip) {
    const tr = track.getBoundingClientRect();
    trackX = tr.left - nat.left;
    trackW = tr.width;
    maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    // stop centres in the strip's scroll-content coordinates
    stopX = stops.map((s) => { const r = s.getBoundingClientRect(); return r.left - tr.left + track.scrollLeft + r.width / 2; });
    const lr = list.getBoundingClientRect();
    lineEnd = lr.right - tr.left + track.scrollLeft - 14;
    railY = lr.bottom - nat.top + RAIL;
  } else {
    stopY = stops.map((s) => rel(s.querySelector('.stop__dot')).cy);
    const dot = rel(stops[0].querySelector('.stop__dot'));
    stopX = [dot.cx];
    const lr = rel(line);
    lineEnd = lr.y + lr.h;
  }
  stickyEl.style.position = '';
  const elH = stickyEl.offsetHeight;
  const contBottom = docTop(layout) + layout.offsetHeight;
  const stickyScreenTop = (sy) => Math.min(Math.max(stickyTop, natTop - sy), contBottom - sy - elH);
  const listW = strip ? list.offsetWidth : 0;

  // --- Reading progress P: -1 rest → 0..8 stops → 9 line end → 10 handed to the band -----------
  const A = articles.map(docTop);
  const last = articles[8];
  const lastEnd = A[8] + last.offsetHeight;
  const E = docTop(band);
  const Fr = strip ? headerH + map.offsetHeight + vh * 0.2 : vh * 0.35;
  const keys = [];
  if (!strip) keys.push([0, -1]);
  let x = strip ? A[0] - Fr : Math.max(A[0] - Fr, 140);
  keys.push([x, 0]);
  for (let i = 1; i < 9; i++) {
    x = Math.max(A[i] - Fr, x + 60);
    keys.push([x, i]);
  }
  const sy8 = x;
  const syB = E - F;
  let syA = Math.min(sy8 + 0.55 * (lastEnd - A[8]), syB - vh * 0.3);
  syA = Math.max(syA, sy8 + 80);
  if (syA > syB - 60) syA = (sy8 + syB) / 2;
  keys.push([syA, 9], [syB, 10]);

  // --- Positions on the map (screen px) --------------------------------------
  const lineX = nat.left + stopX[0];
  let curScroll = track.scrollLeft;
  const stripContentX = (P) => {
    if (P <= 0) return stopX[0];
    if (P >= 9) return lineEnd;
    const i = Math.floor(P), f = P - i;
    return i >= 8 ? lerp(stopX[8], lineEnd, f) : lerp(stopX[i], stopX[i + 1], f);
  };
  const scrollFor = (cx) => clamp(cx - trackW / 2, 0, maxScroll);
  function onMap(P, sy) {
    const top = stickyScreenTop(sy);
    if (strip) {
      const cx = stripContentX(P);
      return { x: nat.left + trackX + cx - curScroll, y: top + railY, cx };
    }
    const i = Math.floor(clamp(P, 0, 9));
    const f = clamp(P, 0, 9) - i;
    const y = i >= 9 ? lineEnd : i >= 8 ? lerp(stopY[8], lineEnd, f) : lerp(stopY[i], stopY[i + 1], f);
    return { x: lineX, y: top + y, ly: y };
  }

  // --- Entry: from under the hero into the top of the map (desktop) ------------
  let entry = null;
  if (!strip) {
    const sx = W / 2, ry = 38;
    const x0 = keys[1][0];
    const lx = lineX - secLeft;
    const s0y = stickyScreenTop(x0) + x0 + stopY[0] - secTop;
    const d = `M${sx},${ry} L${lx + 60},${ry} C${lx + 20},${ry} ${lx},${ry + 20} ${lx},${ry + 60} L${lx},${s0y}`;
    const { plan, ink } = routePair(svg, d);
    entry = new Leg(plan, section, { ink });
  }

  // --- Exit: off the end of the line, down into the band -----------------------
  const startDoc = (() => {
    const p = onMap(9, syA);
    if (strip) p.x = nat.left + trackX + lineEnd - scrollFor(lineEnd);
    return { x: p.x - secLeft, y: p.y + syA - secTop };
  })();
  let exitD;
  if (strip) {
    // down the right-hand gutter (clear of the copy), then across the bottom padding to the band
    const gx = W - Math.max(8, ctx.gutter / 2);
    const yb = Math.min(contBottom - secTop + 28, H - 70);
    const k = (H - yb) / 2;
    exitD = `M${startDoc.x},${startDoc.y} C${startDoc.x},${startDoc.y + 40} ${gx},${startDoc.y + 20} ${gx},${startDoc.y + 80}`
      + ` L${gx},${yb} C${gx},${yb + k} ${exitX},${H - k} ${exitX},${H}`;
  } else {
    // step out into the left gutter so the envelope never crosses the CTA copy, then down and across
    const gx = Math.max(10, nat.left - secLeft - 16);
    const yb = Math.min(contBottom - secTop + 28, H - 70);
    const k = (H - yb) / 2;
    exitD = `M${startDoc.x},${startDoc.y} C${startDoc.x},${startDoc.y + 26} ${gx},${startDoc.y + 10} ${gx},${startDoc.y + 46}`
      + ` L${gx},${yb} C${gx},${yb + k} ${exitX},${H - k} ${exitX},${H}`;
  }
  const exitPair = routePair(svg, exitD);
  const exit = new Leg(exitPair.plan, section, { ink: exitPair.ink }).buildYTable();

  // --- Strip interaction: let people scroll the strip themselves ---------------
  let pauseUntil = 0, focused = false;
  const pause = () => { pauseUntil = performance.now() + 2500; };
  const onScroll = () => { curScroll = track.scrollLeft; };
  // Chrome only scrolls a focused chip into view when it is fully hidden; centre partly hidden ones.
  const onFocusIn = (e) => {
    focused = true;
    const a = e.target.closest?.('.stop');
    if (!a) return;
    const tr = track.getBoundingClientRect(), r = a.getBoundingClientRect();
    if (r.left < tr.left + 8 || r.right > tr.right - 8) track.scrollLeft += r.left + r.width / 2 - (tr.left + tr.width / 2);
  };
  const onFocusOut = () => { focused = false; pause(); };
  // Stops scroll to their industry with the heading clear of the header (and strip), then take focus.
  const onClick = (e) => {
    const a = e.target.closest('.stop');
    if (!a) return;
    const target = document.getElementById(a.dataset.stop);
    if (!target) return;
    e.preventDefault();
    e.stopPropagation();
    const offset = headerH + (strip ? map.offsetHeight : 0) + (strip ? 16 : 24);
    scrollToY(Math.max(0, docTop(target) - offset));
    history.replaceState(null, '', `#${target.id}`);
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    setTimeout(() => target.focus({ preventScroll: true }), 900);
  };
  map.addEventListener('click', onClick);
  if (strip) {
    ['pointerdown', 'wheel', 'touchstart'].forEach((t) => track.addEventListener(t, pause, { passive: true }));
    track.addEventListener('scroll', onScroll, { passive: true });
    map.addEventListener('focusin', onFocusIn);
    map.addEventListener('focusout', onFocusOut);
  }

  // --- Article reveals -----------------------------------------------------------
  const arts = articles.map((a, i) => {
    const fig = a.querySelector('.industry__media');
    return {
      top: A[i], bottom: A[i] + a.offsetHeight,
      figTop: docTop(fig),
      win: fig.querySelector('.env-window'),
      paper: fig.querySelector('.env-paper'),
      img: fig.querySelector('.industry__img'),
      pm: fig.querySelector('.postmark'),
      ticks: [...a.querySelectorAll('.ticks li')].map((li) => ({ li, top: docTop(li) })),
    };
  });
  function reveal(sy) {
    for (const a of arts) {
      if (a.top - sy > vh * 1.4 || a.bottom - sy < -vh * 0.4) continue;
      const v = q3(smooth(range(a.figTop - sy, vh * 0.94, vh * 0.4)));
      const o = 1 - v;
      w(a.win, 'style:clipPath', v >= 1 ? 'inset(0% 0% 0% 0% round 21px)'
        : `inset(${(52 * o).toFixed(2)}% ${(53 * o).toFixed(2)}% ${(18 * o).toFixed(2)}% ${(7 * o).toFixed(2)}% round ${(12 + 9 * v).toFixed(1)}px)`);
      w(a.paper, 'style:opacity', String(q3(1 - range(v, 0.62, 0.96))));
      w(a.img, 'style:transform', `scale(${(1.14 - 0.14 * v).toFixed(3)})`);
      const s = range(v, 0.8, 1);
      const pop = s <= 0 ? 1.8 : s < 0.6 ? lerp(1.8, 0.93, s / 0.6) : lerp(0.93, 1, (s - 0.6) / 0.4);
      w(a.pm, 'style:opacity', String(q3(clamp(s * 3))));
      w(a.pm, 'style:transform', `rotate(-9deg) scale(${pop.toFixed(3)})`);
      for (const t of a.ticks) w(t.li, 'class', `is-ticked|${t.top - sy < vh * 0.84 ? 1 : 0}`);
    }
  }

  let lastFill = -1, lastScroll = -1;
  return {
    name: 'industries',
    update(sy) {
      if (secTop - sy > vh * 1.5 || secTop + H - sy < -vh) return null;
      reveal(sy);
      const P = through(keys, sy);

      // stop states
      const current = P < -0.4 || P >= 9.6 ? -1 : clamp(Math.floor(P + 1e-6), 0, 8);
      stops.forEach((s, i) => {
        w(s, 'class', `is-reached|${P >= i - 1e-6 ? 1 : 0}`);
        w(s, 'aria-current', i === current ? 'true' : 'false');
      });

      // the strip follows the envelope (unless someone is scrolling it)
      if (strip) {
        const cx = stripContentX(clamp(P, 0, 9));
        if (!focused && performance.now() > pauseUntil) {
          const target = Math.round(scrollFor(cx));
          if (target !== lastScroll) { track.scrollLeft = target; lastScroll = target; curScroll = target; }
        }
        const fv = q3(clamp((cx - 14) / Math.max(1, listW - 28)));
        if (fv !== lastFill) { list.style.setProperty('--fill', String(fv)); lastFill = fv; }
      }

      entry?.draw(clamp(P + 1));
      exit.draw(0);
      let pose, scale;
      if (P < 0 && entry) {
        const t = smooth(P + 1);
        const p = entry.at(t);
        pose = { x: secLeft + p.x, y: secTop - sy + p.y, tilt: -6 * Math.sin(Math.PI * t) };
        scale = lerp(REST_SCALE, MAP_SCALE, smooth(range(t, 0.45, 1)));
      } else if (P <= 9) {
        const m = onMap(P, sy);
        pose = { x: m.x, y: m.y, tilt: 0 };
        scale = strip ? STRIP_SCALE : MAP_SCALE;
      } else if (P < 10) {
        const e = (sy - syA) / (syB - syA);
        const tTrack = exit.tAtY(sy + F - secTop);
        const t = tTrack * smooth(clamp(e));
        exit.draw(t);
        const p = exit.at(t);
        pose = { x: secLeft + p.x, y: secTop - sy + p.y, tilt: tiltFrom(p.angle) * smooth(range(e, 0, 0.35)) };
        scale = lerp(strip ? STRIP_SCALE : MAP_SCALE, ctx.scale, smooth(range(e, 0.1, 0.9)));
      } else {
        exit.draw(1);
        if (!strip) w(fill, 'style:transform', 'scaleY(1)');
        return null;
      }

      // the sidebar line fills down to the envelope
      if (!strip) {
        const top = stickyScreenTop(sy);
        const fv = q3(clamp((pose.y - top) / lineEnd));
        if (fv !== lastFill) { w(fill, 'style:transform', `scaleY(${fv})`); lastFill = fv; }
      }
      return { pose: { ...pose, scale }, s: STATE };
    },
    destroy() {
      map.removeEventListener('click', onClick);
      ['pointerdown', 'wheel', 'touchstart'].forEach((t) => track.removeEventListener(t, pause));
      track.removeEventListener('scroll', onScroll);
      map.removeEventListener('focusin', onFocusIn);
      map.removeEventListener('focusout', onFocusOut);
      list.style.removeProperty('--fill');
      fill.style.removeProperty('transform');
    },
  };
}
