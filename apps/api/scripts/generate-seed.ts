/**
 * Membangkitkan SQL seed DARI BERKAS SUMBER YANG SUDAH ADA, bukan mengetik
 * ulang isinya.
 *
 *   npx tsx apps/api/scripts/generate-seed.ts > supabase/migrations/<stempel>_seed.sql
 *
 * KENAPA DIBANGKITKAN, BUKAN DITULIS TANGAN. Menu outlet punya 33 item dan menu
 * keliling 10 item, semuanya sudah ada di modules/home/constants/menu-data.ts
 * dan sudah diverifikasi terhadap menu cetaknya. Mengetiknya ulang sebagai SQL
 * berarti membuat salinan kedua yang bisa menyimpang diam-diam, dan satu typo
 * pada harga tidak akan ketahuan siapa pun sampai ada pelanggan yang membayar
 * salah.
 *
 * KELUARANNYA SQL BIASA yang dicommit ke supabase/migrations/, jadi hasilnya
 * tetap bisa dibaca dan ditinjau di git. Skrip ini yang tidak dijalankan lagi
 * setelah itu.
 *
 * Ia mengimpor lintas workspace ke apps/web, dan itu memang disengaja untuk
 * alat sekali pakai seperti ini: sumber kebenarannya ada di sana. Ia TIDAK ikut
 * dikompilasi ke dist, hanya dijalankan tsx saat dibutuhkan.
 */
import dictId from "../../web/i18n/dictionaries/id.js";
import dictEn from "../../web/i18n/dictionaries/en.js";
import {
  ECOMMERCE_PRODUCTS,
  HQ,
  KELILING_MENU,
  OUTLET_MENU,
} from "../../web/modules/home/constants/menu-data.js";

const q = (v: string | null | undefined): string =>
  v === null || v === undefined ? "null" : `'${v.replace(/'/g, "''")}'`;

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/&/g, " dan ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);

/** "8k" -> 8000, "15k / 100gr" -> null plus catatan. */
function parsePrice(raw: string): { price: number | null; note: string | null } {
  const simple = /^(\d+)k$/.exec(raw.trim());
  if (simple) return { price: Number(simple[1]) * 1000, note: null };
  return { price: null, note: raw.trim() };
}

const out: string[] = [];
out.push(`-- SEED, DIBANGKITKAN OTOMATIS oleh apps/api/scripts/generate-seed.ts.
-- Jangan disunting dengan tangan. Ubah sumbernya lalu bangkitkan ulang:
--   npx tsx apps/api/scripts/generate-seed.ts
--
-- Sumbernya: modules/home/constants/menu-data.ts dan kedua kamus i18n, yang
-- keduanya sudah diverifikasi terhadap menu cetak dan brand-analysis.
--
-- IDEMPOTEN. Setiap insert memakai on conflict do nothing atau do update, jadi
-- menjalankannya dua kali tidak menggandakan apa pun.`);

// ── kategori ──────────────────────────────────────────────────────────────
out.push(`\n-- ── kategori ────────────────────────────────────────────────────`);
const categories = new Map<string, { name: string; sort: number }>();
OUTLET_MENU.forEach((cat, i) => categories.set(cat.id, { name: cat.name, sort: i + 1 }));
KELILING_MENU.forEach((cat) => {
  if (!categories.has(cat.id)) categories.set(cat.id, { name: cat.name, sort: categories.size + 1 });
});

for (const [slug, cat] of categories) {
  out.push(
    `insert into public.category (slug, sort_order, status) values (${q(slug)}, ${cat.sort}, 'published') on conflict (slug) do nothing;`,
  );
  /* Nama kategori pada menu cetaknya memang sudah berbahasa Inggris, jadi kedua
     bahasa memakai nilai yang sama. Itu bukan terjemahan yang terlewat, itu
     nama yang aslinya begitu. */
  out.push(
    `insert into public.category_translation (category_id, locale, name) select id, 'id', ${q(cat.name)} from public.category where slug = ${q(slug)} on conflict (category_id, locale) do update set name = excluded.name;`,
  );
  out.push(
    `insert into public.category_translation (category_id, locale, name) select id, 'en', ${q(cat.name)} from public.category where slug = ${q(slug)} on conflict (category_id, locale) do update set name = excluded.name;`,
  );
}

// ── produk ────────────────────────────────────────────────────────────────
out.push(`\n-- ── produk ──────────────────────────────────────────────────────
-- SATU KATALOG dengan penanda ketersediaan per kanal, bukan dua menu terpisah.
-- Itu fakta struktural terpenting di kedua menu cetaknya: harga setiap item
-- yang beririsan sama persis, yang berbeda hanya kanal layanannya.`);

interface Seeded {
  slug: string;
  sku: string;
  name: string;
  price: number | null;
  note: string | null;
  category: string;
  signature: boolean;
  favourite: boolean;
  soldOut: boolean;
  outlet: boolean;
  keliling: boolean;
  ecommerce: boolean;
  image: string | null;
  sort: number;
}

const products = new Map<string, Seeded>();
let order = 0;

for (const cat of OUTLET_MENU) {
  for (const item of cat.items) {
    const slug = slugify(item.name);
    const { price, note } = parsePrice(item.price);
    order += 1;
    products.set(slug, {
      slug,
      sku: `${cat.id.slice(0, 3).toUpperCase()}-${String(order).padStart(3, "0")}`,
      name: item.name,
      price,
      note,
      category: cat.id,
      signature: cat.id === "signature",
      favourite: Boolean(item.favourite),
      soldOut: Boolean(item.soldOut),
      outlet: true,
      keliling: false,
      ecommerce: false,
      image: null,
      sort: order,
    });
  }
}

for (const cat of KELILING_MENU) {
  for (const item of cat.items) {
    const slug = slugify(item.name);
    const existing = products.get(slug);
    if (existing) {
      existing.keliling = true;
      if (item.favourite) existing.favourite = true;
      continue;
    }
    const { price, note } = parsePrice(item.price);
    order += 1;
    products.set(slug, {
      slug,
      sku: `KEL-${String(order).padStart(3, "0")}`,
      name: item.name,
      price,
      note,
      category: cat.id,
      signature: false,
      favourite: Boolean(item.favourite),
      soldOut: Boolean(item.soldOut),
      outlet: false,
      keliling: true,
      ecommerce: false,
      image: null,
      sort: order,
    });
  }
}

/* Tiga produk ecommerce memakai SKU dan gambar aslinya, dan menimpa baris yang
   sudah dibuat dari Roastery Corner kalau namanya sama. */
for (const item of ECOMMERCE_PRODUCTS) {
  const slug = slugify(item.name);
  const existing = products.get(slug);
  const price = Number(item.price.replace(/[^\d]/g, "")) || null;
  if (existing) {
    existing.sku = item.sku;
    existing.image = item.image;
    existing.ecommerce = true;
    existing.price = price;
    continue;
  }
  order += 1;
  products.set(slug, {
    slug,
    sku: item.sku,
    name: item.name,
    price,
    note: null,
    category: "roastery-corner",
    signature: false,
    favourite: false,
    soldOut: false,
    outlet: true,
    keliling: false,
    ecommerce: true,
    image: item.image,
    sort: order,
  });
}

for (const p of products.values()) {
  out.push(
    `insert into public.product (sku, slug, category_id, base_price, price_note, is_signature, is_favourite, is_ecommerce, is_sold_out, image_path, sort_order, status)
select ${q(p.sku)}, ${q(p.slug)}, c.id, ${p.price ?? "null"}, ${q(p.note)}, ${p.signature}, ${p.favourite}, ${p.ecommerce}, ${p.soldOut}, ${q(p.image)}, ${p.sort}, 'published'
from public.category c where c.slug = ${q(p.category)}
on conflict (slug) do nothing;`,
  );
  /* Nama produk adalah NAMA DIRI dan sengaja tidak diterjemahkan.
     "Kopi Susu Jangkar" tetap begitu dalam bahasa apa pun; menerjemahkannya
     justru salah. Yang diterjemahkan hanya teks antarmuka di sekitarnya. */
  for (const locale of ["id", "en"] as const) {
    out.push(
      `insert into public.product_translation (product_id, locale, title) select id, ${q(locale)}, ${q(p.name)} from public.product where slug = ${q(p.slug)} on conflict (product_id, locale) do update set title = excluded.title;`,
    );
  }
  for (const [channel, available] of [["outlet", p.outlet], ["keliling", p.keliling]] as const) {
    out.push(
      `insert into public.product_channel (product_id, channel, available) select id, ${q(channel)}, ${available} from public.product where slug = ${q(p.slug)} on conflict (product_id, channel) do update set available = excluded.available;`,
    );
  }
}

out.push(`
-- SATU AMBIGUITAS YANG TIDAK DIPUTUSKAN SENDIRI, dan ini tempat mencatatnya.
--
-- Menu outlet menulis "Americano / Long Black" dan MENCORETNYA sebagai habis.
-- Poster keliling menulis "Americano" tanpa coretan. Harganya sama, 8k. Hampir
-- pasti minuman yang sama, dan coretannya hanya berlaku di outlet.
--
-- Keduanya tetap dibuat sebagai DUA baris, bukan digabung. Menggabungkannya
-- adalah tafsiran atas data bisnis, dan itu keputusan pemilik proyek, bukan
-- keputusan yang boleh diambil skrip seed. Kalau memang satu minuman: buka
-- /management-product, hapus salah satunya, lalu nyalakan kedua kanal pada
-- yang tersisa. Satu tindakan, dan tidak perlu menyentuh kode.

-- TAUTAN MARKETPLACE SENGAJA TIDAK DI-SEED. Pemilik proyek belum memberikan URL
-- toko Shopee maupun Tokopedia, dan mengarangnya berarti mengirim pengunjung ke
-- alamat yang salah. Isi lewat panel admin di /management-product; begitu terisi,
-- tombol di situs langsung menavigasi tanpa perlu menyentuh kode.`);

// ── outlet ────────────────────────────────────────────────────────────────
out.push(`\n-- ── outlet ──────────────────────────────────────────────────────
-- coords_approximate SENGAJA true: koordinat HQ masih perkiraan dan pemilik
-- proyek akan memberikan yang tepat. Selama penanda ini menyala, tombol
-- navigasi memakai maps_query berupa alamat teks yang terverifikasi.`);
out.push(
  `insert into public.outlet (slug, name, address, phone, phone_href, whatsapp, maps_query, lat, lng, coords_approximate, is_headquarters, sort_order, status)
values ('sako', ${q(HQ.name)}, ${q(HQ.address)}, ${q(HQ.phone)}, ${q(HQ.phoneHref)}, ${q(HQ.whatsapp)}, ${q(HQ.mapsQuery)}, ${HQ.coords.lat}, ${HQ.coords.lng}, true, true, 1, 'published')
on conflict (slug) do nothing;`,
);
out.push(
  `insert into public.outlet_translation (outlet_id, locale, label, hours) select id, 'id', ${q(dictId.outlet.chip)}, ${q(HQ.hours)} from public.outlet where slug = 'sako' on conflict (outlet_id, locale) do update set label = excluded.label, hours = excluded.hours;`,
);
out.push(
  `insert into public.outlet_translation (outlet_id, locale, label, hours) select id, 'en', ${q(dictEn.outlet.chip)}, ${q("07.00 to 23.00, every day")} from public.outlet where slug = 'sako' on conflict (outlet_id, locale) do update set label = excluded.label, hours = excluded.hours;`,
);

// ── unit keliling: SUDAH TIDAK ADA ────────────────────────────────────────
// Tabel keliling_unit dan keliling_schedule dihapus oleh migrasi
// 20260903_0110_drop_keliling.sql. Situs tidak pernah menampilkan jumlah armada
// maupun jadwal titik singgah, hanya menunya, dan isi menu itu sudah hidup di
// product_channel dengan channel 'keliling'. Jadi tidak ada yang perlu di-seed
// di sini. Blok ini sengaja ditinggalkan sebagai catatan supaya tidak ada yang
// menambahkannya kembali tanpa membaca alasannya.

// ── konten halaman ────────────────────────────────────────────────────────
out.push(`\n-- ── konten halaman ──────────────────────────────────────────────
-- Diambil dari kedua kamus i18n, jadi teks yang tayang hari ini persis sama
-- dengan yang masuk basis data. Setelah ini panel yang jadi sumbernya.`);

type Leaf = [key: string, kind: "text" | "longtext" | "list", idValue: string, enValue: string];

function collect(
  sectionKey: string,
  idNode: unknown,
  enNode: unknown,
  prefix = "",
  acc: Leaf[] = [],
): Leaf[] {
  if (typeof idNode === "string") {
    acc.push([prefix, idNode.length > 120 ? "longtext" : "text", idNode, String(enNode ?? idNode)]);
    return acc;
  }
  if (Array.isArray(idNode)) {
    const enArr = Array.isArray(enNode) ? enNode : idNode;
    acc.push([prefix, "list", idNode.join("\n"), enArr.join("\n")]);
    return acc;
  }
  if (idNode && typeof idNode === "object") {
    for (const [k, v] of Object.entries(idNode)) {
      const enChild = (enNode as Record<string, unknown> | undefined)?.[k];
      collect(sectionKey, v, enChild, prefix ? `${prefix}.${k}` : k, acc);
    }
  }
  return acc;
}

const SECTIONS: { key: string; label: string }[] = [
  { key: "hero", label: "Hero" },
  { key: "chain", label: "Rantai produksi" },
  { key: "about", label: "Tentang kami" },
  { key: "menu", label: "Menu" },
  { key: "roastery", label: "Roastery" },
  { key: "outlet", label: "Outlet" },
  { key: "keliling", label: "Keliling" },
  { key: "origin", label: "Asal biji" },
  { key: "contact", label: "Kontak" },
];

SECTIONS.forEach((section, index) => {
  const idNode = (dictId as unknown as Record<string, unknown>)[section.key];
  const enNode = (dictEn as unknown as Record<string, unknown>)[section.key];
  if (!idNode) return;

  out.push(
    `insert into public.page_section (key, label, sort_order, status) values (${q(section.key)}, ${q(section.label)}, ${index + 1}, 'published') on conflict (key) do nothing;`,
  );

  collect(section.key, idNode, enNode).forEach((leaf, i) => {
    const [key, kind, idValue, enValue] = leaf;
    out.push(
      `insert into public.page_content (section_id, key, kind, sort_order) select id, ${q(key)}, ${q(kind)}, ${i + 1} from public.page_section where key = ${q(section.key)} on conflict (section_id, key) do nothing;`,
    );
    for (const [locale, value] of [["id", idValue], ["en", enValue]] as const) {
      out.push(
        `insert into public.page_content_translation (content_id, locale, value) select pc.id, ${q(locale)}, ${q(value)} from public.page_content pc join public.page_section ps on ps.id = pc.section_id where ps.key = ${q(section.key)} and pc.key = ${q(key)} on conflict (content_id, locale) do update set value = excluded.value;`,
      );
    }
  });
});

console.log(out.join("\n"));
