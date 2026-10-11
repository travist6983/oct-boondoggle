# Storyboard: Services, About Us, Industries Served

These pages carry the homepage's "One Envelope" system: the same blue route line, the same envelope as each page's one hero object, the live copy verbatim, the live palette and type, a static page first, and motion as an enhancement.

The hard rules are the homepage brief's, with the client decisions from 2026-10-11:
- No incident banner.
- No Aelieve credit.
- No chat widget.

## What every inner page shares (already built)

| Piece | Where | Notes |
|---|---|---|
| Header + mega menu | `src/partials/chrome.html` | The header sits on the blue page hero with a white logo, white links, and a green Contact button, as on the live site. It turns white once the hero has scrolled under it. Links to the four local pages are local (`/services/`, `/about-us/#leadership`, `/industries-served/#telecom` …). Everything else goes to renkim.com. |
| Page hero | each `*/index.html` | The live blue band (`linear-gradient(0deg, #0076C0, #000ACA)`): centered H1 with the homepage's word-lock reveal, then glass chips. Services and Industries chips are phone, email, fax, and location. About chips are Leadership, Our History, Core Values, and Careers. |
| Envelope layer | `chrome.html` + `src/motion/envelope.js` | One fixed envelope per page, positioned by the page's journey. |
| Motion runtime | `src/motion/runtime.js` | Handles Lenis, the ticker, envelope rendering, the progress bar, and rebuilds. A page supplies `buildJourney(ctx)` and returns `journeyOf(stages, endY)`. |
| Stage helpers | `src/motion/geom.js`, `kit.js`, `stages.js` | `Leg`, `routePair`, `verticalPath`, `keyed`, `stickyPhase`, `writer`. `employeeStage(ctx, entryX, exitX, { section, state })` is reusable. |
| 100% Employee Owned band | each page | Uses the live photo for that page. The CTA is "About us" on Services and "Careers" on About and Industries. Same clip-path settle as the homepage. |
| Contact + form | Services only (`form-card` partial) | The live Services copy differs from the homepage ("With our quality services we are sure to …", "Or fill out the form to the right …"). Kept verbatim. |
| Certifications, footer | partials | Identical on all pages. |

## Services: "One envelope, three channels"

Live order:
1. Hero: "Services" plus 4 contact chips.
2. "What We Do Here At Renkim", three tabs:
   - Print & Mail
   - Digital
   - Ancillary Services
3. 100% Employee Owned band.
4. Contact and form.
5. Certifications.

| # | Section | Static / reduced motion | Motion | Mobile |
|---|---|---|---|---|
| S0 | Hero | Title and chips. A sealed envelope still rests under the chips. | The title locks in and the chips rise. On scroll, the envelope lifts off the hero onto the route and drops into S1. | Same, with smaller chips. |
| S1 | **What We Do Here At Renkim**, pinned for 3 steps | Three stacked panels, each with a heading ("Print & Mail Services" …), the copy, link pills, and the live photo inside its "channel frame". | **The left column** has the H2 (hand-drawn underline on "What We Do"), a tab index with scroll-spy (buttons jump to each step), and the panel copy, which crossfades. Each link pill ticks green as its step happens. **The right column** is the channel stage. One envelope moves through three frames, each with its own reveal language, and the photo is part of the story. See the step list below. | A full-height sticky frame: the art fills the top ~40svh, the copy sits below, and the tab index scrolls horizontally. |
| S2 | 100% Employee Owned | Photo card. | Clip-path settle. The envelope glides down the right side. | Rail on the left. |
| S3 | Contact + form | Static. | Static. | Static. |
| S4 | Certifications, footer | Static. | Static. | Static. |

The S1 steps:
1. **Print & Mail (paper).** A print head sweeps down a sheet and prints the live photo line by line, with a brand-blue ink line. The sheet folds and the envelope seals around it. Pills tick in order: Print Document as it prints, Certified Mail when sealed (a certified badge on the envelope), MICR Check Printing as a MICR line prints along the sheet foot.
2. **Digital (screens).** The envelope opens into an email card and an SMS bubble. They fly to a laptop showing the live photo and to a phone. The pills Email and Text Message tick as each lands.
3. **Ancillary Services (data).** The envelope passes through a scan gate over the live office photo. A scan grid crosses it and the 9 ancillary pills tick one by one, in sync with the scan. "View all" never ticks; it is a link.

## About Us: "Since 1982"

Live order:
1. Hero: "About Us" plus 4 chips.
2. Leadership: 9 tabs with bios.
3. History: 4 milestones.
4. 100% Employee Owned band.
5. Core Values: 6 cards.
6. Certifications.
7. Community photo wall: 10 photos and a LinkedIn link.

| # | Section | Static / reduced motion | Motion | Mobile |
|---|---|---|---|---|
| A1 | **The Renkim Leadership Team** (`#leadership`) | Real ARIA tabs (arrow keys, Home and End). The panel shows name (H3), title, and bio. A monogram badge with the leader's initials in brand colors (the live site has no headshots, so there are none here). With JS off, every bio is listed. | **The bio is a letter in an envelope.** On a tab change, the current letter slides down into the envelope and the new one slides out and unfolds (≈450 ms, transform and opacity only). On scroll-in, the envelope arrives on the route and the first letter slides out. | Names become a horizontal scroll strip and the panel goes full width. |
| A2 | **About Our Extensive Renkim History** (`#history`) | A vertical timeline: 4 milestone cards alternating left and right, each with a small still vignette. | The route *is* the timeline spine, and the envelope rides it, held at the focus line. Each milestone has a vignette that animates as the envelope reaches its node:<br>• **How It Started:** "Rena" + "Kim" letter tiles slide together into "RenKim". This is the copy's own story.<br>• **100% Employee Owned:** one share block splits into many small figures, for "every single share … owned by current Renkim employees".<br>• **Adding More Industries:** the route branches, and compliance shields light up.<br>• **40+ Years of Service:** a "40+" counter climbs from 0, and envelopes stack. | Rail on the left, cards full width, vignettes above each card. |
| A3 | 100% Employee Owned | Photo card with Careers. | Clip-path settle. | Rail. |
| A4 | **Our Core Renkim Values** (`#values`) | A 3×2 grid of cards, each "We Value" + value + copy, with an icon. | As the envelope passes, each card receives a postage cancellation mark: wavy lines stamp in and the icon pops. The order follows the route. | A stacked list on the rail. |
| A5 | Certifications | Static. | Static. | Static. |
| A6 | Community wall | A 5×2 photo mosaic (as live) and the LinkedIn link. | The photos arrive like postcards dropped onto a table: a short staggered translate and rotate that settles flat, triggered once in view. No parallax. | A 2-column mosaic. |

## Industries Served: "One route, nine stops"

Live order:
1. Hero: "Industries Served" plus 4 contact chips.
2. Sidebar with "Industries We Serve" (9 anchor links) and a CTA card ("Ready to get started? Get in touch with Renkim Today! Get Started"), beside 9 industry articles, each with copy, lists, and a photo.
3. 100% Employee Owned band.
4. Certifications.

| # | Section | Static / reduced motion | Motion | Mobile |
|---|---|---|---|---|
| I1 | Sidebar **route map** | A sticky card with the H2 "Industries We Serve", 9 anchor links styled as stops on a vertical line, and the CTA card below. | **The sidebar is a transit map.** A mini envelope rides its line, and its position is your reading progress through the nine articles. Passed stops fill green and the current stop gets `aria-current="true"`. Clicking a stop scrolls to that article. | A sticky horizontal stop strip under the header. The current stop is centered and a progress line fills along it. |
| I2–I10 | The 9 industries (`#automotive`, `#class-action`, `#financial`, `#gov`, `#healthcare`, `#mortgage`, `#receivables`, `#telecom`, `#utility`) | An H2 dual heading with the hand-drawn underline (as live), the copy, the lists as check lists, and the photo. | **Photo through the envelope window.** Each photo starts as a small rounded "address window" and opens to the full card as it scrolls in (clip-path, scrubbed). An industry glyph postmark (car, scales, bank, capitol, medical cross, house, invoice, signal tower, bulb) stamps onto the corner. The list checks tick in as they enter. | Same reveals, smaller postmark. |
| I11 | 100% Employee Owned | Photo card with Careers. | Clip-path settle. | Rail. |
| I12 | Certifications, footer | Static. | Static. | Static. |

## Build contract

**Files per page**

| | Services | About Us | Industries Served |
|---|---|---|---|
| HTML (fill the `<!--@@ … -->` placeholders) | `site/services/index.html` | `site/about-us/index.html` | `site/industries-served/index.html` |
| Page CSS | `site/src/styles/pages/services.css` | `…/about.css` | `…/industries.css` |
| Journey | `site/src/motion/pages/services.js` | `…/about.js` | `…/industries.js` |
| Illustrations (write `src/svg/<page>-*.svg`) | `site/scripts/illustrations/services.mjs` | `…/about.mjs` | `…/industries.mjs` |
| Content for verification | `content/services.json` | `content/about-us.json` | `content/industries-served.json` |

Images are already generated in `site/public/img/pages/`. Run `node scripts/images.mjs` to see the list: `svc-*`, `band-*`, `ind-*`, and `gal-01…10`, each in `-<w>.avif|webp|jpg`.

**Copy**
- Copy is verbatim from `reference/renkim-<page>-outline.txt`.
- Only obvious typos may be fixed (for example "derek Blue" → "Derek Blue"), and every fix is listed in the page's content JSON.
- Normalize heading levels: one H1, H2 per section, H3 for items.

**QA**
- Mark storyboard checkpoints with `data-qa`. `site/scripts/qa-page-shots.mjs` captures them at 1440, 1024, and 390, and under `reduce`.
- `site/scripts/verify-content.mjs` checks the copy.

**Performance**
- The hero is static HTML and CSS, and the LCP element is the H1.
- Images below the fold use `loading="lazy"` with explicit width and height.
- Per-frame work is limited to transform, opacity, and clip-path, written through `writer()`.
