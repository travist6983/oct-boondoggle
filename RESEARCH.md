# Research: scroll-story techniques for the Renkim homepage

Recon date: 2026-10-10. Each site was scrolled top to bottom in Chrome at 1440px, inspected with DevTools-style probes (loaded libraries, canvases, sticky/pinned elements, `ScrollTrigger` configs in the shipped bundles), and captured at intervals. Interval frames are saved in `research/screenshots/` (`<site>-NN.jpg`). Notes describe techniques only. Nothing visual is copied, and nothing is hotlinked.

---

## 1. United Carriers (unitedcarriers.com): primary reference

**Stack:** Webflow shell + a custom Vite bundle (`united-carriers.netlify.app/main.js`) with chunks for GSAP, ScrollTrigger, Lenis, Barba (page transitions), Three.js (`OceanScene`, `WakeSimulation`, `globe`) and a `frame-sequence` canvas player. Page height ≈ 27,000–32,000px at 1440×900.

**The story:** a globe hero ("every leg of the journey"), then one shipping container is lifted by a crane, set on a truck, driven off, seen from above on a road, handed to a container ship, and sailed down the page. The container is the hero object. Its "vehicle" changes, but the container never leaves the screen.

| # | Technique | How it's built | Renkim mapping |
|---|---|---|---|
| 1 | **One object, many vehicles (handoff at boundaries)** | Each chapter is a tall section (`top+=100vh` … `top+=450vh`) with a sticky inner stage. Several `gsap.timeline({ scrollTrigger: { scrub } })` instances are keyed to vh offsets. At a boundary, a static `<img>` (clip-path inset to the object) swaps to a canvas sequence with `autoAlpha` tweens of `duration: 0`, so the object never jumps. | **The envelope's state changes** (data → paper → printed → folded → sealed → stamped → delivered) are instant, zero-duration swaps at exact scroll positions. The silhouette stays continuous while the "vehicle" changes: data grid, printer, inserter, route, truck, mailbox. |
| 2 | **The ground becomes the next section** | The black road band under the truck grows (`--scale-factor`, `y: -100vh`) into the dark Services section. The camera then flips to top-down, so the road becomes a **vertical spine** with content on both sides, and it bends at a T-junction to route into the next block. | **The single SVG route path is the spine of the page.** It runs between columns, bends at section boundaries, and turns into the mail route in the transport stage. The blue Industries band is entered *by the path*, not by a hard section edge. |
| 3 | **Content orbiting the object** | In the ship chapter, benefits ("One point of contact", "Compliance you can trust"…) sit radially around the moving ship. Each one has its own scrubbed timeline: `fromTo({ x: even ? -100 : 100, y: 100 }, { x: 0, y: 0 })` with a custom ease `cubic-bezier(.25,.1,.25,1)` ("cinematicSmooth"). | **What Makes Renkim Different:** the six values sit at stations along the route, alternating left and right. Each one reveals as the envelope passes it. |
| 4 | **Count-up stats** | Elements marked `[data-count]` tween from 0 with `toLocaleString()`, triggered once at `top 85%`. | **"over 30 million documents a month"**: Renkim's counter is *scrubbed* to print-stage progress, so the number climbs as pages come off the printer. The full sentence stays as real text. |
| 5 | **Separate desktop and mobile choreography** | `animationScrubDesktop()` and `animationScrubMobile()` are different timelines, not a squashed copy. The Three.js ocean is disabled under 767px via `matchMedia`. Heavy scenes mount lazily through `IntersectionObserver` (`rootMargin: 150px`) with a preload delay. Desktop uses `scrub: 1` (smoothed) and touch uses `scrub: true`. | **Mobile is its own journey:** a left-gutter spine with short sticky vignettes (see Storyboard). Every stage below the hero inits lazily. |

Also noted: a scroll-progress ring on the cursor driven by `gsap.ticker` (`strokeDashoffset`), lazily loaded `<video data-src>`, and pre-rendered AVIF frame sequences (windowed, concurrency 6, `skipOdd` on mobile). **Not adopted:** frame sequences cost megabytes and would break the LCP and CLS budget on mid-tier mobile. SVG states give the same continuity in a few KB.

---

## 2. Aevion drone (drone.riotters.com): scroll-scrubbed object storytelling and pacing

**Stack:** Next.js (Turbopack) + Three.js r183 + Lenis, Tailwind, Payload CMS (from its own colophon). One fixed full-viewport WebGL canvas. Content videos are lazy and *not* scroll-scrubbed. Page height ≈ 16,000px.

| # | Technique | How it's built | Renkim mapping |
|---|---|---|---|
| 1 | **Persistent stage, object never leaves** | The drone model lives in one fixed canvas behind the DOM. Each section sets a camera/pose target, and scroll progress interpolates between them. Text scrolls over a stable object. | **The envelope sits on a top layer.** Its viewport Y is held at about 40–55% of the viewport through the whole journey. The route is shaped so the envelope looks "held" while the world scrolls past. |
| 2 | **Long holds, little text** | Single poses are held for 2–3 viewports with only one line of copy. The object gets room to breathe between dense blocks. | Pacing: dense stages (Industries, Values) alternate with breathers (fold, seal, fork, delivery) that show one moment and little copy. |
| 3 | **HUD callouts anchored to the object** | A thin radial ring and leader lines frame the drone, with a row of technical stats ("5 returns", "±2 cm", "450 m") tied to its position. | **Address-cleaning moment:** CASS / DPV / NCOA check chips attach to the envelope's address block with leader lines, like an inspection HUD. |
| 4 | **The tether line** | A 1px vertical line runs from the top of the viewport to the object, so it reads as connected to the page. | The **drawn route** trails behind the envelope. The stroke draws with scroll, so the user sees the path already travelled. |
| 5 | **Word-by-word grey → ink fill** | Sentences start at low opacity, and each word fills to ink as scroll advances. Giant chapter words ("Gear", "Capabilities") sit on hairline rules as section markers. | Used **once**, on the People copy ("Our people have been in the print and email solution business since 1982…"), as the human beat of the production stage. Chapter numerals (01–08) on hairlines mark stages without adding new words. |

---

## 3. Cerebrium (cerebrium.ai): typography motion, reveals, small-interaction polish

**Stack:** Astro islands, with each behavior a custom element (`c-split-title`, Rail, InteractiveDots, HeroHome). Lenis, GSAP + SplitText, and a lazily imported Three.js background (1.2 MB chunk, loaded after first paint). Type is Suisse Int'l / Suisse Int'l Mono / ABC Favorit.

| # | Technique | How it's built | Renkim mapping |
|---|---|---|---|
| 1 | **"Signal lock" headline reveal** | `SplitText` splits into words with masks. An `IntersectionObserver` fires once. Words fade in **in random order** (`stagger: { each: 0.032, from: "random" }`), then the whole line does one quick flicker (`opacity → .1 → 1`, 60ms). | **Hero h1**: words resolve the way a data record resolves, with a single flicker as it "locks". It runs once on load, under 700ms, and the text is real and readable from the first frame (opacity starts at 0.15, never 0, to protect LCP). |
| 2 | **Text scramble on labels** | rAF-driven character scramble on mono uppercase eyebrow labels as they enter. | **Address correction:** the wrong address line scrambles and resolves into the corrected one at the NCOA moment (Stage 7). Used nowhere else. |
| 3 | **Sticky scroll-spy index** | A left column lists features ("2–4s Cold Starts / Elastic GPU Scaling / …"). The active item goes to ink and the others stay muted while the right column scrolls media. | **The People / The Processes / The Technology** become a sticky index beside the production line. The live accordion's three panels are all in the DOM and all readable. No click is needed to see the copy. |
| 4 | **Visibility-gated loops** | The Rail marquee only runs while intersecting and clones its pattern to fill the width. A lerped cursor uses `gsap.quickSetter` + ticker (lerp 0.2), and a press-and-hold progress ring uses `strokeDashoffset`. | **Performance hygiene:** every ambient loop (printer head idle, mailbox flag) pauses offscreen. The live site's **green scroll-progress bar** returns as a route-progress bar. |
| 5 | **Dark → light sheet transition** | A content "sheet" with large rounded top corners rises over the hero canvas. | Section transitions use the live site's own 21px/34px radii (`--rk-radius-card`, `--rk-radius-photo`). The Industries band and the employee photo card enter as rounded sheets, not hard edges. |

---

## 4. Apple (apple.com + iPhone 18 Pro page): pinning, scrubbed sequences, restraint

**Observed:** the product page is about 67,000px tall with 14 videos (`muted`, `playsinline`, `preload="none"`, started by JS only when in view), 9 play/pause controls, 6 `prefers-reduced-motion` rule blocks, and a sticky local-nav pill (product name + Buy) after the hero. The homepage is a calm stack of full-width tiles with one headline, one line, and two buttons each.

| # | Technique | How it's built | Renkim mapping |
|---|---|---|---|
| 1 | **One idea per viewport** | Each viewport has a single short headline ("Pro further.", "Make it cinematic.") and one paragraph with exactly **one bolded phrase**. The object gets the stage and the text waits until the object settles. | Each stage shows **one Renkim heading plus its verbatim copy**, and nothing more. Text animates in only *after* the envelope reaches its station. Nothing competes with the envelope while it moves. |
| 2 | **Pinned, scrubbed product sequences** | A pinned section holds the device while scroll scrubs rotation and close-ups. The headline sits below or beside it, never on top of the object. | **Production stage (On-Demand Color Printing)** is pinned. Scroll scrubs print → fold → insert → seal. The heading and index sit in the left column, and the machine line has the right. |
| 3 | **Full-bleed → card scale** | Media enters full-bleed and settles into a rounded card as you scroll ("Our finest unibody of work"). | **100% Employee Owned:** the existing warehouse photo opens full-bleed and settles into the live site's 34px-radius card with its blue overlay. This is the warm beat. |
| 4 | **Sticky local nav** | After the hero, a compact pill keeps the product name and the primary action in reach. | **Compact sticky header** after the hero, with the Contact CTA kept in reach. The incident banner stays the first thing on the page (see Storyboard Q1). |
| 5 | **Motion is optional** | Videos have play/pause. Reduced-motion rules swap sequences for stills, and all copy stays. | **Full static fallback:** each stage shows its envelope state as a still illustration, all text is present, the route is drawn complete, and the counter shows its final value. |

---

## What we're deliberately *not* borrowing

- **Frame sequences / video scrubbing** (UC, Apple): too heavy for a 2.5s mobile LCP. SVG state swaps carry the continuity instead.
- **Full WebGL scenes** (Drone, UC ocean, Cerebrium ribbons): no stage needs real depth. Isometric SVG matches the existing printer illustration and stays crisp, light, and accessible. Three.js is not in the build plan.
- **Custom cursors and hold-to-reveal** (Cerebrium, UC): fun, but they don't serve a compliance-minded buyer and they don't exist on touch.
- **Barba page transitions**: single-page prototype, so not applicable.

## Library decisions carried into the build

- **GSAP 3 + ScrollTrigger + MotionPathPlugin** (all free under the current GSAP license), plus **SplitText** for the hero h1. DrawSVG behavior comes from plain `stroke-dashoffset`, so no extra plugin.
- **Lenis** for desktop smooth scroll, driven from `gsap.ticker` (UC and Cerebrium both do this). It is disabled on touch and under reduced motion.
- **Vite + vanilla JS.** Astro's islands (Cerebrium) would help a multi-page site. For one page, Vite plus a few native custom elements gets the same lazy-init benefit with less tooling.
