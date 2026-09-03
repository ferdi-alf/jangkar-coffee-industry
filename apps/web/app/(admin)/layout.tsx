import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "../globals.css";
import "../admin.css";
import { Providers } from "@/modules/admin/components/Providers";

/**
 * Layout akar PANEL ADMIN.
 *
 * KENAPA ADA DUA LAYOUT AKAR. Rute publik berprefiks locale dan `<html lang>`
 * nya harus mengikuti locale itu; rute admin tidak berprefiks locale sama
 * sekali, aturan produk melarangnya. Satu layout akar tidak bisa melayani
 * keduanya. Next mengizinkan dua layout akar asalkan keduanya berada di route
 * group tingkat atas, karena itu ada `(site)` dan `(admin)`.
 *
 * `lang="id"` tetap, bukan mengikuti pengunjung. Panel ini hanya berbahasa
 * Indonesia, dipakai pemilik dan barista, dan aturan produk memang menyebut
 * hanya situs publik yang dua bahasa. Yang dwibahasa di dalam panel adalah ISI
 * yang dikelola, bukan antarmukanya, dan itu diurus tab ID dan EN pada form.
 *
 * `data-admin` pada body adalah pagar gaya. Seluruh aturan di admin.css dicakup
 * di bawahnya, jadi tidak ada satu pun yang bisa menetes ke situs publik.
 *
 * `robots: noindex` karena panel ini tidak pernah untuk mesin telusur.
 */
const geist = Geist({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Panel Admin · Jangkar Coffee Industry",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${geist.variable} ${mono.variable}`}>
      <body data-admin>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
