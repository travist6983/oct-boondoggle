import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { Leg, prepRouteSvg, routePair, verticalPath, relRect, el, clamp, range, keyed, lerp, smooth } from './geom.js';
import { docTop, tiltFrom, SEALED, writer, stickyPhase } from './kit.js';

// ---------------------------------------------------------------------------
// 01 Hero: the record collapses into a sheet, then the sheet joins the route.
// ---------------------------------------------------------------------------
export function heroStage(ctx, exitX) {
  const section = document.querySelector('.hero');
  const svg = section.querySelector('.route');
  const art = section.querySelector('.hero-art');
  const card = art.querySelector('#rec-card');
  const sheet = art.querySelector('#rec-sheet');
  const w = writer();
  card.removeAttribute('transform');
  sheet.removeAttribute('transform');

  const W = section.offsetWidth, H = section.offsetHeight;
  prepRouteSvg(svg, W, H);
  const top = docTop(section);
  const secRect = section.getBoundingClientRect();
  const Sh = ctx.vh * (ctx.mobile ? 0.2 : 0.3);
  const artRect = art.getBoundingClientRect();
  const X0 = artRect.left + artRect.width * 0.5;
  const targetDocY = ctx.F + Sh;

  const ctm = art.getScreenCTM();
  const target = new DOMPoint(X0, targetDocY - window.scrollY).matrixTransform(ctm.inverse());
  const k = ctm.a;
  const sheetEnd = ctx.scale / k;
  const cardEnd = (80 * ctx.scale) / k / 360;
  const C = { x: 260, y: 220 };

  const start = [X0 - secRect.left, targetDocY - top];
  const { plan, ink } = routePair(svg, verticalPath([start, [exitX, H]]));
  const leg = new Leg(plan, section, { ink }).buildYTable();

  return {
    name: 'hero',
    update(sy) {
      const m = clamp(sy / Sh);
      if (sy < Sh + ctx.vh) {
        const e = smooth(m);
        const cx = lerp(C.x, target.x, e).toFixed(2), cy = lerp(C.y, target.y, e).toFixed(2);
        const cs = lerp(1, cardEnd, e).toFixed(4);
        w(card, 'transform', `translate(${cx} ${cy}) scale(${cs}) translate(${-C.x} ${-C.y})`);
        w(card, 'style:opacity', String(1 - range(e, 0.45, 0.85)));
        w(sheet, 'transform', `translate(${cx} ${cy}) scale(${lerp(4.5, sheetEnd, e).toFixed(4)})`);
        w(sheet, 'style:opacity', m >= 1 ? '0' : String(range(e, 0.3, 0.75)));
      }
      const ly = ctx.F - (top - sy);
      if (m < 1 || ly < start[1] || ly >= H) {
        leg.draw(ly >= H ? 1 : 0);
        return null;
      }
      const t = leg.tAtY(ly);
      leg.draw(t);
      const p = leg.at(t);
      return { pose: { x: secRect.left + p.x, y: top - sy + p.y, scale: ctx.scale, tilt: tiltFrom(p.angle) }, s: {} };
    },
  };
}

// ---------------------------------------------------------------------------
// 02 Who We Help: the route passes the heading, then fans out to nine destinations.
// ---------------------------------------------------------------------------
export function industriesStage(ctx, entryX, exitX) {
  const section = document.querySelector('.industries');
  const svg = section.querySelector('.route');
  const w = writer();
  const W = section.offsetWidth, H = section.offsetHeight;
  prepRouteSvg(svg, W, H);
  const top = docTop(section);
  const title = relRect(section.querySelector('.industries__title'), section);
  const pills = [...section.querySelectorAll('.pill')];
  const pr = pills.map((p) => relRect(p, section));
  const pillsTop = Math.min(...pr.map((r) => r.y));

  const pts = ctx.mobile
    ? [[entryX, 0], [exitX, H]]
    : [[entryX, 0], [entryX, title.y + title.h + 8], [exitX, pillsTop - 12], [exitX, H]];
  const { plan, ink } = routePair(svg, verticalPath(pts));
  const leg = new Leg(plan, section, { ink }).buildYTable();

  const branches = pr.map((r) => {
    const left = r.cx < exitX;
    const tx = ctx.mobile ? r.x - 6 : left ? r.x + r.w + 8 : r.x - 8;
    const y0 = r.cy - (ctx.mobile ? 34 : 60);
    const bend = ctx.mobile ? 10 : left ? 34 : -34;
    const d = `M${exitX},${y0} C${exitX},${r.cy - 14} ${tx + bend},${r.cy} ${tx},${r.cy}`;
    const node = el('path', { d, class: 'route-branch', pathLength: '1', 'stroke-dasharray': '1 1', 'stroke-dashoffset': '1' }, svg);
    return { node, y0, cy: r.cy };
  });

  return {
    name: 'industries',
    update(sy) {
      const secTop = top - sy;
      if (secTop > ctx.vh * 1.5 || secTop + H < -ctx.vh) return null;
      const ly = ctx.F - secTop;
      branches.forEach((b, i) => {
        const v = range(ly, b.y0, b.cy);
        w(b.node, 'stroke-dashoffset', String(Math.round((1 - v) * 1000) / 1000));
        w(pills[i], 'class', `is-reached|${ly >= b.cy - 4 ? 1 : 0}`);
      });
      if (ly < 0 || ly >= H) {
        leg.draw(ly >= H ? 1 : 0);
        return null;
      }
      const t = leg.tAtY(ly);
      leg.draw(t);
      const p = leg.at(t);
      return { pose: { x: p.x, y: secTop + p.y, scale: ctx.scale, tilt: tiltFrom(p.angle) }, s: {} };
    },
  };
}

// ---------------------------------------------------------------------------
// 03 + 04 Production line (pinned) and the digital fork.
// ---------------------------------------------------------------------------
export function productionStage(ctx, entryX, exitX, scrollToY) {
  const section = document.querySelector('.production');
  const frame = section.querySelector('.stage-frame');
  const svg = frame.querySelector('.route');
  const iso = frame.querySelector('.iso--production');
  const w = writer();
  const W = frame.offsetWidth, FH = frame.offsetHeight, SH = section.offsetHeight;
  prepRouteSvg(svg, W, FH);
  const top = docTop(section);
  const pinLen = SH - FH;

  const headNode = iso.querySelector('#print-head');
  headNode.removeAttribute('transform');
  const pin = new Leg(iso.querySelector('#prod-route'), frame, { ink: iso.querySelector('#prod-route-ink') });
  const tA = {};
  iso.querySelectorAll('.anchor').forEach((a) => {
    const r = relRect(a, frame);
    tA[a.dataset.anchor] = pin.tNear(r.cx, r.cy);
  });
  const s0 = pin.at(0), s1 = pin.at(1);
  const enterSeg = routePair(svg, verticalPath([[entryX, 0], [s0.x, s0.y]]));
  const exitSeg = routePair(svg, verticalPath([[s1.x, s1.y], [exitX, FH]]));
  const enter = new Leg(enterSeg.plan, frame, { ink: enterSeg.ink });
  const exit = new Leg(exitSeg.plan, frame, { ink: exitSeg.ink });
  const lift = ctx.lift;

  const BELT = [[0, 0], [0.05, tA.people], [0.2, tA.people], [0.26, tA.scan], [0.42, tA.scan], [0.48, tA.print], [0.64, tA.print], [0.72, tA.insert], [0.965, tA.insert], [1, 1]];
  const STEPS = [['people', 0, 0.1], ['processes', 0.23, 0.34], ['technology', 0.46, 0.56]];

  // UI: index + panels + people word fill + counter
  const index = section.querySelector('.tab-index');
  index.hidden = false;
  const buttons = [...index.querySelectorAll('button')];
  const panels = [...section.querySelectorAll('.tab-panel')];
  buttons.forEach((b) => {
    b.onclick = () => {
      const step = STEPS.find(([n]) => n === b.dataset.step);
      scrollToY(top + pinLen * step[2] + 2);
    };
  });
  const fill = section.querySelector('.wordfill');
  if (!fill.dataset.split) {
    fill.innerHTML = fill.textContent.split(' ').map((word) => `<span class="wf">${word}</span>`).join(' ');
    fill.dataset.split = '1';
  }
  const words = [...fill.querySelectorAll('.wf')];
  const counter = section.querySelector('.counter__num');
  const chips = [...iso.querySelectorAll('.hud-chip')];
  const scanLight = iso.querySelector('.scan-light');
  const drops = iso.querySelector('.ink-drops');
  const msgSms = iso.querySelector('.phone-msg--sms');
  const msgEmail = iso.querySelector('.phone-msg--email');
  const forkLinks = section.querySelector('.fork-links');
  const flySms = gsap.to('#fly-sms', { motionPath: { path: '#fork-sms', align: '#fork-sms', alignOrigin: [0.5, 0.5] }, ease: 'none', paused: true });
  const flyEmail = gsap.to('#fly-email', { motionPath: { path: '#fork-email', align: '#fork-email', alignOrigin: [0.5, 0.5] }, ease: 'none', paused: true });
  const flyNodes = [iso.querySelector('#fly-sms'), iso.querySelector('#fly-email')];
  // park the Text Message / Email links just beside the phone
  const artEl = section.querySelector('.production__art');
  const phoneA = relRect(iso.querySelector('[data-anchor="phone"]'), artEl);
  forkLinks.style.left = `${Math.round(phoneA.x - (ctx.mobile ? 120 : 170))}px`;
  forkLinks.style.top = `${Math.round(phoneA.y + (ctx.mobile ? 10 : 40))}px`;

  function visuals(pp) {
    const step = pp < 0.23 ? 'people' : pp < 0.46 ? 'processes' : 'technology';
    buttons.forEach((b) => w(b, 'aria-current', b.dataset.step === step ? 'step' : 'false'));
    panels.forEach((p) => w(p, 'class', `is-active|${p.dataset.step === step ? 1 : 0}`));
    const on = Math.round(range(pp, 0.005, 0.18) * words.length);
    words.forEach((wd, i) => w(wd, 'class', `on|${i < on ? 1 : 0}`));
    chips.forEach((c, i) => {
      const v = range(pp, 0.29 + i * 0.03, 0.315 + i * 0.03);
      w(c, 'style:opacity', String(v));
      w(c, 'transform', `translate(${((1 - v) * -12).toFixed(1)} 0)`);
    });
    const scanning = pp > 0.28 && pp < 0.41;
    w(scanLight, 'style:opacity', scanning ? '0.55' : '0.16');
    const printing = pp > 0.49 && pp < 0.64;
    const off = printing ? Math.sin(range(pp, 0.49, 0.64) * Math.PI * 7) * 18 : 0;
    w(headNode, 'transform', `translate(${(-off * 0.866).toFixed(1)} ${(off * 0.5).toFixed(1)})`);
    w(drops, 'style:opacity', printing ? '1' : '0');
    const n = Math.round(range(pp, 0.49, 0.64) * 30000000);
    w(counter, 'text', n.toLocaleString('en-US'));
    const fs = range(pp, 0.84, 0.91), fe = range(pp, 0.86, 0.93);
    flySms.progress(fs);
    flyEmail.progress(fe);
    w(flyNodes[0], 'style:opacity', fs > 0 && fs < 1 ? '1' : '0');
    w(flyNodes[1], 'style:opacity', fe > 0 && fe < 1 ? '1' : '0');
    w(msgSms, 'style:opacity', fs >= 1 ? '1' : '0');
    w(msgEmail, 'style:opacity', fe >= 1 ? '1' : '0');
    w(forkLinks, 'class', `is-on|${pp >= 0.93 ? 1 : 0}`);
  }

  function envState(pp) {
    return {
      clean: range(pp, 0.365, 0.39),
      scan: range(pp, 0.29, 0.4),
      print: range(pp, 0.5, 0.63),
      fold: range(pp, 0.645, 0.705),
      insert: range(pp, 0.72, 0.79),
      seal: range(pp, 0.8, 0.835),
    };
  }

  return {
    name: 'production',
    update(sy) {
      const secTop = top - sy;
      if (secTop > ctx.vh * 1.5 || secTop + SH < -ctx.vh) return null;
      const ph = stickyPhase(secTop, SH, FH, ctx.F);
      visuals(ph.pp);
      enter.draw(ph.phase === 'enter' ? ph.e : ph.phase === 'before' ? 0 : 1);
      exit.draw(ph.phase === 'exit' ? ph.x : ph.phase === 'after' ? 1 : 0);
      const beltT = keyed(BELT, ph.pp);
      pin.draw(ph.phase === 'before' || ph.phase === 'enter' ? 0 : beltT);
      let p, l = lift;
      if (ph.phase === 'enter') {
        p = enter.at(ph.e);
        l = lift * smooth(range(ph.e, 0.7, 1));
      } else if (ph.phase === 'pinned') {
        p = pin.at(beltT);
      } else if (ph.phase === 'exit') {
        p = exit.at(ph.x);
        l = lift * (1 - smooth(range(ph.x, 0, 0.3)));
      } else return null;
      return {
        pose: { x: p.x, y: ph.frameTop + p.y - l, scale: ctx.scale, tilt: ph.phase === 'pinned' ? 0 : tiltFrom(p.angle) },
        s: envState(ph.pp),
      };
    },
    destroy() {
      flySms.kill();
      flyEmail.kill();
    },
  };
}

// ---------------------------------------------------------------------------
// 05 What Makes Renkim Different: stamped at the postage station, values reveal by station.
// ---------------------------------------------------------------------------
export function valuesStage(ctx, entryX, exitX) {
  const section = document.querySelector('.values');
  const svg = section.querySelector('.route');
  const w = writer();
  const cards = [...section.querySelectorAll('.value-card')];
  cards.forEach((c) => { c.style.transform = ''; c.style.opacity = ''; });
  const W = section.offsetWidth, H = section.offsetHeight;
  prepRouteSvg(svg, W, H);
  const top = docTop(section);
  const stationEl = section.querySelector('.values__station');
  const arm = stationEl.querySelector('#stamp-arm');
  const sr = relRect(stationEl, section);
  const head = relRect(section.querySelector('.values__head'), section);
  const stampY = ctx.mobile || !sr.h ? head.y + head.h : sr.cy;
  const dots = cards.map((c) => c.querySelector('.station'));
  const dr = dots.map((d) => relRect(d, section));
  const cr = cards.map((c) => relRect(c, section));

  const { plan, ink } = routePair(svg, verticalPath([[entryX, 0], [exitX, H]]));
  const leg = new Leg(plan, section, { ink }).buildYTable();

  return {
    name: 'values',
    update(sy) {
      const secTop = top - sy;
      if (secTop > ctx.vh * 1.5 || secTop + H < -ctx.vh) return null;
      const ly = ctx.F - secTop;
      const stamp = range(ly, stampY - 24, stampY + 36);
      const press = clamp(1 - Math.abs(ly - stampY) / 70);
      w(arm, 'transform', `translate(0 ${(press * 14).toFixed(1)})`);
      dots.forEach((d, i) => w(d, 'class', `is-reached|${ly >= dr[i].cy ? 1 : 0}`));
      cards.forEach((c, i) => {
        const v = smooth(range(ly, cr[i].y - ctx.vh * 0.5, cr[i].y - ctx.vh * 0.2));
        const side = ctx.mobile ? 0 : i % 2 === 0 ? 1 : -1;
        w(c, 'style:transform', v >= 1 ? '' : `translate3d(${(side * 70 * (1 - v)).toFixed(1)}px, ${(48 * (1 - v)).toFixed(1)}px, 0)`);
        w(c, 'style:opacity', String(Math.round((0.001 + v) * 1000) / 1000));
      });
      if (ly < 0 || ly >= H) {
        leg.draw(ly >= H ? 1 : 0);
        return null;
      }
      const t = leg.tAtY(ly);
      leg.draw(t);
      const p = leg.at(t);
      return { pose: { x: p.x, y: secTop + p.y, scale: ctx.scale, tilt: tiltFrom(p.angle) }, s: { ...SEALED, stamp } };
    },
  };
}

// ---------------------------------------------------------------------------
// 06 100% Employee Owned: the warm beat. Photo opens full-bleed and settles into a card.
// ---------------------------------------------------------------------------
export function employeeStage(ctx, entryX, exitX, { section = document.querySelector('.employee'), state = { ...SEALED, stamp: 1 } } = {}) {
  const svg = section.querySelector('.route');
  const wrap = section.querySelector('.employee__wrap');
  const W = section.offsetWidth, H = section.offsetHeight;
  prepRouteSvg(svg, W, H);
  const top = docTop(section);
  const wr = relRect(wrap, section);

  let pts;
  if (ctx.mobile) pts = [[entryX, 0], [exitX, H]];
  else pts = [[entryX, 0], [exitX, wr.y + 80], [exitX, wr.y + wr.h - 80], [exitX, H]];
  const { plan, ink } = routePair(svg, verticalPath(pts));
  const leg = new Leg(plan, section, { ink }).buildYTable();

  let st = null;
  if (!ctx.mobile) {
    const finalInset = Math.max(ctx.gutter, (W - ctx.container) / 2);
    st = gsap.fromTo(wrap, { '--inset': '0px', '--r': '0px' }, {
      '--inset': `${finalInset}px`, '--r': '34px', ease: 'none',
      scrollTrigger: { trigger: wrap, start: 'top 92%', end: 'top 30%', scrub: true },
    });
  }

  return {
    name: 'employee',
    update(sy) {
      const secTop = top - sy;
      if (secTop > ctx.vh * 1.5 || secTop + H < -ctx.vh) return null;
      const ly = ctx.F - secTop;
      if (ly < 0 || ly >= H) {
        leg.draw(ly >= H ? 1 : 0);
        return null;
      }
      const t = leg.tAtY(ly);
      leg.draw(t);
      const p = leg.at(t);
      return { pose: { x: p.x, y: secTop + p.y, scale: ctx.scale, tilt: tiltFrom(p.angle) }, s: state };
    },
    destroy() {
      if (st) {
        st.scrollTrigger?.kill();
        st.kill();
        wrap.style.removeProperty('--inset');
        wrap.style.removeProperty('--r');
      }
    },
  };
}

// ---------------------------------------------------------------------------
// 07 + 08 Data services (pinned): wrong address → corrected route → delivery.
// ---------------------------------------------------------------------------
export function dataStage(ctx, entryX) {
  const section = document.querySelector('.data');
  const frame = section.querySelector('.stage-frame');
  const svg = frame.querySelector('.route');
  const iso = frame.querySelector('.iso--hood');
  const zoomG = iso.querySelector('#hood-zoom');
  const w = writer();
  zoomG.removeAttribute('transform');
  const W = frame.offsetWidth, FH = frame.offsetHeight, SH = section.offsetHeight;
  prepRouteSvg(svg, W, FH);
  const top = docTop(section);

  const mb = iso.querySelector('[data-anchor="mb48"]');
  const c = { x: +mb.getAttribute('cx'), y: +mb.getAttribute('cy') };
  let zoom = 1;
  const pre = (x, y) => [c.x + (x - c.x) * zoom, c.y + (y - c.y) * zoom];
  const pin = new Leg(iso.querySelector('#hood-route'), frame, { ink: iso.querySelector('#hood-route-ink'), pre });
  const wrong = iso.querySelector('#hood-wrong');
  const wrongRaw = MotionPathPlugin.getRawPath(wrong);
  MotionPathPlugin.cacheRawPathMeasurements(wrongRaw);
  const b0 = MotionPathPlugin.getPositionOnPath(wrongRaw, 0);
  const bf = { x: pin.m.a * b0.x + pin.m.c * b0.y + pin.m.e, y: pin.m.b * b0.x + pin.m.d * b0.y + pin.m.f };
  const tB = pin.tNear(bf.x, bf.y);
  const s0 = pin.at(0);
  const enterSeg = routePair(svg, verticalPath([[entryX, 0], [s0.x, s0.y]]));
  const enter = new Leg(enterSeg.plan, frame, { ink: enterSeg.ink });
  const lift = ctx.lift * 0.8;

  const ROUTE = [[0, 0], [0.12, tB], [0.64, tB], [0.86, 1], [1, 1]];
  const ZOOM = [[0, 1], [0.66, 1], [0.88, 1.9], [1, 1.9]];
  const checks = Object.fromEntries([...section.querySelectorAll('.checklist li')].map((li) => [li.dataset.check, li]));
  const CHECK_AT = { cass: 0.16, aec: 0.32, bd: 0.42, phone: 0.52, return: 0.6 };
  const wrongX = iso.querySelector('.wrong-x');
  const ret = iso.querySelector('.return-arrow');
  const done = iso.querySelector('.deliver-check');
  const door = iso.querySelector('.mb-door-48');
  const flag = iso.querySelector('.mb-flag-48');

  const scramble = (pp) => {
    if (pp < 0.17) return '12';
    if (pp >= 0.26) return '48';
    const seed = Math.floor(pp * 600);
    return String(10 + ((seed * 7919) % 89));
  };

  function visuals(pp) {
    zoom = keyed(ZOOM, pp);
    w(zoomG, 'transform', zoom === 1 ? '' : `translate(${c.x} ${c.y}) scale(${zoom.toFixed(4)}) translate(${-c.x} ${-c.y})`);
    const wd = range(pp, 0.12, 0.2);
    const rejected = pp >= 0.26;
    w(wrong, 'style:strokeDashoffset', String(1 - wd));
    w(wrong, 'style:stroke', rejected ? '#656263' : '#0076C0');
    w(wrong, 'style:strokeDasharray', rejected ? '0.02 0.025' : '1 1');
    w(wrong, 'style:opacity', rejected ? '0.75' : '1');
    w(wrongX, 'style:opacity', String(range(pp, 0.24, 0.28)));
    w(ret, 'style:opacity', String(range(pp, 0.58, 0.62)));
    w(done, 'style:opacity', String(range(pp, 0.95, 0.98)));
    for (const [k, at] of Object.entries(CHECK_AT)) w(checks[k], 'class', `is-done|${pp >= at ? 1 : 0}`);
    const doorOpen = range(pp, 0.85, 0.88) * (1 - range(pp, 0.93, 0.95));
    w(door, 'style:opacity', String(1 - 0.75 * doorOpen));
    w(flag, 'transform', `rotate(${(-90 + 90 * smooth(range(pp, 0.93, 0.97))).toFixed(1)})`);
  }

  return {
    name: 'data',
    deliveredY: top + (SH - FH) * 0.95,
    update(sy) {
      const secTop = top - sy;
      if (secTop > ctx.vh * 1.5 || secTop + SH < -ctx.vh) return null;
      const ph = stickyPhase(secTop, SH, FH, ctx.F);
      visuals(ph.pp);
      enter.draw(ph.phase === 'enter' ? ph.e : ph.phase === 'before' ? 0 : 1);
      const t = keyed(ROUTE, ph.pp);
      pin.draw(ph.phase === 'before' || ph.phase === 'enter' ? 0 : t);
      const s = {
        ...SEALED, stamp: 1,
        num: scramble(ph.pp),
        aec: ph.pp >= CHECK_AT.aec,
        badge: range(ph.pp, CHECK_AT.bd, CHECK_AT.bd + 0.03),
        phone: range(ph.pp, CHECK_AT.phone, CHECK_AT.phone + 0.03),
        shrink: range(ph.pp, 0.86, 0.93),
        tag: range(ph.pp, 0.04, 0.1) * (1 - range(ph.pp, 0.64, 0.7)),
        strike: ph.pp >= 0.13 && ph.pp < 0.17 ? 1 : 0,
        corrected: ph.pp >= 0.26,
      };
      if (ph.phase === 'enter') {
        const p = enter.at(ph.e);
        return { pose: { x: p.x, y: ph.frameTop + p.y - lift * smooth(range(ph.e, 0.7, 1)), scale: ctx.scale, tilt: tiltFrom(p.angle) }, s };
      }
      if (ph.phase === 'pinned' && ph.pp < 0.93) {
        const p = pin.at(t);
        const l = lift * (1 - smooth(range(t, 0.9, 1)));
        return { pose: { x: p.x, y: p.y - l, scale: ctx.scale * lerp(1, 1.12, range(ph.pp, 0.66, 0.86)), tilt: 0 }, s };
      }
      return null;
    },
  };
}
