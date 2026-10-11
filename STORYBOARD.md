# Storyboard: "One Envelope"
**Story in one line:** a single data record resolves into a document. It gets prepared, cleaned, printed, folded, sealed, and stamped. Its message also leaves as a text and an email, and the envelope travels a drawn route down the page until it drops into the right mailbox at the right house.

All copy is Renkim's own (see `content.json`). The envelope, route, and illustrations carry the story, and **no new claims or stats** appear anywhere. Scroll ranges are for a 1440×900 desktop (1vh = 9px). The total is ≈ 1,880vh ≈ 17,000px, in line with the Aevion drone site (16k) and roughly half of United Carriers (27–32k).

* * *
## Route map (desktop)
```
 ┌──────────────────────────────────────────────────────────────┐
 │ ▌Renkim has experienced a cybersecurity incident. Click here…│  incident banner (static, first in DOM)
 │ [logo]  What We Do  Who We Are  Who We Help  Resources [Contact]│  header → compact sticky after hero
 ├──────────────────────────────────────────────────────────────┤
 │ 01 HERO        H1 + CTAs (left)        ░data record░ (right) │  record → sheet
 │                                           ╲                  │
 │ 02 WHO WE HELP ═══ blue band ═══  pills ─┼─ pills            │  route enters band, fans to 9 destinations
 │                                           │                  │
 │ 03 PRODUCTION  [pinned 500vh]  index │ ▣ prep ▸ ▣ scan ▸ ▣ print ▸ ▣ insert │
 │ 04 FORK                                    ✉ ──┬─▶ 📱 text + email          │
 │                                                │                           │
 │ 05 DIFFERENT   value ◀── ● station ──▶ value   │  stamped, sorted, routed  │
 │                value ◀── ●          ──▶ value   │                           │
 │                value ◀── ●          ──▶ value   │                           │
 │ 06 EMPLOYEE    ▢ photo: full-bleed → 34px card ✉ (envelope rests on corner) │
 │ 07 DATA SVCS   [pinned 240vh]  list │  ⌂12 ╌╌✕   ⌂48 ◀── rerouted          │
 │ 08 DELIVERY    [pinned 100vh]                 ⌂48 ▣ mailbox ⚑            │
 │    CONTACT + FORM · CERTIFICATIONS · FOOTER   (route ends, page settles) │
 └──────────────────────────────────────────────────────────────┘
```

**Envelope states** (instant swaps at stage boundaries, United Carriers style): `data` → `paper` → `cleaned` → `printed` → `folded` → `sealed` → `stamped` → `delivered`.

* * *
## Per-section table
| # | Section (live heading, in original order) | Scroll range | What the envelope does | Text that appears (verbatim) | Technique | Reduced-motion fallback | Mobile adaptation (390px) |
|---|---|---|---|---|---|---|---|
| 0 | **Incident banner + header** | static | Not present. | "Renkim has experienced a cybersecurity incident. **Click here** for more information." Full mega menu: What We Do · Who We Are · Who We Help · Resources · Contact, plus the Schedule A Call side tab. | Plain HTML. The banner is never animated, hidden, or dismissible. The header turns compact and sticky after the hero (Apple local-nav pattern). | Identical. | Banner wraps to 2 lines. The menu becomes a full-screen drawer with the same 4 groups. Contact stays visible in the bar. |
| 1 | **Hero:** "Quality Print and Mail, Text, and Email Solutions" | 0–100vh | **`data`:** on load, a record card assembles on the right as a grid of abstract field bars, staggered over 1.2s. As you scroll, the grid collapses row by row into the lines of a letter-sized sheet (**`paper`**), and the route starts drawing from its bottom edge. | H1, "... by a 100% employee owned business", **Contact us** + **Services**. The CTAs are visible on the first frame and never animated. | H1: SplitText words resolve in random order, then one 60ms flicker (Cerebrium "signal lock"). It starts at opacity 0.15, so it stays the LCP candidate. Record → sheet is a scrubbed SVG morph. The route uses `stroke-dashoffset` scrubbed by ScrollTrigger. | Static h1. A still of the record beside the sheet with an arrow between them. The route is drawn complete. | H1 + CTAs fill the first screen. The record sits below the CTAs at 70% width, and the fold scrubs over 60vh. |
| 2 | **Who We Help:** "Renkim Is the Go-To Solution for All of Your *Print and Mail, Text, and Email* Needs" | 100–240vh | The sheet rides the route into the blue band (the "ground becomes the section" move from United Carriers). As it passes, **9 branch lines fan out** to the industries like routing options, and each pill's green check draws when its branch arrives. The sheet continues straight down the center. | H2 (accent words in green, as live). Automotive · Class Action / Data Breach · Financial · Government / Municipality · Healthcare · Mortgage · Receivables Management · Telecom / Internet · Utility. All are real links. | The band enters as a rounded sheet (21px radius). Pills sit in two columns flanking the route (5 left, 4 right). Branches use staggered `stroke-dashoffset` scrubs, and checks use CSS stroke draws. | A 3×3 pill grid as live, branches drawn complete, checks shown. | Pills form a single-column list. The spine runs down the left gutter, and each pill gets a short horizontal tick from it. |
| 3 | **"On-Demand Color *Printing* Solutions"**, with **The People / The Processes / The Technology** | 240–640vh, **pinned** (left: heading + index; right: production line) | Rides a conveyor through an isometric production line, an original SVG reinterpretation of the existing printer illustration, redrawn in brand palette. **3a People (240–330):** the sheet passes a prep station with three small figures. **3b Processes (330–450): `cleaned`.** A scan gate sweeps the address block, a dashed line becomes solid, and HUD chips **USPS CASS · DPV · NCOA** attach by leader lines (Aevion HUD). **3c Technology (450–640): `printed` → `folded` → `sealed`.** An inkjet head sweeps and ink blocks print in blue, deep blue, and green. The sheet tri-folds, slides into an envelope on the inserter, and the flap seals. | H2 with a hand-drawn underline on "Printing" (the live `js-annotate` signature). A sticky index where the active item is ink and the others are muted (Cerebrium scroll-spy). All three bodies are verbatim. People copy fills word by word, grey → ink. **Scroll-counted moment:** a large counter climbs **0 → 30,000,000**, locked to print progress. The sentence "…capacity to print and insert over 30 million documents a month." remains real body text. The big numerals are `aria-hidden`. | GSAP pin + one scrubbed master timeline with labels. Envelope state swaps use `autoAlpha` with duration 0. The counter is a scrubbed tween writing `toLocaleString()` to a `tabular-nums` span. The fold uses CSS 3D `rotateX` on two panels. | The index becomes three stacked blocks, each with its still: prep station, scan gate with chips, printed sheet + sealed envelope. The counter is not shown. The sentence carries the fact. | No horizontal pin. A **sticky vignette** (top 45vh) shows the active machine while the three text blocks scroll under it. The counter sits inside the vignette. Each block holds about 120vh. |
| 4 | **Digital fork** (no live heading; a visual interstitial inside the same pin) | 640–740vh (end of pin) | **At the seal**, a chat bubble and an email card peel off the envelope and fly along two short branch paths (MotionPath) to an isometric phone. They land as a text bubble and an email notification on its screen. **The envelope continues down the main route.** Print + Digital in one image. | Only existing labels: **Text Message** → /digital-services/text-message/ and **Email** → /digital-services/email/ (from the mega menu), placed on the two branches. | MotionPathPlugin on the two bubbles with `autoRotate: false`. The phone screen updates with a zero-duration swap on arrival. | A still of the envelope with the phone beside it and both bubbles on screen. Same two links. | A phone vignette. The bubbles travel a short 30vh arc, and the links sit under the phone. |
| 5 | **"What Makes *Renkim* Different"**: six values | 740–1080vh | **`stamped`:** a postage stamp lands on the envelope with a small settle at entry. The envelope drops into a sorting tray, then rides a **mail-route line** (dashed center line, generic carrier route, no USPS marks) down the page. Six stations alternate left and right. **Each value reveals as the envelope passes its station** (United Carriers' content orbiting the object). | H2 (accent "Renkim"). Six cards, deduped and typo-fixed: We Value Integrity · Communication · Teamwork · Quality · Empathy · Respect, each with verbatim body. | Not pinned, natural scroll. Card reveals use scrubbed `x: ±80 → 0, y: 60 → 0` with ease `cubic-bezier(.25,.1,.25,1)`. Station dots fill green as the envelope passes. MotionPath keeps the envelope's viewport Y near 45% (Aevion "held object"). | A 3×2 card grid as live, with a stamped-envelope still beside the heading. | Single-column cards. Stations sit on the left spine, and the envelope icon (28px) hops between stations. |
| 6 | **"We Are A *100% Employee Owned* Business"** | 1080–1220vh | **Rests.** The envelope slows and parks on the top-right corner of the photo card like a note. This is the warm beat and the people get the stage. | H2 with a hand-drawn underline on "100% Employee Owned". "We value our Renkim employees as they are the success and backbone of our company." **About Us** · **Careers**. | Apple full-bleed → card: the existing warehouse photo with the live blue overlay scales from 100vw to the 34px-radius card (`clip-path: inset()` scrub, no layout shift). The underline is an SVG stroke draw. | The card in its final state with the envelope still on its corner. | Scale 0.94 → 1 only, at full width. The envelope sits above the card. |
| 7 | **"Need to update your mailing or phone information? We can help you"**: data services + "Request a *Renkim demo* today" | 1220–1460vh, **pinned** | Arrives above an isometric neighborhood. The route first points to **house 12** (old address, dashed outline). The address line on the envelope **scrambles and resolves** from "12" to "48" (Cerebrium scramble). The old path fades to a grey dash and **the route redraws to house 48** in solid blue. This is the visible correction. | H2, body, and the five services. Each one ticks green in step: **USPS CASS, DPV, NCOA 18 and 48 Months** (route recomputes) → **Address Element Correction (AEC)** (address line repaired) → **Bankruptcy and Deceased** (a suppression check passes) → **Phone Append** (a phone glyph attaches to the label, echoing the fork) → **Return Mail Processing** (the old dashed path shows a return arrow, closed). Then "Request a Renkim demo today / ... fill out the form below", which links to the form. | GSAP pin + scrubbed timeline. Text scramble is rAF, runs once at its label, and is decorative (`aria-hidden`). The real list is plain HTML. Route redraw uses `stroke-dashoffset`. | A still with both routes, the old one dashed and the new one solid. The list is shown with checks. | Sticky neighborhood vignette with the list scrolling under it. Two houses instead of three. |
| 8 | **Delivery** → Contact, form, Certifications, footer | 1460–1560vh pinned, then natural scroll to 1,880vh | **`delivered`:** the envelope reaches house 48's mailbox. The door opens, the envelope slides in, the door closes, and the **flag rises in green**. The route completes and the top progress bar (the live site's green bar, repurposed) hits 100%. The object exits the story and the page settles. | Contact: "Get in touch with us any way that works for you" + body. Email info@renkim.com · Phone (734) 374-8300 · Fax (734) 374-0168 · Address 13333 Allen Rd. Southgate, MI 48195. "Or fill out the form, and we'll be in touch". Form card: "Ready to Talk With *Renkim* Today?" / "... fill out the form below to get started". Then "We Have the *Certifications* to Get the Job Done *Right*" + body + **Compliance**, and the full footer. | Short pin for the mailbox drop. After that the content is static and calm (Apple restraint), and the form is never animated. | A still of the mailbox with the flag up. Everything below is identical. | A mailbox vignette of about 60vh. The form is single-column with 48px touch targets. |

* * *
## Form (Stage 8)
This uses the **same five fields as the live, visible form** (the LeadConnector widget in "Ready to Talk With Renkim Today?"): `First Name, Last Name*` · `Organization*` · `Phone*` · `Email*` · `Your Message...` · **Submit**. Fields get real `<label>` elements (the live form relies on placeholders only), along with `autocomplete` attributes and inline error text. `action` is empty, with a `// TODO(endpoint)` in `src/form.js`, and nothing is sent anywhere.
## Motion system rules
- **One moving hero object.** Everything else either holds still or reveals once. There is no parallax on decorative elements.
  
- **Text waits for the object.** Copy for a stage animates in only after the envelope reaches its station, and no text ever moves while you read it.
  
- **Static-first HTML.** The reduced-motion and no-JS page is the default markup, and the motion layer adds the `.is-animated` class on top. If GSAP or Lenis fails to load, the page is still complete.
  
- **Lazy by stage.** GSAP, ScrollTrigger, and Lenis load after first paint. Each stage's SVG and timeline init through `IntersectionObserver` (rootMargin 50%). Offscreen ambient loops (printer idle, flag) pause.
  
- **Desktop vs. mobile are separate timelines** (`gsap.matchMedia()` at 768px), not one squashed version. Touch uses native scroll (no Lenis), `scrub: true`, and CSS `position: sticky` vignettes instead of GSAP pins, which avoids iOS address-bar jank.
  
## Performance plan (budget: LCP < 2.5s on throttled mid-tier mobile, CLS < 0.1, 60fps desktop)
- **The LCP element is the h1 text.** Plus Jakarta Sans is self-hosted as a subset variable woff2, preloaded, with a `size-adjust` fallback face so the swap causes no layout shift.
  
- The hero SVG is inline and small (< 15 KB). There are no hero raster images. The wave-lines PNG becomes a lazy CSS background or is dropped.
  
- JS on the critical path is about 0 KB. After first paint, GSAP core + ScrollTrigger + MotionPath + SplitText + Lenis load at roughly 60 KB gz.
  
- Only `transform` and `opacity` are animated, plus `stroke-dashoffset` on a handful of paths. `will-change` is set only while a stage is active.
  
- All images below the hero use `loading="lazy"` with explicit `width`/`height`. The warehouse photo becomes responsive AVIF/WebP via `<picture>`.
  

* * *
## Open questions (my default in **bold**; say the word to change any of them)
1. **Incident banner behavior.** **In normal flow as the first element of the page: always rendered, never animated, never dismissible, and it scrolls away like any content above the header.** The alternative is to make it part of the sticky header so it stays visible always, at the cost of about 40px of permanent height on mobile. _(Note: on the live site this banner is currently_ `display:none` _at every breakpoint.)_
  
2. **"Phone Return Mail Processing"** in the live data-services list looks like a merge typo. **Render as "Return Mail Processing"** (matches the mega menu and your brief), or keep it verbatim.
  
3. **Two demo forms exist live.** One is visible (LeadConnector: Name, Organization, Phone, Email, Message) and one is hidden (Breakdance: Name, Company, Email, Phone, Message, under "Request a Renkim demo today"). **Ship one form with the visible form's fields.** The "Request a Renkim demo today" heading in Stage 7 then becomes a link that jumps to it.
  
4. **Data record art:** **abstract field bars, no names, addresses, or account numbers**, even fake ones. Given the incident notice and a compliance audience, a page full of mock PII reads badly.
  
5. **Printer illustration:** **reinterpret as original isometric SVG** in brand palette, so paper can physically feed through it. The original PNG uses orange and yellow, which are off-palette. The alternative is to reuse the PNG as-is and animate the sheet over it.
  
6. **Transport:** **route line + sorting tray only** (keeps one hero object). The alternative is to load the envelope into a generic mail truck for Stage 5, which brings a second object on stage.
  
7. **Footer credit** "Made with ♥ by Aelieve": **keep it** until you say otherwise, since it's existing content.
  
8. **Live-site link bugs** carried forward as fixes: phone `tel:7323748300` becomes `tel:+17343748300`, the fax link to breakdance.com becomes **plain text**, and the `href="#"` address links become **plain** `<address>`.

## Client decisions after the build (2026-10-11)

These replace the defaults above where they differ:

- **Q1, incident banner:** removed. It stays hidden, as on the live site.
- **Q2, data-services item:** keep the live wording, "Phone Return Mail Processing".
- **Q7, footer credit:** "Made with ♥ by Aelieve" removed.
- **Chat widget:** stays out.
