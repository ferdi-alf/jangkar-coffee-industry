/**
 * Konfigurasi dua bahasa.
 *
 * Aturan produk dari PROJECT-SPEC: URL publik SELALU berprefiks locale, dan
 * panel admin TIDAK PERNAH. Locale awal diambil dari bahasa peramban pengunjung.
 */
export const LOCALES = ["id", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "id";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * Ditampilkan di pemilih bahasa. Benderanya aset gambar, bukan emoji.
 *
 * EN memakai bendera AMERIKA SERIKAT, bukan Britania. Ini keputusan pemilik
 * proyek, dan memang lazim untuk pasar Indonesia yang membaca bendera itu
 * sebagai penanda bahasa Inggris pada umumnya.
 *
 * Kedua SVG-nya disederhanakan dengan sengaja. Pada 24x16 piksel lima puluh
 * bintang hanya jadi bubur abu-abu, jadi bintangnya diringkas ke medan 23 titik
 * yang masih terbaca sebagai canton.
 */
export const LOCALE_META: Record<Locale, { label: string; name: string; flag: string }> = {
  id: { label: "ID", name: "Bahasa Indonesia", flag: "/flags/id.svg" },
  en: { label: "EN", name: "English", flag: "/flags/us.svg" },
};
