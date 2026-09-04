import { NextResponse, after, type NextRequest } from "next/server";

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

/**
 * Pencatat kunjungan.
 *
 * KENAPA DI MIDDLEWARE, BUKAN DI API. Negara pengunjung datang dari header
 * `x-vercel-ip-country`, dan header itu hanya BENAR pada permintaan yang
 * langsung dari peramban ke proyek ini. API dipanggil lewat proksi rewrite,
 * jadi kalau ia yang membaca header itu, yang terbaca adalah negara datacenter
 * Vercel, bukan pengunjungnya. Karena itu middleware yang membacanya lalu
 * meneruskannya ke API dengan nama header milik kita sendiri.
 *
 * KENAPA BUKAN SKRIP DI PERAMBAN. Situs ini punya anggaran performa yang ketat
 * dan mayoritas pengunjungnya Android kelas menengah. Beacon di sisi klien
 * berarti JavaScript tambahan dan satu permintaan lagi dari perangkat yang
 * sudah paling lambat, untuk data yang seluruhnya sudah ada di server.
 *
 * TIDAK PERNAH MENGHALANGI HALAMAN. `after()` menjalankannya setelah respons
 * terkirim, dan seluruh galat ditelan. Pencatat kunjungan yang bisa membuat
 * situs gagal dimuat adalah pertukaran yang tidak pernah sepadan.
 */
const TRACK_HEADER = "x-jangkar-track";

/* Bot yang menyebut dirinya sendiri. Ini BUKAN pendeteksi bot sungguhan dan
   tidak berpura-pura begitu: yang menyamar sebagai peramban tetap lolos, dan
   keterbatasan itu ditulis juga di keterangan grafiknya. Yang disaring di sini
   hanya perayap jujur, yang justru paling banyak jumlahnya. */
const BOT_UA = /bot|crawl|spider|slurp|bingpreview|headless|lighthouse|monitor|pingdom|curl|wget/i;

function recordVisit(request: NextRequest, locale: string): void {
  const origin = process.env.API_ORIGIN;
  const secret = process.env.TRACK_SECRET;
  /* Tanpa keduanya ia DIAM, bukan mencoba lalu gagal berisik. Ini yang membuat
     `npm run dev` tidak menumpahkan galat jaringan tiap kali halaman dibuka. */
  if (!origin || !secret) return;

  const ua = request.headers.get("user-agent") ?? "";
  if (BOT_UA.test(ua)) return;

  /* Prefetch Next BUKAN kunjungan. Ia terjadi saat kursor sekadar melintas di
     atas tautan, dan menghitungnya akan menggandakan angka tanpa satu manusia
     pun benar-benar membuka halamannya. */
  if (request.headers.get("next-router-prefetch")) return;

  const country = request.headers.get("x-vercel-ip-country");
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  after(
    fetch(`${origin.replace(/\/+$/, "")}/track/visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", [TRACK_HEADER]: secret },
      body: JSON.stringify({
        path: request.nextUrl.pathname,
        locale,
        country,
        /* IP dan user agent dipakai HANYA sebagai bahan hash bergaram di
           server, lalu dibuang. Tidak satu pun disimpan. Lihat
           apps/api/src/modules/track/track.service.ts. */
        ip,
        ua: ua.slice(0, 500),
      }),
    }).catch(() => undefined),
  );
}
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

  /* Dicatat DI SINI, pada permintaan yang sudah berprefiks locale, bukan pada
     cabang pengalihan di bawah. Pengunjung yang membuka "/" akan melewati
     middleware ini DUA KALI, sekali untuk dialihkan dan sekali untuk halaman
     sungguhannya, dan mencatat di kedua tempat akan melipatgandakan angkanya. */
  if (isLocale(segment)) {
    recordVisit(request, segment);
    return NextResponse.next();
  }

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
