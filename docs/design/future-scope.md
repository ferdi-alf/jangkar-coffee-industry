# Future Scope — Data, Admin, and Non-Visual Concerns

**Documentation only. Nothing here is implemented, and nothing should be until a design direction is chosen.**

No Supabase project, no schema, no migrations, no auth, no packages. This file records what the assets imply so the conversation can happen later with evidence behind it.

---

## 1. Domain entities

Derived from the two printed menus and the three product assets. **Shapes and relationships only — no schema, no column types.**

### Core

**`product`** — the central entity. One catalogue serving both channels.

Evidenced by: the Keliling menu is a strict subset of the outlet menu with identical prices. That is one catalogue with availability flags, not two menus. Getting this wrong is the most expensive mistake available at this stage.

Carries: name, slug, description, category, base price, signature flag, availability per channel, sort order, image reference.

**`category`** — the five that already exist in print: Signature Series, Black & White Coffee, Non-Coffee, Snacks, Roastery Corner. Ordered, and the order is meaningful — Signature leads on the printed menu.

**`product_variant`** — because size variants are already real:
`Kopi Bubuk 80gr / 200gr` · `Robusta Gold Series 250gr` · `Roasted Beans per 100gr` · `Kopi Susu Jangkar 1 Liter` · `Gula Aren 1 Liter`.

Note the beans are priced *per unit weight*, not per pack — the model needs to express both.

**`modifier`** — also already real: `Upgrade to Oatside +4k`, `FREE Extra Shot`. Priced, optional, attachable to products.

**`channel`** — `outlet` and `keliling` today. Products are available on one or both. Adding `online` later should not require restructuring.

### Places

**`outlet`** — name, address, coordinates, hours, HQ flag, photo, status. One confirmed: `HQ Sako, Jln Siaran No 745B`.

**`keliling_unit`** — the carts themselves. Unknown count.

**`keliling_schedule`** — the only entity with a time dimension: unit, location, day or date, start and end time, status. Must handle "no schedule this week" gracefully; that state will occur.

### Content

**`page_section`** — homepage content the owner should be able to edit without a developer: hero line, the four chain steps, featured products, the CTA.

**`media`** — every image, with alt text as a required field rather than an optional one. Alt text is an accessibility requirement and a real SEO asset, and it is far cheaper to enforce from the first upload than to retrofit.

**`event`** and **`promotion`** — implied by the brief, not evidenced in the assets. Both are date-bounded. Keep them out of the first build unless the owner confirms a real programme.

### Admin

**`admin_user`** — Supabase Auth. Roles at minimum `owner` and `staff`; a barista updating a sold-out flag should not be able to edit homepage copy.

**`audit_log`** — worth having from day one in a multi-person operation. Cheap to add early, tedious to add later.

### Conditional — only if the site sells online

**`order`**, `order_item`, `customer`, `shipping_zone`, `payment`.

**This is the fork in the road.** If the site sells, the admin panel roughly doubles and `/roastery` becomes a storefront. If it routes to WhatsApp / Shopee / Tokopedia, none of these exist and the build is far smaller. **This question needs answering before any schema work.**

### Relationship sketch

```
category ──< product >── channel        (many-to-many via availability)
              │  │
              │  └──< product_variant
              └──< product_modifier >── modifier

outlet ──< outlet_hours
keliling_unit ──< keliling_schedule >── location

media ──< (product | outlet | page_section)
admin_user ──< audit_log
```

---

## 2. Admin panel scope

The principle: **the owner should never need a developer to change something that changes weekly.**

### Must be manageable

| Area | What changes | How often |
|---|---|---|
| **Products** | Price, availability, sold-out, description, photo | Weekly |
| **Categories** | Order, naming | Rarely |
| **Variants and modifiers** | Sizes, add-ons, prices | Monthly |
| **Outlets** | Address, hours, photos, temporary closures | Monthly |
| **Keliling schedule** | Where the cart is, when | **Daily** |
| **Homepage content** | Hero line, chain steps, featured products | Monthly |
| **Media** | Upload, replace, alt text | Ongoing |
| **Contact details** | Phone, socials, addresses | Rarely |

### Two priorities worth naming now

**Sold-out toggle must be the fastest action in the panel.** The printed menu already has a struck-through item, so this is a real daily need. It should be reachable in one tap from the panel home, on a phone, by a barista — not buried in a product edit form.

**The Keliling schedule is the only daily-changing content on the site.** It deserves a purpose-built weekly view, not a generic CRUD table. If it is tedious to update it will go stale, and a stale schedule is worse than no schedule.

### Explicitly out of scope for phase one

Analytics dashboards, customer accounts, loyalty, inventory management, POS integration, multi-language content management. Each is defensible later; none is evidenced now.

---

## 3. SEO

Preliminary only. These must not distort the visual direction — but a few of them shape markup, so they are cheaper to honour from the start.

**Local search is the whole game.** This is a Palembang business. The realistic queries are *kopi Palembang*, *kopi susu Sako*, *kopi keliling Palembang*, *kopi bubuk Semendo*. That means:

- Bahasa Indonesia as the primary content language
- `LocalBusiness` structured data per outlet, with real coordinates and hours
- `Product` structured data for the roastery SKUs, with price and availability
- Google Business Profile alignment — name, address and phone identical to the site, character for character
- Real address text in the HTML, not baked into an image

**Structural requirements**

- One `h1` per page, heading levels never skipped
- Unique `title` and `meta description` per route
- Canonical URLs; `/id/` and `/en/` with `hreflang` if the site goes bilingual
- `sitemap.xml`, `robots.txt`, Open Graph and Twitter cards
- `BreadcrumbList` on nested routes

**Content that already exists and is worth ranking on:** Semendo origin, Robusta, Palembang, HALAL certification, "kopi keliling pertama di Palembang", and the full price list. Prices in crawlable text are a genuine advantage in this market.

---

## 4. Semantic HTML

All five prototypes already use `header` / `main` / `section` / `footer`, `nav` with `aria-label`, `address` for addresses, `dl` for fact pairs, and a real `table` for the Dockyard menu. Carry that into production:

- Buttons that act are `<button>`; things that navigate are `<a>`
- Menu category groups get accessible names
- Decorative placeholders carry `aria-hidden="true"`
- Prices stay as text, never as images

---

## 5. Mobile-first and responsive

**Indonesian traffic is overwhelmingly mobile, often on mid-range Android over congested networks.** That is the design target, not a fallback.

- Breakpoints `640 / 900 / 1200 / 1440`, mobile styles as the base
- Touch targets ≥44px; primary buttons 52px on mobile
- No horizontal page scroll; wide tables scroll inside their own container
- Concepts 03 and 05 need the most breakpoint testing — centred bands and skewed sections are the most fragile
- Test at 360px width, the realistic floor

---

## 6. Image optimisation

The heaviest performance risk, and today the assets are `4.4MB` and `7087×7087`.

- Next.js `<Image>` with AVIF and WebP, sized to real layout dimensions
- Ship nothing wider than `1920px`; product cutouts at `1200px`
- Fixed aspect ratios reserved in CSS so nothing shifts on load — `4:5` product, `16:9` environment, `1:1` portrait
- Lazy-load everything below the fold; the hero image is the only priority load
- Alt text required at upload, enforced in the admin

---

## 7. Performance

Targets: **LCP < 2.5s on 4G, CLS < 0.1, INP < 200ms.**

The dark palette helps — no large bright hero images to download. The main costs will be fonts and photography.

- Self-host fonts in production rather than using the Google CDN; subset to Latin; `font-display: swap`; preload only the display face used above the fold
- Variable fonts where possible — Concept 01 and 02 use one Archivo file across every weight and width, which is a real saving
- Static generation for all content pages; ISR for the Keliling schedule
- No animation library. Every effect in these prototypes is CSS

---

## 8. Accessibility

The floor is set in `design-system.md` §7 and is already met by all five prototypes:

- Body text ≥4.5:1, large text and UI ≥3:1 — verified by measurement, not assumption
- `--red` `#BE0909` never used for body copy on dark; `--red-lift` `#EF2B2B` instead
- Visible focus on every interactive element
- Colour never carries meaning alone — sold-out items are struck through *and* labelled
- `prefers-reduced-motion` honoured, including the Concept 05 marquee
- Keyboard-navigable throughout; the Concept 05 scroll rail needs explicit keyboard support if that direction is chosen

**Language attributes matter here.** Indonesian content needs `lang="id"`. If the site goes bilingual, mixed-language passages need inline `lang` attributes or screen readers will mispronounce them.

---

## 9. Repository shape — proposed, not created

```
/
├── web/          Next.js customer site
├── admin/        Next.js admin panel
├── docs/
│   └── design/   (this documentation)
├── prototypes/   (throwaway — delete once a direction is chosen)
└── jangkar-coffee-reference/   (source assets)
```

**Open question:** whether `web` and `admin` share a package via a monorepo, or stay fully independent. Shared Supabase types and a shared design-token package argue for a monorepo; simplicity argues against. Worth deciding once, before either app exists — but not now.
