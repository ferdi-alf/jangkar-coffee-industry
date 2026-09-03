import { z } from "zod";

/**
 * ALT TEXT WAJIB DI KEDUA BAHASA, dan tidak boleh string kosong.
 *
 * Ini bukan formalitas. Alt kosong pada gambar bermakna membuat halaman ini
 * tidak terbaca bagi pengguna pembaca layar, dan constraint yang sama juga ada
 * di migrasi supaya tidak ada jalur lain yang bisa menembusnya.
 */
export const MediaMeta = z.object({
  alt: z.object({
    id: z.string().trim().min(1, "alt.required").max(300, "alt.tooLong"),
    en: z.string().trim().min(1, "alt.required").max(300, "alt.tooLong"),
  }),
});
export type MediaMeta = z.infer<typeof MediaMeta>;
