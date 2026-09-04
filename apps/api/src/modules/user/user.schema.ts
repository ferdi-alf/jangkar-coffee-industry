import { z } from "zod";

/**
 * Panjang minimal kata sandi.
 *
 * 12, bukan 8 yang dipakai LoginInput, dan perbedaannya disengaja. LoginInput
 * memvalidasi kata sandi yang SUDAH ADA, jadi menaikkan batasnya di sana akan
 * mengunci akun lama yang sah. Di sini kata sandinya baru dibuat, jadi inilah
 * satu-satunya tempat yang bisa menuntut lebih tanpa merugikan siapa pun.
 * Angkanya sama dengan yang sudah dipakai scripts/bootstrap-admin.ts.
 */
const Password = z
  .string()
  .min(12, "password.tooShort")
  .max(72, "password.tooLong");

export const UserInput = z.object({
  email: z.email("email.invalid").max(160, "email.tooLong"),
  name: z.string().trim().min(1, "name.required").max(120, "name.tooLong"),
  role: z.enum(["owner", "staff"]),
  password: Password,
});
export type UserInput = z.infer<typeof UserInput>;

/**
 * Email TIDAK bisa diubah lewat endpoint ini, dan itu bukan kelalaian.
 *
 * Alamat surel hidup di dua tempat: `auth.users` milik Supabase dan
 * `admin_user` milik kita. Mengubahnya berarti mengubah keduanya dalam satu
 * operasi yang bisa gagal di tengah, dan kalau gagal, orangnya tidak bisa masuk
 * lagi memakai alamat mana pun. Untuk kebutuhan yang jarang ini, membuat akun
 * baru lalu menonaktifkan yang lama jauh lebih aman.
 */
export const UserPatch = z.object({
  name: z.string().trim().min(1, "name.required").max(120, "name.tooLong").optional(),
  role: z.enum(["owner", "staff"]).optional(),
  isActive: z.boolean().optional(),
  /* Owner boleh menyetel ulang kata sandi orang lain tanpa tahu yang lama.
     Itu memang wewenang owner, dan tercatat di audit log. */
  password: Password.optional(),
});
export type UserPatch = z.infer<typeof UserPatch>;

/** Profil sendiri. Peran dan status aktif TIDAK ada di sini, sengaja. */
export const ProfilePatch = z.object({
  name: z.string().trim().min(1, "name.required").max(120, "name.tooLong").optional(),
  currentPassword: z.string().min(1, "currentPassword.required").max(72).optional(),
  newPassword: Password.optional(),
});
export type ProfilePatch = z.infer<typeof ProfilePatch>;
