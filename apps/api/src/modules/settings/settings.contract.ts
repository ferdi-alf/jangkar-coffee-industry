/**
 * Setelan situs: SEO, kontak, dan tautan sosial.
 *
 * Ketiganya satu modul karena ketiganya menjawab pertanyaan yang sama, "seperti
 * apa situs ini memperkenalkan dirinya", dan karena situs publik membutuhkan
 * ketiganya SEKALIGUS pada satu titik: generateMetadata dan footer dirender di
 * permintaan yang sama. Memecahnya jadi tiga modul berarti tiga panggilan HTTP
 * saat build untuk data yang totalnya tidak sampai dua kilobyte.
 */

/** Daftar platform DIKUNCI, sama persis dengan CHECK di migrasi. */
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

export interface SeoTranslation {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string | null;
  ogDescription: string | null;
}

export interface SeoSettings {
  siteUrl: string | null;
  organizationName: string | null;
  ogImageUrl: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  twitterHandle: string | null;
  themeColor: string;
  robotsIndex: boolean;
  translations: Record<"id" | "en", SeoTranslation>;
}

export interface ContactSettings {
  phone: string | null;
  phoneHref: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  mapsQuery: string | null;
  siteLabel: string | null;
  siteUrl: string | null;
}

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  url: string;
  label: string | null;
  sortOrder: number;
  isActive: boolean;
}

/**
 * Bentuk yang dibaca situs publik. Sudah diratakan ke satu bahasa, jadi
 * halaman tidak perlu memilih locale sendiri, dan hanya memuat tautan sosial
 * yang aktif, jadi menonaktifkan satu tautan di panel cukup untuk melenyapkannya
 * dari footer tanpa menyentuh kode.
 */
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
  contact: ContactSettings;
  social: { platform: SocialPlatform; url: string; label: string | null }[];
}
