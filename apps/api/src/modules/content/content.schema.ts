import { z } from "zod";

/**
 * Perubahan konten dikirim sebagai daftar medan, bukan satu objek bersarang.
 *
 * Alasannya bentuk konten ditentukan DATA, bukan kode: page_content mendaftar
 * medan apa saja yang ada di tiap seksi, dan panel membangkitkan formnya dari
 * sana. Skema bersarang yang tetap akan langsung basi begitu satu medan
 * ditambahkan lewat basis data.
 */
export const ContentPatch = z.object({
  fields: z
    .array(
      z.object({
        id: z.uuid("field.invalid"),
        values: z.object({
          id: z.string().max(5000, "value.tooLong"),
          en: z.string().max(5000, "value.tooLong"),
        }),
      }),
    )
    .min(1, "fields.required")
    .max(200),
});
export type ContentPatch = z.infer<typeof ContentPatch>;
