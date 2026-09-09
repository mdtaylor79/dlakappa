# DLA Committee Report Generator

Denton–Lewisville (TX) Alumni Chapter · Kappa Alpha Psi Fraternity, Inc.

Two ways to produce the chapter's four-box committee report slide — **Committee Actions**,
**Celebrations**, **Ask of the Members**, **30 – 60 – 90 Days** — so every committee's slide
comes out identical and the meeting deck assembles itself.

---

## 1. The web builder (for committee chairs)

`committee-report-builder.html` — one self-contained file. The chapter seal and the footer
icon strip are embedded in it, so there is nothing to upload alongside it. Drop it anywhere
that serves static files and hand chairs the URL:

```
dlakappa.org repo → /committee-report/index.html
                  → https://dlakappa.org/committee-report/
```

It works the same opened straight off a laptop by double-clicking, if you would rather email
the file than host it. The PowerPoint writer and the image capture are built into the file, so
nothing loads from a CDN and every export works with no internet connection at all — the same
page is also published privately on claude.ai if you prefer a link to a host.

A chair opens it, types into the four boxes, watches the slide build itself, and downloads
what they need:

| Button | What it gives you |
| --- | --- |
| **Download PowerPoint** | A one-slide `.pptx` of that committee's report |
| **Download image** | A PNG of the slide — good for GroupMe or the chapter feed |
| **Print / Save PDF** | The slide at 13.333 × 7.5 in, no margins |
| **Save report file** | A `.json` to email to the Keeper of Records |

The **Chapter deck** panel is the assembly side. Import every `.json` the chairs sent in,
reorder by removing and re-adding, then **Download full deck (.pptx)** — one file, one slide
per committee, in the order listed. Nothing is uploaded anywhere; the deck lives in that
browser only.

The reporting brother's name and the meeting date stay off the slide by design. They travel
inside the file so the Keeper of Records knows whose report is whose.

---

## 2. `build_deck.py` (for batch assembly on your own machine)

Same layout, same geometry, run from the command line — useful when the report files arrive
by email and you would rather not touch a browser.

```bash
pip install python-pptx

# every report file in a folder, alphabetical
python3 build_deck.py reports/ -o oct-chapter-meeting.pptx

# specific files, in the order you want them presented
python3 build_deck.py guide-right.json scholarship.json social-action.json -o deck.pptx

# a blank template slide to hand out
python3 build_deck.py --blank -o DLA-Committee-Report-TEMPLATE.pptx
```

Both `.json` files exported by the web builder and hand-written ones work. A file may hold
one report object or an array of them.

### Report file format

```json
{
  "committee":    "Guide Right",
  "chair":        "Bro. Committee Chair",
  "meeting":      "2026-10-06",
  "actions":      "one bullet per line\nsecond bullet",
  "celebrations": "...",
  "asks":         "...",
  "days":         "Oct 18 – what happens in 30 days\nNov 8 – 60 days",
  "titleFont":    "Poppins"
}
```

Every field is optional. An empty box falls back to the template's own
*"Enter brief information here"* placeholders, in grey, so an unfinished report is obvious
on screen. `--blank` prints those placeholders in black instead, so the file works as a
type-over template in PowerPoint.

---

## Design notes

- **Canvas.** The slide is authored on 1280 × 720 px, which maps 1:1 onto a
  13.333 × 7.5 in widescreen slide at 96 px per inch. Every measurement in `build_deck.py`
  is in template pixels for that reason.
- **Crimson.** `#70110C`, the primary from the 2025 DLA Branding & Media Guide, on both
  rules.
- **Type.** Body copy is Arial, per the branding guide. The title defaults to **Poppins**,
  which matches the chapter template on screen; pick **Aptos Display** in the builder if the
  deck will be edited on a chapter laptop that does not have Poppins installed — PowerPoint
  silently substitutes a typeface it cannot find.
- **Overflow.** Bullet type steps down from 21 px to 19 px at five lines and 17 px at six.
  Past six lines the builder flags the box; that is a signal to tighten the report, not to
  shrink the type further.
- **Shapes.** Theme style references are stripped from every rectangle so the boxes render
  flat — no drop shadow — in PowerPoint, Keynote, Google Slides and LibreOffice alike.

## What's in this folder

```
committee-report-builder.html        the web builder — host it or open it directly
build_deck.py                        the batch deck generator
assets/dla-logo-small.png            chapter seal, bottom right
assets/social-icons.png              Facebook · Instagram · YouTube strip
assets/favicon.png                   browser tab icon for the hosted page
sample/EXAMPLE-committee-report.json illustrative report file — not a real report
```

`assets/` is only needed by `build_deck.py`. The HTML file carries its own copies of the seal,
the icon strip, and both JavaScript libraries — it has no external dependencies of any kind.
