import type { NextConfig } from "next";

/**
 * API DIPROKSIKAN LEWAT ORIGIN SITUS SENDIRI, dan ini keputusan produksi yang
 * menyelesaikan tiga masalah sekaligus. Jangan dicabut tanpa membaca alasannya.
 *
 * 1. COOKIE SESI. Panel admin memakai cookie httpOnly SameSite=Lax. Kalau web
 *    dan API berada di dua proyek Vercel dengan domain bawaan, keduanya jadi
 *    `a.vercel.app` dan `b.vercel.app`. Terverifikasi: `vercel.app` ADA di
 *    Public Suffix List, jadi kedua subdomain itu LINTAS SITE, bukan satu site.
 *    Peramban tidak akan pernah mengirim cookie Lax ke sana, dan panel admin
 *    mustahil dimasuki. Dengan proksi ini, peramban hanya pernah bicara ke
 *    origin situs, jadi cookienya selalu first-party. Ia bekerja di domain
 *    bawaan Vercel, di preview deployment, dan di domain sendiri, tanpa
 *    perbedaan konfigurasi.
 *
 * 2. CORS. Tidak ada lagi permintaan lintas origin dari peramban, jadi tidak
 *    ada preflight dan tidak ada allowlist yang bisa salah diisi.
 *
 * 3. RUTE EXPRESS UTUH. Alternatifnya adalah `vercel.json` di apps/api dengan
 *    rewrite `"/(.*)"` ke `"/api"`. Dokumentasi Vercel menunjukkan capture pada
 *    source diteruskan sebagai QUERY, bukan sebagai path, jadi ada risiko nyata
 *    Express melihat `/api` untuk setiap permintaan dan seluruh routingnya
 *    runtuh. Rewrite Next di sini meneruskan sisa path secara eksplisit lewat
 *    `:path*`, jadi tidak ada yang perlu ditebak.
 *
 * `API_ORIGIN` adalah variabel SISI SERVER, tanpa prefiks NEXT_PUBLIC_, karena
 * peramban tidak perlu tahu alamat API sama sekali. Kalau ia tidak diisi, tidak
 * ada rewrite yang dipasang dan seluruh panggilan /api akan 404. Itu disengaja:
 * gagal terang-terangan lebih baik daripada diam-diam menunjuk localhost di
 * produksi.
 */
const nextConfig: NextConfig = {
  async rewrites() {
    const origin = process.env.API_ORIGIN;
    if (!origin) {
      if (process.env.NODE_ENV === "production") {
        console.warn(
          "[next.config] API_ORIGIN belum diisi. Seluruh panggilan /api akan 404 " +
            "dan panel admin tidak bisa dipakai.",
        );
      }
      return [];
    }
    return [{ source: "/api/:path*", destination: `${origin.replace(/\/+$/, "")}/:path*` }];
  },
};

export default nextConfig;
