import { z } from "zod";

import { SOCIAL_PLATFORMS } from "./settings.contract.js";

/**
 * Batas panjang di sini SAMA PERSIS dengan CHECK di
 * supabase/migrations/20260903_0210_site_settings.sql. Kalau berbeda, pemakai
 * panel lolos validasi lalu ditolak Postgres dengan pesan yang tidak kita
 * kendalikan dan tidak berbahasa Indonesia.
 */
const SeoTranslation = z.object({
  title: z.string().trim().min(1, "title.required").max(160, "title.tooLong"),
  description: z
    .string()
    .trim()
    .min(1, "description.required")
    .max(320, "description.tooLong"),
  /* Kata kunci disimpan sebagai satu string dipisah koma, bukan array. Yang
     mengetiknya manusia di satu medan teks, dan Next juga menerima string
     maupun array. Menyimpannya sebagai array hanya menambah satu bentuk yang
     harus diterjemahkan bolak-balik tanpa satu pun manfaat. */
  keywords: z.string().trim().max(500, "keywords.tooLong").default(""),
  ogTitle: z.string().trim().max(160, "ogTitle.tooLong").nullable().optional(),
  ogDescription: z.string().trim().max(320, "ogDescription.tooLong").nullable().optional(),
});

/** URL gambar boleh kosong, tapi kalau diisi harus https dan benar bentuknya. */
const ImageUrl = z
  .string()
  .trim()
  .url("url.invalid")
  .startsWith("https://", "url.insecure")
  .max(500, "url.tooLong")
  .nullable()
  .optional();

export const SeoPatch = z.object({
  siteUrl: ImageUrl,
  organizationName: z.string().trim().max(160).nullable().optional(),
  ogImageUrl: ImageUrl,
  logoUrl: ImageUrl,
  faviconUrl: ImageUrl,
  /* Tanpa "@". Situs yang menambahkannya sendiri saat merender, jadi menyimpan
     keduanya berarti suatu saat ada yang tampil "@@jangkar". */
  twitterHandle: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_]{1,15}$/, "handle.invalid")
    .nullable()
    .optional(),
  themeColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "color.invalid")
    .optional(),
  robotsIndex: z.boolean().optional(),
  translations: z.object({ id: SeoTranslation, en: SeoTranslation }).optional(),
});
export type SeoPatch = z.infer<typeof SeoPatch>;

/**
 * Kontak. Semua medan boleh kosong, dan itu disengaja: alamat surel resmi
 * memang belum pernah diberikan pemilik, dan mengarang satu hanya untuk
 * memenuhi validasi jauh lebih buruk daripada membiarkannya kosong.
 */
export const ContactPatch = z.object({
  phone: z.string().trim().max(40).nullable().optional(),
  phoneHref: z
    .string()
    .trim()
    .regex(/^tel:\+?[0-9]{6,20}$/, "phoneHref.invalid")
    .nullable()
    .optional(),
  whatsapp: z
    .string()
    .trim()
    .url("url.invalid")
    .startsWith("https://", "url.insecure")
    .max(300)
    .nullable()
    .optional(),
  email: z.email("email.invalid").max(160).nullable().optional(),
  address: z.string().trim().max(300).nullable().optional(),
  mapsQuery: z.string().trim().max(300).nullable().optional(),
  siteLabel: z.string().trim().max(120).nullable().optional(),
  siteUrl: z
    .string()
    .trim()
    .url("url.invalid")
    .startsWith("https://", "url.insecure")
    .max(300)
    .nullable()
    .optional(),
});
export type ContactPatch = z.infer<typeof ContactPatch>;

export const SocialInput = z.object({
  platform: z.enum(SOCIAL_PLATFORMS),
  url: z
    .string()
    .trim()
    .url("url.invalid")
    .startsWith("https://", "url.insecure")
    .max(500, "url.tooLong"),
  label: z.string().trim().max(120, "label.tooLong").nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});
export type SocialInput = z.infer<typeof SocialInput>;

export const SocialPatch = SocialInput.partial();
export type SocialPatch = z.infer<typeof SocialPatch>;
