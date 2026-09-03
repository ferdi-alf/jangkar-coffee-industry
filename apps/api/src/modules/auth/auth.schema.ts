import { z } from "zod";

/**
 * Pesan galatnya berupa KODE stabil, bukan kalimat. Kalimatnya dipilih di sisi
 * web dari kamus, jadi galat validasi ikut dua bahasa tanpa server perlu tahu
 * bahasa apa pun. Pola ini sama dengan yang sudah dipakai form kontak.
 *
 * Panjang minimum kata sandi 8, sama dengan bawaan Supabase Auth. Kalau di sini
 * lebih longgar, pengguna akan lolos validasi kita lalu ditolak Supabase dengan
 * pesan berbahasa Inggris yang tidak kita kendalikan.
 */
export const LoginInput = z.object({
  email: z.email("email.invalid").max(160, "email.tooLong"),
  password: z
    .string({ error: "password.required" })
    .min(8, "password.tooShort")
    .max(72, "password.tooLong"),
});

export type LoginInput = z.infer<typeof LoginInput>;
