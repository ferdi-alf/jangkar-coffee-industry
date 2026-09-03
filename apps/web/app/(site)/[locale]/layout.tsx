import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";

import "../../globals.css";
import { cn } from "@/lib/utils";
import { LOCALES, isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { SiteFooter } from "@/modules/navigation/components/SiteFooter";
import { SiteHeader } from "@/modules/navigation/components/SiteHeader";

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: { default: dict.meta.title, template: `%s · Jangkar Coffee Industry` },
    description: dict.meta.description,
    /* hreflang timbal balik. Tanpa ini mesin telusur memperlakukan kedua versi
       sebagai duplikat, bukan sebagai terjemahan satu sama lain. */
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(LOCALES.map((l) => [l, `/${l}`])),
    },
  };
}

export const viewport: Viewport = { themeColor: "#FBFAF8" };

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

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
