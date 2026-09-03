export type OutletStatus = "draft" | "published" | "archived";

export interface OutletItem {
  id: string;
  slug: string;
  name: string;
  label: string;
  address: string;
  phone: string | null;
  phoneHref: string | null;
  whatsapp: string | null;
  mapsQuery: string;
  lat: number | null;
  lng: number | null;
  /**
   * Penanda bahwa koordinatnya masih perkiraan.
   *
   * Ini bukan metadata iseng. Selama true, tombol navigasi di situs memakai
   * `mapsQuery` berupa alamat teks yang terverifikasi, BUKAN lat dan lng ini,
   * supaya pengunjung tetap sampai ke tempat yang benar meski pinnya meleset.
   */
  coordsApproximate: boolean;
  isHeadquarters: boolean;
  hours: string | null;
  summary: string | null;
  sortOrder: number;
  status: OutletStatus;
  translations?: Record<"id" | "en", { label: string; hours: string | null; summary: string | null }>;
}
