import type { Request, Response } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

import { sendError } from "../contracts/envelope.js";

/**
 * Batas laju, angkanya dari tabel Keamanan di PROJECT-SPEC.
 *
 * Semuanya memakai amplop galat yang sama seperti respons lain. Bawaan
 * express-rate-limit mengirim badan teks polos, bentuk yang berbeda dari
 * contract dan akan memaksa klien menangani dua bentuk sekaligus.
 */
const handler = (message: string) => (_req: Request, res: Response): void => {
  sendError(res, 429, "RATE_LIMITED", message);
};

/**
 * PERINGATAN YANG HARUS DIBACA SEBELUM PRODUKSI.
 *
 * Ketiga limiter di bawah memakai MemoryStore bawaan express-rate-limit, yang
 * menyimpan hitungannya DI MEMORI PROSES. Di server tunggal itu benar. Di
 * serverless seperti Vercel, setiap instance punya memorinya sendiri dan
 * instance-nya berlipat mengikuti trafik, jadi batas "5 per menit" sebenarnya
 * berarti "5 per menit PER INSTANCE". Penyerang yang paralel mendapat kelipatan
 * dari yang tertulis.
 *
 * Ini BUKAN sesuatu yang bisa diperbaiki dengan mengubah angkanya. Perbaikannya
 * adalah store bersama, misalnya rate-limit-redis dengan Upstash, dan itu
 * menambah layanan baru sehingga menunggu keputusan pemilik proyek. Sampai itu
 * ada, pagar sesungguhnya untuk login adalah kata sandi yang kuat dan
 * perlindungan kata sandi bocor di Supabase Auth.
 *
 * Peringatan dicetak sekali saat start di produksi supaya ini tidak terlupakan
 * diam-diam. Lihat DEPLOY.md bagian Keterbatasan yang diketahui.
 */
export function warnIfUnsharedRateLimitStore(): void {
  if (process.env.NODE_ENV !== "production") return;
  console.warn(
    "[rateLimit] MemoryStore dipakai di produksi. Di lingkungan serverless " +
      "batasnya berlaku PER INSTANCE, bukan global. Pasang store bersama " +
      "sebelum mengandalkan angka ini sebagai kendali keamanan.",
  );
}

/** 100 per menit, berlaku umum untuk seluruh API. */
export const generalLimiter = rateLimit({
  windowMs: 60_000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: handler("Terlalu banyak permintaan. Coba lagi sebentar lagi."),
});

/**
 * 5 per menit untuk login, PER IP DAN PER AKUN.
 *
 * Kuncinya menggabungkan IP dengan email yang dicoba. Kalau hanya per IP,
 * satu kantor di belakang satu NAT bisa saling mengunci; kalau hanya per akun,
 * penyerang tinggal menyemprot ribuan akun berbeda dari satu mesin. Digabung,
 * keduanya tertutup.
 */
export const loginLimiter = rateLimit({
  windowMs: 60_000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  /* `ipKeyGenerator`, BUKAN `req.ip` mentah. express-rate-limit menolak yang
     kedua dengan ERR_ERL_KEY_GEN_IPV6, dan alasannya nyata: satu pelanggan IPv6
     biasanya memegang seluruh blok /64, jadi kunci berdasarkan alamat utuh bisa
     diputar miliaran kali dan batas per IP jadi tidak berarti sama sekali.
     Helper ini menormalkan IPv6 ke prefiks subnetnya lebih dulu. */
  keyGenerator: (req) => {
    const body = req.body as { email?: unknown } | undefined;
    const email = typeof body?.email === "string" ? body.email.toLowerCase() : "-";
    return `${ipKeyGenerator(req.ip ?? "-")}|${email}`;
  },
  handler: handler("Terlalu banyak percobaan masuk. Coba lagi satu menit lagi."),
});

/** Unggahan berkas jauh lebih mahal daripada permintaan biasa. */
export const uploadLimiter = rateLimit({
  windowMs: 10 * 60_000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: handler("Terlalu banyak unggahan. Coba lagi nanti."),
});
