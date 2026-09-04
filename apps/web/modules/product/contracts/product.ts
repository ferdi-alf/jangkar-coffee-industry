/**
 * Bentuk data produk di sisi web, sepadan dengan contract di
 * apps/api/src/modules/product/product.contract.ts.
 *
 * Medan detail semuanya OPSIONAL, dan itu bukan kelalaian. Aturan pengambilan
 * sebagian membuat drawer hanya meminta bagian yang belum ada di cache, jadi
 * objek yang sama bisa datang tanpa `variants` pada satu permintaan dan
 * membawanya pada permintaan berikutnya. Tipe yang menyatakannya wajib akan
 * berbohong.
 */
export const MARKETPLACES = ["shopee", "tokopedia"] as const;
export type Marketplace = (typeof MARKETPLACES)[number];

export const CHANNELS = ["outlet", "keliling"] as const;
export type Channel = (typeof CHANNELS)[number];

export type ProductStatus = "draft" | "published" | "archived";

export interface ProductListItem {
  id: string;
  sku: string;
  slug: string;
  title: string;
  description: string | null;
  basePrice: number | null;
  priceNote: string | null;
  image: string | null;
  status: ProductStatus;
  isEcommerce: boolean;
  isSignature: boolean;
  isFavourite: boolean;
  isSoldOut: boolean;
  sortOrder: number;
  categoryId: string | null;
  categorySlug: string | null;
  /**
   * Tautan toko dan kanal SELALU ikut di daftar, bukan hanya di detail.
   *
   * Situs merender tombol marketplace dan menu per kanal langsung dari daftar,
   * dan panel merender sakelar kanal dari daftar yang sama. Kalau keduanya hanya
   * ada di detail, ketiga tempat itu harus menembak satu permintaan per baris.
   */
  marketplaceLinks: { marketplace: Marketplace; url: string }[];
  channels: { channel: Channel; available: boolean }[];
}

export interface ProductDetail extends ProductListItem {
  translations?: Record<"id" | "en", { title: string; description: string | null }>;
  variants?: { id: string; label: string; price: number; sortOrder: number }[];
  audit?: { createdAt: string; updatedAt: string };
}

/**
 * Bentuk yang dikirim saat menyimpan.
 *
 * `slug` TIDAK ADA DI SINI LAGI. Server yang membuatnya dari judul Indonesia
 * saat produk dibuat, lalu menguncinya: pada update, slug yang dikirim justru
 * dibuang. Lihat apps/api/src/shared/utils/slug.ts untuk alasannya, yang
 * intinya `category.slug` dipakai sebagai aturan tampilan menu keliling.
 *
 * `image` berisi URL PENUH ke objek publik di Supabase Storage untuk gambar
 * yang diunggah lewat panel, atau jalur statis lama seperti
 * `/roastery/kopi-bubuk-80gr.webp` untuk data sebelum panel ada. Kolomnya
 * memang teks bebas, jadi keduanya hidup berdampingan tanpa migrasi.
 */
export interface ProductPayload {
  sku: string;
  categoryId: string | null;
  image: string | null;
  basePrice: number | null;
  priceNote: string | null;
  isSignature: boolean;
  isFavourite: boolean;
  isEcommerce: boolean;
  isSoldOut: boolean;
  status: ProductStatus;
  sortOrder: number;
  translations: Record<"id" | "en", { title: string; description: string | null }>;
  marketplaceLinks: { marketplace: Marketplace; url: string }[];
  /**
   * HANYA dikirim saat MEMBUAT. Pada update ia sengaja dihilangkan, karena
   * server menulis ulang seluruh daftar kanal setiap kali medan ini ada.
   * Mengirimnya dari form menu akan diam-diam mencabut item dari menu keliling
   * setiap kali harganya disunting.
   */
  channels?: { channel: Channel; available: boolean }[];
}

/** Kode galat dari zod di server, dipetakan ke kalimat Indonesia di sini. */
export const PRODUCT_ERROR: Record<string, string> = {
  "sku.required": "SKU wajib diisi.",
  "sku.tooLong": "SKU terlalu panjang.",
  "slug.invalid": "Slug hanya boleh huruf kecil, angka, dan tanda hubung.",
  "slug.tooLong": "Slug terlalu panjang.",
  "title.required": "Judul wajib diisi.",
  "title.tooLong": "Judul terlalu panjang.",
  "description.tooLong": "Deskripsi terlalu panjang.",
  "price.integer": "Harga harus bilangan bulat rupiah.",
  "price.negative": "Harga tidak boleh negatif.",
  "priceNote.tooLong": "Catatan harga terlalu panjang.",
  "url.invalid": "Tautan tidak valid.",
  "url.insecure": "Tautan harus diawali https://",
  "category.invalid": "Kategori tidak dikenali.",
};
