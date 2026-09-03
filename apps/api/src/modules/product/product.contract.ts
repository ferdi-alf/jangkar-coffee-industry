import type { Locale } from "../../shared/contracts/list.js";

export const MARKETPLACES = ["shopee", "tokopedia"] as const;
export type Marketplace = (typeof MARKETPLACES)[number];

export const CHANNELS = ["outlet", "keliling"] as const;
export type Channel = (typeof CHANNELS)[number];

export type ProductStatus = "draft" | "published" | "archived";

/** Bentuk yang dikembalikan daftar. Ini yang mengisi cache list di sisi web. */
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
  /**
   * Slug kategori, bukan hanya id-nya.
   *
   * Menu Keliling di situs mengelompokkan itemnya dengan aturan berbasis slug,
   * dan tanpa medan ini halaman itu harus menarik seluruh kategori hanya untuk
   * menerjemahkan uuid jadi nama. Embednya satu kolom.
   */
  categorySlug: string | null;
  /**
   * IKUT DI DAFTAR, bukan hanya di detail.
   *
   * Situs publik merender tombol Shopee dan Tokopedia langsung dari daftar
   * produk ecommerce, jadi kalau tautannya hanya ada di detail, halaman itu
   * harus menembak tiga permintaan tambahan hanya untuk tiga tombol. Embednya
   * paling banyak dua baris per produk, jauh lebih murah daripada itu.
   */
  marketplaceLinks: { marketplace: Marketplace; url: string }[];
  /**
   * IKUT DI DAFTAR, sama alasannya dengan tautan marketplace.
   *
   * Menu Keliling di situs dan pengelolanya di panel keduanya bekerja pada
   * ketersediaan kanal, dan keduanya memakai daftar. Kalau kanal hanya ada di
   * detail, halaman menu harus menembak satu permintaan per item hanya untuk
   * tahu item itu tampil atau tidak. Embednya paling banyak dua baris.
   */
  channels: { channel: Channel; available: boolean }[];
}

/**
 * Medan tambahan yang HANYA diambil saat drawer detail dibuka, dan hanya yang
 * belum ada di cache. Semuanya opsional justru karena itu: klien meminta
 * sebagiannya lewat `?fields=`, dan yang tidak diminta memang tidak ada.
 */
export interface ProductDetail extends ProductListItem {
  translations?: Record<Locale, { title: string; description: string | null }>;
  variants?: { id: string; label: string; price: number; sortOrder: number }[];
  audit?: { createdAt: string; updatedAt: string };
}
