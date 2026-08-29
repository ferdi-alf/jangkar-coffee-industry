# Preliminary Design System

**Phase 5 output. The shared substrate under all five concepts.**

The five prototypes are *not* five design systems. They are five interpretations of **one** system — same palette set, same spacing scale, same grid, same accessibility rules. What varies between them is composition, typographic voice and section rhythm.

That is deliberate: it makes the comparison meaningful. If each concept invented its own colours, you would be choosing a mood board. Holding the substrate fixed means you are choosing a *layout language*, which is the actual decision.

---

## 1. Colour

The **default** palette is **dark / white / red**. Red is `#BE0909`, sampled directly from `logo-2.PNG`.

Since 2026-08-28 the prototypes also ship **five alternative palettes** behind a switcher — see §1b. This section describes the default (`industri`); every alternative remaps the same token names to different values, so everything below stays structurally true whichever palette is active.

### Ink — warm, red-shifted near-black

Derived from the packaging darks (`hsl(5, 15%, 15%)`) and the crest outline (`hsl(0, 82%, 11%)`). Every step carries hue 0–10°. None is neutral; none is blue.

| Token | Hex | Use |
|---|---|---|
| `--ink-900` | `#0A0708` | Page base. The default ground. |
| `--ink-850` | `#0F0C0D` | Alternate section band |
| `--ink-800` | `#161314` | Elevated surface — cards, panels |
| `--ink-700` | `#1F1B1C` | Raised surface, hover state |
| `--ink-600` | `#2A2526` | Strong border, divider |
| `--ink-500` | `#3A3436` | Hairline border |
| `--ink-400` | `#6B6467` | Decorative / disabled only — **fails AA for body** |
| `--ink-300` | `#8C8689` | Secondary text — 5.62:1 ✓ |
| `--ink-200` | `#A5A0A2` | Muted body text — 7.79:1 ✓ |
| `--paper` | `#F4F2F0` | Primary text, light sections — 17.96:1 ✓ |
| `--paper-pure` | `#FFFFFF` | Reserved for maximum-emphasis type only |

### Red

| Token | Hex | Contrast on `--ink-900` | Use |
|---|---|---|---|
| `--red` | `#BE0909` | **3.09:1** | Brand red. Fills, rules, borders, large display type ≥24px, ≥19px bold. |
| `--red-lift` | `#EF2B2B` | **4.82:1** ✓ AA | Small red text, links, focus rings, anything under 24px |
| `--red-deep` | `#770B09` | — | Pressed state, deep fill, red-on-red layering |

### The one hard colour rule

`--red` at `#BE0909` on `--ink-900` measures **3.09:1**. That is enough for large text and UI components under WCAG, and **not enough for body copy.**

So:

- **`--red` is for size and area** — fills, rules, borders, headlines.
- **`--red-lift` is for anything small** — links, labels, inline emphasis.
- Never set body copy in `--red` on a dark ground.

White on red measures **5.82:1** (`--paper`) and **6.5:1** (pure white) — both pass AA for body text, so reversed-out red panels are safe.

### Usage budget

Red should occupy roughly **5–10% of any given screen**. It marks the one thing that matters. A red-washed section is red spent, not red used — after which nothing on the page can be emphasised.

---

## 1b. Palette options

**Added 2026-08-28.** Six palettes, selectable from the control at the bottom-right of every prototype. This supersedes the earlier "gold excluded" decision recorded in `brand-analysis.md` §5 — see the `[REOPENED]` note there. `industri` remains the default; the other five are exploration, not a decision.

### Tokens are roles, not literal colours

This is the load-bearing idea, and the reason a palette swap costs almost no CSS. Every rule in the prototypes uses tokens *positionally* — `background:var(--ink-900)`, `color:var(--paper)` — so a palette only has to remap values:

| Token | Role | Note |
|---|---|---|
| `--ink-900` … `--ink-700` | Ground and surfaces | **Lightest** values in a light palette |
| `--ink-600` … `--ink-400` | Borders, decorative | `--ink-400` is decorative only — fails AA by design |
| `--ink-300` / `--ink-200` | Secondary and muted text | |
| `--paper` | Primary text | **Dark** in a light palette |
| `--red` / `-lift` / `-deep` | The **accent** family | Holds **gold** in the gold-led palettes |
| `--red-deep` | Accent hover fill | Darker in dark palettes, *lighter* in light ones. Always carries `--on-red`. |
| `--on-red` | Foreground on accent panels | White, or dark brown where the accent is gold |
| `--signal` | The literal brand red | Punctuation only — focus rings, status marks |
| `--paper-lift` | Hover in inverted sections | Where `--paper` is the ground (03 `.paper-sec`) |
| `--veil` | Sticky-header backdrop | |
| `--chip-bg` / `--chip-bd` | Placeholder label chip | |
| `--red-shine` | Gradient sheen | 06 `.shiny` |
| `--blend` / `--shadow` | Aurora blend mode, floating shadow | `screen` on dark, `multiply` on light |
| `--*-rgb` | RGB triplets | For `rgba(var(--x-rgb), α)` |

### The six

| # | id | Character | Ground | Accent | Text | Source |
|---|---|---|---|---|---|---|
| 1 | `industri` | Dark — **default** | `#0A0708` | `#BE0909` red | `#F4F2F0` | current system |
| 2 | `terang` | Light | `#F5F2F0` | `#BE0909` red | `#1A1516` | inverted `industri` |
| 3 | `outlet` | Light, gold-led | `#FDFBEE` | `#C27B32` gold | `#5C382A` | `menu-outlet.JPG` |
| 4 | `crest` | Light, gold-led | `#FBFAF8` | `#B08A16` gold | `#320505` | `logo-3.PNG` |
| 5 | `roastery` | Dark, gold-led | `#140A04` | `#D9A441` gold | `#F3EAD8` | `product-ecomerce-3.PNG` |
| 6 | `keliling` | Light, red-led | `#E4DCCC` | `#A01820` red | `#083848` | `menu-jangkar-keliling.PNG` |

Three dark, three light; three red-accented, three gold-accented.

Colours were sampled from the assets, not eyeballed:

- **`menu-outlet.JPG`** — cream `#FCFAEC` · tan `#F2E2C4` · brown `#74483A` · caramel `#94540F` · gold `#C27B32` · brick red `#A63A2A`
- **`logo-3.PNG`** — white `#F8F8F8` · maroon-black `#320505` · gold `#F9DA72` / `#E8C244` · reddish-brown `#6B3226`
- **`menu-jangkar-keliling.PNG`** — parchment `#E0D8C8` · kraft `#C8C0B0` · crimson `#A01820` · teal-navy `#083848` · gold `#D89000`

### Two things the sampling forced

**Gold on white cannot be gold.** The crest gold `#F9DA72` measures **1.4:1** on white — unusable for a fill or for type. So in `crest` the antique gold `#B08A16` takes the fill/UI role (3.10:1) and the bright `#E8C244` becomes `--red-deep`, the hover fill that still carries maroon text.

**White text does not survive a gold panel.** `#FFFFFF` on `#C27B32` is 3.3:1. That is why `--on-red` exists: in the gold-led palettes it is a dark brown, and every `var(--white)` that sat on an accent panel became `var(--on-red)`.

### Verified contrast

Every palette meets §7. Figures are `--ink-900`-relative unless stated:

| Palette | paper | ink-200 | ink-300 | red | red-lift | signal | on-red / red | on-red / deep |
|---|---|---|---|---|---|---|---|---|
| `industri` | 17.96 | 7.79 | 5.62 | 3.09 | 4.82 | 4.82 | 6.50 | 11.44 |
| `terang` | 16.20 | 7.65 | 5.00 | 5.83 | 8.09 | 5.83 | 6.50 | 12.70 |
| `outlet` | 9.84 | 7.30 | 4.78 | 3.27 | 4.59 | 6.34 | 5.02 | 7.66 |
| `crest` | 17.36 | 10.88 | 6.71 | 3.10 | 4.76 | 10.78 | 5.60 | 10.55 |
| `roastery` | 16.35 | 8.65 | 5.69 | 8.69 | 12.31 | 5.13 | 8.42 | 6.34 |
| `keliling` | 9.23 | 6.92 | 5.02 | 5.82 | 7.51 | 5.18 | 6.63 | 11.38 |

Floors: `paper ≥ 7` · `ink-200`, `ink-300`, `red-lift`, `signal`, `on-red` pairs `≥ 4.5` · `red ≥ 3`.

Worth noting: `--red` at `#BE0909` measures 3.09:1 on the dark ground but **5.83:1** on `terang`. The §1 rule "never set body copy in `--red` on a dark ground" is a rule about the *dark* ground specifically, and it relaxes in the light palettes.

### Where it lives

`prototypes/palette.css` — all six palettes and the control's styling.
`prototypes/palette.js` — the control, persistence, and link stamping.

Selection resolves `?p=<id>` → `localStorage` → `industri`. The query parameter is not redundant: the prototypes are opened over `file://`, where some browsers block `localStorage`, so every same-folder `.html` link is rewritten to carry `?p=<id>`.

---

## 2. Typography

One shared rule across every concept: **weight and width carry the brand, not ornament.** This comes straight from the wordmark analysis — strip its hatch texture and the skeleton is a heavy poster gothic.

### Shared roles

| Role | Job |
|---|---|
| **Display** | Hero and section headlines. Where the brand voice lives. |
| **Body** | Paragraphs and lists. Neutral, legible, invisible. |
| **Meta** | Labels, prices, codes, captions. Uppercase, tracked, small. |

### Per-concept assignment

Each concept takes a different voice within the same roles — that is much of what makes them feel different.

| Concept | Display | Body | Meta |
|---|---|---|---|
| 01 Manifest | Archivo, 800, expanded | Inter | Archivo, tracked caps |
| 02 Dockyard | Archivo, 700, semi-condensed | IBM Plex Sans | IBM Plex Mono |
| 03 Ensign | Anton | Inter | Archivo, tracked caps |
| 04 Semendo | Instrument Serif | Inter | Inter, wide-tracked caps |
| 05 Keliling | Anton | Inter | Space Mono |
| 06 Arus | Inter 800, tight tracking | Inter | JetBrains Mono |

All are Google Fonts, all have real fallback stacks. Nothing here is final — type is one of the things to react to.

Concept 06 uses Inter for both display and body deliberately: in that direction the personality is carried by motion, so the type stays neutral. In every other concept the type *is* the personality.

### Scale

Fluid, `clamp()`-based, so a single scale serves mobile and desktop.

| Step | Size | Tracking | Leading |
|---|---|---|---|
| Display XL | `clamp(3rem, 11vw, 9rem)` | −0.03em | 0.88 |
| Display L | `clamp(2.25rem, 6vw, 4.5rem)` | −0.025em | 0.95 |
| Display M | `clamp(1.75rem, 3.6vw, 2.75rem)` | −0.02em | 1.05 |
| Heading | `clamp(1.25rem, 2vw, 1.6rem)` | −0.01em | 1.2 |
| Body L | `clamp(1rem, 1.2vw, 1.15rem)` | 0 | 1.65 |
| Body | `0.95rem` | 0 | 1.7 |
| Meta | `0.7rem` | **0.18em** | 1.4 |

Two rules worth stating because they are what make large type look designed rather than merely big:

- **Tracking tightens as size grows.** Display type is set negative; meta type is set wide.
- **Leading tightens as size grows.** Display sits at 0.88–1.05; body sits at 1.65–1.7.

Body copy is capped at **68 characters** per line regardless of viewport.

---

## 3. Spacing

4px base unit. A restrained scale — fewer steps means fewer arbitrary decisions.

```
4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128 · 160 · 200
```

| Context | Desktop | Mobile |
|---|---|---|
| Section padding (vertical) | 128–160 | 64–80 |
| Between related blocks | 48 | 32 |
| Within a block | 24 | 16 |
| Component internal padding | 32 | 20 |

**Philosophy:** space is the primary hierarchy device, ahead of size and colour. Where a boundary is needed, prefer more space over a divider line — and if space is not enough, only then draw a rule. Adjacent sections should never share the same vertical rhythm, or the page reads as one undifferentiated column.

---

## 4. Grid

| Property | Desktop | Tablet | Mobile |
|---|---|---|---|
| Columns | 12 | 8 | 4 |
| Gutter | 24px | 20px | 16px |
| Outer margin | 64px | 40px | 20px |
| Max content width | 1440px | — | — |
| Max text measure | 68ch | 68ch | 100% |

Breakpoints: `640` · `900` · `1200` · `1440`.

Asymmetry is expected. Concepts 01 and 05 deliberately break the 12-column grid with offset and overlap; 02 and 03 hold it strictly. Both are legitimate — the grid is a reference, not a cage.

---

## 5. UI language

### Radius

**0px everywhere**, with one exception: pill-shaped elements are fully rounded (`999px`).

There is no middle. No `4px`, no `8px`, no `12px`. Sharp corners read as industrial and precise; full pills read as deliberate and confident; the range between them reads as generic web UI, which is exactly the thing the brief rejects.

*(Concept 04 is permitted a 2px radius as part of its softer register — the one sanctioned deviation, and something to react to.)*

### Buttons

| Variant | Fill | Text | Border | Use |
|---|---|---|---|---|
| Primary | `--red` | `--paper` | none | The one action per section |
| Secondary | transparent | `--paper` | 1px `--ink-500` | Alternative action |
| Ghost | transparent | `--ink-200` | none, underline on hover | Tertiary, inline |

Height 48px desktop, 52px mobile (thumb target). Horizontal padding 32px. Label uppercase, 0.1em tracking, 600 weight.

**One primary button per section.** Two competing primaries mean neither is primary.

### Borders and dividers

1px, `--ink-500` for hairlines, `--ink-600` for structural. Red rules are 2px and reserved for section-opening markers.

### Labels and pills

Meta type, uppercase, 0.18em tracking, `--ink-300`. A red square or slash prefix — `▪` or `/` — marks a section. The slash is taken directly from the Keliling menu's own `/LIST MENU`, which is a real existing brand tic worth keeping.

Pills (fully rounded, 1px border, meta type) are used for filters and category chips only — never as decorative tags.

### Cards

Flat. `--ink-800` ground, 1px `--ink-500` border, 0 radius, no shadow. On hover: border shifts to `--red`, ground lifts to `--ink-700`. That is the entire interaction — no lift, no scale, no glow.

### Image treatment

Every prototype uses labelled CSS placeholder rectangles, per the brief. For production the rules are:

- Consistent aspect ratios: `4:5` product, `16:9` environment, `1:1` portrait
- Warm-black ground, hard raking key light, one soft red bounce
- Cutouts on black for packaged product
- **No** filter stacks, duotones or blend modes as a substitute for good photography

### Shadows and glows

**None.** Depth comes from surface value and border, not shadow. On a warm-black ground a drop shadow is invisible; a glow is a 2019 tell.

---

## 6. Motion

**Budget: two moving things per screen, maximum.**

| Property | Value |
|---|---|
| Micro (hover, focus) | 120ms, `ease-out` |
| Standard (reveal) | 320ms, `cubic-bezier(0.2, 0, 0, 1)` |
| Deliberate (section) | 520ms, same curve |

Permitted:

- Opacity and small Y-translate (≤16px) on scroll reveal, once, never repeating
- Colour and border transitions on hover
- Underline draw on link hover
- Marquee — **Concept 05 only**, where movement is the brand idea rather than decoration

Not permitted: parallax, scroll-jacking, counters, typewriter effects, scale-on-hover above 1.02, staggered letter animation, anything that repeats indefinitely outside Concept 05.

`prefers-reduced-motion: reduce` disables all of it, including the marquee. Not optional.

### Concept 06 is a deliberate exception

Concept 06 (Arus) was added to test the ReactBits / Lightswind animated-component direction. It **breaks this budget on purpose**, and also breaks the `radius: 0` rule in §5. That is legitimate as an exploration, but it means the two are alternatives, not compatible defaults: **if 06 is chosen, §5's radius rule and this motion budget must both be formally rewritten**, not quietly ignored. A design system that is silently violated stops being a design system.

Two constraints survive regardless of direction:

- `prefers-reduced-motion: reduce` must degrade the page to a clean static layout. Concept 06's prototype does this; production must keep it.
- **Pointer-driven effects are decoration, never function.** Spotlight, tilt and magnet do nothing on touch devices, which is the majority of this audience. Nothing may be communicated by motion alone.

---

## 7. Accessibility floor

Established now so it constrains the design rather than being retrofitted:

- Body text meets **4.5:1**; large text and UI meet **3:1**
- `--red` is never used for body copy on dark — `--red-lift` instead
- `--ink-400` is decorative only
- Focus is always visible: 2px `--red-lift` outline, 2px offset — never `outline: none`
- Touch targets ≥44px
- Colour never carries meaning alone — a sold-out item is struck through *and* labelled, not merely dimmed
- Semantic landmarks throughout; one `h1` per page; heading levels never skipped
- `prefers-reduced-motion` honoured

---

## 8. Token reference

```css
:root {
  /* ink — warm, red-shifted */
  --ink-900:#0A0708; --ink-850:#0F0C0D; --ink-800:#161314;
  --ink-700:#1F1B1C; --ink-600:#2A2526; --ink-500:#3A3436;
  --ink-400:#6B6467; --ink-300:#8C8689; --ink-200:#A5A0A2;
  --paper:#F4F2F0;   --paper-pure:#FFFFFF;

  /* red */
  --red:#BE0909; --red-lift:#EF2B2B; --red-deep:#770B09;

  /* space */
  --s1:4px;  --s2:8px;   --s3:12px;  --s4:16px;  --s5:24px;  --s6:32px;
  --s7:48px; --s8:64px;  --s9:96px;  --s10:128px; --s11:160px; --s12:200px;

  /* structure */
  --max:1440px; --measure:68ch; --gutter:24px; --margin:64px;
  --radius:0; --radius-pill:999px;
  --hair:1px solid var(--ink-500);
  --rule:1px solid var(--ink-600);

  /* palette roles — see §1b; remapped per palette in prototypes/palette.css */
  --on-red:#FFFFFF; --signal:#EF2B2B; --paper-lift:#FFFFFF;
  --red-shine:#FF6A6A; --veil:rgba(10,7,8,.86);
  --chip-bg:rgba(10,7,8,.62); --chip-bd:rgba(244,242,240,.26);
  --blend:screen; --shadow:rgba(0,0,0,.9);
  --ink-900-rgb:10,7,8; --paper-rgb:244,242,240;
  --red-rgb:190,9,9; --red-lift-rgb:239,43,43; --red-deep-rgb:119,11,9;
  --on-red-rgb:255,255,255;

  /* motion */
  --t-micro:120ms ease-out;
  --t-std:320ms cubic-bezier(.2,0,0,1);
  --t-slow:520ms cubic-bezier(.2,0,0,1);
}
```
