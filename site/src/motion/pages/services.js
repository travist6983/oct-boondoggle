// Services journey: "One envelope, three channels".
// A blank sheet waits on the hero seam → it drops into the channel stage, where the camera pans
// across three stations: Print & Mail (the live photo prints under an inkjet head, the sheet
// folds into a sealed, certified envelope), Digital (the envelope opens; an email lands in a
// browser and a text on a phone), Ancillary Services (a scan crosses the office photo and nine
// data checks tick). Then it rides the employee band and drops into the contact form.
// Every visual state is a pure function of scrollY.
import { startMotion, journeyOf } from '../runtime.js';
import { Leg, prepRouteSvg, routePair, verticalPath, clamp, range, keyed, lerp, smooth } from '../geom.js';
import { docTop, tiltFrom, writer } from '../kit.js';
import { employeeStage } from '../stages.js';

const FINAL = { clean: 1, print: 1, fold: 1, insert: 1, seal: 1, badge: 1, aec: true, num: '' };
const PAPER = { num: '' };

// Station timeline in "c" units: 0–1 print, 1–2 digital, 2–3 data. Travel windows at the seams.
const T = {
  morphIn: [0.05, 0.14],
  print: [0.15, 0.58],
  morphOut: [0.6, 0.68],
  fold: [0.69, 0.74],
  insert: [0.75, 0.8],
  seal: [0.8, 0.84],
  badge: [0.85, 0.89],
  load: [0.95, 1.18],
  reveal: [1.0, 1.24],
  open: [1.24, 1.31],
  email: [1.32, 1.5],
  sms: [1.47, 1.65],
  close: [1.7, 1.77],
  scan: [2.14, 2.8],
};
const CAMERA = [[0, 0], [0.92, 0], [1.1, 1], [1.92, 1], [2.1, 2], [3, 2]];
// Print reaches the end of the photo + body copy at 84% of the sheet, the MICR line at 93%.
const PRINT_DOC_AT = 0.84, MICR_AT = 0.93;
const cellAt = (i) => (Math.floor(i / 3) + 0.4) / 3 + (i % 3) * 0.05; // beam progress per cell

export function init() {
  startMotion(buildJourney);
}

function buildJourney(ctx, { scrollToY }) {
  const svc = servicesStage(ctx, scrollToY);
  const bandX = ctx.mobile ? ctx.rail : ctx.containerRight - 120;
  const band = employeeStage(ctx, svc.exitX, bandX, { section: document.querySelector('.employee'), state: FINAL });
  const contact = contactStage(ctx, bandX);
  return journeyOf([svc, band, contact], contact.endY);
}

// Piecewise-linear map through [x, y] keys (x increasing), clamped at the ends.
function linear(keys, x) {
  if (x <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [x1, y1] = keys[i];
    if (x <= x1) {
      const [x0, y0] = keys[i - 1];
      return x1 === x0 ? y1 : lerp(y0, y1, (x - x0) / (x1 - x0));
    }
  }
  return keys[keys.length - 1][1];
}

function bezier(s, cp, e, t) {
  const u = 1 - t;
  return { x: u * u * s.x + 2 * u * t * cp.x + t * t * e.x, y: u * u * s.y + 2 * u * t * cp.y + t * t * e.y };
}

function servicesStage(ctx, scrollToY) {
  const section = document.querySelector('.svc');
  const svg = section.querySelector(':scope > .route');
  const cell = section.querySelector('.svc__art-cell');
  const art = section.querySelector('.svc-art');
  const world = art.querySelector('.svc-world');
  const wsvg = world.querySelector('.svc-world__route');
  const seam = section.querySelector('.svc-seam');
  const slides = [...world.querySelectorAll('.svc-slide')];
  const q = (s) => world.querySelector(s);
  const sheet = q('.svc-sheet'), printLayer = q('.svc-sheet__print'), head = q('.svc-head');
  const loadBar = q('.svc-browser__load span'), view = q('.svc-browser__view'), browser = q('.svc-browser');
  const toast = q('.svc-toast'), phoneMsg = q('.svc-phone__msg');
  const flyEmail = q('.svc-fly--email'), flySms = q('.svc-fly--sms');
  const scan = q('.svc-scan'), beam = q('.svc-scan__beam');
  const cells = [...world.querySelectorAll('.svc-cell')];
  const links = [...section.querySelectorAll('.svc-index a')];
  const panels = [...section.querySelectorAll('.svc-panel')];
  const bodies = panels.map((p) => p.querySelector('.svc-panel__body'));
  const pills = Object.fromEntries([...section.querySelectorAll('.svc-pill[data-tick]')].map((p) => [p.dataset.tick, p]));
  const w = writer();
  const stacked = ctx.vw < 1024;
  const es = ctx.scale;

  // Reset everything the frame loop writes, then measure.
  for (const n of [world, sheet, head, loadBar, toast, flyEmail, flySms, beam]) n.style.transform = '';
  for (const n of [sheet, head, toast, flyEmail, flySms, beam, phoneMsg]) n.style.opacity = '';
  printLayer.style.clipPath = '';
  view.style.clipPath = '';

  const W = section.offsetWidth, H = section.offsetHeight;
  prepRouteSvg(svg, W, H);
  const secTop = docTop(section);
  const secLeft = section.getBoundingClientRect().left;

  const artR = art.getBoundingClientRect();
  const AW = artR.width, AH = artR.height, artLeft = artR.left;
  const cellTop = docTop(cell), cellBottom = cellTop + cell.offsetHeight;
  const stickyTop = parseFloat(getComputedStyle(art).top) || 0;
  const artTopV = (sy) => Math.min(Math.max(stickyTop, cellTop - sy), cellBottom - AH - sy);
  const local = (n) => {
    const r = n.getBoundingClientRect();
    const x = r.left - artR.left, y = r.top - artR.top;
    return { x, y, w: r.width, h: r.height, cx: x + r.width / 2, cy: y + r.height / 2, r: x + r.width, b: y + r.height };
  };
  const sheetR = local(sheet), headR = local(head), browserR = local(browser), toastR = local(toast);
  const msgR = local(phoneMsg), scanR = local(scan);
  const slide2 = local(slides[1]);
  const flyE = local(flyEmail), flyS = local(flySms);

  // Docks (art-local, world coords with the camera at 0)
  const envW = 60 * es, envH = 80 * es;
  let dIn, dOut;
  if (stacked) {
    dIn = { x: sheetR.x - envW / 2 - 24, y: sheetR.y + envH / 2 + 4 };
    dOut = { x: sheetR.r + 29 * es + 30, y: sheetR.b - 29 * es - 6 };
  } else {
    dIn = { x: sheetR.cx, y: Math.max(envH / 2 + 10, sheetR.y - envH / 2 - 18) };
    dOut = { x: sheetR.cx, y: Math.min(AH - 29 * es - 12, sheetR.b + envH / 2 + 22) };
  }
  const dDig = { x: browserR.x + browserR.w * (stacked ? 0.3 : 0.28), y: browserR.b + (AH - browserR.b) * 0.5 + (stacked ? 6 : 14) };
  const dTop = { x: scanR.x, y: scanR.y + scanR.h * 0.1 };
  const dBot = { x: scanR.x, y: scanR.y + scanR.h * 0.9 };
  const dExit = { x: scanR.x, y: Math.min(AH - 29 * es - 8, scanR.b + 44) };

  // The stage's own route (inside the panning world)
  prepRouteSvg(wsvg, world.offsetWidth, AH);
  const k = AW * 0.38;
  const d = `M${dOut.x},${dOut.y}`
    + ` C${dOut.x + k},${dOut.y} ${dDig.x - k},${dDig.y} ${dDig.x},${dDig.y}`
    + ` C${dDig.x + k},${dDig.y} ${dTop.x},${dTop.y - AH * 0.3} ${dTop.x},${dTop.y}`
    + ` L${dBot.x},${dBot.y} L${dExit.x},${dExit.y}`;
  const wr = routePair(wsvg, d);
  const leg = new Leg(wr.plan, art, { ink: wr.ink });
  const U = { out: 0, dig: leg.tNear(dDig.x, dDig.y), top: leg.tNear(dTop.x, dTop.y), bot: leg.tNear(dBot.x, dBot.y) };

  // Scroll → c (station time). Desktop: the sticking span of each panel body; stacked: the focus
  // line crossing each panel in the copy area under the sticky stage.
  let keys;
  if (!stacked) {
    const Y = parseFloat(getComputedStyle(bodies[0]).top) || 0;
    const sp = panels.map((p, i) => {
      const cs = getComputedStyle(p);
      const top = docTop(p);
      return [top + parseFloat(cs.paddingTop) - Y, top + p.offsetHeight - parseFloat(cs.paddingBottom) - bodies[i].offsetHeight - Y];
    });
    keys = [[sp[0][0], 0], [sp[0][1], 0.92], [sp[1][0], 1.1], [sp[1][1], 1.92], [sp[2][0], 2.1], [sp[2][1], 3]];
  } else {
    const idxH = section.querySelector('.svc-index').offsetHeight;
    const copyTop = stickyTop + AH + idxH;
    const Fc = copyTop + (ctx.vh - copyTop) * 0.35;
    const r = panels.map((p) => [docTop(p) - Fc, p.offsetHeight]);
    keys = [[r[0][0], 0], [r[0][0] + 0.92 * r[0][1], 0.92], [r[1][0] + 0.1 * r[1][1], 1.1], [r[1][0] + 0.92 * r[1][1], 1.92], [r[2][0] + 0.1 * r[2][1], 2.1], [r[2][0] + r[2][1], 3]];
  }
  const cOf = (sy) => linear(keys, sy);
  const sy0 = Math.max(1, keys[0][0]);

  // Index links jump to the start of each station (not just the panel top), then move focus.
  const syAt = (c) => linear(keys.map(([y, v]) => [v, y]), c);
  links.forEach((a, i) => {
    a.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      scrollToY(Math.round(syAt([0.04, 1.14, 2.14][i])) + 1);
      const panel = panels[i];
      if (!panel.hasAttribute('tabindex')) panel.setAttribute('tabindex', '-1');
      setTimeout(() => panel.focus({ preventScroll: true }), 900);
    };
  });
  const sy3 = keys[keys.length - 1][0];

  // Entry: the sheet on the seam → the stage's input dock (doc space, arriving exactly at sy0).
  const sr = seam.getBoundingClientRect();
  const Hp = { x: sr.left + sr.width / 2, y: sr.top + sr.height / 2 + window.scrollY };
  const I0 = { x: artLeft + dIn.x, y: artTopV(sy0) + dIn.y + sy0 };
  const entry = routePair(svg, verticalPath([[Hp.x - secLeft, Hp.y - secTop], [I0.x - secLeft, I0.y - secTop]]));
  const entryLeg = new Leg(entry.plan, section, { ink: entry.ink });

  // Exit: the stage's exit dock → the employee band (arrives on the focus line at the band top).
  const E0 = { x: artLeft + dExit.x - 2 * AW, y: artTopV(sy3) + dExit.y + sy3 };
  const exitX = ctx.mobile ? ctx.rail : E0.x;
  const bandTop = secTop + H;
  const syBand = Math.max(sy3 + 60, bandTop - ctx.F);
  const exit = routePair(svg, verticalPath([[E0.x - secLeft, E0.y - secTop], [exitX - secLeft, H]]));
  const exitLeg = new Leg(exit.plan, section, { ink: exit.ink });

  // Morph targets for the press sheet
  const envScale = envW / sheetR.w;
  const inDx = dIn.x - envW / 2 - sheetR.x, inDy = dIn.y - envH / 2 - sheetR.y;
  const outDx = dOut.x - envW / 2 - sheetR.x, outDy = dOut.y - envH / 2 - sheetR.y;

  // Flight paths (art-local) for the email card and the SMS bubble
  const src = { x: dDig.x, y: dDig.y - 50 * es };
  const toastC = { x: toastR.cx, y: toastR.cy };
  const msgC = { x: msgR.cx, y: msgR.cy };
  const arc = (a, b) => ({ x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - AH * 0.16 });
  const cpE = arc(src, toastC), cpS = arc(src, msgC);

  function visuals(c, camPx) {
    const step = c < 1 ? 0 : c < 2 ? 1 : 2;
    links.forEach((a, i) => w(a, 'aria-current', i === step ? 'step' : 'false'));
    w(world, 'style:transform', `translate3d(${(-camPx).toFixed(1)}px,0,0)`);

    // 1 · print
    const p = range(c, ...T.print);
    w(printLayer, 'style:clipPath', `inset(0 0 ${(100 - p * 100).toFixed(2)}% 0)`);
    w(head, 'style:transform', `translate3d(0,${(p * sheetR.h).toFixed(1)}px,0)`);
    w(head, 'style:opacity', String(Math.round((1 - range(c, 0.58, 0.64)) * 1000) / 1000));
    // The press sheet grows out of the arriving envelope and shrinks back into it (the HTML sheet
    // is rasterised at full size, so it stays crisp at every scale).
    const mi = smooth(range(c, ...T.morphIn)), mo = smooth(range(c, ...T.morphOut));
    w(sheet, 'style:opacity', c >= T.morphIn[0] && c < T.morphOut[1] ? '1' : '0');
    // the press tray is only drawn while a sheet is on it
    w(sheet.parentElement, 'class', `is-empty|${c >= T.morphIn[0] && c < T.morphOut[1] ? 0 : 1}`);
    let dx = 0, dy = 0, k = 1;
    if (mi < 1) { dx = inDx * (1 - mi); dy = inDy * (1 - mi); k = lerp(envScale, 1, mi); }
    else if (mo > 0) { dx = outDx * mo; dy = outDy * mo; k = lerp(1, envScale, mo); }
    w(sheet, 'style:transform', k === 1 ? 'none' : `translate3d(${dx.toFixed(1)}px,${dy.toFixed(1)}px,0) scale(${k.toFixed(4)})`);
    w(pills.print, 'class', `is-ticked|${p >= PRINT_DOC_AT ? 1 : 0}`);
    w(pills.micr, 'class', `is-ticked|${p >= MICR_AT ? 1 : 0}`);
    w(pills.certified, 'class', `is-ticked|${c >= 0.875 ? 1 : 0}`);

    // 2 · digital
    w(loadBar, 'style:transform', `scaleX(${range(c, ...T.load).toFixed(3)})`);
    w(view, 'style:clipPath', `inset(0 0 ${((1 - range(c, ...T.reveal)) * 100).toFixed(2)}% 0)`);
    const fe = range(c, ...T.email), fs = range(c, ...T.sms);
    fly(flyEmail, flyE, bezier(src, cpE, toastC, smooth(fe)), fe);
    fly(flySms, flyS, bezier(src, cpS, msgC, smooth(fs)), fs);
    const tv = range(c, 1.49, 1.53);
    w(toast, 'style:opacity', String(tv));
    w(toast, 'style:transform', `translate3d(0,${((1 - tv) * -8).toFixed(1)}px,0)`);
    w(phoneMsg, 'style:opacity', String(range(c, 1.64, 1.67)));
    w(pills.email, 'class', `is-ticked|${fe >= 1 ? 1 : 0}`);
    w(pills.sms, 'class', `is-ticked|${fs >= 1 ? 1 : 0}`);

    // 3 · data
    const b = range(c, ...T.scan);
    w(beam, 'style:transform', `translate3d(0,${(b * scanR.h).toFixed(1)}px,0)`);
    w(beam, 'style:opacity', b > 0 && b < 1 ? '1' : '0');
    cells.forEach((n, i) => w(n, 'class', `is-scanned|${b >= cellAt(i) ? 1 : 0}`));
    ['aec', 'bd', 'ev', 'ls', 'lb', 'ps', 'rmp', 'cass', 'vas'].forEach((key, i) => w(pills[key], 'class', `is-ticked|${b >= cellAt(i) ? 1 : 0}`));
  }

  function fly(node, box, pos, f) {
    const s = 0.55 + 0.45 * f;
    const x = pos.x - slide2.x - box.w / 2, y = pos.y - slide2.y - box.h / 2;
    w(node, 'style:transform', `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${s.toFixed(3)})`);
    w(node, 'style:opacity', f > 0 && f < 1 ? '1' : '0');
  }

  function envState(c) {
    if (c < T.morphOut[1]) return PAPER;
    const s = {
      clean: 1, print: 1, num: '',
      fold: range(c, ...T.fold), insert: range(c, ...T.insert), seal: range(c, ...T.seal), badge: range(c, ...T.badge),
      aec: c >= T.scan[1],
    };
    if (c > T.open[0] - 0.02) s.seal = clamp(1 - range(c, ...T.open) + range(c, ...T.close));
    return s;
  }

  // Route parameter along the stage's own route, by station time.
  function routeT(c) {
    if (c < T.morphOut[1]) return 0;
    if (c < 0.92) return U.out;
    if (c < 2.1) return keyed([[0.92, U.out], [1.1, U.dig], [1.92, U.dig], [2.1, U.top]], c);
    if (c < 2.86) {
      const by = scanR.y + range(c, ...T.scan) * scanR.h;
      return lerp(U.top, U.bot, clamp((by - dTop.y) / (dBot.y - dTop.y)));
    }
    return keyed([[2.86, U.bot], [3, 1]], c);
  }

  return {
    name: 'services',
    exitX,
    update(sy) {
      const c = cOf(sy);
      const camPx = keyed(CAMERA, c) * AW;
      const aTop = artTopV(sy);
      const near = secTop - sy < ctx.vh * 1.6 && secTop + H - sy > -ctx.vh;
      if (near) visuals(c, camPx);

      // ink: entry, stage, exit
      entryLeg.draw(range(sy, 0, sy0));
      leg.draw(sy < sy0 || c < T.morphOut[1] ? 0 : routeT(c));
      exitLeg.draw(range(sy, sy3, syBand));

      if (sy < sy0) {
        const p = entryLeg.at(range(sy, 0, sy0));
        return { pose: { x: secLeft + p.x, y: secTop - sy + p.y, scale: es, tilt: tiltFrom(p.angle) }, s: PAPER };
      }
      if (sy < sy3) {
        const toV = (pt) => ({ x: artLeft + pt.x - camPx, y: aTop + pt.y });
        if (c < T.morphIn[0]) return { pose: { ...toV(dIn), scale: es, tilt: 0 }, s: PAPER };
        if (c < T.morphOut[1]) return null; // the press sheet stands in for the envelope
        const p = toV(leg.at(routeT(c)));
        return { pose: { ...p, scale: es, tilt: 0 }, s: envState(c) };
      }
      if (sy < syBand) {
        const p = exitLeg.at(range(sy, sy3, syBand));
        return { pose: { x: secLeft + p.x, y: secTop - sy + p.y, scale: es, tilt: tiltFrom(p.angle) }, s: FINAL };
      }
      return null;
    },
  };
}

// The envelope leaves the band and drops into the "Ready to Talk With Renkim Today?" form card.
function contactStage(ctx, startX) {
  const section = document.querySelector('.contact');
  const svg = section.querySelector('.route');
  const band = document.querySelector('.employee');
  const card = section.querySelector('.form-card');
  const W = section.offsetWidth, H = section.offsetHeight;
  prepRouteSvg(svg, W, H);
  const secTop = docTop(section);
  const bandBottom = docTop(band) + band.offsetHeight;
  const cr = card.getBoundingClientRect();
  const drop = { x: cr.right - (ctx.mobile ? 40 : 72), y: cr.top + window.scrollY + (ctx.mobile ? 44 : 64) };
  // Phones: stay on the left rail past the contact card, then turn in to the form card.
  const pts = [[startX, bandBottom - secTop]];
  if (ctx.mobile) pts.push([startX, cr.top + window.scrollY - secTop - 70]);
  pts.push([drop.x, drop.y - secTop]);
  const { plan, ink } = routePair(svg, verticalPath(pts));
  const leg = new Leg(plan, section, { ink });
  const syA = bandBottom - ctx.F;
  const syB = Math.max(syA + 120, drop.y - ctx.vh * 0.42);
  return {
    name: 'contact',
    endY: syB,
    update(sy) {
      if (sy < syA) {
        leg.draw(0);
        return null;
      }
      const t = range(sy, syA, syB);
      leg.draw(t);
      if (t >= 1 || secTop - sy > ctx.vh * 2) return null;
      const p = leg.at(t);
      return { pose: { x: p.x, y: secTop - sy + p.y, scale: ctx.scale, tilt: tiltFrom(p.angle) }, s: { ...FINAL, shrink: smooth(range(t, 0.78, 1)) } };
    },
  };
}
