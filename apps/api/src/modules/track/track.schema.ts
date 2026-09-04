import { z } from "zod";

/**
 * Badan permintaan pencatat kunjungan.
 *
 * Dikirim middleware Next, bukan peramban, jadi bentuknya kita kendalikan
 * sepenuhnya. Tetap divalidasi ketat karena endpoint ini menulis ke basis data
 * dan header rahasia bisa saja bocor suatu hari.
 */
export const VisitInput = z.object({
  path: z.string().trim().min(1, "path.required").max(300, "path.tooLong"),
  locale: z.enum(["id", "en"]).nullable().optional(),
  /* Kode negara ISO 3166-1 alpha-2 dari header `x-vercel-ip-country`. Boleh
     kosong, dan itu keadaan NORMAL: di lokal header itu memang tidak ada. */
  country: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/, "country.invalid")
    .nullable()
    .optional(),
  /* Dipakai HANYA sebagai bahan hash, tidak pernah disimpan. Lihat service. */
  ip: z.string().trim().max(60).nullable().optional(),
  ua: z.string().trim().max(500).nullable().optional(),
});
export type VisitInput = z.infer<typeof VisitInput>;
