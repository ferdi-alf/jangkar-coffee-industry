/**
 * Kolom yang boleh dipakai mengurutkan. Daftar putih, bukan daftar hitam:
 * nilai `?sort=` yang tidak ada di sini diabaikan dan diganti default, jadi
 * nama kolom sembarang tidak pernah sampai ke query.
 */
export const PRODUCT_SORT = ["sort_order", "sku", "base_price", "created_at", "updated_at"] as const;
export const PRODUCT_DEFAULT_SORT = "sort_order";

/**
 * Peta `?fields=` ke bagian data yang perlu diambil.
 *
 * Ini yang membuat aturan pengambilan sebagian benar-benar hemat: bagian yang
 * tidak diminta tidak ikut di-select sama sekali, jadi basis data tidak
 * mengerjakannya. Contoh dari PROJECT-SPEC:
 *   GET /products/:id?fields=variants,marketplaceLinks,audit
 */
/* `marketplaceLinks` dan `channels` TIDAK ada di daftar ini lagi. Keduanya kini
   selalu ikut karena keduanya bagian dari bentuk DAFTAR, bukan tambahan detail:
   situs publik merender tombol toko dan menu per kanal langsung dari daftar. */
export const PRODUCT_DETAIL_PARTS = ["translations", "variants", "audit"] as const;
export type ProductDetailPart = (typeof PRODUCT_DETAIL_PARTS)[number];
