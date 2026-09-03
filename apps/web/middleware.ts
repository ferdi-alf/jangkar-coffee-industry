import { NextResponse, type NextRequest } from "next/server";

import { DEFAULT_LOCALE, isLocale } from "@/i18n/config";
import { isAdminRoute, isPublicAdminRoute } from "@/shared/constants/routes";

/**
 * Middleware locale DAN penjaga rute admin.
 *
 *   1. segmen pertama ada di ADMIN_ROUTES  -> lewati locale, periksa sesi
 *   2. sudah berprefiks /id atau /en       -> teruskan
 *   3. selain itu                          -> deteksi Accept-Language, alihkan
 *
 * Urutannya tidak boleh ditukar. Kalau pemeriksaan admin tidak lebih dulu,
 * `/dashboard` akan dialihkan jadi `/id/dashboard` dan panel admin ikut
 * berprefiks locale, padahal aturan produk melarangnya.
 *
 * PENJAGA DI SINI HANYA MELIHAT ADA ATAU TIDAKNYA COOKIE, dan itu memang
 * batasnya. Middleware Next berjalan di edge dan tidak boleh memanggil basis
 * data pada setiap navigasi; memverifikasi JWT di sini berarti satu permintaan
 * jaringan tambahan untuk setiap klik. Jadi lapis ini murah dan kasar: ia
 * memulangkan pengunjung yang jelas belum masuk sebelum satu byte halaman pun
 * dirender.
 *
 * VERIFIKASI SESUNGGUHNYA ADA DI DUA TEMPAT LAIN, dan keduanya tidak bisa
 * dilewati: `requireAuth` di Express memverifikasi token ke Supabase pada
 * setiap permintaan data, dan `AdminShell` memanggil GET /auth/me lalu
 * memulangkan pengguna kalau sesinya ternyata sudah tidak berlaku. Cookie
 * karangan lolos dari lapis ini, tapi tidak mendapat satu baris data pun.
 */

/* Nama cookie ini HARUS sama dengan ACCESS_COOKIE di
   apps/api/src/shared/constants/cookies.ts. Ditulis ulang di sini, bukan
   diimpor, karena mengimpor dari apps/api akan menarik kode server beserta
   rantai dependensinya ke dalam bundle middleware. */
const SESSION_COOKIE = "jangkar_at";
function pickLocale(header: string | null): string {
  if (!header) return DEFAULT_LOCALE;
  // Accept-Language: "en-GB,en;q=0.9,id;q=0.8" -> urut menurut q
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag: tag.toLowerCase(), q: q ? Number(q.split("=")[1]) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segment = pathname.split("/")[1] ?? "";

  if (isAdminRoute(segment)) {
    const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

    /* Sudah masuk lalu membuka /login: dilempar ke dashboard. Tanpa ini,
       menekan tombol kembali setelah masuk memperlihatkan form login lagi
       seolah sesinya hilang. */
    if (isPublicAdminRoute(segment)) {
      if (!hasSession) return NextResponse.next();
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (hasSession) return NextResponse.next();

    /* Halaman yang dituju dibawa sebagai `next`, jadi setelah masuk pengguna
       kembali ke tempat yang tadi ia tuju, bukan selalu ke dashboard. */
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = pathname === "/login" ? "" : `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if (isLocale(segment)) return NextResponse.next();

  const locale = pickLocale(request.headers.get("accept-language"));
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  /**
   * Aset statis, berkas konvensi Next, dan API dilewati. Tanpa ini setiap
   * gambar dan font ikut melewati middleware, dan itu biaya per permintaan
   * yang tidak menghasilkan apa pun.
   */
  matcher: [
    "/((?!api|_next|flags|brand|hero|roastery|rantai|icon.png|opengraph-image.jpg|favicon.ico|.*\\.).*)",
  ],
};
