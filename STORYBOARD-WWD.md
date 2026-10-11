# Storyboard: What We Do pages

This covers 18 pages: 3 category pages, the 14 services in the What We Do menu, and Renkim 360, which every Ancillary page links as a sibling. The four Portal pages stay as links to renkim.com.

These pages extend the "One Envelope" system. As on every other page:
- The envelope is the page's one hero object, and it rides one continuous route through the page.
- Copy is the live copy, verbatim.
- The palette is the live palette.
- The page works fully as static HTML first, and motion is an enhancement.

The client decisions from 2026-10-11 apply here too: no incident banner, no Aelieve credit, no chat widget.

## Shared template (already built)

| Piece | Where | Notes |
|---|---|---|
| Hero | each page | The live blue band, with the H1 word lock-in. Sibling chips are local links, and the current page is highlighted. The envelope rests under the chips. |
| Sidebar | `src/partials/wwd-sidebar.html` | "Industries We Serve" (9 links to `/industries-served/#…`) and the "Ready to get started?" CTA card. Sticky on desktop; on smaller screens it sits below the article. |
| Article | `.wwd-article` | The live copy verbatim. The first heading gets `id="article-title"`. Typography and check lists come from `wwd.css`. |
| Lab | `.wwd-lab` | The page's signature illustration, scroll-scrubbed, with the envelope performing the service. One per page. |
| Route | `src/motion/pages/wwd-common.js` | `startWwd(buildLab)`: the envelope rests in the hero, rides the gutter between sidebar and article, enters the lab, returns, crosses the employee band, and ends fanning out to the nine industry pills. |
| Bands | partials | 100% Employee Owned with Careers. The photo is per family: Print uses the cottonbro shelves photo, Digital and Ancillary use the cottonbro tablet photo. Then "Renkim Is the Go-To Solution …" with nine pills (homepage component), then "Our core Renkim Values" (6 cards, one-shot reveal). |
| Navigation | header partial | "What We Do" now links to `/services/` (as Who We Are / Who We Help do), with a separate submenu toggle. Every built page is linked locally; Portal links stay on renkim.com. |

**Lab contract.** `buildLab(ctx, api)` returns a stage `{ update(sy) → { pose, s } | null }`.
- `api` is `{ lab, gx, gs, lead, state, docTop }`.
- Use `lead(sy)`, the envelope's document y, instead of `scrollY + F`.
- While the lead is inside the lab's span, the lab owns the envelope.
- When the lead leaves that span, hand the envelope back at `(gx, lead)` at gutter scale `gs`, so the gutter route continues without a jump.

## Pages and their labs

### Print & Mail (family `print`)

| Page | Live content | Lab: the envelope does the service |
|---|---|---|
| `/print-mail/` | Rows for Print Document Solutions, Certified Mail Solutions, and MICR Check Printing Solutions ("MCIR" typo fixed). Each row has copy and Learn More; the first two have photos. | **The print line.** One sheet passes three stations: printed in full color, sealed into a certified envelope, a check gets its MICR line. Each row's Learn More pulses as its station completes. |
| `/print-mail/print-document/` | Print Document Services, Letter Inserting Services, Production Team | **Press → inserter.** An inkjet head prints a full-color statement. A counter shows the live capacity copy (only numbers that appear in the copy). The sheet tri-folds and the inserter pushes it into the envelope. |
| `/print-mail/certified-mail/` | live article | **Certified.** The envelope gets the green certified label and a tracking barcode, then passes tracking checkpoints. Checkpoint labels are taken only from the copy. It ends with "proof of delivery" (a signature line). |
| `/print-mail/micr-check-printing/` | live article | **MICR.** A check prints. The MICR line is drawn as E-13B-style glyph shapes (not real account data) in magnetic ink, then a reader head sweeps it and every glyph verifies green. |

### Digital (family `digital`)

| Page | Live content | Lab |
|---|---|---|
| `/digital-services/` | Rows for Email, Text Message, Payment Processing, and Electronic Bill Presentment. The last two are Portal pages, so they keep the live hrefs. | **Paper → screens.** The envelope opens and its letter becomes an email card, an SMS bubble, a payment button, and a bill on a screen as you pass each row. |
| `/digital-services/email/` | The hero's long H1 and intro. 01 Renkim eBlast, 02 Renkim eNotice, 03 Renkim PDF Attachment, each with The Approach, The Benefit, and How it works. No sidebar or bands on live. | **Three ways out of one envelope.** The live flat icons are redrawn as SVG in the same style. eBlast: the envelope lands in an inbox. eNotice: a link opens, a lock clicks, an interactive document appears. PDF Attachment: a locked PDF clips onto the email. |
| `/digital-services/text-message/` | Long H1 and intro. 01 Renkim SMS, 02 Secure MMS Texting, 03 New MMS Direct Statement. The live page has a duplicated block mislabeled "01. Renkim eBlast", which is dropped. | **On the screen.** A phone sits in a sticky frame. SMS: an alert bubble with a link. Secure MMS: a password field unlocks the statement link. Direct Statement: the statement image appears inside the message, with zero clicks. |

### Ancillary, addresses and contact data (family `anc-a`)

| Page | Lab |
|---|---|
| `/ancillary-services/` | The 11 live rows: 9 services, Renkim 360, and Renkim Reporting (Portal). "Litigous" is fixed. One record card travels the rows, and each service leaves its mark on it. |
| AEC | An address on the envelope corrects element by element: the street suffix, the directional, the unit, then ZIP+4. These are fictional abstract placeholders, not real people. |
| USPS CASS, DPV, NCOA | Three checks run in turn. CASS standardizes the address, DPV confirms it is deliverable (green house), and NCOA moves it, forwarding the route to the new house. |
| Vacant Address Search | A street of houses. The envelope approaches one house, it is flagged vacant, and the route reroutes. |
| Return Mail Processing | The envelope comes back marked "Return to sender", is scanned, the record is updated, and it goes out again. |
| Phone Search | A contact card is missing its phone. A search runs and the phone number fills in with a check. The number is a fictional pattern such as (555) ···. |

### Ancillary, screening, payments, and archive (family `anc-b`)

| Page | Lab |
|---|---|
| Bankruptcy & Deceased | A stack of records. A screen passes over them, flagged rows are set aside, and only clean records continue into envelopes. Records are abstract bars, with no names. |
| Email Verification | A list of email addresses, shown as abstract bars. Each gets a check or a cross, and only verified ones receive the email card. |
| Litigious Scrub | Records pass a scales-of-justice gate. Flagged records are scrubbed before contact, and the others continue. |
| Lockbox | The live "Flow of Operations" image is rebuilt as an accessible diagram, verbatim from the image. **Receiving:** clients mail to the PO Box, Renkim collects mail, mail is opened and sorted in a secured environment. **Processing:** payments are scanned and deposited electronically to your bank, non-payments are scanned and mailed back. **Reporting:** daily reports confirm daily processing activities, unique IDs track each batch of records. Envelopes flow PO Box → scan → bank → report. The "DEF Utility Company" example is kept verbatim (it is the live copy). |
| Renkim 360 | Documents file into a secure, client-branded portal with 24×7 search, and a 7-year shelf fills, matching the copy's "up to seven years". |

## Rules for every page

- **Copy.** Use the live copy verbatim, from `reference/wwd/<slug>-text.txt` (visible text per section) and `-outline.txt` (structure).
  - Only obvious typos may be fixed: "MCIR", "Litigous", the duplicated eBlast label.
  - List every fix in `content/wwd/<slug>.json` (`typoFixes`).
- **Headings.** One H1 (the hero), H2 for the article title and rows, H3 for subsections.
- **No invented facts.** No new claims, numbers, names, or testimonials. Illustrations use abstract bars and placeholders.
- **Static first.** A complete static page under reduced motion and without JS. Mobile at 390 is first class. All scroll state is a pure function of scrollY. Use CSS sticky, not GSAP pin. Per-frame writes are limited to transform, opacity, and clip-path, through `writer()`.
- **QA.**
  - Mark checkpoints with `data-qa`, then run `qa-page-shots` at 1440, 1024, 390, and reduced.
  - `verify-content` must report nothing missing.
  - `a11y-page` must be clean.
