# Design Comparison — Six Directions

**Phase 8 output. A recommendation, not a decision. The direction is yours to choose.**

Open `prototypes/index.html` to compare them side by side.

---

## How to read these

All six prototypes share one palette, one spacing scale, one grid and one accessibility floor. That is deliberate. If each concept had invented its own colours you would be choosing a mood board; holding the substrate fixed means you are choosing a **layout language** — which is the decision that actually constrains the build.

All six satisfy the brief's hard constraints: dark, white, `#BE0909` red; modern minimalism; no brown or beige; no café tropes; `logo.png` as the primary mark; the Cap Jangkar 999 crest contained in a single component.

Concepts 01–05 are CSS-only. **Concept 06 is the exception and was added at your request** — it is built around the ReactBits / Lightswind animated-component vocabulary, so it carries vanilla JavaScript because motion is the thing being judged.

What differs:

| | Composition | Display type | Red area | Loudness | Content density |
|---|---|---|---|---|---|
| **01 Manifest** | Asymmetric, left-weighted | Archivo 800 expanded | Low + one band | Medium | Low |
| **02 Dockyard** | Strict 12-col, visible grid | Archivo condensed | Low, systemic | Low–medium | **High** |
| **03 Ensign** | Centred, symmetric | Anton | **High** | High | Medium |
| **04 Semendo** | Narrow measure, tall rhythm | Instrument Serif | **Minimal** | Very low | Low |
| **05 Keliling** | Overlapping, skewed | Anton + Space Mono | **High** | **Very high** | Medium |
| **06 Arus** | Bento cards, centred flow | Inter 800 tight | Ambient glow + accents | Medium–high | Medium |

---

## 01 — MANIFEST

**Core idea.** The homepage as the opening spread of a magazine. It opens with a claim — *Bukan kedai kopi. Industri kopi.* — set at 10rem, and everything after it is a numbered contents entry.

**Visual personality.** Confident, literary, unhurried. Speaks rather than sells.

**Layout philosophy.** Deliberately asymmetric and left-weighted. Wide outer margins, generous vertical rhythm, hairline rules instead of boxes. Content sits in a 12-column grid but rarely centres in it. Sections are marked by a number, a label and a rule — borrowed from the `/LIST MENU` device already on the Keliling poster.

**Typography philosophy.** One family, Archivo, doing everything through its width and weight axes: expanded 800 for the hero, condensed 700 for prices, tracked caps for meta. Weight and width carry the brand — the same principle as the wordmark, minus the decoration.

**Red usage.** Three appearances: one word in the hero, the section numerals, and the entire Keliling section. The scarcity is what makes the Keliling band land.

**Strengths**
- The strongest answer to *"a modern brand with coffee as its product"* — it reads as brand-first without saying so.
- Type-led, so it looks finished even before photography exists.
- Wears real content well; the menu list scales to 30 items without redesign.
- Cheapest of the five to build correctly.

**Weaknesses**
- Modest information density. Someone who came to check a price works harder than they should.
- Editorial layouts live or die on copywriting; weak Indonesian copy will show immediately.
- The most *familiar* of the five to anyone who follows contemporary web design.

**Best suited for** a brand that wants to be taken seriously by partners, resellers and press.

**Risks** Blandness if the copy is thin. The hero claim needs to be genuinely well-written in Bahasa Indonesia or the whole page deflates.

**How well it represents Jangkar** Strong. Its restraint suits the industrial reading, and the numbered chain is the clearest expression of the supply-chain story. Slightly *too* composed for an 8k street-price product.

---

## 02 — DOCKYARD

**Core idea.** The site as technical documentation for a working operation. Take *Industry* literally: labelled bays, SKU codes, channel flags, coordinates, a spec sheet in the hero.

**Visual personality.** Precise, functional, unsentimental. The register of good equipment.

**Layout philosophy.** A hairline 12-column grid is *visible* on every screen — the one device no other concept uses, and the thing you will notice first. Every section is a numbered bay with an ID chip. Nothing floats; everything sits in a cell.

**Typography philosophy.** Condensed Archivo for headings, IBM Plex Sans for body, IBM Plex Mono for every label, price and code. The mono is doing real work: it makes prices scannable and makes the operation look measured rather than styled.

**Red usage.** A system colour. The status bar, bay IDs, the active flag. Small areas, high frequency, always meaningful.

**Strengths**
- **The best fit to the actual business.** One catalogue, two channels, SKU codes, sold-out states — the assets already work this way, and this concept is shaped like the data.
- Highest information density with no loss of clarity. A price is never more than one glance away.
- The most defensible *"not a café"* answer — it barely resembles a hospitality site at all.
- Scales furthest without redesign: 30 menu items, 12 outlets, a full roastery catalogue all fit.
- Least dependent on photography, so it degrades most gracefully if the reshoot slips.

**Weaknesses**
- Can read as cold. The warmth has to come entirely from photography and copy.
- The visible grid is a strong opinion; if you dislike it, the concept loses its distinctiveness.
- Risks looking like a developer tool if the imagery underdelivers.
- Least emotionally seductive on first view — it wins on the second and third visit, not the first.

**Best suited for** an operation that wants to be read as a producer, and a site that will keep growing.

**Risks** Coldness. Needs at least a few genuinely warm photographs to stay human.

**How well it represents Jangkar** Strongest structural fit of the five. The name is *Coffee Industry* and this is the only concept that behaves like one. Its weakness is the inverse of its strength: it under-serves the street-level warmth the Keliling business actually has.

---

## 03 — ENSIGN

**Core idea.** The mark as the whole system. Centred, symmetric, emblem-forward, built from full-bleed bands — black, red, and one inverted white section.

**Visual personality.** Bold, ceremonial, public. Reads like signage.

**Layout philosophy.** Symmetry throughout. The mark appears at emblem scale three times. Sections are full-bleed bands, so scrolling feels like turning posters. The single white section is the strongest colour move in any of the five prototypes — and the only place any concept goes light.

**Typography philosophy.** Anton, tight and heavy, closest of the five to the existing `JANGKAR` wordmark. One outlined line in the hero adds air without weakening it.

**Red usage.** The highest of the five, by area. Two full sections plus a ribbon band.

**Strengths**
- Most immediately recognisable as a *brand* rather than a website.
- Translates directly to print, cups, signage, uniforms and the carts — real value for a business with physical touchpoints.
- The white section is a genuine surprise and gives the page a memorable spine.
- Reads well at a glance on a phone, which matches how this audience actually browses.

**Weaknesses**
- Symmetry is inflexible. Every section wants to be centred, which gets monotonous over a long page.
- Centred text at length hurts readability — the `/industri` page would need to break its own rule.
- Heaviest red usage of the five: emphasis is harder to place because everything is already loud.
- Closest to the existing print materials, so it demonstrates the *least* change from where the brand is now.

**Best suited for** a brand that leads with identity and wants print, packaging and web to be visibly one thing.

**Risks** Repetition and shouting. Big centred type on every section flattens hierarchy.

**How well it represents Jangkar** Good on brand, weaker on business. It sells the identity well but does less to communicate the roastery, the catalogue or the operation.

---

## 04 — SEMENDO

**Core idea.** Origin-led restraint. The company as a producer of a specific Robusta from a specific highland, told slowly.

**Visual personality.** Quiet, considered, adult. The most expensive-feeling of the five.

**Layout philosophy.** The longest vertical rhythm — up to 208px of section padding. Narrow measures, hairline rules, a 5px red dot as the only separator. The one concept permitted a 2px radius.

**Typography philosophy.** Instrument Serif for display with italics for emphasis, Inter Light for body, wide-tracked small caps for meta. The only serif direction, and the sharpest departure from the existing brand.

**Red usage.** Almost nothing — dots, one hairline frame, one button. The most disciplined interpretation of *red is punctuation*.

**Strengths**
- Genuinely premium. Would sit comfortably next to a specialty roaster three times the price.
- The most beautiful reading experience of the five.
- Best possible frame for the packaged product line, where margin actually lives.
- Ages slowest — least tied to any current trend.

**Weaknesses**
- **The most serious mismatch in the set.** Section 9 of the brand analysis found a maritime, working, high-volume, value-priced brand. This concept is hushed and exclusive. An 8k kopi susu presented this way risks looking either apologetic or dishonest.
- A serif is not supported anywhere in the existing brand — the wordmark, the crest and the menus are all sans.
- Long rhythm means a lot of scrolling for a price check on mobile.
- The Keliling operation — loud, red, fast — actively fights this register.

**Best suited for** a future premium sub-brand: a Gold Series line, a single-origin release, an export-facing page.

**Risks** Misrepresenting the business. Priced-out perception in a value-conscious market.

**How well it represents Jangkar** Weakest of the five as a whole-company direction, and the most valuable as a *component* direction. I would keep it in the drawer for the Gold Series product pages rather than run it site-wide.

---

## 05 — KELILING

**Core idea.** Movement as the identity. Jangkar Keliling is the differentiator — *first mobile coffee in Palembang* — so the whole site moves: marquees, skewed bands, overlapping blocks, route stubs.

**Visual personality.** Young, urban, energetic, street.

**Layout philosophy.** Deliberately broken grid. The hero headline overlaps its image. Red bands are skewed −2.2°. Route cards are ticket stubs with dashed perforations. The roastery is a horizontal scroll rail.

**Typography philosophy.** Anton for impact, Space Mono for everything factual. The mono adds a transit-signage quality — timetables, not receipts.

**Red usage.** Very high. Two marquees, two skewed bands, a red header rule.

**Strengths**
- The most distinctive, and the only one nobody would mistake for another coffee brand.
- Best match to the actual audience — mobile-first, young, Instagram-native.
- The only concept where the *Keliling* schedule feels native rather than bolted on.
- Genuinely fun, which is a real commercial asset at an 8k price point.

**Weaknesses**
- **Promotes the sub-brand over the master brand.** The owner has just confirmed `logo.png` as primary and Keliling as contained; this concept structurally inverts that.
- Skew and overlap are fragile — they need careful testing at every breakpoint and will cost the most to build and maintain.
- Marquees are a motion cost and a genuine accessibility concern. Handled here via `prefers-reduced-motion`, but they remain a liability.
- Weakest for the roastery and B2B audience. A wholesale buyer will not take this as seriously.
- Ages fastest of the five.

**Best suited for** a dedicated `/keliling` campaign page, or an Instagram-led launch.

**Risks** Undermining the master brand; fragility across breakpoints; dating quickly.

**How well it represents Jangkar** Represents *Jangkar Keliling* excellently and *Jangkar Coffee Industry* poorly. It captures the energy the brand genuinely has, and mis-weights the brand architecture the owner just confirmed.

---

## 06 — ARUS

*Added at your request, to test the ReactBits / Lightswind direction.*

**Core idea.** Motion as the material. Nothing is static: the page breathes, reacts to the cursor, and reveals itself as you scroll. *Arus* means current or flow — and it keeps the maritime thread without any nautical decoration.

**Visual personality.** Contemporary, fluid, product-led. The register of a well-funded modern brand site rather than a café or a factory.

**Layout philosophy.** Soft geometry — 16–18px radii, bento card grids, a floating dock nav instead of a full-width header. Composition is looser and more centred than 01 or 02; the structure is carried by cards and glow rather than by rules and grids. This is the one concept that deliberately breaks the design system's `radius: 0` rule, and it has to, because sharp corners fight this vocabulary.

**Typography philosophy.** Inter at 800 with tight negative tracking — the current default voice of modern product design. Deliberately neutral, because here the *motion* is the personality, not the type. JetBrains Mono handles labels and prices.

**Red usage.** Different in kind from the other five. Red is mostly **ambient** — a blurred aurora field behind the hero and the Keliling section — plus small accents on labels, buttons and the scroll progress bar. Less red *area* than 03 or 05, but red is present almost everywhere as atmosphere.

**The motion vocabulary demonstrated.** Each effect in the prototype is annotated in the source with the library component it stands in for:

| Effect in the prototype | Stands in for |
|---|---|
| Drifting aurora glow field | `Aurora` / `Silk` / `Plasma` |
| Masked dot grid | `DotGrid` / `Particles` |
| Floating dock navigation | `Dock` / `GooeyNav` |
| Word-by-word blur-up headline | `SplitText` / `BlurText` |
| Animated sheen on one word | `ShinyText` / `GradientText` |
| Animated conic border on a button | `StarBorder` |
| Cursor-following button | `Magnet` |
| Scroll-triggered staggered reveals | `AnimatedContent` / `ScrollReveal` |
| Animated number counters | `CountUp` |
| Pointer-tracked card highlight | `SpotlightCard` / `MagicBento` |
| 3D tilt on product cards | `TiltedCard` |
| Infinite marquee | `InfiniteScroll` / Lightswind marquee |
| Scroll progress bar | Lightswind scroll progress |
| Click burst | `ClickSpark` |

Everything is reproduced in dependency-free CSS and vanilla JS so you can judge the *feel* before any library is installed. **Component names should be verified against the current ReactBits and Lightswind docs before the build** — those libraries iterate quickly and I have not fetched their current catalogues.

**Strengths**
- Feels alive and contemporary in a way none of the other five do. The brief said "not stiff" and this is the direct answer.
- Bento cards are genuinely well-suited to this content: four chain steps, four signature drinks, four SKUs, two outlets all fit the pattern naturally.
- Both libraries are React/Tailwind, so they drop into the planned Next.js stack with no friction.
- Fastest to assemble visually — most of these components are copy-paste, which is real schedule value.
- The ambient red is a clever way to have red everywhere without spending contrast on it.

**Weaknesses**
- **Performance is the serious risk, and it lands squarely on this audience.** Several ReactBits backgrounds render through WebGL (OGL/Three.js), which adds substantial bundle weight and continuous GPU load. On the mid-range Android phones that dominate Indonesian traffic, that means battery drain, thermal throttling and a slower LCP. The aurora in this prototype is pure CSS precisely to avoid that — if the real build reaches for the WebGL variants, the performance section of `future-scope.md` stops being achievable.
- **It is the least brand-specific of the six.** Swap the logo and the palette and this could be any modern startup. Concepts 02, 03 and 05 could only be Jangkar. That is the central trade: fluidity bought with distinctiveness.
- It breaks the motion budget in `design-system.md` §6 (two moving things per screen) and the `radius: 0` rule in §5. Both deliberately — but the system would need formally amending, not quietly ignoring.
- Heavy motion has real accessibility weight. This prototype honours `prefers-reduced-motion` fully and degrades to a clean static page, and that discipline must survive into production, where it is usually the first thing dropped.
- Pointer-driven effects — spotlight, tilt, magnet — do nothing on touch, which is most of your traffic. Half the personality is invisible to the majority of users.
- Ages on the same clock as the libraries themselves. This is very 2025–26.

**Best suited for** a brand that wants to read as modern and digital-first, and a team happy to keep up with library churn.

**Risks** Performance on mid-range Android; genericness; motion becoming decoration rather than communication.

**How well it represents Jangkar** Represents the *ambition* well and the *specificity* poorly. It says "modern brand" convincingly, which is exactly what the brief asked for — but it says less about Semendo, the roastery, and Palembang than 02 or 03 do. Worth noting that the brand analysis found a working, unpretentious, high-volume business; this is the most polished register of the six, and polish and warmth are not the same thing.

---

## Assessment

| | Brand fit | Business fit | Distinctive | Scales | Build cost | Ages well |
|---|---|---|---|---|---|---|
| 01 Manifest | ●●●●○ | ●●●○○ | ●●●○○ | ●●●●○ | Low | ●●●●○ |
| **02 Dockyard** | ●●●●○ | **●●●●●** | ●●●●○ | **●●●●●** | Medium | ●●●●○ |
| 03 Ensign | ●●●●○ | ●●●○○ | ●●●○○ | ●●○○○ | Low | ●●●○○ |
| 04 Semendo | ●●○○○ | ●●○○○ | ●●●○○ | ●●●○○ | Low | ●●●●● |
| 05 Keliling | ●●○○○ | ●●●○○ | **●●●●●** | ●●○○○ | High | ●●○○○ |
| 06 Arus | ●●●○○ | ●●●○○ | ●●○○○ | ●●●●○ | Low–medium¹ | ●●○○○ |

¹ Build cost is low *if* the CSS-based components are used. It rises sharply if the WebGL backgrounds are, and so does the performance bill.

---

## Recommendation — not locked

**Recommended: 02 Dockyard, with the hero and section rhythm of 01 Manifest.**

The reasoning, in one line: **02 is shaped like the business; 01 is shaped like the brand.** The business is a five-part supply chain with a catalogue, two sales channels, SKUs and stock states — 02 is the only concept whose structure already matches that, and the only one that still works when the menu reaches 30 items and the outlets reach twelve. But 02 opens coldly, and a homepage has about three seconds to say what the company is.

Concretely, the hybrid would be:

- **From 01** — the hero. Big declarative type, deep negative space, no spec table above the fold. Plus its slower section rhythm at the top of the page.
- **From 02** — everything below the fold. The visible grid, labelled bays, the spec table for the menu with SKU codes and channel flags, the cell-based roastery catalogue, mono for all data.
- **From 03** — one idea only: the single inverted white section. Used once, for the menu, it gives the long dark page a spine.
- **From 05** — one idea only: the schedule board treatment for Keliling, minus the marquee and the skew.
- **From 04** — nothing site-wide. Hold it for the Gold Series product pages later.

That is a real proposal, not a committee compromise: a warm editorial opening over a technical body, which is what a company called *Coffee Industry* with an 8,000-rupiah signature drink actually is.

### Reasonable alternatives

- **If you want maximum brand recognition and print continuity** → 03 Ensign. It is the most usable across cups, signage and the carts, and the easiest for a small team to keep consistent.
- **If growth is coming from Instagram and the Keliling carts** → 05 Keliling. Wrong for the brand architecture you just confirmed, but right for the audience — and you could run it as `/keliling` only.
- **If you disagree that the roastery is the future** → 01 Manifest alone. The most elegant single-concept answer, and the cheapest to build well.
- **If the motion direction is what you want** → 06 Arus, with two conditions attached. First, restrict yourself to the CSS-based components and refuse the WebGL backgrounds; on mid-range Android in Palembang they will cost you more in bounce rate than they earn in impression. Second, borrow structure from 02 — keep the bento and the motion, but let the menu be a real table with SKU codes and channel flags, so the page still carries the catalogue properly as it grows.

### A note on combining 06 with the recommendation

06 is not mutually exclusive with the 02 + 01 hybrid. The most defensible version of "modern but not stiff" is: **02's structure, 01's hero, 06's motion layer.** Keep the visible grid and the spec table; keep the editorial opening; then add scroll reveals, the spotlight highlight on cards, and the animated counters on top. That gets fluidity without giving up the specificity that makes the site recognisably Jangkar rather than recognisably 2026.

What I would *not* do is take 06 wholesale and let the components dictate the layout. That is how a site ends up looking like every other site built from the same library — which is the same failure mode as the café template, arriving from the opposite direction.

### Two things worth saying plainly

**Photography decides this more than layout does.** No real product or environment photography exists yet — the renders are mockups, and the menu art still carries a Canva watermark. Concept 02 is the most forgiving if the reshoot slips; 03 and 05 are the most exposed. Whichever direction you pick, budget the dark-studio shoot before production starts.

**One question outranks the design choice: does the site sell online, or route to WhatsApp / Shopee / Tokopedia?** If it sells, `/roastery` becomes a storefront with cart and orders, and the admin panel roughly doubles. That changes the build far more than the choice between these five.

---

## What I need from you

1. **Pick a direction** — one of the five, the hybrid, or a combination of your own.
2. **Tell me what you disliked**, not only what you liked. Which parts felt wrong is more useful than which felt right.
3. **Answer the online-selling question.** It shapes the architecture more than anything else here.
4. Optionally, resolve any of the open questions in `brand-analysis.md` §12.

Nothing proceeds to production until you choose.
