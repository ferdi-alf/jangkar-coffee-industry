# Information Architecture — Proposal

**Phase 4 output. Proposal, not a decision.**

---

## 1. The reasoning

The brief offered a candidate structure — Home / About / Menu / Outlets / Keliling / Contact — and explicitly said not to use it blindly. Having read the assets, I would not use it, for one reason:

**That structure describes a café. The assets describe a supply chain.**

`Roastery Corner` on the outlet menu sells `Kopi Bubuk 80gr`, `Kopi Bubuk 200gr`, `Robusta Gold Series 250gr` and `Robusta Roasted Beans`. Three of the eight brand assets are packaged retail goods. The company name ends in *Industry*. A "Menu" page buries the roastery inside a drinks list, which is the wrong shape for the business — packaged coffee is a separate business line with a different customer, a different purchase cycle and a different unit economics.

So the IA splits what the café structure fuses:

| Café IA (rejected) | Proposed IA | Why |
|---|---|---|
| Menu (everything) | **Menu** (drinks + snacks) | What you order at an outlet |
| — | **Roastery** (packaged coffee) | What you buy and take home |
| About | **Industry** | The chain, not a founder story |
| Outlets | **Outlets** | Unchanged; it works |
| Keliling | **Keliling** | Unchanged; it works |

That single split is the substantive IA recommendation. Everything else follows from it.

---

## 2. Proposed structure

```
/                       Home
/industri               Industry — origin → roastery → outlet → cart
/menu                   Menu — drinks + snacks, filterable by channel
/roastery               Roastery — packaged coffee, the product line
  /roastery/[slug]      Product detail
/outlet                 Outlets — index
  /outlet/[slug]        Outlet detail
/keliling               Jangkar Keliling — mobile operation
/kontak                 Contact
```

Seven top-level destinations. Five in the primary navigation.

### Navigation

**Primary (header):** `Industri` · `Menu` · `Roastery` · `Outlet` · `Keliling`

Contact is not in the primary nav. It sits as a persistent right-hand CTA (`Hubungi` / WhatsApp) and in the footer. Contact pages are a destination people look for only when they already want something — spending a primary nav slot on it wastes the most valuable real estate on the site.

Five items is deliberate. Six or more and a mobile header starts to need a hamburger for a site this small; five fits and stays scannable.

### URL language

Slugs are in Bahasa Indonesia (`/industri`, `/outlet`, `/kontak`) on the assumption that the audience is Palembang-local and search intent is Indonesian. **[ASK]** If the site goes bilingual, this becomes `/id/*` and `/en/*` and the decision needs making before build, not after.

---

## 3. Homepage — sequence and intent

The brief's test: it must not read as *"Welcome to our coffee shop."* It must read as *a modern brand that happens to make coffee.*

Practically, that means the first screen states **what the company is**, not **where it is** or **how welcome you are**.

| # | Section | Job | Content source |
|---|---|---|---|
| 1 | **Hero** | Assert the company. Mark A + one declarative line. No greeting, no "welcome". | Brand |
| 2 | **The chain** | The industry claim in four steps: Semendo → Roastery → Outlet → Keliling. This is the differentiator and it goes high. | Menu, packaging |
| 3 | **Signature** | 4 items with prices — Kopi Susu Jangkar 8k leads. Proof of product, and price is a competitive fact. | Outlet menu |
| 4 | **Roastery** | Packaged coffee as a business line, not a souvenir. Gold Series 250gr 35k. | Products 1–3 |
| 5 | **Outlets** | Where to find us. HQ Sako first. | Outlet menu |
| 6 | **Keliling** | The mobile operation, with its own visual register and a live "where today" slot. | Keliling menu |
| 7 | **Origin** | Semendo, South Sumatra. Robusta. The credibility anchor. | Packaging |
| 8 | **CTA** | One action, not four. WhatsApp is the realistic conversion. | Contact |
| 9 | **Footer** | Contact, hours, socials, addresses. | Both menus |

Two structural notes:

- **Section 2 before section 3.** The chain outranks the product list. If the drinks come first, the page is a café page again regardless of how it is styled.
- **Section 6 is allowed to break the system.** Keliling has its own logo, its own energy and its own audience. A visual gear-change there is a feature — it demonstrates that the master brand is a system with room in it, not a single flat style.

---

## 4. Page-level notes

### `/menu`
One catalogue, two channels. The printed menus already prove the model: the Keliling menu is a strict subset of the outlet menu with identical prices. So this is **one product list with an availability flag per channel**, surfaced as a filter — `Semua` / `Outlet` / `Keliling` — not two separate menus.

Must carry: the five categories, price tiers, size variants (1 Litre, 80gr/200gr/250gr), the modifier notes (`Upgrade to Oatside +4k`, `FREE Extra Shot`), signature flags, and a sold-out state — all of which already exist in print.

### `/roastery`
The commercial question that shapes this page is unresolved: **does the site sell, or does it route out to WhatsApp / Shopee / Tokopedia?** Until that is answered, the page is designed as a catalogue with a per-product CTA slot that can hold either a cart button or an outbound link. That keeps the layout stable under either answer, which is the right hedge — but it is a hedge, and the answer is needed before build.

### `/outlet`
Needs per-outlet: name, address, hours, map link, photo, and a `HQ` flag. HQ Sako is confirmed; the rest is unknown. **[ASK]** how many trade today.

### `/keliling`
The only page with a time dimension. Needs a schedule or route block, and it should degrade gracefully when nothing is scheduled — an empty state is guaranteed to occur and designing for it now costs nothing. Carries the "first mobile coffee in Palembang" claim and the `NGOPI NIKMAT, KEMBALIKAN SEMANGAT` tagline.

### `/industri`
Not an About page in the usual sense. No founder portrait, no origin anecdote unless one is supplied. It is the chain, told as a sequence, with the Cap Jangkar 999 crest placed here as the heritage artefact — this is the natural home for the component the owner asked to place.

---

## 5. Deliberately excluded

- **Blog / Journal** — a content commitment nobody has agreed to staff. An unmaintained blog dated 2026 is worse than no blog.
- **Gallery** — a page of photographs with no argument. The images belong inside the sections they support.
- **Events / Promotions as top-level** — real, but low-volume. Better as a homepage slot plus a listing under Keliling or Outlets until volume justifies a page.
- **Careers, FAQ, Testimonials** — no supporting material in the assets. Add when there is something true to put in them.

Each of these can be promoted later. Starting with fewer, fuller pages is the correct bet for a site this size.

---

## 6. Open questions that change this IA

1. **Does the site sell online?** If yes, `/roastery` becomes a storefront with cart, checkout and order management, and the admin panel roughly doubles in scope. This is the biggest single unknown.
2. **Bilingual?** Determines routing shape before build.
3. **How many outlets?** Under three, `/outlet` may fold into a homepage section rather than a page.
4. **Is there an events programme?** If yes, it earns a top-level slot.
5. **Ordering or reservations?** Nothing in the assets suggests either, but it would change the CTA model site-wide.
