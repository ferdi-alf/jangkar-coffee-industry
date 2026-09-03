# Jangkar Coffee Industry — Brand Analysis

**Phase 1–3 output. Asset-derived. No production decisions locked.**

Date: 2026-08-27
Source of truth: `/jangkar-coffee-reference/` — 8 image assets, inspected directly (not assumed from filenames).

Every statement below is tagged:

- **[FACT]** — directly observable in the supplied assets
- **[INFER]** — reasonable design inference drawn from those facts
- **[ASK]** — requires the owner's decision; not assumed
- **[CONFIRMED]** — decided by the owner during this session

---

## 1. What the assets actually are

| File | What it actually is | Dimensions |
|---|---|---|
| `logo.png` | Monochrome symbol: anchor + coffee branch + 3 cherries + laurel wreath | 597² RGBA |
| `logo-2.PNG` | **Jangkar Keliling** logo — red, anchor + chain + wave swoosh + ribbon | 7087² RGBA |
| `logo-3.PNG` | **Cap Jangkar 999** heritage crest — shield, gold on dark maroon | 2304×2148 RGBA |
| `menu-jangkar-keliling.PNG` | A4 mobile-cart menu poster, parchment/nautical | 595×841 |
| `menu-outlet.JPG` | A4 full outlet menu, 5 categories | 2480×3508 |
| `product-ecomerce-1.JPG` | Retail sachet render — red "Semendo 999" | 864² |
| `product-ecomerce-2.JPG` | Retail pack render — brown "Semendo 999" | 864² |
| `product-ecomerce-3.PNG` | Marketplace banner — kraft "Gold Series" 250gr | 1024² |

---

## 2. The single most important finding

**[FACT]** The outlet menu header reads **"JANGKAR / COFFEE INDUSTRY"**, and the menu contains a category called **"Roastery Corner"** selling `Kopi Bubuk 80gr / 200gr`, `Robusta Gold Series 250gr`, and `Robusta Roasted Beans 15k/100grams`. Three of the eight assets are *packaged retail goods*, not drinks.

**[INFER]** This is **not a coffee shop that also sells beans**. It is a vertically integrated small coffee industry:

```
Semendo origin  →  roastery  →  packaged retail  →  outlets  →  mobile carts
   (sourcing)      (production)    (product)        (retail)    (distribution)
```

That structure is the brief's own answer. The reason the site must not look like a café site is not merely taste — **it is factually not a café**. The word "Industry" in the name is literal. This is the strongest possible justification for the requested industrial/editorial direction, and it should drive the information architecture, not only the styling.

**[ASK]** Confirm the roastery is owned/operated rather than white-labelled. It changes how hard we can lean on "we roast it" as the central story.

---

## 3. Brand architecture — there are three marks, not one

**[FACT]** The assets contain three visually unrelated identities.

**A. The Symbol** (`logo.png`) — pure black silhouette. Anchor as the spine; a four-leaf coffee branch behind the shank; three coffee cherries at the crown junction; a laurel/wheat wreath cradling the flukes. Single colour, no gradients, no text, ~1:1.16 aspect. Stencil-clean and fully scalable.

**B. Jangkar Keliling** (`logo-2.PNG`) — solid red `#BE0909`. Anchor + chain overlapping a large crescent wave. "JANGKAR" in a heavy vernacular slab; "KELILING" reversed out of a wavy ribbon. Energetic, hand-drawn, street-level.

**C. Cap Jangkar 999** (`logo-3.PNG`) — shield crest. "KOPI BUBUK SEMENDO" / "CAP JANGKAR" / gold anchor / "999" on a scroll banner. Gold `#FEDF75` on maroon-black `#320505`. Heraldic, traditional, trust-signalling.

**[CONFIRMED]** Owner decision, this session:

| Tier | Mark | Role | Status |
|---|---|---|---|
| **Primary** | A — `logo.png` | The company identity. Header, favicon, hero, footer. | **Primary mark, site-wide** |
| **Street** | B — `logo-2.PNG` | Jangkar Keliling, the mobile operation | Contained — Keliling section only |
| **Heritage** | C — `logo-3.PNG` | Cap Jangkar 999 packaged coffee | Contained — a single component, placed deliberately |

**[INFER]** Mark A is the right primary for a technical reason as well as a brand one: it is monochrome, so it renders white-on-black, red-on-black, or knocked out of a red field with zero modification. Marks B and C are locked to their own palettes and would fight a dark/white/red system if promoted to the header.

**[INFER]** Containing B and C rather than hiding or redesigning them converts a brand-consistency problem into brand depth: the master brand stays disciplined while the sub-brands keep their character. Mark C in particular reads best as a **framed artefact** — shown at its own size, on its own ground, inside one product/heritage component — where its gold belongs to the artwork and never leaks into the site palette.

**[ASK]** Is `logo.png` available as vector (SVG / AI / EPS)? A 597px raster is too small for hero-scale use. If not, it must be redrawn — cheap, and worth doing before production.

---

## 4. Colour — measured, not guessed

Sampled directly from pixel data across all eight assets.

### Observed values

| Role | Hex | HSL | Where observed |
|---|---|---|---|
| **Brand red** | `#BE0909` | `hsl(0, 91%, 39%)` | Keliling logo fill — 56.7% of all opaque pixels |
| Red, print | `#A21D21` | `hsl(358, 70%, 37%)` | Keliling menu poster |
| Red, packaging | `#A8231A` | `hsl(4, 73%, 38%)` | Brown pack anchor |
| Red, deep | `#770B09` | `hsl(1, 86%, 25%)` | Red sachet label |
| **Warm black** | `#120807` → `#2C2221` | `hsl(5–10, 14–44%, 5–15%)` | Packaging ground |
| **Maroon black** | `#320505` | `hsl(0, 82%, 11%)` | Crest outline |
| Gold | `#FEDF75` | `hsl(46, 99%, 73%)` | "999", "Gold Series" |
| **White** | `#F8F8F8` | — | Crest field, outlet menu ground |

### Two findings that matter

**[FACT] The brand red is not a bright red.** It sits at ~39% lightness, ~91% saturation, hue 0°. It is a *flag red / lacquer red* — dense and slightly heavy. `#FF0000` and any orange-red would be off-brand.

**[FACT] Every black in the brand is warm and red-shifted** (hue 0–10°), never neutral, never blue. The packaging darks measure `hsl(5, 15%, 15%)`; the crest outline measures `hsl(0, 82%, 11%)`.

**[INFER]** That second fact is a gift. Using a red-shifted near-black rather than `#000000` or a blue-grey `#0B0F14`:

1. is directly derived from the existing brand rather than invented;
2. makes the red feel native to the surface instead of pasted onto it;
3. sidesteps the default "SaaS dark mode" look, which would be as generic as the café look we are avoiding.

**[INFER]** The brown/beige ban is satisfiable *without* discarding brand colour. The existing brown ground `#2C2221` is simply the light end of a warm-black ramp. We keep the hue and drop the lightness. Nothing is thrown away; the beige is what gets cut.

**[REOPENED 2026-08-28]** ~~Gold is excluded from the core palette.~~ The owner reopened this. The prototypes now ship a **palette switcher with six options**, three of which lead with gold, sampled from `menu-outlet.JPG` and `logo-3.PNG`. See `design-system.md` §1b.

What did **not** change: `industri` (dark / white / red) is still the **default** palette, and `#BE0909` sampled from `logo-2.PNG` is still the brand red. The five alternatives are an exploration to react to, not a decision — the production palette is still open.

What did change: gold is no longer confined to the crest artwork. In the `outlet`, `crest` and `roastery` palettes it is the **primary accent** — it fills buttons, rules and bands — and red drops back to punctuation via the new `--signal` token. Brown and cream become dominant surfaces in `outlet`, and parchment in `keliling`.

---

## 5. Typography — what the brand already uses

**[FACT]** The `JANGKAR` wordmark is a heavy, tightly-tracked all-caps poster gothic with flat terminals, filled with a diagonal engraving hatch and wrapped in a thin outline. `COFFEE INDUSTRY` sits below it in a bold condensed slab.

**[FACT]** `KOPI BUBUK SEMENDO` and `CAP JANGKAR` on the crest are set in a plain geometric/humanist sans — no serifs, no decoration.

**[FACT]** Menu body copy is a neutral humanist sans. Category labels are heavy caps inside filled or outlined boxes. The Keliling poster uses a slash-prefixed section marker: **`/LIST MENU`**.

**[INFER]** Strip the hatch and the outline from the wordmark and the underlying skeleton is a **heavy poster gothic**. The texture is a decorative layer, not the identity. That is the useful reading: the brand's typographic DNA is *weight and width*, not ornament — precisely the raw material for an editorial/industrial system, and precisely what the brief asks for. The decoration can be dropped without losing the brand.

**[INFER]** The `/LIST MENU` slash marker is a small existing editorial tic worth keeping. It costs nothing and it is *theirs*.

**[ASK]** Retain the textured wordmark as a **logotype asset** used at lockup scale, while the website sets its own headlines in a clean gothic. Re-texturing live web type would be a mistake. Confirm.

---

## 6. Menu and product — the extracted content model

**[FACT] Outlet menu** — `HQ Sako, Jln Siaran No 745B` — five categories:

- **Signature Series** — Kopi Susu Jangkar 8k · Jangkar Latte (No SKM) 8k · Kopi Susu Gula Aren 10k · Jangkar Gold Latte 15k
- **Black & White Coffee** — Americano/Long Black 8k · Kopi Tubruk (Tanpa Gula) 8k · Kopi Tubruk Manis/Susu 10k · Kopi Milo 10k · Salted Caramel Latte 12k · Vietnam Drip 12k · Butterscotch Latte 15k · Choco Caramel Latte 15k · Black Charcoal Latte 15k · Avocado Coffee Latte 15k · Manual Brew/Japanese 20k · Kopi Susu Jangkar 1 Liter 45k · Kopi Susu Gula Aren 1 Liter 55k
- **Non-Coffee** — Mineral Water 5k · Lemon Tea 8k · Teh Tarik 10k · Signature Chocolate 10k · Matcha Latte 12k · Wedang Uwuh 12k · Red Velvet Latte 15k · Taro Creme Latte 15k
- **Snacks** — Tahu Bakso Ikan 12k · Donat Kentang Mini 12k · Singkong Keju 12k · Kentang Goreng 12k
- **Roastery Corner** — Kopi Bubuk 80gr 9k · Kopi Bubuk 200gr 18k · Robusta Gold Series 250gr 35k · Robusta Roasted Beans 15k/100gr

**[FACT]** Modifiers exist: `*Upgrade to Oatside +4k`, `*FREE Extra Shot`.

**[FACT] The Keliling menu is a deliberately reduced subset** — 6 coffee, 4 non-coffee, no snacks, no roastery, no 1-litre. Prices are identical wherever items overlap.

**[INFER]** That is the most important structural fact in the menus: **one price list, two service formats.** The data model is one product catalogue with per-channel availability flags, not two separate menus. Getting this right now avoids a painful migration later.

**[INFER]** Further structure the model must carry: price tiers (8k / 10k / 12k / 15k / 20k), size variants (80gr / 200gr / 250gr, 1 Litre), modifiers, signature flags (the Keliling poster marks favourites with a thumbs-up), and — since one item is struck through on the printed menu — an **availability / sold-out state that is already in real use**.

**[FACT]** Contact details, consistent across both menus: `www.kopijangkar.com` · `0899 999 3030` · Instagram `jangkarkeliling.id`.

**[FACT]** The Keliling poster claims **"kopi keliling PERTAMA di Palembang"** — first mobile coffee in Palembang. Tagline: **"NGOPI NIKMAT, KEMBALIKAN SEMANGAT"**.

**[INFER]** "First mobile coffee in Palembang" is a genuine positioning claim and deserves headline treatment, not a footnote.

**[ASK]** Is that claim still safe to make publicly in 2026?

> **ANSWERED 2026-08-31 by the project owner: no.** The "first mobile coffee in Palembang" claim
> is not carried on the website. The Keliling section now uses a descriptive eyebrow with no
> superlative. The printed poster keeps it; the site does not repeat it.
>
> This closes the question. Do not reopen it or reintroduce the claim from the poster.

---

## 7. Product and photography — a real problem, named

**[FACT]** Products 1 and 2 are shot high-key: white marble, soft daylight, a single pack, a cup, spilled beans, a wisp of steam. Bright, clean, minimal.

**[FACT]** Product 3 is the opposite: dark wood, gold gradient bars, "PREMIUM INDONESIAN HARVEST / RICHER AROMA, FULLER BODY", plus a badge row — 100% Pure Robusta · Small Batch Roast · Satisfaction Guaranteed — and a **HALAL Indonesia** mark.

**[FACT]** Product 3 also confirms real product data: `GOLD SERIES` · `GROUND COFFEE ROBUSTA` · `PREMIUM QUALITY` · `SUMATRA INDONESIA` · `250gr`.

**[FACT]** The green drink on the outlet menu still carries a visible **"Canva"** watermark, and the pack copy in products 1 and 2 is illegible or garbled on close inspection.

**[INFER]** **There is currently no real product photography.** The renders are AI/mockup-generated and the menu art is stock. This is the largest practical risk to any of the five directions below, and it is a production risk rather than a design risk: every direction will look like its prototype only if it is fed real images.

**[INFER]** The three product assets also disagree with each other — two high-key minimal, one dark marketplace template. The marketplace treatment (gold gradient bars, badge rows, stacked promises) is exactly the generic look the brief rejects.

**[INFER]** The high-key style is the more useful ancestor, but it cannot be dropped onto a black page. The resolution is a **dark-studio direction**: the same discipline — one object, one light, no clutter — but on a warm-black ground, with a hard raking key and one soft red bounce. Products shot on black, cut out where needed, so the pack does the talking.

**[INFER]** HALAL certification and the three value propositions are real credentials. They should be set as **quiet typographic facts**, not badge graphics — the same information in the opposite register.

**[ASK]** Approve a dark-studio reshoot before production. Roughly one day: 3 packs, 6 drinks, 2 outlets, 1 cart. Without it we are designing for images that do not exist.

---

## 8. Outlets and Jangkar Keliling

**[FACT]** `HQ Sako, Jln Siaran No 745B` is named on the outlet menu. The "HQ" prefix implies at least one other location.

**[FACT]** The Keliling menu shows branded clear plastic cups carrying the red mark, at the 8k–12k entry price tier.

**[FACT]** Nautical vocabulary recurs across every asset: anchor, chain, rope-dash borders, compass rose, tall-ship engraving, wave.

**[INFER]** No photograph of a physical outlet or cart was supplied. Everything about the built environment is therefore inference and **must be confirmed** before we commit to any "space" imagery. Flagging this rather than inventing it.

**[INFER]** Palembang is a Musi River port city. An anchor on a coffee brand there is not a decorative maritime flourish — it is local. The nautical language is a **place signal, not a theme**. That distinction is what separates this from generic seaside-café decor, and it is the thing to protect.

**[INFER]** The Keliling operation is the brand's distribution edge. Because it moves, its section needs *time and place* as first-class content — where is the cart today — which no other section requires.

**[ASK]** How many outlets currently trade? Does Keliling run a fixed schedule or route, or is it ad-hoc?

---

## 9. Visual personality

Reading across all eight assets, the brand is already: **maritime, Sumatran, working, proud, unpretentious, high-volume, value-priced.**

It is not: precious, artisanal, third-wave, hushed, or Scandinavian. An 8,000-rupiah kopi susu is a daily habit, not an occasion.

**[INFER]** This puts a real constraint on the word "premium". The site should feel *serious and well-built*, not *expensive and exclusive* — the sharpness of good industrial equipment, not the hush of a luxury boutique. Pushing too far into quiet luxury would misrepresent both the price point and the personality. This is the principal risk attached to Concept 04.

---

## 10. Design principles

1. **Industry, not café.** The name is literal. Lead with the chain: origin → roastery → product → outlet → cart.
2. **Red is punctuation.** `#BE0909` marks the one thing that matters per screen. Red used as a background wash is red wasted.
3. **Warm black, never neutral black.** Every dark surface carries hue 0–10°, derived from the packaging.
4. **Typography carries the brand.** Weight and width — not texture, not ornament.
5. **The Symbol is the identity.** Mark A leads everywhere; Keliling and Cap Jangkar 999 stay in their own rooms.
6. **Nautical means Palembang.** Anchor, chain and compass are place markers, used sparingly and structurally — never as decoration.
7. **Price is not hidden.** 8k is a competitive fact. Show it plainly; hiding it would be posturing.
8. **Restraint over effect.** Nothing moves, glows or blurs unless it earns it.

---

## 11. Must / must not

### Must

- Warm, red-shifted near-black as the base surface
- `#BE0909` as the brand red, and the `industri` palette as the default
- Mark A as the primary identity, monochrome
- Real menu content and real prices in Rupiah
- Roastery / packaged product treated as a first-class business line
- Semendo / Sumatra / Palembang stated as origin fact
- Mobile-first — Indonesian traffic is overwhelmingly mobile
- Bahasa Indonesia as the primary language **[ASK: ID only, or ID + EN?]**

### Must not

- Brown or beige as a dominant surface — *except in the `outlet`, `crest` and `roastery` palettes, where it is the point*
- Parchment, rope, burlap, chalkboard or distressed textures
- Scattered coffee beans, latte-art close-ups, steaming-cup hero shots
- Marketplace badge rows, gold gradient bars, stacked promise banners
- Bright red `#FF0000` or any orange-red
- Neutral or blue-black darks
- Vintage or retro pastiche — the heritage crest is a contained artefact, not a site-wide style
- Glassmorphism, neon glow, gradient mesh, parallax spectacle
- Gold as a system colour — *lifted 2026-08-28 for the alternative palettes; still true of `industri` and `terang`*

---

## 12. Open questions

Resolved this session:

- ~~Primary mark?~~ → **Mark A (`logo.png`)**, confirmed
- ~~Gold in the palette?~~ → **Excluded**, confirmed — then **reopened 2026-08-28**. Gold now leads three of six optional palettes; `industri` (dark / white / red, red = `#BE0909`) remains the default. Which palette ships is still open.
- ~~Status of the crest?~~ → **Contained artefact in a single component**, confirmed

Still open:

1. Is `logo.png` available as vector?
2. Language — Bahasa Indonesia only, or bilingual ID + EN?
3. How many outlets trade today? Is the Keliling schedule fixed or ad-hoc?
4. Is the roastery owned and operated?
5. Is "first mobile coffee in Palembang" still accurate in 2026?
6. Approve a dark-studio photography reshoot?
7. **Does the site need to sell online, or route to WhatsApp / Shopee / Tokopedia?** This is the single biggest IA-shaping question.
8. Same domain as `kopijangkar.com`, or new?
9. Retain the textured wordmark as a logotype asset only, with web headlines in clean gothic?
