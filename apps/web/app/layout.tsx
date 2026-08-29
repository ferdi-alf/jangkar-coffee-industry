import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";

import "./globals.css";

/**
 * Aturan tipografi — lihat CLAUDE.md.
 *
 * TIDAK ADA font serif. Inter dan Geist Mono sama-sama grotesk tanpa serif.
 * Konsep Arus aslinya memakai JetBrains Mono, tapi font itu punya serif kecil
 * pada beberapa glif, jadi digantikan Geist Mono yang bersih.
 *
 * next/font mengunduh dan menyajikan font ini dari domain sendiri saat build,
 * bukan dari CDN Google — syarat performa di future-scope.md §7.
 */
const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Jangkar Coffee Industry — Kopi Robusta Semendo, Palembang",
    template: "%s · Jangkar Coffee Industry",
  },
  description:
    "Industri kopi Palembang. Robusta dari kebun Semendo, disangrai sendiri di roastery Sako, disajikan di outlet dan armada keliling.",
};

export const viewport: Viewport = {
  themeColor: "#FBFAF8",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
