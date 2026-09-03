import { z } from "zod";

import { CHANNELS, MARKETPLACES } from "./product.contract.js";

/**
 * Pesan galat berupa KODE stabil, diterjemahkan di sisi web. Batasnya sengaja
 * dibuat sama persis dengan constraint di migrasi; kalau berbeda, pengguna bisa
 * lolos validasi lalu ditolak Postgres dengan pesan yang tidak kita kendalikan.
 */
const Translation = z.object({
  title: z.string().trim().min(1, "title.required").max(160, "title.tooLong"),
  description: z.string().trim().max(2000, "description.tooLong").nullable().optional(),
});

export const ProductInput = z.object({
  sku: z.string().trim().min(1, "sku.required").max(40, "sku.tooLong"),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "slug.invalid")
    .max(80, "slug.tooLong"),
  categoryId: z.uuid("category.invalid").nullable().optional(),
  basePrice: z.number().int("price.integer").min(0, "price.negative").nullable().optional(),
  priceNote: z.string().trim().max(80, "priceNote.tooLong").nullable().optional(),
  isSignature: z.boolean().optional(),
  isFavourite: z.boolean().optional(),
  isEcommerce: z.boolean().optional(),
  isSoldOut: z.boolean().optional(),
  image: z.string().trim().max(300).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),

  /* Dua bahasa WAJIB keduanya. Aturan produk: setiap input teks yang tampil
     publik dibungkus tab ID dan EN, jadi menyimpan satu bahasa saja berarti
     situs punya lubang di bahasa yang lain. */
  translations: z.object({ id: Translation, en: Translation }),

  /* Tautan marketplace TIDAK bergantung bahasa, jadi ia di luar blok tab.
     Wajib https: tautan http bisa dibajak di jaringan publik, dan kedua
     marketplace ini memang hanya melayani https. */
  marketplaceLinks: z
    .array(
      z.object({
        marketplace: z.enum(MARKETPLACES),
        url: z.string().trim().url("url.invalid").startsWith("https://", "url.insecure").max(500),
      }),
    )
    .max(2)
    .optional(),

  variants: z
    .array(
      z.object({
        label: z.string().trim().min(1, "variant.label").max(80),
        price: z.number().int().min(0, "price.negative"),
        sortOrder: z.number().int().min(0).optional(),
      }),
    )
    .max(20)
    .optional(),

  channels: z
    .array(z.object({ channel: z.enum(CHANNELS), available: z.boolean() }))
    .max(2)
    .optional(),
});

export type ProductInput = z.infer<typeof ProductInput>;

/** Perubahan sebagian. Dipakai form edit dan juga penanda habis milik staff. */
export const ProductPatch = ProductInput.partial();
export type ProductPatch = z.infer<typeof ProductPatch>;

/** Penanda habis, boleh diubah staff. */
export const SoldOutPatch = z.object({ isSoldOut: z.boolean() });
export type SoldOutPatch = z.infer<typeof SoldOutPatch>;

/**
 * Ketersediaan per kanal, juga boleh diubah staff.
 *
 * Menyusun isi menu armada adalah operasi harian, sama seperti menandai sesuatu
 * habis, dan orang yang mendorong gerobaknya yang paling tahu apa yang dibawa
 * hari itu. Karena itu ia endpoint sendiri, bukan cabang di dalam update produk
 * umum yang terkunci owner, sehingga pagar perannya ada di router dan tidak
 * bisa terlewat.
 */
export const ChannelPatch = z.object({
  channels: z
    .array(z.object({ channel: z.enum(CHANNELS), available: z.boolean() }))
    .min(1, "channels.required")
    .max(2),
});
export type ChannelPatch = z.infer<typeof ChannelPatch>;
