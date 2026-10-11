// About Us journey: the sealed envelope leaves the hero, rides the lane past the leadership
// letters, becomes the history timeline's traveller (each milestone vignette plays as it
// arrives), crosses the 100% Employee Owned band, and is stamped at Core Values, where it
// franks each value card as it passes. Every state is a pure function of scrollY.
import { startMotion, journeyOf } from '../runtime.js';
import { employeeStage } from '../stages.js';
import { Leg, prepRouteSvg, routePair, verticalPath, relRect, el, range, smooth } from '../geom.js';
import { docTop, tiltFrom, SEALED, writer } from '../kit.js';
import { makeVignettes } from './about-vignettes.js';

export function init() {
  initLetterEntrance();
  initWall();
  startMotion(buildJourney);
}

// A section whose route is a y-monotonic path; the envelope is held at the focus line.
function trackStage(ctx, section, pts, { state = SEALED, onUpdate = null, name = '' } = {}) {
  const svg = section.querySelector(':scope > .route');
  const W = section.offsetWidth, H = section.offsetHeight;
  prepRouteSvg(svg, W, H);
  const top = docTop(section);
  const { plan, ink } = routePair(svg, verticalPath(pts));
  const leg = new Leg(plan, section, { ink }).buildYTable();
  const y0 = pts[0][1], y1 = pts[pts.length - 1][1];
  return {
    name, top, H, svg,
    update(sy) {
      const secTop = top - sy;
      if (secTop > ctx.vh * 1.5 || secTop + H < -ctx.vh) return null;
      const ly = ctx.F - secTop;
      onUpdate?.(ly);
      if (ly < y0 || ly >= y1) {
        leg.draw(ly >= y1 ? 1 : 0);
        return null;
      }
      const t = leg.tAtY(ly);
      leg.draw(t);
      const p = leg.at(t);
      return {
        pose: { x: p.x, y: secTop + p.y, scale: ctx.scale, tilt: tiltFrom(p.angle) },
        s: typeof state === 'function' ? state(ly) : state,
      };
    },
  };
}

function buildJourney(ctx) {
  const hero = document.querySelector('.page-hero');
  const lead = document.querySelector('.lead');
  const hist = document.querySelector('.hist');
  const band = document.querySelector('.employee');
  const vals = document.querySelector('.vals');
  const w = writer();

  const laneX = ctx.mobile ? ctx.rail : relRect(lead.querySelector('.about-lane'), lead).cx;
  const valsX = ctx.mobile ? ctx.rail : relRect(vals.querySelector('.vals__lane'), vals).cx;

  // Hero: the route starts under the chips.
  const chips = relRect(hero.querySelector('.chips'), hero);
  const heroH = hero.offsetHeight;
  const heroStage = trackStage(ctx, hero, [[laneX, Math.min(heroH - 2, chips.y + chips.h + 18)], [laneX, heroH]], { name: 'hero' });

  // Leadership: straight down the lane beside the letters.
  const leadStage = trackStage(ctx, lead, [[laneX, 0], [laneX, lead.offsetHeight]], { name: 'leadership' });

  // History: the route is the spine; milestones light up and their vignettes play.
  const nodes = [...hist.querySelectorAll('.milestone__node')];
  const cards = [...hist.querySelectorAll('.milestone')];
  const nodeY = cards.map((c, i) => {
    const nr = relRect(nodes[i], hist);
    return nr.h ? nr.cy : relRect(c, hist).y + 14;
  });
  const vigs = makeVignettes(hist, w);
  const histStage = trackStage(ctx, hist, [[laneX, 0], [laneX, hist.offsetHeight]], {
    name: 'history',
    onUpdate(ly) {
      nodeY.forEach((y, i) => {
        w(nodes[i], 'class', `is-reached|${ly >= y - 2 ? 1 : 0}`);
        vigs[i]?.(range(ly, y - ctx.vh * 0.36, y + ctx.vh * 0.04));
      });
    },
  });

  // 100% Employee Owned: from the timeline lane to the values lane.
  const bandStage = employeeStage(ctx, laneX, valsX, { section: band, state: SEALED });

  // Core Values: stamped on arrival; every card is franked as the envelope passes its row.
  const head = relRect(vals.querySelector('.vals__head'), vals);
  const stampY = head.y + head.h * 0.5;
  const vcards = [...vals.querySelectorAll('.vcard')];
  const cancels = vcards.map((c) => c.querySelector('.vcard__cancel'));
  const waves = cancels.map((c) => [...c.querySelectorAll('.cancel__waves path')]);
  const vr = vcards.map((c) => relRect(c, vals));
  const rows = [...new Set(vr.map((r) => Math.round(r.y)))];
  // nearest the lane first: on desktop the lane is on the right, so frank right → left
  const col = vr.map((r) => vr.filter((o) => Math.round(o.y) === Math.round(r.y) && (ctx.mobile ? o.x < r.x : o.x > r.x)).length);
  const valsStage = trackStage(ctx, vals, [[valsX, 0], [valsX, vals.offsetHeight]], {
    name: 'values',
    state: (ly) => ({ ...SEALED, stamp: range(ly, stampY - 30, stampY + 40) }),
    onUpdate(ly) {
      vcards.forEach((c, i) => {
        const at = vr[i].y + Math.min(90, vr[i].h * 0.3) + col[i] * 46;
        const p = range(ly, at - 70, at + 30);
        const pop = p <= 0 ? 0 : p < 0.45 ? 1.6 - 0.65 * smooth(p / 0.45) : 0.95 + 0.05 * smooth((p - 0.45) / 0.55);
        w(cancels[i], 'style:opacity', String(Math.round(Math.min(1, p * 3) * 0.55 * 1000) / 1000));
        w(cancels[i], 'style:transform', `rotate(-9deg) scale(${pop.toFixed(3)})`);
        waves[i].forEach((path, k) => w(path, 'stroke-dashoffset', String(Math.round((1 - range(p, 0.3 + k * 0.1, 0.75 + k * 0.08)) * 1000) / 1000)));
        w(c, 'class', `is-franked|${p >= 0.4 ? 1 : 0}`);
      });
      dots.forEach((d) => w(d.n, 'class', `is-reached|${ly >= d.y ? 1 : 0}`));
    },
  });
  // station dots, one per row (or per card on the mobile rail)
  const dotYs = ctx.mobile ? vr.map((r) => r.y + 34) : rows.map((y) => y + vr.find((r) => Math.round(r.y) === y).h / 2);
  const dots = dotYs.map((y) => ({ y, n: el('circle', { cx: valsX, cy: y, r: ctx.mobile ? 6 : 8, class: 'station-dot' }, valsStage.svg) }));

  const endY = valsStage.top + valsStage.H - ctx.F;
  return journeyOf([heroStage, leadStage, histStage, bandStage, valsStage], endY);
}

// The first letter slides out of its envelope when the leadership stage comes into view.
// If it is already on screen when motion starts, nothing moves (no flash).
function initLetterEntrance() {
  const lead = document.querySelector('.lead');
  const stage = lead?.querySelector('.lead__stage');
  if (!stage || !('IntersectionObserver' in window)) return;
  const r = stage.getBoundingClientRect();
  if (r.top < window.innerHeight * 0.85) return;
  lead.classList.add('is-tucked');
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      lead.classList.remove('is-tucked');
      io.disconnect();
    }
  }, { rootMargin: '0px 0px -30% 0px' });
  io.observe(stage);
}

// Community wall: the photos drop like postcards onto a table, once.
function initWall() {
  const wall = document.querySelector('.wall');
  if (!wall || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      wall.classList.add('is-dropped');
      io.disconnect();
    }
  }, { rootMargin: '0px 0px -18% 0px' });
  io.observe(wall);
}
