import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";

import "../../globals.css";
import { cn } from "@/lib/utils";
import { LOCALES, isLocale, type Locale } from "@/i18n/config";
import { getSiteDictionary } from "@/i18n/site-dictionary";
import { SiteFooter } from "@/modules/navigation/components/SiteFooter";
import { SiteHeader } from "@/modules/navigation/components/SiteHeader";
import { getSiteSettings } from "@/modules/home/lib/site-settings";

/**
 * Layout akar SITUS PUBLIK, dan sekaligus layout locale.
 *
 * TIDAK ADA app/layout.tsx di atas ini, dan itu disengaja. Berkas inilah yang
 * merender `<html>` dan `<body>` untuk seluruh rute publik. Kalau ada layout
 * akar tunggal di atasnya, `lang` tidak bisa mengikuti locale, dan atribut itu
 * yang dipakai pembaca layar untuk memilih suara yang benar.
 *
 * KENAPA ADA DI DALAM GROUP `(site)`. Panel admin tidak berprefiks locale, jadi
 * ia butuh layout akar sendiri dengan `lang` tetap. Next hanya mengizinkan dua
 * layout akar bila keduanya berada di route group tingkat atas, karena itu
 * rute publik pindah dari `app/[locale]` ke `app/(site)/[locale]` dan admin
 * duduk di `app/(admin)`. Group tidak muncul di URL, jadi `/id` tetap `/id`.
 *
 * Konsekuensi yang perlu diingat: berpindah antara situs publik dan panel admin
 * adalah muat dokumen penuh, bukan navigasi sisi klien, karena keduanya berakar
 * pada `<html>` yang berbeda. Itu justru yang diinginkan di sini, `lang` dan
 * seluruh gaya panel memang harus ditukar total.
 */

/**
 * Aturan tipografi, lihat CLAUDE.md.
 *
 * TIDAK ADA font serif. Geist dan Geist Mono sama-sama grotesk tanpa serif.
 *
 * `display: "optional"`, BUKAN "swap". Jangan dikembalikan tanpa mengukur ulang.
 * Terukur: dengan "swap", font body tiba setelah paint pertama pada koneksi
 * lambat, `.lede` berpindah dari tiga baris ke empat, dan seluruh isi di
 * bawahnya bergeser 27px. Di 360px itu CLS 0.1609, melewati pagar 0.1. Dengan
 * "optional" CLS nol di seluruh rentang bandwidth yang diuji.
 */
const geist = Geist({ subsets: ["latin"], variable: "--font-sans", display: "optional" });

const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

/**
 * Metadata halaman, KINI DARI BASIS DATA.
 *
 * Sebelumnya judul dan deskripsi datang dari `dict.meta`, gambar berbagi hanya
 * berupa satu berkas statis `app/opengraph-image.jpg` yang sama untuk kedua
 * bahasa, dan `openGraph`, `twitter`, serta `robots` tidak diisi sama sekali.
 * Artinya menyunting judul halaman berarti deploy ulang. Sekarang semuanya
 * dikelola di /seo pada panel.
 *
 * KAMUS TETAP JADI CADANGAN. `getSiteSettings` memulangkan nilai konstanta bila
 * API tidak bisa dihubungi saat build, dan bila judul dari basis data kosong,
 * baris di bawah menjatuhkannya ke `dict.meta`. Halaman tanpa `<title>` jauh
 * lebih merusak daripada halaman berjudul lama.
 *
 * `robots` HANYA DIPASANG saat pengindeksan dimatikan. Bawaan Next sudah
 * mengizinkan indeks, jadi menuliskannya lagi hanya menambah tag tanpa arti;
 * yang perlu dinyatakan eksplisit justru penolakannya.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const [dict, settings] = await Promise.all([
    getSiteDictionary(locale),
    getSiteSettings(locale),
  ]);
  const { seo } = settings;

  const title = seo.title.trim() || dict.meta.title;
  const description = seo.description.trim() || dict.meta.description;
  const base = seo.siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return {
    metadataBase: new URL(base),
    title: { default: title, template: `%s \u00b7 Jangkar Coffee Industry` },
    description,
    /* Kata kunci disimpan sebagai satu string dipisah koma karena itu yang
       diketik manusia di satu medan. Next menerima array, jadi diurai di sini,
       dan potongan kosong dibuang supaya tidak lahir kata kunci hampa. */
    keywords: seo.keywords
      ? seo.keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean)
      : undefined,
    /* hreflang timbal balik. Tanpa ini mesin telusur memperlakukan kedua versi
       sebagai duplikat, bukan sebagai terjemahan satu sama lain. */
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(LOCALES.map((l) => [l, `/${l}`])),
    },
    openGraph: {
      type: "website",
      siteName: seo.organizationName ?? "Jangkar Coffee Industry",
      locale: locale === "id" ? "id_ID" : "en_US",
      url: `/${locale}`,
      title: seo.ogTitle ?? title,
      description: seo.ogDescription ?? description,
      /* Dibiarkan kosong kalau belum diisi, JANGAN ditebak. Tanpa `images`,
         Next tetap memakai berkas konvensi app/opengraph-image.jpg sebagai
         cadangan, jadi tautan yang dibagikan tidak pernah kehilangan
         gambarnya. */
      ...(seo.ogImageUrl ? { images: [{ url: seo.ogImageUrl }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: seo.ogTitle ?? title,
      description: seo.ogDescription ?? description,
      ...(seo.twitterHandle ? { creator: `@${seo.twitterHandle}` } : {}),
      ...(seo.ogImageUrl ? { images: [seo.ogImageUrl] } : {}),
    },
    ...(seo.faviconUrl ? { icons: { icon: seo.faviconUrl } } : {}),
    ...(seo.robotsIndex ? {} : { robots: { index: false, follow: false } }),
  };
}

/**
 * `themeColor` MENGIKUTI SETELAN SEO di panel.
 *
 * Sesi sebelumnya menulis di sini bahwa ini mustahil karena `viewport` adalah
 * ekspor statis. Itu KELIRU: Next punya `generateViewport`, yang boleh
 * asinkron dan boleh mengambil data, persis seperti generateMetadata. Yang
 * benar adalah keduanya tidak boleh diekspor bersamaan dari satu segmen, jadi
 * ekspor `viewport` diganti fungsi ini.
 *
 * Warna dari basis data dipakai apa adanya; kalau kosong ia jatuh ke warna
 * ground palet crest.
 */
export async function generateViewport({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Viewport> {
  const { locale } = await params;
  if (!isLocale(locale)) return { themeColor: "#FBFAF8" };
  const { seo } = await getSiteSettings(locale);
  return { themeColor: seo.themeColor || "#FBFAF8" };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getSiteDictionary(locale);

  return (
    <html lang={locale} className={cn(mono.variable, "font-sans", geist.variable)}>
      <body>
        <SiteHeader dict={dict} locale={locale as Locale} />
        {children}
        <SiteFooter dict={dict} locale={locale as Locale} />
      </body>
    </html>
  );
}
