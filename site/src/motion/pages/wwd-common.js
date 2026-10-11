// Shared journey for the What We Do pages:
//   hero (the envelope rests under the title) → down the gutter between the sidebar and the
//   article → the page's lab (family-supplied signature stage) → back to the gutter → the
//   100% Employee Owned band → the industries band, where the route fans out to the nine pills.
//
// A family module calls startWwd(buildLab). buildLab(ctx, api) returns a stage or null:
//   api = { lab, gx, gs, lead, state, docTop }  (gx = gutter x in viewport px; gs = gutter scale;
//   lead(sy) = the envelope's document y (use it instead of scrollY + F); state = default envelope state)
//   stage.update(scrollY) → { pose, s } while the lab owns the envelope, else null.
//   Optional: stage.stateAfter + stage.endDocY — the envelope keeps that state (e.g. a badge it
//   earned in the lab) on the gutter and the bands once lead(sy) passes endDocY.
// The lab must hand the envelope back at (gx, lead) when the lead leaves it, so the gutter route
// picks it up without a jump. Every state is a pure function of scrollY.
import { startMotion, journeyOf } from '../runtime.js';
import { Leg, prepRouteSvg, routePair, verticalPath, relRect, el, clamp, lerp, smooth, range } from '../geom.js';
import { docTop, tiltFrom, SEALED, writer } from '../kit.js';
import { employeeStage, industriesStage } from '../stages.js';

export const WWD_STATE = { ...SEALED, stamp: 1, num: '' };

export function startWwd(buildLab) {
  return startMotion((ctx, helpers) => buildWwdJourney(ctx, helpers, buildLab));
}

// Scale the envelope uses while it rides the narrow gutter beside the article.
export const gutterScale = (ctx) => (ctx.mobile ? ctx.scale : 0.55);

export function gutterX(ctx) {
  const side = document.querySelector('.wwd-side');
  const article = document.querySelector('.wwd-article');
  if (ctx.mobile || !side || !article || ctx.vw < 1024) return ctx.mobile ? ctx.rail : Math.max(ctx.rail, ctx.containerLeft - 4);
  const s = side.getBoundingClientRect(), a = article.getBoundingClientRect();
  return (s.right + a.left) / 2;
}

function buildWwdJourney(ctx, helpers, buildLab) {
  const stages = [];
  const gx = gutterX(ctx);
  const gs = gutterScale(ctx);
  const hero = document.querySelector('.wwd-hero');
  const body = document.querySelector('.wwd-body');
  const band = document.querySelector('.employee');
  const pills = document.querySelector('.industries');
  const values = document.querySelector('.wwd-values');

  // The envelope's "lead" (document y). It rests at the hero seam; over the first Sh px of scroll
  // the hero leg carries it (paced by scroll, so the sideways move to the gutter is gentle) down
  // into the body, arriving exactly on the focus line (Sh + F); from then on every stage tracks
  // the focus line (scrollY + F).
  const heroTop = hero ? docTop(hero) : 0;
  const restDocY = hero ? heroTop + hero.offsetHeight - (ctx.mobile ? 18 : 26) : 0;
  let Sh = Math.max(ctx.vh * 0.35, restDocY - ctx.F + ctx.vh * 0.2);
  let leadImpl = (sy) => sy + ctx.F;
  const lead = (sy) => leadImpl(sy);

  // 2 · Lab (family-supplied) takes precedence over the gutter while it owns the envelope.
  const lab = document.querySelector('.wwd-lab');
  const labStage = lab && buildLab ? buildLab(ctx, { lab, gx, gs, lead, state: WWD_STATE, docTop, helpers }) : null;
  leadImpl = (sy) => (sy <= Sh ? lerp(restDocY, Sh + ctx.F, smooth(clamp(sy / Sh))) : sy + ctx.F);
  // Where the hero leg hands over: on the gutter at the focus line, or, if a lab near the top
  // already owns the envelope by then, exactly where that lab will have it (probed; stages are
  // pure functions of scrollY), so the hand-off is seamless either way.
  let end = { x: gx, y: Sh + ctx.F, scale: gs };
  const probe = labStage?.update(Sh);
  if (probe?.pose) end = { x: probe.pose.x, y: probe.pose.y + Sh, scale: probe.pose.scale ?? gs };
  labStage?.update(0);

  // 1 · Hero: rest under the title/chips, then ride a leg that spills into the body.
  if (hero && body) stages.push(heroStage(ctx, hero, gs, Sh, end, heroTop));
  if (labStage) stages.push(labStage);
  const after = labStage?.stateAfter && Number.isFinite(labStage.endDocY) ? labStage : null;
  const stateAt = (sy) => (after && lead(sy) >= after.endDocY ? after.stateAfter : WWD_STATE);

  // 3 · Gutter route through the body; on desktop it swings toward the band's lane across the
  //     body's bottom padding, so the turn into the employee band has room.
  //     The swing is split: part of it across the body's bottom padding, the rest across the band's
  //     top padding, so the sideways move is spread over both.
  const bandX = ctx.mobile ? ctx.rail : ctx.containerRight - 120;
  const midX = band ? lerp(gx, bandX, 0.45) : gx;
  if (body) stages.push(gutterStage(ctx, body, gx, gs, lead, midX, stateAt, hero ? Sh + ctx.F : null));

  // 4 · Bands.
  if (band) stages.push(employeeStage(ctx, midX, bandX, { section: band, state: after ? after.stateAfter : WWD_STATE }));
  let endY = 1;
  const laneX = ctx.mobile ? ctx.rail : ctx.vw / 2; // the industries band and the values share the centre lane
  if (pills) {
    stages.push(industriesStage(ctx, bandX, laneX));
    endY = docTop(pills) + pills.offsetHeight - ctx.F;
  }
  // 5 · Core values: around the heading, down the lane, postmark each card, end in the seal.
  if (values) {
    const vs = valuesStage(ctx, values, laneX, after ? after.stateAfter : WWD_STATE);
    stages.push(vs);
    endY = vs.endY;
  } else if (!pills && body) {
    endY = docTop(body) + body.offsetHeight - ctx.F;
  }
  return journeyOf(stages, Math.max(1, endY));
}

function heroStage(ctx, hero, gs, Sh, end, heroTop) {
  const svg = hero.querySelector('.route');
  const W = hero.offsetWidth, H = hero.offsetHeight;
  prepRouteSvg(svg, W, H);
  const top = docTop(hero);
  const restX = W / 2, restY = H - (ctx.mobile ? 18 : 26);
  // The leg ends below the hero (the route svg overflows into the body) at the hand-off point.
  const { plan, ink } = routePair(svg, verticalPath([[restX, restY], [end.x, end.y - heroTop]]));
  const leg = new Leg(plan, hero, { ink });
  const s0 = ctx.mobile ? 0.5 : 0.7;
  return {
    name: 'wwd-hero',
    update(sy) {
      const secTop = top - sy;
      if (sy > Sh) { leg.draw(1); return null; }
      const t = smooth(clamp(sy / Sh)); // paced by scroll, not by the (short) vertical drop
      leg.draw(t);
      const p = leg.at(t);
      return { pose: { x: p.x, y: secTop + p.y, scale: s0 + (end.scale - s0) * t, tilt: t > 0 && t < 1 ? tiltFrom(p.angle) * 0.5 : 0 }, s: WWD_STATE };
    },
  };
}

function gutterStage(ctx, body, gx, gs, lead, exitX, stateAt, startDocY) {
  const svg = body.querySelector(':scope > .route');
  const W = body.offsetWidth, H = body.offsetHeight;
  prepRouteSvg(svg, W, H);
  const top = docTop(body);
  const bodyLeft = body.getBoundingClientRect().left;
  const x = gx - bodyLeft, ex = exitX - bodyLeft;
  const y0 = startDocY == null ? 0 : clamp(startDocY - top, 0, H * 0.5); // where the hero leg hands over
  const pad = parseFloat(getComputedStyle(body).paddingBottom) || 0;
  const swing = Math.min(H * 0.5, Math.max(80, pad));
  const d = Math.abs(ex - x) < 1
    ? `M${x},${y0} L${x},${H}`
    : `M${x},${y0} L${x},${H - swing} C${x},${H - swing * 0.35} ${ex},${H - swing * 0.65} ${ex},${H}`;
  const { plan, ink } = routePair(svg, d);
  const leg = new Leg(plan, body, { ink }).buildYTable();
  return {
    name: 'wwd-gutter',
    update(sy) {
      const secTop = top - sy;
      if (secTop > ctx.vh * 1.5 || secTop + H < -ctx.vh) return null;
      const ly = lead(sy) - top;
      if (ly < y0 || ly >= H) { leg.draw(ly >= H ? 1 : 0); return null; }
      const t = leg.tAtY(ly);
      leg.draw(t);
      const p = leg.at(t);
      return { pose: { x: p.x, y: secTop + p.y, scale: gs, tilt: ly > H - swing ? tiltFrom(p.angle) * 0.6 : 0 }, s: stateAt(sy) };
    },
  };
}

function valuesStage(ctx, section, laneX, state) {
  const w = writer();
  const svg = section.querySelector(':scope > .route');
  const W = section.offsetWidth, H = section.offsetHeight;
  prepRouteSvg(svg, W, H);
  const top = docTop(section);
  const left = section.getBoundingClientRect().left;
  const lx = laneX - left;
  const desktop = !ctx.mobile;
  const head = relRect(section.querySelector('.dual'), section);
  const list = relRect(section.querySelector('.wwd-values__list'), section);
  const sealEl = section.querySelector('.wwd-seal');
  const seal = relRect(sealEl, section);
  const cards = [...section.querySelectorAll('.value-card')].map((node) => ({ node, r: relRect(node, section) }));

  // Desktop: flow around the centred heading on its right, then into the lane and down to the
  // seal. On phones: straight down the left rail, curving into the seal at the end.
  let d;
  if (desktop) {
    const around = Math.min(W - 40, head.x + head.w + 64);
    d = verticalPath([[lx, 0], [around, head.y + head.h * 0.25], [around, head.y + head.h * 0.75], [lx, list.y - 8], [lx, seal.cy]]);
  } else {
    const k = Math.max(40, (seal.cy - (list.y + list.h)) * 0.8);
    d = `M${lx},0 L${lx},${seal.cy - k} C${lx},${seal.cy - k * 0.3} ${seal.cx - k * 0.6},${seal.cy} ${seal.cx},${seal.cy}`;
  }
  const { plan, ink } = routePair(svg, d);
  const leg = new Leg(plan, section, { ink }).buildYTable();

  // A short branch from the lane to each card, with a station dot on the lane.
  const hooks = cards.map(({ node, r }) => {
    const y = r.y + (desktop ? 46 : 34);
    const leftSide = r.cx < lx;
    const tx = desktop ? (leftSide ? r.x + r.w + 4 : r.x - 4) : r.x - 4;
    const branch = el('path', { d: `M${lx},${y} L${tx},${y}`, class: 'route-branch', pathLength: '1', 'stroke-dasharray': '1 1', 'stroke-dashoffset': '1' }, svg);
    const dot = el('circle', { cx: lx, cy: y, r: 6, class: 'wwd-station' }, svg);
    return { node, y, branch, dot };
  });
  const endLy = seal.cy;

  return {
    name: 'wwd-values',
    endY: top + endLy - ctx.F,
    update(sy) {
      const secTop = top - sy;
      if (secTop > ctx.vh * 1.5 || secTop + H < -ctx.vh) return null;
      const ly = ctx.F - secTop;
      hooks.forEach((h) => {
        const v = range(ly, h.y - 4, h.y + 36);
        w(h.branch, 'stroke-dashoffset', String(Math.round((1 - v) * 1000) / 1000));
        w(h.dot, 'class', `is-reached|${ly >= h.y - 4 ? 1 : 0}`);
        w(h.node, 'class', `is-stamped|${ly >= h.y + 24 ? 1 : 0}`);
      });
      w(sealEl, 'class', `is-sealed|${ly >= endLy - 6 ? 1 : 0}`);
      if (ly < 0 || ly >= endLy) { leg.draw(ly >= endLy ? 1 : 0); return null; }
      const t = leg.tAtY(ly);
      leg.draw(t);
      const p = leg.at(t);
      const shrink = smooth(range(ly, endLy - 110, endLy - 6));
      return { pose: { x: p.x, y: secTop + p.y, scale: ctx.scale, tilt: tiltFrom(p.angle) }, s: { ...state, shrink } };
    },
  };
}

export { relRect };
