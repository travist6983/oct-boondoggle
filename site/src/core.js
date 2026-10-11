import { initNav } from './nav.js';
import { initForm } from './form.js';

const root = document.documentElement;

// Shared boot for every page. `loadMotion` returns the page's motion module (dynamic import),
// which is optional and loads after the page is usable (never on the LCP path).
export function boot(loadMotion) {
  initNav();
  initForm();
  initHeaderState();
  initAnnotate();
  initReveal();
  initStaticProgress();
  initInPageFocus();
  markCurrentPage();
  if (loadMotion && root.classList.contains('motion-ok')) startMotion(loadMotion);
}

function startMotion(loadMotion) {
  const start = () =>
    loadMotion()
      .then((m) => m.init())
      .catch((err) => {
        console.error('[renkim] motion layer failed, falling back to the static page', err);
        fallbackToStatic();
      });
  // Start well after load so the motion chunk never sits on the LCP path (the largest paint can
  // land a little after the load event when it is below-hero text, as on Careers).
  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
  const later = () => setTimeout(() => idle(start, { timeout: 1200 }), 500);
  if (document.readyState === 'complete') later();
  else window.addEventListener('load', later, { once: true });

  // Watchdog: if motion never comes up, show the static layout rather than tall empty stages.
  setTimeout(() => {
    if (!root.classList.contains('is-live')) fallbackToStatic();
  }, 12000);

  const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
  rm.addEventListener?.('change', (e) => e.matches && location.reload());
}

// aria-current on header/footer links that point at this page.
function markCurrentPage() {
  const here = location.pathname.replace(/index\.html$/, '');
  document.querySelectorAll('.site-header a[href], .site-footer a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (href.startsWith('/') && !href.includes('#') && href === here && here !== '/') a.setAttribute('aria-current', 'page');
  });
}

function fallbackToStatic() {
  root.classList.remove('motion-ok', 'is-live');
  root.classList.add('motion-reduce');
}

// Header: compact border once scrolled. On inner pages the header sits on the blue page hero
// (white logo and links, as live) until the hero has scrolled under it.
function initHeaderState() {
  const header = document.getElementById('site-header');
  const hero = document.querySelector('.page-hero');
  let last = null, lastOver = null;
  const update = () => {
    const on = window.scrollY > 40;
    if (on !== last) header.classList.toggle('is-scrolled', (last = on));
    // measured live: the hero's height can change after first paint (font swap, wrapping chips)
    const over = !!hero && hero.getBoundingClientRect().bottom > header.offsetHeight;
    if (over !== lastOver) header.classList.toggle('is-over-hero', (lastOver = over));
  };
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

// Draw the hand-drawn underlines once they are on screen.
function initAnnotate() {
  const els = document.querySelectorAll('.annotate');
  if (!('IntersectionObserver' in window) || root.classList.contains('motion-reduce')) {
    els.forEach((el) => el.classList.add('is-drawn'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-drawn');
        io.unobserve(e.target);
      }
    }),
    { rootMargin: '0px 0px -25% 0px' },
  );
  els.forEach((el) => io.observe(el));
}

// One-shot fade-up for [data-reveal] (CSS only hides them under .motion-ok).
function initReveal() {
  const els = [...document.querySelectorAll('[data-reveal]')];
  if (!els.length) return;
  els.forEach((el) => el.style.setProperty('--ri', [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal')).indexOf(el) % 3));
  if (!('IntersectionObserver' in window) || root.classList.contains('motion-reduce')) {
    els.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    }),
    { rootMargin: '0px 0px -12% 0px' },
  );
  els.forEach((el) => io.observe(el));
}

// Page progress for the static page; the motion layer replaces it with route progress.
function initStaticProgress() {
  const bar = document.querySelector('.progress__bar');
  let ticking = false;
  const update = () => {
    ticking = false;
    if (root.classList.contains('is-live')) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
}

// In-page links (skip link, "Request a Renkim demo today") move keyboard focus to their target,
// not just the scroll position (smooth scrolling alone would leave focus behind).
function initInPageFocus() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href').length < 2) return;
    const target = document.getElementById(a.getAttribute('href').slice(1));
    if (!target) return;
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    setTimeout(() => target.focus({ preventScroll: true }), root.classList.contains('is-live') ? 900 : 0);
  });
}
