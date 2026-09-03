import type { NextFunction, Request, Response } from "express";

import { sendError } from "../contracts/envelope.js";
import { getSupabase } from "../db/supabase.js";
import { ACCESS_COOKIE } from "../constants/cookies.js";

/**
 * Otorisasi panel admin.
 *
 * SESI ADA DI COOKIE httpOnly, BUKAN localStorage, sesuai tabel Keamanan di
 * PROJECT-SPEC. Konsekuensinya penting: skrip di halaman tidak bisa membaca
 * token, jadi satu XSS tidak otomatis berarti sesi admin dicuri.
 *
 * Token diverifikasi ke Supabase lewat `auth.getUser(token)`, bukan didekode
 * sendiri. Mendekode JWT tanpa memverifikasi tanda tangannya sama saja dengan
 * mempercayai apa pun yang dikirim klien.
 *
 * Peran diambil dari `admin_user`, bukan dari klaim di dalam token. Klaim ikut
 * basi saat peran dicabut, sedangkan tabel selalu mutakhir. `is_active` juga
 * diperiksa di sini, jadi menonaktifkan seseorang langsung berlaku pada
 * permintaan berikutnya tanpa menunggu tokennya kedaluwarsa.
 */
export type Role = "owner" | "staff";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  /* COOKIE DIPERIKSA LEBIH DULU, BARU KETERSEDIAAN BASIS DATA, dan urutan itu
     penting untuk dua hal.

     Pertama kebenaran jawaban: permintaan tanpa sesi memang tidak terautentikasi,
     apa pun keadaan server, jadi 401 itulah jawaban yang benar. Versi pertama
     memeriksa basis data lebih dulu dan menjawab 503 NOT_CONFIGURED untuk
     permintaan tanpa sesi sama sekali, yang menyesatkan dan sempat menutupi
     pagar auth saat diuji.

     Kedua kerahasiaan: pemanggil anonim tidak perlu tahu apakah server ini sudah
     punya kredensial basis data atau belum. Itu keadaan infrastruktur, dan
     membocorkannya ke siapa pun yang menembak endpoint memberi penyerang peta
     tentang tahap penyiapan sistem. */
  const cookies = req.cookies as Record<string, unknown> | undefined;
  const token = cookies?.[ACCESS_COOKIE];
  if (typeof token !== "string" || token.length === 0) {
    sendError(res, 401, "UNAUTHENTICATED", "Sesi tidak ditemukan. Silakan masuk lagi.");
    return;
  }

  const supabase = getSupabase();
  if (!supabase) {
    sendError(res, 503, "NOT_CONFIGURED", "Layanan basis data belum dikonfigurasi.");
    return;
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    sendError(res, 401, "UNAUTHENTICATED", "Sesi tidak berlaku. Silakan masuk lagi.");
    return;
  }

  const { data: profile } = await supabase
    .from("admin_user")
    .select("user_id, email, name, role, is_active")
    .eq("user_id", data.user.id)
    .maybeSingle();

  /* Punya akun Supabase Auth TIDAK sama dengan punya akses panel. Tanpa baris
     di admin_user, atau saat is_active false, aksesnya ditolak. */
  if (!profile || profile.is_active !== true) {
    sendError(res, 403, "FORBIDDEN", "Akun ini tidak punya akses ke panel.");
    return;
  }

  req.user = {
    id: profile.user_id as string,
    email: profile.email as string,
    name: profile.name as string,
    role: profile.role as Role,
  };
  next();
}

/**
 * Pagar peran. Dipakai untuk yang hanya boleh disentuh owner.
 *
 * Aturan produk dari PROJECT-SPEC: barista boleh mengubah penanda habis, tidak
 * boleh mengubah teks beranda. Jadi rute konten dan pengelolaan pengguna
 * memakai requireRole("owner"), sedangkan penanda habis tidak.
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, "UNAUTHENTICATED", "Sesi tidak ditemukan. Silakan masuk lagi.");
      return;
    }
    if (!roles.includes(req.user.role)) {
      sendError(res, 403, "FORBIDDEN", "Peran Anda tidak berwenang untuk tindakan ini.");
      return;
    }
    next();
  };
}
