# QA report: Renkim "One Envelope" (Home, Services, About Us, Industries Served, What We Do × 18, Resources × 4)

Tested 2026-10-10 and re-verified 2026-10-11 (after the client content decisions below) against the production build (`npm run build && npm run preview`, `http://localhost:4173/`) in Google Chrome. All QA tooling is in `site/scripts/` and can be re-run (see README).

## Site-wide scorecard (final build, all 26 pages)

| Check | Result |
|---|---|
| Lighthouse mobile (4× CPU, slow 4G) | **Performance 100, Accessibility 100, Best Practices 100, SEO 100 on all 26 pages.** LCP **1.43–1.58 s**, CLS 0, TBT 0 ms |
| Lighthouse desktop | **100 / 100 / 100 / 100 on all 26 pages.** LCP 0.34–0.38 s |
| Local links (`links-local.mjs`) | 1,990 local links (55 distinct) across 26 pages, **0 problems** |
| Keyboard / structure (`a11y-page.mjs`, 1440 and 390) | Clean on every page |

Reports are in `qa/lighthouse/all/<page>-{mobile,desktop}.report.html`. The per-section numbers below were measured as each section was built; the table above is the final pass.

## Client decisions (2026-10-11)

- **Incident banner:** removed. It stays hidden, as on the live site. This reverses the brief's hard rule 3, at the client's direction.
- **Data-services item:** uses the live wording, "Phone Return Mail Processing". The mega menu keeps its own live label, "Return Mail Processing".
- **"Made with ♥ by Aelieve" credit:** removed from the footer.
- **LeadConnector chat widget:** stays out.

After these changes the Lighthouse runs, link and content checks, keyboard pass, screenshots, and recordings were all re-run. Results below are current.

## Budget scorecard

| Budget | Target | Result | Status |
|---|---|---|---|
| LCP, throttled mid-tier mobile | < 2.5 s | **1.8 s** (Lighthouse mobile: 4× CPU, 150 ms RTT, 1.6 Mbps; re-measured 2026-10-11 after the four-page refactor, was 1.7 s). LCP element is the hero `<h1>` | ✅ |
| LCP, desktop | n/a | **0.5 s** | ✅ |
| CLS | < 0.1 | **0** on mobile and desktop | ✅ |
| Total blocking time | n/a | **0 ms** on mobile and desktop | ✅ |
| Desktop scroll | steady 60 fps | **60.0 fps avg, p99 16.8 ms, 0 frames > 20 ms, 0 long tasks** (1440×900, full-page wheel scroll with Lenis) | ✅ |
| Desktop scroll, 4× CPU | stress | 59.9 fps, 2 of 1,017 frames > 20 ms, 0 long tasks | ✅ |
| Mobile-width scroll, 4× CPU | stress | 59.9 fps, 2 of 1,141 frames > 33 ms, 0 long tasks (390×844) | ✅ |
| Lighthouse scores (mobile / desktop) | n/a | Performance **99 / 100** · Accessibility **100 / 100** · Best Practices **100 / 100** · SEO **100 / 100** | ✅ |

**Weight:** HTML 93 KB (22 KB gz, mostly the inline SVG illustrations), CSS 8.0 KB gz (shared sheet), entry JS 2.4 KB gz. The motion layer is **66 KB gz** (GSAP + ScrollTrigger + MotionPathPlugin + Lenis + journey code). It loads only after `load` + idle, and never under reduced motion. Font: one self-hosted Plus Jakarta Sans variable woff2 (27 KB), preloaded, with a metric-matched fallback face.

**Evidence:** `qa/lighthouse/{mobile,desktop}.report.html`. Performance traces are in `qa/perf/*.json.gz`; gunzip one and open it in Chrome DevTools via Performance › Load profile. Trace hotspots per frame at 1× CPU: Layout max 0.4 ms, Paint max 0.3 ms, rAF callback max 8 ms (one-off at init).

## Inner pages: Services, About Us, Industries Served (2026-10-11)

These were built from `STORYBOARD-PAGES.md` on the homepage's system, using the same tokens, envelope, route engine, and static-first rules. All numbers below come from the production build (`npm run build && npm run preview`).

### Scorecard

| Budget | Target | Services | About Us | Industries Served |
|---|---|---|---|---|
| LCP, Lighthouse mobile (4× CPU, slow 4G) | < 2.5 s | **2.0 s** | **1.9 s** | **1.8 s** |
| LCP, desktop | n/a | 0.4 s | 0.5 s | 0.4 s |
| CLS (mobile / desktop) | < 0.1 | 0 / 0 | 0 / 0 | 0.003 / 0 |
| TBT | n/a | 0 ms | 0 ms | 0 ms |
| Lighthouse mobile: Perf / A11y / BP / SEO | n/a | 99 / 100 / 100 / 100 | 99 / 100 / 100 / 100 | 99 / 100 / 100 / 100 |
| Lighthouse desktop: Perf / A11y / BP / SEO | n/a | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
| Scroll 1440, 1× CPU | 60 fps | 60.0 fps, 0 frames > 20 ms | 60.0 fps, 0 frames > 20 ms | 60.0 fps, 0 frames > 20 ms |
| Scroll 1440, 4× CPU | stress | 59.9 fps, 1 frame > 20 ms | 59.9 fps, 1 frame > 20 ms | 59.9 fps, 1 frame > 20 ms |
| Scroll 390, 4× CPU | stress | 59.7 fps, 2 frames > 20 ms | 59.8 fps, 2 frames > 20 ms | 59.9 fps, 2 frames > 20 ms |
| Long tasks while scrolling | 0 | 0 | 0 | 0 |

The homepage re-measured after the shared refactor: mobile LCP **1.8 s** (Perf 99), desktop 0.5 s (100), CLS 0, all other categories 100.

**CSS is split per page.** Each page loads the shared sheet (8.0 KB gz) plus its own page sheet:
- Services: 3.4 KB gz
- About Us: 3.0 KB gz
- Industries Served: 2.4 KB gz

The motion chunk is shared (GSAP + Lenis + stages, 65.8 KB gz). The page journey modules are 2.6–3.8 KB gz, and they never load under reduced motion.

**Evidence:**
- Lighthouse reports: `qa/lighthouse/<page>-{mobile,desktop}.report.html`
- Performance traces: `qa/perf/<page>-<w>-cpu<n>.json.gz`

### Storyboard vs. build

| Page | Section | Built | Screens |
|---|---|---|---|
| Services | Hero | Blue page hero with "Services" and the contact chips (phone, email, fax, location). A blank sheet rests on the seam and drops along the route into the stage. | `services/*/00-top` |
| Services | What We Do Here At Renkim (pinned, 3 stations) | Index with scroll-spy (Print & Mail / Digital / Ancillary Services), and each button jumps to its station and moves focus. The panel copy stays pinned while a sticky stage pans across three stations. **Print & Mail:** an inkjet head prints the live photo, the body lines, and a MICR line; the sheet folds into the envelope, which seals and gets the green badge. **Digital:** a browser loads the live photo, an email card flies into a notification, and a text bubble lands on a phone. **Ancillary:** a scan line sweeps the office photo's 3×3 grid and the 9 cells check off. Link pills tick green in sync with each event; "View All" never ticks. | `services/*/01*–04*` |
| Services | 100% Employee Owned → contact | Clip-path settle (shared `employeeStage`), then the envelope drops into the "Ready to Talk With Renkim Today?" form card. | `services/*/05–06` |
| About Us | Leadership (`#leadership`) | Real ARIA tabs (roving tabindex, arrows, Home/End). Each bio is a letter in a blue Renkim envelope pocket: on a tab change, the letter slides down into the pocket and the next slides out. Initials monograms only (the live site has no headshots). Without JS all nine bios are listed. | `about-us/*/01` |
| About Us | History (`#history`) | The route is the timeline spine, and nodes turn green as the envelope reaches them. Vignettes are scrubbed by scroll: "Rena" + "Kim" merge into "RenKim 1982"; one share splits into 12 wedges (0→100%) and employee figures appear; the route branches and compliance shields light; a 0→40+ year counter runs and an envelope stack builds. | `about-us/*/02–05` |
| About Us | Core Values (`#values`) | Each card receives a postal cancellation ("RENKIM" ring and waves) as the envelope passes its row. | `about-us/*/07–08` |
| About Us | Community wall | The 10 live photos drop like postcards onto a table, once and staggered, with no parallax. Descriptive alt text. | `about-us/*/09` |
| Industries Served | Route map | A sticky sidebar "transit map": the envelope rides the line by reading progress, passed stops turn green, and the current stop has `aria-current`. Stop links scroll to the article, set the hash, and move focus. The CTA card ("Ready to get started?") sits under it. Below 1024 px it becomes a sticky chip strip under the header. | `industries-served/*/01` |
| Industries Served | Nine industries (`#automotive` … `#utility`) | Live dual headings with the hand-drawn underline. Lists render as check lists that tick in. Each photo opens out of an envelope's address window, and an industry glyph postmark stamps into the corner. | `industries-served/*/02–06` |

### Deviations (inner pages, intentional)

1. **Services copy column.** On desktop it scrolls with the panel text pinned, instead of crossfading in one frame. Below 1024 px the stage sticks on top and the copy flows underneath, so the long Ancillary panel is never cut off.
2. **Services tick order.** MICR Check Printing ticks before Certified Mail, because the MICR line prints on the sheet before the envelope seals.
3. **About history layout.** Drawings on the left, route in a centre lane, cards on the right, rather than alternating sides, so the route runs straight from Leadership through History.
4. **About leadership on desktop.** The first letter is already out at load (the section is above the fold) instead of animating out.
5. **Industries route map.** The page's one envelope becomes the map rider (no separate mini envelope).
6. **Industries photos.** Cropped to 16:10. The portrait Government photo is positioned to keep the dome.
7. **Hero chips (Services, Industries).** Same link fixes as the homepage:
   - Phone: `tel:+17343748300` (live: `tel:73437483000`, an extra digit).
   - Fax: plain text (live: `fax:` scheme).
   - Maps: the same destination with only `daddr=` (live: about 600 characters of session parameters).

### Content and links

- `verify-content.mjs` against each page's `content/<page>.json`:

  | Page | Link targets | Label + link pairs | Plain-text items | Strings |
  |---|---|---|---|---|
  | Services | 21/21 | 23/23 | 3/3 | 35/35 |
  | About Us | 6/6 | 8/8 | n/a | 82/82 |
  | Industries Served | 15/15 | 18/18 | 1/1 | 58/58 |
  | Home | 49/49 | 88/88 | 8/8 | 74/74 |

  Results: `qa/content-verification-*.json`.
- **Independent cross-check:** every text string in the live page body (from `reference/renkim-<page>-outline.txt`) is present on the built page: Services 84/84, About Us 131/131, Industries Served 112/112.
- **Typo fixes:** "derek Blue" → "Derek Blue" and "derek Vertin" → "Derek Vertin" (About Us panel headings; the live tab labels are already capitalized). No other copy changes.
- **Local links** (`links-local.mjs`): 144 local links (33 distinct) across the four pages all resolve, including every `#fragment` (`/about-us/#leadership|#history|#values`, `/industries-served/#automotive` … `#utility`). Results: `qa/links-local.json`.
- **Homepage link changes in this round:**
  - Header, footer, hero "Services", and the employee band "About Us" now point at the local pages.
  - The nine industry pills and the footer's Who We Help links go to their section anchors (`/industries-served/#automotive` …). Live, they all point to the page top except Telecom.

### Accessibility (all four pages, 1440 and 390)

`a11y-page.mjs` → `qa/a11y-<page>-<w>.json`. A full keyboard tab walk on each page found:
- Every stop has a visible focus ring, is on screen, and is never hidden under the sticky header. Stop counts per page: 75 / 80 / 55 / 62 at 1440, and 66 / 71 / 46 / 53 at 390.
- One H1 per page, with no skipped heading levels.
- No duplicate ids, no broken in-page anchors, no images without alt, and no unnamed links or buttons.

Lighthouse caught one issue, which is fixed: `role="tabpanel"` isn't allowed on `<article>`, so the leadership panels are now `<div>`s.

### Reduced motion and no-JS (inner pages)

- With reduced motion (`qa/screenshots/<page>/reduced-{1440,390}`), each page is complete and static:
  - Services shows three stacked panels with photos, all pills checked, and a sealed envelope still.
  - About Us shows the finished vignettes and instant tab swaps.
  - Industries Served shows all photos, postmarks, and checks, with the map and strip as plain anchor lists.
- With JavaScript disabled in Chrome on the production build, every heading, paragraph, list item, and image on all four pages is visible. The only hidden elements are the JS-driven step index buttons and the form's error messages.

### Shared fixes made while building the inner pages

- **Hand-drawn underlines** rendered as broken segments in Chrome on every page, including the homepage's "100% Employee Owned". `vector-effect: non-scaling-stroke` combined with the `pathLength` dash was the cause; it was removed in `main.css`.
- **Header over the blue hero** takes the hero's deep blue once the page scrolls, so the title and chips never show through a transparent header.
- **Mobile route rail** moved from x = 20 to 24, and the mobile envelope scale from 0.5 to 0.44. The envelope is no longer clipped at the screen edge on the employee band (homepage included).
- **Phones:** `scroll-padding-bottom: 88px` keeps focused links clear of the floating "Schedule A Call" pill on every page.

## What We Do pages (18), 2026-10-11

Pages built from `STORYBOARD-WWD.md`:
- **Print & Mail:** `/print-mail/`, Print Document, Certified Mail, MICR Check Printing.
- **Digital:** `/digital-services/`, Email, Text Message.
- **Ancillary:** `/ancillary-services/`, AEC, USPS CASS/DPV/NCOA, Vacant Address Search, Return Mail Processing, Phone Search, Bankruptcy & Deceased, Email Verification, Litigious Scrub, Lockbox, Renkim 360.

The four Portal pages stay links to renkim.com. The header's **What We Do** now links to `/services/` and has a separate submenu toggle, matching Who We Are and Who We Help. This is verified by keyboard (Enter opens the menu, Escape closes it and returns focus) and in the mobile drawer.

### Scorecard (production build)

| Check | Result |
|---|---|
| Lighthouse mobile | Performance **99–100**, Accessibility / Best Practices / SEO **100** on all 18. **LCP 1.7–2.0 s**, CLS 0, TBT 0 ms |
| Lighthouse desktop | **100 / 100 / 100 / 100** on all 18. LCP 0.4–0.5 s |
| Live copy cross-check | **555 / 555** visible live lines present across the 18 pages (`reference/wwd/<slug>-text.txt` vs the built pages) |
| `verify-content.mjs` | Nothing missing on any page. Results: `qa/content/*.json` |
| `a11y-page.mjs` (1440 and 390) | **36 / 36 clean**: every focus ring visible, nothing off screen or under the header, one H1, no skipped levels, no duplicate ids, no broken anchors, no missing alts, no unnamed controls. Results: `qa/a11y/*.json` |
| Screenshots (1440, 1024, 390, reduced 1440, reduced 390) | **90 runs, 0 console errors.** Saved in `qa/screenshots/wwd/<page>/` |
| Local links (`links-local.mjs`, all 22 pages) | **1,552 local links (51 distinct), 0 problems.** Every `#fragment` exists |
| Envelope continuity (6 px scroll steps) | Largest move ≤ 53 px per step on every page (homepage: 50) |
| Frame pacing at 4× CPU | 59.0–59.8 fps, at most 2 frames > 20 ms per page |

Evidence: `qa/lighthouse/wwd/<page>-{mobile,desktop}.report.html`.

### Content decisions and fixes

- **Hidden live case studies left out.** Every Ancillary page, and the Certified Mail and MICR pages, carry an "Example of … Service" case study with a fictional client (XYZ Law Firm, ABC Bank, DEF Utility Company, …). On renkim.com these are `display:none` at every breakpoint. They are kept in the content JSON (`hiddenOnLive`) but not rendered. **Client decision needed** if they should be shown.
- **Typos fixed:** "MCIR" → "MICR" (Print & Mail landing) and "Litigous Scrub" → "Litigious Scrub" (Ancillary chips). On Text Message, a duplicated block mislabeled "01. Renkim eBlast" was dropped; it was a hidden responsive copy.
- **Link fixes:**
  - Payment Processing and Electronic Bill Presentment "Learn More" go to `/portal/…`. The live `/digital-services/…` hrefs redirect to the homepage.
  - The Renkim Reporting row goes to `/portal/renkim-reporting/`. The live `/ancillary-services/renkim-reporting/` also redirects to the homepage.
  - Renkim 360's phone link is now `tel:+17343748300`; the live link is `tel: 7343748300`.
- **Renkim 360** is built too. It isn't in the menu, but every Ancillary page links it as a sibling.
- **Lockbox:** the live "Flow of Operations" image is rebuilt as an accessible diagram and animation, verbatim. Its numbering is kept as live (1, 2, 3, 5, 6, 7, 8); **the live image skips step 4**, which is worth confirming with Renkim.

### Shared polish from this round (affects every What We Do page)

- **Core values section.** The homepage's alternating values layout (overlapping cards, −36 px) leaked into the What We Do values grid; it is now scoped to the homepage. The section has its own design:
  - The envelope comes down from the industries band and flows around the heading.
  - On tablet and up it rides a centre lane between two columns; on phones it rides a left rail.
  - Each card gets a "RENKIM" postmark and a station dot as the envelope passes.
  - The route ends with the envelope shrinking into a seal that turns into a green check.
  - The static and reduced-motion page shows the postmarks and the sealed check.
- **Hero hand-off.** The envelope leaves the hero on a scroll-paced leg that spills into the body. If a lab near the top already holds the envelope, the leg ends exactly where that lab will have it, so there is no sideways dash.
- **Turn into the employee band.** It is split across the body's bottom padding and the band's top padding (also on Industries Served).
- **Labs keep what they earned.** Labs can pass on a `stateAfter` (badges, phone mark, green window) that the envelope keeps through the bands.
- **Header over the blue hero.** It is now measured live, so tall heroes (the 11 Ancillary chips) no longer flip the header to white early.
- **Rail room below 1024 px.** One shared rule in `wwd.css` replaces the four per-family copies.

### Known issues (What We Do)

- **Phones, pinned labs:** the labs are about 358 px wide, so small labels inside them (timeline steps, counters) render at roughly 9–10 px. There is deliberate empty runway under a pinned lab while its scene plays.
- **MICR glyphs:** they are abstract E-13B-style shapes and read a little like block letters.
- **Email:** the PDF password field overhangs the laptop bezel, as in the live icon.

## Resources pages (4), 2026-10-11

Pages: `/compliance/`, `/on-the-road/`, `/in-the-community/`, `/careers/`. They are deliberately slim, with no third-party integrations.

| Page | Live content | Built |
|---|---|---|
| Compliance | Hero with contact chips; certifications with a second paragraph ("Since 2011 …") and a Services button; employee band (About us); "Questions about our compliance or certifications?" with Contact and the demo form | All of it, verbatim. The form is the shared demo form (same LeadConnector widget 07LpuJ7IJcHZgH91U4ie live) |
| On the Road | Hero with sibling chips + an **Elfsight LinkedIn feed** widget | Hero + a plain **"Renkim on LinkedIn"** card linking to the company page. No embed, no third-party script |
| In the Community | Hero + Elfsight LinkedIn feed; "Renkim Philanthropy" (9 organizations with logo and Learn more link); the 10-photo wall | LinkedIn card, all 9 organizations (logos from the live page; links to their sites), and the photo wall |
| Careers | Hero with contact chips; "Interested in working with us at Renkim?" with channels; the "Apply today at Renkim!" form (LeadConnector UbGgRhsOFSzfr1J6Rv6v: name, organization, phone, email, message, résumé upload); the photo wall | All of it. The application form has the live fields, including a résumé file input. It posts nowhere yet (`TODO(endpoint)` in `src/form.js › submitForm()`, which now handles every form on the site) |

**Motion (slim).** The envelope rests under the hero and, on scroll, glides along one leg into the page's first card, which then takes a green check:
- Compliance: the certifications.
- On the Road and In the Community: the LinkedIn logo.
- Careers: the contact icon.

There is no pinning or lab.

**Content and link notes:**
- **Copy:** every visible live line is present (Compliance 15, On the Road 5, In the Community 17, Careers 14). New UI copy is limited to the LinkedIn card, which replaces the feed widget: the title "Renkim on LinkedIn", one line of description, and the button "View posts on LinkedIn".
- **Hidden posts left out.** The older event posts on On the Road (GFOA 2024, ACA Northwest, Great Lakes, CS Week, ACA Southeast, ACA Fall Forum 2023) and the community posts (Easter Bag Donation, Gleaners Community Food Bank) are `display:none` on live, so they are not rendered. The two LinkedIn links inside those hidden posts are the only live links not carried over.
- **Typo fixed:** "Fordline Elementary in southgate" → "Southgate".
- **Link fixes:**
  - The Compliance hero chips on live link to About Us anchors under contact labels; they are now proper phone, email, and map links.
  - The Compliance "Contact" button pointed to `renkim.com/contact`, which redirects to the homepage; it now goes to `/contact-us/`.

**QA (production build):**
- `a11y-page` at 1440 and 390: clean on all 4. Every focus ring is visible, nothing is under the header, there is one H1, there are no skipped levels, and there are no missing alts.
- `links-local` across all **26 pages: 1,990 local links (55 distinct), 0 problems.**
- Screenshots at 1440 and 390: 0 console errors.

### Site-wide: motion now loads after first paint
The motion layer now starts 500 ms after `load` (+ idle) instead of immediately.

On Careers, the largest paint is text below the hero. It landed a few milliseconds after the motion chunk had started downloading, so Lighthouse's simulation counted that 66 KB chunk in its LCP estimate (2.5 s). With the delay, every page measures LCP ≈ 1.5 s. The envelope simply appears about half a second later.

## Mobile pass (2026-10-11)

**Phone menu (all 26 pages): fixed and redesigned.**
- **The bug.** The drawer collapsed to about 49 px, so the page showed through under "What We Do". The header's `backdrop-filter` makes it the containing block of its fixed-position children, which sized the drawer against the header instead of the viewport. My earlier phone checks never opened the menu, so this was missed until now.
- **The fix.** The drawer has an explicit full-screen height, and the header drops `backdrop-filter` while the menu is open.
- **The redesign** matches the live drawer:
  - a full-screen deep-blue panel, with the header bar turning blue, a white logo, and a white close icon;
  - 64 px rows in white;
  - every chevron in the same 44 px round button, which turns green when open;
  - green section labels and 44 px submenu links;
  - social links and a green Contact button pinned at the bottom.
- **Behaviour.**
  - Opening one section closes the others.
  - The page behind is `inert`, and Tab stays inside the toggle + drawer.
  - Escape closes the drawer and returns focus to the toggle.
  - The toggle's label switches between "Menu" and "Close menu".
  - The floating Schedule A Call pill hides while the drawer is open.
- Verified at 390, 360, and 820 px: every submenu opens and shows all of its links (18 / 4 / 9 / 4).

**Automated phone audit** (`mobile-audit`, every page at 390 × 844 and 360 × 740):
- No horizontal scroll on any page.
- No text under 12 px.
- No console errors.
- The only elements wider than the screen are the intentional sideways scrollers: the About leadership names and the Industries stop strip.

**Fixes from the pass:**
- **Touch targets** are 44 px on phones and tablets: footer links, footer legal links and social icons, sidebar industry links, contact channel links, and the homepage step tabs. The only target under 40 px left is the header logo, at 39 px.
- **Lab labels.** AEC and Phone Search lab labels went from 11 px to 12 px.
- **Ancillary B labs** (Lockbox and the others) no longer bleed off the right edge of the screen.
- **What We Do sibling chips.** Below 1024 px the row fades at its edges, so it reads as a sideways scroller rather than cut-off chips.

After the pass, Lighthouse mobile is still 100 / 100 / 100 / 100 (spot-checked on Home, Careers, and Lockbox; LCP 1.4–1.6 s, CLS 0). The desktop mega menu is unchanged.

**Still open:**
- Pinned labs leave empty space above and below them on phones while their scene plays (they are centred on the focus line).
- The floating Schedule A Call pill covers the bottom-right corner of content as you scroll, the same as live.
- This is device emulation in Chrome; real iOS Safari and Android checks are still to do.

## Public preview on GitHub Pages (2026-10-11)

**Live:** https://travist6983.github.io/oct-boondoggle/. Deployed by `.github/workflows/pages.yml` on every push to `main`.

**The preview build differs from the local build in four ways:**
- It is served under `/oct-boondoggle/`. Every root-relative link, image, `srcset`, font, and icon is rewritten for the sub-path.
- A slim ribbon reads "Concept redesign prototype. This is not the official Renkim website", with a link to renkim.com.
- Pages carry `noindex, nofollow`.
- Share cards: og:image (the homepage hero, ribbon included), og:url, and a large-image Twitter card. Shared titles are prefixed "Concept redesign ·".

GitHub Pages serves a branded 404 page for unknown URLs.

**Checks against the live URL:**
- All 26 pages load with no failed requests and no console errors, the motion layer goes live on every page, and every internal link resolves.
- Lighthouse on the live URL (Home and Certified Mail, mobile and desktop): Performance, Accessibility, and Best Practices are all **100**. Mobile LCP is 1.1–1.3 s (faster than local, on GitHub's CDN), CLS 0, TBT 0. SEO reads 63 only because of the intentional `noindex`.
- The phone drawer fits exactly with the ribbon above the header (top 125 px, bottom at the viewport edge). It is anchored to the header's bottom edge when opened.

**Fixed during deploy:** the CSS minifier dropped the unprefixed `backdrop-filter: none` when both the standard and `-webkit-` forms were written. The header kept its blur when the drawer opened, which made the header the drawer's containing block. The rule now uses only the standard property, and the minifier adds the prefix itself.

## Homepage: storyboard vs. build, stage by stage

Screenshots: `qa/screenshots/{1440,1024,390}/NN-*.jpg` (motion) and `qa/screenshots/reduced-{1440,390}/` (static).

| # | Stage | Storyboard | Built | Screens |
|---|---|---|---|---|
| 0 | Header | Static. Header turns compact and sticky | ✅ The incident banner was removed (client decision 2026-10-11). Header is sticky with a border and shadow once scrolled. Full mega menu matches the live site | `01a` |
| 1 | Hero | Record assembles on load. Grid collapses to a sheet. Route starts | ✅ Record bars and checks materialize in CSS on load (1.2 s). The scroll morph shrinks the card into a sheet, which hands off exactly to the traveling envelope (`paper`). H1 does a random-order word "signal lock" plus one flicker. CTAs are never animated | `01a–01c` |
| 2 | Who We Help | Route enters the blue band and fans 9 branches to the industries, which get checks | ✅ Route passes the heading on the right, then S-curves into the center lane. Branches draw as the envelope passes each pill (5 left, 4 right), and the green checks draw in | `02a–02b` |
| 3 | On-Demand Color Printing (pinned) | People → Processes (clean) → Technology (print, fold, insert, seal) with a 30M counter | ✅ Prep desk with figures, then the scan gate with **USPS CASS · DPV · NCOA** HUD chips (address goes rough → clean), then the inkjet head sweeping as the print reveals and the **counter climbs 0 → 30,000,000**, then the tri-fold, the envelope rising over the letter, and the flap sealing. Sticky index with scroll-spy; index buttons jump to each step | `03a–03g` |
| 4 | Digital fork | At the seal, a text and an email fly to a phone while the envelope continues | ✅ Chat bubble and email card ride MotionPathPlugin paths to the phone screen and land as messages. "Text Message" and "Email" links appear beside the phone. Envelope exits down the route | `04a–04c` |
| 5 | What Makes Renkim Different | Stamped at entry; values reveal by station | ✅ Postage station in the lane: the arm presses and the stamp pops onto the envelope (`stamped`). Six deduped, typo-fixed cards alternate right and left and reveal as the envelope passes each station dot | `05a–05c` |
| 6 | 100% Employee Owned | Full-bleed photo settles into a 34 px card; envelope rests | ✅ Clip-path inset scrub from full-bleed to the card. Hand-drawn underline on "100% Employee Owned". Envelope glides down the right of the photo | `06` |
| 7 | Data services (pinned) | Wrong house → address scrambles → route redraws → five services tick | ✅ Route heads for **house 12**. The address tag strikes, scrambles, and resolves to **48** (tag border turns green). The old route turns grey and dashed with an ✕, and the new route draws to 48. Checks tick in order: CASS/DPV/NCOA → AEC (window outline) → Bankruptcy and Deceased (badge) → Phone Append (phone glyph) → Phone Return Mail Processing (return arrow on the old route) | `07a–07e` |
| 8 | Delivery | Envelope drops into the mailbox; flag up; page settles | ✅ Camera zooms 1.9× on house 48. Mailbox door opens, the envelope shrinks into the slot, the door closes, and the **flag rises green** with a delivered check. The top route-progress bar reaches 100% | `08a–08c` |
| – | Contact, form, certifications, footer | Calm, static | ✅ All channels, the same 5 fields as the live visible form, certifications, and the full footer | `09–11` |

### Deviations from the storyboard (intentional)

1. **Stage 8 shares Stage 7's pin.** Delivery happens in the same neighborhood frame (camera zooms to the mailbox) instead of a second 100vh pin. It reads as one continuous move and saves one sticky handoff. Total pinned length for 7+8 is 440svh.
2. **Page length** at 1440×900 is about 14,900 px (≈1,650vh), not the planned ≈1,880vh. The values and employee stages needed less runway than estimated.
3. **The hero h1 reveal is CSS, not SplitText.** The words are pre-split in the HTML, so the effect starts on first paint and can never delay or invalidate LCP. SplitText isn't shipped.
4. **Mobile production and data stages** use a full-height sticky frame (art in the top ~38svh, copy below), not text scrolling under a vignette. It fits 667 px+ tall phones without overflow.
5. **Address-correction visual** uses a large address tag above the envelope (house number 12 → 48) in addition to the envelope window. The window text alone was too small to read at presentation distance.

## Reduced motion

Tested with Playwright `reducedMotion: 'reduce'` emulation at 1440 and 390 (`qa/screenshots/reduced-*`), and in Chrome with the `?reduced=1` override:

- `motion-reduce` is set before first paint by an inline head script. The motion bundle is **never requested** (verified via the Resource Timing API in Chrome).
- Static, fully readable page. The production stage shows all three panels (People / Processes / Technology) stacked, with the "over 30 million documents a month" sentence. Values use a 3×2 grid. Every illustration shows a still of its stage: printed sheet, sealed envelope, phone with messages, corrected route, and the mailbox with its flag up.
- No CSS animations or transitions (global kill switch plus `@media (prefers-reduced-motion)`). The underline annotations are drawn statically.
- The no-JS path matches: without the head script there's no `motion-ok` class, so the static layout renders.
- Safety net: if the motion layer fails or takes over 12 s, the page drops back to the static layout.

## Links, phones, emails, CTAs (from content.json)

`site/scripts/verify-content.mjs` → `qa/content-verification.json`

- **49 / 49** distinct link targets present (nav, mega menu, dropdowns, hero CTAs, industries, fork links, employee CTAs, contact, compliance, footer, legal, social). The incident notice and Aelieve links were removed by client decision; content.json marks them `omitted`.
- **88 / 88** label + href pairs matched. **8 / 8** intentional plain-text items present (fax, address, data-service list items).
- **74 / 74** headings and body strings present verbatim. Typo fixes per brief: guidelines, highest, NCOA. Dedupe: the values carousel. "Phone Return Mail Processing" uses the live wording.
- Live-site link bugs corrected (approved Q8): phone `tel:7323748300` → `tel:+17343748300`; fax link to breakdance.com → plain text; `href="#"` addresses → `<address>`.

## Accessibility

`site/scripts/a11y-keyboard.mjs` → `qa/keyboard-a11y.json`

- **Tab order:** skip link → logo → What We Do → Who We Are (link + submenu toggle) → Who We Help (link + toggle) → Resources → social → Contact → Schedule A Call → hero CTAs. Every stop shows a visible focus ring (white + deep-blue double ring; green on blue backgrounds).
- **Mega menu:** Enter opens it (`aria-expanded=true`), Tab moves into the links, Escape closes it and returns focus to the trigger, and focus leaving the menu closes it. The mobile drawer and accordions were verified at 390 (`qa/screenshots/390/mobile-menu-open.jpg`).
- **Form:** real `<label>` elements and autocomplete. Submitting empty sets `aria-invalid`, shows four described errors, moves focus to the first invalid field, and posts a status message to a polite live region.
- **In-page links** (skip link, "Request a Renkim demo today") move focus to their target as well as scrolling there.
- **Heading outline** keeps the live order with normalized levels: one H1; H2 sections; H3 for the tabs, values, demo CTA, and form card.
- **Contrast:** inactive tab labels and the word-fill use the brand grey #656263 (5.5:1 on #F7F7F7). Lighthouse a11y is 100.
- All text is real HTML. The illustration SVGs are `aria-hidden`; their few decorative labels (HUD chips, house numbers) duplicate HTML content.

## How Chrome QA was run (and its limits)

- Interactive passes used the Claude-in-Chrome extension against the dev and production servers at 1440 and 1024. The window couldn't be resized narrower than the OS minimum, so **390 was verified with Chrome device emulation** (headless Chrome via Playwright, `isMobile`, DPR 2, touch). That is the same engine, but not a physical phone.
- The extension's tab reported `visibilityState: hidden` while the Chrome window was in the background, which freezes CSS transitions mid-way in its screenshots. For deterministic stage captures I used headless Chrome (`site/scripts/qa-shots.mjs`), which positions the scroll exactly at each storyboard checkpoint.
- Inner pages: `qa-page-shots.mjs` (checkpoints declared in markup with `data-qa`), `a11y-page.mjs`, `links-local.mjs`, and `record-page.mjs`, all against the production preview.
- Lighthouse 12.8.2 (CLI, headless Chrome) for the mobile and desktop presets. Frame pacing and traces came from `site/scripts/perf-scroll.mjs` (real wheel input through Lenis, rAF frame deltas, longtask observer, DevTools trace).

## Remaining issues and follow-ups

**Inner pages (2026-10-11)**
- **Services, Digital station:** the email notification fades in about when the flying card arrives, so both are briefly visible. The MICR line reads a little like a barcode at small sizes.
- **Services on phones:** between stations the copy area under the sticky stage can be briefly empty.
- **Industries, reduced motion at 390:** tabbing to a stop chip that is only partly visible leaves it partly visible (Chrome only scrolls fully hidden items into view). The ring is never fully hidden, which meets WCAG 2.2 "Focus Not Obscured (Minimum)".
- **About Us:** switching leadership tabs changes the section height, so it triggers one route rebuild per click (a short one-off cost).
- **All pages, 1024–1199 px:** the fixed vertical "Schedule A Call" tab can overlap the right-most ~8 px of content (same as live).
- **Lighthouse "properly size images" on Services mobile:** about 13 KB could be saved on the ancillary photo tiles.

**Homepage and shared**

1. **Form endpoint (TODO).** `site/src/form.js › submitForm()` posts nowhere by design. Wire it to the LeadConnector form (`07LpuJ7IJcHZgH91U4ie`) or the CRM, and add spam protection (the live widget uses a hidden honeypot field).
2. **Not tested on Safari, Firefox, or physical iOS/Android.** The sticky frames use `svh` units and `position: sticky`, and touch devices use native scroll without Lenis. Run a device pass before launch (iOS Safari toolbar resize especially).
3. **1024–1279 px:** in the fork frame, the "Text Message / Email" links can sit close to the envelope while it passes. This is cosmetic and resolves as the envelope exits.
4. **Optional performance headroom:** inline the 7.5 KB critical CSS to shave render-blocking time on slow networks. LCP is already 0.8 s under budget.
5. The certifications artwork is the existing PNG of third-party marks (PCI DSS, HIPAA, IRS 1075, AICPA SOC 2), with full alt text. Marks are not redrawn.

## Presentation assets

- `qa/recording/renkim-{services,about-us,industries-served}-1440.mp4` and `-390.mp4`: the desktop and mobile journeys for each inner page.
- `qa/recording/renkim-{services,about-us,industries-served}-highlight.gif`: 3× speed, 720 px.

- `qa/recording/renkim-journey-1440.mp4`: 59 s, 1440×900, 30 fps H.264. The full desktop journey with scripted pacing (slower through the pinned stages).
- `qa/recording/renkim-journey-390.mp4`: 39 s mobile journey (390×844 @2x).
- `qa/recording/renkim-journey-highlight.gif`: 20 s, 3× speed, 720 px. For slides and chat.
