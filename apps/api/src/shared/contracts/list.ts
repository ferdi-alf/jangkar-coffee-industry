/**
 * Kontrak daftar, dipakai SETIAP endpoint yang mengembalikan banyak baris.
 *
 * Query standarnya dikunci PROJECT-SPEC:
 *   ?page=&perPage=&q=&sort=&order=&locale=&fields=
 *
 * `fields` bukan hiasan. Aturan pemilik proyek: saat drawer detail terbuka,
 * data yang sudah ada di cache TanStack tidak diambil ulang, hanya sisa medan
 * yang belum dimiliki. Supaya penghematan itu terjadi SUNGGUHAN di basis data
 * dan bukan cuma di klien, repository menerjemahkan daftar ini jadi daftar
 * kolom `select` di Supabase.
 */
export interface ListMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ListQuery {
  page: number;
  perPage: number;
  q: string | null;
  sort: string | null;
  order: "asc" | "desc";
  locale: "id" | "en";
  fields: string[] | null;
}

export const LOCALES = ["id", "en"] as const;
export type Locale = (typeof LOCALES)[number];
