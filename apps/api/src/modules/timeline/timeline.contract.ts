export type TimelineStatus = "draft" | "published";

export interface TimelineTranslation {
  title: string;
  subtitle: string | null;
  description: string | null;
}

export interface TimelineEntry {
  id: string;
  year: number;
  /** null berarti rentangnya masih berjalan, kata penutupnya dari kamus situs. */
  yearEnd: number | null;
  sortOrder: number;
  status: TimelineStatus;
  /** Sudah diratakan ke satu bahasa untuk situs publik. */
  title: string;
  subtitle: string | null;
  description: string | null;
  /** Hanya ikut pada detail dan daftar panel, dipakai form dua bahasa. */
  translations?: Record<"id" | "en", TimelineTranslation>;
}
