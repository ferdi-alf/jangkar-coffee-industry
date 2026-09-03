/**
 * Daftar menu, disalin dari kedua menu cetak yang asli.
 *
 * SENGAJA TIDAK IKUT DITERJEMAHKAN. Nama produk adalah nama diri, dan nama
 * kategori pada menu cetaknya memang sudah berbahasa Inggris. Menerjemahkan
 * "Kopi Susu Jangkar" jadi sesuatu yang lain justru salah. Yang diterjemahkan
 * hanya teks antarmuka di sekitarnya, dan itu hidup di i18n/dictionaries.
 *
 * Seluruh isi berkas ini [FACT], dari menu-outlet.JPG, menu-jangkar-keliling.PNG,
 * dan brand-analysis.md §6. Tahap C memindahkannya ke tabel `product`,
 * `product_translation`, `product_variant`, dan `product_channel`.
 *
 * `soldOut` bukan hiasan. Americano dicoret di menu cetaknya, dan brand-analysis
 * mencatat status habis itu sudah dipakai sungguhan. Dirender dicoret DAN
 * berlabel, karena warna tidak boleh jadi satu-satunya pembawa makna.
 */

export interface MenuItem {
  name: string;
  price: string;
  /** Bertanda jempol di poster Keliling. */
  favourite?: boolean;
  soldOut?: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

/** Menu outlet HQ Sako. Lima kategori, 33 item. */
export const OUTLET_MENU: MenuCategory[] = [
  {
    id: "signature",
    name: "Signature Series",
    items: [
      { name: "Kopi Susu Jangkar", price: "8k" },
      { name: "Jangkar Latte (No SKM)", price: "8k" },
      { name: "Kopi Susu Gula Aren", price: "10k" },
      { name: "Jangkar Gold Latte", price: "15k" },
    ],
  },
  {
    id: "black-white",
    name: "Black & White Coffee",
    items: [
      { name: "Americano / Long Black", price: "8k", soldOut: true },
      { name: "Kopi Tubruk (Tanpa Gula)", price: "8k" },
      { name: "Kopi Tubruk Manis / Susu", price: "10k" },
      { name: "Kopi Milo", price: "10k" },
      { name: "Salted Caramel Latte", price: "12k" },
      { name: "Vietnam Drip", price: "12k" },
      { name: "Butterscotch Latte", price: "15k" },
      { name: "Choco Caramel Latte", price: "15k" },
      { name: "Black Charcoal Latte", price: "15k" },
      { name: "Avocado Coffee Latte", price: "15k" },
      { name: "Manual Brew / Japanese", price: "20k" },
      { name: "Kopi Susu Jangkar 1 Liter", price: "45k" },
      { name: "Kopi Susu Gula Aren 1 Liter", price: "55k" },
    ],
  },
  {
    id: "non-coffee",
    name: "Non-Coffee",
    items: [
      { name: "Mineral Water", price: "5k" },
      { name: "Lemon Tea", price: "8k" },
      { name: "Teh Tarik", price: "10k" },
      { name: "Signature Chocolate", price: "10k" },
      { name: "Matcha Latte", price: "12k" },
      { name: "Wedang Uwuh", price: "12k" },
      { name: "Red Velvet Latte", price: "15k" },
      { name: "Taro Creme Latte", price: "15k" },
    ],
  },
  {
    id: "snacks",
    name: "Snacks",
    items: [
      { name: "Tahu Bakso Ikan", price: "12k" },
      { name: "Donat Kentang Mini", price: "12k" },
      { name: "Singkong Keju", price: "12k" },
      { name: "Kentang Goreng", price: "12k" },
    ],
  },
  {
    id: "roastery-corner",
    name: "Roastery Corner",
    items: [
      { name: "Kopi Bubuk 80gr", price: "9k" },
      { name: "Kopi Bubuk 200gr", price: "18k" },
      { name: "Robusta Gold Series 250gr", price: "35k" },
      { name: "Robusta Roasted Beans", price: "15k / 100gr" },
    ],
  },
];

/**
 * Menu Jangkar Keliling. Bagian yang dikurangi dengan sengaja: 6 kopi, 4
 * non-kopi, tanpa snack, tanpa roastery, tanpa kemasan satu liter.
 *
 * Harganya sama persis dengan outlet di setiap item yang beririsan, dan itu
 * fakta struktural yang paling penting di kedua menu: satu daftar harga, dua
 * format layanan. Modelnya nanti satu katalog dengan penanda ketersediaan per
 * kanal, bukan dua menu terpisah.
 */
export const KELILING_MENU: MenuCategory[] = [
  {
    id: "coffee",
    name: "Coffee",
    items: [
      { name: "Kopi Susu JangkaR", price: "8k", favourite: true },
      { name: "Americano", price: "8k" },
      { name: "Kopi Susu Gula Aren", price: "10k" },
      { name: "Kopi Milo", price: "10k" },
      { name: "Salted Caramel Latte", price: "12k" },
      { name: "Jangkar Gold Latte", price: "15k", favourite: true },
    ],
  },
  {
    id: "non-coffee",
    name: "Non-Coffee",
    items: [
      { name: "Lemon Tea", price: "8k" },
      { name: "Teh Tarik", price: "10k" },
      { name: "Signature Chocolate", price: "10k" },
      { name: "Matcha Latte", price: "12k", favourite: true },
    ],
  },
];

/**
 * Dua marketplace, dan hanya dua. Konteks bisnis di PROJECT-SPEC mengunci ini:
 * Jangkar bukan marketplace, situsnya hanya menunjuk ke Shopee dan Tokopedia.
 */
export const MARKETPLACES = ["shopee", "tokopedia"] as const;
export type Marketplace = (typeof MARKETPLACES)[number];

export interface EcommerceProduct {
  sku: string;
  name: string;
  price: string;
  image: string;
  /**
   * Tautan toko per marketplace, DIISI DARI PANEL ADMIN.
   *
   * Sengaja kosong sekarang, dan sengaja tidak ditebak. Aturan proyek melarang
   * mengarang data bisnis di halaman publik, dan URL toko termasuk di dalamnya.
   * Marketplace yang tautannya belum ada tetap dapat tombol, tombolnya cuma
   * tidak menavigasi ke mana pun. Begitu tabel `product_marketplace_link` terisi,
   * tombolnya jadi tautan sungguhan tanpa perlu menyentuh kode ini.
   */
  links: Partial<Record<Marketplace, string>>;
}

/** Produk yang juga dijual di Shopee dan Tokopedia. Tiga, bukan empat. */
export const ECOMMERCE_PRODUCTS: EcommerceProduct[] = [
  {
    sku: "RST-080",
    name: "Kopi Bubuk 80gr",
    price: "Rp 9.000",
    image: "/roastery/kopi-bubuk-80gr.webp",
    links: {},
  },
  {
    sku: "RST-200",
    name: "Kopi Bubuk 200gr",
    price: "Rp 18.000",
    image: "/roastery/kopi-bubuk-200gr.webp",
    links: {},
  },
  {
    sku: "RST-G250",
    name: "Robusta Gold Series 250gr",
    price: "Rp 35.000",
    image: "/roastery/gold-series-250gr.webp",
    links: {},
  },
];

/**
 * HQ Sako. Alamat, telepon, situs, dan Instagram semuanya [FACT].
 *
 * KOORDINAT MASIH PERKIRAAN. Pemilik proyek akan memberikan yang tepat. Sampai
 * itu datang, peta dipusatkan ke Sako sebagai gambaran, dan tombol navigasi
 * memakai ALAMAT TEKS yang terverifikasi, bukan koordinat ini, supaya
 * pengunjung tetap sampai ke tempat yang benar meski pin masih kasar.
 */
export const HQ = {
  name: "Sako",
  address: "Jln Siaran No 745B, Sako, Palembang",
  hours: "07.00 sampai 23.00, setiap hari",
  coords: { lat: -2.9376, lng: 104.7754, approximate: true },
  mapsQuery: "Jangkar Coffee Industry, Jln Siaran No 745B, Sako, Palembang",
  phone: "0899 999 3030",
  phoneHref: "tel:+628999993030",
  whatsapp: "https://wa.me/628999993030",
  site: { label: "kopijangkar.com", href: "https://www.kopijangkar.com" },
  instagram: { label: "@jangkarkeliling.id", href: "https://instagram.com/jangkarkeliling.id" },
};
