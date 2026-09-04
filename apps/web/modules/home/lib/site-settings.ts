import "server-only";

import { HQ } from "@/modules/home/constants/menu-data";

/**
 * Setelan situs: SEO, kontak, dan tautan sosial, dibaca dari API saat build.
 *
 * Pola yang SAMA PERSIS dengan ecommerce-products.ts dan keliling-menu.ts, dan
 * kesamaan itu disengaja: `server-only`, `API_ORIGIN` absolut karena
 * pengambilannya terjadi saat build dan tidak punya origin relatif, ISR 300
 * detik, dan CADANGAN KONSTANTA kalau API tidak bisa dihubungi.
 *
 * Cadangannya bukan kehati-hatian berlebihan. Kalau API mati saat build, tanpa
 * blok catch di bawah seluruh build gagal, dan situs yang sudah tayang ikut
 * tidak bisa diperbarui. Dengan cadangan, yang terjadi hanyalah satu build
 * memakai nomor telepon dari konstanta lama, dan ISR memperbaikinya sendiri
 * dalam lima menit.
 *
 * Nilai cadangannya diambil dari konstanta HQ yang memang sudah dipakai situs
 * sebelum panel ada, jadi tidak ada satu pun data bisnis yang dikarang di sini.
 */
export const SOCIAL_PLATFORMS = [
  "instagram",
  "facebook",
  "tiktok",
  "x",
  "youtube",
  "threads",
  "linkedin",
  "whatsapp",
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export interface PublicSettings {
  seo: {
    title: string;
    description: string;
    keywords: string;
    ogTitle: string | null;
    ogDescription: string | null;
    siteUrl: string | null;
    organizationName: string | null;
    ogImageUrl: string | null;
    logoUrl: string | null;
    faviconUrl: string | null;
    twitterHandle: string | null;
    themeColor: string;
    robotsIndex: boolean;
  };
  contact: {
    phone: string | null;
    phoneHref: string | null;
    whatsapp: string | null;
    email: string | null;
    address: string | null;
    mapsQuery: string | null;
    siteLabel: string | null;
    siteUrl: string | null;
  };
  social: { platform: SocialPlatform; url: string; label: string | null }[];
}

const API = process.env.API_ORIGIN ?? "http://localhost:4000";

/** Cadangan, disusun dari konstanta yang sudah dipakai situs sebelum panel ada. */
function fallback(): PublicSettings {
  return {
    seo: {
      title: "",
      description: "",
      keywords: "",
      ogTitle: null,
      ogDescription: null,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
      organizationName: "Jangkar Coffee Industry",
      ogImageUrl: null,
      logoUrl: null,
      faviconUrl: null,
      twitterHandle: null,
      themeColor: "#FBFAF8",
      robotsIndex: true,
    },
    contact: {
      phone: HQ.phone,
      phoneHref: HQ.phoneHref,
      whatsapp: HQ.whatsapp,
      email: null,
      address: HQ.address,
      mapsQuery: HQ.mapsQuery,
      siteLabel: HQ.site.label,
      siteUrl: HQ.site.href,
    },
    social: [{ platform: "instagram", url: HQ.instagram.href, label: HQ.instagram.label }],
  };
}

export async function getSiteSettings(locale: string): Promise<PublicSettings> {
  try {
    const res = await fetch(`${API}/settings/public?locale=${locale}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const body = (await res.json()) as { success: boolean; data: PublicSettings };
    if (!body.success) throw new Error("gagal");

    /* Judul yang kosong DIJATUHKAN KE CADANGAN. Halaman tanpa `<title>` jauh
       lebih merusak daripada halaman yang memakai judul lama, dan baris kosong
       di basis data adalah keadaan yang mungkin terjadi. */
    const data = body.data;
    if (!data.seo.title.trim()) return { ...data, seo: { ...data.seo, ...fallback().seo } };
    return data;
  } catch (error) {
    console.warn(
      "[settings] gagal membaca setelan dari API, memakai konstanta cadangan:",
      error instanceof Error ? error.message : error,
    );
    return fallback();
  }
}
