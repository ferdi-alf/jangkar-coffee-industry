import type { Dictionary } from "./id";

/**
 * Kamus bahasa Inggris.
 *
 * Bertipe `Dictionary` yang diturunkan dari kamus Indonesia, jadi satu kunci
 * yang hilang atau salah nama akan menggagalkan `npm run typecheck`. Itu pagar
 * yang mencegah terjemahan tertinggal tanpa ada yang sadar.
 *
 * Nama produk, kategori menu, dan harga TIDAK ada di sini. Semuanya nama diri
 * atau data, dan sudah berbahasa Inggris di menu cetaknya.
 */
const en: Dictionary = {
  nav: {
    aria: "Main navigation",
    items: {
      industri: "Industry",
      menu: "Menu",
      roastery: "Roastery",
      outlet: "Outlets",
      keliling: "Mobile",
    },
    contact: "Contact",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    language: "Choose language",
  },
  hero: {
    eyebrow: "Jangkar Coffee Industry",
    headline: { before: "Coffee that ", accent: "travels", after: " from farm to glass." },
    lede: "One chain we hold end to end: the Semendo farm, the Sako roastery, the city outlet, and the mobile fleet.",
    cta: "Follow the chain",
    stats: {
      price: "From, per glass",
      items: "Menu items",
      stages: "Chain stages",
      origin: "Sumatran robusta",
    },
  },
  chain: {
    eyebrow: "Production chain",
    heading: { line1: "Four stages,", line2: "one pair of hands" },
    cards: {
      kebun: { title: "Semendo farm", body: "Highland robusta, bought straight from the growers." },
      roastery: { title: "Sako roastery", body: "Small batch roasting. The profile stays ours." },
      outlet: { title: "Outlet", body: "A fixed shop with the full menu, every day." },
      keliling: { title: "Mobile fleet", body: "Carts that reach the city one stop at a time." },
    },
  },
  about: {
    eyebrow: "About us",
    heading: { line1: "Coffee held", line2: "end to end" },
    body: [
      "Jangkar Coffee Industry works out of Palembang as a coffee industry, not a shop that happens to sell coffee. Brewing is only the last part of it: beans are bought from farms in Semendo, roasted at the Sako roastery, then move on to the outlet, to the mobile fleet, and into packaging you can carry home.",
      "Holding the whole chain is a decision, not an accident. Every stage handed to someone else is a stage whose taste we can no longer answer for. As long as the chain stays in our own hands, questions about where a bean came from, when it was roasted, and how it should be brewed always have an answer.",
    ],
    present: "now",
    timelineHeading: "How it came together",
    timelineAria: "Jangkar Coffee Industry timeline",
    timeline: {
      sangrai: {
        title: "First roast in Sako",
        subtitle: "Sako roastery",
        body: "One small machine, one profile, and orders that travelled by word of mouth.",
      },
      gerai: {
        title: "The first outlet opens",
        subtitle: "Jln Siaran, Sako",
        body: "A full menu every day, and the place where people began to recognise the taste.",
      },
      keliling: {
        title: "The mobile fleet rolls out",
        subtitle: "Jangkar Keliling",
        body: "Coffee that goes to the gathering points of the city instead of waiting to be found.",
      },
      kemasan: {
        title: "Coffee goes into packaging",
        subtitle: "Shopee and Tokopedia",
        body: "Beans and ground coffee to carry home, and later onto the marketplaces.",
      },
      kebun: {
        title: "All the way to Semendo",
        subtitle: "Semendo, Muara Enim",
        body: "Buying straight from the farmers, and the chain finally closes.",
      },
    },
  },
  menu: {
    eyebrow: "Outlet menu",
    heading: { line1: "All of it,", line2: "exactly as it is" },
    lede: "The full board as it hangs at HQ Sako. The same prices apply on the mobile fleet for anything it carries.",
    soldOut: "Sold out",
    notes: ["Upgrade to Oatside +4k", "Free extra shot"],
  },
  roastery: {
    eyebrow: "Roastery",
    heading: { line1: "Coffee you", line2: "take home" },
    marketplace: "All three are sold on Shopee and Tokopedia.",
    buy: {
      at: "Buy on",
      unavailable: "Shop link not set yet.",
    },
    heritage: {
      title: "Kopi Bubuk Semendo, Cap Jangkar 999",
      body: "The old mark still rides on the ground coffee packs. It lives on the product, not across the whole page.",
    },
  },
  outlet: {
    eyebrow: "Outlets",
    heading: "Fixed points",
    chip: "Headquarters",
    directions: "Open in Google Maps",
    mapLabel: "Map of HQ Sako",
    mapPending: "The pin is still approximate. The directions button uses the full address.",
  },
  keliling: {
    eyebrow: "Jangkar Keliling",
    heading: { line1: "Good coffee,", line2: "spirit restored" },
    lede: "Carts carry the core menu out to the city. Prices match the outlet.",
    menuHeading: "Cart menu",
    favourite: "Favourite",
    today: { label: "Where today", value: "Stop schedule coming soon" },
    logo: "/brand/keliling-logo.webp",
    logoAlt: "Jangkar Keliling logo",
  },
  origin: {
    eyebrow: "Where the beans start",
    heading: "Semendo, South Sumatra",
    body: "Highland robusta from gardens in Muara Enim. Bought straight from the growers, roasted in Sako, Palembang.",
    image: "/rantai/kebun-semendo.webp",
    imageAlt: "Terraced coffee gardens on a Semendo hillside, morning mist sitting in the valley, a farmer walking between the rows.",
  },
  contact: {
    eyebrow: "Contact",
    heading: "Let us talk coffee",
    lede: "Orders, wholesale, resellers, and event work go straight to the Sako team.",
    cta: "Chat on WhatsApp",
    form: {
      heading: "Send a message",
      lede: "For bulk orders, wholesale, or collaborations that need a longer explanation.",
      name: "Name",
      namePlaceholder: "Your name",
      email: "Email",
      emailPlaceholder: "name@email.com",
      message: "Message",
      messagePlaceholder: "Tell us what you need",
      submit: "Send message",
      sending: "Sending",
      errors: {
        nameRequired: "Name is required.",
        nameTooLong: "Name can be at most 80 characters.",
        emailRequired: "Email is required.",
        emailInvalid: "That email does not look right.",
        messageRequired: "Message is required.",
        messageTooShort: "Message must be at least 10 characters.",
        messageTooLong: "Message can be at most 2000 characters.",
      },
      success: "Message sent. The Sako team will reply by email.",
      failure: "The message could not be sent. Try again, or reach us on WhatsApp.",
      rateLimited: "Too many attempts. Wait a few minutes and try again.",
      invalidNotice: "Something needs fixing:",
    },
  },
  footer: {
    tagline: "A Palembang coffee industry, from the Semendo farm to the mobile fleet.",
    explore: "Explore",
    places: "Places",
    contact: "Contact",
    hq: "Roastery and HQ",
    farm: "Farm",
    farmValue: "Semendo, Muara Enim, South Sumatra",
    shop: "Jangkar packaged coffee is sold on Shopee and Tokopedia.",
    shopNote: "Store links coming soon.",
  },
  marquee: ["Semendo", "Roastery", "Outlet", "Mobile", "Halal Indonesia", "Small batch"],
  meta: {
    title: "Jangkar Coffee Industry, Semendo Robusta Coffee, Palembang",
    description:
      "A Palembang coffee industry. Robusta from the Semendo highlands, roasted in house at Sako, served at the outlet and by the mobile fleet.",
  },
};

export default en;
