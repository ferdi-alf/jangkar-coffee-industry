import { z } from "zod";

/**
 * Batasnya sama persis dengan CHECK di
 * supabase/migrations/20260903_0220_timeline.sql.
 */
const Translation = z.object({
  title: z.string().trim().min(1, "title.required").max(160, "title.tooLong"),
  subtitle: z.string().trim().max(120, "subtitle.tooLong").nullable().optional(),
  description: z.string().trim().max(2000, "description.tooLong").nullable().optional(),
});

export const TimelineInput = z
  .object({
    year: z
      .number()
      .int("year.integer")
      .min(1900, "year.tooEarly")
      .max(2200, "year.tooLate"),
    /* Boleh kosong, artinya "masih berjalan". Situs yang menuliskan "kini" atau
       "now" di ujungnya, dan kata itu datang dari kamus karena ia teks yang
       diterjemahkan, bukan angka. */
    yearEnd: z
      .number()
      .int("year.integer")
      .min(1900, "year.tooEarly")
      .max(2200, "year.tooLate")
      .nullable()
      .optional(),
    sortOrder: z.number().int().min(0).optional(),
    status: z.enum(["draft", "published"]).optional(),
    translations: z.object({ id: Translation, en: Translation }),
  })
  /* Rentang terbalik ditolak DI SINI supaya pesannya muncul di medan yang
     benar, bukan sebagai galat constraint dari Postgres yang tidak menyebut
     medan mana pun. Basis datanya tetap punya CHECK yang sama sebagai jaring
     terakhir. */
  .refine((v) => v.yearEnd == null || v.yearEnd >= v.year, {
    message: "yearEnd.beforeYear",
    path: ["yearEnd"],
  });
export type TimelineInput = z.infer<typeof TimelineInput>;

/**
 * Patch TIDAK memakai `.partial()` di atas objek ber-`refine`, karena zod tidak
 * mengizinkannya: refine menghasilkan ZodEffects, bukan ZodObject. Jadi
 * bentuknya ditulis ulang dan refine-nya dipasang lagi, dengan syarat yang
 * hanya berlaku kalau kedua medan tahun benar-benar dikirim.
 */
export const TimelinePatch = z
  .object({
    year: z.number().int().min(1900).max(2200).optional(),
    yearEnd: z.number().int().min(1900).max(2200).nullable().optional(),
    sortOrder: z.number().int().min(0).optional(),
    status: z.enum(["draft", "published"]).optional(),
    translations: z.object({ id: Translation, en: Translation }).optional(),
  })
  .refine((v) => v.year == null || v.yearEnd == null || v.yearEnd >= v.year, {
    message: "yearEnd.beforeYear",
    path: ["yearEnd"],
  });
export type TimelinePatch = z.infer<typeof TimelinePatch>;
