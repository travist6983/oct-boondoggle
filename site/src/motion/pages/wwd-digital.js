// What We Do · Digital family journeys.
//  /digital-services/              the lab (startWwd): the envelope docks between a laptop and a
//                                  phone, opens, and its letter becomes an email, a text, a payment
//                                  and an electronic bill, one beat at a time.
//  /digital-services/email/        the envelope leaves the hero, lands in a sticky laptop and becomes
//                                  the new email in the inbox; that email then opens as a secure
//                                  eNotice and finally carries a password-protected PDF attachment.
//  /digital-services/text-message/ the same, into a sticky phone: SMS → secure MMS → direct statement.
// Every visual state is a pure function of scrollY.
import { startMotion, journeyOf } from '../runtime.js';
import { Leg, prepRouteSvg, routePair, verticalPath, clamp, range, lerp, smooth } from '../geom.js';
import { docTop, tiltFrom, writer } from '../kit.js';
import { startWwd, WWD_STATE } from './wwd-common.js';

const ENV_W = 88; // the envelope shell's drawn width at scale 1 (envelope.svg)
const f2 = (n) => String(Math.round(n * 100) / 100);
const op = (v) => String(Math.round(clamp(v) * 1000) / 1000);
const backOut = (t) => {
  const c = 1.6, u = clamp(t) - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
};
// Pop: scale up from `from` with a little overshoot, about a pivot (SVG units).
const pivot = (cx, cy, s, dx = 0, dy = 0) => `translate(${f2(cx + dx)} ${f2(cy + dy)}) scale(${f2(s)}) translate(${f2(-cx)} ${f2(-cy)})`;
const popScale = (t, from = 0.6) => (t <= 0 ? from : lerp(from, 1, backOut(t)));
const bezier = (a, c, b, t) => {
  const u = 1 - t;
  return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
};

export function init() {
  const page = document.body.dataset.wwd || '';
  if (page === 'digital-services') startWwd(buildLandingLab);
  else startMotion((ctx) => buildDeviceJourney(ctx, page.endsWith('/email') ? EMAIL : TEXT));
}

// Viewport top of a sticky element: rests at restTop (doc), sticks at stickyTop, leaves with its parent.
const stickyTopV = (restTop, stickyTop, parentBottom, h) => (sy) => Math.min(Math.max(stickyTop, restTop - sy), parentBottom - h - sy);

// ---------------------------------------------------------------------------
// /digital-services/ : the lab
// ---------------------------------------------------------------------------
function buildLandingLab(ctx, { lab, gx, gs, lead }) {
  const w = writer();
  const pin = lab.closest('.dg-labpin');
  const svg = lab.querySelector('svg.dg-svg');
  if (!pin || !svg) return null;
  const q = (s) => svg.querySelector(s);
  const names = ['email', 'sms', 'pay', 'bill'];
  const flies = names.map((n) => q(`.dg-l-fly--${n}`));
  const targets = [q('.dg-l-mail'), q('.dg-l-sms'), q('.dg-l-pay'), q('.dg-l-bill')];
  const ticks = [...lab.querySelectorAll('.dg-lab__ticks li')];
  const rows = [...document.querySelectorAll('.dg-row')];

  const wrapTop = docTop(pin), wrapH = pin.offsetHeight, labH = lab.offsetHeight;
  const topV = stickyTopV(wrapTop, parseFloat(getComputedStyle(lab).top) || 0, wrapTop + wrapH, labH);
  const lr = lab.getBoundingClientRect(), sr = svg.getBoundingClientRect();
  const ox = sr.left, oy = sr.top - lr.top, k = sr.width / 800;
  const toV = (pt, sy) => ({ x: ox + pt.x * k, y: topV(sy) + oy + pt.y * k });
  const DOCK = { x: 540, y: 386 };
  const lap = (x, y) => ({ x: 30 + x * 0.72, y: 70 + y * 0.72 }); // laptop group transform
  const TGT = [lap(133, 99.6), { x: 664, y: 139 }, { x: 670, y: 246 }, lap(320, 195)];
  const envScale = Math.min(1, (84 * k) / ENV_W);
  const BEAT0 = 0.19, BEAT = 0.16, FLY = 0.1;
  const beatAt = (i) => BEAT0 + i * BEAT;

  function scene(p) {
    names.forEach((_, i) => {
      const b = beatAt(i);
      const f = range(p, b, b + FLY);
      const a = DOCK, t = TGT[i];
      const c = { x: (a.x + t.x) / 2, y: Math.min(a.y, t.y) - 80 };
      const pos = bezier(a, c, t, smooth(f));
      w(flies[i], 'transform', `translate(${f2(pos.x)} ${f2(pos.y)}) scale(${f2(lerp(0.45, 1, smooth(f)))})`);
      w(flies[i], 'style:opacity', f > 0 && f < 1 ? '1' : '0');
      const landed = range(p, b + FLY - 0.01, b + FLY + 0.02);
      w(targets[i], 'style:opacity', op(landed));
      const on = p >= b + FLY ? 1 : 0;
      if (ticks[i]) w(ticks[i], 'class', `is-on|${on}`);
      if (rows[i]) w(rows[i], 'class', `is-done|${on}`);
    });
  }

  return {
    name: 'dg-lab',
    update(sy) {
      const ly = lead(sy) - wrapTop;
      const p = clamp(ly / wrapH);
      const tv = topV(sy);
      if (tv < ctx.vh * 1.4 && tv > -labH * 1.4) scene(p);
      if (ly < 0 || ly > wrapH) return null;
      const fv = lead(sy) - sy; // the focus line, in the viewport
      const gut = { x: gx, y: fv };
      const dock = toV(DOCK, sy);
      let pos, scale;
      if (p < 0.1) {
        const e = smooth(range(p, 0, 0.1));
        pos = { x: lerp(gut.x, dock.x, e), y: lerp(gut.y, dock.y, e) };
        scale = lerp(gs, envScale, e);
      } else if (p > 0.9) {
        const e = smooth(range(p, 0.9, 1));
        pos = { x: lerp(dock.x, gut.x, e), y: lerp(dock.y, gut.y, e) };
        scale = lerp(envScale, gs, e);
      } else {
        pos = dock;
        scale = envScale;
      }
      const seal = 1 - range(p, 0.12, 0.17) + range(p, 0.84, 0.89);
      return { pose: { x: pos.x, y: pos.y, scale, tilt: 0 }, s: { ...WWD_STATE, seal } };
    },
  };
}

// ---------------------------------------------------------------------------
// Email + Text: hero rest → route → land in the sticky device → three beats
// ---------------------------------------------------------------------------
const EMAIL = {
  vbw: 640,
  target: { x: 133, y: 99.6, w: 46 }, // the new email's envelope icon
  dock: { x: 300, y: 130, w: 96 }, // where the envelope hovers before it settles
  parts: (q) => ({
    inbox: q('.dg-e-inbox'), rows: q('.dg-e-rows'), newrow: q('.dg-e-newrow'),
    bdots: q('.dg-e-bdots'), binfo: q('.dg-e-binfo'),
    notice: q('.dg-e-notice'), www: q('.dg-e-www'), lock: q('.dg-e-lock'), shackle: q('.dg-e-shackle'),
    auth: q('.dg-e-auth'), pins: [...q('.dg-svg').querySelectorAll('.dg-e-pin')], go: q('.dg-e-go'),
    doc: q('.dg-e-doc'), portal: q('.dg-e-portal'),
    pdf: q('.dg-e-pdf'), attach: q('.dg-e-attach'), pdflock: q('.dg-e-pdflock'), pdfshackle: q('.dg-e-pdfshackle'), pdfok: q('.dg-e-pdfok'),
    pass: q('.dg-e-pass'), passdots: [...q('.dg-svg').querySelectorAll('.dg-e-passdot')],
  }),
  // b = [b0, b1, b2], each 0..1
  render(w, e, b) {
    const [b0, b1, b2] = b;
    // 01 eBlast: the rows make room, the envelope settles into the top slot as the new email
    w(e.rows, 'transform', `translate(0 ${f2(58 * smooth(range(b0, 0.02, 0.2)))})`);
    w(e.newrow, 'style:opacity', op(range(b0, 0.2, 0.26)));
    w(e.newrow, 'transform', `translate(0 ${f2(-10 * (1 - smooth(range(b0, 0.2, 0.3))))})`);
    const fadeB = 1 - range(b1, 0, 0.1);
    const td = range(b0, 0.36, 0.5), ti = range(b0, 0.5, 0.64);
    w(e.bdots, 'style:opacity', op(Math.min(range(b0, 0.36, 0.4), fadeB)));
    w(e.bdots, 'transform', pivot(150, 46, popScale(td)));
    w(e.binfo, 'style:opacity', op(Math.min(range(b0, 0.5, 0.54), fadeB)));
    w(e.binfo, 'transform', pivot(508, 70, popScale(ti)));
    // 02 eNotice: the email opens a secure link → authentication → interactive document
    const inOut = smooth(range(b1, 0.02, 0.16));
    w(e.inbox, 'style:opacity', op(1 - range(b1, 0.02, 0.12)));
    w(e.inbox, 'transform', `translate(${f2(-36 * inOut)} 0)`);
    const noticeOut = 1 - range(b2, 0.02, 0.12);
    w(e.notice, 'style:opacity', op(Math.min(range(b1, 0.06, 0.16), noticeOut)));
    w(e.notice, 'transform', `translate(${f2(36 * (1 - smooth(range(b1, 0.06, 0.18))))} 0)`);
    w(e.www, 'style:clipPath', `inset(0 ${f2(100 * (1 - range(b1, 0.16, 0.28)))}% 0 0)`);
    w(e.lock, 'transform', pivot(479, 104, popScale(range(b1, 0.28, 0.38), 0.4)));
    w(e.lock, 'style:opacity', op(range(b1, 0.28, 0.31)));
    w(e.shackle, 'transform', `translate(0 ${f2(-7 * (1 - range(b1, 0.38, 0.44)))})`);
    w(e.auth, 'style:opacity', op(range(b1, 0.4, 0.47)));
    e.pins.forEach((d, j) => w(d, 'style:opacity', op(range(b1, 0.48 + j * 0.035, 0.5 + j * 0.035))));
    w(e.go, 'transform', pivot(320, 256, 1 - 0.06 * Math.sin(Math.PI * range(b1, 0.58, 0.64))));
    const rise = smooth(range(b1, 0.62, 0.8)), drop = smooth(range(b2, 0, 0.14));
    w(e.doc, 'style:opacity', op(Math.min(range(b1, 0.62, 0.68), 1 - range(b2, 0.04, 0.12))));
    w(e.doc, 'transform', `translate(0 ${f2(150 * (1 - rise) + 170 * drop)})`);
    w(e.portal, 'transform', pivot(320, 376, 1 + 0.08 * Math.sin(Math.PI * range(b1, 0.84, 0.96))));
    // 03 PDF Attachment: a password-protected PDF clips onto the email and unlocks
    w(e.pdf, 'style:opacity', op(range(b2, 0.06, 0.16)));
    w(e.pdf, 'transform', `translate(${f2(36 * (1 - smooth(range(b2, 0.06, 0.18))))} 0)`);
    w(e.attach, 'style:opacity', op(range(b2, 0.16, 0.22)));
    w(e.attach, 'transform', `translate(${f2(240 * (1 - smooth(range(b2, 0.16, 0.34))))} 0)`);
    w(e.pass, 'style:opacity', op(Math.min(range(b2, 0.36, 0.4), 1 - range(b2, 0.84, 0.92))));
    w(e.pass, 'transform', pivot(430, 245, popScale(range(b2, 0.36, 0.48), 0.7)));
    e.passdots.forEach((d, j) => w(d, 'style:opacity', op(range(b2, 0.5 + j * 0.07, 0.53 + j * 0.07))));
    w(e.pdfshackle, 'transform', `translate(0 ${f2(-5 * range(b2, 0.74, 0.8))})`);
    w(e.pdflock, 'style:opacity', op(1 - range(b2, 0.82, 0.88)));
    w(e.pdfok, 'style:opacity', op(range(b2, 0.8, 0.83)));
    w(e.pdfok, 'transform', pivot(258, 216, popScale(range(b2, 0.8, 0.92), 0.3)));
  },
};

const TEXT = {
  vbw: 420,
  target: { x: 186, y: 128, w: 52 }, // the SMS bubble
  dock: { x: 210, y: 150, w: 92 },
  parts: (q) => ({
    thread: q('.dg-t-thread'), sms: q('.dg-t-sms'), link: q('.dg-t-link'), pop: q('.dg-t-pop'),
    typing: q('.dg-t-typing'), tdots: [...q('.dg-svg').querySelectorAll('.dg-t-tdot')],
    mms: q('.dg-t-mms'), lock: q('.dg-t-lock'), shackle: q('.dg-t-shackle'), pins: [...q('.dg-svg').querySelectorAll('.dg-t-pin')],
    slink: q('.dg-t-slink'), popdoc: q('.dg-t-popdoc'),
    direct: q('.dg-t-direct'), stmt: q('.dg-t-stmt'), zero: q('.dg-t-zero'),
  }),
  render(w, e, b) {
    const [b0, b1, b2] = b;
    // the thread scrolls up as messages arrive
    const scroll = -46 * smooth(range(b1, 0.26, 0.42)) - 104 * smooth(range(b2, 0.02, 0.2));
    w(e.thread, 'transform', `translate(0 ${f2(scroll)})`);
    // 01 SMS: the envelope becomes the alert; a dynamic link follows
    w(e.sms, 'style:opacity', op(range(b0, 0.2, 0.25)));
    w(e.sms, 'transform', pivot(126, 166, popScale(range(b0, 0.2, 0.36), 0.82)));
    w(e.pop, 'style:opacity', op(Math.min(range(b0, 0.36, 0.4), 1 - range(b1, 0, 0.1))));
    w(e.pop, 'transform', pivot(310, 190, popScale(range(b0, 0.36, 0.54), 0.4)));
    w(e.link, 'style:opacity', op(range(b0, 0.58, 0.66)));
    w(e.link, 'transform', `translate(0 ${f2(10 * (1 - smooth(range(b0, 0.58, 0.7))))})`);
    // 02 Secure MMS: typing… → a locked message; the PIN unlocks the statement link
    w(e.typing, 'style:opacity', op(Math.min(range(b1, 0.06, 0.12), 1 - range(b1, 0.3, 0.36))));
    e.tdots.forEach((d, j) => w(d, 'transform', `translate(0 ${f2(-3 * Math.max(0, Math.sin((b1 * 10 - j * 0.35) * Math.PI)))})`));
    w(e.mms, 'style:opacity', op(range(b1, 0.32, 0.4)));
    w(e.mms, 'transform', pivot(124, 330, popScale(range(b1, 0.32, 0.46), 0.88)));
    w(e.lock, 'transform', pivot(151, 256, popScale(range(b1, 0.4, 0.5), 0.5)));
    e.pins.forEach((d, j) => w(d, 'style:opacity', op(range(b1, 0.5 + j * 0.05, 0.52 + j * 0.05))));
    w(e.shackle, 'transform', `translate(0 ${f2(-6 * range(b1, 0.74, 0.8))})`);
    w(e.slink, 'style:opacity', op(range(b1, 0.8, 0.86)));
    w(e.popdoc, 'style:opacity', op(Math.min(range(b1, 0.84, 0.88), 1 - range(b2, 0, 0.1))));
    w(e.popdoc, 'transform', pivot(352, 280, popScale(range(b1, 0.84, 0.98), 0.4)));
    // 03 Direct statement: the statement itself arrives in the message, zero clicks
    w(e.direct, 'style:opacity', op(range(b2, 0.2, 0.25)));
    w(e.direct, 'transform', pivot(118, 512, popScale(range(b2, 0.2, 0.34), 0.9)));
    w(e.stmt, 'style:opacity', op(range(b2, 0.26, 0.36)));
    w(e.stmt, 'transform', `translate(0 ${f2(8 * (1 - smooth(range(b2, 0.26, 0.4))))})`);
    w(e.zero, 'style:opacity', op(range(b2, 0.5, 0.53)));
    w(e.zero, 'transform', pivot(266, 356, popScale(range(b2, 0.5, 0.64), 0.3)));
  },
};

function buildDeviceJourney(ctx, kind) {
  const w = writer();
  const hero = document.querySelector('.wwd-hero');
  const body = document.querySelector('.dg-body');
  const grid = body.querySelector('.dg-grid');
  const cell = body.querySelector('.dg-stage-cell');
  const stage = cell.querySelector('.dg-stage');
  const svg = stage.querySelector('svg.dg-svg');
  const offers = [...body.querySelectorAll('.dg-offer')];
  const steps = [...stage.querySelectorAll('.dg-stage__steps li')];
  const q = (s) => (s === '.dg-svg' ? svg : svg.querySelector(s));
  const parts = kind.parts(q);
  const stacked = ctx.vw < 1024;

  // Sticky geometry: desktop sticks the stage inside its column; stacked sticks the whole cell.
  const sticky = stacked ? cell : stage;
  const restTop = stacked ? docTop(grid) : docTop(cell);
  const parentBottom = stacked ? docTop(grid) + grid.offsetHeight : docTop(cell) + cell.offsetHeight;
  const sh = sticky.offsetHeight;
  const topV = stickyTopV(restTop, parseFloat(getComputedStyle(sticky).top) || 0, parentBottom, sh);
  const stR = sticky.getBoundingClientRect(), svR = svg.getBoundingClientRect();
  const k = svR.width / kind.vbw;
  const ox = svR.left, oy = svR.top - stR.top;
  const toV = (pt, sy) => ({ x: ox + pt.x * k, y: topV(sy) + oy + pt.y * k });
  const stageCx = ox + svR.width / 2;

  // The envelope's lead: it rests at the hero seam, then eases onto the focus line.
  const heroTop = docTop(hero), heroH = hero.offsetHeight, HW = hero.offsetWidth;
  const restY = heroH - (ctx.mobile ? 30 : 38);
  const restDocY = heroTop + restY;
  const Sh = Math.max(ctx.vh * 0.25, restDocY - ctx.F + ctx.vh * 0.15);
  const lead = (sy) => (sy >= Sh ? sy + ctx.F : lerp(restDocY, Sh + ctx.F, smooth(clamp(sy / Sh))));

  // Route: hero seam → the stage column → down to the top of the device stage.
  const hsvg = hero.querySelector('.route');
  prepRouteSvg(hsvg, HW, heroH);
  // The hero leg spills into the body and ends on the focus line at Sh (scroll-paced, so the
  // sideways move to the stage column is gentle); the body leg takes over from there.
  const hp = routePair(hsvg, verticalPath([[HW / 2, restY], [stageCx, Sh + ctx.F - heroTop]]));
  const heroLeg = new Leg(hp.plan, hero, { ink: hp.ink });
  const bodyTop = docTop(body);
  const bsvg = body.querySelector(':scope > .route');
  prepRouteSvg(bsvg, body.offsetWidth, body.offsetHeight);
  const landDoc = restTop + (stacked ? 10 : 6);
  const bp = routePair(bsvg, `M${f2(stageCx)},0 L${f2(stageCx)},${f2(Math.max(8, landDoc - bodyTop))}`);
  const bodyLeg = new Leg(bp.plan, body, { ink: bp.ink }).buildYTable();

  // Landing window: from the first scroll where the lead reaches the stage top.
  const maxS = document.documentElement.scrollHeight - ctx.vh;
  let lo = 0, hi = Math.max(1, maxS);
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (lead(m) >= landDoc) hi = m; else lo = m; }
  // If the stage top is already above the lead when the hero leg ends, land from the hero's end.
  const sA = Math.max(hi, Sh), sB = sA + ctx.vh * (stacked ? 0.22 : 0.3);
  const fromDoc = hi < Sh ? Sh + ctx.F : landDoc;

  // Beats, from the offerings' positions (each card's top crossing the activation line).
  const act = stacked ? (parseFloat(getComputedStyle(cell).top) || 0) + sh + ctx.vh * 0.08 : ctx.vh * 0.58;
  const beats = offers.map((o) => {
    const t = docTop(o), h = o.offsetHeight;
    return { a: t - act, span: Math.max(ctx.vh * 0.3, Math.min(h * 0.82, ctx.vh * (stacked ? 0.5 : 0.7))) };
  });
  if (beats[0].a < sB) {
    const end = beats[0].a + beats[0].span;
    beats[0].a = sB;
    beats[0].span = Math.max(ctx.vh * 0.3, end - sB);
  }
  for (let i = 1; i < beats.length; i++) beats[i].a = Math.max(beats[i].a, beats[i - 1].a + beats[i - 1].span * 0.7);
  const endY = beats[beats.length - 1].a + beats[beats.length - 1].span;

  const envDock = (kind.dock.w * k) / ENV_W, envTarget = (kind.target.w * k) / ENV_W;
  const gutterScale = ctx.mobile ? ctx.scale : 0.7;
  const heroScale = ctx.mobile ? 0.5 : 0.7;

  const stageStage = {
    name: 'dg-device',
    update(sy) {
      // device scene (pure function of scroll)
      const b = beats.map((x) => range(sy, x.a, x.a + x.span));
      const tv = topV(sy);
      if (tv < ctx.vh * 1.3 && tv > -sh * 1.3) kind.render(w, parts, b);
      let cur = -1;
      beats.forEach((x, i) => { if (sy >= x.a) cur = i; });
      steps.forEach((s, i) => w(s, 'class', `is-on|${i === cur ? 1 : 0}`));

      const ld = lead(sy);
      // 1 · hero leg
      if (sy <= Sh) {
        const t = smooth(clamp(sy / Sh));
        heroLeg.draw(t);
        bodyLeg.draw(0);
        const p = heroLeg.at(t);
        return { pose: { x: p.x, y: heroTop - sy + p.y, scale: lerp(heroScale, gutterScale, t), tilt: t > 0.01 && t < 0.99 ? tiltFrom(p.angle) * 0.5 : 0 }, s: WWD_STATE };
      }
      heroLeg.draw(1);
      // 2 · body leg down to the stage
      const by = ld - bodyTop;
      if (sy < sA) {
        const t = bodyLeg.tAtY(by);
        bodyLeg.draw(t);
        const p = bodyLeg.at(t);
        return { pose: { x: p.x, y: bodyTop - sy + p.y, scale: gutterScale, tilt: 0 }, s: WWD_STATE };
      }
      bodyLeg.draw(1);
      // 3 · landing: from the stage top into the device, then settle into the first message
      const b0 = b[0];
      const settle = smooth(range(b0, 0.06, 0.22));
      if (settle >= 1) return { pose: null };
      const from = { x: stageCx, y: fromDoc - sy };
      const dock = toV(kind.dock, sy), target = toV(kind.target, sy);
      const l = smooth(range(sy, sA, sB));
      let x = lerp(from.x, dock.x, l), y = lerp(from.y, dock.y, l);
      let scale = lerp(gutterScale, envDock, l);
      x = lerp(x, target.x, settle);
      y = lerp(y, target.y, settle);
      scale = lerp(scale, envTarget, settle);
      return { pose: { x, y, scale, tilt: 0 }, s: WWD_STATE };
    },
  };
  return journeyOf([stageStage], Math.max(1, endY));
}
