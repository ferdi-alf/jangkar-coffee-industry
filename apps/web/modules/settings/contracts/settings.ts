/** Sepadan dengan apps/api/src/modules/settings/settings.contract.ts. */
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

/** Nama yang terbaca manusia, dipakai label form dan teks pembaca layar. */
export const SOCIAL_LABEL: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  x: "X",
  youtube: "YouTube",
  threads: "Threads",
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
};

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

/** Kode galat zod dari server, diterjemahkan di sini. */
export const SETTINGS_ERROR: Record<string, string> = {
  "title.required": "Judul wajib diisi.",
  "title.tooLong": "Judul terlalu panjang, maksimum 160 karakter.",
  "description.required": "Deskripsi wajib diisi.",
  "description.tooLong": "Deskripsi terlalu panjang, maksimum 320 karakter.",
  "keywords.tooLong": "Kata kunci terlalu panjang.",
  "ogTitle.tooLong": "Judul berbagi terlalu panjang.",
  "ogDescription.tooLong": "Deskripsi berbagi terlalu panjang.",
  "url.invalid": "Tautan tidak valid.",
  "url.insecure": "Tautan harus diawali https://",
  "url.tooLong": "Tautan terlalu panjang.",
  "handle.invalid": "Handle hanya huruf, angka, dan garis bawah, tanpa tanda @.",
  "color.invalid": "Warna harus berbentuk #RRGGBB.",
  "phoneHref.invalid": "Format tautan telepon harus seperti tel:+628123456789.",
  "email.invalid": "Alamat surel tidak valid.",
  "label.tooLong": "Label terlalu panjang.",
};
